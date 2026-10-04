using System.Text;
using FinancialManager.Api.Middlewares;
using Microsoft.AspNetCore.Http;
using FinancialManager.Application.Interfaces;
using FinancialManager.Application.Services;
using FinancialManager.Infrastructure.Data;
using FinancialManager.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using System.Threading.RateLimiting;
using FinancialManager.Application.Common;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

namespace FinancialManager.Api
{
    /// <summary>
    /// Service registration and middleware pipeline of the API, shared by the web server (Program.cs)
    /// and the Windows desktop app (FinancialManager.Desktop), which hosts the API in-process.
    /// </summary>
    public static class ApiHost
    {
        public static void ConfigureServices(WebApplicationBuilder builder)
        {
            // Add Services to Container
            // Explicit application part: when hosted by the desktop app the entry assembly is not the API
            builder.Services.AddControllers().AddApplicationPart(typeof(ApiHost).Assembly);
            builder.Services.AddEndpointsApiExplorer();

            // Swagger Configuration with JWT Bearer Support
            builder.Services.AddSwaggerGen(options =>
            {
                options.SwaggerDoc("v1", new OpenApiInfo
                {
                    Title = "Financial Manager PFM API",
                    Version = "v1",
                    Description = "API Back-end cho hệ thống Quản lý Tài chính Cá nhân (PFM - Firefly III 47-Table Schema)"
                });

                options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    Type = SecuritySchemeType.Http,
                    Scheme = "Bearer",
                    BearerFormat = "JWT",
                    In = ParameterLocation.Header,
                    Description = "Nhập JWT Bearer Token theo định dạng: Bearer {your_token}"
                });

                options.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        new string[] {}
                    }
                });
            });

            // Database Setup (PostgreSQL; the in-memory database is only for experiments and must be enabled explicitly)
            var useInMemory = builder.Configuration.GetValue<bool>("UseInMemoryDatabase", false);
            var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

            if (!useInMemory)
            {
                if (string.IsNullOrWhiteSpace(connectionString))
                    throw new InvalidOperationException("Thiếu ConnectionStrings:DefaultConnection (đặt biến môi trường ConnectionStrings__DefaultConnection).");
                builder.Services.AddDbContext<ApplicationDbContext>(options =>
                    options.UseNpgsql(connectionString));
            }
            else
            {
                builder.Services.AddDbContext<ApplicationDbContext>(options =>
                    options.UseInMemoryDatabase("FinancialManagerDb")
                           .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning)));
            }

            builder.Services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());

            // Register Infrastructure Services
            builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
            builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();

            // Register Application Business Services for Modules 01 - 09
            builder.Services.AddScoped<IAuthService, AuthService>();
            builder.Services.AddScoped<ICurrencyService, CurrencyService>();
            builder.Services.AddScoped<IAccountService, AccountService>();
            builder.Services.AddScoped<ITransactionService, TransactionService>();
            builder.Services.AddScoped<ICategoryTagService, CategoryTagService>();
            builder.Services.AddScoped<IBudgetService, BudgetService>();
            builder.Services.AddScoped<IBillRecurrenceService, BillRecurrenceService>();
            builder.Services.AddScoped<IPiggyBankService, PiggyBankService>();
            builder.Services.AddScoped<IStatisticsService, StatisticsService>();

            // JWT Authentication Setup: the signing key must come from configuration (env JwtSettings__Secret), never from source code
            var jwtSecret = builder.Configuration["JwtSettings:Secret"];
            if (string.IsNullOrWhiteSpace(jwtSecret) || jwtSecret.Length < 32)
                throw new InvalidOperationException("JwtSettings:Secret phải được cấu hình và dài ít nhất 32 ký tự (đặt biến môi trường JwtSettings__Secret).");
            var jwtIssuer = builder.Configuration["JwtSettings:Issuer"] ?? "FinancialManagerApi";
            var jwtAudience = builder.Configuration["JwtSettings:Audience"] ?? "FinancialManagerClient";

            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtIssuer,
                    ValidAudience = jwtAudience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
                };
            });

            builder.Services.AddAuthorization();

            // CORS: only the configured front-end origins (Cors__AllowedOrigins__0=https://app.example.com).
            // In development any localhost port is accepted so vite can pick a free one.
            var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("Frontend", policy =>
                {
                    if (builder.Environment.IsDevelopment())
                        policy.SetIsOriginAllowed(origin => allowedOrigins.Contains(origin) || new Uri(origin).IsLoopback);
                    else
                        policy.WithOrigins(allowedOrigins);
                    policy.AllowAnyHeader().AllowAnyMethod();
                });
            });

            // Brute-force protection for login / register / refresh: N requests per minute per client IP
            var authPermitPerMinute = builder.Configuration.GetValue("RateLimiting:AuthPermitPerMinute", 10);
            builder.Services.AddRateLimiter(options =>
            {
                options.AddPolicy("auth", context => RateLimitPartition.GetFixedWindowLimiter(
                    context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    _ => new FixedWindowRateLimiterOptions { PermitLimit = authPermitPerMinute, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
                options.OnRejected = async (context, token) =>
                {
                    context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                    context.HttpContext.Response.Headers.RetryAfter = "60";
                    await context.HttpContext.Response.WriteAsJsonAsync(
                        ApiResponse<object>.Fail(429, "Bạn thao tác quá nhiều lần. Vui lòng thử lại sau 1 phút.", null), token);
                };
            });

            // Behind a reverse proxy (nginx in docker-compose) the client IP comes from X-Forwarded-For
            builder.Services.Configure<ForwardedHeadersOptions>(options =>
            {
                options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
                options.KnownNetworks.Clear();
                options.KnownProxies.Clear();
            });
        }

        public static void ConfigurePipeline(WebApplication app)
        {
            app.UseForwardedHeaders();

            // CORS must be first - before all other middleware
            app.UseCors("Frontend");

            // Configure Middleware Pipeline
            app.UseMiddleware<GlobalExceptionMiddleware>();

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI(c =>
                {
                    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Financial Manager API v1");
                });
            }

            app.UseRateLimiter();
            app.UseAuthentication();
            app.UseAuthorization();
            app.MapControllers();
            app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

            // Apply database migrations on startup
            using (var scope = app.Services.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                if (dbContext.Database.IsRelational())
                {
                    // Databases created before migrations were introduced (via EnsureCreated) already have the schema of the
                    // initial migration: record it as applied instead of trying to create the tables again
                    // The only interpolated value is a migration id compiled into this assembly, not user input
#pragma warning disable EF1002
                    var initialMigration = dbContext.Database.GetMigrations().First();
                    // Migrate() creates the database itself when it does not exist yet
                    if (dbContext.Database.CanConnect())
                        dbContext.Database.ExecuteSqlRaw($@"
            DO $$
            BEGIN
                IF to_regclass('""Users""') IS NOT NULL AND to_regclass('""__EFMigrationsHistory""') IS NULL THEN
                    ALTER TABLE ""Accounts"" ADD COLUMN IF NOT EXISTS ""DeletedAt"" timestamp with time zone NULL;
                    CREATE TABLE ""__EFMigrationsHistory"" (""MigrationId"" varchar(150) PRIMARY KEY, ""ProductVersion"" varchar(32) NOT NULL);
                    INSERT INTO ""__EFMigrationsHistory"" VALUES ('{initialMigration}', '8.0.8');
                END IF;

                CREATE TABLE IF NOT EXISTS ""SyncHistories"" (
                    ""Id"" uuid NOT NULL PRIMARY KEY,
                    ""CreatedAt"" timestamp with time zone NOT NULL,
                    ""UpdatedAt"" timestamp with time zone NULL,
                    ""UserId"" uuid NOT NULL,
                    ""DeviceId"" text NOT NULL,
                    ""DeviceName"" text NOT NULL,
                    ""SyncTime"" timestamp with time zone NOT NULL,
                    ""UploadedCount"" integer NOT NULL,
                    ""DownloadedCount"" integer NOT NULL,
                    ""Status"" text NOT NULL,
                    ""ErrorMessage"" text NULL,
                    ""DurationMs"" bigint NOT NULL
                );
            END $$;");
#pragma warning restore EF1002
                    dbContext.Database.Migrate();
                }
                else
                {
                    dbContext.Database.EnsureCreated();
                }
            }
        }
    }
}

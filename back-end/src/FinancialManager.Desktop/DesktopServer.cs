using System.Net;
using System.Net.Sockets;
using FinancialManager.Api;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;

namespace FinancialManager.Desktop
{
    /// <summary>
    /// Runs the API + the built front-end (wwwroot) inside the desktop process on 127.0.0.1.
    /// Until a working PostgreSQL connection is saved, a small setup page is served instead.
    /// </summary>
    public class DesktopServer : IAsyncDisposable
    {
        // Fixed port so the front-end keeps the same origin between launches (login and theme live in localStorage)
        private const int PreferredPort = 52866;

        private readonly DesktopSettings _settings;
        private readonly string[] _args;
        private WebApplication? _main;
        private WebApplication? _setup;
        private readonly TaskCompletionSource _stopping = new(TaskCreationOptions.RunContinuationsAsynchronously);

        /// <summary>Completes when a host is asked to stop (Ctrl+C / SIGTERM in headless mode).</summary>
        public Task Stopping => _stopping.Task;

        public DesktopServer(DesktopSettings settings, string[] args)
        {
            _settings = settings;
            _args = args;
        }

        /// <summary>URL the window should open: the app itself, or the setup page when the database is not reachable.</summary>
        public async Task<string> StartAsync()
        {
            if (_settings.IsConfigured && await _settings.TestConnectionAsync() is null)
            {
                try
                {
                    return await StartMainAsync();
                }
                catch (Exception ex)
                {
                    return await StartSetupAsync(StartupError(ex));
                }
            }
            return await StartSetupAsync(_settings.IsConfigured ? await _settings.TestConnectionAsync() : null);
        }

        private async Task<string> StartMainAsync()
        {
            var baseDir = AppContext.BaseDirectory;
            var builder = WebApplication.CreateBuilder(new WebApplicationOptions
            {
                Args = _args,
                ContentRootPath = baseDir,
                WebRootPath = Path.Combine(baseDir, "wwwroot"),
                EnvironmentName = Environments.Production,
            });
            builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["UseInMemoryDatabase"] = "false",
                ["ConnectionStrings:DefaultConnection"] = _settings.ConnectionString,
                ["JwtSettings:Secret"] = _settings.JwtSecret,
                ["JwtSettings:ExpiresInMinutes"] = "720",
                ["RateLimiting:AuthPermitPerMinute"] = "30",
            });
            builder.WebHost.UseUrls($"http://127.0.0.1:{PickPort()}");
            ConfigureLogging(builder);

            ApiHost.ConfigureServices(builder);
            var app = builder.Build();
            app.UseDefaultFiles();
            app.UseStaticFiles();
            ApiHost.ConfigurePipeline(app); // also applies database migrations
            // SPA routes fall back to index.html (paths without a file extension); unknown /api/* paths stay 404
            app.Map("/api/{**rest}", () => Results.NotFound());
            app.MapFallbackToFile("index.html");

            app.Lifetime.ApplicationStopping.Register(() => _stopping.TrySetResult());
            await app.StartAsync();
            _main = app;
            return ListeningUrl(app);
        }

        private async Task<string> StartSetupAsync(string? error)
        {
            var builder = WebApplication.CreateBuilder(new WebApplicationOptions { Args = _args, EnvironmentName = Environments.Production });
            builder.WebHost.UseUrls("http://127.0.0.1:0");
            ConfigureLogging(builder);
            var app = builder.Build();

            app.MapGet("/", () => Results.Content(SetupPage.Render(_settings, error), "text/html; charset=utf-8"));
            app.MapPost("/setup", async (SetupRequest req) =>
            {
                if (string.IsNullOrWhiteSpace(req.Host) || string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Database))
                    return Results.BadRequest(new { message = "Vui lòng nhập đủ máy chủ, tên database và tên đăng nhập." });
                if (req.Port is < 1 or > 65535)
                    return Results.BadRequest(new { message = "Cổng không hợp lệ." });

                _settings.Host = req.Host.Trim();
                _settings.Port = req.Port;
                _settings.Database = req.Database.Trim();
                _settings.Username = req.Username.Trim();
                _settings.Password = req.Password ?? string.Empty;

                var connError = await _settings.TestConnectionAsync();
                if (connError is not null) return Results.BadRequest(new { message = connError });

                _settings.Save();
                try
                {
                    if (_main is null) await StartMainAsync();
                    return Results.Ok(new { url = ListeningUrl(_main!) });
                }
                catch (Exception ex)
                {
                    return Results.BadRequest(new { message = StartupError(ex) });
                }
            });

            app.Lifetime.ApplicationStopping.Register(() => _stopping.TrySetResult());
            await app.StartAsync();
            _setup = app;
            return ListeningUrl(app);
        }

        private static string StartupError(Exception ex)
        {
            Program.WriteCrashLog(ex);
            return $"Không khởi động được ứng dụng: {ex.GetBaseException().Message}";
        }

        private static void ConfigureLogging(WebApplicationBuilder builder)
        {
            builder.Logging.ClearProviders();
            builder.Logging.AddConsole();
            builder.Logging.SetMinimumLevel(LogLevel.Warning);
        }

        private static int PickPort()
        {
            try
            {
                using var probe = new TcpListener(IPAddress.Loopback, PreferredPort);
                probe.Start();
                return PreferredPort;
            }
            catch (SocketException)
            {
                return 0; // taken by something else: let the OS choose (the user will have to log in again)
            }
        }

        private static string ListeningUrl(WebApplication app) =>
            app.Services.GetRequiredService<IServer>().Features.Get<IServerAddressesFeature>()!.Addresses.First();

        public async ValueTask DisposeAsync()
        {
            if (_main is not null) await _main.DisposeAsync();
            if (_setup is not null) await _setup.DisposeAsync();
        }

        private record SetupRequest(string Host, int Port, string Database, string Username, string? Password);
    }
}

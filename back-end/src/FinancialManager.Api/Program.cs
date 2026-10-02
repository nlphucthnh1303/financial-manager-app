using FinancialManager.Api;

var builder = WebApplication.CreateBuilder(args);
ApiHost.ConfigureServices(builder);

var app = builder.Build();
ApiHost.ConfigurePipeline(app);

app.Run();

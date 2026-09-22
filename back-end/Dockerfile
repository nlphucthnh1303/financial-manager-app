# Build: docker build -t financial-manager-api back-end
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY nuget.config FinancialManager.sln ./
COPY src/FinancialManager.Domain/*.csproj src/FinancialManager.Domain/
COPY src/FinancialManager.Application/*.csproj src/FinancialManager.Application/
COPY src/FinancialManager.Infrastructure/*.csproj src/FinancialManager.Infrastructure/
COPY src/FinancialManager.Api/*.csproj src/FinancialManager.Api/
RUN dotnet restore src/FinancialManager.Api/FinancialManager.Api.csproj
COPY src/ src/
RUN dotnet publish src/FinancialManager.Api/FinancialManager.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080
USER app
ENTRYPOINT ["dotnet", "FinancialManager.Api.dll"]

# Đóng gói Financial Manager trên Windows (PowerShell):  .\scripts\package-windows.ps1
# Yêu cầu: .NET SDK 8, Node.js
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Project = "$Root\back-end\src\FinancialManager.Desktop\FinancialManager.Desktop.csproj"
$Version = ([xml](Get-Content $Project)).Project.PropertyGroup.Version | Where-Object { $_ } | Select-Object -First 1
$Name = "FinancialManager-$Version-win-x64"
$Out = "$Root\release\$Name"

Write-Host "== Build front-end"
Push-Location "$Root\front-end"; $env:VITE_API_URL = ""; npm run build; Pop-Location

Write-Host "== Publish desktop app"
Remove-Item -Recurse -Force $Out, "$Root\release\$Name.zip" -ErrorAction SilentlyContinue
dotnet publish $Project -c Release -r win-x64 --self-contained true `
  -p:PublishSingleFile=true -p:EnableCompressionInSingleFile=true -p:DebugType=none -o $Out -nologo -v q

Copy-Item -Recurse "$Root\front-end\dist" "$Out\wwwroot"
Copy-Item "$Root\scripts\windows\HUONG-DAN.txt" $Out
Remove-Item "$Out\appsettings.Development.json" -ErrorAction SilentlyContinue
Remove-Item "$Out\web.config", "$Out\aspnetcorev2_inprocess.dll", "$Out\FinancialManager.Api.runtimeconfig.json", "$Out\*.staticwebassets.endpoints.json" -ErrorAction SilentlyContinue

Compress-Archive -Path $Out -DestinationPath "$Root\release\$Name.zip"
Write-Host "Xong: release\$Name.zip"

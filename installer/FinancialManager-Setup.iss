; =====================================================================
; FINANCIAL MANAGER - INNO SETUP SCRIPT FOR WINDOWS AUTO-UPGRADE (v2.0.0)
; =====================================================================
#define MyAppName "Financial Manager"
#define MyAppVersion "2.0.0"
#define MyAppPublisher "Financial Manager Team"
#define MyAppExeName "FinancialManager.exe"
#define MyAppId "{{8B7B2E4A-4C2E-4F29-943C-68936DA5A5D1}}"

[Setup]
; AppId ensures Inno Setup detects previous v1.0 and upgrades in-place automatically
AppId={#MyAppId}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
OutputDir=..\dist
OutputBaseFilename=FinancialManager-Setup-v2.0.0
SetupIconFile=..\back-end\src\FinancialManager.Desktop\app.ico
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern

; Seamless In-Place Auto-Update Settings
DisableDirPage=auto
DisableProgramGroupPage=auto
CloseApplications=yes
CloseApplicationsFilter={#MyAppExeName}
RestartApplications=no
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog

[Languages]
Name: "vietnamese"; MessagesFile: "compiler:Languages\Vietnamese.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; Copy all published self-contained files of Version 2.0.0
Source: "..\dist\windows-v2.0.0\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\app.ico"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\app.ico"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[Code]
// Helper function to detect and log auto-upgrade state
function InitializeSetup(): Boolean;
begin
  Result := True;
end;

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

# This installs/uninstalls only on a disposable CI runner, never a user's PC.
if ($env:GITHUB_ACTIONS -ne 'true' -or $env:RUNNER_OS -ne 'Windows') {
    throw 'Installer lifecycle testing requires a disposable Windows GitHub Actions runner.'
}

$project = Split-Path -Parent $PSScriptRoot
$package = Get-Content (Join-Path $project 'package.json') -Raw | ConvertFrom-Json
$setup = Join-Path $project "release\BsonLite-Console-Setup-$($package.version)-Windows-x64.exe"
$installDir = Join-Path $env:RUNNER_TEMP 'BsonLite Console install smoke'
$exe = Join-Path $installDir 'BsonLite Console.exe'
$desktopLink = Join-Path ([Environment]::GetFolderPath('DesktopDirectory')) 'BsonLite Console.lnk'
$startMenuLink = Join-Path ([Environment]::GetFolderPath('Programs')) 'BsonLite Console.lnk'
$uninstallRoot = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall'
$dataDir = Join-Path $env:APPDATA 'bsonlite-cli'
$sentinel = Join-Path $dataDir 'installer-smoke-keep.txt'

function Get-ConsoleRegistration {
    @(Get-ChildItem $uninstallRoot -ErrorAction SilentlyContinue | ForEach-Object {
        Get-ItemProperty $_.PSPath
    } | Where-Object { $_.PSObject.Properties['DisplayName'] -and $_.DisplayName -eq 'BsonLite Console' })
}

function Run-Setup {
    $process = Start-Process -FilePath $setup -ArgumentList "/S /D=$installDir" -PassThru
    if (-not $process.WaitForExit(180000)) { $process.Kill(); throw 'Installer timed out.' }
    if ($process.ExitCode -ne 0) { throw "Installer exited with $($process.ExitCode)." }
}

function Assert-Shortcuts {
    $shell = New-Object -ComObject WScript.Shell
    foreach ($link in @($desktopLink, $startMenuLink)) {
        if (-not (Test-Path $link)) { throw "Missing shortcut: $link" }
        $shortcut = $shell.CreateShortcut($link)
        if ($shortcut.TargetPath -ne $exe) { throw "Wrong shortcut target: $link" }
        if ($shortcut.IconLocation -notlike "$exe,*") { throw "Wrong shortcut icon: $link" }
    }
}

if (-not (Test-Path $setup)) { throw 'Build the installer first.' }
if (@(Get-ConsoleRegistration).Count -or (Test-Path $desktopLink) -or (Test-Path $startMenuLink) -or (Test-Path $sentinel)) {
    throw 'The disposable runner must not contain an existing Console installation or smoke marker.'
}
New-Item -ItemType Directory -Force -Path $dataDir | Out-Null
Set-Content -Path $sentinel -Value 'Keep user-owned app data on reinstall and uninstall.'

try {
    Run-Setup
    if (-not (Test-Path $exe)) { throw 'The installed application executable is missing.' }
    $info = [Diagnostics.FileVersionInfo]::GetVersionInfo($exe)
    if ($info.ProductName -ne 'BsonLite Console') { throw 'Executable product branding is incorrect.' }
    Assert-Shortcuts
    $entries = @(Get-ConsoleRegistration)
    if ($entries.Count -ne 1 -or $entries[0].DisplayVersion -ne $package.version) { throw 'Control Panel uninstall registration is incorrect.' }
    $iconPath = $entries[0].DisplayIcon -replace ',\d+$', ''
    if (-not (Test-Path $iconPath)) { throw 'The Control Panel icon is missing.' }
    if ($entries[0].UninstallString -notmatch '^"([^"]+)"') { throw 'The uninstaller path must be quoted.' }
    $uninstaller = $Matches[1]
    if (-not (Test-Path $uninstaller)) { throw 'The registered uninstaller is missing.' }

    # Reinstall must repair a removed desktop shortcut and keep app data.
    Remove-Item $desktopLink
    Run-Setup
    Assert-Shortcuts
    if (-not (Test-Path $sentinel)) { throw 'Reinstall removed user data.' }

    $env:BSONLITE_TEST_APP = $exe
    & node (Join-Path $PSScriptRoot 'test-ui.cjs')
    if ($LASTEXITCODE -ne 0) { throw 'Installed Electron UI checks failed.' }

    $process = Start-Process -FilePath $uninstaller -ArgumentList '/S /currentuser' -PassThru
    if (-not $process.WaitForExit(120000)) { $process.Kill(); throw 'Uninstall timed out.' }
    if ($process.ExitCode -ne 0) { throw "Uninstaller exited with $($process.ExitCode)." }
    $deadline = [DateTime]::UtcNow.AddSeconds(30)
    while (((Test-Path $exe) -or @(Get-ConsoleRegistration).Count) -and [DateTime]::UtcNow -lt $deadline) { Start-Sleep -Milliseconds 200 }
    if ((Test-Path $exe) -or @(Get-ConsoleRegistration).Count) { throw 'Uninstall left the application or Control Panel entry behind.' }
    if ((Test-Path $desktopLink) -or (Test-Path $startMenuLink)) { throw 'Uninstall left a shortcut behind.' }
    if (-not (Test-Path $sentinel)) { throw 'Uninstall removed user data.' }
    Write-Host 'Installer passed: single offline setup EXE, product branding, desktop/Start Menu icons, Control Panel registration, reinstall shortcut repair, installed GUI workflow, uninstall cleanup and preserved app data.'
}
finally {
    Remove-Item Env:BSONLITE_TEST_APP -ErrorAction SilentlyContinue
    Remove-Item $sentinel -ErrorAction SilentlyContinue
}

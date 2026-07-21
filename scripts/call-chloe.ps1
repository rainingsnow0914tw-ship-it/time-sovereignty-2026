$ErrorActionPreference = "Stop"
$globalHook = Join-Path $env:USERPROFILE ".codex\chloe-notification-hook.ps1"

if (-not (Test-Path -LiteralPath $globalHook)) {
    [System.Media.SystemSounds]::Exclamation.Play()
    exit 0
}

& powershell -NoProfile -ExecutionPolicy Bypass -File $globalHook -Event action

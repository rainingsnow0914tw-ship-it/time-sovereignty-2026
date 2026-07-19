$ErrorActionPreference = "Stop"
$tone = "C:\Users\soulf\Desktop\阿寶遊樂園\cheng-notification-tones\03-cheng-mischief-pop.wav"

if (-not (Test-Path -LiteralPath $tone)) {
    [System.Media.SystemSounds]::Exclamation.Play()
    Start-Sleep -Milliseconds 450
    [System.Media.SystemSounds]::Exclamation.Play()
    exit 0
}

$player = [System.Media.SoundPlayer]::new($tone)
$player.Load()
$player.PlaySync()
Start-Sleep -Milliseconds 300
$player.PlaySync()

$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$PSScriptRoot\start-bot.bat`""
$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName "MissingPhunksBot" -Action $action -Trigger $trigger -Settings $settings -User "SYSTEM" -RunLevel Highest 
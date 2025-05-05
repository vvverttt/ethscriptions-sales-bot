$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\MissingPhunksBot.lnk")
$Shortcut.TargetPath = "$PSScriptRoot\startup.bat"
$Shortcut.WorkingDirectory = "$PSScriptRoot"
$Shortcut.Description = "Missing Phunks Bot"
$Shortcut.Save() 
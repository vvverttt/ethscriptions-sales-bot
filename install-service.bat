@echo off
echo Installing Missing Phunks Bot Service...

REM Stop and delete existing service if it exists
sc stop MissingPhunksBot
sc delete MissingPhunksBot

REM Wait a moment for the service to be fully deleted
timeout /t 5 /nobreak

REM Create the service using a simpler approach
sc create MissingPhunksBot binPath= "cmd.exe /c cd /d %~dp0 && npm run start" start= auto
sc description MissingPhunksBot "Automatically tweets Missing Phunks sales"
sc config MissingPhunksBot obj= "LocalSystem"
sc config MissingPhunksBot start= auto

REM Start the service
sc start MissingPhunksBot

echo Service installed and started!
echo Check services.msc to verify it's running
pause 
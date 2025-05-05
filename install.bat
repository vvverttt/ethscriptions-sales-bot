@echo off
echo Installing Missing Phunks Bot Service...

REM Stop and delete existing service if it exists
sc stop MissingPhunksBot
sc delete MissingPhunksBot

REM Create the service with full path to node
set "NODE_PATH=%ProgramFiles%\nodejs\node.exe"
set "BOT_PATH=%~dp0"

REM Create the service using a wrapper script
echo @echo off > "%BOT_PATH%service-wrapper.bat"
echo cd /d "%BOT_PATH%" >> "%BOT_PATH%service-wrapper.bat"
echo "%NODE_PATH%" "%BOT_PATH%node_modules\@nestjs\cli\bin\nest.js" start >> "%BOT_PATH%service-wrapper.bat"

REM Create the service
sc create MissingPhunksBot binPath= "\"%BOT_PATH%service-wrapper.bat\"" start= auto
sc description MissingPhunksBot "Automatically tweets Missing Phunks sales"
sc config MissingPhunksBot obj= "LocalSystem"
sc config MissingPhunksBot start= auto
sc config MissingPhunksBot type= own
sc config MissingPhunksBot error= normal
sc config MissingPhunksBot depend= Tcpip

REM Start the service
sc start MissingPhunksBot

echo Service installed and started!
echo Check services.msc to verify it's running
pause 
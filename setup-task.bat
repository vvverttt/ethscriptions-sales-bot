@echo off
echo Setting up Missing Phunks Bot Scheduled Task...

REM Create a batch file that will run the bot
echo @echo off > "%~dp0run-bot-task.bat"
echo cd /d "%~dp0" >> "%~dp0run-bot-task.bat"
echo npm run start >> "%~dp0run-bot-task.bat"

REM Create the scheduled task
schtasks /create /tn "MissingPhunksBot" /tr "\"%~dp0run-bot-task.bat\"" /sc onstart /ru SYSTEM /f

echo Task created successfully!
echo The bot will now start automatically when Windows starts.
pause 
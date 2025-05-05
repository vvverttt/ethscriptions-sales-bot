@echo off
echo Starting Missing Phunks Bot...
cd /d %~dp0
start /min cmd /c "npm run start > bot.log 2>&1"
echo Bot started in background. Check bot.log for details. 
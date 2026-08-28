@echo off
cd /d "%~dp0"
echo 正在启动Work Time Cus本地服务...
start "WorkHours Server" /min python -m http.server 8000
timeout /t 2 >nul
start "" "http://localhost:8000/"
echo 已打开浏览器。如需停止服务，关闭最小化的 "WorkHours Server" 窗口即可。
echo 本窗口可以关闭。
timeout /t 4 >nul

@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo   智慧城市 - 移动应用开发练习平台
echo   ------------------------------------
echo   启动后请访问: http://localhost:10091
echo   关闭此窗口即停止服务
echo.
start "" http://localhost:10091/
node server.mjs
pause

@echo off
setlocal

cd /d "%~dp0"

for /f "usebackq delims=" %%v in (`type VERSION`) do set VERSION=%%v

echo Building tech-trend-pulse version %VERSION%...

pyinstaller --noconfirm ^
    --name tech-trend-pulse-%VERSION% ^
    --add-data "data;data" ^
    --add-data "static;static" ^
    --distpath=dist ^
    --workpath=build ^
    app.py

if %ERRORLEVEL% EQU 0 (
    echo Build succeeded: dist/tech-trend-pulse-%VERSION%/
) else (
    echo Build FAILED with error %ERRORLEVEL%
    exit /b %ERRORLEVEL%
)

endlocal
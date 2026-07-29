@echo off
setlocal EnableExtensions EnableDelayedExpansion

echo ============================================
echo  Tech Trend Pulse - Dependency Installer
echo ============================================
echo.

set STEP=0
set PASS=0
set FAIL=0

echo [Step 1] Checking Python on PATH...
set STEP=1
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo   [OK] Python found: !python!
    set /a PASS+=1
) else (
    echo   [FAIL] Python not found on PATH
    set /a FAIL+=1
)

echo.
echo [Step 2] Checking pip availability...
set STEP=2
python -m pip --version >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo   [OK] pip is available
    set /a PASS+=1
) else (
    echo   [FAIL] pip is not available
    set /a FAIL+=1
)

echo.
echo [Step 3] Installing requirements from requirements.txt...
set STEP=3
if exist requirements.txt (
    python -m pip install -r requirements.txt
    if %ERRORLEVEL% EQU 0 (
        echo   [OK] Requirements installed successfully
        set /a PASS+=1
    ) else (
        echo   [FAIL] Failed to install requirements
        set /a FAIL+=1
    )
) else (
    echo   [FAIL] requirements.txt not found
    set /a FAIL+=1
)

echo.
echo [Step 4] Checking PyInstaller...
set STEP=4
python -m PyInstaller --version >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo   [OK] PyInstaller is installed
    set /a PASS+=1
) else (
    echo   [INFO] PyInstaller not found, installing...
    python -m pip install pyinstaller
    if %ERRORLEVEL% EQU 0 (
        echo   [OK] PyInstaller installed successfully
        set /a PASS+=1
    ) else (
        echo   [FAIL] Failed to install PyInstaller
        set /a FAIL+=1
    )
)

echo.
echo ============================================
echo  Summary: !PASS! passed, !FAIL! failed
echo ============================================

if !FAIL! GTR 0 (
    echo Some steps failed. Review the output above.
    endlocal
    exit /b 1
)

echo All dependencies are ready.

endlocal
exit /b 0
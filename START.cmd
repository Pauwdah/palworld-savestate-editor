@echo off
setlocal enabledelayedexpansion


::console color variables
set "RED=[1;31m"
set "GREEN=[1;32m"
set "YELLOW=[1;33m"
set "RESET=[0m"

:: Check if convert.py exists
if not exist "./palworld_save_tools/convert.py" (
    echo convert.py is missing.
    pause
    exit /B 1
)

:: Check for Python installation
set PYTHON_FOUND=0
for %%A in (python3 python py) do (
    echo %YELLOW%Checking if Python is installed as %%A... %RESET%
    where %%A >nul 2>&1
    if !ERRORLEVEL! equ 0 (
        echo %GREEN%Found Python at %%A
        echo Python version:
        %%A --version
        set PYTHON_FOUND=1
        echo %RESET%
        goto CheckComplete
    )
)

:CheckComplete
if !PYTHON_FOUND! equ 0 (
    echo %RED%Python not found. Please install Python 3.9 or newer. %RESET%
    pause
    exit /B 1
)

:: Check for Node.js installation
echo %YELLOW%Checking if Node.js is installed... %RESET%
where node >nul 2>&1
if !ERRORLEVEL! equ 0 (
    echo %GREEN%Found Node.js
    echo Node.js version:
    node --version
    echo %RESET%
) else (
    echo %RED%Node.js not found. Please install Node.js. %RESET%
    pause
    exit /B 1
)

:: Define a function to check and install npm packages if necessary
call :checkAndInstallNpmPackages axios electron express node-windows vdf-parser
goto StartApplication

:checkAndInstallNpmPackages
for %%i in (%*) do (
    echo %YELLOW%Checking if %%i is installed... %RESET%
    npm list --depth=0 | findstr %%i >nul 2>&1
    if !ERRORLEVEL! equ 1 (
        echo %RED%Not installed but required: %%i %RESET%
        set /p "install_%%i=Do you want to install %%i? (y/n): "
        if /i "!install_%%i!" equ "y" (
            echo Installing %%i...
            npm install %%i
        ) else (
            echo %RED%%%i is required to run the application. Ending process.. %RESET%
            pause
            exit 
        )
    )
)
exit /B 0

:StartApplication
:: Start the application if both Python and convert.py are available
echo %GREEN%Starting application... %RESET%
start /min "Palworld Savestate Editor" cmd /c "npm start"
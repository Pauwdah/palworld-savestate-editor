@echo off
setlocal enabledelayedexpansion

:: Check if convert.py exists
if not exist "./palworld_save_tools/convert.py" (
    echo convert.py is missing.
    pause
    exit /B 1
)

:: Check for Python installation
set PYTHON_FOUND=0
for %%A in (python3 python py) do (
    echo Checking if Python is installed as %%A...
    where %%A >nul 2>&1
    if !ERRORLEVEL! equ 0 (
        echo Found Python at %%A
        echo Python version:
        %%A --version
        set PYTHON_FOUND=1
        goto CheckComplete
    )
)

:CheckComplete
if !PYTHON_FOUND! equ 0 (
    echo Python not found. Please install Python 3.9 or newer.
    pause
    exit /B 1
)

:: Start npm if both Python and convert.py are available
start /min "Palworld Savestate Editor" cmd /c "npm start"
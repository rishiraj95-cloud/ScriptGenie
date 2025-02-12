@echo off
echo Starting Scribe Test Generator Setup...

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed! Please install Python first.
    pause
    exit /b 1
)

REM Verify pip installation
python -m pip --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing pip...
    python -m ensurepip --default-pip
)

REM Create and activate virtual environment
if not exist backend\venv (
    echo Creating virtual environment...
    python -m venv backend\venv
)

echo Activating virtual environment...
call backend\venv\Scripts\activate.bat

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed! Please install Node.js first.
    pause
    exit /b 1
)

REM Create directories if they don't exist
if not exist backend\app\routers mkdir backend\app\routers
if not exist backend\app\utils mkdir backend\app\utils
if not exist backend\uploaded_videos mkdir backend\uploaded_videos
if not exist backend\frames mkdir backend\frames

REM Create __init__.py files to make directories Python packages
echo. > backend\app\__init__.py
echo. > backend\app\routers\__init__.py
echo. > backend\app\utils\__init__.py

REM Install or upgrade backend dependencies
echo Installing/Updating backend dependencies...
python -m pip install --upgrade pip
python -m pip install --upgrade fastapi "uvicorn[standard]" python-multipart opencv-python pytesseract pillow PyPDF2 pdf2image

REM Check if Poppler is installed (for PDF processing)
if not exist "C:\Program Files\poppler-0.68.0\bin" (
    echo WARNING: Poppler is not installed!
    echo Please download and install Poppler from: https://blog.alivate.com.au/poppler-windows/
    echo Extract it to C:\Program Files\poppler-0.68.0
    pause
)

REM Check if frontend directory exists, if not create it with create-react-app
if not exist frontend (
    echo Creating React frontend...
    call npx create-react-app frontend
    if %errorlevel% neq 0 (
        echo Failed to create React app. Please try again.
        pause
        exit /b 1
    )
) else (
    if not exist frontend\package.json (
        echo Frontend directory exists but no package.json found.
        echo Recreating React frontend...
        rd /s /q frontend
        call npx create-react-app frontend
        if %errorlevel% neq 0 (
            echo Failed to create React app. Please try again.
            pause
            exit /b 1
        )
    ) else (
        echo Frontend directory already exists.
    )
)

REM Install or update frontend dependencies
cd frontend
echo Installing/Updating frontend dependencies...
echo Cleaning npm cache...
call npm cache clean --force

echo Installing dependencies with --force flag...
call npm install --force --legacy-peer-deps

echo Installing web-vitals package...
call npm install web-vitals

if %errorlevel% neq 0 (
    echo Trying alternative installation method...
    call npm install --legacy-peer-deps
    if %errorlevel% neq 0 (
        echo Failed to install frontend dependencies. Please try again.
        cd ..
        pause
        exit /b 1
    )
)

REM Clear any existing build artifacts
echo Cleaning build artifacts...
if exist build rd /s /q build
if exist node_modules rd /s /q node_modules

echo Reinstalling all dependencies...
call npm install

REM Verify web-vitals installation
call npm list web-vitals || (
    echo Installing missing web-vitals package...
    call npm install web-vitals
)

cd ..

REM Check if Tesseract is installed
tesseract --version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Tesseract OCR is not installed or not in PATH!
    echo Please install Tesseract OCR from: https://github.com/UB-Mannheim/tesseract/wiki
    echo And add it to your system PATH
    pause
)

REM Start both servers
echo Starting servers...
start cmd /k "cd backend && set PYTHONPATH=. && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
timeout /t 5
start cmd /k "cd frontend && npm start"

echo Servers are starting...
echo Backend will be available at http://localhost:8000
echo Frontend will be available at http://localhost:3000 
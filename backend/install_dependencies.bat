@echo off
echo Installing ScriptGenie dependencies...

:: Create virtual environment if it doesn't exist
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

:: Activate virtual environment
call venv\Scripts\activate

:: Upgrade pip
python -m pip install --upgrade pip

:: Install dependencies
echo Installing required packages...
pip install -r requirements.txt

:: Install pdfplumber specifically
echo Installing pdfplumber for PDF image extraction...
pip install pdfplumber

echo Dependencies installed successfully!
echo To activate the environment, run: venv\Scripts\activate 
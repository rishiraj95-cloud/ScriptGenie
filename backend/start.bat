@echo off
echo Starting ScriptGenie backend...

:: Create virtual environment if it doesn't exist
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

:: Activate virtual environment
call venv\Scripts\activate

:: Check and install dependencies
echo Checking dependencies...

:: Check if pip needs upgrading
python -c "import pip; print('Pip version:', pip.__version__)"
python -m pip install --upgrade pip

:: Function to check if a package is installed
setlocal EnableDelayedExpansion
for %%p in (fastapi python-multipart opencv-python pytesseract pdf2image openai python-dotenv uvicorn jira pdfplumber) do (
    python -c "import importlib.util; print('Checking %%p:', 'Installed' if importlib.util.find_spec('%%p'.replace('-', '_')) else 'Not installed')" > temp.txt
    set /p result=<temp.txt
    echo !result!
    
    if "!result!"=="Checking %%p: Not installed" (
        echo Installing %%p...
        pip install %%p
    )
)

:: Special case for PyMuPDF (imported as fitz)
python -c "import importlib.util; print('Checking PyMuPDF:', 'Installed' if importlib.util.find_spec('fitz') else 'Not installed')" > temp.txt
set /p result=<temp.txt
echo %result%

if "%result%"=="Checking PyMuPDF: Not installed" (
    echo Installing PyMuPDF...
    pip install PyMuPDF==1.23.8
)

:: Special case for openai version
python -c "import openai; print('OpenAI version:', openai.__version__)" > temp.txt
set /p result=<temp.txt
echo %result%

if not "%result%"=="OpenAI version: 0.28.1" (
    echo Installing OpenAI 0.28.1...
    pip install openai==0.28.1
)

del temp.txt

:: Start the server
echo Starting FastAPI server...
uvicorn app.main:app --reload 
# Scribe Test Case Generator

A tool to automatically generate test cases from Scribe recordings (videos and PDFs).

## Prerequisites

Before setting up the project, ensure you have the following installed:

1. Python 3.8 or higher
2. Node.js 14 or higher
3. Tesseract OCR
4. Poppler (for PDF processing)

### Installing Prerequisites

#### Windows:

1. **Python**: Download and install from [python.org](https://www.python.org/downloads/)

2. **Node.js**: Download and install from [nodejs.org](https://nodejs.org/)

3. **Tesseract OCR**:
   - Download the installer from [UB-Mannheim](https://github.com/UB-Mannheim/tesseract/wiki)
   - Run the installer
   - Add Tesseract to your system PATH:
     ```
     C:\Program Files\Tesseract-OCR
     ```
   - Verify installation:
     ```bash
     tesseract --version
     ```

3a. **OpenCV Dependencies** (for video processing):
   Windows:
   ```bash
   # Will be installed automatically with opencv-python
   # But if you get errors, install Visual C++ Redistributable:
   # Download and install: https://aka.ms/vs/17/release/vc_redist.x64.exe
   ```

   Linux:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install -y libopencv-dev python3-opencv

   # Fedora
   sudo dnf install opencv python3-opencv

   # CentOS/RHEL
   sudo yum install opencv python3-opencv
   ```

   Mac:
   ```bash
   brew install opencv
   ```

   Verify OpenCV installation:
   ```python
   python -c "import cv2; print(cv2.__version__)"
   ```

4. **Poppler**:
   Windows:
   - Download the latest binary from [poppler releases](https://github.com/oschwartz10612/poppler-windows/releases/)
   - Create a new folder: `C:\Program Files\poppler`
   - Extract the downloaded ZIP contents into this folder
   - Add to system PATH:
     1. Open System Properties (Win + Pause/Break)
     2. Click "Advanced system settings"
     3. Click "Environment Variables"
     4. Under "System Variables", find and select "Path"
     5. Click "Edit"
     6. Click "New"
     7. Add `C:\Program Files\poppler\Library\bin`
     8. Click "OK" on all windows
   - Verify installation:
     ```bash
     pdftoppm -h
     ```
   
   Note: If you get "missing DLL" errors:
   1. Download Visual C++ Redistributable:
      - [VC_redist.x64.exe](https://aka.ms/vs/17/release/vc_redist.x64.exe)
   2. Install it and restart your computer

   Alternative Method (using Chocolatey):
   ```bash
   # Install Chocolatey first if you haven't
   # Open PowerShell as Administrator and run:
   Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

   # Then install poppler
   choco install poppler
   ```

   Linux:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install poppler-utils

   # Fedora
   sudo dnf install poppler-utils

   # CentOS/RHEL
   sudo yum install poppler-utils
   ```

   Mac:
   ```bash
   brew install poppler
   
   # Verify installation
   pdftoppm -h
   ```

   Troubleshooting Poppler:
   1. If `pdf2image` can't find poppler:
      ```python
      from pdf2image import convert_from_path
      images = convert_from_path(pdf_path, poppler_path=r"C:\Program Files\poppler\Library\bin")
      ```
   2. Common errors:
      - "DLL load failed": Install Visual C++ Redistributable
      - "poppler not found": Double-check PATH or specify poppler_path
      - "command not found": Restart terminal after installation

## Project Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd scribe-test-generator
   ```

2. Create necessary directories:
   ```bash
   mkdir -p backend/app/routers
   mkdir -p backend/app/utils
   mkdir -p backend/uploaded_videos
   mkdir -p backend/frames
   mkdir -p backend/uploaded_pdfs
   ```

3. Set up the backend:
   ```bash
   cd backend
   python -m venv venv

   # Windows
   .\venv\Scripts\activate

   # Linux/Mac
   source venv/bin/activate

   pip install --upgrade pip
   pip install fastapi "uvicorn[standard]" python-multipart opencv-python pytesseract pillow PyPDF2 pdf2image
   ```

4. Set up the frontend:
   ```bash
   cd ../frontend
   npm install
   ```

## Running the Application

1. Start the backend server:
   ```bash
   # From the backend directory
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. Start the frontend development server:
   ```bash
   # From the frontend directory
   npm start
   ```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Usage

1. Open the application in your browser (http://localhost:3000)
2. Click "Choose File" and select either:
   - A video recording of your Scribe session
   - A PDF exported from Scribe
3. Click "Generate Test Cases"
4. View the generated test cases and backend logs in the interface

## Troubleshooting

1. **Tesseract not found error**:
   - Verify Tesseract is installed
   - Check system PATH includes Tesseract directory
   - Restart your terminal/IDE after PATH changes

2. **PDF processing fails**:
   - Verify Poppler is installed
   - Check system PATH includes Poppler directory
   - Ensure PDF file is not corrupted

3. **No test cases generated**:
   - Check backend logs for processing details
   - Verify input file format matches Scribe's format
   - Ensure file is not empty or corrupted

4. **Backend connection failed**:
   - Verify backend server is running
   - Check console for CORS errors
   - Ensure ports 8000 and 3000 are available

5. **Video processing fails**:
   - Check OpenCV installation:
     ```python
     import cv2
     print(cv2.__version__)
     ```
   - Verify video file format (supported formats: mp4, avi, mov)
   - Check if frames are being extracted:
     - Look in the `backend/frames` directory
     - Check backend logs for frame extraction messages
   - Verify Tesseract can read the frames:
     ```python
     from PIL import Image
     import pytesseract
     print(pytesseract.image_to_string('path/to/frame.jpg'))
     ```
   - Common video processing errors:
     - "cv2 module not found": Reinstall opencv-python
     - "Error reading video file": Check file format and codecs
     - "No text extracted": Adjust video quality or recording settings

## Project Structure 
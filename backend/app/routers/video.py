from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
from app.utils.video_processor import extract_frames, extract_text_from_frames
from app.utils.pdf_processor import extract_text_from_pdf
from app.utils.test_case_generator import generate_test_cases
import os
import shutil

router = APIRouter(prefix="/api/video", tags=["video"])

UPLOAD_FOLDER = "uploaded_videos"
FRAMES_FOLDER = "frames"
PDF_FOLDER = "uploaded_pdfs"

@router.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    logs = []
    def log(message):
        print(message)
        logs.append(message)

    try:
        log(f"Received file: {file.filename}")
        
        # Determine file type
        file_extension = os.path.splitext(file.filename)[1].lower()
        
        # Create necessary directories
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        os.makedirs(FRAMES_FOLDER, exist_ok=True)
        os.makedirs(PDF_FOLDER, exist_ok=True)
        
        # Process based on file type
        if file_extension == '.pdf':
            file_path = os.path.join(PDF_FOLDER, file.filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Extract text from PDF
            text_data = extract_text_from_pdf(file_path, log_callback=log)
            log(f"PDF text extraction result: {len(text_data)} lines")
            if not text_data:
                raise Exception("No text could be extracted from the PDF")
        else:
            # Handle video file
            file_path = os.path.join(UPLOAD_FOLDER, file.filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Process video
            frames_path = os.path.join(FRAMES_FOLDER, os.path.splitext(file.filename)[0])
            extract_frames(file_path, frames_path, log_callback=log)
            text_data = extract_text_from_frames(frames_path, log_callback=log)
            log(f"Video text extraction result: {len(text_data)} lines")
            if not text_data:
                raise Exception("No text could be extracted from the video")
        
        # Generate test cases
        test_cases = generate_test_cases(text_data, log_callback=log)
        
        return JSONResponse(content={
            "message": "File processed successfully",
            "test_cases": test_cases,
            "logs": logs
        })
        
    except Exception as e:
        log(f"Error processing file: {str(e)}")
        import traceback
        log(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"error": str(e), "logs": logs}
        ) 
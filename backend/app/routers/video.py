from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from app.utils.video_processor import extract_frames, extract_text_from_frames
from app.utils.pdf_processor import extract_text_from_pdf
from app.utils.test_case_generator import generate_test_cases
import os
import shutil
import zipfile
import io
from typing import List
from app.utils.chatgpt_helper import ChatGPTHelper
from app.utils.jira_helper import JiraHelper
import json
from datetime import datetime

router = APIRouter(prefix="/api/video", tags=["video"])

UPLOAD_FOLDER = "uploaded_videos"
FRAMES_FOLDER = "frames"
PDF_FOLDER = "uploaded_pdfs"
TEST_CASES_FOLDER = "saved_test_cases"

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
            
            # Generate test cases
            test_cases = generate_test_cases(text_data, log_callback=log)
            
            # Return response without frames for PDF
            return JSONResponse(
                status_code=200,
                content={
                    "test_cases": test_cases,
                    "logs": logs,
                    "is_video": False
                }
            )
        else:
            # Handle video file
            file_path = os.path.join(UPLOAD_FOLDER, file.filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Process video
            frames_path = os.path.join(FRAMES_FOLDER, os.path.splitext(file.filename)[0])
            num_frames = extract_frames(file_path, frames_path, log_callback=log)
            text_data = extract_text_from_frames(frames_path, log_callback=log)
            log(f"Video text extraction result: {len(text_data)} lines")
            if not text_data:
                raise Exception("No text could be extracted from the video")
            
            # Get list of frame paths
            frame_files = []
            if os.path.exists(frames_path):
                frame_files = [f for f in os.listdir(frames_path) if f.endswith('.jpg')]
                frame_files.sort(key=lambda x: int(x.split('_')[1].split('.')[0]))
                frame_files = [os.path.join(os.path.basename(FRAMES_FOLDER), 
                                  os.path.basename(frames_path), 
                                  f).replace('\\', '/') for f in frame_files]
            
            # Generate test cases
            test_cases = generate_test_cases(text_data, log_callback=log)
            
            # Return response with frames for video
            return JSONResponse(
                status_code=200,
                content={
                    "test_cases": test_cases,
                    "logs": logs,
                    "frames": frame_files,
                    "is_video": True,
                    "debug_info": {
                        "frames_path": frames_path,
                        "frame_count": len(frame_files),
                        "sample_path": frame_files[0] if frame_files else None
                    }
                }
            )
        
    except Exception as e:
        log(f"Error processing file: {str(e)}")
        import traceback
        log(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"error": str(e), "logs": logs}
        )

@router.get("/frame/{frame_path:path}")
async def get_frame(frame_path: str):
    return FileResponse(frame_path)

@router.post("/verify-chatgpt")
async def verify_chatgpt(request: dict):
    try:
        api_key = request.get('api_key')
        if not api_key:
            raise HTTPException(status_code=400, detail="API key is required")
        
        helper = ChatGPTHelper(api_key)
        print(f"Attempting ChatGPT connection...")
        is_valid = helper.verify_connection()
        print(f"ChatGPT connection result: {is_valid}")
        return JSONResponse(
            status_code=200,
            content={"valid": is_valid}
        )
    except Exception as e:
        print(f"ChatGPT verification error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify-jira")
async def verify_jira(request: dict):
    try:
        api_key = request.get('api_key')
        if not api_key:
            raise HTTPException(status_code=400, detail="API key is required")
        
        helper = JiraHelper(api_key)
        print(f"Attempting JIRA connection with server: {helper.server}")
        is_valid = helper.verify_connection()
        print(f"JIRA connection result: {is_valid}")
        return JSONResponse(
            status_code=200,
            content={"valid": is_valid}
        )
    except Exception as e:
        print(f"JIRA verification error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-test-cases")
async def generate_test_cases(request: dict):
    try:
        user_story = request.get('user_story')
        api_key = request.get('api_key')
        
        if not user_story or not api_key:
            raise HTTPException(status_code=400, detail="User story and API key are required")
            
        helper = ChatGPTHelper(api_key)
        prompt = f"""
        Generate detailed test cases for the following user story. Format each test case exactly as follows:
        
        Browser Configuration: [List any specific browser requirements, if applicable]
        Pre-Required Conditions: [List any prerequisites needed, if applicable]
        
        Scenario Name: [Descriptive name of the scenario]
        Test Steps:
            1. [Detailed step description]
            Received Outcome: [Expected outcome after this step]
            2. [Next step description]
            Received Outcome: [Expected outcome after this step]
            ... [Continue with numbered steps]
        
        Important: After all scenarios, always include these mandatory sections:
        
        Regression Scenarios: 
        Consider and list scenarios that should be regression tested, such as:
        - Related functionality that might be impacted
        - Integration points with other features
        - Backward compatibility checks
        - Performance implications
        - Security considerations
        - Edge cases and boundary conditions
        
        Notes:
        Include important information such as:
        - Test environment requirements
        - Data setup requirements
        - Special considerations
        - Known limitations
        - Dependencies
        - Risk areas
        
        Important formatting rules:
        1. Each step must be numbered
        2. Each step must have a "Received Outcome" immediately after it
        3. Outcomes should be detailed and specific
        4. Include both positive and negative test scenarios
        5. Include verification steps for UI elements, error messages, and state changes
        6. Browser Configuration and Pre-Required Conditions are optional
        7. Regression Scenarios and Notes sections are mandatory
        8. Provide detailed regression scenarios based on the feature's context
        
        Here is the user story to generate test cases for:
        
        {user_story}
        
        Generate multiple scenarios following this exact format. Make sure to include test cases for:
        - Happy path scenarios
        - Error scenarios
        - Edge cases
        - UI verification
        - State transitions
        """
        
        test_cases = helper.generate_test_cases(prompt)
        
        # Post-process the response to ensure consistent formatting
        formatted_test_cases = helper.format_test_cases_response(test_cases)
        
        return JSONResponse(
            status_code=200,
            content={"test_cases": formatted_test_cases}
        )
    except Exception as e:
        print(f"Test case generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/save-test-cases")
async def save_test_cases(request: dict):
    try:
        test_cases = request.get('test_cases')
        if not test_cases:
            raise HTTPException(status_code=400, detail="Test cases are required")
            
        # Create directory if it doesn't exist
        os.makedirs(TEST_CASES_FOLDER, exist_ok=True)
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"test_cases_{timestamp}.txt"
        file_path = os.path.join(TEST_CASES_FOLDER, filename)
        
        # Save test cases
        with open(file_path, 'w') as f:
            f.write(test_cases)
            
        return JSONResponse(
            status_code=200,
            content={"filename": filename}
        )
    except Exception as e:
        print(f"Error saving test cases: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/saved-test-cases")
async def get_saved_test_cases():
    try:
        # Create directory if it doesn't exist
        os.makedirs(TEST_CASES_FOLDER, exist_ok=True)
        
        # Get list of saved test case files
        files = []
        for filename in os.listdir(TEST_CASES_FOLDER):
            if filename.endswith('.txt'):
                file_path = os.path.join(TEST_CASES_FOLDER, filename)
                # Don't read content, just get metadata
                files.append({
                    'name': filename,
                    'date': datetime.fromtimestamp(os.path.getctime(file_path)).strftime("%Y-%m-%d %H:%M:%S")
                })
                
        return JSONResponse(
            status_code=200,
            content={"files": sorted(files, key=lambda x: x['date'], reverse=True)}
        )
    except Exception as e:
        print(f"Error getting saved test cases: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download-test-case/{filename}")
async def download_test_case(filename: str):
    try:
        file_path = os.path.join(TEST_CASES_FOLDER, filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Test case file not found")
            
        return FileResponse(
            path=file_path,
            filename=f"TestCase_{datetime.fromtimestamp(os.path.getctime(file_path)).strftime('%Y-%m-%d_%H_%M_%S')}.txt",
            media_type='text/plain'
        )
    except Exception as e:
        print(f"Error downloading test case: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 
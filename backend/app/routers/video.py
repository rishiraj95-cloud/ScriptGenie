from fastapi import APIRouter, UploadFile, File, HTTPException, Request, Form
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from app.utils.video_processor import extract_frames, extract_text_from_frames
from app.utils.pdf_processor import extract_text_from_pdf, process_test_cases, generate_test_cases
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

# Define the folder for saving automation scripts
AUTOMATION_SCRIPTS_FOLDER = "automation_scripts"

# Create the folder if it doesn't exist
if not os.path.exists(AUTOMATION_SCRIPTS_FOLDER):
    os.makedirs(AUTOMATION_SCRIPTS_FOLDER)

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
            text_data = extract_text_from_pdf(file_path)
            log(f"PDF text extraction result: {len(text_data)} lines")
            if not text_data:
                raise Exception("No text could be extracted from the PDF")
            
            # Generate test cases
            test_cases = await process_test_cases(text_data)
            
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
            test_cases = await process_test_cases(text_data)
            
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

@router.post("/verify-mass-reports-jira")
async def verify_mass_reports_jira(request: dict):
    """Specific endpoint for Mass Reports JIRA verification"""
    try:
        api_key = request.get('api_key')
        if not api_key:
            raise HTTPException(status_code=400, detail="API key is required")
        
        helper = JiraHelper(api_key)
        print(f"Attempting Mass Reports JIRA connection with server: {helper.server}")
        is_valid = helper.verify_connection()
        print(f"Mass Reports JIRA connection result: {is_valid}")
        
        return JSONResponse(
            status_code=200,
            content={"valid": is_valid}
        )
    except Exception as e:
        print(f"Mass Reports JIRA verification error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-test-cases-from-story")
async def generate_test_cases_from_story(request: dict):
    """Generate test cases from JIRA user story"""
    try:
        user_story = request.get('user_story')
        api_key = request.get('api_key')
        
        if not user_story or not api_key:
            raise HTTPException(status_code=400, detail="User story and API key are required")
        
        helper = ChatGPTHelper(api_key)
        test_cases = helper.generate_test_cases(user_story)
        
        return JSONResponse(
            status_code=200,
            content={"test_cases": test_cases}
        )
    except Exception as e:
        print(f"Error generating test cases: {str(e)}")
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

@router.post("/generate-automation-script")
async def generate_automation_script(request: dict):
    try:
        test_case = request.get('test_case')
        framework = request.get('framework')
        api_key = request.get('api_key')
        
        if not all([test_case, framework, api_key]):
            raise HTTPException(status_code=400, detail="Test case, framework and API key are required")
        
        helper = ChatGPTHelper(api_key)
        
        prompt = f"""
        Convert the following test case into an automation script using {framework}.
        Follow these guidelines:
        1. Use proper {framework} syntax and commands
        2. Include necessary browser initialization
        3. Add appropriate assertions and verifications
        4. Handle any required waits or synchronization
        5. Include error handling where appropriate
        6. Add comments to explain complex logic
        
        Test Case:
        {test_case}
        
        Generate only the {framework} script without any additional explanations.
        """
        
        generated_script = helper.generate_automation_script(prompt)
        
        return JSONResponse(
            status_code=200,
            content={"script": generated_script}
        )
    except Exception as e:
        print(f"Script generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/improve-gherkin")
async def improve_gherkin(request: dict):
    try:
        current_script = request.get('current_script')
        improvement_prompt = request.get('improvement_prompt')
        api_key = request.get('api_key')
        
        if not all([current_script, improvement_prompt, api_key]):
            raise HTTPException(status_code=400, detail="Current script, improvement prompt and API key are required")
        
        helper = ChatGPTHelper(api_key)
        
        prompt = f"""
        I have a Gherkin script that I want to improve based on the following request:
        
        Improvement Request: {improvement_prompt}
        
        Current Gherkin Script:
        {current_script}
        
        Please provide an improved version of this Gherkin script that addresses the improvement request.
        Maintain proper Gherkin syntax and ensure all scenarios are complete and valid.
        Return only the improved Gherkin script without any additional explanations.
        """
        
        improved_script = helper.generate_automation_script(prompt)
        
        return JSONResponse(
            status_code=200,
            content={"script": improved_script}
        )
    except Exception as e:
        print(f"Gherkin improvement error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-test-case")
async def analyze_test_case(request: dict):
    try:
        test_case = request.get('test_case')
        api_key = request.get('api_key')
        
        if not all([test_case, api_key]):
            raise HTTPException(status_code=400, detail="Test case and API key are required")
        
        helper = ChatGPTHelper(api_key)
        
        prompt = f"""
        As a software testing expert, analyze the following test case and provide a thorough evaluation report.
        Format your response with the following structure:
        
        KEY FINDINGS:
        • [List the most critical points, each on a new line starting with •]
        
        DETAILED ANALYSIS:
        Consider the following aspects:
        1. Completeness of test steps
        2. Clarity of expected outcomes
        3. Test case structure and organization
        4. Coverage of edge cases
        5. Adherence to testing best practices
        6. Potential improvements or missing scenarios
        7. Overall quality assessment
        
        RECOMMENDATIONS:
        • [List specific recommendations, each on a new line starting with •]
        
        Test Case:
        {test_case}
        
        Ensure the response maintains this exact formatting with the sections clearly separated.
        """
        
        analysis = helper.generate_automation_script(prompt)
        
        return JSONResponse(
            status_code=200,
            content={"analysis": analysis}
        )
    except Exception as e:
        print(f"Test case analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-sahi-script")
async def generate_sahi_script(request: dict):
    try:
        test_case = request.get('test_case')
        api_key = request.get('api_key')
        
        if not all([test_case, api_key]):
            raise HTTPException(status_code=400, detail="Test case and API key are required")
        
        helper = ChatGPTHelper(api_key)
        
        prompt = f"""
        Convert the following test case into a SAHI Pro automation script.
        Follow these guidelines:
        1. Use proper SAHI Pro syntax and commands
        2. Include necessary browser initialization
        3. Add appropriate assertions and verifications
        4. Handle any required waits or synchronization
        5. Include error handling where appropriate
        6. Add comments to explain complex logic
        
        Test Case:
        {test_case}
        
        Generate only the SAHI script without any additional explanations.
        """
        
        script = helper.generate_automation_script(prompt)
        
        return JSONResponse(
            status_code=200,
            content={"script": script}
        )
    except Exception as e:
        print(f"SAHI script generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/save-automation-script")
async def save_automation_script(request: dict):
    try:
        script = request.get('script')
        framework = request.get('framework')
        
        if not all([script, framework]):
            raise HTTPException(status_code=400, detail="Script and framework are required")
        
        # Define file extension based on framework
        extensions = {
            'SAHI Pro': '.sah',
            'Selenium': '.java',
            'Cucumber': '.feature'
        }
        
        extension = extensions.get(framework)
        if not extension:
            raise HTTPException(status_code=400, detail="Invalid framework")
        
        # Generate unique filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{framework.lower().replace(' ', '_')}_{timestamp}{extension}"
        file_path = os.path.join(AUTOMATION_SCRIPTS_FOLDER, filename)
        
        # Save the script
        with open(file_path, 'w') as f:
            f.write(script)
        
        return JSONResponse(
            status_code=200,
            content={"filename": filename}
        )
    except Exception as e:
        print(f"Error saving automation script: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/saved-automation-scripts")
async def get_saved_automation_scripts():
    try:
        files = []
        for filename in os.listdir(AUTOMATION_SCRIPTS_FOLDER):
            file_path = os.path.join(AUTOMATION_SCRIPTS_FOLDER, filename)
            if os.path.isfile(file_path):
                files.append({
                    "name": filename,
                    "created": datetime.fromtimestamp(os.path.getctime(file_path)).strftime('%Y-%m-%d %H:%M:%S')
                })
        return JSONResponse(
            status_code=200,
            content={"files": sorted(files, key=lambda x: x["created"], reverse=True)}
        )
    except Exception as e:
        print(f"Error getting saved scripts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download-automation-script/{filename}")
async def download_automation_script(filename: str):
    try:
        file_path = os.path.join(AUTOMATION_SCRIPTS_FOLDER, filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Script file not found")
            
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type='text/plain'
        )
    except Exception as e:
        print(f"Error downloading script: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-selenium-script")
async def generate_selenium_script(request: dict):
    try:
        test_case = request.get('test_case')
        api_key = request.get('api_key')
        
        if not all([test_case, api_key]):
            raise HTTPException(status_code=400, detail="Test case and API key are required")
        
        helper = ChatGPTHelper(api_key)
        
        prompt = f"""
        Convert the following test case into a Selenium Java test script.
        Follow these guidelines:
        1. Use proper Selenium WebDriver commands
        2. Include necessary imports and setup
        3. Add appropriate assertions and verifications
        4. Handle waits and synchronization properly
        5. Include error handling where appropriate
        6. Add comments to explain the test flow
        7. Follow Java best practices
        
        Test Case:
        {test_case}
        
        Generate only the Selenium Java script without any additional explanations.
        """
        
        script = helper.generate_automation_script(prompt)
        
        return JSONResponse(
            status_code=200,
            content={"script": script}
        )
    except Exception as e:
        print(f"Selenium script generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/delete-test-cases")
async def delete_test_cases(request: Request):
    try:
        filenames = await request.json()
        if not isinstance(filenames, list):
            raise HTTPException(status_code=400, detail="Expected list of filenames")
        
        deleted_files = []
        for filename in filenames:
            file_path = os.path.join(TEST_CASES_FOLDER, filename)
            if os.path.exists(file_path):
                os.remove(file_path)
                deleted_files.append(filename)
        
        return JSONResponse(
            status_code=200,
            content={"deleted": deleted_files}
        )
    except Exception as e:
        print(f"Error deleting test cases: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/improve-test-cases")
async def improve_test_cases(request: dict):
    try:
        test_cases = request.get('test_cases')
        prompt = request.get('prompt')
        api_key = request.get('api_key')
        
        if not all([test_cases, prompt, api_key]):
            raise HTTPException(status_code=400, detail="Test cases, improvement prompt and API key are required")
        
        helper = ChatGPTHelper(api_key)
        
        base_prompt = f"""
        Improve the following test cases while maintaining this exact format:
        
        Browser Configuration: [Specify browser]
        Pre-Required Conditions: [List prerequisites]
        
        Scenario Name: [Name]
        Test Steps:
            1. [Step]
            Received Outcome: [Outcome]
        
        Important: Always maintain these mandatory sections:
        - Browser Configuration
        - Pre-Required Conditions
        - Scenarios with numbered steps and Received Outcomes
        - Regression Scenarios
        - Notes
        
        User improvement request: {prompt}
        
        Current test cases:
        {test_cases}
        """
        
        improved_test_cases = helper.generate_test_cases(base_prompt)
        
        return JSONResponse(
            status_code=200,
            content={"improved_test_cases": improved_test_cases}
        )
    except Exception as e:
        print(f"Error improving test cases: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/fetch-jira-story")
async def fetch_jira_story(request: dict):
    try:
        jira_link = request.get('jira_link')
        api_key = request.get('api_key')
        
        if not all([jira_link, api_key]):
            raise HTTPException(status_code=400, detail="JIRA link and API key are required")
        
        helper = JiraHelper(api_key)
        
        # Extract issue key from JIRA link
        issue_key = jira_link.split('/')[-1]
        
        # Fetch user story
        user_story = helper.get_issue_description(issue_key)
        
        if not user_story:
            raise HTTPException(status_code=404, detail="Could not find user story in JIRA")
        
        return JSONResponse(
            status_code=200,
            content={"user_story": user_story}
        )
    except Exception as e:
        print(f"Error fetching JIRA story: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/fetch-jira-test-case")
async def fetch_jira_test_case(request: dict):
    try:
        jira_link = request.get('jira_link')
        api_key = request.get('api_key')
        
        if not all([jira_link, api_key]):
            raise HTTPException(status_code=400, detail="JIRA link and API key are required")
        
        helper = JiraHelper(api_key)
        
        # Extract issue key from JIRA link
        issue_key = jira_link.split('/')[-1]
        
        # Fetch test case content
        test_case = helper.get_test_case(issue_key)
        
        if not test_case:
            raise HTTPException(status_code=404, detail="Could not find test case in JIRA")
        
        return JSONResponse(
            status_code=200,
            content={"test_case": test_case}
        )
    except Exception as e:
        print(f"Error fetching JIRA test case: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/fetch-epic-status")
async def fetch_epic_status(request: dict):
    try:
        epic_link = request.get('epic_link')
        api_key = request.get('api_key')
        
        if not all([epic_link, api_key]):
            raise HTTPException(status_code=400, detail="Epic link and API key are required")
        
        helper = JiraHelper(api_key)
        
        # Extract epic key from JIRA link
        epic_key = epic_link.split('/')[-1]
        print(f"Processing epic status request for: {epic_key}")
        
        # Get epic statistics
        epic_stats = helper.get_epic_statistics(epic_key)
        
        return JSONResponse(
            status_code=200,
            content={
                "total_stories": epic_stats["total_stories"],
                "stories_with_code": epic_stats["stories_with_code"],
                "stories_with_tests": epic_stats["stories_with_tests"],
                "missing_test_cases": epic_stats["stories_with_code"] - epic_stats["stories_with_tests"],
                "test_coverage": epic_stats["test_coverage"],
                "details": epic_stats["details"]  # Include detailed information
            }
        )
    except Exception as e:
        print(f"Error fetching epic status: {str(e)}")
        print(f"Epic link provided: {epic_link}")
        print(f"Extracted epic key: {epic_key if 'epic_key' in locals() else 'Not extracted'}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/improve-script")
async def improve_script(request: dict):
    try:
        script = request.get('script')
        improvement_prompt = request.get('improvement_prompt')
        framework = request.get('framework')
        api_key = request.get('api_key')
        
        if not all([script, improvement_prompt, framework, api_key]):
            raise HTTPException(status_code=400, detail="Script, improvement prompt, framework and API key are required")
        
        helper = ChatGPTHelper(api_key)
        
        prompt = f"""
        You are working with a test case document that contains multiple scenarios.
        The current test case content is:
        
        {script}
        
        Your task: {improvement_prompt}
        
        Guidelines:
        1. Keep ALL existing scenarios exactly as they are
        2. Maintain the exact same formatting style as the existing scenarios
        3. If adding a new scenario, use the same structure and style as existing scenarios
        4. Include any relevant images or links in the same format as existing scenarios
        5. Preserve all existing formatting, including spacing and special characters
        6. Return the COMPLETE test case with all existing scenarios plus any additions/changes
        
        Return the complete test case maintaining exact format and style.
        """
        
        improved_script = helper.generate_automation_script(prompt)
        
        return JSONResponse(
            status_code=200,
            content={"improved_script": improved_script}
        )
    except Exception as e:
        print(f"Script improvement error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/get-user-story")
async def get_user_story(request: dict):
    try:
        jira_link = request.get('jira_link')
        api_key = request.get('api_key')
        
        if not all([jira_link, api_key]):
            raise HTTPException(status_code=400, detail="JIRA link and API key are required")
        
        helper = JiraHelper(api_key)
        
        # Extract issue key from JIRA link
        issue_key = jira_link.split('/')[-1]
        
        # Get user story details
        story_details = helper.get_story_details(issue_key)
        
        return JSONResponse(
            status_code=200,
            content=story_details
        )
    except Exception as e:
        print(f"Error fetching user story details: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/push-test-case")
async def push_test_case(request: dict):
    try:
        user_story_key = request.get('user_story_key')
        project_key = request.get('project_key')
        user_story_title = request.get('user_story_title')
        test_case_content = request.get('test_case_content')
        api_key = request.get('api_key')
        
        if not all([user_story_key, project_key, user_story_title, test_case_content, api_key]):
            raise HTTPException(
                status_code=400, 
                detail="User story key, project key, title, test case content and API key are required"
            )
        
        helper = JiraHelper(api_key)
        
        # Create test case and link it to user story
        test_case = helper.create_test_case(
            project_key=project_key,
            summary=f"Test Case: {user_story_title}",
            description=test_case_content,
            parent_key=user_story_key
        )
        
        return JSONResponse(
            status_code=200,
            content={"test_case_key": test_case.key}
        )
    except Exception as e:
        print(f"Error pushing test case: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-test-cases-from-text")
async def generate_test_cases_from_text(request: dict):
    try:
        user_story = request.get('user_story')
        api_key = request.get('api_key')
        
        if not user_story or not api_key:
            raise HTTPException(status_code=400, detail="User story and API key are required")
        
        helper = ChatGPTHelper(api_key)
        test_cases = helper.generate_test_cases(user_story)
        
        return JSONResponse(
            status_code=200,
            content={"test_cases": test_cases}
        )
    except Exception as e:
        print(f"Error generating test cases from text: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process-scribe-with-ai")
async def process_scribe_with_ai(file: UploadFile = File(...), api_key: str = Form(...)):
    logs = []
    def log(message):
        print(message)
        logs.append(message)
    
    try:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        # Save uploaded file
        file_path = os.path.join(PDF_FOLDER, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Extract text from PDF
        text_data = extract_text_from_pdf(file_path)
        log(f"PDF text extraction result: {len(text_data)} lines")
        
        if not text_data:
            raise Exception("No text could be extracted from the PDF")
        
        # Process with AI
        helper = ChatGPTHelper(api_key)
        test_cases = helper.generate_test_cases("\n".join(text_data))
        
        return JSONResponse(
            status_code=200,
            content={
                "test_cases": test_cases,
                "logs": logs
            }
        )
    except Exception as e:
        log(f"Error processing file: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e), "logs": logs}
        )

@router.post("/get-stories-needing-tests")
async def get_stories_needing_tests(request: dict):
    """Get stories from epic that need test cases"""
    try:
        epic_link = request.get('epic_link')
        api_key = request.get('api_key')
        
        if not all([epic_link, api_key]):
            raise HTTPException(status_code=400, detail="Epic link and API key are required")
        
        helper = JiraHelper(api_key)
        epic_key = epic_link.split('/')[-1]
        
        stories = helper.get_stories_needing_tests(epic_key)
        
        return JSONResponse(
            status_code=200,
            content={"stories": stories}
        )
    except Exception as e:
        print(f"Error fetching stories needing tests: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/backfill-test-case")
async def backfill_test_case(request: dict):
    """Generate test case for a single story during backfill"""
    try:
        story = request.get('story')
        api_key = request.get('api_key')
        
        if not all([story, api_key]):
            raise HTTPException(status_code=400, detail="Story and API key are required")
        
        helper = ChatGPTHelper(api_key)
        test_case = helper.generate_test_cases(story['description'])
        
        # Save test case
        filename = f"Test Case{story['key']}.txt"
        file_path = os.path.join(TEST_CASES_FOLDER, filename)
        
        with open(file_path, 'w') as f:
            f.write(test_case)
        
        return JSONResponse(
            status_code=200,
            content={
                "filename": filename,
                "test_case": test_case
            }
        )
    except Exception as e:
        print(f"Error generating backfill test case: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download-backfill-test-cases")
async def download_backfill_test_cases():
    """Download all backfill test cases as zip"""
    try:
        # Create in-memory zip file
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for filename in os.listdir(TEST_CASES_FOLDER):
                file_path = os.path.join(TEST_CASES_FOLDER, filename)
                zip_file.write(file_path, filename)
        
        # Reset buffer position
        zip_buffer.seek(0)
        
        # Return zip file
        return StreamingResponse(
            zip_buffer,
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename=backfill_test_cases.zip"
            }
        )
    except Exception as e:
        print(f"Error creating zip file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 
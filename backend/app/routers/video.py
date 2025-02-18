from fastapi import APIRouter, UploadFile, File, HTTPException, Request
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
            
        # Validate user story format
        if len(user_story.strip()) < 10:
            raise HTTPException(status_code=400, detail="User story is too short")
            
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

@router.post("/generate-automation-script")
async def generate_automation_script(request: dict):
    try:
        user_story = request.get('user_story')
        framework = request.get('framework')
        api_key = request.get('api_key')
        script_type = request.get('script_type', 'gherkin')  # gherkin or cucumber
        gherkin_script = request.get('gherkin_script')  # needed for cucumber generation
        
        if not all([user_story, framework, api_key]) and script_type == 'gherkin':
            raise HTTPException(status_code=400, detail="User story, framework and API key are required")
            
        if not all([gherkin_script, framework, api_key]) and script_type == 'cucumber':
            raise HTTPException(status_code=400, detail="Gherkin script, framework and API key are required")
        
        helper = ChatGPTHelper(api_key)
        
        if script_type == 'gherkin':
            prompt = f"""
            Convert the following user story into Gherkin script format.
            Use proper Gherkin syntax with Feature, Scenario, Given, When, Then format.
            Make sure to:
            1. Include a clear Feature description
            2. Break down into multiple scenarios if needed
            3. Use proper Gherkin keywords
            4. Include both happy path and error scenarios
            5. Make scenarios atomic and focused
            
            User Story:
            {user_story}
            """
        else:  # cucumber
            prompt = f"""
            Convert the following Gherkin script into Cucumber automation code.
            Generate the complete implementation including:
            1. Step definitions
            2. Required imports
            3. Page objects if needed
            4. Helper methods
            5. Proper assertions
            
            Gherkin Script:
            {gherkin_script}
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
        current_test_cases = request.get('current_test_cases')
        improvement_prompt = request.get('improvement_prompt')
        api_key = request.get('api_key')
        
        if not all([current_test_cases, improvement_prompt, api_key]):
            raise HTTPException(status_code=400, detail="Current test cases, improvement prompt and API key are required")
        
        helper = ChatGPTHelper(api_key)
        
        prompt = f"""
        Improve the following test cases based on this instruction while maintaining the exact format:
        {improvement_prompt}
        
        The output must follow this exact structure:
        1. Start with "Browser Configuration:" and "Pre-Required Conditions:"
        2. Each scenario must start with "Scenario Name:" followed by the scenario title
        3. Test steps must be numbered and indented with 8 spaces
        4. Each step must be followed by "Received Outcome:" on the next line with the same indentation
        5. Include a "Regression Scenarios:" section with bullet points
        6. End with a "Notes:" section with bullet points
        
        Current test cases:
        {current_test_cases}
        
        Maintain this exact format in your response. Do not add any explanations or additional text.
        The response should start directly with "Browser Configuration:" and maintain consistent spacing and formatting throughout.
        """
        
        improved_test_cases = helper.generate_automation_script(prompt)
        
        # Verify format and structure
        if not improved_test_cases.startswith("Browser Configuration:"):
            improved_test_cases = current_test_cases
            raise HTTPException(status_code=400, detail="Generated test cases did not match required format")
        
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
from fastapi import APIRouter, HTTPException, Header
from fastapi.responses import JSONResponse, FileResponse
from app.utils.jira_helper import JiraHelper
from app.utils.vedai_helper import VedAIHelper
from app.utils.chatgpt_helper import ChatGPTHelper
from typing import Optional
import logging
import json
import os
from datetime import datetime
import io

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/triaging", tags=["triaging"])

# Create directory for saving triage analyses
TRIAGE_FOLDER = "triage_analyses"
os.makedirs(TRIAGE_FOLDER, exist_ok=True)

@router.post("/verify-jira")
async def verify_jira(request: dict):
    """Verify connection to JIRA for triaging"""
    try:
        api_key = request.get('api_key')
        if not api_key:
            raise HTTPException(status_code=400, detail="API key is required")
        
        helper = JiraHelper(api_key)
        logger.info(f"Attempting JIRA connection with server: {helper.server}")
        is_valid = helper.verify_connection()
        logger.info(f"JIRA connection result: {is_valid}")
        
        return JSONResponse(
            status_code=200,
            content={"valid": is_valid}
        )
    except Exception as e:
        logger.error(f"JIRA verification error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/verify-vedai")
async def verify_vedai(x_api_key: Optional[str] = Header(None)):
    """Verify connection to VedAI for triaging"""
    try:
        if not x_api_key:
            raise HTTPException(status_code=400, detail="API key is required")
        
        helper = VedAIHelper(x_api_key)
        logger.info(f"Attempting VedAI connection...")
        is_valid = helper.verify_connection()
        logger.info(f"VedAI connection result: {is_valid}")
        
        return JSONResponse(
            status_code=200,
            content={"status": is_valid}
        )
    except Exception as e:
        logger.error(f"VedAI verification error: {str(e)}")
        return JSONResponse(
            status_code=200,  # Keep 200 to handle in frontend
            content={
                "status": False,
                "error": str(e)
            }
        )

@router.post("/verify-chatgpt")
async def verify_chatgpt(request: dict):
    """Verify connection to ChatGPT for triaging"""
    try:
        api_key = request.get('api_key')
        if not api_key:
            raise HTTPException(status_code=400, detail="API key is required")
        
        helper = ChatGPTHelper(api_key)
        logger.info(f"Attempting ChatGPT connection...")
        is_valid = helper.verify_connection()
        logger.info(f"ChatGPT connection result: {is_valid}")
        
        return JSONResponse(
            status_code=200,
            content={"valid": is_valid}
        )
    except Exception as e:
        logger.error(f"ChatGPT verification error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-issue")
async def analyze_issue(request: dict):
    """Analyze JIRA issue using AI"""
    try:
        jira_key = request.get('jira_key', '').strip()
        api_key = request.get('api_key')
        
        if not all([jira_key, api_key]):
            raise HTTPException(status_code=400, detail="JIRA key and API key are required")
        
        # Get JIRA issue details
        jira_helper = JiraHelper(api_key)
        issue_details = jira_helper.get_issue_details(jira_key)
        
        if not issue_details:
            raise HTTPException(status_code=404, detail=f"JIRA issue {jira_key} not found")
        
        # Prepare AI prompt
        prompt = f"""
        Analyze the following JIRA issue and help with triaging by classifying in below categories:

        JIRA Title: {issue_details.get('title')}
        Description: {issue_details.get('description')}
        Current Labels: {issue_details.get('labels')}
        Current Priority: {issue_details.get('priority')}

        Please classify this issue:

        1. Priority Level (choose one):
        - Blocker: Functionality completely blocked
        - Critical: Workaround exists
        - Major: Functionality works but needs improvement
        - Minor: Minor changes needed

        2. Category (choose one):
        - Bug: Product defect
        - Enhancement Request: Feature request
        - Usage Issue: User needs guidance
        - Infrastructure Issue: Server/network/access issues

        Base your classification strictly on the issue details provided.
        """
        
        # Get AI analysis
        chatgpt_helper = ChatGPTHelper(api_key)
        analysis = chatgpt_helper.generate_response([{
            "role": "system",
            "content": "You are a helpful assistant analyzing software issues."
        }, {
            "role": "user",
            "content": prompt
        }])
        
        # Prepare response data
        response_data = {
            "jira_details": issue_details,
            "ai_analysis": analysis,
            "timestamp": datetime.now().isoformat()
        }
        
        return JSONResponse(
            status_code=200,
            content=response_data
        )
        
    except Exception as e:
        logger.error(f"Error analyzing issue: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/save-analysis")
async def save_analysis(request: dict):
    """Save triage analysis to file"""
    try:
        analysis_data = request.get('analysis')
        if not analysis_data:
            raise HTTPException(status_code=400, detail="Analysis data is required")
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        jira_key = analysis_data.get('jira_details', {}).get('key', 'unknown')
        filename = f"triage_analysis_{jira_key}_{timestamp}.txt"
        file_path = os.path.join(TRIAGE_FOLDER, filename)
        
        # Save analysis to file
        with open(file_path, 'w') as f:
            json.dump(analysis_data, f, indent=2)
        
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type='text/plain'
        )
        
    except Exception as e:
        logger.error(f"Error saving analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 
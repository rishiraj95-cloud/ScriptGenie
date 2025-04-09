from fastapi import APIRouter, HTTPException, Header
from fastapi.responses import JSONResponse
from app.utils.jira_helper import JiraHelper
from app.utils.vedai_helper import VedAIHelper
from app.utils.chatgpt_helper import ChatGPTHelper
from typing import Optional
import logging

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/triaging", tags=["triaging"])

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
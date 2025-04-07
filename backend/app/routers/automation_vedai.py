from fastapi import APIRouter, HTTPException, Header
from fastapi.responses import JSONResponse
from app.utils.vedai_helper import VedAIHelper
from typing import Optional
import logging

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/automation", tags=["automation"])

@router.get("/verify-vedai")
async def verify_vedai(x_api_key: Optional[str] = Header(None)):
    """Verify connection to VedAI"""
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

@router.post("/generate-script-vedai")
async def generate_script_vedai(request: dict, x_api_key: Optional[str] = Header(None)):
    """Generate automation script using VedAI"""
    try:
        if not x_api_key:
            raise HTTPException(status_code=400, detail="API key is required")
            
        test_case = request.get('test_case')
        framework = request.get('framework')
        
        if not all([test_case, framework]):
            raise HTTPException(status_code=400, detail="Test case and framework are required")
        
        logger.info(f"Generating {framework} script with VedAI")
        helper = VedAIHelper(x_api_key)
        
        # Generate the script using VedAI
        script = helper.generate_script(test_case, framework)
        
        logger.info("Script generation successful")
        return JSONResponse(
            status_code=200,
            content={"script": script}
        )
        
    except Exception as e:
        logger.error(f"VedAI script generation error: {str(e)}")
        return JSONResponse(
            status_code=200,  # Keep 200 to handle in frontend
            content={
                "script": "",
                "error": str(e)
            }
        )

@router.post("/improve-script-vedai")
async def improve_script_vedai(request: dict, x_api_key: Optional[str] = Header(None)):
    """Improve automation script using VedAI"""
    try:
        if not x_api_key:
            raise HTTPException(status_code=400, detail="API key is required")
            
        script = request.get('script')
        improvement_prompt = request.get('improvement_prompt')
        framework = request.get('framework')
        
        if not all([script, improvement_prompt, framework]):
            raise HTTPException(status_code=400, detail="Script, improvement prompt, and framework are required")
        
        logger.info(f"Improving {framework} script with VedAI")
        helper = VedAIHelper(x_api_key)
        
        # Improve the script using VedAI
        improved_script = helper.improve_script(script, improvement_prompt, framework)
        
        logger.info("Script improvement successful")
        return JSONResponse(
            status_code=200,
            content={"improved_script": improved_script}
        )
        
    except Exception as e:
        logger.error(f"VedAI script improvement error: {str(e)}")
        return JSONResponse(
            status_code=200,  # Keep 200 to handle in frontend
            content={
                "improved_script": "",
                "error": str(e)
            }
        ) 
from fastapi import APIRouter, HTTPException, Header
from fastapi.responses import JSONResponse
from app.utils.scribe_vedai_helper import ScribeVedAIHelper
from typing import Optional
import logging

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/automation", tags=["scribe"])

@router.get("/scribe/verify-vedai")
async def verify_scribe_vedai(x_api_key: Optional[str] = Header(None)):
    """Verify connection to VedAI for Scribe"""
    try:
        logger.info("=== Starting Scribe VedAI Connection Process ===")
        
        if not x_api_key:
            logger.error("No API key provided in request")
            raise HTTPException(status_code=400, detail="API key is required")
        
        logger.info("API key received, initializing VedAI helper...")
        helper = ScribeVedAIHelper(x_api_key)
        
        logger.info("Attempting to verify VedAI connection...")
        is_valid = helper.verify_connection()
        logger.info(f"VedAI connection verification result: {is_valid}")
        
        if is_valid:
            logger.info("Successfully connected to VedAI")
        else:
            logger.warning("Failed to connect to VedAI - invalid response")
            
        logger.info("=== Completed Scribe VedAI Connection Process ===")
        
        return JSONResponse(
            status_code=200,
            content={"status": is_valid}
        )
        
    except Exception as e:
        logger.error(f"=== Scribe VedAI Connection Error ===")
        logger.error(f"Error details: {str(e)}")
        logger.error("=== End of Error Report ===")
        return JSONResponse(
            status_code=200,  # Keep 200 to handle in frontend
            content={
                "status": False,
                "error": str(e)
            }
        ) 
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from app.utils.vedai_helper import VedAIHelper

router = APIRouter(prefix="/api/automation/vedai", tags=["automation-vedai"])

@router.post("/verify")
async def verify_vedai(request: dict):
    """Verify connection to VedAI"""
    try:
        api_key = request.get('api_key')  # Keep for future use
        if not api_key:
            raise HTTPException(status_code=400, detail="API key is required")
        
        helper = VedAIHelper(api_key)
        print(f"Attempting VedAI connection...")
        is_valid = helper.verify_connection()
        print(f"VedAI connection result: {is_valid}")
        
        # Return in the existing format but based on the status field from VedAI
        return JSONResponse(
            status_code=200,
            content={"valid": is_valid}
        )
        
    except Exception as e:
        print(f"VedAI verification error: {str(e)}")
        return JSONResponse(
            status_code=200,  # Keep 200 to handle in frontend
            content={
                "valid": False,
                "error": str(e)
            }
        ) 
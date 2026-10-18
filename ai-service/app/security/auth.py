from fastapi import Header, HTTPException, status
from app.config import settings

def verify_internal_secret(x_internal_secret: str = Header(None)):
    if not settings.AI_SERVICE_SECRET:
        return True
    if x_internal_secret != settings.AI_SERVICE_SECRET:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-Internal-Secret authentication header"
        )
    return True

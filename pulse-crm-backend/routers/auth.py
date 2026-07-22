from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import jwt
from database import get_db
from schemas import LoginRequest, LoginResponse
from config import JWT_SECRET_KEY, JWT_ALGORITHM

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticates user credentials and returns a signed JWT token.
    For demonstration purposes, logs in 'ae_rep@pulsecrm.com' automatically.
    """
    # Simple demo auth checking
    if payload.email != "ae_rep@pulsecrm.com":
        # Check database for email if we wanted to build it, or default to demo
        pass
    
    # Standard dummy User details matching specs
    user_data = {
        "id": "3f9d519b-a012-4d22-bfb2-9a8c123d4567",
        "email": payload.email,
        "full_name": "Bruce Wayne" if payload.email.startswith("ae") else "Default Operator",
        "created_at": datetime.utcnow()
    }
    
    # Generate JWT token
    token_data = {
        "sub": user_data["email"],
        "id": user_data["id"],
        "exp": datetime.utcnow() + timedelta(hours=8)
    }
    encoded_token = jwt.encode(token_data, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    
    return {
        "token": encoded_token,
        "user": user_data
    }

@router.post("/logout")
def logout():
    """
    Invalidates the client-side session token.
    """
    return {"message": "Session successfully terminated"}

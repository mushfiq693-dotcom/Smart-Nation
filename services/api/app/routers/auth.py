from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel
from app.core.security import create_access_token, get_current_user, Role, require_role
from app.core.audit import log_audit_event
from app.db.session import get_db
from app.db.models import User
from sqlalchemy.orm import Session

router = APIRouter(prefix="/auth", tags=["Authentication & RBAC"])


class LoginRequest(BaseModel):
    username: str
    password: Optional[str] = "demo_password"


class DemoTokenRequest(BaseModel):
    role: str = Role.MUNICIPAL_ANALYST


@router.post("/demo-token", summary="Generate a demo JWT token for any selected role")
def get_demo_token(
    request: DemoTokenRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Convenient token generator for Hackathon evaluation and RBAC testing.
    Valid roles: Public_Portal, Municipal_Analyst, Policy_Reviewer, System_Admin
    """
    if request.role not in Role.ALL:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {Role.ALL}"
        )

    # Find matching seed user
    user = db.query(User).filter(User.role == request.role).first()
    username = user.username if user else f"demo_{request.role.lower()}"
    organization = user.organization if user else "CivicSphere Demo Authority"

    token_data = {
        "sub": username,
        "username": username,
        "role": request.role,
        "organization": organization,
    }
    token = create_access_token(token_data)

    background_tasks.add_task(
        log_audit_event,
        actor_role=request.role,
        action_type="DEMO_AUTH_TOKEN_GENERATED",
        endpoint="/api/v1/auth/demo-token",
        payload_summary={"username": username, "role": request.role},
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": token_data,
    }


@router.get("/me", summary="Get profile of the currently authenticated user")
def get_my_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Returns current user details decoded from the JWT token"""
    return current_user

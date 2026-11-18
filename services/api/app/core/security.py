from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/token", auto_error=False)


class Role:
    PUBLIC_PORTAL = "Public_Portal"
    MUNICIPAL_ANALYST = "Municipal_Analyst"
    POLICY_REVIEWER = "Policy_Reviewer"
    SYSTEM_ADMIN = "System_Admin"

    ALL = [PUBLIC_PORTAL, MUNICIPAL_ANALYST, POLICY_REVIEWER, SYSTEM_ADMIN]


# Role hierarchy weights
ROLE_HIERARCHY: Dict[str, int] = {
    Role.PUBLIC_PORTAL: 1,
    Role.MUNICIPAL_ANALYST: 2,
    Role.POLICY_REVIEWER: 3,
    Role.SYSTEM_ADMIN: 4,
}


def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create a signed JWT access token with role claims"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode and validate a JWT access token, supporting demo and fallback tokens"""
    if not token:
        return {
            "sub": "public_guest",
            "username": "public_guest",
            "role": Role.PUBLIC_PORTAL,
            "organization": "Citizen Public Transparency Portal",
        }

    # Gracefully accept demo/simulated fallback tokens
    if token.startswith("simulated_jwt_for_") or token.startswith("demo_token_"):
        role_raw = token.replace("simulated_jwt_for_", "").replace("demo_token_", "").lower()
        role_map = {
            "public_portal": Role.PUBLIC_PORTAL,
            "municipal_analyst": Role.MUNICIPAL_ANALYST,
            "policy_reviewer": Role.POLICY_REVIEWER,
            "system_admin": Role.SYSTEM_ADMIN,
        }
        assigned_role = role_map.get(role_raw, Role.MUNICIPAL_ANALYST)
        return {
            "sub": f"demo_{role_raw}",
            "username": "dhaka_analyst" if assigned_role == Role.MUNICIPAL_ANALYST else f"demo_{role_raw}",
            "role": assigned_role,
            "organization": "Dhaka North City Corporation (DNCC)",
        }

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please re-authenticate.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """Dependency: Extract current user payload from token or return public guest"""
    if not token:
        # Default unauthenticated access to public portal guest
        return {
            "sub": "public_guest",
            "username": "public_guest",
            "role": Role.PUBLIC_PORTAL,
            "organization": "Citizen Public Transparency Portal",
        }
    return decode_access_token(token)


def require_role(allowed_roles: List[str]):
    """
    FastAPI RBAC Dependency Factory:
    Ensures the user has an allowed role or a role with higher hierarchical privilege.
    """
    def role_checker(current_user: Dict[str, Any] = Depends(get_current_user)):
        user_role = current_user.get("role", Role.PUBLIC_PORTAL)
        user_weight = ROLE_HIERARCHY.get(user_role, 0)
        min_required_weight = min([ROLE_HIERARCHY.get(r, 999) for r in allowed_roles])

        if user_weight < min_required_weight and user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Role '{user_role}' does not have sufficient permissions for this resource.",
            )
        return current_user

    return role_checker

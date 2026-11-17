from typing import Optional, Dict, Any
from app.db.session import SessionLocal
from app.db.models import AuditLog

SENSITIVE_KEYS = {"password", "token", "secret", "authorization", "api_key", "key"}


def sanitize_payload(payload: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Recursively scrub sensitive keys from audit logging payloads"""
    if not payload or not isinstance(payload, dict):
        return payload
    sanitized = {}
    for k, v in payload.items():
        if any(sens in k.lower() for sens in SENSITIVE_KEYS):
            sanitized[k] = "[REDACTED]"
        elif isinstance(v, dict):
            sanitized[k] = sanitize_payload(v)
        else:
            sanitized[k] = v
    return sanitized


def log_audit_event(
    actor_role: str,
    action_type: str,
    endpoint: str,
    payload_summary: Optional[Dict[str, Any]] = None,
) -> None:
    """
    Log an event to the immutable audit_logs table.
    Designed to run non-blockingly via FastAPI BackgroundTasks.
    """
    db = SessionLocal()
    try:
        clean_payload = sanitize_payload(payload_summary)
        entry = AuditLog(
            actor_role=actor_role,
            action_type=action_type,
            endpoint=endpoint,
            payload_summary=clean_payload,
        )
        db.add(entry)
        db.commit()
    except Exception as e:
        db.rollback()
        # Fallback print, ensure API responses are never disrupted by logging failures
        print(f"[Audit Log Error] Failed to persist audit event: {e}")
    finally:
        db.close()

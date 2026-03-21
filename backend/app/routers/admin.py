"""
Admin moderation panel router.
Provides endpoints to list flagged messages and manage user violations.
Protected by admin role check.
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from supabase import Client
from typing import List
from ..models.schemas import FlaggedMessageResponse, WarnUserRequest, SuspendUserRequest
from ..core.database import get_supabase
from ..core.security import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin"])


def _require_admin(current_user: dict, supabase: Client):
    """Raise 403 if user is not an admin."""
    profile = supabase.table("profiles").select("role").eq("id", current_user["sub"]).execute()
    if not profile.data or profile.data[0].get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")


@router.get("/flagged-messages", response_model=List[FlaggedMessageResponse])
async def get_flagged_messages(
    limit: int = Query(50, le=200),
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Get all flagged messages for admin review."""
    _require_admin(current_user, supabase)
    result = supabase.table("messages").select(
        "*, profiles(full_name)"
    ).eq("is_flagged", True).order("created_at", desc=True).limit(limit).execute()

    messages = []
    for msg in (result.data or []):
        profile_data = msg.pop("profiles", None)
        msg["sender_name"] = profile_data.get("full_name") if profile_data else None
        messages.append(msg)
    return messages


@router.get("/users/warnings")
async def get_users_with_warnings(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Get users with one or more warnings."""
    _require_admin(current_user, supabase)
    result = supabase.table("profiles").select(
        "id, full_name, email, warning_count, is_suspended"
    ).gt("warning_count", 0).order("warning_count", desc=True).execute()
    return result.data or []


@router.post("/users/warn")
async def warn_user(
    body: WarnUserRequest,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Manually issue a warning to a user."""
    _require_admin(current_user, supabase)
    profile = supabase.table("profiles").select("warning_count").eq("id", str(body.user_id)).execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="User not found")
    new_count = (profile.data[0].get("warning_count") or 0) + 1
    supabase.table("profiles").update({"warning_count": new_count}).eq("id", str(body.user_id)).execute()
    return {"message": f"Warning issued. Total warnings: {new_count}", "reason": body.reason}


@router.post("/users/suspend")
async def suspend_user(
    body: SuspendUserRequest,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Manually suspend a user."""
    _require_admin(current_user, supabase)
    supabase.table("profiles").update({"is_suspended": True}).eq("id", str(body.user_id)).execute()
    return {"message": "User suspended", "reason": body.reason}


@router.post("/users/{user_id}/unsuspend")
async def unsuspend_user(
    user_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Lift a suspension on a user."""
    _require_admin(current_user, supabase)
    supabase.table("profiles").update({"is_suspended": False, "warning_count": 0}).eq("id", user_id).execute()
    return {"message": "User unsuspended and warnings cleared"}


@router.delete("/messages/{message_id}")
async def delete_flagged_message(
    message_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Delete a flagged message."""
    _require_admin(current_user, supabase)
    supabase.table("messages").delete().eq("id", message_id).execute()
    return {"message": "Message deleted"}

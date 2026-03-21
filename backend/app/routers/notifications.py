"""
Notifications router: fetch and mark notifications as read.
"""
from fastapi import APIRouter, HTTPException, Depends
from supabase import Client
from typing import List
from ..models.schemas import NotificationResponse
from ..core.database import get_supabase
from ..core.security import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Get all notifications for the current user, ordered by newest first."""
    user_id = current_user["sub"]
    result = supabase.table("notifications").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return result.data or []

@router.put("/{notification_id}/read", response_model=NotificationResponse)
async def mark_as_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Mark a single notification as read."""
    user_id = current_user["sub"]
    result = supabase.table("notifications").update({"is_read": True}).match(
        {"id": notification_id, "user_id": user_id}
    ).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Notification not found")
    return result.data[0]

@router.put("/read-all", response_model=dict)
async def mark_all_as_read(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Mark all notifications as read for the current user."""
    user_id = current_user["sub"]
    supabase.table("notifications").update({"is_read": True}).eq("user_id", user_id).eq("is_read", False).execute()
    return {"message": "All notifications marked as read"}

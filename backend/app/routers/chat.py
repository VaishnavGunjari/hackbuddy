"""
Chat router: REST API for team messages with ML moderation integration.
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from supabase import Client
from typing import List, Optional
import uuid
from ..models.schemas import MessageCreate, MessageResponse
from ..core.database import get_supabase
from ..core.security import get_current_user
from ..services.ml_moderation import moderate_message

router = APIRouter(prefix="/chat", tags=["Chat"])

WARNING_THRESHOLD = 3   # Warn after this many flagged messages
SUSPEND_THRESHOLD = 5   # Suspend after this many flagged messages


@router.post("/messages", response_model=MessageResponse, status_code=201)
async def send_message(
    message: MessageCreate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """
    Send a message to a team chat.
    Automatically runs ML moderation and flags/warns/suspends if needed.
    """
    user_id = current_user["sub"]

    # Verify the user is part of the team
    membership = supabase.table("team_members").select("user_id").match(
        {"team_id": str(message.team_id), "user_id": user_id}
    ).execute()
    if not membership.data:
        raise HTTPException(status_code=403, detail="You must be a team member to send messages")

    # Run ML moderation
    mod_result = moderate_message(message.content)
    is_flagged = mod_result["is_toxic"]
    flag_reason = ", ".join(mod_result["reasons"]) if is_flagged else None

    msg_data = {
        "id": str(uuid.uuid4()),
        "team_id": str(message.team_id),
        "sender_id": user_id,
        "content": message.content,
        "is_flagged": is_flagged,
        "flag_reason": flag_reason,
    }
    result = supabase.table("messages").insert(msg_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to send message")

    # Handle moderation consequences
    if is_flagged:
        _handle_moderation_violation(user_id, supabase)

    saved_msg = result.data[0]
    # Enrich with sender name
    profile = supabase.table("profiles").select("full_name").eq("id", user_id).execute()
    if profile.data:
        saved_msg["sender_name"] = profile.data[0]["full_name"]

    return saved_msg

@router.get("/unread-count")
async def get_unread_chat_count(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
) -> dict:
    """Calculate total unread messages breakdown per team and friend for the current user."""
    user_id = current_user["sub"]
    unread_count = 0
    teams_breakdown = {}
    friends_breakdown = {}

    # 1. Unread friend messages
    fm_result = supabase.table("friend_messages").select("sender_id").eq("receiver_id", user_id).eq("is_read", False).execute()
    for row in (fm_result.data or []):
        sender = row["sender_id"]
        friends_breakdown[sender] = friends_breakdown.get(sender, 0) + 1
        unread_count += 1

    # 2. Unread team messages
    memberships = supabase.table("team_members").select("team_id, last_read_at").eq("user_id", user_id).execute()
    for row in (memberships.data or []):
        team_id = row["team_id"]
        last_read_at = row["last_read_at"]
        if last_read_at:
            m_res = supabase.table("messages").select("id", count="exact").eq("team_id", team_id).neq("sender_id", user_id).gt("created_at", last_read_at).execute()
        else:
            m_res = supabase.table("messages").select("id", count="exact").eq("team_id", team_id).neq("sender_id", user_id).execute()
        
        c = m_res.count or 0
        if c > 0:
            teams_breakdown[team_id] = c
            unread_count += c

    return {
        "unread_count": unread_count,
        "teams": teams_breakdown,
        "friends": friends_breakdown
    }


@router.get("/messages/{team_id}", response_model=List[MessageResponse])
async def get_team_messages(
    team_id: str,
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Get paginated messages for a team chat."""
    # Verify membership
    membership = supabase.table("team_members").select("user_id").match(
        {"team_id": team_id, "user_id": current_user["sub"]}
    ).execute()
    if not membership.data:
        raise HTTPException(status_code=403, detail="Not a team member")

    # Mark as read for this user
    supabase.table("team_members").update({"last_read_at": "now()"}).match(
        {"team_id": team_id, "user_id": current_user["sub"]}
    ).execute()

    result = supabase.table("messages").select(
        "*, profiles(full_name)"
    ).eq("team_id", team_id).order("created_at").range(offset, offset + limit - 1).execute()

    messages = []
    for msg in (result.data or []):
        profile_data = msg.pop("profiles", None)
        if profile_data:
            msg["sender_name"] = profile_data.get("full_name")
        messages.append(msg)
    return messages


def _handle_moderation_violation(user_id: str, supabase: Client):
    """Increment warning count and suspend user if threshold exceeded."""
    profile = supabase.table("profiles").select("warning_count, is_suspended, email, full_name").eq("id", user_id).execute()
    if not profile.data:
        return
    user = profile.data[0]
    new_count = (user.get("warning_count") or 0) + 1
    update_data: dict = {"warning_count": new_count}

    if new_count >= SUSPEND_THRESHOLD:
        update_data["is_suspended"] = True
    supabase.table("profiles").update(update_data).eq("id", user_id).execute()

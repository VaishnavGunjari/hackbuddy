"""
Friends router: REST API for friend connections and 1-on-1 private messaging.
Note: Friend chats bypass ML moderation for privacy.
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from supabase import Client
from typing import List
import uuid

from ..models.schemas import FriendResponse, FriendMessageCreate, FriendMessageResponse
from ..core.database import get_supabase
from ..core.security import get_current_user

router = APIRouter(prefix="/friends", tags=["Friends"])

# ─── Friend Requests & Management ─────────────────────────────────────────────

@router.post("/request/{user_id}", status_code=201)
async def send_friend_request(
    user_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Send a friend request to another user."""
    requester_id = current_user["sub"]
    if requester_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot send a friend request to yourself")

    # Check if request or friendship already exists in either direction
    existing = supabase.table("friends").select("*").or_(
        f"and(requester_id.eq.{requester_id},receiver_id.eq.{user_id}),"
        f"and(requester_id.eq.{user_id},receiver_id.eq.{requester_id})"
    ).execute()

    if existing.data:
        raise HTTPException(status_code=400, detail="Friend request or connection already exists")

    data = {
        "id": str(uuid.uuid4()),
        "requester_id": requester_id,
        "receiver_id": user_id,
        "status": "pending"
    }
    result = supabase.table("friends").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to send friend request")

    # Create notification with requester name and id
    profile_res = supabase.table("profiles").select("full_name").eq("id", requester_id).execute()
    requester_name = profile_res.data[0]["full_name"] if profile_res.data else "Someone"

    notif = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": "friend_request",
        "content": f"{requester_name} sent you a friend request.",
        "related_id": requester_id
    }
    supabase.table("notifications").insert(notif).execute()

    return {"message": "Friend request sent"}


@router.get("/requests", response_model=List[FriendResponse])
async def get_friend_requests(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """List pending incoming and outgoing friend requests for the current user."""
    user_id = current_user["sub"]

    # Incoming requests
    incoming = supabase.table("friends").select("*, profiles!receiver_id(full_name, avatar_url, email)").eq("receiver_id", user_id).eq("status", "pending").execute()
    
    requests = []
    for req in (incoming.data or []):
        requests.append({
            **req,
            "friend_profile": req.pop("profiles", None)
        })

    # Outgoing requests
    outgoing = supabase.table("friends").select("*, profiles!requester_id(full_name, avatar_url, email)").eq("requester_id", user_id).eq("status", "pending").execute()
    
    for req in (outgoing.data or []):
        requests.append({
            **req,
            "friend_profile": req.pop("profiles", None)
        })

    # Above profiles alias might be tricky in raw supabase postgrest if there are multiple foreign keys targeting profiles.
    # To fix potential error, let's fetch profiles manually.

    return requests


@router.get("/pending", response_model=List[dict])
async def get_pending_friends(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    user_id = current_user["sub"]
    result = supabase.table("friends").select("*").or_(
        f"requester_id.eq.{user_id},receiver_id.eq.{user_id}"
    ).eq("status", "pending").execute()
    
    output = []
    for row in (result.data or []):
        other_id = row['requester_id'] if row['receiver_id'] == user_id else row['receiver_id']
        prof = supabase.table("profiles").select("id, full_name, avatar_url, email").eq("id", other_id).execute()
        if prof.data:
            row["friend_profile"] = prof.data[0]
        row["is_incoming"] = (row['receiver_id'] == user_id)
        output.append(row)
    return output


@router.post("/requests/{request_id}/accept")
async def accept_friend_request(
    request_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Accept an incoming friend request."""
    user_id = current_user["sub"]
    req = supabase.table("friends").select("*").eq("id", request_id).execute()
    if not req.data:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if req.data[0]["receiver_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to accept this request")

    res = supabase.table("friends").update({"status": "accepted"}).eq("id", request_id).execute()
    
    # Send notification back
    profile_res = supabase.table("profiles").select("full_name").eq("id", user_id).execute()
    accepter_name = profile_res.data[0]["full_name"] if profile_res.data else "Someone"

    notif = {
        "id": str(uuid.uuid4()),
        "user_id": req.data[0]["requester_id"],
        "type": "friend_accepted",
        "content": f"{accepter_name} accepted your friend request.",
        "related_id": user_id
    }
    supabase.table("notifications").insert(notif).execute()
    
    return {"message": "Friend request accepted"}


@router.post("/requests/{request_id}/reject")
async def reject_friend_request(
    request_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Reject an incoming friend request or cancel an outgoing one."""
    user_id = current_user["sub"]
    req = supabase.table("friends").select("*").eq("id", request_id).execute()
    if not req.data:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if req.data[0]["receiver_id"] != user_id and req.data[0]["requester_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this request")

    supabase.table("friends").delete().eq("id", request_id).execute()
    return {"message": "Friend request rejected/cancelled"}


@router.get("/", response_model=List[dict])
async def list_friends(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Get the list of accepted friends."""
    user_id = current_user["sub"]
    result = supabase.table("friends").select("*").eq("status", "accepted").or_(
        f"requester_id.eq.{user_id},receiver_id.eq.{user_id}"
    ).execute()

    friends_list = []
    for row in (result.data or []):
        friend_id = row["requester_id"] if row["receiver_id"] == user_id else row["receiver_id"]
        # get friend profile
        prof = supabase.table("profiles").select("id, full_name, avatar_url, email").eq("id", friend_id).execute()
        if prof.data:
            friends_list.append(prof.data[0])

    return friends_list


# ─── Friend Messages ──────────────────────────────────────────────────────────

@router.get("/{friend_id}/messages", response_model=List[FriendMessageResponse])
async def get_friend_messages(
    friend_id: str,
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Get chat history with a friend."""
    user_id = current_user["sub"]
    
    # check friendship
    friendship = supabase.table("friends").select("*").eq("status", "accepted").or_(
        f"and(requester_id.eq.{user_id},receiver_id.eq.{friend_id}),"
        f"and(requester_id.eq.{friend_id},receiver_id.eq.{user_id})"
    ).execute()
    if not friendship.data:
        raise HTTPException(status_code=403, detail="Not friends with this user")

    # Mark as read for this user
    supabase.table("friend_messages").update({"is_read": True}).match(
        {"sender_id": friend_id, "receiver_id": user_id, "is_read": False}
    ).execute()

    result = supabase.table("friend_messages").select("*, profiles!sender_id(full_name)").or_(
        f"and(sender_id.eq.{user_id},receiver_id.eq.{friend_id}),"
        f"and(sender_id.eq.{friend_id},receiver_id.eq.{user_id})"
    ).order("created_at").range(offset, offset + limit - 1).execute()

    messages = []
    for msg in (result.data or []):
        profile_data = msg.pop("profiles", None)
        if profile_data:
            msg["sender_name"] = profile_data.get("full_name")
        messages.append(msg)
    return messages


@router.post("/messages", response_model=FriendMessageResponse, status_code=201)
async def send_friend_message(
    message: FriendMessageCreate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """
    Send a message to a friend.
    Bypasses ML moderation.
    """
    user_id = current_user["sub"]
    friend_id = str(message.receiver_id)

    # check friendship
    friendship = supabase.table("friends").select("*").eq("status", "accepted").or_(
        f"and(requester_id.eq.{user_id},receiver_id.eq.{friend_id}),"
        f"and(requester_id.eq.{friend_id},receiver_id.eq.{user_id})"
    ).execute()
    
    if not friendship.data:
        raise HTTPException(status_code=403, detail="Not friends with this user")

    msg_data = {
        "id": str(uuid.uuid4()),
        "sender_id": user_id,
        "receiver_id": friend_id,
        "content": message.content,
    }
    result = supabase.table("friend_messages").insert(msg_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to send message")

    saved_msg = result.data[0]
    # enrich with sender
    profile = supabase.table("profiles").select("full_name").eq("id", user_id).execute()
    if profile.data:
        saved_msg["sender_name"] = profile.data[0]["full_name"]

    return saved_msg

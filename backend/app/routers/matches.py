from fastapi import APIRouter, Depends, HTTPException, Body
from supabase import Client
from pydantic import BaseModel
from uuid import UUID
from typing import List
from ..core.database import get_supabase
from ..core.security import get_current_user
from ..services.ai_matching import calculate_compatibility, suggest_roles

router = APIRouter(prefix="/matches", tags=["matches"])

class SwipeAction(BaseModel):
    target_user_id: UUID
    action: str  # 'like' or 'dislike'

@router.get("/potential")
def get_potential_matches(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    user_id = current_user["sub"]
    
    # Get all users we've already swiped on
    swipes_res = supabase.table("user_swipes").select("target_user_id").eq("user_id", user_id).execute()
    swiped_ids = [row["target_user_id"] for row in (swipes_res.data or [])]
    swiped_ids.append(user_id) # also exclude self

    # Fetch all profiles 
    profiles_res = supabase.table("profiles").select(
        "id, full_name, bio, skills, college, experience_level, hackathon_interests, avatar_url, cover_url, github_url, linkedin_url"
    ).execute()
    
    all_profiles = profiles_res.data or []
    # Filter locally (for MVP scales well enough up to 10k users)
    potential = [p for p in all_profiles if p["id"] not in swiped_ids]
    
    # Only send a reasonable batch like top 20
    return potential[:20]

@router.post("/swipe")
def record_swipe(
    swipe: SwipeAction,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    user_id = current_user["sub"]
    target_id = str(swipe.target_user_id)
    action = swipe.action

    # 1. Store the swipe
    existing_swipe = supabase.table("user_swipes").select("id").match({
        "user_id": user_id,
        "target_user_id": target_id
    }).execute()
    
    if existing_swipe.data:
        supabase.table("user_swipes").update({"action": action}).match({
            "user_id": user_id,
            "target_user_id": target_id
        }).execute()
    else:
        supabase.table("user_swipes").insert({
            "user_id": user_id,
            "target_user_id": target_id,
            "action": action
        }).execute()

    if action == 'like':
        # Check if inverse like exists
        inverse_res = supabase.table("user_swipes").select("*").match({
            "user_id": target_id,
            "target_user_id": user_id,
            "action": "like"
        }).execute()

        if inverse_res.data:
            # IT'S A MATCH!
            user1, user2 = min(user_id, target_id), max(user_id, target_id)
            
            # Store in user_matches
            existing_match = supabase.table("user_matches").select("id").match({
                "user1_id": user1, "user2_id": user2
            }).execute()
            if not existing_match.data:
                supabase.table("user_matches").insert({
                    "user1_id": user1, "user2_id": user2
                }).execute()
            
            # Add to friends list so they can chat automatically
            existing_friend = supabase.table("friends").select("id").match({
                "requester_id": user1, "receiver_id": user2
            }).execute()
            if not existing_friend.data:
                supabase.table("friends").insert({
                    "requester_id": user1,
                    "receiver_id": user2,
                    "status": "accepted"
                }).execute()

            # Notifications to both
            supabase.table("notifications").insert([
                {"user_id": user_id, "type": "match", "content": "You got a new match! Say hi in the chat.", "related_id": target_id},
                {"user_id": target_id, "type": "match", "content": "You got a new match! Say hi in the chat.", "related_id": user_id}
            ]).execute()

            return {"message": "It's a match!", "match": True}
        else:
            # Normal Like notification
            p_res = supabase.table("profiles").select("full_name").eq("id", user_id).execute()
            name = p_res.data[0]["full_name"] if p_res.data else "Someone"
            
            supabase.table("notifications").insert({
                "user_id": target_id,
                "type": "like",
                "content": f"{name} liked your profile!",
                "related_id": user_id
            }).execute()
            
            return {"message": "Liked!", "match": False}

    return {"message": "Passed", "match": False}

@router.delete("/undo/{target_user_id}")
def undo_swipe(
    target_user_id: UUID,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    user_id = current_user["sub"]
    supabase.table("user_swipes").delete().match({
        "user_id": user_id,
        "target_user_id": str(target_user_id)
    }).execute()
    
    return {"message": "Undo successful"}

# --- AI Matching & Scoring ---

@router.post("/score")
def get_score(user_skills: List[str] = Body(...), required_skills: List[str] = Body(...)):
    score = calculate_compatibility(user_skills, required_skills)
    return {"compatibility_score": score}

@router.post("/roles")
def predict_role(skills: List[str] = Body(...)):
    roles = suggest_roles(skills)
    return {"suggested_roles": roles}

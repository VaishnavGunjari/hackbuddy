from fastapi import APIRouter, Depends, HTTPException, Body
from supabase import Client
from pydantic import BaseModel
from uuid import UUID
import os
from typing import List
from ..services.ai_matching import calculate_compatibility, suggest_roles

router = APIRouter(prefix="/matches", tags=["matches"])

def get_supabase() -> Client:
    from supabase import create_client
    url: str = os.getenv("VITE_SUPABASE_URL")
    key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    return create_client(url, key)

class SwipeRequest(BaseModel):
    swiper_id: UUID
    swipee_id: UUID
    hackathon_id: UUID
    direction: str  # 'right' or 'left'

@router.post("/swipe")
async def record_swipe(swipe: SwipeRequest, supabase: Client = Depends(get_supabase)):
    # 1. Record the swipe
    swipe_data = swipe.dict()
    swipe_data["swiper_id"] = str(swipe.swiper_id)
    swipe_data["swipee_id"] = str(swipe.swipee_id)
    swipe_data["hackathon_id"] = str(swipe.hackathon_id)
    
    # Check if already swiped
    existing = supabase.table("swipes").select("*").match({
        "swiper_id": swipe_data["swiper_id"], 
        "swipee_id": swipe_data["swipee_id"],
        "hackathon_id": swipe_data["hackathon_id"]
    }).execute()
    
    if existing.data:
        return {"message": "Already swiped", "match": False}

    supabase.table("swipes").insert(swipe_data).execute()

    # 2. Check for Match (only if right swipe)
    if swipe.direction == 'right':
        # Check if the other person also swiped right on us
        reverse_swipe = supabase.table("swipes").select("*").match({
            "swiper_id": swipe_data["swipee_id"],
            "swipee_id": swipe_data["swiper_id"],
            "hackathon_id": swipe_data["hackathon_id"],
            "direction": "right"
        }).execute()

        if reverse_swipe.data:
            # IT'S A MATCH!
            match_data = {
                "user1_id": min(swipe_data["swiper_id"], swipe_data["swipee_id"]),
                "user2_id": max(swipe_data["swiper_id"], swipe_data["swipee_id"]),
                "hackathon_id": swipe_data["hackathon_id"]
            }
            supabase.table("matches").insert(match_data).execute()
            return {"message": "It's a match!", "match": True}

    return {"message": "Swipe recorded", "match": False}

# --- AI Matching & Scoring ---

@router.post("/score")
def get_score(user_skills: List[str] = Body(...), required_skills: List[str] = Body(...)):
    score = calculate_compatibility(user_skills, required_skills)
    return {"compatibility_score": score}

@router.post("/roles")
def predict_role(skills: List[str] = Body(...)):
    roles = suggest_roles(skills)
    return {"suggested_roles": roles}

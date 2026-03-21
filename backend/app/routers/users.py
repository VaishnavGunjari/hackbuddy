"""
Users router: profile management, skill search, and teammate discovery.
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from supabase import Client
from typing import List, Optional
from ..models.schemas import UserProfileUpdate, UserProfileResponse
from ..core.database import get_supabase
from ..core.security import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserProfileResponse)
async def get_my_profile(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Get authenticated user's profile."""
    result = supabase.table("profiles").select("*").eq("id", current_user["sub"]).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    user = result.data[0]
    user.pop("password_hash", None)
    return user


@router.put("/me", response_model=UserProfileResponse)
async def update_my_profile(
    profile_data: UserProfileUpdate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Update authenticated user's profile."""
    data = profile_data.model_dump(exclude_none=True)
    result = supabase.table("profiles").update(data).eq("id", current_user["sub"]).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Could not update profile")
    user = result.data[0]
    user.pop("password_hash", None)
    return user


@router.get("/{user_id}", response_model=UserProfileResponse)
async def get_user_profile(
    user_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Get another user's profile (contact info hidden unless accepted)."""
    result = supabase.table("profiles").select("*").eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    user = result.data[0]
    user.pop("password_hash", None)
    # Privacy: hide email unless the viewer is looking at their own profile
    if user_id != current_user["sub"]:
        user.pop("email", None)
    return user


@router.get("/", response_model=List[UserProfileResponse])
async def search_users(
    skills: Optional[str] = Query(None, description="Comma-separated skill names, e.g. 'AI/ML,Backend'"),
    experience: Optional[str] = Query(None),
    college: Optional[str] = Query(None),
    limit: int = Query(20, le=100),
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """
    Search / filter users by skills, experience level, or college.
    Useful for the Team Finder feature.
    """
    query = supabase.table("profiles").select("id, full_name, college, skills, experience_level, hackathon_interests, bio, avatar_url, role")
    
    if college:
        query = query.ilike("college", f"%{college}%")
    if experience:
        query = query.eq("experience_level", experience)

    result = query.neq("id", current_user["sub"]).limit(limit).execute()
    users = result.data or []

    # Filter by skills in Python (Supabase array containment is tricky via REST)
    if skills:
        required_skills = [s.strip() for s in skills.split(",")]
        users = [
            u for u in users
            if any(skill in (u.get("skills") or []) for skill in required_skills)
        ]

    return users

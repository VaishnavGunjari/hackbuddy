"""
Hackathons router: list, create, and filter hackathon events.
"""
from fastapi import APIRouter, HTTPException, Depends
from supabase import Client
from typing import List
import uuid
from ..models.schemas import HackathonCreate, HackathonResponse
from ..core.database import get_supabase
from ..core.security import get_current_user

router = APIRouter(prefix="/hackathons", tags=["Hackathons"])


@router.get("/", response_model=List[HackathonResponse])
async def list_hackathons(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """List all active hackathon events."""
    result = supabase.table("hackathons").select("*").eq("is_active", True).order("start_date").execute()
    return result.data or []


@router.post("/", response_model=HackathonResponse, status_code=201)
async def create_hackathon(
    hackathon: HackathonCreate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Create a new hackathon event (any logged-in user can post)."""
    data = hackathon.model_dump()
    data["id"] = str(uuid.uuid4())
    data["organizer_id"] = current_user["sub"]
    data["is_active"] = True
    # Convert datetime to ISO string for Supabase
    if data.get("start_date"):
        data["start_date"] = data["start_date"].isoformat()
    if data.get("end_date"):
        data["end_date"] = data["end_date"].isoformat()
    result = supabase.table("hackathons").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Could not create hackathon")
    return result.data[0]


@router.get("/{hackathon_id}", response_model=HackathonResponse)
async def get_hackathon(
    hackathon_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Get a specific hackathon."""
    result = supabase.table("hackathons").select("*").eq("id", hackathon_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    return result.data[0]

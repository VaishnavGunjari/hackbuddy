"""
Auth router: /auth/register and /auth/login
Custom JWT-based authentication backed by Supabase profiles table.
"""
from fastapi import APIRouter, HTTPException, status, Depends
from supabase import Client
from ..models.schemas import UserRegister, UserLogin, Token
from ..core.database import get_supabase
from ..core.security import hash_password, verify_password, create_access_token, get_current_user
import uuid


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, supabase: Client = Depends(get_supabase)):
    """Register a new user with email and password."""
    try:
        # Check if email already exists
        existing = supabase.table("profiles").select("id").eq("email", user_data.email).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Email already registered")

        # Create the profile row
        user_id = str(uuid.uuid4())
        hashed_pw = hash_password(user_data.password)
        profile = {
            "id": user_id,
            "email": user_data.email,
            "full_name": user_data.full_name,
            "password_hash": hashed_pw,
            "role": "participant",
            "warning_count": 0,
            "is_suspended": False,
            "skills": [],
            "hackathon_interests": [],
        }
        result = supabase.table("profiles").insert(profile).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create user")

        token = create_access_token({"sub": user_id, "email": user_data.email})
        return Token(access_token=token)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Server err: {str(e)}")



@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, supabase: Client = Depends(get_supabase)):
    """Login with email/password and receive a JWT token."""
    result = supabase.table("profiles").select("id, email, password_hash, is_suspended").eq("email", credentials.email).execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user = result.data[0]
    
    try:
        is_valid = verify_password(credentials.password, user["password_hash"])
    except ValueError:
        # Happens if the hash is empty or not a valid bcrypt string
        is_valid = False

    if not is_valid:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if user.get("is_suspended"):
        raise HTTPException(status_code=403, detail="Account suspended for repeated policy violations")

    token = create_access_token({"sub": user["id"], "email": user["email"]})
    return Token(access_token=token)


@router.get("/me")
async def get_me(supabase: Client = Depends(get_supabase), token_data: dict = Depends(get_current_user)):

    """Get the currently authenticated user's profile."""
    user_id = token_data["sub"]
    result = supabase.table("profiles").select("*").eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    user = result.data[0]
    user.pop("password_hash", None)  # Never expose hash
    return user

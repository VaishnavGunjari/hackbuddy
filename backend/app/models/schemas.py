"""
All Pydantic schemas for request/response validation in Hackbuddy.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime
from uuid import UUID


# ─── Auth ─────────────────────────────────────────────────────────────────────
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None


# ─── User Profile ─────────────────────────────────────────────────────────────
SKILL_OPTIONS = [
    "AI/ML", "Web Dev", "Backend", "UI/UX", "Data Science",
    "Mobile Dev", "DevOps", "Blockchain", "Cybersecurity", "Other"
]

EXPERIENCE_OPTIONS = ["Beginner", "Intermediate", "Advanced", "Expert"]

class UserProfileBase(BaseModel):
    full_name: str
    college: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[List[str]] = []
    experience_level: Optional[str] = None
    hackathon_interests: Optional[List[str]] = []
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    avatar_url: Optional[str] = None
    cover_url: Optional[str] = None
    role: str = "participant"

class UserProfileCreate(UserProfileBase):
    id: UUID

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    college: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    experience_level: Optional[str] = None
    hackathon_interests: Optional[List[str]] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    avatar_url: Optional[str] = None
    cover_url: Optional[str] = None

class UserProfileResponse(UserProfileBase):
    id: UUID
    email: Optional[str] = None
    warning_count: int = 0
    is_suspended: bool = False
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─── Team ─────────────────────────────────────────────────────────────────────
class TeamCreate(BaseModel):
    name: str
    description: Optional[str] = None
    hackathon_name: Optional[str] = None
    required_skills: Optional[List[str]] = []
    max_members: int = 4

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    hackathon_name: Optional[str] = None
    required_skills: Optional[List[str]] = None
    max_members: Optional[int] = None

class TeamResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    hackathon_name: Optional[str] = None
    required_skills: Optional[List[str]] = []
    max_members: int
    created_by: UUID
    created_at: Optional[datetime] = None
    member_count: Optional[int] = 0

    class Config:
        from_attributes = True


# ─── Join Requests ────────────────────────────────────────────────────────────
class JoinRequestResponse(BaseModel):
    id: UUID
    team_id: UUID
    user_id: UUID
    status: str  # "pending", "accepted", "rejected"
    created_at: Optional[datetime] = None
    profiles: Optional[dict] = None

# ─── Notifications ────────────────────────────────────────────────────────────
class NotificationResponse(BaseModel):
    id: UUID
    user_id: UUID
    type: str
    content: str
    related_id: Optional[UUID] = None
    is_read: bool = False
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─── Messages ─────────────────────────────────────────────────────────────────
class MessageCreate(BaseModel):
    team_id: UUID
    content: str = Field(..., max_length=2000)

class MessageResponse(BaseModel):
    id: UUID
    team_id: UUID
    sender_id: UUID
    content: str
    is_flagged: bool = False
    flag_reason: Optional[str] = None
    created_at: Optional[datetime] = None
    sender_name: Optional[str] = None

    class Config:
        from_attributes = True


# ─── Hackathons ───────────────────────────────────────────────────────────────
class HackathonBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_date: datetime
    end_date: datetime
    location: Optional[str] = "Remote"
    banner_url: Optional[str] = None
    prize_pool: Optional[str] = None
    website_url: Optional[str] = None

class HackathonCreate(HackathonBase):
    pass

class HackathonResponse(HackathonBase):
    id: UUID
    organizer_id: UUID
    is_active: bool = True
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─── Moderation ───────────────────────────────────────────────────────────────
class ModerationResult(BaseModel):
    is_toxic: bool
    confidence: float
    reasons: List[str] = []

class FlaggedMessageResponse(BaseModel):
    id: UUID
    team_id: UUID
    sender_id: UUID
    content: str
    flag_reason: Optional[str] = None
    created_at: Optional[datetime] = None
    sender_name: Optional[str] = None

class WarnUserRequest(BaseModel):
    user_id: UUID
    reason: str

class SuspendUserRequest(BaseModel):
    user_id: UUID
    reason: str

# ─── Friends ──────────────────────────────────────────────────────────────────
class FriendRequestAction(BaseModel):
    action: str  # e.g. "accept" or "reject"

class FriendResponse(BaseModel):
    id: UUID
    requester_id: UUID
    receiver_id: UUID
    status: str
    created_at: Optional[datetime] = None
    friend_profile: Optional[dict] = None

    class Config:
        from_attributes = True

class FriendMessageCreate(BaseModel):
    receiver_id: UUID
    content: str = Field(..., max_length=2000)

class FriendMessageResponse(BaseModel):
    id: UUID
    sender_id: UUID
    receiver_id: UUID
    content: str
    created_at: Optional[datetime] = None
    sender_name: Optional[str] = None

    class Config:
        from_attributes = True

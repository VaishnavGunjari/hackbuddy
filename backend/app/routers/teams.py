"""
Teams router: create, join, manage teams, and handle join requests.
"""
from fastapi import APIRouter, HTTPException, Depends, Body
from supabase import Client
from typing import List
import uuid
from ..models.schemas import TeamCreate, TeamUpdate, TeamResponse, JoinRequestResponse
from ..core.database import get_supabase
from ..core.security import get_current_user
from ..services.email import send_email_notification

router = APIRouter(prefix="/teams", tags=["Teams"])


@router.post("/", response_model=TeamResponse, status_code=201)
async def create_team(
    team: TeamCreate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Create a new team. Creator is automatically added as leader."""
    user_id = current_user["sub"]
    team_data = team.model_dump()
    team_data["id"] = str(uuid.uuid4())
    team_data["created_by"] = user_id

    result = supabase.table("teams").insert(team_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Could not create team")

    new_team = result.data[0]
    # Add creator as leader
    supabase.table("team_members").insert({
        "team_id": new_team["id"],
        "user_id": user_id,
        "role": "leader"
    }).execute()
    new_team["member_count"] = 1
    return new_team


@router.get("/", response_model=List[TeamResponse])
async def list_teams(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """List all available teams with member counts."""
    result = supabase.table("teams").select("*").order("created_at", desc=True).execute()
    teams = result.data or []
    # Enrich with member count
    for team in teams:
        count_res = supabase.table("team_members").select("team_id", count="exact").eq("team_id", team["id"]).execute()
        team["member_count"] = count_res.count or 0
    return teams


@router.get("/my-teams")
async def get_my_teams(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Get all teams the current user is a member of."""
    user_id = current_user["sub"]
    memberships = supabase.table("team_members").select("team_id, role").eq("user_id", user_id).execute()
    team_ids = [m["team_id"] for m in (memberships.data or [])]
    if not team_ids:
        return []
    teams = supabase.table("teams").select("*").in_("id", team_ids).execute()
    return teams.data or []


@router.get("/{team_id}")
async def get_team(
    team_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Get team details including members."""
    result = supabase.table("teams").select("*").eq("id", team_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Team not found")
    team = result.data[0]

    members_res = supabase.table("team_members").select(
        "role, profiles(id, full_name, skills, experience_level, avatar_url)"
    ).eq("team_id", team_id).execute()
    team["members"] = members_res.data or []
    team["member_count"] = len(team["members"])
    return team


@router.put("/{team_id}", response_model=TeamResponse)
async def update_team(
    team_id: str,
    team_data: TeamUpdate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Update team info (leaders only)."""
    _require_team_leader(team_id, current_user["sub"], supabase)
    data = team_data.model_dump(exclude_none=True)
    result = supabase.table("teams").update(data).eq("id", team_id).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Could not update team")
    return result.data[0]


@router.delete("/{team_id}", status_code=204)
async def delete_team(
    team_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Delete a team (leaders only)."""
    _require_team_leader(team_id, current_user["sub"], supabase)
    # The database should cascade delete team_members, join_requests, and messages
    supabase.table("teams").delete().eq("id", team_id).execute()
    return None

@router.post("/{team_id}/request-join")
async def request_to_join(
    team_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Send a join request to a team."""
    user_id = current_user["sub"]
    # Check if already a member
    existing_member = supabase.table("team_members").select("team_id").match(
        {"team_id": team_id, "user_id": user_id}
    ).execute()
    if existing_member.data:
        raise HTTPException(status_code=400, detail="Already a team member")
    # Check for pending request
    existing_req = supabase.table("join_requests").select("id").match(
        {"team_id": team_id, "user_id": user_id, "status": "pending"}
    ).execute()
    if existing_req.data:
        raise HTTPException(status_code=400, detail="Join request already pending")

    req_data = {
        "id": str(uuid.uuid4()),
        "team_id": team_id,
        "user_id": user_id,
        "status": "pending"
    }
    result = supabase.table("join_requests").insert(req_data).execute()

    # Notify team leader via email (in background)
    team_res = supabase.table("teams").select("name, created_by").eq("id", team_id).execute()
    if team_res.data:
        team = team_res.data[0]
        
        # INSERT NOTIFICATION
        supabase.table("notifications").insert({
            "user_id": team["created_by"],
            "type": "join_request",
            "content": f"New join request for your team '{team['name']}'",
            "related_id": team_id
        }).execute()

        leader_res = supabase.table("profiles").select("email, full_name").eq("id", team["created_by"]).execute()
        requester_res = supabase.table("profiles").select("full_name").eq("id", user_id).execute()
        if leader_res.data and requester_res.data:
            leader = leader_res.data[0]
            requester = requester_res.data[0]
            send_email_notification(
                to_email=leader["email"],
                subject=f"New Join Request for {team['name']}",
                body=f"Hi {leader['full_name']},\n\n{requester['full_name']} has requested to join your team '{team['name']}' on Haxion.\n\nReview the request on your team dashboard."
            )

    return {"message": "Join request sent successfully"}


@router.get("/{team_id}/join-requests", response_model=List[JoinRequestResponse])
async def get_join_requests(
    team_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Get pending join requests for a team (leaders only)."""
    _require_team_leader(team_id, current_user["sub"], supabase)
    result = supabase.table("join_requests").select("*, profiles(id, full_name, avatar_url, skills, experience_level)").eq("team_id", team_id).eq("status", "pending").execute()
    return result.data or []


@router.post("/{team_id}/join-requests/{request_id}/accept")
async def accept_join_request(
    team_id: str,
    request_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Accept a join request (leaders only)."""
    _require_team_leader(team_id, current_user["sub"], supabase)
    req = supabase.table("join_requests").select("*").eq("id", request_id).execute()
    if not req.data:
        raise HTTPException(status_code=404, detail="Request not found")
    user_id = req.data[0]["user_id"]

    # Check team capacity
    team_res = supabase.table("teams").select("max_members").eq("id", team_id).execute()
    max_members = team_res.data[0]["max_members"] if team_res.data else 4
    count_res = supabase.table("team_members").select("team_id", count="exact").eq("team_id", team_id).execute()
    if (count_res.count or 0) >= max_members:
        raise HTTPException(status_code=400, detail="Team is already full")

    # Add as member
    supabase.table("team_members").insert({
        "team_id": team_id, "user_id": user_id, "role": "member"
    }).execute()
    # Update request status
    supabase.table("join_requests").update({"status": "accepted"}).eq("id", request_id).execute()

    # Notify user
    user_res = supabase.table("profiles").select("email, full_name").eq("id", user_id).execute()
    team_info = supabase.table("teams").select("name").eq("id", team_id).execute()
    if user_res.data and team_info.data:
        user = user_res.data[0]
        team_name = team_info.data[0]["name"]
        
        # INSERT NOTIFICATION
        supabase.table("notifications").insert({
            "user_id": user_id,
            "type": "request_accepted",
            "content": f"Your request to join '{team_name}' was accepted!",
            "related_id": team_id
        }).execute()

        send_email_notification(
            to_email=user["email"],
            subject=f"You're in! Welcome to {team_name}",
            body=f"Hi {user['full_name']},\n\nCongratulations! Your request to join '{team_name}' has been accepted on Haxion. Time to check the team's chat!"
        )

    return {"message": "Join request accepted"}


@router.post("/{team_id}/join-requests/{request_id}/reject")
async def reject_join_request(
    team_id: str,
    request_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Reject a join request (leaders only)."""
    _require_team_leader(team_id, current_user["sub"], supabase)
    supabase.table("join_requests").update({"status": "rejected"}).eq("id", request_id).execute()
    
    # Notify user
    req = supabase.table("join_requests").select("user_id").eq("id", request_id).execute()
    user_id = req.data[0]["user_id"] if req.data else None
    team_info = supabase.table("teams").select("name").eq("id", team_id).execute()
    if user_id and team_info.data:
        supabase.table("notifications").insert({
            "user_id": user_id,
            "type": "request_rejected",
            "content": f"Your request to join '{team_info.data[0]['name']}' was declined.",
            "related_id": team_id
        }).execute()

    return {"message": "Join request rejected"}


@router.get("/{team_id}/suggest-members")
async def suggest_members(
    team_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """
    Rule-based matching: suggest users who have skills the team is missing.
    """
    team_res = supabase.table("teams").select("required_skills").eq("id", team_id).execute()
    if not team_res.data:
        raise HTTPException(status_code=404, detail="Team not found")
    required_skills = team_res.data[0].get("required_skills") or []
    if not required_skills:
        return []

    # Get current member user IDs
    members_res = supabase.table("team_members").select("user_id").eq("team_id", team_id).execute()
    member_ids = [m["user_id"] for m in (members_res.data or [])]

    # Fetch all users not in the team
    all_users = supabase.table("profiles").select(
        "id, full_name, skills, experience_level, college, bio, avatar_url"
    ).execute().data or []

    suggestions = []
    for user in all_users:
        if user["id"] in member_ids:
            continue
        user_skills = user.get("skills") or []
        matching = [s for s in required_skills if s in user_skills]
        if matching:
            suggestions.append({**user, "matching_skills": matching, "match_score": len(matching)})

    suggestions.sort(key=lambda x: x["match_score"], reverse=True)
    return suggestions[:20]


@router.post("/{team_id}/invite")
async def invite_member(
    team_id: str,
    target_user_id: str = Body(..., embed=True),
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Invite a user to the team (leaders only). Sends a notification to the target user."""
    _require_team_leader(team_id, current_user["sub"], supabase)
    
    team_info = supabase.table("teams").select("name").eq("id", team_id).execute()
    team_name = team_info.data[0]["name"] if team_info.data else "A team"

    notif = {
        "id": str(uuid.uuid4()),
        "user_id": target_user_id,
        "type": "team_invite",
        "content": f"You've been invited to join the team '{team_name}'.",
        "related_id": team_id
    }
    supabase.table("notifications").insert(notif).execute()
    return {"message": "Invitation sent successfully"}


@router.post("/{team_id}/accept-invite")
async def accept_team_invite(
    team_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Accept a team invitation."""
    user_id = current_user["sub"]
    
    # Verify the user has an invite notification
    invite = supabase.table("notifications").select("id").match({
        "user_id": user_id,
        "type": "team_invite",
        "related_id": team_id
    }).execute()

    if not invite.data:
        raise HTTPException(status_code=403, detail="No invitation found for this team.")

    # Check capacity 
    team_res = supabase.table("teams").select("max_members").eq("id", team_id).execute()
    if not team_res.data:
        raise HTTPException(status_code=404, detail="Team not found.")
    max_members = team_res.data[0]["max_members"]

    count_res = supabase.table("team_members").select("team_id", count="exact").eq("team_id", team_id).execute()
    if (count_res.count or 0) >= max_members:
        raise HTTPException(status_code=400, detail="Team is already full.")

    # Insert into team_members
    existing = supabase.table("team_members").select("role").match({"team_id": team_id, "user_id": user_id}).execute()
    if not existing.data:
        supabase.table("team_members").insert({
            "team_id": team_id,
            "user_id": user_id,
            "role": "member"
        }).execute()
    
    # Mark invite as read
    for inv in invite.data:
        supabase.table("notifications").update({"is_read": True}).eq("id", inv["id"]).execute()

    # Notify team leader
    team = supabase.table("teams").select("created_by, name").eq("id", team_id).execute()
    if team.data:
        profile = supabase.table("profiles").select("full_name").eq("id", user_id).execute()
        name = profile.data[0]["full_name"] if profile.data else "Someone"
        supabase.table("notifications").insert({
            "user_id": team.data[0]["created_by"],
            "type": "request_accepted", 
            "content": f"{name} accepted your invitation to join '{team.data[0]['name']}'.",
            "related_id": team_id
        }).execute()

    return {"message": "Successfully joined the team."}


@router.post("/{team_id}/leave")
async def leave_team(
    team_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Leave a team (members only). Notifies the team leader."""
    user_id = current_user["sub"]

    # 1. Fetch user role
    role_res = supabase.table("team_members").select("role").match({
        "team_id": team_id,
        "user_id": user_id
    }).execute()

    if not role_res.data:
        raise HTTPException(status_code=400, detail="You are not a member of this team.")
    
    user_role = role_res.data[0]["role"]
    if user_role == "leader":
        raise HTTPException(status_code=400, detail="Team leaders cannot leave. Please delete the team instead.")

    # 2. Get leader ID and Team Name
    team_res = supabase.table("teams").select("name, created_by").eq("id", team_id).execute()
    if not team_res.data:
        raise HTTPException(status_code=404, detail="Team not found.")
    
    team_name = team_res.data[0]["name"]
    leader_id = team_res.data[0]["created_by"]

    # 3. Get leaving user's name
    user_res = supabase.table("profiles").select("full_name").eq("id", user_id).execute()
    user_name = user_res.data[0]["full_name"] if user_res.data else "A member"

    # 4. Remove from team_members
    supabase.table("team_members").delete().match({
        "team_id": team_id,
        "user_id": user_id
    }).execute()

    # 5. Notify the leader
    if leader_id != user_id:
        supabase.table("notifications").insert({
            "user_id": leader_id,
            "type": "member_left",
            "content": f"{user_name} leaves {team_name} team",
            "related_id": team_id
        }).execute()

    return {"message": "You have successfully left the team."}


# ─── Helper ───────────────────────────────────────────────────────────────────
def _require_team_leader(team_id: str, user_id: str, supabase: Client):
    """Raise 403 if the user is not a leader of the given team."""
    result = supabase.table("team_members").select("role").match(
        {"team_id": team_id, "user_id": user_id}
    ).execute()
    if not result.data or result.data[0]["role"] != "leader":
        raise HTTPException(status_code=403, detail="Only team leaders can perform this action")

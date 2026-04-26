"""
Haxion API – FastAPI entry point.
Registers all routers and configures CORS.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.routers import auth, users, teams, chat, hackathons, admin, matches, notifications, friends

app = FastAPI(
    title="Haxion API",
    description="Backend for Haxion – Find Your Perfect Hackathon Team",
    version="1.0.0",
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(teams.router)
app.include_router(chat.router)
app.include_router(hackathons.router)
app.include_router(admin.router)
app.include_router(matches.router)
app.include_router(notifications.router)
app.include_router(friends.router)


@app.get("/", tags=["Health"])
def root():
    return {"message": "Welcome to Haxion API 🚀", "docs": "/docs"}

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}

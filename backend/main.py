"""
Hackbuddy API – FastAPI entry point.
Registers all routers and configures CORS.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.routers import auth, users, teams, chat, hackathons, admin, matches, notifications, friends, ml

app = FastAPI(
    title="Hackbuddy API",
    description="Backend for Hackbuddy – Find Your Perfect Hackathon Team",
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
        "https://hackbuddy-ten.vercel.app"
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
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
app.include_router(ml.router, prefix="/ml", tags=["Machine Learning"])


@app.get("/", tags=["Health"])
def root():
    return {"message": "Welcome to Hackbuddy API 🚀", "docs": "/docs"}

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}

"""
Database connection setup for HackMate.
Uses Supabase (PostgreSQL) via the supabase-py client for direct DB queries.
"""
import os
from functools import lru_cache
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    """Returns a cached Supabase client instance."""
    url: str = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL", "")
    key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not key:
        raise ValueError("VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment.")
    return create_client(url, key)


def get_supabase() -> Client:
    """FastAPI dependency to get the Supabase client."""
    return get_supabase_client()

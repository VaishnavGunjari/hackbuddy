-- HackMate PostgreSQL Schema
-- Safe to re-run: uses IF NOT EXISTS and ADD COLUMN IF NOT EXISTS throughout.
-- ✅ Fixes: "column does not exist" errors when tables already exist from a prior schema.

-- ─── Enable extensions ───────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Profiles (Users) ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL DEFAULT '',
    full_name     TEXT NOT NULL DEFAULT '',
    college       TEXT,
    bio           TEXT,
    skills        TEXT[]  DEFAULT '{}',
    experience_level     TEXT,
    hackathon_interests  TEXT[] DEFAULT '{}',
    github_url    TEXT,
    linkedin_url  TEXT,
    avatar_url    TEXT,
    role          TEXT    NOT NULL DEFAULT 'participant',
    warning_count INT     NOT NULL DEFAULT 0,
    is_suspended  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Patch existing profiles table with new HackMate columns
-- (Supabase Auth creates profiles with only `id` — we add everything else here)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email                  TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash          TEXT    NOT NULL DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name              TEXT    NOT NULL DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS college                TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio                    TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skills                 TEXT[]  DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience_level       TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hackathon_interests    TEXT[]  DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS github_url             TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_url           TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url             TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role                   TEXT    NOT NULL DEFAULT 'participant';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS warning_count          INT     NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_suspended           BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at             TIMESTAMPTZ DEFAULT NOW();


-- ─── Hackathons ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hackathons (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
    title         TEXT NOT NULL,
    description   TEXT,
    start_date    TIMESTAMPTZ NOT NULL,
    end_date      TIMESTAMPTZ NOT NULL,
    location      TEXT DEFAULT 'Remote',
    banner_url    TEXT,
    prize_pool    TEXT,
    website_url   TEXT,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Patch existing hackathons table
ALTER TABLE hackathons ADD COLUMN IF NOT EXISTS prize_pool  TEXT;
ALTER TABLE hackathons ADD COLUMN IF NOT EXISTS website_url TEXT;

-- ─── Teams ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    description     TEXT,
    hackathon_name  TEXT,
    required_skills TEXT[] DEFAULT '{}',
    max_members     INT NOT NULL DEFAULT 4,
    created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Patch existing teams table
ALTER TABLE teams ADD COLUMN IF NOT EXISTS hackathon_name  TEXT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS required_skills TEXT[] DEFAULT '{}';
ALTER TABLE teams ADD COLUMN IF NOT EXISTS max_members     INT NOT NULL DEFAULT 4;

-- ─── Team Members ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_members (
    id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id   UUID NOT NULL REFERENCES teams(id)    ON DELETE CASCADE,
    user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role      TEXT NOT NULL DEFAULT 'member',   -- 'leader' | 'member'
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- ─── Join Requests ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS join_requests (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id    UUID NOT NULL REFERENCES teams(id)    ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status     TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'accepted' | 'rejected'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Messages ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id     UUID NOT NULL REFERENCES teams(id)    ON DELETE CASCADE,
    sender_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    is_flagged  BOOLEAN NOT NULL DEFAULT FALSE,
    flag_reason TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Patch existing messages table (fixes "column is_flagged does not exist" error)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_flagged  BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS flag_reason TEXT;

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_messages_team_id        ON messages(team_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_flagged     ON messages(is_flagged);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id    ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id    ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_team_id   ON join_requests(team_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email          ON profiles(email);

-- ─── Promote a user to Admin ─────────────────────────────────────────────────
-- 1. Register via the app (/login) first, then run:
-- UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';

-- ─── Notifications ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type       TEXT NOT NULL,
    content    TEXT NOT NULL,
    related_id UUID,
    is_read    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

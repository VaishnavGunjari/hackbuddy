# HackMate: The Ultimate Hackathon Teammate Finder 🚀

HackMate is a platform that combines the excitement of **Hackathons** with a **Tinder-style matching system** to help developers, designers, and innovators find their perfect team.

## 🌟 Key Features

*   **🔥 Hackathon Discovery**: Browse and search for upcoming hackathons.
*   **💘 Swipe Matching**: Tinder-like interface to find teammates based on skills.
*   **🧠 AI Compatibility**: Smart scoring algorithm to suggest the best matches.
*   **🤝 Team Management**: Create, join, and manage hackathon teams.
*   **💬 Real-time Chat**: Instant messaging with your matches.
*   **🛡️ Secure Auth**: Powered by Supabase Authentication.

## 🛠️ Tech Stack

*   **Frontend**: React (Vite), TypeScript, Tailwind CSS, Framer Motion
*   **Backend**: FastAPI (Python), Pydantic
*   **Database**: Supabase (PostgreSQL), Supabase Realtime, Row Level Security (RLS)

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   Python (v3.10+)
*   Supabase Project

### 1. Database Setup
1.  Create a Supabase project.
2.  Go to the SQL Editor in Supabase.
3.  Copy and run the contents of `supabase/schema.sql`.
4.  Get your **Project URL** and **Anon Key**.

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
# (If requirements.txt is missing, install manually: pip install fastapi uvicorn supabase sqlalchemy pydantic python-multipart)

# Create .env file (or set environment variables)
# VITE_SUPABASE_URL=...
# SUPABASE_SERVICE_ROLE_KEY=...

python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Create .env file
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...

npm run dev
```

## 📂 Project Structure

```
/backend
  /app
    /routers    # API Endpoints (users, matches, teams)
    /models     # Data Schemas
    /services   # Business Logic (AI matching)
  main.py       # Entry point

/frontend
  /src
    /components # Reusable UI (Button, Input)
    /pages      # Screens (Login, Dashboard, Matches)
    /layouts    # App Wrappers
    App.tsx     # Routing
```

## 🧪 Testing the Flow
1.  **Sign Up** two different users in incognito windows.
2.  **Swipe Right** on each other in the `Matches` tab.
3.  Check the **Matches** database table to see the connection.
4.  Use **Chat** to send messages in real-time.

---
*Built for the Major Project Viva.*

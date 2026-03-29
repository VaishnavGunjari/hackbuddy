# HackMate 🚀

> **Find your perfect hackathon teammate.** HackMate combines a Tinder-style swipe matching system with real-time team collaboration tools — built for developers, designers, and innovators.

---

## ✨ Features

| Feature | Description |
|---|---|
| 💘 **Swipe Matching** | Tinder-style interface to find teammates by skills & interests |
| 🤝 **Team Management** | Create, join, and manage hackathon teams |
| 💬 **Real-time Chat** | Instant messaging with your team & matches |
| 🔔 **Notifications** | Friend requests, team invites, and match alerts |
| 👥 **Friends Network** | Connect and maintain a network of builders |
| 🛡️ **Secure Auth** | Powered by Supabase Authentication + JWT |

---

## 🛠️ Tech Stack

- **Frontend**: React + Vite, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: FastAPI (Python), Pydantic, Uvicorn
- **Database**: Supabase (PostgreSQL), Supabase Realtime, Row Level Security (RLS)

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- Python 3.10+
- A [Supabase](https://supabase.com) project

---

### 1. Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Paste and run the contents of [`supabase/schema.sql`](./supabase/schema.sql).
4. Note your **Project URL** and **Anon Key** for the next steps.

---

### 2. Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file inside `backend/`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SECRET_KEY=your-jwt-secret
```

Start the server:

```bash
python -m uvicorn main:app --reload --port 8000
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file inside `frontend/`:

```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Start the dev server:

```bash
npm run dev
```

---

## 📂 Project Structure

```
hackmate/
├── backend/
│   ├── app/
│   │   ├── routers/       # API endpoints (auth, users, teams, chat, matches…)
│   │   ├── models/        # Pydantic schemas
│   │   └── core/          # DB client, security utilities
│   └── main.py            # FastAPI entry point
│
├── frontend/
│   └── src/
│       ├── components/    # Reusable UI (Sidebar, ProfileModal, ErrorBoundary)
│       ├── contexts/      # AuthContext
│       ├── lib/           # API client, Supabase client
│       ├── pages/         # Route pages (Dashboard, Matches, Chat, Teams…)
│       └── App.tsx        # Router
│
└── supabase/
    └── schema.sql         # Full DB schema + RLS policies
```

---

## 🧪 Testing the Flow

1. **Sign up** two different accounts (use incognito for the second).
2. **Swipe right** on each other in the `Matches` tab.
3. Check the **Chat** tab — a DM channel should auto-appear.
4. **Create a team** and invite your match to test team management.

---

*Built for the Major Project Viva.*

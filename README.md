# Meetly Ultra

**Meetly Ultra** is a real-time, full-stack MERN collaborative event planning and group scheduling platform. Organizers can launch customizable event polls with smart rules, participants vote live with weighted availability and suggestions, and groups coordinate via real-time discussion, shared checklists, expense splitting, QR/email invites, and one-click calendar export.

---

## ✨ Key Features

### 🎨 Ultra UI & Theme Engine
- **Dual Theme Mode**: Obsidian Dark Mode (default) and Porcelain Light Mode with glassmorphic surfaces, radial mesh backgrounds, and persisted theme preference.
- **Interactive Landing Page**: Live clickable poll preview widget and Bento feature showcase.
- **Polished Feedback**: Toast notifications, shimmer loading skeletons, Lucide icons, and a confetti celebration burst upon finalizing an event.

### 📊 Dashboard & Interactive Calendar
- **KPI Command Strip**: Instant overview of Total Events, Upcoming, Open Polls, and Finalized plans.
- **Search & Multi-Filters**: Filter by keyword, category (`Meeting`, `Hangout`, `Study session`, `Other`), poll status (`Open` / `Finalized`), and role (`Hosting` / `Participating`).
- **Grid ↔ Monthly Calendar View**: Switch between gradient-banner event cards (with live countdowns) and an interactive monthly calendar.

### 🛠️ Extended Event Creation Studio
- **Quick-Start Templates**: One-click presets (`Team Meeting`, `Dinner Hangout`, `Study Session`, `Gaming Night`).
- **Duplicate Event**: Clone any existing event as a starting point for a new poll.
- **Live Card Preview**: Real-time preview of cover gradient, emoji icon, slots, and poll rules.
- **Rich Options**: Date start/end times with quick-add chips, venue modes (`In-Person`, `Online`, `Hybrid`), links, and estimated cost.
- **Smart Poll Rules**:
  - **Multiple Choice vs. Single Choice** voting mode.
  - **Participant Suggestions**: Let guests propose additional dates or venues live.
  - **Anonymous Voting**: Mask voter identities while displaying live scores and percentages.
  - **Voting Deadline & Auto-Finalize**: Automatically lock the top-voted slot when the deadline expires.
  - **Max Attendees & Waitlist**: Enforce capacity limits with automatic waitlisting.
- **Bonus Custom Poll**: Add an optional extra poll question (e.g., cuisine or topic choice) alongside dates and venues.

### 🗳️ Extended Voting & Real-Time Collaboration
- **Socket.io Live Sync**: Votes, suggestions, RSVPs, comments, checklists, expenses, and finalization sync instantly across open browsers.
- **Weighted Availability Voting**: Vote **`Yes` (+2 pts)** or **`If Needed` (+1 pt)** with animated progress bars and `"Leading"` badges.
- **Smart Best Match & Tie-Breaker**: Highlights the highest-scoring Date + Venue combo with 1-click **Finalize Top Match** and a **Random Tie-Breaker** for tied winners.
- **Poll Cards ↔ Availability Matrix**: Toggle between visual poll cards and a Doodle-style participant availability grid.
- **Tabbed Event Workspace**:
  - **Polls & RSVP**: Polls, custom bonus poll, RSVP & capacity bar, personal preferences, embedded Google Maps location preview, and organizer finalize/reopen controls.
  - **Discussion**: Live group comment thread.
  - **Checklist & Agenda**: Editable event agenda + shared action-item checklist with assignees.
  - **Expenses**: Log group costs and auto-calculate per-person split based on confirmed attendees.
- **Sharing & Calendar Export**: Copy link, scannable **QR Code modal**, **Email Invites** (Nodemailer), downloadable **`.ics`** file, and **Google Calendar** one-click link.

### 👤 Profile & Security
- **Profile Analytics**: Customizable avatar ring color plus personal stats (Events Hosted, Polls Voted, Confirmed RSVPs).
- **Security**: JWT authentication, `bcryptjs` password hashing, and global XSS input sanitization via `sanitize-html`.

---

## 🛠️ Tech Stack

- **Frontend**: React 19 (Vite), Redux Toolkit, React Router, Socket.io Client, Lucide React, `qrcode.react`, `canvas-confetti`
- **Backend**: Node.js, Express 5, Socket.io, Mongoose
- **Database**: MongoDB (Docker Compose)
- **Authentication & Security**: JSON Web Tokens (JWT), `bcryptjs`, `sanitize-html`
- **Email Service**: Nodemailer (Gmail App Password)

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Docker Desktop](https://www.docker.com/) (running)

### 2. Start Database (MongoDB)
From the `Meetly/` root directory:
```bash
docker compose up -d
```
MongoDB will listen on `localhost:27017`.

### 3. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file inside `backend/`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/meetly
JWT_SECRET=your_jwt_secret_key_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
```
Start the backend server:
```bash
npm run dev
```
Backend runs on **`http://localhost:5000`** (REST + Socket.io).

### 4. Frontend Setup
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on **`http://localhost:5173`** (or the next available local port).

---

## 📂 Project Structure

```text
Meetly/
├── backend/
│   ├── config/db.js            # MongoDB connection
│   ├── controllers/            # Event & user controllers + Socket.io broadcasts
│   ├── middleware/             # auth.js (JWT) & sanitize.js (XSS protection)
│   ├── models/                 # Mongoose schemas (User & Event)
│   ├── routes/                 # Express REST API routes
│   ├── utils/sendEmail.js      # Nodemailer invite & finalize email helper
│   ├── index.js                # Express + Socket.io server entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/         # Navbar, Layout, EventCard, CalendarView
│   │   ├── context/            # ThemeContext (Dark/Light) & ToastContext
│   │   ├── pages/              # Home, Dashboard, CreateEvent, EventDetails, Profile, Login, Register
│   │   ├── utils/              # themePresets.js (gradients, templates, scoring, .ics export)
│   │   ├── authSlice.js        # Redux auth state
│   │   ├── eventSlice.js       # Redux events state
│   │   └── App.jsx             # Router and app shell
│   └── package.json
├── docker-compose.yml          # MongoDB service definition
└── README.md
```

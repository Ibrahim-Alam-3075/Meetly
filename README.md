# Meetly 

Meetly is a full-stack MERN application for group event planning and meeting scheduling. Organizers can propose multiple dates and venues, participants can vote, state preferences, and confirm attendance, and the organizer can finalize the event and notify everyone via email.

---

## ✨ Features

- **User Authentication**: Secure signup and login with JWT and hashed passwords using bcryptjs.
- **Profile Management**: Update user profile details (name, bio, password).
- **Event Creation**: Propose multiple dates/times and venues (with direct Google Maps links).
- **Polls & Live Leading Options**: Participants can vote on preferred dates and locations; top choices are dynamically flagged as "Leading".
- **Attendance Tracking**: Track participant RSVP status (`Attending`, `Maybe`, `Not attending`).
- **Participant Preferences**: Custom notes and dietary/special requests per participant.
- **Meeting Agenda**: Optional agenda for meetings, editable in-place by the event organizer.
- **Finalize & Email Notification**: Organizers lock the final plan, which triggers automated email alerts to all participants via Nodemailer.
- **Security & XSS Protection**: Global input sanitization via `sanitize-html` middleware to prevent Cross-Site Scripting (XSS) attacks before saving data to MongoDB.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Redux Toolkit, React Router
- **Backend**: Node.js, Express 
- **Database**: MongoDB 
- **Authentication**: JSON Web Tokens (JWT), bcryptjs
- **Email Service**: Nodemailer (Gmail App Password)
- **Containerization**: Docker Compose (MongoDB)

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Docker Desktop](https://www.docker.com/) (running)

---

### 2. Start Database (MongoDB)
From the root project directory:
```bash
docker compose up -d
```
MongoDB will start and listen on `localhost:27017`.

---

### 3. Backend Setup
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file inside `backend/`:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/meetly
   JWT_SECRET=your_jwt_secret_key_here
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_gmail_app_password
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   Backend will run on **`http://localhost:5000`**.

---

### 4. Frontend Setup
1. Open a new terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Frontend will run on **`http://localhost:5173`**.

---

## 📂 Project Structure

```
Meetly/
├── backend/
│   ├── config/db.js            # MongoDB connection
│   ├── controllers/            # Route business logic (events & users)
│   ├── middleware/             # auth.js (JWT) & sanitize.js (XSS protection)
│   ├── models/                 # Mongoose schemas (User & Event)
│   ├── routes/                 # Express API routes
│   ├── utils/sendEmail.js      # Nodemailer notification helper
│   ├── index.js                # Server entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/              # Dashboard, EventDetails, CreateEvent, Profile, etc.
│   │   ├── components/         # Reusable UI (Navbar, etc.)
│   │   ├── authSlice.js        # Redux auth state
│   │   ├── eventSlice.js       # Redux events state
│   │   └── App.jsx             # Router and app shell
│   └── package.json
├── docker-compose.yml          # MongoDB service definition
└── README.md
```

import { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import CreateEvent from "./pages/CreateEvent";
import Login from "./pages/Login";
import Register from "./pages/Register";
import EventDetails from "./pages/EventDetails";
import "./App.css";

const startingEvents = [
  {
    id: 1,
    title: "Sunday Hangout",
    type: "Hangout",
    date: "2026-11-15",
    description: "Lunch after class.",
    dates: [
      { date: "2026-11-15", time: "13:00", votes: 0 },
      { date: "2026-11-16", time: "18:00", votes: 0 },
    ],
    venues: [
      { place: "Campus cafe", link: "", votes: 0 },
      { place: "", link: "https://meet.google.com", votes: 0 },
    ],
    finalVenue: { place: "Campus cafe", link: "" },
  },
  {
    id: 2,
    title: "Project Meeting",
    type: "Meeting",
    date: "2026-11-20",
    description: "Decide the final features for Meetly.",
    dates: [{ date: "2026-11-20", time: "16:00", votes: 0 }],
    venues: [{ place: "", link: "https://meet.google.com", votes: 0 }],
    agenda: "Discussion",
  },
  {
    id: 3,
    title: "Midterm Study Session",
    type: "Study session",
    date: "2026-10-28",
    description: "Revise the web programming notes.",
    dates: [{ date: "2026-10-28", time: "18:00", votes: 0 }],
    venues: [{ place: "Library", link: "", votes: 0 }],
  },
  {
    id: 4,
    title: "Group Dinner",
    type: "Other",
    date: "2026-09-12",
    description: "Dinner after the project demo.",
    dates: [{ date: "2026-09-12", time: "20:00", votes: 0 }],
    venues: [{ place: "Food street", link: "", votes: 0 }],
  },
];

const startingUsers = [{ name: "Test User", email: "test@meetly.com", password: "12345678" }];

function App() {
  const [events, setEvents] = useState(startingEvents);
  const [myVotes, setMyVotes] = useState({});
  const [myAttendance, setMyAttendance] = useState({});
  const [myPreferences, setMyPreferences] = useState({});
  const [users, setUsers] = useState(startingUsers);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  function addEvent(newEvent) {
    setEvents((currentEvents) => [...currentEvents, newEvent]);
  }

  function addUser(newUser) {
    setUsers([...users, newUser]);
  }

  function login(user) {
    setCurrentUser(user);
  }

  function logout() {
    setCurrentUser(null);
  }

  function vote(eventId, kind, index) {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    const key = eventId + "-" + kind + "-" + index;
    const alreadyVoted = myVotes[key];

    setMyVotes({ ...myVotes, [key]: !alreadyVoted });

    setEvents((currentEvents) =>
      currentEvents.map((event) => {
        if (event.id !== eventId) {
          return event;
        }

        const updatedList = event[kind].map((item, i) => {
          if (i !== index) {
            return item;
          }

          const currentVotes = item.votes || 0;
          const votes = alreadyVoted ? currentVotes - 1 : currentVotes + 1;

          return { ...item, votes: votes < 0 ? 0 : votes };
        });

        return { ...event, [kind]: updatedList };
      })
    );
  }

  function setAttendance(eventId, choice) {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    setMyAttendance({ ...myAttendance, [eventId]: choice });
  }

  function savePreference(eventId, text) {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    setMyPreferences({ ...myPreferences, [eventId]: text });
  }

  return (
    <Layout currentUser={currentUser} onLogout={logout}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard events={events} />} />
        <Route path="/create" element={<CreateEvent addEvent={addEvent} currentUser={currentUser} />} />
        <Route path="/login" element={<Login users={users} onLogin={login} />} />
        <Route path="/register" element={<Register users={users} addUser={addUser} />} />
        <Route
          path="/event/:id"
          element={<EventDetails events={events} myVotes={myVotes} onVote={vote} myAttendance={myAttendance} onAttend={setAttendance} myPreferences={myPreferences} onSavePreference={savePreference} />}
        />
      </Routes>
    </Layout>
  );
}

export default App;

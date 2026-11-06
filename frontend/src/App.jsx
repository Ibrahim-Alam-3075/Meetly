import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
    dates: [{ date: "2026-11-15", time: "13:00" }],
    venues: [{ place: "Campus cafe", link: "" }],
  },
  {
    id: 2,
    title: "Project Meeting",
    type: "Meeting",
    date: "2026-11-20",
    description: "Decide the final features for Meetly.",
    dates: [{ date: "2026-11-20", time: "16:00" }],
    venues: [{ place: "", link: "https://meet.google.com" }],
  },
  {
    id: 3,
    title: "Midterm Study Session",
    type: "Study session",
    date: "2026-10-28",
    description: "Revise the web programming notes.",
    dates: [{ date: "2026-10-28", time: "18:00" }],
    venues: [{ place: "Library", link: "" }],
  },
  {
    id: 4,
    title: "Group Dinner",
    type: "Other",
    date: "2026-09-12",
    description: "Dinner after the project demo.",
    dates: [{ date: "2026-09-12", time: "20:00" }],
    venues: [{ place: "Food street", link: "" }],
  },
];

function App() {
  const [events, setEvents] = useState(startingEvents);

  function addEvent(newEvent) {
    setEvents((currentEvents) => [...currentEvents, newEvent]);
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard events={events} />} />
          <Route path="/create" element={<CreateEvent addEvent={addEvent} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/event/:id" element={<EventDetails />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;

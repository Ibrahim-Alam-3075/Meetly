import { useSelector } from "react-redux";
import EventCard from "../components/EventCard";
import "./Dashboard.css";
import { Link } from "react-router-dom";


function Dashboard() {
  const events = useSelector((state) => state.event.events);
  const loading = useSelector((state) => state.event.loading);
  const currentUser = useSelector((state) => state.auth.currentUser);
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter((event) => event.date >= today);
  const past = events.filter((event) => event.date < today);

  if (loading) {
    return <div className="app-container"><p>Loading events...</p></div>;
  }
  if (!currentUser) {
  return <div className="app-container"><p>Please log in to see your events.</p><Link to="/login">Login</Link></div>;
}

  return (
    <div className="app-container">
      <h2>Dashboard</h2>

      <h3>Upcoming</h3>
      {upcoming.length === 0 && <p>No upcoming events.</p>}
      {upcoming.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}

      <h3>Past</h3>
      {past.length === 0 && <p>No past events.</p>}
      {past.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}

export default Dashboard;

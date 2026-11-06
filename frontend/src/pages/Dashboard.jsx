import EventCard from "../components/EventCard";
import "./Dashboard.css";

function Dashboard() {
  const events = [
    {
      id: 1,
      title: "Sunday Hangout",
      type: "Hangout",
      date: "2026-11-15",
      description: "Lunch after class.",
    },
    {
      id: 2,
      title: "Project Meeting",
      type: "Meeting",
      date: "2026-11-20",
      description: "Decide the final features for Meetly.",
    },
    {
      id: 3,
      title: "Midterm Study Session",
      type: "Study session",
      date: "2026-10-28",
      description: "Revise the web programming notes.",
    },
    {
      id: 4,
      title: "Group Dinner",
      type: "Other",
      date: "2026-09-12",
      description: "Dinner after the project demo.",
    },
  ];

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter((event) => event.date >= today);
  const past = events.filter((event) => event.date < today);

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

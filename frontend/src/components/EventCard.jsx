import { Link } from "react-router-dom";
import "./EventCard.css";

function EventCard({ event }) {
  const today = new Date().toISOString().slice(0, 10);
  const isUpcoming = event.date >= today;

  return (
    <div className="event-card">
      <p className={isUpcoming ? "tag upcoming" : "tag past"}>
        {isUpcoming ? "Upcoming" : "Past"}
      </p>
      <h3>{event.title}</h3>
      <p>{event.type}</p>
      <p>
        {event.date}
        {event.dates && event.dates[0] && event.dates[0].time
          ? " at " + event.dates[0].time
          : ""}
      </p>
      <p>{event.description}</p>
      <Link to={"/event/" + event.id}>View event</Link>
    </div>
  );
}

export default EventCard;

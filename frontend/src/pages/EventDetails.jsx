import { Link, useParams } from "react-router-dom";
import "./EventDetails.css";

function EventDetails({ events, myVotes, onVote }) {
  const { id } = useParams();
  const event = events.find((item) => String(item.id) === id);

  if (!event) {
    return (
      <div className="app-container">
        <h2>Event not found</h2>
        <p>
          <Link to="/dashboard">Back to dashboard</Link>
        </p>
      </div>
    );
  }

  const dateVotes = event.dates.map((item) => item.votes || 0);
  const venueVotes = event.venues.map((item) => item.votes || 0);
  const topDateVotes = dateVotes.length ? Math.max(...dateVotes) : 0;
  const topVenueVotes = venueVotes.length ? Math.max(...venueVotes) : 0;

  return (
    <div className="app-container">
      <p>
        <Link to="/dashboard">Back to dashboard</Link>
      </p>
      <h2>{event.title}</h2>
      <p>{event.type}</p>
      {event.description && <p>{event.description}</p>}

      <h3>Date options</h3>
      {event.dates.map((item, index) => {
        const votes = item.votes || 0;
        const leading = votes > 0 && votes === topDateVotes;
        const voted = myVotes[event.id + "-dates-" + index];

        return (
          <div className={leading ? "choice leading" : "choice"} key={index}>
            <p>
              {item.date}
              {item.time ? " at " + item.time : ""}
            </p>
            <p>{votes === 1 ? "1 vote" : votes + " votes"}</p>
            {leading && <p className="lead-label">Leading</p>}
            <button type="button" onClick={() => onVote(event.id, "dates", index)}>
              {voted ? "Remove vote" : "Vote"}
            </button>
          </div>
        );
      })}

      <h3>Venue options</h3>
      {event.venues.map((item, index) => {
        const votes = item.votes || 0;
        const leading = votes > 0 && votes === topVenueVotes;
        const voted = myVotes[event.id + "-venues-" + index];

        return (
          <div className={leading ? "choice leading" : "choice"} key={index}>
            <p>
              {item.place}
              {item.place && item.link ? " - " : ""}
              {item.link && (
                <a href={item.link} target="_blank" rel="noreferrer">
                  {item.link}
                </a>
              )}
            </p>
            <p>{votes === 1 ? "1 vote" : votes + " votes"}</p>
            {leading && <p className="lead-label">Leading</p>}
            <button type="button" onClick={() => onVote(event.id, "venues", index)}>
              {voted ? "Remove vote" : "Vote"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default EventDetails;

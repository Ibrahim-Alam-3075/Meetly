import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { savePreference, setAttendance, vote } from "../eventSlice";
import "./EventDetails.css";

function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const events = useSelector((state) => state.event.events);
  const myVotes = useSelector((state) => state.event.myVotes);
  const myAttendance = useSelector((state) => state.event.myAttendance);
  const myPreferences = useSelector((state) => state.event.myPreferences);
  const currentUser = useSelector((state) => state.auth.currentUser);
  const [preference, setPreference] = useState("");

  const event = events.find((item) => String(item.id) === id);

  function handleVote(eventId, kind, index) {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    dispatch(vote({ eventId, kind, index }));
  }

  function handleAttend(eventId, choice) {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    dispatch(setAttendance({ eventId, choice }));
  }

  function handleSave(e) {
    e.preventDefault();

    if (!currentUser) {
      navigate("/login");
      return;
    }

    dispatch(savePreference({ eventId: event.id, text: preference.trim() }));
  }

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

  let hasVoted = false;

  for (let i = 0; i < event.dates.length; i++) {
    if (myVotes[event.id + "-dates-" + i]) {
      hasVoted = true;
    }
  }

  for (let i = 0; i < event.venues.length; i++) {
    if (myVotes[event.id + "-venues-" + i]) {
      hasVoted = true;
    }
  }

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
            <button type="button" onClick={() => handleVote(event.id, "dates", index)}>
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
            <button type="button" onClick={() => handleVote(event.id, "venues", index)}>
              {voted ? "Remove vote" : "Vote"}
            </button>
          </div>
        );
      })}

      {hasVoted && (
        <div>
          <h3>Will you attend?</h3>
          <button
            className={myAttendance[event.id] === "attending" ? "attend selected" : "attend"}
            onClick={() => handleAttend(event.id, "attending")}
          >
            Attending
          </button>
          <button
            className={myAttendance[event.id] === "maybe" ? "attend selected" : "attend"}
            onClick={() => handleAttend(event.id, "maybe")}
          >
            Maybe
          </button>
          <button
            className={myAttendance[event.id] === "not attending" ? "attend selected" : "attend"}
            onClick={() => handleAttend(event.id, "not attending")}
          >
            Not attending
          </button>
        </div>
      )}

      {event.finalVenue && (
        <div>
          <h3>Final venue</h3>
          <p>{event.finalVenue.place} {event.finalVenue.link}</p>
          <form onSubmit={handleSave}>
            <label>Your preferences: </label>
            <input placeholder="e.g quiet place, 6 person seating" value={preference} onChange={(e) => setPreference(e.target.value)} />
            <button type="submit">Save</button>
          </form>

          <h3>Summary</h3>
          <p>Venue: {event.finalVenue.place} {event.finalVenue.link}</p>
          <p>Attendance: {myAttendance[event.id] || "Not chosen"}</p>
          <p>Preferences: {myPreferences[event.id] || "Not chosen"}</p>
        </div>
      )}

      {event.agenda && (
        <div>
          <h3>Meeting Agenda</h3>
          <p>{event.agenda}</p>
        </div>
      )}
      
    </div>
  );
}

export default EventDetails;

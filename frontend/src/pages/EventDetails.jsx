import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { finalizeEvent, savePreference, setAttendance, vote } from "../eventSlice";
import "./EventDetails.css";

function mapLink(place) {
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(place);
}

function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const events = useSelector((state) => state.event.events);
  const myVotes = useSelector((state) => state.event.myVotes);
  const attendance = useSelector((state) => state.event.attendance);
  const preferences = useSelector((state) => state.event.preferences);
  const currentUser = useSelector((state) => state.auth.currentUser);
  const [preference, setPreference] = useState("");
  const [dateIndex, setDateIndex] = useState(0);
  const [venueIndex, setVenueIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const event = events.find((item) => String(item.id) === id);

  function handleVote(eventId, kind, index) {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    dispatch(vote({ eventId, kind, index, email: currentUser.email }));
  }

  function handleAttend(eventId, choice) {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    dispatch(setAttendance({
      eventId,
      email: currentUser.email,
      name: currentUser.name,
      choice,
    }));
  }

  function handleSave(e) {
    e.preventDefault();

    if (!currentUser) {
      navigate("/login");
      return;
    }

    dispatch(savePreference({
      eventId: event.id,
      email: currentUser.email,
      name: currentUser.name,
      text: preference.trim(),
    }));
  }

  function handleFinalize() {
    dispatch(finalizeEvent({
      eventId: event.id,
      dateIndex: Number(dateIndex),
      venueIndex: Number(venueIndex),
    }));
  }

  function copyLink() {
    const link = window.location.origin + "/event/" + event.id;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
    });
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

  const isOrganizer = currentUser && currentUser.email === event.organizerEmail;
  const responses = attendance[event.id] || [];
  const preferenceList = preferences[event.id] || [];
  const myResponse = currentUser
    ? responses.find((item) => item.email === currentUser.email)
    : null;
  const myChoice = myResponse ? myResponse.choice : "";
  const mySavedPreference = currentUser
    ? preferenceList.find((item) => item.email === currentUser.email)
    : null;

  const dateVotes = event.dates.map((item) => item.votes || 0);
  const venueVotes = event.venues.map((item) => item.votes || 0);
  const topDateVotes = dateVotes.length ? Math.max(...dateVotes) : 0;
  const topVenueVotes = venueVotes.length ? Math.max(...venueVotes) : 0;

  let hasVoted = false;

  if (currentUser) {
    for (let i = 0; i < event.dates.length; i++) {
      if (myVotes[currentUser.email + "-" + event.id + "-dates-" + i]) {
        hasVoted = true;
      }
    }

    for (let i = 0; i < event.venues.length; i++) {
      if (myVotes[currentUser.email + "-" + event.id + "-venues-" + i]) {
        hasVoted = true;
      }
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

      <p>Share this link: {window.location.origin + "/event/" + event.id}</p>
      <button type="button" onClick={copyLink}>Copy link</button>
      {copied && <p className="lead-label">Link copied</p>}

      <h3>Date options</h3>
      {event.votingClosed && <p>Voting is closed.</p>}
      {event.dates.map((item, index) => {
        const votes = item.votes || 0;
        const leading = votes > 0 && votes === topDateVotes;
        const voted = currentUser && myVotes[currentUser.email + "-" + event.id + "-dates-" + index];

        return (
          <div className={leading ? "choice leading" : "choice"} key={index}>
            <p>
              {item.date}
              {item.time ? " at " + item.time : ""}
            </p>
            <p>{votes === 1 ? "1 vote" : votes + " votes"}</p>
            {leading && <p className="lead-label">Leading</p>}
            {!event.votingClosed && (
              <button type="button" onClick={() => handleVote(event.id, "dates", index)}>
                {voted ? "Remove vote" : "Vote"}
              </button>
            )}
          </div>
        );
      })}

      <h3>Venue options</h3>
      {event.venues.map((item, index) => {
        const votes = item.votes || 0;
        const leading = votes > 0 && votes === topVenueVotes;
        const voted = currentUser && myVotes[currentUser.email + "-" + event.id + "-venues-" + index];

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
            {item.place && (
              <p>
                <a href={mapLink(item.place)} target="_blank" rel="noreferrer">
                  View on map
                </a>
              </p>
            )}
            <p>{votes === 1 ? "1 vote" : votes + " votes"}</p>
            {leading && <p className="lead-label">Leading</p>}
            {!event.votingClosed && (
              <button type="button" onClick={() => handleVote(event.id, "venues", index)}>
                {voted ? "Remove vote" : "Vote"}
              </button>
            )}
          </div>
        );
      })}

      {isOrganizer && !event.votingClosed && (
        <div className="final-box">
          <h3>Confirm the final plan</h3>
          <div className="form-group">
            <label htmlFor="final-date">Final date</label>
            <select
              id="final-date"
              value={dateIndex}
              onChange={(e) => setDateIndex(e.target.value)}
            >
              {event.dates.map((item, index) => (
                <option value={index} key={index}>
                  {item.date}{item.time ? " at " + item.time : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="final-venue">Final venue</label>
            <select
              id="final-venue"
              value={venueIndex}
              onChange={(e) => setVenueIndex(e.target.value)}
            >
              {event.venues.map((item, index) => (
                <option value={index} key={index}>
                  {item.place || item.link}
                </option>
              ))}
            </select>
          </div>
          <button type="button" onClick={handleFinalize}>Close voting</button>
        </div>
      )}

      {(hasVoted || event.votingClosed) && (
        <div>
          <h3>Will you attend?</h3>
          <button
            className={myChoice === "attending" ? "attend selected" : "attend"}
            onClick={() => handleAttend(event.id, "attending")}
          >
            Attending
          </button>
          <button
            className={myChoice === "maybe" ? "attend selected" : "attend"}
            onClick={() => handleAttend(event.id, "maybe")}
          >
            Maybe
          </button>
          <button
            className={myChoice === "not attending" ? "attend selected" : "attend"}
            onClick={() => handleAttend(event.id, "not attending")}
          >
            Not attending
          </button>
        </div>
      )}

      {event.finalVenue && (
        <div>
          <h3>Final plan</h3>
          <p>
            {event.finalDate}
            {event.finalTime ? " at " + event.finalTime : ""}
          </p>
          <p>{event.finalVenue.place} {event.finalVenue.link}</p>
          {event.finalVenue.place && (
            <div>
              <p>
                <a href={mapLink(event.finalVenue.place)} target="_blank" rel="noreferrer">
                  View final venue on map
                </a>
              </p>
              <iframe
                className="map-frame"
                title="Venue map"
                src={"https://maps.google.com/maps?q=" + encodeURIComponent(event.finalVenue.place) + "&output=embed"}
              />
            </div>
          )}
          <form onSubmit={handleSave}>
            <label>Your preferences: </label>
            <input placeholder="e.g quiet place, 6 person seating" value={preference} onChange={(e) => setPreference(e.target.value)} />
            <button type="submit">Save</button>
          </form>

          <h3>Your summary</h3>
          <p>Venue: {event.finalVenue.place} {event.finalVenue.link}</p>
          <p>Attendance: {myChoice || "Not chosen"}</p>
          <p>Preferences: {mySavedPreference ? mySavedPreference.text : "Not chosen"}</p>
        </div>
      )}

      {isOrganizer && (
        <div>
          <h3>Participant list</h3>
          {responses.length === 0 && <p>No responses yet.</p>}
          {responses.map((item) => (
            <p key={item.email}>{item.name}: {item.choice}</p>
          ))}
          <h3>Preference summary</h3>
          {preferenceList.length === 0 && <p>No preferences yet.</p>}
          {preferenceList.map((item) => (
            <p key={item.email}>{item.name}: {item.text}</p>
          ))}
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

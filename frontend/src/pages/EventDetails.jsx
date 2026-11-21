import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { updateEvent } from "../eventSlice";
import "./EventDetails.css";

function mapLink(place) {
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(place);
}

function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const events = useSelector((state) => state.event.events);
  const loading = useSelector((state) => state.event.loading);
  const currentUser = useSelector((state) => state.auth.currentUser);
  const [preference, setPreference] = useState("");
  const [dateIndex, setDateIndex] = useState(0);
  const [venueIndex, setVenueIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [other, setOther] = useState(null);
  const [fetched, setFetched] = useState(false);

  const event = events.find((item) => String(item._id) === id) || other;

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (currentUser && token) {
      fetch('http://localhost:5000/api/events/' + id, { headers: { Authorization: 'Bearer ' + token } })
        .then(response => response.json())
        .then(data => {
          if (data && data._id) { setOther(data); }
          setFetched(true);
        })
        .catch(() => { setFetched(true); });
    }
  }, [id, currentUser]);

  useEffect(() => {
    const myPref = currentUser && event && Array.isArray(event.preferences)
      ? event.preferences.find((item) => item.email === currentUser.email)
      : null;
    if (myPref && myPref.text) {
      setPreference(myPref.text);
    }
  }, [currentUser, event]);

  function sendToApi(eventId, path, method, body) {
    fetch('http://localhost:5000/api/events/' + eventId + path, {
      method: method,
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('token') },
      body: JSON.stringify(body)
    })
      .then(response => response.json())
      .then(data => { if (data && data._id) { dispatch(updateEvent(data)); } });
  }

  function handleVote(eventId, kind, index) {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    sendToApi(eventId, '/vote', 'POST', { kind, index });
  }

  function handleAttend(eventId, choice) {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    sendToApi(eventId, '/attendance', 'POST', { choice });
  }

  function handleSave(e) {
    e.preventDefault();

    if (!currentUser) {
      navigate("/login");
      return;
    }

    sendToApi(event._id, '/preference', 'POST', { text: preference.trim() });
  }

  function handleFinalize() {
    sendToApi(event._id, '/finalize', 'PATCH', { dateIndex: Number(dateIndex), venueIndex: Number(venueIndex) });
  }

  function copyLink() {
    const link = window.location.origin + "/event/" + event._id;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
    });
  }

  const token = localStorage.getItem('token');

  if (token && !currentUser) {
    return <div className="app-container"><p>Loading session...</p></div>;
  }

  if (!currentUser) {
    return (
      <div className="app-container">
        <p>Please log in to see this event.</p>
        <Link to={"/login?next=/event/" + id}>Login</Link>
      </div>
    );
  }

  if (loading && !event && !fetched) {
    return <div className="app-container"><p>Loading event details...</p></div>;
  }

  if (!event && !fetched) {
    return <div className="app-container"><p>Loading event details...</p></div>;
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

  const isOrganizer = currentUser && event.organizer && (currentUser._id === (event.organizer._id || event.organizer));
  const responses = Array.isArray(event.attendance) ? event.attendance : [];
  const preferenceList = Array.isArray(event.preferences) ? event.preferences : [];
  const myResponse = currentUser
    ? responses.find((item) => item.email === currentUser.email)
    : null;
  const myChoice = myResponse ? myResponse.choice : "";
  const mySavedPreference = currentUser
    ? preferenceList.find((item) => item.email === currentUser.email)
    : null;

  const dates = Array.isArray(event.dates) ? event.dates : [];
  const venues = Array.isArray(event.venues) ? event.venues : [];
  const dateVotes = dates.map((item) => (Array.isArray(item.votes) ? item.votes.length : (item.votes || 0)));
  const venueVotes = venues.map((item) => (Array.isArray(item.votes) ? item.votes.length : (item.votes || 0)));
  const topDateVotes = dateVotes.length ? Math.max(...dateVotes) : 0;
  const topVenueVotes = venueVotes.length ? Math.max(...venueVotes) : 0;

  let hasVoted = false;

  if (currentUser) {
    for (let i = 0; i < dates.length; i++) {
      if (Array.isArray(dates[i].votes) && dates[i].votes.includes(currentUser._id)) { hasVoted = true; }
    }

    for (let i = 0; i < venues.length; i++) {
      if (Array.isArray(venues[i].votes) && venues[i].votes.includes(currentUser._id)) { hasVoted = true; }
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

      <p>Share this link: {window.location.origin + "/event/" + event._id}</p>
      <button type="button" onClick={copyLink}>Copy link</button>
      {copied && <p className="lead-label">Link copied</p>}

      <h3>Date options</h3>
      {event.votingClosed && <p>Voting is closed.</p>}
      {dates.map((item, index) => {
        const votes = Array.isArray(item.votes) ? item.votes.length : (item.votes || 0);
        const leading = votes > 0 && votes === topDateVotes;
        const voted = currentUser && Array.isArray(item.votes) && item.votes.includes(currentUser._id);

        return (
          <div className={leading ? "choice leading" : "choice"} key={index}>
            <p>
              {item.date}
              {item.time ? " at " + item.time : ""}
            </p>
            <p>{votes === 1 ? "1 vote" : votes + " votes"}</p>
            {leading && <p className="lead-label">Leading</p>}
            {!event.votingClosed && (
              <button type="button" onClick={() => handleVote(event._id, "dates", index)}>
                {voted ? "Remove vote" : "Vote"}
              </button>
            )}
          </div>
        );
      })}

      <h3>Venue options</h3>
      {venues.map((item, index) => {
        const votes = Array.isArray(item.votes) ? item.votes.length : (item.votes || 0);
        const leading = votes > 0 && votes === topVenueVotes;
        const voted = currentUser && Array.isArray(item.votes) && item.votes.includes(currentUser._id);

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
              <button type="button" onClick={() => handleVote(event._id, "venues", index)}>
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
              {dates.map((item, index) => (
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
              {venues.map((item, index) => (
                <option value={index} key={index}>
                  {item.place || item.link}
                </option>
              ))}
            </select>
          </div>
          <button type="button" onClick={handleFinalize}>Close voting</button>
        </div>
      )}

      <div>
        <h3>Will you attend?</h3>
        <button
          className={myChoice === "yes" ? "attend selected" : "attend"}
          onClick={() => handleAttend(event._id, "yes")}
        >
          Attending
        </button>
        <button
          className={myChoice === "maybe" ? "attend selected" : "attend"}
          onClick={() => handleAttend(event._id, "maybe")}
        >
          Maybe
        </button>
        <button
          className={myChoice === "no" ? "attend selected" : "attend"}
          onClick={() => handleAttend(event._id, "no")}
        >
          Not attending
        </button>
      </div>

      <div>
        <h3>Your preferences</h3>
        {!event.votingClosed ? (
          <form onSubmit={handleSave}>
            <label>Preference: </label>
            <input
              placeholder="e.g quiet place, dietary requirements, topic request"
              value={preference}
              onChange={(e) => setPreference(e.target.value)}
            />
            <button type="submit">Save</button>
          </form>
        ) : (
          <p>Voting is closed.</p>
        )}
        {mySavedPreference && (
          <p>Saved preference: <strong>{mySavedPreference.text}</strong></p>
        )}
      </div>

      {event.finalDate && (
        <div>
          <h3>Final plan</h3>
          <p>
            {event.finalDate}
            {event.finalTime ? " at " + event.finalTime : ""}
          </p>
          <p>{event.finalVenue?.place} {event.finalVenue?.link}</p>
          {event.finalVenue?.place && (
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

          <h3>Your summary</h3>
          <p>Venue: {event.finalVenue?.place} {event.finalVenue?.link}</p>
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

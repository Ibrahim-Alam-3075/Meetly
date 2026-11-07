import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { addEvent } from "../eventSlice";
import "./CreateEvent.css";

function CreateEvent() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.currentUser);

  const [title, setTitle] = useState("");
  const [type, setType] = useState("Hangout");
  const [description, setDescription] = useState("");
  const [dates, setDates] = useState([{ date: "", time: "" }]);
  const [venues, setVenues] = useState([{ place: "", link: "" }]);
  const [error, setError] = useState("");
  const [agenda, setAgenda] = useState("");

  function handleDateChange(index, field, value) {
    const updated = [...dates];
    updated[index] = { ...updated[index], [field]: value };
    setDates(updated);
  }

  function addDate() {
    setDates([...dates, { date: "", time: "" }]);
  }

  function removeDate(index) {
    setDates(dates.filter((item, i) => i !== index));
  }

  function handleVenueChange(index, field, value) {
    const updated = [...venues];
    updated[index] = { ...updated[index], [field]: value };
    setVenues(updated);
  }

  function addVenue() {
    setVenues([...venues, { place: "", link: "" }]);
  }

  function removeVenue(index) {
    setVenues(venues.filter((item, i) => i !== index));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!currentUser) {
      navigate("/login");
      return;
    }

    if (title.trim() === "") {
      setError("Please enter a title.");
      return;
    }

    const filledDates = dates.filter((item) => item.date !== "");
    if (filledDates.length === 0) {
      setError("Please add at least one date.");
      return;
    }

    const filledVenues = venues.filter(
      (item) => item.place.trim() !== "" || item.link.trim() !== ""
    );
    if (filledVenues.length === 0) {
      setError("Please add a place or an online link.");
      return;
    }

    let agendaText = "";
    if (type === "Meeting") {
      agendaText = agenda.trim();
    }

    dispatch(addEvent({
      id: Date.now(),
      title: title.trim(),
      type,
      description: description.trim(),
      date: filledDates[0].date,
      dates: filledDates.map((item) => ({ ...item, votes: 0 })),
      venues: filledVenues.map((item) => ({ ...item, votes: 0 })),
      agenda: agendaText,
    }));

    navigate("/dashboard");
  }

  return (
    <div className="app-container">
      <h2>Create Event</h2>

      <form className="create-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="type">Type</label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option>Hangout</option>
            <option>Meeting</option>
            <option>Study session</option>
            <option>Other</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <h3>Date and time options</h3>
        {dates.map((item, index) => (
          <div className="option-row" key={index}>
            <input
              type="date"
              value={item.date}
              onChange={(e) => handleDateChange(index, "date", e.target.value)}
            />
            <input
              type="time"
              value={item.time}
              onChange={(e) => handleDateChange(index, "time", e.target.value)}
            />
            {dates.length > 1 && (
              <button type="button" onClick={() => removeDate(index)}>
                Remove
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={addDate}>
          Add another date
        </button>

        <h3>Venue options</h3>
        <p>Add a place name, an online link, or both.</p>
        {venues.map((item, index) => (
          <div className="option-row" key={index}>
            <input
              placeholder="Place"
              value={item.place}
              onChange={(e) => handleVenueChange(index, "place", e.target.value)}
            />
            <input
              placeholder="Online link"
              value={item.link}
              onChange={(e) => handleVenueChange(index, "link", e.target.value)}
            />
            {venues.length > 1 && (
              <button type="button" onClick={() => removeVenue(index)}>
                Remove
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={addVenue}>
          Add another venue
        </button>

        {type === "Meeting" && <div><h3>Meeting Agenda</h3>
        <p>Add the agenda for the meeting.</p>
        <textarea
          rows="5"
          value={agenda}
          onChange={(e) => setAgenda(e.target.value)} /></div>}

        {error && <p className="error">{error}</p>}

        <div>
          <button className="submit-button" type="submit">
            Create event
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateEvent;

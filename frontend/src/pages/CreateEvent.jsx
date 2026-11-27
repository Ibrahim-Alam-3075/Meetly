import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Sparkles,
  Plus,
  Trash2,
  Calendar,
  MapPin,
  Sliders,
  HelpCircle,
  FileText,
  Clock,
  Users,
  Lock,
  Lightbulb,
  Zap
} from "lucide-react";
import { addEvent } from "../eventSlice";
import { useToast } from "../context/ToastContext";
import {
  COVER_THEMES,
  EMOJI_OPTIONS,
  EVENT_TEMPLATES,
  getCoverGradient,
  getDefaultIcon,
  formatNiceDate
} from "../utils/themePresets";
import "./CreateEvent.css";

function getOffsetDate(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

function CreateEvent() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { addToast } = useToast();
  const currentUser = useSelector((state) => state.auth.currentUser);
  const dup = location.state?.duplicateFrom;

  const [title, setTitle] = useState(dup ? `${dup.title} (Copy)` : "");
  const [type, setType] = useState(dup?.type || "Hangout");
  const [description, setDescription] = useState(dup?.description || "");
  const [coverTheme, setCoverTheme] = useState(dup?.coverTheme || "indigo");
  const [icon, setIcon] = useState(dup?.icon || "✨");
  const [maxAttendees, setMaxAttendees] = useState(dup?.maxAttendees || "");

  const [dates, setDates] = useState(
    dup?.dates?.length
      ? dup.dates.map((d) => ({ date: getOffsetDate(2), time: d.time || "19:00", endTime: d.endTime || "" }))
      : [{ date: getOffsetDate(1), time: "19:00", endTime: "" }]
  );

  const [venues, setVenues] = useState(
    dup?.venues?.length
      ? dup.venues.map((v) => ({
          place: v.place || "",
          link: v.link || "",
          mode: v.mode || "In-Person",
          estimatedCost: v.estimatedCost || ""
        }))
      : [{ place: "", link: "", mode: "In-Person", estimatedCost: "" }]
  );

  const [votingMode, setVotingMode] = useState(dup?.pollSettings?.votingMode || "multiple");
  const [allowSuggestions, setAllowSuggestions] = useState(
    dup?.pollSettings ? dup.pollSettings.allowSuggestions !== false : true
  );
  const [anonymousVoting, setAnonymousVoting] = useState(Boolean(dup?.pollSettings?.anonymousVoting));
  const [votingDeadline, setVotingDeadline] = useState("");
  const [autoFinalize, setAutoFinalize] = useState(Boolean(dup?.pollSettings?.autoFinalize));

  const [enableCustomPoll, setEnableCustomPoll] = useState(Boolean(dup?.customPoll?.question));
  const [customQuestion, setCustomQuestion] = useState(dup?.customPoll?.question || "");
  const [customOptions, setCustomOptions] = useState(
    dup?.customPoll?.options?.length ? dup.customPoll.options.map((o) => o.label) : ["", ""]
  );

  const [agenda, setAgenda] = useState(dup?.agenda || "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function applyTemplate(tpl) {
    setType(tpl.type);
    setIcon(tpl.icon);
    setCoverTheme(tpl.coverTheme);
    setDescription(tpl.description);
    setAgenda(tpl.agenda);
    setVotingMode(tpl.votingMode);
    setAllowSuggestions(tpl.allowSuggestions);
    if (!title.trim()) setTitle(tpl.label);
    addToast(`Applied "${tpl.label}" template`, "info");
  }

  function handleDateChange(index, field, value) {
    setDates((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  function addDate(presetDays) {
    setDates((prev) => [
      ...prev,
      {
        date: typeof presetDays === "number" ? getOffsetDate(presetDays) : "",
        time: "19:00",
        endTime: ""
      }
    ]);
  }

  function removeDate(index) {
    setDates((prev) => prev.filter((_, i) => i !== index));
  }

  function handleVenueChange(index, field, value) {
    setVenues((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  function addVenue() {
    setVenues((prev) => [...prev, { place: "", link: "", mode: "In-Person", estimatedCost: "" }]);
  }

  function removeVenue(index) {
    setVenues((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!currentUser) {
      navigate("/login");
      return;
    }

    if (!title.trim()) {
      setError("Please enter an event title.");
      return;
    }

    const filledDates = dates.filter((d) => d.date);
    if (filledDates.length === 0) {
      setError("Please add at least one date option.");
      return;
    }

    const filledVenues = venues.filter((v) => v.place.trim() || v.link.trim());
    if (filledVenues.length === 0) {
      setError("Please add at least one venue place or online link.");
      return;
    }

    const customPollPayload =
      enableCustomPoll && customQuestion.trim()
        ? {
            question: customQuestion.trim(),
            options: customOptions.map((o) => o.trim()).filter(Boolean)
          }
        : { question: "", options: [] };

    setSubmitting(true);
    fetch("http://localhost:5000/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token")
      },
      body: JSON.stringify({
        title: title.trim(),
        type,
        description: description.trim(),
        coverTheme,
        icon,
        maxAttendees: Number(maxAttendees) || 0,
        pollSettings: {
          votingMode,
          allowSuggestions,
          anonymousVoting,
          votingDeadline,
          autoFinalize: votingDeadline ? autoFinalize : false
        },
        dates: filledDates,
        venues: filledVenues,
        customPoll: customPollPayload,
        agenda: agenda.trim()
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data._id) {
          dispatch(addEvent(data));
          addToast("Event created! Share the link to start voting.", "success");
          navigate(`/event/${data._id}`);
        } else {
          setError(data.message || "Could not create event");
        }
      })
      .catch(() => setError("Could not reach the server"))
      .finally(() => setSubmitting(false));
  }

  if (!currentUser) {
    return (
      <div className="empty-state glass-card">
        <h2>Sign in to create an event</h2>
        <Link to="/login" className="hero-btn-primary">Sign In</Link>
      </div>
    );
  }

  const previewDate = dates[0]?.date || getOffsetDate(1);
  const previewVenue = venues[0]?.place || (venues[0]?.link ? "Online Link" : "Venue TBD");

  return (
    <div className="create-studio fade-up">
      <div className="studio-head">
        <div>
          <h1>{dup ? "Duplicate Event" : "Create Event Studio"}</h1>
          <p>Configure dates, venues, smart poll rules, and custom branding.</p>
        </div>
      </div>

      {/* Quick-Start Templates */}
      <div className="template-strip">
        <span className="template-label"><Sparkles size={14} /> Quick Templates:</span>
        {EVENT_TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            className="template-chip"
            onClick={() => applyTemplate(tpl)}
          >
            <span>{tpl.icon}</span>
            <span>{tpl.label}</span>
          </button>
        ))}
      </div>

      <div className="studio-layout">
        <form className="studio-form" onSubmit={handleSubmit}>
          {/* Section 1: Basics & Branding */}
          <section className="studio-card glass-card">
            <div className="card-sec-head">
              <Sparkles size={18} />
              <h3>1. Basics &amp; Cover Branding</h3>
            </div>

            <div className="two-col">
              <div className="field-group">
                <label htmlFor="title">Event Title *</label>
                <input
                  id="title"
                  placeholder="e.g. Post-Evaluation Celebration Dinner"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="field-group">
                <label htmlFor="type">Category</label>
                <select id="type" value={type} onChange={(e) => setType(e.target.value)}>
                  <option>Hangout</option>
                  <option>Meeting</option>
                  <option>Study session</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div className="field-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                rows="3"
                placeholder="Tell everyone what this event is about..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="branding-row">
              <div className="field-group">
                <label>Cover Gradient</label>
                <div className="swatch-row">
                  {Object.entries(COVER_THEMES).map(([key, val]) => (
                    <button
                      key={key}
                      type="button"
                      className={`theme-swatch ${coverTheme === key ? "selected" : ""}`}
                      style={{ background: val.gradient }}
                      onClick={() => setCoverTheme(key)}
                      title={val.label}
                      aria-label={val.label}
                    />
                  ))}
                </div>
              </div>

              <div className="field-group">
                <label>Event Icon</label>
                <div className="emoji-row">
                  {EMOJI_OPTIONS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      className={`emoji-btn ${icon === em ? "selected" : ""}`}
                      onClick={() => setIcon(em)}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Date & Time Slots */}
          <section className="studio-card glass-card">
            <div className="card-sec-head">
              <Calendar size={18} />
              <h3>2. Date &amp; Time Options</h3>
              <div className="quick-date-btns">
                <button type="button" className="secondary sm" onClick={() => addDate(1)}>+ Tomorrow</button>
                <button type="button" className="secondary sm" onClick={() => addDate(3)}>+ In 3 Days</button>
              </div>
            </div>

            <div className="option-list">
              {dates.map((item, index) => (
                <div className="option-grid-date" key={index}>
                  <input
                    type="date"
                    value={item.date}
                    onChange={(e) => handleDateChange(index, "date", e.target.value)}
                    aria-label="Date"
                  />
                  <input
                    type="time"
                    value={item.time}
                    onChange={(e) => handleDateChange(index, "time", e.target.value)}
                    aria-label="Start time"
                    title="Start time"
                  />
                  <input
                    type="time"
                    value={item.endTime}
                    onChange={(e) => handleDateChange(index, "endTime", e.target.value)}
                    aria-label="End time (optional)"
                    title="End time (optional)"
                  />
                  {dates.length > 1 && (
                    <button
                      type="button"
                      className="danger-btn sm icon-only"
                      onClick={() => removeDate(index)}
                      aria-label="Remove date"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button type="button" className="secondary sm" onClick={() => addDate()}>
              <Plus size={15} /> Add another date slot
            </button>
          </section>

          {/* Section 3: Venue Options */}
          <section className="studio-card glass-card">
            <div className="card-sec-head">
              <MapPin size={18} />
              <h3>3. Venue &amp; Online Link Options</h3>
            </div>

            <div className="option-list">
              {venues.map((item, index) => (
                <div className="venue-option-box" key={index}>
                  <div className="venue-row-top">
                    <select
                      value={item.mode}
                      onChange={(e) => handleVenueChange(index, "mode", e.target.value)}
                      className="mode-select"
                    >
                      <option value="In-Person">In-Person</option>
                      <option value="Online">Online</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                    <input
                      placeholder="Place name (e.g. Haveli Restaurant, Lab 3)"
                      value={item.place}
                      onChange={(e) => handleVenueChange(index, "place", e.target.value)}
                    />
                    {venues.length > 1 && (
                      <button
                        type="button"
                        className="danger-btn sm icon-only"
                        onClick={() => removeVenue(index)}
                        aria-label="Remove venue"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  <div className="venue-row-bottom">
                    <input
                      placeholder="Online meeting or Google Maps link (optional)"
                      value={item.link}
                      onChange={(e) => handleVenueChange(index, "link", e.target.value)}
                    />
                    <input
                      placeholder="Est. cost (e.g. Rs 1,500)"
                      value={item.estimatedCost}
                      onChange={(e) => handleVenueChange(index, "estimatedCost", e.target.value)}
                      className="cost-input"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button type="button" className="secondary sm" onClick={addVenue}>
              <Plus size={15} /> Add another venue
            </button>
          </section>

          {/* Section 4: Smart Poll Rules */}
          <section className="studio-card glass-card">
            <div className="card-sec-head">
              <Sliders size={18} />
              <h3>4. Smart Poll Rules &amp; Capacity</h3>
            </div>

            <div className="rules-grid">
              <div className="rule-tile">
                <div>
                  <div className="rule-title">Voting Mode</div>
                  <div className="rule-desc">Allow multiple slots or restrict to 1 choice per person.</div>
                </div>
                <div className="seg-control">
                  <button
                    type="button"
                    className={votingMode === "multiple" ? "active" : "ghost"}
                    onClick={() => setVotingMode("multiple")}
                  >
                    Multi
                  </button>
                  <button
                    type="button"
                    className={votingMode === "single" ? "active" : "ghost"}
                    onClick={() => setVotingMode("single")}
                  >
                    Single
                  </button>
                </div>
              </div>

              <label className="rule-tile clickable">
                <div>
                  <div className="rule-title"><Lightbulb size={14} /> Participant Suggestions</div>
                  <div className="rule-desc">Let guests propose extra dates or venues live.</div>
                </div>
                <input
                  type="checkbox"
                  className="toggle-check"
                  checked={allowSuggestions}
                  onChange={(e) => setAllowSuggestions(e.target.checked)}
                />
              </label>

              <label className="rule-tile clickable">
                <div>
                  <div className="rule-title"><Lock size={14} /> Anonymous Voting</div>
                  <div className="rule-desc">Hide voter names in polls &amp; availability matrix.</div>
                </div>
                <input
                  type="checkbox"
                  className="toggle-check"
                  checked={anonymousVoting}
                  onChange={(e) => setAnonymousVoting(e.target.checked)}
                />
              </label>

              <div className="rule-tile">
                <div>
                  <div className="rule-title"><Users size={14} /> Max Attendees</div>
                  <div className="rule-desc">0 = unlimited. Extra RSVPs join Waitlist.</div>
                </div>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={maxAttendees}
                  onChange={(e) => setMaxAttendees(e.target.value)}
                  className="cap-input"
                />
              </div>
            </div>

            <div className="two-col" style={{ marginTop: 12 }}>
              <div className="field-group">
                <label htmlFor="deadline"><Clock size={13} /> Voting Deadline (Optional)</label>
                <input
                  id="deadline"
                  type="datetime-local"
                  value={votingDeadline}
                  onChange={(e) => setVotingDeadline(e.target.value)}
                />
              </div>
              <label className="rule-tile clickable" style={{ alignSelf: "end" }}>
                <div>
                  <div className="rule-title"><Zap size={14} /> Auto-Finalize on Deadline</div>
                  <div className="rule-desc">Automatically lock top-voted slot when timer ends.</div>
                </div>
                <input
                  type="checkbox"
                  className="toggle-check"
                  disabled={!votingDeadline}
                  checked={autoFinalize}
                  onChange={(e) => setAutoFinalize(e.target.checked)}
                />
              </label>
            </div>
          </section>

          {/* Section 5: Bonus Custom Poll & Agenda */}
          <section className="studio-card glass-card">
            <div className="card-sec-head">
              <HelpCircle size={18} />
              <h3>5. Bonus Custom Poll &amp; Agenda (Optional)</h3>
            </div>

            <label className="rule-tile clickable" style={{ marginBottom: 14 }}>
              <div>
                <div className="rule-title">Add a Custom Poll Question</div>
                <div className="rule-desc">e.g. &quot;What cuisine should we order?&quot; or &quot;Which topic first?&quot;</div>
              </div>
              <input
                type="checkbox"
                className="toggle-check"
                checked={enableCustomPoll}
                onChange={(e) => setEnableCustomPoll(e.target.checked)}
              />
            </label>

            {enableCustomPoll && (
              <div className="custom-poll-builder">
                <input
                  placeholder="Poll question..."
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                />
                {customOptions.map((opt, idx) => (
                  <div className="custom-opt-row" key={idx}>
                    <input
                      placeholder={`Option ${idx + 1}`}
                      value={opt}
                      onChange={(e) =>
                        setCustomOptions((prev) => prev.map((v, i) => (i === idx ? e.target.value : v)))
                      }
                    />
                    {customOptions.length > 2 && (
                      <button
                        type="button"
                        className="danger-btn sm icon-only"
                        onClick={() => setCustomOptions((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="secondary sm"
                  onClick={() => setCustomOptions((prev) => [...prev, ""])}
                >
                  <Plus size={14} /> Add poll option
                </button>
              </div>
            )}

            <div className="field-group" style={{ marginTop: 14 }}>
              <label htmlFor="agenda"><FileText size={13} /> Event / Meeting Agenda (Optional)</label>
              <textarea
                id="agenda"
                rows="4"
                placeholder="1. Kickoff&#10;2. Main discussion&#10;3. Wrap-up"
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
              />
            </div>
          </section>

          {error && <div className="error-banner">{error}</div>}

          <div className="studio-submit-bar">
            <button type="button" className="secondary" onClick={() => navigate("/dashboard")}>
              Cancel
            </button>
            <button type="submit" disabled={submitting}>
              <Sparkles size={17} />
              <span>{submitting ? "Creating Event..." : "Launch Event Poll"}</span>
            </button>
          </div>
        </form>

        {/* Live Card Preview */}
        <aside className="studio-preview-col">
          <div className="preview-sticky">
            <div className="preview-caption">LIVE CARD PREVIEW</div>
            <div className="event-card-ultra glass-card">
              <div
                className="event-card-banner"
                style={{ background: getCoverGradient(coverTheme, type) }}
              >
                <div className="banner-top-row">
                  <span className="event-emoji-badge">{icon || getDefaultIcon(type)}</span>
                  <div className="banner-pills">
                    <span className="banner-pill host">Host</span>
                    <span className="banner-pill open">Open Poll</span>
                  </div>
                </div>
                <div className="banner-bottom-row">
                  <span className="banner-type">{type}</span>
                  <span className="banner-countdown mono">{dates.length} slot(s)</span>
                </div>
              </div>
              <div className="event-card-body">
                <h3>{title.trim() || "Your Awesome Event"}</h3>
                <p className="event-card-desc">
                  {description.trim() || "Add a short description so participants know what to expect."}
                </p>
                <div className="event-card-meta">
                  <div className="meta-line">
                    <Calendar size={14} />
                    <span>
                      {formatNiceDate(previewDate)}
                      {dates[0]?.time ? ` • ${dates[0].time}` : ""}
                    </span>
                  </div>
                  <div className="meta-line">
                    <MapPin size={14} />
                    <span>{previewVenue}</span>
                  </div>
                </div>
                <div className="preview-rule-tags">
                  <span className="pill pill-indigo">{votingMode === "single" ? "Single Choice" : "Multi Choice"}</span>
                  {allowSuggestions && <span className="pill pill-success">Suggestions On</span>}
                  {anonymousVoting && <span className="pill pill-warning">Anonymous</span>}
                  {Number(maxAttendees) > 0 && <span className="pill pill-neutral">Cap: {maxAttendees}</span>}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default CreateEvent;

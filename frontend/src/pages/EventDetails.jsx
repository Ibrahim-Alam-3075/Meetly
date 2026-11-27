import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { io } from "socket.io-client";
import confetti from "canvas-confetti";
import { QRCodeSVG } from "qrcode.react";
import {
  Calendar,
  MapPin,
  Copy,
  QrCode,
  Mail,
  CopyPlus,
  Download,
  ExternalLink,
  Trash2,
  RotateCcw,
  Crown,
  Check,
  HelpCircle,
  Plus,
  Dices,
  Sparkles,
  Grid3X3,
  BarChart3,
  MessageSquare,
  ListChecks,
  Receipt,
  Send,
  Lock,
  Clock,
  Users,
  CheckCircle2,
  X
} from "lucide-react";
import { updateEvent, removeEvent } from "../eventSlice";
import { useToast } from "../context/ToastContext";
import {
  getCoverGradient,
  getDefaultIcon,
  getInitials,
  formatNiceDate,
  getOptionScore,
  getVoterId,
  downloadICS,
  getGoogleCalendarUrl
} from "../utils/themePresets";
import "./EventDetails.css";

function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { addToast } = useToast();
  const currentUser = useSelector((state) => state.auth.currentUser);
  const storeEvent = useSelector((state) => state.event.events.find((e) => e._id === id));

  const [event, setEvent] = useState(storeEvent || null);
  const [loading, setLoading] = useState(!storeEvent);
  const [activeTab, setActiveTab] = useState("polls");
  const [pollView, setPollView] = useState("cards");

  // Modals
  const [showQrModal, setShowQrModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmails, setInviteEmails] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);

  // Suggestions
  const [showSuggestDate, setShowSuggestDate] = useState(false);
  const [sugDate, setSugDate] = useState("");
  const [sugTime, setSugTime] = useState("19:00");
  const [sugEndTime, setSugEndTime] = useState("");

  const [showSuggestVenue, setShowSuggestVenue] = useState(false);
  const [sugPlace, setSugPlace] = useState("");
  const [sugLink, setSugLink] = useState("");
  const [sugMode, setSugMode] = useState("In-Person");
  const [sugCost, setSugCost] = useState("");

  // Finalize manual selection
  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const [selectedVenueIdx, setSelectedVenueIdx] = useState(0);

  // Preferences, Agenda, Discussion, Tasks, Expenses
  const [prefText, setPrefText] = useState("");
  const [editingAgenda, setEditingAgenda] = useState(false);
  const [agendaDraft, setAgendaDraft] = useState("");
  const [commentText, setCommentText] = useState("");
  const [taskText, setTaskText] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [expTitle, setExpTitle] = useState("");
  const [expAmount, setExpAmount] = useState("");

  const token = localStorage.getItem("token");

  const fetchEvent = useCallback(() => {
    if (!token) return;
    fetch(`http://localhost:5000/api/events/${id}`, {
      headers: { Authorization: "Bearer " + token }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data._id) {
          setEvent(data);
          dispatch(updateEvent(data));
          const myPref = (data.preferences || []).find(
            (p) => currentUser && String(p.user) === String(currentUser._id)
          );
          if (myPref) setPrefText(myPref.text);
          setAgendaDraft(data.agenda || "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, token, dispatch, currentUser]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  // Socket.io Real-Time Live Sync
  useEffect(() => {
    if (!id || !token) return;
    const socket = io("http://localhost:5000", { transports: ["websocket", "polling"] });
    socket.emit("join-event", id);
    socket.on("event-updated", (payload) => {
      if (payload && String(payload.eventId) === String(id)) {
        fetchEvent();
      }
    });
    return () => {
      socket.emit("leave-event", id);
      socket.disconnect();
    };
  }, [id, token, fetchEvent]);

  // Derived scoring & smart recommendation
  const pollStats = useMemo(() => {
    if (!event) return null;
    const dateScores = (event.dates || []).map((d) => getOptionScore(d));
    const venueScores = (event.venues || []).map((v) => getOptionScore(v));
    const maxDateScore = Math.max(...dateScores, 0);
    const maxVenueScore = Math.max(...venueScores, 0);
    const totalDateScore = dateScores.reduce((a, b) => a + b, 0);
    const totalVenueScore = venueScores.reduce((a, b) => a + b, 0);

    const topDateIndices = dateScores
      .map((s, i) => (s === maxDateScore && maxDateScore > 0 ? i : -1))
      .filter((i) => i !== -1);
    const topVenueIndices = venueScores
      .map((s, i) => (s === maxVenueScore && maxVenueScore > 0 ? i : -1))
      .filter((i) => i !== -1);

    const bestDateIdx = topDateIndices[0] ?? 0;
    const bestVenueIdx = topVenueIndices[0] ?? 0;
    const hasTie = topDateIndices.length > 1 || topVenueIndices.length > 1;

    // Build Availability Matrix participants list
    const voterMap = new Map();
    (event.dates || []).forEach((d) => {
      [...(d.votes || []), ...(d.maybeVotes || [])].forEach((v) => {
        const vid = getVoterId(v);
        if (!voterMap.has(vid)) {
          voterMap.set(vid, {
            _id: vid,
            name: typeof v === "object" && v.name ? v.name : "Participant",
            avatarColor: (typeof v === "object" && v.avatarColor) || "#6366f1"
          });
        }
      });
    });

    return {
      dateScores,
      venueScores,
      maxDateScore,
      maxVenueScore,
      totalDateScore,
      totalVenueScore,
      topDateIndices,
      topVenueIndices,
      bestDateIdx,
      bestVenueIdx,
      hasTie,
      matrixVoters: Array.from(voterMap.values())
    };
  }, [event]);

  if (!currentUser) {
    return (
      <div className="empty-state glass-card">
        <h2>Sign in to view &amp; vote on this event</h2>
        <Link to="/login" className="hero-btn-primary">Sign In</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="event-details-ultra">
        <div className="skeleton" style={{ height: 200 }} />
        <div className="skeleton" style={{ height: 340 }} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="empty-state glass-card">
        <h2>Event not found</h2>
        <Link to="/dashboard" className="hero-btn-primary">Back to Dashboard</Link>
      </div>
    );
  }

  const organizerId = event.organizer?._id || event.organizer;
  const isOrganizer = String(organizerId) === String(currentUser._id);
  const myId = String(currentUser._id);
  const myAttendance = (event.attendance || []).find((a) => String(a.user) === myId);
  const votingMode = event.pollSettings?.votingMode || "multiple";
  const allowSuggestions = event.pollSettings?.allowSuggestions !== false;
  const isAnonymous = Boolean(event.pollSettings?.anonymousVoting);
  const shareUrl = `${window.location.origin}/event/${event._id}`;

  async function apiCall(path, method, body, successMsg) {
    try {
      const res = await fetch(`http://localhost:5000/api/events/${event._id}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: body ? JSON.stringify(body) : undefined
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.message || "Action failed", "error");
        return null;
      }
      if (data._id) {
        setEvent(data);
        dispatch(updateEvent(data));
      }
      if (successMsg) addToast(successMsg, "success");
      return data;
    } catch {
      addToast("Could not reach the server", "error");
      return null;
    }
  }

  function handleVote(kind, index, level = "yes") {
    apiCall("/vote", "POST", { kind, index, level });
  }

  async function handleSuggestDate(e) {
    e.preventDefault();
    if (!sugDate) return;
    const res = await apiCall(
      "/suggest",
      "POST",
      { kind: "dates", date: sugDate, time: sugTime, endTime: sugEndTime },
      "Date option suggested & voted!"
    );
    if (res) {
      setSugDate("");
      setSugEndTime("");
      setShowSuggestDate(false);
    }
  }

  async function handleSuggestVenue(e) {
    e.preventDefault();
    if (!sugPlace.trim() && !sugLink.trim()) return;
    const res = await apiCall(
      "/suggest",
      "POST",
      {
        kind: "venues",
        place: sugPlace.trim(),
        link: sugLink.trim(),
        mode: sugMode,
        estimatedCost: sugCost.trim()
      },
      "Venue option suggested & voted!"
    );
    if (res) {
      setSugPlace("");
      setSugLink("");
      setSugCost("");
      setShowSuggestVenue(false);
    }
  }

  async function handleFinalize(dIdx, vIdx) {
    const res = await apiCall(
      "/finalize",
      "PATCH",
      { dateIndex: dIdx, venueIndex: vIdx },
      "Event finalized! Notifications sent."
    );
    if (res) {
      confetti({ particleCount: 110, spread: 75, origin: { y: 0.6 } });
    }
  }

  function handleRandomTieBreaker() {
    if (!pollStats) return;
    const dPool = pollStats.topDateIndices.length ? pollStats.topDateIndices : [0];
    const vPool = pollStats.topVenueIndices.length ? pollStats.topVenueIndices : [0];
    const pickedD = dPool[Math.floor(Math.random() * dPool.length)];
    const pickedV = vPool[Math.floor(Math.random() * vPool.length)];
    setSelectedDateIdx(pickedD);
    setSelectedVenueIdx(pickedV);
    addToast(
      `Tie-breaker picked: ${formatNiceDate(event.dates[pickedD]?.date)} & ${event.venues[pickedV]?.place || "Venue " + (pickedV + 1)}`,
      "info"
    );
  }

  async function handleDeleteEvent() {
    if (!window.confirm("Delete this event permanently?")) return;
    const res = await apiCall("", "DELETE", null, "Event deleted");
    if (res) {
      dispatch(removeEvent(event._id));
      navigate("/dashboard");
    }
  }

  async function handleSendInvites(e) {
    e.preventDefault();
    if (!inviteEmails.trim()) return;
    setSendingInvite(true);
    const res = await apiCall("/invite", "POST", { emails: inviteEmails });
    setSendingInvite(false);
    if (res) {
      addToast(res.message || "Invites sent!", "success");
      setInviteEmails("");
      setShowInviteModal(false);
    }
  }

  async function handleAddComment(e) {
    e.preventDefault();
    if (!commentText.trim()) return;
    const res = await apiCall("/comments", "POST", { text: commentText.trim() });
    if (res) setCommentText("");
  }

  async function handleAddTask(e) {
    e.preventDefault();
    if (!taskText.trim()) return;
    const res = await apiCall("/tasks", "POST", { text: taskText.trim(), assigneeName: taskAssignee.trim() }, "Task added");
    if (res) {
      setTaskText("");
      setTaskAssignee("");
    }
  }

  async function handleAddExpense(e) {
    e.preventDefault();
    if (!expTitle.trim() || !expAmount || Number(expAmount) <= 0) return;
    const res = await apiCall("/expenses", "POST", { title: expTitle.trim(), amount: Number(expAmount) }, "Expense added");
    if (res) {
      setExpTitle("");
      setExpAmount("");
    }
  }

  const totalExpenses = (event.expenses || []).reduce((sum, ex) => sum + (Number(ex.amount) || 0), 0);
  const splitDivisor = Math.max(event.attendanceSummary?.yes || 1, 1);
  const completedTasks = (event.tasks || []).filter((t) => t.completed).length;
  const mapQuery = event.finalVenue?.place || event.venues?.[pollStats?.bestVenueIdx || 0]?.place || "";

  return (
    <div className="event-details-ultra fade-up">
      {/* Hero Banner */}
      <section className="event-hero glass-card">
        <div
          className="event-hero-cover"
          style={{ background: getCoverGradient(event.coverTheme, event.type) }}
        >
          <div className="hero-cover-top">
            <span className="hero-emoji">{event.icon || getDefaultIcon(event.type)}</span>
            <div className="hero-badges">
              <span className="live-dot-pill">
                <span className="live-dot" /> Live Sync
              </span>
              <span className="banner-pill">{event.type}</span>
              <span className="banner-pill">
                {event.votingClosed ? "Finalized" : "Voting Open"}
              </span>
              <span className="banner-pill">
                {votingMode === "single" ? "Single Choice" : "Multi Choice"}
              </span>
              {isAnonymous && (
                <span className="banner-pill"><Lock size={11} /> Anonymous</span>
              )}
            </div>
          </div>

          <div className="hero-cover-body">
            <h1>{event.title}</h1>
            <p className="hero-org">
              Hosted by <strong>{event.organizer?.name || "Organizer"}</strong>
              {event.pollSettings?.votingDeadline && !event.votingClosed && (
                <span className="hero-deadline mono">
                  <Clock size={13} /> Closes {new Date(event.pollSettings.votingDeadline).toLocaleString()}
                </span>
              )}
            </p>
            {event.description && <p className="hero-desc">{event.description}</p>}
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="hero-toolbar">
          <button
            type="button"
            className="secondary sm"
            onClick={() => {
              navigator.clipboard.writeText(shareUrl);
              addToast("Event link copied to clipboard!", "success");
            }}
          >
            <Copy size={14} /> Copy Link
          </button>
          <button type="button" className="secondary sm" onClick={() => setShowQrModal(true)}>
            <QrCode size={14} /> QR Code
          </button>
          <button type="button" className="secondary sm" onClick={() => setShowInviteModal(true)}>
            <Mail size={14} /> Email Invite
          </button>
          <button
            type="button"
            className="secondary sm"
            onClick={() => navigate("/create", { state: { duplicateFrom: event } })}
          >
            <CopyPlus size={14} /> Duplicate
          </button>
          <button type="button" className="secondary sm" onClick={() => downloadICS(event)}>
            <Download size={14} /> .ICS
          </button>
          <a
            href={getGoogleCalendarUrl(event)}
            target="_blank"
            rel="noreferrer"
            className="toolbar-link-btn"
          >
            <ExternalLink size={14} /> Google Cal
          </a>

          {isOrganizer && event.votingClosed && (
            <button
              type="button"
              className="secondary sm"
              onClick={() => apiCall("/reopen", "PATCH", null, "Voting reopened!")}
            >
              <RotateCcw size={14} /> Reopen Poll
            </button>
          )}
          {isOrganizer && (
            <button type="button" className="danger-btn sm" onClick={handleDeleteEvent}>
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      </section>

      {/* Finalized Confirmation Banner */}
      {event.votingClosed && (
        <section className="finalized-banner glass-card">
          <div className="finalized-icon"><CheckCircle2 size={26} /></div>
          <div className="finalized-info">
            <div className="finalized-kicker">CONFIRMED PLAN</div>
            <h3>
              {formatNiceDate(event.finalDate)}
              {event.finalTime ? ` at ${event.finalTime}` : ""}
            </h3>
            <p>
              <MapPin size={14} /> {event.finalVenue?.place || "Online Event"}
              {event.finalVenue?.link && (
                <>
                  {" — "}
                  <a href={event.finalVenue.link} target="_blank" rel="noreferrer">
                    Open Link <ExternalLink size={12} />
                  </a>
                </>
              )}
            </p>
          </div>
        </section>
      )}

      {/* Workspace Tabs */}
      <div className="workspace-tabs">
        <button
          type="button"
          className={`tab-btn ${activeTab === "polls" ? "active" : ""}`}
          onClick={() => setActiveTab("polls")}
        >
          <BarChart3 size={16} />
          <span>Polls &amp; RSVP</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "discussion" ? "active" : ""}`}
          onClick={() => setActiveTab("discussion")}
        >
          <MessageSquare size={16} />
          <span>Discussion</span>
          <span className="tab-count mono">{event.comments?.length || 0}</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "tasks" ? "active" : ""}`}
          onClick={() => setActiveTab("tasks")}
        >
          <ListChecks size={16} />
          <span>Checklist &amp; Agenda</span>
          <span className="tab-count mono">{completedTasks}/{event.tasks?.length || 0}</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "expenses" ? "active" : ""}`}
          onClick={() => setActiveTab("expenses")}
        >
          <Receipt size={16} />
          <span>Expenses</span>
          {totalExpenses > 0 && <span className="tab-count mono">Rs {totalExpenses.toLocaleString()}</span>}
        </button>
      </div>

      {/* TAB 1: POLLS & RSVP */}
      {activeTab === "polls" && (
        <div className="polls-workspace">
          {/* Smart Best Match Recommender */}
          {!event.votingClosed && pollStats && event.dates?.length > 0 && (
            <div className="best-match-bar glass-card">
              <div className="best-match-left">
                <span className="best-match-badge">
                  <Sparkles size={14} /> Smart Best Match
                </span>
                <div className="best-match-text">
                  <strong>{formatNiceDate(event.dates[pollStats.bestDateIdx]?.date)}</strong>
                  {event.dates[pollStats.bestDateIdx]?.time && ` (${event.dates[pollStats.bestDateIdx].time})`}
                  {event.venues?.[pollStats.bestVenueIdx] && (
                    <> • <strong>{event.venues[pollStats.bestVenueIdx].place || "Online Link"}</strong></>
                  )}
                  {pollStats.hasTie && <span className="pill pill-warning" style={{ marginLeft: 8 }}>Tie!</span>}
                </div>
              </div>
              {isOrganizer && (
                <div className="best-match-actions">
                  {pollStats.hasTie && (
                    <button type="button" className="secondary sm" onClick={handleRandomTieBreaker}>
                      <Dices size={15} /> Random Tie-Breaker
                    </button>
                  )}
                  <button
                    type="button"
                    className="sm"
                    onClick={() => handleFinalize(pollStats.bestDateIdx, pollStats.bestVenueIdx)}
                  >
                    <Crown size={15} /> Finalize Top Match
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Poll View Mode Switcher */}
          <div className="poll-subbar">
            <span className="poll-hint">
              Weighted scoring: <strong>Yes = 2 pts</strong> • <strong>If Needed = 1 pt</strong>
            </span>
            <div className="view-toggle">
              <button
                type="button"
                className={pollView === "cards" ? "active" : "ghost"}
                onClick={() => setPollView("cards")}
              >
                <BarChart3 size={14} /> Poll Cards
              </button>
              <button
                type="button"
                className={pollView === "matrix" ? "active" : "ghost"}
                onClick={() => setPollView("matrix")}
              >
                <Grid3X3 size={14} /> Availability Matrix
              </button>
            </div>
          </div>

          {pollView === "matrix" ? (
            <div className="matrix-card glass-card">
              <h3>Date Availability Matrix</h3>
              {pollStats.matrixVoters.length === 0 ? (
                <p className="muted-msg">No votes yet. Cast a vote in Poll Cards to populate the matrix!</p>
              ) : (
                <div className="matrix-scroll">
                  <table className="matrix-table">
                    <thead>
                      <tr>
                        <th>Participant</th>
                        {(event.dates || []).map((d, idx) => (
                          <th key={idx}>
                            <div>{formatNiceDate(d.date)}</div>
                            <div className="mono small-sub">{d.time || "Any time"}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pollStats.matrixVoters.map((voter) => (
                        <tr key={voter._id}>
                          <td className="matrix-user">
                            <span
                              className="avatar-circle"
                              style={{ width: 26, height: 26, fontSize: "0.7rem", background: voter.avatarColor }}
                            >
                              {getInitials(voter.name)}
                            </span>
                            <span>{voter.name}</span>
                          </td>
                          {(event.dates || []).map((d, idx) => {
                            const isYes = (d.votes || []).some((v) => getVoterId(v) === voter._id);
                            const isMaybe = (d.maybeVotes || []).some((v) => getVoterId(v) === voter._id);
                            return (
                              <td key={idx} className="matrix-cell">
                                {isYes ? (
                                  <span className="m-chip yes">✓ Yes</span>
                                ) : isMaybe ? (
                                  <span className="m-chip maybe">~ Maybe</span>
                                ) : (
                                  <span className="m-chip none">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="polls-two-col">
              {/* Date Poll Column */}
              <div className="poll-col glass-card">
                <div className="poll-col-head">
                  <h3><Calendar size={18} /> Date &amp; Time Poll</h3>
                  {!event.votingClosed && allowSuggestions && (
                    <button
                      type="button"
                      className="secondary sm"
                      onClick={() => setShowSuggestDate((v) => !v)}
                    >
                      <Plus size={14} /> Suggest Date
                    </button>
                  )}
                </div>

                {showSuggestDate && (
                  <form className="suggest-form" onSubmit={handleSuggestDate}>
                    <input type="date" value={sugDate} onChange={(e) => setSugDate(e.target.value)} required />
                    <div className="suggest-row">
                      <input type="time" value={sugTime} onChange={(e) => setSugTime(e.target.value)} />
                      <input type="time" value={sugEndTime} onChange={(e) => setSugEndTime(e.target.value)} title="End time" />
                      <button type="submit" className="sm">Add</button>
                    </div>
                  </form>
                )}

                <div className="poll-options-stack">
                  {(event.dates || []).map((opt, idx) => {
                    const score = pollStats.dateScores[idx];
                    const pct = pollStats.totalDateScore
                      ? Math.round((score / pollStats.totalDateScore) * 100)
                      : 0;
                    const isLeading = score === pollStats.maxDateScore && score > 0;
                    const votedYes = (opt.votes || []).some((v) => getVoterId(v) === myId);
                    const votedMaybe = (opt.maybeVotes || []).some((v) => getVoterId(v) === myId);

                    return (
                      <div key={opt._id || idx} className={`poll-opt-card ${isLeading ? "leading" : ""}`}>
                        <div className="poll-progress-bg" style={{ width: `${pct}%` }} />
                        <div className="poll-opt-content">
                          <div className="poll-opt-top">
                            <div>
                              <div className="poll-opt-title">
                                {formatNiceDate(opt.date)}
                                {opt.time && (
                                  <span className="mono opt-time">
                                    {" "}• {opt.time}{opt.endTime ? `–${opt.endTime}` : ""}
                                  </span>
                                )}
                              </div>
                              {opt.suggestedBy && (
                                <span className="suggested-tag">Suggested by {opt.suggestedBy}</span>
                              )}
                            </div>
                            <div className="poll-opt-score">
                              {isLeading && <span className="pill pill-warning"><Crown size={11} /> Leading</span>}
                              <span className="mono score-num">{score} pts ({pct}%)</span>
                            </div>
                          </div>

                          <div className="poll-opt-bottom">
                            <div className="voter-chips">
                              {(opt.votes || []).slice(0, 5).map((v, i) => (
                                <span
                                  key={i}
                                  className="avatar-circle voter-av yes-ring"
                                  style={{ background: (typeof v === "object" && v.avatarColor) || "#6366f1" }}
                                  title={`${typeof v === "object" ? v.name : "Voter"} (Yes)`}
                                >
                                  {getInitials(typeof v === "object" ? v.name : "V")}
                                </span>
                              ))}
                              {(opt.maybeVotes || []).slice(0, 3).map((v, i) => (
                                <span
                                  key={`m-${i}`}
                                  className="avatar-circle voter-av maybe-ring"
                                  style={{ background: (typeof v === "object" && v.avatarColor) || "#f59e0b" }}
                                  title={`${typeof v === "object" ? v.name : "Voter"} (If Needed)`}
                                >
                                  {getInitials(typeof v === "object" ? v.name : "M")}
                                </span>
                              ))}
                              <span className="vote-counts-mini mono">
                                {opt.votes?.length || 0}✓ {opt.maybeVotes?.length || 0}~
                              </span>
                            </div>

                            {!event.votingClosed && (
                              <div className="vote-btn-pair">
                                <button
                                  type="button"
                                  className={`vote-pill-btn ${votedYes ? "yes-active" : "secondary"}`}
                                  onClick={() => handleVote("dates", idx, "yes")}
                                >
                                  <Check size={13} /> Yes
                                </button>
                                <button
                                  type="button"
                                  className={`vote-pill-btn ${votedMaybe ? "maybe-active" : "secondary"}`}
                                  onClick={() => handleVote("dates", idx, "maybe")}
                                >
                                  <HelpCircle size={13} /> If Needed
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Venue Poll Column */}
              <div className="poll-col glass-card">
                <div className="poll-col-head">
                  <h3><MapPin size={18} /> Venue Poll</h3>
                  {!event.votingClosed && allowSuggestions && (
                    <button
                      type="button"
                      className="secondary sm"
                      onClick={() => setShowSuggestVenue((v) => !v)}
                    >
                      <Plus size={14} /> Suggest Venue
                    </button>
                  )}
                </div>

                {showSuggestVenue && (
                  <form className="suggest-form" onSubmit={handleSuggestVenue}>
                    <div className="suggest-row">
                      <select value={sugMode} onChange={(e) => setSugMode(e.target.value)} style={{ width: 120 }}>
                        <option>In-Person</option>
                        <option>Online</option>
                        <option>Hybrid</option>
                      </select>
                      <input
                        placeholder="Place name"
                        value={sugPlace}
                        onChange={(e) => setSugPlace(e.target.value)}
                      />
                    </div>
                    <div className="suggest-row">
                      <input
                        placeholder="Link (optional)"
                        value={sugLink}
                        onChange={(e) => setSugLink(e.target.value)}
                      />
                      <input
                        placeholder="Est. cost"
                        value={sugCost}
                        onChange={(e) => setSugCost(e.target.value)}
                        style={{ width: 120 }}
                      />
                      <button type="submit" className="sm">Add</button>
                    </div>
                  </form>
                )}

                <div className="poll-options-stack">
                  {(event.venues || []).map((opt, idx) => {
                    const score = pollStats.venueScores[idx];
                    const pct = pollStats.totalVenueScore
                      ? Math.round((score / pollStats.totalVenueScore) * 100)
                      : 0;
                    const isLeading = score === pollStats.maxVenueScore && score > 0;
                    const votedYes = (opt.votes || []).some((v) => getVoterId(v) === myId);
                    const votedMaybe = (opt.maybeVotes || []).some((v) => getVoterId(v) === myId);

                    return (
                      <div key={opt._id || idx} className={`poll-opt-card ${isLeading ? "leading" : ""}`}>
                        <div className="poll-progress-bg" style={{ width: `${pct}%` }} />
                        <div className="poll-opt-content">
                          <div className="poll-opt-top">
                            <div>
                              <div className="poll-opt-title">
                                {opt.place || "Online Meeting"}
                                {opt.mode && <span className="pill pill-neutral" style={{ marginLeft: 8 }}>{opt.mode}</span>}
                                {opt.estimatedCost && (
                                  <span className="pill pill-indigo mono" style={{ marginLeft: 6 }}>{opt.estimatedCost}</span>
                                )}
                              </div>
                              {opt.link && (
                                <a href={opt.link} target="_blank" rel="noreferrer" className="venue-ext-link">
                                  {opt.link} <ExternalLink size={11} />
                                </a>
                              )}
                              {opt.suggestedBy && (
                                <span className="suggested-tag">Suggested by {opt.suggestedBy}</span>
                              )}
                            </div>
                            <div className="poll-opt-score">
                              {isLeading && <span className="pill pill-warning"><Crown size={11} /> Leading</span>}
                              <span className="mono score-num">{score} pts ({pct}%)</span>
                            </div>
                          </div>

                          <div className="poll-opt-bottom">
                            <div className="voter-chips">
                              {(opt.votes || []).slice(0, 5).map((v, i) => (
                                <span
                                  key={i}
                                  className="avatar-circle voter-av yes-ring"
                                  style={{ background: (typeof v === "object" && v.avatarColor) || "#6366f1" }}
                                  title={`${typeof v === "object" ? v.name : "Voter"} (Yes)`}
                                >
                                  {getInitials(typeof v === "object" ? v.name : "V")}
                                </span>
                              ))}
                              <span className="vote-counts-mini mono">
                                {opt.votes?.length || 0}✓ {opt.maybeVotes?.length || 0}~
                              </span>
                            </div>

                            {!event.votingClosed && (
                              <div className="vote-btn-pair">
                                <button
                                  type="button"
                                  className={`vote-pill-btn ${votedYes ? "yes-active" : "secondary"}`}
                                  onClick={() => handleVote("venues", idx, "yes")}
                                >
                                  <Check size={13} /> Yes
                                </button>
                                <button
                                  type="button"
                                  className={`vote-pill-btn ${votedMaybe ? "maybe-active" : "secondary"}`}
                                  onClick={() => handleVote("venues", idx, "maybe")}
                                >
                                  <HelpCircle size={13} /> If Needed
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Custom Bonus Poll */}
          {event.customPoll?.question && event.customPoll.options?.length > 0 && (
            <div className="glass-card bonus-poll-card">
              <h3><HelpCircle size={18} /> Bonus Poll: {event.customPoll.question}</h3>
              <div className="bonus-poll-grid">
                {event.customPoll.options.map((opt, idx) => {
                  const totalCustom = event.customPoll.options.reduce((a, o) => a + (o.votes?.length || 0), 0);
                  const count = opt.votes?.length || 0;
                  const pct = totalCustom ? Math.round((count / totalCustom) * 100) : 0;
                  const voted = (opt.votes || []).some((v) => getVoterId(v) === myId);
                  return (
                    <button
                      key={opt._id || idx}
                      type="button"
                      disabled={event.votingClosed}
                      className={`bonus-opt-btn ${voted ? "voted" : ""}`}
                      onClick={() => handleVote("customPoll", idx, "yes")}
                    >
                      <div className="poll-progress-bg" style={{ width: `${pct}%` }} />
                      <span className="bonus-opt-label">{voted && <Check size={14} />} {opt.label}</span>
                      <span className="mono bonus-opt-pct">{count} ({pct}%)</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* RSVP, Preferences & Manual Finalize Grid */}
          <div className="polls-two-col">
            <div className="glass-card rsvp-card">
              <div className="poll-col-head">
                <h3><Users size={18} /> RSVP &amp; Preferences</h3>
                {event.maxAttendees > 0 && (
                  <span className="pill pill-indigo mono">
                    {event.attendanceSummary?.yes || 0} / {event.maxAttendees} seats
                  </span>
                )}
              </div>

              <div className="rsvp-summary-pills">
                <span className="pill pill-success">{event.attendanceSummary?.yes || 0} Going</span>
                <span className="pill pill-warning">{event.attendanceSummary?.maybe || 0} Maybe</span>
                <span className="pill pill-danger">{event.attendanceSummary?.no || 0} Can&apos;t Go</span>
                {(event.attendanceSummary?.waitlisted || 0) > 0 && (
                  <span className="pill pill-neutral">{event.attendanceSummary.waitlisted} Waitlisted</span>
                )}
              </div>

              <div className="rsvp-buttons">
                {[
                  { key: "yes", label: "Going" },
                  { key: "maybe", label: "Maybe" },
                  { key: "no", label: "Can't Go" }
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    className={myAttendance?.choice === opt.key ? `rsvp-active-${opt.key}` : "secondary"}
                    onClick={() => apiCall("/attendance", "POST", { choice: opt.key }, `RSVP updated: ${opt.label}`)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {myAttendance?.waitlisted && (
                <p className="waitlist-note">Event is at capacity — you are on the waitlist!</p>
              )}

              {!event.votingClosed && (
                <form
                  className="pref-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!prefText.trim()) return;
                    apiCall("/preference", "POST", { text: prefText.trim() }, "Preference saved!");
                  }}
                >
                  <label htmlFor="pref-input">Personal Note / Dietary Preference</label>
                  <div className="suggest-row">
                    <input
                      id="pref-input"
                      placeholder="e.g. Vegetarian, arriving 15 mins late..."
                      value={prefText}
                      onChange={(e) => setPrefText(e.target.value)}
                    />
                    <button type="submit" className="sm">Save</button>
                  </div>
                </form>
              )}

              {isOrganizer && (event.attendance?.length > 0 || event.preferences?.length > 0) && (
                <div className="organizer-responses">
                  <h4>All Responses (Host View)</h4>
                  {(event.attendance || []).map((a, i) => (
                    <div key={i} className="resp-row">
                      <span>{a.name}</span>
                      <span className={`pill pill-${a.choice === "yes" ? "success" : a.choice === "maybe" ? "warning" : "danger"}`}>
                        {a.waitlisted ? "Waitlisted" : a.choice}
                      </span>
                    </div>
                  ))}
                  {(event.preferences || []).map((p, i) => (
                    <div key={`p-${i}`} className="pref-note-row">
                      <strong>{p.name}:</strong> {p.text}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Card: Organizer Manual Finalize + Embedded Map */}
            <div className="side-stack">
              {isOrganizer && !event.votingClosed && (
                <div className="glass-card finalize-panel">
                  <h3><Crown size={18} /> Finalize Event</h3>
                  <p className="muted-msg">Lock in the final date and venue to close voting and email participants.</p>
                  <div className="field-group">
                    <label>Winning Date</label>
                    <select value={selectedDateIdx} onChange={(e) => setSelectedDateIdx(Number(e.target.value))}>
                      {(event.dates || []).map((d, i) => (
                        <option key={i} value={i}>
                          {formatNiceDate(d.date)} {d.time ? `• ${d.time}` : ""} ({pollStats.dateScores[i]} pts)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field-group">
                    <label>Winning Venue</label>
                    <select value={selectedVenueIdx} onChange={(e) => setSelectedVenueIdx(Number(e.target.value))}>
                      {(event.venues || []).map((v, i) => (
                        <option key={i} value={i}>
                          {v.place || v.link || `Venue ${i + 1}`} ({pollStats.venueScores[i]} pts)
                        </option>
                      ))}
                    </select>
                  </div>
                  <button type="button" onClick={() => handleFinalize(selectedDateIdx, selectedVenueIdx)}>
                    <CheckCircle2 size={16} /> Confirm &amp; Finalize
                  </button>
                </div>
              )}

              {mapQuery && (
                <div className="glass-card map-card">
                  <div className="poll-col-head">
                    <h3><MapPin size={16} /> Location Map</h3>
                    <span className="muted-msg" style={{ fontSize: "0.78rem" }}>{mapQuery}</span>
                  </div>
                  <iframe
                    title="Venue Map"
                    className="venue-map-frame"
                    loading="lazy"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DISCUSSION */}
      {activeTab === "discussion" && (
        <div className="glass-card discussion-panel">
          <h3><MessageSquare size={18} /> Live Event Discussion</h3>
          <div className="comments-feed">
            {(!event.comments || event.comments.length === 0) ? (
              <p className="muted-msg">No messages yet. Start the conversation!</p>
            ) : (
              event.comments.map((c) => {
                const canDelete = isOrganizer || String(c.user) === myId;
                return (
                  <div key={c._id} className="comment-item">
                    <span
                      className="avatar-circle"
                      style={{ width: 34, height: 34, fontSize: "0.78rem", background: c.avatarColor || "#6366f1" }}
                    >
                      {getInitials(c.name)}
                    </span>
                    <div className="comment-body">
                      <div className="comment-meta">
                        <strong>{c.name}</strong>
                        <span className="mono">{new Date(c.createdAt).toLocaleString()}</span>
                        {canDelete && (
                          <button
                            type="button"
                            className="ghost sm"
                            onClick={() => apiCall(`/comments/${c._id}`, "DELETE")}
                            aria-label="Delete comment"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                      <p>{c.text}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <form className="comment-form" onSubmit={handleAddComment}>
            <input
              placeholder="Write a message to the group..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button type="submit"><Send size={15} /> Send</button>
          </form>
        </div>
      )}

      {/* TAB 3: CHECKLIST & AGENDA */}
      {activeTab === "tasks" && (
        <div className="polls-two-col">
          <div className="glass-card tasks-panel">
            <div className="poll-col-head">
              <h3><ListChecks size={18} /> Shared Checklist</h3>
              <span className="pill pill-indigo mono">{completedTasks}/{event.tasks?.length || 0} done</span>
            </div>

            <form className="task-add-form" onSubmit={handleAddTask}>
              <input
                placeholder="Add action item (e.g. Book table, bring HDMI cable)..."
                value={taskText}
                onChange={(e) => setTaskText(e.target.value)}
              />
              <input
                placeholder="Assignee (optional)"
                value={taskAssignee}
                onChange={(e) => setTaskAssignee(e.target.value)}
                style={{ maxWidth: 160 }}
              />
              <button type="submit" className="sm"><Plus size={15} /> Add</button>
            </form>

            <div className="task-list">
              {(!event.tasks || event.tasks.length === 0) ? (
                <p className="muted-msg">No tasks yet. Add items to coordinate prep work.</p>
              ) : (
                event.tasks.map((t) => (
                  <div key={t._id} className={`task-row ${t.completed ? "done" : ""}`}>
                    <label className="task-check-label">
                      <input
                        type="checkbox"
                        checked={t.completed}
                        onChange={() => apiCall(`/tasks/${t._id}`, "PATCH")}
                      />
                      <span>{t.text}</span>
                    </label>
                    <div className="task-right">
                      {t.assigneeName && <span className="pill pill-neutral">{t.assigneeName}</span>}
                      <button
                        type="button"
                        className="ghost sm"
                        onClick={() => apiCall(`/tasks/${t._id}`, "DELETE")}
                        aria-label="Delete task"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass-card agenda-panel">
            <div className="poll-col-head">
              <h3>Event Agenda</h3>
              {isOrganizer && !editingAgenda && (
                <button type="button" className="secondary sm" onClick={() => setEditingAgenda(true)}>
                  Edit Agenda
                </button>
              )}
            </div>
            {editingAgenda ? (
              <div className="agenda-edit-box">
                <textarea rows="7" value={agendaDraft} onChange={(e) => setAgendaDraft(e.target.value)} />
                <div className="suggest-row">
                  <button
                    type="button"
                    className="sm"
                    onClick={async () => {
                      const res = await apiCall("/agenda", "PATCH", { agenda: agendaDraft }, "Agenda updated!");
                      if (res) setEditingAgenda(false);
                    }}
                  >
                    Save Agenda
                  </button>
                  <button type="button" className="secondary sm" onClick={() => setEditingAgenda(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : event.agenda ? (
              <pre className="agenda-display">{event.agenda}</pre>
            ) : (
              <p className="muted-msg">No agenda added yet.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: EXPENSES */}
      {activeTab === "expenses" && (
        <div className="glass-card expenses-panel">
          <div className="expense-summary-grid">
            <div className="exp-stat">
              <span className="exp-label">Total Group Spend</span>
              <span className="exp-val mono">Rs {totalExpenses.toLocaleString()}</span>
            </div>
            <div className="exp-stat">
              <span className="exp-label">Confirmed Attendees</span>
              <span className="exp-val mono">{splitDivisor}</span>
            </div>
            <div className="exp-stat highlight">
              <span className="exp-label">Estimated Per-Person Share</span>
              <span className="exp-val mono">Rs {Math.round(totalExpenses / splitDivisor).toLocaleString()}</span>
            </div>
          </div>

          <form className="task-add-form" onSubmit={handleAddExpense}>
            <input
              placeholder="Expense item (e.g. BBQ Platter, Uber, Lab snacks)..."
              value={expTitle}
              onChange={(e) => setExpTitle(e.target.value)}
            />
            <input
              type="number"
              min="1"
              placeholder="Amount (Rs)"
              value={expAmount}
              onChange={(e) => setExpAmount(e.target.value)}
              style={{ maxWidth: 160 }}
            />
            <button type="submit" className="sm"><Plus size={15} /> Log Expense</button>
          </form>

          <div className="task-list">
            {(!event.expenses || event.expenses.length === 0) ? (
              <p className="muted-msg">No expenses logged yet.</p>
            ) : (
              event.expenses.map((ex) => (
                <div key={ex._id} className="task-row">
                  <div>
                    <strong>{ex.title}</strong>
                    <div className="muted-msg" style={{ fontSize: "0.78rem" }}>Paid by {ex.paidByName}</div>
                  </div>
                  <div className="task-right">
                    <span className="pill pill-indigo mono">Rs {Number(ex.amount).toLocaleString()}</span>
                    <button
                      type="button"
                      className="ghost sm"
                      onClick={() => apiCall(`/expenses/${ex._id}`, "DELETE")}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="modal-backdrop" onClick={() => setShowQrModal(false)}>
          <div className="modal-card glass-card qr-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close-btn" onClick={() => setShowQrModal(false)}>
              <X size={18} />
            </button>
            <h3>Scan to Join &amp; Vote</h3>
            <p className="muted-msg">Share this QR code on screen or in person.</p>
            <div className="qr-box">
              <QRCodeSVG value={shareUrl} size={200} />
            </div>
            <div className="qr-url mono">{shareUrl}</div>
          </div>
        </div>
      )}

      {/* Email Invite Modal */}
      {showInviteModal && (
        <div className="modal-backdrop" onClick={() => setShowInviteModal(false)}>
          <div className="modal-card glass-card" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close-btn" onClick={() => setShowInviteModal(false)}>
              <X size={18} />
            </button>
            <h3>Invite Participants by Email</h3>
            <p className="muted-msg" style={{ marginBottom: 14 }}>
              Enter one or more emails separated by commas.
            </p>
            <form onSubmit={handleSendInvites} className="auth-form">
              <textarea
                rows="3"
                placeholder="alice@example.com, bob@example.com"
                value={inviteEmails}
                onChange={(e) => setInviteEmails(e.target.value)}
                required
              />
              <button type="submit" disabled={sendingInvite}>
                <Mail size={16} />
                <span>{sendingInvite ? "Sending..." : "Send Invitations"}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventDetails;

import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Calendar,
  MapPin,
  Users,
  Vote,
  CheckCircle2,
  Clock,
  Lock,
  ArrowUpRight
} from "lucide-react";
import {
  getCoverGradient,
  getDefaultIcon,
  getCountdownLabel,
  formatNiceDate
} from "../utils/themePresets";
import "./EventCard.css";

function EventCard({ event }) {
  const currentUser = useSelector((state) => state.auth.currentUser);
  const today = new Date().toISOString().slice(0, 10);
  const displayDate = event.finalDate || event.date || "";
  const isUpcoming = displayDate >= today;
  const countdown = getCountdownLabel(displayDate);
  const organizerId = event.organizer?._id || event.organizer;
  const isHost = currentUser && String(organizerId) === String(currentUser._id);

  const totalVotes =
    (event.dates || []).reduce((acc, d) => acc + (d.votes?.length || 0) + (d.maybeVotes?.length || 0), 0) +
    (event.venues || []).reduce((acc, v) => acc + (v.votes?.length || 0) + (v.maybeVotes?.length || 0), 0);

  const goingCount = event.attendanceSummary
    ? event.attendanceSummary.yes
    : (event.attendance || []).filter((a) => a.choice === "yes").length;

  const venueLabel =
    event.finalVenue?.place ||
    event.venues?.[0]?.place ||
    (event.finalVenue?.link || event.venues?.[0]?.link ? "Online Link" : "Venue TBD");

  const displayTime = event.finalTime || event.dates?.[0]?.time || "";

  return (
    <Link to={`/event/${event._id}`} className="event-card-ultra glass-card">
      <div
        className="event-card-banner"
        style={{ background: getCoverGradient(event.coverTheme, event.type) }}
      >
        <div className="banner-top-row">
          <span className="event-emoji-badge">{event.icon || getDefaultIcon(event.type)}</span>
          <div className="banner-pills">
            {isHost && <span className="banner-pill host">Host</span>}
            <span className={`banner-pill ${event.votingClosed ? "final" : "open"}`}>
              {event.votingClosed ? (
                <>
                  <CheckCircle2 size={12} /> Finalized
                </>
              ) : (
                <>
                  <Vote size={12} /> Open Poll
                </>
              )}
            </span>
          </div>
        </div>
        <div className="banner-bottom-row">
          <span className="banner-type">{event.type}</span>
          {countdown && (
            <span className={`banner-countdown mono ${isUpcoming ? "" : "past"}`}>
              <Clock size={11} /> {countdown}
            </span>
          )}
        </div>
      </div>

      <div className="event-card-body">
        <div className="event-card-title-row">
          <h3>{event.title}</h3>
          <ArrowUpRight size={17} className="card-arrow" />
        </div>

        {event.description && <p className="event-card-desc">{event.description}</p>}

        <div className="event-card-meta">
          <div className="meta-line">
            <Calendar size={14} />
            <span>
              {formatNiceDate(displayDate)}
              {displayTime ? ` • ${displayTime}` : ""}
            </span>
          </div>
          <div className="meta-line">
            <MapPin size={14} />
            <span>{venueLabel}</span>
          </div>
        </div>

        <div className="event-card-footer">
          <div className="footer-stats">
            <span className="stat-chip">
              <Vote size={13} /> {totalVotes} votes
            </span>
            <span className="stat-chip">
              <Users size={13} /> {goingCount} going
            </span>
            {event.pollSettings?.anonymousVoting && (
              <span className="stat-chip" title="Anonymous Voting">
                <Lock size={12} /> Anon
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default EventCard;

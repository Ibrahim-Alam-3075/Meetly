import { useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Sparkles,
  ArrowRight,
  Vote,
  Zap,
  CalendarDays,
  Receipt,
  QrCode,
  ShieldCheck,
  Crown,
  Check
} from "lucide-react";
import "./Home.css";

const DEMO_SLOTS = [
  { id: 0, label: "Fri, Nov 27 • 7:30 PM", votes: 5 },
  { id: 1, label: "Sat, Nov 28 • 8:00 PM", votes: 3 },
  { id: 2, label: "Sun, Nov 29 • 6:30 PM", votes: 2 }
];

function Home() {
  const currentUser = useSelector((state) => state.auth.currentUser);
  const [demoVotes, setDemoVotes] = useState([5, 3, 2]);
  const [userPicked, setUserPicked] = useState(0);

  function toggleDemoVote(idx) {
    setDemoVotes((prev) =>
      prev.map((v, i) => {
        if (i === idx) return userPicked === idx ? v - 1 : v + 1;
        if (i === userPicked) return v - 1;
        return v;
      })
    );
    setUserPicked((prev) => (prev === idx ? -1 : idx));
  }

  const maxVote = Math.max(...demoVotes, 1);

  return (
    <div className="home-ultra fade-up">
      <section className="hero-grid">
        <div className="hero-copy">
          <div className="pill pill-indigo hero-badge">
            <Sparkles size={14} />
            <span>MEETLY ULTRA • REAL-TIME GROUP SCHEDULING</span>
          </div>
          <h1 className="hero-title">
            Plan group events <span className="gradient-text">without the chaos.</span>
          </h1>
          <p className="hero-subtitle">
            Weighted availability polls, live Socket.io updates, Doodle-style availability matrices,
            shared checklists, expense splitting, QR invites, and 1-click calendar export — all in one workspace.
          </p>

          <div className="hero-actions">
            {currentUser ? (
              <>
                <Link to="/dashboard" className="hero-btn-primary">
                  <span>Open Dashboard</span>
                  <ArrowRight size={18} />
                </Link>
                <Link to="/create" className="hero-btn-secondary">
                  <span>Create New Event</span>
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="hero-btn-primary">
                  <span>Start Planning Free</span>
                  <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="hero-btn-secondary">
                  <span>Sign In</span>
                </Link>
              </>
            )}
          </div>

          <div className="hero-trust">
            <span><Zap size={14} /> Instant Live Sync</span>
            <span><ShieldCheck size={14} /> Anonymous &amp; Private Polls</span>
            <span><CalendarDays size={14} /> .ICS &amp; Google Calendar</span>
          </div>
        </div>

        <div className="hero-preview glass-card">
          <div className="preview-banner">
            <span className="preview-emoji">🍽️</span>
            <div>
              <div className="preview-title">Post-Evaluation Dinner</div>
              <div className="preview-meta">Interactive Poll Preview — click to vote!</div>
            </div>
            <span className="pill pill-success">LIVE</span>
          </div>

          <div className="preview-polls">
            {DEMO_SLOTS.map((slot, idx) => {
              const count = demoVotes[idx];
              const pct = Math.round((count / Math.max(demoVotes.reduce((a, b) => a + b, 0), 1)) * 100);
              const isLeading = count === maxVote && count > 0;
              const isSelected = userPicked === idx;
              return (
                <button
                  type="button"
                  key={slot.id}
                  className={`preview-option ${isSelected ? "selected" : ""}`}
                  onClick={() => toggleDemoVote(idx)}
                >
                  <div className="preview-bar" style={{ width: `${pct}%` }} />
                  <div className="preview-option-row">
                    <span className="preview-option-label">
                      {isSelected && <Check size={14} className="check-accent" />}
                      {slot.label}
                    </span>
                    <span className="preview-option-stats">
                      {isLeading && <Crown size={14} className="crown-accent" />}
                      <span className="mono">{count} votes ({pct}%)</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bento-section">
        <div className="section-head">
          <h2>Built for effortless coordination</h2>
          <p>Everything your team or friend group needs from first idea to finalized calendar invite.</p>
        </div>

        <div className="bento-grid">
          <div className="bento-card glass-card">
            <div className="bento-icon indigo"><Vote size={22} /></div>
            <h3>Smart Weighted Polls</h3>
            <p>Support Yes (+2) and If-Needed (+1) votes, single or multi-choice rules, anonymous voting, participant suggestions, and an Availability Matrix.</p>
          </div>
          <div className="bento-card glass-card">
            <div className="bento-icon cyan"><Zap size={22} /></div>
            <h3>Real-Time Live Sync</h3>
            <p>Powered by Socket.io so votes, comments, RSVPs, and checklist items update instantly across every participant&apos;s screen.</p>
          </div>
          <div className="bento-card glass-card">
            <div className="bento-icon emerald"><Receipt size={22} /></div>
            <h3>Checklists &amp; Expense Split</h3>
            <p>Assign prep tasks, track group expenses for dinners or trips, and automatically calculate each attendee&apos;s fair share.</p>
          </div>
          <div className="bento-card glass-card">
            <div className="bento-icon rose"><QrCode size={22} /></div>
            <h3>QR, Email &amp; Calendar Export</h3>
            <p>Share scannable QR codes, email invitations, finalize with confetti, and export straight to Google Calendar or Apple Calendar (.ics).</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;

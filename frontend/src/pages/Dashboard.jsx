import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  LayoutGrid,
  CalendarDays,
  CalendarClock,
  Vote,
  CheckCircle2,
  Layers
} from "lucide-react";
import EventCard from "../components/EventCard";
import CalendarView from "../components/CalendarView";
import "./Dashboard.css";

const TYPES = ["All", "Meeting", "Hangout", "Study session", "Other"];

function Dashboard() {
  const events = useSelector((state) => state.event.events);
  const loading = useSelector((state) => state.event.loading);
  const currentUser = useSelector((state) => state.auth.currentUser);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");
  const [viewMode, setViewMode] = useState("grid");

  const today = new Date().toISOString().slice(0, 10);

  const stats = useMemo(() => {
    const upcomingCount = events.filter((e) => (e.finalDate || e.date || "") >= today).length;
    const openCount = events.filter((e) => !e.votingClosed).length;
    const finalizedCount = events.filter((e) => e.votingClosed).length;
    return { total: events.length, upcomingCount, openCount, finalizedCount };
  }, [events, today]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((ev) => {
      if (typeFilter !== "All" && ev.type !== typeFilter) return false;
      if (statusFilter === "Open" && ev.votingClosed) return false;
      if (statusFilter === "Finalized" && !ev.votingClosed) return false;
      const orgId = ev.organizer?._id || ev.organizer;
      const isHost = currentUser && String(orgId) === String(currentUser._id);
      if (roleFilter === "Hosting" && !isHost) return false;
      if (roleFilter === "Invited" && isHost) return false;
      if (q) {
        const venuesText = (ev.venues || []).map((v) => v.place).join(" ");
        const hay = `${ev.title} ${ev.description} ${ev.type} ${venuesText}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [events, search, typeFilter, statusFilter, roleFilter, currentUser]);

  const upcoming = filtered.filter((ev) => (ev.finalDate || ev.date || "") >= today);
  const past = filtered.filter((ev) => (ev.finalDate || ev.date || "") < today);

  if (!currentUser) {
    return (
      <div className="empty-state glass-card fade-up">
        <h2>Sign in to view your workspace</h2>
        <p>Log in to manage your events, polls, and schedules.</p>
        <Link to="/login" className="hero-btn-primary">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="dashboard-ultra fade-up">
      <div className="dash-header">
        <div>
          <h1>Welcome back, {currentUser.name.split(" ")[0]}</h1>
          <p className="dash-sub">Track active polls, upcoming schedules, and team decisions.</p>
        </div>
        <Link to="/create" className="create-cta-btn">
          <Plus size={18} />
          <span>New Event</span>
        </Link>
      </div>

      {/* KPI Stats Strip */}
      <div className="kpi-grid">
        <div className="kpi-card glass-card">
          <div className="kpi-icon indigo"><Layers size={20} /></div>
          <div>
            <div className="kpi-val mono">{stats.total}</div>
            <div className="kpi-label">Total Events</div>
          </div>
        </div>
        <div className="kpi-card glass-card">
          <div className="kpi-icon cyan"><CalendarClock size={20} /></div>
          <div>
            <div className="kpi-val mono">{stats.upcomingCount}</div>
            <div className="kpi-label">Upcoming</div>
          </div>
        </div>
        <div className="kpi-card glass-card">
          <div className="kpi-icon amber"><Vote size={20} /></div>
          <div>
            <div className="kpi-val mono">{stats.openCount}</div>
            <div className="kpi-label">Open Polls</div>
          </div>
        </div>
        <div className="kpi-card glass-card">
          <div className="kpi-icon emerald"><CheckCircle2 size={20} /></div>
          <div>
            <div className="kpi-val mono">{stats.finalizedCount}</div>
            <div className="kpi-label">Finalized</div>
          </div>
        </div>
      </div>

      {/* Filter & View Bar */}
      <div className="filter-bar glass-card">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search events, venues, descriptions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
            <option value="All">All Statuses</option>
            <option value="Open">Voting Open</option>
            <option value="Finalized">Finalized</option>
          </select>

          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} aria-label="Filter by role">
            <option value="All">All Roles</option>
            <option value="Hosting">Hosting</option>
            <option value="Invited">Participating</option>
          </select>

          <div className="view-toggle">
            <button
              type="button"
              className={viewMode === "grid" ? "active" : "ghost"}
              onClick={() => setViewMode("grid")}
              title="Card Grid View"
            >
              <LayoutGrid size={16} />
              <span>Grid</span>
            </button>
            <button
              type="button"
              className={viewMode === "calendar" ? "active" : "ghost"}
              onClick={() => setViewMode("calendar")}
              title="Monthly Calendar View"
            >
              <CalendarDays size={16} />
              <span>Calendar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Chips */}
      <div className="type-chips">
        {TYPES.map((t) => (
          <button
            key={t}
            type="button"
            className={`type-chip ${typeFilter === t ? "active" : ""}`}
            onClick={() => setTypeFilter(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="event-grid">
          {[1, 2, 3].map((n) => (
            <div key={n} className="skeleton" style={{ height: 240 }} />
          ))}
        </div>
      ) : viewMode === "calendar" ? (
        <CalendarView events={filtered} />
      ) : (
        <>
          <section className="dash-section">
            <div className="section-label">
              <h2>Upcoming</h2>
              <span className="pill pill-indigo mono">{upcoming.length}</span>
            </div>
            {upcoming.length === 0 ? (
              <div className="empty-panel glass-card">
                <p>No upcoming events match your filters.</p>
                <Link to="/create" className="create-cta-btn sm">
                  <Plus size={15} /> Create one
                </Link>
              </div>
            ) : (
              <div className="event-grid">
                {upcoming.map((ev) => (
                  <EventCard key={ev._id} event={ev} />
                ))}
              </div>
            )}
          </section>

          {past.length > 0 && (
            <section className="dash-section">
              <div className="section-label">
                <h2>Past Events</h2>
                <span className="pill pill-neutral mono">{past.length}</span>
              </div>
              <div className="event-grid">
                {past.map((ev) => (
                  <EventCard key={ev._id} event={ev} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default Dashboard;

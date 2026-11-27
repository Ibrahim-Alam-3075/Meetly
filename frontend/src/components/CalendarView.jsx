import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCoverGradient, getDefaultIcon } from "../utils/themePresets";
import "./CalendarView.css";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function CalendarView({ events }) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayStr = now.toISOString().slice(0, 10);

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric"
  });

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function goToday() {
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  }

  const eventsByDate = {};
  events.forEach((ev) => {
    const key = ev.finalDate || ev.date;
    if (!key) return;
    if (!eventsByDate[key]) eventsByDate[key] = [];
    eventsByDate[key].push(ev);
  });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="calendar-wrap glass-card fade-up">
      <div className="cal-header">
        <h3>{monthLabel}</h3>
        <div className="cal-controls">
          <button type="button" className="secondary sm" onClick={goToday}>
            Today
          </button>
          <button type="button" className="secondary sm" onClick={prevMonth} aria-label="Previous month">
            <ChevronLeft size={16} />
          </button>
          <button type="button" className="secondary sm" onClick={nextMonth} aria-label="Next month">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="cal-weekdays">
        {WEEKDAYS.map((day) => (
          <div key={day} className="cal-weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="cal-grid">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="cal-cell empty" />;
          const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayEvents = eventsByDate[dateKey] || [];
          const isToday = dateKey === todayStr;

          return (
            <div key={dateKey} className={`cal-cell ${isToday ? "today" : ""}`}>
              <div className="cal-day-num mono">{day}</div>
              <div className="cal-events">
                {dayEvents.map((ev) => (
                  <Link
                    key={ev._id}
                    to={`/event/${ev._id}`}
                    className="cal-event-pill"
                    style={{ background: getCoverGradient(ev.coverTheme, ev.type) }}
                    title={`${ev.title} (${ev.votingClosed ? "Finalized" : "Open Poll"})`}
                  >
                    <span>{ev.icon || getDefaultIcon(ev.type)}</span>
                    <span className="cal-event-title">{ev.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CalendarView;

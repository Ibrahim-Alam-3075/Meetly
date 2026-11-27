import { Link, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Sparkles, LayoutDashboard, Plus, Sun, Moon, LogOut, LogIn } from "lucide-react";
import { logout } from "../authSlice";
import { setEvents } from "../eventSlice";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { getInitials } from "../utils/themePresets";
import "./Navbar.css";

function Navbar() {
  const currentUser = useSelector((state) => state.auth.currentUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useToast();

  function handleLogout() {
    localStorage.removeItem("token");
    dispatch(logout());
    dispatch(setEvents([]));
    addToast("Signed out successfully", "info");
    navigate("/");
  }

  return (
    <header className="navbar-wrap">
      <nav className="navbar">
        <Link to="/" className="nav-brand">
          <span className="brand-icon">
            <Sparkles size={18} />
          </span>
          <span className="brand-text">Meetly</span>
          <span className="ultra-chip">ULTRA</span>
        </Link>

        <div className="nav-center">
          {currentUser && (
            <>
              <NavLink to="/dashboard" className={({ isActive }) => `nav-pill ${isActive ? "active" : ""}`}>
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </NavLink>
              <NavLink to="/create" className={({ isActive }) => `nav-pill ${isActive ? "active" : ""}`}>
                <Plus size={16} />
                <span>New Event</span>
              </NavLink>
            </>
          )}
        </div>

        <div className="nav-right">
          <button
            type="button"
            className="icon-btn"
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {currentUser ? (
            <>
              <Link to="/profile" className="user-chip" title="Profile & Settings">
                <span
                  className="avatar-circle"
                  style={{
                    width: 28,
                    height: 28,
                    fontSize: "0.75rem",
                    background: currentUser.avatarColor || "#6366f1"
                  }}
                >
                  {getInitials(currentUser.name)}
                </span>
                <span className="user-chip-name">{currentUser.name.split(" ")[0]}</span>
              </Link>
              <button type="button" className="icon-btn logout-btn" onClick={handleLogout} title="Sign Out">
                <LogOut size={17} />
              </button>
            </>
          ) : (
            <div className="auth-nav-actions">
              <Link to="/login" className="nav-login-link">
                <LogIn size={16} />
                <span>Sign In</span>
              </Link>
              <Link to="/register" className="nav-cta-btn">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;

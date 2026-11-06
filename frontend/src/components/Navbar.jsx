import { Link } from "react-router-dom";
import "./Navbar.css";

function Navbar({ currentUser, onLogout }) {
  return (
    <header className="navbar">
      <h1 className="logo">
        <Link to="/">Meetly</Link>
      </h1>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/create">Create Event</Link>
        {!currentUser && <Link to="/login">Login</Link>}
        {!currentUser && <Link to="/register">Register</Link>}
        {currentUser && <p>Welcome, {currentUser.name}</p>}
        {currentUser && <button onClick={onLogout}>Logout</button>}
      </nav>
    </header>
  );
}

export default Navbar;

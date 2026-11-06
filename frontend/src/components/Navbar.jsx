import { Link } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  return (
    <header className="navbar">
      <h1 className="logo">
        <Link to="/">Meetly</Link>
      </h1>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/create">Create Event</Link>
        <Link to="/login">Login</Link>
      </nav>
    </header>
  );
}

export default Navbar;

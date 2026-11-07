import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { logout } from "../authSlice";
import "./Navbar.css";

function Navbar() {
  const currentUser = useSelector((state) => state.auth.currentUser);
  const dispatch = useDispatch();

  return (
    <header className="navbar">
      <h1 className="logo">
        <Link to="/">Meetly</Link>
      </h1>
      <nav>
        <Link to="/">Home</Link>
        {currentUser && <Link to="/dashboard">Dashboard</Link>}
        <Link to="/create">Create Event</Link>
        {!currentUser && <Link to="/login">Login</Link>}
        {!currentUser && <Link to="/register">Register</Link>}
        {currentUser && <p>Welcome, {currentUser.name}</p>}
        {currentUser && <button onClick={() => dispatch(logout())}>Logout</button>}
      </nav>
    </header>
  );
}

export default Navbar;

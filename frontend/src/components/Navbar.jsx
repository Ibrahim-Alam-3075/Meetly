import "./Navbar.css";

function Navbar() {
  return (
    <header className="navbar">
      <h1 className="logo">Meetly</h1>
      <nav>
        <a href="#">Home</a>
        <a href="#">Dashboard</a>
        <a href="#">Create Event</a>
        <a href="#">Login</a>
      </nav>
    </header>
  );
}

export default Navbar;

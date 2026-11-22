import Navbar from "./Navbar";
import "./Layout.css";

function Layout({ children }) {
  return (
    <div className="layout">
      <Navbar />
      <main className="page">{children}</main>
      <footer className="footer">
        <p>Meetly 2026</p>
      </footer>
    </div>
  );
}

export default Layout;

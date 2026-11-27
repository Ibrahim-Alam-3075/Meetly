import Navbar from "./Navbar";
import "./Layout.css";

function Layout({ children }) {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">{children}</main>
      <footer className="app-footer">
        <div className="footer-inner">
          <span className="footer-brand">Meetly <span className="ultra-chip">ULTRA</span></span>
          <span className="footer-copy">Real-time collaborative scheduling, smart polls &amp; effortless group coordination.</span>
        </div>
      </footer>
    </div>
  );
}

export default Layout;

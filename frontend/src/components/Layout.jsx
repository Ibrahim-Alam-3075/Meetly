import Navbar from "./Navbar";
import "./Layout.css";

function Layout({ children, currentUser, onLogout }) {
  return (
    <div className="layout">
      <Navbar currentUser={currentUser} onLogout={onLogout} />
      <main className="page">{children}</main>
    </div>
  );
}

export default Layout;

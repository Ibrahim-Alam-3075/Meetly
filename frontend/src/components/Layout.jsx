import Navbar from "./Navbar";
import "./Layout.css";

function Layout({ children }) {
  return (
    <div className="layout">
      <Navbar />
      <main className="page">{children}</main>
    </div>
  );
}

export default Layout;

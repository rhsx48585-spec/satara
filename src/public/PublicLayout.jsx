import { Outlet, Link } from "react-router-dom";
import "./public.css";

export default function PublicLayout() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* ── Navigation Bar ── */}
      <nav className="navbar">
        <div className="public-container navbar-content">
          <Link to="/" className="nav-logo">
            🔮 TATA
          </Link>
          
          <ul className="nav-links">
            <li>
              <Link to="/">Home</Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* ── Main Content Area ── */}
      <main style={{ flex: 1, padding: "40px 0" }}>
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="public-container">
          <p>© {new Date().getFullYear()} TATA. All rights reserved.</p>
          <p style={{ marginTop: "5px", fontSize: "12px", color: "var(--text-secondary)" }}>
            Real-time results managed securely.
          </p>
        </div>
      </footer>
    </div>
  );
}

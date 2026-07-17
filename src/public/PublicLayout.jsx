import { useEffect, useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";
import "./public.css";

export default function PublicLayout() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    alert("Logged Out Successfully ✅");
  };

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
              <Link to="/">🏠 Home</Link>
            </li>
            {user ? (
              <>
                <li>
                  <Link to="/dashboard" className="nav-btn">💼 Dashboard</Link>
                </li>
                <li>
                  <button onClick={handleLogout} className="nav-logout-btn">🚪 Logout</button>
                </li>
              </>
            ) : (
              <li>
                <Link to="/login" className="nav-btn">🔑 Login / Register</Link>
              </li>
            )}
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

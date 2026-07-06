import { useEffect, useState } from "react";
import Market from "./Market";
import MarketList from "./MarketList";
import Chart from "./Chart";
import Result from "./Result";
import Settings from "./Settings";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function Dashboard({ onLogout }) {
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [counts, setCounts] = useState({
    markets: 0,
    charts: 0,
    results: 0,
  });

  const fetchCounts = async () => {
    const base = "https://admin-panel-d7b0e-default-rtdb.firebaseio.com";

    const markets = await fetch(`${base}/markets.json`).then((res) =>
      res.json()
    );
    const charts = await fetch(`${base}/charts.json`).then((res) =>
      res.json()
    );
    const results = await fetch(`${base}/results.json`).then((res) =>
      res.json()
    );

    setCounts({
      markets: markets ? Object.keys(markets).length : 0,
      charts: charts ? Object.keys(charts).length : 0,
      results: results ? Object.keys(results).length : 0,
    });
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  // Close sidebar on page change (mobile)
  const navigate = (p) => {
    setPage(p);
    setSidebarOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onLogout();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="dashboard">

      {/* ── Overlay (mobile) ── */}
      {sidebarOpen && (
        <div
          className="mob-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <h2>ADMIN PANEL</h2>
        <ul>
          <li className={page === "dashboard"   ? "active" : ""} onClick={() => navigate("dashboard")}>🏠 Dashboard</li>
          <li className={page === "market"      ? "active" : ""} onClick={() => navigate("market")}>📈 Market</li>
          <li className={page === "market-list" ? "active" : ""} onClick={() => navigate("market-list")}>📋 Market List</li>
          <li className={page === "chart"       ? "active" : ""} onClick={() => navigate("chart")}>📊 Chart</li>
          <li className={page === "result"      ? "active" : ""} onClick={() => navigate("result")}>🏆 Result</li>
          <li className={page === "settings"    ? "active" : ""} onClick={() => navigate("settings")}>⚙ Settings</li>
        </ul>
      </div>

      {/* ── Main content ── */}
      <div className="content">
        <div className="topbar">

          {/* Hamburger button */}
          <button
            className={`hamburger-btn ${sidebarOpen ? "open" : ""}`}
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label="Toggle menu"
            aria-expanded={sidebarOpen}
          >
            <span className="bar" />
            <span className="bar" />
            <span className="bar" />
          </button>

          <h1>
            {page === "dashboard"   && "Dashboard"}
            {page === "market"      && "Market"}
            {page === "market-list" && "Market List"}
            {page === "chart"       && "Chart"}
            {page === "result"      && "Result"}
            {page === "settings"    && "Settings"}
          </h1>

          <div className="profile">
            <button onClick={handleLogout}>Logout</button>
          </div>
        </div>

        {page === "dashboard" && (
          <div className="cards">
            <div className="card">
              <h3>Total Market</h3>
              <h1>{counts.markets}</h1>
            </div>
            <div className="card">
              <h3>Market List</h3>
              <h1>{counts.markets}</h1>
            </div>
            <div className="card">
              <h3>Charts</h3>
              <h1>{counts.charts}</h1>
            </div>
            <div className="card">
              <h3>Results</h3>
              <h1>{counts.results}</h1>
            </div>
          </div>
        )}

        {page === "market"      && <Market />}
        {page === "market-list" && <MarketList />}
        {page === "chart"       && <Chart />}
        {page === "result"      && <Result />}
        {page === "settings"    && <Settings />}
      </div>
    </div>
  );
}
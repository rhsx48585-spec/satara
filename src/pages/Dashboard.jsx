import { useEffect, useState } from "react";
import Market from "./Market";
import MarketList from "./MarketList";
import Chart from "./Chart";
import Result from "./Result";
import Settings from "./Settings";
import AdminUsers from "./AdminUsers";
import AdminDeposits from "./AdminDeposits";
import AdminBids from "./AdminBids";
import AdminWithdrawals from "./AdminWithdrawals";
import AdminChats from "./AdminChats";
import AdminGroupChat from "./AdminGroupChat";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { ref, onValue } from "firebase/database";

export default function Dashboard({ onLogout }) {
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [counts, setCounts] = useState({
    markets: 0,
    charts: 0,
    results: 0,
    bids: 0,
    users: 0,
    withdrawals: 0,
    chats: 0,
  });

  useEffect(() => {
    const unsubMarkets = onValue(ref(db, "markets"), (snapshot) => {
      const data = snapshot.val();
      setCounts((prev) => ({
        ...prev,
        markets: data ? Object.keys(data).length : 0,
      }));
    });

    const unsubCharts = onValue(ref(db, "charts"), (snapshot) => {
      const data = snapshot.val();
      setCounts((prev) => ({
        ...prev,
        charts: data ? Object.keys(data).length : 0,
      }));
    });

    const unsubResults = onValue(ref(db, "results"), (snapshot) => {
      const data = snapshot.val();
      setCounts((prev) => ({
        ...prev,
        results: data ? Object.keys(data).length : 0,
      }));
    });

    const unsubBids = onValue(ref(db, "bids"), (snapshot) => {
      const data = snapshot.val();
      setCounts((prev) => ({
        ...prev,
        bids: data ? Object.keys(data).length : 0,
      }));
    });

    const unsubUsers = onValue(ref(db, "users"), (snapshot) => {
      const data = snapshot.val();
      setCounts((prev) => ({
        ...prev,
        users: data ? Object.keys(data).length : 0,
      }));
    });

    const unsubWithdrawals = onValue(ref(db, "withdrawals"), (snapshot) => {
      const data = snapshot.val();
      setCounts((prev) => ({
        ...prev,
        withdrawals: data ? Object.keys(data).length : 0,
      }));
    });

    const unsubChats = onValue(ref(db, "latest_chats"), (snapshot) => {
      const data = snapshot.val();
      setCounts((prev) => ({
        ...prev,
        chats: data ? Object.keys(data).length : 0,
      }));
    });

    return () => {
      unsubMarkets();
      unsubCharts();
      unsubResults();
      unsubBids();
      unsubUsers();
      unsubWithdrawals();
      unsubChats();
    };
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
        <h2>TATA</h2>
        <ul>
          <li className={page === "dashboard"   ? "active" : ""} onClick={() => navigate("dashboard")}>🏠 Dashboard</li>
          <li className={page === "market"      ? "active" : ""} onClick={() => navigate("market")}>📈 Market</li>
          <li className={page === "market-list" ? "active" : ""} onClick={() => navigate("market-list")}>📋 Market List</li>
          <li className={page === "chart"       ? "active" : ""} onClick={() => navigate("chart")}>📊 Chart</li>
          <li className={page === "result"      ? "active" : ""} onClick={() => navigate("result")}>🏆 Result</li>
          <li className={page === "users"       ? "active" : ""} onClick={() => navigate("users")}>👥 Users</li>
          <li className={page === "deposits"    ? "active" : ""} onClick={() => navigate("deposits")}>💰 Deposits</li>
          <li className={page === "withdrawals" ? "active" : ""} onClick={() => navigate("withdrawals")}>💸 Withdrawals</li>
          <li className={page === "bids"        ? "active" : ""} onClick={() => navigate("bids")}>🎮 Gameplay Logs</li>
          <li className={page === "chats"       ? "active" : ""} onClick={() => navigate("chats")}>💬 Support Chats</li>
          <li className={page === "group-chat"  ? "active" : ""} onClick={() => navigate("group-chat")}>👥 Group Chat</li>
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
            {page === "users"       && "Users"}
            {page === "deposits"    && "Deposits"}
            {page === "withdrawals" && "Withdrawals"}
            {page === "bids"        && "Gameplay Logs"}
            {page === "chats"       && "Support Chats"}
            {page === "group-chat"  && "Group Chat"}
            {page === "settings"    && "Settings"}
          </h1>

          <div className="profile">
            <button onClick={handleLogout}>Logout</button>
          </div>
        </div>

        {page === "dashboard" && (
          <div className="cards">
            <div className="card" onClick={() => navigate("users")} style={{ cursor: "pointer" }}>
              <h3>Total Users</h3>
              <h1>{counts.users}</h1>
            </div>
            <div className="card" onClick={() => navigate("market-list")} style={{ cursor: "pointer" }}>
              <h3>Total Markets</h3>
              <h1>{counts.markets}</h1>
            </div>
            <div className="card" onClick={() => navigate("deposits")} style={{ cursor: "pointer" }}>
              <h3>Total Deposits</h3>
              <h1>{counts.results}</h1>
            </div>
            <div className="card" onClick={() => navigate("bids")} style={{ cursor: "pointer" }}>
              <h3>Total Bids</h3>
              <h1>{counts.bids}</h1>
            </div>
            <div className="card" onClick={() => navigate("withdrawals")} style={{ cursor: "pointer" }}>
              <h3>Total Withdrawals</h3>
              <h1>{counts.withdrawals}</h1>
            </div>
            <div className="card" onClick={() => navigate("chats")} style={{ cursor: "pointer" }}>
              <h3>Support Chats</h3>
              <h1>{counts.chats}</h1>
            </div>
          </div>
        )}

        {page === "market"      && <Market />}
        {page === "market-list" && <MarketList />}
        {page === "chart"       && <Chart />}
        {page === "result"      && <Result />}
        {page === "users"       && <AdminUsers />}
        {page === "deposits"    && <AdminDeposits />}
        {page === "withdrawals" && <AdminWithdrawals />}
        {page === "bids"        && <AdminBids />}
        {page === "chats"       && <AdminChats />}
        {page === "group-chat"  && <AdminGroupChat />}
        {page === "settings"    && <Settings />}
      </div>
    </div>
  );
}
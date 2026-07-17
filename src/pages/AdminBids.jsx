import { useEffect, useState } from "react";
import { db } from "../firebase";
import { ref, onValue, set, runTransaction } from "firebase/database";

export default function AdminBids() {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All"); // All, Pending, Win, Loss

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onValue(ref(db, "bids"), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map((id) => ({
          id,
          ...data[id],
        }));
        // Sort by date descending
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setBids(list);
      } else {
        setBids([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error loading bids: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleMarkWin = async (item) => {
    // Determine payout rate
    let payoutMultiplier = 9; // Single Digit: 9x default
    if (item.gameType === "Jodi") {
      payoutMultiplier = 90; // Jodi: 90x
    } else if (item.gameType?.toLowerCase().includes("patti")) {
      payoutMultiplier = 140; // Patti: 140x
    }

    const winnings = Number(item.points) * payoutMultiplier;

    const confirmWin = window.confirm(
      `Mark Bid as WIN? User will receive ₹${winnings} (${payoutMultiplier}x of ₹${item.points}) automatically in their wallet.`
    );
    if (!confirmWin) return;

    try {
      // 1. Mark bid status as Win
      await set(ref(db, `bids/${item.id}/status`), "Win");

      // 2. Add winnings to user balance atomically
      const userBalanceRef = ref(db, `users/${item.uid}/balance`);
      await runTransaction(userBalanceRef, (currentBalance) => {
        return (currentBalance || 0) + winnings;
      });

      alert(`Bid marked as WIN! ₹${winnings} credited to ${item.userName}'s wallet. ✅`);
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleMarkLoss = async (item) => {
    const confirmLoss = window.confirm(`Mark Bid as LOSS?`);
    if (!confirmLoss) return;

    try {
      await set(ref(db, `bids/${item.id}/status`), "Loss");
      alert("Bid marked as LOSS. 🔴");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // Filter based on search term and dropdown status
  const filteredBids = bids.filter((b) => {
    const matchesSearch =
      b.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.userPhone?.includes(searchTerm) ||
      b.marketName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.numberPlayed?.includes(searchTerm);
      
    const matchesStatus = statusFilter === "All" || b.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="page">
      <div className="page-header">
        <h1>🎮 Gameplay Logs (Bids)</h1>
      </div>

      <div className="table-top" style={{ gap: "10px", margin: "15px 0" }}>
        <input
          type="text"
          placeholder="Search by Name, Phone, Market, or Bidded Number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
          style={{ flexGrow: 2, padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending Only</option>
          <option value="Win">Win Only</option>
          <option value="Loss">Loss Only</option>
        </select>
      </div>

      {loading ? (
        <div className="loader-container">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="market-table-card">
          <table className="market-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>User Details</th>
                <th>Market Name</th>
                <th>Game Type</th>
                <th>Number</th>
                <th>Points (₹)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBids.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "20px" }}>
                    No gameplays found
                  </td>
                </tr>
              ) : (
                filteredBids.map((item) => (
                  <tr key={item.id}>
                    <td data-label="Date & Time">
                      {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td data-label="User Details">
                      <div style={{ fontWeight: "700" }}>{item.userName}</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>{item.userPhone}</div>
                    </td>
                    <td data-label="Market Name">{item.marketName}</td>
                    <td data-label="Game Type">{item.gameType}</td>
                    <td data-label="Number" style={{ fontWeight: "800", color: "var(--glow-cyan)", fontSize: "16px" }}>
                      {item.numberPlayed}
                    </td>
                    <td data-label="Points" style={{ fontWeight: "700" }}>₹{item.points}</td>
                    <td data-label="Status">
                      <span className={`status-badge ${item.status?.toLowerCase()}`}>
                        {item.status === "Pending" && "🟡 Pending"}
                        {item.status === "Win" && "🟢 Win"}
                        {item.status === "Loss" && "🔴 Loss"}
                      </span>
                    </td>
                    <td data-label="Actions" className="action-buttons">
                      {item.status === "Pending" ? (
                        <>
                          <button
                            className="edit-btn"
                            onClick={() => handleMarkWin(item)}
                            style={{ background: "#10b981", marginRight: "5px" }}
                          >
                            Win
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => handleMarkLoss(item)}
                            style={{ background: "#ef4444" }}
                          >
                            Loss
                          </button>
                        </>
                      ) : (
                        <span style={{ color: "#64748b", fontSize: "13px" }}>Processed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

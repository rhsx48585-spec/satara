import { useEffect, useState } from "react";
import { db } from "../firebase";
import { ref, onValue, set, runTransaction } from "firebase/database";

export default function AdminDeposits() {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All"); // All, Pending, Approved, Rejected

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onValue(ref(db, "deposits"), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map((id) => ({
          id,
          ...data[id],
        }));
        
        // Sort by date descending
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setDeposits(list);
      } else {
        setDeposits([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error loading deposits: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async (item) => {
    const confirmApprove = window.confirm(
      `Confirm Payment? Approve ₹${item.amount} for user "${item.userName}"?`
    );
    if (!confirmApprove) return;

    try {
      // 1. Update deposit status to Approved
      await set(ref(db, `deposits/${item.id}/status`), "Approved");

      // 2. Increment user balance atomically
      const userBalanceRef = ref(db, `users/${item.uid}/balance`);
      await runTransaction(userBalanceRef, (currentBalance) => {
        return (currentBalance || 0) + Number(item.amount);
      });

      alert("Deposit Request Approved ✅ Wallet credited.");
    } catch (err) {
      alert("Verification Failed: " + err.message);
    }
  };

  const handleReject = async (item) => {
    const confirmReject = window.confirm(
      `Reject Payment Request? Reject ₹${item.amount} from user "${item.userName}"?`
    );
    if (!confirmReject) return;

    try {
      await set(ref(db, `deposits/${item.id}/status`), "Rejected");
      alert("Deposit Request Rejected 🔴");
    } catch (err) {
      alert("Rejection Failed: " + err.message);
    }
  };

  // Filter based on search term and dropdown status
  const filteredDeposits = deposits.filter((d) => {
    const matchesSearch =
      d.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.userPhone?.includes(searchTerm) ||
      d.transactionId?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === "All" || d.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="page">
      <div className="page-header">
        <h1>💰 Deposit Requests</h1>
      </div>

      <div className="table-top" style={{ gap: "10px", margin: "15px 0" }}>
        <input
          type="text"
          placeholder="Search by Name, Phone, or UTR/Txn ID..."
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
          <option value="Approved">Approved Only</option>
          <option value="Rejected">Rejected Only</option>
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
                <th>Amount</th>
                <th>UTR / Txn ID</th>
                <th>Mode</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeposits.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
                    No deposit requests found
                  </td>
                </tr>
              ) : (
                filteredDeposits.map((item) => (
                  <tr key={item.id}>
                    <td data-label="Date & Time">
                      {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td data-label="User Details">
                      <div style={{ fontWeight: "700" }}>{item.userName}</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>{item.userPhone}</div>
                    </td>
                    <td data-label="Amount" style={{ fontWeight: "700" }}>₹{item.amount}</td>
                    <td data-label="UTR / Txn ID" style={{ fontFamily: "monospace", letterSpacing: "0.5px" }}>
                      {item.transactionId}
                    </td>
                    <td data-label="Mode">{item.mode || "Manual"}</td>
                    <td data-label="Status">
                      <span className={`status-badge ${item.status?.toLowerCase()}`}>
                        {item.status === "Pending" && "🟡 Pending"}
                        {item.status === "Approved" && "🟢 Approved"}
                        {item.status === "Rejected" && "🔴 Rejected"}
                      </span>
                    </td>
                    <td data-label="Actions" className="action-buttons">
                      {item.status === "Pending" ? (
                        <>
                          <button
                            className="edit-btn"
                            onClick={() => handleApprove(item)}
                            style={{ background: "#10b981", marginRight: "5px" }}
                          >
                            Approve
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => handleReject(item)}
                            style={{ background: "#ef4444" }}
                          >
                            Reject
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

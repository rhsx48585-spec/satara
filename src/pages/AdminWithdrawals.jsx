import { useEffect, useState } from "react";
import { db } from "../firebase";
import { ref, onValue, set, runTransaction } from "firebase/database";

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All"); // All, Pending, Approved, Rejected

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onValue(ref(db, "withdrawals"), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map((id) => ({
          id,
          ...data[id],
        }));
        // Sort by date descending
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setWithdrawals(list);
      } else {
        setWithdrawals([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error loading withdrawals: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async (item) => {
    const confirmApprove = window.confirm(
      `Approve Withdrawal? Confirm that you have transferred ₹${item.amount} to user's destination: "${item.payoutDetails}".`
    );
    if (!confirmApprove) return;

    try {
      await set(ref(db, `withdrawals/${item.id}/status`), "Approved");
      alert("Withdrawal request APPROVED successfully! ✅");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleReject = async (item) => {
    const confirmReject = window.confirm(
      `Reject Withdrawal? Deducted ₹${item.amount} points will be AUTOMATICALLY REFUNDED to the user's wallet balance.`
    );
    if (!confirmReject) return;

    try {
      // 1. Mark status as Rejected
      await set(ref(db, `withdrawals/${item.id}/status`), "Rejected");

      // 2. Refund balance atomically
      const userBalanceRef = ref(db, `users/${item.uid}/balance`);
      await runTransaction(userBalanceRef, (currentBalance) => {
        return (currentBalance || 0) + Number(item.amount);
      });

      alert(`Withdrawal request REJECTED. ₹${item.amount} points refunded to ${item.userName}'s wallet balance. 🔴`);
    } catch (err) {
      alert("Error refunding: " + err.message);
    }
  };

  const filteredWithdrawals = withdrawals.filter((w) => {
    const matchesSearch =
      w.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.userPhone?.includes(searchTerm) ||
      w.payoutDetails?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === "All" || w.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="page">
      <div className="page-header">
        <h1>💸 Withdrawal Payout Requests</h1>
      </div>

      <div className="table-top" style={{ gap: "10px", margin: "15px 0" }}>
        <input
          type="text"
          placeholder="Search by User Name, Phone, or Payout Destination..."
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
                <th>Requested Payout</th>
                <th>Destination Details</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                    No payout requests found
                  </td>
                </tr>
              ) : (
                filteredWithdrawals.map((item) => (
                  <tr key={item.id}>
                    <td data-label="Date & Time">
                      {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td data-label="User Details">
                      <div style={{ fontWeight: "700" }}>{item.userName}</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>{item.userPhone}</div>
                    </td>
                    <td data-label="Requested Payout" style={{ fontWeight: "700", color: "#ef4444", fontSize: "16px" }}>
                      ₹{item.amount}
                    </td>
                    <td data-label="Destination Details" style={{ fontWeight: "600" }}>
                      {item.payoutDetails}
                    </td>
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

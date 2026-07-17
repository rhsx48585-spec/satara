import { useEffect, useState } from "react";
import { db } from "../firebase";
import { ref, onValue, update, remove } from "firebase/database";

export default function MarketList() {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editId, setEditId] = useState(null);
  const [marketName, setMarketName] = useState("");
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [resultTime, setResultTime] = useState("");
  const [status, setStatus] = useState("Active");
  const [searchTerm, setSearchTerm] = useState("");

  const editMarket = (item) => {
    setEditId(item.id);
    setMarketName(item.marketName || "");
    setOpenTime(item.openTime || "");
    setCloseTime(item.closeTime || "");
    setResultTime(item.resultTime || "");
    setStatus(item.status || "Active");
  };

  const deleteMarket = async (id) => {
    const confirmDelete = window.confirm(
      "Kya aap market delete karna chahte hain?"
    );

    if (!confirmDelete) return;

    try {
      await remove(ref(db, `markets/${id}`));
      alert("Market Deleted ✅");
    } catch (error) {
      alert("Delete Failed");
      console.log(error);
    }
  };

  const updateMarket = async () => {
    setUpdating(true);

    try {
      await update(ref(db, `markets/${editId}`), {
        marketName,
        openTime,
        closeTime,
        resultTime,
        status,
      });

      alert("Market Updated ✅");

      setEditId(null);
      setMarketName("");
      setOpenTime("");
      setCloseTime("");
      setResultTime("");
      setStatus("Active");
    } catch (error) {
      alert("Update Failed");
      console.log(error);
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onValue(ref(db, "markets"), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map((id) => ({
          id,
          ...data[id],
        }));
        setMarkets(list);
      } else {
        setMarkets([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Fetch markets error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 🔍 Filtered list based on search term
  const filteredMarkets = markets.filter((item) =>
    item.marketName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page">
      <div className="page-header">
        <h1>📋 Market List</h1>
      </div>

      {/* 🔍 Search Box */}
      <div className="search-box" style={{ margin: "15px 0" }}>
        <input
          type="text"
          placeholder="🔍 Search market by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            fontSize: "14px",
            boxSizing: "border-box",
          }}
        />
      </div>

      {editId && (
        <div className="chart-card">
          <h2>Edit Market</h2>

          <div className="form-grid">
            <div className="input-group">
              <label>Market Name</label>
              <input
                value={marketName}
                onChange={(e) => setMarketName(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Open Time</label>
              <input
                type="time"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Close Time</label>
              <input
                type="time"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Result Time</label>
              <input
                type="time"
                value={resultTime}
                onChange={(e) => setResultTime(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>

          <button
            className="submit-btn"
            onClick={updateMarket}
            disabled={updating}
          >
            {updating ? "Updating..." : "Update Market"}
          </button>
        </div>
      )}

      <div className="market-table-card">
        {loading ? (
          <h2>Loading...</h2>
        ) : (
          <table className="market-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Market Name</th>
                <th>Open Time</th>
                <th>Close Time</th>
                <th>Result Time</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredMarkets.length === 0 ? (
                <tr>
                  <td colSpan="7">No market found</td>
                </tr>
              ) : (
                filteredMarkets.map((item, index) => (
                  <tr key={item.id}>
                    <td data-label="#">{index + 1}</td>
                    <td data-label="Market Name">{item.marketName}</td>
                    <td data-label="Open Time">{item.openTime}</td>
                    <td data-label="Close Time">{item.closeTime}</td>
                    <td data-label="Result Time">{item.resultTime || "-"}</td>
                    <td data-label="Status">
                      <span
                        className={
                          item.status === "Active"
                            ? "status active"
                            : "status inactive"
                        }
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="action-buttons" data-label="Action">
                      <button
                        className="edit-btn"
                        onClick={() => editMarket(item)}
                      >
                        ✏️ Edit
                      </button>

                      <button
                        className="delete-btn"
                        onClick={() => deleteMarket(item.id)}
                      >
                        🗑 Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
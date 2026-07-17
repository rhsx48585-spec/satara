import { useEffect, useState } from "react";
import { db } from "../firebase";
import { ref, onValue, push, set, remove } from "firebase/database";

export default function Chart() {
  const [selectedMarketFilter, setSelectedMarketFilter] = useState("");
  const [marketName, setMarketName] = useState("");
  const [number, setNumber] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("Active");

  const [charts, setCharts] = useState([]);
  const [editId, setEditId] = useState(null);
  const [marketsList, setMarketsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const saveChart = async () => {
    if (!marketName || !number || !date) {
      alert("All fields required");
      return;
    }

    const chartData = { marketName, number, date, status };

    try {
      if (editId) {
        await set(ref(db, `charts/${editId}`), chartData);
        alert("Chart Updated ✅");
        setEditId(null);
      } else {
        await push(ref(db, "charts"), chartData);
        alert("Chart Saved ✅");
      }

      setNumber("");
      setDate("");
      setStatus("Active");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const editChart = (item) => {
    setEditId(item.id);
    setMarketName(item.marketName);
    setNumber(item.number);
    setDate(item.date);
    setStatus(item.status);
  };

  const deleteChart = async (id) => {
    try {
      await remove(ref(db, `charts/${id}`));
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  useEffect(() => {
    const unsubscribe = onValue(ref(db, "charts"), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map((id) => ({
          id,
          ...data[id],
        }));
        setCharts(list);
      } else {
        setCharts([]);
      }
    }, (err) => {
      console.error(err);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubMarkets = onValue(ref(db, "markets"), (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const list = Object.keys(val).map(id => ({ id, ...val[id] }));
        setMarketsList(list);
        if (list.length > 0) {
          if (!selectedMarketFilter) {
            setSelectedMarketFilter(list[0].marketName);
          }
          if (!marketName) {
            setMarketName(list[0].marketName);
          }
        }
      } else {
        setMarketsList([]);
      }
    });
    return () => unsubMarkets();
  }, [marketName, selectedMarketFilter]);

  const filteredCharts = charts
    .filter((item) => {
      const matchesMarket = item.marketName === selectedMarketFilter;
      if (!searchTerm) return matchesMarket;
      const term = searchTerm.toLowerCase();
      return (
        matchesMarket &&
        (String(item.number).toLowerCase().includes(term) ||
          item.date?.includes(term))
      );
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="page">
      <div className="page-header">
        <h1>📊 Chart Records</h1>
      </div>

      {/* 🔍 Market Selector Header Card */}
      <div className="chart-card">
        <h2>Select Market to Manage Charts</h2>
        <div style={{ marginTop: "15px" }}>
          {marketsList.length === 0 ? (
            <span style={{ color: "#ef4444", fontSize: "14px" }}>⚠️ No markets available. Add a market first!</span>
          ) : (
            <select
              value={selectedMarketFilter}
              onChange={(e) => {
                const m = e.target.value;
                setSelectedMarketFilter(m);
                setMarketName(m);
                setEditId(null); // Clear edit mode if switching markets
              }}
              style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)", outline: "none", background: "rgba(0,0,0,0.4)", color: "#fff", fontSize: "16px", fontWeight: "600" }}
            >
              {marketsList.map(m => (
                <option key={m.id} value={m.marketName}>{m.marketName} Charts</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ✏️ Add / Edit Chart Form */}
      {selectedMarketFilter && (
        <div className="chart-card">
          <h2>{editId ? `Edit Chart Entry for ${selectedMarketFilter}` : `Add New Chart Entry for ${selectedMarketFilter}`}</h2>

          <div className="form-grid">
            <div className="input-group">
              <label>Selected Market</label>
              <input
                type="text"
                value={marketName}
                disabled
                style={{ padding: "10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", color: "#64748b" }}
              />
            </div>

            <div className="input-group">
              <label>Number (e.g. 123-68 or 68)</label>
              <input
                type="text"
                placeholder="Enter Number"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: "10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.08)", outline: "none", background: "rgba(0,0,0,0.4)", color: "#fff" }}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button className="submit-btn" onClick={saveChart} style={{ margin: 0, width: "auto" }}>
              {editId ? "Update Entry" : "Save Entry"}
            </button>
            {editId && (
              <button className="submit-btn" onClick={() => {
                setEditId(null);
                setNumber("");
                setDate("");
                setStatus("Active");
              }} style={{ margin: 0, width: "auto", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                Cancel Edit
              </button>
            )}
          </div>
        </div>
      )}

      {/* 📋 Chart List Table */}
      {selectedMarketFilter && (
        <div className="market-table-card">
          <div className="table-top">
            <h2>{selectedMarketFilter} History Log</h2>

            <input
              type="text"
              placeholder="🔍 Search by Number or Date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <table className="market-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Number</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredCharts.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>
                    No chart records logged for {selectedMarketFilter} yet.
                  </td>
                </tr>
              ) : (
                filteredCharts.map((item, index) => (
                  <tr key={item.id}>
                    <td data-label="#">{index + 1}</td>
                    <td data-label="Date">{item.date}</td>
                    <td data-label="Number" style={{ fontWeight: "700", color: "var(--glow-cyan)" }}>{item.number}</td>
                    <td data-label="Status">
                      <span
                        className={
                          item.status === "Active"
                            ? "status active"
                            : "status inactive"
                        }
                      >
                        {item.status || "Active"}
                      </span>
                    </td>
                    <td data-label="Action">
                      <button className="edit-btn" onClick={() => editChart(item)}>
                        Edit
                      </button>

                      <button
                        className="delete-btn"
                        onClick={() => deleteChart(item.id)}
                      >
                        Delete
                      </button>
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
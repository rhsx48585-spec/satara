import { useEffect, useState } from "react";

export default function Result() {
  const [marketName, setMarketName] = useState("");
  const [resultNumber, setResultNumber] = useState("");
  const [date, setDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [status, setStatus] = useState("Active");
  const [results, setResults] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");

  const BASE_URL =
    "https://admin-panel-d7b0e-default-rtdb.firebaseio.com/results";
  const MARKET_URL =
    "https://admin-panel-d7b0e-default-rtdb.firebaseio.com/markets";

  const getTodayDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const fetchResults = async () => {
    const res = await fetch(`${BASE_URL}.json`);
    const data = await res.json();
    if (data) {
      const list = Object.keys(data).map((id) => ({ id, ...data[id] }));
      setResults(list);
    } else {
      setResults([]);
    }
  };

  const fetchMarkets = async () => {
    const res = await fetch(`${MARKET_URL}.json`);
    const data = await res.json();
    if (data) {
      const list = Object.keys(data).map((id) => ({ id, ...data[id] }));
      setMarkets(list);
    } else {
      setMarkets([]);
    }
  };

  const saveResult = async () => {
    setError("");

    if (!marketName || !resultNumber || !date) {
      setError("All fields required");
      return;
    }

    const alreadyDeclared = results.some(
      (item) =>
        item.marketName === marketName &&
        item.date === date &&
        item.id !== editId
    );

    if (alreadyDeclared) {
      setError(`❌ Result already declared for "${marketName}" on ${date}`);
      return;
    }

    const resultData = { marketName, resultNumber, date, status };

    if (editId) {
      await fetch(`${BASE_URL}/${editId}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resultData),
      });
      alert("Result Updated ✅");
      setEditId(null);
    } else {
      await fetch(`${BASE_URL}.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resultData),
      });
      alert("Result Saved ✅");
    }

    setMarketName("");
    setResultNumber("");
    setDate(getTodayDate());
    setStatus("Active");
    fetchResults();
  };

  const editResult = (item) => {
    setError("");
    setEditId(item.id);
    setMarketName(item.marketName);
    setResultNumber(item.resultNumber);
    setDate(item.date);
    setStatus(item.status);
  };

  const deleteResult = async (id) => {
    await fetch(`${BASE_URL}/${id}.json`, { method: "DELETE" });
    fetchResults();
  };

  useEffect(() => {
    fetchResults();
    fetchMarkets();
  }, []);

  const todayResults = results.filter((item) => item.date === getTodayDate());

  return (
    <div className="page">
      <div className="page-header">
        <h1>🏆 Result</h1>
      </div>

      {/* ── Add / Edit Form ── */}
      <div className="chart-card">
        <h2>{editId ? "Edit Result Number" : "Add Result Number"}</h2>

        {error && (
          <p style={{ color: "red", fontWeight: "bold", marginBottom: "10px" }}>
            {error}
          </p>
        )}

        <div className="form-grid">
          <div className="input-group">
            <label>Market Name</label>
            <select
              value={marketName}
              onChange={(e) => setMarketName(e.target.value)}
            >
              <option value="">-- Select Market --</option>
              {markets.map((m) => (
                <option key={m.id} value={m.marketName}>
                  {m.marketName}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Result Number</label>
            <input
              type="text"
              placeholder="Enter Result Number"
              value={resultNumber}
              onChange={(e) => setResultNumber(e.target.value)}
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
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>

        <button className="submit-btn" onClick={saveResult}>
          {editId ? "Update Result" : "Save Result"}
        </button>
      </div>

      {/* ── Today's Market Results ── */}
      <div className="market-table-card">
        <h2>Today's Market Result ({getTodayDate()})</h2>

        <table className="market-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Market Name</th>
              <th>Result</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {todayResults.length === 0 ? (
              <tr>
                <td colSpan="5">No result declared today</td>
              </tr>
            ) : (
              todayResults.map((item, index) => (
                <tr key={item.id}>
                  <td data-label="#">{index + 1}</td>
                  <td data-label="Date">{item.date}</td>
                  <td data-label="Market Name">{item.marketName}</td>
                  <td data-label="Result">{item.resultNumber}</td>
                  <td data-label="Action">
                    <button
                      className="edit-btn"
                      onClick={() => editResult(item)}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => deleteResult(item.id)}
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

      {/* ── Full Result List ── */}
      <div className="market-table-card">
        <h2>Result List</h2>

        <table className="market-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Market Name</th>
              <th>Result</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {results.length === 0 ? (
              <tr>
                <td colSpan="5">No result found</td>
              </tr>
            ) : (
              results.map((item, index) => (
                <tr key={item.id}>
                  <td data-label="#">{index + 1}</td>
                  <td data-label="Date">{item.date}</td>
                  <td data-label="Market Name">{item.marketName}</td>
                  <td data-label="Result">{item.resultNumber}</td>
                  <td data-label="Action">
                    <button
                      className="edit-btn"
                      onClick={() => editResult(item)}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => deleteResult(item.id)}
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
    </div>
  );
}
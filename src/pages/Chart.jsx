import { useEffect, useState } from "react";

export default function Chart() {
  const [marketName, setMarketName] = useState("");
  const [number, setNumber] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("Active");

  const [charts, setCharts] = useState([]);
  const [editId, setEditId] = useState(null);

  // 🔍 Filter states
  const [searchMarket, setSearchMarket] = useState("");
  const [searchNumber, setSearchNumber] = useState("");
  const [searchDate, setSearchDate] = useState("");

  // 🔍 Quick search box (above table)
  const [searchTerm, setSearchTerm] = useState("");

  const BASE_URL =
    "https://admin-panel-d7b0e-default-rtdb.firebaseio.com/charts";

  const fetchCharts = async () => {
    const res = await fetch(`${BASE_URL}.json`);
    const data = await res.json();

    if (data) {
      const list = Object.keys(data).map((id) => ({
        id,
        ...data[id],
      }));
      setCharts(list);
    } else {
      setCharts([]);
    }
  };

  const saveChart = async () => {
    if (!marketName || !number || !date) {
      alert("All fields required");
      return;
    }

    const chartData = { marketName, number, date, status };

    if (editId) {
      await fetch(`${BASE_URL}/${editId}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chartData),
      });

      alert("Chart Updated ✅");
      setEditId(null);
    } else {
      await fetch(`${BASE_URL}.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chartData),
      });

      alert("Chart Saved ✅");
    }

    setMarketName("");
    setNumber("");
    setDate("");
    setStatus("Active");
    fetchCharts();
  };

  const editChart = (item) => {
    setEditId(item.id);
    setMarketName(item.marketName);
    setNumber(item.number);
    setDate(item.date);
    setStatus(item.status);
  };

  const deleteChart = async (id) => {
    await fetch(`${BASE_URL}/${id}.json`, {
      method: "DELETE",
    });

    fetchCharts();
  };

  useEffect(() => {
    fetchCharts();
  }, []);

  // 🔍 Filtered list based on filter fields (Market/Number/Date)
  const filteredByFields = charts.filter((item) => {
    const matchesMarket = item.marketName
      ?.toLowerCase()
      .includes(searchMarket.toLowerCase());

    const matchesNumber = searchNumber
      ? String(item.number).toLowerCase().includes(searchNumber.toLowerCase())
      : true;

    const matchesDate = searchDate ? item.date === searchDate : true;

    return matchesMarket && matchesNumber && matchesDate;
  });

  // 🔍 Quick search box - searches Market Name + Number together
  const filteredCharts = filteredByFields.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.marketName?.toLowerCase().includes(term) ||
      String(item.number).toLowerCase().includes(term)
    );
  });

  return (
    <div className="page">
      <div className="page-header">
        <h1>📊 Chart</h1>
      </div>

      {/* 🔍 Filter Box */}
      {/* <div className="chart-card">
        <h2>Filter</h2>

        <div className="form-grid">
          <div className="input-group">
            <label>Market Name</label>
            <input
              type="text"
              placeholder="Search by Market Name"
              value={searchMarket}
              onChange={(e) => setSearchMarket(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Number</label>
            <input
              type="text"
              placeholder="Search by Number"
              value={searchNumber}
              onChange={(e) => setSearchNumber(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Date</label>
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
            />
          </div>
        </div>

        <button
          className="submit-btn"
          onClick={() => {
            setSearchMarket("");
            setSearchNumber("");
            setSearchDate("");
          }}
        >
          Clear Filter
        </button>
      </div>

      <div className="chart-card">
        <h2>{editId ? "Edit Chart Number" : "Add Chart Number"}</h2>

        <div className="form-grid">
          <div className="input-group">
            <label>Market Name</label>
            <input
              type="text"
              placeholder="Enter Market Name"
              value={marketName}
              onChange={(e) => setMarketName(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Number</label>
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
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>

        <button className="submit-btn" onClick={saveChart}>
          {editId ? "Update Chart" : "Save Chart"}
        </button>
      </div> */}

      <div className="market-table-card">
        <div className="table-top">
          <h2>Chart List</h2>

          <input
            type="text"
            placeholder="🔍 Search by Market or Number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <table className="market-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Market</th>
              <th>Number</th>
              <th>Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredCharts.length === 0 ? (
              <tr>
                <td colSpan="6">No chart found</td>
              </tr>
            ) : (
              filteredCharts.map((item, index) => (
                <tr key={item.id}>
                  <td data-label="#">{index + 1}</td>
                  <td data-label="Market">{item.marketName}</td>
                  <td data-label="Number">{item.number}</td>
                  <td data-label="Date">{item.date}</td>
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
    </div>
  );
}
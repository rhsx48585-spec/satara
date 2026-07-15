import { useState } from "react";
import { db } from "../firebase";
import { ref, push } from "firebase/database";

export default function Market() {
const [marketName, setMarketName] = useState("");
const [openTime, setOpenTime] = useState("");
const [closeTime, setCloseTime] = useState("");
const [status, setStatus] = useState("Active");
const [resultTime, setResultTime] = useState("");
const [loading, setLoading] = useState(false);
const addMarket = async () => {
  if (!marketName || !openTime || !closeTime || !resultTime) {
    alert("All fields required");
    return;
  }

  setLoading(true);

  try {
    await push(ref(db, "markets"), {
      marketName,
      openTime,
      closeTime,
      resultTime,
      status,
      createdAt: new Date().toISOString(),
    });

    alert("Market Added Successfully ✅");

    setMarketName("");
    setOpenTime("");
    setCloseTime("");
    setStatus("Active");
    setResultTime("");
  } catch (error) {
    alert("Error: " + error.message);
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="page">
      <div className="page-header">
        <h1>📈 Market</h1>
      </div>

      <div className="market-card">
        <h2>Add Market</h2>

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

          {/* <div className="input-group">
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div> */}
        </div>

        <button
  className="submit-btn"
  onClick={addMarket}
  disabled={loading}
>
  {loading ? "Adding Market..." : "Add Market"}
</button>
      </div>
    </div>
  );
}
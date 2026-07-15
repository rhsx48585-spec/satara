import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../firebase";
import { ref, get } from "firebase/database";

export default function ChartsView() {
  const { marketName } = useParams();
  const decodedMarketName = decodeURIComponent(marketName);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        // Try fetching from charts first
        const chartsSnap = await get(ref(db, "charts"));
        const chartsData = chartsSnap.val();
        
        let list = [];
        if (chartsData) {
          list = Object.keys(chartsData)
            .map((id) => ({
              id,
              ...chartsData[id],
            }))
            .filter((item) => item.marketName === decodedMarketName && item.status === "Active");
        }

        // If no charts are found, fall back to results for this market
        if (list.length === 0) {
          const resultsSnap = await get(ref(db, "results"));
          const resultsData = resultsSnap.val();
          if (resultsData) {
            list = Object.keys(resultsData)
              .map((id) => ({
                id,
                ...resultsData[id],
                number: resultsData[id].resultNumber, // map resultNumber to number
              }))
              .filter((item) => item.marketName === decodedMarketName && item.status === "Active");
          }
        }

        // Sort history by date descending
        list.sort((a, b) => new Date(b.date) - new Date(a.date));
        setHistory(list);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [decodedMarketName]);

  return (
    <div className="public-container">
      {/* ── Header ── */}
      <section className="chart-header">
        <Link to="/" style={{ color: "var(--glow-cyan)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "20px", fontWeight: "600" }}>
          ← Back to Markets
        </Link>
        <h1>{decodedMarketName} Chart History</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Showing historical result logs for {decodedMarketName} matka.
        </p>
      </section>

      {/* ── Content ── */}
      {loading ? (
        <div className="loader-container">
          <div className="spinner"></div>
        </div>
      ) : (
        <section>
          <div className="chart-grid">
            {history.map((item) => (
              <div key={item.id} className="chart-history-card">
                <div className="date">
                  {new Date(item.date).toLocaleDateString("en-US", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                <div className="number">{item.number}</div>
              </div>
            ))}
          </div>

          {history.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px", background: "var(--panel-bg)", borderRadius: "24px", border: "1px solid var(--panel-border)" }}>
              <h3 style={{ marginBottom: "10px" }}>No Historical Records</h3>
              <p style={{ color: "var(--text-secondary)" }}>
                No active charts or results have been logged for this market yet.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

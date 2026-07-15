import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { ref, get } from "firebase/database";

export default function Home() {
  const [markets, setMarkets] = useState([]);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch Markets
        const marketsSnap = await get(ref(db, "markets"));
        const marketsData = marketsSnap.val();
        
        // Fetch Results
        const resultsSnap = await get(ref(db, "results"));
        const resultsData = resultsSnap.val();

        // Process Markets
        let marketsList = [];
        if (marketsData) {
          marketsList = Object.keys(marketsData).map((id) => ({
            id,
            ...marketsData[id],
          }));
        }
        setMarkets(marketsList);

        // Process Results (Get the latest result per market name)
        const latestResults = {};
        if (resultsData) {
          const allResults = Object.keys(resultsData).map((id) => ({
            id,
            ...resultsData[id],
          }));
          
          // Sort results by date descending so the first one we find is the latest
          allResults.sort((a, b) => new Date(b.date) - new Date(a.date));

          allResults.forEach((res) => {
            if (!latestResults[res.marketName]) {
              latestResults[res.marketName] = res;
            }
          });
        }
        setResults(latestResults);
      } catch (error) {
        console.error("Error fetching homepage data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter active markets
  const activeMarkets = markets.filter((m) => m.status === "Active");

  // Search filter
  const filteredMarkets = markets.filter((m) =>
    m.marketName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="public-container">
      {/* ── Hero Section ── */}
      <section className="hero">
        <div className="live-badge">Live Results</div>
        <h1>
        Super Fast <span>TATA</span> Results
        </h1>
        <p>
          Get real-time updates on all matka markets, live result declarations, and
          comprehensive historical charts.
        </p>
      </section>

      {/* ── Live Highlights ── */}
      {loading ? (
        <div className="loader-container">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          <section style={{ marginBottom: "40px" }}>
            <h2 style={{ fontSize: "28px", marginBottom: "25px", textAlign: "center" }}>
              ⚡ Today's Live Results
            </h2>
            <div className="live-results-grid">
              {activeMarkets.slice(0, 6).map((market) => {
                const latestResult = results[market.marketName];
                return (
                  <div key={market.id} className="live-card">
                    <h3>{market.marketName}</h3>
                    <div className="time-info">
                      Open: {market.openTime} | Close: {market.closeTime}
                    </div>
                    <div className="result-num">
                      {latestResult ? latestResult.resultNumber : "Pending..."}
                    </div>
                    <div className="time-info" style={{ marginTop: "10px" }}>
                      Result Declared: {market.resultTime || "TBA"}
                    </div>
                    <div style={{ marginTop: "15px" }}>
                      <span className="status-indicator active">Active</span>
                    </div>
                  </div>
                );
              })}
              {activeMarkets.length === 0 && (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px" }}>
                  <p style={{ color: "var(--text-secondary)" }}>No active markets found.</p>
                </div>
              )}
            </div>
          </section>

          {/* ── All Markets Table ── */}
          <section className="table-section">
            <h2>📊 All Markets & Timings</h2>
            
            <div className="search-wrapper">
              <input
                type="text"
                placeholder="🔍 Search market..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="public-table">
                <thead>
                  <tr>
                    <th>Market Name</th>
                    <th>Open Time</th>
                    <th>Close Time</th>
                    <th>Result Time</th>
                    <th>Latest Result</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMarkets.map((market) => {
                    const latestResult = results[market.marketName];
                    return (
                      <tr key={market.id}>
                        <td data-label="Market Name" style={{ fontWeight: "700" }}>{market.marketName}</td>
                        <td data-label="Open Time">{market.openTime}</td>
                        <td data-label="Close Time">{market.closeTime}</td>
                        <td data-label="Result Time">{market.resultTime || "-"}</td>
                        <td data-label="Latest Result" style={{ color: "var(--glow-cyan)", fontWeight: "700", letterSpacing: "1px" }}>
                          {latestResult ? latestResult.resultNumber : "Pending"}
                        </td>
                        <td data-label="Action">
                          <div className="table-actions">
                            <Link to={`/charts/${encodeURIComponent(market.marketName)}`} className="table-btn">
                              📊 View Chart
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredMarkets.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", padding: "30px", color: "var(--text-secondary)" }}>
                        No markets found matching search term.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

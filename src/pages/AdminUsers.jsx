import { useEffect, useState } from "react";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onValue(ref(db, "users"), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map((id) => ({
          id,
          ...data[id],
        }));
        setUsers(list);
      } else {
        setUsers([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error loading users: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      u.name?.toLowerCase().includes(term) ||
      u.phone?.includes(term) ||
      u.email?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="page">
      <div className="page-header">
        <h1>👥 Registered Users</h1>
      </div>

      <div className="table-top" style={{ margin: "15px 0" }}>
        <input
          type="text"
          placeholder="Search by Name, Phone, or Email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
          style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}
        />
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
                <th>#</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Wallet Balance</th>
                <th>Joined Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((item, index) => (
                  <tr key={item.id}>
                    <td data-label="#">{index + 1}</td>
                    <td data-label="Name" style={{ fontWeight: "700" }}>{item.name}</td>
                    <td data-label="Phone">{item.phone}</td>
                    <td data-label="Email">{item.email}</td>
                    <td data-label="Wallet Balance" style={{ fontWeight: "700", color: "#10b981" }}>
                      ₹{item.balance || 0}
                    </td>
                    <td data-label="Joined Date">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "N/A"}
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

import { useEffect, useState } from "react";
import { updatePassword } from "firebase/auth";
import { auth } from "../firebase";

export default function Settings({ darkMode, setDarkMode }) {
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [autoBackup, setAutoBackup] = useState(false);

  const API_URL =
    "https://admin-panel-d7b0e-default-rtdb.firebaseio.com/settings/admin.json";

  const fetchSettings = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();

      if (data) {
        setAdminName(data.adminName || "");
        setEmail(data.email || "");
        setNotifications(data.notifications || false);
        setAutoBackup(data.autoBackup || false);

        const savedDark = data.darkMode || false;
        setDarkMode(savedDark);
        localStorage.setItem("darkMode", savedDark ? "true" : "false");
      }
    } catch (err) {
      console.error("Settings fetch error:", err);
    }
  };

  const saveSettings = async () => {
    try {
      await fetch(API_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminName,
          email,
          darkMode,
          notifications,
          autoBackup,
        }),
      });

      localStorage.setItem("darkMode", darkMode ? "true" : "false");

      if (password.trim() !== "") {
        await updatePassword(auth.currentUser, password);
      }

      alert("Settings Updated ✅");
      setPassword("");
    } catch (error) {
      if (error.code === "auth/requires-recent-login") {
        alert("Logout karke dubara login karo, phir password update karo.");
      } else {
        alert(error.message);
      }
    }
  };

  const handleDarkModeToggle = (e) => {
    const val = e.target.checked;
    setDarkMode(val);
    localStorage.setItem("darkMode", val ? "true" : "false");
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h1>⚙ Settings</h1>
        <button className="add-btn" onClick={saveSettings}>
          Save Settings
        </button>
      </div>

      <div className="chart-card">
        <h2>Admin Profile</h2>

        <div className="form-grid">
          

          <div className="input-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>New Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: "100%", paddingRight: "45px" }}
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  fontSize: "18px",
                }}
              >
                {showPassword ? "🙈" : "👁️"}
              </span>
            </div>
          </div>
        </div>

        <button className="submit-btn" onClick={saveSettings}>
          Update Settings
        </button>
      </div>

      
    </div>
  );
}
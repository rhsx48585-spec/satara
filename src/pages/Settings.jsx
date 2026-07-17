import { useEffect, useState } from "react";
import { updatePassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { ref, get, set } from "firebase/database";

export default function Settings() {
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [autoBackup, setAutoBackup] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Payment states
  const [upiId, setUpiId] = useState("");
  const [paymentMode, setPaymentMode] = useState("Manual");
  const [qrImageUrl, setQrImageUrl] = useState("");

  // Support contact states
  const [whatsappNo, setWhatsappNo] = useState("");
  const [supportPhone, setSupportPhone] = useState("");

  const fetchSettings = async () => {
    try {
      // Fetch admin settings
      const snapshot = await get(ref(db, "settings/admin"));
      const data = snapshot.val();

      if (data) {
        setAdminName(data.adminName || "");
        setEmail(data.email || "");
        setNotifications(data.notifications || false);
        setAutoBackup(data.autoBackup || false);

        const savedDark = data.darkMode || false;
        setDarkMode(savedDark);
        localStorage.setItem("darkMode", savedDark ? "true" : "false");
      }

      // Fetch payment settings
      const paySnapshot = await get(ref(db, "settings/payment"));
      const payData = paySnapshot.val();
      if (payData) {
        setUpiId(payData.upiId || "");
        setPaymentMode(payData.mode || "Manual");
        setQrImageUrl(payData.qrImageUrl || "");
      }

      // Fetch support settings
      const supportSnapshot = await get(ref(db, "settings/support"));
      const supportData = supportSnapshot.val();
      if (supportData) {
        setWhatsappNo(supportData.whatsapp || "");
        setSupportPhone(supportData.phone || "");
      }
    } catch (err) {
      console.error("Settings fetch error:", err);
    }
  };

  const saveSettings = async () => {
    try {
      // Save admin settings
      await set(ref(db, "settings/admin"), {
        adminName,
        email,
        darkMode,
        notifications,
        autoBackup,
      });

      // Save payment settings
      await set(ref(db, "settings/payment"), {
        upiId,
        mode: paymentMode,
        qrImageUrl,
      });

      // Save support settings
      await set(ref(db, "settings/support"), {
        whatsapp: whatsappNo,
        phone: supportPhone,
      });

      localStorage.setItem("darkMode", darkMode ? "true" : "false");

      if (password.trim() !== "") {
        await updatePassword(auth.currentUser, password);
      }

      alert("Settings Updated ✅");
      setPassword("");
    } catch (error) {
      if (error.code === "auth/requires-recent-login") {
        alert("Logout karke dobara login karo, phir password update karo.");
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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      alert("Image size should be less than 1MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setQrImageUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setQrImageUrl("");
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
          Update Profile
        </button>
      </div>

      <div className="chart-card" style={{ marginTop: "20px" }}>
        <h2>Payment Settings (UPI QR Code)</h2>

        <div className="form-grid">
          <div className="input-group">
            <label>UPI ID (For QR Code generation)</label>
            <input
              type="text"
              placeholder="e.g. UPI_ID@bank"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Custom QR Code Image (Upload File)</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ border: "none", padding: "5px 0", color: "#fff", background: "none" }}
              />
              {qrImageUrl && (
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                  <img
                    src={qrImageUrl}
                    alt="QR Preview"
                    style={{ width: "90px", height: "90px", objectFit: "contain", border: "1px solid #ccc", borderRadius: "8px", background: "#fff", padding: "4px" }}
                  />
                  <button
                    type="button"
                    onClick={handleClearImage}
                    style={{ background: "#ef4444", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "13px", cursor: "pointer", fontWeight: "600" }}
                  >
                    Clear Image
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="input-group">
            <label>Payment Verification Mode</label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc", outline: "none" }}
            >
              <option value="Manual">Manual Approval (Admin checks UTR)</option>
              <option value="Auto-Simulation">Auto-Simulation Mode (Auto-credit for Testing)</option>
            </select>
          </div>
        </div>

        <button className="submit-btn" onClick={saveSettings} style={{ marginTop: "20px" }}>
          Update Payment Settings
        </button>
      </div>

      <div className="chart-card" style={{ marginTop: "20px" }}>
        <h2>Support Contact Settings (Helplines)</h2>

        <div className="form-grid">
          <div className="input-group">
            <label>WhatsApp Support Number</label>
            <input
              type="text"
              placeholder="e.g. +919876543210"
              value={whatsappNo}
              onChange={(e) => setWhatsappNo(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Calling Support Helpline</label>
            <input
              type="text"
              placeholder="e.g. +919876543210"
              value={supportPhone}
              onChange={(e) => setSupportPhone(e.target.value)}
            />
          </div>
        </div>

        <button className="submit-btn" onClick={saveSettings} style={{ marginTop: "20px" }}>
          Update Support Contact Settings
        </button>
      </div>
    </div>
  );
}
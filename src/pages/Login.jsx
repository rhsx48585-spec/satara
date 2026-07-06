import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import ThreeBackground from "../components/ThreeBackground";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // 🧠 Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // 🔥 Convert Firebase error codes into friendly messages
  const getErrorMessage = (code) => {
    switch (code) {
      case "auth/invalid-email":
        return "Invalid email address";
      case "auth/user-not-found":
        return "No account found with this email";
      case "auth/wrong-password":
        return "Incorrect password";
      case "auth/invalid-credential":
        return "Email ya Password galat hai";
      case "auth/too-many-requests":
        return "Too many attempts. Please try again later";
      default:
        return "Login failed. Please try again";
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);

      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      onLogin("Admin");
    } catch (err) {
      setError(getErrorMessage(err.code));
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <ThreeBackground />

      <form className="login-box" onSubmit={handleLogin}>
        <div className="logo">🛡️</div>

        <h2>Admin Login</h2>
        <p className="subtitle">Welcome Back</p>

        {error && (
          <p
            style={{
              color: "#fca5a5",
              background: "rgba(220,38,38,.15)",
              border: "1px solid rgba(220,38,38,.4)",
              padding: "10px 14px",
              borderRadius: "10px",
              fontSize: "13.5px",
              marginBottom: "16px",
              textAlign: "center",
            }}
          >
            {error}
          </p>
        )}

        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="password-box">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <span
            className="show-password"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "🔒" : "🔑"}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            margin: "4px 0 18px 4px",
            color: "#94a3b8",
            fontSize: "13.5px",
          }}
        >
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            style={{
              width: "16px",
              height: "16px",
              cursor: "pointer",
              flexShrink: 0,
              accentColor: "#3b82f6",
              position: "relative",
              top: "9px",
            }}
          />
          <label htmlFor="rememberMe" style={{ cursor: "pointer" }}>
            Remember Me
          </label>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Signing In..." : "Sign In"}
        </button>

        <div className="login-footer">
          © 2026 Admin Panel
        </div>
      </form>
    </div>
  );
}
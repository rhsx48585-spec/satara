import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { ref, set } from "firebase/database";
import { auth, db } from "../firebase";
import ThreeBackground from "../components/ThreeBackground";

export default function UserAuth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const getFriendlyErrorMessage = (code) => {
    switch (code) {
      case "auth/invalid-email":
        return "Invalid email address format. (Email address galat hai)";
      case "auth/user-not-found":
        return "No account found with this email. (Is email se koi account nahi mila)";
      case "auth/wrong-password":
        return "Incorrect password. (Password galat hai)";
      case "auth/invalid-credential":
        return "Incorrect Email or Password. (Email ya Password galat hai)";
      case "auth/email-already-in-use":
        return "This email is already registered. (Yeh email pehle se registered hai)";
      case "auth/weak-password":
        return "Password should be at least 6 characters. (Password kam se kam 6 character ka hona chahiye)";
      case "auth/too-many-requests":
        return "Too many attempts. Try again later. (Thodi der baad dobara try karein)";
      default:
        return "Authentication failed. Please try again. (Kuch galat hua, dobara koshish karein)";
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (isForgotPassword) {
      if (!email) {
        setError("Please enter your email address.");
        setLoading(false);
        return;
      }
      try {
        await sendPasswordResetEmail(auth, email);
        alert("Password reset link sent! Please check your email. 📧");
        setIsForgotPassword(false);
      } catch (err) {
        setError(getFriendlyErrorMessage(err.code));
      }
      setLoading(false);
      return;
    }

    if (isSignUp) {
      // Sign Up validations
      if (!name || !phone || !email || !password || !confirmPassword) {
        setError("All fields are required.");
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }
      if (phone.length < 10) {
        setError("Please enter a valid phone number.");
        setLoading(false);
        return;
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save profile in database
        await set(ref(db, `users/${user.uid}`), {
          name,
          phone,
          email,
          balance: 0,
          createdAt: new Date().toISOString(),
        });

        alert("Registration Successful! Welcome to TATA ✅");
        navigate("/");
      } catch (err) {
        setError(getFriendlyErrorMessage(err.code));
      }
    } else {
      // Login validations
      if (!email || !password) {
        setError("Please enter both email and password.");
        setLoading(false);
        return;
      }

      try {
        await signInWithEmailAndPassword(auth, email, password);
        alert("Login Successful! ✅");
        navigate("/");
      } catch (err) {
        setError(getFriendlyErrorMessage(err.code));
      }
    }
    setLoading(false);
  };

  return (
    <div className="login-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: "20px 0" }}>
      <ThreeBackground />
      
      <div className="auth-card" style={{ position: "relative", zIndex: 10 }}>
        <h2>
          {isForgotPassword 
            ? "Reset Password" 
            : isSignUp 
            ? "Create TATA Account" 
            : "Login to TATA"}
        </h2>
        <p className="auth-subtitle">
          {isForgotPassword
            ? "Enter your email to receive a password reset link"
            : isSignUp
            ? "Sign up to track balance & make deposits"
            : "Manage your wallet and check live results"}
        </p>

        {error && <div className="auth-error-msg">{error}</div>}

        <form onSubmit={handleAuth} className="auth-form">
          {isSignUp && !isForgotPassword && (
            <>
              <div className="input-group">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label>Mobile Number</label>
                <input
                  type="tel"
                  placeholder="Enter 10-digit number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <div className="input-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="example@test.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {!isForgotPassword && (
            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}

          {isSignUp && !isForgotPassword && (
            <div className="input-group">
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          {!isSignUp && !isForgotPassword && (
            <div style={{ textAlign: "right", marginTop: "-10px" }}>
              <button
                type="button"
                onClick={() => { setIsForgotPassword(true); setError(""); }}
                style={{ background: "none", border: "none", color: "var(--glow-cyan)", cursor: "pointer", fontSize: "13px", padding: 0, textDecoration: "underline" }}
              >
                Forgot Password?
              </button>
            </div>
          )}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading 
              ? "Processing..." 
              : isForgotPassword 
              ? "Send Reset Link" 
              : isSignUp 
              ? "Sign Up" 
              : "Login"}
          </button>
        </form>

        <div className="auth-toggle">
          {isForgotPassword ? (
            <button type="button" onClick={() => { setIsForgotPassword(false); setError(""); }}>
              Back to Login
            </button>
          ) : (
            <>
              <span>{isSignUp ? "Already have an account?" : "New to TATA?"}</span>
              <button type="button" onClick={() => { setIsSignUp(!isSignUp); setError(""); }}>
                {isSignUp ? "Log In" : "Register Now"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

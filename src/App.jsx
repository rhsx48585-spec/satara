import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PublicLayout from "./public/PublicLayout";
import Home from "./public/Home";
import ChartsView from "./public/ChartsView";
import UserAuth from "./public/UserAuth";
import UserDashboard from "./public/UserDashboard";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#0f172a" }}>
        <div style={{ width: "50px", height: "50px", border: "5px solid rgba(255, 255, 255, 0.1)", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public Website Routes ── */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="charts/:marketName" element={<ChartsView />} />
          
          <Route
            path="login"
            element={
              user ? (
                user.email === "rhsx48585@gmail.com" ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              ) : (
                <UserAuth />
              )
            }
          />
          
          <Route
            path="dashboard"
            element={
              user ? (
                user.email === "rhsx48585@gmail.com" ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <UserDashboard />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Route>

        {/* ── Admin Panel Route ── */}
        <Route
          path="/admin"
          element={
            user && user.email === "rhsx48585@gmail.com" ? (
              <Dashboard onLogout={() => setUser(null)} />
            ) : (
              user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Login onLogin={() => setUser({})} />
              )
            )
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
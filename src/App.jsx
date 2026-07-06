import { useState } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

function App() {
  const [isLogin, setIsLogin] = useState(false);

  return (
    <>
      {isLogin ? (
        <Dashboard onLogout={() => setIsLogin(false)} />
      ) : (
        <Login onLogin={() => setIsLogin(true)} />
      )}
    </>
  );
}

export default App;
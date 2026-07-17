import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ref, onValue, push, set, runTransaction, query, limitToLast } from "firebase/database";
import { auth, db } from "../firebase";

export default function UserDashboard() {
  const [userProfile, setUserProfile] = useState(null);
  const [deposits, setDeposits] = useState([]);
  const [paymentConfig, setPaymentConfig] = useState({ upiId: "", mode: "Manual" });
  
  const [markets, setMarkets] = useState([]);
  const [bids, setBids] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatImage, setChatImage] = useState("");
  const [supportContacts, setSupportContacts] = useState({ whatsapp: "", phone: "" });
  const [groupMessages, setGroupMessages] = useState([]);
  const [groupNewMessage, setGroupNewMessage] = useState("");
  const [groupChatImage, setGroupChatImage] = useState("");

  // Deposit inputs
  const [amount, setAmount] = useState("");
  const [txnId, setTxnId] = useState("");

  // Gameplay inputs
  const [playMarket, setPlayMarket] = useState("");
  const [gameType, setGameType] = useState("Single Digit");
  const [playNumber, setPlayNumber] = useState("");
  const [bidPoints, setBidPoints] = useState("");
  const [placingBid, setPlacingBid] = useState(false);

  // Profile inputs
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");

  // Withdrawal inputs
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [payoutDetails, setPayoutDetails] = useState("");
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  // Support chat inputs
  const [newMessage, setNewMessage] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("play"); // play, bids, deposit, history, withdraw, chat, profile
  
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 150);
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, activeTab]);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      navigate("/login");
      return;
    }

    setLoading(true);

    // 1. Listen to user profile
    const unsubProfile = onValue(ref(db, `users/${currentUser.uid}`), (snapshot) => {
      const data = snapshot.val();
      setUserProfile(data);
      if (data) {
        setProfileName(data.name || "");
        setProfilePhone(data.phone || "");
      } else {
        // Auto navigate to profile tab if not set in DB
        setActiveTab("profile");
      }
      setLoading(false);
    });

    // 2. Listen to deposits
    const unsubDeposits = onValue(ref(db, "deposits"), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data)
          .map((id) => ({ id, ...data[id] }))
          .filter((d) => d.uid === currentUser.uid);
        
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setDeposits(list);
      } else {
        setDeposits([]);
      }
    });

    // 3. Listen to payment settings
    const unsubPayment = onValue(ref(db, "settings/payment"), (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setPaymentConfig(val);
      }
    });

    // 4. Listen to markets
    const unsubMarkets = onValue(ref(db, "markets"), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data)
          .map((id) => ({ id, ...data[id] }))
          .filter((m) => m.status === "Active");
        setMarkets(list);
        if (list.length > 0) {
          setPlayMarket(list[0].marketName);
        }
      } else {
        setMarkets([]);
      }
    });

    // 5. Listen to bids
    const unsubBids = onValue(ref(db, "bids"), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data)
          .map((id) => ({ id, ...data[id] }))
          .filter((b) => b.uid === currentUser.uid);
        
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setBids(list);
      } else {
        setBids([]);
      }
    });

    // 6. Listen to withdrawals
    const unsubWithdrawals = onValue(ref(db, "withdrawals"), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data)
          .map((id) => ({ id, ...data[id] }))
          .filter((w) => w.uid === currentUser.uid);
        
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setWithdrawals(list);
      } else {
        setWithdrawals([]);
      }
    });

    // 7. Listen to support chat messages
    const unsubChat = onValue(ref(db, `chats/${currentUser.uid}`), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map((id) => ({ id, ...data[id] }));
        list.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setChatMessages(list);
      } else {
        setChatMessages([]);
      }
    });

    // 8. Listen to support contact details
    const unsubSupport = onValue(ref(db, "settings/support"), (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setSupportContacts(val);
      }
    });

    // 9. Listen to community group chat messages
    const groupChatQuery = query(ref(db, "group_chat"), limitToLast(100));
    const unsubGroup = onValue(groupChatQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map((id) => ({ id, ...data[id] }));
        list.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setGroupMessages(list);
      } else {
        setGroupMessages([]);
      }
    });

    return () => {
      unsubProfile();
      unsubDeposits();
      unsubPayment();
      unsubMarkets();
      unsubBids();
      unsubWithdrawals();
      unsubChat();
      unsubSupport();
      unsubGroup();
    };
  }, [navigate]);

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!userProfile) {
      alert("Please save your profile first!");
      setActiveTab("profile");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    if (!txnId) {
      alert("Please enter the UTR/Transaction ID.");
      return;
    }

    setSubmitting(true);
    const currentUser = auth.currentUser;

    const depositData = {
      uid: currentUser.uid,
      userName: userProfile?.name || "Client",
      userPhone: userProfile?.phone || "N/A",
      userEmail: userProfile?.email || "N/A",
      amount: Number(amount),
      transactionId: txnId,
      status: "Pending",
      mode: paymentConfig.mode || "Manual",
      createdAt: new Date().toISOString(),
    };

    try {
      const newDepositRef = push(ref(db, "deposits"));
      await set(newDepositRef, depositData);
      
      const depositId = newDepositRef.key;

      if (paymentConfig.mode === "Auto-Simulation") {
        alert("Deposit submitted. Automatic payment detection starting... 🔄");
        
        // Simulate automatic payment verification in 5 seconds
        setTimeout(async () => {
          try {
            await set(ref(db, `deposits/${depositId}/status`), "Approved");
            
            const userBalanceRef = ref(db, `users/${currentUser.uid}/balance`);
            await runTransaction(userBalanceRef, (currentBalance) => {
              return (currentBalance || 0) + Number(amount);
            });

            alert(`🎉 Payment of ₹${amount} automatically verified and added to wallet!`);
          } catch (err) {
            console.error("Auto simulation failed: ", err);
          }
        }, 5000);
      } else {
        alert("Deposit request submitted successfully! Admin will verify and approve. ⏳");
      }

      setAmount("");
      setTxnId("");
      setActiveTab("history");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    if (!userProfile) {
      alert("Please save your profile first!");
      setActiveTab("profile");
      return;
    }
    if (!playMarket) {
      alert("Please select a market.");
      return;
    }
    if (!playNumber) {
      alert("Please enter the number to play.");
      return;
    }
    if (!bidPoints || Number(bidPoints) < 10) {
      alert("Minimum points to play is ₹10.");
      return;
    }

    // Number validations based on Game Type
    if (gameType === "Single Digit" && (playNumber.length !== 1 || isNaN(playNumber))) {
      alert("Single Digit must be exactly 1 number (0-9).");
      return;
    }
    if (gameType === "Jodi" && (playNumber.length !== 2 || isNaN(playNumber))) {
      alert("Jodi must be exactly 2 numbers (00-99).");
      return;
    }
    if ((gameType === "Single Patti" || gameType === "Double Patti" || gameType === "Triple Patti") && (playNumber.length !== 3 || isNaN(playNumber))) {
      alert("Patti must be exactly 3 numbers.");
      return;
    }

    if (userProfile.balance < Number(bidPoints)) {
      alert("Sufficient balance nahi hai! Wallet mein paise add karein. ❌");
      return;
    }

    const confirmBid = window.confirm(
      `Confirm Bidding: Play ${gameType} (Number: ${playNumber}) for ₹${bidPoints} points on "${playMarket}"?`
    );
    if (!confirmBid) return;

    setPlacingBid(true);
    const currentUser = auth.currentUser;

    const bidData = {
      uid: currentUser.uid,
      userName: userProfile.name || "Client",
      userPhone: userProfile.phone || "N/A",
      marketName: playMarket,
      gameType,
      numberPlayed: playNumber,
      points: Number(bidPoints),
      status: "Pending",
      createdAt: new Date().toISOString(),
    };

    try {
      const userBalanceRef = ref(db, `users/${currentUser.uid}/balance`);
      let txSuccess = false;
      
      await runTransaction(userBalanceRef, (currentBalance) => {
        if (currentBalance === null || currentBalance < Number(bidPoints)) {
          return;
        }
        txSuccess = true;
        return currentBalance - Number(bidPoints);
      });

      if (!txSuccess) {
        alert("Insufficient Balance or Transaction Failed.");
        setPlacingBid(false);
        return;
      }

      await set(push(ref(db, "bids")), bidData);

      alert(`🎉 Bid placed successfully! ₹${bidPoints} points deducted from wallet.`);
      setPlayNumber("");
      setBidPoints("");
      setActiveTab("bids");
    } catch (err) {
      alert("Error placing bid: " + err.message);
    } finally {
      setPlacingBid(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) {
      alert("Please enter your name.");
      return;
    }
    if (!profilePhone.trim() || profilePhone.length < 10) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    const currentUser = auth.currentUser;
    try {
      await set(ref(db, `users/${currentUser.uid}`), {
        name: profileName,
        phone: profilePhone,
        email: currentUser.email,
        balance: userProfile?.balance || 0,
        createdAt: userProfile?.createdAt || new Date().toISOString(),
      });
      alert("Profile updated successfully! ✅");
      setActiveTab("play");
    } catch (err) {
      alert("Error saving profile: " + err.message);
    }
  };

  const handleWithdrawRequest = async (e) => {
    e.preventDefault();
    if (!userProfile) {
      alert("Please save your profile first!");
      setActiveTab("profile");
      return;
    }
    if (!withdrawAmount || Number(withdrawAmount) < 100) {
      alert("Minimum withdrawal amount is ₹100.");
      return;
    }
    if (!payoutDetails.trim()) {
      alert("Please enter payout details (UPI ID or Bank Details).");
      return;
    }

    if (userProfile.balance < Number(withdrawAmount)) {
      alert("Sufficient balance nahi hai! Wallet mein points kam hain. ❌");
      return;
    }

    const confirmWithdraw = window.confirm(
      `Confirm Withdrawal Request: Withdraw ₹${withdrawAmount} points and receive on "${payoutDetails}"?`
    );
    if (!confirmWithdraw) return;

    setSubmittingWithdraw(true);
    const currentUser = auth.currentUser;

    const withdrawalData = {
      uid: currentUser.uid,
      userName: userProfile.name || "Client",
      userPhone: userProfile.phone || "N/A",
      amount: Number(withdrawAmount),
      payoutDetails,
      status: "Pending",
      createdAt: new Date().toISOString(),
    };

    try {
      const userBalanceRef = ref(db, `users/${currentUser.uid}/balance`);
      let txSuccess = false;

      await runTransaction(userBalanceRef, (currentBalance) => {
        if (currentBalance === null || currentBalance < Number(withdrawAmount)) {
          return;
        }
        txSuccess = true;
        return currentBalance - Number(withdrawAmount);
      });

      if (!txSuccess) {
        alert("Insufficient Balance or Transaction Failed.");
        setSubmittingWithdraw(false);
        return;
      }

      await set(push(ref(db, "withdrawals")), withdrawalData);

      alert(`🎉 Withdrawal request submitted! ₹${withdrawAmount} points deducted from wallet.`);
      setWithdrawAmount("");
      setPayoutDetails("");
      setActiveTab("play");
    } catch (err) {
      alert("Error submitting withdrawal: " + err.message);
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  const handleChatImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      alert("Image size should be less than 1MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setChatImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !chatImage) return;

    const currentUser = auth.currentUser;
    const msgData = {
      sender: "user",
      userName: userProfile?.name || "Client",
      userPhone: userProfile?.phone || "N/A",
      message: newMessage,
      imageUrl: chatImage || "",
      timestamp: new Date().toISOString(),
    };

    try {
      setNewMessage("");
      setChatImage("");
      await set(push(ref(db, `chats/${currentUser.uid}`)), msgData);
      
      // Update active list indicator
      await set(ref(db, `latest_chats/${currentUser.uid}`), {
        uid: currentUser.uid,
        userName: userProfile?.name || "Client",
        userPhone: userProfile?.phone || "N/A",
        lastMessage: chatImage ? "📷 Sent an image" : newMessage,
        timestamp: new Date().toISOString(),
        unread: true
      });
    } catch (err) {
      alert("Error sending message: " + err.message);
    }
  };

  const handleGroupImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      alert("Image size should be less than 1MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setGroupChatImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSendGroupMessage = async (e) => {
    e.preventDefault();
    if (!groupNewMessage.trim() && !groupChatImage) return;

    const currentUser = auth.currentUser;
    const msgData = {
      senderUid: currentUser.uid,
      senderName: userProfile?.name || "Client",
      senderPhone: userProfile?.phone || "N/A",
      message: groupNewMessage,
      imageUrl: groupChatImage || "",
      timestamp: new Date().toISOString(),
    };

    try {
      setGroupNewMessage("");
      setGroupChatImage("");
      await push(ref(db, "group_chat"), msgData);
    } catch (err) {
      alert("Error sending message: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
      </div>
    );
  }

  const upiId = paymentConfig.upiId || "demo@upi";
  const payAmount = amount || "0";
  const upiPayload = `upi://pay?pa=${upiId}&am=${payAmount}&pn=TATA&cu=INR`;
  const qrCodeUrl = paymentConfig.qrImageUrl || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiPayload)}`;

  return (
    <div className="public-container">
      <section className="user-dashboard-hero">
        <div className="user-card-glass">
          <div className="user-profile-header">
            <div>
              <h2>👋 Hello, {userProfile?.name || "User"}</h2>
              <p>{userProfile?.phone || "Phone not set"} | {auth.currentUser?.email}</p>
            </div>
            <div className="wallet-badge">
              <span className="wallet-title">Wallet Balance</span>
              <span className="wallet-amount">₹{userProfile?.balance || 0}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="dashboard-tabs">
        <button
          className={`tab-btn-glow ${activeTab === "play" ? "active" : ""}`}
          onClick={() => setActiveTab("play")}
          disabled={!userProfile}
        >
          🎮 Play Game
        </button>
        <button
          className={`tab-btn-glow ${activeTab === "bids" ? "active" : ""}`}
          onClick={() => setActiveTab("bids")}
          disabled={!userProfile}
        >
          📜 My Bids
        </button>
        <button
          className={`tab-btn-glow ${activeTab === "deposit" ? "active" : ""}`}
          onClick={() => setActiveTab("deposit")}
          disabled={!userProfile}
        >
          💰 Add Payment
        </button>
        <button
          className={`tab-btn-glow ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
          disabled={!userProfile}
        >
          📋 Deposit History
        </button>
        <button
          className={`tab-btn-glow ${activeTab === "withdraw" ? "active" : ""}`}
          onClick={() => setActiveTab("withdraw")}
          disabled={!userProfile}
        >
          💸 Withdraw Money
        </button>
        <button
          className={`tab-btn-glow ${activeTab === "chat" ? "active" : ""}`}
          onClick={() => setActiveTab("chat")}
          disabled={!userProfile}
        >
          💬 Support Chat
        </button>
        <button
          className={`tab-btn-glow ${activeTab === "group" ? "active" : ""}`}
          onClick={() => setActiveTab("group")}
          disabled={!userProfile}
        >
          👥 Group Chat
        </button>
        <button
          className={`tab-btn-glow ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          👤 Profile
        </button>
      </div>

      {activeTab === "play" && userProfile && (
        <div className="glass-panel" style={{ marginTop: "20px" }}>
          <h2 style={{ marginBottom: "20px" }}>Place a New Bid</h2>
          
          <form onSubmit={handlePlaceBid} className="auth-form" style={{ maxWidth: "500px", margin: "0 auto" }}>
            <div className="input-group">
              <label>Select Market</label>
              <select
                value={playMarket}
                onChange={(e) => setPlayMarket(e.target.value)}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--panel-border)", background: "rgba(0,0,0,0.4)", color: "#fff", cursor: "pointer" }}
                required
              >
                {markets.length === 0 ? (
                  <option value="">No Active Markets Available</option>
                ) : (
                  markets.map((m) => (
                    <option key={m.id} value={m.marketName}>
                      {m.marketName} ({m.openTime} - {m.closeTime})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="input-group">
              <label>Game Type</label>
              <select
                value={gameType}
                onChange={(e) => {
                  setGameType(e.target.value);
                  setPlayNumber("");
                }}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--panel-border)", background: "rgba(0,0,0,0.4)", color: "#fff", cursor: "pointer" }}
              >
                <option value="Single Digit">Single Digit (0-9)</option>
                <option value="Jodi">Jodi (00-99)</option>
                <option value="Single Patti">Single Patti (3 Digits)</option>
                <option value="Double Patti">Double Patti (3 Digits)</option>
                <option value="Triple Patti">Triple Patti (3 Digits)</option>
              </select>
            </div>

            <div className="input-group">
              <label>Number to Play</label>
              <input
                type="text"
                placeholder={
                  gameType === "Single Digit"
                    ? "Enter 1 digit (e.g. 5)"
                    : gameType === "Jodi"
                    ? "Enter 2 digits (e.g. 57)"
                    : "Enter 3 digits (e.g. 123)"
                }
                value={playNumber}
                onChange={(e) => setPlayNumber(e.target.value.replace(/\D/g, ""))}
                maxLength={gameType === "Single Digit" ? 1 : gameType === "Jodi" ? 2 : 3}
                required
              />
            </div>

            <div className="input-group">
              <label>Bidding Points (₹)</label>
              <input
                type="number"
                placeholder="Enter points (Min. 10)"
                value={bidPoints}
                onChange={(e) => setBidPoints(e.target.value)}
                min="10"
                required
              />
            </div>

            <button type="submit" className="auth-submit-btn" disabled={placingBid || markets.length === 0}>
              {placingBid ? "Placing Bid..." : `Place ₹${bidPoints || 0} Bid`}
            </button>
          </form>
        </div>
      )}

      {activeTab === "bids" && userProfile && (
        <div className="market-table-card" style={{ marginTop: "20px", background: "var(--panel-bg)", border: "1px solid var(--panel-border)" }}>
          <h2 style={{ padding: "0 0 15px 0", color: "#fff" }}>My Bids History</h2>

          <table className="public-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Market</th>
                <th>Game Type</th>
                <th>Number</th>
                <th>Points (₹)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bids.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                    No bids placed yet.
                  </td>
                </tr>
              ) : (
                bids.map((item) => (
                  <tr key={item.id}>
                    <td data-label="Date & Time">
                      {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td data-label="Market">{item.marketName}</td>
                    <td data-label="Game Type">{item.gameType}</td>
                    <td data-label="Number" style={{ fontWeight: "700", color: "var(--glow-cyan)" }}>
                      {item.numberPlayed}
                    </td>
                    <td data-label="Points" style={{ fontWeight: "700", color: "#fff" }}>
                      ₹{item.points}
                    </td>
                    <td data-label="Status">
                      <span className={`status-badge ${item.status?.toLowerCase()}`}>
                        {item.status === "Pending" && "🟡 Pending"}
                        {item.status === "Win" && "🟢 Win"}
                        {item.status === "Loss" && "🔴 Loss"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "deposit" && userProfile && (
        <div className="glass-panel" style={{ marginTop: "20px" }}>
          <h2 style={{ marginBottom: "20px" }}>Add Money to Wallet</h2>

          <div className="deposit-grid">
            <div className="deposit-qr-section">
              <h3>Scan QR Code to Pay</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "15px" }}>
                Scan using any UPI app (GPay, PhonePe, Paytm, BHIM)
              </p>
              
              <div className="qr-wrapper">
                <img src={qrCodeUrl} alt="UPI Payment QR Code" className="payment-qr-img" />
              </div>

              <div className="upi-details-box">
                <span className="upi-label">UPI ID:</span>
                <span className="upi-id">{upiId}</span>
              </div>
            </div>

            <div className="deposit-form-section">
              <h3>Submit Payment Details</h3>
              <form onSubmit={handleDeposit} className="auth-form" style={{ marginTop: "15px" }}>
                <div className="input-group">
                  <label>Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="Enter amount to add"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Transaction ID / UTR Number</label>
                  <input
                    type="text"
                    placeholder="12-digit UPI Ref Number"
                    value={txnId}
                    onChange={(e) => setTxnId(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="auth-submit-btn" disabled={submitting}>
                  {submitting ? "Submitting..." : `Add ₹${amount || 0} to Wallet`}
                </button>
              </form>

              {paymentConfig.mode === "Auto-Simulation" && (
                <div className="sim-mode-notice">
                  ℹ️ <strong>Auto-Simulation Mode Active:</strong> Payment will be verified automatically in 5 seconds after submitting.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "history" && userProfile && (
        <div className="market-table-card" style={{ marginTop: "20px", background: "var(--panel-bg)", border: "1px solid var(--panel-border)" }}>
          <h2 style={{ padding: "0 0 15px 0", color: "#fff" }}>Deposit History</h2>

          <table className="public-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>UTR ID</th>
                <th>Amount</th>
                <th>Mode</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {deposits.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                    No deposit requests found.
                  </td>
                </tr>
              ) : (
                deposits.map((item) => (
                  <tr key={item.id}>
                    <td data-label="Date">
                      {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td data-label="UTR ID">{item.transactionId}</td>
                    <td data-label="Amount" style={{ fontWeight: "700", color: "#fff" }}>
                      ₹{item.amount}
                    </td>
                    <td data-label="Mode">{item.mode || "Manual"}</td>
                    <td data-label="Status">
                      <span className={`status-badge ${item.status?.toLowerCase()}`}>
                        {item.status === "Pending" && "🟡 Pending"}
                        {item.status === "Approved" && "🟢 Approved"}
                        {item.status === "Rejected" && "🔴 Rejected"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "withdraw" && userProfile && (
        <div className="glass-panel" style={{ marginTop: "20px" }}>
          <h2 style={{ marginBottom: "20px" }}>Request Payout Withdrawal</h2>
          
          <div className="deposit-grid">
            <div className="deposit-form-section">
              <h3>Submit Payout Request</h3>
              <form onSubmit={handleWithdrawRequest} className="auth-form" style={{ marginTop: "15px" }}>
                <div className="input-group">
                  <label>Amount to Withdraw (₹)</label>
                  <input
                    type="number"
                    placeholder="Min. ₹100"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    min="100"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Payout Destination UPI ID / Account Details</label>
                  <input
                    type="text"
                    placeholder="e.g. UPI_ID@bank or Bank A/C No with IFSC"
                    value={payoutDetails}
                    onChange={(e) => setPayoutDetails(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="auth-submit-btn" disabled={submittingWithdraw}>
                  {submittingWithdraw ? "Submitting..." : `Withdraw ₹${withdrawAmount || 0} from Wallet`}
                </button>
              </form>
            </div>

            <div className="deposit-qr-section" style={{ borderLeft: "1px solid var(--panel-border)", borderRight: "none", paddingLeft: "40px", paddingRight: 0 }}>
              <h3>Current Balance Info</h3>
              <div className="wallet-badge" style={{ margin: "20px 0", textAlign: "center", background: "rgba(0, 242, 254, 0.05)", borderColor: "rgba(0, 242, 254, 0.2)", boxShadow: "0 0 15px rgba(0, 242, 254, 0.15)" }}>
                <span className="wallet-title" style={{ color: "var(--glow-cyan)" }}>Withdrawable Balance</span>
                <span className="wallet-amount" style={{ color: "var(--glow-cyan)" }}>₹{userProfile?.balance || 0}</span>
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: "1.5" }}>
                Your withdrawal request will be processed by the Admin within a few hours. In case of rejection, the points will be automatically refunded to your wallet.
              </p>
            </div>
          </div>

          <div className="market-table-card" style={{ marginTop: "40px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--panel-border)" }}>
            <h3 style={{ padding: "15px", color: "#fff", borderBottom: "1px solid var(--panel-border)" }}>Withdrawals Log</h3>
            <table className="public-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Amount</th>
                  <th>Payout Details</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                      No withdrawal requests yet.
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((item) => (
                    <tr key={item.id}>
                      <td data-label="Date & Time">
                        {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td data-label="Amount" style={{ fontWeight: "700", color: "#fff" }}>
                        ₹{item.amount}
                      </td>
                      <td data-label="Payout Details">{item.payoutDetails}</td>
                      <td data-label="Status">
                        <span className={`status-badge ${item.status?.toLowerCase()}`}>
                          {item.status === "Pending" && "🟡 Pending"}
                          {item.status === "Approved" && "🟢 Approved"}
                          {item.status === "Rejected" && "🔴 Rejected"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "chat" && userProfile && (
        <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Support Helpline Buttons Row */}
          {(supportContacts.whatsapp || supportContacts.phone) && (
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", width: "100%" }}>
              {supportContacts.whatsapp && (
                <a
                  href={`https://wa.me/${supportContacts.whatsapp.replace(/\+/g, "").replace(/\s/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="tab-btn-glow"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    textDecoration: "none",
                    background: "#25d366",
                    borderColor: "#25d366",
                    boxShadow: "0 0 10px rgba(37, 211, 102, 0.3)",
                    color: "#fff",
                    fontWeight: "600",
                    flex: "1 1 120px",
                    minWidth: "120px",
                    justifyContent: "center",
                    textAlign: "center",
                    padding: "10px",
                    fontSize: "13px"
                  }}
                >
                  💬 WhatsApp
                </a>
              )}
              {supportContacts.phone && (
                <a
                  href={`tel:${supportContacts.phone}`}
                  className="tab-btn-glow"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    textDecoration: "none",
                    background: "rgba(0, 242, 254, 0.1)",
                    borderColor: "rgba(0, 242, 254, 0.4)",
                    color: "#fff",
                    fontWeight: "600",
                    flex: "1 1 120px",
                    minWidth: "120px",
                    justifyContent: "center",
                    textAlign: "center",
                    padding: "10px",
                    fontSize: "13px"
                  }}
                >
                  📞 Phone Help
                </a>
              )}
            </div>
          )}

          <div className="glass-panel" style={{ display: "flex", flexDirection: "column", height: "500px", padding: "20px", marginTop: 0 }}>
            <h2 style={{ marginBottom: "15px" }}>💬 Support Live Chat</h2>
            
            <div style={{ flexGrow: 1, overflowY: "auto", padding: "10px", background: "rgba(0,0,0,0.3)", borderRadius: "12px", border: "1px solid var(--panel-border)", marginBottom: "15px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {chatMessages.length === 0 ? (
                <div style={{ margin: "auto", color: "var(--text-secondary)", textAlign: "center", fontSize: "14px" }}>
                  No messages yet. Send a message to start chatting with the Admin!
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isAdmin = msg.sender === "admin";
                  return (
                    <div
                      key={msg.id}
                      style={{
                        alignSelf: isAdmin ? "flex-start" : "flex-end",
                        background: isAdmin ? "rgba(255,255,255,0.08)" : "var(--btn-gradient)",
                        color: "#fff",
                        padding: "10px 16px",
                        borderRadius: "16px",
                        borderBottomRightRadius: isAdmin ? "16px" : "4px",
                        borderBottomLeftRadius: isAdmin ? "4px" : "16px",
                        maxWidth: "75%",
                        boxShadow: isAdmin ? "none" : "var(--btn-glow)",
                        border: isAdmin ? "1px solid var(--panel-border)" : "none"
                      }}
                    >
                      <div style={{ fontSize: "11px", color: isAdmin ? "var(--glow-cyan)" : "rgba(255,255,255,0.7)", fontWeight: "700", marginBottom: "4px" }}>
                        {isAdmin ? "🛡️ ADMIN" : "YOU"}
                      </div>
                      {msg.message && <div style={{ fontSize: "14px", lineHeight: "1.4", wordBreak: "break-word" }}>{msg.message}</div>}
                      {msg.imageUrl && (
                        <img
                          src={msg.imageUrl}
                          alt="attachment"
                          style={{ maxWidth: "100%", maxHeight: "180px", borderRadius: "8px", marginTop: "8px", cursor: "zoom-in", display: "block" }}
                          onClick={() => {
                            const w = window.open();
                            w.document.write(`<img src="${msg.imageUrl}" style="max-width:100%; max-height:100vh; display:block; margin:auto;" />`);
                          }}
                        />
                      )}
                      <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.5)", textAlign: "right", marginTop: "4px" }}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {chatImage && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", width: "fit-content" }}>
                  <img src={chatImage} alt="Preview" style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "4px" }} />
                  <button type="button" onClick={() => setChatImage("")} style={{ background: "#ef4444", color: "#fff", border: "none", width: "20px", height: "20px", borderRadius: "50%", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "10px" }}>✕</button>
                </div>
              )}
              <div style={{ display: "flex", gap: "6px", width: "100%" }}>
                <input
                  type="text"
                  placeholder="Type message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onFocus={scrollToBottom}
                  onClick={scrollToBottom}
                  style={{ flexGrow: 1, minWidth: 0, width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid var(--panel-border)", background: "rgba(0,0,0,0.4)", color: "#fff", outline: "none", fontSize: "14px" }}
                />
                
                <label style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "42px", height: "42px", flexShrink: 0, background: "rgba(255,255,255,0.05)", border: "1px solid var(--panel-border)", borderRadius: "10px", cursor: "pointer", fontSize: "18px", transition: "all 0.2s ease" }}>
                  📷
                  <input type="file" accept="image/*" onChange={handleChatImageUpload} style={{ display: "none" }} />
                </label>

                <button type="submit" className="auth-submit-btn" style={{ marginTop: 0, width: "auto", padding: "0 15px", height: "42px", flexShrink: 0, fontSize: "14px" }}>
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === "group" && userProfile && (
        <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="glass-panel" style={{ display: "flex", flexDirection: "column", height: "500px", padding: "20px", marginTop: 0 }}>
            <h2 style={{ marginBottom: "15px" }}>👥 Community Group Chat</h2>
            
            <div style={{ flexGrow: 1, overflowY: "auto", padding: "10px", background: "rgba(0,0,0,0.3)", borderRadius: "12px", border: "1px solid var(--panel-border)", marginBottom: "15px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {groupMessages.length === 0 ? (
                <div style={{ margin: "auto", color: "var(--text-secondary)", textAlign: "center", fontSize: "14px" }}>
                  No messages in group chat yet. Write a message to start the community conversation!
                </div>
              ) : (
                groupMessages.map((msg) => {
                  const isOwnMessage = msg.senderUid === auth.currentUser.uid;
                  const isAdmin = msg.senderUid === "admin";
                  return (
                    <div
                      key={msg.id}
                      style={{
                        alignSelf: isOwnMessage ? "flex-end" : "flex-start",
                        background: isOwnMessage ? "var(--btn-gradient)" : "rgba(255,255,255,0.08)",
                        color: "#fff",
                        padding: "10px 16px",
                        borderRadius: "16px",
                        borderBottomRightRadius: isOwnMessage ? "4px" : "16px",
                        borderBottomLeftRadius: isOwnMessage ? "16px" : "4px",
                        maxWidth: "75%",
                        boxShadow: isOwnMessage ? "var(--btn-glow)" : "none",
                        border: isOwnMessage ? "none" : "1px solid var(--panel-border)"
                      }}
                    >
                      <div style={{ fontSize: "11px", color: isAdmin ? "#f43f5e" : (isOwnMessage ? "rgba(255,255,255,0.7)" : "var(--glow-cyan)"), fontWeight: "700", marginBottom: "4px" }}>
                        {isAdmin ? "🛡️ ADMIN" : (isOwnMessage ? "YOU" : `👤 ${msg.senderName}`)}
                      </div>
                      {msg.message && <div style={{ fontSize: "14px", lineHeight: "1.4", wordBreak: "break-word" }}>{msg.message}</div>}
                      {msg.imageUrl && (
                        <img
                          src={msg.imageUrl}
                          alt="attachment"
                          style={{ maxWidth: "100%", maxHeight: "180px", borderRadius: "8px", marginTop: "8px", cursor: "zoom-in", display: "block" }}
                          onClick={() => {
                            const w = window.open();
                            w.document.write(`<img src="${msg.imageUrl}" style="max-width:100%; max-height:100vh; display:block; margin:auto;" />`);
                          }}
                        />
                      )}
                      <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.5)", textAlign: "right", marginTop: "4px" }}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendGroupMessage} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {groupChatImage && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", width: "fit-content" }}>
                  <img src={groupChatImage} alt="Preview" style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "4px" }} />
                  <button type="button" onClick={() => setGroupChatImage("")} style={{ background: "#ef4444", color: "#fff", border: "none", width: "20px", height: "20px", borderRadius: "50%", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "10px" }}>✕</button>
                </div>
              )}
              <div style={{ display: "flex", gap: "6px", width: "100%" }}>
                <input
                  type="text"
                  placeholder="Post message to group..."
                  value={groupNewMessage}
                  onChange={(e) => setGroupNewMessage(e.target.value)}
                  onFocus={scrollToBottom}
                  onClick={scrollToBottom}
                  style={{ flexGrow: 1, minWidth: 0, width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid var(--panel-border)", background: "rgba(0,0,0,0.4)", color: "#fff", outline: "none", fontSize: "14px" }}
                />
                
                <label style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "42px", height: "42px", flexShrink: 0, background: "rgba(255,255,255,0.05)", border: "1px solid var(--panel-border)", borderRadius: "10px", cursor: "pointer", fontSize: "18px", transition: "all 0.2s ease" }}>
                  📷
                  <input type="file" accept="image/*" onChange={handleGroupImageUpload} style={{ display: "none" }} />
                </label>

                <button type="submit" className="auth-submit-btn" style={{ marginTop: 0, width: "auto", padding: "0 15px", height: "42px", flexShrink: 0, fontSize: "14px" }}>
                  Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === "profile" && (
        <div className="glass-panel" style={{ marginTop: "20px" }}>
          <h2 style={{ marginBottom: "20px" }}>Update Profile Info</h2>
          {!userProfile && (
            <p style={{ color: "var(--glow-cyan)", marginBottom: "20px", fontWeight: "600" }}>
              ⚠️ Please complete your profile details below to enable gameplay and deposits.
            </p>
          )}

          <form onSubmit={handleSaveProfile} className="auth-form" style={{ maxWidth: "500px", margin: "0 auto" }}>
            <div className="input-group">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Enter full name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>Mobile Number</label>
              <input
                type="tel"
                placeholder="Enter 10-digit number"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>Email Address (Read-only)</label>
              <input
                type="email"
                value={auth.currentUser?.email || ""}
                disabled
                style={{ opacity: 0.6, background: "rgba(255,255,255,0.05)" }}
              />
            </div>

            <button type="submit" className="auth-submit-btn">
              Save Profile Details
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState, useRef } from "react";
import { ref, onValue, push, set, query, limitToLast } from "firebase/database";
import { db } from "../firebase";

export default function AdminGroupChat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatImage, setChatImage] = useState("");
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 150);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setLoading(true);
    const groupChatRef = query(ref(db, "group_chat"), limitToLast(100));
    const unsubscribe = onValue(groupChatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map((id) => ({
          id,
          ...data[id],
        }));
        list.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setMessages(list);
      } else {
        setMessages([]);
      }
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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

  const handleSendGroupMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !chatImage) return;

    const messageData = {
      senderUid: "admin",
      senderName: "🛡️ ADMIN",
      senderPhone: "Admin Helpline",
      message: newMessage,
      imageUrl: chatImage || "",
      timestamp: new Date().toISOString(),
    };

    try {
      setNewMessage("");
      setChatImage("");
      await push(ref(db, "group_chat"), messageData);
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

  return (
    <div className="page">
      <div className="page-header">
        <h1>👥 Community Group Chat</h1>
      </div>

      <div className="market-card" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 200px)", minHeight: "450px", padding: "16px" }}>
        <div
          style={{
            flexGrow: 1,
            overflowY: "auto",
            padding: "10px",
            background: "rgba(0,0,0,0.3)",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.05)",
            marginBottom: "15px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {messages.length === 0 ? (
            <div style={{ margin: "auto", color: "#64748b" }}>
              No messages in group chat yet. Write a message to start the community conversation!
            </div>
          ) : (
            messages.map((msg) => {
              const isAdmin = msg.senderUid === "admin";
              return (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: isAdmin ? "flex-end" : "flex-start",
                    background: isAdmin ? "var(--btn-gradient)" : "rgba(255,255,255,0.08)",
                    color: "#fff",
                    padding: "10px 16px",
                    borderRadius: "16px",
                    borderBottomRightRadius: isAdmin ? "4px" : "16px",
                    borderBottomLeftRadius: isAdmin ? "16px" : "4px",
                    maxWidth: "75%",
                    boxShadow: isAdmin ? "var(--btn-glow)" : "none",
                    border: isAdmin ? "none" : "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div style={{ fontSize: "11px", color: isAdmin ? "rgba(255,255,255,0.7)" : "var(--glow-cyan)", fontWeight: "700", marginBottom: "4px" }}>
                    {msg.senderName} ({msg.senderPhone})
                  </div>
                  {msg.message && (
                    <div style={{ fontSize: "14px", lineHeight: "1.4", wordBreak: "break-word" }}>
                      {msg.message}
                    </div>
                  )}
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
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendGroupMessage} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {chatImage && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", width: "fit-content" }}>
              <img src={chatImage} alt="Preview" style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "4px" }} />
              <button type="button" onClick={() => setChatImage("")} style={{ background: "#ef4444", color: "#fff", border: "none", width: "20px", height: "20px", borderRadius: "50%", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "10px" }}>✕</button>
            </div>
          )}
          <div style={{ display: "flex", gap: "6px", width: "100%" }}>
            <input
              type="text"
              placeholder="Post message to group..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onFocus={scrollToBottom}
              onClick={scrollToBottom}
              style={{
                flexGrow: 1,
                minWidth: 0,
                width: "100%",
                padding: "12px 14px",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(0,0,0,0.4)",
                color: "#fff",
                outline: "none",
                fontSize: "14px"
              }}
            />

            <label style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "42px", height: "42px", flexShrink: 0, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", cursor: "pointer", fontSize: "18px", transition: "all 0.2s ease" }}>
              📷
              <input type="file" accept="image/*" onChange={handleChatImageUpload} style={{ display: "none" }} />
            </label>

            <button
              type="submit"
              className="submit-btn"
              style={{
                width: "auto",
                padding: "0 15px",
                margin: 0,
                height: "42px",
                flexShrink: 0,
                fontSize: "14px"
              }}
            >
              Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

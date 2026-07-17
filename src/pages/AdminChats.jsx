import { useEffect, useState, useRef } from "react";
import { ref, onValue, push, set } from "firebase/database";
import { db } from "../firebase";

export default function AdminChats() {
  const [threads, setThreads] = useState([]);
  const [selectedUid, setSelectedUid] = useState("");
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

  // 1. Listen to active chat threads
  useEffect(() => {
    setLoading(true);
    const threadsRef = ref(db, "latest_chats");
    const unsubThreads = onValue(threadsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map((uid) => ({
          uid,
          ...data[uid],
        }));
        // Sort by latest message first
        list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setThreads(list);
        
        // Auto select first thread if none selected
        if (list.length > 0 && !selectedUid) {
          setSelectedUid(list[0].uid);
        }
      } else {
        setThreads([]);
      }
      setLoading(false);
    });

    return () => unsubThreads();
  }, [selectedUid]);

  // 2. Listen to selected thread messages
  useEffect(() => {
    if (!selectedUid) {
      setMessages([]);
      return;
    }

    const messagesRef = ref(db, `chats/${selectedUid}`);
    const unsubMessages = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map((id) => ({
          id,
          ...data[id],
        }));
        list.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setMessages(list);

        // Mark thread as read
        set(ref(db, `latest_chats/${selectedUid}/unread`), false);
      } else {
        setMessages([]);
      }
    });

    return () => unsubMessages();
  }, [selectedUid]);

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

  const handleSendReply = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !chatImage) || !selectedUid) return;

    const replyData = {
      sender: "admin",
      message: newMessage,
      imageUrl: chatImage || "",
      timestamp: new Date().toISOString(),
    };

    try {
      const activeThread = threads.find((t) => t.uid === selectedUid);
      const name = activeThread?.userName || "Client";
      const phone = activeThread?.userPhone || "N/A";

      setNewMessage("");
      setChatImage("");
      // Add message to chat node
      await set(push(ref(db, `chats/${selectedUid}`)), replyData);

      // Update latest chats with admin's message
      await set(ref(db, `latest_chats/${selectedUid}`), {
        uid: selectedUid,
        userName: name,
        userPhone: phone,
        lastMessage: chatImage ? "📷 Sent an image" : newMessage,
        timestamp: new Date().toISOString(),
        unread: false,
      });
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

  const activeThread = threads.find((t) => t.uid === selectedUid);

  return (
    <div className="admin-chat-container">
      {/* ── Left Sidebar: Chat Threads ── */}
      <div className={`market-card admin-chat-sidebar ${selectedUid ? "hide-mobile" : ""}`} style={{ display: "flex", flexDirection: "column" }}>
        <h3 style={{ marginBottom: "15px", fontSize: "16px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "10px" }}>
          💬 Active Conversations
        </h3>
        
        <div style={{ flexGrow: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
          {threads.length === 0 ? (
            <div style={{ margin: "auto", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
              No active chats yet.
            </div>
          ) : (
            threads.map((t) => (
              <div
                key={t.uid}
                onClick={() => setSelectedUid(t.uid)}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  background: t.uid === selectedUid ? "rgba(0, 242, 254, 0.1)" : "rgba(255, 255, 255, 0.02)",
                  border: t.uid === selectedUid ? "1px solid rgba(0, 242, 254, 0.3)" : "1px solid rgba(255, 255, 255, 0.05)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  position: "relative",
                }}
              >
                {t.unread && (
                  <div
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "12px",
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#ef4444",
                    }}
                  />
                )}
                <div style={{ fontWeight: "600", fontSize: "14px", color: t.uid === selectedUid ? "var(--glow-cyan)" : "#fff", marginBottom: "3px" }}>
                  {t.userName}
                </div>
                <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "6px" }}>
                  {t.userPhone}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.6)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {t.lastMessage}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Right Panel: Chat Message History ── */}
      <div className={`market-card admin-chat-main ${!selectedUid ? "hide-mobile" : ""}`} style={{ display: "flex", flexDirection: "column" }}>
        {selectedUid && activeThread ? (
          <>
            {/* Header info */}
            <div
              style={{
                borderBottom: "1px solid rgba(255,255,255,0.1)",
                paddingBottom: "12px",
                marginBottom: "15px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap"
              }}
            >
              <div>
                <h3 style={{ fontSize: "16px", color: "var(--glow-cyan)" }}>
                  Chatting with {activeThread.userName}
                </h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Phone: {activeThread.userPhone}
                </span>
              </div>
              <button
                type="button"
                className="submit-btn"
                onClick={() => setSelectedUid("")}
                style={{ margin: 0, width: "auto", padding: "6px 12px", fontSize: "12px" }}
              >
                ⬅️ Back
              </button>
            </div>

            {/* Message thread */}
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
                  Start the conversation by sending a message below.
                </div>
              ) : (
                messages.map((msg) => {
                  const isUser = msg.sender === "user";
                  return (
                    <div
                      key={msg.id}
                      style={{
                        alignSelf: isUser ? "flex-start" : "flex-end",
                        background: isUser ? "rgba(255,255,255,0.08)" : "var(--btn-gradient)",
                        color: "#fff",
                        padding: "10px 16px",
                        borderRadius: "16px",
                        borderBottomRightRadius: isUser ? "16px" : "4px",
                        borderBottomLeftRadius: isUser ? "4px" : "16px",
                        maxWidth: "75%",
                        boxShadow: isUser ? "none" : "var(--btn-glow)",
                        border: isUser ? "1px solid rgba(255,255,255,0.05)" : "none",
                      }}
                    >
                      <div style={{ fontSize: "11px", color: isUser ? "var(--glow-cyan)" : "rgba(255,255,255,0.7)", fontWeight: "700", marginBottom: "4px" }}>
                        {isUser ? "👤 CLIENT" : "🛡️ YOU (ADMIN)"}
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
            <form onSubmit={handleSendReply} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {chatImage && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", width: "fit-content" }}>
                  <img src={chatImage} alt="Preview" style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "4px" }} />
                  <button type="button" onClick={() => setChatImage("")} style={{ background: "#ef4444", color: "#fff", border: "none", width: "20px", height: "20px", borderRadius: "50%", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "10px" }}>✕</button>
                </div>
              )}
              <div style={{ display: "flex", gap: "6px", width: "100%" }}>
                <input
                  type="text"
                  placeholder="Type reply..."
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
                  Reply
                </button>
              </div>
            </form>
          </>
        ) : (
          <div style={{ margin: "auto", textAlign: "center", color: "#64748b" }}>
            Select a conversation from the active chats list on the left to start chatting.
          </div>
        )}
      </div>
    </div>
  );
}

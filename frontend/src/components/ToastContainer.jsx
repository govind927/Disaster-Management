import { useState, useEffect, useCallback } from "react";
import { useSocket } from "../context/SocketContext";

const TOAST_STYLES = {
  success: {
    bg: "rgba(34,197,94,0.15)",
    border: "rgba(34,197,94,0.3)",
    color: "#4ade80",
  },
  error: {
    bg: "rgba(239,68,68,0.15)",
    border: "rgba(239,68,68,0.3)",
    color: "#f87171",
  },
  warning: {
    bg: "rgba(245,158,11,0.15)",
    border: "rgba(245,158,11,0.3)",
    color: "#fbbf24",
  },
  info: {
    bg: "rgba(59,130,246,0.15)",
    border: "rgba(59,130,246,0.3)",
    color: "#60a5fa",
  },
};

// Global toast function — call from anywhere
let addToastGlobal = null;
export const showToast = (message, type = "info", duration = 4000) => {
  if (addToastGlobal) addToastGlobal(message, type, duration);
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  const { socket } = useSocket();

  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  // Register global function
  useEffect(() => {
    addToastGlobal = addToast;
    return () => {
      addToastGlobal = null;
    };
  }, [addToast]);

  // Listen to socket events and show toasts
  useEffect(() => {
    if (!socket) return;

    socket.on("new_incident", (inc) => {
      addToast(`New incident: ${inc.title}`, "warning");
    });
    socket.on("incident_updated", ({ status }) => {
      addToast(`Incident status → ${status}`, "info");
    });
    socket.on("new_alert", (alert) => {
      addToast(`Alert: ${alert.title}`, "error", 6000);
    });
    socket.on("resource_assigned", () => {
      addToast("Resource assigned to incident", "success");
    });

    return () => {
      socket.off("new_incident");
      socket.off("incident_updated");
      socket.off("new_alert");
      socket.off("resource_assigned");
    };
  }, [socket, addToast]);

  if (!toasts.length) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxWidth: 320,
      }}
    >
      {toasts.map((toast) => {
        const c = TOAST_STYLES[toast.type] || TOAST_STYLES.info;
        return (
          <div
            key={toast.id}
            className="toast-item"
            style={{
              background: c.bg,
              border: `1px solid ${c.border}`,
              borderLeft: `3px solid ${c.border}`,
              color: c.color,
            }}
          >
            <span>{toast.message}</span>
            <button
              onClick={() =>
                setToasts((p) => p.filter((t) => t.id !== toast.id))
              }
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: c.color,
                fontSize: 16,
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}

import { useSocket } from "../context/SocketContext";

export default function LiveStatusBar() {
  const { connected, onlineUsers } = useSocket();

  return (
    <div className={`live-bar ${connected ? "connected" : "disconnected"}`}>
      <span
        className={`live-dot ${connected ? "connected" : "disconnected"}`}
      />
      <span>{connected ? "Live" : "Reconnecting..."}</span>
      {connected && (
        <span style={{ color: "#64748b" }}>
          · {onlineUsers} user{onlineUsers !== 1 ? "s" : ""} online
        </span>
      )}
    </div>
  );
}

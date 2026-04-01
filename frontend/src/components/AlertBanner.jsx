const SEVERITY_STYLES = {
  low: {
    bg: "rgba(34,197,94,0.1)",
    border: "rgba(34,197,94,0.25)",
    color: "#4ade80",
    icon: "ℹ",
  },
  medium: {
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.25)",
    color: "#fbbf24",
    icon: "⚠",
  },
  high: {
    bg: "rgba(249,115,22,0.1)",
    border: "rgba(249,115,22,0.25)",
    color: "#fb923c",
    icon: "⚠",
  },
  critical: {
    bg: "rgba(239,68,68,0.1)",
    border: "rgba(239,68,68,0.3)",
    color: "#f87171",
    icon: "🚨",
  },
};

export default function AlertBanner({ alert, onDismiss }) {
  if (!alert) return null;
  const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.medium;

  return (
    <div
      className="alert-banner"
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderLeft: `3px solid ${style.border}`,
      }}
    >
      <span style={{ fontSize: 18, flexShrink: 0 }}>{style.icon}</span>
      <div style={{ flex: 1 }}>
        <p
          style={{
            margin: 0,
            fontWeight: 600,
            color: style.color,
            fontSize: 14,
          }}
        >
          {alert.title}
        </p>
        <p
          style={{
            margin: "2px 0 0",
            fontSize: 13,
            color: style.color,
            opacity: 0.8,
          }}
        >
          {alert.message}
        </p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: style.color,
            fontSize: 20,
            lineHeight: 1,
            flexShrink: 0,
            opacity: 0.7,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

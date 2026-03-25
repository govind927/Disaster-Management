const SEVERITY_STYLES = {
  low:      { background: '#f0fdf4', border: '#86efac', color: '#166534', icon: 'ℹ' },
  medium:   { background: '#fffbeb', border: '#fcd34d', color: '#92400e', icon: '⚠' },
  high:     { background: '#fff7ed', border: '#fb923c', color: '#9a3412', icon: '⚠' },
  critical: { background: '#fef2f2', border: '#f87171', color: '#991b1b', icon: '🚨' },
};

export default function AlertBanner({ alert, onDismiss }) {
  if (!alert) return null;
  const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.medium;

  return (
    <div style={{
      background:   style.background,
      border:       `1px solid ${style.border}`,
      borderLeft:   `4px solid ${style.border}`,
      borderRadius: 8,
      padding:      '12px 16px',
      display:      'flex',
      alignItems:   'flex-start',
      gap:          10,
      marginBottom: '1rem',
    }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>{style.icon}</span>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontWeight: 600, color: style.color, fontSize: 14 }}>
          {alert.title}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 13, color: style.color, opacity: 0.85 }}>
          {alert.message}
        </p>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: style.color, fontSize: 18, lineHeight: 1, flexShrink: 0,
        }}>×</button>
      )}
    </div>
  );
}
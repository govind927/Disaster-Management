import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWeatherAlerts } from "../hooks/useWeatherAlerts";
import { useSocket } from "../context/SocketContext";
import AlertBanner from "../components/AlertBanner";
import api from "../api/axios";

const SEVERITY_COLOR = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444",
};

const WEATHER_ICONS = {
  "01d": "☀️",
  "01n": "🌙",
  "02d": "⛅",
  "02n": "⛅",
  "03d": "☁️",
  "03n": "☁️",
  "04d": "☁️",
  "04n": "☁️",
  "09d": "🌧️",
  "09n": "🌧️",
  "10d": "🌦️",
  "10n": "🌦️",
  "11d": "⛈️",
  "11n": "⛈️",
  "13d": "❄️",
  "13n": "❄️",
  "50d": "🌫️",
  "50n": "🌫️",
};

export default function AlertsPage() {
  const { weather, alert, forecast, loading, error } = useWeatherAlerts();

  const [dbAlerts, setDbAlerts] = useState([]);
  const [dismissed, setDismissed] = useState(false);
  const [socketAlert, setSocketAlert] = useState(null);
  const [socketDismissed, setSocketDismissed] = useState(false);

  const { socket } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/alerts")
      .then((res) => setDbAlerts(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on("new_alert", (newAlert) => {
      setDbAlerts((prev) => [newAlert, ...prev]);
      setSocketAlert(newAlert);
      setSocketDismissed(false);
    });

    socket.on("alert_deleted", ({ id }) => {
      setDbAlerts((prev) => prev.filter((a) => a.id !== id));
    });

    return () => {
      socket.off("new_alert");
      socket.off("alert_deleted");
    };
  }, [socket]);

  return (
    <div style={s.page}>
      {/* Navbar */}
      <div style={s.navbar}>
        <button onClick={() => navigate("/dashboard")} style={s.backBtn}>
          ← Dashboard
        </button>
        <h2 style={s.brand}>Disaster Alerts</h2>
      </div>

      <div style={s.content}>
        {/* Weather alert banner */}
        {!dismissed && alert && (
          <AlertBanner alert={alert} onDismiss={() => setDismissed(true)} />
        )}

        {/* Manual alert banner from admin */}
        {!socketDismissed && socketAlert && (
          <AlertBanner
            alert={socketAlert}
            onDismiss={() => setSocketDismissed(true)}
          />
        )}

        {/* Current Weather Card */}
        <div style={s.section}>
          <h3 style={s.sectionTitle}>Current Weather</h3>
          {loading && <p style={s.muted}>Detecting your location...</p>}
          {error && <p style={{ color: "#ef4444", fontSize: 14 }}>{error}</p>}
          {weather && (
            <div className="weather-card">
              <div className="weather-main">
                <span style={s.weatherIcon}>
                  {WEATHER_ICONS[weather.icon] || "🌡️"}
                </span>
                <div>
                  <p style={s.weatherTemp}>{Math.round(weather.temp)}°C</p>
                  <p style={s.weatherCity}>
                    {weather.city}, {weather.country}
                  </p>
                  <p style={s.weatherDesc}>{weather.description}</p>
                </div>
              </div>
              <div className="weather-stats">
                {[
                  {
                    label: "Feels like",
                    value: `${Math.round(weather.feels_like)}°C`,
                  },
                  { label: "Humidity", value: `${weather.humidity}%` },
                  { label: "Wind speed", value: `${weather.wind_speed} m/s` },
                ].map(({ label, value }) => (
                  <div key={label} style={s.stat}>
                    <span style={s.statLabel}>{label}</span>
                    <span style={s.statValue}>{value}</span>
                  </div>
                ))}
              </div>
              {alert && (
                <div
                  style={{
                    ...s.alertPill,
                    background: SEVERITY_COLOR[alert.severity],
                  }}
                >
                  {alert.severity.toUpperCase()} WEATHER ALERT
                </div>
              )}
            </div>
          )}
        </div>

        {/* 5-Day Forecast */}
        {forecast.length > 0 && (
          <div style={s.section}>
            <h3 style={s.sectionTitle}>5-Day Forecast</h3>
            <div className="forecast-grid">
              {forecast.map((day) => (
                <div
                  key={day.date}
                  className={`forecast-card ${day.isDangerous ? "forecast-danger" : ""}`}
                >
                  <p style={s.forecastDate}>
                    {new Date(day.date).toLocaleDateString("en-IN", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <span style={{ fontSize: 28 }}>
                    {WEATHER_ICONS[day.icon] || "🌡️"}
                  </span>
                  <p style={s.forecastTemp}>
                    {Math.round(day.temp_max)}° / {Math.round(day.temp_min)}°
                  </p>
                  <p style={s.forecastDesc}>{day.description}</p>
                  <p style={s.forecastWind}>💨 {day.wind_speed} m/s</p>
                  {day.isDangerous && <span style={s.dangerBadge}>ALERT</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Saved Alerts from DB */}
        <div style={s.section}>
          <h3 style={s.sectionTitle}>Active Alerts ({dbAlerts.length})</h3>
          {dbAlerts.length === 0 && (
            <p style={s.muted}>No active alerts at the moment.</p>
          )}
          <div style={s.alertsList}>
            {dbAlerts.map((a) => (
              <div key={a.id} style={s.alertItem}>
                <div
                  style={{
                    ...s.severityDot,
                    background: SEVERITY_COLOR[a.severity],
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={s.alertTop}>
                    <span style={s.alertTitle}>{a.title}</span>
                    <span
                      style={{
                        ...s.severityBadge,
                        background: SEVERITY_COLOR[a.severity],
                      }}
                    >
                      {a.severity}
                    </span>
                  </div>
                  <p style={s.alertMsg}>{a.message}</p>
                  <p style={s.alertMeta}>
                    Source: {a.source} ·{" "}
                    {new Date(a.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#f3f4f6" },
  navbar: {
    padding: "0.75rem 1.5rem",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  backBtn: {
    padding: "6px 12px",
    background: "#f3f4f6",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
  },
  brand: { margin: 0, fontSize: 17, fontWeight: 600, color: "#f1f5f9" },
  content: { maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" },
  section: { marginBottom: "2rem" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: "#f1f5f9",
    marginBottom: "1rem",
  },
  muted: { color: "#94a3b8", fontSize: 14 },
  weatherCard: {
    borderRadius: 12,
    padding: "1.5rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    position: "relative",
    overflow: "hidden",
  },
  weatherMain: {
    display: "flex",
    alignItems: "center",
    gap: "1.5rem",
    marginBottom: "1rem",
  },
  weatherIcon: { fontSize: 64 },
  weatherTemp: {
    margin: 0,
    fontSize: 48,
    fontWeight: 700,
    color: "#f1f5f9",
    lineHeight: 1,
  },
  weatherCity: {
    margin: "4px 0 0",
    fontSize: 18,
    fontWeight: 500,
    color: "#cbd5e1",
  },
  weatherDesc: {
    margin: "2px 0 0",
    fontSize: 14,
    color: "#94a3b8",
    textTransform: "capitalize",
  },
  weatherStats: {
    display: "flex",
    gap: "2rem",
    borderTop: "1px solid #e5e7eb",
    paddingTop: "1rem",
  },
  stat: { display: "flex", flexDirection: "column", gap: 2 },
  statLabel: { fontSize: 12, color: "#94a3b8" },
  statValue: { fontSize: 15, fontWeight: 600, color: "#f1f5f9" },
  alertPill: {
    position: "absolute",
    top: 12,
    right: 12,
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    padding: "3px 10px",
    borderRadius: 20,
  },
  forecastGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: "0.75rem",
  },
  forecastCard: {
    borderRadius: 10,
    padding: "1rem",
    textAlign: "center",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  forecastDanger: {
    border: "1px solid #fca5a5",
  },
  forecastDate: {
    margin: "0 0 6px",
    fontSize: 12,
    fontWeight: 600,
    color: "#cbd5e1",
  },
  forecastTemp: {
    margin: "6px 0 2px",
    fontSize: 14,
    fontWeight: 600,
    color: "#f1f5f9",
  },
  forecastDesc: {
    margin: 0,
    fontSize: 11,
    color: "#94a3b8",
    textTransform: "capitalize",
  },
  forecastWind: {
    margin: "4px 0 0",
    fontSize: 11,
    color: "#94a3b8",
  },
  dangerBadge: {
    display: "inline-block",
    marginTop: 6,
    background: "#ef4444",
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    padding: "2px 6px",
    borderRadius: 4,
  },
  alertsList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  alertItem: {
    borderRadius: 10,
    padding: "1rem",
    display: "flex",
    gap: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  severityDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    marginTop: 4,
    flexShrink: 0,
  },
  alertTop: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  alertTitle: {
    fontWeight: 600,
    fontSize: 14,
    color: "#f1f5f9",
  },
  severityBadge: {
    fontSize: 11,
    color: "#fff",
    padding: "1px 8px",
    borderRadius: 10,
    fontWeight: 500,
  },
  alertMsg: {
    margin: "0 0 4px",
    fontSize: 13,
    color: "#94a3b8",
  },
  alertMeta: {
    margin: 0,
    fontSize: 11,
    color: "#94a3b8",
  },
};

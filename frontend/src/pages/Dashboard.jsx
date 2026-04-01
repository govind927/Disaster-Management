import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWeatherAlerts } from "../hooks/useWeatherAlerts";
import AlertBanner from "../components/AlertBanner";
import LiveStatusBar from "../components/LiveStatusBar";
import api from "../api/axios";

const severityColor = { low: "#22c55e", medium: "#f59e0b", high: "#ef4444" };
const statusColor = {
  pending: "#f59e0b",
  active: "#3b82f6",
  resolved: "#22c55e",
};

export default function Dashboard() {
  const { user, logout, isAdmin } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const { alert: weatherAlert } = useWeatherAlerts();
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/incidents/my")
      .then((res) => setIncidents(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="page-bg">
      <LiveStatusBar />

      {/* Navbar */}
      <nav className="nav">
        <span className="nav-brand">⚡ Disaster Management</span>
        <div className="nav-links">
          <span className="nav-welcome">Hello, {user?.name}</span>
          <button className="btn-report" onClick={() => navigate("/report")}>
            + Report
          </button>
          <button className="btn-map" onClick={() => navigate("/map")}>
            Live Map
          </button>
          <button className="btn-alerts" onClick={() => navigate("/alerts")}>
            Alerts
          </button>
          {isAdmin && (
            <button className="btn-admin" onClick={() => navigate("/admin")}>
              Admin Panel
            </button>
          )}
          <button className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
        <button className="hamburger" onClick={() => setMenuOpen((p) => !p)}>
          {menuOpen ? "✕" : "☰"}
        </button>
      </nav>

      {/* Mobile menu */}
      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        <span className="mobile-menu-welcome">Hello, {user?.name}</span>
        <button
          style={{
            background: "linear-gradient(135deg,#ef4444,#dc2626)",
            color: "#fff",
          }}
          onClick={() => {
            navigate("/report");
            setMenuOpen(false);
          }}
        >
          + Report Incident
        </button>
        <button
          style={{
            background: "linear-gradient(135deg,#3b82f6,#2563eb)",
            color: "#fff",
          }}
          onClick={() => {
            navigate("/map");
            setMenuOpen(false);
          }}
        >
          Live Map
        </button>
        <button
          style={{
            background: "linear-gradient(135deg,#f59e0b,#d97706)",
            color: "#fff",
          }}
          onClick={() => {
            navigate("/alerts");
            setMenuOpen(false);
          }}
        >
          View Alerts
        </button>
        {isAdmin && (
          <button
            style={{
              background: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
              color: "#fff",
            }}
            onClick={() => {
              navigate("/admin");
              setMenuOpen(false);
            }}
          >
            Admin Panel
          </button>
        )}
        <button
          style={{
            background: "rgba(255,255,255,0.05)",
            color: "#94a3b8",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

      {/* Content */}
      <div className="page-content">
        {!alertDismissed && weatherAlert && (
          <AlertBanner
            alert={weatherAlert}
            onDismiss={() => setAlertDismissed(true)}
          />
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <h3 className="section-title" style={{ margin: 0 }}>
            My Reported Incidents
          </h3>
          <button
            className="btn-report"
            onClick={() => navigate("/report")}
            style={{ padding: "9px 20px", fontSize: 14 }}
          >
            + Report New Incident
          </button>
        </div>

        {loading && (
          <div
            style={{ textAlign: "center", padding: "3rem", color: "#475569" }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                border: "3px solid rgba(255,255,255,0.1)",
                borderTop: "3px solid #3b82f6",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 1rem",
              }}
            />
            Loading incidents...
          </div>
        )}

        {!loading && incidents.length === 0 && (
          <div className="empty-state">
            <div style={{ fontSize: 48, marginBottom: "1rem" }}>🗺️</div>
            <p>You haven't reported any incidents yet.</p>
            <button
              className="btn-report"
              style={{ padding: "10px 24px", fontSize: 14 }}
              onClick={() => navigate("/report")}
            >
              Report Your First Incident
            </button>
          </div>
        )}

        <div className="incident-grid">
          {incidents.map((inc, i) => (
            <div
              key={inc.id}
              className="incident-card"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              {inc.image_url && (
                <div style={{ overflow: "hidden" }}>
                  <img src={inc.image_url} alt="incident" />
                </div>
              )}
              <div className="card-body">
                <div className="card-top">
                  <span className="type-pill">{inc.type}</span>
                  <span
                    className="badge"
                    style={{ background: severityColor[inc.severity] }}
                  >
                    {inc.severity}
                  </span>
                  <span
                    className="badge"
                    style={{ background: statusColor[inc.status] }}
                  >
                    {inc.status}
                  </span>
                </div>
                <h4 className="inc-title">{inc.title}</h4>
                {inc.description && (
                  <p className="inc-desc">{inc.description}</p>
                )}
                <p className="inc-date">
                  {new Date(inc.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

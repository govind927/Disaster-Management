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

      {/* ── Navbar ── */}
      <nav className="nav">
        <span className="nav-brand">Disaster Management</span>

        {/* Desktop links */}
        <div className="nav-links">
          <span className="nav-welcome">Hello, {user?.name}</span>
          <button className="btn-report" onClick={() => navigate("/report")}>
            Report Incident
          </button>
          <button className="btn-map" onClick={() => navigate("/map")}>
            View Map
          </button>
          <button className="btn-alerts" onClick={() => navigate("/alerts")}>
            View Alerts
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

        {/* Hamburger */}
        <button className="hamburger" onClick={() => setMenuOpen((p) => !p)}>
          {menuOpen ? "✕" : "☰"}
        </button>
      </nav>

      {/* Mobile dropdown */}
      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        <span className="mobile-menu-welcome">Hello, {user?.name}</span>
        <button
          style={{ background: "#ef4444", color: "#fff" }}
          onClick={() => {
            navigate("/report");
            setMenuOpen(false);
          }}
        >
          Report Incident
        </button>
        <button
          style={{ background: "#2563eb", color: "#fff" }}
          onClick={() => {
            navigate("/map");
            setMenuOpen(false);
          }}
        >
          View Map
        </button>
        <button
          style={{ background: "#f59e0b", color: "#fff" }}
          onClick={() => {
            navigate("/alerts");
            setMenuOpen(false);
          }}
        >
          View Alerts
        </button>
        {isAdmin && (
          <button
            style={{ background: "#7c3aed", color: "#fff" }}
            onClick={() => {
              navigate("/admin");
              setMenuOpen(false);
            }}
          >
            Admin Panel
          </button>
        )}
        <button
          style={{ background: "#6b7280", color: "#fff" }}
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

        <h3 className="section-title">My Reported Incidents</h3>

        {loading && (
          <p style={{ color: "#6b7280", fontSize: 14 }}>Loading...</p>
        )}

        {!loading && incidents.length === 0 && (
          <div className="empty-state">
            <p>You haven't reported any incidents yet.</p>
            <button
              className="btn-report"
              style={{ marginTop: "1rem", padding: "10px 20px", fontSize: 14 }}
              onClick={() => navigate("/report")}
            >
              Report Your First Incident
            </button>
          </div>
        )}

        <div className="incident-grid">
          {incidents.map((inc) => (
            <div key={inc.id} className="incident-card">
              {inc.image_url && (
                <img
                  src={inc.image_url}
                  alt="incident"
                />
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

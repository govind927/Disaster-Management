import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import LiveStatusBar from "../components/LiveStatusBar";
import api from "../api/axios";

const SEVERITY_COLOR = { low: "#22c55e", medium: "#f59e0b", high: "#ef4444" };
const STATUS_COLOR = {
  pending: "#f59e0b",
  active: "#3b82f6",
  resolved: "#22c55e",
};
const STATUS_BG = {
  pending: "#fffbeb",
  active: "#eff6ff",
  resolved: "#f0fdf4",
};
const RESOURCE_ICONS = {
  ambulance: "🚑",
  shelter: "🏠",
  food: "🍱",
  rescue_team: "🪖",
  medical: "💊",
  fire_brigade: "🚒",
};

export default function AdminPanel() {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [resources, setResources] = useState([]);
  const [users, setUsers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState({});
  const [newResource, setNewResource] = useState({
    name: "",
    type: "ambulance",
    quantity: 1,
  });
  const [newAlert, setNewAlert] = useState({
    title: "",
    message: "",
    severity: "medium",
  });
  const [assignModal, setAssignModal] = useState(null);
  const [selectedResource, setSelectedResource] = useState("");
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const [statsRes, incRes, resRes, usersRes, alertsRes] = await Promise.all(
        [
          api.get("/admin/stats"),
          api.get("/admin/incidents"),
          api.get("/resources"),
          api.get("/admin/users"),
          api.get("/alerts"),
        ],
      );
      setStats(statsRes.data);
      setIncidents(incRes.data);
      setResources(resRes.data);
      setUsers(usersRes.data);
      setAlerts(alertsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on("new_incident", (inc) => setIncidents((p) => [inc, ...p]));
    socket.on("incident_updated", ({ id, status }) =>
      setIncidents((p) => p.map((i) => (i.id === id ? { ...i, status } : i))),
    );
    socket.on("resource_assigned", () => loadData());
    socket.on("resource_released", () => loadData());
    return () => {
      socket.off("new_incident");
      socket.off("incident_updated");
      socket.off("resource_assigned");
      socket.off("resource_released");
    };
  }, [socket]);

  const loadAssignments = async (incidentId) => {
    try {
      const res = await api.get(`/resources/assignments/${incidentId}`);
      setAssignments((prev) => ({ ...prev, [incidentId]: res.data }));
    } catch (err) {
      console.error("Load assignments error:", err);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/incidents/${id}/status`, { status });
      setIncidents((p) => p.map((i) => (i.id === id ? { ...i, status } : i)));
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    }
  };

  const assignResource = async () => {
    if (!selectedResource) return alert("Please select a resource");
    try {
      await api.post("/resources/assign", {
        incident_id: assignModal.id,
        resource_id: selectedResource,
      });
      setAssignModal(null);
      setSelectedResource("");
      loadData();
      loadAssignments(assignModal.id);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign resource");
    }
  };

  const releaseResource = async (assignmentId, incidentId) => {
    if (!window.confirm("Release this resource back to available?")) return;
    try {
      await api.post(`/resources/release/${assignmentId}`);
      loadData();
      loadAssignments(incidentId);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to release resource");
    }
  };

  const releaseResourceDirect = async (resourceId) => {
    if (!window.confirm("Release this resource back to available?")) return;
    try {
      await api.post(`/resources/release-by-resource/${resourceId}`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to release resource");
    }
  };

  const createResource = async (e) => {
    e.preventDefault();
    try {
      await api.post("/resources", newResource);
      setNewResource({ name: "", type: "ambulance", quantity: 1 });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create resource");
    }
  };

  const createAlert = async (e) => {
    e.preventDefault();
    try {
      await api.post("/alerts", newAlert);
      setNewAlert({ title: "", message: "", severity: "medium" });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create alert");
    }
  };

  const deleteAlert = async (id) => {
    if (!window.confirm("Delete this alert?")) return;
    try {
      await api.delete(`/alerts/${id}`);
      setAlerts((p) => p.filter((a) => a.id !== id));
    } catch (err) {
      alert("Failed to delete alert");
    }
  };

  const deleteResource = async (id) => {
    if (!window.confirm("Delete this resource?")) return;
    try {
      await api.delete(`/resources/${id}`);
      loadData();
    } catch (err) {
      alert("Failed to delete resource");
    }
  };

  const updateRole = async (id, role) => {
    try {
      await api.put(`/admin/users/${id}/role`, { role });
      setUsers((p) => p.map((u) => (u.id === id ? { ...u, role } : u)));
    } catch (err) {
      alert("Failed to update role");
    }
  };

  if (loading) return <div style={s.loading}>Loading admin panel...</div>;

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "incidents", label: `Incidents (${incidents.length})` },
    { key: "resources", label: `Resources (${resources.length})` },
    { key: "alerts", label: `Alerts (${alerts.length})` },
    { key: "users", label: `Users (${users.length})` },
  ];

  return (
    <div style={s.page}>
      <LiveStatusBar />

      <div className="admin-nav">
        <h2 className="admin-brand">⚡ Admin Control Center</h2>
        <div className="admin-nav-links">
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              padding: "6px 14px",
              background: "rgba(255,255,255,0.06)",
              color: "#94a3b8",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 13,
              transition: "all 0.2s",
            }}
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate("/map")}
            style={{
              padding: "6px 14px",
              background: "rgba(59,130,246,0.1)",
              color: "#60a5fa",
              border: "1px solid rgba(59,130,246,0.2)",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 13,
              transition: "all 0.2s",
            }}
          >
            Live Map
          </button>
          <span className="admin-badge">ADMIN</span>
          <span style={{ color: "#64748b", fontSize: 13 }}>{user?.name}</span>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            style={{
              padding: "6px 14px",
              background: "rgba(239,68,68,0.1)",
              color: "#f87171",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div className="tab-bar">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`tab-btn ${tab === t.key ? "tab-active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="page-content">
        {tab === "overview" && stats && (
          <div>
            <div className="stats-grid">
              {[
                {
                  label: "Total Incidents",
                  value: stats.incidents.total,
                  color: "#3b82f6",
                },
                {
                  label: "Pending",
                  value: stats.incidents.pending,
                  color: "#f59e0b",
                },
                {
                  label: "Active",
                  value: stats.incidents.active,
                  color: "#ef4444",
                },
                {
                  label: "Resolved",
                  value: stats.incidents.resolved,
                  color: "#22c55e",
                },
                {
                  label: "Total Users",
                  value: stats.users.total,
                  color: "#8b5cf6",
                },
                {
                  label: "Resources",
                  value: stats.resources.total,
                  color: "#06b6d4",
                },
                {
                  label: "Deployed",
                  value: stats.resources.deployed,
                  color: "#f97316",
                },
                {
                  label: "Active Alerts",
                  value: stats.alerts.active,
                  color: "#ef4444",
                },
              ].map(({ label, value, color }) => (
                <div key={label} style={s.statCard}>
                  <p style={{ ...s.statValue, color }}>{value}</p>
                  <p style={s.statLabel}>{label}</p>
                </div>
              ))}
            </div>
            <h3 style={s.sectionTitle}>Recent Incidents</h3>
            <div className="table-wrap">
              <table style={s.table}>
                <thead>
                  <tr>
                    {[
                      "Image",
                      "Title",
                      "Type",
                      "Severity",
                      "Status",
                      "Reporter",
                      "Date",
                      "Action",
                    ].map((h) => (
                      <th key={h} style={s.th}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {incidents.slice(0, 5).map((inc) => (
                    <tr key={inc.id} style={s.tr}>
                      <td style={s.td}>
                        {inc.image_url ? (
                          <img
                            src={inc.image_url}
                            alt="incident"
                            style={{
                              width: 60,
                              height: 45,
                              objectFit: "cover",
                              borderRadius: 6,
                              cursor: "pointer",
                            }}
                            onClick={() => window.open(inc.image_url, "_blank")}
                          />
                        ) : (
                          <span style={{ fontSize: 11, color: "#9ca3af" }}>
                            No image
                          </span>
                        )}
                      </td>

                      <td style={s.td}>{inc.title}</td>
                      <td style={s.td}>
                        <span style={s.typePill}>{inc.type}</span>
                      </td>
                      <td style={s.td}>
                        <span
                          style={{
                            ...s.pill,
                            background: SEVERITY_COLOR[inc.severity],
                          }}
                        >
                          {inc.severity}
                        </span>
                      </td>
                      <td style={s.td}>
                        <span
                          style={{
                            ...s.pill,
                            background: STATUS_COLOR[inc.status],
                          }}
                        >
                          {inc.status}
                        </span>
                      </td>
                      <td style={s.td}>{inc.reporter_name}</td>
                      <td style={s.td}>
                        {new Date(inc.created_at).toLocaleDateString()}
                      </td>
                      <td style={s.td}>
                        <button
                          onClick={() => setTab("incidents")}
                          style={s.actionBtn}
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "incidents" && (
          <div>
            <h3 style={s.sectionTitle}>All Incidents</h3>
            <div className="table-wrap">
              <table style={s.table}>
                <thead>
                  <tr>
                    {[
                      "ID",
                      "Image",
                      "Title",
                      "Type",
                      "Severity",
                      "Status",
                      "Reporter",
                      "Date",
                      "Status Action",
                      "Resources",
                    ].map((h) => (
                      <th key={h} style={s.th}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((inc) => (
                    <tr
                      key={inc.id}
                      style={{ ...s.tr, background: STATUS_BG[inc.status] }}
                    >
                      <td style={s.td}>#{inc.id}</td>
                      <td style={s.td}>
                        {inc.image_url ? (
                          <img
                            src={inc.image_url}
                            alt="incident"
                            style={{
                              width: 60,
                              height: 45,
                              objectFit: "cover",
                              borderRadius: 6,
                              cursor: "pointer",
                            }}
                            onClick={() => window.open(inc.image_url, "_blank")}
                          />
                        ) : (
                          <span style={{ fontSize: 11, color: "#9ca3af" }}>
                            No image
                          </span>
                        )}
                      </td>
                      <td style={{ ...s.td, maxWidth: 160 }}>{inc.title}</td>
                      <td style={s.td}>
                        <span style={s.typePill}>{inc.type}</span>
                      </td>
                      <td style={s.td}>
                        <span
                          style={{
                            ...s.pill,
                            background: SEVERITY_COLOR[inc.severity],
                          }}
                        >
                          {inc.severity}
                        </span>
                      </td>
                      <td style={s.td}>
                        <span
                          style={{
                            ...s.pill,
                            background: STATUS_COLOR[inc.status],
                          }}
                        >
                          {inc.status}
                        </span>
                      </td>
                      <td style={s.td}>{inc.reporter_name}</td>
                      <td style={s.td}>
                        {new Date(inc.created_at).toLocaleDateString()}
                      </td>
                      <td style={s.td}>
                        <select
                          value={inc.status}
                          onChange={(e) => updateStatus(inc.id, e.target.value)}
                          style={s.select}
                        >
                          <option value="pending">Pending</option>
                          <option value="active">Active</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </td>

                      <td style={s.td}>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                            minWidth: 180,
                          }}
                        >
                          {inc.status !== "resolved" && (
                            <button
                              onClick={() => {
                                setAssignModal(inc);
                                loadAssignments(inc.id);
                              }}
                              style={s.assignBtn}
                            >
                              + Assign Resource
                            </button>
                          )}

                          <button
                            onClick={() => loadAssignments(inc.id)}
                            style={s.viewBtn}
                          >
                            View Assigned
                          </button>

                          {assignments[inc.id] && (
                            <div style={s.assignmentList}>
                              {assignments[inc.id].length === 0 ? (
                                <span
                                  style={{ fontSize: 11, color: "#9ca3af" }}
                                >
                                  No resources assigned
                                </span>
                              ) : (
                                assignments[inc.id].map((a) => (
                                  <div key={a.id} style={s.assignmentItem}>
                                    <span style={s.assignmentName}>
                                      {RESOURCE_ICONS[a.type] || "📦"} {a.name}
                                    </span>
                                    <button
                                      onClick={() =>
                                        releaseResource(a.id, inc.id)
                                      }
                                      style={s.releaseBtn}
                                    >
                                      Release
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "resources" && (
          <div>
            <div style={s.formCard}>
              <h3 style={s.sectionTitle}>Add New Resource</h3>
              <form onSubmit={createResource} className="inline-form">
                <input
                  style={s.input}
                  placeholder="Resource name"
                  required
                  value={newResource.name}
                  onChange={(e) =>
                    setNewResource((p) => ({ ...p, name: e.target.value }))
                  }
                />
                <select
                  style={s.input}
                  value={newResource.type}
                  onChange={(e) =>
                    setNewResource((p) => ({ ...p, type: e.target.value }))
                  }
                >
                  {[
                    "ambulance",
                    "shelter",
                    "food",
                    "rescue_team",
                    "medical",
                    "fire_brigade",
                  ].map((t) => (
                    <option key={t} value={t}>
                      {t.replace("_", " ")}
                    </option>
                  ))}
                </select>
                <input
                  style={{ ...s.input, width: 80 }}
                  type="number"
                  min={1}
                  value={newResource.quantity}
                  onChange={(e) =>
                    setNewResource((p) => ({ ...p, quantity: e.target.value }))
                  }
                />
                <button type="submit" style={s.addBtn}>
                  + Add Resource
                </button>
              </form>
            </div>
            <h3 style={s.sectionTitle}>All Resources</h3>
            <div className="resource-grid">
              {resources.map((r) => (
                <div key={r.id} style={s.resourceCard}>
                  <div style={s.resourceTop}>
                    <span style={s.resourceIcon}>
                      {RESOURCE_ICONS[r.type] || "📦"}
                    </span>
                    <span
                      style={{
                        ...s.statusDot,
                        background:
                          r.status === "available" ? "#22c55e" : "#f59e0b",
                      }}
                    />
                  </div>
                  <p style={s.resourceName}>{r.name}</p>
                  <p style={s.resourceType}>{r.type.replace("_", " ")}</p>
                  <p style={s.resourceQty}>Qty: {r.quantity}</p>
                  <span
                    style={{
                      ...s.pill,
                      background:
                        r.status === "available" ? "#22c55e" : "#f59e0b",
                      fontSize: 11,
                    }}
                  >
                    {r.status}
                  </span>

                  {r.status === "deployed" && (
                    <button
                      onClick={() => releaseResourceDirect(r.id)}
                      style={s.releaseCardBtn}
                    >
                      Release
                    </button>
                  )}

                  <button
                    onClick={() => deleteResource(r.id)}
                    style={s.deleteBtn}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "alerts" && (
          <div>
            <div style={s.formCard}>
              <h3 style={s.sectionTitle}>Create Manual Alert</h3>
              <form
                onSubmit={createAlert}
                style={{ display: "flex", flexDirection: "column", gap: 8 }}
              >
                <input
                  style={s.input}
                  placeholder="Alert title"
                  required
                  value={newAlert.title}
                  onChange={(e) =>
                    setNewAlert((p) => ({ ...p, title: e.target.value }))
                  }
                />
                <textarea
                  style={{ ...s.input, minHeight: 80, resize: "vertical" }}
                  placeholder="Alert message..."
                  value={newAlert.message}
                  onChange={(e) =>
                    setNewAlert((p) => ({ ...p, message: e.target.value }))
                  }
                />
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <select
                    style={s.input}
                    value={newAlert.severity}
                    onChange={(e) =>
                      setNewAlert((p) => ({ ...p, severity: e.target.value }))
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                  <button type="submit" style={s.addBtn}>
                    Broadcast Alert
                  </button>
                </div>
              </form>
            </div>
            <h3 style={s.sectionTitle}>Active Alerts</h3>
            {alerts.length === 0 && <p style={s.muted}>No active alerts.</p>}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {alerts.map((a) => (
                <div key={a.id} style={s.alertRow}>
                  <div
                    style={{
                      width: 8,
                      borderRadius: 4,
                      alignSelf: "stretch",
                      flexShrink: 0,
                      background:
                        {
                          low: "#22c55e",
                          medium: "#f59e0b",
                          high: "#f97316",
                          critical: "#ef4444",
                        }[a.severity] || "#6b7280",
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span style={s.alertTitle}>{a.title}</span>
                      <span
                        style={{
                          ...s.pill,
                          background: {
                            low: "#22c55e",
                            medium: "#f59e0b",
                            high: "#f97316",
                            critical: "#ef4444",
                          }[a.severity],
                          fontSize: 11,
                        }}
                      >
                        {a.severity}
                      </span>
                      <span style={s.alertSource}>{a.source}</span>
                    </div>
                    <p style={s.alertMsg}>{a.message}</p>
                    <p style={s.alertDate}>
                      {new Date(a.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button onClick={() => deleteAlert(a.id)} style={s.deleteBtn}>
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "users" && (
          <div>
            <h3 style={s.sectionTitle}>All Users</h3>
            <div className="table-wrap">
              <table style={s.table}>
                <thead>
                  <tr>
                    {[
                      "ID",
                      "Name",
                      "Email",
                      "Phone",
                      "Role",
                      "Incidents",
                      "Joined",
                      "Change Role",
                    ].map((h) => (
                      <th key={h} style={s.th}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={s.tr}>
                      <td style={s.td}>#{u.id}</td>
                      <td style={s.td}>{u.name}</td>
                      <td style={s.td}>{u.email}</td>
                      <td style={s.td}>{u.phone || "—"}</td>
                      <td style={s.td}>
                        <span
                          style={{
                            ...s.pill,
                            background:
                              u.role === "admin" ? "#8b5cf6" : "#3b82f6",
                          }}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td style={s.td}>{u.incident_count}</td>
                      <td style={s.td}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td style={s.td}>
                        {u.id !== user.id && (
                          <select
                            value={u.role}
                            onChange={(e) => updateRole(u.id, e.target.value)}
                            style={s.select}
                          >
                            <option value="citizen">Citizen</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {assignModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>Assign Resource</h3>
            <p style={{ margin: "0 0 1rem", fontSize: 13, color: "#6b7280" }}>
              Incident: {assignModal.title}
            </p>
            <select
              style={{ ...s.input, width: "100%", marginBottom: "1rem" }}
              value={selectedResource}
              onChange={(e) => setSelectedResource(e.target.value)}
            >
              <option value="">Select a resource...</option>
              {resources
                .filter((r) => r.status === "available")
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {RESOURCE_ICONS[r.type] || "📦"} {r.name} (qty: {r.quantity}
                    )
                  </option>
                ))}
            </select>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={assignResource} style={s.addBtn}>
                Confirm Assign
              </button>
              <button
                onClick={() => {
                  setAssignModal(null);
                  setSelectedResource("");
                }}
                style={s.cancelBtn}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page:           { minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' },
  loading:        { padding: '2rem', textAlign: 'center', color: '#64748b' },
  sectionTitle:   { fontSize: 15, fontWeight: 700, color: '#f1f5f9', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: 8 },
  statCard:       { background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '1.25rem 1rem', textAlign: 'center', transition: 'all 0.3s ease', cursor: 'default' },
  statValue:      { margin: '0 0 4px', fontSize: 32, fontWeight: 700 },
  statLabel:      { margin: 0, fontSize: 12, color: '#64748b' },
  table:          { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th:             { padding: '12px 14px', background: 'rgba(15,23,42,0.6)', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: 11, letterSpacing: '0.8px', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' },
  tr:             { borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' },
  td:             { padding: '12px 14px', color: '#cbd5e1', verticalAlign: 'top' },
  pill:           { fontSize: 11, padding: '3px 10px', color: '#fff', borderRadius: 20, fontWeight: 600, display: 'inline-block' },
  typePill:       { fontSize: 11, padding: '3px 10px', background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 20, fontWeight: 500 },
  select:         { padding: '5px 8px', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 12, cursor: 'pointer', color: '#e2e8f0', outline: 'none' },
  actionBtn:      { padding: '5px 12px', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 6, cursor: 'pointer', fontSize: 12, transition: 'all 0.2s' },
  assignBtn:      { padding: '6px 12px', background: 'rgba(139,92,246,0.15)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 6, cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap', transition: 'all 0.2s' },
  viewBtn:        { padding: '5px 10px', background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 6, cursor: 'pointer', fontSize: 12, transition: 'all 0.2s' },
  releaseBtn:     { padding: '3px 8px', background: 'rgba(251,146,60,0.1)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.25)', borderRadius: 6, cursor: 'pointer', fontSize: 11, whiteSpace: 'nowrap', transition: 'all 0.2s' },
  assignmentList: { display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 },
  assignmentItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: '5px 10px' },
  assignmentName: { fontSize: 11, color: '#94a3b8', fontWeight: 500 },
  deleteBtn:      { padding: '5px 12px', background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, cursor: 'pointer', fontSize: 12, marginTop: 6, transition: 'all 0.2s' },
  formCard:       { background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem' },
  input:          { padding: '9px 12px', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 14, color: '#e2e8f0', outline: 'none', transition: 'all 0.2s' },
  addBtn:         { padding: '9px 18px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', transition: 'all 0.2s' },
  cancelBtn:      { padding: '9px 18px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, cursor: 'pointer', fontSize: 14, transition: 'all 0.2s' },
  resourceCard:   { background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 6, transition: 'all 0.3s ease' },
  resourceTop:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  resourceIcon:   { fontSize: 28 },
  statusDot:      { width: 10, height: 10, borderRadius: '50%' },
  resourceName:   { margin: 0, fontWeight: 600, fontSize: 14, color: '#f1f5f9' },
  resourceType:   { margin: 0, fontSize: 12, color: '#64748b', textTransform: 'capitalize' },
  resourceQty:    { margin: 0, fontSize: 12, color: '#475569' },
  releaseCardBtn: { padding: '6px 14px', background: 'rgba(251,146,60,0.1)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.25)', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500, marginTop: 4, transition: 'all 0.2s' },
  alertRow:       { background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', gap: 12, alignItems: 'flex-start', transition: 'all 0.2s' },
  alertTitle:     { fontWeight: 600, fontSize: 14, color: '#f1f5f9' },
  alertSource:    { fontSize: 11, color: '#475569' },
  alertMsg:       { margin: '4px 0', fontSize: 13, color: '#94a3b8' },
  alertDate:      { margin: 0, fontSize: 11, color: '#475569' },
  muted:          { color: '#64748b', fontSize: 14 },
};

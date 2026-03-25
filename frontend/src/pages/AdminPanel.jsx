import { useEffect, useState } from 'react';
import { useNavigate }         from 'react-router-dom';
import { useAuth }             from '../context/AuthContext';
import { useSocket }           from '../context/SocketContext';
import api                     from '../api/axios';

const SEVERITY_COLOR = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444' };
const STATUS_COLOR   = { pending: '#f59e0b', active: '#3b82f6', resolved: '#22c55e' };
const STATUS_BG      = { pending: '#fffbeb', active: '#eff6ff', resolved: '#f0fdf4' };
const RESOURCE_ICONS = {
  ambulance: '🚑', shelter: '🏠', food: '🍱', rescue_team: '🪖', medical: '💊', fire_brigade: '🚒',
};

export default function AdminPanel() {
  const [tab, setTab]             = useState('overview');
  const [stats, setStats]         = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [resources, setResources] = useState([]);
  const [users, setUsers]         = useState([]);
  const [alerts, setAlerts]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [newResource, setNewResource] = useState({ name: '', type: 'ambulance', quantity: 1 });
  const [newAlert, setNewAlert]   = useState({ title: '', message: '', severity: 'medium' });
  const [assignModal, setAssignModal] = useState(null);
  const [selectedResource, setSelectedResource] = useState('');
  const { user, logout }          = useAuth();
  const { socket }                = useSocket();
  const navigate                  = useNavigate();

  // Load all data
  const loadData = async () => {
    try {
      const [statsRes, incRes, resRes, usersRes, alertsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/incidents'),
        api.get('/resources'),
        api.get('/admin/users'),
        api.get('/alerts'),
      ]);
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

  useEffect(() => { loadData(); }, []);

  // Socket real-time updates
  useEffect(() => {
    if (!socket) return;
    socket.on('new_incident',     (inc)  => setIncidents(p => [inc, ...p]));
    socket.on('incident_updated', ({ id, status }) =>
      setIncidents(p => p.map(i => i.id === id ? { ...i, status } : i))
    );
    socket.on('resource_assigned', () => loadData());
    socket.on('resource_released', () => loadData());
    return () => {
      socket.off('new_incident');
      socket.off('incident_updated');
      socket.off('resource_assigned');
      socket.off('resource_released');
    };
  }, [socket]);

  // Update incident status
  const updateStatus = async (id, status) => {
    try {
      await api.put(`/incidents/${id}/status`, { status });
      setIncidents(p => p.map(i => i.id === id ? { ...i, status } : i));
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  // Assign resource to incident
  const assignResource = async () => {
    if (!selectedResource) return alert('Select a resource');
    try {
      await api.post('/resources/assign', {
        incident_id: assignModal.id,
        resource_id: selectedResource,
      });
      setAssignModal(null);
      setSelectedResource('');
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign resource');
    }
  };

  // Create resource
  const createResource = async (e) => {
    e.preventDefault();
    try {
      await api.post('/resources', newResource);
      setNewResource({ name: '', type: 'ambulance', quantity: 1 });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create resource');
    }
  };

  // Create manual alert
  const createAlert = async (e) => {
    e.preventDefault();
    try {
      await api.post('/alerts', newAlert);
      setNewAlert({ title: '', message: '', severity: 'medium' });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create alert');
    }
  };

  // Delete alert
  const deleteAlert = async (id) => {
    if (!window.confirm('Delete this alert?')) return;
    try {
      await api.delete(`/alerts/${id}`);
      setAlerts(p => p.filter(a => a.id !== id));
    } catch (err) {
      alert('Failed to delete alert');
    }
  };

  // Delete resource
  const deleteResource = async (id) => {
    if (!window.confirm('Delete this resource?')) return;
    try {
      await api.delete(`/resources/${id}`);
      loadData();
    } catch (err) {
      alert('Failed to delete resource');
    }
  };

  // Update user role
  const updateRole = async (id, role) => {
    try {
      await api.put(`/admin/users/${id}/role`, { role });
      setUsers(p => p.map(u => u.id === id ? { ...u, role } : u));
    } catch (err) {
      alert('Failed to update role');
    }
  };

  if (loading) return <div style={s.loading}>Loading admin panel...</div>;

  const tabs = [
    { key: 'overview',   label: 'Overview' },
    { key: 'incidents',  label: `Incidents (${incidents.length})` },
    { key: 'resources',  label: `Resources (${resources.length})` },
    { key: 'alerts',     label: `Alerts (${alerts.length})` },
    { key: 'users',      label: `Users (${users.length})` },
  ];

  return (
    <div style={s.page}>

      {/* Navbar */}
      <div style={s.navbar}>
        <h2 style={s.brand}>Admin Control Center</h2>
        <div className="navbar-right">
          <button onClick={() => navigate('/dashboard')} style={s.navBtn}>Dashboard</button>
          <button onClick={() => navigate('/map')}       style={s.navBtn}>Live Map</button>
          <span style={s.adminBadge}>ADMIN</span>
          <span style={s.adminName}>{user?.name}</span>
          <button onClick={() => { logout(); navigate('/login'); }} style={s.logoutBtn}>
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {tabs.map(t => (
          <button key={t.key}
            style={{ ...s.tabBtn, ...(tab === t.key ? s.tabActive : {}) }}
            onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="page-content">

        {/* ─── OVERVIEW TAB ─── */}
        {tab === 'overview' && stats && (
          <div>
            <div className="stats-grid">
              {[
                { label: 'Total Incidents', value: stats.incidents.total,    color: '#3b82f6' },
                { label: 'Pending',         value: stats.incidents.pending,  color: '#f59e0b' },
                { label: 'Active',          value: stats.incidents.active,   color: '#ef4444' },
                { label: 'Resolved',        value: stats.incidents.resolved, color: '#22c55e' },
                { label: 'Total Users',     value: stats.users.total,        color: '#8b5cf6' },
                { label: 'Resources',       value: stats.resources.total,    color: '#06b6d4' },
                { label: 'Deployed',        value: stats.resources.deployed, color: '#f97316' },
                { label: 'Active Alerts',   value: stats.alerts.active,      color: '#ef4444' },
              ].map(({ label, value, color }) => (
                <div key={label} style={s.statCard}>
                  <p style={s.statValue(color)}>{value}</p>
                  <p style={s.statLabel}>{label}</p>
                </div>
              ))}
            </div>

            {/* Recent incidents preview */}
            <h3 style={s.sectionTitle}>Recent Incidents</h3>
            <div className="table-wrap">
              <table style={s.table}>
                <thead>
                  <tr>
                    {['Title','Type','Severity','Status','Reporter','Date','Action'].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {incidents.slice(0, 5).map(inc => (
                    <tr key={inc.id} style={s.tr}>
                      <td style={s.td}>{inc.title}</td>
                      <td style={s.td}><span style={s.typePill}>{inc.type}</span></td>
                      <td style={s.td}>
                        <span style={{ ...s.pill, background: SEVERITY_COLOR[inc.severity] }}>
                          {inc.severity}
                        </span>
                      </td>
                      <td style={s.td}>
                        <span style={{ ...s.pill, background: STATUS_COLOR[inc.status] }}>
                          {inc.status}
                        </span>
                      </td>
                      <td style={s.td}>{inc.reporter_name}</td>
                      <td style={s.td}>{new Date(inc.created_at).toLocaleDateString()}</td>
                      <td style={s.td}>
                        <button onClick={() => { setTab('incidents'); }}
                          style={s.actionBtn}>Manage</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── INCIDENTS TAB ─── */}
        {tab === 'incidents' && (
          <div>
            <h3 style={s.sectionTitle}>All Incidents</h3>
            <div className="table-wrap">
              <table style={s.table}>
                <thead>
                  <tr>
                    {['ID','Title','Type','Severity','Status','Reporter','Date','Status Action','Assign'].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {incidents.map(inc => (
                    <tr key={inc.id} style={{ ...s.tr, background: STATUS_BG[inc.status] }}>
                      <td style={s.td}>#{inc.id}</td>
                      <td style={{ ...s.td, maxWidth: 160 }}>{inc.title}</td>
                      <td style={s.td}><span style={s.typePill}>{inc.type}</span></td>
                      <td style={s.td}>
                        <span style={{ ...s.pill, background: SEVERITY_COLOR[inc.severity] }}>
                          {inc.severity}
                        </span>
                      </td>
                      <td style={s.td}>
                        <span style={{ ...s.pill, background: STATUS_COLOR[inc.status] }}>
                          {inc.status}
                        </span>
                      </td>
                      <td style={s.td}>{inc.reporter_name}</td>
                      <td style={s.td}>{new Date(inc.created_at).toLocaleDateString()}</td>
                      <td style={s.td}>
                        <select
                          value={inc.status}
                          onChange={e => updateStatus(inc.id, e.target.value)}
                          style={s.select}>
                          <option value="pending">Pending</option>
                          <option value="active">Active</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </td>
                      <td style={s.td}>
                        {inc.status !== 'resolved' && (
                          <button onClick={() => setAssignModal(inc)} style={s.assignBtn}>
                            Assign
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── RESOURCES TAB ─── */}
        {tab === 'resources' && (
          <div>
            {/* Add Resource Form */}
            <div style={s.formCard}>
              <h3 style={s.sectionTitle}>Add New Resource</h3>
              <form onSubmit={createResource} className="inline-form">
                <input style={s.input} placeholder="Resource name" required
                  value={newResource.name}
                  onChange={e => setNewResource(p => ({ ...p, name: e.target.value }))} />
                <select style={s.input} value={newResource.type}
                  onChange={e => setNewResource(p => ({ ...p, type: e.target.value }))}>
                  {['ambulance','shelter','food','rescue_team','medical','fire_brigade'].map(t => (
                  <option key={t} value={t}>{t.replace('_', ' ')}</option>))}
                </select>
                <input style={{ ...s.input, width: 80 }} type="number" min={1}
                  value={newResource.quantity}
                  onChange={e => setNewResource(p => ({ ...p, quantity: e.target.value }))} />
                <button type="submit" style={s.addBtn}>+ Add Resource</button>
              </form>
            </div>

            {/* Resources List */}
            <h3 style={s.sectionTitle}>All Resources</h3>
            <div className="resource-grid">
              {resources.map(r => (
                <div key={r.id} style={s.resourceCard}>
                  <div style={s.resourceTop}>
                    <span style={s.resourceIcon}>{RESOURCE_ICONS[r.type]}</span>
                    <span style={{
                      ...s.statusDot,
                      background: r.status === 'available' ? '#22c55e' : '#f59e0b'
                    }}/>
                  </div>
                  <p style={s.resourceName}>{r.name}</p>
                  <p style={s.resourceType}>{r.type.replace('_', ' ')}</p>
                  <p style={s.resourceQty}>Qty: {r.quantity}</p>
                  <span style={{
                    ...s.pill,
                    background: r.status === 'available' ? '#22c55e' : '#f59e0b',
                    fontSize: 11,
                  }}>
                    {r.status}
                  </span>
                  <button onClick={() => deleteResource(r.id)} style={s.deleteBtn}>
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── ALERTS TAB ─── */}
        {tab === 'alerts' && (
          <div>
            {/* Create Alert Form */}
            <div style={s.formCard}>
              <h3 style={s.sectionTitle}>Create Manual Alert</h3>
              <form onSubmit={createAlert} style={s.alertForm}>
                <input style={s.input} placeholder="Alert title" required
                  value={newAlert.title}
                  onChange={e => setNewAlert(p => ({ ...p, title: e.target.value }))} />
                <textarea style={{ ...s.input, minHeight: 80, resize: 'vertical' }}
                  placeholder="Alert message..."
                  value={newAlert.message}
                  onChange={e => setNewAlert(p => ({ ...p, message: e.target.value }))} />
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select style={s.input} value={newAlert.severity}
                    onChange={e => setNewAlert(p => ({ ...p, severity: e.target.value }))}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                  <button type="submit" style={s.addBtn}>Broadcast Alert</button>
                </div>
              </form>
            </div>

            {/* Alerts List */}
            <h3 style={s.sectionTitle}>Active Alerts</h3>
            {alerts.length === 0 && <p style={s.muted}>No active alerts.</p>}
            <div style={s.alertsList}>
              {alerts.map(a => (
                <div key={a.id} style={s.alertRow}>
                  <div style={{
                    width: 8, borderRadius: 4, alignSelf: 'stretch', flexShrink: 0,
                    background: SEVERITY_COLOR[a.severity] || '#6b7280',
                  }}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={s.alertTitle}>{a.title}</span>
                      <span style={{ ...s.pill, background: SEVERITY_COLOR[a.severity], fontSize: 11 }}>
                        {a.severity}
                      </span>
                      <span style={s.alertSource}>{a.source}</span>
                    </div>
                    <p style={s.alertMsg}>{a.message}</p>
                    <p style={s.alertDate}>{new Date(a.created_at).toLocaleString()}</p>
                  </div>
                  <button onClick={() => deleteAlert(a.id)} style={s.deleteBtn}>
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── USERS TAB ─── */}
        {tab === 'users' && (
          <div>
            <h3 style={s.sectionTitle}>All Users</h3>
            <div className="table-wrap">
              <table style={s.table}>
                <thead>
                  <tr>
                    {['ID','Name','Email','Phone','Role','Incidents','Joined','Change Role'].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={s.tr}>
                      <td style={s.td}>#{u.id}</td>
                      <td style={s.td}>{u.name}</td>
                      <td style={s.td}>{u.email}</td>
                      <td style={s.td}>{u.phone || '—'}</td>
                      <td style={s.td}>
                        <span style={{
                          ...s.pill,
                          background: u.role === 'admin' ? '#8b5cf6' : '#3b82f6',
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={s.td}>{u.incident_count}</td>
                      <td style={s.td}>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td style={s.td}>
                        {u.id !== user.id && (
                          <select value={u.role}
                            onChange={e => updateRole(u.id, e.target.value)}
                            style={s.select}>
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

      {/* ─── ASSIGN RESOURCE MODAL ─── */}
      {assignModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>Assign Resource</h3>
            <p style={{ margin: '0 0 1rem', fontSize: 13, color: '#6b7280' }}>
              Incident: {assignModal.title}
            </p>
            <select style={{ ...s.input, width: '100%', marginBottom: '1rem' }}
              value={selectedResource}
              onChange={e => setSelectedResource(e.target.value)}>
              <option value="">Select a resource...</option>
              {resources
                .filter(r => r.status === 'available')
                .map(r => (
                  <option key={r.id} value={r.id}>
                    {RESOURCE_ICONS[r.type]} {r.name} (qty: {r.quantity})
                  </option>
                ))}
            </select>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={assignResource} style={s.addBtn}>Confirm Assign</button>
              <button onClick={() => { setAssignModal(null); setSelectedResource(''); }}
                style={s.cancelBtn}>
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
  page:         { minHeight: '100vh', background: '#f3f4f6' },
  loading:      { padding: '2rem', textAlign: 'center', color: '#6b7280' },
  navbar:       { background: '#1e1b4b', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  brand:        { margin: 0, fontSize: 17, fontWeight: 600, color: '#fff' },
  navRight:     { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  navBtn:       { padding: '6px 12px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
  adminBadge:   { background: '#7c3aed', color: '#fff', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  adminName:    { color: '#c7d2fe', fontSize: 13 },
  logoutBtn:    { padding: '6px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
  tabBar:       { background: '#fff', padding: '0 1.5rem', display: 'flex', gap: 4, borderBottom: '1px solid #e5e7eb', overflowX: 'auto' },
  tabBtn:       { padding: '12px 16px', background: 'none', border: 'none', borderBottom: '2px solid transparent', cursor: 'pointer', fontSize: 14, color: '#6b7280', whiteSpace: 'nowrap' },
  tabActive:    { borderBottomColor: '#3b82f6', color: '#1e40af', fontWeight: 600 },
  content:      { maxWidth: 1200, margin: '0 auto', padding: '1.5rem 1rem' },
  statsGrid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '2rem' },
  statCard:     { background: '#fff', borderRadius: 10, padding: '1rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  statValue:    (c) => ({ margin: '0 0 4px', fontSize: 32, fontWeight: 700, color: c }),
  statLabel:    { margin: 0, fontSize: 12, color: '#6b7280' },
  sectionTitle: { fontSize: 15, fontWeight: 600, color: '#111', margin: '0 0 1rem' },
  tableWrap:    { overflowX: 'auto', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  table:        { width: '100%', borderCollapse: 'collapse', background: '#fff', fontSize: 13 },
  th:           { padding: '10px 12px', background: '#f8fafc', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' },
  tr:           { borderBottom: '1px solid #f1f5f9' },
  td:           { padding: '10px 12px', color: '#374151', verticalAlign: 'middle' },
  pill:         { fontSize: 11, padding: '2px 8px', color: '#fff', borderRadius: 10, fontWeight: 500, display: 'inline-block' },
  typePill:     { fontSize: 11, padding: '2px 8px', background: '#e0f2fe', color: '#0369a1', borderRadius: 10, fontWeight: 500 },
  select:       { padding: '5px 8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12, cursor: 'pointer' },
  actionBtn:    { padding: '4px 10px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 },
  assignBtn:    { padding: '4px 10px', background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 },
  deleteBtn:    { padding: '4px 10px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: 6, cursor: 'pointer', fontSize: 12, marginTop: 6 },
  formCard:     { background: '#fff', borderRadius: 10, padding: '1.25rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  inlineForm:   { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  alertForm:    { display: 'flex', flexDirection: 'column', gap: 8 },
  input:        { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none' },
  addBtn:       { padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap' },
  cancelBtn:    { padding: '8px 16px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
  resourceGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' },
  resourceCard: { background: '#fff', borderRadius: 10, padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 4 },
  resourceTop:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  resourceIcon: { fontSize: 28 },
  statusDot:    { width: 10, height: 10, borderRadius: '50%' },
  resourceName: { margin: 0, fontWeight: 600, fontSize: 14, color: '#111' },
  resourceType: { margin: 0, fontSize: 12, color: '#6b7280', textTransform: 'capitalize' },
  resourceQty:  { margin: 0, fontSize: 12, color: '#9ca3af' },
  alertsList:   { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  alertRow:     { background: '#fff', borderRadius: 10, padding: '1rem', display: 'flex', gap: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', alignItems: 'flex-start' },
  alertTitle:   { fontWeight: 600, fontSize: 14, color: '#111' },
  alertSource:  { fontSize: 11, color: '#9ca3af' },
  alertMsg:     { margin: '4px 0', fontSize: 13, color: '#6b7280' },
  alertDate:    { margin: 0, fontSize: 11, color: '#9ca3af' },
  muted:        { color: '#6b7280', fontSize: 14 },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:        { background: '#fff', borderRadius: 12, padding: '1.5rem', width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
};
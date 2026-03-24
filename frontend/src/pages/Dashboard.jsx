import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const severityColor = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444' };
const statusColor   = { pending: '#f59e0b', active: '#3b82f6', resolved: '#22c55e' };

export default function Dashboard() {
  const { user, logout }      = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate              = useNavigate();

  useEffect(() => {
    api.get('/incidents/my')
      .then(res => setIncidents(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={s.page}>
      <div style={s.navbar}>
        <h2 style={s.brand}>Disaster Management</h2>
        <div style={s.navRight}>
          <span style={s.welcome}>Hello, {user?.name}</span>
          <button onClick={() => navigate('/report')} style={s.reportBtn}>Report Incident</button>
          <button onClick={() => navigate('/map')} style={s.mapBtn}>View Map</button>
          <button onClick={handleLogout} style={s.logoutBtn}>Logout</button>
        </div>
      </div>

      <div style={s.content}>
        <h3 style={s.sectionTitle}>My Reported Incidents</h3>

        {loading && <p style={{ color: '#6b7280' }}>Loading...</p>}

        {!loading && incidents.length === 0 && (
          <div style={s.empty}>
            <p>You haven't reported any incidents yet.</p>
            <button onClick={() => navigate('/report')} style={s.reportBtn}>
              Report Your First Incident
            </button>
          </div>
        )}

        <div style={s.grid}>
          {incidents.map(inc => (
            <div key={inc.id} style={s.card}>
              {inc.image_url && (
                <img src={`${import.meta.env.VITE_BACKEND_URL}${inc.image_url}`}
                  alt="incident" style={s.img} />
              )}
              <div style={s.cardBody}>
                <div style={s.cardTop}>
                  <span style={s.incType}>{inc.type}</span>
                  <span style={{ ...s.badge, background: severityColor[inc.severity] }}>
                    {inc.severity}
                  </span>
                  <span style={{ ...s.badge, background: statusColor[inc.status] }}>
                    {inc.status}
                  </span>
                </div>
                <h4 style={s.incTitle}>{inc.title}</h4>
                {inc.description && <p style={s.incDesc}>{inc.description}</p>}
                <p style={s.incDate}>{new Date(inc.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const s = {
  page:        { minHeight: '100vh', background: '#f3f4f6' },
  navbar:      { background: '#fff', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  brand:       { margin: 0, fontSize: 18, fontWeight: 600, color: '#1e40af' },
  navRight:    { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  welcome:     { fontSize: 14, color: '#6b7280' },
  reportBtn:   { padding: '8px 14px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500 },
  mapBtn:      { padding: '8px 14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500 },
  logoutBtn:   { padding: '8px 14px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
  content:     { padding: '2rem', maxWidth: 1100, margin: '0 auto' },
  sectionTitle:{ fontSize: 18, fontWeight: 600, color: '#111', marginBottom: '1rem' },
  empty:       { textAlign: 'center', padding: '3rem', color: '#6b7280' },
  grid:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' },
  card:        { background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  img:         { width: '100%', height: 160, objectFit: 'cover' },
  cardBody:    { padding: '1rem' },
  cardTop:     { display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  incType:     { fontSize: 11, padding: '2px 8px', background: '#e0f2fe', color: '#0369a1', borderRadius: 10, fontWeight: 500 },
  badge:       { fontSize: 11, padding: '2px 8px', color: '#fff', borderRadius: 10, fontWeight: 500 },
  incTitle:    { margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: '#111' },
  incDesc:     { margin: '0 0 8px', fontSize: 13, color: '#6b7280', lineHeight: 1.5 },
  incDate:     { margin: 0, fontSize: 11, color: '#9ca3af' },
};
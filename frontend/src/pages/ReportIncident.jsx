import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function ReportIncident() {
  const [form, setForm]       = useState({ title: '', description: '', type: 'flood', severity: 'medium' });
  const [image, setImage]     = useState(null);
  const [locating, setLocating] = useState(false);
  const [location, setLocation] = useState(null);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const navigate              = useNavigate();

  const getLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => { setError('Could not get location. Please allow location access.'); setLocating(false); }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!location) return setError('Please detect your location first');
    setError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('title',       form.title);
    formData.append('description', form.description);
    formData.append('type',        form.type);
    formData.append('severity',    form.severity);
    formData.append('lat',         location.lat);
    formData.append('lng',         location.lng);
    if (image) formData.append('image', image);

    try {
      await api.post('/incidents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h2 style={s.title}>Report an Incident</h2>

        {error && <div style={s.err}>{error}</div>}

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Title</label>
            <input style={s.input} placeholder="e.g. Flood in Sector 4" required
              value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          </div>

          <div style={s.row}>
            <div style={{ ...s.field, flex: 1 }}>
              <label style={s.label}>Type</label>
              <select style={s.input} value={form.type}
                onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                {['flood','fire','earthquake','landslide','cyclone','other'].map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div style={{ ...s.field, flex: 1 }}>
              <label style={s.label}>Severity</label>
              <select style={s.input} value={form.severity}
                onChange={e => setForm(p => ({ ...p, severity: e.target.value }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div style={s.field}>
            <label style={s.label}>Description</label>
            <textarea style={{ ...s.input, minHeight: 100, resize: 'vertical' }}
              placeholder="Describe the situation..."
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>

          <div style={s.field}>
            <label style={s.label}>Location</label>
            <button type="button" onClick={getLocation} style={s.locBtn} disabled={locating}>
              {locating ? 'Detecting...' : location ? 'Location Detected' : 'Detect My Location'}
            </button>
            {location && (
              <p style={s.locText}>
                Lat: {location.lat.toFixed(5)}, Lng: {location.lng.toFixed(5)}
              </p>
            )}
          </div>

          <div style={s.field}>
            <label style={s.label}>Photo (optional)</label>
            <input type="file" accept="image/*"
              onChange={e => setImage(e.target.files[0])}
              style={{ fontSize: 14 }} />
          </div>

          <div style={s.row}>
            <button type="button" onClick={() => navigate('/dashboard')} style={s.cancelBtn}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={s.btn}>
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const s = {
  page:      { minHeight: '100vh', background: '#f3f4f6', padding: '2rem 1rem', display: 'flex', justifyContent: 'center' },
  card:      { background: '#fff', borderRadius: 12, padding: '2rem', width: '100%', maxWidth: 560, height: 'fit-content', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' },
  title:     { margin: '0 0 1.5rem', fontSize: 20, fontWeight: 600, color: '#111' },
  err:       { background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '10px', borderRadius: 8, fontSize: 14, marginBottom: '1rem' },
  form:      { display: 'flex', flexDirection: 'column', gap: '1rem' },
  field:     { display: 'flex', flexDirection: 'column', gap: 6 },
  row:       { display: 'flex', gap: '1rem' },
  label:     { fontSize: 14, fontWeight: 500, color: '#374151' },
  input:     { padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none' },
  locBtn:    { padding: '10px', background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
  locText:   { margin: '4px 0 0', fontSize: 12, color: '#6b7280', fontFamily: 'monospace' },
  btn:       { flex: 1, padding: '11px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 500, cursor: 'pointer' },
  cancelBtn: { flex: 1, padding: '11px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15, cursor: 'pointer' },
};
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Register() {
  const [form, setForm]       = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { login }             = useAuth();
  const navigate              = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>Create Account</h1>
        <p style={s.sub}>Join the disaster response network</p>
        {error && <div style={s.err}>{error}</div>}
        <form onSubmit={handleSubmit} style={s.form}>
          {[
            { key: 'name',     type: 'text',     ph: 'Full Name' },
            { key: 'email',    type: 'email',    ph: 'Email' },
            { key: 'phone',    type: 'tel',      ph: 'Phone (optional)' },
            { key: 'password', type: 'password', ph: 'Password (min 6 chars)' },
          ].map(({ key, type, ph }) => (
            <input key={key} style={s.input} type={type} placeholder={ph}
              value={form[key]} required={key !== 'phone'}
              onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
          ))}
          <button style={s.btn} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p style={s.foot}>Have an account? <Link to="/login" style={s.link}>Sign in</Link></p>
      </div>
    </div>
  );
}

const s = {
  page:  { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' },
  card:  { background: '#fff', borderRadius: 12, padding: '2rem', width: '100%', maxWidth: 400, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' },
  title: { margin: 0, fontSize: 22, fontWeight: 600, color: '#111', textAlign: 'center' },
  sub:   { textAlign: 'center', color: '#6b7280', fontSize: 14, marginBottom: '1.5rem' },
  err:   { background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '10px', borderRadius: 8, fontSize: 14, marginBottom: '1rem' },
  form:  { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  input: { padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none' },
  btn:   { padding: '11px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 500, cursor: 'pointer' },
  foot:  { textAlign: 'center', marginTop: '1rem', fontSize: 14, color: '#6b7280' },
  link:  { color: '#2563eb', textDecoration: 'none' },
};
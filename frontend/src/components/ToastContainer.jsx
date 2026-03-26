import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

const TOAST_COLORS = {
  success: { bg: '#f0fdf4', border: '#86efac', color: '#166534' },
  error:   { bg: '#fef2f2', border: '#fca5a5', color: '#991b1b' },
  warning: { bg: '#fffbeb', border: '#fcd34d', color: '#92400e' },
  info:    { bg: '#eff6ff', border: '#93c5fd', color: '#1e40af' },
};

// Global toast function — call from anywhere
let addToastGlobal = null;
export const showToast = (message, type = 'info', duration = 4000) => {
  if (addToastGlobal) addToastGlobal(message, type, duration);
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  const { socket }          = useSocket();

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  // Register global function
  useEffect(() => {
    addToastGlobal = addToast;
    return () => { addToastGlobal = null; };
  }, [addToast]);

  // Listen to socket events and show toasts
  useEffect(() => {
    if (!socket) return;

    socket.on('new_incident', (inc) => {
      addToast(`New incident: ${inc.title}`, 'warning');
    });
    socket.on('incident_updated', ({ status }) => {
      addToast(`Incident status → ${status}`, 'info');
    });
    socket.on('new_alert', (alert) => {
      addToast(`Alert: ${alert.title}`, 'error', 6000);
    });
    socket.on('resource_assigned', () => {
      addToast('Resource assigned to incident', 'success');
    });

    return () => {
      socket.off('new_incident');
      socket.off('incident_updated');
      socket.off('new_alert');
      socket.off('resource_assigned');
    };
  }, [socket, addToast]);

  if (!toasts.length) return null;

  return (
    <div style={{
      position:  'fixed',
      bottom:    24,
      right:     24,
      zIndex:    9999,
      display:   'flex',
      flexDirection: 'column',
      gap:       8,
      maxWidth:  320,
    }}>
      {toasts.map(toast => {
        const c = TOAST_COLORS[toast.type] || TOAST_COLORS.info;
        return (
          <div key={toast.id} style={{
            background:    c.bg,
            border:        `1px solid ${c.border}`,
            borderLeft:    `4px solid ${c.border}`,
            borderRadius:  8,
            padding:       '10px 14px',
            fontSize:      13,
            color:         c.color,
            boxShadow:     '0 4px 12px rgba(0,0,0,0.1)',
            animation:     'slideIn 0.2s ease',
            display:       'flex',
            alignItems:    'center',
            justifyContent:'space-between',
            gap:           8,
          }}>
            <span>{toast.message}</span>
            <button
              onClick={() => setToasts(p => p.filter(t => t.id !== toast.id))}
              style={{
                background: 'none', border: 'none',
                cursor: 'pointer', color: c.color,
                fontSize: 16, lineHeight: 1, flexShrink: 0,
              }}>×</button>
          </div>
        );
      })}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
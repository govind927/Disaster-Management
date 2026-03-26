import { useSocket } from '../context/SocketContext';

export default function LiveStatusBar() {
  const { connected, onlineUsers } = useSocket();

  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      gap:            12,
      padding:        '4px 1.5rem',
      background:     connected ? '#f0fdf4' : '#fef2f2',
      borderBottom:   `1px solid ${connected ? '#86efac' : '#fca5a5'}`,
      fontSize:       12,
      color:          connected ? '#166534' : '#991b1b',
    }}>
      {/* Pulsing live dot */}
      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{
          width:        8,
          height:       8,
          borderRadius: '50%',
          background:   connected ? '#22c55e' : '#ef4444',
          display:      'inline-block',
          animation:    connected ? 'pulse 2s infinite' : 'none',
        }}/>
        {connected ? 'Live' : 'Reconnecting...'}
      </span>
      {connected && (
        <span style={{ color: '#4b7c60' }}>
          {onlineUsers} user{onlineUsers !== 1 ? 's' : ''} online
        </span>
      )}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const socketRef             = useRef(null);
  const [connected, setConnected]     = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_SOCKET_URL, {
      transports: ['websocket'],
      reconnection:      true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socketRef.current.on('connect', () => {
      setConnected(true);
      // Join personal room after connecting
      if (user?.id) {
        socketRef.current.emit('join_user_room', user.id);
      }
      // Admin joins admin room
      if (user?.role === 'admin') {
        socketRef.current.emit('join_admin_room');
      }
    });

    socketRef.current.on('disconnect', () => setConnected(false));
    socketRef.current.on('users_online', (count) => setOnlineUsers(count));

    return () => socketRef.current?.disconnect();
  }, [user]);

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      connected,
      onlineUsers,
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
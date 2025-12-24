// contexts/SocketContext.tsx
import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextValue {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextValue>({ socket: null });

interface SocketProviderProps {
  children: ReactNode;
  userId: string;
  token: string;
}

export const SocketProvider = ({ children, userId, token }: SocketProviderProps) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Tạo 1 socket connection duy nhất
    const socket = io('http://localhost:5000', {
      transports: ['websocket'],
      autoConnect: true,
      auth: { token },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Connected to socket server');
      // Authenticate cho cả chat và notifications
      socket.emit('authenticate', userId);
      socket.emit('join', userId);
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from socket server');
    });

    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    return () => {
      socket.disconnect();
    };
  }, [userId, token]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within SocketProvider');
  }
  return context;
};
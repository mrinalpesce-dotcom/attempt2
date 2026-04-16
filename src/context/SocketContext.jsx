import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

const SOCKET_URL = 'http://localhost:5000';

export function SocketProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const [clientCount, setClientCount] = useState(0);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [liveThreats, setLiveThreats] = useState([]);
  const [liveStats, setLiveStats] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('🔌 WebSocket connected');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('🔌 WebSocket disconnected');
    });

    socket.on('connected', (data) => {
      console.log('🛡️ Server:', data.message);
    });

    socket.on('clientCount', (count) => {
      setClientCount(count);
    });

    socket.on('liveAlert', (alert) => {
      setLiveAlerts((prev) => [alert, ...prev].slice(0, 50));
    });

    socket.on('liveThreat', (threat) => {
      setLiveThreats((prev) => [threat, ...prev].slice(0, 30));
    });

    socket.on('statsUpdate', (stats) => {
      setLiveStats(stats);
    });

    socket.on('newAlert', (alert) => {
      setLiveAlerts((prev) => [alert, ...prev].slice(0, 50));
    });

    socket.on('simulationStarted', (sim) => {
      console.log('🚀 Simulation started:', sim.name);
    });

    socket.on('simulationCompleted', (sim) => {
      console.log('✅ Simulation completed:', sim.name);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const value = {
    socket: socketRef.current,
    isConnected,
    clientCount,
    liveAlerts,
    liveThreats,
    liveStats,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

export default SocketContext;

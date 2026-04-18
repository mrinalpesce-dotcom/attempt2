import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

const SOCKET_URL = 'http://localhost:5000';

export function SocketProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const [clientCount, setClientCount] = useState(0);

  // Dashboard
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [liveThreats, setLiveThreats] = useState([]);
  const [liveStats, setLiveStats] = useState(null);

  // System Metrics (LiveMonitor + Admin)
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [networkActivity, setNetworkActivity] = useState([]);

  // Logs
  const [liveLogs, setLiveLogs] = useState([]);

  // Reports
  const [reportData, setReportData] = useState(null);

  // MITRE
  const [mitreCounts, setMitreCounts] = useState(null);

  // Playbooks
  const [playbookProgress, setPlaybookProgress] = useState({});

  // Simulations
  const [simulationProgress, setSimulationProgress] = useState(null);

  // Admin Audit
  const [auditLogs, setAuditLogs] = useState([]);

  // Brute Force
  const [bruteForceState, setBruteForceState] = useState(null);

  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    // ── Connection Events ──
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

    // ── Dashboard Events ──
    socket.on('liveAlert', (alert) => {
      setLiveAlerts((prev) => [alert, ...prev].slice(0, 50));
    });

    socket.on('newAlert', (alert) => {
      setLiveAlerts((prev) => [alert, ...prev].slice(0, 50));
    });

    socket.on('liveThreat', (threat) => {
      setLiveThreats((prev) => [threat, ...prev].slice(0, 30));
    });

    socket.on('statsUpdate', (stats) => {
      setLiveStats(stats);
    });

    socket.on('alertUpdated', (alert) => {
      setLiveAlerts((prev) =>
        prev.map((a) => (a._id === alert._id ? alert : a))
      );
    });

    socket.on('alertDeleted', (id) => {
      setLiveAlerts((prev) => prev.filter((a) => a._id !== id));
    });

    // ── Initial Data ──
    socket.on('initialAlerts', (alerts) => {
      setLiveAlerts((prev) => [...alerts, ...prev].slice(0, 50));
    });

    socket.on('initialThreats', (threats) => {
      setLiveThreats((prev) => [...threats, ...prev].slice(0, 30));
    });

    socket.on('initialLogs', (logs) => {
      setLiveLogs((prev) => [...logs, ...prev].slice(0, 200));
    });

    // ── System Metrics (LiveMonitor + Admin) ──
    socket.on('systemMetrics', (metrics) => {
      setSystemMetrics(metrics);
    });

    socket.on('networkActivity', (data) => {
      setNetworkActivity((prev) => [...prev, data].slice(-60));
    });

    // ── Live Logs ──
    socket.on('liveLog', (log) => {
      setLiveLogs((prev) => [log, ...prev].slice(0, 200));
    });

    // ── Reports ──
    socket.on('reportData', (data) => {
      setReportData(data);
    });

    // ── MITRE ──
    socket.on('mitreCounts', (counts) => {
      setMitreCounts(counts);
    });

    // ── Playbook Events ──
    socket.on('playbookStarted', (data) => {
      setPlaybookProgress((prev) => ({
        ...prev,
        [data.playbookId]: { ...data, steps: [], progress: 0 },
      }));
    });

    socket.on('playbookStepComplete', (data) => {
      setPlaybookProgress((prev) => ({
        ...prev,
        [data.playbookId]: {
          ...prev[data.playbookId],
          ...data,
          status: 'running',
        },
      }));
    });

    socket.on('playbookCompleted', (data) => {
      setPlaybookProgress((prev) => ({
        ...prev,
        [data.playbookId]: { ...prev[data.playbookId], ...data, status: 'completed' },
      }));
    });

    // ── Simulation Events ──
    socket.on('simulationStarted', (sim) => {
      setSimulationProgress({ ...sim, progress: 0, phase: 'Starting...' });
      console.log('🚀 Simulation started:', sim.name);
    });

    socket.on('simulationProgress', (data) => {
      setSimulationProgress((prev) => ({ ...prev, ...data }));
    });

    socket.on('simulationCompleted', (sim) => {
      setSimulationProgress({ ...sim, progress: 100, phase: 'Completed' });
      console.log('✅ Simulation completed:', sim.name);
    });

    // ── Admin Audit Logs ──
    socket.on('auditLog', (entry) => {
      setAuditLogs((prev) => [entry, ...prev].slice(0, 100));
    });

    // ── Brute Force Events ──
    socket.on('bruteForceStarted', (data) => {
      setBruteForceState({ ...data, status: 'running', attempts: [] });
    });

    socket.on('bruteForceAttempt', (data) => {
      setBruteForceState((prev) => ({
        ...prev,
        ...data,
        status: 'running',
      }));
    });

    socket.on('bruteForceComplete', (data) => {
      setBruteForceState((prev) => ({
        ...prev,
        ...data,
        status: 'completed',
      }));
    });

    // ── IP Blocking Events ──
    socket.on('ipBlocked', (data) => {
      console.log('🚫 IP Blocked:', data.ip);
    });

    socket.on('ipUnblocked', (ip) => {
      console.log('✅ IP Unblocked:', ip);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Helper to emit events
  const emit = useCallback((event, data) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const value = {
    socket: socketRef.current,
    isConnected,
    clientCount,
    emit,

    // Dashboard
    liveAlerts,
    liveThreats,
    liveStats,

    // System Metrics
    systemMetrics,
    networkActivity,

    // Logs
    liveLogs,

    // Reports
    reportData,

    // MITRE
    mitreCounts,

    // Playbooks
    playbookProgress,

    // Simulations
    simulationProgress,

    // Admin
    auditLogs,

    // Brute Force
    bruteForceState,
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

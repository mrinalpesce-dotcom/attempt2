import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// Hardcoded admin credentials for demonstration
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'CyberShield@2026',
  role: 'Super Admin',
  name: 'Security Admin',
  email: 'admin@cybershield.io',
};

// Simulated user database
const USERS_DB = [
  { id: 1, username: 'admin', name: 'Security Admin', email: 'admin@cybershield.io', role: 'Super Admin', status: 'active', lastLogin: '2026-04-16T01:45:00Z', loginCount: 342 },
  { id: 2, username: 'analyst1', name: 'Sarah Chen', email: 'sarah@cybershield.io', role: 'Security Analyst', status: 'active', lastLogin: '2026-04-15T22:30:00Z', loginCount: 187 },
  { id: 3, username: 'analyst2', name: 'James Wilson', email: 'james@cybershield.io', role: 'SOC Analyst', status: 'active', lastLogin: '2026-04-15T18:15:00Z', loginCount: 156 },
  { id: 4, username: 'engineer1', name: 'Priya Sharma', email: 'priya@cybershield.io', role: 'Threat Engineer', status: 'active', lastLogin: '2026-04-14T09:00:00Z', loginCount: 98 },
  { id: 5, username: 'viewer', name: 'Mike Johnson', email: 'mike@cybershield.io', role: 'Read Only', status: 'suspended', lastLogin: '2026-04-10T14:22:00Z', loginCount: 45 },
  { id: 6, username: 'intern1', name: 'Aiko Tanaka', email: 'aiko@cybershield.io', role: 'Intern', status: 'active', lastLogin: '2026-04-16T00:05:00Z', loginCount: 23 },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState([]);
  const [users] = useState(USERS_DB);

  useEffect(() => {
    const stored = localStorage.getItem('cybershield_auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem('cybershield_auth');
      }
    }
  }, []);

  const login = (username, password) => {
    const attempt = {
      username,
      timestamp: new Date().toISOString(),
      ip: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
    };

    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      const userData = {
        username: ADMIN_CREDENTIALS.username,
        name: ADMIN_CREDENTIALS.name,
        email: ADMIN_CREDENTIALS.email,
        role: ADMIN_CREDENTIALS.role,
        loginTime: new Date().toISOString(),
      };
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('cybershield_auth', JSON.stringify(userData));
      setLoginAttempts(prev => [...prev, { ...attempt, success: true }]);
      return { success: true };
    }

    setLoginAttempts(prev => [...prev, { ...attempt, success: false }]);
    return { success: false, error: 'Invalid credentials' };
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('cybershield_auth');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, loginAttempts, users }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

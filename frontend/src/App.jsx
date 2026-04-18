import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import AlertsPage from './pages/AlertsPage';
import LiveMonitorPage from './pages/LiveMonitorPage';
import ThreatMapPage from './pages/ThreatMapPage';
import SimulationPage from './pages/SimulationPage';
import PlaybooksPage from './pages/PlaybooksPage';
import ReportsPage from './pages/ReportsPage';
import MitrePage from './pages/MitrePage';
import SettingsPage from './pages/SettingsPage';
import LogsPage from './pages/LogsPage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import BruteForcePage from './pages/BruteForcePage';
import PreventionPage from './pages/PreventionPage';
import { useAuth } from './context/AuthContext';

function App() {
  const { isAuthenticated } = useAuth();
  const [activePage, setActivePage] = useState('overview');
  const [activeHeaderTab, setActiveHeaderTab] = useState('dashboard');

  // If not authenticated, show login page
  if (!isAuthenticated) {
    return <LoginPage onLogin={() => {}} />;
  }

  const handleNavClick = (page) => {
    setActivePage(page);
    const tabMap = {
      overview: 'dashboard',
      livemonitor: 'dashboard',
      threatmap: 'dashboard',
      simulation: 'simulation',
      playbooks: 'dashboard',
      reports: 'reports',
      mitre: 'dashboard',
      settings: 'settings',
      logs: 'dashboard',
      admin: 'settings',
      bruteforce: 'simulation',
      prevention: 'dashboard',
    };
    setActiveHeaderTab(tabMap[page] || 'dashboard');
  };

  const handleHeaderTabClick = (tab) => {
    setActiveHeaderTab(tab);
    const pageMap = {
      dashboard: 'overview',
      alerts: 'alerts',
      simulation: 'simulation',
      reports: 'reports',
      settings: 'settings',
    };
    setActivePage(pageMap[tab] || 'overview');
  };

  const renderPage = () => {
    switch (activePage) {
      case 'overview':
        return <Dashboard />;
      case 'livemonitor':
        return <LiveMonitorPage />;
      case 'threatmap':
        return <ThreatMapPage />;
      case 'simulation':
        return <SimulationPage />;
      case 'playbooks':
        return <PlaybooksPage />;
      case 'reports':
        return <ReportsPage />;
      case 'mitre':
        return <MitrePage />;
      case 'settings':
        return <SettingsPage />;
      case 'alerts':
        return <AlertsPage />;
      case 'logs':
        return <LogsPage />;
      case 'admin':
        return <AdminPage />;
      case 'bruteforce':
        return <BruteForcePage />;
      case 'prevention':
        return <PreventionPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} onNavClick={handleNavClick} />
      <div className="main-content">
        <Header activeTab={activeHeaderTab} onTabClick={handleHeaderTabClick} />
        <div className="page-content">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}

export default App;

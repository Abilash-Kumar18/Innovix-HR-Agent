
import React, { useState } from 'react';
import { UserRole } from './types';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import HRDashboard from './pages/HRDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'LANDING' | 'LOGIN' | 'DASHBOARD'>('LANDING');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setCurrentPage('LOGIN');
  };

  const handleLogin = () => {
    setCurrentPage('DASHBOARD');
  };

  const handleLogout = () => {
    setCurrentPage('LANDING');
    setSelectedRole(null);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {currentPage === 'LANDING' && (
        <LandingPage onSelectRole={handleRoleSelect} />
      )}
      
      {currentPage === 'LOGIN' && selectedRole && (
        <LoginPage role={selectedRole} onLogin={handleLogin} onBack={() => setCurrentPage('LANDING')} />
      )}

      {currentPage === 'DASHBOARD' && selectedRole === UserRole.HR && (
        <HRDashboard onLogout={handleLogout} />
      )}

      {currentPage === 'DASHBOARD' && selectedRole === UserRole.EMPLOYEE && (
        <EmployeeDashboard onLogout={handleLogout} />
      )}
    </div>
  );
};

export default App;

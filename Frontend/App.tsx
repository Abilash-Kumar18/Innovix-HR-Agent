import React, { useState } from 'react';
import { UserRole } from './types'; // Ensure this file exists (see below)
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import HRDashboard from './pages/HRDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';

const App: React.FC = () => {
  // 1. State Management
  const [currentPage, setCurrentPage] = useState<'LANDING' | 'LOGIN' | 'DASHBOARD'>('LANDING');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // 2. Login Handler
  // This function is called by LoginPage when the user clicks "Sign In"
  const handleLogin = (userId: string) => {
    console.log(`Logging in as: ${userId} (${selectedRole})`);
    setCurrentUserId(userId);
    setCurrentPage('DASHBOARD');
  };

  // 3. Logout Handler
  const handleLogout = () => {
    setCurrentPage('LANDING');
    setSelectedRole(null);
    setCurrentUserId("");
  };

  // 4. Render Logic
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* LANDING PAGE */}
      {currentPage === 'LANDING' && (
        <LandingPage 
          onSelectRole={(role) => { 
            setSelectedRole(role); 
            setCurrentPage('LOGIN'); 
          }} 
        />
      )}

      {/* LOGIN PAGE */}
      {currentPage === 'LOGIN' && selectedRole && (
        <LoginPage 
          role={selectedRole} 
          onLogin={handleLogin} 
          onBack={() => setCurrentPage('LANDING')} 
        />
      )}

      {/* HR DASHBOARD */}
      {currentPage === 'DASHBOARD' && selectedRole === UserRole.HR && (
        <HRDashboard 
          onLogout={handleLogout} 
          userId={currentUserId} // <--- ADDED THIS! HR needs ID for the Chatbot too.
        />
      )}

      {/* EMPLOYEE DASHBOARD */}
      {currentPage === 'DASHBOARD' && selectedRole === UserRole.EMPLOYEE && (
        <EmployeeDashboard 
          onLogout={handleLogout} 
          userId={currentUserId} 
        />
      )}
    </div>
  );
};

export default App;
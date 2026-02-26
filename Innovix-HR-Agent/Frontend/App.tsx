import React, { useState } from 'react';
import { UserRole } from './types'; 
import LandingPage from './pages/LandingPage';
import HRDashboard from './pages/HRDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';

const App: React.FC = () => {
  // 1. State Management (Simplified to just LANDING and DASHBOARD)
  const [currentPage, setCurrentPage] = useState<'LANDING' | 'DASHBOARD'>('LANDING');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  // 2. Login Handler
  // LandingPage handles the Login Screen internally now. 
  // Once login succeeds, it passes the role here to switch to the Dashboard.
  const handleLoginSuccess = (role: UserRole) => {
    console.log(`Login successful! Routing to ${role} dashboard.`);
    setSelectedRole(role);
    setCurrentPage('DASHBOARD');
  };

  // 3. Logout Handler
  const handleLogout = () => {
    // Clear the stored user data for security
    localStorage.removeItem('current_user_id');
    localStorage.removeItem('user_role');
    
    // Reset App State
    setCurrentPage('LANDING');
    setSelectedRole(null);
  };

  // 4. Render Logic
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      
      {/* LANDING & LOGIN PAGE */}
      {/* Note: LandingPage automatically shows LoginPage when a role is clicked */}
      {currentPage === 'LANDING' && (
        <LandingPage 
          onSelectRole={handleLoginSuccess} 
        />
      )}

      {/* HR DASHBOARD */}
      {currentPage === 'DASHBOARD' && selectedRole === UserRole.HR && (
        <HRDashboard 
          onLogout={handleLogout} 
          // Note: No need to pass userId, HRDashboard reads it from localStorage automatically!
        />
      )}

      {/* EMPLOYEE DASHBOARD */}
      {currentPage === 'DASHBOARD' && selectedRole === UserRole.EMPLOYEE && (
        <EmployeeDashboard 
          onLogout={handleLogout} 
          // Note: No need to pass userId, EmployeeDashboard reads it from localStorage automatically!
        />
      )}
      
    </div>
  );
};

export default App;
import React from 'react';
import { LayoutDashboard, Users, Briefcase, FileText, Settings, LogOut, Bell } from 'lucide-react';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  onLogout: () => void;
  // New Props for dynamic user details & role
  role?: 'hr' | 'employee';
  user?: {
    name: string;
    role: string;
    image: string;
  };
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activePage, 
  setActivePage, 
  onLogout, 
  role = 'hr', // Default to HR if not specified
  user = { name: 'Sarah Jones', role: 'HR Manager', image: 'https://i.pravatar.cc/150?img=32' } // Default fallback
}) => {
  
  // Define menu items
  const allMenuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: "Dashboard" },
    { id: 'employees', icon: Users, label: role === 'hr' ? "All Employees" : "My Team" }, // Change label based on role
    { id: 'recruiting', icon: Briefcase, label: "Recruiting", hidden: role === 'employee' }, // Hide for employee
    { id: 'payroll', icon: FileText, label: "Payroll" },
    { id: 'notifications', icon: Bell, label: "Notifications" },
    { id: 'settings', icon: Settings, label: "Settings", hidden: role === 'employee' }, // HIDE SETTINGS FOR EMPLOYEE
  ];

  // Filter out hidden items
  const visibleMenuItems = allMenuItems.filter(item => !item.hidden);

  return (
    <aside className="w-64 h-screen bg-white fixed left-0 top-0 flex flex-col px-6 py-8 border-r border-slate-100 z-50">
      
      {/* 1. Logo */}
      <div className="flex items-center gap-3 mb-12">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lime-500 to-green-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-lime-200">
          I
        </div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Innvoix HR</h1>
      </div>

      {/* 2. Navigation Menu */}
      <nav className="flex-1 space-y-2">
        {visibleMenuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={`
              w-full flex items-center gap-4 px-4 py-3 rounded-full transition-all duration-300 font-medium
              ${activePage === item.id
                ? 'bg-gradient-to-r from-lime-500 to-green-500 text-white shadow-md shadow-lime-200 transform scale-105' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-lime-600'
              }
            `}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* 3. Dynamic User Profile (Click to go to Profile) */}
      <div className="pt-6 border-t border-slate-100">
        <div className="flex items-center gap-3">
          
          {/* Clickable profile area */}
          <div 
            onClick={() => setActivePage('profile')}
            className="flex items-center gap-3 flex-1 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors group"
          >
            <img 
              src={user.image} 
              alt="User" 
              className="w-10 h-10 rounded-full border-2 border-white shadow-sm group-hover:border-lime-200 transition-colors"
            />
            <div className="overflow-hidden">
              <h4 className="text-sm font-bold text-slate-800 truncate">{user.name}</h4>
              <p className="text-xs text-slate-400 truncate">{user.role}</p>
            </div>
          </div>

          {/* Logout Button */}
          <button 
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

    </aside>
  );
};

export default Sidebar;
import React from 'react';
import { LayoutDashboard, Users, Briefcase, FileText, Settings, LogOut, Bell, Menu } from 'lucide-react';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  onLogout: () => void;
  isCollapsed: boolean;
  toggleSidebar: () => void;
  role?: 'hr' | 'employee';
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activePage, 
  setActivePage, 
  onLogout, 
  isCollapsed,
  toggleSidebar,
  role = 'hr' 
}) => {
  
  const allMenuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: "Dashboard" },
    { id: 'employees', icon: Users, label: role === 'hr' ? "All Employees" : "My Team" },
    { id: 'recruiting', icon: Briefcase, label: "Recruiting", hidden: role === 'employee' },
    { id: 'payroll', icon: FileText, label: "Payroll" },
    { id: 'notifications', icon: Bell, label: "Notifications" },
    { id: 'settings', icon: Settings, label: "Settings", hidden: role === 'employee' },
  ];

  const visibleMenuItems = allMenuItems.filter(item => !item.hidden);

  return (
    <aside 
      className={`
        h-screen bg-white fixed left-0 top-0 flex flex-col border-r border-slate-100 z-50 transition-all duration-300
        ${isCollapsed ? 'w-20 px-3 py-6' : 'w-64 px-6 py-8'}
      `}
    >
      
      {/* 1. Header & Hamburger Toggle */}
      <div className={`flex items-center mb-10 ${isCollapsed ? 'justify-center flex-col gap-4' : 'justify-between'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lime-500 to-green-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-lime-200 shrink-0">
            I
          </div>
          {!isCollapsed && <h1 className="text-2xl font-bold text-slate-800 tracking-tight whitespace-nowrap">Innvoix HR</h1>}
        </div>
        
        <button 
          onClick={toggleSidebar} 
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* 2. Navigation Menu */}
      <nav className="flex-1 space-y-2">
        {visibleMenuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={`
              w-full flex items-center gap-4 px-3 py-3 rounded-full transition-all duration-300 font-medium
              ${activePage === item.id
                ? 'bg-gradient-to-r from-lime-500 to-green-500 text-white shadow-md shadow-lime-200' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-lime-600'
              }
              ${isCollapsed ? 'justify-center' : ''}
            `}
            title={isCollapsed ? item.label : ''}
          >
            <item.icon size={20} className="shrink-0" />
            {!isCollapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* 3. Logout Section (Replaces Profile Details) */}
      <div className="pt-6 border-t border-slate-100">
        <button 
          onClick={onLogout}
          className={`
            w-full flex items-center justify-center gap-3 p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium
            ${isCollapsed ? '' : 'px-4'}
          `}
          title="Logout"
        >
          <LogOut size={20} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>

    </aside>
  );
};

export default Sidebar;
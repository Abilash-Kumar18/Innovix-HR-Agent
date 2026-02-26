import React from 'react';
import { LayoutDashboard, Users, Briefcase, FileText, Settings, LogOut, Bell, Menu, MessageSquare, Calendar as CalendarIcon } from 'lucide-react';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  onLogout: () => void;
  isCollapsed: boolean;
  toggleSidebar: () => void;
  role?: 'hr' | 'employee';
  user?: any;
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
    { id: 'calendar', icon: CalendarIcon, label: "Calendar" }, // <--- CALENDAR BUTTON IS HERE
    { id: 'payroll', icon: FileText, label: "Payroll" },
    { id: 'notifications', icon: Bell, label: "Notifications" },
    { id: 'chat', icon: MessageSquare, label: role === 'hr' ? "AI Copilot" : "AI Assistant" }, 
    { id: 'settings', icon: Settings, label: "Settings", hidden: role === 'employee' },
  ];

  const visibleMenuItems = allMenuItems.filter(item => !item.hidden);

  return (
    <aside 
      className={`
        h-screen bg-white fixed left-0 top-0 flex flex-col border-r border-slate-100 z-50 transition-all duration-300
        ${isCollapsed ? 'w-20' : 'w-64'} 
        p-4 
      `}
    >
      
      {/* 1. Logo Section */}
      <div className="flex items-center gap-3 mb-6 px-2 h-10 overflow-hidden">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lime-500 to-green-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-lime-200 shrink-0">
          I
        </div>
        <h1 
          className={`
            text-2xl font-bold text-slate-800 tracking-tight whitespace-nowrap transition-all duration-300 origin-left
            ${isCollapsed ? 'opacity-0 w-0 scale-0' : 'opacity-100 w-auto scale-100'}
          `}
        >
          Innvoix HR
        </h1>
      </div>

      {/* 2. Hamburger Toggle */}
      <div className="mb-6 px-2 flex justify-start">
        <button 
          onClick={toggleSidebar} 
          className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          title="Toggle Sidebar"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* 3. Navigation Menu */}
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
              justify-start
            `}
            title={isCollapsed ? item.label : ''}
          >
            <item.icon size={20} className="shrink-0" />
            <span 
              className={`whitespace-nowrap transition-all duration-300 origin-left
                ${isCollapsed ? 'opacity-0 w-0 scale-0' : 'opacity-100 w-auto scale-100'}
              `}
            >
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      {/* 4. Logout Section */}
      <div className="pt-6 border-t border-slate-100">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-3 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium justify-start"
          title="Logout"
        >
          <LogOut size={20} className="shrink-0" />
          <span 
            className={`whitespace-nowrap transition-all duration-300 origin-left
              ${isCollapsed ? 'opacity-0 w-0 scale-0' : 'opacity-100 w-auto scale-100'}
            `}
          >
            Logout
          </span>
        </button>
      </div>

    </aside>
  );
};

export default Sidebar;
import React from 'react';
import { LayoutDashboard, Users, Briefcase, FileText, Settings, LogOut, Bell, Menu } from 'lucide-react';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  onLogout: () => void;
  isCollapsed: boolean;
  toggleSidebar: () => void;
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
  isCollapsed,
  toggleSidebar,
  role = 'hr', 
  user 
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
      
      {/* 1. Header & Toggle */}
      <div className={`flex items-center mb-10 ${isCollapsed ? 'justify-center flex-col gap-4' : 'justify-between'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lime-500 to-green-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-lime-200 shrink-0">
            I
          </div>
          {!isCollapsed && <h1 className="text-2xl font-bold text-slate-800 tracking-tight whitespace-nowrap">Innvoix HR</h1>}
        </div>
        
        {/* Hamburger Toggle */}
        <button onClick={toggleSidebar} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
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

      {/* 3. User Profile */}
      <div className="pt-6 border-t border-slate-100">
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center flex-col' : ''}`}>
          
          <div 
            onClick={() => setActivePage('profile')}
            className={`flex items-center gap-3 flex-1 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors group ${isCollapsed ? 'justify-center' : ''}`}
          >
            <img 
              src={user?.image || 'https://i.pravatar.cc/150?img=32'} 
              alt="User" 
              className="w-10 h-10 rounded-full border-2 border-white shadow-sm group-hover:border-lime-200 transition-colors object-cover shrink-0"
            />
            {!isCollapsed && (
              <div className="overflow-hidden text-left">
                <h4 className="text-sm font-bold text-slate-800 truncate">{user?.name || 'User'}</h4>
                <p className="text-xs text-slate-400 truncate">{user?.role || 'Role'}</p>
              </div>
            )}
          </div>

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
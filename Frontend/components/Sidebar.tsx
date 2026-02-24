import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  CheckSquare, 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  UserCircle,
  Calendar as CalendarIcon 
} from 'lucide-react';

// 1. UPDATE THE INTERFACE HERE
interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  onLogout: () => void;
  role: 'hr' | 'employee';
  // Add these missing properties:
  user?: {
    name: string;
    role: string;
    image: string;
  };
  isCollapsed?: boolean;
  toggleSidebar?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activePage, 
  setActivePage, 
  onLogout, 
  role, 
  // Destructure the new props here:
  user,
  isCollapsed = false, 
  toggleSidebar 
}) => {
  
  // Define menu items based on role
  const menuItems = role === 'hr' ? [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'employees', label: 'All Employees', icon: Users },
    { id: 'approvals', label: 'Approvals', icon: CheckSquare },
    { id: 'calendar', icon: CalendarIcon, label: "Calendar" }, 
    { id: 'payroll', label: 'Payroll', icon: FileText },
    { id: 'chat', label: 'AI Assistant', icon: MessageSquare },
  ] : [
    { id: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'My Profile', icon: Users },
    { id: 'notifications', label: 'Leave Requests', icon: CheckSquare },
    { id: 'calendar', icon: CalendarIcon, label: "Calendar" }, 
    { id: 'payroll', label: 'My Payslips', icon: FileText },
    { id: 'chat', label: 'AI Assistant', icon: MessageSquare },
  ];

  return (
    <aside className={`h-screen bg-slate-900 text-white transition-all duration-300 flex flex-col fixed left-0 top-0 z-50 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      
      {/* Header / Logo */}
      <div className="p-6 flex items-center justify-between border-b border-slate-800">
        {!isCollapsed && (
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="w-8 h-8 bg-lime-500 rounded-lg flex items-center justify-center text-slate-900">I</div>
            <span>Innvoix</span>
          </div>
        )}
        {isCollapsed && (
           <div className="w-8 h-8 bg-lime-500 rounded-lg flex items-center justify-center text-slate-900 mx-auto font-bold">I</div>
        )}
        
        {toggleSidebar && (
          <button onClick={toggleSidebar} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors absolute -right-3 top-8 border border-slate-700 shadow-md">
            {isCollapsed ? <ChevronRight size={14}/> : <ChevronLeft size={14}/>}
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-6 px-3 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
              ${activePage === item.id 
                ? 'bg-lime-500 text-slate-900 font-bold shadow-lg shadow-lime-500/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              } ${isCollapsed ? 'justify-center' : ''}`}
          >
            <item.icon size={20} className={activePage === item.id ? 'text-slate-900' : 'group-hover:text-lime-400'} />
            {!isCollapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* User Profile Snippet (Bottom) */}
      <div className="p-4 border-t border-slate-800">
        <div className={`flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 ${isCollapsed ? 'justify-center' : ''}`}>
          {user ? (
             <img src={user.image} alt="User" className="w-10 h-10 rounded-full object-cover border-2 border-slate-600" />
          ) : (
             <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
               <UserCircle size={24} />
             </div>
          )}
          
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-400 truncate capitalize">{user?.role || role}</p>
            </div>
          )}
          
          {!isCollapsed && (
            <button onClick={onLogout} className="text-slate-400 hover:text-red-400 transition-colors">
              <LogOut size={18} />
            </button>
          )}
        </div>
        
        {/* Collapsed Logout Button */}
        {isCollapsed && (
           <button onClick={onLogout} className="w-full mt-2 flex justify-center text-slate-400 hover:text-red-400 p-2">
              <LogOut size={20} />
           </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
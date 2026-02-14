
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  UserCircle, 
  Briefcase, 
  CreditCard, 
  Settings, 
  LogOut,
  Calendar,
  FileText
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  role: UserRole;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ role, onLogout }) => {
  const hrMenu = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, active: true },
    { name: 'All Employees', icon: <Users size={20} /> },
    { name: 'Recruiting', icon: <Briefcase size={20} /> },
    { name: 'Payroll', icon: <CreditCard size={20} /> },
    { name: 'Settings', icon: <Settings size={20} /> },
  ];

  const employeeMenu = [
    { name: 'My Profile', icon: <UserCircle size={20} />, active: true },
    { name: 'My Leaves', icon: <Calendar size={20} /> },
    { name: 'Payslips', icon: <FileText size={20} /> },
    { name: 'Holidays', icon: <Calendar size={20} /> },
    { name: 'Settings', icon: <Settings size={20} /> },
  ];

  const menu = role === UserRole.HR ? hrMenu : employeeMenu;

  return (
    <div className="w-64 h-full bg-white border-r border-gray-100 flex flex-col p-6 fixed left-0 top-0">
      <div className="flex items-center gap-2 mb-10 px-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-b from-[#C0E364] to-[#4CAF50] flex items-center justify-center text-white font-bold">I</div>
        <span className="text-xl font-bold text-gray-800">Innovix HR</span>
      </div>

      <nav className="flex-1 space-y-2">
        {menu.map((item, idx) => (
          <button
            key={idx}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-full transition-all ${
              item.active 
                ? 'bg-gradient-to-b from-[#C0E364] to-[#4CAF50] text-white' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {item.icon}
            <span className="font-medium">{item.name}</span>
          </button>
        ))}
      </nav>

      <button
        onClick={onLogout}
        className="mt-auto flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-full transition-all"
      >
        <LogOut size={20} />
        <span className="font-medium">Logout</span>
      </button>
    </div>
  );
};

export default Sidebar;

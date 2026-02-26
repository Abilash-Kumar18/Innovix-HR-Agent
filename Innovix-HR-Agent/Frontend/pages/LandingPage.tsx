import React, { useState } from 'react';
import { UserRole } from '../types';
import { Briefcase, User, ChevronRight, Building2, LayoutGrid } from 'lucide-react';
import LoginPage from './LoginPage';

interface LandingPageProps {
  onSelectRole: (role: UserRole) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSelectRole }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  if (selectedRole) {
    return (
      <LoginPage 
        role={selectedRole} 
        onLogin={() => onSelectRole(selectedRole)} 
        onBack={() => setSelectedRole(null)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7F6] flex flex-col items-center justify-center p-6 font-sans text-slate-900 relative">
      
      {/* PROFESSIONAL BACKGROUND PATTERN */}
      <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

      <div className="w-full max-w-6xl z-10 grid md:grid-cols-2 gap-12 items-center">
        
        {/* LEFT SIDE: TEXT & BRANDING */}
        <div className="text-left space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider shadow-sm">
            <Building2 size={14} className="text-slate-800" />
            Innvoix Enterprise Portal
          </div>
          
          <h1 className="text-5xl font-bold text-slate-900 leading-tight tracking-tight">
            Workforce Management <br/>
            <span className="text-slate-500">Reimagined.</span>
          </h1>
          
          <p className="text-slate-600 text-lg max-w-md leading-relaxed border-l-4 border-slate-300 pl-4">
            Secure access to payroll, compliance, and AI-driven HR analytics. Please identify your role to proceed.
          </p>

          <div className="flex items-center gap-4 text-sm text-slate-400 font-medium pt-4">
            <span>© 2026 Innvoix Systems</span>
            <span>•</span>
            <span>v2.4.0 (Stable)</span>
          </div>
        </div>

        {/* RIGHT SIDE: SELECTION CARDS (Clean & Structured) */}
        <div className="grid gap-5">
          
          {/* HR CARD */}
          <button
            onClick={() => setSelectedRole(UserRole.HR)}
            className="group flex items-center p-6 bg-white border border-slate-200 hover:border-slate-800 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 text-left"
          >
            <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors shrink-0">
              <Briefcase size={26} />
            </div>
            <div className="ml-6 flex-1">
              <h3 className="text-xl font-bold text-slate-900">HR Administration</h3>
              <p className="text-slate-500 text-sm mt-1">Access analytics, approvals, and payroll controls.</p>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 group-hover:text-slate-900 transition-colors">
              <ChevronRight size={24} />
            </div>
          </button>

          {/* EMPLOYEE CARD */}
          <button
            onClick={() => setSelectedRole(UserRole.EMPLOYEE)}
            className="group flex items-center p-6 bg-white border border-slate-200 hover:border-[#4CAF50] rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 text-left"
          >
            <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-700 group-hover:bg-[#4CAF50] group-hover:text-white transition-colors shrink-0">
              <User size={26} />
            </div>
            <div className="ml-6 flex-1">
              <h3 className="text-xl font-bold text-slate-900">Employee Portal</h3>
              <p className="text-slate-500 text-sm mt-1">View payslips, apply for leave, and access self-service.</p>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 group-hover:text-[#4CAF50] transition-colors">
              <ChevronRight size={24} />
            </div>
          </button>

        </div>
      </div>
    </div>
  );
};

export default LandingPage;
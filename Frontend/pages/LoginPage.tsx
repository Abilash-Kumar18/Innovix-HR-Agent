import React, { useState } from 'react';
import { UserRole } from '../types';
import { ArrowLeft, Mail, Lock, Loader2, AlertTriangle, Briefcase, User } from 'lucide-react';
import { api } from '../services/api';

interface LoginPageProps {
  role: UserRole;
  onLogin: () => void;
  onBack: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ role, onLogin, onBack }) => {
  // Form Data (Strictly Login Only)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- THEME CONFIGURATION ---
  const theme = role === UserRole.HR ? {
    bg: 'bg-[#0F172A]', // Dark Slate/Blue
    btn: 'bg-[#0F172A] hover:bg-slate-800',
    iconBg: 'bg-white/10',
    text: 'text-white'
  } : {
    bg: 'bg-gradient-to-br from-[#4CAF50] to-[#2E7D32]', // Green Gradient
    btn: 'bg-[#4CAF50] hover:bg-[#388E3C]',
    iconBg: 'bg-white/20',
    text: 'text-white'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Send Login Request to MongoDB
      // We pass the currently selected role to enforce strict access
      const response = await api.post('/api/auth/login', { 
        email, 
        password, 
        role: role === UserRole.HR ? 'hr' : 'employee' 
      });
      
      console.log("Login Success:", response.data);
      
      // 2. Save Session Data
      if (response.data.user_id) {
        localStorage.setItem('current_user_id', response.data.user_id);
        localStorage.setItem('user_role', response.data.role);
      }
      
      // 3. Route to Dashboard
      onLogin();

    } catch (err: any) {
      console.error("Login Error:", err);
      
      // Enforce the Strict Role Restriction
      if (err.response?.status === 403) {
        setError(`Access Denied: This account is not authorized for the ${role === UserRole.HR ? 'HR' : 'Employee'} portal.`);
      } else if (err.message === "Network Error") {
        setError("Connection failed. Is the backend running?");
      } else {
        setError(err.response?.data?.detail || "Invalid email or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-[#F0F2F5] font-sans">
      
      <div className="w-full max-w-5xl h-[600px] bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-scale-in">
        
        {/* LEFT SIDE: BRANDING PANEL */}
        <div className={`w-full md:w-5/12 ${theme.bg} ${theme.text} p-12 flex flex-col justify-between relative overflow-hidden`}>
          <button onClick={onBack} className="relative z-10 flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-medium">
            <ArrowLeft size={16}/> Back to Selection
          </button>

          <div className="relative z-10 mt-8">
             <h1 className="text-4xl font-bold mb-2">Innvoix HR</h1>
             <p className="text-white/60 text-sm tracking-wide">Next-Gen Agentic Management.</p>
             
             <div className="mt-12">
                <div className={`w-14 h-14 rounded-2xl ${theme.iconBg} backdrop-blur-md flex items-center justify-center mb-6 border border-white/10`}>
                   {role === UserRole.HR ? <Briefcase size={28}/> : <User size={28}/>}
                </div>
                <h2 className="text-2xl font-bold mb-3">
                  {role === UserRole.HR ? 'HR Command Center' : 'Employee Portal'}
                </h2>
                <p className="text-white/70 text-sm leading-relaxed max-w-xs">
                  {role === UserRole.HR 
                    ? 'Secure login for Human Resources personnel only.' 
                    : 'Secure login for Employees to access self-service.'}
                </p>
             </div>
          </div>

          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>
        </div>

        {/* RIGHT SIDE: FORM PANEL (Strictly Login Only) */}
        <div className="w-full md:w-7/12 p-12 md:p-16 flex flex-col justify-center bg-white relative">
          
          <div className="max-w-sm mx-auto w-full">
            <h3 className="text-3xl font-bold text-slate-800 mb-2">
              Welcome Back! 👋
            </h3>
            <p className="text-slate-500 mb-8 text-sm">
              Please sign in with your corporate credentials.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Error Message Box */}
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-lg flex items-start gap-2 text-xs font-medium">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5"/> 
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Corporate Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                  <input 
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@innvoix.com"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-slate-800 focus:ring-0 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                  <input 
                    type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-slate-800 focus:ring-0 transition-colors"
                  />
                </div>
              </div>

              <button
                disabled={loading}
                type="submit"
                className={`w-full py-4 mt-2 rounded-xl text-white font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 ${theme.btn}`}
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Secure Sign In'}
              </button>
            </form>

            {/* Note replacing the create account button */}
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-slate-400 text-xs leading-relaxed">
                Need an account? <br/> Contact your HR Administrator to be provisioned.
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
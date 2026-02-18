import React, { useState } from 'react';
import { UserRole } from '../types';
import { ArrowLeft, Mail, Lock, Loader2, AlertTriangle, Briefcase, User, UserPlus } from 'lucide-react';
import { api } from '../services/api';

interface LoginPageProps {
  role: UserRole;
  onLogin: () => void;
  onBack: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ role, onLogin, onBack }) => {
  // State for Form Mode (Login vs Create Account)
  const [isLoginMode, setIsLoginMode] = useState(true);

  // Form Data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- THEME CONFIGURATION ---
  // HR gets the Dark Blue Theme (from your image), Employee gets Green
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
      const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/signup';
      const payload = isLoginMode 
        ? { email, password, role: role === UserRole.HR ? 'hr' : 'employee' }
        : { name, email, password, role: role === UserRole.HR ? 'hr' : 'employee' };

      const response = await api.post(endpoint, payload);
      
      console.log("Auth Success:", response.data);
      
      if (response.data.user_id) {
        localStorage.setItem('current_user_id', response.data.user_id);
      }

      // If signup successful, automatically log them in or ask to login
      if (!isLoginMode) {
         alert("Account Created! You can now access the portal.");
      }
      
      onLogin();

    } catch (err: any) {
      console.error("Auth Error:", err);
      // Backend connection check
      if (err.message === "Network Error") {
        setError("Connection failed. Is the backend running?");
      } else {
        setError(err.response?.data?.detail || "Invalid credentials. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-[#F0F2F5] font-sans">
      
      <div className="w-full max-w-5xl h-[650px] bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-scale-in">
        
        {/* LEFT SIDE: BRANDING PANEL (Matches your screenshot style) */}
        <div className={`w-full md:w-5/12 ${theme.bg} ${theme.text} p-12 flex flex-col justify-between relative overflow-hidden`}>
          {/* Back Button */}
          <button onClick={onBack} className="relative z-10 flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-medium">
            <ArrowLeft size={16}/> Back to Selection
          </button>

          {/* Main Content */}
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
                    ? 'Manage approvals, oversee payroll, and track compliance with AI assistance.' 
                    : 'View your payslips, apply for leaves, and chat with your AI HR assistant.'}
                </p>
             </div>
          </div>

          {/* Decorative Circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>
        </div>

        {/* RIGHT SIDE: FORM PANEL */}
        <div className="w-full md:w-7/12 p-12 md:p-16 flex flex-col justify-center bg-white relative">
          
          <div className="max-w-sm mx-auto w-full">
            <h3 className="text-3xl font-bold text-slate-800 mb-2">
              {isLoginMode ? 'Welcome Back! 👋' : 'Create Account 🚀'}
            </h3>
            <p className="text-slate-500 mb-8 text-sm">
              {isLoginMode ? 'Please login to access your account.' : 'Enter your details to get started.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-lg flex items-center gap-2 text-xs font-medium">
                  <AlertTriangle size={14}/> {error}
                </div>
              )}

              {/* Name Field (Only for Signup) */}
              {!isLoginMode && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                    <input 
                      type="text" required={!isLoginMode} value={name} onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-slate-800 focus:ring-0 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                  <input 
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@innvoix.com"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-slate-800 focus:ring-0 transition-colors"
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
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-slate-800 focus:ring-0 transition-colors"
                  />
                </div>
              </div>

              <button
                disabled={loading}
                type="submit"
                className={`w-full py-3.5 rounded-xl text-white font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 ${theme.btn}`}
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (isLoginMode ? 'Sign In' : 'Register Now')}
              </button>
            </form>

            {/* TOGGLE: LOGIN <-> SIGNUP */}
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-slate-500 text-sm">
                {isLoginMode ? "Don't have an account?" : "Already have an account?"}
              </p>
              <button 
                onClick={() => { setIsLoginMode(!isLoginMode); setError(''); }}
                className={`mt-2 font-bold text-sm hover:underline ${role === UserRole.HR ? 'text-slate-800' : 'text-[#4CAF50]'}`}
              >
                {isLoginMode ? 'Create New Account' : 'Back to Login'}
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
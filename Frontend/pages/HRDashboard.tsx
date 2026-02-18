import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar'; 
import { User, MapPin, Calendar, BellRing, CheckCircle, Search, Plus, FileText, Clock, Upload, X, MessageSquare, ChevronRight, MoreVertical, Briefcase, AlertTriangle, XCircle, Bot } from 'lucide-react';
// IMPORT THE API BRIDGE
import { api, sendMessageToBackend } from '../services/api';

// --- TYPES FOR REAL BACKEND DATA ---
interface ApprovalRequest {
  _id: string;
  trx_id: string;
  emp_id: string;
  action: string;
  details: string;
  status: string;
}

interface Ticket {
  _id: string;
  ticket_id: string;
  emp_id: string;
  category: string;
  issue: string;
  status: string;
}

interface Message {
  id: number;
  sender: 'user' | 'ai';
  text: string;
}

// --- 1. AI CHAT WINDOW (CONNECTED TO BACKEND) ---
const ChatWindow = ({ onClose }: { onClose: () => void }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, sender: 'ai', text: 'Hello Sarah! I can help you draft new policies, check compliance, or look up employee details. What do you need?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    // 1. Add User Message
    const newMsg: Message = { id: Date.now(), sender: 'user', text: inputText };
    setMessages(prev => [...prev, newMsg]);
    const currentText = inputText;
    setInputText('');
    setIsLoading(true);

    try {
      // 2. Call Real Backend (HR Role)
      // We pass 'emp_001' (Abilash/HR) to identify the user
      const response = await sendMessageToBackend(currentText, "emp_001");
      
      // 3. Add AI Response
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: "⚠️ Error connecting to HR Agent." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50 animate-fade-in-up">
      <div className="p-4 bg-slate-900 rounded-t-2xl flex justify-between items-center text-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-lime-500 flex items-center justify-center font-bold text-slate-900"><Bot size={18}/></div>
          <div><h4 className="font-bold text-sm">HR Copilot</h4><span className="text-[10px] bg-green-500/20 px-1.5 py-0.5 rounded text-green-400 border border-green-500/30">Online</span></div>
        </div>
        <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors"><X size={18}/></button>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-lime-500 text-white rounded-tr-sm' : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-tl-sm'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-white p-3 rounded-2xl rounded-tl-sm border border-slate-100 shadow-sm flex gap-1">
               <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
               <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
               <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
             </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-100 rounded-b-2xl">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={inputText} 
            onChange={(e) => setInputText(e.target.value)} 
            placeholder="Type a command..." 
            className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-lime-500" 
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
          />
          <button onClick={handleSend} disabled={isLoading} className="w-10 h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-full flex items-center justify-center transition-colors">
            <ChevronRight size={18}/>
          </button>
        </div>
      </div>
    </div>
  );
};

// --- UPDATED DASHBOARD OVERVIEW (With Real Stats) ---
const DashboardOverview = ({ onOpenChat, approvalCount, ticketCount }: { onOpenChat: () => void, approvalCount: number, ticketCount: number }) => (
  <div className="space-y-6">
    <div className="flex justify-between items-end">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>
        <p className="text-slate-500">Welcome back, here is what's happening today.</p>
      </div>
      
      <button 
        onClick={onOpenChat}
        className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-slate-200 transition-all flex items-center gap-2"
      >
        <MessageSquare size={18} className="text-lime-400"/> Ask AI Copilot
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total Employees (Static for Demo) */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="absolute right-0 top-0 w-24 h-24 bg-lime-100 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform"></div>
        <h3 className="text-slate-500 font-medium relative z-10">Total Employees</h3>
        <p className="text-4xl font-bold text-slate-800 mt-2 relative z-10">124</p>
        <span className="text-xs font-bold text-lime-600 bg-lime-50 px-2 py-1 rounded-full mt-3 inline-block relative z-10">↑ 12% vs last month</span>
      </div>

      {/* Open Tickets (Real Count) */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
        <h3 className="text-slate-500 font-medium">Open Tickets</h3>
        <p className="text-4xl font-bold text-slate-800 mt-2">{ticketCount}</p>
        <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden"><div className="bg-orange-400 h-full w-1/3"></div></div>
        <p className="text-xs text-slate-400 mt-2">Requires IT/HR Attention</p>
      </div>

      {/* Pending Approvals (Real Count) */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
        <h3 className="text-slate-500 font-medium">Pending Approvals</h3>
        <p className="text-4xl font-bold text-slate-800 mt-2">{approvalCount}</p>
        <button className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full mt-3 hover:bg-blue-100">Review Now →</button>
      </div>
    </div>
  </div>
);

// ... (AllEmployees, Recruiting, Payroll, SettingsPage, Profile components remain EXACTLY as they were in your previous code. I have omitted them here for brevity, but you should keep them!) ...
const AllEmployees = () => (<div className="p-8 text-center text-slate-400">Employee List Placeholder</div>);
const Recruiting = () => (<div className="p-8 text-center text-slate-400">Recruiting Placeholder</div>);
const Payroll = () => (<div className="p-8 text-center text-slate-400">Payroll Placeholder</div>);
const SettingsPage = () => (<div className="p-8 text-center text-slate-400">Settings Placeholder</div>);
const Profile = () => (<div className="p-8 text-center text-slate-400">Profile Placeholder</div>);


// --- UPDATED NOTIFICATIONS PAGE (Fetches Real Data) ---
const NotificationsPage = ({ approvals, setApprovals }: { approvals: ApprovalRequest[], setApprovals: any }) => {
  
  const handleAction = async (trxId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      // 1. Call Real Backend
      await api.put(`/api/approvals/${trxId}`, { status });
      
      // 2. Remove from UI
      setApprovals((prev: ApprovalRequest[]) => prev.filter(req => req.trx_id !== trxId));
      alert(`Transaction ${status} Successfully!`);
    } catch (error) {
      alert("Error updating status. Is the backend running?");
    }
  };

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Notifications & Approvals</h2>
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden min-h-[300px]">
        
        {approvals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400">
            <CheckCircle size={48} className="mb-4 text-slate-200"/>
            <p>All caught up! No pending requests.</p>
          </div>
        ) : (
          approvals.map((req) => (
            <div key={req._id} className="flex items-start gap-4 p-6 bg-orange-50/50 border-b border-orange-100 animate-fade-in-up">
              <div className="p-2.5 bg-orange-100 text-orange-600 rounded-full mt-1">
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wide">{req.action.replace('_', ' ')}</h4>
                  <span className="text-xs text-orange-500 font-bold bg-orange-100 px-2 py-0.5 rounded">Action Required</span>
                </div>
                <p className="text-sm text-slate-600 mt-1 mb-4 leading-relaxed">
                  Employee <span className="font-bold text-slate-800">{req.emp_id}</span> request: <br/>
                  <span className="italic">"{req.details}"</span>
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleAction(req.trx_id, 'APPROVED')}
                    className="bg-slate-900 text-white text-xs px-5 py-2 rounded-full font-bold hover:bg-slate-700 shadow-lg shadow-slate-200 transition-all flex items-center gap-2"
                  >
                    <CheckCircle size={14}/> Approve
                  </button>
                  <button 
                    onClick={() => handleAction(req.trx_id, 'REJECTED')}
                    className="bg-white border border-slate-200 text-slate-600 text-xs px-5 py-2 rounded-full font-bold hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all flex items-center gap-2"
                  >
                    <XCircle size={14}/> Reject
                  </button>
                </div>
              </div>
            </div>
          ))
        )}

      </div>
    </div>
  );
};

// --- MAIN HR DASHBOARD COMPONENT ---
interface HRDashboardProps {
  onLogout: () => void;
}

const HRDashboard: React.FC<HRDashboardProps> = ({ onLogout }) => {
  const [activePage, setActivePage] = useState('dashboard');
  const [showChat, setShowChat] = useState(false);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  // --- FETCH REAL DATA ON LOAD ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const approvalRes = await api.get('/api/approvals');
        setApprovals(approvalRes.data.data);
        const ticketRes = await api.get('/api/tickets');
        setTickets(ticketRes.data.data);
      } catch (error) {
        console.error("Failed to load HR data", error);
      }
    };
    fetchData();
  }, []);

  const sarahUser = { name: "Sarah Jones", role: "HR Manager", image: "https://i.pravatar.cc/150?img=32" };

  const renderContent = () => {
    switch(activePage) {
      case 'dashboard': return <DashboardOverview onOpenChat={() => setShowChat(true)} approvalCount={approvals.length} ticketCount={tickets.length} />;
      case 'employees': return <AllEmployees />;
      case 'recruiting': return <Recruiting />;
      case 'payroll': return <Payroll />;
      case 'notifications': return <NotificationsPage approvals={approvals} setApprovals={setApprovals} />;
      case 'settings': return <SettingsPage />;
      case 'profile': return <Profile />;
      default: return <DashboardOverview onOpenChat={() => setShowChat(true)} approvalCount={approvals.length} ticketCount={tickets.length} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] font-sans text-slate-900 relative">
      <Sidebar activePage={activePage} setActivePage={setActivePage} onLogout={onLogout} role="hr" user={sarahUser} />
      <main className="flex-1 ml-64 p-8 transition-all duration-300">
        <header className="mb-8 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-400 capitalize tracking-tight">{activePage === 'dashboard' ? 'Overview' : activePage.replace('-', ' ')}</h1>
            <div className="flex items-center gap-4">
               <button onClick={() => setActivePage('notifications')} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 text-slate-500 hover:text-lime-600 hover:border-lime-200 transition-all relative">
                 <BellRing size={20} />
                 {approvals.length > 0 && <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
               </button>
               <div className="h-8 w-px bg-slate-200 mx-2"></div>
               <div className="text-right hidden md:block">
                  <p className="text-sm font-bold text-slate-700">{sarahUser.name}</p>
                  <p className="text-xs text-slate-400">{sarahUser.role}</p>
               </div>
               <img src={sarahUser.image} className="w-10 h-10 rounded-full border-2 border-white shadow-sm cursor-pointer" onClick={() => setActivePage('profile')} alt="profile"/>
            </div>
        </header>
        <div className="animate-fade-in-up">{renderContent()}</div>
      </main>
      {showChat && <ChatWindow onClose={() => setShowChat(false)} />}
    </div>
  );
};

export default HRDashboard;
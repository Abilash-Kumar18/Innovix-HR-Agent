import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar'; 
import { User, MapPin, Calendar, Shield, BellRing, CheckCircle, Search, Filter, MoreVertical, Plus, FileText, Clock, Upload, Briefcase, X, MessageSquare, ChevronRight, Bot, Send } from 'lucide-react';

// IMPORT YOUR REAL API CALLS
import { sendMessageToBackend, fetchTickets, updateTicketStatus, fetchAllEmployees, fetchUserProfile } from '../services/api';

// --- 1. FULL PAGE AI CHAT COMPONENT (CONNECTED) ---
const AIChatPage = ({ userId }: { userId: string }) => {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'ai', text: 'Hello! 👋 I am your HR Copilot. I can help you draft new policies, check compliance, onboard employees, or analyze data. What do you need?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || loading) return;
    
    const userMsg = inputText;
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: userMsg }]);
    setInputText('');
    setLoading(true);

    try {
      // Call the real Python AI Agent
      const aiResponse = await sendMessageToBackend(userMsg, userId);
      setMessages(prev => [...prev, { id: Date.now()+1, sender: 'ai', text: aiResponse }]);
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now()+1, sender: 'ai', text: "Error: Could not connect to the HR Brain." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in-up">
      <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-white">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-lime-400 to-green-500 flex items-center justify-center text-white shadow-md shadow-lime-200">
          <Bot size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">HR Copilot</h2>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-sm text-slate-500">{loading ? 'Typing...' : 'Online • Admin Access Granted'}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'hidden' : 'bg-lime-100 text-lime-600'}`}>
                {msg.sender === 'ai' && <Bot size={16}/>}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-line shadow-sm 
                ${msg.sender === 'user' ? 'bg-slate-900 text-white rounded-tr-sm' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm'}`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {loading && <div className="text-sm text-slate-400 italic flex items-center gap-2"><div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div> Agent is thinking...</div>}
        <div ref={chatEndRef} />
      </div>

      <div className="p-6 bg-white border-t border-slate-100">
        <div className="flex gap-4 items-center bg-slate-50 p-2 rounded-full border border-slate-200 focus-within:border-lime-500 transition-all">
          <input 
            type="text" 
            value={inputText} 
            onChange={(e) => setInputText(e.target.value)} 
            placeholder="Type an HR command..." 
            className="flex-1 bg-transparent px-4 py-2 text-slate-700 focus:outline-none" 
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <button onClick={handleSend} disabled={!inputText.trim() || loading} className="w-10 h-10 bg-lime-500 hover:bg-lime-600 disabled:bg-slate-300 text-white rounded-full flex items-center justify-center transition-all shadow-md">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- INTERNAL PAGE COMPONENTS ---

const DashboardOverview = ({ onOpenChat, ticketCount, empCount }: { onOpenChat: () => void, ticketCount: number, empCount: number }) => (
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
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="absolute right-0 top-0 w-24 h-24 bg-lime-100 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform"></div>
        <h3 className="text-slate-500 font-medium relative z-10">Total Employees</h3>
        <p className="text-4xl font-bold text-slate-800 mt-2 relative z-10">{empCount}</p>
        <span className="text-xs font-bold text-lime-600 bg-lime-50 px-2 py-1 rounded-full mt-3 inline-block relative z-10">Active Database</span>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
        <h3 className="text-slate-500 font-medium">Pending Approvals</h3>
        <p className="text-4xl font-bold text-slate-800 mt-2">{ticketCount}</p>
        <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden"><div className="bg-orange-400 h-full w-1/3"></div></div>
        <p className="text-xs text-slate-400 mt-2">Awaiting Action</p>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
        <h3 className="text-slate-500 font-medium">System Status</h3>
        <p className="text-4xl font-bold text-green-500 mt-2">Online</p>
        <button className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full mt-3 hover:bg-blue-100">All Systems Go →</button>
      </div>
    </div>
  </div>
);

// --- CONNECTED TO MONGODB ---
const AllEmployees = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  
  useEffect(() => {
    const loadEmps = async () => {
      try {
        const res = await fetchAllEmployees();
        if (res.status === 'success') {
          setEmployees(res.data);
        }
      } catch (err) { console.error(err); }
    };
    loadEmps();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">All Employees</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input type="text" placeholder="Search..." className="pl-10 pr-4 py-2 border border-slate-200 rounded-full text-sm focus:outline-none focus:border-lime-500"/>
          </div>
          <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-slate-800"><Plus size={16}/> Add Employee</button>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
            <tr><th className="p-4 font-semibold">Employee</th><th className="p-4 font-semibold">Role</th><th className="p-4 font-semibold">Department</th><th className="p-4 font-semibold">Status</th><th className="p-4 font-semibold text-right">Action</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.length === 0 ? <tr><td colSpan={5} className="p-4 text-center text-slate-400">Loading employees...</td></tr> : 
             employees.map((emp) => (
              <tr key={emp._id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 flex items-center gap-3">
                  <img src={localStorage.getItem(`profile_pic_${emp._id}`) || `https://ui-avatars.com/api/?name=${emp.name}&background=random`} alt="user" className="w-9 h-9 rounded-full border border-slate-200 object-cover"/>
                  <div><span className="font-bold text-slate-700 block text-sm">{emp.name}</span><span className="text-xs text-slate-400">{emp.email}</span></div>
                </td>
                <td className="p-4 text-sm text-slate-600 capitalize">{emp.role}</td>
                <td className="p-4 text-sm text-slate-600 capitalize">{emp.department || 'General'}</td>
                <td className="p-4"><span className="bg-lime-100 text-lime-700 text-xs font-bold px-2 py-1 rounded-full">Active</span></td>
                <td className="p-4 text-right"><button className="text-slate-400 hover:text-slate-600"><MoreVertical size={18}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
};

const Recruiting = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-slate-800">Recruiting Pipeline</h2><button className="bg-lime-500 text-white px-4 py-2 rounded-full font-bold text-sm hover:bg-lime-600 shadow-md shadow-lime-200 flex items-center gap-2"><Plus size={18}/> Add Candidate</button></div>
    <div className="grid grid-cols-3 gap-6 h-[600px]">{['Applied', 'Interviewing', 'Hired'].map((stage, idx) => (<div key={stage} className="bg-slate-50 p-4 rounded-3xl border border-slate-200 flex flex-col gap-3"><div className="flex justify-between items-center mb-2 px-1"><h3 className="font-bold text-slate-700">{stage}</h3><span className="bg-white px-2 py-1 rounded-lg text-xs font-bold text-slate-400 shadow-sm border border-slate-100">3</span></div>{[1, 2, 3].map(c => (<div key={c} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md cursor-pointer transition-all group"><div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-lime-100 to-green-200 flex items-center justify-center text-sm font-bold text-lime-700 group-hover:scale-110 transition-transform">CN</div><div><h4 className="font-bold text-sm text-slate-800">Candidate {c}</h4><p className="text-xs text-slate-400">Frontend Dev</p></div></div><div className="flex gap-2 text-[10px] font-bold uppercase tracking-wide"><span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-md">Senior</span><span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-md">Remote</span></div></div>))}</div>))}</div>
  </div>
);

const Payroll = () => (<div className="space-y-6"><h2 className="text-2xl font-bold text-slate-800">Payroll</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 rounded-3xl shadow-xl"><p className="text-slate-400 font-medium mb-1">Total Payroll Cost</p><h1 className="text-4xl font-bold">$142,500.00</h1><p className="text-sm text-slate-400 mt-4 mb-8">Scheduled for Oct 31, 2025</p><button className="w-full bg-lime-500 hover:bg-lime-400 text-slate-900 font-bold py-3 rounded-xl transition-colors">Run Payroll</button></div></div></div>);

// --- CONNECTED TO MONGODB ---
const NotificationsPage = () => {
  const [requests, setRequests] = useState<any[]>([]);
  
  useEffect(() => { 
    const loadTickets = async () => {
      try {
        const res = await fetchTickets();
        if (res.status === 'success') {
          // HR Only sees Pending tickets
          const pending = res.data.filter((req: any) => req.status === 'Pending'); 
          setRequests(pending); 
        }
      } catch (err) { console.error(err); }
    };
    loadTickets();
  }, []);

  const handleAction = async (id: string, status: 'Approved' | 'Rejected') => { 
    try {
      await updateTicketStatus(id, status);
      setRequests(prev => prev.filter(req => req._id !== id)); 
      alert(`Request ${status} Successfully!`); 
    } catch (err) {
      alert("Failed to update database.");
    }
  };

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Notifications & Approvals</h2>
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden min-h-[300px]">
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400"><CheckCircle size={48} className="mb-4 text-slate-200"/><p>All caught up! No pending requests.</p></div>
        ) : (
          requests.map((req) => (
            <div key={req._id} className="flex items-start gap-4 p-6 bg-orange-50/50 border-b border-orange-100 animate-fade-in-up">
              <div className="p-2.5 bg-orange-100 text-orange-600 rounded-full mt-1"><BellRing size={20} /></div>
              <div className="flex-1">
                <div className="flex justify-between items-start"><h4 className="font-bold text-slate-800 text-sm">New Leave Request</h4><span className="text-xs text-slate-400 font-medium">{req.date}</span></div>
                <p className="text-sm text-slate-600 mt-1 mb-4 leading-relaxed"><span className="font-bold text-slate-800">{req.employee_name}</span> ({req.role}) has requested <span className="font-bold text-slate-800">{req.days} days</span> of {req.type} for "{req.reason}".</p>
                <div className="flex gap-3">
                  <button onClick={() => handleAction(req._id, 'Approved')} className="bg-slate-900 text-white text-xs px-5 py-2 rounded-full font-bold hover:bg-slate-700 shadow-lg shadow-slate-200 transition-all">Approve Request</button>
                  <button onClick={() => handleAction(req._id, 'Rejected')} className="bg-white border border-slate-200 text-slate-600 text-xs px-5 py-2 rounded-full font-bold hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all">Reject</button>
                </div>
              </div>
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 animate-pulse"></div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const SettingsPage = () => (<div className="max-w-4xl space-y-6"><h2 className="text-2xl font-bold text-slate-800">Global Settings</h2><div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100"><div className="flex items-start gap-4"><div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><FileText size={24}/></div><div className="flex-1"><h3 className="font-bold text-slate-800 text-lg">Company Policy Documents</h3><p className="text-slate-500 text-sm mt-1 mb-6">Upload PDF policies here.</p><div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer"><Upload size={32} className="mx-auto text-slate-300 mb-2"/><p className="text-sm font-medium text-slate-600">Click to upload</p></div></div></div></div></div>);

const Profile = ({ hrData }: { hrData: any }) => (
  <div className="max-w-4xl space-y-8">
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-lime-50 rounded-full -mr-20 -mt-20 opacity-50"></div>
      <img src={`https://ui-avatars.com/api/?name=${hrData?.name || 'HR'}&background=84cc16&color=fff&size=150`} className="w-32 h-32 rounded-full border-4 border-white shadow-xl relative z-10" alt="Profile" />
      <div className="flex-1 text-center md:text-left relative z-10 pt-2">
        <h1 className="text-3xl font-bold text-slate-800">{hrData?.name || 'Loading...'}</h1>
        <p className="text-lime-600 font-medium text-lg mb-4 capitalize">{hrData?.role || 'HR Manager'}</p>
        <div className="flex flex-wrap justify-center md:justify-start gap-4 text-slate-500 text-sm">
          <span className="flex items-center gap-1 bg-slate-50 px-3 py-1 rounded-full border border-slate-100"><MapPin size={14}/> Office</span>
          <span className="flex items-center gap-1 bg-slate-50 px-3 py-1 rounded-full border border-slate-100"><Calendar size={14}/> Active</span>
        </div>
      </div>
      <button className="relative z-10 bg-slate-900 text-white px-6 py-2.5 rounded-full font-medium hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all">Edit Profile</button>
    </div>
  </div>
);

// --- MAIN HR DASHBOARD COMPONENT ---
interface HRDashboardProps { onLogout: () => void; }

const HRDashboard: React.FC<HRDashboardProps> = ({ onLogout }) => {
  const [activePage, setActivePage] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [hrData, setHrData] = useState<any>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [employeeCount, setEmployeeCount] = useState(0);

  // Load Real Data on Mount
  useEffect(() => {
    const loadData = async () => {
      const userId = localStorage.getItem('current_user_id');
      if (userId) {
        const profileRes = await fetchUserProfile(userId);
        if (profileRes.status === 'success') setHrData(profileRes.data);
      }
      
      const ticketsRes = await fetchTickets();
      if (ticketsRes.status === 'success') {
        const pending = ticketsRes.data.filter((t: any) => t.status === 'Pending').length;
        setPendingCount(pending);
      }

      const empRes = await fetchAllEmployees();
      if (empRes.status === 'success') {
        setEmployeeCount(empRes.data.length);
      }
    };
    loadData();
  }, [activePage]);

  const fallbackUser = { name: "HR Admin", role: "hr", image: "https://ui-avatars.com/api/?name=HR" };
  const currentUser = hrData ? { name: hrData.name, role: hrData.role, image: `https://ui-avatars.com/api/?name=${hrData.name}&background=84cc16&color=fff` } : fallbackUser;

  const renderContent = () => {
    switch(activePage) {
      case 'dashboard': return <DashboardOverview onOpenChat={() => setActivePage('chat')} ticketCount={pendingCount} empCount={employeeCount} />;
      case 'chat': return <AIChatPage userId={hrData?.id || 'emp_001'} />; 
      case 'employees': return <AllEmployees />;
      case 'recruiting': return <Recruiting />;
      case 'payroll': return <Payroll />;
      case 'notifications': return <NotificationsPage />; 
      case 'settings': return <SettingsPage />;
      case 'profile': return <Profile hrData={hrData} />;
      default: return <DashboardOverview onOpenChat={() => setActivePage('chat')} ticketCount={pendingCount} empCount={employeeCount} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] font-sans text-slate-900 relative">
      <Sidebar activePage={activePage} setActivePage={setActivePage} onLogout={onLogout} role="hr" user={currentUser} isCollapsed={isSidebarCollapsed} toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      
      <main className={`flex-1 p-8 transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <header className="mb-8 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-400 capitalize tracking-tight">{activePage === 'dashboard' ? 'Overview' : activePage.replace('-', ' ')}</h1>
            <div className="flex items-center gap-4">
               <button onClick={() => setActivePage('notifications')} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 text-slate-500 hover:text-lime-600 hover:border-lime-200 transition-all relative">
                 <BellRing size={20} />
                 {pendingCount > 0 && <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
               </button>
               <div className="h-8 w-px bg-slate-200 mx-2"></div>
               <div className="text-right hidden md:block">
                  <p className="text-sm font-bold text-slate-700">{currentUser.name}</p>
                  <p className="text-xs text-slate-400 capitalize">{currentUser.role}</p>
               </div>
               <img src={currentUser.image} className="w-10 h-10 rounded-full border-2 border-white shadow-sm cursor-pointer" onClick={() => setActivePage('profile')} alt="profile"/>
            </div>
        </header>
        <div className="animate-fade-in-up">{renderContent()}</div>
      </main>
    </div>
  );
};

export default HRDashboard;
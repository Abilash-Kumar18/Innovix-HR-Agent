import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar'; 
import { User, MapPin, Shield, BellRing, CheckCircle, FileText, Download, Clock, Send, ChevronRight, MessageSquare, Camera, X, Plus, AlertCircle, Bot } from 'lucide-react';

// --- SHARED DATA SERVICE (Mock Database for Local Storage) ---
const getLeaveRequests = () => {
  const data = localStorage.getItem('leaveRequests');
  return data ? JSON.parse(data) : [];
};

const sendLeaveRequest = (request: any) => {
  const requests = getLeaveRequests();
  const newRequest = { ...request, id: Date.now(), status: 'Pending', date: new Date().toLocaleDateString() };
  localStorage.setItem('leaveRequests', JSON.stringify([newRequest, ...requests]));
  return newRequest;
};

// --- 1. NEW FULL-PAGE AI CHAT COMPONENT ---
const AIChatPage = () => {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'ai', text: 'Hi Alex! 👋 I am your Innvoix HR Assistant.\n\nI can help you with:\n• Checking leave balances\n• Payroll questions\n• Company holiday list\n\nHow can I help you today?' }
  ]);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    const newMsg = { id: Date.now(), sender: 'user', text: inputText };
    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    
    // Mock AI Response Logic
    setTimeout(() => {
      let reply = "I'm still learning, but I can help connect you with HR!";
      const lowerInput = inputText.toLowerCase();
      
      if (lowerInput.includes('leave') || lowerInput.includes('balance')) {
        reply = "You currently have:\n• 4 Casual Leaves\n• 8 Sick Leaves\n• 15 Privilege Leaves\n\nWould you like to apply for one?";
      } else if (lowerInput.includes('payroll') || lowerInput.includes('salary')) {
        reply = "Your latest payslip for October 2025 has been generated. The net amount is $4,250.00. You can download it from the Payroll tab.";
      } else if (lowerInput.includes('holiday')) {
        reply = "The next company holiday is 'Diwali' on November 8th, 2026. Enjoy the festival! 🪔";
      }

      setMessages(prev => [...prev, { id: Date.now()+1, sender: 'ai', text: reply }]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in-up">
      {/* Chat Header */}
      <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-white">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-lime-400 to-green-500 flex items-center justify-center text-white shadow-md shadow-lime-200">
          <Bot size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">HR Assistant</h2>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-sm text-slate-500">Online • Replies instantly</span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-slate-200 hidden' : 'bg-lime-100 text-lime-600'}`}>
                {msg.sender === 'ai' && <Bot size={16}/>}
              </div>

              {/* Bubble */}
              <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-line shadow-sm
                ${msg.sender === 'user' 
                  ? 'bg-slate-900 text-white rounded-tr-sm' 
                  : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm'
                }`}
              >
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-slate-100">
        <div className="flex gap-4 items-center bg-slate-50 p-2 rounded-full border border-slate-200 focus-within:border-lime-500 focus-within:ring-2 focus-within:ring-lime-100 transition-all">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your question about HR policies..." 
            className="flex-1 bg-transparent px-4 py-2 text-slate-700 focus:outline-none placeholder:text-slate-400"
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="w-10 h-10 bg-lime-500 hover:bg-lime-600 disabled:bg-slate-300 text-white rounded-full flex items-center justify-center transition-all shadow-md"
          >
            <Send size={18} className={inputText.trim() ? "ml-0.5" : ""} />
          </button>
        </div>
        <p className="text-center text-xs text-slate-400 mt-3">AI can make mistakes. Please verify important payroll details with HR.</p>
      </div>
    </div>
  );
};

// --- 2. MODAL COMPONENTS (For Settings) ---
const EditModal = ({ title, onClose, children }: { title: string, onClose: () => void, children: React.ReactNode }) => (
  <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"><X size={20}/></button>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  </div>
);

// --- INTERNAL PAGE COMPONENTS ---

// Overview Page (Links to Chat)
const EmployeeDashboardOverview = ({ setActivePage }: { setActivePage: (page: string) => void }) => (
  <div className="flex flex-col lg:flex-row gap-6">
    <div className="flex-1 space-y-6">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-lime-400 to-green-500 rounded-3xl p-8 text-white shadow-lg shadow-lime-100 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">Welcome Back, Alex! 👋</h2>
          <p className="opacity-90 max-w-md">You have 2 pending tasks and your next leave starts in 4 days.</p>
          <button onClick={() => setActivePage('profile')} className="mt-6 bg-white text-lime-600 px-6 py-2 rounded-full font-bold text-sm hover:bg-lime-50 transition-colors">
            View Profile
          </button>
        </div>
        <div className="absolute -right-10 -bottom-20 w-64 h-64 bg-white opacity-10 rounded-full blur-2xl"></div>
      </div>

      {/* Leave Balance Stats */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4">Leave Balance</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center group hover:shadow-md transition-all">
            <div className="w-16 h-24 mx-auto bg-gradient-to-b from-lime-300 to-lime-500 rounded-full mb-3 shadow-inner group-hover:scale-105 transition-transform flex items-center justify-center text-white font-bold text-xl pt-2">4</div>
            <h4 className="font-bold text-slate-700">Casual</h4>
            <p className="text-xs text-slate-400">Days Left</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center group hover:shadow-md transition-all">
            <div className="w-16 h-24 mx-auto bg-gradient-to-b from-orange-300 to-orange-500 rounded-full mb-3 shadow-inner group-hover:scale-105 transition-transform flex items-center justify-center text-white font-bold text-xl pt-2">8</div>
            <h4 className="font-bold text-slate-700">Sick</h4>
            <p className="text-xs text-slate-400">Days Left</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center group hover:shadow-md transition-all">
            <div className="w-16 h-24 mx-auto bg-gradient-to-b from-blue-300 to-blue-500 rounded-full mb-3 shadow-inner group-hover:scale-105 transition-transform flex items-center justify-center text-white font-bold text-xl pt-2">15</div>
            <h4 className="font-bold text-slate-700">Privilege</h4>
            <p className="text-xs text-slate-400">Days Left</p>
          </div>
        </div>
      </div>
    </div>

    {/* AI Assistant Widget (Links to Chat Page) */}
    <div className="w-full lg:w-80">
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-100 h-full flex flex-col relative overflow-hidden group">
        <div className="p-6 border-b border-slate-50 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lime-400 to-green-500 flex items-center justify-center text-white font-bold shadow-md shadow-lime-200">AI</div>
            <div>
              <h3 className="font-bold text-slate-800">AI Assistant</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-xs text-green-600 font-medium">Online</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-lime-50 flex items-center justify-center text-lime-500 mb-2 group-hover:scale-110 transition-transform">
            <MessageSquare size={24} className="ml-1" />
          </div>
          <p className="text-slate-500 text-sm leading-relaxed">Ask me about leave policies, payroll, or company holidays.</p>
          <button 
            onClick={() => setActivePage('chat')} // <--- NOW OPENS THE CHAT PAGE
            className="bg-slate-900 text-white px-6 py-3 rounded-xl w-full font-bold text-sm shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
          >
            Start Chat <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Notifications & Leave Request Center
const NotificationsPage = () => {
  const [activeTab, setActiveTab] = useState('new');
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [days, setDays] = useState('');
  const [reason, setReason] = useState('');
  const [myRequests, setMyRequests] = useState<any[]>([]);

  useEffect(() => {
    const allRequests = getLeaveRequests();
    setMyRequests(allRequests.filter((req: any) => req.employeeName === 'Alex Johnson'));
  }, [activeTab]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!days || !reason) return;

    sendLeaveRequest({
      employeeName: 'Alex Johnson',
      role: 'Senior Frontend Dev',
      type: leaveType,
      days: days,
      reason: reason
    });

    alert("Request Sent to HR!");
    setDays('');
    setReason('');
    setActiveTab('history');
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Leave & Notifications</h2>
        <div className="flex bg-white rounded-lg p-1 border border-slate-200">
           <button onClick={() => setActiveTab('new')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'new' ? 'bg-lime-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>New Request</button>
           <button onClick={() => setActiveTab('history')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'history' ? 'bg-lime-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>History & Updates</button>
        </div>
      </div>

      {activeTab === 'new' && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 animate-fade-in-up">
          <h3 className="font-bold text-slate-800 text-lg mb-1">Request Time Off</h3>
          <p className="text-slate-500 text-sm mb-6">Send a notification to HR for approval.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Leave Type</label>
                <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-lime-500 transition-colors">
                  <option>Casual Leave</option>
                  <option>Sick Leave</option>
                  <option>Privilege Leave</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Days Required</label>
                <input type="number" value={days} onChange={(e) => setDays(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-lime-500 transition-colors" placeholder="e.g. 2"/>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Reason</label>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-lime-500 transition-colors" placeholder="Briefly explain why..."></textarea>
            </div>
            <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
              <Send size={18} /> Send Request to HR
            </button>
          </form>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4 animate-fade-in-up">
          {myRequests.length === 0 ? (
             <div className="text-center py-10 text-slate-400">No requests found.</div>
          ) : (
            myRequests.map((req) => (
              <div key={req.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 
                  ${req.status === 'Approved' ? 'bg-green-100 text-green-600' : req.status === 'Rejected' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                  {req.status === 'Approved' ? <CheckCircle size={20}/> : req.status === 'Rejected' ? <AlertCircle size={20}/> : <Clock size={20}/>}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h4 className="font-bold text-slate-800">{req.type} ({req.days} days)</h4>
                    <span className="text-xs text-slate-400">{req.date}</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">Reason: {req.reason}</p>
                  <p className={`text-xs font-bold mt-2 
                    ${req.status === 'Approved' ? 'text-green-600' : req.status === 'Rejected' ? 'text-red-600' : 'text-orange-500'}`}>
                    Status: {req.status}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// Placeholder Pages
const MyTeam = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-slate-800">My Team</h2>
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center text-slate-400">
       My Team Directory
    </div>
  </div>
);

const EmployeePayslips = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-slate-800">My Payslips</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-slate-400 text-sm font-medium mb-1">Net Salary (Oct 2025)</p>
          <h1 className="text-4xl font-bold">$4,250.00</h1>
          <button className="mt-6 bg-lime-500 text-slate-900 px-4 py-2 rounded-xl text-sm font-bold hover:bg-lime-400 flex items-center gap-2">
            <Download size={16}/> Download Slip
          </button>
        </div>
      </div>
    </div>
  </div>
);

const EmployeeProfile = ({ userImage, onImageChange }: { userImage: string, onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeModal, setActiveModal] = useState<'none' | 'password' | 'notifications'>('none');

  const handleSave = () => {
    setActiveModal('none');
    alert("Settings Updated Successfully!");
  };

  return (
    <div className="max-w-4xl space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-24 bg-gradient-to-r from-lime-50 to-green-50 opacity-50"></div>
        
        <div className="relative mt-4 md:mt-0 group">
          <img src={userImage} className="w-32 h-32 rounded-full border-4 border-white shadow-xl relative z-10 object-cover" alt="Profile" />
          <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-1 right-1 z-20 bg-slate-900 text-white p-2 rounded-full shadow-md hover:bg-lime-500 transition-colors">
            <Camera size={16} />
          </button>
          <input type="file" ref={fileInputRef} onChange={onImageChange} className="hidden" accept="image/*" />
        </div>
        
        <div className="flex-1 text-center md:text-left relative z-10 pt-6">
          <h1 className="text-3xl font-bold text-slate-800">Alex Johnson</h1>
          <p className="text-lime-600 font-medium text-lg mb-4">Senior Frontend Developer</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 text-slate-500 text-sm">
            <span className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm"><MapPin size={14}/> San Francisco, CA</span>
            <span className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm"><Clock size={14}/> Full-Time</span>
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-lg"><User size={20} className="text-lime-600"/> Personal Details</h3>
          <div className="space-y-6">
            <div className="border-b border-slate-50 pb-4"><label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Employee ID</label><p className="font-medium text-slate-700 mt-1">EMP-2025-042</p></div>
            <div className="border-b border-slate-50 pb-4"><label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Email</label><p className="font-medium text-slate-700 mt-1">alex.johnson@innvoix.com</p></div>
            <div><label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Phone</label><p className="font-medium text-slate-700 mt-1">+1 (555) 987-6543</p></div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-lg"><Shield size={20} className="text-lime-600"/> Settings</h3>
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-50 pb-4">
              <div><label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Password</label><p className="font-medium text-slate-700 mt-1">••••••••••••</p></div>
              <button onClick={() => setActiveModal('password')} className="text-lime-600 text-sm font-bold hover:underline">Update</button>
            </div>
            <div className="flex justify-between items-center">
              <div><label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Notifications</label><p className="font-medium text-slate-500 mt-1 text-sm">Email & Slack</p></div>
              <button onClick={() => setActiveModal('notifications')} className="text-slate-400 text-sm font-bold hover:text-lime-600">Edit</button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {activeModal === 'password' && (
        <EditModal title="Update Password" onClose={() => setActiveModal('none')}>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label><input type="password" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-lime-500 outline-none"/></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">New Password</label><input type="password" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-lime-500 outline-none"/></div>
            <button onClick={handleSave} className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-slate-800">Update Password</button>
          </div>
        </EditModal>
      )}
      {activeModal === 'notifications' && (
        <EditModal title="Notification Preferences" onClose={() => setActiveModal('none')}>
          <div className="space-y-4">
            {['Email Notifications', 'Slack Alerts', 'Browser Push', 'SMS Alerts'].map(opt => (
              <label key={opt} className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 text-lime-500 rounded focus:ring-lime-500"/>
                <span className="text-sm font-medium text-slate-700">{opt}</span>
              </label>
            ))}
            <button onClick={handleSave} className="w-full bg-lime-500 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-lime-600 shadow-lg shadow-lime-200">Save Preferences</button>
          </div>
        </EditModal>
      )}
    </div>
  );
};

// --- MAIN EMPLOYEE DASHBOARD COMPONENT ---
interface EmployeeDashboardProps {
  onLogout: () => void;
}

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ onLogout }) => {
  const [activePage, setActivePage] = useState('dashboard');
  const [alexImage, setAlexImage] = useState("https://i.pravatar.cc/150?img=12");

  const alexUser = {
    name: "Alex Johnson",
    role: "Employee",
    image: alexImage
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      setAlexImage(imageUrl);
    }
  };

  const renderContent = () => {
    switch(activePage) {
      case 'dashboard': return <EmployeeDashboardOverview setActivePage={setActivePage} />;
      case 'chat': return <AIChatPage />; // <--- NEW CHAT PAGE ROUTE
      case 'employees': return <MyTeam />;
      case 'recruiting': return <div className="text-center py-20 text-slate-400">Referral Program Coming Soon</div>;
      case 'payroll': return <EmployeePayslips />;
      case 'notifications': return <NotificationsPage />; 
      case 'profile': return <EmployeeProfile userImage={alexImage} onImageChange={handleImageChange} />;
      default: return <EmployeeDashboardOverview setActivePage={setActivePage} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] font-sans text-slate-900 relative">
      <Sidebar activePage={activePage} setActivePage={setActivePage} onLogout={onLogout} role="employee" user={alexUser} />
      
      <main className="flex-1 ml-64 p-8 transition-all duration-300">
        {/* Header */}
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-400 capitalize tracking-tight">
            {activePage === 'dashboard' ? 'Overview' : activePage.replace('-', ' ')}
          </h1>
          
          <div className="flex items-center gap-4">
             {/* CHAT ICON IN HEADER (Opens Full Page Now) */}
             <button 
                onClick={() => setActivePage('chat')} 
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm border transition-all relative 
                  ${activePage === 'chat' ? 'bg-lime-500 text-white border-lime-500' : 'bg-white border-slate-200 text-slate-500 hover:text-lime-600'}`}
             >
               <MessageSquare size={18} />
             </button>

             {/* NOTIFICATIONS ICON */}
             <button 
                onClick={() => setActivePage('notifications')}
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm border transition-all relative
                  ${activePage === 'notifications' ? 'bg-lime-500 text-white border-lime-500' : 'bg-white border-slate-200 text-slate-500 hover:text-lime-600'}`}
             >
               <BellRing size={20} />
             </button>
             
             <div className="h-8 w-px bg-slate-200 mx-2"></div>
             
             <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-slate-700">{alexUser.name}</p>
                <p className="text-xs text-slate-400">{alexUser.role}</p>
             </div>
             <img src={alexUser.image} className="w-10 h-10 rounded-full border-2 border-white shadow-sm cursor-pointer object-cover" onClick={() => setActivePage('profile')} alt="profile"/>
          </div>
        </header>

        {/* Content Area */}
        <div className="animate-fade-in-up">
           {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default EmployeeDashboard;
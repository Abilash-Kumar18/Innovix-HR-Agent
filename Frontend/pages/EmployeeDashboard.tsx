import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar'; 
import { User, MapPin, Shield, BellRing, CheckCircle, FileText, Download, Clock, Send, ChevronRight, MessageSquare, Camera, X, Plus, AlertCircle, Bot } from 'lucide-react';

// --- DATA TYPES ---
interface EmployeeData {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  location: string;
  image: string;
  leaves: {
    casual: number;
    sick: number;
    privilege: number;
  };
}

// --- SHARED DATA SERVICE ---
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

// --- 1. FULL PAGE AI CHAT COMPONENT ---
const AIChatPage = () => {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'ai', text: 'Hi! 👋 I am your Innvoix HR Assistant.\n\nI can help you with:\n• Checking leave balances\n• Payroll questions\n• Company holiday list\n\nHow can I help you today?' }
  ]);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    const newMsg = { id: Date.now(), sender: 'user', text: inputText };
    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    
    setTimeout(() => {
      let reply = "I'm still learning, but I can help connect you with HR!";
      const lowerInput = inputText.toLowerCase();
      
      if (lowerInput.includes('leave') || lowerInput.includes('balance')) {
        reply = "You currently have:\n• 4 Casual Leaves\n• 8 Sick Leaves\n• 15 Privilege Leaves\n\nWould you like to apply for one?";
      } else if (lowerInput.includes('payroll') || lowerInput.includes('salary')) {
        reply = "Your latest payslip has been generated. The net amount is $4,250.00.";
      }

      setMessages(prev => [...prev, { id: Date.now()+1, sender: 'ai', text: reply }]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in-up">
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

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-slate-200 hidden' : 'bg-lime-100 text-lime-600'}`}>
                {msg.sender === 'ai' && <Bot size={16}/>}
              </div>
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
      </div>
    </div>
  );
};

// --- 2. MODAL COMPONENTS ---
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

// 1. UPDATED DASHBOARD OVERVIEW 
const EmployeeDashboardOverview = ({ employeeData, setActivePage }: { employeeData: EmployeeData | null, setActivePage: (page: string) => void }) => {
  if (!employeeData) return <div className="p-10 text-slate-400">Loading Dashboard...</div>;

  return (
    <div className="space-y-6">
      
      {/* Header Row: Title & Black Ask AI Copilot Button */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
          <p className="text-slate-500">Welcome back, here is what's happening today.</p>
        </div>
        
        <button 
          onClick={() => setActivePage('chat')}
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-slate-200 transition-all flex items-center gap-2"
        >
          <MessageSquare size={18} className="text-lime-400"/> Ask AI Copilot
        </button>
      </div>

      {/* Welcome Card (No View Profile Button) */}
      <div className="bg-gradient-to-r from-lime-400 to-green-500 rounded-3xl p-8 text-white shadow-lg shadow-lime-100 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">Welcome Back, {employeeData.name.split(' ')[0]}! 👋</h2>
          <p className="opacity-90 max-w-lg text-lg">
            You have 2 pending tasks and your next leave starts in 4 days.
          </p>
        </div>
        <div className="absolute -right-10 -bottom-20 w-64 h-64 bg-white opacity-10 rounded-full blur-2xl"></div>
      </div>

      {/* Leave Balance Stats */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4">Leave Balance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm text-center group hover:shadow-md transition-all">
            <div className="w-20 h-20 mx-auto bg-gradient-to-b from-lime-300 to-lime-500 rounded-full mb-4 shadow-inner group-hover:scale-105 transition-transform flex items-center justify-center text-white font-bold text-2xl pt-1">
              {employeeData.leaves.casual}
            </div>
            <h4 className="font-bold text-slate-700 text-lg">Casual</h4>
            <p className="text-sm text-slate-400">Days Left</p>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm text-center group hover:shadow-md transition-all">
            <div className="w-20 h-20 mx-auto bg-gradient-to-b from-orange-300 to-orange-500 rounded-full mb-4 shadow-inner group-hover:scale-105 transition-transform flex items-center justify-center text-white font-bold text-2xl pt-1">
              {employeeData.leaves.sick}
            </div>
            <h4 className="font-bold text-slate-700 text-lg">Sick</h4>
            <p className="text-sm text-slate-400">Days Left</p>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm text-center group hover:shadow-md transition-all">
            <div className="w-20 h-20 mx-auto bg-gradient-to-b from-blue-300 to-blue-500 rounded-full mb-4 shadow-inner group-hover:scale-105 transition-transform flex items-center justify-center text-white font-bold text-2xl pt-1">
              {employeeData.leaves.privilege}
            </div>
            <h4 className="font-bold text-slate-700 text-lg">Privilege</h4>
            <p className="text-sm text-slate-400">Days Left</p>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Recent Activity</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center"><FileText size={20}/></div>
            <div><h4 className="font-bold text-slate-700">Payslip Generated</h4><p className="text-xs text-slate-400">Oct 2025</p></div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center"><CheckCircle size={20}/></div>
            <div><h4 className="font-bold text-slate-700">Leave Approved</h4><p className="text-xs text-slate-400">Sick Leave (1 Day)</p></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. UPDATED NOTIFICATIONS PAGE (Full Width + Green Button)
const NotificationsPage = ({ employeeData }: { employeeData: EmployeeData | null }) => {
  const [activeTab, setActiveTab] = useState('new');
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [days, setDays] = useState('');
  const [reason, setReason] = useState('');
  const [myRequests, setMyRequests] = useState<any[]>([]);

  useEffect(() => {
    const allRequests = getLeaveRequests();
    const empName = employeeData?.name || 'Alex Johnson';
    setMyRequests(allRequests.filter((req: any) => req.employeeName === empName));
  }, [activeTab, employeeData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!days || !reason) return;

    sendLeaveRequest({
      employeeName: employeeData?.name || 'Alex Johnson',
      role: employeeData?.role || 'Employee',
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
    <div className="w-full space-y-6"> {/* Full Width */}
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
            
            {/* GREEN SEND BUTTON */}
            <button type="submit" className="w-full bg-lime-500 hover:bg-lime-600 text-slate-900 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-lime-100">
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

// 3. UPDATED PROFILE
const EmployeeProfile = ({ data, onImageChange }: { data: EmployeeData | null, onImageChange: any }) => {
  if (!data) return <div>Loading...</div>;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeModal, setActiveModal] = useState<'none' | 'password' | 'notifications'>('none');

  const handleSave = () => {
    setActiveModal('none');
    alert("Settings Updated Successfully!");
  };

  return (
    <div className="max-w-4xl space-y-8 animate-fade-in-up">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-24 bg-gradient-to-r from-lime-50 to-green-50 opacity-50"></div>
        <div className="relative mt-4 md:mt-0 group">
          <img src={data.image} className="w-32 h-32 rounded-full border-4 border-white shadow-xl relative z-10 object-cover" alt="Profile" />
          <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-1 right-1 z-20 bg-slate-900 text-white p-2 rounded-full shadow-md hover:bg-lime-500 transition-colors">
            <Camera size={16} />
          </button>
          <input type="file" ref={fileInputRef} onChange={onImageChange} className="hidden" accept="image/*" />
        </div>
        <div className="flex-1 text-center md:text-left relative z-10 pt-6">
          <h1 className="text-3xl font-bold text-slate-800">{data.name}</h1>
          <p className="text-lime-600 font-medium text-lg mb-4">{data.role}</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 text-slate-500 text-sm">
            <span className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm"><MapPin size={14}/> {data.location}</span>
            <span className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm"><Clock size={14}/> Full-Time</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-lg"><User size={20} className="text-lime-600"/> Personal Details</h3>
          <div className="space-y-6">
            <div className="border-b border-slate-50 pb-4"><label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Employee ID</label><p className="font-medium text-slate-700 mt-1">{data.id}</p></div>
            <div className="border-b border-slate-50 pb-4"><label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Email</label><p className="font-medium text-slate-700 mt-1">{data.email}</p></div>
            <div><label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Phone</label><p className="font-medium text-slate-700 mt-1">{data.phone}</p></div>
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

// Placeholder Pages
const MyTeam = () => (<div className="p-10 text-center text-slate-400">Team Directory Placeholder</div>);
const EmployeePayslips = () => (<div className="p-10 text-center text-slate-400">Payslips Placeholder</div>);

// 4. MAIN DASHBOARD COMPONENT
interface EmployeeDashboardProps { onLogout: () => void; }

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ onLogout }) => {
  const [activePage, setActivePage] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);

  useEffect(() => {
    // Simulating Real API Call
    setTimeout(() => {
      setEmployeeData({
        id: "EMP-2025-042",
        name: "Alex Johnson",
        role: "Senior Frontend Developer",
        department: "Engineering",
        email: "alex.johnson@innvoix.com",
        phone: "+1 (555) 987-6543",
        location: "San Francisco, CA",
        image: "https://i.pravatar.cc/150?img=12",
        leaves: { casual: 4, sick: 8, privilege: 15 }
      });
    }, 500);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      setEmployeeData(prev => prev ? { ...prev, image: imageUrl } : null);
    }
  };

  const renderContent = () => {
    switch(activePage) {
      case 'dashboard': return <EmployeeDashboardOverview employeeData={employeeData} setActivePage={setActivePage} />;
      case 'chat': return <AIChatPage />; 
      case 'employees': return <MyTeam />;
      case 'payroll': return <EmployeePayslips />;
      case 'notifications': return <NotificationsPage employeeData={employeeData} />; 
      case 'profile': return <EmployeeProfile data={employeeData} onImageChange={handleImageChange} />;
      default: return <EmployeeDashboardOverview employeeData={employeeData} setActivePage={setActivePage} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] font-sans text-slate-900 relative">
      
      {/* Sidebar */}
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        onLogout={onLogout} 
        role="employee" 
        user={employeeData ? { name: employeeData.name, role: employeeData.role, image: employeeData.image } : undefined}
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      {/* Main Content */}
      <main className={`flex-1 p-8 transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        
        {/* Header - No Chat Icon */}
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-400 capitalize tracking-tight">
            {activePage === 'dashboard' ? 'Overview' : activePage.replace('-', ' ')}
          </h1>
          
          <div className="flex items-center gap-4">
             {/* Only Notification & User Profile Here */}
             <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 text-slate-500 hover:text-lime-600 transition-all relative" onClick={() => setActivePage('notifications')}>
               <BellRing size={20} />
             </button>
             <div className="h-8 w-px bg-slate-200 mx-2"></div>
             
             <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-slate-700">{employeeData?.name || 'Loading...'}</p>
                <p className="text-xs text-slate-400">{employeeData?.role || '...'}</p>
             </div>
             <img 
               src={employeeData?.image || "https://via.placeholder.com/150"} 
               className="w-10 h-10 rounded-full border-2 border-white shadow-sm cursor-pointer object-cover bg-slate-200" 
               onClick={() => setActivePage('profile')} 
               alt="profile"
             />
          </div>
        </header>

        <div className="animate-fade-in-up">
           {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default EmployeeDashboard;
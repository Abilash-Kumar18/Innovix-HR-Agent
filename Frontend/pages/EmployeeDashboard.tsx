import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar'; 
import { User, MapPin, Shield, BellRing, CheckCircle, Clock, Send, MessageSquare, Camera, X, Bot } from 'lucide-react';
import { sendMessageToBackend, api } from '../services/api';

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

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

// --- 1. FULL PAGE AI CHAT COMPONENT ---
const AIChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hi! 👋 I am your Innvoix HR Assistant.\n\nI can help you with:\n• Checking leave balances\n• Onboarding tasks\n• Company policies\n\nHow can I help you today?", sender: 'bot' }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = { id: Date.now(), text: inputText, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputText;
    setInputText(''); 
    setIsLoading(true);

    try {
      // FIX: Use the Real User ID
      const userId = localStorage.getItem('current_user_id') || "guest";
      const botResponseText = await sendMessageToBackend(currentInput, userId);

      const botMessage: Message = { id: Date.now() + 1, text: botResponseText, sender: 'bot' };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now(), text: "⚠️ Error connecting to the HR Agent.", sender: 'bot' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-white">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-lime-400 to-green-500 flex items-center justify-center text-white shadow-md">
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
              <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.sender === 'user' ? 'bg-slate-900 text-white rounded-tr-sm' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm'}`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isLoading && <div className="text-slate-400 text-sm ml-12">Typing...</div>}
        <div ref={chatEndRef} />
      </div>
      <div className="p-6 bg-white border-t border-slate-100">
        <div className="flex gap-4 items-center bg-slate-50 p-2 rounded-full border border-slate-200">
          <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Ask about leaves or policies..." className="flex-1 bg-transparent px-4 py-2 text-slate-700 focus:outline-none" onKeyPress={(e) => e.key === 'Enter' && handleSend()} disabled={isLoading} />
          <button onClick={handleSend} disabled={!inputText.trim() || isLoading} className="w-10 h-10 bg-lime-500 hover:bg-lime-600 text-white rounded-full flex items-center justify-center shadow-md"><Send size={18} /></button>
        </div>
      </div>
    </div>
  );
};

// --- 2. MODAL & PROFILE COMPONENTS ---
const EditModal = ({ title, onClose, children }: { title: string, onClose: () => void, children: React.ReactNode }) => (
  <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
        <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-red-500"/></button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

const EmployeeDashboardOverview = ({ employeeData }: { employeeData: EmployeeData | null }) => {
  if (!employeeData) return <div className="p-10 text-slate-400">Loading Dashboard Data...</div>;
  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-lime-400 to-green-500 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">Welcome Back, {employeeData.name.split(' ')[0]}! 👋</h2>
          <p className="opacity-90 text-lg">You have {employeeData.leaves.casual} casual leaves remaining.</p>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4">Leave Balance (Live)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm text-center">
            <div className="w-20 h-20 mx-auto bg-gradient-to-b from-lime-300 to-lime-500 rounded-full mb-4 shadow-inner flex items-center justify-center text-white font-bold text-2xl">{employeeData.leaves.casual}</div>
            <h4 className="font-bold text-slate-700">Casual</h4>
          </div>
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm text-center">
            <div className="w-20 h-20 mx-auto bg-gradient-to-b from-orange-300 to-orange-500 rounded-full mb-4 shadow-inner flex items-center justify-center text-white font-bold text-2xl">{employeeData.leaves.sick}</div>
            <h4 className="font-bold text-slate-700">Sick</h4>
          </div>
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm text-center">
            <div className="w-20 h-20 mx-auto bg-gradient-to-b from-blue-300 to-blue-500 rounded-full mb-4 shadow-inner flex items-center justify-center text-white font-bold text-2xl">{employeeData.leaves.privilege}</div>
            <h4 className="font-bold text-slate-700">Privilege</h4>
          </div>
        </div>
      </div>
    </div>
  );
};

const EmployeeProfile = ({ data, onImageChange }: { data: EmployeeData | null, onImageChange: any }) => {
  if (!data) return <div>Loading...</div>;
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="max-w-4xl space-y-8 animate-fade-in-up">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
        <div className="relative group">
          <img src={data.image} className="w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover" alt="Profile" />
          <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-1 right-1 bg-slate-900 text-white p-2 rounded-full"><Camera size={16} /></button>
          <input type="file" ref={fileInputRef} onChange={onImageChange} className="hidden" accept="image/*" />
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-bold text-slate-800">{data.name}</h1>
          <p className="text-lime-600 font-medium text-lg mb-4 capitalize">{data.role}</p>
          <span className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm text-slate-500 text-sm"><MapPin size={14}/> {data.location}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><User size={20} className="text-lime-600"/> Personal Details</h3>
          <div className="space-y-6">
            <div className="border-b border-slate-50 pb-4"><label className="text-xs text-slate-400 font-bold uppercase">Email</label><p className="font-medium text-slate-700">{data.email}</p></div>
            <div><label className="text-xs text-slate-400 font-bold uppercase">Phone</label><p className="font-medium text-slate-700">{data.phone}</p></div>
          </div>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><Shield size={20} className="text-lime-600"/> Settings</h3>
          <div className="space-y-6">
             <div className="flex justify-between"><label className="text-slate-700 font-medium">Password</label><button className="text-lime-600 font-bold text-sm">Update</button></div>
             <div className="flex justify-between"><label className="text-slate-700 font-medium">Notifications</label><button className="text-lime-600 font-bold text-sm">Edit</button></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 4. MAIN DASHBOARD COMPONENT ---
interface EmployeeDashboardProps { onLogout: () => void; }

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ onLogout }) => {
  const [activePage, setActivePage] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);

  // --- FETCH REAL DATA USING LOGGED IN ID ---
  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const userId = localStorage.getItem('current_user_id');
        if (!userId) {
          console.warn("No User ID found. Redirecting...");
          onLogout();
          return;
        }

        // Call the specific user endpoint
        const response = await api.get(`/api/users/${userId}`);
        const user = response.data.data;

        setEmployeeData({
          id: user.id,
          name: user.name,
          role: user.role,
          department: user.department,
          email: user.email,
          phone: user.phone,
          location: user.location,
          image: user.image,
          leaves: {
            casual: user.casual_leaves_left || 12,
            sick: user.sick_leaves_left || 7,
            privilege: 15
          }
        });
      } catch (error) {
        console.error("❌ Failed to load profile:", error);
      }
    };
    fetchEmployeeData();
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
      case 'dashboard': return <EmployeeDashboardOverview employeeData={employeeData} />;
      case 'chat': return <AIChatPage />; 
      case 'profile': return <EmployeeProfile data={employeeData} onImageChange={handleImageChange} />;
      default: return <EmployeeDashboardOverview employeeData={employeeData} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] font-sans text-slate-900 relative">
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        onLogout={onLogout} 
        role="employee" 
        user={employeeData ? { name: employeeData.name, role: employeeData.role, image: employeeData.image } : undefined}
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      <main className={`flex-1 p-8 transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-400 capitalize tracking-tight">
            {activePage === 'dashboard' ? 'Overview' : activePage.replace('-', ' ')}
          </h1>
          <div className="flex items-center gap-4">
             <button onClick={() => setActivePage('chat')} className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm border bg-white border-slate-200 text-slate-500 hover:text-lime-600 transition-all"><MessageSquare size={18} /></button>
             <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 text-slate-500 hover:text-lime-600 transition-all"><BellRing size={20} /></button>
             <div className="h-8 w-px bg-slate-200 mx-2"></div>
             <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-slate-700">{employeeData?.name || 'Loading...'}</p>
                <p className="text-xs text-slate-400 capitalize">{employeeData?.role || '...'}</p>
             </div>
             <img src={employeeData?.image || "https://via.placeholder.com/150"} className="w-10 h-10 rounded-full border-2 border-white shadow-sm cursor-pointer object-cover bg-slate-200" onClick={() => setActivePage('profile')} alt="profile"/>
          </div>
        </header>
        <div className="animate-fade-in-up">{renderContent()}</div>
      </main>
    </div>
  );
};

export default EmployeeDashboard;

import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { UserRole, Employee, ChatMessage } from '../types';
import { 
  Users, 
  Calendar, 
  UserPlus, 
  Search, 
  Plus, 
  CheckCircle, 
  Megaphone,
  Send,
  Loader2
} from 'lucide-react';
import { getGeminiResponse } from '../services/geminiService';

const EMPLOYEES: Employee[] = [
  { id: '1', name: 'John Doe', role: 'Software Engineer', email: 'john@company.com', status: 'Active', department: 'Tech' },
  { id: '2', name: 'Sarah Smith', role: 'Product Designer', email: 'sarah@company.com', status: 'On Leave', department: 'Design' },
  { id: '3', name: 'Michael Chen', role: 'Product Manager', email: 'michael@company.com', status: 'Remote', department: 'Product' },
  { id: '4', name: 'Emma Wilson', role: 'QA Lead', email: 'emma@company.com', status: 'Active', department: 'Tech' },
  { id: '5', name: 'David Brown', role: 'DevOps Engineer', email: 'david@company.com', status: 'Active', department: 'Tech' },
];

const HRDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const handleAISearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMsg = query;
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    const response = await getGeminiResponse(userMsg, 'HR');
    setMessages(prev => [...prev, { role: 'model', text: response }]);
    setIsTyping(false);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={UserRole.HR} onLogout={onLogout} />

      <main className="flex-1 ml-64 p-8 overflow-y-auto bg-[#F8F9FA]">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Workforce Dashboard</h1>
            <p className="text-gray-500">Welcome back, HR Admin</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-full border border-gray-100 flex items-center gap-3 pr-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-b from-[#C0E364] to-[#4CAF50] flex items-center justify-center text-white font-bold">HR</div>
              <span className="font-semibold text-gray-700">Admin User</span>
            </div>
          </div>
        </header>

        {/* AI Agent Search Bar */}
        <section className="mb-8">
          <form onSubmit={handleAISearch} className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#4CAF50]" size={24} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask the AI Agent anything (e.g., 'Who is on leave today?')"
              className="w-full pl-16 pr-20 py-6 bg-white rounded-[2rem] border border-transparent focus:border-[#4CAF50] shadow-sm focus:shadow-md transition-all text-lg outline-none"
            />
            <button 
              type="submit"
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-gradient-to-b from-[#C0E364] to-[#4CAF50] text-white flex items-center justify-center group-hover:scale-105 transition-all"
            >
              <Send size={20} />
            </button>
          </form>

          {messages.length > 0 && (
            <div className="mt-4 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 max-h-60 overflow-y-auto">
              {messages.map((msg, i) => (
                <div key={i} className={`mb-4 ${msg.role === 'model' ? 'bg-gray-50' : ''} p-4 rounded-2xl`}>
                  <span className="text-xs font-bold uppercase text-[#4CAF50] block mb-1">
                    {msg.role === 'model' ? 'Innvoix Agent' : 'You'}
                  </span>
                  <p className="text-gray-700">{msg.text}</p>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-center gap-2 text-gray-400 p-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Agent is thinking...</span>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Total Employees', value: '154', icon: <Users />, color: 'text-blue-500' },
            { label: 'On Leave Today', value: '08', icon: <Calendar />, color: 'text-orange-500' },
            { label: 'New Hires', value: '12', icon: <UserPlus />, color: 'text-emerald-500' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-8 rounded-[2rem] capsule-shadow flex items-center justify-between">
              <div>
                <p className="text-gray-500 font-medium mb-1">{stat.label}</p>
                <h3 className="text-4xl font-bold text-gray-900">{stat.value}</h3>
              </div>
              <div className={`w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center ${stat.color}`}>
                {React.cloneElement(stat.icon as React.ReactElement, { size: 28 })}
              </div>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Employee Directory */}
          <section className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-50">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Employee Directory</h2>
              <button className="text-[#4CAF50] font-semibold hover:underline">View All</button>
            </div>
            <div className="space-y-4">
              {EMPLOYEES.map((emp) => (
                <div key={emp.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                      {emp.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">{emp.name}</h4>
                      <p className="text-sm text-gray-500">{emp.role} • {emp.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-4 py-1 rounded-full text-xs font-bold ${
                      emp.status === 'Active' ? 'bg-green-100 text-green-600' :
                      emp.status === 'On Leave' ? 'bg-orange-100 text-orange-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {emp.status}
                    </span>
                    <button className="px-4 py-2 rounded-full border border-gray-100 text-sm font-semibold hover:bg-white hover:border-[#4CAF50] transition-all">Details</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Actions */}
          <section className="space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-50">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Quick Actions</h2>
              <div className="space-y-4">
                <button className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-[#C0E364]/10 transition-all group">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#4CAF50] shadow-sm">
                    <Plus size={20} />
                  </div>
                  <span className="font-bold text-gray-700">Add Employee</span>
                </button>
                <button className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-[#C0E364]/10 transition-all group">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#4CAF50] shadow-sm">
                    <CheckCircle size={20} />
                  </div>
                  <span className="font-bold text-gray-700">Approve Leave</span>
                </button>
                <button className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-[#C0E364]/10 transition-all group">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#4CAF50] shadow-sm">
                    <Megaphone size={20} />
                  </div>
                  <span className="font-bold text-gray-700">Post Announcement</span>
                </button>
              </div>
            </div>

            {/* Upcoming Birthdays/Events - Bonus Feature */}
            <div className="bg-gradient-to-br from-[#4CAF50] to-[#C0E364] rounded-[2.5rem] p-8 text-white shadow-lg">
              <h2 className="text-xl font-bold mb-4">Announcements</h2>
              <p className="text-white/80 text-sm leading-relaxed mb-6">
                Monthly town hall is scheduled for Friday at 10:00 AM. Please ensure your department reports are submitted.
              </p>
              <button className="w-full py-3 bg-white/20 hover:bg-white/30 rounded-full font-bold transition-all">
                Learn More
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default HRDashboard;

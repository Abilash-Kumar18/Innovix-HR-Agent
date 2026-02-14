
import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { UserRole, ChatMessage } from '../types';
import { 
  Send,
  Loader2,
  Calendar,
  FileText,
  Clock,
  ArrowRight
} from 'lucide-react';
import { getGeminiResponse } from '../services/geminiService';

const EmployeeDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const handleAIChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMsg = query;
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    const response = await getGeminiResponse(userMsg, 'EMPLOYEE');
    setMessages(prev => [...prev, { role: 'model', text: response }]);
    setIsTyping(false);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={UserRole.EMPLOYEE} onLogout={onLogout} />

      <main className="flex-1 ml-64 p-8 overflow-y-auto bg-[#F8F9FA]">
        {/* Welcome Banner */}
        <section className="relative overflow-hidden bg-gradient-to-r from-[#C0E364] to-[#4CAF50] rounded-[3rem] p-10 text-white mb-10 shadow-lg">
          <div className="relative z-10 max-w-lg">
            <h1 className="text-4xl font-bold mb-2">Welcome Back, Alex!</h1>
            <p className="text-white/90 text-lg mb-6">You have 2 pending tasks and your next leave starts in 4 days.</p>
            <button className="bg-white text-[#4CAF50] px-8 py-3 rounded-full font-bold hover:shadow-xl transition-all">
              View Profile
            </button>
          </div>
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-2xl"></div>
          <div className="absolute right-40 bottom-0 w-40 h-40 bg-white/10 rounded-full -mb-20 blur-xl"></div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Leave Balance Pills (Capsule Theme) */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Leave Balance</h2>
              <div className="grid grid-cols-3 gap-6">
                {[
                  { label: 'Casual', total: 12, used: 8, color: 'from-[#C0E364] to-[#4CAF50]' },
                  { label: 'Sick', total: 10, used: 2, color: 'from-orange-300 to-orange-500' },
                  { label: 'Privilege', total: 15, used: 0, color: 'from-blue-300 to-blue-500' },
                ].map((leave, i) => (
                  <div key={i} className="bg-white rounded-[3rem] p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
                    <div className={`w-16 h-28 rounded-full bg-gradient-to-b ${leave.color} p-1 mb-4 relative flex flex-col justify-end`}>
                      <div className="absolute top-4 left-0 w-full text-white text-xs font-bold">
                        {leave.total - leave.used}
                      </div>
                      <div className="w-full bg-white/30 rounded-full" style={{ height: `${((leave.total - leave.used) / leave.total) * 100}%` }}></div>
                    </div>
                    <span className="font-bold text-gray-800">{leave.label}</span>
                    <span className="text-xs text-gray-500">Days Left</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Recent Activity */}
            <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-50">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Activity</h2>
              <div className="space-y-6">
                {[
                  { title: 'Leave Request Approved', date: 'Oct 12, 2024', status: 'Approved', icon: <Calendar className="text-green-500" /> },
                  { title: 'Payroll Slips Updated', date: 'Oct 01, 2024', status: 'Viewed', icon: <FileText className="text-blue-500" /> },
                  { title: 'Shift Schedule Change', date: 'Sep 28, 2024', status: 'Pending', icon: <Clock className="text-orange-500" /> },
                ].map((activity, i) => (
                  <div key={i} className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                        {activity.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 group-hover:text-[#4CAF50] transition-colors">{activity.title}</h4>
                        <p className="text-sm text-gray-500">{activity.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-4 py-1 rounded-full text-xs font-bold ${
                        activity.status === 'Approved' ? 'bg-green-100 text-green-600' :
                        activity.status === 'Pending' ? 'bg-orange-100 text-orange-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {activity.status}
                      </span>
                      <ArrowRight size={16} className="text-gray-300 group-hover:text-[#4CAF50] transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* AI Assistant Chat Panel */}
          <div className="flex flex-col h-[700px]">
            <section className="flex-1 bg-white rounded-[2.5rem] shadow-sm border border-gray-50 flex flex-col overflow-hidden">
              <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-b from-[#C0E364] to-[#4CAF50] flex items-center justify-center text-white">
                  <Loader2 className={isTyping ? "animate-spin" : ""} size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">AI Assistant</h3>
                  <p className="text-xs text-green-600 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    Online
                  </p>
                </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {messages.length === 0 && (
                  <div className="text-center mt-10">
                    <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4 text-[#4CAF50]">
                      <Send size={32} />
                    </div>
                    <p className="text-gray-500 text-sm">Ask me about leave policies, payroll, or company holidays.</p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl ${
                      msg.role === 'user' 
                        ? 'bg-gradient-to-b from-[#C0E364] to-[#4CAF50] text-white rounded-br-none' 
                        : 'bg-gray-100 text-gray-800 rounded-bl-none'
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 p-4 rounded-2xl rounded-bl-none flex gap-1">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleAIChat} className="p-4 border-t border-gray-50">
                <div className="relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full pl-6 pr-14 py-4 bg-gray-50 border border-transparent focus:border-[#4CAF50] rounded-full text-sm outline-none transition-all"
                  />
                  <button 
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-gradient-to-b from-[#C0E364] to-[#4CAF50] text-white flex items-center justify-center hover:scale-105 transition-all"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmployeeDashboard;

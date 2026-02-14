
import React from 'react';
import { UserRole } from '../types';
import { Briefcase, User } from 'lucide-react';

interface LandingPageProps {
  onSelectRole: (role: UserRole) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSelectRole }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="text-center mb-12">
        <div className="w-20 h-20 rounded-full bg-gradient-to-b from-[#C0E364] to-[#4CAF50] mx-auto mb-6 flex items-center justify-center text-white text-3xl font-bold shadow-lg">I</div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Welcome to Innvoix HR Portal</h1>
        <p className="text-gray-500 text-lg">Select your role to continue to the dashboard.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
        <button
          onClick={() => onSelectRole(UserRole.HR)}
          className="group relative bg-white p-10 rounded-[3rem] border-2 border-transparent hover:border-[#4CAF50] transition-all capsule-shadow flex flex-col items-center text-center"
        >
          <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center text-[#4CAF50] mb-6 group-hover:scale-110 transition-transform">
            <Briefcase size={48} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">I am an HR Manager</h2>
          <p className="text-gray-500">Access workforce insights, recruiting tools, and payroll management.</p>
          <div className="mt-8 px-8 py-3 rounded-full bg-gradient-to-b from-[#C0E364] to-[#4CAF50] text-white font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
            Enter Portal
          </div>
        </button>

        <button
          onClick={() => onSelectRole(UserRole.EMPLOYEE)}
          className="group relative bg-white p-10 rounded-[3rem] border-2 border-transparent hover:border-[#4CAF50] transition-all capsule-shadow flex flex-col items-center text-center"
        >
          <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center text-[#4CAF50] mb-6 group-hover:scale-110 transition-transform">
            <User size={48} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">I am an Employee</h2>
          <p className="text-gray-500">Manage your profile, view payslips, and request leaves.</p>
          <div className="mt-8 px-8 py-3 rounded-full bg-gradient-to-b from-[#C0E364] to-[#4CAF50] text-white font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
            Enter Portal
          </div>
        </button>
      </div>

      <footer className="mt-20 text-gray-400 text-sm">
        © 2024 Innvoix HR Agent. Powered by Gemini AI.
      </footer>
    </div>
  );
};

export default LandingPage;

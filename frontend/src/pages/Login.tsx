import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ShieldAlert, LogIn, Lock, Mail } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, isAuthenticated, error, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setLocalError('Please enter your email address');
      return;
    }
    setLocalError(null);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      // Error handled by store
    }
  };

  const demoAccounts = [
    { label: 'Super Admin', email: 'admin@rda.com', role: 'Super Admin' },
    { label: 'Kochi Branch Manager', email: 'manager.kochi@rda.com', role: 'Branch Manager' },
    { label: 'Kollam Branch Manager', email: 'manager.kollam@rda.com', role: 'Branch Manager' },
    { label: 'Kochi Accountant', email: 'accountant.kochi@rda.com', role: 'Accountant' },
    { label: 'John (Instructor)', email: 'instructor.john@rda.com', role: 'Instructor' },
  ];

  const handleQuickLogin = async (demoEmail: string) => {
    setLocalError(null);
    try {
      await login(demoEmail, 'password123');
      navigate('/dashboard');
    } catch {}
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white relative overflow-hidden">
      
      {/* Visual background lights */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
        
        {/* Left: Branding & Pitch */}
        <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-3">
            <div className="h-12 w-12 bg-primary flex items-center justify-center rounded-2xl text-white font-black text-2xl shadow-xl shadow-primary/35">
              R
            </div>
            <div>
              <h1 className="font-extrabold text-2xl leading-none tracking-tight">Rudreshwar Dance Academy</h1>
              <span className="text-xs text-indigo-400 font-bold uppercase tracking-widest">Management Suite</span>
            </div>
          </div>

          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
            Manage Multiple Branches, <span className="text-primary">One Unified Control</span> Center.
          </h2>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-lg">
            Monitor real-time students analytics, batch schedules, attendance check-ins, automated billing, expense ledger, and concerts budget across Kerala.
          </p>

          {/* Quick Demo Selector */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 text-left space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-300">Quick Demo Accounts (Seeded Data)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => handleQuickLogin(acc.email)}
                  className="flex flex-col text-left p-2.5 bg-white/5 hover:bg-primary/25 border border-white/5 hover:border-primary/50 rounded-xl transition-all"
                >
                  <span className="font-semibold text-xs text-white">{acc.label}</span>
                  <span className="text-[10px] text-slate-400 truncate mt-0.5">{acc.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Login Form Card */}
        <div className="lg:col-span-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold tracking-tight">Sign In</h3>
            <p className="text-slate-400 text-xs">Enter your authorization email to manage your branch workspace.</p>
          </div>

          {(error || localError) && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3.5 rounded-xl text-xs flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{localError || error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="email"
                  placeholder="name@rda.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/45 focus:border-primary transition-all text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Password</label>
                <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/45 focus:border-primary transition-all text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-primary/20 transition-all cursor-pointer"
            >
              <LogIn className="h-4.5 w-4.5" />
              <span>{isLoading ? 'Signing In...' : 'Access Dashboard'}</span>
            </button>
          </form>

          <div className="text-center text-xs text-slate-500 pt-2">
            Locked by RBAC security policies. Authed sessions auto-refresh every 60m.
          </div>
        </div>

      </div>
    </div>
  );
};

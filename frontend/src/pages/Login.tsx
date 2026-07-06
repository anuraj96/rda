import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ShieldAlert, LogIn, Lock, Mail, LayoutDashboard, Sparkles } from 'lucide-react';

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



  return (
    // Dark page backdrop — derived from project primary hue (169°) at very low lightness
    <div className="min-h-screen flex items-center justify-center p-6 text-white relative overflow-hidden"
      style={{ background: 'hsl(169, 30%, 6%)' }}>

      {/* Ambient orbs using project primary hue */}
      <div className="absolute top-[-120px] left-[-80px] w-[420px] h-[420px] rounded-full blur-[100px] pointer-events-none"
        style={{ background: 'hsl(169, 39%, 25%, 0.18)' }} />
      <div className="absolute bottom-[-120px] right-[-80px] w-[380px] h-[380px] rounded-full blur-[100px] pointer-events-none"
        style={{ background: 'hsl(169, 30%, 20%, 0.12)' }} />
      <div className="absolute top-[40%] left-[50%] w-[200px] h-[200px] rounded-full blur-[80px] pointer-events-none"
        style={{ background: 'hsl(169, 39%, 20%, 0.08)' }} />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-0 items-stretch z-10 rounded-3xl overflow-hidden shadow-2xl shadow-black/60"
        style={{ border: '1px solid hsl(169, 30%, 18%)' }}>

        {/* ─── Left: Branding ─── */}
        <div className="flex flex-col justify-center gap-7 p-10 relative overflow-hidden"
          style={{ background: 'hsl(169, 30%, 9%)' }}>

          {/* Inner glow */}
          <div className="absolute top-[-60px] left-[-60px] w-[260px] h-[260px] rounded-full blur-[80px] pointer-events-none"
            style={{ background: 'hsl(169, 39%, 25%, 0.14)' }} />

          {/* ── Logo Hero ── */}
          <div className="flex flex-col gap-4">
            <div className="relative w-fit">
              {/* Outer ring */}
              <div className="absolute -inset-3.5 rounded-[28px]"
                style={{ border: '1px solid hsl(169, 39%, 25%, 0.25)' }} />
              {/* Inner glow ring */}
              <div className="absolute -inset-1.5 rounded-[24px]"
                style={{ border: '1px solid hsl(169, 39%, 30%, 0.5)', background: 'hsl(169, 39%, 25%, 0.08)' }} />
              {/* Logo */}
              <img
                src="/logo.png"
                alt="ARSuite Logo"
                className="relative h-24 w-24 rounded-[20px] object-contain shadow-xl"
                style={{
                  border: '1px solid hsl(169, 39%, 25%, 0.3)',
                  background: 'hsl(169, 30%, 12%)',
                  boxShadow: '0 20px 40px hsl(169, 39%, 10%, 0.5)',
                }}
              />
            </div>

            {/* Platform name + badge */}
            <div className="flex flex-col gap-1.5">
              <h1 className="text-xl font-semibold leading-tight tracking-tight" style={{ color: 'hsl(150, 17%, 93%)' }}>
                ARSuite
              </h1>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest rounded-md px-2.5 py-1 w-fit"
                style={{
                  color: 'hsl(169, 39%, 55%)',
                  background: 'hsl(169, 39%, 25%, 0.15)',
                  border: '1px solid hsl(169, 39%, 30%, 0.3)',
                }}>
                <LayoutDashboard className="h-3 w-3" />
                Management Suite
              </span>
            </div>
          </div>

          {/* Headline */}
          <div className="space-y-2">
            <h2 className="text-[26px] font-semibold tracking-tight leading-snug" style={{ color: 'hsl(150, 17%, 90%)' }}>
              One unified control{' '}
              <span style={{ color: 'hsl(169, 39%, 55%)' }}>center</span>{' '}
              for every branch.
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'hsl(169, 15%, 55%)' }}>
              Monitor students, batch schedules, attendance, automated billing, expense ledgers, and budgets across branches in real time.
            </p>
          </div>


        </div>

        {/* ─── Right: Login Form ─── */}
        <div className="flex flex-col justify-center gap-6 p-10"
          style={{ background: 'hsl(169, 25%, 11%)', borderLeft: '1px solid hsl(169, 20%, 16%)' }}>

          {/* Header */}
          <div>
            <h3 className="text-2xl font-semibold tracking-tight" style={{ color: 'hsl(150, 17%, 93%)' }}>Sign in</h3>
            <p className="text-xs mt-1" style={{ color: 'hsl(169, 15%, 48%)' }}>
              Enter your credentials to access your branch workspace.
            </p>
          </div>

          {/* Error state */}
          {(error || localError) && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3.5 rounded-xl text-xs flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{localError || error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(169, 15%, 48%)' }}>
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'hsl(169, 15%, 48%)' }} />
                <input
                  type="email"
                  placeholder="name@rda.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-all placeholder:opacity-40"
                  style={{
                    background: 'hsl(169, 25%, 8%)',
                    border: '1px solid hsl(169, 20%, 18%)',
                    color: 'hsl(150, 17%, 90%)',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = 'hsl(169, 39%, 35%)';
                    e.target.style.boxShadow = '0 0 0 3px hsl(169, 39%, 25%, 0.18)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'hsl(169, 20%, 18%)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(169, 15%, 48%)' }}>
                  Password
                </label>
                <a href="#" className="text-[11px] transition-colors" style={{ color: 'hsl(169, 39%, 52%)' }}>
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'hsl(169, 15%, 48%)' }} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-all placeholder:opacity-40"
                  style={{
                    background: 'hsl(169, 25%, 8%)',
                    border: '1px solid hsl(169, 20%, 18%)',
                    color: 'hsl(150, 17%, 90%)',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = 'hsl(169, 39%, 35%)';
                    e.target.style.boxShadow = '0 0 0 3px hsl(169, 39%, 25%, 0.18)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'hsl(169, 20%, 18%)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Submit — uses CSS var(--primary) directly */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 text-white text-sm font-semibold py-3 px-4 rounded-xl transition-all duration-150 mt-1 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: 'hsl(var(--primary))',
                boxShadow: '0 8px 24px hsl(169, 39%, 15%, 0.5)',
              }}
              onMouseEnter={e => !isLoading && ((e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.15)')}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.filter = '')}
            >
              <LogIn className="h-4 w-4" />
              <span>{isLoading ? 'Signing in...' : 'Access dashboard'}</span>
            </button>
          </form>

        </div>

      </div>
    </div>
  );
};
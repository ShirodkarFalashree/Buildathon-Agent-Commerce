import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Cpu, ArrowRight, Loader2, KeyRound, ShieldCheck, User } from 'lucide-react';
import { authApi } from '../../services/api';

export default function LoginPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('buyer@agentcommerce.ai');
  const [password, setPassword] = useState('buyer123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await authApi.login({
        email,
        password,
      });

      if (res.data.success && res.data.user) {
        const user = res.data.user;
        onLoginSuccess(user);

        if (user.role === 'MERCHANT') {
          navigate('/merchant');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      
      {/* Radial Gradient Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/25 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-indigo-500/30 shadow-2xl space-y-6 relative z-10">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-0.5 shadow-xl shadow-indigo-500/20 mx-auto">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Cpu className="w-6 h-6 text-indigo-400" />
            </div>
          </div>

          <h1 className="text-2xl font-extrabold text-white tracking-tight">AgentCommerce Sign-In</h1>
          <p className="text-xs text-slate-400">Enter your credentials. The platform will automatically route you to your dashboard.</p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. merchant@agentcommerce.ai"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder-slate-500"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder-slate-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            <span>Sign In to AgentCommerce</span>
          </button>
        </form>

        {/* Demo Fast Fill Pills */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <span className="text-[11px] text-slate-400 font-medium block text-center">Demo Quick Fill Shortcuts:</span>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setEmail('buyer@agentcommerce.ai');
                setPassword('buyer123');
              }}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-[11px] font-semibold transition-all flex items-center justify-center space-x-1.5"
            >
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span>Buyer Account</span>
            </button>

            <button
              onClick={() => {
                setEmail('merchant@agentcommerce.ai');
                setPassword('admin123');
              }}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-[11px] font-semibold transition-all flex items-center justify-center space-x-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Merchant Admin</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, ShieldCheck, Lock, ArrowRight, Loader2, Cpu } from 'lucide-react';
import { authApi } from '../../services/api';

export default function MerchantLoginPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('merchant@agentcommerce.ai');
  const [password, setPassword] = useState('admin123');
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
        role: 'MERCHANT',
      });

      if (res.data.success) {
        onLoginSuccess(res.data.user);
        navigate('/merchant');
      }
    } catch (err) {
      console.error('Merchant login error:', err);
      setErrorMsg(err.response?.data?.message || 'Invalid merchant credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      
      {/* Background radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-indigo-500/30 shadow-2xl space-y-6 relative z-10">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-0.5 shadow-xl shadow-indigo-500/20 mx-auto">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Store className="w-6 h-6 text-indigo-400" />
            </div>
          </div>

          <h1 className="text-2xl font-extrabold text-white tracking-tight">Merchant Portal Access</h1>
          <p className="text-xs text-slate-400">Log in to manage store catalog, AI spending policies, and audit logs.</p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Merchant Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            <span>Sign In to Merchant Console</span>
          </button>
        </form>

        {/* Demo Fast Login Shortcut */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <span className="text-[11px] text-slate-400 font-medium block text-center">Hackathon One-Click Demo Access:</span>
          <button
            onClick={() => {
              setEmail('merchant@agentcommerce.ai');
              setPassword('admin123');
              setTimeout(() => handleLogin(), 100);
            }}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-indigo-300 font-semibold text-xs transition-all flex items-center justify-center space-x-2"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Demo Merchant Admin Sign-In</span>
          </button>
        </div>

      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, ShieldCheck, Lock, ArrowRight, Loader2, Cpu } from 'lucide-react';
import { authApi } from '../../services/api';

export default function MerchantLoginPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('merchant@agentrelay.ai');
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      
      <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6 relative z-10">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-xs mx-auto">
            <Store className="w-6 h-6" />
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Merchant Portal Access</h1>
          <p className="text-xs text-slate-500">Log in to manage store catalog, AI spending policies, and audit logs.</p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs text-center font-medium shadow-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Merchant Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center space-x-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            <span>Sign In to Merchant Console</span>
          </button>
        </form>

        {/* Demo Fast Login Shortcut */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <span className="text-[11px] text-slate-500 font-medium block text-center">Hackathon One-Click Demo Access:</span>
          <button
            onClick={() => {
              setEmail('merchant@agentrelay.ai');
              setPassword('admin123');
              setTimeout(() => handleLogin(), 100);
            }}
            className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 text-emerald-700 font-semibold text-xs transition-all flex items-center justify-center space-x-2 shadow-xs"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Demo Merchant Admin Sign-In</span>
          </button>
        </div>

      </div>
    </div>
  );
}


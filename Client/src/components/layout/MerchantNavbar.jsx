import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, ShieldCheck, LogOut, Cpu, Settings } from 'lucide-react';

export default function MerchantNavbar({ policy, merchantUser, onLogout }) {
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    if (onLogout) onLogout();
    navigate('/merchant/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 glass-panel">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Merchant Branding */}
        <Link to="/merchant" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-all">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Store className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-white">AgentCommerce Console</span>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Merchant Admin
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">{policy?.storeName || 'Flagship Store Operations'}</p>
          </div>
        </Link>

        {/* Merchant Status & Logout Actions */}
        <div className="flex items-center space-x-4">
          
          {/* Policy Limit Badge */}
          {policy && (
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Limit: <strong className="text-white">₹{policy.autonomousPurchaseLimit?.toLocaleString()}</strong></span>
            </div>
          )}

          {/* Admin Email */}
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-bold text-white">{merchantUser?.name || 'Store Administrator'}</span>
            <span className="text-[11px] text-slate-400">{merchantUser?.email || 'merchant@agentcommerce.ai'}</span>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogoutClick}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-red-400 hover:border-red-500/30 transition-all text-xs font-semibold"
            title="Log Out of Merchant Console"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

      </div>
    </header>
  );
}

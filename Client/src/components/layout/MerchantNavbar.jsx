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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Merchant Branding */}
        <Link to="/merchant" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 p-0.5 shadow-sm shadow-indigo-500/20 group-hover:scale-105 transition-all">
            <div className="w-full h-full bg-indigo-600 rounded-[10px] flex items-center justify-center text-white">
              <Store className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-tight text-slate-900">AgentRelay Console</span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Merchant Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block font-medium">{policy?.storeName || 'Flagship Store Operations'}</p>
          </div>
        </Link>

        {/* Merchant Status & Logout Actions */}
        <div className="flex items-center space-x-4">
          
          {/* Policy Limit Badge */}
          {policy && (
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Limit: <strong className="text-slate-900">₹{policy.autonomousPurchaseLimit?.toLocaleString()}</strong></span>
            </div>
          )}

          {/* Admin Email */}
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-900">{merchantUser?.name || 'Store Administrator'}</span>
            <span className="text-[11px] text-slate-500">{merchantUser?.email || 'merchant@agentrelay.ai'}</span>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogoutClick}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 transition-all text-xs font-semibold shadow-2xs"
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

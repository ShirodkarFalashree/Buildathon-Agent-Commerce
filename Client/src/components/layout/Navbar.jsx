import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ShieldCheck, ShoppingBag, Store, Cpu, User, CreditCard } from 'lucide-react';

export default function Navbar({ policy, cartCount, openCart, openProfile, customerProfile }) {
  const location = useLocation();
  const isMerchant = location.pathname.startsWith('/merchant');

  const cardBrand = customerProfile?.savedPaymentMethod?.brand || 'Visa';
  const cardLast4 = customerProfile?.savedPaymentMethod?.last4 || '4912';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 glass-panel">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-all">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Cpu className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-white">AgentRelay</span>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                AI-Native
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Autonomous AI Commerce Platform</p>
          </div>
        </Link>

        {/* Dedicated Route Switcher Links */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-inner">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive && !isMerchant
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`
            }
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Buyer Storefront</span>
          </NavLink>

          <NavLink
            to="/merchant"
            className={({ isActive }) =>
              `flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive || isMerchant
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`
            }
          >
            <Store className="w-3.5 h-3.5" />
            <span>Merchant Console</span>
          </NavLink>
        </div>

        {/* Status Badges & Actions */}
        <div className="flex items-center space-x-3">
          
          {/* Buyer Profile Button */}
          {!isMerchant && (
            <button
              onClick={openProfile}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all text-xs"
              title="Edit Saved Card & Profile"
            >
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline font-medium">{customerProfile?.name || 'Buyer Profile'}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {cardBrand} •••• {cardLast4}
              </span>
            </button>
          )}

          {/* Policy Guardrail Badge */}
          {policy && (
            <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Limit: <strong className="text-white">₹{policy.autonomousPurchaseLimit?.toLocaleString()}</strong></span>
            </div>
          )}

          {/* Cart Trigger */}
          <button
            onClick={openCart}
            className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all"
            title="View Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-indigo-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-lg">
                {cartCount}
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
}

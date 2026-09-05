import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Cpu, User, LogOut, Store, LayoutDashboard } from 'lucide-react';

export default function BuyerNavbar({ cartCount, openCart, customerProfile, buyerUser, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const cardBrand = customerProfile?.savedPaymentMethod?.brand || 'Visa';
  const cardLast4 = customerProfile?.savedPaymentMethod?.last4 || '4912';

  const handleLogoutClick = () => {
    if (onLogout) onLogout();
    navigate('/login');
  };

  const isStore = location.pathname === '/' || location.pathname === '/store';
  const isProfile = location.pathname === '/profile';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 glass-panel">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-all">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Cpu className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">AgentCommerce</span>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Buyer Portal
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">AI-Powered Autonomous Shopping</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-slate-800">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                isStore
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              {/* <span>Storefront</span> */}
            </Link>

            <Link
              to="/profile"
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                isProfile
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>My Dashboard & History</span>
            </Link>
          </nav>
        </div>

        {/* Status Badges & Actions */}
        <div className="flex items-center space-x-3">
          
          {/* Buyer Saved Card & Profile Route Link */}
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all text-xs"
            title="View Buyer Profile & Payment Vault"
          >
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline font-medium">{buyerUser?.name || 'Falashree Shirodkar'}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              {cardBrand} •••• {cardLast4}
            </span>
          </button>

          {/* Cart Trigger Drawer */}
          <button
            onClick={openCart}
            className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all"
            title="View Cart & AI Shopping Drawer"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-indigo-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-lg">
                {cartCount}
              </span>
            )}
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogoutClick}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-all text-xs"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>

        </div>

      </div>
    </header>
  );
}

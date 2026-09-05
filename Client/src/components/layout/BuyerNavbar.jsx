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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 p-0.5 shadow-sm shadow-indigo-500/20 group-hover:scale-105 transition-all">
              <div className="w-full h-full bg-indigo-600 rounded-[10px] flex items-center justify-center text-white">
                <Cpu className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">AgentRelay</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Buyer Portal
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block font-medium">AI-Powered Autonomous Shopping</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-slate-200">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                isStore
                  ? 'bg-slate-100 text-indigo-700 font-bold border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Shop</span>
            </Link>

            <Link
              to="/profile"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                isProfile
                  ? 'bg-slate-100 text-indigo-700 font-bold border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard & History</span>
            </Link>
          </nav>
        </div>

        {/* Status Badges & Actions */}
        <div className="flex items-center space-x-3">
          
          {/* Buyer Saved Card & Profile Route Link */}
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all text-xs shadow-2xs"
            title="View Buyer Profile & Payment Vault"
          >
            <User className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline font-semibold">{buyerUser?.name || 'Falashree Shirodkar'}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
              {cardBrand} •••• {cardLast4}
            </span>
          </button>

          {/* Cart Trigger Drawer */}
          <button
            onClick={openCart}
            className="relative p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shadow-2xs"
            title="View Cart & AI Shopping Drawer"
          >
            <ShoppingBag className="w-5 h-5 text-slate-700" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-indigo-600 text-white text-[11px] font-extrabold rounded-full flex items-center justify-center shadow-sm">
                {cartCount}
              </span>
            )}
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogoutClick}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 transition-all text-xs shadow-2xs"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>

        </div>

      </div>
    </header>
  );
}

import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Sliders, 
  Activity, 
  ShieldCheck, 
  DollarSign, 
  RefreshCw
} from 'lucide-react';
import MerchantNavbar from '../../components/layout/MerchantNavbar';
import MerchantDashboard from '../../components/merchant/MerchantDashboard';
import { productApi, policyApi, auditApi } from '../../services/api';

export default function MerchantLayout({ policy, setPolicy, merchantUser, onLogout }) {
  const [products, setProducts] = useState([]);
  const [auditEvents, setAuditEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMerchantData();
  }, []);

  const fetchMerchantData = async () => {
    setLoading(true);
    try {
      const [prodRes, auditRes] = await Promise.all([
        productApi.getProducts(),
        auditApi.getEvents({ limit: 50 }),
      ]);
      setProducts(prodRes.data.products || []);
      setAuditEvents(auditRes.data.events || []);
    } catch (err) {
      console.error('Failed to fetch merchant layout data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      
      {/* Dedicated Merchant Top Navbar */}
      <MerchantNavbar policy={policy} merchantUser={merchantUser} onLogout={onLogout} />

      {/* Main Merchant Portal Body with Sidebar */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Merchant Sidebar Navigation */}
        <aside className="w-full md:w-64 border-r border-slate-200 bg-white p-5 space-y-6 shrink-0 shadow-2xs">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200">
              Merchant Operations
            </span>
            <h2 className="text-base font-extrabold text-slate-900 mt-2 tracking-tight">Store Console</h2>
          </div>

          <nav className="space-y-1 text-xs font-semibold">
            <NavLink
              to="/merchant"
              end
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-xl font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Store Dashboard</span>
            </NavLink>

          </nav>

          {/* Policy Quick Summary */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center space-x-2 text-emerald-700 font-extrabold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Selling Policy Active</span>
            </div>
            <div className="text-[11px] text-slate-600 space-y-1 font-medium">
              <div>• Max Disc %: <strong className="text-slate-900">{(policy?.maxDiscountPercent || 10)}%</strong></div>
              <div>• Daily Cap: <strong className="text-slate-900">₹{(policy?.dailySpendingLimit || 500000).toLocaleString()}</strong></div>
              <div>• Today Spend: <strong className="text-indigo-700 font-bold">₹{(policy?.currentDailySpend || 0).toLocaleString()}</strong></div>
            </div>
          </div>
        </aside>

        {/* Main Merchant Content Body */}
        <main className="flex-1 overflow-y-auto">
          <MerchantDashboard policy={policy} setPolicy={setPolicy} />
        </main>

      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Package, 
  Settings, 
  Activity, 
  DollarSign, 
  Sliders, 
  CheckCircle, 
  RefreshCw,
  Search,
  Eye,
  Tag
} from 'lucide-react';
import { productApi, policyApi, auditApi } from '../../services/api';

export default function MerchantDashboard({ policy, setPolicy }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState([]);
  const [auditEvents, setAuditEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [policyForm, setPolicyForm] = useState({
    autonomousPurchaseLimit: 10000,
    dailySpendingLimit: 50000,
    maxDiscountPercent: 10,
  });
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [policySuccess, setPolicySuccess] = useState(false);

  useEffect(() => {
    fetchMerchantData();
  }, []);

  useEffect(() => {
    if (policy) {
      setPolicyForm({
        autonomousPurchaseLimit: policy.autonomousPurchaseLimit || 10000,
        dailySpendingLimit: policy.dailySpendingLimit || 50000,
        maxDiscountPercent: policy.maxDiscountPercent || 10,
      });
    }
  }, [policy]);

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
      console.error('Failed to fetch merchant data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePolicy = async (e) => {
    e.preventDefault();
    setSavingPolicy(true);
    try {
      const res = await policyApi.updatePolicy(policyForm);
      setPolicy(res.data.policy);
      setPolicySuccess(true);
      setTimeout(() => setPolicySuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update policy:', err);
    } finally {
      setSavingPolicy(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">Merchant Control Room</h1>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Policies Active
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Manage product catalog, configure AI spending guardrails, and audit autonomous agent decisions.
          </p>
        </div>

        <button
          onClick={fetchMerchantData}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-all text-xs font-medium self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Autonomous Spend Limit</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            ₹{(policy?.autonomousPurchaseLimit || 10000).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400">Purchases above this require human approval</p>
        </div>

        <div className="glass-card p-5 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Daily Budget Cap</span>
            <DollarSign className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            ₹{(policy?.dailySpendingLimit || 50000).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400">Max cumulative agent daily spend</p>
        </div>

        <div className="glass-card p-5 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Active Catalog</span>
            <Package className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white">{products.length} Items</div>
          <p className="text-[11px] text-slate-400">Indexed for AI intent search</p>
        </div>

        <div className="glass-card p-5 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Decision Trail Logs</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{auditEvents.length} Events</div>
          <p className="text-[11px] text-slate-400">Recorded AI actions</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-800 flex space-x-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-sm font-medium transition-all flex items-center space-x-2 ${
            activeTab === 'overview'
              ? 'border-b-2 border-indigo-500 text-indigo-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Product Catalog ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('policy')}
          className={`pb-3 text-sm font-medium transition-all flex items-center space-x-2 ${
            activeTab === 'policy'
              ? 'border-b-2 border-indigo-500 text-indigo-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Policy Control Guardrails</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 text-sm font-medium transition-all flex items-center space-x-2 ${
            activeTab === 'audit'
              ? 'border-b-2 border-indigo-500 text-indigo-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>AI Decision Audit Trail</span>
        </button>
      </div>

      {/* Tab 1: Product Catalog Grid */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((item) => (
            <div key={item._id} className="glass-panel p-5 rounded-2xl space-y-4 border border-slate-800">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=800';
                  }}
                />
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-950/80 text-indigo-300 backdrop-blur border border-slate-700">
                  {item.category}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-white text-base line-clamp-1">{item.title}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.description}</p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {item.tags?.slice(0, 4).map((tag, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-900 text-[10px] font-medium text-slate-400 border border-slate-800">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">Stock: {item.stock}</span>
                  <div className="font-extrabold text-white text-lg">₹{item.price.toLocaleString()}</div>
                </div>

                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  item.price > (policy?.autonomousPurchaseLimit || 10000)
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {item.price > (policy?.autonomousPurchaseLimit || 10000) ? 'Requires Approval' : 'Auto-Approved'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Policy Control Room */}
      {activeTab === 'policy' && (
        <div className="max-w-2xl glass-panel p-6 rounded-2xl space-y-6 border border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white">Merchant AI Governance Policy</h2>
            <p className="text-xs text-slate-400 mt-1">
              Deterministic backend rules that dictate what AI sales agents can execute automatically vs what requires human merchant/customer authorization.
            </p>
          </div>

          <form onSubmit={handleUpdatePolicy} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Autonomous Purchase Limit (₹ INR)
              </label>
              <input
                type="number"
                value={policyForm.autonomousPurchaseLimit}
                onChange={(e) => setPolicyForm({ ...policyForm, autonomousPurchaseLimit: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                placeholder="10000"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Any cart recommendation exceeding this limit automatically triggers a Customer Approval authorization flow before payment.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Daily AI Spending Budget Cap (₹ INR)
              </label>
              <input
                type="number"
                value={policyForm.dailySpendingLimit}
                onChange={(e) => setPolicyForm({ ...policyForm, dailySpendingLimit: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                placeholder="50000"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Max AI Discount Allowance (%)
              </label>
              <input
                type="number"
                value={policyForm.maxDiscountPercent}
                onChange={(e) => setPolicyForm({ ...policyForm, maxDiscountPercent: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                placeholder="10"
              />
            </div>

            {policySuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Policy configuration updated successfully!</span>
              </div>
            )}

            <button
              type="submit"
              disabled={savingPolicy}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2"
            >
              {savingPolicy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>Save & Enforce Policy</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Audit Trail Log */}
      {activeTab === 'audit' && (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Immutable Decision Audit Log</h2>
              <p className="text-xs text-slate-400">Complete audit trail of every AI intent parse, catalog search, recommendation, and policy check.</p>
            </div>
            <span className="text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
              {auditEvents.length} Recorded Events
            </span>
          </div>

          <div className="divide-y divide-slate-800/60 max-h-[600px] overflow-y-auto">
            {auditEvents.map((evt) => (
              <div key={evt._id} className="p-4 hover:bg-slate-900/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      evt.actor === 'SALES_AGENT' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                      evt.actor === 'SYSTEM_POLICY' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {evt.actor}
                    </span>

                    <span className="font-semibold text-white text-xs">{evt.title}</span>
                  </div>
                  <p className="text-xs text-slate-400">{evt.description}</p>
                </div>

                <div className="flex items-center space-x-3 text-right">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    evt.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    evt.status === 'PENDING_APPROVAL' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {evt.status}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {new Date(evt.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

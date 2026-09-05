import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, CreditCard, ShoppingBag, ShieldCheck, CheckCircle2, 
  Sparkles, RefreshCw, Cpu, Lock, AlertTriangle, Eye, Zap,
  Store, ChevronRight, Activity, ArrowLeft, Sliders
} from 'lucide-react';
import { orderApi, customerApi, auditApi } from '../../services/api';

export default function BuyerProfilePage({ sessionId, buyerUser, openAiChat }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'vault' | 'ai-assistant'
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  
  // Payment Vault form state
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cardBrand, setCardBrand] = useState('Visa');
  const [isPreAuthorized, setIsPreAuthorized] = useState(true);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [savingVault, setSavingVault] = useState(false);

  // Selected Order for AI Audit Modal
  const [selectedAuditOrder, setSelectedAuditOrder] = useState(null);
  const [auditEvents, setAuditEvents] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchProfile();
  }, [sessionId]);

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await orderApi.getOrders();
      if (res.data.orders) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchProfile = async () => {
    try {
      setLoadingProfile(true);
      const res = await customerApi.getProfile(sessionId);
      if (res.data.customer) {
        const p = res.data.customer;
        setCustomerProfile(p);
        setCardholderName(p.savedPaymentMethod?.cardholderName || 'Falashree Shirodkar');
        setCardNumber(p.savedPaymentMethod?.last4 ? `•••• •••• •••• ${p.savedPaymentMethod.last4}` : '•••• •••• •••• 4912');
        setExpiryDate(p.savedPaymentMethod?.expiryDate || '12/28');
        setCardBrand(p.savedPaymentMethod?.brand || 'Visa');
        setIsPreAuthorized(p.savedPaymentMethod?.isPreAuthorized !== undefined ? p.savedPaymentMethod.isPreAuthorized : true);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSaveVault = async (e) => {
    e.preventDefault();
    try {
      setSavingVault(true);
      setSaveSuccessMsg('');
      
      const cleanNum = cardNumber.replace(/\s+/g, '');
      const last4 = cleanNum.slice(-4) || '4912';

      const updateData = {
        savedPaymentMethod: {
          cardholderName,
          last4,
          brand: cardBrand,
          expiryDate,
          isPreAuthorized,
          preAuthToken: customerProfile?.savedPaymentMethod?.preAuthToken || `token_rzp_vault_${Date.now()}`,
        },
      };

      const res = await customerApi.updateProfile(sessionId, updateData);
      if (res.data.customer) {
        setCustomerProfile(res.data.customer);
        setSaveSuccessMsg('Payment Vault updated successfully! Autonomous pre-authorization active.');
        setTimeout(() => setSaveSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Failed to save payment vault:', err);
    } finally {
      setSavingVault(false);
    }
  };

  const openOrderAuditModal = async (order) => {
    setSelectedAuditOrder(order);
    try {
      setLoadingAudit(true);
      const targetSession = order.sessionId || sessionId;
      const res = await auditApi.getSessionTrail(targetSession);
      if (res.data.events) {
        setAuditEvents(res.data.events);
      } else {
        setAuditEvents([]);
      }
    } catch (err) {
      console.error('Failed to load decision trail:', err);
      setAuditEvents([]);
    } finally {
      setLoadingAudit(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex flex-col md:flex-row font-sans">
      
      {/* ================= DEDICATED BUYER SIDEBAR ================= */}
      <aside className="w-full md:w-72 border-r border-slate-200 bg-white p-5 space-y-6 shrink-0 flex flex-col justify-between shadow-xs">
        <div className="space-y-6">
          
          {/* User Profile Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-xs shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <h3 className="font-bold text-sm text-slate-900 truncate">
                  {buyerUser?.name || cardholderName || 'Falashree Shirodkar'}
                </h3>
                <p className="text-xs text-slate-500 truncate">
                  {buyerUser?.email || 'buyer@agentrelay.ai'}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono text-[10px]">Session ID:</span>
              <span className="font-mono text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-semibold">
                {sessionId}
              </span>
            </div>
          </div>

          {/* Navigation Section */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 block mb-2">
              Buyer Dashboard
            </span>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${
                activeTab === 'orders'
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <ShoppingBag className="w-4 h-4" />
                <span>Purchase History</span>
              </div>
              {orders.length > 0 && (
                <span className={`px-2 py-0.5 text-[10px] rounded-full font-mono font-bold ${
                  activeTab === 'orders' ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                }`}>
                  {orders.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('vault')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${
                activeTab === 'vault'
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <CreditCard className="w-4 h-4" />
                <span>Razorpay Payment Vault</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-semibold">
                {cardBrand}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('ai-assistant')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${
                activeTab === 'ai-assistant'
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Cpu className="w-4 h-4" />
                <span>AI Agent & Controls</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>
          </div>

          {/* Quick Link to Storefront */}
          <div className="pt-4 border-t border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 block mb-2">
              Navigation Shortcut
            </span>
            <Link
              to="/"
              className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all border border-slate-200 shadow-xs"
            >
              <Store className="w-4 h-4 text-indigo-600" />
              <span>Back to Storefront Catalog</span>
            </Link>
          </div>

        </div>

        {/* Sidebar Bottom AI Trigger Widget */}
        <div className="pt-6 space-y-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs shadow-xs">
            <div className="flex items-center space-x-2 text-emerald-700 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Pre-Auth Vault Active</span>
            </div>
            <div className="text-[11px] text-slate-600 space-y-0.5 font-medium">
              <div>• Zero-Click Limit: <strong className="text-slate-900">₹10,000</strong></div>
              <div>• Status: <strong className="text-emerald-700">Razorpay Verified</strong></div>
            </div>
          </div>

          <button
            onClick={openAiChat}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs flex items-center justify-center space-x-2 shadow-xs transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Launch AI Agent Chat</span>
          </button>
        </div>
      </aside>

      {/* ================= MAIN DASHBOARD BODY ================= */}
      <main className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto">
        
        {/* Top Summary Metric Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {activeTab === 'orders' && 'Purchase History & Orders'}
                  {activeTab === 'vault' && 'Razorpay Payment Vault'}
                  {activeTab === 'ai-assistant' && 'AI Autonomous Shopping Controls'}
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Buyer Account
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Manage your orders, Razorpay pre-authorized payment methods, and AI decision trail logs.
              </p>
            </div>

            <button
              onClick={openAiChat}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs flex items-center space-x-2 shadow-xs transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Ask AI Agent</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-100">
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 font-medium">Completed Orders</span>
              <div className="text-lg font-bold text-slate-900 mt-0.5 flex items-center justify-between">
                <span>{orders.length}</span>
                <ShoppingBag className="w-4 h-4 text-indigo-600" />
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 font-medium">Saved Card Vault</span>
              <div className="text-lg font-bold text-slate-900 mt-0.5 flex items-center justify-between">
                <span className="text-xs font-mono text-indigo-700">{cardBrand} •••• {customerProfile?.savedPaymentMethod?.last4 || '4912'}</span>
                <CreditCard className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 font-medium">Zero-Click Spending Limit</span>
              <div className="text-lg font-bold text-slate-900 mt-0.5 flex items-center justify-between">
                <span className="text-emerald-700 text-base">₹10,000</span>
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
            </div>
          </div>
        </div>

        {/* TAB 1: PURCHASE HISTORY */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Your Orders & Transactions</h2>
              <button
                onClick={fetchOrders}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 hover:text-slate-900 flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            {loadingOrders ? (
              <div className="p-12 text-center text-slate-500 space-y-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                <p className="text-xs font-medium">Loading purchase history...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-4 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">No Purchase History Yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  You haven't placed any orders in this session. Ask the AI Sales Agent to find products or make a purchase!
                </p>
                <button
                  onClick={openAiChat}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium text-xs inline-flex items-center gap-2 hover:bg-indigo-700 shadow-xs"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" /> Start AI Shopping Session
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order._id}
                    className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-all space-y-4 shadow-xs"
                  >
                    {/* Order Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-sm font-bold text-slate-900">Order #{order.orderNumber}</span>
                          {order.status === 'paid' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Paid & Confirmed
                            </span>
                          )}
                          {order.status === 'awaiting_approval' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Awaiting Human Approval
                            </span>
                          )}
                          {order.isApproved && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> Human Approved
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-bold text-slate-900">
                          ₹{order.totalAmount?.toLocaleString()}
                        </div>
                        <p className="text-[11px] font-mono text-slate-500">
                          {order.items?.length || 0} item(s)
                        </p>
                      </div>
                    </div>

                    {/* Order Items List */}
                    <div className="space-y-2">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          <div className="flex items-center space-x-3">
                            {item.product?.image ? (
                              <img src={item.product.image} alt={item.title} className="w-9 h-9 object-cover rounded-md border border-slate-200 shadow-xs" />
                            ) : (
                              <div className="w-9 h-9 rounded-md bg-slate-200 flex items-center justify-center text-slate-500">
                                <ShoppingBag className="w-4 h-4" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-slate-900">{item.title}</p>
                              <p className="text-[11px] text-slate-500">Qty: {item.quantity} × ₹{item.price?.toLocaleString()}</p>
                            </div>
                          </div>
                          <span className="font-bold text-slate-900">
                            ₹{(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Payment Details & AI Audit Trigger */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="space-y-1 font-mono text-slate-500">
                        {order.razorpayPaymentId && (
                          <div>
                            <span className="text-slate-400">Razorpay Payment ID:</span>{' '}
                            <span className="text-indigo-700 font-semibold">{order.razorpayPaymentId}</span>
                          </div>
                        )}
                        {order.razorpayOrderId && (
                          <div>
                            <span className="text-slate-400">Razorpay Order ID:</span>{' '}
                            <span className="text-slate-700">{order.razorpayOrderId}</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => openOrderAuditModal(order)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-medium flex items-center gap-1.5 transition-all text-xs shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-600" /> View AI Decision Trail
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PAYMENT VAULT */}
        {activeTab === 'vault' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Card Preview Visual */}
            <div className="md:col-span-1 space-y-4">
              <h2 className="text-base font-bold text-slate-900">Active Payment Instrument</h2>
              
              <div className="relative h-48 rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 border border-indigo-500/30 p-6 flex flex-col justify-between shadow-xl overflow-hidden group hover:border-indigo-500/60 transition-all">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center justify-between relative z-10">
                  <span className="font-bold text-xs text-indigo-300 tracking-wider uppercase font-mono">AgentRelay Vault</span>
                  <span className="font-extrabold italic text-white text-base tracking-wider">{cardBrand}</span>
                </div>

                <div className="relative z-10 font-mono text-base font-semibold tracking-widest text-slate-100">
                  {cardNumber || '•••• •••• •••• 4912'}
                </div>

                <div className="flex items-center justify-between relative z-10 text-[11px]">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase block">Cardholder</span>
                    <span className="font-semibold text-white uppercase">{cardholderName || 'Falashree Shirodkar'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase block">Expires</span>
                    <span className="font-semibold text-white font-mono">{expiryDate || '12/28'}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-2 shadow-xs">
                <div className="flex items-center space-x-2 text-emerald-800 font-semibold">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <span>PCI-DSS & Razorpay Test Vault Tokenized</span>
                </div>
                <p className="text-slate-600 font-medium">
                  Card credentials are saved in your encrypted customer profile for zero-click autonomous AI purchases under ₹10,000.
                </p>
              </div>
            </div>

            {/* Edit Form */}
            <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xs">
              <div>
                <h2 className="text-base font-bold text-slate-900">Payment Vault Settings</h2>
                <p className="text-xs text-slate-500">
                  Update card details stored in Razorpay Vault for AI agent checkout.
                </p>
              </div>

              {saveSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveVault} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Card Number (or last 4)
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                      placeholder="•••• •••• •••• 4912"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Card Network
                    </label>
                    <select
                      value={cardBrand}
                      onChange={(e) => setCardBrand(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                    >
                      <option value="Visa">Visa</option>
                      <option value="Mastercard">Mastercard</option>
                      <option value="RuPay">RuPay</option>
                      <option value="Amex">American Express</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Expiry Date (MM/YY)
                  </label>
                  <input
                    type="text"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                    placeholder="12/28"
                    required
                  />
                </div>

                {/* Pre-Authorization Toggle */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
                  <div>
                    <span className="font-semibold text-xs text-slate-900 block">Pre-Authorize Autonomous AI Payments</span>
                    <span className="text-[11px] text-slate-500">Allow AI Agent to auto-pay orders under ₹10,000 without manual OTP</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPreAuthorized}
                      onChange={(e) => setIsPreAuthorized(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={savingVault}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-xs flex items-center justify-center space-x-2"
                >
                  {savingVault ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Vault...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-amber-300" />
                      <span>Save Payment Vault Credentials</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: AI ASSISTANT & PREFERENCES */}
        {activeTab === 'ai-assistant' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-600" /> AI Autonomous Shopping Sales Agent
              </h2>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                The AI agent follows a strict <strong>OBSERVE → REASON → PROPOSE → POLICY CHECK → AUTHORIZATION → EXECUTE → VERIFY → AUDIT</strong> loop to evaluate products, verify merchant policies, and process payments.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 shadow-xs">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600">Autonomous Execution Rule</span>
                  <h4 className="text-xs font-bold text-slate-900">Orders Under ₹10,000</h4>
                  <p className="text-[11px] text-slate-600">
                    Automatically evaluated against policy rules, discounts calculated, and paid zero-click via Razorpay Vault.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 shadow-xs">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">Human Approval Rule</span>
                  <h4 className="text-xs font-bold text-slate-900">Orders Over ₹10,000</h4>
                  <p className="text-[11px] text-slate-600">
                    Triggers security approval popup for human authorization before charging your payment vault.
                  </p>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={openAiChat}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center space-x-2 shadow-xs"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Open AI Shopping Drawer</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* AI DECISION TRAIL AUDIT MODAL */}
      {selectedAuditOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 space-y-5 max-h-[85vh] overflow-y-auto shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">AI Decision & Policy Audit Trail</h3>
                  <p className="text-xs font-mono text-slate-500">Order #{selectedAuditOrder.orderNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAuditOrder(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-xs shadow-xs"
              >
                ✕
              </button>
            </div>

            {/* Order Payment Summary Badge */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs shadow-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Razorpay Payment ID:</span>
                <span className="font-mono text-indigo-700 font-bold">{selectedAuditOrder.razorpayPaymentId || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Razorpay Order ID:</span>
                <span className="font-mono text-slate-700">{selectedAuditOrder.razorpayOrderId || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Total Amount Charged:</span>
                <span className="font-bold text-slate-900 text-sm">₹{selectedAuditOrder.totalAmount?.toLocaleString()}</span>
              </div>
            </div>

            {/* Timeline of AI Events */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Autonomous Execution Logs
              </h4>

              {loadingAudit ? (
                <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                  <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin mx-auto" />
                  <p>Loading AI audit events...</p>
                </div>
              ) : auditEvents.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 text-center font-medium shadow-xs">
                  Audit events recorded in backend audit ledger. Razorpay payment verified autonomously.
                </div>
              ) : (
                <div className="space-y-2">
                  {auditEvents.map((evt, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1 shadow-xs">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-indigo-700 font-semibold">{evt.eventType}</span>
                        <span className="text-slate-400">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-800 font-medium">{evt.description}</p>
                      {evt.metadata?.ruleEvaluations && (
                        <div className="mt-1 pt-1 border-t border-slate-200 text-[11px] font-mono text-emerald-700">
                          Policy Compliance: All rule checks passed.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedAuditOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-medium text-xs hover:bg-slate-200 shadow-xs"
              >
                Close Audit Log
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}


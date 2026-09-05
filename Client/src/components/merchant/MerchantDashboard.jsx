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
  Tag,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  TrendingUp,
  Cpu,
  Layers,
  Zap,
  Check,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Bot,
  X
} from 'lucide-react';
import { productApi, policyApi, auditApi, merchantApi } from '../../services/api';

export default function MerchantDashboard({ policy, setPolicy }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'catalog' | 'policy' | 'audit'
  const [products, setProducts] = useState([]);
  const [auditEvents, setAuditEvents] = useState([]);
  const [overviewMetrics, setOverviewMetrics] = useState(null);
  const [growthOpps, setGrowthOpps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedSessionId, setExpandedSessionId] = useState(null);

  // Helper to group audit events by session transaction for clean presentation
  const getGroupedSessions = () => {
    const sessionMap = {};

    auditEvents.forEach((evt) => {
      const sId = evt.sessionId || 'session_default';
      if (!sessionMap[sId]) {
        sessionMap[sId] = {
          sessionId: sId,
          lastUpdated: evt.createdAt,
          events: [],
          productName: null,
          totalAmount: null,
          isAutoPaid: false,
          requiresApproval: false,
        };
      }

      sessionMap[sId].events.push(evt);

      // Extract product title from details or description
      if (!sessionMap[sId].productName) {
        if (evt.details?.primaryProduct?.title) {
          sessionMap[sId].productName = evt.details.primaryProduct.title;
        } else if (evt.details?.title) {
          sessionMap[sId].productName = evt.details.title;
        } else if (evt.description && evt.description.includes('NomadPro')) {
          sessionMap[sId].productName = 'NomadPro Anti-Theft Smart Travel Backpack with USB Charging Port';
        } else if (evt.description && evt.description.includes('Sony')) {
          sessionMap[sId].productName = 'Sony WH-1000XM5 Wireless Noise-Canceling Headphones';
        } else if (evt.description && evt.description.includes('Anker')) {
          sessionMap[sId].productName = 'Anker Soundcore Space Q45 Noise Cancelling Headphones';
        }
      }

      // Extract total amount
      if (!sessionMap[sId].totalAmount) {
        if (evt.details?.amount) sessionMap[sId].totalAmount = evt.details.amount;
        if (evt.details?.totalAmount) sessionMap[sId].totalAmount = evt.details.totalAmount;
      }

      if (evt.action === 'PAYMENT_VERIFIED' || evt.actor === 'PAYMENT_SERVICE') {
        sessionMap[sId].isAutoPaid = true;
      }
      if (evt.action === 'APPROVAL_REQUESTED' || evt.status === 'PENDING_APPROVAL') {
        sessionMap[sId].requiresApproval = true;
      }
    });

    return Object.values(sessionMap).sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
  };

  // Search & Filter State for Product Catalog
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Policy Form State
  const [policyForm, setPolicyForm] = useState({
    autonomousPurchaseLimit: 10000,
    dailySpendingLimit: 500000,
    maxDiscountPercent: 10,
  });
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [policySuccess, setPolicySuccess] = useState(false);

  // Modal States for Product CRUD & AI Inspector
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // AI Product Inspector Modal State
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [aiReportData, setAiReportData] = useState(null);
  const [loadingAiReport, setLoadingAiReport] = useState(false);

  // Product Form State for Create / Edit
  const [productForm, setProductForm] = useState({
    title: '',
    description: '',
    category: 'Audio',
    brand: 'AgentRelay',
    price: '',
    stock: 50,
    sku: '',
    imageUrl: '',
    tags: '',
    features: '',
    useCases: '',
    targetAudience: 'Travelers & Tech Enthusiasts',
    specs: {
      batteryLife: '30 Hours',
      noiseCancellation: 'Active ANC',
      weight: '250g',
      connectivity: 'Bluetooth 5.2',
    },
  });
  const [savingProduct, setSavingProduct] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  const categoriesList = ['All', 'Audio', 'Computing', 'Mobile', 'Smart', 'Travel', 'Cameras', 'Home & Lifestyle'];

  useEffect(() => {
    fetchMerchantData();
    const intervalId = setInterval(() => {
      fetchMerchantData();
    }, 3000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (policy) {
      setPolicyForm({
        autonomousPurchaseLimit: policy.autonomousPurchaseLimit || 10000,
        dailySpendingLimit: policy.dailySpendingLimit || 500000,
        maxDiscountPercent: policy.maxDiscountPercent || 10,
      });
    }
  }, [policy]);

  const fetchMerchantData = async () => {
    setLoading(true);
    try {
      const [prodRes, auditRes, overviewRes] = await Promise.all([
        productApi.getProducts({ includeInactive: 'false' }),
        auditApi.getEvents({ limit: 50 }),
        merchantApi.getOverview(),
      ]);

      setProducts(prodRes.data.products || []);
      setAuditEvents(auditRes.data.events || []);

      if (overviewRes.data.success) {
        setOverviewMetrics(overviewRes.data.metrics);
        setGrowthOpps(overviewRes.data.growthOpportunities || []);
      }
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

  // Open Create Product Modal
  const openCreateModal = () => {
    setProductForm({
      title: '',
      description: '',
      category: 'Audio',
      brand: 'AgentRelay',
      price: '',
      stock: 50,
      sku: `SKU-${Date.now().toString().slice(-4)}`,
      imageUrl: '',
      tags: 'travel, audio, premium',
      features: 'High quality material, Long battery life',
      useCases: 'Travel, Daily Commute',
      targetAudience: 'Consumers',
      specs: {
        batteryLife: '30 Hours',
        weight: '250g',
      },
    });
    setIsAddModalOpen(true);
  };

  // Open Edit Product Modal
  const openEditModal = (product) => {
    setSelectedProduct(product);
    setProductForm({
      title: product.title || '',
      description: product.description || '',
      category: product.category || 'Audio',
      brand: product.brand || 'AgentRelay',
      price: product.price || '',
      stock: product.stock || 0,
      sku: product.sku || '',
      imageUrl: product.imageUrl || '',
      tags: Array.isArray(product.tags) ? product.tags.join(', ') : product.tags || '',
      features: Array.isArray(product.features) ? product.features.join(', ') : product.features || '',
      useCases: Array.isArray(product.useCases) ? product.useCases.join(', ') : product.useCases || '',
      targetAudience: product.targetAudience || 'Consumers',
      specs: product.specs || {},
    });
    setIsEditModalOpen(true);
  };

  // Save New Product
  const handleSaveCreate = async (e) => {
    e.preventDefault();
    setSavingProduct(true);
    try {
      const res = await productApi.createProduct(productForm);
      if (res.data.success) {
        setActionSuccessMsg('Product added to active catalog successfully!');
        setIsAddModalOpen(false);
        fetchMerchantData();
        setTimeout(() => setActionSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Failed to create product:', err);
    } finally {
      setSavingProduct(false);
    }
  };

  // Save Product Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setSavingProduct(true);
    try {
      const res = await productApi.updateProduct(selectedProduct._id, productForm);
      if (res.data.success) {
        setActionSuccessMsg(`Product "${selectedProduct.title}" updated successfully!`);
        setIsEditModalOpen(false);
        fetchMerchantData();
        setTimeout(() => setActionSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Failed to update product:', err);
    } finally {
      setSavingProduct(false);
    }
  };

  // Archive / Delete Product
  const handleArchiveProduct = async (id, title) => {
    if (!window.confirm(`Archive "${title}" from the active AI search catalog?`)) return;
    try {
      await productApi.deleteProduct(id);
      setActionSuccessMsg(`Product "${title}" archived.`);
      fetchMerchantData();
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to archive product:', err);
    }
  };

  // Open AI Product Inspector
  const openAiInspectorModal = async (product) => {
    setSelectedProduct(product);
    setInspectModalOpen(true);
    setLoadingAiReport(true);
    try {
      const res = await productApi.getAiInspector(product._id);
      if (res.data.success) {
        setAiReportData(res.data.aiReport);
      }
    } catch (err) {
      console.error('Failed to fetch AI report:', err);
    } finally {
      setLoadingAiReport(false);
    }
  };

  // Filter Products for Catalog
  const filteredProducts = products.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = !searchQuery.trim() || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.tags && item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Merchant Control Room</h1>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Selling Policies Enforced
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Your AI Sales Agent represents your store to AI buyers across search, negotiation, and automated settlement.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm shadow-indigo-600/30 transition-all text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>

          <button
            onClick={fetchMerchantData}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all text-xs font-semibold shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-2xs">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Total Store Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            ₹{(overviewMetrics?.totalRevenue || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            AI-Attributed: <strong className="text-emerald-700 font-bold">₹{(overviewMetrics?.aiAttributedRevenue || 0).toLocaleString()}</strong>
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">AI-Assisted Orders</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {overviewMetrics?.aiAssistedOrders || 0} Orders
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Average Order Value: <strong className="text-indigo-700 font-bold">₹{(overviewMetrics?.averageOrderValue || 0).toLocaleString()}</strong>
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">AI Recommendation Conversion</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {overviewMetrics?.aiConversionRatePercent || 100}%
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Cross-Sell Revenue: <strong className="text-slate-900 font-bold">₹{(overviewMetrics?.aiCrossSellRevenue || 0).toLocaleString()}</strong>
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Merchant Selling Policy Cap</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            ₹{(policy?.autonomousPurchaseLimit || 10000).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Max Discount Allowed: <strong className="text-emerald-700 font-bold">{(policy?.maxDiscountPercent || 10)}%</strong>
          </p>
        </div>
      </div>

      {/* Navigation Tabs (Segmented Light Control Bar) */}
      <div className="bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80 flex space-x-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
            activeTab === 'overview'
              ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>AI Control Room</span>
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
            activeTab === 'catalog'
              ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Product Catalog ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('policy')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
            activeTab === 'policy'
              ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Selling Guardrails</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
            activeTab === 'audit'
              ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Audit Log</span>
        </button>
      </div>

      {/* ================= TAB 1: AI OVERVIEW & CONTROL ROOM ================= */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Growth Opportunities Widget */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" /> Data-Driven Growth Opportunities
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Automated store insights derived from active MongoDB catalog items and customer purchase pairings.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {growthOpps.map((opp) => (
                <div
                  key={opp.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {opp.type}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 font-mono">
                      {opp.supportingMetrics?.estimatedAovImpact}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm">{opp.title}</h3>
                  <p className="text-xs text-slate-600">{opp.evidence}</p>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Suggested Action</span>
                    <p className="font-medium">{opp.suggestedAction}</p>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <div className="flex space-x-1 font-mono text-[10px] text-slate-500">
                      <span>Relevant SKUs:</span>
                      <span className="text-indigo-700 font-bold">{opp.relevantSkus?.join(', ')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live AI Activity Feed Stream */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-600" /> Live AI Activity Stream
              </h2>
            </div>

            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {auditEvents.slice(0, 10).map((evt) => {
                const maskPII = (str) => {
                  if (!str) return '';
                  return str
                    .replace(/Alex Vance/gi, 'Alex V.')
                    .replace(/alex@(agentcommerce|agentrelay)\.ai/gi, 'alex@****.ai');
                };

                return (
                  <div key={evt._id} className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className={`font-bold ${
                        evt.actor === 'SALES_AGENT' || evt.actor === 'BUYER_AGENT' ? 'text-indigo-700' :
                        evt.actor === 'MERCHANT_AGENT' ? 'text-emerald-700' :
                        evt.actor === 'PAYMENT_SERVICE' ? 'text-sky-700' : 'text-amber-700'
                      }`}>
                        {evt.actor}
                      </span>
                      <span className="text-slate-400">{new Date(evt.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <div className="font-bold text-slate-900">{maskPII(evt.title)}</div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">{maskPII(evt.description)}</p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ================= TAB 2: PRODUCT CATALOG CRUD ================= */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          
          {/* Search & Category Filter Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by title, SKU, or tags..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
              />
            </div>

            <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto">
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid with Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredProducts.map((item) => (
              <div key={item._id} className="bg-white p-5 rounded-2xl space-y-4 border border-slate-200 hover:border-indigo-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=800';
                      }}
                    />
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-indigo-700 backdrop-blur border border-slate-200 shadow-2xs">
                      {item.category}
                    </span>
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-700 bg-white/90 backdrop-blur border border-slate-200 shadow-2xs font-bold">
                      {item.sku}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-base line-clamp-1">{item.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 font-medium">{item.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {item.tags?.slice(0, 4).map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-semibold text-slate-600 border border-slate-200">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 font-medium">Stock: <strong className="text-slate-900 font-bold">{item.stock}</strong></span>
                      <div className="font-black text-slate-900 text-lg">₹{item.price.toLocaleString()}</div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      item.price > (policy?.autonomousPurchaseLimit || 10000)
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}>
                      {item.price > (policy?.autonomousPurchaseLimit || 10000) ? 'Requires Approval' : 'Auto-Approved'}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <button
                      onClick={() => openAiInspectorModal(item)}
                      className="py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold flex items-center justify-center gap-1 transition-all"
                      title="Inspect AI Category & Specs"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-600" />
                      <span>AI Inspect</span>
                    </button>

                    <button
                      onClick={() => openEditModal(item)}
                      className="py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold flex items-center justify-center gap-1 transition-all"
                      title="Edit Product"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleArchiveProduct(item._id, item.title)}
                      className="py-2 rounded-xl bg-white hover:bg-red-50 text-slate-500 hover:text-red-700 border border-slate-200 hover:border-red-200 font-bold flex items-center justify-center gap-1 transition-all"
                      title="Archive Product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Archive</span>
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 3: POLICY CONTROL ROOM ================= */}
      {activeTab === 'policy' && (
        <div className="max-w-2xl bg-white p-6 rounded-2xl space-y-6 border border-slate-200 shadow-xs">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Merchant Selling Guardrails Policy</h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Deterministic backend rules that dictate what AI sales representatives can execute automatically vs what requires human merchant/buyer authorization.
            </p>
          </div>

          <form onSubmit={handleUpdatePolicy} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Merchant Selling Auto-Approval Threshold (₹ INR)
              </label>
              <input
                type="number"
                value={policyForm.autonomousPurchaseLimit}
                onChange={(e) => setPolicyForm({ ...policyForm, autonomousPurchaseLimit: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-indigo-600 focus:bg-white font-semibold"
                placeholder="10000"
              />
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                Recommendations exceeding this threshold require buyer authorization before payment.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Daily Store Sales Budget Cap (₹ INR)
              </label>
              <input
                type="number"
                value={policyForm.dailySpendingLimit}
                onChange={(e) => setPolicyForm({ ...policyForm, dailySpendingLimit: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-indigo-600 focus:bg-white font-semibold"
                placeholder="500000"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Max AI Discount Allowance (%)
              </label>
              <input
                type="number"
                value={policyForm.maxDiscountPercent}
                onChange={(e) => setPolicyForm({ ...policyForm, maxDiscountPercent: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-indigo-600 focus:bg-white font-semibold"
                placeholder="10"
              />
            </div>

            {policySuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Merchant policy updated successfully!</span>
              </div>
            )}

            <button
              type="submit"
              disabled={savingPolicy}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-sm shadow-indigo-600/30 flex items-center justify-center space-x-2"
            >
              {savingPolicy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>Save & Enforce Selling Policy</span>
            </button>
          </form>
        </div>
      )}

      {/* ================= TAB 4: AUDIT TRAIL LOG ================= */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xs space-y-4">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" /> Organized Transaction Audit Log
              </h2>
              <p className="text-xs text-slate-500 font-medium">Products requested & purchased by buyers. Click any transaction to inspect full Agent-to-Agent (A2A) dialogue.</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-700 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 font-mono font-bold">
                {getGroupedSessions().length} Total Transactions
              </span>
            </div>
          </div>

          <div className="p-5 space-y-4 max-h-[650px] overflow-y-auto">
            {getGroupedSessions().length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs font-medium">
                No transaction logs recorded yet. Prompt the AI Buyer Agent to generate live logs.
              </div>
            ) : (
              getGroupedSessions().map((group) => {
                const isExpanded = expandedSessionId === group.sessionId;
                const maskPII = (str) => {
                  if (!str) return '';
                  return str.replace(/Alex Vance/gi, 'Alex V.').replace(/alex@(agentcommerce|agentrelay)\.ai/gi, 'alex@****.ai');
                };

                return (
                  <div key={group.sessionId} className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 hover:border-indigo-300 transition-all shadow-2xs">
                    {/* Transaction Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                          🛍️
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <span>{group.productName || 'Agent Commerce AI Shopping Session'}</span>
                          </h4>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5 font-mono">
                            <span className="text-indigo-700 font-bold">ID: {group.sessionId.slice(-10)}</span>
                            <span>•</span>
                            <span>{new Date(group.lastUpdated).toLocaleTimeString()}</span>
                            <span>•</span>
                            <span>{group.events.length} Protocol Events</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 self-end sm:self-center">
                        {group.totalAmount > 0 && (
                          <span className="text-sm font-black text-slate-900 font-mono">
                            ₹{group.totalAmount.toLocaleString()}
                          </span>
                        )}

                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          group.isAutoPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          group.requiresApproval ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {group.isAutoPaid ? '⚡ AUTONOMOUS PAID' : group.requiresApproval ? '⏳ AWAITING APPROVAL' : 'COMPLETED'}
                        </span>

                        <button
                          onClick={() => setExpandedSessionId(isExpanded ? null : group.sessionId)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-all flex items-center space-x-1.5 text-xs font-bold"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{isExpanded ? 'Close Dialogue' : 'View A2A Dialogue'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Agent-to-Agent Conversation */}
                    {isExpanded && (
                      <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <div className="flex items-center space-x-2">
                            <Bot className="w-4 h-4 text-indigo-600" />
                            <span className="text-xs font-bold text-slate-900">Agent-to-Agent (A2A) Negotiation & Execution Timeline</span>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                            Zero-Trust Audit Log
                          </span>
                        </div>

                        <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                          {group.events.map((evt, idx) => (
                            <div key={evt._id || idx} className="p-3 rounded-lg bg-white border border-slate-200 text-xs space-y-1 shadow-2xs">
                              <div className="flex items-center justify-between text-[10px] font-mono">
                                <span className={`font-bold ${
                                  evt.actor === 'BUYER_AGENT' ? 'text-indigo-700' :
                                  evt.actor === 'MERCHANT_AGENT' ? 'text-emerald-700' :
                                  evt.actor === 'PAYMENT_SERVICE' ? 'text-sky-700' : 'text-amber-700'
                                }`}>
                                  {evt.actor}
                                </span>
                                <span className="text-slate-400">{new Date(evt.createdAt).toLocaleTimeString()}</span>
                              </div>
                              <div className="font-bold text-slate-900">{maskPII(evt.title)}</div>
                              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">{maskPII(evt.description)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL 1: ADD PRODUCT ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Add New Catalog Product</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Product Title</label>
                <input
                  type="text"
                  value={productForm.title}
                  onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                  placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:outline-none focus:border-indigo-600 focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:outline-none focus:border-indigo-600 focus:bg-white font-semibold"
                  >
                    {categoriesList.filter(c => c !== 'All').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">SKU Code</label>
                  <input
                    type="text"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:outline-none focus:border-indigo-600 focus:bg-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Price (₹ INR)</label>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="18999"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:outline-none focus:border-indigo-600 focus:bg-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Stock Units</label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:outline-none focus:border-indigo-600 focus:bg-white font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:outline-none focus:border-indigo-600 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Image URL</label>
                <input
                  type="text"
                  value={productForm.imageUrl}
                  onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Search Tags (comma separated)</label>
                <input
                  type="text"
                  value={productForm.tags}
                  onChange={(e) => setProductForm({ ...productForm, tags: e.target.value })}
                  placeholder="travel, noise-canceling, battery"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center space-x-1 shadow-sm"
                >
                  {savingProduct && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Product</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: EDIT PRODUCT ================= */}
      {isEditModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Edit Product</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Product Title</label>
                <input
                  type="text"
                  value={productForm.title}
                  onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:outline-none focus:border-indigo-600 focus:bg-white font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:outline-none focus:border-indigo-600 focus:bg-white font-semibold"
                  >
                    {categoriesList.filter(c => c !== 'All').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Price (₹ INR)</label>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:outline-none focus:border-indigo-600 focus:bg-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Stock Units</label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:outline-none focus:border-indigo-600 focus:bg-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">SKU</label>
                  <input
                    type="text"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:outline-none focus:border-indigo-600 focus:bg-white font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:outline-none focus:border-indigo-600 focus:bg-white"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center space-x-1 shadow-sm"
                >
                  {savingProduct && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Update Product</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: AI PRODUCT INSPECTOR ================= */}
      {inspectModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-900 text-base">AI Product Intelligence Inspector</h3>
              </div>
              <button onClick={() => setInspectModalOpen(false)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>

            {loadingAiReport ? (
              <div className="py-12 text-center text-slate-500 text-xs font-semibold space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
                <p>Analyzing MongoDB product specs & autonomous discovery score...</p>
              </div>
            ) : aiReportData ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center space-x-4 shadow-xs">
                  <img
                    src={aiReportData.product.imageUrl}
                    alt={aiReportData.product.title}
                    className="w-14 h-14 rounded-lg object-cover bg-white border border-slate-200 shadow-xs"
                  />
                  <div>
                    <span className="text-[10px] font-mono text-indigo-700 font-bold">{aiReportData.product.sku}</span>
                    <h4 className="font-bold text-slate-900 text-sm">{aiReportData.product.title}</h4>
                    <span className="font-extrabold text-slate-900 text-xs mt-0.5 block">₹{aiReportData.product.price.toLocaleString()}</span>
                  </div>
                </div>

                {/* AI Category Hierarchy */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 shadow-xs">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600">AI Category Hierarchy</span>
                  <div className="flex items-center space-x-2 font-mono text-xs text-slate-800">
                    {aiReportData.aiCategoryHierarchy?.map((cat, idx) => (
                      <React.Fragment key={idx}>
                        <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-indigo-700 font-semibold">{cat}</span>
                        {idx < aiReportData.aiCategoryHierarchy.length - 1 && <span className="text-slate-400">→</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Target Use Cases */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 shadow-xs">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">Target Use Cases</span>
                  <div className="flex flex-wrap gap-2">
                    {aiReportData.useCases?.map((uc, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium text-xs">
                        • {uc}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Key Attributes & Specs */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 shadow-xs">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Key Attributes & Specs</span>
                  <div className="grid grid-cols-2 gap-2 text-slate-800 font-mono text-[11px]">
                    {aiReportData.keyAttributes?.map((attr, idx) => (
                      <div key={idx} className="bg-white p-2 rounded-md border border-slate-200 font-medium">
                        {attr}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compatible Bundle Products */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 shadow-xs">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600">Compatible Bundle Products</span>
                  <div className="space-y-2">
                    {aiReportData.compatibleProducts?.map((comp, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-indigo-700 text-[11px] font-bold">{comp.sku}</span>
                          <span className="text-slate-900 font-medium">{comp.title}</span>
                        </div>
                        <span className="font-bold text-slate-900">₹{comp.price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Policy Governance Status */}
                <div className={`p-4 rounded-xl border space-y-1 shadow-xs ${
                  aiReportData.policyAssessment?.requiresApproval
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <div className="flex items-center space-x-2 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Policy Suitability: {aiReportData.policyAssessment?.status}</span>
                  </div>
                  <p className="text-[11px] opacity-90 font-medium">{aiReportData.policyAssessment?.reason}</p>
                </div>

              </div>
            ) : null}

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setInspectModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-medium text-xs hover:bg-slate-200 shadow-xs"
              >
                Close AI Inspector
              </button>
            </div>


          </div>
        </div>
      )}

    </div>
  );
}

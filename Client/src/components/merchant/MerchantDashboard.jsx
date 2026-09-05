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
    brand: 'AgentCommerce',
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
    // Auto-refresh merchant audit log and live metrics every 3 seconds for dual-window monitoring
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
      brand: 'AgentCommerce',
      price: '',
      stock: 50,
      sku: `SKU-${Date.now().toString().slice(-4)}`,
      imageUrl: '',
      tags: 'travel, audio, premium',
      features: 'High performance sound, Ergonomic fit',
      useCases: 'Long flights, Remote work, Travel',
      targetAudience: 'Travelers & Tech Enthusiasts',
      specs: {
        batteryLife: '30 Hours',
        noiseCancellation: 'Active ANC',
        weight: '250g',
        connectivity: 'Bluetooth 5.2',
      },
    });
    setIsAddModalOpen(true);
  };

  // Open Edit Product Modal
  const openEditModal = (item) => {
    setSelectedProduct(item);
    setProductForm({
      title: item.title || '',
      description: item.description || '',
      category: item.category || 'Audio',
      brand: item.brand || 'AgentCommerce',
      price: item.price || '',
      stock: item.stock !== undefined ? item.stock : 50,
      sku: item.sku || '',
      imageUrl: item.imageUrl || '',
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || ''),
      features: Array.isArray(item.features) ? item.features.join(', ') : (item.features || ''),
      useCases: Array.isArray(item.useCases) ? item.useCases.join(', ') : (item.useCases || 'Long flights, Travel'),
      targetAudience: item.targetAudience || 'Travelers & Tech Enthusiasts',
      specs: item.specs || { batteryLife: '30 Hours', noiseCancellation: 'Active ANC' },
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">Merchant Control Room</h1>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Policies Enforced
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            AgentCommerce Operational Control Room: Revenue analytics, catalog management, AI inspector & decision logs.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-600/30 transition-all text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>

          <button
            onClick={fetchMerchantData}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-all text-xs font-medium"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Overview Stat Cards (Backed by Real MongoDB Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-xl space-y-2 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Store Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            ₹{(overviewMetrics?.totalRevenue || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400">
            AI-Attributed: <strong className="text-emerald-400">₹{(overviewMetrics?.aiAttributedRevenue || 0).toLocaleString()}</strong>
          </p>
        </div>

        <div className="glass-card p-5 rounded-xl space-y-2 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">AI-Assisted Orders</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            {overviewMetrics?.aiAssistedOrders || 0} Orders
          </div>
          <p className="text-[11px] text-slate-400">
            AOV: <strong className="text-indigo-300">₹{(overviewMetrics?.averageOrderValue || 0).toLocaleString()}</strong>
          </p>
        </div>

        <div className="glass-card p-5 rounded-xl space-y-2 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">AI Recommendation Conversion</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            {overviewMetrics?.aiConversionRatePercent || 100}%
          </div>
          <p className="text-[11px] text-slate-400">
            Cross-Sell Revenue: <strong className="text-white">₹{(overviewMetrics?.aiCrossSellRevenue || 0).toLocaleString()}</strong>
          </p>
        </div>

        <div className="glass-card p-5 rounded-xl space-y-2 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Autonomous Policy Limit</span>
            <ShieldCheck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            ₹{(policy?.autonomousPurchaseLimit || 10000).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400">
            Approval Rate: <strong className="text-emerald-400">{overviewMetrics?.approvalRatePercent || 100}%</strong>
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-800 flex space-x-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-sm font-medium transition-all flex items-center space-x-2 ${
            activeTab === 'overview'
              ? 'border-b-2 border-indigo-500 text-indigo-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>AI Overview & Control Room</span>
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 text-sm font-medium transition-all flex items-center space-x-2 ${
            activeTab === 'catalog'
              ? 'border-b-2 border-indigo-500 text-indigo-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Product Catalog CRUD ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('policy')}
          className={`pb-3 text-sm font-medium transition-all flex items-center space-x-2 ${
            activeTab === 'policy'
              ? 'border-b-2 border-indigo-500 text-indigo-400 font-semibold'
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
              ? 'border-b-2 border-indigo-500 text-indigo-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Live Decision Audit Stream</span>
        </button>
      </div>

      {/* ================= TAB 1: AI OVERVIEW & CONTROL ROOM ================= */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Growth Opportunities Widget */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" /> Data-Driven Growth Opportunities
                </h2>
                <p className="text-xs text-slate-400">
                  Automated store insights derived from active MongoDB catalog items and customer purchase pairings.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {growthOpps.map((opp) => (
                <div
                  key={opp.id}
                  className="glass-panel p-5 rounded-2xl border border-indigo-500/30 space-y-3 bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {opp.type}
                    </span>
                    <span className="text-xs font-bold text-emerald-400 font-mono">
                      {opp.supportingMetrics?.estimatedAovImpact}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-sm">{opp.title}</h3>
                  <p className="text-xs text-slate-300">{opp.evidence}</p>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Suggested Action</span>
                    <p>{opp.suggestedAction}</p>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <div className="flex space-x-1 font-mono text-[10px] text-slate-400">
                      <span>Skus:</span>
                      <span className="text-indigo-300">{opp.relevantSkus?.join(', ')}</span>
                    </div>

                    {/* <button
                      onClick={() => {
                        setActiveTab('catalog');
                        setActionSuccessMsg(`Growth Opportunity Loaded: ${opp.title}`);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1"
                    >
                      <span>Open Opportunity</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button> */}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live AI Activity Feed Stream */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" /> Live AI Activity Stream
              </h2>
             
            </div>

            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {auditEvents.slice(0, 10).map((evt) => {
                const maskPII = (str) => {
                  if (!str) return '';
                  return str
                    .replace(/Alex Vance/gi, 'Alex V.')
                    .replace(/alex@agentcommerce\.ai/gi, 'alex@****.ai');
                };

                return (
                  <div key={evt._id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className={`font-semibold ${
                        evt.actor === 'SALES_AGENT' || evt.actor === 'BUYER_AGENT' ? 'text-indigo-400' :
                        evt.actor === 'MERCHANT_AGENT' ? 'text-emerald-400' :
                        evt.actor === 'PAYMENT_SERVICE' ? 'text-sky-400' : 'text-amber-400'
                      }`}>
                        {evt.actor}
                      </span>
                      <span className="text-slate-500">{new Date(evt.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <div className="font-semibold text-white">{maskPII(evt.title)}</div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{maskPII(evt.description)}</p>
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-xl border border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by title, SKU, or tags..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto">
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
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
              <div key={item._id} className="glass-panel p-5 rounded-2xl space-y-4 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
                <div className="space-y-3">
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
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-300 bg-slate-950/80 backdrop-blur border border-slate-700">
                      {item.sku}
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
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400">Stock: <strong className="text-white">{item.stock}</strong></span>
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

                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <button
                      onClick={() => openAiInspectorModal(item)}
                      className="py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-medium flex items-center justify-center gap-1"
                      title="Inspect AI Category & Specs"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-400" />
                      <span>AI Inspect</span>
                    </button>

                    <button
                      onClick={() => openEditModal(item)}
                      className="py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-medium flex items-center justify-center gap-1"
                      title="Edit Product"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleArchiveProduct(item._id, item.title)}
                      className="py-1.5 rounded-lg bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-800 font-medium flex items-center justify-center gap-1"
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
        <div className="max-w-2xl glass-panel p-6 rounded-2xl space-y-6 border border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white">Merchant AI Governance Policy</h2>
          
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
                placeholder="500000"
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

      {/* ================= TAB 4: AUDIT TRAIL LOG ================= */}
      {activeTab === 'audit' && (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 space-y-4">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-400" /> Organized Transaction Audit Log
              </h2>
              <p className="text-xs text-slate-400">Products requested & purchased by buyers. Click any transaction to inspect full Agent-to-Agent (A2A) dialogue.</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-300 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 font-mono">
                {getGroupedSessions().length} Total Transactions
              </span>
            </div>
          </div>

          <div className="p-5 space-y-4 max-h-[650px] overflow-y-auto">
            {getGroupedSessions().length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                No transaction logs recorded yet. Prompt the AI Buyer Agent to generate live logs.
              </div>
            ) : (
              getGroupedSessions().map((group) => {
                const isExpanded = expandedSessionId === group.sessionId;
                const maskPII = (str) => {
                  if (!str) return '';
                  return str.replace(/Alex Vance/gi, 'Alex V.').replace(/alex@agentcommerce\.ai/gi, 'alex@****.ai');
                };

                return (
                  <div key={group.sessionId} className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 hover:border-indigo-500/40 transition-all shadow-md">
                    {/* Transaction Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                          🛍️
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm flex items-center gap-2">
                            <span>{group.productName || 'Agent Commerce AI Shopping Session'}</span>
                          </h4>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5 font-mono">
                            <span className="text-indigo-400">ID: {group.sessionId.slice(-10)}</span>
                            <span>•</span>
                            <span>{new Date(group.lastUpdated).toLocaleTimeString()}</span>
                            <span>•</span>
                            <span>{group.events.length} Protocol Events</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 self-end sm:self-center">
                        {group.totalAmount > 0 && (
                          <span className="text-sm font-black text-indigo-300 font-mono">
                            ₹{group.totalAmount.toLocaleString()}
                          </span>
                        )}

                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          group.isAutoPaid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          group.requiresApproval ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {group.isAutoPaid ? '⚡ AUTONOMOUS PAID' : group.requiresApproval ? '⏳ AWAITING APPROVAL' : 'COMPLETED'}
                        </span>

                        <button
                          onClick={() => setExpandedSessionId(isExpanded ? null : group.sessionId)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-all flex items-center space-x-1.5 text-xs font-semibold"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{isExpanded ? 'Close Dialogue' : 'View A2A Dialogue'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Agent-to-Agent Conversation */}
                    {isExpanded && (
                      <div className="mt-3 p-4 rounded-xl bg-slate-950/90 border border-indigo-500/30 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <div className="flex items-center space-x-2">
                            <Bot className="w-4 h-4 text-indigo-400" />
                            <span className="text-xs font-bold text-white">Agent-to-Agent (A2A) Negotiation & Execution Timeline</span>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            Zero-Trust Audit Log
                          </span>
                        </div>

                        <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                          {group.events.map((evt, idx) => (
                            <div key={evt._id || idx} className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-mono">
                                <span className={`font-bold ${
                                  evt.actor === 'BUYER_AGENT' ? 'text-indigo-400' :
                                  evt.actor === 'MERCHANT_AGENT' ? 'text-emerald-400' :
                                  evt.actor === 'PAYMENT_SERVICE' ? 'text-sky-400' : 'text-amber-400'
                                }`}>
                                  {evt.actor}
                                </span>
                                <span className="text-slate-500">{new Date(evt.createdAt).toLocaleTimeString()}</span>
                              </div>
                              <div className="font-semibold text-white">{maskPII(evt.title)}</div>
                              <p className="text-[11px] text-slate-300 leading-relaxed">{maskPII(evt.description)}</p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Add New Catalog Product</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Product Title</label>
                <input
                  type="text"
                  value={productForm.title}
                  onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                  placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                  >
                    {categoriesList.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Price (₹ INR)</label>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="18999"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Inventory / Stock</label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">SKU Code</label>
                  <input
                    type="text"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Image URL</label>
                <input
                  type="text"
                  value={productForm.imageUrl}
                  onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">AI Use Cases (comma-separated)</label>
                <input
                  type="text"
                  value={productForm.useCases}
                  onChange={(e) => setProductForm({ ...productForm, useCases: e.target.value })}
                  placeholder="Long flights, Remote work, Travel"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1.5"
                >
                  {savingProduct ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Save Product</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: EDIT PRODUCT ================= */}
      {isEditModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Edit Product Details & AI Metadata</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Product Title</label>
                <input
                  type="text"
                  value={productForm.title}
                  onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Price (₹ INR)</label>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Inventory / Stock</label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={productForm.tags}
                  onChange={(e) => setProductForm({ ...productForm, tags: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">AI Target Use Cases</label>
                <input
                  type="text"
                  value={productForm.useCases}
                  onChange={(e) => setProductForm({ ...productForm, useCases: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1.5"
                >
                  {savingProduct ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: AI PRODUCT INSPECTOR ================= */}
      {inspectModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 max-h-[85vh] overflow-y-auto shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">AgentCommerce AI Product Inspector</h3>
                  <p className="text-xs font-mono text-slate-400">Understanding how AI agents parse this product</p>
                </div>
              </div>
              <button onClick={() => setInspectModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            {loadingAiReport ? (
              <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
                <p>Generating AI product inspection report from database...</p>
              </div>
            ) : aiReportData ? (
              <div className="space-y-5 text-xs">
                
                {/* Product Summary Header */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center space-x-4">
                  <img
                    src={aiReportData.product.imageUrl}
                    alt={aiReportData.product.title}
                    className="w-14 h-14 rounded-lg object-cover bg-slate-900 border border-slate-800"
                  />
                  <div>
                    <span className="text-[10px] font-mono text-indigo-400">{aiReportData.product.sku}</span>
                    <h4 className="font-bold text-white text-sm">{aiReportData.product.title}</h4>
                    <span className="font-extrabold text-white text-xs mt-0.5 block">₹{aiReportData.product.price.toLocaleString()}</span>
                  </div>
                </div>

                {/* AI Category Hierarchy */}
                <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400">AI Category Hierarchy</span>
                  <div className="flex items-center space-x-2 font-mono text-xs text-slate-200">
                    {aiReportData.aiCategoryHierarchy?.map((cat, idx) => (
                      <React.Fragment key={idx}>
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-indigo-300">{cat}</span>
                        {idx < aiReportData.aiCategoryHierarchy.length - 1 && <span className="text-slate-500">→</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Target Use Cases */}
                <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Target Use Cases</span>
                  <div className="flex flex-wrap gap-2">
                    {aiReportData.useCases?.map((uc, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                        • {uc}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Key Attributes & Specs */}
                <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Key Attributes & Specs</span>
                  <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono text-[11px]">
                    {aiReportData.keyAttributes?.map((attr, idx) => (
                      <div key={idx} className="bg-slate-900 p-2 rounded-md border border-slate-800/80">
                        {attr}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compatible Bundle Products */}
                <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400">Compatible Bundle Products</span>
                  <div className="space-y-2">
                    {aiReportData.compatibleProducts?.map((comp, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-indigo-300 text-[11px]">{comp.sku}</span>
                          <span className="text-white font-medium">{comp.title}</span>
                        </div>
                        <span className="font-bold text-white">₹{comp.price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Policy Governance Status */}
                <div className={`p-4 rounded-xl border space-y-1 ${
                  aiReportData.policyAssessment?.requiresApproval
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}>
                  <div className="flex items-center space-x-2 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Policy Suitability: {aiReportData.policyAssessment?.status}</span>
                  </div>
                  <p className="text-[11px] opacity-90">{aiReportData.policyAssessment?.reason}</p>
                </div>

              </div>
            ) : null}

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setInspectModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 font-medium text-xs hover:bg-slate-700"
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

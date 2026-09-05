import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ShoppingBag, 
  Search, 
  Check, 
  Star, 
  Bot, 
  ArrowRight, 
  ShieldCheck,
  Laptop,
  Headphones,
  Smartphone,
  Camera,
  Layers
} from 'lucide-react';
import { productApi } from '../../services/api';

export default function BuyerStorefront({ openAiChat, policy, onAddToCart }) {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(false);

  const categories = ['All', 'Audio', 'Computing', 'Mobile', 'Smart', 'Travel', 'Cameras', 'Home & Lifestyle'];

  useEffect(() => {
    fetchProducts();
  }, [category]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = category !== 'All' ? { category } : {};
      const res = await productApi.getProducts(params);
      setProducts(res.data.products || []);
    } catch (err) {
      console.error('Failed to fetch storefront products:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden glass-panel p-8 md:p-12 border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 shadow-2xl">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI-Native Commerce Platform</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Discover & Purchase Products Controlled by <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">Autonomous AI Agents</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Ask our AI Sales Agent naturally. Browse laptops, smartphones, ANC headphones, travel accessories, and cameras. The AI evaluates specs, applies merchant discount policies, and completes zero-click checkout via Razorpay Vault.
          </p>

          {/* Quick Demo Action Card */}
          <div className="pt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={openAiChat}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center space-x-2"
            >
              <Bot className="w-4 h-4 text-emerald-300" />
              <span>Launch AI Sales Agent</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills & Filter */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" /> Product Categories
          </h2>
          <span className="text-xs text-slate-400">
            Showing {products.length} catalog items
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                category === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((item) => (
          <div key={item._id} className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all">
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
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-950/80 text-amber-300 backdrop-blur border border-slate-700 flex items-center space-x-1">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span>{item.rating || 4.8}</span>
                </span>
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600/90 text-white backdrop-blur border border-indigo-500/30">
                  {item.category}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-white text-sm line-clamp-1">{item.title}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.description}</p>
              </div>

              {/* Feature Highlights */}
              <div className="space-y-1 pt-1">
                {item.features?.slice(0, 2).map((feat, idx) => (
                  <div key={idx} className="flex items-center space-x-1.5 text-[11px] text-slate-300">
                    <Check className="w-3 h-3 text-indigo-400 shrink-0" />
                    <span className="truncate">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price & Action */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-base font-extrabold text-white">₹{item.price.toLocaleString()}</div>
                <span className="text-[10px] text-slate-400">In Stock ({item.stock})</span>
              </div>

              <button
                onClick={() => onAddToCart(item)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-all flex items-center space-x-1.5"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add to Cart</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Agent Launch Button */}
      <button
        onClick={openAiChat}
        className="fixed bottom-6 right-6 z-40 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs sm:text-sm shadow-2xl shadow-indigo-600/40 transition-all flex items-center space-x-2 border border-indigo-400/30 animate-bounce"
      >
        <Bot className="w-5 h-5 text-emerald-300" />
        <span>Ask AI Sales Agent</span>
      </button>

    </div>
  );
}

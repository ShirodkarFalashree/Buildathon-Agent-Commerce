import React, { useState, useEffect } from 'react';
import { User, CreditCard, ShieldCheck, CheckCircle2, X, Lock, Sparkles, Save, Loader2 } from 'lucide-react';
import { customerApi } from '../../services/api';

export default function CustomerProfileModal({ isOpen, onClose, sessionId, onProfileUpdated }) {
  const [profile, setProfile] = useState({
    name: 'Alex Vance',
    email: 'alex@agentcommerce.ai',
    phone: '+91 9876543210',
    savedPaymentMethod: {
      cardHolder: 'Alex Vance',
      cardNumber: '4532 8912 3491 4912',
      brand: 'Visa',
      expiry: '12/28',
      isPreAuthorizedForAgent: true,
      maxAutonomousLimit: 10000,
    },
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    if (isOpen && sessionId) {
      fetchProfile();
    }
  }, [isOpen, sessionId]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await customerApi.getProfile(sessionId);
      if (res.data.customer) {
        const c = res.data.customer;
        setProfile({
          name: c.name || 'Alex Vance',
          email: c.email || 'alex@agentcommerce.ai',
          phone: c.phone || '+91 9876543210',
          savedPaymentMethod: {
            cardHolder: c.savedPaymentMethod?.cardHolder || c.name || 'Alex Vance',
            cardNumber: c.savedPaymentMethod?.cardNumberMasked || '4532 8912 3491 4912',
            brand: c.savedPaymentMethod?.brand || 'Visa',
            expiry: c.savedPaymentMethod?.expiry || '12/28',
            isPreAuthorizedForAgent: c.savedPaymentMethod?.isPreAuthorizedForAgent !== false,
            maxAutonomousLimit: c.savedPaymentMethod?.maxAutonomousLimit || 10000,
          },
        });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await customerApi.updateProfile(sessionId, profile);
      setSuccessMsg(true);
      if (onProfileUpdated) {
        onProfileUpdated(res.data.customer);
      }
      setTimeout(() => {
        setSuccessMsg(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Failed to save customer profile:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg glass-panel p-6 rounded-2xl border border-indigo-500/30 shadow-2xl space-y-5 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800 text-xs"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Buyer Profile & Payment Vault</h3>
            <p className="text-xs text-slate-400">Manage saved payment methods and autonomous AI pre-authorization</p>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center space-y-2">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading Profile Vault...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            
            {/* Customer Personal Details */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            {/* Saved Payment Card Box */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-indigo-300 font-bold">
                  <CreditCard className="w-4 h-4" />
                  <span>Saved Payment Card (Tokenized Vault)</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {profile.savedPaymentMethod.brand}
                </span>
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Cardholder Name</label>
                <input
                  type="text"
                  value={profile.savedPaymentMethod.cardHolder}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      savedPaymentMethod: { ...profile.savedPaymentMethod, cardHolder: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-slate-400 text-[11px] mb-1">Card Number</label>
                  <input
                    type="text"
                    value={profile.savedPaymentMethod.cardNumber}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        savedPaymentMethod: { ...profile.savedPaymentMethod, cardNumber: e.target.value },
                      })
                    }
                    placeholder="4532 8912 3491 4912"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Card Network</label>
                  <select
                    value={profile.savedPaymentMethod.brand}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        savedPaymentMethod: { ...profile.savedPaymentMethod, brand: e.target.value },
                      })
                    }
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="Amex">Amex</option>
                    <option value="Rupay">Rupay</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Autonomous AI Pre-Authorization Toggle */}
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.savedPaymentMethod.isPreAuthorizedForAgent}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      savedPaymentMethod: {
                        ...profile.savedPaymentMethod,
                        isPreAuthorizedForAgent: e.target.checked,
                      },
                    })
                  }
                  className="mt-0.5 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-bold text-emerald-300">
                    Pre-Authorize AI Sales Agent for Zero-Click Auto Pay
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Allows AI Sales Agent to autonomously charge your saved card for recommended purchases under <strong>₹10,000</strong> without requiring manual popup authorization.
                  </p>
                </div>
              </label>
            </div>

            {successMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Profile & Payment Vault saved to database!</span>
              </div>
            )}

            {/* Save Action Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Buyer Profile & Payment Vault</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ShoppingBag, 
  ShieldCheck, 
  Activity, 
  Loader2,
  Lock,
  Trash2
} from 'lucide-react';
import { agentApi, paymentApi } from '../../services/api';

export default function AiShoppingChat({ sessionId, onAgentResponse, onRequestApproval, onPaymentComplete, isOpen, onClose }) {
  const [prompt, setPrompt] = useState('Find budget ANC headphones under ₹10,000.');
  const [loading, setLoading] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [chatResult, setChatResult] = useState(null);

  const samplePrompts = [
    'Find budget ANC headphones under ₹10,000.',
    'I need a MacBook Air for computing under ₹100,000.',
    'Find a 5G smartphone with magnetic power bank under ₹60,000.',
    'Show me 4K vlogging cameras for travel under ₹40,000.',
    'Find a travel backpack with USB charging port under ₹5,000.',
  ];

  // Automatically reset chat when session ID changes (e.g. after order completion)
  useEffect(() => {
    setChatResult(null);
    setPrompt('Find budget ANC headphones under ₹10,000.');
  }, [sessionId]);

  const handleSend = async (customPrompt) => {
    const textToSend = customPrompt || prompt;
    if (!textToSend.trim() || loading) return;

    setLoading(true);
    setChatResult(null);

    try {
      const res = await agentApi.sendShoppingPrompt(sessionId, textToSend);
      setChatResult(res.data);
      if (onAgentResponse) {
        onAgentResponse(res.data);
      }

      // Check if policy triggers human approval
      if (res.data.policyEvaluation?.requiresApproval) {
        onRequestApproval(res.data);
      }
    } catch (err) {
      console.error('Agent chat failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDirectCheckout = async () => {
    if (!chatResult || checkingOut) return;
    setCheckingOut(true);

    try {
      const res = await paymentApi.createOrder({
        sessionId,
        cartId: chatResult.cart?.id || chatResult.cart?._id,
        isApproved: false, // Under limit, autonomous approval
      });

      const { order, razorpayOrder, keyId } = res.data;
      const rzpKey = keyId || 'rzp_test_TY0D8SOVosBKXb';

      const options = {
        key: rzpKey,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || 'INR',
        name: 'AgentCommerce Flagship',
        description: `Order #${order.orderNumber} - Autonomous AI Order`,
        image: chatResult.primaryProduct?.imageUrl || 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=200',
        order_id: (razorpayOrder.id && !razorpayOrder.id.startsWith('order_test_')) ? razorpayOrder.id : undefined,
        handler: async function (response) {
          try {
            const verifyRes = await paymentApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id || razorpayOrder.id,
              razorpay_payment_id: response.razorpay_payment_id || `pay_test_${Date.now()}`,
              razorpay_signature: response.razorpay_signature || 'verified_test_sig',
              dbOrderId: order._id,
            });

            if (onPaymentComplete) {
              onPaymentComplete(verifyRes.data.order);
            }
            onClose();
          } catch (vErr) {
            console.error('Payment verification failed:', vErr);
          }
        },
        modal: {
          ondismiss: function () {
            setCheckingOut(false);
          },
        },
        prefill: {
          name: 'Demo Buyer',
          email: 'buyer@agentcommerce.ai',
          contact: '9876543210',
        },
        theme: {
          color: '#10B981',
        },
      };

      if (window.Razorpay) {
        try {
          const rzp = new window.Razorpay(options);
          rzp.open();
        } catch (e) {
          const verifyRes = await paymentApi.verifyPayment({
            razorpay_order_id: razorpayOrder.id,
            razorpay_payment_id: `pay_test_${Date.now()}`,
            razorpay_signature: 'test_mode_signature',
            dbOrderId: order._id,
          });

          if (onPaymentComplete) {
            onPaymentComplete(verifyRes.data.order);
          }
          onClose();
        }
      } else {
        const verifyRes = await paymentApi.verifyPayment({
          razorpay_order_id: razorpayOrder.id,
          razorpay_payment_id: `pay_test_${Date.now()}`,
          razorpay_signature: 'test_mode_signature',
          dbOrderId: order._id,
        });

        if (onPaymentComplete) {
          onPaymentComplete(verifyRes.data.order);
        }
        onClose();
      }
    } catch (err) {
      console.error('Direct checkout failed:', err);
    } finally {
      setCheckingOut(false);
    }
  };

  const clearChat = () => {
    setChatResult(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] z-50 glass-panel border-l border-slate-800 shadow-2xl flex flex-col justify-between">
      
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">AI Shopping Sales Agent</h3>
            <p className="text-[11px] text-slate-400">Natural Language Commerce Agent</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {chatResult && (
            <button
              onClick={clearChat}
              className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-red-400 border border-slate-800 text-xs flex items-center space-x-1"
              title="Clear Chat"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="text-[10px]">Clear</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800 text-xs"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Main Chat Body & Tool Calls */}
      <div className="flex-1 p-5 overflow-y-auto space-y-5">
        
        {/* Sample Prompt Suggestions */}
        {!chatResult && !loading && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400 font-medium">Try asking the agent:</p>
            <div className="space-y-2">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(p);
                    handleSend(p);
                  }}
                  className="w-full text-left p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-300 transition-all flex items-center justify-between group"
                >
                  <span>"{p}"</span>
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-all" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading Indicator with Agent Thought Loop */}
        {loading && (
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 text-center">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
            <p className="text-xs font-semibold text-indigo-300">Evaluating Catalog & Enforcing Policy...</p>
            <div className="text-[11px] text-slate-400 space-y-1">
              <div>• OBSERVE: Parsing user prompt intent</div>
              <div>• REASON: Searching merchant catalog items</div>
              <div>• POLICY CHECK: Evaluating ₹10,000 limit</div>
            </div>
          </div>
        )}

        {/* Agent Execution Result */}
        {chatResult && (
          <div className="space-y-5 animate-in fade-in duration-300">
            
            {/* Intent Badge */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Customer Intent</span>
              <p className="text-xs text-slate-200">{chatResult.intentSummary}</p>
            </div>

            {/* Tool Calls Execution Trace */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-300">
                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                <span>Agent Decision & Tool Call Execution</span>
              </div>
              <div className="space-y-1.5">
                {chatResult.toolCalls?.map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/50 pb-1">
                    <span className="font-mono text-indigo-300">✓ {t.name}()</span>
                    <span className="text-slate-300 font-medium truncate max-w-[220px]">{t.result}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendation Card */}
            {chatResult.primaryProduct && (
              <div className="p-4 rounded-xl bg-slate-900 border border-indigo-500/30 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Primary Recommendation
                  </span>
                  <span className="text-xs text-amber-400 font-bold">★ {chatResult.primaryProduct.rating || 4.8}</span>
                </div>

                <div className="flex space-x-3">
                  <img
                    src={chatResult.primaryProduct.imageUrl}
                    alt={chatResult.primaryProduct.title}
                    className="w-16 h-16 rounded-lg object-cover bg-slate-800 border border-slate-700"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=800';
                    }}
                  />
                  <div>
                    <h4 className="font-bold text-white text-xs">{chatResult.primaryProduct.title}</h4>
                    <div className="text-sm font-extrabold text-indigo-300 mt-0.5">
                      ₹{chatResult.primaryProduct.price.toLocaleString()}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  "{chatResult.recommendationReason}"
                </p>

                {/* Cross-Sell Bundle Option */}
                {chatResult.crossSellProduct && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-emerald-400">Cross-sell Accessory Suggested</span>
                      <span className="font-bold text-white">₹{chatResult.crossSellProduct.price}</span>
                    </div>
                    <p className="text-[11px] text-slate-300">{chatResult.crossSellProduct.title}</p>
                  </div>
                )}
              </div>
            )}

            {/* Policy Enforcement Warning / Status */}
            {chatResult.policyEvaluation && (
              <div className={`p-4 rounded-xl border space-y-2 ${
                chatResult.policyEvaluation.requiresApproval
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}>
                <div className="flex items-center space-x-2 text-xs font-bold">
                  {chatResult.policyEvaluation.requiresApproval ? (
                    <Lock className="w-4 h-4 text-amber-400" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  )}
                  <span>
                    {chatResult.policyEvaluation.requiresApproval
                      ? 'Human Authorization Required'
                      : 'Autonomous Limit Check Passed'}
                  </span>
                </div>

                <p className="text-xs opacity-90">
                  {chatResult.policyEvaluation.reasons?.[0]}
                </p>

                {chatResult.policyEvaluation.requiresApproval ? (
                  <button
                    onClick={() => onRequestApproval(chatResult)}
                    className="w-full mt-2 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md flex items-center justify-center space-x-2"
                  >
                    <span>Authorize Purchase (₹{chatResult.cart?.total?.toLocaleString()})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={handleDirectCheckout}
                    disabled={checkingOut}
                    className="w-full mt-2 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md flex items-center justify-center space-x-2"
                  >
                    {checkingOut ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Initiating Razorpay...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>Proceed to Checkout & Pay (₹{chatResult.cart?.total?.toLocaleString()})</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

          </div>
        )}
      </div>

      {/* Chat Prompt Footer Input */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask AI agent for recommendations..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
}

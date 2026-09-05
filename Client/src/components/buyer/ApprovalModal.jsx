import React, { useState } from 'react';
import { ShieldAlert, CheckCircle, Lock, ArrowRight, X, Loader2, AlertCircle } from 'lucide-react';
import { paymentApi } from '../../services/api';

export default function ApprovalModal({ isOpen, onClose, agentResponse, onPaymentComplete, sessionId }) {
  const [authorizing, setAuthorizing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen || !agentResponse) return null;

  const { cart, policyEvaluation, primaryProduct, crossSellProduct } = agentResponse;
  const limit = policyEvaluation?.autonomousPurchaseLimit || 10000;
  const total = cart?.total || 0;

  const handleConfirmAuthorization = async () => {
    setAuthorizing(true);
    setErrorMsg(null);

    try {
      // 1. Create Order on Backend with explicit human approval flag
      const res = await paymentApi.createOrder({
        sessionId,
        cartId: cart.id || cart._id,
        isApproved: true,
      });

      if (!res.data || !res.data.success) {
        setErrorMsg(res.data?.message || 'Policy engine blocked payment order creation');
        setAuthorizing(false);
        return;
      }

      const { order, razorpayOrder, keyId } = res.data;
      const rzpKey = keyId || 'rzp_test_TY0D8SOVosBKXb';

      // 2. Configure Razorpay Test Mode Options
      const options = {
        key: rzpKey,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || 'INR',
        name: 'AgentCommerce Flagship',
        description: `Order #${order.orderNumber} - AI Recommended`,
        image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=200',
        order_id: (razorpayOrder.id && !razorpayOrder.id.startsWith('order_test_')) ? razorpayOrder.id : undefined,
        handler: async function (response) {
          try {
            const verifyRes = await paymentApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id || razorpayOrder.id,
              razorpay_payment_id: response.razorpay_payment_id || `pay_test_${Date.now()}`,
              razorpay_signature: response.razorpay_signature || 'verified_test_sig',
              dbOrderId: order._id,
            });

            onPaymentComplete(verifyRes.data.order);
            onClose();
          } catch (vErr) {
            console.error('Payment verification failed:', vErr);
            setErrorMsg('Payment verification failed on server');
          }
        },
        modal: {
          ondismiss: function () {
            setAuthorizing(false);
          },
        },
        prefill: {
          name: 'Demo Buyer',
          email: 'buyer@agentcommerce.ai',
          contact: '9876543210',
        },
        theme: {
          color: '#4F46E5',
        },
      };

      // 3. Open Razorpay Modal if window.Razorpay SDK is loaded
      if (window.Razorpay) {
        try {
          const rzp = new window.Razorpay(options);
          rzp.open();
        } catch (rzpInitErr) {
          console.warn('Razorpay SDK init error, fallback to test capture:', rzpInitErr.message);
          // Sandbox fallback if Razorpay window popup is blocked
          const verifyRes = await paymentApi.verifyPayment({
            razorpay_order_id: razorpayOrder.id,
            razorpay_payment_id: `pay_test_${Date.now()}`,
            razorpay_signature: 'test_mode_signature',
            dbOrderId: order._id,
          });

          onPaymentComplete(verifyRes.data.order);
          onClose();
        }
      } else {
        // Fallback for environment without checkout.js loaded
        const verifyRes = await paymentApi.verifyPayment({
          razorpay_order_id: razorpayOrder.id,
          razorpay_payment_id: `pay_test_${Date.now()}`,
          razorpay_signature: 'test_mode_signature',
          dbOrderId: order._id,
        });

        onPaymentComplete(verifyRes.data.order);
        onClose();
      }
    } catch (err) {
      console.error('Failed to initiate payment:', err);
      const serverMessage = err.response?.data?.message || 'Purchase blocked by merchant governance policy';
      setErrorMsg(serverMessage);
    } finally {
      setAuthorizing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg glass-panel p-6 rounded-2xl border border-amber-500/30 shadow-2xl space-y-5 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800 text-xs"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Warning Icon & Header */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Human Spending Authorization Required</h3>
            <p className="text-xs text-amber-300">Backend Policy Security Guardrail Triggered</p>
          </div>
        </div>

        {/* Policy Limit Alert Box */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs space-y-2">
          <div className="flex justify-between font-semibold">
            <span>Requested Cart Total:</span>
            <span className="text-white font-extrabold text-sm">₹{total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-semibold text-slate-300">
            <span>Autonomous Purchase Limit:</span>
            <span>₹{limit.toLocaleString()}</span>
          </div>
          <div className="pt-2 border-t border-amber-500/20 text-[11px]">
            ⚠️ Because ₹{total.toLocaleString()} exceeds ₹{limit.toLocaleString()}, the AI agent is deterministically blocked from placing the order without human approval.
          </div>
        </div>

        {/* Error Alert Message if server blocks */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Cart Item Summary */}
        <div className="space-y-2 border-t border-b border-slate-800 py-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cart Breakdown</span>
          
          {primaryProduct && (
            <div className="flex justify-between text-xs text-white">
              <span>1x {primaryProduct.title}</span>
              <span className="font-bold">₹{primaryProduct.price.toLocaleString()}</span>
            </div>
          )}

          {crossSellProduct && (
            <div className="flex justify-between text-xs text-slate-300">
              <span>1x {crossSellProduct.title} (Flight Cross-sell)</span>
              <span className="font-bold">₹{crossSellProduct.price.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-700 transition-all"
          >
            Cancel
          </button>
          
          <button
            onClick={handleConfirmAuthorization}
            disabled={authorizing}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2"
          >
            {authorizing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Initiating Razorpay...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Authorize & Pay via Razorpay</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

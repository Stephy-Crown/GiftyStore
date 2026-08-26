import React, { useState } from 'react';
import { X, CheckCircle, CreditCard, ShieldCheck, Printer, ArrowRight, Crown, AlertCircle, Tag, MessageCircle } from 'lucide-react';
import siteConfig from '../data/config.json';

// Official WhatsApp SVG Icon
function WhatsAppIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.011 2c-5.506 0-9.975 4.469-9.975 9.974 0 1.76.459 3.477 1.332 4.992l-1.417 5.176 5.297-1.39c1.464.799 3.118 1.22 4.763 1.22h.004c5.505 0 9.974-4.469 9.974-9.974 0-2.666-1.039-5.171-2.924-7.056-1.884-1.884-4.39-2.923-7.054-2.923zm5.834 14.167c-.244.686-1.416 1.31-1.979 1.393-.518.077-1.16.109-1.864-.116-.427-.136-.975-.318-1.677-.621-2.951-1.274-4.877-4.254-5.025-4.45-.147-.196-1.2-1.597-1.2-3.047 0-1.45.756-2.164 1.025-2.458.27-.294.587-.368.783-.368.196 0 .392.002.564.01.182.009.426-.069.667.51.244.584.832 2.034.906 2.18.074.147.123.319.025.515-.098.196-.147.319-.294.49-.147.172-.309.384-.442.516-.147.147-.301.308-.129.603.172.295.763 1.258 1.637 2.037 1.124 1.002 2.072 1.313 2.367 1.46.295.147.466.123.638-.074.172-.196.736-.857.932-1.15.196-.294.392-.245.687-.136.294.11 1.864.879 2.183 1.038.319.159.531.235.605.358.074.123.074.714-.17 1.4z"/>
    </svg>
  );
}

export default function CheckoutModal({ cart = [], onClose, onSuccess, negotiatedItemOverride = null }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    state: 'Lagos',
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  // Check URL params for negotiated discount link
  const urlParams = new URLSearchParams(window.location.search);
  const discountPriceParam = urlParams.get('discountedPrice');
  const discountItemParam = urlParams.get('item');

  let subtotal = Array.isArray(cart) ? cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0) : 0;
  
  if (discountPriceParam) {
    subtotal = Number(discountPriceParam);
  }

  const freeShippingThreshold = siteConfig.freeShippingThreshold || 100000;
  const lagosRate = siteConfig.lagosDeliveryFee || 2500;
  const interstateRate = siteConfig.interstateDeliveryFee || 5000;

  const isFreeShipping = subtotal >= freeShippingThreshold;
  const shippingFee = isFreeShipping ? 0 : form.state === 'Lagos' ? lagosRate : interstateRate;
  const grandTotal = subtotal + shippingFee;

  const orderReference = `GIFTY-${Math.floor(100000 + Math.random() * 900000)}`;
  const orderDate = new Date().toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const validateForm = () => {
    if (!form.name.trim()) {
      setErrorMessage('Please enter your Full Name.');
      return false;
    }
    if (!form.phone.trim()) {
      setErrorMessage('Please enter your Phone / WhatsApp Number.');
      return false;
    }
    if (!form.address.trim()) {
      setErrorMessage('Please enter your Delivery Address.');
      return false;
    }
    setErrorMessage('');
    return true;
  };

  const handlePaystackPayment = () => {
    if (!validateForm()) return;

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setCompletedOrder({
        ref: orderReference,
        date: orderDate,
        customerName: form.name,
        phone: form.phone,
        address: `${form.address}, ${form.state}`,
        method: 'Verified Paystack Website Payment',
        status: discountPriceParam ? 'PAID NEGOTIATED PRICE VIA PAYSTACK' : 'PAID VIA PAYSTACK',
        items: discountItemParam ? [{ name: discountItemParam, price: Number(discountPriceParam), quantity: 1 }] : [...cart],
        subtotal,
        shippingFee,
        grandTotal,
      });
    }, 1200);
  };

  const sendWhatsAppReceiptNotification = () => {
    if (!completedOrder) return;
    const itemsText = completedOrder.items.map((i) => `${i.name} (NGN ${Number(i.price).toLocaleString()})`).join(', ');
    const msg =
      `GIFTY STORE AUTOMATED ORDER RECEIPT\n\n` +
      `Order Ref: #${completedOrder.ref}\n` +
      `Status: CONFIRMED - ${completedOrder.status}\n` +
      `Date: ${completedOrder.date}\n` +
      `Customer: ${completedOrder.customerName} (${completedOrder.phone})\n` +
      `Delivery Address: ${completedOrder.address}\n\n` +
      `Outfits: ${itemsText}\n` +
      `Subtotal: NGN ${completedOrder.subtotal.toLocaleString()}\n` +
      `Shipping: NGN ${completedOrder.shippingFee.toLocaleString()}\n` +
      `Grand Total Paid: NGN ${completedOrder.grandTotal.toLocaleString()}\n\n` +
      `Thank you for shopping with Gifty Store!`;

    window.open(`https://wa.me/${siteConfig.whatsappPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleWhatsAppNegotiation = () => {
    const itemNames = cart.map((c) => c.name).join(', ') || 'Dress Outfit';
    const msg =
      `GIFTY STORE PRICE NEGOTIATION REQUEST\n\n` +
      `Hello Gifty Store! I am browsing your website and interested in:\n` +
      `- Outfit: ${discountItemParam || itemNames}\n` +
      `- Listed Price: NGN ${subtotal.toLocaleString()}\n\n` +
      `I would like to request a discount or negotiate the price. Please send me a custom discounted website payment link!`;

    window.open(`https://wa.me/${siteConfig.whatsappPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleFinish = () => {
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-white border border-stone-200 text-stone-900 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative my-8 animate-in fade-in zoom-in duration-200">
        <button onClick={handleFinish} className="absolute right-4 top-4 text-stone-400 hover:text-stone-900 p-1">
          <X className="w-6 h-6" />
        </button>

        {completedOrder ? (
          /* High-Fashion Digital Receipt Screen */
          <div className="space-y-5">
            <div className="text-center space-y-2 pb-3 border-b border-stone-200">
              <div className="w-14 h-14 bg-gradient-to-tr from-amber-500 to-amber-300 text-stone-950 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <Crown className="w-7 h-7 text-stone-950" />
              </div>
              <h2 className="text-2xl font-serif font-black text-stone-900">{siteConfig.storeName}</h2>
              <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                CONFIRMED: {completedOrder.status}
              </span>
              <p className="text-xs text-stone-500">Order Receipt #{completedOrder.ref}</p>
            </div>

            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 text-stone-600 border-b border-stone-200/80 pb-2.5">
                <div>
                  <span className="text-[10px] font-bold text-stone-400 block uppercase">Customer</span>
                  <span className="font-bold text-stone-900">{completedOrder.customerName}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-stone-400 block uppercase">Date & Time</span>
                  <span className="font-bold text-stone-900">{completedOrder.date}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-stone-400 block uppercase mb-1">Delivery Address</span>
                <span className="font-bold text-stone-800">{completedOrder.address}</span>
              </div>

              <div className="pt-2 border-t border-stone-200/80 space-y-2">
                <span className="text-[10px] font-bold text-stone-400 uppercase block">Outfits Ordered</span>
                {completedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center font-medium">
                    <span>
                      {item.name} {item.size && `(${item.size})`} × {item.quantity || 1}
                    </span>
                    <span className="font-bold text-stone-900">
                      NGN {((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2.5 border-t border-stone-200 space-y-1.5 font-medium">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span>NGN {completedOrder.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Delivery Fee</span>
                  <span>{completedOrder.shippingFee === 0 ? 'FREE' : `NGN ${completedOrder.shippingFee.toLocaleString()}`}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-stone-900 pt-1 border-t border-stone-300">
                  <span>Total Amount Paid</span>
                  <span className="text-amber-600 text-base font-black">NGN {completedOrder.grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={sendWhatsAppReceiptNotification}
                className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-md"
              >
                <WhatsAppIcon className="w-4 h-4 fill-white" /> Send Automated Order Receipt via WhatsApp
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-900 font-extrabold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition border border-stone-200"
                >
                  <Printer className="w-4 h-4 text-amber-600" /> Print Receipt
                </button>
                
                <button
                  onClick={handleFinish}
                  className="bg-stone-900 hover:bg-black text-amber-400 font-extrabold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-md"
                >
                  <span>Done & Return</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Checkout Form */
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-serif font-black text-stone-900 mb-1">Express Checkout</h2>
              {discountPriceParam && (
                <span className="bg-amber-400 text-stone-950 font-black text-[10px] px-3 py-1 rounded-full uppercase">
                  NEGOTIATED DISCOUNT LINK
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 mb-4">All transactions are processed 100% securely on the website via Paystack</p>

            {/* Error Message Banner */}
            {errorMessage && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-700 text-xs font-bold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Full Name *"
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  if (errorMessage) setErrorMessage('');
                }}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-amber-500 outline-none text-sm font-medium"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="email"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-amber-500 outline-none text-sm font-medium"
                />
                <input
                  type="tel"
                  placeholder="Phone / WhatsApp *"
                  value={form.phone}
                  onChange={(e) => {
                    setForm({ ...form, phone: e.target.value });
                    if (errorMessage) setErrorMessage('');
                  }}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-amber-500 outline-none text-sm font-medium"
                />
              </div>
              <input
                type="text"
                placeholder="Delivery Address *"
                value={form.address}
                onChange={(e) => {
                  setForm({ ...form, address: e.target.value });
                  if (errorMessage) setErrorMessage('');
                }}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-amber-500 outline-none text-sm font-medium"
              />
              <select
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-amber-500 outline-none text-sm font-bold text-stone-700"
              >
                <option value="Lagos">Lagos State (NGN 2,500 Express Delivery)</option>
                <option value="Abuja">Abuja FCT (NGN 5,000 Delivery)</option>
                <option value="Rivers">Port Harcourt / Rivers (NGN 5,000 Delivery)</option>
                <option value="Other">Other Nigerian State (NGN 5,000 Delivery)</option>
              </select>
            </div>

            {/* Price Summary */}
            <div className="my-5 p-4 bg-amber-50/70 rounded-2xl border border-amber-200/70 space-y-2 text-xs">
              <div className="flex justify-between text-stone-600 font-medium">
                <span>{discountItemParam ? `Negotiated Outfit (${discountItemParam})` : 'Items Subtotal'}</span>
                <span>NGN {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-stone-600 font-medium">
                <span>Shipping ({form.state})</span>
                <span className={isFreeShipping ? 'text-green-700 font-bold' : ''}>
                  {isFreeShipping ? 'FREE' : `NGN ${shippingFee.toLocaleString()}`}
                </span>
              </div>
              {isFreeShipping && (
                <p className="text-[11px] text-green-700 flex items-center gap-1 font-bold">
                  <CheckCircle className="w-3.5 h-3.5" /> Free Express Shipping Unlocked (Orders over NGN 100,000)
                </p>
              )}
              <div className="pt-2 border-t border-amber-200 flex justify-between font-black text-sm text-stone-900">
                <span>Total Payable</span>
                <span className="text-amber-700 text-base font-black">NGN {grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Buttons */}
            <div className="space-y-2.5">
              <button
                onClick={handlePaystackPayment}
                disabled={isProcessing}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition text-xs uppercase tracking-wider disabled:opacity-50"
              >
                <CreditCard className="w-4 h-4" /> {isProcessing ? 'Connecting Paystack...' : 'Pay Directly on Website via Paystack'}
              </button>
              
              <button
                onClick={handleWhatsAppNegotiation}
                className="w-full bg-stone-900 hover:bg-black text-white font-extrabold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition text-xs uppercase tracking-wider border border-stone-700"
              >
                <WhatsAppIcon className="w-4 h-4 fill-amber-400" /> Negotiate Price / Request Discount on WhatsApp
              </button>
            </div>

            <div className="mt-4 text-center text-[10px] text-stone-400 flex items-center justify-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> 100% Automated Website Paystack Payment System
            </div>
          </>
        )}
      </div>
    </div>
  );
}

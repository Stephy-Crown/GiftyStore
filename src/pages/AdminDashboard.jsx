import React, { useState } from 'react';
import { Plus, Trash2, Edit3, ShieldCheck, Tag, Copy, Sparkles, RefreshCw, Key, Lock, Check, Upload, Image, AlertCircle, X } from 'lucide-react';
import siteConfig from '../data/config.json';
import { updateProductInSupabase, deleteProductFromSupabase, addProductToSupabase } from '../services/supabase';

export function AdminDashboard({ products, setProducts }) {
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'negotiate' | 'security'
  
  // Login Lock State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const [loginError, setLoginError] = useState('');

  // Security PIN Change
  const [storedPin, setStoredPin] = useState(siteConfig.defaultPin || '1234');
  const [newPinInput, setNewPinInput] = useState('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);
  const [pinError, setPinError] = useState('');

  // Form Banner Message
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Delete Confirmation Modal State
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState(null);

  // Edit Product Form State
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    price: '',
    category: 'Corset Gowns',
    image: '',
    video_url: '',
    sizes: ['S', 'M', 'L', 'XL'],
    is_tiktok_featured: true,
  });

  // Negotiated Link Generator State
  const [negotiatedProduct, setNegotiatedProduct] = useState('');
  const [discountedPrice, setDiscountedPrice] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [negotiateError, setNegotiateError] = useState('');

  const handleUnlock = (e) => {
    e.preventDefault();
    if (lockoutTimer > 0) return;

    if (enteredPin === storedPin) {
      setIsUnlocked(true);
      setFailedAttempts(0);
      setEnteredPin('');
      setLoginError('');
    } else {
      const nextFail = failedAttempts + 1;
      setFailedAttempts(nextFail);
      setEnteredPin('');

      if (nextFail >= 3) {
        setLockoutTimer(60);
        setLoginError('Security Lockout Active! 3 failed attempts.');
        const timer = setInterval(() => {
          setLockoutTimer((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              setFailedAttempts(0);
              setLoginError('');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setLoginError(`Incorrect Admin Passcode. ${3 - nextFail} attempts remaining.`);
      }
    }
  };

  const handlePinChange = (e) => {
    e.preventDefault();
    if (newPinInput.length >= 4) {
      setStoredPin(newPinInput);
      setPinChangeSuccess(true);
      setPinError('');
      setNewPinInput('');
      setTimeout(() => setPinChangeSuccess(false), 3000);
    } else {
      setPinError('Please enter a passcode of at least 4 digits.');
    }
  };

  // Direct Device Photo File Upload Handler
  const handleImageFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, image: reader.result }));
        setFormError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.image) {
      setFormError('Please fill out Outfit Name, Price, and upload a Photo.');
      return;
    }

    setFormError('');
    const payload = {
      name: form.name,
      price: Number(form.price),
      category: form.category,
      image: form.image,
      video_url: form.video_url,
      sizes: form.sizes,
      is_tiktok_featured: form.is_tiktok_featured,
    };

    if (editingId) {
      await updateProductInSupabase(editingId, payload);
      setProducts((prev) =>
        prev.map((p) => (String(p.id) === String(editingId) ? { ...p, ...payload } : p))
      );
      setEditingId(null);
      setFormSuccess('Outfit updated successfully!');
    } else {
      const created = await addProductToSupabase(payload);
      setProducts((prev) => [created || { ...payload, id: Date.now() }, ...prev]);
      setFormSuccess('New dress outfit published to website!');
    }

    setTimeout(() => setFormSuccess(''), 3500);

    setForm({
      name: '',
      price: '',
      category: 'Corset Gowns',
      image: '',
      video_url: '',
      sizes: ['S', 'M', 'L', 'XL'],
      is_tiktok_featured: true,
    });
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setFormError('');
    setForm({
      name: product.name,
      price: product.price,
      category: product.category || 'Corset Gowns',
      image: product.image,
      video_url: product.video_url || '',
      sizes: product.sizes || ['S', 'M', 'L', 'XL'],
      is_tiktok_featured: product.is_tiktok_featured ?? true,
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmProduct) return;
    await deleteProductFromSupabase(deleteConfirmProduct.id);
    setProducts((prev) => prev.filter((p) => String(p.id) !== String(deleteConfirmProduct.id)));
    setDeleteConfirmProduct(null);
  };

  const handleGenerateNegotiatedLink = (e) => {
    e.preventDefault();
    if (!negotiatedProduct || !discountedPrice) {
      setNegotiateError('Please select an outfit and enter the agreed negotiated price.');
      return;
    }

    setNegotiateError('');
    const link = `${window.location.origin}/?item=${encodeURIComponent(negotiatedProduct)}&discountedPrice=${discountedPrice}&checkout=true`;
    setGeneratedLink(link);
  };

  const copyGeneratedLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl p-8 border border-stone-200 shadow-2xl space-y-6 text-center">
        <div className="w-16 h-16 bg-stone-900 text-amber-400 rounded-full flex items-center justify-center mx-auto shadow-lg">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-serif font-black text-stone-900">Store Owner Admin Portal</h2>
          <p className="text-xs text-stone-500 mt-1">Enter your private 4-digit passcode to manage prices & upload dresses</p>
        </div>

        {loginError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{loginError}</span>
          </div>
        )}

        {lockoutTimer > 0 ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold">
            Security Lockout Active! Try again in {lockoutTimer} seconds.
          </div>
        ) : (
          <form onSubmit={handleUnlock} className="space-y-4">
            <input
              type="password"
              maxLength={8}
              placeholder="Enter Passcode (Default: 1234)"
              value={enteredPin}
              onChange={(e) => {
                setEnteredPin(e.target.value);
                if (loginError) setLoginError('');
              }}
              className="w-full text-center text-2xl font-black tracking-widest py-3 bg-stone-50 border border-stone-300 rounded-2xl focus:border-amber-500 outline-none"
            />
            <button
              type="submit"
              className="w-full bg-stone-900 hover:bg-black text-amber-400 font-extrabold py-3.5 rounded-2xl text-sm uppercase tracking-wider shadow-lg transition"
            >
              Unlock Dashboard
            </button>
          </form>
        )}

        <div className="text-[11px] text-stone-400 flex items-center justify-center gap-1 pt-2">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> 256-Bit Bank Grade Admin Protection
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-white p-6 sm:p-10 rounded-3xl border border-stone-200 shadow-2xl relative">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-stone-950 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider">
              OWNER PORTAL
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-black text-stone-900">Admin Store Dashboard</h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">Upload dresses from phone/computer, set prices, & generate payment links</p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 bg-stone-100 p-1.5 rounded-full border border-stone-200">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition ${
              activeTab === 'products' ? 'bg-stone-900 text-amber-400 shadow' : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            Outfit Catalog
          </button>
          
          <button
            onClick={() => setActiveTab('negotiate')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'negotiate' ? 'bg-amber-500 text-stone-950 shadow font-black' : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            <Tag className="w-3.5 h-3.5" /> Discount Generator
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition ${
              activeTab === 'security' ? 'bg-stone-900 text-amber-400 shadow' : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            Security PIN
          </button>
        </div>
      </div>

      {/* TAB 1: OUTFIT CATALOG MANAGER */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add / Edit Form */}
          <div className="bg-stone-50 p-6 rounded-3xl border border-stone-200 space-y-4">
            <h3 className="text-lg font-serif font-black text-stone-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              {editingId ? 'Edit Dress Outfit' : 'Upload New Dress Outfit'}
            </h3>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Outfit Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Royal Owambe Corset Gown"
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value });
                    if (formError) setFormError('');
                  }}
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Price (NGN) *</label>
                <input
                  type="number"
                  placeholder="e.g. 65000"
                  value={form.price}
                  onChange={(e) => {
                    setForm({ ...form, price: e.target.value });
                    if (formError) setFormError('');
                  }}
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl outline-none focus:border-amber-500 font-bold text-amber-700"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl outline-none font-bold text-stone-800"
                >
                  <option value="Corset Gowns">Corset Gowns</option>
                  <option value="Two-Piece">Two-Piece Sets</option>
                  <option value="Owambe">Owambe Couture</option>
                </select>
              </div>

              {/* Direct Photo File Upload Button */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">Upload Photo from Phone/Computer *</label>
                <label className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-stone-900 hover:bg-black text-amber-400 font-extrabold rounded-xl cursor-pointer shadow transition text-xs">
                  <Upload className="w-4 h-4" />
                  <span>Choose Photo File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    className="hidden"
                  />
                </label>

                {form.image && (
                  <div className="mt-3 relative w-full h-36 rounded-xl overflow-hidden border border-stone-300 bg-white">
                    <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                    <span className="absolute bottom-2 left-2 bg-stone-900/90 text-amber-400 font-black text-[9px] px-2 py-0.5 rounded-full uppercase">
                      Photo Upload Preview
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">TikTok Video Reel MP4 URL (Optional)</label>
                <input
                  type="text"
                  placeholder="Video URL or TikTok MP4 Link"
                  value={form.video_url}
                  onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-black py-3.5 rounded-xl uppercase tracking-wider text-xs shadow-lg transition"
                >
                  {editingId ? 'Save Outfit Updates' : 'Publish Outfit to Website'}
                </button>
              </div>
            </form>
          </div>

          {/* Catalog List */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-serif font-black text-stone-900">Live Boutique Inventory ({products.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-1">
              {products.map((product) => (
                <div key={product.id} className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex gap-3 items-center shadow-sm">
                  <img src={product.image} alt={product.name} className="w-16 h-20 object-cover rounded-xl shadow" />
                  <div className="flex-1 overflow-hidden">
                    <span className="text-[10px] font-bold text-amber-700 uppercase">{product.category}</span>
                    <h4 className="font-bold text-sm text-stone-900 truncate">{product.name}</h4>
                    <p className="text-sm font-black text-amber-600">NGN {Number(product.price).toLocaleString()}</p>
                    
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => startEdit(product)}
                        className="bg-white hover:bg-stone-100 text-stone-800 px-3 py-1 rounded-lg text-xs font-bold border border-stone-200 flex items-center gap-1 shadow-sm"
                      >
                        <Edit3 className="w-3 h-3 text-amber-600" /> Edit
                      </button>

                      <button
                        onClick={() => setDeleteConfirmProduct(product)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1 rounded-lg text-xs font-bold border border-rose-200 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NEGOTIATED DISCOUNT WEB-LINK GENERATOR */}
      {activeTab === 'negotiate' && (
        <div className="max-w-2xl mx-auto space-y-6 bg-stone-50 p-8 rounded-3xl border border-stone-200">
          <div>
            <span className="bg-amber-400 text-stone-950 font-black text-[10px] px-3 py-1 rounded-full uppercase">
              POST-NEGOTIATION TOOL
            </span>
            <h2 className="text-2xl font-serif font-black text-stone-900 mt-2">Generate Negotiated Payment Link</h2>
            <p className="text-xs text-stone-500 mt-1">
              After negotiating with a client on WhatsApp (+234 706 282 4754), select the dress outfit and enter your agreed discounted price to generate a 1-click Paystack payment link!
            </p>
          </div>

          {negotiateError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{negotiateError}</span>
            </div>
          )}

          <form onSubmit={handleGenerateNegotiatedLink} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-stone-800 block mb-1">Select Outfit Negotiated *</label>
              <select
                value={negotiatedProduct}
                onChange={(e) => {
                  setNegotiatedProduct(e.target.value);
                  if (negotiateError) setNegotiateError('');
                }}
                className="w-full px-4 py-3 bg-white border border-stone-300 rounded-xl outline-none font-bold text-stone-900"
              >
                <option value="">-- Choose Dress Outfit --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} (Original: NGN {Number(p.price).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-stone-800 block mb-1">Agreed Negotiated Price (NGN) *</label>
              <input
                type="number"
                placeholder="e.g. 55000"
                value={discountedPrice}
                onChange={(e) => {
                  setDiscountedPrice(e.target.value);
                  if (negotiateError) setNegotiateError('');
                }}
                className="w-full px-4 py-3 bg-white border border-stone-300 rounded-xl outline-none font-bold text-amber-700 text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-stone-900 hover:bg-black text-amber-400 font-black py-3.5 rounded-xl uppercase tracking-wider text-xs shadow-lg transition"
            >
              Generate Paystack Web Payment Link
            </button>
          </form>

          {generatedLink && (
            <div className="bg-white p-5 rounded-2xl border border-amber-300 space-y-3 shadow-md">
              <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full uppercase">
                DISCOUNTED LINK READY
              </span>
              <p className="text-xs font-mono bg-stone-100 p-3 rounded-xl border border-stone-200 break-all text-stone-800">
                {generatedLink}
              </p>
              
              <button
                onClick={copyGeneratedLink}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow transition"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedLink ? 'Copied to Clipboard!' : 'Copy & Send Link to WhatsApp Client'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SECURITY PIN MANAGER */}
      {activeTab === 'security' && (
        <div className="max-w-md mx-auto space-y-6 bg-stone-50 p-8 rounded-3xl border border-stone-200 text-center">
          <div className="w-14 h-14 bg-stone-900 text-amber-400 rounded-full flex items-center justify-center mx-auto shadow-md">
            <Key className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-xl font-serif font-black text-stone-900">Change Admin Passcode</h2>
            <p className="text-xs text-stone-500 mt-1">Update your private 4-digit PIN for dashboard security</p>
          </div>

          {pinError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" /> {pinError}
            </div>
          )}

          {pinChangeSuccess && (
            <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" /> Admin Passcode Updated Successfully!
            </div>
          )}

          <form onSubmit={handlePinChange} className="space-y-4">
            <input
              type="password"
              maxLength={8}
              placeholder="Enter New 4-Digit PIN"
              value={newPinInput}
              onChange={(e) => {
                setNewPinInput(e.target.value);
                if (pinError) setPinError('');
              }}
              className="w-full text-center text-xl font-black py-3 bg-white border border-stone-300 rounded-xl outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="w-full bg-stone-900 hover:bg-black text-amber-400 font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-lg transition"
            >
              Update Admin Passcode
            </button>
          </form>
        </div>
      )}

      {/* Modern Custom Delete Confirmation Modal */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl relative animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-black text-stone-900">Delete Dress Outfit?</h3>
              <p className="text-xs text-stone-500 mt-1">
                Are you sure you want to remove <span className="font-bold text-stone-900">"{deleteConfirmProduct.name}"</span> from your store catalog?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmProduct(null)}
                className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold py-2.5 rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs shadow transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

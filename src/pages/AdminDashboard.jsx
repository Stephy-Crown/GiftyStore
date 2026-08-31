import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, ShieldCheck, Tag, Copy, Sparkles, RefreshCw, Key, Lock, Check, Upload, Image, AlertCircle, X, LogOut, Mail, Package, AlertTriangle } from 'lucide-react';
import siteConfig from '../data/config.json';
import { updateProductInSupabase, deleteProductFromSupabase, addProductToSupabase, signInAdmin, signOutAdmin, getCurrentAdminSession, updateAdminPassword, updateAdminEmail } from '../services/supabase';

export function AdminDashboard({ products, setProducts }) {
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'negotiate' | 'security'
  
  // Supabase Auth / Login Lock State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [currentAdminUser, setCurrentAdminUser] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const [loginError, setLoginError] = useState('');

  // Security Credentials Reset State
  const [newEmailInput, setNewEmailInput] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [emailChangeSuccess, setEmailChangeSuccess] = useState('');
  const [emailChangeError, setEmailChangeError] = useState('');

  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');

  // Form Banner Message
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Delete Confirmation Modal State
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState(null);

  // Edit Product Form State (Includes Stock Management)
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    price: '',
    category: 'Corset Gowns',
    image: '',
    video_url: '',
    sizes: ['S', 'M', 'L', 'XL'],
    is_tiktok_featured: true,
    stock: 5,
  });

  // Negotiated Link Generator State
  const [negotiatedProduct, setNegotiatedProduct] = useState('');
  const [discountedPrice, setDiscountedPrice] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [negotiateError, setNegotiateError] = useState('');

  // Check persistent admin session on mount
  useEffect(() => {
    async function checkSession() {
      const session = await getCurrentAdminSession();
      if (session) {
        setIsUnlocked(true);
        setCurrentAdminUser(session.user);
      }
    }
    checkSession();
  }, []);

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (lockoutTimer > 0) return;

    setIsLoggingIn(true);
    setLoginError('');

    const res = await signInAdmin(adminEmail, adminPassword);
    setIsLoggingIn(false);

    if (res.user || res.session) {
      setIsUnlocked(true);
      setCurrentAdminUser(res.user);
      setFailedAttempts(0);
      setAdminPassword('');
      setLoginError('');
    } else {
      const nextFail = failedAttempts + 1;
      setFailedAttempts(nextFail);

      if (nextFail >= 3) {
        setLockoutTimer(60);
        setLoginError('Security Lockout Active! 3 failed login attempts.');
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
        setLoginError(res.error?.message || `Invalid Admin Credentials. ${3 - nextFail} attempts remaining.`);
      }
    }
  };

  const handleSignOut = async () => {
    await signOutAdmin();
    setIsUnlocked(false);
    setCurrentAdminUser(null);
  };

  const handleEmailChange = async (e) => {
    e.preventDefault();
    if (!newEmailInput || !newEmailInput.includes('@')) {
      setEmailChangeError('Please enter a valid email address.');
      return;
    }

    setIsUpdatingEmail(true);
    setEmailChangeError('');
    setEmailChangeSuccess('');

    const res = await updateAdminEmail(newEmailInput);
    setIsUpdatingEmail(false);

    if (res.success) {
      setEmailChangeSuccess(res.message);
      setNewEmailInput('');
      setTimeout(() => setEmailChangeSuccess(''), 4000);
    } else {
      setEmailChangeError(res.message);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPasswordInput.length < 6) {
      setPasswordChangeError('Please enter a secure password of at least 6 characters.');
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordChangeError('');
    setPasswordChangeSuccess('');

    const res = await updateAdminPassword(newPasswordInput);
    setIsUpdatingPassword(false);

    if (res.success) {
      setPasswordChangeSuccess(res.message);
      setNewPasswordInput('');
      setTimeout(() => setPasswordChangeSuccess(''), 4000);
    } else {
      setPasswordChangeError(res.message);
    }
  };

  // Direct Device Photo File Upload Handler
  const handleImageFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, image: reader.result }));
        setFormSuccess('Photo uploaded from device!');
        setTimeout(() => setFormSuccess(''), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  // Quick Restock Handler for Inventory Items
  const handleQuickStockUpdate = async (product, newStock) => {
    const updatedStock = Math.max(0, newStock);
    const payload = { stock: updatedStock };
    await updateProductInSupabase(product.id, payload);
    setProducts((prev) =>
      prev.map((p) => (String(p.id) === String(product.id) ? { ...p, stock: updatedStock } : p))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.image) {
      setFormError('Please fill in Outfit Name, Price, and Image URL or upload a photo.');
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
      stock: Number(form.stock !== undefined ? form.stock : 5),
    };

    if (editingId) {
      await updateProductInSupabase(editingId, payload);
      setProducts((prev) =>
        prev.map((p) => (String(p.id) === String(editingId) ? { ...p, ...payload } : p))
      );
      setEditingId(null);
      setFormSuccess('Outfit and Stock count updated successfully!');
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
      stock: 5,
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
      stock: product.stock !== undefined ? product.stock : 5,
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
          <p className="text-xs text-stone-500 mt-1">Authenticate with your Supabase Admin Credentials</p>
        </div>

        {loginError && (
          <div className="bg-rose-50 text-rose-700 p-3 rounded-2xl text-xs font-bold border border-rose-200 flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{loginError}</span>
          </div>
        )}

        <form onSubmit={handleUnlock} className="space-y-4 text-left">
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700">Admin Email</label>
            <div className="relative">
              <input
                type="email"
                placeholder="admin@giftystore.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-bold text-stone-900 outline-none focus:border-stone-900"
              />
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700">Password / Access Code</label>
            <div className="relative">
              <input
                type="password"
                placeholder="••••••••"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-bold text-stone-900 outline-none focus:border-stone-900"
              />
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
            </div>
            <p className="text-[10px] text-stone-400 pt-0.5">Default dev fallback password: <code className="text-stone-700 bg-stone-100 px-1 rounded font-bold">gifty2026</code></p>
          </div>

          <button
            type="submit"
            disabled={lockoutTimer > 0 || isLoggingIn}
            className="w-full bg-stone-900 hover:bg-black text-amber-400 font-extrabold py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-lg transition flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>{isLoggingIn ? 'Verifying Auth...' : lockoutTimer > 0 ? `Locked (${lockoutTimer}s)` : 'Authenticate Owner Portal'}</span>
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xl">
      {/* Admin Header Navbar with Sign Out */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Authenticated Store Owner {currentAdminUser?.email && `(${currentAdminUser.email})`}
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-stone-900 mt-1">GIFTY Owner Control Center</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'products' ? 'bg-stone-900 text-amber-400 shadow' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Catalog & Stock
            </button>
            <button
              onClick={() => setActiveTab('negotiate')}
              className={`px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'negotiate' ? 'bg-stone-900 text-amber-400 shadow' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Negotiated Links
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'security' ? 'bg-stone-900 text-amber-400 shadow' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Reset Admin Details
            </button>
          </div>

          <button
            onClick={handleSignOut}
            className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shrink-0"
            title="Sign Out Admin"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Admin Section Body */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add / Edit Form */}
          <div className="lg:col-span-1 bg-stone-50 p-6 rounded-3xl border border-stone-200 space-y-4">
            <h3 className="text-lg font-serif font-black text-stone-900 flex items-center gap-2">
              {editingId ? <Edit3 className="w-5 h-5 text-amber-600" /> : <Plus className="w-5 h-5 text-amber-600" />}
              {editingId ? 'Edit Dress & Restock' : 'Upload New Dress'}
            </h3>

            {formError && (
              <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-xs font-bold border border-rose-200">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl text-xs font-bold border border-emerald-200">
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-700">Dress / Outfit Name</label>
                <input
                  type="text"
                  placeholder="e.g. Royal Ankara Corset Gown"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 bg-white border border-stone-200 rounded-xl font-bold text-stone-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Price (NGN ₦)</label>
                  <input
                    type="number"
                    placeholder="e.g. 55000"
                    value={form.price}
                    onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                    className="w-full p-3 bg-white border border-stone-200 rounded-xl font-bold text-stone-900 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700 flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-amber-600" /> Stock Units
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 5"
                    value={form.stock}
                    onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
                    className="w-full p-3 bg-white border border-stone-200 rounded-xl font-black text-stone-900 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full p-3 bg-white border border-stone-200 rounded-xl font-bold text-stone-900 outline-none"
                >
                  <option value="Corset Gowns">Corset Gowns</option>
                  <option value="Two-Piece">Two-Piece</option>
                  <option value="Owambe">Owambe</option>
                </select>
              </div>

              <div className="space-y-2 pt-1">
                <label className="font-bold text-stone-700 block">Outfit Photo (URL or Device Upload)</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={form.image}
                  onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
                  className="w-full p-3 bg-white border border-stone-200 rounded-xl font-bold text-stone-900 outline-none"
                />

                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    className="hidden"
                    id="device-photo-upload"
                  />
                  <label
                    htmlFor="device-photo-upload"
                    className="w-full bg-stone-200 hover:bg-stone-300 text-stone-900 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition border border-stone-300"
                  >
                    <Upload className="w-4 h-4 text-amber-700" /> Upload Direct Photo from Phone / PC
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">Video Reels URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://assets.mixkit.co/..."
                  value={form.video_url}
                  onChange={(e) => setForm((prev) => ({ ...prev, video_url: e.target.value }))}
                  className="w-full p-3 bg-white border border-stone-200 rounded-xl font-bold text-stone-900 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-stone-900 hover:bg-black text-amber-400 font-extrabold py-3.5 rounded-xl shadow-lg transition"
                >
                  {editingId ? 'Save Outfit & Stock' : 'Publish Outfit'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setForm({ name: '', price: '', category: 'Corset Gowns', image: '', video_url: '', sizes: ['S', 'M', 'L', 'XL'], is_tiktok_featured: true, stock: 5 });
                    }}
                    className="px-4 py-3.5 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Product List with Direct Stock Restock Counter */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-serif font-black text-stone-900">Live Inventory Outfits ({products.length})</h3>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {products.map((item) => {
                const isSoldOut = item.stock === 0;

                return (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-stone-50 p-4 rounded-2xl border border-stone-200 gap-4">
                    <div className="flex items-center gap-3.5">
                      <img src={item.image} alt={item.name} className={`w-14 h-16 object-cover rounded-xl shadow-sm ${isSoldOut ? 'grayscale brightness-75' : ''}`} />

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">{item.category}</span>
                          {isSoldOut ? (
                            <span className="bg-stone-900 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                              SOLD OUT
                            </span>
                          ) : item.stock <= 3 ? (
                            <span className="bg-amber-500 text-stone-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                              LOW STOCK ({item.stock})
                            </span>
                          ) : null}
                        </div>
                        <h4 className="font-bold text-sm text-stone-900 truncate">{item.name}</h4>
                        <p className="text-xs font-black text-amber-600">NGN {Number(item.price).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Quick Restock Counter Buttons */}
                    <div className="flex items-center gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200">
                      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-stone-200">
                        <span className="text-[11px] font-bold text-stone-500 px-1.5">Stock:</span>
                        <span className={`text-xs font-black px-1.5 ${isSoldOut ? 'text-rose-600' : 'text-stone-900'}`}>
                          {item.stock !== undefined ? item.stock : 5}
                        </span>

                        <button
                          onClick={() => handleQuickStockUpdate(item, (item.stock || 0) + 1)}
                          className="px-2 py-0.5 bg-stone-100 hover:bg-stone-200 text-stone-900 text-xs font-black rounded-lg transition"
                          title="Restock +1 unit"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => handleQuickStockUpdate(item, (item.stock || 0) + 5)}
                          className="px-2 py-0.5 bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-black rounded-lg transition"
                          title="Restock +5 units"
                        >
                          +5
                        </button>
                        {item.stock > 0 && (
                          <button
                            onClick={() => handleQuickStockUpdate(item, 0)}
                            className="px-1.5 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold rounded-lg transition"
                            title="Mark as Sold Out"
                          >
                            Mark 0
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => startEdit(item)}
                          className="p-2 bg-white hover:bg-amber-50 text-amber-700 border border-stone-200 rounded-xl transition"
                          title="Edit Dress"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmProduct(item)}
                          className="p-2 bg-white hover:bg-rose-50 text-rose-600 border border-stone-200 rounded-xl transition"
                          title="Delete Dress"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Negotiated Payment Link Generator Tab */}
      {activeTab === 'negotiate' && (
        <div className="max-w-xl mx-auto space-y-6 bg-stone-50 p-6 sm:p-8 rounded-3xl border border-stone-200">
          <div>
            <h3 className="text-xl font-serif font-black text-stone-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" /> 1-Click Negotiated Link Generator
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Generate a custom, pre-discounted website checkout link for WhatsApp customers who negotiated a lower price!
            </p>
          </div>

          {negotiateError && (
            <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-xs font-bold border border-rose-200">
              {negotiateError}
            </div>
          )}

          <form onSubmit={handleGenerateNegotiatedLink} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-stone-700">Select Outfit</label>
              <select
                value={negotiatedProduct}
                onChange={(e) => setNegotiatedProduct(e.target.value)}
                className="w-full p-3 bg-white border border-stone-200 rounded-xl font-bold text-stone-900 outline-none"
              >
                <option value="">-- Choose Outfit --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.name}>{p.name} (Original: NGN {Number(p.price).toLocaleString()})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-stone-700">Agreed Negotiated Price (NGN ₦)</label>
              <input
                type="number"
                placeholder="e.g. 45000"
                value={discountedPrice}
                onChange={(e) => setDiscountedPrice(e.target.value)}
                className="w-full p-3 bg-white border border-stone-200 rounded-xl font-bold text-stone-900 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-stone-900 hover:bg-black text-amber-400 font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-lg transition"
            >
              Generate Discount Payment Link
            </button>
          </form>

          {generatedLink && (
            <div className="space-y-3 bg-white p-4 rounded-2xl border border-stone-200">
              <label className="font-bold text-xs text-stone-800 block">Generated Link:</label>
              <input
                type="text"
                readOnly
                value={generatedLink}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-stone-800 outline-none"
              />
              <button
                onClick={copyGeneratedLink}
                className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow"
              >
                <Copy className="w-4 h-4" />
                <span>{copiedLink ? 'Link Copied to Clipboard!' : 'Copy Link & Send on WhatsApp'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Reset Admin Credentials Tab */}
      {activeTab === 'security' && (
        <div className="max-w-xl mx-auto space-y-8 bg-stone-50 p-6 sm:p-8 rounded-3xl border border-stone-200">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
              Admin Account Credentials
            </span>
            <h3 className="text-xl font-serif font-black text-stone-900 mt-2 flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-600" /> Reset Admin Email & Password
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Update your store owner login email and password securely in Supabase Auth.
            </p>
          </div>

          {/* Reset Admin Email Form */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-3 shadow-sm">
            <h4 className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-amber-600" /> Reset Admin Email
            </h4>

            {emailChangeError && (
              <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-xs font-bold border border-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{emailChangeError}</span>
              </div>
            )}

            {emailChangeSuccess && (
              <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl text-xs font-bold border border-emerald-200 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{emailChangeSuccess}</span>
              </div>
            )}

            <form onSubmit={handleEmailChange} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-700">New Admin Email Address</label>
                <input
                  type="email"
                  placeholder="owner@giftystore.com"
                  value={newEmailInput}
                  onChange={(e) => setNewEmailInput(e.target.value)}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-900 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingEmail}
                className="w-full bg-stone-900 hover:bg-black text-amber-400 font-extrabold py-3 rounded-xl text-xs uppercase tracking-wider shadow transition"
              >
                {isUpdatingEmail ? 'Updating Email...' : 'Update Admin Email'}
              </button>
            </form>
          </div>

          {/* Reset Admin Password Form */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-3 shadow-sm">
            <h4 className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-amber-600" /> Reset Admin Password
            </h4>

            {passwordChangeError && (
              <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-xs font-bold border border-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{passwordChangeError}</span>
              </div>
            )}

            {passwordChangeSuccess && (
              <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl text-xs font-bold border border-emerald-200 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{passwordChangeSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-700">New Admin Password (Minimum 6 characters)</label>
                <input
                  type="password"
                  placeholder="Enter new strong password"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-900 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="w-full bg-stone-900 hover:bg-black text-amber-400 font-extrabold py-3 rounded-xl text-xs uppercase tracking-wider shadow transition"
              >
                {isUpdatingPassword ? 'Updating Password...' : 'Save New Admin Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl relative">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-serif font-black text-stone-900">Delete Outfit?</h3>
              <p className="text-xs text-stone-500 mt-1">
                Are you sure you want to remove <strong>"{deleteConfirmProduct.name}"</strong> from your live boutique catalog?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmProduct(null)}
                className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold py-3 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl text-xs shadow"
              >
                Delete Outfit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

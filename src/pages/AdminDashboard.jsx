import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, ShieldCheck, Tag, Copy, Sparkles, RefreshCw, Key, Lock, Check, Upload, Image, AlertCircle, X, LogOut, Mail, Package, AlertTriangle, Search, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import siteConfig from '../data/config.json';
import { updateProductInSupabase, deleteProductFromSupabase, addProductToSupabase, signInAdmin, signOutAdmin, getCurrentAdminSession, updateAdminPassword, updateAdminEmail } from '../services/supabase';

export function AdminDashboard({ products, setProducts, showToast }) {
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'negotiate' | 'security'
  
  // Login Lock State
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

  // Mobile Collapsible Upload Form Toggle
  const [showMobileForm, setShowMobileForm] = useState(false);

  // Admin Search & Pagination State (5 products per page for maximum mobile space)
  const [adminSearch, setAdminSearch] = useState('');
  const [adminCategory, setAdminCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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
    stock: 5,
  });

  // Negotiated Link Generator State
  const [negotiatedProduct, setNegotiatedProduct] = useState('');
  const [discountedPrice, setDiscountedPrice] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [negotiateError, setNegotiateError] = useState('');

  const triggerToast = (msg, action) => {
    if (typeof showToast === 'function') {
      showToast(msg, action);
    }
  };

  // Check persistent session on mount
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
      triggerToast('Authenticated Store Control Center');
    } else {
      const nextFail = failedAttempts + 1;
      setFailedAttempts(nextFail);

      if (nextFail >= 3) {
        setLockoutTimer(60);
        setLoginError('Security lockout active (60 seconds).');
        const timer = setInterval(() => {
          setLockoutTimer((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              setFailedAttempts(0);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setLoginError(res.error?.message || `Invalid password. ${3 - nextFail} attempt(s) remaining.`);
      }
    }
  };

  const handleSignOut = async () => {
    await signOutAdmin();
    setIsUnlocked(false);
    setCurrentAdminUser(null);
    triggerToast('Signed out of admin dashboard');
  };

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    setEmailChangeSuccess('');
    setEmailChangeError('');
    if (!newEmailInput || !newEmailInput.includes('@')) {
      setEmailChangeError('Please enter a valid email address.');
      return;
    }

    setIsUpdatingEmail(true);
    const res = await updateAdminEmail(newEmailInput);
    setIsUpdatingEmail(false);

    if (res.user || res.success) {
      setEmailChangeSuccess(res.message || 'Email updated successfully!');
      setNewEmailInput('');
      triggerToast('Email updated successfully!');
    } else {
      setEmailChangeError(res.message || 'Failed to update email.');
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordChangeSuccess('');
    setPasswordChangeError('');
    if (!newPasswordInput || newPasswordInput.length < 6) {
      setPasswordChangeError('Password must be at least 6 characters.');
      return;
    }

    setIsUpdatingPassword(true);
    const res = await updateAdminPassword(newPasswordInput);
    setIsUpdatingPassword(false);

    if (res.user || res.success) {
      setPasswordChangeSuccess('Password updated successfully!');
      setNewPasswordInput('');
      triggerToast('Password updated successfully!');
    } else {
      setPasswordChangeError(res.message || 'Failed to update password.');
    }
  };

  const handleImageFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, image: reader.result }));
        triggerToast('Photo loaded!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      price: item.price,
      category: item.category || 'Corset Gowns',
      image: item.image,
      video_url: item.video_url || '',
      sizes: item.sizes || ['S', 'M', 'L', 'XL'],
      is_tiktok_featured: item.is_tiktok_featured !== undefined ? item.is_tiktok_featured : true,
      stock: item.stock !== undefined ? item.stock : 5,
    });
    setShowMobileForm(true);
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  const handleQuickStockUpdate = async (product, newStockCount) => {
    const updated = { ...product, stock: Math.max(0, newStockCount) };
    setProducts((prev) => prev.map((p) => (String(p.id) === String(product.id) ? updated : p)));
    await updateProductInSupabase(product.id, { stock: Math.max(0, newStockCount) });
    triggerToast(`Updated stock to ${newStockCount} units`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!form.name.trim() || !form.price || !form.image.trim()) {
      setFormError('Please fill in Name, Price, and Photo!');
      return;
    }

    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      category: form.category,
      image: form.image.trim(),
      video_url: form.video_url.trim() || null,
      sizes: form.sizes,
      is_tiktok_featured: form.is_tiktok_featured,
      stock: Number(form.stock || 0),
    };

    if (editingId) {
      setProducts((prev) => prev.map((p) => (String(p.id) === String(editingId) ? { ...p, ...payload } : p)));
      const res = await updateProductInSupabase(editingId, payload);
      if (res) {
        setFormSuccess(`Saved "${payload.name}"!`);
        triggerToast(`Saved ${payload.name}`);
        setEditingId(null);
        setForm({ name: '', price: '', category: 'Corset Gowns', image: '', video_url: '', sizes: ['S', 'M', 'L', 'XL'], is_tiktok_featured: true, stock: 5 });
        setShowMobileForm(false);
      }
    } else {
      const tempId = `local-${Date.now()}`;
      const newObj = { id: tempId, ...payload };
      setProducts((prev) => [newObj, ...prev]);

      const res = await addProductToSupabase(payload);
      if (res && res[0]) {
        setProducts((prev) => prev.map((p) => (p.id === tempId ? res[0] : p)));
      }

      setFormSuccess(`Published "${payload.name}"!`);
      triggerToast(`Published ${payload.name}`);
      setForm({ name: '', price: '', category: 'Corset Gowns', image: '', video_url: '', sizes: ['S', 'M', 'L', 'XL'], is_tiktok_featured: true, stock: 5 });
      setShowMobileForm(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmProduct) return;
    const targetId = deleteConfirmProduct.id;
    setProducts((prev) => prev.filter((p) => String(p.id) !== String(targetId)));
    await deleteProductFromSupabase(targetId);
    triggerToast(`Deleted "${deleteConfirmProduct.name}"`);
    setDeleteConfirmProduct(null);
  };

  const handleGenerateLink = (e) => {
    e.preventDefault();
    setNegotiateError('');
    setGeneratedLink('');
    setCopiedLink(false);

    if (!negotiatedProduct) {
      setNegotiateError('Please select an outfit.');
      return;
    }
    if (!discountedPrice || Number(discountedPrice) <= 0) {
      setNegotiateError('Please enter a valid price in NGN.');
      return;
    }

    const prod = products.find((p) => String(p.id) === String(negotiatedProduct));
    const prodId = prod?.id || '1';

    const baseUrl = window.location.origin + window.location.pathname;
    const generated = `${baseUrl}?product=${prodId}&discountedPrice=${discountedPrice}&checkout=true`;

    setGeneratedLink(generated);
    triggerToast('Discounted link generated');
  };

  const copyGeneratedLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopiedLink(true);
      triggerToast('Link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  // Filtered & Paginated Products Logic
  const filteredAdminProducts = products.filter((p) => {
    if (!p) return false;
    const matchesSearch = !adminSearch.trim() ||
      (p.name && p.name.toLowerCase().includes(adminSearch.toLowerCase())) ||
      (p.category && p.category.toLowerCase().includes(adminSearch.toLowerCase()));
    
    const matchesCat = adminCategory === 'All' || p.category === adminCategory;
    return matchesSearch && matchesCat;
  });

  const totalPages = Math.ceil(filteredAdminProducts.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredAdminProducts.slice(startIndex, startIndex + itemsPerPage);

  // Professional Sleek Login Screen
  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto my-6 sm:my-12 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-2xl space-y-6 overflow-x-hidden">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-stone-900 text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-black text-stone-900">GIFTY Store Management</h2>
          <p className="text-xs text-stone-500">Sign in to manage catalog, inventory, and payment links.</p>
        </div>

        {loginError && (
          <div className="bg-rose-50 text-rose-700 p-3.5 rounded-2xl text-xs font-bold border border-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{loginError}</span>
          </div>
        )}

        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700 block">Email Address</label>
            <input
              type="email"
              placeholder="owner@giftystore.com"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="w-full p-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-bold text-stone-900 outline-none focus:border-stone-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700 block">Password</label>
            <input
              type="password"
              placeholder="••••••••••••"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full p-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-bold text-stone-900 outline-none focus:border-stone-900"
            />
          </div>

          <button
            type="submit"
            disabled={isLoggingIn || lockoutTimer > 0}
            className={`w-full font-black py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-xl transition ${
              lockoutTimer > 0
                ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                : 'bg-stone-900 hover:bg-black text-amber-400'
            }`}
          >
            {isLoggingIn ? 'Signing In...' : lockoutTimer > 0 ? `Locked (${lockoutTimer}s)` : 'Sign In'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-8 bg-white rounded-3xl p-4 sm:p-8 border border-stone-200 shadow-xl max-w-7xl mx-auto w-full overflow-x-hidden">
      {/* Clean Professional Admin Header */}
      <div className="flex items-center justify-between gap-3 pb-4 sm:pb-6 border-b border-stone-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-black text-stone-900">GIFTY Control Center</h1>
        </div>

        <button
          onClick={handleSignOut}
          className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-sm"
          title="Sign Out"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Clean Professional Segmented Tabs */}
      <div className="grid grid-cols-3 gap-1 sm:gap-2 bg-stone-100 p-1 sm:p-1.5 rounded-2xl border border-stone-200 w-full overflow-hidden">
        <button
          onClick={() => setActiveTab('products')}
          className={`py-2 px-1 sm:py-2.5 sm:px-2 rounded-xl text-[11px] sm:text-xs font-black transition text-center truncate ${
            activeTab === 'products' ? 'bg-stone-900 text-amber-400 shadow-md' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Catalog & Stock
        </button>
        <button
          onClick={() => setActiveTab('negotiate')}
          className={`py-2 px-1 sm:py-2.5 sm:px-2 rounded-xl text-[11px] sm:text-xs font-black transition text-center truncate ${
            activeTab === 'negotiate' ? 'bg-stone-900 text-amber-400 shadow-md' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Discount Links
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`py-2 px-1 sm:py-2.5 sm:px-2 rounded-xl text-[11px] sm:text-xs font-black transition text-center truncate ${
            activeTab === 'security' ? 'bg-stone-900 text-amber-400 shadow-md' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Security
        </button>
      </div>

      {/* Catalog & Stock Tab */}
      {activeTab === 'products' && (
        <div className="space-y-5 sm:space-y-6 w-full overflow-x-hidden">
          {/* Mobile Collapsible Upload Button Toggle */}
          <div className="lg:hidden">
            <button
              onClick={() => setShowMobileForm(!showMobileForm)}
              className="w-full bg-stone-900 text-amber-400 font-extrabold py-3 px-4 rounded-2xl text-xs flex items-center justify-between shadow-md"
            >
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                {editingId ? 'Edit Outfit' : 'Upload Outfit'}
              </span>
              <span>{showMobileForm ? '▲ Hide' : '▼ Expand'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 w-full">
            {/* Add / Edit Form */}
            <div className={`lg:col-span-1 bg-stone-50 p-4 sm:p-6 rounded-3xl border border-stone-200 space-y-4 w-full ${showMobileForm ? 'block' : 'hidden lg:block'}`}>
              <h3 className="text-base sm:text-lg font-serif font-black text-stone-900 flex items-center gap-2">
                {editingId ? <Edit3 className="w-5 h-5 text-amber-600" /> : <Plus className="w-5 h-5 text-amber-600" />}
                {editingId ? 'Edit Outfit' : 'Upload Outfit'}
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

              <form onSubmit={handleSubmit} className="space-y-3.5 text-xs w-full">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 block">Outfit Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Royal Ankara Corset Gown"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 bg-white border border-stone-200 rounded-xl font-bold text-stone-900 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="font-bold text-stone-700 block">Price (NGN ₦)</label>
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
                      <Package className="w-3.5 h-3.5 text-amber-600" /> Stock
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
                  <label className="font-bold text-stone-700 block">Category</label>
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
                  <label className="font-bold text-stone-700 block">Outfit Photo</label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={form.image}
                    onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
                    className="w-full p-3 bg-white border border-stone-200 rounded-xl font-bold text-stone-900 outline-none"
                  />

                  <div>
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
                      <Upload className="w-4 h-4 text-amber-700" /> Upload Photo
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700 block">Video URL (Optional)</label>
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
                    className="flex-1 bg-stone-900 hover:bg-black text-amber-400 font-extrabold py-3.5 rounded-xl shadow-lg transition text-xs"
                  >
                    {editingId ? 'Save' : 'Publish'}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setForm({ name: '', price: '', category: 'Corset Gowns', image: '', video_url: '', sizes: ['S', 'M', 'L', 'XL'], is_tiktok_featured: true, stock: 5 });
                        setShowMobileForm(false);
                      }}
                      className="px-3.5 py-3.5 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold rounded-xl text-xs"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Product List */}
            <div className="lg:col-span-2 space-y-4 w-full overflow-x-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-base sm:text-lg font-serif font-black text-stone-900">
                  Inventory ({filteredAdminProducts.length})
                </h3>
              </div>

              {/* Admin Instant Search & Category Filter Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full">
                <div className="sm:col-span-2 relative w-full">
                  <input
                    type="text"
                    placeholder="Search catalog by name..."
                    value={adminSearch}
                    onChange={(e) => {
                      setAdminSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-8 pr-8 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 outline-none"
                  />
                  <Search className="w-3.5 h-3.5 text-amber-600 absolute left-2.5 top-2.5 pointer-events-none" />
                  {adminSearch && (
                    <button
                      onClick={() => setAdminSearch('')}
                      className="absolute right-2 top-2 text-stone-400 hover:text-stone-900 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="w-full">
                  <select
                    value={adminCategory}
                    onChange={(e) => {
                      setAdminCategory(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full py-2 px-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-800 outline-none"
                  >
                    <option value="All">All Categories</option>
                    <option value="Corset Gowns">Corset Gowns</option>
                    <option value="Two-Piece">Two-Piece</option>
                    <option value="Owambe">Owambe</option>
                  </select>
                </div>
              </div>

              {/* Paginated Product List */}
              <div className="space-y-3 min-h-[340px] w-full">
                {paginatedProducts.length === 0 ? (
                  <div className="py-12 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-400 text-xs font-bold">
                    No outfits found.
                  </div>
                ) : (
                  paginatedProducts.map((item) => {
                    const isSoldOut = item.stock === 0;

                    return (
                      <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-stone-50 p-3 sm:p-3.5 rounded-2xl border border-stone-200 gap-3 w-full overflow-hidden">
                        <div className="flex items-center gap-3 min-w-0">
                          <img src={item.image} alt={item.name} className={`w-12 h-14 object-cover rounded-xl shadow-sm shrink-0 ${isSoldOut ? 'grayscale brightness-75' : ''}`} />

                          <div className="min-w-0 flex-1 overflow-hidden">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-bold text-amber-700 uppercase tracking-wider block shrink-0">{item.category}</span>
                              {isSoldOut ? (
                                <span className="bg-stone-900 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase shrink-0">
                                  SOLD OUT
                                </span>
                              ) : item.stock <= 3 ? (
                                <span className="bg-amber-500 text-stone-950 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase shrink-0">
                                  LOW ({item.stock})
                                </span>
                              ) : null}
                            </div>
                            <h4 className="font-bold text-xs sm:text-sm text-stone-900 truncate">{item.name}</h4>
                            <p className="text-xs font-black text-amber-600">NGN {Number(item.price).toLocaleString()}</p>
                          </div>
                        </div>

                        {/* Stock Counter & Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200/80 w-full sm:w-auto">
                          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-stone-200 shrink-0">
                            <span className="text-[10px] font-bold text-stone-500 px-1">Stock:</span>
                            <span className={`text-xs font-black px-1 ${isSoldOut ? 'text-rose-600' : 'text-stone-900'}`}>
                              {item.stock !== undefined ? item.stock : 5}
                            </span>

                            <button
                              onClick={() => handleQuickStockUpdate(item, (item.stock || 0) + 1)}
                              className="px-1.5 py-0.5 bg-stone-100 hover:bg-stone-200 text-stone-900 text-[10px] font-black rounded transition"
                              title="+1 unit"
                            >
                              +1
                            </button>
                            <button
                              onClick={() => handleQuickStockUpdate(item, (item.stock || 0) + 5)}
                              className="px-1.5 py-0.5 bg-amber-400 hover:bg-amber-300 text-stone-950 text-[10px] font-black rounded transition"
                              title="+5 units"
                            >
                              +5
                            </button>
                            {item.stock > 0 && (
                              <button
                                onClick={() => handleQuickStockUpdate(item, 0)}
                                className="px-1 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[9px] font-bold rounded transition"
                                title="Mark 0"
                              >
                                Mark 0
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleEditClick(item)}
                              className="p-2 bg-white hover:bg-stone-100 text-stone-700 rounded-xl border border-stone-200 shadow-sm transition"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                            </button>

                            <button
                              onClick={() => setDeleteConfirmProduct(item)}
                              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl border border-rose-200 transition"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Admin Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-3 border-t border-stone-200 text-xs font-bold text-stone-600">
                  <span>Page {currentPage} of {totalPages}</span>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      className={`px-3 py-1.5 rounded-xl border flex items-center gap-1 transition ${
                        currentPage === 1 ? 'bg-stone-100 text-stone-400 border-stone-200' : 'bg-white hover:bg-stone-100 text-stone-900 border-stone-300'
                      }`}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Prev
                    </button>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      className={`px-3 py-1.5 rounded-xl border flex items-center gap-1 transition ${
                        currentPage === totalPages ? 'bg-stone-100 text-stone-400 border-stone-200' : 'bg-white hover:bg-stone-100 text-stone-900 border-stone-300'
                      }`}
                    >
                      Next <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Negotiated Link Generator Tab */}
      {activeTab === 'negotiate' && (
        <div className="max-w-xl mx-auto space-y-6 bg-stone-50 p-5 sm:p-8 rounded-3xl border border-stone-200 w-full overflow-x-hidden">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-serif font-black text-stone-900 flex items-center gap-2">
              <Tag className="w-5 h-5 text-amber-600" /> WhatsApp Payment Link Generator
            </h3>
            <p className="text-xs text-stone-500">
              Create a custom discounted checkout link for your customer.
            </p>
          </div>

          {negotiateError && (
            <div className="bg-rose-50 text-rose-700 p-3.5 rounded-2xl text-xs font-bold border border-rose-200">
              {negotiateError}
            </div>
          )}

          <form onSubmit={handleGenerateLink} className="space-y-4 text-xs w-full">
            <div className="space-y-1">
              <label className="font-bold text-stone-700 block">Select Outfit</label>
              <select
                value={negotiatedProduct}
                onChange={(e) => setNegotiatedProduct(e.target.value)}
                className="w-full p-3.5 bg-white border border-stone-200 rounded-2xl font-bold text-stone-900 outline-none"
              >
                <option value="">-- Choose Outfit --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (NGN {Number(p.price).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-stone-700 block">Agreed Discounted Price (NGN ₦)</label>
              <input
                type="number"
                placeholder="e.g. 45000"
                value={discountedPrice}
                onChange={(e) => setDiscountedPrice(e.target.value)}
                className="w-full p-3.5 bg-white border border-stone-200 rounded-2xl font-black text-stone-900 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-stone-900 hover:bg-black text-amber-400 font-black py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-lg transition"
            >
              Generate Link
            </button>
          </form>

          {generatedLink && (
            <div className="pt-4 border-t border-stone-200 space-y-3 w-full">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 inline-block">
                Customer Payment Link
              </span>
              
              <div className="p-3 bg-white border border-stone-200 rounded-2xl break-all text-xs font-mono text-stone-800">
                {generatedLink}
              </div>

              <button
                onClick={copyGeneratedLink}
                className="w-full bg-amber-400 hover:bg-amber-300 text-stone-950 font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md transition"
              >
                {copiedLink ? <Check className="w-4 h-4 text-stone-950" /> : <Copy className="w-4 h-4 text-stone-950" />}
                <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Security Credentials Reset Tab */}
      {activeTab === 'security' && (
        <div className="max-w-xl mx-auto space-y-6 bg-stone-50 p-5 sm:p-8 rounded-3xl border border-stone-200 w-full overflow-x-hidden">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-serif font-black text-stone-900 flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-600" /> Account Security
            </h3>
            <p className="text-xs text-stone-500">
              Update your manager email address or password.
            </p>
          </div>

          {/* Email Update Form */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 space-y-3 w-full">
            <h4 className="font-extrabold text-xs text-stone-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-600" /> Change Email
            </h4>

            {emailChangeError && (
              <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-xs font-bold border border-rose-200">
                {emailChangeError}
              </div>
            )}
            {emailChangeSuccess && (
              <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl text-xs font-bold border border-emerald-200">
                {emailChangeSuccess}
              </div>
            )}

            <form onSubmit={handleUpdateEmail} className="space-y-3 text-xs w-full">
              <input
                type="email"
                placeholder="newowner@giftystore.com"
                value={newEmailInput}
                onChange={(e) => setNewEmailInput(e.target.value)}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-900 outline-none"
              />
              <button
                type="submit"
                disabled={isUpdatingEmail}
                className="w-full bg-stone-900 hover:bg-black text-amber-400 font-bold py-2.5 rounded-xl transition text-xs"
              >
                {isUpdatingEmail ? 'Updating...' : 'Update Email'}
              </button>
            </form>
          </div>

          {/* Password Update Form */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 space-y-3 w-full">
            <h4 className="font-extrabold text-xs text-stone-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600" /> Change Password
            </h4>

            {passwordChangeError && (
              <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-xs font-bold border border-rose-200">
                {passwordChangeError}
              </div>
            )}
            {passwordChangeSuccess && (
              <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl text-xs font-bold border border-emerald-200">
                {passwordChangeSuccess}
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-3 text-xs w-full">
              <input
                type="password"
                placeholder="New strong password (min 6 chars)"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-900 outline-none"
              />
              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-black py-2.5 rounded-xl transition text-xs"
              >
                {isUpdatingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl relative">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-serif font-black text-stone-900">Delete Outfit?</h3>
              <p className="text-xs text-stone-500">
                Are you sure you want to permanently remove "{deleteConfirmProduct.name}"?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmProduct(null)}
                className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-3 rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl text-xs shadow transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

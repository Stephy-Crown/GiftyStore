import React, { useState } from 'react';
import { Plus, Trash2, Video, Image, Lock } from 'lucide-react';

const MOCK_PIN = '1234';

export default function AdminDashboard({ products, setProducts }) {
  const [pin, setPin] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  const [form, setForm] = useState({
    name: '',
    price: '',
    category: 'Corset Gowns',
    image: '',
    video_url: '',
    is_tiktok_featured: true,
  });

  const handleLogin = (e) => {
    e.preventDefault();
    if (pin === MOCK_PIN) {
      setAuthenticated(true);
    } else {
      alert('Incorrect Security PIN! Use 1234');
    }
  };

  const handleAdd = (e) => {
    e.preventDefault();
    const newItem = {
      id: `prod-${Date.now()}`,
      name: form.name,
      price: parseFloat(form.price),
      category: form.category,
      image: form.image || 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600',
      video_url: form.video_url || null,
      is_tiktok_featured: form.is_tiktok_featured,
    };

    setProducts([newItem, ...products]);
    alert('✨ Outfit published directly to storefront!');
    setForm({ name: '', price: '', category: 'Corset Gowns', image: '', video_url: '', is_tiktok_featured: true });
  };

  const handleDelete = (id) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  if (!authenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white border border-stone-200 p-8 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif font-black text-stone-900">Boutique Owner Access</h2>
          <p className="text-xs text-stone-500">Enter your 4-digit mobile PIN to upload inventory</p>
          <input
            type="password"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full text-center text-3xl tracking-widest py-3 bg-stone-50 border border-stone-200 text-amber-700 rounded-xl outline-none focus:border-amber-500"
            placeholder="••••"
          />
          <button type="submit" className="w-full bg-stone-900 hover:bg-black text-white font-extrabold py-3.5 rounded-xl shadow-lg text-sm">
            Unlock Mobile Admin
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Mobile Inventory Manager</h2>
          <p className="text-xs text-stone-500">Add clothes & TikTok video links anytime for free</p>
        </div>
        <button onClick={() => setAuthenticated(false)} className="text-xs text-rose-600 font-bold border border-rose-200 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100">
          Lock Dashboard
        </button>
      </div>

      <form onSubmit={handleAdd} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
          <Plus className="w-5 h-5 text-amber-600" /> Add New Outfit to Storefront
        </h3>

        <input
          type="text"
          placeholder="Outfit Name *"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full p-3.5 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:border-amber-500"
        />

        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            placeholder="Price (₦) *"
            required
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:border-amber-500"
          />
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none text-stone-700"
          >
            <option>Corset Gowns</option>
            <option>Casual Tops</option>
            <option>Two-Piece Sets</option>
            <option>Owambe Fits</option>
          </select>
        </div>

        <input
          type="url"
          placeholder="Photo Link (JPG/PNG) *"
          required
          value={form.image}
          onChange={(e) => setForm({ ...form, image: e.target.value })}
          className="w-full p-3.5 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:border-amber-500"
        />

        <input
          type="url"
          placeholder="TikTok Video MP4 URL (Optional)"
          value={form.video_url}
          onChange={(e) => setForm({ ...form, video_url: e.target.value })}
          className="w-full p-3.5 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:border-amber-500"
        />

        <label className="flex items-center gap-2.5 cursor-pointer pt-1 text-xs text-stone-700 font-semibold">
          <input
            type="checkbox"
            checked={form.is_tiktok_featured}
            onChange={(e) => setForm({ ...form, is_tiktok_featured: e.target.checked })}
            className="w-4 h-4 accent-amber-600 rounded"
          />
          Feature on "Shop My TikTok" Video Reel Feed
        </label>

        <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-black py-3.5 rounded-xl shadow-md text-sm uppercase tracking-wider transition">
          Publish Outfit to Storefront
        </button>
      </form>

      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Current Inventory ({products.length})</h3>
        <div className="divide-y divide-stone-100">
          {products.map((item) => (
            <div key={item.id} className="py-3 flex items-center justify-between gap-4">
              <img src={item.image} alt={item.name} className="w-12 h-14 object-cover rounded-xl shadow-sm" />
              <div className="flex-1">
                <h4 className="font-bold text-sm text-stone-900">{item.name}</h4>
                <p className="text-xs text-amber-700 font-bold">₦{Number(item.price).toLocaleString()}</p>
              </div>
              <button onClick={() => handleDelete(item.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

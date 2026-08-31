import React, { useState, useEffect } from 'react';
import siteConfig from './data/config.json';
import { getFashionProducts } from './services/supabase';
import { TikTokShopSection } from './components/fashion/TikTokShopSection';
import { AdminDashboard } from './pages/AdminDashboard';
import CheckoutModal from './components/CheckoutModal';
import { Crown, Flame, Trash2, MapPin, ArrowRight, Heart, X, Share2, Copy, Send, Twitter, Store, ShoppingCart, SlidersHorizontal, Eye, ExternalLink, ChevronDown, AlertTriangle, Sparkles } from 'lucide-react';

// Official Standard WhatsApp SVG Icon
function WhatsAppIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.011 2c-5.506 0-9.975 4.469-9.975 9.974 0 1.76.459 3.477 1.332 4.992l-1.417 5.176 5.297-1.39c1.464.799 3.118 1.22 4.763 1.22h.004c5.505 0 9.974-4.469 9.974-9.974 0-2.666-1.039-5.171-2.924-7.056-1.884-1.884-4.39-2.923-7.054-2.923zm5.834 14.167c-.244.686-1.416 1.31-1.979 1.393-.518.077-1.16.109-1.864-.116-.427-.136-.975-.318-1.677-.621-2.951-1.274-4.877-4.254-5.025-4.45-.147-.196-1.2-1.597-1.2-3.047 0-1.45.756-2.164 1.025-2.458.27-.294.587-.368.783-.368.196 0 .392.002.564.01.182.009.426-.069.667.51.244.584.832 2.034.906 2.18.074.147.123.319.025.515-.098.196-.147.319-.294.49-.147.172-.309.384-.442.516-.147.147-.301.308-.129.603.172.295.763 1.258 1.637 2.037 1.124 1.002 2.072 1.313 2.367 1.46.295.147.466.123.638-.074.172-.196.736-.857.932-1.15.196-.294.392-.245.687-.136.294.11 1.864.879 2.183 1.038.319.159.531.235.605.358.074.123.074.714-.17 1.4z"/>
    </svg>
  );
}

// Official TikTok SVG Icon
function TikTokIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.82.56-1.32 1.51-1.35 2.51-.04 1.29.74 2.52 1.93 2.98 1.17.48 2.57.24 3.49-.58.74-.64 1.16-1.62 1.17-2.61.02-4.99.01-9.98.01-14.97z"/>
    </svg>
  );
}

// Compact Logo Crest (Works on Store & TikTok Tabs)
function BrandLogoCrest() {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-stone-950 via-stone-900 to-amber-950 shadow-md border border-amber-400/40 group-hover:scale-105 transition flex items-center justify-center">
        <Crown className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-amber-400 fill-amber-400" />
      </div>
      <div className="flex flex-col justify-center">
        <span className="font-serif font-black text-stone-950 tracking-[0.12em] sm:tracking-[0.15em] text-base sm:text-xl uppercase leading-none">
          GIFTY
        </span>
        <span className="text-[7px] sm:text-[8px] font-extrabold tracking-[0.2em] sm:tracking-[0.25em] text-amber-600 uppercase block mt-0.5">
          COUTURE
        </span>
      </div>
    </div>
  );
}

export function formatCurrencyPrice(amountInNGN) {
  return `NGN ${Math.round(Number(amountInNGN || 0)).toLocaleString()}`;
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [view, setView] = useState('store'); // 'store' | 'reels' | 'admin'
  const [activeCategory, setActiveCategory] = useState('All');

  // Size & Price Filters
  const [selectedSizeFilter, setSelectedSizeFilter] = useState('All');
  const [selectedPriceFilter, setSelectedPriceFilter] = useState('All');

  // Lazy Loading / Pagination State (Display 8 products at a time)
  const [visibleCount, setVisibleCount] = useState(8);

  // Single Product Modal View State
  const [singleProduct, setSingleProduct] = useState(null);
  const [selectedAngleMedia, setSelectedAngleMedia] = useState('main');
  const [selectedSize, setSelectedSize] = useState('M');

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [shareItem, setShareItem] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [logoTapCount, setLogoTapCount] = useState(0);

  // Hero Animated Slides State
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroSlides = [
    {
      id: 1,
      tag: "OWAMBE COUTURE",
      title: "Owambe Couture & Royal Glamour",
      type: "video",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-fashion-model-walking-on-a-catwalk-41584-large.mp4",
      posterUrl: "https://images.unsplash.com/photo-1571513722275-4b41940f54b8?w=1920&auto=format&fit=crop&q=85",
      cta: "Explore Collection"
    },
    {
      id: 2,
      tag: "ROYAL VELVET",
      title: "Hand-Crafted Velvet & Ankara Lace",
      type: "image",
      imageUrl: "https://images.unsplash.com/photo-1571513722275-4b41940f54b8?w=1920&auto=format&fit=crop&q=85",
      cta: "Shop Owambe Fits"
    },
    {
      id: 3,
      tag: "VIRAL TIKTOK",
      title: "Abeokuta Adire Silk Sets",
      type: "image",
      imageUrl: "https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=1920&auto=format&fit=crop&q=85",
      cta: "Watch TikTok Reels"
    },
    {
      id: 4,
      tag: "ASO-EBI ELEGANCE",
      title: "Lagos VIP Wedding Couture",
      type: "image",
      imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1920&auto=format&fit=crop&q=85",
      cta: "Explore Couture Fits"
    }
  ];

  // URL Query Sync & History Helper Functions
  const updateUrl = (targetView, productId = null) => {
    const url = new URL(window.location.href);
    if (targetView) url.searchParams.set('view', targetView);
    else url.searchParams.delete('view');

    if (productId) url.searchParams.set('product', productId);
    else url.searchParams.delete('product');

    window.history.pushState({ view: targetView, product: productId }, '', url.toString());
  };

  const navigateToView = (newView) => {
    setView(newView);
    updateUrl(newView, singleProduct?.id || null);
  };

  const openSingleProduct = (product, shouldUpdateUrl = true) => {
    if (!product) return;
    setSingleProduct(product);
    setSelectedAngleMedia('main');
    setSelectedSize(product.sizes?.[0] || 'M');
    if (shouldUpdateUrl) {
      updateUrl(view, product.id);
    }
  };

  const closeSingleProduct = (shouldUpdateUrl = true) => {
    setSingleProduct(null);
    if (shouldUpdateUrl) {
      updateUrl(view, null);
    }
  };

  // Automated Hero Slide Timer
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(slideInterval);
  }, []);

  // Initial Products Loading & Browser Back/Forward URL Sync Listener
  useEffect(() => {
    async function loadData() {
      const data = await getFashionProducts();
      if (Array.isArray(data)) {
        const initialized = data.filter(Boolean).map((item, index) => ({
          ...item,
          stock: item.stock !== undefined ? item.stock : (index === 2 ? 0 : index === 5 ? 2 : 5),
        }));
        setProducts(initialized);
      }
    }
    loadData();
  }, []);

  // Sync State with Browser URL Parameters (Deep-Linking & Back/Forward Support)
  useEffect(() => {
    const syncStateFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      const productParam = params.get('product');

      if (viewParam === 'reels' || viewParam === 'admin' || viewParam === 'store') {
        setView(viewParam);
      } else if (params.get('key') === 'x9k82m_gifty_admin_sec2026' || params.get('admin') === 'true') {
        setView('admin');
      }

      if (params.get('checkout') === 'true' || params.get('discountedPrice')) {
        setIsCheckoutOpen(true);
      }

      if (productParam && products.length > 0) {
        const found = products.find((p) => String(p.id) === String(productParam));
        if (found) {
          openSingleProduct(found, false);
        }
      } else if (!productParam) {
        setSingleProduct(null);
      }
    };

    syncStateFromUrl();
    window.addEventListener('popstate', syncStateFromUrl);
    return () => window.removeEventListener('popstate', syncStateFromUrl);
  }, [products]);

  const showToast = (msg, action) => {
    setToastMessage({ text: msg, action });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleLogoClick = () => {
    const newCount = logoTapCount + 1;
    setLogoTapCount(newCount);
    if (newCount >= 3) {
      navigateToView('admin');
      setLogoTapCount(0);
      showToast('Secret Owner Admin Portal Unlocked!');
    } else {
      navigateToView('store');
      setTimeout(() => setLogoTapCount(0), 2000);
    }
  };

  const categories = ['All', 'Corset Gowns', 'Two-Piece', 'Owambe'];
  const sizesOptions = ['All', 'S', 'M', 'L', 'XL'];
  const priceOptions = ['All', 'Under NGN 45,000', 'NGN 45,000 - 60,000', 'Above NGN 60,000'];

  const safeProducts = Array.isArray(products) ? products.filter(Boolean) : [];

  const filteredProducts = safeProducts.filter((p) => {
    if (!p) return false;
    
    if (activeCategory === 'Wishlist') {
      return wishlist.some((w) => String(w.id) === String(p.id));
    }

    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSize = selectedSizeFilter === 'All' || (p.sizes && p.sizes.includes(selectedSizeFilter));
    
    let matchesPrice = true;
    const priceVal = Number(p.price || 0);
    if (selectedPriceFilter === 'Under NGN 45,000') matchesPrice = priceVal < 45000;
    else if (selectedPriceFilter === 'NGN 45,000 - 60,000') matchesPrice = priceVal >= 45000 && priceVal <= 60000;
    else if (selectedPriceFilter === 'Above NGN 60,000') matchesPrice = priceVal > 60000;

    return matchesCategory && matchesSize && matchesPrice;
  });

  const displayedProducts = filteredProducts.slice(0, visibleCount);

  const addToCart = (product, sizeChoice) => {
    if (!product || product.stock === 0) return;
    const finalSize = sizeChoice || selectedSize || 'M';
    setCart((prev) => {
      const existing = prev.find((item) => String(item.id) === String(product.id) && item.size === finalSize);
      if (existing) {
        return prev.map((item) =>
          String(item.id) === String(product.id) && item.size === finalSize ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, size: finalSize, quantity: 1 }];
    });
    showToast(`Added "${product.name}" (Size: ${finalSize}) to Cart!`);
    setIsCartOpen(true);
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => String(item.id) !== String(id)));
  };

  const toggleWishlist = (product) => {
    if (!product) return;
    setWishlist((prev) => {
      const exists = prev.some((item) => String(item.id) === String(product.id));
      if (exists) {
        showToast(`Removed from Wishlist`);
        return prev.filter((item) => String(item.id) !== String(product.id));
      }
      showToast(`Saved "${product.name}" to Wishlist!`, {
        label: 'View Wishlist',
        onClick: () => setIsWishlistOpen(true)
      });
      return [...prev, product];
    });
  };

  const handleShareClick = (e, item) => {
    if (e) e.stopPropagation();
    setShareItem(item || { id: null, name: 'GIFTY Couture', price: 0, image: 'https://images.unsplash.com/photo-1571513722275-4b41940f54b8?w=600' });
  };

  const copyToClipboard = () => {
    const shareUrl = shareItem?.id 
      ? `${window.location.origin}${window.location.pathname}?product=${shareItem.id}`
      : window.location.href;
    navigator.clipboard.writeText(shareUrl);
    showToast('Direct dress link copied to clipboard!');
    setShareItem(null);
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);

  // Reusable Public Footer Component
  const SharedFooter = () => (
    <footer className="mt-16 sm:mt-20 pt-10 sm:pt-14 border-t border-stone-200/80 grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 text-stone-700 overflow-hidden">
      <div className="space-y-4">
        <BrandLogoCrest />
        <p className="text-xs text-stone-500 leading-relaxed">
          Lagos' premier mobile & desktop boutique storefront. Serving style lovers in Nigeria, UK, USA, and worldwide.
        </p>
        <div className="pt-2">
          <a
            href="https://tiktok.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-stone-900 text-white text-xs font-bold hover:bg-black transition shadow"
          >
            <TikTokIcon className="w-4 h-4 text-rose-400" /> Follow @GiftyStore on TikTok (150K+)
          </a>
        </div>
      </div>

      <div className="space-y-3 text-xs">
        <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-amber-600" /> Walk-In Boutique Store Location
        </h4>
        <p className="text-stone-600 font-medium">Suite 14, Luxury Fashion Plaza, Lekki Phase 1, Lagos, Nigeria</p>
        <p className="text-stone-500">Open Mon – Sat: 9:00 AM – 7:00 PM</p>
        
        <div className="pt-1">
          <a
            href="https://maps.google.com/?q=Suite+14+Luxury+Fashion+Plaza+Lekki+Phase+1+Lagos+Nigeria"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold hover:bg-amber-100 transition shadow-sm"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-600" />
            <span>Open Location in Google Maps</span>
          </a>
        </div>
      </div>

      <div className="h-48 sm:h-52 rounded-3xl overflow-hidden border border-stone-200 shadow-md relative group">
        <iframe
          title="Google Store Location Map"
          src="https://maps.google.com/maps?q=Suite%2014%2C%20Luxury%20Fashion%20Plaza%2C%20Lekki%20Phase%201%2C%20Lagos%2C%20Nigeria&t=&z=15&ie=UTF8&iwloc=&output=embed"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
        ></iframe>
      </div>

      <div className="col-span-1 md:col-span-3 pt-6 sm:pt-8 border-t border-stone-200/60 text-center text-[11px] text-stone-400">
        © 2026 GIFTY. All rights reserved. Built for Luxury Fashion.
      </div>
    </footer>
  );

  return (
    <div className="min-h-screen bg-[#FAF7F5] text-stone-900 font-sans selection:bg-amber-400 selection:text-black relative pb-12 overflow-x-hidden w-full">
      {/* Sleek & Compact Luxury Toast Notification for Mobile & Desktop */}
      {toastMessage && (
        <div className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 z-50 bg-stone-950/95 backdrop-blur-md text-white px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-2xl shadow-2xl text-[11px] sm:text-xs font-bold flex items-center justify-between gap-2.5 border border-stone-800/80 max-w-[92vw] sm:max-w-md w-auto">
          <span className="truncate">{typeof toastMessage === 'string' ? toastMessage : toastMessage.text}</span>
          {typeof toastMessage === 'object' && toastMessage.action && (
            <button
              onClick={toastMessage.action.onClick}
              className="bg-amber-400 text-stone-950 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-amber-300 transition shrink-0 shadow-sm"
            >
              {toastMessage.action.label}
            </button>
          )}
        </div>
      )}

      {/* Uncongested Ultra-Clean Header Navbar with Full URL Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 md:px-8 py-2.5 sm:py-3 flex items-center justify-between">
          
          {/* Logo Mark */}
          <div onClick={handleLogoClick} className="cursor-pointer group" title="Triple tap for owner admin">
            <BrandLogoCrest />
          </div>

          {/* Uncongested 3-Button Header Navigation with URL Sync */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => navigateToView('store')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-black transition flex items-center gap-1.5 ${
                view === 'store'
                  ? 'bg-stone-950 text-amber-400 shadow-md'
                  : 'text-stone-600 hover:text-stone-900 bg-stone-100'
              }`}
              title="Boutique Shop Collection"
            >
              <Store className="w-3.5 h-3.5 text-amber-400" />
              <span>Shop</span>
            </button>

            <button
              onClick={() => navigateToView('reels')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-black transition flex items-center gap-1.5 ${
                view === 'reels'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-stone-700 bg-rose-50 hover:bg-rose-100'
              }`}
              title="Viral TikTok Deals"
            >
              <TikTokIcon className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
              <span>TikTok</span>
            </button>
            
            <button
              onClick={() => setIsCartOpen(!isCartOpen)}
              className="relative p-2 sm:p-2.5 bg-stone-950 hover:bg-black text-amber-400 rounded-full shadow-md transition ml-1"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-black rounded-full w-4 h-4 sm:w-4.5 sm:h-4.5 flex items-center justify-center shadow-lg ring-2 ring-white animate-bounce">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Storefront View */}
      {view === 'store' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 space-y-10 md:space-y-14 overflow-x-hidden">
          
          {/* High-Fashion Hero Banner */}
          <div className="relative h-[340px] sm:h-[380px] md:h-[440px] rounded-3xl overflow-hidden shadow-2xl border border-stone-200 flex flex-col justify-end p-6 sm:p-10 md:p-12">
            {heroSlides.map((slide, idx) => (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  currentSlide === idx ? 'opacity-100 scale-105' : 'opacity-0 scale-100 pointer-events-none'
                }`}
              >
                {slide.type === 'video' ? (
                  <video
                    src={slide.videoUrl}
                    poster={slide.posterUrl}
                    className="w-full h-full object-cover brightness-95"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={slide.imageUrl}
                    alt={slide.title}
                    loading="lazy"
                    className="w-full h-full object-cover brightness-95"
                  />
                )}
              </div>
            ))}

            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/35 to-transparent pointer-events-none" />

            {/* Icon-Only Share Button on Mobile, Full Label on Desktop */}
            <button
              onClick={(e) => handleShareClick(e, null)}
              className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-md hover:bg-white text-stone-950 p-2.5 sm:px-3.5 sm:py-2 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-xl transition"
              title="Share This Look"
            >
              <Share2 className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">Share This Look</span>
            </button>

            <div className="relative max-w-xl space-y-3 z-10 text-white">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-stone-950/80 px-3 py-1 rounded-full border border-amber-400/30">
                {heroSlides[currentSlide].tag}
              </span>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-serif font-black leading-tight text-white drop-shadow-md">
                {heroSlides[currentSlide].title}
              </h1>
              
              <div className="pt-1">
                <button
                  onClick={() => navigateToView('reels')}
                  className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-black px-6 py-3 rounded-full text-xs sm:text-sm inline-flex items-center gap-2 shadow-2xl hover:scale-105 transition uppercase tracking-wider"
                >
                  {heroSlides[currentSlide].cta} <ArrowRight className="w-4 h-4 text-stone-950" />
                </button>
              </div>
            </div>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
              {heroSlides.map((slide, idx) => (
                <button
                  key={slide.id}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    currentSlide === idx ? 'w-6 bg-amber-400 shadow' : 'w-1.5 bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* TikTok Shop Section */}
          <TikTokShopSection products={safeProducts} onAddToCart={addToCart} />

          {/* Catalog Grid with Size, Price, AND Prominent Wishlist Filter */}
          <div className="space-y-6 pt-6 border-t border-stone-200">
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-2xl md:text-3xl font-serif font-black text-stone-900">Boutique Collection</h2>
                  <p className="text-xs text-stone-500">Filter outfits by Category, Size, Price, or your Saved Wishlist</p>
                </div>

                {/* Direct Wishlist Drawer Launcher Button in Catalog Header */}
                <button
                  onClick={() => setIsWishlistOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 text-xs font-black transition self-start sm:self-auto shadow-sm"
                >
                  <Heart className={`w-4 h-4 ${wishlist.length > 0 ? 'fill-rose-500 text-rose-500 animate-pulse' : 'text-rose-500'}`} />
                  <span>Saved Wishlist ({wishlist.length})</span>
                </button>
              </div>

              {/* Filter Bar with Integrated Saved Wishlist Filter Tab & Side-by-side Dropdowns on Mobile */}
              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                  <div className="flex items-center gap-1 font-bold text-xs text-stone-700 mr-1 shrink-0">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" /> Filter:
                  </div>

                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setActiveCategory(cat);
                        setVisibleCount(8);
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                        activeCategory === cat
                          ? 'bg-amber-500 text-stone-950 font-black shadow-sm'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}

                  {/* Prominent Wishlist Category Filter Pill */}
                  <button
                    onClick={() => {
                      setActiveCategory('Wishlist');
                      setVisibleCount(8);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition flex items-center gap-1.5 ${
                      activeCategory === 'Wishlist'
                        ? 'bg-rose-600 text-white font-black shadow-md'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${activeCategory === 'Wishlist' ? 'fill-white' : 'fill-rose-500 text-rose-500'}`} />
                    <span>Saved Outfits ({wishlist.length})</span>
                  </button>
                </div>

                {/* Side-by-Side Size and Price Filters on Mobile */}
                <div className="w-full md:w-auto grid grid-cols-2 md:flex md:items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-stone-100">
                  <div className="flex items-center gap-1.5 bg-stone-50 md:bg-transparent p-1.5 md:p-0 rounded-xl border md:border-0 border-stone-200/80">
                    <span className="text-[11px] font-bold text-stone-500 shrink-0">Size:</span>
                    <select
                      value={selectedSizeFilter}
                      onChange={(e) => {
                        setSelectedSizeFilter(e.target.value);
                        setVisibleCount(8);
                      }}
                      className="bg-white md:bg-stone-100 border border-stone-200 text-xs font-bold rounded-xl px-2 py-1 text-stone-800 outline-none w-full"
                    >
                      {sizesOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 bg-stone-50 md:bg-transparent p-1.5 md:p-0 rounded-xl border md:border-0 border-stone-200/80">
                    <span className="text-[11px] font-bold text-stone-500 shrink-0">Price:</span>
                    <select
                      value={selectedPriceFilter}
                      onChange={(e) => {
                        setSelectedPriceFilter(e.target.value);
                        setVisibleCount(8);
                      }}
                      className="bg-white md:bg-stone-100 border border-stone-200 text-xs font-bold rounded-xl px-2 py-1 text-stone-800 outline-none w-full"
                    >
                      {priceOptions.map((pr) => (
                        <option key={pr} value={pr}>{pr}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Spacious Luxury Product Grid — 1 Column on Mobile for Elegant Big Cards, 2 on SM, 4 on LG */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-6 md:gap-8">
              {displayedProducts.length === 0 && activeCategory === 'Wishlist' ? (
                <div className="col-span-full py-16 text-center space-y-3 bg-white rounded-3xl border border-stone-200 p-8 shadow-sm">
                  <Heart className="w-12 h-12 text-rose-400 mx-auto fill-rose-100 animate-pulse" />
                  <h3 className="text-lg font-serif font-black text-stone-900">Your Saved Wishlist is Empty</h3>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    Tap the heart icon on top of any dress card in the catalog to save your favorite Owambe & Couture fits!
                  </p>
                  <button
                    onClick={() => setActiveCategory('All')}
                    className="mt-2 bg-stone-900 text-amber-400 font-bold px-6 py-2.5 rounded-full text-xs uppercase tracking-wider"
                  >
                    Browse All Outfits
                  </button>
                </div>
              ) : (
                displayedProducts.map((product) => {
                  const isWishlisted = wishlist.some((w) => String(w.id) === String(product.id));
                  const isSoldOut = product.stock === 0;
                  const isLowStock = product.stock > 0 && product.stock <= 3;

                  return (
                    <div
                      key={product.id || product.name}
                      onClick={() => openSingleProduct(product)}
                      className="bg-white rounded-3xl overflow-hidden border border-stone-200/80 shadow-sm hover:shadow-xl transition duration-300 flex flex-col group relative cursor-pointer"
                    >
                      <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => handleShareClick(e, product)}
                          className="p-2.5 bg-white/90 backdrop-blur-md rounded-full shadow-md hover:scale-110 active:scale-95 transition text-stone-700 hover:text-amber-600"
                          title="Share Outfit"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(product);
                          }}
                          className="p-2.5 bg-white/90 backdrop-blur-md rounded-full shadow-md hover:scale-110 active:scale-95 transition"
                          title="Save to Wishlist"
                        >
                          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-stone-700'}`} />
                        </button>
                      </div>

                      <div className="relative h-80 sm:h-72 md:h-80 w-full bg-stone-100 overflow-hidden">
                        <img
                          src={product.image}
                          alt={product.name}
                          loading="lazy"
                          className={`w-full h-full object-cover group-hover:scale-105 transition duration-500 ${isSoldOut ? 'grayscale brightness-75' : ''}`}
                        />

                        {/* Stock Badges */}
                        {isSoldOut ? (
                          <span className="absolute top-3 left-3 bg-stone-950 text-white text-[11px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow">
                            SOLD OUT
                          </span>
                        ) : isLowStock ? (
                          <span className="absolute top-3 left-3 bg-amber-500 text-stone-950 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-stone-950" /> ONLY {product.stock} LEFT
                          </span>
                        ) : product.is_tiktok_featured ? (
                          <span className="absolute top-3 left-3 bg-stone-900/90 text-amber-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow">
                            TIKTOK REEL
                          </span>
                        ) : null}
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block mb-1">{product.category}</span>
                          <h3 className="text-base sm:text-lg font-bold text-stone-900 truncate">{product.name}</h3>
                          <p className="text-lg sm:text-xl font-black text-amber-600 mt-1">
                            {formatCurrencyPrice(product.price)}
                          </p>
                        </div>

                        {/* Uncongested Luxury Action Buttons */}
                        <div className="grid grid-cols-2 gap-2.5 pt-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openSingleProduct(product);
                            }}
                            className="bg-stone-100 hover:bg-stone-200 text-stone-900 font-extrabold py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition"
                          >
                            <Eye className="w-4 h-4 text-amber-600" /> View Fit
                          </button>
                          
                          <button
                            disabled={isSoldOut}
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(product);
                            }}
                            className={`font-extrabold py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition shadow-md ${
                              isSoldOut
                                ? 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
                                : 'bg-stone-900 hover:bg-black text-amber-400'
                            }`}
                          >
                            <ShoppingCart className="w-4 h-4 text-amber-400" /> {isSoldOut ? 'Sold Out' : '+ Add Cart'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Load More Outfits Pagination Button */}
            {visibleCount < filteredProducts.length && (
              <div className="text-center pt-8">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 8)}
                  className="bg-stone-900 hover:bg-black text-amber-400 font-black px-8 py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-xl inline-flex items-center gap-2 transition hover:scale-105 active:scale-95"
                >
                  <ChevronDown className="w-4 h-4 text-amber-400" />
                  <span>Load More Outfits (Showing {displayedProducts.length} of {filteredProducts.length})</span>
                </button>
              </div>
            )}
          </div>

          <SharedFooter />
        </main>
      )}

      {/* TikTok Reels View */}
      {view === 'reels' && (
        <main className="max-w-7xl mx-auto px-4 py-8 overflow-x-hidden">
          <TikTokShopSection products={safeProducts} onAddToCart={addToCart} />
          <SharedFooter />
        </main>
      )}

      {/* Secret Encrypted Admin View */}
      {view === 'admin' && (
        <main className="max-w-7xl mx-auto px-4 py-8 overflow-x-hidden">
          <AdminDashboard products={safeProducts} setProducts={setProducts} />
        </main>
      )}

      {/* Floating Official WhatsApp Chat Button */}
      <a
        href={`https://wa.me/${siteConfig.whatsappPhone}?text=${encodeURIComponent('Hello Gifty! I am browsing your fashion website and would like to ask a question.')}`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-40 bg-[#25D366] hover:bg-[#20ba5a] text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition flex items-center gap-2 font-bold text-xs"
        title="Chat with Us on WhatsApp"
      >
        <WhatsAppIcon className="w-6 h-6 fill-white" />
        <span className="hidden md:inline">Chat with Us</span>
      </a>

      {/* Single Product Full Details Modal with URL & History Sync */}
      {singleProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-2xl relative my-8 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => closeSingleProduct()}
              className="absolute right-5 top-5 bg-stone-100 text-stone-500 hover:text-stone-900 p-2 rounded-full shadow transition"
              title="Close Dress Details"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="h-80 md:h-96 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 relative shadow-inner">
                  {selectedAngleMedia === 'video' && singleProduct.video_url ? (
                    <video
                      src={singleProduct.video_url}
                      className="w-full h-full object-cover"
                      autoPlay
                      loop
                      muted
                      controls
                      playsInline
                    />
                  ) : (
                    <img
                      src={
                        selectedAngleMedia === 'back'
                          ? 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800'
                          : selectedAngleMedia === 'side'
                          ? 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800'
                          : singleProduct.image
                      }
                      alt={singleProduct.name}
                      loading="lazy"
                      className={`w-full h-full object-cover ${singleProduct.stock === 0 ? 'grayscale brightness-75' : ''}`}
                    />
                  )}

                  {singleProduct.stock === 0 && (
                    <span className="absolute top-3 left-3 bg-stone-950 text-white text-[11px] font-black px-3.5 py-1 rounded-full uppercase shadow">
                      SOLD OUT
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto py-1">
                  <button
                    onClick={() => setSelectedAngleMedia('main')}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition ${
                      selectedAngleMedia === 'main' ? 'border-amber-500 ring-2 ring-amber-200' : 'border-stone-200'
                    }`}
                  >
                    <img src={singleProduct.image} alt="Front View" loading="lazy" className="w-full h-full object-cover" />
                  </button>

                  <button
                    onClick={() => setSelectedAngleMedia('side')}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition ${
                      selectedAngleMedia === 'side' ? 'border-amber-500 ring-2 ring-amber-200' : 'border-stone-200'
                    }`}
                  >
                    <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300" alt="Side View" loading="lazy" className="w-full h-full object-cover" />
                  </button>

                  <button
                    onClick={() => setSelectedAngleMedia('back')}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition ${
                      selectedAngleMedia === 'back' ? 'border-amber-500 ring-2 ring-amber-200' : 'border-stone-200'
                    }`}
                  >
                    <img src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=300" alt="Back View" loading="lazy" className="w-full h-full object-cover" />
                  </button>

                  {singleProduct.video_url && (
                    <button
                      onClick={() => setSelectedAngleMedia('video')}
                      className={`w-14 h-14 rounded-xl bg-stone-900 text-amber-400 font-extrabold text-[10px] flex flex-col items-center justify-center border-2 transition ${
                        selectedAngleMedia === 'video' ? 'border-amber-500 ring-2 ring-amber-200' : 'border-stone-200'
                      }`}
                    >
                      Video
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="bg-amber-100 text-amber-900 text-[10px] font-black uppercase px-3 py-1 rounded-full">
                      {singleProduct.category}
                    </span>

                    <button
                      onClick={(e) => handleShareClick(e, singleProduct)}
                      className="text-stone-600 hover:text-amber-600 text-xs font-bold flex items-center gap-1 bg-stone-100 px-2.5 py-1 rounded-full border border-stone-200 transition"
                    >
                      <Share2 className="w-3.5 h-3.5 text-amber-600" /> Share Link
                    </button>
                  </div>

                  <h2 className="text-xl md:text-2xl font-serif font-black text-stone-900 mt-2">{singleProduct.name}</h2>
                  <p className="text-2xl font-black text-amber-600 mt-1">
                    {formatCurrencyPrice(singleProduct.price)}
                  </p>
                  <p className="text-xs text-stone-500 mt-3 leading-relaxed">
                    {singleProduct.description || "Hand-crafted luxury Nigerian couture designed for high elegance, Owambe parties, and VIP occasions."}
                  </p>

                  <div className="mt-5 space-y-2">
                    <label className="text-xs font-bold text-stone-900 block">Select Your Size:</label>
                    <div className="flex items-center gap-2">
                      {(singleProduct.sizes || ['S', 'M', 'L', 'XL']).map((sz) => (
                        <button
                          key={sz}
                          onClick={() => setSelectedSize(sz)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
                            selectedSize === sz
                              ? 'bg-stone-900 text-white border-stone-900 shadow-md'
                              : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 pt-4">
                  <button
                    disabled={singleProduct.stock === 0}
                    onClick={() => {
                      addToCart(singleProduct, selectedSize);
                      closeSingleProduct();
                    }}
                    className={`w-full font-extrabold py-3.5 rounded-xl shadow-xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider transition ${
                      singleProduct.stock === 0
                        ? 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
                        : 'bg-stone-900 hover:bg-black text-amber-400'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" /> {singleProduct.stock === 0 ? 'Currently Sold Out' : `Add Size ${selectedSize} to Cart`}
                  </button>

                  <a
                    href={`https://wa.me/${siteConfig.whatsappPhone}?text=${encodeURIComponent(
                      singleProduct.stock === 0
                        ? `Hello Gifty! "${singleProduct.name}" (Size: ${selectedSize}) is currently marked as SOLD OUT on your website. I would like to inquire about placing a pre-order or custom tailored remake!`
                        : `Hello Gifty! I am interested in "${singleProduct.name}" (Size: ${selectedSize}, Listed Price: NGN ${Number(singleProduct.price || 0).toLocaleString()}). I would like to negotiate the price. Please send me a custom discounted website payment link!`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`w-full font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 text-xs shadow transition ${
                      singleProduct.stock === 0
                        ? 'bg-stone-900 hover:bg-black text-amber-400 border border-stone-700'
                        : 'bg-[#25D366] hover:bg-[#20ba5a] text-white'
                    }`}
                  >
                    <WhatsAppIcon className={`w-4 h-4 ${singleProduct.stock === 0 ? 'fill-amber-400' : 'fill-white'}`} />
                    <span>{singleProduct.stock === 0 ? 'Inquire Pre-Order / Restock on WhatsApp' : 'Negotiate Price on WhatsApp'}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal with Direct Product Link Generator */}
      {shareItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl relative">
            <button onClick={() => setShareItem(null)} className="absolute right-4 top-4 text-stone-400 hover:text-stone-900 p-1">
              <X className="w-6 h-6" />
            </button>

            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto shadow">
              <Share2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-serif font-black text-stone-900">Share Direct Outfit Link</h3>
              <p className="text-xs text-stone-500">Anyone opening this link will view this exact dress:</p>
            </div>

            <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 flex items-center gap-3 text-left shadow-inner">
              {shareItem.image ? (
                <img src={shareItem.image} alt={shareItem.name} loading="lazy" className="w-14 h-16 object-cover rounded-xl shadow" />
              ) : (
                <div className="w-14 h-16 bg-amber-500 text-stone-950 font-black rounded-xl flex items-center justify-center text-xl">
                  G
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                  {shareItem.category || 'Gifty Collection'}
                </span>
                <h4 className="font-bold text-xs text-stone-900 truncate">{shareItem.name}</h4>
                {shareItem.price > 0 && (
                  <p className="text-xs font-black text-amber-600 mt-0.5">{formatCurrencyPrice(shareItem.price)}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 pt-1">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Check out this gorgeous dress "${shareItem.name}" on ${siteConfig.storeName}: ` +
                  (shareItem.id ? `${window.location.origin}${window.location.pathname}?product=${shareItem.id}` : window.location.href)
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2.5 text-xs shadow transition"
              >
                <WhatsAppIcon className="w-4 h-4 fill-white" /> Share on WhatsApp Chat
              </a>

              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  `Obsessed with "${shareItem.name}" on ${siteConfig.storeName}! ` +
                  (shareItem.id ? `${window.location.origin}${window.location.pathname}?product=${shareItem.id}` : window.location.href)
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-[#1DA1F2] hover:bg-[#1a91da] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2.5 text-xs shadow transition"
              >
                <Twitter className="w-4 h-4 fill-white" /> Share on Twitter / X
              </a>

              <button
                onClick={copyToClipboard}
                className="w-full bg-stone-900 hover:bg-black text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2.5 text-xs shadow transition"
              >
                <Copy className="w-4 h-4 text-amber-400" /> Copy Direct Dress Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wishlist Drawer */}
      {isWishlistOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end">
          <div className="bg-white max-w-md w-full h-full p-6 border-l border-stone-200 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-stone-200">
                <h2 className="text-xl font-serif font-black text-stone-900 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500 fill-rose-500" /> Saved Wishlist ({wishlist.length})
                </h2>
                <button onClick={() => setIsWishlistOpen(false)} className="text-stone-400 hover:text-stone-900 p-1">✕</button>
              </div>
              <div className="py-4 space-y-3 max-h-[70vh] overflow-y-auto">
                {wishlist.length === 0 ? (
                  <p className="text-sm text-stone-400 py-12 text-center">No saved dresses yet. Tap the heart icon on any dress to save!</p>
                ) : (
                  wishlist.map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-stone-50 p-3.5 rounded-2xl border border-stone-200 gap-3">
                      <img src={item.image} alt={item.name} loading="lazy" className="w-12 h-14 object-cover rounded-xl shadow-sm" />
                      <div className="flex-1">
                        <p className="font-bold text-xs text-stone-900">{item.name}</p>
                        <p className="text-xs font-black text-amber-600">{formatCurrencyPrice(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          disabled={item.stock === 0}
                          onClick={() => addToCart(item)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                            item.stock === 0 ? 'bg-stone-200 text-stone-400' : 'bg-stone-900 text-white hover:bg-black'
                          }`}
                        >
                          {item.stock === 0 ? 'Sold Out' : 'Add to Cart'}
                        </button>
                        <button
                          onClick={() => toggleWishlist(item)}
                          className="text-rose-500 p-1.5 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer — With Dual Wishlist Access */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end">
          <div className="bg-white max-w-md w-full h-full p-6 border-l border-stone-200 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-stone-200">
                <h2 className="text-xl font-serif font-black text-stone-900">Your Shopping Cart ({cart.length})</h2>
                <button onClick={() => setIsCartOpen(false)} className="text-stone-400 hover:text-stone-900 p-1">✕</button>
              </div>

              {/* Convenient Quick Link to Saved Wishlist inside Cart */}
              <div className="pt-3">
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsWishlistOpen(true);
                  }}
                  className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-2 transition border border-rose-200"
                >
                  <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                  <span>View Saved Wishlist Outfits ({wishlist.length})</span>
                </button>
              </div>

              <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="text-sm text-stone-400 py-12 text-center">Your cart is currently empty.</p>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs md:text-sm bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                      <div>
                        <p className="font-bold text-stone-900">{item.name} {item.size && `(Size: ${item.size})`}</p>
                        <p className="text-stone-500 mt-0.5">Qty: {item.quantity} × {formatCurrencyPrice(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-amber-600">{formatCurrencyPrice(item.price * item.quantity)}</span>
                        <button onClick={() => removeFromCart(item.id)} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            {cart.length > 0 && (
              <div className="border-t border-stone-200 pt-4 space-y-3">
                <div className="flex justify-between font-bold text-base">
                  <span>Cart Subtotal</span>
                  <span className="text-amber-600 font-black">{formatCurrencyPrice(cartSubtotal)}</span>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="w-full bg-stone-900 hover:bg-black text-white font-extrabold py-3.5 rounded-xl text-sm uppercase tracking-wider shadow-lg transition"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <CheckoutModal
          cart={cart}
          onClose={() => setIsCheckoutOpen(false)}
          onSuccess={() => {
            setCart([]);
            setIsCheckoutOpen(false);
          }}
        />
      )}
    </div>
  );
}

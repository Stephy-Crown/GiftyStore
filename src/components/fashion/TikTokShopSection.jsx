import React from 'react';
import { ShoppingBag, Sparkles, Flame, Tag, Eye } from 'lucide-react';
import { formatCurrencyPrice } from '../../App';

// Official TikTok SVG Vector Icon
function TikTokIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.82.56-1.32 1.51-1.35 2.51-.04 1.29.74 2.52 1.93 2.98 1.17.48 2.57.24 3.49-.58.74-.64 1.16-1.62 1.17-2.61.02-4.99.01-9.98.01-14.97z"/>
    </svg>
  );
}

export function TikTokShopSection({ products = [], onAddToCart, onOpenSingleProduct }) {
  const safeProducts = Array.isArray(products) ? products.filter(Boolean) : [];
  const reels = safeProducts.filter((p) => p.video_url || p.is_tiktok_featured);
  const displayReels = reels.length > 0 ? reels : safeProducts;

  return (
    <section className="py-6 space-y-6">
      {/* Exclusive TikTok Header */}
      <div className="text-center space-y-2.5 px-4">
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-rose-500 text-white font-black text-xs tracking-wider uppercase shadow-md">
          <Flame className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
          <span>VIRAL TIKTOK FITS & FOLLOWER DEALS</span>
        </div>
        <h2 className="text-2xl md:text-4xl font-serif font-black text-stone-900">
          As Seen On @GiftyStore TikTok
        </h2>
        <p className="text-xs md:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
          Watch viral video reels in motion & order your dress with 1-click Paystack checkout or WhatsApp negotiation!
        </p>

        {/* TikTok Follow & Discount Pill */}
        <div className="pt-1.5 flex flex-wrap items-center justify-center gap-2">
          <a
            href="https://tiktok.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-stone-900 text-white text-xs font-bold hover:bg-black transition shadow-lg hover:scale-105 active:scale-95"
          >
            <TikTokIcon className="w-4 h-4 text-rose-400" />
            <span>Follow @GiftyStore on TikTok (150K+ Community)</span>
          </a>
        </div>
      </div>

      {/* Grid of Vertical TikTok Video Reel Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto px-4">
        {displayReels.map((reel) => (
          <div
            key={reel.id || reel.name}
            onClick={() => typeof onOpenSingleProduct === 'function' && onOpenSingleProduct(reel)}
            className="relative rounded-3xl overflow-hidden h-[480px] sm:h-[500px] shadow-2xl bg-stone-900 border border-stone-200 group cursor-pointer"
          >
            {reel.video_url ? (
              <video
                src={reel.video_url}
                poster={reel.image}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <img
                src={reel.image}
                alt={reel.name}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
            )}

            {/* Top Badge: TikTok Special */}
            <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5">
              <span className="bg-rose-600/90 backdrop-blur-md text-white font-extrabold text-[10px] px-3 py-1 rounded-full uppercase shadow flex items-center gap-1">
                <Tag className="w-3 h-3 text-amber-300" /> TIKTOK SPECIAL DEAL
              </span>
            </div>

            {/* Bottom Overlay Card */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-950 via-stone-950/90 to-transparent p-6 flex flex-col justify-end text-white z-10">
              <span className="text-[10px] bg-amber-500 text-stone-950 font-black px-3 py-1 rounded-full w-fit uppercase tracking-wider mb-2 shadow">
                VIRAL REEL FASHION
              </span>
              <h3 className="text-lg font-bold leading-snug">{reel.name}</h3>
              <span className="text-xl font-black text-amber-400 my-1">
                {formatCurrencyPrice(reel.price)}
              </span>

              {/* Dual Actions: Buy/View on Website AND Watch on TikTok App */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (typeof onOpenSingleProduct === 'function') {
                      onOpenSingleProduct(reel);
                    }
                  }}
                  className="w-full bg-white hover:bg-amber-400 text-stone-950 font-black py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-xl transition text-xs uppercase tracking-wider active:scale-95"
                >
                  <Eye className="w-4 h-4 text-amber-600" />
                  <span>Buy Outfit</span>
                </button>

                <a
                  href="https://tiktok.com"
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="w-full bg-stone-900/90 hover:bg-black text-rose-300 font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 border border-rose-500/30 text-xs transition"
                  title="Open Original Video on TikTok App"
                >
                  <TikTokIcon className="w-4 h-4 text-rose-400" />
                  <span>TikTok App</span>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

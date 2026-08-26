import React, { useState } from 'react';
import { ShoppingBag, Heart, Share2, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

export default function TikTokReelFeed({ products, onQuickBuy }) {
  const reels = products.filter((p) => p.video_url || p.is_tiktok_featured);
  const displayReels = reels.length > 0 ? reels : products;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [liked, setLiked] = useState({});

  const currentItem = displayReels[currentIndex] || products[0];

  const toggleLike = (id) => {
    setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between text-xs md:text-sm text-stone-900 font-bold uppercase tracking-wider bg-white px-6 py-3.5 rounded-2xl border border-stone-200 shadow-sm">
        <span className="flex items-center gap-2 text-amber-700">
          <Sparkles className="w-4 h-4 text-amber-500" /> Shop My TikTok Outfits
        </span>
        <span className="text-stone-500 font-medium">Outfit {currentIndex + 1} of {displayReels.length}</span>
      </div>

      {/* Main Video Reel Container */}
      <div className="relative w-full max-w-md md:max-w-lg mx-auto h-[600px] md:h-[680px] rounded-3xl overflow-hidden bg-stone-900 border border-stone-200 shadow-2xl group">
        {currentItem.video_url ? (
          <video
            key={currentItem.id}
            src={currentItem.video_url}
            className="w-full h-full object-cover"
            loop
            autoPlay
            muted
            playsInline
          />
        ) : (
          <img
            src={currentItem.image}
            alt={currentItem.name}
            className="w-full h-full object-cover"
          />
        )}

        {/* Action Floating Buttons */}
        <div className="absolute right-4 bottom-32 flex flex-col gap-4 z-20">
          <button
            onClick={() => toggleLike(currentItem.id)}
            className="p-3.5 bg-white/80 backdrop-blur-md rounded-full text-stone-900 hover:scale-110 active:scale-95 transition shadow-lg"
          >
            <Heart className={`w-6 h-6 ${liked[currentItem.id] ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
          <button
            onClick={() => navigator.share?.({ title: currentItem.name, url: window.location.href })}
            className="p-3.5 bg-white/80 backdrop-blur-md rounded-full text-stone-900 hover:scale-110 active:scale-95 transition shadow-lg"
          >
            <Share2 className="w-6 h-6" />
          </button>
        </div>

        {/* Overlay Info Card */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-stone-950 via-stone-950/70 to-transparent p-6 z-10 text-white">
          <span className="bg-amber-400 text-stone-950 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow">
            {currentItem.category || 'TikTok Viral Fit'}
          </span>
          <h3 className="text-xl font-bold mt-2 leading-snug">{currentItem.name}</h3>
          <p className="text-2xl font-black text-amber-400 mt-1">
            ₦{Number(currentItem.price).toLocaleString()}
          </p>

          <button
            onClick={() => onQuickBuy(currentItem)}
            className="w-full mt-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xl active:scale-95 transition text-sm"
          >
            <ShoppingBag className="w-5 h-5" /> Buy This Outfit Now
          </button>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center max-w-md md:max-w-lg mx-auto px-2">
        <button
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs md:text-sm font-bold text-stone-800 disabled:opacity-40 hover:border-amber-500 transition shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" /> Previous Outfit
        </button>
        <button
          disabled={currentIndex === displayReels.length - 1}
          onClick={() => setCurrentIndex((prev) => Math.min(displayReels.length - 1, prev + 1))}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs md:text-sm font-bold disabled:opacity-40 shadow-lg hover:bg-black transition"
        >
          Next Outfit <ChevronRight className="w-4 h-4 text-amber-400" />
        </button>
      </div>
    </div>
  );
}

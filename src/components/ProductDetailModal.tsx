import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, ShoppingCart, Play, Check, ShieldAlert } from 'lucide-react';
import { Product } from '../types';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  isInCart: boolean;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  isInCart
}) => {
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  // Combine main image, extra images, and videos into a single list
  const mediaList: { type: 'image' | 'video'; id: string; provider?: 'youtube' | 'drive' }[] = [
    { type: 'image', id: product.fileId }
  ];

  product.extraImages.forEach(img => {
    mediaList.push({ type: 'image', id: img });
  });

  product.videos.forEach(video => {
    mediaList.push({ type: 'video', id: video.id, provider: video.provider || video.type });
  });

  const nextMedia = () => {
    setActiveMediaIndex((prev) => (prev + 1) % mediaList.length);
  };

  const prevMedia = () => {
    setActiveMediaIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
  };

  const activeMedia = mediaList[activeMediaIndex];

  // Helper to get image URL (checking if it is mock/demo or real file id)
  const getImageUrl = (id: string) => {
    if (id.startsWith('1_') || id.startsWith('https://')) {
      return id.startsWith('1_') ? id.replace('1_demo_', 'https://images.unsplash.com/') : id;
    }
    return `https://drive.google.com/thumbnail?id=${id}&sz=w800`;
  };

  const hasDiscount = product.originalPrice > product.discountedPrice;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border border-stone-200 flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 rounded-full bg-stone-950/40 text-white hover:bg-stone-950/70 transition-all cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Media Carousel Area (Left side on desktop) */}
        <div className="relative w-full md:w-1/2 bg-stone-950 flex flex-col justify-between p-4 min-h-[350px] md:min-h-0">
          <div className="flex-grow flex items-center justify-center">
            {activeMedia.type === 'image' ? (
              <img
                src={getImageUrl(activeMedia.id)}
                alt="Product"
                className="max-h-[50vh] md:max-h-[60vh] object-contain rounded-xl shadow-lg"
              />
            ) : (
              // Video rendering
              <div className="w-full aspect-video rounded-xl overflow-hidden shadow-lg border border-stone-800">
                {activeMedia.provider === 'youtube' ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${activeMedia.id}?autoplay=0&rel=0`}
                    title="YouTube Video"
                    className="w-full h-full"
                    allowFullScreen
                  />
                ) : (
                  <iframe
                    src={`https://drive.google.com/file/d/${activeMedia.id}/preview`}
                    title="Google Drive Video"
                    className="w-full h-full"
                    allowFullScreen
                  />
                )}
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          {mediaList.length > 1 && (
            <>
              <button
                onClick={prevMedia}
                className="absolute left-6 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/20 hover:bg-white/40 text-white transition-all backdrop-blur-xs cursor-pointer"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={nextMedia}
                className="absolute right-6 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/20 hover:bg-white/40 text-white transition-all backdrop-blur-xs cursor-pointer"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}

          {/* Carousel Thumbnail Dots */}
          {mediaList.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-3 overflow-x-auto py-1">
              {mediaList.map((media, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveMediaIndex(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    activeMediaIndex === idx ? 'w-6 bg-gold-400' : 'w-2 bg-stone-600 hover:bg-stone-500'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content Area (Right side on desktop) */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto max-h-[45vh] md:max-h-[90vh]">
          <div>
            <span className="text-gold-600 font-bold text-xs uppercase tracking-widest bg-gold-50 px-2.5 py-1 rounded-full border border-gold-200 inline-block mb-3">
              {product.category}
            </span>
            <h2 className="font-serif text-2xl md:text-3xl font-extrabold text-stone-900 mb-3">
              {product.title}
            </h2>

            {/* Price section */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl font-extrabold text-stone-950">
                {product.discountedPrice.toFixed(2)} ฿
              </span>
              {hasDiscount && (
                <>
                  <span className="text-stone-400 line-through text-lg">
                    {product.originalPrice.toFixed(2)} ฿
                  </span>
                  <span className="bg-amber-100 text-amber-700 text-xs px-2.5 py-1 rounded-full font-bold">
                    توفير {(product.originalPrice - product.discountedPrice).toFixed(2)} ฿
                  </span>
                </>
              )}
            </div>

            <hr className="border-stone-100 mb-6" />

            {/* Description */}
            <div className="mb-6">
              <h4 className="font-bold text-stone-800 mb-2 text-sm">وصف التحفة الفنية:</h4>
              <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {/* Specifications Details */}
            {product.details && product.details.length > 0 && (
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100 mb-6">
                <h4 className="font-bold text-stone-800 mb-2 text-xs">تفاصيل إضافية:</h4>
                <ul className="space-y-1.5 text-xs text-stone-600">
                  {product.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-gold-500 mt-0.5">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="flex gap-3 pt-4 border-t border-stone-100 mt-6">
            <button
              onClick={() => onAddToCart(product)}
              className={`flex-grow py-3 px-6 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all cursor-pointer ${
                isInCart
                  ? 'bg-stone-950 text-gold-400 border border-stone-900 hover:bg-stone-900'
                  : 'bg-gold-500 hover:bg-gold-600 text-stone-950 shadow-md hover:shadow-lg'
              }`}
            >
              <ShoppingCart size={18} />
              <span>{isInCart ? 'أضف حبة أخرى' : 'أضف إلى السلة'}</span>
            </button>
            <button
              onClick={onClose}
              className="py-3 px-5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 font-medium transition-all cursor-pointer"
            >
              إغلاق
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

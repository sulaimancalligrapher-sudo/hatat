import React from 'react';
import { Eye, ShoppingCart } from 'lucide-react';
import { Product, StoreTexts } from '../types';

interface ProductCardProps {
  product: Product;
  texts?: StoreTexts;
  onViewDetails: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  isInCart: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  texts,
  onViewDetails,
  onAddToCart,
  isInCart
}) => {
  // Check if there is a discount and calculate discount percentage
  const hasDiscount = product.originalPrice > product.discountedPrice;
  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice - product.discountedPrice) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden border border-stone-200 hover:border-gold-300 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full transform hover:-translate-y-1">
      
      {/* Product Image Stage */}
      <div className="relative aspect-square w-full bg-stone-50 overflow-hidden cursor-pointer" onClick={() => onViewDetails(product)}>
        <img
          src={product.fileId.startsWith('1_') ? product.fileId.replace('1_demo_', 'https://images.unsplash.com/') : `https://drive.google.com/thumbnail?id=${product.fileId}&sz=w600`}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            // Fallback image in case of load issues
            e.currentTarget.src = "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=600&auto=format&fit=crop";
          }}
        />

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-3 left-3 bg-amber-600 text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-md animate-fade-in">
            {texts?.discountLabelText || 'خصم'} {discountPercent}%
          </div>
        )}

        {/* Action Overlay */}
        <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(product);
            }}
            className="p-3 bg-white text-stone-900 rounded-full hover:bg-gold-500 hover:text-white shadow-lg transition-all transform translate-y-2 group-hover:translate-y-0"
            title="عرض التفاصيل"
          >
            <Eye size={20} />
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-3.5 md:p-5 flex flex-col flex-grow">
        <h3 
          onClick={() => onViewDetails(product)}
          className="font-serif text-sm md:text-lg font-bold text-stone-900 mb-1 md:mb-2 group-hover:text-gold-600 transition-colors line-clamp-1 cursor-pointer"
        >
          {product.title}
        </h3>
        
        <p 
          onClick={() => onViewDetails(product)}
          className="text-stone-500 text-[11px] md:text-sm mb-2.5 md:mb-4 line-clamp-2 flex-grow cursor-pointer"
        >
          {product.description}
        </p>

        {/* Prices Row */}
        <div className="flex items-baseline gap-1.5 md:gap-2 mb-3 md:mb-4">
          <span className="text-base md:text-xl font-bold text-stone-900">
            {product.discountedPrice.toFixed(0)} ฿
          </span>
          {hasDiscount && (
            <span className="text-[10px] md:text-sm text-stone-400 line-through">
              {product.originalPrice.toFixed(0)} ฿
            </span>
          )}
        </div>

        {/* Footer Add to Cart Button */}
        <button
          onClick={() => onAddToCart(product)}
          className={`w-full py-2 md:py-3 px-2 md:px-4 rounded-xl flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm font-medium transition-all cursor-pointer ${
            isInCart
              ? 'bg-stone-900 text-gold-400 border border-stone-800'
              : 'bg-gold-500 hover:bg-gold-600 text-stone-950 shadow-md hover:shadow-lg'
          }`}
        >
          <ShoppingCart size={15} />
          <span>{isInCart ? 'مضاف' : 'إضافة'}</span>
        </button>
      </div>
    </div>
  );
};

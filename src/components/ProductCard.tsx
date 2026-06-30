import React from 'react';
import { Eye, ShoppingCart, Tag } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  isInCart: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
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
        
        {/* Category Tag */}
        <div className="absolute top-3 right-3 bg-stone-900/80 backdrop-blur-xs text-gold-300 text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-medium border border-gold-500/20">
          <Tag size={10} />
          <span>{product.category}</span>
        </div>

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-3 left-3 bg-amber-600 text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-md">
            خصم {discountPercent}%
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
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="font-serif text-lg font-bold text-stone-900 mb-2 group-hover:text-gold-600 transition-colors line-clamp-1">
          {product.title}
        </h3>
        
        <p className="text-stone-500 text-sm mb-4 line-clamp-2 flex-grow">
          {product.description}
        </p>

        {/* Prices Row */}
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-xl font-bold text-stone-900">
            {product.discountedPrice.toFixed(2)} ฿
          </span>
          {hasDiscount && (
            <span className="text-sm text-stone-400 line-through">
              {product.originalPrice.toFixed(2)} ฿
            </span>
          )}
        </div>

        {/* Footer Add to Cart Button */}
        <button
          onClick={() => onAddToCart(product)}
          className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-medium transition-all cursor-pointer ${
            isInCart
              ? 'bg-stone-900 text-gold-400 border border-stone-800'
              : 'bg-gold-500 hover:bg-gold-600 text-stone-950 shadow-md hover:shadow-lg'
          }`}
        >
          <ShoppingCart size={18} />
          <span>{isInCart ? 'تمت الإضافة (زيادة)' : 'إضافة إلى السلة'}</span>
        </button>
      </div>
    </div>
  );
};

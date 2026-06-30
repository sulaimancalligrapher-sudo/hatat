import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, Tag, CheckCircle2, Ticket } from 'lucide-react';
import { CartItem, PromoCode } from '../types';

interface CartDrawerProps {
  cart: CartItem[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateQuantity: (index: number, change: number) => void;
  onRemoveItem: (index: number) => void;
  promoCodes: PromoCode[];
  onApplyPromo: (code: string) => Promise<{ valid: boolean; discount: number; message: string; eligibleProducts: string }>;
  appliedPromo: { code: string; discount: number; eligibleProducts: string } | null;
  setAppliedPromo: (promo: { code: string; discount: number; eligibleProducts: string } | null) => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  cart,
  isOpen,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  promoCodes,
  onApplyPromo,
  appliedPromo,
  setAppliedPromo,
  onProceedToCheckout
}) => {
  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  if (!isOpen) return null;

  // Calculate prices
  const calculateTotal = () => {
    let subtotal = 0;
    let discountAmount = 0;

    cart.forEach(item => {
      const itemSubtotal = item.discountedPrice * item.quantity;
      subtotal += itemSubtotal;

      // Apply promo discount if eligible
      if (appliedPromo) {
        const isEligible = 
          appliedPromo.eligibleProducts === 'all' || 
          appliedPromo.eligibleProducts === 'ALL' ||
          appliedPromo.eligibleProducts.toLowerCase().includes(item.title.toLowerCase());
        
        if (isEligible) {
          discountAmount += itemSubtotal * appliedPromo.discount;
        }
      }
    });

    return {
      subtotal,
      discountAmount,
      total: subtotal - discountAmount
    };
  };

  const { subtotal, discountAmount, total } = calculateTotal();

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setIsValidating(true);
    setPromoMessage(null);
    try {
      const res = await onApplyPromo(promoInput);
      if (res.valid) {
        setAppliedPromo({
          code: promoInput.toUpperCase(),
          discount: res.discount,
          eligibleProducts: res.eligibleProducts
        });
        setPromoMessage({ text: `تم تطبيق الكود بنجاح! خصم ${Math.round(res.discount * 100)}%`, error: false });
      } else {
        setPromoMessage({ text: res.message, error: true });
        setAppliedPromo(null);
      }
    } catch (err) {
      setPromoMessage({ text: 'حدث خطأ في مراجعة الكود الترويجي', error: true });
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoInput('');
    setPromoMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs" onClick={onClose} />

      <div className="absolute inset-y-0 left-0 max-w-full flex pr-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full rounded-r-3xl border-r border-stone-100">
          
          {/* Header */}
          <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50 rounded-tr-3xl">
            <div className="flex items-center gap-2.5">
              <span className="font-serif text-xl font-black text-stone-900">سلة المشتريات</span>
              <span className="bg-gold-500 text-stone-950 text-xs px-2.5 py-0.5 rounded-full font-bold">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} قطع
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-stone-400 hover:bg-stone-150 hover:text-stone-700 transition-all cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-grow overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-400">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-stone-800 text-base">السلة فارغة حالياً</h3>
                  <p className="text-stone-400 text-xs mt-1">تصفح المتجر وأضف تحفاً فنية فريدة لتزيين منزلك</p>
                </div>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div key={idx} className="flex gap-4 p-3 bg-stone-50 rounded-2xl border border-stone-100 transition-all hover:shadow-sm">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-stone-200 shrink-0">
                    <img
                      src={item.fileId.startsWith('1_') ? item.fileId.replace('1_demo_', 'https://images.unsplash.com/') : `https://drive.google.com/thumbnail?id=${item.fileId}&sz=w120`}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-stone-900 text-sm line-clamp-1">{item.title}</h4>
                      <p className="text-stone-600 font-bold text-xs mt-1">{item.discountedPrice.toFixed(2)} ฿</p>
                    </div>

                    {/* Quantity Controls & Remove */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2.5 bg-white border border-stone-200 rounded-lg py-1 px-2.5 shadow-xs scale-90 -mr-2">
                        <button
                          onClick={() => onUpdateQuantity(idx, -1)}
                          className="text-stone-500 hover:text-stone-800 cursor-pointer p-0.5"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-stone-800 font-bold text-xs">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(idx, 1)}
                          className="text-stone-500 hover:text-stone-800 cursor-pointer p-0.5"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <button
                        onClick={() => onRemoveItem(idx)}
                        className="text-red-400 hover:text-red-600 cursor-pointer p-1 rounded-lg hover:bg-red-50"
                        title="حذف"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout & Summary Bar */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-stone-100 bg-stone-50 space-y-4">
              
              {/* Promo Code Segment */}
              <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-xs">
                {appliedPromo ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 p-2 rounded-lg text-emerald-800 text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      <span>الكود المطبق: <strong>{appliedPromo.code}</strong></span>
                    </div>
                    <button
                      onClick={handleRemovePromo}
                      className="text-stone-500 hover:text-red-600 font-bold text-xs cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-grow">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        placeholder="أدخل كود الخصم (مثل RAMADAN)"
                        className="w-full pl-3 pr-8 py-2 border border-stone-200 rounded-lg text-xs outline-none focus:border-gold-400 bg-stone-50"
                      />
                      <Ticket size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    </div>
                    <button
                      onClick={handleApplyPromo}
                      disabled={isValidating || !promoInput}
                      className="bg-stone-900 hover:bg-stone-800 text-gold-400 text-xs font-semibold px-4 py-2 rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isValidating ? 'تأكيد..' : 'تطبيق'}
                    </button>
                  </div>
                )}
                {promoMessage && (
                  <p className={`text-[11px] mt-2 font-medium ${promoMessage.error ? 'text-red-500' : 'text-emerald-600'}`}>
                    {promoMessage.text}
                  </p>
                )}
              </div>

              {/* Bill Details */}
              <div className="space-y-1.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>المجموع الفرعي:</span>
                  <span className="font-medium text-stone-800">{subtotal.toFixed(2)} ฿</span>
                </div>
                {appliedPromo && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>خصم الكوبون ({appliedPromo.code}):</span>
                    <span>-{discountAmount.toFixed(2)} ฿</span>
                  </div>
                )}
                <hr className="border-stone-200 my-2" />
                <div className="flex justify-between text-stone-950 font-black text-base">
                  <span>الإجمالي الكلي:</span>
                  <span className="text-gold-600">{total.toFixed(2)} ฿</span>
                </div>
              </div>

              {/* Proceed to Checkout Button */}
              <button
                onClick={onProceedToCheckout}
                className="w-full py-3.5 bg-gold-500 hover:bg-gold-600 text-stone-950 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer"
              >
                <span>إكمال عملية الشراء</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

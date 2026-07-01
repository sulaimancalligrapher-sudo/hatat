import React, { useState } from 'react';
import { X, Calendar, User, Phone, Mail, MapPin, Receipt, CheckCircle, Shield, AlertTriangle, Send } from 'lucide-react';
import { CartItem } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  appliedPromo: { code: string; discount: number; eligibleProducts: string } | null;
  onPlaceOrder: (order: {
    name: string;
    address: string;
    phone: string;
    email: string;
    promoCode: string;
  }) => Promise<{ status: string; orderId?: string; message?: string }>;
  clearCart: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  appliedPromo,
  onPlaceOrder,
  clearCart
}) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    lineId: ''
  });

  const [captchaInput, setCaptchaInput] = useState('');
  // Dynamic random simple math captcha (to prevent spam)
  const [num1] = useState(Math.floor(Math.random() * 9) + 1);
  const [num2] = useState(Math.floor(Math.random() * 9) + 1);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Pricing calculations
  let subtotal = 0;
  let discountAmount = 0;

  cart.forEach(item => {
    const itemSubtotal = item.discountedPrice * item.quantity;
    subtotal += itemSubtotal;

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

  const total = subtotal - discountAmount;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Input validations
    if (!formData.name.trim() || formData.name.length < 3) {
      setErrorMsg('يرجى إدخال اسمك الكريم (3 أحرف على الأقل)');
      return;
    }
    if (!formData.address.trim() || formData.address.length < 10) {
      setErrorMsg('يرجى كتابة العنوان بالكامل بشكل تفصيلي للتمكن من شحن الطلب إليك');
      return;
    }
    if (!formData.phone.trim() || !/^\d{8,15}$/.test(formData.phone.trim())) {
      setErrorMsg('يرجى إدخال رقم هاتف صالح (8-15 خانة)');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMsg('يرجى إدخال بريد إلكتروني صحيح لاستقبال الفاتورة عليه');
      return;
    }

    // Anti-spam math test
    if (parseInt(captchaInput) !== (num1 + num2)) {
      setErrorMsg('إجابة التحقق الأمني غير صحيحة، يرجى المحاولة مرة أخرى');
      return;
    }

    setIsSubmitting(true);
    try {
      // Build order payload
      const orderPayload = {
        name: formData.name.trim(),
        address: formData.address.trim() + (formData.lineId.trim() ? ` (LINE ID: ${formData.lineId.trim()})` : ''),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        promoCode: appliedPromo ? appliedPromo.code : ''
      };

      const result = await onPlaceOrder(orderPayload);
      if (result.status === 'success' && result.orderId) {
        setPlacedOrderId(result.orderId);
      } else {
        setErrorMsg(result.message || 'فشل إرسال الطلب، يرجى إعادة المحاولة');
      }
    } catch (err) {
      setErrorMsg('حدث خطأ فني أثناء إرسال طلبك لجوجل شيت، يرجى تكرار المحاولة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckoutSuccessClose = () => {
    clearCart();
    setPlacedOrderId(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-stone-200">
        
        {/* Placed Order Success Receipt Mode */}
        {placedOrderId ? (
          <div className="p-8 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-6 border-4 border-emerald-50 shadow-inner">
              <CheckCircle size={40} className="animate-bounce" />
            </div>
            
            <h2 className="font-serif text-3xl font-black text-stone-900 mb-2">
              تم تسجيل طلبك بنجاح!
            </h2>
            <p className="text-stone-500 text-sm max-w-md mb-6">
              الحمد لله، تم تسجيل طلبك وتوليد الفاتورة الخاصة بك بنجاح. سنرسل إليك نسخة من الفاتورة بصيغة PDF عبر بريدك الإلكتروني قريباً.
            </p>

            {/* Receipt Box */}
            <div className="w-full bg-stone-50 rounded-2xl border border-stone-200 p-6 text-right mb-8 text-xs space-y-3.5">
              <div className="flex justify-between items-center pb-3 border-b border-stone-200 font-bold text-sm text-stone-800">
                <span className="flex items-center gap-1.5"><Receipt size={16} /> رقم الفاتورة / الطلب:</span>
                <span className="font-mono text-gold-600">{placedOrderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">اسم العميل:</span>
                <span className="font-semibold text-stone-900">{formData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">رقم الهاتف للتواصل:</span>
                <span className="font-semibold text-stone-900">{formData.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">العنوان للتسليم:</span>
                <span className="font-semibold text-stone-900">{formData.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">البريد الإلكتروني المعتمد:</span>
                <span className="font-semibold text-stone-900">{formData.email}</span>
              </div>
              {appliedPromo && (
                <div className="flex justify-between">
                  <span className="text-stone-500">الكود الترويجي المطبق:</span>
                  <span className="text-emerald-600 font-bold">{appliedPromo.code}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-stone-800 pt-3 border-t border-stone-200">
                <span>إجمالي المبلغ المدفوع:</span>
                <span className="text-gold-600 font-black text-base">{total.toFixed(2)} ฿</span>
              </div>
            </div>

            <button
              onClick={handleCheckoutSuccessClose}
              className="bg-gold-500 hover:bg-gold-600 text-stone-950 font-bold px-8 py-3.5 rounded-xl cursor-pointer w-full shadow-lg hover:shadow-xl transition-all"
            >
              العودة إلى المتجر
            </button>
          </div>
        ) : (
          /* Normal Form Input Checkout Mode */
          <form onSubmit={handleFormSubmit}>
            
            {/* Header */}
            <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50 rounded-t-3xl">
              <span className="font-serif text-xl font-black text-stone-950">إتمام الشراء والدفع</span>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-stone-400 hover:bg-stone-150 hover:text-stone-700 transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-5 max-h-[75vh] overflow-y-auto">
              
              {/* Alert Message */}
              {errorMsg && (
                <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-semibold">
                  <AlertTriangle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Order Recap */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4">
                <h4 className="font-bold text-stone-800 text-xs mb-3 flex items-center gap-1.5"><Receipt size={14} /> ملخص الطلب الحالي:</h4>
                <div className="space-y-1 text-xs text-stone-600">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{item.title} (× {item.quantity})</span>
                      <span className="font-medium text-stone-800">{ (item.discountedPrice * item.quantity).toFixed(2) } ฿</span>
                    </div>
                  ))}
                  {appliedPromo && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>خصم الكوبون ({appliedPromo.code}):</span>
                      <span>-{discountAmount.toFixed(2)} ฿</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-sm text-stone-800 pt-2 border-t border-stone-200 mt-2">
                    <span>القيمة الكلية للطلب:</span>
                    <span className="text-gold-600 text-base">{total.toFixed(2)} ฿</span>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                
                {/* Name */}
                <div>
                  <label className="block text-stone-700 text-xs font-bold mb-1.5">الاسم الثلاثي المعتمد:</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="يرجى إدخال الاسم كاملاً لاستعماله في الفاتورة"
                      className="w-full pr-10 pl-4 py-2.5 border border-stone-200 rounded-xl outline-none focus:border-gold-400 bg-stone-50 text-xs"
                    />
                    <User size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-stone-700 text-xs font-bold mb-1.5">البريد الإلكتروني المعتمد:</label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="مثال: custom@example.com"
                      className="w-full pr-10 pl-4 py-2.5 border border-stone-200 rounded-xl outline-none focus:border-gold-400 bg-stone-50 text-xs"
                    />
                    <Mail size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  </div>
                </div>

                {/* Phone & LINE ID Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-stone-700 text-xs font-bold mb-1.5">رقم الجوال الفعال:</label>
                    <div className="relative">
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="رقم الهاتف (للاتصال أو واتساب)"
                        className="w-full pr-10 pl-4 py-2.5 border border-stone-200 rounded-xl outline-none focus:border-gold-400 bg-stone-50 text-xs"
                      />
                      <Phone size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-stone-700 text-xs font-bold mb-1.5">معرف تطبيق لاين LINE ID (اختياري):</label>
                    <div className="relative">
                      <input
                        type="text"
                        name="lineId"
                        value={formData.lineId}
                        onChange={handleInputChange}
                        placeholder="لتسهيل تواصل خدمة العملاء معك"
                        className="w-full pr-4 pl-4 py-2.5 border border-stone-200 rounded-xl outline-none focus:border-gold-400 bg-stone-50 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-stone-700 text-xs font-bold mb-1.5">عنوان الشحن والاستلام بالتفصيل:</label>
                  <div className="relative">
                    <textarea
                      name="address"
                      required
                      rows={3}
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="البلد، المدينة، الحي، اسم الشارع، رقم المنزل أو رقم الشقة بالتفصيل لتفادي تأخير الشحن"
                      className="w-full pr-10 pl-4 py-2.5 border border-stone-200 rounded-xl outline-none focus:border-gold-400 bg-stone-50 text-xs leading-relaxed"
                    />
                    <MapPin size={16} className="absolute right-3.5 top-4 text-stone-400" />
                  </div>
                </div>

                {/* Simulated CAPTCHA */}
                <div className="bg-amber-500/5 border border-gold-300/30 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs">
                    <span className="font-semibold block text-stone-800">التحقق الأمني الذاتي ضد الروبوتات:</span>
                    <span className="text-stone-500">يرجى حل المعادلة الحسابية البسيطة: <strong className="text-stone-800 font-mono">{num1} + {num2} = ؟</strong></span>
                  </div>
                  <input
                    type="number"
                    required
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    placeholder="الجواب"
                    className="w-24 px-3 py-2 border border-stone-200 rounded-lg outline-none focus:border-gold-400 text-center font-bold bg-white text-xs"
                  />
                </div>

              </div>
            </div>

            {/* Action Footer */}
            <div className="p-6 bg-stone-50 border-t border-stone-100 flex justify-end gap-3 rounded-b-3xl">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100 font-semibold text-xs cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-gold-500 hover:bg-gold-600 text-stone-950 font-bold rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer text-xs"
              >
                {isSubmitting ? (
                  <>جاري إرسال الطلب...</>
                ) : (
                  <>
                    <Send size={14} />
                    <span>تأكيد وإرسال الطلب الفوري</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};

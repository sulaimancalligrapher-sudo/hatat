import React, { useState } from 'react';
import { Lock, FileText, ShoppingBag, Plus, Sparkles, Check, Database, Send, Mail, AlertCircle, Copy, ExternalLink, Settings, Eye, Users, Code, Shield } from 'lucide-react';
import { Product, Order, PromoCode, Member, StoreSettings, Student } from '../types';
import { getAppsScriptCode } from '../utils/appsScriptCode';

interface AdminPanelProps {
  orders: Order[];
  products: Product[];
  promoCodes: PromoCode[];
  members: Member[];
  students?: Student[];
  settings: StoreSettings;
  isDemoMode: boolean;
  sheetsUrl: string;
  setSheetsUrl: (url: string) => void;
  onUpdateSettings: (newSettings: StoreSettings) => void;
  onAddProduct: (product: Product) => void;
  onAddPromoCode: (promo: PromoCode) => void;
  onReturnToShop?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  orders,
  products,
  promoCodes,
  members,
  students = [],
  settings,
  isDemoMode,
  sheetsUrl,
  setSheetsUrl,
  onUpdateSettings,
  onAddProduct,
  onAddPromoCode,
  onReturnToShop
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [adminTab, setAdminTab] = useState<'orders' | 'products' | 'promo' | 'members' | 'students' | 'settings'>('orders');

  // New product form states
  const [newProduct, setNewProduct] = useState({
    title: '',
    description: '',
    originalPrice: '',
    discountedPrice: '',
    category: 'لوحات جدارية',
    fileId: '',
    extraImages: '',
    details: '',
    youtubeVideoId: ''
  });

  // New promo form states
  const [newPromo, setNewPromo] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed' | 'shipping',
    value: '15', // e.g. 15 for 15% or 50 for 50 SAR
    minSpend: '0',
    expiryDate: '',
    usageLimit: '100',
    categoryType: 'general' as 'general' | 'student' | 'member',
    assignedIdentifier: '',
    eligibleProducts: 'all',
    status: 'active' as 'active' | 'inactive',
    customerUsageLimit: '1'
  });

  // Success notifications for admin actions
  const [adminNotify, setAdminNotify] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'admin123') {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('كلمة المرور غير صحيحة، يرجى كتابة الرمز الصحيح (الافتراضي هو admin123)');
    }
  };

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.title || !newProduct.fileId) {
      alert('يرجى ملء الحقول الأساسية (اسم المنتج ومعرف الصورة الرئيسي)');
      return;
    }

    const parsedProduct: Product = {
      fileId: newProduct.fileId,
      title: newProduct.title,
      description: newProduct.description,
      originalPrice: parseFloat(newProduct.originalPrice) || 0,
      discountedPrice: parseFloat(newProduct.discountedPrice) || parseFloat(newProduct.originalPrice) || 0,
      isOriginalPriceStruck: parseFloat(newProduct.originalPrice) > parseFloat(newProduct.discountedPrice),
      extraImages: newProduct.extraImages ? newProduct.extraImages.split(',').map(s => s.trim()) : [],
      details: newProduct.details ? newProduct.details.split('\n').map(s => s.trim()).filter(Boolean) : [],
      videos: newProduct.youtubeVideoId ? [{ type: 'youtube', id: newProduct.youtubeVideoId }] : [],
      category: newProduct.category
    };

    onAddProduct(parsedProduct);
    setAdminNotify('تمت إضافة المنتج بنجاح إلى القائمة وسيتم رفعه لجوجل شيت عند الاتصال الفعلي!');
    
    // Clear form
    setNewProduct({
      title: '',
      description: '',
      originalPrice: '',
      discountedPrice: '',
      category: 'لوحات جدارية',
      fileId: '',
      extraImages: '',
      details: '',
      youtubeVideoId: ''
    });

    setTimeout(() => setAdminNotify(null), 4000);
  };

  const handleAddPromoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromo.code) return;

    const valNum = parseFloat(newPromo.value) || 0;
    const parsedPromo: PromoCode = {
      code: newPromo.code.toUpperCase().trim(),
      type: newPromo.type,
      value: newPromo.type === 'percentage' ? (valNum / 100) : valNum,
      minSpend: parseFloat(newPromo.minSpend) || 0,
      expiryDate: newPromo.expiryDate || undefined,
      usageLimit: parseInt(newPromo.usageLimit) || undefined,
      usageCount: 0,
      categoryType: newPromo.categoryType,
      assignedIdentifier: newPromo.assignedIdentifier || undefined,
      usedByContacts: [],
      eligibleProducts: newPromo.eligibleProducts,
      status: newPromo.status,
      discount: newPromo.type === 'percentage' ? (valNum / 100) : 0,
      customerUsageLimit: parseInt(newPromo.customerUsageLimit) || undefined
    };

    onAddPromoCode(parsedPromo);
    setAdminNotify('تمت إضافة كود الخصم المطور بنجاح وسيتم حفظه بجوجل شيت عند المزامنة!');
    setTimeout(() => setAdminNotify(null), 4000);
    
    // Clear form
    setNewPromo({
      code: '',
      type: 'percentage',
      value: '15',
      minSpend: '0',
      expiryDate: '',
      usageLimit: '100',
      categoryType: 'general',
      assignedIdentifier: '',
      eligibleProducts: 'all',
      status: 'active',
      customerUsageLimit: '1'
    });
  };

  const triggerCopyAppsScript = () => {
    const appsScriptCode = getAppsScriptCode();
    navigator.clipboard.writeText(appsScriptCode);
    alert('تم نسخ الكود بنجاح! يمكنك الآن لصقه في Google Apps Script.');
  };

  const copyAdminDirectLink = () => {
    const directUrl = `${window.location.origin}${window.location.pathname}?page=admin`;
    navigator.clipboard.writeText(directUrl);
    alert(`تم نسخ رابط الإدارة المباشر والمنفصل:\n${directUrl}\n\nيمكنك حفظه في المفضلة للوصول المباشر للوحة التحكم!`);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-stone-200 text-center">
          <div className="w-16 h-16 bg-stone-900 text-gold-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={28} />
          </div>
          
          <h2 className="font-serif text-2xl font-black text-stone-900 mb-2">تسجيل دخول المشرف</h2>
          <p className="text-stone-500 text-xs mb-6">هذه اللوحة محمية وخاصة بإدارة المتجر فقط لتتبع المبيعات وإدخال البضائع</p>

          {authError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-500 text-xs font-semibold mb-4 text-right">
              {authError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-right">
            <div>
              <label className="block text-stone-700 text-xs font-bold mb-1.5">الرمز السري للإدارة:</label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="أدخل الرمز السري هنا (افتراضي: admin123)"
                className="w-full px-4 py-2.5 border border-stone-200 rounded-xl outline-none focus:border-gold-500 text-center bg-stone-50 text-sm font-semibold"
              />
            </div>
            
            <button
              type="submit"
              className="w-full py-3 bg-stone-950 hover:bg-stone-900 text-gold-400 font-bold rounded-xl transition-all cursor-pointer text-xs"
            >
              فتح لوحة التحكم
            </button>
          </form>

          {/* Separation Notice & Actions */}
          <div className="mt-8 pt-6 border-t border-stone-100 text-xs space-y-3">
            <p className="text-stone-500 text-[11px] font-medium">💡 هذا القسم منفصل تماماً عن الواجهة العامة للعملاء</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyAdminDirectLink}
                className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 text-[11px]"
              >
                <Copy size={13} />
                <span>نسخ رابط الإدارة</span>
              </button>
              {onReturnToShop && (
                <button
                  type="button"
                  onClick={onReturnToShop}
                  className="flex-1 py-2 bg-gold-500/10 hover:bg-gold-500/20 text-gold-700 border border-gold-400/30 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 text-[11px]"
                >
                  <ExternalLink size={13} />
                  <span>العودة للمتجر العام</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Top Separation Notice Banner */}
      <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
        <div className="flex items-center gap-2 text-stone-800 font-bold">
          <Shield className="text-amber-600" size={18} />
          <span>أنت الآن في لوحة الإدارة المنفصلة الخاص بالمدير (`?page=admin`)</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Sheets Status Badge */}
          {sheetsUrl ? (
            <span className="bg-emerald-500/20 text-emerald-800 border border-emerald-500/40 text-[11px] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
              <Database size={13} className="text-emerald-700" />
              <span>متصل بـ Google Sheets</span>
            </span>
          ) : (
            <span className="bg-stone-200 text-stone-700 border border-stone-300 text-[11px] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
              <Database size={13} className="text-stone-500" />
              <span>غير متصل بـ Sheets</span>
            </span>
          )}

          <button
            onClick={copyAdminDirectLink}
            className="px-3 py-1.5 bg-stone-900 text-gold-300 hover:bg-stone-800 rounded-lg font-bold transition-all flex items-center gap-1"
          >
            <Copy size={12} />
            <span>نسخ رابط الإدارة المباشر</span>
          </button>
          {onReturnToShop && (
            <button
              onClick={onReturnToShop}
              className="px-3 py-1.5 bg-amber-600 text-white hover:bg-amber-700 rounded-lg font-bold transition-all flex items-center gap-1"
            >
              <ExternalLink size={12} />
              <span>معاينة المتجر العام 🛒</span>
            </button>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-stone-900 p-6 rounded-3xl text-stone-100 border border-gold-600/20 shadow-md">
        <div>
          <div className="flex items-center gap-2 text-gold-400 text-xs font-bold mb-1">
            <Settings className="animate-spin" size={14} />
            <span>نظام التحكم المتكامل للمتجر</span>
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-black text-white">لوحة الإدارة والتحكم الفوقية</h2>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => setAdminTab('orders')}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${
              adminTab === 'orders' ? 'bg-gold-500 text-stone-950' : 'bg-stone-850 hover:bg-stone-800 text-stone-300'
            }`}
          >
            الطلبات الواردة ({orders.length})
          </button>
          <button
            onClick={() => setAdminTab('products')}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${
              adminTab === 'products' ? 'bg-gold-500 text-stone-950' : 'bg-stone-850 hover:bg-stone-800 text-stone-300'
            }`}
          >
            إضافة منتج جديد
          </button>
          <button
            onClick={() => setAdminTab('promo')}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${
              adminTab === 'promo' ? 'bg-gold-500 text-stone-950' : 'bg-stone-850 hover:bg-stone-800 text-stone-300'
            }`}
          >
            أكواد الخصم
          </button>
          <button
            onClick={() => setAdminTab('members')}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${
              adminTab === 'members' ? 'bg-gold-500 text-stone-950' : 'bg-stone-850 hover:bg-stone-800 text-stone-300'
            }`}
          >
            قائمة المشتركين
          </button>
          <button
            onClick={() => setAdminTab('students')}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${
              adminTab === 'students' ? 'bg-gold-500 text-stone-950' : 'bg-stone-850 hover:bg-stone-800 text-stone-300'
            }`}
          >
            سجل الطلاب ({students.length})
          </button>
          <button
            onClick={() => setAdminTab('settings')}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${
              adminTab === 'settings' ? 'bg-gold-500 text-stone-950' : 'bg-stone-850 hover:bg-stone-800 text-stone-300'
            }`}
          >
            إعدادات الربط بالشيت
          </button>
        </div>
      </div>

      {/* Dynamic Success notifications */}
      {adminNotify && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-sm animate-fade-in">
          <Check size={18} />
          <span>{adminNotify}</span>
        </div>
      )}

      {/* TAB CONTENT: Orders */}
      {adminTab === 'orders' && (
        <div className="bg-white rounded-3xl shadow-md border border-stone-150 overflow-hidden">
          <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
            <span className="font-serif text-lg font-bold text-stone-900">سجل طلبات الشراء ({orders.length} طلب)</span>
            <span className="text-xs text-stone-500">محدث تلقائياً من جوجل شيت</span>
          </div>

          <div className="overflow-x-auto">
            {orders.length === 0 ? (
              <div className="p-12 text-center text-stone-400">لا توجد أي طلبات شراء مسجلة حتى الآن.</div>
            ) : (
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
                    <th className="p-4">رقم الطلب</th>
                    <th className="p-4">تاريخ ووقت الإرسال</th>
                    <th className="p-4">العميل</th>
                    <th className="p-4">المنتجات والكميات</th>
                    <th className="p-4">المبلغ الكلي</th>
                    <th className="p-4">التواصل والـ LINE</th>
                    <th className="p-4">كود الخصم</th>
                    <th className="p-4">رابط الفاتورة PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-150">
                  {orders.map((order, idx) => (
                    <tr key={idx} className="hover:bg-stone-50/50">
                      <td className="p-4 font-mono font-bold text-stone-800">{order.orderId}</td>
                      <td className="p-4 text-stone-500">{order.timestamp}</td>
                      <td className="p-4">
                        <div className="font-bold text-stone-900">{order.name}</div>
                        <div className="text-[10px] text-stone-400 max-w-xs truncate">{order.address}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-stone-800">{order.products}</div>
                        <div className="text-[10px] text-stone-500">الكمية المشتراة: {order.quantities}</div>
                      </td>
                      <td className="p-4 font-bold text-gold-600">{order.totalAmount.toFixed(2)} ฿</td>
                      <td className="p-4">
                        <div className="font-semibold">{order.phone}</div>
                        <div className="text-[10px] text-stone-400">{order.email}</div>
                      </td>
                      <td className="p-4">
                        {order.promoCode ? (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded-full font-bold">
                            {order.promoCode}
                          </span>
                        ) : (
                          <span className="text-stone-400">لا يوجد</span>
                        )}
                      </td>
                      <td className="p-4">
                        <a
                          href={order.pdfLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-stone-600 hover:text-gold-500 flex items-center gap-1 font-bold"
                        >
                          <FileText size={14} />
                          <span>تحميل الفاتورة</span>
                          <ExternalLink size={10} />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Add Product Form */}
      {adminTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Form container */}
          <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl shadow-md border border-stone-150">
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-6 pb-2 border-b border-stone-100">
              استمارة إدخال بضائع جديدة للمستودع
            </h3>

            <form onSubmit={handleAddProductSubmit} className="space-y-4 text-right">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-700 text-xs font-bold mb-1">اسم اللوحة / المنتج المعروض:</label>
                  <input
                    type="text"
                    required
                    value={newProduct.title}
                    onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                    placeholder="مثال: لوحة سورة الإخلاص بخط الثلث"
                    className="w-full px-4 py-2 border border-stone-200 rounded-xl outline-none focus:border-gold-500 bg-stone-50 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 text-xs font-bold mb-1">الفئة أو القسم:</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-xl outline-none focus:border-gold-500 bg-stone-50 text-xs"
                  >
                    {settings.keywords.map((k, idx) => (
                      <option key={idx} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-700 text-xs font-bold mb-1">الوصف التسويقي والتفصيلي للتحفة الفنية:</label>
                <textarea
                  rows={4}
                  required
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="اكتب نبذة عن تاريخ المخطوطة، ونوع الورق المستعمل، ونوع الأحبار المستخدمة لجذب المهتمين..."
                  className="w-full px-4 py-2 border border-stone-200 rounded-xl outline-none focus:border-gold-500 bg-stone-50 text-xs leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-700 text-xs font-bold mb-1">السعر الأصلي الأساسي (฿):</label>
                  <input
                    type="number"
                    required
                    value={newProduct.originalPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, originalPrice: e.target.value })}
                    placeholder="السعر الأساسي بدون تخفيض"
                    className="w-full px-4 py-2 border border-stone-200 rounded-xl outline-none focus:border-gold-500 bg-stone-50 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 text-xs font-bold mb-1">السعر المخفض الترويجي (฿ - اختياري):</label>
                  <input
                    type="number"
                    value={newProduct.discountedPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, discountedPrice: e.target.value })}
                    placeholder="اتركه فارغاً إن لم يكن عليه تخفيض"
                    className="w-full px-4 py-2 border border-stone-200 rounded-xl outline-none focus:border-gold-500 bg-stone-50 text-xs"
                  />
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-gold-300/20 text-xs space-y-3">
                <span className="font-bold text-amber-800 block">⚠️ تنبيه إدخال روابط قوقل درايف للوسائط:</span>
                <p className="text-stone-600 text-[11px] leading-relaxed">
                  يجب نسخ <strong>معرف الملف (File ID)</strong> الحقيقي فقط من قوقل درايف، وليس الرابط كاملاً لتعمل الصورة والسلايدر بشكل صحيح.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-stone-700 font-semibold mb-1 text-[11px]">معرف الصورة الرئيسية من Drive:</label>
                    <input
                      type="text"
                      required
                      value={newProduct.fileId}
                      onChange={(e) => setNewProduct({ ...newProduct, fileId: e.target.value })}
                      placeholder="مثال: 1KqekCvdx4S_0hhHqG01aGD..."
                      className="w-full px-3 py-1.5 border border-stone-200 rounded-lg outline-none focus:border-gold-500 bg-white font-mono text-[10px]"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-700 font-semibold mb-1 text-[11px]">معرفات الصور الإضافية (مفصولة بفواصل):</label>
                    <input
                      type="text"
                      value={newProduct.extraImages}
                      onChange={(e) => setNewProduct({ ...newProduct, extraImages: e.target.value })}
                      placeholder="مثال: id1, id2, id3"
                      className="w-full px-3 py-1.5 border border-stone-200 rounded-lg outline-none focus:border-gold-500 bg-white font-mono text-[10px]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-700 text-xs font-bold mb-1">المميزات والخصائص (ميزة في كل سطر):</label>
                  <textarea
                    rows={3}
                    value={newProduct.details}
                    onChange={(e) => setNewProduct({ ...newProduct, details: e.target.value })}
                    placeholder="الأبعاد: 50x70 سم&#10;نوع الورق: مقهر هندي&#10;الإطار: بدون إطار"
                    className="w-full px-4 py-2 border border-stone-200 rounded-xl outline-none focus:border-gold-500 bg-stone-50 text-xs leading-relaxed"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 text-xs font-bold mb-1">معرف فيديو يوتيوب YouTube Video ID (اختياري):</label>
                  <input
                    type="text"
                    value={newProduct.youtubeVideoId}
                    onChange={(e) => setNewProduct({ ...newProduct, youtubeVideoId: e.target.value })}
                    placeholder="مثال: ScMzIvxBSi4 (المعرف فقط)"
                    className="w-full px-4 py-2 border border-stone-200 rounded-xl outline-none focus:border-gold-500 bg-stone-50 text-xs font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gold-500 hover:bg-gold-600 text-stone-950 font-bold rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer text-xs"
              >
                حفظ وإضافة التحفة المعروضة لقاعدة البيانات
              </button>
            </form>
          </div>

          {/* Quick Preview active catalogue */}
          <div className="bg-stone-50 p-6 rounded-3xl border border-stone-150 h-fit space-y-4">
            <h4 className="font-serif text-base font-bold text-stone-900">البضائع الحالية المستدعاة ({products.length})</h4>
            <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
              {products.map((item, idx) => (
                <div key={idx} className="flex gap-3 bg-white p-2.5 rounded-xl border border-stone-150 shadow-xs">
                  <div className="w-12 h-12 bg-stone-100 rounded-lg overflow-hidden shrink-0">
                    <img
                      src={item.fileId.startsWith('1_') ? item.fileId.replace('1_demo_', 'https://images.unsplash.com/') : `https://drive.google.com/thumbnail?id=${item.fileId}&sz=100`}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h5 className="font-bold text-stone-900 text-xs line-clamp-1">{item.title}</h5>
                    <span className="text-[10px] text-stone-500 block">{item.category}</span>
                    <span className="text-xs font-bold text-gold-600 mt-1 block">{item.discountedPrice.toFixed(2)} ฿</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT: Promo Codes */}
      {adminTab === 'promo' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Create Promo Code form */}
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-md border border-stone-150">
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-6 pb-2 border-b border-stone-100">
              توليد كود خصم ترويجي جديد
            </h3>
            
            <form onSubmit={handleAddPromoSubmit} className="space-y-4 text-right">
              <div>
                <label className="block text-stone-700 text-xs font-bold mb-1.5">رمز الكوبون (رمز بالإنجليزية كابيتال):</label>
                <input
                  type="text"
                  required
                  value={newPromo.code}
                  onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value })}
                  placeholder="مثال: RAMADAN20"
                  className="w-full px-4 py-2 border border-stone-200 rounded-xl outline-none focus:border-gold-500 bg-stone-50 text-xs uppercase font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-stone-700 text-xs font-bold mb-1.5">نوع الكوبون / العرض:</label>
                <select
                  value={newPromo.type}
                  onChange={(e) => {
                    const selected = e.target.value as any;
                    setNewPromo({ 
                      ...newPromo, 
                      type: selected,
                      value: selected === 'shipping' ? '0' : selected === 'percentage' ? '15' : '50'
                    });
                  }}
                  className="w-full px-4 py-2 border border-stone-200 rounded-xl outline-none focus:border-gold-500 bg-stone-50 text-xs"
                >
                  <option value="percentage">نسبة مئوية (%)</option>
                  <option value="fixed">مبلغ خصم ثابت (฿)</option>
                  <option value="shipping">شحن مجاني كامل</option>
                </select>
              </div>

              {newPromo.type !== 'shipping' && (
                <div>
                  <label className="block text-stone-700 text-xs font-bold mb-1.5">
                    {newPromo.type === 'percentage' ? 'نسبة الخصم المئوية (%):' : 'قيمة الخصم الثابتة (฿):'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newPromo.value}
                    onChange={(e) => setNewPromo({ ...newPromo, value: e.target.value })}
                    placeholder={newPromo.type === 'percentage' ? "مثال: 15" : "مثال: 50"}
                    className="w-full px-4 py-2 border border-stone-200 rounded-xl outline-none focus:border-gold-500 bg-stone-50 text-xs font-semibold"
                  />
                </div>
              )}

              <div>
                <label className="block text-stone-700 text-xs font-bold mb-1.5">الحد الأدنى للشراء لتفعيل الخصم (฿):</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newPromo.minSpend}
                  onChange={(e) => setNewPromo({ ...newPromo, minSpend: e.target.value })}
                  placeholder="مثال: 300 (أو 0 لعدم وجود حد أدنى)"
                  className="w-full px-4 py-2 border border-stone-200 rounded-xl outline-none focus:border-gold-500 bg-stone-50 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-stone-700 text-xs font-bold mb-1.5">تاريخ انتهاء الكود (اختياري):</label>
                <input
                  type="date"
                  value={newPromo.expiryDate}
                  onChange={(e) => setNewPromo({ ...newPromo, expiryDate: e.target.value })}
                  className="w-full px-4 py-2 border border-stone-200 rounded-xl outline-none focus:border-gold-500 bg-stone-50 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-stone-700 text-xs font-bold mb-1.5">الحد الكلي لمرات استخدام الكوبون:</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newPromo.usageLimit}
                  onChange={(e) => setNewPromo({ ...newPromo, usageLimit: e.target.value })}
                  placeholder="مثال: 100"
                  className="w-full px-4 py-2 border border-stone-200 rounded-xl outline-none focus:border-gold-500 bg-stone-50 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-stone-700 text-xs font-bold mb-1.5">الحد الأقصى لاستخدام العميل الواحد (مثال: 1 للخصم لمرة واحدة):</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newPromo.customerUsageLimit}
                  onChange={(e) => setNewPromo({ ...newPromo, customerUsageLimit: e.target.value })}
                  placeholder="مثال: 1"
                  className="w-full px-4 py-2 border border-stone-200 rounded-xl outline-none focus:border-gold-500 bg-stone-50 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-stone-700 text-xs font-bold mb-1.5">الفئة المستهدفة بالكوبون:</label>
                <select
                  value={newPromo.categoryType}
                  onChange={(e) => setNewPromo({ ...newPromo, categoryType: e.target.value as any })}
                  className="w-full px-4 py-2 border border-stone-200 rounded-xl outline-none focus:border-gold-500 bg-stone-50 text-xs"
                >
                  <option value="general">عام (لجميع العملاء)</option>
                  <option value="student">للطلاب فقط (يتطلب رقم طالب معتمد) 🎓</option>
                  <option value="member">للأعضاء المشتركين فقط (العضويات المسجلة) 💎</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-700 text-xs font-bold mb-1.5">المنتجات المؤهلة للخصم:</label>
                <select
                  value={newPromo.eligibleProducts}
                  onChange={(e) => setNewPromo({ ...newPromo, eligibleProducts: e.target.value })}
                  className="w-full px-4 py-2 border border-stone-200 rounded-xl outline-none focus:border-gold-500 bg-stone-50 text-xs"
                >
                  <option value="all">كل المنتجات بالمتجر بلا استثناء</option>
                  {products.map((p, idx) => (
                    <option key={idx} value={p.title}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-700 text-xs font-bold mb-1.5">حالة الكود عند التفعيل:</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-stone-700 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={newPromo.status === 'active'}
                      onChange={() => setNewPromo({ ...newPromo, status: 'active' })}
                    />
                    <span>نشط فوري</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-stone-700 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={newPromo.status === 'inactive'}
                      onChange={() => setNewPromo({ ...newPromo, status: 'inactive' })}
                    />
                    <span>غير نشط مؤقتاً</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-stone-950 hover:bg-stone-900 text-gold-400 font-bold rounded-xl transition-all cursor-pointer text-xs"
              >
                تنشيط وتصدير كوبون الخصم
              </button>
            </form>
          </div>

          {/* Promo Code list */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-md border border-stone-150 overflow-hidden">
            <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
              <span className="font-serif text-lg font-bold text-stone-900">الكوبونات النشطة حالياً</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
                    <th className="p-4">الكود المالي</th>
                    <th className="p-4">نوع وقيمة الخصم</th>
                    <th className="p-4">الحد الأدنى للشراء</th>
                    <th className="p-4">الفئة المستهدفة</th>
                    <th className="p-4">الاستخدام الحالي / الأقصى</th>
                    <th className="p-4">تاريخ الانتهاء</th>
                    <th className="p-4">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-150">
                  {promoCodes.map((promo, idx) => {
                    const discountVal = promo.value !== undefined ? promo.value : promo.discount;
                    return (
                      <tr key={idx} className="hover:bg-stone-50/50">
                        <td className="p-4 font-mono font-bold text-stone-900 tracking-wider">{promo.code}</td>
                        <td className="p-4 font-semibold text-emerald-600">
                          {promo.type === 'fixed' ? (
                            <span>خصم ثابت {discountVal} ฿</span>
                          ) : promo.type === 'shipping' ? (
                            <span>شحن مجاني 🚚</span>
                          ) : (
                            <span>خصم {Math.round(discountVal * 100)}%</span>
                          )}
                        </td>
                        <td className="p-4 font-bold text-stone-700">{promo.minSpend || 0} ฿</td>
                        <td className="p-4 text-stone-700 font-medium">
                          {promo.categoryType === 'student' ? (
                            <span className="text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">🎓 طلابي</span>
                          ) : promo.categoryType === 'member' ? (
                            <span className="text-gold-700 bg-amber-50 px-2 py-1 rounded-md border border-gold-100">💎 أعضاء</span>
                          ) : (
                            <span className="text-stone-500">🌍 عام للكل</span>
                          )}
                        </td>
                        <td className="p-4 font-mono text-stone-600">
                          {promo.usageCount || 0} / {promo.usageLimit !== undefined ? promo.usageLimit : '∞'}
                        </td>
                        <td className="p-4 font-mono text-stone-500">
                          {promo.expiryDate ? promo.expiryDate : 'لا ينتهي'}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            promo.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                          }`}>
                            {promo.status === 'active' ? 'نشط ومفعل' : 'موقوف'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT: Members */}
      {adminTab === 'members' && (
        <div className="bg-white rounded-3xl shadow-md border border-stone-150 overflow-hidden">
          <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
            <span className="font-serif text-lg font-bold text-stone-900">سجل المشتركين والأعضاء المسجلين ({members.length} عضو)</span>
            <span className="text-xs text-stone-400">خاصة بنادي النخبة ومخزنة في قوقل شيت</span>
          </div>

          <div className="overflow-x-auto">
            {members.length === 0 ? (
              <div className="p-12 text-center text-stone-400">لا يوجد أي أعضاء مسجلين في نادي العضوية حتى الآن.</div>
            ) : (
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
                    <th className="p-4">اسم العضو الكريم</th>
                    <th className="p-4">البريد الإلكتروني للاتصال</th>
                    <th className="p-4">رقم الهاتف</th>
                    <th className="p-4">تاريخ التسجيل بالبوابة</th>
                    <th className="p-4">الكوبون الممنوح</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-150">
                  {members.map((member, idx) => (
                    <tr key={idx} className="hover:bg-stone-50/50">
                      <td className="p-4 font-bold text-stone-900">{member.name}</td>
                      <td className="p-4 text-stone-600">{member.email}</td>
                      <td className="p-4 font-mono text-stone-700">{member.phone}</td>
                      <td className="p-4 text-stone-500">{member.registrationDate}</td>
                      <td className="p-4">
                        <span className="bg-amber-50 text-gold-700 border border-gold-200 px-3 py-1 rounded-lg font-mono font-bold">
                          {member.discountCode || 'WELCOME10'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Students */}
      {adminTab === 'students' && (
        <div className="bg-white rounded-3xl shadow-md border border-stone-150 overflow-hidden">
          <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
            <div>
              <span className="font-serif text-lg font-bold text-stone-900 block">سجل الطلاب والدارسين المعتمدين ({students.length} طالب)</span>
              <span className="text-[10px] text-stone-500 mt-1 block">الطلاب المسجلون بقاعدة بيانات جوجل شيت المؤهلين للحصول على كود الطلاب الأكاديمي</span>
            </div>
            <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-xl font-bold flex items-center gap-1">
              🎓 طلاب مسجلون
            </span>
          </div>

          <div className="overflow-x-auto">
            {students.length === 0 ? (
              <div className="p-12 text-center text-stone-400">لا يوجد أي طلاب مسجلين في ورقة Students بقوقل شيت حتى الآن.</div>
            ) : (
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
                    <th className="p-4">الرقم الطلابي الأكاديمي</th>
                    <th className="p-4">اسم الطالب كاملاً</th>
                    <th className="p-4">الكلية / المدرسة</th>
                    <th className="p-4">الحد الأقصى للمشتريات</th>
                    <th className="p-4">حالة الحساب</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-150">
                  {students.map((student, idx) => (
                    <tr key={idx} className="hover:bg-stone-50/50">
                      <td className="p-4 font-mono font-bold text-gold-600 tracking-wider">{student.studentId}</td>
                      <td className="p-4 font-bold text-stone-900">{student.name}</td>
                      <td className="p-4 text-stone-500">{student.department || 'عام'}</td>
                      <td className="p-4 font-mono font-semibold text-stone-700">
                        {student.maxUsages !== undefined ? `${student.maxUsages} مرات` : 'غير محدود'}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          student.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                        }`}>
                          {student.status === 'active' ? 'أكاديمي نشط' : 'موقف مؤقتاً'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Sheets Settings & Integration Guide */}
      {adminTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-md border border-stone-150 space-y-6 text-right">
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-1.5 mb-2">
                <Database size={20} className="text-gold-500" />
                <span>ربط الموقع بجدول بيانات Google Sheets</span>
              </h3>
              <p className="text-stone-500 text-xs">
                لقد بنينا هذا الموقع ليعمل بكفاءة مطلقة مع Google Sheets عبر Google Apps Script. أدخل رابط التطبيق البرمجي الخاص بك أدناه لتجاوز وضع المعاينة والذهاب للبث المباشر.
              </p>
            </div>

            {/* Input field */}
            <div className="space-y-2 max-w-2xl">
              <label className="block text-stone-800 text-xs font-bold">رابط نشر الويب (Google Apps Script Web App URL):</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="url"
                  value={sheetsUrl}
                  onChange={(e) => setSheetsUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-grow px-4 py-2.5 border border-stone-200 rounded-xl outline-none focus:border-gold-500 bg-stone-50 text-xs font-mono"
                />
                <button
                  onClick={() => alert('تم حفظ الرابط بنجاح! سيحاول الموقع الآن جلب بضائعك وإعداداتك مباشرة من قوقل شيت.')}
                  className="bg-stone-950 hover:bg-stone-900 text-gold-400 font-bold px-6 py-2.5 rounded-xl transition-all cursor-pointer text-xs"
                >
                  حفظ وربط فوري
                </button>
              </div>
            </div>

            {/* Steps & Structural Guide */}
            <hr className="border-stone-150 my-6" />

            <div className="space-y-4">
              <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                <Sparkles size={16} className="text-gold-500" />
                <span>طريقة وخطوات ربط قوقل شيت بالمتجر بالتفصيل:</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-stone-600 leading-relaxed">
                
                {/* Steps left */}
                <div className="space-y-3.5 bg-stone-50 p-5 rounded-2xl border border-stone-200">
                  <span className="font-bold text-stone-900 block border-b border-stone-200 pb-1">1. إعداد جدول قوقل شيت:</span>
                  <p>
                    قم بإنشاء جدول بيانات جديد في حسابك على Google Drive، وقم بتسمية الأوراق (Tabs) التالية بالأسماء الإنجليزية حرفياً:
                  </p>
                  <ul className="list-disc pr-4 space-y-1 bg-white p-3 rounded-lg border border-stone-200 font-mono text-[11px] text-stone-700">
                    <li><strong>Images</strong> (تضم بيانات المنتجات)</li>
                    <li><strong>Settings</strong> (تضم إعدادات تلجرام، والإيميل، ومعلومات الصفحة)</li>
                    <li><strong>PromoCodes</strong> (تضم كوبونات الخصم)</li>
                    <li><strong>Orders</strong> (تخزين فواتير المشتريات)</li>
                    <li><strong>Members</strong> (تسجيل المشتركين بنادي العضوية)</li>
                    <li><strong>Profile</strong> (شعار وعنوان المتجر)</li>
                  </ul>
                </div>

                {/* Steps right */}
                <div className="space-y-3.5 bg-stone-50 p-5 rounded-2xl border border-stone-200">
                  <span className="font-bold text-stone-900 block border-b border-stone-200 pb-1">2. تثبيت كود الـ Apps Script:</span>
                  <p>
                    أدخل إلى شيت البيانات الخاص بك ثم اذهب إلى <strong>Extensions &gt; Apps Script</strong>.
                  </p>
                  <p>
                    احذف أي كود موجود بالداخل، ثم الصق كود الـ Apps Script المطور المرفق بالأسفل، واضغط على <strong>Save</strong>.
                  </p>
                  <button
                    onClick={triggerCopyAppsScript}
                    className="w-full py-2.5 bg-gold-500 hover:bg-gold-600 text-stone-950 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer text-xs"
                  >
                    <Copy size={14} />
                    <span>نسخ كود Apps Script المطور كاملاً</span>
                  </button>
                </div>

              </div>

              {/* Display Full Backend Code directly in UI */}
              <div className="mt-5 bg-stone-900 p-5 rounded-2xl border border-stone-800 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-stone-800 pb-3">
                  <div>
                    <span className="font-bold text-gold-400 text-xs block flex items-center gap-1.5">
                      <Code size={14} />
                      كود Google Apps Script المطور كاملاً (جاهز للنسخ والتنسيق):
                    </span>
                    <span className="text-[11px] text-stone-400">يتضمن نظام التوليد المباشر للفواتير PDF، ومعالجة المشتريات والخصومات وإشعارات التلجرام والبريد</span>
                  </div>
                  <button
                    onClick={triggerCopyAppsScript}
                    className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-stone-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all shrink-0"
                  >
                    <Copy size={14} />
                    <span>نسخ الكود كاملاً</span>
                  </button>
                </div>
                <p className="text-[11px] text-stone-400">
                  يمكنك تحديد الكود أدناه ونسخه يدوياً أو النقر على زر النسخ أعلاه مباشرة:
                </p>
                <textarea
                  readOnly
                  rows={14}
                  value={getAppsScriptCode()}
                  className="w-full bg-stone-950 text-emerald-400 font-mono text-[11px] p-4 rounded-xl border border-stone-800 outline-none resize-y dir-ltr text-left leading-relaxed select-all"
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                />
              </div>

              {/* Deployment info */}
              <div className="p-4 bg-stone-550/10 border border-stone-200 rounded-2xl text-xs space-y-2 bg-stone-50 mt-4">
                <span className="font-bold text-stone-900 block">3. نشر التطبيق كـ Web App:</span>
                <p className="text-stone-600 leading-relaxed text-[11px]">
                  في صفحة الـ Apps Script، اضغط على زر <strong>Deploy &gt; New deployment</strong>. <br />
                  اختر نوع النشر <strong>Web app</strong>، واضبط الخيارات التالية:
                </p>
                <ul className="list-decimal pr-5 text-[11px] text-stone-600 space-y-1 font-medium">
                  <li><strong>Execute as:</strong> Me (بريدك الإلكتروني)</li>
                  <li><strong>Who has access:</strong> Anyone (للسماح للواجهة بالتواصل مع الشيت)</li>
                </ul>
                <p className="text-[11px] text-stone-500">
                  اضغط على <strong>Deploy</strong>، وامنح الصلاحيات المطلوبة، ثم قم بنسخ الرابط المعطى ولصقه في مستطيل الربط بأعلى هذه الصفحة.
                </p>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

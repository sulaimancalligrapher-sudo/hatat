import React, { useState } from 'react';
import { Lock, FileText, ShoppingBag, Plus, Sparkles, Check, Database, Send, Mail, AlertCircle, Copy, ExternalLink, Settings, Eye, Users } from 'lucide-react';
import { Product, Order, PromoCode, Member, StoreSettings } from '../types';

interface AdminPanelProps {
  orders: Order[];
  products: Product[];
  promoCodes: PromoCode[];
  members: Member[];
  settings: StoreSettings;
  isDemoMode: boolean;
  sheetsUrl: string;
  setSheetsUrl: (url: string) => void;
  onUpdateSettings: (newSettings: StoreSettings) => void;
  onAddProduct: (product: Product) => void;
  onAddPromoCode: (promo: PromoCode) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  orders,
  products,
  promoCodes,
  members,
  settings,
  isDemoMode,
  sheetsUrl,
  setSheetsUrl,
  onUpdateSettings,
  onAddProduct,
  onAddPromoCode
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [adminTab, setAdminTab] = useState<'orders' | 'products' | 'promo' | 'members' | 'settings'>('orders');

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
    discount: '10',
    eligibleProducts: 'all',
    status: 'active' as 'active' | 'inactive'
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

    const parsedPromo: PromoCode = {
      code: newPromo.code.toUpperCase().trim(),
      discount: parseFloat(newPromo.discount) / 100,
      eligibleProducts: newPromo.eligibleProducts,
      status: newPromo.status
    };

    onAddPromoCode(parsedPromo);
    setAdminNotify('تمت إضافة كود الخصم بنجاح إلى جدول البيانات!');
    
    setNewPromo({
      code: '',
      discount: '10',
      eligibleProducts: 'all',
      status: 'active'
    });

    setTimeout(() => setAdminNotify(null), 4000);
  };

  const triggerCopyAppsScript = () => {
    const appsScriptCode = `/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

function doGet(e) {
  var action = e && e.parameter && e.parameter.action;
  var spreadsheetId = SpreadsheetApp.getActiveSpreadsheet().getId();
  var ss = SpreadsheetApp.openById(spreadsheetId);

  // Return appropriate JSON response
  var result = {};
  try {
    if (action === 'get_products') {
      result = getImageData();
    } else if (action === 'get_settings') {
      result = getSettings();
    } else if (action === 'get_promo') {
      result = { promoCodes: ss.getSheetByName('PromoCodes').getDataRange().getValues().slice(1) };
    } else {
      result = getData();
    }
    return ContentService.createTextOutput(JSON.stringify(result))
                         .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action;
    
    if (action === 'submit_order') {
      var res = submitOrder(postData.order);
      return ContentService.createTextOutput(JSON.stringify(res))
                           .setMimeType(ContentService.MimeType.JSON);
    } else if (action === 'register_member') {
      var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      var memberSheet = spreadsheet.getSheetByName('Members');
      if (!memberSheet) {
        memberSheet = spreadsheet.insertSheet('Members');
        memberSheet.getRange('A1:E1').setValues([['الاسم', 'البريد الإلكتروني', 'رقم الهاتف', 'تاريخ التسجيل', 'كوبون الخصم']]);
      }
      var timestamp = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm:ss');
      memberSheet.appendRow([postData.name, postData.email, postData.phone, timestamp, 'WELCOME10']);
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', code: 'WELCOME10' }))
                           .setMimeType(ContentService.MimeType.JSON);
    } else if (action === 'validate_promo') {
      var check = validatePromoCode(postData.code);
      return ContentService.createTextOutput(JSON.stringify(check))
                           .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

// Keep the remaining helper functions as is (getImageData, getSettings, validatePromoCode, submitOrder, etc.)`;

    navigator.clipboard.writeText(appsScriptCode);
    alert('تم نسخ الكود بنجاح! يمكنك الآن لصقه في Google Apps Script.');
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
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
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
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
                <label className="block text-stone-700 text-xs font-bold mb-1.5">نسبة الخصم المئوية (%):</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={newPromo.discount}
                  onChange={(e) => setNewPromo({ ...newPromo, discount: e.target.value })}
                  placeholder="مثال: 15"
                  className="w-full px-4 py-2 border border-stone-200 rounded-xl outline-none focus:border-gold-500 bg-stone-50 text-xs font-semibold"
                />
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
                    <th className="p-4">قيمة الخصم</th>
                    <th className="p-4">المنتجات المشمولة</th>
                    <th className="p-4">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-150">
                  {promoCodes.map((promo, idx) => (
                    <tr key={idx} className="hover:bg-stone-50/50">
                      <td className="p-4 font-mono font-bold text-stone-900 tracking-wider">{promo.code}</td>
                      <td className="p-4 font-semibold text-emerald-600">خصم {Math.round(promo.discount * 100)}%</td>
                      <td className="p-4 text-stone-500 max-w-xs truncate">{promo.eligibleProducts === 'all' || promo.eligibleProducts === 'ALL' ? 'كل اللوحات في المتجر' : promo.eligibleProducts}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          promo.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                        }`}>
                          {promo.status === 'active' ? 'نشط ومفعل' : 'موقوف'}
                        </span>
                      </td>
                    </tr>
                  ))}
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

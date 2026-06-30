import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Filter, Percent, Info, Heart, ArrowLeft, Send, CheckCircle, HelpCircle, PhoneCall, Gift, BookOpen, UserCheck, Shield } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { MemberRegister } from './components/MemberRegister';
import { AdminPanel } from './components/AdminPanel';
import { Product, Order, PromoCode, Member, StoreSettings, CartItem } from './types';
import { MOCK_SETTINGS, MOCK_PRODUCTS, MOCK_PROMO_CODES, MOCK_MEMBERS, MOCK_ORDERS } from './mockData';

export default function App() {
  // Navigation & UI States
  const [activeTab, setActiveTab] = useState<string>('shop');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Connection State
  const [sheetsUrl, setSheetsUrl] = useState<string>(() => {
    return localStorage.getItem('sheets_api_url') || '';
  });
  const [isDemoMode, setIsDemoMode] = useState(true);

  // Core Store States
  const [settings, setSettings] = useState<StoreSettings>(MOCK_SETTINGS);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>(MOCK_PROMO_CODES);
  const [members, setMembers] = useState<Member[]>(MOCK_MEMBERS);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);

  // Cart Local Storage Persistence
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('luxury_shop_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number; eligibleProducts: string } | null>(null);

  // Filtering / Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Sync Cart to local storage on change
  useEffect(() => {
    localStorage.setItem('luxury_shop_cart', JSON.stringify(cart));
  }, [cart]);

  // Sync sheetsUrl to local storage
  useEffect(() => {
    if (sheetsUrl) {
      localStorage.setItem('sheets_api_url', sheetsUrl);
      setIsDemoMode(false);
      fetchCloudData();
    } else {
      localStorage.removeItem('sheets_api_url');
      setIsDemoMode(true);
      // Reset to default mock data
      setSettings(MOCK_SETTINGS);
      setProducts(MOCK_PRODUCTS);
      setPromoCodes(MOCK_PROMO_CODES);
      setMembers(MOCK_MEMBERS);
      setOrders(MOCK_ORDERS);
    }
  }, [sheetsUrl]);

  // Try to fetch live data from deployed Google Apps Script
  const fetchCloudData = async () => {
    if (!sheetsUrl) return;
    try {
      // Fetch settings
      const settingsResponse = await fetch(`${sheetsUrl}?action=get_settings`);
      if (settingsResponse.ok) {
        const liveSettings = await settingsResponse.json();
        if (liveSettings && !liveSettings.status) {
          setSettings(prev => ({ ...prev, ...liveSettings }));
        }
      }

      // Fetch products
      const productsResponse = await fetch(`${sheetsUrl}?action=get_products`);
      if (productsResponse.ok) {
        const liveProducts = await productsResponse.json();
        if (Array.isArray(liveProducts)) {
          setProducts(liveProducts);
        }
      }

      // Fetch general tables
      const generalResponse = await fetch(`${sheetsUrl}`);
      if (generalResponse.ok) {
        const liveData = await generalResponse.json();
        if (liveData && !liveData.status) {
          if (liveData.promoCodes && Array.isArray(liveData.promoCodes)) {
            const parsedCodes: PromoCode[] = liveData.promoCodes.map((row: any) => ({
              code: row[0],
              discount: parseFloat(row[1]) || 0.1,
              eligibleProducts: row[2] || 'all',
              status: row[3] === 'active' ? 'active' : 'inactive'
            }));
            setPromoCodes(parsedCodes);
          }
          if (liveData.members && Array.isArray(liveData.members)) {
            const parsedMembers: Member[] = liveData.members.map((row: any) => ({
              name: row[0],
              email: row[1],
              phone: row[2],
              registrationDate: row[3],
              discountCode: row[4]
            }));
            setMembers(parsedMembers);
          }
          if (liveData.orders && Array.isArray(liveData.orders)) {
            const parsedOrders: Order[] = liveData.orders.map((row: any) => ({
              orderId: row[0],
              timestamp: row[1],
              name: row[2],
              address: row[3],
              phone: row[4],
              email: row[5],
              products: row[6],
              quantities: row[7],
              totalAmount: parseFloat(row[8]) || 0,
              promoCode: row[9],
              telegramSent: row[10],
              pdfLink: row[11]
            }));
            setOrders(parsedOrders);
          }
        }
      }
    } catch (err) {
      console.error('Failed to contact Sheets API. Staying on demo mode data fallback.', err);
    }
  };

  // Add item to shopping basket
  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const idx = prev.findIndex(item => item.fileId === product.fileId);
      if (idx >= 0) {
        // Increment quantity
        const updated = [...prev];
        updated[idx].quantity += 1;
        return updated;
      } else {
        // Add fresh item
        return [
          ...prev,
          {
            fileId: product.fileId,
            title: product.title,
            originalPrice: product.originalPrice,
            discountedPrice: product.discountedPrice,
            finalPrice: product.discountedPrice,
            quantity: 1
          }
        ];
      }
    });
  };

  // Update item quantity
  const handleUpdateQuantity = (index: number, change: number) => {
    setCart(prev => {
      const updated = [...prev];
      updated[index].quantity += change;
      if (updated[index].quantity <= 0) {
        updated.splice(index, 1);
      }
      return updated;
    });
  };

  // Remove item entirely
  const handleRemoveItem = (index: number) => {
    setCart(prev => prev.filter((_, idx) => idx !== index));
  };

  // Validate promotional code (either local or cloud-based)
  const handleApplyPromo = async (code: string): Promise<{ valid: boolean; discount: number; message: string; eligibleProducts: string }> => {
    const uppercaseCode = code.toUpperCase().trim();
    
    if (!isDemoMode && sheetsUrl) {
      try {
        const response = await fetch(`${sheetsUrl}`, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'validate_promo', code: uppercaseCode })
        });
        if (response.ok) {
          const res = await response.json();
          return {
            valid: res.valid,
            discount: res.discount || 0,
            message: res.message || '',
            eligibleProducts: res.eligibleProducts || 'all'
          };
        }
      } catch (err) {
        console.error('Cloud validation failed, falling back to local verification.', err);
      }
    }

    // Local validation
    const found = promoCodes.find(c => c.code === uppercaseCode);
    if (found) {
      if (found.status !== 'active') {
        return { valid: false, discount: 0, message: 'هذا الكود معطل حالياً', eligibleProducts: 'all' };
      }
      return {
        valid: true,
        discount: found.discount,
        message: 'تم تطبيق كود الخصم بنجاح! ✅',
        eligibleProducts: found.eligibleProducts
      };
    }
    return { valid: false, discount: 0, message: 'الكود المكتوب غير صحيح أو منتهي', eligibleProducts: 'all' };
  };

  // Submit checkouts
  const handlePlaceOrder = async (orderDetails: {
    name: string;
    address: string;
    phone: string;
    email: string;
    promoCode: string;
  }): Promise<{ status: string; orderId?: string; message?: string }> => {
    const orderId = 'ORD' + new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14) + Math.floor(Math.random() * 1000);
    const timestamp = new Date().toLocaleString('ar-EG');
    const productsList = cart.map(item => item.title).join(', ');
    const quantitiesList = cart.map(item => item.quantity).join(', ');
    
    let subtotal = 0;
    let discountAmount = 0;
    cart.forEach(item => {
      const itemSub = item.discountedPrice * item.quantity;
      subtotal += itemSub;
      if (appliedPromo) {
        const isEligible = appliedPromo.eligibleProducts === 'all' || appliedPromo.eligibleProducts === 'ALL' || appliedPromo.eligibleProducts.toLowerCase().includes(item.title.toLowerCase());
        if (isEligible) {
          discountAmount += itemSub * appliedPromo.discount;
        }
      }
    });
    const finalTotal = subtotal - discountAmount;

    const newOrderRecord: Order = {
      orderId,
      timestamp,
      name: orderDetails.name,
      address: orderDetails.address,
      phone: orderDetails.phone,
      email: orderDetails.email,
      products: productsList,
      quantities: quantitiesList,
      totalAmount: finalTotal,
      promoCode: orderDetails.promoCode,
      telegramSent: 'جاري الإرسال...',
      pdfLink: '#'
    };

    if (!isDemoMode && sheetsUrl) {
      try {
        const response = await fetch(`${sheetsUrl}`, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'submit_order',
            order: {
              items: cart,
              name: orderDetails.name,
              address: orderDetails.address,
              phone: orderDetails.phone,
              email: orderDetails.email,
              promoCode: orderDetails.promoCode
            }
          })
        });

        if (response.ok) {
          const res = await response.json();
          if (res.status === 'success') {
            const finalOrderRecord: Order = {
              ...newOrderRecord,
              orderId: res.orderId || orderId,
              telegramSent: res.telegramSent || 'تم الإرسال',
              pdfLink: res.pdfLink || '#'
            };
            // Append cloud order to state
            setOrders(prev => [finalOrderRecord, ...prev]);
            return { status: 'success', orderId: res.orderId || orderId };
          } else {
            return { status: 'error', message: res.message || 'فشل في حفظ الطلب بجدول قوقل شيت.' };
          }
        } else {
          return { status: 'error', message: 'لم يتمكن الموقع من تلقي استجابة صحيحة من قوقل شيت (HTTP ' + response.status + ')' };
        }
      } catch (err: any) {
        console.error('Failed to submit order directly to Google Sheets.', err);
        return { status: 'error', message: 'خطأ في الاتصال بقوقل شيت: ' + (err.message || err) };
      }
    }

    // Local / Demo Mode success path
    setOrders(prev => [newOrderRecord, ...prev]);
    return { status: 'success', orderId };
  };

  // Register members
  const handleRegisterMember = async (memberDetails: {
    name: string;
    email: string;
    phone: string;
  }): Promise<{ status: string; code?: string; message?: string }> => {
    const timestamp = new Date().toLocaleString('ar-EG');
    const newMemberRecord: Member = {
      name: memberDetails.name,
      email: memberDetails.email,
      phone: memberDetails.phone,
      registrationDate: timestamp,
      discountCode: 'WELCOME10'
    };

    if (!isDemoMode && sheetsUrl) {
      try {
        const response = await fetch(`${sheetsUrl}`, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'register_member',
            name: memberDetails.name,
            email: memberDetails.email,
            phone: memberDetails.phone
          })
        });
        if (response.ok) {
          const res = await response.json();
          if (res.status === 'success') {
            setMembers(prev => [newMemberRecord, ...prev]);
            return { status: 'success', code: res.code || 'WELCOME10' };
          } else {
            return { status: 'error', message: res.message || 'فشل التسجيل في قوقل شيت' };
          }
        } else {
          return { status: 'error', message: 'استجابة غير صحيحة من قوقل شيت' };
        }
      } catch (err: any) {
        console.error('Failed to submit member directly to Google Sheets.', err);
        return { status: 'error', message: 'خطأ في الاتصال بقوقل شيت: ' + (err.message || err) };
      }
    }

    // Local / Demo Mode success path
    setMembers(prev => [newMemberRecord, ...prev]);
    return { status: 'success', code: 'WELCOME10' };
  };

  // Admin dynamic additions
  const handleAddProduct = (p: Product) => {
    setProducts(prev => [p, ...prev]);
  };

  const handleAddPromoCode = (c: PromoCode) => {
    setPromoCodes(prev => [c, ...prev]);
  };

  // Filtering products list
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Filter products which have discounted offers
  const discountedProducts = products.filter(p => p.originalPrice > p.discountedPrice);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 selection:bg-gold-200 selection:text-stone-900">
      
      {/* Top Banner Navigation bar */}
      <Navbar
        settings={settings}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        openCart={() => setIsCartOpen(true)}
        isDemoMode={isDemoMode}
        hasSheetsConfigured={!!sheetsUrl}
      />

      {/* Main Area View Router */}
      {activeTab === 'shop' && (
        <div className="pb-16">
          
          {/* Main Showcase Hero Section */}
          <div className="relative bg-stone-950 text-white overflow-hidden border-b border-gold-600/20 shadow-lg">
            {/* Ambient backdrop image overlay */}
            <div className="absolute inset-0 z-0 opacity-20">
              <img
                src={settings.headerImageUrl}
                alt="Calligraphy art"
                className="w-full h-full object-cover scale-105 filter blur-xs"
              />
            </div>
            
            <div className="relative z-10 max-w-5xl mx-auto px-4 py-16 sm:py-24 text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold-500/10 text-gold-300 rounded-full text-xs font-bold border border-gold-500/20 shadow-md">
                <Sparkles size={14} className="animate-pulse" />
                <span>تحف فنية أصلية للخط العربي والزخرفة الإسلامية</span>
              </div>
              
              <h1 className="font-serif text-3xl sm:text-5xl font-black tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-r from-gold-100 via-gold-300 to-gold-100">
                {settings.pageTitle}
              </h1>
              
              <p className="text-stone-400 text-sm sm:text-base max-w-2xl mx-auto font-light leading-relaxed">
                اقتنِ أجمل اللوحات والتحف الجدارية والمخطوطات الخاصة المصنوعة بأيدي أمهر الخطاطين المحترفين على مر الزمن لتزيين جدران بيتك بذكر الله.
              </p>

              {/* Combined Categories & Search Panel */}
              <div className="max-w-3xl mx-auto pt-4">
                <div className="bg-stone-900 p-3 rounded-2xl shadow-xl border border-stone-800 flex flex-col md:flex-row gap-2">
                  
                  {/* Search Bar Input */}
                  <div className="relative flex-grow">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ابحث عن لوحة آية الكرسي، أسماء الله الحسنى، أدوات..."
                      className="w-full pl-4 pr-10 py-3 bg-stone-950 text-white border border-stone-800 rounded-xl outline-none focus:border-gold-500 text-xs placeholder:text-stone-500 font-medium"
                    />
                    <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  </div>

                  {/* Category Dropdown Selector */}
                  <div className="relative min-w-[200px]">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-4 py-3 bg-stone-950 text-gold-300 border border-stone-800 rounded-xl outline-none focus:border-gold-500 text-xs font-bold cursor-pointer"
                    >
                      <option value="all">كل الأقسام والمعروضات</option>
                      {settings.keywords.map((kw, idx) => (
                        <option key={idx} value={kw}>{kw}</option>
                      ))}
                    </select>
                    <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-400 pointer-events-none" />
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* Special Deals & Offers Strip (Dynamic) */}
          {discountedProducts.length > 0 && (
            <div className="max-w-7xl mx-auto px-4 mt-12">
              <div className="bg-amber-500/5 rounded-3xl border border-gold-300/20 p-6 md:p-8">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gold-500/10 text-gold-600 flex items-center justify-center border border-gold-400/20">
                      <Percent size={16} />
                    </div>
                    <div>
                      <h2 className="font-serif text-lg md:text-xl font-bold text-stone-900">عروض وتخفيضات خاصة وحصرية</h2>
                      <p className="text-stone-500 text-[11px] mt-0.5">فرصتك لاقتناء تحف فنية نادرة ومميزة بأسعار خاصة لفترة محدودة</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gold-600 bg-gold-100/50 px-3 py-1 rounded-full border border-gold-200">
                    نشط الآن
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {discountedProducts.map((prod) => (
                    <ProductCard
                      key={prod.fileId}
                      product={prod}
                      onViewDetails={(p) => setSelectedProduct(p)}
                      onAddToCart={(p) => handleAddToCart(p)}
                      isInCart={cart.some(item => item.fileId === prod.fileId)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Standard Main Catalog Grid */}
          <div className="max-w-7xl mx-auto px-4 mt-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h3 className="font-serif text-xl font-bold text-stone-900">كل المعروضات المتاحة</h3>
                <p className="text-stone-500 text-xs mt-0.5">تصفح لوحاتنا ومخطوطاتنا وأدوات الخط العربي الفاخرة</p>
              </div>
              
              {/* Category Pill Selectors */}
              <div className="flex flex-wrap gap-1.5 text-xs font-medium">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all border cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-stone-950 text-gold-300 border-stone-950 shadow-sm'
                      : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  الكل
                </button>
                {settings.keywords.map((kw, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedCategory(kw)}
                    className={`px-3 py-1.5 rounded-lg transition-all border cursor-pointer ${
                      selectedCategory === kw
                        ? 'bg-stone-950 text-gold-300 border-stone-950 shadow-sm'
                        : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    {kw}
                  </button>
                ))}
              </div>
            </div>

            {/* Products grid */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-3xl border border-stone-200 p-8">
                <p className="text-stone-500 text-sm font-semibold">لم نجد أي تحف أو منتجات مطابقة لبحثك الحالي.</p>
                <p className="text-stone-400 text-xs mt-1">يرجى تجربة كلمات بحث أخرى أو تصفح قسم آخر</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredProducts.map((prod) => (
                  <ProductCard
                    key={prod.fileId}
                    product={prod}
                    onViewDetails={(p) => setSelectedProduct(p)}
                    onAddToCart={(p) => handleAddToCart(p)}
                    isInCart={cart.some(item => item.fileId === prod.fileId)}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {activeTab === 'member' && (
        <div className="pb-16">
          <MemberRegister onRegister={handleRegisterMember} />
        </div>
      )}

      {activeTab === 'admin' && (
        <div className="pb-16">
          <AdminPanel
            orders={orders}
            products={products}
            promoCodes={promoCodes}
            members={members}
            settings={settings}
            isDemoMode={isDemoMode}
            sheetsUrl={sheetsUrl}
            setSheetsUrl={setSheetsUrl}
            onUpdateSettings={(newS) => setSettings(newS)}
            onAddProduct={handleAddProduct}
            onAddPromoCode={handleAddPromoCode}
          />
        </div>
      )}

      {/* Floating Call to Action Footer / Contact details */}
      <footer className="bg-stone-950 text-stone-300 border-t border-gold-600/30">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Column 1: Store Intro */}
            <div className="space-y-4">
              <span className="font-serif text-lg font-bold text-gold-400">{settings.pageTitle}</span>
              <p className="text-xs text-stone-400 leading-relaxed max-w-sm">
                متجر متخصص بإنتاج وبيع اللوحات الجدارية الفاخرة للخط العربي والزخرفة الإسلامية، مكتوبة ومحفورة ومذهبة بأيدي خطاطين محترفين لتناسب الأذواق الرفيعة والمحترمة.
              </p>
            </div>

            {/* Column 2: Quick Links */}
            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-stone-100 text-sm">أقسام ومفاتيح سريعة</h4>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { setActiveTab('shop'); setSelectedCategory('all'); }} className="text-right hover:text-gold-400 transition-colors">تصفح المعرض</button>
                <button onClick={() => { setActiveTab('member'); }} className="text-right hover:text-gold-400 transition-colors">اشترك بالعضوية</button>
                <button onClick={() => { setActiveTab('admin'); }} className="text-right hover:text-gold-400 transition-colors">بوابة الإدارة</button>
                <button onClick={() => { setActiveTab('shop'); }} className="text-right hover:text-gold-400 transition-colors">عروض وتخفيضات</button>
              </div>
            </div>

            {/* Column 3: Contact & LINE follow */}
            <div className="space-y-4 text-xs">
              <h4 className="font-bold text-stone-100 text-sm">تواصل فوري ومتابعة</h4>
              <p className="text-stone-400 leading-relaxed text-[11px]">
                يسر خدمة العملاء والطلبات الخاصة استقبال تساؤلاتكم واستفساراتكم حول اللوحات المخصصة بالاسم طوال اليوم.
              </p>
              
              {/* Social URLs List */}
              <div className="flex gap-2">
                {settings.facebookUrl && <a href={settings.facebookUrl} target="_blank" rel="noreferrer" className="p-2 bg-stone-900 border border-stone-800 hover:border-gold-500 rounded-lg text-stone-300 hover:text-gold-400 transition-all text-xs">فيسبوك</a>}
                {settings.instagramUrl && <a href={settings.instagramUrl} target="_blank" rel="noreferrer" className="p-2 bg-stone-900 border border-stone-800 hover:border-gold-500 rounded-lg text-stone-300 hover:text-gold-400 transition-all text-xs">إنستغرام</a>}
                {settings.youtubeUrl && <a href={settings.youtubeUrl} target="_blank" rel="noreferrer" className="p-2 bg-stone-900 border border-stone-800 hover:border-gold-500 rounded-lg text-stone-300 hover:text-gold-400 transition-all text-xs">يوتيوب</a>}
                {settings.lineUrl && <a href={settings.lineUrl} target="_blank" rel="noreferrer" className="p-2 bg-stone-900 border border-stone-800 hover:border-gold-500 rounded-lg text-stone-300 hover:text-gold-400 transition-all text-xs">لاين LINE</a>}
              </div>
            </div>

          </div>

          <hr className="border-stone-900 my-8" />

          {/* Legal / Copyright Footer bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-stone-500">
            <span>© {new Date().getFullYear()} {settings.pageTitle}. جميع الحقوق محفوظة لورشة الخط العربي الإسلامي والخطاط.</span>
            <div className="flex gap-4">
              <span className="hover:text-stone-400 cursor-pointer">شروط الاستخدام</span>
              <span className="hover:text-stone-400 cursor-pointer">سياسة الخصوصية وتأمين البيانات</span>
            </div>
          </div>
        </div>
      </footer>

      {/* MODALS & DRAWERS SECTION */}
      
      {/* Product Details overlay */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={(p) => handleAddToCart(p)}
          isInCart={cart.some(item => item.fileId === selectedProduct.fileId)}
        />
      )}

      {/* Sliding Shopping Basket Drawer */}
      <CartDrawer
        cart={cart}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        promoCodes={promoCodes}
        onApplyPromo={handleApplyPromo}
        appliedPromo={appliedPromo}
        setAppliedPromo={setAppliedPromo}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Checkout and payment modal form */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        appliedPromo={appliedPromo}
        onPlaceOrder={handlePlaceOrder}
        clearCart={() => {
          setCart([]);
          setAppliedPromo(null);
        }}
      />

    </div>
  );
}

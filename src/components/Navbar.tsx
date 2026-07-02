import React from 'react';
import { ShoppingCart, LogIn, Store, UserPlus, Sliders, Shield } from 'lucide-react';
import { StoreSettings, StoreTexts } from '../types';

interface NavbarProps {
  settings: StoreSettings;
  texts: StoreTexts;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cartCount: number;
  openCart: () => void;
  isDemoMode: boolean;
  hasSheetsConfigured: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  texts,
  activeTab,
  setActiveTab,
  cartCount,
  openCart,
  isDemoMode,
  hasSheetsConfigured
}) => {
  return (
    <nav className="sticky top-0 z-50 bg-stone-950 text-stone-100 shadow-md border-b border-gold-600/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Brand/Logo Section */}
          <div className="flex items-center space-x-3 space-x-reverse cursor-pointer" onClick={() => setActiveTab('shop')}>
            {texts.logoImage ? (
              <img 
                src={texts.logoImage} 
                alt={texts.brandName} 
                className="w-12 h-12 rounded-full border border-gold-400 bg-stone-900 object-cover shadow-[0_0_10px_rgba(214,191,119,0.2)]"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-12 h-12 rounded-full border border-gold-400 bg-stone-900 flex items-center justify-center font-serif text-2xl text-gold-300 font-extrabold shadow-[0_0_10px_rgba(214,191,119,0.2)]">
                {texts.logoLetter || 'خ'}
              </div>
            )}
            <div>
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-gold-300 block">
                {texts.brandName || 'خطاط'}
              </span>
              <span className="text-xs text-stone-400 block tracking-widest font-light -mt-1">
                {texts.brandSubtitle || 'للفنون والخط العربي'}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-4 space-x-reverse">
            <button
              onClick={() => setActiveTab('shop')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'shop'
                  ? 'bg-gold-500/10 text-gold-300 border border-gold-500/30'
                  : 'text-stone-300 hover:text-gold-300 hover:bg-stone-900'
              }`}
            >
              <Store size={16} />
              <span>{texts.tabShopText || 'المتجر'}</span>
            </button>
            <button
              onClick={() => setActiveTab('member')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'member'
                  ? 'bg-gold-500/10 text-gold-300 border border-gold-500/30'
                  : 'text-stone-300 hover:text-gold-300 hover:bg-stone-900'
              }`}
            >
              <UserPlus size={16} />
              <span>{texts.tabMembersText || 'نادي العضوية'}</span>
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'admin'
                  ? 'bg-gold-500/10 text-gold-300 border border-gold-500/30'
                  : 'text-stone-300 hover:text-gold-300 hover:bg-stone-900'
              }`}
            >
              <Shield size={16} />
              <span>{texts.tabAdminText || 'لوحة الإدارة'}</span>
            </button>
          </div>

          {/* Action Buttons & Badges */}
          <div className="flex items-center gap-3">
            {/* Demo Badge */}
            {isDemoMode && (
              <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs px-2.5 py-1 rounded-full font-medium shadow-sm">
                وضع المعاينة التجريبي
              </span>
            )}
            
            {/* Connected Badge */}
            {!isDemoMode && hasSheetsConfigured && (
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-1 rounded-full font-medium shadow-sm">
                متصل بـ Google Sheets
              </span>
            )}

            {/* Shopping Cart Trigger */}
            <button
              onClick={openCart}
              className="relative p-2.5 rounded-full bg-stone-900 border border-stone-800 hover:border-gold-500/50 hover:bg-stone-800 text-stone-200 hover:text-gold-400 transition-all cursor-pointer shadow-lg"
              title="سلة التسوق"
            >
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-gold-500 text-stone-950 font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-pulse border-2 border-stone-950">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Links */}
      <div className="md:hidden flex justify-around py-3 bg-stone-900/95 border-t border-stone-800 text-xs">
        <button
          onClick={() => setActiveTab('shop')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'shop' ? 'text-gold-400 font-bold' : 'text-stone-400'
          }`}
        >
          <Store size={18} />
          <span>{texts.tabShopText || 'المتجر'}</span>
        </button>
        <button
          onClick={() => setActiveTab('member')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'member' ? 'text-gold-400 font-bold' : 'text-stone-400'
          }`}
        >
          <UserPlus size={18} />
          <span>{texts.tabMembersText || 'نادي العضوية'}</span>
        </button>
        <button
          onClick={() => setActiveTab('admin')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'admin' ? 'text-gold-400 font-bold' : 'text-stone-400'
          }`}
        >
          <Shield size={18} />
          <span>{texts.tabAdminText || 'لوحة الإدارة'}</span>
        </button>
      </div>
    </nav>
  );
};

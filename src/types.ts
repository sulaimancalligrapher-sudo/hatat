export interface Product {
  fileId: string;
  title: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  isOriginalPriceStruck: boolean;
  extraImages: string[];
  details: string[];
  videos: { type: 'youtube' | 'drive'; id: string }[];
  category: string;
}

export interface Order {
  orderId: string;
  timestamp: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  products: string;
  quantities: string;
  totalAmount: number;
  promoCode: string;
  telegramSent: string;
  pdfLink: string;
}

export interface PromoCode {
  code: string;
  type: 'percentage' | 'fixed' | 'shipping';
  value: number; // percentage (e.g. 0.15) or fixed value (e.g. 50)
  minSpend?: number;
  expiryDate?: string; // YYYY-MM-DD
  usageLimit?: number;
  usageCount: number;
  categoryType: 'general' | 'student' | 'member';
  assignedIdentifier?: string; // student ID or member email
  usedByContacts: string[]; // list of contacts (email or phone) who have used it
  customerUsageLimit?: number; // max usages per unique customer (email or phone)
  eligibleProducts: string; // 'all' or specific titles
  status: 'active' | 'inactive';
  discount: number; // for compatibility: value if type is percentage, otherwise computed
}

export interface Student {
  studentId: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
}

export interface Member {
  name: string;
  email: string;
  phone: string;
  registrationDate: string;
  discountCode: string;
}

export interface StoreSettings {
  headerImageUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  lineUrl: string;
  pageTitle: string;
  recipientEmail: string;
  botToken: string;
  chatId: string;
  templateId: string;
  folderUrl: string;
  keywords: string[];
}

export interface StoreTexts {
  logoImage: string;
  logoLetter: string;
  brandName: string;
  brandSubtitle: string;
  heroTitle: string;
  heroBadgeText: string;
  heroSubtitle: string;
  searchPlaceholder: string;
  categoryAllText: string;
  tabShopText: string;
  tabMembersText: string;
  tabAdminText: string;
  discountLabelText: string;
  offersTitle: string;
  offersSubtitle: string;
  activeNowText: string;
  categoryPillAllText: string;
  footerIntroText: string;
  footerQuickLinksTitle: string;
  footerLinkBrowse: string;
  footerLinkSubscribe: string;
  footerLinkAdmin: string;
  footerLinkOffers: string;
  footerContactTitle: string;
  footerContactDesc: string;
  footerTermsOfUse: string;
  footerPrivacyPolicy: string;
}

export interface CartItem {
  fileId: string;
  title: string;
  originalPrice: number;
  discountedPrice: number;
  finalPrice: number;
  quantity: number;
}

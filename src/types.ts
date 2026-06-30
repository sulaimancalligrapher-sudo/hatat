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
  discount: number; // e.g. 0.1 for 10%
  eligibleProducts: string; // 'all' or comma-separated list
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

export interface CartItem {
  fileId: string;
  title: string;
  originalPrice: number;
  discountedPrice: number;
  finalPrice: number;
  quantity: number;
}

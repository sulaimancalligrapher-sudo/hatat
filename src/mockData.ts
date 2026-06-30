import { Product, PromoCode, Order, Member, StoreSettings } from './types';

export const MOCK_SETTINGS: StoreSettings = {
  headerImageUrl: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?q=80&w=600&auto=format&fit=crop', // Beautiful artistic workspace
  facebookUrl: 'https://facebook.com/example_calligraphy',
  instagramUrl: 'https://instagram.com/example_calligraphy',
  youtubeUrl: 'https://youtube.com/c/example_calligraphy',
  lineUrl: 'https://line.me/ti/p/example',
  pageTitle: 'موقع النخبة للخط العربي والزخرفة الإسلامية',
  recipientEmail: 'naskh4thanoun@gmail.com',
  botToken: 'YOUR_TELEGRAM_BOT_TOKEN',
  chatId: 'YOUR_TELEGRAM_CHAT_ID',
  templateId: 'YOUR_GOOGLE_DOCS_TEMPLATE_ID',
  folderUrl: 'https://drive.google.com/drive/folders/YOUR_GOOGLE_DRIVE_FOLDER_ID',
  keywords: ['لوحات جدارية', 'مخطوطات خاصة', 'أدوات الخط العربي', 'دورات تدريبية', 'كتب وكراسات']
};

export const MOCK_PRODUCTS: Product[] = [
  {
    fileId: '1_demo_painting_1',
    title: 'لوحة آية الكرسي بخط الثلث الجلي',
    description: 'لوحة فنية أصلية مكتوبة بالحبر الكربوني التقليدي ومذهبة بماء الذهب عيار 24 قيراط على ورق آهر هندي معتق. تحفة فنية تضفي بركة وجمالاً على منزلك.',
    originalPrice: 1500,
    discountedPrice: 1200,
    isOriginalPriceStruck: true,
    extraImages: [
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1580136579312-94651dfd596d?q=80&w=600&auto=format&fit=crop'
    ],
    details: [
      'الأبعاد: 70 × 50 سم',
      'نوع الخط: ثلث جلي فاخر',
      'المذهب: زركشة يدوية كلاسيكية',
      'الإطار: خشب زان فاخر محفور يدوياً'
    ],
    videos: [
      { type: 'youtube', id: 'ScMzIvxBSi4' } // Classic calligraphy sample video
    ],
    category: 'لوحات جدارية'
  },
  {
    fileId: '1_demo_painting_2',
    title: 'مخطوطة أسماء الله الحسنى الدائرية',
    description: 'تصميم هندسي دائري فريد يضم أسماء الله الحسنى كاملة، مكتوبة بخط النسخ الدقيق المتداخل في تناسق لوني وبصري مذهل مع زركشة مذهبة بالكامل.',
    originalPrice: 2000,
    discountedPrice: 1800,
    isOriginalPriceStruck: true,
    extraImages: [
      'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?q=80&w=600&auto=format&fit=crop'
    ],
    details: [
      'القطر: 60 سم (دائري)',
      'نوع الخط: نسخ فاخر',
      'الورق: مقهر كشميري معتق طبيعياً',
      'تاريخ الكتابة: 1447 هـ'
    ],
    videos: [],
    category: 'لوحات جدارية'
  },
  {
    fileId: '1_demo_tools_1',
    title: 'صندوق أدوات الخطاط المحترف المتكامل',
    description: 'حقيبة خشبية يدوية الصنع تحتوي على مجموعة كاملة من القصب الطبيعي، الأحبار العربية الفاخرة، ومحابر الحرير، مثالية للمبتدئين والمحترفين على حد سواء.',
    originalPrice: 450,
    discountedPrice: 380,
    isOriginalPriceStruck: true,
    extraImages: [
      'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=600&auto=format&fit=crop'
    ],
    details: [
      '6 أقلام قصب بمقاسات مختلفة (جاوة، دزفولي، طومار)',
      '3 زجاجات حبر (أسود، بني، ذهبي سائل)',
      '2 ليقة حرير طبيعي داخل محابر زجاجية محكمة',
      'سكين قط خاص عظمي ومقطع أبنوس أصلي'
    ],
    videos: [],
    category: 'أدوات الخط العربي'
  },
  {
    fileId: '1_demo_curriculums',
    title: 'كراسة الأستاذ شوقي لخط الثلث والنسخ',
    description: 'المرجع الكلاسيكي الأهم لتعلم قواعد الحروف والاتصالات والسطر في خطي الثلث والنسخ، مع شروحات دقيقة لنسب الحروف بالنقاط والموازين.',
    originalPrice: 90,
    discountedPrice: 75,
    isOriginalPriceStruck: true,
    extraImages: [],
    details: [
      'عدد الصفحات: 48 صفحة طباعة فاخرة سميكة',
      'القياس: A4 أفقي',
      'مناسب للدراسة الذاتية والتمشيق اليومي'
    ],
    videos: [],
    category: 'كتب وكراسات'
  },
  {
    fileId: '1_demo_custom_order',
    title: 'طلب كتابة اسمك أو شعار خاص بالذهب',
    description: 'كتابة اسمك الشخصي، اسم شركتك، أو بيت شعر مفضل بأي خط من الخطوط العربية (ثلث، ديواني، رقعة، نستعليق) بأقلام المحترفين وتنسيقه كتحفة فنية رقمية أو يدوية.',
    originalPrice: 350,
    discountedPrice: 300,
    isOriginalPriceStruck: false,
    extraImages: [
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=600&auto=format&fit=crop'
    ],
    details: [
      'يتم توفير المخطوطة بصيغة متجهة Vector (PDF, SVG) بجودة طباعة لامتناهية',
      'تتوفر خدمة شحن اللوحة الأصلية المكتوبة يدوياً بطلب خاص'
    ],
    videos: [],
    category: 'مخطوطات خاصة'
  }
];

export const MOCK_PROMO_CODES: PromoCode[] = [
  {
    code: 'WELCOME10',
    discount: 0.10,
    eligibleProducts: 'all',
    status: 'active'
  },
  {
    code: 'GOLD20',
    discount: 0.20,
    eligibleProducts: 'لوحة آية الكرسي بخط الثلث الجلي, مخطوطة أسماء الله الحسنى الدائرية',
    status: 'active'
  },
  {
    code: 'RAMADAN',
    discount: 0.15,
    eligibleProducts: 'all',
    status: 'active'
  }
];

export const MOCK_MEMBERS: Member[] = [
  {
    name: 'أحمد الفاروقي',
    email: 'ahmed@example.com',
    phone: '0551234567',
    registrationDate: '2026-06-15 14:30',
    discountCode: 'WELCOME10'
  },
  {
    name: 'فاطمة الزهراء',
    email: 'fatima@example.com',
    phone: '0569876543',
    registrationDate: '2026-06-20 10:15',
    discountCode: 'WELCOME10'
  }
];

export const MOCK_ORDERS: Order[] = [
  {
    orderId: 'ORD202606291234567',
    timestamp: '2026-06-29 18:24:55',
    name: 'خالد بن الوليد',
    address: 'المملكة العربية السعودية، الرياض، حي الياسمين، شارع العليا',
    phone: '0501112223',
    email: 'khaled@example.com',
    products: 'لوحة آية الكرسي بخط الثلث الجلي',
    quantities: '1',
    totalAmount: 1080.00, // Applied WELCOME10 (1200 - 10%)
    promoCode: 'WELCOME10',
    telegramSent: 'تم الإرسال',
    pdfLink: '#'
  },
  {
    orderId: 'ORD202606300912345',
    timestamp: '2026-06-30 09:15:32',
    name: 'سارة عبد الله',
    address: 'الإمارات العربية المتحدة، دبي، مرسى دبي، برج الأميرة د. 402',
    phone: '0543334445',
    email: 'sara@example.com',
    products: 'صندوق أدوات الخطاط المحترف المتكامل, كراسة الأستاذ شوقي لخط الثلث والنسخ',
    quantities: '1, 2',
    totalAmount: 530.00, // 380 + (75 * 2) = 530
    promoCode: '',
    telegramSent: 'تم الإرسال',
    pdfLink: '#'
  }
];

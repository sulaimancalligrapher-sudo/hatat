import React, { useState } from 'react';
import { Lock, FileText, ShoppingBag, Plus, Sparkles, Check, Database, Send, Mail, AlertCircle, Copy, ExternalLink, Settings, Eye, Users } from 'lucide-react';
import { Product, Order, PromoCode, Member, StoreSettings, Student } from '../types';

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
  onAddPromoCode
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
    const appsScriptCode = `/**
 * Google Sheets Integration Script for Luxury Calligraphy Store
 * @license Apache-2.0
 */

// معالجة طلبات جلب البيانات (GET)
function doGet(e) {
  var action = e && e.parameter && e.parameter.action;
  var result = {};
  
  try {
    if (action === 'get_settings') {
      result = getSettings();
    } else if (action === 'get_products') {
      result = getImageData();
    } else if (action === 'get_promo') {
      result = getPromoCodes();
    } else {
      result = getData();
    }
    
    // إرجاع النتيجة كـ JSON مع تفعيل ترويسات السماح بالوصول (CORS)
    return ContentService.createTextOutput(JSON.stringify(result))
                         .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

// معالجة طلبات إرسال البيانات (POST)
function doPost(e) {
  try {
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action;
    var response = {};
    
    if (action === 'submit_order') {
      response = submitOrder(postData.order);
    } else if (action === 'register_member') {
      response = registerMember(postData);
    } else if (action === 'validate_promo') {
      response = validatePromoCode(postData.code, postData.email, postData.phone, postData.subtotal, postData.studentId);
    } else {
      throw new Error('العملية المطلوبة غير مدعومة');
    }
    
    return ContentService.createTextOutput(JSON.stringify(response))
                         .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

// تسجيل عضوية جديدة وإرسال بريد ترحيبي تلقائياً مع كوبون خصم
function registerMember(data) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var memberSheet = spreadsheet.getSheetByName('Members');
  if (!memberSheet) {
    memberSheet = spreadsheet.insertSheet('Members');
    memberSheet.getRange('A1:E1').setValues([['الاسم', 'البريد الإلكتروني', 'رقم الهاتف', 'تاريخ التسجيل', 'كوبون الخصم']]);
  }
  var timestamp = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm:ss');
  memberSheet.appendRow([data.name, data.email, data.phone, timestamp, 'WELCOME10']);
  
  // إرسال البريد الترحيبي
  try {
    var welcomeBody = 
      '<div dir="rtl" style="font-family: \\'Cairo\\', \\'Segoe UI\\', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e5e5; border-radius: 16px; padding: 24px; background-color: #fcfbfa; color: #1c1917;">' +
        '<div style="text-align: center; margin-bottom: 24px; border-bottom: 2px solid #d6bf77; padding-bottom: 16px;">' +
          '<h2 style="color: #1c1917; font-family: serif; font-size: 24px; margin: 0;">أهلاً بك في نادي النخبة للخط العربي الفاخر ✨</h2>' +
        '</div>' +
        '<p>عزيزنا <strong>\' + data.name + \'</strong>، يسعدنا انضمامك إلينا في مجتمع محبي الفنون الإسلامية والخط العربي الأصيل.</p>' +
        '<p>لقد تم تفعيل عضويتك ومنحك كوبون خصم ترحيبي بقيمة 10% يمكنك استخدامه فوراً في مشترياتك القادمة بالمتجر:</p>' +
        
        '<div style="text-align: center; margin: 24px 0;">' +
          '<div style="padding: 15px 30px; background: #faf9f6; border: 2px dashed #d6bf77; display: inline-block; font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #c5a850; font-family: monospace; border-radius: 8px;">' +
            'WELCOME10' +
          '</div>' +
        '</div>' +
        
        '<p>تواصل معنا دائماً، وترقب عروضنا والقطع الفنية الحصرية القادمة المصممة خصيصاً لذوقك الرفيع.</p>' +
        
        '<div style="text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px dashed #d6bf77; font-size: 12px; color: #78716c;">' +
          '<p style="margin: 0;">شكراً لاهتمامكم بالفن الأصيل ❤️</p>' +
        '</div>' +
      '</div>';

    sendEmailHelper(data.email, 'مرحباً بك في نادي النخبة للخط العربي! 🎉', welcomeBody);
  } catch (e) {
    Logger.log(\'فشل إرسال الإيميل الترحيبي: \' + e.message);
  }
  
  return { status: \'success\', code: \'WELCOME10\' };
}

// جلب الإعدادات من شيت الإعدادات القديم بالترتيب الأصلي للصفوف والأعمدة
function getSettings() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var settingsSheet = spreadsheet.getSheetByName(\'Settings\');
  if (!settingsSheet) return {};
  
  // نستخدم نطاقاً ثابتاً (مثلاً حتى الصف 100) لضمان عدم حدوث أي قطع للمصفوفة
  // بسبب وجود صفوف فارغة في الأسفل، مما يضمن قراءة الخلايا B16 و B17 والكلمات المفتاحية في العمود F بالكامل
  var data = settingsSheet.getRange(\'A2:F100\').getValues();
  
  var settings = {
    headerImageUrl: data[0] && data[0][1] ? data[0][1].toString().trim() : \'\',
    facebookUrl: data[1] && data[1][1] ? data[1][1].toString().trim() : \'\',
    instagramUrl: data[2] && data[2][1] ? data[2][1].toString().trim() : \'\',
    youtubeUrl: data[3] && data[3][1] ? data[3][1].toString().trim() : \'\',
    lineUrl: data[4] && data[4][1] ? data[4][1].toString().trim() : \'\',
    pageTitle: data[6] && data[6][1] ? data[6][1].toString().trim() : \'معرض الصور\',
    recipientEmail: data[7] && data[7][1] ? data[7][1].toString().trim() : \'\',
    botToken: data[10] && data[10][1] ? data[10][1].toString().trim() : \'\',
    chatId: data[11] && data[11][1] ? data[11][1].toString().trim() : \'\',
    templateId: data[14] && data[14][1] ? data[14][1].toString().trim() : \'\',
    folderUrl: data[15] && data[15][1] ? data[15][1].toString().trim() : \'\',
    keywords: []
  };
  
  for (var i = 0; i < data.length; i++) {
    if (data[i] && data[i][5] && data[i][5].toString().trim()) {
      settings.keywords.push(data[i][5].toString().trim());
    }
  }
  return settings;
}

// جلب المنتجات بالكامل مع الالتزام بترتيب الأعمدة للشيت القديم والملفات
function getImageData() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(\'Images\');
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var lastColumn = sheet.getLastColumn();
  var values = sheet.getRange(\'A2:\' + String.fromCharCode(64 + lastColumn) + lastRow).getValues();
  var fontLines = sheet.getRange(\'O2:O\' + lastRow).getFontLines();
  var data = [];
  
  for (var i = 0; i < values.length; i++) {
    if (values[i][0]) {
      try {
        var fileId = extractFileId(values[i][0]);
        var extraImages = [];
        var details = [];
        var videos = [];
        
        for (var j = 3; j < values[i].length; j++) {
          var value = values[i][j] ? values[i][j].toString().trim() : \'\';
          if (value === \'\') continue;
          if (j >= 3 && j <= 12) {
            extraImages.push(extractFileId(value));
          } else if (j >= 15 && j <= 16) {
            details.push(value);
          } else if (j >= 17) {
            var youtubeId = extractYouTubeId(value);
            var driveFileId = extractFileId(value);
            if (youtubeId) {
              videos.push({ type: \'youtube\', id: youtubeId });
            } else if (driveFileId) {
              videos.push({ type: \'drive\', id: driveFileId });
            }
          }
        }
        
        var originalPrice = values[i][14] ? parseFloat(values[i][14]) : 0;
        var discountedPrice = values[i][13] ? parseFloat(values[i][13]) : originalPrice;
        var isOriginalPriceStruck = fontLines[i] && fontLines[i][0] === \'line-through\';
        
        data.push({
          fileId: fileId,
          title: values[i][1] ? values[i][1].toString().trim() : \'بدون عنوان\',
          description: values[i][2] ? values[i][2].toString().trim() : \'بدون وصف\',
          originalPrice: isNaN(originalPrice) ? 0 : originalPrice,
          discountedPrice: isNaN(discountedPrice) ? originalPrice : discountedPrice,
          isOriginalPriceStruck: !!isOriginalPriceStruck,
          extraImages: extraImages,
          details: details,
          videos: videos,
          category: values[i][1] ? \'لوحات جدارية\' : \'عام\'
        });
      } catch (e) {
        Logger.log(\'خطأ في معالجة الصف: \' + e.message);
      }
    }
  }
  return data;
}

// التحقق من كود الخصم في شيت PromoCodes أو رقم الطالب مباشرة
function validatePromoCode(code, email, phone, subtotal, studentId) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName('PromoCodes');
  
  // أولاً: التحقق مما إذا كان الكود المدخل هو رقم طالب مباشرة في شيت الطلاب
  var studentSheet = spreadsheet.getSheetByName('Students');
  if (studentSheet) {
    var sLastRow = studentSheet.getLastRow();
    if (sLastRow >= 2) {
      var sValues = studentSheet.getRange('A2:G' + sLastRow).getValues();
      for (var sIdx = 0; sIdx < sValues.length; sIdx++) {
        var sId = sValues[sIdx][0] ? sValues[sIdx][0].toString().trim().toUpperCase() : '';
        if (sId === code.toUpperCase().trim()) {
          var sName = sValues[sIdx][1] ? sValues[sIdx][1].toString().trim() : '';
          var sStatus = sValues[sIdx][6] ? sValues[sIdx][6].toString().trim().toLowerCase() : 'active';
          
          if (sStatus !== 'active' && sStatus !== 'نعم' && sStatus !== 'true' && sStatus !== 'نشط') {
            return { valid: false, message: 'عذراً، هذا الرقم الطلابي غير نشط أو معطل ❌' };
          }
          
          // البحث عن نسبة خصم مستعارة من أي كوبون طلاب نشط في جدول PromoCodes
          var borrowType = 'percentage';
          var borrowValue = 0.15; // خصم افتراضي 15%
          var borrowEligible = 'all';
          var studentUsageLimit = 1; // الافتراضي 1 إذا لم يحدد في الكوبون المستعار
          
          if (sheet) {
            var pValues = sheet.getLastRow() >= 2 ? sheet.getRange('A2:L' + sheet.getLastRow()).getValues() : [];
            for (var pIdx = 0; pIdx < pValues.length; pIdx++) {
              var targetGroupRaw = pValues[pIdx][9] ? pValues[pIdx][9].toString().trim().toLowerCase() : 'general';
              var pIsActive = pValues[pIdx][8] ? pValues[pIdx][8].toString().trim().toLowerCase() : 'active';
              var pActive = pIsActive === 'active' || pIsActive === 'نعم' || pIsActive === 'true' || pIsActive === 'نشط';
              var pIsStudent = targetGroupRaw === 'student' || targetGroupRaw === 'طالب' || targetGroupRaw === 'طلاب';
              if (pIsStudent && pActive) {
                borrowType = pValues[pIdx][1] ? pValues[pIdx][1].toString().trim().toLowerCase() : 'percentage';
                borrowValue = parseFloat(pValues[pIdx][2]) || 0;
                borrowEligible = pValues[pIdx][7] || 'all';
                var pLimit = pValues[pIdx][11] !== '' && pValues[pIdx][11] !== undefined ? parseInt(pValues[pIdx][11]) : null;
                if (pLimit !== null && !isNaN(pLimit)) {
                  studentUsageLimit = pLimit;
                }
                break;
              }
            }
          }
          
          var sUsedCount = parseInt(sValues[sIdx][5]) || 0;
          if (sUsedCount >= studentUsageLimit) {
            return { valid: false, message: 'عذراً، لقد استنفدت الحد الأقصى لاستخدام الرقم الطلابي للخصم (' + studentUsageLimit + ' استخدام) 🛡️' };
          }
          
          return {
            valid: true,
            discount: borrowType === 'percentage' ? borrowValue : 0,
            message: 'مرحباً بك يا ' + sName + '! تم تفعيل خصم الطلاب المباشر بنجاح 🎓',
            eligibleProducts: borrowEligible,
            type: borrowType,
            value: borrowValue,
            categoryType: 'student'
          };
        }
      }
    }
  }

  if (!sheet) return { valid: false, message: 'لا توجد ورقة خصومات بالاسم المحدد' };
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { valid: false, message: 'لا توجد أكواد ترويجية حالياً' };
  
  // الأعمدة المحدثة بالترتيب: 
  // 0: code, 1: type, 2: value, 3: min_spend, 4: expiry_date, 5: usage_limit, 6: usage_count, 7: eligible_products, 8: is_active, 9: target_group, 10: used_contacts, 11: customer_usage_limit
  var values = sheet.getRange('A2:L' + lastRow).getValues();
  for (var i = 0; i < values.length; i++) {
    var rowCode = values[i][0] ? values[i][0].toString().trim().toUpperCase() : '';
    if (rowCode === code.toUpperCase().trim()) {
      var statusVal = values[i][8] ? values[i][8].toString().trim().toLowerCase() : 'active';
      var isActive = statusVal === 'active' || statusVal === 'true' || statusVal === 'نعم' || statusVal === 'نشط';
      if (!isActive) {
        return { valid: false, message: 'هذا الكوبون معطل حالياً' };
      }
      
      var type = values[i][1] ? values[i][1].toString().trim().toLowerCase() : 'percentage';
      var val = parseFloat(values[i][2]) || 0;
      var minSpend = parseFloat(values[i][3]) || 0;
      var expiryDate = values[i][4] ? values[i][4].toString().trim() : '';
      var usageLimit = values[i][5] !== '' && values[i][5] !== undefined ? parseInt(values[i][5]) : null;
      var usageCount = parseInt(values[i][6]) || 0;
      var eligibleProducts = values[i][7] || 'all';
      var targetGroupRaw = values[i][9] ? values[i][9].toString().trim().toLowerCase() : 'general';
      var categoryType = (targetGroupRaw === 'student' || targetGroupRaw === 'طالب' || targetGroupRaw === 'طلاب') ? 'student' :
                         (targetGroupRaw === 'member' || targetGroupRaw === 'عضو' || targetGroupRaw === 'أعضاء') ? 'member' : 'general';
      var usedByStr = values[i][10] ? values[i][10].toString().trim().toLowerCase() : '';
      var usedByContacts = usedByStr ? usedByStr.split(',').map(function(s) { return s.trim(); }).filter(Boolean) : [];
      var customerUsageLimit = values[i][11] !== '' && values[i][11] !== undefined ? parseInt(values[i][11]) : null;
      
      // أ. التحقق من تاريخ انتهاء الصلاحية
      if (expiryDate) {
        var todayStr = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd');
        if (todayStr > expiryDate) {
          return { valid: false, message: 'عذراً، هذا الكوبون منتهي الصلاحية 📅' };
        }
      }
      
      // ب. التحقق من عدد الاستخدام الكلي الأقصى
      if (usageLimit !== null && !isNaN(usageLimit) && usageCount >= usageLimit) {
        return { valid: false, message: 'عذراً، تم الوصول للحد الأقصى لاستخدام الكوبون 🛑' };
      }
      
      // ج. التحقق من الحد الأدنى للسلة
      if (subtotal !== undefined && subtotal !== null && subtotal < minSpend) {
        return { valid: false, message: 'الحد الأدنى للشراء لتفعيل الكود هو ' + minSpend + ' ريال' };
      }
      
      // د. التحقق من الاستخدام المتكرر لنفس العميل (إيميل أو هاتف)
      if (customerUsageLimit !== null && !isNaN(customerUsageLimit) && customerUsageLimit > 0) {
        var timesUsed = 0;
        if (email || phone) {
          var cleanContact = (email || phone || '').toString().trim().toLowerCase();
          for (var k = 0; k < usedByContacts.length; k++) {
            if (usedByContacts[k] === cleanContact) {
              timesUsed++;
            }
          }
        }
        if (timesUsed >= customerUsageLimit) {
          return { valid: false, message: 'لقد استنفدت الحد الأقصى لاستخدام هذا الكوبون المسموح للعميل الواحد (' + customerUsageLimit + ' مرات) 🛡️' };
        }
      } else {
        // حماية تراجعية: إذا كان الكوبون خاص بالطلاب أو الأعضاء ولم يحدد حد استخدام، يقتصر على مرة واحدة افتراضياً للعميل
        if (categoryType !== 'general' && (email || phone)) {
          var cleanContact = (email || phone || '').toString().trim().toLowerCase();
          if (usedByContacts.indexOf(cleanContact) !== -1) {
            return { valid: false, message: 'لقد استخدمت هذا الكوبون من قبل، وهو متاح لمرة واحدة فقط للعميل 🛡️' };
          }
        }
      }
      
      // هـ. التحقق من فئة الطلاب
      if (categoryType === 'student') {
        if (!studentId) {
          return {
            valid: true,
            discount: type === 'percentage' ? val : 0,
            message: 'كود طلابي مميز! سيتم التحقق من رقمك الطلابي عند إتمام الطلب 🎓',
            eligibleProducts: eligibleProducts,
            type: type,
            value: val,
            categoryType: 'student'
          };
        } else {
          var studentSheet = spreadsheet.getSheetByName('Students');
          if (!studentSheet) {
            return { valid: false, message: 'لا توجد ورقة الطلاب للتحقق ❌' };
          }
          var sLastRow = studentSheet.getLastRow();
          if (sLastRow < 2) {
            return { valid: false, message: 'سجل الطلاب فارغ بالنظام ❌' };
          }
          var sValues = studentSheet.getRange('A2:G' + sLastRow).getValues();
          var studentFound = false;
          var studentActive = false;
          for (var j = 0; j < sValues.length; j++) {
            var sId = sValues[j][0] ? sValues[j][0].toString().trim() : '';
            if (sId === studentId.trim()) {
              studentFound = true;
              var sStatus = sValues[j][6] ? sValues[j][6].toString().trim().toLowerCase() : 'active';
              if (sStatus === 'active' || sStatus === 'نعم' || sStatus === 'true' || sStatus === 'نشط') {
                studentActive = true;
              }
              break;
            }
          }
          if (!studentFound) {
            return { valid: false, message: 'الرقم الطلابي غير مسجل بالنظام ❌' };
          }
          if (!studentActive) {
            return { valid: false, message: 'الرقم الطلابي غير نشط أو موقف ❌' };
          }
        }
      }
      
      // و. التحقق من فئة الأعضاء
      if (categoryType === 'member') {
        if (email || phone) {
          var memberSheet = spreadsheet.getSheetByName('Members');
          if (!memberSheet) {
            return { valid: false, message: 'ورقة المشتركين غير متوفرة ❌' };
          }
          var mLastRow = memberSheet.getLastRow();
          var mValues = mLastRow >= 2 ? memberSheet.getRange('A2:C' + mLastRow).getValues() : [];
          var memberFound = false;
          for (var k = 0; k < mValues.length; k++) {
            var mEmail = mValues[k][1] ? mValues[k][1].toString().trim().toLowerCase() : '';
            var mPhone = mValues[k][2] ? mValues[k][2].toString().trim() : '';
            if (mEmail === email.toString().trim().toLowerCase() || mPhone === phone.toString().trim()) {
              memberFound = true;
              break;
            }
          }
          if (!memberFound) {
            return { valid: false, message: 'عذراً، هذا الكوبون مخصص للأعضاء المشتركين فقط 💎' };
          }
        }
      }
      
      return {
        valid: true,
        discount: type === 'percentage' ? val : 0,
        eligibleProducts: eligibleProducts,
        message: 'تم تطبيق كود الخصم بنجاح! ✅',
        type: type,
        value: val,
        categoryType: categoryType
      };
    }
  }
  return { valid: false, message: 'الكوبون المكتوب غير صحيح أو منتهي' };
}

// جلب قائمة الأكواد الترويجية بالكامل لمدير المتجر
function getPromoCodes() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName('PromoCodes');
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  
  // الأعمدة المحدثة بالترتيب: 
  // 0: code, 1: type, 2: value, 3: min_spend, 4: expiry_date, 5: usage_limit, 6: usage_count, 7: eligible_products, 8: is_active, 9: target_group, 10: used_contacts, 11: customer_usage_limit
  return sheet.getRange('A2:L' + lastRow).getValues().map(row => ({
    code: row[0].toString().trim(),
    type: row[1] ? row[1].toString().trim().toLowerCase() : 'percentage',
    value: parseFloat(row[2]) || 0,
    minSpend: parseFloat(row[3]) || 0,
    expiryDate: row[4] ? row[4].toString().trim() : '',
    usageLimit: row[5] !== '' && row[5] !== undefined ? parseInt(row[5]) : null,
    usageCount: parseInt(row[6]) || 0,
    eligibleProducts: row[7] || 'all',
    status: row[8] || 'active',
    categoryType: row[9] ? row[9].toString().trim().toLowerCase() : 'general',
    usedByContacts: row[10] ? row[10].toString().split(',').map(function(s) { return s.trim(); }).filter(Boolean) : [],
    customerUsageLimit: row[11] !== '' && row[11] !== undefined ? parseInt(row[11]) : null
  }));
}

// تجميع كافة البيانات للشيت لغرض المزامنة الكاملة
function getData() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // التحقق من وجود ورقة "نصوص" وإنشائها تلقائياً إذا لم تكن موجودة
  var textsSheet = spreadsheet.getSheetByName(\'نصوص\') || spreadsheet.getSheetByName(\'Texts\');
  if (!textsSheet) {
    textsSheet = spreadsheet.insertSheet(\'نصوص\');
    textsSheet.getRange(\'A1:C1\').setValues([[\'المعرف\', \'القيمة\', \'مكان النص أو الوصف\']]);
    textsSheet.getRange(\'A2:C28\').setValues([
      [\'logo_image\', \'\', \'رابط صورة شعار المتجر (اتركه فارغاً لاستخدام الحرف البديل)\'],
      [\'logo_letter\', \'خ\', \'الحرف البديل للشعار الدائري (مثل: خ, م, أ)\'],
      [\'brand_name\', \'خطاط\', \'اسم المتجر الرئيسي في الهيدر (مثل: خطاط)\'],
      [\'brand_subtitle\', \'للفنون والخط العربي\', \'الوصف الفرعي للمتجر في الهيدر (مثل: للفنون والخط العربي)\'],
      [\'hero_title\', \'موقع النخبة للخط العربي والزخرفة الإسلامية\', \'العنوان الترحيبي الكبير العريض في أعلى الصفحة الرئيسية\'],
      [\'hero_badge_text\', \'تحف فنية أصلية للخط العربي والزخرفة الإسلامية\', \'نص الشارة العلوية المضيئة في أعلى الهيدر\'],
      [\'hero_subtitle\', \'اقتنِ أجمل اللوحات والتحف الجدارية والمخطوطات الخاصة المصنوعة بأيدي أمهر الخطاطين المحترفين على مر الزمن لتزيين جدران بيتك بذكر الله.\', \'الوصف التوضيحي تحت العنوان الترحيبي الرئيسي\'],
      [\'search_placeholder\', \'ابحث عن لوحة آية الكرسي، أسماء الله الحسنى، أدوات...\', \'نص التلميح داخل صندوق البحث عن المنتجات\'],
      [\'category_all_text\', \'كل الأقسام والمعروضات\', \'النص الافتراضي لاختيار الأقسام\'],
      [\'tab_shop_text\', \'المتجر\', \'اسم زر تبويب المتجر في القائمة العلوية\'],
      [\'tab_members_text\', \'نادي العضوية\', \'اسم زر تبويب نادي العضوية في القائمة العلوية\'],
      [\'tab_admin_text\', \'لوحة الإدارة\', \'اسم زر تبويب لوحة الإدارة في القائمة العلوية\'],
      [\'discount_label_text\', \'خصم\', \'نص كلمة (خصم) المكتوبة بجانب نسبة التخفيض في كرت المنتج\'],
      [\'offers_title\', \'عروض وتخفيضات خاصة وحصرية\', \'عنوان قسم العروض والتخفيضات\'],
      [\'offers_subtitle\', \'فرصتك لاقتناء تحف فنية نادرة ومميزة بأسعار خاصة لفترة محدودة\', \'الوصف الفرعي تحت عنوان قسم العروض\'],
      [\'active_now_text\', \'نشط الآن\', \'شارة العرض النشط الآن\'],
      [\'category_pill_all_text\', \'الكل\', \'اسم زر التصفية الكل للأقسام\'],
      [\'footer_intro_text\', \'متجر متخصص بإنتاج وبيع اللوحات الجدارية الفاخرة للخط العربي والزخرفة الإسلامية، مكتوبة ومحفورة ومذهبة بأيدي خطاطين محترفين لتناسب الأذواق الرفيعة والمحترمة.\', \'النص التعريفي للمتجر في أسفل الصفحة فوتر\'],
      [\'footer_quick_links_title\', \'أقسام ومفاتيح سريعة\', \'عنوان قائمة الروابط السريعة في الفوتر\'],
      [\'footer_link_browse\', \'تصفح المعرض\', \'رابط تصفح المعرض في الفوتر\'],
      [\'footer_link_subscribe\', \'اشترك بالعضوية\', \'رابط الاشتراك بالعضوية في الفوتر\'],
      [\'footer_link_admin\', \'بوابة الإدارة\', \'رابط بوابة الإدارة في الفوتر\'],
      [\'footer_link_offers\', \'عروض وتخفيضات\', \'رابط عروض وتخفيضات في الفوتر\'],
      [\'footer_contact_title\', \'تواصل فوري ومتابعة\', \'عنوان قسم التواصل في الفوتر\'],
      [\'footer_contact_desc\', \'يسر خدمة العملاء والطلبات الخاصة استقبال تساؤلاتكم واستفساراتكم حول اللوحات المخصصة بالاسم طوال اليوم.\', \'وصف قسم التواصل في الفوتر\'],
      [\'footer_terms_of_use\', \'شروط الاستخدام\', \'رابط شروط الاستخدام في أسفل الصفحة\'],
      [\'footer_privacy_policy\', \'سياسة الخصوصية وتأمين البيانات\', \'رابط سياسة الخصوصية في أسفل الصفحة\']
    ]);
  }
  
  return {
    profile: spreadsheet.getSheetByName(\'Profile\') ? spreadsheet.getSheetByName(\'Profile\').getDataRange().getValues().slice(1) : [],
    contact: spreadsheet.getSheetByName(\'Contact\') ? spreadsheet.getSheetByName(\'Contact\').getDataRange().getValues().slice(1) : [],
    images: spreadsheet.getSheetByName(\'Images\') ? spreadsheet.getSheetByName(\'Images\').getDataRange().getValues().slice(1) : [],
    settings: spreadsheet.getSheetByName(\'Settings\') ? spreadsheet.getSheetByName(\'Settings\').getDataRange().getValues().slice(1) : [],
    promoCodes: spreadsheet.getSheetByName('PromoCodes') ? spreadsheet.getSheetByName('PromoCodes').getDataRange().getValues().slice(1) : [],
    orders: spreadsheet.getSheetByName('Orders') ? spreadsheet.getSheetByName('Orders').getDataRange().getValues().slice(1) : [],
    members: spreadsheet.getSheetByName('Members') ? spreadsheet.getSheetByName('Members').getDataRange().getValues().slice(1) : [],
    students: spreadsheet.getSheetByName('Students') ? spreadsheet.getSheetByName('Students').getDataRange().getValues().slice(1) : [],
    email: spreadsheet.getSheetByName('Email') ? spreadsheet.getSheetByName('Email').getDataRange().getValues().slice(1) : [],
    texts: textsSheet.getDataRange().getValues().slice(1)
  };
}

// استقبال وتسجيل وإتمام طلب شراء جديد بالكامل وإرسال إشعارات التلجرام والبريد الإلكتروني
function submitOrder(order) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var orderSheet = spreadsheet.getSheetByName(\'Orders\');
  if (!orderSheet) {
    orderSheet = spreadsheet.insertSheet(\'Orders\');
    orderSheet.getRange(\'A1:L1\').setValues([[\'رقم الطلب\', \'تاريخ ووقت الإرسال\', \'الاسم\', \'العنوان\', \'رقم الهاتف\', \'البريد الإلكتروني\', \'المنتجات\', \'الكميات\', \'المبلغ الكلي\', \'كود الخصم\', \'حالة التلجرام\', \'رابط الفاتورة PDF\']]);
  }
  
  var orderId = \'ORD\' + Utilities.formatDate(new Date(), \'GMT+7\', \'yyyyMMddHHmmss\') + Math.floor(Math.random() * 1000);
  var timestamp = Utilities.formatDate(new Date(), \'GMT+7\', \'yyyy-MM-dd HH:mm:ss\');
  
  var productsList = [];
  var quantitiesList = [];
  var totalAmount = 0;
  
  var items = order.items || [];
  for (var i = 0; i < items.length; i++) {
    productsList.push(items[i].title);
    quantitiesList.push(items[i].quantity);
    var itemPrice = items[i].finalPrice || items[i].discountedPrice || items[i].price || 0;
    totalAmount += (itemPrice * items[i].quantity);
  }
  
  var productsStr = productsList.join(', ');
  var quantitiesStr = quantitiesList.join(', ');
  
  var promoCode = order.promoCode || '';
  if (promoCode) {
    var promo = validatePromoCode(promoCode, order.email, order.phone, totalAmount, order.studentId);
    if (promo && !promo.valid) {
      return { status: 'error', message: promo.message || 'كود الخصم غير صالح للتطبيق أو استنفد الحد الأقصى للاستخدام' };
    }
    if (promo && promo.valid) {
      if (promo.type === 'percentage') {
        totalAmount = totalAmount * (1 - promo.value);
      } else if (promo.type === 'fixed') {
        totalAmount = Math.max(0, totalAmount - promo.value);
      } else if (promo.type === 'shipping') {
        totalAmount = totalAmount; // شحن مجاني
      }
      
      // زيادة عدد استخدامات الكوبون وتحديث سجل العملاء في الشيت
      try {
        var promoSheet = spreadsheet.getSheetByName('PromoCodes');
        if (promoSheet) {
          var pRows = promoSheet.getLastRow();
          var pCodes = pRows >= 2 ? promoSheet.getRange('A2:A' + pRows).getValues() : [];
          for (var pIdx = 0; pIdx < pCodes.length; pIdx++) {
            if (pCodes[pIdx][0].toString().trim().toUpperCase() === promoCode.toUpperCase().trim()) {
              var rNum = pIdx + 2;
              
              // زيادة العداد الكلي للخصومات (العمود G أي العمود رقم 7)
              var currentCountVal = parseInt(promoSheet.getRange(rNum, 7).getValue()) || 0;
              promoSheet.getRange(rNum, 7).setValue(currentCountVal + 1);
              
              // إضافة بيانات اتصال العميل (العمود K أي العمود رقم 11) - نضعه في K مفصولاً لكي لا يلخبط مع العمود J فئة الاستهداف
              var cleanContact = (order.email || order.phone || '').toString().trim().toLowerCase();
              if (cleanContact) {
                var currentContactsStr = promoSheet.getRange(rNum, 11).getValue().toString().trim();
                var currentContactsList = currentContactsStr ? currentContactsStr.split(',').map(function(s) { return s.trim().toLowerCase(); }).filter(Boolean) : [];
                currentContactsList.push(cleanContact);
                promoSheet.getRange(rNum, 11).setValue(currentContactsList.join(', '));
              }
              break;
            }
          }
        }
      } catch (incrementErr) {
        Logger.log('فشل تحديث استخدامات الكوبون في الشيت: ' + incrementErr.message);
      }
      
      // زيادة عدد استخدامات الطالب في ورقة الطلاب إن وُجد رقم طالب
      try {
        var actualStudentId = order.studentId || '';
        if (!actualStudentId && promoCode) {
          var studentSheet = spreadsheet.getSheetByName('Students');
          if (studentSheet) {
            var sLastRow = studentSheet.getLastRow();
            if (sLastRow >= 2) {
              var sIds = studentSheet.getRange('A2:A' + sLastRow).getValues();
              for (var sIdx = 0; sIdx < sIds.length; sIdx++) {
                if (sIds[sIdx][0].toString().trim().toUpperCase() === promoCode.toUpperCase().trim()) {
                  actualStudentId = promoCode;
                  break;
                }
              }
            }
          }
        }
        
        if (actualStudentId) {
          var studentSheet = spreadsheet.getSheetByName('Students');
          if (studentSheet) {
            var sLastRow = studentSheet.getLastRow();
            if (sLastRow >= 2) {
              var sValues = studentSheet.getRange('A2:A' + sLastRow).getValues();
              for (var sIdx = 0; sIdx < sValues.length; sIdx++) {
                if (sValues[sIdx][0].toString().trim().toUpperCase() === actualStudentId.toString().trim().toUpperCase()) {
                  var sRow = sIdx + 2;
                  // زيادة العداد في العمود F (العمود رقم 6)
                  var currentUsedCount = parseInt(studentSheet.getRange(sRow, 6).getValue()) || 0;
                  studentSheet.getRange(sRow, 6).setValue(currentUsedCount + 1);
                  break;
                }
              }
            }
          }
        }
      } catch (studentIncrementErr) {
        Logger.log('فشل تحديث عدد استخدامات الطالب في الشيت: ' + studentIncrementErr.message);
      }
    }
  }
  
  var settings = getSettings();
  var botToken = settings.botToken || \'\';
  var chatId = settings.chatId || \'\';
  var telegramSentStatus = \'لم يتم الإعداد\';
  
  // 1. إرسال إشعار التلجرام الفوري
  if (botToken && chatId && botToken !== \'YOUR_TELEGRAM_BOT_TOKEN\' && chatId !== \'YOUR_TELEGRAM_CHAT_ID\') {
    try {
      var message = "🔔 *طلب شراء جديد من متجر النخبة!*\\n\\n" +
                    "👤 *العميل:* " + order.name + "\\n" +
                    "📞 *الهاتف:* " + order.phone + "\\n" +
                    "📍 *العنوان:* " + order.address + "\\n" +
                    "📧 *الإيميل:* " + order.email + "\\n\\n" +
                    "🛍 *المنتجات:* " + productsStr + "\\n" +
                    "🔢 *الكميات:* " + quantitiesStr + "\\n" +
                    "💰 *الإجمالي:* " + totalAmount.toFixed(2) + " ฿\\n" +
                    "🎫 *الكوبون:* " + (promoCode ? promoCode : "لا يوجد") + "\\n" +
                    "🆔 *رقم الطلب:* \`" + orderId + "\`";
      
      var url = \'https://api.telegram.org/bot\' + botToken + \'/sendMessage\';
      var payload = {
        \'chat_id\': chatId,
        \'text\': message,
        \'parse_mode\': \'Markdown\'
      };
      
      var options = {
        \'method\': \'post\',
        \'contentType\': \'application/json\',
        \'payload\': JSON.stringify(payload),
        \'muteHttpExceptions\': true
      };
      
      UrlFetchApp.fetch(url, options);
      telegramSentStatus = \'تم الإرسال للتلغرام ✅\';
    } catch (e) {
      telegramSentStatus = \'فشل الإرسال: \' + e.message;
    }
  }

  // 2. تسجيل وتوثيق الطلب بالكامل في شيت Orders أولاً قبل توليد الـ PDF
  // هذا يضمن أن السكربتات الخارجية المرتبطة بالقالب يمكنها العثور على رقم الطلب في ورقة Orders عند فتح المستند وتوليد الفاتورة
  orderSheet.appendRow([
    orderId,
    timestamp,
    order.name,
    order.address,
    order.phone,
    order.email,
    productsStr,
    quantitiesStr,
    totalAmount,
    promoCode,
    telegramSentStatus,
    \'جاري توليد الفاتورة...\'
  ]);
  
  var lastRow = orderSheet.getLastRow();
  
  // 3. توليد ملف الفاتورة PDF وحفظه في مجلد Google Drive
  var pdfLink = \'#\';
  var pdfFile = null;
  
  try {
    var pdfResult = generateAndSavePDF(orderId, order, totalAmount);
    if (pdfResult && pdfResult.status === \'success\') {
      pdfLink = pdfResult.pdfUrl;
      pdfFile = pdfResult.file;
    } else if (pdfResult && pdfResult.status === \'error\') {
      pdfLink = \'فشل: \' + pdfResult.message;
    }
  } catch (e) {
    pdfLink = \'خطأ: \' + e.message;
    Logger.log(\'خطأ في توليد الـ PDF: \' + e.message);
  }
  
  // تحديث رابط الـ PDF في ورقة Orders (العمود رقم 12 هو العمود L)
  try {
    orderSheet.getRange(lastRow, 12).setValue(pdfLink);
  } catch (setValErr) {
    Logger.log(\'فشل تحديث رابط الـ PDF في الشيت: \' + setValErr.message);
  }
  
  // 4. إرسال البريد الإلكتروني لتأكيد الطلب للعميل وصاحب المتجر مع ملف PDF المرفق
  try {
    sendEmailConfirmation(orderId, order, pdfFile, totalAmount);
  } catch (emailErr) {
    Logger.log(\'فشل إرسال إيميل التأكيد: \' + emailErr.message);
  }
  
  return { status: \'success\', orderId: orderId, telegramSent: telegramSentStatus, pdfLink: pdfLink };
}

// توليد الفاتورة الاحترافية بالاعتماد على قالب مستند جوجل المخصص
function generateAndSavePDF(orderId, order, finalTotalAmount) {
  try {
    var settings = getSettings();
    if (!settings.templateId || !settings.folderUrl) {
      return { status: \'error\', message: \'قالب الفاتورة أو المجلد غير مهيأ في الإعدادات\' };
    }
    
    var templateId = extractIdFromUrl(settings.templateId);
    var folderId = extractIdFromUrl(settings.folderUrl);
    
    if (!templateId) {
      return { status: \'error\', message: \'معرف قالب الفاتورة غير صالح أو فارغ\' };
    }
    if (!folderId) {
      return { status: \'error\', message: \'معرف مجلد الحفظ غير صالح أو فارغ\' };
    }
    
    var tempDoc = DriveApp.getFileById(templateId).makeCopy(\'Temp_Bill_\' + orderId, DriveApp.getFolderById(folderId));
    var doc = DocumentApp.openById(tempDoc.getId());
    var body = doc.getBody();
    
    body.replaceText(\'{{orderId}}\', orderId);
    body.replaceText(\'{{name}}\', order.name || \'\');
    body.replaceText(\'{{phone}}\', order.phone || \'\');
    body.replaceText(\'{{address}}\', order.address || \'\');
    body.replaceText(\'{{email}}\', order.email || \'\');
    
    var items = order.items || [];
    var originalTotal = items.reduce(function(sum, item) {
      return sum + ((item.finalPrice || item.discountedPrice || item.price || 0) * (item.quantity || 1));
    }, 0);
    
    var totalVal = (finalTotalAmount !== undefined && finalTotalAmount !== null) ? finalTotalAmount : originalTotal;
    body.replaceText(\'{{totalAmount}}\', Number(totalVal).toFixed(2));
    
    var tableText = items.map(function(item) {
      return (item.title || \'غير معروف\') + \' (x\' + (item.quantity || 1) + \') - \' + ((item.finalPrice || item.discountedPrice || item.price || 0) * (item.quantity || 1)).toFixed(2) + \' ฿\';
    }).join(\'\\n\');
    
    var discountVal = originalTotal - totalVal;
    if (discountVal > 0.01) {
      tableText += \'\\n----------------------------------\\n\' +
                   \'المجموع الفرعي: \' + originalTotal.toFixed(2) + \' ฿\\n\' +
                   \'خصم الكوبون (\' + (order.promoCode || \'\') + \'): -\' + discountVal.toFixed(2) + \' ฿\\n\' +
                   \'المبلغ النهائي: \' + totalVal.toFixed(2) + \' ฿\';
    }
    
    body.replaceText(\'{{items}}\', tableText);
    
    doc.saveAndClose();
    var pdfBlob = tempDoc.getAs(MimeType.PDF);
    var pdfFile = DriveApp.getFolderById(folderId).createFile(pdfBlob).setName(\'Invoice_\' + orderId + \'.pdf\');
    tempDoc.setTrashed(true);
    pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return { status: \'success\', file: pdfFile, pdfUrl: pdfFile.getUrl() };
  } catch (e) {
    Logger.log(\'PDF Generation Error: \' + e.message);
    return { status: \'error\', message: e.message };
  }
}

function extractIdFromUrl(urlOrId) {
  if (!urlOrId) return \'\';
  urlOrId = String(urlOrId).trim();
  
  // If it\'s a URL with "/folders/"
  var foldersMatch = urlOrId.match(/\\/folders\\/([a-zA-Z0-9_-]+)/);
  if (foldersMatch && foldersMatch[1]) {
    return foldersMatch[1];
  }
  
  // If it\'s a URL with "/d/"
  var dMatch = urlOrId.match(/\\/d\\/([a-zA-Z0-9_-]+)/);
  if (dMatch && dMatch[1]) {
    return dMatch[1];
  }
  
  // If it\'s a URL with "?id="
  var idParamMatch = urlOrId.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1]) {
    return idParamMatch[1];
  }
  
  // Fallback to finding any contiguous 25+ char alphanumeric sequence
  var sequenceMatch = urlOrId.match(/[-\\w]{25,}/);
  if (sequenceMatch && sequenceMatch[0]) {
    return sequenceMatch[0];
  }
  
  return urlOrId;
}

// إعداد وصياغة محتوى البريد الإلكتروني للعميل والمدير بأعلى احترافية وأمان
function sendEmailConfirmation(orderId, order, pdfFile, finalTotalAmount) {
  try {
    var settings = getSettings();
    var timestamp = Utilities.formatDate(new Date(), \'GMT+7\', \'yyyy-MM-dd HH:mm:ss\');
    var promoCode = order.promoCode || \'\';
    
    var originalTotal = order.items.reduce(function(sum, item) {
      var price = Number(item.finalPrice || item.discountedPrice || item.price || 0);
      var qty = Number(item.quantity || 1);
      return sum + (price * qty);
    }, 0);

    var totalVal = (finalTotalAmount !== undefined && finalTotalAmount !== null) ? finalTotalAmount : originalTotal;
    var discountAmount = originalTotal - totalVal;

    // تجهيز جدول المنتجات لعرضه في الإيميل بشكل أنيق ومنسق جداً
    var productsHtmlTable = 
      \'<table border="1" style="border-collapse: collapse; width: 100%; text-align: right;" dir="rtl">\' +
        \'<tr style="background-color: #f2f2f2; color: #1c1917; font-weight: bold;">\' +
          \'<th style="padding: 10px;">المنتج</th>\' +
          \'<th style="padding: 10px; text-align: center;">سعر الوحدة</th>\' +
          \'<th style="padding: 10px; text-align: center;">الكمية</th>\' +
          \'<th style="padding: 10px; text-align: center;">الإجمالي</th>\' +
        \'</tr>\';
    
    order.items.forEach(function(item) {
      var price = Number(item.finalPrice || item.discountedPrice || item.price || 0);
      var qty = Number(item.quantity || 1);
      productsHtmlTable += 
        \'<tr>\' +
          \'<td style="padding: 8px;">\' + String(item.title || \'\') + \'</td>\' +
          \'<td style="padding: 8px; text-align: center;">\' + price.toFixed(0) + \' ฿</td>\' +
          \'<td style="padding: 8px; text-align: center;">\' + qty.toFixed(0) + \'</td>\' +
          \'<td style="padding: 8px; text-align: center;">\' + (price * qty).toFixed(0) + \' ฿</td>\' +
        \'</tr>\';
    });
    
    if (discountAmount > 0.01) {
      productsHtmlTable += 
        \'<tr style="font-weight: bold; background-color: #fcfbfa;">\' +
          \'<td colspan="3" style="padding: 10px; text-align: right;">المجموع الفرعي</td>\' +
          \'<td style="padding: 10px; text-align: center;">\' + originalTotal.toFixed(0) + \' ฿</td>\' +
        \'</tr>\' +
        \'<tr style="font-weight: bold; background-color: #fee2e2; color: #b91c1c;">\' +
          \'<td colspan="3" style="padding: 10px; text-align: right;">خصم الكوبون (\' + promoCode + \')</td>\' +
          \'<td style="padding: 10px; text-align: center;">-\' + discountAmount.toFixed(0) + \' ฿</td>\' +
        \'</tr>\';
    }

    productsHtmlTable += 
      \'<tr style="font-weight: bold; background-color: #fcfbfa;">\' +
        \'<td colspan="3" style="padding: 10px; text-align: right;">المبلغ الإجمالي كلياً</td>\' +
        \'<td style="padding: 10px; text-align: center; color: #c5a850;">\' + totalVal.toFixed(0) + \' ฿</td>\' +
      \'</tr>\' +
    \'</table>\';

    // 1. إرسال البريد الإلكتروني لتأكيد الطلب للعميل
    var targetCustomerEmail = String(order.email || \'\').trim();
    if (targetCustomerEmail && /^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(targetCustomerEmail)) {
      try {
        var customerBody = 
          \'<div dir="rtl" style="font-family: \\'Cairo\\', \\'Segoe UI\\', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e5e5; border-radius: 16px; padding: 24px; background-color: #fcfbfa; color: #1c1917;">\' +
            \'<div style="text-align: center; margin-bottom: 24px; border-bottom: 2px solid #d6bf77; padding-bottom: 16px;">\' +
              \'<h2 style="color: #1c1917; font-family: serif; font-size: 24px; margin: 0;">شكراً لثقتك وتسوقك معنا! 🎉</h2>\' +
              \'<p style="font-size: 14px; color: #78716c; margin: 8px 0 0 0;">تم استلام طلبك بنجاح وجاري العمل على تجهيزه</p>\' +
            \'</div>\' +
            \'<p>عزيزنا العميل <strong>\' + order.name + \'</strong>، تم تسجيل طلبك بنجاح بالمتجر.</p>\' +
            \'<p>إليك تفاصيل الطلب الخاص بك ومرفق معه فاتورة PDF للتفاصيل المالية:</p>\' +
            
            \'<div style="background-color: #faf9f6; padding: 15px; border-radius: 8px; border: 1px solid #f3f2ed; margin: 20px 0;">\' +
              \'<p style="margin: 4px 0;"><strong>رقم الطلب:</strong> <span style="font-family: monospace; font-weight: bold; color: #c5a850;">\' + orderId + \'</span></p>\' +
              \'<p style="margin: 4px 0;"><strong>التاريخ والوقت:</strong> \' + timestamp + \'</p>\' +
              \'<p style="margin: 4px 0;"><strong>رقم الجوال:</strong> \' + order.phone + \'</p>\' +
              \'<p style="margin: 4px 0;"><strong>العنوان المستهدف بالشحن:</strong> \' + order.address + \'</p>\' +
              \'<p style="margin: 4px 0;"><strong>كوبون الخصم:</strong> \' + (promoCode ? promoCode : \'لا يوجد\') + \'</p>\' +
            \'</div>\' +
            
            \'<h3 style="color: #1c1917; font-size: 18px; margin-top: 24px;">المنتجات المطلوبة:</h3>\' +
            productsHtmlTable +
            
            \'<p style="margin-top: 24px;">سنقوم بالتواصل معك قريباً جداً عبر الهاتف أو LINE لتأكيد موعد التسليم والشحن.</p>\' +
            \'<p style="color: #059669; font-weight: bold; text-align: center; margin: 24px 0;">شكرًا لاختيارك الفن والخط العربي الأصيل! ❤️</p>\' +
            
            \'<div style="text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px dashed #d6bf77; font-size: 12px; color: #78716c;">\' +
              \'<p style="margin: 0;">متجر النخبة للخط العربي والزخرفة الإسلامية</p>\' +
              (settings.lineUrl ? \'<p style="margin: 4px 0;"><a href="\' + settings.lineUrl + \'" style="color: #c5a850; text-decoration: none;">تواصل معنا عبر LINE</a></p>\' : \'\') +
            \'</div>\' +
          \'</div>\';

        var customerAttachments = [];
        if (pdfFile) {
          customerAttachments.push(pdfFile.getBlob());
        }
        
        sendEmailHelper(targetCustomerEmail, \'تأكيد طلبك رقم \' + orderId + \' من متجر النخبة 🧾\', customerBody, customerAttachments);
      } catch (custErr) {
        Logger.log(\'خطأ في إرسال بريد الزبون: \' + custErr.message);
      }
    }

    // 2. إرسال البريد الإلكتروني للمشرف (صاحب المتجر)
    if (settings.recipientEmail) {
      try {
        var adminBody = 
          \'<div dir="rtl" style="font-family: \\'Cairo\\', \\'Segoe UI\\', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e5e5; border-radius: 16px; padding: 24px; background-color: #fcfbfa; color: #1c1917;">\' +
            \'<div style="text-align: center; margin-bottom: 24px; border-bottom: 2px solid #d6bf77; padding-bottom: 16px;">\' +
              \'<h2 style="color: #1c1917; font-family: serif; font-size: 24px; margin: 0;">طلب شراء جديد بالمتجر! 🔔</h2>\' +
              \'<p style="font-size: 14px; color: #78716c; margin: 8px 0 0 0;">تم استلام وتوثيق طلب شراء جديد بقاعدة البيانات</p>\' +
            \'</div>\' +
            \'<p>مرحباً بك، لقد تلقيت طلب شراء جديد بالمتجر. إليك البيانات المباشرة للعميل والتفاصيل المالية للفاتورة:</p>\' +
            
            \'<div style="background-color: #faf9f6; padding: 15px; border-radius: 8px; border: 1px solid #f3f2ed; margin: 20px 0;">\' +
              \'<p style="margin: 4px 0;"><strong>رقم الطلب:</strong> <span style="font-family: monospace; font-weight: bold; color: #c5a850;">\' + orderId + \'</span></p>\' +
              \'<p style="margin: 4px 0;"><strong>تاريخ الطلب:</strong> \' + timestamp + \'</p>\' +
              \'<p style="margin: 4px 0;"><strong>اسم العميل:</strong> \' + order.name + \'</p>\' +
              \'<p style="margin: 4px 0;"><strong>رقم الجوال:</strong> \' + order.phone + \'</p>\' +
              \'<p style="margin: 4px 0;"><strong>البريد الإلكتروني:</strong> \' + order.email + \'</p>\' +
              \'<p style="margin: 4px 0;"><strong>عنوان التوصيل:</strong> \' + order.address + \'</p>\' +
              \'<p style="margin: 4px 0;"><strong>كوبون الخصم:</strong> \' + (promoCode ? promoCode : \'لا يوجد\') + \'</p>\' +
            \'</div>\' +
            
            \'<h3 style="color: #1c1917; font-size: 18px; margin-top: 24px;">المنتجات المطلوبة:</h3>\' +
            productsHtmlTable +
            
            \'<p style="margin-top: 24px; font-weight: bold; color: #c5a850;">تجد نسخة رسمية من فاتورة العميل PDF مرفقة مع هذا البريد ومحفوظة بمجلد الفواتير في Google Drive.</p>\' +
          \'</div>\';

        var adminAttachments = [];
        if (pdfFile) {
          adminAttachments.push(pdfFile.getBlob());
        }
        
        sendEmailHelper(settings.recipientEmail, \'طلب شراء جديد رقم \' + orderId + \' 🔔\', adminBody, adminAttachments);
      } catch (adminErr) {
        Logger.log(\'خطأ في إرسال بريد المشرف: \' + adminErr.message);
      }
    }
  } catch (err) {
    Logger.log(\'خطأ عام في نظام البريد الإلكتروني: \' + err.message);
  }
}

// دالة مساعدة عامة لإرسال البريد الإلكتروني مع إمكانية إرفاق ملفات ومراعاة الحصص والأخطاء
function sendEmailHelper(to, subject, htmlBody, attachments) {
  var cleanTo = String(to || \'\').trim();
  if (!cleanTo) {
    Logger.log(\'إلغاء الإرسال: الإيميل فارغ\');
    return;
  }
  
  var plainText = \'شكراً لتواصلك مع متجر النخبة للخط العربي الفاخر. تم استلام رسالتك وتفاصيل طلبك بنجاح. سنقوم بمتابعة طلبك والتواصل معك عبر الهاتف أو LINE قريباً جداً.\';
  
  var options = {
    htmlBody: htmlBody,
    name: \'متجر النخبة للخط العربي\'
  };
  if (attachments && attachments.length > 0) {
    options.attachments = attachments;
  }
  
  try {
    GmailApp.sendEmail(cleanTo, subject, plainText, options);
    Logger.log(\'تم إرسال الإيميل بنجاح عبر GmailApp إلى: \' + cleanTo);
  } catch (e) {
    Logger.log(\'فشل الإرسال عبر GmailApp: \' + e.message + \'. جاري المحاولة عبر MailApp...\');
    try {
      var mailOptions = {
        to: cleanTo,
        subject: subject,
        body: plainText,
        htmlBody: htmlBody,
        name: \'متجر النخبة للخط العربي\'
      };
      if (attachments && attachments.length > 0) {
        mailOptions.attachments = attachments;
      }
      MailApp.sendEmail(mailOptions);
      Logger.log(\'تم إرسال الإيميل بنجاح عبر MailApp إلى: \' + cleanTo);
    } catch (e2) {
      Logger.log(\'فشل الإرسال كلياً: \' + e2.message);
    }
  }
}

// الدوال المساعدة لاستخراج المعرفات
function extractFileId(url) {
  var regex = /\\/d\\/([a-zA-Z0-9_-]+)/;
  var match = String(url).match(regex);
  return match && match[1] ? match[1] : url;
}

function extractYouTubeId(url) {
  var regex = /(?:youtube\\.com\\/(?:[^\\/]+\\/.+\\/|(?:v|e(?:mbed)?)\\/|.*[?&]v=)|youtu\\.be\\/)([a-zA-Z0-9_-]{11})/;
  var match = String(url).match(regex);
  return match && match[1] ? match[1] : null;
}

function getEmailContent() {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var emailSheet = spreadsheet.getSheetByName('Email');
    if (!emailSheet) {
      Logger.log('ورقة Email غير موجودة، سيتم إنشاؤها');
      emailSheet = spreadsheet.insertSheet('Email');
      emailSheet.getRange('A1:C1').setValues([['Type', 'Content/Link', 'Description']]);
      return { additionalContent: [], labels: {} };
    }
    var lastRow = emailSheet.getLastRow();
    if (lastRow < 2) {
      Logger.log('ورقة Email فارغة');
      return { additionalContent: [], labels: {} };
    }
    var range = emailSheet.getRange('A2:C' + lastRow);
    var values = range.getValues();
    var additionalContent = [];
    var labels = {};
    for (var i = 0; i < values.length; i++) {
      var type = values[i][0] ? values[i][0].toString().trim().toLowerCase() : '';
      var content = values[i][1] ? values[i][1].toString().trim() : '';
      var description = values[i][2] ? values[i][2].toString().trim() : '';
      if (type && content) {
        if (type === 'label') {
          labels[description] = content;
        } else if (type === 'image' || type === 'pdf') {
          var fileId = extractFileId(content);
          if (!fileId) {
            Logger.log('رابط غير صالح في ورقة Email، الصف ' + (i + 2) + ': ' + content);
            continue;
          }
          additionalContent.push({
            type: type,
            fileId: fileId,
            description: description || 'مرفق إضافي'
          });
        } else if (type === 'text') {
          additionalContent.push({
            type: type,
            content: content,
            description: description || 'نص إضافي'
          });
        }
      }
    }
    Logger.log('Email content and labels retrieved: ' + JSON.stringify({ additionalContent: additionalContent, labels: labels }));
    return { additionalContent: additionalContent, labels: labels };
  } catch (error) {
    Logger.log('Error retrieving email content and labels: ' + error);
    return { additionalContent: [], labels: {} };
  }
}

function getCustomerEmailContent() {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var emailSheet = spreadsheet.getSheetByName('Email-Customer');
    if (!emailSheet) {
      Logger.log('ورقة Email-Customer غير موجودة، سيتم إنشاؤها');
      emailSheet = spreadsheet.insertSheet('Email-Customer');
      emailSheet.getRange('A1:C1').setValues([['Type', 'Content/Link', 'Description']]);
      return { additionalContent: [], labels: {} };
    }
    var lastRow = emailSheet.getLastRow();
    if (lastRow < 2) {
      Logger.log('ورقة Email-Customer فارغة');
      return { additionalContent: [], labels: {} };
    }
    var range = emailSheet.getRange('A2:C' + lastRow);
    var values = range.getValues();
    var additionalContent = [];
    var labels = {};
    for (var i = 0; i < values.length; i++) {
      var type = values[i][0] ? values[i][0].toString().trim().toLowerCase() : '';
      var content = values[i][1] ? values[i][1].toString().trim() : '';
      var description = values[i][2] ? values[i][2].toString().trim() : '';
      if (type && content) {
        if (type === 'label') {
          labels[description] = content;
        } else if (type === 'image' || type === 'pdf') {
          var fileId = extractFileId(content);
          if (!fileId) {
            Logger.log('رابط غير صالح في ورقة Email-Customer، الصف ' + (i + 2) + ': ' + content);
            continue;
          }
          additionalContent.push({
            type: type,
            fileId: fileId,
            description: description || 'مرفق إضافي'
          });
        } else if (type === 'text') {
          additionalContent.push({
            type: type,
            content: content,
            description: description || 'نص إضافي'
          });
        }
      }
    }
    Logger.log('Customer email content and labels retrieved: ' + JSON.stringify({ additionalContent: additionalContent, labels: labels }));
    return { additionalContent: additionalContent, labels: labels };
  } catch (error) {
    Logger.log('Error retrieving customer email content and labels: ' + error);
    return { additionalContent: [], labels: {} };
  }
}
`;

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

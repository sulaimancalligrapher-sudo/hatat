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
    setAdminNotify('تمت إضافة كود الخصم بنجاح');
    setTimeout(() => setAdminNotify(null), 4000);
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
      response = validatePromoCode(postData.code);
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

// التحقق من كود الخصم في شيت PromoCodes
function validatePromoCode(code) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(\'PromoCodes\');
  if (!sheet) return { valid: false, message: \'لا توجد ورقة خصومات\' };
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { valid: false, message: \'لا توجد أكواد حالياً\' };
  
  var values = sheet.getRange(\'A2:D\' + lastRow).getValues();
  for (var i = 0; i < values.length; i++) {
    if (values[i][0].toString().trim().toUpperCase() === code.toUpperCase()) {
      if (values[i][3].toString().trim().toLowerCase() !== \'active\') {
        return { valid: false, message: \'الكود معطل حالياً\' };
      }
      var discount = parseFloat(values[i][1]) || 0.1;
      return {
        valid: true,
        discount: discount,
        eligibleProducts: values[i][2] || \'all\',
        message: \'تم تفعيل الكود الترويجي بنجاح! ✅\'
      };
    }
  }
  return { valid: false, message: \'الكوبون المكتوب غير صالح\' };
}

// جلب قائمة الأكواد الترويجية بالكامل لمدير المتجر
function getPromoCodes() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(\'PromoCodes\');
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(\'A2:D\' + lastRow).getValues().map(row => ({
    code: row[0].toString().trim(),
    discount: parseFloat(row[1]) || 0.1,
    eligibleProducts: row[2] || \'all\',
    status: row[3] || \'active\'
  }));
}

// تجميع كافة البيانات للشيت لغرض المزامنة الكاملة
function getData() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return {
    profile: spreadsheet.getSheetByName(\'Profile\') ? spreadsheet.getSheetByName(\'Profile\').getDataRange().getValues().slice(1) : [],
    contact: spreadsheet.getSheetByName(\'Contact\') ? spreadsheet.getSheetByName(\'Contact\').getDataRange().getValues().slice(1) : [],
    images: spreadsheet.getSheetByName(\'Images\') ? spreadsheet.getSheetByName(\'Images\').getDataRange().getValues().slice(1) : [],
    settings: spreadsheet.getSheetByName(\'Settings\') ? spreadsheet.getSheetByName(\'Settings\').getDataRange().getValues().slice(1) : [],
    promoCodes: spreadsheet.getSheetByName(\'PromoCodes\') ? spreadsheet.getSheetByName(\'PromoCodes\').getDataRange().getValues().slice(1) : [],
    email: spreadsheet.getSheetByName(\'Email\') ? spreadsheet.getSheetByName(\'Email\').getDataRange().getValues().slice(1) : [],
    orders: spreadsheet.getSheetByName(\'Orders\') ? spreadsheet.getSheetByName(\'Orders\').getDataRange().getValues().slice(1) : [],
    members: spreadsheet.getSheetByName(\'Members\') ? spreadsheet.getSheetByName(\'Members\').getDataRange().getValues().slice(1) : []
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
  
  var promoCode = order.promoCode || \'\';
  if (promoCode) {
    var promo = validatePromoCode(promoCode);
    if (promo && promo.valid) {
      totalAmount = totalAmount * (1 - promo.discount);
    }
  }
  
  var productsStr = productsList.join(\', \');
  var quantitiesStr = quantitiesList.join(\', \');
  
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

  // 2. توليد ملف الفاتورة PDF وحفظه في مجلد Google Drive
  var pdfLink = \'#\';
  var pdfFile = null;
  
  try {
    var pdfResult = generateAndSavePDF(orderId, order);
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
  
  // 3. إرسال البريد الإلكتروني لتأكيد الطلب للعميل وصاحب المتجر مع ملف PDF المرفق
  try {
    sendEmailConfirmation(orderId, order, pdfFile);
  } catch (emailErr) {
    Logger.log(\'فشل إرسال إيميل التأكيد: \' + emailErr.message);
  }
  
  // 4. تسجيل وتوثيق الطلب بالكامل في شيت Orders
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
    pdfLink
  ]);
  
  return { status: \'success\', orderId: orderId, telegramSent: telegramSentStatus, pdfLink: pdfLink };
}

// توليد الفاتورة الاحترافية بالاعتماد على قالب مستند جوجل المخصص
function generateAndSavePDF(orderId, order) {
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
    var total = items.reduce(function(sum, item) {
      return sum + ((item.finalPrice || item.discountedPrice || item.price || 0) * (item.quantity || 1));
    }, 0);
    body.replaceText(\'{{totalAmount}}\', total.toFixed(2));
    
    var tableText = items.map(function(item) {
      return (item.title || \'غير معروف\') + \' (x\' + (item.quantity || 1) + \') - \' + ((item.finalPrice || item.discountedPrice || item.price || 0) * (item.quantity || 1)).toFixed(2) + \' ฿\';
    }).join(\'\\n\');
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
function sendEmailConfirmation(orderId, order, pdfFile) {
  try {
    var settings = getSettings();
    var timestamp = Utilities.formatDate(new Date(), \'GMT+7\', \'yyyy-MM-dd HH:mm:ss\');
    var promoCode = order.promoCode || \'\';
    
    var totalAmount = order.items.reduce(function(sum, item) {
      var price = Number(item.finalPrice || item.discountedPrice || item.price || 0);
      var qty = Number(item.quantity || 1);
      return sum + (price * qty);
    }, 0);

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
    
    productsHtmlTable += 
      \'<tr style="font-weight: bold; background-color: #fcfbfa;">\' +
        \'<td colspan="3" style="padding: 10px; text-align: right;">المبلغ الإجمالي كلياً</td>\' +
        \'<td style="padding: 10px; text-align: center; color: #c5a850;">\' + totalAmount.toFixed(0) + \' ฿</td>\' +
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

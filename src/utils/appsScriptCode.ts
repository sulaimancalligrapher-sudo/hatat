/**
 * Utility function to generate the Google Apps Script backend code.
 * Extracted into a separate file for optimal code splitting, clean architecture, and instant rendering.
 */
export const getAppsScriptCode = (): string => {
  return `/**
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
      '<div dir="rtl" style="font-family: Cairo, Segoe UI, Tahoma, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e5e5; border-radius: 16px; padding: 24px; background-color: #fcfbfa; color: #1c1917;">' +
        '<div style="text-align: center; margin-bottom: 24px; border-bottom: 2px solid #d6bf77; padding-bottom: 16px;">' +
          '<h2 style="color: #1c1917; font-family: serif; font-size: 24px; margin: 0;">أهلاً بك في نادي النخبة للخط العربي الفاخر ✨</h2>' +
        '</div>' +
        '<p>عزيزنا <strong>' + data.name + '</strong>، يسعدنا انضمامك إلينا في مجتمع محبي الفنون الإسلامية والخط العربي الأصيل.</p>' +
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
    Logger.log('فشل إرسال الإيميل الترحيبي: ' + e.message);
  }
  
  return { status: 'success', code: 'WELCOME10' };
}

// جلب الإعدادات من شيت الإعدادات القديم بالترتيب الأصلي للصفوف والأعمدة
function getSettings() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var settingsSheet = spreadsheet.getSheetByName('Settings');
  if (!settingsSheet) return {};
  
  var data = settingsSheet.getRange('A2:F100').getValues();
  
  var settings = {
    headerImageUrl: data[0] && data[0][1] ? data[0][1].toString().trim() : '',
    facebookUrl: data[1] && data[1][1] ? data[1][1].toString().trim() : '',
    instagramUrl: data[2] && data[2][1] ? data[2][1].toString().trim() : '',
    youtubeUrl: data[3] && data[3][1] ? data[3][1].toString().trim() : '',
    lineUrl: data[4] && data[4][1] ? data[4][1].toString().trim() : '',
    pageTitle: data[6] && data[6][1] ? data[6][1].toString().trim() : 'معرض الصور',
    recipientEmail: data[7] && data[7][1] ? data[7][1].toString().trim() : '',
    botToken: data[10] && data[10][1] ? data[10][1].toString().trim() : '',
    chatId: data[11] && data[11][1] ? data[11][1].toString().trim() : '',
    templateId: data[14] && data[14][1] ? data[14][1].toString().trim() : '',
    folderUrl: data[15] && data[15][1] ? data[15][1].toString().trim() : '',
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
  var sheet = spreadsheet.getSheetByName('Images');
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var lastColumn = sheet.getLastColumn();
  var values = sheet.getRange('A2:' + String.fromCharCode(64 + lastColumn) + lastRow).getValues();
  var fontLines = sheet.getRange('O2:O' + lastRow).getFontLines();
  var data = [];
  
  for (var i = 0; i < values.length; i++) {
    if (values[i][0]) {
      try {
        var fileId = extractFileId(values[i][0]);
        var extraImages = [];
        var details = [];
        var videos = [];
        
        for (var j = 3; j < values[i].length; j++) {
          var value = values[i][j] ? values[i][j].toString().trim() : '';
          if (value === '') continue;
          if (j >= 3 && j <= 12) {
            extraImages.push(extractFileId(value));
          } else if (j >= 15 && j <= 16) {
            details.push(value);
          } else if (j >= 17) {
            var youtubeId = extractYouTubeId(value);
            var driveFileId = extractFileId(value);
            if (youtubeId) {
              videos.push({ type: 'youtube', id: youtubeId });
            } else if (driveFileId) {
              videos.push({ type: 'drive', id: driveFileId });
            }
          }
        }
        
        var originalPrice = values[i][14] ? parseFloat(values[i][14]) : 0;
        var discountedPrice = values[i][13] ? parseFloat(values[i][13]) : originalPrice;
        var isOriginalPriceStruck = fontLines[i] && fontLines[i][0] === 'line-through';
        
        data.push({
          fileId: fileId,
          title: values[i][1] ? values[i][1].toString().trim() : 'بدون عنوان',
          description: values[i][2] ? values[i][2].toString().trim() : 'بدون وصف',
          originalPrice: isNaN(originalPrice) ? 0 : originalPrice,
          discountedPrice: isNaN(discountedPrice) ? originalPrice : discountedPrice,
          isOriginalPriceStruck: !!isOriginalPriceStruck,
          extraImages: extraImages,
          details: details,
          videos: videos,
          category: values[i][1] ? 'لوحات جدارية' : 'عام'
        });
      } catch (e) {
        Logger.log('خطأ في معالجة الصف: ' + e.message);
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
          
          var borrowType = 'percentage';
          var borrowValue = 0.15; // خصم افتراضي 15%
          var borrowEligible = 'all';
          var studentUsageLimit = 1;
          
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
                         (targetGroupRaw === 'عضو جديد' || targetGroupRaw === 'عضو_جديد' || targetGroupRaw === 'new member' || targetGroupRaw === 'new_member') ? 'new_member' :
                         (targetGroupRaw === 'member' || targetGroupRaw === 'عضو' || targetGroupRaw === 'أعضاء') ? 'member' : 'general';
      var usedByStr = values[i][10] ? values[i][10].toString().trim().toLowerCase() : '';
      var usedByContacts = usedByStr ? usedByStr.split(',').map(function(s) { return s.trim(); }).filter(Boolean) : [];
      var customerUsageLimit = values[i][11] !== '' && values[i][11] !== undefined ? parseInt(values[i][11]) : null;
      
      if (expiryDate) {
        var todayStr = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd');
        if (todayStr > expiryDate) {
          return { valid: false, message: 'عذراً، هذا الكوبون منتهي الصلاحية 📅' };
        }
      }
      
      if (usageLimit !== null && !isNaN(usageLimit) && usageCount >= usageLimit) {
        return { valid: false, message: 'عذراً، تم الوصول للحد الأقصى لاستخدام الكوبون 🛑' };
      }
      
      if (subtotal !== undefined && subtotal !== null && subtotal < minSpend) {
        return { valid: false, message: 'الحد الأدنى للشراء لتفعيل الكود هو ' + minSpend + ' ريال' };
      }
      
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
        if (categoryType !== 'general' && (email || phone)) {
          var cleanContact = (email || phone || '').toString().trim().toLowerCase();
          if (usedByContacts.indexOf(cleanContact) !== -1) {
            return { valid: false, message: 'لقد استخدمت هذا الكوبون من قبل، وهو متاح لمرة واحدة فقط للعميل 🛡️' };
          }
        }
      }
      
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
          var cleanStudentId = studentId.toString().trim().toUpperCase();
          for (var j = 0; j < sValues.length; j++) {
            var sId = sValues[j][0] ? sValues[j][0].toString().trim().toUpperCase() : '';
            if (sId === cleanStudentId) {
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
      
      if (categoryType === 'member') {
        if (email || phone) {
          var memberSheet = spreadsheet.getSheetByName('Members');
          if (!memberSheet) {
            return { valid: false, message: 'ورقة المشتركين غير متوفرة ❌' };
          }
          var mLastRow = memberSheet.getLastRow();
          var mValues = mLastRow >= 2 ? memberSheet.getRange('A2:C' + mLastRow).getValues() : [];
          var memberFound = false;
          var cleanEmail = (email || '').toString().trim().toLowerCase();
          var cleanPhone = (phone || '').toString().trim();
          
          for (var k = 0; k < mValues.length; k++) {
            var mEmail = mValues[k][1] ? mValues[k][1].toString().trim().toLowerCase() : '';
            var mPhone = mValues[k][2] ? mValues[k][2].toString().trim() : '';
            if ((cleanEmail && mEmail === cleanEmail) || (cleanPhone && mPhone === cleanPhone)) {
              memberFound = true;
              break;
            }
          }
          if (!memberFound) {
            return { valid: false, message: 'عذراً، هذا الكوبون مخصص للأعضاء المشتركين فقط 💎' };
          }
        }
      }

      if (categoryType === 'new_member') {
        if (email || phone) {
          var memberSheet = spreadsheet.getSheetByName('Members');
          if (!memberSheet) {
            return { valid: false, message: 'ورقة المشتركين غير متوفرة ❌' };
          }
          var mLastRow = memberSheet.getLastRow();
          var mValues = mLastRow >= 2 ? memberSheet.getRange('A2:C' + mLastRow).getValues() : [];
          var memberFound = false;
          var cleanEmail = (email || '').toString().trim().toLowerCase();
          var cleanPhone = (phone || '').toString().trim();
          
          for (var k = 0; k < mValues.length; k++) {
            var mEmail = mValues[k][1] ? mValues[k][1].toString().trim().toLowerCase() : '';
            var mPhone = mValues[k][2] ? mValues[k][2].toString().trim() : '';
            if ((cleanEmail && mEmail === cleanEmail) || (cleanPhone && mPhone === cleanPhone)) {
              memberFound = true;
              break;
            }
          }
          if (!memberFound) {
            return { valid: false, message: 'عذراً، هذا الكوبون مخصص للأعضاء المشتركين فقط 💎' };
          }
          
          var orderSheet = spreadsheet.getSheetByName('Orders');
          if (orderSheet) {
            var oLastRow = orderSheet.getLastRow();
            if (oLastRow >= 2) {
              var oValues = orderSheet.getRange('E2:F' + oLastRow).getValues();
              for (var oIdx = 0; oIdx < oValues.length; oIdx++) {
                var oPhone = oValues[oIdx][0] ? oValues[oIdx][0].toString().trim() : '';
                var oEmail = oValues[oIdx][1] ? oValues[oIdx][1].toString().trim().toLowerCase() : '';
                if ((cleanEmail && oEmail === cleanEmail) || (cleanPhone && oPhone === cleanPhone)) {
                  return { valid: false, message: 'عذراً، هذا الكوبون مخصص للطلب الأول فقط للأعضاء الجدد 🛡️' };
                }
              }
            }
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
  
  var textsSheet = spreadsheet.getSheetByName('نصوص') || spreadsheet.getSheetByName('Texts');
  if (!textsSheet) {
    textsSheet = spreadsheet.insertSheet('نصوص');
    textsSheet.getRange('A1:C1').setValues([['المعرف', 'القيمة', 'مكان النص أو الوصف']]);
    textsSheet.getRange('A2:C28').setValues([
      ['logo_image', '', 'رابط صورة شعار المتجر (اتركه فارغاً لاستخدام الحرف البديل)'],
      ['logo_letter', 'خ', 'الحرف البديل للشعار الدائري (مثل: خ, م, أ)'],
      ['brand_name', 'خطاط', 'اسم المتجر الرئيسي في الهيدر (مثل: خطاط)'],
      ['brand_subtitle', 'للفنون والخط العربي', 'الوصف الفرعي للمتجر في الهيدر (مثل: للفنون والخط العربي)'],
      ['hero_title', 'موقع النخبة للخط العربي والزخرفة الإسلامية', 'العنوان الترحيبي الكبير العريض في أعلى الصفحة الرئيسية'],
      ['hero_badge_text', 'تحف فنية أصلية للخط العربي والزخرفة الإسلامية', 'نص الشارة العلوية المضيئة في أعلى الهيدر'],
      ['hero_subtitle', 'اقتنِ أجمل اللوحات والتحف الجدارية والمخطوطات الخاصة المصنوعة بأيدي أمهر الخطاطين المحترفين على مر الزمن لتزيين جدران بيتك بذكر الله.', 'الوصف التوضيحي تحت العنوان الترحيبي الرئيسي'],
      ['search_placeholder', 'ابحث عن لوحة آية الكرسي، أسماء الله الحسنى، أدوات...', 'نص التلميح داخل صندوق البحث عن المنتجات'],
      ['category_all_text', 'كل الأقسام والمعروضات', 'النص الافتراضي لاختيار الأقسام'],
      ['tab_shop_text', 'المتجر', 'اسم زر تبويب المتجر في القائمة العلوية'],
      ['tab_members_text', 'نادي العضوية', 'اسم زر تبويب نادي العضوية في القائمة العلوية'],
      ['tab_admin_text', 'لوحة الإدارة', 'اسم زر تبويب لوحة الإدارة في القائمة العلوية'],
      ['discount_label_text', 'خصم', 'نص كلمة (خصم) المكتوبة بجانب نسبة التخفيض في كرت المنتج'],
      ['offers_title', 'عروض وتخفيضات خاصة وحصرية', 'عنوان قسم العروض والتخفيضات'],
      ['offers_subtitle', 'فرصتك لاقتناء تحف فنية نادرة ومميزة بأسعار خاصة لفترة محدودة', 'الوصف الفرعي تحت عنوان قسم العروض'],
      ['active_now_text', 'نشط الآن', 'شارة العرض النشط الآن'],
      ['category_pill_all_text', 'الكل', 'اسم زر التصفية الكل للأقسام'],
      ['footer_intro_text', 'متجر متخصص بإنتاج وبيع اللوحات الجدارية الفاخرة للخط العربي والزخرفة الإسلامية، مكتوبة ومحفورة ومذهبة بأيدي خطاطين محترفين لتناسب الأذواق الرفيعة والمحترمة.', 'النص التعريفي للمتجر في أسفل الصفحة فوتر'],
      ['footer_quick_links_title', 'أقسام ومفاتيح سريعة', 'عنوان قائمة الروابط السريعة في الفوتر'],
      ['footer_link_browse', 'تصفح المعرض', 'رابط تصفح المعرض في الفوتر'],
      ['footer_link_subscribe', 'اشترك بالعضوية', 'رابط الاشتراك بالعضوية في الفوتر'],
      ['footer_link_admin', 'بوابة الإدارة', 'رابط بوابة الإدارة في الفوتر'],
      ['footer_link_offers', 'عروض وتخفيضات', 'رابط عروض وتخفيضات في الفوتر'],
      ['footer_contact_title', 'تواصل فوري ومتابعة', 'عنوان قسم التواصل في الفوتر'],
      ['footer_contact_desc', 'يسر خدمة العملاء والطلبات الخاصة استقبال تساؤلاتكم واستفساراتكم حول اللوحات المخصصة بالاسم طوال اليوم.', 'وصف قسم التواصل في الفوتر'],
      ['footer_terms_of_use', 'شروط الاستخدام', 'رابط شروط الاستخدام في أسفل الصفحة'],
      ['footer_privacy_policy', 'سياسة الخصوصية وتأمين البيانات', 'رابط سياسة الخصوصية في أسفل الصفحة']
    ]);
  }
  
  return {
    profile: spreadsheet.getSheetByName('Profile') ? spreadsheet.getSheetByName('Profile').getDataRange().getValues().slice(1) : [],
    contact: spreadsheet.getSheetByName('Contact') ? spreadsheet.getSheetByName('Contact').getDataRange().getValues().slice(1) : [],
    images: spreadsheet.getSheetByName('Images') ? spreadsheet.getSheetByName('Images').getDataRange().getValues().slice(1) : [],
    settings: spreadsheet.getSheetByName('Settings') ? spreadsheet.getSheetByName('Settings').getDataRange().getValues().slice(1) : [],
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
  var orderSheet = spreadsheet.getSheetByName('Orders');
  if (!orderSheet) {
    orderSheet = spreadsheet.insertSheet('Orders');
    orderSheet.getRange('A1:L1').setValues([['رقم الطلب', 'تاريخ ووقت الإرسال', 'الاسم', 'العنوان', 'رقم الهاتف', 'البريد الإلكتروني', 'المنتجات', 'الكميات', 'المبلغ الكلي', 'كود الخصم', 'حالة التلجرام', 'رابط الفاتورة PDF']]);
  }
  
  var orderId = 'ORD' + Utilities.formatDate(new Date(), 'GMT+7', 'yyyyMMddHHmmss') + Math.floor(Math.random() * 1000);
  var timestamp = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm:ss');
  
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
        var pct = promo.value > 1 ? promo.value / 100 : promo.value;
        totalAmount = Math.max(0, totalAmount * (1 - pct));
      } else if (promo.type === 'fixed') {
        totalAmount = Math.max(0, totalAmount - promo.value);
      } else if (promo.type === 'shipping') {
        totalAmount = totalAmount;
      }
      
      try {
        var promoSheet = spreadsheet.getSheetByName('PromoCodes');
        if (promoSheet) {
          var pRows = promoSheet.getLastRow();
          var pCodes = pRows >= 2 ? promoSheet.getRange('A2:A' + pRows).getValues() : [];
          for (var pIdx = 0; pIdx < pCodes.length; pIdx++) {
            if (pCodes[pIdx][0].toString().trim().toUpperCase() === promoCode.toUpperCase().trim()) {
              var rNum = pIdx + 2;
              
              var currentCountVal = parseInt(promoSheet.getRange(rNum, 7).getValue()) || 0;
              promoSheet.getRange(rNum, 7).setValue(currentCountVal + 1);
              
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
  var botToken = settings.botToken || '';
  var chatId = settings.chatId || '';
  var telegramSentStatus = 'لم يتم الإعداد';
  
  if (botToken && chatId && botToken !== 'YOUR_TELEGRAM_BOT_TOKEN' && chatId !== 'YOUR_TELEGRAM_CHAT_ID') {
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
                    "🆔 *رقم الطلب:* " + orderId;
      
      var url = 'https://api.telegram.org/bot' + botToken + '/sendMessage';
      var payload = {
        'chat_id': chatId,
        'text': message,
        'parse_mode': 'Markdown'
      };
      
      var options = {
        'method': 'post',
        'contentType': 'application/json',
        'payload': JSON.stringify(payload),
        'muteHttpExceptions': true
      };
      
      UrlFetchApp.fetch(url, options);
      telegramSentStatus = 'تم الإرسال للتلغرام ✅';
    } catch (e) {
      telegramSentStatus = 'فشل الإرسال: ' + e.message;
    }
  }

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
    'جاري توليد الفاتورة...'
  ]);
  
  var lastRow = orderSheet.getLastRow();
  var pdfLink = '#';
  var pdfFile = null;
  
  try {
    var pdfResult = generateAndSavePDF(orderId, order, totalAmount, timestamp);
    if (pdfResult && pdfResult.status === 'success') {
      pdfLink = pdfResult.pdfUrl;
      pdfFile = pdfResult.file;
    } else if (pdfResult && pdfResult.status === 'error') {
      pdfLink = 'فشل: ' + pdfResult.message;
    }
  } catch (e) {
    pdfLink = 'خطأ: ' + e.message;
    Logger.log('خطأ في توليد الـ PDF: ' + e.message);
  }
  
  try {
    orderSheet.getRange(lastRow, 12).setValue(pdfLink);
  } catch (setValErr) {
    Logger.log('فشل تحديث رابط الـ PDF في الشيت: ' + setValErr.message);
  }
  
  try {
    sendEmailConfirmation(orderId, order, pdfFile, totalAmount);
  } catch (emailErr) {
    Logger.log('فشل إرسال إيميل التأكيد: ' + emailErr.message);
  }
  
  return { status: 'success', orderId: orderId, telegramSent: telegramSentStatus, pdfLink: pdfLink };
}

function buildInvoiceHtml(orderId, order, finalTotalAmount, timestamp, isEmail) {
  var settings = getSettings();
  var ts = timestamp || Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm:ss');
  var promoCode = order.promoCode || '';
  var items = order.items || [];
  
  var originalTotal = items.reduce(function(sum, item) {
    var price = Number(item.price || item.originalPrice || item.finalPrice || item.discountedPrice || 0);
    var qty = Number(item.quantity || 1);
    return sum + (price * qty);
  }, 0);

  var totalVal = (finalTotalAmount !== undefined && finalTotalAmount !== null) ? Number(finalTotalAmount) : originalTotal;
  var discountAmount = originalTotal - totalVal;
  if (discountAmount < 0) discountAmount = 0;

  var productsHtmlTable = 
    '<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; text-align: right; border: 1px solid #d6bf77; font-size: 14px; margin-top: 10px;" dir="rtl">' +
      '<tr style="background-color: #f2f2f2; color: #1c1917; font-weight: bold;">' +
        '<th style="padding: 10px; border: 1px solid #d6bf77; text-align: right;">المنتج</th>' +
        '<th style="padding: 10px; border: 1px solid #d6bf77; text-align: center;">سعر الوحدة الأصلي</th>' +
        '<th style="padding: 10px; border: 1px solid #d6bf77; text-align: center;">الكمية</th>' +
        '<th style="padding: 10px; border: 1px solid #d6bf77; text-align: center;">الإجمالي</th>' +
      '</tr>';

  items.forEach(function(item) {
    var price = Number(item.price || item.originalPrice || item.finalPrice || item.discountedPrice || 0);
    var qty = Number(item.quantity || 1);
    productsHtmlTable += 
      '<tr>' +
        '<td style="padding: 8px; border: 1px solid #e5e5e5; text-align: right;">' + String(item.title || 'منتج') + '</td>' +
        '<td style="padding: 8px; border: 1px solid #e5e5e5; text-align: center;">' + price.toFixed(0) + ' ฿</td>' +
        '<td style="padding: 8px; border: 1px solid #e5e5e5; text-align: center;">' + qty.toFixed(0) + '</td>' +
        '<td style="padding: 8px; border: 1px solid #e5e5e5; text-align: center;">' + (price * qty).toFixed(0) + ' ฿</td>' +
      '</tr>';
  });

  if (discountAmount > 0.01 || promoCode) {
    productsHtmlTable += 
      '<tr style="font-weight: bold; background-color: #fcfbfa;">' +
        '<td colspan="3" style="padding: 10px; border: 1px solid #e5e5e5; text-align: right;">المجموع الفرعي قبل الخصم</td>' +
        '<td style="padding: 10px; border: 1px solid #e5e5e5; text-align: center;">' + originalTotal.toFixed(0) + ' ฿</td>' +
      '</tr>' +
      '<tr style="font-weight: bold; background-color: #fee2e2; color: #b91c1c;">' +
        '<td colspan="3" style="padding: 10px; border: 1px solid #e5e5e5; text-align: right;">قيمة الخصم (' + (promoCode ? 'كوبون: ' + promoCode : 'خصم خاص') + ')</td>' +
        '<td style="padding: 10px; border: 1px solid #e5e5e5; text-align: center;">-' + discountAmount.toFixed(0) + ' ฿</td>' +
      '</tr>' +
      '<tr style="font-weight: bold; background-color: #f0fdf4; color: #15803d;">' +
        '<td colspan="3" style="padding: 10px; border: 1px solid #d6bf77; text-align: right; font-size: 15px;">الإجمالي النهائي الصافي بعد الخصم</td>' +
        '<td style="padding: 10px; border: 1px solid #d6bf77; text-align: center; color: #15803d; font-size: 16px;">' + totalVal.toFixed(0) + ' ฿</td>' +
      '</tr>';
  } else {
    productsHtmlTable += 
      '<tr style="font-weight: bold; background-color: #fcfbfa;">' +
        '<td colspan="3" style="padding: 10px; border: 1px solid #d6bf77; text-align: right; font-size: 15px;">المبلغ الإجمالي المدفوع</td>' +
        '<td style="padding: 10px; border: 1px solid #d6bf77; text-align: center; color: #c5a850; font-size: 16px;">' + totalVal.toFixed(0) + ' ฿</td>' +
      '</tr>';
  }

  productsHtmlTable += '</table>';

  var headerTitle = isEmail ? 'شكراً لثقتك وتسوقك معنا! 🎉' : 'فاتورة شراء رسمية - متجر النخبة 🧾';
  var subTitle = isEmail ? 'تم استلام طلبك بنجاح وجاري العمل على تجهيزه' : 'توثيق رسمي لبيانات المشتريات والمدفوعات';

  var htmlContent = 
    '<!DOCTYPE html>' +
    '<html dir="rtl" lang="ar">' +
    '<head>' +
      '<meta charset="UTF-8">' +
      '<style>' +
        'body { font-family: "Segoe UI", Tahoma, Arial, sans-serif; background-color: #ffffff; color: #1c1917; margin: 0; padding: 20px; direction: rtl; text-align: right; }' +
        '.container { max-width: 600px; margin: 0 auto; border: 1px solid #e5e5e5; border-radius: 12px; padding: 24px; background-color: #fcfbfa; }' +
        '.header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #d6bf77; padding-bottom: 16px; }' +
        '.header h2 { color: #1c1917; font-size: 22px; margin: 0 0 8px 0; }' +
        '.header p { font-size: 13px; color: #78716c; margin: 0; }' +
        '.info-box { background-color: #faf9f6; padding: 16px; border-radius: 8px; border: 1px solid #f3f2ed; margin: 18px 0; font-size: 14px; line-height: 1.8; }' +
        '.info-box p { margin: 4px 0; }' +
        '.footer { text-align: center; margin-top: 28px; padding-top: 14px; border-top: 1px dashed #d6bf77; font-size: 12px; color: #78716c; }' +
      '</style>' +
    '</head>' +
    '<body>' +
      '<div class="container">' +
        '<div class="header">' +
          '<h2>' + headerTitle + '</h2>' +
          '<p>' + subTitle + '</p>' +
        '</div>' +
        
        '<div class="info-box">' +
          '<p><strong>رقم الفاتورة / الطلب:</strong> <span style="font-family: monospace; font-weight: bold; color: #c5a850;">' + orderId + '</span></p>' +
          '<p><strong>التاريخ والوقت:</strong> ' + ts + '</p>' +
          '<p><strong>اسم العميل:</strong> ' + (order.name || '') + '</p>' +
          '<p><strong>رقم الهاتف للتواصل:</strong> ' + (order.phone || '') + '</p>' +
          '<p><strong>العنوان للتسليم:</strong> ' + (order.address || '') + '</p>' +
          '<p><strong>البريد الإلكتروني المعتمد:</strong> ' + (order.email || '') + '</p>' +
          '<p><strong>الكود الترويجي المطبق:</strong> ' + (promoCode ? promoCode : 'لا يوجد') + '</p>' +
        '</div>' +
        
        '<h3 style="color: #1c1917; font-size: 16px; margin-top: 20px; margin-bottom: 10px;">تفاصيل المشتريات والعملية المالية:</h3>' +
        productsHtmlTable +
        
        '<div class="footer">' +
          '<p style="margin: 0; font-weight: bold;">متجر النخبة للخط العربي والزخرفة الإسلامية</p>' +
          '<p style="margin: 4px 0; color: #059669;">شكرًا لاختيارك الفن والخط العربي الأصيل! ❤️</p>' +
        '</div>' +
      '</div>' +
    '</body>' +
    '</html>';

  return htmlContent;
}

function generateAndSavePDF(orderId, order, finalTotalAmount, timestamp) {
  try {
    var settings = getSettings();
    var folderId = settings.folderUrl ? extractIdFromUrl(settings.folderUrl) : '';
    var targetFolder = null;
    
    if (folderId) {
      try {
        targetFolder = DriveApp.getFolderById(folderId);
      } catch (fErr) {
        Logger.log('تعذر الوصول لمجلد المشتريات، جاري الحفظ في المجلد الرئيسي: ' + fErr.message);
      }
    }
    
    var docTemplateId = '';
    
    if (docTemplateId) {
      try {
        var cleanDocId = extractIdFromUrl(docTemplateId);
        var templateFile = DriveApp.getFileById(cleanDocId);
        var tempCopy = targetFolder ? templateFile.makeCopy('Invoice_' + orderId, targetFolder) : templateFile.makeCopy('Invoice_' + orderId);
        var tempDoc = DocumentApp.openById(tempCopy.getId());
        var body = tempDoc.getBody();
        
        var items = order.items || [];
        var originalTotal = items.reduce(function(sum, item) {
          var price = Number(item.price || item.originalPrice || item.finalPrice || item.discountedPrice || 0);
          var qty = Number(item.quantity || 1);
          return sum + (price * qty);
        }, 0);
        var discountAmount = Math.max(0, originalTotal - finalTotalAmount);
        var promoCode = order.promoCode || 'لا يوجد';
        
        var itemsFormattedText = items.map(function(itm, idx) {
          var pPrice = Number(itm.price || itm.originalPrice || itm.finalPrice || itm.discountedPrice || 0);
          var pQty = Number(itm.quantity || 1);
          return (idx + 1) + '. ' + String(itm.title || 'منتج') + ' (الكمية: ' + pQty + ' × ' + pPrice.toFixed(0) + ' ฿ = ' + (pPrice * pQty).toFixed(0) + ' ฿)';
        }).join('\\n');

        function replaceTagInElement(element, tagName, tagValue) {
          if (!element || !tagName || tagValue === undefined || tagValue === null) return;
          var valStr = String(tagValue);
          var cleanTag = String(tagName).replace('{{', '').replace('}}', '').trim();
          if (!cleanTag) return;
          var safeVal = valStr.split('$').join('$$');
          var searchPattern = '\\{\\{' + cleanTag + '\\}\\}';
          try {
            element.replaceText(searchPattern, safeVal);
          } catch (e) {
            Logger.log('Error replacing ' + tagName + ': ' + e.message);
          }
        }

        try {
          var docTables = body.getTables();
          for (var t = 0; t < docTables.length; t++) {
            var tbl = docTables[t];
            var tblText = tbl.getText();
            if (tblText.indexOf('{{title}}') !== -1 || tblText.indexOf('{{name}}') !== -1 || tblText.indexOf('{{item}}') !== -1) {
              for (var r = 1; r < tbl.getNumRows(); r++) {
                var row = tbl.getRow(r);
                var rText = row.getText();
                if (rText.indexOf('{{title}}') !== -1 || rText.indexOf('{{name}}') !== -1 || rText.indexOf('{{item}}') !== -1) {
                  for (var i = 0; i < items.length; i++) {
                    var itm = items[i];
                    var itmPrice = Number(itm.price || itm.originalPrice || itm.finalPrice || itm.discountedPrice || 0);
                    var itmQty = Number(itm.quantity || 1);
                    var newRow = row.copy();
                    replaceTagInElement(newRow, '{{title}}', String(itm.title || 'منتج'));
                    replaceTagInElement(newRow, '{{name}}', String(itm.title || 'منتج'));
                    replaceTagInElement(newRow, '{{item}}', String(itm.title || 'منتج'));
                    replaceTagInElement(newRow, '{{quantity}}', String(itmQty));
                    replaceTagInElement(newRow, '{{qty}}', String(itmQty));
                    replaceTagInElement(newRow, '{{price}}', itmPrice.toFixed(0) + ' ฿');
                    replaceTagInElement(newRow, '{{total}}', (itmPrice * itmQty).toFixed(0) + ' ฿');
                    tbl.insertTableRow(r + i + 1, newRow);
                  }
                  tbl.removeRow(r);
                  break;
                }
              }
            }
          }
        } catch (tblErr) {
          Logger.log('Table process info: ' + tblErr.message);
        }

        var replacements = {
          '{{items}}': itemsFormattedText,
          '{{ITEMS}}': itemsFormattedText,
          '{{products}}': itemsFormattedText,
          '{{PRODUCTS}}': itemsFormattedText,
          '{{ORDER_ID}}': orderId || '',
          '{{orderId}}': orderId || '',
          '{{ORDERID}}': orderId || '',
          '{{order_id}}': orderId || '',
          '{{DATE}}': timestamp || '',
          '{{timestamp}}': timestamp || '',
          '{{date}}': timestamp || '',
          '{{CUSTOMER_NAME}}': order.name || '',
          '{{name}}': order.name || '',
          '{{customerName}}': order.name || '',
          '{{customer_name}}': order.name || '',
          '{{PHONE}}': order.phone || '',
          '{{phone}}': order.phone || '',
          '{{EMAIL}}': order.email || '',
          '{{email}}': order.email || '',
          '{{ADDRESS}}': order.address || '',
          '{{address}}': order.address || '',
          '{{PROMO_CODE}}': promoCode,
          '{{promoCode}}': promoCode,
          '{{promo_code}}': promoCode,
          '{{SUBTOTAL}}': originalTotal.toFixed(0) + ' ฿',
          '{{subtotal}}': originalTotal.toFixed(0) + ' ฿',
          '{{subTotal}}': originalTotal.toFixed(0) + ' ฿',
          '{{DISCOUNT}}': discountAmount > 0 ? ('-' + discountAmount.toFixed(0) + ' ฿') : '0 ฿',
          '{{discount}}': discountAmount > 0 ? ('-' + discountAmount.toFixed(0) + ' ฿') : '0 ฿',
          '{{discountAmount}}': discountAmount > 0 ? ('-' + discountAmount.toFixed(0) + ' ฿') : '0 ฿',
          '{{TOTAL}}': finalTotalAmount.toFixed(0) + ' ฿',
          '{{total}}': finalTotalAmount.toFixed(0) + ' ฿',
          '{{totalAmount}}': finalTotalAmount.toFixed(0) + ' ฿'
        };
        
        for (var tagKey in replacements) {
          replaceTagInElement(body, tagKey, replacements[tagKey]);
        }
        
        tempDoc.saveAndClose();
        
        var pdfBlob = tempCopy.getAs(MimeType.PDF).setName('Invoice_' + orderId + '.pdf');
        var pdfFile = targetFolder ? targetFolder.createFile(pdfBlob) : DriveApp.createFile(pdfBlob);
        pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        
        tempCopy.setTrashed(true);
        
        return { status: 'success', file: pdfFile, pdfUrl: pdfFile.getUrl() };
      } catch (docErr) {
        Logger.log('فشل توليد PDF عبر Docs، جاري التحويل للمولّد البرمجي: ' + docErr.message);
      }
    }
    
    var htmlContent = buildInvoiceHtml(orderId, order, finalTotalAmount, timestamp, false);
    
    var htmlOutput = HtmlService.createHtmlOutput(htmlContent);
    var pdfBlobHtml = htmlOutput.getAs(MimeType.PDF).setName('Invoice_' + orderId + '.pdf');
    
    var pdfFileHtml = targetFolder ? targetFolder.createFile(pdfBlobHtml) : DriveApp.createFile(pdfBlobHtml);
    pdfFileHtml.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return { status: 'success', file: pdfFileHtml, pdfUrl: pdfFileHtml.getUrl() };
  } catch (e) {
    Logger.log('PDF Generation Error: ' + e.message);
    return { status: 'error', message: e.message };
  }
}

function extractIdFromUrl(urlOrId) {
  if (!urlOrId) return '';
  urlOrId = String(urlOrId).trim();
  
  var foldersMatch = urlOrId.match(new RegExp('/folders/([a-zA-Z0-9_-]+)'));
  if (foldersMatch && foldersMatch[1]) {
    return foldersMatch[1];
  }
  
  var dMatch = urlOrId.match(new RegExp('/d/([a-zA-Z0-9_-]+)'));
  if (dMatch && dMatch[1]) {
    return dMatch[1];
  }
  
  var idParamMatch = urlOrId.match(new RegExp('[?&]id=([a-zA-Z0-9_-]+)'));
  if (idParamMatch && idParamMatch[1]) {
    return idParamMatch[1];
  }
  
  var sequenceMatch = urlOrId.match(/[-\w]{25,}/);
  if (sequenceMatch && sequenceMatch[0]) {
    return sequenceMatch[0];
  }
  
  return urlOrId;
}

function sendEmailConfirmation(orderId, order, pdfFile, finalTotalAmount) {
  try {
    var settings = getSettings();
    var timestamp = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm:ss');
    
    var emailHtml = buildInvoiceHtml(orderId, order, finalTotalAmount, timestamp, true);

    var targetCustomerEmail = String(order.email || '').trim();
    if (targetCustomerEmail && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(targetCustomerEmail)) {
      try {
        var customerAttachments = [];
        if (pdfFile) {
          customerAttachments.push(pdfFile.getBlob());
        }
        
        sendEmailHelper(targetCustomerEmail, 'تأكيد طلبك رقم ' + orderId + ' من متجر النخبة 🧾', emailHtml, customerAttachments);
      } catch (custErr) {
        Logger.log('خطأ في إرسال بريد الزبون: ' + custErr.message);
      }
    }

    if (settings.recipientEmail) {
      try {
        var adminAttachments = [];
        if (pdfFile) {
          adminAttachments.push(pdfFile.getBlob());
        }
        
        sendEmailHelper(settings.recipientEmail, 'طلب شراء جديد رقم ' + orderId + ' 🔔', emailHtml, adminAttachments);
      } catch (adminErr) {
        Logger.log('خطأ في إرسال بريد المشرف: ' + adminErr.message);
      }
    }
  } catch (err) {
    Logger.log('خطأ عام في نظام البريد الإلكتروني: ' + err.message);
  }
}

function sendEmailHelper(to, subject, htmlBody, attachments) {
  var cleanTo = String(to || '').trim();
  if (!cleanTo) {
    Logger.log('إلغاء الإرسال: الإيميل فارغ');
    return;
  }
  
  var plainText = 'شكراً لتواصلك مع متجر النخبة للخط العربي الفاخر. تم استلام رسالتك وتفاصيل طلبك بنجاح. سنقوم بمتابعة طلبك والتواصل معك عبر الهاتف أو LINE قريباً جداً.';
  
  var options = {
    htmlBody: htmlBody,
    name: 'متجر النخبة للخط العربي'
  };
  if (attachments && attachments.length > 0) {
    options.attachments = attachments;
  }
  
  try {
    GmailApp.sendEmail(cleanTo, subject, plainText, options);
    Logger.log('تم إرسال الإيميل بنجاح عبر GmailApp إلى: ' + cleanTo);
  } catch (e) {
    Logger.log('فشل الإرسال عبر GmailApp: ' + e.message + '. جاري المحاولة عبر MailApp...');
    try {
      var mailOptions = {
        to: cleanTo,
        subject: subject,
        body: plainText,
        htmlBody: htmlBody,
        name: 'متجر النخبة للخط العربي'
      };
      if (attachments && attachments.length > 0) {
        mailOptions.attachments = attachments;
      }
      MailApp.sendEmail(mailOptions);
      Logger.log('تم إرسال الإيميل بنجاح عبر MailApp إلى: ' + cleanTo);
    } catch (e2) {
      Logger.log('فشل الإرسال كلياً: ' + e2.message);
    }
  }
}

function extractFileId(url) {
  var regex = new RegExp('/d/([a-zA-Z0-9_-]+)');
  var match = String(url).match(regex);
  return match && match[1] ? match[1] : url;
}

function extractYouTubeId(url) {
  var regex = new RegExp('(?:youtube\\.com/(?:[^/]+/.+/|(?:v|e(?:mbed)?)/|.*[?&]v=)|youtu\\.be/)([a-zA-Z0-9_-]{11})');
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
};

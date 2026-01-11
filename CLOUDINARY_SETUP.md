# إعداد Cloudinary لرفع الصور

## نظرة عامة
يستخدم التطبيق Cloudinary لرفع وتخزين الصور الشخصية للمستخدمين وملفات PDF للملخصات.

## خطوات الإعداد

### 1. إنشاء حساب Cloudinary
1. اذهب إلى [https://cloudinary.com](https://cloudinary.com)
2. أنشئ حساب جديد مجاني
3. ستحصل على:
   - **Cloud Name**: اسم مشروعك (مثل: `drgt5xslx`)
   - **API Key**: مفتاح API
   - **API Secret**: المفتاح السري

### 2. إعداد متغيرات البيئة
أنشئ ملف `.env` في مجلد المشروع:

```env
# Cloudinary Configuration
VITE_CLOUDINARY_API_KEY=your_api_key_here
VITE_CLOUDINARY_API_SECRET=your_api_secret_here
```

### 3. إنشاء Upload Preset
1. اذهب إلى لوحة تحكم Cloudinary
2. انتقل إلى: **Settings** → **Upload** → **Upload presets**
3. اضغط **Add upload preset**
4. أدخل الإعدادات التالية:
   - **Name**: `masarx-uploads`
   - **Mode**: `Unsigned` (مهم!)
   - **Folder**: `masarx-uploads` (اختياري)
   - **Allowed formats**: `jpg,png,jpeg,gif,pdf`
   - **Max file size**: `10000000` (10MB)
   - **Max image width/height**: `2000`

### 4. إعداد مجلدات التخزين
يتم تنظيم الملفات في المجلدات التالية:
- `profile-images/`: صور الملفات الشخصية
- `summaries/`: ملفات PDF للملخصات

### 5. التحقق من العمل
1. شغل التطبيق محلياً
2. اذهب إلى صفحة الملف الشخصي
3. اضغط على صورة الملف الشخصي
4. اختر صورة وتأكد من رفعها بنجاح

## استكشاف الأخطاء

### خطأ: "Cloudinary credentials not configured"
- تأكد من وجود متغيرات البيئة في ملف `.env`
- تأكد من إعادة تشغيل الخادم بعد إضافة المتغيرات

### خطأ: "Upload preset not found"
- تأكد من أن اسم Upload Preset صحيح: `masarx-uploads`
- تأكد من أنه في وضع "Unsigned"

### خطأ: "File size too large"
- الصور يجب أن تكون أقل من 5MB
- ملفات PDF يجب أن تكون أقل من 10MB

## الأمان
- **لا تشارك مفاتيح API مع أي شخص**
- **استخدم حسابات منفصلة للاختبار**
- **راقب استخدام API بانتظام**

## التكلفة
- الحساب المجاني يوفر 25GB تخزين و25GB نقل شهري
- يمكن ترقية الخطة حسب الحاجة

## الدعم
إذا واجهت مشاكل، تحقق من:
1. [Cloudinary Documentation](https://cloudinary.com/documentation)
2. [Dashboard Console](https://cloudinary.com/console) لمراقبة الاستخدام
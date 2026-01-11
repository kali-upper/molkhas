# إعداد متغيرات البيئة في Supabase Edge Functions

## نظرة عامة
تم نقل جميع مفاتيح API من الكود الأمامي إلى Supabase Edge Functions لأغراض الأمان.

## المتغيرات المطلوبة في Supabase

### 1. اذهب إلى Supabase Dashboard
```
https://supabase.com/dashboard → Your Project → Settings → Edge Functions
```

### 2. أضف المتغيرات التالية:

#### متغيرات Cloudinary (للـ upload-avatar function):
```
CLOUDINARY_CLOUD_NAME=de3emq8l3
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_UPLOAD_PRESET=masarx-uploads
```

#### متغيرات Supabase (مطلوبة لجميع الـ functions):
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

## كيفية إضافة المتغيرات:

### في لوحة Supabase:
1. افتح **Project Settings** → **Edge Functions**
2. في قسم **Environment Variables**، اضغط **Add Variable**
3. أضف كل متغير على حدة

### أو عبر CLI:
```bash
# تثبيت Supabase CLI إذا لم يكن مثبت
npm install -g supabase

# تسجيل الدخول
supabase login

# إضافة المتغيرات
supabase secrets set CLOUDINARY_CLOUD_NAME=de3emq8l3
supabase secrets set CLOUDINARY_API_KEY=your_key
supabase secrets set CLOUDINARY_API_SECRET=your_secret
supabase secrets set CLOUDINARY_UPLOAD_PRESET=masarx-uploads
```

## متغيرات البيئة المحلية (.env)

الآن تحتاج فقط إلى متغيرات Supabase في ملف `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**لا تحتاج إلى مفاتيح Cloudinary في الكود الأمامي بعد الآن!**

## نشر الـ Edge Functions

### نشر جميع الـ functions:
```bash
supabase functions deploy
```

### أو نشر function محدد:
```bash
supabase functions deploy upload-avatar
```

## التحقق من العمل

### 1. اختبر رفع الصورة:
- اذهب إلى صفحة الملف الشخصي
- ارفع صورة جديدة
- يجب أن تعمل بدون أخطاء

### 2. تحقق من Cloudinary:
- اذهب إلى [Cloudinary Dashboard](https://cloudinary.com/console)
- ستجد الصور في مجلد `avatars`

### 3. تحقق من قاعدة البيانات:
- في Supabase Dashboard → Table Editor → `profiles`
- ستجد `avatar_url` محدث

## الأمان المحسن

### ✅ المزايا:
- مفاتيح API محمية في الخادم
- لا يمكن سرقة المفاتيح من المتصفح
- تحكم أفضل في الصلاحيات
- سهولة إدارة المتغيرات

### ❌ ما زال مطلوب:
- ملف `.env` للمتغيرات المحلية فقط
- مفاتيح Supabase (غير حساسة)
- إعداد متغيرات البيئة في Supabase

## استكشاف الأخطاء

### خطأ: "Function not found"
```
supabase functions list
supabase functions deploy upload-avatar
```

### خطأ: "Missing environment variables"
- تأكد من إضافة جميع المتغيرات في Supabase Dashboard
- أعد تشغيل الـ functions بعد إضافة المتغيرات

### خطأ: "Upload failed"
- تحقق من مفاتيح Cloudinary
- تأكد من وجود upload preset `masarx-uploads`
- تحقق من اتصال الإنترنت

## 🎉 النتيجة النهائية

الآن منصتك تستخدم **نظام أمان متقدم**:
- 🔒 مفاتيح API محمية
- 🚀 أداء محسن
- 🛡️ أمان أعلى
- 📱 جاهز للتطبيقات الأصلية
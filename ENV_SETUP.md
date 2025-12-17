# إعداد متغيرات البيئة - Environment Variables Setup

## 📄 إنشاء ملف .env

### 1. أنشئ ملف جديد في مجلد المشروع اسمه: `.env`

### 2. الصق المحتوى التالي في الملف:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://jcufigozkhxazjbwhjjm.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here
```

### 3. استبدل `your_actual_anon_key_here` بالمفتاح الحقيقي:

#### كيفية الحصول على المفتاح:
1. اذهب إلى [Supabase Dashboard](https://supabase.com/dashboard)
2. اختر مشروعك
3. في الشريط الجانبي: **Settings** > **API**
4. انسخ **anon public** key
5. الصقه بدلاً من `your_actual_anon_key_here`

### 4. احفظ الملف

## 🔐 تفعيل Google OAuth

### في Supabase Dashboard:
1. اذهب إلى **Authentication** > **Providers**
2. ابحث عن "Google"
3. فعل التبديل (Enable)
4. أدخل Client ID من Google Cloud Console
5. احفظ التغييرات

## 🧪 اختبار الإعداد

```bash
pnpm run dev
```

ثم جرب تسجيل الدخول بـ Google في صفحة التسجيل أو الدخول.

## ⚠️ تنبيهات مهمة

- **لا تشارك ملف `.env`** مع أحد
- ملف `.env` يجب أن يكون في `.gitignore`
- استخدم `anon key` وليس `service key` في التطبيق الأمامي

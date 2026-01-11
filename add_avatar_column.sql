-- تشغيل هذا في Supabase SQL Editor
-- أو في لوحة Supabase Dashboard → SQL Editor

-- إضافة عمود avatar_url للجدول profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- إضافة تعليق توضيحي
COMMENT ON COLUMN profiles.avatar_url IS 'URL of user profile avatar image stored in Cloudinary';

-- إنشاء فهرس للأداء الأفضل
CREATE INDEX IF NOT EXISTS idx_profiles_avatar_url ON profiles(avatar_url);

-- التحقق من نجاح الإضافة
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name = 'avatar_url';
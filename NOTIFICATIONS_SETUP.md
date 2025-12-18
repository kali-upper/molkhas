# إعداد نظام الإشعارات

## الخطوة 1: تطبيق Migration لقاعدة البيانات

قم بتشغيل SQL التالي في Supabase SQL Editor:

```sql
-- Create notifications table
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('admin_submission', 'content_published', 'system')),
  related_id UUID, -- ID of the related content (summary, news, appeal)
  related_type TEXT CHECK (related_type IN ('summary', 'news', 'appeal')),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_notifications_updated_at_trigger
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();
```

## الخطوة 2: إضافة حقل role للمستخدمين

إذا لم يكن موجوداً، أضف حقل `role` لجدول المستخدمين:

```sql
-- Add role column to profiles table (if not exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Create admin user (replace with actual user ID)
-- UPDATE profiles SET role = 'admin' WHERE id = 'your-admin-user-id';
```

## الميزات المضافة:

### إشعارات للمدراء:
- ✅ عند إرسال ملخص جديد
- ✅ عند إرسال خبر جديد
- ✅ عند إرسال طعن

### إشعارات للمستخدمين:
- ✅ عند نشر ملخص جديد
- ✅ عند نشر خبر جديد

### واجهة المستخدم:
- ✅ أيقونة الإشعارات في الهيدر مع عداد
- ✅ قائمة منسدلة للإشعارات
- ✅ تحديد كمقروء/حذف الإشعارات
- ✅ تنبيهات بصرية للإشعارات غير المقروءة

### أنواع الإشعارات:
- `admin_submission`: إشعارات للمدراء عند تقديم محتوى جديد
- `content_published`: إشعارات للمستخدمين عند نشر محتوى
- `system`: إشعارات النظام

## كيفية الاستخدام:

1. **للمدراء**: سيتلقون إشعارات عندما يرسل المستخدمون ملخصات، أخبار، أو طعون
2. **للمستخدمين**: سيتلقون إشعارات عند نشر ملخصات أو أخبار جديدة
3. **في الهيدر**: أيقونة الجرس تظهر عدد الإشعارات غير المقروءة
4. **في صفحة الملف الشخصي**: إعدادات الإشعارات مع تفاصيل أكثر

## ملاحظات مهمة:

- تأكد من أن المستخدمين لديهم أذونات الإشعارات في المتصفح
- قم بتشغيل Migration في بيئة التطوير والإنتاج
- يمكن تخصيص أنواع الإشعارات حسب الحاجة

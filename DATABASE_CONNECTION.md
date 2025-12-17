# اتصال قاعدة البيانات PostgreSQL

## معلومات الاتصال
```
Host: db.jcufigozkhxazjbwhjjm.supabase.co
Port: 5432
Database: postgres
Username: postgres
Password: qks7WBF8GfN#SXDr
```

# كلمة المرور محدثة بنجاح!

## أدوات الاتصال الموصى بها:

### 1. pgAdmin 4 (مجاني)
- قم بتحميله من: https://www.pgadmin.org/download/
- أنشئ خادم جديد مع المعلومات أعلاه

### 2. DBeaver (مجاني)
- قم بتحميله من: https://dbeaver.io/download/
- أنشئ اتصال PostgreSQL جديد

### 3. Command Line (psql)
```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.jcufigozkhxazjbwhjjm.supabase.co:5432/postgres"
```

### 4. Supabase Dashboard
- اذهب إلى: https://supabase.com/dashboard/project/jcufigozkhxazjbwhjjm/sql
- يمكنك تشغيل SQL مباشرة من المتصفح

## استخدامات محتملة:

### تفعيل Google OAuth:
```sql
-- تفعيل Google provider
UPDATE auth.settings
SET value = 'true'
WHERE key = 'external.google.enabled';

-- أو إدراج provider جديد
INSERT INTO auth.providers (provider_id, provider_name, enabled)
VALUES ('google', 'google', true)
ON CONFLICT (provider_id) DO UPDATE SET enabled = true;
```

### فحص الطعون:
```sql
-- عرض جميع الطعون
SELECT * FROM appeals ORDER BY created_at DESC;

-- عدد الطعون حسب الحالة
SELECT status, COUNT(*) FROM appeals GROUP BY status;
```

## ⚠️ تنبيهات مهمة:

1. **لا تشارك كلمة المرور** مع أحد
2. **استخدم VPN** إذا كنت في شبكة مقيدة
3. **Supabase Dashboard** هو الطريقة الأسهل والأكثر أماناً
4. **لا تقم بتعديل البيانات** إلا إذا كنت متأكداً

## 🔧 بدائل:

إذا كنت تريد تفعيل Google OAuth، يمكنك القيام بذلك من خلال:
**Supabase Dashboard > Authentication > Providers > Google > Enable**

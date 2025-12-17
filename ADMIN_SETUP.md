# Admin Setup Guide

This guide explains how to create your first admin user to access the moderation dashboard.

## Creating an Admin User

Since this platform uses Supabase Authentication, you need to create an admin user through Supabase.

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Users**
4. Click **Add user** → **Create new user**
5. Enter:
   - Email: `admin@example.com` (or your preferred email)
   - Password: Create a strong password
   - Check "Auto Confirm User" if you don't want to handle email confirmation
6. Click **Create user**

### Option 2: Using SQL

Run this SQL query in the Supabase SQL Editor:

```sql
-- Create admin user (replace with your email and password)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@example.com',
  crypt('your_password_here', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  '',
  '',
  '',
  ''
);
```

## Logging In

1. Start the application (`npm run dev`)
2. Click on **دخول** (Login) in the navigation
3. Enter your admin credentials
4. You'll be redirected to the admin dashboard

## Admin Capabilities

Once logged in as an admin, you can:

- View all pending, approved, and rejected summaries
- Approve or reject submitted summaries
- Edit summary content and titles
- Delete summaries
- Change the status of any summary

## Security Notes

- **Never commit** admin credentials to version control
- Use strong passwords for admin accounts
- Regularly review and audit admin actions
- Consider implementing additional security measures for production:
  - Two-factor authentication
  - IP whitelisting
  - Audit logs
  - Session timeouts

## Troubleshooting

### Can't log in?

1. Make sure you've confirmed the email (or used Auto Confirm)
2. Check that you're using the correct email and password
3. Verify your Supabase connection in the browser console

### Don't see the admin dashboard?

1. Make sure you're logged in
2. Check browser console for errors
3. Verify that the RLS policies are correctly set up

## Multiple Admins

To add more admins, simply repeat the user creation process with different email addresses. All authenticated users have admin access to the dashboard with the current setup.

For production, you may want to:
1. Add a `role` column to the users table
2. Restrict admin access to specific roles
3. Implement more granular permissions

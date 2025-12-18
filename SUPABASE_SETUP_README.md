# Supabase Setup Guide for Molkhas App

## 🚀 Quick Setup (Windows)

### Option 1: PowerShell Script (Recommended) - For Remote Supabase Projects
If you already have a Supabase project set up remotely, just run:
```powershell
.\setup-supabase.ps1
```
This will guide you to create the `.env` file with your credentials.

### Option 2: Manual Setup

#### For Remote Supabase Projects (Recommended):
1. **Create a `.env` file** in your project root with:
   ```env
   VITE_SUPABASE_URL=https://jcufigozkhxazjbwhjjm.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_uJAV3NEF7ox4mzxkaI9iRg_uHIQ5mTn
   ```

#### For Local Development (Optional):
1. **Install Supabase CLI** (using npx instead of global install):
   ```bash
   npm install supabase --save-dev
   # OR use npx directly
   npx supabase --version
   ```

2. **Login to Supabase** (if using local development):
   ```bash
   npx supabase login
   ```

3. **Start local Supabase** (if using local development):
   ```bash
   npx supabase start
   ```

4. **Run database migrations** (if using local development):
   ```bash
   npx supabase db reset
   ```

## 🔧 Environment Variables

Create a `.env` file in your project root with:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

## 📊 Database Schema

The app includes the following tables:
- `summaries` - Study summaries with approval workflow
- `news` - News/announcements
- `appeals` - Appeal requests for rejected content
- `chats` - Chat conversations
- `messages` - Individual chat messages
- `chat_participants` - Chat membership
- `notifications` - User notifications

## 🎯 Testing Setup

After setup, run:
```bash
npm run dev
```

Your app should now work with full database functionality!

## 🐛 Troubleshooting

### "command not found: supabase" or "Installing Supabase CLI as a global module is not supported"
- Supabase CLI cannot be installed globally with npm
- Use `npx supabase` instead of `supabase` command
- Or install locally: `npm install supabase --save-dev`

### "You are not logged in"
- Run: `supabase login`

### "Missing closing '}' in statement block" (PowerShell)
- The setup script has been fixed to remove special characters that cause PowerShell parsing issues
- Make sure you're using PowerShell 5.1 or later

### Database connection errors
- Ensure Supabase is running: `supabase status`
- Check your `.env` file has correct URLs

### Migration errors
- Reset database: `supabase db reset`

### TypeScript errors after setup
- The remaining TypeScript warnings are non-critical and won't prevent the app from running
- They can be addressed later for better type safety

## 🔗 Useful Links

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Supabase Local Development](https://supabase.com/docs/guides/local-development)
- [Molkhas App GitHub](https://github.com/your-repo/molkhas)

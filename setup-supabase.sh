#!/bin/bash

echo "🚀 Setting up Supabase for Molkhas App"
echo "====================================="

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "📥 Please install it from: https://supabase.com/docs/guides/cli"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if user is logged in
echo "🔐 Checking Supabase authentication..."
if ! supabase projects list &> /dev/null; then
    echo "❌ You are not logged in to Supabase CLI."
    echo "🔑 Please run: supabase login"
    exit 1
fi

echo "✅ Supabase CLI is ready!"

# Initialize Supabase if not already done
if [ ! -d "supabase" ]; then
    echo "📁 Initializing Supabase project..."
    supabase init
else
    echo "✅ Supabase project already initialized"
fi

# Start local Supabase
echo "🏃 Starting local Supabase..."
supabase start

# Run migrations
echo "🗃️ Running database migrations..."
supabase db reset

echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy your local Supabase URL and anon key to your .env file:"
echo "   VITE_SUPABASE_URL=http://127.0.0.1:54321"
echo "   VITE_SUPABASE_ANON_KEY=your-anon-key-here"
echo ""
echo "2. Your app should now work with the database!"
echo "3. Run 'npm run dev' to start the development server"

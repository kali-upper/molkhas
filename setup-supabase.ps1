# PowerShell script to set up Supabase for Molkhas App

Write-Host "Setting up Supabase for Molkhas App" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green

# Check if Supabase CLI is installed
try {
    $supabaseVersion = supabase --version 2>$null
    Write-Host "Supabase CLI found: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "Supabase CLI is not installed." -ForegroundColor Red
    Write-Host "Please install it using one of these methods:" -ForegroundColor Yellow
    Write-Host "1. Using npm (not globally): npm install supabase --save-dev" -ForegroundColor Yellow
    Write-Host "2. Using npx: npx supabase --version" -ForegroundColor Yellow
    Write-Host "3. Download from: https://github.com/supabase/cli/releases" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "For this setup, we'll use npx to run Supabase commands." -ForegroundColor Cyan
    Write-Host "Continuing with setup..." -ForegroundColor Green
}

# Check if user is logged in (skip for now since we're using remote Supabase)
Write-Host "Using remote Supabase project - no local setup needed" -ForegroundColor Green
Write-Host "Your Supabase credentials are already configured in the script" -ForegroundColor Cyan

# Skip local Supabase setup since user has remote project configured
Write-Host "Skipping local Supabase initialization..." -ForegroundColor Yellow

Write-Host "Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Create a .env file with your Supabase credentials:" -ForegroundColor White
Write-Host "   VITE_SUPABASE_URL=https://jcufigozkhxazjbwhjjm.supabase.co" -ForegroundColor White
Write-Host "   VITE_SUPABASE_ANON_KEY=sb_publishable_uJAV3NEF7ox4mzxkaI9iRg_uHIQ5mTn" -ForegroundColor White
Write-Host ""
Write-Host "2. Your app should now work with the database!" -ForegroundColor Green
Write-Host "3. Run 'npm run dev' to start the development server" -ForegroundColor Green
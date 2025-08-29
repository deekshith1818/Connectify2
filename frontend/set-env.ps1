# PowerShell script to set environment variables in Vercel
Write-Host "Setting environment variables in Vercel..." -ForegroundColor Green

# Set VITE_API_URL
Write-Host "Setting VITE_API_URL..." -ForegroundColor Yellow
$envVars = @{
    "VITE_API_URL" = "https://connectify-backend-4f61.onrender.com"
    "VITE_DEV_API_URL" = "https://connectify-backend-4f61.onrender.com"
}

foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    Write-Host "Setting $key = $value" -ForegroundColor Cyan
    
    # Use echo to pipe the value to vercel env add
    echo $value | vercel env add $key production
}

Write-Host "Environment variables set successfully!" -ForegroundColor Green
Write-Host "Redeploying with new environment variables..." -ForegroundColor Yellow
vercel --prod

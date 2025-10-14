#!/bin/bash

# AuraText Admin Dashboard Deployment Script

echo "🚀 Deploying AuraText Admin Dashboard..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Deploy backend
echo "📡 Deploying backend..."
cd backend
vercel --prod --yes
BACKEND_URL=$(vercel ls | grep auratext-admin-backend | awk '{print $2}' | head -1)
echo "✅ Backend deployed to: $BACKEND_URL"

# Update frontend environment
echo "🎨 Updating frontend configuration..."
cd ../frontend
echo "VITE_API_URL=https://$BACKEND_URL" > .env.production

# Deploy frontend
echo "🌐 Deploying frontend..."
vercel --prod --yes
FRONTEND_URL=$(vercel ls | grep auratext-admin-frontend | awk '{print $2}' | head -1)
echo "✅ Frontend deployed to: $FRONTEND_URL"

echo ""
echo "🎉 Deployment Complete!"
echo "📊 Dashboard URL: https://$FRONTEND_URL"
echo "🔗 API URL: https://$BACKEND_URL"
echo ""
echo "📝 Next steps:"
echo "1. Update AnalyticsService.js with the API URL: https://$BACKEND_URL"
echo "2. Test the dashboard at: https://$FRONTEND_URL"
echo "3. Integrate AnalyticsService into your main AuraText app"
echo ""
echo "🔑 API Key: auratext_secret_key_2024_launch_secure"
echo "📚 Full integration guide: See README.md"

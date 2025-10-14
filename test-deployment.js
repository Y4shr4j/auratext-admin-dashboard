// Quick test script to check your deployment
// Run this in your browser console on your frontend URL

console.log('🧪 Testing AuraText Dashboard Deployment...');

// Test 1: Check if frontend is loading
console.log('✅ Frontend loaded successfully');

// Test 2: Check API connection
fetch('https://your-backend-url.vercel.app/api/health')
  .then(response => response.json())
  .then(data => {
    console.log('✅ Backend health check:', data);
  })
  .catch(error => {
    console.error('❌ Backend connection failed:', error);
    console.log('🔧 Check your backend URL and deployment');
  });

// Test 3: Check environment variables
console.log('🔧 API Base URL:', window.location.origin);
console.log('🔧 Expected Backend URL: https://your-backend-url.vercel.app');

console.log('📊 If you see errors above, check:');
console.log('1. Backend URL is correct');
console.log('2. Backend is deployed successfully');
console.log('3. Environment variables are set');
console.log('4. CORS is configured properly');

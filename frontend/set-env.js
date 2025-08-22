// Script to set environment variables in Vercel
// Run this with: node set-env.js

const { execSync } = require('child_process');

const envVars = {
  'VITE_API_URL': 'https://connectify3.onrender.com',
  'VITE_DEV_API_URL': 'https://connectify3.onrender.com'
};

console.log('Setting environment variables in Vercel...');

Object.entries(envVars).forEach(([key, value]) => {
  try {
    console.log(`Setting ${key} = ${value}`);
    execSync(`vercel env add ${key} production`, { 
      input: value + '\n',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    console.log(`✅ ${key} set successfully`);
  } catch (error) {
    console.log(`❌ Failed to set ${key}:`, error.message);
  }
});

console.log('\nRedeploying with new environment variables...');
try {
  execSync('vercel --prod', { stdio: 'inherit' });
  console.log('✅ Deployment complete!');
} catch (error) {
  console.log('❌ Deployment failed:', error.message);
}

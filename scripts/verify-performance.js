#!/usr/bin/env node

/**
 * Performance Verification Script
 * Tests the /api/dashboard/data endpoint response time
 * 
 * Usage: node scripts/verify-performance.js [API_URL]
 * Example: node scripts/verify-performance.js http://localhost:8000
 */

const https = require('https');
const http = require('http');

const API_URL = process.argv[2] || 'http://localhost:8000';
const ENDPOINT = '/api/dashboard/data';

// Get token from environment or prompt user
const TOKEN = process.env.API_TOKEN || null;

if (!TOKEN) {
  console.error('❌ Error: API_TOKEN environment variable not set');
  console.log('\nUsage:');
  console.log('  API_TOKEN=your_jwt_token node scripts/verify-performance.js [API_URL]');
  console.log('\nOr set it in your .env file and source it.');
  process.exit(1);
}

function makeRequest(url, token) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    const startTime = Date.now();
    
    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;
        
        resolve({
          statusCode: res.statusCode,
          duration,
          data: data ? JSON.parse(data) : null,
          headers: res.headers
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error('Request timeout after 60 seconds'));
    });
    
    req.end();
  });
}

async function verifyPerformance() {
  console.log('🔍 Performance Verification Script');
  console.log('=====================================\n');
  console.log(`📍 Testing: ${API_URL}${ENDPOINT}`);
  console.log(`🔐 Using token: ${TOKEN.substring(0, 20)}...\n`);
  
  try {
    console.log('⏱️  Starting performance test...\n');
    
    const result = await makeRequest(`${API_URL}${ENDPOINT}`, TOKEN);
    
    console.log('📊 Results:');
    console.log('-------------------------------------');
    console.log(`Status Code: ${result.statusCode}`);
    console.log(`Response Time: ${result.duration.toFixed(2)}s`);
    console.log(`Content-Type: ${result.headers['content-type'] || 'N/A'}`);
    console.log(`Content-Length: ${result.headers['content-length'] || 'N/A'} bytes\n`);
    
    if (result.data) {
      const data = result.data;
      console.log('📦 Response Data:');
      console.log(`  - Links: ${data.links?.length || 0}`);
      console.log(`  - Media: ${data.media?.length || 0}`);
      console.log(`  - Items: ${data.items?.length || 0}`);
      console.log(`  - Ring Settings: ${data.ring_settings ? 'Yes' : 'No'}\n`);
    }
    
    // Performance evaluation
    console.log('🎯 Performance Evaluation:');
    console.log('-------------------------------------');
    
    if (result.statusCode !== 200) {
      console.log(`❌ FAILED: Status code ${result.statusCode}`);
      process.exit(1);
    }
    
    if (result.duration < 3) {
      console.log(`✅ EXCELLENT: ${result.duration.toFixed(2)}s (Target: <3s)`);
      console.log('   Combined endpoint is working optimally!');
    } else if (result.duration < 10) {
      console.log(`✅ GOOD: ${result.duration.toFixed(2)}s (Target: <10s)`);
      console.log('   Performance is acceptable, but could be improved.');
    } else if (result.duration < 33) {
      console.log(`⚠️  ACCEPTABLE: ${result.duration.toFixed(2)}s (Target: <33s)`);
      console.log('   Better than before, but still needs optimization.');
    } else {
      console.log(`❌ POOR: ${result.duration.toFixed(2)}s (Target: <33s)`);
      console.log('   Performance is worse than expected. Check backend logs.');
      process.exit(1);
    }
    
    console.log('\n✅ Verification complete!');
    
  } catch (error) {
    console.error('\n❌ Error during verification:');
    console.error(error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Tip: Make sure the backend server is running.');
    } else if (error.message.includes('401') || error.message.includes('403')) {
      console.error('\n💡 Tip: Check that your API token is valid and not expired.');
    }
    
    process.exit(1);
  }
}

// Run verification
verifyPerformance();




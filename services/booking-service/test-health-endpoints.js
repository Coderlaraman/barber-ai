// Test script to verify health endpoints work
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3005,
  path: '/health',
  method: 'GET'
};

console.log('🧪 Testing health endpoint...');

const req = http.request(options, (res) => {
  console.log(`📊 Status Code: ${res.statusCode}`);
  console.log(`📋 Headers: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`📄 Response: ${data}`);
  });
});

req.on('error', (error) => {
  console.log(`❌ Health endpoint test failed: ${error.message}`);
  console.log('💡 This is expected if the service is not running');
});

req.end();

// Also test readiness and liveness endpoints
setTimeout(() => {
  const readyOptions = { ...options, path: '/health/ready' };
  const readyReq = http.request(readyOptions, (res) => {
    console.log(`\n🧪 Testing readiness endpoint...`);
    console.log(`📊 Status Code: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`📄 Response: ${data}`);
    });
  });
  
  readyReq.on('error', (error) => {
    console.log(`❌ Readiness endpoint test failed: ${error.message}`);
  });
  
  readyReq.end();
}, 1000);

setTimeout(() => {
  const liveOptions = { ...options, path: '/health/live' };
  const liveReq = http.request(liveOptions, (res) => {
    console.log(`\n🧪 Testing liveness endpoint...`);
    console.log(`📊 Status Code: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`📄 Response: ${data}`);
    });
  });
  
  liveReq.on('error', (error) => {
    console.log(`❌ Liveness endpoint test failed: ${error.message}`);
  });
  
  liveReq.end();
}, 2000);
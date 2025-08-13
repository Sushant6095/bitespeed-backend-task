// Simple HTTP test script for the /identify endpoint
const http = require('http');

const testCases = [
  {
    name: 'Valid request with email and phone',
    data: { email: 'test@example.com', phoneNumber: '+1234567890' }
  },
  {
    name: 'Valid request with email only',
    data: { email: 'user@example.com' }
  },
  {
    name: 'Valid request with phone only',
    data: { phoneNumber: '+9876543210' }
  },
  {
    name: 'Empty request body (should fail)',
    data: {}
  },
  {
    name: 'Request with empty strings (should fail)',
    data: { email: '', phoneNumber: '' }
  }
];

function makeRequest(testCase) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(testCase.data);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/identify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            response: response
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            response: data
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing /identify HTTP endpoint\n');
  
  for (const testCase of testCases) {
    console.log(`📝 ${testCase.name}`);
    console.log(`Request: ${JSON.stringify(testCase.data)}`);
    
    try {
      const result = await makeRequest(testCase);
      console.log(`Status: ${result.statusCode}`);
      console.log(`Response: ${JSON.stringify(result.response, null, 2)}`);
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log('---\n');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { makeRequest, runTests }; 
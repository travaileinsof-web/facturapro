const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 3003,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  console.log('STATUS:', res.statusCode);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('BODY:', data));
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(JSON.stringify({email: "test@example.com"}));
req.end();

const http = require('http');

http.get('http://localhost:8000/test_db.php', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log('Response:', data));
}).on('error', (err) => console.error('Error:', err.message));

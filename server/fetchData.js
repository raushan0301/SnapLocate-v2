const http = require('http');

http.get('http://localhost:5001/api/admin/lost-found', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});

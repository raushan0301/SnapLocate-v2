const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/admin/lost-found?status=all&category=all',
  method: 'GET',
  headers: {
    // I need an admin auth token. I can simulate it by hacking the middleware temporarily.
  }
};

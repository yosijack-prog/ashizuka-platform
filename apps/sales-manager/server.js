const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = 5176;
http.createServer((req, res) => {
  fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
    if (err) { res.writeHead(500); res.end('Error'); return; }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(data);
  });
}).listen(PORT, () => console.log(`📊 Sales Manager → http://localhost:${PORT}`));

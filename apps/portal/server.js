// インストール不要のポータルサーバー（Node.js 組み込みモジュールのみ使用）
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5172;

const server = http.createServer((req, res) => {
  const filePath = path.join(__dirname, 'index.html');
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500);
      res.end('Error loading portal');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`🍾 芦塚酒店ポータル → http://localhost:${PORT}`);
});

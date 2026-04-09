import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5176,
    proxy: {
      '/mf-token': {
        target: 'https://api.biz.moneyforward.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mf-token/, ''),
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            // WWW-Authenticateヘッダーを削除してブラウザのBasic Authダイアログを防ぐ
            delete proxyRes.headers['www-authenticate'];
          });
        },
      },
      '/mf-api': {
        target: 'https://accounting.moneyforward.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mf-api/, ''),
      },
      '/mf-payroll': {
        target: 'https://payroll.moneyforward.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mf-payroll/, ''),
      },
    },
  },
  define: { 'import.meta.env.VITE_API_URL': JSON.stringify('http://localhost:3001') },
});

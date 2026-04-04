import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  define: { 'import.meta.env.VITE_API_URL': JSON.stringify('http://localhost:3001') },
});

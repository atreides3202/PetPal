import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 宣告 process 變數以符合 TypeScript 編譯檢查
declare var process: { env: { [key: string]: string | undefined } };

export default defineConfig({
  plugins: [react()],
  base: './', // 確保部署到 GitHub Pages 子路徑時資源路徑正確
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'recharts', 'lucide-react'],
        },
      },
    },
  }
});
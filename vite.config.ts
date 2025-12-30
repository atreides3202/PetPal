
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 宣告 process 變數以符合 TypeScript 編譯檢查
declare var process: { env: { [key: string]: string | undefined } };

export default defineConfig({
  plugins: [react()],
  base: './', // 關鍵：確保在 GitHub Pages 的子目錄下能正確運作
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

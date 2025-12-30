
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 宣告 process 變數以符合 TypeScript 編譯檢查
declare var process: { env: { [key: string]: string | undefined } };

export default defineConfig({
  plugins: [react()],
  base: '/PetPal/', // 必須與 GitHub 儲存庫名稱一致
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'recharts', 'lucide-react'],
        },
      },
    },
  }
});

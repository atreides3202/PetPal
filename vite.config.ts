import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // Using './' instead of '/PetPal/' is a "magic" fix for many users
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})

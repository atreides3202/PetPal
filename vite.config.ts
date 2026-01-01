import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/PetPal/', // <--- THIS IS THE FIX FOR THE WHITE PAGE
})

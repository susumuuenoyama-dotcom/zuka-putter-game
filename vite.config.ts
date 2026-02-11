import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/zuka-putter-game/', // この一行が、GitHub Pagesで芝生を映す鍵です
})

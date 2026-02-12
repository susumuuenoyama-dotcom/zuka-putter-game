

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pagesでリポジトリ名がURLに含まれても正しく動作するように設定
  base: './', 
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})

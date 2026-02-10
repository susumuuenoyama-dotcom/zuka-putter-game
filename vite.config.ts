
import { defineConfig } from 'vite';

export default defineConfig({
  // リポジトリ名に合わせて base を設定（例: /zuka-putter-sim-pro/）
  // ユーザー名.github.io の直下に置く場合は '/' でOKです
  base: './', 
  build: {
    outDir: 'dist',
  }
});

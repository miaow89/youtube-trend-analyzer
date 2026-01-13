
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages 저장소 이름(youtube-trend-analyzer)을 base 경로로 설정합니다.
  base: '/youtube-trend-analyzer/',
  define: {
    'process.env': {}
  }
});

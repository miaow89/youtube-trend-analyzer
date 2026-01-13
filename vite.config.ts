
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages 저장소 이름(youtube-trend-analyzer)을 base 경로로 설정합니다.
  base: '/youtube-trend-analyzer/',
  define: {
    // 빌드 타임의 process.env.API_KEY를 클라이언트 코드에 주입합니다.
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});

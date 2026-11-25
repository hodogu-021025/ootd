import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 이 프로젝트 전용 포트 (5173, 5174는 다른 프로젝트에서 사용)
    port: 5175,
    strictPort: true,
  },
  preview: {
    // 빌드 결과 확인용 포트
    port: 4173,
    strictPort: true,
  },
})

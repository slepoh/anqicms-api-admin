import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Cloudflare Pages 部署配置
// 构建命令: npm run build
// 输出目录: dist
// 构建时通过环境变量注入配置（VITE_ 前缀），由 Cloudflare Pages 的
// “环境变量 / 密钥” 提供：账号、密码、域名、token。
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});

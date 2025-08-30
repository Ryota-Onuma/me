import { defineConfig } from "vite";
// Node型が無い環境でもビルド可能にするための宣言
// （型安全性に影響しない範囲での簡易対処）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const process: any;
import react from "@vitejs/plugin-react";

const frontendPort = Number(process.env.FRONTEND_PORT) || 5173;
// NOTE: backend のポートに PORT を使うと、Vite 側の PORT=5173 などに引きずられ
// "/api" が自身(5173)へプロキシ → HTML が返る → JSON パースエラー、という事故が起きる。
// ここでは BACKEND_PORT のみを見る。
const backendPort = Number(process.env.BACKEND_PORT) || 8888;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "../web",
    emptyOutDir: true,
  },
  server: {
    port: frontendPort,
    proxy: {
      "/api": {
        target: `http://localhost:${backendPort}`,
        changeOrigin: true,
      },
    },
  },
});

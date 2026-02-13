import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  esbuild: {
    legalComments: "none",
    drop: ["debugger"]
  },
  server: {
    port: 5151,
    strictPort: true,
    host: "0.0.0.0",
    headers: {
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    proxy: {
      "/api": {
        target: "http://localhost:8108",
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 5151,
    strictPort: true,
    host: "0.0.0.0"
  },
  build: {
    sourcemap: false,
    cssCodeSplit: true,
    target: "es2020",
    reportCompressedSize: false
  }
});

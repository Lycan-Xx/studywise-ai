import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(async () => ({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [(await import("@replit/vite-plugin-cartographer")).cartographer()]
      : []),
  ],
  envDir: path.resolve(__dirname, ".."), // Look for .env files in the project root
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../client/src"),
      "@shared": path.resolve(__dirname, "../shared"),
      "@assets": path.resolve(__dirname, "../attached_assets"),
    },
  },
  root: path.resolve(__dirname, "../client"),
  build: {
    outDir: path.resolve(__dirname, "../dist/public"),
    emptyOutDir: true,
  },
  server: {
    port: 8080,
    host: true, // Allow all hosts
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL || "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
    allowedHosts: [
      "*", // Allow all hosts
      "6844a182-fd51-4b7c-9740-8690830e1d7d-00-1e0r0uvp0d3y9.worf.replit.dev", // Specific Replit host", // Specific Replit host
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
}));

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths(), tailwindcss()],
  server: {
    port: 5173,
    // Permitir hosts de túneles (cloudflared/ngrok) para probar el retorno de Mercado Pago.
    allowedHosts: ['.trycloudflare.com', '.ngrok-free.app', '.loca.lt'],
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});

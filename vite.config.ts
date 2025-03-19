
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Proxy all API requests to the backend
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    commonjsOptions: {
      // Ensure we properly handle node-specific modules
      transformMixedEsModules: true,
      // Needed for bundling browser-friendly packages
      exclude: [
        'node_modules/@serialport/**',
        'node_modules/serialport/**', 
        'node_modules/modbus-serial/**',
      ],
    },
  },
  optimizeDeps: {
    // Exclude native modules from processing
    exclude: ['serialport', '@serialport/bindings', 'modbus-serial'],
  },
}));

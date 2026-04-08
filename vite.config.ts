import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
const buildId = Date.now();
export default defineConfig({
  server: {
    host: "0.0.0.0",
  },
  base: '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-${buildId}.js`,
        chunkFileNames: `assets/[name]-${buildId}.js`,
        assetFileNames: `assets/[name]-${buildId}.[ext]`
      }
    }
  }
})

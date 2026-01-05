import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Let Vite optimize dependencies (do not exclude `lucide-react`) so
  // icon modules are pre-bundled and available during dev and build.
});

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // In development the API is reached through this proxy, so VITE_API_URL can stay unset.
    proxy: { '/api': 'http://localhost:5000' },
  },
});

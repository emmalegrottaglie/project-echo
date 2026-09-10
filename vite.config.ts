import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    // Public KiwiSDR nodes are almost all plain http:// on odd ports, so their
    // WebSocket endpoints are ws:// rather than wss://. A page served over https
    // cannot open a ws:// socket (mixed content), so the dev server stays on http.
    // See README.md "Deployment constraint".
    https: undefined,
    host: '127.0.0.1',
    port: 5173,
  },
});

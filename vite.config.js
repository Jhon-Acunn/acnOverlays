import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: 'src/client',
  base: '/',
  build: {
    outDir: resolve(__dirname, 'dist/client'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        dashboard: resolve(__dirname, 'src/client/dashboard/index.html'),
        'lower-third': resolve(__dirname, 'src/client/templates/lower-third/index.html'),
        'lower-third-dual': resolve(__dirname, 'src/client/templates/lower-third-dual/index.html'),
        scoreboard: resolve(__dirname, 'src/client/templates/scoreboard/index.html'),
        sponsors: resolve(__dirname, 'src/client/templates/sponsors/index.html'),
        ticker: resolve(__dirname, 'src/client/templates/ticker/index.html'),
      }
    }
  },
  server: {
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true
      },
      '/api': {
        target: 'http://localhost:3000'
      },
      '/assets': {
        target: 'http://localhost:3000'
      }
    }
  }
})

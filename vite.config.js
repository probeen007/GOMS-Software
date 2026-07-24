import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const staticSiteDir = path.join(__dirname, 'auto/static')

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

// Serves the plain HTML/CSS/JS public marketing site (auto/static) directly
// from the Vite dev server, so "npm run dev" matches production behavior
// where Express serves the same folder at "/". /login and /dashboard* are
// left untouched for the React SPA.
function staticSitePlugin() {
  return {
    name: 'serve-static-public-site',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const urlPath = (req.url || '/').split('?')[0]
        if (
          urlPath.startsWith('/api') ||
          urlPath.startsWith('/login') ||
          urlPath.startsWith('/dashboard') ||
          urlPath.startsWith('/src') ||
          urlPath.startsWith('/@') ||
          urlPath.startsWith('/uploads') ||
          urlPath.startsWith('/node_modules')
        ) {
          return next()
        }

        const relativePath = urlPath === '/' ? 'index.html' : decodeURIComponent(urlPath.slice(1))
        const filePath = path.join(staticSiteDir, relativePath)

        if (!filePath.startsWith(staticSiteDir)) return next()

        fs.stat(filePath, (err, stats) => {
          if (err || !stats.isFile()) return next()
          res.setHeader('Content-Type', MIME_TYPES[path.extname(filePath)] || 'application/octet-stream')
          fs.createReadStream(filePath).pipe(res)
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), staticSitePlugin()],
  server: {
    port: 3000,
    allowedHosts: ['1e0e-160-250-255-225.ngrok-free.app', '.ngrok-free.app', 'localhost'],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['recharts'],
          'vendor-icons': ['lucide-react']
        }
      }
    }
  }
})

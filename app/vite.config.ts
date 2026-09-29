import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

const protoSrc = path.resolve(__dirname, 'public/prototype.html')

function protoHashPlugin(): Plugin {
  return {
    name: 'prototype-hash',
    closeBundle() {
      const content = fs.readFileSync(protoSrc)
      const hash = crypto.createHash('md5').update(content).digest('hex').slice(0, 8)
      fs.copyFileSync(protoSrc, path.resolve(__dirname, `dist/prototype.${hash}.html`))
    },
  }
}

export default defineConfig(({ command }) => {
  // In dev, use plain prototype.html (served from public/ as-is)
  // In build, compute hash so CDN cache-busts on every change
  const protoFile = command === 'build'
    ? (() => {
        const content = fs.readFileSync(protoSrc)
        const hash = crypto.createHash('md5').update(content).digest('hex').slice(0, 8)
        return `prototype.${hash}.html`
      })()
    : 'prototype.html'

  return {
    base: '/MVP-Feedback-Intelligence--30th-May/',
    server: { port: process.env.PORT ? parseInt(process.env.PORT) : 5173 },
    plugins: [react(), tailwindcss(), protoHashPlugin()],
    define: {
      __BUILD_TIME__: JSON.stringify(Date.now()),
      __PROTO_FILE__: JSON.stringify(protoFile),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})

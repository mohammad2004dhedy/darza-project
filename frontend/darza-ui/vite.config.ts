import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'optional-preconnects',
        transformIndexHtml: {
          order: 'pre',
          handler(html) {
            return html.replace(
              /\s*<link rel="preconnect" href="%(VITE_API_BASE_URL|VITE_STORAGE_ORIGIN)%"[^>]*>/g,
              (tag, key: string) => (env[key] ? tag : ''),
            )
          },
        },
      },
    ],
  }
})

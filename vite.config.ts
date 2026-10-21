import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configurado para verse en el navegador del móvil y para poder empaquetarse
// más adelante con Capacitor:
// - host 0.0.0.0 + allowedHosts para la vista previa remota.
// - base relativa para que los archivos funcionen dentro de una app Android.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
    allowedHosts: true,
  },
  worker: {
    format: 'es',
  },
})

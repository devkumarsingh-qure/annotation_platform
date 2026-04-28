import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteCommonjs } from '@originjs/vite-plugin-commonjs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), viteCommonjs()],
  worker: {
    format: 'es'
  },
  optimizeDeps: {
    exclude: ["@cornerstonejs/dicom-image-loader", "@qureai/react-dicom-viewer"],
    include: ["xmlbuilder2", "dicom-parser"]
  },
})

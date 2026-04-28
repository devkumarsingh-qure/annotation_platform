import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteCommonjs } from '@originjs/vite-plugin-commonjs'
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    viteCommonjs(),
    nodePolyfills()
  ],
  optimizeDeps: {
    exclude: ["@cornerstonejs/dicom-image-loader", "@qureai/react-dicom-viewer"],
    include: ["xmlbuilder2", "dicom-parser"],
  },
  worker: {
    format: 'es',
  },
  //resolve: {
  //  alias: {
  //    fs: "browserify-fs",
  //    path: "path-browserify",
  //    stream: "stream-browserify",
  //    buffer: "buffer",
  //    util: "util",
  //    events: "events",
  //    string_decoder: "string_decoder",
  //  },
  //},
})

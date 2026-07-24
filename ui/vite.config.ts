import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteCommonjs } from "@originjs/vite-plugin-commonjs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [react(), tailwindcss(), viteCommonjs()],
  optimizeDeps: {
    exclude: [
      "@cornerstonejs/dicom-image-loader",
      "@qureai/react-dicom-viewer",
    ],
    include: ["xmlbuilder2", "dicom-parser"],
  },
  worker: {
    format: "es",
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  resolve: {
    alias: [{ find: /^events\/?$/, replacement: require.resolve("events/") }],
  },
}));

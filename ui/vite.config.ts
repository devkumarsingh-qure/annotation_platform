import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteCommonjs } from "@originjs/vite-plugin-commonjs";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
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
  ...(command !== "serve"
    ? {
        resolve: {
          alias: {
            fs: "browserify-fs",
            path: "path-browserify",
            stream: "stream-browserify",
            buffer: "buffer",
            util: "util",
            events: "events",
            string_decoder: "string_decoder",
          },
        },
      }
    : {}),
}));

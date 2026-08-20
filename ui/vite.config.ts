import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteCommonjs } from "@originjs/vite-plugin-commonjs";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { basename, dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const applicationRoot = fileURLToPath(new URL("..", import.meta.url));
const linkedQviewRoot = fileURLToPath(
  new URL("../../qview", import.meta.url),
);
const onnxRuntimeDist = dirname(require.resolve("onnxruntime-web"));
const onnxRuntimeWasmFiles = new Set([
  "ort-wasm-simd-threaded.jsep.wasm",
  "ort-wasm-simd.jsep.wasm",
]);

function linkedQviewFullReloadPlugin(): Plugin {
  const linkedDistPrefix = `${join(linkedQviewRoot, "dist")}${sep}`;

  return {
    name: "linked-qview-full-reload",
    handleHotUpdate({ file, server }) {
      if (!file.startsWith(linkedDistPrefix)) return;

      // qview owns singleton Cornerstone rendering engines and tool groups.
      // React HMR preserves those globals while replacing the components,
      // which leaves the lazy SAM controller bound to a different registry.
      server.ws.send({ type: "full-reload", path: "*" });
      return [];
    },
  };
}

function onnxRuntimeWasmPlugin(): Plugin {
  return {
    name: "onnx-runtime-wasm",
    configureServer(server) {
      server.middlewares.use("/ort", async (request, response, next) => {
        const fileName = basename(request.url?.split("?", 1)[0] ?? "");
        if (!onnxRuntimeWasmFiles.has(fileName)) {
          next();
          return;
        }

        try {
          const source = await readFile(join(onnxRuntimeDist, fileName));
          response.statusCode = 200;
          response.setHeader("Content-Type", "application/wasm");
          response.setHeader("Content-Length", source.byteLength);
          response.setHeader("Cache-Control", "no-cache");
          response.end(source);
        } catch (error) {
          next(error as Error);
        }
      });
    },
    async generateBundle() {
      for (const fileName of onnxRuntimeWasmFiles) {
        this.emitFile({
          type: "asset",
          fileName: `ort/${fileName}`,
          source: await readFile(join(onnxRuntimeDist, fileName)),
        });
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [
    react(),
    tailwindcss(),
    viteCommonjs(),
    linkedQviewFullReloadPlugin(),
    onnxRuntimeWasmPlugin(),
  ],
  optimizeDeps: {
    exclude: [
      "@cornerstonejs/dicom-image-loader",
      // These packages hold singleton rendering/tool state. Keeping them out
      // of Vite's replaceable optimized chunks gives the linked viewer and
      // lazy SAM controller one stable module instance during development.
      "@cornerstonejs/core",
      "@cornerstonejs/tools",
      "@cornerstonejs/metadata",
      "@cornerstonejs/adapters",
      "@cornerstonejs/utils",
      "@qureai/react-dicom-viewer",
    ],
    // The linked viewer loads Cornerstone AI only when the user opens the AI
    // workflow, so Vite cannot discover it during its normal startup scan.
    // Pre-bundle it eagerly to prevent a late optimizer run from invalidating
    // the module URL with an "Outdated Optimize Dep" response.
    include: [
      "xmlbuilder2",
      "dicom-parser",
      "dcmjs",
      "@cornerstonejs/ai",
      "onnxruntime-web/webgpu",
    ],
  },
  worker: {
    format: "es",
  },
  server: {
    fs: {
      allow: [applicationRoot, linkedQviewRoot],
    },
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
    dedupe: [
      "react",
      "react-dom",
      "@cornerstonejs/core",
      "@cornerstonejs/tools",
      "@cornerstonejs/metadata",
      "@cornerstonejs/adapters",
      "@cornerstonejs/dicom-image-loader",
      "@cornerstonejs/utils",
      "@cornerstonejs/ai",
      "onnxruntime-web",
    ],
  },
}));

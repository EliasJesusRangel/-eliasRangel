/// <reference types='vitest' />
import { readFileSync } from "fs";
import { defineConfig, PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import { createHash } from 'crypto';

import path from 'path';

const host = process.env.TAURI_DEV_HOST;
function nativeFilesPlugin(): PluginOption {
  interface NativeFile {
    readonly fileName: string;
    readonly fileContent: Buffer;
  }
  const nativeFiles = new Map<string, NativeFile>();
  const uws = require.resolve('uWebSockets.js');
  const readNativeFile = async (filePath: string): Promise<NativeFile> => {
    const fileContent = readFileSync(filePath);
    const hash = createHash('sha256').update(fileContent).digest('hex').slice(0, 8);
    const fileName = `${path.basename(filePath, '.node')}.${hash}.node`;

    return { fileName, fileContent };
  };

  return {
    name: 'native-files-plugin',
    async load(id) {
      if (id === uws) {
        // Special handling for the ESM-wrapper around CJS-module with dynamic requires (uWebSockets.js).
        const nativeFile = await readNativeFile(
          // Yes, build the file name at build time, not runtime 🤷‍♂️(we can't do dynamic `import {} from ''`)
          path.resolve(path.dirname(uws), './uws_' + process.platform + '_' + process.arch + '_' + process.versions.modules + '.node'),
        );
        nativeFiles.set(id, nativeFile);

        return `export default require('./${nativeFile.fileName}')`;
      } else if (id.endsWith('.node')) {
        const nativeFile = await readNativeFile(id);
        nativeFiles.set(id, nativeFile);

        return `export default require('./${nativeFile.fileName}');`;
      }

      return;
    },

    generateBundle(_, bundle) {
      for (const [id, { fileName, fileContent }] of Array.from(nativeFiles.entries())) {
        this.emitFile({ type: 'asset', fileName, source: fileContent });
        delete bundle[id];
      }
    },
  };
}
export default defineConfig({
  root: __dirname,
  cacheDir: '../node_modules/.vite/web',

  preview: {
    port: 1420,
    host: 'localhost',

  },

  envPrefix: ['VITE_', 'TAURI_ENV_*'],
  plugins: [react(), nxViteTsPaths(), nxCopyAssetsPlugin(['*.md', "*.nodec"])],
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
        protocol: 'ws',
        host,
        port: 1421,
      }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**'],
    },


  },
  clearScreen: false,

  // 2. tauri expects a fixed port, fail if that port is not available
  optimizeDeps: { exclude: ["tree-sitter", "tree-sitter-typescript"] },

  build: {
    target:
      process.env.TAURI_ENV_PLATFORM == 'windows'
        ? 'chrome105'
        : 'safari13',
    // don't minify for debug builds
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
    // produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_ENV_DEBUG,

    outDir: '../dist/web',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
      exclude: ["tree-sitter"]
    },

  },
  test: {
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../coverage/web',
      provider: 'v8',
    },
  },
});

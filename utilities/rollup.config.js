const { nodePolyfills } = require('rollup-plugin-polyfill-node');
const { withNx } = require('@nx/rollup/with-nx');
module.exports = withNx(
  {
    external: ['tree-sitter'],
    main: './src/index.ts',
    outputPath: '../dist/utilities',
    tsConfig: './tsconfig.lib.json',
    compiler: 'swc',
    format: ['cjs', 'esm'],
    assets: [{ input: '.', output: '.', glob: '*.md' }],
    plugins: [nodePolyfills],
  },
  {
    // plugins: [nodePolyfills({})],
    // Provide additional rollup configuration here. See: https://rollupjs.org/configuration-options
    // e.g.
    // output: { sourcemap: true },
  }
);

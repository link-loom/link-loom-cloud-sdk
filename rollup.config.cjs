const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const babel = require('@rollup/plugin-babel').default;
const alias = require('@rollup/plugin-alias');
const fs = require('fs');
const path = require('path');
const postcss = require('rollup-plugin-postcss');
const json = require('@rollup/plugin-json');
const peerDepsExternal = require('rollup-plugin-peer-deps-external');

// Node-only `require` calls left inside ESM builds of lazily loaded libraries. They never run in a
// browser, but host dependency optimizers (Vite/esbuild) try to resolve them and abort the dev server.
const NODE_ONLY_REQUIRES = [
  { module: 'chevrotain', call: 'require("../api")' },
  { module: 'pptxgenjs', call: "require('sizeof')" },
];

const stripNodeOnlyRequires = () => ({
  name: 'strip-node-only-requires',
  transform(code, id) {
    const matches = NODE_ONLY_REQUIRES.filter((entry) => id.includes(`/node_modules/${entry.module}/`) && code.includes(entry.call));

    if (!matches.length) {
      return null;
    }

    return { code: matches.reduce((current, entry) => current.split(entry.call).join('undefined'), code), map: null };
  },
});

// Stylesheets shipped as a list of relative `@import`s (glide-data-grid's dist/index.css) would reach the
// page as unresolved imports once injected; their files are inlined so the injected CSS carries the rules.
const RELATIVE_CSS_IMPORT = /@import\s+["'](\.{1,2}\/[^"']+\.css)["']\s*;/g;

const inlineCssImports = (code, id) =>
  code.replace(RELATIVE_CSS_IMPORT, (statement, relativePath) => {
    const importedPath = path.resolve(path.dirname(id), relativePath);
    return inlineCssImports(fs.readFileSync(importedPath, 'utf8'), importedPath);
  });

const inlineRelativeCssImports = () => ({
  name: 'inline-relative-css-imports',
  transform(code, id) {
    if (!id.endsWith('.css') || !code.includes('@import')) {
      return null;
    }

    return { code: inlineCssImports(code, id), map: null };
  },
});

const sharedPlugins = () => [
  stripNodeOnlyRequires(),
  inlineRelativeCssImports(),
  peerDepsExternal(),
  alias({
    entries: [{ find: '@', replacement: path.resolve(__dirname, 'src') }],
  }),
  resolve({
    browser: true,
    preferBuiltins: false,
    extensions: ['.mjs', '.js', '.jsx', '.json'],
  }),
  commonjs(),
  babel({
    babelHelpers: 'bundled',
    exclude: 'node_modules/**',
    extensions: ['.js', '.jsx'],
  }),
  postcss({
    modules: false,
    minimize: true,
    sourceMap: true,
  }),
  json(),
];

// Packages that carry React context or are shared singletons with the host stay external, including
// every deep import (`@mui/material/Button`, `@mui/system/...`). Everything else reachable from the
// runtime module loaders is bundled into lazily loaded chunks.
const SHARED_EXTERNAL_PACKAGES = [
  'react',
  'react-dom',
  'react-router-dom',
  '@link-loom/react-sdk',
  '@veripass/react-sdk',
  '@mui/material',
  '@mui/icons-material',
  '@mui/system',
  '@mui/utils',
  '@mui/styled-engine',
  '@mui/private-theming',
  '@emotion/react',
  '@emotion/styled',
  '@emotion/cache',
  'styled-components',
  '@monaco-editor/react',
  'react-moveable',
  'react-selecto',
  'axios',
  'socket.io-client',
];

const isMainExternal = (id) =>
  SHARED_EXTERNAL_PACKAGES.some((packageName) => id === packageName || id.startsWith(`${packageName}/`));

const mainBundle = {
  input: 'src/index.js',
  output: [
    {
      dir: 'dist',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
      entryFileNames: 'cloud-sdk.cjs.cjs',
      chunkFileNames: 'chunks/cjs/[name]-[hash].cjs',
    },
    {
      dir: 'dist',
      format: 'esm',
      sourcemap: true,
      entryFileNames: 'cloud-sdk.esm.js',
      chunkFileNames: 'chunks/esm/[name]-[hash].js',
    },
  ],
  onwarn: function (warning, warn) {
    if (warning.message && warning.message.includes('use client')) {
      return;
    }
    if (warning.code === 'CIRCULAR_DEPENDENCY' || warning.code === 'UNUSED_EXTERNAL_IMPORT') {
      return;
    }
    warn(warning);
  },
  plugins: sharedPlugins(),
  external: isMainExternal,
};

/**
 * A second, dependency-free bundle for the monetization clients.
 *
 * Most of the sites that render pricing are static builds with no React in them. Importing the
 * package root would drag the whole component library into one of those; this entry point carries
 * nothing but `fetch` and `Intl`, so it can be consumed from a build script or a plain page.
 */
const monetizationBundle = {
  input: 'src/monetization/index.js',
  output: [
    {
      file: 'dist/monetization.cjs.cjs',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
      inlineDynamicImports: true,
    },
    {
      file: 'dist/monetization.esm.js',
      format: 'esm',
      sourcemap: true,
      inlineDynamicImports: true,
    },
  ],
  onwarn: mainBundle.onwarn,
  plugins: sharedPlugins(),
  external: [],
};

module.exports = [mainBundle, monetizationBundle];

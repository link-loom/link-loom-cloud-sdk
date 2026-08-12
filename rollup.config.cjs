const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const babel = require('@rollup/plugin-babel').default;
const alias = require('@rollup/plugin-alias');
const path = require('path');
const postcss = require('rollup-plugin-postcss');
const json = require('@rollup/plugin-json');
const peerDepsExternal = require('rollup-plugin-peer-deps-external');

const sharedPlugins = () => [
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

const mainBundle = {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/cloud-sdk.cjs.cjs',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
      inlineDynamicImports: true,
    },
    {
      file: 'dist/cloud-sdk.esm.js',
      format: 'esm',
      sourcemap: true,
      inlineDynamicImports: true,
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
  external: [
    'react',
    'react/jsx-runtime',
    'react-dom',
    'react-dom/client',
    'react-router-dom',
    '@link-loom/react-sdk',
    '@mui/material',
    '@mui/material/styles',
    '@mui/icons-material',
    '@emotion/react',
    '@emotion/styled',
    'styled-components',
    '@monaco-editor/react',
    'axios',
    'socket.io-client',
    '@veripass/react-sdk',
  ],
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

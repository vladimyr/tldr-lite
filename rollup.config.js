import commonjs from 'rollup-plugin-commonjs';
import copy from 'rollup-plugin-cpy';
import json from 'rollup-plugin-json';
import replace from 'rollup-plugin-re';
import resolve from 'rollup-plugin-node-resolve';
import strip from 'rollup-plugin-strip';
import visualizer from 'rollup-plugin-visualizer';

const sourceMap = false;

export default {
  input: 'cli.js',
  output: {
    file: 'cli.compact.js',
    format: 'cjs',
    banner: '#!/usr/bin/env node',
    sourcemap: sourceMap
  },
  external: require('module').builtinModules,
  plugins: [
    replace({
      patterns: [{
        test: /require\('debug'\)/g,
        replace: '(() => () => {})'
      }]
    }),
    strip({ functions: ['debug'], sourceMap }),
    resolve(),
    commonjs({ sourceMap }),
    json(),
    copy({
      files: require.resolve('open/xdg-open'),
      dest: __dirname,
      options: { verbose: true }
    }),
    visualizer()
  ]
};

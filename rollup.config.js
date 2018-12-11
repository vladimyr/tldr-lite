import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import strip from 'rollup-plugin-strip';
import hypothetical from 'rollup-plugin-hypothetical';
import copy from 'rollup-plugin-cpy';

const sourceMap = false;

export default {
  input: 'cli.js',
  output: {
    file: 'cli.compact.js',
    format: 'cjs',
    banner: '#!/usr/bin/env node'
  },
  external: require('module').builtinModules,
  plugins: [
    ...stripDebug(),
    resolve(),
    commonjs({ sourceMap }),
    json(),
    copy({
      files: require.resolve('opn/xdg-open'),
      dest: __dirname,
      options: { verbose: true }
    })
  ]
};

function stripDebug() {
  const fake = `
    const noop = () => {};
    export default () => noop;
  `;
  return [
    hypothetical({
      allowFallthrough: true,
      files: { [require.resolve('debug')]: fake }
    }),
    strip({ functions: ['debug'], sourceMap })
  ];
}

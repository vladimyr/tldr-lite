import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';

export default {
  input: 'cli.js',
  output: {
    file: 'cli.compact.js',
    format: 'cjs'
  },
  moduleContext: {
    [require.resolve('kleur')]: 'module.exports'
  },
  plugins: [
    resolve(),
    commonjs({ sourceMap: false }),
    json()
  ]
};

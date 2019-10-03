import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  input: 'client.js'
, output: {
    file: 'client.bundle.js'
  , format: 'iife'
  , name: 'xrs'
  }
, plugins: [
    nodeResolve({ browser: true })
  , commonjs()
  ]
}
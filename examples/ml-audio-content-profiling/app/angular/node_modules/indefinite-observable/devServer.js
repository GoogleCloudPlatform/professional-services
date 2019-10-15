#!/usr/local/bin/node

/** @license
 *  Copyright 2016 - present The Material Motion Authors. All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"); you may not
 *  use this file except in compliance with the License. You may obtain a copy
 *  of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 *  WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 *  License for the specific language governing permissions and limitations
 *  under the License.
 */

const Path = require('path')
const PundleDev = require('pundle-dev')

const server = new PundleDev({
  server: {
    hmr: true,
    port: 8080,
    hmrPath: '/dist/bundle_hmr',
    bundlePath: '/dist/bundle.js',
    sourceRoot: Path.join(__dirname, 'example/as-module/site'),
    sourceMapPath: '/dist/bundle.js.map',
    error(error) {
      console.error(error)
    }
  },
  pundle: {
    entry: [require.resolve('./example/as-module/index.js')],
    pathType: 'filePath',
    rootDirectory: __dirname,
    replaceVariables: {
      'process.env.NODE_ENV': 'development',
    }
  },
  watcher: { },
  generator: {
    wrapper: 'hmr',
    sourceMap: true
  }
})

server.pundle.loadPlugins([
  [
    'typescript-pundle',
    {
      extensions: ['.js', '.ts', '.tsx'],
      config: {
        compilerOptions: {
          jsx: 'react',
          strictNullChecks: true,
        }
      }
    }
  ]
]).then(
  () => {
    server.pundle.loadLoaders([
      {
        extensions: ['.js', '.ts', '.tsx'],
        loader: require('pundle/lib/loaders/javascript').default
      },
    ])
    return server.activate()
  }
).then(
  () => console.log('Dev server is listening')
).catch(console.error)

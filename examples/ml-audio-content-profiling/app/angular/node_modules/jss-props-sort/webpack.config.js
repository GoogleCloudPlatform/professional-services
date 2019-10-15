'use strict'

const webpack = require('webpack')

const env = process.env.NODE_ENV
const isDev = env === 'development'
const isTest = env === 'test'
const isProd = env === 'production'

const plugins = [
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify(env),
    __DEV__: isDev,
    __TEST__: isTest
  })
]

if (isProd) {
  plugins.push(new webpack.optimize.UglifyJsPlugin({
    compress: {
      warnings: false
    }
  }))
}

module.exports = {
  output: {
    library: 'jssPropsSort',
    libraryTarget: 'umd'
  },
  plugins,
  module: {
    loaders: [
      {
        loader: 'babel-loader',
        test: /\.js$/,
        exclude: /node_modules/
      }
    ]
  },
  devtool: 'source-map'
}

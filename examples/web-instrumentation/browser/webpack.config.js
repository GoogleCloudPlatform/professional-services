const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'production',
  entry: ['./src/index.js',
    './src/lib/LogCollector.js',
    './src/lib/LogCollectorBuilder.js',
    './src/LoadTest.js',
    './src/TestApp.js',
    './src/TestPayload.js',
    "./src/TestResults.js",
    './src/TestSummary.js'
  ],
  resolve: {
    extensions: [ '.js' ],
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, '../dist'),
  },
  plugins: [
      new webpack.DefinePlugin({
        __VERSION__: JSON.stringify(require("./package.json").version)
      })
  ],
};

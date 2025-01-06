/*
# Copyright 2024 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

*/
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { SubresourceIntegrityPlugin } = require('webpack-subresource-integrity');
const WebpackAssetsManifest = require("webpack-assets-manifest");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
    entry: path.join(__dirname, "src", "index.js"),
    output: {
        path: path.resolve(__dirname, "dist"),
        crossOriginLoading: "anonymous",
    },
    plugins: [
        new MiniCssExtractPlugin(),
        new HtmlWebpackPlugin({
            template: path.join(__dirname, "public", "index.html"),
            hash: true,
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: 'public/404.html', to: "." },
                { from: 'public/*.png', to: path.resolve(__dirname, 'dist', '[name][ext]'), },
                { from: 'public/*.json', to: path.resolve(__dirname, 'dist', '[name][ext]'), },
                { from: 'public/*.txt', to: path.resolve(__dirname, 'dist', '[name][ext]'), },
                { from: 'public/*.ico', to: path.resolve(__dirname, 'dist', '[name][ext]'), },
            ]
        }),
        new SubresourceIntegrityPlugin(),
        new WebpackAssetsManifest({ integrity: true }),
    ],
    module: {
        rules: [
            {
                test: /\.?js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ['@babel/preset-env', '@babel/preset-react']
                    }
                }
            },
            {
                test: /\.css$/i,
                use: [MiniCssExtractPlugin.loader, "css-loader"],
            },
            {
                test: /\.svg$/,
                use: [
                    {
                        loader: "babel-loader"
                    },
                    {
                        loader: "react-svg-loader",
                        options: {
                            // jsx: true // true outputs JSX tags
                        }
                    }
                ]
            },
        ]
    },
    devServer: {
        port: 3000,
    },
};

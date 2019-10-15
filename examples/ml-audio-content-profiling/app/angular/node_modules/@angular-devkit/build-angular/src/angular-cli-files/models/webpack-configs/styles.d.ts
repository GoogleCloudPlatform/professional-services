/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as webpack from 'webpack';
import { WebpackConfigOptions } from '../build-options';
/**
 * Enumerate loaders and their dependencies from this file to let the dependency validator
 * know they are used.
 *
 * require('style-loader')
 * require('postcss-loader')
 * require('stylus')
 * require('stylus-loader')
 * require('less')
 * require('less-loader')
 * require('node-sass')
 * require('sass-loader')
 */
export declare function getStylesConfig(wco: WebpackConfigOptions): {
    entry: {
        [key: string]: string[];
    };
    module: {
        rules: webpack.RuleSetRule[];
    };
    plugins: any[];
};

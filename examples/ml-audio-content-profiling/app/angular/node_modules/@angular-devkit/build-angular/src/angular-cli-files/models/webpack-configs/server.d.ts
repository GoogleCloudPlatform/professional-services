/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Configuration } from 'webpack';
import { WebpackConfigOptions } from '../build-options';
/**
 * Returns a partial specific to creating a bundle for node
 * @param wco Options which are include the build options and app config
 */
export declare function getServerConfig(wco: WebpackConfigOptions): Configuration;

/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Compiler } from 'webpack';
export interface CleanCssWebpackPluginOptions {
    sourceMap: boolean;
    test: (file: string) => boolean;
}
export declare class CleanCssWebpackPlugin {
    private readonly _options;
    constructor(options: Partial<CleanCssWebpackPluginOptions>);
    apply(compiler: Compiler): void;
}

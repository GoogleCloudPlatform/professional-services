/// <reference types="node" />
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { virtualFs } from '@angular-devkit/core';
import { Stats } from 'fs';
import { AngularCompilerPlugin } from '@ngtools/webpack';
import { WebpackConfigOptions } from '../build-options';
export declare function getNonAotConfig(wco: WebpackConfigOptions, host: virtualFs.Host<Stats>): {
    module: {
        rules: {
            test: RegExp;
            loader: string;
        }[];
    };
    plugins: AngularCompilerPlugin[];
};
export declare function getAotConfig(wco: WebpackConfigOptions, host: virtualFs.Host<Stats>, extract?: boolean): {
    module: {
        rules: {
            test: RegExp;
            use: any[];
        }[];
    };
    plugins: AngularCompilerPlugin[];
};
export declare function getNonAotTestConfig(wco: WebpackConfigOptions, host: virtualFs.Host<Stats>): {
    module: {
        rules: {
            test: RegExp;
            loader: string;
        }[];
    };
    plugins: AngularCompilerPlugin[];
};

/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { BuildEvent, Builder, BuilderConfiguration, BuilderContext } from '@angular-devkit/architect';
import { logging } from '@angular-devkit/core';
import { Observable } from 'rxjs';
import * as webpack from 'webpack';
import { WebpackBuilderSchema } from './schema';
export interface LoggingCallback {
    (stats: webpack.Stats, config: webpack.Configuration, logger: logging.Logger): void;
}
export declare const defaultLoggingCb: LoggingCallback;
export declare class WebpackBuilder implements Builder<WebpackBuilderSchema> {
    context: BuilderContext;
    constructor(context: BuilderContext);
    run(builderConfig: BuilderConfiguration<WebpackBuilderSchema>): Observable<BuildEvent>;
    loadWebpackConfig(webpackConfigPath: string): Observable<webpack.Configuration>;
    runWebpack(config: webpack.Configuration, loggingCb?: LoggingCallback): Observable<BuildEvent>;
}
export default WebpackBuilder;

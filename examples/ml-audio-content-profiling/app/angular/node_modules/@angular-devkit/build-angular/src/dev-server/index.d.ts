/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <reference types="node" />
import { BuildEvent, Builder, BuilderConfiguration, BuilderContext } from '@angular-devkit/architect';
import { Path, virtualFs } from '@angular-devkit/core';
import { Stats } from 'fs';
import { Observable } from 'rxjs';
import { BrowserBuilderSchema } from '../browser/schema';
export interface DevServerBuilderOptions {
    browserTarget: string;
    port: number;
    host: string;
    proxyConfig?: string;
    ssl: boolean;
    sslKey?: string;
    sslCert?: string;
    open: boolean;
    liveReload: boolean;
    publicHost?: string;
    servePath?: string;
    disableHostCheck: boolean;
    hmr: boolean;
    watch: boolean;
    hmrWarning: boolean;
    servePathDefaultWarning: boolean;
    optimization?: boolean;
    aot?: boolean;
    sourceMap?: boolean;
    vendorSourceMap?: boolean;
    evalSourceMap?: boolean;
    vendorChunk?: boolean;
    commonChunk?: boolean;
    baseHref?: string;
    deployUrl?: string;
    progress?: boolean;
    poll?: number;
    verbose?: boolean;
}
export declare class DevServerBuilder implements Builder<DevServerBuilderOptions> {
    context: BuilderContext;
    constructor(context: BuilderContext);
    run(builderConfig: BuilderConfiguration<DevServerBuilderOptions>): Observable<BuildEvent>;
    buildWebpackConfig(root: Path, projectRoot: Path, host: virtualFs.Host<Stats>, browserOptions: BrowserBuilderSchema): any;
    private _buildServerConfig;
    private _addLiveReload;
    private _addSslConfig;
    private _addProxyConfig;
    private _buildServePath;
    private _findDefaultServePath;
    private _getBrowserOptions;
}
export default DevServerBuilder;

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
import { BuildWebpackServerSchema } from './schema';
export declare class ServerBuilder implements Builder<BuildWebpackServerSchema> {
    context: BuilderContext;
    constructor(context: BuilderContext);
    run(builderConfig: BuilderConfiguration<BuildWebpackServerSchema>): Observable<BuildEvent>;
    buildWebpackConfig(root: Path, projectRoot: Path, host: virtualFs.Host<Stats>, options: BuildWebpackServerSchema): any;
    private _deleteOutputDir;
}
export default ServerBuilder;

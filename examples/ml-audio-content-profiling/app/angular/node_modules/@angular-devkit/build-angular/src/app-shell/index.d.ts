/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { BuildEvent, Builder, BuilderConfiguration, BuilderContext } from '@angular-devkit/architect';
import { Path } from '@angular-devkit/core';
import { Observable } from 'rxjs';
import { BrowserBuilderSchema } from '../browser/schema';
import { BuildWebpackAppShellSchema } from './schema';
export declare class AppShellBuilder implements Builder<BuildWebpackAppShellSchema> {
    context: BuilderContext;
    constructor(context: BuilderContext);
    run(builderConfig: BuilderConfiguration<BuildWebpackAppShellSchema>): Observable<BuildEvent>;
    build(targetString: string, overrides: {}): Observable<BuildEvent>;
    getServerModuleBundlePath(options: BuildWebpackAppShellSchema): Observable<Path>;
    getBrowserBuilderConfig(options: BuildWebpackAppShellSchema): Observable<BuilderConfiguration<BrowserBuilderSchema>>;
    renderUniversal(options: BuildWebpackAppShellSchema): Observable<BuildEvent>;
}
export default AppShellBuilder;

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
import { NormalizedBrowserBuilderSchema } from '../browser';
export interface ExtractI18nBuilderOptions {
    browserTarget: string;
    i18nFormat: string;
    i18nLocale: string;
    outputPath?: string;
    outFile?: string;
    progress?: boolean;
}
export declare class ExtractI18nBuilder implements Builder<ExtractI18nBuilderOptions> {
    context: BuilderContext;
    constructor(context: BuilderContext);
    run(builderConfig: BuilderConfiguration<ExtractI18nBuilderOptions>): Observable<BuildEvent>;
    buildWebpackConfig(root: Path, projectRoot: Path, options: NormalizedBrowserBuilderSchema): any;
}
export default ExtractI18nBuilder;

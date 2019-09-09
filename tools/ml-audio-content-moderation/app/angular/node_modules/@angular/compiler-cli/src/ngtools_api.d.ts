/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/compiler-cli/src/ngtools_api" />
/**
 * This is a private API for the ngtools toolkit.
 *
 * This API should be stable for NG 2. It can be removed in NG 4..., but should be replaced by
 * something else.
 */
/**
 *********************************************************************
 * Changes to this file need to be approved by the Angular CLI team. *
 *********************************************************************
 */
import * as ts from 'typescript';
import { CompilerOptions } from './transformers/api';
export interface NgTools_InternalApi_NG2_CodeGen_Options {
    basePath: string;
    compilerOptions: ts.CompilerOptions;
    program: ts.Program;
    host: ts.CompilerHost;
    angularCompilerOptions: CompilerOptions;
    i18nFormat?: string;
    i18nFile?: string;
    locale?: string;
    missingTranslation?: string;
    readResource: (fileName: string) => Promise<string>;
}
export interface NgTools_InternalApi_NG2_ListLazyRoutes_Options {
    program: ts.Program;
    host: ts.CompilerHost;
    angularCompilerOptions: CompilerOptions;
    entryModule: string;
}
export interface NgTools_InternalApi_NG_2_LazyRouteMap {
    [route: string]: string;
}
export interface NgTools_InternalApi_NG2_ExtractI18n_Options {
    basePath: string;
    compilerOptions: ts.CompilerOptions;
    program: ts.Program;
    host: ts.CompilerHost;
    angularCompilerOptions: CompilerOptions;
    i18nFormat?: string;
    readResource: (fileName: string) => Promise<string>;
    locale?: string;
    outFile?: string;
}

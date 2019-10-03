/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/language-service/src/reflector_host" />
import { StaticSymbolResolverHost } from '@angular/compiler';
import { CompilerOptions } from '@angular/compiler-cli/src/language_services';
import * as ts from 'typescript';
export declare class ReflectorHost implements StaticSymbolResolverHost {
    private options;
    private moduleResolutionCache;
    private hostAdapter;
    private metadataReaderCache;
    constructor(getProgram: () => ts.Program, serviceHost: ts.LanguageServiceHost, options: CompilerOptions);
    getMetadataFor(modulePath: string): {
        [key: string]: any;
    }[] | undefined;
    moduleNameToFileName(moduleName: string, containingFile?: string): string | null;
    getOutputName(filePath: string): string;
}

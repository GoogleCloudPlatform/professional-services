/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/compiler-cli/src/ngtsc/factories/src/host" />
import * as ts from 'typescript';
import { FactoryGenerator } from './generator';
/**
 * A wrapper around a `ts.CompilerHost` which supports generated files.
 */
export declare class GeneratedFactoryHostWrapper implements ts.CompilerHost {
    private delegate;
    private generator;
    private factoryToSourceMap;
    constructor(delegate: ts.CompilerHost, generator: FactoryGenerator, factoryToSourceMap: Map<string, string>);
    resolveTypeReferenceDirectives?: (names: string[], containingFile: string) => ts.ResolvedTypeReferenceDirective[];
    getSourceFile(fileName: string, languageVersion: ts.ScriptTarget, onError?: ((message: string) => void) | undefined, shouldCreateNewSourceFile?: boolean | undefined): ts.SourceFile | undefined;
    getDefaultLibFileName(options: ts.CompilerOptions): string;
    writeFile(fileName: string, data: string, writeByteOrderMark: boolean, onError: ((message: string) => void) | undefined, sourceFiles: ReadonlyArray<ts.SourceFile>): void;
    getCurrentDirectory(): string;
    getDirectories(path: string): string[];
    getCanonicalFileName(fileName: string): string;
    useCaseSensitiveFileNames(): boolean;
    getNewLine(): string;
    fileExists(fileName: string): boolean;
    readFile(fileName: string): string | undefined;
}

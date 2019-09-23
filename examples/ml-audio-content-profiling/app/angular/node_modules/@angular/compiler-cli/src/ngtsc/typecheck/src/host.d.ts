/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/compiler-cli/src/ngtsc/typecheck/src/host" />
import * as ts from 'typescript';
import { TypeCheckContext } from './context';
/**
 * A `ts.CompilerHost` which augments source files with type checking code from a
 * `TypeCheckContext`.
 */
export declare class TypeCheckProgramHost implements ts.CompilerHost {
    private delegate;
    private context;
    /**
     * Map of source file names to `ts.SourceFile` instances.
     *
     * This is prepopulated with all the old source files, and updated as files are augmented.
     */
    private sfCache;
    /**
     * Tracks those files in `sfCache` which have been augmented with type checking information
     * already.
     */
    private augmentedSourceFiles;
    constructor(program: ts.Program, delegate: ts.CompilerHost, context: TypeCheckContext);
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

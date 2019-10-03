/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/compiler-cli/src/ngtsc/program" />
import { GeneratedFile } from '@angular/compiler';
import * as ts from 'typescript';
import * as api from '../transformers/api';
export declare class NgtscProgram implements api.Program {
    private options;
    private tsProgram;
    private resourceLoader;
    private compilation;
    private factoryToSourceInfo;
    private sourceToFactorySymbols;
    private host;
    private _coreImportsFrom;
    private _reflector;
    private _isCore;
    private rootDirs;
    private closureCompilerEnabled;
    constructor(rootNames: ReadonlyArray<string>, options: api.CompilerOptions, host: api.CompilerHost, oldProgram?: api.Program);
    getTsProgram(): ts.Program;
    getTsOptionDiagnostics(cancellationToken?: ts.CancellationToken | undefined): ReadonlyArray<ts.Diagnostic>;
    getNgOptionDiagnostics(cancellationToken?: ts.CancellationToken | undefined): ReadonlyArray<api.Diagnostic>;
    getTsSyntacticDiagnostics(sourceFile?: ts.SourceFile | undefined, cancellationToken?: ts.CancellationToken | undefined): ReadonlyArray<ts.Diagnostic>;
    getNgStructuralDiagnostics(cancellationToken?: ts.CancellationToken | undefined): ReadonlyArray<api.Diagnostic>;
    getTsSemanticDiagnostics(sourceFile?: ts.SourceFile | undefined, cancellationToken?: ts.CancellationToken | undefined): ReadonlyArray<ts.Diagnostic>;
    getNgSemanticDiagnostics(fileName?: string | undefined, cancellationToken?: ts.CancellationToken | undefined): ReadonlyArray<ts.Diagnostic | api.Diagnostic>;
    loadNgStructureAsync(): Promise<void>;
    listLazyRoutes(entryRoute?: string | undefined): api.LazyRoute[];
    getLibrarySummaries(): Map<string, api.LibrarySummary>;
    getEmittedGeneratedFiles(): Map<string, GeneratedFile>;
    getEmittedSourceFiles(): Map<string, ts.SourceFile>;
    private ensureAnalyzed;
    emit(opts?: {
        emitFlags?: api.EmitFlags;
        cancellationToken?: ts.CancellationToken;
        customTransformers?: api.CustomTransformers;
        emitCallback?: api.TsEmitCallback;
        mergeEmitResultsCallback?: api.TsMergeEmitResultsCallback;
    }): ts.EmitResult;
    private compileTypeCheckProgram;
    private makeCompilation;
    private readonly reflector;
    private readonly coreImportsFrom;
    private readonly isCore;
}

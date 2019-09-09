/// <reference types="node" />
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { logging, virtualFs } from '@angular-devkit/core';
import * as fs from 'fs';
import * as ts from 'typescript';
import { Compiler } from 'webpack';
export interface ContextElementDependency {
}
export interface ContextElementDependencyConstructor {
    new (modulePath: string, name: string): ContextElementDependency;
}
/**
 * Option Constants
 */
export interface AngularCompilerPluginOptions {
    sourceMap?: boolean;
    tsConfigPath: string;
    basePath?: string;
    entryModule?: string;
    mainPath?: string;
    skipCodeGeneration?: boolean;
    hostReplacementPaths?: {
        [path: string]: string;
    } | ((path: string) => string);
    forkTypeChecker?: boolean;
    i18nInFile?: string;
    i18nInFormat?: string;
    i18nOutFile?: string;
    i18nOutFormat?: string;
    locale?: string;
    missingTranslation?: string;
    platform?: PLATFORM;
    nameLazyFiles?: boolean;
    logger?: logging.Logger;
    additionalLazyModules?: {
        [module: string]: string;
    };
    contextElementDependencyConstructor?: ContextElementDependencyConstructor;
    compilerOptions?: ts.CompilerOptions;
    host?: virtualFs.Host<fs.Stats>;
    platformTransformers?: ts.TransformerFactory<ts.SourceFile>[];
}
export declare enum PLATFORM {
    Browser = 0,
    Server = 1
}
export declare class AngularCompilerPlugin {
    private _options;
    private _compilerOptions;
    private _rootNames;
    private _program;
    private _compilerHost;
    private _moduleResolutionCache;
    private _resourceLoader;
    private _lazyRoutes;
    private _tsConfigPath;
    private _entryModule;
    private _mainPath;
    private _basePath;
    private _transformers;
    private _platformTransformers;
    private _platform;
    private _JitMode;
    private _emitSkipped;
    private _changedFileExtensions;
    private _firstRun;
    private _donePromise;
    private _normalizedLocale;
    private _warnings;
    private _errors;
    private _contextElementDependencyConstructor;
    private _forkTypeChecker;
    private _typeCheckerProcess;
    private _forkedTypeCheckerInitialized;
    private _logger;
    private readonly _ngCompilerSupportsNewApi;
    constructor(options: AngularCompilerPluginOptions);
    readonly options: AngularCompilerPluginOptions;
    readonly done: Promise<void> | null;
    readonly entryModule: {
        path: string;
        className: string;
    } | null;
    readonly typeChecker: ts.TypeChecker | null;
    static isSupported(): boolean;
    private _setupOptions;
    private _getTsProgram;
    private _getChangedTsFiles;
    updateChangedFileExtensions(extension: string): void;
    private _getChangedCompilationFiles;
    private _createOrUpdateProgram;
    private _getLazyRoutesFromNgtools;
    private _findLazyRoutesInAst;
    private _listLazyRoutesFromProgram;
    private _processLazyRoutes;
    private _createForkedTypeChecker;
    private _killForkedTypeChecker;
    private _updateForkedTypeChecker;
    apply(compiler: Compiler): void;
    private _make;
    private pushCompilationErrors;
    private _makeTransformers;
    private _update;
    writeI18nOutFile(): void;
    getCompiledFile(fileName: string): {
        outputText: string;
        sourceMap: string | undefined;
        errorDependencies: string[];
    };
    getDependencies(fileName: string): string[];
    getResourceDependencies(fileName: string): string[];
    private _emit;
    private _validateLocale;
}

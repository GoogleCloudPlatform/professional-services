/// <amd-module name="@angular/compiler-cli/src/ngcc/src/analysis/decoration_analyzer" />
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ConstantPool } from '@angular/compiler';
import * as ts from 'typescript';
import { ResourceLoader, SelectorScopeRegistry } from '../../../ngtsc/annotations';
import { CompileResult, DecoratorHandler } from '../../../ngtsc/transform';
import { DecoratedClass } from '../host/decorated_class';
import { DecoratedFile } from '../host/decorated_file';
import { NgccReflectionHost } from '../host/ngcc_host';
export interface AnalyzedClass<A = any, M = any> extends DecoratedClass {
    handler: DecoratorHandler<A, M>;
    analysis: any;
    diagnostics?: ts.Diagnostic[];
    compilation: CompileResult[];
}
export interface DecorationAnalysis {
    analyzedClasses: AnalyzedClass[];
    sourceFile: ts.SourceFile;
    constantPool: ConstantPool;
}
export declare type DecorationAnalyses = Map<ts.SourceFile, DecorationAnalysis>;
export declare const DecorationAnalyses: MapConstructor;
export interface MatchingHandler<A, M> {
    handler: DecoratorHandler<A, M>;
    match: M;
}
/**
 * `ResourceLoader` which directly uses the filesystem to resolve resources synchronously.
 */
export declare class FileResourceLoader implements ResourceLoader {
    load(url: string): string;
}
/**
 * This Analyzer will analyze the files that have decorated classes that need to be transformed.
 */
export declare class DecorationAnalyzer {
    private typeChecker;
    private host;
    private rootDirs;
    private isCore;
    resourceLoader: FileResourceLoader;
    scopeRegistry: SelectorScopeRegistry;
    handlers: DecoratorHandler<any, any>[];
    constructor(typeChecker: ts.TypeChecker, host: NgccReflectionHost, rootDirs: string[], isCore: boolean);
    /**
     * Analyze a program to find all the decorated files should be transformed.
     * @param program The program whose files should be analysed.
     * @returns a map of the source files to the analysis for those files.
     */
    analyzeProgram(program: ts.Program): DecorationAnalyses;
    /**
     * Analyze a decorated file to generate the information about decorated classes that
     * should be converted to use ivy definitions.
     * @param file The file to be analysed for decorated classes.
     * @returns the analysis of the file
     */
    protected analyzeFile(file: DecoratedFile): DecorationAnalysis;
    protected analyzeClass(pool: ConstantPool, clazz: DecoratedClass): AnalyzedClass | undefined;
}

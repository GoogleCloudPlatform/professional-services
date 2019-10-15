/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/compiler-cli/src/ngtsc/annotations/src/pipe" />
import { R3PipeMetadata } from '@angular/compiler';
import * as ts from 'typescript';
import { Decorator, ReflectionHost } from '../../host';
import { AnalysisOutput, CompileResult, DecoratorHandler } from '../../transform';
import { SelectorScopeRegistry } from './selector_scope';
export declare class PipeDecoratorHandler implements DecoratorHandler<R3PipeMetadata, Decorator> {
    private checker;
    private reflector;
    private scopeRegistry;
    private isCore;
    constructor(checker: ts.TypeChecker, reflector: ReflectionHost, scopeRegistry: SelectorScopeRegistry, isCore: boolean);
    detect(node: ts.Declaration, decorators: Decorator[] | null): Decorator | undefined;
    analyze(clazz: ts.ClassDeclaration, decorator: Decorator): AnalysisOutput<R3PipeMetadata>;
    compile(node: ts.ClassDeclaration, analysis: R3PipeMetadata): CompileResult;
}

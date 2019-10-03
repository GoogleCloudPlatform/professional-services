/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/compiler-cli/src/ngtsc/annotations/src/base_def" />
import { R3BaseRefMetaData } from '@angular/compiler';
import * as ts from 'typescript';
import { ClassMember, Decorator, ReflectionHost } from '../../host';
import { AnalysisOutput, CompileResult, DecoratorHandler } from '../../transform';
export declare class BaseDefDecoratorHandler implements DecoratorHandler<R3BaseRefMetaData, R3BaseRefDecoratorDetection> {
    private checker;
    private reflector;
    constructor(checker: ts.TypeChecker, reflector: ReflectionHost);
    detect(node: ts.ClassDeclaration, decorators: Decorator[] | null): R3BaseRefDecoratorDetection | undefined;
    analyze(node: ts.ClassDeclaration, metadata: R3BaseRefDecoratorDetection): AnalysisOutput<R3BaseRefMetaData>;
    compile(node: ts.Declaration, analysis: R3BaseRefMetaData): CompileResult[] | CompileResult;
}
export interface R3BaseRefDecoratorDetection {
    inputs?: Array<{
        property: ClassMember;
        decorator: Decorator;
    }>;
    outputs?: Array<{
        property: ClassMember;
        decorator: Decorator;
    }>;
}

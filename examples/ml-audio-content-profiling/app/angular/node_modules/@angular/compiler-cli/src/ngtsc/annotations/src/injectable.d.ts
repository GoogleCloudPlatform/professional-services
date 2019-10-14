/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/compiler-cli/src/ngtsc/annotations/src/injectable" />
import { R3InjectableMetadata } from '@angular/compiler';
import * as ts from 'typescript';
import { Decorator, ReflectionHost } from '../../host';
import { AnalysisOutput, CompileResult, DecoratorHandler } from '../../transform';
/**
 * Adapts the `compileIvyInjectable` compiler for `@Injectable` decorators to the Ivy compiler.
 */
export declare class InjectableDecoratorHandler implements DecoratorHandler<R3InjectableMetadata, Decorator> {
    private reflector;
    private isCore;
    constructor(reflector: ReflectionHost, isCore: boolean);
    detect(node: ts.Declaration, decorators: Decorator[] | null): Decorator | undefined;
    analyze(node: ts.ClassDeclaration, decorator: Decorator): AnalysisOutput<R3InjectableMetadata>;
    compile(node: ts.ClassDeclaration, analysis: R3InjectableMetadata): CompileResult;
}

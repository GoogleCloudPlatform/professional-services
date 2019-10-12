/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/compiler-cli/src/ngtsc/annotations/src/directive" />
import { ConstantPool, R3DirectiveMetadata, R3QueryMetadata } from '@angular/compiler';
import * as ts from 'typescript';
import { ClassMember, Decorator, ReflectionHost } from '../../host';
import { AnalysisOutput, CompileResult, DecoratorHandler } from '../../transform';
import { SelectorScopeRegistry } from './selector_scope';
export declare class DirectiveDecoratorHandler implements DecoratorHandler<R3DirectiveMetadata, Decorator> {
    private checker;
    private reflector;
    private scopeRegistry;
    private isCore;
    constructor(checker: ts.TypeChecker, reflector: ReflectionHost, scopeRegistry: SelectorScopeRegistry, isCore: boolean);
    detect(node: ts.Declaration, decorators: Decorator[] | null): Decorator | undefined;
    analyze(node: ts.ClassDeclaration, decorator: Decorator): AnalysisOutput<R3DirectiveMetadata>;
    compile(node: ts.ClassDeclaration, analysis: R3DirectiveMetadata, pool: ConstantPool): CompileResult;
}
/**
 * Helper function to extract metadata from a `Directive` or `Component`.
 */
export declare function extractDirectiveMetadata(clazz: ts.ClassDeclaration, decorator: Decorator, checker: ts.TypeChecker, reflector: ReflectionHost, isCore: boolean): {
    decorator: Map<string, ts.Expression>;
    metadata: R3DirectiveMetadata;
    decoratedElements: ClassMember[];
} | undefined;
export declare function extractQueryMetadata(exprNode: ts.Node, name: string, args: ReadonlyArray<ts.Expression>, propertyName: string, reflector: ReflectionHost, checker: ts.TypeChecker): R3QueryMetadata;
export declare function extractQueriesFromDecorator(queryData: ts.Expression, reflector: ReflectionHost, checker: ts.TypeChecker, isCore: boolean): {
    content: R3QueryMetadata[];
    view: R3QueryMetadata[];
};
export declare function parseFieldArrayValue(directive: Map<string, ts.Expression>, field: string, reflector: ReflectionHost, checker: ts.TypeChecker): null | string[];
export declare function queriesFromFields(fields: {
    member: ClassMember;
    decorators: Decorator[];
}[], reflector: ReflectionHost, checker: ts.TypeChecker): R3QueryMetadata[];

/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/compiler-cli/src/ngtsc/annotations/src/util" />
import { R3DependencyMetadata, R3Reference } from '@angular/compiler';
import * as ts from 'typescript';
import { Decorator, ReflectionHost } from '../../host';
import { Reference } from '../../metadata';
export declare function getConstructorDependencies(clazz: ts.ClassDeclaration, reflector: ReflectionHost, isCore: boolean): R3DependencyMetadata[] | null;
export declare function toR3Reference(ref: Reference, context: ts.SourceFile): R3Reference;
export declare function isAngularCore(decorator: Decorator): boolean;
/**
 * Unwrap a `ts.Expression`, removing outer type-casts or parentheses until the expression is in its
 * lowest level form.
 *
 * For example, the expression "(foo as Type)" unwraps to "foo".
 */
export declare function unwrapExpression(node: ts.Expression): ts.Expression;
/**
 * Possibly resolve a forwardRef() expression into the inner value.
 *
 * @param node the forwardRef() expression to resolve
 * @param reflector a ReflectionHost
 * @returns the resolved expression, if the original expression was a forwardRef(), or the original
 * expression otherwise
 */
export declare function unwrapForwardRef(node: ts.Expression, reflector: ReflectionHost): ts.Expression;
/**
 * A foreign function resolver for `staticallyResolve` which unwraps forwardRef() expressions.
 *
 * @param ref a Reference to the declaration of the function being called (which might be
 * forwardRef)
 * @param args the arguments to the invocation of the forwardRef expression
 * @returns an unwrapped argument if `ref` pointed to forwardRef, or null otherwise
 */
export declare function forwardRefResolver(ref: Reference<ts.FunctionDeclaration | ts.MethodDeclaration>, args: ts.Expression[]): ts.Expression | null;
export declare function extractDirectiveGuards(node: ts.Declaration, reflector: ReflectionHost): {
    ngTemplateGuards: string[];
    hasNgTemplateContextGuard: boolean;
};

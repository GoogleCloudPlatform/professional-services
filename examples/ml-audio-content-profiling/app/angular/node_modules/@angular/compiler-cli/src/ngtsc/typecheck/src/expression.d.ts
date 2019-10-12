/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/compiler-cli/src/ngtsc/typecheck/src/expression" />
import { AST } from '@angular/compiler';
import * as ts from 'typescript';
/**
 * Convert an `AST` to TypeScript code directly, without going through an intermediate `Expression`
 * AST.
 */
export declare function astToTypescript(ast: AST, maybeResolve: (ast: AST) => ts.Expression | null): ts.Expression;

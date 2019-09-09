/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as o from '../output/output_ast';
/**
 * JIT compiles an expression and returns the result of executing that expression.
 *
 * @param def the definition which will be compiled and executed to get the value to patch
 * @param context an object map of @angular/core symbol names to symbols which will be available in
 * the context of the compiled expression
 * @param sourceUrl a URL to use for the source map of the compiled expression
 * @param constantPool an optional `ConstantPool` which contains constants used in the expression
 */
export declare function jitExpression(def: o.Expression, context: {
    [key: string]: any;
}, sourceUrl: string, preStatements: o.Statement[]): any;

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { RuleFailure, Rules } from 'tslint';
import * as ts from 'typescript';
/**
 * Rule that visits every TypeScript new expression or super call and checks if the parameter
 * type signature is invalid and needs to be updated manually.
 */
export declare class Rule extends Rules.TypedRule {
    applyWithProgram(sourceFile: ts.SourceFile, program: ts.Program): RuleFailure[];
}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ProgramAwareRuleWalker, RuleFailure, Rules } from 'tslint';
import * as ts from 'typescript';
/**
 * Rule that checks for classes that extend Angular Material classes which have changed
 * their API.
 */
export declare class Rule extends Rules.TypedRule {
    applyWithProgram(sourceFile: ts.SourceFile, program: ts.Program): RuleFailure[];
}
export declare class Walker extends ProgramAwareRuleWalker {
    visitClassDeclaration(node: ts.ClassDeclaration): void;
}

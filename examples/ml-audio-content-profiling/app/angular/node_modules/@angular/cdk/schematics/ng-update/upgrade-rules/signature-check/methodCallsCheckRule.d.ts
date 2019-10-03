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
 * Rule that visits every TypeScript method call expression and checks if the argument count
 * is invalid and needs to be *manually* updated.
 */
export declare class Rule extends Rules.TypedRule {
    applyWithProgram(sourceFile: ts.SourceFile, program: ts.Program): RuleFailure[];
}
export declare class Walker extends ProgramAwareRuleWalker {
    /** Change data that upgrades to the specified target version. */
    data: import("../../data/method-call-checks").MethodCallUpgradeData[];
    visitCallExpression(node: ts.CallExpression): void;
    private _checkPropertyAccessMethodCall;
}

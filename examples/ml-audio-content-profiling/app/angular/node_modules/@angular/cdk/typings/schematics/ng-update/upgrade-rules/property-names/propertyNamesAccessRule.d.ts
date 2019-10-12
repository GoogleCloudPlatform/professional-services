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
 * Rule that walks through every property access expression and updates properties that have
 * been changed in favor of a new name.
 */
export declare class Rule extends Rules.TypedRule {
    applyWithProgram(sourceFile: ts.SourceFile, program: ts.Program): RuleFailure[];
}
export declare class Walker extends ProgramAwareRuleWalker {
    /** Change data that upgrades to the specified target version. */
    data: import("../../data/property-names").PropertyNameUpgradeData[];
    visitPropertyAccessExpression(node: ts.PropertyAccessExpression): void;
}

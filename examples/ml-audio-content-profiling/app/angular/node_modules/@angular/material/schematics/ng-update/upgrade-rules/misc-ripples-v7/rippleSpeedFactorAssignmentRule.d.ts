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
 * Rule that walks through every property assignment and switches the global `baseSpeedFactor`
 * ripple option to the new global animation config. Also updates every class member assignment
 * that refers to MatRipple#speedFactor.
 */
export declare class Rule extends Rules.TypedRule {
    applyWithProgram(sourceFile: ts.SourceFile, program: ts.Program): RuleFailure[];
}
export declare class Walker extends ProgramAwareRuleWalker {
    /** Switches binary expressions (e.g. myRipple.speedFactor = 0.5) to the new animation config. */
    visitBinaryExpression(expression: ts.BinaryExpression): void;
    /**
     * Switches a potential global option `baseSpeedFactor` to the new animation config. For this
     * we assume that the `baseSpeedFactor` is not used in combination with individual speed factors.
     */
    visitPropertyAssignment(assignment: ts.PropertyAssignment): void;
}

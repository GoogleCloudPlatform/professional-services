/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { RuleFailure, Rules, RuleWalker } from 'tslint';
import * as ts from 'typescript';
import { ElementSelectorUpgradeData } from '../../data/element-selectors';
/**
 * Rule that walks through every string literal that is wrapped inside of a call expression.
 * All string literals which include an outdated element selector will be migrated.
 */
export declare class Rule extends Rules.AbstractRule {
    apply(sourceFile: ts.SourceFile): RuleFailure[];
}
export declare class Walker extends RuleWalker {
    /** Change data that upgrades to the specified target version. */
    data: ElementSelectorUpgradeData[];
    visitStringLiteral(node: ts.StringLiteral): void;
    /** Adds an element selector failure with the given replacement at the specified node. */
    private _addFailureWithReplacement;
}

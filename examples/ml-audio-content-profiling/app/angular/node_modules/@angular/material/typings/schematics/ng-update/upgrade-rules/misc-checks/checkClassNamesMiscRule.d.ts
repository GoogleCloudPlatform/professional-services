/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { RuleFailure, Rules, RuleWalker } from 'tslint';
import * as ts from 'typescript';
/**
 * Rule that looks for class name identifiers that have been removed but cannot be
 * automatically migrated.
 */
export declare class Rule extends Rules.AbstractRule {
    apply(sourceFile: ts.SourceFile): RuleFailure[];
}
export declare class Walker extends RuleWalker {
    visitIdentifier(identifier: ts.Identifier): void;
}

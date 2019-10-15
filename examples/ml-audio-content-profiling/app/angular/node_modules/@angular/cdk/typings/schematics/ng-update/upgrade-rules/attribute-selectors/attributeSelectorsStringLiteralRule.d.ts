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
 * Rule that walks through every string literal that is part of a call expression and
 * switches deprecated attribute selectors to the updated selector.
 */
export declare class Rule extends Rules.AbstractRule {
    apply(sourceFile: ts.SourceFile): RuleFailure[];
}

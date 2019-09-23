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
 * Rule that detects import declarations that refer to outdated identifiers from Angular Material
 * or the CDK which cannot be updated automatically.
 */
export declare class Rule extends Rules.TypedRule {
    applyWithProgram(sourceFile: ts.SourceFile, program: ts.Program): RuleFailure[];
}
export declare class Walker extends ProgramAwareRuleWalker {
    visitImportDeclaration(node: ts.ImportDeclaration): void;
    /**
     * Checks for named imports that refer to the deleted animation constants.
     * https://github.com/angular/material2/commit/9f3bf274c4f15f0b0fbd8ab7dbf1a453076e66d9
     */
    private _checkAnimationConstants;
}

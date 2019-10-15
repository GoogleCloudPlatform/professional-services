/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { RuleFailure, Rules } from 'tslint';
import * as ts from 'typescript';
import { ExternalResource } from '../../tslint/component-file';
import { ComponentWalker } from '../../tslint/component-walker';
/**
 * Rule that walks through every inline or external HTML template and updates outdated
 * CSS selectors.
 */
export declare class Rule extends Rules.AbstractRule {
    apply(sourceFile: ts.SourceFile): RuleFailure[];
}
export declare class Walker extends ComponentWalker {
    /** Change data that upgrades to the specified target version. */
    data: import("../../data/css-selectors").CssSelectorUpgradeData[];
    visitInlineTemplate(node: ts.StringLiteralLike): void;
    visitExternalTemplate(node: ExternalResource): void;
    /**
     * Searches for outdated css selectors in the specified content and creates replacements
     * with the according messages that can be added to a rule failure.
     */
    private _createReplacementsForContent;
}

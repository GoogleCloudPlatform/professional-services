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
 * Rule that walks through every inline or external template and reports if there are outdated
 * usages of the Angular Material API that need to be updated manually.
 */
export declare class Rule extends Rules.AbstractRule {
    apply(sourceFile: ts.SourceFile): RuleFailure[];
}
export declare class Walker extends ComponentWalker {
    visitInlineTemplate(node: ts.StringLiteralLike): void;
    visitExternalTemplate(node: ExternalResource): void;
    private _createFailuresForContent;
}

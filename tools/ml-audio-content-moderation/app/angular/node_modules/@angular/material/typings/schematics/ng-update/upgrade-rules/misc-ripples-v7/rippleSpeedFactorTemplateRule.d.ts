/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ComponentWalker, ExternalResource } from '@angular/cdk/schematics';
import { RuleFailure, Rules } from 'tslint';
import * as ts from 'typescript';
/**
 * Rule that walks through every inline or external template and updates the deprecated
 * [matRippleSpeedFactor] to [matRippleAnimation].
 */
export declare class Rule extends Rules.AbstractRule {
    apply(sourceFile: ts.SourceFile): RuleFailure[];
}
export declare class Walker extends ComponentWalker {
    visitInlineTemplate(node: ts.StringLiteralLike): void;
    visitExternalTemplate(node: ExternalResource): void;
    private _createReplacementsForContent;
}

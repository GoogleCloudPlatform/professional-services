/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as ts from 'typescript';
import { ExternalResource } from './component-file';
import { ExternalFailureWalker } from './external-failure-walker';
/**
 * Custom TSLint rule walker that identifies Angular components and visits specific parts of
 * the component metadata.
 */
export declare class ComponentWalker extends ExternalFailureWalker {
    visitInlineTemplate(_template: ts.StringLiteralLike): void;
    visitInlineStylesheet(_stylesheet: ts.StringLiteralLike): void;
    visitExternalTemplate(_template: ExternalResource): void;
    visitExternalStylesheet(_stylesheet: ExternalResource): void;
    /**
     * We keep track of all visited stylesheet files because we allow manually reporting external
     * stylesheets which couldn't be detected by the component walker. Reporting these files multiple
     * times will result in duplicated TSLint failures and replacements.
     */
    private _visitedStylesheetFiles;
    visitNode(node: ts.Node): void;
    private _visitDirectiveCallExpression;
    private _reportExternalTemplate;
    private _reportInlineStyles;
    private _visitExternalStylesArrayLiteral;
    private _reportExternalStyle;
    /**
     * Recursively searches for the metadata object literal expression inside of a directive call
     * expression. Since expression calls can be nested through *parenthesized* expressions, we
     * need to recursively visit and check every expression inside of a parenthesized expression.
     *
     * e.g. @Component((({myMetadataExpression}))) will return `myMetadataExpression`.
     */
    private _findMetadataFromExpression;
    /**
     * Creates a TSLint failure that reports that the resource file that belongs to the specified
     * TypeScript node could not be resolved in the file system.
     */
    private _createResourceNotFoundFailure;
    /** Reports the specified additional stylesheets. */
    _reportExtraStylesheetFiles(filePaths: string[]): void;
}

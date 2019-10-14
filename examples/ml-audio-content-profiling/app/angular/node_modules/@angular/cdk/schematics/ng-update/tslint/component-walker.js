"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const ts = require("typescript");
const literal_1 = require("../typescript/literal");
const component_file_1 = require("./component-file");
const external_failure_walker_1 = require("./external-failure-walker");
/**
 * Custom TSLint rule walker that identifies Angular components and visits specific parts of
 * the component metadata.
 */
class ComponentWalker extends external_failure_walker_1.ExternalFailureWalker {
    constructor() {
        super(...arguments);
        /**
         * We keep track of all visited stylesheet files because we allow manually reporting external
         * stylesheets which couldn't be detected by the component walker. Reporting these files multiple
         * times will result in duplicated TSLint failures and replacements.
         */
        this._visitedStylesheetFiles = new Set();
    }
    visitInlineTemplate(_template) { }
    visitInlineStylesheet(_stylesheet) { }
    visitExternalTemplate(_template) { }
    visitExternalStylesheet(_stylesheet) { }
    visitNode(node) {
        if (node.kind === ts.SyntaxKind.CallExpression) {
            const callExpression = node;
            const callExpressionName = callExpression.expression.getText();
            if (callExpressionName === 'Component' || callExpressionName === 'Directive') {
                this._visitDirectiveCallExpression(callExpression);
            }
        }
        super.visitNode(node);
    }
    _visitDirectiveCallExpression(callExpression) {
        // If the call expressions does not have the correct amount of arguments, we can assume that
        // this call expression is not related to Angular and just uses a similar decorator name.
        if (callExpression.arguments.length !== 1) {
            return;
        }
        const directiveMetadata = this._findMetadataFromExpression(callExpression.arguments[0]);
        if (!directiveMetadata) {
            return;
        }
        for (const property of directiveMetadata.properties) {
            const propertyName = property.name.getText();
            if (propertyName === 'template' && literal_1.isStringLiteralLike(property.initializer)) {
                this.visitInlineTemplate(property.initializer);
            }
            if (propertyName === 'templateUrl' && literal_1.isStringLiteralLike(property.initializer)) {
                this._reportExternalTemplate(property.initializer);
            }
            if (propertyName === 'styles' && ts.isArrayLiteralExpression(property.initializer)) {
                this._reportInlineStyles(property.initializer);
            }
            if (propertyName === 'styleUrls' && ts.isArrayLiteralExpression(property.initializer)) {
                this._visitExternalStylesArrayLiteral(property.initializer);
            }
        }
    }
    _reportExternalTemplate(node) {
        const templatePath = path_1.resolve(path_1.dirname(this.getSourceFile().fileName), node.text);
        // Check if the external template file exists before proceeding.
        if (!fs_1.existsSync(templatePath)) {
            this._createResourceNotFoundFailure(node, templatePath);
            return;
        }
        // Create a fake TypeScript source file that includes the template content.
        const templateFile = component_file_1.createComponentFile(templatePath, fs_1.readFileSync(templatePath, 'utf8'));
        this.visitExternalTemplate(templateFile);
    }
    _reportInlineStyles(expression) {
        expression.elements.forEach(node => {
            if (literal_1.isStringLiteralLike(node)) {
                this.visitInlineStylesheet(node);
            }
        });
    }
    _visitExternalStylesArrayLiteral(expression) {
        expression.elements.forEach(node => {
            if (literal_1.isStringLiteralLike(node)) {
                const stylePath = path_1.resolve(path_1.dirname(this.getSourceFile().fileName), node.text);
                // Check if the external stylesheet file exists before proceeding.
                if (!fs_1.existsSync(stylePath)) {
                    return this._createResourceNotFoundFailure(node, stylePath);
                }
                this._reportExternalStyle(stylePath);
            }
        });
    }
    _reportExternalStyle(stylePath) {
        // Keep track of all reported external stylesheets because we allow reporting additional
        // stylesheet files which couldn't be detected by the component walker. This allows us to
        // ensure that no stylesheet files are visited multiple times.
        if (this._visitedStylesheetFiles.has(stylePath)) {
            return;
        }
        this._visitedStylesheetFiles.add(stylePath);
        // Create a fake TypeScript source file that includes the stylesheet content.
        const stylesheetFile = component_file_1.createComponentFile(stylePath, fs_1.readFileSync(stylePath, 'utf8'));
        this.visitExternalStylesheet(stylesheetFile);
    }
    /**
     * Recursively searches for the metadata object literal expression inside of a directive call
     * expression. Since expression calls can be nested through *parenthesized* expressions, we
     * need to recursively visit and check every expression inside of a parenthesized expression.
     *
     * e.g. @Component((({myMetadataExpression}))) will return `myMetadataExpression`.
     */
    _findMetadataFromExpression(node) {
        if (node.kind === ts.SyntaxKind.ObjectLiteralExpression) {
            return node;
        }
        else if (node.kind === ts.SyntaxKind.ParenthesizedExpression) {
            return this._findMetadataFromExpression(node.expression);
        }
        return null;
    }
    /**
     * Creates a TSLint failure that reports that the resource file that belongs to the specified
     * TypeScript node could not be resolved in the file system.
     */
    _createResourceNotFoundFailure(node, resourceUrl) {
        this.addFailureAtNode(node, `Could not resolve resource file: "${resourceUrl}". ` +
            `Skipping automatic upgrade for this file.`);
    }
    /** Reports the specified additional stylesheets. */
    _reportExtraStylesheetFiles(filePaths) {
        filePaths.forEach(filePath => this._reportExternalStyle(path_1.resolve(filePath)));
    }
}
exports.ComponentWalker = ComponentWalker;
//# sourceMappingURL=component-walker.js.map
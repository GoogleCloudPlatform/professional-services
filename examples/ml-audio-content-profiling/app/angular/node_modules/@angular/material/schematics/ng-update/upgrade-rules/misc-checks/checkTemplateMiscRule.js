"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const schematics_1 = require("@angular/cdk/schematics");
const chalk_1 = require("chalk");
const tslint_1 = require("tslint");
/**
 * Rule that walks through every inline or external template and reports if there are outdated
 * usages of the Angular Material API that needs to be updated manually.
 */
class Rule extends tslint_1.Rules.AbstractRule {
    apply(sourceFile) {
        return this.applyWithWalker(new Walker(sourceFile, this.getOptions()));
    }
}
exports.Rule = Rule;
class Walker extends schematics_1.ComponentWalker {
    visitInlineTemplate(node) {
        this._createFailuresForContent(node, node.getText()).forEach(data => {
            this.addFailureFromStartToEnd(data.start, data.end, data.message);
        });
    }
    visitExternalTemplate(node) {
        this._createFailuresForContent(node, node.getText()).forEach(data => {
            this.addExternalFailureFromStartToEnd(node, data.start, data.end, data.message);
        });
    }
    _createFailuresForContent(node, content) {
        const failures = [];
        schematics_1.findOutputsOnElementWithTag(content, 'selectionChange', ['mat-list-option']).forEach(offset => {
            failures.push({
                start: node.getStart() + offset,
                end: node.getStart() + offset + 'selectionChange'.length,
                message: `Found deprecated @Output() "${chalk_1.red('selectionChange')}" on ` +
                    `"${chalk_1.bold('mat-list-option')}". Use "${chalk_1.green('selectionChange')}" on ` +
                    `"${chalk_1.bold('mat-selection-list')}" instead.`
            });
        });
        schematics_1.findOutputsOnElementWithTag(content, 'selectedChanged', ['mat-datepicker']).forEach(offset => {
            failures.push({
                start: node.getStart() + offset,
                end: node.getStart() + offset + 'selectionChange'.length,
                message: `Found deprecated @Output() "${chalk_1.red('selectedChanged')}" on ` +
                    `"${chalk_1.bold('mat-datepicker')}". Use "${chalk_1.green('dateChange')}" or ` +
                    `"${chalk_1.green('dateInput')}" on "${chalk_1.bold('<input [matDatepicker]>')}" instead.`
            });
        });
        schematics_1.findInputsOnElementWithTag(content, 'selected', ['mat-button-toggle-group']).forEach(offset => {
            failures.push({
                start: node.getStart() + offset,
                end: node.getStart() + offset + 'selected'.length,
                message: `Found deprecated @Input() "${chalk_1.red('selected')}" on ` +
                    `"${chalk_1.bold('mat-radio-button-group')}". Use "${chalk_1.green('value')}" instead.`
            });
        });
        return failures;
    }
}
exports.Walker = Walker;
//# sourceMappingURL=checkTemplateMiscRule.js.map
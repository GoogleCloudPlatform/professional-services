"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const tslint_1 = require("tslint");
const component_walker_1 = require("../../tslint/component-walker");
const literal_1 = require("../../typescript/literal");
const upgrade_data_1 = require("../../upgrade-data");
/**
 * Rule that walks through every inline or external CSs stylesheet and updates outdated
 * CSS selectors.
 */
class Rule extends tslint_1.Rules.AbstractRule {
    apply(sourceFile) {
        return this.applyWithWalker(new Walker(sourceFile, this.getOptions()));
    }
}
exports.Rule = Rule;
class Walker extends component_walker_1.ComponentWalker {
    constructor(sourceFile, options) {
        super(sourceFile, options);
        /** Change data that upgrades to the specified target version. */
        this.data = upgrade_data_1.getUpgradeDataFromWalker(this, 'cssSelectors');
        this._reportExtraStylesheetFiles(options.ruleArguments[2]);
    }
    visitInlineStylesheet(node) {
        this._createReplacementsForContent(node, node.getText()).forEach(data => {
            this.addFailureAtReplacement(data.failureMessage, data.replacement);
        });
    }
    visitExternalStylesheet(node) {
        this._createReplacementsForContent(node, node.getText()).forEach(data => {
            this.addExternalFailureAtReplacement(node, data.failureMessage, data.replacement);
        });
    }
    /**
     * Searches for outdated CSS selectors in the specified content and creates replacements
     * with the according messages that can be added to a rule failure.
     */
    _createReplacementsForContent(node, stylesheetContent) {
        const replacements = [];
        this.data.forEach(data => {
            if (data.whitelist && !data.whitelist.stylesheet) {
                return;
            }
            const failureMessage = `Found deprecated CSS selector "${chalk_1.red(data.replace)}" ` +
                `which has been renamed to "${chalk_1.green(data.replaceWith)}"`;
            literal_1.findAllSubstringIndices(stylesheetContent, data.replace)
                .map(offset => node.getStart() + offset)
                .map(start => new tslint_1.Replacement(start, data.replace.length, data.replaceWith))
                .forEach(replacement => replacements.push({ replacement, failureMessage }));
        });
        return replacements;
    }
}
exports.Walker = Walker;
//# sourceMappingURL=cssSelectorsStylesheetRule.js.map
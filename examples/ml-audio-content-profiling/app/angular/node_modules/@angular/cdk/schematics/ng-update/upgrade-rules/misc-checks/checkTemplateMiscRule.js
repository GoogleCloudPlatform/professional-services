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
/**
 * Rule that walks through every inline or external template and reports if there are outdated
 * usages of the Angular Material API that need to be updated manually.
 */
class Rule extends tslint_1.Rules.AbstractRule {
    apply(sourceFile) {
        return this.applyWithWalker(new Walker(sourceFile, this.getOptions()));
    }
}
exports.Rule = Rule;
class Walker extends component_walker_1.ComponentWalker {
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
        literal_1.findAllSubstringIndices(content, 'cdk-focus-trap').forEach(offset => {
            failures.push({
                start: node.getStart() + offset,
                end: node.getStart() + offset + 'cdk-focus-trap'.length,
                message: `Found deprecated element selector "${chalk_1.red('cdk-focus-trap')}" which has been ` +
                    `changed to an attribute selector "${chalk_1.green('[cdkTrapFocus]')}".`
            });
        });
        return failures;
    }
}
exports.Walker = Walker;
//# sourceMappingURL=checkTemplateMiscRule.js.map
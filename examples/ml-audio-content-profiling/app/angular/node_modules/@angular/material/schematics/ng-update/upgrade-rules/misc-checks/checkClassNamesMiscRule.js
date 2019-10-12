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
/**
 * Rule that looks for class name identifiers that have been removed but cannot be
 * automatically migrated.
 */
class Rule extends tslint_1.Rules.AbstractRule {
    apply(sourceFile) {
        return this.applyWithWalker(new Walker(sourceFile, this.getOptions()));
    }
}
exports.Rule = Rule;
class Walker extends tslint_1.RuleWalker {
    visitIdentifier(identifier) {
        if (identifier.getText() === 'MatDrawerToggleResult') {
            this.addFailureAtNode(identifier, `Found "${chalk_1.bold('MatDrawerToggleResult')}" which has changed from a class type to a` +
                ` string literal type. Code may need to be updated`);
        }
        if (identifier.getText() === 'MatListOptionChange') {
            this.addFailureAtNode(identifier, `Found usage of "${chalk_1.red('MatListOptionChange')}" which has been removed. Please listen` +
                ` for ${chalk_1.bold('selectionChange')} on ${chalk_1.bold('MatSelectionList')} instead`);
        }
    }
}
exports.Walker = Walker;
//# sourceMappingURL=checkClassNamesMiscRule.js.map
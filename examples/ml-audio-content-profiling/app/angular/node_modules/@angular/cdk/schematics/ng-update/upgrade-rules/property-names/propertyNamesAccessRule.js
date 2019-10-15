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
const upgrade_data_1 = require("../../upgrade-data");
/**
 * Rule that walks through every property access expression and updates properties that have
 * been changed in favor of a new name.
 */
class Rule extends tslint_1.Rules.TypedRule {
    applyWithProgram(sourceFile, program) {
        return this.applyWithWalker(new Walker(sourceFile, this.getOptions(), program));
    }
}
exports.Rule = Rule;
class Walker extends tslint_1.ProgramAwareRuleWalker {
    constructor() {
        super(...arguments);
        /** Change data that upgrades to the specified target version. */
        this.data = upgrade_data_1.getUpgradeDataFromWalker(this, 'propertyNames');
    }
    visitPropertyAccessExpression(node) {
        const hostType = this.getTypeChecker().getTypeAtLocation(node.expression);
        const typeName = hostType && hostType.symbol && hostType.symbol.getName();
        this.data.forEach(data => {
            if (node.name.text !== data.replace) {
                return;
            }
            if (!data.whitelist || data.whitelist.classes.includes(typeName)) {
                const replacement = this.createReplacement(node.name.getStart(), node.name.getWidth(), data.replaceWith);
                this.addFailureAtNode(node.name, `Found deprecated property ${chalk_1.red(data.replace)} which ` +
                    `has been renamed to "${chalk_1.green(data.replaceWith)}"`, replacement);
            }
        });
        super.visitPropertyAccessExpression(node);
    }
}
exports.Walker = Walker;
//# sourceMappingURL=propertyNamesAccessRule.js.map
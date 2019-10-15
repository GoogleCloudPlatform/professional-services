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
 * Rule that walks through every property access expression and and reports to TSLint if
 * a given property name is no longer existing but cannot be automatically migrated.
 */
class Rule extends tslint_1.Rules.TypedRule {
    applyWithProgram(sourceFile, program) {
        return this.applyWithWalker(new Walker(sourceFile, this.getOptions(), program));
    }
}
exports.Rule = Rule;
class Walker extends tslint_1.ProgramAwareRuleWalker {
    visitPropertyAccessExpression(node) {
        const hostType = this.getTypeChecker().getTypeAtLocation(node.expression);
        const typeName = hostType && hostType.symbol && hostType.symbol.getName();
        if (typeName === 'MatListOption' && node.name.text === 'selectionChange') {
            this.addFailureAtNode(node, `Found deprecated property "${chalk_1.red('selectionChange')}" of ` +
                `class "${chalk_1.bold('MatListOption')}". Use the "${chalk_1.green('selectionChange')}" property on ` +
                `the parent "${chalk_1.bold('MatSelectionList')}" instead.`);
        }
        if (typeName === 'MatDatepicker' && node.name.text === 'selectedChanged') {
            this.addFailureAtNode(node, `Found deprecated property "${chalk_1.red('selectedChanged')}" of ` +
                `class "${chalk_1.bold('MatDatepicker')}". Use the "${chalk_1.green('dateChange')}" or ` +
                `"${chalk_1.green('dateInput')}" methods on "${chalk_1.bold('MatDatepickerInput')}" instead`);
        }
        super.visitPropertyAccessExpression(node);
    }
}
exports.Walker = Walker;
//# sourceMappingURL=checkPropertyNamesMiscRule.js.map
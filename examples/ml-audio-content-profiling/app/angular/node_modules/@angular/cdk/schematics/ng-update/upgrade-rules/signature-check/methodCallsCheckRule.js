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
const ts = require("typescript");
const upgrade_data_1 = require("../../upgrade-data");
/**
 * Rule that visits every TypeScript method call expression and checks if the argument count
 * is invalid and needs to be *manually* updated.
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
        this.data = upgrade_data_1.getUpgradeDataFromWalker(this, 'methodCallChecks');
    }
    visitCallExpression(node) {
        if (ts.isPropertyAccessExpression(node.expression)) {
            this._checkPropertyAccessMethodCall(node);
        }
        return super.visitCallExpression(node);
    }
    _checkPropertyAccessMethodCall(node) {
        const propertyAccess = node.expression;
        if (!ts.isIdentifier(propertyAccess.name)) {
            return;
        }
        const hostType = this.getTypeChecker().getTypeAtLocation(propertyAccess.expression);
        const hostTypeName = hostType.symbol && hostType.symbol.name;
        const methodName = propertyAccess.name.text;
        if (!hostTypeName) {
            return;
        }
        const failure = this.data
            .filter(data => data.method === methodName && data.className === hostTypeName)
            .map(data => data.invalidArgCounts.find(f => f.count === node.arguments.length))[0];
        if (!failure) {
            return;
        }
        this.addFailureAtNode(node, `Found call to "${chalk_1.bold(hostTypeName + '.' + methodName)}" ` +
            `with ${chalk_1.bold(`${failure.count}`)} arguments. Message: ${failure.message}`);
    }
}
exports.Walker = Walker;
//# sourceMappingURL=methodCallsCheckRule.js.map
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
const schematics_1 = require("@angular/cdk/schematics");
/**
 * Rule that checks for classes that extend Angular Material classes which have changed
 * their API.
 */
class Rule extends tslint_1.Rules.TypedRule {
    applyWithProgram(sourceFile, program) {
        return this.applyWithWalker(new Walker(sourceFile, this.getOptions(), program));
    }
}
exports.Rule = Rule;
class Walker extends tslint_1.ProgramAwareRuleWalker {
    visitClassDeclaration(node) {
        const baseTypes = schematics_1.determineBaseTypes(node);
        const className = node.name ? node.name.text : '{unknown-name}';
        if (!baseTypes) {
            return;
        }
        if (baseTypes.includes('MatFormFieldControl')) {
            const hasFloatLabelMember = node.members
                .filter(member => member.name)
                .find(member => member.name.getText() === 'shouldFloatLabel');
            if (!hasFloatLabelMember) {
                this.addFailureAtNode(node, `Found class "${chalk_1.bold(className)}" which extends ` +
                    `"${chalk_1.bold('MatFormFieldControl')}". This class must define ` +
                    `"${chalk_1.green('shouldLabelFloat')}" which is now a required property.`);
            }
        }
    }
}
exports.Walker = Walker;
//# sourceMappingURL=checkClassInheritanceMiscRule.js.map
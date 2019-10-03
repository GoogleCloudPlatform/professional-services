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
const ripple_speed_factor_1 = require("./ripple-speed-factor");
/**
 * Note that will be added whenever a speed factor expression has been converted to calculate
 * the according duration. This note should encourage people to clean up their code by switching
 * away from the speed factors to explicit durations.
 */
const removeNote = `TODO: Cleanup duration calculation.`;
/**
 * Rule that walks through every property assignment and switches the global `baseSpeedFactor`
 * ripple option to the new global animation config. Also updates every class member assignment
 * that refers to MatRipple#speedFactor.
 */
class Rule extends tslint_1.Rules.TypedRule {
    applyWithProgram(sourceFile, program) {
        return this.applyWithWalker(new Walker(sourceFile, this.getOptions(), program));
    }
}
exports.Rule = Rule;
class Walker extends tslint_1.ProgramAwareRuleWalker {
    /** Switches binary expressions (e.g. myRipple.speedFactor = 0.5) to the new animation config. */
    visitBinaryExpression(expression) {
        if (!ts.isPropertyAccessExpression(expression.left)) {
            return;
        }
        // Left side expression consists of target object and property name (e.g. myInstance.val)
        const leftExpression = expression.left;
        const targetTypeNode = this.getTypeChecker().getTypeAtLocation(leftExpression.expression);
        if (!targetTypeNode.symbol) {
            return;
        }
        const targetTypeName = targetTypeNode.symbol.getName();
        const propertyName = leftExpression.name.getText();
        if (targetTypeName === 'MatRipple' && propertyName === 'speedFactor') {
            if (ts.isNumericLiteral(expression.right)) {
                const numericValue = parseFloat(expression.right.text);
                const newEnterDurationValue = ripple_speed_factor_1.convertSpeedFactorToDuration(numericValue);
                // Replace the `speedFactor` property name with `animation`.
                const propertyNameReplacement = this.createReplacement(leftExpression.name.getStart(), leftExpression.name.getWidth(), 'animation');
                // Replace the value assignment with the new animation config.
                const rightExpressionReplacement = this.createReplacement(expression.right.getStart(), expression.right.getWidth(), `{enterDuration: ${newEnterDurationValue}}`);
                this.addFailureAtNode(expression, `Found deprecated variable assignment for "${chalk_1.bold('MatRipple')}#${chalk_1.red('speedFactor')}"`, [propertyNameReplacement, rightExpressionReplacement]);
            }
            else {
                // Handle the right expression differently if the previous speed factor value can't
                // be resolved statically. In that case, we just create a TypeScript expression that
                // calculates the explicit duration based on the non-static speed factor expression.
                const newExpression = ripple_speed_factor_1.createSpeedFactorConvertExpression(expression.right.getText());
                // Replace the `speedFactor` property name with `animation`.
                const propertyNameReplacement = this.createReplacement(leftExpression.name.getStart(), leftExpression.name.getWidth(), 'animation');
                // Replace the value assignment with the new animation config and remove TODO.
                const rightExpressionReplacement = this.createReplacement(expression.right.getStart(), expression.right.getWidth(), `/** ${removeNote} */ {enterDuration: ${newExpression}}`);
                this.addFailureAtNode(expression, `Found deprecated variable assignment for "${chalk_1.bold('MatRipple')}#${chalk_1.red('speedFactor')}"`, [propertyNameReplacement, rightExpressionReplacement]);
            }
        }
    }
    /**
     * Switches a potential global option `baseSpeedFactor` to the new animation config. For this
     * we assume that the `baseSpeedFactor` is not used in combination with individual speed factors.
     */
    visitPropertyAssignment(assignment) {
        // For switching the `baseSpeedFactor` global option we expect the property assignment
        // to be inside of a normal object literal. Custom ripple global options cannot be switched
        // automatically.
        if (!ts.isObjectLiteralExpression(assignment.parent)) {
            return;
        }
        // The assignment consists of a name (key) and initializer (value).
        if (assignment.name.getText() !== 'baseSpeedFactor') {
            return;
        }
        // We could technically lazily check for the MAT_RIPPLE_GLOBAL_OPTIONS injection token to
        // be present, but it's not right to assume that everyone sets the ripple global options
        // immediately in the provider object (e.g. it can happen that someone just imports the
        // config from a separate file).
        const { initializer, name } = assignment;
        if (ts.isNumericLiteral(initializer)) {
            const numericValue = parseFloat(initializer.text);
            const newEnterDurationValue = ripple_speed_factor_1.convertSpeedFactorToDuration(numericValue);
            const keyNameReplacement = this.createReplacement(name.getStart(), assignment.name.getWidth(), `animation`);
            const initializerReplacement = this.createReplacement(initializer.getStart(), initializer.getWidth(), `{enterDuration: ${newEnterDurationValue}}`);
            this.addFailureAtNode(assignment, `Found deprecated property assignment for "${chalk_1.bold('MAT_RIPPLE_GLOBAL_OPTIONS')}:` +
                `${chalk_1.red('baseSpeedFactor')}"`, [keyNameReplacement, initializerReplacement]);
        }
        else {
            // Handle the right expression differently if the previous speed factor value can't
            // be resolved statically. In that case, we just create a TypeScript expression that
            // calculates the explicit duration based on the non-static speed factor expression.
            const newExpression = ripple_speed_factor_1.createSpeedFactorConvertExpression(initializer.getText());
            // Replace the `baseSpeedFactor` property name with `animation`.
            const propertyNameReplacement = this.createReplacement(name.getStart(), name.getWidth(), 'animation');
            // Replace the value assignment with the new animation config and remove TODO.
            const rightExpressionReplacement = this.createReplacement(initializer.getStart(), initializer.getWidth(), `/** ${removeNote} */ {enterDuration: ${newExpression}}`);
            this.addFailureAtNode(assignment, `Found a deprecated property assignment for "${chalk_1.bold('MAT_RIPPLE_GLOBAL_OPTIONS')}:` +
                `${chalk_1.red('baseSpeedFactor')}.`, [propertyNameReplacement, rightExpressionReplacement]);
        }
    }
}
exports.Walker = Walker;
//# sourceMappingURL=rippleSpeedFactorAssignmentRule.js.map
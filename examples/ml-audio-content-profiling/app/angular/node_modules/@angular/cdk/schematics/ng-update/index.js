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
const target_version_1 = require("./target-version");
const upgrade_data_1 = require("./upgrade-data");
const upgrade_rules_1 = require("./upgrade-rules");
/** List of additional upgrade rules which are specifically for the CDK. */
const extraUpgradeRules = [
    // Misc check rules
    'check-template-misc',
];
/** TSLint upgrade configuration that will be passed to the CDK ng-update rule. */
const tslintUpgradeConfig = {
    upgradeData: upgrade_data_1.cdkUpgradeData,
    extraUpgradeRules,
};
/** Entry point for the migration schematics with target of Angular Material 6.0.0 */
function updateToV6() {
    return upgrade_rules_1.createUpgradeRule(target_version_1.TargetVersion.V6, tslintUpgradeConfig);
}
exports.updateToV6 = updateToV6;
/** Entry point for the migration schematics with target of Angular Material 7.0.0 */
function updateToV7() {
    return upgrade_rules_1.createUpgradeRule(target_version_1.TargetVersion.V7, tslintUpgradeConfig);
}
exports.updateToV7 = updateToV7;
/** Entry point for the migration schematics with target of Angular Material 8.0.0 */
function updateToV8() {
    return upgrade_rules_1.createUpgradeRule(target_version_1.TargetVersion.V8, tslintUpgradeConfig);
}
exports.updateToV8 = updateToV8;
/** Post-update schematic to be called when update is finished. */
function postUpdate() {
    return () => {
        console.log();
        console.log(chalk_1.green('  ✓  Angular CDK update complete'));
        console.log();
        console.log(chalk_1.yellow('  ⚠  Please check the output above for any issues that were detected ' +
            'but could not be automatically fixed.'));
    };
}
exports.postUpdate = postUpdate;
//# sourceMappingURL=index.js.map
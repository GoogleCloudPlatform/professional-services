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
const glob_1 = require("glob");
const upgrade_data_1 = require("./upgrade-data");
/** List of additional upgrade rules for Angular Material. */
const upgradeRules = [
    // Misc check rules
    'check-class-inheritance-misc',
    'check-class-names-misc',
    'check-imports-misc',
    'check-property-names-misc',
    'check-template-misc',
    // Ripple misc V7
    ['ripple-speed-factor-assignment', schematics_1.TargetVersion.V7],
    ['ripple-speed-factor-template', schematics_1.TargetVersion.V7],
];
/** List of absolute paths that refer to directories that contain the Material upgrade rules. */
const ruleDirectories = glob_1.sync('upgrade-rules/**/', { cwd: __dirname, absolute: true });
/** TSLint upgrade configuration that will be passed to the CDK ng-update rule. */
const tslintUpgradeConfig = {
    upgradeData: upgrade_data_1.materialUpgradeData,
    extraRuleDirectories: ruleDirectories,
    extraUpgradeRules: upgradeRules,
};
/** Entry point for the migration schematics with target of Angular Material v6 */
function updateToV6() {
    return schematics_1.createUpgradeRule(schematics_1.TargetVersion.V6, tslintUpgradeConfig);
}
exports.updateToV6 = updateToV6;
/** Entry point for the migration schematics with target of Angular Material v7 */
function updateToV7() {
    return schematics_1.createUpgradeRule(schematics_1.TargetVersion.V7, tslintUpgradeConfig);
}
exports.updateToV7 = updateToV7;
/** Post-update schematic to be called when update is finished. */
function postUpdate() {
    return () => {
        console.log();
        console.log(chalk_1.green('  ✓  Angular Material update complete'));
        console.log();
        console.log(chalk_1.yellow('  ⚠  Please check the output above for any issues that were detected ' +
            'but could not be automatically fixed.'));
    };
}
exports.postUpdate = postUpdate;
//# sourceMappingURL=index.js.map
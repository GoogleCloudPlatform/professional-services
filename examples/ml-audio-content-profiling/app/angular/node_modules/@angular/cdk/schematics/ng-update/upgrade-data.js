"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const schematics_1 = require("@angular-devkit/schematics");
const data_1 = require("./data");
const target_version_1 = require("./target-version");
/** Upgrade data for the Angular CDK. */
exports.cdkUpgradeData = {
    attributeSelectors: data_1.attributeSelectors,
    classNames: data_1.classNames,
    constructorChecks: data_1.constructorChecks,
    cssSelectors: data_1.cssSelectors,
    elementSelectors: data_1.elementSelectors,
    inputNames: data_1.inputNames,
    methodCallChecks: data_1.methodCallChecks,
    outputNames: data_1.outputNames,
    propertyNames: data_1.propertyNames,
};
/**
 * Gets the changes for a given target version from the specified version changes object.
 *
 * For readability and a good overview of breaking changes, the version change data always
 * includes the related Pull Request link. Since this data is not needed when performing the
 * upgrade, this unused data can be removed and the changes data can be flattened into an
 * easy iterable array.
 */
function getChangesForTarget(target, data) {
    if (!data) {
        throw new schematics_1.SchematicsException(`No data could be found for target version: ${target_version_1.TargetVersion[target]}`);
    }
    if (!data[target]) {
        return [];
    }
    return data[target].reduce((result, prData) => result.concat(prData.changes), []);
}
exports.getChangesForTarget = getChangesForTarget;
/**
 * Gets all changes from the specified version changes object. This is helpful in case a migration
 * rule does not distinguish data based on the target version, but for readability the
 * upgrade data is separated for each target version.
 */
function getAllChanges(data) {
    return Object.keys(data)
        .map(targetVersion => getChangesForTarget(parseInt(targetVersion), data))
        .reduce((result, versionData) => result.concat(versionData), []);
}
exports.getAllChanges = getAllChanges;
/**
 * Gets the reduced upgrade data for the specified data key from the rule walker options.
 *
 * The function reads out the target version and upgrade data object from the rule options and
 * resolves the specified data portion that is specifically tied to the target version.
 */
function getUpgradeDataFromWalker(walker, dataName) {
    return getChangesForTarget(walker.getOptions()[0], walker.getOptions()[1][dataName]);
}
exports.getUpgradeDataFromWalker = getUpgradeDataFromWalker;
//# sourceMappingURL=upgrade-data.js.map
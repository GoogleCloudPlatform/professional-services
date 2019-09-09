/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { TargetVersion } from '../target-version';
import { RuleUpgradeData } from '../upgrade-data';
/** Optional upgrade configuration for TSLint. */
export interface UpgradeTSLintConfig {
    upgradeData: RuleUpgradeData;
    extraRuleDirectories?: string[];
    extraUpgradeRules?: UpgradeRules;
    extraStyleFiles?: string[];
}
/** Type for the configuration list of upgrade rules. */
export declare type UpgradeRules = (string | (string | TargetVersion)[])[];
/**
 * Creates a TSLint configuration object that can be passed to the schematic `TSLintFixTask`.
 * Each rule will have the specified target version as option which can be used to swap out
 * the upgrade data based on the given target version.
 *
 * @param target Target version that will be used to reduce the upgrade data to the necessary
 * changes that are affected by the target version.
 * @param config Configuration object that can be specified to add additional rules or
 * specify additional external stylesheets which are not referenced by Angular.
 */
export declare function createTslintConfig(target: TargetVersion, config: UpgradeTSLintConfig): {
    rulesDirectory: string[];
    rules: {};
};

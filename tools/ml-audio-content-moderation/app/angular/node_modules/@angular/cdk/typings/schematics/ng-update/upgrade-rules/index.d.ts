/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Rule } from '@angular-devkit/schematics';
import { TargetVersion } from '../target-version';
import { UpgradeTSLintConfig } from './tslint-config';
/** Creates a Angular schematic rule that runs the upgrade for the specified target version. */
export declare function createUpgradeRule(targetVersion: TargetVersion, upgradeConfig: UpgradeTSLintConfig): Rule;

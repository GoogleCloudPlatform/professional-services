/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { RuleWalker } from 'tslint';
import { AttributeSelectorUpgradeData, ClassNameUpgradeData, ConstructorChecksUpgradeData, CssSelectorUpgradeData, ElementSelectorUpgradeData, InputNameUpgradeData, MethodCallUpgradeData, OutputNameUpgradeData, PropertyNameUpgradeData } from './data';
import { TargetVersion } from './target-version';
export declare type VersionChanges<T> = {
    [target in TargetVersion]?: ReadableChange<T>[];
};
export declare type ReadableChange<T> = {
    pr: string;
    changes: T[];
};
/** Conditional type that unwraps the value of a version changes type. */
declare type ValueOfChanges<T> = T extends VersionChanges<infer X> ? X : null;
/**
 * Interface that describes the upgrade data that needs to be defined when using the CDK
 * upgrade rules.
 */
export interface RuleUpgradeData {
    attributeSelectors: VersionChanges<AttributeSelectorUpgradeData>;
    classNames: VersionChanges<ClassNameUpgradeData>;
    constructorChecks: VersionChanges<ConstructorChecksUpgradeData>;
    cssSelectors: VersionChanges<CssSelectorUpgradeData>;
    elementSelectors: VersionChanges<ElementSelectorUpgradeData>;
    inputNames: VersionChanges<InputNameUpgradeData>;
    methodCallChecks: VersionChanges<MethodCallUpgradeData>;
    outputNames: VersionChanges<OutputNameUpgradeData>;
    propertyNames: VersionChanges<PropertyNameUpgradeData>;
}
/** Upgrade data for the Angular CDK. */
export declare const cdkUpgradeData: RuleUpgradeData;
/**
 * Gets the changes for a given target version from the specified version changes object.
 *
 * For readability and a good overview of breaking changes, the version change data always
 * includes the related Pull Request link. Since this data is not needed when performing the
 * upgrade, this unused data can be removed and the changes data can be flattened into an
 * easy iterable array.
 */
export declare function getChangesForTarget<T>(target: TargetVersion, data: VersionChanges<T>): T[];
/**
 * Gets all changes from the specified version changes object. This is helpful in case a migration
 * rule does not distinguish data based on the target version, but for readability the
 * upgrade data is separated for each target version.
 */
export declare function getAllChanges<T>(data: VersionChanges<T>): T[];
/**
 * Gets the reduced upgrade data for the specified data key from the rule walker options.
 *
 * The function reads out the target version and upgrade data object from the rule options and
 * resolves the specified data portion that is specifically tied to the target version.
 */
export declare function getUpgradeDataFromWalker<T extends keyof RuleUpgradeData, U = ValueOfChanges<RuleUpgradeData[T]>>(walker: RuleWalker, dataName: T): U[];
export {};

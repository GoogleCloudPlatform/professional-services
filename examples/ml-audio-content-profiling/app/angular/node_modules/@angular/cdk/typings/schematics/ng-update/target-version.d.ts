/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/** Possible versions that can be automatically migrated by `ng update`. */
export declare enum TargetVersion {
    V6 = 0,
    V7 = 1,
    V8 = 2
}
/**
 * Returns all versions that are supported by "ng update". The versions are determined
 * based on the "TargetVersion" enum.
 */
export declare function getAllVersionNames(): string[];

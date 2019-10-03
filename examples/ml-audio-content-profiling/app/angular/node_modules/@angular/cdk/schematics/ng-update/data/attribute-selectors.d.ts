/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { VersionChanges } from '../upgrade-data';
export interface AttributeSelectorUpgradeData {
    /** The attribute name to replace. */
    replace: string;
    /** The new name for the attribute. */
    replaceWith: string;
}
export declare const attributeSelectors: VersionChanges<AttributeSelectorUpgradeData>;

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Constructor } from './constructor';
import { CanDisable } from './disabled';
/** @docs-private */
export interface HasTabIndex {
    /** Tabindex of the component. */
    tabIndex: number;
}
/** @docs-private */
export declare type HasTabIndexCtor = Constructor<HasTabIndex>;
/** Mixin to augment a directive with a `tabIndex` property. */
export declare function mixinTabIndex<T extends Constructor<CanDisable>>(base: T, defaultTabIndex?: number): HasTabIndexCtor & T;

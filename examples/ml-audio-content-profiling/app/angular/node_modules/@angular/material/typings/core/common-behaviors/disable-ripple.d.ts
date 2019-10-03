/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Constructor } from './constructor';
/** @docs-private */
export interface CanDisableRipple {
    /** Whether ripples are disabled. */
    disableRipple: boolean;
}
/** @docs-private */
export declare type CanDisableRippleCtor = Constructor<CanDisableRipple>;
/** Mixin to augment a directive with a `disableRipple` property. */
export declare function mixinDisableRipple<T extends Constructor<{}>>(base: T): CanDisableRippleCtor & T;

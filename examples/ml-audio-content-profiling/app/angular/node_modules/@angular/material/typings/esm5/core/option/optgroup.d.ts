/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { CanDisable, CanDisableCtor } from '../common-behaviors/disabled';
/** @docs-private */
export declare class MatOptgroupBase {
}
export declare const _MatOptgroupMixinBase: CanDisableCtor & typeof MatOptgroupBase;
/**
 * Component that is used to group instances of `mat-option`.
 */
export declare class MatOptgroup extends _MatOptgroupMixinBase implements CanDisable {
    /** Label for the option group. */
    label: string;
    /** Unique id for the underlying label. */
    _labelId: string;
}

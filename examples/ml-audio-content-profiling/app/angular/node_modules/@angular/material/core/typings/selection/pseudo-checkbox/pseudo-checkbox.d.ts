/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Possible states for a pseudo checkbox.
 * @docs-private
 */
export declare type MatPseudoCheckboxState = 'unchecked' | 'checked' | 'indeterminate';
/**
 * Component that shows a simplified checkbox without including any kind of "real" checkbox.
 * Meant to be used when the checkbox is purely decorative and a large number of them will be
 * included, such as for the options in a multi-select. Uses no SVGs or complex animations.
 * Note that theming is meant to be handled by the parent element, e.g.
 * `mat-primary .mat-pseudo-checkbox`.
 *
 * Note that this component will be completely invisible to screen-reader users. This is *not*
 * interchangeable with `<mat-checkbox>` and should *not* be used if the user would directly
 * interact with the checkbox. The pseudo-checkbox should only be used as an implementation detail
 * of more complex components that appropriately handle selected / checked state.
 * @docs-private
 */
export declare class MatPseudoCheckbox {
    _animationMode?: string | undefined;
    /** Display state of the checkbox. */
    state: MatPseudoCheckboxState;
    /** Whether the checkbox is disabled. */
    disabled: boolean;
    constructor(_animationMode?: string | undefined);
}

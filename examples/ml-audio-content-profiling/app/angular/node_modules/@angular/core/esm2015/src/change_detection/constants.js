/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/** @enum {number} */
var ChangeDetectionStrategy = {
    /**
       * Use the `CheckOnce` strategy, meaning that automatic change detection is deactivated
       * until reactivated by setting the strategy to `Default` (`CheckAlways`).
       * Change detection can still be explictly invoked.
       */
    OnPush: 0,
    /**
       * Use the default `CheckAlways` strategy, in which change detection is automatic until
       * explicitly deactivated.
       */
    Default: 1,
};
export { ChangeDetectionStrategy };
ChangeDetectionStrategy[ChangeDetectionStrategy.OnPush] = 'OnPush';
ChangeDetectionStrategy[ChangeDetectionStrategy.Default] = 'Default';
/** @enum {number} */
var ChangeDetectorStatus = {
    /**
       * A state in which, after calling `detectChanges()`, the change detector
       * state becomes `Checked`, and must be explicitly invoked or reactivated.
       */
    CheckOnce: 0,
    /**
       * A state in which change detection is skipped until the change detector mode
       * becomes `CheckOnce`.
       */
    Checked: 1,
    /**
       * A state in which change detection continues automatically until explictly
       * deactivated.
       */
    CheckAlways: 2,
    /**
       * A state in which a change detector sub tree is not a part of the main tree and
       * should be skipped.
       */
    Detached: 3,
    /**
       * Indicates that the change detector encountered an error checking a binding
       * or calling a directive lifecycle method and is now in an inconsistent state. Change
       * detectors in this state do not detect changes.
       */
    Errored: 4,
    /**
       * Indicates that the change detector has been destroyed.
       */
    Destroyed: 5,
};
export { ChangeDetectorStatus };
ChangeDetectorStatus[ChangeDetectorStatus.CheckOnce] = 'CheckOnce';
ChangeDetectorStatus[ChangeDetectorStatus.Checked] = 'Checked';
ChangeDetectorStatus[ChangeDetectorStatus.CheckAlways] = 'CheckAlways';
ChangeDetectorStatus[ChangeDetectorStatus.Detached] = 'Detached';
ChangeDetectorStatus[ChangeDetectorStatus.Errored] = 'Errored';
ChangeDetectorStatus[ChangeDetectorStatus.Destroyed] = 'Destroyed';
/**
 * Reports whether a given strategy is currently the default for change detection.
 * @see `ChangeDetectorStatus`
 * @see `ChangeDetectorRef`
 * @param {?} changeDetectionStrategy The strategy to check.
 * @return {?} True if the given strategy is the current default, false otherwise.
 */
export function isDefaultChangeDetectionStrategy(changeDetectionStrategy) {
    return changeDetectionStrategy == null ||
        changeDetectionStrategy === ChangeDetectionStrategy.Default;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc3RhbnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvY2hhbmdlX2RldGVjdGlvbi9jb25zdGFudHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBcUJFLFNBQVU7Ozs7O0lBTVYsVUFBVzs7O2dEQU5YLE1BQU07Z0RBTU4sT0FBTzs7Ozs7OztJQVlQLFlBQVM7Ozs7O0lBTVQsVUFBTzs7Ozs7SUFNUCxjQUFXOzs7OztJQU1YLFdBQVE7Ozs7OztJQU9SLFVBQU87Ozs7SUFLUCxZQUFTOzs7MENBOUJULFNBQVM7MENBTVQsT0FBTzswQ0FNUCxXQUFXOzBDQU1YLFFBQVE7MENBT1IsT0FBTzswQ0FLUCxTQUFTOzs7Ozs7OztBQVVYLE1BQU0sVUFBVSxnQ0FBZ0MsQ0FBQyx1QkFBZ0Q7SUFFL0YsT0FBTyx1QkFBdUIsSUFBSSxJQUFJO1FBQ2xDLHVCQUF1QixLQUFLLHVCQUF1QixDQUFDLE9BQU8sQ0FBQztDQUNqRSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuXG4vKipcbiAqIFRoZSBzdHJhdGVneSB0aGF0IHRoZSBkZWZhdWx0IGNoYW5nZSBkZXRlY3RvciB1c2VzIHRvIGRldGVjdCBjaGFuZ2VzLlxuICogV2hlbiBzZXQsIHRha2VzIGVmZmVjdCB0aGUgbmV4dCB0aW1lIGNoYW5nZSBkZXRlY3Rpb24gaXMgdHJpZ2dlcmVkLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGVudW0gQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kge1xuICAvKipcbiAgICogVXNlIHRoZSBgQ2hlY2tPbmNlYCBzdHJhdGVneSwgbWVhbmluZyB0aGF0IGF1dG9tYXRpYyBjaGFuZ2UgZGV0ZWN0aW9uIGlzIGRlYWN0aXZhdGVkXG4gICAqIHVudGlsIHJlYWN0aXZhdGVkIGJ5IHNldHRpbmcgdGhlIHN0cmF0ZWd5IHRvIGBEZWZhdWx0YCAoYENoZWNrQWx3YXlzYCkuXG4gICAqIENoYW5nZSBkZXRlY3Rpb24gY2FuIHN0aWxsIGJlIGV4cGxpY3RseSBpbnZva2VkLlxuICAgKi9cbiAgT25QdXNoID0gMCxcblxuICAvKipcbiAgICogVXNlIHRoZSBkZWZhdWx0IGBDaGVja0Fsd2F5c2Agc3RyYXRlZ3ksIGluIHdoaWNoIGNoYW5nZSBkZXRlY3Rpb24gaXMgYXV0b21hdGljIHVudGlsXG4gICAqIGV4cGxpY2l0bHkgZGVhY3RpdmF0ZWQuXG4gICAqL1xuICBEZWZhdWx0ID0gMSxcbn1cblxuLyoqXG4gKiBEZWZpbmVzIHRoZSBwb3NzaWJsZSBzdGF0ZXMgb2YgdGhlIGRlZmF1bHQgY2hhbmdlIGRldGVjdG9yLlxuICogQHNlZSBgQ2hhbmdlRGV0ZWN0b3JSZWZgXG4gKi9cbmV4cG9ydCBlbnVtIENoYW5nZURldGVjdG9yU3RhdHVzIHtcbiAgLyoqXG4gICAqIEEgc3RhdGUgaW4gd2hpY2gsIGFmdGVyIGNhbGxpbmcgYGRldGVjdENoYW5nZXMoKWAsIHRoZSBjaGFuZ2UgZGV0ZWN0b3JcbiAgICogc3RhdGUgYmVjb21lcyBgQ2hlY2tlZGAsIGFuZCBtdXN0IGJlIGV4cGxpY2l0bHkgaW52b2tlZCBvciByZWFjdGl2YXRlZC5cbiAgICovXG4gIENoZWNrT25jZSxcblxuICAvKipcbiAgICogQSBzdGF0ZSBpbiB3aGljaCBjaGFuZ2UgZGV0ZWN0aW9uIGlzIHNraXBwZWQgdW50aWwgdGhlIGNoYW5nZSBkZXRlY3RvciBtb2RlXG4gICAqIGJlY29tZXMgYENoZWNrT25jZWAuXG4gICAqL1xuICBDaGVja2VkLFxuXG4gIC8qKlxuICAgKiBBIHN0YXRlIGluIHdoaWNoIGNoYW5nZSBkZXRlY3Rpb24gY29udGludWVzIGF1dG9tYXRpY2FsbHkgdW50aWwgZXhwbGljdGx5XG4gICAqIGRlYWN0aXZhdGVkLlxuICAgKi9cbiAgQ2hlY2tBbHdheXMsXG5cbiAgLyoqXG4gICAqIEEgc3RhdGUgaW4gd2hpY2ggYSBjaGFuZ2UgZGV0ZWN0b3Igc3ViIHRyZWUgaXMgbm90IGEgcGFydCBvZiB0aGUgbWFpbiB0cmVlIGFuZFxuICAgKiBzaG91bGQgYmUgc2tpcHBlZC5cbiAgICovXG4gIERldGFjaGVkLFxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgdGhhdCB0aGUgY2hhbmdlIGRldGVjdG9yIGVuY291bnRlcmVkIGFuIGVycm9yIGNoZWNraW5nIGEgYmluZGluZ1xuICAgKiBvciBjYWxsaW5nIGEgZGlyZWN0aXZlIGxpZmVjeWNsZSBtZXRob2QgYW5kIGlzIG5vdyBpbiBhbiBpbmNvbnNpc3RlbnQgc3RhdGUuIENoYW5nZVxuICAgKiBkZXRlY3RvcnMgaW4gdGhpcyBzdGF0ZSBkbyBub3QgZGV0ZWN0IGNoYW5nZXMuXG4gICAqL1xuICBFcnJvcmVkLFxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgdGhhdCB0aGUgY2hhbmdlIGRldGVjdG9yIGhhcyBiZWVuIGRlc3Ryb3llZC5cbiAgICovXG4gIERlc3Ryb3llZCxcbn1cblxuLyoqXG4gKiBSZXBvcnRzIHdoZXRoZXIgYSBnaXZlbiBzdHJhdGVneSBpcyBjdXJyZW50bHkgdGhlIGRlZmF1bHQgZm9yIGNoYW5nZSBkZXRlY3Rpb24uXG4gKiBAcGFyYW0gY2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kgVGhlIHN0cmF0ZWd5IHRvIGNoZWNrLlxuICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgZ2l2ZW4gc3RyYXRlZ3kgaXMgdGhlIGN1cnJlbnQgZGVmYXVsdCwgZmFsc2Ugb3RoZXJ3aXNlLlxuICogQHNlZSBgQ2hhbmdlRGV0ZWN0b3JTdGF0dXNgXG4gKiBAc2VlIGBDaGFuZ2VEZXRlY3RvclJlZmBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzRGVmYXVsdENoYW5nZURldGVjdGlvblN0cmF0ZWd5KGNoYW5nZURldGVjdGlvblN0cmF0ZWd5OiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSk6XG4gICAgYm9vbGVhbiB7XG4gIHJldHVybiBjaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSA9PSBudWxsIHx8XG4gICAgICBjaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSA9PT0gQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuRGVmYXVsdDtcbn1cbiJdfQ==
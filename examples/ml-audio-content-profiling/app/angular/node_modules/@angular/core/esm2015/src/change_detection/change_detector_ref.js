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
import { R3_CHANGE_DETECTOR_REF_FACTORY } from '../ivy_switch/runtime/index';
/**
 * Base class for Angular Views, provides change detection functionality.
 * A change-detection tree collects all views that are to be checked for changes.
 * Use the methods to add and remove views from the tree, initiate change-detection,
 * and explicitly mark views as _dirty_, meaning that they have changed and need to be rerendered.
 *
 * \@usageNotes
 *
 * The following examples demonstrate how to modify default change-detection behavior
 * to perform explicit detection when needed.
 *
 * ### Use `markForCheck()` with `CheckOnce` strategy
 *
 * The following example sets the `OnPush` change-detection strategy for a component
 * (`CheckOnce`, rather than the default `CheckAlways`), then forces a second check
 * after an interval. See [live demo](http://plnkr.co/edit/GC512b?p=preview).
 *
 * <code-example path="core/ts/change_detect/change-detection.ts"
 * region="mark-for-check"></code-example>
 *
 * ### Detach change detector to limit how often check occurs
 *
 * The following example defines a component with a large list of read-only data
 * that is expected to change constantly, many times per second.
 * To improve performance, we want to check and update the list
 * less often than the changes actually occur. To do that, we detach
 * the component's change detector and perform an explicit local check every five seconds.
 *
 * <code-example path="core/ts/change_detect/change-detection.ts" region="detach"></code-example>
 *
 *
 * ### Reattaching a detached component
 *
 * The following example creates a component displaying live data.
 * The component detaches its change detector from the main change detector tree
 * when the `live` property is set to false, and reattaches it when the property
 * becomes true.
 *
 * <code-example path="core/ts/change_detect/change-detection.ts" region="reattach"></code-example>
 *
 * \@publicApi
 * @abstract
 */
export class ChangeDetectorRef {
}
/**
 * \@internal
 */
ChangeDetectorRef.__NG_ELEMENT_ID__ = () => R3_CHANGE_DETECTOR_REF_FACTORY();
if (false) {
    /**
     * \@internal
     * @type {?}
     */
    ChangeDetectorRef.__NG_ELEMENT_ID__;
    /**
     * When a view uses the {\@link ChangeDetectionStrategy#OnPush OnPush} (checkOnce)
     * change detection strategy, explicitly marks the view as changed so that
     * it can be checked again.
     *
     * Components are normally marked as dirty (in need of rerendering) when inputs
     * have changed or events have fired in the view. Call this method to ensure that
     * a component is checked even if these triggers have not occured.
     *
     * <!-- TODO: Add a link to a chapter on OnPush components -->
     *
     * @abstract
     * @return {?}
     */
    ChangeDetectorRef.prototype.markForCheck = function () { };
    /**
     * Detaches this view from the change-detection tree.
     * A detached view is  not checked until it is reattached.
     * Use in combination with `detectChanges()` to implement local change detection checks.
     *
     * Detached views are not checked during change detection runs until they are
     * re-attached, even if they are marked as dirty.
     *
     * <!-- TODO: Add a link to a chapter on detach/reattach/local digest -->
     * <!-- TODO: Add a live demo once ref.detectChanges is merged into master -->
     *
     * @abstract
     * @return {?}
     */
    ChangeDetectorRef.prototype.detach = function () { };
    /**
     * Checks this view and its children. Use in combination with {\@link ChangeDetectorRef#detach
     * detach}
     * to implement local change detection checks.
     *
     * <!-- TODO: Add a link to a chapter on detach/reattach/local digest -->
     * <!-- TODO: Add a live demo once ref.detectChanges is merged into master -->
     *
     * @abstract
     * @return {?}
     */
    ChangeDetectorRef.prototype.detectChanges = function () { };
    /**
     * Checks the change detector and its children, and throws if any changes are detected.
     *
     * Use in development mode to verify that running change detection doesn't introduce
     * other changes.
     * @abstract
     * @return {?}
     */
    ChangeDetectorRef.prototype.checkNoChanges = function () { };
    /**
     * Re-attaches the previously detached view to the change detection tree.
     * Views are attached to the tree by default.
     *
     * <!-- TODO: Add a link to a chapter on detach/reattach/local digest -->
     *
     * @abstract
     * @return {?}
     */
    ChangeDetectorRef.prototype.reattach = function () { };
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhbmdlX2RldGVjdG9yX3JlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2NoYW5nZV9kZXRlY3Rpb24vY2hhbmdlX2RldGVjdG9yX3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyw4QkFBOEIsRUFBQyxNQUFNLDZCQUE2QixDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTRDM0UsTUFBTSxPQUFnQixpQkFBaUI7Ozs7O0FBMERyQyxzQ0FBb0QsR0FBRyxFQUFFLENBQUMsOEJBQThCLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSM19DSEFOR0VfREVURUNUT1JfUkVGX0ZBQ1RPUll9IGZyb20gJy4uL2l2eV9zd2l0Y2gvcnVudGltZS9pbmRleCc7XG5cbi8qKlxuICogQmFzZSBjbGFzcyBmb3IgQW5ndWxhciBWaWV3cywgcHJvdmlkZXMgY2hhbmdlIGRldGVjdGlvbiBmdW5jdGlvbmFsaXR5LlxuICogQSBjaGFuZ2UtZGV0ZWN0aW9uIHRyZWUgY29sbGVjdHMgYWxsIHZpZXdzIHRoYXQgYXJlIHRvIGJlIGNoZWNrZWQgZm9yIGNoYW5nZXMuXG4gKiBVc2UgdGhlIG1ldGhvZHMgdG8gYWRkIGFuZCByZW1vdmUgdmlld3MgZnJvbSB0aGUgdHJlZSwgaW5pdGlhdGUgY2hhbmdlLWRldGVjdGlvbixcbiAqIGFuZCBleHBsaWNpdGx5IG1hcmsgdmlld3MgYXMgX2RpcnR5XywgbWVhbmluZyB0aGF0IHRoZXkgaGF2ZSBjaGFuZ2VkIGFuZCBuZWVkIHRvIGJlIHJlcmVuZGVyZWQuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqXG4gKiBUaGUgZm9sbG93aW5nIGV4YW1wbGVzIGRlbW9uc3RyYXRlIGhvdyB0byBtb2RpZnkgZGVmYXVsdCBjaGFuZ2UtZGV0ZWN0aW9uIGJlaGF2aW9yXG4gKiB0byBwZXJmb3JtIGV4cGxpY2l0IGRldGVjdGlvbiB3aGVuIG5lZWRlZC5cbiAqXG4gKiAjIyMgVXNlIGBtYXJrRm9yQ2hlY2soKWAgd2l0aCBgQ2hlY2tPbmNlYCBzdHJhdGVneVxuICpcbiAqIFRoZSBmb2xsb3dpbmcgZXhhbXBsZSBzZXRzIHRoZSBgT25QdXNoYCBjaGFuZ2UtZGV0ZWN0aW9uIHN0cmF0ZWd5IGZvciBhIGNvbXBvbmVudFxuICogKGBDaGVja09uY2VgLCByYXRoZXIgdGhhbiB0aGUgZGVmYXVsdCBgQ2hlY2tBbHdheXNgKSwgdGhlbiBmb3JjZXMgYSBzZWNvbmQgY2hlY2tcbiAqIGFmdGVyIGFuIGludGVydmFsLiBTZWUgW2xpdmUgZGVtb10oaHR0cDovL3BsbmtyLmNvL2VkaXQvR0M1MTJiP3A9cHJldmlldykuXG4gKlxuICogPGNvZGUtZXhhbXBsZSBwYXRoPVwiY29yZS90cy9jaGFuZ2VfZGV0ZWN0L2NoYW5nZS1kZXRlY3Rpb24udHNcIlxuICogcmVnaW9uPVwibWFyay1mb3ItY2hlY2tcIj48L2NvZGUtZXhhbXBsZT5cbiAqXG4gKiAjIyMgRGV0YWNoIGNoYW5nZSBkZXRlY3RvciB0byBsaW1pdCBob3cgb2Z0ZW4gY2hlY2sgb2NjdXJzXG4gKlxuICogVGhlIGZvbGxvd2luZyBleGFtcGxlIGRlZmluZXMgYSBjb21wb25lbnQgd2l0aCBhIGxhcmdlIGxpc3Qgb2YgcmVhZC1vbmx5IGRhdGFcbiAqIHRoYXQgaXMgZXhwZWN0ZWQgdG8gY2hhbmdlIGNvbnN0YW50bHksIG1hbnkgdGltZXMgcGVyIHNlY29uZC5cbiAqIFRvIGltcHJvdmUgcGVyZm9ybWFuY2UsIHdlIHdhbnQgdG8gY2hlY2sgYW5kIHVwZGF0ZSB0aGUgbGlzdFxuICogbGVzcyBvZnRlbiB0aGFuIHRoZSBjaGFuZ2VzIGFjdHVhbGx5IG9jY3VyLiBUbyBkbyB0aGF0LCB3ZSBkZXRhY2hcbiAqIHRoZSBjb21wb25lbnQncyBjaGFuZ2UgZGV0ZWN0b3IgYW5kIHBlcmZvcm0gYW4gZXhwbGljaXQgbG9jYWwgY2hlY2sgZXZlcnkgZml2ZSBzZWNvbmRzLlxuICpcbiAqIDxjb2RlLWV4YW1wbGUgcGF0aD1cImNvcmUvdHMvY2hhbmdlX2RldGVjdC9jaGFuZ2UtZGV0ZWN0aW9uLnRzXCIgcmVnaW9uPVwiZGV0YWNoXCI+PC9jb2RlLWV4YW1wbGU+XG4gKlxuICpcbiAqICMjIyBSZWF0dGFjaGluZyBhIGRldGFjaGVkIGNvbXBvbmVudFxuICpcbiAqIFRoZSBmb2xsb3dpbmcgZXhhbXBsZSBjcmVhdGVzIGEgY29tcG9uZW50IGRpc3BsYXlpbmcgbGl2ZSBkYXRhLlxuICogVGhlIGNvbXBvbmVudCBkZXRhY2hlcyBpdHMgY2hhbmdlIGRldGVjdG9yIGZyb20gdGhlIG1haW4gY2hhbmdlIGRldGVjdG9yIHRyZWVcbiAqIHdoZW4gdGhlIGBsaXZlYCBwcm9wZXJ0eSBpcyBzZXQgdG8gZmFsc2UsIGFuZCByZWF0dGFjaGVzIGl0IHdoZW4gdGhlIHByb3BlcnR5XG4gKiBiZWNvbWVzIHRydWUuXG4gKlxuICogPGNvZGUtZXhhbXBsZSBwYXRoPVwiY29yZS90cy9jaGFuZ2VfZGV0ZWN0L2NoYW5nZS1kZXRlY3Rpb24udHNcIiByZWdpb249XCJyZWF0dGFjaFwiPjwvY29kZS1leGFtcGxlPlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIENoYW5nZURldGVjdG9yUmVmIHtcbiAgLyoqXG4gICAqIFdoZW4gYSB2aWV3IHVzZXMgdGhlIHtAbGluayBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSNPblB1c2ggT25QdXNofSAoY2hlY2tPbmNlKVxuICAgKiBjaGFuZ2UgZGV0ZWN0aW9uIHN0cmF0ZWd5LCBleHBsaWNpdGx5IG1hcmtzIHRoZSB2aWV3IGFzIGNoYW5nZWQgc28gdGhhdFxuICAgKiBpdCBjYW4gYmUgY2hlY2tlZCBhZ2Fpbi5cbiAgICpcbiAgICogQ29tcG9uZW50cyBhcmUgbm9ybWFsbHkgbWFya2VkIGFzIGRpcnR5IChpbiBuZWVkIG9mIHJlcmVuZGVyaW5nKSB3aGVuIGlucHV0c1xuICAgKiBoYXZlIGNoYW5nZWQgb3IgZXZlbnRzIGhhdmUgZmlyZWQgaW4gdGhlIHZpZXcuIENhbGwgdGhpcyBtZXRob2QgdG8gZW5zdXJlIHRoYXRcbiAgICogYSBjb21wb25lbnQgaXMgY2hlY2tlZCBldmVuIGlmIHRoZXNlIHRyaWdnZXJzIGhhdmUgbm90IG9jY3VyZWQuXG4gICAqXG4gICAqIDwhLS0gVE9ETzogQWRkIGEgbGluayB0byBhIGNoYXB0ZXIgb24gT25QdXNoIGNvbXBvbmVudHMgLS0+XG4gICAqXG4gICAqL1xuICBhYnN0cmFjdCBtYXJrRm9yQ2hlY2soKTogdm9pZDtcblxuICAvKipcbiAgICogRGV0YWNoZXMgdGhpcyB2aWV3IGZyb20gdGhlIGNoYW5nZS1kZXRlY3Rpb24gdHJlZS5cbiAgICogQSBkZXRhY2hlZCB2aWV3IGlzICBub3QgY2hlY2tlZCB1bnRpbCBpdCBpcyByZWF0dGFjaGVkLlxuICAgKiBVc2UgaW4gY29tYmluYXRpb24gd2l0aCBgZGV0ZWN0Q2hhbmdlcygpYCB0byBpbXBsZW1lbnQgbG9jYWwgY2hhbmdlIGRldGVjdGlvbiBjaGVja3MuXG4gICAqXG4gICAqIERldGFjaGVkIHZpZXdzIGFyZSBub3QgY2hlY2tlZCBkdXJpbmcgY2hhbmdlIGRldGVjdGlvbiBydW5zIHVudGlsIHRoZXkgYXJlXG4gICAqIHJlLWF0dGFjaGVkLCBldmVuIGlmIHRoZXkgYXJlIG1hcmtlZCBhcyBkaXJ0eS5cbiAgICpcbiAgICogPCEtLSBUT0RPOiBBZGQgYSBsaW5rIHRvIGEgY2hhcHRlciBvbiBkZXRhY2gvcmVhdHRhY2gvbG9jYWwgZGlnZXN0IC0tPlxuICAgKiA8IS0tIFRPRE86IEFkZCBhIGxpdmUgZGVtbyBvbmNlIHJlZi5kZXRlY3RDaGFuZ2VzIGlzIG1lcmdlZCBpbnRvIG1hc3RlciAtLT5cbiAgICpcbiAgICovXG4gIGFic3RyYWN0IGRldGFjaCgpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBDaGVja3MgdGhpcyB2aWV3IGFuZCBpdHMgY2hpbGRyZW4uIFVzZSBpbiBjb21iaW5hdGlvbiB3aXRoIHtAbGluayBDaGFuZ2VEZXRlY3RvclJlZiNkZXRhY2hcbiAgICogZGV0YWNofVxuICAgKiB0byBpbXBsZW1lbnQgbG9jYWwgY2hhbmdlIGRldGVjdGlvbiBjaGVja3MuXG4gICAqXG4gICAqIDwhLS0gVE9ETzogQWRkIGEgbGluayB0byBhIGNoYXB0ZXIgb24gZGV0YWNoL3JlYXR0YWNoL2xvY2FsIGRpZ2VzdCAtLT5cbiAgICogPCEtLSBUT0RPOiBBZGQgYSBsaXZlIGRlbW8gb25jZSByZWYuZGV0ZWN0Q2hhbmdlcyBpcyBtZXJnZWQgaW50byBtYXN0ZXIgLS0+XG4gICAqXG4gICAqL1xuICBhYnN0cmFjdCBkZXRlY3RDaGFuZ2VzKCk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIENoZWNrcyB0aGUgY2hhbmdlIGRldGVjdG9yIGFuZCBpdHMgY2hpbGRyZW4sIGFuZCB0aHJvd3MgaWYgYW55IGNoYW5nZXMgYXJlIGRldGVjdGVkLlxuICAgKlxuICAgKiBVc2UgaW4gZGV2ZWxvcG1lbnQgbW9kZSB0byB2ZXJpZnkgdGhhdCBydW5uaW5nIGNoYW5nZSBkZXRlY3Rpb24gZG9lc24ndCBpbnRyb2R1Y2VcbiAgICogb3RoZXIgY2hhbmdlcy5cbiAgICovXG4gIGFic3RyYWN0IGNoZWNrTm9DaGFuZ2VzKCk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIFJlLWF0dGFjaGVzIHRoZSBwcmV2aW91c2x5IGRldGFjaGVkIHZpZXcgdG8gdGhlIGNoYW5nZSBkZXRlY3Rpb24gdHJlZS5cbiAgICogVmlld3MgYXJlIGF0dGFjaGVkIHRvIHRoZSB0cmVlIGJ5IGRlZmF1bHQuXG4gICAqXG4gICAqIDwhLS0gVE9ETzogQWRkIGEgbGluayB0byBhIGNoYXB0ZXIgb24gZGV0YWNoL3JlYXR0YWNoL2xvY2FsIGRpZ2VzdCAtLT5cbiAgICpcbiAgICovXG4gIGFic3RyYWN0IHJlYXR0YWNoKCk6IHZvaWQ7XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBzdGF0aWMgX19OR19FTEVNRU5UX0lEX186ICgpID0+IENoYW5nZURldGVjdG9yUmVmID0gKCkgPT4gUjNfQ0hBTkdFX0RFVEVDVE9SX1JFRl9GQUNUT1JZKCk7XG59XG4iXX0=
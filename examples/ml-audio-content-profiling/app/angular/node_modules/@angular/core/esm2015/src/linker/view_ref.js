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
import { ChangeDetectorRef } from '../change_detection/change_detector_ref';
/**
 * Represents an Angular [view](guide/glossary#view),
 * specifically the [host view](guide/glossary#view-tree) that is defined by a component.
 * Also serves as the base class
 * that adds destroy methods for [embedded views](guide/glossary#view-tree).
 *
 * @see `EmbeddedViewRef`
 *
 * \@publicApi
 * @abstract
 */
export class ViewRef extends ChangeDetectorRef {
}
if (false) {
    /**
     * Destroys this view and all of the data structures associated with it.
     * @abstract
     * @return {?}
     */
    ViewRef.prototype.destroy = function () { };
    /**
     * Reports whether this view has been destroyed.
     * @abstract
     * @return {?} True after the `destroy()` method has been called, false otherwise.
     */
    ViewRef.prototype.destroyed = function () { };
    /**
     * A lifecycle hook that provides additional developer-defined cleanup
     * functionality for views.
     * @abstract
     * @param {?} callback A handler function that cleans up developer-defined data
     * associated with a view. Called when the `destroy()` method is invoked.
     * @return {?}
     */
    ViewRef.prototype.onDestroy = function (callback) { };
}
/**
 * Represents an Angular [view](guide/glossary#view) in a view container.
 * An [embedded view](guide/glossary#view-tree) can be referenced from a component
 * other than the hosting component whose template defines it, or it can be defined
 * independently by a `TemplateRef`.
 *
 * Properties of elements in a view can change, but the structure (number and order) of elements in
 * a view cannot. Change the structure of elements by inserting, moving, or
 * removing nested views in a view container.
 *
 * @see `ViewContainerRef`
 *
 * \@usageNotes
 *
 * The following template breaks down into two separate `TemplateRef` instances,
 * an outer one and an inner one.
 *
 * ```
 * Count: {{items.length}}
 * <ul>
 *   <li *ngFor="let  item of items">{{item}}</li>
 * </ul>
 * ```
 *
 * This is the outer `TemplateRef`:
 *
 * ```
 * Count: {{items.length}}
 * <ul>
 *   <ng-template ngFor let-item [ngForOf]="items"></ng-template>
 * </ul>
 * ```
 *
 * This is the inner `TemplateRef`:
 *
 * ```
 *   <li>{{item}}</li>
 * ```
 *
 * The outer and inner `TemplateRef` instances are assembled into views as follows:
 *
 * ```
 * <!-- ViewRef: outer-0 -->
 * Count: 2
 * <ul>
 *   <ng-template view-container-ref></ng-template>
 *   <!-- ViewRef: inner-1 --><li>first</li><!-- /ViewRef: inner-1 -->
 *   <!-- ViewRef: inner-2 --><li>second</li><!-- /ViewRef: inner-2 -->
 * </ul>
 * <!-- /ViewRef: outer-0 -->
 * ```
 * \@publicApi
 * @abstract
 * @template C
 */
export class EmbeddedViewRef extends ViewRef {
}
if (false) {
    /**
     * The context for this view, inherited from the anchor element.
     * @abstract
     * @return {?}
     */
    EmbeddedViewRef.prototype.context = function () { };
    /**
     * The root nodes for this embedded view.
     * @abstract
     * @return {?}
     */
    EmbeddedViewRef.prototype.rootNodes = function () { };
}
/**
 * @record
 */
export function InternalViewRef() { }
/** @type {?} */
InternalViewRef.prototype.detachFromAppRef;
/** @type {?} */
InternalViewRef.prototype.attachToAppRef;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld19yZWYuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9saW5rZXIvdmlld19yZWYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFTQSxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSx5Q0FBeUMsQ0FBQzs7Ozs7Ozs7Ozs7O0FBWTFFLE1BQU0sT0FBZ0IsT0FBUSxTQUFRLGlCQUFpQjtDQW1CdEQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF1REQsTUFBTSxPQUFnQixlQUFtQixTQUFRLE9BQU87Q0FVdkQiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QXBwbGljYXRpb25SZWZ9IGZyb20gJy4uL2FwcGxpY2F0aW9uX3JlZic7XG5pbXBvcnQge0NoYW5nZURldGVjdG9yUmVmfSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uL2NoYW5nZV9kZXRlY3Rvcl9yZWYnO1xuXG4vKipcbiAqIFJlcHJlc2VudHMgYW4gQW5ndWxhciBbdmlld10oZ3VpZGUvZ2xvc3NhcnkjdmlldyksXG4gKiBzcGVjaWZpY2FsbHkgdGhlIFtob3N0IHZpZXddKGd1aWRlL2dsb3NzYXJ5I3ZpZXctdHJlZSkgdGhhdCBpcyBkZWZpbmVkIGJ5IGEgY29tcG9uZW50LlxuICogQWxzbyBzZXJ2ZXMgYXMgdGhlIGJhc2UgY2xhc3NcbiAqIHRoYXQgYWRkcyBkZXN0cm95IG1ldGhvZHMgZm9yIFtlbWJlZGRlZCB2aWV3c10oZ3VpZGUvZ2xvc3Nhcnkjdmlldy10cmVlKS5cbiAqXG4gKiBAc2VlIGBFbWJlZGRlZFZpZXdSZWZgXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgVmlld1JlZiBleHRlbmRzIENoYW5nZURldGVjdG9yUmVmIHtcbiAgLyoqXG4gICAqIERlc3Ryb3lzIHRoaXMgdmlldyBhbmQgYWxsIG9mIHRoZSBkYXRhIHN0cnVjdHVyZXMgYXNzb2NpYXRlZCB3aXRoIGl0LlxuICAgKi9cbiAgYWJzdHJhY3QgZGVzdHJveSgpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBSZXBvcnRzIHdoZXRoZXIgdGhpcyB2aWV3IGhhcyBiZWVuIGRlc3Ryb3llZC5cbiAgICogQHJldHVybnMgVHJ1ZSBhZnRlciB0aGUgYGRlc3Ryb3koKWAgbWV0aG9kIGhhcyBiZWVuIGNhbGxlZCwgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgKi9cbiAgYWJzdHJhY3QgZ2V0IGRlc3Ryb3llZCgpOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBBIGxpZmVjeWNsZSBob29rIHRoYXQgcHJvdmlkZXMgYWRkaXRpb25hbCBkZXZlbG9wZXItZGVmaW5lZCBjbGVhbnVwXG4gICAqIGZ1bmN0aW9uYWxpdHkgZm9yIHZpZXdzLlxuICAgKiBAcGFyYW0gY2FsbGJhY2sgQSBoYW5kbGVyIGZ1bmN0aW9uIHRoYXQgY2xlYW5zIHVwIGRldmVsb3Blci1kZWZpbmVkIGRhdGFcbiAgICogYXNzb2NpYXRlZCB3aXRoIGEgdmlldy4gQ2FsbGVkIHdoZW4gdGhlIGBkZXN0cm95KClgIG1ldGhvZCBpcyBpbnZva2VkLlxuICAgKi9cbiAgYWJzdHJhY3Qgb25EZXN0cm95KGNhbGxiYWNrOiBGdW5jdGlvbik6IGFueSAvKiogVE9ETyAjOTEwMCAqLztcbn1cblxuLyoqXG4gKiBSZXByZXNlbnRzIGFuIEFuZ3VsYXIgW3ZpZXddKGd1aWRlL2dsb3NzYXJ5I3ZpZXcpIGluIGEgdmlldyBjb250YWluZXIuXG4gKiBBbiBbZW1iZWRkZWQgdmlld10oZ3VpZGUvZ2xvc3Nhcnkjdmlldy10cmVlKSBjYW4gYmUgcmVmZXJlbmNlZCBmcm9tIGEgY29tcG9uZW50XG4gKiBvdGhlciB0aGFuIHRoZSBob3N0aW5nIGNvbXBvbmVudCB3aG9zZSB0ZW1wbGF0ZSBkZWZpbmVzIGl0LCBvciBpdCBjYW4gYmUgZGVmaW5lZFxuICogaW5kZXBlbmRlbnRseSBieSBhIGBUZW1wbGF0ZVJlZmAuXG4gKlxuICogUHJvcGVydGllcyBvZiBlbGVtZW50cyBpbiBhIHZpZXcgY2FuIGNoYW5nZSwgYnV0IHRoZSBzdHJ1Y3R1cmUgKG51bWJlciBhbmQgb3JkZXIpIG9mIGVsZW1lbnRzIGluXG4gKiBhIHZpZXcgY2Fubm90LiBDaGFuZ2UgdGhlIHN0cnVjdHVyZSBvZiBlbGVtZW50cyBieSBpbnNlcnRpbmcsIG1vdmluZywgb3JcbiAqIHJlbW92aW5nIG5lc3RlZCB2aWV3cyBpbiBhIHZpZXcgY29udGFpbmVyLlxuICpcbiAqIEBzZWUgYFZpZXdDb250YWluZXJSZWZgXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqXG4gKiBUaGUgZm9sbG93aW5nIHRlbXBsYXRlIGJyZWFrcyBkb3duIGludG8gdHdvIHNlcGFyYXRlIGBUZW1wbGF0ZVJlZmAgaW5zdGFuY2VzLFxuICogYW4gb3V0ZXIgb25lIGFuZCBhbiBpbm5lciBvbmUuXG4gKlxuICogYGBgXG4gKiBDb3VudDoge3tpdGVtcy5sZW5ndGh9fVxuICogPHVsPlxuICogICA8bGkgKm5nRm9yPVwibGV0ICBpdGVtIG9mIGl0ZW1zXCI+e3tpdGVtfX08L2xpPlxuICogPC91bD5cbiAqIGBgYFxuICpcbiAqIFRoaXMgaXMgdGhlIG91dGVyIGBUZW1wbGF0ZVJlZmA6XG4gKlxuICogYGBgXG4gKiBDb3VudDoge3tpdGVtcy5sZW5ndGh9fVxuICogPHVsPlxuICogICA8bmctdGVtcGxhdGUgbmdGb3IgbGV0LWl0ZW0gW25nRm9yT2ZdPVwiaXRlbXNcIj48L25nLXRlbXBsYXRlPlxuICogPC91bD5cbiAqIGBgYFxuICpcbiAqIFRoaXMgaXMgdGhlIGlubmVyIGBUZW1wbGF0ZVJlZmA6XG4gKlxuICogYGBgXG4gKiAgIDxsaT57e2l0ZW19fTwvbGk+XG4gKiBgYGBcbiAqXG4gKiBUaGUgb3V0ZXIgYW5kIGlubmVyIGBUZW1wbGF0ZVJlZmAgaW5zdGFuY2VzIGFyZSBhc3NlbWJsZWQgaW50byB2aWV3cyBhcyBmb2xsb3dzOlxuICpcbiAqIGBgYFxuICogPCEtLSBWaWV3UmVmOiBvdXRlci0wIC0tPlxuICogQ291bnQ6IDJcbiAqIDx1bD5cbiAqICAgPG5nLXRlbXBsYXRlIHZpZXctY29udGFpbmVyLXJlZj48L25nLXRlbXBsYXRlPlxuICogICA8IS0tIFZpZXdSZWY6IGlubmVyLTEgLS0+PGxpPmZpcnN0PC9saT48IS0tIC9WaWV3UmVmOiBpbm5lci0xIC0tPlxuICogICA8IS0tIFZpZXdSZWY6IGlubmVyLTIgLS0+PGxpPnNlY29uZDwvbGk+PCEtLSAvVmlld1JlZjogaW5uZXItMiAtLT5cbiAqIDwvdWw+XG4gKiA8IS0tIC9WaWV3UmVmOiBvdXRlci0wIC0tPlxuICogYGBgXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBFbWJlZGRlZFZpZXdSZWY8Qz4gZXh0ZW5kcyBWaWV3UmVmIHtcbiAgLyoqXG4gICAqIFRoZSBjb250ZXh0IGZvciB0aGlzIHZpZXcsIGluaGVyaXRlZCBmcm9tIHRoZSBhbmNob3IgZWxlbWVudC5cbiAgICovXG4gIGFic3RyYWN0IGdldCBjb250ZXh0KCk6IEM7XG5cbiAgLyoqXG4gICAqIFRoZSByb290IG5vZGVzIGZvciB0aGlzIGVtYmVkZGVkIHZpZXcuXG4gICAqL1xuICBhYnN0cmFjdCBnZXQgcm9vdE5vZGVzKCk6IGFueVtdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEludGVybmFsVmlld1JlZiBleHRlbmRzIFZpZXdSZWYge1xuICBkZXRhY2hGcm9tQXBwUmVmKCk6IHZvaWQ7XG4gIGF0dGFjaFRvQXBwUmVmKGFwcFJlZjogQXBwbGljYXRpb25SZWYpOiB2b2lkO1xufVxuIl19
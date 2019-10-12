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
import { R3_TEMPLATE_REF_FACTORY } from '../ivy_switch/runtime/index';
import { ElementRef } from './element_ref';
/**
 * Represents an embedded template that can be used to instantiate embedded views.
 * To instantiate embedded views based on a template, use the `ViewContainerRef`
 * method `createEmbeddedView()`.
 *
 * Access a `TemplateRef` instance by placing a directive on an `<ng-template>`
 * element (or directive prefixed with `*`). The `TemplateRef` for the embedded view
 * is injected into the constructor of the directive,
 * using the `TemplateRef` token.
 *
 * You can also use a `Query` to find a `TemplateRef` associated with
 * a component or a directive.
 *
 * @see `ViewContainerRef`
 * @see [Navigate the Component Tree with DI](guide/dependency-injection-navtree)
 *
 * \@publicApi
 * @abstract
 * @template C
 */
export class TemplateRef {
}
/**
 * \@internal
 */
TemplateRef.__NG_ELEMENT_ID__ = () => R3_TEMPLATE_REF_FACTORY(TemplateRef, ElementRef);
if (false) {
    /**
     * \@internal
     * @type {?}
     */
    TemplateRef.__NG_ELEMENT_ID__;
    /**
     * The anchor element in the parent view for this embedded view.
     *
     * The data-binding and injection contexts of embedded views created from this `TemplateRef`
     * inherit from the contexts of this location.
     *
     * Typically new embedded views are attached to the view container of this location, but in
     * advanced use-cases, the view can be attached to a different container while keeping the
     * data-binding and injection context from the original location.
     *
     * @abstract
     * @return {?}
     */
    TemplateRef.prototype.elementRef = function () { };
    /**
     * Creates a view object and attaches it to the view container of the parent view.
     * @abstract
     * @param {?} context The context for the new view, inherited from the anchor element.
     * @return {?} The new view object.
     */
    TemplateRef.prototype.createEmbeddedView = function (context) { };
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGVfcmVmLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvbGlua2VyL3RlbXBsYXRlX3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyx1QkFBdUIsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBRXBFLE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxlQUFlLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXNCekMsTUFBTSxPQUFnQixXQUFXOzs7OztBQXVCL0IsZ0NBQzZCLEdBQUcsRUFBRSxDQUFDLHVCQUF1QixDQUFDLFdBQVcsRUFBRSxVQUFVLENBQUMsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSM19URU1QTEFURV9SRUZfRkFDVE9SWX0gZnJvbSAnLi4vaXZ5X3N3aXRjaC9ydW50aW1lL2luZGV4JztcblxuaW1wb3J0IHtFbGVtZW50UmVmfSBmcm9tICcuL2VsZW1lbnRfcmVmJztcbmltcG9ydCB7RW1iZWRkZWRWaWV3UmVmfSBmcm9tICcuL3ZpZXdfcmVmJztcblxuXG4vKipcbiAqIFJlcHJlc2VudHMgYW4gZW1iZWRkZWQgdGVtcGxhdGUgdGhhdCBjYW4gYmUgdXNlZCB0byBpbnN0YW50aWF0ZSBlbWJlZGRlZCB2aWV3cy5cbiAqIFRvIGluc3RhbnRpYXRlIGVtYmVkZGVkIHZpZXdzIGJhc2VkIG9uIGEgdGVtcGxhdGUsIHVzZSB0aGUgYFZpZXdDb250YWluZXJSZWZgXG4gKiBtZXRob2QgYGNyZWF0ZUVtYmVkZGVkVmlldygpYC5cbiAqXG4gKiBBY2Nlc3MgYSBgVGVtcGxhdGVSZWZgIGluc3RhbmNlIGJ5IHBsYWNpbmcgYSBkaXJlY3RpdmUgb24gYW4gYDxuZy10ZW1wbGF0ZT5gXG4gKiBlbGVtZW50IChvciBkaXJlY3RpdmUgcHJlZml4ZWQgd2l0aCBgKmApLiBUaGUgYFRlbXBsYXRlUmVmYCBmb3IgdGhlIGVtYmVkZGVkIHZpZXdcbiAqIGlzIGluamVjdGVkIGludG8gdGhlIGNvbnN0cnVjdG9yIG9mIHRoZSBkaXJlY3RpdmUsXG4gKiB1c2luZyB0aGUgYFRlbXBsYXRlUmVmYCB0b2tlbi5cbiAqXG4gKiBZb3UgY2FuIGFsc28gdXNlIGEgYFF1ZXJ5YCB0byBmaW5kIGEgYFRlbXBsYXRlUmVmYCBhc3NvY2lhdGVkIHdpdGhcbiAqIGEgY29tcG9uZW50IG9yIGEgZGlyZWN0aXZlLlxuICpcbiAqIEBzZWUgYFZpZXdDb250YWluZXJSZWZgXG4gKiBAc2VlIFtOYXZpZ2F0ZSB0aGUgQ29tcG9uZW50IFRyZWUgd2l0aCBESV0oZ3VpZGUvZGVwZW5kZW5jeS1pbmplY3Rpb24tbmF2dHJlZSlcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBUZW1wbGF0ZVJlZjxDPiB7XG4gIC8qKlxuICAgKiBUaGUgYW5jaG9yIGVsZW1lbnQgaW4gdGhlIHBhcmVudCB2aWV3IGZvciB0aGlzIGVtYmVkZGVkIHZpZXcuXG4gICAqXG4gICAqIFRoZSBkYXRhLWJpbmRpbmcgYW5kIGluamVjdGlvbiBjb250ZXh0cyBvZiBlbWJlZGRlZCB2aWV3cyBjcmVhdGVkIGZyb20gdGhpcyBgVGVtcGxhdGVSZWZgXG4gICAqIGluaGVyaXQgZnJvbSB0aGUgY29udGV4dHMgb2YgdGhpcyBsb2NhdGlvbi5cbiAgICpcbiAgICogVHlwaWNhbGx5IG5ldyBlbWJlZGRlZCB2aWV3cyBhcmUgYXR0YWNoZWQgdG8gdGhlIHZpZXcgY29udGFpbmVyIG9mIHRoaXMgbG9jYXRpb24sIGJ1dCBpblxuICAgKiBhZHZhbmNlZCB1c2UtY2FzZXMsIHRoZSB2aWV3IGNhbiBiZSBhdHRhY2hlZCB0byBhIGRpZmZlcmVudCBjb250YWluZXIgd2hpbGUga2VlcGluZyB0aGVcbiAgICogZGF0YS1iaW5kaW5nIGFuZCBpbmplY3Rpb24gY29udGV4dCBmcm9tIHRoZSBvcmlnaW5hbCBsb2NhdGlvbi5cbiAgICpcbiAgICovXG4gIC8vIFRPRE8oaSk6IHJlbmFtZSB0byBhbmNob3Igb3IgbG9jYXRpb25cbiAgYWJzdHJhY3QgZ2V0IGVsZW1lbnRSZWYoKTogRWxlbWVudFJlZjtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHZpZXcgb2JqZWN0IGFuZCBhdHRhY2hlcyBpdCB0byB0aGUgdmlldyBjb250YWluZXIgb2YgdGhlIHBhcmVudCB2aWV3LlxuICAgKiBAcGFyYW0gY29udGV4dCBUaGUgY29udGV4dCBmb3IgdGhlIG5ldyB2aWV3LCBpbmhlcml0ZWQgZnJvbSB0aGUgYW5jaG9yIGVsZW1lbnQuXG4gICAqIEByZXR1cm5zIFRoZSBuZXcgdmlldyBvYmplY3QuXG4gICAqL1xuICBhYnN0cmFjdCBjcmVhdGVFbWJlZGRlZFZpZXcoY29udGV4dDogQyk6IEVtYmVkZGVkVmlld1JlZjxDPjtcblxuICAvKiogQGludGVybmFsICovXG4gIHN0YXRpYyBfX05HX0VMRU1FTlRfSURfXzpcbiAgICAgICgpID0+IFRlbXBsYXRlUmVmPGFueT4gPSAoKSA9PiBSM19URU1QTEFURV9SRUZfRkFDVE9SWShUZW1wbGF0ZVJlZiwgRWxlbWVudFJlZilcbn1cbiJdfQ==
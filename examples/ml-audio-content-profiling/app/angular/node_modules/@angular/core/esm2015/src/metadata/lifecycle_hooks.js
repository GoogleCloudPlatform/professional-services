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
/**
 * Defines an object that associates properties with
 * instances of `SimpleChange`.
 *
 * @see `OnChanges`
 *
 * \@publicApi
 * @record
 */
export function SimpleChanges() { }
/**
 * \@description
 * A lifecycle hook that is called when any data-bound property of a directive changes.
 * Define an `ngOnChanges()` method to handle the changes.
 *
 * @see `DoCheck`
 * @see `OnInit`
 * @see [Lifecycle Hooks](guide/lifecycle-hooks#onchanges) guide
 *
 * \@usageNotes
 * The following snippet shows how a component can implement this interface to
 * define an on-changes handler for an input property.
 *
 * {\@example core/ts/metadata/lifecycle_hooks_spec.ts region='OnChanges'}
 *
 * \@publicApi
 * @record
 */
export function OnChanges() { }
/**
 * A callback method that is invoked immediately after the
 * default change detector has checked data-bound properties
 * if at least one has changed, and before the view and content
 * children are checked.
 * \@param changes The changed properties.
 * @type {?}
 */
OnChanges.prototype.ngOnChanges;
/**
 * \@description
 * A lifecycle hook that is called after Angular has initialized
 * all data-bound properties of a directive.
 * Define an `ngOnInit()` method to handle any additional initialization tasks.
 *
 * @see `AfterContentInit`
 * @see [Lifecycle Hooks](guide/lifecycle-hooks#onchanges) guide
 *
 * \@usageNotes
 * The following snippet shows how a component can implement this interface to
 * define its own initialization method.
 *
 * {\@example core/ts/metadata/lifecycle_hooks_spec.ts region='OnInit'}
 *
 * \@publicApi
 * @record
 */
export function OnInit() { }
/**
 * A callback method that is invoked immediately after the
 * default change detector has checked the directive's
 * data-bound properties for the first time,
 * and before any of the view or content children have been checked.
 * It is invoked only once when the directive is instantiated.
 * @type {?}
 */
OnInit.prototype.ngOnInit;
/**
 * A lifecycle hook that invokes a custom change-detection function for a directive,
 * in addition to the check performed by the default change-detector.
 *
 * The default change-detection algorithm looks for differences by comparing
 * bound-property values by reference across change detection runs. You can use this
 * hook to check for and respond to changes by some other means.
 *
 * When the default change detector detects changes, it invokes `ngOnChanges()` if supplied,
 * regardless of whether you perform additional change detection.
 * Typically, you should not use both `DoCheck` and `OnChanges` to respond to
 * changes on the same input.
 *
 * @see `OnChanges`
 * @see [Lifecycle Hooks](guide/lifecycle-hooks#onchanges) guide
 *
 * \@usageNotes
 * The following snippet shows how a component can implement this interface
 * to invoke it own change-detection cycle.
 *
 * {\@example core/ts/metadata/lifecycle_hooks_spec.ts region='DoCheck'}
 *
 * \@publicApi
 * @record
 */
export function DoCheck() { }
/**
 * A callback method that performs change-detection, invoked
 * after the default change-detector runs.
 * See `KeyValueDiffers` and `IterableDiffers` for implementing
 * custom change checking for collections.
 *
 * @type {?}
 */
DoCheck.prototype.ngDoCheck;
/**
 * A lifecycle hook that is called when a directive, pipe, or service is destroyed.
 * Use for any custom cleanup that needs to occur when the
 * instance is destroyed.
 * @see [Lifecycle Hooks](guide/lifecycle-hooks#onchanges) guide
 *
 * \@usageNotes
 * The following snippet shows how a component can implement this interface
 * to define its own custom clean-up method.
 *
 * {\@example core/ts/metadata/lifecycle_hooks_spec.ts region='OnDestroy'}
 *
 * \@publicApi
 * @record
 */
export function OnDestroy() { }
/**
 * A callback method that performs custom clean-up, invoked immediately
 * after a directive, pipe, or service instance is destroyed.
 * @type {?}
 */
OnDestroy.prototype.ngOnDestroy;
/**
 * \@description
 * A lifecycle hook that is called after Angular has fully initialized
 * all content of a directive.
 * Define an `ngAfterContentInit()` method to handle any additional initialization tasks.
 *
 * @see `OnInit`
 * @see `AfterViewInit`
 * @see [Lifecycle Hooks](guide/lifecycle-hooks#onchanges) guide
 *
 * \@usageNotes
 * The following snippet shows how a component can implement this interface to
 * define its own content initialization method.
 *
 * {\@example core/ts/metadata/lifecycle_hooks_spec.ts region='AfterContentInit'}
 *
 * \@publicApi
 * @record
 */
export function AfterContentInit() { }
/**
 * A callback method that is invoked immediately after
 * Angular has completed initialization of all of the directive's
 * content.
 * It is invoked only once when the directive is instantiated.
 * @type {?}
 */
AfterContentInit.prototype.ngAfterContentInit;
/**
 * \@description
 * A lifecycle hook that is called after the default change detector has
 * completed checking all content of a directive.
 *
 * @see `AfterViewChecked`
 * @see [Lifecycle Hooks](guide/lifecycle-hooks#onchanges) guide
 *
 * \@usageNotes
 * The following snippet shows how a component can implement this interface to
 * define its own after-check functionality.
 *
 * {\@example core/ts/metadata/lifecycle_hooks_spec.ts region='AfterContentChecked'}
 *
 * \@publicApi
 * @record
 */
export function AfterContentChecked() { }
/**
 * A callback method that is invoked immediately after the
 * default change detector has completed checking all of the directive's
 * content.
 * @type {?}
 */
AfterContentChecked.prototype.ngAfterContentChecked;
/**
 * \@description
 * A lifecycle hook that is called after Angular has fully initialized
 * a component's view.
 * Define an `ngAfterViewInit()` method to handle any additional initialization tasks.
 *
 * @see `OnInit`
 * @see `AfterContentInit`
 * @see [Lifecycle Hooks](guide/lifecycle-hooks#onchanges) guide
 *
 * \@usageNotes
 * The following snippet shows how a component can implement this interface to
 * define its own view initialization method.
 *
 * {\@example core/ts/metadata/lifecycle_hooks_spec.ts region='AfterViewInit'}
 *
 * \@publicApi
 * @record
 */
export function AfterViewInit() { }
/**
 * A callback method that is invoked immediately after
 * Angular has completed initialization of a component's view.
 * It is invoked only once when the view is instantiated.
 *
 * @type {?}
 */
AfterViewInit.prototype.ngAfterViewInit;
/**
 * \@description
 * A lifecycle hook that is called after the default change detector has
 * completed checking a component's view for changes.
 *
 * @see `AfterContentChecked`
 * @see [Lifecycle Hooks](guide/lifecycle-hooks#onchanges) guide
 *
 * \@usageNotes
 * The following snippet shows how a component can implement this interface to
 * define its own after-check functionality.
 *
 * {\@example core/ts/metadata/lifecycle_hooks_spec.ts region='AfterViewChecked'}
 *
 * \@publicApi
 * @record
 */
export function AfterViewChecked() { }
/**
 * A callback method that is invoked immediately after the
 * default change detector has completed one change-check cycle
 * for a component's view.
 * @type {?}
 */
AfterViewChecked.prototype.ngAfterViewChecked;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlmZWN5Y2xlX2hvb2tzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvbWV0YWRhdGEvbGlmZWN5Y2xlX2hvb2tzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7U2ltcGxlQ2hhbmdlfSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uL2NoYW5nZV9kZXRlY3Rpb25fdXRpbCc7XG5cblxuLyoqXG4gKiBEZWZpbmVzIGFuIG9iamVjdCB0aGF0IGFzc29jaWF0ZXMgcHJvcGVydGllcyB3aXRoXG4gKiBpbnN0YW5jZXMgb2YgYFNpbXBsZUNoYW5nZWAuXG4gKlxuICogQHNlZSBgT25DaGFuZ2VzYFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTaW1wbGVDaGFuZ2VzIHsgW3Byb3BOYW1lOiBzdHJpbmddOiBTaW1wbGVDaGFuZ2U7IH1cblxuLyoqXG4gKiBAZGVzY3JpcHRpb25cbiAqIEEgbGlmZWN5Y2xlIGhvb2sgdGhhdCBpcyBjYWxsZWQgd2hlbiBhbnkgZGF0YS1ib3VuZCBwcm9wZXJ0eSBvZiBhIGRpcmVjdGl2ZSBjaGFuZ2VzLlxuICogRGVmaW5lIGFuIGBuZ09uQ2hhbmdlcygpYCBtZXRob2QgdG8gaGFuZGxlIHRoZSBjaGFuZ2VzLlxuICpcbiAqIEBzZWUgYERvQ2hlY2tgXG4gKiBAc2VlIGBPbkluaXRgXG4gKiBAc2VlIFtMaWZlY3ljbGUgSG9va3NdKGd1aWRlL2xpZmVjeWNsZS1ob29rcyNvbmNoYW5nZXMpIGd1aWRlXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqIFRoZSBmb2xsb3dpbmcgc25pcHBldCBzaG93cyBob3cgYSBjb21wb25lbnQgY2FuIGltcGxlbWVudCB0aGlzIGludGVyZmFjZSB0b1xuICogZGVmaW5lIGFuIG9uLWNoYW5nZXMgaGFuZGxlciBmb3IgYW4gaW5wdXQgcHJvcGVydHkuXG4gKlxuICoge0BleGFtcGxlIGNvcmUvdHMvbWV0YWRhdGEvbGlmZWN5Y2xlX2hvb2tzX3NwZWMudHMgcmVnaW9uPSdPbkNoYW5nZXMnfVxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBPbkNoYW5nZXMge1xuICAvKipcbiAgICogQSBjYWxsYmFjayBtZXRob2QgdGhhdCBpcyBpbnZva2VkIGltbWVkaWF0ZWx5IGFmdGVyIHRoZVxuICAgKiBkZWZhdWx0IGNoYW5nZSBkZXRlY3RvciBoYXMgY2hlY2tlZCBkYXRhLWJvdW5kIHByb3BlcnRpZXNcbiAgICogaWYgYXQgbGVhc3Qgb25lIGhhcyBjaGFuZ2VkLCBhbmQgYmVmb3JlIHRoZSB2aWV3IGFuZCBjb250ZW50XG4gICAqIGNoaWxkcmVuIGFyZSBjaGVja2VkLlxuICAgKiBAcGFyYW0gY2hhbmdlcyBUaGUgY2hhbmdlZCBwcm9wZXJ0aWVzLlxuICAgKi9cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQ7XG59XG5cbi8qKlxuICogQGRlc2NyaXB0aW9uXG4gKiBBIGxpZmVjeWNsZSBob29rIHRoYXQgaXMgY2FsbGVkIGFmdGVyIEFuZ3VsYXIgaGFzIGluaXRpYWxpemVkXG4gKiBhbGwgZGF0YS1ib3VuZCBwcm9wZXJ0aWVzIG9mIGEgZGlyZWN0aXZlLlxuICogRGVmaW5lIGFuIGBuZ09uSW5pdCgpYCBtZXRob2QgdG8gaGFuZGxlIGFueSBhZGRpdGlvbmFsIGluaXRpYWxpemF0aW9uIHRhc2tzLlxuICpcbiAqIEBzZWUgYEFmdGVyQ29udGVudEluaXRgXG4gKiBAc2VlIFtMaWZlY3ljbGUgSG9va3NdKGd1aWRlL2xpZmVjeWNsZS1ob29rcyNvbmNoYW5nZXMpIGd1aWRlXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqIFRoZSBmb2xsb3dpbmcgc25pcHBldCBzaG93cyBob3cgYSBjb21wb25lbnQgY2FuIGltcGxlbWVudCB0aGlzIGludGVyZmFjZSB0b1xuICogZGVmaW5lIGl0cyBvd24gaW5pdGlhbGl6YXRpb24gbWV0aG9kLlxuICpcbiAqIHtAZXhhbXBsZSBjb3JlL3RzL21ldGFkYXRhL2xpZmVjeWNsZV9ob29rc19zcGVjLnRzIHJlZ2lvbj0nT25Jbml0J31cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgT25Jbml0IHtcbiAgLyoqXG4gICAqIEEgY2FsbGJhY2sgbWV0aG9kIHRoYXQgaXMgaW52b2tlZCBpbW1lZGlhdGVseSBhZnRlciB0aGVcbiAgICogZGVmYXVsdCBjaGFuZ2UgZGV0ZWN0b3IgaGFzIGNoZWNrZWQgdGhlIGRpcmVjdGl2ZSdzXG4gICAqIGRhdGEtYm91bmQgcHJvcGVydGllcyBmb3IgdGhlIGZpcnN0IHRpbWUsXG4gICAqIGFuZCBiZWZvcmUgYW55IG9mIHRoZSB2aWV3IG9yIGNvbnRlbnQgY2hpbGRyZW4gaGF2ZSBiZWVuIGNoZWNrZWQuXG4gICAqIEl0IGlzIGludm9rZWQgb25seSBvbmNlIHdoZW4gdGhlIGRpcmVjdGl2ZSBpcyBpbnN0YW50aWF0ZWQuXG4gICAqL1xuICBuZ09uSW5pdCgpOiB2b2lkO1xufVxuXG4vKipcbiAqIEEgbGlmZWN5Y2xlIGhvb2sgdGhhdCBpbnZva2VzIGEgY3VzdG9tIGNoYW5nZS1kZXRlY3Rpb24gZnVuY3Rpb24gZm9yIGEgZGlyZWN0aXZlLFxuICogaW4gYWRkaXRpb24gdG8gdGhlIGNoZWNrIHBlcmZvcm1lZCBieSB0aGUgZGVmYXVsdCBjaGFuZ2UtZGV0ZWN0b3IuXG4gKlxuICogVGhlIGRlZmF1bHQgY2hhbmdlLWRldGVjdGlvbiBhbGdvcml0aG0gbG9va3MgZm9yIGRpZmZlcmVuY2VzIGJ5IGNvbXBhcmluZ1xuICogYm91bmQtcHJvcGVydHkgdmFsdWVzIGJ5IHJlZmVyZW5jZSBhY3Jvc3MgY2hhbmdlIGRldGVjdGlvbiBydW5zLiBZb3UgY2FuIHVzZSB0aGlzXG4gKiBob29rIHRvIGNoZWNrIGZvciBhbmQgcmVzcG9uZCB0byBjaGFuZ2VzIGJ5IHNvbWUgb3RoZXIgbWVhbnMuXG4gKlxuICogV2hlbiB0aGUgZGVmYXVsdCBjaGFuZ2UgZGV0ZWN0b3IgZGV0ZWN0cyBjaGFuZ2VzLCBpdCBpbnZva2VzIGBuZ09uQ2hhbmdlcygpYCBpZiBzdXBwbGllZCxcbiAqIHJlZ2FyZGxlc3Mgb2Ygd2hldGhlciB5b3UgcGVyZm9ybSBhZGRpdGlvbmFsIGNoYW5nZSBkZXRlY3Rpb24uXG4gKiBUeXBpY2FsbHksIHlvdSBzaG91bGQgbm90IHVzZSBib3RoIGBEb0NoZWNrYCBhbmQgYE9uQ2hhbmdlc2AgdG8gcmVzcG9uZCB0b1xuICogY2hhbmdlcyBvbiB0aGUgc2FtZSBpbnB1dC5cbiAqXG4gKiBAc2VlIGBPbkNoYW5nZXNgXG4gKiBAc2VlIFtMaWZlY3ljbGUgSG9va3NdKGd1aWRlL2xpZmVjeWNsZS1ob29rcyNvbmNoYW5nZXMpIGd1aWRlXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqIFRoZSBmb2xsb3dpbmcgc25pcHBldCBzaG93cyBob3cgYSBjb21wb25lbnQgY2FuIGltcGxlbWVudCB0aGlzIGludGVyZmFjZVxuICogdG8gaW52b2tlIGl0IG93biBjaGFuZ2UtZGV0ZWN0aW9uIGN5Y2xlLlxuICpcbiAqIHtAZXhhbXBsZSBjb3JlL3RzL21ldGFkYXRhL2xpZmVjeWNsZV9ob29rc19zcGVjLnRzIHJlZ2lvbj0nRG9DaGVjayd9XG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIERvQ2hlY2sge1xuICAvKipcbiAgICAgKiBBIGNhbGxiYWNrIG1ldGhvZCB0aGF0IHBlcmZvcm1zIGNoYW5nZS1kZXRlY3Rpb24sIGludm9rZWRcbiAgICAgKiBhZnRlciB0aGUgZGVmYXVsdCBjaGFuZ2UtZGV0ZWN0b3IgcnVucy5cbiAgICAgKiBTZWUgYEtleVZhbHVlRGlmZmVyc2AgYW5kIGBJdGVyYWJsZURpZmZlcnNgIGZvciBpbXBsZW1lbnRpbmdcbiAgICAgKiBjdXN0b20gY2hhbmdlIGNoZWNraW5nIGZvciBjb2xsZWN0aW9ucy5cbiAgICAgKlxuICAgICAqL1xuICBuZ0RvQ2hlY2soKTogdm9pZDtcbn1cblxuLyoqXG4gKiBBIGxpZmVjeWNsZSBob29rIHRoYXQgaXMgY2FsbGVkIHdoZW4gYSBkaXJlY3RpdmUsIHBpcGUsIG9yIHNlcnZpY2UgaXMgZGVzdHJveWVkLlxuICogVXNlIGZvciBhbnkgY3VzdG9tIGNsZWFudXAgdGhhdCBuZWVkcyB0byBvY2N1ciB3aGVuIHRoZVxuICogaW5zdGFuY2UgaXMgZGVzdHJveWVkLlxuICogQHNlZSBbTGlmZWN5Y2xlIEhvb2tzXShndWlkZS9saWZlY3ljbGUtaG9va3Mjb25jaGFuZ2VzKSBndWlkZVxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKiBUaGUgZm9sbG93aW5nIHNuaXBwZXQgc2hvd3MgaG93IGEgY29tcG9uZW50IGNhbiBpbXBsZW1lbnQgdGhpcyBpbnRlcmZhY2VcbiAqIHRvIGRlZmluZSBpdHMgb3duIGN1c3RvbSBjbGVhbi11cCBtZXRob2QuXG4gKlxuICoge0BleGFtcGxlIGNvcmUvdHMvbWV0YWRhdGEvbGlmZWN5Y2xlX2hvb2tzX3NwZWMudHMgcmVnaW9uPSdPbkRlc3Ryb3knfVxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBPbkRlc3Ryb3kge1xuICAvKipcbiAgICogQSBjYWxsYmFjayBtZXRob2QgdGhhdCBwZXJmb3JtcyBjdXN0b20gY2xlYW4tdXAsIGludm9rZWQgaW1tZWRpYXRlbHlcbiAgICogYWZ0ZXIgYSBkaXJlY3RpdmUsIHBpcGUsIG9yIHNlcnZpY2UgaW5zdGFuY2UgaXMgZGVzdHJveWVkLlxuICAgKi9cbiAgbmdPbkRlc3Ryb3koKTogdm9pZDtcbn1cblxuLyoqXG4gKiBAZGVzY3JpcHRpb25cbiAqIEEgbGlmZWN5Y2xlIGhvb2sgdGhhdCBpcyBjYWxsZWQgYWZ0ZXIgQW5ndWxhciBoYXMgZnVsbHkgaW5pdGlhbGl6ZWRcbiAqIGFsbCBjb250ZW50IG9mIGEgZGlyZWN0aXZlLlxuICogRGVmaW5lIGFuIGBuZ0FmdGVyQ29udGVudEluaXQoKWAgbWV0aG9kIHRvIGhhbmRsZSBhbnkgYWRkaXRpb25hbCBpbml0aWFsaXphdGlvbiB0YXNrcy5cbiAqXG4gKiBAc2VlIGBPbkluaXRgXG4gKiBAc2VlIGBBZnRlclZpZXdJbml0YFxuICogQHNlZSBbTGlmZWN5Y2xlIEhvb2tzXShndWlkZS9saWZlY3ljbGUtaG9va3Mjb25jaGFuZ2VzKSBndWlkZVxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKiBUaGUgZm9sbG93aW5nIHNuaXBwZXQgc2hvd3MgaG93IGEgY29tcG9uZW50IGNhbiBpbXBsZW1lbnQgdGhpcyBpbnRlcmZhY2UgdG9cbiAqIGRlZmluZSBpdHMgb3duIGNvbnRlbnQgaW5pdGlhbGl6YXRpb24gbWV0aG9kLlxuICpcbiAqIHtAZXhhbXBsZSBjb3JlL3RzL21ldGFkYXRhL2xpZmVjeWNsZV9ob29rc19zcGVjLnRzIHJlZ2lvbj0nQWZ0ZXJDb250ZW50SW5pdCd9XG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIEFmdGVyQ29udGVudEluaXQge1xuICAvKipcbiAgICogQSBjYWxsYmFjayBtZXRob2QgdGhhdCBpcyBpbnZva2VkIGltbWVkaWF0ZWx5IGFmdGVyXG4gICAqIEFuZ3VsYXIgaGFzIGNvbXBsZXRlZCBpbml0aWFsaXphdGlvbiBvZiBhbGwgb2YgdGhlIGRpcmVjdGl2ZSdzXG4gICAqIGNvbnRlbnQuXG4gICAqIEl0IGlzIGludm9rZWQgb25seSBvbmNlIHdoZW4gdGhlIGRpcmVjdGl2ZSBpcyBpbnN0YW50aWF0ZWQuXG4gICAqL1xuICBuZ0FmdGVyQ29udGVudEluaXQoKTogdm9pZDtcbn1cblxuLyoqXG4gKiBAZGVzY3JpcHRpb25cbiAqIEEgbGlmZWN5Y2xlIGhvb2sgdGhhdCBpcyBjYWxsZWQgYWZ0ZXIgdGhlIGRlZmF1bHQgY2hhbmdlIGRldGVjdG9yIGhhc1xuICogY29tcGxldGVkIGNoZWNraW5nIGFsbCBjb250ZW50IG9mIGEgZGlyZWN0aXZlLlxuICpcbiAqIEBzZWUgYEFmdGVyVmlld0NoZWNrZWRgXG4gKiBAc2VlIFtMaWZlY3ljbGUgSG9va3NdKGd1aWRlL2xpZmVjeWNsZS1ob29rcyNvbmNoYW5nZXMpIGd1aWRlXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqIFRoZSBmb2xsb3dpbmcgc25pcHBldCBzaG93cyBob3cgYSBjb21wb25lbnQgY2FuIGltcGxlbWVudCB0aGlzIGludGVyZmFjZSB0b1xuICogZGVmaW5lIGl0cyBvd24gYWZ0ZXItY2hlY2sgZnVuY3Rpb25hbGl0eS5cbiAqXG4gKiB7QGV4YW1wbGUgY29yZS90cy9tZXRhZGF0YS9saWZlY3ljbGVfaG9va3Nfc3BlYy50cyByZWdpb249J0FmdGVyQ29udGVudENoZWNrZWQnfVxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBBZnRlckNvbnRlbnRDaGVja2VkIHtcbiAgLyoqXG4gICAqIEEgY2FsbGJhY2sgbWV0aG9kIHRoYXQgaXMgaW52b2tlZCBpbW1lZGlhdGVseSBhZnRlciB0aGVcbiAgICogZGVmYXVsdCBjaGFuZ2UgZGV0ZWN0b3IgaGFzIGNvbXBsZXRlZCBjaGVja2luZyBhbGwgb2YgdGhlIGRpcmVjdGl2ZSdzXG4gICAqIGNvbnRlbnQuXG4gICAqL1xuICBuZ0FmdGVyQ29udGVudENoZWNrZWQoKTogdm9pZDtcbn1cblxuLyoqXG4gKiBAZGVzY3JpcHRpb25cbiAqIEEgbGlmZWN5Y2xlIGhvb2sgdGhhdCBpcyBjYWxsZWQgYWZ0ZXIgQW5ndWxhciBoYXMgZnVsbHkgaW5pdGlhbGl6ZWRcbiAqIGEgY29tcG9uZW50J3Mgdmlldy5cbiAqIERlZmluZSBhbiBgbmdBZnRlclZpZXdJbml0KClgIG1ldGhvZCB0byBoYW5kbGUgYW55IGFkZGl0aW9uYWwgaW5pdGlhbGl6YXRpb24gdGFza3MuXG4gKlxuICogQHNlZSBgT25Jbml0YFxuICogQHNlZSBgQWZ0ZXJDb250ZW50SW5pdGBcbiAqIEBzZWUgW0xpZmVjeWNsZSBIb29rc10oZ3VpZGUvbGlmZWN5Y2xlLWhvb2tzI29uY2hhbmdlcykgZ3VpZGVcbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogVGhlIGZvbGxvd2luZyBzbmlwcGV0IHNob3dzIGhvdyBhIGNvbXBvbmVudCBjYW4gaW1wbGVtZW50IHRoaXMgaW50ZXJmYWNlIHRvXG4gKiBkZWZpbmUgaXRzIG93biB2aWV3IGluaXRpYWxpemF0aW9uIG1ldGhvZC5cbiAqXG4gKiB7QGV4YW1wbGUgY29yZS90cy9tZXRhZGF0YS9saWZlY3ljbGVfaG9va3Nfc3BlYy50cyByZWdpb249J0FmdGVyVmlld0luaXQnfVxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBBZnRlclZpZXdJbml0IHtcbiAgLyoqXG4gICAqIEEgY2FsbGJhY2sgbWV0aG9kIHRoYXQgaXMgaW52b2tlZCBpbW1lZGlhdGVseSBhZnRlclxuICAgKiBBbmd1bGFyIGhhcyBjb21wbGV0ZWQgaW5pdGlhbGl6YXRpb24gb2YgYSBjb21wb25lbnQncyB2aWV3LlxuICAgKiBJdCBpcyBpbnZva2VkIG9ubHkgb25jZSB3aGVuIHRoZSB2aWV3IGlzIGluc3RhbnRpYXRlZC5cbiAgICpcbiAgICovXG4gIG5nQWZ0ZXJWaWV3SW5pdCgpOiB2b2lkO1xufVxuXG4vKipcbiAqIEBkZXNjcmlwdGlvblxuICogQSBsaWZlY3ljbGUgaG9vayB0aGF0IGlzIGNhbGxlZCBhZnRlciB0aGUgZGVmYXVsdCBjaGFuZ2UgZGV0ZWN0b3IgaGFzXG4gKiBjb21wbGV0ZWQgY2hlY2tpbmcgYSBjb21wb25lbnQncyB2aWV3IGZvciBjaGFuZ2VzLlxuICpcbiAqIEBzZWUgYEFmdGVyQ29udGVudENoZWNrZWRgXG4gKiBAc2VlIFtMaWZlY3ljbGUgSG9va3NdKGd1aWRlL2xpZmVjeWNsZS1ob29rcyNvbmNoYW5nZXMpIGd1aWRlXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqIFRoZSBmb2xsb3dpbmcgc25pcHBldCBzaG93cyBob3cgYSBjb21wb25lbnQgY2FuIGltcGxlbWVudCB0aGlzIGludGVyZmFjZSB0b1xuICogZGVmaW5lIGl0cyBvd24gYWZ0ZXItY2hlY2sgZnVuY3Rpb25hbGl0eS5cbiAqXG4gKiB7QGV4YW1wbGUgY29yZS90cy9tZXRhZGF0YS9saWZlY3ljbGVfaG9va3Nfc3BlYy50cyByZWdpb249J0FmdGVyVmlld0NoZWNrZWQnfVxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBBZnRlclZpZXdDaGVja2VkIHtcbiAgLyoqXG4gICAqIEEgY2FsbGJhY2sgbWV0aG9kIHRoYXQgaXMgaW52b2tlZCBpbW1lZGlhdGVseSBhZnRlciB0aGVcbiAgICogZGVmYXVsdCBjaGFuZ2UgZGV0ZWN0b3IgaGFzIGNvbXBsZXRlZCBvbmUgY2hhbmdlLWNoZWNrIGN5Y2xlXG4gICAqIGZvciBhIGNvbXBvbmVudCdzIHZpZXcuXG4gICAqL1xuICBuZ0FmdGVyVmlld0NoZWNrZWQoKTogdm9pZDtcbn1cbiJdfQ==
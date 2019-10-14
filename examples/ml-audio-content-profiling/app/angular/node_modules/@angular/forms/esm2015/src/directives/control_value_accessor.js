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
import { InjectionToken } from '@angular/core';
/**
 * \@description
 * Defines an interface that acts as a bridge between the Angular forms API and a
 * native element in the DOM.
 *
 * Implement this interface to create a custom form control directive
 * that integrates with Angular forms.
 *
 * @see DefaultValueAccessor
 *
 * \@publicApi
 * @record
 */
export function ControlValueAccessor() { }
/**
 * \@description
 * Writes a new value to the element.
 *
 * This method is called by the forms API to write to the view when programmatic
 * changes from model to view are requested.
 *
 * \@usageNotes
 * ### Write a value to the element
 *
 * The following example writes a value to the native DOM element.
 *
 * ```ts
 * writeValue(value: any): void {
 *   this._renderer.setProperty(this._elementRef.nativeElement, 'value', value);
 * }
 * ```
 *
 * \@param obj The new value for the element
 * @type {?}
 */
ControlValueAccessor.prototype.writeValue;
/**
 * \@description
 * Registers a callback function that is called when the control's value
 * changes in the UI.
 *
 * This method is called by the forms API on initialization to update the form
 * model when values propagate from the view to the model.
 *
 * When implementing the `registerOnChange` method in your own value accessor,
 * save the given function so your class calls it at the appropriate time.
 *
 * \@usageNotes
 * ### Store the change function
 *
 * The following example stores the provided function as an internal method.
 *
 * ```ts
 * registerOnChange(fn: (_: any) => void): void {
 *   this._onChange = fn;
 * }
 * ```
 *
 * When the value changes in the UI, call the registered
 * function to allow the forms API to update itself:
 *
 * ```ts
 * host: {
 *    (change): '_onChange($event.target.value)'
 * }
 * ```
 *
 * \@param fn The callback function to register
 * @type {?}
 */
ControlValueAccessor.prototype.registerOnChange;
/**
 * \@description
 * Registers a callback function is called by the forms API on initialization
 * to update the form model on blur.
 *
 * When implementing `registerOnTouched` in your own value accessor, save the given
 * function so your class calls it when the control should be considered
 * blurred or "touched".
 *
 * \@usageNotes
 * ### Store the callback function
 *
 * The following example stores the provided function as an internal method.
 *
 * ```ts
 * registerOnTouched(fn: any): void {
 *   this._onTouched = fn;
 * }
 * ```
 *
 * On blur (or equivalent), your class should call the registered function to allow
 * the forms API to update itself:
 *
 * ```ts
 * host: {
 *    '(blur)': '_onTouched()'
 * }
 * ```
 *
 * \@param fn The callback function to register
 * @type {?}
 */
ControlValueAccessor.prototype.registerOnTouched;
/**
 * \@description
 * Function that is called by the forms API when the control status changes to
 * or from 'DISABLED'. Depending on the status, it enables or disables the
 * appropriate DOM element.
 *
 * \@usageNotes
 * The following is an example of writing the disabled property to a native DOM element:
 *
 * ```ts
 * setDisabledState(isDisabled: boolean): void {
 *   this._renderer.setProperty(this._elementRef.nativeElement, 'disabled', isDisabled);
 * }
 * ```
 *
 * \@param isDisabled The disabled status to set on the element
 * @type {?|undefined}
 */
ControlValueAccessor.prototype.setDisabledState;
/** *
 * Used to provide a `ControlValueAccessor` for form controls.
 *
 * See `DefaultValueAccessor` for how to implement one.
 *
 * \@publicApi
  @type {?} */
export const NG_VALUE_ACCESSOR = new InjectionToken('NgValueAccessor');

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udHJvbF92YWx1ZV9hY2Nlc3Nvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2Zvcm1zL3NyYy9kaXJlY3RpdmVzL2NvbnRyb2xfdmFsdWVfYWNjZXNzb3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW9JN0MsYUFBYSxpQkFBaUIsR0FBRyxJQUFJLGNBQWMsQ0FBdUIsaUJBQWlCLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3Rpb25Ub2tlbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbi8qKlxuICogQGRlc2NyaXB0aW9uXG4gKiBEZWZpbmVzIGFuIGludGVyZmFjZSB0aGF0IGFjdHMgYXMgYSBicmlkZ2UgYmV0d2VlbiB0aGUgQW5ndWxhciBmb3JtcyBBUEkgYW5kIGFcbiAqIG5hdGl2ZSBlbGVtZW50IGluIHRoZSBET00uXG4gKlxuICogSW1wbGVtZW50IHRoaXMgaW50ZXJmYWNlIHRvIGNyZWF0ZSBhIGN1c3RvbSBmb3JtIGNvbnRyb2wgZGlyZWN0aXZlXG4gKiB0aGF0IGludGVncmF0ZXMgd2l0aCBBbmd1bGFyIGZvcm1zLlxuICpcbiAqIEBzZWUgRGVmYXVsdFZhbHVlQWNjZXNzb3JcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ29udHJvbFZhbHVlQWNjZXNzb3Ige1xuICAvKipcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIFdyaXRlcyBhIG5ldyB2YWx1ZSB0byB0aGUgZWxlbWVudC5cbiAgICpcbiAgICogVGhpcyBtZXRob2QgaXMgY2FsbGVkIGJ5IHRoZSBmb3JtcyBBUEkgdG8gd3JpdGUgdG8gdGhlIHZpZXcgd2hlbiBwcm9ncmFtbWF0aWNcbiAgICogY2hhbmdlcyBmcm9tIG1vZGVsIHRvIHZpZXcgYXJlIHJlcXVlc3RlZC5cbiAgICpcbiAgICogQHVzYWdlTm90ZXNcbiAgICogIyMjIFdyaXRlIGEgdmFsdWUgdG8gdGhlIGVsZW1lbnRcbiAgICpcbiAgICogVGhlIGZvbGxvd2luZyBleGFtcGxlIHdyaXRlcyBhIHZhbHVlIHRvIHRoZSBuYXRpdmUgRE9NIGVsZW1lbnQuXG4gICAqXG4gICAqIGBgYHRzXG4gICAqIHdyaXRlVmFsdWUodmFsdWU6IGFueSk6IHZvaWQge1xuICAgKiAgIHRoaXMuX3JlbmRlcmVyLnNldFByb3BlcnR5KHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudCwgJ3ZhbHVlJywgdmFsdWUpO1xuICAgKiB9XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0gb2JqIFRoZSBuZXcgdmFsdWUgZm9yIHRoZSBlbGVtZW50XG4gICAqL1xuICB3cml0ZVZhbHVlKG9iajogYW55KTogdm9pZDtcblxuICAvKipcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIFJlZ2lzdGVycyBhIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHdoZW4gdGhlIGNvbnRyb2wncyB2YWx1ZVxuICAgKiBjaGFuZ2VzIGluIHRoZSBVSS5cbiAgICpcbiAgICogVGhpcyBtZXRob2QgaXMgY2FsbGVkIGJ5IHRoZSBmb3JtcyBBUEkgb24gaW5pdGlhbGl6YXRpb24gdG8gdXBkYXRlIHRoZSBmb3JtXG4gICAqIG1vZGVsIHdoZW4gdmFsdWVzIHByb3BhZ2F0ZSBmcm9tIHRoZSB2aWV3IHRvIHRoZSBtb2RlbC5cbiAgICpcbiAgICogV2hlbiBpbXBsZW1lbnRpbmcgdGhlIGByZWdpc3Rlck9uQ2hhbmdlYCBtZXRob2QgaW4geW91ciBvd24gdmFsdWUgYWNjZXNzb3IsXG4gICAqIHNhdmUgdGhlIGdpdmVuIGZ1bmN0aW9uIHNvIHlvdXIgY2xhc3MgY2FsbHMgaXQgYXQgdGhlIGFwcHJvcHJpYXRlIHRpbWUuXG4gICAqXG4gICAqIEB1c2FnZU5vdGVzXG4gICAqICMjIyBTdG9yZSB0aGUgY2hhbmdlIGZ1bmN0aW9uXG4gICAqXG4gICAqIFRoZSBmb2xsb3dpbmcgZXhhbXBsZSBzdG9yZXMgdGhlIHByb3ZpZGVkIGZ1bmN0aW9uIGFzIGFuIGludGVybmFsIG1ldGhvZC5cbiAgICpcbiAgICogYGBgdHNcbiAgICogcmVnaXN0ZXJPbkNoYW5nZShmbjogKF86IGFueSkgPT4gdm9pZCk6IHZvaWQge1xuICAgKiAgIHRoaXMuX29uQ2hhbmdlID0gZm47XG4gICAqIH1cbiAgICogYGBgXG4gICAqXG4gICAqIFdoZW4gdGhlIHZhbHVlIGNoYW5nZXMgaW4gdGhlIFVJLCBjYWxsIHRoZSByZWdpc3RlcmVkXG4gICAqIGZ1bmN0aW9uIHRvIGFsbG93IHRoZSBmb3JtcyBBUEkgdG8gdXBkYXRlIGl0c2VsZjpcbiAgICpcbiAgICogYGBgdHNcbiAgICogaG9zdDoge1xuICAgKiAgICAoY2hhbmdlKTogJ19vbkNoYW5nZSgkZXZlbnQudGFyZ2V0LnZhbHVlKSdcbiAgICogfVxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIGZuIFRoZSBjYWxsYmFjayBmdW5jdGlvbiB0byByZWdpc3RlclxuICAgKi9cbiAgcmVnaXN0ZXJPbkNoYW5nZShmbjogYW55KTogdm9pZDtcblxuICAvKipcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIFJlZ2lzdGVycyBhIGNhbGxiYWNrIGZ1bmN0aW9uIGlzIGNhbGxlZCBieSB0aGUgZm9ybXMgQVBJIG9uIGluaXRpYWxpemF0aW9uXG4gICAqIHRvIHVwZGF0ZSB0aGUgZm9ybSBtb2RlbCBvbiBibHVyLlxuICAgKlxuICAgKiBXaGVuIGltcGxlbWVudGluZyBgcmVnaXN0ZXJPblRvdWNoZWRgIGluIHlvdXIgb3duIHZhbHVlIGFjY2Vzc29yLCBzYXZlIHRoZSBnaXZlblxuICAgKiBmdW5jdGlvbiBzbyB5b3VyIGNsYXNzIGNhbGxzIGl0IHdoZW4gdGhlIGNvbnRyb2wgc2hvdWxkIGJlIGNvbnNpZGVyZWRcbiAgICogYmx1cnJlZCBvciBcInRvdWNoZWRcIi5cbiAgICpcbiAgICogQHVzYWdlTm90ZXNcbiAgICogIyMjIFN0b3JlIHRoZSBjYWxsYmFjayBmdW5jdGlvblxuICAgKlxuICAgKiBUaGUgZm9sbG93aW5nIGV4YW1wbGUgc3RvcmVzIHRoZSBwcm92aWRlZCBmdW5jdGlvbiBhcyBhbiBpbnRlcm5hbCBtZXRob2QuXG4gICAqXG4gICAqIGBgYHRzXG4gICAqIHJlZ2lzdGVyT25Ub3VjaGVkKGZuOiBhbnkpOiB2b2lkIHtcbiAgICogICB0aGlzLl9vblRvdWNoZWQgPSBmbjtcbiAgICogfVxuICAgKiBgYGBcbiAgICpcbiAgICogT24gYmx1ciAob3IgZXF1aXZhbGVudCksIHlvdXIgY2xhc3Mgc2hvdWxkIGNhbGwgdGhlIHJlZ2lzdGVyZWQgZnVuY3Rpb24gdG8gYWxsb3dcbiAgICogdGhlIGZvcm1zIEFQSSB0byB1cGRhdGUgaXRzZWxmOlxuICAgKlxuICAgKiBgYGB0c1xuICAgKiBob3N0OiB7XG4gICAqICAgICcoYmx1ciknOiAnX29uVG91Y2hlZCgpJ1xuICAgKiB9XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0gZm4gVGhlIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIHJlZ2lzdGVyXG4gICAqL1xuICByZWdpc3Rlck9uVG91Y2hlZChmbjogYW55KTogdm9pZDtcblxuICAvKipcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIEZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIGJ5IHRoZSBmb3JtcyBBUEkgd2hlbiB0aGUgY29udHJvbCBzdGF0dXMgY2hhbmdlcyB0b1xuICAgKiBvciBmcm9tICdESVNBQkxFRCcuIERlcGVuZGluZyBvbiB0aGUgc3RhdHVzLCBpdCBlbmFibGVzIG9yIGRpc2FibGVzIHRoZVxuICAgKiBhcHByb3ByaWF0ZSBET00gZWxlbWVudC5cbiAgICpcbiAgICogQHVzYWdlTm90ZXNcbiAgICogVGhlIGZvbGxvd2luZyBpcyBhbiBleGFtcGxlIG9mIHdyaXRpbmcgdGhlIGRpc2FibGVkIHByb3BlcnR5IHRvIGEgbmF0aXZlIERPTSBlbGVtZW50OlxuICAgKlxuICAgKiBgYGB0c1xuICAgKiBzZXREaXNhYmxlZFN0YXRlKGlzRGlzYWJsZWQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICogICB0aGlzLl9yZW5kZXJlci5zZXRQcm9wZXJ0eSh0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQsICdkaXNhYmxlZCcsIGlzRGlzYWJsZWQpO1xuICAgKiB9XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0gaXNEaXNhYmxlZCBUaGUgZGlzYWJsZWQgc3RhdHVzIHRvIHNldCBvbiB0aGUgZWxlbWVudFxuICAgKi9cbiAgc2V0RGlzYWJsZWRTdGF0ZT8oaXNEaXNhYmxlZDogYm9vbGVhbik6IHZvaWQ7XG59XG5cbi8qKlxuICogVXNlZCB0byBwcm92aWRlIGEgYENvbnRyb2xWYWx1ZUFjY2Vzc29yYCBmb3IgZm9ybSBjb250cm9scy5cbiAqXG4gKiBTZWUgYERlZmF1bHRWYWx1ZUFjY2Vzc29yYCBmb3IgaG93IHRvIGltcGxlbWVudCBvbmUuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgTkdfVkFMVUVfQUNDRVNTT1IgPSBuZXcgSW5qZWN0aW9uVG9rZW48Q29udHJvbFZhbHVlQWNjZXNzb3I+KCdOZ1ZhbHVlQWNjZXNzb3InKTtcbiJdfQ==
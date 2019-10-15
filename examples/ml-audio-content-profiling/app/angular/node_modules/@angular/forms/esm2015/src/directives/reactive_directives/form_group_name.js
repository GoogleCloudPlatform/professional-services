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
import { Directive, Host, Inject, Input, Optional, Self, SkipSelf, forwardRef } from '@angular/core';
import { NG_ASYNC_VALIDATORS, NG_VALIDATORS } from '../../validators';
import { AbstractFormGroupDirective } from '../abstract_form_group_directive';
import { ControlContainer } from '../control_container';
import { ReactiveErrors } from '../reactive_errors';
import { composeAsyncValidators, composeValidators, controlPath } from '../shared';
import { FormGroupDirective } from './form_group_directive';
/** @type {?} */
export const formGroupNameProvider = {
    provide: ControlContainer,
    useExisting: forwardRef(() => FormGroupName)
};
/**
 * \@description
 *
 * Syncs a nested `FormGroup` to a DOM element.
 *
 * This directive can only be used with a parent `FormGroupDirective`.
 *
 * It accepts the string name of the nested `FormGroup` to link, and
 * looks for a `FormGroup` registered with that name in the parent
 * `FormGroup` instance you passed into `FormGroupDirective`.
 *
 * Use nested form groups to validate a sub-group of a
 * form separately from the rest or to group the values of certain
 * controls into their own nested object.
 *
 * @see [Reactive Forms Guide](guide/reactive-forms)
 *
 * \@usageNotes
 *
 * ### Access the group by name
 *
 * The following example uses the {\@link AbstractControl#get get} method to access the
 * associated `FormGroup`
 *
 * ```ts
 *   this.form.get('name');
 * ```
 *
 * ### Access individual controls in the group
 *
 * The following example uses the {\@link AbstractControl#get get} method to access
 * individual controls within the group using dot syntax.
 *
 * ```ts
 *   this.form.get('name.first');
 * ```
 *
 * ### Register a nested `FormGroup`.
 *
 * The following example registers a nested *name* `FormGroup` within an existing `FormGroup`,
 * and provides methods to retrieve the nested `FormGroup` and individual controls.
 *
 * {\@example forms/ts/nestedFormGroup/nested_form_group_example.ts region='Component'}
 *
 * \@ngModule ReactiveFormsModule
 * \@publicApi
 */
export class FormGroupName extends AbstractFormGroupDirective {
    /**
     * @param {?} parent
     * @param {?} validators
     * @param {?} asyncValidators
     */
    constructor(parent, validators, asyncValidators) {
        super();
        this._parent = parent;
        this._validators = validators;
        this._asyncValidators = asyncValidators;
    }
    /**
     * \@internal
     * @return {?}
     */
    _checkParentType() {
        if (_hasInvalidParent(this._parent)) {
            ReactiveErrors.groupParentException();
        }
    }
}
FormGroupName.decorators = [
    { type: Directive, args: [{ selector: '[formGroupName]', providers: [formGroupNameProvider] },] }
];
/** @nocollapse */
FormGroupName.ctorParameters = () => [
    { type: ControlContainer, decorators: [{ type: Optional }, { type: Host }, { type: SkipSelf }] },
    { type: Array, decorators: [{ type: Optional }, { type: Self }, { type: Inject, args: [NG_VALIDATORS,] }] },
    { type: Array, decorators: [{ type: Optional }, { type: Self }, { type: Inject, args: [NG_ASYNC_VALIDATORS,] }] }
];
FormGroupName.propDecorators = {
    name: [{ type: Input, args: ['formGroupName',] }]
};
if (false) {
    /**
     * \@description
     * Tracks the name of the `FormGroup` bound to the directive. The name corresponds
     * to a key in the parent `FormGroup` or `FormArray`.
     * @type {?}
     */
    FormGroupName.prototype.name;
}
/** @type {?} */
export const formArrayNameProvider = {
    provide: ControlContainer,
    useExisting: forwardRef(() => FormArrayName)
};
/**
 * \@description
 *
 * Syncs a nested `FormArray` to a DOM element.
 *
 * This directive is designed to be used with a parent `FormGroupDirective` (selector:
 * `[formGroup]`).
 *
 * It accepts the string name of the nested `FormArray` you want to link, and
 * will look for a `FormArray` registered with that name in the parent
 * `FormGroup` instance you passed into `FormGroupDirective`.
 *
 * @see [Reactive Forms Guide](guide/reactive-forms)
 * @see `AbstractControl`
 *
 * \@usageNotes
 *
 * ### Example
 *
 * {\@example forms/ts/nestedFormArray/nested_form_array_example.ts region='Component'}
 *
 * \@ngModule ReactiveFormsModule
 * \@publicApi
 */
export class FormArrayName extends ControlContainer {
    /**
     * @param {?} parent
     * @param {?} validators
     * @param {?} asyncValidators
     */
    constructor(parent, validators, asyncValidators) {
        super();
        this._parent = parent;
        this._validators = validators;
        this._asyncValidators = asyncValidators;
    }
    /**
     * \@description
     * A lifecycle method called when the directive's inputs are initialized. For internal use only.
     *
     * @throws If the directive does not have a valid parent.
     * @return {?}
     */
    ngOnInit() {
        this._checkParentType(); /** @type {?} */
        ((this.formDirective)).addFormArray(this);
    }
    /**
     * \@description
     * A lifecycle method called before the directive's instance is destroyed. For internal use only.
     * @return {?}
     */
    ngOnDestroy() {
        if (this.formDirective) {
            this.formDirective.removeFormArray(this);
        }
    }
    /**
     * \@description
     * The `FormArray` bound to this directive.
     * @return {?}
     */
    get control() { return /** @type {?} */ ((this.formDirective)).getFormArray(this); }
    /**
     * \@description
     * The top-level directive for this group if present, otherwise null.
     * @return {?}
     */
    get formDirective() {
        return this._parent ? /** @type {?} */ (this._parent.formDirective) : null;
    }
    /**
     * \@description
     * Returns an array that represents the path from the top-level form to this control.
     * Each index is the string name of the control on that level.
     * @return {?}
     */
    get path() { return controlPath(this.name, this._parent); }
    /**
     * \@description
     * Synchronous validator function composed of all the synchronous validators registered with this
     * directive.
     * @return {?}
     */
    get validator() { return composeValidators(this._validators); }
    /**
     * \@description
     * Async validator function composed of all the async validators registered with this directive.
     * @return {?}
     */
    get asyncValidator() {
        return composeAsyncValidators(this._asyncValidators);
    }
    /**
     * @return {?}
     */
    _checkParentType() {
        if (_hasInvalidParent(this._parent)) {
            ReactiveErrors.arrayParentException();
        }
    }
}
FormArrayName.decorators = [
    { type: Directive, args: [{ selector: '[formArrayName]', providers: [formArrayNameProvider] },] }
];
/** @nocollapse */
FormArrayName.ctorParameters = () => [
    { type: ControlContainer, decorators: [{ type: Optional }, { type: Host }, { type: SkipSelf }] },
    { type: Array, decorators: [{ type: Optional }, { type: Self }, { type: Inject, args: [NG_VALIDATORS,] }] },
    { type: Array, decorators: [{ type: Optional }, { type: Self }, { type: Inject, args: [NG_ASYNC_VALIDATORS,] }] }
];
FormArrayName.propDecorators = {
    name: [{ type: Input, args: ['formArrayName',] }]
};
if (false) {
    /**
     * \@internal
     * @type {?}
     */
    FormArrayName.prototype._parent;
    /**
     * \@internal
     * @type {?}
     */
    FormArrayName.prototype._validators;
    /**
     * \@internal
     * @type {?}
     */
    FormArrayName.prototype._asyncValidators;
    /**
     * \@description
     * Tracks the name of the `FormArray` bound to the directive. The name corresponds
     * to a key in the parent `FormGroup` or `FormArray`.
     * @type {?}
     */
    FormArrayName.prototype.name;
}
/**
 * @param {?} parent
 * @return {?}
 */
function _hasInvalidParent(parent) {
    return !(parent instanceof FormGroupName) && !(parent instanceof FormGroupDirective) &&
        !(parent instanceof FormArrayName);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ybV9ncm91cF9uYW1lLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvZm9ybXMvc3JjL2RpcmVjdGl2ZXMvcmVhY3RpdmVfZGlyZWN0aXZlcy9mb3JtX2dyb3VwX25hbWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFxQixRQUFRLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFHdEgsT0FBTyxFQUFDLG1CQUFtQixFQUFFLGFBQWEsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQ3BFLE9BQU8sRUFBQywwQkFBMEIsRUFBQyxNQUFNLGtDQUFrQyxDQUFDO0FBQzVFLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3RELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUNsRCxPQUFPLEVBQUMsc0JBQXNCLEVBQUUsaUJBQWlCLEVBQUUsV0FBVyxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBR2pGLE9BQU8sRUFBQyxrQkFBa0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDOztBQUUxRCxhQUFhLHFCQUFxQixHQUFRO0lBQ3hDLE9BQU8sRUFBRSxnQkFBZ0I7SUFDekIsV0FBVyxFQUFFLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxhQUFhLENBQUM7Q0FDN0MsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0RGLE1BQU0sT0FBTyxhQUFjLFNBQVEsMEJBQTBCOzs7Ozs7SUFTM0QsWUFDb0MsTUFBd0IsRUFDYixVQUFpQixFQUNYLGVBQXNCO1FBQ3pFLEtBQUssRUFBRSxDQUFDO1FBQ1IsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7UUFDdEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7UUFDOUIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLGVBQWUsQ0FBQztLQUN6Qzs7Ozs7SUFHRCxnQkFBZ0I7UUFDZCxJQUFJLGlCQUFpQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRTtZQUNuQyxjQUFjLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztTQUN2QztLQUNGOzs7WUF6QkYsU0FBUyxTQUFDLEVBQUMsUUFBUSxFQUFFLGlCQUFpQixFQUFFLFNBQVMsRUFBRSxDQUFDLHFCQUFxQixDQUFDLEVBQUM7Ozs7WUEzRHBFLGdCQUFnQix1QkFzRWpCLFFBQVEsWUFBSSxJQUFJLFlBQUksUUFBUTt3Q0FDNUIsUUFBUSxZQUFJLElBQUksWUFBSSxNQUFNLFNBQUMsYUFBYTt3Q0FDeEMsUUFBUSxZQUFJLElBQUksWUFBSSxNQUFNLFNBQUMsbUJBQW1COzs7bUJBTGxELEtBQUssU0FBQyxlQUFlOzs7Ozs7Ozs7Ozs7QUFvQnhCLGFBQWEscUJBQXFCLEdBQVE7SUFDeEMsT0FBTyxFQUFFLGdCQUFnQjtJQUN6QixXQUFXLEVBQUUsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLGFBQWEsQ0FBQztDQUM3QyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBMkJGLE1BQU0sT0FBTyxhQUFjLFNBQVEsZ0JBQWdCOzs7Ozs7SUFrQmpELFlBQ29DLE1BQXdCLEVBQ2IsVUFBaUIsRUFDWCxlQUFzQjtRQUN6RSxLQUFLLEVBQUUsQ0FBQztRQUNSLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO1FBQ3RCLElBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDO1FBQzlCLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxlQUFlLENBQUM7S0FDekM7Ozs7Ozs7O0lBUUQsUUFBUTtRQUNOLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1VBQ3hCLElBQUksQ0FBQyxhQUFhLEdBQUcsWUFBWSxDQUFDLElBQUk7S0FDdkM7Ozs7OztJQU1ELFdBQVc7UUFDVCxJQUFJLElBQUksQ0FBQyxhQUFhLEVBQUU7WUFDdEIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDMUM7S0FDRjs7Ozs7O0lBTUQsSUFBSSxPQUFPLEtBQWdCLDBCQUFPLElBQUksQ0FBQyxhQUFhLEdBQUcsWUFBWSxDQUFDLElBQUksRUFBRSxFQUFFOzs7Ozs7SUFNNUUsSUFBSSxhQUFhO1FBQ2YsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsbUJBQXFCLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7S0FDN0U7Ozs7Ozs7SUFPRCxJQUFJLElBQUksS0FBZSxPQUFPLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFOzs7Ozs7O0lBT3JFLElBQUksU0FBUyxLQUF1QixPQUFPLGlCQUFpQixDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxFQUFFOzs7Ozs7SUFNakYsSUFBSSxjQUFjO1FBQ2hCLE9BQU8sc0JBQXNCLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7S0FDdEQ7Ozs7SUFFTyxnQkFBZ0I7UUFDdEIsSUFBSSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFDbkMsY0FBYyxDQUFDLG9CQUFvQixFQUFFLENBQUM7U0FDdkM7Ozs7WUF6RkosU0FBUyxTQUFDLEVBQUMsUUFBUSxFQUFFLGlCQUFpQixFQUFFLFNBQVMsRUFBRSxDQUFDLHFCQUFxQixDQUFDLEVBQUM7Ozs7WUFwSHBFLGdCQUFnQix1QkF3SWpCLFFBQVEsWUFBSSxJQUFJLFlBQUksUUFBUTt3Q0FDNUIsUUFBUSxZQUFJLElBQUksWUFBSSxNQUFNLFNBQUMsYUFBYTt3Q0FDeEMsUUFBUSxZQUFJLElBQUksWUFBSSxNQUFNLFNBQUMsbUJBQW1COzs7bUJBTGxELEtBQUssU0FBQyxlQUFlOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE0RXhCLFNBQVMsaUJBQWlCLENBQUMsTUFBd0I7SUFDakQsT0FBTyxDQUFDLENBQUMsTUFBTSxZQUFZLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLFlBQVksa0JBQWtCLENBQUM7UUFDaEYsQ0FBQyxDQUFDLE1BQU0sWUFBWSxhQUFhLENBQUMsQ0FBQztDQUN4QyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtEaXJlY3RpdmUsIEhvc3QsIEluamVjdCwgSW5wdXQsIE9uRGVzdHJveSwgT25Jbml0LCBPcHRpb25hbCwgU2VsZiwgU2tpcFNlbGYsIGZvcndhcmRSZWZ9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5pbXBvcnQge0Zvcm1BcnJheX0gZnJvbSAnLi4vLi4vbW9kZWwnO1xuaW1wb3J0IHtOR19BU1lOQ19WQUxJREFUT1JTLCBOR19WQUxJREFUT1JTfSBmcm9tICcuLi8uLi92YWxpZGF0b3JzJztcbmltcG9ydCB7QWJzdHJhY3RGb3JtR3JvdXBEaXJlY3RpdmV9IGZyb20gJy4uL2Fic3RyYWN0X2Zvcm1fZ3JvdXBfZGlyZWN0aXZlJztcbmltcG9ydCB7Q29udHJvbENvbnRhaW5lcn0gZnJvbSAnLi4vY29udHJvbF9jb250YWluZXInO1xuaW1wb3J0IHtSZWFjdGl2ZUVycm9yc30gZnJvbSAnLi4vcmVhY3RpdmVfZXJyb3JzJztcbmltcG9ydCB7Y29tcG9zZUFzeW5jVmFsaWRhdG9ycywgY29tcG9zZVZhbGlkYXRvcnMsIGNvbnRyb2xQYXRofSBmcm9tICcuLi9zaGFyZWQnO1xuaW1wb3J0IHtBc3luY1ZhbGlkYXRvckZuLCBWYWxpZGF0b3JGbn0gZnJvbSAnLi4vdmFsaWRhdG9ycyc7XG5cbmltcG9ydCB7Rm9ybUdyb3VwRGlyZWN0aXZlfSBmcm9tICcuL2Zvcm1fZ3JvdXBfZGlyZWN0aXZlJztcblxuZXhwb3J0IGNvbnN0IGZvcm1Hcm91cE5hbWVQcm92aWRlcjogYW55ID0ge1xuICBwcm92aWRlOiBDb250cm9sQ29udGFpbmVyLFxuICB1c2VFeGlzdGluZzogZm9yd2FyZFJlZigoKSA9PiBGb3JtR3JvdXBOYW1lKVxufTtcblxuLyoqXG4gKiBAZGVzY3JpcHRpb25cbiAqXG4gKiBTeW5jcyBhIG5lc3RlZCBgRm9ybUdyb3VwYCB0byBhIERPTSBlbGVtZW50LlxuICpcbiAqIFRoaXMgZGlyZWN0aXZlIGNhbiBvbmx5IGJlIHVzZWQgd2l0aCBhIHBhcmVudCBgRm9ybUdyb3VwRGlyZWN0aXZlYC5cbiAqXG4gKiBJdCBhY2NlcHRzIHRoZSBzdHJpbmcgbmFtZSBvZiB0aGUgbmVzdGVkIGBGb3JtR3JvdXBgIHRvIGxpbmssIGFuZFxuICogbG9va3MgZm9yIGEgYEZvcm1Hcm91cGAgcmVnaXN0ZXJlZCB3aXRoIHRoYXQgbmFtZSBpbiB0aGUgcGFyZW50XG4gKiBgRm9ybUdyb3VwYCBpbnN0YW5jZSB5b3UgcGFzc2VkIGludG8gYEZvcm1Hcm91cERpcmVjdGl2ZWAuXG4gKlxuICogVXNlIG5lc3RlZCBmb3JtIGdyb3VwcyB0byB2YWxpZGF0ZSBhIHN1Yi1ncm91cCBvZiBhXG4gKiBmb3JtIHNlcGFyYXRlbHkgZnJvbSB0aGUgcmVzdCBvciB0byBncm91cCB0aGUgdmFsdWVzIG9mIGNlcnRhaW5cbiAqIGNvbnRyb2xzIGludG8gdGhlaXIgb3duIG5lc3RlZCBvYmplY3QuXG4gKiBcbiAqIEBzZWUgW1JlYWN0aXZlIEZvcm1zIEd1aWRlXShndWlkZS9yZWFjdGl2ZS1mb3JtcylcbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogXG4gKiAjIyMgQWNjZXNzIHRoZSBncm91cCBieSBuYW1lXG4gKiBcbiAqIFRoZSBmb2xsb3dpbmcgZXhhbXBsZSB1c2VzIHRoZSB7QGxpbmsgQWJzdHJhY3RDb250cm9sI2dldCBnZXR9IG1ldGhvZCB0byBhY2Nlc3MgdGhlIFxuICogYXNzb2NpYXRlZCBgRm9ybUdyb3VwYFxuICpcbiAqIGBgYHRzXG4gKiAgIHRoaXMuZm9ybS5nZXQoJ25hbWUnKTtcbiAqIGBgYFxuICogXG4gKiAjIyMgQWNjZXNzIGluZGl2aWR1YWwgY29udHJvbHMgaW4gdGhlIGdyb3VwXG4gKiBcbiAqIFRoZSBmb2xsb3dpbmcgZXhhbXBsZSB1c2VzIHRoZSB7QGxpbmsgQWJzdHJhY3RDb250cm9sI2dldCBnZXR9IG1ldGhvZCB0byBhY2Nlc3MgXG4gKiBpbmRpdmlkdWFsIGNvbnRyb2xzIHdpdGhpbiB0aGUgZ3JvdXAgdXNpbmcgZG90IHN5bnRheC5cbiAqXG4gKiBgYGB0c1xuICogICB0aGlzLmZvcm0uZ2V0KCduYW1lLmZpcnN0Jyk7XG4gKiBgYGBcbiAqXG4gKiAjIyMgUmVnaXN0ZXIgYSBuZXN0ZWQgYEZvcm1Hcm91cGAuXG4gKiBcbiAqIFRoZSBmb2xsb3dpbmcgZXhhbXBsZSByZWdpc3RlcnMgYSBuZXN0ZWQgKm5hbWUqIGBGb3JtR3JvdXBgIHdpdGhpbiBhbiBleGlzdGluZyBgRm9ybUdyb3VwYCxcbiAqIGFuZCBwcm92aWRlcyBtZXRob2RzIHRvIHJldHJpZXZlIHRoZSBuZXN0ZWQgYEZvcm1Hcm91cGAgYW5kIGluZGl2aWR1YWwgY29udHJvbHMuXG4gKlxuICoge0BleGFtcGxlIGZvcm1zL3RzL25lc3RlZEZvcm1Hcm91cC9uZXN0ZWRfZm9ybV9ncm91cF9leGFtcGxlLnRzIHJlZ2lvbj0nQ29tcG9uZW50J31cbiAqXG4gKiBAbmdNb2R1bGUgUmVhY3RpdmVGb3Jtc01vZHVsZVxuICogQHB1YmxpY0FwaVxuICovXG5ARGlyZWN0aXZlKHtzZWxlY3RvcjogJ1tmb3JtR3JvdXBOYW1lXScsIHByb3ZpZGVyczogW2Zvcm1Hcm91cE5hbWVQcm92aWRlcl19KVxuZXhwb3J0IGNsYXNzIEZvcm1Hcm91cE5hbWUgZXh0ZW5kcyBBYnN0cmFjdEZvcm1Hcm91cERpcmVjdGl2ZSBpbXBsZW1lbnRzIE9uSW5pdCwgT25EZXN0cm95IHtcbiAgLyoqXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBUcmFja3MgdGhlIG5hbWUgb2YgdGhlIGBGb3JtR3JvdXBgIGJvdW5kIHRvIHRoZSBkaXJlY3RpdmUuIFRoZSBuYW1lIGNvcnJlc3BvbmRzXG4gICAqIHRvIGEga2V5IGluIHRoZSBwYXJlbnQgYEZvcm1Hcm91cGAgb3IgYEZvcm1BcnJheWAuXG4gICAqL1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgQElucHV0KCdmb3JtR3JvdXBOYW1lJykgbmFtZSAhOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBAT3B0aW9uYWwoKSBASG9zdCgpIEBTa2lwU2VsZigpIHBhcmVudDogQ29udHJvbENvbnRhaW5lcixcbiAgICAgIEBPcHRpb25hbCgpIEBTZWxmKCkgQEluamVjdChOR19WQUxJREFUT1JTKSB2YWxpZGF0b3JzOiBhbnlbXSxcbiAgICAgIEBPcHRpb25hbCgpIEBTZWxmKCkgQEluamVjdChOR19BU1lOQ19WQUxJREFUT1JTKSBhc3luY1ZhbGlkYXRvcnM6IGFueVtdKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLl9wYXJlbnQgPSBwYXJlbnQ7XG4gICAgdGhpcy5fdmFsaWRhdG9ycyA9IHZhbGlkYXRvcnM7XG4gICAgdGhpcy5fYXN5bmNWYWxpZGF0b3JzID0gYXN5bmNWYWxpZGF0b3JzO1xuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfY2hlY2tQYXJlbnRUeXBlKCk6IHZvaWQge1xuICAgIGlmIChfaGFzSW52YWxpZFBhcmVudCh0aGlzLl9wYXJlbnQpKSB7XG4gICAgICBSZWFjdGl2ZUVycm9ycy5ncm91cFBhcmVudEV4Y2VwdGlvbigpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgY29uc3QgZm9ybUFycmF5TmFtZVByb3ZpZGVyOiBhbnkgPSB7XG4gIHByb3ZpZGU6IENvbnRyb2xDb250YWluZXIsXG4gIHVzZUV4aXN0aW5nOiBmb3J3YXJkUmVmKCgpID0+IEZvcm1BcnJheU5hbWUpXG59O1xuXG4vKipcbiAqIEBkZXNjcmlwdGlvblxuICpcbiAqIFN5bmNzIGEgbmVzdGVkIGBGb3JtQXJyYXlgIHRvIGEgRE9NIGVsZW1lbnQuXG4gKlxuICogVGhpcyBkaXJlY3RpdmUgaXMgZGVzaWduZWQgdG8gYmUgdXNlZCB3aXRoIGEgcGFyZW50IGBGb3JtR3JvdXBEaXJlY3RpdmVgIChzZWxlY3RvcjpcbiAqIGBbZm9ybUdyb3VwXWApLlxuICpcbiAqIEl0IGFjY2VwdHMgdGhlIHN0cmluZyBuYW1lIG9mIHRoZSBuZXN0ZWQgYEZvcm1BcnJheWAgeW91IHdhbnQgdG8gbGluaywgYW5kXG4gKiB3aWxsIGxvb2sgZm9yIGEgYEZvcm1BcnJheWAgcmVnaXN0ZXJlZCB3aXRoIHRoYXQgbmFtZSBpbiB0aGUgcGFyZW50XG4gKiBgRm9ybUdyb3VwYCBpbnN0YW5jZSB5b3UgcGFzc2VkIGludG8gYEZvcm1Hcm91cERpcmVjdGl2ZWAuXG4gKiBcbiAqIEBzZWUgW1JlYWN0aXZlIEZvcm1zIEd1aWRlXShndWlkZS9yZWFjdGl2ZS1mb3JtcylcbiAqIEBzZWUgYEFic3RyYWN0Q29udHJvbGBcbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICpcbiAqICMjIyBFeGFtcGxlXG4gKlxuICoge0BleGFtcGxlIGZvcm1zL3RzL25lc3RlZEZvcm1BcnJheS9uZXN0ZWRfZm9ybV9hcnJheV9leGFtcGxlLnRzIHJlZ2lvbj0nQ29tcG9uZW50J31cbiAqXG4gKiBAbmdNb2R1bGUgUmVhY3RpdmVGb3Jtc01vZHVsZVxuICogQHB1YmxpY0FwaVxuICovXG5ARGlyZWN0aXZlKHtzZWxlY3RvcjogJ1tmb3JtQXJyYXlOYW1lXScsIHByb3ZpZGVyczogW2Zvcm1BcnJheU5hbWVQcm92aWRlcl19KVxuZXhwb3J0IGNsYXNzIEZvcm1BcnJheU5hbWUgZXh0ZW5kcyBDb250cm9sQ29udGFpbmVyIGltcGxlbWVudHMgT25Jbml0LCBPbkRlc3Ryb3kge1xuICAvKiogQGludGVybmFsICovXG4gIF9wYXJlbnQ6IENvbnRyb2xDb250YWluZXI7XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfdmFsaWRhdG9yczogYW55W107XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfYXN5bmNWYWxpZGF0b3JzOiBhbnlbXTtcblxuICAvKipcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIFRyYWNrcyB0aGUgbmFtZSBvZiB0aGUgYEZvcm1BcnJheWAgYm91bmQgdG8gdGhlIGRpcmVjdGl2ZS4gVGhlIG5hbWUgY29ycmVzcG9uZHNcbiAgICogdG8gYSBrZXkgaW4gdGhlIHBhcmVudCBgRm9ybUdyb3VwYCBvciBgRm9ybUFycmF5YC5cbiAgICovXG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBASW5wdXQoJ2Zvcm1BcnJheU5hbWUnKSBuYW1lICE6IHN0cmluZztcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIEBPcHRpb25hbCgpIEBIb3N0KCkgQFNraXBTZWxmKCkgcGFyZW50OiBDb250cm9sQ29udGFpbmVyLFxuICAgICAgQE9wdGlvbmFsKCkgQFNlbGYoKSBASW5qZWN0KE5HX1ZBTElEQVRPUlMpIHZhbGlkYXRvcnM6IGFueVtdLFxuICAgICAgQE9wdGlvbmFsKCkgQFNlbGYoKSBASW5qZWN0KE5HX0FTWU5DX1ZBTElEQVRPUlMpIGFzeW5jVmFsaWRhdG9yczogYW55W10pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuX3BhcmVudCA9IHBhcmVudDtcbiAgICB0aGlzLl92YWxpZGF0b3JzID0gdmFsaWRhdG9ycztcbiAgICB0aGlzLl9hc3luY1ZhbGlkYXRvcnMgPSBhc3luY1ZhbGlkYXRvcnM7XG4gIH1cblxuICAvKipcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIEEgbGlmZWN5Y2xlIG1ldGhvZCBjYWxsZWQgd2hlbiB0aGUgZGlyZWN0aXZlJ3MgaW5wdXRzIGFyZSBpbml0aWFsaXplZC4gRm9yIGludGVybmFsIHVzZSBvbmx5LlxuICAgKlxuICAgKiBAdGhyb3dzIElmIHRoZSBkaXJlY3RpdmUgZG9lcyBub3QgaGF2ZSBhIHZhbGlkIHBhcmVudC5cbiAgICovXG4gIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIHRoaXMuX2NoZWNrUGFyZW50VHlwZSgpO1xuICAgIHRoaXMuZm9ybURpcmVjdGl2ZSAhLmFkZEZvcm1BcnJheSh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAZGVzY3JpcHRpb25cbiAgICogQSBsaWZlY3ljbGUgbWV0aG9kIGNhbGxlZCBiZWZvcmUgdGhlIGRpcmVjdGl2ZSdzIGluc3RhbmNlIGlzIGRlc3Ryb3llZC4gRm9yIGludGVybmFsIHVzZSBvbmx5LlxuICAgKi9cbiAgbmdPbkRlc3Ryb3koKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuZm9ybURpcmVjdGl2ZSkge1xuICAgICAgdGhpcy5mb3JtRGlyZWN0aXZlLnJlbW92ZUZvcm1BcnJheSh0aGlzKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIFRoZSBgRm9ybUFycmF5YCBib3VuZCB0byB0aGlzIGRpcmVjdGl2ZS5cbiAgICovXG4gIGdldCBjb250cm9sKCk6IEZvcm1BcnJheSB7IHJldHVybiB0aGlzLmZvcm1EaXJlY3RpdmUgIS5nZXRGb3JtQXJyYXkodGhpcyk7IH1cblxuICAvKipcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIFRoZSB0b3AtbGV2ZWwgZGlyZWN0aXZlIGZvciB0aGlzIGdyb3VwIGlmIHByZXNlbnQsIG90aGVyd2lzZSBudWxsLlxuICAgKi9cbiAgZ2V0IGZvcm1EaXJlY3RpdmUoKTogRm9ybUdyb3VwRGlyZWN0aXZlfG51bGwge1xuICAgIHJldHVybiB0aGlzLl9wYXJlbnQgPyA8Rm9ybUdyb3VwRGlyZWN0aXZlPnRoaXMuX3BhcmVudC5mb3JtRGlyZWN0aXZlIDogbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAZGVzY3JpcHRpb25cbiAgICogUmV0dXJucyBhbiBhcnJheSB0aGF0IHJlcHJlc2VudHMgdGhlIHBhdGggZnJvbSB0aGUgdG9wLWxldmVsIGZvcm0gdG8gdGhpcyBjb250cm9sLlxuICAgKiBFYWNoIGluZGV4IGlzIHRoZSBzdHJpbmcgbmFtZSBvZiB0aGUgY29udHJvbCBvbiB0aGF0IGxldmVsLlxuICAgKi9cbiAgZ2V0IHBhdGgoKTogc3RyaW5nW10geyByZXR1cm4gY29udHJvbFBhdGgodGhpcy5uYW1lLCB0aGlzLl9wYXJlbnQpOyB9XG5cbiAgLyoqXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBTeW5jaHJvbm91cyB2YWxpZGF0b3IgZnVuY3Rpb24gY29tcG9zZWQgb2YgYWxsIHRoZSBzeW5jaHJvbm91cyB2YWxpZGF0b3JzIHJlZ2lzdGVyZWQgd2l0aCB0aGlzXG4gICAqIGRpcmVjdGl2ZS5cbiAgICovXG4gIGdldCB2YWxpZGF0b3IoKTogVmFsaWRhdG9yRm58bnVsbCB7IHJldHVybiBjb21wb3NlVmFsaWRhdG9ycyh0aGlzLl92YWxpZGF0b3JzKTsgfVxuXG4gIC8qKlxuICAgKiBAZGVzY3JpcHRpb25cbiAgICogQXN5bmMgdmFsaWRhdG9yIGZ1bmN0aW9uIGNvbXBvc2VkIG9mIGFsbCB0aGUgYXN5bmMgdmFsaWRhdG9ycyByZWdpc3RlcmVkIHdpdGggdGhpcyBkaXJlY3RpdmUuXG4gICAqL1xuICBnZXQgYXN5bmNWYWxpZGF0b3IoKTogQXN5bmNWYWxpZGF0b3JGbnxudWxsIHtcbiAgICByZXR1cm4gY29tcG9zZUFzeW5jVmFsaWRhdG9ycyh0aGlzLl9hc3luY1ZhbGlkYXRvcnMpO1xuICB9XG5cbiAgcHJpdmF0ZSBfY2hlY2tQYXJlbnRUeXBlKCk6IHZvaWQge1xuICAgIGlmIChfaGFzSW52YWxpZFBhcmVudCh0aGlzLl9wYXJlbnQpKSB7XG4gICAgICBSZWFjdGl2ZUVycm9ycy5hcnJheVBhcmVudEV4Y2VwdGlvbigpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBfaGFzSW52YWxpZFBhcmVudChwYXJlbnQ6IENvbnRyb2xDb250YWluZXIpOiBib29sZWFuIHtcbiAgcmV0dXJuICEocGFyZW50IGluc3RhbmNlb2YgRm9ybUdyb3VwTmFtZSkgJiYgIShwYXJlbnQgaW5zdGFuY2VvZiBGb3JtR3JvdXBEaXJlY3RpdmUpICYmXG4gICAgICAhKHBhcmVudCBpbnN0YW5jZW9mIEZvcm1BcnJheU5hbWUpO1xufVxuIl19
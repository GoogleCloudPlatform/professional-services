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
import { Directive, ElementRef, Host, Input, Optional, Renderer2, forwardRef, ɵlooseIdentical as looseIdentical } from '@angular/core';
import { NG_VALUE_ACCESSOR } from './control_value_accessor';
/** @type {?} */
export const SELECT_MULTIPLE_VALUE_ACCESSOR = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => SelectMultipleControlValueAccessor),
    multi: true
};
/**
 * @param {?} id
 * @param {?} value
 * @return {?}
 */
function _buildValueString(id, value) {
    if (id == null)
        return `${value}`;
    if (typeof value === 'string')
        value = `'${value}'`;
    if (value && typeof value === 'object')
        value = 'Object';
    return `${id}: ${value}`.slice(0, 50);
}
/**
 * @param {?} valueString
 * @return {?}
 */
function _extractId(valueString) {
    return valueString.split(':')[0];
}
/**
 * Mock interface for HTML Options
 * @record
 */
function HTMLOption() { }
/** @type {?} */
HTMLOption.prototype.value;
/** @type {?} */
HTMLOption.prototype.selected;
/**
 * Mock interface for HTMLCollection
 * @abstract
 */
class HTMLCollection {
}
if (false) {
    /** @type {?} */
    HTMLCollection.prototype.length;
    /**
     * @abstract
     * @param {?} _
     * @return {?}
     */
    HTMLCollection.prototype.item = function (_) { };
}
/**
 * \@description
 * The `ControlValueAccessor` for writing multi-select control values and listening to multi-select control
 * changes. The value accessor is used by the `FormControlDirective`, `FormControlName`, and `NgModel`
 * directives.
 *
 * @see `SelectControlValueAccessor`
 *
 * \@usageNotes
 *
 * ### Using a multi-select control
 *
 * The follow example shows you how to use a multi-select control with a reactive form.
 *
 * ```ts
 * const countryControl = new FormControl();
 * ```
 *
 * ```
 * <select multiple name="countries" [formControl]="countryControl">
 *   <option *ngFor="let country of countries" [ngValue]="country">
 *     {{ country.name }}
 *   </option>
 * </select>
 * ```
 *
 * ### Customizing option selection
 *
 * To customize the default option comparison algorithm, `<select>` supports `compareWith` input.
 * See the `SelectControlValueAccessor` for usage.
 *
 * \@ngModule ReactiveFormsModule
 * \@ngModule FormsModule
 * \@publicApi
 */
export class SelectMultipleControlValueAccessor {
    /**
     * @param {?} _renderer
     * @param {?} _elementRef
     */
    constructor(_renderer, _elementRef) {
        this._renderer = _renderer;
        this._elementRef = _elementRef;
        /**
         * \@internal
         */
        this._optionMap = new Map();
        /**
         * \@internal
         */
        this._idCounter = 0;
        /**
         * \@description
         * The registered callback function called when a change event occurs on the input element.
         */
        this.onChange = (_) => { };
        /**
         * \@description
         * The registered callback function called when a blur event occurs on the input element.
         */
        this.onTouched = () => { };
        this._compareWith = looseIdentical;
    }
    /**
     * \@description
     * Tracks the option comparison algorithm for tracking identities when
     * checking for changes.
     * @param {?} fn
     * @return {?}
     */
    set compareWith(fn) {
        if (typeof fn !== 'function') {
            throw new Error(`compareWith must be a function, but received ${JSON.stringify(fn)}`);
        }
        this._compareWith = fn;
    }
    /**
     * \@description
     * Sets the "value" property on one or of more
     * of the select's options.
     *
     * @param {?} value The value
     * @return {?}
     */
    writeValue(value) {
        this.value = value;
        /** @type {?} */
        let optionSelectedStateSetter;
        if (Array.isArray(value)) {
            /** @type {?} */
            const ids = value.map((v) => this._getOptionId(v));
            optionSelectedStateSetter = (opt, o) => { opt._setSelected(ids.indexOf(o.toString()) > -1); };
        }
        else {
            optionSelectedStateSetter = (opt, o) => { opt._setSelected(false); };
        }
        this._optionMap.forEach(optionSelectedStateSetter);
    }
    /**
     * \@description
     * Registers a function called when the control value changes
     * and writes an array of the selected options.
     *
     * @param {?} fn The callback function
     * @return {?}
     */
    registerOnChange(fn) {
        this.onChange = (_) => {
            /** @type {?} */
            const selected = [];
            if (_.hasOwnProperty('selectedOptions')) {
                /** @type {?} */
                const options = _.selectedOptions;
                for (let i = 0; i < options.length; i++) {
                    /** @type {?} */
                    const opt = options.item(i);
                    /** @type {?} */
                    const val = this._getOptionValue(opt.value);
                    selected.push(val);
                }
            }
            // Degrade on IE
            else {
                /** @type {?} */
                const options = /** @type {?} */ (_.options);
                for (let i = 0; i < options.length; i++) {
                    /** @type {?} */
                    const opt = options.item(i);
                    if (opt.selected) {
                        /** @type {?} */
                        const val = this._getOptionValue(opt.value);
                        selected.push(val);
                    }
                }
            }
            this.value = selected;
            fn(selected);
        };
    }
    /**
     * \@description
     * Registers a function called when the control is touched.
     *
     * @param {?} fn The callback function
     * @return {?}
     */
    registerOnTouched(fn) { this.onTouched = fn; }
    /**
     * Sets the "disabled" property on the select input element.
     *
     * @param {?} isDisabled The disabled value
     * @return {?}
     */
    setDisabledState(isDisabled) {
        this._renderer.setProperty(this._elementRef.nativeElement, 'disabled', isDisabled);
    }
    /**
     * \@internal
     * @param {?} value
     * @return {?}
     */
    _registerOption(value) {
        /** @type {?} */
        const id = (this._idCounter++).toString();
        this._optionMap.set(id, value);
        return id;
    }
    /**
     * \@internal
     * @param {?} value
     * @return {?}
     */
    _getOptionId(value) {
        for (const id of Array.from(this._optionMap.keys())) {
            if (this._compareWith(/** @type {?} */ ((this._optionMap.get(id)))._value, value))
                return id;
        }
        return null;
    }
    /**
     * \@internal
     * @param {?} valueString
     * @return {?}
     */
    _getOptionValue(valueString) {
        /** @type {?} */
        const id = _extractId(valueString);
        return this._optionMap.has(id) ? /** @type {?} */ ((this._optionMap.get(id)))._value : valueString;
    }
}
SelectMultipleControlValueAccessor.decorators = [
    { type: Directive, args: [{
                selector: 'select[multiple][formControlName],select[multiple][formControl],select[multiple][ngModel]',
                host: { '(change)': 'onChange($event.target)', '(blur)': 'onTouched()' },
                providers: [SELECT_MULTIPLE_VALUE_ACCESSOR]
            },] }
];
/** @nocollapse */
SelectMultipleControlValueAccessor.ctorParameters = () => [
    { type: Renderer2 },
    { type: ElementRef }
];
SelectMultipleControlValueAccessor.propDecorators = {
    compareWith: [{ type: Input }]
};
if (false) {
    /**
     * \@description
     * The current value
     * @type {?}
     */
    SelectMultipleControlValueAccessor.prototype.value;
    /**
     * \@internal
     * @type {?}
     */
    SelectMultipleControlValueAccessor.prototype._optionMap;
    /**
     * \@internal
     * @type {?}
     */
    SelectMultipleControlValueAccessor.prototype._idCounter;
    /**
     * \@description
     * The registered callback function called when a change event occurs on the input element.
     * @type {?}
     */
    SelectMultipleControlValueAccessor.prototype.onChange;
    /**
     * \@description
     * The registered callback function called when a blur event occurs on the input element.
     * @type {?}
     */
    SelectMultipleControlValueAccessor.prototype.onTouched;
    /** @type {?} */
    SelectMultipleControlValueAccessor.prototype._compareWith;
    /** @type {?} */
    SelectMultipleControlValueAccessor.prototype._renderer;
    /** @type {?} */
    SelectMultipleControlValueAccessor.prototype._elementRef;
}
/**
 * \@description
 * Marks `<option>` as dynamic, so Angular can be notified when options change.
 *
 * @see `SelectMultipleControlValueAccessor`
 *
 * \@ngModule ReactiveFormsModule
 * \@ngModule FormsModule
 * \@publicApi
 */
export class NgSelectMultipleOption {
    /**
     * @param {?} _element
     * @param {?} _renderer
     * @param {?} _select
     */
    constructor(_element, _renderer, _select) {
        this._element = _element;
        this._renderer = _renderer;
        this._select = _select;
        if (this._select) {
            this.id = this._select._registerOption(this);
        }
    }
    /**
     * \@description
     * Tracks the value bound to the option element. Unlike the value binding,
     * ngValue supports binding to objects.
     * @param {?} value
     * @return {?}
     */
    set ngValue(value) {
        if (this._select == null)
            return;
        this._value = value;
        this._setElementValue(_buildValueString(this.id, value));
        this._select.writeValue(this._select.value);
    }
    /**
     * \@description
     * Tracks simple string values bound to the option element.
     * For objects, use the `ngValue` input binding.
     * @param {?} value
     * @return {?}
     */
    set value(value) {
        if (this._select) {
            this._value = value;
            this._setElementValue(_buildValueString(this.id, value));
            this._select.writeValue(this._select.value);
        }
        else {
            this._setElementValue(value);
        }
    }
    /**
     * \@internal
     * @param {?} value
     * @return {?}
     */
    _setElementValue(value) {
        this._renderer.setProperty(this._element.nativeElement, 'value', value);
    }
    /**
     * \@internal
     * @param {?} selected
     * @return {?}
     */
    _setSelected(selected) {
        this._renderer.setProperty(this._element.nativeElement, 'selected', selected);
    }
    /**
     * \@description
     * Lifecycle method called before the directive's instance is destroyed. For internal use only.
     * @return {?}
     */
    ngOnDestroy() {
        if (this._select) {
            this._select._optionMap.delete(this.id);
            this._select.writeValue(this._select.value);
        }
    }
}
NgSelectMultipleOption.decorators = [
    { type: Directive, args: [{ selector: 'option' },] }
];
/** @nocollapse */
NgSelectMultipleOption.ctorParameters = () => [
    { type: ElementRef },
    { type: Renderer2 },
    { type: SelectMultipleControlValueAccessor, decorators: [{ type: Optional }, { type: Host }] }
];
NgSelectMultipleOption.propDecorators = {
    ngValue: [{ type: Input, args: ['ngValue',] }],
    value: [{ type: Input, args: ['value',] }]
};
if (false) {
    /** @type {?} */
    NgSelectMultipleOption.prototype.id;
    /**
     * \@internal
     * @type {?}
     */
    NgSelectMultipleOption.prototype._value;
    /** @type {?} */
    NgSelectMultipleOption.prototype._element;
    /** @type {?} */
    NgSelectMultipleOption.prototype._renderer;
    /** @type {?} */
    NgSelectMultipleOption.prototype._select;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZWN0X211bHRpcGxlX2NvbnRyb2xfdmFsdWVfYWNjZXNzb3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9mb3Jtcy9zcmMvZGlyZWN0aXZlcy9zZWxlY3RfbXVsdGlwbGVfY29udHJvbF92YWx1ZV9hY2Nlc3Nvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxTQUFTLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQWEsUUFBUSxFQUFFLFNBQVMsRUFBa0IsVUFBVSxFQUFFLGVBQWUsSUFBSSxjQUFjLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFFaEssT0FBTyxFQUF1QixpQkFBaUIsRUFBQyxNQUFNLDBCQUEwQixDQUFDOztBQUVqRixhQUFhLDhCQUE4QixHQUFtQjtJQUM1RCxPQUFPLEVBQUUsaUJBQWlCO0lBQzFCLFdBQVcsRUFBRSxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsa0NBQWtDLENBQUM7SUFDakUsS0FBSyxFQUFFLElBQUk7Q0FDWixDQUFDOzs7Ozs7QUFFRixTQUFTLGlCQUFpQixDQUFDLEVBQVUsRUFBRSxLQUFVO0lBQy9DLElBQUksRUFBRSxJQUFJLElBQUk7UUFBRSxPQUFPLEdBQUcsS0FBSyxFQUFFLENBQUM7SUFDbEMsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRO1FBQUUsS0FBSyxHQUFHLElBQUksS0FBSyxHQUFHLENBQUM7SUFDcEQsSUFBSSxLQUFLLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUTtRQUFFLEtBQUssR0FBRyxRQUFRLENBQUM7SUFDekQsT0FBTyxHQUFHLEVBQUUsS0FBSyxLQUFLLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0NBQ3ZDOzs7OztBQUVELFNBQVMsVUFBVSxDQUFDLFdBQW1CO0lBQ3JDLE9BQU8sV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLENB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QUFrQyx1QkFBdEUsUUFBUSxZQUFJLElBQUk7OztzQkFXcEIsS0FBSyxTQUFDLFNBQVM7b0JBYWYsS0FBSyxTQUFDLE9BQU8iLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGlyZWN0aXZlLCBFbGVtZW50UmVmLCBIb3N0LCBJbnB1dCwgT25EZXN0cm95LCBPcHRpb25hbCwgUmVuZGVyZXIyLCBTdGF0aWNQcm92aWRlciwgZm9yd2FyZFJlZiwgybVsb29zZUlkZW50aWNhbCBhcyBsb29zZUlkZW50aWNhbH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbmltcG9ydCB7Q29udHJvbFZhbHVlQWNjZXNzb3IsIE5HX1ZBTFVFX0FDQ0VTU09SfSBmcm9tICcuL2NvbnRyb2xfdmFsdWVfYWNjZXNzb3InO1xuXG5leHBvcnQgY29uc3QgU0VMRUNUX01VTFRJUExFX1ZBTFVFX0FDQ0VTU09SOiBTdGF0aWNQcm92aWRlciA9IHtcbiAgcHJvdmlkZTogTkdfVkFMVUVfQUNDRVNTT1IsXG4gIHVzZUV4aXN0aW5nOiBmb3J3YXJkUmVmKCgpID0+IFNlbGVjdE11bHRpcGxlQ29udHJvbFZhbHVlQWNjZXNzb3IpLFxuICBtdWx0aTogdHJ1ZVxufTtcblxuZnVuY3Rpb24gX2J1aWxkVmFsdWVTdHJpbmcoaWQ6IHN0cmluZywgdmFsdWU6IGFueSk6IHN0cmluZyB7XG4gIGlmIChpZCA9PSBudWxsKSByZXR1cm4gYCR7dmFsdWV9YDtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHZhbHVlID0gYCcke3ZhbHVlfSdgO1xuICBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JykgdmFsdWUgPSAnT2JqZWN0JztcbiAgcmV0dXJuIGAke2lkfTogJHt2YWx1ZX1gLnNsaWNlKDAsIDUwKTtcbn1cblxuZnVuY3Rpb24gX2V4dHJhY3RJZCh2YWx1ZVN0cmluZzogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHZhbHVlU3RyaW5nLnNwbGl0KCc6JylbMF07XG59XG5cbi8qKiBNb2NrIGludGVyZmFjZSBmb3IgSFRNTCBPcHRpb25zICovXG5pbnRlcmZhY2UgSFRNTE9wdGlvbiB7XG4gIHZhbHVlOiBzdHJpbmc7XG4gIHNlbGVjdGVkOiBib29sZWFuO1xufVxuXG4vKiogTW9jayBpbnRlcmZhY2UgZm9yIEhUTUxDb2xsZWN0aW9uICovXG5hYnN0cmFjdCBjbGFzcyBIVE1MQ29sbGVjdGlvbiB7XG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBsZW5ndGggITogbnVtYmVyO1xuICBhYnN0cmFjdCBpdGVtKF86IG51bWJlcik6IEhUTUxPcHRpb247XG59XG5cbi8qKlxuICogQGRlc2NyaXB0aW9uXG4gKiBUaGUgYENvbnRyb2xWYWx1ZUFjY2Vzc29yYCBmb3Igd3JpdGluZyBtdWx0aS1zZWxlY3QgY29udHJvbCB2YWx1ZXMgYW5kIGxpc3RlbmluZyB0byBtdWx0aS1zZWxlY3QgY29udHJvbFxuICogY2hhbmdlcy4gVGhlIHZhbHVlIGFjY2Vzc29yIGlzIHVzZWQgYnkgdGhlIGBGb3JtQ29udHJvbERpcmVjdGl2ZWAsIGBGb3JtQ29udHJvbE5hbWVgLCBhbmQgYE5nTW9kZWxgXG4gKiBkaXJlY3RpdmVzLlxuICogXG4gKiBAc2VlIGBTZWxlY3RDb250cm9sVmFsdWVBY2Nlc3NvcmBcbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogXG4gKiAjIyMgVXNpbmcgYSBtdWx0aS1zZWxlY3QgY29udHJvbFxuICogXG4gKiBUaGUgZm9sbG93IGV4YW1wbGUgc2hvd3MgeW91IGhvdyB0byB1c2UgYSBtdWx0aS1zZWxlY3QgY29udHJvbCB3aXRoIGEgcmVhY3RpdmUgZm9ybS5cbiAqIFxuICogYGBgdHNcbiAqIGNvbnN0IGNvdW50cnlDb250cm9sID0gbmV3IEZvcm1Db250cm9sKCk7XG4gKiBgYGBcbiAqXG4gKiBgYGBcbiAqIDxzZWxlY3QgbXVsdGlwbGUgbmFtZT1cImNvdW50cmllc1wiIFtmb3JtQ29udHJvbF09XCJjb3VudHJ5Q29udHJvbFwiPlxuICogICA8b3B0aW9uICpuZ0Zvcj1cImxldCBjb3VudHJ5IG9mIGNvdW50cmllc1wiIFtuZ1ZhbHVlXT1cImNvdW50cnlcIj5cbiAqICAgICB7eyBjb3VudHJ5Lm5hbWUgfX1cbiAqICAgPC9vcHRpb24+XG4gKiA8L3NlbGVjdD5cbiAqIGBgYFxuICogXG4gKiAjIyMgQ3VzdG9taXppbmcgb3B0aW9uIHNlbGVjdGlvblxuICogIFxuICogVG8gY3VzdG9taXplIHRoZSBkZWZhdWx0IG9wdGlvbiBjb21wYXJpc29uIGFsZ29yaXRobSwgYDxzZWxlY3Q+YCBzdXBwb3J0cyBgY29tcGFyZVdpdGhgIGlucHV0LlxuICogU2VlIHRoZSBgU2VsZWN0Q29udHJvbFZhbHVlQWNjZXNzb3JgIGZvciB1c2FnZS5cbiAqXG4gKiBAbmdNb2R1bGUgUmVhY3RpdmVGb3Jtc01vZHVsZVxuICogQG5nTW9kdWxlIEZvcm1zTW9kdWxlXG4gKiBAcHVibGljQXBpXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjpcbiAgICAgICdzZWxlY3RbbXVsdGlwbGVdW2Zvcm1Db250cm9sTmFtZV0sc2VsZWN0W211bHRpcGxlXVtmb3JtQ29udHJvbF0sc2VsZWN0W211bHRpcGxlXVtuZ01vZGVsXScsXG4gIGhvc3Q6IHsnKGNoYW5nZSknOiAnb25DaGFuZ2UoJGV2ZW50LnRhcmdldCknLCAnKGJsdXIpJzogJ29uVG91Y2hlZCgpJ30sXG4gIHByb3ZpZGVyczogW1NFTEVDVF9NVUxUSVBMRV9WQUxVRV9BQ0NFU1NPUl1cbn0pXG5leHBvcnQgY2xhc3MgU2VsZWN0TXVsdGlwbGVDb250cm9sVmFsdWVBY2Nlc3NvciBpbXBsZW1lbnRzIENvbnRyb2xWYWx1ZUFjY2Vzc29yIHtcbiAgLyoqXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBUaGUgY3VycmVudCB2YWx1ZVxuICAgKi9cbiAgdmFsdWU6IGFueTtcblxuICAvKiogQGludGVybmFsICovXG4gIF9vcHRpb25NYXA6IE1hcDxzdHJpbmcsIE5nU2VsZWN0TXVsdGlwbGVPcHRpb24+ID0gbmV3IE1hcDxzdHJpbmcsIE5nU2VsZWN0TXVsdGlwbGVPcHRpb24+KCk7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX2lkQ291bnRlcjogbnVtYmVyID0gMDtcblxuICAvKipcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIFRoZSByZWdpc3RlcmVkIGNhbGxiYWNrIGZ1bmN0aW9uIGNhbGxlZCB3aGVuIGEgY2hhbmdlIGV2ZW50IG9jY3VycyBvbiB0aGUgaW5wdXQgZWxlbWVudC5cbiAgICovXG4gIG9uQ2hhbmdlID0gKF86IGFueSkgPT4ge307XG5cbiAgLyoqXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBUaGUgcmVnaXN0ZXJlZCBjYWxsYmFjayBmdW5jdGlvbiBjYWxsZWQgd2hlbiBhIGJsdXIgZXZlbnQgb2NjdXJzIG9uIHRoZSBpbnB1dCBlbGVtZW50LlxuICAgKi9cbiAgb25Ub3VjaGVkID0gKCkgPT4ge307XG5cbiAgLyoqXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBUcmFja3MgdGhlIG9wdGlvbiBjb21wYXJpc29uIGFsZ29yaXRobSBmb3IgdHJhY2tpbmcgaWRlbnRpdGllcyB3aGVuXG4gICAqIGNoZWNraW5nIGZvciBjaGFuZ2VzLlxuICAgKi9cbiAgQElucHV0KClcbiAgc2V0IGNvbXBhcmVXaXRoKGZuOiAobzE6IGFueSwgbzI6IGFueSkgPT4gYm9vbGVhbikge1xuICAgIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgY29tcGFyZVdpdGggbXVzdCBiZSBhIGZ1bmN0aW9uLCBidXQgcmVjZWl2ZWQgJHtKU09OLnN0cmluZ2lmeShmbil9YCk7XG4gICAgfVxuICAgIHRoaXMuX2NvbXBhcmVXaXRoID0gZm47XG4gIH1cblxuICBwcml2YXRlIF9jb21wYXJlV2l0aDogKG8xOiBhbnksIG8yOiBhbnkpID0+IGJvb2xlYW4gPSBsb29zZUlkZW50aWNhbDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9yZW5kZXJlcjogUmVuZGVyZXIyLCBwcml2YXRlIF9lbGVtZW50UmVmOiBFbGVtZW50UmVmKSB7fVxuXG4gIC8qKlxuICAgKiBAZGVzY3JpcHRpb25cbiAgICogU2V0cyB0aGUgXCJ2YWx1ZVwiIHByb3BlcnR5IG9uIG9uZSBvciBvZiBtb3JlXG4gICAqIG9mIHRoZSBzZWxlY3QncyBvcHRpb25zLlxuICAgKlxuICAgKiBAcGFyYW0gdmFsdWUgVGhlIHZhbHVlXG4gICAqL1xuICB3cml0ZVZhbHVlKHZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgbGV0IG9wdGlvblNlbGVjdGVkU3RhdGVTZXR0ZXI6IChvcHQ6IE5nU2VsZWN0TXVsdGlwbGVPcHRpb24sIG86IGFueSkgPT4gdm9pZDtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgIC8vIGNvbnZlcnQgdmFsdWVzIHRvIGlkc1xuICAgICAgY29uc3QgaWRzID0gdmFsdWUubWFwKCh2KSA9PiB0aGlzLl9nZXRPcHRpb25JZCh2KSk7XG4gICAgICBvcHRpb25TZWxlY3RlZFN0YXRlU2V0dGVyID0gKG9wdCwgbykgPT4geyBvcHQuX3NldFNlbGVjdGVkKGlkcy5pbmRleE9mKG8udG9TdHJpbmcoKSkgPiAtMSk7IH07XG4gICAgfSBlbHNlIHtcbiAgICAgIG9wdGlvblNlbGVjdGVkU3RhdGVTZXR0ZXIgPSAob3B0LCBvKSA9PiB7IG9wdC5fc2V0U2VsZWN0ZWQoZmFsc2UpOyB9O1xuICAgIH1cbiAgICB0aGlzLl9vcHRpb25NYXAuZm9yRWFjaChvcHRpb25TZWxlY3RlZFN0YXRlU2V0dGVyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAZGVzY3JpcHRpb25cbiAgICogUmVnaXN0ZXJzIGEgZnVuY3Rpb24gY2FsbGVkIHdoZW4gdGhlIGNvbnRyb2wgdmFsdWUgY2hhbmdlc1xuICAgKiBhbmQgd3JpdGVzIGFuIGFycmF5IG9mIHRoZSBzZWxlY3RlZCBvcHRpb25zLlxuICAgKlxuICAgKiBAcGFyYW0gZm4gVGhlIGNhbGxiYWNrIGZ1bmN0aW9uXG4gICAqL1xuICByZWdpc3Rlck9uQ2hhbmdlKGZuOiAodmFsdWU6IGFueSkgPT4gYW55KTogdm9pZCB7XG4gICAgdGhpcy5vbkNoYW5nZSA9IChfOiBhbnkpID0+IHtcbiAgICAgIGNvbnN0IHNlbGVjdGVkOiBBcnJheTxhbnk+ID0gW107XG4gICAgICBpZiAoXy5oYXNPd25Qcm9wZXJ0eSgnc2VsZWN0ZWRPcHRpb25zJykpIHtcbiAgICAgICAgY29uc3Qgb3B0aW9uczogSFRNTENvbGxlY3Rpb24gPSBfLnNlbGVjdGVkT3B0aW9ucztcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvcHRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY29uc3Qgb3B0OiBhbnkgPSBvcHRpb25zLml0ZW0oaSk7XG4gICAgICAgICAgY29uc3QgdmFsOiBhbnkgPSB0aGlzLl9nZXRPcHRpb25WYWx1ZShvcHQudmFsdWUpO1xuICAgICAgICAgIHNlbGVjdGVkLnB1c2godmFsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gRGVncmFkZSBvbiBJRVxuICAgICAgZWxzZSB7XG4gICAgICAgIGNvbnN0IG9wdGlvbnM6IEhUTUxDb2xsZWN0aW9uID0gPEhUTUxDb2xsZWN0aW9uPl8ub3B0aW9ucztcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvcHRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY29uc3Qgb3B0OiBIVE1MT3B0aW9uID0gb3B0aW9ucy5pdGVtKGkpO1xuICAgICAgICAgIGlmIChvcHQuc2VsZWN0ZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IHZhbDogYW55ID0gdGhpcy5fZ2V0T3B0aW9uVmFsdWUob3B0LnZhbHVlKTtcbiAgICAgICAgICAgIHNlbGVjdGVkLnB1c2godmFsKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMudmFsdWUgPSBzZWxlY3RlZDtcbiAgICAgIGZuKHNlbGVjdGVkKTtcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBSZWdpc3RlcnMgYSBmdW5jdGlvbiBjYWxsZWQgd2hlbiB0aGUgY29udHJvbCBpcyB0b3VjaGVkLlxuICAgKlxuICAgKiBAcGFyYW0gZm4gVGhlIGNhbGxiYWNrIGZ1bmN0aW9uXG4gICAqL1xuICByZWdpc3Rlck9uVG91Y2hlZChmbjogKCkgPT4gYW55KTogdm9pZCB7IHRoaXMub25Ub3VjaGVkID0gZm47IH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgXCJkaXNhYmxlZFwiIHByb3BlcnR5IG9uIHRoZSBzZWxlY3QgaW5wdXQgZWxlbWVudC5cbiAgICpcbiAgICogQHBhcmFtIGlzRGlzYWJsZWQgVGhlIGRpc2FibGVkIHZhbHVlXG4gICAqL1xuICBzZXREaXNhYmxlZFN0YXRlKGlzRGlzYWJsZWQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICB0aGlzLl9yZW5kZXJlci5zZXRQcm9wZXJ0eSh0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQsICdkaXNhYmxlZCcsIGlzRGlzYWJsZWQpO1xuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfcmVnaXN0ZXJPcHRpb24odmFsdWU6IE5nU2VsZWN0TXVsdGlwbGVPcHRpb24pOiBzdHJpbmcge1xuICAgIGNvbnN0IGlkOiBzdHJpbmcgPSAodGhpcy5faWRDb3VudGVyKyspLnRvU3RyaW5nKCk7XG4gICAgdGhpcy5fb3B0aW9uTWFwLnNldChpZCwgdmFsdWUpO1xuICAgIHJldHVybiBpZDtcbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX2dldE9wdGlvbklkKHZhbHVlOiBhbnkpOiBzdHJpbmd8bnVsbCB7XG4gICAgZm9yIChjb25zdCBpZCBvZiBBcnJheS5mcm9tKHRoaXMuX29wdGlvbk1hcC5rZXlzKCkpKSB7XG4gICAgICBpZiAodGhpcy5fY29tcGFyZVdpdGgodGhpcy5fb3B0aW9uTWFwLmdldChpZCkgIS5fdmFsdWUsIHZhbHVlKSkgcmV0dXJuIGlkO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX2dldE9wdGlvblZhbHVlKHZhbHVlU3RyaW5nOiBzdHJpbmcpOiBhbnkge1xuICAgIGNvbnN0IGlkOiBzdHJpbmcgPSBfZXh0cmFjdElkKHZhbHVlU3RyaW5nKTtcbiAgICByZXR1cm4gdGhpcy5fb3B0aW9uTWFwLmhhcyhpZCkgPyB0aGlzLl9vcHRpb25NYXAuZ2V0KGlkKSAhLl92YWx1ZSA6IHZhbHVlU3RyaW5nO1xuICB9XG59XG5cbi8qKlxuICogQGRlc2NyaXB0aW9uXG4gKiBNYXJrcyBgPG9wdGlvbj5gIGFzIGR5bmFtaWMsIHNvIEFuZ3VsYXIgY2FuIGJlIG5vdGlmaWVkIHdoZW4gb3B0aW9ucyBjaGFuZ2UuXG4gKlxuICogQHNlZSBgU2VsZWN0TXVsdGlwbGVDb250cm9sVmFsdWVBY2Nlc3NvcmBcbiAqXG4gKiBAbmdNb2R1bGUgUmVhY3RpdmVGb3Jtc01vZHVsZVxuICogQG5nTW9kdWxlIEZvcm1zTW9kdWxlXG4gKiBAcHVibGljQXBpXG4gKi9cbkBEaXJlY3RpdmUoe3NlbGVjdG9yOiAnb3B0aW9uJ30pXG5leHBvcnQgY2xhc3MgTmdTZWxlY3RNdWx0aXBsZU9wdGlvbiBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBpZCAhOiBzdHJpbmc7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX3ZhbHVlOiBhbnk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIF9lbGVtZW50OiBFbGVtZW50UmVmLCBwcml2YXRlIF9yZW5kZXJlcjogUmVuZGVyZXIyLFxuICAgICAgQE9wdGlvbmFsKCkgQEhvc3QoKSBwcml2YXRlIF9zZWxlY3Q6IFNlbGVjdE11bHRpcGxlQ29udHJvbFZhbHVlQWNjZXNzb3IpIHtcbiAgICBpZiAodGhpcy5fc2VsZWN0KSB7XG4gICAgICB0aGlzLmlkID0gdGhpcy5fc2VsZWN0Ll9yZWdpc3Rlck9wdGlvbih0aGlzKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIFRyYWNrcyB0aGUgdmFsdWUgYm91bmQgdG8gdGhlIG9wdGlvbiBlbGVtZW50LiBVbmxpa2UgdGhlIHZhbHVlIGJpbmRpbmcsXG4gICAqIG5nVmFsdWUgc3VwcG9ydHMgYmluZGluZyB0byBvYmplY3RzLlxuICAgKi9cbiAgQElucHV0KCduZ1ZhbHVlJylcbiAgc2V0IG5nVmFsdWUodmFsdWU6IGFueSkge1xuICAgIGlmICh0aGlzLl9zZWxlY3QgPT0gbnVsbCkgcmV0dXJuO1xuICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gICAgdGhpcy5fc2V0RWxlbWVudFZhbHVlKF9idWlsZFZhbHVlU3RyaW5nKHRoaXMuaWQsIHZhbHVlKSk7XG4gICAgdGhpcy5fc2VsZWN0LndyaXRlVmFsdWUodGhpcy5fc2VsZWN0LnZhbHVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAZGVzY3JpcHRpb25cbiAgICogVHJhY2tzIHNpbXBsZSBzdHJpbmcgdmFsdWVzIGJvdW5kIHRvIHRoZSBvcHRpb24gZWxlbWVudC5cbiAgICogRm9yIG9iamVjdHMsIHVzZSB0aGUgYG5nVmFsdWVgIGlucHV0IGJpbmRpbmcuXG4gICAqL1xuICBASW5wdXQoJ3ZhbHVlJylcbiAgc2V0IHZhbHVlKHZhbHVlOiBhbnkpIHtcbiAgICBpZiAodGhpcy5fc2VsZWN0KSB7XG4gICAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xuICAgICAgdGhpcy5fc2V0RWxlbWVudFZhbHVlKF9idWlsZFZhbHVlU3RyaW5nKHRoaXMuaWQsIHZhbHVlKSk7XG4gICAgICB0aGlzLl9zZWxlY3Qud3JpdGVWYWx1ZSh0aGlzLl9zZWxlY3QudmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9zZXRFbGVtZW50VmFsdWUodmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX3NldEVsZW1lbnRWYWx1ZSh2YWx1ZTogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5fcmVuZGVyZXIuc2V0UHJvcGVydHkodGhpcy5fZWxlbWVudC5uYXRpdmVFbGVtZW50LCAndmFsdWUnLCB2YWx1ZSk7XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIF9zZXRTZWxlY3RlZChzZWxlY3RlZDogYm9vbGVhbikge1xuICAgIHRoaXMuX3JlbmRlcmVyLnNldFByb3BlcnR5KHRoaXMuX2VsZW1lbnQubmF0aXZlRWxlbWVudCwgJ3NlbGVjdGVkJywgc2VsZWN0ZWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBMaWZlY3ljbGUgbWV0aG9kIGNhbGxlZCBiZWZvcmUgdGhlIGRpcmVjdGl2ZSdzIGluc3RhbmNlIGlzIGRlc3Ryb3llZC4gRm9yIGludGVybmFsIHVzZSBvbmx5LlxuICAgKi9cbiAgbmdPbkRlc3Ryb3koKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX3NlbGVjdCkge1xuICAgICAgdGhpcy5fc2VsZWN0Ll9vcHRpb25NYXAuZGVsZXRlKHRoaXMuaWQpO1xuICAgICAgdGhpcy5fc2VsZWN0LndyaXRlVmFsdWUodGhpcy5fc2VsZWN0LnZhbHVlKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==
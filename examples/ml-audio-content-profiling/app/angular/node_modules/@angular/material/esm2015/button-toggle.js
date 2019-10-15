/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { FocusMonitor } from '@angular/cdk/a11y';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { SelectionModel } from '@angular/cdk/collections';
import { Attribute, ChangeDetectionStrategy, ChangeDetectorRef, Component, ContentChildren, Directive, ElementRef, EventEmitter, forwardRef, Input, Optional, Output, ViewChild, ViewEncapsulation, InjectionToken, Inject, NgModule } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { mixinDisableRipple, MatCommonModule, MatRippleModule } from '@angular/material/core';

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * Injection token that can be used to configure the
 * default options for all button toggles within an app.
 * @type {?}
 */
const MAT_BUTTON_TOGGLE_DEFAULT_OPTIONS = new InjectionToken('MAT_BUTTON_TOGGLE_DEFAULT_OPTIONS');
/**
 * Provider Expression that allows mat-button-toggle-group to register as a ControlValueAccessor.
 * This allows it to support [(ngModel)].
 * \@docs-private
 * @type {?}
 */
const MAT_BUTTON_TOGGLE_GROUP_VALUE_ACCESSOR = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => MatButtonToggleGroup),
    multi: true
};
/**
 * @deprecated Use `MatButtonToggleGroup` instead.
 * \@breaking-change 8.0.0
 */
class MatButtonToggleGroupMultiple {
}
/** @type {?} */
let _uniqueIdCounter = 0;
/**
 * Change event object emitted by MatButtonToggle.
 */
class MatButtonToggleChange {
    /**
     * @param {?} source
     * @param {?} value
     */
    constructor(source, value) {
        this.source = source;
        this.value = value;
    }
}
/**
 * Exclusive selection button toggle group that behaves like a radio-button group.
 */
class MatButtonToggleGroup {
    /**
     * @param {?} _changeDetector
     * @param {?=} defaultOptions
     */
    constructor(_changeDetector, defaultOptions) {
        this._changeDetector = _changeDetector;
        this._vertical = false;
        this._multiple = false;
        this._disabled = false;
        /**
         * The method to be called in order to update ngModel.
         * Now `ngModel` binding is not supported in multiple selection mode.
         */
        this._controlValueAccessorChangeFn = () => { };
        /**
         * onTouch function registered via registerOnTouch (ControlValueAccessor).
         */
        this._onTouched = () => { };
        this._name = `mat-button-toggle-group-${_uniqueIdCounter++}`;
        /**
         * Event that emits whenever the value of the group changes.
         * Used to facilitate two-way data binding.
         * \@docs-private
         */
        this.valueChange = new EventEmitter();
        /**
         * Event emitted when the group's value changes.
         */
        this.change = new EventEmitter();
        this.appearance =
            defaultOptions && defaultOptions.appearance ? defaultOptions.appearance : 'standard';
    }
    /**
     * `name` attribute for the underlying `input` element.
     * @return {?}
     */
    get name() { return this._name; }
    /**
     * @param {?} value
     * @return {?}
     */
    set name(value) {
        this._name = value;
        if (this._buttonToggles) {
            this._buttonToggles.forEach(toggle => {
                toggle.name = this._name;
                toggle._markForCheck();
            });
        }
    }
    /**
     * Whether the toggle group is vertical.
     * @return {?}
     */
    get vertical() { return this._vertical; }
    /**
     * @param {?} value
     * @return {?}
     */
    set vertical(value) {
        this._vertical = coerceBooleanProperty(value);
    }
    /**
     * Value of the toggle group.
     * @return {?}
     */
    get value() {
        /** @type {?} */
        const selected = this._selectionModel ? this._selectionModel.selected : [];
        if (this.multiple) {
            return selected.map(toggle => toggle.value);
        }
        return selected[0] ? selected[0].value : undefined;
    }
    /**
     * @param {?} newValue
     * @return {?}
     */
    set value(newValue) {
        this._setSelectionByValue(newValue);
        this.valueChange.emit(this.value);
    }
    /**
     * Selected button toggles in the group.
     * @return {?}
     */
    get selected() {
        /** @type {?} */
        const selected = this._selectionModel.selected;
        return this.multiple ? selected : (selected[0] || null);
    }
    /**
     * Whether multiple button toggles can be selected.
     * @return {?}
     */
    get multiple() { return this._multiple; }
    /**
     * @param {?} value
     * @return {?}
     */
    set multiple(value) {
        this._multiple = coerceBooleanProperty(value);
    }
    /**
     * Whether multiple button toggle group is disabled.
     * @return {?}
     */
    get disabled() { return this._disabled; }
    /**
     * @param {?} value
     * @return {?}
     */
    set disabled(value) {
        this._disabled = coerceBooleanProperty(value);
        if (this._buttonToggles) {
            this._buttonToggles.forEach(toggle => toggle._markForCheck());
        }
    }
    /**
     * @return {?}
     */
    ngOnInit() {
        this._selectionModel = new SelectionModel(this.multiple, undefined, false);
    }
    /**
     * @return {?}
     */
    ngAfterContentInit() {
        this._selectionModel.select(...this._buttonToggles.filter(toggle => toggle.checked));
    }
    /**
     * Sets the model value. Implemented as part of ControlValueAccessor.
     * @param {?} value Value to be set to the model.
     * @return {?}
     */
    writeValue(value) {
        this.value = value;
        this._changeDetector.markForCheck();
    }
    // Implemented as part of ControlValueAccessor.
    /**
     * @param {?} fn
     * @return {?}
     */
    registerOnChange(fn) {
        this._controlValueAccessorChangeFn = fn;
    }
    // Implemented as part of ControlValueAccessor.
    /**
     * @param {?} fn
     * @return {?}
     */
    registerOnTouched(fn) {
        this._onTouched = fn;
    }
    // Implemented as part of ControlValueAccessor.
    /**
     * @param {?} isDisabled
     * @return {?}
     */
    setDisabledState(isDisabled) {
        this.disabled = isDisabled;
    }
    /**
     * Dispatch change event with current selection and group value.
     * @return {?}
     */
    _emitChangeEvent() {
        /** @type {?} */
        const selected = this.selected;
        /** @type {?} */
        const source = Array.isArray(selected) ? selected[selected.length - 1] : selected;
        /** @type {?} */
        const event = new MatButtonToggleChange((/** @type {?} */ (source)), this.value);
        this._controlValueAccessorChangeFn(event.value);
        this.change.emit(event);
    }
    /**
     * Syncs a button toggle's selected state with the model value.
     * @param {?} toggle Toggle to be synced.
     * @param {?} select Whether the toggle should be selected.
     * @param {?=} isUserInput Whether the change was a result of a user interaction.
     * @return {?}
     */
    _syncButtonToggle(toggle, select, isUserInput = false) {
        // Deselect the currently-selected toggle, if we're in single-selection
        // mode and the button being toggled isn't selected at the moment.
        if (!this.multiple && this.selected && !toggle.checked) {
            ((/** @type {?} */ (this.selected))).checked = false;
        }
        if (select) {
            this._selectionModel.select(toggle);
        }
        else {
            this._selectionModel.deselect(toggle);
        }
        // Only emit the change event for user input.
        if (isUserInput) {
            this._emitChangeEvent();
        }
        // Note: we emit this one no matter whether it was a user interaction, because
        // it is used by Angular to sync up the two-way data binding.
        this.valueChange.emit(this.value);
    }
    /**
     * Checks whether a button toggle is selected.
     * @param {?} toggle
     * @return {?}
     */
    _isSelected(toggle) {
        return this._selectionModel.isSelected(toggle);
    }
    /**
     * Determines whether a button toggle should be checked on init.
     * @param {?} toggle
     * @return {?}
     */
    _isPrechecked(toggle) {
        if (typeof this._rawValue === 'undefined') {
            return false;
        }
        if (this.multiple && Array.isArray(this._rawValue)) {
            return this._rawValue.some(value => toggle.value != null && value === toggle.value);
        }
        return toggle.value === this._rawValue;
    }
    /**
     * Updates the selection state of the toggles in the group based on a value.
     * @private
     * @param {?} value
     * @return {?}
     */
    _setSelectionByValue(value) {
        this._rawValue = value;
        if (!this._buttonToggles) {
            return;
        }
        if (this.multiple && value) {
            if (!Array.isArray(value)) {
                throw Error('Value must be an array in multiple-selection mode.');
            }
            this._clearSelection();
            value.forEach((currentValue) => this._selectValue(currentValue));
        }
        else {
            this._clearSelection();
            this._selectValue(value);
        }
    }
    /**
     * Clears the selected toggles.
     * @private
     * @return {?}
     */
    _clearSelection() {
        this._selectionModel.clear();
        this._buttonToggles.forEach(toggle => toggle.checked = false);
    }
    /**
     * Selects a value if there's a toggle that corresponds to it.
     * @private
     * @param {?} value
     * @return {?}
     */
    _selectValue(value) {
        /** @type {?} */
        const correspondingOption = this._buttonToggles.find(toggle => {
            return toggle.value != null && toggle.value === value;
        });
        if (correspondingOption) {
            correspondingOption.checked = true;
            this._selectionModel.select(correspondingOption);
        }
    }
}
MatButtonToggleGroup.decorators = [
    { type: Directive, args: [{
                selector: 'mat-button-toggle-group',
                providers: [
                    MAT_BUTTON_TOGGLE_GROUP_VALUE_ACCESSOR,
                    { provide: MatButtonToggleGroupMultiple, useExisting: MatButtonToggleGroup },
                ],
                host: {
                    'role': 'group',
                    'class': 'mat-button-toggle-group',
                    '[attr.aria-disabled]': 'disabled',
                    '[class.mat-button-toggle-vertical]': 'vertical',
                    '[class.mat-button-toggle-group-appearance-standard]': 'appearance === "standard"',
                },
                exportAs: 'matButtonToggleGroup',
            },] },
];
/** @nocollapse */
MatButtonToggleGroup.ctorParameters = () => [
    { type: ChangeDetectorRef },
    { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: [MAT_BUTTON_TOGGLE_DEFAULT_OPTIONS,] }] }
];
MatButtonToggleGroup.propDecorators = {
    _buttonToggles: [{ type: ContentChildren, args: [forwardRef(() => MatButtonToggle),] }],
    appearance: [{ type: Input }],
    name: [{ type: Input }],
    vertical: [{ type: Input }],
    value: [{ type: Input }],
    valueChange: [{ type: Output }],
    multiple: [{ type: Input }],
    disabled: [{ type: Input }],
    change: [{ type: Output }]
};
// Boilerplate for applying mixins to the MatButtonToggle class.
/**
 * \@docs-private
 */
class MatButtonToggleBase {
}
/** @type {?} */
const _MatButtonToggleMixinBase = mixinDisableRipple(MatButtonToggleBase);
/**
 * Single button inside of a toggle group.
 */
class MatButtonToggle extends _MatButtonToggleMixinBase {
    /**
     * @param {?} toggleGroup
     * @param {?} _changeDetectorRef
     * @param {?} _elementRef
     * @param {?} _focusMonitor
     * @param {?} defaultTabIndex
     * @param {?=} defaultOptions
     */
    constructor(toggleGroup, _changeDetectorRef, _elementRef, _focusMonitor, 
    // @breaking-change 8.0.0 `defaultTabIndex` to be made a required parameter.
    defaultTabIndex, defaultOptions) {
        super();
        this._changeDetectorRef = _changeDetectorRef;
        this._elementRef = _elementRef;
        this._focusMonitor = _focusMonitor;
        this._isSingleSelector = false;
        this._checked = false;
        /**
         * Users can specify the `aria-labelledby` attribute which will be forwarded to the input element
         */
        this.ariaLabelledby = null;
        this._disabled = false;
        /**
         * Event emitted when the group value changes.
         */
        this.change = new EventEmitter();
        /** @type {?} */
        const parsedTabIndex = Number(defaultTabIndex);
        this.tabIndex = (parsedTabIndex || parsedTabIndex === 0) ? parsedTabIndex : null;
        this.buttonToggleGroup = toggleGroup;
        this.appearance =
            defaultOptions && defaultOptions.appearance ? defaultOptions.appearance : 'standard';
    }
    /**
     * Unique ID for the underlying `button` element.
     * @return {?}
     */
    get buttonId() { return `${this.id}-button`; }
    /**
     * The appearance style of the button.
     * @return {?}
     */
    get appearance() {
        return this.buttonToggleGroup ? this.buttonToggleGroup.appearance : this._appearance;
    }
    /**
     * @param {?} value
     * @return {?}
     */
    set appearance(value) {
        this._appearance = value;
    }
    /**
     * Whether the button is checked.
     * @return {?}
     */
    get checked() {
        return this.buttonToggleGroup ? this.buttonToggleGroup._isSelected(this) : this._checked;
    }
    /**
     * @param {?} value
     * @return {?}
     */
    set checked(value) {
        /** @type {?} */
        const newValue = coerceBooleanProperty(value);
        if (newValue !== this._checked) {
            this._checked = newValue;
            if (this.buttonToggleGroup) {
                this.buttonToggleGroup._syncButtonToggle(this, this._checked);
            }
            this._changeDetectorRef.markForCheck();
        }
    }
    /**
     * Whether the button is disabled.
     * @return {?}
     */
    get disabled() {
        return this._disabled || (this.buttonToggleGroup && this.buttonToggleGroup.disabled);
    }
    /**
     * @param {?} value
     * @return {?}
     */
    set disabled(value) { this._disabled = coerceBooleanProperty(value); }
    /**
     * @return {?}
     */
    ngOnInit() {
        this._isSingleSelector = this.buttonToggleGroup && !this.buttonToggleGroup.multiple;
        this._type = this._isSingleSelector ? 'radio' : 'checkbox';
        this.id = this.id || `mat-button-toggle-${_uniqueIdCounter++}`;
        if (this._isSingleSelector) {
            this.name = this.buttonToggleGroup.name;
        }
        if (this.buttonToggleGroup && this.buttonToggleGroup._isPrechecked(this)) {
            this.checked = true;
        }
        this._focusMonitor.monitor(this._elementRef, true);
    }
    /**
     * @return {?}
     */
    ngOnDestroy() {
        /** @type {?} */
        const group = this.buttonToggleGroup;
        this._focusMonitor.stopMonitoring(this._elementRef);
        // Remove the toggle from the selection once it's destroyed. Needs to happen
        // on the next tick in order to avoid "changed after checked" errors.
        if (group && group._isSelected(this)) {
            Promise.resolve().then(() => group._syncButtonToggle(this, false));
        }
    }
    /**
     * Focuses the button.
     * @return {?}
     */
    focus() {
        this._buttonElement.nativeElement.focus();
    }
    /**
     * Checks the button toggle due to an interaction with the underlying native button.
     * @return {?}
     */
    _onButtonClick() {
        /** @type {?} */
        const newChecked = this._isSingleSelector ? true : !this._checked;
        if (newChecked !== this._checked) {
            this._checked = newChecked;
            if (this.buttonToggleGroup) {
                this.buttonToggleGroup._syncButtonToggle(this, this._checked, true);
                this.buttonToggleGroup._onTouched();
            }
        }
        // Emit a change event when it's the single selector
        this.change.emit(new MatButtonToggleChange(this, this.value));
    }
    /**
     * Marks the button toggle as needing checking for change detection.
     * This method is exposed because the parent button toggle group will directly
     * update bound properties of the radio button.
     * @return {?}
     */
    _markForCheck() {
        // When the group value changes, the button will not be notified.
        // Use `markForCheck` to explicit update button toggle's status.
        this._changeDetectorRef.markForCheck();
    }
}
MatButtonToggle.decorators = [
    { type: Component, args: [{selector: 'mat-button-toggle',
                template: "<button #button class=\"mat-button-toggle-button\" type=\"button\" [id]=\"buttonId\" [attr.tabindex]=\"disabled ? -1 : tabIndex\" [attr.aria-pressed]=\"checked\" [disabled]=\"disabled || null\" [attr.name]=\"name || null\" [attr.aria-label]=\"ariaLabel\" [attr.aria-labelledby]=\"ariaLabelledby\" (click)=\"_onButtonClick()\"><div class=\"mat-button-toggle-label-content\"><ng-content></ng-content></div></button><div class=\"mat-button-toggle-focus-overlay\"></div><div class=\"mat-button-toggle-ripple\" matRipple [matRippleTrigger]=\"button\" [matRippleDisabled]=\"this.disableRipple || this.disabled\"></div>",
                styles: [".mat-button-toggle-group,.mat-button-toggle-standalone{position:relative;display:inline-flex;flex-direction:row;white-space:nowrap;overflow:hidden;border-radius:2px;-webkit-tap-highlight-color:transparent}@media (-ms-high-contrast:active){.mat-button-toggle-group,.mat-button-toggle-standalone{outline:solid 1px}}.mat-button-toggle-group-appearance-standard,.mat-button-toggle-standalone.mat-button-toggle-appearance-standard{border-radius:4px}@media (-ms-high-contrast:active){.mat-button-toggle-group-appearance-standard,.mat-button-toggle-standalone.mat-button-toggle-appearance-standard{outline:0}}.mat-button-toggle-vertical{flex-direction:column}.mat-button-toggle-vertical .mat-button-toggle-label-content{display:block}.mat-button-toggle{white-space:nowrap;position:relative}.mat-button-toggle .mat-icon svg{vertical-align:top}.mat-button-toggle.cdk-keyboard-focused .mat-button-toggle-focus-overlay{opacity:1}@media (-ms-high-contrast:active){.mat-button-toggle.cdk-keyboard-focused .mat-button-toggle-focus-overlay{opacity:.5}}.mat-button-toggle-appearance-standard:not(.mat-button-toggle-disabled):hover .mat-button-toggle-focus-overlay{opacity:.04}.mat-button-toggle-appearance-standard.cdk-keyboard-focused:not(.mat-button-toggle-disabled) .mat-button-toggle-focus-overlay{opacity:.12}@media (-ms-high-contrast:active){.mat-button-toggle-appearance-standard.cdk-keyboard-focused:not(.mat-button-toggle-disabled) .mat-button-toggle-focus-overlay{opacity:.5}}@media (hover:none){.mat-button-toggle-appearance-standard:not(.mat-button-toggle-disabled):hover .mat-button-toggle-focus-overlay{display:none}}.mat-button-toggle-label-content{-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;display:inline-block;line-height:36px;padding:0 16px;position:relative}.mat-button-toggle-appearance-standard .mat-button-toggle-label-content{line-height:48px;padding:0 12px}.mat-button-toggle-label-content>*{vertical-align:middle}.mat-button-toggle-focus-overlay{border-radius:inherit;pointer-events:none;opacity:0;top:0;left:0;right:0;bottom:0;position:absolute}.mat-button-toggle-checked .mat-button-toggle-focus-overlay{border-bottom:solid 36px}@media (-ms-high-contrast:active){.mat-button-toggle-checked .mat-button-toggle-focus-overlay{opacity:.5;height:0}}@media (-ms-high-contrast:active){.mat-button-toggle-checked.mat-button-toggle-appearance-standard .mat-button-toggle-focus-overlay{border-bottom:solid 48px}}.mat-button-toggle .mat-button-toggle-ripple{top:0;left:0;right:0;bottom:0;position:absolute;pointer-events:none}.mat-button-toggle-button{border:0;background:0 0;color:inherit;padding:0;margin:0;font:inherit;outline:0;width:100%;cursor:pointer}.mat-button-toggle-disabled .mat-button-toggle-button{cursor:default}.mat-button-toggle-button::-moz-focus-inner{border:0}"],
                encapsulation: ViewEncapsulation.None,
                exportAs: 'matButtonToggle',
                changeDetection: ChangeDetectionStrategy.OnPush,
                inputs: ['disableRipple'],
                host: {
                    '[class.mat-button-toggle-standalone]': '!buttonToggleGroup',
                    '[class.mat-button-toggle-checked]': 'checked',
                    '[class.mat-button-toggle-disabled]': 'disabled',
                    '[class.mat-button-toggle-appearance-standard]': 'appearance === "standard"',
                    'class': 'mat-button-toggle',
                    // Always reset the tabindex to -1 so it doesn't conflict with the one on the `button`,
                    // but can still receive focus from things like cdkFocusInitial.
                    '[attr.tabindex]': '-1',
                    '[attr.id]': 'id',
                    '(focus)': 'focus()',
                }
            },] },
];
/** @nocollapse */
MatButtonToggle.ctorParameters = () => [
    { type: MatButtonToggleGroup, decorators: [{ type: Optional }] },
    { type: ChangeDetectorRef },
    { type: ElementRef },
    { type: FocusMonitor },
    { type: String, decorators: [{ type: Attribute, args: ['tabindex',] }] },
    { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: [MAT_BUTTON_TOGGLE_DEFAULT_OPTIONS,] }] }
];
MatButtonToggle.propDecorators = {
    ariaLabel: [{ type: Input, args: ['aria-label',] }],
    ariaLabelledby: [{ type: Input, args: ['aria-labelledby',] }],
    _buttonElement: [{ type: ViewChild, args: ['button',] }],
    id: [{ type: Input }],
    name: [{ type: Input }],
    value: [{ type: Input }],
    tabIndex: [{ type: Input }],
    appearance: [{ type: Input }],
    checked: [{ type: Input }],
    disabled: [{ type: Input }],
    change: [{ type: Output }]
};

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
class MatButtonToggleModule {
}
MatButtonToggleModule.decorators = [
    { type: NgModule, args: [{
                imports: [MatCommonModule, MatRippleModule],
                exports: [MatCommonModule, MatButtonToggleGroup, MatButtonToggle],
                declarations: [MatButtonToggleGroup, MatButtonToggle],
            },] },
];

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */

export { MAT_BUTTON_TOGGLE_DEFAULT_OPTIONS, MAT_BUTTON_TOGGLE_GROUP_VALUE_ACCESSOR, MatButtonToggleGroupMultiple, MatButtonToggleChange, MatButtonToggleGroup, MatButtonToggleBase, _MatButtonToggleMixinBase, MatButtonToggle, MatButtonToggleModule };
//# sourceMappingURL=button-toggle.js.map

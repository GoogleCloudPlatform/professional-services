/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectionToken, Attribute, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, forwardRef, Input, Output, ViewChild, ViewEncapsulation, NgZone, Optional, Inject, NgModule } from '@angular/core';
import { __extends } from 'tslib';
import { FocusMonitor } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Platform } from '@angular/cdk/platform';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { mixinColor, mixinDisabled, mixinDisableRipple, mixinTabIndex, GestureConfig, MatCommonModule, MatRippleModule } from '@angular/material/core';
import { ANIMATION_MODULE_TYPE } from '@angular/platform-browser/animations';
import { ObserversModule } from '@angular/cdk/observers';
import { HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * Injection token to be used to override the default options for `mat-slide-toggle`.
 * @type {?}
 */
var MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS = new InjectionToken('mat-slide-toggle-default-options', {
    providedIn: 'root',
    factory: function () { return ({ disableToggleValue: false, disableDragValue: false }); }
});

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
// Increasing integer for generating unique ids for slide-toggle components.
/** @type {?} */
var nextUniqueId = 0;
/**
 * \@docs-private
 * @type {?}
 */
var MAT_SLIDE_TOGGLE_VALUE_ACCESSOR = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(function () { return MatSlideToggle; }),
    multi: true
};
/**
 * Change event object emitted by a MatSlideToggle.
 */
var  /**
 * Change event object emitted by a MatSlideToggle.
 */
MatSlideToggleChange = /** @class */ (function () {
    function MatSlideToggleChange(source, checked) {
        this.source = source;
        this.checked = checked;
    }
    return MatSlideToggleChange;
}());
// Boilerplate for applying mixins to MatSlideToggle.
/**
 * \@docs-private
 */
var  
// Boilerplate for applying mixins to MatSlideToggle.
/**
 * \@docs-private
 */
MatSlideToggleBase = /** @class */ (function () {
    function MatSlideToggleBase(_elementRef) {
        this._elementRef = _elementRef;
    }
    return MatSlideToggleBase;
}());
/** @type {?} */
var _MatSlideToggleMixinBase = mixinTabIndex(mixinColor(mixinDisableRipple(mixinDisabled(MatSlideToggleBase)), 'accent'));
/**
 * Represents a slidable "switch" toggle that can be moved between on and off.
 */
var MatSlideToggle = /** @class */ (function (_super) {
    __extends(MatSlideToggle, _super);
    function MatSlideToggle(elementRef, 
    /**
     * @deprecated The `_platform` parameter to be removed.
     * @breaking-change 8.0.0
     */
    _platform, _focusMonitor, _changeDetectorRef, tabIndex, _ngZone, defaults, _animationMode, _dir) {
        var _this = _super.call(this, elementRef) || this;
        _this._focusMonitor = _focusMonitor;
        _this._changeDetectorRef = _changeDetectorRef;
        _this._ngZone = _ngZone;
        _this.defaults = defaults;
        _this._animationMode = _animationMode;
        _this._dir = _dir;
        _this.onChange = function (_) { };
        _this.onTouched = function () { };
        _this._uniqueId = "mat-slide-toggle-" + ++nextUniqueId;
        _this._required = false;
        _this._checked = false;
        /**
         * Whether the thumb is currently being dragged.
         */
        _this._dragging = false;
        /**
         * Name value will be applied to the input element if present.
         */
        _this.name = null;
        /**
         * A unique id for the slide-toggle input. If none is supplied, it will be auto-generated.
         */
        _this.id = _this._uniqueId;
        /**
         * Whether the label should appear after or before the slide-toggle. Defaults to 'after'.
         */
        _this.labelPosition = 'after';
        /**
         * Used to set the aria-label attribute on the underlying input element.
         */
        _this.ariaLabel = null;
        /**
         * Used to set the aria-labelledby attribute on the underlying input element.
         */
        _this.ariaLabelledby = null;
        /**
         * An event will be dispatched each time the slide-toggle changes its value.
         */
        _this.change = new EventEmitter();
        /**
         * An event will be dispatched each time the slide-toggle input is toggled.
         * This event is always emitted when the user toggles the slide toggle, but this does not mean
         * the slide toggle's value has changed. The event does not fire when the user drags to change
         * the slide toggle value.
         */
        _this.toggleChange = new EventEmitter();
        /**
         * An event will be dispatched each time the slide-toggle is dragged.
         * This event is always emitted when the user drags the slide toggle to make a change greater
         * than 50%. It does not mean the slide toggle's value is changed. The event is not emitted when
         * the user toggles the slide toggle to change its value.
         */
        _this.dragChange = new EventEmitter();
        _this.tabIndex = parseInt(tabIndex) || 0;
        return _this;
    }
    Object.defineProperty(MatSlideToggle.prototype, "required", {
        /** Whether the slide-toggle is required. */
        get: /**
         * Whether the slide-toggle is required.
         * @return {?}
         */
        function () { return this._required; },
        set: /**
         * @param {?} value
         * @return {?}
         */
        function (value) { this._required = coerceBooleanProperty(value); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MatSlideToggle.prototype, "checked", {
        /** Whether the slide-toggle element is checked or not. */
        get: /**
         * Whether the slide-toggle element is checked or not.
         * @return {?}
         */
        function () { return this._checked; },
        set: /**
         * @param {?} value
         * @return {?}
         */
        function (value) {
            this._checked = coerceBooleanProperty(value);
            this._changeDetectorRef.markForCheck();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MatSlideToggle.prototype, "inputId", {
        /** Returns the unique id for the visual hidden input. */
        get: /**
         * Returns the unique id for the visual hidden input.
         * @return {?}
         */
        function () { return (this.id || this._uniqueId) + "-input"; },
        enumerable: true,
        configurable: true
    });
    /**
     * @return {?}
     */
    MatSlideToggle.prototype.ngAfterContentInit = /**
     * @return {?}
     */
    function () {
        var _this = this;
        this._focusMonitor
            .monitor(this._elementRef, true)
            .subscribe(function (focusOrigin) {
            if (!focusOrigin) {
                // When a focused element becomes disabled, the browser *immediately* fires a blur event.
                // Angular does not expect events to be raised during change detection, so any state
                // change (such as a form control's 'ng-touched') will cause a changed-after-checked
                // error. See https://github.com/angular/angular/issues/17793. To work around this,
                // we defer telling the form control it has been touched until the next tick.
                Promise.resolve().then(function () { return _this.onTouched(); });
            }
        });
    };
    /**
     * @return {?}
     */
    MatSlideToggle.prototype.ngOnDestroy = /**
     * @return {?}
     */
    function () {
        this._focusMonitor.stopMonitoring(this._elementRef);
    };
    /** Method being called whenever the underlying input emits a change event. */
    /**
     * Method being called whenever the underlying input emits a change event.
     * @param {?} event
     * @return {?}
     */
    MatSlideToggle.prototype._onChangeEvent = /**
     * Method being called whenever the underlying input emits a change event.
     * @param {?} event
     * @return {?}
     */
    function (event) {
        // We always have to stop propagation on the change event.
        // Otherwise the change event, from the input element, will bubble up and
        // emit its event object to the component's `change` output.
        event.stopPropagation();
        if (!this._dragging) {
            this.toggleChange.emit();
        }
        // Releasing the pointer over the `<label>` element while dragging triggers another
        // click event on the `<label>` element. This means that the checked state of the underlying
        // input changed unintentionally and needs to be changed back. Or when the slide toggle's config
        // disabled toggle change event by setting `disableToggleValue: true`, the slide toggle's value
        // does not change, and the checked state of the underlying input needs to be changed back.
        if (this._dragging || this.defaults.disableToggleValue) {
            this._inputElement.nativeElement.checked = this.checked;
            return;
        }
        // Sync the value from the underlying input element with the component instance.
        this.checked = this._inputElement.nativeElement.checked;
        // Emit our custom change event only if the underlying input emitted one. This ensures that
        // there is no change event, when the checked state changes programmatically.
        this._emitChangeEvent();
    };
    /** Method being called whenever the slide-toggle has been clicked. */
    /**
     * Method being called whenever the slide-toggle has been clicked.
     * @param {?} event
     * @return {?}
     */
    MatSlideToggle.prototype._onInputClick = /**
     * Method being called whenever the slide-toggle has been clicked.
     * @param {?} event
     * @return {?}
     */
    function (event) {
        // We have to stop propagation for click events on the visual hidden input element.
        // By default, when a user clicks on a label element, a generated click event will be
        // dispatched on the associated input element. Since we are using a label element as our
        // root container, the click event on the `slide-toggle` will be executed twice.
        // The real click event will bubble up, and the generated click event also tries to bubble up.
        // This will lead to multiple click events.
        // Preventing bubbling for the second event will solve that issue.
        event.stopPropagation();
    };
    /** Implemented as part of ControlValueAccessor. */
    /**
     * Implemented as part of ControlValueAccessor.
     * @param {?} value
     * @return {?}
     */
    MatSlideToggle.prototype.writeValue = /**
     * Implemented as part of ControlValueAccessor.
     * @param {?} value
     * @return {?}
     */
    function (value) {
        this.checked = !!value;
    };
    /** Implemented as part of ControlValueAccessor. */
    /**
     * Implemented as part of ControlValueAccessor.
     * @param {?} fn
     * @return {?}
     */
    MatSlideToggle.prototype.registerOnChange = /**
     * Implemented as part of ControlValueAccessor.
     * @param {?} fn
     * @return {?}
     */
    function (fn) {
        this.onChange = fn;
    };
    /** Implemented as part of ControlValueAccessor. */
    /**
     * Implemented as part of ControlValueAccessor.
     * @param {?} fn
     * @return {?}
     */
    MatSlideToggle.prototype.registerOnTouched = /**
     * Implemented as part of ControlValueAccessor.
     * @param {?} fn
     * @return {?}
     */
    function (fn) {
        this.onTouched = fn;
    };
    /** Implemented as a part of ControlValueAccessor. */
    /**
     * Implemented as a part of ControlValueAccessor.
     * @param {?} isDisabled
     * @return {?}
     */
    MatSlideToggle.prototype.setDisabledState = /**
     * Implemented as a part of ControlValueAccessor.
     * @param {?} isDisabled
     * @return {?}
     */
    function (isDisabled) {
        this.disabled = isDisabled;
        this._changeDetectorRef.markForCheck();
    };
    /** Focuses the slide-toggle. */
    /**
     * Focuses the slide-toggle.
     * @return {?}
     */
    MatSlideToggle.prototype.focus = /**
     * Focuses the slide-toggle.
     * @return {?}
     */
    function () {
        this._focusMonitor.focusVia(this._inputElement, 'keyboard');
    };
    /** Toggles the checked state of the slide-toggle. */
    /**
     * Toggles the checked state of the slide-toggle.
     * @return {?}
     */
    MatSlideToggle.prototype.toggle = /**
     * Toggles the checked state of the slide-toggle.
     * @return {?}
     */
    function () {
        this.checked = !this.checked;
        this.onChange(this.checked);
    };
    /**
     * Emits a change event on the `change` output. Also notifies the FormControl about the change.
     */
    /**
     * Emits a change event on the `change` output. Also notifies the FormControl about the change.
     * @private
     * @return {?}
     */
    MatSlideToggle.prototype._emitChangeEvent = /**
     * Emits a change event on the `change` output. Also notifies the FormControl about the change.
     * @private
     * @return {?}
     */
    function () {
        this.onChange(this.checked);
        this.change.emit(new MatSlideToggleChange(this, this.checked));
    };
    /** Retrieves the percentage of thumb from the moved distance. Percentage as fraction of 100. */
    /**
     * Retrieves the percentage of thumb from the moved distance. Percentage as fraction of 100.
     * @private
     * @param {?} distance
     * @return {?}
     */
    MatSlideToggle.prototype._getDragPercentage = /**
     * Retrieves the percentage of thumb from the moved distance. Percentage as fraction of 100.
     * @private
     * @param {?} distance
     * @return {?}
     */
    function (distance) {
        /** @type {?} */
        var percentage = (distance / this._thumbBarWidth) * 100;
        // When the toggle was initially checked, then we have to start the drag at the end.
        if (this._previousChecked) {
            percentage += 100;
        }
        return Math.max(0, Math.min(percentage, 100));
    };
    /**
     * @return {?}
     */
    MatSlideToggle.prototype._onDragStart = /**
     * @return {?}
     */
    function () {
        if (!this.disabled && !this._dragging) {
            /** @type {?} */
            var thumbEl = this._thumbEl.nativeElement;
            this._thumbBarWidth = this._thumbBarEl.nativeElement.clientWidth - thumbEl.clientWidth;
            thumbEl.classList.add('mat-dragging');
            this._previousChecked = this.checked;
            this._dragging = true;
        }
    };
    /**
     * @param {?} event
     * @return {?}
     */
    MatSlideToggle.prototype._onDrag = /**
     * @param {?} event
     * @return {?}
     */
    function (event) {
        if (this._dragging) {
            /** @type {?} */
            var direction = this._dir && this._dir.value === 'rtl' ? -1 : 1;
            this._dragPercentage = this._getDragPercentage(event.deltaX * direction);
            // Calculate the moved distance based on the thumb bar width.
            /** @type {?} */
            var dragX = (this._dragPercentage / 100) * this._thumbBarWidth * direction;
            this._thumbEl.nativeElement.style.transform = "translate3d(" + dragX + "px, 0, 0)";
        }
    };
    /**
     * @return {?}
     */
    MatSlideToggle.prototype._onDragEnd = /**
     * @return {?}
     */
    function () {
        var _this = this;
        if (this._dragging) {
            /** @type {?} */
            var newCheckedValue = this._dragPercentage > 50;
            if (newCheckedValue !== this.checked) {
                this.dragChange.emit();
                if (!this.defaults.disableDragValue) {
                    this.checked = newCheckedValue;
                    this._emitChangeEvent();
                }
            }
            // The drag should be stopped outside of the current event handler, otherwise the
            // click event will be fired before it and will revert the drag change.
            this._ngZone.runOutsideAngular(function () { return setTimeout(function () {
                if (_this._dragging) {
                    _this._dragging = false;
                    _this._thumbEl.nativeElement.classList.remove('mat-dragging');
                    // Reset the transform because the component will take care
                    // of the thumb position after drag.
                    _this._thumbEl.nativeElement.style.transform = '';
                }
            }); });
        }
    };
    /** Method being called whenever the label text changes. */
    /**
     * Method being called whenever the label text changes.
     * @return {?}
     */
    MatSlideToggle.prototype._onLabelTextChange = /**
     * Method being called whenever the label text changes.
     * @return {?}
     */
    function () {
        // Since the event of the `cdkObserveContent` directive runs outside of the zone, the
        // slide-toggle component will be only marked for check, but no actual change detection runs
        // automatically. Instead of going back into the zone in order to trigger a change detection
        // which causes *all* components to be checked (if explicitly marked or not using OnPush),
        // we only trigger an explicit change detection for the slide-toggle view and it's children.
        this._changeDetectorRef.detectChanges();
    };
    MatSlideToggle.decorators = [
        { type: Component, args: [{selector: 'mat-slide-toggle',
                    exportAs: 'matSlideToggle',
                    host: {
                        'class': 'mat-slide-toggle',
                        '[id]': 'id',
                        // Needs to be `-1` so it can still receive programmatic focus.
                        '[attr.tabindex]': 'disabled ? null : -1',
                        '[class.mat-checked]': 'checked',
                        '[class.mat-disabled]': 'disabled',
                        '[class.mat-slide-toggle-label-before]': 'labelPosition == "before"',
                        '[class._mat-animation-noopable]': '_animationMode === "NoopAnimations"',
                        '(focus)': '_inputElement.nativeElement.focus()',
                    },
                    template: "<label [attr.for]=\"inputId\" class=\"mat-slide-toggle-label\" #label><div #toggleBar class=\"mat-slide-toggle-bar\" [class.mat-slide-toggle-bar-no-side-margin]=\"!labelContent.textContent || !labelContent.textContent.trim()\"><input #input class=\"mat-slide-toggle-input cdk-visually-hidden\" type=\"checkbox\" role=\"switch\" [id]=\"inputId\" [required]=\"required\" [tabIndex]=\"tabIndex\" [checked]=\"checked\" [disabled]=\"disabled\" [attr.name]=\"name\" [attr.aria-checked]=\"checked.toString()\" [attr.aria-label]=\"ariaLabel\" [attr.aria-labelledby]=\"ariaLabelledby\" (change)=\"_onChangeEvent($event)\" (click)=\"_onInputClick($event)\"><div class=\"mat-slide-toggle-thumb-container\" #thumbContainer (slidestart)=\"_onDragStart()\" (slide)=\"_onDrag($event)\" (slideend)=\"_onDragEnd()\"><div class=\"mat-slide-toggle-thumb\"></div><div class=\"mat-slide-toggle-ripple\" mat-ripple [matRippleTrigger]=\"label\" [matRippleDisabled]=\"disableRipple || disabled\" [matRippleCentered]=\"true\" [matRippleRadius]=\"20\" [matRippleAnimation]=\"{enterDuration: 150}\"><div class=\"mat-ripple-element mat-slide-toggle-persistent-ripple\"></div></div></div></div><span class=\"mat-slide-toggle-content\" #labelContent (cdkObserveContent)=\"_onLabelTextChange()\"><span style=\"display:none\">&nbsp;</span><ng-content></ng-content></span></label>",
                    styles: [".mat-slide-toggle{display:inline-block;height:24px;max-width:100%;line-height:24px;white-space:nowrap;outline:0;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}.mat-slide-toggle.mat-checked .mat-slide-toggle-thumb-container{transform:translate3d(16px,0,0)}[dir=rtl] .mat-slide-toggle.mat-checked .mat-slide-toggle-thumb-container{transform:translate3d(-16px,0,0)}.mat-slide-toggle.mat-disabled{opacity:.38}.mat-slide-toggle.mat-disabled .mat-slide-toggle-label,.mat-slide-toggle.mat-disabled .mat-slide-toggle-thumb-container{cursor:default}.mat-slide-toggle-label{display:flex;flex:1;flex-direction:row;align-items:center;height:inherit;cursor:pointer}.mat-slide-toggle-content{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mat-slide-toggle-label-before .mat-slide-toggle-label{order:1}.mat-slide-toggle-label-before .mat-slide-toggle-bar{order:2}.mat-slide-toggle-bar,[dir=rtl] .mat-slide-toggle-label-before .mat-slide-toggle-bar{margin-right:8px;margin-left:0}.mat-slide-toggle-label-before .mat-slide-toggle-bar,[dir=rtl] .mat-slide-toggle-bar{margin-left:8px;margin-right:0}.mat-slide-toggle-bar-no-side-margin{margin-left:0;margin-right:0}.mat-slide-toggle-thumb-container{position:absolute;z-index:1;width:20px;height:20px;top:-3px;left:0;transform:translate3d(0,0,0);transition:all 80ms linear;transition-property:transform;cursor:-webkit-grab;cursor:grab}.mat-slide-toggle-thumb-container.mat-dragging,.mat-slide-toggle-thumb-container:active{cursor:-webkit-grabbing;cursor:grabbing;transition-duration:0s}._mat-animation-noopable .mat-slide-toggle-thumb-container{transition:none}[dir=rtl] .mat-slide-toggle-thumb-container{left:auto;right:0}.mat-slide-toggle-thumb{height:20px;width:20px;border-radius:50%}.mat-slide-toggle-bar{position:relative;width:36px;height:14px;flex-shrink:0;border-radius:8px}.mat-slide-toggle-input{bottom:0;left:10px}[dir=rtl] .mat-slide-toggle-input{left:auto;right:10px}.mat-slide-toggle-bar,.mat-slide-toggle-thumb{transition:all 80ms linear;transition-property:background-color;transition-delay:50ms}._mat-animation-noopable .mat-slide-toggle-bar,._mat-animation-noopable .mat-slide-toggle-thumb{transition:none}.mat-slide-toggle .mat-slide-toggle-ripple{position:absolute;top:calc(50% - 20px);left:calc(50% - 20px);height:40px;width:40px;z-index:1;pointer-events:none}.mat-slide-toggle .mat-slide-toggle-ripple .mat-ripple-element:not(.mat-slide-toggle-persistent-ripple){opacity:.12}.mat-slide-toggle-persistent-ripple{width:100%;height:100%;transform:none}.mat-slide-toggle-bar:hover .mat-slide-toggle-persistent-ripple{opacity:.04}.mat-slide-toggle:not(.mat-disabled).cdk-focused .mat-slide-toggle-persistent-ripple{opacity:.12}.mat-slide-toggle-persistent-ripple,.mat-slide-toggle.mat-disabled .mat-slide-toggle-bar:hover .mat-slide-toggle-persistent-ripple{opacity:0}@media (hover:none){.mat-slide-toggle-bar:hover .mat-slide-toggle-persistent-ripple{display:none}}@media (-ms-high-contrast:active){.mat-slide-toggle-thumb{background:#fff;border:1px solid #000}.mat-slide-toggle.mat-checked .mat-slide-toggle-thumb{background:#000;border:1px solid #fff}.mat-slide-toggle-bar{background:#fff}.mat-slide-toggle.cdk-keyboard-focused .mat-slide-toggle-bar{outline:1px dotted;outline-offset:5px}}@media (-ms-high-contrast:black-on-white){.mat-slide-toggle-bar{border:1px solid #000}}"],
                    providers: [MAT_SLIDE_TOGGLE_VALUE_ACCESSOR],
                    inputs: ['disabled', 'disableRipple', 'color', 'tabIndex'],
                    encapsulation: ViewEncapsulation.None,
                    changeDetection: ChangeDetectionStrategy.OnPush,
                },] },
    ];
    /** @nocollapse */
    MatSlideToggle.ctorParameters = function () { return [
        { type: ElementRef },
        { type: Platform },
        { type: FocusMonitor },
        { type: ChangeDetectorRef },
        { type: String, decorators: [{ type: Attribute, args: ['tabindex',] }] },
        { type: NgZone },
        { type: undefined, decorators: [{ type: Inject, args: [MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS,] }] },
        { type: String, decorators: [{ type: Optional }, { type: Inject, args: [ANIMATION_MODULE_TYPE,] }] },
        { type: Directionality, decorators: [{ type: Optional }] }
    ]; };
    MatSlideToggle.propDecorators = {
        _thumbEl: [{ type: ViewChild, args: ['thumbContainer',] }],
        _thumbBarEl: [{ type: ViewChild, args: ['toggleBar',] }],
        name: [{ type: Input }],
        id: [{ type: Input }],
        labelPosition: [{ type: Input }],
        ariaLabel: [{ type: Input, args: ['aria-label',] }],
        ariaLabelledby: [{ type: Input, args: ['aria-labelledby',] }],
        required: [{ type: Input }],
        checked: [{ type: Input }],
        change: [{ type: Output }],
        toggleChange: [{ type: Output }],
        dragChange: [{ type: Output }],
        _inputElement: [{ type: ViewChild, args: ['input',] }]
    };
    return MatSlideToggle;
}(_MatSlideToggleMixinBase));

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
var MatSlideToggleModule = /** @class */ (function () {
    function MatSlideToggleModule() {
    }
    MatSlideToggleModule.decorators = [
        { type: NgModule, args: [{
                    imports: [MatRippleModule, MatCommonModule, ObserversModule],
                    exports: [MatSlideToggle, MatCommonModule],
                    declarations: [MatSlideToggle],
                    providers: [
                        { provide: HAMMER_GESTURE_CONFIG, useClass: GestureConfig }
                    ],
                },] },
    ];
    return MatSlideToggleModule;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */

export { MatSlideToggleModule, MAT_SLIDE_TOGGLE_VALUE_ACCESSOR, MatSlideToggleChange, MatSlideToggleBase, _MatSlideToggleMixinBase, MatSlideToggle, MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS };
//# sourceMappingURL=slide-toggle.es5.js.map

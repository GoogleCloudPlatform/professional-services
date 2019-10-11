/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/cdk/a11y'), require('@angular/cdk/coercion'), require('@angular/core'), require('@angular/material/core'), require('@angular/cdk/bidi'), require('@angular/cdk/keycodes'), require('@angular/cdk/overlay'), require('@angular/cdk/portal'), require('@angular/common'), require('rxjs/operators'), require('@angular/cdk/scrolling'), require('@angular/forms'), require('@angular/material/form-field'), require('rxjs')) :
	typeof define === 'function' && define.amd ? define('@angular/material/autocomplete', ['exports', '@angular/cdk/a11y', '@angular/cdk/coercion', '@angular/core', '@angular/material/core', '@angular/cdk/bidi', '@angular/cdk/keycodes', '@angular/cdk/overlay', '@angular/cdk/portal', '@angular/common', 'rxjs/operators', '@angular/cdk/scrolling', '@angular/forms', '@angular/material/form-field', 'rxjs'], factory) :
	(factory((global.ng = global.ng || {}, global.ng.material = global.ng.material || {}, global.ng.material.autocomplete = {}),global.ng.cdk.a11y,global.ng.cdk.coercion,global.ng.core,global.ng.material.core,global.ng.cdk.bidi,global.ng.cdk.keycodes,global.ng.cdk.overlay,global.ng.cdk.portal,global.ng.common,global.rxjs.operators,global.ng.cdk.scrolling,global.ng.forms,global.ng.material.formField,global.rxjs));
}(this, (function (exports,a11y,coercion,core,core$1,bidi,keycodes,overlay,portal,common,operators,scrolling,forms,formField,rxjs) { 'use strict';

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * Autocomplete IDs need to be unique across components, so this counter exists outside of
 * the component definition.
 * @type {?}
 */
var _uniqueAutocompleteIdCounter = 0;
/**
 * Event object that is emitted when an autocomplete option is selected.
 */
var   /**
 * Event object that is emitted when an autocomplete option is selected.
 */
MatAutocompleteSelectedEvent = /** @class */ (function () {
    function MatAutocompleteSelectedEvent(source, option) {
        this.source = source;
        this.option = option;
    }
    return MatAutocompleteSelectedEvent;
}());
// Boilerplate for applying mixins to MatAutocomplete.
/**
 * \@docs-private
 */
var   
// Boilerplate for applying mixins to MatAutocomplete.
/**
 * \@docs-private
 */
MatAutocompleteBase = /** @class */ (function () {
    function MatAutocompleteBase() {
    }
    return MatAutocompleteBase;
}());
/** @type {?} */
var _MatAutocompleteMixinBase = core$1.mixinDisableRipple(MatAutocompleteBase);
/**
 * Injection token to be used to override the default options for `mat-autocomplete`.
 * @type {?}
 */
var MAT_AUTOCOMPLETE_DEFAULT_OPTIONS = new core.InjectionToken('mat-autocomplete-default-options', {
    providedIn: 'root',
    factory: MAT_AUTOCOMPLETE_DEFAULT_OPTIONS_FACTORY,
});
/**
 * \@docs-private
 * @return {?}
 */
function MAT_AUTOCOMPLETE_DEFAULT_OPTIONS_FACTORY() {
    return { autoActiveFirstOption: false };
}
var MatAutocomplete = /** @class */ (function (_super) {
    __extends(MatAutocomplete, _super);
    function MatAutocomplete(_changeDetectorRef, _elementRef, defaults) {
        var _this = _super.call(this) || this;
        _this._changeDetectorRef = _changeDetectorRef;
        _this._elementRef = _elementRef;
        /**
         * Whether the autocomplete panel should be visible, depending on option length.
         */
        _this.showPanel = false;
        _this._isOpen = false;
        /**
         * Function that maps an option's control value to its display value in the trigger.
         */
        _this.displayWith = null;
        /**
         * Event that is emitted whenever an option from the list is selected.
         */
        _this.optionSelected = new core.EventEmitter();
        /**
         * Event that is emitted when the autocomplete panel is opened.
         */
        _this.opened = new core.EventEmitter();
        /**
         * Event that is emitted when the autocomplete panel is closed.
         */
        _this.closed = new core.EventEmitter();
        _this._classList = {};
        /**
         * Unique ID to be used by autocomplete trigger's "aria-owns" property.
         */
        _this.id = "mat-autocomplete-" + _uniqueAutocompleteIdCounter++;
        _this._autoActiveFirstOption = !!defaults.autoActiveFirstOption;
        return _this;
    }
    Object.defineProperty(MatAutocomplete.prototype, "isOpen", {
        /** Whether the autocomplete panel is open. */
        get: /**
         * Whether the autocomplete panel is open.
         * @return {?}
         */
        function () { return this._isOpen && this.showPanel; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MatAutocomplete.prototype, "autoActiveFirstOption", {
        /**
         * Whether the first option should be highlighted when the autocomplete panel is opened.
         * Can be configured globally through the `MAT_AUTOCOMPLETE_DEFAULT_OPTIONS` token.
         */
        get: /**
         * Whether the first option should be highlighted when the autocomplete panel is opened.
         * Can be configured globally through the `MAT_AUTOCOMPLETE_DEFAULT_OPTIONS` token.
         * @return {?}
         */
        function () { return this._autoActiveFirstOption; },
        set: /**
         * @param {?} value
         * @return {?}
         */
        function (value) {
            this._autoActiveFirstOption = coercion.coerceBooleanProperty(value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MatAutocomplete.prototype, "classList", {
        /**
         * Takes classes set on the host mat-autocomplete element and applies them to the panel
         * inside the overlay container to allow for easy styling.
         */
        set: /**
         * Takes classes set on the host mat-autocomplete element and applies them to the panel
         * inside the overlay container to allow for easy styling.
         * @param {?} value
         * @return {?}
         */
        function (value) {
            var _this = this;
            if (value && value.length) {
                value.split(' ').forEach(function (className) { return _this._classList[className.trim()] = true; });
                this._elementRef.nativeElement.className = '';
            }
        },
        enumerable: true,
        configurable: true
    });
    /**
     * @return {?}
     */
    MatAutocomplete.prototype.ngAfterContentInit = /**
     * @return {?}
     */
    function () {
        this._keyManager = new a11y.ActiveDescendantKeyManager(this.options).withWrap();
        // Set the initial visibility state.
        this._setVisibility();
    };
    /**
     * Sets the panel scrollTop. This allows us to manually scroll to display options
     * above or below the fold, as they are not actually being focused when active.
     */
    /**
     * Sets the panel scrollTop. This allows us to manually scroll to display options
     * above or below the fold, as they are not actually being focused when active.
     * @param {?} scrollTop
     * @return {?}
     */
    MatAutocomplete.prototype._setScrollTop = /**
     * Sets the panel scrollTop. This allows us to manually scroll to display options
     * above or below the fold, as they are not actually being focused when active.
     * @param {?} scrollTop
     * @return {?}
     */
    function (scrollTop) {
        if (this.panel) {
            this.panel.nativeElement.scrollTop = scrollTop;
        }
    };
    /** Returns the panel's scrollTop. */
    /**
     * Returns the panel's scrollTop.
     * @return {?}
     */
    MatAutocomplete.prototype._getScrollTop = /**
     * Returns the panel's scrollTop.
     * @return {?}
     */
    function () {
        return this.panel ? this.panel.nativeElement.scrollTop : 0;
    };
    /** Panel should hide itself when the option list is empty. */
    /**
     * Panel should hide itself when the option list is empty.
     * @return {?}
     */
    MatAutocomplete.prototype._setVisibility = /**
     * Panel should hide itself when the option list is empty.
     * @return {?}
     */
    function () {
        this.showPanel = !!this.options.length;
        this._classList['mat-autocomplete-visible'] = this.showPanel;
        this._classList['mat-autocomplete-hidden'] = !this.showPanel;
        this._changeDetectorRef.markForCheck();
    };
    /** Emits the `select` event. */
    /**
     * Emits the `select` event.
     * @param {?} option
     * @return {?}
     */
    MatAutocomplete.prototype._emitSelectEvent = /**
     * Emits the `select` event.
     * @param {?} option
     * @return {?}
     */
    function (option) {
        /** @type {?} */
        var event = new MatAutocompleteSelectedEvent(this, option);
        this.optionSelected.emit(event);
    };
    MatAutocomplete.decorators = [
        { type: core.Component, args: [{selector: 'mat-autocomplete',
                    template: "<ng-template><div class=\"mat-autocomplete-panel\" role=\"listbox\" [id]=\"id\" [ngClass]=\"_classList\" #panel><ng-content></ng-content></div></ng-template>",
                    styles: [".mat-autocomplete-panel{min-width:112px;max-width:280px;overflow:auto;-webkit-overflow-scrolling:touch;visibility:hidden;max-width:none;max-height:256px;position:relative;width:100%;border-bottom-left-radius:4px;border-bottom-right-radius:4px}.mat-autocomplete-panel.mat-autocomplete-visible{visibility:visible}.mat-autocomplete-panel.mat-autocomplete-hidden{visibility:hidden}.mat-autocomplete-panel-above .mat-autocomplete-panel{border-radius:0;border-top-left-radius:4px;border-top-right-radius:4px}.mat-autocomplete-panel .mat-divider-horizontal{margin-top:-1px}@media (-ms-high-contrast:active){.mat-autocomplete-panel{outline:solid 1px}}"],
                    encapsulation: core.ViewEncapsulation.None,
                    changeDetection: core.ChangeDetectionStrategy.OnPush,
                    exportAs: 'matAutocomplete',
                    inputs: ['disableRipple'],
                    host: {
                        'class': 'mat-autocomplete'
                    },
                    providers: [
                        { provide: core$1.MAT_OPTION_PARENT_COMPONENT, useExisting: MatAutocomplete }
                    ]
                },] },
    ];
    /** @nocollapse */
    MatAutocomplete.ctorParameters = function () { return [
        { type: core.ChangeDetectorRef },
        { type: core.ElementRef },
        { type: undefined, decorators: [{ type: core.Inject, args: [MAT_AUTOCOMPLETE_DEFAULT_OPTIONS,] }] }
    ]; };
    MatAutocomplete.propDecorators = {
        template: [{ type: core.ViewChild, args: [core.TemplateRef,] }],
        panel: [{ type: core.ViewChild, args: ['panel',] }],
        options: [{ type: core.ContentChildren, args: [core$1.MatOption, { descendants: true },] }],
        optionGroups: [{ type: core.ContentChildren, args: [core$1.MatOptgroup,] }],
        displayWith: [{ type: core.Input }],
        autoActiveFirstOption: [{ type: core.Input }],
        panelWidth: [{ type: core.Input }],
        optionSelected: [{ type: core.Output }],
        opened: [{ type: core.Output }],
        closed: [{ type: core.Output }],
        classList: [{ type: core.Input, args: ['class',] }]
    };
    return MatAutocomplete;
}(_MatAutocompleteMixinBase));

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * Directive applied to an element to make it usable
 * as a connection point for an autocomplete panel.
 */
var MatAutocompleteOrigin = /** @class */ (function () {
    function MatAutocompleteOrigin(elementRef) {
        this.elementRef = elementRef;
    }
    MatAutocompleteOrigin.decorators = [
        { type: core.Directive, args: [{
                    selector: '[matAutocompleteOrigin]',
                    exportAs: 'matAutocompleteOrigin',
                },] },
    ];
    /** @nocollapse */
    MatAutocompleteOrigin.ctorParameters = function () { return [
        { type: core.ElementRef }
    ]; };
    return MatAutocompleteOrigin;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * The height of each autocomplete option.
 * @type {?}
 */
var AUTOCOMPLETE_OPTION_HEIGHT = 48;
/**
 * The total height of the autocomplete panel.
 * @type {?}
 */
var AUTOCOMPLETE_PANEL_HEIGHT = 256;
/**
 * Injection token that determines the scroll handling while the autocomplete panel is open.
 * @type {?}
 */
var MAT_AUTOCOMPLETE_SCROLL_STRATEGY = new core.InjectionToken('mat-autocomplete-scroll-strategy');
/**
 * \@docs-private
 * @param {?} overlay
 * @return {?}
 */
function MAT_AUTOCOMPLETE_SCROLL_STRATEGY_FACTORY(overlay$$1) {
    return function () { return overlay$$1.scrollStrategies.reposition(); };
}
/**
 * \@docs-private
 * @type {?}
 */
var MAT_AUTOCOMPLETE_SCROLL_STRATEGY_FACTORY_PROVIDER = {
    provide: MAT_AUTOCOMPLETE_SCROLL_STRATEGY,
    deps: [overlay.Overlay],
    useFactory: MAT_AUTOCOMPLETE_SCROLL_STRATEGY_FACTORY,
};
/**
 * Provider that allows the autocomplete to register as a ControlValueAccessor.
 * \@docs-private
 * @type {?}
 */
var MAT_AUTOCOMPLETE_VALUE_ACCESSOR = {
    provide: forms.NG_VALUE_ACCESSOR,
    useExisting: core.forwardRef(function () { return MatAutocompleteTrigger; }),
    multi: true
};
/**
 * Creates an error to be thrown when attempting to use an autocomplete trigger without a panel.
 * \@docs-private
 * @return {?}
 */
function getMatAutocompleteMissingPanelError() {
    return Error('Attempting to open an undefined instance of `mat-autocomplete`. ' +
        'Make sure that the id passed to the `matAutocomplete` is correct and that ' +
        'you\'re attempting to open it after the ngAfterContentInit hook.');
}
var MatAutocompleteTrigger = /** @class */ (function () {
    function MatAutocompleteTrigger(_element, _overlay, _viewContainerRef, _zone, _changeDetectorRef, scrollStrategy, _dir, _formField, _document, _viewportRuler) {
        var _this = this;
        this._element = _element;
        this._overlay = _overlay;
        this._viewContainerRef = _viewContainerRef;
        this._zone = _zone;
        this._changeDetectorRef = _changeDetectorRef;
        this._dir = _dir;
        this._formField = _formField;
        this._document = _document;
        this._viewportRuler = _viewportRuler;
        this._componentDestroyed = false;
        this._autocompleteDisabled = false;
        /**
         * Whether or not the label state is being overridden.
         */
        this._manuallyFloatingLabel = false;
        /**
         * Subscription to viewport size changes.
         */
        this._viewportSubscription = rxjs.Subscription.EMPTY;
        /**
         * Whether the autocomplete can open the next time it is focused. Used to prevent a focused,
         * closed autocomplete from being reopened if the user switches to another browser tab and then
         * comes back.
         */
        this._canOpenOnNextFocus = true;
        /**
         * Stream of keyboard events that can close the panel.
         */
        this._closeKeyEventStream = new rxjs.Subject();
        /**
         * Event handler for when the window is blurred. Needs to be an
         * arrow function in order to preserve the context.
         */
        this._windowBlurHandler = function () {
            // If the user blurred the window while the autocomplete is focused, it means that it'll be
            // refocused when they come back. In this case we want to skip the first focus event, if the
            // pane was closed, in order to avoid reopening it unintentionally.
            _this._canOpenOnNextFocus =
                document.activeElement !== _this._element.nativeElement || _this.panelOpen;
        };
        /**
         * `View -> model callback called when value changes`
         */
        this._onChange = function () { };
        /**
         * `View -> model callback called when autocomplete has been touched`
         */
        this._onTouched = function () { };
        /**
         * `autocomplete` attribute to be set on the input element.
         * \@docs-private
         */
        this.autocompleteAttribute = 'off';
        this._overlayAttached = false;
        /**
         * Stream of autocomplete option selections.
         */
        this.optionSelections = rxjs.defer(function () {
            if (_this.autocomplete && _this.autocomplete.options) {
                return rxjs.merge.apply(void 0, _this.autocomplete.options.map(function (option) { return option.onSelectionChange; }));
            }
            // If there are any subscribers before `ngAfterViewInit`, the `autocomplete` will be undefined.
            // Return a stream that we'll replace with the real one once everything is in place.
            return _this._zone.onStable
                .asObservable()
                .pipe(operators.take(1), operators.switchMap(function () { return _this.optionSelections; }));
        });
        if (typeof window !== 'undefined') {
            _zone.runOutsideAngular(function () {
                window.addEventListener('blur', _this._windowBlurHandler);
            });
        }
        this._scrollStrategy = scrollStrategy;
    }
    Object.defineProperty(MatAutocompleteTrigger.prototype, "autocompleteDisabled", {
        /**
         * Whether the autocomplete is disabled. When disabled, the element will
         * act as a regular input and the user won't be able to open the panel.
         */
        get: /**
         * Whether the autocomplete is disabled. When disabled, the element will
         * act as a regular input and the user won't be able to open the panel.
         * @return {?}
         */
        function () { return this._autocompleteDisabled; },
        set: /**
         * @param {?} value
         * @return {?}
         */
        function (value) {
            this._autocompleteDisabled = coercion.coerceBooleanProperty(value);
        },
        enumerable: true,
        configurable: true
    });
    /**
     * @return {?}
     */
    MatAutocompleteTrigger.prototype.ngOnDestroy = /**
     * @return {?}
     */
    function () {
        if (typeof window !== 'undefined') {
            window.removeEventListener('blur', this._windowBlurHandler);
        }
        this._viewportSubscription.unsubscribe();
        this._componentDestroyed = true;
        this._destroyPanel();
        this._closeKeyEventStream.complete();
    };
    Object.defineProperty(MatAutocompleteTrigger.prototype, "panelOpen", {
        /** Whether or not the autocomplete panel is open. */
        get: /**
         * Whether or not the autocomplete panel is open.
         * @return {?}
         */
        function () {
            return this._overlayAttached && this.autocomplete.showPanel;
        },
        enumerable: true,
        configurable: true
    });
    /** Opens the autocomplete suggestion panel. */
    /**
     * Opens the autocomplete suggestion panel.
     * @return {?}
     */
    MatAutocompleteTrigger.prototype.openPanel = /**
     * Opens the autocomplete suggestion panel.
     * @return {?}
     */
    function () {
        this._attachOverlay();
        this._floatLabel();
    };
    /** Closes the autocomplete suggestion panel. */
    /**
     * Closes the autocomplete suggestion panel.
     * @return {?}
     */
    MatAutocompleteTrigger.prototype.closePanel = /**
     * Closes the autocomplete suggestion panel.
     * @return {?}
     */
    function () {
        this._resetLabel();
        if (!this._overlayAttached) {
            return;
        }
        if (this.panelOpen) {
            // Only emit if the panel was visible.
            this.autocomplete.closed.emit();
        }
        this.autocomplete._isOpen = this._overlayAttached = false;
        if (this._overlayRef && this._overlayRef.hasAttached()) {
            this._overlayRef.detach();
            this._closingActionsSubscription.unsubscribe();
        }
        // Note that in some cases this can end up being called after the component is destroyed.
        // Add a check to ensure that we don't try to run change detection on a destroyed view.
        if (!this._componentDestroyed) {
            // We need to trigger change detection manually, because
            // `fromEvent` doesn't seem to do it at the proper time.
            // This ensures that the label is reset when the
            // user clicks outside.
            this._changeDetectorRef.detectChanges();
        }
    };
    /**
     * Updates the position of the autocomplete suggestion panel to ensure that it fits all options
     * within the viewport.
     */
    /**
     * Updates the position of the autocomplete suggestion panel to ensure that it fits all options
     * within the viewport.
     * @return {?}
     */
    MatAutocompleteTrigger.prototype.updatePosition = /**
     * Updates the position of the autocomplete suggestion panel to ensure that it fits all options
     * within the viewport.
     * @return {?}
     */
    function () {
        if (this._overlayAttached) {
            (/** @type {?} */ (this._overlayRef)).updatePosition();
        }
    };
    Object.defineProperty(MatAutocompleteTrigger.prototype, "panelClosingActions", {
        /**
         * A stream of actions that should close the autocomplete panel, including
         * when an option is selected, on blur, and when TAB is pressed.
         */
        get: /**
         * A stream of actions that should close the autocomplete panel, including
         * when an option is selected, on blur, and when TAB is pressed.
         * @return {?}
         */
        function () {
            var _this = this;
            return rxjs.merge(this.optionSelections, this.autocomplete._keyManager.tabOut.pipe(operators.filter(function () { return _this._overlayAttached; })), this._closeKeyEventStream, this._getOutsideClickStream(), this._overlayRef ?
                this._overlayRef.detachments().pipe(operators.filter(function () { return _this._overlayAttached; })) :
                rxjs.of()).pipe(
            // Normalize the output so we return a consistent type.
            operators.map(function (event) { return event instanceof core$1.MatOptionSelectionChange ? event : null; }));
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MatAutocompleteTrigger.prototype, "activeOption", {
        /** The currently active option, coerced to MatOption type. */
        get: /**
         * The currently active option, coerced to MatOption type.
         * @return {?}
         */
        function () {
            if (this.autocomplete && this.autocomplete._keyManager) {
                return this.autocomplete._keyManager.activeItem;
            }
            return null;
        },
        enumerable: true,
        configurable: true
    });
    /** Stream of clicks outside of the autocomplete panel. */
    /**
     * Stream of clicks outside of the autocomplete panel.
     * @private
     * @return {?}
     */
    MatAutocompleteTrigger.prototype._getOutsideClickStream = /**
     * Stream of clicks outside of the autocomplete panel.
     * @private
     * @return {?}
     */
    function () {
        var _this = this;
        if (!this._document) {
            return rxjs.of(null);
        }
        return rxjs.merge(rxjs.fromEvent(this._document, 'click'), rxjs.fromEvent(this._document, 'touchend'))
            .pipe(operators.filter(function (event) {
            /** @type {?} */
            var clickTarget = (/** @type {?} */ (event.target));
            /** @type {?} */
            var formField$$1 = _this._formField ?
                _this._formField._elementRef.nativeElement : null;
            return _this._overlayAttached &&
                clickTarget !== _this._element.nativeElement &&
                (!formField$$1 || !formField$$1.contains(clickTarget)) &&
                (!!_this._overlayRef && !_this._overlayRef.overlayElement.contains(clickTarget));
        }));
    };
    // Implemented as part of ControlValueAccessor.
    // Implemented as part of ControlValueAccessor.
    /**
     * @param {?} value
     * @return {?}
     */
    MatAutocompleteTrigger.prototype.writeValue = 
    // Implemented as part of ControlValueAccessor.
    /**
     * @param {?} value
     * @return {?}
     */
    function (value) {
        var _this = this;
        Promise.resolve(null).then(function () { return _this._setTriggerValue(value); });
    };
    // Implemented as part of ControlValueAccessor.
    // Implemented as part of ControlValueAccessor.
    /**
     * @param {?} fn
     * @return {?}
     */
    MatAutocompleteTrigger.prototype.registerOnChange = 
    // Implemented as part of ControlValueAccessor.
    /**
     * @param {?} fn
     * @return {?}
     */
    function (fn) {
        this._onChange = fn;
    };
    // Implemented as part of ControlValueAccessor.
    // Implemented as part of ControlValueAccessor.
    /**
     * @param {?} fn
     * @return {?}
     */
    MatAutocompleteTrigger.prototype.registerOnTouched = 
    // Implemented as part of ControlValueAccessor.
    /**
     * @param {?} fn
     * @return {?}
     */
    function (fn) {
        this._onTouched = fn;
    };
    // Implemented as part of ControlValueAccessor.
    // Implemented as part of ControlValueAccessor.
    /**
     * @param {?} isDisabled
     * @return {?}
     */
    MatAutocompleteTrigger.prototype.setDisabledState = 
    // Implemented as part of ControlValueAccessor.
    /**
     * @param {?} isDisabled
     * @return {?}
     */
    function (isDisabled) {
        this._element.nativeElement.disabled = isDisabled;
    };
    /**
     * @param {?} event
     * @return {?}
     */
    MatAutocompleteTrigger.prototype._handleKeydown = /**
     * @param {?} event
     * @return {?}
     */
    function (event) {
        /** @type {?} */
        var keyCode = event.keyCode;
        // Prevent the default action on all escape key presses. This is here primarily to bring IE
        // in line with other browsers. By default, pressing escape on IE will cause it to revert
        // the input value to the one that it had on focus, however it won't dispatch any events
        // which means that the model value will be out of sync with the view.
        if (keyCode === keycodes.ESCAPE) {
            event.preventDefault();
        }
        if (this.activeOption && keyCode === keycodes.ENTER && this.panelOpen) {
            this.activeOption._selectViaInteraction();
            this._resetActiveItem();
            event.preventDefault();
        }
        else if (this.autocomplete) {
            /** @type {?} */
            var prevActiveItem = this.autocomplete._keyManager.activeItem;
            /** @type {?} */
            var isArrowKey = keyCode === keycodes.UP_ARROW || keyCode === keycodes.DOWN_ARROW;
            if (this.panelOpen || keyCode === keycodes.TAB) {
                this.autocomplete._keyManager.onKeydown(event);
            }
            else if (isArrowKey && this._canOpen()) {
                this.openPanel();
            }
            if (isArrowKey || this.autocomplete._keyManager.activeItem !== prevActiveItem) {
                this._scrollToOption();
            }
        }
    };
    /**
     * @param {?} event
     * @return {?}
     */
    MatAutocompleteTrigger.prototype._handleInput = /**
     * @param {?} event
     * @return {?}
     */
    function (event) {
        /** @type {?} */
        var target = (/** @type {?} */ (event.target));
        /** @type {?} */
        var value = target.value;
        // Based on `NumberValueAccessor` from forms.
        if (target.type === 'number') {
            value = value == '' ? null : parseFloat(value);
        }
        // If the input has a placeholder, IE will fire the `input` event on page load,
        // focus and blur, in addition to when the user actually changed the value. To
        // filter out all of the extra events, we save the value on focus and between
        // `input` events, and we check whether it changed.
        // See: https://connect.microsoft.com/IE/feedback/details/885747/
        if (this._previousValue !== value) {
            this._previousValue = value;
            this._onChange(value);
            if (this._canOpen() && document.activeElement === event.target) {
                this.openPanel();
            }
        }
    };
    /**
     * @return {?}
     */
    MatAutocompleteTrigger.prototype._handleFocus = /**
     * @return {?}
     */
    function () {
        if (!this._canOpenOnNextFocus) {
            this._canOpenOnNextFocus = true;
        }
        else if (this._canOpen()) {
            this._previousValue = this._element.nativeElement.value;
            this._attachOverlay();
            this._floatLabel(true);
        }
    };
    /**
     * In "auto" mode, the label will animate down as soon as focus is lost.
     * This causes the value to jump when selecting an option with the mouse.
     * This method manually floats the label until the panel can be closed.
     * @param shouldAnimate Whether the label should be animated when it is floated.
     */
    /**
     * In "auto" mode, the label will animate down as soon as focus is lost.
     * This causes the value to jump when selecting an option with the mouse.
     * This method manually floats the label until the panel can be closed.
     * @private
     * @param {?=} shouldAnimate Whether the label should be animated when it is floated.
     * @return {?}
     */
    MatAutocompleteTrigger.prototype._floatLabel = /**
     * In "auto" mode, the label will animate down as soon as focus is lost.
     * This causes the value to jump when selecting an option with the mouse.
     * This method manually floats the label until the panel can be closed.
     * @private
     * @param {?=} shouldAnimate Whether the label should be animated when it is floated.
     * @return {?}
     */
    function (shouldAnimate) {
        if (shouldAnimate === void 0) { shouldAnimate = false; }
        if (this._formField && this._formField.floatLabel === 'auto') {
            if (shouldAnimate) {
                this._formField._animateAndLockLabel();
            }
            else {
                this._formField.floatLabel = 'always';
            }
            this._manuallyFloatingLabel = true;
        }
    };
    /** If the label has been manually elevated, return it to its normal state. */
    /**
     * If the label has been manually elevated, return it to its normal state.
     * @private
     * @return {?}
     */
    MatAutocompleteTrigger.prototype._resetLabel = /**
     * If the label has been manually elevated, return it to its normal state.
     * @private
     * @return {?}
     */
    function () {
        if (this._manuallyFloatingLabel) {
            this._formField.floatLabel = 'auto';
            this._manuallyFloatingLabel = false;
        }
    };
    /**
     * Given that we are not actually focusing active options, we must manually adjust scroll
     * to reveal options below the fold. First, we find the offset of the option from the top
     * of the panel. If that offset is below the fold, the new scrollTop will be the offset -
     * the panel height + the option height, so the active option will be just visible at the
     * bottom of the panel. If that offset is above the top of the visible panel, the new scrollTop
     * will become the offset. If that offset is visible within the panel already, the scrollTop is
     * not adjusted.
     */
    /**
     * Given that we are not actually focusing active options, we must manually adjust scroll
     * to reveal options below the fold. First, we find the offset of the option from the top
     * of the panel. If that offset is below the fold, the new scrollTop will be the offset -
     * the panel height + the option height, so the active option will be just visible at the
     * bottom of the panel. If that offset is above the top of the visible panel, the new scrollTop
     * will become the offset. If that offset is visible within the panel already, the scrollTop is
     * not adjusted.
     * @private
     * @return {?}
     */
    MatAutocompleteTrigger.prototype._scrollToOption = /**
     * Given that we are not actually focusing active options, we must manually adjust scroll
     * to reveal options below the fold. First, we find the offset of the option from the top
     * of the panel. If that offset is below the fold, the new scrollTop will be the offset -
     * the panel height + the option height, so the active option will be just visible at the
     * bottom of the panel. If that offset is above the top of the visible panel, the new scrollTop
     * will become the offset. If that offset is visible within the panel already, the scrollTop is
     * not adjusted.
     * @private
     * @return {?}
     */
    function () {
        /** @type {?} */
        var index = this.autocomplete._keyManager.activeItemIndex || 0;
        /** @type {?} */
        var labelCount = core$1._countGroupLabelsBeforeOption(index, this.autocomplete.options, this.autocomplete.optionGroups);
        /** @type {?} */
        var newScrollPosition = core$1._getOptionScrollPosition(index + labelCount, AUTOCOMPLETE_OPTION_HEIGHT, this.autocomplete._getScrollTop(), AUTOCOMPLETE_PANEL_HEIGHT);
        this.autocomplete._setScrollTop(newScrollPosition);
    };
    /**
     * This method listens to a stream of panel closing actions and resets the
     * stream every time the option list changes.
     */
    /**
     * This method listens to a stream of panel closing actions and resets the
     * stream every time the option list changes.
     * @private
     * @return {?}
     */
    MatAutocompleteTrigger.prototype._subscribeToClosingActions = /**
     * This method listens to a stream of panel closing actions and resets the
     * stream every time the option list changes.
     * @private
     * @return {?}
     */
    function () {
        var _this = this;
        /** @type {?} */
        var firstStable = this._zone.onStable.asObservable().pipe(operators.take(1));
        /** @type {?} */
        var optionChanges = this.autocomplete.options.changes.pipe(operators.tap(function () { return _this._positionStrategy.reapplyLastPosition(); }), 
        // Defer emitting to the stream until the next tick, because changing
        // bindings in here will cause "changed after checked" errors.
        operators.delay(0));
        // When the zone is stable initially, and when the option list changes...
        return rxjs.merge(firstStable, optionChanges)
            .pipe(
        // create a new stream of panelClosingActions, replacing any previous streams
        // that were created, and flatten it so our stream only emits closing events...
        operators.switchMap(function () {
            _this._resetActiveItem();
            _this.autocomplete._setVisibility();
            if (_this.panelOpen) {
                (/** @type {?} */ (_this._overlayRef)).updatePosition();
            }
            return _this.panelClosingActions;
        }), 
        // when the first closing event occurs...
        operators.take(1))
            // set the value, close the panel, and complete.
            .subscribe(function (event) { return _this._setValueAndClose(event); });
    };
    /** Destroys the autocomplete suggestion panel. */
    /**
     * Destroys the autocomplete suggestion panel.
     * @private
     * @return {?}
     */
    MatAutocompleteTrigger.prototype._destroyPanel = /**
     * Destroys the autocomplete suggestion panel.
     * @private
     * @return {?}
     */
    function () {
        if (this._overlayRef) {
            this.closePanel();
            this._overlayRef.dispose();
            this._overlayRef = null;
        }
    };
    /**
     * @private
     * @param {?} value
     * @return {?}
     */
    MatAutocompleteTrigger.prototype._setTriggerValue = /**
     * @private
     * @param {?} value
     * @return {?}
     */
    function (value) {
        /** @type {?} */
        var toDisplay = this.autocomplete && this.autocomplete.displayWith ?
            this.autocomplete.displayWith(value) :
            value;
        // Simply falling back to an empty string if the display value is falsy does not work properly.
        // The display value can also be the number zero and shouldn't fall back to an empty string.
        /** @type {?} */
        var inputValue = toDisplay != null ? toDisplay : '';
        // If it's used within a `MatFormField`, we should set it through the property so it can go
        // through change detection.
        if (this._formField) {
            this._formField._control.value = inputValue;
        }
        else {
            this._element.nativeElement.value = inputValue;
        }
        this._previousValue = inputValue;
    };
    /**
     * This method closes the panel, and if a value is specified, also sets the associated
     * control to that value. It will also mark the control as dirty if this interaction
     * stemmed from the user.
     */
    /**
     * This method closes the panel, and if a value is specified, also sets the associated
     * control to that value. It will also mark the control as dirty if this interaction
     * stemmed from the user.
     * @private
     * @param {?} event
     * @return {?}
     */
    MatAutocompleteTrigger.prototype._setValueAndClose = /**
     * This method closes the panel, and if a value is specified, also sets the associated
     * control to that value. It will also mark the control as dirty if this interaction
     * stemmed from the user.
     * @private
     * @param {?} event
     * @return {?}
     */
    function (event) {
        if (event && event.source) {
            this._clearPreviousSelectedOption(event.source);
            this._setTriggerValue(event.source.value);
            this._onChange(event.source.value);
            this._element.nativeElement.focus();
            this.autocomplete._emitSelectEvent(event.source);
        }
        this.closePanel();
    };
    /**
     * Clear any previous selected option and emit a selection change event for this option
     */
    /**
     * Clear any previous selected option and emit a selection change event for this option
     * @private
     * @param {?} skip
     * @return {?}
     */
    MatAutocompleteTrigger.prototype._clearPreviousSelectedOption = /**
     * Clear any previous selected option and emit a selection change event for this option
     * @private
     * @param {?} skip
     * @return {?}
     */
    function (skip) {
        this.autocomplete.options.forEach(function (option) {
            if (option != skip && option.selected) {
                option.deselect();
            }
        });
    };
    /**
     * @private
     * @return {?}
     */
    MatAutocompleteTrigger.prototype._attachOverlay = /**
     * @private
     * @return {?}
     */
    function () {
        var _this = this;
        if (!this.autocomplete) {
            throw getMatAutocompleteMissingPanelError();
        }
        /** @type {?} */
        var overlayRef = this._overlayRef;
        if (!overlayRef) {
            this._portal = new portal.TemplatePortal(this.autocomplete.template, this._viewContainerRef);
            overlayRef = this._overlay.create(this._getOverlayConfig());
            this._overlayRef = overlayRef;
            // Use the `keydownEvents` in order to take advantage of
            // the overlay event targeting provided by the CDK overlay.
            overlayRef.keydownEvents().subscribe(function (event) {
                // Close when pressing ESCAPE or ALT + UP_ARROW, based on the a11y guidelines.
                // See: https://www.w3.org/TR/wai-aria-practices-1.1/#textbox-keyboard-interaction
                if (event.keyCode === keycodes.ESCAPE || (event.keyCode === keycodes.UP_ARROW && event.altKey)) {
                    _this._resetActiveItem();
                    _this._closeKeyEventStream.next();
                }
            });
            if (this._viewportRuler) {
                this._viewportSubscription = this._viewportRuler.change().subscribe(function () {
                    if (_this.panelOpen && overlayRef) {
                        overlayRef.updateSize({ width: _this._getPanelWidth() });
                    }
                });
            }
        }
        else {
            /** @type {?} */
            var position = (/** @type {?} */ (overlayRef.getConfig().positionStrategy));
            // Update the trigger, panel width and direction, in case anything has changed.
            position.setOrigin(this._getConnectedElement());
            overlayRef.updateSize({ width: this._getPanelWidth() });
        }
        if (overlayRef && !overlayRef.hasAttached()) {
            overlayRef.attach(this._portal);
            this._closingActionsSubscription = this._subscribeToClosingActions();
        }
        /** @type {?} */
        var wasOpen = this.panelOpen;
        this.autocomplete._setVisibility();
        this.autocomplete._isOpen = this._overlayAttached = true;
        // We need to do an extra `panelOpen` check in here, because the
        // autocomplete won't be shown if there are no options.
        if (this.panelOpen && wasOpen !== this.panelOpen) {
            this.autocomplete.opened.emit();
        }
    };
    /**
     * @private
     * @return {?}
     */
    MatAutocompleteTrigger.prototype._getOverlayConfig = /**
     * @private
     * @return {?}
     */
    function () {
        return new overlay.OverlayConfig({
            positionStrategy: this._getOverlayPosition(),
            scrollStrategy: this._scrollStrategy(),
            width: this._getPanelWidth(),
            direction: this._dir
        });
    };
    /**
     * @private
     * @return {?}
     */
    MatAutocompleteTrigger.prototype._getOverlayPosition = /**
     * @private
     * @return {?}
     */
    function () {
        this._positionStrategy = this._overlay.position()
            .flexibleConnectedTo(this._getConnectedElement())
            .withFlexibleDimensions(false)
            .withPush(false)
            .withPositions([
            {
                originX: 'start',
                originY: 'bottom',
                overlayX: 'start',
                overlayY: 'top'
            },
            {
                originX: 'start',
                originY: 'top',
                overlayX: 'start',
                overlayY: 'bottom',
                // The overlay edge connected to the trigger should have squared corners, while
                // the opposite end has rounded corners. We apply a CSS class to swap the
                // border-radius based on the overlay position.
                panelClass: 'mat-autocomplete-panel-above'
            }
        ]);
        return this._positionStrategy;
    };
    /**
     * @private
     * @return {?}
     */
    MatAutocompleteTrigger.prototype._getConnectedElement = /**
     * @private
     * @return {?}
     */
    function () {
        if (this.connectedTo) {
            return this.connectedTo.elementRef;
        }
        return this._formField ? this._formField.getConnectedOverlayOrigin() : this._element;
    };
    /**
     * @private
     * @return {?}
     */
    MatAutocompleteTrigger.prototype._getPanelWidth = /**
     * @private
     * @return {?}
     */
    function () {
        return this.autocomplete.panelWidth || this._getHostWidth();
    };
    /** Returns the width of the input element, so the panel width can match it. */
    /**
     * Returns the width of the input element, so the panel width can match it.
     * @private
     * @return {?}
     */
    MatAutocompleteTrigger.prototype._getHostWidth = /**
     * Returns the width of the input element, so the panel width can match it.
     * @private
     * @return {?}
     */
    function () {
        return this._getConnectedElement().nativeElement.getBoundingClientRect().width;
    };
    /**
     * Resets the active item to -1 so arrow events will activate the
     * correct options, or to 0 if the consumer opted into it.
     */
    /**
     * Resets the active item to -1 so arrow events will activate the
     * correct options, or to 0 if the consumer opted into it.
     * @private
     * @return {?}
     */
    MatAutocompleteTrigger.prototype._resetActiveItem = /**
     * Resets the active item to -1 so arrow events will activate the
     * correct options, or to 0 if the consumer opted into it.
     * @private
     * @return {?}
     */
    function () {
        this.autocomplete._keyManager.setActiveItem(this.autocomplete.autoActiveFirstOption ? 0 : -1);
    };
    /** Determines whether the panel can be opened. */
    /**
     * Determines whether the panel can be opened.
     * @private
     * @return {?}
     */
    MatAutocompleteTrigger.prototype._canOpen = /**
     * Determines whether the panel can be opened.
     * @private
     * @return {?}
     */
    function () {
        /** @type {?} */
        var element = this._element.nativeElement;
        return !element.readOnly && !element.disabled && !this._autocompleteDisabled;
    };
    MatAutocompleteTrigger.decorators = [
        { type: core.Directive, args: [{
                    selector: "input[matAutocomplete], textarea[matAutocomplete]",
                    host: {
                        '[attr.autocomplete]': 'autocompleteAttribute',
                        '[attr.role]': 'autocompleteDisabled ? null : "combobox"',
                        '[attr.aria-autocomplete]': 'autocompleteDisabled ? null : "list"',
                        '[attr.aria-activedescendant]': '(panelOpen && activeOption) ? activeOption.id : null',
                        '[attr.aria-expanded]': 'autocompleteDisabled ? null : panelOpen.toString()',
                        '[attr.aria-owns]': '(autocompleteDisabled || !panelOpen) ? null : autocomplete?.id',
                        '[attr.aria-haspopup]': '!autocompleteDisabled',
                        // Note: we use `focusin`, as opposed to `focus`, in order to open the panel
                        // a little earlier. This avoids issues where IE delays the focusing of the input.
                        '(focusin)': '_handleFocus()',
                        '(blur)': '_onTouched()',
                        '(input)': '_handleInput($event)',
                        '(keydown)': '_handleKeydown($event)',
                    },
                    exportAs: 'matAutocompleteTrigger',
                    providers: [MAT_AUTOCOMPLETE_VALUE_ACCESSOR]
                },] },
    ];
    /** @nocollapse */
    MatAutocompleteTrigger.ctorParameters = function () { return [
        { type: core.ElementRef },
        { type: overlay.Overlay },
        { type: core.ViewContainerRef },
        { type: core.NgZone },
        { type: core.ChangeDetectorRef },
        { type: undefined, decorators: [{ type: core.Inject, args: [MAT_AUTOCOMPLETE_SCROLL_STRATEGY,] }] },
        { type: bidi.Directionality, decorators: [{ type: core.Optional }] },
        { type: formField.MatFormField, decorators: [{ type: core.Optional }, { type: core.Host }] },
        { type: undefined, decorators: [{ type: core.Optional }, { type: core.Inject, args: [common.DOCUMENT,] }] },
        { type: scrolling.ViewportRuler }
    ]; };
    MatAutocompleteTrigger.propDecorators = {
        autocomplete: [{ type: core.Input, args: ['matAutocomplete',] }],
        connectedTo: [{ type: core.Input, args: ['matAutocompleteConnectedTo',] }],
        autocompleteAttribute: [{ type: core.Input, args: ['autocomplete',] }],
        autocompleteDisabled: [{ type: core.Input, args: ['matAutocompleteDisabled',] }]
    };
    return MatAutocompleteTrigger;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
var MatAutocompleteModule = /** @class */ (function () {
    function MatAutocompleteModule() {
    }
    MatAutocompleteModule.decorators = [
        { type: core.NgModule, args: [{
                    imports: [core$1.MatOptionModule, overlay.OverlayModule, core$1.MatCommonModule, common.CommonModule],
                    exports: [
                        MatAutocomplete,
                        core$1.MatOptionModule,
                        MatAutocompleteTrigger,
                        MatAutocompleteOrigin,
                        core$1.MatCommonModule
                    ],
                    declarations: [MatAutocomplete, MatAutocompleteTrigger, MatAutocompleteOrigin],
                    providers: [MAT_AUTOCOMPLETE_SCROLL_STRATEGY_FACTORY_PROVIDER],
                },] },
    ];
    return MatAutocompleteModule;
}());

exports.MAT_AUTOCOMPLETE_DEFAULT_OPTIONS_FACTORY = MAT_AUTOCOMPLETE_DEFAULT_OPTIONS_FACTORY;
exports.MatAutocompleteSelectedEvent = MatAutocompleteSelectedEvent;
exports.MatAutocompleteBase = MatAutocompleteBase;
exports._MatAutocompleteMixinBase = _MatAutocompleteMixinBase;
exports.MAT_AUTOCOMPLETE_DEFAULT_OPTIONS = MAT_AUTOCOMPLETE_DEFAULT_OPTIONS;
exports.MatAutocomplete = MatAutocomplete;
exports.MatAutocompleteModule = MatAutocompleteModule;
exports.MAT_AUTOCOMPLETE_SCROLL_STRATEGY_FACTORY = MAT_AUTOCOMPLETE_SCROLL_STRATEGY_FACTORY;
exports.getMatAutocompleteMissingPanelError = getMatAutocompleteMissingPanelError;
exports.AUTOCOMPLETE_OPTION_HEIGHT = AUTOCOMPLETE_OPTION_HEIGHT;
exports.AUTOCOMPLETE_PANEL_HEIGHT = AUTOCOMPLETE_PANEL_HEIGHT;
exports.MAT_AUTOCOMPLETE_SCROLL_STRATEGY = MAT_AUTOCOMPLETE_SCROLL_STRATEGY;
exports.MAT_AUTOCOMPLETE_SCROLL_STRATEGY_FACTORY_PROVIDER = MAT_AUTOCOMPLETE_SCROLL_STRATEGY_FACTORY_PROVIDER;
exports.MAT_AUTOCOMPLETE_VALUE_ACCESSOR = MAT_AUTOCOMPLETE_VALUE_ACCESSOR;
exports.MatAutocompleteTrigger = MatAutocompleteTrigger;
exports.MatAutocompleteOrigin = MatAutocompleteOrigin;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=material-autocomplete.umd.js.map

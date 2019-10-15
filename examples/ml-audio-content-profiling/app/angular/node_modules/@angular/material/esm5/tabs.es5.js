/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directive, ElementRef, Inject, InjectionToken, NgZone, TemplateRef, ChangeDetectionStrategy, Component, ContentChild, Input, ViewChild, ViewContainerRef, ViewEncapsulation, ChangeDetectorRef, Output, EventEmitter, Optional, ComponentFactoryResolver, forwardRef, ContentChildren, Attribute, NgModule } from '@angular/core';
import { __extends } from 'tslib';
import { CdkPortal, TemplatePortal, CdkPortalOutlet, PortalHostDirective, PortalModule } from '@angular/cdk/portal';
import { mixinDisabled, mixinDisableRipple, mixinColor, MAT_RIPPLE_GLOBAL_OPTIONS, mixinTabIndex, RippleRenderer, MatCommonModule, MatRippleModule } from '@angular/material/core';
import { Subject, Subscription, merge, of, timer, fromEvent } from 'rxjs';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { Directionality } from '@angular/cdk/bidi';
import { startWith, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { coerceNumberProperty, coerceBooleanProperty } from '@angular/cdk/coercion';
import { END, ENTER, HOME, SPACE, hasModifierKey } from '@angular/cdk/keycodes';
import { ViewportRuler } from '@angular/cdk/scrolling';
import { FocusKeyManager, FocusMonitor, A11yModule } from '@angular/cdk/a11y';
import { Platform, normalizePassiveListenerOptions } from '@angular/cdk/platform';
import { ObserversModule } from '@angular/cdk/observers';
import { CommonModule } from '@angular/common';

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * Injection token for the MatInkBar's Positioner.
 * @type {?}
 */
var _MAT_INK_BAR_POSITIONER = new InjectionToken('MatInkBarPositioner', {
    providedIn: 'root',
    factory: _MAT_INK_BAR_POSITIONER_FACTORY
});
/**
 * The default positioner function for the MatInkBar.
 * \@docs-private
 * @return {?}
 */
function _MAT_INK_BAR_POSITIONER_FACTORY() {
    /** @type {?} */
    var method = function (element) { return ({
        left: element ? (element.offsetLeft || 0) + 'px' : '0',
        width: element ? (element.offsetWidth || 0) + 'px' : '0',
    }); };
    return method;
}
/**
 * The ink-bar is used to display and animate the line underneath the current active tab label.
 * \@docs-private
 */
var MatInkBar = /** @class */ (function () {
    function MatInkBar(_elementRef, _ngZone, _inkBarPositioner) {
        this._elementRef = _elementRef;
        this._ngZone = _ngZone;
        this._inkBarPositioner = _inkBarPositioner;
    }
    /**
     * Calculates the styles from the provided element in order to align the ink-bar to that element.
     * Shows the ink bar if previously set as hidden.
     * @param element
     */
    /**
     * Calculates the styles from the provided element in order to align the ink-bar to that element.
     * Shows the ink bar if previously set as hidden.
     * @param {?} element
     * @return {?}
     */
    MatInkBar.prototype.alignToElement = /**
     * Calculates the styles from the provided element in order to align the ink-bar to that element.
     * Shows the ink bar if previously set as hidden.
     * @param {?} element
     * @return {?}
     */
    function (element) {
        var _this = this;
        this.show();
        if (typeof requestAnimationFrame !== 'undefined') {
            this._ngZone.runOutsideAngular(function () {
                requestAnimationFrame(function () { return _this._setStyles(element); });
            });
        }
        else {
            this._setStyles(element);
        }
    };
    /** Shows the ink bar. */
    /**
     * Shows the ink bar.
     * @return {?}
     */
    MatInkBar.prototype.show = /**
     * Shows the ink bar.
     * @return {?}
     */
    function () {
        this._elementRef.nativeElement.style.visibility = 'visible';
    };
    /** Hides the ink bar. */
    /**
     * Hides the ink bar.
     * @return {?}
     */
    MatInkBar.prototype.hide = /**
     * Hides the ink bar.
     * @return {?}
     */
    function () {
        this._elementRef.nativeElement.style.visibility = 'hidden';
    };
    /**
     * Sets the proper styles to the ink bar element.
     * @param element
     */
    /**
     * Sets the proper styles to the ink bar element.
     * @private
     * @param {?} element
     * @return {?}
     */
    MatInkBar.prototype._setStyles = /**
     * Sets the proper styles to the ink bar element.
     * @private
     * @param {?} element
     * @return {?}
     */
    function (element) {
        /** @type {?} */
        var positions = this._inkBarPositioner(element);
        /** @type {?} */
        var inkBar = this._elementRef.nativeElement;
        inkBar.style.left = positions.left;
        inkBar.style.width = positions.width;
    };
    MatInkBar.decorators = [
        { type: Directive, args: [{
                    selector: 'mat-ink-bar',
                    host: {
                        'class': 'mat-ink-bar',
                    },
                },] },
    ];
    /** @nocollapse */
    MatInkBar.ctorParameters = function () { return [
        { type: ElementRef },
        { type: NgZone },
        { type: undefined, decorators: [{ type: Inject, args: [_MAT_INK_BAR_POSITIONER,] }] }
    ]; };
    return MatInkBar;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * Decorates the `ng-template` tags and reads out the template from it.
 */
var MatTabContent = /** @class */ (function () {
    function MatTabContent(template) {
        this.template = template;
    }
    MatTabContent.decorators = [
        { type: Directive, args: [{ selector: '[matTabContent]' },] },
    ];
    /** @nocollapse */
    MatTabContent.ctorParameters = function () { return [
        { type: TemplateRef }
    ]; };
    return MatTabContent;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * Used to flag tab labels for use with the portal directive
 */
var MatTabLabel = /** @class */ (function (_super) {
    __extends(MatTabLabel, _super);
    function MatTabLabel() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MatTabLabel.decorators = [
        { type: Directive, args: [{
                    selector: '[mat-tab-label], [matTabLabel]',
                },] },
    ];
    return MatTabLabel;
}(CdkPortal));

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
// Boilerplate for applying mixins to MatTab.
/**
 * \@docs-private
 */
var  
// Boilerplate for applying mixins to MatTab.
/**
 * \@docs-private
 */
MatTabBase = /** @class */ (function () {
    function MatTabBase() {
    }
    return MatTabBase;
}());
/** @type {?} */
var _MatTabMixinBase = mixinDisabled(MatTabBase);
var MatTab = /** @class */ (function (_super) {
    __extends(MatTab, _super);
    function MatTab(_viewContainerRef) {
        var _this = _super.call(this) || this;
        _this._viewContainerRef = _viewContainerRef;
        /**
         * Plain text label for the tab, used when there is no template label.
         */
        _this.textLabel = '';
        /**
         * Portal that will be the hosted content of the tab
         */
        _this._contentPortal = null;
        /**
         * Emits whenever the internal state of the tab changes.
         */
        _this._stateChanges = new Subject();
        /**
         * The relatively indexed position where 0 represents the center, negative is left, and positive
         * represents the right.
         */
        _this.position = null;
        /**
         * The initial relatively index origin of the tab if it was created and selected after there
         * was already a selected tab. Provides context of what position the tab should originate from.
         */
        _this.origin = null;
        /**
         * Whether the tab is currently active.
         */
        _this.isActive = false;
        return _this;
    }
    Object.defineProperty(MatTab.prototype, "content", {
        /** @docs-private */
        get: /**
         * \@docs-private
         * @return {?}
         */
        function () {
            return this._contentPortal;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * @param {?} changes
     * @return {?}
     */
    MatTab.prototype.ngOnChanges = /**
     * @param {?} changes
     * @return {?}
     */
    function (changes) {
        if (changes.hasOwnProperty('textLabel') || changes.hasOwnProperty('disabled')) {
            this._stateChanges.next();
        }
    };
    /**
     * @return {?}
     */
    MatTab.prototype.ngOnDestroy = /**
     * @return {?}
     */
    function () {
        this._stateChanges.complete();
    };
    /**
     * @return {?}
     */
    MatTab.prototype.ngOnInit = /**
     * @return {?}
     */
    function () {
        this._contentPortal = new TemplatePortal(this._explicitContent || this._implicitContent, this._viewContainerRef);
    };
    MatTab.decorators = [
        { type: Component, args: [{selector: 'mat-tab',
                    template: "<ng-template><ng-content></ng-content></ng-template>",
                    inputs: ['disabled'],
                    changeDetection: ChangeDetectionStrategy.OnPush,
                    encapsulation: ViewEncapsulation.None,
                    exportAs: 'matTab',
                },] },
    ];
    /** @nocollapse */
    MatTab.ctorParameters = function () { return [
        { type: ViewContainerRef }
    ]; };
    MatTab.propDecorators = {
        templateLabel: [{ type: ContentChild, args: [MatTabLabel,] }],
        _explicitContent: [{ type: ContentChild, args: [MatTabContent, { read: TemplateRef },] }],
        _implicitContent: [{ type: ViewChild, args: [TemplateRef,] }],
        textLabel: [{ type: Input, args: ['label',] }],
        ariaLabel: [{ type: Input, args: ['aria-label',] }],
        ariaLabelledby: [{ type: Input, args: ['aria-labelledby',] }]
    };
    return MatTab;
}(_MatTabMixinBase));

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * Animations used by the Material tabs.
 * \@docs-private
 * @type {?}
 */
var matTabsAnimations = {
    /**
     * Animation translates a tab along the X axis.
     */
    translateTab: trigger('translateTab', [
        // Note: transitions to `none` instead of 0, because some browsers might blur the content.
        state('center, void, left-origin-center, right-origin-center', style({ transform: 'none' })),
        // If the tab is either on the left or right, we additionally add a `min-height` of 1px
        // in order to ensure that the element has a height before its state changes. This is
        // necessary because Chrome does seem to skip the transition in RTL mode if the element does
        // not have a static height and is not rendered. See related issue: #9465
        state('left', style({ transform: 'translate3d(-100%, 0, 0)', minHeight: '1px' })),
        state('right', style({ transform: 'translate3d(100%, 0, 0)', minHeight: '1px' })),
        transition('* => left, * => right, left => center, right => center', animate('{{animationDuration}} cubic-bezier(0.35, 0, 0.25, 1)')),
        transition('void => left-origin-center', [
            style({ transform: 'translate3d(-100%, 0, 0)' }),
            animate('{{animationDuration}} cubic-bezier(0.35, 0, 0.25, 1)')
        ]),
        transition('void => right-origin-center', [
            style({ transform: 'translate3d(100%, 0, 0)' }),
            animate('{{animationDuration}} cubic-bezier(0.35, 0, 0.25, 1)')
        ])
    ])
};

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * The portal host directive for the contents of the tab.
 * \@docs-private
 */
var MatTabBodyPortal = /** @class */ (function (_super) {
    __extends(MatTabBodyPortal, _super);
    function MatTabBodyPortal(componentFactoryResolver, viewContainerRef, _host) {
        var _this = _super.call(this, componentFactoryResolver, viewContainerRef) || this;
        _this._host = _host;
        /**
         * Subscription to events for when the tab body begins centering.
         */
        _this._centeringSub = Subscription.EMPTY;
        /**
         * Subscription to events for when the tab body finishes leaving from center position.
         */
        _this._leavingSub = Subscription.EMPTY;
        return _this;
    }
    /** Set initial visibility or set up subscription for changing visibility. */
    /**
     * Set initial visibility or set up subscription for changing visibility.
     * @return {?}
     */
    MatTabBodyPortal.prototype.ngOnInit = /**
     * Set initial visibility or set up subscription for changing visibility.
     * @return {?}
     */
    function () {
        var _this = this;
        _super.prototype.ngOnInit.call(this);
        this._centeringSub = this._host._beforeCentering
            .pipe(startWith(this._host._isCenterPosition(this._host._position)))
            .subscribe(function (isCentering) {
            if (isCentering && !_this.hasAttached()) {
                _this.attach(_this._host._content);
            }
        });
        this._leavingSub = this._host._afterLeavingCenter.subscribe(function () {
            _this.detach();
        });
    };
    /** Clean up centering subscription. */
    /**
     * Clean up centering subscription.
     * @return {?}
     */
    MatTabBodyPortal.prototype.ngOnDestroy = /**
     * Clean up centering subscription.
     * @return {?}
     */
    function () {
        _super.prototype.ngOnDestroy.call(this);
        this._centeringSub.unsubscribe();
        this._leavingSub.unsubscribe();
    };
    MatTabBodyPortal.decorators = [
        { type: Directive, args: [{
                    selector: '[matTabBodyHost]'
                },] },
    ];
    /** @nocollapse */
    MatTabBodyPortal.ctorParameters = function () { return [
        { type: ComponentFactoryResolver },
        { type: ViewContainerRef },
        { type: MatTabBody, decorators: [{ type: Inject, args: [forwardRef(function () { return MatTabBody; }),] }] }
    ]; };
    return MatTabBodyPortal;
}(CdkPortalOutlet));
/**
 * Wrapper for the contents of a tab.
 * \@docs-private
 */
var MatTabBody = /** @class */ (function () {
    function MatTabBody(_elementRef, _dir, 
    /**
     * @breaking-change 8.0.0 changeDetectorRef to be made required.
     */
    changeDetectorRef) {
        var _this = this;
        this._elementRef = _elementRef;
        this._dir = _dir;
        /**
         * Subscription to the directionality change observable.
         */
        this._dirChangeSubscription = Subscription.EMPTY;
        /**
         * Emits when an animation on the tab is complete.
         */
        this._translateTabComplete = new Subject();
        /**
         * Event emitted when the tab begins to animate towards the center as the active tab.
         */
        this._onCentering = new EventEmitter();
        /**
         * Event emitted before the centering of the tab begins.
         */
        this._beforeCentering = new EventEmitter();
        /**
         * Event emitted before the centering of the tab begins.
         */
        this._afterLeavingCenter = new EventEmitter();
        /**
         * Event emitted when the tab completes its animation towards the center.
         */
        this._onCentered = new EventEmitter(true);
        // Note that the default value will always be overwritten by `MatTabBody`, but we need one
        // anyway to prevent the animations module from throwing an error if the body is used on its own.
        /**
         * Duration for the tab's animation.
         */
        this.animationDuration = '500ms';
        if (this._dir && changeDetectorRef) {
            this._dirChangeSubscription = this._dir.change.subscribe(function (dir) {
                _this._computePositionAnimationState(dir);
                changeDetectorRef.markForCheck();
            });
        }
        // Ensure that we get unique animation events, because the `.done` callback can get
        // invoked twice in some browsers. See https://github.com/angular/angular/issues/24084.
        this._translateTabComplete.pipe(distinctUntilChanged(function (x, y) {
            return x.fromState === y.fromState && x.toState === y.toState;
        })).subscribe(function (event) {
            // If the transition to the center is complete, emit an event.
            if (_this._isCenterPosition(event.toState) && _this._isCenterPosition(_this._position)) {
                _this._onCentered.emit();
            }
            if (_this._isCenterPosition(event.fromState) && !_this._isCenterPosition(_this._position)) {
                _this._afterLeavingCenter.emit();
            }
        });
    }
    Object.defineProperty(MatTabBody.prototype, "position", {
        /** The shifted index position of the tab body, where zero represents the active center tab. */
        set: /**
         * The shifted index position of the tab body, where zero represents the active center tab.
         * @param {?} position
         * @return {?}
         */
        function (position) {
            this._positionIndex = position;
            this._computePositionAnimationState();
        },
        enumerable: true,
        configurable: true
    });
    /**
     * After initialized, check if the content is centered and has an origin. If so, set the
     * special position states that transition the tab from the left or right before centering.
     */
    /**
     * After initialized, check if the content is centered and has an origin. If so, set the
     * special position states that transition the tab from the left or right before centering.
     * @return {?}
     */
    MatTabBody.prototype.ngOnInit = /**
     * After initialized, check if the content is centered and has an origin. If so, set the
     * special position states that transition the tab from the left or right before centering.
     * @return {?}
     */
    function () {
        if (this._position == 'center' && this.origin != null) {
            this._position = this._computePositionFromOrigin();
        }
    };
    /**
     * @return {?}
     */
    MatTabBody.prototype.ngOnDestroy = /**
     * @return {?}
     */
    function () {
        this._dirChangeSubscription.unsubscribe();
        this._translateTabComplete.complete();
    };
    /**
     * @param {?} event
     * @return {?}
     */
    MatTabBody.prototype._onTranslateTabStarted = /**
     * @param {?} event
     * @return {?}
     */
    function (event) {
        /** @type {?} */
        var isCentering = this._isCenterPosition(event.toState);
        this._beforeCentering.emit(isCentering);
        if (isCentering) {
            this._onCentering.emit(this._elementRef.nativeElement.clientHeight);
        }
    };
    /** The text direction of the containing app. */
    /**
     * The text direction of the containing app.
     * @return {?}
     */
    MatTabBody.prototype._getLayoutDirection = /**
     * The text direction of the containing app.
     * @return {?}
     */
    function () {
        return this._dir && this._dir.value === 'rtl' ? 'rtl' : 'ltr';
    };
    /** Whether the provided position state is considered center, regardless of origin. */
    /**
     * Whether the provided position state is considered center, regardless of origin.
     * @param {?} position
     * @return {?}
     */
    MatTabBody.prototype._isCenterPosition = /**
     * Whether the provided position state is considered center, regardless of origin.
     * @param {?} position
     * @return {?}
     */
    function (position) {
        return position == 'center' ||
            position == 'left-origin-center' ||
            position == 'right-origin-center';
    };
    /** Computes the position state that will be used for the tab-body animation trigger. */
    /**
     * Computes the position state that will be used for the tab-body animation trigger.
     * @private
     * @param {?=} dir
     * @return {?}
     */
    MatTabBody.prototype._computePositionAnimationState = /**
     * Computes the position state that will be used for the tab-body animation trigger.
     * @private
     * @param {?=} dir
     * @return {?}
     */
    function (dir) {
        if (dir === void 0) { dir = this._getLayoutDirection(); }
        if (this._positionIndex < 0) {
            this._position = dir == 'ltr' ? 'left' : 'right';
        }
        else if (this._positionIndex > 0) {
            this._position = dir == 'ltr' ? 'right' : 'left';
        }
        else {
            this._position = 'center';
        }
    };
    /**
     * Computes the position state based on the specified origin position. This is used if the
     * tab is becoming visible immediately after creation.
     */
    /**
     * Computes the position state based on the specified origin position. This is used if the
     * tab is becoming visible immediately after creation.
     * @private
     * @return {?}
     */
    MatTabBody.prototype._computePositionFromOrigin = /**
     * Computes the position state based on the specified origin position. This is used if the
     * tab is becoming visible immediately after creation.
     * @private
     * @return {?}
     */
    function () {
        /** @type {?} */
        var dir = this._getLayoutDirection();
        if ((dir == 'ltr' && this.origin <= 0) || (dir == 'rtl' && this.origin > 0)) {
            return 'left-origin-center';
        }
        return 'right-origin-center';
    };
    MatTabBody.decorators = [
        { type: Component, args: [{selector: 'mat-tab-body',
                    template: "<div class=\"mat-tab-body-content\" #content [@translateTab]=\"{ value: _position, params: {animationDuration: animationDuration} }\" (@translateTab.start)=\"_onTranslateTabStarted($event)\" (@translateTab.done)=\"_translateTabComplete.next($event)\"><ng-template matTabBodyHost></ng-template></div>",
                    styles: [".mat-tab-body-content{height:100%;overflow:auto}.mat-tab-group-dynamic-height .mat-tab-body-content{overflow:hidden}"],
                    encapsulation: ViewEncapsulation.None,
                    changeDetection: ChangeDetectionStrategy.OnPush,
                    animations: [matTabsAnimations.translateTab],
                    host: {
                        'class': 'mat-tab-body',
                    },
                },] },
    ];
    /** @nocollapse */
    MatTabBody.ctorParameters = function () { return [
        { type: ElementRef },
        { type: Directionality, decorators: [{ type: Optional }] },
        { type: ChangeDetectorRef }
    ]; };
    MatTabBody.propDecorators = {
        _onCentering: [{ type: Output }],
        _beforeCentering: [{ type: Output }],
        _afterLeavingCenter: [{ type: Output }],
        _onCentered: [{ type: Output }],
        _portalHost: [{ type: ViewChild, args: [PortalHostDirective,] }],
        _content: [{ type: Input, args: ['content',] }],
        origin: [{ type: Input }],
        animationDuration: [{ type: Input }],
        position: [{ type: Input }]
    };
    return MatTabBody;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
// Boilerplate for applying mixins to MatTabLabelWrapper.
/**
 * \@docs-private
 */
var  
// Boilerplate for applying mixins to MatTabLabelWrapper.
/**
 * \@docs-private
 */
MatTabLabelWrapperBase = /** @class */ (function () {
    function MatTabLabelWrapperBase() {
    }
    return MatTabLabelWrapperBase;
}());
/** @type {?} */
var _MatTabLabelWrapperMixinBase = mixinDisabled(MatTabLabelWrapperBase);
/**
 * Used in the `mat-tab-group` view to display tab labels.
 * \@docs-private
 */
var MatTabLabelWrapper = /** @class */ (function (_super) {
    __extends(MatTabLabelWrapper, _super);
    function MatTabLabelWrapper(elementRef) {
        var _this = _super.call(this) || this;
        _this.elementRef = elementRef;
        return _this;
    }
    /** Sets focus on the wrapper element */
    /**
     * Sets focus on the wrapper element
     * @return {?}
     */
    MatTabLabelWrapper.prototype.focus = /**
     * Sets focus on the wrapper element
     * @return {?}
     */
    function () {
        this.elementRef.nativeElement.focus();
    };
    /**
     * @return {?}
     */
    MatTabLabelWrapper.prototype.getOffsetLeft = /**
     * @return {?}
     */
    function () {
        return this.elementRef.nativeElement.offsetLeft;
    };
    /**
     * @return {?}
     */
    MatTabLabelWrapper.prototype.getOffsetWidth = /**
     * @return {?}
     */
    function () {
        return this.elementRef.nativeElement.offsetWidth;
    };
    MatTabLabelWrapper.decorators = [
        { type: Directive, args: [{
                    selector: '[matTabLabelWrapper]',
                    inputs: ['disabled'],
                    host: {
                        '[class.mat-tab-disabled]': 'disabled',
                        '[attr.aria-disabled]': '!!disabled',
                    }
                },] },
    ];
    /** @nocollapse */
    MatTabLabelWrapper.ctorParameters = function () { return [
        { type: ElementRef }
    ]; };
    return MatTabLabelWrapper;
}(_MatTabLabelWrapperMixinBase));

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * Config used to bind passive event listeners
 * @type {?}
 */
var passiveEventListenerOptions = (/** @type {?} */ (normalizePassiveListenerOptions({ passive: true })));
/**
 * The distance in pixels that will be overshot when scrolling a tab label into view. This helps
 * provide a small affordance to the label next to it.
 * @type {?}
 */
var EXAGGERATED_OVERSCROLL = 60;
/**
 * Amount of milliseconds to wait before starting to scroll the header automatically.
 * Set a little conservatively in order to handle fake events dispatched on touch devices.
 * @type {?}
 */
var HEADER_SCROLL_DELAY = 650;
/**
 * Interval in milliseconds at which to scroll the header
 * while the user is holding their pointer.
 * @type {?}
 */
var HEADER_SCROLL_INTERVAL = 100;
// Boilerplate for applying mixins to MatTabHeader.
/**
 * \@docs-private
 */
var  
// Boilerplate for applying mixins to MatTabHeader.
/**
 * \@docs-private
 */
MatTabHeaderBase = /** @class */ (function () {
    function MatTabHeaderBase() {
    }
    return MatTabHeaderBase;
}());
/** @type {?} */
var _MatTabHeaderMixinBase = mixinDisableRipple(MatTabHeaderBase);
/**
 * The header of the tab group which displays a list of all the tabs in the tab group. Includes
 * an ink bar that follows the currently selected tab. When the tabs list's width exceeds the
 * width of the header container, then arrows will be displayed to allow the user to scroll
 * left and right across the header.
 * \@docs-private
 */
var MatTabHeader = /** @class */ (function (_super) {
    __extends(MatTabHeader, _super);
    function MatTabHeader(_elementRef, _changeDetectorRef, _viewportRuler, _dir, _ngZone, _platform) {
        var _this = _super.call(this) || this;
        _this._elementRef = _elementRef;
        _this._changeDetectorRef = _changeDetectorRef;
        _this._viewportRuler = _viewportRuler;
        _this._dir = _dir;
        _this._ngZone = _ngZone;
        _this._platform = _platform;
        /**
         * The distance in pixels that the tab labels should be translated to the left.
         */
        _this._scrollDistance = 0;
        /**
         * Whether the header should scroll to the selected index after the view has been checked.
         */
        _this._selectedIndexChanged = false;
        /**
         * Emits when the component is destroyed.
         */
        _this._destroyed = new Subject();
        /**
         * Whether the controls for pagination should be displayed
         */
        _this._showPaginationControls = false;
        /**
         * Whether the tab list can be scrolled more towards the end of the tab label list.
         */
        _this._disableScrollAfter = true;
        /**
         * Whether the tab list can be scrolled more towards the beginning of the tab label list.
         */
        _this._disableScrollBefore = true;
        /**
         * Stream that will stop the automated scrolling.
         */
        _this._stopScrolling = new Subject();
        _this._selectedIndex = 0;
        /**
         * Event emitted when the option is selected.
         */
        _this.selectFocusedIndex = new EventEmitter();
        /**
         * Event emitted when a label is focused.
         */
        _this.indexFocused = new EventEmitter();
        /** @type {?} */
        var element = _elementRef.nativeElement;
        /** @type {?} */
        var bindEvent = function () {
            fromEvent(element, 'mouseleave')
                .pipe(takeUntil(_this._destroyed))
                .subscribe(function () {
                _this._stopInterval();
            });
        };
        // @breaking-change 8.0.0 remove null check once _ngZone is made into a required parameter.
        if (_ngZone) {
            // Bind the `mouseleave` event on the outside since it doesn't change anything in the view.
            _ngZone.runOutsideAngular(bindEvent);
        }
        else {
            bindEvent();
        }
        return _this;
    }
    Object.defineProperty(MatTabHeader.prototype, "selectedIndex", {
        /** The index of the active tab. */
        get: /**
         * The index of the active tab.
         * @return {?}
         */
        function () { return this._selectedIndex; },
        set: /**
         * @param {?} value
         * @return {?}
         */
        function (value) {
            value = coerceNumberProperty(value);
            this._selectedIndexChanged = this._selectedIndex != value;
            this._selectedIndex = value;
            if (this._keyManager) {
                this._keyManager.updateActiveItemIndex(value);
            }
        },
        enumerable: true,
        configurable: true
    });
    /**
     * @return {?}
     */
    MatTabHeader.prototype.ngAfterContentChecked = /**
     * @return {?}
     */
    function () {
        // If the number of tab labels have changed, check if scrolling should be enabled
        if (this._tabLabelCount != this._labelWrappers.length) {
            this.updatePagination();
            this._tabLabelCount = this._labelWrappers.length;
            this._changeDetectorRef.markForCheck();
        }
        // If the selected index has changed, scroll to the label and check if the scrolling controls
        // should be disabled.
        if (this._selectedIndexChanged) {
            this._scrollToLabel(this._selectedIndex);
            this._checkScrollingControls();
            this._alignInkBarToSelectedTab();
            this._selectedIndexChanged = false;
            this._changeDetectorRef.markForCheck();
        }
        // If the scroll distance has been changed (tab selected, focused, scroll controls activated),
        // then translate the header to reflect this.
        if (this._scrollDistanceChanged) {
            this._updateTabScrollPosition();
            this._scrollDistanceChanged = false;
            this._changeDetectorRef.markForCheck();
        }
    };
    /** Handles keyboard events on the header. */
    /**
     * Handles keyboard events on the header.
     * @param {?} event
     * @return {?}
     */
    MatTabHeader.prototype._handleKeydown = /**
     * Handles keyboard events on the header.
     * @param {?} event
     * @return {?}
     */
    function (event) {
        // We don't handle any key bindings with a modifier key.
        if (hasModifierKey(event)) {
            return;
        }
        switch (event.keyCode) {
            case HOME:
                this._keyManager.setFirstItemActive();
                event.preventDefault();
                break;
            case END:
                this._keyManager.setLastItemActive();
                event.preventDefault();
                break;
            case ENTER:
            case SPACE:
                this.selectFocusedIndex.emit(this.focusIndex);
                event.preventDefault();
                break;
            default:
                this._keyManager.onKeydown(event);
        }
    };
    /**
     * Aligns the ink bar to the selected tab on load.
     */
    /**
     * Aligns the ink bar to the selected tab on load.
     * @return {?}
     */
    MatTabHeader.prototype.ngAfterContentInit = /**
     * Aligns the ink bar to the selected tab on load.
     * @return {?}
     */
    function () {
        var _this = this;
        /** @type {?} */
        var dirChange = this._dir ? this._dir.change : of(null);
        /** @type {?} */
        var resize = this._viewportRuler.change(150);
        /** @type {?} */
        var realign = function () {
            _this.updatePagination();
            _this._alignInkBarToSelectedTab();
        };
        this._keyManager = new FocusKeyManager(this._labelWrappers)
            .withHorizontalOrientation(this._getLayoutDirection())
            .withWrap();
        this._keyManager.updateActiveItem(0);
        // Defer the first call in order to allow for slower browsers to lay out the elements.
        // This helps in cases where the user lands directly on a page with paginated tabs.
        typeof requestAnimationFrame !== 'undefined' ? requestAnimationFrame(realign) : realign();
        // On dir change or window resize, realign the ink bar and update the orientation of
        // the key manager if the direction has changed.
        merge(dirChange, resize).pipe(takeUntil(this._destroyed)).subscribe(function () {
            realign();
            _this._keyManager.withHorizontalOrientation(_this._getLayoutDirection());
        });
        // If there is a change in the focus key manager we need to emit the `indexFocused`
        // event in order to provide a public event that notifies about focus changes. Also we realign
        // the tabs container by scrolling the new focused tab into the visible section.
        this._keyManager.change.pipe(takeUntil(this._destroyed)).subscribe(function (newFocusIndex) {
            _this.indexFocused.emit(newFocusIndex);
            _this._setTabFocus(newFocusIndex);
        });
    };
    /**
     * @return {?}
     */
    MatTabHeader.prototype.ngAfterViewInit = /**
     * @return {?}
     */
    function () {
        var _this = this;
        // We need to handle these events manually, because we want to bind passive event listeners.
        fromEvent(this._previousPaginator.nativeElement, 'touchstart', passiveEventListenerOptions)
            .pipe(takeUntil(this._destroyed))
            .subscribe(function () {
            _this._handlePaginatorPress('before');
        });
        fromEvent(this._nextPaginator.nativeElement, 'touchstart', passiveEventListenerOptions)
            .pipe(takeUntil(this._destroyed))
            .subscribe(function () {
            _this._handlePaginatorPress('after');
        });
    };
    /**
     * @return {?}
     */
    MatTabHeader.prototype.ngOnDestroy = /**
     * @return {?}
     */
    function () {
        this._destroyed.next();
        this._destroyed.complete();
        this._stopScrolling.complete();
    };
    /**
     * Callback for when the MutationObserver detects that the content has changed.
     */
    /**
     * Callback for when the MutationObserver detects that the content has changed.
     * @return {?}
     */
    MatTabHeader.prototype._onContentChanges = /**
     * Callback for when the MutationObserver detects that the content has changed.
     * @return {?}
     */
    function () {
        var _this = this;
        /** @type {?} */
        var textContent = this._elementRef.nativeElement.textContent;
        // We need to diff the text content of the header, because the MutationObserver callback
        // will fire even if the text content didn't change which is inefficient and is prone
        // to infinite loops if a poorly constructed expression is passed in (see #14249).
        if (textContent !== this._currentTextContent) {
            this._currentTextContent = textContent;
            /** @type {?} */
            var zoneCallback = function () {
                _this.updatePagination();
                _this._alignInkBarToSelectedTab();
                _this._changeDetectorRef.markForCheck();
            };
            // The content observer runs outside the `NgZone` by default, which
            // means that we need to bring the callback back in ourselves.
            // @breaking-change 8.0.0 Remove null check for `_ngZone` once it's a required parameter.
            this._ngZone ? this._ngZone.run(zoneCallback) : zoneCallback();
        }
    };
    /**
     * Updates the view whether pagination should be enabled or not.
     *
     * WARNING: Calling this method can be very costly in terms of performance.  It should be called
     * as infrequently as possible from outside of the Tabs component as it causes a reflow of the
     * page.
     */
    /**
     * Updates the view whether pagination should be enabled or not.
     *
     * WARNING: Calling this method can be very costly in terms of performance.  It should be called
     * as infrequently as possible from outside of the Tabs component as it causes a reflow of the
     * page.
     * @return {?}
     */
    MatTabHeader.prototype.updatePagination = /**
     * Updates the view whether pagination should be enabled or not.
     *
     * WARNING: Calling this method can be very costly in terms of performance.  It should be called
     * as infrequently as possible from outside of the Tabs component as it causes a reflow of the
     * page.
     * @return {?}
     */
    function () {
        this._checkPaginationEnabled();
        this._checkScrollingControls();
        this._updateTabScrollPosition();
    };
    Object.defineProperty(MatTabHeader.prototype, "focusIndex", {
        /** Tracks which element has focus; used for keyboard navigation */
        get: /**
         * Tracks which element has focus; used for keyboard navigation
         * @return {?}
         */
        function () {
            return this._keyManager ? (/** @type {?} */ (this._keyManager.activeItemIndex)) : 0;
        },
        /** When the focus index is set, we must manually send focus to the correct label */
        set: /**
         * When the focus index is set, we must manually send focus to the correct label
         * @param {?} value
         * @return {?}
         */
        function (value) {
            if (!this._isValidIndex(value) || this.focusIndex === value || !this._keyManager) {
                return;
            }
            this._keyManager.setActiveItem(value);
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Determines if an index is valid.  If the tabs are not ready yet, we assume that the user is
     * providing a valid index and return true.
     */
    /**
     * Determines if an index is valid.  If the tabs are not ready yet, we assume that the user is
     * providing a valid index and return true.
     * @param {?} index
     * @return {?}
     */
    MatTabHeader.prototype._isValidIndex = /**
     * Determines if an index is valid.  If the tabs are not ready yet, we assume that the user is
     * providing a valid index and return true.
     * @param {?} index
     * @return {?}
     */
    function (index) {
        if (!this._labelWrappers) {
            return true;
        }
        /** @type {?} */
        var tab = this._labelWrappers ? this._labelWrappers.toArray()[index] : null;
        return !!tab && !tab.disabled;
    };
    /**
     * Sets focus on the HTML element for the label wrapper and scrolls it into the view if
     * scrolling is enabled.
     */
    /**
     * Sets focus on the HTML element for the label wrapper and scrolls it into the view if
     * scrolling is enabled.
     * @param {?} tabIndex
     * @return {?}
     */
    MatTabHeader.prototype._setTabFocus = /**
     * Sets focus on the HTML element for the label wrapper and scrolls it into the view if
     * scrolling is enabled.
     * @param {?} tabIndex
     * @return {?}
     */
    function (tabIndex) {
        if (this._showPaginationControls) {
            this._scrollToLabel(tabIndex);
        }
        if (this._labelWrappers && this._labelWrappers.length) {
            this._labelWrappers.toArray()[tabIndex].focus();
            // Do not let the browser manage scrolling to focus the element, this will be handled
            // by using translation. In LTR, the scroll left should be 0. In RTL, the scroll width
            // should be the full width minus the offset width.
            /** @type {?} */
            var containerEl = this._tabListContainer.nativeElement;
            /** @type {?} */
            var dir = this._getLayoutDirection();
            if (dir == 'ltr') {
                containerEl.scrollLeft = 0;
            }
            else {
                containerEl.scrollLeft = containerEl.scrollWidth - containerEl.offsetWidth;
            }
        }
    };
    /** The layout direction of the containing app. */
    /**
     * The layout direction of the containing app.
     * @return {?}
     */
    MatTabHeader.prototype._getLayoutDirection = /**
     * The layout direction of the containing app.
     * @return {?}
     */
    function () {
        return this._dir && this._dir.value === 'rtl' ? 'rtl' : 'ltr';
    };
    /** Performs the CSS transformation on the tab list that will cause the list to scroll. */
    /**
     * Performs the CSS transformation on the tab list that will cause the list to scroll.
     * @return {?}
     */
    MatTabHeader.prototype._updateTabScrollPosition = /**
     * Performs the CSS transformation on the tab list that will cause the list to scroll.
     * @return {?}
     */
    function () {
        /** @type {?} */
        var scrollDistance = this.scrollDistance;
        /** @type {?} */
        var platform = this._platform;
        /** @type {?} */
        var translateX = this._getLayoutDirection() === 'ltr' ? -scrollDistance : scrollDistance;
        // Don't use `translate3d` here because we don't want to create a new layer. A new layer
        // seems to cause flickering and overflow in Internet Explorer. For example, the ink bar
        // and ripples will exceed the boundaries of the visible tab bar.
        // See: https://github.com/angular/material2/issues/10276
        // We round the `transform` here, because transforms with sub-pixel precision cause some
        // browsers to blur the content of the element.
        this._tabList.nativeElement.style.transform = "translateX(" + Math.round(translateX) + "px)";
        // Setting the `transform` on IE will change the scroll offset of the parent, causing the
        // position to be thrown off in some cases. We have to reset it ourselves to ensure that
        // it doesn't get thrown off. Note that we scope it only to IE and Edge, because messing
        // with the scroll position throws off Chrome 71+ in RTL mode (see #14689).
        // @breaking-change 8.0.0 Remove null check for `platform`.
        if (platform && (platform.TRIDENT || platform.EDGE)) {
            this._tabListContainer.nativeElement.scrollLeft = 0;
        }
    };
    Object.defineProperty(MatTabHeader.prototype, "scrollDistance", {
        /** Sets the distance in pixels that the tab header should be transformed in the X-axis. */
        get: /**
         * Sets the distance in pixels that the tab header should be transformed in the X-axis.
         * @return {?}
         */
        function () { return this._scrollDistance; },
        set: /**
         * @param {?} value
         * @return {?}
         */
        function (value) {
            this._scrollTo(value);
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Moves the tab list in the 'before' or 'after' direction (towards the beginning of the list or
     * the end of the list, respectively). The distance to scroll is computed to be a third of the
     * length of the tab list view window.
     *
     * This is an expensive call that forces a layout reflow to compute box and scroll metrics and
     * should be called sparingly.
     */
    /**
     * Moves the tab list in the 'before' or 'after' direction (towards the beginning of the list or
     * the end of the list, respectively). The distance to scroll is computed to be a third of the
     * length of the tab list view window.
     *
     * This is an expensive call that forces a layout reflow to compute box and scroll metrics and
     * should be called sparingly.
     * @param {?} direction
     * @return {?}
     */
    MatTabHeader.prototype._scrollHeader = /**
     * Moves the tab list in the 'before' or 'after' direction (towards the beginning of the list or
     * the end of the list, respectively). The distance to scroll is computed to be a third of the
     * length of the tab list view window.
     *
     * This is an expensive call that forces a layout reflow to compute box and scroll metrics and
     * should be called sparingly.
     * @param {?} direction
     * @return {?}
     */
    function (direction) {
        /** @type {?} */
        var viewLength = this._tabListContainer.nativeElement.offsetWidth;
        // Move the scroll distance one-third the length of the tab list's viewport.
        /** @type {?} */
        var scrollAmount = (direction == 'before' ? -1 : 1) * viewLength / 3;
        return this._scrollTo(this._scrollDistance + scrollAmount);
    };
    /** Handles click events on the pagination arrows. */
    /**
     * Handles click events on the pagination arrows.
     * @param {?} direction
     * @return {?}
     */
    MatTabHeader.prototype._handlePaginatorClick = /**
     * Handles click events on the pagination arrows.
     * @param {?} direction
     * @return {?}
     */
    function (direction) {
        this._stopInterval();
        this._scrollHeader(direction);
    };
    /**
     * Moves the tab list such that the desired tab label (marked by index) is moved into view.
     *
     * This is an expensive call that forces a layout reflow to compute box and scroll metrics and
     * should be called sparingly.
     */
    /**
     * Moves the tab list such that the desired tab label (marked by index) is moved into view.
     *
     * This is an expensive call that forces a layout reflow to compute box and scroll metrics and
     * should be called sparingly.
     * @param {?} labelIndex
     * @return {?}
     */
    MatTabHeader.prototype._scrollToLabel = /**
     * Moves the tab list such that the desired tab label (marked by index) is moved into view.
     *
     * This is an expensive call that forces a layout reflow to compute box and scroll metrics and
     * should be called sparingly.
     * @param {?} labelIndex
     * @return {?}
     */
    function (labelIndex) {
        /** @type {?} */
        var selectedLabel = this._labelWrappers ? this._labelWrappers.toArray()[labelIndex] : null;
        if (!selectedLabel) {
            return;
        }
        // The view length is the visible width of the tab labels.
        /** @type {?} */
        var viewLength = this._tabListContainer.nativeElement.offsetWidth;
        /** @type {?} */
        var labelBeforePos;
        /** @type {?} */
        var labelAfterPos;
        if (this._getLayoutDirection() == 'ltr') {
            labelBeforePos = selectedLabel.getOffsetLeft();
            labelAfterPos = labelBeforePos + selectedLabel.getOffsetWidth();
        }
        else {
            labelAfterPos = this._tabList.nativeElement.offsetWidth - selectedLabel.getOffsetLeft();
            labelBeforePos = labelAfterPos - selectedLabel.getOffsetWidth();
        }
        /** @type {?} */
        var beforeVisiblePos = this.scrollDistance;
        /** @type {?} */
        var afterVisiblePos = this.scrollDistance + viewLength;
        if (labelBeforePos < beforeVisiblePos) {
            // Scroll header to move label to the before direction
            this.scrollDistance -= beforeVisiblePos - labelBeforePos + EXAGGERATED_OVERSCROLL;
        }
        else if (labelAfterPos > afterVisiblePos) {
            // Scroll header to move label to the after direction
            this.scrollDistance += labelAfterPos - afterVisiblePos + EXAGGERATED_OVERSCROLL;
        }
    };
    /**
     * Evaluate whether the pagination controls should be displayed. If the scroll width of the
     * tab list is wider than the size of the header container, then the pagination controls should
     * be shown.
     *
     * This is an expensive call that forces a layout reflow to compute box and scroll metrics and
     * should be called sparingly.
     */
    /**
     * Evaluate whether the pagination controls should be displayed. If the scroll width of the
     * tab list is wider than the size of the header container, then the pagination controls should
     * be shown.
     *
     * This is an expensive call that forces a layout reflow to compute box and scroll metrics and
     * should be called sparingly.
     * @return {?}
     */
    MatTabHeader.prototype._checkPaginationEnabled = /**
     * Evaluate whether the pagination controls should be displayed. If the scroll width of the
     * tab list is wider than the size of the header container, then the pagination controls should
     * be shown.
     *
     * This is an expensive call that forces a layout reflow to compute box and scroll metrics and
     * should be called sparingly.
     * @return {?}
     */
    function () {
        /** @type {?} */
        var isEnabled = this._tabList.nativeElement.scrollWidth > this._elementRef.nativeElement.offsetWidth;
        if (!isEnabled) {
            this.scrollDistance = 0;
        }
        if (isEnabled !== this._showPaginationControls) {
            this._changeDetectorRef.markForCheck();
        }
        this._showPaginationControls = isEnabled;
    };
    /**
     * Evaluate whether the before and after controls should be enabled or disabled.
     * If the header is at the beginning of the list (scroll distance is equal to 0) then disable the
     * before button. If the header is at the end of the list (scroll distance is equal to the
     * maximum distance we can scroll), then disable the after button.
     *
     * This is an expensive call that forces a layout reflow to compute box and scroll metrics and
     * should be called sparingly.
     */
    /**
     * Evaluate whether the before and after controls should be enabled or disabled.
     * If the header is at the beginning of the list (scroll distance is equal to 0) then disable the
     * before button. If the header is at the end of the list (scroll distance is equal to the
     * maximum distance we can scroll), then disable the after button.
     *
     * This is an expensive call that forces a layout reflow to compute box and scroll metrics and
     * should be called sparingly.
     * @return {?}
     */
    MatTabHeader.prototype._checkScrollingControls = /**
     * Evaluate whether the before and after controls should be enabled or disabled.
     * If the header is at the beginning of the list (scroll distance is equal to 0) then disable the
     * before button. If the header is at the end of the list (scroll distance is equal to the
     * maximum distance we can scroll), then disable the after button.
     *
     * This is an expensive call that forces a layout reflow to compute box and scroll metrics and
     * should be called sparingly.
     * @return {?}
     */
    function () {
        // Check if the pagination arrows should be activated.
        this._disableScrollBefore = this.scrollDistance == 0;
        this._disableScrollAfter = this.scrollDistance == this._getMaxScrollDistance();
        this._changeDetectorRef.markForCheck();
    };
    /**
     * Determines what is the maximum length in pixels that can be set for the scroll distance. This
     * is equal to the difference in width between the tab list container and tab header container.
     *
     * This is an expensive call that forces a layout reflow to compute box and scroll metrics and
     * should be called sparingly.
     */
    /**
     * Determines what is the maximum length in pixels that can be set for the scroll distance. This
     * is equal to the difference in width between the tab list container and tab header container.
     *
     * This is an expensive call that forces a layout reflow to compute box and scroll metrics and
     * should be called sparingly.
     * @return {?}
     */
    MatTabHeader.prototype._getMaxScrollDistance = /**
     * Determines what is the maximum length in pixels that can be set for the scroll distance. This
     * is equal to the difference in width between the tab list container and tab header container.
     *
     * This is an expensive call that forces a layout reflow to compute box and scroll metrics and
     * should be called sparingly.
     * @return {?}
     */
    function () {
        /** @type {?} */
        var lengthOfTabList = this._tabList.nativeElement.scrollWidth;
        /** @type {?} */
        var viewLength = this._tabListContainer.nativeElement.offsetWidth;
        return (lengthOfTabList - viewLength) || 0;
    };
    /** Tells the ink-bar to align itself to the current label wrapper */
    /**
     * Tells the ink-bar to align itself to the current label wrapper
     * @return {?}
     */
    MatTabHeader.prototype._alignInkBarToSelectedTab = /**
     * Tells the ink-bar to align itself to the current label wrapper
     * @return {?}
     */
    function () {
        /** @type {?} */
        var selectedLabelWrapper = this._labelWrappers && this._labelWrappers.length ?
            this._labelWrappers.toArray()[this.selectedIndex].elementRef.nativeElement :
            null;
        this._inkBar.alignToElement((/** @type {?} */ (selectedLabelWrapper)));
    };
    /** Stops the currently-running paginator interval.  */
    /**
     * Stops the currently-running paginator interval.
     * @return {?}
     */
    MatTabHeader.prototype._stopInterval = /**
     * Stops the currently-running paginator interval.
     * @return {?}
     */
    function () {
        this._stopScrolling.next();
    };
    /**
     * Handles the user pressing down on one of the paginators.
     * Starts scrolling the header after a certain amount of time.
     * @param direction In which direction the paginator should be scrolled.
     */
    /**
     * Handles the user pressing down on one of the paginators.
     * Starts scrolling the header after a certain amount of time.
     * @param {?} direction In which direction the paginator should be scrolled.
     * @return {?}
     */
    MatTabHeader.prototype._handlePaginatorPress = /**
     * Handles the user pressing down on one of the paginators.
     * Starts scrolling the header after a certain amount of time.
     * @param {?} direction In which direction the paginator should be scrolled.
     * @return {?}
     */
    function (direction) {
        var _this = this;
        // Avoid overlapping timers.
        this._stopInterval();
        // Start a timer after the delay and keep firing based on the interval.
        timer(HEADER_SCROLL_DELAY, HEADER_SCROLL_INTERVAL)
            // Keep the timer going until something tells it to stop or the component is destroyed.
            .pipe(takeUntil(merge(this._stopScrolling, this._destroyed)))
            .subscribe(function () {
            var _a = _this._scrollHeader(direction), maxScrollDistance = _a.maxScrollDistance, distance = _a.distance;
            // Stop the timer if we've reached the start or the end.
            if (distance === 0 || distance >= maxScrollDistance) {
                _this._stopInterval();
            }
        });
    };
    /**
     * Scrolls the header to a given position.
     * @param position Position to which to scroll.
     * @returns Information on the current scroll distance and the maximum.
     */
    /**
     * Scrolls the header to a given position.
     * @private
     * @param {?} position Position to which to scroll.
     * @return {?} Information on the current scroll distance and the maximum.
     */
    MatTabHeader.prototype._scrollTo = /**
     * Scrolls the header to a given position.
     * @private
     * @param {?} position Position to which to scroll.
     * @return {?} Information on the current scroll distance and the maximum.
     */
    function (position) {
        /** @type {?} */
        var maxScrollDistance = this._getMaxScrollDistance();
        this._scrollDistance = Math.max(0, Math.min(maxScrollDistance, position));
        // Mark that the scroll distance has changed so that after the view is checked, the CSS
        // transformation can move the header.
        this._scrollDistanceChanged = true;
        this._checkScrollingControls();
        return { maxScrollDistance: maxScrollDistance, distance: this._scrollDistance };
    };
    MatTabHeader.decorators = [
        { type: Component, args: [{selector: 'mat-tab-header',
                    template: "<div class=\"mat-tab-header-pagination mat-tab-header-pagination-before mat-elevation-z4\" #previousPaginator aria-hidden=\"true\" mat-ripple [matRippleDisabled]=\"_disableScrollBefore || disableRipple\" [class.mat-tab-header-pagination-disabled]=\"_disableScrollBefore\" (click)=\"_handlePaginatorClick('before')\" (mousedown)=\"_handlePaginatorPress('before')\" (touchend)=\"_stopInterval()\"><div class=\"mat-tab-header-pagination-chevron\"></div></div><div class=\"mat-tab-label-container\" #tabListContainer (keydown)=\"_handleKeydown($event)\"><div class=\"mat-tab-list\" #tabList role=\"tablist\" (cdkObserveContent)=\"_onContentChanges()\"><div class=\"mat-tab-labels\"><ng-content></ng-content></div><mat-ink-bar></mat-ink-bar></div></div><div class=\"mat-tab-header-pagination mat-tab-header-pagination-after mat-elevation-z4\" #nextPaginator aria-hidden=\"true\" mat-ripple [matRippleDisabled]=\"_disableScrollAfter || disableRipple\" [class.mat-tab-header-pagination-disabled]=\"_disableScrollAfter\" (mousedown)=\"_handlePaginatorPress('after')\" (click)=\"_handlePaginatorClick('after')\" (touchend)=\"_stopInterval()\"><div class=\"mat-tab-header-pagination-chevron\"></div></div>",
                    styles: [".mat-tab-header{display:flex;overflow:hidden;position:relative;flex-shrink:0}.mat-tab-label{height:48px;padding:0 24px;cursor:pointer;box-sizing:border-box;opacity:.6;min-width:160px;text-align:center;display:inline-flex;justify-content:center;align-items:center;white-space:nowrap;position:relative}.mat-tab-label:focus{outline:0}.mat-tab-label:focus:not(.mat-tab-disabled){opacity:1}@media (-ms-high-contrast:active){.mat-tab-label:focus{outline:dotted 2px}}.mat-tab-label.mat-tab-disabled{cursor:default}@media (-ms-high-contrast:active){.mat-tab-label.mat-tab-disabled{opacity:.5}}.mat-tab-label .mat-tab-label-content{display:inline-flex;justify-content:center;align-items:center;white-space:nowrap}@media (-ms-high-contrast:active){.mat-tab-label{opacity:1}}@media (max-width:599px){.mat-tab-label{min-width:72px}}.mat-ink-bar{position:absolute;bottom:0;height:2px;transition:.5s cubic-bezier(.35,0,.25,1)}.mat-tab-group-inverted-header .mat-ink-bar{bottom:auto;top:0}@media (-ms-high-contrast:active){.mat-ink-bar{outline:solid 2px;height:0}}.mat-tab-header-pagination{-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;position:relative;display:none;justify-content:center;align-items:center;min-width:32px;cursor:pointer;z-index:2;-webkit-tap-highlight-color:transparent;touch-action:none}.mat-tab-header-pagination-controls-enabled .mat-tab-header-pagination{display:flex}.mat-tab-header-pagination-before,.mat-tab-header-rtl .mat-tab-header-pagination-after{padding-left:4px}.mat-tab-header-pagination-before .mat-tab-header-pagination-chevron,.mat-tab-header-rtl .mat-tab-header-pagination-after .mat-tab-header-pagination-chevron{transform:rotate(-135deg)}.mat-tab-header-pagination-after,.mat-tab-header-rtl .mat-tab-header-pagination-before{padding-right:4px}.mat-tab-header-pagination-after .mat-tab-header-pagination-chevron,.mat-tab-header-rtl .mat-tab-header-pagination-before .mat-tab-header-pagination-chevron{transform:rotate(45deg)}.mat-tab-header-pagination-chevron{border-style:solid;border-width:2px 2px 0 0;content:'';height:8px;width:8px}.mat-tab-header-pagination-disabled{box-shadow:none;cursor:default}.mat-tab-label-container{display:flex;flex-grow:1;overflow:hidden;z-index:1}.mat-tab-list{flex-grow:1;position:relative;transition:transform .5s cubic-bezier(.35,0,.25,1)}.mat-tab-labels{display:flex}[mat-align-tabs=center] .mat-tab-labels{justify-content:center}[mat-align-tabs=end] .mat-tab-labels{justify-content:flex-end}"],
                    inputs: ['disableRipple'],
                    encapsulation: ViewEncapsulation.None,
                    changeDetection: ChangeDetectionStrategy.OnPush,
                    host: {
                        'class': 'mat-tab-header',
                        '[class.mat-tab-header-pagination-controls-enabled]': '_showPaginationControls',
                        '[class.mat-tab-header-rtl]': "_getLayoutDirection() == 'rtl'",
                    },
                },] },
    ];
    /** @nocollapse */
    MatTabHeader.ctorParameters = function () { return [
        { type: ElementRef },
        { type: ChangeDetectorRef },
        { type: ViewportRuler },
        { type: Directionality, decorators: [{ type: Optional }] },
        { type: NgZone },
        { type: Platform }
    ]; };
    MatTabHeader.propDecorators = {
        _labelWrappers: [{ type: ContentChildren, args: [MatTabLabelWrapper,] }],
        _inkBar: [{ type: ViewChild, args: [MatInkBar,] }],
        _tabListContainer: [{ type: ViewChild, args: ['tabListContainer',] }],
        _tabList: [{ type: ViewChild, args: ['tabList',] }],
        _nextPaginator: [{ type: ViewChild, args: ['nextPaginator',] }],
        _previousPaginator: [{ type: ViewChild, args: ['previousPaginator',] }],
        selectedIndex: [{ type: Input }],
        selectFocusedIndex: [{ type: Output }],
        indexFocused: [{ type: Output }]
    };
    return MatTabHeader;
}(_MatTabHeaderMixinBase));

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * Used to generate unique ID's for each tab component
 * @type {?}
 */
var nextId = 0;
/**
 * A simple change event emitted on focus or selection changes.
 */
var  /**
 * A simple change event emitted on focus or selection changes.
 */
MatTabChangeEvent = /** @class */ (function () {
    function MatTabChangeEvent() {
    }
    return MatTabChangeEvent;
}());
/**
 * Injection token that can be used to provide the default options the tabs module.
 * @type {?}
 */
var MAT_TABS_CONFIG = new InjectionToken('MAT_TABS_CONFIG');
// Boilerplate for applying mixins to MatTabGroup.
/**
 * \@docs-private
 */
var  
// Boilerplate for applying mixins to MatTabGroup.
/**
 * \@docs-private
 */
MatTabGroupBase = /** @class */ (function () {
    function MatTabGroupBase(_elementRef) {
        this._elementRef = _elementRef;
    }
    return MatTabGroupBase;
}());
/** @type {?} */
var _MatTabGroupMixinBase = mixinColor(mixinDisableRipple(MatTabGroupBase), 'primary');
/**
 * Material design tab-group component.  Supports basic tab pairs (label + content) and includes
 * animated ink-bar, keyboard navigation, and screen reader.
 * See: https://material.io/design/components/tabs.html
 */
var MatTabGroup = /** @class */ (function (_super) {
    __extends(MatTabGroup, _super);
    function MatTabGroup(elementRef, _changeDetectorRef, defaultConfig) {
        var _this = _super.call(this, elementRef) || this;
        _this._changeDetectorRef = _changeDetectorRef;
        /**
         * The tab index that should be selected after the content has been checked.
         */
        _this._indexToSelect = 0;
        /**
         * Snapshot of the height of the tab body wrapper before another tab is activated.
         */
        _this._tabBodyWrapperHeight = 0;
        /**
         * Subscription to tabs being added/removed.
         */
        _this._tabsSubscription = Subscription.EMPTY;
        /**
         * Subscription to changes in the tab labels.
         */
        _this._tabLabelSubscription = Subscription.EMPTY;
        _this._dynamicHeight = false;
        _this._selectedIndex = null;
        /**
         * Position of the tab header.
         */
        _this.headerPosition = 'above';
        /**
         * Output to enable support for two-way binding on `[(selectedIndex)]`
         */
        _this.selectedIndexChange = new EventEmitter();
        /**
         * Event emitted when focus has changed within a tab group.
         */
        _this.focusChange = new EventEmitter();
        /**
         * Event emitted when the body animation has completed
         */
        _this.animationDone = new EventEmitter();
        /**
         * Event emitted when the tab selection has changed.
         */
        _this.selectedTabChange = new EventEmitter(true);
        _this._groupId = nextId++;
        _this.animationDuration = defaultConfig && defaultConfig.animationDuration ?
            defaultConfig.animationDuration : '500ms';
        return _this;
    }
    Object.defineProperty(MatTabGroup.prototype, "dynamicHeight", {
        /** Whether the tab group should grow to the size of the active tab. */
        get: /**
         * Whether the tab group should grow to the size of the active tab.
         * @return {?}
         */
        function () { return this._dynamicHeight; },
        set: /**
         * @param {?} value
         * @return {?}
         */
        function (value) { this._dynamicHeight = coerceBooleanProperty(value); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MatTabGroup.prototype, "selectedIndex", {
        /** The index of the active tab. */
        get: /**
         * The index of the active tab.
         * @return {?}
         */
        function () { return this._selectedIndex; },
        set: /**
         * @param {?} value
         * @return {?}
         */
        function (value) {
            this._indexToSelect = coerceNumberProperty(value, null);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MatTabGroup.prototype, "animationDuration", {
        /** Duration for the tab animation. Will be normalized to milliseconds if no units are set. */
        get: /**
         * Duration for the tab animation. Will be normalized to milliseconds if no units are set.
         * @return {?}
         */
        function () { return this._animationDuration; },
        set: /**
         * @param {?} value
         * @return {?}
         */
        function (value) {
            this._animationDuration = /^\d+$/.test(value) ? value + 'ms' : value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MatTabGroup.prototype, "backgroundColor", {
        /** Background color of the tab group. */
        get: /**
         * Background color of the tab group.
         * @return {?}
         */
        function () { return this._backgroundColor; },
        set: /**
         * @param {?} value
         * @return {?}
         */
        function (value) {
            /** @type {?} */
            var nativeElement = this._elementRef.nativeElement;
            nativeElement.classList.remove("mat-background-" + this.backgroundColor);
            if (value) {
                nativeElement.classList.add("mat-background-" + value);
            }
            this._backgroundColor = value;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * After the content is checked, this component knows what tabs have been defined
     * and what the selected index should be. This is where we can know exactly what position
     * each tab should be in according to the new selected index, and additionally we know how
     * a new selected tab should transition in (from the left or right).
     */
    /**
     * After the content is checked, this component knows what tabs have been defined
     * and what the selected index should be. This is where we can know exactly what position
     * each tab should be in according to the new selected index, and additionally we know how
     * a new selected tab should transition in (from the left or right).
     * @return {?}
     */
    MatTabGroup.prototype.ngAfterContentChecked = /**
     * After the content is checked, this component knows what tabs have been defined
     * and what the selected index should be. This is where we can know exactly what position
     * each tab should be in according to the new selected index, and additionally we know how
     * a new selected tab should transition in (from the left or right).
     * @return {?}
     */
    function () {
        var _this = this;
        // Don't clamp the `indexToSelect` immediately in the setter because it can happen that
        // the amount of tabs changes before the actual change detection runs.
        /** @type {?} */
        var indexToSelect = this._indexToSelect = this._clampTabIndex(this._indexToSelect);
        // If there is a change in selected index, emit a change event. Should not trigger if
        // the selected index has not yet been initialized.
        if (this._selectedIndex != indexToSelect) {
            /** @type {?} */
            var isFirstRun_1 = this._selectedIndex == null;
            if (!isFirstRun_1) {
                this.selectedTabChange.emit(this._createChangeEvent(indexToSelect));
            }
            // Changing these values after change detection has run
            // since the checked content may contain references to them.
            Promise.resolve().then(function () {
                _this._tabs.forEach(function (tab, index) { return tab.isActive = index === indexToSelect; });
                if (!isFirstRun_1) {
                    _this.selectedIndexChange.emit(indexToSelect);
                }
            });
        }
        // Setup the position for each tab and optionally setup an origin on the next selected tab.
        this._tabs.forEach(function (tab, index) {
            tab.position = index - indexToSelect;
            // If there is already a selected tab, then set up an origin for the next selected tab
            // if it doesn't have one already.
            if (_this._selectedIndex != null && tab.position == 0 && !tab.origin) {
                tab.origin = indexToSelect - _this._selectedIndex;
            }
        });
        if (this._selectedIndex !== indexToSelect) {
            this._selectedIndex = indexToSelect;
            this._changeDetectorRef.markForCheck();
        }
    };
    /**
     * @return {?}
     */
    MatTabGroup.prototype.ngAfterContentInit = /**
     * @return {?}
     */
    function () {
        var _this = this;
        this._subscribeToTabLabels();
        // Subscribe to changes in the amount of tabs, in order to be
        // able to re-render the content as new tabs are added or removed.
        this._tabsSubscription = this._tabs.changes.subscribe(function () {
            /** @type {?} */
            var indexToSelect = _this._clampTabIndex(_this._indexToSelect);
            // Maintain the previously-selected tab if a new tab is added or removed and there is no
            // explicit change that selects a different tab.
            if (indexToSelect === _this._selectedIndex) {
                /** @type {?} */
                var tabs = _this._tabs.toArray();
                for (var i = 0; i < tabs.length; i++) {
                    if (tabs[i].isActive) {
                        // Assign both to the `_indexToSelect` and `_selectedIndex` so we don't fire a changed
                        // event, otherwise the consumer may end up in an infinite loop in some edge cases like
                        // adding a tab within the `selectedIndexChange` event.
                        _this._indexToSelect = _this._selectedIndex = i;
                        break;
                    }
                }
            }
            _this._subscribeToTabLabels();
            _this._changeDetectorRef.markForCheck();
        });
    };
    /**
     * @return {?}
     */
    MatTabGroup.prototype.ngOnDestroy = /**
     * @return {?}
     */
    function () {
        this._tabsSubscription.unsubscribe();
        this._tabLabelSubscription.unsubscribe();
    };
    /** Re-aligns the ink bar to the selected tab element. */
    /**
     * Re-aligns the ink bar to the selected tab element.
     * @return {?}
     */
    MatTabGroup.prototype.realignInkBar = /**
     * Re-aligns the ink bar to the selected tab element.
     * @return {?}
     */
    function () {
        if (this._tabHeader) {
            this._tabHeader._alignInkBarToSelectedTab();
        }
    };
    /**
     * @param {?} index
     * @return {?}
     */
    MatTabGroup.prototype._focusChanged = /**
     * @param {?} index
     * @return {?}
     */
    function (index) {
        this.focusChange.emit(this._createChangeEvent(index));
    };
    /**
     * @private
     * @param {?} index
     * @return {?}
     */
    MatTabGroup.prototype._createChangeEvent = /**
     * @private
     * @param {?} index
     * @return {?}
     */
    function (index) {
        /** @type {?} */
        var event = new MatTabChangeEvent;
        event.index = index;
        if (this._tabs && this._tabs.length) {
            event.tab = this._tabs.toArray()[index];
        }
        return event;
    };
    /**
     * Subscribes to changes in the tab labels. This is needed, because the @Input for the label is
     * on the MatTab component, whereas the data binding is inside the MatTabGroup. In order for the
     * binding to be updated, we need to subscribe to changes in it and trigger change detection
     * manually.
     */
    /**
     * Subscribes to changes in the tab labels. This is needed, because the \@Input for the label is
     * on the MatTab component, whereas the data binding is inside the MatTabGroup. In order for the
     * binding to be updated, we need to subscribe to changes in it and trigger change detection
     * manually.
     * @private
     * @return {?}
     */
    MatTabGroup.prototype._subscribeToTabLabels = /**
     * Subscribes to changes in the tab labels. This is needed, because the \@Input for the label is
     * on the MatTab component, whereas the data binding is inside the MatTabGroup. In order for the
     * binding to be updated, we need to subscribe to changes in it and trigger change detection
     * manually.
     * @private
     * @return {?}
     */
    function () {
        var _this = this;
        if (this._tabLabelSubscription) {
            this._tabLabelSubscription.unsubscribe();
        }
        this._tabLabelSubscription = merge.apply(void 0, this._tabs.map(function (tab) { return tab._stateChanges; })).subscribe(function () { return _this._changeDetectorRef.markForCheck(); });
    };
    /** Clamps the given index to the bounds of 0 and the tabs length. */
    /**
     * Clamps the given index to the bounds of 0 and the tabs length.
     * @private
     * @param {?} index
     * @return {?}
     */
    MatTabGroup.prototype._clampTabIndex = /**
     * Clamps the given index to the bounds of 0 and the tabs length.
     * @private
     * @param {?} index
     * @return {?}
     */
    function (index) {
        // Note the `|| 0`, which ensures that values like NaN can't get through
        // and which would otherwise throw the component into an infinite loop
        // (since Math.max(NaN, 0) === NaN).
        return Math.min(this._tabs.length - 1, Math.max(index || 0, 0));
    };
    /** Returns a unique id for each tab label element */
    /**
     * Returns a unique id for each tab label element
     * @param {?} i
     * @return {?}
     */
    MatTabGroup.prototype._getTabLabelId = /**
     * Returns a unique id for each tab label element
     * @param {?} i
     * @return {?}
     */
    function (i) {
        return "mat-tab-label-" + this._groupId + "-" + i;
    };
    /** Returns a unique id for each tab content element */
    /**
     * Returns a unique id for each tab content element
     * @param {?} i
     * @return {?}
     */
    MatTabGroup.prototype._getTabContentId = /**
     * Returns a unique id for each tab content element
     * @param {?} i
     * @return {?}
     */
    function (i) {
        return "mat-tab-content-" + this._groupId + "-" + i;
    };
    /**
     * Sets the height of the body wrapper to the height of the activating tab if dynamic
     * height property is true.
     */
    /**
     * Sets the height of the body wrapper to the height of the activating tab if dynamic
     * height property is true.
     * @param {?} tabHeight
     * @return {?}
     */
    MatTabGroup.prototype._setTabBodyWrapperHeight = /**
     * Sets the height of the body wrapper to the height of the activating tab if dynamic
     * height property is true.
     * @param {?} tabHeight
     * @return {?}
     */
    function (tabHeight) {
        if (!this._dynamicHeight || !this._tabBodyWrapperHeight) {
            return;
        }
        /** @type {?} */
        var wrapper = this._tabBodyWrapper.nativeElement;
        wrapper.style.height = this._tabBodyWrapperHeight + 'px';
        // This conditional forces the browser to paint the height so that
        // the animation to the new height can have an origin.
        if (this._tabBodyWrapper.nativeElement.offsetHeight) {
            wrapper.style.height = tabHeight + 'px';
        }
    };
    /** Removes the height of the tab body wrapper. */
    /**
     * Removes the height of the tab body wrapper.
     * @return {?}
     */
    MatTabGroup.prototype._removeTabBodyWrapperHeight = /**
     * Removes the height of the tab body wrapper.
     * @return {?}
     */
    function () {
        /** @type {?} */
        var wrapper = this._tabBodyWrapper.nativeElement;
        this._tabBodyWrapperHeight = wrapper.clientHeight;
        wrapper.style.height = '';
        this.animationDone.emit();
    };
    /** Handle click events, setting new selected index if appropriate. */
    /**
     * Handle click events, setting new selected index if appropriate.
     * @param {?} tab
     * @param {?} tabHeader
     * @param {?} index
     * @return {?}
     */
    MatTabGroup.prototype._handleClick = /**
     * Handle click events, setting new selected index if appropriate.
     * @param {?} tab
     * @param {?} tabHeader
     * @param {?} index
     * @return {?}
     */
    function (tab, tabHeader, index) {
        if (!tab.disabled) {
            this.selectedIndex = tabHeader.focusIndex = index;
        }
    };
    /** Retrieves the tabindex for the tab. */
    /**
     * Retrieves the tabindex for the tab.
     * @param {?} tab
     * @param {?} idx
     * @return {?}
     */
    MatTabGroup.prototype._getTabIndex = /**
     * Retrieves the tabindex for the tab.
     * @param {?} tab
     * @param {?} idx
     * @return {?}
     */
    function (tab, idx) {
        if (tab.disabled) {
            return null;
        }
        return this.selectedIndex === idx ? 0 : -1;
    };
    MatTabGroup.decorators = [
        { type: Component, args: [{selector: 'mat-tab-group',
                    exportAs: 'matTabGroup',
                    template: "<mat-tab-header #tabHeader [selectedIndex]=\"selectedIndex\" [disableRipple]=\"disableRipple\" (indexFocused)=\"_focusChanged($event)\" (selectFocusedIndex)=\"selectedIndex = $event\"><div class=\"mat-tab-label\" role=\"tab\" matTabLabelWrapper mat-ripple cdkMonitorElementFocus *ngFor=\"let tab of _tabs; let i = index\" [id]=\"_getTabLabelId(i)\" [attr.tabIndex]=\"_getTabIndex(tab, i)\" [attr.aria-posinset]=\"i + 1\" [attr.aria-setsize]=\"_tabs.length\" [attr.aria-controls]=\"_getTabContentId(i)\" [attr.aria-selected]=\"selectedIndex == i\" [attr.aria-label]=\"tab.ariaLabel || null\" [attr.aria-labelledby]=\"(!tab.ariaLabel && tab.ariaLabelledby) ? tab.ariaLabelledby : null\" [class.mat-tab-label-active]=\"selectedIndex == i\" [disabled]=\"tab.disabled\" [matRippleDisabled]=\"tab.disabled || disableRipple\" (click)=\"_handleClick(tab, tabHeader, i)\"><div class=\"mat-tab-label-content\"><ng-template [ngIf]=\"tab.templateLabel\"><ng-template [cdkPortalOutlet]=\"tab.templateLabel\"></ng-template></ng-template><ng-template [ngIf]=\"!tab.templateLabel\">{{tab.textLabel}}</ng-template></div></div></mat-tab-header><div class=\"mat-tab-body-wrapper\" #tabBodyWrapper><mat-tab-body role=\"tabpanel\" *ngFor=\"let tab of _tabs; let i = index\" [id]=\"_getTabContentId(i)\" [attr.aria-labelledby]=\"_getTabLabelId(i)\" [class.mat-tab-body-active]=\"selectedIndex == i\" [content]=\"tab.content\" [position]=\"tab.position\" [origin]=\"tab.origin\" [animationDuration]=\"animationDuration\" (_onCentered)=\"_removeTabBodyWrapperHeight()\" (_onCentering)=\"_setTabBodyWrapperHeight($event)\"></mat-tab-body></div>",
                    styles: [".mat-tab-group{display:flex;flex-direction:column}.mat-tab-group.mat-tab-group-inverted-header{flex-direction:column-reverse}.mat-tab-label{height:48px;padding:0 24px;cursor:pointer;box-sizing:border-box;opacity:.6;min-width:160px;text-align:center;display:inline-flex;justify-content:center;align-items:center;white-space:nowrap;position:relative}.mat-tab-label:focus{outline:0}.mat-tab-label:focus:not(.mat-tab-disabled){opacity:1}@media (-ms-high-contrast:active){.mat-tab-label:focus{outline:dotted 2px}}.mat-tab-label.mat-tab-disabled{cursor:default}@media (-ms-high-contrast:active){.mat-tab-label.mat-tab-disabled{opacity:.5}}.mat-tab-label .mat-tab-label-content{display:inline-flex;justify-content:center;align-items:center;white-space:nowrap}@media (-ms-high-contrast:active){.mat-tab-label{opacity:1}}@media (max-width:599px){.mat-tab-label{padding:0 12px}}@media (max-width:959px){.mat-tab-label{padding:0 12px}}.mat-tab-group[mat-stretch-tabs]>.mat-tab-header .mat-tab-label{flex-basis:0;flex-grow:1}.mat-tab-body-wrapper{position:relative;overflow:hidden;display:flex;transition:height .5s cubic-bezier(.35,0,.25,1)}.mat-tab-body{top:0;left:0;right:0;bottom:0;position:absolute;display:block;overflow:hidden;flex-basis:100%}.mat-tab-body.mat-tab-body-active{position:relative;overflow-x:hidden;overflow-y:auto;z-index:1;flex-grow:1}.mat-tab-group.mat-tab-group-dynamic-height .mat-tab-body.mat-tab-body-active{overflow-y:hidden}"],
                    encapsulation: ViewEncapsulation.None,
                    changeDetection: ChangeDetectionStrategy.OnPush,
                    inputs: ['color', 'disableRipple'],
                    host: {
                        'class': 'mat-tab-group',
                        '[class.mat-tab-group-dynamic-height]': 'dynamicHeight',
                        '[class.mat-tab-group-inverted-header]': 'headerPosition === "below"',
                    },
                },] },
    ];
    /** @nocollapse */
    MatTabGroup.ctorParameters = function () { return [
        { type: ElementRef },
        { type: ChangeDetectorRef },
        { type: undefined, decorators: [{ type: Inject, args: [MAT_TABS_CONFIG,] }, { type: Optional }] }
    ]; };
    MatTabGroup.propDecorators = {
        _tabs: [{ type: ContentChildren, args: [MatTab,] }],
        _tabBodyWrapper: [{ type: ViewChild, args: ['tabBodyWrapper',] }],
        _tabHeader: [{ type: ViewChild, args: ['tabHeader',] }],
        dynamicHeight: [{ type: Input }],
        selectedIndex: [{ type: Input }],
        headerPosition: [{ type: Input }],
        animationDuration: [{ type: Input }],
        backgroundColor: [{ type: Input }],
        selectedIndexChange: [{ type: Output }],
        focusChange: [{ type: Output }],
        animationDone: [{ type: Output }],
        selectedTabChange: [{ type: Output }]
    };
    return MatTabGroup;
}(_MatTabGroupMixinBase));

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
// Boilerplate for applying mixins to MatTabNav.
/**
 * \@docs-private
 */
var  
// Boilerplate for applying mixins to MatTabNav.
/**
 * \@docs-private
 */
MatTabNavBase = /** @class */ (function () {
    function MatTabNavBase(_elementRef) {
        this._elementRef = _elementRef;
    }
    return MatTabNavBase;
}());
/** @type {?} */
var _MatTabNavMixinBase = mixinDisableRipple(mixinColor(MatTabNavBase, 'primary'));
/**
 * Navigation component matching the styles of the tab group header.
 * Provides anchored navigation with animated ink bar.
 */
var MatTabNav = /** @class */ (function (_super) {
    __extends(MatTabNav, _super);
    function MatTabNav(elementRef, _dir, _ngZone, _changeDetectorRef, _viewportRuler) {
        var _this = _super.call(this, elementRef) || this;
        _this._dir = _dir;
        _this._ngZone = _ngZone;
        _this._changeDetectorRef = _changeDetectorRef;
        _this._viewportRuler = _viewportRuler;
        /**
         * Subject that emits when the component has been destroyed.
         */
        _this._onDestroy = new Subject();
        return _this;
    }
    Object.defineProperty(MatTabNav.prototype, "backgroundColor", {
        /** Background color of the tab nav. */
        get: /**
         * Background color of the tab nav.
         * @return {?}
         */
        function () { return this._backgroundColor; },
        set: /**
         * @param {?} value
         * @return {?}
         */
        function (value) {
            /** @type {?} */
            var nativeElement = this._elementRef.nativeElement;
            nativeElement.classList.remove("mat-background-" + this.backgroundColor);
            if (value) {
                nativeElement.classList.add("mat-background-" + value);
            }
            this._backgroundColor = value;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Notifies the component that the active link has been changed.
     * @breaking-change 8.0.0 `element` parameter to be removed.
     */
    /**
     * Notifies the component that the active link has been changed.
     * \@breaking-change 8.0.0 `element` parameter to be removed.
     * @param {?} element
     * @return {?}
     */
    MatTabNav.prototype.updateActiveLink = /**
     * Notifies the component that the active link has been changed.
     * \@breaking-change 8.0.0 `element` parameter to be removed.
     * @param {?} element
     * @return {?}
     */
    function (element) {
        // Note: keeping the `element` for backwards-compat, but isn't being used for anything.
        // @breaking-change 8.0.0
        this._activeLinkChanged = !!element;
        this._changeDetectorRef.markForCheck();
    };
    /**
     * @return {?}
     */
    MatTabNav.prototype.ngAfterContentInit = /**
     * @return {?}
     */
    function () {
        var _this = this;
        this._ngZone.runOutsideAngular(function () {
            /** @type {?} */
            var dirChange = _this._dir ? _this._dir.change : of(null);
            return merge(dirChange, _this._viewportRuler.change(10))
                .pipe(takeUntil(_this._onDestroy))
                .subscribe(function () { return _this._alignInkBar(); });
        });
    };
    /** Checks if the active link has been changed and, if so, will update the ink bar. */
    /**
     * Checks if the active link has been changed and, if so, will update the ink bar.
     * @return {?}
     */
    MatTabNav.prototype.ngAfterContentChecked = /**
     * Checks if the active link has been changed and, if so, will update the ink bar.
     * @return {?}
     */
    function () {
        if (this._activeLinkChanged) {
            /** @type {?} */
            var activeTab = this._tabLinks.find(function (tab) { return tab.active; });
            this._activeLinkElement = activeTab ? activeTab._elementRef : null;
            this._alignInkBar();
            this._activeLinkChanged = false;
        }
    };
    /**
     * @return {?}
     */
    MatTabNav.prototype.ngOnDestroy = /**
     * @return {?}
     */
    function () {
        this._onDestroy.next();
        this._onDestroy.complete();
    };
    /** Aligns the ink bar to the active link. */
    /**
     * Aligns the ink bar to the active link.
     * @return {?}
     */
    MatTabNav.prototype._alignInkBar = /**
     * Aligns the ink bar to the active link.
     * @return {?}
     */
    function () {
        if (this._activeLinkElement) {
            this._inkBar.show();
            this._inkBar.alignToElement(this._activeLinkElement.nativeElement);
        }
        else {
            this._inkBar.hide();
        }
    };
    MatTabNav.decorators = [
        { type: Component, args: [{selector: '[mat-tab-nav-bar]',
                    exportAs: 'matTabNavBar, matTabNav',
                    inputs: ['color', 'disableRipple'],
                    template: "<div class=\"mat-tab-links\" (cdkObserveContent)=\"_alignInkBar()\"><ng-content></ng-content><mat-ink-bar></mat-ink-bar></div>",
                    styles: [".mat-tab-nav-bar{overflow:hidden;position:relative;flex-shrink:0}.mat-tab-links{position:relative;display:flex}[mat-align-tabs=center] .mat-tab-links{justify-content:center}[mat-align-tabs=end] .mat-tab-links{justify-content:flex-end}.mat-tab-link{height:48px;padding:0 24px;cursor:pointer;box-sizing:border-box;opacity:.6;min-width:160px;text-align:center;display:inline-flex;justify-content:center;align-items:center;white-space:nowrap;vertical-align:top;text-decoration:none;position:relative;overflow:hidden;-webkit-tap-highlight-color:transparent}.mat-tab-link:focus{outline:0}.mat-tab-link:focus:not(.mat-tab-disabled){opacity:1}@media (-ms-high-contrast:active){.mat-tab-link:focus{outline:dotted 2px}}.mat-tab-link.mat-tab-disabled{cursor:default}@media (-ms-high-contrast:active){.mat-tab-link.mat-tab-disabled{opacity:.5}}.mat-tab-link .mat-tab-label-content{display:inline-flex;justify-content:center;align-items:center;white-space:nowrap}@media (-ms-high-contrast:active){.mat-tab-link{opacity:1}}[mat-stretch-tabs] .mat-tab-link{flex-basis:0;flex-grow:1}.mat-tab-link.mat-tab-disabled{pointer-events:none}@media (max-width:599px){.mat-tab-link{min-width:72px}}.mat-ink-bar{position:absolute;bottom:0;height:2px;transition:.5s cubic-bezier(.35,0,.25,1)}.mat-tab-group-inverted-header .mat-ink-bar{bottom:auto;top:0}@media (-ms-high-contrast:active){.mat-ink-bar{outline:solid 2px;height:0}}"],
                    host: { 'class': 'mat-tab-nav-bar' },
                    encapsulation: ViewEncapsulation.None,
                    changeDetection: ChangeDetectionStrategy.OnPush,
                },] },
    ];
    /** @nocollapse */
    MatTabNav.ctorParameters = function () { return [
        { type: ElementRef },
        { type: Directionality, decorators: [{ type: Optional }] },
        { type: NgZone },
        { type: ChangeDetectorRef },
        { type: ViewportRuler }
    ]; };
    MatTabNav.propDecorators = {
        _inkBar: [{ type: ViewChild, args: [MatInkBar,] }],
        _tabLinks: [{ type: ContentChildren, args: [forwardRef(function () { return MatTabLink; }), { descendants: true },] }],
        backgroundColor: [{ type: Input }]
    };
    return MatTabNav;
}(_MatTabNavMixinBase));
// Boilerplate for applying mixins to MatTabLink.
var  
// Boilerplate for applying mixins to MatTabLink.
MatTabLinkBase = /** @class */ (function () {
    function MatTabLinkBase() {
    }
    return MatTabLinkBase;
}());
/** @type {?} */
var _MatTabLinkMixinBase = mixinTabIndex(mixinDisableRipple(mixinDisabled(MatTabLinkBase)));
/**
 * Link inside of a `mat-tab-nav-bar`.
 */
var MatTabLink = /** @class */ (function (_super) {
    __extends(MatTabLink, _super);
    function MatTabLink(_tabNavBar, _elementRef, ngZone, platform, globalRippleOptions, tabIndex, _focusMonitor) {
        var _this = _super.call(this) || this;
        _this._tabNavBar = _tabNavBar;
        _this._elementRef = _elementRef;
        _this._focusMonitor = _focusMonitor;
        /**
         * Whether the tab link is active or not.
         */
        _this._isActive = false;
        _this._tabLinkRipple = new RippleRenderer(_this, ngZone, _elementRef, platform);
        _this._tabLinkRipple.setupTriggerEvents(_elementRef.nativeElement);
        _this.rippleConfig = globalRippleOptions || {};
        _this.tabIndex = parseInt(tabIndex) || 0;
        if (_focusMonitor) {
            _focusMonitor.monitor(_elementRef);
        }
        return _this;
    }
    Object.defineProperty(MatTabLink.prototype, "active", {
        /** Whether the link is active. */
        get: /**
         * Whether the link is active.
         * @return {?}
         */
        function () { return this._isActive; },
        set: /**
         * @param {?} value
         * @return {?}
         */
        function (value) {
            if (value !== this._isActive) {
                this._isActive = value;
                this._tabNavBar.updateActiveLink(this._elementRef);
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MatTabLink.prototype, "rippleDisabled", {
        /**
         * Whether ripples are disabled on interaction.
         * @docs-private
         */
        get: /**
         * Whether ripples are disabled on interaction.
         * \@docs-private
         * @return {?}
         */
        function () {
            return this.disabled || this.disableRipple || this._tabNavBar.disableRipple ||
                !!this.rippleConfig.disabled;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * @return {?}
     */
    MatTabLink.prototype.ngOnDestroy = /**
     * @return {?}
     */
    function () {
        this._tabLinkRipple._removeTriggerEvents();
        if (this._focusMonitor) {
            this._focusMonitor.stopMonitoring(this._elementRef);
        }
    };
    MatTabLink.decorators = [
        { type: Directive, args: [{
                    selector: '[mat-tab-link], [matTabLink]',
                    exportAs: 'matTabLink',
                    inputs: ['disabled', 'disableRipple', 'tabIndex'],
                    host: {
                        'class': 'mat-tab-link',
                        '[attr.aria-current]': 'active',
                        '[attr.aria-disabled]': 'disabled.toString()',
                        '[attr.tabIndex]': 'tabIndex',
                        '[class.mat-tab-disabled]': 'disabled',
                        '[class.mat-tab-label-active]': 'active',
                    }
                },] },
    ];
    /** @nocollapse */
    MatTabLink.ctorParameters = function () { return [
        { type: MatTabNav },
        { type: ElementRef },
        { type: NgZone },
        { type: Platform },
        { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: [MAT_RIPPLE_GLOBAL_OPTIONS,] }] },
        { type: String, decorators: [{ type: Attribute, args: ['tabindex',] }] },
        { type: FocusMonitor }
    ]; };
    MatTabLink.propDecorators = {
        active: [{ type: Input }]
    };
    return MatTabLink;
}(_MatTabLinkMixinBase));

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
var MatTabsModule = /** @class */ (function () {
    function MatTabsModule() {
    }
    MatTabsModule.decorators = [
        { type: NgModule, args: [{
                    imports: [
                        CommonModule,
                        MatCommonModule,
                        PortalModule,
                        MatRippleModule,
                        ObserversModule,
                        A11yModule,
                    ],
                    // Don't export all components because some are only to be used internally.
                    exports: [
                        MatCommonModule,
                        MatTabGroup,
                        MatTabLabel,
                        MatTab,
                        MatTabNav,
                        MatTabLink,
                        MatTabContent,
                    ],
                    declarations: [
                        MatTabGroup,
                        MatTabLabel,
                        MatTab,
                        MatInkBar,
                        MatTabLabelWrapper,
                        MatTabNav,
                        MatTabLink,
                        MatTabBody,
                        MatTabBodyPortal,
                        MatTabHeader,
                        MatTabContent,
                    ],
                },] },
    ];
    return MatTabsModule;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */

export { MatInkBar, _MAT_INK_BAR_POSITIONER, MatTabBody, MatTabBodyPortal, MatTabHeader, MatTabLabelWrapper, MatTab, MatTabLabel, MatTabNav, MatTabLink, MatTabContent, MatTabsModule, MatTabChangeEvent, MAT_TABS_CONFIG, MatTabGroupBase, _MatTabGroupMixinBase, MatTabGroup, matTabsAnimations, _MAT_INK_BAR_POSITIONER_FACTORY as ɵa21, MatTabBase as ɵf21, _MatTabMixinBase as ɵg21, MatTabHeaderBase as ɵb21, _MatTabHeaderMixinBase as ɵc21, MatTabLabelWrapperBase as ɵd21, _MatTabLabelWrapperMixinBase as ɵe21, MatTabLinkBase as ɵj21, MatTabNavBase as ɵh21, _MatTabLinkMixinBase as ɵk21, _MatTabNavMixinBase as ɵi21 };
//# sourceMappingURL=tabs.es5.js.map

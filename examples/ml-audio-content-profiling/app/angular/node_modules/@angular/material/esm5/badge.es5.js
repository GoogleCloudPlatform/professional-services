/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __extends } from 'tslib';
import { AriaDescriber, A11yModule } from '@angular/cdk/a11y';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, Inject, Input, NgZone, Optional, Renderer2, NgModule } from '@angular/core';
import { mixinDisabled, MatCommonModule } from '@angular/material/core';

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/** @type {?} */
var nextId = 0;
// Boilerplate for applying mixins to MatBadge.
/**
 * \@docs-private
 */
var  
// Boilerplate for applying mixins to MatBadge.
/**
 * \@docs-private
 */
MatBadgeBase = /** @class */ (function () {
    function MatBadgeBase() {
    }
    return MatBadgeBase;
}());
/** @type {?} */
var _MatBadgeMixinBase = mixinDisabled(MatBadgeBase);
/**
 * Directive to display a text badge.
 */
var MatBadge = /** @class */ (function (_super) {
    __extends(MatBadge, _super);
    function MatBadge(_document, _ngZone, _elementRef, _ariaDescriber, _renderer) {
        var _this = _super.call(this) || this;
        _this._document = _document;
        _this._ngZone = _ngZone;
        _this._elementRef = _elementRef;
        _this._ariaDescriber = _ariaDescriber;
        _this._renderer = _renderer;
        /**
         * Whether the badge has any content.
         */
        _this._hasContent = false;
        _this._color = 'primary';
        _this._overlap = true;
        /**
         * Position the badge should reside.
         * Accepts any combination of 'above'|'below' and 'before'|'after'
         */
        _this.position = 'above after';
        /**
         * Size of the badge. Can be 'small', 'medium', or 'large'.
         */
        _this.size = 'medium';
        /**
         * Unique id for the badge
         */
        _this._id = nextId++;
        return _this;
    }
    Object.defineProperty(MatBadge.prototype, "color", {
        /** The color of the badge. Can be `primary`, `accent`, or `warn`. */
        get: /**
         * The color of the badge. Can be `primary`, `accent`, or `warn`.
         * @return {?}
         */
        function () { return this._color; },
        set: /**
         * @param {?} value
         * @return {?}
         */
        function (value) {
            this._setColor(value);
            this._color = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MatBadge.prototype, "overlap", {
        /** Whether the badge should overlap its contents or not */
        get: /**
         * Whether the badge should overlap its contents or not
         * @return {?}
         */
        function () { return this._overlap; },
        set: /**
         * @param {?} val
         * @return {?}
         */
        function (val) {
            this._overlap = coerceBooleanProperty(val);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MatBadge.prototype, "content", {
        /** The content for the badge */
        get: /**
         * The content for the badge
         * @return {?}
         */
        function () { return this._content; },
        set: /**
         * @param {?} value
         * @return {?}
         */
        function (value) {
            this._content = value;
            this._hasContent = value != null && ("" + value).trim().length > 0;
            this._updateTextContent();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MatBadge.prototype, "description", {
        /** Message used to describe the decorated element via aria-describedby */
        get: /**
         * Message used to describe the decorated element via aria-describedby
         * @return {?}
         */
        function () { return this._description; },
        set: /**
         * @param {?} newDescription
         * @return {?}
         */
        function (newDescription) {
            if (newDescription !== this._description) {
                /** @type {?} */
                var badgeElement = this._badgeElement;
                this._updateHostAriaDescription(newDescription, this._description);
                this._description = newDescription;
                if (badgeElement) {
                    newDescription ? badgeElement.setAttribute('aria-label', newDescription) :
                        badgeElement.removeAttribute('aria-label');
                }
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MatBadge.prototype, "hidden", {
        /** Whether the badge is hidden. */
        get: /**
         * Whether the badge is hidden.
         * @return {?}
         */
        function () { return this._hidden; },
        set: /**
         * @param {?} val
         * @return {?}
         */
        function (val) {
            this._hidden = coerceBooleanProperty(val);
        },
        enumerable: true,
        configurable: true
    });
    /** Whether the badge is above the host or not */
    /**
     * Whether the badge is above the host or not
     * @return {?}
     */
    MatBadge.prototype.isAbove = /**
     * Whether the badge is above the host or not
     * @return {?}
     */
    function () {
        return this.position.indexOf('below') === -1;
    };
    /** Whether the badge is after the host or not */
    /**
     * Whether the badge is after the host or not
     * @return {?}
     */
    MatBadge.prototype.isAfter = /**
     * Whether the badge is after the host or not
     * @return {?}
     */
    function () {
        return this.position.indexOf('before') === -1;
    };
    /**
     * @return {?}
     */
    MatBadge.prototype.ngOnDestroy = /**
     * @return {?}
     */
    function () {
        /** @type {?} */
        var badgeElement = this._badgeElement;
        if (badgeElement) {
            if (this.description) {
                this._ariaDescriber.removeDescription(badgeElement, this.description);
            }
            // When creating a badge through the Renderer, Angular will keep it in an index.
            // We have to destroy it ourselves, otherwise it'll be retained in memory.
            // @breaking-change 8.0.0 remove _renderer from null.
            if (this._renderer && this._renderer.destroyNode) {
                this._renderer.destroyNode(badgeElement);
            }
        }
    };
    /** Injects a span element into the DOM with the content. */
    /**
     * Injects a span element into the DOM with the content.
     * @private
     * @return {?}
     */
    MatBadge.prototype._updateTextContent = /**
     * Injects a span element into the DOM with the content.
     * @private
     * @return {?}
     */
    function () {
        if (!this._badgeElement) {
            this._badgeElement = this._createBadgeElement();
        }
        else {
            this._badgeElement.textContent = this.content;
        }
        return this._badgeElement;
    };
    /** Creates the badge element */
    /**
     * Creates the badge element
     * @private
     * @return {?}
     */
    MatBadge.prototype._createBadgeElement = /**
     * Creates the badge element
     * @private
     * @return {?}
     */
    function () {
        // @breaking-change 8.0.0 Remove null check for _renderer
        /** @type {?} */
        var rootNode = this._renderer || this._document;
        /** @type {?} */
        var badgeElement = rootNode.createElement('span');
        /** @type {?} */
        var activeClass = 'mat-badge-active';
        /** @type {?} */
        var contentClass = 'mat-badge-content';
        // Clear any existing badges which may have persisted from a server-side render.
        this._clearExistingBadges(contentClass);
        badgeElement.setAttribute('id', "mat-badge-content-" + this._id);
        badgeElement.classList.add(contentClass);
        badgeElement.textContent = this.content;
        if (this.description) {
            badgeElement.setAttribute('aria-label', this.description);
        }
        this._elementRef.nativeElement.appendChild(badgeElement);
        // animate in after insertion
        if (typeof requestAnimationFrame === 'function') {
            this._ngZone.runOutsideAngular(function () {
                requestAnimationFrame(function () {
                    badgeElement.classList.add(activeClass);
                });
            });
        }
        else {
            badgeElement.classList.add(activeClass);
        }
        return badgeElement;
    };
    /** Sets the aria-label property on the element */
    /**
     * Sets the aria-label property on the element
     * @private
     * @param {?} newDescription
     * @param {?} oldDescription
     * @return {?}
     */
    MatBadge.prototype._updateHostAriaDescription = /**
     * Sets the aria-label property on the element
     * @private
     * @param {?} newDescription
     * @param {?} oldDescription
     * @return {?}
     */
    function (newDescription, oldDescription) {
        // ensure content available before setting label
        /** @type {?} */
        var content = this._updateTextContent();
        if (oldDescription) {
            this._ariaDescriber.removeDescription(content, oldDescription);
        }
        if (newDescription) {
            this._ariaDescriber.describe(content, newDescription);
        }
    };
    /** Adds css theme class given the color to the component host */
    /**
     * Adds css theme class given the color to the component host
     * @private
     * @param {?} colorPalette
     * @return {?}
     */
    MatBadge.prototype._setColor = /**
     * Adds css theme class given the color to the component host
     * @private
     * @param {?} colorPalette
     * @return {?}
     */
    function (colorPalette) {
        if (colorPalette !== this._color) {
            if (this._color) {
                this._elementRef.nativeElement.classList.remove("mat-badge-" + this._color);
            }
            if (colorPalette) {
                this._elementRef.nativeElement.classList.add("mat-badge-" + colorPalette);
            }
        }
    };
    /** Clears any existing badges that might be left over from server-side rendering. */
    /**
     * Clears any existing badges that might be left over from server-side rendering.
     * @private
     * @param {?} cssClass
     * @return {?}
     */
    MatBadge.prototype._clearExistingBadges = /**
     * Clears any existing badges that might be left over from server-side rendering.
     * @private
     * @param {?} cssClass
     * @return {?}
     */
    function (cssClass) {
        /** @type {?} */
        var element = this._elementRef.nativeElement;
        /** @type {?} */
        var childCount = element.children.length;
        // Use a reverse while, because we'll be removing elements from the list as we're iterating.
        while (childCount--) {
            /** @type {?} */
            var currentChild = element.children[childCount];
            if (currentChild.classList.contains(cssClass)) {
                element.removeChild(currentChild);
            }
        }
    };
    MatBadge.decorators = [
        { type: Directive, args: [{
                    selector: '[matBadge]',
                    inputs: ['disabled: matBadgeDisabled'],
                    host: {
                        'class': 'mat-badge',
                        '[class.mat-badge-overlap]': 'overlap',
                        '[class.mat-badge-above]': 'isAbove()',
                        '[class.mat-badge-below]': '!isAbove()',
                        '[class.mat-badge-before]': '!isAfter()',
                        '[class.mat-badge-after]': 'isAfter()',
                        '[class.mat-badge-small]': 'size === "small"',
                        '[class.mat-badge-medium]': 'size === "medium"',
                        '[class.mat-badge-large]': 'size === "large"',
                        '[class.mat-badge-hidden]': 'hidden || !_hasContent',
                        '[class.mat-badge-disabled]': 'disabled',
                    },
                },] },
    ];
    /** @nocollapse */
    MatBadge.ctorParameters = function () { return [
        { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: [DOCUMENT,] }] },
        { type: NgZone },
        { type: ElementRef },
        { type: AriaDescriber },
        { type: Renderer2 }
    ]; };
    MatBadge.propDecorators = {
        color: [{ type: Input, args: ['matBadgeColor',] }],
        overlap: [{ type: Input, args: ['matBadgeOverlap',] }],
        position: [{ type: Input, args: ['matBadgePosition',] }],
        content: [{ type: Input, args: ['matBadge',] }],
        description: [{ type: Input, args: ['matBadgeDescription',] }],
        size: [{ type: Input, args: ['matBadgeSize',] }],
        hidden: [{ type: Input, args: ['matBadgeHidden',] }]
    };
    return MatBadge;
}(_MatBadgeMixinBase));

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
var MatBadgeModule = /** @class */ (function () {
    function MatBadgeModule() {
    }
    MatBadgeModule.decorators = [
        { type: NgModule, args: [{
                    imports: [
                        A11yModule,
                        MatCommonModule
                    ],
                    exports: [MatBadge],
                    declarations: [MatBadge],
                },] },
    ];
    return MatBadgeModule;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */

export { MatBadgeModule, MatBadgeBase, _MatBadgeMixinBase, MatBadge };
//# sourceMappingURL=badge.es5.js.map

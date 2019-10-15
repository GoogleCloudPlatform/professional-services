/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/cdk/platform'), require('@angular/common'), require('@angular/core'), require('@angular/material/core')) :
	typeof define === 'function' && define.amd ? define('@angular/material/toolbar', ['exports', '@angular/cdk/platform', '@angular/common', '@angular/core', '@angular/material/core'], factory) :
	(factory((global.ng = global.ng || {}, global.ng.material = global.ng.material || {}, global.ng.material.toolbar = {}),global.ng.cdk.platform,global.ng.common,global.ng.core,global.ng.material.core));
}(this, (function (exports,platform,common,core,core$1) { 'use strict';

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
// Boilerplate for applying mixins to MatToolbar.
/**
 * \@docs-private
 */
var   
// Boilerplate for applying mixins to MatToolbar.
/**
 * \@docs-private
 */
MatToolbarBase = /** @class */ (function () {
    function MatToolbarBase(_elementRef) {
        this._elementRef = _elementRef;
    }
    return MatToolbarBase;
}());
/** @type {?} */
var _MatToolbarMixinBase = core$1.mixinColor(MatToolbarBase);
var MatToolbarRow = /** @class */ (function () {
    function MatToolbarRow() {
    }
    MatToolbarRow.decorators = [
        { type: core.Directive, args: [{
                    selector: 'mat-toolbar-row',
                    exportAs: 'matToolbarRow',
                    host: { 'class': 'mat-toolbar-row' },
                },] },
    ];
    return MatToolbarRow;
}());
var MatToolbar = /** @class */ (function (_super) {
    __extends(MatToolbar, _super);
    function MatToolbar(elementRef, _platform, document) {
        var _this = _super.call(this, elementRef) || this;
        _this._platform = _platform;
        // TODO: make the document a required param when doing breaking changes.
        _this._document = document;
        return _this;
    }
    /**
     * @return {?}
     */
    MatToolbar.prototype.ngAfterViewInit = /**
     * @return {?}
     */
    function () {
        var _this = this;
        if (!core.isDevMode() || !this._platform.isBrowser) {
            return;
        }
        this._checkToolbarMixedModes();
        this._toolbarRows.changes.subscribe(function () { return _this._checkToolbarMixedModes(); });
    };
    /**
     * Throws an exception when developers are attempting to combine the different toolbar row modes.
     */
    /**
     * Throws an exception when developers are attempting to combine the different toolbar row modes.
     * @private
     * @return {?}
     */
    MatToolbar.prototype._checkToolbarMixedModes = /**
     * Throws an exception when developers are attempting to combine the different toolbar row modes.
     * @private
     * @return {?}
     */
    function () {
        var _this = this;
        if (!this._toolbarRows.length) {
            return;
        }
        // Check if there are any other DOM nodes that can display content but aren't inside of
        // a <mat-toolbar-row> element.
        /** @type {?} */
        var isCombinedUsage = Array.from(this._elementRef.nativeElement.childNodes)
            .filter(function (node) { return !(node.classList && node.classList.contains('mat-toolbar-row')); })
            .filter(function (node) { return node.nodeType !== (_this._document ? _this._document.COMMENT_NODE : 8); })
            .some(function (node) { return !!(node.textContent && node.textContent.trim()); });
        if (isCombinedUsage) {
            throwToolbarMixedModesError();
        }
    };
    MatToolbar.decorators = [
        { type: core.Component, args: [{selector: 'mat-toolbar',
                    exportAs: 'matToolbar',
                    template: "<ng-content></ng-content><ng-content select=\"mat-toolbar-row\"></ng-content>",
                    styles: ["@media (-ms-high-contrast:active){.mat-toolbar{outline:solid 1px}}.mat-toolbar-row,.mat-toolbar-single-row{display:flex;box-sizing:border-box;padding:0 16px;width:100%;flex-direction:row;align-items:center;white-space:nowrap}.mat-toolbar-multiple-rows{display:flex;box-sizing:border-box;flex-direction:column;width:100%}.mat-toolbar-multiple-rows{min-height:64px}.mat-toolbar-row,.mat-toolbar-single-row{height:64px}@media (max-width:599px){.mat-toolbar-multiple-rows{min-height:56px}.mat-toolbar-row,.mat-toolbar-single-row{height:56px}}"],
                    inputs: ['color'],
                    host: {
                        'class': 'mat-toolbar',
                        '[class.mat-toolbar-multiple-rows]': '_toolbarRows.length > 0',
                        '[class.mat-toolbar-single-row]': '_toolbarRows.length === 0',
                    },
                    changeDetection: core.ChangeDetectionStrategy.OnPush,
                    encapsulation: core.ViewEncapsulation.None,
                },] },
    ];
    /** @nocollapse */
    MatToolbar.ctorParameters = function () { return [
        { type: core.ElementRef },
        { type: platform.Platform },
        { type: undefined, decorators: [{ type: core.Inject, args: [common.DOCUMENT,] }] }
    ]; };
    MatToolbar.propDecorators = {
        _toolbarRows: [{ type: core.ContentChildren, args: [MatToolbarRow,] }]
    };
    return MatToolbar;
}(_MatToolbarMixinBase));
/**
 * Throws an exception when attempting to combine the different toolbar row modes.
 * \@docs-private
 * @return {?}
 */
function throwToolbarMixedModesError() {
    throw Error('MatToolbar: Attempting to combine different toolbar modes. ' +
        'Either specify multiple `<mat-toolbar-row>` elements explicitly or just place content ' +
        'inside of a `<mat-toolbar>` for a single row.');
}

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
var MatToolbarModule = /** @class */ (function () {
    function MatToolbarModule() {
    }
    MatToolbarModule.decorators = [
        { type: core.NgModule, args: [{
                    imports: [core$1.MatCommonModule],
                    exports: [MatToolbar, MatToolbarRow, core$1.MatCommonModule],
                    declarations: [MatToolbar, MatToolbarRow],
                },] },
    ];
    return MatToolbarModule;
}());

exports.MatToolbarModule = MatToolbarModule;
exports.throwToolbarMixedModesError = throwToolbarMixedModesError;
exports.MatToolbarBase = MatToolbarBase;
exports._MatToolbarMixinBase = _MatToolbarMixinBase;
exports.MatToolbarRow = MatToolbarRow;
exports.MatToolbar = MatToolbar;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=material-toolbar.umd.js.map

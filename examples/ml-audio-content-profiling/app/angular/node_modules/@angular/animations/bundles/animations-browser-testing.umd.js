/**
 * @license Angular v7.0.4
 * (c) 2010-2018 Google, Inc. https://angular.io/
 * License: MIT
 */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/animations'), require('@angular/animations/browser')) :
    typeof define === 'function' && define.amd ? define('@angular/animations/browser/testing', ['exports', '@angular/animations', '@angular/animations/browser'], factory) :
    (factory((global.ng = global.ng || {}, global.ng.animations = global.ng.animations || {}, global.ng.animations.browser = global.ng.animations.browser || {}, global.ng.animations.browser.testing = {}),global.ng.animations,global.ng.animations.browser));
}(this, (function (exports,animations,browser) { 'use strict';

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
     * @publicApi
     */
    var MockAnimationDriver = /** @class */ (function () {
        function MockAnimationDriver() {
        }
        MockAnimationDriver.prototype.validateStyleProperty = function (prop) { return browser.ɵvalidateStyleProperty(prop); };
        MockAnimationDriver.prototype.matchesElement = function (element, selector) {
            return browser.ɵmatchesElement(element, selector);
        };
        MockAnimationDriver.prototype.containsElement = function (elm1, elm2) { return browser.ɵcontainsElement(elm1, elm2); };
        MockAnimationDriver.prototype.query = function (element, selector, multi) {
            return browser.ɵinvokeQuery(element, selector, multi);
        };
        MockAnimationDriver.prototype.computeStyle = function (element, prop, defaultValue) {
            return defaultValue || '';
        };
        MockAnimationDriver.prototype.animate = function (element, keyframes, duration, delay, easing, previousPlayers) {
            if (previousPlayers === void 0) { previousPlayers = []; }
            var player = new MockAnimationPlayer(element, keyframes, duration, delay, easing, previousPlayers);
            MockAnimationDriver.log.push(player);
            return player;
        };
        MockAnimationDriver.log = [];
        return MockAnimationDriver;
    }());
    /**
     * @publicApi
     */
    var MockAnimationPlayer = /** @class */ (function (_super) {
        __extends(MockAnimationPlayer, _super);
        function MockAnimationPlayer(element, keyframes, duration, delay, easing, previousPlayers) {
            var _this = _super.call(this, duration, delay) || this;
            _this.element = element;
            _this.keyframes = keyframes;
            _this.duration = duration;
            _this.delay = delay;
            _this.easing = easing;
            _this.previousPlayers = previousPlayers;
            _this.__finished = false;
            _this.__started = false;
            _this.previousStyles = {};
            _this._onInitFns = [];
            _this.currentSnapshot = {};
            if (browser.ɵallowPreviousPlayerStylesMerge(duration, delay)) {
                previousPlayers.forEach(function (player) {
                    if (player instanceof MockAnimationPlayer) {
                        var styles_1 = player.currentSnapshot;
                        Object.keys(styles_1).forEach(function (prop) { return _this.previousStyles[prop] = styles_1[prop]; });
                    }
                });
            }
            return _this;
        }
        /* @internal */
        MockAnimationPlayer.prototype.onInit = function (fn) { this._onInitFns.push(fn); };
        /* @internal */
        MockAnimationPlayer.prototype.init = function () {
            _super.prototype.init.call(this);
            this._onInitFns.forEach(function (fn) { return fn(); });
            this._onInitFns = [];
        };
        MockAnimationPlayer.prototype.finish = function () {
            _super.prototype.finish.call(this);
            this.__finished = true;
        };
        MockAnimationPlayer.prototype.destroy = function () {
            _super.prototype.destroy.call(this);
            this.__finished = true;
        };
        /* @internal */
        MockAnimationPlayer.prototype.triggerMicrotask = function () { };
        MockAnimationPlayer.prototype.play = function () {
            _super.prototype.play.call(this);
            this.__started = true;
        };
        MockAnimationPlayer.prototype.hasStarted = function () { return this.__started; };
        MockAnimationPlayer.prototype.beforeDestroy = function () {
            var _this = this;
            var captures = {};
            Object.keys(this.previousStyles).forEach(function (prop) {
                captures[prop] = _this.previousStyles[prop];
            });
            if (this.hasStarted()) {
                // when assembling the captured styles, it's important that
                // we build the keyframe styles in the following order:
                // {other styles within keyframes, ... previousStyles }
                this.keyframes.forEach(function (kf) {
                    Object.keys(kf).forEach(function (prop) {
                        if (prop != 'offset') {
                            captures[prop] = _this.__finished ? kf[prop] : animations.AUTO_STYLE;
                        }
                    });
                });
            }
            this.currentSnapshot = captures;
        };
        return MockAnimationPlayer;
    }(animations.NoopAnimationPlayer));

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */

    /**
     * Generated bundle index. Do not edit.
     */

    exports.MockAnimationDriver = MockAnimationDriver;
    exports.MockAnimationPlayer = MockAnimationPlayer;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=animations-browser-testing.umd.js.map

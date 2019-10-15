/**
 * @license Angular v7.0.4
 * (c) 2010-2018 Google, Inc. https://angular.io/
 * License: MIT
 */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/core'), require('@angular/common')) :
    typeof define === 'function' && define.amd ? define('@angular/common/testing', ['exports', '@angular/core', '@angular/common'], factory) :
    (factory((global.ng = global.ng || {}, global.ng.common = global.ng.common || {}, global.ng.common.testing = {}),global.ng.core,global.ng.common));
}(this, (function (exports,core,common) { 'use strict';

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

    function __decorate(decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    }

    function __metadata(metadataKey, metadataValue) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * A spy for {@link Location} that allows tests to fire simulated location events.
     *
     * @publicApi
     */
    var SpyLocation = /** @class */ (function () {
        function SpyLocation() {
            this.urlChanges = [];
            this._history = [new LocationState('', '', null)];
            this._historyIndex = 0;
            /** @internal */
            this._subject = new core.EventEmitter();
            /** @internal */
            this._baseHref = '';
            /** @internal */
            this._platformStrategy = null;
        }
        SpyLocation.prototype.setInitialPath = function (url) { this._history[this._historyIndex].path = url; };
        SpyLocation.prototype.setBaseHref = function (url) { this._baseHref = url; };
        SpyLocation.prototype.path = function () { return this._history[this._historyIndex].path; };
        SpyLocation.prototype.state = function () { return this._history[this._historyIndex].state; };
        SpyLocation.prototype.isCurrentPathEqualTo = function (path, query) {
            if (query === void 0) { query = ''; }
            var givenPath = path.endsWith('/') ? path.substring(0, path.length - 1) : path;
            var currPath = this.path().endsWith('/') ? this.path().substring(0, this.path().length - 1) : this.path();
            return currPath == givenPath + (query.length > 0 ? ('?' + query) : '');
        };
        SpyLocation.prototype.simulateUrlPop = function (pathname) {
            this._subject.emit({ 'url': pathname, 'pop': true, 'type': 'popstate' });
        };
        SpyLocation.prototype.simulateHashChange = function (pathname) {
            // Because we don't prevent the native event, the browser will independently update the path
            this.setInitialPath(pathname);
            this.urlChanges.push('hash: ' + pathname);
            this._subject.emit({ 'url': pathname, 'pop': true, 'type': 'hashchange' });
        };
        SpyLocation.prototype.prepareExternalUrl = function (url) {
            if (url.length > 0 && !url.startsWith('/')) {
                url = '/' + url;
            }
            return this._baseHref + url;
        };
        SpyLocation.prototype.go = function (path, query, state) {
            if (query === void 0) { query = ''; }
            if (state === void 0) { state = null; }
            path = this.prepareExternalUrl(path);
            if (this._historyIndex > 0) {
                this._history.splice(this._historyIndex + 1);
            }
            this._history.push(new LocationState(path, query, state));
            this._historyIndex = this._history.length - 1;
            var locationState = this._history[this._historyIndex - 1];
            if (locationState.path == path && locationState.query == query) {
                return;
            }
            var url = path + (query.length > 0 ? ('?' + query) : '');
            this.urlChanges.push(url);
            this._subject.emit({ 'url': url, 'pop': false });
        };
        SpyLocation.prototype.replaceState = function (path, query, state) {
            if (query === void 0) { query = ''; }
            if (state === void 0) { state = null; }
            path = this.prepareExternalUrl(path);
            var history = this._history[this._historyIndex];
            if (history.path == path && history.query == query) {
                return;
            }
            history.path = path;
            history.query = query;
            history.state = state;
            var url = path + (query.length > 0 ? ('?' + query) : '');
            this.urlChanges.push('replace: ' + url);
        };
        SpyLocation.prototype.forward = function () {
            if (this._historyIndex < (this._history.length - 1)) {
                this._historyIndex++;
                this._subject.emit({ 'url': this.path(), 'state': this.state(), 'pop': true });
            }
        };
        SpyLocation.prototype.back = function () {
            if (this._historyIndex > 0) {
                this._historyIndex--;
                this._subject.emit({ 'url': this.path(), 'state': this.state(), 'pop': true });
            }
        };
        SpyLocation.prototype.subscribe = function (onNext, onThrow, onReturn) {
            return this._subject.subscribe({ next: onNext, error: onThrow, complete: onReturn });
        };
        SpyLocation.prototype.normalize = function (url) { return null; };
        SpyLocation = __decorate([
            core.Injectable()
        ], SpyLocation);
        return SpyLocation;
    }());
    var LocationState = /** @class */ (function () {
        function LocationState(path, query, state) {
            this.path = path;
            this.query = query;
            this.state = state;
        }
        return LocationState;
    }());

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * A mock implementation of {@link LocationStrategy} that allows tests to fire simulated
     * location events.
     *
     * @publicApi
     */
    var MockLocationStrategy = /** @class */ (function (_super) {
        __extends(MockLocationStrategy, _super);
        function MockLocationStrategy() {
            var _this = _super.call(this) || this;
            _this.internalBaseHref = '/';
            _this.internalPath = '/';
            _this.internalTitle = '';
            _this.urlChanges = [];
            /** @internal */
            _this._subject = new core.EventEmitter();
            return _this;
        }
        MockLocationStrategy.prototype.simulatePopState = function (url) {
            this.internalPath = url;
            this._subject.emit(new _MockPopStateEvent(this.path()));
        };
        MockLocationStrategy.prototype.path = function (includeHash) {
            if (includeHash === void 0) { includeHash = false; }
            return this.internalPath;
        };
        MockLocationStrategy.prototype.prepareExternalUrl = function (internal) {
            if (internal.startsWith('/') && this.internalBaseHref.endsWith('/')) {
                return this.internalBaseHref + internal.substring(1);
            }
            return this.internalBaseHref + internal;
        };
        MockLocationStrategy.prototype.pushState = function (ctx, title, path, query) {
            this.internalTitle = title;
            var url = path + (query.length > 0 ? ('?' + query) : '');
            this.internalPath = url;
            var externalUrl = this.prepareExternalUrl(url);
            this.urlChanges.push(externalUrl);
        };
        MockLocationStrategy.prototype.replaceState = function (ctx, title, path, query) {
            this.internalTitle = title;
            var url = path + (query.length > 0 ? ('?' + query) : '');
            this.internalPath = url;
            var externalUrl = this.prepareExternalUrl(url);
            this.urlChanges.push('replace: ' + externalUrl);
        };
        MockLocationStrategy.prototype.onPopState = function (fn) { this._subject.subscribe({ next: fn }); };
        MockLocationStrategy.prototype.getBaseHref = function () { return this.internalBaseHref; };
        MockLocationStrategy.prototype.back = function () {
            if (this.urlChanges.length > 0) {
                this.urlChanges.pop();
                var nextUrl = this.urlChanges.length > 0 ? this.urlChanges[this.urlChanges.length - 1] : '';
                this.simulatePopState(nextUrl);
            }
        };
        MockLocationStrategy.prototype.forward = function () { throw 'not implemented'; };
        MockLocationStrategy = __decorate([
            core.Injectable(),
            __metadata("design:paramtypes", [])
        ], MockLocationStrategy);
        return MockLocationStrategy;
    }(common.LocationStrategy));
    var _MockPopStateEvent = /** @class */ (function () {
        function _MockPopStateEvent(newUrl) {
            this.newUrl = newUrl;
            this.pop = true;
            this.type = 'popstate';
        }
        return _MockPopStateEvent;
    }());

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
    // This file only reexports content of the `src` folder. Keep it that way.

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

    exports.SpyLocation = SpyLocation;
    exports.MockLocationStrategy = MockLocationStrategy;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=common-testing.umd.js.map

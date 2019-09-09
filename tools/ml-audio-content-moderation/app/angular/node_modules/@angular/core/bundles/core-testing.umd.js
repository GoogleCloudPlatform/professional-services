/**
 * @license Angular v7.0.4
 * (c) 2010-2018 Google, Inc. https://angular.io/
 * License: MIT
 */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/core')) :
    typeof define === 'function' && define.amd ? define('@angular/core/testing', ['exports', '@angular/core'], factory) :
    (factory((global.ng = global.ng || {}, global.ng.core = global.ng.core || {}, global.ng.core.testing = {}),global.ng.core));
}(this, (function (exports,core) { 'use strict';

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var _global = (typeof window === 'undefined' ? global : window);
    /**
     * Wraps a test function in an asynchronous test zone. The test will automatically
     * complete when all asynchronous calls within this zone are done. Can be used
     * to wrap an {@link inject} call.
     *
     * Example:
     *
     * ```
     * it('...', async(inject([AClass], (object) => {
     *   object.doSomething.then(() => {
     *     expect(...);
     *   })
     * });
     * ```
     *
     *
     */
    function asyncFallback(fn) {
        // If we're running using the Jasmine test framework, adapt to call the 'done'
        // function when asynchronous activity is finished.
        if (_global.jasmine) {
            // Not using an arrow function to preserve context passed from call site
            return function (done) {
                if (!done) {
                    // if we run beforeEach in @angular/core/testing/testing_internal then we get no done
                    // fake it here and assume sync.
                    done = function () { };
                    done.fail = function (e) { throw e; };
                }
                runInTestZone(fn, this, done, function (err) {
                    if (typeof err === 'string') {
                        return done.fail(new Error(err));
                    }
                    else {
                        done.fail(err);
                    }
                });
            };
        }
        // Otherwise, return a promise which will resolve when asynchronous activity
        // is finished. This will be correctly consumed by the Mocha framework with
        // it('...', async(myFn)); or can be used in a custom framework.
        // Not using an arrow function to preserve context passed from call site
        return function () {
            var _this = this;
            return new Promise(function (finishCallback, failCallback) {
                runInTestZone(fn, _this, finishCallback, failCallback);
            });
        };
    }
    function runInTestZone(fn, context, finishCallback, failCallback) {
        var currentZone = Zone.current;
        var AsyncTestZoneSpec = Zone['AsyncTestZoneSpec'];
        if (AsyncTestZoneSpec === undefined) {
            throw new Error('AsyncTestZoneSpec is needed for the async() test helper but could not be found. ' +
                'Please make sure that your environment includes zone.js/dist/async-test.js');
        }
        var ProxyZoneSpec = Zone['ProxyZoneSpec'];
        if (ProxyZoneSpec === undefined) {
            throw new Error('ProxyZoneSpec is needed for the async() test helper but could not be found. ' +
                'Please make sure that your environment includes zone.js/dist/proxy.js');
        }
        var proxyZoneSpec = ProxyZoneSpec.get();
        ProxyZoneSpec.assertPresent();
        // We need to create the AsyncTestZoneSpec outside the ProxyZone.
        // If we do it in ProxyZone then we will get to infinite recursion.
        var proxyZone = Zone.current.getZoneWith('ProxyZoneSpec');
        var previousDelegate = proxyZoneSpec.getDelegate();
        proxyZone.parent.run(function () {
            var testZoneSpec = new AsyncTestZoneSpec(function () {
                // Need to restore the original zone.
                currentZone.run(function () {
                    if (proxyZoneSpec.getDelegate() == testZoneSpec) {
                        // Only reset the zone spec if it's sill this one. Otherwise, assume it's OK.
                        proxyZoneSpec.setDelegate(previousDelegate);
                    }
                    finishCallback();
                });
            }, function (error) {
                // Need to restore the original zone.
                currentZone.run(function () {
                    if (proxyZoneSpec.getDelegate() == testZoneSpec) {
                        // Only reset the zone spec if it's sill this one. Otherwise, assume it's OK.
                        proxyZoneSpec.setDelegate(previousDelegate);
                    }
                    failCallback(error);
                });
            }, 'test');
            proxyZoneSpec.setDelegate(testZoneSpec);
        });
        return Zone.current.runGuarded(fn, context);
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Wraps a test function in an asynchronous test zone. The test will automatically
     * complete when all asynchronous calls within this zone are done. Can be used
     * to wrap an {@link inject} call.
     *
     * Example:
     *
     * ```
     * it('...', async(inject([AClass], (object) => {
     *   object.doSomething.then(() => {
     *     expect(...);
     *   })
     * });
     * ```
     *
     * @publicApi
     */
    function async(fn) {
        var _Zone = typeof Zone !== 'undefined' ? Zone : null;
        if (!_Zone) {
            return function () {
                return Promise.reject('Zone is needed for the async() test helper but could not be found. ' +
                    'Please make sure that your environment includes zone.js/dist/zone.js');
            };
        }
        var asyncTest = _Zone && _Zone[_Zone.__symbol__('asyncTest')];
        if (typeof asyncTest === 'function') {
            return asyncTest(fn);
        }
        // not using new version of zone.js
        // TODO @JiaLiPassion, remove this after all library updated to
        // newest version of zone.js(0.8.25)
        return asyncFallback(fn);
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Fixture for debugging and testing a component.
     *
     * @publicApi
     */
    var ComponentFixture = /** @class */ (function () {
        function ComponentFixture(componentRef, ngZone, _autoDetect) {
            var _this = this;
            this.componentRef = componentRef;
            this.ngZone = ngZone;
            this._autoDetect = _autoDetect;
            this._isStable = true;
            this._isDestroyed = false;
            this._resolve = null;
            this._promise = null;
            this._onUnstableSubscription = null;
            this._onStableSubscription = null;
            this._onMicrotaskEmptySubscription = null;
            this._onErrorSubscription = null;
            this.changeDetectorRef = componentRef.changeDetectorRef;
            this.elementRef = componentRef.location;
            this.debugElement = core.getDebugNode(this.elementRef.nativeElement);
            this.componentInstance = componentRef.instance;
            this.nativeElement = this.elementRef.nativeElement;
            this.componentRef = componentRef;
            this.ngZone = ngZone;
            if (ngZone) {
                // Create subscriptions outside the NgZone so that the callbacks run oustide
                // of NgZone.
                ngZone.runOutsideAngular(function () {
                    _this._onUnstableSubscription =
                        ngZone.onUnstable.subscribe({ next: function () { _this._isStable = false; } });
                    _this._onMicrotaskEmptySubscription = ngZone.onMicrotaskEmpty.subscribe({
                        next: function () {
                            if (_this._autoDetect) {
                                // Do a change detection run with checkNoChanges set to true to check
                                // there are no changes on the second run.
                                _this.detectChanges(true);
                            }
                        }
                    });
                    _this._onStableSubscription = ngZone.onStable.subscribe({
                        next: function () {
                            _this._isStable = true;
                            // Check whether there is a pending whenStable() completer to resolve.
                            if (_this._promise !== null) {
                                // If so check whether there are no pending macrotasks before resolving.
                                // Do this check in the next tick so that ngZone gets a chance to update the state of
                                // pending macrotasks.
                                scheduleMicroTask(function () {
                                    if (!ngZone.hasPendingMacrotasks) {
                                        if (_this._promise !== null) {
                                            _this._resolve(true);
                                            _this._resolve = null;
                                            _this._promise = null;
                                        }
                                    }
                                });
                            }
                        }
                    });
                    _this._onErrorSubscription =
                        ngZone.onError.subscribe({ next: function (error) { throw error; } });
                });
            }
        }
        ComponentFixture.prototype._tick = function (checkNoChanges) {
            this.changeDetectorRef.detectChanges();
            if (checkNoChanges) {
                this.checkNoChanges();
            }
        };
        /**
         * Trigger a change detection cycle for the component.
         */
        ComponentFixture.prototype.detectChanges = function (checkNoChanges) {
            var _this = this;
            if (checkNoChanges === void 0) { checkNoChanges = true; }
            if (this.ngZone != null) {
                // Run the change detection inside the NgZone so that any async tasks as part of the change
                // detection are captured by the zone and can be waited for in isStable.
                this.ngZone.run(function () { _this._tick(checkNoChanges); });
            }
            else {
                // Running without zone. Just do the change detection.
                this._tick(checkNoChanges);
            }
        };
        /**
         * Do a change detection run to make sure there were no changes.
         */
        ComponentFixture.prototype.checkNoChanges = function () { this.changeDetectorRef.checkNoChanges(); };
        /**
         * Set whether the fixture should autodetect changes.
         *
         * Also runs detectChanges once so that any existing change is detected.
         */
        ComponentFixture.prototype.autoDetectChanges = function (autoDetect) {
            if (autoDetect === void 0) { autoDetect = true; }
            if (this.ngZone == null) {
                throw new Error('Cannot call autoDetectChanges when ComponentFixtureNoNgZone is set');
            }
            this._autoDetect = autoDetect;
            this.detectChanges();
        };
        /**
         * Return whether the fixture is currently stable or has async tasks that have not been completed
         * yet.
         */
        ComponentFixture.prototype.isStable = function () { return this._isStable && !this.ngZone.hasPendingMacrotasks; };
        /**
         * Get a promise that resolves when the fixture is stable.
         *
         * This can be used to resume testing after events have triggered asynchronous activity or
         * asynchronous change detection.
         */
        ComponentFixture.prototype.whenStable = function () {
            var _this = this;
            if (this.isStable()) {
                return Promise.resolve(false);
            }
            else if (this._promise !== null) {
                return this._promise;
            }
            else {
                this._promise = new Promise(function (res) { _this._resolve = res; });
                return this._promise;
            }
        };
        ComponentFixture.prototype._getRenderer = function () {
            if (this._renderer === undefined) {
                this._renderer = this.componentRef.injector.get(core.RendererFactory2, null);
            }
            return this._renderer;
        };
        /**
          * Get a promise that resolves when the ui state is stable following animations.
          */
        ComponentFixture.prototype.whenRenderingDone = function () {
            var renderer = this._getRenderer();
            if (renderer && renderer.whenRenderingDone) {
                return renderer.whenRenderingDone();
            }
            return this.whenStable();
        };
        /**
         * Trigger component destruction.
         */
        ComponentFixture.prototype.destroy = function () {
            if (!this._isDestroyed) {
                this.componentRef.destroy();
                if (this._onUnstableSubscription != null) {
                    this._onUnstableSubscription.unsubscribe();
                    this._onUnstableSubscription = null;
                }
                if (this._onStableSubscription != null) {
                    this._onStableSubscription.unsubscribe();
                    this._onStableSubscription = null;
                }
                if (this._onMicrotaskEmptySubscription != null) {
                    this._onMicrotaskEmptySubscription.unsubscribe();
                    this._onMicrotaskEmptySubscription = null;
                }
                if (this._onErrorSubscription != null) {
                    this._onErrorSubscription.unsubscribe();
                    this._onErrorSubscription = null;
                }
                this._isDestroyed = true;
            }
        };
        return ComponentFixture;
    }());
    function scheduleMicroTask(fn) {
        Zone.current.scheduleMicroTask('scheduleMicrotask', fn);
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * fakeAsync has been moved to zone.js
     * this file is for fallback in case old version of zone.js is used
     */
    var _Zone = typeof Zone !== 'undefined' ? Zone : null;
    var FakeAsyncTestZoneSpec = _Zone && _Zone['FakeAsyncTestZoneSpec'];
    var ProxyZoneSpec = _Zone && _Zone['ProxyZoneSpec'];
    var _fakeAsyncTestZoneSpec = null;
    /**
     * Clears out the shared fake async zone for a test.
     * To be called in a global `beforeEach`.
     *
     * @publicApi
     */
    function resetFakeAsyncZoneFallback() {
        _fakeAsyncTestZoneSpec = null;
        // in node.js testing we may not have ProxyZoneSpec in which case there is nothing to reset.
        ProxyZoneSpec && ProxyZoneSpec.assertPresent().resetDelegate();
    }
    var _inFakeAsyncCall = false;
    /**
     * Wraps a function to be executed in the fakeAsync zone:
     * - microtasks are manually executed by calling `flushMicrotasks()`,
     * - timers are synchronous, `tick()` simulates the asynchronous passage of time.
     *
     * If there are any pending timers at the end of the function, an exception will be thrown.
     *
     * Can be used to wrap inject() calls.
     *
     * @usageNotes
     * ### Example
     *
     * {@example core/testing/ts/fake_async.ts region='basic'}
     *
     * @param fn
     * @returns The function wrapped to be executed in the fakeAsync zone
     *
     * @publicApi
     */
    function fakeAsyncFallback(fn) {
        // Not using an arrow function to preserve context passed from call site
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var proxyZoneSpec = ProxyZoneSpec.assertPresent();
            if (_inFakeAsyncCall) {
                throw new Error('fakeAsync() calls can not be nested');
            }
            _inFakeAsyncCall = true;
            try {
                if (!_fakeAsyncTestZoneSpec) {
                    if (proxyZoneSpec.getDelegate() instanceof FakeAsyncTestZoneSpec) {
                        throw new Error('fakeAsync() calls can not be nested');
                    }
                    _fakeAsyncTestZoneSpec = new FakeAsyncTestZoneSpec();
                }
                var res = void 0;
                var lastProxyZoneSpec = proxyZoneSpec.getDelegate();
                proxyZoneSpec.setDelegate(_fakeAsyncTestZoneSpec);
                try {
                    res = fn.apply(this, args);
                    flushMicrotasksFallback();
                }
                finally {
                    proxyZoneSpec.setDelegate(lastProxyZoneSpec);
                }
                if (_fakeAsyncTestZoneSpec.pendingPeriodicTimers.length > 0) {
                    throw new Error(_fakeAsyncTestZoneSpec.pendingPeriodicTimers.length + " " +
                        "periodic timer(s) still in the queue.");
                }
                if (_fakeAsyncTestZoneSpec.pendingTimers.length > 0) {
                    throw new Error(_fakeAsyncTestZoneSpec.pendingTimers.length + " timer(s) still in the queue.");
                }
                return res;
            }
            finally {
                _inFakeAsyncCall = false;
                resetFakeAsyncZoneFallback();
            }
        };
    }
    function _getFakeAsyncZoneSpec() {
        if (_fakeAsyncTestZoneSpec == null) {
            throw new Error('The code should be running in the fakeAsync zone to call this function');
        }
        return _fakeAsyncTestZoneSpec;
    }
    /**
     * Simulates the asynchronous passage of time for the timers in the fakeAsync zone.
     *
     * The microtasks queue is drained at the very start of this function and after any timer callback
     * has been executed.
     *
     * @usageNotes
     * ### Example
     *
     * {@example core/testing/ts/fake_async.ts region='basic'}
     *
     * @publicApi
     */
    function tickFallback(millis) {
        if (millis === void 0) { millis = 0; }
        _getFakeAsyncZoneSpec().tick(millis);
    }
    /**
     * Simulates the asynchronous passage of time for the timers in the fakeAsync zone by
     * draining the macrotask queue until it is empty. The returned value is the milliseconds
     * of time that would have been elapsed.
     *
     * @param maxTurns
     * @returns The simulated time elapsed, in millis.
     *
     * @publicApi
     */
    function flushFallback(maxTurns) {
        return _getFakeAsyncZoneSpec().flush(maxTurns);
    }
    /**
     * Discard all remaining periodic tasks.
     *
     * @publicApi
     */
    function discardPeriodicTasksFallback() {
        var zoneSpec = _getFakeAsyncZoneSpec();
        zoneSpec.pendingPeriodicTimers.length = 0;
    }
    /**
     * Flush any pending microtasks.
     *
     * @publicApi
     */
    function flushMicrotasksFallback() {
        _getFakeAsyncZoneSpec().flushMicrotasks();
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var _Zone$1 = typeof Zone !== 'undefined' ? Zone : null;
    var fakeAsyncTestModule = _Zone$1 && _Zone$1[_Zone$1.__symbol__('fakeAsyncTest')];
    /**
     * Clears out the shared fake async zone for a test.
     * To be called in a global `beforeEach`.
     *
     * @publicApi
     */
    function resetFakeAsyncZone() {
        if (fakeAsyncTestModule) {
            return fakeAsyncTestModule.resetFakeAsyncZone();
        }
        else {
            return resetFakeAsyncZoneFallback();
        }
    }
    /**
     * Wraps a function to be executed in the fakeAsync zone:
     * - microtasks are manually executed by calling `flushMicrotasks()`,
     * - timers are synchronous, `tick()` simulates the asynchronous passage of time.
     *
     * If there are any pending timers at the end of the function, an exception will be thrown.
     *
     * Can be used to wrap inject() calls.
     *
     * @usageNotes
     * ### Example
     *
     * {@example core/testing/ts/fake_async.ts region='basic'}
     *
     * @param fn
     * @returns The function wrapped to be executed in the fakeAsync zone
     *
     * @publicApi
     */
    function fakeAsync(fn) {
        if (fakeAsyncTestModule) {
            return fakeAsyncTestModule.fakeAsync(fn);
        }
        else {
            return fakeAsyncFallback(fn);
        }
    }
    /**
     * Simulates the asynchronous passage of time for the timers in the fakeAsync zone.
     *
     * The microtasks queue is drained at the very start of this function and after any timer callback
     * has been executed.
     *
     * @usageNotes
     * ### Example
     *
     * {@example core/testing/ts/fake_async.ts region='basic'}
     *
     * @publicApi
     */
    function tick(millis) {
        if (millis === void 0) { millis = 0; }
        if (fakeAsyncTestModule) {
            return fakeAsyncTestModule.tick(millis);
        }
        else {
            return tickFallback(millis);
        }
    }
    /**
     * Simulates the asynchronous passage of time for the timers in the fakeAsync zone by
     * draining the macrotask queue until it is empty. The returned value is the milliseconds
     * of time that would have been elapsed.
     *
     * @param maxTurns
     * @returns The simulated time elapsed, in millis.
     *
     * @publicApi
     */
    function flush(maxTurns) {
        if (fakeAsyncTestModule) {
            return fakeAsyncTestModule.flush(maxTurns);
        }
        else {
            return flushFallback(maxTurns);
        }
    }
    /**
     * Discard all remaining periodic tasks.
     *
     * @publicApi
     */
    function discardPeriodicTasks() {
        if (fakeAsyncTestModule) {
            return fakeAsyncTestModule.discardPeriodicTasks();
        }
        else {
            discardPeriodicTasksFallback();
        }
    }
    /**
     * Flush any pending microtasks.
     *
     * @publicApi
     */
    function flushMicrotasks() {
        if (fakeAsyncTestModule) {
            return fakeAsyncTestModule.flushMicrotasks();
        }
        else {
            return flushMicrotasksFallback();
        }
    }

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

    function __values(o) {
        var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
        if (m) return m.call(o);
        return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
    }

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    function __spread() {
        for (var ar = [], i = 0; i < arguments.length; i++)
            ar = ar.concat(__read(arguments[i]));
        return ar;
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Injectable completer that allows signaling completion of an asynchronous test. Used internally.
     */
    var AsyncTestCompleter = /** @class */ (function () {
        function AsyncTestCompleter() {
            var _this = this;
            this._promise = new Promise(function (res, rej) {
                _this._resolve = res;
                _this._reject = rej;
            });
        }
        AsyncTestCompleter.prototype.done = function (value) { this._resolve(value); };
        AsyncTestCompleter.prototype.fail = function (error, stackTrace) { this._reject(error); };
        Object.defineProperty(AsyncTestCompleter.prototype, "promise", {
            get: function () { return this._promise; },
            enumerable: true,
            configurable: true
        });
        return AsyncTestCompleter;
    }());

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var _nextReferenceId = 0;
    var MetadataOverrider = /** @class */ (function () {
        function MetadataOverrider() {
            this._references = new Map();
        }
        /**
         * Creates a new instance for the given metadata class
         * based on an old instance and overrides.
         */
        MetadataOverrider.prototype.overrideMetadata = function (metadataClass, oldMetadata, override) {
            var props = {};
            if (oldMetadata) {
                _valueProps(oldMetadata).forEach(function (prop) { return props[prop] = oldMetadata[prop]; });
            }
            if (override.set) {
                if (override.remove || override.add) {
                    throw new Error("Cannot set and add/remove " + core.ɵstringify(metadataClass) + " at the same time!");
                }
                setMetadata(props, override.set);
            }
            if (override.remove) {
                removeMetadata(props, override.remove, this._references);
            }
            if (override.add) {
                addMetadata(props, override.add);
            }
            return new metadataClass(props);
        };
        return MetadataOverrider;
    }());
    function removeMetadata(metadata, remove, references) {
        var removeObjects = new Set();
        var _loop_1 = function (prop) {
            var removeValue = remove[prop];
            if (removeValue instanceof Array) {
                removeValue.forEach(function (value) { removeObjects.add(_propHashKey(prop, value, references)); });
            }
            else {
                removeObjects.add(_propHashKey(prop, removeValue, references));
            }
        };
        for (var prop in remove) {
            _loop_1(prop);
        }
        var _loop_2 = function (prop) {
            var propValue = metadata[prop];
            if (propValue instanceof Array) {
                metadata[prop] = propValue.filter(function (value) { return !removeObjects.has(_propHashKey(prop, value, references)); });
            }
            else {
                if (removeObjects.has(_propHashKey(prop, propValue, references))) {
                    metadata[prop] = undefined;
                }
            }
        };
        for (var prop in metadata) {
            _loop_2(prop);
        }
    }
    function addMetadata(metadata, add) {
        for (var prop in add) {
            var addValue = add[prop];
            var propValue = metadata[prop];
            if (propValue != null && propValue instanceof Array) {
                metadata[prop] = propValue.concat(addValue);
            }
            else {
                metadata[prop] = addValue;
            }
        }
    }
    function setMetadata(metadata, set) {
        for (var prop in set) {
            metadata[prop] = set[prop];
        }
    }
    function _propHashKey(propName, propValue, references) {
        var replacer = function (key, value) {
            if (typeof value === 'function') {
                value = _serializeReference(value, references);
            }
            return value;
        };
        return propName + ":" + JSON.stringify(propValue, replacer);
    }
    function _serializeReference(ref, references) {
        var id = references.get(ref);
        if (!id) {
            id = "" + core.ɵstringify(ref) + _nextReferenceId++;
            references.set(ref, id);
        }
        return id;
    }
    function _valueProps(obj) {
        var props = [];
        // regular public props
        Object.keys(obj).forEach(function (prop) {
            if (!prop.startsWith('_')) {
                props.push(prop);
            }
        });
        // getters
        var proto = obj;
        while (proto = Object.getPrototypeOf(proto)) {
            Object.keys(proto).forEach(function (protoProp) {
                var desc = Object.getOwnPropertyDescriptor(proto, protoProp);
                if (!protoProp.startsWith('_') && desc && 'get' in desc) {
                    props.push(protoProp);
                }
            });
        }
        return props;
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var reflection = new core.ɵReflectionCapabilities();
    /**
     * Allows to override ivy metadata for tests (via the `TestBed`).
     */
    var OverrideResolver = /** @class */ (function () {
        function OverrideResolver() {
            this.overrides = new Map();
            this.resolved = new Map();
        }
        OverrideResolver.prototype.setOverrides = function (overrides) {
            var _this = this;
            this.overrides.clear();
            overrides.forEach(function (_a) {
                var _b = __read(_a, 2), type = _b[0], override = _b[1];
                return _this.overrides.set(type, override);
            });
        };
        OverrideResolver.prototype.getAnnotation = function (type) {
            var _this = this;
            return reflection.annotations(type).find(function (a) { return a instanceof _this.type; }) || null;
        };
        OverrideResolver.prototype.resolve = function (type) {
            var resolved = this.resolved.get(type) || null;
            if (!resolved) {
                resolved = this.getAnnotation(type);
                if (resolved) {
                    var override = this.overrides.get(type);
                    if (override) {
                        var overrider = new MetadataOverrider();
                        resolved = overrider.overrideMetadata(this.type, resolved, override);
                    }
                }
                this.resolved.set(type, resolved);
            }
            return resolved;
        };
        return OverrideResolver;
    }());
    var DirectiveResolver = /** @class */ (function (_super) {
        __extends(DirectiveResolver, _super);
        function DirectiveResolver() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Object.defineProperty(DirectiveResolver.prototype, "type", {
            get: function () { return core.Directive; },
            enumerable: true,
            configurable: true
        });
        return DirectiveResolver;
    }(OverrideResolver));
    var ComponentResolver = /** @class */ (function (_super) {
        __extends(ComponentResolver, _super);
        function ComponentResolver() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Object.defineProperty(ComponentResolver.prototype, "type", {
            get: function () { return core.Component; },
            enumerable: true,
            configurable: true
        });
        return ComponentResolver;
    }(OverrideResolver));
    var PipeResolver = /** @class */ (function (_super) {
        __extends(PipeResolver, _super);
        function PipeResolver() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Object.defineProperty(PipeResolver.prototype, "type", {
            get: function () { return core.Pipe; },
            enumerable: true,
            configurable: true
        });
        return PipeResolver;
    }(OverrideResolver));
    var NgModuleResolver = /** @class */ (function (_super) {
        __extends(NgModuleResolver, _super);
        function NgModuleResolver() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Object.defineProperty(NgModuleResolver.prototype, "type", {
            get: function () { return core.NgModule; },
            enumerable: true,
            configurable: true
        });
        return NgModuleResolver;
    }(OverrideResolver));

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * An abstract class for inserting the root test component element in a platform independent way.
     *
     * @publicApi
     */
    var TestComponentRenderer = /** @class */ (function () {
        function TestComponentRenderer() {
        }
        TestComponentRenderer.prototype.insertRootElement = function (rootElementId) { };
        return TestComponentRenderer;
    }());
    /**
     * @publicApi
     */
    var ComponentFixtureAutoDetect = new core.InjectionToken('ComponentFixtureAutoDetect');
    /**
     * @publicApi
     */
    var ComponentFixtureNoNgZone = new core.InjectionToken('ComponentFixtureNoNgZone');

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var _nextRootElementId = 0;
    /**
     * @description
     * Configures and initializes environment for unit testing and provides methods for
     * creating components and services in unit tests.
     *
     * TestBed is the primary api for writing unit tests for Angular applications and libraries.
     *
     * Note: Use `TestBed` in tests. It will be set to either `TestBedViewEngine` or `TestBedRender3`
     * according to the compiler used.
     */
    var TestBedRender3 = /** @class */ (function () {
        function TestBedRender3() {
            // Properties
            this.platform = null;
            this.ngModule = null;
            // metadata overrides
            this._moduleOverrides = [];
            this._componentOverrides = [];
            this._directiveOverrides = [];
            this._pipeOverrides = [];
            this._providerOverrides = [];
            this._rootProviderOverrides = [];
            // test module configuration
            this._providers = [];
            this._declarations = [];
            this._imports = [];
            this._schemas = [];
            this._activeFixtures = [];
            this._moduleRef = null;
            this._instantiated = false;
        }
        /**
         * Initialize the environment for testing with a compiler factory, a PlatformRef, and an
         * angular module. These are common to every test in the suite.
         *
         * This may only be called once, to set up the common providers for the current test
         * suite on the current platform. If you absolutely need to change the providers,
         * first use `resetTestEnvironment`.
         *
         * Test modules and platforms for individual platforms are available from
         * '@angular/<platform_name>/testing'.
         *
         * @publicApi
         */
        TestBedRender3.initTestEnvironment = function (ngModule, platform, aotSummaries) {
            var testBed = _getTestBedRender3();
            testBed.initTestEnvironment(ngModule, platform, aotSummaries);
            return testBed;
        };
        /**
         * Reset the providers for the test injector.
         *
         * @publicApi
         */
        TestBedRender3.resetTestEnvironment = function () { _getTestBedRender3().resetTestEnvironment(); };
        TestBedRender3.configureCompiler = function (config) {
            _getTestBedRender3().configureCompiler(config);
            return TestBedRender3;
        };
        /**
         * Allows overriding default providers, directives, pipes, modules of the test injector,
         * which are defined in test_injector.js
         */
        TestBedRender3.configureTestingModule = function (moduleDef) {
            _getTestBedRender3().configureTestingModule(moduleDef);
            return TestBedRender3;
        };
        /**
         * Compile components with a `templateUrl` for the test's NgModule.
         * It is necessary to call this function
         * as fetching urls is asynchronous.
         */
        TestBedRender3.compileComponents = function () { return _getTestBedRender3().compileComponents(); };
        TestBedRender3.overrideModule = function (ngModule, override) {
            _getTestBedRender3().overrideModule(ngModule, override);
            return TestBedRender3;
        };
        TestBedRender3.overrideComponent = function (component, override) {
            _getTestBedRender3().overrideComponent(component, override);
            return TestBedRender3;
        };
        TestBedRender3.overrideDirective = function (directive, override) {
            _getTestBedRender3().overrideDirective(directive, override);
            return TestBedRender3;
        };
        TestBedRender3.overridePipe = function (pipe, override) {
            _getTestBedRender3().overridePipe(pipe, override);
            return TestBedRender3;
        };
        TestBedRender3.overrideTemplate = function (component, template) {
            _getTestBedRender3().overrideComponent(component, { set: { template: template, templateUrl: null } });
            return TestBedRender3;
        };
        /**
         * Overrides the template of the given component, compiling the template
         * in the context of the TestingModule.
         *
         * Note: This works for JIT and AOTed components as well.
         */
        TestBedRender3.overrideTemplateUsingTestingModule = function (component, template) {
            _getTestBedRender3().overrideTemplateUsingTestingModule(component, template);
            return TestBedRender3;
        };
        TestBedRender3.prototype.overrideTemplateUsingTestingModule = function (component, template) {
            throw new Error('Render3TestBed.overrideTemplateUsingTestingModule is not implemented yet');
        };
        TestBedRender3.overrideProvider = function (token, provider) {
            _getTestBedRender3().overrideProvider(token, provider);
            return TestBedRender3;
        };
        TestBedRender3.deprecatedOverrideProvider = function (token, provider) {
            throw new Error('Render3TestBed.deprecatedOverrideProvider is not implemented');
        };
        TestBedRender3.get = function (token, notFoundValue) {
            if (notFoundValue === void 0) { notFoundValue = core.Injector.THROW_IF_NOT_FOUND; }
            return _getTestBedRender3().get(token, notFoundValue);
        };
        TestBedRender3.createComponent = function (component) {
            return _getTestBedRender3().createComponent(component);
        };
        TestBedRender3.resetTestingModule = function () {
            _getTestBedRender3().resetTestingModule();
            return TestBedRender3;
        };
        /**
         * Initialize the environment for testing with a compiler factory, a PlatformRef, and an
         * angular module. These are common to every test in the suite.
         *
         * This may only be called once, to set up the common providers for the current test
         * suite on the current platform. If you absolutely need to change the providers,
         * first use `resetTestEnvironment`.
         *
         * Test modules and platforms for individual platforms are available from
         * '@angular/<platform_name>/testing'.
         *
         * @publicApi
         */
        TestBedRender3.prototype.initTestEnvironment = function (ngModule, platform, aotSummaries) {
            if (this.platform || this.ngModule) {
                throw new Error('Cannot set base providers because it has already been called');
            }
            this.platform = platform;
            this.ngModule = ngModule;
        };
        /**
         * Reset the providers for the test injector.
         *
         * @publicApi
         */
        TestBedRender3.prototype.resetTestEnvironment = function () {
            this.resetTestingModule();
            this.platform = null;
            this.ngModule = null;
        };
        TestBedRender3.prototype.resetTestingModule = function () {
            // reset metadata overrides
            this._moduleOverrides = [];
            this._componentOverrides = [];
            this._directiveOverrides = [];
            this._pipeOverrides = [];
            this._providerOverrides = [];
            this._rootProviderOverrides = [];
            // reset test module config
            this._providers = [];
            this._declarations = [];
            this._imports = [];
            this._schemas = [];
            this._moduleRef = null;
            this._instantiated = false;
            this._activeFixtures.forEach(function (fixture) {
                try {
                    fixture.destroy();
                }
                catch (e) {
                    console.error('Error during cleanup of component', {
                        component: fixture.componentInstance,
                        stacktrace: e,
                    });
                }
            });
            this._activeFixtures = [];
        };
        TestBedRender3.prototype.configureCompiler = function (config) {
            throw new Error('the Render3 compiler is not configurable !');
        };
        TestBedRender3.prototype.configureTestingModule = function (moduleDef) {
            var _a, _b, _c, _d;
            this._assertNotInstantiated('R3TestBed.configureTestingModule', 'configure the test module');
            if (moduleDef.providers) {
                (_a = this._providers).push.apply(_a, __spread(moduleDef.providers));
            }
            if (moduleDef.declarations) {
                (_b = this._declarations).push.apply(_b, __spread(moduleDef.declarations));
            }
            if (moduleDef.imports) {
                (_c = this._imports).push.apply(_c, __spread(moduleDef.imports));
            }
            if (moduleDef.schemas) {
                (_d = this._schemas).push.apply(_d, __spread(moduleDef.schemas));
            }
        };
        TestBedRender3.prototype.compileComponents = function () {
            // assume for now that components don't use templateUrl / stylesUrl to unblock further testing
            // TODO(pk): plug into the ivy's resource fetching pipeline
            return Promise.resolve();
        };
        TestBedRender3.prototype.get = function (token, notFoundValue) {
            if (notFoundValue === void 0) { notFoundValue = core.Injector.THROW_IF_NOT_FOUND; }
            this._initIfNeeded();
            if (token === TestBedRender3) {
                return this;
            }
            return this._moduleRef.injector.get(token, notFoundValue);
        };
        TestBedRender3.prototype.execute = function (tokens, fn, context) {
            var _this = this;
            this._initIfNeeded();
            var params = tokens.map(function (t) { return _this.get(t); });
            return fn.apply(context, params);
        };
        TestBedRender3.prototype.overrideModule = function (ngModule, override) {
            this._assertNotInstantiated('overrideModule', 'override module metadata');
            this._moduleOverrides.push([ngModule, override]);
        };
        TestBedRender3.prototype.overrideComponent = function (component, override) {
            this._assertNotInstantiated('overrideComponent', 'override component metadata');
            this._componentOverrides.push([component, override]);
        };
        TestBedRender3.prototype.overrideDirective = function (directive, override) {
            this._assertNotInstantiated('overrideDirective', 'override directive metadata');
            this._directiveOverrides.push([directive, override]);
        };
        TestBedRender3.prototype.overridePipe = function (pipe, override) {
            this._assertNotInstantiated('overridePipe', 'override pipe metadata');
            this._pipeOverrides.push([pipe, override]);
        };
        /**
         * Overwrites all providers for the given token with the given provider definition.
         */
        TestBedRender3.prototype.overrideProvider = function (token, provider) {
            var injectableDef;
            var isRoot = (typeof token !== 'string' && (injectableDef = core.ɵgetInjectableDef(token)) &&
                injectableDef.providedIn === 'root');
            var overrides = isRoot ? this._rootProviderOverrides : this._providerOverrides;
            if (provider.useFactory) {
                overrides.push({ provide: token, useFactory: provider.useFactory, deps: provider.deps || [] });
            }
            else {
                overrides.push({ provide: token, useValue: provider.useValue });
            }
        };
        TestBedRender3.prototype.deprecatedOverrideProvider = function (token, provider) {
            throw new Error('No implemented in IVY');
        };
        TestBedRender3.prototype.createComponent = function (type) {
            this._initIfNeeded();
            var testComponentRenderer = this.get(TestComponentRenderer);
            var rootElId = "root" + _nextRootElementId++;
            testComponentRenderer.insertRootElement(rootElId);
            var componentDef = type.ngComponentDef;
            if (!componentDef) {
                throw new Error("It looks like '" + core.ɵstringify(type) + "' has not been IVY compiled - it has no 'ngComponentDef' field");
            }
            var componentFactory = new core.ɵRender3ComponentFactory(componentDef);
            var componentRef = componentFactory.create(core.Injector.NULL, [], "#" + rootElId, this._moduleRef);
            var autoDetect = this.get(ComponentFixtureAutoDetect, false);
            var fixture = new ComponentFixture(componentRef, null, autoDetect);
            this._activeFixtures.push(fixture);
            return fixture;
        };
        // internal methods
        TestBedRender3.prototype._initIfNeeded = function () {
            if (this._instantiated) {
                return;
            }
            var resolvers = this._getResolvers();
            var testModuleType = this._createTestModule();
            compileNgModule(testModuleType, resolvers);
            var parentInjector = this.platform.injector;
            this._moduleRef = new core.ɵRender3NgModuleRef(testModuleType, parentInjector);
            this._instantiated = true;
        };
        // creates resolvers taking overrides into account
        TestBedRender3.prototype._getResolvers = function () {
            var module = new NgModuleResolver();
            module.setOverrides(this._moduleOverrides);
            var component = new ComponentResolver();
            component.setOverrides(this._componentOverrides);
            var directive = new DirectiveResolver();
            directive.setOverrides(this._directiveOverrides);
            var pipe = new PipeResolver();
            pipe.setOverrides(this._pipeOverrides);
            return { module: module, component: component, directive: directive, pipe: pipe };
        };
        TestBedRender3.prototype._assertNotInstantiated = function (methodName, methodDescription) {
            if (this._instantiated) {
                throw new Error("Cannot " + methodDescription + " when the test module has already been instantiated. " +
                    ("Make sure you are not using `inject` before `" + methodName + "`."));
            }
        };
        TestBedRender3.prototype._createTestModule = function () {
            var rootProviderOverrides = this._rootProviderOverrides;
            var rendererFactoryWrapper = {
                provide: core.ɵWRAP_RENDERER_FACTORY2,
                useFactory: function () { return function (rf) { return new core.ɵRender3DebugRendererFactory2(rf); }; },
            };
            var RootScopeModule = /** @class */ (function () {
                function RootScopeModule() {
                }
                RootScopeModule = __decorate([
                    core.NgModule({
                        providers: __spread(rootProviderOverrides, [rendererFactoryWrapper]),
                        jit: true,
                    })
                ], RootScopeModule);
                return RootScopeModule;
            }());
            var providers = __spread(this._providers, this._providerOverrides);
            var declarations = this._declarations;
            var imports = [RootScopeModule, this.ngModule, this._imports];
            var schemas = this._schemas;
            var DynamicTestModule = /** @class */ (function () {
                function DynamicTestModule() {
                }
                DynamicTestModule = __decorate([
                    core.NgModule({ providers: providers, declarations: declarations, imports: imports, schemas: schemas, jit: true })
                ], DynamicTestModule);
                return DynamicTestModule;
            }());
            return DynamicTestModule;
        };
        return TestBedRender3;
    }());
    var testBed;
    function _getTestBedRender3() {
        return testBed = testBed || new TestBedRender3();
    }
    // Module compiler
    var EMPTY_ARRAY = [];
    function compileNgModule(moduleType, resolvers) {
        var ngModule = resolvers.module.resolve(moduleType);
        if (ngModule === null) {
            throw new Error(core.ɵstringify(moduleType) + " has not @NgModule annotation");
        }
        core.ɵcompileNgModuleDefs(moduleType, ngModule);
        var declarations = flatten(ngModule.declarations || EMPTY_ARRAY);
        var compiledComponents = [];
        // Compile the components, directives and pipes declared by this module
        declarations.forEach(function (declaration) {
            var component = resolvers.component.resolve(declaration);
            if (component) {
                core.ɵcompileComponent(declaration, component);
                compiledComponents.push(declaration);
                return;
            }
            var directive = resolvers.directive.resolve(declaration);
            if (directive) {
                core.ɵcompileDirective(declaration, directive);
                return;
            }
            var pipe = resolvers.pipe.resolve(declaration);
            if (pipe) {
                core.ɵcompilePipe(declaration, pipe);
                return;
            }
        });
        // Compile transitive modules, components, directives and pipes
        var transitiveScope = transitiveScopesFor(moduleType, resolvers);
        compiledComponents.forEach(function (cmp) { return core.ɵpatchComponentDefWithScope(cmp.ngComponentDef, transitiveScope); });
    }
    /**
     * Compute the pair of transitive scopes (compilation scope and exported scope) for a given module.
     *
     * This operation is memoized and the result is cached on the module's definition. It can be called
     * on modules with components that have not fully compiled yet, but the result should not be used
     * until they have.
     */
    function transitiveScopesFor(moduleType, resolvers) {
        if (!isNgModule(moduleType)) {
            throw new Error(moduleType.name + " does not have an ngModuleDef");
        }
        var def = moduleType.ngModuleDef;
        if (def.transitiveCompileScopes !== null) {
            return def.transitiveCompileScopes;
        }
        var scopes = {
            compilation: {
                directives: new Set(),
                pipes: new Set(),
            },
            exported: {
                directives: new Set(),
                pipes: new Set(),
            },
        };
        def.declarations.forEach(function (declared) {
            var declaredWithDefs = declared;
            if (declaredWithDefs.ngPipeDef !== undefined) {
                scopes.compilation.pipes.add(declared);
            }
            else {
                scopes.compilation.directives.add(declared);
            }
        });
        def.imports.forEach(function (imported) {
            var ngModule = resolvers.module.resolve(imported);
            if (ngModule === null) {
                throw new Error("Importing " + imported.name + " which does not have an @ngModule");
            }
            else {
                compileNgModule(imported, resolvers);
            }
            // When this module imports another, the imported module's exported directives and pipes are
            // added to the compilation scope of this module.
            var importedScope = transitiveScopesFor(imported, resolvers);
            importedScope.exported.directives.forEach(function (entry) { return scopes.compilation.directives.add(entry); });
            importedScope.exported.pipes.forEach(function (entry) { return scopes.compilation.pipes.add(entry); });
        });
        def.exports.forEach(function (exported) {
            var exportedTyped = exported;
            // Either the type is a module, a pipe, or a component/directive (which may not have an
            // ngComponentDef as it might be compiled asynchronously).
            if (isNgModule(exportedTyped)) {
                // When this module exports another, the exported module's exported directives and pipes are
                // added to both the compilation and exported scopes of this module.
                var exportedScope = transitiveScopesFor(exportedTyped, resolvers);
                exportedScope.exported.directives.forEach(function (entry) {
                    scopes.compilation.directives.add(entry);
                    scopes.exported.directives.add(entry);
                });
                exportedScope.exported.pipes.forEach(function (entry) {
                    scopes.compilation.pipes.add(entry);
                    scopes.exported.pipes.add(entry);
                });
            }
            else if (exportedTyped.ngPipeDef !== undefined) {
                scopes.exported.pipes.add(exportedTyped);
            }
            else {
                scopes.exported.directives.add(exportedTyped);
            }
        });
        def.transitiveCompileScopes = scopes;
        return scopes;
    }
    function flatten(values) {
        var out = [];
        values.forEach(function (value) {
            if (Array.isArray(value)) {
                out.push.apply(out, __spread(flatten(value)));
            }
            else {
                out.push(value);
            }
        });
        return out;
    }
    function isNgModule(value) {
        return value.ngModuleDef !== undefined;
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    function unimplemented() {
        throw Error('unimplemented');
    }
    /**
     * Special interface to the compiler only used by testing
     *
     * @publicApi
     */
    var TestingCompiler = /** @class */ (function (_super) {
        __extends(TestingCompiler, _super);
        function TestingCompiler() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Object.defineProperty(TestingCompiler.prototype, "injector", {
            get: function () { throw unimplemented(); },
            enumerable: true,
            configurable: true
        });
        TestingCompiler.prototype.overrideModule = function (module, overrides) {
            throw unimplemented();
        };
        TestingCompiler.prototype.overrideDirective = function (directive, overrides) {
            throw unimplemented();
        };
        TestingCompiler.prototype.overrideComponent = function (component, overrides) {
            throw unimplemented();
        };
        TestingCompiler.prototype.overridePipe = function (directive, overrides) {
            throw unimplemented();
        };
        /**
         * Allows to pass the compile summary from AOT compilation to the JIT compiler,
         * so that it can use the code generated by AOT.
         */
        TestingCompiler.prototype.loadAotSummaries = function (summaries) { throw unimplemented(); };
        /**
         * Gets the component factory for the given component.
         * This assumes that the component has been compiled before calling this call using
         * `compileModuleAndAllComponents*`.
         */
        TestingCompiler.prototype.getComponentFactory = function (component) { throw unimplemented(); };
        /**
         * Returns the component type that is stored in the given error.
         * This can be used for errors created by compileModule...
         */
        TestingCompiler.prototype.getComponentFromError = function (error) { throw unimplemented(); };
        TestingCompiler = __decorate([
            core.Injectable()
        ], TestingCompiler);
        return TestingCompiler;
    }(core.Compiler));
    /**
     * A factory for creating a Compiler
     *
     * @publicApi
     */
    var TestingCompilerFactory = /** @class */ (function () {
        function TestingCompilerFactory() {
        }
        return TestingCompilerFactory;
    }());

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var UNDEFINED = new Object();
    var _nextRootElementId$1 = 0;
    /**
     * @description
     * Configures and initializes environment for unit testing and provides methods for
     * creating components and services in unit tests.
     *
     * `TestBed` is the primary api for writing unit tests for Angular applications and libraries.
     *
     * Note: Use `TestBed` in tests. It will be set to either `TestBedViewEngine` or `TestBedRender3`
     * according to the compiler used.
     */
    var TestBedViewEngine = /** @class */ (function () {
        function TestBedViewEngine() {
            this._instantiated = false;
            this._compiler = null;
            this._moduleRef = null;
            this._moduleFactory = null;
            this._compilerOptions = [];
            this._moduleOverrides = [];
            this._componentOverrides = [];
            this._directiveOverrides = [];
            this._pipeOverrides = [];
            this._providers = [];
            this._declarations = [];
            this._imports = [];
            this._schemas = [];
            this._activeFixtures = [];
            this._testEnvAotSummaries = function () { return []; };
            this._aotSummaries = [];
            this._templateOverrides = [];
            this._isRoot = true;
            this._rootProviderOverrides = [];
            this.platform = null;
            this.ngModule = null;
        }
        /**
         * Initialize the environment for testing with a compiler factory, a PlatformRef, and an
         * angular module. These are common to every test in the suite.
         *
         * This may only be called once, to set up the common providers for the current test
         * suite on the current platform. If you absolutely need to change the providers,
         * first use `resetTestEnvironment`.
         *
         * Test modules and platforms for individual platforms are available from
         * '@angular/<platform_name>/testing'.
         *
         * @publicApi
         */
        TestBedViewEngine.initTestEnvironment = function (ngModule, platform, aotSummaries) {
            var testBed = _getTestBedViewEngine();
            testBed.initTestEnvironment(ngModule, platform, aotSummaries);
            return testBed;
        };
        /**
         * Reset the providers for the test injector.
         *
         * @publicApi
         */
        TestBedViewEngine.resetTestEnvironment = function () { _getTestBedViewEngine().resetTestEnvironment(); };
        TestBedViewEngine.resetTestingModule = function () {
            _getTestBedViewEngine().resetTestingModule();
            return TestBedViewEngine;
        };
        /**
         * Allows overriding default compiler providers and settings
         * which are defined in test_injector.js
         */
        TestBedViewEngine.configureCompiler = function (config) {
            _getTestBedViewEngine().configureCompiler(config);
            return TestBedViewEngine;
        };
        /**
         * Allows overriding default providers, directives, pipes, modules of the test injector,
         * which are defined in test_injector.js
         */
        TestBedViewEngine.configureTestingModule = function (moduleDef) {
            _getTestBedViewEngine().configureTestingModule(moduleDef);
            return TestBedViewEngine;
        };
        /**
         * Compile components with a `templateUrl` for the test's NgModule.
         * It is necessary to call this function
         * as fetching urls is asynchronous.
         */
        TestBedViewEngine.compileComponents = function () { return getTestBed().compileComponents(); };
        TestBedViewEngine.overrideModule = function (ngModule, override) {
            _getTestBedViewEngine().overrideModule(ngModule, override);
            return TestBedViewEngine;
        };
        TestBedViewEngine.overrideComponent = function (component, override) {
            _getTestBedViewEngine().overrideComponent(component, override);
            return TestBedViewEngine;
        };
        TestBedViewEngine.overrideDirective = function (directive, override) {
            _getTestBedViewEngine().overrideDirective(directive, override);
            return TestBedViewEngine;
        };
        TestBedViewEngine.overridePipe = function (pipe, override) {
            _getTestBedViewEngine().overridePipe(pipe, override);
            return TestBedViewEngine;
        };
        TestBedViewEngine.overrideTemplate = function (component, template) {
            _getTestBedViewEngine().overrideComponent(component, { set: { template: template, templateUrl: null } });
            return TestBedViewEngine;
        };
        /**
         * Overrides the template of the given component, compiling the template
         * in the context of the TestingModule.
         *
         * Note: This works for JIT and AOTed components as well.
         */
        TestBedViewEngine.overrideTemplateUsingTestingModule = function (component, template) {
            _getTestBedViewEngine().overrideTemplateUsingTestingModule(component, template);
            return TestBedViewEngine;
        };
        TestBedViewEngine.overrideProvider = function (token, provider) {
            _getTestBedViewEngine().overrideProvider(token, provider);
            return TestBedViewEngine;
        };
        TestBedViewEngine.deprecatedOverrideProvider = function (token, provider) {
            _getTestBedViewEngine().deprecatedOverrideProvider(token, provider);
            return TestBedViewEngine;
        };
        TestBedViewEngine.get = function (token, notFoundValue) {
            if (notFoundValue === void 0) { notFoundValue = core.Injector.THROW_IF_NOT_FOUND; }
            return _getTestBedViewEngine().get(token, notFoundValue);
        };
        TestBedViewEngine.createComponent = function (component) {
            return _getTestBedViewEngine().createComponent(component);
        };
        /**
         * Initialize the environment for testing with a compiler factory, a PlatformRef, and an
         * angular module. These are common to every test in the suite.
         *
         * This may only be called once, to set up the common providers for the current test
         * suite on the current platform. If you absolutely need to change the providers,
         * first use `resetTestEnvironment`.
         *
         * Test modules and platforms for individual platforms are available from
         * '@angular/<platform_name>/testing'.
         *
         * @publicApi
         */
        TestBedViewEngine.prototype.initTestEnvironment = function (ngModule, platform, aotSummaries) {
            if (this.platform || this.ngModule) {
                throw new Error('Cannot set base providers because it has already been called');
            }
            this.platform = platform;
            this.ngModule = ngModule;
            if (aotSummaries) {
                this._testEnvAotSummaries = aotSummaries;
            }
        };
        /**
         * Reset the providers for the test injector.
         *
         * @publicApi
         */
        TestBedViewEngine.prototype.resetTestEnvironment = function () {
            this.resetTestingModule();
            this.platform = null;
            this.ngModule = null;
            this._testEnvAotSummaries = function () { return []; };
        };
        TestBedViewEngine.prototype.resetTestingModule = function () {
            core.ɵclearOverrides();
            this._aotSummaries = [];
            this._templateOverrides = [];
            this._compiler = null;
            this._moduleOverrides = [];
            this._componentOverrides = [];
            this._directiveOverrides = [];
            this._pipeOverrides = [];
            this._isRoot = true;
            this._rootProviderOverrides = [];
            this._moduleRef = null;
            this._moduleFactory = null;
            this._compilerOptions = [];
            this._providers = [];
            this._declarations = [];
            this._imports = [];
            this._schemas = [];
            this._instantiated = false;
            this._activeFixtures.forEach(function (fixture) {
                try {
                    fixture.destroy();
                }
                catch (e) {
                    console.error('Error during cleanup of component', {
                        component: fixture.componentInstance,
                        stacktrace: e,
                    });
                }
            });
            this._activeFixtures = [];
        };
        TestBedViewEngine.prototype.configureCompiler = function (config) {
            this._assertNotInstantiated('TestBed.configureCompiler', 'configure the compiler');
            this._compilerOptions.push(config);
        };
        TestBedViewEngine.prototype.configureTestingModule = function (moduleDef) {
            var _a, _b, _c, _d;
            this._assertNotInstantiated('TestBed.configureTestingModule', 'configure the test module');
            if (moduleDef.providers) {
                (_a = this._providers).push.apply(_a, __spread(moduleDef.providers));
            }
            if (moduleDef.declarations) {
                (_b = this._declarations).push.apply(_b, __spread(moduleDef.declarations));
            }
            if (moduleDef.imports) {
                (_c = this._imports).push.apply(_c, __spread(moduleDef.imports));
            }
            if (moduleDef.schemas) {
                (_d = this._schemas).push.apply(_d, __spread(moduleDef.schemas));
            }
            if (moduleDef.aotSummaries) {
                this._aotSummaries.push(moduleDef.aotSummaries);
            }
        };
        TestBedViewEngine.prototype.compileComponents = function () {
            var _this = this;
            if (this._moduleFactory || this._instantiated) {
                return Promise.resolve(null);
            }
            var moduleType = this._createCompilerAndModule();
            return this._compiler.compileModuleAndAllComponentsAsync(moduleType)
                .then(function (moduleAndComponentFactories) {
                _this._moduleFactory = moduleAndComponentFactories.ngModuleFactory;
            });
        };
        TestBedViewEngine.prototype._initIfNeeded = function () {
            var e_1, _a;
            if (this._instantiated) {
                return;
            }
            if (!this._moduleFactory) {
                try {
                    var moduleType = this._createCompilerAndModule();
                    this._moduleFactory =
                        this._compiler.compileModuleAndAllComponentsSync(moduleType).ngModuleFactory;
                }
                catch (e) {
                    var errorCompType = this._compiler.getComponentFromError(e);
                    if (errorCompType) {
                        throw new Error("This test module uses the component " + core.ɵstringify(errorCompType) + " which is using a \"templateUrl\" or \"styleUrls\", but they were never compiled. " +
                            "Please call \"TestBed.compileComponents\" before your test.");
                    }
                    else {
                        throw e;
                    }
                }
            }
            try {
                for (var _b = __values(this._templateOverrides), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var _d = _c.value, component = _d.component, templateOf = _d.templateOf;
                    var compFactory = this._compiler.getComponentFactory(templateOf);
                    core.ɵoverrideComponentView(component, compFactory);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            var ngZone = new core.NgZone({ enableLongStackTrace: true });
            var providers = [{ provide: core.NgZone, useValue: ngZone }];
            var ngZoneInjector = core.Injector.create({
                providers: providers,
                parent: this.platform.injector,
                name: this._moduleFactory.moduleType.name
            });
            this._moduleRef = this._moduleFactory.create(ngZoneInjector);
            // ApplicationInitStatus.runInitializers() is marked @internal to core. So casting to any
            // before accessing it.
            this._moduleRef.injector.get(core.ApplicationInitStatus).runInitializers();
            this._instantiated = true;
        };
        TestBedViewEngine.prototype._createCompilerAndModule = function () {
            var _this = this;
            var e_2, _a;
            var providers = this._providers.concat([{ provide: TestBed, useValue: this }]);
            var declarations = __spread(this._declarations, this._templateOverrides.map(function (entry) { return entry.templateOf; }));
            var rootScopeImports = [];
            var rootProviderOverrides = this._rootProviderOverrides;
            if (this._isRoot) {
                var RootScopeModule = /** @class */ (function () {
                    function RootScopeModule() {
                    }
                    RootScopeModule = __decorate([
                        core.NgModule({
                            providers: __spread(rootProviderOverrides),
                            jit: true,
                        })
                    ], RootScopeModule);
                    return RootScopeModule;
                }());
                rootScopeImports.push(RootScopeModule);
            }
            providers.push({ provide: core.ɵAPP_ROOT, useValue: this._isRoot });
            var imports = [rootScopeImports, this.ngModule, this._imports];
            var schemas = this._schemas;
            var DynamicTestModule = /** @class */ (function () {
                function DynamicTestModule() {
                }
                DynamicTestModule = __decorate([
                    core.NgModule({ providers: providers, declarations: declarations, imports: imports, schemas: schemas, jit: true })
                ], DynamicTestModule);
                return DynamicTestModule;
            }());
            var compilerFactory = this.platform.injector.get(TestingCompilerFactory);
            this._compiler = compilerFactory.createTestingCompiler(this._compilerOptions);
            try {
                for (var _b = __values(__spread([this._testEnvAotSummaries], this._aotSummaries)), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var summary = _c.value;
                    this._compiler.loadAotSummaries(summary);
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_2) throw e_2.error; }
            }
            this._moduleOverrides.forEach(function (entry) { return _this._compiler.overrideModule(entry[0], entry[1]); });
            this._componentOverrides.forEach(function (entry) { return _this._compiler.overrideComponent(entry[0], entry[1]); });
            this._directiveOverrides.forEach(function (entry) { return _this._compiler.overrideDirective(entry[0], entry[1]); });
            this._pipeOverrides.forEach(function (entry) { return _this._compiler.overridePipe(entry[0], entry[1]); });
            return DynamicTestModule;
        };
        TestBedViewEngine.prototype._assertNotInstantiated = function (methodName, methodDescription) {
            if (this._instantiated) {
                throw new Error("Cannot " + methodDescription + " when the test module has already been instantiated. " +
                    ("Make sure you are not using `inject` before `" + methodName + "`."));
            }
        };
        TestBedViewEngine.prototype.get = function (token, notFoundValue) {
            if (notFoundValue === void 0) { notFoundValue = core.Injector.THROW_IF_NOT_FOUND; }
            this._initIfNeeded();
            if (token === TestBed) {
                return this;
            }
            // Tests can inject things from the ng module and from the compiler,
            // but the ng module can't inject things from the compiler and vice versa.
            var result = this._moduleRef.injector.get(token, UNDEFINED);
            return result === UNDEFINED ? this._compiler.injector.get(token, notFoundValue) : result;
        };
        TestBedViewEngine.prototype.execute = function (tokens, fn, context) {
            var _this = this;
            this._initIfNeeded();
            var params = tokens.map(function (t) { return _this.get(t); });
            return fn.apply(context, params);
        };
        TestBedViewEngine.prototype.overrideModule = function (ngModule, override) {
            this._assertNotInstantiated('overrideModule', 'override module metadata');
            this._moduleOverrides.push([ngModule, override]);
        };
        TestBedViewEngine.prototype.overrideComponent = function (component, override) {
            this._assertNotInstantiated('overrideComponent', 'override component metadata');
            this._componentOverrides.push([component, override]);
        };
        TestBedViewEngine.prototype.overrideDirective = function (directive, override) {
            this._assertNotInstantiated('overrideDirective', 'override directive metadata');
            this._directiveOverrides.push([directive, override]);
        };
        TestBedViewEngine.prototype.overridePipe = function (pipe, override) {
            this._assertNotInstantiated('overridePipe', 'override pipe metadata');
            this._pipeOverrides.push([pipe, override]);
        };
        TestBedViewEngine.prototype.overrideProvider = function (token, provider) {
            this.overrideProviderImpl(token, provider);
        };
        TestBedViewEngine.prototype.deprecatedOverrideProvider = function (token, provider) {
            this.overrideProviderImpl(token, provider, /* deprecated */ true);
        };
        TestBedViewEngine.prototype.overrideProviderImpl = function (token, provider, deprecated) {
            if (deprecated === void 0) { deprecated = false; }
            var def = null;
            if (typeof token !== 'string' && (def = core.ɵgetInjectableDef(token)) && def.providedIn === 'root') {
                if (provider.useFactory) {
                    this._rootProviderOverrides.push({ provide: token, useFactory: provider.useFactory, deps: provider.deps || [] });
                }
                else {
                    this._rootProviderOverrides.push({ provide: token, useValue: provider.useValue });
                }
            }
            var flags = 0;
            var value;
            if (provider.useFactory) {
                flags |= 1024 /* TypeFactoryProvider */;
                value = provider.useFactory;
            }
            else {
                flags |= 256 /* TypeValueProvider */;
                value = provider.useValue;
            }
            var deps = (provider.deps || []).map(function (dep) {
                var depFlags = 0 /* None */;
                var depToken;
                if (Array.isArray(dep)) {
                    dep.forEach(function (entry) {
                        if (entry instanceof core.Optional) {
                            depFlags |= 2 /* Optional */;
                        }
                        else if (entry instanceof core.SkipSelf) {
                            depFlags |= 1 /* SkipSelf */;
                        }
                        else {
                            depToken = entry;
                        }
                    });
                }
                else {
                    depToken = dep;
                }
                return [depFlags, depToken];
            });
            core.ɵoverrideProvider({ token: token, flags: flags, deps: deps, value: value, deprecatedBehavior: deprecated });
        };
        TestBedViewEngine.prototype.overrideTemplateUsingTestingModule = function (component, template) {
            this._assertNotInstantiated('overrideTemplateUsingTestingModule', 'override template');
            var OverrideComponent = /** @class */ (function () {
                function OverrideComponent() {
                }
                OverrideComponent = __decorate([
                    core.Component({ selector: 'empty', template: template, jit: true })
                ], OverrideComponent);
                return OverrideComponent;
            }());
            this._templateOverrides.push({ component: component, templateOf: OverrideComponent });
        };
        TestBedViewEngine.prototype.createComponent = function (component) {
            var _this = this;
            this._initIfNeeded();
            var componentFactory = this._compiler.getComponentFactory(component);
            if (!componentFactory) {
                throw new Error("Cannot create the component " + core.ɵstringify(component) + " as it was not imported into the testing module!");
            }
            var noNgZone = this.get(ComponentFixtureNoNgZone, false);
            var autoDetect = this.get(ComponentFixtureAutoDetect, false);
            var ngZone = noNgZone ? null : this.get(core.NgZone, null);
            var testComponentRenderer = this.get(TestComponentRenderer);
            var rootElId = "root" + _nextRootElementId$1++;
            testComponentRenderer.insertRootElement(rootElId);
            var initComponent = function () {
                var componentRef = componentFactory.create(core.Injector.NULL, [], "#" + rootElId, _this._moduleRef);
                return new ComponentFixture(componentRef, ngZone, autoDetect);
            };
            var fixture = !ngZone ? initComponent() : ngZone.run(initComponent);
            this._activeFixtures.push(fixture);
            return fixture;
        };
        return TestBedViewEngine;
    }());
    /**
     * @description
     * Configures and initializes environment for unit testing and provides methods for
     * creating components and services in unit tests.
     *
     * `TestBed` is the primary api for writing unit tests for Angular applications and libraries.
     *
     * Note: Use `TestBed` in tests. It will be set to either `TestBedViewEngine` or `TestBedRender3`
     * according to the compiler used.
     *
     * @publicApi
     */
    var TestBed = core.ɵivyEnabled ? TestBedRender3 : TestBedViewEngine;
    /**
     * Returns a singleton of the applicable `TestBed`.
     *
     * It will be either an instance of `TestBedViewEngine` or `TestBedRender3`.
     *
     * @publicApi
     */
    var getTestBed = core.ɵivyEnabled ? _getTestBedRender3 : _getTestBedViewEngine;
    var testBed$1;
    function _getTestBedViewEngine() {
        return testBed$1 = testBed$1 || new TestBedViewEngine();
    }
    /**
     * Allows injecting dependencies in `beforeEach()` and `it()`.
     *
     * Example:
     *
     * ```
     * beforeEach(inject([Dependency, AClass], (dep, object) => {
     *   // some code that uses `dep` and `object`
     *   // ...
     * }));
     *
     * it('...', inject([AClass], (object) => {
     *   object.doSomething();
     *   expect(...);
     * })
     * ```
     *
     * Notes:
     * - inject is currently a function because of some Traceur limitation the syntax should
     * eventually
     *   becomes `it('...', @Inject (object: AClass, async: AsyncTestCompleter) => { ... });`
     *
     * @publicApi
     */
    function inject(tokens, fn) {
        var testBed = getTestBed();
        if (tokens.indexOf(AsyncTestCompleter) >= 0) {
            // Not using an arrow function to preserve context passed from call site
            return function () {
                var _this = this;
                // Return an async test method that returns a Promise if AsyncTestCompleter is one of
                // the injected tokens.
                return testBed.compileComponents().then(function () {
                    var completer = testBed.get(AsyncTestCompleter);
                    testBed.execute(tokens, fn, _this);
                    return completer.promise;
                });
            };
        }
        else {
            // Not using an arrow function to preserve context passed from call site
            return function () { return testBed.execute(tokens, fn, this); };
        }
    }
    /**
     * @publicApi
     */
    var InjectSetupWrapper = /** @class */ (function () {
        function InjectSetupWrapper(_moduleDef) {
            this._moduleDef = _moduleDef;
        }
        InjectSetupWrapper.prototype._addModule = function () {
            var moduleDef = this._moduleDef();
            if (moduleDef) {
                getTestBed().configureTestingModule(moduleDef);
            }
        };
        InjectSetupWrapper.prototype.inject = function (tokens, fn) {
            var self = this;
            // Not using an arrow function to preserve context passed from call site
            return function () {
                self._addModule();
                return inject(tokens, fn).call(this);
            };
        };
        return InjectSetupWrapper;
    }());
    function withModule(moduleDef, fn) {
        if (fn) {
            // Not using an arrow function to preserve context passed from call site
            return function () {
                var testBed = getTestBed();
                if (moduleDef) {
                    testBed.configureTestingModule(moduleDef);
                }
                return fn.apply(this);
            };
        }
        return new InjectSetupWrapper(function () { return moduleDef; });
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var _global$1 = (typeof window === 'undefined' ? global : window);
    // Reset the test providers and the fake async zone before each test.
    if (_global$1.beforeEach) {
        _global$1.beforeEach(function () {
            TestBed.resetTestingModule();
            resetFakeAsyncZone();
        });
    }
    // TODO(juliemr): remove this, only used because we need to export something to have compilation
    // work.
    var __core_private_testing_placeholder__ = '';

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

    exports.ɵangular_packages_core_testing_testing_b = TestBedRender3;
    exports.ɵangular_packages_core_testing_testing_c = _getTestBedRender3;
    exports.ɵangular_packages_core_testing_testing_a = TestBedViewEngine;
    exports.TestBed = TestBed;
    exports.getTestBed = getTestBed;
    exports.inject = inject;
    exports.InjectSetupWrapper = InjectSetupWrapper;
    exports.withModule = withModule;
    exports.ɵMetadataOverrider = MetadataOverrider;
    exports.async = async;
    exports.ComponentFixture = ComponentFixture;
    exports.resetFakeAsyncZone = resetFakeAsyncZone;
    exports.fakeAsync = fakeAsync;
    exports.tick = tick;
    exports.flush = flush;
    exports.discardPeriodicTasks = discardPeriodicTasks;
    exports.flushMicrotasks = flushMicrotasks;
    exports.TestComponentRenderer = TestComponentRenderer;
    exports.ComponentFixtureAutoDetect = ComponentFixtureAutoDetect;
    exports.ComponentFixtureNoNgZone = ComponentFixtureNoNgZone;
    exports.__core_private_testing_placeholder__ = __core_private_testing_placeholder__;
    exports.ɵTestingCompiler = TestingCompiler;
    exports.ɵTestingCompilerFactory = TestingCompilerFactory;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=core-testing.umd.js.map

/**
 * @license Angular v7.0.4
 * (c) 2010-2018 Google, Inc. https://angular.io/
 * License: MIT
 */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/common'), require('@angular/common/testing'), require('@angular/core'), require('@angular/router')) :
    typeof define === 'function' && define.amd ? define('@angular/router/testing', ['exports', '@angular/common', '@angular/common/testing', '@angular/core', '@angular/router'], factory) :
    (factory((global.ng = global.ng || {}, global.ng.router = global.ng.router || {}, global.ng.router.testing = {}),global.ng.common,global.ng.common.testing,global.ng.core,global.ng.router));
}(this, (function (exports,common,testing,core,router) { 'use strict';

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

    function __decorate(decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    }

    function __metadata(metadataKey, metadataValue) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
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

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * @description
     *
     * Allows to simulate the loading of ng modules in tests.
     *
     * ```
     * const loader = TestBed.get(NgModuleFactoryLoader);
     *
     * @Component({template: 'lazy-loaded'})
     * class LazyLoadedComponent {}
     * @NgModule({
     *   declarations: [LazyLoadedComponent],
     *   imports: [RouterModule.forChild([{path: 'loaded', component: LazyLoadedComponent}])]
     * })
     *
     * class LoadedModule {}
     *
     * // sets up stubbedModules
     * loader.stubbedModules = {lazyModule: LoadedModule};
     *
     * router.resetConfig([
     *   {path: 'lazy', loadChildren: 'lazyModule'},
     * ]);
     *
     * router.navigateByUrl('/lazy/loaded');
     * ```
     *
     * @publicApi
     */
    var SpyNgModuleFactoryLoader = /** @class */ (function () {
        function SpyNgModuleFactoryLoader(compiler) {
            this.compiler = compiler;
            /**
             * @docsNotRequired
             */
            this._stubbedModules = {};
        }
        Object.defineProperty(SpyNgModuleFactoryLoader.prototype, "stubbedModules", {
            /**
             * @docsNotRequired
             */
            get: function () { return this._stubbedModules; },
            /**
             * @docsNotRequired
             */
            set: function (modules) {
                var e_1, _a;
                var res = {};
                try {
                    for (var _b = __values(Object.keys(modules)), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var t = _c.value;
                        res[t] = this.compiler.compileModuleAsync(modules[t]);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                this._stubbedModules = res;
            },
            enumerable: true,
            configurable: true
        });
        SpyNgModuleFactoryLoader.prototype.load = function (path) {
            if (this._stubbedModules[path]) {
                return this._stubbedModules[path];
            }
            else {
                return Promise.reject(new Error("Cannot find module " + path));
            }
        };
        SpyNgModuleFactoryLoader = __decorate([
            core.Injectable(),
            __metadata("design:paramtypes", [core.Compiler])
        ], SpyNgModuleFactoryLoader);
        return SpyNgModuleFactoryLoader;
    }());
    function isUrlHandlingStrategy(opts) {
        // This property check is needed because UrlHandlingStrategy is an interface and doesn't exist at
        // runtime.
        return 'shouldProcessUrl' in opts;
    }
    /**
     * Router setup factory function used for testing.
     *
     * @publicApi
     */
    function setupTestingRouter(urlSerializer, contexts, location, loader, compiler, injector, routes, opts, urlHandlingStrategy) {
        var router$$1 = new router.Router(null, urlSerializer, contexts, location, injector, loader, compiler, router.ɵflatten(routes));
        if (opts) {
            // Handle deprecated argument ordering.
            if (isUrlHandlingStrategy(opts)) {
                router$$1.urlHandlingStrategy = opts;
            }
            else {
                // Handle ExtraOptions
                if (opts.malformedUriErrorHandler) {
                    router$$1.malformedUriErrorHandler = opts.malformedUriErrorHandler;
                }
                if (opts.paramsInheritanceStrategy) {
                    router$$1.paramsInheritanceStrategy = opts.paramsInheritanceStrategy;
                }
            }
        }
        if (urlHandlingStrategy) {
            router$$1.urlHandlingStrategy = urlHandlingStrategy;
        }
        return router$$1;
    }
    /**
     * @description
     *
     * Sets up the router to be used for testing.
     *
     * The modules sets up the router to be used for testing.
     * It provides spy implementations of `Location`, `LocationStrategy`, and {@link
     * NgModuleFactoryLoader}.
     *
     * @usageNotes
     * ### Example
     *
     * ```
     * beforeEach(() => {
     *   TestBed.configureTestModule({
     *     imports: [
     *       RouterTestingModule.withRoutes(
     *         [{path: '', component: BlankCmp}, {path: 'simple', component: SimpleCmp}]
     *       )
     *     ]
     *   });
     * });
     * ```
     *
     * @publicApi
     */
    var RouterTestingModule = /** @class */ (function () {
        function RouterTestingModule() {
        }
        RouterTestingModule_1 = RouterTestingModule;
        RouterTestingModule.withRoutes = function (routes, config) {
            return {
                ngModule: RouterTestingModule_1,
                providers: [
                    router.provideRoutes(routes),
                    { provide: router.ROUTER_CONFIGURATION, useValue: config ? config : {} },
                ]
            };
        };
        var RouterTestingModule_1;
        RouterTestingModule = RouterTestingModule_1 = __decorate([
            core.NgModule({
                exports: [router.RouterModule],
                providers: [
                    router.ɵROUTER_PROVIDERS, { provide: common.Location, useClass: testing.SpyLocation },
                    { provide: common.LocationStrategy, useClass: testing.MockLocationStrategy },
                    { provide: core.NgModuleFactoryLoader, useClass: SpyNgModuleFactoryLoader }, {
                        provide: router.Router,
                        useFactory: setupTestingRouter,
                        deps: [
                            router.UrlSerializer, router.ChildrenOutletContexts, common.Location, core.NgModuleFactoryLoader, core.Compiler, core.Injector,
                            router.ROUTES, router.ROUTER_CONFIGURATION, [router.UrlHandlingStrategy, new core.Optional()]
                        ]
                    },
                    { provide: router.PreloadingStrategy, useExisting: router.NoPreloading }, router.provideRoutes([])
                ]
            })
        ], RouterTestingModule);
        return RouterTestingModule;
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

    exports.SpyNgModuleFactoryLoader = SpyNgModuleFactoryLoader;
    exports.setupTestingRouter = setupTestingRouter;
    exports.RouterTestingModule = RouterTestingModule;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=router-testing.umd.js.map

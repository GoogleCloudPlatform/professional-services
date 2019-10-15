/**
 * @license Angular v7.0.4
 * (c) 2010-2018 Google, Inc. https://angular.io/
 * License: MIT
 */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/core'), require('@angular/core/testing'), require('@angular/platform-browser'), require('@angular/compiler'), require('@angular/compiler/testing'), require('@angular/platform-browser-dynamic'), require('@angular/platform-browser/testing')) :
    typeof define === 'function' && define.amd ? define('@angular/platform-browser-dynamic/testing', ['exports', '@angular/core', '@angular/core/testing', '@angular/platform-browser', '@angular/compiler', '@angular/compiler/testing', '@angular/platform-browser-dynamic', '@angular/platform-browser/testing'], factory) :
    (factory((global.ng = global.ng || {}, global.ng.platformBrowserDynamic = global.ng.platformBrowserDynamic || {}, global.ng.platformBrowserDynamic.testing = {}),global.ng.core,global.ng.core.testing,global.ng.platformBrowser,global.ng.compiler,global.ng.compiler.testing,global.ng.platformBrowserDynamic,global.ng.platformBrowser.testing));
}(this, (function (exports,core,testing,platformBrowser,compiler,testing$1,platformBrowserDynamic,testing$2) { 'use strict';

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

    function __param(paramIndex, decorator) {
        return function (target, key) { decorator(target, key, paramIndex); }
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
     * A DOM based implementation of the TestComponentRenderer.
     */
    var DOMTestComponentRenderer = /** @class */ (function (_super) {
        __extends(DOMTestComponentRenderer, _super);
        function DOMTestComponentRenderer(_doc) {
            var _this = _super.call(this) || this;
            _this._doc = _doc;
            return _this;
        }
        DOMTestComponentRenderer.prototype.insertRootElement = function (rootElId) {
            var rootEl = platformBrowser.ɵgetDOM().firstChild(platformBrowser.ɵgetDOM().content(platformBrowser.ɵgetDOM().createTemplate("<div id=\"" + rootElId + "\"></div>")));
            // TODO(juliemr): can/should this be optional?
            var oldRoots = platformBrowser.ɵgetDOM().querySelectorAll(this._doc, '[id^=root]');
            for (var i = 0; i < oldRoots.length; i++) {
                platformBrowser.ɵgetDOM().remove(oldRoots[i]);
            }
            platformBrowser.ɵgetDOM().appendChild(this._doc.body, rootEl);
        };
        DOMTestComponentRenderer = __decorate([
            core.Injectable(),
            __param(0, core.Inject(platformBrowser.DOCUMENT)),
            __metadata("design:paramtypes", [Object])
        ], DOMTestComponentRenderer);
        return DOMTestComponentRenderer;
    }(testing.TestComponentRenderer));

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
    var COMPILER_PROVIDERS = [
        { provide: testing$1.MockPipeResolver, deps: [compiler.CompileReflector] },
        { provide: compiler.PipeResolver, useExisting: testing$1.MockPipeResolver },
        { provide: testing$1.MockDirectiveResolver, deps: [compiler.CompileReflector] },
        { provide: compiler.DirectiveResolver, useExisting: testing$1.MockDirectiveResolver },
        { provide: testing$1.MockNgModuleResolver, deps: [compiler.CompileReflector] },
        { provide: compiler.NgModuleResolver, useExisting: testing$1.MockNgModuleResolver },
    ];
    var TestingCompilerFactoryImpl = /** @class */ (function () {
        function TestingCompilerFactoryImpl(_injector, _compilerFactory) {
            this._injector = _injector;
            this._compilerFactory = _compilerFactory;
        }
        TestingCompilerFactoryImpl.prototype.createTestingCompiler = function (options) {
            var compiler$$1 = this._compilerFactory.createCompiler(options);
            return new TestingCompilerImpl(compiler$$1, compiler$$1.injector.get(testing$1.MockDirectiveResolver), compiler$$1.injector.get(testing$1.MockPipeResolver), compiler$$1.injector.get(testing$1.MockNgModuleResolver));
        };
        return TestingCompilerFactoryImpl;
    }());
    var TestingCompilerImpl = /** @class */ (function () {
        function TestingCompilerImpl(_compiler, _directiveResolver, _pipeResolver, _moduleResolver) {
            this._compiler = _compiler;
            this._directiveResolver = _directiveResolver;
            this._pipeResolver = _pipeResolver;
            this._moduleResolver = _moduleResolver;
            this._overrider = new testing.ɵMetadataOverrider();
        }
        Object.defineProperty(TestingCompilerImpl.prototype, "injector", {
            get: function () { return this._compiler.injector; },
            enumerable: true,
            configurable: true
        });
        TestingCompilerImpl.prototype.compileModuleSync = function (moduleType) {
            return this._compiler.compileModuleSync(moduleType);
        };
        TestingCompilerImpl.prototype.compileModuleAsync = function (moduleType) {
            return this._compiler.compileModuleAsync(moduleType);
        };
        TestingCompilerImpl.prototype.compileModuleAndAllComponentsSync = function (moduleType) {
            return this._compiler.compileModuleAndAllComponentsSync(moduleType);
        };
        TestingCompilerImpl.prototype.compileModuleAndAllComponentsAsync = function (moduleType) {
            return this._compiler.compileModuleAndAllComponentsAsync(moduleType);
        };
        TestingCompilerImpl.prototype.getComponentFactory = function (component) {
            return this._compiler.getComponentFactory(component);
        };
        TestingCompilerImpl.prototype.checkOverrideAllowed = function (type) {
            if (this._compiler.hasAotSummary(type)) {
                throw new Error(core.ɵstringify(type) + " was AOT compiled, so its metadata cannot be changed.");
            }
        };
        TestingCompilerImpl.prototype.overrideModule = function (ngModule, override) {
            this.checkOverrideAllowed(ngModule);
            var oldMetadata = this._moduleResolver.resolve(ngModule, false);
            this._moduleResolver.setNgModule(ngModule, this._overrider.overrideMetadata(core.NgModule, oldMetadata, override));
            this.clearCacheFor(ngModule);
        };
        TestingCompilerImpl.prototype.overrideDirective = function (directive, override) {
            this.checkOverrideAllowed(directive);
            var oldMetadata = this._directiveResolver.resolve(directive, false);
            this._directiveResolver.setDirective(directive, this._overrider.overrideMetadata(core.Directive, oldMetadata, override));
            this.clearCacheFor(directive);
        };
        TestingCompilerImpl.prototype.overrideComponent = function (component, override) {
            this.checkOverrideAllowed(component);
            var oldMetadata = this._directiveResolver.resolve(component, false);
            this._directiveResolver.setDirective(component, this._overrider.overrideMetadata(core.Component, oldMetadata, override));
            this.clearCacheFor(component);
        };
        TestingCompilerImpl.prototype.overridePipe = function (pipe, override) {
            this.checkOverrideAllowed(pipe);
            var oldMetadata = this._pipeResolver.resolve(pipe, false);
            this._pipeResolver.setPipe(pipe, this._overrider.overrideMetadata(core.Pipe, oldMetadata, override));
            this.clearCacheFor(pipe);
        };
        TestingCompilerImpl.prototype.loadAotSummaries = function (summaries) { this._compiler.loadAotSummaries(summaries); };
        TestingCompilerImpl.prototype.clearCache = function () { this._compiler.clearCache(); };
        TestingCompilerImpl.prototype.clearCacheFor = function (type) { this._compiler.clearCacheFor(type); };
        TestingCompilerImpl.prototype.getComponentFromError = function (error) { return error[compiler.ERROR_COMPONENT_TYPE] || null; };
        TestingCompilerImpl.prototype.getModuleId = function (moduleType) {
            return this._moduleResolver.resolve(moduleType, true).id;
        };
        return TestingCompilerImpl;
    }());

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Platform for dynamic tests
     *
     * @publicApi
     */
    var platformCoreDynamicTesting = core.createPlatformFactory(platformBrowserDynamic.ɵplatformCoreDynamic, 'coreDynamicTesting', [
        { provide: core.COMPILER_OPTIONS, useValue: { providers: COMPILER_PROVIDERS }, multi: true }, {
            provide: testing.ɵTestingCompilerFactory,
            useClass: TestingCompilerFactoryImpl,
            deps: [core.Injector, core.CompilerFactory]
        }
    ]);

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
     * @publicApi
     */
    var platformBrowserDynamicTesting = core.createPlatformFactory(platformCoreDynamicTesting, 'browserDynamicTesting', platformBrowserDynamic.ɵINTERNAL_BROWSER_DYNAMIC_PLATFORM_PROVIDERS);
    /**
     * NgModule for testing.
     *
     * @publicApi
     */
    var BrowserDynamicTestingModule = /** @class */ (function () {
        function BrowserDynamicTestingModule() {
        }
        BrowserDynamicTestingModule = __decorate([
            core.NgModule({
                exports: [testing$2.BrowserTestingModule],
                providers: [
                    { provide: testing.TestComponentRenderer, useClass: DOMTestComponentRenderer },
                ]
            })
        ], BrowserDynamicTestingModule);
        return BrowserDynamicTestingModule;
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

    /**
     * Generated bundle index. Do not edit.
     */

    exports.ɵangular_packages_platform_browser_dynamic_testing_testing_a = COMPILER_PROVIDERS;
    exports.ɵangular_packages_platform_browser_dynamic_testing_testing_b = TestingCompilerFactoryImpl;
    exports.platformBrowserDynamicTesting = platformBrowserDynamicTesting;
    exports.BrowserDynamicTestingModule = BrowserDynamicTestingModule;
    exports.ɵDOMTestComponentRenderer = DOMTestComponentRenderer;
    exports.ɵplatformCoreDynamicTesting = platformCoreDynamicTesting;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=platform-browser-dynamic-testing.umd.js.map

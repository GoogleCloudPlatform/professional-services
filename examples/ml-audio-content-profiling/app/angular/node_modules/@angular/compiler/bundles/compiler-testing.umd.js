/**
 * @license Angular v7.0.4
 * (c) 2010-2018 Google, Inc. https://angular.io/
 * License: MIT
 */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/compiler')) :
    typeof define === 'function' && define.amd ? define('@angular/compiler/testing', ['exports', '@angular/compiler'], factory) :
    (factory((global.ng = global.ng || {}, global.ng.compiler = global.ng.compiler || {}, global.ng.compiler.testing = {}),global.ng.compiler));
}(this, (function (exports,compiler) { 'use strict';

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
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * A mock implementation of {@link ResourceLoader} that allows outgoing requests to be mocked
     * and responded to within a single test, without going to the network.
     */
    var MockResourceLoader = /** @class */ (function (_super) {
        __extends(MockResourceLoader, _super);
        function MockResourceLoader() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._expectations = [];
            _this._definitions = new Map();
            _this._requests = [];
            return _this;
        }
        MockResourceLoader.prototype.get = function (url) {
            var request = new _PendingRequest(url);
            this._requests.push(request);
            return request.getPromise();
        };
        MockResourceLoader.prototype.hasPendingRequests = function () { return !!this._requests.length; };
        /**
         * Add an expectation for the given URL. Incoming requests will be checked against
         * the next expectation (in FIFO order). The `verifyNoOutstandingExpectations` method
         * can be used to check if any expectations have not yet been met.
         *
         * The response given will be returned if the expectation matches.
         */
        MockResourceLoader.prototype.expect = function (url, response) {
            var expectation = new _Expectation(url, response);
            this._expectations.push(expectation);
        };
        /**
         * Add a definition for the given URL to return the given response. Unlike expectations,
         * definitions have no order and will satisfy any matching request at any time. Also
         * unlike expectations, unused definitions do not cause `verifyNoOutstandingExpectations`
         * to return an error.
         */
        MockResourceLoader.prototype.when = function (url, response) { this._definitions.set(url, response); };
        /**
         * Process pending requests and verify there are no outstanding expectations. Also fails
         * if no requests are pending.
         */
        MockResourceLoader.prototype.flush = function () {
            if (this._requests.length === 0) {
                throw new Error('No pending requests to flush');
            }
            do {
                this._processRequest(this._requests.shift());
            } while (this._requests.length > 0);
            this.verifyNoOutstandingExpectations();
        };
        /**
         * Throw an exception if any expectations have not been satisfied.
         */
        MockResourceLoader.prototype.verifyNoOutstandingExpectations = function () {
            if (this._expectations.length === 0)
                return;
            var urls = [];
            for (var i = 0; i < this._expectations.length; i++) {
                var expectation = this._expectations[i];
                urls.push(expectation.url);
            }
            throw new Error("Unsatisfied requests: " + urls.join(', '));
        };
        MockResourceLoader.prototype._processRequest = function (request) {
            var url = request.url;
            if (this._expectations.length > 0) {
                var expectation = this._expectations[0];
                if (expectation.url == url) {
                    remove(this._expectations, expectation);
                    request.complete(expectation.response);
                    return;
                }
            }
            if (this._definitions.has(url)) {
                var response = this._definitions.get(url);
                request.complete(response == null ? null : response);
                return;
            }
            throw new Error("Unexpected request " + url);
        };
        return MockResourceLoader;
    }(compiler.ResourceLoader));
    var _PendingRequest = /** @class */ (function () {
        function _PendingRequest(url) {
            var _this = this;
            this.url = url;
            this.promise = new Promise(function (res, rej) {
                _this.resolve = res;
                _this.reject = rej;
            });
        }
        _PendingRequest.prototype.complete = function (response) {
            if (response == null) {
                this.reject("Failed to load " + this.url);
            }
            else {
                this.resolve(response);
            }
        };
        _PendingRequest.prototype.getPromise = function () { return this.promise; };
        return _PendingRequest;
    }());
    var _Expectation = /** @class */ (function () {
        function _Expectation(url, response) {
            this.url = url;
            this.response = response;
        }
        return _Expectation;
    }());
    function remove(list, el) {
        var index = list.indexOf(el);
        if (index > -1) {
            list.splice(index, 1);
        }
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var MockSchemaRegistry = /** @class */ (function () {
        function MockSchemaRegistry(existingProperties, attrPropMapping, existingElements, invalidProperties, invalidAttributes) {
            this.existingProperties = existingProperties;
            this.attrPropMapping = attrPropMapping;
            this.existingElements = existingElements;
            this.invalidProperties = invalidProperties;
            this.invalidAttributes = invalidAttributes;
        }
        MockSchemaRegistry.prototype.hasProperty = function (tagName, property, schemas) {
            var value = this.existingProperties[property];
            return value === void 0 ? true : value;
        };
        MockSchemaRegistry.prototype.hasElement = function (tagName, schemaMetas) {
            var value = this.existingElements[tagName.toLowerCase()];
            return value === void 0 ? true : value;
        };
        MockSchemaRegistry.prototype.allKnownElementNames = function () { return Object.keys(this.existingElements); };
        MockSchemaRegistry.prototype.securityContext = function (selector, property, isAttribute) {
            return compiler.core.SecurityContext.NONE;
        };
        MockSchemaRegistry.prototype.getMappedPropName = function (attrName) { return this.attrPropMapping[attrName] || attrName; };
        MockSchemaRegistry.prototype.getDefaultComponentElementName = function () { return 'ng-component'; };
        MockSchemaRegistry.prototype.validateProperty = function (name) {
            if (this.invalidProperties.indexOf(name) > -1) {
                return { error: true, msg: "Binding to property '" + name + "' is disallowed for security reasons" };
            }
            else {
                return { error: false };
            }
        };
        MockSchemaRegistry.prototype.validateAttribute = function (name) {
            if (this.invalidAttributes.indexOf(name) > -1) {
                return {
                    error: true,
                    msg: "Binding to attribute '" + name + "' is disallowed for security reasons"
                };
            }
            else {
                return { error: false };
            }
        };
        MockSchemaRegistry.prototype.normalizeAnimationStyleProperty = function (propName) { return propName; };
        MockSchemaRegistry.prototype.normalizeAnimationStyleValue = function (camelCaseProp, userProvidedProp, val) {
            return { error: null, value: val.toString() };
        };
        return MockSchemaRegistry;
    }());

    /**
     * An implementation of {@link DirectiveResolver} that allows overriding
     * various properties of directives.
     */
    var MockDirectiveResolver = /** @class */ (function (_super) {
        __extends(MockDirectiveResolver, _super);
        function MockDirectiveResolver(reflector) {
            var _this = _super.call(this, reflector) || this;
            _this._directives = new Map();
            return _this;
        }
        MockDirectiveResolver.prototype.resolve = function (type, throwIfNotFound) {
            if (throwIfNotFound === void 0) { throwIfNotFound = true; }
            return this._directives.get(type) || _super.prototype.resolve.call(this, type, throwIfNotFound);
        };
        /**
         * Overrides the {@link core.Directive} for a directive.
         */
        MockDirectiveResolver.prototype.setDirective = function (type, metadata) {
            this._directives.set(type, metadata);
        };
        return MockDirectiveResolver;
    }(compiler.DirectiveResolver));

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var MockNgModuleResolver = /** @class */ (function (_super) {
        __extends(MockNgModuleResolver, _super);
        function MockNgModuleResolver(reflector) {
            var _this = _super.call(this, reflector) || this;
            _this._ngModules = new Map();
            return _this;
        }
        /**
         * Overrides the {@link NgModule} for a module.
         */
        MockNgModuleResolver.prototype.setNgModule = function (type, metadata) {
            this._ngModules.set(type, metadata);
        };
        /**
         * Returns the {@link NgModule} for a module:
         * - Set the {@link NgModule} to the overridden view when it exists or fallback to the
         * default
         * `NgModuleResolver`, see `setNgModule`.
         */
        MockNgModuleResolver.prototype.resolve = function (type, throwIfNotFound) {
            if (throwIfNotFound === void 0) { throwIfNotFound = true; }
            return this._ngModules.get(type) || _super.prototype.resolve.call(this, type, throwIfNotFound);
        };
        return MockNgModuleResolver;
    }(compiler.NgModuleResolver));

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var MockPipeResolver = /** @class */ (function (_super) {
        __extends(MockPipeResolver, _super);
        function MockPipeResolver(refector) {
            var _this = _super.call(this, refector) || this;
            _this._pipes = new Map();
            return _this;
        }
        /**
         * Overrides the {@link Pipe} for a pipe.
         */
        MockPipeResolver.prototype.setPipe = function (type, metadata) { this._pipes.set(type, metadata); };
        /**
         * Returns the {@link Pipe} for a pipe:
         * - Set the {@link Pipe} to the overridden view when it exists or fallback to the
         * default
         * `PipeResolver`, see `setPipe`.
         */
        MockPipeResolver.prototype.resolve = function (type, throwIfNotFound) {
            if (throwIfNotFound === void 0) { throwIfNotFound = true; }
            var metadata = this._pipes.get(type);
            if (!metadata) {
                metadata = _super.prototype.resolve.call(this, type, throwIfNotFound);
            }
            return metadata;
        };
        return MockPipeResolver;
    }(compiler.PipeResolver));

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

    exports.MockResourceLoader = MockResourceLoader;
    exports.MockSchemaRegistry = MockSchemaRegistry;
    exports.MockDirectiveResolver = MockDirectiveResolver;
    exports.MockNgModuleResolver = MockNgModuleResolver;
    exports.MockPipeResolver = MockPipeResolver;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=compiler-testing.umd.js.map

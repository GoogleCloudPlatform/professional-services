/**
 * @license Angular v7.0.4
 * (c) 2010-2018 Google, Inc. https://angular.io/
 * License: MIT
 */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('rxjs'), require('rxjs/operators')) :
    typeof define === 'function' && define.amd ? define('@angular/core', ['exports', 'rxjs', 'rxjs/operators'], factory) :
    (factory((global.ng = global.ng || {}, global.ng.core = {}),global.rxjs,global.rxjs.operators));
}(this, (function (exports,rxjs,operators) { 'use strict';

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

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

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
    function getClosureSafeProperty(objWithPropertyToExtract) {
        for (var key in objWithPropertyToExtract) {
            if (objWithPropertyToExtract[key] === getClosureSafeProperty) {
                return key;
            }
        }
        throw Error('Could not find renamed property on target object.');
    }
    /**
     * Sets properties on a target object from a source object, but only if
     * the property doesn't already exist on the target object.
     * @param target The target to set properties on
     * @param source The source of the property keys and values to set
     */
    function fillProperties(target, source) {
        for (var key in source) {
            if (source.hasOwnProperty(key) && !target.hasOwnProperty(key)) {
                target[key] = source[key];
            }
        }
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var NG_COMPONENT_DEF = getClosureSafeProperty({ ngComponentDef: getClosureSafeProperty });
    var NG_DIRECTIVE_DEF = getClosureSafeProperty({ ngDirectiveDef: getClosureSafeProperty });
    var NG_INJECTABLE_DEF = getClosureSafeProperty({ ngInjectableDef: getClosureSafeProperty });
    var NG_INJECTOR_DEF = getClosureSafeProperty({ ngInjectorDef: getClosureSafeProperty });
    var NG_PIPE_DEF = getClosureSafeProperty({ ngPipeDef: getClosureSafeProperty });
    var NG_MODULE_DEF = getClosureSafeProperty({ ngModuleDef: getClosureSafeProperty });
    var NG_BASE_DEF = getClosureSafeProperty({ ngBaseDef: getClosureSafeProperty });
    /**
     * If a directive is diPublic, bloomAdd sets a property on the type with this constant as
     * the key and the directive's unique ID as the value. This allows us to map directives to their
     * bloom filter bit for DI.
     */
    var NG_ELEMENT_ID = getClosureSafeProperty({ __NG_ELEMENT_ID__: getClosureSafeProperty });

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Construct an `InjectableDef` which defines how a token will be constructed by the DI system, and
     * in which injectors (if any) it will be available.
     *
     * This should be assigned to a static `ngInjectableDef` field on a type, which will then be an
     * `InjectableType`.
     *
     * Options:
     * * `providedIn` determines which injectors will include the injectable, by either associating it
     *   with an `@NgModule` or other `InjectorType`, or by specifying that this injectable should be
     *   provided in the `'root'` injector, which will be the application-level injector in most apps.
     * * `factory` gives the zero argument function which will create an instance of the injectable.
     *   The factory can call `inject` to access the `Injector` and request injection of dependencies.
     *
     * @publicApi
     */
    function defineInjectable(opts) {
        return {
            providedIn: opts.providedIn || null, factory: opts.factory, value: undefined,
        };
    }
    /**
     * Construct an `InjectorDef` which configures an injector.
     *
     * This should be assigned to a static `ngInjectorDef` field on a type, which will then be an
     * `InjectorType`.
     *
     * Options:
     *
     * * `factory`: an `InjectorType` is an instantiable type, so a zero argument `factory` function to
     *   create the type must be provided. If that factory function needs to inject arguments, it can
     *   use the `inject` function.
     * * `providers`: an optional array of providers to add to the injector. Each provider must
     *   either have a factory or point to a type which has an `ngInjectableDef` static property (the
     *   type must be an `InjectableType`).
     * * `imports`: an optional array of imports of other `InjectorType`s or `InjectorTypeWithModule`s
     *   whose providers will also be added to the injector. Locally provided types will override
     *   providers from imports.
     *
     * @publicApi
     */
    function defineInjector(options) {
        return {
            factory: options.factory, providers: options.providers || [], imports: options.imports || [],
        };
    }
    /**
     * Read the `ngInjectableDef` type in a way which is immune to accidentally reading inherited value.
     *
     * @param type type which may have `ngInjectableDef`
     */
    function getInjectableDef(type) {
        return type.hasOwnProperty(NG_INJECTABLE_DEF) ? type[NG_INJECTABLE_DEF] : null;
    }
    /**
     * Read the `ngInjectorDef` type in a way which is immune to accidentally reading inherited value.
     *
     * @param type type which may have `ngInjectorDef`
     */
    function getInjectorDef(type) {
        return type.hasOwnProperty(NG_INJECTOR_DEF) ? type[NG_INJECTOR_DEF] : null;
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Creates a token that can be used in a DI Provider.
     *
     * Use an `InjectionToken` whenever the type you are injecting is not reified (does not have a
     * runtime representation) such as when injecting an interface, callable type, array or
     * parametrized type.
     *
     * `InjectionToken` is parameterized on `T` which is the type of object which will be returned by
     * the `Injector`. This provides additional level of type safety.
     *
     * ```
     * interface MyInterface {...}
     * var myInterface = injector.get(new InjectionToken<MyInterface>('SomeToken'));
     * // myInterface is inferred to be MyInterface.
     * ```
     *
     * When creating an `InjectionToken`, you can optionally specify a factory function which returns
     * (possibly by creating) a default value of the parameterized type `T`. This sets up the
     * `InjectionToken` using this factory as a provider as if it was defined explicitly in the
     * application's root injector. If the factory function, which takes zero arguments, needs to inject
     * dependencies, it can do so using the `inject` function. See below for an example.
     *
     * Additionally, if a `factory` is specified you can also specify the `providedIn` option, which
     * overrides the above behavior and marks the token as belonging to a particular `@NgModule`. As
     * mentioned above, `'root'` is the default value for `providedIn`.
     *
     * @usageNotes
     * ### Basic Example
     *
     * ### Plain InjectionToken
     *
     * {@example core/di/ts/injector_spec.ts region='InjectionToken'}
     *
     * ### Tree-shakable InjectionToken
     *
     * {@example core/di/ts/injector_spec.ts region='ShakableInjectionToken'}
     *
     *
     * @publicApi
     */
    var InjectionToken = /** @class */ (function () {
        function InjectionToken(_desc, options) {
            this._desc = _desc;
            /** @internal */
            this.ngMetadataName = 'InjectionToken';
            if (options !== undefined) {
                this.ngInjectableDef = defineInjectable({
                    providedIn: options.providedIn || 'root',
                    factory: options.factory,
                });
            }
            else {
                this.ngInjectableDef = undefined;
            }
        }
        InjectionToken.prototype.toString = function () { return "InjectionToken " + this._desc; };
        return InjectionToken;
    }());

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var ANNOTATIONS = '__annotations__';
    var PARAMETERS = '__parameters__';
    var PROP_METADATA = '__prop__metadata__';
    /**
     * @suppress {globalThis}
     */
    function makeDecorator(name, props, parentClass, additionalProcessing, typeFn) {
        var metaCtor = makeMetadataCtor(props);
        function DecoratorFactory() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var _a;
            if (this instanceof DecoratorFactory) {
                metaCtor.call.apply(metaCtor, __spread([this], args));
                return this;
            }
            var annotationInstance = new ((_a = DecoratorFactory).bind.apply(_a, __spread([void 0], args)))();
            return function TypeDecorator(cls) {
                if (typeFn)
                    typeFn.apply(void 0, __spread([cls], args));
                // Use of Object.defineProperty is important since it creates non-enumerable property which
                // prevents the property is copied during subclassing.
                var annotations = cls.hasOwnProperty(ANNOTATIONS) ?
                    cls[ANNOTATIONS] :
                    Object.defineProperty(cls, ANNOTATIONS, { value: [] })[ANNOTATIONS];
                annotations.push(annotationInstance);
                if (additionalProcessing)
                    additionalProcessing(cls);
                return cls;
            };
        }
        if (parentClass) {
            DecoratorFactory.prototype = Object.create(parentClass.prototype);
        }
        DecoratorFactory.prototype.ngMetadataName = name;
        DecoratorFactory.annotationCls = DecoratorFactory;
        return DecoratorFactory;
    }
    function makeMetadataCtor(props) {
        return function ctor() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            if (props) {
                var values = props.apply(void 0, __spread(args));
                for (var propName in values) {
                    this[propName] = values[propName];
                }
            }
        };
    }
    function makeParamDecorator(name, props, parentClass) {
        var metaCtor = makeMetadataCtor(props);
        function ParamDecoratorFactory() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var _a;
            if (this instanceof ParamDecoratorFactory) {
                metaCtor.apply(this, args);
                return this;
            }
            var annotationInstance = new ((_a = ParamDecoratorFactory).bind.apply(_a, __spread([void 0], args)))();
            ParamDecorator.annotation = annotationInstance;
            return ParamDecorator;
            function ParamDecorator(cls, unusedKey, index) {
                // Use of Object.defineProperty is important since it creates non-enumerable property which
                // prevents the property is copied during subclassing.
                var parameters = cls.hasOwnProperty(PARAMETERS) ?
                    cls[PARAMETERS] :
                    Object.defineProperty(cls, PARAMETERS, { value: [] })[PARAMETERS];
                // there might be gaps if some in between parameters do not have annotations.
                // we pad with nulls.
                while (parameters.length <= index) {
                    parameters.push(null);
                }
                (parameters[index] = parameters[index] || []).push(annotationInstance);
                return cls;
            }
        }
        if (parentClass) {
            ParamDecoratorFactory.prototype = Object.create(parentClass.prototype);
        }
        ParamDecoratorFactory.prototype.ngMetadataName = name;
        ParamDecoratorFactory.annotationCls = ParamDecoratorFactory;
        return ParamDecoratorFactory;
    }
    function makePropDecorator(name, props, parentClass, additionalProcessing) {
        var metaCtor = makeMetadataCtor(props);
        function PropDecoratorFactory() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var _a;
            if (this instanceof PropDecoratorFactory) {
                metaCtor.apply(this, args);
                return this;
            }
            var decoratorInstance = new ((_a = PropDecoratorFactory).bind.apply(_a, __spread([void 0], args)))();
            function PropDecorator(target, name) {
                var constructor = target.constructor;
                // Use of Object.defineProperty is important since it creates non-enumerable property which
                // prevents the property is copied during subclassing.
                var meta = constructor.hasOwnProperty(PROP_METADATA) ?
                    constructor[PROP_METADATA] :
                    Object.defineProperty(constructor, PROP_METADATA, { value: {} })[PROP_METADATA];
                meta[name] = meta.hasOwnProperty(name) && meta[name] || [];
                meta[name].unshift(decoratorInstance);
                if (additionalProcessing)
                    additionalProcessing.apply(void 0, __spread([target, name], args));
            }
            return PropDecorator;
        }
        if (parentClass) {
            PropDecoratorFactory.prototype = Object.create(parentClass.prototype);
        }
        PropDecoratorFactory.prototype.ngMetadataName = name;
        PropDecoratorFactory.annotationCls = PropDecoratorFactory;
        return PropDecoratorFactory;
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * This token can be used to create a virtual provider that will populate the
     * `entryComponents` fields of components and ng modules based on its `useValue`.
     * All components that are referenced in the `useValue` value (either directly
     * or in a nested array or map) will be added to the `entryComponents` property.
     *
     * @usageNotes
     * ### Example
     * The following example shows how the router can populate the `entryComponents`
     * field of an NgModule based on the router configuration which refers
     * to components.
     *
     * ```typescript
     * // helper function inside the router
     * function provideRoutes(routes) {
     *   return [
     *     {provide: ROUTES, useValue: routes},
     *     {provide: ANALYZE_FOR_ENTRY_COMPONENTS, useValue: routes, multi: true}
     *   ];
     * }
     *
     * // user code
     * let routes = [
     *   {path: '/root', component: RootComp},
     *   {path: '/teams', component: TeamsComp}
     * ];
     *
     * @NgModule({
     *   providers: [provideRoutes(routes)]
     * })
     * class ModuleWithRoutes {}
     * ```
     *
     * @publicApi
     */
    var ANALYZE_FOR_ENTRY_COMPONENTS = new InjectionToken('AnalyzeForEntryComponents');
    /**
     * Attribute decorator and metadata.
     *
     * @Annotation
     * @publicApi
     */
    var Attribute = makeParamDecorator('Attribute', function (attributeName) { return ({ attributeName: attributeName }); });
    /**
     * Base class for query metadata.
     *
     * @see `ContentChildren`.
     * @see `ContentChild`.
     * @see `ViewChildren`.
     * @see `ViewChild`.
     *
     * @publicApi
     */
    var Query = /** @class */ (function () {
        function Query() {
        }
        return Query;
    }());
    /**
     * ContentChildren decorator and metadata.
     *
     *
     * @Annotation
     * @publicApi
     */
    var ContentChildren = makePropDecorator('ContentChildren', function (selector, data) {
        if (data === void 0) { data = {}; }
        return (__assign({ selector: selector, first: false, isViewQuery: false, descendants: false }, data));
    }, Query);
    /**
     * ContentChild decorator and metadata.
     *
     *
     * @Annotation
     * @publicApi
     */
    var ContentChild = makePropDecorator('ContentChild', function (selector, data) {
        if (data === void 0) { data = {}; }
        return (__assign({ selector: selector, first: true, isViewQuery: false, descendants: true }, data));
    }, Query);
    /**
     * ViewChildren decorator and metadata.
     *
     * @Annotation
     * @publicApi
     */
    var ViewChildren = makePropDecorator('ViewChildren', function (selector, data) {
        if (data === void 0) { data = {}; }
        return (__assign({ selector: selector, first: false, isViewQuery: true, descendants: true }, data));
    }, Query);
    /**
     * ViewChild decorator and metadata.
     *
     * @Annotation
     * @publicApi
     */
    var ViewChild = makePropDecorator('ViewChild', function (selector, data) {
        return (__assign({ selector: selector, first: true, isViewQuery: true, descendants: true }, data));
    }, Query);

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    (function (ChangeDetectionStrategy) {
        /**
         * Use the `CheckOnce` strategy, meaning that automatic change detection is deactivated
         * until reactivated by setting the strategy to `Default` (`CheckAlways`).
         * Change detection can still be explictly invoked.
         */
        ChangeDetectionStrategy[ChangeDetectionStrategy["OnPush"] = 0] = "OnPush";
        /**
         * Use the default `CheckAlways` strategy, in which change detection is automatic until
         * explicitly deactivated.
         */
        ChangeDetectionStrategy[ChangeDetectionStrategy["Default"] = 1] = "Default";
    })(exports.ChangeDetectionStrategy || (exports.ChangeDetectionStrategy = {}));
    (function (ChangeDetectorStatus) {
        /**
         * A state in which, after calling `detectChanges()`, the change detector
         * state becomes `Checked`, and must be explicitly invoked or reactivated.
         */
        ChangeDetectorStatus[ChangeDetectorStatus["CheckOnce"] = 0] = "CheckOnce";
        /**
         * A state in which change detection is skipped until the change detector mode
         * becomes `CheckOnce`.
         */
        ChangeDetectorStatus[ChangeDetectorStatus["Checked"] = 1] = "Checked";
        /**
         * A state in which change detection continues automatically until explictly
         * deactivated.
         */
        ChangeDetectorStatus[ChangeDetectorStatus["CheckAlways"] = 2] = "CheckAlways";
        /**
         * A state in which a change detector sub tree is not a part of the main tree and
         * should be skipped.
         */
        ChangeDetectorStatus[ChangeDetectorStatus["Detached"] = 3] = "Detached";
        /**
         * Indicates that the change detector encountered an error checking a binding
         * or calling a directive lifecycle method and is now in an inconsistent state. Change
         * detectors in this state do not detect changes.
         */
        ChangeDetectorStatus[ChangeDetectorStatus["Errored"] = 4] = "Errored";
        /**
         * Indicates that the change detector has been destroyed.
         */
        ChangeDetectorStatus[ChangeDetectorStatus["Destroyed"] = 5] = "Destroyed";
    })(exports.ɵChangeDetectorStatus || (exports.ɵChangeDetectorStatus = {}));
    /**
     * Reports whether a given strategy is currently the default for change detection.
     * @param changeDetectionStrategy The strategy to check.
     * @returns True if the given strategy is the current default, false otherwise.
     * @see `ChangeDetectorStatus`
     * @see `ChangeDetectorRef`
     */
    function isDefaultChangeDetectionStrategy(changeDetectionStrategy) {
        return changeDetectionStrategy == null ||
            changeDetectionStrategy === exports.ChangeDetectionStrategy.Default;
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var __window = typeof window !== 'undefined' && window;
    var __self = typeof self !== 'undefined' && typeof WorkerGlobalScope !== 'undefined' &&
        self instanceof WorkerGlobalScope && self;
    var __global = typeof global !== 'undefined' && global;
    // Check __global first, because in Node tests both __global and __window may be defined and _global
    // should be __global in that case.
    var _global = __global || __window || __self;
    var promise = Promise.resolve(0);
    var _symbolIterator = null;
    function getSymbolIterator() {
        if (!_symbolIterator) {
            var Symbol_1 = _global['Symbol'];
            if (Symbol_1 && Symbol_1.iterator) {
                _symbolIterator = Symbol_1.iterator;
            }
            else {
                // es6-shim specific logic
                var keys = Object.getOwnPropertyNames(Map.prototype);
                for (var i = 0; i < keys.length; ++i) {
                    var key = keys[i];
                    if (key !== 'entries' && key !== 'size' &&
                        Map.prototype[key] === Map.prototype['entries']) {
                        _symbolIterator = key;
                    }
                }
            }
        }
        return _symbolIterator;
    }
    function scheduleMicroTask(fn) {
        if (typeof Zone === 'undefined') {
            // use promise to schedule microTask instead of use Zone
            promise.then(function () { fn && fn.apply(null, null); });
        }
        else {
            Zone.current.scheduleMicroTask('scheduleMicrotask', fn);
        }
    }
    // JS has NaN !== NaN
    function looseIdentical(a, b) {
        return a === b || typeof a === 'number' && typeof b === 'number' && isNaN(a) && isNaN(b);
    }
    function stringify(token) {
        if (typeof token === 'string') {
            return token;
        }
        if (token instanceof Array) {
            return '[' + token.map(stringify).join(', ') + ']';
        }
        if (token == null) {
            return '' + token;
        }
        if (token.overriddenName) {
            return "" + token.overriddenName;
        }
        if (token.name) {
            return "" + token.name;
        }
        var res = token.toString();
        if (res == null) {
            return '' + res;
        }
        var newLineIndex = res.indexOf('\n');
        return newLineIndex === -1 ? res : res.substring(0, newLineIndex);
    }
    /**
     * Convince closure compiler that the wrapped function has no side-effects.
     *
     * Closure compiler always assumes that `toString` has no side-effects. We use this quirk to
     * allow us to execute a function but have closure compiler mark the call as no-side-effects.
     * It is important that the return value for the `noSideEffects` function be assigned
     * to something which is retained otherwise the call to `noSideEffects` will be removed by closure
     * compiler.
     */
    function noSideEffects(fn) {
        return '' + { toString: fn };
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Allows to refer to references which are not yet defined.
     *
     * For instance, `forwardRef` is used when the `token` which we need to refer to for the purposes of
     * DI is declared, but not yet defined. It is also used when the `token` which we use when creating
     * a query is not yet defined.
     *
     * @usageNotes
     * ### Example
     * {@example core/di/ts/forward_ref/forward_ref_spec.ts region='forward_ref'}
     * @publicApi
     */
    function forwardRef(forwardRefFn) {
        forwardRefFn.__forward_ref__ = forwardRef;
        forwardRefFn.toString = function () { return stringify(this()); };
        return forwardRefFn;
    }
    /**
     * Lazily retrieves the reference value from a forwardRef.
     *
     * Acts as the identity function when given a non-forward-ref value.
     *
     * @usageNotes
     * ### Example
     *
     * {@example core/di/ts/forward_ref/forward_ref_spec.ts region='resolve_forward_ref'}
     *
     * @see `forwardRef`
     * @publicApi
     */
    function resolveForwardRef(type) {
        if (typeof type === 'function' && type.hasOwnProperty('__forward_ref__') &&
            type.__forward_ref__ === forwardRef) {
            return type();
        }
        else {
            return type;
        }
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Inject decorator and metadata.
     *
     * @Annotation
     * @publicApi
     */
    var Inject = makeParamDecorator('Inject', function (token) { return ({ token: token }); });
    /**
     * Optional decorator and metadata.
     *
     * @Annotation
     * @publicApi
     */
    var Optional = makeParamDecorator('Optional');
    /**
     * Self decorator and metadata.
     *
     * @Annotation
     * @publicApi
     */
    var Self = makeParamDecorator('Self');
    /**
     * SkipSelf decorator and metadata.
     *
     * @Annotation
     * @publicApi
     */
    var SkipSelf = makeParamDecorator('SkipSelf');
    /**
     * Host decorator and metadata.
     *
     * @Annotation
     * @publicApi
     */
    var Host = makeParamDecorator('Host');

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var SOURCE = '__source';
    var _THROW_IF_NOT_FOUND = new Object();
    var THROW_IF_NOT_FOUND = _THROW_IF_NOT_FOUND;
    /**
     * An InjectionToken that gets the current `Injector` for `createInjector()`-style injectors.
     *
     * Requesting this token instead of `Injector` allows `StaticInjector` to be tree-shaken from a
     * project.
     *
     * @publicApi
     */
    var INJECTOR = new InjectionToken('INJECTOR');
    var NullInjector = /** @class */ (function () {
        function NullInjector() {
        }
        NullInjector.prototype.get = function (token, notFoundValue) {
            if (notFoundValue === void 0) { notFoundValue = _THROW_IF_NOT_FOUND; }
            if (notFoundValue === _THROW_IF_NOT_FOUND) {
                // Intentionally left behind: With dev tools open the debugger will stop here. There is no
                // reason why correctly written application should cause this exception.
                // TODO(misko): uncomment the next line once `ngDevMode` works with closure.
                // if(ngDevMode) debugger;
                throw new Error("NullInjectorError: No provider for " + stringify(token) + "!");
            }
            return notFoundValue;
        };
        return NullInjector;
    }());
    /**
     * Concrete injectors implement this interface.
     *
     * For more details, see the ["Dependency Injection Guide"](guide/dependency-injection).
     *
     * @usageNotes
     * ### Example
     *
     * {@example core/di/ts/injector_spec.ts region='Injector'}
     *
     * `Injector` returns itself when given `Injector` as a token:
     *
     * {@example core/di/ts/injector_spec.ts region='injectInjector'}
     *
     * @publicApi
     */
    var Injector = /** @class */ (function () {
        function Injector() {
        }
        /**
         * Create a new Injector which is configure using `StaticProvider`s.
         *
         * @usageNotes
         * ### Example
         *
         * {@example core/di/ts/provider_spec.ts region='ConstructorProvider'}
         */
        Injector.create = function (options, parent) {
            if (Array.isArray(options)) {
                return new StaticInjector(options, parent);
            }
            else {
                return new StaticInjector(options.providers, options.parent, options.name || null);
            }
        };
        Injector.THROW_IF_NOT_FOUND = _THROW_IF_NOT_FOUND;
        Injector.NULL = new NullInjector();
        Injector.ngInjectableDef = defineInjectable({
            providedIn: 'any',
            factory: function () { return inject(INJECTOR); },
        });
        return Injector;
    }());
    var IDENT = function (value) {
        return value;
    };
    var EMPTY = [];
    var CIRCULAR = IDENT;
    var MULTI_PROVIDER_FN = function () {
        return Array.prototype.slice.call(arguments);
    };
    var USE_VALUE = getClosureSafeProperty({ provide: String, useValue: getClosureSafeProperty });
    var NG_TOKEN_PATH = 'ngTokenPath';
    var NG_TEMP_TOKEN_PATH = 'ngTempTokenPath';
    var NULL_INJECTOR = Injector.NULL;
    var NEW_LINE = /\n/gm;
    var NO_NEW_LINE = 'ɵ';
    var StaticInjector = /** @class */ (function () {
        function StaticInjector(providers, parent, source) {
            if (parent === void 0) { parent = NULL_INJECTOR; }
            if (source === void 0) { source = null; }
            this.parent = parent;
            this.source = source;
            var records = this._records = new Map();
            records.set(Injector, { token: Injector, fn: IDENT, deps: EMPTY, value: this, useNew: false });
            records.set(INJECTOR, { token: INJECTOR, fn: IDENT, deps: EMPTY, value: this, useNew: false });
            recursivelyProcessProviders(records, providers);
        }
        StaticInjector.prototype.get = function (token, notFoundValue, flags) {
            if (flags === void 0) { flags = 0 /* Default */; }
            var record = this._records.get(token);
            try {
                return tryResolveToken(token, record, this._records, this.parent, notFoundValue, flags);
            }
            catch (e) {
                var tokenPath = e[NG_TEMP_TOKEN_PATH];
                if (token[SOURCE]) {
                    tokenPath.unshift(token[SOURCE]);
                }
                e.message = formatError('\n' + e.message, tokenPath, this.source);
                e[NG_TOKEN_PATH] = tokenPath;
                e[NG_TEMP_TOKEN_PATH] = null;
                throw e;
            }
        };
        StaticInjector.prototype.toString = function () {
            var tokens = [], records = this._records;
            records.forEach(function (v, token) { return tokens.push(stringify(token)); });
            return "StaticInjector[" + tokens.join(', ') + "]";
        };
        return StaticInjector;
    }());
    function resolveProvider(provider) {
        var deps = computeDeps(provider);
        var fn = IDENT;
        var value = EMPTY;
        var useNew = false;
        var provide = resolveForwardRef(provider.provide);
        if (USE_VALUE in provider) {
            // We need to use USE_VALUE in provider since provider.useValue could be defined as undefined.
            value = provider.useValue;
        }
        else if (provider.useFactory) {
            fn = provider.useFactory;
        }
        else if (provider.useExisting) ;
        else if (provider.useClass) {
            useNew = true;
            fn = resolveForwardRef(provider.useClass);
        }
        else if (typeof provide == 'function') {
            useNew = true;
            fn = provide;
        }
        else {
            throw staticError('StaticProvider does not have [useValue|useFactory|useExisting|useClass] or [provide] is not newable', provider);
        }
        return { deps: deps, fn: fn, useNew: useNew, value: value };
    }
    function multiProviderMixError(token) {
        return staticError('Cannot mix multi providers and regular providers', token);
    }
    function recursivelyProcessProviders(records, provider) {
        if (provider) {
            provider = resolveForwardRef(provider);
            if (provider instanceof Array) {
                // if we have an array recurse into the array
                for (var i = 0; i < provider.length; i++) {
                    recursivelyProcessProviders(records, provider[i]);
                }
            }
            else if (typeof provider === 'function') {
                // Functions were supported in ReflectiveInjector, but are not here. For safety give useful
                // error messages
                throw staticError('Function/Class not supported', provider);
            }
            else if (provider && typeof provider === 'object' && provider.provide) {
                // At this point we have what looks like a provider: {provide: ?, ....}
                var token = resolveForwardRef(provider.provide);
                var resolvedProvider = resolveProvider(provider);
                if (provider.multi === true) {
                    // This is a multi provider.
                    var multiProvider = records.get(token);
                    if (multiProvider) {
                        if (multiProvider.fn !== MULTI_PROVIDER_FN) {
                            throw multiProviderMixError(token);
                        }
                    }
                    else {
                        // Create a placeholder factory which will look up the constituents of the multi provider.
                        records.set(token, multiProvider = {
                            token: provider.provide,
                            deps: [],
                            useNew: false,
                            fn: MULTI_PROVIDER_FN,
                            value: EMPTY
                        });
                    }
                    // Treat the provider as the token.
                    token = provider;
                    multiProvider.deps.push({ token: token, options: 6 /* Default */ });
                }
                var record = records.get(token);
                if (record && record.fn == MULTI_PROVIDER_FN) {
                    throw multiProviderMixError(token);
                }
                records.set(token, resolvedProvider);
            }
            else {
                throw staticError('Unexpected provider', provider);
            }
        }
    }
    function tryResolveToken(token, record, records, parent, notFoundValue, flags) {
        try {
            return resolveToken(token, record, records, parent, notFoundValue, flags);
        }
        catch (e) {
            // ensure that 'e' is of type Error.
            if (!(e instanceof Error)) {
                e = new Error(e);
            }
            var path = e[NG_TEMP_TOKEN_PATH] = e[NG_TEMP_TOKEN_PATH] || [];
            path.unshift(token);
            if (record && record.value == CIRCULAR) {
                // Reset the Circular flag.
                record.value = EMPTY;
            }
            throw e;
        }
    }
    function resolveToken(token, record, records, parent, notFoundValue, flags) {
        var _a;
        var value;
        if (record && !(flags & 4 /* SkipSelf */)) {
            // If we don't have a record, this implies that we don't own the provider hence don't know how
            // to resolve it.
            value = record.value;
            if (value == CIRCULAR) {
                throw Error(NO_NEW_LINE + 'Circular dependency');
            }
            else if (value === EMPTY) {
                record.value = CIRCULAR;
                var obj = undefined;
                var useNew = record.useNew;
                var fn = record.fn;
                var depRecords = record.deps;
                var deps = EMPTY;
                if (depRecords.length) {
                    deps = [];
                    for (var i = 0; i < depRecords.length; i++) {
                        var depRecord = depRecords[i];
                        var options = depRecord.options;
                        var childRecord = options & 2 /* CheckSelf */ ? records.get(depRecord.token) : undefined;
                        deps.push(tryResolveToken(
                        // Current Token to resolve
                        depRecord.token, 
                        // A record which describes how to resolve the token.
                        // If undefined, this means we don't have such a record
                        childRecord, 
                        // Other records we know about.
                        records, 
                        // If we don't know how to resolve dependency and we should not check parent for it,
                        // than pass in Null injector.
                        !childRecord && !(options & 4 /* CheckParent */) ? NULL_INJECTOR : parent, options & 1 /* Optional */ ? null : Injector.THROW_IF_NOT_FOUND, 0 /* Default */));
                    }
                }
                record.value = value = useNew ? new ((_a = fn).bind.apply(_a, __spread([void 0], deps)))() : fn.apply(obj, deps);
            }
        }
        else if (!(flags & 2 /* Self */)) {
            value = parent.get(token, notFoundValue, 0 /* Default */);
        }
        return value;
    }
    function computeDeps(provider) {
        var deps = EMPTY;
        var providerDeps = provider.deps;
        if (providerDeps && providerDeps.length) {
            deps = [];
            for (var i = 0; i < providerDeps.length; i++) {
                var options = 6 /* Default */;
                var token = resolveForwardRef(providerDeps[i]);
                if (token instanceof Array) {
                    for (var j = 0, annotations = token; j < annotations.length; j++) {
                        var annotation = annotations[j];
                        if (annotation instanceof Optional || annotation == Optional) {
                            options = options | 1 /* Optional */;
                        }
                        else if (annotation instanceof SkipSelf || annotation == SkipSelf) {
                            options = options & ~2 /* CheckSelf */;
                        }
                        else if (annotation instanceof Self || annotation == Self) {
                            options = options & ~4 /* CheckParent */;
                        }
                        else if (annotation instanceof Inject) {
                            token = annotation.token;
                        }
                        else {
                            token = resolveForwardRef(annotation);
                        }
                    }
                }
                deps.push({ token: token, options: options });
            }
        }
        else if (provider.useExisting) {
            var token = resolveForwardRef(provider.useExisting);
            deps = [{ token: token, options: 6 /* Default */ }];
        }
        else if (!providerDeps && !(USE_VALUE in provider)) {
            // useValue & useExisting are the only ones which are exempt from deps all others need it.
            throw staticError('\'deps\' required', provider);
        }
        return deps;
    }
    function formatError(text, obj, source) {
        if (source === void 0) { source = null; }
        text = text && text.charAt(0) === '\n' && text.charAt(1) == NO_NEW_LINE ? text.substr(2) : text;
        var context = stringify(obj);
        if (obj instanceof Array) {
            context = obj.map(stringify).join(' -> ');
        }
        else if (typeof obj === 'object') {
            var parts = [];
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    var value = obj[key];
                    parts.push(key + ':' + (typeof value === 'string' ? JSON.stringify(value) : stringify(value)));
                }
            }
            context = "{" + parts.join(', ') + "}";
        }
        return "StaticInjectorError" + (source ? '(' + source + ')' : '') + "[" + context + "]: " + text.replace(NEW_LINE, '\n  ');
    }
    function staticError(text, obj) {
        return new Error(formatError(text, obj));
    }
    /**
     * Current injector value used by `inject`.
     * - `undefined`: it is an error to call `inject`
     * - `null`: `inject` can be called but there is no injector (limp-mode).
     * - Injector instance: Use the injector for resolution.
     */
    var _currentInjector = undefined;
    function setCurrentInjector(injector) {
        var former = _currentInjector;
        _currentInjector = injector;
        return former;
    }
    function inject(token, flags) {
        if (flags === void 0) { flags = 0 /* Default */; }
        if (_currentInjector === undefined) {
            throw new Error("inject() must be called from an injection context");
        }
        else if (_currentInjector === null) {
            var injectableDef = getInjectableDef(token);
            if (injectableDef && injectableDef.providedIn == 'root') {
                return injectableDef.value === undefined ? injectableDef.value = injectableDef.factory() :
                    injectableDef.value;
            }
            if (flags & 8 /* Optional */)
                return null;
            throw new Error("Injector: NOT_FOUND [" + stringify(token) + "]");
        }
        else {
            return _currentInjector.get(token, flags & 8 /* Optional */ ? null : undefined, flags);
        }
    }
    function injectArgs(types) {
        var args = [];
        for (var i = 0; i < types.length; i++) {
            var arg = types[i];
            if (Array.isArray(arg)) {
                if (arg.length === 0) {
                    throw new Error('Arguments array must have arguments.');
                }
                var type = undefined;
                var flags = 0 /* Default */;
                for (var j = 0; j < arg.length; j++) {
                    var meta = arg[j];
                    if (meta instanceof Optional || meta.ngMetadataName === 'Optional') {
                        flags |= 8 /* Optional */;
                    }
                    else if (meta instanceof SkipSelf || meta.ngMetadataName === 'SkipSelf') {
                        flags |= 4 /* SkipSelf */;
                    }
                    else if (meta instanceof Self || meta.ngMetadataName === 'Self') {
                        flags |= 2 /* Self */;
                    }
                    else if (meta instanceof Inject) {
                        type = meta.token;
                    }
                    else {
                        type = meta;
                    }
                }
                args.push(inject(type, flags));
            }
            else {
                args.push(inject(arg));
            }
        }
        return args;
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
     * Represents a type that a Component or other object is instances of.
     *
     * An example of a `Type` is `MyCustomComponent` class, which in JavaScript is be represented by
     * the `MyCustomComponent` constructor function.
     *
     * @publicApi
     */
    var Type = Function;
    function isType(v) {
        return typeof v === 'function';
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Attention: These regex has to hold even if the code is minified!
     */
    var DELEGATE_CTOR = /^function\s+\S+\(\)\s*{[\s\S]+\.apply\(this,\s*arguments\)/;
    var INHERITED_CLASS = /^class\s+[A-Za-z\d$_]*\s*extends\s+[^{]+{/;
    var INHERITED_CLASS_WITH_CTOR = /^class\s+[A-Za-z\d$_]*\s*extends\s+[^{]+{[\s\S]*constructor\s*\(/;
    var ReflectionCapabilities = /** @class */ (function () {
        function ReflectionCapabilities(reflect) {
            this._reflect = reflect || _global['Reflect'];
        }
        ReflectionCapabilities.prototype.isReflectionEnabled = function () { return true; };
        ReflectionCapabilities.prototype.factory = function (t) { return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return new (t.bind.apply(t, __spread([void 0], args)))();
        }; };
        /** @internal */
        ReflectionCapabilities.prototype._zipTypesAndAnnotations = function (paramTypes, paramAnnotations) {
            var result;
            if (typeof paramTypes === 'undefined') {
                result = new Array(paramAnnotations.length);
            }
            else {
                result = new Array(paramTypes.length);
            }
            for (var i = 0; i < result.length; i++) {
                // TS outputs Object for parameters without types, while Traceur omits
                // the annotations. For now we preserve the Traceur behavior to aid
                // migration, but this can be revisited.
                if (typeof paramTypes === 'undefined') {
                    result[i] = [];
                }
                else if (paramTypes[i] != Object) {
                    result[i] = [paramTypes[i]];
                }
                else {
                    result[i] = [];
                }
                if (paramAnnotations && paramAnnotations[i] != null) {
                    result[i] = result[i].concat(paramAnnotations[i]);
                }
            }
            return result;
        };
        ReflectionCapabilities.prototype._ownParameters = function (type, parentCtor) {
            var typeStr = type.toString();
            // If we have no decorators, we only have function.length as metadata.
            // In that case, to detect whether a child class declared an own constructor or not,
            // we need to look inside of that constructor to check whether it is
            // just calling the parent.
            // This also helps to work around for https://github.com/Microsoft/TypeScript/issues/12439
            // that sets 'design:paramtypes' to []
            // if a class inherits from another class but has no ctor declared itself.
            if (DELEGATE_CTOR.exec(typeStr) ||
                (INHERITED_CLASS.exec(typeStr) && !INHERITED_CLASS_WITH_CTOR.exec(typeStr))) {
                return null;
            }
            // Prefer the direct API.
            if (type.parameters && type.parameters !== parentCtor.parameters) {
                return type.parameters;
            }
            // API of tsickle for lowering decorators to properties on the class.
            var tsickleCtorParams = type.ctorParameters;
            if (tsickleCtorParams && tsickleCtorParams !== parentCtor.ctorParameters) {
                // Newer tsickle uses a function closure
                // Retain the non-function case for compatibility with older tsickle
                var ctorParameters = typeof tsickleCtorParams === 'function' ? tsickleCtorParams() : tsickleCtorParams;
                var paramTypes_1 = ctorParameters.map(function (ctorParam) { return ctorParam && ctorParam.type; });
                var paramAnnotations_1 = ctorParameters.map(function (ctorParam) {
                    return ctorParam && convertTsickleDecoratorIntoMetadata(ctorParam.decorators);
                });
                return this._zipTypesAndAnnotations(paramTypes_1, paramAnnotations_1);
            }
            // API for metadata created by invoking the decorators.
            var paramAnnotations = type.hasOwnProperty(PARAMETERS) && type[PARAMETERS];
            var paramTypes = this._reflect && this._reflect.getOwnMetadata &&
                this._reflect.getOwnMetadata('design:paramtypes', type);
            if (paramTypes || paramAnnotations) {
                return this._zipTypesAndAnnotations(paramTypes, paramAnnotations);
            }
            // If a class has no decorators, at least create metadata
            // based on function.length.
            // Note: We know that this is a real constructor as we checked
            // the content of the constructor above.
            return new Array(type.length).fill(undefined);
        };
        ReflectionCapabilities.prototype.parameters = function (type) {
            // Note: only report metadata if we have at least one class decorator
            // to stay in sync with the static reflector.
            if (!isType(type)) {
                return [];
            }
            var parentCtor = getParentCtor(type);
            var parameters = this._ownParameters(type, parentCtor);
            if (!parameters && parentCtor !== Object) {
                parameters = this.parameters(parentCtor);
            }
            return parameters || [];
        };
        ReflectionCapabilities.prototype._ownAnnotations = function (typeOrFunc, parentCtor) {
            // Prefer the direct API.
            if (typeOrFunc.annotations && typeOrFunc.annotations !== parentCtor.annotations) {
                var annotations = typeOrFunc.annotations;
                if (typeof annotations === 'function' && annotations.annotations) {
                    annotations = annotations.annotations;
                }
                return annotations;
            }
            // API of tsickle for lowering decorators to properties on the class.
            if (typeOrFunc.decorators && typeOrFunc.decorators !== parentCtor.decorators) {
                return convertTsickleDecoratorIntoMetadata(typeOrFunc.decorators);
            }
            // API for metadata created by invoking the decorators.
            if (typeOrFunc.hasOwnProperty(ANNOTATIONS)) {
                return typeOrFunc[ANNOTATIONS];
            }
            return null;
        };
        ReflectionCapabilities.prototype.annotations = function (typeOrFunc) {
            if (!isType(typeOrFunc)) {
                return [];
            }
            var parentCtor = getParentCtor(typeOrFunc);
            var ownAnnotations = this._ownAnnotations(typeOrFunc, parentCtor) || [];
            var parentAnnotations = parentCtor !== Object ? this.annotations(parentCtor) : [];
            return parentAnnotations.concat(ownAnnotations);
        };
        ReflectionCapabilities.prototype._ownPropMetadata = function (typeOrFunc, parentCtor) {
            // Prefer the direct API.
            if (typeOrFunc.propMetadata &&
                typeOrFunc.propMetadata !== parentCtor.propMetadata) {
                var propMetadata = typeOrFunc.propMetadata;
                if (typeof propMetadata === 'function' && propMetadata.propMetadata) {
                    propMetadata = propMetadata.propMetadata;
                }
                return propMetadata;
            }
            // API of tsickle for lowering decorators to properties on the class.
            if (typeOrFunc.propDecorators &&
                typeOrFunc.propDecorators !== parentCtor.propDecorators) {
                var propDecorators_1 = typeOrFunc.propDecorators;
                var propMetadata_1 = {};
                Object.keys(propDecorators_1).forEach(function (prop) {
                    propMetadata_1[prop] = convertTsickleDecoratorIntoMetadata(propDecorators_1[prop]);
                });
                return propMetadata_1;
            }
            // API for metadata created by invoking the decorators.
            if (typeOrFunc.hasOwnProperty(PROP_METADATA)) {
                return typeOrFunc[PROP_METADATA];
            }
            return null;
        };
        ReflectionCapabilities.prototype.propMetadata = function (typeOrFunc) {
            if (!isType(typeOrFunc)) {
                return {};
            }
            var parentCtor = getParentCtor(typeOrFunc);
            var propMetadata = {};
            if (parentCtor !== Object) {
                var parentPropMetadata_1 = this.propMetadata(parentCtor);
                Object.keys(parentPropMetadata_1).forEach(function (propName) {
                    propMetadata[propName] = parentPropMetadata_1[propName];
                });
            }
            var ownPropMetadata = this._ownPropMetadata(typeOrFunc, parentCtor);
            if (ownPropMetadata) {
                Object.keys(ownPropMetadata).forEach(function (propName) {
                    var decorators = [];
                    if (propMetadata.hasOwnProperty(propName)) {
                        decorators.push.apply(decorators, __spread(propMetadata[propName]));
                    }
                    decorators.push.apply(decorators, __spread(ownPropMetadata[propName]));
                    propMetadata[propName] = decorators;
                });
            }
            return propMetadata;
        };
        ReflectionCapabilities.prototype.hasLifecycleHook = function (type, lcProperty) {
            return type instanceof Type && lcProperty in type.prototype;
        };
        ReflectionCapabilities.prototype.guards = function (type) { return {}; };
        ReflectionCapabilities.prototype.getter = function (name) { return new Function('o', 'return o.' + name + ';'); };
        ReflectionCapabilities.prototype.setter = function (name) {
            return new Function('o', 'v', 'return o.' + name + ' = v;');
        };
        ReflectionCapabilities.prototype.method = function (name) {
            var functionBody = "if (!o." + name + ") throw new Error('\"" + name + "\" is undefined');\n        return o." + name + ".apply(o, args);";
            return new Function('o', 'args', functionBody);
        };
        // There is not a concept of import uri in Js, but this is useful in developing Dart applications.
        ReflectionCapabilities.prototype.importUri = function (type) {
            // StaticSymbol
            if (typeof type === 'object' && type['filePath']) {
                return type['filePath'];
            }
            // Runtime type
            return "./" + stringify(type);
        };
        ReflectionCapabilities.prototype.resourceUri = function (type) { return "./" + stringify(type); };
        ReflectionCapabilities.prototype.resolveIdentifier = function (name, moduleUrl, members, runtime) {
            return runtime;
        };
        ReflectionCapabilities.prototype.resolveEnum = function (enumIdentifier, name) { return enumIdentifier[name]; };
        return ReflectionCapabilities;
    }());
    function convertTsickleDecoratorIntoMetadata(decoratorInvocations) {
        if (!decoratorInvocations) {
            return [];
        }
        return decoratorInvocations.map(function (decoratorInvocation) {
            var decoratorType = decoratorInvocation.type;
            var annotationCls = decoratorType.annotationCls;
            var annotationArgs = decoratorInvocation.args ? decoratorInvocation.args : [];
            return new (annotationCls.bind.apply(annotationCls, __spread([void 0], annotationArgs)))();
        });
    }
    function getParentCtor(ctor) {
        var parentProto = ctor.prototype ? Object.getPrototypeOf(ctor.prototype) : null;
        var parentCtor = parentProto ? parentProto.constructor : null;
        // Note: We always use `Object` as the null value
        // to simplify checking later on.
        return parentCtor || Object;
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Used to resolve resource URLs on `@Component` when used with JIT compilation.
     *
     * Example:
     * ```
     * @Component({
     *   selector: 'my-comp',
     *   templateUrl: 'my-comp.html', // This requires asynchronous resolution
     * })
     * class MyComponnent{
     * }
     *
     * // Calling `renderComponent` will fail because `MyComponent`'s `@Compenent.templateUrl`
     * // needs to be resolved because `renderComponent` is synchronous process.
     * // renderComponent(MyComponent);
     *
     * // Calling `resolveComponentResources` will resolve `@Compenent.templateUrl` into
     * // `@Compenent.template`, which would allow `renderComponent` to proceed in synchronous manner.
     * // Use browser's `fetch` function as the default resource resolution strategy.
     * resolveComponentResources(fetch).then(() => {
     *   // After resolution all URLs have been converted into strings.
     *   renderComponent(MyComponent);
     * });
     *
     * ```
     *
     * NOTE: In AOT the resolution happens during compilation, and so there should be no need
     * to call this method outside JIT mode.
     *
     * @param resourceResolver a function which is responsible to returning a `Promise` of the resolved
     * URL. Browser's `fetch` method is a good default implementation.
     */
    function resolveComponentResources(resourceResolver) {
        // Store all promises which are fetching the resources.
        var urlFetches = [];
        // Cache so that we don't fetch the same resource more than once.
        var urlMap = new Map();
        function cachedResourceResolve(url) {
            var promise = urlMap.get(url);
            if (!promise) {
                var resp = resourceResolver(url);
                urlMap.set(url, promise = resp.then(unwrapResponse));
                urlFetches.push(promise);
            }
            return promise;
        }
        componentResourceResolutionQueue.forEach(function (component) {
            if (component.templateUrl) {
                cachedResourceResolve(component.templateUrl).then(function (template) {
                    component.template = template;
                    component.templateUrl = undefined;
                });
            }
            var styleUrls = component.styleUrls;
            var styles = component.styles || (component.styles = []);
            var styleOffset = component.styles.length;
            styleUrls && styleUrls.forEach(function (styleUrl, index) {
                styles.push(''); // pre-allocate array.
                cachedResourceResolve(styleUrl).then(function (style) {
                    styles[styleOffset + index] = style;
                    styleUrls.splice(styleUrls.indexOf(styleUrl), 1);
                    if (styleUrls.length == 0) {
                        component.styleUrls = undefined;
                    }
                });
            });
        });
        componentResourceResolutionQueue.clear();
        return Promise.all(urlFetches).then(function () { return null; });
    }
    var componentResourceResolutionQueue = new Set();
    function maybeQueueResolutionOfComponentResources(metadata) {
        if (componentNeedsResolution(metadata)) {
            componentResourceResolutionQueue.add(metadata);
        }
    }
    function componentNeedsResolution(component) {
        return component.templateUrl || component.styleUrls && component.styleUrls.length;
    }
    function unwrapResponse(response) {
        return typeof response == 'string' ? response : response.text();
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    (function (ViewEncapsulation) {
        /**
         * Emulate `Native` scoping of styles by adding an attribute containing surrogate id to the Host
         * Element and pre-processing the style rules provided via {@link Component#styles styles} or
         * {@link Component#styleUrls styleUrls}, and adding the new Host Element attribute to all
         * selectors.
         *
         * This is the default option.
         */
        ViewEncapsulation[ViewEncapsulation["Emulated"] = 0] = "Emulated";
        /**
         * @deprecated v6.1.0 - use {ViewEncapsulation.ShadowDom} instead.
         * Use the native encapsulation mechanism of the renderer.
         *
         * For the DOM this means using the deprecated [Shadow DOM
         * v0](https://w3c.github.io/webcomponents/spec/shadow/) and
         * creating a ShadowRoot for Component's Host Element.
         */
        ViewEncapsulation[ViewEncapsulation["Native"] = 1] = "Native";
        /**
         * Don't provide any template or style encapsulation.
         */
        ViewEncapsulation[ViewEncapsulation["None"] = 2] = "None";
        /**
         * Use Shadow DOM to encapsulate styles.
         *
         * For the DOM this means using modern [Shadow
         * DOM](https://w3c.github.io/webcomponents/spec/shadow/) and
         * creating a ShadowRoot for Component's Host Element.
         */
        ViewEncapsulation[ViewEncapsulation["ShadowDom"] = 3] = "ShadowDom";
    })(exports.ViewEncapsulation || (exports.ViewEncapsulation = {}));

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    function ngDevModeResetPerfCounters() {
        var newCounters = {
            firstTemplatePass: 0,
            tNode: 0,
            tView: 0,
            rendererCreateTextNode: 0,
            rendererSetText: 0,
            rendererCreateElement: 0,
            rendererAddEventListener: 0,
            rendererSetAttribute: 0,
            rendererRemoveAttribute: 0,
            rendererSetProperty: 0,
            rendererSetClassName: 0,
            rendererAddClass: 0,
            rendererRemoveClass: 0,
            rendererSetStyle: 0,
            rendererRemoveStyle: 0,
            rendererDestroy: 0,
            rendererDestroyNode: 0,
            rendererMoveNode: 0,
            rendererRemoveNode: 0,
            rendererCreateComment: 0,
        };
        // NOTE: Under Ivy we may have both window & global defined in the Node
        //    environment since ensureDocument() in render3.ts sets global.window.
        if (typeof window != 'undefined') {
            // Make sure to refer to ngDevMode as ['ngDevMode'] for closure.
            window['ngDevMode'] = newCounters;
        }
        if (typeof global != 'undefined') {
            // Make sure to refer to ngDevMode as ['ngDevMode'] for closure.
            global['ngDevMode'] = newCounters;
        }
        if (typeof self != 'undefined') {
            // Make sure to refer to ngDevMode as ['ngDevMode'] for closure.
            self['ngDevMode'] = newCounters;
        }
        return newCounters;
    }
    /**
     * This checks to see if the `ngDevMode` has been set. If yes,
     * than we honor it, otherwise we default to dev mode with additional checks.
     *
     * The idea is that unless we are doing production build where we explicitly
     * set `ngDevMode == false` we should be helping the developer by providing
     * as much early warning and errors as possible.
     */
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
        ngDevModeResetPerfCounters();
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var EMPTY$1 = {};
    var EMPTY_ARRAY = [];
    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
        Object.freeze(EMPTY$1);
        Object.freeze(EMPTY_ARRAY);
    }
    var _renderCompCount = 0;
    /**
     * Create a component definition object.
     *
     *
     * # Example
     * ```
     * class MyDirective {
     *   // Generated by Angular Template Compiler
     *   // [Symbol] syntax will not be supported by TypeScript until v2.7
     *   static ngComponentDef = defineComponent({
     *     ...
     *   });
     * }
     * ```
     */
    function defineComponent(componentDefinition) {
        var type = componentDefinition.type;
        var typePrototype = type.prototype;
        var declaredInputs = {};
        var def = {
            type: type,
            diPublic: null,
            consts: componentDefinition.consts,
            vars: componentDefinition.vars,
            hostVars: componentDefinition.hostVars || 0,
            factory: componentDefinition.factory,
            template: componentDefinition.template || null,
            hostBindings: componentDefinition.hostBindings || null,
            contentQueries: componentDefinition.contentQueries || null,
            contentQueriesRefresh: componentDefinition.contentQueriesRefresh || null,
            attributes: componentDefinition.attributes || null,
            declaredInputs: declaredInputs,
            inputs: null,
            outputs: null,
            exportAs: componentDefinition.exportAs || null,
            onInit: typePrototype.ngOnInit || null,
            doCheck: typePrototype.ngDoCheck || null,
            afterContentInit: typePrototype.ngAfterContentInit || null,
            afterContentChecked: typePrototype.ngAfterContentChecked || null,
            afterViewInit: typePrototype.ngAfterViewInit || null,
            afterViewChecked: typePrototype.ngAfterViewChecked || null,
            onDestroy: typePrototype.ngOnDestroy || null,
            onPush: componentDefinition.changeDetection === exports.ChangeDetectionStrategy.OnPush,
            directiveDefs: null,
            pipeDefs: null,
            selectors: componentDefinition.selectors,
            viewQuery: componentDefinition.viewQuery || null,
            features: componentDefinition.features || null,
            data: componentDefinition.data || {},
            // TODO(misko): convert ViewEncapsulation into const enum so that it can be used directly in the
            // next line. Also `None` should be 0 not 2.
            encapsulation: componentDefinition.encapsulation || exports.ViewEncapsulation.Emulated,
            providers: EMPTY_ARRAY,
            viewProviders: EMPTY_ARRAY,
            id: 'c',
            styles: componentDefinition.styles || EMPTY_ARRAY,
            _: null,
        };
        def._ = noSideEffects(function () {
            var directiveTypes = componentDefinition.directives;
            var feature = componentDefinition.features;
            var pipeTypes = componentDefinition.pipes;
            def.id += _renderCompCount++;
            def.inputs = invertObject(componentDefinition.inputs, declaredInputs),
                def.outputs = invertObject(componentDefinition.outputs),
                feature && feature.forEach(function (fn) { return fn(def); });
            def.directiveDefs = directiveTypes ?
                function () { return (typeof directiveTypes === 'function' ? directiveTypes() : directiveTypes)
                    .map(extractDirectiveDef); } :
                null;
            def.pipeDefs = pipeTypes ?
                function () { return (typeof pipeTypes === 'function' ? pipeTypes() : pipeTypes).map(extractPipeDef); } :
                null;
        });
        return def;
    }
    function extractDirectiveDef(type) {
        var def = getComponentDef(type) || getDirectiveDef(type);
        if (ngDevMode && !def) {
            throw new Error("'" + type.name + "' is neither 'ComponentType' or 'DirectiveType'.");
        }
        return def;
    }
    function extractPipeDef(type) {
        var def = getPipeDef(type);
        if (ngDevMode && !def) {
            throw new Error("'" + type.name + "' is not a 'PipeType'.");
        }
        return def;
    }
    function defineNgModule(def) {
        var res = {
            type: def.type,
            bootstrap: def.bootstrap || EMPTY_ARRAY,
            declarations: def.declarations || EMPTY_ARRAY,
            imports: def.imports || EMPTY_ARRAY,
            exports: def.exports || EMPTY_ARRAY,
            transitiveCompileScopes: null,
        };
        return res;
    }
    /**
     * Inverts an inputs or outputs lookup such that the keys, which were the
     * minified keys, are part of the values, and the values are parsed so that
     * the publicName of the property is the new key
     *
     * e.g. for
     *
     * ```
     * class Comp {
     *   @Input()
     *   propName1: string;
     *
     *   @Input('publicName')
     *   propName2: number;
     * }
     * ```
     *
     * will be serialized as
     *
     * ```
     * {
     *   a0: 'propName1',
     *   b1: ['publicName', 'propName2'],
     * }
     * ```
     *
     * becomes
     *
     * ```
     * {
     *  'propName1': 'a0',
     *  'publicName': 'b1'
     * }
     * ```
     *
     * Optionally the function can take `secondary` which will result in:
     *
     * ```
     * {
     *  'propName1': 'a0',
     *  'propName2': 'b1'
     * }
     * ```
     *

     */
    function invertObject(obj, secondary) {
        if (obj == null)
            return EMPTY$1;
        var newLookup = {};
        for (var minifiedKey in obj) {
            if (obj.hasOwnProperty(minifiedKey)) {
                var publicName = obj[minifiedKey];
                var declaredName = publicName;
                if (Array.isArray(publicName)) {
                    declaredName = publicName[1];
                    publicName = publicName[0];
                }
                newLookup[publicName] = minifiedKey;
                if (secondary) {
                    (secondary[declaredName] = minifiedKey);
                }
            }
        }
        return newLookup;
    }
    /**
     * Create a base definition
     *
     * # Example
     * ```
     * class ShouldBeInherited {
     *   static ngBaseDef = defineBase({
     *      ...
     *   })
     * }
     * @param baseDefinition The base definition parameters
     */
    function defineBase(baseDefinition) {
        var declaredInputs = {};
        return {
            inputs: invertObject(baseDefinition.inputs, declaredInputs),
            declaredInputs: declaredInputs,
            outputs: invertObject(baseDefinition.outputs),
        };
    }
    /**
     * Create a directive definition object.
     *
     * # Example
     * ```
     * class MyDirective {
     *   // Generated by Angular Template Compiler
     *   // [Symbol] syntax will not be supported by TypeScript until v2.7
     *   static ngDirectiveDef = defineDirective({
     *     ...
     *   });
     * }
     * ```
     */
    var defineDirective = defineComponent;
    /**
     * Create a pipe definition object.
     *
     * # Example
     * ```
     * class MyPipe implements PipeTransform {
     *   // Generated by Angular Template Compiler
     *   static ngPipeDef = definePipe({
     *     ...
     *   });
     * }
     * ```
     * @param pipeDef Pipe definition generated by the compiler
     */
    function definePipe(pipeDef) {
        return {
            name: pipeDef.name,
            factory: pipeDef.factory,
            pure: pipeDef.pure !== false,
            onDestroy: pipeDef.type.prototype.ngOnDestroy || null
        };
    }
    /**
     * The following getter methods retrieve the definition form the type. Currently the retrieval
     * honors inheritance, but in the future we may change the rule to require that definitions are
     * explicit. This would require some sort of migration strategy.
     */
    function getComponentDef(type) {
        return type[NG_COMPONENT_DEF] || null;
    }
    function getDirectiveDef(type) {
        return type[NG_DIRECTIVE_DEF] || null;
    }
    function getPipeDef(type) {
        return type[NG_PIPE_DEF] || null;
    }
    function getNgModuleDef(type) {
        return type[NG_MODULE_DEF] || null;
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var R3ResolvedDependencyType;
    (function (R3ResolvedDependencyType) {
        R3ResolvedDependencyType[R3ResolvedDependencyType["Token"] = 0] = "Token";
        R3ResolvedDependencyType[R3ResolvedDependencyType["Attribute"] = 1] = "Attribute";
        R3ResolvedDependencyType[R3ResolvedDependencyType["Injector"] = 2] = "Injector";
    })(R3ResolvedDependencyType || (R3ResolvedDependencyType = {}));

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    function getCompilerFacade() {
        var globalNg = _global.ng;
        if (!globalNg || !globalNg.ɵcompilerFacade) {
            throw new Error("Angular JIT compilation failed: '@angular/compiler' not loaded!\n" +
                "  - JIT compilation is discouraged for production use-cases! Consider AOT mode instead.\n" +
                "  - Did you bootstrap using '@angular/platform-browser-dynamic' or '@angular/platform-server'?\n" +
                "  - Alternatively provide the compiler with 'import \"@angular/compiler\";' before bootstrapping.");
        }
        return globalNg.ɵcompilerFacade;
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    function assertEqual(actual, expected, msg) {
        if (actual != expected) {
            throwError(msg);
        }
    }
    function assertNotEqual(actual, expected, msg) {
        if (actual == expected) {
            throwError(msg);
        }
    }
    function assertLessThan(actual, expected, msg) {
        if (actual >= expected) {
            throwError(msg);
        }
    }
    function assertGreaterThan(actual, expected, msg) {
        if (actual <= expected) {
            throwError(msg);
        }
    }
    function assertDefined(actual, msg) {
        if (actual == null) {
            throwError(msg);
        }
    }
    function assertComponentType(actual, msg) {
        if (msg === void 0) { msg = 'Type passed in is not ComponentType, it does not have \'ngComponentDef\' property.'; }
        if (!getComponentDef(actual)) {
            throwError(msg);
        }
    }
    function assertNgModuleType(actual, msg) {
        if (msg === void 0) { msg = 'Type passed in is not NgModuleType, it does not have \'ngModuleDef\' property.'; }
        if (!getNgModuleDef(actual)) {
            throwError(msg);
        }
    }
    function throwError(msg) {
        // tslint:disable-next-line
        debugger; // Left intentionally for better debugger experience.
        throw new Error("ASSERTION ERROR: " + msg);
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * This property will be monkey-patched on elements, components and directives
     */
    var MONKEY_PATCH_KEY_NAME = '__ngContext__';

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /** Size of LViewData's header. Necessary to adjust for it when setting slots.  */
    var HEADER_OFFSET = 17;
    // Below are constants for LViewData indices to help us look up LViewData members
    // without having to remember the specific indices.
    // Uglify will inline these when minifying so there shouldn't be a cost.
    var TVIEW = 0;
    var FLAGS = 1;
    var PARENT = 2;
    var NEXT = 3;
    var QUERIES = 4;
    var HOST = 5;
    var HOST_NODE = 6;
    var BINDING_INDEX = 7;
    var CLEANUP = 8;
    var CONTEXT = 9;
    var INJECTOR$1 = 10;
    var RENDERER = 11;
    var SANITIZER = 12;
    var TAIL = 13;
    var CONTAINER_INDEX = 14;
    var CONTENT_QUERIES = 15;
    var DECLARATION_VIEW = 16;

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    function devModeEqual(a, b) {
        var isListLikeIterableA = isListLikeIterable(a);
        var isListLikeIterableB = isListLikeIterable(b);
        if (isListLikeIterableA && isListLikeIterableB) {
            return areIterablesEqual(a, b, devModeEqual);
        }
        else {
            var isAObject = a && (typeof a === 'object' || typeof a === 'function');
            var isBObject = b && (typeof b === 'object' || typeof b === 'function');
            if (!isListLikeIterableA && isAObject && !isListLikeIterableB && isBObject) {
                return true;
            }
            else {
                return looseIdentical(a, b);
            }
        }
    }
    /**
     * Indicates that the result of a {@link Pipe} transformation has changed even though the
     * reference has not changed.
     *
     * Wrapped values are unwrapped automatically during the change detection, and the unwrapped value
     * is stored.
     *
     * Example:
     *
     * ```
     * if (this._latestValue === this._latestReturnedValue) {
     *    return this._latestReturnedValue;
     *  } else {
     *    this._latestReturnedValue = this._latestValue;
     *    return WrappedValue.wrap(this._latestValue); // this will force update
     *  }
     * ```
     *
     * @publicApi
     */
    var WrappedValue = /** @class */ (function () {
        function WrappedValue(value) {
            this.wrapped = value;
        }
        /** Creates a wrapped value. */
        WrappedValue.wrap = function (value) { return new WrappedValue(value); };
        /**
         * Returns the underlying value of a wrapped value.
         * Returns the given `value` when it is not wrapped.
         **/
        WrappedValue.unwrap = function (value) { return WrappedValue.isWrapped(value) ? value.wrapped : value; };
        /** Returns true if `value` is a wrapped value. */
        WrappedValue.isWrapped = function (value) { return value instanceof WrappedValue; };
        return WrappedValue;
    }());
    /**
     * Represents a basic change from a previous to a new value.
     *
     * @publicApi
     */
    var SimpleChange = /** @class */ (function () {
        function SimpleChange(previousValue, currentValue, firstChange) {
            this.previousValue = previousValue;
            this.currentValue = currentValue;
            this.firstChange = firstChange;
        }
        /**
         * Check whether the new value is the first value assigned.
         */
        SimpleChange.prototype.isFirstChange = function () { return this.firstChange; };
        return SimpleChange;
    }());
    function isListLikeIterable(obj) {
        if (!isJsObject(obj))
            return false;
        return Array.isArray(obj) ||
            (!(obj instanceof Map) && // JS Map are iterables but return entries as [k, v]
                getSymbolIterator() in obj); // JS Iterable have a Symbol.iterator prop
    }
    function areIterablesEqual(a, b, comparator) {
        var iterator1 = a[getSymbolIterator()]();
        var iterator2 = b[getSymbolIterator()]();
        while (true) {
            var item1 = iterator1.next();
            var item2 = iterator2.next();
            if (item1.done && item2.done)
                return true;
            if (item1.done || item2.done)
                return false;
            if (!comparator(item1.value, item2.value))
                return false;
        }
    }
    function iterateListLike(obj, fn) {
        if (Array.isArray(obj)) {
            for (var i = 0; i < obj.length; i++) {
                fn(obj[i]);
            }
        }
        else {
            var iterator = obj[getSymbolIterator()]();
            var item = void 0;
            while (!((item = iterator.next()).done)) {
                fn(item.value);
            }
        }
    }
    function isJsObject(o) {
        return o !== null && (typeof o === 'function' || typeof o === 'object');
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Below are constants for LContainer indices to help us look up LContainer members
     * without having to remember the specific indices.
     * Uglify will inline these when minifying so there shouldn't be a cost.
     */
    var ACTIVE_INDEX = 0;
    var VIEWS = 1;
    // PARENT, NEXT, QUERIES, and HOST are indices 2, 3, 4, and 5.
    // As we already have these constants in LViewData, we don't need to re-create them.
    var NATIVE = 6;
    var RENDER_PARENT = 7;

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Returns whether the values are different from a change detection stand point.
     *
     * Constraints are relaxed in checkNoChanges mode. See `devModeEqual` for details.
     */
    function isDifferent(a, b, checkNoChangesMode) {
        if (ngDevMode && checkNoChangesMode) {
            return !devModeEqual(a, b);
        }
        // NaN is the only value that is not equal to itself so the first
        // test checks if both a and b are not NaN
        return !(a !== a && b !== b) && a !== b;
    }
    function stringify$1(value) {
        if (typeof value == 'function')
            return value.name || value;
        if (typeof value == 'string')
            return value;
        if (value == null)
            return '';
        return '' + value;
    }
    /**
     * Flattens an array in non-recursive way. Input arrays are not modified.
     */
    function flatten(list) {
        var result = [];
        var i = 0;
        while (i < list.length) {
            var item = list[i];
            if (Array.isArray(item)) {
                if (item.length > 0) {
                    list = item.concat(list.slice(i + 1));
                    i = 0;
                }
                else {
                    i++;
                }
            }
            else {
                result.push(item);
                i++;
            }
        }
        return result;
    }
    /** Retrieves a value from any `LViewData` or `TData`. */
    function loadInternal(index, arr) {
        ngDevMode && assertDataInRangeInternal(index + HEADER_OFFSET, arr);
        return arr[index + HEADER_OFFSET];
    }
    function assertDataInRangeInternal(index, arr) {
        assertLessThan(index, arr ? arr.length : 0, 'index expected to be a valid data index');
    }
    /**
     * Takes the value of a slot in `LViewData` and returns the element node.
     *
     * Normally, element nodes are stored flat, but if the node has styles/classes on it,
     * it might be wrapped in a styling context. Or if that node has a directive that injects
     * ViewContainerRef, it may be wrapped in an LContainer. Or if that node is a component,
     * it will be wrapped in LViewData. It could even have all three, so we keep looping
     * until we find something that isn't an array.
     *
     * @param value The initial value in `LViewData`
     */
    function readElementValue(value) {
        while (Array.isArray(value)) {
            value = value[HOST];
        }
        return value;
    }
    /**
     * Retrieves an element value from the provided `viewData`, by unwrapping
     * from any containers, component views, or style contexts.
     */
    function getNativeByIndex(index, arr) {
        return readElementValue(arr[index + HEADER_OFFSET]);
    }
    function getNativeByTNode(tNode, hostView) {
        return readElementValue(hostView[tNode.index]);
    }
    function getTNode(index, view) {
        return view[TVIEW].data[index + HEADER_OFFSET];
    }
    function getComponentViewByIndex(nodeIndex, hostView) {
        // Could be an LViewData or an LContainer. If LContainer, unwrap to find LViewData.
        var slotValue = hostView[nodeIndex];
        return slotValue.length >= HEADER_OFFSET ? slotValue : slotValue[HOST];
    }
    function isContentQueryHost(tNode) {
        return (tNode.flags & 16384 /* hasContentQuery */) !== 0;
    }
    function isComponent(tNode) {
        return (tNode.flags & 4096 /* isComponent */) === 4096 /* isComponent */;
    }
    function isLContainer(value) {
        // Styling contexts are also arrays, but their first index contains an element node
        return Array.isArray(value) && typeof value[ACTIVE_INDEX] === 'number';
    }
    /**
     * Retrieve the root view from any component by walking the parent `LViewData` until
     * reaching the root `LViewData`.
     *
     * @param component any component
     */
    function getRootView(target) {
        ngDevMode && assertDefined(target, 'component');
        var lViewData = Array.isArray(target) ? target : readPatchedLViewData(target);
        while (lViewData && !(lViewData[FLAGS] & 64 /* IsRoot */)) {
            lViewData = lViewData[PARENT];
        }
        return lViewData;
    }
    function getRootContext(viewOrComponent) {
        return getRootView(viewOrComponent)[CONTEXT];
    }
    /**
     * Returns the monkey-patch value data present on the target (which could be
     * a component, directive or a DOM node).
     */
    function readPatchedData(target) {
        return target[MONKEY_PATCH_KEY_NAME];
    }
    function readPatchedLViewData(target) {
        var value = readPatchedData(target);
        if (value) {
            return Array.isArray(value) ? value : value.lViewData;
        }
        return null;
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /** Returns the matching `LContext` data for a given DOM node, directive or component instance.
     *
     * This function will examine the provided DOM element, component, or directive instance\'s
     * monkey-patched property to derive the `LContext` data. Once called then the monkey-patched
     * value will be that of the newly created `LContext`.
     *
     * If the monkey-patched value is the `LViewData` instance then the context value for that
     * target will be created and the monkey-patch reference will be updated. Therefore when this
     * function is called it may mutate the provided element\'s, component\'s or any of the associated
     * directive\'s monkey-patch values.
     *
     * If the monkey-patch value is not detected then the code will walk up the DOM until an element
     * is found which contains a monkey-patch reference. When that occurs then the provided element
     * will be updated with a new context (which is then returned). If the monkey-patch value is not
     * detected for a component/directive instance then it will throw an error (all components and
     * directives should be automatically monkey-patched by ivy).
     */
    function getContext(target) {
        var mpValue = readPatchedData(target);
        if (mpValue) {
            // only when it's an array is it considered an LViewData instance
            // ... otherwise it's an already constructed LContext instance
            if (Array.isArray(mpValue)) {
                var lViewData = mpValue;
                var nodeIndex = void 0;
                var component = undefined;
                var directives = undefined;
                if (isComponentInstance(target)) {
                    nodeIndex = findViaComponent(lViewData, target);
                    if (nodeIndex == -1) {
                        throw new Error('The provided component was not found in the application');
                    }
                    component = target;
                }
                else if (isDirectiveInstance(target)) {
                    nodeIndex = findViaDirective(lViewData, target);
                    if (nodeIndex == -1) {
                        throw new Error('The provided directive was not found in the application');
                    }
                    directives = discoverDirectives(nodeIndex, lViewData, false);
                }
                else {
                    nodeIndex = findViaNativeElement(lViewData, target);
                    if (nodeIndex == -1) {
                        return null;
                    }
                }
                // the goal is not to fill the entire context full of data because the lookups
                // are expensive. Instead, only the target data (the element, compontent or
                // directive details) are filled into the context. If called multiple times
                // with different target values then the missing target data will be filled in.
                var native = readElementValue(lViewData[nodeIndex]);
                var existingCtx = readPatchedData(native);
                var context = (existingCtx && !Array.isArray(existingCtx)) ?
                    existingCtx :
                    createLContext(lViewData, nodeIndex, native);
                // only when the component has been discovered then update the monkey-patch
                if (component && context.component === undefined) {
                    context.component = component;
                    attachPatchData(context.component, context);
                }
                // only when the directives have been discovered then update the monkey-patch
                if (directives && context.directives === undefined) {
                    context.directives = directives;
                    for (var i = 0; i < directives.length; i++) {
                        attachPatchData(directives[i], context);
                    }
                }
                attachPatchData(context.native, context);
                mpValue = context;
            }
        }
        else {
            var rElement = target;
            ngDevMode && assertDomElement(rElement);
            // if the context is not found then we need to traverse upwards up the DOM
            // to find the nearest element that has already been monkey patched with data
            var parent_1 = rElement;
            while (parent_1 = parent_1.parentNode) {
                var parentContext = readPatchedData(parent_1);
                if (parentContext) {
                    var lViewData = void 0;
                    if (Array.isArray(parentContext)) {
                        lViewData = parentContext;
                    }
                    else {
                        lViewData = parentContext.lViewData;
                    }
                    // the edge of the app was also reached here through another means
                    // (maybe because the DOM was changed manually).
                    if (!lViewData) {
                        return null;
                    }
                    var index = findViaNativeElement(lViewData, rElement);
                    if (index >= 0) {
                        var native = readElementValue(lViewData[index]);
                        var context = createLContext(lViewData, index, native);
                        attachPatchData(native, context);
                        mpValue = context;
                        break;
                    }
                }
            }
        }
        return mpValue || null;
    }
    /**
     * Creates an empty instance of a `LContext` context
     */
    function createLContext(lViewData, nodeIndex, native) {
        return {
            lViewData: lViewData,
            nodeIndex: nodeIndex, native: native,
            component: undefined,
            directives: undefined,
            localRefs: undefined,
        };
    }
    /**
     * Takes a component instance and returns the view for that component.
     *
     * @param componentInstance
     * @returns The component's view
     */
    function getComponentViewByInstance(componentInstance) {
        var lViewData = readPatchedData(componentInstance);
        var view;
        if (Array.isArray(lViewData)) {
            var nodeIndex = findViaComponent(lViewData, componentInstance);
            view = getComponentViewByIndex(nodeIndex, lViewData);
            var context = createLContext(lViewData, nodeIndex, view[HOST]);
            context.component = componentInstance;
            attachPatchData(componentInstance, context);
            attachPatchData(context.native, context);
        }
        else {
            var context = lViewData;
            view = getComponentViewByIndex(context.nodeIndex, context.lViewData);
        }
        return view;
    }
    /**
     * Assigns the given data to the given target (which could be a component,
     * directive or DOM node instance) using monkey-patching.
     */
    function attachPatchData(target, data) {
        target[MONKEY_PATCH_KEY_NAME] = data;
    }
    function isComponentInstance(instance) {
        return instance && instance.constructor && instance.constructor.ngComponentDef;
    }
    function isDirectiveInstance(instance) {
        return instance && instance.constructor && instance.constructor.ngDirectiveDef;
    }
    /**
     * Locates the element within the given LViewData and returns the matching index
     */
    function findViaNativeElement(lViewData, target) {
        var tNode = lViewData[TVIEW].firstChild;
        while (tNode) {
            var native = getNativeByTNode(tNode, lViewData);
            if (native === target) {
                return tNode.index;
            }
            tNode = traverseNextElement(tNode);
        }
        return -1;
    }
    /**
     * Locates the next tNode (child, sibling or parent).
     */
    function traverseNextElement(tNode) {
        if (tNode.child) {
            return tNode.child;
        }
        else if (tNode.next) {
            return tNode.next;
        }
        else if (tNode.parent) {
            return tNode.parent.next || null;
        }
        return null;
    }
    /**
     * Locates the component within the given LViewData and returns the matching index
     */
    function findViaComponent(lViewData, componentInstance) {
        var componentIndices = lViewData[TVIEW].components;
        if (componentIndices) {
            for (var i = 0; i < componentIndices.length; i++) {
                var elementComponentIndex = componentIndices[i];
                var componentView = getComponentViewByIndex(elementComponentIndex, lViewData);
                if (componentView[CONTEXT] === componentInstance) {
                    return elementComponentIndex;
                }
            }
        }
        else {
            var rootComponentView = getComponentViewByIndex(HEADER_OFFSET, lViewData);
            var rootComponent = rootComponentView[CONTEXT];
            if (rootComponent === componentInstance) {
                // we are dealing with the root element here therefore we know that the
                // element is the very first element after the HEADER data in the lView
                return HEADER_OFFSET;
            }
        }
        return -1;
    }
    /**
     * Locates the directive within the given LViewData and returns the matching index
     */
    function findViaDirective(lViewData, directiveInstance) {
        // if a directive is monkey patched then it will (by default)
        // have a reference to the LViewData of the current view. The
        // element bound to the directive being search lives somewhere
        // in the view data. We loop through the nodes and check their
        // list of directives for the instance.
        var tNode = lViewData[TVIEW].firstChild;
        while (tNode) {
            var directiveIndexStart = getDirectiveStartIndex(tNode);
            var directiveIndexEnd = getDirectiveEndIndex(tNode, directiveIndexStart);
            for (var i = directiveIndexStart; i < directiveIndexEnd; i++) {
                if (lViewData[i] === directiveInstance) {
                    return tNode.index;
                }
            }
            tNode = traverseNextElement(tNode);
        }
        return -1;
    }
    function assertDomElement(element) {
        assertEqual(element.nodeType, 1, 'The provided value must be an instance of an HTMLElement');
    }
    /**
     * Returns a list of directives extracted from the given view based on the
     * provided list of directive index values.
     *
     * @param nodeIndex The node index
     * @param lViewData The target view data
     * @param includeComponents Whether or not to include components in returned directives
     */
    function discoverDirectives(nodeIndex, lViewData, includeComponents) {
        var tNode = lViewData[TVIEW].data[nodeIndex];
        var directiveStartIndex = getDirectiveStartIndex(tNode);
        var directiveEndIndex = getDirectiveEndIndex(tNode, directiveStartIndex);
        if (!includeComponents && tNode.flags & 4096 /* isComponent */)
            directiveStartIndex++;
        return lViewData.slice(directiveStartIndex, directiveEndIndex);
    }
    /**
     * Returns a map of local references (local reference name => element or directive instance) that
     * exist on a given element.
     */
    function discoverLocalRefs(lViewData, nodeIndex) {
        var tNode = lViewData[TVIEW].data[nodeIndex];
        if (tNode && tNode.localNames) {
            var result = {};
            for (var i = 0; i < tNode.localNames.length; i += 2) {
                var localRefName = tNode.localNames[i];
                var directiveIndex = tNode.localNames[i + 1];
                result[localRefName] =
                    directiveIndex === -1 ? getNativeByTNode(tNode, lViewData) : lViewData[directiveIndex];
            }
            return result;
        }
        return null;
    }
    function getDirectiveStartIndex(tNode) {
        // the tNode instances store a flag value which then has a
        // pointer which tells the starting index of where all the
        // active directives are in the master directive array
        return tNode.flags >> 15 /* DirectiveStartingIndexShift */;
    }
    function getDirectiveEndIndex(tNode, startIndex) {
        // The end value is also a part of the same flag
        // (see `TNodeFlags` to see how the flag bit shifting
        // values are used).
        var count = tNode.flags & 4095 /* DirectiveCountMask */;
        return count ? (startIndex + count) : -1;
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * If this is the first template pass, any ngOnInit or ngDoCheck hooks will be queued into
     * TView.initHooks during directiveCreate.
     *
     * The directive index and hook type are encoded into one number (1st bit: type, remaining bits:
     * directive index), then saved in the even indices of the initHooks array. The odd indices
     * hold the hook functions themselves.
     *
     * @param index The index of the directive in LViewData
     * @param hooks The static hooks map on the directive def
     * @param tView The current TView
     */
    function queueInitHooks(index, onInit, doCheck, tView) {
        ngDevMode &&
            assertEqual(tView.firstTemplatePass, true, 'Should only be called on first template pass');
        if (onInit) {
            (tView.initHooks || (tView.initHooks = [])).push(index, onInit);
        }
        if (doCheck) {
            (tView.initHooks || (tView.initHooks = [])).push(index, doCheck);
            (tView.checkHooks || (tView.checkHooks = [])).push(index, doCheck);
        }
    }
    /**
     * Loops through the directives on a node and queues all their hooks except ngOnInit
     * and ngDoCheck, which are queued separately in directiveCreate.
     */
    function queueLifecycleHooks(flags, tView) {
        if (tView.firstTemplatePass) {
            var start = flags >> 15 /* DirectiveStartingIndexShift */;
            var count = flags & 4095 /* DirectiveCountMask */;
            var end = start + count;
            // It's necessary to loop through the directives at elementEnd() (rather than processing in
            // directiveCreate) so we can preserve the current hook order. Content, view, and destroy
            // hooks for projected components and directives must be called *before* their hosts.
            for (var i = start; i < end; i++) {
                var def = tView.data[i];
                queueContentHooks(def, tView, i);
                queueViewHooks(def, tView, i);
                queueDestroyHooks(def, tView, i);
            }
        }
    }
    /** Queues afterContentInit and afterContentChecked hooks on TView */
    function queueContentHooks(def, tView, i) {
        if (def.afterContentInit) {
            (tView.contentHooks || (tView.contentHooks = [])).push(i, def.afterContentInit);
        }
        if (def.afterContentChecked) {
            (tView.contentHooks || (tView.contentHooks = [])).push(i, def.afterContentChecked);
            (tView.contentCheckHooks || (tView.contentCheckHooks = [])).push(i, def.afterContentChecked);
        }
    }
    /** Queues afterViewInit and afterViewChecked hooks on TView */
    function queueViewHooks(def, tView, i) {
        if (def.afterViewInit) {
            (tView.viewHooks || (tView.viewHooks = [])).push(i, def.afterViewInit);
        }
        if (def.afterViewChecked) {
            (tView.viewHooks || (tView.viewHooks = [])).push(i, def.afterViewChecked);
            (tView.viewCheckHooks || (tView.viewCheckHooks = [])).push(i, def.afterViewChecked);
        }
    }
    /** Queues onDestroy hooks on TView */
    function queueDestroyHooks(def, tView, i) {
        if (def.onDestroy != null) {
            (tView.destroyHooks || (tView.destroyHooks = [])).push(i, def.onDestroy);
        }
    }
    /**
     * Calls onInit and doCheck calls if they haven't already been called.
     *
     * @param currentView The current view
     */
    function executeInitHooks(currentView, tView, creationMode) {
        if (currentView[FLAGS] & 16 /* RunInit */) {
            executeHooks(currentView, tView.initHooks, tView.checkHooks, creationMode);
            currentView[FLAGS] &= ~16 /* RunInit */;
        }
    }
    /**
     * Iterates over afterViewInit and afterViewChecked functions and calls them.
     *
     * @param currentView The current view
     */
    function executeHooks(data, allHooks, checkHooks, creationMode) {
        var hooksToCall = creationMode ? allHooks : checkHooks;
        if (hooksToCall) {
            callHooks(data, hooksToCall);
        }
    }
    /**
     * Calls lifecycle hooks with their contexts, skipping init hooks if it's not
     * creation mode.
     *
     * @param currentView The current view
     * @param arr The array in which the hooks are found
     */
    function callHooks(currentView, arr) {
        for (var i = 0; i < arr.length; i += 2) {
            arr[i + 1].call(currentView[arr[i]]);
        }
    }

    /** Called when directives inject each other (creating a circular dependency) */
    function throwCyclicDependencyError(token) {
        throw new Error("Cannot instantiate cyclic dependency! " + token);
    }
    /** Called when there are multiple component selectors that match a given node */
    function throwMultipleComponentError(tNode) {
        throw new Error("Multiple components match node with tagname " + tNode.tagName);
    }
    /** Throws an ExpressionChangedAfterChecked error if checkNoChanges mode is on. */
    function throwErrorIfNoChangesMode(creationMode, checkNoChangesMode, oldValue, currValue) {
        if (checkNoChangesMode) {
            var msg = "ExpressionChangedAfterItHasBeenCheckedError: Expression has changed after it was checked. Previous value: '" + oldValue + "'. Current value: '" + currValue + "'.";
            if (creationMode) {
                msg +=
                    " It seems like the view has been created after its parent and its children have been dirty checked." +
                        " Has it been created in a change detection hook ?";
            }
            // TODO: include debug context
            throw new Error(msg);
        }
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var TNODE = 8;
    var PARENT_INJECTOR = 8;
    var INJECTOR_SIZE = 9;

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var NG_PROJECT_AS_ATTR_NAME = 'ngProjectAs';

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    // TODO: cleanup once the code is merged in angular/angular
    var RendererStyleFlags3;
    (function (RendererStyleFlags3) {
        RendererStyleFlags3[RendererStyleFlags3["Important"] = 1] = "Important";
        RendererStyleFlags3[RendererStyleFlags3["DashCase"] = 2] = "DashCase";
    })(RendererStyleFlags3 || (RendererStyleFlags3 = {}));
    /** Returns whether the `renderer` is a `ProceduralRenderer3` */
    function isProceduralRenderer(renderer) {
        return !!(renderer.listen);
    }
    var domRendererFactory3 = {
        createRenderer: function (hostElement, rendererType) { return document; }
    };

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    function assertNodeType(tNode, type) {
        assertDefined(tNode, 'should be called with a TNode');
        assertEqual(tNode.type, type, "should be a " + typeName(type));
    }
    function assertNodeOfPossibleTypes(tNode) {
        var types = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            types[_i - 1] = arguments[_i];
        }
        assertDefined(tNode, 'should be called with a TNode');
        var found = types.some(function (type) { return tNode.type === type; });
        assertEqual(found, true, "Should be one of " + types.map(typeName).join(', ') + " but got " + typeName(tNode.type));
    }
    function typeName(type) {
        if (type == 1 /* Projection */)
            return 'Projection';
        if (type == 0 /* Container */)
            return 'Container';
        if (type == 2 /* View */)
            return 'View';
        if (type == 3 /* Element */)
            return 'Element';
        if (type == 4 /* ElementContainer */)
            return 'ElementContainer';
        return '<unknown>';
    }

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
    /** Retrieves the parent element of a given node. */
    function getParentNative(tNode, currentView) {
        return tNode.parent == null ? getHostNative(currentView) :
            getNativeByTNode(tNode.parent, currentView);
    }
    /**
     * Gets the host element given a view. Will return null if the current view is an embedded view,
     * which does not have a host element.
     */
    function getHostNative(currentView) {
        var hostTNode = currentView[HOST_NODE];
        return hostTNode && hostTNode.type !== 2 /* View */ ?
            getNativeByTNode(hostTNode, currentView[PARENT]) :
            null;
    }
    function getLContainer(tNode, embeddedView) {
        if (tNode.index === -1) {
            // This is a dynamically created view inside a dynamic container.
            // If the host index is -1, the view has not yet been inserted, so it has no parent.
            var containerHostIndex = embeddedView[CONTAINER_INDEX];
            return containerHostIndex > -1 ? embeddedView[PARENT][containerHostIndex] : null;
        }
        else {
            // This is a inline view node (e.g. embeddedViewStart)
            return embeddedView[PARENT][tNode.parent.index];
        }
    }
    /**
     * Retrieves render parent for a given view.
     * Might be null if a view is not yet attached to any container.
     */
    function getContainerRenderParent(tViewNode, view) {
        var container = getLContainer(tViewNode, view);
        return container ? container[RENDER_PARENT] : null;
    }
    /**
     * Stack used to keep track of projection nodes in walkTNodeTree.
     *
     * This is deliberately created outside of walkTNodeTree to avoid allocating
     * a new array each time the function is called. Instead the array will be
     * re-used by each invocation. This works because the function is not reentrant.
     */
    var projectionNodeStack = [];
    /**
     * Walks a tree of TNodes, applying a transformation on the element nodes, either only on the first
     * one found, or on all of them.
     *
     * @param viewToWalk the view to walk
     * @param action identifies the action to be performed on the elements
     * @param renderer the current renderer.
     * @param renderParent Optional the render parent node to be set in all LContainers found,
     * required for action modes Insert and Destroy.
     * @param beforeNode Optional the node before which elements should be added, required for action
     * Insert.
     */
    function walkTNodeTree(viewToWalk, action, renderer, renderParent, beforeNode) {
        var rootTNode = viewToWalk[TVIEW].node;
        var projectionNodeIndex = -1;
        var currentView = viewToWalk;
        var tNode = rootTNode.child;
        while (tNode) {
            var nextTNode = null;
            if (tNode.type === 3 /* Element */) {
                executeNodeAction(action, renderer, renderParent, getNativeByTNode(tNode, currentView), beforeNode);
                var nodeOrContainer = currentView[tNode.index];
                if (isLContainer(nodeOrContainer)) {
                    // This element has an LContainer, and its comment needs to be handled
                    executeNodeAction(action, renderer, renderParent, nodeOrContainer[NATIVE], beforeNode);
                }
            }
            else if (tNode.type === 0 /* Container */) {
                var lContainer = currentView[tNode.index];
                executeNodeAction(action, renderer, renderParent, lContainer[NATIVE], beforeNode);
                if (renderParent)
                    lContainer[RENDER_PARENT] = renderParent;
                if (lContainer[VIEWS].length) {
                    currentView = lContainer[VIEWS][0];
                    nextTNode = currentView[TVIEW].node;
                    // When the walker enters a container, then the beforeNode has to become the local native
                    // comment node.
                    beforeNode = lContainer[NATIVE];
                }
            }
            else if (tNode.type === 1 /* Projection */) {
                var componentView = findComponentView(currentView);
                var componentHost = componentView[HOST_NODE];
                var head = componentHost.projection[tNode.projection];
                // Must store both the TNode and the view because this projection node could be nested
                // deeply inside embedded views, and we need to get back down to this particular nested view.
                projectionNodeStack[++projectionNodeIndex] = tNode;
                projectionNodeStack[++projectionNodeIndex] = currentView;
                if (head) {
                    currentView = componentView[PARENT];
                    nextTNode = currentView[TVIEW].data[head.index];
                }
            }
            else {
                // Otherwise, this is a View or an ElementContainer
                nextTNode = tNode.child;
            }
            if (nextTNode === null) {
                // this last node was projected, we need to get back down to its projection node
                if (tNode.next === null && (tNode.flags & 8192 /* isProjected */)) {
                    currentView = projectionNodeStack[projectionNodeIndex--];
                    tNode = projectionNodeStack[projectionNodeIndex--];
                }
                nextTNode = tNode.next;
                /**
                 * Find the next node in the TNode tree, taking into account the place where a node is
                 * projected (in the shadow DOM) rather than where it comes from (in the light DOM).
                 *
                 * If there is no sibling node, then it goes to the next sibling of the parent node...
                 * until it reaches rootNode (at which point null is returned).
                 */
                while (!nextTNode) {
                    // If parent is null, we're crossing the view boundary, so we should get the host TNode.
                    tNode = tNode.parent || currentView[TVIEW].node;
                    if (tNode === null || tNode === rootTNode)
                        return null;
                    // When exiting a container, the beforeNode must be restored to the previous value
                    if (tNode.type === 0 /* Container */) {
                        currentView = currentView[PARENT];
                        beforeNode = currentView[tNode.index][NATIVE];
                    }
                    if (tNode.type === 2 /* View */ && currentView[NEXT]) {
                        currentView = currentView[NEXT];
                        nextTNode = currentView[TVIEW].node;
                    }
                    else {
                        nextTNode = tNode.next;
                    }
                }
            }
            tNode = nextTNode;
        }
    }
    /**
     * Given a current view, finds the nearest component's host (LElement).
     *
     * @param lViewData LViewData for which we want a host element node
     * @returns The host node
     */
    function findComponentView(lViewData) {
        var rootTNode = lViewData[HOST_NODE];
        while (rootTNode && rootTNode.type === 2 /* View */) {
            ngDevMode && assertDefined(lViewData[PARENT], 'viewData.parent');
            lViewData = lViewData[PARENT];
            rootTNode = lViewData[HOST_NODE];
        }
        return lViewData;
    }
    /**
     * NOTE: for performance reasons, the possible actions are inlined within the function instead of
     * being passed as an argument.
     */
    function executeNodeAction(action, renderer, parent, node, beforeNode) {
        if (action === 0 /* Insert */) {
            isProceduralRenderer(renderer) ?
                renderer.insertBefore(parent, node, beforeNode) :
                parent.insertBefore(node, beforeNode, true);
        }
        else if (action === 1 /* Detach */) {
            isProceduralRenderer(renderer) ?
                renderer.removeChild(parent, node) :
                parent.removeChild(node);
        }
        else if (action === 2 /* Destroy */) {
            ngDevMode && ngDevMode.rendererDestroyNode++;
            renderer.destroyNode(node);
        }
    }
    function createTextNode(value, renderer) {
        return isProceduralRenderer(renderer) ? renderer.createText(stringify$1(value)) :
            renderer.createTextNode(stringify$1(value));
    }
    function addRemoveViewFromContainer(viewToWalk, insertMode, beforeNode) {
        var renderParent = getContainerRenderParent(viewToWalk[TVIEW].node, viewToWalk);
        ngDevMode && assertNodeType(viewToWalk[TVIEW].node, 2 /* View */);
        if (renderParent) {
            var renderer = viewToWalk[RENDERER];
            walkTNodeTree(viewToWalk, insertMode ? 0 /* Insert */ : 1 /* Detach */, renderer, renderParent, beforeNode);
        }
    }
    /**
     * Traverses down and up the tree of views and containers to remove listeners and
     * call onDestroy callbacks.
     *
     * Notes:
     *  - Because it's used for onDestroy calls, it needs to be bottom-up.
     *  - Must process containers instead of their views to avoid splicing
     *  when views are destroyed and re-added.
     *  - Using a while loop because it's faster than recursion
     *  - Destroy only called on movement to sibling or movement to parent (laterally or up)
     *
     *  @param rootView The view to destroy
     */
    function destroyViewTree(rootView) {
        // If the view has no children, we can clean it up and return early.
        if (rootView[TVIEW].childIndex === -1) {
            return cleanUpView(rootView);
        }
        var viewOrContainer = getLViewChild(rootView);
        while (viewOrContainer) {
            var next = null;
            if (viewOrContainer.length >= HEADER_OFFSET) {
                // If LViewData, traverse down to child.
                var view = viewOrContainer;
                if (view[TVIEW].childIndex > -1)
                    next = getLViewChild(view);
            }
            else {
                // If container, traverse down to its first LViewData.
                var container = viewOrContainer;
                if (container[VIEWS].length)
                    next = container[VIEWS][0];
            }
            if (next == null) {
                // Only clean up view when moving to the side or up, as destroy hooks
                // should be called in order from the bottom up.
                while (viewOrContainer && !viewOrContainer[NEXT] && viewOrContainer !== rootView) {
                    cleanUpView(viewOrContainer);
                    viewOrContainer = getParentState(viewOrContainer, rootView);
                }
                cleanUpView(viewOrContainer || rootView);
                next = viewOrContainer && viewOrContainer[NEXT];
            }
            viewOrContainer = next;
        }
    }
    /**
     * Inserts a view into a container.
     *
     * This adds the view to the container's array of active views in the correct
     * position. It also adds the view's elements to the DOM if the container isn't a
     * root node of another view (in that case, the view's elements will be added when
     * the container's parent view is added later).
     *
     * @param lView The view to insert
     * @param lContainer The container into which the view should be inserted
     * @param parentView The new parent of the inserted view
     * @param index The index at which to insert the view
     * @param containerIndex The index of the container node, if dynamic
     */
    function insertView(lView, lContainer, parentView, index, containerIndex) {
        var views = lContainer[VIEWS];
        if (index > 0) {
            // This is a new view, we need to add it to the children.
            views[index - 1][NEXT] = lView;
        }
        if (index < views.length) {
            lView[NEXT] = views[index];
            views.splice(index, 0, lView);
        }
        else {
            views.push(lView);
            lView[NEXT] = null;
        }
        // Dynamically inserted views need a reference to their parent container's host so it's
        // possible to jump from a view to its container's next when walking the node tree.
        if (containerIndex > -1) {
            lView[CONTAINER_INDEX] = containerIndex;
            lView[PARENT] = parentView;
        }
        // Notify query that a new view has been added
        if (lView[QUERIES]) {
            lView[QUERIES].insertView(index);
        }
        // Sets the attached flag
        lView[FLAGS] |= 8 /* Attached */;
    }
    /**
     * Detaches a view from a container.
     *
     * This method splices the view from the container's array of active views. It also
     * removes the view's elements from the DOM.
     *
     * @param lContainer The container from which to detach a view
     * @param removeIndex The index of the view to detach
     * @param detached Whether or not this view is already detached.
     */
    function detachView(lContainer, removeIndex, detached) {
        var views = lContainer[VIEWS];
        var viewToDetach = views[removeIndex];
        if (removeIndex > 0) {
            views[removeIndex - 1][NEXT] = viewToDetach[NEXT];
        }
        views.splice(removeIndex, 1);
        if (!detached) {
            addRemoveViewFromContainer(viewToDetach, false);
        }
        if (viewToDetach[QUERIES]) {
            viewToDetach[QUERIES].removeView();
        }
        viewToDetach[CONTAINER_INDEX] = -1;
        viewToDetach[PARENT] = null;
        // Unsets the attached flag
        viewToDetach[FLAGS] &= ~8 /* Attached */;
    }
    /**
     * Removes a view from a container, i.e. detaches it and then destroys the underlying LView.
     *
     * @param lContainer The container from which to remove a view
     * @param tContainer The TContainer node associated with the LContainer
     * @param removeIndex The index of the view to remove
     */
    function removeView(lContainer, containerHost, removeIndex) {
        var view = lContainer[VIEWS][removeIndex];
        detachView(lContainer, removeIndex, !!containerHost.detached);
        destroyLView(view);
    }
    /** Gets the child of the given LViewData */
    function getLViewChild(viewData) {
        var childIndex = viewData[TVIEW].childIndex;
        return childIndex === -1 ? null : viewData[childIndex];
    }
    /**
     * A standalone function which destroys an LView,
     * conducting cleanup (e.g. removing listeners, calling onDestroys).
     *
     * @param view The view to be destroyed.
     */
    function destroyLView(view) {
        var renderer = view[RENDERER];
        if (isProceduralRenderer(renderer) && renderer.destroyNode) {
            walkTNodeTree(view, 2 /* Destroy */, renderer, null);
        }
        destroyViewTree(view);
        // Sets the destroyed flag
        view[FLAGS] |= 32 /* Destroyed */;
    }
    /**
     * Determines which LViewOrLContainer to jump to when traversing back up the
     * tree in destroyViewTree.
     *
     * Normally, the view's parent LView should be checked, but in the case of
     * embedded views, the container (which is the view node's parent, but not the
     * LView's parent) needs to be checked for a possible next property.
     *
     * @param state The LViewOrLContainer for which we need a parent state
     * @param rootView The rootView, so we don't propagate too far up the view tree
     * @returns The correct parent LViewOrLContainer
     */
    function getParentState(state, rootView) {
        var tNode;
        if (state.length >= HEADER_OFFSET && (tNode = state[HOST_NODE]) &&
            tNode.type === 2 /* View */) {
            // if it's an embedded view, the state needs to go up to the container, in case the
            // container has a next
            return getLContainer(tNode, state);
        }
        else {
            // otherwise, use parent view for containers or component views
            return state[PARENT] === rootView ? null : state[PARENT];
        }
    }
    /**
     * Removes all listeners and call all onDestroys in a given view.
     *
     * @param view The LViewData to clean up
     */
    function cleanUpView(viewOrContainer) {
        if (viewOrContainer.length >= HEADER_OFFSET) {
            var view = viewOrContainer;
            removeListeners(view);
            executeOnDestroys(view);
            executePipeOnDestroys(view);
            // For component views only, the local renderer is destroyed as clean up time.
            if (view[TVIEW].id === -1 && isProceduralRenderer(view[RENDERER])) {
                ngDevMode && ngDevMode.rendererDestroy++;
                view[RENDERER].destroy();
            }
        }
    }
    /** Removes listeners and unsubscribes from output subscriptions */
    function removeListeners(viewData) {
        var cleanup = viewData[TVIEW].cleanup;
        if (cleanup != null) {
            for (var i = 0; i < cleanup.length - 1; i += 2) {
                if (typeof cleanup[i] === 'string') {
                    // This is a listener with the native renderer
                    var native = readElementValue(viewData[cleanup[i + 1]]);
                    var listener = viewData[CLEANUP][cleanup[i + 2]];
                    native.removeEventListener(cleanup[i], listener, cleanup[i + 3]);
                    i += 2;
                }
                else if (typeof cleanup[i] === 'number') {
                    // This is a listener with renderer2 (cleanup fn can be found by index)
                    var cleanupFn = viewData[CLEANUP][cleanup[i]];
                    cleanupFn();
                }
                else {
                    // This is a cleanup function that is grouped with the index of its context
                    var context = viewData[CLEANUP][cleanup[i + 1]];
                    cleanup[i].call(context);
                }
            }
            viewData[CLEANUP] = null;
        }
    }
    /** Calls onDestroy hooks for this view */
    function executeOnDestroys(view) {
        var tView = view[TVIEW];
        var destroyHooks;
        if (tView != null && (destroyHooks = tView.destroyHooks) != null) {
            callHooks(view, destroyHooks);
        }
    }
    /** Calls pipe destroy hooks for this view */
    function executePipeOnDestroys(viewData) {
        var pipeDestroyHooks = viewData[TVIEW] && viewData[TVIEW].pipeDestroyHooks;
        if (pipeDestroyHooks) {
            callHooks(viewData, pipeDestroyHooks);
        }
    }
    function getRenderParent(tNode, currentView) {
        if (canInsertNativeNode(tNode, currentView)) {
            var hostTNode = currentView[HOST_NODE];
            return tNode.parent == null && hostTNode.type === 2 /* View */ ?
                getContainerRenderParent(hostTNode, currentView) :
                getParentNative(tNode, currentView);
        }
        return null;
    }
    function canInsertNativeChildOfElement(tNode) {
        // If the parent is null, then we are inserting across views. This happens when we
        // insert a root element of the component view into the component host element and it
        // should always be eager.
        if (tNode.parent == null ||
            // We should also eagerly insert if the parent is a regular, non-component element
            // since we know that this relationship will never be broken.
            tNode.parent.type === 3 /* Element */ && !(tNode.parent.flags & 4096 /* isComponent */)) {
            return true;
        }
        // Parent is a Component. Component's content nodes are not inserted immediately
        // because they will be projected, and so doing insert at this point would be wasteful.
        // Since the projection would than move it to its final destination.
        return false;
    }
    /**
     * We might delay insertion of children for a given view if it is disconnected.
     * This might happen for 2 main reasons:
     * - view is not inserted into any container (view was created but not inserted yet)
     * - view is inserted into a container but the container itself is not inserted into the DOM
     * (container might be part of projection or child of a view that is not inserted yet).
     *
     * In other words we can insert children of a given view if this view was inserted into a container
     * and
     * the container itself has its render parent determined.
     */
    function canInsertNativeChildOfView(viewTNode, view) {
        // Because we are inserting into a `View` the `View` may be disconnected.
        var container = getLContainer(viewTNode, view);
        if (container == null || container[RENDER_PARENT] == null) {
            // The `View` is not inserted into a `Container` or the parent `Container`
            // itself is disconnected. So we have to delay.
            return false;
        }
        // The parent `Container` is in inserted state, so we can eagerly insert into
        // this location.
        return true;
    }
    /**
     * Returns whether a native element can be inserted into the given parent.
     *
     * There are two reasons why we may not be able to insert a element immediately.
     * - Projection: When creating a child content element of a component, we have to skip the
     *   insertion because the content of a component will be projected.
     *   `<component><content>delayed due to projection</content></component>`
     * - Parent container is disconnected: This can happen when we are inserting a view into
     *   parent container, which itself is disconnected. For example the parent container is part
     *   of a View which has not be inserted or is mare for projection but has not been inserted
     *   into destination.
     *

     *
     * @param parent The parent where the child will be inserted into.
     * @param currentView Current LView being processed.
     * @return boolean Whether the child should be inserted now (or delayed until later).
     */
    function canInsertNativeNode(tNode, currentView) {
        var currentNode = tNode;
        var parent = tNode.parent;
        if (tNode.parent && tNode.parent.type === 4 /* ElementContainer */) {
            currentNode = getHighestElementContainer(tNode);
            parent = currentNode.parent;
        }
        if (parent === null)
            parent = currentView[HOST_NODE];
        if (parent && parent.type === 2 /* View */) {
            return canInsertNativeChildOfView(parent, currentView);
        }
        else {
            // Parent is a regular element or a component
            return canInsertNativeChildOfElement(currentNode);
        }
    }
    /**
     * Inserts a native node before another native node for a given parent using {@link Renderer3}.
     * This is a utility function that can be used when native nodes were determined - it abstracts an
     * actual renderer being used.
     */
    function nativeInsertBefore(renderer, parent, child, beforeNode) {
        if (isProceduralRenderer(renderer)) {
            renderer.insertBefore(parent, child, beforeNode);
        }
        else {
            parent.insertBefore(child, beforeNode, true);
        }
    }
    /**
     * Appends the `child` element to the `parent`.
     *
     * The element insertion might be delayed {@link canInsertNativeNode}.
     *
     * @param childEl The child that should be appended
     * @param childTNode The TNode of the child element
     * @param currentView The current LView
     * @returns Whether or not the child was appended
     */
    function appendChild(childEl, childTNode, currentView) {
        if (childEl !== null && canInsertNativeNode(childTNode, currentView)) {
            var renderer = currentView[RENDERER];
            var parentEl = getParentNative(childTNode, currentView);
            var parentTNode = childTNode.parent || currentView[HOST_NODE];
            if (parentTNode.type === 2 /* View */) {
                var lContainer = getLContainer(parentTNode, currentView);
                var views = lContainer[VIEWS];
                var index = views.indexOf(currentView);
                nativeInsertBefore(renderer, lContainer[RENDER_PARENT], childEl, getBeforeNodeForView(index, views, lContainer[NATIVE]));
            }
            else if (parentTNode.type === 4 /* ElementContainer */) {
                var elementContainer = getHighestElementContainer(childTNode);
                var renderParent = getRenderParent(elementContainer, currentView);
                nativeInsertBefore(renderer, renderParent, childEl, parentEl);
            }
            else {
                isProceduralRenderer(renderer) ? renderer.appendChild(parentEl, childEl) :
                    parentEl.appendChild(childEl);
            }
            return true;
        }
        return false;
    }
    /**
     * Gets the top-level ng-container if ng-containers are nested.
     *
     * @param ngContainer The TNode of the starting ng-container
     * @returns tNode The TNode of the highest level ng-container
     */
    function getHighestElementContainer(ngContainer) {
        while (ngContainer.parent != null && ngContainer.parent.type === 4 /* ElementContainer */) {
            ngContainer = ngContainer.parent;
        }
        return ngContainer;
    }
    function getBeforeNodeForView(index, views, containerNative) {
        if (index + 1 < views.length) {
            var view = views[index + 1];
            var viewTNode = view[HOST_NODE];
            return viewTNode.child ? getNativeByTNode(viewTNode.child, view) : containerNative;
        }
        else {
            return containerNative;
        }
    }
    /**
     * Removes the `child` element from the DOM if not in view and not projected.
     *
     * @param childTNode The TNode of the child to remove
     * @param childEl The child that should be removed
     * @param currentView The current LView
     * @returns Whether or not the child was removed
     */
    function removeChild(childTNode, childEl, currentView) {
        // We only remove the element if not in View or not projected.
        if (childEl !== null && canInsertNativeNode(childTNode, currentView)) {
            var parentNative = getParentNative(childTNode, currentView);
            var renderer = currentView[RENDERER];
            isProceduralRenderer(renderer) ? renderer.removeChild(parentNative, childEl) :
                parentNative.removeChild(childEl);
            return true;
        }
        return false;
    }
    /**
     * Appends a projected node to the DOM, or in the case of a projected container,
     * appends the nodes from all of the container's active views to the DOM.
     *
     * @param projectedTNode The TNode to be projected
     * @param tProjectionNode The projection (ng-content) TNode
     * @param currentView Current LView
     * @param projectionView Projection view (view above current)
     */
    function appendProjectedNode(projectedTNode, tProjectionNode, currentView, projectionView) {
        var native = getNativeByTNode(projectedTNode, projectionView);
        appendChild(native, tProjectionNode, currentView);
        // the projected contents are processed while in the shadow view (which is the currentView)
        // therefore we need to extract the view where the host element lives since it's the
        // logical container of the content projected views
        attachPatchData(native, projectionView);
        var renderParent = getRenderParent(tProjectionNode, currentView);
        var nodeOrContainer = projectionView[projectedTNode.index];
        if (projectedTNode.type === 0 /* Container */) {
            // The node we are adding is a container and we are adding it to an element which
            // is not a component (no more re-projection).
            // Alternatively a container is projected at the root of a component's template
            // and can't be re-projected (as not content of any component).
            // Assign the final projection location in those cases.
            nodeOrContainer[RENDER_PARENT] = renderParent;
            var views = nodeOrContainer[VIEWS];
            for (var i = 0; i < views.length; i++) {
                addRemoveViewFromContainer(views[i], true, nodeOrContainer[NATIVE]);
            }
        }
        else {
            if (projectedTNode.type === 4 /* ElementContainer */) {
                var ngContainerChildTNode = projectedTNode.child;
                while (ngContainerChildTNode) {
                    appendProjectedNode(ngContainerChildTNode, tProjectionNode, currentView, projectionView);
                    ngContainerChildTNode = ngContainerChildTNode.next;
                }
            }
            if (isLContainer(nodeOrContainer)) {
                nodeOrContainer[RENDER_PARENT] = renderParent;
                appendChild(nodeOrContainer[NATIVE], tProjectionNode, currentView);
            }
        }
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    function isCssClassMatching(nodeClassAttrVal, cssClassToMatch) {
        var nodeClassesLen = nodeClassAttrVal.length;
        var matchIndex = nodeClassAttrVal.indexOf(cssClassToMatch);
        var matchEndIdx = matchIndex + cssClassToMatch.length;
        if (matchIndex === -1 // no match
            || (matchIndex > 0 && nodeClassAttrVal[matchIndex - 1] !== ' ') // no space before
            ||
                (matchEndIdx < nodeClassesLen && nodeClassAttrVal[matchEndIdx] !== ' ')) // no space after
         {
            return false;
        }
        return true;
    }
    /**
     * A utility function to match an Ivy node static data against a simple CSS selector
     *
     * @param node static data to match
     * @param selector
     * @returns true if node matches the selector.
     */
    function isNodeMatchingSelector(tNode, selector) {
        ngDevMode && assertDefined(selector[0], 'Selector should have a tag name');
        var mode = 4 /* ELEMENT */;
        var nodeAttrs = tNode.attrs;
        var selectOnlyMarkerIdx = nodeAttrs ? nodeAttrs.indexOf(1 /* SelectOnly */) : -1;
        // When processing ":not" selectors, we skip to the next ":not" if the
        // current one doesn't match
        var skipToNextSelector = false;
        for (var i = 0; i < selector.length; i++) {
            var current = selector[i];
            if (typeof current === 'number') {
                // If we finish processing a :not selector and it hasn't failed, return false
                if (!skipToNextSelector && !isPositive(mode) && !isPositive(current)) {
                    return false;
                }
                // If we are skipping to the next :not() and this mode flag is positive,
                // it's a part of the current :not() selector, and we should keep skipping
                if (skipToNextSelector && isPositive(current))
                    continue;
                skipToNextSelector = false;
                mode = current | (mode & 1 /* NOT */);
                continue;
            }
            if (skipToNextSelector)
                continue;
            if (mode & 4 /* ELEMENT */) {
                mode = 2 /* ATTRIBUTE */ | mode & 1 /* NOT */;
                if (current !== '' && current !== tNode.tagName) {
                    if (isPositive(mode))
                        return false;
                    skipToNextSelector = true;
                }
            }
            else {
                var attrName = mode & 8 /* CLASS */ ? 'class' : current;
                var attrIndexInNode = findAttrIndexInNode(attrName, nodeAttrs);
                if (attrIndexInNode === -1) {
                    if (isPositive(mode))
                        return false;
                    skipToNextSelector = true;
                    continue;
                }
                var selectorAttrValue = mode & 8 /* CLASS */ ? current : selector[++i];
                if (selectorAttrValue !== '') {
                    var nodeAttrValue = void 0;
                    var maybeAttrName = nodeAttrs[attrIndexInNode];
                    if (selectOnlyMarkerIdx > -1 && attrIndexInNode > selectOnlyMarkerIdx) {
                        nodeAttrValue = '';
                    }
                    else {
                        ngDevMode && assertNotEqual(maybeAttrName, 0 /* NamespaceURI */, 'We do not match directives on namespaced attributes');
                        nodeAttrValue = nodeAttrs[attrIndexInNode + 1];
                    }
                    if (mode & 8 /* CLASS */ &&
                        !isCssClassMatching(nodeAttrValue, selectorAttrValue) ||
                        mode & 2 /* ATTRIBUTE */ && selectorAttrValue !== nodeAttrValue) {
                        if (isPositive(mode))
                            return false;
                        skipToNextSelector = true;
                    }
                }
            }
        }
        return isPositive(mode) || skipToNextSelector;
    }
    function isPositive(mode) {
        return (mode & 1 /* NOT */) === 0;
    }
    /**
     * Examines an attributes definition array from a node to find the index of the
     * attribute with the specified name.
     *
     * NOTE: Will not find namespaced attributes.
     *
     * @param name the name of the attribute to find
     * @param attrs the attribute array to examine
     */
    function findAttrIndexInNode(name, attrs) {
        if (attrs === null)
            return -1;
        var selectOnlyMode = false;
        var i = 0;
        while (i < attrs.length) {
            var maybeAttrName = attrs[i];
            if (maybeAttrName === name) {
                return i;
            }
            else if (maybeAttrName === 0 /* NamespaceURI */) {
                // NOTE(benlesh): will not find namespaced attributes. This is by design.
                i += 4;
            }
            else {
                if (maybeAttrName === 1 /* SelectOnly */) {
                    selectOnlyMode = true;
                }
                i += selectOnlyMode ? 1 : 2;
            }
        }
        return -1;
    }
    function isNodeMatchingSelectorList(tNode, selector) {
        for (var i = 0; i < selector.length; i++) {
            if (isNodeMatchingSelector(tNode, selector[i])) {
                return true;
            }
        }
        return false;
    }
    function getProjectAsAttrValue(tNode) {
        var nodeAttrs = tNode.attrs;
        if (nodeAttrs != null) {
            var ngProjectAsAttrIdx = nodeAttrs.indexOf(NG_PROJECT_AS_ATTR_NAME);
            // only check for ngProjectAs in attribute names, don't accidentally match attribute's value
            // (attribute names are stored at even indexes)
            if ((ngProjectAsAttrIdx & 1) === 0) {
                return nodeAttrs[ngProjectAsAttrIdx + 1];
            }
        }
        return null;
    }
    /**
     * Checks a given node against matching selectors and returns
     * selector index (or 0 if none matched).
     *
     * This function takes into account the ngProjectAs attribute: if present its value will be compared
     * to the raw (un-parsed) CSS selector instead of using standard selector matching logic.
     */
    function matchingSelectorIndex(tNode, selectors, textSelectors) {
        var ngProjectAsAttrVal = getProjectAsAttrValue(tNode);
        for (var i = 0; i < selectors.length; i++) {
            // if a node has the ngProjectAs attribute match it against unparsed selector
            // match a node against a parsed selector only if ngProjectAs attribute is not present
            if (ngProjectAsAttrVal === textSelectors[i] ||
                ngProjectAsAttrVal === null && isNodeMatchingSelectorList(tNode, selectors[i])) {
                return i + 1; // first matching selector "captures" a given node
            }
        }
        return 0;
    }

    /**
     * Combines the binding value and a factory for an animation player.
     *
     * Used to bind a player to an element template binding (currently only
     * `[style]`, `[style.prop]`, `[class]` and `[class.name]` bindings
     * supported). The provided `factoryFn` function will be run once all
     * the associated bindings have been evaluated on the element and is
     * designed to return a player which will then be placed on the element.
     *
     * @param factoryFn The function that is used to create a player
     *   once all the rendering-related (styling values) have been
     *   processed for the element binding.
     * @param value The raw value that will be exposed to the binding
     *   so that the binding can update its internal values when
     *   any changes are evaluated.
     */
    function bindPlayerFactory(factoryFn, value) {
        return new BoundPlayerFactory(factoryFn, value);
    }
    var BoundPlayerFactory = /** @class */ (function () {
        function BoundPlayerFactory(fn, value) {
            this.fn = fn;
            this.value = value;
        }
        return BoundPlayerFactory;
    }());

    var CorePlayerHandler = /** @class */ (function () {
        function CorePlayerHandler() {
            this._players = [];
        }
        CorePlayerHandler.prototype.flushPlayers = function () {
            for (var i = 0; i < this._players.length; i++) {
                var player = this._players[i];
                if (!player.parent && player.state === 0 /* Pending */) {
                    player.play();
                }
            }
            this._players.length = 0;
        };
        CorePlayerHandler.prototype.queuePlayer = function (player) { this._players.push(player); };
        return CorePlayerHandler;
    }());

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    function createEmptyStylingContext(element, sanitizer, initialStylingValues) {
        return [
            null,
            sanitizer || null,
            initialStylingValues || [null],
            0,
            0,
            element || null,
            null,
            null // PreviousMultiStyleValue
        ];
    }
    /**
     * Used clone a copy of a pre-computed template of a styling context.
     *
     * A pre-computed template is designed to be computed once for a given element
     * (instructions.ts has logic for caching this).
     */
    function allocStylingContext(element, templateStyleContext) {
        // each instance gets a copy
        var context = templateStyleContext.slice();
        context[5 /* ElementPosition */] = element;
        return context;
    }
    /**
     * Retrieve the `StylingContext` at a given index.
     *
     * This method lazily creates the `StylingContext`. This is because in most cases
     * we have styling without any bindings. Creating `StylingContext` eagerly would mean that
     * every style declaration such as `<div style="color: red">` would result `StyleContext`
     * which would create unnecessary memory pressure.
     *
     * @param index Index of the style allocation. See: `elementStyling`.
     * @param viewData The view to search for the styling context
     */
    function getStylingContext(index, viewData) {
        var storageIndex = index + HEADER_OFFSET;
        var slotValue = viewData[storageIndex];
        var wrapper = viewData;
        while (Array.isArray(slotValue)) {
            wrapper = slotValue;
            slotValue = slotValue[HOST];
        }
        if (isStylingContext(wrapper)) {
            return wrapper;
        }
        else {
            // This is an LViewData or an LContainer
            var stylingTemplate = getTNode(index, viewData).stylingTemplate;
            if (wrapper !== viewData) {
                storageIndex = HOST;
            }
            return wrapper[storageIndex] = stylingTemplate ?
                allocStylingContext(slotValue, stylingTemplate) :
                createEmptyStylingContext(slotValue);
        }
    }
    function isStylingContext(value) {
        // Not an LViewData or an LContainer
        return typeof value[FLAGS] !== 'number' && typeof value[ACTIVE_INDEX] !== 'number';
    }
    function addPlayerInternal(playerContext, rootContext, element, player, playerContextIndex, ref) {
        ref = ref || element;
        if (playerContextIndex) {
            playerContext[playerContextIndex] = player;
        }
        else {
            playerContext.push(player);
        }
        if (player) {
            player.addEventListener(200 /* Destroyed */, function () {
                var index = playerContext.indexOf(player);
                var nonFactoryPlayerIndex = playerContext[0 /* NonBuilderPlayersStart */];
                // if the player is being removed from the factory side of the context
                // (which is where the [style] and [class] bindings do their thing) then
                // that side of the array cannot be resized since the respective bindings
                // have pointer index values that point to the associated factory instance
                if (index) {
                    if (index < nonFactoryPlayerIndex) {
                        playerContext[index] = null;
                    }
                    else {
                        playerContext.splice(index, 1);
                    }
                }
                player.destroy();
            });
            var playerHandler = rootContext.playerHandler || (rootContext.playerHandler = new CorePlayerHandler());
            playerHandler.queuePlayer(player, ref);
            return true;
        }
        return false;
    }
    function getPlayersInternal(playerContext) {
        var players = [];
        var nonFactoryPlayersStart = playerContext[0 /* NonBuilderPlayersStart */];
        // add all factory-based players (which are apart of [style] and [class] bindings)
        for (var i = 1 /* PlayerBuildersStartPosition */ + 1 /* PlayerOffsetPosition */; i < nonFactoryPlayersStart; i += 2 /* PlayerAndPlayerBuildersTupleSize */) {
            var player = playerContext[i];
            if (player) {
                players.push(player);
            }
        }
        // add all custom players (not apart of [style] and [class] bindings)
        for (var i = nonFactoryPlayersStart; i < playerContext.length; i++) {
            players.push(playerContext[i]);
        }
        return players;
    }
    function getOrCreatePlayerContext(target, context) {
        context = context || getContext(target);
        if (!context) {
            ngDevMode && throwInvalidRefError();
            return null;
        }
        var lViewData = context.lViewData, nodeIndex = context.nodeIndex;
        var stylingContext = getStylingContext(nodeIndex - HEADER_OFFSET, lViewData);
        return getPlayerContext(stylingContext) || allocPlayerContext(stylingContext);
    }
    function getPlayerContext(stylingContext) {
        return stylingContext[0 /* PlayerContext */];
    }
    function allocPlayerContext(data) {
        return data[0 /* PlayerContext */] =
            [5 /* SinglePlayerBuildersStartPosition */, null, null, null, null];
    }
    function throwInvalidRefError() {
        throw new Error('Only elements that exist in an Angular application can be used for animations');
    }

    var EMPTY_ARR = [];
    var EMPTY_OBJ = {};
    /**
     * Creates a styling context template where styling information is stored.
     * Any styles that are later referenced using `updateStyleProp` must be
     * passed in within this function. Initial values for those styles are to
     * be declared after all initial style properties are declared (this change in
     * mode between declarations and initial styles is made possible using a special
     * enum value found in `definition.ts`).
     *
     * @param initialStyleDeclarations a list of style declarations and initial style values
     *    that are used later within the styling context.
     *
     *    -> ['width', 'height', SPECIAL_ENUM_VAL, 'width', '100px']
     *       This implies that `width` and `height` will be later styled and that the `width`
     *       property has an initial value of `100px`.
     *
     * @param initialClassDeclarations a list of class declarations and initial class values
     *    that are used later within the styling context.
     *
     *    -> ['foo', 'bar', SPECIAL_ENUM_VAL, 'foo', true]
     *       This implies that `foo` and `bar` will be later styled and that the `foo`
     *       class will be applied to the element as an initial class since it's true
     */
    function createStylingContextTemplate(initialClassDeclarations, initialStyleDeclarations, styleSanitizer) {
        var initialStylingValues = [null];
        var context = createEmptyStylingContext(null, styleSanitizer, initialStylingValues);
        // we use two maps since a class name might collide with a CSS style prop
        var stylesLookup = {};
        var classesLookup = {};
        var totalStyleDeclarations = 0;
        if (initialStyleDeclarations) {
            var hasPassedDeclarations = false;
            for (var i = 0; i < initialStyleDeclarations.length; i++) {
                var v = initialStyleDeclarations[i];
                // this flag value marks where the declarations end the initial values begin
                if (v === 1 /* VALUES_MODE */) {
                    hasPassedDeclarations = true;
                }
                else {
                    var prop = v;
                    if (hasPassedDeclarations) {
                        var value = initialStyleDeclarations[++i];
                        initialStylingValues.push(value);
                        stylesLookup[prop] = initialStylingValues.length - 1;
                    }
                    else {
                        totalStyleDeclarations++;
                        stylesLookup[prop] = 0;
                    }
                }
            }
        }
        // make where the class offsets begin
        context[4 /* ClassOffsetPosition */] = totalStyleDeclarations;
        if (initialClassDeclarations) {
            var hasPassedDeclarations = false;
            for (var i = 0; i < initialClassDeclarations.length; i++) {
                var v = initialClassDeclarations[i];
                // this flag value marks where the declarations end the initial values begin
                if (v === 1 /* VALUES_MODE */) {
                    hasPassedDeclarations = true;
                }
                else {
                    var className = v;
                    if (hasPassedDeclarations) {
                        var value = initialClassDeclarations[++i];
                        initialStylingValues.push(value);
                        classesLookup[className] = initialStylingValues.length - 1;
                    }
                    else {
                        classesLookup[className] = 0;
                    }
                }
            }
        }
        var styleProps = Object.keys(stylesLookup);
        var classNames = Object.keys(classesLookup);
        var classNamesIndexStart = styleProps.length;
        var totalProps = styleProps.length + classNames.length;
        // *2 because we are filling for both single and multi style spaces
        var maxLength = totalProps * 4 /* Size */ * 2 + 8 /* SingleStylesStartPosition */;
        // we need to fill the array from the start so that we can access
        // both the multi and the single array positions in the same loop block
        for (var i = 8 /* SingleStylesStartPosition */; i < maxLength; i++) {
            context.push(null);
        }
        var singleStart = 8 /* SingleStylesStartPosition */;
        var multiStart = totalProps * 4 /* Size */ + 8 /* SingleStylesStartPosition */;
        // fill single and multi-level styles
        for (var i = 0; i < totalProps; i++) {
            var isClassBased_1 = i >= classNamesIndexStart;
            var prop = isClassBased_1 ? classNames[i - classNamesIndexStart] : styleProps[i];
            var indexForInitial = isClassBased_1 ? classesLookup[prop] : stylesLookup[prop];
            var initialValue = initialStylingValues[indexForInitial];
            var indexForMulti = i * 4 /* Size */ + multiStart;
            var indexForSingle = i * 4 /* Size */ + singleStart;
            var initialFlag = prepareInitialFlag(prop, isClassBased_1, styleSanitizer || null);
            setFlag(context, indexForSingle, pointers(initialFlag, indexForInitial, indexForMulti));
            setProp(context, indexForSingle, prop);
            setValue(context, indexForSingle, null);
            setPlayerBuilderIndex(context, indexForSingle, 0);
            var flagForMulti = initialFlag | (initialValue !== null ? 1 /* Dirty */ : 0 /* None */);
            setFlag(context, indexForMulti, pointers(flagForMulti, indexForInitial, indexForSingle));
            setProp(context, indexForMulti, prop);
            setValue(context, indexForMulti, null);
            setPlayerBuilderIndex(context, indexForMulti, 0);
        }
        // there is no initial value flag for the master index since it doesn't
        // reference an initial style value
        setFlag(context, 3 /* MasterFlagPosition */, pointers(0, 0, multiStart));
        setContextDirty(context, initialStylingValues.length > 1);
        return context;
    }
    /**
     * Sets and resolves all `multi` styling on an `StylingContext` so that they can be
     * applied to the element once `renderStyleAndClassBindings` is called.
     *
     * All missing styles/class (any values that are not provided in the new `styles`
     * or `classes` params) will resolve to `null` within their respective positions
     * in the context.
     *
     * @param context The styling context that will be updated with the
     *    newly provided style values.
     * @param classesInput The key/value map of CSS class names that will be used for the update.
     * @param stylesInput The key/value map of CSS styles that will be used for the update.
     */
    function updateStylingMap(context, classesInput, stylesInput) {
        stylesInput = stylesInput || null;
        var element = context[5 /* ElementPosition */];
        var classesPlayerBuilder = classesInput instanceof BoundPlayerFactory ?
            new ClassAndStylePlayerBuilder(classesInput, element, 2 /* Class */) :
            null;
        var stylesPlayerBuilder = stylesInput instanceof BoundPlayerFactory ?
            new ClassAndStylePlayerBuilder(stylesInput, element, 3 /* Style */) :
            null;
        var classesValue = classesPlayerBuilder ?
            classesInput.value :
            classesInput;
        var stylesValue = stylesPlayerBuilder ? stylesInput.value : stylesInput;
        // early exit (this is what's done to avoid using ctx.bind() to cache the value)
        var ignoreAllClassUpdates = classesValue === context[6 /* PreviousMultiClassValue */];
        var ignoreAllStyleUpdates = stylesValue === context[7 /* PreviousMultiStyleValue */];
        if (ignoreAllClassUpdates && ignoreAllStyleUpdates)
            return;
        context[6 /* PreviousMultiClassValue */] = classesValue;
        context[7 /* PreviousMultiStyleValue */] = stylesValue;
        var classNames = EMPTY_ARR;
        var applyAllClasses = false;
        var playerBuildersAreDirty = false;
        var classesPlayerBuilderIndex = classesPlayerBuilder ? 1 /* ClassMapPlayerBuilderPosition */ : 0;
        if (hasPlayerBuilderChanged(context, classesPlayerBuilder, 1 /* ClassMapPlayerBuilderPosition */)) {
            setPlayerBuilder(context, classesPlayerBuilder, 1 /* ClassMapPlayerBuilderPosition */);
            playerBuildersAreDirty = true;
        }
        var stylesPlayerBuilderIndex = stylesPlayerBuilder ? 3 /* StyleMapPlayerBuilderPosition */ : 0;
        if (hasPlayerBuilderChanged(context, stylesPlayerBuilder, 3 /* StyleMapPlayerBuilderPosition */)) {
            setPlayerBuilder(context, stylesPlayerBuilder, 3 /* StyleMapPlayerBuilderPosition */);
            playerBuildersAreDirty = true;
        }
        // each time a string-based value pops up then it shouldn't require a deep
        // check of what's changed.
        if (!ignoreAllClassUpdates) {
            if (typeof classesValue == 'string') {
                classNames = classesValue.split(/\s+/);
                // this boolean is used to avoid having to create a key/value map of `true` values
                // since a classname string implies that all those classes are added
                applyAllClasses = true;
            }
            else {
                classNames = classesValue ? Object.keys(classesValue) : EMPTY_ARR;
            }
        }
        var classes = (classesValue || EMPTY_OBJ);
        var styleProps = stylesValue ? Object.keys(stylesValue) : EMPTY_ARR;
        var styles = stylesValue || EMPTY_OBJ;
        var classesStartIndex = styleProps.length;
        var multiStartIndex = getMultiStartIndex(context);
        var dirty = false;
        var ctxIndex = multiStartIndex;
        var propIndex = 0;
        var propLimit = styleProps.length + classNames.length;
        // the main loop here will try and figure out how the shape of the provided
        // styles differ with respect to the context. Later if the context/styles/classes
        // are off-balance then they will be dealt in another loop after this one
        while (ctxIndex < context.length && propIndex < propLimit) {
            var isClassBased_2 = propIndex >= classesStartIndex;
            var processValue = (!isClassBased_2 && !ignoreAllStyleUpdates) || (isClassBased_2 && !ignoreAllClassUpdates);
            // when there is a cache-hit for a string-based class then we should
            // avoid doing any work diffing any of the changes
            if (processValue) {
                var adjustedPropIndex = isClassBased_2 ? propIndex - classesStartIndex : propIndex;
                var newProp = isClassBased_2 ? classNames[adjustedPropIndex] : styleProps[adjustedPropIndex];
                var newValue = isClassBased_2 ? (applyAllClasses ? true : classes[newProp]) : styles[newProp];
                var playerBuilderIndex = isClassBased_2 ? classesPlayerBuilderIndex : stylesPlayerBuilderIndex;
                var prop = getProp(context, ctxIndex);
                if (prop === newProp) {
                    var value = getValue(context, ctxIndex);
                    var flag = getPointers(context, ctxIndex);
                    setPlayerBuilderIndex(context, ctxIndex, playerBuilderIndex);
                    if (hasValueChanged(flag, value, newValue)) {
                        setValue(context, ctxIndex, newValue);
                        playerBuildersAreDirty = playerBuildersAreDirty || !!playerBuilderIndex;
                        var initialValue = getInitialValue(context, flag);
                        // there is no point in setting this to dirty if the previously
                        // rendered value was being referenced by the initial style (or null)
                        if (hasValueChanged(flag, initialValue, newValue)) {
                            setDirty(context, ctxIndex, true);
                            dirty = true;
                        }
                    }
                }
                else {
                    var indexOfEntry = findEntryPositionByProp(context, newProp, ctxIndex);
                    if (indexOfEntry > 0) {
                        // it was found at a later point ... just swap the values
                        var valueToCompare = getValue(context, indexOfEntry);
                        var flagToCompare = getPointers(context, indexOfEntry);
                        swapMultiContextEntries(context, ctxIndex, indexOfEntry);
                        if (hasValueChanged(flagToCompare, valueToCompare, newValue)) {
                            var initialValue = getInitialValue(context, flagToCompare);
                            setValue(context, ctxIndex, newValue);
                            if (hasValueChanged(flagToCompare, initialValue, newValue)) {
                                setDirty(context, ctxIndex, true);
                                playerBuildersAreDirty = playerBuildersAreDirty || !!playerBuilderIndex;
                                dirty = true;
                            }
                        }
                    }
                    else {
                        // we only care to do this if the insertion is in the middle
                        var newFlag = prepareInitialFlag(newProp, isClassBased_2, getStyleSanitizer(context));
                        playerBuildersAreDirty = playerBuildersAreDirty || !!playerBuilderIndex;
                        insertNewMultiProperty(context, ctxIndex, isClassBased_2, newProp, newFlag, newValue, playerBuilderIndex);
                        dirty = true;
                    }
                }
            }
            ctxIndex += 4 /* Size */;
            propIndex++;
        }
        // this means that there are left-over values in the context that
        // were not included in the provided styles/classes and in this
        // case the  goal is to "remove" them from the context (by nullifying)
        while (ctxIndex < context.length) {
            var flag = getPointers(context, ctxIndex);
            var isClassBased_3 = (flag & 2 /* Class */) === 2 /* Class */;
            var processValue = (!isClassBased_3 && !ignoreAllStyleUpdates) || (isClassBased_3 && !ignoreAllClassUpdates);
            if (processValue) {
                var value = getValue(context, ctxIndex);
                var doRemoveValue = valueExists(value, isClassBased_3);
                if (doRemoveValue) {
                    setDirty(context, ctxIndex, true);
                    setValue(context, ctxIndex, null);
                    // we keep the player factory the same so that the `nulled` value can
                    // be instructed into the player because removing a style and/or a class
                    // is a valid animation player instruction.
                    var playerBuilderIndex = isClassBased_3 ? classesPlayerBuilderIndex : stylesPlayerBuilderIndex;
                    setPlayerBuilderIndex(context, ctxIndex, playerBuilderIndex);
                    dirty = true;
                }
            }
            ctxIndex += 4 /* Size */;
        }
        // this means that there are left-over properties in the context that
        // were not detected in the context during the loop above. In that
        // case we want to add the new entries into the list
        var sanitizer = getStyleSanitizer(context);
        while (propIndex < propLimit) {
            var isClassBased_4 = propIndex >= classesStartIndex;
            var processValue = (!isClassBased_4 && !ignoreAllStyleUpdates) || (isClassBased_4 && !ignoreAllClassUpdates);
            if (processValue) {
                var adjustedPropIndex = isClassBased_4 ? propIndex - classesStartIndex : propIndex;
                var prop = isClassBased_4 ? classNames[adjustedPropIndex] : styleProps[adjustedPropIndex];
                var value = isClassBased_4 ? (applyAllClasses ? true : classes[prop]) : styles[prop];
                var flag = prepareInitialFlag(prop, isClassBased_4, sanitizer) | 1 /* Dirty */;
                var playerBuilderIndex = isClassBased_4 ? classesPlayerBuilderIndex : stylesPlayerBuilderIndex;
                context.push(flag, prop, value, playerBuilderIndex);
                dirty = true;
            }
            propIndex++;
        }
        if (dirty) {
            setContextDirty(context, true);
        }
        if (playerBuildersAreDirty) {
            setContextPlayersDirty(context, true);
        }
    }
    /**
     * Sets and resolves a single styling property/value on the provided `StylingContext` so
     * that they can be applied to the element once `renderStyleAndClassBindings` is called.
     *
     * Note that prop-level styling values are considered higher priority than any styling that
     * has been applied using `updateStylingMap`, therefore, when styling values are rendered
     * then any styles/classes that have been applied using this function will be considered first
     * (then multi values second and then initial values as a backup).
     *
     * @param context The styling context that will be updated with the
     *    newly provided style value.
     * @param index The index of the property which is being updated.
     * @param value The CSS style value that will be assigned
     */
    function updateStyleProp(context, index, input) {
        var singleIndex = 8 /* SingleStylesStartPosition */ + index * 4 /* Size */;
        var currValue = getValue(context, singleIndex);
        var currFlag = getPointers(context, singleIndex);
        var value = (input instanceof BoundPlayerFactory) ? input.value : input;
        // didn't change ... nothing to make a note of
        if (hasValueChanged(currFlag, currValue, value)) {
            var isClassBased_5 = (currFlag & 2 /* Class */) === 2 /* Class */;
            var element = context[5 /* ElementPosition */];
            var playerBuilder = input instanceof BoundPlayerFactory ?
                new ClassAndStylePlayerBuilder(input, element, isClassBased_5 ? 2 /* Class */ : 3 /* Style */) :
                null;
            var value_1 = (playerBuilder ? input.value : input);
            var currPlayerIndex = getPlayerBuilderIndex(context, singleIndex);
            var playerBuildersAreDirty = false;
            var playerBuilderIndex = playerBuilder ? currPlayerIndex : 0;
            if (hasPlayerBuilderChanged(context, playerBuilder, currPlayerIndex)) {
                var newIndex = setPlayerBuilder(context, playerBuilder, currPlayerIndex);
                playerBuilderIndex = playerBuilder ? newIndex : 0;
                setPlayerBuilderIndex(context, singleIndex, playerBuilderIndex);
                playerBuildersAreDirty = true;
            }
            // the value will always get updated (even if the dirty flag is skipped)
            setValue(context, singleIndex, value_1);
            var indexForMulti = getMultiOrSingleIndex(currFlag);
            // if the value is the same in the multi-area then there's no point in re-assembling
            var valueForMulti = getValue(context, indexForMulti);
            if (!valueForMulti || hasValueChanged(currFlag, valueForMulti, value_1)) {
                var multiDirty = false;
                var singleDirty = true;
                // only when the value is set to `null` should the multi-value get flagged
                if (!valueExists(value_1, isClassBased_5) && valueExists(valueForMulti, isClassBased_5)) {
                    multiDirty = true;
                    singleDirty = false;
                }
                setDirty(context, indexForMulti, multiDirty);
                setDirty(context, singleIndex, singleDirty);
                setContextDirty(context, true);
            }
            if (playerBuildersAreDirty) {
                setContextPlayersDirty(context, true);
            }
        }
    }
    /**
     * This method will toggle the referenced CSS class (by the provided index)
     * within the given context.
     *
     * @param context The styling context that will be updated with the
     *    newly provided class value.
     * @param index The index of the CSS class which is being updated.
     * @param addOrRemove Whether or not to add or remove the CSS class
     */
    function updateClassProp(context, index, addOrRemove) {
        var adjustedIndex = index + context[4 /* ClassOffsetPosition */];
        updateStyleProp(context, adjustedIndex, addOrRemove);
    }
    /**
     * Renders all queued styling using a renderer onto the given element.
     *
     * This function works by rendering any styles (that have been applied
     * using `updateStylingMap`) and any classes (that have been applied using
     * `updateStyleProp`) onto the provided element using the provided renderer.
     * Just before the styles/classes are rendered a final key/value style map
     * will be assembled (if `styleStore` or `classStore` are provided).
     *
     * @param lElement the element that the styles will be rendered on
     * @param context The styling context that will be used to determine
     *      what styles will be rendered
     * @param renderer the renderer that will be used to apply the styling
     * @param classesStore if provided, the updated class values will be applied
     *    to this key/value map instead of being renderered via the renderer.
     * @param stylesStore if provided, the updated style values will be applied
     *    to this key/value map instead of being renderered via the renderer.
     * @returns number the total amount of players that got queued for animation (if any)
     */
    function renderStyleAndClassBindings(context, renderer, rootOrView, classesStore, stylesStore) {
        var totalPlayersQueued = 0;
        if (isContextDirty(context)) {
            var flushPlayerBuilders = context[3 /* MasterFlagPosition */] & 8 /* PlayerBuildersDirty */;
            var native = context[5 /* ElementPosition */];
            var multiStartIndex = getMultiStartIndex(context);
            var styleSanitizer = getStyleSanitizer(context);
            for (var i = 8 /* SingleStylesStartPosition */; i < context.length; i += 4 /* Size */) {
                // there is no point in rendering styles that have not changed on screen
                if (isDirty(context, i)) {
                    var prop = getProp(context, i);
                    var value = getValue(context, i);
                    var flag = getPointers(context, i);
                    var playerBuilder = getPlayerBuilder(context, i);
                    var isClassBased_6 = flag & 2 /* Class */ ? true : false;
                    var isInSingleRegion = i < multiStartIndex;
                    var valueToApply = value;
                    // VALUE DEFER CASE 1: Use a multi value instead of a null single value
                    // this check implies that a single value was removed and we
                    // should now defer to a multi value and use that (if set).
                    if (isInSingleRegion && !valueExists(valueToApply, isClassBased_6)) {
                        // single values ALWAYS have a reference to a multi index
                        var multiIndex = getMultiOrSingleIndex(flag);
                        valueToApply = getValue(context, multiIndex);
                    }
                    // VALUE DEFER CASE 2: Use the initial value if all else fails (is falsy)
                    // the initial value will always be a string or null,
                    // therefore we can safely adopt it incase there's nothing else
                    // note that this should always be a falsy check since `false` is used
                    // for both class and style comparisons (styles can't be false and false
                    // classes are turned off and should therefore defer to their initial values)
                    if (!valueExists(valueToApply, isClassBased_6)) {
                        valueToApply = getInitialValue(context, flag);
                    }
                    if (isClassBased_6) {
                        setClass(native, prop, valueToApply ? true : false, renderer, classesStore, playerBuilder);
                    }
                    else {
                        var sanitizer = (flag & 4 /* Sanitize */) ? styleSanitizer : null;
                        setStyle(native, prop, valueToApply, renderer, sanitizer, stylesStore, playerBuilder);
                    }
                    setDirty(context, i, false);
                }
            }
            if (flushPlayerBuilders) {
                var rootContext = Array.isArray(rootOrView) ? getRootContext(rootOrView) : rootOrView;
                var playerContext = getPlayerContext(context);
                var playersStartIndex = playerContext[0 /* NonBuilderPlayersStart */];
                for (var i = 1 /* PlayerBuildersStartPosition */; i < playersStartIndex; i += 2 /* PlayerAndPlayerBuildersTupleSize */) {
                    var builder = playerContext[i];
                    var playerInsertionIndex = i + 1 /* PlayerOffsetPosition */;
                    var oldPlayer = playerContext[playerInsertionIndex];
                    if (builder) {
                        var player = builder.buildPlayer(oldPlayer);
                        if (player !== undefined) {
                            if (player != null) {
                                var wasQueued = addPlayerInternal(playerContext, rootContext, native, player, playerInsertionIndex);
                                wasQueued && totalPlayersQueued++;
                            }
                            if (oldPlayer) {
                                oldPlayer.destroy();
                            }
                        }
                    }
                    else if (oldPlayer) {
                        // the player builder has been removed ... therefore we should delete the associated
                        // player
                        oldPlayer.destroy();
                    }
                }
                setContextPlayersDirty(context, false);
            }
            setContextDirty(context, false);
        }
        return totalPlayersQueued;
    }
    /**
     * This function renders a given CSS prop/value entry using the
     * provided renderer. If a `store` value is provided then
     * that will be used a render context instead of the provided
     * renderer.
     *
     * @param native the DOM Element
     * @param prop the CSS style property that will be rendered
     * @param value the CSS style value that will be rendered
     * @param renderer
     * @param store an optional key/value map that will be used as a context to render styles on
     */
    function setStyle(native, prop, value, renderer, sanitizer, store, playerBuilder) {
        value = sanitizer && value ? sanitizer(prop, value) : value;
        if (store || playerBuilder) {
            if (store) {
                store.setValue(prop, value);
            }
            if (playerBuilder) {
                playerBuilder.setValue(prop, value);
            }
        }
        else if (value) {
            ngDevMode && ngDevMode.rendererSetStyle++;
            isProceduralRenderer(renderer) ?
                renderer.setStyle(native, prop, value, RendererStyleFlags3.DashCase) :
                native['style'].setProperty(prop, value);
        }
        else {
            ngDevMode && ngDevMode.rendererRemoveStyle++;
            isProceduralRenderer(renderer) ?
                renderer.removeStyle(native, prop, RendererStyleFlags3.DashCase) :
                native['style'].removeProperty(prop);
        }
    }
    /**
     * This function renders a given CSS class value using the provided
     * renderer (by adding or removing it from the provided element).
     * If a `store` value is provided then that will be used a render
     * context instead of the provided renderer.
     *
     * @param native the DOM Element
     * @param prop the CSS style property that will be rendered
     * @param value the CSS style value that will be rendered
     * @param renderer
     * @param store an optional key/value map that will be used as a context to render styles on
     */
    function setClass(native, className, add, renderer, store, playerBuilder) {
        if (store || playerBuilder) {
            if (store) {
                store.setValue(className, add);
            }
            if (playerBuilder) {
                playerBuilder.setValue(className, add);
            }
        }
        else if (add) {
            ngDevMode && ngDevMode.rendererAddClass++;
            isProceduralRenderer(renderer) ? renderer.addClass(native, className) :
                native['classList'].add(className);
        }
        else {
            ngDevMode && ngDevMode.rendererRemoveClass++;
            isProceduralRenderer(renderer) ? renderer.removeClass(native, className) :
                native['classList'].remove(className);
        }
    }
    function setDirty(context, index, isDirtyYes) {
        var adjustedIndex = index >= 8 /* SingleStylesStartPosition */ ? (index + 0 /* FlagsOffset */) : index;
        if (isDirtyYes) {
            context[adjustedIndex] |= 1 /* Dirty */;
        }
        else {
            context[adjustedIndex] &= ~1 /* Dirty */;
        }
    }
    function isDirty(context, index) {
        var adjustedIndex = index >= 8 /* SingleStylesStartPosition */ ? (index + 0 /* FlagsOffset */) : index;
        return (context[adjustedIndex] & 1 /* Dirty */) == 1 /* Dirty */;
    }
    function isClassBased(context, index) {
        var adjustedIndex = index >= 8 /* SingleStylesStartPosition */ ? (index + 0 /* FlagsOffset */) : index;
        return (context[adjustedIndex] & 2 /* Class */) == 2 /* Class */;
    }
    function isSanitizable(context, index) {
        var adjustedIndex = index >= 8 /* SingleStylesStartPosition */ ? (index + 0 /* FlagsOffset */) : index;
        return (context[adjustedIndex] & 4 /* Sanitize */) == 4 /* Sanitize */;
    }
    function pointers(configFlag, staticIndex, dynamicIndex) {
        return (configFlag & 15 /* BitMask */) | (staticIndex << 4 /* BitCountSize */) |
            (dynamicIndex << (14 /* BitCountSize */ + 4 /* BitCountSize */));
    }
    function getInitialValue(context, flag) {
        var index = getInitialIndex(flag);
        return context[2 /* InitialStylesPosition */][index];
    }
    function getInitialIndex(flag) {
        return (flag >> 4 /* BitCountSize */) & 16383 /* BitMask */;
    }
    function getMultiOrSingleIndex(flag) {
        var index = (flag >> (14 /* BitCountSize */ + 4 /* BitCountSize */)) & 16383 /* BitMask */;
        return index >= 8 /* SingleStylesStartPosition */ ? index : -1;
    }
    function getMultiStartIndex(context) {
        return getMultiOrSingleIndex(context[3 /* MasterFlagPosition */]);
    }
    function getStyleSanitizer(context) {
        return context[1 /* StyleSanitizerPosition */];
    }
    function setProp(context, index, prop) {
        context[index + 1 /* PropertyOffset */] = prop;
    }
    function setValue(context, index, value) {
        context[index + 2 /* ValueOffset */] = value;
    }
    function hasPlayerBuilderChanged(context, builder, index) {
        var playerContext = context[0 /* PlayerContext */];
        if (builder) {
            if (!playerContext || index === 0) {
                return true;
            }
        }
        else if (!playerContext) {
            return false;
        }
        return playerContext[index] !== builder;
    }
    function setPlayerBuilder(context, builder, insertionIndex) {
        var playerContext = context[0 /* PlayerContext */] || allocPlayerContext(context);
        if (insertionIndex > 0) {
            playerContext[insertionIndex] = builder;
        }
        else {
            insertionIndex = playerContext[0 /* NonBuilderPlayersStart */];
            playerContext.splice(insertionIndex, 0, builder, null);
            playerContext[0 /* NonBuilderPlayersStart */] +=
                2 /* PlayerAndPlayerBuildersTupleSize */;
        }
        return insertionIndex;
    }
    function setPlayerBuilderIndex(context, index, playerBuilderIndex) {
        context[index + 3 /* PlayerBuilderIndexOffset */] = playerBuilderIndex;
    }
    function getPlayerBuilderIndex(context, index) {
        return context[index + 3 /* PlayerBuilderIndexOffset */] || 0;
    }
    function getPlayerBuilder(context, index) {
        var playerBuilderIndex = getPlayerBuilderIndex(context, index);
        if (playerBuilderIndex) {
            var playerContext = context[0 /* PlayerContext */];
            if (playerContext) {
                return playerContext[playerBuilderIndex];
            }
        }
        return null;
    }
    function setFlag(context, index, flag) {
        var adjustedIndex = index === 3 /* MasterFlagPosition */ ? index : (index + 0 /* FlagsOffset */);
        context[adjustedIndex] = flag;
    }
    function getPointers(context, index) {
        var adjustedIndex = index === 3 /* MasterFlagPosition */ ? index : (index + 0 /* FlagsOffset */);
        return context[adjustedIndex];
    }
    function getValue(context, index) {
        return context[index + 2 /* ValueOffset */];
    }
    function getProp(context, index) {
        return context[index + 1 /* PropertyOffset */];
    }
    function isContextDirty(context) {
        return isDirty(context, 3 /* MasterFlagPosition */);
    }
    function setContextDirty(context, isDirtyYes) {
        setDirty(context, 3 /* MasterFlagPosition */, isDirtyYes);
    }
    function setContextPlayersDirty(context, isDirtyYes) {
        if (isDirtyYes) {
            context[3 /* MasterFlagPosition */] |= 8 /* PlayerBuildersDirty */;
        }
        else {
            context[3 /* MasterFlagPosition */] &= ~8 /* PlayerBuildersDirty */;
        }
    }
    function findEntryPositionByProp(context, prop, startIndex) {
        for (var i = (startIndex || 0) + 1 /* PropertyOffset */; i < context.length; i += 4 /* Size */) {
            var thisProp = context[i];
            if (thisProp == prop) {
                return i - 1 /* PropertyOffset */;
            }
        }
        return -1;
    }
    function swapMultiContextEntries(context, indexA, indexB) {
        var tmpValue = getValue(context, indexA);
        var tmpProp = getProp(context, indexA);
        var tmpFlag = getPointers(context, indexA);
        var tmpPlayerBuilderIndex = getPlayerBuilderIndex(context, indexA);
        var flagA = tmpFlag;
        var flagB = getPointers(context, indexB);
        var singleIndexA = getMultiOrSingleIndex(flagA);
        if (singleIndexA >= 0) {
            var _flag = getPointers(context, singleIndexA);
            var _initial = getInitialIndex(_flag);
            setFlag(context, singleIndexA, pointers(_flag, _initial, indexB));
        }
        var singleIndexB = getMultiOrSingleIndex(flagB);
        if (singleIndexB >= 0) {
            var _flag = getPointers(context, singleIndexB);
            var _initial = getInitialIndex(_flag);
            setFlag(context, singleIndexB, pointers(_flag, _initial, indexA));
        }
        setValue(context, indexA, getValue(context, indexB));
        setProp(context, indexA, getProp(context, indexB));
        setFlag(context, indexA, getPointers(context, indexB));
        setPlayerBuilderIndex(context, indexA, getPlayerBuilderIndex(context, indexB));
        setValue(context, indexB, tmpValue);
        setProp(context, indexB, tmpProp);
        setFlag(context, indexB, tmpFlag);
        setPlayerBuilderIndex(context, indexB, tmpPlayerBuilderIndex);
    }
    function updateSinglePointerValues(context, indexStartPosition) {
        for (var i = indexStartPosition; i < context.length; i += 4 /* Size */) {
            var multiFlag = getPointers(context, i);
            var singleIndex = getMultiOrSingleIndex(multiFlag);
            if (singleIndex > 0) {
                var singleFlag = getPointers(context, singleIndex);
                var initialIndexForSingle = getInitialIndex(singleFlag);
                var flagValue = (isDirty(context, singleIndex) ? 1 /* Dirty */ : 0 /* None */) |
                    (isClassBased(context, singleIndex) ? 2 /* Class */ : 0 /* None */) |
                    (isSanitizable(context, singleIndex) ? 4 /* Sanitize */ : 0 /* None */);
                var updatedFlag = pointers(flagValue, initialIndexForSingle, i);
                setFlag(context, singleIndex, updatedFlag);
            }
        }
    }
    function insertNewMultiProperty(context, index, classBased, name, flag, value, playerIndex) {
        var doShift = index < context.length;
        // prop does not exist in the list, add it in
        context.splice(index, 0, flag | 1 /* Dirty */ | (classBased ? 2 /* Class */ : 0 /* None */), name, value, playerIndex);
        if (doShift) {
            // because the value was inserted midway into the array then we
            // need to update all the shifted multi values' single value
            // pointers to point to the newly shifted location
            updateSinglePointerValues(context, index + 4 /* Size */);
        }
    }
    function valueExists(value, isClassBased) {
        if (isClassBased) {
            return value ? true : false;
        }
        return value !== null;
    }
    function prepareInitialFlag(name, isClassBased, sanitizer) {
        if (isClassBased) {
            return 2 /* Class */;
        }
        else if (sanitizer && sanitizer(name)) {
            return 4 /* Sanitize */;
        }
        return 0 /* None */;
    }
    function hasValueChanged(flag, a, b) {
        var isClassBased = flag & 2 /* Class */;
        var hasValues = a && b;
        var usesSanitizer = flag & 4 /* Sanitize */;
        // the toString() comparison ensures that a value is checked
        // ... otherwise (during sanitization bypassing) the === comparsion
        // would fail since a new String() instance is created
        if (!isClassBased && hasValues && usesSanitizer) {
            // we know for sure we're dealing with strings at this point
            return a.toString() !== b.toString();
        }
        // everything else is safe to check with a normal equality check
        return a !== b;
    }
    var ClassAndStylePlayerBuilder = /** @class */ (function () {
        function ClassAndStylePlayerBuilder(factory, _element, _type) {
            this._element = _element;
            this._type = _type;
            this._values = {};
            this._dirty = false;
            this._factory = factory;
        }
        ClassAndStylePlayerBuilder.prototype.setValue = function (prop, value) {
            if (this._values[prop] !== value) {
                this._values[prop] = value;
                this._dirty = true;
            }
        };
        ClassAndStylePlayerBuilder.prototype.buildPlayer = function (currentPlayer) {
            // if no values have been set here then this means the binding didn't
            // change and therefore the binding values were not updated through
            // `setValue` which means no new player will be provided.
            if (this._dirty) {
                var player = this._factory.fn(this._element, this._type, this._values, currentPlayer || null);
                this._values = {};
                this._dirty = false;
                return player;
            }
            return undefined;
        };
        return ClassAndStylePlayerBuilder;
    }());

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * A permanent marker promise which signifies that the current CD tree is
     * clean.
     */
    var _CLEAN_PROMISE = Promise.resolve(null);
    /**
     * Token set in currentMatches while dependencies are being resolved.
     *
     * If we visit a directive that has a value set to CIRCULAR, we know we've
     * already seen it, and thus have a circular dependency.
     */
    var CIRCULAR$1 = '__CIRCULAR__';
    /**
     * This property gets set before entering a template.
     *
     * This renderer can be one of two varieties of Renderer3:
     *
     * - ObjectedOrientedRenderer3
     *
     * This is the native browser API style, e.g. operations are methods on individual objects
     * like HTMLElement. With this style, no additional code is needed as a facade (reducing payload
     * size).
     *
     * - ProceduralRenderer3
     *
     * In non-native browser environments (e.g. platforms such as web-workers), this is the facade
     * that enables element manipulation. This also facilitates backwards compatibility with
     * Renderer2.
     */
    var renderer;
    function getRenderer() {
        // top level variables should not be exported for performance reasons (PERF_NOTES.md)
        return renderer;
    }
    var rendererFactory;
    function getRendererFactory() {
        // top level variables should not be exported for performance reasons (PERF_NOTES.md)
        return rendererFactory;
    }
    function getCurrentSanitizer() {
        return viewData && viewData[SANITIZER];
    }
    /**
     * Store the element depth count. This is used to identify the root elements of the template
     * so that we can than attach `LViewData` to only those elements.
     */
    var elementDepthCount;
    /**
     * Stores whether directives should be matched to elements.
     *
     * When template contains `ngNonBindable` than we need to prevent the runtime form matching
     * directives on children of that element.
     *
     * Example:
     * ```
     * <my-comp my-directive>
     *   Should match component / directive.
     * </my-comp>
     * <div ngNonBindable>
     *   <my-comp my-directive>
     *     Should not match component / directive because we are in ngNonBindable.
     *   </my-comp>
     * </div>
     * ```
     */
    var bindingsEnabled;
    /**
     * Returns the current OpaqueViewState instance.
     *
     * Used in conjunction with the restoreView() instruction to save a snapshot
     * of the current view and restore it when listeners are invoked. This allows
     * walking the declaration view tree in listeners to get vars from parent views.
     */
    function getCurrentView() {
        return viewData;
    }
    /**
     * Restores `contextViewData` to the given OpaqueViewState instance.
     *
     * Used in conjunction with the getCurrentView() instruction to save a snapshot
     * of the current view and restore it when listeners are invoked. This allows
     * walking the declaration view tree in listeners to get vars from parent views.
     *
     * @param viewToRestore The OpaqueViewState instance to restore.
     */
    function restoreView(viewToRestore) {
        contextViewData = viewToRestore;
    }
    /** Used to set the parent property when nodes are created and track query results. */
    var previousOrParentTNode;
    function getPreviousOrParentTNode() {
        // top level variables should not be exported for performance reasons (PERF_NOTES.md)
        return previousOrParentTNode;
    }
    function setEnvironment(tNode, view) {
        previousOrParentTNode = tNode;
        viewData = view;
    }
    /**
     * If `isParent` is:
     *  - `true`: then `previousOrParentTNode` points to a parent node.
     *  - `false`: then `previousOrParentTNode` points to previous node (sibling).
     */
    var isParent;
    var tView;
    var currentQueries;
    /**
     * Query instructions can ask for "current queries" in 2 different cases:
     * - when creating view queries (at the root of a component view, before any node is created - in
     * this case currentQueries points to view queries)
     * - when creating content queries (i.e. this previousOrParentTNode points to a node on which we
     * create content queries).
     */
    function getOrCreateCurrentQueries(QueryType) {
        // if this is the first content query on a node, any existing LQueries needs to be cloned
        // in subsequent template passes, the cloning occurs before directive instantiation.
        if (previousOrParentTNode && previousOrParentTNode !== viewData[HOST_NODE] &&
            !isContentQueryHost(previousOrParentTNode)) {
            currentQueries && (currentQueries = currentQueries.clone());
            previousOrParentTNode.flags |= 16384 /* hasContentQuery */;
        }
        return currentQueries || (currentQueries = new QueryType(null, null, null));
    }
    /**
     * This property gets set before entering a template.
     */
    var creationMode;
    function getCreationMode() {
        // top level variables should not be exported for performance reasons (PERF_NOTES.md)
        return creationMode;
    }
    /**
     * State of the current view being processed.
     *
     * An array of nodes (text, element, container, etc), pipes, their bindings, and
     * any local variables that need to be stored between invocations.
     */
    var viewData;
    /**
     * Internal function that returns the current LViewData instance.
     *
     * The getCurrentView() instruction should be used for anything public.
     */
    function _getViewData() {
        // top level variables should not be exported for performance reasons (PERF_NOTES.md)
        return viewData;
    }
    /**
     * The last viewData retrieved by nextContext().
     * Allows building nextContext() and reference() calls.
     *
     * e.g. const inner = x().$implicit; const outer = x().$implicit;
     */
    var contextViewData = null;
    function getCleanup(view) {
        // top level variables should not be exported for performance reasons (PERF_NOTES.md)
        return view[CLEANUP] || (view[CLEANUP] = []);
    }
    function getTViewCleanup(view) {
        return view[TVIEW].cleanup || (view[TVIEW].cleanup = []);
    }
    /**
     * In this mode, any changes in bindings will throw an ExpressionChangedAfterChecked error.
     *
     * Necessary to support ChangeDetectorRef.checkNoChanges().
     */
    var checkNoChangesMode = false;
    /** Whether or not this is the first time the current view has been processed. */
    var firstTemplatePass = true;
    /**
     * The root index from which pure function instructions should calculate their binding
     * indices. In component views, this is TView.bindingStartIndex. In a host binding
     * context, this is the TView.expandoStartIndex + any dirs/hostVars before the given dir.
     */
    var bindingRootIndex = -1;
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    function getBindingRoot() {
        return bindingRootIndex;
    }
    /**
     * Swap the current state with a new state.
     *
     * For performance reasons we store the state in the top level of the module.
     * This way we minimize the number of properties to read. Whenever a new view
     * is entered we have to store the state for later, and when the view is
     * exited the state has to be restored
     *
     * @param newView New state to become active
     * @param host Element to which the View is a child of
     * @returns the previous state;
     */
    function enterView(newView, hostTNode) {
        var oldView = viewData;
        tView = newView && newView[TVIEW];
        creationMode = newView && (newView[FLAGS] & 1 /* CreationMode */) === 1 /* CreationMode */;
        firstTemplatePass = newView && tView.firstTemplatePass;
        bindingRootIndex = newView && tView.bindingStartIndex;
        renderer = newView && newView[RENDERER];
        previousOrParentTNode = hostTNode;
        isParent = true;
        viewData = contextViewData = newView;
        oldView && (oldView[QUERIES] = currentQueries);
        currentQueries = newView && newView[QUERIES];
        return oldView;
    }
    /**
     * Used in lieu of enterView to make it clear when we are exiting a child view. This makes
     * the direction of traversal (up or down the view tree) a bit clearer.
     *
     * @param newView New state to become active
     * @param creationOnly An optional boolean to indicate that the view was processed in creation mode
     * only, i.e. the first update will be done later. Only possible for dynamically created views.
     */
    function leaveView(newView, creationOnly) {
        if (!creationOnly) {
            if (!checkNoChangesMode) {
                executeHooks(viewData, tView.viewHooks, tView.viewCheckHooks, creationMode);
            }
            // Views are clean and in update mode after being checked, so these bits are cleared
            viewData[FLAGS] &= ~(1 /* CreationMode */ | 4 /* Dirty */);
        }
        viewData[FLAGS] |= 16 /* RunInit */;
        viewData[BINDING_INDEX] = tView.bindingStartIndex;
        enterView(newView, null);
    }
    /**
     * Refreshes the view, executing the following steps in that order:
     * triggers init hooks, refreshes dynamic embedded views, triggers content hooks, sets host
     * bindings, refreshes child components.
     * Note: view hooks are triggered later when leaving the view.
     */
    function refreshDescendantViews() {
        setHostBindings();
        var parentFirstTemplatePass = firstTemplatePass;
        // This needs to be set before children are processed to support recursive components
        tView.firstTemplatePass = firstTemplatePass = false;
        if (!checkNoChangesMode) {
            executeInitHooks(viewData, tView, creationMode);
        }
        refreshDynamicEmbeddedViews(viewData);
        // Content query results must be refreshed before content hooks are called.
        refreshContentQueries(tView);
        if (!checkNoChangesMode) {
            executeHooks(viewData, tView.contentHooks, tView.contentCheckHooks, creationMode);
        }
        refreshChildComponents(tView.components, parentFirstTemplatePass);
    }
    /** Sets the host bindings for the current view. */
    function setHostBindings() {
        if (tView.expandoInstructions) {
            bindingRootIndex = viewData[BINDING_INDEX] = tView.expandoStartIndex;
            var currentDirectiveIndex = -1;
            var currentElementIndex = -1;
            for (var i = 0; i < tView.expandoInstructions.length; i++) {
                var instruction = tView.expandoInstructions[i];
                if (typeof instruction === 'number') {
                    if (instruction <= 0) {
                        // Negative numbers mean that we are starting new EXPANDO block and need to update
                        // the current element and directive index.
                        currentElementIndex = -instruction;
                        if (typeof viewData[bindingRootIndex] === 'number') {
                            // We've hit an injector. It may or may not exist depending on whether
                            // there is a public directive on this node.
                            bindingRootIndex += INJECTOR_SIZE;
                        }
                        currentDirectiveIndex = bindingRootIndex;
                    }
                    else {
                        // This is either the injector size (so the binding root can skip over directives
                        // and get to the first set of host bindings on this node) or the host var count
                        // (to get to the next set of host bindings on this node).
                        bindingRootIndex += instruction;
                    }
                }
                else {
                    // If it's not a number, it's a host binding function that needs to be executed.
                    viewData[BINDING_INDEX] = bindingRootIndex;
                    // We must subtract the header offset because the load() instruction
                    // expects a raw, unadjusted index.
                    instruction(currentDirectiveIndex - HEADER_OFFSET, currentElementIndex);
                    currentDirectiveIndex++;
                }
            }
        }
    }
    /** Refreshes content queries for all directives in the given view. */
    function refreshContentQueries(tView) {
        if (tView.contentQueries != null) {
            for (var i = 0; i < tView.contentQueries.length; i += 2) {
                var directiveDefIdx = tView.contentQueries[i];
                var directiveDef = tView.data[directiveDefIdx];
                directiveDef.contentQueriesRefresh(directiveDefIdx - HEADER_OFFSET, tView.contentQueries[i + 1]);
            }
        }
    }
    /** Refreshes child components in the current view. */
    function refreshChildComponents(components, parentFirstTemplatePass) {
        if (components != null) {
            for (var i = 0; i < components.length; i++) {
                componentRefresh(components[i], parentFirstTemplatePass);
            }
        }
    }
    function executeInitAndContentHooks() {
        if (!checkNoChangesMode) {
            executeInitHooks(viewData, tView, creationMode);
            executeHooks(viewData, tView.contentHooks, tView.contentCheckHooks, creationMode);
        }
    }
    function createLViewData(renderer, tView, context, flags, sanitizer) {
        var instance = tView.blueprint.slice();
        instance[FLAGS] = flags | 1 /* CreationMode */ | 8 /* Attached */ | 16 /* RunInit */;
        instance[PARENT] = instance[DECLARATION_VIEW] = viewData;
        instance[CONTEXT] = context;
        instance[INJECTOR$1] = viewData ? viewData[INJECTOR$1] : null;
        instance[RENDERER] = renderer;
        instance[SANITIZER] = sanitizer || null;
        return instance;
    }
    function createNodeAtIndex(index, type, native, name, attrs) {
        var adjustedIndex = index + HEADER_OFFSET;
        ngDevMode &&
            assertLessThan(adjustedIndex, viewData.length, "Slot should have been initialized with null");
        viewData[adjustedIndex] = native;
        var tNode = tView.data[adjustedIndex];
        if (tNode == null) {
            tNode = tView.data[adjustedIndex] = createTNode(type, adjustedIndex, name, attrs, null);
            // Now link ourselves into the tree.
            if (previousOrParentTNode) {
                if (isParent && previousOrParentTNode.child == null &&
                    (tNode.parent !== null || previousOrParentTNode.type === 2 /* View */)) {
                    // We are in the same view, which means we are adding content node to the parent view.
                    previousOrParentTNode.child = tNode;
                }
                else if (!isParent) {
                    previousOrParentTNode.next = tNode;
                }
            }
        }
        if (tView.firstChild == null && type === 3 /* Element */) {
            tView.firstChild = tNode;
        }
        previousOrParentTNode = tNode;
        isParent = true;
        return tNode;
    }
    function createViewNode(index, view) {
        // View nodes are not stored in data because they can be added / removed at runtime (which
        // would cause indices to change). Their TNodes are instead stored in tView.node.
        if (view[TVIEW].node == null) {
            view[TVIEW].node = createTNode(2 /* View */, index, null, null, null);
        }
        isParent = true;
        return previousOrParentTNode = view[HOST_NODE] = view[TVIEW].node;
    }
    /**
     * When elements are created dynamically after a view blueprint is created (e.g. through
     * i18nApply() or ComponentFactory.create), we need to adjust the blueprint for future
     * template passes.
     */
    function adjustBlueprintForNewNode(view) {
        var tView = view[TVIEW];
        if (tView.firstTemplatePass) {
            tView.expandoStartIndex++;
            tView.blueprint.push(null);
            view.push(null);
        }
    }
    //////////////////////////
    //// Render
    //////////////////////////
    /**
     * Resets the application state.
     */
    function resetComponentState() {
        isParent = false;
        previousOrParentTNode = null;
        elementDepthCount = 0;
        bindingsEnabled = true;
    }
    /**
     * Used for creating the LViewNode of a dynamic embedded view,
     * either through ViewContainerRef.createEmbeddedView() or TemplateRef.createEmbeddedView().
     * Such lViewNode will then be renderer with renderEmbeddedTemplate() (see below).
     */
    function createEmbeddedViewAndNode(tView, context, declarationView, renderer, queries, injectorIndex) {
        var _isParent = isParent;
        var _previousOrParentTNode = previousOrParentTNode;
        isParent = true;
        previousOrParentTNode = null;
        var lView = createLViewData(renderer, tView, context, 2 /* CheckAlways */, getCurrentSanitizer());
        lView[DECLARATION_VIEW] = declarationView;
        if (queries) {
            lView[QUERIES] = queries.createView();
        }
        createViewNode(-1, lView);
        if (tView.firstTemplatePass) {
            tView.node.injectorIndex = injectorIndex;
        }
        isParent = _isParent;
        previousOrParentTNode = _previousOrParentTNode;
        return lView;
    }
    /**
     * Used for rendering embedded views (e.g. dynamically created views)
     *
     * Dynamically created views must store/retrieve their TViews differently from component views
     * because their template functions are nested in the template functions of their hosts, creating
     * closures. If their host template happens to be an embedded template in a loop (e.g. ngFor inside
     * an ngFor), the nesting would mean we'd have multiple instances of the template function, so we
     * can't store TViews in the template function itself (as we do for comps). Instead, we store the
     * TView for dynamically created views on their host TNode, which only has one instance.
     */
    function renderEmbeddedTemplate(viewToRender, tView, context, rf) {
        var _isParent = isParent;
        var _previousOrParentTNode = previousOrParentTNode;
        var oldView;
        if (viewToRender[FLAGS] & 64 /* IsRoot */) {
            // This is a root view inside the view tree
            tickRootContext(viewToRender[CONTEXT]);
        }
        else {
            try {
                isParent = true;
                previousOrParentTNode = null;
                oldView = enterView(viewToRender, viewToRender[HOST_NODE]);
                namespaceHTML();
                tView.template(rf, context);
                if (rf & 2 /* Update */) {
                    refreshDescendantViews();
                }
                else {
                    // This must be set to false immediately after the first creation run because in an
                    // ngFor loop, all the views will be created together before update mode runs and turns
                    // off firstTemplatePass. If we don't set it here, instances will perform directive
                    // matching, etc again and again.
                    viewToRender[TVIEW].firstTemplatePass = firstTemplatePass = false;
                }
            }
            finally {
                // renderEmbeddedTemplate() is called twice, once for creation only and then once for
                // update. When for creation only, leaveView() must not trigger view hooks, nor clean flags.
                var isCreationOnly = (rf & 1 /* Create */) === 1 /* Create */;
                leaveView(oldView, isCreationOnly);
                isParent = _isParent;
                previousOrParentTNode = _previousOrParentTNode;
            }
        }
    }
    /**
     * Retrieves a context at the level specified and saves it as the global, contextViewData.
     * Will get the next level up if level is not specified.
     *
     * This is used to save contexts of parent views so they can be bound in embedded views, or
     * in conjunction with reference() to bind a ref from a parent view.
     *
     * @param level The relative level of the view from which to grab context compared to contextVewData
     * @returns context
     */
    function nextContext(level) {
        if (level === void 0) { level = 1; }
        contextViewData = walkUpViews(level, contextViewData);
        return contextViewData[CONTEXT];
    }
    function renderComponentOrTemplate(hostView, componentOrContext, templateFn) {
        var oldView = enterView(hostView, hostView[HOST_NODE]);
        try {
            if (rendererFactory.begin) {
                rendererFactory.begin();
            }
            if (templateFn) {
                namespaceHTML();
                templateFn(getRenderFlags(hostView), componentOrContext);
                refreshDescendantViews();
            }
            else {
                executeInitAndContentHooks();
                // Element was stored at 0 in data and directive was stored at 0 in directives
                // in renderComponent()
                setHostBindings();
                componentRefresh(HEADER_OFFSET, false);
            }
        }
        finally {
            if (rendererFactory.end) {
                rendererFactory.end();
            }
            leaveView(oldView);
        }
    }
    /**
     * This function returns the default configuration of rendering flags depending on when the
     * template is in creation mode or update mode. By default, the update block is run with the
     * creation block when the view is in creation mode. Otherwise, the update block is run
     * alone.
     *
     * Dynamically created views do NOT use this configuration (update block and create block are
     * always run separately).
     */
    function getRenderFlags(view) {
        return view[FLAGS] & 1 /* CreationMode */ ? 1 /* Create */ | 2 /* Update */ :
            2 /* Update */;
    }
    //////////////////////////
    //// Namespace
    //////////////////////////
    var _currentNamespace = null;
    function namespaceSVG() {
        _currentNamespace = 'http://www.w3.org/2000/svg/';
    }
    function namespaceMathML() {
        _currentNamespace = 'http://www.w3.org/1998/MathML/';
    }
    function namespaceHTML() {
        _currentNamespace = null;
    }
    //////////////////////////
    //// Element
    //////////////////////////
    /**
     * Creates an empty element using {@link elementStart} and {@link elementEnd}
     *
     * @param index Index of the element in the data array
     * @param name Name of the DOM Node
     * @param attrs Statically bound set of attributes to be written into the DOM element on creation.
     * @param localRefs A set of local reference bindings on the element.
     */
    function element(index, name, attrs, localRefs) {
        elementStart(index, name, attrs, localRefs);
        elementEnd();
    }
    /**
     * Creates a logical container for other nodes (<ng-container>) backed by a comment node in the DOM.
     * The instruction must later be followed by `elementContainerEnd()` call.
     *
     * @param index Index of the element in the LViewData array
     * @param attrs Set of attributes to be used when matching directives.
     * @param localRefs A set of local reference bindings on the element.
     *
     * Even if this instruction accepts a set of attributes no actual attribute values are propagated to
     * the DOM (as a comment node can't have attributes). Attributes are here only for directive
     * matching purposes and setting initial inputs of directives.
     */
    function elementContainerStart(index, attrs, localRefs) {
        ngDevMode && assertEqual(viewData[BINDING_INDEX], tView.bindingStartIndex, 'element containers should be created before any bindings');
        ngDevMode && ngDevMode.rendererCreateComment++;
        var native = renderer.createComment(ngDevMode ? 'ng-container' : '');
        ngDevMode && assertDataInRange(index - 1);
        var tNode = createNodeAtIndex(index, 4 /* ElementContainer */, native, null, attrs || null);
        appendChild(native, tNode, viewData);
        createDirectivesAndLocals(localRefs);
    }
    /** Mark the end of the <ng-container>. */
    function elementContainerEnd() {
        if (isParent) {
            isParent = false;
        }
        else {
            ngDevMode && assertHasParent();
            previousOrParentTNode = previousOrParentTNode.parent;
        }
        ngDevMode && assertNodeType(previousOrParentTNode, 4 /* ElementContainer */);
        currentQueries &&
            (currentQueries = currentQueries.addNode(previousOrParentTNode));
        queueLifecycleHooks(previousOrParentTNode.flags, tView);
    }
    /**
     * Create DOM element. The instruction must later be followed by `elementEnd()` call.
     *
     * @param index Index of the element in the LViewData array
     * @param name Name of the DOM Node
     * @param attrs Statically bound set of attributes to be written into the DOM element on creation.
     * @param localRefs A set of local reference bindings on the element.
     *
     * Attributes and localRefs are passed as an array of strings where elements with an even index
     * hold an attribute name and elements with an odd index hold an attribute value, ex.:
     * ['id', 'warning5', 'class', 'alert']
     */
    function elementStart(index, name, attrs, localRefs) {
        ngDevMode && assertEqual(viewData[BINDING_INDEX], tView.bindingStartIndex, 'elements should be created before any bindings ');
        ngDevMode && ngDevMode.rendererCreateElement++;
        var native = elementCreate(name);
        ngDevMode && assertDataInRange(index - 1);
        var tNode = createNodeAtIndex(index, 3 /* Element */, native, name, attrs || null);
        if (attrs) {
            setUpAttributes(native, attrs);
        }
        appendChild(native, tNode, viewData);
        createDirectivesAndLocals(localRefs);
        // any immediate children of a component or template container must be pre-emptively
        // monkey-patched with the component view data so that the element can be inspected
        // later on using any element discovery utility methods (see `element_discovery.ts`)
        if (elementDepthCount === 0) {
            attachPatchData(native, viewData);
        }
        elementDepthCount++;
    }
    /**
     * Creates a native element from a tag name, using a renderer.
     * @param name the tag name
     * @param overriddenRenderer Optional A renderer to override the default one
     * @returns the element created
     */
    function elementCreate(name, overriddenRenderer) {
        var native;
        var rendererToUse = overriddenRenderer || renderer;
        if (isProceduralRenderer(rendererToUse)) {
            native = rendererToUse.createElement(name, _currentNamespace);
        }
        else {
            if (_currentNamespace === null) {
                native = rendererToUse.createElement(name);
            }
            else {
                native = rendererToUse.createElementNS(_currentNamespace, name);
            }
        }
        return native;
    }
    /**
     * Creates directive instances and populates local refs.
     *
     * @param localRefs Local refs of the node in question
     * @param localRefExtractor mapping function that extracts local ref value from TNode
     */
    function createDirectivesAndLocals(localRefs, localRefExtractor) {
        if (localRefExtractor === void 0) { localRefExtractor = getNativeByTNode; }
        if (!bindingsEnabled)
            return;
        if (firstTemplatePass) {
            ngDevMode && ngDevMode.firstTemplatePass++;
            cacheMatchingDirectivesForNode(previousOrParentTNode, tView, localRefs || null);
        }
        else {
            instantiateDirectivesDirectly();
        }
        saveResolvedLocalsInData(localRefExtractor);
    }
    /**
     * On first template pass, we match each node against available directive selectors and save
     * the resulting defs in the correct instantiation order for subsequent change detection runs
     * (so dependencies are always created before the directives that inject them).
     */
    function cacheMatchingDirectivesForNode(tNode, tView, localRefs) {
        // Please make sure to have explicit type for `exportsMap`. Inferred type triggers bug in tsickle.
        var exportsMap = localRefs ? { '': -1 } : null;
        var matches = tView.currentMatches = findDirectiveMatches(tNode);
        generateExpandoBlock(tNode, matches);
        var totalHostVars = 0;
        if (matches) {
            for (var i = 0; i < matches.length; i += 2) {
                var def = matches[i];
                var valueIndex = i + 1;
                resolveDirective(def, valueIndex, matches);
                totalHostVars += def.hostVars;
                saveNameToExportMap(matches[valueIndex], def, exportsMap);
            }
        }
        if (exportsMap)
            cacheMatchingLocalNames(tNode, localRefs, exportsMap);
        prefillHostVars(totalHostVars);
    }
    /**
     * Generates a new block in TView.expandoInstructions for this node.
     *
     * Each expando block starts with the element index (turned negative so we can distinguish
     * it from the hostVar count) and the directive count. See more in VIEW_DATA.md.
     */
    function generateExpandoBlock(tNode, matches) {
        var directiveCount = matches ? matches.length / 2 : 0;
        var elementIndex = -(tNode.index - HEADER_OFFSET);
        if (directiveCount > 0) {
            (tView.expandoInstructions || (tView.expandoInstructions = [])).push(elementIndex, directiveCount);
        }
    }
    /**
     * On the first template pass, we need to reserve space for host binding values
     * after directives are matched (so all directives are saved, then bindings).
     * Because we are updating the blueprint, we only need to do this once.
     */
    function prefillHostVars(totalHostVars) {
        for (var i = 0; i < totalHostVars; i++) {
            viewData.push(NO_CHANGE);
            tView.blueprint.push(NO_CHANGE);
            tView.data.push(null);
        }
    }
    /** Matches the current node against all available selectors. */
    function findDirectiveMatches(tNode) {
        var registry = tView.directiveRegistry;
        var matches = null;
        if (registry) {
            for (var i = 0; i < registry.length; i++) {
                var def = registry[i];
                if (isNodeMatchingSelectorList(tNode, def.selectors)) {
                    matches || (matches = []);
                    if (def.diPublic)
                        def.diPublic(def);
                    if (def.template) {
                        if (tNode.flags & 4096 /* isComponent */)
                            throwMultipleComponentError(tNode);
                        addComponentLogic(def);
                        // The component is always stored first with directives after.
                        matches.unshift(def, null);
                    }
                    else {
                        matches.push(def, null);
                    }
                }
            }
        }
        return matches;
    }
    function resolveDirective(def, valueIndex, matches) {
        if (matches[valueIndex] === null) {
            matches[valueIndex] = CIRCULAR$1;
            var instance = def.factory();
            return directiveCreate(matches[valueIndex] = viewData.length, instance, def);
        }
        else if (matches[valueIndex] === CIRCULAR$1) {
            // If we revisit this directive before it's resolved, we know it's circular
            throwCyclicDependencyError(def.type);
        }
        return null;
    }
    /** Stores index of component's host element so it will be queued for view refresh during CD. */
    function queueComponentIndexForCheck() {
        if (firstTemplatePass) {
            (tView.components || (tView.components = [])).push(previousOrParentTNode.index);
        }
    }
    /** Stores index of directive and host element so it will be queued for binding refresh during CD.
     */
    function queueHostBindingForCheck(dirIndex, def) {
        ngDevMode &&
            assertEqual(firstTemplatePass, true, 'Should only be called in first template pass.');
        tView.expandoInstructions.push(def.hostBindings, def.hostVars);
    }
    /**
     * This function instantiates the given directives.
     */
    function instantiateDirectivesDirectly() {
        ngDevMode && assertEqual(firstTemplatePass, false, "Directives should only be instantiated directly after first template pass");
        var count = previousOrParentTNode.flags & 4095 /* DirectiveCountMask */;
        if (isContentQueryHost(previousOrParentTNode) && currentQueries) {
            currentQueries = currentQueries.clone();
        }
        if (count > 0) {
            var start = previousOrParentTNode.flags >> 15 /* DirectiveStartingIndexShift */;
            var end = start + count;
            for (var i = start; i < end; i++) {
                var def = tView.data[i];
                // Component view must be set on node before the factory is created so
                // ChangeDetectorRefs have a way to store component view on creation.
                if (def.template) {
                    addComponentLogic(def);
                }
                directiveCreate(i, def.factory(), def);
            }
        }
    }
    /** Caches local names and their matching directive indices for query and template lookups. */
    function cacheMatchingLocalNames(tNode, localRefs, exportsMap) {
        if (localRefs) {
            var localNames = tNode.localNames = [];
            // Local names must be stored in tNode in the same order that localRefs are defined
            // in the template to ensure the data is loaded in the same slots as their refs
            // in the template (for template queries).
            for (var i = 0; i < localRefs.length; i += 2) {
                var index = exportsMap[localRefs[i + 1]];
                if (index == null)
                    throw new Error("Export of name '" + localRefs[i + 1] + "' not found!");
                localNames.push(localRefs[i], index);
            }
        }
    }
    /**
     * Builds up an export map as directives are created, so local refs can be quickly mapped
     * to their directive instances.
     */
    function saveNameToExportMap(index, def, exportsMap) {
        if (exportsMap) {
            if (def.exportAs)
                exportsMap[def.exportAs] = index;
            if (def.template)
                exportsMap[''] = index;
        }
    }
    /**
     * Takes a list of local names and indices and pushes the resolved local variable values
     * to LViewData in the same order as they are loaded in the template with load().
     */
    function saveResolvedLocalsInData(localRefExtractor) {
        var localNames = previousOrParentTNode.localNames;
        var tNode = previousOrParentTNode;
        if (localNames) {
            var localIndex = previousOrParentTNode.index + 1;
            for (var i = 0; i < localNames.length; i += 2) {
                var index = localNames[i + 1];
                var value = index === -1 ? localRefExtractor(tNode, viewData) : viewData[index];
                viewData[localIndex++] = value;
            }
        }
    }
    /**
     * Gets TView from a template function or creates a new TView
     * if it doesn't already exist.
     *
     * @param templateFn The template from which to get static data
     * @param consts The number of nodes, local refs, and pipes in this view
     * @param vars The number of bindings and pure function bindings in this view
     * @param directives Directive defs that should be saved on TView
     * @param pipes Pipe defs that should be saved on TView
     * @returns TView
     */
    function getOrCreateTView(templateFn, consts, vars, directives, pipes, viewQuery) {
        // TODO(misko): reading `ngPrivateData` here is problematic for two reasons
        // 1. It is a megamorphic call on each invocation.
        // 2. For nested embedded views (ngFor inside ngFor) the template instance is per
        //    outer template invocation, which means that no such property will exist
        // Correct solution is to only put `ngPrivateData` on the Component template
        // and not on embedded templates.
        return templateFn.ngPrivateData ||
            (templateFn.ngPrivateData =
                createTView(-1, templateFn, consts, vars, directives, pipes, viewQuery));
    }
    /**
     * Creates a TView instance
     *
     * @param viewIndex The viewBlockId for inline views, or -1 if it's a component/dynamic
     * @param templateFn Template function
     * @param consts The number of nodes, local refs, and pipes in this template
     * @param directives Registry of directives for this view
     * @param pipes Registry of pipes for this view
     */
    function createTView(viewIndex, templateFn, consts, vars, directives, pipes, viewQuery) {
        ngDevMode && ngDevMode.tView++;
        var bindingStartIndex = HEADER_OFFSET + consts;
        // This length does not yet contain host bindings from child directives because at this point,
        // we don't know which directives are active on this template. As soon as a directive is matched
        // that has a host binding, we will update the blueprint with that def's hostVars count.
        var initialViewLength = bindingStartIndex + vars;
        var blueprint = createViewBlueprint(bindingStartIndex, initialViewLength);
        return blueprint[TVIEW] = {
            id: viewIndex,
            blueprint: blueprint,
            template: templateFn,
            viewQuery: viewQuery,
            node: null,
            data: blueprint.slice(),
            childIndex: -1,
            bindingStartIndex: bindingStartIndex,
            expandoStartIndex: initialViewLength,
            expandoInstructions: null,
            firstTemplatePass: true,
            initHooks: null,
            checkHooks: null,
            contentHooks: null,
            contentCheckHooks: null,
            viewHooks: null,
            viewCheckHooks: null,
            destroyHooks: null,
            pipeDestroyHooks: null,
            cleanup: null,
            contentQueries: null,
            components: null,
            directiveRegistry: typeof directives === 'function' ? directives() : directives,
            pipeRegistry: typeof pipes === 'function' ? pipes() : pipes,
            currentMatches: null,
            firstChild: null,
        };
    }
    function createViewBlueprint(bindingStartIndex, initialViewLength) {
        var blueprint = new Array(initialViewLength)
            .fill(null, 0, bindingStartIndex)
            .fill(NO_CHANGE, bindingStartIndex);
        blueprint[CONTAINER_INDEX] = -1;
        blueprint[BINDING_INDEX] = bindingStartIndex;
        return blueprint;
    }
    function setUpAttributes(native, attrs) {
        var isProc = isProceduralRenderer(renderer);
        var i = 0;
        while (i < attrs.length) {
            var attrName = attrs[i];
            if (attrName === 1 /* SelectOnly */)
                break;
            if (attrName === NG_PROJECT_AS_ATTR_NAME) {
                i += 2;
            }
            else {
                ngDevMode && ngDevMode.rendererSetAttribute++;
                if (attrName === 0 /* NamespaceURI */) {
                    // Namespaced attributes
                    var namespaceURI = attrs[i + 1];
                    var attrName_1 = attrs[i + 2];
                    var attrVal = attrs[i + 3];
                    isProc ?
                        renderer
                            .setAttribute(native, attrName_1, attrVal, namespaceURI) :
                        native.setAttributeNS(namespaceURI, attrName_1, attrVal);
                    i += 4;
                }
                else {
                    // Standard attributes
                    var attrVal = attrs[i + 1];
                    isProc ?
                        renderer
                            .setAttribute(native, attrName, attrVal) :
                        native.setAttribute(attrName, attrVal);
                    i += 2;
                }
            }
        }
    }
    function createError(text, token) {
        return new Error("Renderer: " + text + " [" + stringify$1(token) + "]");
    }
    /**
     * Locates the host native element, used for bootstrapping existing nodes into rendering pipeline.
     *
     * @param elementOrSelector Render element or CSS selector to locate the element.
     */
    function locateHostElement(factory, elementOrSelector) {
        ngDevMode && assertDataInRange(-1);
        rendererFactory = factory;
        var defaultRenderer = factory.createRenderer(null, null);
        var rNode = typeof elementOrSelector === 'string' ?
            (isProceduralRenderer(defaultRenderer) ?
                defaultRenderer.selectRootElement(elementOrSelector) :
                defaultRenderer.querySelector(elementOrSelector)) :
            elementOrSelector;
        if (ngDevMode && !rNode) {
            if (typeof elementOrSelector === 'string') {
                throw createError('Host node with selector not found:', elementOrSelector);
            }
            else {
                throw createError('Host node is required:', elementOrSelector);
            }
        }
        return rNode;
    }
    /**
     * Adds an event listener to the current node.
     *
     * If an output exists on one of the node's directives, it also subscribes to the output
     * and saves the subscription for later cleanup.
     *
     * @param eventName Name of the event
     * @param listenerFn The function to be called when event emits
     * @param useCapture Whether or not to use capture in event listener.
     */
    function listener(eventName, listenerFn, useCapture) {
        if (useCapture === void 0) { useCapture = false; }
        var tNode = previousOrParentTNode;
        ngDevMode && assertNodeOfPossibleTypes(tNode, 3 /* Element */, 0 /* Container */, 4 /* ElementContainer */);
        // add native event listener - applicable to elements only
        if (tNode.type === 3 /* Element */) {
            var native = getNativeByTNode(previousOrParentTNode, viewData);
            ngDevMode && ngDevMode.rendererAddEventListener++;
            // In order to match current behavior, native DOM event listeners must be added for all
            // events (including outputs).
            if (isProceduralRenderer(renderer)) {
                var cleanupFn = renderer.listen(native, eventName, listenerFn);
                storeCleanupFn(viewData, cleanupFn);
            }
            else {
                var wrappedListener = wrapListenerWithPreventDefault(listenerFn);
                native.addEventListener(eventName, wrappedListener, useCapture);
                var cleanupInstances = getCleanup(viewData);
                cleanupInstances.push(wrappedListener);
                if (firstTemplatePass) {
                    getTViewCleanup(viewData).push(eventName, tNode.index, cleanupInstances.length - 1, useCapture);
                }
            }
        }
        // subscribe to directive outputs
        if (tNode.outputs === undefined) {
            // if we create TNode here, inputs must be undefined so we know they still need to be
            // checked
            tNode.outputs = generatePropertyAliases(tNode.flags, 1 /* Output */);
        }
        var outputs = tNode.outputs;
        var outputData;
        if (outputs && (outputData = outputs[eventName])) {
            createOutput(outputData, listenerFn);
        }
    }
    /**
     * Iterates through the outputs associated with a particular event name and subscribes to
     * each output.
     */
    function createOutput(outputs, listener) {
        for (var i = 0; i < outputs.length; i += 2) {
            ngDevMode && assertDataInRange(outputs[i], viewData);
            var subscription = viewData[outputs[i]][outputs[i + 1]].subscribe(listener);
            storeCleanupWithContext(viewData, subscription, subscription.unsubscribe);
        }
    }
    /**
     * Saves context for this cleanup function in LView.cleanupInstances.
     *
     * On the first template pass, saves in TView:
     * - Cleanup function
     * - Index of context we just saved in LView.cleanupInstances
     */
    function storeCleanupWithContext(view, context, cleanupFn) {
        if (!view)
            view = viewData;
        getCleanup(view).push(context);
        if (view[TVIEW].firstTemplatePass) {
            getTViewCleanup(view).push(cleanupFn, view[CLEANUP].length - 1);
        }
    }
    /**
     * Saves the cleanup function itself in LView.cleanupInstances.
     *
     * This is necessary for functions that are wrapped with their contexts, like in renderer2
     * listeners.
     *
     * On the first template pass, the index of the cleanup function is saved in TView.
     */
    function storeCleanupFn(view, cleanupFn) {
        getCleanup(view).push(cleanupFn);
        if (view[TVIEW].firstTemplatePass) {
            getTViewCleanup(view).push(view[CLEANUP].length - 1, null);
        }
    }
    /** Mark the end of the element. */
    function elementEnd() {
        if (isParent) {
            isParent = false;
        }
        else {
            ngDevMode && assertHasParent();
            previousOrParentTNode = previousOrParentTNode.parent;
        }
        ngDevMode && assertNodeType(previousOrParentTNode, 3 /* Element */);
        currentQueries &&
            (currentQueries = currentQueries.addNode(previousOrParentTNode));
        queueLifecycleHooks(previousOrParentTNode.flags, tView);
        elementDepthCount--;
    }
    /**
     * Updates the value of removes an attribute on an Element.
     *
     * @param number index The index of the element in the data array
     * @param name name The name of the attribute.
     * @param value value The attribute is removed when value is `null` or `undefined`.
     *                  Otherwise the attribute value is set to the stringified value.
     * @param sanitizer An optional function used to sanitize the value.
     */
    function elementAttribute(index, name, value, sanitizer) {
        if (value !== NO_CHANGE) {
            var element_1 = getNativeByIndex(index, viewData);
            if (value == null) {
                ngDevMode && ngDevMode.rendererRemoveAttribute++;
                isProceduralRenderer(renderer) ? renderer.removeAttribute(element_1, name) :
                    element_1.removeAttribute(name);
            }
            else {
                ngDevMode && ngDevMode.rendererSetAttribute++;
                var strValue = sanitizer == null ? stringify$1(value) : sanitizer(value);
                isProceduralRenderer(renderer) ? renderer.setAttribute(element_1, name, strValue) :
                    element_1.setAttribute(name, strValue);
            }
        }
    }
    /**
     * Update a property on an Element.
     *
     * If the property name also exists as an input property on one of the element's directives,
     * the component property will be set instead of the element property. This check must
     * be conducted at runtime so child components that add new @Inputs don't have to be re-compiled.
     *
     * @param index The index of the element to update in the data array
     * @param propName Name of property. Because it is going to DOM, this is not subject to
     *        renaming as part of minification.
     * @param value New value to write.
     * @param sanitizer An optional function used to sanitize the value.
     */
    function elementProperty(index, propName, value, sanitizer) {
        if (value === NO_CHANGE)
            return;
        var element = getNativeByIndex(index, viewData);
        var tNode = getTNode(index, viewData);
        // if tNode.inputs is undefined, a listener has created outputs, but inputs haven't
        // yet been checked
        if (tNode && tNode.inputs === undefined) {
            // mark inputs as checked
            tNode.inputs = generatePropertyAliases(tNode.flags, 0 /* Input */);
        }
        var inputData = tNode && tNode.inputs;
        var dataValue;
        if (inputData && (dataValue = inputData[propName])) {
            setInputsForProperty(dataValue, value);
            if (isComponent(tNode))
                markDirtyIfOnPush(index + HEADER_OFFSET);
        }
        else if (tNode.type === 3 /* Element */) {
            // It is assumed that the sanitizer is only added when the compiler determines that the property
            // is risky, so sanitization can be done without further checks.
            value = sanitizer != null ? sanitizer(value) : value;
            ngDevMode && ngDevMode.rendererSetProperty++;
            isProceduralRenderer(renderer) ?
                renderer.setProperty(element, propName, value) :
                (element.setProperty ? element.setProperty(propName, value) :
                    element[propName] = value);
        }
    }
    /**
     * Enables directive matching on elements.
     *
     *  * Example:
     * ```
     * <my-comp my-directive>
     *   Should match component / directive.
     * </my-comp>
     * <div ngNonBindable>
     *   <!-- disabledBindings() -->
     *   <my-comp my-directive>
     *     Should not match component / directive because we are in ngNonBindable.
     *   </my-comp>
     *   <!-- enableBindings() -->
     * </div>
     * ```
     */
    function enableBindings() {
        bindingsEnabled = true;
    }
    /**
     * Disables directive matching on element.
     *
     *  * Example:
     * ```
     * <my-comp my-directive>
     *   Should match component / directive.
     * </my-comp>
     * <div ngNonBindable>
     *   <!-- disabledBindings() -->
     *   <my-comp my-directive>
     *     Should not match component / directive because we are in ngNonBindable.
     *   </my-comp>
     *   <!-- enableBindings() -->
     * </div>
     * ```
     */
    function disableBindings() {
        bindingsEnabled = false;
    }
    /**
     * Constructs a TNode object from the arguments.
     *
     * @param type The type of the node
     * @param adjustedIndex The index of the TNode in TView.data, adjusted for HEADER_OFFSET
     * @param tagName The tag name of the node
     * @param attrs The attributes defined on this node
     * @param tViews Any TViews attached to this node
     * @returns the TNode object
     */
    function createTNode(type, adjustedIndex, tagName, attrs, tViews) {
        ngDevMode && ngDevMode.tNode++;
        var parent = isParent ? previousOrParentTNode : previousOrParentTNode && previousOrParentTNode.parent;
        // Parents cannot cross component boundaries because components will be used in multiple places,
        // so it's only set if the view is the same.
        var parentInSameView = parent && viewData && parent !== viewData[HOST_NODE];
        var tParent = parentInSameView ? parent : null;
        return {
            type: type,
            index: adjustedIndex,
            injectorIndex: tParent ? tParent.injectorIndex : -1,
            flags: 0,
            tagName: tagName,
            attrs: attrs,
            localNames: null,
            initialInputs: undefined,
            inputs: undefined,
            outputs: undefined,
            tViews: tViews,
            next: null,
            child: null,
            parent: tParent,
            detached: null,
            stylingTemplate: null,
            projection: null
        };
    }
    /**
     * Given a list of directive indices and minified input names, sets the
     * input properties on the corresponding directives.
     */
    function setInputsForProperty(inputs, value) {
        for (var i = 0; i < inputs.length; i += 2) {
            ngDevMode && assertDataInRange(inputs[i], viewData);
            viewData[inputs[i]][inputs[i + 1]] = value;
        }
    }
    /**
     * Consolidates all inputs or outputs of all directives on this logical node.
     *
     * @param number tNodeFlags node flags
     * @param Direction direction whether to consider inputs or outputs
     * @returns PropertyAliases|null aggregate of all properties if any, `null` otherwise
     */
    function generatePropertyAliases(tNodeFlags, direction) {
        var count = tNodeFlags & 4095 /* DirectiveCountMask */;
        var propStore = null;
        if (count > 0) {
            var start = tNodeFlags >> 15 /* DirectiveStartingIndexShift */;
            var end = start + count;
            var isInput = direction === 0 /* Input */;
            var defs = tView.data;
            for (var i = start; i < end; i++) {
                var directiveDef = defs[i];
                var propertyAliasMap = isInput ? directiveDef.inputs : directiveDef.outputs;
                for (var publicName in propertyAliasMap) {
                    if (propertyAliasMap.hasOwnProperty(publicName)) {
                        propStore = propStore || {};
                        var internalName = propertyAliasMap[publicName];
                        var hasProperty = propStore.hasOwnProperty(publicName);
                        hasProperty ? propStore[publicName].push(i, internalName) :
                            (propStore[publicName] = [i, internalName]);
                    }
                }
            }
        }
        return propStore;
    }
    /**
     * Add or remove a class in a `classList` on a DOM element.
     *
     * This instruction is meant to handle the [class.foo]="exp" case
     *
     * @param index The index of the element to update in the data array
     * @param className Name of class to toggle. Because it is going to DOM, this is not subject to
     *        renaming as part of minification.
     * @param value A value indicating if a given class should be added or removed.
     */
    function elementClassProp(index, stylingIndex, value) {
        var val = (value instanceof BoundPlayerFactory) ? value : (!!value);
        updateClassProp(getStylingContext(index, viewData), stylingIndex, val);
    }
    /**
     * Assign any inline style values to the element during creation mode.
     *
     * This instruction is meant to be called during creation mode to apply all styling
     * (e.g. `style="..."`) values to the element. This is also where the provided index
     * value is allocated for the styling details for its corresponding element (the element
     * index is the previous index value from this one).
     *
     * (Note this function calls `elementStylingApply` immediately when called.)
     *
     *
     * @param index Index value which will be allocated to store styling data for the element.
     *        (Note that this is not the element index, but rather an index value allocated
     *        specifically for element styling--the index must be the next index after the element
     *        index.)
     * @param classDeclarations A key/value array of CSS classes that will be registered on the element.
     *   Each individual style will be used on the element as long as it is not overridden
     *   by any classes placed on the element by multiple (`[class]`) or singular (`[class.named]`)
     *   bindings. If a class binding changes its value to a falsy value then the matching initial
     *   class value that are passed in here will be applied to the element (if matched).
     * @param styleDeclarations A key/value array of CSS styles that will be registered on the element.
     *   Each individual style will be used on the element as long as it is not overridden
     *   by any styles placed on the element by multiple (`[style]`) or singular (`[style.prop]`)
     *   bindings. If a style binding changes its value to null then the initial styling
     *   values that are passed in here will be applied to the element (if matched).
     * @param styleSanitizer An optional sanitizer function that will be used (if provided)
     *   to sanitize the any CSS property values that are applied to the element (during rendering).
     */
    function elementStyling(classDeclarations, styleDeclarations, styleSanitizer) {
        var tNode = previousOrParentTNode;
        if (!tNode.stylingTemplate) {
            // initialize the styling template.
            tNode.stylingTemplate =
                createStylingContextTemplate(classDeclarations, styleDeclarations, styleSanitizer);
        }
        if (styleDeclarations && styleDeclarations.length ||
            classDeclarations && classDeclarations.length) {
            elementStylingApply(tNode.index - HEADER_OFFSET);
        }
    }
    /**
     * Apply all styling values to the element which have been queued by any styling instructions.
     *
     * This instruction is meant to be run once one or more `elementStyle` and/or `elementStyleProp`
     * have been issued against the element. This function will also determine if any styles have
     * changed and will then skip the operation if there is nothing new to render.
     *
     * Once called then all queued styles will be flushed.
     *
     * @param index Index of the element's styling storage that will be rendered.
     *        (Note that this is not the element index, but rather an index value allocated
     *        specifically for element styling--the index must be the next index after the element
     *        index.)
     */
    function elementStylingApply(index) {
        var totalPlayersQueued = renderStyleAndClassBindings(getStylingContext(index, viewData), renderer, viewData);
        if (totalPlayersQueued > 0) {
            var rootContext = getRootContext(viewData);
            scheduleTick(rootContext, 2 /* FlushPlayers */);
        }
    }
    /**
     * Queue a given style to be rendered on an Element.
     *
     * If the style value is `null` then it will be removed from the element
     * (or assigned a different value depending if there are any styles placed
     * on the element with `elementStyle` or any styles that are present
     * from when the element was created (with `elementStyling`).
     *
     * (Note that the styling instruction will not be applied until `elementStylingApply` is called.)
     *
     * @param index Index of the element's styling storage to change in the data array.
     *        (Note that this is not the element index, but rather an index value allocated
     *        specifically for element styling--the index must be the next index after the element
     *        index.)
     * @param styleIndex Index of the style property on this element. (Monotonically increasing.)
     * @param value New value to write (null to remove).
     * @param suffix Optional suffix. Used with scalar values to add unit such as `px`.
     *        Note that when a suffix is provided then the underlying sanitizer will
     *        be ignored.
     */
    function elementStyleProp(index, styleIndex, value, suffix) {
        var valueToAdd = null;
        if (value) {
            if (suffix) {
                // when a suffix is applied then it will bypass
                // sanitization entirely (b/c a new string is created)
                valueToAdd = stringify$1(value) + suffix;
            }
            else {
                // sanitization happens by dealing with a String value
                // this means that the string value will be passed through
                // into the style rendering later (which is where the value
                // will be sanitized before it is applied)
                valueToAdd = value;
            }
        }
        updateStyleProp(getStylingContext(index, viewData), styleIndex, valueToAdd);
    }
    /**
     * Queue a key/value map of styles to be rendered on an Element.
     *
     * This instruction is meant to handle the `[style]="exp"` usage. When styles are applied to
     * the Element they will then be placed with respect to any styles set with `elementStyleProp`.
     * If any styles are set to `null` then they will be removed from the element (unless the same
     * style properties have been assigned to the element during creation using `elementStyling`).
     *
     * (Note that the styling instruction will not be applied until `elementStylingApply` is called.)
     *
     * @param index Index of the element's styling storage to change in the data array.
     *        (Note that this is not the element index, but rather an index value allocated
     *        specifically for element styling--the index must be the next index after the element
     *        index.)
     * @param classes A key/value style map of CSS classes that will be added to the given element.
     *        Any missing classes (that have already been applied to the element beforehand) will be
     *        removed (unset) from the element's list of CSS classes.
     * @param styles A key/value style map of the styles that will be applied to the given element.
     *        Any missing styles (that have already been applied to the element beforehand) will be
     *        removed (unset) from the element's styling.
     */
    function elementStylingMap(index, classes, styles) {
        updateStylingMap(getStylingContext(index, viewData), classes, styles);
    }
    //////////////////////////
    //// Text
    //////////////////////////
    /**
     * Create static text node
     *
     * @param index Index of the node in the data array
     * @param value Value to write. This value will be stringified.
     */
    function text(index, value) {
        ngDevMode && assertEqual(viewData[BINDING_INDEX], tView.bindingStartIndex, 'text nodes should be created before any bindings');
        ngDevMode && ngDevMode.rendererCreateTextNode++;
        var textNative = createTextNode(value, renderer);
        var tNode = createNodeAtIndex(index, 3 /* Element */, textNative, null, null);
        // Text nodes are self closing.
        isParent = false;
        appendChild(textNative, tNode, viewData);
    }
    /**
     * Create text node with binding
     * Bindings should be handled externally with the proper interpolation(1-8) method
     *
     * @param index Index of the node in the data array.
     * @param value Stringified value to write.
     */
    function textBinding(index, value) {
        if (value !== NO_CHANGE) {
            ngDevMode && assertDataInRange(index + HEADER_OFFSET);
            var element_2 = getNativeByIndex(index, viewData);
            ngDevMode && assertDefined(element_2, 'native element should exist');
            ngDevMode && ngDevMode.rendererSetText++;
            isProceduralRenderer(renderer) ? renderer.setValue(element_2, stringify$1(value)) :
                element_2.textContent = stringify$1(value);
        }
    }
    //////////////////////////
    //// Directive
    //////////////////////////
    /**
     * Create a directive and their associated content queries.
     *
     * NOTE: directives can be created in order other than the index order. They can also
     *       be retrieved before they are created in which case the value will be null.
     *
     * @param directive The directive instance.
     * @param directiveDef DirectiveDef object which contains information about the template.
     */
    function directiveCreate(directiveDefIdx, directive, directiveDef) {
        var native = getNativeByTNode(previousOrParentTNode, viewData);
        var instance = baseDirectiveCreate(directiveDefIdx, directive, directiveDef, native);
        if (directiveDef.template) {
            var componentView = getComponentViewByIndex(previousOrParentTNode.index, viewData);
            componentView[CONTEXT] = directive;
        }
        if (firstTemplatePass) {
            // Init hooks are queued now so ngOnInit is called in host components before
            // any projected components.
            queueInitHooks(directiveDefIdx, directiveDef.onInit, directiveDef.doCheck, tView);
        }
        ngDevMode && assertDefined(previousOrParentTNode, 'previousOrParentTNode');
        if (previousOrParentTNode && previousOrParentTNode.attrs) {
            setInputsFromAttrs(directiveDefIdx, instance, directiveDef.inputs, previousOrParentTNode);
        }
        if (directiveDef.contentQueries) {
            directiveDef.contentQueries();
        }
        return instance;
    }
    function addComponentLogic(def) {
        var native = getNativeByTNode(previousOrParentTNode, viewData);
        var tView = getOrCreateTView(def.template, def.consts, def.vars, def.directiveDefs, def.pipeDefs, def.viewQuery);
        // Only component views should be added to the view tree directly. Embedded views are
        // accessed through their containers because they may be removed / re-added later.
        var componentView = addToViewTree(viewData, previousOrParentTNode.index, createLViewData(rendererFactory.createRenderer(native, def), tView, null, def.onPush ? 4 /* Dirty */ : 2 /* CheckAlways */, getCurrentSanitizer()));
        componentView[HOST_NODE] = previousOrParentTNode;
        // Component view will always be created before any injected LContainers,
        // so this is a regular element, wrap it with the component view
        componentView[HOST] = viewData[previousOrParentTNode.index];
        viewData[previousOrParentTNode.index] = componentView;
        if (firstTemplatePass) {
            queueComponentIndexForCheck();
            previousOrParentTNode.flags =
                viewData.length << 15 /* DirectiveStartingIndexShift */ | 4096 /* isComponent */;
        }
    }
    /**
     * A lighter version of directiveCreate() that is used for the root component
     *
     * This version does not contain features that we don't already support at root in
     * current Angular. Example: local refs and inputs on root component.
     */
    function baseDirectiveCreate(index, directive, directiveDef, native) {
        ngDevMode && assertEqual(viewData[BINDING_INDEX], tView.bindingStartIndex, 'directives should be created before any bindings');
        ngDevMode && assertPreviousIsParent();
        attachPatchData(directive, viewData);
        if (native) {
            attachPatchData(native, viewData);
        }
        viewData[index] = directive;
        if (firstTemplatePass) {
            var flags = previousOrParentTNode.flags;
            if (flags === 0) {
                // When the first directive is created:
                // - save the index,
                // - set the number of directives to 1
                previousOrParentTNode.flags =
                    index << 15 /* DirectiveStartingIndexShift */ | flags & 4096 /* isComponent */ | 1;
            }
            else {
                // Only need to bump the size when subsequent directives are created
                ngDevMode && assertNotEqual(flags & 4095 /* DirectiveCountMask */, 4095 /* DirectiveCountMask */, 'Reached the max number of directives');
                previousOrParentTNode.flags++;
            }
            tView.data.push(directiveDef);
            tView.blueprint.push(null);
            if (directiveDef.hostBindings)
                queueHostBindingForCheck(index, directiveDef);
        }
        else {
            var diPublic = directiveDef.diPublic;
            if (diPublic)
                diPublic(directiveDef);
        }
        if (directiveDef.attributes != null && previousOrParentTNode.type == 3 /* Element */) {
            setUpAttributes(native, directiveDef.attributes);
        }
        return directive;
    }
    /**
     * Sets initial input properties on directive instances from attribute data
     *
     * @param directiveIndex Index of the directive in directives array
     * @param instance Instance of the directive on which to set the initial inputs
     * @param inputs The list of inputs from the directive def
     * @param tNode The static data for this node
     */
    function setInputsFromAttrs(directiveIndex, instance, inputs, tNode) {
        var initialInputData = tNode.initialInputs;
        if (initialInputData === undefined || directiveIndex >= initialInputData.length) {
            initialInputData = generateInitialInputs(directiveIndex, inputs, tNode);
        }
        var initialInputs = initialInputData[directiveIndex];
        if (initialInputs) {
            for (var i = 0; i < initialInputs.length; i += 2) {
                instance[initialInputs[i]] = initialInputs[i + 1];
            }
        }
    }
    /**
     * Generates initialInputData for a node and stores it in the template's static storage
     * so subsequent template invocations don't have to recalculate it.
     *
     * initialInputData is an array containing values that need to be set as input properties
     * for directives on this node, but only once on creation. We need this array to support
     * the case where you set an @Input property of a directive using attribute-like syntax.
     * e.g. if you have a `name` @Input, you can set it once like this:
     *
     * <my-component name="Bess"></my-component>
     *
     * @param directiveIndex Index to store the initial input data
     * @param inputs The list of inputs from the directive def
     * @param tNode The static data on this node
     */
    function generateInitialInputs(directiveIndex, inputs, tNode) {
        var initialInputData = tNode.initialInputs || (tNode.initialInputs = []);
        initialInputData[directiveIndex] = null;
        var attrs = tNode.attrs;
        var i = 0;
        while (i < attrs.length) {
            var attrName = attrs[i];
            if (attrName === 1 /* SelectOnly */)
                break;
            if (attrName === 0 /* NamespaceURI */) {
                // We do not allow inputs on namespaced attributes.
                i += 4;
                continue;
            }
            var minifiedInputName = inputs[attrName];
            var attrValue = attrs[i + 1];
            if (minifiedInputName !== undefined) {
                var inputsToStore = initialInputData[directiveIndex] || (initialInputData[directiveIndex] = []);
                inputsToStore.push(minifiedInputName, attrValue);
            }
            i += 2;
        }
        return initialInputData;
    }
    //////////////////////////
    //// ViewContainer & View
    //////////////////////////
    /**
     * Creates a LContainer, either from a container instruction, or for a ViewContainerRef.
     *
     * @param hostNative The host element for the LContainer
     * @param hostTNode The host TNode for the LContainer
     * @param currentView The parent view of the LContainer
     * @param native The native comment element
     * @param isForViewContainerRef Optional a flag indicating the ViewContainerRef case
     * @returns LContainer
     */
    function createLContainer(hostNative, hostTNode, currentView, native, isForViewContainerRef) {
        return [
            isForViewContainerRef ? -1 : 0,
            [],
            currentView,
            null,
            null,
            hostNative,
            native,
            getRenderParent(hostTNode, currentView) // renderParent
        ];
    }
    /**
     * Creates an LContainer for an ng-template (dynamically-inserted view), e.g.
     *
     * <ng-template #foo>
     *    <div></div>
     * </ng-template>
     *
     * @param index The index of the container in the data array
     * @param templateFn Inline template
     * @param consts The number of nodes, local refs, and pipes for this template
     * @param vars The number of bindings for this template
     * @param tagName The name of the container element, if applicable
     * @param attrs The attrs attached to the container, if applicable
     * @param localRefs A set of local reference bindings on the element.
     * @param localRefExtractor A function which extracts local-refs values from the template.
     *        Defaults to the current element associated with the local-ref.
     */
    function template(index, templateFn, consts, vars, tagName, attrs, localRefs, localRefExtractor) {
        // TODO: consider a separate node type for templates
        var tNode = containerInternal(index, tagName || null, attrs || null);
        if (firstTemplatePass) {
            tNode.tViews = createTView(-1, templateFn, consts, vars, tView.directiveRegistry, tView.pipeRegistry, null);
        }
        createDirectivesAndLocals(localRefs, localRefExtractor);
        currentQueries &&
            (currentQueries = currentQueries.addNode(previousOrParentTNode));
        queueLifecycleHooks(tNode.flags, tView);
        isParent = false;
    }
    /**
     * Creates an LContainer for inline views, e.g.
     *
     * % if (showing) {
     *   <div></div>
     * % }
     *
     * @param index The index of the container in the data array
     */
    function container(index) {
        var tNode = containerInternal(index, null, null);
        firstTemplatePass && (tNode.tViews = []);
        isParent = false;
    }
    function containerInternal(index, tagName, attrs) {
        ngDevMode && assertEqual(viewData[BINDING_INDEX], tView.bindingStartIndex, 'container nodes should be created before any bindings');
        var adjustedIndex = index + HEADER_OFFSET;
        var comment = renderer.createComment(ngDevMode ? 'container' : '');
        ngDevMode && ngDevMode.rendererCreateComment++;
        var tNode = createNodeAtIndex(index, 0 /* Container */, comment, tagName, attrs);
        var lContainer = viewData[adjustedIndex] =
            createLContainer(viewData[adjustedIndex], tNode, viewData, comment);
        appendChild(comment, tNode, viewData);
        // Containers are added to the current view tree instead of their embedded views
        // because views can be removed and re-inserted.
        addToViewTree(viewData, index + HEADER_OFFSET, lContainer);
        if (currentQueries) {
            // prepare place for matching nodes from views inserted into a given container
            lContainer[QUERIES] = currentQueries.container();
        }
        ngDevMode && assertNodeType(previousOrParentTNode, 0 /* Container */);
        return tNode;
    }
    /**
     * Sets a container up to receive views.
     *
     * @param index The index of the container in the data array
     */
    function containerRefreshStart(index) {
        previousOrParentTNode = loadInternal(index, tView.data);
        ngDevMode && assertNodeType(previousOrParentTNode, 0 /* Container */);
        isParent = true;
        viewData[index + HEADER_OFFSET][ACTIVE_INDEX] = 0;
        if (!checkNoChangesMode) {
            // We need to execute init hooks here so ngOnInit hooks are called in top level views
            // before they are called in embedded views (for backwards compatibility).
            executeInitHooks(viewData, tView, creationMode);
        }
    }
    /**
     * Marks the end of the LContainer.
     *
     * Marking the end of LContainer is the time when to child views get inserted or removed.
     */
    function containerRefreshEnd() {
        if (isParent) {
            isParent = false;
        }
        else {
            ngDevMode && assertNodeType(previousOrParentTNode, 2 /* View */);
            ngDevMode && assertHasParent();
            previousOrParentTNode = previousOrParentTNode.parent;
        }
        ngDevMode && assertNodeType(previousOrParentTNode, 0 /* Container */);
        var lContainer = viewData[previousOrParentTNode.index];
        var nextIndex = lContainer[ACTIVE_INDEX];
        // remove extra views at the end of the container
        while (nextIndex < lContainer[VIEWS].length) {
            removeView(lContainer, previousOrParentTNode, nextIndex);
        }
    }
    /**
     * Goes over dynamic embedded views (ones created through ViewContainerRef APIs) and refreshes them
     * by executing an associated template function.
     */
    function refreshDynamicEmbeddedViews(lViewData) {
        for (var current = getLViewChild(lViewData); current !== null; current = current[NEXT]) {
            // Note: current can be an LViewData or an LContainer instance, but here we are only interested
            // in LContainer. We can tell it's an LContainer because its length is less than the LViewData
            // header.
            if (current.length < HEADER_OFFSET && current[ACTIVE_INDEX] === -1) {
                var container_1 = current;
                for (var i = 0; i < container_1[VIEWS].length; i++) {
                    var dynamicViewData = container_1[VIEWS][i];
                    // The directives and pipes are not needed here as an existing view is only being refreshed.
                    ngDevMode && assertDefined(dynamicViewData[TVIEW], 'TView must be allocated');
                    renderEmbeddedTemplate(dynamicViewData, dynamicViewData[TVIEW], dynamicViewData[CONTEXT], 2 /* Update */);
                }
            }
        }
    }
    /**
     * Looks for a view with a given view block id inside a provided LContainer.
     * Removes views that need to be deleted in the process.
     *
     * @param lContainer to search for views
     * @param tContainerNode to search for views
     * @param startIdx starting index in the views array to search from
     * @param viewBlockId exact view block id to look for
     * @returns index of a found view or -1 if not found
     */
    function scanForView(lContainer, tContainerNode, startIdx, viewBlockId) {
        var views = lContainer[VIEWS];
        for (var i = startIdx; i < views.length; i++) {
            var viewAtPositionId = views[i][TVIEW].id;
            if (viewAtPositionId === viewBlockId) {
                return views[i];
            }
            else if (viewAtPositionId < viewBlockId) {
                // found a view that should not be at this position - remove
                removeView(lContainer, tContainerNode, i);
            }
            else {
                // found a view with id greater than the one we are searching for
                // which means that required view doesn't exist and can't be found at
                // later positions in the views array - stop the search here
                break;
            }
        }
        return null;
    }
    /**
     * Marks the start of an embedded view.
     *
     * @param viewBlockId The ID of this view
     * @return boolean Whether or not this view is in creation mode
     */
    function embeddedViewStart(viewBlockId, consts, vars) {
        // The previous node can be a view node if we are processing an inline for loop
        var containerTNode = previousOrParentTNode.type === 2 /* View */ ?
            previousOrParentTNode.parent :
            previousOrParentTNode;
        var lContainer = viewData[containerTNode.index];
        var currentView = viewData;
        ngDevMode && assertNodeType(containerTNode, 0 /* Container */);
        var viewToRender = scanForView(lContainer, containerTNode, lContainer[ACTIVE_INDEX], viewBlockId);
        if (viewToRender) {
            isParent = true;
            enterView(viewToRender, viewToRender[TVIEW].node);
        }
        else {
            // When we create a new LView, we always reset the state of the instructions.
            viewToRender = createLViewData(renderer, getOrCreateEmbeddedTView(viewBlockId, consts, vars, containerTNode), null, 2 /* CheckAlways */, getCurrentSanitizer());
            if (lContainer[QUERIES]) {
                viewToRender[QUERIES] = lContainer[QUERIES].createView();
            }
            createViewNode(viewBlockId, viewToRender);
            enterView(viewToRender, viewToRender[TVIEW].node);
        }
        if (lContainer) {
            if (creationMode) {
                // it is a new view, insert it into collection of views for a given container
                insertView(viewToRender, lContainer, currentView, lContainer[ACTIVE_INDEX], -1);
            }
            lContainer[ACTIVE_INDEX]++;
        }
        return getRenderFlags(viewToRender);
    }
    /**
     * Initialize the TView (e.g. static data) for the active embedded view.
     *
     * Each embedded view block must create or retrieve its own TView. Otherwise, the embedded view's
     * static data for a particular node would overwrite the static data for a node in the view above
     * it with the same index (since it's in the same template).
     *
     * @param viewIndex The index of the TView in TNode.tViews
     * @param consts The number of nodes, local refs, and pipes in this template
     * @param vars The number of bindings and pure function bindings in this template
     * @param container The parent container in which to look for the view's static data
     * @returns TView
     */
    function getOrCreateEmbeddedTView(viewIndex, consts, vars, parent) {
        ngDevMode && assertNodeType(parent, 0 /* Container */);
        var containerTViews = parent.tViews;
        ngDevMode && assertDefined(containerTViews, 'TView expected');
        ngDevMode && assertEqual(Array.isArray(containerTViews), true, 'TViews should be in an array');
        if (viewIndex >= containerTViews.length || containerTViews[viewIndex] == null) {
            containerTViews[viewIndex] = createTView(viewIndex, null, consts, vars, tView.directiveRegistry, tView.pipeRegistry, null);
        }
        return containerTViews[viewIndex];
    }
    /** Marks the end of an embedded view. */
    function embeddedViewEnd() {
        var viewHost = viewData[HOST_NODE];
        refreshDescendantViews();
        leaveView(viewData[PARENT]);
        previousOrParentTNode = viewHost;
        isParent = false;
    }
    /////////////
    /**
     * Refreshes components by entering the component view and processing its bindings, queries, etc.
     *
     * @param adjustedElementIndex  Element index in LViewData[] (adjusted for HEADER_OFFSET)
     */
    function componentRefresh(adjustedElementIndex, parentFirstTemplatePass) {
        ngDevMode && assertDataInRange(adjustedElementIndex);
        var hostView = getComponentViewByIndex(adjustedElementIndex, viewData);
        ngDevMode && assertNodeType(tView.data[adjustedElementIndex], 3 /* Element */);
        // Only attached CheckAlways components or attached, dirty OnPush components should be checked
        if (viewAttached(hostView) && hostView[FLAGS] & (2 /* CheckAlways */ | 4 /* Dirty */)) {
            parentFirstTemplatePass && syncViewWithBlueprint(hostView);
            detectChangesInternal(hostView, hostView[CONTEXT]);
        }
    }
    /**
     * Syncs an LViewData instance with its blueprint if they have gotten out of sync.
     *
     * Typically, blueprints and their view instances should always be in sync, so the loop here
     * will be skipped. However, consider this case of two components side-by-side:
     *
     * App template:
     * ```
     * <comp></comp>
     * <comp></comp>
     * ```
     *
     * The following will happen:
     * 1. App template begins processing.
     * 2. First <comp> is matched as a component and its LViewData is created.
     * 3. Second <comp> is matched as a component and its LViewData is created.
     * 4. App template completes processing, so it's time to check child templates.
     * 5. First <comp> template is checked. It has a directive, so its def is pushed to blueprint.
     * 6. Second <comp> template is checked. Its blueprint has been updated by the first
     * <comp> template, but its LViewData was created before this update, so it is out of sync.
     *
     * Note that embedded views inside ngFor loops will never be out of sync because these views
     * are processed as soon as they are created.
     *
     * @param componentView The view to sync
     */
    function syncViewWithBlueprint(componentView) {
        var componentTView = componentView[TVIEW];
        for (var i = componentView.length; i < componentTView.blueprint.length; i++) {
            componentView[i] = componentTView.blueprint[i];
        }
    }
    /** Returns a boolean for whether the view is attached */
    function viewAttached(view) {
        return (view[FLAGS] & 8 /* Attached */) === 8 /* Attached */;
    }
    /**
     * Instruction to distribute projectable nodes among <ng-content> occurrences in a given template.
     * It takes all the selectors from the entire component's template and decides where
     * each projected node belongs (it re-distributes nodes among "buckets" where each "bucket" is
     * backed by a selector).
     *
     * This function requires CSS selectors to be provided in 2 forms: parsed (by a compiler) and text,
     * un-parsed form.
     *
     * The parsed form is needed for efficient matching of a node against a given CSS selector.
     * The un-parsed, textual form is needed for support of the ngProjectAs attribute.
     *
     * Having a CSS selector in 2 different formats is not ideal, but alternatives have even more
     * drawbacks:
     * - having only a textual form would require runtime parsing of CSS selectors;
     * - we can't have only a parsed as we can't re-construct textual form from it (as entered by a
     * template author).
     *
     * @param selectors A collection of parsed CSS selectors
     * @param rawSelectors A collection of CSS selectors in the raw, un-parsed form
     */
    function projectionDef(selectors, textSelectors) {
        var componentNode = findComponentView(viewData)[HOST_NODE];
        if (!componentNode.projection) {
            var noOfNodeBuckets = selectors ? selectors.length + 1 : 1;
            var pData = componentNode.projection =
                new Array(noOfNodeBuckets).fill(null);
            var tails = pData.slice();
            var componentChild = componentNode.child;
            while (componentChild !== null) {
                var bucketIndex = selectors ? matchingSelectorIndex(componentChild, selectors, textSelectors) : 0;
                var nextNode = componentChild.next;
                if (tails[bucketIndex]) {
                    tails[bucketIndex].next = componentChild;
                }
                else {
                    pData[bucketIndex] = componentChild;
                    componentChild.next = null;
                }
                tails[bucketIndex] = componentChild;
                componentChild = nextNode;
            }
        }
    }
    /**
     * Stack used to keep track of projection nodes in projection() instruction.
     *
     * This is deliberately created outside of projection() to avoid allocating
     * a new array each time the function is called. Instead the array will be
     * re-used by each invocation. This works because the function is not reentrant.
     */
    var projectionNodeStack$1 = [];
    /**
     * Inserts previously re-distributed projected nodes. This instruction must be preceded by a call
     * to the projectionDef instruction.
     *
     * @param nodeIndex
     * @param selectorIndex:
     *        - 0 when the selector is `*` (or unspecified as this is the default value),
     *        - 1 based index of the selector from the {@link projectionDef}
     */
    function projection(nodeIndex, selectorIndex, attrs) {
        if (selectorIndex === void 0) { selectorIndex = 0; }
        var tProjectionNode = createNodeAtIndex(nodeIndex, 1 /* Projection */, null, null, attrs || null);
        // We can't use viewData[HOST_NODE] because projection nodes can be nested in embedded views.
        if (tProjectionNode.projection === null)
            tProjectionNode.projection = selectorIndex;
        // `<ng-content>` has no content
        isParent = false;
        // re-distribution of projectable nodes is stored on a component's view level
        var componentView = findComponentView(viewData);
        var componentNode = componentView[HOST_NODE];
        var nodeToProject = componentNode.projection[selectorIndex];
        var projectedView = componentView[PARENT];
        var projectionNodeIndex = -1;
        while (nodeToProject) {
            if (nodeToProject.type === 1 /* Projection */) {
                // This node is re-projected, so we must go up the tree to get its projected nodes.
                var currentComponentView = findComponentView(projectedView);
                var currentComponentHost = currentComponentView[HOST_NODE];
                var firstProjectedNode = currentComponentHost.projection[nodeToProject.projection];
                if (firstProjectedNode) {
                    projectionNodeStack$1[++projectionNodeIndex] = nodeToProject;
                    projectionNodeStack$1[++projectionNodeIndex] = projectedView;
                    nodeToProject = firstProjectedNode;
                    projectedView = currentComponentView[PARENT];
                    continue;
                }
            }
            else {
                // This flag must be set now or we won't know that this node is projected
                // if the nodes are inserted into a container later.
                nodeToProject.flags |= 8192 /* isProjected */;
                appendProjectedNode(nodeToProject, tProjectionNode, viewData, projectedView);
            }
            // If we are finished with a list of re-projected nodes, we need to get
            // back to the root projection node that was re-projected.
            if (nodeToProject.next === null && projectedView !== componentView[PARENT]) {
                projectedView = projectionNodeStack$1[projectionNodeIndex--];
                nodeToProject = projectionNodeStack$1[projectionNodeIndex--];
            }
            nodeToProject = nodeToProject.next;
        }
    }
    /**
     * Adds LViewData or LContainer to the end of the current view tree.
     *
     * This structure will be used to traverse through nested views to remove listeners
     * and call onDestroy callbacks.
     *
     * @param currentView The view where LViewData or LContainer should be added
     * @param adjustedHostIndex Index of the view's host node in LViewData[], adjusted for header
     * @param state The LViewData or LContainer to add to the view tree
     * @returns The state passed in
     */
    function addToViewTree(currentView, adjustedHostIndex, state) {
        if (currentView[TAIL]) {
            currentView[TAIL][NEXT] = state;
        }
        else if (firstTemplatePass) {
            tView.childIndex = adjustedHostIndex;
        }
        currentView[TAIL] = state;
        return state;
    }
    ///////////////////////////////
    //// Change detection
    ///////////////////////////////
    /** If node is an OnPush component, marks its LViewData dirty. */
    function markDirtyIfOnPush(viewIndex) {
        var view = getComponentViewByIndex(viewIndex, viewData);
        if (!(view[FLAGS] & 2 /* CheckAlways */)) {
            view[FLAGS] |= 4 /* Dirty */;
        }
    }
    /** Wraps an event listener with preventDefault behavior. */
    function wrapListenerWithPreventDefault(listenerFn) {
        return function wrapListenerIn_preventDefault(e) {
            if (listenerFn(e) === false) {
                e.preventDefault();
                // Necessary for legacy browsers that don't support preventDefault (e.g. IE)
                e.returnValue = false;
            }
        };
    }
    /** Marks current view and all ancestors dirty */
    function markViewDirty(view) {
        var currentView = view;
        while (currentView && !(currentView[FLAGS] & 64 /* IsRoot */)) {
            currentView[FLAGS] |= 4 /* Dirty */;
            currentView = currentView[PARENT];
        }
        currentView[FLAGS] |= 4 /* Dirty */;
        ngDevMode && assertDefined(currentView[CONTEXT], 'rootContext should be defined');
        var rootContext = currentView[CONTEXT];
        scheduleTick(rootContext, 1 /* DetectChanges */);
    }
    /**
     * Used to schedule change detection on the whole application.
     *
     * Unlike `tick`, `scheduleTick` coalesces multiple calls into one change detection run.
     * It is usually called indirectly by calling `markDirty` when the view needs to be
     * re-rendered.
     *
     * Typically `scheduleTick` uses `requestAnimationFrame` to coalesce multiple
     * `scheduleTick` requests. The scheduling function can be overridden in
     * `renderComponent`'s `scheduler` option.
     */
    function scheduleTick(rootContext, flags) {
        var nothingScheduled = rootContext.flags === 0 /* Empty */;
        rootContext.flags |= flags;
        if (nothingScheduled && rootContext.clean == _CLEAN_PROMISE) {
            var res_1;
            rootContext.clean = new Promise(function (r) { return res_1 = r; });
            rootContext.scheduler(function () {
                if (rootContext.flags & 1 /* DetectChanges */) {
                    rootContext.flags &= ~1 /* DetectChanges */;
                    tickRootContext(rootContext);
                }
                if (rootContext.flags & 2 /* FlushPlayers */) {
                    rootContext.flags &= ~2 /* FlushPlayers */;
                    var playerHandler = rootContext.playerHandler;
                    if (playerHandler) {
                        playerHandler.flushPlayers();
                    }
                }
                rootContext.clean = _CLEAN_PROMISE;
                res_1(null);
            });
        }
    }
    function tickRootContext(rootContext) {
        for (var i = 0; i < rootContext.components.length; i++) {
            var rootComponent = rootContext.components[i];
            renderComponentOrTemplate(readPatchedLViewData(rootComponent), rootComponent);
        }
    }
    /**
     * Synchronously perform change detection on a component (and possibly its sub-components).
     *
     * This function triggers change detection in a synchronous way on a component. There should
     * be very little reason to call this function directly since a preferred way to do change
     * detection is to {@link markDirty} the component and wait for the scheduler to call this method
     * at some future point in time. This is because a single user action often results in many
     * components being invalidated and calling change detection on each component synchronously
     * would be inefficient. It is better to wait until all components are marked as dirty and
     * then perform single change detection across all of the components
     *
     * @param component The component which the change detection should be performed on.
     */
    function detectChanges(component) {
        detectChangesInternal(getComponentViewByInstance(component), component);
    }
    /**
     * Synchronously perform change detection on a root view and its components.
     *
     * @param lViewData The view which the change detection should be performed on.
     */
    function detectChangesInRootView(lViewData) {
        tickRootContext(lViewData[CONTEXT]);
    }
    /**
     * Checks the change detector and its children, and throws if any changes are detected.
     *
     * This is used in development mode to verify that running change detection doesn't
     * introduce other changes.
     */
    function checkNoChanges(component) {
        checkNoChangesMode = true;
        try {
            detectChanges(component);
        }
        finally {
            checkNoChangesMode = false;
        }
    }
    /**
     * Checks the change detector on a root view and its components, and throws if any changes are
     * detected.
     *
     * This is used in development mode to verify that running change detection doesn't
     * introduce other changes.
     *
     * @param lViewData The view which the change detection should be checked on.
     */
    function checkNoChangesInRootView(lViewData) {
        checkNoChangesMode = true;
        try {
            detectChangesInRootView(lViewData);
        }
        finally {
            checkNoChangesMode = false;
        }
    }
    /** Checks the view of the component provided. Does not gate on dirty checks or execute doCheck. */
    function detectChangesInternal(hostView, component) {
        var hostTView = hostView[TVIEW];
        var oldView = enterView(hostView, hostView[HOST_NODE]);
        var templateFn = hostTView.template;
        var viewQuery = hostTView.viewQuery;
        try {
            namespaceHTML();
            createViewQuery(viewQuery, hostView[FLAGS], component);
            templateFn(getRenderFlags(hostView), component);
            refreshDescendantViews();
            updateViewQuery(viewQuery, component);
        }
        finally {
            leaveView(oldView);
        }
    }
    function createViewQuery(viewQuery, flags, component) {
        if (viewQuery && (flags & 1 /* CreationMode */)) {
            viewQuery(1 /* Create */, component);
        }
    }
    function updateViewQuery(viewQuery, component) {
        if (viewQuery) {
            viewQuery(2 /* Update */, component);
        }
    }
    /**
     * Mark the component as dirty (needing change detection).
     *
     * Marking a component dirty will schedule a change detection on this
     * component at some point in the future. Marking an already dirty
     * component as dirty is a noop. Only one outstanding change detection
     * can be scheduled per component tree. (Two components bootstrapped with
     * separate `renderComponent` will have separate schedulers)
     *
     * When the root component is bootstrapped with `renderComponent`, a scheduler
     * can be provided.
     *
     * @param component Component to mark as dirty.
     */
    function markDirty(component) {
        ngDevMode && assertDefined(component, 'component');
        markViewDirty(getComponentViewByInstance(component));
    }
    /** A special value which designates that a value has not changed. */
    var NO_CHANGE = {};
    /**
     * Creates a single value binding.
     *
     * @param value Value to diff
     */
    function bind(value) {
        return bindingUpdated(viewData[BINDING_INDEX]++, value) ? value : NO_CHANGE;
    }
    /**
     * Create interpolation bindings with a variable number of expressions.
     *
     * If there are 1 to 8 expressions `interpolation1()` to `interpolation8()` should be used instead.
     * Those are faster because there is no need to create an array of expressions and iterate over it.
     *
     * `values`:
     * - has static text at even indexes,
     * - has evaluated expressions at odd indexes.
     *
     * Returns the concatenated string when any of the arguments changes, `NO_CHANGE` otherwise.
     */
    function interpolationV(values) {
        ngDevMode && assertLessThan(2, values.length, 'should have at least 3 values');
        ngDevMode && assertEqual(values.length % 2, 1, 'should have an odd number of values');
        var different = false;
        for (var i = 1; i < values.length; i += 2) {
            // Check if bindings (odd indexes) have changed
            bindingUpdated(viewData[BINDING_INDEX]++, values[i]) && (different = true);
        }
        if (!different) {
            return NO_CHANGE;
        }
        // Build the updated content
        var content = values[0];
        for (var i = 1; i < values.length; i += 2) {
            content += stringify$1(values[i]) + values[i + 1];
        }
        return content;
    }
    /**
     * Creates an interpolation binding with 1 expression.
     *
     * @param prefix static value used for concatenation only.
     * @param v0 value checked for change.
     * @param suffix static value used for concatenation only.
     */
    function interpolation1(prefix, v0, suffix) {
        var different = bindingUpdated(viewData[BINDING_INDEX]++, v0);
        return different ? prefix + stringify$1(v0) + suffix : NO_CHANGE;
    }
    /** Creates an interpolation binding with 2 expressions. */
    function interpolation2(prefix, v0, i0, v1, suffix) {
        var different = bindingUpdated2(viewData[BINDING_INDEX], v0, v1);
        viewData[BINDING_INDEX] += 2;
        return different ? prefix + stringify$1(v0) + i0 + stringify$1(v1) + suffix : NO_CHANGE;
    }
    /** Creates an interpolation binding with 3 expressions. */
    function interpolation3(prefix, v0, i0, v1, i1, v2, suffix) {
        var different = bindingUpdated3(viewData[BINDING_INDEX], v0, v1, v2);
        viewData[BINDING_INDEX] += 3;
        return different ? prefix + stringify$1(v0) + i0 + stringify$1(v1) + i1 + stringify$1(v2) + suffix :
            NO_CHANGE;
    }
    /** Create an interpolation binding with 4 expressions. */
    function interpolation4(prefix, v0, i0, v1, i1, v2, i2, v3, suffix) {
        var different = bindingUpdated4(viewData[BINDING_INDEX], v0, v1, v2, v3);
        viewData[BINDING_INDEX] += 4;
        return different ?
            prefix + stringify$1(v0) + i0 + stringify$1(v1) + i1 + stringify$1(v2) + i2 + stringify$1(v3) +
                suffix :
            NO_CHANGE;
    }
    /** Creates an interpolation binding with 5 expressions. */
    function interpolation5(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, suffix) {
        var different = bindingUpdated4(viewData[BINDING_INDEX], v0, v1, v2, v3);
        different = bindingUpdated(viewData[BINDING_INDEX] + 4, v4) || different;
        viewData[BINDING_INDEX] += 5;
        return different ?
            prefix + stringify$1(v0) + i0 + stringify$1(v1) + i1 + stringify$1(v2) + i2 + stringify$1(v3) + i3 +
                stringify$1(v4) + suffix :
            NO_CHANGE;
    }
    /** Creates an interpolation binding with 6 expressions. */
    function interpolation6(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, suffix) {
        var different = bindingUpdated4(viewData[BINDING_INDEX], v0, v1, v2, v3);
        different = bindingUpdated2(viewData[BINDING_INDEX] + 4, v4, v5) || different;
        viewData[BINDING_INDEX] += 6;
        return different ?
            prefix + stringify$1(v0) + i0 + stringify$1(v1) + i1 + stringify$1(v2) + i2 + stringify$1(v3) + i3 +
                stringify$1(v4) + i4 + stringify$1(v5) + suffix :
            NO_CHANGE;
    }
    /** Creates an interpolation binding with 7 expressions. */
    function interpolation7(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, suffix) {
        var different = bindingUpdated4(viewData[BINDING_INDEX], v0, v1, v2, v3);
        different = bindingUpdated3(viewData[BINDING_INDEX] + 4, v4, v5, v6) || different;
        viewData[BINDING_INDEX] += 7;
        return different ?
            prefix + stringify$1(v0) + i0 + stringify$1(v1) + i1 + stringify$1(v2) + i2 + stringify$1(v3) + i3 +
                stringify$1(v4) + i4 + stringify$1(v5) + i5 + stringify$1(v6) + suffix :
            NO_CHANGE;
    }
    /** Creates an interpolation binding with 8 expressions. */
    function interpolation8(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, i6, v7, suffix) {
        var different = bindingUpdated4(viewData[BINDING_INDEX], v0, v1, v2, v3);
        different = bindingUpdated4(viewData[BINDING_INDEX] + 4, v4, v5, v6, v7) || different;
        viewData[BINDING_INDEX] += 8;
        return different ?
            prefix + stringify$1(v0) + i0 + stringify$1(v1) + i1 + stringify$1(v2) + i2 + stringify$1(v3) + i3 +
                stringify$1(v4) + i4 + stringify$1(v5) + i5 + stringify$1(v6) + i6 + stringify$1(v7) + suffix :
            NO_CHANGE;
    }
    /** Store a value in the `data` at a given `index`. */
    function store(index, value) {
        // We don't store any static data for local variables, so the first time
        // we see the template, we should store as null to avoid a sparse array
        var adjustedIndex = index + HEADER_OFFSET;
        if (adjustedIndex >= tView.data.length) {
            tView.data[adjustedIndex] = null;
        }
        viewData[adjustedIndex] = value;
    }
    /**
     * Retrieves a local reference from the current contextViewData.
     *
     * If the reference to retrieve is in a parent view, this instruction is used in conjunction
     * with a nextContext() call, which walks up the tree and updates the contextViewData instance.
     *
     * @param index The index of the local ref in contextViewData.
     */
    function reference(index) {
        return loadInternal(index, contextViewData);
    }
    function walkUpViews(nestingLevel, currentView) {
        while (nestingLevel > 0) {
            ngDevMode && assertDefined(currentView[DECLARATION_VIEW], 'Declaration view should be defined if nesting level is greater than 0.');
            currentView = currentView[DECLARATION_VIEW];
            nestingLevel--;
        }
        return currentView;
    }
    function loadQueryList(queryListIdx) {
        ngDevMode && assertDefined(viewData[CONTENT_QUERIES], 'Content QueryList array should be defined if reading a query.');
        ngDevMode && assertDataInRange(queryListIdx, viewData[CONTENT_QUERIES]);
        return viewData[CONTENT_QUERIES][queryListIdx];
    }
    /** Retrieves a value from current `viewData`. */
    function load(index) {
        return loadInternal(index, viewData);
    }
    /** Gets the current binding value. */
    function getBinding(bindingIndex) {
        ngDevMode && assertDataInRange(viewData[bindingIndex]);
        ngDevMode &&
            assertNotEqual(viewData[bindingIndex], NO_CHANGE, 'Stored value should never be NO_CHANGE.');
        return viewData[bindingIndex];
    }
    /** Updates binding if changed, then returns whether it was updated. */
    function bindingUpdated(bindingIndex, value) {
        ngDevMode && assertNotEqual(value, NO_CHANGE, 'Incoming value should never be NO_CHANGE.');
        ngDevMode && assertLessThan(bindingIndex, viewData.length, "Slot should have been initialized to NO_CHANGE");
        if (viewData[bindingIndex] === NO_CHANGE) {
            viewData[bindingIndex] = value;
        }
        else if (isDifferent(viewData[bindingIndex], value, checkNoChangesMode)) {
            throwErrorIfNoChangesMode(creationMode, checkNoChangesMode, viewData[bindingIndex], value);
            viewData[bindingIndex] = value;
        }
        else {
            return false;
        }
        return true;
    }
    /** Updates binding and returns the value. */
    function updateBinding(bindingIndex, value) {
        return viewData[bindingIndex] = value;
    }
    /** Updates 2 bindings if changed, then returns whether either was updated. */
    function bindingUpdated2(bindingIndex, exp1, exp2) {
        var different = bindingUpdated(bindingIndex, exp1);
        return bindingUpdated(bindingIndex + 1, exp2) || different;
    }
    /** Updates 3 bindings if changed, then returns whether any was updated. */
    function bindingUpdated3(bindingIndex, exp1, exp2, exp3) {
        var different = bindingUpdated2(bindingIndex, exp1, exp2);
        return bindingUpdated(bindingIndex + 2, exp3) || different;
    }
    /** Updates 4 bindings if changed, then returns whether any was updated. */
    function bindingUpdated4(bindingIndex, exp1, exp2, exp3, exp4) {
        var different = bindingUpdated2(bindingIndex, exp1, exp2);
        return bindingUpdated2(bindingIndex + 2, exp3, exp4) || different;
    }
    function getTView() {
        return tView;
    }
    /**
     * Registers a QueryList, associated with a content query, for later refresh (part of a view
     * refresh).
     */
    function registerContentQuery(queryList) {
        var savedContentQueriesLength = (viewData[CONTENT_QUERIES] || (viewData[CONTENT_QUERIES] = [])).push(queryList);
        if (firstTemplatePass) {
            var currentDirectiveIndex = viewData.length - 1;
            var tViewContentQueries = tView.contentQueries || (tView.contentQueries = []);
            var lastSavedDirectiveIndex = tView.contentQueries.length ? tView.contentQueries[tView.contentQueries.length - 2] : -1;
            if (currentDirectiveIndex !== lastSavedDirectiveIndex) {
                tViewContentQueries.push(currentDirectiveIndex, savedContentQueriesLength - 1);
            }
        }
    }
    function assertPreviousIsParent() {
        assertEqual(isParent, true, 'previousOrParentTNode should be a parent');
    }
    function assertHasParent() {
        assertDefined(previousOrParentTNode.parent, 'previousOrParentTNode should have a parent');
    }
    function assertDataInRange(index, arr) {
        if (arr == null)
            arr = viewData;
        assertDataInRangeInternal(index, arr || viewData);
    }
    var CLEAN_PROMISE = _CLEAN_PROMISE;

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    // Root component will always have an element index of 0 and an injector size of 1
    var ROOT_EXPANDO_INSTRUCTIONS = [0, 1];
    /**
     * Bootstraps a Component into an existing host element and returns an instance
     * of the component.
     *
     * Use this function to bootstrap a component into the DOM tree. Each invocation
     * of this function will create a separate tree of components, injectors and
     * change detection cycles and lifetimes. To dynamically insert a new component
     * into an existing tree such that it shares the same injection, change detection
     * and object lifetime, use {@link ViewContainer#createComponent}.
     *
     * @param componentType Component to bootstrap
     * @param options Optional parameters which control bootstrapping
     */
    function renderComponent(componentType /* Type as workaround for: Microsoft/TypeScript/issues/4881 */, opts) {
        if (opts === void 0) { opts = {}; }
        ngDevMode && assertComponentType(componentType);
        var rendererFactory = opts.rendererFactory || domRendererFactory3;
        var sanitizer = opts.sanitizer || null;
        var componentDef = getComponentDef(componentType);
        if (componentDef.type != componentType)
            componentDef.type = componentType;
        // The first index of the first selector is the tag name.
        var componentTag = componentDef.selectors[0][0];
        var hostRNode = locateHostElement(rendererFactory, opts.host || componentTag);
        var rootFlags = componentDef.onPush ? 4 /* Dirty */ | 64 /* IsRoot */ :
            2 /* CheckAlways */ | 64 /* IsRoot */;
        var rootContext = createRootContext(opts.scheduler || requestAnimationFrame.bind(window), opts.playerHandler || null);
        var renderer = rendererFactory.createRenderer(hostRNode, componentDef);
        var rootView = createLViewData(renderer, createTView(-1, null, 1, 0, null, null, null), rootContext, rootFlags);
        rootView[INJECTOR$1] = opts.injector || null;
        var oldView = enterView(rootView, null);
        var component;
        try {
            if (rendererFactory.begin)
                rendererFactory.begin();
            var componentView = createRootComponentView(hostRNode, componentDef, rootView, renderer, sanitizer);
            component = createRootComponent(hostRNode, componentView, componentDef, rootView, rootContext, opts.hostFeatures || null);
            executeInitAndContentHooks();
            detectChangesInternal(componentView, component);
        }
        finally {
            leaveView(oldView);
            if (rendererFactory.end)
                rendererFactory.end();
        }
        return component;
    }
    /**
     * Creates the root component view and the root component node.
     *
     * @param rNode Render host element.
     * @param def ComponentDef
     * @param rootView The parent view where the host node is stored
     * @param renderer The current renderer
     * @param sanitizer The sanitizer, if provided
     *
     * @returns Component view created
     */
    function createRootComponentView(rNode, def, rootView, renderer, sanitizer) {
        resetComponentState();
        var tView = rootView[TVIEW];
        var componentView = createLViewData(renderer, getOrCreateTView(def.template, def.consts, def.vars, def.directiveDefs, def.pipeDefs, def.viewQuery), null, def.onPush ? 4 /* Dirty */ : 2 /* CheckAlways */, sanitizer);
        var tNode = createNodeAtIndex(0, 3 /* Element */, rNode, null, null);
        if (tView.firstTemplatePass) {
            tView.expandoInstructions = ROOT_EXPANDO_INSTRUCTIONS.slice();
            if (def.diPublic)
                def.diPublic(def);
            tNode.flags =
                rootView.length << 15 /* DirectiveStartingIndexShift */ | 4096 /* isComponent */;
        }
        // Store component view at node index, with node as the HOST
        componentView[HOST] = rootView[HEADER_OFFSET];
        componentView[HOST_NODE] = tNode;
        return rootView[HEADER_OFFSET] = componentView;
    }
    /**
     * Creates a root component and sets it up with features and host bindings. Shared by
     * renderComponent() and ViewContainerRef.createComponent().
     */
    function createRootComponent(hostRNode, componentView, componentDef, rootView, rootContext, hostFeatures) {
        // Create directive instance with factory() and store at next index in viewData
        var component = baseDirectiveCreate(rootView.length, componentDef.factory(), componentDef, hostRNode);
        rootContext.components.push(component);
        componentView[CONTEXT] = component;
        hostFeatures && hostFeatures.forEach(function (feature) { return feature(component, componentDef); });
        if (rootView[TVIEW].firstTemplatePass)
            prefillHostVars(componentDef.hostVars);
        setHostBindings();
        return component;
    }
    function createRootContext(scheduler, playerHandler) {
        return {
            components: [],
            scheduler: scheduler,
            clean: CLEAN_PROMISE,
            playerHandler: playerHandler || null,
            flags: 0 /* Empty */
        };
    }
    /**
     * Used to enable lifecycle hooks on the root component.
     *
     * Include this feature when calling `renderComponent` if the root component
     * you are rendering has lifecycle hooks defined. Otherwise, the hooks won't
     * be called properly.
     *
     * Example:
     *
     * ```
     * renderComponent(AppComponent, {features: [RootLifecycleHooks]});
     * ```
     */
    function LifecycleHooksFeature(component, def) {
        var rootTView = readPatchedLViewData(component)[TVIEW];
        var dirIndex = rootTView.data.length - 1;
        queueInitHooks(dirIndex, def.onInit, def.doCheck, rootTView);
        queueLifecycleHooks(dirIndex << 15 /* DirectiveStartingIndexShift */ | 1, rootTView);
    }
    /**
     * Retrieve the root context for any component by walking the parent `LView` until
     * reaching the root `LView`.
     *
     * @param component any component
     */
    function getRootContext$1(component) {
        var rootContext = getRootView(component)[CONTEXT];
        ngDevMode && assertDefined(rootContext, 'rootContext');
        return rootContext;
    }
    /**
     * Wait on component until it is rendered.
     *
     * This function returns a `Promise` which is resolved when the component's
     * change detection is executed. This is determined by finding the scheduler
     * associated with the `component`'s render tree and waiting until the scheduler
     * flushes. If nothing is scheduled, the function returns a resolved promise.
     *
     * Example:
     * ```
     * await whenRendered(myComponent);
     * ```
     *
     * @param component Component to wait upon
     * @returns Promise which resolves when the component is rendered.
     */
    function whenRendered(component) {
        return getRootContext$1(component).clean;
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Determines if a definition is a {@link ComponentDef} or a {@link DirectiveDef}
     * @param definition The definition to examine
     */
    function isComponentDef(definition) {
        var def = definition;
        return typeof def.template === 'function';
    }
    function getSuperType(type) {
        return Object.getPrototypeOf(type.prototype).constructor;
    }
    /**
     * Merges the definition from a super class to a sub class.
     * @param definition The definition that is a SubClass of another directive of component
     */
    function InheritDefinitionFeature(definition) {
        var superType = getSuperType(definition.type);
        var _loop_1 = function () {
            var e_1, _a;
            var superDef = undefined;
            if (isComponentDef(definition)) {
                // Don't use getComponentDef/getDirectiveDef. This logic relies on inheritance.
                superDef = superType.ngComponentDef || superType.ngDirectiveDef;
            }
            else {
                if (superType.ngComponentDef) {
                    throw new Error('Directives cannot inherit Components');
                }
                // Don't use getComponentDef/getDirectiveDef. This logic relies on inheritance.
                superDef = superType.ngDirectiveDef;
            }
            var baseDef = superType.ngBaseDef;
            // Some fields in the definition may be empty, if there were no values to put in them that
            // would've justified object creation. Unwrap them if necessary.
            if (baseDef || superDef) {
                var writeableDef = definition;
                writeableDef.inputs = maybeUnwrapEmpty(definition.inputs);
                writeableDef.declaredInputs = maybeUnwrapEmpty(definition.declaredInputs);
                writeableDef.outputs = maybeUnwrapEmpty(definition.outputs);
            }
            if (baseDef) {
                // Merge inputs and outputs
                fillProperties(definition.inputs, baseDef.inputs);
                fillProperties(definition.declaredInputs, baseDef.declaredInputs);
                fillProperties(definition.outputs, baseDef.outputs);
            }
            if (superDef) {
                // Merge hostBindings
                var prevHostBindings_1 = definition.hostBindings;
                var superHostBindings_1 = superDef.hostBindings;
                if (superHostBindings_1) {
                    if (prevHostBindings_1) {
                        definition.hostBindings = function (directiveIndex, elementIndex) {
                            superHostBindings_1(directiveIndex, elementIndex);
                            prevHostBindings_1(directiveIndex, elementIndex);
                        };
                    }
                    else {
                        definition.hostBindings = superHostBindings_1;
                    }
                }
                // Merge View Queries
                if (isComponentDef(definition) && isComponentDef(superDef)) {
                    var prevViewQuery_1 = definition.viewQuery;
                    var superViewQuery_1 = superDef.viewQuery;
                    if (superViewQuery_1) {
                        if (prevViewQuery_1) {
                            definition.viewQuery = function (rf, ctx) {
                                superViewQuery_1(rf, ctx);
                                prevViewQuery_1(rf, ctx);
                            };
                        }
                        else {
                            definition.viewQuery = superViewQuery_1;
                        }
                    }
                }
                // Merge Content Queries
                var prevContentQueries_1 = definition.contentQueries;
                var superContentQueries_1 = superDef.contentQueries;
                if (superContentQueries_1) {
                    if (prevContentQueries_1) {
                        definition.contentQueries = function () {
                            superContentQueries_1();
                            prevContentQueries_1();
                        };
                    }
                    else {
                        definition.contentQueries = superContentQueries_1;
                    }
                }
                // Merge Content Queries Refresh
                var prevContentQueriesRefresh_1 = definition.contentQueriesRefresh;
                var superContentQueriesRefresh_1 = superDef.contentQueriesRefresh;
                if (superContentQueriesRefresh_1) {
                    if (prevContentQueriesRefresh_1) {
                        definition.contentQueriesRefresh = function (directiveIndex, queryIndex) {
                            superContentQueriesRefresh_1(directiveIndex, queryIndex);
                            prevContentQueriesRefresh_1(directiveIndex, queryIndex);
                        };
                    }
                    else {
                        definition.contentQueriesRefresh = superContentQueriesRefresh_1;
                    }
                }
                // Merge inputs and outputs
                fillProperties(definition.inputs, superDef.inputs);
                fillProperties(definition.declaredInputs, superDef.declaredInputs);
                fillProperties(definition.outputs, superDef.outputs);
                // Inherit hooks
                // Assume super class inheritance feature has already run.
                definition.afterContentChecked =
                    definition.afterContentChecked || superDef.afterContentChecked;
                definition.afterContentInit = definition.afterContentInit || superDef.afterContentInit;
                definition.afterViewChecked = definition.afterViewChecked || superDef.afterViewChecked;
                definition.afterViewInit = definition.afterViewInit || superDef.afterViewInit;
                definition.doCheck = definition.doCheck || superDef.doCheck;
                definition.onDestroy = definition.onDestroy || superDef.onDestroy;
                definition.onInit = definition.onInit || superDef.onInit;
                // Run parent features
                var features = superDef.features;
                if (features) {
                    try {
                        for (var features_1 = __values(features), features_1_1 = features_1.next(); !features_1_1.done; features_1_1 = features_1.next()) {
                            var feature = features_1_1.value;
                            if (feature && feature !== InheritDefinitionFeature) {
                                feature(definition);
                            }
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (features_1_1 && !features_1_1.done && (_a = features_1.return)) _a.call(features_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                }
                return "break";
            }
            else {
                // Even if we don't have a definition, check the type for the hooks and use those if need be
                var superPrototype = superType.prototype;
                if (superPrototype) {
                    definition.afterContentChecked =
                        definition.afterContentChecked || superPrototype.afterContentChecked;
                    definition.afterContentInit =
                        definition.afterContentInit || superPrototype.afterContentInit;
                    definition.afterViewChecked =
                        definition.afterViewChecked || superPrototype.afterViewChecked;
                    definition.afterViewInit = definition.afterViewInit || superPrototype.afterViewInit;
                    definition.doCheck = definition.doCheck || superPrototype.doCheck;
                    definition.onDestroy = definition.onDestroy || superPrototype.onDestroy;
                    definition.onInit = definition.onInit || superPrototype.onInit;
                }
            }
            superType = Object.getPrototypeOf(superType);
        };
        while (superType) {
            var state_1 = _loop_1();
            if (state_1 === "break")
                break;
        }
    }
    function maybeUnwrapEmpty(value) {
        if (value === EMPTY$1) {
            return {};
        }
        else if (value === EMPTY_ARRAY) {
            return [];
        }
        else {
            return value;
        }
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var PRIVATE_PREFIX = '__ngOnChanges_';
    /**
     * The NgOnChangesFeature decorates a component with support for the ngOnChanges
     * lifecycle hook, so it should be included in any component that implements
     * that hook.
     *
     * If the component or directive uses inheritance, the NgOnChangesFeature MUST
     * be included as a feature AFTER {@link InheritDefinitionFeature}, otherwise
     * inherited properties will not be propagated to the ngOnChanges lifecycle
     * hook.
     *
     * Example usage:
     *
     * ```
     * static ngComponentDef = defineComponent({
     *   ...
     *   inputs: {name: 'publicName'},
     *   features: [NgOnChangesFeature]
     * });
     * ```
     */
    function NgOnChangesFeature(definition) {
        var declaredToMinifiedInputs = definition.declaredInputs;
        var proto = definition.type.prototype;
        var _loop_1 = function (declaredName) {
            if (declaredToMinifiedInputs.hasOwnProperty(declaredName)) {
                var minifiedKey = declaredToMinifiedInputs[declaredName];
                var privateMinKey_1 = PRIVATE_PREFIX + minifiedKey;
                // Walk the prototype chain to see if we find a property descriptor
                // That way we can honor setters and getters that were inherited.
                var originalProperty = undefined;
                var checkProto = proto;
                while (!originalProperty && checkProto &&
                    Object.getPrototypeOf(checkProto) !== Object.getPrototypeOf(Object.prototype)) {
                    originalProperty = Object.getOwnPropertyDescriptor(checkProto, minifiedKey);
                    checkProto = Object.getPrototypeOf(checkProto);
                }
                var getter = originalProperty && originalProperty.get;
                var setter_1 = originalProperty && originalProperty.set;
                // create a getter and setter for property
                Object.defineProperty(proto, minifiedKey, {
                    get: getter ||
                        (setter_1 ? undefined : function () { return this[privateMinKey_1]; }),
                    set: function (value) {
                        var simpleChanges = this[PRIVATE_PREFIX];
                        if (!simpleChanges) {
                            simpleChanges = {};
                            // Place where we will store SimpleChanges if there is a change
                            Object.defineProperty(this, PRIVATE_PREFIX, { value: simpleChanges, writable: true });
                        }
                        var isFirstChange = !this.hasOwnProperty(privateMinKey_1);
                        var currentChange = simpleChanges[declaredName];
                        if (currentChange) {
                            currentChange.currentValue = value;
                        }
                        else {
                            simpleChanges[declaredName] =
                                new SimpleChange(this[privateMinKey_1], value, isFirstChange);
                        }
                        if (isFirstChange) {
                            // Create a place where the actual value will be stored and make it non-enumerable
                            Object.defineProperty(this, privateMinKey_1, { value: value, writable: true });
                        }
                        else {
                            this[privateMinKey_1] = value;
                        }
                        if (setter_1)
                            setter_1.call(this, value);
                    },
                    // Make the property configurable in dev mode to allow overriding in tests
                    configurable: !!ngDevMode
                });
            }
        };
        for (var declaredName in declaredToMinifiedInputs) {
            _loop_1(declaredName);
        }
        // If an onInit hook is defined, it will need to wrap the ngOnChanges call
        // so the call order is changes-init-check in creation mode. In subsequent
        // change detection runs, only the check wrapper will be called.
        if (definition.onInit != null) {
            definition.onInit = onChangesWrapper(definition.onInit);
        }
        definition.doCheck = onChangesWrapper(definition.doCheck);
    }
    function onChangesWrapper(delegateHook) {
        return function () {
            var simpleChanges = this[PRIVATE_PREFIX];
            if (simpleChanges != null) {
                this.ngOnChanges(simpleChanges);
                this[PRIVATE_PREFIX] = null;
            }
            if (delegateHook)
                delegateHook.apply(this);
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
     * The number of slots in each bloom filter (used by DI). The larger this number, the fewer
     * directives that will share slots, and thus, the fewer false positives when checking for
     * the existence of a directive.
     */
    var BLOOM_SIZE = 256;
    var BLOOM_MASK = BLOOM_SIZE - 1;
    /** Counter used to generate unique IDs for directives. */
    var nextNgElementId = 0;
    /**
     * Registers this directive as present in its node's injector by flipping the directive's
     * corresponding bit in the injector's bloom filter.
     *
     * @param injectorIndex The index of the node injector where this token should be registered
     * @param tView The TView for the injector's bloom filters
     * @param type The directive token to register
     */
    function bloomAdd(injectorIndex, tView, type) {
        if (tView.firstTemplatePass) {
            var id = type[NG_ELEMENT_ID];
            // Set a unique ID on the directive type, so if something tries to inject the directive,
            // we can easily retrieve the ID and hash it into the bloom bit that should be checked.
            if (id == null) {
                id = type[NG_ELEMENT_ID] = nextNgElementId++;
            }
            // We only have BLOOM_SIZE (256) slots in our bloom filter (8 buckets * 32 bits each),
            // so all unique IDs must be modulo-ed into a number from 0 - 255 to fit into the filter.
            var bloomBit = id & BLOOM_MASK;
            // Create a mask that targets the specific bit associated with the directive.
            // JS bit operations are 32 bits, so this will be a number between 2^0 and 2^31, corresponding
            // to bit positions 0 - 31 in a 32 bit integer.
            var mask = 1 << bloomBit;
            // Use the raw bloomBit number to determine which bloom filter bucket we should check
            // e.g: bf0 = [0 - 31], bf1 = [32 - 63], bf2 = [64 - 95], bf3 = [96 - 127], etc
            var b7 = bloomBit & 0x80;
            var b6 = bloomBit & 0x40;
            var b5 = bloomBit & 0x20;
            var tData = tView.data;
            if (b7) {
                b6 ? (b5 ? (tData[injectorIndex + 7] |= mask) : (tData[injectorIndex + 6] |= mask)) :
                    (b5 ? (tData[injectorIndex + 5] |= mask) : (tData[injectorIndex + 4] |= mask));
            }
            else {
                b6 ? (b5 ? (tData[injectorIndex + 3] |= mask) : (tData[injectorIndex + 2] |= mask)) :
                    (b5 ? (tData[injectorIndex + 1] |= mask) : (tData[injectorIndex] |= mask));
            }
        }
    }
    function getOrCreateNodeInjector() {
        return getOrCreateNodeInjectorForNode(getPreviousOrParentTNode(), _getViewData());
    }
    /**
     * Creates (or gets an existing) injector for a given element or container.
     *
     * @param tNode for which an injector should be retrieved / created.
     * @param hostView View where the node is stored
     * @returns Node injector
     */
    function getOrCreateNodeInjectorForNode(tNode, hostView) {
        var existingInjectorIndex = getInjectorIndex(tNode, hostView);
        if (existingInjectorIndex !== -1) {
            return existingInjectorIndex;
        }
        var tView = hostView[TVIEW];
        if (tView.firstTemplatePass) {
            tNode.injectorIndex = hostView.length;
            setUpBloom(tView.data, tNode); // foundation for node bloom
            setUpBloom(hostView, null); // foundation for cumulative bloom
            setUpBloom(tView.blueprint, null);
        }
        var parentLoc = getParentInjectorLocation(tNode, hostView);
        var parentIndex = parentLoc & 32767 /* InjectorIndexMask */;
        var parentView = getParentInjectorView(parentLoc, hostView);
        var parentData = parentView[TVIEW].data;
        var injectorIndex = tNode.injectorIndex;
        // If a parent injector can't be found, its location is set to -1.
        // In that case, we don't need to set up a cumulative bloom
        if (parentLoc !== -1) {
            for (var i = 0; i < PARENT_INJECTOR; i++) {
                var bloomIndex = parentIndex + i;
                // Creates a cumulative bloom filter that merges the parent's bloom filter
                // and its own cumulative bloom (which contains tokens for all ancestors)
                hostView[injectorIndex + i] = parentView[bloomIndex] | parentData[bloomIndex];
            }
        }
        hostView[injectorIndex + PARENT_INJECTOR] = parentLoc;
        return injectorIndex;
    }
    function setUpBloom(arr, footer) {
        arr.push(0, 0, 0, 0, 0, 0, 0, 0, footer);
    }
    function getInjectorIndex(tNode, hostView) {
        if (tNode.injectorIndex === -1 ||
            // If the injector index is the same as its parent's injector index, then the index has been
            // copied down from the parent node. No injector has been created yet on this node.
            (tNode.parent && tNode.parent.injectorIndex === tNode.injectorIndex) ||
            // After the first template pass, the injector index might exist but the parent values
            // might not have been calculated yet for this instance
            hostView[tNode.injectorIndex + PARENT_INJECTOR] == null) {
            return -1;
        }
        else {
            return tNode.injectorIndex;
        }
    }
    /**
     * Finds the index of the parent injector, with a view offset if applicable. Used to set the
     * parent injector initially.
     */
    function getParentInjectorLocation(tNode, view) {
        if (tNode.parent && tNode.parent.injectorIndex !== -1) {
            return tNode.parent.injectorIndex; // view offset is 0
        }
        // For most cases, the parent injector index can be found on the host node (e.g. for component
        // or container), so this loop will be skipped, but we must keep the loop here to support
        // the rarer case of deeply nested <ng-template> tags or inline views.
        var hostTNode = view[HOST_NODE];
        var viewOffset = 1;
        while (hostTNode && hostTNode.injectorIndex === -1) {
            view = view[DECLARATION_VIEW];
            hostTNode = view[HOST_NODE];
            viewOffset++;
        }
        return hostTNode ?
            hostTNode.injectorIndex | (viewOffset << 15 /* ViewOffsetShift */) :
            -1;
    }
    /**
     * Unwraps a parent injector location number to find the view offset from the current injector,
     * then walks up the declaration view tree until the view is found that contains the parent
     * injector.
     *
     * @param location The location of the parent injector, which contains the view offset
     * @param startView The LViewData instance from which to start walking up the view tree
     * @returns The LViewData instance that contains the parent injector
     */
    function getParentInjectorView(location, startView) {
        var viewOffset = location >> 15 /* ViewOffsetShift */;
        var parentView = startView;
        // For most cases, the parent injector can be found on the host node (e.g. for component
        // or container), but we must keep the loop here to support the rarer case of deeply nested
        // <ng-template> tags or inline views, where the parent injector might live many views
        // above the child injector.
        while (viewOffset > 0) {
            parentView = parentView[DECLARATION_VIEW];
            viewOffset--;
        }
        return parentView;
    }
    /**
     * Makes a directive public to the DI system by adding it to an injector's bloom filter.
     *
     * @param di The node injector in which a directive will be added
     * @param def The definition of the directive to be made public
     */
    function diPublicInInjector(injectorIndex, view, def) {
        bloomAdd(injectorIndex, view[TVIEW], def.type);
    }
    /**
     * Makes a directive public to the DI system by adding it to an injector's bloom filter.
     *
     * @param def The definition of the directive to be made public
     */
    function diPublic(def) {
        diPublicInInjector(getOrCreateNodeInjector(), _getViewData(), def);
    }
    function directiveInject(token, flags) {
        if (flags === void 0) { flags = 0 /* Default */; }
        var hostTNode = getPreviousOrParentTNode();
        return getOrCreateInjectable(hostTNode, _getViewData(), token, flags);
    }
    /**
     * Inject static attribute value into directive constructor.
     *
     * This method is used with `factory` functions which are generated as part of
     * `defineDirective` or `defineComponent`. The method retrieves the static value
     * of an attribute. (Dynamic attributes are not supported since they are not resolved
     *  at the time of injection and can change over time.)
     *
     * # Example
     * Given:
     * ```
     * @Component(...)
     * class MyComponent {
     *   constructor(@Attribute('title') title: string) { ... }
     * }
     * ```
     * When instantiated with
     * ```
     * <my-component title="Hello"></my-component>
     * ```
     *
     * Then factory method generated is:
     * ```
     * MyComponent.ngComponentDef = defineComponent({
     *   factory: () => new MyComponent(injectAttribute('title'))
     *   ...
     * })
     * ```
     *
     * @publicApi
     */
    function injectAttribute(attrNameToInject) {
        var tNode = getPreviousOrParentTNode();
        ngDevMode && assertNodeOfPossibleTypes(tNode, 0 /* Container */, 3 /* Element */, 4 /* ElementContainer */);
        ngDevMode && assertDefined(tNode, 'expecting tNode');
        var attrs = tNode.attrs;
        if (attrs) {
            for (var i = 0; i < attrs.length; i = i + 2) {
                var attrName = attrs[i];
                if (attrName === 1 /* SelectOnly */)
                    break;
                if (attrName == attrNameToInject) {
                    return attrs[i + 1];
                }
            }
        }
        return undefined;
    }
    /**
     * Returns the value associated to the given token from the injectors.
     *
     * Look for the injector providing the token by walking up the node injector tree and then
     * the module injector tree.
     *
     * @param nodeInjector Node injector where the search should start
     * @param token The token to look for
     * @param flags Injection flags
     * @returns the value from the injector or `null` when not found
     */
    function getOrCreateInjectable(hostTNode, hostView, token, flags) {
        if (flags === void 0) { flags = 0 /* Default */; }
        var bloomHash = bloomHashBitOrFactory(token);
        // If the ID stored here is a function, this is a special object like ElementRef or TemplateRef
        // so just call the factory function to create it.
        if (typeof bloomHash === 'function')
            return bloomHash();
        // If the token has a bloom hash, then it is a directive that is public to the injection system
        // (diPublic) otherwise fall back to the module injector.
        if (bloomHash != null) {
            var startInjectorIndex = getInjectorIndex(hostTNode, hostView);
            var injectorIndex = startInjectorIndex;
            var injectorView = hostView;
            var parentLocation = -1;
            // If we should skip this injector or if an injector doesn't exist on this node (e.g. all
            // directives on this node are private), start by searching the parent injector.
            if (flags & 4 /* SkipSelf */ || injectorIndex === -1) {
                parentLocation = injectorIndex === -1 ? getParentInjectorLocation(hostTNode, hostView) :
                    injectorView[injectorIndex + PARENT_INJECTOR];
                if (shouldNotSearchParent(flags, parentLocation)) {
                    injectorIndex = -1;
                }
                else {
                    injectorIndex = parentLocation & 32767 /* InjectorIndexMask */;
                    injectorView = getParentInjectorView(parentLocation, injectorView);
                }
            }
            while (injectorIndex !== -1) {
                // Traverse up the injector tree until we find a potential match or until we know there
                // *isn't* a match. Outer loop is necessary in case we get a false positive injector.
                while (injectorIndex !== -1) {
                    // Check the current injector. If it matches, stop searching for an injector.
                    if (injectorHasToken(bloomHash, injectorIndex, injectorView[TVIEW].data)) {
                        break;
                    }
                    parentLocation = injectorView[injectorIndex + PARENT_INJECTOR];
                    if (shouldNotSearchParent(flags, parentLocation)) {
                        injectorIndex = -1;
                        break;
                    }
                    // If the ancestor bloom filter value has the bit corresponding to the directive, traverse
                    // up to find the specific injector. If the ancestor bloom filter does not have the bit, we
                    // can abort.
                    if (injectorHasToken(bloomHash, injectorIndex, injectorView)) {
                        injectorIndex = parentLocation & 32767 /* InjectorIndexMask */;
                        injectorView = getParentInjectorView(parentLocation, injectorView);
                    }
                    else {
                        injectorIndex = -1;
                        break;
                    }
                }
                // If no injector is found, we *know* that there is no ancestor injector that contains the
                // token, so we abort.
                if (injectorIndex === -1) {
                    break;
                }
                // At this point, we have an injector which *may* contain the token, so we step through the
                // directives associated with the injector's corresponding node to get the directive instance.
                var instance = void 0;
                if (instance = searchDirectivesOnInjector(injectorIndex, injectorView, token)) {
                    return instance;
                }
                // If we *didn't* find the directive for the token and we are searching the current node's
                // injector, it's possible the directive is on this node and hasn't been created yet.
                if (injectorIndex === startInjectorIndex && hostView === injectorView &&
                    (instance = searchMatchesQueuedForCreation(token, injectorView[TVIEW]))) {
                    return instance;
                }
                // The def wasn't found anywhere on this node, so it was a false positive.
                // Traverse up the tree and continue searching.
                injectorIndex = parentLocation & 32767 /* InjectorIndexMask */;
                injectorView = getParentInjectorView(parentLocation, injectorView);
            }
        }
        var moduleInjector = hostView[INJECTOR$1];
        var formerInjector = setCurrentInjector(moduleInjector);
        try {
            return inject(token, flags);
        }
        finally {
            setCurrentInjector(formerInjector);
        }
    }
    function searchMatchesQueuedForCreation(token, hostTView) {
        var matches = hostTView.currentMatches;
        if (matches) {
            for (var i = 0; i < matches.length; i += 2) {
                var def = matches[i];
                if (def.type === token) {
                    return resolveDirective(def, i + 1, matches);
                }
            }
        }
        return null;
    }
    function searchDirectivesOnInjector(injectorIndex, injectorView, token) {
        var tNode = injectorView[TVIEW].data[injectorIndex + TNODE];
        var nodeFlags = tNode.flags;
        var count = nodeFlags & 4095 /* DirectiveCountMask */;
        if (count !== 0) {
            var start = nodeFlags >> 15 /* DirectiveStartingIndexShift */;
            var end = start + count;
            var defs = injectorView[TVIEW].data;
            for (var i = start; i < end; i++) {
                // Get the definition for the directive at this index and, if it is injectable (diPublic),
                // and matches the given token, return the directive instance.
                var directiveDef = defs[i];
                if (directiveDef.type === token && directiveDef.diPublic) {
                    return injectorView[i];
                }
            }
        }
        return null;
    }
    /**
     * Returns the bit in an injector's bloom filter that should be used to determine whether or not
     * the directive might be provided by the injector.
     *
     * When a directive is public, it is added to the bloom filter and given a unique ID that can be
     * retrieved on the Type. When the directive isn't public or the token is not a directive `null`
     * is returned as the node injector can not possibly provide that token.
     *
     * @param token the injection token
     * @returns the matching bit to check in the bloom filter or `null` if the token is not known.
     */
    function bloomHashBitOrFactory(token) {
        ngDevMode && assertDefined(token, 'token must be defined');
        var tokenId = token[NG_ELEMENT_ID];
        return typeof tokenId === 'number' ? tokenId & BLOOM_MASK : tokenId;
    }
    function injectorHasToken(bloomHash, injectorIndex, injectorView) {
        // Create a mask that targets the specific bit associated with the directive we're looking for.
        // JS bit operations are 32 bits, so this will be a number between 2^0 and 2^31, corresponding
        // to bit positions 0 - 31 in a 32 bit integer.
        var mask = 1 << bloomHash;
        var b7 = bloomHash & 0x80;
        var b6 = bloomHash & 0x40;
        var b5 = bloomHash & 0x20;
        // Our bloom filter size is 256 bits, which is eight 32-bit bloom filter buckets:
        // bf0 = [0 - 31], bf1 = [32 - 63], bf2 = [64 - 95], bf3 = [96 - 127], etc.
        // Get the bloom filter value from the appropriate bucket based on the directive's bloomBit.
        var value;
        if (b7) {
            value = b6 ? (b5 ? injectorView[injectorIndex + 7] : injectorView[injectorIndex + 6]) :
                (b5 ? injectorView[injectorIndex + 5] : injectorView[injectorIndex + 4]);
        }
        else {
            value = b6 ? (b5 ? injectorView[injectorIndex + 3] : injectorView[injectorIndex + 2]) :
                (b5 ? injectorView[injectorIndex + 1] : injectorView[injectorIndex]);
        }
        // If the bloom filter value has the bit corresponding to the directive's bloomBit flipped on,
        // this injector is a potential match.
        return !!(value & mask);
    }
    /** Returns true if flags prevent parent injector from being searched for tokens */
    function shouldNotSearchParent(flags, parentLocation) {
        return flags & 2 /* Self */ ||
            (flags & 1 /* Host */ && (parentLocation >> 15 /* ViewOffsetShift */) > 0);
    }
    var NodeInjector = /** @class */ (function () {
        function NodeInjector(_tNode, _hostView) {
            this._tNode = _tNode;
            this._hostView = _hostView;
            this._injectorIndex = getOrCreateNodeInjectorForNode(_tNode, _hostView);
        }
        NodeInjector.prototype.get = function (token) {
            setEnvironment(this._tNode, this._hostView);
            return getOrCreateInjectable(this._tNode, this._hostView, token);
        };
        return NodeInjector;
    }());
    function getFactoryOf(type) {
        var typeAny = type;
        var def = getComponentDef(typeAny) || getDirectiveDef(typeAny) ||
            getPipeDef(typeAny) || getInjectableDef(typeAny) || getInjectorDef(typeAny);
        if (!def || def.factory === undefined) {
            return null;
        }
        return def.factory;
    }
    function getInheritedFactory(type) {
        var proto = Object.getPrototypeOf(type.prototype).constructor;
        var factory = getFactoryOf(proto);
        if (factory !== null) {
            return factory;
        }
        else {
            // There is no factory defined. Either this was improper usage of inheritance
            // (no Angular decorator on the superclass) or there is no constructor at all
            // in the inheritance chain. Since the two cases cannot be distinguished, the
            // latter has to be assumed.
            return function (t) { return new t(); };
        }
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * This feature publishes the directive (or component) into the DI system, making it visible to
     * others for injection.
     *
     * @param definition
     */
    function PublicFeature(definition) {
        definition.diPublic = diPublic;
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Represents a component created by a `ComponentFactory`.
     * Provides access to the component instance and related objects,
     * and provides the means of destroying the instance.
     *
     * @publicApi
     */
    var ComponentRef = /** @class */ (function () {
        function ComponentRef() {
        }
        return ComponentRef;
    }());
    /**
     * @publicApi
     */
    var ComponentFactory = /** @class */ (function () {
        function ComponentFactory() {
        }
        return ComponentFactory;
    }());

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    function noComponentFactoryError(component) {
        var error = Error("No component factory found for " + stringify(component) + ". Did you add it to @NgModule.entryComponents?");
        error[ERROR_COMPONENT] = component;
        return error;
    }
    var ERROR_COMPONENT = 'ngComponent';
    var _NullComponentFactoryResolver = /** @class */ (function () {
        function _NullComponentFactoryResolver() {
        }
        _NullComponentFactoryResolver.prototype.resolveComponentFactory = function (component) {
            throw noComponentFactoryError(component);
        };
        return _NullComponentFactoryResolver;
    }());
    /**
     * @publicApi
     */
    var ComponentFactoryResolver = /** @class */ (function () {
        function ComponentFactoryResolver() {
        }
        ComponentFactoryResolver.NULL = new _NullComponentFactoryResolver();
        return ComponentFactoryResolver;
    }());
    var CodegenComponentFactoryResolver = /** @class */ (function () {
        function CodegenComponentFactoryResolver(factories, _parent, _ngModule) {
            this._parent = _parent;
            this._ngModule = _ngModule;
            this._factories = new Map();
            for (var i = 0; i < factories.length; i++) {
                var factory = factories[i];
                this._factories.set(factory.componentType, factory);
            }
        }
        CodegenComponentFactoryResolver.prototype.resolveComponentFactory = function (component) {
            var factory = this._factories.get(component);
            if (!factory && this._parent) {
                factory = this._parent.resolveComponentFactory(component);
            }
            if (!factory) {
                throw noComponentFactoryError(component);
            }
            return new ComponentFactoryBoundToModule(factory, this._ngModule);
        };
        return CodegenComponentFactoryResolver;
    }());
    var ComponentFactoryBoundToModule = /** @class */ (function (_super) {
        __extends(ComponentFactoryBoundToModule, _super);
        function ComponentFactoryBoundToModule(factory, ngModule) {
            var _this = _super.call(this) || this;
            _this.factory = factory;
            _this.ngModule = ngModule;
            _this.selector = factory.selector;
            _this.componentType = factory.componentType;
            _this.ngContentSelectors = factory.ngContentSelectors;
            _this.inputs = factory.inputs;
            _this.outputs = factory.outputs;
            return _this;
        }
        ComponentFactoryBoundToModule.prototype.create = function (injector, projectableNodes, rootSelectorOrNode, ngModule) {
            return this.factory.create(injector, projectableNodes, rootSelectorOrNode, ngModule || this.ngModule);
        };
        return ComponentFactoryBoundToModule;
    }(ComponentFactory));

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Represents an instance of an NgModule created via a {@link NgModuleFactory}.
     *
     * `NgModuleRef` provides access to the NgModule Instance as well other objects related to this
     * NgModule Instance.
     *
     * @publicApi
     */
    var NgModuleRef = /** @class */ (function () {
        function NgModuleRef() {
        }
        return NgModuleRef;
    }());
    /**
     * @publicApi
     */
    var NgModuleFactory = /** @class */ (function () {
        function NgModuleFactory() {
        }
        return NgModuleFactory;
    }());

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var ViewRef = /** @class */ (function () {
        function ViewRef(_view, _context, _componentIndex) {
            this._context = _context;
            this._componentIndex = _componentIndex;
            this._appRef = null;
            this._viewContainerRef = null;
            /**
             * @internal
             */
            this._tViewNode = null;
            this._view = _view;
        }
        Object.defineProperty(ViewRef.prototype, "context", {
            get: function () { return this._context ? this._context : this._lookUpContext(); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ViewRef.prototype, "destroyed", {
            get: function () {
                return (this._view[FLAGS] & 32 /* Destroyed */) === 32 /* Destroyed */;
            },
            enumerable: true,
            configurable: true
        });
        ViewRef.prototype.destroy = function () {
            if (this._viewContainerRef && viewAttached(this._view)) {
                this._viewContainerRef.detach(this._viewContainerRef.indexOf(this));
                this._viewContainerRef = null;
            }
            destroyLView(this._view);
        };
        ViewRef.prototype.onDestroy = function (callback) { storeCleanupFn(this._view, callback); };
        /**
         * Marks a view and all of its ancestors dirty.
         *
         * It also triggers change detection by calling `scheduleTick` internally, which coalesces
         * multiple `markForCheck` calls to into one change detection run.
         *
         * This can be used to ensure an {@link ChangeDetectionStrategy#OnPush OnPush} component is
         * checked when it needs to be re-rendered but the two normal triggers haven't marked it
         * dirty (i.e. inputs haven't changed and events haven't fired in the view).
         *
         * <!-- TODO: Add a link to a chapter on OnPush components -->
         *
         * @usageNotes
         * ### Example
         *
         * ```typescript
         * @Component({
         *   selector: 'my-app',
         *   template: `Number of ticks: {{numberOfTicks}}`
         *   changeDetection: ChangeDetectionStrategy.OnPush,
         * })
         * class AppComponent {
         *   numberOfTicks = 0;
         *
         *   constructor(private ref: ChangeDetectorRef) {
         *     setInterval(() => {
         *       this.numberOfTicks++;
         *       // the following is required, otherwise the view will not be updated
         *       this.ref.markForCheck();
         *     }, 1000);
         *   }
         * }
         * ```
         */
        ViewRef.prototype.markForCheck = function () { markViewDirty(this._view); };
        /**
         * Detaches the view from the change detection tree.
         *
         * Detached views will not be checked during change detection runs until they are
         * re-attached, even if they are dirty. `detach` can be used in combination with
         * {@link ChangeDetectorRef#detectChanges detectChanges} to implement local change
         * detection checks.
         *
         * <!-- TODO: Add a link to a chapter on detach/reattach/local digest -->
         * <!-- TODO: Add a live demo once ref.detectChanges is merged into master -->
         *
         * @usageNotes
         * ### Example
         *
         * The following example defines a component with a large list of readonly data.
         * Imagine the data changes constantly, many times per second. For performance reasons,
         * we want to check and update the list every five seconds. We can do that by detaching
         * the component's change detector and doing a local check every five seconds.
         *
         * ```typescript
         * class DataProvider {
         *   // in a real application the returned data will be different every time
         *   get data() {
         *     return [1,2,3,4,5];
         *   }
         * }
         *
         * @Component({
         *   selector: 'giant-list',
         *   template: `
         *     <li *ngFor="let d of dataProvider.data">Data {{d}}</li>
         *   `,
         * })
         * class GiantList {
         *   constructor(private ref: ChangeDetectorRef, private dataProvider: DataProvider) {
         *     ref.detach();
         *     setInterval(() => {
         *       this.ref.detectChanges();
         *     }, 5000);
         *   }
         * }
         *
         * @Component({
         *   selector: 'app',
         *   providers: [DataProvider],
         *   template: `
         *     <giant-list><giant-list>
         *   `,
         * })
         * class App {
         * }
         * ```
         */
        ViewRef.prototype.detach = function () { this._view[FLAGS] &= ~8 /* Attached */; };
        /**
         * Re-attaches a view to the change detection tree.
         *
         * This can be used to re-attach views that were previously detached from the tree
         * using {@link ChangeDetectorRef#detach detach}. Views are attached to the tree by default.
         *
         * <!-- TODO: Add a link to a chapter on detach/reattach/local digest -->
         *
         * @usageNotes
         * ### Example
         *
         * The following example creates a component displaying `live` data. The component will detach
         * its change detector from the main change detector tree when the component's live property
         * is set to false.
         *
         * ```typescript
         * class DataProvider {
         *   data = 1;
         *
         *   constructor() {
         *     setInterval(() => {
         *       this.data = this.data * 2;
         *     }, 500);
         *   }
         * }
         *
         * @Component({
         *   selector: 'live-data',
         *   inputs: ['live'],
         *   template: 'Data: {{dataProvider.data}}'
         * })
         * class LiveData {
         *   constructor(private ref: ChangeDetectorRef, private dataProvider: DataProvider) {}
         *
         *   set live(value) {
         *     if (value) {
         *       this.ref.reattach();
         *     } else {
         *       this.ref.detach();
         *     }
         *   }
         * }
         *
         * @Component({
         *   selector: 'my-app',
         *   providers: [DataProvider],
         *   template: `
         *     Live Update: <input type="checkbox" [(ngModel)]="live">
         *     <live-data [live]="live"><live-data>
         *   `,
         * })
         * class AppComponent {
         *   live = true;
         * }
         * ```
         */
        ViewRef.prototype.reattach = function () { this._view[FLAGS] |= 8 /* Attached */; };
        /**
         * Checks the view and its children.
         *
         * This can also be used in combination with {@link ChangeDetectorRef#detach detach} to implement
         * local change detection checks.
         *
         * <!-- TODO: Add a link to a chapter on detach/reattach/local digest -->
         * <!-- TODO: Add a live demo once ref.detectChanges is merged into master -->
         *
         * @usageNotes
         * ### Example
         *
         * The following example defines a component with a large list of readonly data.
         * Imagine, the data changes constantly, many times per second. For performance reasons,
         * we want to check and update the list every five seconds.
         *
         * We can do that by detaching the component's change detector and doing a local change detection
         * check every five seconds.
         *
         * See {@link ChangeDetectorRef#detach detach} for more information.
         */
        ViewRef.prototype.detectChanges = function () {
            var rendererFactory = getRendererFactory();
            if (rendererFactory.begin) {
                rendererFactory.begin();
            }
            detectChanges(this.context);
            if (rendererFactory.end) {
                rendererFactory.end();
            }
        };
        /**
         * Checks the change detector and its children, and throws if any changes are detected.
         *
         * This is used in development mode to verify that running change detection doesn't
         * introduce other changes.
         */
        ViewRef.prototype.checkNoChanges = function () { checkNoChanges(this.context); };
        ViewRef.prototype.attachToViewContainerRef = function (vcRef) { this._viewContainerRef = vcRef; };
        ViewRef.prototype.detachFromAppRef = function () { this._appRef = null; };
        ViewRef.prototype.attachToAppRef = function (appRef) { this._appRef = appRef; };
        ViewRef.prototype._lookUpContext = function () {
            return this._context = this._view[PARENT][this._componentIndex];
        };
        return ViewRef;
    }());
    /** @internal */
    var RootViewRef = /** @class */ (function (_super) {
        __extends(RootViewRef, _super);
        function RootViewRef(_view) {
            var _this = _super.call(this, _view, null, -1) || this;
            _this._view = _view;
            return _this;
        }
        RootViewRef.prototype.detectChanges = function () { detectChangesInRootView(this._view); };
        RootViewRef.prototype.checkNoChanges = function () { checkNoChangesInRootView(this._view); };
        return RootViewRef;
    }(ViewRef));

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Creates an ElementRef from the most recent node.
     *
     * @returns The ElementRef instance to use
     */
    function injectElementRef(ElementRefToken) {
        return createElementRef(ElementRefToken, getPreviousOrParentTNode(), _getViewData());
    }
    var R3ElementRef;
    /**
     * Creates an ElementRef given a node.
     *
     * @param ElementRefToken The ElementRef type
     * @param tNode The node for which you'd like an ElementRef
     * @param view The view to which the node belongs
     * @returns The ElementRef instance to use
     */
    function createElementRef(ElementRefToken, tNode, view) {
        if (!R3ElementRef) {
            // TODO: Fix class name, should be ElementRef, but there appears to be a rollup bug
            R3ElementRef = /** @class */ (function (_super) {
                __extends(ElementRef_, _super);
                function ElementRef_() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                return ElementRef_;
            }(ElementRefToken));
        }
        return new R3ElementRef(getNativeByTNode(tNode, view));
    }
    var R3TemplateRef;
    /**
     * Creates a TemplateRef given a node.
     *
     * @returns The TemplateRef instance to use
     */
    function injectTemplateRef(TemplateRefToken, ElementRefToken) {
        return createTemplateRef(TemplateRefToken, ElementRefToken, getPreviousOrParentTNode(), _getViewData());
    }
    /**
     * Creates a TemplateRef and stores it on the injector.
     *
     * @param TemplateRefToken The TemplateRef type
     * @param ElementRefToken The ElementRef type
     * @param hostTNode The node that is requesting a TemplateRef
     * @param hostView The view to which the node belongs
     * @returns The TemplateRef instance to use
     */
    function createTemplateRef(TemplateRefToken, ElementRefToken, hostTNode, hostView) {
        if (!R3TemplateRef) {
            // TODO: Fix class name, should be TemplateRef, but there appears to be a rollup bug
            R3TemplateRef = /** @class */ (function (_super) {
                __extends(TemplateRef_, _super);
                function TemplateRef_(_declarationParentView, elementRef, _tView, _renderer, _queries, _injectorIndex) {
                    var _this = _super.call(this) || this;
                    _this._declarationParentView = _declarationParentView;
                    _this.elementRef = elementRef;
                    _this._tView = _tView;
                    _this._renderer = _renderer;
                    _this._queries = _queries;
                    _this._injectorIndex = _injectorIndex;
                    return _this;
                }
                TemplateRef_.prototype.createEmbeddedView = function (context, container$$1, hostTNode, hostView, index) {
                    var lView = createEmbeddedViewAndNode(this._tView, context, this._declarationParentView, this._renderer, this._queries, this._injectorIndex);
                    if (container$$1) {
                        insertView(lView, container$$1, hostView, index, hostTNode.index);
                    }
                    renderEmbeddedTemplate(lView, this._tView, context, 1 /* Create */);
                    var viewRef = new ViewRef(lView, context, -1);
                    viewRef._tViewNode = lView[HOST_NODE];
                    return viewRef;
                };
                return TemplateRef_;
            }(TemplateRefToken));
        }
        var hostContainer = hostView[hostTNode.index];
        ngDevMode && assertNodeType(hostTNode, 0 /* Container */);
        ngDevMode && assertDefined(hostTNode.tViews, 'TView must be allocated');
        return new R3TemplateRef(hostView, createElementRef(ElementRefToken, hostTNode, hostView), hostTNode.tViews, getRenderer(), hostContainer[QUERIES], hostTNode.injectorIndex);
    }
    var R3ViewContainerRef;
    /**
     * Creates a ViewContainerRef and stores it on the injector. Or, if the ViewContainerRef
     * already exists, retrieves the existing ViewContainerRef.
     *
     * @returns The ViewContainerRef instance to use
     */
    function injectViewContainerRef(ViewContainerRefToken, ElementRefToken) {
        var previousTNode = getPreviousOrParentTNode();
        return createContainerRef(ViewContainerRefToken, ElementRefToken, previousTNode, _getViewData());
    }
    /**
     * Creates a ViewContainerRef and stores it on the injector.
     *
     * @param ViewContainerRefToken The ViewContainerRef type
     * @param ElementRefToken The ElementRef type
     * @param hostTNode The node that is requesting a ViewContainerRef
     * @param hostView The view to which the node belongs
     * @returns The ViewContainerRef instance to use
     */
    function createContainerRef(ViewContainerRefToken, ElementRefToken, hostTNode, hostView) {
        if (!R3ViewContainerRef) {
            // TODO: Fix class name, should be ViewContainerRef, but there appears to be a rollup bug
            R3ViewContainerRef = /** @class */ (function (_super) {
                __extends(ViewContainerRef_, _super);
                function ViewContainerRef_(_lContainer, _hostTNode, _hostView) {
                    var _this = _super.call(this) || this;
                    _this._lContainer = _lContainer;
                    _this._hostTNode = _hostTNode;
                    _this._hostView = _hostView;
                    _this._viewRefs = [];
                    return _this;
                }
                Object.defineProperty(ViewContainerRef_.prototype, "element", {
                    get: function () {
                        return createElementRef(ElementRefToken, this._hostTNode, this._hostView);
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(ViewContainerRef_.prototype, "injector", {
                    get: function () { return new NodeInjector(this._hostTNode, this._hostView); },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(ViewContainerRef_.prototype, "parentInjector", {
                    /** @deprecated No replacement */
                    get: function () {
                        var parentLocation = getParentInjectorLocation(this._hostTNode, this._hostView);
                        var parentView = getParentInjectorView(parentLocation, this._hostView);
                        var parentIndex = parentLocation & 32767 /* InjectorIndexMask */;
                        var parentTNode = parentView[TVIEW].data[parentIndex];
                        return parentLocation === -1 ? new NullInjector() :
                            new NodeInjector(parentTNode, parentView);
                    },
                    enumerable: true,
                    configurable: true
                });
                ViewContainerRef_.prototype.clear = function () {
                    while (this._lContainer[VIEWS].length) {
                        this.remove(0);
                    }
                };
                ViewContainerRef_.prototype.get = function (index) { return this._viewRefs[index] || null; };
                Object.defineProperty(ViewContainerRef_.prototype, "length", {
                    get: function () { return this._lContainer[VIEWS].length; },
                    enumerable: true,
                    configurable: true
                });
                ViewContainerRef_.prototype.createEmbeddedView = function (templateRef, context, index) {
                    var adjustedIdx = this._adjustIndex(index);
                    var viewRef = templateRef
                        .createEmbeddedView(context || {}, this._lContainer, this._hostTNode, this._hostView, adjustedIdx);
                    viewRef.attachToViewContainerRef(this);
                    this._viewRefs.splice(adjustedIdx, 0, viewRef);
                    return viewRef;
                };
                ViewContainerRef_.prototype.createComponent = function (componentFactory, index, injector, projectableNodes, ngModuleRef) {
                    var contextInjector = injector || this.parentInjector;
                    if (!ngModuleRef && contextInjector) {
                        ngModuleRef = contextInjector.get(NgModuleRef, null);
                    }
                    var componentRef = componentFactory.create(contextInjector, projectableNodes, undefined, ngModuleRef);
                    this.insert(componentRef.hostView, index);
                    return componentRef;
                };
                ViewContainerRef_.prototype.insert = function (viewRef, index) {
                    if (viewRef.destroyed) {
                        throw new Error('Cannot insert a destroyed View in a ViewContainer!');
                    }
                    var lView = viewRef._view;
                    var adjustedIdx = this._adjustIndex(index);
                    insertView(lView, this._lContainer, this._hostView, adjustedIdx, this._hostTNode.index);
                    var beforeNode = getBeforeNodeForView(adjustedIdx, this._lContainer[VIEWS], this._lContainer[NATIVE]);
                    addRemoveViewFromContainer(lView, true, beforeNode);
                    viewRef.attachToViewContainerRef(this);
                    this._viewRefs.splice(adjustedIdx, 0, viewRef);
                    return viewRef;
                };
                ViewContainerRef_.prototype.move = function (viewRef, newIndex) {
                    var index = this.indexOf(viewRef);
                    this.detach(index);
                    this.insert(viewRef, this._adjustIndex(newIndex));
                    return viewRef;
                };
                ViewContainerRef_.prototype.indexOf = function (viewRef) { return this._viewRefs.indexOf(viewRef); };
                ViewContainerRef_.prototype.remove = function (index) {
                    var adjustedIdx = this._adjustIndex(index, -1);
                    removeView(this._lContainer, this._hostTNode, adjustedIdx);
                    this._viewRefs.splice(adjustedIdx, 1);
                };
                ViewContainerRef_.prototype.detach = function (index) {
                    var adjustedIdx = this._adjustIndex(index, -1);
                    detachView(this._lContainer, adjustedIdx, !!this._hostTNode.detached);
                    return this._viewRefs.splice(adjustedIdx, 1)[0] || null;
                };
                ViewContainerRef_.prototype._adjustIndex = function (index, shift) {
                    if (shift === void 0) { shift = 0; }
                    if (index == null) {
                        return this._lContainer[VIEWS].length + shift;
                    }
                    if (ngDevMode) {
                        assertGreaterThan(index, -1, 'index must be positive');
                        // +1 because it's legal to insert at the end.
                        assertLessThan(index, this._lContainer[VIEWS].length + 1 + shift, 'index');
                    }
                    return index;
                };
                return ViewContainerRef_;
            }(ViewContainerRefToken));
        }
        ngDevMode && assertNodeOfPossibleTypes(hostTNode, 0 /* Container */, 3 /* Element */, 4 /* ElementContainer */);
        var lContainer;
        var slotValue = hostView[hostTNode.index];
        if (isLContainer(slotValue)) {
            // If the host is a container, we don't need to create a new LContainer
            lContainer = slotValue;
            lContainer[ACTIVE_INDEX] = -1;
        }
        else {
            var comment = hostView[RENDERER].createComment(ngDevMode ? 'container' : '');
            ngDevMode && ngDevMode.rendererCreateComment++;
            hostView[hostTNode.index] = lContainer =
                createLContainer(slotValue, hostTNode, hostView, comment, true);
            appendChild(comment, hostTNode, hostView);
            addToViewTree(hostView, hostTNode.index, lContainer);
        }
        return new R3ViewContainerRef(lContainer, hostTNode, hostView);
    }
    /** Returns a ChangeDetectorRef (a.k.a. a ViewRef) */
    function injectChangeDetectorRef() {
        return createViewRef(getPreviousOrParentTNode(), _getViewData(), null);
    }
    /**
     * Creates a ViewRef and stores it on the injector as ChangeDetectorRef (public alias).
     *
     * @param hostTNode The node that is requesting a ChangeDetectorRef
     * @param hostView The view to which the node belongs
     * @param context The context for this change detector ref
     * @returns The ChangeDetectorRef to use
     */
    function createViewRef(hostTNode, hostView, context) {
        if (isComponent(hostTNode)) {
            var componentIndex = hostTNode.flags >> 15 /* DirectiveStartingIndexShift */;
            var componentView = getComponentViewByIndex(hostTNode.index, hostView);
            return new ViewRef(componentView, context, componentIndex);
        }
        else if (hostTNode.type === 3 /* Element */) {
            var hostComponentView = findComponentView(hostView);
            return new ViewRef(hostComponentView, hostComponentView[CONTEXT], -1);
        }
        return null;
    }
    function getOrCreateRenderer2(view) {
        var renderer = view[RENDERER];
        if (isProceduralRenderer(renderer)) {
            return renderer;
        }
        else {
            throw new Error('Cannot inject Renderer2 when the application uses Renderer3!');
        }
    }
    /** Returns a Renderer2 (or throws when application was bootstrapped with Renderer3) */
    function injectRenderer2() {
        return getOrCreateRenderer2(_getViewData());
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var R3_ELEMENT_REF_FACTORY = injectElementRef;
    var R3_TEMPLATE_REF_FACTORY = injectTemplateRef;
    var R3_CHANGE_DETECTOR_REF_FACTORY = injectChangeDetectorRef;
    var R3_VIEW_CONTAINER_REF_FACTORY = injectViewContainerRef;
    var R3_RENDERER2_FACTORY = injectRenderer2;

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    function noopFactory() {
        var tokens = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            tokens[_i] = arguments[_i];
        }
    }
    var R3_ELEMENT_REF_FACTORY__POST_NGCC__ = R3_ELEMENT_REF_FACTORY;
    var R3_TEMPLATE_REF_FACTORY__POST_NGCC__ = R3_TEMPLATE_REF_FACTORY;
    var R3_CHANGE_DETECTOR_REF_FACTORY__POST_NGCC__ = R3_CHANGE_DETECTOR_REF_FACTORY;
    var R3_VIEW_CONTAINER_REF_FACTORY__POST_NGCC__ = R3_VIEW_CONTAINER_REF_FACTORY;
    var R3_RENDERER2_FACTORY__POST_NGCC__ = R3_RENDERER2_FACTORY;
    var R3_ELEMENT_REF_FACTORY__PRE_NGCC__ = noopFactory;
    var R3_TEMPLATE_REF_FACTORY__PRE_NGCC__ = noopFactory;
    var R3_CHANGE_DETECTOR_REF_FACTORY__PRE_NGCC__ = noopFactory;
    var R3_VIEW_CONTAINER_REF_FACTORY__PRE_NGCC__ = noopFactory;
    var R3_RENDERER2_FACTORY__PRE_NGCC__ = noopFactory;
    var R3_ELEMENT_REF_FACTORY$1 = R3_ELEMENT_REF_FACTORY__PRE_NGCC__;
    var R3_TEMPLATE_REF_FACTORY$1 = R3_TEMPLATE_REF_FACTORY__PRE_NGCC__;
    var R3_CHANGE_DETECTOR_REF_FACTORY$1 = R3_CHANGE_DETECTOR_REF_FACTORY__PRE_NGCC__;
    var R3_VIEW_CONTAINER_REF_FACTORY$1 = R3_VIEW_CONTAINER_REF_FACTORY__PRE_NGCC__;
    var R3_RENDERER2_FACTORY$1 = R3_RENDERER2_FACTORY__PRE_NGCC__;

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * A wrapper around a native element inside of a View.
     *
     * An `ElementRef` is backed by a render-specific element. In the browser, this is usually a DOM
     * element.
     *
     * @security Permitting direct access to the DOM can make your application more vulnerable to
     * XSS attacks. Carefully review any use of `ElementRef` in your code. For more detail, see the
     * [Security Guide](http://g.co/ng/security).
     *
     * @publicApi
     */
    // Note: We don't expose things like `Injector`, `ViewContainer`, ... here,
    // i.e. users have to ask for what they need. With that, we can build better analysis tools
    // and could do better codegen in the future.
    var ElementRef = /** @class */ (function () {
        function ElementRef(nativeElement) {
            this.nativeElement = nativeElement;
        }
        /** @internal */
        ElementRef.__NG_ELEMENT_ID__ = function () { return R3_ELEMENT_REF_FACTORY$1(ElementRef); };
        return ElementRef;
    }());

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * @deprecated Use `RendererType2` (and `Renderer2`) instead.
     * @publicApi
     */
    var RenderComponentType = /** @class */ (function () {
        function RenderComponentType(id, templateUrl, slotCount, encapsulation, styles, animations) {
            this.id = id;
            this.templateUrl = templateUrl;
            this.slotCount = slotCount;
            this.encapsulation = encapsulation;
            this.styles = styles;
            this.animations = animations;
        }
        return RenderComponentType;
    }());
    /**
     * @deprecated Debug info is handled internally in the view engine now.
     */
    var RenderDebugInfo = /** @class */ (function () {
        function RenderDebugInfo() {
        }
        return RenderDebugInfo;
    }());
    /**
     * @deprecated Use the `Renderer2` instead.
     * @publicApi
     */
    var Renderer = /** @class */ (function () {
        function Renderer() {
        }
        return Renderer;
    }());
    var Renderer2Interceptor = new InjectionToken('Renderer2Interceptor');
    /**
     * Injectable service that provides a low-level interface for modifying the UI.
     *
     * Use this service to bypass Angular's templating and make custom UI changes that can't be
     * expressed declaratively. For example if you need to set a property or an attribute whose name is
     * not statically known, use {@link Renderer#setElementProperty setElementProperty} or
     * {@link Renderer#setElementAttribute setElementAttribute} respectively.
     *
     * If you are implementing a custom renderer, you must implement this interface.
     *
     * The default Renderer implementation is `DomRenderer`. Also available is `WebWorkerRenderer`.
     *
     * @deprecated Use `RendererFactory2` instead.
     * @publicApi
     */
    var RootRenderer = /** @class */ (function () {
        function RootRenderer() {
        }
        return RootRenderer;
    }());
    /**
     * Creates and initializes a custom renderer that implements the `Renderer2` base class.
     *
     * @publicApi
     */
    var RendererFactory2 = /** @class */ (function () {
        function RendererFactory2() {
        }
        return RendererFactory2;
    }());
    (function (RendererStyleFlags2) {
        /**
         * Marks a style as important.
         */
        RendererStyleFlags2[RendererStyleFlags2["Important"] = 1] = "Important";
        /**
         * Marks a style as using dash case naming (this-is-dash-case).
         */
        RendererStyleFlags2[RendererStyleFlags2["DashCase"] = 2] = "DashCase";
    })(exports.RendererStyleFlags2 || (exports.RendererStyleFlags2 = {}));
    /**
     * Extend this base class to implement custom rendering. By default, Angular
     * renders a template into DOM. You can use custom rendering to intercept
     * rendering calls, or to render to something other than DOM.
     *
     * Create your custom renderer using `RendererFactory2`.
     *
     * Use a custom renderer to bypass Angular's templating and
     * make custom UI changes that can't be expressed declaratively.
     * For example if you need to set a property or an attribute whose name is
     * not statically known, use the `setProperty()` or
     * `setAttribute()` method.
     *
     * @publicApi
     */
    var Renderer2 = /** @class */ (function () {
        function Renderer2() {
        }
        /** @internal */
        Renderer2.__NG_ELEMENT_ID__ = function () { return R3_RENDERER2_FACTORY$1(); };
        return Renderer2;
    }());

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var ComponentFactoryResolver$1 = /** @class */ (function (_super) {
        __extends(ComponentFactoryResolver$$1, _super);
        function ComponentFactoryResolver$$1() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ComponentFactoryResolver$$1.prototype.resolveComponentFactory = function (component) {
            ngDevMode && assertComponentType(component);
            var componentDef = getComponentDef(component);
            return new ComponentFactory$1(componentDef);
        };
        return ComponentFactoryResolver$$1;
    }(ComponentFactoryResolver));
    function toRefArray(map) {
        var array = [];
        for (var nonMinified in map) {
            if (map.hasOwnProperty(nonMinified)) {
                var minified = map[nonMinified];
                array.push({ propName: minified, templateName: nonMinified });
            }
        }
        return array;
    }
    /**
     * Default {@link RootContext} for all components rendered with {@link renderComponent}.
     */
    var ROOT_CONTEXT = new InjectionToken('ROOT_CONTEXT_TOKEN', { providedIn: 'root', factory: function () { return createRootContext(inject(SCHEDULER)); } });
    /**
     * A change detection scheduler token for {@link RootContext}. This token is the default value used
     * for the default `RootContext` found in the {@link ROOT_CONTEXT} token.
     */
    var SCHEDULER = new InjectionToken('SCHEDULER_TOKEN', {
        providedIn: 'root',
        factory: function () {
            var useRaf = typeof requestAnimationFrame !== 'undefined' && typeof window !== 'undefined';
            return useRaf ? requestAnimationFrame.bind(window) : setTimeout;
        },
    });
    /**
     * A function used to wrap the `RendererFactory2`.
     * Used in tests to change the `RendererFactory2` into a `DebugRendererFactory2`.
     */
    var WRAP_RENDERER_FACTORY2 = new InjectionToken('WRAP_RENDERER_FACTORY2');
    /**
     * Render3 implementation of {@link viewEngine_ComponentFactory}.
     */
    var ComponentFactory$1 = /** @class */ (function (_super) {
        __extends(ComponentFactory$$1, _super);
        function ComponentFactory$$1(componentDef) {
            var _this = _super.call(this) || this;
            _this.componentDef = componentDef;
            _this.componentType = componentDef.type;
            _this.selector = componentDef.selectors[0][0];
            _this.ngContentSelectors = [];
            return _this;
        }
        Object.defineProperty(ComponentFactory$$1.prototype, "inputs", {
            get: function () {
                return toRefArray(this.componentDef.inputs);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ComponentFactory$$1.prototype, "outputs", {
            get: function () {
                return toRefArray(this.componentDef.outputs);
            },
            enumerable: true,
            configurable: true
        });
        ComponentFactory$$1.prototype.create = function (injector, projectableNodes, rootSelectorOrNode, ngModule) {
            var isInternalRootView = rootSelectorOrNode === undefined;
            var rendererFactory;
            if (ngModule) {
                var wrapper = ngModule.injector.get(WRAP_RENDERER_FACTORY2, function (v) { return v; });
                rendererFactory = wrapper(ngModule.injector.get(RendererFactory2));
            }
            else {
                rendererFactory = domRendererFactory3;
            }
            var hostRNode = isInternalRootView ?
                elementCreate(this.selector, rendererFactory.createRenderer(null, this.componentDef)) :
                locateHostElement(rendererFactory, rootSelectorOrNode);
            // The first index of the first selector is the tag name.
            var componentTag = this.componentDef.selectors[0][0];
            var rootFlags = this.componentDef.onPush ? 4 /* Dirty */ | 64 /* IsRoot */ :
                2 /* CheckAlways */ | 64 /* IsRoot */;
            var rootContext = ngModule && !isInternalRootView ?
                ngModule.injector.get(ROOT_CONTEXT) :
                createRootContext(requestAnimationFrame.bind(window));
            var renderer = rendererFactory.createRenderer(hostRNode, this.componentDef);
            // Create the root view. Uses empty TView and ContentTemplate.
            var rootView = createLViewData(renderer, createTView(-1, null, 1, 0, null, null, null), rootContext, rootFlags);
            rootView[INJECTOR$1] = ngModule && ngModule.injector || null;
            // rootView is the parent when bootstrapping
            var oldView = enterView(rootView, null);
            var component;
            var tElementNode;
            try {
                if (rendererFactory.begin)
                    rendererFactory.begin();
                var componentView = createRootComponentView(hostRNode, this.componentDef, rootView, renderer);
                tElementNode = getTNode(0, rootView);
                // Transform the arrays of native nodes into a structure that can be consumed by the
                // projection instruction. This is needed to support the reprojection of these nodes.
                if (projectableNodes) {
                    var index = 0;
                    var projection$$1 = tElementNode.projection = [];
                    for (var i = 0; i < projectableNodes.length; i++) {
                        var nodeList = projectableNodes[i];
                        var firstTNode = null;
                        var previousTNode = null;
                        for (var j = 0; j < nodeList.length; j++) {
                            adjustBlueprintForNewNode(rootView);
                            var tNode = createNodeAtIndex(++index, 3 /* Element */, nodeList[j], null, null);
                            previousTNode ? (previousTNode.next = tNode) : (firstTNode = tNode);
                            previousTNode = tNode;
                        }
                        projection$$1.push(firstTNode);
                    }
                }
                // TODO: should LifecycleHooksFeature and other host features be generated by the compiler and
                // executed here?
                // Angular 5 reference: https://stackblitz.com/edit/lifecycle-hooks-vcref
                component = createRootComponent(hostRNode, componentView, this.componentDef, rootView, rootContext, [LifecycleHooksFeature]);
                // Execute the template in creation mode only, and then turn off the CreationMode flag
                renderEmbeddedTemplate(componentView, componentView[TVIEW], component, 1 /* Create */);
                componentView[FLAGS] &= ~1 /* CreationMode */;
            }
            finally {
                enterView(oldView, null);
                if (rendererFactory.end)
                    rendererFactory.end();
            }
            var componentRef = new ComponentRef$1(this.componentType, component, rootView, injector, createElementRef(ElementRef, tElementNode, rootView));
            if (isInternalRootView) {
                // The host element of the internal root view is attached to the component's host view node
                componentRef.hostView._tViewNode.child = tElementNode;
            }
            return componentRef;
        };
        return ComponentFactory$$1;
    }(ComponentFactory));
    var componentFactoryResolver = new ComponentFactoryResolver$1();
    /**
     * Represents an instance of a Component created via a {@link ComponentFactory}.
     *
     * `ComponentRef` provides access to the Component Instance as well other objects related to this
     * Component Instance and allows you to destroy the Component Instance via the {@link #destroy}
     * method.
     *
     */
    var ComponentRef$1 = /** @class */ (function (_super) {
        __extends(ComponentRef$$1, _super);
        function ComponentRef$$1(componentType, instance, rootView, injector, location) {
            var _this = _super.call(this) || this;
            _this.location = location;
            _this.destroyCbs = [];
            _this.instance = instance;
            _this.hostView = _this.changeDetectorRef = new RootViewRef(rootView);
            _this.hostView._tViewNode = createViewNode(-1, rootView);
            _this.injector = injector;
            _this.componentType = componentType;
            return _this;
        }
        ComponentRef$$1.prototype.destroy = function () {
            ngDevMode && assertDefined(this.destroyCbs, 'NgModule already destroyed');
            this.destroyCbs.forEach(function (fn) { return fn(); });
            this.destroyCbs = null;
        };
        ComponentRef$$1.prototype.onDestroy = function (callback) {
            ngDevMode && assertDefined(this.destroyCbs, 'NgModule already destroyed');
            this.destroyCbs.push(callback);
        };
        return ComponentRef$$1;
    }(ComponentRef));

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var i18nTagRegex = /{\$([^}]+)}/g;
    /**
     * Takes a translation string, the initial list of placeholders (elements and expressions) and the
     * indexes of their corresponding expression nodes to return a list of instructions for each
     * template function.
     *
     * Because embedded templates have different indexes for each placeholder, each parameter (except
     * the translation) is an array, where each value corresponds to a different template, by order of
     * appearance.
     *
     * @param translation A translation string where placeholders are represented by `{$name}`
     * @param elements An array containing, for each template, the maps of element placeholders and
     * their indexes.
     * @param expressions An array containing, for each template, the maps of expression placeholders
     * and their indexes.
     * @param templateRoots An array of template roots whose content should be ignored when
     * generating the instructions for their parent template.
     * @param lastChildIndex The index of the last child of the i18n node. Used when the i18n block is
     * an ng-container.
     *
     * @returns A list of instructions used to translate each template.
     */
    function i18nMapping(translation, elements, expressions, templateRoots, lastChildIndex) {
        var translationParts = translation.split(i18nTagRegex);
        var nbTemplates = templateRoots ? templateRoots.length + 1 : 1;
        var instructions = (new Array(nbTemplates)).fill(undefined);
        generateMappingInstructions(0, 0, translationParts, instructions, elements, expressions, templateRoots, lastChildIndex);
        return instructions;
    }
    /**
     * Internal function that reads the translation parts and generates a set of instructions for each
     * template.
     *
     * See `i18nMapping()` for more details.
     *
     * @param tmplIndex The order of appearance of the template.
     * 0 for the root template, following indexes match the order in `templateRoots`.
     * @param partIndex The current index in `translationParts`.
     * @param translationParts The translation string split into an array of placeholders and text
     * elements.
     * @param instructions The current list of instructions to update.
     * @param elements An array containing, for each template, the maps of element placeholders and
     * their indexes.
     * @param expressions An array containing, for each template, the maps of expression placeholders
     * and their indexes.
     * @param templateRoots An array of template roots whose content should be ignored when
     * generating the instructions for their parent template.
     * @param lastChildIndex The index of the last child of the i18n node. Used when the i18n block is
     * an ng-container.
     *
     * @returns the current index in `translationParts`
     */
    function generateMappingInstructions(tmplIndex, partIndex, translationParts, instructions, elements, expressions, templateRoots, lastChildIndex) {
        var tmplInstructions = [];
        var phVisited = [];
        var openedTagCount = 0;
        var maxIndex = 0;
        var currentElements = elements && elements[tmplIndex] ? elements[tmplIndex] : null;
        var currentExpressions = expressions && expressions[tmplIndex] ? expressions[tmplIndex] : null;
        instructions[tmplIndex] = tmplInstructions;
        for (; partIndex < translationParts.length; partIndex++) {
            // The value can either be text or the name of a placeholder (element/template root/expression)
            var value = translationParts[partIndex];
            // Odd indexes are placeholders
            if (partIndex & 1) {
                var phIndex = void 0;
                if (currentElements && currentElements[value] !== undefined) {
                    phIndex = currentElements[value];
                    // The placeholder represents a DOM element, add an instruction to move it
                    var templateRootIndex = templateRoots ? templateRoots.indexOf(value) : -1;
                    if (templateRootIndex !== -1 && (templateRootIndex + 1) !== tmplIndex) {
                        // This is a template root, it has no closing tag, not treating it as an element
                        tmplInstructions.push(phIndex | -2147483648 /* TemplateRoot */);
                    }
                    else {
                        tmplInstructions.push(phIndex | 1073741824 /* Element */);
                        openedTagCount++;
                    }
                    phVisited.push(value);
                }
                else if (currentExpressions && currentExpressions[value] !== undefined) {
                    phIndex = currentExpressions[value];
                    // The placeholder represents an expression, add an instruction to move it
                    tmplInstructions.push(phIndex | 1610612736 /* Expression */);
                    phVisited.push(value);
                }
                else {
                    // It is a closing tag
                    tmplInstructions.push(-1073741824 /* CloseNode */);
                    if (tmplIndex > 0) {
                        openedTagCount--;
                        // If we have reached the closing tag for this template, exit the loop
                        if (openedTagCount === 0) {
                            break;
                        }
                    }
                }
                if (phIndex !== undefined && phIndex > maxIndex) {
                    maxIndex = phIndex;
                }
                if (templateRoots) {
                    var newTmplIndex = templateRoots.indexOf(value) + 1;
                    if (newTmplIndex !== 0 && newTmplIndex !== tmplIndex) {
                        partIndex = generateMappingInstructions(newTmplIndex, partIndex, translationParts, instructions, elements, expressions, templateRoots, lastChildIndex);
                    }
                }
            }
            else if (value) {
                // It's a non-empty string, create a text node
                tmplInstructions.push(536870912 /* Text */, value);
            }
        }
        // Add instructions to remove elements that are not used in the translation
        if (elements) {
            var tmplElements = elements[tmplIndex];
            if (tmplElements) {
                var phKeys = Object.keys(tmplElements);
                for (var i = 0; i < phKeys.length; i++) {
                    var ph = phKeys[i];
                    if (phVisited.indexOf(ph) === -1) {
                        var index = tmplElements[ph];
                        // Add an instruction to remove the element
                        tmplInstructions.push(index | -536870912 /* RemoveNode */);
                        if (index > maxIndex) {
                            maxIndex = index;
                        }
                    }
                }
            }
        }
        // Add instructions to remove expressions that are not used in the translation
        if (expressions) {
            var tmplExpressions = expressions[tmplIndex];
            if (tmplExpressions) {
                var phKeys = Object.keys(tmplExpressions);
                for (var i = 0; i < phKeys.length; i++) {
                    var ph = phKeys[i];
                    if (phVisited.indexOf(ph) === -1) {
                        var index = tmplExpressions[ph];
                        if (ngDevMode) {
                            assertLessThan(index.toString(2).length, 28, "Index " + index + " is too big and will overflow");
                        }
                        // Add an instruction to remove the expression
                        tmplInstructions.push(index | -536870912 /* RemoveNode */);
                        if (index > maxIndex) {
                            maxIndex = index;
                        }
                    }
                }
            }
        }
        if (tmplIndex === 0 && typeof lastChildIndex === 'number') {
            // The current parent is an ng-container and it has more children after the translation that we
            // need to append to keep the order of the DOM nodes correct
            for (var i = maxIndex + 1; i <= lastChildIndex; i++) {
                if (ngDevMode) {
                    assertLessThan(i.toString(2).length, 28, "Index " + i + " is too big and will overflow");
                }
                tmplInstructions.push(i | -1610612736 /* Any */);
            }
        }
        return partIndex;
    }
    function appendI18nNode(tNode, parentTNode, previousTNode) {
        if (ngDevMode) {
            ngDevMode.rendererMoveNode++;
        }
        var viewData = _getViewData();
        // On first pass, re-organize node tree to put this node in the correct position.
        var firstTemplatePass = viewData[TVIEW].firstTemplatePass;
        if (firstTemplatePass) {
            if (previousTNode === parentTNode && tNode !== parentTNode.child) {
                tNode.next = parentTNode.child;
                parentTNode.child = tNode;
            }
            else if (previousTNode !== parentTNode && tNode !== previousTNode.next) {
                tNode.next = previousTNode.next;
                previousTNode.next = tNode;
            }
            else {
                tNode.next = null;
            }
            if (parentTNode !== viewData[HOST_NODE]) {
                tNode.parent = parentTNode;
            }
        }
        appendChild(getNativeByTNode(tNode, viewData), tNode, viewData);
        var slotValue = viewData[tNode.index];
        if (tNode.type !== 0 /* Container */ && isLContainer(slotValue)) {
            // Nodes that inject ViewContainerRef also have a comment node that should be moved
            appendChild(slotValue[NATIVE], tNode, viewData);
        }
        return tNode;
    }
    function i18nAttribute(index, attrs) {
        // placeholder for i18nAttribute function
    }
    function i18nExp(expression) {
        // placeholder for i18nExp function
    }
    function i18nStart(index, message, subTemplateIndex) {
        if (subTemplateIndex === void 0) { subTemplateIndex = 0; }
        // placeholder for i18nExp function
    }
    function i18nEnd() {
        // placeholder for i18nEnd function
    }
    /**
     * Takes a list of instructions generated by `i18nMapping()` to transform the template accordingly.
     *
     * @param startIndex Index of the first element to translate (for instance the first child of the
     * element with the i18n attribute).
     * @param instructions The list of instructions to apply on the current view.
     */
    function i18nApply(startIndex, instructions) {
        var viewData = _getViewData();
        if (ngDevMode) {
            assertEqual(viewData[BINDING_INDEX], viewData[TVIEW].bindingStartIndex, 'i18nApply should be called before any binding');
        }
        if (!instructions) {
            return;
        }
        var renderer = getRenderer();
        var startTNode = getTNode(startIndex, viewData);
        var localParentTNode = startTNode.parent || viewData[HOST_NODE];
        var localPreviousTNode = localParentTNode;
        resetComponentState(); // We don't want to add to the tree with the wrong previous node
        for (var i = 0; i < instructions.length; i++) {
            var instruction = instructions[i];
            switch (instruction & -536870912 /* InstructionMask */) {
                case 1073741824 /* Element */:
                    var elementTNode = getTNode(instruction & 536870911 /* IndexMask */, viewData);
                    localPreviousTNode = appendI18nNode(elementTNode, localParentTNode, localPreviousTNode);
                    localParentTNode = elementTNode;
                    break;
                case 1610612736 /* Expression */:
                case -2147483648 /* TemplateRoot */:
                case -1610612736 /* Any */:
                    var nodeIndex = instruction & 536870911 /* IndexMask */;
                    localPreviousTNode =
                        appendI18nNode(getTNode(nodeIndex, viewData), localParentTNode, localPreviousTNode);
                    break;
                case 536870912 /* Text */:
                    if (ngDevMode) {
                        ngDevMode.rendererCreateTextNode++;
                    }
                    var value = instructions[++i];
                    var textRNode = createTextNode(value, renderer);
                    // If we were to only create a `RNode` then projections won't move the text.
                    // Create text node at the current end of viewData. Must subtract header offset because
                    // createNodeAtIndex takes a raw index (not adjusted by header offset).
                    adjustBlueprintForNewNode(viewData);
                    var textTNode = createNodeAtIndex(viewData.length - 1 - HEADER_OFFSET, 3 /* Element */, textRNode, null, null);
                    localPreviousTNode = appendI18nNode(textTNode, localParentTNode, localPreviousTNode);
                    resetComponentState();
                    break;
                case -1073741824 /* CloseNode */:
                    localPreviousTNode = localParentTNode;
                    localParentTNode = localParentTNode.parent || viewData[HOST_NODE];
                    break;
                case -536870912 /* RemoveNode */:
                    if (ngDevMode) {
                        ngDevMode.rendererRemoveNode++;
                    }
                    var removeIndex = instruction & 536870911 /* IndexMask */;
                    var removedElement = getNativeByIndex(removeIndex, viewData);
                    var removedTNode = getTNode(removeIndex, viewData);
                    removeChild(removedTNode, removedElement || null, viewData);
                    var slotValue = load(removeIndex);
                    if (isLContainer(slotValue)) {
                        var lContainer = slotValue;
                        if (removedTNode.type !== 0 /* Container */) {
                            removeChild(removedTNode, lContainer[NATIVE] || null, viewData);
                        }
                        removedTNode.detached = true;
                        lContainer[RENDER_PARENT] = null;
                    }
                    break;
            }
        }
    }
    /**
     * Takes a translation string and the initial list of expressions and returns a list of instructions
     * that will be used to translate an attribute.
     * Even indexes contain static strings, while odd indexes contain the index of the expression whose
     * value will be concatenated into the final translation.
     */
    function i18nExpMapping(translation, placeholders) {
        var staticText = translation.split(i18nTagRegex);
        // odd indexes are placeholders
        for (var i = 1; i < staticText.length; i += 2) {
            staticText[i] = placeholders[staticText[i]];
        }
        return staticText;
    }
    /**
     * Checks if the value of an expression has changed and replaces it by its value in a translation,
     * or returns NO_CHANGE.
     *
     * @param instructions A list of instructions that will be used to translate an attribute.
     * @param v0 value checked for change.
     *
     * @returns The concatenated string when any of the arguments changes, `NO_CHANGE` otherwise.
     */
    function i18nInterpolation1(instructions, v0) {
        var different = bindingUpdated(_getViewData()[BINDING_INDEX]++, v0);
        if (!different) {
            return NO_CHANGE;
        }
        var res = '';
        for (var i = 0; i < instructions.length; i++) {
            // Odd indexes are bindings
            if (i & 1) {
                res += stringify$1(v0);
            }
            else {
                res += instructions[i];
            }
        }
        return res;
    }
    /**
     * Checks if the values of up to 2 expressions have changed and replaces them by their values in a
     * translation, or returns NO_CHANGE.
     *
     * @param instructions A list of instructions that will be used to translate an attribute.
     * @param v0 value checked for change.
     * @param v1 value checked for change.
     *
     * @returns The concatenated string when any of the arguments changes, `NO_CHANGE` otherwise.
     */
    function i18nInterpolation2(instructions, v0, v1) {
        var viewData = _getViewData();
        var different = bindingUpdated2(viewData[BINDING_INDEX], v0, v1);
        viewData[BINDING_INDEX] += 2;
        if (!different) {
            return NO_CHANGE;
        }
        var res = '';
        for (var i = 0; i < instructions.length; i++) {
            // Odd indexes are bindings
            if (i & 1) {
                // Extract bits
                var idx = instructions[i];
                var b1 = idx & 1;
                // Get the value from the argument vx where x = idx
                var value = b1 ? v1 : v0;
                res += stringify$1(value);
            }
            else {
                res += instructions[i];
            }
        }
        return res;
    }
    /**
     * Checks if the values of up to 3 expressions have changed and replaces them by their values in a
     * translation, or returns NO_CHANGE.
     *
     * @param instructions A list of instructions that will be used to translate an attribute.
     * @param v0 value checked for change.
     * @param v1 value checked for change.
     * @param v2 value checked for change.
     *
     * @returns The concatenated string when any of the arguments changes, `NO_CHANGE` otherwise.
     */
    function i18nInterpolation3(instructions, v0, v1, v2) {
        var viewData = _getViewData();
        var different = bindingUpdated3(viewData[BINDING_INDEX], v0, v1, v2);
        viewData[BINDING_INDEX] += 3;
        if (!different) {
            return NO_CHANGE;
        }
        var res = '';
        for (var i = 0; i < instructions.length; i++) {
            // Odd indexes are bindings
            if (i & 1) {
                // Extract bits
                var idx = instructions[i];
                var b2 = idx & 2;
                var b1 = idx & 1;
                // Get the value from the argument vx where x = idx
                var value = b2 ? v2 : (b1 ? v1 : v0);
                res += stringify$1(value);
            }
            else {
                res += instructions[i];
            }
        }
        return res;
    }
    /**
     * Checks if the values of up to 4 expressions have changed and replaces them by their values in a
     * translation, or returns NO_CHANGE.
     *
     * @param instructions A list of instructions that will be used to translate an attribute.
     * @param v0 value checked for change.
     * @param v1 value checked for change.
     * @param v2 value checked for change.
     * @param v3 value checked for change.
     *
     * @returns The concatenated string when any of the arguments changes, `NO_CHANGE` otherwise.
     */
    function i18nInterpolation4(instructions, v0, v1, v2, v3) {
        var viewData = _getViewData();
        var different = bindingUpdated4(viewData[BINDING_INDEX], v0, v1, v2, v3);
        viewData[BINDING_INDEX] += 4;
        if (!different) {
            return NO_CHANGE;
        }
        var res = '';
        for (var i = 0; i < instructions.length; i++) {
            // Odd indexes are bindings
            if (i & 1) {
                // Extract bits
                var idx = instructions[i];
                var b2 = idx & 2;
                var b1 = idx & 1;
                // Get the value from the argument vx where x = idx
                var value = b2 ? (b1 ? v3 : v2) : (b1 ? v1 : v0);
                res += stringify$1(value);
            }
            else {
                res += instructions[i];
            }
        }
        return res;
    }
    /**
     * Checks if the values of up to 5 expressions have changed and replaces them by their values in a
     * translation, or returns NO_CHANGE.
     *
     * @param instructions A list of instructions that will be used to translate an attribute.
     * @param v0 value checked for change.
     * @param v1 value checked for change.
     * @param v2 value checked for change.
     * @param v3 value checked for change.
     * @param v4 value checked for change.
     *
     * @returns The concatenated string when any of the arguments changes, `NO_CHANGE` otherwise.
     */
    function i18nInterpolation5(instructions, v0, v1, v2, v3, v4) {
        var viewData = _getViewData();
        var different = bindingUpdated4(viewData[BINDING_INDEX], v0, v1, v2, v3);
        different = bindingUpdated(viewData[BINDING_INDEX] + 4, v4) || different;
        viewData[BINDING_INDEX] += 5;
        if (!different) {
            return NO_CHANGE;
        }
        var res = '';
        for (var i = 0; i < instructions.length; i++) {
            // Odd indexes are bindings
            if (i & 1) {
                // Extract bits
                var idx = instructions[i];
                var b4 = idx & 4;
                var b2 = idx & 2;
                var b1 = idx & 1;
                // Get the value from the argument vx where x = idx
                var value = b4 ? v4 : (b2 ? (b1 ? v3 : v2) : (b1 ? v1 : v0));
                res += stringify$1(value);
            }
            else {
                res += instructions[i];
            }
        }
        return res;
    }
    /**
     * Checks if the values of up to 6 expressions have changed and replaces them by their values in a
     * translation, or returns NO_CHANGE.
     *
     * @param instructions A list of instructions that will be used to translate an attribute.
     * @param v0 value checked for change.
     * @param v1 value checked for change.
     * @param v2 value checked for change.
     * @param v3 value checked for change.
     * @param v4 value checked for change.
     * @param v5 value checked for change.
     *
     * @returns The concatenated string when any of the arguments changes, `NO_CHANGE` otherwise.
     */ function i18nInterpolation6(instructions, v0, v1, v2, v3, v4, v5) {
        var viewData = _getViewData();
        var different = bindingUpdated4(viewData[BINDING_INDEX], v0, v1, v2, v3);
        different = bindingUpdated2(viewData[BINDING_INDEX] + 4, v4, v5) || different;
        viewData[BINDING_INDEX] += 6;
        if (!different) {
            return NO_CHANGE;
        }
        var res = '';
        for (var i = 0; i < instructions.length; i++) {
            // Odd indexes are bindings
            if (i & 1) {
                // Extract bits
                var idx = instructions[i];
                var b4 = idx & 4;
                var b2 = idx & 2;
                var b1 = idx & 1;
                // Get the value from the argument vx where x = idx
                var value = b4 ? (b1 ? v5 : v4) : (b2 ? (b1 ? v3 : v2) : (b1 ? v1 : v0));
                res += stringify$1(value);
            }
            else {
                res += instructions[i];
            }
        }
        return res;
    }
    /**
     * Checks if the values of up to 7 expressions have changed and replaces them by their values in a
     * translation, or returns NO_CHANGE.
     *
     * @param instructions A list of instructions that will be used to translate an attribute.
     * @param v0 value checked for change.
     * @param v1 value checked for change.
     * @param v2 value checked for change.
     * @param v3 value checked for change.
     * @param v4 value checked for change.
     * @param v5 value checked for change.
     * @param v6 value checked for change.
     *
     * @returns The concatenated string when any of the arguments changes, `NO_CHANGE` otherwise.
     */
    function i18nInterpolation7(instructions, v0, v1, v2, v3, v4, v5, v6) {
        var viewData = _getViewData();
        var different = bindingUpdated4(viewData[BINDING_INDEX], v0, v1, v2, v3);
        different = bindingUpdated3(viewData[BINDING_INDEX] + 4, v4, v5, v6) || different;
        viewData[BINDING_INDEX] += 7;
        if (!different) {
            return NO_CHANGE;
        }
        var res = '';
        for (var i = 0; i < instructions.length; i++) {
            // Odd indexes are bindings
            if (i & 1) {
                // Extract bits
                var idx = instructions[i];
                var b4 = idx & 4;
                var b2 = idx & 2;
                var b1 = idx & 1;
                // Get the value from the argument vx where x = idx
                var value = b4 ? (b2 ? v6 : (b1 ? v5 : v4)) : (b2 ? (b1 ? v3 : v2) : (b1 ? v1 : v0));
                res += stringify$1(value);
            }
            else {
                res += instructions[i];
            }
        }
        return res;
    }
    /**
     * Checks if the values of up to 8 expressions have changed and replaces them by their values in a
     * translation, or returns NO_CHANGE.
     *
     * @param instructions A list of instructions that will be used to translate an attribute.
     * @param v0 value checked for change.
     * @param v1 value checked for change.
     * @param v2 value checked for change.
     * @param v3 value checked for change.
     * @param v4 value checked for change.
     * @param v5 value checked for change.
     * @param v6 value checked for change.
     * @param v7 value checked for change.
     *
     * @returns The concatenated string when any of the arguments changes, `NO_CHANGE` otherwise.
     */
    function i18nInterpolation8(instructions, v0, v1, v2, v3, v4, v5, v6, v7) {
        var viewData = _getViewData();
        var different = bindingUpdated4(viewData[BINDING_INDEX], v0, v1, v2, v3);
        different = bindingUpdated4(viewData[BINDING_INDEX] + 4, v4, v5, v6, v7) || different;
        viewData[BINDING_INDEX] += 8;
        if (!different) {
            return NO_CHANGE;
        }
        var res = '';
        for (var i = 0; i < instructions.length; i++) {
            // Odd indexes are bindings
            if (i & 1) {
                // Extract bits
                var idx = instructions[i];
                var b4 = idx & 4;
                var b2 = idx & 2;
                var b1 = idx & 1;
                // Get the value from the argument vx where x = idx
                var value = b4 ? (b2 ? (b1 ? v7 : v6) : (b1 ? v5 : v4)) : (b2 ? (b1 ? v3 : v2) : (b1 ? v1 : v0));
                res += stringify$1(value);
            }
            else {
                res += instructions[i];
            }
        }
        return res;
    }
    /**
     * Create a translated interpolation binding with a variable number of expressions.
     *
     * If there are 1 to 8 expressions then `i18nInterpolation()` should be used instead. It is faster
     * because there is no need to create an array of expressions and iterate over it.
     *
     * @returns The concatenated string when any of the arguments changes, `NO_CHANGE` otherwise.
     */
    function i18nInterpolationV(instructions, values) {
        var viewData = _getViewData();
        var different = false;
        for (var i = 0; i < values.length; i++) {
            // Check if bindings have changed
            bindingUpdated(viewData[BINDING_INDEX]++, values[i]) && (different = true);
        }
        if (!different) {
            return NO_CHANGE;
        }
        var res = '';
        for (var i = 0; i < instructions.length; i++) {
            // Odd indexes are placeholders
            if (i & 1) {
                res += stringify$1(values[instructions[i]]);
            }
            else {
                res += instructions[i];
            }
        }
        return res;
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * An internal token whose presence in an injector indicates that the injector should treat itself
     * as a root scoped injector when processing requests for unknown tokens which may indicate
     * they are provided in the root scope.
     */
    var APP_ROOT = new InjectionToken('The presence of this token marks an injector as being the root injector.');

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Marker which indicates that a value has not yet been created from the factory function.
     */
    var NOT_YET = {};
    /**
     * Marker which indicates that the factory function for a token is in the process of being called.
     *
     * If the injector is asked to inject a token with its value set to CIRCULAR, that indicates
     * injection of a dependency has recursively attempted to inject the original token, and there is
     * a circular dependency among the providers.
     */
    var CIRCULAR$2 = {};
    var EMPTY_ARRAY$1 = [];
    /**
     * A lazily initialized NullInjector.
     */
    var NULL_INJECTOR$2 = undefined;
    function getNullInjector() {
        if (NULL_INJECTOR$2 === undefined) {
            NULL_INJECTOR$2 = new NullInjector();
        }
        return NULL_INJECTOR$2;
    }
    /**
     * Create a new `Injector` which is configured using a `defType` of `InjectorType<any>`s.
     *
     * @publicApi
     */
    function createInjector(defType, parent, additionalProviders) {
        if (parent === void 0) { parent = null; }
        if (additionalProviders === void 0) { additionalProviders = null; }
        parent = parent || getNullInjector();
        return new R3Injector(defType, additionalProviders, parent);
    }
    var R3Injector = /** @class */ (function () {
        function R3Injector(def, additionalProviders, parent) {
            var _this = this;
            this.parent = parent;
            /**
             * Map of tokens to records which contain the instances of those tokens.
             */
            this.records = new Map();
            /**
             * The transitive set of `InjectorType`s which define this injector.
             */
            this.injectorDefTypes = new Set();
            /**
             * Set of values instantiated by this injector which contain `ngOnDestroy` lifecycle hooks.
             */
            this.onDestroy = new Set();
            /**
             * Flag indicating that this injector was previously destroyed.
             */
            this.destroyed = false;
            // Start off by creating Records for every provider declared in every InjectorType
            // included transitively in `def`.
            deepForEach([def], function (injectorDef) { return _this.processInjectorType(injectorDef, new Set()); });
            additionalProviders &&
                deepForEach(additionalProviders, function (provider) { return _this.processProvider(provider); });
            // Make sure the INJECTOR token provides this injector.
            this.records.set(INJECTOR, makeRecord(undefined, this));
            // Detect whether this injector has the APP_ROOT_SCOPE token and thus should provide
            // any injectable scoped to APP_ROOT_SCOPE.
            this.isRootInjector = this.records.has(APP_ROOT);
            // Eagerly instantiate the InjectorType classes themselves.
            this.injectorDefTypes.forEach(function (defType) { return _this.get(defType); });
        }
        /**
         * Destroy the injector and release references to every instance or provider associated with it.
         *
         * Also calls the `OnDestroy` lifecycle hooks of every instance that was created for which a
         * hook was found.
         */
        R3Injector.prototype.destroy = function () {
            this.assertNotDestroyed();
            // Set destroyed = true first, in case lifecycle hooks re-enter destroy().
            this.destroyed = true;
            try {
                // Call all the lifecycle hooks.
                this.onDestroy.forEach(function (service) { return service.ngOnDestroy(); });
            }
            finally {
                // Release all references.
                this.records.clear();
                this.onDestroy.clear();
                this.injectorDefTypes.clear();
            }
        };
        R3Injector.prototype.get = function (token, notFoundValue, flags) {
            if (notFoundValue === void 0) { notFoundValue = THROW_IF_NOT_FOUND; }
            if (flags === void 0) { flags = 0 /* Default */; }
            this.assertNotDestroyed();
            // Set the injection context.
            var previousInjector = setCurrentInjector(this);
            try {
                // Check for the SkipSelf flag.
                if (!(flags & 4 /* SkipSelf */)) {
                    // SkipSelf isn't set, check if the record belongs to this injector.
                    var record = this.records.get(token);
                    if (record === undefined) {
                        // No record, but maybe the token is scoped to this injector. Look for an ngInjectableDef
                        // with a scope matching this injector.
                        var def = couldBeInjectableType(token) && getInjectableDef(token);
                        if (def && this.injectableDefInScope(def)) {
                            // Found an ngInjectableDef and it's scoped to this injector. Pretend as if it was here
                            // all along.
                            record = injectableDefRecord(token);
                            this.records.set(token, record);
                        }
                    }
                    // If a record was found, get the instance for it and return it.
                    if (record !== undefined) {
                        return this.hydrate(token, record);
                    }
                }
                // Select the next injector based on the Self flag - if self is set, the next injector is
                // the NullInjector, otherwise it's the parent.
                var next = !(flags & 2 /* Self */) ? this.parent : getNullInjector();
                return this.parent.get(token, notFoundValue);
            }
            finally {
                // Lastly, clean up the state by restoring the previous injector.
                setCurrentInjector(previousInjector);
            }
        };
        R3Injector.prototype.assertNotDestroyed = function () {
            if (this.destroyed) {
                throw new Error('Injector has already been destroyed.');
            }
        };
        /**
         * Add an `InjectorType` or `InjectorDefTypeWithProviders` and all of its transitive providers
         * to this injector.
         */
        R3Injector.prototype.processInjectorType = function (defOrWrappedDef, parents) {
            var _this = this;
            defOrWrappedDef = resolveForwardRef(defOrWrappedDef);
            // Either the defOrWrappedDef is an InjectorType (with ngInjectorDef) or an
            // InjectorDefTypeWithProviders (aka ModuleWithProviders). Detecting either is a megamorphic
            // read, so care is taken to only do the read once.
            // First attempt to read the ngInjectorDef.
            var def = getInjectorDef(defOrWrappedDef);
            // If that's not present, then attempt to read ngModule from the InjectorDefTypeWithProviders.
            var ngModule = (def == null) && defOrWrappedDef.ngModule || undefined;
            // Determine the InjectorType. In the case where `defOrWrappedDef` is an `InjectorType`,
            // then this is easy. In the case of an InjectorDefTypeWithProviders, then the definition type
            // is the `ngModule`.
            var defType = (ngModule === undefined) ? defOrWrappedDef : ngModule;
            // If defOrWrappedType was an InjectorDefTypeWithProviders, then .providers may hold some
            // extra providers.
            var providers = (ngModule !== undefined) && defOrWrappedDef.providers ||
                EMPTY_ARRAY$1;
            // Finally, if defOrWrappedType was an `InjectorDefTypeWithProviders`, then the actual
            // `InjectorDef` is on its `ngModule`.
            if (ngModule !== undefined) {
                def = getInjectorDef(ngModule);
            }
            // If no definition was found, it might be from exports. Remove it.
            if (def == null) {
                return;
            }
            // Check for circular dependencies.
            if (parents.has(defType)) {
                throw new Error("Circular dependency: type " + stringify(defType) + " ends up importing itself.");
            }
            // Track the InjectorType and add a provider for it.
            this.injectorDefTypes.add(defType);
            this.records.set(defType, makeRecord(def.factory));
            // Add providers in the same way that @NgModule resolution did:
            // First, include providers from any imports.
            if (def.imports != null) {
                // Before processing defType's imports, add it to the set of parents. This way, if it ends
                // up deeply importing itself, this can be detected.
                parents.add(defType);
                try {
                    deepForEach(def.imports, function (imported) { return _this.processInjectorType(imported, parents); });
                }
                finally {
                    // Remove it from the parents set when finished.
                    parents.delete(defType);
                }
            }
            // Next, include providers listed on the definition itself.
            if (def.providers != null) {
                deepForEach(def.providers, function (provider) { return _this.processProvider(provider); });
            }
            // Finally, include providers from an InjectorDefTypeWithProviders if there was one.
            deepForEach(providers, function (provider) { return _this.processProvider(provider); });
        };
        /**
         * Process a `SingleProvider` and add it.
         */
        R3Injector.prototype.processProvider = function (provider) {
            // Determine the token from the provider. Either it's its own token, or has a {provide: ...}
            // property.
            provider = resolveForwardRef(provider);
            var token = isTypeProvider(provider) ? provider : resolveForwardRef(provider.provide);
            // Construct a `Record` for the provider.
            var record = providerToRecord(provider);
            if (!isTypeProvider(provider) && provider.multi === true) {
                // If the provider indicates that it's a multi-provider, process it specially.
                // First check whether it's been defined already.
                var multiRecord_1 = this.records.get(token);
                if (multiRecord_1) {
                    // It has. Throw a nice error if
                    if (multiRecord_1.multi === undefined) {
                        throw new Error("Mixed multi-provider for " + token + ".");
                    }
                }
                else {
                    multiRecord_1 = makeRecord(undefined, NOT_YET, true);
                    multiRecord_1.factory = function () { return injectArgs(multiRecord_1.multi); };
                    this.records.set(token, multiRecord_1);
                }
                token = provider;
                multiRecord_1.multi.push(provider);
            }
            else {
                var existing = this.records.get(token);
                if (existing && existing.multi !== undefined) {
                    throw new Error("Mixed multi-provider for " + stringify(token));
                }
            }
            this.records.set(token, record);
        };
        R3Injector.prototype.hydrate = function (token, record) {
            if (record.value === CIRCULAR$2) {
                throw new Error("Circular dep for " + stringify(token));
            }
            else if (record.value === NOT_YET) {
                record.value = CIRCULAR$2;
                record.value = record.factory();
            }
            if (typeof record.value === 'object' && record.value && hasOnDestroy(record.value)) {
                this.onDestroy.add(record.value);
            }
            return record.value;
        };
        R3Injector.prototype.injectableDefInScope = function (def) {
            if (!def.providedIn) {
                return false;
            }
            else if (typeof def.providedIn === 'string') {
                return def.providedIn === 'any' || (def.providedIn === 'root' && this.isRootInjector);
            }
            else {
                return this.injectorDefTypes.has(def.providedIn);
            }
        };
        return R3Injector;
    }());
    function injectableDefRecord(token) {
        var injectableDef = getInjectableDef(token);
        if (injectableDef === null) {
            if (token instanceof InjectionToken) {
                throw new Error("Token " + stringify(token) + " is missing an ngInjectableDef definition.");
            }
            // TODO(alxhub): there should probably be a strict mode which throws here instead of assuming a
            // no-args constructor.
            return makeRecord(function () { return new token(); });
        }
        return makeRecord(injectableDef.factory);
    }
    function providerToRecord(provider) {
        var token = resolveForwardRef(provider);
        var value = NOT_YET;
        var factory = undefined;
        if (isTypeProvider(provider)) {
            return injectableDefRecord(provider);
        }
        else {
            token = resolveForwardRef(provider.provide);
            if (isValueProvider(provider)) {
                value = provider.useValue;
            }
            else if (isExistingProvider(provider)) {
                factory = function () { return inject(provider.useExisting); };
            }
            else if (isFactoryProvider(provider)) {
                factory = function () { return provider.useFactory.apply(provider, __spread(injectArgs(provider.deps || []))); };
            }
            else {
                var classRef_1 = provider.useClass || token;
                if (hasDeps(provider)) {
                    factory = function () { return new ((classRef_1).bind.apply((classRef_1), __spread([void 0], injectArgs(provider.deps))))(); };
                }
                else {
                    return injectableDefRecord(classRef_1);
                }
            }
        }
        return makeRecord(factory, value);
    }
    function makeRecord(factory, value, multi) {
        if (value === void 0) { value = NOT_YET; }
        if (multi === void 0) { multi = false; }
        return {
            factory: factory,
            value: value,
            multi: multi ? [] : undefined,
        };
    }
    function deepForEach(input, fn) {
        input.forEach(function (value) { return Array.isArray(value) ? deepForEach(value, fn) : fn(value); });
    }
    function isValueProvider(value) {
        return USE_VALUE in value;
    }
    function isExistingProvider(value) {
        return !!value.useExisting;
    }
    function isFactoryProvider(value) {
        return !!value.useFactory;
    }
    function isTypeProvider(value) {
        return typeof value === 'function';
    }
    function hasDeps(value) {
        return !!value.deps;
    }
    function hasOnDestroy(value) {
        return typeof value === 'object' && value != null && value.ngOnDestroy &&
            typeof value.ngOnDestroy === 'function';
    }
    function couldBeInjectableType(value) {
        return (typeof value === 'function') ||
            (typeof value === 'object' && value instanceof InjectionToken);
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var COMPONENT_FACTORY_RESOLVER = {
        provide: ComponentFactoryResolver,
        useFactory: function () { return new ComponentFactoryResolver$1(); },
        deps: [],
    };
    var NgModuleRef$1 = /** @class */ (function (_super) {
        __extends(NgModuleRef$$1, _super);
        function NgModuleRef$$1(ngModuleType, parentInjector) {
            var _this = _super.call(this) || this;
            // tslint:disable-next-line:require-internal-with-underscore
            _this._bootstrapComponents = [];
            _this.destroyCbs = [];
            var ngModuleDef = getNgModuleDef(ngModuleType);
            ngDevMode && assertDefined(ngModuleDef, "NgModule '" + stringify(ngModuleType) + "' is not a subtype of 'NgModuleType'.");
            _this._bootstrapComponents = ngModuleDef.bootstrap;
            var additionalProviders = [
                COMPONENT_FACTORY_RESOLVER, {
                    provide: NgModuleRef,
                    useValue: _this,
                }
            ];
            _this.injector = createInjector(ngModuleType, parentInjector, additionalProviders);
            _this.instance = _this.injector.get(ngModuleType);
            _this.componentFactoryResolver = new ComponentFactoryResolver$1();
            return _this;
        }
        NgModuleRef$$1.prototype.destroy = function () {
            ngDevMode && assertDefined(this.destroyCbs, 'NgModule already destroyed');
            this.destroyCbs.forEach(function (fn) { return fn(); });
            this.destroyCbs = null;
        };
        NgModuleRef$$1.prototype.onDestroy = function (callback) {
            ngDevMode && assertDefined(this.destroyCbs, 'NgModule already destroyed');
            this.destroyCbs.push(callback);
        };
        return NgModuleRef$$1;
    }(NgModuleRef));
    var NgModuleFactory$1 = /** @class */ (function (_super) {
        __extends(NgModuleFactory$$1, _super);
        function NgModuleFactory$$1(moduleType) {
            var _this = _super.call(this) || this;
            _this.moduleType = moduleType;
            return _this;
        }
        NgModuleFactory$$1.prototype.create = function (parentInjector) {
            return new NgModuleRef$1(this.moduleType, parentInjector);
        };
        return NgModuleFactory$$1;
    }(NgModuleFactory));

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Bindings for pure functions are stored after regular bindings.
     *
     * |------consts------|---------vars---------|                 |----- hostVars (dir1) ------|
     * ------------------------------------------------------------------------------------------
     * | nodes/refs/pipes | bindings | fn slots  | injector | dir1 | host bindings | host slots |
     * ------------------------------------------------------------------------------------------
     *                    ^                      ^
     *      TView.bindingStartIndex      TView.expandoStartIndex
     *
     * Pure function instructions are given an offset from the binding root. Adding the offset to the
     * binding root gives the first index where the bindings are stored. In component views, the binding
     * root is the bindingStartIndex. In host bindings, the binding root is the expandoStartIndex +
     * any directive instances + any hostVars in directives evaluated before it.
     *
     * See VIEW_DATA.md for more information about host binding resolution.
     */
    /**
     * If the value hasn't been saved, calls the pure function to store and return the
     * value. If it has been saved, returns the saved value.
     *
     * @param slotOffset the offset from binding root to the reserved slot
     * @param pureFn Function that returns a value
     * @param thisArg Optional calling context of pureFn
     * @returns value
     */
    function pureFunction0(slotOffset, pureFn, thisArg) {
        // TODO(kara): use bindingRoot instead of bindingStartIndex when implementing host bindings
        var bindingIndex = getBindingRoot() + slotOffset;
        return getCreationMode() ?
            updateBinding(bindingIndex, thisArg ? pureFn.call(thisArg) : pureFn()) :
            getBinding(bindingIndex);
    }
    /**
     * If the value of the provided exp has changed, calls the pure function to return
     * an updated value. Or if the value has not changed, returns cached value.
     *
     * @param slotOffset the offset from binding root to the reserved slot
     * @param pureFn Function that returns an updated value
     * @param exp Updated expression value
     * @param thisArg Optional calling context of pureFn
     * @returns Updated or cached value
     */
    function pureFunction1(slotOffset, pureFn, exp, thisArg) {
        // TODO(kara): use bindingRoot instead of bindingStartIndex when implementing host bindings
        var bindingIndex = getBindingRoot() + slotOffset;
        return bindingUpdated(bindingIndex, exp) ?
            updateBinding(bindingIndex + 1, thisArg ? pureFn.call(thisArg, exp) : pureFn(exp)) :
            getBinding(bindingIndex + 1);
    }
    /**
     * If the value of any provided exp has changed, calls the pure function to return
     * an updated value. Or if no values have changed, returns cached value.
     *
     * @param slotOffset the offset from binding root to the reserved slot
     * @param pureFn
     * @param exp1
     * @param exp2
     * @param thisArg Optional calling context of pureFn
     * @returns Updated or cached value
     */
    function pureFunction2(slotOffset, pureFn, exp1, exp2, thisArg) {
        // TODO(kara): use bindingRoot instead of bindingStartIndex when implementing host bindings
        var bindingIndex = getBindingRoot() + slotOffset;
        return bindingUpdated2(bindingIndex, exp1, exp2) ?
            updateBinding(bindingIndex + 2, thisArg ? pureFn.call(thisArg, exp1, exp2) : pureFn(exp1, exp2)) :
            getBinding(bindingIndex + 2);
    }
    /**
     * If the value of any provided exp has changed, calls the pure function to return
     * an updated value. Or if no values have changed, returns cached value.
     *
     * @param slotOffset the offset from binding root to the reserved slot
     * @param pureFn
     * @param exp1
     * @param exp2
     * @param exp3
     * @param thisArg Optional calling context of pureFn
     * @returns Updated or cached value
     */
    function pureFunction3(slotOffset, pureFn, exp1, exp2, exp3, thisArg) {
        // TODO(kara): use bindingRoot instead of bindingStartIndex when implementing host bindings
        var bindingIndex = getBindingRoot() + slotOffset;
        return bindingUpdated3(bindingIndex, exp1, exp2, exp3) ?
            updateBinding(bindingIndex + 3, thisArg ? pureFn.call(thisArg, exp1, exp2, exp3) : pureFn(exp1, exp2, exp3)) :
            getBinding(bindingIndex + 3);
    }
    /**
     * If the value of any provided exp has changed, calls the pure function to return
     * an updated value. Or if no values have changed, returns cached value.
     *
     * @param slotOffset the offset from binding root to the reserved slot
     * @param pureFn
     * @param exp1
     * @param exp2
     * @param exp3
     * @param exp4
     * @param thisArg Optional calling context of pureFn
     * @returns Updated or cached value
     */
    function pureFunction4(slotOffset, pureFn, exp1, exp2, exp3, exp4, thisArg) {
        // TODO(kara): use bindingRoot instead of bindingStartIndex when implementing host bindings
        var bindingIndex = getBindingRoot() + slotOffset;
        return bindingUpdated4(bindingIndex, exp1, exp2, exp3, exp4) ?
            updateBinding(bindingIndex + 4, thisArg ? pureFn.call(thisArg, exp1, exp2, exp3, exp4) : pureFn(exp1, exp2, exp3, exp4)) :
            getBinding(bindingIndex + 4);
    }
    /**
     * If the value of any provided exp has changed, calls the pure function to return
     * an updated value. Or if no values have changed, returns cached value.
     *
     * @param slotOffset the offset from binding root to the reserved slot
     * @param pureFn
     * @param exp1
     * @param exp2
     * @param exp3
     * @param exp4
     * @param exp5
     * @param thisArg Optional calling context of pureFn
     * @returns Updated or cached value
     */
    function pureFunction5(slotOffset, pureFn, exp1, exp2, exp3, exp4, exp5, thisArg) {
        // TODO(kara): use bindingRoot instead of bindingStartIndex when implementing host bindings
        var bindingIndex = getBindingRoot() + slotOffset;
        var different = bindingUpdated4(bindingIndex, exp1, exp2, exp3, exp4);
        return bindingUpdated(bindingIndex + 4, exp5) || different ?
            updateBinding(bindingIndex + 5, thisArg ? pureFn.call(thisArg, exp1, exp2, exp3, exp4, exp5) :
                pureFn(exp1, exp2, exp3, exp4, exp5)) :
            getBinding(bindingIndex + 5);
    }
    /**
     * If the value of any provided exp has changed, calls the pure function to return
     * an updated value. Or if no values have changed, returns cached value.
     *
     * @param slotOffset the offset from binding root to the reserved slot
     * @param pureFn
     * @param exp1
     * @param exp2
     * @param exp3
     * @param exp4
     * @param exp5
     * @param exp6
     * @param thisArg Optional calling context of pureFn
     * @returns Updated or cached value
     */
    function pureFunction6(slotOffset, pureFn, exp1, exp2, exp3, exp4, exp5, exp6, thisArg) {
        // TODO(kara): use bindingRoot instead of bindingStartIndex when implementing host bindings
        var bindingIndex = getBindingRoot() + slotOffset;
        var different = bindingUpdated4(bindingIndex, exp1, exp2, exp3, exp4);
        return bindingUpdated2(bindingIndex + 4, exp5, exp6) || different ?
            updateBinding(bindingIndex + 6, thisArg ? pureFn.call(thisArg, exp1, exp2, exp3, exp4, exp5, exp6) :
                pureFn(exp1, exp2, exp3, exp4, exp5, exp6)) :
            getBinding(bindingIndex + 6);
    }
    /**
     * If the value of any provided exp has changed, calls the pure function to return
     * an updated value. Or if no values have changed, returns cached value.
     *
     * @param slotOffset the offset from binding root to the reserved slot
     * @param pureFn
     * @param exp1
     * @param exp2
     * @param exp3
     * @param exp4
     * @param exp5
     * @param exp6
     * @param exp7
     * @param thisArg Optional calling context of pureFn
     * @returns Updated or cached value
     */
    function pureFunction7(slotOffset, pureFn, exp1, exp2, exp3, exp4, exp5, exp6, exp7, thisArg) {
        // TODO(kara): use bindingRoot instead of bindingStartIndex when implementing host bindings
        var bindingIndex = getBindingRoot() + slotOffset;
        var different = bindingUpdated4(bindingIndex, exp1, exp2, exp3, exp4);
        return bindingUpdated3(bindingIndex + 4, exp5, exp6, exp7) || different ?
            updateBinding(bindingIndex + 7, thisArg ?
                pureFn.call(thisArg, exp1, exp2, exp3, exp4, exp5, exp6, exp7) :
                pureFn(exp1, exp2, exp3, exp4, exp5, exp6, exp7)) :
            getBinding(bindingIndex + 7);
    }
    /**
     * If the value of any provided exp has changed, calls the pure function to return
     * an updated value. Or if no values have changed, returns cached value.
     *
     * @param slotOffset the offset from binding root to the reserved slot
     * @param pureFn
     * @param exp1
     * @param exp2
     * @param exp3
     * @param exp4
     * @param exp5
     * @param exp6
     * @param exp7
     * @param exp8
     * @param thisArg Optional calling context of pureFn
     * @returns Updated or cached value
     */
    function pureFunction8(slotOffset, pureFn, exp1, exp2, exp3, exp4, exp5, exp6, exp7, exp8, thisArg) {
        // TODO(kara): use bindingRoot instead of bindingStartIndex when implementing host bindings
        var bindingIndex = getBindingRoot() + slotOffset;
        var different = bindingUpdated4(bindingIndex, exp1, exp2, exp3, exp4);
        return bindingUpdated4(bindingIndex + 4, exp5, exp6, exp7, exp8) || different ?
            updateBinding(bindingIndex + 8, thisArg ?
                pureFn.call(thisArg, exp1, exp2, exp3, exp4, exp5, exp6, exp7, exp8) :
                pureFn(exp1, exp2, exp3, exp4, exp5, exp6, exp7, exp8)) :
            getBinding(bindingIndex + 8);
    }
    /**
     * pureFunction instruction that can support any number of bindings.
     *
     * If the value of any provided exp has changed, calls the pure function to return
     * an updated value. Or if no values have changed, returns cached value.
     *
     * @param slotOffset the offset from binding root to the reserved slot
     * @param pureFn A pure function that takes binding values and builds an object or array
     * containing those values.
     * @param exps An array of binding values
     * @param thisArg Optional calling context of pureFn
     * @returns Updated or cached value
     */
    function pureFunctionV(slotOffset, pureFn, exps, thisArg) {
        // TODO(kara): use bindingRoot instead of bindingStartIndex when implementing host bindings
        var bindingIndex = getBindingRoot() + slotOffset;
        var different = false;
        for (var i = 0; i < exps.length; i++) {
            bindingUpdated(bindingIndex++, exps[i]) && (different = true);
        }
        return different ? updateBinding(bindingIndex, pureFn.apply(thisArg, exps)) :
            getBinding(bindingIndex);
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Create a pipe.
     *
     * @param index Pipe index where the pipe will be stored.
     * @param pipeName The name of the pipe
     * @returns T the instance of the pipe.
     */
    function pipe(index, pipeName) {
        var tView = getTView();
        var pipeDef;
        var adjustedIndex = index + HEADER_OFFSET;
        if (tView.firstTemplatePass) {
            pipeDef = getPipeDef$1(pipeName, tView.pipeRegistry);
            tView.data[adjustedIndex] = pipeDef;
            if (pipeDef.onDestroy) {
                (tView.pipeDestroyHooks || (tView.pipeDestroyHooks = [])).push(adjustedIndex, pipeDef.onDestroy);
            }
        }
        else {
            pipeDef = tView.data[adjustedIndex];
        }
        var pipeInstance = pipeDef.factory();
        store(index, pipeInstance);
        return pipeInstance;
    }
    /**
     * Searches the pipe registry for a pipe with the given name. If one is found,
     * returns the pipe. Otherwise, an error is thrown because the pipe cannot be resolved.
     *
     * @param name Name of pipe to resolve
     * @param registry Full list of available pipes
     * @returns Matching PipeDef
     */
    function getPipeDef$1(name, registry) {
        if (registry) {
            for (var i = 0; i < registry.length; i++) {
                var pipeDef = registry[i];
                if (name === pipeDef.name) {
                    return pipeDef;
                }
            }
        }
        throw new Error("Pipe with name '" + name + "' not found!");
    }
    /**
     * Invokes a pipe with 1 arguments.
     *
     * This instruction acts as a guard to {@link PipeTransform#transform} invoking
     * the pipe only when an input to the pipe changes.
     *
     * @param index Pipe index where the pipe was stored on creation.
     * @param slotOffset the offset in the reserved slot space
     * @param v1 1st argument to {@link PipeTransform#transform}.
     */
    function pipeBind1(index, slotOffset, v1) {
        var pipeInstance = load(index);
        return isPure(index) ? pureFunction1(slotOffset, pipeInstance.transform, v1, pipeInstance) :
            pipeInstance.transform(v1);
    }
    /**
     * Invokes a pipe with 2 arguments.
     *
     * This instruction acts as a guard to {@link PipeTransform#transform} invoking
     * the pipe only when an input to the pipe changes.
     *
     * @param index Pipe index where the pipe was stored on creation.
     * @param slotOffset the offset in the reserved slot space
     * @param v1 1st argument to {@link PipeTransform#transform}.
     * @param v2 2nd argument to {@link PipeTransform#transform}.
     */
    function pipeBind2(index, slotOffset, v1, v2) {
        var pipeInstance = load(index);
        return isPure(index) ? pureFunction2(slotOffset, pipeInstance.transform, v1, v2, pipeInstance) :
            pipeInstance.transform(v1, v2);
    }
    /**
     * Invokes a pipe with 3 arguments.
     *
     * This instruction acts as a guard to {@link PipeTransform#transform} invoking
     * the pipe only when an input to the pipe changes.
     *
     * @param index Pipe index where the pipe was stored on creation.
     * @param slotOffset the offset in the reserved slot space
     * @param v1 1st argument to {@link PipeTransform#transform}.
     * @param v2 2nd argument to {@link PipeTransform#transform}.
     * @param v3 4rd argument to {@link PipeTransform#transform}.
     */
    function pipeBind3(index, slotOffset, v1, v2, v3) {
        var pipeInstance = load(index);
        return isPure(index) ?
            pureFunction3(slotOffset, pipeInstance.transform, v1, v2, v3, pipeInstance) :
            pipeInstance.transform(v1, v2, v3);
    }
    /**
     * Invokes a pipe with 4 arguments.
     *
     * This instruction acts as a guard to {@link PipeTransform#transform} invoking
     * the pipe only when an input to the pipe changes.
     *
     * @param index Pipe index where the pipe was stored on creation.
     * @param slotOffset the offset in the reserved slot space
     * @param v1 1st argument to {@link PipeTransform#transform}.
     * @param v2 2nd argument to {@link PipeTransform#transform}.
     * @param v3 3rd argument to {@link PipeTransform#transform}.
     * @param v4 4th argument to {@link PipeTransform#transform}.
     */
    function pipeBind4(index, slotOffset, v1, v2, v3, v4) {
        var pipeInstance = load(index);
        return isPure(index) ?
            pureFunction4(slotOffset, pipeInstance.transform, v1, v2, v3, v4, pipeInstance) :
            pipeInstance.transform(v1, v2, v3, v4);
    }
    /**
     * Invokes a pipe with variable number of arguments.
     *
     * This instruction acts as a guard to {@link PipeTransform#transform} invoking
     * the pipe only when an input to the pipe changes.
     *
     * @param index Pipe index where the pipe was stored on creation.
     * @param slotOffset the offset in the reserved slot space
     * @param values Array of arguments to pass to {@link PipeTransform#transform} method.
     */
    function pipeBindV(index, slotOffset, values) {
        var pipeInstance = load(index);
        return isPure(index) ? pureFunctionV(slotOffset, pipeInstance.transform, values, pipeInstance) :
            pipeInstance.transform.apply(pipeInstance, values);
    }
    function isPure(index) {
        return getTView().data[index + HEADER_OFFSET].pure;
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Use in directives and components to emit custom events synchronously
     * or asynchronously, and register handlers for those events by subscribing
     * to an instance.
     *
     * @usageNotes
     *
     * In the following example, a component defines two output properties
     * that create event emitters. When the title is clicked, the emitter
     * emits an open or close event to toggle the current visibility state.
     *
     * ```
     * @Component({
     *   selector: 'zippy',
     *   template: `
     *   <div class="zippy">
     *     <div (click)="toggle()">Toggle</div>
     *     <div [hidden]="!visible">
     *       <ng-content></ng-content>
     *     </div>
     *  </div>`})
     * export class Zippy {
     *   visible: boolean = true;
     *   @Output() open: EventEmitter<any> = new EventEmitter();
     *   @Output() close: EventEmitter<any> = new EventEmitter();
     *
     *   toggle() {
     *     this.visible = !this.visible;
     *     if (this.visible) {
     *       this.open.emit(null);
     *     } else {
     *       this.close.emit(null);
     *     }
     *   }
     * }
     * ```
     *
     * Access the event object with the `$event` argument passed to the output event
     * handler:
     *
     * ```
     * <zippy (open)="onOpen($event)" (close)="onClose($event)"></zippy>
     * ```
     *
     * ### Notes
     *
     * Uses Rx.Observable but provides an adapter to make it work as specified here:
     * https://github.com/jhusain/observable-spec
     *
     * Once a reference implementation of the spec is available, switch to it.
     *
     * @publicApi
     */
    var EventEmitter = /** @class */ (function (_super) {
        __extends(EventEmitter, _super);
        /**
         * Creates an instance of this class that can
         * deliver events synchronously or asynchronously.
         *
         * @param isAsync When true, deliver events asynchronously.
         *
         */
        function EventEmitter(isAsync) {
            if (isAsync === void 0) { isAsync = false; }
            var _this = _super.call(this) || this;
            _this.__isAsync = isAsync;
            return _this;
        }
        /**
         * Emits an event containing a given value.
         * @param value The value to emit.
         */
        EventEmitter.prototype.emit = function (value) { _super.prototype.next.call(this, value); };
        /**
         * Registers handlers for events emitted by this instance.
         * @param generatorOrNext When supplied, a custom handler for emitted events.
         * @param error When supplied, a custom handler for an error notification
         * from this emitter.
         * @param complete When supplied, a custom handler for a completion
         * notification from this emitter.
         */
        EventEmitter.prototype.subscribe = function (generatorOrNext, error, complete) {
            var schedulerFn;
            var errorFn = function (err) { return null; };
            var completeFn = function () { return null; };
            if (generatorOrNext && typeof generatorOrNext === 'object') {
                schedulerFn = this.__isAsync ? function (value) {
                    setTimeout(function () { return generatorOrNext.next(value); });
                } : function (value) { generatorOrNext.next(value); };
                if (generatorOrNext.error) {
                    errorFn = this.__isAsync ? function (err) { setTimeout(function () { return generatorOrNext.error(err); }); } :
                        function (err) { generatorOrNext.error(err); };
                }
                if (generatorOrNext.complete) {
                    completeFn = this.__isAsync ? function () { setTimeout(function () { return generatorOrNext.complete(); }); } :
                        function () { generatorOrNext.complete(); };
                }
            }
            else {
                schedulerFn = this.__isAsync ? function (value) { setTimeout(function () { return generatorOrNext(value); }); } :
                    function (value) { generatorOrNext(value); };
                if (error) {
                    errorFn =
                        this.__isAsync ? function (err) { setTimeout(function () { return error(err); }); } : function (err) { error(err); };
                }
                if (complete) {
                    completeFn =
                        this.__isAsync ? function () { setTimeout(function () { return complete(); }); } : function () { complete(); };
                }
            }
            var sink = _super.prototype.subscribe.call(this, schedulerFn, errorFn, completeFn);
            if (generatorOrNext instanceof rxjs.Subscription) {
                generatorOrNext.add(sink);
            }
            return sink;
        };
        return EventEmitter;
    }(rxjs.Subject));

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Represents an embedded template that can be used to instantiate embedded views.
     * To instantiate embedded views based on a template, use the `ViewContainerRef`
     * method `createEmbeddedView()`.
     *
     * Access a `TemplateRef` instance by placing a directive on an `<ng-template>`
     * element (or directive prefixed with `*`). The `TemplateRef` for the embedded view
     * is injected into the constructor of the directive,
     * using the `TemplateRef` token.
     *
     * You can also use a `Query` to find a `TemplateRef` associated with
     * a component or a directive.
     *
     * @see `ViewContainerRef`
     * @see [Navigate the Component Tree with DI](guide/dependency-injection-navtree)
     *
     * @publicApi
     */
    var TemplateRef = /** @class */ (function () {
        function TemplateRef() {
        }
        /** @internal */
        TemplateRef.__NG_ELEMENT_ID__ = function () { return R3_TEMPLATE_REF_FACTORY$1(TemplateRef, ElementRef); };
        return TemplateRef;
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
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var LQueries_ = /** @class */ (function () {
        function LQueries_(parent, shallow, deep) {
            this.parent = parent;
            this.shallow = shallow;
            this.deep = deep;
        }
        LQueries_.prototype.track = function (queryList, predicate, descend, read) {
            if (descend) {
                this.deep = createQuery(this.deep, queryList, predicate, read != null ? read : null);
            }
            else {
                this.shallow = createQuery(this.shallow, queryList, predicate, read != null ? read : null);
            }
        };
        LQueries_.prototype.clone = function () { return new LQueries_(this, null, this.deep); };
        LQueries_.prototype.container = function () {
            var shallowResults = copyQueriesToContainer(this.shallow);
            var deepResults = copyQueriesToContainer(this.deep);
            return shallowResults || deepResults ? new LQueries_(this, shallowResults, deepResults) : null;
        };
        LQueries_.prototype.createView = function () {
            var shallowResults = copyQueriesToView(this.shallow);
            var deepResults = copyQueriesToView(this.deep);
            return shallowResults || deepResults ? new LQueries_(this, shallowResults, deepResults) : null;
        };
        LQueries_.prototype.insertView = function (index) {
            insertView$1(index, this.shallow);
            insertView$1(index, this.deep);
        };
        LQueries_.prototype.addNode = function (tNode) {
            add(this.deep, tNode);
            if (isContentQueryHost(tNode)) {
                add(this.shallow, tNode);
                if (tNode.parent && isContentQueryHost(tNode.parent)) {
                    // if node has a content query and parent also has a content query
                    // both queries need to check this node for shallow matches
                    add(this.parent.shallow, tNode);
                }
                return this.parent;
            }
            isRootNodeOfQuery(tNode) && add(this.shallow, tNode);
            return this;
        };
        LQueries_.prototype.removeView = function () {
            removeView$1(this.shallow);
            removeView$1(this.deep);
        };
        return LQueries_;
    }());
    function isRootNodeOfQuery(tNode) {
        return tNode.parent === null || isContentQueryHost(tNode.parent);
    }
    function copyQueriesToContainer(query) {
        var result = null;
        while (query) {
            var containerValues = []; // prepare room for views
            query.values.push(containerValues);
            var clonedQuery = {
                next: result,
                list: query.list,
                predicate: query.predicate,
                values: containerValues,
                containerValues: null
            };
            result = clonedQuery;
            query = query.next;
        }
        return result;
    }
    function copyQueriesToView(query) {
        var result = null;
        while (query) {
            var clonedQuery = {
                next: result,
                list: query.list,
                predicate: query.predicate,
                values: [],
                containerValues: query.values
            };
            result = clonedQuery;
            query = query.next;
        }
        return result;
    }
    function insertView$1(index, query) {
        while (query) {
            ngDevMode &&
                assertDefined(query.containerValues, 'View queries need to have a pointer to container values.');
            query.containerValues.splice(index, 0, query.values);
            query = query.next;
        }
    }
    function removeView$1(query) {
        while (query) {
            ngDevMode &&
                assertDefined(query.containerValues, 'View queries need to have a pointer to container values.');
            var containerValues = query.containerValues;
            var viewValuesIdx = containerValues.indexOf(query.values);
            var removed = containerValues.splice(viewValuesIdx, 1);
            // mark a query as dirty only when removed view had matching modes
            ngDevMode && assertEqual(removed.length, 1, 'removed.length');
            if (removed[0].length) {
                query.list.setDirty();
            }
            query = query.next;
        }
    }
    /**
     * Iterates over local names for a given node and returns directive index
     * (or -1 if a local name points to an element).
     *
     * @param tNode static data of a node to check
     * @param selector selector to match
     * @returns directive index, -1 or null if a selector didn't match any of the local names
     */
    function getIdxOfMatchingSelector(tNode, selector) {
        var localNames = tNode.localNames;
        if (localNames) {
            for (var i = 0; i < localNames.length; i += 2) {
                if (localNames[i] === selector) {
                    return localNames[i + 1];
                }
            }
        }
        return null;
    }
    /**
     * Iterates over all the directives for a node and returns index of a directive for a given type.
     *
     * @param tNode TNode on which directives are present.
     * @param currentView The view we are currently processing
     * @param type Type of a directive to look for.
     * @returns Index of a found directive or null when none found.
     */
    function getIdxOfMatchingDirective(tNode, currentView, type) {
        var defs = currentView[TVIEW].data;
        if (defs) {
            var flags = tNode.flags;
            var count = flags & 4095 /* DirectiveCountMask */;
            var start = flags >> 15 /* DirectiveStartingIndexShift */;
            var end = start + count;
            for (var i = start; i < end; i++) {
                var def = defs[i];
                if (def.type === type && def.diPublic) {
                    return i;
                }
            }
        }
        return null;
    }
    // TODO: "read" should be an AbstractType (FW-486)
    function queryRead(tNode, currentView, read) {
        var factoryFn = read[NG_ELEMENT_ID];
        if (typeof factoryFn === 'function') {
            return factoryFn();
        }
        else {
            var matchingIdx = getIdxOfMatchingDirective(tNode, currentView, read);
            if (matchingIdx !== null) {
                return currentView[matchingIdx];
            }
        }
        return null;
    }
    function queryReadByTNodeType(tNode, currentView) {
        if (tNode.type === 3 /* Element */ || tNode.type === 4 /* ElementContainer */) {
            return createElementRef(ElementRef, tNode, currentView);
        }
        if (tNode.type === 0 /* Container */) {
            return createTemplateRef(TemplateRef, ElementRef, tNode, currentView);
        }
        return null;
    }
    function add(query, tNode) {
        var currentView = _getViewData();
        while (query) {
            var predicate = query.predicate;
            var type = predicate.type;
            if (type) {
                // if read token and / or strategy is not specified, use type as read token
                var result = queryRead(tNode, currentView, predicate.read || type);
                if (result !== null) {
                    addMatch(query, result);
                }
            }
            else {
                var selector = predicate.selector;
                for (var i = 0; i < selector.length; i++) {
                    var directiveIdx = getIdxOfMatchingSelector(tNode, selector[i]);
                    if (directiveIdx !== null) {
                        var result = null;
                        if (predicate.read) {
                            result = queryRead(tNode, currentView, predicate.read);
                        }
                        else {
                            if (directiveIdx > -1) {
                                result = currentView[directiveIdx];
                            }
                            else {
                                // if read token and / or strategy is not specified,
                                // detect it using appropriate tNode type
                                result = queryReadByTNodeType(tNode, currentView);
                            }
                        }
                        if (result !== null) {
                            addMatch(query, result);
                        }
                    }
                }
            }
            query = query.next;
        }
    }
    function addMatch(query, matchingValue) {
        query.values.push(matchingValue);
        query.list.setDirty();
    }
    function createPredicate(predicate, read) {
        var isArray = Array.isArray(predicate);
        return {
            type: isArray ? null : predicate,
            selector: isArray ? predicate : null,
            read: read
        };
    }
    function createQuery(previous, queryList, predicate, read) {
        return {
            next: previous,
            list: queryList,
            predicate: createPredicate(predicate, read),
            values: queryList._valuesTree,
            containerValues: null
        };
    }
    var QueryList_ = /** @class */ (function () {
        function QueryList_() {
            this.dirty = true;
            this.changes = new EventEmitter();
            this._values = [];
            /** @internal */
            this._valuesTree = [];
        }
        Object.defineProperty(QueryList_.prototype, "length", {
            get: function () { return this._values.length; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(QueryList_.prototype, "first", {
            get: function () {
                var values = this._values;
                return values.length ? values[0] : null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(QueryList_.prototype, "last", {
            get: function () {
                var values = this._values;
                return values.length ? values[values.length - 1] : null;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * See
         * [Array.map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map)
         */
        QueryList_.prototype.map = function (fn) { return this._values.map(fn); };
        /**
         * See
         * [Array.filter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter)
         */
        QueryList_.prototype.filter = function (fn) {
            return this._values.filter(fn);
        };
        /**
         * See
         * [Array.find](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find)
         */
        QueryList_.prototype.find = function (fn) {
            return this._values.find(fn);
        };
        /**
         * See
         * [Array.reduce](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce)
         */
        QueryList_.prototype.reduce = function (fn, init) {
            return this._values.reduce(fn, init);
        };
        /**
         * See
         * [Array.forEach](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach)
         */
        QueryList_.prototype.forEach = function (fn) { this._values.forEach(fn); };
        /**
         * See
         * [Array.some](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some)
         */
        QueryList_.prototype.some = function (fn) {
            return this._values.some(fn);
        };
        QueryList_.prototype.toArray = function () { return this._values.slice(0); };
        QueryList_.prototype[getSymbolIterator()] = function () { return this._values[getSymbolIterator()](); };
        QueryList_.prototype.toString = function () { return this._values.toString(); };
        QueryList_.prototype.reset = function (res) {
            this._values = flatten(res);
            this.dirty = false;
        };
        QueryList_.prototype.notifyOnChanges = function () { this.changes.emit(this); };
        QueryList_.prototype.setDirty = function () { this.dirty = true; };
        QueryList_.prototype.destroy = function () {
            this.changes.complete();
            this.changes.unsubscribe();
        };
        return QueryList_;
    }());
    var QueryList = QueryList_;
    /**
     * Creates and returns a QueryList.
     *
     * @param memoryIndex The index in memory where the QueryList should be saved. If null,
     * this is is a content query and the QueryList will be saved later through directiveCreate.
     * @param predicate The type for which the query will search
     * @param descend Whether or not to descend into children
     * @param read What to save in the query
     * @returns QueryList<T>
     */
    function query(memoryIndex, predicate, descend, 
    // TODO: "read" should be an AbstractType (FW-486)
    read) {
        ngDevMode && assertPreviousIsParent();
        var queryList = new QueryList();
        var queries = getOrCreateCurrentQueries(LQueries_);
        queries.track(queryList, predicate, descend, read);
        storeCleanupWithContext(null, queryList, queryList.destroy);
        if (memoryIndex != null) {
            store(memoryIndex, queryList);
        }
        return queryList;
    }
    /**
     * Refreshes a query by combining matches from all active views and removing matches from deleted
     * views.
     * Returns true if a query got dirty during change detection, false otherwise.
     */
    function queryRefresh(queryList) {
        var queryListImpl = queryList;
        if (queryList.dirty) {
            queryList.reset(queryListImpl._valuesTree);
            queryList.notifyOnChanges();
            return true;
        }
        return false;
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Retrieves `TemplateRef` instance from `Injector` when a local reference is placed on the
     * `<ng-template>` element.
     */
    function templateRefExtractor(tNode, currentView) {
        return createTemplateRef(TemplateRef, ElementRef, tNode, currentView);
    }

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
    var BRAND = '__SANITIZER_TRUSTED_BRAND__';
    function allowSanitizationBypass(value, type) {
        return (value instanceof String && value[BRAND] === type) ? true : false;
    }
    /**
     * Mark `html` string as trusted.
     *
     * This function wraps the trusted string in `String` and brands it in a way which makes it
     * recognizable to {@link htmlSanitizer} to be trusted implicitly.
     *
     * @param trustedHtml `html` string which needs to be implicitly trusted.
     * @returns a `html` `String` which has been branded to be implicitly trusted.
     */
    function bypassSanitizationTrustHtml(trustedHtml) {
        return bypassSanitizationTrustString(trustedHtml, "Html" /* Html */);
    }
    /**
     * Mark `style` string as trusted.
     *
     * This function wraps the trusted string in `String` and brands it in a way which makes it
     * recognizable to {@link styleSanitizer} to be trusted implicitly.
     *
     * @param trustedStyle `style` string which needs to be implicitly trusted.
     * @returns a `style` `String` which has been branded to be implicitly trusted.
     */
    function bypassSanitizationTrustStyle(trustedStyle) {
        return bypassSanitizationTrustString(trustedStyle, "Style" /* Style */);
    }
    /**
     * Mark `script` string as trusted.
     *
     * This function wraps the trusted string in `String` and brands it in a way which makes it
     * recognizable to {@link scriptSanitizer} to be trusted implicitly.
     *
     * @param trustedScript `script` string which needs to be implicitly trusted.
     * @returns a `script` `String` which has been branded to be implicitly trusted.
     */
    function bypassSanitizationTrustScript(trustedScript) {
        return bypassSanitizationTrustString(trustedScript, "Script" /* Script */);
    }
    /**
     * Mark `url` string as trusted.
     *
     * This function wraps the trusted string in `String` and brands it in a way which makes it
     * recognizable to {@link urlSanitizer} to be trusted implicitly.
     *
     * @param trustedUrl `url` string which needs to be implicitly trusted.
     * @returns a `url` `String` which has been branded to be implicitly trusted.
     */
    function bypassSanitizationTrustUrl(trustedUrl) {
        return bypassSanitizationTrustString(trustedUrl, "Url" /* Url */);
    }
    /**
     * Mark `url` string as trusted.
     *
     * This function wraps the trusted string in `String` and brands it in a way which makes it
     * recognizable to {@link resourceUrlSanitizer} to be trusted implicitly.
     *
     * @param trustedResourceUrl `url` string which needs to be implicitly trusted.
     * @returns a `url` `String` which has been branded to be implicitly trusted.
     */
    function bypassSanitizationTrustResourceUrl(trustedResourceUrl) {
        return bypassSanitizationTrustString(trustedResourceUrl, "ResourceUrl" /* ResourceUrl */);
    }
    function bypassSanitizationTrustString(trustedString, mode) {
        var trusted = new String(trustedString);
        trusted[BRAND] = mode;
        return trusted;
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * This file is used to control if the default rendering pipeline should be `ViewEngine` or `Ivy`.
     *
     * For more information on how to run and debug tests with either Ivy or View Engine (legacy),
     * please see [BAZEL.md](./docs/BAZEL.md).
     */
    var _devMode = true;
    var _runModeLocked = false;
    /**
     * Returns whether Angular is in development mode. After called once,
     * the value is locked and won't change any more.
     *
     * By default, this is true, unless a user calls `enableProdMode` before calling this.
     *
     * @publicApi
     */
    function isDevMode() {
        _runModeLocked = true;
        return _devMode;
    }
    /**
     * Disable Angular's development mode, which turns off assertions and other
     * checks within the framework.
     *
     * One important assertion this disables verifies that a change detection pass
     * does not result in additional changes to any bindings (also known as
     * unidirectional data flow).
     *
     * @publicApi
     */
    function enableProdMode() {
        if (_runModeLocked) {
            throw new Error('Cannot enable prod mode after platform setup.');
        }
        _devMode = false;
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * This helper class is used to get hold of an inert tree of DOM elements containing dirty HTML
     * that needs sanitizing.
     * Depending upon browser support we must use one of three strategies for doing this.
     * Support: Safari 10.x -> XHR strategy
     * Support: Firefox -> DomParser strategy
     * Default: InertDocument strategy
     */
    var InertBodyHelper = /** @class */ (function () {
        function InertBodyHelper(defaultDoc) {
            this.defaultDoc = defaultDoc;
            this.inertDocument = this.defaultDoc.implementation.createHTMLDocument('sanitization-inert');
            this.inertBodyElement = this.inertDocument.body;
            if (this.inertBodyElement == null) {
                // usually there should be only one body element in the document, but IE doesn't have any, so
                // we need to create one.
                var inertHtml = this.inertDocument.createElement('html');
                this.inertDocument.appendChild(inertHtml);
                this.inertBodyElement = this.inertDocument.createElement('body');
                inertHtml.appendChild(this.inertBodyElement);
            }
            this.inertBodyElement.innerHTML = '<svg><g onload="this.parentNode.remove()"></g></svg>';
            if (this.inertBodyElement.querySelector && !this.inertBodyElement.querySelector('svg')) {
                // We just hit the Safari 10.1 bug - which allows JS to run inside the SVG G element
                // so use the XHR strategy.
                this.getInertBodyElement = this.getInertBodyElement_XHR;
                return;
            }
            this.inertBodyElement.innerHTML =
                '<svg><p><style><img src="</style><img src=x onerror=alert(1)//">';
            if (this.inertBodyElement.querySelector && this.inertBodyElement.querySelector('svg img')) {
                // We just hit the Firefox bug - which prevents the inner img JS from being sanitized
                // so use the DOMParser strategy, if it is available.
                // If the DOMParser is not available then we are not in Firefox (Server/WebWorker?) so we
                // fall through to the default strategy below.
                if (isDOMParserAvailable()) {
                    this.getInertBodyElement = this.getInertBodyElement_DOMParser;
                    return;
                }
            }
            // None of the bugs were hit so it is safe for us to use the default InertDocument strategy
            this.getInertBodyElement = this.getInertBodyElement_InertDocument;
        }
        /**
         * Use XHR to create and fill an inert body element (on Safari 10.1)
         * See
         * https://github.com/cure53/DOMPurify/blob/a992d3a75031cb8bb032e5ea8399ba972bdf9a65/src/purify.js#L439-L449
         */
        InertBodyHelper.prototype.getInertBodyElement_XHR = function (html) {
            // We add these extra elements to ensure that the rest of the content is parsed as expected
            // e.g. leading whitespace is maintained and tags like `<meta>` do not get hoisted to the
            // `<head>` tag.
            html = '<body><remove></remove>' + html + '</body>';
            try {
                html = encodeURI(html);
            }
            catch (e) {
                return null;
            }
            var xhr = new XMLHttpRequest();
            xhr.responseType = 'document';
            xhr.open('GET', 'data:text/html;charset=utf-8,' + html, false);
            xhr.send(undefined);
            var body = xhr.response.body;
            body.removeChild(body.firstChild);
            return body;
        };
        /**
         * Use DOMParser to create and fill an inert body element (on Firefox)
         * See https://github.com/cure53/DOMPurify/releases/tag/0.6.7
         *
         */
        InertBodyHelper.prototype.getInertBodyElement_DOMParser = function (html) {
            // We add these extra elements to ensure that the rest of the content is parsed as expected
            // e.g. leading whitespace is maintained and tags like `<meta>` do not get hoisted to the
            // `<head>` tag.
            html = '<body><remove></remove>' + html + '</body>';
            try {
                var body = new window
                    .DOMParser()
                    .parseFromString(html, 'text/html')
                    .body;
                body.removeChild(body.firstChild);
                return body;
            }
            catch (e) {
                return null;
            }
        };
        /**
         * Use an HTML5 `template` element, if supported, or an inert body element created via
         * `createHtmlDocument` to create and fill an inert DOM element.
         * This is the default sane strategy to use if the browser does not require one of the specialised
         * strategies above.
         */
        InertBodyHelper.prototype.getInertBodyElement_InertDocument = function (html) {
            // Prefer using <template> element if supported.
            var templateEl = this.inertDocument.createElement('template');
            if ('content' in templateEl) {
                templateEl.innerHTML = html;
                return templateEl;
            }
            this.inertBodyElement.innerHTML = html;
            // Support: IE 9-11 only
            // strip custom-namespaced attributes on IE<=11
            if (this.defaultDoc.documentMode) {
                this.stripCustomNsAttrs(this.inertBodyElement);
            }
            return this.inertBodyElement;
        };
        /**
         * When IE9-11 comes across an unknown namespaced attribute e.g. 'xlink:foo' it adds 'xmlns:ns1'
         * attribute to declare ns1 namespace and prefixes the attribute with 'ns1' (e.g.
         * 'ns1:xlink:foo').
         *
         * This is undesirable since we don't want to allow any of these custom attributes. This method
         * strips them all.
         */
        InertBodyHelper.prototype.stripCustomNsAttrs = function (el) {
            var elAttrs = el.attributes;
            // loop backwards so that we can support removals.
            for (var i = elAttrs.length - 1; 0 < i; i--) {
                var attrib = elAttrs.item(i);
                var attrName = attrib.name;
                if (attrName === 'xmlns:ns1' || attrName.indexOf('ns1:') === 0) {
                    el.removeAttribute(attrName);
                }
            }
            var childNode = el.firstChild;
            while (childNode) {
                if (childNode.nodeType === Node.ELEMENT_NODE)
                    this.stripCustomNsAttrs(childNode);
                childNode = childNode.nextSibling;
            }
        };
        return InertBodyHelper;
    }());
    /**
     * We need to determine whether the DOMParser exists in the global context.
     * The try-catch is because, on some browsers, trying to access this property
     * on window can actually throw an error.
     *
     * @suppress {uselessCode}
     */
    function isDOMParserAvailable() {
        try {
            return !!window.DOMParser;
        }
        catch (e) {
            return false;
        }
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * A pattern that recognizes a commonly useful subset of URLs that are safe.
     *
     * This regular expression matches a subset of URLs that will not cause script
     * execution if used in URL context within a HTML document. Specifically, this
     * regular expression matches if (comment from here on and regex copied from
     * Soy's EscapingConventions):
     * (1) Either a protocol in a whitelist (http, https, mailto or ftp).
     * (2) or no protocol.  A protocol must be followed by a colon. The below
     *     allows that by allowing colons only after one of the characters [/?#].
     *     A colon after a hash (#) must be in the fragment.
     *     Otherwise, a colon after a (?) must be in a query.
     *     Otherwise, a colon after a single solidus (/) must be in a path.
     *     Otherwise, a colon after a double solidus (//) must be in the authority
     *     (before port).
     *
     * The pattern disallows &, used in HTML entity declarations before
     * one of the characters in [/?#]. This disallows HTML entities used in the
     * protocol name, which should never happen, e.g. "h&#116;tp" for "http".
     * It also disallows HTML entities in the first path part of a relative path,
     * e.g. "foo&lt;bar/baz".  Our existing escaping functions should not produce
     * that. More importantly, it disallows masking of a colon,
     * e.g. "javascript&#58;...".
     *
     * This regular expression was taken from the Closure sanitization library.
     */
    var SAFE_URL_PATTERN = /^(?:(?:https?|mailto|ftp|tel|file):|[^&:/?#]*(?:[/?#]|$))/gi;
    /** A pattern that matches safe data URLs. Only matches image, video and audio types. */
    var DATA_URL_PATTERN = /^data:(?:image\/(?:bmp|gif|jpeg|jpg|png|tiff|webp)|video\/(?:mpeg|mp4|ogg|webm)|audio\/(?:mp3|oga|ogg|opus));base64,[a-z0-9+\/]+=*$/i;
    function _sanitizeUrl(url) {
        url = String(url);
        if (url.match(SAFE_URL_PATTERN) || url.match(DATA_URL_PATTERN))
            return url;
        if (isDevMode()) {
            console.warn("WARNING: sanitizing unsafe URL value " + url + " (see http://g.co/ng/security#xss)");
        }
        return 'unsafe:' + url;
    }
    function sanitizeSrcset(srcset) {
        srcset = String(srcset);
        return srcset.split(',').map(function (srcset) { return _sanitizeUrl(srcset.trim()); }).join(', ');
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    function tagSet(tags) {
        var e_1, _a;
        var res = {};
        try {
            for (var _b = __values(tags.split(',')), _c = _b.next(); !_c.done; _c = _b.next()) {
                var t = _c.value;
                res[t] = true;
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return res;
    }
    function merge() {
        var sets = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            sets[_i] = arguments[_i];
        }
        var e_2, _a;
        var res = {};
        try {
            for (var sets_1 = __values(sets), sets_1_1 = sets_1.next(); !sets_1_1.done; sets_1_1 = sets_1.next()) {
                var s = sets_1_1.value;
                for (var v in s) {
                    if (s.hasOwnProperty(v))
                        res[v] = true;
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (sets_1_1 && !sets_1_1.done && (_a = sets_1.return)) _a.call(sets_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return res;
    }
    // Good source of info about elements and attributes
    // http://dev.w3.org/html5/spec/Overview.html#semantics
    // http://simon.html5.org/html-elements
    // Safe Void Elements - HTML5
    // http://dev.w3.org/html5/spec/Overview.html#void-elements
    var VOID_ELEMENTS = tagSet('area,br,col,hr,img,wbr');
    // Elements that you can, intentionally, leave open (and which close themselves)
    // http://dev.w3.org/html5/spec/Overview.html#optional-tags
    var OPTIONAL_END_TAG_BLOCK_ELEMENTS = tagSet('colgroup,dd,dt,li,p,tbody,td,tfoot,th,thead,tr');
    var OPTIONAL_END_TAG_INLINE_ELEMENTS = tagSet('rp,rt');
    var OPTIONAL_END_TAG_ELEMENTS = merge(OPTIONAL_END_TAG_INLINE_ELEMENTS, OPTIONAL_END_TAG_BLOCK_ELEMENTS);
    // Safe Block Elements - HTML5
    var BLOCK_ELEMENTS = merge(OPTIONAL_END_TAG_BLOCK_ELEMENTS, tagSet('address,article,' +
        'aside,blockquote,caption,center,del,details,dialog,dir,div,dl,figure,figcaption,footer,h1,h2,h3,h4,h5,' +
        'h6,header,hgroup,hr,ins,main,map,menu,nav,ol,pre,section,summary,table,ul'));
    // Inline Elements - HTML5
    var INLINE_ELEMENTS = merge(OPTIONAL_END_TAG_INLINE_ELEMENTS, tagSet('a,abbr,acronym,audio,b,' +
        'bdi,bdo,big,br,cite,code,del,dfn,em,font,i,img,ins,kbd,label,map,mark,picture,q,ruby,rp,rt,s,' +
        'samp,small,source,span,strike,strong,sub,sup,time,track,tt,u,var,video'));
    var VALID_ELEMENTS = merge(VOID_ELEMENTS, BLOCK_ELEMENTS, INLINE_ELEMENTS, OPTIONAL_END_TAG_ELEMENTS);
    // Attributes that have href and hence need to be sanitized
    var URI_ATTRS = tagSet('background,cite,href,itemtype,longdesc,poster,src,xlink:href');
    // Attributes that have special href set hence need to be sanitized
    var SRCSET_ATTRS = tagSet('srcset');
    var HTML_ATTRS = tagSet('abbr,accesskey,align,alt,autoplay,axis,bgcolor,border,cellpadding,cellspacing,class,clear,color,cols,colspan,' +
        'compact,controls,coords,datetime,default,dir,download,face,headers,height,hidden,hreflang,hspace,' +
        'ismap,itemscope,itemprop,kind,label,lang,language,loop,media,muted,nohref,nowrap,open,preload,rel,rev,role,rows,rowspan,rules,' +
        'scope,scrolling,shape,size,sizes,span,srclang,start,summary,tabindex,target,title,translate,type,usemap,' +
        'valign,value,vspace,width');
    // NB: This currently consciously doesn't support SVG. SVG sanitization has had several security
    // issues in the past, so it seems safer to leave it out if possible. If support for binding SVG via
    // innerHTML is required, SVG attributes should be added here.
    // NB: Sanitization does not allow <form> elements or other active elements (<button> etc). Those
    // can be sanitized, but they increase security surface area without a legitimate use case, so they
    // are left out here.
    var VALID_ATTRS = merge(URI_ATTRS, SRCSET_ATTRS, HTML_ATTRS);
    /**
     * SanitizingHtmlSerializer serializes a DOM fragment, stripping out any unsafe elements and unsafe
     * attributes.
     */
    var SanitizingHtmlSerializer = /** @class */ (function () {
        function SanitizingHtmlSerializer() {
            // Explicitly track if something was stripped, to avoid accidentally warning of sanitization just
            // because characters were re-encoded.
            this.sanitizedSomething = false;
            this.buf = [];
        }
        SanitizingHtmlSerializer.prototype.sanitizeChildren = function (el) {
            // This cannot use a TreeWalker, as it has to run on Angular's various DOM adapters.
            // However this code never accesses properties off of `document` before deleting its contents
            // again, so it shouldn't be vulnerable to DOM clobbering.
            var current = el.firstChild;
            while (current) {
                if (current.nodeType === Node.ELEMENT_NODE) {
                    this.startElement(current);
                }
                else if (current.nodeType === Node.TEXT_NODE) {
                    this.chars(current.nodeValue);
                }
                else {
                    // Strip non-element, non-text nodes.
                    this.sanitizedSomething = true;
                }
                if (current.firstChild) {
                    current = current.firstChild;
                    continue;
                }
                while (current) {
                    // Leaving the element. Walk up and to the right, closing tags as we go.
                    if (current.nodeType === Node.ELEMENT_NODE) {
                        this.endElement(current);
                    }
                    var next = this.checkClobberedElement(current, current.nextSibling);
                    if (next) {
                        current = next;
                        break;
                    }
                    current = this.checkClobberedElement(current, current.parentNode);
                }
            }
            return this.buf.join('');
        };
        SanitizingHtmlSerializer.prototype.startElement = function (element) {
            var tagName = element.nodeName.toLowerCase();
            if (!VALID_ELEMENTS.hasOwnProperty(tagName)) {
                this.sanitizedSomething = true;
                return;
            }
            this.buf.push('<');
            this.buf.push(tagName);
            var elAttrs = element.attributes;
            for (var i = 0; i < elAttrs.length; i++) {
                var elAttr = elAttrs.item(i);
                var attrName = elAttr.name;
                var lower = attrName.toLowerCase();
                if (!VALID_ATTRS.hasOwnProperty(lower)) {
                    this.sanitizedSomething = true;
                    continue;
                }
                var value = elAttr.value;
                // TODO(martinprobst): Special case image URIs for data:image/...
                if (URI_ATTRS[lower])
                    value = _sanitizeUrl(value);
                if (SRCSET_ATTRS[lower])
                    value = sanitizeSrcset(value);
                this.buf.push(' ', attrName, '="', encodeEntities(value), '"');
            }
            this.buf.push('>');
        };
        SanitizingHtmlSerializer.prototype.endElement = function (current) {
            var tagName = current.nodeName.toLowerCase();
            if (VALID_ELEMENTS.hasOwnProperty(tagName) && !VOID_ELEMENTS.hasOwnProperty(tagName)) {
                this.buf.push('</');
                this.buf.push(tagName);
                this.buf.push('>');
            }
        };
        SanitizingHtmlSerializer.prototype.chars = function (chars) { this.buf.push(encodeEntities(chars)); };
        SanitizingHtmlSerializer.prototype.checkClobberedElement = function (node, nextNode) {
            if (nextNode &&
                (node.compareDocumentPosition(nextNode) &
                    Node.DOCUMENT_POSITION_CONTAINED_BY) === Node.DOCUMENT_POSITION_CONTAINED_BY) {
                throw new Error("Failed to sanitize html because the element is clobbered: " + node.outerHTML);
            }
            return nextNode;
        };
        return SanitizingHtmlSerializer;
    }());
    // Regular Expressions for parsing tags and attributes
    var SURROGATE_PAIR_REGEXP = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
    // ! to ~ is the ASCII range.
    var NON_ALPHANUMERIC_REGEXP = /([^\#-~ |!])/g;
    /**
     * Escapes all potentially dangerous characters, so that the
     * resulting string can be safely inserted into attribute or
     * element text.
     * @param value
     */
    function encodeEntities(value) {
        return value.replace(/&/g, '&amp;')
            .replace(SURROGATE_PAIR_REGEXP, function (match) {
            var hi = match.charCodeAt(0);
            var low = match.charCodeAt(1);
            return '&#' + (((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000) + ';';
        })
            .replace(NON_ALPHANUMERIC_REGEXP, function (match) { return '&#' + match.charCodeAt(0) + ';'; })
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
    var inertBodyHelper;
    /**
     * Sanitizes the given unsafe, untrusted HTML fragment, and returns HTML text that is safe to add to
     * the DOM in a browser environment.
     */
    function _sanitizeHtml(defaultDoc, unsafeHtmlInput) {
        var inertBodyElement = null;
        try {
            inertBodyHelper = inertBodyHelper || new InertBodyHelper(defaultDoc);
            // Make sure unsafeHtml is actually a string (TypeScript types are not enforced at runtime).
            var unsafeHtml = unsafeHtmlInput ? String(unsafeHtmlInput) : '';
            inertBodyElement = inertBodyHelper.getInertBodyElement(unsafeHtml);
            // mXSS protection. Repeatedly parse the document to make sure it stabilizes, so that a browser
            // trying to auto-correct incorrect HTML cannot cause formerly inert HTML to become dangerous.
            var mXSSAttempts = 5;
            var parsedHtml = unsafeHtml;
            do {
                if (mXSSAttempts === 0) {
                    throw new Error('Failed to sanitize html because the input is unstable');
                }
                mXSSAttempts--;
                unsafeHtml = parsedHtml;
                parsedHtml = inertBodyElement.innerHTML;
                inertBodyElement = inertBodyHelper.getInertBodyElement(unsafeHtml);
            } while (unsafeHtml !== parsedHtml);
            var sanitizer = new SanitizingHtmlSerializer();
            var safeHtml = sanitizer.sanitizeChildren(getTemplateContent(inertBodyElement) || inertBodyElement);
            if (isDevMode() && sanitizer.sanitizedSomething) {
                console.warn('WARNING: sanitizing HTML stripped some content (see http://g.co/ng/security#xss).');
            }
            return safeHtml;
        }
        finally {
            // In case anything goes wrong, clear out inertElement to reset the entire DOM structure.
            if (inertBodyElement) {
                var parent_1 = getTemplateContent(inertBodyElement) || inertBodyElement;
                while (parent_1.firstChild) {
                    parent_1.removeChild(parent_1.firstChild);
                }
            }
        }
    }
    function getTemplateContent(el) {
        return 'content' in el /** Microsoft/TypeScript#21517 */ && isTemplateElement(el) ?
            el.content :
            null;
    }
    function isTemplateElement(el) {
        return el.nodeType === Node.ELEMENT_NODE && el.nodeName === 'TEMPLATE';
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    (function (SecurityContext) {
        SecurityContext[SecurityContext["NONE"] = 0] = "NONE";
        SecurityContext[SecurityContext["HTML"] = 1] = "HTML";
        SecurityContext[SecurityContext["STYLE"] = 2] = "STYLE";
        SecurityContext[SecurityContext["SCRIPT"] = 3] = "SCRIPT";
        SecurityContext[SecurityContext["URL"] = 4] = "URL";
        SecurityContext[SecurityContext["RESOURCE_URL"] = 5] = "RESOURCE_URL";
    })(exports.SecurityContext || (exports.SecurityContext = {}));
    /**
     * Sanitizer is used by the views to sanitize potentially dangerous values.
     *
     * @publicApi
     */
    var Sanitizer = /** @class */ (function () {
        function Sanitizer() {
        }
        return Sanitizer;
    }());

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Regular expression for safe style values.
     *
     * Quotes (" and ') are allowed, but a check must be done elsewhere to ensure they're balanced.
     *
     * ',' allows multiple values to be assigned to the same property (e.g. background-attachment or
     * font-family) and hence could allow multiple values to get injected, but that should pose no risk
     * of XSS.
     *
     * The function expression checks only for XSS safety, not for CSS validity.
     *
     * This regular expression was taken from the Closure sanitization library, and augmented for
     * transformation values.
     */
    var VALUES = '[-,."\'%_!# a-zA-Z0-9]+';
    var TRANSFORMATION_FNS = '(?:matrix|translate|scale|rotate|skew|perspective)(?:X|Y|3d)?';
    var COLOR_FNS = '(?:rgb|hsl)a?';
    var GRADIENTS = '(?:repeating-)?(?:linear|radial)-gradient';
    var CSS3_FNS = '(?:calc|attr)';
    var FN_ARGS = '\\([-0-9.%, #a-zA-Z]+\\)';
    var SAFE_STYLE_VALUE = new RegExp("^(" + VALUES + "|" +
        ("(?:" + TRANSFORMATION_FNS + "|" + COLOR_FNS + "|" + GRADIENTS + "|" + CSS3_FNS + ")") +
        (FN_ARGS + ")$"), 'g');
    /**
     * Matches a `url(...)` value with an arbitrary argument as long as it does
     * not contain parentheses.
     *
     * The URL value still needs to be sanitized separately.
     *
     * `url(...)` values are a very common use case, e.g. for `background-image`. With carefully crafted
     * CSS style rules, it is possible to construct an information leak with `url` values in CSS, e.g.
     * by observing whether scroll bars are displayed, or character ranges used by a font face
     * definition.
     *
     * Angular only allows binding CSS values (as opposed to entire CSS rules), so it is unlikely that
     * binding a URL value without further cooperation from the page will cause an information leak, and
     * if so, it is just a leak, not a full blown XSS vulnerability.
     *
     * Given the common use case, low likelihood of attack vector, and low impact of an attack, this
     * code is permissive and allows URLs that sanitize otherwise.
     */
    var URL_RE = /^url\(([^)]+)\)$/;
    /**
     * Checks that quotes (" and ') are properly balanced inside a string. Assumes
     * that neither escape (\) nor any other character that could result in
     * breaking out of a string parsing context are allowed;
     * see http://www.w3.org/TR/css3-syntax/#string-token-diagram.
     *
     * This code was taken from the Closure sanitization library.
     */
    function hasBalancedQuotes(value) {
        var outsideSingle = true;
        var outsideDouble = true;
        for (var i = 0; i < value.length; i++) {
            var c = value.charAt(i);
            if (c === '\'' && outsideDouble) {
                outsideSingle = !outsideSingle;
            }
            else if (c === '"' && outsideSingle) {
                outsideDouble = !outsideDouble;
            }
        }
        return outsideSingle && outsideDouble;
    }
    /**
     * Sanitizes the given untrusted CSS style property value (i.e. not an entire object, just a single
     * value) and returns a value that is safe to use in a browser environment.
     */
    function _sanitizeStyle(value) {
        value = String(value).trim(); // Make sure it's actually a string.
        if (!value)
            return '';
        // Single url(...) values are supported, but only for URLs that sanitize cleanly. See above for
        // reasoning behind this.
        var urlMatch = value.match(URL_RE);
        if ((urlMatch && _sanitizeUrl(urlMatch[1]) === urlMatch[1]) ||
            value.match(SAFE_STYLE_VALUE) && hasBalancedQuotes(value)) {
            return value; // Safe style values.
        }
        if (isDevMode()) {
            console.warn("WARNING: sanitizing unsafe style value " + value + " (see http://g.co/ng/security#xss).");
        }
        return 'unsafe';
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * An `html` sanitizer which converts untrusted `html` **string** into trusted string by removing
     * dangerous content.
     *
     * This method parses the `html` and locates potentially dangerous content (such as urls and
     * javascript) and removes it.
     *
     * It is possible to mark a string as trusted by calling {@link bypassSanitizationTrustHtml}.
     *
     * @param unsafeHtml untrusted `html`, typically from the user.
     * @returns `html` string which is safe to display to user, because all of the dangerous javascript
     * and urls have been removed.
     */
    function sanitizeHtml(unsafeHtml) {
        var s = getCurrentSanitizer();
        if (s) {
            return s.sanitize(exports.SecurityContext.HTML, unsafeHtml) || '';
        }
        if (allowSanitizationBypass(unsafeHtml, "Html" /* Html */)) {
            return unsafeHtml.toString();
        }
        return _sanitizeHtml(document, stringify$1(unsafeHtml));
    }
    /**
     * A `style` sanitizer which converts untrusted `style` **string** into trusted string by removing
     * dangerous content.
     *
     * This method parses the `style` and locates potentially dangerous content (such as urls and
     * javascript) and removes it.
     *
     * It is possible to mark a string as trusted by calling {@link bypassSanitizationTrustStyle}.
     *
     * @param unsafeStyle untrusted `style`, typically from the user.
     * @returns `style` string which is safe to bind to the `style` properties, because all of the
     * dangerous javascript and urls have been removed.
     */
    function sanitizeStyle(unsafeStyle) {
        var s = getCurrentSanitizer();
        if (s) {
            return s.sanitize(exports.SecurityContext.STYLE, unsafeStyle) || '';
        }
        if (allowSanitizationBypass(unsafeStyle, "Style" /* Style */)) {
            return unsafeStyle.toString();
        }
        return _sanitizeStyle(stringify$1(unsafeStyle));
    }
    /**
     * A `url` sanitizer which converts untrusted `url` **string** into trusted string by removing
     * dangerous
     * content.
     *
     * This method parses the `url` and locates potentially dangerous content (such as javascript) and
     * removes it.
     *
     * It is possible to mark a string as trusted by calling {@link bypassSanitizationTrustUrl}.
     *
     * @param unsafeUrl untrusted `url`, typically from the user.
     * @returns `url` string which is safe to bind to the `src` properties such as `<img src>`, because
     * all of the dangerous javascript has been removed.
     */
    function sanitizeUrl(unsafeUrl) {
        var s = getCurrentSanitizer();
        if (s) {
            return s.sanitize(exports.SecurityContext.URL, unsafeUrl) || '';
        }
        if (allowSanitizationBypass(unsafeUrl, "Url" /* Url */)) {
            return unsafeUrl.toString();
        }
        return _sanitizeUrl(stringify$1(unsafeUrl));
    }
    /**
     * A `url` sanitizer which only lets trusted `url`s through.
     *
     * This passes only `url`s marked trusted by calling {@link bypassSanitizationTrustResourceUrl}.
     *
     * @param unsafeResourceUrl untrusted `url`, typically from the user.
     * @returns `url` string which is safe to bind to the `src` properties such as `<img src>`, because
     * only trusted `url`s have been allowed to pass.
     */
    function sanitizeResourceUrl(unsafeResourceUrl) {
        var s = getCurrentSanitizer();
        if (s) {
            return s.sanitize(exports.SecurityContext.RESOURCE_URL, unsafeResourceUrl) || '';
        }
        if (allowSanitizationBypass(unsafeResourceUrl, "ResourceUrl" /* ResourceUrl */)) {
            return unsafeResourceUrl.toString();
        }
        throw new Error('unsafe value used in a resource URL context (see http://g.co/ng/security#xss)');
    }
    /**
     * A `script` sanitizer which only lets trusted javascript through.
     *
     * This passes only `script`s marked trusted by calling {@link bypassSanitizationTrustScript}.
     *
     * @param unsafeScript untrusted `script`, typically from the user.
     * @returns `url` string which is safe to bind to the `<script>` element such as `<img src>`,
     * because only trusted `scripts`s have been allowed to pass.
     */
    function sanitizeScript(unsafeScript) {
        var s = getCurrentSanitizer();
        if (s) {
            return s.sanitize(exports.SecurityContext.SCRIPT, unsafeScript) || '';
        }
        if (allowSanitizationBypass(unsafeScript, "Script" /* Script */)) {
            return unsafeScript.toString();
        }
        throw new Error('unsafe value used in a script context');
    }
    /**
     * The default style sanitizer will handle sanitization for style properties by
     * sanitizing any CSS property that can include a `url` value (usually image-based properties)
     */
    var defaultStyleSanitizer = function (prop, value) {
        if (value === undefined) {
            return prop === 'background-image' || prop === 'background' || prop === 'border-image' ||
                prop === 'filter' || prop === 'filter' || prop === 'list-style' ||
                prop === 'list-style-image';
        }
        return sanitizeStyle(value);
    };

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * A mapping of the @angular/core API surface used in generated expressions to the actual symbols.
     *
     * This should be kept up to date with the public exports of @angular/core.
     */
    var angularCoreEnv = {
        'ɵdefineBase': defineBase,
        'ɵdefineComponent': defineComponent,
        'ɵdefineDirective': defineDirective,
        'defineInjectable': defineInjectable,
        'defineInjector': defineInjector,
        'ɵdefineNgModule': defineNgModule,
        'ɵdefinePipe': definePipe,
        'ɵdirectiveInject': directiveInject,
        'ɵgetFactoryOf': getFactoryOf,
        'ɵgetInheritedFactory': getInheritedFactory,
        'inject': inject,
        'ɵinjectAttribute': injectAttribute,
        'ɵtemplateRefExtractor': templateRefExtractor,
        'ɵNgOnChangesFeature': NgOnChangesFeature,
        'ɵPublicFeature': PublicFeature,
        'ɵInheritDefinitionFeature': InheritDefinitionFeature,
        'ɵelementAttribute': elementAttribute,
        'ɵbind': bind,
        'ɵcontainer': container,
        'ɵnextContext': nextContext,
        'ɵcontainerRefreshStart': containerRefreshStart,
        'ɵcontainerRefreshEnd': containerRefreshEnd,
        'ɵloadQueryList': loadQueryList,
        'ɵnamespaceHTML': namespaceHTML,
        'ɵnamespaceMathML': namespaceMathML,
        'ɵnamespaceSVG': namespaceSVG,
        'ɵenableBindings': enableBindings,
        'ɵdisableBindings': disableBindings,
        'ɵelementStart': elementStart,
        'ɵelementEnd': elementEnd,
        'ɵelement': element,
        'ɵEC': elementContainerStart,
        'ɵeC': elementContainerEnd,
        'ɵpureFunction0': pureFunction0,
        'ɵpureFunction1': pureFunction1,
        'ɵpureFunction2': pureFunction2,
        'ɵpureFunction3': pureFunction3,
        'ɵpureFunction4': pureFunction4,
        'ɵpureFunction5': pureFunction5,
        'ɵpureFunction6': pureFunction6,
        'ɵpureFunction7': pureFunction7,
        'ɵpureFunction8': pureFunction8,
        'ɵpureFunctionV': pureFunctionV,
        'ɵgetCurrentView': getCurrentView,
        'ɵrestoreView': restoreView,
        'ɵinterpolation1': interpolation1,
        'ɵinterpolation2': interpolation2,
        'ɵinterpolation3': interpolation3,
        'ɵinterpolation4': interpolation4,
        'ɵinterpolation5': interpolation5,
        'ɵinterpolation6': interpolation6,
        'ɵinterpolation7': interpolation7,
        'ɵinterpolation8': interpolation8,
        'ɵinterpolationV': interpolationV,
        'ɵelementClassProp': elementClassProp,
        'ɵlistener': listener,
        'ɵload': load,
        'ɵprojection': projection,
        'ɵelementProperty': elementProperty,
        'ɵpipeBind1': pipeBind1,
        'ɵpipeBind2': pipeBind2,
        'ɵpipeBind3': pipeBind3,
        'ɵpipeBind4': pipeBind4,
        'ɵpipeBindV': pipeBindV,
        'ɵprojectionDef': projectionDef,
        'ɵpipe': pipe,
        'ɵquery': query,
        'ɵqueryRefresh': queryRefresh,
        'ɵregisterContentQuery': registerContentQuery,
        'ɵreference': reference,
        'ɵelementStyling': elementStyling,
        'ɵelementStylingMap': elementStylingMap,
        'ɵelementStyleProp': elementStyleProp,
        'ɵelementStylingApply': elementStylingApply,
        'ɵtemplate': template,
        'ɵtext': text,
        'ɵtextBinding': textBinding,
        'ɵembeddedViewStart': embeddedViewStart,
        'ɵembeddedViewEnd': embeddedViewEnd,
        'ɵi18nAttribute': i18nAttribute,
        'ɵi18nExp': i18nExp,
        'ɵi18nStart': i18nStart,
        'ɵi18nEnd': i18nEnd,
        'ɵi18nApply': i18nApply,
        'ɵsanitizeHtml': sanitizeHtml,
        'ɵsanitizeStyle': sanitizeStyle,
        'ɵdefaultStyleSanitizer': defaultStyleSanitizer,
        'ɵsanitizeResourceUrl': sanitizeResourceUrl,
        'ɵsanitizeScript': sanitizeScript,
        'ɵsanitizeUrl': sanitizeUrl
    };

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var _reflect = null;
    function getReflect() {
        return (_reflect = _reflect || new ReflectionCapabilities());
    }
    function reflectDependencies(type) {
        return convertDependencies(getReflect().parameters(type));
    }
    function convertDependencies(deps) {
        var compiler = getCompilerFacade();
        return deps.map(function (dep) { return reflectDependency(compiler, dep); });
    }
    function reflectDependency(compiler, dep) {
        var meta = {
            token: null,
            host: false,
            optional: false,
            resolved: compiler.R3ResolvedDependencyType.Token,
            self: false,
            skipSelf: false,
        };
        function setTokenAndResolvedType(token) {
            meta.resolved = compiler.R3ResolvedDependencyType.Token;
            meta.token = token;
        }
        if (Array.isArray(dep)) {
            if (dep.length === 0) {
                throw new Error('Dependency array must have arguments.');
            }
            for (var j = 0; j < dep.length; j++) {
                var param = dep[j];
                if (param instanceof Optional || param.__proto__.ngMetadataName === 'Optional') {
                    meta.optional = true;
                }
                else if (param instanceof SkipSelf || param.__proto__.ngMetadataName === 'SkipSelf') {
                    meta.skipSelf = true;
                }
                else if (param instanceof Self || param.__proto__.ngMetadataName === 'Self') {
                    meta.self = true;
                }
                else if (param instanceof Host || param.__proto__.ngMetadataName === 'Host') {
                    meta.host = true;
                }
                else if (param instanceof Inject) {
                    meta.token = param.token;
                }
                else if (param instanceof Attribute) {
                    if (param.attributeName === undefined) {
                        throw new Error("Attribute name must be defined.");
                    }
                    meta.token = param.attributeName;
                    meta.resolved = compiler.R3ResolvedDependencyType.Attribute;
                }
                else {
                    setTokenAndResolvedType(param);
                }
            }
        }
        else {
            setTokenAndResolvedType(dep);
        }
        return meta;
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var EMPTY_ARRAY$2 = [];
    /**
     * Compiles a module in JIT mode.
     *
     * This function automatically gets called when a class has a `@NgModule` decorator.
     */
    function compileNgModule(moduleType, ngModule) {
        compileNgModuleDefs(moduleType, ngModule);
        setScopeOnDeclaredComponents(moduleType, ngModule);
    }
    /**
     * Compiles and adds the `ngModuleDef` and `ngInjectorDef` properties to the module class.
     */
    function compileNgModuleDefs(moduleType, ngModule) {
        var declarations = flatten$1(ngModule.declarations || EMPTY_ARRAY$2);
        var ngModuleDef = null;
        Object.defineProperty(moduleType, NG_MODULE_DEF, {
            configurable: true,
            get: function () {
                if (ngModuleDef === null) {
                    ngModuleDef = getCompilerFacade().compileNgModule(angularCoreEnv, "ng://" + moduleType.name + "/ngModuleDef.js", {
                        type: moduleType,
                        bootstrap: flatten$1(ngModule.bootstrap || EMPTY_ARRAY$2),
                        declarations: declarations,
                        imports: flatten$1(ngModule.imports || EMPTY_ARRAY$2).map(expandModuleWithProviders),
                        exports: flatten$1(ngModule.exports || EMPTY_ARRAY$2).map(expandModuleWithProviders),
                        emitInline: true,
                    });
                }
                return ngModuleDef;
            }
        });
        var ngInjectorDef = null;
        Object.defineProperty(moduleType, NG_INJECTOR_DEF, {
            get: function () {
                if (ngInjectorDef === null) {
                    var meta = {
                        name: moduleType.name,
                        type: moduleType,
                        deps: reflectDependencies(moduleType),
                        providers: ngModule.providers || EMPTY_ARRAY$2,
                        imports: [
                            ngModule.imports || EMPTY_ARRAY$2,
                            ngModule.exports || EMPTY_ARRAY$2,
                        ],
                    };
                    ngInjectorDef = getCompilerFacade().compileInjector(angularCoreEnv, "ng://" + moduleType.name + "/ngInjectorDef.js", meta);
                }
                return ngInjectorDef;
            },
            // Make the property configurable in dev mode to allow overriding in tests
            configurable: !!ngDevMode,
        });
    }
    /**
     * Some declared components may be compiled asynchronously, and thus may not have their
     * ngComponentDef set yet. If this is the case, then a reference to the module is written into
     * the `ngSelectorScope` property of the declared type.
     */
    function setScopeOnDeclaredComponents(moduleType, ngModule) {
        var declarations = flatten$1(ngModule.declarations || EMPTY_ARRAY$2);
        var transitiveScopes = transitiveScopesFor(moduleType);
        declarations.forEach(function (declaration) {
            if (declaration.hasOwnProperty(NG_COMPONENT_DEF)) {
                // An `ngComponentDef` field exists - go ahead and patch the component directly.
                var component = declaration;
                var componentDef = getComponentDef(component);
                patchComponentDefWithScope(componentDef, transitiveScopes);
            }
            else if (!declaration.hasOwnProperty(NG_DIRECTIVE_DEF) && !declaration.hasOwnProperty(NG_PIPE_DEF)) {
                // Set `ngSelectorScope` for future reference when the component compilation finishes.
                declaration.ngSelectorScope = moduleType;
            }
        });
    }
    /**
     * Patch the definition of a component with directives and pipes from the compilation scope of
     * a given module.
     */
    function patchComponentDefWithScope(componentDef, transitiveScopes) {
        componentDef.directiveDefs = function () { return Array.from(transitiveScopes.compilation.directives)
            .map(function (dir) { return getDirectiveDef(dir) || getComponentDef(dir); })
            .filter(function (def) { return !!def; }); };
        componentDef.pipeDefs = function () {
            return Array.from(transitiveScopes.compilation.pipes).map(function (pipe) { return getPipeDef(pipe); });
        };
    }
    /**
     * Compute the pair of transitive scopes (compilation scope and exported scope) for a given module.
     *
     * This operation is memoized and the result is cached on the module's definition. It can be called
     * on modules with components that have not fully compiled yet, but the result should not be used
     * until they have.
     */
    function transitiveScopesFor(moduleType) {
        if (!isNgModule(moduleType)) {
            throw new Error(moduleType.name + " does not have an ngModuleDef");
        }
        var def = getNgModuleDef(moduleType);
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
            if (getPipeDef(declaredWithDefs)) {
                scopes.compilation.pipes.add(declared);
            }
            else {
                // Either declared has an ngComponentDef or ngDirectiveDef, or it's a component which hasn't
                // had its template compiled yet. In either case, it gets added to the compilation's
                // directives.
                scopes.compilation.directives.add(declared);
            }
        });
        def.imports.forEach(function (imported) {
            var importedTyped = imported;
            if (!isNgModule(importedTyped)) {
                throw new Error("Importing " + importedTyped.name + " which does not have an ngModuleDef");
            }
            // When this module imports another, the imported module's exported directives and pipes are
            // added to the compilation scope of this module.
            var importedScope = transitiveScopesFor(importedTyped);
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
                var exportedScope = transitiveScopesFor(exportedTyped);
                exportedScope.exported.directives.forEach(function (entry) {
                    scopes.compilation.directives.add(entry);
                    scopes.exported.directives.add(entry);
                });
                exportedScope.exported.pipes.forEach(function (entry) {
                    scopes.compilation.pipes.add(entry);
                    scopes.exported.pipes.add(entry);
                });
            }
            else if (getNgModuleDef(exportedTyped)) {
                scopes.exported.pipes.add(exportedTyped);
            }
            else {
                scopes.exported.directives.add(exportedTyped);
            }
        });
        def.transitiveCompileScopes = scopes;
        return scopes;
    }
    function flatten$1(values) {
        var out = [];
        values.forEach(function (value) {
            if (Array.isArray(value)) {
                out.push.apply(out, __spread(flatten$1(value)));
            }
            else {
                out.push(value);
            }
        });
        return out;
    }
    function expandModuleWithProviders(value) {
        if (isModuleWithProviders(value)) {
            return value.ngModule;
        }
        return value;
    }
    function isModuleWithProviders(value) {
        return value.ngModule !== undefined;
    }
    function isNgModule(value) {
        return !!getNgModuleDef(value);
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Compile an Angular component according to its decorator metadata, and patch the resulting
     * ngComponentDef onto the component type.
     *
     * Compilation may be asynchronous (due to the need to resolve URLs for the component template or
     * other resources, for example). In the event that compilation is not immediate, `compileComponent`
     * will enqueue resource resolution into a global queue and will fail to return the `ngComponentDef`
     * until the global queue has been resolved with a call to `resolveComponentResources`.
     */
    function compileComponent(type, metadata) {
        var ngComponentDef = null;
        // Metadata may have resources which need to be resolved.
        maybeQueueResolutionOfComponentResources(metadata);
        Object.defineProperty(type, NG_COMPONENT_DEF, {
            get: function () {
                var compiler = getCompilerFacade();
                if (ngComponentDef === null) {
                    if (componentNeedsResolution(metadata)) {
                        var error = ["Component '" + stringify(type) + "' is not resolved:"];
                        if (metadata.templateUrl) {
                            error.push(" - templateUrl: " + stringify(metadata.templateUrl));
                        }
                        if (metadata.styleUrls && metadata.styleUrls.length) {
                            error.push(" - styleUrls: " + JSON.stringify(metadata.styleUrls));
                        }
                        error.push("Did you run and wait for 'resolveComponentResources()'?");
                        throw new Error(error.join('\n'));
                    }
                    var meta = __assign({}, directiveMetadata(type, metadata), { template: metadata.template || '', preserveWhitespaces: metadata.preserveWhitespaces || false, styles: metadata.styles || EMPTY_ARRAY, animations: metadata.animations, viewQueries: extractQueriesMetadata(getReflect().propMetadata(type), isViewQuery), directives: new Map(), pipes: new Map(), encapsulation: metadata.encapsulation || exports.ViewEncapsulation.Emulated, viewProviders: metadata.viewProviders || null });
                    ngComponentDef = compiler.compileComponent(angularCoreEnv, "ng://" + stringify(type) + "/template.html", meta);
                    // If component compilation is async, then the @NgModule annotation which declares the
                    // component may execute and set an ngSelectorScope property on the component type. This
                    // allows the component to patch itself with directiveDefs from the module after it
                    // finishes compiling.
                    if (hasSelectorScope(type)) {
                        var scopes = transitiveScopesFor(type.ngSelectorScope);
                        patchComponentDefWithScope(ngComponentDef, scopes);
                    }
                }
                return ngComponentDef;
            },
            // Make the property configurable in dev mode to allow overriding in tests
            configurable: !!ngDevMode,
        });
    }
    function hasSelectorScope(component) {
        return component.ngSelectorScope !== undefined;
    }
    /**
     * Compile an Angular directive according to its decorator metadata, and patch the resulting
     * ngDirectiveDef onto the component type.
     *
     * In the event that compilation is not immediate, `compileDirective` will return a `Promise` which
     * will resolve when compilation completes and the directive becomes usable.
     */
    function compileDirective(type, directive) {
        var ngDirectiveDef = null;
        Object.defineProperty(type, NG_DIRECTIVE_DEF, {
            get: function () {
                if (ngDirectiveDef === null) {
                    var facade = directiveMetadata(type, directive);
                    ngDirectiveDef = getCompilerFacade().compileDirective(angularCoreEnv, "ng://" + (type && type.name) + "/ngDirectiveDef.js", facade);
                }
                return ngDirectiveDef;
            },
            // Make the property configurable in dev mode to allow overriding in tests
            configurable: !!ngDevMode,
        });
    }
    function extendsDirectlyFromObject(type) {
        return Object.getPrototypeOf(type.prototype) === Object.prototype;
    }
    /**
     * Extract the `R3DirectiveMetadata` for a particular directive (either a `Directive` or a
     * `Component`).
     */
    function directiveMetadata(type, metadata) {
        // Reflect inputs and outputs.
        var propMetadata = getReflect().propMetadata(type);
        return {
            name: type.name,
            type: type,
            typeArgumentCount: 0,
            selector: metadata.selector,
            deps: reflectDependencies(type),
            host: metadata.host || EMPTY_OBJ$1,
            propMetadata: propMetadata,
            inputs: metadata.inputs || EMPTY_ARRAY,
            outputs: metadata.outputs || EMPTY_ARRAY,
            queries: extractQueriesMetadata(propMetadata, isContentQuery),
            lifecycle: {
                usesOnChanges: type.prototype.ngOnChanges !== undefined,
            },
            typeSourceSpan: null,
            usesInheritance: !extendsDirectlyFromObject(type),
            exportAs: metadata.exportAs || null,
            providers: metadata.providers || null,
        };
    }
    var EMPTY_OBJ$1 = {};
    function convertToR3QueryPredicate(selector) {
        return typeof selector === 'string' ? splitByComma(selector) : selector;
    }
    function convertToR3QueryMetadata(propertyName, ann) {
        return {
            propertyName: propertyName,
            predicate: convertToR3QueryPredicate(ann.selector),
            descendants: ann.descendants,
            first: ann.first,
            read: ann.read ? ann.read : null
        };
    }
    function extractQueriesMetadata(propMetadata, isQueryAnn) {
        var queriesMeta = [];
        var _loop_1 = function (field) {
            if (propMetadata.hasOwnProperty(field)) {
                propMetadata[field].forEach(function (ann) {
                    if (isQueryAnn(ann)) {
                        queriesMeta.push(convertToR3QueryMetadata(field, ann));
                    }
                });
            }
        };
        for (var field in propMetadata) {
            _loop_1(field);
        }
        return queriesMeta;
    }
    function isContentQuery(value) {
        var name = value.ngMetadataName;
        return name === 'ContentChild' || name === 'ContentChildren';
    }
    function isViewQuery(value) {
        var name = value.ngMetadataName;
        return name === 'ViewChild' || name === 'ViewChildren';
    }
    function splitByComma(value) {
        return value.split(',').map(function (piece) { return piece.trim(); });
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Compile an Angular injectable according to its `Injectable` metadata, and patch the resulting
     * `ngInjectableDef` onto the injectable type.
     */
    function compileInjectable(type, srcMeta) {
        var def = null;
        Object.defineProperty(type, NG_INJECTABLE_DEF, {
            get: function () {
                if (def === null) {
                    var meta_1 = srcMeta || { providedIn: null };
                    var hasAProvider = isUseClassProvider(meta_1) || isUseFactoryProvider(meta_1) ||
                        isUseValueProvider(meta_1) || isUseExistingProvider(meta_1);
                    var compilerMeta = {
                        name: type.name,
                        type: type,
                        providedIn: meta_1.providedIn,
                        ctorDeps: reflectDependencies(type),
                        userDeps: undefined
                    };
                    if ((isUseClassProvider(meta_1) || isUseFactoryProvider(meta_1)) && meta_1.deps !== undefined) {
                        compilerMeta.userDeps = convertDependencies(meta_1.deps);
                    }
                    if (!hasAProvider) {
                        // In the case the user specifies a type provider, treat it as {provide: X, useClass: X}.
                        // The deps will have been reflected above, causing the factory to create the class by
                        // calling
                        // its constructor with injected deps.
                        compilerMeta.useClass = type;
                    }
                    else if (isUseClassProvider(meta_1)) {
                        // The user explicitly specified useClass, and may or may not have provided deps.
                        compilerMeta.useClass = meta_1.useClass;
                    }
                    else if (isUseValueProvider(meta_1)) {
                        // The user explicitly specified useValue.
                        compilerMeta.useValue = meta_1.useValue;
                    }
                    else if (isUseFactoryProvider(meta_1)) {
                        // The user explicitly specified useFactory.
                        compilerMeta.useFactory = meta_1.useFactory;
                    }
                    else if (isUseExistingProvider(meta_1)) {
                        // The user explicitly specified useExisting.
                        compilerMeta.useExisting = meta_1.useExisting;
                    }
                    else {
                        // Can't happen - either hasAProvider will be false, or one of the providers will be set.
                        throw new Error("Unreachable state.");
                    }
                    def = getCompilerFacade().compileInjectable(angularCoreEnv, "ng://" + type.name + "/ngInjectableDef.js", compilerMeta);
                }
                return def;
            },
        });
    }
    var ɵ0$1 = getClosureSafeProperty;
    var USE_VALUE$1 = getClosureSafeProperty({ provide: String, useValue: ɵ0$1 });
    function isUseClassProvider(meta) {
        return meta.useClass !== undefined;
    }
    function isUseValueProvider(meta) {
        return USE_VALUE$1 in meta;
    }
    function isUseFactoryProvider(meta) {
        return meta.useFactory !== undefined;
    }
    function isUseExistingProvider(meta) {
        return meta.useExisting !== undefined;
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    function compilePipe(type, meta) {
        var ngPipeDef = null;
        Object.defineProperty(type, NG_PIPE_DEF, {
            get: function () {
                if (ngPipeDef === null) {
                    ngPipeDef = getCompilerFacade().compilePipe(angularCoreEnv, "ng://" + stringify$1(type) + "/ngPipeDef.js", {
                        type: type,
                        name: type.name,
                        deps: reflectDependencies(type),
                        pipeName: meta.name,
                        pure: meta.pure !== undefined ? meta.pure : true
                    });
                }
                return ngPipeDef;
            },
            // Make the property configurable in dev mode to allow overriding in tests
            configurable: !!ngDevMode,
        });
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var ivyEnabled = true;
    var R3_COMPILE_COMPONENT = compileComponent;
    var R3_COMPILE_DIRECTIVE = compileDirective;
    var R3_COMPILE_INJECTABLE = compileInjectable;
    var R3_COMPILE_NGMODULE = compileNgModule;
    var R3_COMPILE_PIPE = compilePipe;
    var R3_COMPILE_NGMODULE_DEFS = compileNgModuleDefs;
    var R3_PATCH_COMPONENT_DEF_WTIH_SCOPE = patchComponentDefWithScope;

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    function noop() { }
    var R3_COMPILE_COMPONENT__POST_NGCC__ = R3_COMPILE_COMPONENT;
    var R3_COMPILE_DIRECTIVE__POST_NGCC__ = R3_COMPILE_DIRECTIVE;
    var R3_COMPILE_INJECTABLE__POST_NGCC__ = R3_COMPILE_INJECTABLE;
    var R3_COMPILE_NGMODULE__POST_NGCC__ = R3_COMPILE_NGMODULE;
    var R3_COMPILE_PIPE__POST_NGCC__ = R3_COMPILE_PIPE;
    var ivyEnable__POST_NGCC__ = ivyEnabled;
    var R3_COMPILE_COMPONENT__PRE_NGCC__ = noop;
    var R3_COMPILE_DIRECTIVE__PRE_NGCC__ = noop;
    var R3_COMPILE_INJECTABLE__PRE_NGCC__ = preR3InjectableCompile;
    var R3_COMPILE_NGMODULE__PRE_NGCC__ = preR3NgModuleCompile;
    var R3_COMPILE_PIPE__PRE_NGCC__ = noop;
    var ivyEnable__PRE_NGCC__ = false;
    var ivyEnabled$1 = ivyEnable__PRE_NGCC__;
    var R3_COMPILE_COMPONENT$1 = R3_COMPILE_COMPONENT__PRE_NGCC__;
    var R3_COMPILE_DIRECTIVE$1 = R3_COMPILE_DIRECTIVE__PRE_NGCC__;
    var R3_COMPILE_INJECTABLE$1 = R3_COMPILE_INJECTABLE__PRE_NGCC__;
    var R3_COMPILE_NGMODULE$1 = R3_COMPILE_NGMODULE__PRE_NGCC__;
    var R3_COMPILE_PIPE$1 = R3_COMPILE_PIPE__PRE_NGCC__;
    ////////////////////////////////////////////////////////////
    // Glue code which should be removed after Ivy is default //
    ////////////////////////////////////////////////////////////
    function preR3NgModuleCompile(moduleType, metadata) {
        var imports = (metadata && metadata.imports) || [];
        if (metadata && metadata.exports) {
            imports = __spread(imports, [metadata.exports]);
        }
        moduleType.ngInjectorDef = defineInjector({
            factory: convertInjectableProviderToFactory(moduleType, { useClass: moduleType }),
            providers: metadata && metadata.providers,
            imports: imports,
        });
    }
    var ɵ0$2 = getClosureSafeProperty;
    var USE_VALUE$2 = getClosureSafeProperty({ provide: String, useValue: ɵ0$2 });
    var EMPTY_ARRAY$3 = [];
    function convertInjectableProviderToFactory(type, provider) {
        if (!provider) {
            var reflectionCapabilities = new ReflectionCapabilities();
            var deps_1 = reflectionCapabilities.parameters(type);
            // TODO - convert to flags.
            return function () { return new (type.bind.apply(type, __spread([void 0], injectArgs(deps_1))))(); };
        }
        if (USE_VALUE$2 in provider) {
            var valueProvider_1 = provider;
            return function () { return valueProvider_1.useValue; };
        }
        else if (provider.useExisting) {
            var existingProvider_1 = provider;
            return function () { return inject(existingProvider_1.useExisting); };
        }
        else if (provider.useFactory) {
            var factoryProvider_1 = provider;
            return function () { return factoryProvider_1.useFactory.apply(factoryProvider_1, __spread(injectArgs(factoryProvider_1.deps || EMPTY_ARRAY$3))); };
        }
        else if (provider.useClass) {
            var classProvider_1 = provider;
            var deps_2 = provider.deps;
            if (!deps_2) {
                var reflectionCapabilities = new ReflectionCapabilities();
                deps_2 = reflectionCapabilities.parameters(type);
            }
            return function () {
                var _a;
                return new ((_a = classProvider_1.useClass).bind.apply(_a, __spread([void 0], injectArgs(deps_2))))();
            };
        }
        else {
            var deps_3 = provider.deps;
            if (!deps_3) {
                var reflectionCapabilities = new ReflectionCapabilities();
                deps_3 = reflectionCapabilities.parameters(type);
            }
            return function () { return new (type.bind.apply(type, __spread([void 0], injectArgs(deps_3))))(); };
        }
    }
    /**
     * Supports @Injectable() in JIT mode for Render2.
     */
    function preR3InjectableCompile(injectableType, options) {
        if (options && options.providedIn !== undefined && !getInjectableDef(injectableType)) {
            injectableType.ngInjectableDef = defineInjectable({
                providedIn: options.providedIn,
                factory: convertInjectableProviderToFactory(injectableType, options),
            });
        }
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Type of the Directive metadata.
     *
     * @publicApi
     */
    var Directive = makeDecorator('Directive', function (dir) {
        if (dir === void 0) { dir = {}; }
        return dir;
    }, undefined, undefined, function (type, meta) { return R3_COMPILE_DIRECTIVE$1(type, meta); });
    /**
     * Component decorator and metadata.
     *
     * @Annotation
     * @publicApi
     */
    var Component = makeDecorator('Component', function (c) {
        if (c === void 0) { c = {}; }
        return (__assign({ changeDetection: exports.ChangeDetectionStrategy.Default }, c));
    }, Directive, undefined, function (type, meta) { return R3_COMPILE_COMPONENT$1(type, meta); });
    /**
     * @Annotation
     * @publicApi
     */
    var Pipe = makeDecorator('Pipe', function (p) { return (__assign({ pure: true }, p)); }, undefined, undefined, function (type, meta) { return R3_COMPILE_PIPE$1(type, meta); });
    var initializeBaseDef = function (target) {
        var constructor = target.constructor;
        var inheritedBaseDef = constructor.ngBaseDef;
        var baseDef = constructor.ngBaseDef = {
            inputs: {},
            outputs: {},
            declaredInputs: {},
        };
        if (inheritedBaseDef) {
            fillProperties(baseDef.inputs, inheritedBaseDef.inputs);
            fillProperties(baseDef.outputs, inheritedBaseDef.outputs);
            fillProperties(baseDef.declaredInputs, inheritedBaseDef.declaredInputs);
        }
    };
    /**
     * Does the work of creating the `ngBaseDef` property for the @Input and @Output decorators.
     * @param key "inputs" or "outputs"
     */
    var updateBaseDefFromIOProp = function (getProp) {
        return function (target, name) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            var constructor = target.constructor;
            if (!constructor.hasOwnProperty(NG_BASE_DEF)) {
                initializeBaseDef(target);
            }
            var baseDef = constructor.ngBaseDef;
            var defProp = getProp(baseDef);
            defProp[name] = args[0];
        };
    };
    /**
     * @Annotation
     * @publicApi
     */
    var Input = makePropDecorator('Input', function (bindingPropertyName) { return ({ bindingPropertyName: bindingPropertyName }); }, undefined, updateBaseDefFromIOProp(function (baseDef) { return baseDef.inputs || {}; }));
    /**
     * @Annotation
     * @publicApi
     */
    var Output = makePropDecorator('Output', function (bindingPropertyName) { return ({ bindingPropertyName: bindingPropertyName }); }, undefined, updateBaseDefFromIOProp(function (baseDef) { return baseDef.outputs || {}; }));
    /**
     * @Annotation
     * @publicApi
     */
    var HostBinding = makePropDecorator('HostBinding', function (hostPropertyName) { return ({ hostPropertyName: hostPropertyName }); });
    /**
     * Binds a CSS event to a host listener and supplies configuration metadata.
     * Angular invokes the supplied handler method when the host element emits the specified event,
     * and updates the bound element with the result.
     * If the handler method returns false, applies `preventDefault` on the bound element.
     *
     * @usageNotes
     *
     * The following example declares a directive
     * that attaches a click listener to a button and counts clicks.
     *
     * ```
     * @Directive({selector: 'button[counting]'})
     * class CountClicks {
     *   numberOfClicks = 0;
     *
     *   @HostListener('click', ['$event.target'])
     *   onClick(btn) {
     *     console.log('button', btn, 'number of clicks:', this.numberOfClicks++);
     *  }
     * }
     *
     * @Component({
     *   selector: 'app',
     *   template: '<button counting>Increment</button>',
     * })
     * class App {}
     * ```
     *
     * @Annotation
     * @publicApi
     */
    var HostListener = makePropDecorator('HostListener', function (eventName, args) { return ({ eventName: eventName, args: args }); });

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Defines a schema that allows an NgModule to contain the following:
     * - Non-Angular elements named with dash case (`-`).
     * - Element properties named with dash case (`-`).
     * Dash case is the naming convention for custom elements.
     *
     * @publicApi
     */
    var CUSTOM_ELEMENTS_SCHEMA = {
        name: 'custom-elements'
    };
    /**
     * Defines a schema that allows any property on any element.
     *
     * @publicApi
     */
    var NO_ERRORS_SCHEMA = {
        name: 'no-errors-schema'
    };
    /**
     * @Annotation
     * @publicApi
     */
    var NgModule = makeDecorator('NgModule', function (ngModule) { return ngModule; }, undefined, undefined, 
    /**
     * Decorator that marks the following class as an NgModule, and supplies
     * configuration metadata for it.
     *
     * * The `declarations` and `entryComponents` options configure the compiler
     * with information about what belongs to the NgModule.
     * * The `providers` options configures the NgModule's injector to provide
     * dependencies the NgModule members.
     * * The `imports` and `exports` options bring in members from other modules, and make
     * this module's members available to others.
     */
    function (type, meta) { return R3_COMPILE_NGMODULE$1(type, meta); });

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
     * @description Represents the version of Angular
     *
     * @publicApi
     */
    var Version = /** @class */ (function () {
        function Version(full) {
            this.full = full;
            this.major = full.split('.')[0];
            this.minor = full.split('.')[1];
            this.patch = full.split('.').slice(2).join('.');
        }
        return Version;
    }());
    /**
     * @publicApi
     */
    var VERSION = new Version('7.0.4');

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Injectable decorator and metadata.
     *
     * @Annotation
     * @publicApi
     */
    var Injectable = makeDecorator('Injectable', undefined, undefined, undefined, function (type, meta) { return R3_COMPILE_INJECTABLE$1(type, meta); });

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var ERROR_DEBUG_CONTEXT = 'ngDebugContext';
    var ERROR_ORIGINAL_ERROR = 'ngOriginalError';
    var ERROR_LOGGER = 'ngErrorLogger';
    function getDebugContext(error) {
        return error[ERROR_DEBUG_CONTEXT];
    }
    function getOriginalError(error) {
        return error[ERROR_ORIGINAL_ERROR];
    }
    function getErrorLogger(error) {
        return error[ERROR_LOGGER] || defaultErrorLogger;
    }
    function defaultErrorLogger(console) {
        var values = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            values[_i - 1] = arguments[_i];
        }
        console.error.apply(console, __spread(values));
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Provides a hook for centralized exception handling.
     *
     * The default implementation of `ErrorHandler` prints error messages to the `console`. To
     * intercept error handling, write a custom exception handler that replaces this default as
     * appropriate for your app.
     *
     * @usageNotes
     * ### Example
     *
     * ```
     * class MyErrorHandler implements ErrorHandler {
     *   handleError(error) {
     *     // do something with the exception
     *   }
     * }
     *
     * @NgModule({
     *   providers: [{provide: ErrorHandler, useClass: MyErrorHandler}]
     * })
     * class MyModule {}
     * ```
     *
     * @publicApi
     */
    var ErrorHandler = /** @class */ (function () {
        function ErrorHandler() {
            /**
             * @internal
             */
            this._console = console;
        }
        ErrorHandler.prototype.handleError = function (error) {
            var originalError = this._findOriginalError(error);
            var context = this._findContext(error);
            // Note: Browser consoles show the place from where console.error was called.
            // We can use this to give users additional information about the error.
            var errorLogger = getErrorLogger(error);
            errorLogger(this._console, "ERROR", error);
            if (originalError) {
                errorLogger(this._console, "ORIGINAL ERROR", originalError);
            }
            if (context) {
                errorLogger(this._console, 'ERROR CONTEXT', context);
            }
        };
        /** @internal */
        ErrorHandler.prototype._findContext = function (error) {
            if (error) {
                return getDebugContext(error) ? getDebugContext(error) :
                    this._findContext(getOriginalError(error));
            }
            return null;
        };
        /** @internal */
        ErrorHandler.prototype._findOriginalError = function (error) {
            var e = getOriginalError(error);
            while (e && getOriginalError(e)) {
                e = getOriginalError(e);
            }
            return e;
        };
        return ErrorHandler;
    }());
    function wrappedError(message, originalError) {
        var msg = message + " caused by: " + (originalError instanceof Error ? originalError.message : originalError);
        var error = Error(msg);
        error[ERROR_ORIGINAL_ERROR] = originalError;
        return error;
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    function findFirstClosedCycle(keys) {
        var res = [];
        for (var i = 0; i < keys.length; ++i) {
            if (res.indexOf(keys[i]) > -1) {
                res.push(keys[i]);
                return res;
            }
            res.push(keys[i]);
        }
        return res;
    }
    function constructResolvingPath(keys) {
        if (keys.length > 1) {
            var reversed = findFirstClosedCycle(keys.slice().reverse());
            var tokenStrs = reversed.map(function (k) { return stringify(k.token); });
            return ' (' + tokenStrs.join(' -> ') + ')';
        }
        return '';
    }
    function injectionError(injector, key, constructResolvingMessage, originalError) {
        var keys = [key];
        var errMsg = constructResolvingMessage(keys);
        var error = (originalError ? wrappedError(errMsg, originalError) : Error(errMsg));
        error.addKey = addKey;
        error.keys = keys;
        error.injectors = [injector];
        error.constructResolvingMessage = constructResolvingMessage;
        error[ERROR_ORIGINAL_ERROR] = originalError;
        return error;
    }
    function addKey(injector, key) {
        this.injectors.push(injector);
        this.keys.push(key);
        // Note: This updated message won't be reflected in the `.stack` property
        this.message = this.constructResolvingMessage(this.keys);
    }
    /**
     * Thrown when trying to retrieve a dependency by key from {@link Injector}, but the
     * {@link Injector} does not have a {@link Provider} for the given key.
     *
     * @usageNotes
     * ### Example
     *
     * ```typescript
     * class A {
     *   constructor(b:B) {}
     * }
     *
     * expect(() => Injector.resolveAndCreate([A])).toThrowError();
     * ```
     */
    function noProviderError(injector, key) {
        return injectionError(injector, key, function (keys) {
            var first = stringify(keys[0].token);
            return "No provider for " + first + "!" + constructResolvingPath(keys);
        });
    }
    /**
     * Thrown when dependencies form a cycle.
     *
     * @usageNotes
     * ### Example
     *
     * ```typescript
     * var injector = Injector.resolveAndCreate([
     *   {provide: "one", useFactory: (two) => "two", deps: [[new Inject("two")]]},
     *   {provide: "two", useFactory: (one) => "one", deps: [[new Inject("one")]]}
     * ]);
     *
     * expect(() => injector.get("one")).toThrowError();
     * ```
     *
     * Retrieving `A` or `B` throws a `CyclicDependencyError` as the graph above cannot be constructed.
     */
    function cyclicDependencyError(injector, key) {
        return injectionError(injector, key, function (keys) {
            return "Cannot instantiate cyclic dependency!" + constructResolvingPath(keys);
        });
    }
    /**
     * Thrown when a constructing type returns with an Error.
     *
     * The `InstantiationError` class contains the original error plus the dependency graph which caused
     * this object to be instantiated.
     *
     * @usageNotes
     * ### Example
     *
     * ```typescript
     * class A {
     *   constructor() {
     *     throw new Error('message');
     *   }
     * }
     *
     * var injector = Injector.resolveAndCreate([A]);

     * try {
     *   injector.get(A);
     * } catch (e) {
     *   expect(e instanceof InstantiationError).toBe(true);
     *   expect(e.originalException.message).toEqual("message");
     *   expect(e.originalStack).toBeDefined();
     * }
     * ```
     */
    function instantiationError(injector, originalException, originalStack, key) {
        return injectionError(injector, key, function (keys) {
            var first = stringify(keys[0].token);
            return originalException.message + ": Error during instantiation of " + first + "!" + constructResolvingPath(keys) + ".";
        }, originalException);
    }
    /**
     * Thrown when an object other then {@link Provider} (or `Type`) is passed to {@link Injector}
     * creation.
     *
     * @usageNotes
     * ### Example
     *
     * ```typescript
     * expect(() => Injector.resolveAndCreate(["not a type"])).toThrowError();
     * ```
     */
    function invalidProviderError(provider) {
        return Error("Invalid provider - only instances of Provider and Type are allowed, got: " + provider);
    }
    /**
     * Thrown when the class has no annotation information.
     *
     * Lack of annotation information prevents the {@link Injector} from determining which dependencies
     * need to be injected into the constructor.
     *
     * @usageNotes
     * ### Example
     *
     * ```typescript
     * class A {
     *   constructor(b) {}
     * }
     *
     * expect(() => Injector.resolveAndCreate([A])).toThrowError();
     * ```
     *
     * This error is also thrown when the class not marked with {@link Injectable} has parameter types.
     *
     * ```typescript
     * class B {}
     *
     * class A {
     *   constructor(b:B) {} // no information about the parameter types of A is available at runtime.
     * }
     *
     * expect(() => Injector.resolveAndCreate([A,B])).toThrowError();
     * ```
     *
     */
    function noAnnotationError(typeOrFunc, params) {
        var signature = [];
        for (var i = 0, ii = params.length; i < ii; i++) {
            var parameter = params[i];
            if (!parameter || parameter.length == 0) {
                signature.push('?');
            }
            else {
                signature.push(parameter.map(stringify).join(' '));
            }
        }
        return Error('Cannot resolve all parameters for \'' + stringify(typeOrFunc) + '\'(' +
            signature.join(', ') + '). ' +
            'Make sure that all the parameters are decorated with Inject or have valid type annotations and that \'' +
            stringify(typeOrFunc) + '\' is decorated with Injectable.');
    }
    /**
     * Thrown when getting an object by index.
     *
     * @usageNotes
     * ### Example
     *
     * ```typescript
     * class A {}
     *
     * var injector = Injector.resolveAndCreate([A]);
     *
     * expect(() => injector.getAt(100)).toThrowError();
     * ```
     *
     */
    function outOfBoundsError(index) {
        return Error("Index " + index + " is out-of-bounds.");
    }
    // TODO: add a working example after alpha38 is released
    /**
     * Thrown when a multi provider and a regular provider are bound to the same token.
     *
     * @usageNotes
     * ### Example
     *
     * ```typescript
     * expect(() => Injector.resolveAndCreate([
     *   { provide: "Strings", useValue: "string1", multi: true},
     *   { provide: "Strings", useValue: "string2", multi: false}
     * ])).toThrowError();
     * ```
     */
    function mixingMultiProvidersWithRegularProvidersError(provider1, provider2) {
        return Error("Cannot mix multi providers and regular providers, got: " + provider1 + " " + provider2);
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * A unique object used for retrieving items from the {@link ReflectiveInjector}.
     *
     * Keys have:
     * - a system-wide unique `id`.
     * - a `token`.
     *
     * `Key` is used internally by {@link ReflectiveInjector} because its system-wide unique `id` allows
     * the
     * injector to store created objects in a more efficient way.
     *
     * `Key` should not be created directly. {@link ReflectiveInjector} creates keys automatically when
     * resolving
     * providers.
     *
     * @deprecated No replacement
     * @publicApi
     */
    var ReflectiveKey = /** @class */ (function () {
        /**
         * Private
         */
        function ReflectiveKey(token, id) {
            this.token = token;
            this.id = id;
            if (!token) {
                throw new Error('Token must be defined!');
            }
            this.displayName = stringify(this.token);
        }
        /**
         * Retrieves a `Key` for a token.
         */
        ReflectiveKey.get = function (token) {
            return _globalKeyRegistry.get(resolveForwardRef(token));
        };
        Object.defineProperty(ReflectiveKey, "numberOfKeys", {
            /**
             * @returns the number of keys registered in the system.
             */
            get: function () { return _globalKeyRegistry.numberOfKeys; },
            enumerable: true,
            configurable: true
        });
        return ReflectiveKey;
    }());
    var KeyRegistry = /** @class */ (function () {
        function KeyRegistry() {
            this._allKeys = new Map();
        }
        KeyRegistry.prototype.get = function (token) {
            if (token instanceof ReflectiveKey)
                return token;
            if (this._allKeys.has(token)) {
                return this._allKeys.get(token);
            }
            var newKey = new ReflectiveKey(token, ReflectiveKey.numberOfKeys);
            this._allKeys.set(token, newKey);
            return newKey;
        };
        Object.defineProperty(KeyRegistry.prototype, "numberOfKeys", {
            get: function () { return this._allKeys.size; },
            enumerable: true,
            configurable: true
        });
        return KeyRegistry;
    }());
    var _globalKeyRegistry = new KeyRegistry();

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Provides access to reflection data about symbols. Used internally by Angular
     * to power dependency injection and compilation.
     */
    var Reflector = /** @class */ (function () {
        function Reflector(reflectionCapabilities) {
            this.reflectionCapabilities = reflectionCapabilities;
        }
        Reflector.prototype.updateCapabilities = function (caps) { this.reflectionCapabilities = caps; };
        Reflector.prototype.factory = function (type) { return this.reflectionCapabilities.factory(type); };
        Reflector.prototype.parameters = function (typeOrFunc) {
            return this.reflectionCapabilities.parameters(typeOrFunc);
        };
        Reflector.prototype.annotations = function (typeOrFunc) {
            return this.reflectionCapabilities.annotations(typeOrFunc);
        };
        Reflector.prototype.propMetadata = function (typeOrFunc) {
            return this.reflectionCapabilities.propMetadata(typeOrFunc);
        };
        Reflector.prototype.hasLifecycleHook = function (type, lcProperty) {
            return this.reflectionCapabilities.hasLifecycleHook(type, lcProperty);
        };
        Reflector.prototype.getter = function (name) { return this.reflectionCapabilities.getter(name); };
        Reflector.prototype.setter = function (name) { return this.reflectionCapabilities.setter(name); };
        Reflector.prototype.method = function (name) { return this.reflectionCapabilities.method(name); };
        Reflector.prototype.importUri = function (type) { return this.reflectionCapabilities.importUri(type); };
        Reflector.prototype.resourceUri = function (type) { return this.reflectionCapabilities.resourceUri(type); };
        Reflector.prototype.resolveIdentifier = function (name, moduleUrl, members, runtime) {
            return this.reflectionCapabilities.resolveIdentifier(name, moduleUrl, members, runtime);
        };
        Reflector.prototype.resolveEnum = function (identifier, name) {
            return this.reflectionCapabilities.resolveEnum(identifier, name);
        };
        return Reflector;
    }());

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * The {@link Reflector} used internally in Angular to access metadata
     * about symbols.
     */
    var reflector = new Reflector(new ReflectionCapabilities());

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * `Dependency` is used by the framework to extend DI.
     * This is internal to Angular and should not be used directly.
     */
    var ReflectiveDependency = /** @class */ (function () {
        function ReflectiveDependency(key, optional, visibility) {
            this.key = key;
            this.optional = optional;
            this.visibility = visibility;
        }
        ReflectiveDependency.fromKey = function (key) {
            return new ReflectiveDependency(key, false, null);
        };
        return ReflectiveDependency;
    }());
    var _EMPTY_LIST = [];
    var ResolvedReflectiveProvider_ = /** @class */ (function () {
        function ResolvedReflectiveProvider_(key, resolvedFactories, multiProvider) {
            this.key = key;
            this.resolvedFactories = resolvedFactories;
            this.multiProvider = multiProvider;
            this.resolvedFactory = this.resolvedFactories[0];
        }
        return ResolvedReflectiveProvider_;
    }());
    /**
     * An internal resolved representation of a factory function created by resolving `Provider`.
     * @publicApi
     */
    var ResolvedReflectiveFactory = /** @class */ (function () {
        function ResolvedReflectiveFactory(
        /**
         * Factory function which can return an instance of an object represented by a key.
         */
        factory, 
        /**
         * Arguments (dependencies) to the `factory` function.
         */
        dependencies) {
            this.factory = factory;
            this.dependencies = dependencies;
        }
        return ResolvedReflectiveFactory;
    }());
    /**
     * Resolve a single provider.
     */
    function resolveReflectiveFactory(provider) {
        var factoryFn;
        var resolvedDeps;
        if (provider.useClass) {
            var useClass = resolveForwardRef(provider.useClass);
            factoryFn = reflector.factory(useClass);
            resolvedDeps = _dependenciesFor(useClass);
        }
        else if (provider.useExisting) {
            factoryFn = function (aliasInstance) { return aliasInstance; };
            resolvedDeps = [ReflectiveDependency.fromKey(ReflectiveKey.get(provider.useExisting))];
        }
        else if (provider.useFactory) {
            factoryFn = provider.useFactory;
            resolvedDeps = constructDependencies(provider.useFactory, provider.deps);
        }
        else {
            factoryFn = function () { return provider.useValue; };
            resolvedDeps = _EMPTY_LIST;
        }
        return new ResolvedReflectiveFactory(factoryFn, resolvedDeps);
    }
    /**
     * Converts the `Provider` into `ResolvedProvider`.
     *
     * `Injector` internally only uses `ResolvedProvider`, `Provider` contains convenience provider
     * syntax.
     */
    function resolveReflectiveProvider(provider) {
        return new ResolvedReflectiveProvider_(ReflectiveKey.get(provider.provide), [resolveReflectiveFactory(provider)], provider.multi || false);
    }
    /**
     * Resolve a list of Providers.
     */
    function resolveReflectiveProviders(providers) {
        var normalized = _normalizeProviders(providers, []);
        var resolved = normalized.map(resolveReflectiveProvider);
        var resolvedProviderMap = mergeResolvedReflectiveProviders(resolved, new Map());
        return Array.from(resolvedProviderMap.values());
    }
    /**
     * Merges a list of ResolvedProviders into a list where each key is contained exactly once and
     * multi providers have been merged.
     */
    function mergeResolvedReflectiveProviders(providers, normalizedProvidersMap) {
        for (var i = 0; i < providers.length; i++) {
            var provider = providers[i];
            var existing = normalizedProvidersMap.get(provider.key.id);
            if (existing) {
                if (provider.multiProvider !== existing.multiProvider) {
                    throw mixingMultiProvidersWithRegularProvidersError(existing, provider);
                }
                if (provider.multiProvider) {
                    for (var j = 0; j < provider.resolvedFactories.length; j++) {
                        existing.resolvedFactories.push(provider.resolvedFactories[j]);
                    }
                }
                else {
                    normalizedProvidersMap.set(provider.key.id, provider);
                }
            }
            else {
                var resolvedProvider = void 0;
                if (provider.multiProvider) {
                    resolvedProvider = new ResolvedReflectiveProvider_(provider.key, provider.resolvedFactories.slice(), provider.multiProvider);
                }
                else {
                    resolvedProvider = provider;
                }
                normalizedProvidersMap.set(provider.key.id, resolvedProvider);
            }
        }
        return normalizedProvidersMap;
    }
    function _normalizeProviders(providers, res) {
        providers.forEach(function (b) {
            if (b instanceof Type) {
                res.push({ provide: b, useClass: b });
            }
            else if (b && typeof b == 'object' && b.provide !== undefined) {
                res.push(b);
            }
            else if (b instanceof Array) {
                _normalizeProviders(b, res);
            }
            else {
                throw invalidProviderError(b);
            }
        });
        return res;
    }
    function constructDependencies(typeOrFunc, dependencies) {
        if (!dependencies) {
            return _dependenciesFor(typeOrFunc);
        }
        else {
            var params_1 = dependencies.map(function (t) { return [t]; });
            return dependencies.map(function (t) { return _extractToken(typeOrFunc, t, params_1); });
        }
    }
    function _dependenciesFor(typeOrFunc) {
        var params = reflector.parameters(typeOrFunc);
        if (!params)
            return [];
        if (params.some(function (p) { return p == null; })) {
            throw noAnnotationError(typeOrFunc, params);
        }
        return params.map(function (p) { return _extractToken(typeOrFunc, p, params); });
    }
    function _extractToken(typeOrFunc, metadata, params) {
        var token = null;
        var optional = false;
        if (!Array.isArray(metadata)) {
            if (metadata instanceof Inject) {
                return _createDependency(metadata.token, optional, null);
            }
            else {
                return _createDependency(metadata, optional, null);
            }
        }
        var visibility = null;
        for (var i = 0; i < metadata.length; ++i) {
            var paramMetadata = metadata[i];
            if (paramMetadata instanceof Type) {
                token = paramMetadata;
            }
            else if (paramMetadata instanceof Inject) {
                token = paramMetadata.token;
            }
            else if (paramMetadata instanceof Optional) {
                optional = true;
            }
            else if (paramMetadata instanceof Self || paramMetadata instanceof SkipSelf) {
                visibility = paramMetadata;
            }
            else if (paramMetadata instanceof InjectionToken) {
                token = paramMetadata;
            }
        }
        token = resolveForwardRef(token);
        if (token != null) {
            return _createDependency(token, optional, visibility);
        }
        else {
            throw noAnnotationError(typeOrFunc, params);
        }
    }
    function _createDependency(token, optional, visibility) {
        return new ReflectiveDependency(ReflectiveKey.get(token), optional, visibility);
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    // Threshold for the dynamic version
    var UNDEFINED = new Object();
    /**
     * A ReflectiveDependency injection container used for instantiating objects and resolving
     * dependencies.
     *
     * An `Injector` is a replacement for a `new` operator, which can automatically resolve the
     * constructor dependencies.
     *
     * In typical use, application code asks for the dependencies in the constructor and they are
     * resolved by the `Injector`.
     *
     * @usageNotes
     * ### Example
     *
     * The following example creates an `Injector` configured to create `Engine` and `Car`.
     *
     * ```typescript
     * @Injectable()
     * class Engine {
     * }
     *
     * @Injectable()
     * class Car {
     *   constructor(public engine:Engine) {}
     * }
     *
     * var injector = ReflectiveInjector.resolveAndCreate([Car, Engine]);
     * var car = injector.get(Car);
     * expect(car instanceof Car).toBe(true);
     * expect(car.engine instanceof Engine).toBe(true);
     * ```
     *
     * Notice, we don't use the `new` operator because we explicitly want to have the `Injector`
     * resolve all of the object's dependencies automatically.
     *
     * @deprecated from v5 - slow and brings in a lot of code, Use `Injector.create` instead.
     * @publicApi
     */
    var ReflectiveInjector = /** @class */ (function () {
        function ReflectiveInjector() {
        }
        /**
         * Turns an array of provider definitions into an array of resolved providers.
         *
         * A resolution is a process of flattening multiple nested arrays and converting individual
         * providers into an array of `ResolvedReflectiveProvider`s.
         *
         * @usageNotes
         * ### Example
         *
         * ```typescript
         * @Injectable()
         * class Engine {
         * }
         *
         * @Injectable()
         * class Car {
         *   constructor(public engine:Engine) {}
         * }
         *
         * var providers = ReflectiveInjector.resolve([Car, [[Engine]]]);
         *
         * expect(providers.length).toEqual(2);
         *
         * expect(providers[0] instanceof ResolvedReflectiveProvider).toBe(true);
         * expect(providers[0].key.displayName).toBe("Car");
         * expect(providers[0].dependencies.length).toEqual(1);
         * expect(providers[0].factory).toBeDefined();
         *
         * expect(providers[1].key.displayName).toBe("Engine");
         * });
         * ```
         *
         */
        ReflectiveInjector.resolve = function (providers) {
            return resolveReflectiveProviders(providers);
        };
        /**
         * Resolves an array of providers and creates an injector from those providers.
         *
         * The passed-in providers can be an array of `Type`, `Provider`,
         * or a recursive array of more providers.
         *
         * @usageNotes
         * ### Example
         *
         * ```typescript
         * @Injectable()
         * class Engine {
         * }
         *
         * @Injectable()
         * class Car {
         *   constructor(public engine:Engine) {}
         * }
         *
         * var injector = ReflectiveInjector.resolveAndCreate([Car, Engine]);
         * expect(injector.get(Car) instanceof Car).toBe(true);
         * ```
         */
        ReflectiveInjector.resolveAndCreate = function (providers, parent) {
            var ResolvedReflectiveProviders = ReflectiveInjector.resolve(providers);
            return ReflectiveInjector.fromResolvedProviders(ResolvedReflectiveProviders, parent);
        };
        /**
         * Creates an injector from previously resolved providers.
         *
         * This API is the recommended way to construct injectors in performance-sensitive parts.
         *
         * @usageNotes
         * ### Example
         *
         * ```typescript
         * @Injectable()
         * class Engine {
         * }
         *
         * @Injectable()
         * class Car {
         *   constructor(public engine:Engine) {}
         * }
         *
         * var providers = ReflectiveInjector.resolve([Car, Engine]);
         * var injector = ReflectiveInjector.fromResolvedProviders(providers);
         * expect(injector.get(Car) instanceof Car).toBe(true);
         * ```
         */
        ReflectiveInjector.fromResolvedProviders = function (providers, parent) {
            return new ReflectiveInjector_(providers, parent);
        };
        return ReflectiveInjector;
    }());
    var ReflectiveInjector_ = /** @class */ (function () {
        /**
         * Private
         */
        function ReflectiveInjector_(_providers, _parent) {
            /** @internal */
            this._constructionCounter = 0;
            this._providers = _providers;
            this.parent = _parent || null;
            var len = _providers.length;
            this.keyIds = new Array(len);
            this.objs = new Array(len);
            for (var i = 0; i < len; i++) {
                this.keyIds[i] = _providers[i].key.id;
                this.objs[i] = UNDEFINED;
            }
        }
        ReflectiveInjector_.prototype.get = function (token, notFoundValue) {
            if (notFoundValue === void 0) { notFoundValue = THROW_IF_NOT_FOUND; }
            return this._getByKey(ReflectiveKey.get(token), null, notFoundValue);
        };
        ReflectiveInjector_.prototype.resolveAndCreateChild = function (providers) {
            var ResolvedReflectiveProviders = ReflectiveInjector.resolve(providers);
            return this.createChildFromResolved(ResolvedReflectiveProviders);
        };
        ReflectiveInjector_.prototype.createChildFromResolved = function (providers) {
            var inj = new ReflectiveInjector_(providers);
            inj.parent = this;
            return inj;
        };
        ReflectiveInjector_.prototype.resolveAndInstantiate = function (provider) {
            return this.instantiateResolved(ReflectiveInjector.resolve([provider])[0]);
        };
        ReflectiveInjector_.prototype.instantiateResolved = function (provider) {
            return this._instantiateProvider(provider);
        };
        ReflectiveInjector_.prototype.getProviderAtIndex = function (index) {
            if (index < 0 || index >= this._providers.length) {
                throw outOfBoundsError(index);
            }
            return this._providers[index];
        };
        /** @internal */
        ReflectiveInjector_.prototype._new = function (provider) {
            if (this._constructionCounter++ > this._getMaxNumberOfObjects()) {
                throw cyclicDependencyError(this, provider.key);
            }
            return this._instantiateProvider(provider);
        };
        ReflectiveInjector_.prototype._getMaxNumberOfObjects = function () { return this.objs.length; };
        ReflectiveInjector_.prototype._instantiateProvider = function (provider) {
            if (provider.multiProvider) {
                var res = new Array(provider.resolvedFactories.length);
                for (var i = 0; i < provider.resolvedFactories.length; ++i) {
                    res[i] = this._instantiate(provider, provider.resolvedFactories[i]);
                }
                return res;
            }
            else {
                return this._instantiate(provider, provider.resolvedFactories[0]);
            }
        };
        ReflectiveInjector_.prototype._instantiate = function (provider, ResolvedReflectiveFactory$$1) {
            var _this = this;
            var factory = ResolvedReflectiveFactory$$1.factory;
            var deps;
            try {
                deps =
                    ResolvedReflectiveFactory$$1.dependencies.map(function (dep) { return _this._getByReflectiveDependency(dep); });
            }
            catch (e) {
                if (e.addKey) {
                    e.addKey(this, provider.key);
                }
                throw e;
            }
            var obj;
            try {
                obj = factory.apply(void 0, __spread(deps));
            }
            catch (e) {
                throw instantiationError(this, e, e.stack, provider.key);
            }
            return obj;
        };
        ReflectiveInjector_.prototype._getByReflectiveDependency = function (dep) {
            return this._getByKey(dep.key, dep.visibility, dep.optional ? null : THROW_IF_NOT_FOUND);
        };
        ReflectiveInjector_.prototype._getByKey = function (key, visibility, notFoundValue) {
            if (key === ReflectiveInjector_.INJECTOR_KEY) {
                return this;
            }
            if (visibility instanceof Self) {
                return this._getByKeySelf(key, notFoundValue);
            }
            else {
                return this._getByKeyDefault(key, notFoundValue, visibility);
            }
        };
        ReflectiveInjector_.prototype._getObjByKeyId = function (keyId) {
            for (var i = 0; i < this.keyIds.length; i++) {
                if (this.keyIds[i] === keyId) {
                    if (this.objs[i] === UNDEFINED) {
                        this.objs[i] = this._new(this._providers[i]);
                    }
                    return this.objs[i];
                }
            }
            return UNDEFINED;
        };
        /** @internal */
        ReflectiveInjector_.prototype._throwOrNull = function (key, notFoundValue) {
            if (notFoundValue !== THROW_IF_NOT_FOUND) {
                return notFoundValue;
            }
            else {
                throw noProviderError(this, key);
            }
        };
        /** @internal */
        ReflectiveInjector_.prototype._getByKeySelf = function (key, notFoundValue) {
            var obj = this._getObjByKeyId(key.id);
            return (obj !== UNDEFINED) ? obj : this._throwOrNull(key, notFoundValue);
        };
        /** @internal */
        ReflectiveInjector_.prototype._getByKeyDefault = function (key, notFoundValue, visibility) {
            var inj;
            if (visibility instanceof SkipSelf) {
                inj = this.parent;
            }
            else {
                inj = this;
            }
            while (inj instanceof ReflectiveInjector_) {
                var inj_ = inj;
                var obj = inj_._getObjByKeyId(key.id);
                if (obj !== UNDEFINED)
                    return obj;
                inj = inj_.parent;
            }
            if (inj !== null) {
                return inj.get(key.token, notFoundValue);
            }
            else {
                return this._throwOrNull(key, notFoundValue);
            }
        };
        Object.defineProperty(ReflectiveInjector_.prototype, "displayName", {
            get: function () {
                var providers = _mapProviders(this, function (b) { return ' "' + b.key.displayName + '" '; })
                    .join(', ');
                return "ReflectiveInjector(providers: [" + providers + "])";
            },
            enumerable: true,
            configurable: true
        });
        ReflectiveInjector_.prototype.toString = function () { return this.displayName; };
        ReflectiveInjector_.INJECTOR_KEY = ReflectiveKey.get(Injector);
        return ReflectiveInjector_;
    }());
    function _mapProviders(injector, fn) {
        var res = new Array(injector._providers.length);
        for (var i = 0; i < injector._providers.length; ++i) {
            res[i] = fn(injector.getProviderAtIndex(i));
        }
        return res;
    }

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
     * Determine if the argument is shaped like a Promise
     */
    function isPromise(obj) {
        // allow any Promise/A+ compliant thenable.
        // It's up to the caller to ensure that obj.then conforms to the spec
        return !!obj && typeof obj.then === 'function';
    }
    /**
     * Determine if the argument is an Observable
     */
    function isObservable(obj) {
        // TODO: use isObservable once we update pass rxjs 6.1
        // https://github.com/ReactiveX/rxjs/blob/master/CHANGELOG.md#610-2018-05-03
        return !!obj && typeof obj.subscribe === 'function';
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * A function that will be executed when an application is initialized.
     *
     * @publicApi
     */
    var APP_INITIALIZER = new InjectionToken('Application Initializer');
    /**
     * A class that reflects the state of running {@link APP_INITIALIZER}s.
     *
     * @publicApi
     */
    var ApplicationInitStatus = /** @class */ (function () {
        function ApplicationInitStatus(appInits) {
            var _this = this;
            this.appInits = appInits;
            this.initialized = false;
            this.done = false;
            this.donePromise = new Promise(function (res, rej) {
                _this.resolve = res;
                _this.reject = rej;
            });
        }
        /** @internal */
        ApplicationInitStatus.prototype.runInitializers = function () {
            var _this = this;
            if (this.initialized) {
                return;
            }
            var asyncInitPromises = [];
            var complete = function () {
                _this.done = true;
                _this.resolve();
            };
            if (this.appInits) {
                for (var i = 0; i < this.appInits.length; i++) {
                    var initResult = this.appInits[i]();
                    if (isPromise(initResult)) {
                        asyncInitPromises.push(initResult);
                    }
                }
            }
            Promise.all(asyncInitPromises).then(function () { complete(); }).catch(function (e) { _this.reject(e); });
            if (asyncInitPromises.length === 0) {
                complete();
            }
            this.initialized = true;
        };
        ApplicationInitStatus = __decorate([
            Injectable(),
            __param(0, Inject(APP_INITIALIZER)), __param(0, Optional()),
            __metadata("design:paramtypes", [Array])
        ], ApplicationInitStatus);
        return ApplicationInitStatus;
    }());

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * A DI Token representing a unique string id assigned to the application by Angular and used
     * primarily for prefixing application attributes and CSS styles when
     * {@link ViewEncapsulation#Emulated ViewEncapsulation.Emulated} is being used.
     *
     * If you need to avoid randomly generated value to be used as an application id, you can provide
     * a custom value via a DI provider <!-- TODO: provider --> configuring the root {@link Injector}
     * using this token.
     * @publicApi
     */
    var APP_ID = new InjectionToken('AppId');
    function _appIdRandomProviderFactory() {
        return "" + _randomChar() + _randomChar() + _randomChar();
    }
    /**
     * Providers that will generate a random APP_ID_TOKEN.
     * @publicApi
     */
    var APP_ID_RANDOM_PROVIDER = {
        provide: APP_ID,
        useFactory: _appIdRandomProviderFactory,
        deps: [],
    };
    function _randomChar() {
        return String.fromCharCode(97 + Math.floor(Math.random() * 25));
    }
    /**
     * A function that will be executed when a platform is initialized.
     * @publicApi
     */
    var PLATFORM_INITIALIZER = new InjectionToken('Platform Initializer');
    /**
     * A token that indicates an opaque platform id.
     * @publicApi
     */
    var PLATFORM_ID = new InjectionToken('Platform ID');
    /**
     * All callbacks provided via this token will be called for every component that is bootstrapped.
     * Signature of the callback:
     *
     * `(componentRef: ComponentRef) => void`.
     *
     * @publicApi
     */
    var APP_BOOTSTRAP_LISTENER = new InjectionToken('appBootstrapListener');
    /**
     * A token which indicates the root directory of the application
     * @publicApi
     */
    var PACKAGE_ROOT_URL = new InjectionToken('Application Packages Root URL');

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var Console = /** @class */ (function () {
        function Console() {
        }
        Console.prototype.log = function (message) {
            // tslint:disable-next-line:no-console
            console.log(message);
        };
        // Note: for reporting errors use `DOM.logError()` as it is platform specific
        Console.prototype.warn = function (message) {
            // tslint:disable-next-line:no-console
            console.warn(message);
        };
        Console = __decorate([
            Injectable()
        ], Console);
        return Console;
    }());

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Combination of NgModuleFactory and ComponentFactorys.
     *
     * @publicApi
     */
    var ModuleWithComponentFactories = /** @class */ (function () {
        function ModuleWithComponentFactories(ngModuleFactory, componentFactories) {
            this.ngModuleFactory = ngModuleFactory;
            this.componentFactories = componentFactories;
        }
        return ModuleWithComponentFactories;
    }());
    function _throwError() {
        throw new Error("Runtime compiler is not loaded");
    }
    /**
     * Low-level service for running the angular compiler during runtime
     * to create {@link ComponentFactory}s, which
     * can later be used to create and render a Component instance.
     *
     * Each `@NgModule` provides an own `Compiler` to its injector,
     * that will use the directives/pipes of the ng module for compilation
     * of components.
     *
     * @publicApi
     */
    var Compiler = /** @class */ (function () {
        function Compiler() {
        }
        /**
         * Compiles the given NgModule and all of its components. All templates of the components listed
         * in `entryComponents` have to be inlined.
         */
        Compiler.prototype.compileModuleSync = function (moduleType) { throw _throwError(); };
        /**
         * Compiles the given NgModule and all of its components
         */
        Compiler.prototype.compileModuleAsync = function (moduleType) { throw _throwError(); };
        /**
         * Same as {@link #compileModuleSync} but also creates ComponentFactories for all components.
         */
        Compiler.prototype.compileModuleAndAllComponentsSync = function (moduleType) {
            throw _throwError();
        };
        /**
         * Same as {@link #compileModuleAsync} but also creates ComponentFactories for all components.
         */
        Compiler.prototype.compileModuleAndAllComponentsAsync = function (moduleType) {
            throw _throwError();
        };
        /**
         * Clears all caches.
         */
        Compiler.prototype.clearCache = function () { };
        /**
         * Clears the cache for the given component/ngModule.
         */
        Compiler.prototype.clearCacheFor = function (type) { };
        /**
         * Returns the id for a given NgModule, if one is defined and known to the compiler.
         */
        Compiler.prototype.getModuleId = function (moduleType) { return undefined; };
        Compiler = __decorate([
            Injectable()
        ], Compiler);
        return Compiler;
    }());
    /**
     * Token to provide CompilerOptions in the platform injector.
     *
     * @publicApi
     */
    var COMPILER_OPTIONS = new InjectionToken('compilerOptions');
    /**
     * A factory for creating a Compiler
     *
     * @publicApi
     */
    var CompilerFactory = /** @class */ (function () {
        function CompilerFactory() {
        }
        return CompilerFactory;
    }());

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var trace;
    var events;
    function detectWTF() {
        var wtf = _global /** TODO #9100 */['wtf'];
        if (wtf) {
            trace = wtf['trace'];
            if (trace) {
                events = trace['events'];
                return true;
            }
        }
        return false;
    }
    function createScope(signature, flags) {
        if (flags === void 0) { flags = null; }
        return events.createScope(signature, flags);
    }
    function leave(scope, returnValue) {
        trace.leaveScope(scope, returnValue);
        return returnValue;
    }
    function startTimeRange(rangeType, action) {
        return trace.beginTimeRange(rangeType, action);
    }
    function endTimeRange(range) {
        trace.endTimeRange(range);
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * True if WTF is enabled.
     */
    var wtfEnabled = detectWTF();
    function noopScope(arg0, arg1) {
        return null;
    }
    /**
     * Create trace scope.
     *
     * Scopes must be strictly nested and are analogous to stack frames, but
     * do not have to follow the stack frames. Instead it is recommended that they follow logical
     * nesting. You may want to use
     * [Event
     * Signatures](http://google.github.io/tracing-framework/instrumenting-code.html#custom-events)
     * as they are defined in WTF.
     *
     * Used to mark scope entry. The return value is used to leave the scope.
     *
     *     var myScope = wtfCreateScope('MyClass#myMethod(ascii someVal)');
     *
     *     someMethod() {
     *        var s = myScope('Foo'); // 'Foo' gets stored in tracing UI
     *        // DO SOME WORK HERE
     *        return wtfLeave(s, 123); // Return value 123
     *     }
     *
     * Note, adding try-finally block around the work to ensure that `wtfLeave` gets called can
     * negatively impact the performance of your application. For this reason we recommend that
     * you don't add them to ensure that `wtfLeave` gets called. In production `wtfLeave` is a noop and
     * so try-finally block has no value. When debugging perf issues, skipping `wtfLeave`, do to
     * exception, will produce incorrect trace, but presence of exception signifies logic error which
     * needs to be fixed before the app should be profiled. Add try-finally only when you expect that
     * an exception is expected during normal execution while profiling.
     *
     * @publicApi
     */
    var wtfCreateScope = wtfEnabled ? createScope : function (signature, flags) { return noopScope; };
    /**
     * Used to mark end of Scope.
     *
     * - `scope` to end.
     * - `returnValue` (optional) to be passed to the WTF.
     *
     * Returns the `returnValue for easy chaining.
     * @publicApi
     */
    var wtfLeave = wtfEnabled ? leave : function (s, r) { return r; };
    /**
     * Used to mark Async start. Async are similar to scope but they don't have to be strictly nested.
     * The return value is used in the call to [endAsync]. Async ranges only work if WTF has been
     * enabled.
     *
     *     someMethod() {
     *        var s = wtfStartTimeRange('HTTP:GET', 'some.url');
     *        var future = new Future.delay(5).then((_) {
     *          wtfEndTimeRange(s);
     *        });
     *     }
     * @publicApi
     */
    var wtfStartTimeRange = wtfEnabled ? startTimeRange : function (rangeType, action) { return null; };
    /**
     * Ends a async time range operation.
     * [range] is the return value from [wtfStartTimeRange] Async ranges only work if WTF has been
     * enabled.
     * @publicApi
     */
    var wtfEndTimeRange = wtfEnabled ? endTimeRange : function (r) { return null; };

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * An injectable service for executing work inside or outside of the Angular zone.
     *
     * The most common use of this service is to optimize performance when starting a work consisting of
     * one or more asynchronous tasks that don't require UI updates or error handling to be handled by
     * Angular. Such tasks can be kicked off via {@link #runOutsideAngular} and if needed, these tasks
     * can reenter the Angular zone via {@link #run}.
     *
     * <!-- TODO: add/fix links to:
     *   - docs explaining zones and the use of zones in Angular and change-detection
     *   - link to runOutsideAngular/run (throughout this file!)
     *   -->
     *
     * @usageNotes
     * ### Example
     *
     * ```
     * import {Component, NgZone} from '@angular/core';
     * import {NgIf} from '@angular/common';
     *
     * @Component({
     *   selector: 'ng-zone-demo',
     *   template: `
     *     <h2>Demo: NgZone</h2>
     *
     *     <p>Progress: {{progress}}%</p>
     *     <p *ngIf="progress >= 100">Done processing {{label}} of Angular zone!</p>
     *
     *     <button (click)="processWithinAngularZone()">Process within Angular zone</button>
     *     <button (click)="processOutsideOfAngularZone()">Process outside of Angular zone</button>
     *   `,
     * })
     * export class NgZoneDemo {
     *   progress: number = 0;
     *   label: string;
     *
     *   constructor(private _ngZone: NgZone) {}
     *
     *   // Loop inside the Angular zone
     *   // so the UI DOES refresh after each setTimeout cycle
     *   processWithinAngularZone() {
     *     this.label = 'inside';
     *     this.progress = 0;
     *     this._increaseProgress(() => console.log('Inside Done!'));
     *   }
     *
     *   // Loop outside of the Angular zone
     *   // so the UI DOES NOT refresh after each setTimeout cycle
     *   processOutsideOfAngularZone() {
     *     this.label = 'outside';
     *     this.progress = 0;
     *     this._ngZone.runOutsideAngular(() => {
     *       this._increaseProgress(() => {
     *         // reenter the Angular zone and display done
     *         this._ngZone.run(() => { console.log('Outside Done!'); });
     *       });
     *     });
     *   }
     *
     *   _increaseProgress(doneCallback: () => void) {
     *     this.progress += 1;
     *     console.log(`Current progress: ${this.progress}%`);
     *
     *     if (this.progress < 100) {
     *       window.setTimeout(() => this._increaseProgress(doneCallback), 10);
     *     } else {
     *       doneCallback();
     *     }
     *   }
     * }
     * ```
     *
     * @publicApi
     */
    var NgZone = /** @class */ (function () {
        function NgZone(_a) {
            var _b = _a.enableLongStackTrace, enableLongStackTrace = _b === void 0 ? false : _b;
            this.hasPendingMicrotasks = false;
            this.hasPendingMacrotasks = false;
            /**
             * Whether there are no outstanding microtasks or macrotasks.
             */
            this.isStable = true;
            /**
             * Notifies when code enters Angular Zone. This gets fired first on VM Turn.
             */
            this.onUnstable = new EventEmitter(false);
            /**
             * Notifies when there is no more microtasks enqueued in the current VM Turn.
             * This is a hint for Angular to do change detection, which may enqueue more microtasks.
             * For this reason this event can fire multiple times per VM Turn.
             */
            this.onMicrotaskEmpty = new EventEmitter(false);
            /**
             * Notifies when the last `onMicrotaskEmpty` has run and there are no more microtasks, which
             * implies we are about to relinquish VM turn.
             * This event gets called just once.
             */
            this.onStable = new EventEmitter(false);
            /**
             * Notifies that an error has been delivered.
             */
            this.onError = new EventEmitter(false);
            if (typeof Zone == 'undefined') {
                throw new Error("In this configuration Angular requires Zone.js");
            }
            Zone.assertZonePatched();
            var self = this;
            self._nesting = 0;
            self._outer = self._inner = Zone.current;
            if (Zone['wtfZoneSpec']) {
                self._inner = self._inner.fork(Zone['wtfZoneSpec']);
            }
            if (Zone['TaskTrackingZoneSpec']) {
                self._inner = self._inner.fork(new Zone['TaskTrackingZoneSpec']);
            }
            if (enableLongStackTrace && Zone['longStackTraceZoneSpec']) {
                self._inner = self._inner.fork(Zone['longStackTraceZoneSpec']);
            }
            forkInnerZoneWithAngularBehavior(self);
        }
        NgZone.isInAngularZone = function () { return Zone.current.get('isAngularZone') === true; };
        NgZone.assertInAngularZone = function () {
            if (!NgZone.isInAngularZone()) {
                throw new Error('Expected to be in Angular Zone, but it is not!');
            }
        };
        NgZone.assertNotInAngularZone = function () {
            if (NgZone.isInAngularZone()) {
                throw new Error('Expected to not be in Angular Zone, but it is!');
            }
        };
        /**
         * Executes the `fn` function synchronously within the Angular zone and returns value returned by
         * the function.
         *
         * Running functions via `run` allows you to reenter Angular zone from a task that was executed
         * outside of the Angular zone (typically started via {@link #runOutsideAngular}).
         *
         * Any future tasks or microtasks scheduled from within this function will continue executing from
         * within the Angular zone.
         *
         * If a synchronous error happens it will be rethrown and not reported via `onError`.
         */
        NgZone.prototype.run = function (fn, applyThis, applyArgs) {
            return this._inner.run(fn, applyThis, applyArgs);
        };
        /**
         * Executes the `fn` function synchronously within the Angular zone as a task and returns value
         * returned by the function.
         *
         * Running functions via `run` allows you to reenter Angular zone from a task that was executed
         * outside of the Angular zone (typically started via {@link #runOutsideAngular}).
         *
         * Any future tasks or microtasks scheduled from within this function will continue executing from
         * within the Angular zone.
         *
         * If a synchronous error happens it will be rethrown and not reported via `onError`.
         */
        NgZone.prototype.runTask = function (fn, applyThis, applyArgs, name) {
            var zone = this._inner;
            var task = zone.scheduleEventTask('NgZoneEvent: ' + name, fn, EMPTY_PAYLOAD, noop$1, noop$1);
            try {
                return zone.runTask(task, applyThis, applyArgs);
            }
            finally {
                zone.cancelTask(task);
            }
        };
        /**
         * Same as `run`, except that synchronous errors are caught and forwarded via `onError` and not
         * rethrown.
         */
        NgZone.prototype.runGuarded = function (fn, applyThis, applyArgs) {
            return this._inner.runGuarded(fn, applyThis, applyArgs);
        };
        /**
         * Executes the `fn` function synchronously in Angular's parent zone and returns value returned by
         * the function.
         *
         * Running functions via {@link #runOutsideAngular} allows you to escape Angular's zone and do
         * work that
         * doesn't trigger Angular change-detection or is subject to Angular's error handling.
         *
         * Any future tasks or microtasks scheduled from within this function will continue executing from
         * outside of the Angular zone.
         *
         * Use {@link #run} to reenter the Angular zone and do work that updates the application model.
         */
        NgZone.prototype.runOutsideAngular = function (fn) {
            return this._outer.run(fn);
        };
        return NgZone;
    }());
    function noop$1() { }
    var EMPTY_PAYLOAD = {};
    function checkStable(zone) {
        if (zone._nesting == 0 && !zone.hasPendingMicrotasks && !zone.isStable) {
            try {
                zone._nesting++;
                zone.onMicrotaskEmpty.emit(null);
            }
            finally {
                zone._nesting--;
                if (!zone.hasPendingMicrotasks) {
                    try {
                        zone.runOutsideAngular(function () { return zone.onStable.emit(null); });
                    }
                    finally {
                        zone.isStable = true;
                    }
                }
            }
        }
    }
    function forkInnerZoneWithAngularBehavior(zone) {
        zone._inner = zone._inner.fork({
            name: 'angular',
            properties: { 'isAngularZone': true },
            onInvokeTask: function (delegate, current, target, task, applyThis, applyArgs) {
                try {
                    onEnter(zone);
                    return delegate.invokeTask(target, task, applyThis, applyArgs);
                }
                finally {
                    onLeave(zone);
                }
            },
            onInvoke: function (delegate, current, target, callback, applyThis, applyArgs, source) {
                try {
                    onEnter(zone);
                    return delegate.invoke(target, callback, applyThis, applyArgs, source);
                }
                finally {
                    onLeave(zone);
                }
            },
            onHasTask: function (delegate, current, target, hasTaskState) {
                delegate.hasTask(target, hasTaskState);
                if (current === target) {
                    // We are only interested in hasTask events which originate from our zone
                    // (A child hasTask event is not interesting to us)
                    if (hasTaskState.change == 'microTask') {
                        zone.hasPendingMicrotasks = hasTaskState.microTask;
                        checkStable(zone);
                    }
                    else if (hasTaskState.change == 'macroTask') {
                        zone.hasPendingMacrotasks = hasTaskState.macroTask;
                    }
                }
            },
            onHandleError: function (delegate, current, target, error) {
                delegate.handleError(target, error);
                zone.runOutsideAngular(function () { return zone.onError.emit(error); });
                return false;
            }
        });
    }
    function onEnter(zone) {
        zone._nesting++;
        if (zone.isStable) {
            zone.isStable = false;
            zone.onUnstable.emit(null);
        }
    }
    function onLeave(zone) {
        zone._nesting--;
        checkStable(zone);
    }
    /**
     * Provides a noop implementation of `NgZone` which does nothing. This zone requires explicit calls
     * to framework to perform rendering.
     */
    var NoopNgZone = /** @class */ (function () {
        function NoopNgZone() {
            this.hasPendingMicrotasks = false;
            this.hasPendingMacrotasks = false;
            this.isStable = true;
            this.onUnstable = new EventEmitter();
            this.onMicrotaskEmpty = new EventEmitter();
            this.onStable = new EventEmitter();
            this.onError = new EventEmitter();
        }
        NoopNgZone.prototype.run = function (fn) { return fn(); };
        NoopNgZone.prototype.runGuarded = function (fn) { return fn(); };
        NoopNgZone.prototype.runOutsideAngular = function (fn) { return fn(); };
        NoopNgZone.prototype.runTask = function (fn) { return fn(); };
        return NoopNgZone;
    }());

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * The Testability service provides testing hooks that can be accessed from
     * the browser and by services such as Protractor. Each bootstrapped Angular
     * application on the page will have an instance of Testability.
     * @publicApi
     */
    var Testability = /** @class */ (function () {
        function Testability(_ngZone) {
            var _this = this;
            this._ngZone = _ngZone;
            this._pendingCount = 0;
            this._isZoneStable = true;
            /**
             * Whether any work was done since the last 'whenStable' callback. This is
             * useful to detect if this could have potentially destabilized another
             * component while it is stabilizing.
             * @internal
             */
            this._didWork = false;
            this._callbacks = [];
            this._watchAngularEvents();
            _ngZone.run(function () { _this.taskTrackingZone = Zone.current.get('TaskTrackingZone'); });
        }
        Testability.prototype._watchAngularEvents = function () {
            var _this = this;
            this._ngZone.onUnstable.subscribe({
                next: function () {
                    _this._didWork = true;
                    _this._isZoneStable = false;
                }
            });
            this._ngZone.runOutsideAngular(function () {
                _this._ngZone.onStable.subscribe({
                    next: function () {
                        NgZone.assertNotInAngularZone();
                        scheduleMicroTask(function () {
                            _this._isZoneStable = true;
                            _this._runCallbacksIfReady();
                        });
                    }
                });
            });
        };
        /**
         * Increases the number of pending request
         * @deprecated pending requests are now tracked with zones.
         */
        Testability.prototype.increasePendingRequestCount = function () {
            this._pendingCount += 1;
            this._didWork = true;
            return this._pendingCount;
        };
        /**
         * Decreases the number of pending request
         * @deprecated pending requests are now tracked with zones
         */
        Testability.prototype.decreasePendingRequestCount = function () {
            this._pendingCount -= 1;
            if (this._pendingCount < 0) {
                throw new Error('pending async requests below zero');
            }
            this._runCallbacksIfReady();
            return this._pendingCount;
        };
        /**
         * Whether an associated application is stable
         */
        Testability.prototype.isStable = function () {
            return this._isZoneStable && this._pendingCount === 0 && !this._ngZone.hasPendingMacrotasks;
        };
        Testability.prototype._runCallbacksIfReady = function () {
            var _this = this;
            if (this.isStable()) {
                // Schedules the call backs in a new frame so that it is always async.
                scheduleMicroTask(function () {
                    while (_this._callbacks.length !== 0) {
                        var cb = _this._callbacks.pop();
                        clearTimeout(cb.timeoutId);
                        cb.doneCb(_this._didWork);
                    }
                    _this._didWork = false;
                });
            }
            else {
                // Still not stable, send updates.
                var pending_1 = this.getPendingTasks();
                this._callbacks = this._callbacks.filter(function (cb) {
                    if (cb.updateCb && cb.updateCb(pending_1)) {
                        clearTimeout(cb.timeoutId);
                        return false;
                    }
                    return true;
                });
                this._didWork = true;
            }
        };
        Testability.prototype.getPendingTasks = function () {
            if (!this.taskTrackingZone) {
                return [];
            }
            // Copy the tasks data so that we don't leak tasks.
            return this.taskTrackingZone.macroTasks.map(function (t) {
                return {
                    source: t.source,
                    // From TaskTrackingZone:
                    // https://github.com/angular/zone.js/blob/master/lib/zone-spec/task-tracking.ts#L40
                    creationLocation: t.creationLocation,
                    data: t.data
                };
            });
        };
        Testability.prototype.addCallback = function (cb, timeout, updateCb) {
            var _this = this;
            var timeoutId = -1;
            if (timeout && timeout > 0) {
                timeoutId = setTimeout(function () {
                    _this._callbacks = _this._callbacks.filter(function (cb) { return cb.timeoutId !== timeoutId; });
                    cb(_this._didWork, _this.getPendingTasks());
                }, timeout);
            }
            this._callbacks.push({ doneCb: cb, timeoutId: timeoutId, updateCb: updateCb });
        };
        /**
         * Wait for the application to be stable with a timeout. If the timeout is reached before that
         * happens, the callback receives a list of the macro tasks that were pending, otherwise null.
         *
         * @param doneCb The callback to invoke when Angular is stable or the timeout expires
         *    whichever comes first.
         * @param timeout Optional. The maximum time to wait for Angular to become stable. If not
         *    specified, whenStable() will wait forever.
         * @param updateCb Optional. If specified, this callback will be invoked whenever the set of
         *    pending macrotasks changes. If this callback returns true doneCb will not be invoked
         *    and no further updates will be issued.
         */
        Testability.prototype.whenStable = function (doneCb, timeout, updateCb) {
            if (updateCb && !this.taskTrackingZone) {
                throw new Error('Task tracking zone is required when passing an update callback to ' +
                    'whenStable(). Is "zone.js/dist/task-tracking.js" loaded?');
            }
            // These arguments are 'Function' above to keep the public API simple.
            this.addCallback(doneCb, timeout, updateCb);
            this._runCallbacksIfReady();
        };
        /**
         * Get the number of pending requests
         * @deprecated pending requests are now tracked with zones
         */
        Testability.prototype.getPendingRequestCount = function () { return this._pendingCount; };
        /**
         * Find providers by name
         * @param using The root element to search from
         * @param provider The name of binding variable
         * @param exactMatch Whether using exactMatch
         */
        Testability.prototype.findProviders = function (using, provider, exactMatch) {
            // TODO(juliemr): implement.
            return [];
        };
        Testability = __decorate([
            Injectable(),
            __metadata("design:paramtypes", [NgZone])
        ], Testability);
        return Testability;
    }());
    /**
     * A global registry of {@link Testability} instances for specific elements.
     * @publicApi
     */
    var TestabilityRegistry = /** @class */ (function () {
        function TestabilityRegistry() {
            /** @internal */
            this._applications = new Map();
            _testabilityGetter.addToWindow(this);
        }
        /**
         * Registers an application with a testability hook so that it can be tracked
         * @param token token of application, root element
         * @param testability Testability hook
         */
        TestabilityRegistry.prototype.registerApplication = function (token, testability) {
            this._applications.set(token, testability);
        };
        /**
         * Unregisters an application.
         * @param token token of application, root element
         */
        TestabilityRegistry.prototype.unregisterApplication = function (token) { this._applications.delete(token); };
        /**
         * Unregisters all applications
         */
        TestabilityRegistry.prototype.unregisterAllApplications = function () { this._applications.clear(); };
        /**
         * Get a testability hook associated with the application
         * @param elem root element
         */
        TestabilityRegistry.prototype.getTestability = function (elem) { return this._applications.get(elem) || null; };
        /**
         * Get all registered testabilities
         */
        TestabilityRegistry.prototype.getAllTestabilities = function () { return Array.from(this._applications.values()); };
        /**
         * Get all registered applications(root elements)
         */
        TestabilityRegistry.prototype.getAllRootElements = function () { return Array.from(this._applications.keys()); };
        /**
         * Find testability of a node in the Tree
         * @param elem node
         * @param findInAncestors whether finding testability in ancestors if testability was not found in
         * current node
         */
        TestabilityRegistry.prototype.findTestabilityInTree = function (elem, findInAncestors) {
            if (findInAncestors === void 0) { findInAncestors = true; }
            return _testabilityGetter.findTestabilityInTree(this, elem, findInAncestors);
        };
        TestabilityRegistry = __decorate([
            Injectable(),
            __metadata("design:paramtypes", [])
        ], TestabilityRegistry);
        return TestabilityRegistry;
    }());
    var _NoopGetTestability = /** @class */ (function () {
        function _NoopGetTestability() {
        }
        _NoopGetTestability.prototype.addToWindow = function (registry) { };
        _NoopGetTestability.prototype.findTestabilityInTree = function (registry, elem, findInAncestors) {
            return null;
        };
        return _NoopGetTestability;
    }());
    /**
     * Set the {@link GetTestability} implementation used by the Angular testing framework.
     * @publicApi
     */
    function setTestabilityGetter(getter) {
        _testabilityGetter = getter;
    }
    var _testabilityGetter = new _NoopGetTestability();

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var _platform;
    var compileNgModuleFactory = compileNgModuleFactory__PRE_NGCC__;
    function compileNgModuleFactory__PRE_NGCC__(injector, options, moduleType) {
        var compilerFactory = injector.get(CompilerFactory);
        var compiler = compilerFactory.createCompiler([options]);
        return compiler.compileModuleAsync(moduleType);
    }
    function compileNgModuleFactory__POST_NGCC__(injector, options, moduleType) {
        ngDevMode && assertNgModuleType(moduleType);
        return Promise.resolve(new NgModuleFactory$1(moduleType));
    }
    var ALLOW_MULTIPLE_PLATFORMS = new InjectionToken('AllowMultipleToken');
    /**
     * A token for third-party components that can register themselves with NgProbe.
     *
     * @publicApi
     */
    var NgProbeToken = /** @class */ (function () {
        function NgProbeToken(name, token) {
            this.name = name;
            this.token = token;
        }
        return NgProbeToken;
    }());
    /**
     * Creates a platform.
     * Platforms have to be eagerly created via this function.
     *
     * @publicApi
     */
    function createPlatform(injector) {
        if (_platform && !_platform.destroyed &&
            !_platform.injector.get(ALLOW_MULTIPLE_PLATFORMS, false)) {
            throw new Error('There can be only one platform. Destroy the previous one to create a new one.');
        }
        _platform = injector.get(PlatformRef);
        var inits = injector.get(PLATFORM_INITIALIZER, null);
        if (inits)
            inits.forEach(function (init) { return init(); });
        return _platform;
    }
    /**
     * Creates a factory for a platform
     *
     * @publicApi
     */
    function createPlatformFactory(parentPlatformFactory, name, providers) {
        if (providers === void 0) { providers = []; }
        var desc = "Platform: " + name;
        var marker = new InjectionToken(desc);
        return function (extraProviders) {
            if (extraProviders === void 0) { extraProviders = []; }
            var platform = getPlatform();
            if (!platform || platform.injector.get(ALLOW_MULTIPLE_PLATFORMS, false)) {
                if (parentPlatformFactory) {
                    parentPlatformFactory(providers.concat(extraProviders).concat({ provide: marker, useValue: true }));
                }
                else {
                    var injectedProviders = providers.concat(extraProviders).concat({ provide: marker, useValue: true });
                    createPlatform(Injector.create({ providers: injectedProviders, name: desc }));
                }
            }
            return assertPlatform(marker);
        };
    }
    /**
     * Checks that there currently is a platform which contains the given token as a provider.
     *
     * @publicApi
     */
    function assertPlatform(requiredToken) {
        var platform = getPlatform();
        if (!platform) {
            throw new Error('No platform exists!');
        }
        if (!platform.injector.get(requiredToken, null)) {
            throw new Error('A platform with a different configuration has been created. Please destroy it first.');
        }
        return platform;
    }
    /**
     * Destroy the existing platform.
     *
     * @publicApi
     */
    function destroyPlatform() {
        if (_platform && !_platform.destroyed) {
            _platform.destroy();
        }
    }
    /**
     * Returns the current platform.
     *
     * @publicApi
     */
    function getPlatform() {
        return _platform && !_platform.destroyed ? _platform : null;
    }
    /**
     * The Angular platform is the entry point for Angular on a web page. Each page
     * has exactly one platform, and services (such as reflection) which are common
     * to every Angular application running on the page are bound in its scope.
     *
     * A page's platform is initialized implicitly when a platform is created via a platform factory
     * (e.g. {@link platformBrowser}), or explicitly by calling the {@link createPlatform} function.
     *
     * @publicApi
     */
    var PlatformRef = /** @class */ (function () {
        /** @internal */
        function PlatformRef(_injector) {
            this._injector = _injector;
            this._modules = [];
            this._destroyListeners = [];
            this._destroyed = false;
        }
        /**
         * Creates an instance of an `@NgModule` for the given platform
         * for offline compilation.
         *
         * @usageNotes
         * ### Simple Example
         *
         * ```typescript
         * my_module.ts:
         *
         * @NgModule({
         *   imports: [BrowserModule]
         * })
         * class MyModule {}
         *
         * main.ts:
         * import {MyModuleNgFactory} from './my_module.ngfactory';
         * import {platformBrowser} from '@angular/platform-browser';
         *
         * let moduleRef = platformBrowser().bootstrapModuleFactory(MyModuleNgFactory);
         * ```
         */
        PlatformRef.prototype.bootstrapModuleFactory = function (moduleFactory, options) {
            var _this = this;
            // Note: We need to create the NgZone _before_ we instantiate the module,
            // as instantiating the module creates some providers eagerly.
            // So we create a mini parent injector that just contains the new NgZone and
            // pass that as parent to the NgModuleFactory.
            var ngZoneOption = options ? options.ngZone : undefined;
            var ngZone = getNgZone(ngZoneOption);
            var providers = [{ provide: NgZone, useValue: ngZone }];
            // Attention: Don't use ApplicationRef.run here,
            // as we want to be sure that all possible constructor calls are inside `ngZone.run`!
            return ngZone.run(function () {
                var ngZoneInjector = Injector.create({ providers: providers, parent: _this.injector, name: moduleFactory.moduleType.name });
                var moduleRef = moduleFactory.create(ngZoneInjector);
                var exceptionHandler = moduleRef.injector.get(ErrorHandler, null);
                if (!exceptionHandler) {
                    throw new Error('No ErrorHandler. Is platform module (BrowserModule) included?');
                }
                moduleRef.onDestroy(function () { return remove(_this._modules, moduleRef); });
                ngZone.runOutsideAngular(function () { return ngZone.onError.subscribe({ next: function (error) { exceptionHandler.handleError(error); } }); });
                return _callAndReportToErrorHandler(exceptionHandler, ngZone, function () {
                    var initStatus = moduleRef.injector.get(ApplicationInitStatus);
                    initStatus.runInitializers();
                    return initStatus.donePromise.then(function () {
                        _this._moduleDoBootstrap(moduleRef);
                        return moduleRef;
                    });
                });
            });
        };
        /**
         * Creates an instance of an `@NgModule` for a given platform using the given runtime compiler.
         *
         * @usageNotes
         * ### Simple Example
         *
         * ```typescript
         * @NgModule({
         *   imports: [BrowserModule]
         * })
         * class MyModule {}
         *
         * let moduleRef = platformBrowser().bootstrapModule(MyModule);
         * ```
         *
         */
        PlatformRef.prototype.bootstrapModule = function (moduleType, compilerOptions) {
            var _this = this;
            if (compilerOptions === void 0) { compilerOptions = []; }
            var options = optionsReducer({}, compilerOptions);
            return compileNgModuleFactory(this.injector, options, moduleType)
                .then(function (moduleFactory) { return _this.bootstrapModuleFactory(moduleFactory, options); });
        };
        PlatformRef.prototype._moduleDoBootstrap = function (moduleRef) {
            var appRef = moduleRef.injector.get(ApplicationRef);
            if (moduleRef._bootstrapComponents.length > 0) {
                moduleRef._bootstrapComponents.forEach(function (f) { return appRef.bootstrap(f); });
            }
            else if (moduleRef.instance.ngDoBootstrap) {
                moduleRef.instance.ngDoBootstrap(appRef);
            }
            else {
                throw new Error("The module " + stringify(moduleRef.instance.constructor) + " was bootstrapped, but it does not declare \"@NgModule.bootstrap\" components nor a \"ngDoBootstrap\" method. " +
                    "Please define one of these.");
            }
            this._modules.push(moduleRef);
        };
        /**
         * Register a listener to be called when the platform is disposed.
         */
        PlatformRef.prototype.onDestroy = function (callback) { this._destroyListeners.push(callback); };
        Object.defineProperty(PlatformRef.prototype, "injector", {
            /**
             * Retrieve the platform {@link Injector}, which is the parent injector for
             * every Angular application on the page and provides singleton providers.
             */
            get: function () { return this._injector; },
            enumerable: true,
            configurable: true
        });
        /**
         * Destroy the Angular platform and all Angular applications on the page.
         */
        PlatformRef.prototype.destroy = function () {
            if (this._destroyed) {
                throw new Error('The platform has already been destroyed!');
            }
            this._modules.slice().forEach(function (module) { return module.destroy(); });
            this._destroyListeners.forEach(function (listener) { return listener(); });
            this._destroyed = true;
        };
        Object.defineProperty(PlatformRef.prototype, "destroyed", {
            get: function () { return this._destroyed; },
            enumerable: true,
            configurable: true
        });
        PlatformRef = __decorate([
            Injectable(),
            __metadata("design:paramtypes", [Injector])
        ], PlatformRef);
        return PlatformRef;
    }());
    function getNgZone(ngZoneOption) {
        var ngZone;
        if (ngZoneOption === 'noop') {
            ngZone = new NoopNgZone();
        }
        else {
            ngZone = (ngZoneOption === 'zone.js' ? undefined : ngZoneOption) ||
                new NgZone({ enableLongStackTrace: isDevMode() });
        }
        return ngZone;
    }
    function _callAndReportToErrorHandler(errorHandler, ngZone, callback) {
        try {
            var result = callback();
            if (isPromise(result)) {
                return result.catch(function (e) {
                    ngZone.runOutsideAngular(function () { return errorHandler.handleError(e); });
                    // rethrow as the exception handler might not do it
                    throw e;
                });
            }
            return result;
        }
        catch (e) {
            ngZone.runOutsideAngular(function () { return errorHandler.handleError(e); });
            // rethrow as the exception handler might not do it
            throw e;
        }
    }
    function optionsReducer(dst, objs) {
        if (Array.isArray(objs)) {
            dst = objs.reduce(optionsReducer, dst);
        }
        else {
            dst = __assign({}, dst, objs);
        }
        return dst;
    }
    /**
     * A reference to an Angular application running on a page.
     *
     * @publicApi
     */
    var ApplicationRef = /** @class */ (function () {
        /** @internal */
        function ApplicationRef(_zone, _console, _injector, _exceptionHandler, _componentFactoryResolver, _initStatus) {
            var _this = this;
            this._zone = _zone;
            this._console = _console;
            this._injector = _injector;
            this._exceptionHandler = _exceptionHandler;
            this._componentFactoryResolver = _componentFactoryResolver;
            this._initStatus = _initStatus;
            this._bootstrapListeners = [];
            this._views = [];
            this._runningTick = false;
            this._enforceNoNewChanges = false;
            this._stable = true;
            /**
             * Get a list of component types registered to this application.
             * This list is populated even before the component is created.
             */
            this.componentTypes = [];
            /**
             * Get a list of components registered to this application.
             */
            this.components = [];
            this._enforceNoNewChanges = isDevMode();
            this._zone.onMicrotaskEmpty.subscribe({ next: function () { _this._zone.run(function () { _this.tick(); }); } });
            var isCurrentlyStable = new rxjs.Observable(function (observer) {
                _this._stable = _this._zone.isStable && !_this._zone.hasPendingMacrotasks &&
                    !_this._zone.hasPendingMicrotasks;
                _this._zone.runOutsideAngular(function () {
                    observer.next(_this._stable);
                    observer.complete();
                });
            });
            var isStable = new rxjs.Observable(function (observer) {
                // Create the subscription to onStable outside the Angular Zone so that
                // the callback is run outside the Angular Zone.
                var stableSub;
                _this._zone.runOutsideAngular(function () {
                    stableSub = _this._zone.onStable.subscribe(function () {
                        NgZone.assertNotInAngularZone();
                        // Check whether there are no pending macro/micro tasks in the next tick
                        // to allow for NgZone to update the state.
                        scheduleMicroTask(function () {
                            if (!_this._stable && !_this._zone.hasPendingMacrotasks &&
                                !_this._zone.hasPendingMicrotasks) {
                                _this._stable = true;
                                observer.next(true);
                            }
                        });
                    });
                });
                var unstableSub = _this._zone.onUnstable.subscribe(function () {
                    NgZone.assertInAngularZone();
                    if (_this._stable) {
                        _this._stable = false;
                        _this._zone.runOutsideAngular(function () { observer.next(false); });
                    }
                });
                return function () {
                    stableSub.unsubscribe();
                    unstableSub.unsubscribe();
                };
            });
            this.isStable =
                rxjs.merge(isCurrentlyStable, isStable.pipe(operators.share()));
        }
        ApplicationRef_1 = ApplicationRef;
        /**
         * Bootstrap a new component at the root level of the application.
         *
         * @usageNotes
         * ### Bootstrap process
         *
         * When bootstrapping a new root component into an application, Angular mounts the
         * specified application component onto DOM elements identified by the componentType's
         * selector and kicks off automatic change detection to finish initializing the component.
         *
         * Optionally, a component can be mounted onto a DOM element that does not match the
         * componentType's selector.
         *
         * ### Example
         * {@example core/ts/platform/platform.ts region='longform'}
         */
        ApplicationRef.prototype.bootstrap = function (componentOrFactory, rootSelectorOrNode) {
            var _this = this;
            if (!this._initStatus.done) {
                throw new Error('Cannot bootstrap as there are still asynchronous initializers running. Bootstrap components in the `ngDoBootstrap` method of the root module.');
            }
            var componentFactory;
            if (componentOrFactory instanceof ComponentFactory) {
                componentFactory = componentOrFactory;
            }
            else {
                componentFactory =
                    this._componentFactoryResolver.resolveComponentFactory(componentOrFactory);
            }
            this.componentTypes.push(componentFactory.componentType);
            // Create a factory associated with the current module if it's not bound to some other
            var ngModule = componentFactory instanceof ComponentFactoryBoundToModule ?
                null :
                this._injector.get(NgModuleRef);
            var selectorOrNode = rootSelectorOrNode || componentFactory.selector;
            var compRef = componentFactory.create(Injector.NULL, [], selectorOrNode, ngModule);
            compRef.onDestroy(function () { _this._unloadComponent(compRef); });
            var testability = compRef.injector.get(Testability, null);
            if (testability) {
                compRef.injector.get(TestabilityRegistry)
                    .registerApplication(compRef.location.nativeElement, testability);
            }
            this._loadComponent(compRef);
            if (isDevMode()) {
                this._console.log("Angular is running in the development mode. Call enableProdMode() to enable the production mode.");
            }
            return compRef;
        };
        /**
         * Invoke this method to explicitly process change detection and its side-effects.
         *
         * In development mode, `tick()` also performs a second change detection cycle to ensure that no
         * further changes are detected. If additional changes are picked up during this second cycle,
         * bindings in the app have side-effects that cannot be resolved in a single change detection
         * pass.
         * In this case, Angular throws an error, since an Angular application can only have one change
         * detection pass during which all change detection must complete.
         */
        ApplicationRef.prototype.tick = function () {
            var _this = this;
            if (this._runningTick) {
                throw new Error('ApplicationRef.tick is called recursively');
            }
            var scope = ApplicationRef_1._tickScope();
            try {
                this._runningTick = true;
                this._views.forEach(function (view) { return view.detectChanges(); });
                if (this._enforceNoNewChanges) {
                    this._views.forEach(function (view) { return view.checkNoChanges(); });
                }
            }
            catch (e) {
                // Attention: Don't rethrow as it could cancel subscriptions to Observables!
                this._zone.runOutsideAngular(function () { return _this._exceptionHandler.handleError(e); });
            }
            finally {
                this._runningTick = false;
                wtfLeave(scope);
            }
        };
        /**
         * Attaches a view so that it will be dirty checked.
         * The view will be automatically detached when it is destroyed.
         * This will throw if the view is already attached to a ViewContainer.
         */
        ApplicationRef.prototype.attachView = function (viewRef) {
            var view = viewRef;
            this._views.push(view);
            view.attachToAppRef(this);
        };
        /**
         * Detaches a view from dirty checking again.
         */
        ApplicationRef.prototype.detachView = function (viewRef) {
            var view = viewRef;
            remove(this._views, view);
            view.detachFromAppRef();
        };
        ApplicationRef.prototype._loadComponent = function (componentRef) {
            this.attachView(componentRef.hostView);
            this.tick();
            this.components.push(componentRef);
            // Get the listeners lazily to prevent DI cycles.
            var listeners = this._injector.get(APP_BOOTSTRAP_LISTENER, []).concat(this._bootstrapListeners);
            listeners.forEach(function (listener) { return listener(componentRef); });
        };
        ApplicationRef.prototype._unloadComponent = function (componentRef) {
            this.detachView(componentRef.hostView);
            remove(this.components, componentRef);
        };
        /** @internal */
        ApplicationRef.prototype.ngOnDestroy = function () {
            // TODO(alxhub): Dispose of the NgZone.
            this._views.slice().forEach(function (view) { return view.destroy(); });
        };
        Object.defineProperty(ApplicationRef.prototype, "viewCount", {
            /**
             * Returns the number of attached views.
             */
            get: function () { return this._views.length; },
            enumerable: true,
            configurable: true
        });
        var ApplicationRef_1;
        /** @internal */
        ApplicationRef._tickScope = wtfCreateScope('ApplicationRef#tick()');
        ApplicationRef = ApplicationRef_1 = __decorate([
            Injectable(),
            __metadata("design:paramtypes", [NgZone, Console, Injector,
                ErrorHandler,
                ComponentFactoryResolver,
                ApplicationInitStatus])
        ], ApplicationRef);
        return ApplicationRef;
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
     * Used to load ng module factories.
     *
     * @publicApi
     */
    var NgModuleFactoryLoader = /** @class */ (function () {
        function NgModuleFactoryLoader() {
        }
        return NgModuleFactoryLoader;
    }());
    var moduleFactories = new Map();
    /**
     * Registers a loaded module. Should only be called from generated NgModuleFactory code.
     * @publicApi
     */
    function registerModuleFactory(id, factory) {
        var existing = moduleFactories.get(id);
        if (existing) {
            throw new Error("Duplicate module registered for " + id + " - " + existing.moduleType.name + " vs " + factory.moduleType.name);
        }
        moduleFactories.set(id, factory);
    }
    /**
     * Returns the NgModuleFactory with the given id, if it exists and has been loaded.
     * Factories for modules that do not specify an `id` cannot be retrieved. Throws if the module
     * cannot be found.
     * @publicApi
     */
    function getModuleFactory(id) {
        var factory = moduleFactories.get(id);
        if (!factory)
            throw new Error("No module with ID " + id + " loaded");
        return factory;
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * An unmodifiable list of items that Angular keeps up to date when the state
     * of the application changes.
     *
     * The type of object that {@link ViewChildren}, {@link ContentChildren}, and {@link QueryList}
     * provide.
     *
     * Implements an iterable interface, therefore it can be used in both ES6
     * javascript `for (var i of items)` loops as well as in Angular templates with
     * `*ngFor="let i of myList"`.
     *
     * Changes can be observed by subscribing to the changes `Observable`.
     *
     * NOTE: In the future this class will implement an `Observable` interface.
     *
     * @usageNotes
     * ### Example
     * ```typescript
     * @Component({...})
     * class Container {
     *   @ViewChildren(Item) items:QueryList<Item>;
     * }
     * ```
     *
     * @publicApi
     */
    var QueryList$1 = /** @class */ (function () {
        function QueryList() {
            this.dirty = true;
            this._results = [];
            this.changes = new EventEmitter();
            this.length = 0;
        }
        /**
         * See
         * [Array.map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map)
         */
        QueryList.prototype.map = function (fn) { return this._results.map(fn); };
        /**
         * See
         * [Array.filter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter)
         */
        QueryList.prototype.filter = function (fn) {
            return this._results.filter(fn);
        };
        /**
         * See
         * [Array.find](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find)
         */
        QueryList.prototype.find = function (fn) {
            return this._results.find(fn);
        };
        /**
         * See
         * [Array.reduce](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce)
         */
        QueryList.prototype.reduce = function (fn, init) {
            return this._results.reduce(fn, init);
        };
        /**
         * See
         * [Array.forEach](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach)
         */
        QueryList.prototype.forEach = function (fn) { this._results.forEach(fn); };
        /**
         * See
         * [Array.some](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some)
         */
        QueryList.prototype.some = function (fn) {
            return this._results.some(fn);
        };
        QueryList.prototype.toArray = function () { return this._results.slice(); };
        QueryList.prototype[getSymbolIterator()] = function () { return this._results[getSymbolIterator()](); };
        QueryList.prototype.toString = function () { return this._results.toString(); };
        QueryList.prototype.reset = function (res) {
            this._results = flatten$2(res);
            this.dirty = false;
            this.length = this._results.length;
            this.last = this._results[this.length - 1];
            this.first = this._results[0];
        };
        QueryList.prototype.notifyOnChanges = function () { this.changes.emit(this); };
        /** internal */
        QueryList.prototype.setDirty = function () { this.dirty = true; };
        /** internal */
        QueryList.prototype.destroy = function () {
            this.changes.complete();
            this.changes.unsubscribe();
        };
        return QueryList;
    }());
    function flatten$2(list) {
        return list.reduce(function (flat, item) {
            var flatItem = Array.isArray(item) ? flatten$2(item) : item;
            return flat.concat(flatItem);
        }, []);
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var _SEPARATOR = '#';
    var FACTORY_CLASS_SUFFIX = 'NgFactory';
    /**
     * Configuration for SystemJsNgModuleLoader.
     * token.
     *
     * @publicApi
     */
    var SystemJsNgModuleLoaderConfig = /** @class */ (function () {
        function SystemJsNgModuleLoaderConfig() {
        }
        return SystemJsNgModuleLoaderConfig;
    }());
    var DEFAULT_CONFIG = {
        factoryPathPrefix: '',
        factoryPathSuffix: '.ngfactory',
    };
    /**
     * NgModuleFactoryLoader that uses SystemJS to load NgModuleFactory
     * @publicApi
     */
    var SystemJsNgModuleLoader = /** @class */ (function () {
        function SystemJsNgModuleLoader(_compiler, config) {
            this._compiler = _compiler;
            this._config = config || DEFAULT_CONFIG;
        }
        SystemJsNgModuleLoader.prototype.load = function (path) {
            var offlineMode = this._compiler instanceof Compiler;
            return offlineMode ? this.loadFactory(path) : this.loadAndCompile(path);
        };
        SystemJsNgModuleLoader.prototype.loadAndCompile = function (path) {
            var _this = this;
            var _a = __read(path.split(_SEPARATOR), 2), module = _a[0], exportName = _a[1];
            if (exportName === undefined) {
                exportName = 'default';
            }
            return System.import(module)
                .then(function (module) { return module[exportName]; })
                .then(function (type) { return checkNotEmpty(type, module, exportName); })
                .then(function (type) { return _this._compiler.compileModuleAsync(type); });
        };
        SystemJsNgModuleLoader.prototype.loadFactory = function (path) {
            var _a = __read(path.split(_SEPARATOR), 2), module = _a[0], exportName = _a[1];
            var factoryClassSuffix = FACTORY_CLASS_SUFFIX;
            if (exportName === undefined) {
                exportName = 'default';
                factoryClassSuffix = '';
            }
            return System.import(this._config.factoryPathPrefix + module + this._config.factoryPathSuffix)
                .then(function (module) { return module[exportName + factoryClassSuffix]; })
                .then(function (factory) { return checkNotEmpty(factory, module, exportName); });
        };
        SystemJsNgModuleLoader = __decorate([
            Injectable(),
            __param(1, Optional()),
            __metadata("design:paramtypes", [Compiler, SystemJsNgModuleLoaderConfig])
        ], SystemJsNgModuleLoader);
        return SystemJsNgModuleLoader;
    }());
    function checkNotEmpty(value, modulePath, exportName) {
        if (!value) {
            throw new Error("Cannot find '" + exportName + "' in '" + modulePath + "'");
        }
        return value;
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Represents a container where one or more views can be attached to a component.
     *
     * Can contain *host views* (created by instantiating a
     * component with the `createComponent()` method), and *embedded views*
     * (created by instantiating a `TemplateRef` with the `createEmbeddedView()` method).
     *
     * A view container instance can contain other view containers,
     * creating a [view hierarchy](guide/glossary#view-tree).
     *
     * @see `ComponentRef`
     * @see `EmbeddedViewRef`
     *
     * @publicApi
     */
    var ViewContainerRef = /** @class */ (function () {
        function ViewContainerRef() {
        }
        /** @internal */
        ViewContainerRef.__NG_ELEMENT_ID__ = function () { return R3_VIEW_CONTAINER_REF_FACTORY$1(ViewContainerRef, ElementRef); };
        return ViewContainerRef;
    }());

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Base class for Angular Views, provides change detection functionality.
     * A change-detection tree collects all views that are to be checked for changes.
     * Use the methods to add and remove views from the tree, initiate change-detection,
     * and explicitly mark views as _dirty_, meaning that they have changed and need to be rerendered.
     *
     * @usageNotes
     *
     * The following examples demonstrate how to modify default change-detection behavior
     * to perform explicit detection when needed.
     *
     * ### Use `markForCheck()` with `CheckOnce` strategy
     *
     * The following example sets the `OnPush` change-detection strategy for a component
     * (`CheckOnce`, rather than the default `CheckAlways`), then forces a second check
     * after an interval. See [live demo](http://plnkr.co/edit/GC512b?p=preview).
     *
     * <code-example path="core/ts/change_detect/change-detection.ts"
     * region="mark-for-check"></code-example>
     *
     * ### Detach change detector to limit how often check occurs
     *
     * The following example defines a component with a large list of read-only data
     * that is expected to change constantly, many times per second.
     * To improve performance, we want to check and update the list
     * less often than the changes actually occur. To do that, we detach
     * the component's change detector and perform an explicit local check every five seconds.
     *
     * <code-example path="core/ts/change_detect/change-detection.ts" region="detach"></code-example>
     *
     *
     * ### Reattaching a detached component
     *
     * The following example creates a component displaying live data.
     * The component detaches its change detector from the main change detector tree
     * when the `live` property is set to false, and reattaches it when the property
     * becomes true.
     *
     * <code-example path="core/ts/change_detect/change-detection.ts" region="reattach"></code-example>
     *
     * @publicApi
     */
    var ChangeDetectorRef = /** @class */ (function () {
        function ChangeDetectorRef() {
        }
        /** @internal */
        ChangeDetectorRef.__NG_ELEMENT_ID__ = function () { return R3_CHANGE_DETECTOR_REF_FACTORY$1(); };
        return ChangeDetectorRef;
    }());

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Represents an Angular [view](guide/glossary#view),
     * specifically the [host view](guide/glossary#view-tree) that is defined by a component.
     * Also serves as the base class
     * that adds destroy methods for [embedded views](guide/glossary#view-tree).
     *
     * @see `EmbeddedViewRef`
     *
     * @publicApi
     */
    var ViewRef$1 = /** @class */ (function (_super) {
        __extends(ViewRef, _super);
        function ViewRef() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return ViewRef;
    }(ChangeDetectorRef));
    /**
     * Represents an Angular [view](guide/glossary#view) in a view container.
     * An [embedded view](guide/glossary#view-tree) can be referenced from a component
     * other than the hosting component whose template defines it, or it can be defined
     * independently by a `TemplateRef`.
     *
     * Properties of elements in a view can change, but the structure (number and order) of elements in
     * a view cannot. Change the structure of elements by inserting, moving, or
     * removing nested views in a view container.
     *
     * @see `ViewContainerRef`
     *
     * @usageNotes
     *
     * The following template breaks down into two separate `TemplateRef` instances,
     * an outer one and an inner one.
     *
     * ```
     * Count: {{items.length}}
     * <ul>
     *   <li *ngFor="let  item of items">{{item}}</li>
     * </ul>
     * ```
     *
     * This is the outer `TemplateRef`:
     *
     * ```
     * Count: {{items.length}}
     * <ul>
     *   <ng-template ngFor let-item [ngForOf]="items"></ng-template>
     * </ul>
     * ```
     *
     * This is the inner `TemplateRef`:
     *
     * ```
     *   <li>{{item}}</li>
     * ```
     *
     * The outer and inner `TemplateRef` instances are assembled into views as follows:
     *
     * ```
     * <!-- ViewRef: outer-0 -->
     * Count: 2
     * <ul>
     *   <ng-template view-container-ref></ng-template>
     *   <!-- ViewRef: inner-1 --><li>first</li><!-- /ViewRef: inner-1 -->
     *   <!-- ViewRef: inner-2 --><li>second</li><!-- /ViewRef: inner-2 -->
     * </ul>
     * <!-- /ViewRef: outer-0 -->
     * ```
     * @publicApi
     */
    var EmbeddedViewRef = /** @class */ (function (_super) {
        __extends(EmbeddedViewRef, _super);
        function EmbeddedViewRef() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return EmbeddedViewRef;
    }(ViewRef$1));

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
    var EventListener = /** @class */ (function () {
        function EventListener(name, callback) {
            this.name = name;
            this.callback = callback;
        }
        return EventListener;
    }());
    /**
     * @publicApi
     */
    var DebugNode = /** @class */ (function () {
        function DebugNode(nativeNode, parent, _debugContext) {
            this.nativeNode = nativeNode;
            this._debugContext = _debugContext;
            this.listeners = [];
            this.parent = null;
            if (parent && parent instanceof DebugElement) {
                parent.addChild(this);
            }
        }
        Object.defineProperty(DebugNode.prototype, "injector", {
            get: function () { return this._debugContext.injector; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DebugNode.prototype, "componentInstance", {
            get: function () { return this._debugContext.component; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DebugNode.prototype, "context", {
            get: function () { return this._debugContext.context; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DebugNode.prototype, "references", {
            get: function () { return this._debugContext.references; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DebugNode.prototype, "providerTokens", {
            get: function () { return this._debugContext.providerTokens; },
            enumerable: true,
            configurable: true
        });
        return DebugNode;
    }());
    /**
     * @publicApi
     */
    var DebugElement = /** @class */ (function (_super) {
        __extends(DebugElement, _super);
        function DebugElement(nativeNode, parent, _debugContext) {
            var _this = _super.call(this, nativeNode, parent, _debugContext) || this;
            _this.properties = {};
            _this.attributes = {};
            _this.classes = {};
            _this.styles = {};
            _this.childNodes = [];
            _this.nativeElement = nativeNode;
            return _this;
        }
        DebugElement.prototype.addChild = function (child) {
            if (child) {
                this.childNodes.push(child);
                child.parent = this;
            }
        };
        DebugElement.prototype.removeChild = function (child) {
            var childIndex = this.childNodes.indexOf(child);
            if (childIndex !== -1) {
                child.parent = null;
                this.childNodes.splice(childIndex, 1);
            }
        };
        DebugElement.prototype.insertChildrenAfter = function (child, newChildren) {
            var _this = this;
            var _a;
            var siblingIndex = this.childNodes.indexOf(child);
            if (siblingIndex !== -1) {
                (_a = this.childNodes).splice.apply(_a, __spread([siblingIndex + 1, 0], newChildren));
                newChildren.forEach(function (c) {
                    if (c.parent) {
                        c.parent.removeChild(c);
                    }
                    c.parent = _this;
                });
            }
        };
        DebugElement.prototype.insertBefore = function (refChild, newChild) {
            var refIndex = this.childNodes.indexOf(refChild);
            if (refIndex === -1) {
                this.addChild(newChild);
            }
            else {
                if (newChild.parent) {
                    newChild.parent.removeChild(newChild);
                }
                newChild.parent = this;
                this.childNodes.splice(refIndex, 0, newChild);
            }
        };
        DebugElement.prototype.query = function (predicate) {
            var results = this.queryAll(predicate);
            return results[0] || null;
        };
        DebugElement.prototype.queryAll = function (predicate) {
            var matches = [];
            _queryElementChildren(this, predicate, matches);
            return matches;
        };
        DebugElement.prototype.queryAllNodes = function (predicate) {
            var matches = [];
            _queryNodeChildren(this, predicate, matches);
            return matches;
        };
        Object.defineProperty(DebugElement.prototype, "children", {
            get: function () {
                return this.childNodes.filter(function (node) { return node instanceof DebugElement; });
            },
            enumerable: true,
            configurable: true
        });
        DebugElement.prototype.triggerEventHandler = function (eventName, eventObj) {
            this.listeners.forEach(function (listener) {
                if (listener.name == eventName) {
                    listener.callback(eventObj);
                }
            });
        };
        return DebugElement;
    }(DebugNode));
    /**
     * @publicApi
     */
    function asNativeElements(debugEls) {
        return debugEls.map(function (el) { return el.nativeElement; });
    }
    function _queryElementChildren(element, predicate, matches) {
        element.childNodes.forEach(function (node) {
            if (node instanceof DebugElement) {
                if (predicate(node)) {
                    matches.push(node);
                }
                _queryElementChildren(node, predicate, matches);
            }
        });
    }
    function _queryNodeChildren(parentNode, predicate, matches) {
        if (parentNode instanceof DebugElement) {
            parentNode.childNodes.forEach(function (node) {
                if (predicate(node)) {
                    matches.push(node);
                }
                if (node instanceof DebugElement) {
                    _queryNodeChildren(node, predicate, matches);
                }
            });
        }
    }
    // Need to keep the nodes in a global Map so that multiple angular apps are supported.
    var _nativeNodeToDebugNode = new Map();
    /**
     * @publicApi
     */
    function getDebugNode(nativeNode) {
        return _nativeNodeToDebugNode.get(nativeNode) || null;
    }
    function indexDebugNode(node) {
        _nativeNodeToDebugNode.set(node.nativeNode, node);
    }
    function removeDebugNodeFromIndex(node) {
        _nativeNodeToDebugNode.delete(node.nativeNode);
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var DefaultIterableDifferFactory = /** @class */ (function () {
        function DefaultIterableDifferFactory() {
        }
        DefaultIterableDifferFactory.prototype.supports = function (obj) { return isListLikeIterable(obj); };
        DefaultIterableDifferFactory.prototype.create = function (trackByFn) {
            return new DefaultIterableDiffer(trackByFn);
        };
        return DefaultIterableDifferFactory;
    }());
    var trackByIdentity = function (index, item) { return item; };
    /**
     * @deprecated v4.0.0 - Should not be part of public API.
     * @publicApi
     */
    var DefaultIterableDiffer = /** @class */ (function () {
        function DefaultIterableDiffer(trackByFn) {
            this.length = 0;
            // Keeps track of the used records at any point in time (during & across `_check()` calls)
            this._linkedRecords = null;
            // Keeps track of the removed records at any point in time during `_check()` calls.
            this._unlinkedRecords = null;
            this._previousItHead = null;
            this._itHead = null;
            this._itTail = null;
            this._additionsHead = null;
            this._additionsTail = null;
            this._movesHead = null;
            this._movesTail = null;
            this._removalsHead = null;
            this._removalsTail = null;
            // Keeps track of records where custom track by is the same, but item identity has changed
            this._identityChangesHead = null;
            this._identityChangesTail = null;
            this._trackByFn = trackByFn || trackByIdentity;
        }
        DefaultIterableDiffer.prototype.forEachItem = function (fn) {
            var record;
            for (record = this._itHead; record !== null; record = record._next) {
                fn(record);
            }
        };
        DefaultIterableDiffer.prototype.forEachOperation = function (fn) {
            var nextIt = this._itHead;
            var nextRemove = this._removalsHead;
            var addRemoveOffset = 0;
            var moveOffsets = null;
            while (nextIt || nextRemove) {
                // Figure out which is the next record to process
                // Order: remove, add, move
                var record = !nextRemove ||
                    nextIt &&
                        nextIt.currentIndex <
                            getPreviousIndex(nextRemove, addRemoveOffset, moveOffsets) ?
                    nextIt :
                    nextRemove;
                var adjPreviousIndex = getPreviousIndex(record, addRemoveOffset, moveOffsets);
                var currentIndex = record.currentIndex;
                // consume the item, and adjust the addRemoveOffset and update moveDistance if necessary
                if (record === nextRemove) {
                    addRemoveOffset--;
                    nextRemove = nextRemove._nextRemoved;
                }
                else {
                    nextIt = nextIt._next;
                    if (record.previousIndex == null) {
                        addRemoveOffset++;
                    }
                    else {
                        // INVARIANT:  currentIndex < previousIndex
                        if (!moveOffsets)
                            moveOffsets = [];
                        var localMovePreviousIndex = adjPreviousIndex - addRemoveOffset;
                        var localCurrentIndex = currentIndex - addRemoveOffset;
                        if (localMovePreviousIndex != localCurrentIndex) {
                            for (var i = 0; i < localMovePreviousIndex; i++) {
                                var offset = i < moveOffsets.length ? moveOffsets[i] : (moveOffsets[i] = 0);
                                var index = offset + i;
                                if (localCurrentIndex <= index && index < localMovePreviousIndex) {
                                    moveOffsets[i] = offset + 1;
                                }
                            }
                            var previousIndex = record.previousIndex;
                            moveOffsets[previousIndex] = localCurrentIndex - localMovePreviousIndex;
                        }
                    }
                }
                if (adjPreviousIndex !== currentIndex) {
                    fn(record, adjPreviousIndex, currentIndex);
                }
            }
        };
        DefaultIterableDiffer.prototype.forEachPreviousItem = function (fn) {
            var record;
            for (record = this._previousItHead; record !== null; record = record._nextPrevious) {
                fn(record);
            }
        };
        DefaultIterableDiffer.prototype.forEachAddedItem = function (fn) {
            var record;
            for (record = this._additionsHead; record !== null; record = record._nextAdded) {
                fn(record);
            }
        };
        DefaultIterableDiffer.prototype.forEachMovedItem = function (fn) {
            var record;
            for (record = this._movesHead; record !== null; record = record._nextMoved) {
                fn(record);
            }
        };
        DefaultIterableDiffer.prototype.forEachRemovedItem = function (fn) {
            var record;
            for (record = this._removalsHead; record !== null; record = record._nextRemoved) {
                fn(record);
            }
        };
        DefaultIterableDiffer.prototype.forEachIdentityChange = function (fn) {
            var record;
            for (record = this._identityChangesHead; record !== null; record = record._nextIdentityChange) {
                fn(record);
            }
        };
        DefaultIterableDiffer.prototype.diff = function (collection) {
            if (collection == null)
                collection = [];
            if (!isListLikeIterable(collection)) {
                throw new Error("Error trying to diff '" + stringify(collection) + "'. Only arrays and iterables are allowed");
            }
            if (this.check(collection)) {
                return this;
            }
            else {
                return null;
            }
        };
        DefaultIterableDiffer.prototype.onDestroy = function () { };
        DefaultIterableDiffer.prototype.check = function (collection) {
            var _this = this;
            this._reset();
            var record = this._itHead;
            var mayBeDirty = false;
            var index;
            var item;
            var itemTrackBy;
            if (Array.isArray(collection)) {
                this.length = collection.length;
                for (var index_1 = 0; index_1 < this.length; index_1++) {
                    item = collection[index_1];
                    itemTrackBy = this._trackByFn(index_1, item);
                    if (record === null || !looseIdentical(record.trackById, itemTrackBy)) {
                        record = this._mismatch(record, item, itemTrackBy, index_1);
                        mayBeDirty = true;
                    }
                    else {
                        if (mayBeDirty) {
                            // TODO(misko): can we limit this to duplicates only?
                            record = this._verifyReinsertion(record, item, itemTrackBy, index_1);
                        }
                        if (!looseIdentical(record.item, item))
                            this._addIdentityChange(record, item);
                    }
                    record = record._next;
                }
            }
            else {
                index = 0;
                iterateListLike(collection, function (item) {
                    itemTrackBy = _this._trackByFn(index, item);
                    if (record === null || !looseIdentical(record.trackById, itemTrackBy)) {
                        record = _this._mismatch(record, item, itemTrackBy, index);
                        mayBeDirty = true;
                    }
                    else {
                        if (mayBeDirty) {
                            // TODO(misko): can we limit this to duplicates only?
                            record = _this._verifyReinsertion(record, item, itemTrackBy, index);
                        }
                        if (!looseIdentical(record.item, item))
                            _this._addIdentityChange(record, item);
                    }
                    record = record._next;
                    index++;
                });
                this.length = index;
            }
            this._truncate(record);
            this.collection = collection;
            return this.isDirty;
        };
        Object.defineProperty(DefaultIterableDiffer.prototype, "isDirty", {
            /* CollectionChanges is considered dirty if it has any additions, moves, removals, or identity
             * changes.
             */
            get: function () {
                return this._additionsHead !== null || this._movesHead !== null ||
                    this._removalsHead !== null || this._identityChangesHead !== null;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Reset the state of the change objects to show no changes. This means set previousKey to
         * currentKey, and clear all of the queues (additions, moves, removals).
         * Set the previousIndexes of moved and added items to their currentIndexes
         * Reset the list of additions, moves and removals
         *
         * @internal
         */
        DefaultIterableDiffer.prototype._reset = function () {
            if (this.isDirty) {
                var record = void 0;
                var nextRecord = void 0;
                for (record = this._previousItHead = this._itHead; record !== null; record = record._next) {
                    record._nextPrevious = record._next;
                }
                for (record = this._additionsHead; record !== null; record = record._nextAdded) {
                    record.previousIndex = record.currentIndex;
                }
                this._additionsHead = this._additionsTail = null;
                for (record = this._movesHead; record !== null; record = nextRecord) {
                    record.previousIndex = record.currentIndex;
                    nextRecord = record._nextMoved;
                }
                this._movesHead = this._movesTail = null;
                this._removalsHead = this._removalsTail = null;
                this._identityChangesHead = this._identityChangesTail = null;
                // TODO(vicb): when assert gets supported
                // assert(!this.isDirty);
            }
        };
        /**
         * This is the core function which handles differences between collections.
         *
         * - `record` is the record which we saw at this position last time. If null then it is a new
         *   item.
         * - `item` is the current item in the collection
         * - `index` is the position of the item in the collection
         *
         * @internal
         */
        DefaultIterableDiffer.prototype._mismatch = function (record, item, itemTrackBy, index) {
            // The previous record after which we will append the current one.
            var previousRecord;
            if (record === null) {
                previousRecord = this._itTail;
            }
            else {
                previousRecord = record._prev;
                // Remove the record from the collection since we know it does not match the item.
                this._remove(record);
            }
            // Attempt to see if we have seen the item before.
            record = this._linkedRecords === null ? null : this._linkedRecords.get(itemTrackBy, index);
            if (record !== null) {
                // We have seen this before, we need to move it forward in the collection.
                // But first we need to check if identity changed, so we can update in view if necessary
                if (!looseIdentical(record.item, item))
                    this._addIdentityChange(record, item);
                this._moveAfter(record, previousRecord, index);
            }
            else {
                // Never seen it, check evicted list.
                record = this._unlinkedRecords === null ? null : this._unlinkedRecords.get(itemTrackBy, null);
                if (record !== null) {
                    // It is an item which we have evicted earlier: reinsert it back into the list.
                    // But first we need to check if identity changed, so we can update in view if necessary
                    if (!looseIdentical(record.item, item))
                        this._addIdentityChange(record, item);
                    this._reinsertAfter(record, previousRecord, index);
                }
                else {
                    // It is a new item: add it.
                    record =
                        this._addAfter(new IterableChangeRecord_(item, itemTrackBy), previousRecord, index);
                }
            }
            return record;
        };
        /**
         * This check is only needed if an array contains duplicates. (Short circuit of nothing dirty)
         *
         * Use case: `[a, a]` => `[b, a, a]`
         *
         * If we did not have this check then the insertion of `b` would:
         *   1) evict first `a`
         *   2) insert `b` at `0` index.
         *   3) leave `a` at index `1` as is. <-- this is wrong!
         *   3) reinsert `a` at index 2. <-- this is wrong!
         *
         * The correct behavior is:
         *   1) evict first `a`
         *   2) insert `b` at `0` index.
         *   3) reinsert `a` at index 1.
         *   3) move `a` at from `1` to `2`.
         *
         *
         * Double check that we have not evicted a duplicate item. We need to check if the item type may
         * have already been removed:
         * The insertion of b will evict the first 'a'. If we don't reinsert it now it will be reinserted
         * at the end. Which will show up as the two 'a's switching position. This is incorrect, since a
         * better way to think of it is as insert of 'b' rather then switch 'a' with 'b' and then add 'a'
         * at the end.
         *
         * @internal
         */
        DefaultIterableDiffer.prototype._verifyReinsertion = function (record, item, itemTrackBy, index) {
            var reinsertRecord = this._unlinkedRecords === null ? null : this._unlinkedRecords.get(itemTrackBy, null);
            if (reinsertRecord !== null) {
                record = this._reinsertAfter(reinsertRecord, record._prev, index);
            }
            else if (record.currentIndex != index) {
                record.currentIndex = index;
                this._addToMoves(record, index);
            }
            return record;
        };
        /**
         * Get rid of any excess {@link IterableChangeRecord_}s from the previous collection
         *
         * - `record` The first excess {@link IterableChangeRecord_}.
         *
         * @internal
         */
        DefaultIterableDiffer.prototype._truncate = function (record) {
            // Anything after that needs to be removed;
            while (record !== null) {
                var nextRecord = record._next;
                this._addToRemovals(this._unlink(record));
                record = nextRecord;
            }
            if (this._unlinkedRecords !== null) {
                this._unlinkedRecords.clear();
            }
            if (this._additionsTail !== null) {
                this._additionsTail._nextAdded = null;
            }
            if (this._movesTail !== null) {
                this._movesTail._nextMoved = null;
            }
            if (this._itTail !== null) {
                this._itTail._next = null;
            }
            if (this._removalsTail !== null) {
                this._removalsTail._nextRemoved = null;
            }
            if (this._identityChangesTail !== null) {
                this._identityChangesTail._nextIdentityChange = null;
            }
        };
        /** @internal */
        DefaultIterableDiffer.prototype._reinsertAfter = function (record, prevRecord, index) {
            if (this._unlinkedRecords !== null) {
                this._unlinkedRecords.remove(record);
            }
            var prev = record._prevRemoved;
            var next = record._nextRemoved;
            if (prev === null) {
                this._removalsHead = next;
            }
            else {
                prev._nextRemoved = next;
            }
            if (next === null) {
                this._removalsTail = prev;
            }
            else {
                next._prevRemoved = prev;
            }
            this._insertAfter(record, prevRecord, index);
            this._addToMoves(record, index);
            return record;
        };
        /** @internal */
        DefaultIterableDiffer.prototype._moveAfter = function (record, prevRecord, index) {
            this._unlink(record);
            this._insertAfter(record, prevRecord, index);
            this._addToMoves(record, index);
            return record;
        };
        /** @internal */
        DefaultIterableDiffer.prototype._addAfter = function (record, prevRecord, index) {
            this._insertAfter(record, prevRecord, index);
            if (this._additionsTail === null) {
                // TODO(vicb):
                // assert(this._additionsHead === null);
                this._additionsTail = this._additionsHead = record;
            }
            else {
                // TODO(vicb):
                // assert(_additionsTail._nextAdded === null);
                // assert(record._nextAdded === null);
                this._additionsTail = this._additionsTail._nextAdded = record;
            }
            return record;
        };
        /** @internal */
        DefaultIterableDiffer.prototype._insertAfter = function (record, prevRecord, index) {
            // TODO(vicb):
            // assert(record != prevRecord);
            // assert(record._next === null);
            // assert(record._prev === null);
            var next = prevRecord === null ? this._itHead : prevRecord._next;
            // TODO(vicb):
            // assert(next != record);
            // assert(prevRecord != record);
            record._next = next;
            record._prev = prevRecord;
            if (next === null) {
                this._itTail = record;
            }
            else {
                next._prev = record;
            }
            if (prevRecord === null) {
                this._itHead = record;
            }
            else {
                prevRecord._next = record;
            }
            if (this._linkedRecords === null) {
                this._linkedRecords = new _DuplicateMap();
            }
            this._linkedRecords.put(record);
            record.currentIndex = index;
            return record;
        };
        /** @internal */
        DefaultIterableDiffer.prototype._remove = function (record) {
            return this._addToRemovals(this._unlink(record));
        };
        /** @internal */
        DefaultIterableDiffer.prototype._unlink = function (record) {
            if (this._linkedRecords !== null) {
                this._linkedRecords.remove(record);
            }
            var prev = record._prev;
            var next = record._next;
            // TODO(vicb):
            // assert((record._prev = null) === null);
            // assert((record._next = null) === null);
            if (prev === null) {
                this._itHead = next;
            }
            else {
                prev._next = next;
            }
            if (next === null) {
                this._itTail = prev;
            }
            else {
                next._prev = prev;
            }
            return record;
        };
        /** @internal */
        DefaultIterableDiffer.prototype._addToMoves = function (record, toIndex) {
            // TODO(vicb):
            // assert(record._nextMoved === null);
            if (record.previousIndex === toIndex) {
                return record;
            }
            if (this._movesTail === null) {
                // TODO(vicb):
                // assert(_movesHead === null);
                this._movesTail = this._movesHead = record;
            }
            else {
                // TODO(vicb):
                // assert(_movesTail._nextMoved === null);
                this._movesTail = this._movesTail._nextMoved = record;
            }
            return record;
        };
        DefaultIterableDiffer.prototype._addToRemovals = function (record) {
            if (this._unlinkedRecords === null) {
                this._unlinkedRecords = new _DuplicateMap();
            }
            this._unlinkedRecords.put(record);
            record.currentIndex = null;
            record._nextRemoved = null;
            if (this._removalsTail === null) {
                // TODO(vicb):
                // assert(_removalsHead === null);
                this._removalsTail = this._removalsHead = record;
                record._prevRemoved = null;
            }
            else {
                // TODO(vicb):
                // assert(_removalsTail._nextRemoved === null);
                // assert(record._nextRemoved === null);
                record._prevRemoved = this._removalsTail;
                this._removalsTail = this._removalsTail._nextRemoved = record;
            }
            return record;
        };
        /** @internal */
        DefaultIterableDiffer.prototype._addIdentityChange = function (record, item) {
            record.item = item;
            if (this._identityChangesTail === null) {
                this._identityChangesTail = this._identityChangesHead = record;
            }
            else {
                this._identityChangesTail = this._identityChangesTail._nextIdentityChange = record;
            }
            return record;
        };
        return DefaultIterableDiffer;
    }());
    var IterableChangeRecord_ = /** @class */ (function () {
        function IterableChangeRecord_(item, trackById) {
            this.item = item;
            this.trackById = trackById;
            this.currentIndex = null;
            this.previousIndex = null;
            /** @internal */
            this._nextPrevious = null;
            /** @internal */
            this._prev = null;
            /** @internal */
            this._next = null;
            /** @internal */
            this._prevDup = null;
            /** @internal */
            this._nextDup = null;
            /** @internal */
            this._prevRemoved = null;
            /** @internal */
            this._nextRemoved = null;
            /** @internal */
            this._nextAdded = null;
            /** @internal */
            this._nextMoved = null;
            /** @internal */
            this._nextIdentityChange = null;
        }
        return IterableChangeRecord_;
    }());
    // A linked list of CollectionChangeRecords with the same IterableChangeRecord_.item
    var _DuplicateItemRecordList = /** @class */ (function () {
        function _DuplicateItemRecordList() {
            /** @internal */
            this._head = null;
            /** @internal */
            this._tail = null;
        }
        /**
         * Append the record to the list of duplicates.
         *
         * Note: by design all records in the list of duplicates hold the same value in record.item.
         */
        _DuplicateItemRecordList.prototype.add = function (record) {
            if (this._head === null) {
                this._head = this._tail = record;
                record._nextDup = null;
                record._prevDup = null;
            }
            else {
                // TODO(vicb):
                // assert(record.item ==  _head.item ||
                //       record.item is num && record.item.isNaN && _head.item is num && _head.item.isNaN);
                this._tail._nextDup = record;
                record._prevDup = this._tail;
                record._nextDup = null;
                this._tail = record;
            }
        };
        // Returns a IterableChangeRecord_ having IterableChangeRecord_.trackById == trackById and
        // IterableChangeRecord_.currentIndex >= atOrAfterIndex
        _DuplicateItemRecordList.prototype.get = function (trackById, atOrAfterIndex) {
            var record;
            for (record = this._head; record !== null; record = record._nextDup) {
                if ((atOrAfterIndex === null || atOrAfterIndex <= record.currentIndex) &&
                    looseIdentical(record.trackById, trackById)) {
                    return record;
                }
            }
            return null;
        };
        /**
         * Remove one {@link IterableChangeRecord_} from the list of duplicates.
         *
         * Returns whether the list of duplicates is empty.
         */
        _DuplicateItemRecordList.prototype.remove = function (record) {
            // TODO(vicb):
            // assert(() {
            //  // verify that the record being removed is in the list.
            //  for (IterableChangeRecord_ cursor = _head; cursor != null; cursor = cursor._nextDup) {
            //    if (identical(cursor, record)) return true;
            //  }
            //  return false;
            //});
            var prev = record._prevDup;
            var next = record._nextDup;
            if (prev === null) {
                this._head = next;
            }
            else {
                prev._nextDup = next;
            }
            if (next === null) {
                this._tail = prev;
            }
            else {
                next._prevDup = prev;
            }
            return this._head === null;
        };
        return _DuplicateItemRecordList;
    }());
    var _DuplicateMap = /** @class */ (function () {
        function _DuplicateMap() {
            this.map = new Map();
        }
        _DuplicateMap.prototype.put = function (record) {
            var key = record.trackById;
            var duplicates = this.map.get(key);
            if (!duplicates) {
                duplicates = new _DuplicateItemRecordList();
                this.map.set(key, duplicates);
            }
            duplicates.add(record);
        };
        /**
         * Retrieve the `value` using key. Because the IterableChangeRecord_ value may be one which we
         * have already iterated over, we use the `atOrAfterIndex` to pretend it is not there.
         *
         * Use case: `[a, b, c, a, a]` if we are at index `3` which is the second `a` then asking if we
         * have any more `a`s needs to return the second `a`.
         */
        _DuplicateMap.prototype.get = function (trackById, atOrAfterIndex) {
            var key = trackById;
            var recordList = this.map.get(key);
            return recordList ? recordList.get(trackById, atOrAfterIndex) : null;
        };
        /**
         * Removes a {@link IterableChangeRecord_} from the list of duplicates.
         *
         * The list of duplicates also is removed from the map if it gets empty.
         */
        _DuplicateMap.prototype.remove = function (record) {
            var key = record.trackById;
            var recordList = this.map.get(key);
            // Remove the list of duplicates when it gets empty
            if (recordList.remove(record)) {
                this.map.delete(key);
            }
            return record;
        };
        Object.defineProperty(_DuplicateMap.prototype, "isEmpty", {
            get: function () { return this.map.size === 0; },
            enumerable: true,
            configurable: true
        });
        _DuplicateMap.prototype.clear = function () { this.map.clear(); };
        return _DuplicateMap;
    }());
    function getPreviousIndex(item, addRemoveOffset, moveOffsets) {
        var previousIndex = item.previousIndex;
        if (previousIndex === null)
            return previousIndex;
        var moveOffset = 0;
        if (moveOffsets && previousIndex < moveOffsets.length) {
            moveOffset = moveOffsets[previousIndex];
        }
        return previousIndex + addRemoveOffset + moveOffset;
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var DefaultKeyValueDifferFactory = /** @class */ (function () {
        function DefaultKeyValueDifferFactory() {
        }
        DefaultKeyValueDifferFactory.prototype.supports = function (obj) { return obj instanceof Map || isJsObject(obj); };
        DefaultKeyValueDifferFactory.prototype.create = function () { return new DefaultKeyValueDiffer(); };
        return DefaultKeyValueDifferFactory;
    }());
    var DefaultKeyValueDiffer = /** @class */ (function () {
        function DefaultKeyValueDiffer() {
            this._records = new Map();
            this._mapHead = null;
            // _appendAfter is used in the check loop
            this._appendAfter = null;
            this._previousMapHead = null;
            this._changesHead = null;
            this._changesTail = null;
            this._additionsHead = null;
            this._additionsTail = null;
            this._removalsHead = null;
            this._removalsTail = null;
        }
        Object.defineProperty(DefaultKeyValueDiffer.prototype, "isDirty", {
            get: function () {
                return this._additionsHead !== null || this._changesHead !== null ||
                    this._removalsHead !== null;
            },
            enumerable: true,
            configurable: true
        });
        DefaultKeyValueDiffer.prototype.forEachItem = function (fn) {
            var record;
            for (record = this._mapHead; record !== null; record = record._next) {
                fn(record);
            }
        };
        DefaultKeyValueDiffer.prototype.forEachPreviousItem = function (fn) {
            var record;
            for (record = this._previousMapHead; record !== null; record = record._nextPrevious) {
                fn(record);
            }
        };
        DefaultKeyValueDiffer.prototype.forEachChangedItem = function (fn) {
            var record;
            for (record = this._changesHead; record !== null; record = record._nextChanged) {
                fn(record);
            }
        };
        DefaultKeyValueDiffer.prototype.forEachAddedItem = function (fn) {
            var record;
            for (record = this._additionsHead; record !== null; record = record._nextAdded) {
                fn(record);
            }
        };
        DefaultKeyValueDiffer.prototype.forEachRemovedItem = function (fn) {
            var record;
            for (record = this._removalsHead; record !== null; record = record._nextRemoved) {
                fn(record);
            }
        };
        DefaultKeyValueDiffer.prototype.diff = function (map) {
            if (!map) {
                map = new Map();
            }
            else if (!(map instanceof Map || isJsObject(map))) {
                throw new Error("Error trying to diff '" + stringify(map) + "'. Only maps and objects are allowed");
            }
            return this.check(map) ? this : null;
        };
        DefaultKeyValueDiffer.prototype.onDestroy = function () { };
        /**
         * Check the current state of the map vs the previous.
         * The algorithm is optimised for when the keys do no change.
         */
        DefaultKeyValueDiffer.prototype.check = function (map) {
            var _this = this;
            this._reset();
            var insertBefore = this._mapHead;
            this._appendAfter = null;
            this._forEach(map, function (value, key) {
                if (insertBefore && insertBefore.key === key) {
                    _this._maybeAddToChanges(insertBefore, value);
                    _this._appendAfter = insertBefore;
                    insertBefore = insertBefore._next;
                }
                else {
                    var record = _this._getOrCreateRecordForKey(key, value);
                    insertBefore = _this._insertBeforeOrAppend(insertBefore, record);
                }
            });
            // Items remaining at the end of the list have been deleted
            if (insertBefore) {
                if (insertBefore._prev) {
                    insertBefore._prev._next = null;
                }
                this._removalsHead = insertBefore;
                for (var record = insertBefore; record !== null; record = record._nextRemoved) {
                    if (record === this._mapHead) {
                        this._mapHead = null;
                    }
                    this._records.delete(record.key);
                    record._nextRemoved = record._next;
                    record.previousValue = record.currentValue;
                    record.currentValue = null;
                    record._prev = null;
                    record._next = null;
                }
            }
            // Make sure tails have no next records from previous runs
            if (this._changesTail)
                this._changesTail._nextChanged = null;
            if (this._additionsTail)
                this._additionsTail._nextAdded = null;
            return this.isDirty;
        };
        /**
         * Inserts a record before `before` or append at the end of the list when `before` is null.
         *
         * Notes:
         * - This method appends at `this._appendAfter`,
         * - This method updates `this._appendAfter`,
         * - The return value is the new value for the insertion pointer.
         */
        DefaultKeyValueDiffer.prototype._insertBeforeOrAppend = function (before, record) {
            if (before) {
                var prev = before._prev;
                record._next = before;
                record._prev = prev;
                before._prev = record;
                if (prev) {
                    prev._next = record;
                }
                if (before === this._mapHead) {
                    this._mapHead = record;
                }
                this._appendAfter = before;
                return before;
            }
            if (this._appendAfter) {
                this._appendAfter._next = record;
                record._prev = this._appendAfter;
            }
            else {
                this._mapHead = record;
            }
            this._appendAfter = record;
            return null;
        };
        DefaultKeyValueDiffer.prototype._getOrCreateRecordForKey = function (key, value) {
            if (this._records.has(key)) {
                var record_1 = this._records.get(key);
                this._maybeAddToChanges(record_1, value);
                var prev = record_1._prev;
                var next = record_1._next;
                if (prev) {
                    prev._next = next;
                }
                if (next) {
                    next._prev = prev;
                }
                record_1._next = null;
                record_1._prev = null;
                return record_1;
            }
            var record = new KeyValueChangeRecord_(key);
            this._records.set(key, record);
            record.currentValue = value;
            this._addToAdditions(record);
            return record;
        };
        /** @internal */
        DefaultKeyValueDiffer.prototype._reset = function () {
            if (this.isDirty) {
                var record = void 0;
                // let `_previousMapHead` contain the state of the map before the changes
                this._previousMapHead = this._mapHead;
                for (record = this._previousMapHead; record !== null; record = record._next) {
                    record._nextPrevious = record._next;
                }
                // Update `record.previousValue` with the value of the item before the changes
                // We need to update all changed items (that's those which have been added and changed)
                for (record = this._changesHead; record !== null; record = record._nextChanged) {
                    record.previousValue = record.currentValue;
                }
                for (record = this._additionsHead; record != null; record = record._nextAdded) {
                    record.previousValue = record.currentValue;
                }
                this._changesHead = this._changesTail = null;
                this._additionsHead = this._additionsTail = null;
                this._removalsHead = null;
            }
        };
        // Add the record or a given key to the list of changes only when the value has actually changed
        DefaultKeyValueDiffer.prototype._maybeAddToChanges = function (record, newValue) {
            if (!looseIdentical(newValue, record.currentValue)) {
                record.previousValue = record.currentValue;
                record.currentValue = newValue;
                this._addToChanges(record);
            }
        };
        DefaultKeyValueDiffer.prototype._addToAdditions = function (record) {
            if (this._additionsHead === null) {
                this._additionsHead = this._additionsTail = record;
            }
            else {
                this._additionsTail._nextAdded = record;
                this._additionsTail = record;
            }
        };
        DefaultKeyValueDiffer.prototype._addToChanges = function (record) {
            if (this._changesHead === null) {
                this._changesHead = this._changesTail = record;
            }
            else {
                this._changesTail._nextChanged = record;
                this._changesTail = record;
            }
        };
        /** @internal */
        DefaultKeyValueDiffer.prototype._forEach = function (obj, fn) {
            if (obj instanceof Map) {
                obj.forEach(fn);
            }
            else {
                Object.keys(obj).forEach(function (k) { return fn(obj[k], k); });
            }
        };
        return DefaultKeyValueDiffer;
    }());
    var KeyValueChangeRecord_ = /** @class */ (function () {
        function KeyValueChangeRecord_(key) {
            this.key = key;
            this.previousValue = null;
            this.currentValue = null;
            /** @internal */
            this._nextPrevious = null;
            /** @internal */
            this._next = null;
            /** @internal */
            this._prev = null;
            /** @internal */
            this._nextAdded = null;
            /** @internal */
            this._nextRemoved = null;
            /** @internal */
            this._nextChanged = null;
        }
        return KeyValueChangeRecord_;
    }());

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * A repository of different iterable diffing strategies used by NgFor, NgClass, and others.
     *
     * @publicApi
     */
    var IterableDiffers = /** @class */ (function () {
        function IterableDiffers(factories) {
            this.factories = factories;
        }
        IterableDiffers.create = function (factories, parent) {
            if (parent != null) {
                var copied = parent.factories.slice();
                factories = factories.concat(copied);
            }
            return new IterableDiffers(factories);
        };
        /**
         * Takes an array of {@link IterableDifferFactory} and returns a provider used to extend the
         * inherited {@link IterableDiffers} instance with the provided factories and return a new
         * {@link IterableDiffers} instance.
         *
         * @usageNotes
         * ### Example
         *
         * The following example shows how to extend an existing list of factories,
         * which will only be applied to the injector for this component and its children.
         * This step is all that's required to make a new {@link IterableDiffer} available.
         *
         * ```
         * @Component({
         *   viewProviders: [
         *     IterableDiffers.extend([new ImmutableListDiffer()])
         *   ]
         * })
         * ```
         */
        IterableDiffers.extend = function (factories) {
            return {
                provide: IterableDiffers,
                useFactory: function (parent) {
                    if (!parent) {
                        // Typically would occur when calling IterableDiffers.extend inside of dependencies passed
                        // to
                        // bootstrap(), which would override default pipes instead of extending them.
                        throw new Error('Cannot extend IterableDiffers without a parent injector');
                    }
                    return IterableDiffers.create(factories, parent);
                },
                // Dependency technically isn't optional, but we can provide a better error message this way.
                deps: [[IterableDiffers, new SkipSelf(), new Optional()]]
            };
        };
        IterableDiffers.prototype.find = function (iterable) {
            var factory = this.factories.find(function (f) { return f.supports(iterable); });
            if (factory != null) {
                return factory;
            }
            else {
                throw new Error("Cannot find a differ supporting object '" + iterable + "' of type '" + getTypeNameForDebugging(iterable) + "'");
            }
        };
        IterableDiffers.ngInjectableDef = defineInjectable({
            providedIn: 'root',
            factory: function () { return new IterableDiffers([new DefaultIterableDifferFactory()]); }
        });
        return IterableDiffers;
    }());
    function getTypeNameForDebugging(type) {
        return type['name'] || typeof type;
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * A repository of different Map diffing strategies used by NgClass, NgStyle, and others.
     *
     * @publicApi
     */
    var KeyValueDiffers = /** @class */ (function () {
        function KeyValueDiffers(factories) {
            this.factories = factories;
        }
        KeyValueDiffers.create = function (factories, parent) {
            if (parent) {
                var copied = parent.factories.slice();
                factories = factories.concat(copied);
            }
            return new KeyValueDiffers(factories);
        };
        /**
         * Takes an array of {@link KeyValueDifferFactory} and returns a provider used to extend the
         * inherited {@link KeyValueDiffers} instance with the provided factories and return a new
         * {@link KeyValueDiffers} instance.
         *
         * @usageNotes
         * ### Example
         *
         * The following example shows how to extend an existing list of factories,
         * which will only be applied to the injector for this component and its children.
         * This step is all that's required to make a new {@link KeyValueDiffer} available.
         *
         * ```
         * @Component({
         *   viewProviders: [
         *     KeyValueDiffers.extend([new ImmutableMapDiffer()])
         *   ]
         * })
         * ```
         */
        KeyValueDiffers.extend = function (factories) {
            return {
                provide: KeyValueDiffers,
                useFactory: function (parent) {
                    if (!parent) {
                        // Typically would occur when calling KeyValueDiffers.extend inside of dependencies passed
                        // to bootstrap(), which would override default pipes instead of extending them.
                        throw new Error('Cannot extend KeyValueDiffers without a parent injector');
                    }
                    return KeyValueDiffers.create(factories, parent);
                },
                // Dependency technically isn't optional, but we can provide a better error message this way.
                deps: [[KeyValueDiffers, new SkipSelf(), new Optional()]]
            };
        };
        KeyValueDiffers.prototype.find = function (kv) {
            var factory = this.factories.find(function (f) { return f.supports(kv); });
            if (factory) {
                return factory;
            }
            throw new Error("Cannot find a differ supporting object '" + kv + "'");
        };
        return KeyValueDiffers;
    }());

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Structural diffing for `Object`s and `Map`s.
     */
    var keyValDiff = [new DefaultKeyValueDifferFactory()];
    /**
     * Structural diffing for `Iterable` types such as `Array`s.
     */
    var iterableDiff = [new DefaultIterableDifferFactory()];
    var defaultIterableDiffers = new IterableDiffers(iterableDiff);
    var defaultKeyValueDiffers = new KeyValueDiffers(keyValDiff);

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
    var _CORE_PLATFORM_PROVIDERS = [
        // Set a default platform name for platforms that don't set it explicitly.
        { provide: PLATFORM_ID, useValue: 'unknown' },
        { provide: PlatformRef, deps: [Injector] },
        { provide: TestabilityRegistry, deps: [] },
        { provide: Console, deps: [] },
    ];
    /**
     * This platform has to be included in any other platform
     *
     * @publicApi
     */
    var platformCore = createPlatformFactory(null, 'core', _CORE_PLATFORM_PROVIDERS);

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Provide this token to set the locale of your application.
     * It is used for i18n extraction, by i18n pipes (DatePipe, I18nPluralPipe, CurrencyPipe,
     * DecimalPipe and PercentPipe) and by ICU expressions.
     *
     * See the [i18n guide](guide/i18n#setting-up-locale) for more information.
     *
     * @usageNotes
     * ### Example
     *
     * ```typescript
     * import { LOCALE_ID } from '@angular/core';
     * import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
     * import { AppModule } from './app/app.module';
     *
     * platformBrowserDynamic().bootstrapModule(AppModule, {
     *   providers: [{provide: LOCALE_ID, useValue: 'en-US' }]
     * });
     * ```
     *
     * @publicApi
     */
    var LOCALE_ID = new InjectionToken('LocaleId');
    /**
     * Use this token at bootstrap to provide the content of your translation file (`xtb`,
     * `xlf` or `xlf2`) when you want to translate your application in another language.
     *
     * See the [i18n guide](guide/i18n#merge) for more information.
     *
     * @usageNotes
     * ### Example
     *
     * ```typescript
     * import { TRANSLATIONS } from '@angular/core';
     * import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
     * import { AppModule } from './app/app.module';
     *
     * // content of your translation file
     * const translations = '....';
     *
     * platformBrowserDynamic().bootstrapModule(AppModule, {
     *   providers: [{provide: TRANSLATIONS, useValue: translations }]
     * });
     * ```
     *
     * @publicApi
     */
    var TRANSLATIONS = new InjectionToken('Translations');
    /**
     * Provide this token at bootstrap to set the format of your {@link TRANSLATIONS}: `xtb`,
     * `xlf` or `xlf2`.
     *
     * See the [i18n guide](guide/i18n#merge) for more information.
     *
     * @usageNotes
     * ### Example
     *
     * ```typescript
     * import { TRANSLATIONS_FORMAT } from '@angular/core';
     * import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
     * import { AppModule } from './app/app.module';
     *
     * platformBrowserDynamic().bootstrapModule(AppModule, {
     *   providers: [{provide: TRANSLATIONS_FORMAT, useValue: 'xlf' }]
     * });
     * ```
     *
     * @publicApi
     */
    var TRANSLATIONS_FORMAT = new InjectionToken('TranslationsFormat');
    (function (MissingTranslationStrategy) {
        MissingTranslationStrategy[MissingTranslationStrategy["Error"] = 0] = "Error";
        MissingTranslationStrategy[MissingTranslationStrategy["Warning"] = 1] = "Warning";
        MissingTranslationStrategy[MissingTranslationStrategy["Ignore"] = 2] = "Ignore";
    })(exports.MissingTranslationStrategy || (exports.MissingTranslationStrategy = {}));

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    function _iterableDiffersFactory() {
        return defaultIterableDiffers;
    }
    function _keyValueDiffersFactory() {
        return defaultKeyValueDiffers;
    }
    function _localeFactory(locale) {
        return locale || 'en-US';
    }
    /**
     * A built-in [dependency injection token](guide/glossary#di-token)
     * that is used to configure the root injector for bootstrapping.
     */
    var APPLICATION_MODULE_PROVIDERS = [
        {
            provide: ApplicationRef,
            useClass: ApplicationRef,
            deps: [NgZone, Console, Injector, ErrorHandler, ComponentFactoryResolver, ApplicationInitStatus]
        },
        {
            provide: ApplicationInitStatus,
            useClass: ApplicationInitStatus,
            deps: [[new Optional(), APP_INITIALIZER]]
        },
        { provide: Compiler, useClass: Compiler, deps: [] },
        APP_ID_RANDOM_PROVIDER,
        { provide: IterableDiffers, useFactory: _iterableDiffersFactory, deps: [] },
        { provide: KeyValueDiffers, useFactory: _keyValueDiffersFactory, deps: [] },
        {
            provide: LOCALE_ID,
            useFactory: _localeFactory,
            deps: [[new Inject(LOCALE_ID), new Optional(), new SkipSelf()]]
        },
    ];
    /**
     * Configures the root injector for an app with
     * providers of `@angular/core` dependencies that `ApplicationRef` needs
     * to bootstrap components.
     *
     * Re-exported by `BrowserModule`, which is included automatically in the root
     * `AppModule` when you create a new app with the CLI `new` command.
     *
     * @publicApi
     */
    var ApplicationModule = /** @class */ (function () {
        // Inject ApplicationRef to make it eager...
        function ApplicationModule(appRef) {
        }
        ApplicationModule = __decorate([
            NgModule({ providers: APPLICATION_MODULE_PROVIDERS }),
            __metadata("design:paramtypes", [ApplicationRef])
        ], ApplicationModule);
        return ApplicationModule;
    }());

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    // Called before each cycle of a view's check to detect whether this is in the
    // initState for which we need to call ngOnInit, ngAfterContentInit or ngAfterViewInit
    // lifecycle methods. Returns true if this check cycle should call lifecycle
    // methods.
    function shiftInitState(view, priorInitState, newInitState) {
        // Only update the InitState if we are currently in the prior state.
        // For example, only move into CallingInit if we are in BeforeInit. Only
        // move into CallingContentInit if we are in CallingInit. Normally this will
        // always be true because of how checkCycle is called in checkAndUpdateView.
        // However, if checkAndUpdateView is called recursively or if an exception is
        // thrown while checkAndUpdateView is running, checkAndUpdateView starts over
        // from the beginning. This ensures the state is monotonically increasing,
        // terminating in the AfterInit state, which ensures the Init methods are called
        // at least once and only once.
        var state = view.state;
        var initState = state & 1792 /* InitState_Mask */;
        if (initState === priorInitState) {
            view.state = (state & ~1792 /* InitState_Mask */) | newInitState;
            view.initIndex = -1;
            return true;
        }
        return initState === newInitState;
    }
    // Returns true if the lifecycle init method should be called for the node with
    // the given init index.
    function shouldCallLifecycleInitHook(view, initState, index) {
        if ((view.state & 1792 /* InitState_Mask */) === initState && view.initIndex <= index) {
            view.initIndex = index + 1;
            return true;
        }
        return false;
    }
    /**
     * Accessor for view.nodes, enforcing that every usage site stays monomorphic.
     */
    function asTextData(view, index) {
        return view.nodes[index];
    }
    /**
     * Accessor for view.nodes, enforcing that every usage site stays monomorphic.
     */
    function asElementData(view, index) {
        return view.nodes[index];
    }
    /**
     * Accessor for view.nodes, enforcing that every usage site stays monomorphic.
     */
    function asProviderData(view, index) {
        return view.nodes[index];
    }
    /**
     * Accessor for view.nodes, enforcing that every usage site stays monomorphic.
     */
    function asPureExpressionData(view, index) {
        return view.nodes[index];
    }
    /**
     * Accessor for view.nodes, enforcing that every usage site stays monomorphic.
     */
    function asQueryList(view, index) {
        return view.nodes[index];
    }
    var DebugContext = /** @class */ (function () {
        function DebugContext() {
        }
        return DebugContext;
    }());
    /**
     * This object is used to prevent cycles in the source files and to have a place where
     * debug mode can hook it. It is lazily filled when `isDevMode` is known.
     */
    var Services = {
        setCurrentNode: undefined,
        createRootView: undefined,
        createEmbeddedView: undefined,
        createComponentView: undefined,
        createNgModuleRef: undefined,
        overrideProvider: undefined,
        overrideComponentView: undefined,
        clearOverrides: undefined,
        checkAndUpdateView: undefined,
        checkNoChangesView: undefined,
        destroyView: undefined,
        resolveDep: undefined,
        createDebugContext: undefined,
        handleEvent: undefined,
        updateDirectives: undefined,
        updateRenderer: undefined,
        dirtyParentQueries: undefined,
    };

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    function expressionChangedAfterItHasBeenCheckedError(context, oldValue, currValue, isFirstCheck) {
        var msg = "ExpressionChangedAfterItHasBeenCheckedError: Expression has changed after it was checked. Previous value: '" + oldValue + "'. Current value: '" + currValue + "'.";
        if (isFirstCheck) {
            msg +=
                " It seems like the view has been created after its parent and its children have been dirty checked." +
                    " Has it been created in a change detection hook ?";
        }
        return viewDebugError(msg, context);
    }
    function viewWrappedDebugError(err, context) {
        if (!(err instanceof Error)) {
            // errors that are not Error instances don't have a stack,
            // so it is ok to wrap them into a new Error object...
            err = new Error(err.toString());
        }
        _addDebugContext(err, context);
        return err;
    }
    function viewDebugError(msg, context) {
        var err = new Error(msg);
        _addDebugContext(err, context);
        return err;
    }
    function _addDebugContext(err, context) {
        err[ERROR_DEBUG_CONTEXT] = context;
        err[ERROR_LOGGER] = context.logError.bind(context);
    }
    function isViewDebugError(err) {
        return !!getDebugContext(err);
    }
    function viewDestroyedError(action) {
        return new Error("ViewDestroyedError: Attempt to use a destroyed view: " + action);
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var NOOP = function () { };
    var _tokenKeyCache = new Map();
    function tokenKey(token) {
        var key = _tokenKeyCache.get(token);
        if (!key) {
            key = stringify(token) + '_' + _tokenKeyCache.size;
            _tokenKeyCache.set(token, key);
        }
        return key;
    }
    function unwrapValue(view, nodeIdx, bindingIdx, value) {
        if (WrappedValue.isWrapped(value)) {
            value = WrappedValue.unwrap(value);
            var globalBindingIdx = view.def.nodes[nodeIdx].bindingIndex + bindingIdx;
            var oldValue = WrappedValue.unwrap(view.oldValues[globalBindingIdx]);
            view.oldValues[globalBindingIdx] = new WrappedValue(oldValue);
        }
        return value;
    }
    var UNDEFINED_RENDERER_TYPE_ID = '$$undefined';
    var EMPTY_RENDERER_TYPE_ID = '$$empty';
    // Attention: this function is called as top level function.
    // Putting any logic in here will destroy closure tree shaking!
    function createRendererType2(values) {
        return {
            id: UNDEFINED_RENDERER_TYPE_ID,
            styles: values.styles,
            encapsulation: values.encapsulation,
            data: values.data
        };
    }
    var _renderCompCount$1 = 0;
    function resolveRendererType2(type) {
        if (type && type.id === UNDEFINED_RENDERER_TYPE_ID) {
            // first time we see this RendererType2. Initialize it...
            var isFilled = ((type.encapsulation != null && type.encapsulation !== exports.ViewEncapsulation.None) ||
                type.styles.length || Object.keys(type.data).length);
            if (isFilled) {
                type.id = "c" + _renderCompCount$1++;
            }
            else {
                type.id = EMPTY_RENDERER_TYPE_ID;
            }
        }
        if (type && type.id === EMPTY_RENDERER_TYPE_ID) {
            type = null;
        }
        return type || null;
    }
    function checkBinding(view, def, bindingIdx, value) {
        var oldValues = view.oldValues;
        if ((view.state & 2 /* FirstCheck */) ||
            !looseIdentical(oldValues[def.bindingIndex + bindingIdx], value)) {
            return true;
        }
        return false;
    }
    function checkAndUpdateBinding(view, def, bindingIdx, value) {
        if (checkBinding(view, def, bindingIdx, value)) {
            view.oldValues[def.bindingIndex + bindingIdx] = value;
            return true;
        }
        return false;
    }
    function checkBindingNoChanges(view, def, bindingIdx, value) {
        var oldValue = view.oldValues[def.bindingIndex + bindingIdx];
        if ((view.state & 1 /* BeforeFirstCheck */) || !devModeEqual(oldValue, value)) {
            var bindingName = def.bindings[bindingIdx].name;
            throw expressionChangedAfterItHasBeenCheckedError(Services.createDebugContext(view, def.nodeIndex), bindingName + ": " + oldValue, bindingName + ": " + value, (view.state & 1 /* BeforeFirstCheck */) !== 0);
        }
    }
    function markParentViewsForCheck(view) {
        var currView = view;
        while (currView) {
            if (currView.def.flags & 2 /* OnPush */) {
                currView.state |= 8 /* ChecksEnabled */;
            }
            currView = currView.viewContainerParent || currView.parent;
        }
    }
    function markParentViewsForCheckProjectedViews(view, endView) {
        var currView = view;
        while (currView && currView !== endView) {
            currView.state |= 64 /* CheckProjectedViews */;
            currView = currView.viewContainerParent || currView.parent;
        }
    }
    function dispatchEvent(view, nodeIndex, eventName, event) {
        try {
            var nodeDef = view.def.nodes[nodeIndex];
            var startView = nodeDef.flags & 33554432 /* ComponentView */ ?
                asElementData(view, nodeIndex).componentView :
                view;
            markParentViewsForCheck(startView);
            return Services.handleEvent(view, nodeIndex, eventName, event);
        }
        catch (e) {
            // Attention: Don't rethrow, as it would cancel Observable subscriptions!
            view.root.errorHandler.handleError(e);
        }
    }
    function declaredViewContainer(view) {
        if (view.parent) {
            var parentView = view.parent;
            return asElementData(parentView, view.parentNodeDef.nodeIndex);
        }
        return null;
    }
    /**
     * for component views, this is the host element.
     * for embedded views, this is the index of the parent node
     * that contains the view container.
     */
    function viewParentEl(view) {
        var parentView = view.parent;
        if (parentView) {
            return view.parentNodeDef.parent;
        }
        else {
            return null;
        }
    }
    function renderNode(view, def) {
        switch (def.flags & 201347067 /* Types */) {
            case 1 /* TypeElement */:
                return asElementData(view, def.nodeIndex).renderElement;
            case 2 /* TypeText */:
                return asTextData(view, def.nodeIndex).renderText;
        }
    }
    function elementEventFullName(target, name) {
        return target ? target + ":" + name : name;
    }
    function isComponentView(view) {
        return !!view.parent && !!(view.parentNodeDef.flags & 32768 /* Component */);
    }
    function isEmbeddedView(view) {
        return !!view.parent && !(view.parentNodeDef.flags & 32768 /* Component */);
    }
    function filterQueryId(queryId) {
        return 1 << (queryId % 32);
    }
    function splitMatchedQueriesDsl(matchedQueriesDsl) {
        var matchedQueries = {};
        var matchedQueryIds = 0;
        var references = {};
        if (matchedQueriesDsl) {
            matchedQueriesDsl.forEach(function (_a) {
                var _b = __read(_a, 2), queryId = _b[0], valueType = _b[1];
                if (typeof queryId === 'number') {
                    matchedQueries[queryId] = valueType;
                    matchedQueryIds |= filterQueryId(queryId);
                }
                else {
                    references[queryId] = valueType;
                }
            });
        }
        return { matchedQueries: matchedQueries, references: references, matchedQueryIds: matchedQueryIds };
    }
    function splitDepsDsl(deps, sourceName) {
        return deps.map(function (value) {
            var _a;
            var token;
            var flags;
            if (Array.isArray(value)) {
                _a = __read(value, 2), flags = _a[0], token = _a[1];
            }
            else {
                flags = 0 /* None */;
                token = value;
            }
            if (token && (typeof token === 'function' || typeof token === 'object') && sourceName) {
                Object.defineProperty(token, SOURCE, { value: sourceName, configurable: true });
            }
            return { flags: flags, token: token, tokenKey: tokenKey(token) };
        });
    }
    function getParentRenderElement(view, renderHost, def) {
        var renderParent = def.renderParent;
        if (renderParent) {
            if ((renderParent.flags & 1 /* TypeElement */) === 0 ||
                (renderParent.flags & 33554432 /* ComponentView */) === 0 ||
                (renderParent.element.componentRendererType &&
                    renderParent.element.componentRendererType.encapsulation ===
                        exports.ViewEncapsulation.Native)) {
                // only children of non components, or children of components with native encapsulation should
                // be attached.
                return asElementData(view, def.renderParent.nodeIndex).renderElement;
            }
        }
        else {
            return renderHost;
        }
    }
    var DEFINITION_CACHE = new WeakMap();
    function resolveDefinition(factory) {
        var value = DEFINITION_CACHE.get(factory);
        if (!value) {
            value = factory(function () { return NOOP; });
            value.factory = factory;
            DEFINITION_CACHE.set(factory, value);
        }
        return value;
    }
    function rootRenderNodes(view) {
        var renderNodes = [];
        visitRootRenderNodes(view, 0 /* Collect */, undefined, undefined, renderNodes);
        return renderNodes;
    }
    function visitRootRenderNodes(view, action, parentNode, nextSibling, target) {
        // We need to re-compute the parent node in case the nodes have been moved around manually
        if (action === 3 /* RemoveChild */) {
            parentNode = view.renderer.parentNode(renderNode(view, view.def.lastRenderRootNode));
        }
        visitSiblingRenderNodes(view, action, 0, view.def.nodes.length - 1, parentNode, nextSibling, target);
    }
    function visitSiblingRenderNodes(view, action, startIndex, endIndex, parentNode, nextSibling, target) {
        for (var i = startIndex; i <= endIndex; i++) {
            var nodeDef = view.def.nodes[i];
            if (nodeDef.flags & (1 /* TypeElement */ | 2 /* TypeText */ | 8 /* TypeNgContent */)) {
                visitRenderNode(view, nodeDef, action, parentNode, nextSibling, target);
            }
            // jump to next sibling
            i += nodeDef.childCount;
        }
    }
    function visitProjectedRenderNodes(view, ngContentIndex, action, parentNode, nextSibling, target) {
        var compView = view;
        while (compView && !isComponentView(compView)) {
            compView = compView.parent;
        }
        var hostView = compView.parent;
        var hostElDef = viewParentEl(compView);
        var startIndex = hostElDef.nodeIndex + 1;
        var endIndex = hostElDef.nodeIndex + hostElDef.childCount;
        for (var i = startIndex; i <= endIndex; i++) {
            var nodeDef = hostView.def.nodes[i];
            if (nodeDef.ngContentIndex === ngContentIndex) {
                visitRenderNode(hostView, nodeDef, action, parentNode, nextSibling, target);
            }
            // jump to next sibling
            i += nodeDef.childCount;
        }
        if (!hostView.parent) {
            // a root view
            var projectedNodes = view.root.projectableNodes[ngContentIndex];
            if (projectedNodes) {
                for (var i = 0; i < projectedNodes.length; i++) {
                    execRenderNodeAction(view, projectedNodes[i], action, parentNode, nextSibling, target);
                }
            }
        }
    }
    function visitRenderNode(view, nodeDef, action, parentNode, nextSibling, target) {
        if (nodeDef.flags & 8 /* TypeNgContent */) {
            visitProjectedRenderNodes(view, nodeDef.ngContent.index, action, parentNode, nextSibling, target);
        }
        else {
            var rn = renderNode(view, nodeDef);
            if (action === 3 /* RemoveChild */ && (nodeDef.flags & 33554432 /* ComponentView */) &&
                (nodeDef.bindingFlags & 48 /* CatSyntheticProperty */)) {
                // Note: we might need to do both actions.
                if (nodeDef.bindingFlags & (16 /* SyntheticProperty */)) {
                    execRenderNodeAction(view, rn, action, parentNode, nextSibling, target);
                }
                if (nodeDef.bindingFlags & (32 /* SyntheticHostProperty */)) {
                    var compView = asElementData(view, nodeDef.nodeIndex).componentView;
                    execRenderNodeAction(compView, rn, action, parentNode, nextSibling, target);
                }
            }
            else {
                execRenderNodeAction(view, rn, action, parentNode, nextSibling, target);
            }
            if (nodeDef.flags & 16777216 /* EmbeddedViews */) {
                var embeddedViews = asElementData(view, nodeDef.nodeIndex).viewContainer._embeddedViews;
                for (var k = 0; k < embeddedViews.length; k++) {
                    visitRootRenderNodes(embeddedViews[k], action, parentNode, nextSibling, target);
                }
            }
            if (nodeDef.flags & 1 /* TypeElement */ && !nodeDef.element.name) {
                visitSiblingRenderNodes(view, action, nodeDef.nodeIndex + 1, nodeDef.nodeIndex + nodeDef.childCount, parentNode, nextSibling, target);
            }
        }
    }
    function execRenderNodeAction(view, renderNode, action, parentNode, nextSibling, target) {
        var renderer = view.renderer;
        switch (action) {
            case 1 /* AppendChild */:
                renderer.appendChild(parentNode, renderNode);
                break;
            case 2 /* InsertBefore */:
                renderer.insertBefore(parentNode, renderNode, nextSibling);
                break;
            case 3 /* RemoveChild */:
                renderer.removeChild(parentNode, renderNode);
                break;
            case 0 /* Collect */:
                target.push(renderNode);
                break;
        }
    }
    var NS_PREFIX_RE = /^:([^:]+):(.+)$/;
    function splitNamespace(name) {
        if (name[0] === ':') {
            var match = name.match(NS_PREFIX_RE);
            return [match[1], match[2]];
        }
        return ['', name];
    }
    function calcBindingFlags(bindings) {
        var flags = 0;
        for (var i = 0; i < bindings.length; i++) {
            flags |= bindings[i].flags;
        }
        return flags;
    }
    function interpolate(valueCount, constAndInterp) {
        var result = '';
        for (var i = 0; i < valueCount * 2; i = i + 2) {
            result = result + constAndInterp[i] + _toStringWithNull(constAndInterp[i + 1]);
        }
        return result + constAndInterp[valueCount * 2];
    }
    function inlineInterpolate(valueCount, c0, a1, c1, a2, c2, a3, c3, a4, c4, a5, c5, a6, c6, a7, c7, a8, c8, a9, c9) {
        switch (valueCount) {
            case 1:
                return c0 + _toStringWithNull(a1) + c1;
            case 2:
                return c0 + _toStringWithNull(a1) + c1 + _toStringWithNull(a2) + c2;
            case 3:
                return c0 + _toStringWithNull(a1) + c1 + _toStringWithNull(a2) + c2 + _toStringWithNull(a3) +
                    c3;
            case 4:
                return c0 + _toStringWithNull(a1) + c1 + _toStringWithNull(a2) + c2 + _toStringWithNull(a3) +
                    c3 + _toStringWithNull(a4) + c4;
            case 5:
                return c0 + _toStringWithNull(a1) + c1 + _toStringWithNull(a2) + c2 + _toStringWithNull(a3) +
                    c3 + _toStringWithNull(a4) + c4 + _toStringWithNull(a5) + c5;
            case 6:
                return c0 + _toStringWithNull(a1) + c1 + _toStringWithNull(a2) + c2 + _toStringWithNull(a3) +
                    c3 + _toStringWithNull(a4) + c4 + _toStringWithNull(a5) + c5 + _toStringWithNull(a6) + c6;
            case 7:
                return c0 + _toStringWithNull(a1) + c1 + _toStringWithNull(a2) + c2 + _toStringWithNull(a3) +
                    c3 + _toStringWithNull(a4) + c4 + _toStringWithNull(a5) + c5 + _toStringWithNull(a6) +
                    c6 + _toStringWithNull(a7) + c7;
            case 8:
                return c0 + _toStringWithNull(a1) + c1 + _toStringWithNull(a2) + c2 + _toStringWithNull(a3) +
                    c3 + _toStringWithNull(a4) + c4 + _toStringWithNull(a5) + c5 + _toStringWithNull(a6) +
                    c6 + _toStringWithNull(a7) + c7 + _toStringWithNull(a8) + c8;
            case 9:
                return c0 + _toStringWithNull(a1) + c1 + _toStringWithNull(a2) + c2 + _toStringWithNull(a3) +
                    c3 + _toStringWithNull(a4) + c4 + _toStringWithNull(a5) + c5 + _toStringWithNull(a6) +
                    c6 + _toStringWithNull(a7) + c7 + _toStringWithNull(a8) + c8 + _toStringWithNull(a9) + c9;
            default:
                throw new Error("Does not support more than 9 expressions");
        }
    }
    function _toStringWithNull(v) {
        return v != null ? v.toString() : '';
    }
    var EMPTY_ARRAY$4 = [];
    var EMPTY_MAP = {};

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    function anchorDef(flags, matchedQueriesDsl, ngContentIndex, childCount, handleEvent, templateFactory) {
        flags |= 1 /* TypeElement */;
        var _a = splitMatchedQueriesDsl(matchedQueriesDsl), matchedQueries = _a.matchedQueries, references = _a.references, matchedQueryIds = _a.matchedQueryIds;
        var template = templateFactory ? resolveDefinition(templateFactory) : null;
        return {
            // will bet set by the view definition
            nodeIndex: -1,
            parent: null,
            renderParent: null,
            bindingIndex: -1,
            outputIndex: -1,
            // regular values
            flags: flags,
            checkIndex: -1,
            childFlags: 0,
            directChildFlags: 0,
            childMatchedQueries: 0, matchedQueries: matchedQueries, matchedQueryIds: matchedQueryIds, references: references, ngContentIndex: ngContentIndex, childCount: childCount,
            bindings: [],
            bindingFlags: 0,
            outputs: [],
            element: {
                ns: null,
                name: null,
                attrs: null, template: template,
                componentProvider: null,
                componentView: null,
                componentRendererType: null,
                publicProviders: null,
                allProviders: null,
                handleEvent: handleEvent || NOOP
            },
            provider: null,
            text: null,
            query: null,
            ngContent: null
        };
    }
    function elementDef(checkIndex, flags, matchedQueriesDsl, ngContentIndex, childCount, namespaceAndName, fixedAttrs, bindings, outputs, handleEvent, componentView, componentRendererType) {
        if (fixedAttrs === void 0) { fixedAttrs = []; }
        var _a;
        if (!handleEvent) {
            handleEvent = NOOP;
        }
        var _b = splitMatchedQueriesDsl(matchedQueriesDsl), matchedQueries = _b.matchedQueries, references = _b.references, matchedQueryIds = _b.matchedQueryIds;
        var ns = null;
        var name = null;
        if (namespaceAndName) {
            _a = __read(splitNamespace(namespaceAndName), 2), ns = _a[0], name = _a[1];
        }
        bindings = bindings || [];
        var bindingDefs = new Array(bindings.length);
        for (var i = 0; i < bindings.length; i++) {
            var _c = __read(bindings[i], 3), bindingFlags = _c[0], namespaceAndName_1 = _c[1], suffixOrSecurityContext = _c[2];
            var _d = __read(splitNamespace(namespaceAndName_1), 2), ns_1 = _d[0], name_1 = _d[1];
            var securityContext = undefined;
            var suffix = undefined;
            switch (bindingFlags & 15 /* Types */) {
                case 4 /* TypeElementStyle */:
                    suffix = suffixOrSecurityContext;
                    break;
                case 1 /* TypeElementAttribute */:
                case 8 /* TypeProperty */:
                    securityContext = suffixOrSecurityContext;
                    break;
            }
            bindingDefs[i] =
                { flags: bindingFlags, ns: ns_1, name: name_1, nonMinifiedName: name_1, securityContext: securityContext, suffix: suffix };
        }
        outputs = outputs || [];
        var outputDefs = new Array(outputs.length);
        for (var i = 0; i < outputs.length; i++) {
            var _e = __read(outputs[i], 2), target = _e[0], eventName = _e[1];
            outputDefs[i] = {
                type: 0 /* ElementOutput */,
                target: target, eventName: eventName,
                propName: null
            };
        }
        fixedAttrs = fixedAttrs || [];
        var attrs = fixedAttrs.map(function (_a) {
            var _b = __read(_a, 2), namespaceAndName = _b[0], value = _b[1];
            var _c = __read(splitNamespace(namespaceAndName), 2), ns = _c[0], name = _c[1];
            return [ns, name, value];
        });
        componentRendererType = resolveRendererType2(componentRendererType);
        if (componentView) {
            flags |= 33554432 /* ComponentView */;
        }
        flags |= 1 /* TypeElement */;
        return {
            // will bet set by the view definition
            nodeIndex: -1,
            parent: null,
            renderParent: null,
            bindingIndex: -1,
            outputIndex: -1,
            // regular values
            checkIndex: checkIndex,
            flags: flags,
            childFlags: 0,
            directChildFlags: 0,
            childMatchedQueries: 0, matchedQueries: matchedQueries, matchedQueryIds: matchedQueryIds, references: references, ngContentIndex: ngContentIndex, childCount: childCount,
            bindings: bindingDefs,
            bindingFlags: calcBindingFlags(bindingDefs),
            outputs: outputDefs,
            element: {
                ns: ns,
                name: name,
                attrs: attrs,
                template: null,
                // will bet set by the view definition
                componentProvider: null,
                componentView: componentView || null,
                componentRendererType: componentRendererType,
                publicProviders: null,
                allProviders: null,
                handleEvent: handleEvent || NOOP,
            },
            provider: null,
            text: null,
            query: null,
            ngContent: null
        };
    }
    function createElement(view, renderHost, def) {
        var elDef = def.element;
        var rootSelectorOrNode = view.root.selectorOrNode;
        var renderer = view.renderer;
        var el;
        if (view.parent || !rootSelectorOrNode) {
            if (elDef.name) {
                el = renderer.createElement(elDef.name, elDef.ns);
            }
            else {
                el = renderer.createComment('');
            }
            var parentEl = getParentRenderElement(view, renderHost, def);
            if (parentEl) {
                renderer.appendChild(parentEl, el);
            }
        }
        else {
            // when using native Shadow DOM, do not clear the root element contents to allow slot projection
            var preserveContent = (!!elDef.componentRendererType &&
                elDef.componentRendererType.encapsulation === exports.ViewEncapsulation.ShadowDom);
            el = renderer.selectRootElement(rootSelectorOrNode, preserveContent);
        }
        if (elDef.attrs) {
            for (var i = 0; i < elDef.attrs.length; i++) {
                var _a = __read(elDef.attrs[i], 3), ns = _a[0], name_2 = _a[1], value = _a[2];
                renderer.setAttribute(el, name_2, value, ns);
            }
        }
        return el;
    }
    function listenToElementOutputs(view, compView, def, el) {
        for (var i = 0; i < def.outputs.length; i++) {
            var output = def.outputs[i];
            var handleEventClosure = renderEventHandlerClosure(view, def.nodeIndex, elementEventFullName(output.target, output.eventName));
            var listenTarget = output.target;
            var listenerView = view;
            if (output.target === 'component') {
                listenTarget = null;
                listenerView = compView;
            }
            var disposable = listenerView.renderer.listen(listenTarget || el, output.eventName, handleEventClosure);
            view.disposables[def.outputIndex + i] = disposable;
        }
    }
    function renderEventHandlerClosure(view, index, eventName) {
        return function (event) { return dispatchEvent(view, index, eventName, event); };
    }
    function checkAndUpdateElementInline(view, def, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9) {
        var bindLen = def.bindings.length;
        var changed = false;
        if (bindLen > 0 && checkAndUpdateElementValue(view, def, 0, v0))
            changed = true;
        if (bindLen > 1 && checkAndUpdateElementValue(view, def, 1, v1))
            changed = true;
        if (bindLen > 2 && checkAndUpdateElementValue(view, def, 2, v2))
            changed = true;
        if (bindLen > 3 && checkAndUpdateElementValue(view, def, 3, v3))
            changed = true;
        if (bindLen > 4 && checkAndUpdateElementValue(view, def, 4, v4))
            changed = true;
        if (bindLen > 5 && checkAndUpdateElementValue(view, def, 5, v5))
            changed = true;
        if (bindLen > 6 && checkAndUpdateElementValue(view, def, 6, v6))
            changed = true;
        if (bindLen > 7 && checkAndUpdateElementValue(view, def, 7, v7))
            changed = true;
        if (bindLen > 8 && checkAndUpdateElementValue(view, def, 8, v8))
            changed = true;
        if (bindLen > 9 && checkAndUpdateElementValue(view, def, 9, v9))
            changed = true;
        return changed;
    }
    function checkAndUpdateElementDynamic(view, def, values) {
        var changed = false;
        for (var i = 0; i < values.length; i++) {
            if (checkAndUpdateElementValue(view, def, i, values[i]))
                changed = true;
        }
        return changed;
    }
    function checkAndUpdateElementValue(view, def, bindingIdx, value) {
        if (!checkAndUpdateBinding(view, def, bindingIdx, value)) {
            return false;
        }
        var binding = def.bindings[bindingIdx];
        var elData = asElementData(view, def.nodeIndex);
        var renderNode$$1 = elData.renderElement;
        var name = binding.name;
        switch (binding.flags & 15 /* Types */) {
            case 1 /* TypeElementAttribute */:
                setElementAttribute(view, binding, renderNode$$1, binding.ns, name, value);
                break;
            case 2 /* TypeElementClass */:
                setElementClass(view, renderNode$$1, name, value);
                break;
            case 4 /* TypeElementStyle */:
                setElementStyle(view, binding, renderNode$$1, name, value);
                break;
            case 8 /* TypeProperty */:
                var bindView = (def.flags & 33554432 /* ComponentView */ &&
                    binding.flags & 32 /* SyntheticHostProperty */) ?
                    elData.componentView :
                    view;
                setElementProperty(bindView, binding, renderNode$$1, name, value);
                break;
        }
        return true;
    }
    function setElementAttribute(view, binding, renderNode$$1, ns, name, value) {
        var securityContext = binding.securityContext;
        var renderValue = securityContext ? view.root.sanitizer.sanitize(securityContext, value) : value;
        renderValue = renderValue != null ? renderValue.toString() : null;
        var renderer = view.renderer;
        if (value != null) {
            renderer.setAttribute(renderNode$$1, name, renderValue, ns);
        }
        else {
            renderer.removeAttribute(renderNode$$1, name, ns);
        }
    }
    function setElementClass(view, renderNode$$1, name, value) {
        var renderer = view.renderer;
        if (value) {
            renderer.addClass(renderNode$$1, name);
        }
        else {
            renderer.removeClass(renderNode$$1, name);
        }
    }
    function setElementStyle(view, binding, renderNode$$1, name, value) {
        var renderValue = view.root.sanitizer.sanitize(exports.SecurityContext.STYLE, value);
        if (renderValue != null) {
            renderValue = renderValue.toString();
            var unit = binding.suffix;
            if (unit != null) {
                renderValue = renderValue + unit;
            }
        }
        else {
            renderValue = null;
        }
        var renderer = view.renderer;
        if (renderValue != null) {
            renderer.setStyle(renderNode$$1, name, renderValue);
        }
        else {
            renderer.removeStyle(renderNode$$1, name);
        }
    }
    function setElementProperty(view, binding, renderNode$$1, name, value) {
        var securityContext = binding.securityContext;
        var renderValue = securityContext ? view.root.sanitizer.sanitize(securityContext, value) : value;
        view.renderer.setProperty(renderNode$$1, name, renderValue);
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var UNDEFINED_VALUE = new Object();
    var InjectorRefTokenKey = tokenKey(Injector);
    var INJECTORRefTokenKey = tokenKey(INJECTOR);
    var NgModuleRefTokenKey = tokenKey(NgModuleRef);
    function moduleProvideDef(flags, token, value, deps) {
        // Need to resolve forwardRefs as e.g. for `useValue` we
        // lowered the expression and then stopped evaluating it,
        // i.e. also didn't unwrap it.
        value = resolveForwardRef(value);
        var depDefs = splitDepsDsl(deps, stringify(token));
        return {
            // will bet set by the module definition
            index: -1,
            deps: depDefs, flags: flags, token: token, value: value
        };
    }
    function moduleDef(providers) {
        var providersByKey = {};
        var modules = [];
        var isRoot = false;
        for (var i = 0; i < providers.length; i++) {
            var provider = providers[i];
            if (provider.token === APP_ROOT && provider.value === true) {
                isRoot = true;
            }
            if (provider.flags & 1073741824 /* TypeNgModule */) {
                modules.push(provider.token);
            }
            provider.index = i;
            providersByKey[tokenKey(provider.token)] = provider;
        }
        return {
            // Will be filled later...
            factory: null,
            providersByKey: providersByKey,
            providers: providers,
            modules: modules,
            isRoot: isRoot,
        };
    }
    function initNgModule(data) {
        var def = data._def;
        var providers = data._providers = new Array(def.providers.length);
        for (var i = 0; i < def.providers.length; i++) {
            var provDef = def.providers[i];
            if (!(provDef.flags & 4096 /* LazyProvider */)) {
                // Make sure the provider has not been already initialized outside this loop.
                if (providers[i] === undefined) {
                    providers[i] = _createProviderInstance(data, provDef);
                }
            }
        }
    }
    function resolveNgModuleDep(data, depDef, notFoundValue) {
        if (notFoundValue === void 0) { notFoundValue = Injector.THROW_IF_NOT_FOUND; }
        var former = setCurrentInjector(data);
        try {
            if (depDef.flags & 8 /* Value */) {
                return depDef.token;
            }
            if (depDef.flags & 2 /* Optional */) {
                notFoundValue = null;
            }
            if (depDef.flags & 1 /* SkipSelf */) {
                return data._parent.get(depDef.token, notFoundValue);
            }
            var tokenKey_1 = depDef.tokenKey;
            switch (tokenKey_1) {
                case InjectorRefTokenKey:
                case INJECTORRefTokenKey:
                case NgModuleRefTokenKey:
                    return data;
            }
            var providerDef = data._def.providersByKey[tokenKey_1];
            var injectableDef = void 0;
            if (providerDef) {
                var providerInstance = data._providers[providerDef.index];
                if (providerInstance === undefined) {
                    providerInstance = data._providers[providerDef.index] =
                        _createProviderInstance(data, providerDef);
                }
                return providerInstance === UNDEFINED_VALUE ? undefined : providerInstance;
            }
            else if ((injectableDef = getInjectableDef(depDef.token)) && targetsModule(data, injectableDef)) {
                var index = data._providers.length;
                data._def.providersByKey[depDef.tokenKey] = {
                    flags: 1024 /* TypeFactoryProvider */ | 4096 /* LazyProvider */,
                    value: injectableDef.factory,
                    deps: [], index: index,
                    token: depDef.token,
                };
                data._providers[index] = UNDEFINED_VALUE;
                return (data._providers[index] =
                    _createProviderInstance(data, data._def.providersByKey[depDef.tokenKey]));
            }
            else if (depDef.flags & 4 /* Self */) {
                return notFoundValue;
            }
            return data._parent.get(depDef.token, notFoundValue);
        }
        finally {
            setCurrentInjector(former);
        }
    }
    function moduleTransitivelyPresent(ngModule, scope) {
        return ngModule._def.modules.indexOf(scope) > -1;
    }
    function targetsModule(ngModule, def) {
        return def.providedIn != null && (moduleTransitivelyPresent(ngModule, def.providedIn) ||
            def.providedIn === 'root' && ngModule._def.isRoot);
    }
    function _createProviderInstance(ngModule, providerDef) {
        var injectable;
        switch (providerDef.flags & 201347067 /* Types */) {
            case 512 /* TypeClassProvider */:
                injectable = _createClass(ngModule, providerDef.value, providerDef.deps);
                break;
            case 1024 /* TypeFactoryProvider */:
                injectable = _callFactory(ngModule, providerDef.value, providerDef.deps);
                break;
            case 2048 /* TypeUseExistingProvider */:
                injectable = resolveNgModuleDep(ngModule, providerDef.deps[0]);
                break;
            case 256 /* TypeValueProvider */:
                injectable = providerDef.value;
                break;
        }
        // The read of `ngOnDestroy` here is slightly expensive as it's megamorphic, so it should be
        // avoided if possible. The sequence of checks here determines whether ngOnDestroy needs to be
        // checked. It might not if the `injectable` isn't an object or if NodeFlags.OnDestroy is already
        // set (ngOnDestroy was detected statically).
        if (injectable !== UNDEFINED_VALUE && injectable != null && typeof injectable === 'object' &&
            !(providerDef.flags & 131072 /* OnDestroy */) && typeof injectable.ngOnDestroy === 'function') {
            providerDef.flags |= 131072 /* OnDestroy */;
        }
        return injectable === undefined ? UNDEFINED_VALUE : injectable;
    }
    function _createClass(ngModule, ctor, deps) {
        var len = deps.length;
        switch (len) {
            case 0:
                return new ctor();
            case 1:
                return new ctor(resolveNgModuleDep(ngModule, deps[0]));
            case 2:
                return new ctor(resolveNgModuleDep(ngModule, deps[0]), resolveNgModuleDep(ngModule, deps[1]));
            case 3:
                return new ctor(resolveNgModuleDep(ngModule, deps[0]), resolveNgModuleDep(ngModule, deps[1]), resolveNgModuleDep(ngModule, deps[2]));
            default:
                var depValues = new Array(len);
                for (var i = 0; i < len; i++) {
                    depValues[i] = resolveNgModuleDep(ngModule, deps[i]);
                }
                return new (ctor.bind.apply(ctor, __spread([void 0], depValues)))();
        }
    }
    function _callFactory(ngModule, factory, deps) {
        var len = deps.length;
        switch (len) {
            case 0:
                return factory();
            case 1:
                return factory(resolveNgModuleDep(ngModule, deps[0]));
            case 2:
                return factory(resolveNgModuleDep(ngModule, deps[0]), resolveNgModuleDep(ngModule, deps[1]));
            case 3:
                return factory(resolveNgModuleDep(ngModule, deps[0]), resolveNgModuleDep(ngModule, deps[1]), resolveNgModuleDep(ngModule, deps[2]));
            default:
                var depValues = Array(len);
                for (var i = 0; i < len; i++) {
                    depValues[i] = resolveNgModuleDep(ngModule, deps[i]);
                }
                return factory.apply(void 0, __spread(depValues));
        }
    }
    function callNgModuleLifecycle(ngModule, lifecycles) {
        var def = ngModule._def;
        var destroyed = new Set();
        for (var i = 0; i < def.providers.length; i++) {
            var provDef = def.providers[i];
            if (provDef.flags & 131072 /* OnDestroy */) {
                var instance = ngModule._providers[i];
                if (instance && instance !== UNDEFINED_VALUE) {
                    var onDestroy = instance.ngOnDestroy;
                    if (typeof onDestroy === 'function' && !destroyed.has(instance)) {
                        onDestroy.apply(instance);
                        destroyed.add(instance);
                    }
                }
            }
        }
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    function attachEmbeddedView(parentView, elementData, viewIndex, view) {
        var embeddedViews = elementData.viewContainer._embeddedViews;
        if (viewIndex === null || viewIndex === undefined) {
            viewIndex = embeddedViews.length;
        }
        view.viewContainerParent = parentView;
        addToArray(embeddedViews, viewIndex, view);
        attachProjectedView(elementData, view);
        Services.dirtyParentQueries(view);
        var prevView = viewIndex > 0 ? embeddedViews[viewIndex - 1] : null;
        renderAttachEmbeddedView(elementData, prevView, view);
    }
    function attachProjectedView(vcElementData, view) {
        var dvcElementData = declaredViewContainer(view);
        if (!dvcElementData || dvcElementData === vcElementData ||
            view.state & 16 /* IsProjectedView */) {
            return;
        }
        // Note: For performance reasons, we
        // - add a view to template._projectedViews only 1x throughout its lifetime,
        //   and remove it not until the view is destroyed.
        //   (hard, as when a parent view is attached/detached we would need to attach/detach all
        //    nested projected views as well, even across component boundaries).
        // - don't track the insertion order of views in the projected views array
        //   (hard, as when the views of the same template are inserted different view containers)
        view.state |= 16 /* IsProjectedView */;
        var projectedViews = dvcElementData.template._projectedViews;
        if (!projectedViews) {
            projectedViews = dvcElementData.template._projectedViews = [];
        }
        projectedViews.push(view);
        // Note: we are changing the NodeDef here as we cannot calculate
        // the fact whether a template is used for projection during compilation.
        markNodeAsProjectedTemplate(view.parent.def, view.parentNodeDef);
    }
    function markNodeAsProjectedTemplate(viewDef, nodeDef) {
        if (nodeDef.flags & 4 /* ProjectedTemplate */) {
            return;
        }
        viewDef.nodeFlags |= 4 /* ProjectedTemplate */;
        nodeDef.flags |= 4 /* ProjectedTemplate */;
        var parentNodeDef = nodeDef.parent;
        while (parentNodeDef) {
            parentNodeDef.childFlags |= 4 /* ProjectedTemplate */;
            parentNodeDef = parentNodeDef.parent;
        }
    }
    function detachEmbeddedView(elementData, viewIndex) {
        var embeddedViews = elementData.viewContainer._embeddedViews;
        if (viewIndex == null || viewIndex >= embeddedViews.length) {
            viewIndex = embeddedViews.length - 1;
        }
        if (viewIndex < 0) {
            return null;
        }
        var view = embeddedViews[viewIndex];
        view.viewContainerParent = null;
        removeFromArray(embeddedViews, viewIndex);
        // See attachProjectedView for why we don't update projectedViews here.
        Services.dirtyParentQueries(view);
        renderDetachView(view);
        return view;
    }
    function detachProjectedView(view) {
        if (!(view.state & 16 /* IsProjectedView */)) {
            return;
        }
        var dvcElementData = declaredViewContainer(view);
        if (dvcElementData) {
            var projectedViews = dvcElementData.template._projectedViews;
            if (projectedViews) {
                removeFromArray(projectedViews, projectedViews.indexOf(view));
                Services.dirtyParentQueries(view);
            }
        }
    }
    function moveEmbeddedView(elementData, oldViewIndex, newViewIndex) {
        var embeddedViews = elementData.viewContainer._embeddedViews;
        var view = embeddedViews[oldViewIndex];
        removeFromArray(embeddedViews, oldViewIndex);
        if (newViewIndex == null) {
            newViewIndex = embeddedViews.length;
        }
        addToArray(embeddedViews, newViewIndex, view);
        // Note: Don't need to change projectedViews as the order in there
        // as always invalid...
        Services.dirtyParentQueries(view);
        renderDetachView(view);
        var prevView = newViewIndex > 0 ? embeddedViews[newViewIndex - 1] : null;
        renderAttachEmbeddedView(elementData, prevView, view);
        return view;
    }
    function renderAttachEmbeddedView(elementData, prevView, view) {
        var prevRenderNode = prevView ? renderNode(prevView, prevView.def.lastRenderRootNode) :
            elementData.renderElement;
        var parentNode = view.renderer.parentNode(prevRenderNode);
        var nextSibling = view.renderer.nextSibling(prevRenderNode);
        // Note: We can't check if `nextSibling` is present, as on WebWorkers it will always be!
        // However, browsers automatically do `appendChild` when there is no `nextSibling`.
        visitRootRenderNodes(view, 2 /* InsertBefore */, parentNode, nextSibling, undefined);
    }
    function renderDetachView(view) {
        visitRootRenderNodes(view, 3 /* RemoveChild */, null, null, undefined);
    }
    function addToArray(arr, index, value) {
        // perf: array.push is faster than array.splice!
        if (index >= arr.length) {
            arr.push(value);
        }
        else {
            arr.splice(index, 0, value);
        }
    }
    function removeFromArray(arr, index) {
        // perf: array.pop is faster than array.splice!
        if (index >= arr.length - 1) {
            arr.pop();
        }
        else {
            arr.splice(index, 1);
        }
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var EMPTY_CONTEXT = new Object();
    // Attention: this function is called as top level function.
    // Putting any logic in here will destroy closure tree shaking!
    function createComponentFactory(selector, componentType, viewDefFactory, inputs, outputs, ngContentSelectors) {
        return new ComponentFactory_(selector, componentType, viewDefFactory, inputs, outputs, ngContentSelectors);
    }
    function getComponentViewDefinitionFactory(componentFactory) {
        return componentFactory.viewDefFactory;
    }
    var ComponentFactory_ = /** @class */ (function (_super) {
        __extends(ComponentFactory_, _super);
        function ComponentFactory_(selector, componentType, viewDefFactory, _inputs, _outputs, ngContentSelectors) {
            var _this = 
            // Attention: this ctor is called as top level function.
            // Putting any logic in here will destroy closure tree shaking!
            _super.call(this) || this;
            _this.selector = selector;
            _this.componentType = componentType;
            _this._inputs = _inputs;
            _this._outputs = _outputs;
            _this.ngContentSelectors = ngContentSelectors;
            _this.viewDefFactory = viewDefFactory;
            return _this;
        }
        Object.defineProperty(ComponentFactory_.prototype, "inputs", {
            get: function () {
                var inputsArr = [];
                var inputs = this._inputs;
                for (var propName in inputs) {
                    var templateName = inputs[propName];
                    inputsArr.push({ propName: propName, templateName: templateName });
                }
                return inputsArr;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ComponentFactory_.prototype, "outputs", {
            get: function () {
                var outputsArr = [];
                for (var propName in this._outputs) {
                    var templateName = this._outputs[propName];
                    outputsArr.push({ propName: propName, templateName: templateName });
                }
                return outputsArr;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Creates a new component.
         */
        ComponentFactory_.prototype.create = function (injector, projectableNodes, rootSelectorOrNode, ngModule) {
            if (!ngModule) {
                throw new Error('ngModule should be provided');
            }
            var viewDef = resolveDefinition(this.viewDefFactory);
            var componentNodeIndex = viewDef.nodes[0].element.componentProvider.nodeIndex;
            var view = Services.createRootView(injector, projectableNodes || [], rootSelectorOrNode, viewDef, ngModule, EMPTY_CONTEXT);
            var component = asProviderData(view, componentNodeIndex).instance;
            if (rootSelectorOrNode) {
                view.renderer.setAttribute(asElementData(view, 0).renderElement, 'ng-version', VERSION.full);
            }
            return new ComponentRef_(view, new ViewRef_(view), component);
        };
        return ComponentFactory_;
    }(ComponentFactory));
    var ComponentRef_ = /** @class */ (function (_super) {
        __extends(ComponentRef_, _super);
        function ComponentRef_(_view, _viewRef, _component) {
            var _this = _super.call(this) || this;
            _this._view = _view;
            _this._viewRef = _viewRef;
            _this._component = _component;
            _this._elDef = _this._view.def.nodes[0];
            _this.hostView = _viewRef;
            _this.changeDetectorRef = _viewRef;
            _this.instance = _component;
            return _this;
        }
        Object.defineProperty(ComponentRef_.prototype, "location", {
            get: function () {
                return new ElementRef(asElementData(this._view, this._elDef.nodeIndex).renderElement);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ComponentRef_.prototype, "injector", {
            get: function () { return new Injector_(this._view, this._elDef); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ComponentRef_.prototype, "componentType", {
            get: function () { return this._component.constructor; },
            enumerable: true,
            configurable: true
        });
        ComponentRef_.prototype.destroy = function () { this._viewRef.destroy(); };
        ComponentRef_.prototype.onDestroy = function (callback) { this._viewRef.onDestroy(callback); };
        return ComponentRef_;
    }(ComponentRef));
    function createViewContainerData(view, elDef, elData) {
        return new ViewContainerRef_(view, elDef, elData);
    }
    var ViewContainerRef_ = /** @class */ (function () {
        function ViewContainerRef_(_view, _elDef, _data) {
            this._view = _view;
            this._elDef = _elDef;
            this._data = _data;
            /**
             * @internal
             */
            this._embeddedViews = [];
        }
        Object.defineProperty(ViewContainerRef_.prototype, "element", {
            get: function () { return new ElementRef(this._data.renderElement); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ViewContainerRef_.prototype, "injector", {
            get: function () { return new Injector_(this._view, this._elDef); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ViewContainerRef_.prototype, "parentInjector", {
            /** @deprecated No replacement */
            get: function () {
                var view = this._view;
                var elDef = this._elDef.parent;
                while (!elDef && view) {
                    elDef = viewParentEl(view);
                    view = view.parent;
                }
                return view ? new Injector_(view, elDef) : new Injector_(this._view, null);
            },
            enumerable: true,
            configurable: true
        });
        ViewContainerRef_.prototype.clear = function () {
            var len = this._embeddedViews.length;
            for (var i = len - 1; i >= 0; i--) {
                var view = detachEmbeddedView(this._data, i);
                Services.destroyView(view);
            }
        };
        ViewContainerRef_.prototype.get = function (index) {
            var view = this._embeddedViews[index];
            if (view) {
                var ref = new ViewRef_(view);
                ref.attachToViewContainerRef(this);
                return ref;
            }
            return null;
        };
        Object.defineProperty(ViewContainerRef_.prototype, "length", {
            get: function () { return this._embeddedViews.length; },
            enumerable: true,
            configurable: true
        });
        ViewContainerRef_.prototype.createEmbeddedView = function (templateRef, context, index) {
            var viewRef = templateRef.createEmbeddedView(context || {});
            this.insert(viewRef, index);
            return viewRef;
        };
        ViewContainerRef_.prototype.createComponent = function (componentFactory, index, injector, projectableNodes, ngModuleRef) {
            var contextInjector = injector || this.parentInjector;
            if (!ngModuleRef && !(componentFactory instanceof ComponentFactoryBoundToModule)) {
                ngModuleRef = contextInjector.get(NgModuleRef);
            }
            var componentRef = componentFactory.create(contextInjector, projectableNodes, undefined, ngModuleRef);
            this.insert(componentRef.hostView, index);
            return componentRef;
        };
        ViewContainerRef_.prototype.insert = function (viewRef, index) {
            if (viewRef.destroyed) {
                throw new Error('Cannot insert a destroyed View in a ViewContainer!');
            }
            var viewRef_ = viewRef;
            var viewData = viewRef_._view;
            attachEmbeddedView(this._view, this._data, index, viewData);
            viewRef_.attachToViewContainerRef(this);
            return viewRef;
        };
        ViewContainerRef_.prototype.move = function (viewRef, currentIndex) {
            if (viewRef.destroyed) {
                throw new Error('Cannot move a destroyed View in a ViewContainer!');
            }
            var previousIndex = this._embeddedViews.indexOf(viewRef._view);
            moveEmbeddedView(this._data, previousIndex, currentIndex);
            return viewRef;
        };
        ViewContainerRef_.prototype.indexOf = function (viewRef) {
            return this._embeddedViews.indexOf(viewRef._view);
        };
        ViewContainerRef_.prototype.remove = function (index) {
            var viewData = detachEmbeddedView(this._data, index);
            if (viewData) {
                Services.destroyView(viewData);
            }
        };
        ViewContainerRef_.prototype.detach = function (index) {
            var view = detachEmbeddedView(this._data, index);
            return view ? new ViewRef_(view) : null;
        };
        return ViewContainerRef_;
    }());
    function createChangeDetectorRef(view) {
        return new ViewRef_(view);
    }
    var ViewRef_ = /** @class */ (function () {
        function ViewRef_(_view) {
            this._view = _view;
            this._viewContainerRef = null;
            this._appRef = null;
        }
        Object.defineProperty(ViewRef_.prototype, "rootNodes", {
            get: function () { return rootRenderNodes(this._view); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ViewRef_.prototype, "context", {
            get: function () { return this._view.context; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ViewRef_.prototype, "destroyed", {
            get: function () { return (this._view.state & 128 /* Destroyed */) !== 0; },
            enumerable: true,
            configurable: true
        });
        ViewRef_.prototype.markForCheck = function () { markParentViewsForCheck(this._view); };
        ViewRef_.prototype.detach = function () { this._view.state &= ~4 /* Attached */; };
        ViewRef_.prototype.detectChanges = function () {
            var fs = this._view.root.rendererFactory;
            if (fs.begin) {
                fs.begin();
            }
            try {
                Services.checkAndUpdateView(this._view);
            }
            finally {
                if (fs.end) {
                    fs.end();
                }
            }
        };
        ViewRef_.prototype.checkNoChanges = function () { Services.checkNoChangesView(this._view); };
        ViewRef_.prototype.reattach = function () { this._view.state |= 4 /* Attached */; };
        ViewRef_.prototype.onDestroy = function (callback) {
            if (!this._view.disposables) {
                this._view.disposables = [];
            }
            this._view.disposables.push(callback);
        };
        ViewRef_.prototype.destroy = function () {
            if (this._appRef) {
                this._appRef.detachView(this);
            }
            else if (this._viewContainerRef) {
                this._viewContainerRef.detach(this._viewContainerRef.indexOf(this));
            }
            Services.destroyView(this._view);
        };
        ViewRef_.prototype.detachFromAppRef = function () {
            this._appRef = null;
            renderDetachView(this._view);
            Services.dirtyParentQueries(this._view);
        };
        ViewRef_.prototype.attachToAppRef = function (appRef) {
            if (this._viewContainerRef) {
                throw new Error('This view is already attached to a ViewContainer!');
            }
            this._appRef = appRef;
        };
        ViewRef_.prototype.attachToViewContainerRef = function (vcRef) {
            if (this._appRef) {
                throw new Error('This view is already attached directly to the ApplicationRef!');
            }
            this._viewContainerRef = vcRef;
        };
        return ViewRef_;
    }());
    function createTemplateData(view, def) {
        return new TemplateRef_(view, def);
    }
    var TemplateRef_ = /** @class */ (function (_super) {
        __extends(TemplateRef_, _super);
        function TemplateRef_(_parentView, _def) {
            var _this = _super.call(this) || this;
            _this._parentView = _parentView;
            _this._def = _def;
            return _this;
        }
        TemplateRef_.prototype.createEmbeddedView = function (context) {
            return new ViewRef_(Services.createEmbeddedView(this._parentView, this._def, this._def.element.template, context));
        };
        Object.defineProperty(TemplateRef_.prototype, "elementRef", {
            get: function () {
                return new ElementRef(asElementData(this._parentView, this._def.nodeIndex).renderElement);
            },
            enumerable: true,
            configurable: true
        });
        return TemplateRef_;
    }(TemplateRef));
    function createInjector$1(view, elDef) {
        return new Injector_(view, elDef);
    }
    var Injector_ = /** @class */ (function () {
        function Injector_(view, elDef) {
            this.view = view;
            this.elDef = elDef;
        }
        Injector_.prototype.get = function (token, notFoundValue) {
            if (notFoundValue === void 0) { notFoundValue = Injector.THROW_IF_NOT_FOUND; }
            var allowPrivateServices = this.elDef ? (this.elDef.flags & 33554432 /* ComponentView */) !== 0 : false;
            return Services.resolveDep(this.view, this.elDef, allowPrivateServices, { flags: 0 /* None */, token: token, tokenKey: tokenKey(token) }, notFoundValue);
        };
        return Injector_;
    }());
    function nodeValue(view, index) {
        var def = view.def.nodes[index];
        if (def.flags & 1 /* TypeElement */) {
            var elData = asElementData(view, def.nodeIndex);
            return def.element.template ? elData.template : elData.renderElement;
        }
        else if (def.flags & 2 /* TypeText */) {
            return asTextData(view, def.nodeIndex).renderText;
        }
        else if (def.flags & (20224 /* CatProvider */ | 16 /* TypePipe */)) {
            return asProviderData(view, def.nodeIndex).instance;
        }
        throw new Error("Illegal state: read nodeValue for node index " + index);
    }
    function createRendererV1(view) {
        return new RendererAdapter(view.renderer);
    }
    var RendererAdapter = /** @class */ (function () {
        function RendererAdapter(delegate) {
            this.delegate = delegate;
        }
        RendererAdapter.prototype.selectRootElement = function (selectorOrNode) {
            return this.delegate.selectRootElement(selectorOrNode);
        };
        RendererAdapter.prototype.createElement = function (parent, namespaceAndName) {
            var _a = __read(splitNamespace(namespaceAndName), 2), ns = _a[0], name = _a[1];
            var el = this.delegate.createElement(name, ns);
            if (parent) {
                this.delegate.appendChild(parent, el);
            }
            return el;
        };
        RendererAdapter.prototype.createViewRoot = function (hostElement) { return hostElement; };
        RendererAdapter.prototype.createTemplateAnchor = function (parentElement) {
            var comment = this.delegate.createComment('');
            if (parentElement) {
                this.delegate.appendChild(parentElement, comment);
            }
            return comment;
        };
        RendererAdapter.prototype.createText = function (parentElement, value) {
            var node = this.delegate.createText(value);
            if (parentElement) {
                this.delegate.appendChild(parentElement, node);
            }
            return node;
        };
        RendererAdapter.prototype.projectNodes = function (parentElement, nodes) {
            for (var i = 0; i < nodes.length; i++) {
                this.delegate.appendChild(parentElement, nodes[i]);
            }
        };
        RendererAdapter.prototype.attachViewAfter = function (node, viewRootNodes) {
            var parentElement = this.delegate.parentNode(node);
            var nextSibling = this.delegate.nextSibling(node);
            for (var i = 0; i < viewRootNodes.length; i++) {
                this.delegate.insertBefore(parentElement, viewRootNodes[i], nextSibling);
            }
        };
        RendererAdapter.prototype.detachView = function (viewRootNodes) {
            for (var i = 0; i < viewRootNodes.length; i++) {
                var node = viewRootNodes[i];
                var parentElement = this.delegate.parentNode(node);
                this.delegate.removeChild(parentElement, node);
            }
        };
        RendererAdapter.prototype.destroyView = function (hostElement, viewAllNodes) {
            for (var i = 0; i < viewAllNodes.length; i++) {
                this.delegate.destroyNode(viewAllNodes[i]);
            }
        };
        RendererAdapter.prototype.listen = function (renderElement, name, callback) {
            return this.delegate.listen(renderElement, name, callback);
        };
        RendererAdapter.prototype.listenGlobal = function (target, name, callback) {
            return this.delegate.listen(target, name, callback);
        };
        RendererAdapter.prototype.setElementProperty = function (renderElement, propertyName, propertyValue) {
            this.delegate.setProperty(renderElement, propertyName, propertyValue);
        };
        RendererAdapter.prototype.setElementAttribute = function (renderElement, namespaceAndName, attributeValue) {
            var _a = __read(splitNamespace(namespaceAndName), 2), ns = _a[0], name = _a[1];
            if (attributeValue != null) {
                this.delegate.setAttribute(renderElement, name, attributeValue, ns);
            }
            else {
                this.delegate.removeAttribute(renderElement, name, ns);
            }
        };
        RendererAdapter.prototype.setBindingDebugInfo = function (renderElement, propertyName, propertyValue) { };
        RendererAdapter.prototype.setElementClass = function (renderElement, className, isAdd) {
            if (isAdd) {
                this.delegate.addClass(renderElement, className);
            }
            else {
                this.delegate.removeClass(renderElement, className);
            }
        };
        RendererAdapter.prototype.setElementStyle = function (renderElement, styleName, styleValue) {
            if (styleValue != null) {
                this.delegate.setStyle(renderElement, styleName, styleValue);
            }
            else {
                this.delegate.removeStyle(renderElement, styleName);
            }
        };
        RendererAdapter.prototype.invokeElementMethod = function (renderElement, methodName, args) {
            renderElement[methodName].apply(renderElement, args);
        };
        RendererAdapter.prototype.setText = function (renderNode$$1, text) { this.delegate.setValue(renderNode$$1, text); };
        RendererAdapter.prototype.animate = function () { throw new Error('Renderer.animate is no longer supported!'); };
        return RendererAdapter;
    }());
    function createNgModuleRef(moduleType, parent, bootstrapComponents, def) {
        return new NgModuleRef_(moduleType, parent, bootstrapComponents, def);
    }
    var NgModuleRef_ = /** @class */ (function () {
        function NgModuleRef_(_moduleType, _parent, _bootstrapComponents, _def) {
            this._moduleType = _moduleType;
            this._parent = _parent;
            this._bootstrapComponents = _bootstrapComponents;
            this._def = _def;
            this._destroyListeners = [];
            this._destroyed = false;
            this.injector = this;
            initNgModule(this);
        }
        NgModuleRef_.prototype.get = function (token, notFoundValue, injectFlags) {
            if (notFoundValue === void 0) { notFoundValue = Injector.THROW_IF_NOT_FOUND; }
            if (injectFlags === void 0) { injectFlags = 0 /* Default */; }
            var flags = 0 /* None */;
            if (injectFlags & 4 /* SkipSelf */) {
                flags |= 1 /* SkipSelf */;
            }
            else if (injectFlags & 2 /* Self */) {
                flags |= 4 /* Self */;
            }
            return resolveNgModuleDep(this, { token: token, tokenKey: tokenKey(token), flags: flags }, notFoundValue);
        };
        Object.defineProperty(NgModuleRef_.prototype, "instance", {
            get: function () { return this.get(this._moduleType); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(NgModuleRef_.prototype, "componentFactoryResolver", {
            get: function () { return this.get(ComponentFactoryResolver); },
            enumerable: true,
            configurable: true
        });
        NgModuleRef_.prototype.destroy = function () {
            if (this._destroyed) {
                throw new Error("The ng module " + stringify(this.instance.constructor) + " has already been destroyed.");
            }
            this._destroyed = true;
            callNgModuleLifecycle(this, 131072 /* OnDestroy */);
            this._destroyListeners.forEach(function (listener) { return listener(); });
        };
        NgModuleRef_.prototype.onDestroy = function (callback) { this._destroyListeners.push(callback); };
        return NgModuleRef_;
    }());

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var RendererV1TokenKey = tokenKey(Renderer);
    var Renderer2TokenKey = tokenKey(Renderer2);
    var ElementRefTokenKey = tokenKey(ElementRef);
    var ViewContainerRefTokenKey = tokenKey(ViewContainerRef);
    var TemplateRefTokenKey = tokenKey(TemplateRef);
    var ChangeDetectorRefTokenKey = tokenKey(ChangeDetectorRef);
    var InjectorRefTokenKey$1 = tokenKey(Injector);
    var INJECTORRefTokenKey$1 = tokenKey(INJECTOR);
    function directiveDef(checkIndex, flags, matchedQueries, childCount, ctor, deps, props, outputs) {
        var bindings = [];
        if (props) {
            for (var prop in props) {
                var _a = __read(props[prop], 2), bindingIndex = _a[0], nonMinifiedName = _a[1];
                bindings[bindingIndex] = {
                    flags: 8 /* TypeProperty */,
                    name: prop, nonMinifiedName: nonMinifiedName,
                    ns: null,
                    securityContext: null,
                    suffix: null
                };
            }
        }
        var outputDefs = [];
        if (outputs) {
            for (var propName in outputs) {
                outputDefs.push({ type: 1 /* DirectiveOutput */, propName: propName, target: null, eventName: outputs[propName] });
            }
        }
        flags |= 16384 /* TypeDirective */;
        return _def(checkIndex, flags, matchedQueries, childCount, ctor, ctor, deps, bindings, outputDefs);
    }
    function pipeDef(flags, ctor, deps) {
        flags |= 16 /* TypePipe */;
        return _def(-1, flags, null, 0, ctor, ctor, deps);
    }
    function providerDef(flags, matchedQueries, token, value, deps) {
        return _def(-1, flags, matchedQueries, 0, token, value, deps);
    }
    function _def(checkIndex, flags, matchedQueriesDsl, childCount, token, value, deps, bindings, outputs) {
        var _a = splitMatchedQueriesDsl(matchedQueriesDsl), matchedQueries = _a.matchedQueries, references = _a.references, matchedQueryIds = _a.matchedQueryIds;
        if (!outputs) {
            outputs = [];
        }
        if (!bindings) {
            bindings = [];
        }
        // Need to resolve forwardRefs as e.g. for `useValue` we
        // lowered the expression and then stopped evaluating it,
        // i.e. also didn't unwrap it.
        value = resolveForwardRef(value);
        var depDefs = splitDepsDsl(deps, stringify(token));
        return {
            // will bet set by the view definition
            nodeIndex: -1,
            parent: null,
            renderParent: null,
            bindingIndex: -1,
            outputIndex: -1,
            // regular values
            checkIndex: checkIndex,
            flags: flags,
            childFlags: 0,
            directChildFlags: 0,
            childMatchedQueries: 0, matchedQueries: matchedQueries, matchedQueryIds: matchedQueryIds, references: references,
            ngContentIndex: -1, childCount: childCount, bindings: bindings,
            bindingFlags: calcBindingFlags(bindings), outputs: outputs,
            element: null,
            provider: { token: token, value: value, deps: depDefs },
            text: null,
            query: null,
            ngContent: null
        };
    }
    function createProviderInstance(view, def) {
        return _createProviderInstance$1(view, def);
    }
    function createPipeInstance(view, def) {
        // deps are looked up from component.
        var compView = view;
        while (compView.parent && !isComponentView(compView)) {
            compView = compView.parent;
        }
        // pipes can see the private services of the component
        var allowPrivateServices = true;
        // pipes are always eager and classes!
        return createClass(compView.parent, viewParentEl(compView), allowPrivateServices, def.provider.value, def.provider.deps);
    }
    function createDirectiveInstance(view, def) {
        // components can see other private services, other directives can't.
        var allowPrivateServices = (def.flags & 32768 /* Component */) > 0;
        // directives are always eager and classes!
        var instance = createClass(view, def.parent, allowPrivateServices, def.provider.value, def.provider.deps);
        if (def.outputs.length) {
            for (var i = 0; i < def.outputs.length; i++) {
                var output = def.outputs[i];
                var outputObservable = instance[output.propName];
                if (isObservable(outputObservable)) {
                    var subscription = outputObservable.subscribe(eventHandlerClosure(view, def.parent.nodeIndex, output.eventName));
                    view.disposables[def.outputIndex + i] = subscription.unsubscribe.bind(subscription);
                }
                else {
                    throw new Error("@Output " + output.propName + " not initialized in '" + instance.constructor.name + "'.");
                }
            }
        }
        return instance;
    }
    function eventHandlerClosure(view, index, eventName) {
        return function (event) { return dispatchEvent(view, index, eventName, event); };
    }
    function checkAndUpdateDirectiveInline(view, def, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9) {
        var providerData = asProviderData(view, def.nodeIndex);
        var directive = providerData.instance;
        var changed = false;
        var changes = undefined;
        var bindLen = def.bindings.length;
        if (bindLen > 0 && checkBinding(view, def, 0, v0)) {
            changed = true;
            changes = updateProp(view, providerData, def, 0, v0, changes);
        }
        if (bindLen > 1 && checkBinding(view, def, 1, v1)) {
            changed = true;
            changes = updateProp(view, providerData, def, 1, v1, changes);
        }
        if (bindLen > 2 && checkBinding(view, def, 2, v2)) {
            changed = true;
            changes = updateProp(view, providerData, def, 2, v2, changes);
        }
        if (bindLen > 3 && checkBinding(view, def, 3, v3)) {
            changed = true;
            changes = updateProp(view, providerData, def, 3, v3, changes);
        }
        if (bindLen > 4 && checkBinding(view, def, 4, v4)) {
            changed = true;
            changes = updateProp(view, providerData, def, 4, v4, changes);
        }
        if (bindLen > 5 && checkBinding(view, def, 5, v5)) {
            changed = true;
            changes = updateProp(view, providerData, def, 5, v5, changes);
        }
        if (bindLen > 6 && checkBinding(view, def, 6, v6)) {
            changed = true;
            changes = updateProp(view, providerData, def, 6, v6, changes);
        }
        if (bindLen > 7 && checkBinding(view, def, 7, v7)) {
            changed = true;
            changes = updateProp(view, providerData, def, 7, v7, changes);
        }
        if (bindLen > 8 && checkBinding(view, def, 8, v8)) {
            changed = true;
            changes = updateProp(view, providerData, def, 8, v8, changes);
        }
        if (bindLen > 9 && checkBinding(view, def, 9, v9)) {
            changed = true;
            changes = updateProp(view, providerData, def, 9, v9, changes);
        }
        if (changes) {
            directive.ngOnChanges(changes);
        }
        if ((def.flags & 65536 /* OnInit */) &&
            shouldCallLifecycleInitHook(view, 256 /* InitState_CallingOnInit */, def.nodeIndex)) {
            directive.ngOnInit();
        }
        if (def.flags & 262144 /* DoCheck */) {
            directive.ngDoCheck();
        }
        return changed;
    }
    function checkAndUpdateDirectiveDynamic(view, def, values) {
        var providerData = asProviderData(view, def.nodeIndex);
        var directive = providerData.instance;
        var changed = false;
        var changes = undefined;
        for (var i = 0; i < values.length; i++) {
            if (checkBinding(view, def, i, values[i])) {
                changed = true;
                changes = updateProp(view, providerData, def, i, values[i], changes);
            }
        }
        if (changes) {
            directive.ngOnChanges(changes);
        }
        if ((def.flags & 65536 /* OnInit */) &&
            shouldCallLifecycleInitHook(view, 256 /* InitState_CallingOnInit */, def.nodeIndex)) {
            directive.ngOnInit();
        }
        if (def.flags & 262144 /* DoCheck */) {
            directive.ngDoCheck();
        }
        return changed;
    }
    function _createProviderInstance$1(view, def) {
        // private services can see other private services
        var allowPrivateServices = (def.flags & 8192 /* PrivateProvider */) > 0;
        var providerDef = def.provider;
        switch (def.flags & 201347067 /* Types */) {
            case 512 /* TypeClassProvider */:
                return createClass(view, def.parent, allowPrivateServices, providerDef.value, providerDef.deps);
            case 1024 /* TypeFactoryProvider */:
                return callFactory(view, def.parent, allowPrivateServices, providerDef.value, providerDef.deps);
            case 2048 /* TypeUseExistingProvider */:
                return resolveDep(view, def.parent, allowPrivateServices, providerDef.deps[0]);
            case 256 /* TypeValueProvider */:
                return providerDef.value;
        }
    }
    function createClass(view, elDef, allowPrivateServices, ctor, deps) {
        var len = deps.length;
        switch (len) {
            case 0:
                return new ctor();
            case 1:
                return new ctor(resolveDep(view, elDef, allowPrivateServices, deps[0]));
            case 2:
                return new ctor(resolveDep(view, elDef, allowPrivateServices, deps[0]), resolveDep(view, elDef, allowPrivateServices, deps[1]));
            case 3:
                return new ctor(resolveDep(view, elDef, allowPrivateServices, deps[0]), resolveDep(view, elDef, allowPrivateServices, deps[1]), resolveDep(view, elDef, allowPrivateServices, deps[2]));
            default:
                var depValues = new Array(len);
                for (var i = 0; i < len; i++) {
                    depValues[i] = resolveDep(view, elDef, allowPrivateServices, deps[i]);
                }
                return new (ctor.bind.apply(ctor, __spread([void 0], depValues)))();
        }
    }
    function callFactory(view, elDef, allowPrivateServices, factory, deps) {
        var len = deps.length;
        switch (len) {
            case 0:
                return factory();
            case 1:
                return factory(resolveDep(view, elDef, allowPrivateServices, deps[0]));
            case 2:
                return factory(resolveDep(view, elDef, allowPrivateServices, deps[0]), resolveDep(view, elDef, allowPrivateServices, deps[1]));
            case 3:
                return factory(resolveDep(view, elDef, allowPrivateServices, deps[0]), resolveDep(view, elDef, allowPrivateServices, deps[1]), resolveDep(view, elDef, allowPrivateServices, deps[2]));
            default:
                var depValues = Array(len);
                for (var i = 0; i < len; i++) {
                    depValues[i] = resolveDep(view, elDef, allowPrivateServices, deps[i]);
                }
                return factory.apply(void 0, __spread(depValues));
        }
    }
    // This default value is when checking the hierarchy for a token.
    //
    // It means both:
    // - the token is not provided by the current injector,
    // - only the element injectors should be checked (ie do not check module injectors
    //
    //          mod1
    //         /
    //       el1   mod2
    //         \  /
    //         el2
    //
    // When requesting el2.injector.get(token), we should check in the following order and return the
    // first found value:
    // - el2.injector.get(token, default)
    // - el1.injector.get(token, NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR) -> do not check the module
    // - mod2.injector.get(token, default)
    var NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR = {};
    function resolveDep(view, elDef, allowPrivateServices, depDef, notFoundValue) {
        if (notFoundValue === void 0) { notFoundValue = Injector.THROW_IF_NOT_FOUND; }
        if (depDef.flags & 8 /* Value */) {
            return depDef.token;
        }
        var startView = view;
        if (depDef.flags & 2 /* Optional */) {
            notFoundValue = null;
        }
        var tokenKey$$1 = depDef.tokenKey;
        if (tokenKey$$1 === ChangeDetectorRefTokenKey) {
            // directives on the same element as a component should be able to control the change detector
            // of that component as well.
            allowPrivateServices = !!(elDef && elDef.element.componentView);
        }
        if (elDef && (depDef.flags & 1 /* SkipSelf */)) {
            allowPrivateServices = false;
            elDef = elDef.parent;
        }
        var searchView = view;
        while (searchView) {
            if (elDef) {
                switch (tokenKey$$1) {
                    case RendererV1TokenKey: {
                        var compView = findCompView(searchView, elDef, allowPrivateServices);
                        return createRendererV1(compView);
                    }
                    case Renderer2TokenKey: {
                        var compView = findCompView(searchView, elDef, allowPrivateServices);
                        return compView.renderer;
                    }
                    case ElementRefTokenKey:
                        return new ElementRef(asElementData(searchView, elDef.nodeIndex).renderElement);
                    case ViewContainerRefTokenKey:
                        return asElementData(searchView, elDef.nodeIndex).viewContainer;
                    case TemplateRefTokenKey: {
                        if (elDef.element.template) {
                            return asElementData(searchView, elDef.nodeIndex).template;
                        }
                        break;
                    }
                    case ChangeDetectorRefTokenKey: {
                        var cdView = findCompView(searchView, elDef, allowPrivateServices);
                        return createChangeDetectorRef(cdView);
                    }
                    case InjectorRefTokenKey$1:
                    case INJECTORRefTokenKey$1:
                        return createInjector$1(searchView, elDef);
                    default:
                        var providerDef_1 = (allowPrivateServices ? elDef.element.allProviders :
                            elDef.element.publicProviders)[tokenKey$$1];
                        if (providerDef_1) {
                            var providerData = asProviderData(searchView, providerDef_1.nodeIndex);
                            if (!providerData) {
                                providerData = { instance: _createProviderInstance$1(searchView, providerDef_1) };
                                searchView.nodes[providerDef_1.nodeIndex] = providerData;
                            }
                            return providerData.instance;
                        }
                }
            }
            allowPrivateServices = isComponentView(searchView);
            elDef = viewParentEl(searchView);
            searchView = searchView.parent;
            if (depDef.flags & 4 /* Self */) {
                searchView = null;
            }
        }
        var value = startView.root.injector.get(depDef.token, NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR);
        if (value !== NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR ||
            notFoundValue === NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR) {
            // Return the value from the root element injector when
            // - it provides it
            //   (value !== NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR)
            // - the module injector should not be checked
            //   (notFoundValue === NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR)
            return value;
        }
        return startView.root.ngModule.injector.get(depDef.token, notFoundValue);
    }
    function findCompView(view, elDef, allowPrivateServices) {
        var compView;
        if (allowPrivateServices) {
            compView = asElementData(view, elDef.nodeIndex).componentView;
        }
        else {
            compView = view;
            while (compView.parent && !isComponentView(compView)) {
                compView = compView.parent;
            }
        }
        return compView;
    }
    function updateProp(view, providerData, def, bindingIdx, value, changes) {
        if (def.flags & 32768 /* Component */) {
            var compView = asElementData(view, def.parent.nodeIndex).componentView;
            if (compView.def.flags & 2 /* OnPush */) {
                compView.state |= 8 /* ChecksEnabled */;
            }
        }
        var binding = def.bindings[bindingIdx];
        var propName = binding.name;
        // Note: This is still safe with Closure Compiler as
        // the user passed in the property name as an object has to `providerDef`,
        // so Closure Compiler will have renamed the property correctly already.
        providerData.instance[propName] = value;
        if (def.flags & 524288 /* OnChanges */) {
            changes = changes || {};
            var oldValue = WrappedValue.unwrap(view.oldValues[def.bindingIndex + bindingIdx]);
            var binding_1 = def.bindings[bindingIdx];
            changes[binding_1.nonMinifiedName] =
                new SimpleChange(oldValue, value, (view.state & 2 /* FirstCheck */) !== 0);
        }
        view.oldValues[def.bindingIndex + bindingIdx] = value;
        return changes;
    }
    // This function calls the ngAfterContentCheck, ngAfterContentInit,
    // ngAfterViewCheck, and ngAfterViewInit lifecycle hooks (depending on the node
    // flags in lifecycle). Unlike ngDoCheck, ngOnChanges and ngOnInit, which are
    // called during a pre-order traversal of the view tree (that is calling the
    // parent hooks before the child hooks) these events are sent in using a
    // post-order traversal of the tree (children before parents). This changes the
    // meaning of initIndex in the view state. For ngOnInit, initIndex tracks the
    // expected nodeIndex which a ngOnInit should be called. When sending
    // ngAfterContentInit and ngAfterViewInit it is the expected count of
    // ngAfterContentInit or ngAfterViewInit methods that have been called. This
    // ensure that despite being called recursively or after picking up after an
    // exception, the ngAfterContentInit or ngAfterViewInit will be called on the
    // correct nodes. Consider for example, the following (where E is an element
    // and D is a directive)
    //  Tree:       pre-order index  post-order index
    //    E1        0                6
    //      E2      1                1
    //       D3     2                0
    //      E4      3                5
    //       E5     4                4
    //        E6    5                2
    //        E7    6                3
    // As can be seen, the post-order index has an unclear relationship to the
    // pre-order index (postOrderIndex === preOrderIndex - parentCount +
    // childCount). Since number of calls to ngAfterContentInit and ngAfterViewInit
    // are stable (will be the same for the same view regardless of exceptions or
    // recursion) we just need to count them which will roughly correspond to the
    // post-order index (it skips elements and directives that do not have
    // lifecycle hooks).
    //
    // For example, if an exception is raised in the E6.onAfterViewInit() the
    // initIndex is left at 3 (by shouldCallLifecycleInitHook() which set it to
    // initIndex + 1). When checkAndUpdateView() is called again D3, E2 and E6 will
    // not have their ngAfterViewInit() called but, starting with E7, the rest of
    // the view will begin getting ngAfterViewInit() called until a check and
    // pass is complete.
    //
    // This algorthim also handles recursion. Consider if E4's ngAfterViewInit()
    // indirectly calls E1's ChangeDetectorRef.detectChanges(). The expected
    // initIndex is set to 6, the recusive checkAndUpdateView() starts walk again.
    // D3, E2, E6, E7, E5 and E4 are skipped, ngAfterViewInit() is called on E1.
    // When the recursion returns the initIndex will be 7 so E1 is skipped as it
    // has already been called in the recursively called checkAnUpdateView().
    function callLifecycleHooksChildrenFirst(view, lifecycles) {
        if (!(view.def.nodeFlags & lifecycles)) {
            return;
        }
        var nodes = view.def.nodes;
        var initIndex = 0;
        for (var i = 0; i < nodes.length; i++) {
            var nodeDef = nodes[i];
            var parent_1 = nodeDef.parent;
            if (!parent_1 && nodeDef.flags & lifecycles) {
                // matching root node (e.g. a pipe)
                callProviderLifecycles(view, i, nodeDef.flags & lifecycles, initIndex++);
            }
            if ((nodeDef.childFlags & lifecycles) === 0) {
                // no child matches one of the lifecycles
                i += nodeDef.childCount;
            }
            while (parent_1 && (parent_1.flags & 1 /* TypeElement */) &&
                i === parent_1.nodeIndex + parent_1.childCount) {
                // last child of an element
                if (parent_1.directChildFlags & lifecycles) {
                    initIndex = callElementProvidersLifecycles(view, parent_1, lifecycles, initIndex);
                }
                parent_1 = parent_1.parent;
            }
        }
    }
    function callElementProvidersLifecycles(view, elDef, lifecycles, initIndex) {
        for (var i = elDef.nodeIndex + 1; i <= elDef.nodeIndex + elDef.childCount; i++) {
            var nodeDef = view.def.nodes[i];
            if (nodeDef.flags & lifecycles) {
                callProviderLifecycles(view, i, nodeDef.flags & lifecycles, initIndex++);
            }
            // only visit direct children
            i += nodeDef.childCount;
        }
        return initIndex;
    }
    function callProviderLifecycles(view, index, lifecycles, initIndex) {
        var providerData = asProviderData(view, index);
        if (!providerData) {
            return;
        }
        var provider = providerData.instance;
        if (!provider) {
            return;
        }
        Services.setCurrentNode(view, index);
        if (lifecycles & 1048576 /* AfterContentInit */ &&
            shouldCallLifecycleInitHook(view, 512 /* InitState_CallingAfterContentInit */, initIndex)) {
            provider.ngAfterContentInit();
        }
        if (lifecycles & 2097152 /* AfterContentChecked */) {
            provider.ngAfterContentChecked();
        }
        if (lifecycles & 4194304 /* AfterViewInit */ &&
            shouldCallLifecycleInitHook(view, 768 /* InitState_CallingAfterViewInit */, initIndex)) {
            provider.ngAfterViewInit();
        }
        if (lifecycles & 8388608 /* AfterViewChecked */) {
            provider.ngAfterViewChecked();
        }
        if (lifecycles & 131072 /* OnDestroy */) {
            provider.ngOnDestroy();
        }
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    function queryDef(flags, id, bindings) {
        var bindingDefs = [];
        for (var propName in bindings) {
            var bindingType = bindings[propName];
            bindingDefs.push({ propName: propName, bindingType: bindingType });
        }
        return {
            // will bet set by the view definition
            nodeIndex: -1,
            parent: null,
            renderParent: null,
            bindingIndex: -1,
            outputIndex: -1,
            // regular values
            // TODO(vicb): check
            checkIndex: -1, flags: flags,
            childFlags: 0,
            directChildFlags: 0,
            childMatchedQueries: 0,
            ngContentIndex: -1,
            matchedQueries: {},
            matchedQueryIds: 0,
            references: {},
            childCount: 0,
            bindings: [],
            bindingFlags: 0,
            outputs: [],
            element: null,
            provider: null,
            text: null,
            query: { id: id, filterId: filterQueryId(id), bindings: bindingDefs },
            ngContent: null
        };
    }
    function createQuery$1() {
        return new QueryList$1();
    }
    function dirtyParentQueries(view) {
        var queryIds = view.def.nodeMatchedQueries;
        while (view.parent && isEmbeddedView(view)) {
            var tplDef = view.parentNodeDef;
            view = view.parent;
            // content queries
            var end = tplDef.nodeIndex + tplDef.childCount;
            for (var i = 0; i <= end; i++) {
                var nodeDef = view.def.nodes[i];
                if ((nodeDef.flags & 67108864 /* TypeContentQuery */) &&
                    (nodeDef.flags & 536870912 /* DynamicQuery */) &&
                    (nodeDef.query.filterId & queryIds) === nodeDef.query.filterId) {
                    asQueryList(view, i).setDirty();
                }
                if ((nodeDef.flags & 1 /* TypeElement */ && i + nodeDef.childCount < tplDef.nodeIndex) ||
                    !(nodeDef.childFlags & 67108864 /* TypeContentQuery */) ||
                    !(nodeDef.childFlags & 536870912 /* DynamicQuery */)) {
                    // skip elements that don't contain the template element or no query.
                    i += nodeDef.childCount;
                }
            }
        }
        // view queries
        if (view.def.nodeFlags & 134217728 /* TypeViewQuery */) {
            for (var i = 0; i < view.def.nodes.length; i++) {
                var nodeDef = view.def.nodes[i];
                if ((nodeDef.flags & 134217728 /* TypeViewQuery */) && (nodeDef.flags & 536870912 /* DynamicQuery */)) {
                    asQueryList(view, i).setDirty();
                }
                // only visit the root nodes
                i += nodeDef.childCount;
            }
        }
    }
    function checkAndUpdateQuery(view, nodeDef) {
        var queryList = asQueryList(view, nodeDef.nodeIndex);
        if (!queryList.dirty) {
            return;
        }
        var directiveInstance;
        var newValues = undefined;
        if (nodeDef.flags & 67108864 /* TypeContentQuery */) {
            var elementDef = nodeDef.parent.parent;
            newValues = calcQueryValues(view, elementDef.nodeIndex, elementDef.nodeIndex + elementDef.childCount, nodeDef.query, []);
            directiveInstance = asProviderData(view, nodeDef.parent.nodeIndex).instance;
        }
        else if (nodeDef.flags & 134217728 /* TypeViewQuery */) {
            newValues = calcQueryValues(view, 0, view.def.nodes.length - 1, nodeDef.query, []);
            directiveInstance = view.component;
        }
        queryList.reset(newValues);
        var bindings = nodeDef.query.bindings;
        var notify = false;
        for (var i = 0; i < bindings.length; i++) {
            var binding = bindings[i];
            var boundValue = void 0;
            switch (binding.bindingType) {
                case 0 /* First */:
                    boundValue = queryList.first;
                    break;
                case 1 /* All */:
                    boundValue = queryList;
                    notify = true;
                    break;
            }
            directiveInstance[binding.propName] = boundValue;
        }
        if (notify) {
            queryList.notifyOnChanges();
        }
    }
    function calcQueryValues(view, startIndex, endIndex, queryDef, values) {
        for (var i = startIndex; i <= endIndex; i++) {
            var nodeDef = view.def.nodes[i];
            var valueType = nodeDef.matchedQueries[queryDef.id];
            if (valueType != null) {
                values.push(getQueryValue(view, nodeDef, valueType));
            }
            if (nodeDef.flags & 1 /* TypeElement */ && nodeDef.element.template &&
                (nodeDef.element.template.nodeMatchedQueries & queryDef.filterId) ===
                    queryDef.filterId) {
                var elementData = asElementData(view, i);
                // check embedded views that were attached at the place of their template,
                // but process child nodes first if some match the query (see issue #16568)
                if ((nodeDef.childMatchedQueries & queryDef.filterId) === queryDef.filterId) {
                    calcQueryValues(view, i + 1, i + nodeDef.childCount, queryDef, values);
                    i += nodeDef.childCount;
                }
                if (nodeDef.flags & 16777216 /* EmbeddedViews */) {
                    var embeddedViews = elementData.viewContainer._embeddedViews;
                    for (var k = 0; k < embeddedViews.length; k++) {
                        var embeddedView = embeddedViews[k];
                        var dvc = declaredViewContainer(embeddedView);
                        if (dvc && dvc === elementData) {
                            calcQueryValues(embeddedView, 0, embeddedView.def.nodes.length - 1, queryDef, values);
                        }
                    }
                }
                var projectedViews = elementData.template._projectedViews;
                if (projectedViews) {
                    for (var k = 0; k < projectedViews.length; k++) {
                        var projectedView = projectedViews[k];
                        calcQueryValues(projectedView, 0, projectedView.def.nodes.length - 1, queryDef, values);
                    }
                }
            }
            if ((nodeDef.childMatchedQueries & queryDef.filterId) !== queryDef.filterId) {
                // if no child matches the query, skip the children.
                i += nodeDef.childCount;
            }
        }
        return values;
    }
    function getQueryValue(view, nodeDef, queryValueType) {
        if (queryValueType != null) {
            // a match
            switch (queryValueType) {
                case 1 /* RenderElement */:
                    return asElementData(view, nodeDef.nodeIndex).renderElement;
                case 0 /* ElementRef */:
                    return new ElementRef(asElementData(view, nodeDef.nodeIndex).renderElement);
                case 2 /* TemplateRef */:
                    return asElementData(view, nodeDef.nodeIndex).template;
                case 3 /* ViewContainerRef */:
                    return asElementData(view, nodeDef.nodeIndex).viewContainer;
                case 4 /* Provider */:
                    return asProviderData(view, nodeDef.nodeIndex).instance;
            }
        }
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    function ngContentDef(ngContentIndex, index) {
        return {
            // will bet set by the view definition
            nodeIndex: -1,
            parent: null,
            renderParent: null,
            bindingIndex: -1,
            outputIndex: -1,
            // regular values
            checkIndex: -1,
            flags: 8 /* TypeNgContent */,
            childFlags: 0,
            directChildFlags: 0,
            childMatchedQueries: 0,
            matchedQueries: {},
            matchedQueryIds: 0,
            references: {}, ngContentIndex: ngContentIndex,
            childCount: 0,
            bindings: [],
            bindingFlags: 0,
            outputs: [],
            element: null,
            provider: null,
            text: null,
            query: null,
            ngContent: { index: index }
        };
    }
    function appendNgContent(view, renderHost, def) {
        var parentEl = getParentRenderElement(view, renderHost, def);
        if (!parentEl) {
            // Nothing to do if there is no parent element.
            return;
        }
        var ngContentIndex = def.ngContent.index;
        visitProjectedRenderNodes(view, ngContentIndex, 1 /* AppendChild */, parentEl, null, undefined);
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    function purePipeDef(checkIndex, argCount) {
        // argCount + 1 to include the pipe as first arg
        return _pureExpressionDef(128 /* TypePurePipe */, checkIndex, new Array(argCount + 1));
    }
    function pureArrayDef(checkIndex, argCount) {
        return _pureExpressionDef(32 /* TypePureArray */, checkIndex, new Array(argCount));
    }
    function pureObjectDef(checkIndex, propToIndex) {
        var keys = Object.keys(propToIndex);
        var nbKeys = keys.length;
        var propertyNames = new Array(nbKeys);
        for (var i = 0; i < nbKeys; i++) {
            var key = keys[i];
            var index = propToIndex[key];
            propertyNames[index] = key;
        }
        return _pureExpressionDef(64 /* TypePureObject */, checkIndex, propertyNames);
    }
    function _pureExpressionDef(flags, checkIndex, propertyNames) {
        var bindings = new Array(propertyNames.length);
        for (var i = 0; i < propertyNames.length; i++) {
            var prop = propertyNames[i];
            bindings[i] = {
                flags: 8 /* TypeProperty */,
                name: prop,
                ns: null,
                nonMinifiedName: prop,
                securityContext: null,
                suffix: null
            };
        }
        return {
            // will bet set by the view definition
            nodeIndex: -1,
            parent: null,
            renderParent: null,
            bindingIndex: -1,
            outputIndex: -1,
            // regular values
            checkIndex: checkIndex,
            flags: flags,
            childFlags: 0,
            directChildFlags: 0,
            childMatchedQueries: 0,
            matchedQueries: {},
            matchedQueryIds: 0,
            references: {},
            ngContentIndex: -1,
            childCount: 0, bindings: bindings,
            bindingFlags: calcBindingFlags(bindings),
            outputs: [],
            element: null,
            provider: null,
            text: null,
            query: null,
            ngContent: null
        };
    }
    function createPureExpression(view, def) {
        return { value: undefined };
    }
    function checkAndUpdatePureExpressionInline(view, def, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9) {
        var bindings = def.bindings;
        var changed = false;
        var bindLen = bindings.length;
        if (bindLen > 0 && checkAndUpdateBinding(view, def, 0, v0))
            changed = true;
        if (bindLen > 1 && checkAndUpdateBinding(view, def, 1, v1))
            changed = true;
        if (bindLen > 2 && checkAndUpdateBinding(view, def, 2, v2))
            changed = true;
        if (bindLen > 3 && checkAndUpdateBinding(view, def, 3, v3))
            changed = true;
        if (bindLen > 4 && checkAndUpdateBinding(view, def, 4, v4))
            changed = true;
        if (bindLen > 5 && checkAndUpdateBinding(view, def, 5, v5))
            changed = true;
        if (bindLen > 6 && checkAndUpdateBinding(view, def, 6, v6))
            changed = true;
        if (bindLen > 7 && checkAndUpdateBinding(view, def, 7, v7))
            changed = true;
        if (bindLen > 8 && checkAndUpdateBinding(view, def, 8, v8))
            changed = true;
        if (bindLen > 9 && checkAndUpdateBinding(view, def, 9, v9))
            changed = true;
        if (changed) {
            var data = asPureExpressionData(view, def.nodeIndex);
            var value = void 0;
            switch (def.flags & 201347067 /* Types */) {
                case 32 /* TypePureArray */:
                    value = new Array(bindings.length);
                    if (bindLen > 0)
                        value[0] = v0;
                    if (bindLen > 1)
                        value[1] = v1;
                    if (bindLen > 2)
                        value[2] = v2;
                    if (bindLen > 3)
                        value[3] = v3;
                    if (bindLen > 4)
                        value[4] = v4;
                    if (bindLen > 5)
                        value[5] = v5;
                    if (bindLen > 6)
                        value[6] = v6;
                    if (bindLen > 7)
                        value[7] = v7;
                    if (bindLen > 8)
                        value[8] = v8;
                    if (bindLen > 9)
                        value[9] = v9;
                    break;
                case 64 /* TypePureObject */:
                    value = {};
                    if (bindLen > 0)
                        value[bindings[0].name] = v0;
                    if (bindLen > 1)
                        value[bindings[1].name] = v1;
                    if (bindLen > 2)
                        value[bindings[2].name] = v2;
                    if (bindLen > 3)
                        value[bindings[3].name] = v3;
                    if (bindLen > 4)
                        value[bindings[4].name] = v4;
                    if (bindLen > 5)
                        value[bindings[5].name] = v5;
                    if (bindLen > 6)
                        value[bindings[6].name] = v6;
                    if (bindLen > 7)
                        value[bindings[7].name] = v7;
                    if (bindLen > 8)
                        value[bindings[8].name] = v8;
                    if (bindLen > 9)
                        value[bindings[9].name] = v9;
                    break;
                case 128 /* TypePurePipe */:
                    var pipe = v0;
                    switch (bindLen) {
                        case 1:
                            value = pipe.transform(v0);
                            break;
                        case 2:
                            value = pipe.transform(v1);
                            break;
                        case 3:
                            value = pipe.transform(v1, v2);
                            break;
                        case 4:
                            value = pipe.transform(v1, v2, v3);
                            break;
                        case 5:
                            value = pipe.transform(v1, v2, v3, v4);
                            break;
                        case 6:
                            value = pipe.transform(v1, v2, v3, v4, v5);
                            break;
                        case 7:
                            value = pipe.transform(v1, v2, v3, v4, v5, v6);
                            break;
                        case 8:
                            value = pipe.transform(v1, v2, v3, v4, v5, v6, v7);
                            break;
                        case 9:
                            value = pipe.transform(v1, v2, v3, v4, v5, v6, v7, v8);
                            break;
                        case 10:
                            value = pipe.transform(v1, v2, v3, v4, v5, v6, v7, v8, v9);
                            break;
                    }
                    break;
            }
            data.value = value;
        }
        return changed;
    }
    function checkAndUpdatePureExpressionDynamic(view, def, values) {
        var bindings = def.bindings;
        var changed = false;
        for (var i = 0; i < values.length; i++) {
            // Note: We need to loop over all values, so that
            // the old values are updates as well!
            if (checkAndUpdateBinding(view, def, i, values[i])) {
                changed = true;
            }
        }
        if (changed) {
            var data = asPureExpressionData(view, def.nodeIndex);
            var value = void 0;
            switch (def.flags & 201347067 /* Types */) {
                case 32 /* TypePureArray */:
                    value = values;
                    break;
                case 64 /* TypePureObject */:
                    value = {};
                    for (var i = 0; i < values.length; i++) {
                        value[bindings[i].name] = values[i];
                    }
                    break;
                case 128 /* TypePurePipe */:
                    var pipe = values[0];
                    var params = values.slice(1);
                    value = pipe.transform.apply(pipe, __spread(params));
                    break;
            }
            data.value = value;
        }
        return changed;
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    function textDef(checkIndex, ngContentIndex, staticText) {
        var bindings = new Array(staticText.length - 1);
        for (var i = 1; i < staticText.length; i++) {
            bindings[i - 1] = {
                flags: 8 /* TypeProperty */,
                name: null,
                ns: null,
                nonMinifiedName: null,
                securityContext: null,
                suffix: staticText[i],
            };
        }
        return {
            // will bet set by the view definition
            nodeIndex: -1,
            parent: null,
            renderParent: null,
            bindingIndex: -1,
            outputIndex: -1,
            // regular values
            checkIndex: checkIndex,
            flags: 2 /* TypeText */,
            childFlags: 0,
            directChildFlags: 0,
            childMatchedQueries: 0,
            matchedQueries: {},
            matchedQueryIds: 0,
            references: {}, ngContentIndex: ngContentIndex,
            childCount: 0, bindings: bindings,
            bindingFlags: 8 /* TypeProperty */,
            outputs: [],
            element: null,
            provider: null,
            text: { prefix: staticText[0] },
            query: null,
            ngContent: null,
        };
    }
    function createText(view, renderHost, def) {
        var renderNode$$1;
        var renderer = view.renderer;
        renderNode$$1 = renderer.createText(def.text.prefix);
        var parentEl = getParentRenderElement(view, renderHost, def);
        if (parentEl) {
            renderer.appendChild(parentEl, renderNode$$1);
        }
        return { renderText: renderNode$$1 };
    }
    function checkAndUpdateTextInline(view, def, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9) {
        var changed = false;
        var bindings = def.bindings;
        var bindLen = bindings.length;
        if (bindLen > 0 && checkAndUpdateBinding(view, def, 0, v0))
            changed = true;
        if (bindLen > 1 && checkAndUpdateBinding(view, def, 1, v1))
            changed = true;
        if (bindLen > 2 && checkAndUpdateBinding(view, def, 2, v2))
            changed = true;
        if (bindLen > 3 && checkAndUpdateBinding(view, def, 3, v3))
            changed = true;
        if (bindLen > 4 && checkAndUpdateBinding(view, def, 4, v4))
            changed = true;
        if (bindLen > 5 && checkAndUpdateBinding(view, def, 5, v5))
            changed = true;
        if (bindLen > 6 && checkAndUpdateBinding(view, def, 6, v6))
            changed = true;
        if (bindLen > 7 && checkAndUpdateBinding(view, def, 7, v7))
            changed = true;
        if (bindLen > 8 && checkAndUpdateBinding(view, def, 8, v8))
            changed = true;
        if (bindLen > 9 && checkAndUpdateBinding(view, def, 9, v9))
            changed = true;
        if (changed) {
            var value = def.text.prefix;
            if (bindLen > 0)
                value += _addInterpolationPart(v0, bindings[0]);
            if (bindLen > 1)
                value += _addInterpolationPart(v1, bindings[1]);
            if (bindLen > 2)
                value += _addInterpolationPart(v2, bindings[2]);
            if (bindLen > 3)
                value += _addInterpolationPart(v3, bindings[3]);
            if (bindLen > 4)
                value += _addInterpolationPart(v4, bindings[4]);
            if (bindLen > 5)
                value += _addInterpolationPart(v5, bindings[5]);
            if (bindLen > 6)
                value += _addInterpolationPart(v6, bindings[6]);
            if (bindLen > 7)
                value += _addInterpolationPart(v7, bindings[7]);
            if (bindLen > 8)
                value += _addInterpolationPart(v8, bindings[8]);
            if (bindLen > 9)
                value += _addInterpolationPart(v9, bindings[9]);
            var renderNode$$1 = asTextData(view, def.nodeIndex).renderText;
            view.renderer.setValue(renderNode$$1, value);
        }
        return changed;
    }
    function checkAndUpdateTextDynamic(view, def, values) {
        var bindings = def.bindings;
        var changed = false;
        for (var i = 0; i < values.length; i++) {
            // Note: We need to loop over all values, so that
            // the old values are updates as well!
            if (checkAndUpdateBinding(view, def, i, values[i])) {
                changed = true;
            }
        }
        if (changed) {
            var value = '';
            for (var i = 0; i < values.length; i++) {
                value = value + _addInterpolationPart(values[i], bindings[i]);
            }
            value = def.text.prefix + value;
            var renderNode$$1 = asTextData(view, def.nodeIndex).renderText;
            view.renderer.setValue(renderNode$$1, value);
        }
        return changed;
    }
    function _addInterpolationPart(value, binding) {
        var valueStr = value != null ? value.toString() : '';
        return valueStr + binding.suffix;
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    function viewDef(flags, nodes, updateDirectives, updateRenderer) {
        // clone nodes and set auto calculated values
        var viewBindingCount = 0;
        var viewDisposableCount = 0;
        var viewNodeFlags = 0;
        var viewRootNodeFlags = 0;
        var viewMatchedQueries = 0;
        var currentParent = null;
        var currentRenderParent = null;
        var currentElementHasPublicProviders = false;
        var currentElementHasPrivateProviders = false;
        var lastRenderRootNode = null;
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            node.nodeIndex = i;
            node.parent = currentParent;
            node.bindingIndex = viewBindingCount;
            node.outputIndex = viewDisposableCount;
            node.renderParent = currentRenderParent;
            viewNodeFlags |= node.flags;
            viewMatchedQueries |= node.matchedQueryIds;
            if (node.element) {
                var elDef = node.element;
                elDef.publicProviders =
                    currentParent ? currentParent.element.publicProviders : Object.create(null);
                elDef.allProviders = elDef.publicProviders;
                // Note: We assume that all providers of an element are before any child element!
                currentElementHasPublicProviders = false;
                currentElementHasPrivateProviders = false;
                if (node.element.template) {
                    viewMatchedQueries |= node.element.template.nodeMatchedQueries;
                }
            }
            validateNode(currentParent, node, nodes.length);
            viewBindingCount += node.bindings.length;
            viewDisposableCount += node.outputs.length;
            if (!currentRenderParent && (node.flags & 3 /* CatRenderNode */)) {
                lastRenderRootNode = node;
            }
            if (node.flags & 20224 /* CatProvider */) {
                if (!currentElementHasPublicProviders) {
                    currentElementHasPublicProviders = true;
                    // Use prototypical inheritance to not get O(n^2) complexity...
                    currentParent.element.publicProviders =
                        Object.create(currentParent.element.publicProviders);
                    currentParent.element.allProviders = currentParent.element.publicProviders;
                }
                var isPrivateService = (node.flags & 8192 /* PrivateProvider */) !== 0;
                var isComponent = (node.flags & 32768 /* Component */) !== 0;
                if (!isPrivateService || isComponent) {
                    currentParent.element.publicProviders[tokenKey(node.provider.token)] = node;
                }
                else {
                    if (!currentElementHasPrivateProviders) {
                        currentElementHasPrivateProviders = true;
                        // Use prototypical inheritance to not get O(n^2) complexity...
                        currentParent.element.allProviders =
                            Object.create(currentParent.element.publicProviders);
                    }
                    currentParent.element.allProviders[tokenKey(node.provider.token)] = node;
                }
                if (isComponent) {
                    currentParent.element.componentProvider = node;
                }
            }
            if (currentParent) {
                currentParent.childFlags |= node.flags;
                currentParent.directChildFlags |= node.flags;
                currentParent.childMatchedQueries |= node.matchedQueryIds;
                if (node.element && node.element.template) {
                    currentParent.childMatchedQueries |= node.element.template.nodeMatchedQueries;
                }
            }
            else {
                viewRootNodeFlags |= node.flags;
            }
            if (node.childCount > 0) {
                currentParent = node;
                if (!isNgContainer(node)) {
                    currentRenderParent = node;
                }
            }
            else {
                // When the current node has no children, check if it is the last children of its parent.
                // When it is, propagate the flags up.
                // The loop is required because an element could be the last transitive children of several
                // elements. We loop to either the root or the highest opened element (= with remaining
                // children)
                while (currentParent && i === currentParent.nodeIndex + currentParent.childCount) {
                    var newParent = currentParent.parent;
                    if (newParent) {
                        newParent.childFlags |= currentParent.childFlags;
                        newParent.childMatchedQueries |= currentParent.childMatchedQueries;
                    }
                    currentParent = newParent;
                    // We also need to update the render parent & account for ng-container
                    if (currentParent && isNgContainer(currentParent)) {
                        currentRenderParent = currentParent.renderParent;
                    }
                    else {
                        currentRenderParent = currentParent;
                    }
                }
            }
        }
        var handleEvent = function (view, nodeIndex, eventName, event) {
            return nodes[nodeIndex].element.handleEvent(view, eventName, event);
        };
        return {
            // Will be filled later...
            factory: null,
            nodeFlags: viewNodeFlags,
            rootNodeFlags: viewRootNodeFlags,
            nodeMatchedQueries: viewMatchedQueries, flags: flags,
            nodes: nodes,
            updateDirectives: updateDirectives || NOOP,
            updateRenderer: updateRenderer || NOOP, handleEvent: handleEvent,
            bindingCount: viewBindingCount,
            outputCount: viewDisposableCount, lastRenderRootNode: lastRenderRootNode
        };
    }
    function isNgContainer(node) {
        return (node.flags & 1 /* TypeElement */) !== 0 && node.element.name === null;
    }
    function validateNode(parent, node, nodeCount) {
        var template = node.element && node.element.template;
        if (template) {
            if (!template.lastRenderRootNode) {
                throw new Error("Illegal State: Embedded templates without nodes are not allowed!");
            }
            if (template.lastRenderRootNode &&
                template.lastRenderRootNode.flags & 16777216 /* EmbeddedViews */) {
                throw new Error("Illegal State: Last root node of a template can't have embedded views, at index " + node.nodeIndex + "!");
            }
        }
        if (node.flags & 20224 /* CatProvider */) {
            var parentFlags = parent ? parent.flags : 0;
            if ((parentFlags & 1 /* TypeElement */) === 0) {
                throw new Error("Illegal State: StaticProvider/Directive nodes need to be children of elements or anchors, at index " + node.nodeIndex + "!");
            }
        }
        if (node.query) {
            if (node.flags & 67108864 /* TypeContentQuery */ &&
                (!parent || (parent.flags & 16384 /* TypeDirective */) === 0)) {
                throw new Error("Illegal State: Content Query nodes need to be children of directives, at index " + node.nodeIndex + "!");
            }
            if (node.flags & 134217728 /* TypeViewQuery */ && parent) {
                throw new Error("Illegal State: View Query nodes have to be top level nodes, at index " + node.nodeIndex + "!");
            }
        }
        if (node.childCount) {
            var parentEnd = parent ? parent.nodeIndex + parent.childCount : nodeCount - 1;
            if (node.nodeIndex <= parentEnd && node.nodeIndex + node.childCount > parentEnd) {
                throw new Error("Illegal State: childCount of node leads outside of parent, at index " + node.nodeIndex + "!");
            }
        }
    }
    function createEmbeddedView(parent, anchorDef$$1, viewDef, context) {
        // embedded views are seen as siblings to the anchor, so we need
        // to get the parent of the anchor and use it as parentIndex.
        var view = createView(parent.root, parent.renderer, parent, anchorDef$$1, viewDef);
        initView(view, parent.component, context);
        createViewNodes(view);
        return view;
    }
    function createRootView(root, def, context) {
        var view = createView(root, root.renderer, null, null, def);
        initView(view, context, context);
        createViewNodes(view);
        return view;
    }
    function createComponentView(parentView, nodeDef, viewDef, hostElement) {
        var rendererType = nodeDef.element.componentRendererType;
        var compRenderer;
        if (!rendererType) {
            compRenderer = parentView.root.renderer;
        }
        else {
            compRenderer = parentView.root.rendererFactory.createRenderer(hostElement, rendererType);
        }
        return createView(parentView.root, compRenderer, parentView, nodeDef.element.componentProvider, viewDef);
    }
    function createView(root, renderer, parent, parentNodeDef, def) {
        var nodes = new Array(def.nodes.length);
        var disposables = def.outputCount ? new Array(def.outputCount) : null;
        var view = {
            def: def,
            parent: parent,
            viewContainerParent: null, parentNodeDef: parentNodeDef,
            context: null,
            component: null, nodes: nodes,
            state: 13 /* CatInit */, root: root, renderer: renderer,
            oldValues: new Array(def.bindingCount), disposables: disposables,
            initIndex: -1
        };
        return view;
    }
    function initView(view, component, context) {
        view.component = component;
        view.context = context;
    }
    function createViewNodes(view) {
        var renderHost;
        if (isComponentView(view)) {
            var hostDef = view.parentNodeDef;
            renderHost = asElementData(view.parent, hostDef.parent.nodeIndex).renderElement;
        }
        var def = view.def;
        var nodes = view.nodes;
        for (var i = 0; i < def.nodes.length; i++) {
            var nodeDef = def.nodes[i];
            Services.setCurrentNode(view, i);
            var nodeData = void 0;
            switch (nodeDef.flags & 201347067 /* Types */) {
                case 1 /* TypeElement */:
                    var el = createElement(view, renderHost, nodeDef);
                    var componentView = undefined;
                    if (nodeDef.flags & 33554432 /* ComponentView */) {
                        var compViewDef = resolveDefinition(nodeDef.element.componentView);
                        componentView = Services.createComponentView(view, nodeDef, compViewDef, el);
                    }
                    listenToElementOutputs(view, componentView, nodeDef, el);
                    nodeData = {
                        renderElement: el,
                        componentView: componentView,
                        viewContainer: null,
                        template: nodeDef.element.template ? createTemplateData(view, nodeDef) : undefined
                    };
                    if (nodeDef.flags & 16777216 /* EmbeddedViews */) {
                        nodeData.viewContainer = createViewContainerData(view, nodeDef, nodeData);
                    }
                    break;
                case 2 /* TypeText */:
                    nodeData = createText(view, renderHost, nodeDef);
                    break;
                case 512 /* TypeClassProvider */:
                case 1024 /* TypeFactoryProvider */:
                case 2048 /* TypeUseExistingProvider */:
                case 256 /* TypeValueProvider */: {
                    nodeData = nodes[i];
                    if (!nodeData && !(nodeDef.flags & 4096 /* LazyProvider */)) {
                        var instance = createProviderInstance(view, nodeDef);
                        nodeData = { instance: instance };
                    }
                    break;
                }
                case 16 /* TypePipe */: {
                    var instance = createPipeInstance(view, nodeDef);
                    nodeData = { instance: instance };
                    break;
                }
                case 16384 /* TypeDirective */: {
                    nodeData = nodes[i];
                    if (!nodeData) {
                        var instance = createDirectiveInstance(view, nodeDef);
                        nodeData = { instance: instance };
                    }
                    if (nodeDef.flags & 32768 /* Component */) {
                        var compView = asElementData(view, nodeDef.parent.nodeIndex).componentView;
                        initView(compView, nodeData.instance, nodeData.instance);
                    }
                    break;
                }
                case 32 /* TypePureArray */:
                case 64 /* TypePureObject */:
                case 128 /* TypePurePipe */:
                    nodeData = createPureExpression(view, nodeDef);
                    break;
                case 67108864 /* TypeContentQuery */:
                case 134217728 /* TypeViewQuery */:
                    nodeData = createQuery$1();
                    break;
                case 8 /* TypeNgContent */:
                    appendNgContent(view, renderHost, nodeDef);
                    // no runtime data needed for NgContent...
                    nodeData = undefined;
                    break;
            }
            nodes[i] = nodeData;
        }
        // Create the ViewData.nodes of component views after we created everything else,
        // so that e.g. ng-content works
        execComponentViewsAction(view, ViewAction.CreateViewNodes);
        // fill static content and view queries
        execQueriesAction(view, 67108864 /* TypeContentQuery */ | 134217728 /* TypeViewQuery */, 268435456 /* StaticQuery */, 0 /* CheckAndUpdate */);
    }
    function checkNoChangesView(view) {
        markProjectedViewsForCheck(view);
        Services.updateDirectives(view, 1 /* CheckNoChanges */);
        execEmbeddedViewsAction(view, ViewAction.CheckNoChanges);
        Services.updateRenderer(view, 1 /* CheckNoChanges */);
        execComponentViewsAction(view, ViewAction.CheckNoChanges);
        // Note: We don't check queries for changes as we didn't do this in v2.x.
        // TODO(tbosch): investigate if we can enable the check again in v5.x with a nicer error message.
        view.state &= ~(64 /* CheckProjectedViews */ | 32 /* CheckProjectedView */);
    }
    function checkAndUpdateView(view) {
        if (view.state & 1 /* BeforeFirstCheck */) {
            view.state &= ~1 /* BeforeFirstCheck */;
            view.state |= 2 /* FirstCheck */;
        }
        else {
            view.state &= ~2 /* FirstCheck */;
        }
        shiftInitState(view, 0 /* InitState_BeforeInit */, 256 /* InitState_CallingOnInit */);
        markProjectedViewsForCheck(view);
        Services.updateDirectives(view, 0 /* CheckAndUpdate */);
        execEmbeddedViewsAction(view, ViewAction.CheckAndUpdate);
        execQueriesAction(view, 67108864 /* TypeContentQuery */, 536870912 /* DynamicQuery */, 0 /* CheckAndUpdate */);
        var callInit = shiftInitState(view, 256 /* InitState_CallingOnInit */, 512 /* InitState_CallingAfterContentInit */);
        callLifecycleHooksChildrenFirst(view, 2097152 /* AfterContentChecked */ | (callInit ? 1048576 /* AfterContentInit */ : 0));
        Services.updateRenderer(view, 0 /* CheckAndUpdate */);
        execComponentViewsAction(view, ViewAction.CheckAndUpdate);
        execQueriesAction(view, 134217728 /* TypeViewQuery */, 536870912 /* DynamicQuery */, 0 /* CheckAndUpdate */);
        callInit = shiftInitState(view, 512 /* InitState_CallingAfterContentInit */, 768 /* InitState_CallingAfterViewInit */);
        callLifecycleHooksChildrenFirst(view, 8388608 /* AfterViewChecked */ | (callInit ? 4194304 /* AfterViewInit */ : 0));
        if (view.def.flags & 2 /* OnPush */) {
            view.state &= ~8 /* ChecksEnabled */;
        }
        view.state &= ~(64 /* CheckProjectedViews */ | 32 /* CheckProjectedView */);
        shiftInitState(view, 768 /* InitState_CallingAfterViewInit */, 1024 /* InitState_AfterInit */);
    }
    function checkAndUpdateNode(view, nodeDef, argStyle, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9) {
        if (argStyle === 0 /* Inline */) {
            return checkAndUpdateNodeInline(view, nodeDef, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9);
        }
        else {
            return checkAndUpdateNodeDynamic(view, nodeDef, v0);
        }
    }
    function markProjectedViewsForCheck(view) {
        var def = view.def;
        if (!(def.nodeFlags & 4 /* ProjectedTemplate */)) {
            return;
        }
        for (var i = 0; i < def.nodes.length; i++) {
            var nodeDef = def.nodes[i];
            if (nodeDef.flags & 4 /* ProjectedTemplate */) {
                var projectedViews = asElementData(view, i).template._projectedViews;
                if (projectedViews) {
                    for (var i_1 = 0; i_1 < projectedViews.length; i_1++) {
                        var projectedView = projectedViews[i_1];
                        projectedView.state |= 32 /* CheckProjectedView */;
                        markParentViewsForCheckProjectedViews(projectedView, view);
                    }
                }
            }
            else if ((nodeDef.childFlags & 4 /* ProjectedTemplate */) === 0) {
                // a parent with leafs
                // no child is a component,
                // then skip the children
                i += nodeDef.childCount;
            }
        }
    }
    function checkAndUpdateNodeInline(view, nodeDef, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9) {
        switch (nodeDef.flags & 201347067 /* Types */) {
            case 1 /* TypeElement */:
                return checkAndUpdateElementInline(view, nodeDef, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9);
            case 2 /* TypeText */:
                return checkAndUpdateTextInline(view, nodeDef, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9);
            case 16384 /* TypeDirective */:
                return checkAndUpdateDirectiveInline(view, nodeDef, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9);
            case 32 /* TypePureArray */:
            case 64 /* TypePureObject */:
            case 128 /* TypePurePipe */:
                return checkAndUpdatePureExpressionInline(view, nodeDef, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9);
            default:
                throw 'unreachable';
        }
    }
    function checkAndUpdateNodeDynamic(view, nodeDef, values) {
        switch (nodeDef.flags & 201347067 /* Types */) {
            case 1 /* TypeElement */:
                return checkAndUpdateElementDynamic(view, nodeDef, values);
            case 2 /* TypeText */:
                return checkAndUpdateTextDynamic(view, nodeDef, values);
            case 16384 /* TypeDirective */:
                return checkAndUpdateDirectiveDynamic(view, nodeDef, values);
            case 32 /* TypePureArray */:
            case 64 /* TypePureObject */:
            case 128 /* TypePurePipe */:
                return checkAndUpdatePureExpressionDynamic(view, nodeDef, values);
            default:
                throw 'unreachable';
        }
    }
    function checkNoChangesNode(view, nodeDef, argStyle, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9) {
        if (argStyle === 0 /* Inline */) {
            checkNoChangesNodeInline(view, nodeDef, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9);
        }
        else {
            checkNoChangesNodeDynamic(view, nodeDef, v0);
        }
        // Returning false is ok here as we would have thrown in case of a change.
        return false;
    }
    function checkNoChangesNodeInline(view, nodeDef, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9) {
        var bindLen = nodeDef.bindings.length;
        if (bindLen > 0)
            checkBindingNoChanges(view, nodeDef, 0, v0);
        if (bindLen > 1)
            checkBindingNoChanges(view, nodeDef, 1, v1);
        if (bindLen > 2)
            checkBindingNoChanges(view, nodeDef, 2, v2);
        if (bindLen > 3)
            checkBindingNoChanges(view, nodeDef, 3, v3);
        if (bindLen > 4)
            checkBindingNoChanges(view, nodeDef, 4, v4);
        if (bindLen > 5)
            checkBindingNoChanges(view, nodeDef, 5, v5);
        if (bindLen > 6)
            checkBindingNoChanges(view, nodeDef, 6, v6);
        if (bindLen > 7)
            checkBindingNoChanges(view, nodeDef, 7, v7);
        if (bindLen > 8)
            checkBindingNoChanges(view, nodeDef, 8, v8);
        if (bindLen > 9)
            checkBindingNoChanges(view, nodeDef, 9, v9);
    }
    function checkNoChangesNodeDynamic(view, nodeDef, values) {
        for (var i = 0; i < values.length; i++) {
            checkBindingNoChanges(view, nodeDef, i, values[i]);
        }
    }
    /**
     * Workaround https://github.com/angular/tsickle/issues/497
     * @suppress {misplacedTypeAnnotation}
     */
    function checkNoChangesQuery(view, nodeDef) {
        var queryList = asQueryList(view, nodeDef.nodeIndex);
        if (queryList.dirty) {
            throw expressionChangedAfterItHasBeenCheckedError(Services.createDebugContext(view, nodeDef.nodeIndex), "Query " + nodeDef.query.id + " not dirty", "Query " + nodeDef.query.id + " dirty", (view.state & 1 /* BeforeFirstCheck */) !== 0);
        }
    }
    function destroyView(view) {
        if (view.state & 128 /* Destroyed */) {
            return;
        }
        execEmbeddedViewsAction(view, ViewAction.Destroy);
        execComponentViewsAction(view, ViewAction.Destroy);
        callLifecycleHooksChildrenFirst(view, 131072 /* OnDestroy */);
        if (view.disposables) {
            for (var i = 0; i < view.disposables.length; i++) {
                view.disposables[i]();
            }
        }
        detachProjectedView(view);
        if (view.renderer.destroyNode) {
            destroyViewNodes(view);
        }
        if (isComponentView(view)) {
            view.renderer.destroy();
        }
        view.state |= 128 /* Destroyed */;
    }
    function destroyViewNodes(view) {
        var len = view.def.nodes.length;
        for (var i = 0; i < len; i++) {
            var def = view.def.nodes[i];
            if (def.flags & 1 /* TypeElement */) {
                view.renderer.destroyNode(asElementData(view, i).renderElement);
            }
            else if (def.flags & 2 /* TypeText */) {
                view.renderer.destroyNode(asTextData(view, i).renderText);
            }
            else if (def.flags & 67108864 /* TypeContentQuery */ || def.flags & 134217728 /* TypeViewQuery */) {
                asQueryList(view, i).destroy();
            }
        }
    }
    var ViewAction;
    (function (ViewAction) {
        ViewAction[ViewAction["CreateViewNodes"] = 0] = "CreateViewNodes";
        ViewAction[ViewAction["CheckNoChanges"] = 1] = "CheckNoChanges";
        ViewAction[ViewAction["CheckNoChangesProjectedViews"] = 2] = "CheckNoChangesProjectedViews";
        ViewAction[ViewAction["CheckAndUpdate"] = 3] = "CheckAndUpdate";
        ViewAction[ViewAction["CheckAndUpdateProjectedViews"] = 4] = "CheckAndUpdateProjectedViews";
        ViewAction[ViewAction["Destroy"] = 5] = "Destroy";
    })(ViewAction || (ViewAction = {}));
    function execComponentViewsAction(view, action) {
        var def = view.def;
        if (!(def.nodeFlags & 33554432 /* ComponentView */)) {
            return;
        }
        for (var i = 0; i < def.nodes.length; i++) {
            var nodeDef = def.nodes[i];
            if (nodeDef.flags & 33554432 /* ComponentView */) {
                // a leaf
                callViewAction(asElementData(view, i).componentView, action);
            }
            else if ((nodeDef.childFlags & 33554432 /* ComponentView */) === 0) {
                // a parent with leafs
                // no child is a component,
                // then skip the children
                i += nodeDef.childCount;
            }
        }
    }
    function execEmbeddedViewsAction(view, action) {
        var def = view.def;
        if (!(def.nodeFlags & 16777216 /* EmbeddedViews */)) {
            return;
        }
        for (var i = 0; i < def.nodes.length; i++) {
            var nodeDef = def.nodes[i];
            if (nodeDef.flags & 16777216 /* EmbeddedViews */) {
                // a leaf
                var embeddedViews = asElementData(view, i).viewContainer._embeddedViews;
                for (var k = 0; k < embeddedViews.length; k++) {
                    callViewAction(embeddedViews[k], action);
                }
            }
            else if ((nodeDef.childFlags & 16777216 /* EmbeddedViews */) === 0) {
                // a parent with leafs
                // no child is a component,
                // then skip the children
                i += nodeDef.childCount;
            }
        }
    }
    function callViewAction(view, action) {
        var viewState = view.state;
        switch (action) {
            case ViewAction.CheckNoChanges:
                if ((viewState & 128 /* Destroyed */) === 0) {
                    if ((viewState & 12 /* CatDetectChanges */) === 12 /* CatDetectChanges */) {
                        checkNoChangesView(view);
                    }
                    else if (viewState & 64 /* CheckProjectedViews */) {
                        execProjectedViewsAction(view, ViewAction.CheckNoChangesProjectedViews);
                    }
                }
                break;
            case ViewAction.CheckNoChangesProjectedViews:
                if ((viewState & 128 /* Destroyed */) === 0) {
                    if (viewState & 32 /* CheckProjectedView */) {
                        checkNoChangesView(view);
                    }
                    else if (viewState & 64 /* CheckProjectedViews */) {
                        execProjectedViewsAction(view, action);
                    }
                }
                break;
            case ViewAction.CheckAndUpdate:
                if ((viewState & 128 /* Destroyed */) === 0) {
                    if ((viewState & 12 /* CatDetectChanges */) === 12 /* CatDetectChanges */) {
                        checkAndUpdateView(view);
                    }
                    else if (viewState & 64 /* CheckProjectedViews */) {
                        execProjectedViewsAction(view, ViewAction.CheckAndUpdateProjectedViews);
                    }
                }
                break;
            case ViewAction.CheckAndUpdateProjectedViews:
                if ((viewState & 128 /* Destroyed */) === 0) {
                    if (viewState & 32 /* CheckProjectedView */) {
                        checkAndUpdateView(view);
                    }
                    else if (viewState & 64 /* CheckProjectedViews */) {
                        execProjectedViewsAction(view, action);
                    }
                }
                break;
            case ViewAction.Destroy:
                // Note: destroyView recurses over all views,
                // so we don't need to special case projected views here.
                destroyView(view);
                break;
            case ViewAction.CreateViewNodes:
                createViewNodes(view);
                break;
        }
    }
    function execProjectedViewsAction(view, action) {
        execEmbeddedViewsAction(view, action);
        execComponentViewsAction(view, action);
    }
    function execQueriesAction(view, queryFlags, staticDynamicQueryFlag, checkType) {
        if (!(view.def.nodeFlags & queryFlags) || !(view.def.nodeFlags & staticDynamicQueryFlag)) {
            return;
        }
        var nodeCount = view.def.nodes.length;
        for (var i = 0; i < nodeCount; i++) {
            var nodeDef = view.def.nodes[i];
            if ((nodeDef.flags & queryFlags) && (nodeDef.flags & staticDynamicQueryFlag)) {
                Services.setCurrentNode(view, nodeDef.nodeIndex);
                switch (checkType) {
                    case 0 /* CheckAndUpdate */:
                        checkAndUpdateQuery(view, nodeDef);
                        break;
                    case 1 /* CheckNoChanges */:
                        checkNoChangesQuery(view, nodeDef);
                        break;
                }
            }
            if (!(nodeDef.childFlags & queryFlags) || !(nodeDef.childFlags & staticDynamicQueryFlag)) {
                // no child has a matching query
                // then skip the children
                i += nodeDef.childCount;
            }
        }
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var initialized = false;
    function initServicesIfNeeded() {
        if (initialized) {
            return;
        }
        initialized = true;
        var services = isDevMode() ? createDebugServices() : createProdServices();
        Services.setCurrentNode = services.setCurrentNode;
        Services.createRootView = services.createRootView;
        Services.createEmbeddedView = services.createEmbeddedView;
        Services.createComponentView = services.createComponentView;
        Services.createNgModuleRef = services.createNgModuleRef;
        Services.overrideProvider = services.overrideProvider;
        Services.overrideComponentView = services.overrideComponentView;
        Services.clearOverrides = services.clearOverrides;
        Services.checkAndUpdateView = services.checkAndUpdateView;
        Services.checkNoChangesView = services.checkNoChangesView;
        Services.destroyView = services.destroyView;
        Services.resolveDep = resolveDep;
        Services.createDebugContext = services.createDebugContext;
        Services.handleEvent = services.handleEvent;
        Services.updateDirectives = services.updateDirectives;
        Services.updateRenderer = services.updateRenderer;
        Services.dirtyParentQueries = dirtyParentQueries;
    }
    function createProdServices() {
        return {
            setCurrentNode: function () { },
            createRootView: createProdRootView,
            createEmbeddedView: createEmbeddedView,
            createComponentView: createComponentView,
            createNgModuleRef: createNgModuleRef,
            overrideProvider: NOOP,
            overrideComponentView: NOOP,
            clearOverrides: NOOP,
            checkAndUpdateView: checkAndUpdateView,
            checkNoChangesView: checkNoChangesView,
            destroyView: destroyView,
            createDebugContext: function (view, nodeIndex) { return new DebugContext_(view, nodeIndex); },
            handleEvent: function (view, nodeIndex, eventName, event) {
                return view.def.handleEvent(view, nodeIndex, eventName, event);
            },
            updateDirectives: function (view, checkType) { return view.def.updateDirectives(checkType === 0 /* CheckAndUpdate */ ? prodCheckAndUpdateNode :
                prodCheckNoChangesNode, view); },
            updateRenderer: function (view, checkType) { return view.def.updateRenderer(checkType === 0 /* CheckAndUpdate */ ? prodCheckAndUpdateNode :
                prodCheckNoChangesNode, view); },
        };
    }
    function createDebugServices() {
        return {
            setCurrentNode: debugSetCurrentNode,
            createRootView: debugCreateRootView,
            createEmbeddedView: debugCreateEmbeddedView,
            createComponentView: debugCreateComponentView,
            createNgModuleRef: debugCreateNgModuleRef,
            overrideProvider: debugOverrideProvider,
            overrideComponentView: debugOverrideComponentView,
            clearOverrides: debugClearOverrides,
            checkAndUpdateView: debugCheckAndUpdateView,
            checkNoChangesView: debugCheckNoChangesView,
            destroyView: debugDestroyView,
            createDebugContext: function (view, nodeIndex) { return new DebugContext_(view, nodeIndex); },
            handleEvent: debugHandleEvent,
            updateDirectives: debugUpdateDirectives,
            updateRenderer: debugUpdateRenderer,
        };
    }
    function createProdRootView(elInjector, projectableNodes, rootSelectorOrNode, def, ngModule, context) {
        var rendererFactory = ngModule.injector.get(RendererFactory2);
        return createRootView(createRootData(elInjector, ngModule, rendererFactory, projectableNodes, rootSelectorOrNode), def, context);
    }
    function debugCreateRootView(elInjector, projectableNodes, rootSelectorOrNode, def, ngModule, context) {
        var rendererFactory = ngModule.injector.get(RendererFactory2);
        var root = createRootData(elInjector, ngModule, new DebugRendererFactory2(rendererFactory), projectableNodes, rootSelectorOrNode);
        var defWithOverride = applyProviderOverridesToView(def);
        return callWithDebugContext(DebugAction.create, createRootView, null, [root, defWithOverride, context]);
    }
    function createRootData(elInjector, ngModule, rendererFactory, projectableNodes, rootSelectorOrNode) {
        var sanitizer = ngModule.injector.get(Sanitizer);
        var errorHandler = ngModule.injector.get(ErrorHandler);
        var renderer = rendererFactory.createRenderer(null, null);
        return {
            ngModule: ngModule,
            injector: elInjector, projectableNodes: projectableNodes,
            selectorOrNode: rootSelectorOrNode, sanitizer: sanitizer, rendererFactory: rendererFactory, renderer: renderer, errorHandler: errorHandler
        };
    }
    function debugCreateEmbeddedView(parentView, anchorDef, viewDef$$1, context) {
        var defWithOverride = applyProviderOverridesToView(viewDef$$1);
        return callWithDebugContext(DebugAction.create, createEmbeddedView, null, [parentView, anchorDef, defWithOverride, context]);
    }
    function debugCreateComponentView(parentView, nodeDef, viewDef$$1, hostElement) {
        var overrideComponentView = viewDefOverrides.get(nodeDef.element.componentProvider.provider.token);
        if (overrideComponentView) {
            viewDef$$1 = overrideComponentView;
        }
        else {
            viewDef$$1 = applyProviderOverridesToView(viewDef$$1);
        }
        return callWithDebugContext(DebugAction.create, createComponentView, null, [parentView, nodeDef, viewDef$$1, hostElement]);
    }
    function debugCreateNgModuleRef(moduleType, parentInjector, bootstrapComponents, def) {
        var defWithOverride = applyProviderOverridesToNgModule(def);
        return createNgModuleRef(moduleType, parentInjector, bootstrapComponents, defWithOverride);
    }
    var providerOverrides = new Map();
    var providerOverridesWithScope = new Map();
    var viewDefOverrides = new Map();
    function debugOverrideProvider(override) {
        providerOverrides.set(override.token, override);
        var injectableDef;
        if (typeof override.token === 'function' && (injectableDef = getInjectableDef(override.token)) &&
            typeof injectableDef.providedIn === 'function') {
            providerOverridesWithScope.set(override.token, override);
        }
    }
    function debugOverrideComponentView(comp, compFactory) {
        var hostViewDef = resolveDefinition(getComponentViewDefinitionFactory(compFactory));
        var compViewDef = resolveDefinition(hostViewDef.nodes[0].element.componentView);
        viewDefOverrides.set(comp, compViewDef);
    }
    function debugClearOverrides() {
        providerOverrides.clear();
        providerOverridesWithScope.clear();
        viewDefOverrides.clear();
    }
    // Notes about the algorithm:
    // 1) Locate the providers of an element and check if one of them was overwritten
    // 2) Change the providers of that element
    //
    // We only create new datastructures if we need to, to keep perf impact
    // reasonable.
    function applyProviderOverridesToView(def) {
        if (providerOverrides.size === 0) {
            return def;
        }
        var elementIndicesWithOverwrittenProviders = findElementIndicesWithOverwrittenProviders(def);
        if (elementIndicesWithOverwrittenProviders.length === 0) {
            return def;
        }
        // clone the whole view definition,
        // as it maintains references between the nodes that are hard to update.
        def = def.factory(function () { return NOOP; });
        for (var i = 0; i < elementIndicesWithOverwrittenProviders.length; i++) {
            applyProviderOverridesToElement(def, elementIndicesWithOverwrittenProviders[i]);
        }
        return def;
        function findElementIndicesWithOverwrittenProviders(def) {
            var elIndicesWithOverwrittenProviders = [];
            var lastElementDef = null;
            for (var i = 0; i < def.nodes.length; i++) {
                var nodeDef = def.nodes[i];
                if (nodeDef.flags & 1 /* TypeElement */) {
                    lastElementDef = nodeDef;
                }
                if (lastElementDef && nodeDef.flags & 3840 /* CatProviderNoDirective */ &&
                    providerOverrides.has(nodeDef.provider.token)) {
                    elIndicesWithOverwrittenProviders.push(lastElementDef.nodeIndex);
                    lastElementDef = null;
                }
            }
            return elIndicesWithOverwrittenProviders;
        }
        function applyProviderOverridesToElement(viewDef$$1, elIndex) {
            for (var i = elIndex + 1; i < viewDef$$1.nodes.length; i++) {
                var nodeDef = viewDef$$1.nodes[i];
                if (nodeDef.flags & 1 /* TypeElement */) {
                    // stop at the next element
                    return;
                }
                if (nodeDef.flags & 3840 /* CatProviderNoDirective */) {
                    var provider = nodeDef.provider;
                    var override = providerOverrides.get(provider.token);
                    if (override) {
                        nodeDef.flags = (nodeDef.flags & ~3840 /* CatProviderNoDirective */) | override.flags;
                        provider.deps = splitDepsDsl(override.deps);
                        provider.value = override.value;
                    }
                }
            }
        }
    }
    // Notes about the algorithm:
    // We only create new datastructures if we need to, to keep perf impact
    // reasonable.
    function applyProviderOverridesToNgModule(def) {
        var _a = calcHasOverrides(def), hasOverrides = _a.hasOverrides, hasDeprecatedOverrides = _a.hasDeprecatedOverrides;
        if (!hasOverrides) {
            return def;
        }
        // clone the whole view definition,
        // as it maintains references between the nodes that are hard to update.
        def = def.factory(function () { return NOOP; });
        applyProviderOverrides(def);
        return def;
        function calcHasOverrides(def) {
            var hasOverrides = false;
            var hasDeprecatedOverrides = false;
            if (providerOverrides.size === 0) {
                return { hasOverrides: hasOverrides, hasDeprecatedOverrides: hasDeprecatedOverrides };
            }
            def.providers.forEach(function (node) {
                var override = providerOverrides.get(node.token);
                if ((node.flags & 3840 /* CatProviderNoDirective */) && override) {
                    hasOverrides = true;
                    hasDeprecatedOverrides = hasDeprecatedOverrides || override.deprecatedBehavior;
                }
            });
            def.modules.forEach(function (module) {
                providerOverridesWithScope.forEach(function (override, token) {
                    if (getInjectableDef(token).providedIn === module) {
                        hasOverrides = true;
                        hasDeprecatedOverrides = hasDeprecatedOverrides || override.deprecatedBehavior;
                    }
                });
            });
            return { hasOverrides: hasOverrides, hasDeprecatedOverrides: hasDeprecatedOverrides };
        }
        function applyProviderOverrides(def) {
            for (var i = 0; i < def.providers.length; i++) {
                var provider = def.providers[i];
                if (hasDeprecatedOverrides) {
                    // We had a bug where me made
                    // all providers lazy. Keep this logic behind a flag
                    // for migrating existing users.
                    provider.flags |= 4096 /* LazyProvider */;
                }
                var override = providerOverrides.get(provider.token);
                if (override) {
                    provider.flags = (provider.flags & ~3840 /* CatProviderNoDirective */) | override.flags;
                    provider.deps = splitDepsDsl(override.deps);
                    provider.value = override.value;
                }
            }
            if (providerOverridesWithScope.size > 0) {
                var moduleSet_1 = new Set(def.modules);
                providerOverridesWithScope.forEach(function (override, token) {
                    if (moduleSet_1.has(getInjectableDef(token).providedIn)) {
                        var provider = {
                            token: token,
                            flags: override.flags | (hasDeprecatedOverrides ? 4096 /* LazyProvider */ : 0 /* None */),
                            deps: splitDepsDsl(override.deps),
                            value: override.value,
                            index: def.providers.length,
                        };
                        def.providers.push(provider);
                        def.providersByKey[tokenKey(token)] = provider;
                    }
                });
            }
        }
    }
    function prodCheckAndUpdateNode(view, checkIndex, argStyle, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9) {
        var nodeDef = view.def.nodes[checkIndex];
        checkAndUpdateNode(view, nodeDef, argStyle, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9);
        return (nodeDef.flags & 224 /* CatPureExpression */) ?
            asPureExpressionData(view, checkIndex).value :
            undefined;
    }
    function prodCheckNoChangesNode(view, checkIndex, argStyle, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9) {
        var nodeDef = view.def.nodes[checkIndex];
        checkNoChangesNode(view, nodeDef, argStyle, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9);
        return (nodeDef.flags & 224 /* CatPureExpression */) ?
            asPureExpressionData(view, checkIndex).value :
            undefined;
    }
    function debugCheckAndUpdateView(view) {
        return callWithDebugContext(DebugAction.detectChanges, checkAndUpdateView, null, [view]);
    }
    function debugCheckNoChangesView(view) {
        return callWithDebugContext(DebugAction.checkNoChanges, checkNoChangesView, null, [view]);
    }
    function debugDestroyView(view) {
        return callWithDebugContext(DebugAction.destroy, destroyView, null, [view]);
    }
    var DebugAction;
    (function (DebugAction) {
        DebugAction[DebugAction["create"] = 0] = "create";
        DebugAction[DebugAction["detectChanges"] = 1] = "detectChanges";
        DebugAction[DebugAction["checkNoChanges"] = 2] = "checkNoChanges";
        DebugAction[DebugAction["destroy"] = 3] = "destroy";
        DebugAction[DebugAction["handleEvent"] = 4] = "handleEvent";
    })(DebugAction || (DebugAction = {}));
    var _currentAction;
    var _currentView;
    var _currentNodeIndex;
    function debugSetCurrentNode(view, nodeIndex) {
        _currentView = view;
        _currentNodeIndex = nodeIndex;
    }
    function debugHandleEvent(view, nodeIndex, eventName, event) {
        debugSetCurrentNode(view, nodeIndex);
        return callWithDebugContext(DebugAction.handleEvent, view.def.handleEvent, null, [view, nodeIndex, eventName, event]);
    }
    function debugUpdateDirectives(view, checkType) {
        if (view.state & 128 /* Destroyed */) {
            throw viewDestroyedError(DebugAction[_currentAction]);
        }
        debugSetCurrentNode(view, nextDirectiveWithBinding(view, 0));
        return view.def.updateDirectives(debugCheckDirectivesFn, view);
        function debugCheckDirectivesFn(view, nodeIndex, argStyle) {
            var values = [];
            for (var _i = 3; _i < arguments.length; _i++) {
                values[_i - 3] = arguments[_i];
            }
            var nodeDef = view.def.nodes[nodeIndex];
            if (checkType === 0 /* CheckAndUpdate */) {
                debugCheckAndUpdateNode(view, nodeDef, argStyle, values);
            }
            else {
                debugCheckNoChangesNode(view, nodeDef, argStyle, values);
            }
            if (nodeDef.flags & 16384 /* TypeDirective */) {
                debugSetCurrentNode(view, nextDirectiveWithBinding(view, nodeIndex));
            }
            return (nodeDef.flags & 224 /* CatPureExpression */) ?
                asPureExpressionData(view, nodeDef.nodeIndex).value :
                undefined;
        }
    }
    function debugUpdateRenderer(view, checkType) {
        if (view.state & 128 /* Destroyed */) {
            throw viewDestroyedError(DebugAction[_currentAction]);
        }
        debugSetCurrentNode(view, nextRenderNodeWithBinding(view, 0));
        return view.def.updateRenderer(debugCheckRenderNodeFn, view);
        function debugCheckRenderNodeFn(view, nodeIndex, argStyle) {
            var values = [];
            for (var _i = 3; _i < arguments.length; _i++) {
                values[_i - 3] = arguments[_i];
            }
            var nodeDef = view.def.nodes[nodeIndex];
            if (checkType === 0 /* CheckAndUpdate */) {
                debugCheckAndUpdateNode(view, nodeDef, argStyle, values);
            }
            else {
                debugCheckNoChangesNode(view, nodeDef, argStyle, values);
            }
            if (nodeDef.flags & 3 /* CatRenderNode */) {
                debugSetCurrentNode(view, nextRenderNodeWithBinding(view, nodeIndex));
            }
            return (nodeDef.flags & 224 /* CatPureExpression */) ?
                asPureExpressionData(view, nodeDef.nodeIndex).value :
                undefined;
        }
    }
    function debugCheckAndUpdateNode(view, nodeDef, argStyle, givenValues) {
        var changed = checkAndUpdateNode.apply(void 0, __spread([view, nodeDef, argStyle], givenValues));
        if (changed) {
            var values = argStyle === 1 /* Dynamic */ ? givenValues[0] : givenValues;
            if (nodeDef.flags & 16384 /* TypeDirective */) {
                var bindingValues = {};
                for (var i = 0; i < nodeDef.bindings.length; i++) {
                    var binding = nodeDef.bindings[i];
                    var value = values[i];
                    if (binding.flags & 8 /* TypeProperty */) {
                        bindingValues[normalizeDebugBindingName(binding.nonMinifiedName)] =
                            normalizeDebugBindingValue(value);
                    }
                }
                var elDef = nodeDef.parent;
                var el = asElementData(view, elDef.nodeIndex).renderElement;
                if (!elDef.element.name) {
                    // a comment.
                    view.renderer.setValue(el, "bindings=" + JSON.stringify(bindingValues, null, 2));
                }
                else {
                    // a regular element.
                    for (var attr in bindingValues) {
                        var value = bindingValues[attr];
                        if (value != null) {
                            view.renderer.setAttribute(el, attr, value);
                        }
                        else {
                            view.renderer.removeAttribute(el, attr);
                        }
                    }
                }
            }
        }
    }
    function debugCheckNoChangesNode(view, nodeDef, argStyle, values) {
        checkNoChangesNode.apply(void 0, __spread([view, nodeDef, argStyle], values));
    }
    function normalizeDebugBindingName(name) {
        // Attribute names with `$` (eg `x-y$`) are valid per spec, but unsupported by some browsers
        name = camelCaseToDashCase(name.replace(/[$@]/g, '_'));
        return "ng-reflect-" + name;
    }
    var CAMEL_CASE_REGEXP = /([A-Z])/g;
    function camelCaseToDashCase(input) {
        return input.replace(CAMEL_CASE_REGEXP, function () {
            var m = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                m[_i] = arguments[_i];
            }
            return '-' + m[1].toLowerCase();
        });
    }
    function normalizeDebugBindingValue(value) {
        try {
            // Limit the size of the value as otherwise the DOM just gets polluted.
            return value != null ? value.toString().slice(0, 30) : value;
        }
        catch (e) {
            return '[ERROR] Exception while trying to serialize the value';
        }
    }
    function nextDirectiveWithBinding(view, nodeIndex) {
        for (var i = nodeIndex; i < view.def.nodes.length; i++) {
            var nodeDef = view.def.nodes[i];
            if (nodeDef.flags & 16384 /* TypeDirective */ && nodeDef.bindings && nodeDef.bindings.length) {
                return i;
            }
        }
        return null;
    }
    function nextRenderNodeWithBinding(view, nodeIndex) {
        for (var i = nodeIndex; i < view.def.nodes.length; i++) {
            var nodeDef = view.def.nodes[i];
            if ((nodeDef.flags & 3 /* CatRenderNode */) && nodeDef.bindings && nodeDef.bindings.length) {
                return i;
            }
        }
        return null;
    }
    var DebugContext_ = /** @class */ (function () {
        function DebugContext_(view, nodeIndex) {
            this.view = view;
            this.nodeIndex = nodeIndex;
            if (nodeIndex == null) {
                this.nodeIndex = nodeIndex = 0;
            }
            this.nodeDef = view.def.nodes[nodeIndex];
            var elDef = this.nodeDef;
            var elView = view;
            while (elDef && (elDef.flags & 1 /* TypeElement */) === 0) {
                elDef = elDef.parent;
            }
            if (!elDef) {
                while (!elDef && elView) {
                    elDef = viewParentEl(elView);
                    elView = elView.parent;
                }
            }
            this.elDef = elDef;
            this.elView = elView;
        }
        Object.defineProperty(DebugContext_.prototype, "elOrCompView", {
            get: function () {
                // Has to be done lazily as we use the DebugContext also during creation of elements...
                return asElementData(this.elView, this.elDef.nodeIndex).componentView || this.view;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DebugContext_.prototype, "injector", {
            get: function () { return createInjector$1(this.elView, this.elDef); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DebugContext_.prototype, "component", {
            get: function () { return this.elOrCompView.component; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DebugContext_.prototype, "context", {
            get: function () { return this.elOrCompView.context; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DebugContext_.prototype, "providerTokens", {
            get: function () {
                var tokens = [];
                if (this.elDef) {
                    for (var i = this.elDef.nodeIndex + 1; i <= this.elDef.nodeIndex + this.elDef.childCount; i++) {
                        var childDef = this.elView.def.nodes[i];
                        if (childDef.flags & 20224 /* CatProvider */) {
                            tokens.push(childDef.provider.token);
                        }
                        i += childDef.childCount;
                    }
                }
                return tokens;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DebugContext_.prototype, "references", {
            get: function () {
                var references = {};
                if (this.elDef) {
                    collectReferences(this.elView, this.elDef, references);
                    for (var i = this.elDef.nodeIndex + 1; i <= this.elDef.nodeIndex + this.elDef.childCount; i++) {
                        var childDef = this.elView.def.nodes[i];
                        if (childDef.flags & 20224 /* CatProvider */) {
                            collectReferences(this.elView, childDef, references);
                        }
                        i += childDef.childCount;
                    }
                }
                return references;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DebugContext_.prototype, "componentRenderElement", {
            get: function () {
                var elData = findHostElement(this.elOrCompView);
                return elData ? elData.renderElement : undefined;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DebugContext_.prototype, "renderNode", {
            get: function () {
                return this.nodeDef.flags & 2 /* TypeText */ ? renderNode(this.view, this.nodeDef) :
                    renderNode(this.elView, this.elDef);
            },
            enumerable: true,
            configurable: true
        });
        DebugContext_.prototype.logError = function (console) {
            var values = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                values[_i - 1] = arguments[_i];
            }
            var logViewDef;
            var logNodeIndex;
            if (this.nodeDef.flags & 2 /* TypeText */) {
                logViewDef = this.view.def;
                logNodeIndex = this.nodeDef.nodeIndex;
            }
            else {
                logViewDef = this.elView.def;
                logNodeIndex = this.elDef.nodeIndex;
            }
            // Note: we only generate a log function for text and element nodes
            // to make the generated code as small as possible.
            var renderNodeIndex = getRenderNodeIndex(logViewDef, logNodeIndex);
            var currRenderNodeIndex = -1;
            var nodeLogger = function () {
                var _a;
                currRenderNodeIndex++;
                if (currRenderNodeIndex === renderNodeIndex) {
                    return (_a = console.error).bind.apply(_a, __spread([console], values));
                }
                else {
                    return NOOP;
                }
            };
            logViewDef.factory(nodeLogger);
            if (currRenderNodeIndex < renderNodeIndex) {
                console.error('Illegal state: the ViewDefinitionFactory did not call the logger!');
                console.error.apply(console, __spread(values));
            }
        };
        return DebugContext_;
    }());
    function getRenderNodeIndex(viewDef$$1, nodeIndex) {
        var renderNodeIndex = -1;
        for (var i = 0; i <= nodeIndex; i++) {
            var nodeDef = viewDef$$1.nodes[i];
            if (nodeDef.flags & 3 /* CatRenderNode */) {
                renderNodeIndex++;
            }
        }
        return renderNodeIndex;
    }
    function findHostElement(view) {
        while (view && !isComponentView(view)) {
            view = view.parent;
        }
        if (view.parent) {
            return asElementData(view.parent, viewParentEl(view).nodeIndex);
        }
        return null;
    }
    function collectReferences(view, nodeDef, references) {
        for (var refName in nodeDef.references) {
            references[refName] = getQueryValue(view, nodeDef, nodeDef.references[refName]);
        }
    }
    function callWithDebugContext(action, fn, self, args) {
        var oldAction = _currentAction;
        var oldView = _currentView;
        var oldNodeIndex = _currentNodeIndex;
        try {
            _currentAction = action;
            var result = fn.apply(self, args);
            _currentView = oldView;
            _currentNodeIndex = oldNodeIndex;
            _currentAction = oldAction;
            return result;
        }
        catch (e) {
            if (isViewDebugError(e) || !_currentView) {
                throw e;
            }
            throw viewWrappedDebugError(e, getCurrentDebugContext());
        }
    }
    function getCurrentDebugContext() {
        return _currentView ? new DebugContext_(_currentView, _currentNodeIndex) : null;
    }
    var DebugRendererFactory2 = /** @class */ (function () {
        function DebugRendererFactory2(delegate) {
            this.delegate = delegate;
        }
        DebugRendererFactory2.prototype.createRenderer = function (element, renderData) {
            return new DebugRenderer2(this.delegate.createRenderer(element, renderData));
        };
        DebugRendererFactory2.prototype.begin = function () {
            if (this.delegate.begin) {
                this.delegate.begin();
            }
        };
        DebugRendererFactory2.prototype.end = function () {
            if (this.delegate.end) {
                this.delegate.end();
            }
        };
        DebugRendererFactory2.prototype.whenRenderingDone = function () {
            if (this.delegate.whenRenderingDone) {
                return this.delegate.whenRenderingDone();
            }
            return Promise.resolve(null);
        };
        return DebugRendererFactory2;
    }());
    var DebugRenderer2 = /** @class */ (function () {
        function DebugRenderer2(delegate) {
            this.delegate = delegate;
            /**
             * Factory function used to create a `DebugContext` when a node is created.
             *
             * The `DebugContext` allows to retrieve information about the nodes that are useful in tests.
             *
             * The factory is configurable so that the `DebugRenderer2` could instantiate either a View Engine
             * or a Render context.
             */
            this.debugContextFactory = getCurrentDebugContext;
            this.data = this.delegate.data;
        }
        DebugRenderer2.prototype.createDebugContext = function (nativeElement) { return this.debugContextFactory(nativeElement); };
        DebugRenderer2.prototype.destroyNode = function (node) {
            removeDebugNodeFromIndex(getDebugNode(node));
            if (this.delegate.destroyNode) {
                this.delegate.destroyNode(node);
            }
        };
        DebugRenderer2.prototype.destroy = function () { this.delegate.destroy(); };
        DebugRenderer2.prototype.createElement = function (name, namespace) {
            var el = this.delegate.createElement(name, namespace);
            var debugCtx = this.createDebugContext(el);
            if (debugCtx) {
                var debugEl = new DebugElement(el, null, debugCtx);
                debugEl.name = name;
                indexDebugNode(debugEl);
            }
            return el;
        };
        DebugRenderer2.prototype.createComment = function (value) {
            var comment = this.delegate.createComment(value);
            var debugCtx = this.createDebugContext(comment);
            if (debugCtx) {
                indexDebugNode(new DebugNode(comment, null, debugCtx));
            }
            return comment;
        };
        DebugRenderer2.prototype.createText = function (value) {
            var text = this.delegate.createText(value);
            var debugCtx = this.createDebugContext(text);
            if (debugCtx) {
                indexDebugNode(new DebugNode(text, null, debugCtx));
            }
            return text;
        };
        DebugRenderer2.prototype.appendChild = function (parent, newChild) {
            var debugEl = getDebugNode(parent);
            var debugChildEl = getDebugNode(newChild);
            if (debugEl && debugChildEl && debugEl instanceof DebugElement) {
                debugEl.addChild(debugChildEl);
            }
            this.delegate.appendChild(parent, newChild);
        };
        DebugRenderer2.prototype.insertBefore = function (parent, newChild, refChild) {
            var debugEl = getDebugNode(parent);
            var debugChildEl = getDebugNode(newChild);
            var debugRefEl = getDebugNode(refChild);
            if (debugEl && debugChildEl && debugEl instanceof DebugElement) {
                debugEl.insertBefore(debugRefEl, debugChildEl);
            }
            this.delegate.insertBefore(parent, newChild, refChild);
        };
        DebugRenderer2.prototype.removeChild = function (parent, oldChild) {
            var debugEl = getDebugNode(parent);
            var debugChildEl = getDebugNode(oldChild);
            if (debugEl && debugChildEl && debugEl instanceof DebugElement) {
                debugEl.removeChild(debugChildEl);
            }
            this.delegate.removeChild(parent, oldChild);
        };
        DebugRenderer2.prototype.selectRootElement = function (selectorOrNode, preserveContent) {
            var el = this.delegate.selectRootElement(selectorOrNode, preserveContent);
            var debugCtx = getCurrentDebugContext() || (ivyEnabled$1 ? this.createDebugContext(el) : null);
            if (debugCtx) {
                indexDebugNode(new DebugElement(el, null, debugCtx));
            }
            return el;
        };
        DebugRenderer2.prototype.setAttribute = function (el, name, value, namespace) {
            var debugEl = getDebugNode(el);
            if (debugEl && debugEl instanceof DebugElement) {
                var fullName = namespace ? namespace + ':' + name : name;
                debugEl.attributes[fullName] = value;
            }
            this.delegate.setAttribute(el, name, value, namespace);
        };
        DebugRenderer2.prototype.removeAttribute = function (el, name, namespace) {
            var debugEl = getDebugNode(el);
            if (debugEl && debugEl instanceof DebugElement) {
                var fullName = namespace ? namespace + ':' + name : name;
                debugEl.attributes[fullName] = null;
            }
            this.delegate.removeAttribute(el, name, namespace);
        };
        DebugRenderer2.prototype.addClass = function (el, name) {
            var debugEl = getDebugNode(el);
            if (debugEl && debugEl instanceof DebugElement) {
                debugEl.classes[name] = true;
            }
            this.delegate.addClass(el, name);
        };
        DebugRenderer2.prototype.removeClass = function (el, name) {
            var debugEl = getDebugNode(el);
            if (debugEl && debugEl instanceof DebugElement) {
                debugEl.classes[name] = false;
            }
            this.delegate.removeClass(el, name);
        };
        DebugRenderer2.prototype.setStyle = function (el, style, value, flags) {
            var debugEl = getDebugNode(el);
            if (debugEl && debugEl instanceof DebugElement) {
                debugEl.styles[style] = value;
            }
            this.delegate.setStyle(el, style, value, flags);
        };
        DebugRenderer2.prototype.removeStyle = function (el, style, flags) {
            var debugEl = getDebugNode(el);
            if (debugEl && debugEl instanceof DebugElement) {
                debugEl.styles[style] = null;
            }
            this.delegate.removeStyle(el, style, flags);
        };
        DebugRenderer2.prototype.setProperty = function (el, name, value) {
            var debugEl = getDebugNode(el);
            if (debugEl && debugEl instanceof DebugElement) {
                debugEl.properties[name] = value;
            }
            this.delegate.setProperty(el, name, value);
        };
        DebugRenderer2.prototype.listen = function (target, eventName, callback) {
            if (typeof target !== 'string') {
                var debugEl = getDebugNode(target);
                if (debugEl) {
                    debugEl.listeners.push(new EventListener(eventName, callback));
                }
            }
            return this.delegate.listen(target, eventName, callback);
        };
        DebugRenderer2.prototype.parentNode = function (node) { return this.delegate.parentNode(node); };
        DebugRenderer2.prototype.nextSibling = function (node) { return this.delegate.nextSibling(node); };
        DebugRenderer2.prototype.setValue = function (node, value) { return this.delegate.setValue(node, value); };
        return DebugRenderer2;
    }());

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    function overrideProvider(override) {
        initServicesIfNeeded();
        return Services.overrideProvider(override);
    }
    function overrideComponentView(comp, componentFactory) {
        initServicesIfNeeded();
        return Services.overrideComponentView(comp, componentFactory);
    }
    function clearOverrides() {
        initServicesIfNeeded();
        return Services.clearOverrides();
    }
    // Attention: this function is called as top level function.
    // Putting any logic in here will destroy closure tree shaking!
    function createNgModuleFactory(ngModuleType, bootstrapComponents, defFactory) {
        return new NgModuleFactory_(ngModuleType, bootstrapComponents, defFactory);
    }
    function cloneNgModuleDefinition(def) {
        var providers = Array.from(def.providers);
        var modules = Array.from(def.modules);
        var providersByKey = {};
        for (var key in def.providersByKey) {
            providersByKey[key] = def.providersByKey[key];
        }
        return {
            factory: def.factory,
            isRoot: def.isRoot, providers: providers, modules: modules, providersByKey: providersByKey,
        };
    }
    var NgModuleFactory_ = /** @class */ (function (_super) {
        __extends(NgModuleFactory_, _super);
        function NgModuleFactory_(moduleType, _bootstrapComponents, _ngModuleDefFactory) {
            var _this = 
            // Attention: this ctor is called as top level function.
            // Putting any logic in here will destroy closure tree shaking!
            _super.call(this) || this;
            _this.moduleType = moduleType;
            _this._bootstrapComponents = _bootstrapComponents;
            _this._ngModuleDefFactory = _ngModuleDefFactory;
            return _this;
        }
        NgModuleFactory_.prototype.create = function (parentInjector) {
            initServicesIfNeeded();
            // Clone the NgModuleDefinition so that any tree shakeable provider definition
            // added to this instance of the NgModuleRef doesn't affect the cached copy.
            // See https://github.com/angular/angular/issues/25018.
            var def = cloneNgModuleDefinition(resolveDefinition(this._ngModuleDefFactory));
            return Services.createNgModuleRef(this.moduleType, parentInjector || Injector.NULL, this._bootstrapComponents, def);
        };
        return NgModuleFactory_;
    }(NgModuleFactory));

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
     * Returns the host component instance associated with the target.
     *
     * This will only return a component instance of the DOM node
     * contains an instance of a component on it.
     */
    function getHostComponent(target) {
        var context = loadContext(target);
        var tNode = context.lViewData[TVIEW].data[context.nodeIndex];
        if (tNode.flags & 4096 /* isComponent */) {
            var componentView = getComponentViewByIndex(context.nodeIndex, context.lViewData);
            return componentView[CONTEXT];
        }
        return null;
    }
    /**
     * Returns the `RootContext` instance that is associated with
     * the application where the target is situated.
     */
    function getRootContext$2(target) {
        var lViewData = Array.isArray(target) ? target : loadContext(target).lViewData;
        var rootLViewData = getRootView$1(lViewData);
        return rootLViewData[CONTEXT];
    }
    /**
     * Returns the injector instance that is associated with
     * the element, component or directive.
     */
    function getInjector(target) {
        var context = loadContext(target);
        var tNode = context.lViewData[TVIEW].data[context.nodeIndex];
        return new NodeInjector(tNode, context.lViewData);
    }
    /**
     * Returns LContext associated with a target passed as an argument.
     * Throws if a given target doesn't have associated LContext.
     */
    function loadContext(target) {
        var context = getContext(target);
        if (!context) {
            throw new Error(ngDevMode ? 'Unable to find the given context data for the given target' :
                'Invalid ng target');
        }
        return context;
    }
    /**
     * Retrieve the root view from any component by walking the parent `LViewData` until
     * reaching the root `LViewData`.
     *
     * @param componentOrView any component or view
     */
    function getRootView$1(componentOrView) {
        var lViewData;
        if (Array.isArray(componentOrView)) {
            ngDevMode && assertDefined(componentOrView, 'lViewData');
            lViewData = componentOrView;
        }
        else {
            ngDevMode && assertDefined(componentOrView, 'component');
            lViewData = readPatchedLViewData(componentOrView);
        }
        while (lViewData && !(lViewData[FLAGS] & 64 /* IsRoot */)) {
            lViewData = lViewData[PARENT];
        }
        return lViewData;
    }
    /**
     *  Retrieve map of local references (local reference name => element or directive instance).
     */
    function getLocalRefs(target) {
        var context = loadContext(target);
        if (context.localRefs === undefined) {
            context.localRefs = discoverLocalRefs(context.lViewData, context.nodeIndex);
        }
        return context.localRefs || {};
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Adapts the DebugRendererFactory2 to create a DebugRenderer2 specific for IVY.
     *
     * The created DebugRenderer know how to create a Debug Context specific to IVY.
     */
    var Render3DebugRendererFactory2 = /** @class */ (function (_super) {
        __extends(Render3DebugRendererFactory2, _super);
        function Render3DebugRendererFactory2() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Render3DebugRendererFactory2.prototype.createRenderer = function (element, renderData) {
            var renderer = _super.prototype.createRenderer.call(this, element, renderData);
            renderer.debugContextFactory = function (nativeElement) { return new Render3DebugContext(nativeElement); };
            return renderer;
        };
        return Render3DebugRendererFactory2;
    }(DebugRendererFactory2));
    /**
     * Stores context information about view nodes.
     *
     * Used in tests to retrieve information those nodes.
     */
    var Render3DebugContext = /** @class */ (function () {
        function Render3DebugContext(_nativeNode) {
            this._nativeNode = _nativeNode;
        }
        Object.defineProperty(Render3DebugContext.prototype, "nodeIndex", {
            get: function () { return loadContext(this._nativeNode).nodeIndex; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Render3DebugContext.prototype, "view", {
            get: function () { return loadContext(this._nativeNode).lViewData; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Render3DebugContext.prototype, "injector", {
            get: function () { return getInjector(this._nativeNode); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Render3DebugContext.prototype, "component", {
            get: function () { return getHostComponent(this._nativeNode); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Render3DebugContext.prototype, "providerTokens", {
            get: function () {
                var lDebugCtx = loadContext(this._nativeNode);
                var lViewData = lDebugCtx.lViewData;
                var tNode = lViewData[TVIEW].data[lDebugCtx.nodeIndex];
                var directivesCount = tNode.flags & 4095 /* DirectiveCountMask */;
                if (directivesCount > 0) {
                    var directiveIdxStart = tNode.flags >> 15 /* DirectiveStartingIndexShift */;
                    var directiveIdxEnd = directiveIdxStart + directivesCount;
                    var viewDirectiveDefs = this.view[TVIEW].data;
                    var directiveDefs = viewDirectiveDefs.slice(directiveIdxStart, directiveIdxEnd);
                    return directiveDefs.map(function (directiveDef) { return directiveDef.type; });
                }
                return [];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Render3DebugContext.prototype, "references", {
            get: function () { return getLocalRefs(this._nativeNode); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Render3DebugContext.prototype, "context", {
            // TODO(pk): check previous implementation and re-implement
            get: function () { throw new Error('Not implemented in ivy'); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Render3DebugContext.prototype, "componentRenderElement", {
            // TODO(pk): check previous implementation and re-implement
            get: function () { throw new Error('Not implemented in ivy'); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Render3DebugContext.prototype, "renderNode", {
            // TODO(pk): check previous implementation and re-implement
            get: function () { throw new Error('Not implemented in ivy'); },
            enumerable: true,
            configurable: true
        });
        // TODO(pk): check previous implementation and re-implement
        Render3DebugContext.prototype.logError = function (console) {
            var values = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                values[_i - 1] = arguments[_i];
            }
            console.error.apply(console, __spread(values));
        };
        return Render3DebugContext;
    }());

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Adds a player to an element, directive or component instance that will later be
     * animated once change detection has passed.
     *
     * When a player is added to a reference it will stay active until `player.destroy()`
     * is called. Once called then the player will be removed from the active players
     * present on the associated ref instance.
     *
     * To get a list of all the active players on an element see [getPlayers].
     *
     * @param ref The element, directive or component that the player will be placed on.
     * @param player The player that will be triggered to play once change detection has run.
     */
    function addPlayer(ref, player) {
        var context = getContext(ref);
        if (!context) {
            ngDevMode && throwInvalidRefError();
            return;
        }
        var element$$1 = context.native;
        var lViewData = context.lViewData;
        var playerContext = getOrCreatePlayerContext(element$$1, context);
        var rootContext = getRootContext$2(lViewData);
        addPlayerInternal(playerContext, rootContext, element$$1, player, 0, ref);
        scheduleTick(rootContext, 2 /* FlushPlayers */);
    }
    /**
     * Returns a list of all the active players present on the provided ref instance (which can
     * be an instance of a directive, component or element).
     *
     * This function will only return players that have been added to the ref instance using
     * `addPlayer` or any players that are active through any template styling bindings
     * (`[style]`, `[style.prop]`, `[class]` and `[class.name]`).
     */
    function getPlayers(ref) {
        var context = getContext(ref);
        if (!context) {
            ngDevMode && throwInvalidRefError();
            return [];
        }
        var stylingContext = getStylingContext(context.nodeIndex - HEADER_OFFSET, context.lViewData);
        var playerContext = stylingContext ? getPlayerContext(stylingContext) : null;
        return playerContext ? getPlayersInternal(playerContext) : [];
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    // clang-format on

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

    exports.ɵangular_packages_core_core_l = APPLICATION_MODULE_PROVIDERS;
    exports.ɵangular_packages_core_core_i = _iterableDiffersFactory;
    exports.ɵangular_packages_core_core_j = _keyValueDiffersFactory;
    exports.ɵangular_packages_core_core_k = _localeFactory;
    exports.ɵangular_packages_core_core_f = _appIdRandomProviderFactory;
    exports.ɵangular_packages_core_core_g = DefaultIterableDifferFactory;
    exports.ɵangular_packages_core_core_h = DefaultKeyValueDifferFactory;
    exports.ɵangular_packages_core_core_c = ReflectiveInjector_;
    exports.ɵangular_packages_core_core_d = ReflectiveDependency;
    exports.ɵangular_packages_core_core_e = resolveReflectiveProviders;
    exports.ɵangular_packages_core_core_m = wtfEnabled;
    exports.ɵangular_packages_core_core_o = createScope;
    exports.ɵangular_packages_core_core_n = detectWTF;
    exports.ɵangular_packages_core_core_r = endTimeRange;
    exports.ɵangular_packages_core_core_p = leave;
    exports.ɵangular_packages_core_core_q = startTimeRange;
    exports.ɵangular_packages_core_core_bd = NG_INJECTABLE_DEF;
    exports.ɵangular_packages_core_core_w = _getViewData;
    exports.ɵangular_packages_core_core_x = bindingUpdated;
    exports.ɵangular_packages_core_core_v = getPreviousOrParentTNode;
    exports.ɵangular_packages_core_core_z = BoundPlayerFactory;
    exports.ɵangular_packages_core_core_bg = loadInternal;
    exports.ɵangular_packages_core_core_ba = createElementRef;
    exports.ɵangular_packages_core_core_bb = createTemplateRef;
    exports.ɵangular_packages_core_core_bc = createViewRef;
    exports.ɵangular_packages_core_core_a = makeParamDecorator;
    exports.ɵangular_packages_core_core_b = makePropDecorator;
    exports.ɵangular_packages_core_core_be = getClosureSafeProperty;
    exports.ɵangular_packages_core_core_s = _def;
    exports.ɵangular_packages_core_core_t = DebugRendererFactory2;
    exports.ɵangular_packages_core_core_u = DebugContext;
    exports.createPlatform = createPlatform;
    exports.assertPlatform = assertPlatform;
    exports.destroyPlatform = destroyPlatform;
    exports.getPlatform = getPlatform;
    exports.PlatformRef = PlatformRef;
    exports.ApplicationRef = ApplicationRef;
    exports.createPlatformFactory = createPlatformFactory;
    exports.NgProbeToken = NgProbeToken;
    exports.enableProdMode = enableProdMode;
    exports.isDevMode = isDevMode;
    exports.APP_ID = APP_ID;
    exports.PACKAGE_ROOT_URL = PACKAGE_ROOT_URL;
    exports.PLATFORM_INITIALIZER = PLATFORM_INITIALIZER;
    exports.PLATFORM_ID = PLATFORM_ID;
    exports.APP_BOOTSTRAP_LISTENER = APP_BOOTSTRAP_LISTENER;
    exports.APP_INITIALIZER = APP_INITIALIZER;
    exports.ApplicationInitStatus = ApplicationInitStatus;
    exports.DebugElement = DebugElement;
    exports.DebugNode = DebugNode;
    exports.asNativeElements = asNativeElements;
    exports.getDebugNode = getDebugNode;
    exports.Testability = Testability;
    exports.TestabilityRegistry = TestabilityRegistry;
    exports.setTestabilityGetter = setTestabilityGetter;
    exports.TRANSLATIONS = TRANSLATIONS;
    exports.TRANSLATIONS_FORMAT = TRANSLATIONS_FORMAT;
    exports.LOCALE_ID = LOCALE_ID;
    exports.ApplicationModule = ApplicationModule;
    exports.wtfCreateScope = wtfCreateScope;
    exports.wtfLeave = wtfLeave;
    exports.wtfStartTimeRange = wtfStartTimeRange;
    exports.wtfEndTimeRange = wtfEndTimeRange;
    exports.Type = Type;
    exports.EventEmitter = EventEmitter;
    exports.ErrorHandler = ErrorHandler;
    exports.Sanitizer = Sanitizer;
    exports.ANALYZE_FOR_ENTRY_COMPONENTS = ANALYZE_FOR_ENTRY_COMPONENTS;
    exports.Attribute = Attribute;
    exports.ContentChild = ContentChild;
    exports.ContentChildren = ContentChildren;
    exports.Query = Query;
    exports.ViewChild = ViewChild;
    exports.ViewChildren = ViewChildren;
    exports.Component = Component;
    exports.Directive = Directive;
    exports.HostBinding = HostBinding;
    exports.HostListener = HostListener;
    exports.Input = Input;
    exports.Output = Output;
    exports.Pipe = Pipe;
    exports.CUSTOM_ELEMENTS_SCHEMA = CUSTOM_ELEMENTS_SCHEMA;
    exports.NO_ERRORS_SCHEMA = NO_ERRORS_SCHEMA;
    exports.NgModule = NgModule;
    exports.Version = Version;
    exports.VERSION = VERSION;
    exports.defineInjectable = defineInjectable;
    exports.defineInjector = defineInjector;
    exports.forwardRef = forwardRef;
    exports.resolveForwardRef = resolveForwardRef;
    exports.Injectable = Injectable;
    exports.inject = inject;
    exports.INJECTOR = INJECTOR;
    exports.Injector = Injector;
    exports.ReflectiveInjector = ReflectiveInjector;
    exports.createInjector = createInjector;
    exports.ResolvedReflectiveFactory = ResolvedReflectiveFactory;
    exports.ReflectiveKey = ReflectiveKey;
    exports.InjectionToken = InjectionToken;
    exports.Inject = Inject;
    exports.Optional = Optional;
    exports.Self = Self;
    exports.SkipSelf = SkipSelf;
    exports.Host = Host;
    exports.NgZone = NgZone;
    exports.ɵNoopNgZone = NoopNgZone;
    exports.RenderComponentType = RenderComponentType;
    exports.Renderer = Renderer;
    exports.Renderer2 = Renderer2;
    exports.RendererFactory2 = RendererFactory2;
    exports.RootRenderer = RootRenderer;
    exports.COMPILER_OPTIONS = COMPILER_OPTIONS;
    exports.Compiler = Compiler;
    exports.CompilerFactory = CompilerFactory;
    exports.ModuleWithComponentFactories = ModuleWithComponentFactories;
    exports.ComponentFactory = ComponentFactory;
    exports.ComponentRef = ComponentRef;
    exports.ComponentFactoryResolver = ComponentFactoryResolver;
    exports.ElementRef = ElementRef;
    exports.NgModuleFactory = NgModuleFactory;
    exports.NgModuleRef = NgModuleRef;
    exports.NgModuleFactoryLoader = NgModuleFactoryLoader;
    exports.getModuleFactory = getModuleFactory;
    exports.QueryList = QueryList$1;
    exports.SystemJsNgModuleLoader = SystemJsNgModuleLoader;
    exports.SystemJsNgModuleLoaderConfig = SystemJsNgModuleLoaderConfig;
    exports.TemplateRef = TemplateRef;
    exports.ViewContainerRef = ViewContainerRef;
    exports.EmbeddedViewRef = EmbeddedViewRef;
    exports.ViewRef = ViewRef$1;
    exports.ChangeDetectorRef = ChangeDetectorRef;
    exports.DefaultIterableDiffer = DefaultIterableDiffer;
    exports.IterableDiffers = IterableDiffers;
    exports.KeyValueDiffers = KeyValueDiffers;
    exports.SimpleChange = SimpleChange;
    exports.WrappedValue = WrappedValue;
    exports.platformCore = platformCore;
    exports.ɵALLOW_MULTIPLE_PLATFORMS = ALLOW_MULTIPLE_PLATFORMS;
    exports.ɵAPP_ID_RANDOM_PROVIDER = APP_ID_RANDOM_PROVIDER;
    exports.ɵdefaultIterableDiffers = defaultIterableDiffers;
    exports.ɵdefaultKeyValueDiffers = defaultKeyValueDiffers;
    exports.ɵdevModeEqual = devModeEqual;
    exports.ɵisListLikeIterable = isListLikeIterable;
    exports.ɵisDefaultChangeDetectionStrategy = isDefaultChangeDetectionStrategy;
    exports.ɵConsole = Console;
    exports.ɵgetInjectableDef = getInjectableDef;
    exports.ɵinject = inject;
    exports.ɵsetCurrentInjector = setCurrentInjector;
    exports.ɵAPP_ROOT = APP_ROOT;
    exports.ɵivyEnabled = ivyEnabled$1;
    exports.ɵComponentFactory = ComponentFactory;
    exports.ɵCodegenComponentFactoryResolver = CodegenComponentFactoryResolver;
    exports.ɵresolveComponentResources = resolveComponentResources;
    exports.ɵReflectionCapabilities = ReflectionCapabilities;
    exports.ɵRenderDebugInfo = RenderDebugInfo;
    exports.ɵ_sanitizeHtml = _sanitizeHtml;
    exports.ɵ_sanitizeStyle = _sanitizeStyle;
    exports.ɵ_sanitizeUrl = _sanitizeUrl;
    exports.ɵglobal = _global;
    exports.ɵlooseIdentical = looseIdentical;
    exports.ɵstringify = stringify;
    exports.ɵmakeDecorator = makeDecorator;
    exports.ɵisObservable = isObservable;
    exports.ɵisPromise = isPromise;
    exports.ɵclearOverrides = clearOverrides;
    exports.ɵinitServicesIfNeeded = initServicesIfNeeded;
    exports.ɵoverrideComponentView = overrideComponentView;
    exports.ɵoverrideProvider = overrideProvider;
    exports.ɵNOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR = NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR;
    exports.ɵdefineBase = defineBase;
    exports.ɵdefineComponent = defineComponent;
    exports.ɵdefineDirective = defineDirective;
    exports.ɵdefinePipe = definePipe;
    exports.ɵdefineNgModule = defineNgModule;
    exports.ɵdetectChanges = detectChanges;
    exports.ɵrenderComponent = renderComponent;
    exports.ɵRender3ComponentFactory = ComponentFactory$1;
    exports.ɵRender3ComponentRef = ComponentRef$1;
    exports.ɵdirectiveInject = directiveInject;
    exports.ɵinjectAttribute = injectAttribute;
    exports.ɵgetFactoryOf = getFactoryOf;
    exports.ɵgetInheritedFactory = getInheritedFactory;
    exports.ɵtemplateRefExtractor = templateRefExtractor;
    exports.ɵPublicFeature = PublicFeature;
    exports.ɵInheritDefinitionFeature = InheritDefinitionFeature;
    exports.ɵNgOnChangesFeature = NgOnChangesFeature;
    exports.ɵRender3NgModuleRef = NgModuleRef$1;
    exports.ɵmarkDirty = markDirty;
    exports.ɵNgModuleFactory = NgModuleFactory$1;
    exports.ɵNO_CHANGE = NO_CHANGE;
    exports.ɵcontainer = container;
    exports.ɵnextContext = nextContext;
    exports.ɵelementStart = elementStart;
    exports.ɵnamespaceHTML = namespaceHTML;
    exports.ɵnamespaceMathML = namespaceMathML;
    exports.ɵnamespaceSVG = namespaceSVG;
    exports.ɵelement = element;
    exports.ɵlistener = listener;
    exports.ɵtext = text;
    exports.ɵembeddedViewStart = embeddedViewStart;
    exports.ɵquery = query;
    exports.ɵregisterContentQuery = registerContentQuery;
    exports.ɵprojection = projection;
    exports.ɵbind = bind;
    exports.ɵinterpolation1 = interpolation1;
    exports.ɵinterpolation2 = interpolation2;
    exports.ɵinterpolation3 = interpolation3;
    exports.ɵinterpolation4 = interpolation4;
    exports.ɵinterpolation5 = interpolation5;
    exports.ɵinterpolation6 = interpolation6;
    exports.ɵinterpolation7 = interpolation7;
    exports.ɵinterpolation8 = interpolation8;
    exports.ɵinterpolationV = interpolationV;
    exports.ɵpipeBind1 = pipeBind1;
    exports.ɵpipeBind2 = pipeBind2;
    exports.ɵpipeBind3 = pipeBind3;
    exports.ɵpipeBind4 = pipeBind4;
    exports.ɵpipeBindV = pipeBindV;
    exports.ɵpureFunction0 = pureFunction0;
    exports.ɵpureFunction1 = pureFunction1;
    exports.ɵpureFunction2 = pureFunction2;
    exports.ɵpureFunction3 = pureFunction3;
    exports.ɵpureFunction4 = pureFunction4;
    exports.ɵpureFunction5 = pureFunction5;
    exports.ɵpureFunction6 = pureFunction6;
    exports.ɵpureFunction7 = pureFunction7;
    exports.ɵpureFunction8 = pureFunction8;
    exports.ɵpureFunctionV = pureFunctionV;
    exports.ɵgetCurrentView = getCurrentView;
    exports.ɵrestoreView = restoreView;
    exports.ɵcontainerRefreshStart = containerRefreshStart;
    exports.ɵcontainerRefreshEnd = containerRefreshEnd;
    exports.ɵqueryRefresh = queryRefresh;
    exports.ɵloadQueryList = loadQueryList;
    exports.ɵelementEnd = elementEnd;
    exports.ɵelementProperty = elementProperty;
    exports.ɵprojectionDef = projectionDef;
    exports.ɵreference = reference;
    exports.ɵenableBindings = enableBindings;
    exports.ɵdisableBindings = disableBindings;
    exports.ɵelementAttribute = elementAttribute;
    exports.ɵelementStyling = elementStyling;
    exports.ɵelementStylingMap = elementStylingMap;
    exports.ɵelementStyleProp = elementStyleProp;
    exports.ɵelementStylingApply = elementStylingApply;
    exports.ɵelementClassProp = elementClassProp;
    exports.ɵtextBinding = textBinding;
    exports.ɵtemplate = template;
    exports.ɵembeddedViewEnd = embeddedViewEnd;
    exports.ɵstore = store;
    exports.ɵload = load;
    exports.ɵpipe = pipe;
    exports.ɵwhenRendered = whenRendered;
    exports.ɵi18nAttribute = i18nAttribute;
    exports.ɵi18nExp = i18nExp;
    exports.ɵi18nStart = i18nStart;
    exports.ɵi18nEnd = i18nEnd;
    exports.ɵi18nApply = i18nApply;
    exports.ɵi18nExpMapping = i18nExpMapping;
    exports.ɵi18nInterpolation1 = i18nInterpolation1;
    exports.ɵi18nInterpolation2 = i18nInterpolation2;
    exports.ɵi18nInterpolation3 = i18nInterpolation3;
    exports.ɵi18nInterpolation4 = i18nInterpolation4;
    exports.ɵi18nInterpolation5 = i18nInterpolation5;
    exports.ɵi18nInterpolation6 = i18nInterpolation6;
    exports.ɵi18nInterpolation7 = i18nInterpolation7;
    exports.ɵi18nInterpolation8 = i18nInterpolation8;
    exports.ɵi18nInterpolationV = i18nInterpolationV;
    exports.ɵi18nMapping = i18nMapping;
    exports.ɵWRAP_RENDERER_FACTORY2 = WRAP_RENDERER_FACTORY2;
    exports.ɵRender3DebugRendererFactory2 = Render3DebugRendererFactory2;
    exports.ɵcompileNgModuleDefs = R3_COMPILE_NGMODULE_DEFS;
    exports.ɵpatchComponentDefWithScope = R3_PATCH_COMPONENT_DEF_WTIH_SCOPE;
    exports.ɵcompileComponent = R3_COMPILE_COMPONENT;
    exports.ɵcompileDirective = R3_COMPILE_DIRECTIVE;
    exports.ɵcompilePipe = R3_COMPILE_PIPE;
    exports.ɵsanitizeHtml = sanitizeHtml;
    exports.ɵsanitizeStyle = sanitizeStyle;
    exports.ɵsanitizeUrl = sanitizeUrl;
    exports.ɵsanitizeResourceUrl = sanitizeResourceUrl;
    exports.ɵbypassSanitizationTrustHtml = bypassSanitizationTrustHtml;
    exports.ɵbypassSanitizationTrustStyle = bypassSanitizationTrustStyle;
    exports.ɵbypassSanitizationTrustScript = bypassSanitizationTrustScript;
    exports.ɵbypassSanitizationTrustUrl = bypassSanitizationTrustUrl;
    exports.ɵbypassSanitizationTrustResourceUrl = bypassSanitizationTrustResourceUrl;
    exports.ɵgetContext = getContext;
    exports.ɵbindPlayerFactory = bindPlayerFactory;
    exports.ɵaddPlayer = addPlayer;
    exports.ɵgetPlayers = getPlayers;
    exports.ɵcompileNgModuleFactory__POST_NGCC__ = compileNgModuleFactory__POST_NGCC__;
    exports.ɵR3_COMPILE_COMPONENT__POST_NGCC__ = R3_COMPILE_COMPONENT__POST_NGCC__;
    exports.ɵR3_COMPILE_DIRECTIVE__POST_NGCC__ = R3_COMPILE_DIRECTIVE__POST_NGCC__;
    exports.ɵR3_COMPILE_INJECTABLE__POST_NGCC__ = R3_COMPILE_INJECTABLE__POST_NGCC__;
    exports.ɵR3_COMPILE_NGMODULE__POST_NGCC__ = R3_COMPILE_NGMODULE__POST_NGCC__;
    exports.ɵR3_COMPILE_PIPE__POST_NGCC__ = R3_COMPILE_PIPE__POST_NGCC__;
    exports.ɵivyEnable__POST_NGCC__ = ivyEnable__POST_NGCC__;
    exports.ɵR3_ELEMENT_REF_FACTORY__POST_NGCC__ = R3_ELEMENT_REF_FACTORY__POST_NGCC__;
    exports.ɵR3_TEMPLATE_REF_FACTORY__POST_NGCC__ = R3_TEMPLATE_REF_FACTORY__POST_NGCC__;
    exports.ɵR3_CHANGE_DETECTOR_REF_FACTORY__POST_NGCC__ = R3_CHANGE_DETECTOR_REF_FACTORY__POST_NGCC__;
    exports.ɵR3_VIEW_CONTAINER_REF_FACTORY__POST_NGCC__ = R3_VIEW_CONTAINER_REF_FACTORY__POST_NGCC__;
    exports.ɵR3_RENDERER2_FACTORY__POST_NGCC__ = R3_RENDERER2_FACTORY__POST_NGCC__;
    exports.ɵregisterModuleFactory = registerModuleFactory;
    exports.ɵEMPTY_ARRAY = EMPTY_ARRAY$4;
    exports.ɵEMPTY_MAP = EMPTY_MAP;
    exports.ɵand = anchorDef;
    exports.ɵccf = createComponentFactory;
    exports.ɵcmf = createNgModuleFactory;
    exports.ɵcrt = createRendererType2;
    exports.ɵdid = directiveDef;
    exports.ɵeld = elementDef;
    exports.ɵelementEventFullName = elementEventFullName;
    exports.ɵgetComponentViewDefinitionFactory = getComponentViewDefinitionFactory;
    exports.ɵinlineInterpolate = inlineInterpolate;
    exports.ɵinterpolate = interpolate;
    exports.ɵmod = moduleDef;
    exports.ɵmpd = moduleProvideDef;
    exports.ɵncd = ngContentDef;
    exports.ɵnov = nodeValue;
    exports.ɵpid = pipeDef;
    exports.ɵprd = providerDef;
    exports.ɵpad = pureArrayDef;
    exports.ɵpod = pureObjectDef;
    exports.ɵppd = purePipeDef;
    exports.ɵqud = queryDef;
    exports.ɵted = textDef;
    exports.ɵunv = unwrapValue;
    exports.ɵvid = viewDef;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=core.umd.js.map

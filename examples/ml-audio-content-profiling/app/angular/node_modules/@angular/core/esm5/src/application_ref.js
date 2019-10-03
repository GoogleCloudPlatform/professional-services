/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { Observable, merge } from 'rxjs';
import { share } from 'rxjs/operators';
import { ApplicationInitStatus } from './application_init';
import { APP_BOOTSTRAP_LISTENER, PLATFORM_INITIALIZER } from './application_tokens';
import { Console } from './console';
import { Injectable, InjectionToken, Injector } from './di';
import { ErrorHandler } from './error_handler';
import { isDevMode } from './is_dev_mode';
import { CompilerFactory } from './linker/compiler';
import { ComponentFactory } from './linker/component_factory';
import { ComponentFactoryBoundToModule, ComponentFactoryResolver } from './linker/component_factory_resolver';
import { NgModuleRef } from './linker/ng_module_factory';
import { wtfCreateScope, wtfLeave } from './profile/profile';
import { assertNgModuleType } from './render3/assert';
import { NgModuleFactory as R3NgModuleFactory } from './render3/ng_module_ref';
import { Testability, TestabilityRegistry } from './testability/testability';
import { scheduleMicroTask, stringify } from './util';
import { isPromise } from './util/lang';
import { NgZone, NoopNgZone } from './zone/ng_zone';
var _platform;
var compileNgModuleFactory = compileNgModuleFactory__PRE_NGCC__;
function compileNgModuleFactory__PRE_NGCC__(injector, options, moduleType) {
    var compilerFactory = injector.get(CompilerFactory);
    var compiler = compilerFactory.createCompiler([options]);
    return compiler.compileModuleAsync(moduleType);
}
export function compileNgModuleFactory__POST_NGCC__(injector, options, moduleType) {
    ngDevMode && assertNgModuleType(moduleType);
    return Promise.resolve(new R3NgModuleFactory(moduleType));
}
export var ALLOW_MULTIPLE_PLATFORMS = new InjectionToken('AllowMultipleToken');
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
export { NgProbeToken };
/**
 * Creates a platform.
 * Platforms have to be eagerly created via this function.
 *
 * @publicApi
 */
export function createPlatform(injector) {
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
export function createPlatformFactory(parentPlatformFactory, name, providers) {
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
export function assertPlatform(requiredToken) {
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
export function destroyPlatform() {
    if (_platform && !_platform.destroyed) {
        _platform.destroy();
    }
}
/**
 * Returns the current platform.
 *
 * @publicApi
 */
export function getPlatform() {
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
    PlatformRef = tslib_1.__decorate([
        Injectable(),
        tslib_1.__metadata("design:paramtypes", [Injector])
    ], PlatformRef);
    return PlatformRef;
}());
export { PlatformRef };
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
        dst = tslib_1.__assign({}, dst, objs);
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
        var isCurrentlyStable = new Observable(function (observer) {
            _this._stable = _this._zone.isStable && !_this._zone.hasPendingMacrotasks &&
                !_this._zone.hasPendingMicrotasks;
            _this._zone.runOutsideAngular(function () {
                observer.next(_this._stable);
                observer.complete();
            });
        });
        var isStable = new Observable(function (observer) {
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
            merge(isCurrentlyStable, isStable.pipe(share()));
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
    ApplicationRef = ApplicationRef_1 = tslib_1.__decorate([
        Injectable(),
        tslib_1.__metadata("design:paramtypes", [NgZone, Console, Injector,
            ErrorHandler,
            ComponentFactoryResolver,
            ApplicationInitStatus])
    ], ApplicationRef);
    return ApplicationRef;
}());
export { ApplicationRef };
function remove(list, el) {
    var index = list.indexOf(el);
    if (index > -1) {
        list.splice(index, 1);
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25fcmVmLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvYXBwbGljYXRpb25fcmVmLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMsVUFBVSxFQUEwQixLQUFLLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDL0QsT0FBTyxFQUFDLEtBQUssRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRXJDLE9BQU8sRUFBQyxxQkFBcUIsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ3pELE9BQU8sRUFBQyxzQkFBc0IsRUFBRSxvQkFBb0IsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ2xGLE9BQU8sRUFBQyxPQUFPLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDbEMsT0FBTyxFQUFDLFVBQVUsRUFBRSxjQUFjLEVBQUUsUUFBUSxFQUFpQixNQUFNLE1BQU0sQ0FBQztBQUMxRSxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDN0MsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN4QyxPQUFPLEVBQUMsZUFBZSxFQUFrQixNQUFNLG1CQUFtQixDQUFDO0FBQ25FLE9BQU8sRUFBQyxnQkFBZ0IsRUFBZSxNQUFNLDRCQUE0QixDQUFDO0FBQzFFLE9BQU8sRUFBQyw2QkFBNkIsRUFBRSx3QkFBd0IsRUFBQyxNQUFNLHFDQUFxQyxDQUFDO0FBQzVHLE9BQU8sRUFBdUMsV0FBVyxFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFFN0YsT0FBTyxFQUFhLGNBQWMsRUFBRSxRQUFRLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN2RSxPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUNwRCxPQUFPLEVBQUMsZUFBZSxJQUFJLGlCQUFpQixFQUFDLE1BQU0seUJBQXlCLENBQUM7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Q0UsdUNBQXVDO1FBQ3ZDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsT0FBTyxDQUFDLFVBQUMsSUFBSSxJQUFLLE9BQUEsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFkLENBQWMsQ0FBQyxDQUFDO0lBQ3hELENBQUM7SUFLRCxzQkFBSSxxQ0FBUztRQUhiOztXQUVHO2FBQ0gsY0FBa0IsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7OztPQUFBOztJQW5OOUMsZ0JBQWdCO0lBQ1QseUJBQVUsR0FBZSxjQUFjLENBQUMsdUJBQXVCLENBQUMsQ0FBQztJQUY3RCxjQUFjO1FBRDFCLFVBQVUsRUFBRTtpREE2QlEsTUFBTSxFQUFvQixPQUFPLEVBQXFCLFFBQVE7WUFDbEQsWUFBWTtZQUNKLHdCQUF3QjtZQUN0QyxxQkFBcUI7T0EvQm5DLGNBQWMsQ0FxTjFCO0lBQUQscUJBQUM7Q0FBQSxBQXJORCxJQXFOQztTQXJOWSxjQUFjO0FBdU4zQixTQUFTLE1BQU0sQ0FBSSxJQUFTLEVBQUUsRUFBSztJQUNqQyxJQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQy9CLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxFQUFFO1FBQ2QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7S0FDdkI7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge09ic2VydmFibGUsIE9ic2VydmVyLCBTdWJzY3JpcHRpb24sIG1lcmdlfSBmcm9tICdyeGpzJztcbmltcG9ydCB7c2hhcmV9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcblxuaW1wb3J0IHtBcHBsaWNhdGlvbkluaXRTdGF0dXN9IGZyb20gJy4vYXBwbGljYXRpb25faW5pdCc7XG5pbXBvcnQge0FQUF9CT09UU1RSQVBfTElTVEVORVIsIFBMQVRGT1JNX0lOSVRJQUxJWkVSfSBmcm9tICcuL2FwcGxpY2F0aW9uX3Rva2Vucyc7XG5pbXBvcnQge0NvbnNvbGV9IGZyb20gJy4vY29uc29sZSc7XG5pbXBvcnQge0luamVjdGFibGUsIEluamVjdGlvblRva2VuLCBJbmplY3RvciwgU3RhdGljUHJvdmlkZXJ9IGZyb20gJy4vZGknO1xuaW1wb3J0IHtFcnJvckhhbmRsZXJ9IGZyb20gJy4vZXJyb3JfaGFuZGxlcic7XG5pbXBvcnQge2lzRGV2TW9kZX0gZnJvbSAnLi9pc19kZXZfbW9kZSc7XG5pbXBvcnQge0NvbXBpbGVyRmFjdG9yeSwgQ29tcGlsZXJPcHRpb25zfSBmcm9tICcuL2xpbmtlci9jb21waWxlcic7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnksIENvbXBvbmVudFJlZn0gZnJvbSAnLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnknO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5Qm91bmRUb01vZHVsZSwgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyfSBmcm9tICcuL2xpbmtlci9jb21wb25lbnRfZmFjdG9yeV9yZXNvbHZlcic7XG5pbXBvcnQge0ludGVybmFsTmdNb2R1bGVSZWYsIE5nTW9kdWxlRmFjdG9yeSwgTmdNb2R1bGVSZWZ9IGZyb20gJy4vbGlua2VyL25nX21vZHVsZV9mYWN0b3J5JztcbmltcG9ydCB7SW50ZXJuYWxWaWV3UmVmLCBWaWV3UmVmfSBmcm9tICcuL2xpbmtlci92aWV3X3JlZic7XG5pbXBvcnQge1d0ZlNjb3BlRm4sIHd0ZkNyZWF0ZVNjb3BlLCB3dGZMZWF2ZX0gZnJvbSAnLi9wcm9maWxlL3Byb2ZpbGUnO1xuaW1wb3J0IHthc3NlcnROZ01vZHVsZVR5cGV9IGZyb20gJy4vcmVuZGVyMy9hc3NlcnQnO1xuaW1wb3J0IHtOZ01vZHVsZUZhY3RvcnkgYXMgUjNOZ01vZHVsZUZhY3Rvcnl9IGZyb20gJy4vcmVuZGVyMy9uZ19tb2R1bGVfcmVmJztcbmltcG9ydCB7VGVzdGFiaWxpdHksIFRlc3RhYmlsaXR5UmVnaXN0cnl9IGZyb20gJy4vdGVzdGFiaWxpdHkvdGVzdGFiaWxpdHknO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuL3R5cGUnO1xuaW1wb3J0IHtzY2hlZHVsZU1pY3JvVGFzaywgc3RyaW5naWZ5fSBmcm9tICcuL3V0aWwnO1xuaW1wb3J0IHtpc1Byb21pc2V9IGZyb20gJy4vdXRpbC9sYW5nJztcbmltcG9ydCB7Tmdab25lLCBOb29wTmdab25lfSBmcm9tICcuL3pvbmUvbmdfem9uZSc7XG5cbmxldCBfcGxhdGZvcm06IFBsYXRmb3JtUmVmO1xuXG5sZXQgY29tcGlsZU5nTW9kdWxlRmFjdG9yeTpcbiAgICA8TT4oaW5qZWN0b3I6IEluamVjdG9yLCBvcHRpb25zOiBDb21waWxlck9wdGlvbnMsIG1vZHVsZVR5cGU6IFR5cGU8TT4pID0+XG4gICAgICAgIFByb21pc2U8TmdNb2R1bGVGYWN0b3J5PE0+PiA9IGNvbXBpbGVOZ01vZHVsZUZhY3RvcnlfX1BSRV9OR0NDX187XG5cbmZ1bmN0aW9uIGNvbXBpbGVOZ01vZHVsZUZhY3RvcnlfX1BSRV9OR0NDX188TT4oXG4gICAgaW5qZWN0b3I6IEluamVjdG9yLCBvcHRpb25zOiBDb21waWxlck9wdGlvbnMsXG4gICAgbW9kdWxlVHlwZTogVHlwZTxNPik6IFByb21pc2U8TmdNb2R1bGVGYWN0b3J5PE0+PiB7XG4gIGNvbnN0IGNvbXBpbGVyRmFjdG9yeTogQ29tcGlsZXJGYWN0b3J5ID0gaW5qZWN0b3IuZ2V0KENvbXBpbGVyRmFjdG9yeSk7XG4gIGNvbnN0IGNvbXBpbGVyID0gY29tcGlsZXJGYWN0b3J5LmNyZWF0ZUNvbXBpbGVyKFtvcHRpb25zXSk7XG4gIHJldHVybiBjb21waWxlci5jb21waWxlTW9kdWxlQXN5bmMobW9kdWxlVHlwZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlTmdNb2R1bGVGYWN0b3J5X19QT1NUX05HQ0NfXzxNPihcbiAgICBpbmplY3RvcjogSW5qZWN0b3IsIG9wdGlvbnM6IENvbXBpbGVyT3B0aW9ucyxcbiAgICBtb2R1bGVUeXBlOiBUeXBlPE0+KTogUHJvbWlzZTxOZ01vZHVsZUZhY3Rvcnk8TT4+IHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5nTW9kdWxlVHlwZShtb2R1bGVUeXBlKTtcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShuZXcgUjNOZ01vZHVsZUZhY3RvcnkobW9kdWxlVHlwZSkpO1xufVxuXG5leHBvcnQgY29uc3QgQUxMT1dfTVVMVElQTEVfUExBVEZPUk1TID0gbmV3IEluamVjdGlvblRva2VuPGJvb2xlYW4+KCdBbGxvd011bHRpcGxlVG9rZW4nKTtcblxuXG5cbi8qKlxuICogQSB0b2tlbiBmb3IgdGhpcmQtcGFydHkgY29tcG9uZW50cyB0aGF0IGNhbiByZWdpc3RlciB0aGVtc2VsdmVzIHdpdGggTmdQcm9iZS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBOZ1Byb2JlVG9rZW4ge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgbmFtZTogc3RyaW5nLCBwdWJsaWMgdG9rZW46IGFueSkge31cbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgcGxhdGZvcm0uXG4gKiBQbGF0Zm9ybXMgaGF2ZSB0byBiZSBlYWdlcmx5IGNyZWF0ZWQgdmlhIHRoaXMgZnVuY3Rpb24uXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUGxhdGZvcm0oaW5qZWN0b3I6IEluamVjdG9yKTogUGxhdGZvcm1SZWYge1xuICBpZiAoX3BsYXRmb3JtICYmICFfcGxhdGZvcm0uZGVzdHJveWVkICYmXG4gICAgICAhX3BsYXRmb3JtLmluamVjdG9yLmdldChBTExPV19NVUxUSVBMRV9QTEFURk9STVMsIGZhbHNlKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgJ1RoZXJlIGNhbiBiZSBvbmx5IG9uZSBwbGF0Zm9ybS4gRGVzdHJveSB0aGUgcHJldmlvdXMgb25lIHRvIGNyZWF0ZSBhIG5ldyBvbmUuJyk7XG4gIH1cbiAgX3BsYXRmb3JtID0gaW5qZWN0b3IuZ2V0KFBsYXRmb3JtUmVmKTtcbiAgY29uc3QgaW5pdHMgPSBpbmplY3Rvci5nZXQoUExBVEZPUk1fSU5JVElBTElaRVIsIG51bGwpO1xuICBpZiAoaW5pdHMpIGluaXRzLmZvckVhY2goKGluaXQ6IGFueSkgPT4gaW5pdCgpKTtcbiAgcmV0dXJuIF9wbGF0Zm9ybTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgZmFjdG9yeSBmb3IgYSBwbGF0Zm9ybVxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVBsYXRmb3JtRmFjdG9yeShcbiAgICBwYXJlbnRQbGF0Zm9ybUZhY3Rvcnk6ICgoZXh0cmFQcm92aWRlcnM/OiBTdGF0aWNQcm92aWRlcltdKSA9PiBQbGF0Zm9ybVJlZikgfCBudWxsLFxuICAgIG5hbWU6IHN0cmluZywgcHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdID0gW10pOiAoZXh0cmFQcm92aWRlcnM/OiBTdGF0aWNQcm92aWRlcltdKSA9PlxuICAgIFBsYXRmb3JtUmVmIHtcbiAgY29uc3QgZGVzYyA9IGBQbGF0Zm9ybTogJHtuYW1lfWA7XG4gIGNvbnN0IG1hcmtlciA9IG5ldyBJbmplY3Rpb25Ub2tlbihkZXNjKTtcbiAgcmV0dXJuIChleHRyYVByb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXSA9IFtdKSA9PiB7XG4gICAgbGV0IHBsYXRmb3JtID0gZ2V0UGxhdGZvcm0oKTtcbiAgICBpZiAoIXBsYXRmb3JtIHx8IHBsYXRmb3JtLmluamVjdG9yLmdldChBTExPV19NVUxUSVBMRV9QTEFURk9STVMsIGZhbHNlKSkge1xuICAgICAgaWYgKHBhcmVudFBsYXRmb3JtRmFjdG9yeSkge1xuICAgICAgICBwYXJlbnRQbGF0Zm9ybUZhY3RvcnkoXG4gICAgICAgICAgICBwcm92aWRlcnMuY29uY2F0KGV4dHJhUHJvdmlkZXJzKS5jb25jYXQoe3Byb3ZpZGU6IG1hcmtlciwgdXNlVmFsdWU6IHRydWV9KSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBpbmplY3RlZFByb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXSA9XG4gICAgICAgICAgICBwcm92aWRlcnMuY29uY2F0KGV4dHJhUHJvdmlkZXJzKS5jb25jYXQoe3Byb3ZpZGU6IG1hcmtlciwgdXNlVmFsdWU6IHRydWV9KTtcbiAgICAgICAgY3JlYXRlUGxhdGZvcm0oSW5qZWN0b3IuY3JlYXRlKHtwcm92aWRlcnM6IGluamVjdGVkUHJvdmlkZXJzLCBuYW1lOiBkZXNjfSkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYXNzZXJ0UGxhdGZvcm0obWFya2VyKTtcbiAgfTtcbn1cblxuLyoqXG4gKiBDaGVja3MgdGhhdCB0aGVyZSBjdXJyZW50bHkgaXMgYSBwbGF0Zm9ybSB3aGljaCBjb250YWlucyB0aGUgZ2l2ZW4gdG9rZW4gYXMgYSBwcm92aWRlci5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRQbGF0Zm9ybShyZXF1aXJlZFRva2VuOiBhbnkpOiBQbGF0Zm9ybVJlZiB7XG4gIGNvbnN0IHBsYXRmb3JtID0gZ2V0UGxhdGZvcm0oKTtcblxuICBpZiAoIXBsYXRmb3JtKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdObyBwbGF0Zm9ybSBleGlzdHMhJyk7XG4gIH1cblxuICBpZiAoIXBsYXRmb3JtLmluamVjdG9yLmdldChyZXF1aXJlZFRva2VuLCBudWxsKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgJ0EgcGxhdGZvcm0gd2l0aCBhIGRpZmZlcmVudCBjb25maWd1cmF0aW9uIGhhcyBiZWVuIGNyZWF0ZWQuIFBsZWFzZSBkZXN0cm95IGl0IGZpcnN0LicpO1xuICB9XG5cbiAgcmV0dXJuIHBsYXRmb3JtO1xufVxuXG4vKipcbiAqIERlc3Ryb3kgdGhlIGV4aXN0aW5nIHBsYXRmb3JtLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlc3Ryb3lQbGF0Zm9ybSgpOiB2b2lkIHtcbiAgaWYgKF9wbGF0Zm9ybSAmJiAhX3BsYXRmb3JtLmRlc3Ryb3llZCkge1xuICAgIF9wbGF0Zm9ybS5kZXN0cm95KCk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBjdXJyZW50IHBsYXRmb3JtLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBsYXRmb3JtKCk6IFBsYXRmb3JtUmVmfG51bGwge1xuICByZXR1cm4gX3BsYXRmb3JtICYmICFfcGxhdGZvcm0uZGVzdHJveWVkID8gX3BsYXRmb3JtIDogbnVsbDtcbn1cblxuLyoqXG4gKiBQcm92aWRlcyBhZGRpdGlvbmFsIG9wdGlvbnMgdG8gdGhlIGJvb3RzdHJhcGluZyBwcm9jZXNzLlxuICpcbiAqXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQm9vdHN0cmFwT3B0aW9ucyB7XG4gIC8qKlxuICAgKiBPcHRpb25hbGx5IHNwZWNpZnkgd2hpY2ggYE5nWm9uZWAgc2hvdWxkIGJlIHVzZWQuXG4gICAqXG4gICAqIC0gUHJvdmlkZSB5b3VyIG93biBgTmdab25lYCBpbnN0YW5jZS5cbiAgICogLSBgem9uZS5qc2AgLSBVc2UgZGVmYXVsdCBgTmdab25lYCB3aGljaCByZXF1aXJlcyBgWm9uZS5qc2AuXG4gICAqIC0gYG5vb3BgIC0gVXNlIGBOb29wTmdab25lYCB3aGljaCBkb2VzIG5vdGhpbmcuXG4gICAqL1xuICBuZ1pvbmU/OiBOZ1pvbmV8J3pvbmUuanMnfCdub29wJztcbn1cblxuLyoqXG4gKiBUaGUgQW5ndWxhciBwbGF0Zm9ybSBpcyB0aGUgZW50cnkgcG9pbnQgZm9yIEFuZ3VsYXIgb24gYSB3ZWIgcGFnZS4gRWFjaCBwYWdlXG4gKiBoYXMgZXhhY3RseSBvbmUgcGxhdGZvcm0sIGFuZCBzZXJ2aWNlcyAoc3VjaCBhcyByZWZsZWN0aW9uKSB3aGljaCBhcmUgY29tbW9uXG4gKiB0byBldmVyeSBBbmd1bGFyIGFwcGxpY2F0aW9uIHJ1bm5pbmcgb24gdGhlIHBhZ2UgYXJlIGJvdW5kIGluIGl0cyBzY29wZS5cbiAqXG4gKiBBIHBhZ2UncyBwbGF0Zm9ybSBpcyBpbml0aWFsaXplZCBpbXBsaWNpdGx5IHdoZW4gYSBwbGF0Zm9ybSBpcyBjcmVhdGVkIHZpYSBhIHBsYXRmb3JtIGZhY3RvcnlcbiAqIChlLmcuIHtAbGluayBwbGF0Zm9ybUJyb3dzZXJ9KSwgb3IgZXhwbGljaXRseSBieSBjYWxsaW5nIHRoZSB7QGxpbmsgY3JlYXRlUGxhdGZvcm19IGZ1bmN0aW9uLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIFBsYXRmb3JtUmVmIHtcbiAgcHJpdmF0ZSBfbW9kdWxlczogTmdNb2R1bGVSZWY8YW55PltdID0gW107XG4gIHByaXZhdGUgX2Rlc3Ryb3lMaXN0ZW5lcnM6IEZ1bmN0aW9uW10gPSBbXTtcbiAgcHJpdmF0ZSBfZGVzdHJveWVkOiBib29sZWFuID0gZmFsc2U7XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9pbmplY3RvcjogSW5qZWN0b3IpIHt9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gaW5zdGFuY2Ugb2YgYW4gYEBOZ01vZHVsZWAgZm9yIHRoZSBnaXZlbiBwbGF0Zm9ybVxuICAgKiBmb3Igb2ZmbGluZSBjb21waWxhdGlvbi5cbiAgICpcbiAgICogQHVzYWdlTm90ZXNcbiAgICogIyMjIFNpbXBsZSBFeGFtcGxlXG4gICAqXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogbXlfbW9kdWxlLnRzOlxuICAgKlxuICAgKiBATmdNb2R1bGUoe1xuICAgKiAgIGltcG9ydHM6IFtCcm93c2VyTW9kdWxlXVxuICAgKiB9KVxuICAgKiBjbGFzcyBNeU1vZHVsZSB7fVxuICAgKlxuICAgKiBtYWluLnRzOlxuICAgKiBpbXBvcnQge015TW9kdWxlTmdGYWN0b3J5fSBmcm9tICcuL215X21vZHVsZS5uZ2ZhY3RvcnknO1xuICAgKiBpbXBvcnQge3BsYXRmb3JtQnJvd3Nlcn0gZnJvbSAnQGFuZ3VsYXIvcGxhdGZvcm0tYnJvd3Nlcic7XG4gICAqXG4gICAqIGxldCBtb2R1bGVSZWYgPSBwbGF0Zm9ybUJyb3dzZXIoKS5ib290c3RyYXBNb2R1bGVGYWN0b3J5KE15TW9kdWxlTmdGYWN0b3J5KTtcbiAgICogYGBgXG4gICAqL1xuICBib290c3RyYXBNb2R1bGVGYWN0b3J5PE0+KG1vZHVsZUZhY3Rvcnk6IE5nTW9kdWxlRmFjdG9yeTxNPiwgb3B0aW9ucz86IEJvb3RzdHJhcE9wdGlvbnMpOlxuICAgICAgUHJvbWlzZTxOZ01vZHVsZVJlZjxNPj4ge1xuICAgIC8vIE5vdGU6IFdlIG5lZWQgdG8gY3JlYXRlIHRoZSBOZ1pvbmUgX2JlZm9yZV8gd2UgaW5zdGFudGlhdGUgdGhlIG1vZHVsZSxcbiAgICAvLyBhcyBpbnN0YW50aWF0aW5nIHRoZSBtb2R1bGUgY3JlYXRlcyBzb21lIHByb3ZpZGVycyBlYWdlcmx5LlxuICAgIC8vIFNvIHdlIGNyZWF0ZSBhIG1pbmkgcGFyZW50IGluamVjdG9yIHRoYXQganVzdCBjb250YWlucyB0aGUgbmV3IE5nWm9uZSBhbmRcbiAgICAvLyBwYXNzIHRoYXQgYXMgcGFyZW50IHRvIHRoZSBOZ01vZHVsZUZhY3RvcnkuXG4gICAgY29uc3Qgbmdab25lT3B0aW9uID0gb3B0aW9ucyA/IG9wdGlvbnMubmdab25lIDogdW5kZWZpbmVkO1xuICAgIGNvbnN0IG5nWm9uZSA9IGdldE5nWm9uZShuZ1pvbmVPcHRpb24pO1xuICAgIGNvbnN0IHByb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXSA9IFt7cHJvdmlkZTogTmdab25lLCB1c2VWYWx1ZTogbmdab25lfV07XG4gICAgLy8gQXR0ZW50aW9uOiBEb24ndCB1c2UgQXBwbGljYXRpb25SZWYucnVuIGhlcmUsXG4gICAgLy8gYXMgd2Ugd2FudCB0byBiZSBzdXJlIHRoYXQgYWxsIHBvc3NpYmxlIGNvbnN0cnVjdG9yIGNhbGxzIGFyZSBpbnNpZGUgYG5nWm9uZS5ydW5gIVxuICAgIHJldHVybiBuZ1pvbmUucnVuKCgpID0+IHtcbiAgICAgIGNvbnN0IG5nWm9uZUluamVjdG9yID0gSW5qZWN0b3IuY3JlYXRlKFxuICAgICAgICAgIHtwcm92aWRlcnM6IHByb3ZpZGVycywgcGFyZW50OiB0aGlzLmluamVjdG9yLCBuYW1lOiBtb2R1bGVGYWN0b3J5Lm1vZHVsZVR5cGUubmFtZX0pO1xuICAgICAgY29uc3QgbW9kdWxlUmVmID0gPEludGVybmFsTmdNb2R1bGVSZWY8TT4+bW9kdWxlRmFjdG9yeS5jcmVhdGUobmdab25lSW5qZWN0b3IpO1xuICAgICAgY29uc3QgZXhjZXB0aW9uSGFuZGxlcjogRXJyb3JIYW5kbGVyID0gbW9kdWxlUmVmLmluamVjdG9yLmdldChFcnJvckhhbmRsZXIsIG51bGwpO1xuICAgICAgaWYgKCFleGNlcHRpb25IYW5kbGVyKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gRXJyb3JIYW5kbGVyLiBJcyBwbGF0Zm9ybSBtb2R1bGUgKEJyb3dzZXJNb2R1bGUpIGluY2x1ZGVkPycpO1xuICAgICAgfVxuICAgICAgbW9kdWxlUmVmLm9uRGVzdHJveSgoKSA9PiByZW1vdmUodGhpcy5fbW9kdWxlcywgbW9kdWxlUmVmKSk7XG4gICAgICBuZ1pvbmUgIS5ydW5PdXRzaWRlQW5ndWxhcihcbiAgICAgICAgICAoKSA9PiBuZ1pvbmUgIS5vbkVycm9yLnN1YnNjcmliZShcbiAgICAgICAgICAgICAge25leHQ6IChlcnJvcjogYW55KSA9PiB7IGV4Y2VwdGlvbkhhbmRsZXIuaGFuZGxlRXJyb3IoZXJyb3IpOyB9fSkpO1xuICAgICAgcmV0dXJuIF9jYWxsQW5kUmVwb3J0VG9FcnJvckhhbmRsZXIoZXhjZXB0aW9uSGFuZGxlciwgbmdab25lICEsICgpID0+IHtcbiAgICAgICAgY29uc3QgaW5pdFN0YXR1czogQXBwbGljYXRpb25Jbml0U3RhdHVzID0gbW9kdWxlUmVmLmluamVjdG9yLmdldChBcHBsaWNhdGlvbkluaXRTdGF0dXMpO1xuICAgICAgICBpbml0U3RhdHVzLnJ1bkluaXRpYWxpemVycygpO1xuICAgICAgICByZXR1cm4gaW5pdFN0YXR1cy5kb25lUHJvbWlzZS50aGVuKCgpID0+IHtcbiAgICAgICAgICB0aGlzLl9tb2R1bGVEb0Jvb3RzdHJhcChtb2R1bGVSZWYpO1xuICAgICAgICAgIHJldHVybiBtb2R1bGVSZWY7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBpbnN0YW5jZSBvZiBhbiBgQE5nTW9kdWxlYCBmb3IgYSBnaXZlbiBwbGF0Zm9ybSB1c2luZyB0aGUgZ2l2ZW4gcnVudGltZSBjb21waWxlci5cbiAgICpcbiAgICogQHVzYWdlTm90ZXNcbiAgICogIyMjIFNpbXBsZSBFeGFtcGxlXG4gICAqXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogQE5nTW9kdWxlKHtcbiAgICogICBpbXBvcnRzOiBbQnJvd3Nlck1vZHVsZV1cbiAgICogfSlcbiAgICogY2xhc3MgTXlNb2R1bGUge31cbiAgICpcbiAgICogbGV0IG1vZHVsZVJlZiA9IHBsYXRmb3JtQnJvd3NlcigpLmJvb3RzdHJhcE1vZHVsZShNeU1vZHVsZSk7XG4gICAqIGBgYFxuICAgKlxuICAgKi9cbiAgYm9vdHN0cmFwTW9kdWxlPE0+KFxuICAgICAgbW9kdWxlVHlwZTogVHlwZTxNPiwgY29tcGlsZXJPcHRpb25zOiAoQ29tcGlsZXJPcHRpb25zJkJvb3RzdHJhcE9wdGlvbnMpfFxuICAgICAgQXJyYXk8Q29tcGlsZXJPcHRpb25zJkJvb3RzdHJhcE9wdGlvbnM+ID0gW10pOiBQcm9taXNlPE5nTW9kdWxlUmVmPE0+PiB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbnNSZWR1Y2VyKHt9LCBjb21waWxlck9wdGlvbnMpO1xuICAgIHJldHVybiBjb21waWxlTmdNb2R1bGVGYWN0b3J5KHRoaXMuaW5qZWN0b3IsIG9wdGlvbnMsIG1vZHVsZVR5cGUpXG4gICAgICAgIC50aGVuKG1vZHVsZUZhY3RvcnkgPT4gdGhpcy5ib290c3RyYXBNb2R1bGVGYWN0b3J5KG1vZHVsZUZhY3RvcnksIG9wdGlvbnMpKTtcbiAgfVxuXG4gIHByaXZhdGUgX21vZHVsZURvQm9vdHN0cmFwKG1vZHVsZVJlZjogSW50ZXJuYWxOZ01vZHVsZVJlZjxhbnk+KTogdm9pZCB7XG4gICAgY29uc3QgYXBwUmVmID0gbW9kdWxlUmVmLmluamVjdG9yLmdldChBcHBsaWNhdGlvblJlZikgYXMgQXBwbGljYXRpb25SZWY7XG4gICAgaWYgKG1vZHVsZVJlZi5fYm9vdHN0cmFwQ29tcG9uZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICBtb2R1bGVSZWYuX2Jvb3RzdHJhcENvbXBvbmVudHMuZm9yRWFjaChmID0+IGFwcFJlZi5ib290c3RyYXAoZikpO1xuICAgIH0gZWxzZSBpZiAobW9kdWxlUmVmLmluc3RhbmNlLm5nRG9Cb290c3RyYXApIHtcbiAgICAgIG1vZHVsZVJlZi5pbnN0YW5jZS5uZ0RvQm9vdHN0cmFwKGFwcFJlZik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgVGhlIG1vZHVsZSAke3N0cmluZ2lmeShtb2R1bGVSZWYuaW5zdGFuY2UuY29uc3RydWN0b3IpfSB3YXMgYm9vdHN0cmFwcGVkLCBidXQgaXQgZG9lcyBub3QgZGVjbGFyZSBcIkBOZ01vZHVsZS5ib290c3RyYXBcIiBjb21wb25lbnRzIG5vciBhIFwibmdEb0Jvb3RzdHJhcFwiIG1ldGhvZC4gYCArXG4gICAgICAgICAgYFBsZWFzZSBkZWZpbmUgb25lIG9mIHRoZXNlLmApO1xuICAgIH1cbiAgICB0aGlzLl9tb2R1bGVzLnB1c2gobW9kdWxlUmVmKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlciBhIGxpc3RlbmVyIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBwbGF0Zm9ybSBpcyBkaXNwb3NlZC5cbiAgICovXG4gIG9uRGVzdHJveShjYWxsYmFjazogKCkgPT4gdm9pZCk6IHZvaWQgeyB0aGlzLl9kZXN0cm95TGlzdGVuZXJzLnB1c2goY2FsbGJhY2spOyB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlIHRoZSBwbGF0Zm9ybSB7QGxpbmsgSW5qZWN0b3J9LCB3aGljaCBpcyB0aGUgcGFyZW50IGluamVjdG9yIGZvclxuICAgKiBldmVyeSBBbmd1bGFyIGFwcGxpY2F0aW9uIG9uIHRoZSBwYWdlIGFuZCBwcm92aWRlcyBzaW5nbGV0b24gcHJvdmlkZXJzLlxuICAgKi9cbiAgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHsgcmV0dXJuIHRoaXMuX2luamVjdG9yOyB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3kgdGhlIEFuZ3VsYXIgcGxhdGZvcm0gYW5kIGFsbCBBbmd1bGFyIGFwcGxpY2F0aW9ucyBvbiB0aGUgcGFnZS5cbiAgICovXG4gIGRlc3Ryb3koKSB7XG4gICAgaWYgKHRoaXMuX2Rlc3Ryb3llZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgcGxhdGZvcm0gaGFzIGFscmVhZHkgYmVlbiBkZXN0cm95ZWQhJyk7XG4gICAgfVxuICAgIHRoaXMuX21vZHVsZXMuc2xpY2UoKS5mb3JFYWNoKG1vZHVsZSA9PiBtb2R1bGUuZGVzdHJveSgpKTtcbiAgICB0aGlzLl9kZXN0cm95TGlzdGVuZXJzLmZvckVhY2gobGlzdGVuZXIgPT4gbGlzdGVuZXIoKSk7XG4gICAgdGhpcy5fZGVzdHJveWVkID0gdHJ1ZTtcbiAgfVxuXG4gIGdldCBkZXN0cm95ZWQoKSB7IHJldHVybiB0aGlzLl9kZXN0cm95ZWQ7IH1cbn1cblxuZnVuY3Rpb24gZ2V0Tmdab25lKG5nWm9uZU9wdGlvbj86IE5nWm9uZSB8ICd6b25lLmpzJyB8ICdub29wJyk6IE5nWm9uZSB7XG4gIGxldCBuZ1pvbmU6IE5nWm9uZTtcblxuICBpZiAobmdab25lT3B0aW9uID09PSAnbm9vcCcpIHtcbiAgICBuZ1pvbmUgPSBuZXcgTm9vcE5nWm9uZSgpO1xuICB9IGVsc2Uge1xuICAgIG5nWm9uZSA9IChuZ1pvbmVPcHRpb24gPT09ICd6b25lLmpzJyA/IHVuZGVmaW5lZCA6IG5nWm9uZU9wdGlvbikgfHxcbiAgICAgICAgbmV3IE5nWm9uZSh7ZW5hYmxlTG9uZ1N0YWNrVHJhY2U6IGlzRGV2TW9kZSgpfSk7XG4gIH1cbiAgcmV0dXJuIG5nWm9uZTtcbn1cblxuZnVuY3Rpb24gX2NhbGxBbmRSZXBvcnRUb0Vycm9ySGFuZGxlcihcbiAgICBlcnJvckhhbmRsZXI6IEVycm9ySGFuZGxlciwgbmdab25lOiBOZ1pvbmUsIGNhbGxiYWNrOiAoKSA9PiBhbnkpOiBhbnkge1xuICB0cnkge1xuICAgIGNvbnN0IHJlc3VsdCA9IGNhbGxiYWNrKCk7XG4gICAgaWYgKGlzUHJvbWlzZShyZXN1bHQpKSB7XG4gICAgICByZXR1cm4gcmVzdWx0LmNhdGNoKChlOiBhbnkpID0+IHtcbiAgICAgICAgbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IGVycm9ySGFuZGxlci5oYW5kbGVFcnJvcihlKSk7XG4gICAgICAgIC8vIHJldGhyb3cgYXMgdGhlIGV4Y2VwdGlvbiBoYW5kbGVyIG1pZ2h0IG5vdCBkbyBpdFxuICAgICAgICB0aHJvdyBlO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSBjYXRjaCAoZSkge1xuICAgIG5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiBlcnJvckhhbmRsZXIuaGFuZGxlRXJyb3IoZSkpO1xuICAgIC8vIHJldGhyb3cgYXMgdGhlIGV4Y2VwdGlvbiBoYW5kbGVyIG1pZ2h0IG5vdCBkbyBpdFxuICAgIHRocm93IGU7XG4gIH1cbn1cblxuZnVuY3Rpb24gb3B0aW9uc1JlZHVjZXI8VCBleHRlbmRzIE9iamVjdD4oZHN0OiBhbnksIG9ianM6IFQgfCBUW10pOiBUIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkob2JqcykpIHtcbiAgICBkc3QgPSBvYmpzLnJlZHVjZShvcHRpb25zUmVkdWNlciwgZHN0KTtcbiAgfSBlbHNlIHtcbiAgICBkc3QgPSB7Li4uZHN0LCAuLi4ob2JqcyBhcyBhbnkpfTtcbiAgfVxuICByZXR1cm4gZHN0O1xufVxuXG4vKipcbiAqIEEgcmVmZXJlbmNlIHRvIGFuIEFuZ3VsYXIgYXBwbGljYXRpb24gcnVubmluZyBvbiBhIHBhZ2UuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgQXBwbGljYXRpb25SZWYge1xuICAvKiogQGludGVybmFsICovXG4gIHN0YXRpYyBfdGlja1Njb3BlOiBXdGZTY29wZUZuID0gd3RmQ3JlYXRlU2NvcGUoJ0FwcGxpY2F0aW9uUmVmI3RpY2soKScpO1xuICBwcml2YXRlIF9ib290c3RyYXBMaXN0ZW5lcnM6ICgoY29tcFJlZjogQ29tcG9uZW50UmVmPGFueT4pID0+IHZvaWQpW10gPSBbXTtcbiAgcHJpdmF0ZSBfdmlld3M6IEludGVybmFsVmlld1JlZltdID0gW107XG4gIHByaXZhdGUgX3J1bm5pbmdUaWNrOiBib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgX2VuZm9yY2VOb05ld0NoYW5nZXM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSBfc3RhYmxlID0gdHJ1ZTtcblxuICAvKipcbiAgICogR2V0IGEgbGlzdCBvZiBjb21wb25lbnQgdHlwZXMgcmVnaXN0ZXJlZCB0byB0aGlzIGFwcGxpY2F0aW9uLlxuICAgKiBUaGlzIGxpc3QgaXMgcG9wdWxhdGVkIGV2ZW4gYmVmb3JlIHRoZSBjb21wb25lbnQgaXMgY3JlYXRlZC5cbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBjb21wb25lbnRUeXBlczogVHlwZTxhbnk+W10gPSBbXTtcblxuICAvKipcbiAgICogR2V0IGEgbGlzdCBvZiBjb21wb25lbnRzIHJlZ2lzdGVyZWQgdG8gdGhpcyBhcHBsaWNhdGlvbi5cbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBjb21wb25lbnRzOiBDb21wb25lbnRSZWY8YW55PltdID0gW107XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gT2JzZXJ2YWJsZSB0aGF0IGluZGljYXRlcyB3aGVuIHRoZSBhcHBsaWNhdGlvbiBpcyBzdGFibGUgb3IgdW5zdGFibGUuXG4gICAqL1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgcHVibGljIHJlYWRvbmx5IGlzU3RhYmxlICE6IE9ic2VydmFibGU8Ym9vbGVhbj47XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgX3pvbmU6IE5nWm9uZSwgcHJpdmF0ZSBfY29uc29sZTogQ29uc29sZSwgcHJpdmF0ZSBfaW5qZWN0b3I6IEluamVjdG9yLFxuICAgICAgcHJpdmF0ZSBfZXhjZXB0aW9uSGFuZGxlcjogRXJyb3JIYW5kbGVyLFxuICAgICAgcHJpdmF0ZSBfY29tcG9uZW50RmFjdG9yeVJlc29sdmVyOiBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIsXG4gICAgICBwcml2YXRlIF9pbml0U3RhdHVzOiBBcHBsaWNhdGlvbkluaXRTdGF0dXMpIHtcbiAgICB0aGlzLl9lbmZvcmNlTm9OZXdDaGFuZ2VzID0gaXNEZXZNb2RlKCk7XG5cbiAgICB0aGlzLl96b25lLm9uTWljcm90YXNrRW1wdHkuc3Vic2NyaWJlKFxuICAgICAgICB7bmV4dDogKCkgPT4geyB0aGlzLl96b25lLnJ1bigoKSA9PiB7IHRoaXMudGljaygpOyB9KTsgfX0pO1xuXG4gICAgY29uc3QgaXNDdXJyZW50bHlTdGFibGUgPSBuZXcgT2JzZXJ2YWJsZTxib29sZWFuPigob2JzZXJ2ZXI6IE9ic2VydmVyPGJvb2xlYW4+KSA9PiB7XG4gICAgICB0aGlzLl9zdGFibGUgPSB0aGlzLl96b25lLmlzU3RhYmxlICYmICF0aGlzLl96b25lLmhhc1BlbmRpbmdNYWNyb3Rhc2tzICYmXG4gICAgICAgICAgIXRoaXMuX3pvbmUuaGFzUGVuZGluZ01pY3JvdGFza3M7XG4gICAgICB0aGlzLl96b25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgb2JzZXJ2ZXIubmV4dCh0aGlzLl9zdGFibGUpO1xuICAgICAgICBvYnNlcnZlci5jb21wbGV0ZSgpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBpc1N0YWJsZSA9IG5ldyBPYnNlcnZhYmxlPGJvb2xlYW4+KChvYnNlcnZlcjogT2JzZXJ2ZXI8Ym9vbGVhbj4pID0+IHtcbiAgICAgIC8vIENyZWF0ZSB0aGUgc3Vic2NyaXB0aW9uIHRvIG9uU3RhYmxlIG91dHNpZGUgdGhlIEFuZ3VsYXIgWm9uZSBzbyB0aGF0XG4gICAgICAvLyB0aGUgY2FsbGJhY2sgaXMgcnVuIG91dHNpZGUgdGhlIEFuZ3VsYXIgWm9uZS5cbiAgICAgIGxldCBzdGFibGVTdWI6IFN1YnNjcmlwdGlvbjtcbiAgICAgIHRoaXMuX3pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICBzdGFibGVTdWIgPSB0aGlzLl96b25lLm9uU3RhYmxlLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgTmdab25lLmFzc2VydE5vdEluQW5ndWxhclpvbmUoKTtcblxuICAgICAgICAgIC8vIENoZWNrIHdoZXRoZXIgdGhlcmUgYXJlIG5vIHBlbmRpbmcgbWFjcm8vbWljcm8gdGFza3MgaW4gdGhlIG5leHQgdGlja1xuICAgICAgICAgIC8vIHRvIGFsbG93IGZvciBOZ1pvbmUgdG8gdXBkYXRlIHRoZSBzdGF0ZS5cbiAgICAgICAgICBzY2hlZHVsZU1pY3JvVGFzaygoKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuX3N0YWJsZSAmJiAhdGhpcy5fem9uZS5oYXNQZW5kaW5nTWFjcm90YXNrcyAmJlxuICAgICAgICAgICAgICAgICF0aGlzLl96b25lLmhhc1BlbmRpbmdNaWNyb3Rhc2tzKSB7XG4gICAgICAgICAgICAgIHRoaXMuX3N0YWJsZSA9IHRydWU7XG4gICAgICAgICAgICAgIG9ic2VydmVyLm5leHQodHJ1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IHVuc3RhYmxlU3ViOiBTdWJzY3JpcHRpb24gPSB0aGlzLl96b25lLm9uVW5zdGFibGUuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgTmdab25lLmFzc2VydEluQW5ndWxhclpvbmUoKTtcbiAgICAgICAgaWYgKHRoaXMuX3N0YWJsZSkge1xuICAgICAgICAgIHRoaXMuX3N0YWJsZSA9IGZhbHNlO1xuICAgICAgICAgIHRoaXMuX3pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4geyBvYnNlcnZlci5uZXh0KGZhbHNlKTsgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBzdGFibGVTdWIudW5zdWJzY3JpYmUoKTtcbiAgICAgICAgdW5zdGFibGVTdWIudW5zdWJzY3JpYmUoKTtcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICAodGhpcyBhc3tpc1N0YWJsZTogT2JzZXJ2YWJsZTxib29sZWFuPn0pLmlzU3RhYmxlID1cbiAgICAgICAgbWVyZ2UoaXNDdXJyZW50bHlTdGFibGUsIGlzU3RhYmxlLnBpcGUoc2hhcmUoKSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEJvb3RzdHJhcCBhIG5ldyBjb21wb25lbnQgYXQgdGhlIHJvb3QgbGV2ZWwgb2YgdGhlIGFwcGxpY2F0aW9uLlxuICAgKlxuICAgKiBAdXNhZ2VOb3Rlc1xuICAgKiAjIyMgQm9vdHN0cmFwIHByb2Nlc3NcbiAgICpcbiAgICogV2hlbiBib290c3RyYXBwaW5nIGEgbmV3IHJvb3QgY29tcG9uZW50IGludG8gYW4gYXBwbGljYXRpb24sIEFuZ3VsYXIgbW91bnRzIHRoZVxuICAgKiBzcGVjaWZpZWQgYXBwbGljYXRpb24gY29tcG9uZW50IG9udG8gRE9NIGVsZW1lbnRzIGlkZW50aWZpZWQgYnkgdGhlIGNvbXBvbmVudFR5cGUnc1xuICAgKiBzZWxlY3RvciBhbmQga2lja3Mgb2ZmIGF1dG9tYXRpYyBjaGFuZ2UgZGV0ZWN0aW9uIHRvIGZpbmlzaCBpbml0aWFsaXppbmcgdGhlIGNvbXBvbmVudC5cbiAgICpcbiAgICogT3B0aW9uYWxseSwgYSBjb21wb25lbnQgY2FuIGJlIG1vdW50ZWQgb250byBhIERPTSBlbGVtZW50IHRoYXQgZG9lcyBub3QgbWF0Y2ggdGhlXG4gICAqIGNvbXBvbmVudFR5cGUncyBzZWxlY3Rvci5cbiAgICpcbiAgICogIyMjIEV4YW1wbGVcbiAgICoge0BleGFtcGxlIGNvcmUvdHMvcGxhdGZvcm0vcGxhdGZvcm0udHMgcmVnaW9uPSdsb25nZm9ybSd9XG4gICAqL1xuICBib290c3RyYXA8Qz4oY29tcG9uZW50T3JGYWN0b3J5OiBDb21wb25lbnRGYWN0b3J5PEM+fFR5cGU8Qz4sIHJvb3RTZWxlY3Rvck9yTm9kZT86IHN0cmluZ3xhbnkpOlxuICAgICAgQ29tcG9uZW50UmVmPEM+IHtcbiAgICBpZiAoIXRoaXMuX2luaXRTdGF0dXMuZG9uZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICdDYW5ub3QgYm9vdHN0cmFwIGFzIHRoZXJlIGFyZSBzdGlsbCBhc3luY2hyb25vdXMgaW5pdGlhbGl6ZXJzIHJ1bm5pbmcuIEJvb3RzdHJhcCBjb21wb25lbnRzIGluIHRoZSBgbmdEb0Jvb3RzdHJhcGAgbWV0aG9kIG9mIHRoZSByb290IG1vZHVsZS4nKTtcbiAgICB9XG4gICAgbGV0IGNvbXBvbmVudEZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk8Qz47XG4gICAgaWYgKGNvbXBvbmVudE9yRmFjdG9yeSBpbnN0YW5jZW9mIENvbXBvbmVudEZhY3RvcnkpIHtcbiAgICAgIGNvbXBvbmVudEZhY3RvcnkgPSBjb21wb25lbnRPckZhY3Rvcnk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbXBvbmVudEZhY3RvcnkgPVxuICAgICAgICAgIHRoaXMuX2NvbXBvbmVudEZhY3RvcnlSZXNvbHZlci5yZXNvbHZlQ29tcG9uZW50RmFjdG9yeShjb21wb25lbnRPckZhY3RvcnkpICE7XG4gICAgfVxuICAgIHRoaXMuY29tcG9uZW50VHlwZXMucHVzaChjb21wb25lbnRGYWN0b3J5LmNvbXBvbmVudFR5cGUpO1xuXG4gICAgLy8gQ3JlYXRlIGEgZmFjdG9yeSBhc3NvY2lhdGVkIHdpdGggdGhlIGN1cnJlbnQgbW9kdWxlIGlmIGl0J3Mgbm90IGJvdW5kIHRvIHNvbWUgb3RoZXJcbiAgICBjb25zdCBuZ01vZHVsZSA9IGNvbXBvbmVudEZhY3RvcnkgaW5zdGFuY2VvZiBDb21wb25lbnRGYWN0b3J5Qm91bmRUb01vZHVsZSA/XG4gICAgICAgIG51bGwgOlxuICAgICAgICB0aGlzLl9pbmplY3Rvci5nZXQoTmdNb2R1bGVSZWYpO1xuICAgIGNvbnN0IHNlbGVjdG9yT3JOb2RlID0gcm9vdFNlbGVjdG9yT3JOb2RlIHx8IGNvbXBvbmVudEZhY3Rvcnkuc2VsZWN0b3I7XG4gICAgY29uc3QgY29tcFJlZiA9IGNvbXBvbmVudEZhY3RvcnkuY3JlYXRlKEluamVjdG9yLk5VTEwsIFtdLCBzZWxlY3Rvck9yTm9kZSwgbmdNb2R1bGUpO1xuXG4gICAgY29tcFJlZi5vbkRlc3Ryb3koKCkgPT4geyB0aGlzLl91bmxvYWRDb21wb25lbnQoY29tcFJlZik7IH0pO1xuICAgIGNvbnN0IHRlc3RhYmlsaXR5ID0gY29tcFJlZi5pbmplY3Rvci5nZXQoVGVzdGFiaWxpdHksIG51bGwpO1xuICAgIGlmICh0ZXN0YWJpbGl0eSkge1xuICAgICAgY29tcFJlZi5pbmplY3Rvci5nZXQoVGVzdGFiaWxpdHlSZWdpc3RyeSlcbiAgICAgICAgICAucmVnaXN0ZXJBcHBsaWNhdGlvbihjb21wUmVmLmxvY2F0aW9uLm5hdGl2ZUVsZW1lbnQsIHRlc3RhYmlsaXR5KTtcbiAgICB9XG5cbiAgICB0aGlzLl9sb2FkQ29tcG9uZW50KGNvbXBSZWYpO1xuICAgIGlmIChpc0Rldk1vZGUoKSkge1xuICAgICAgdGhpcy5fY29uc29sZS5sb2coXG4gICAgICAgICAgYEFuZ3VsYXIgaXMgcnVubmluZyBpbiB0aGUgZGV2ZWxvcG1lbnQgbW9kZS4gQ2FsbCBlbmFibGVQcm9kTW9kZSgpIHRvIGVuYWJsZSB0aGUgcHJvZHVjdGlvbiBtb2RlLmApO1xuICAgIH1cbiAgICByZXR1cm4gY29tcFJlZjtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnZva2UgdGhpcyBtZXRob2QgdG8gZXhwbGljaXRseSBwcm9jZXNzIGNoYW5nZSBkZXRlY3Rpb24gYW5kIGl0cyBzaWRlLWVmZmVjdHMuXG4gICAqXG4gICAqIEluIGRldmVsb3BtZW50IG1vZGUsIGB0aWNrKClgIGFsc28gcGVyZm9ybXMgYSBzZWNvbmQgY2hhbmdlIGRldGVjdGlvbiBjeWNsZSB0byBlbnN1cmUgdGhhdCBub1xuICAgKiBmdXJ0aGVyIGNoYW5nZXMgYXJlIGRldGVjdGVkLiBJZiBhZGRpdGlvbmFsIGNoYW5nZXMgYXJlIHBpY2tlZCB1cCBkdXJpbmcgdGhpcyBzZWNvbmQgY3ljbGUsXG4gICAqIGJpbmRpbmdzIGluIHRoZSBhcHAgaGF2ZSBzaWRlLWVmZmVjdHMgdGhhdCBjYW5ub3QgYmUgcmVzb2x2ZWQgaW4gYSBzaW5nbGUgY2hhbmdlIGRldGVjdGlvblxuICAgKiBwYXNzLlxuICAgKiBJbiB0aGlzIGNhc2UsIEFuZ3VsYXIgdGhyb3dzIGFuIGVycm9yLCBzaW5jZSBhbiBBbmd1bGFyIGFwcGxpY2F0aW9uIGNhbiBvbmx5IGhhdmUgb25lIGNoYW5nZVxuICAgKiBkZXRlY3Rpb24gcGFzcyBkdXJpbmcgd2hpY2ggYWxsIGNoYW5nZSBkZXRlY3Rpb24gbXVzdCBjb21wbGV0ZS5cbiAgICovXG4gIHRpY2soKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX3J1bm5pbmdUaWNrKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FwcGxpY2F0aW9uUmVmLnRpY2sgaXMgY2FsbGVkIHJlY3Vyc2l2ZWx5Jyk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2NvcGUgPSBBcHBsaWNhdGlvblJlZi5fdGlja1Njb3BlKCk7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuX3J1bm5pbmdUaWNrID0gdHJ1ZTtcbiAgICAgIHRoaXMuX3ZpZXdzLmZvckVhY2goKHZpZXcpID0+IHZpZXcuZGV0ZWN0Q2hhbmdlcygpKTtcbiAgICAgIGlmICh0aGlzLl9lbmZvcmNlTm9OZXdDaGFuZ2VzKSB7XG4gICAgICAgIHRoaXMuX3ZpZXdzLmZvckVhY2goKHZpZXcpID0+IHZpZXcuY2hlY2tOb0NoYW5nZXMoKSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgLy8gQXR0ZW50aW9uOiBEb24ndCByZXRocm93IGFzIGl0IGNvdWxkIGNhbmNlbCBzdWJzY3JpcHRpb25zIHRvIE9ic2VydmFibGVzIVxuICAgICAgdGhpcy5fem9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB0aGlzLl9leGNlcHRpb25IYW5kbGVyLmhhbmRsZUVycm9yKGUpKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5fcnVubmluZ1RpY2sgPSBmYWxzZTtcbiAgICAgIHd0ZkxlYXZlKHNjb3BlKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQXR0YWNoZXMgYSB2aWV3IHNvIHRoYXQgaXQgd2lsbCBiZSBkaXJ0eSBjaGVja2VkLlxuICAgKiBUaGUgdmlldyB3aWxsIGJlIGF1dG9tYXRpY2FsbHkgZGV0YWNoZWQgd2hlbiBpdCBpcyBkZXN0cm95ZWQuXG4gICAqIFRoaXMgd2lsbCB0aHJvdyBpZiB0aGUgdmlldyBpcyBhbHJlYWR5IGF0dGFjaGVkIHRvIGEgVmlld0NvbnRhaW5lci5cbiAgICovXG4gIGF0dGFjaFZpZXcodmlld1JlZjogVmlld1JlZik6IHZvaWQge1xuICAgIGNvbnN0IHZpZXcgPSAodmlld1JlZiBhcyBJbnRlcm5hbFZpZXdSZWYpO1xuICAgIHRoaXMuX3ZpZXdzLnB1c2godmlldyk7XG4gICAgdmlldy5hdHRhY2hUb0FwcFJlZih0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRhY2hlcyBhIHZpZXcgZnJvbSBkaXJ0eSBjaGVja2luZyBhZ2Fpbi5cbiAgICovXG4gIGRldGFjaFZpZXcodmlld1JlZjogVmlld1JlZik6IHZvaWQge1xuICAgIGNvbnN0IHZpZXcgPSAodmlld1JlZiBhcyBJbnRlcm5hbFZpZXdSZWYpO1xuICAgIHJlbW92ZSh0aGlzLl92aWV3cywgdmlldyk7XG4gICAgdmlldy5kZXRhY2hGcm9tQXBwUmVmKCk7XG4gIH1cblxuICBwcml2YXRlIF9sb2FkQ29tcG9uZW50KGNvbXBvbmVudFJlZjogQ29tcG9uZW50UmVmPGFueT4pOiB2b2lkIHtcbiAgICB0aGlzLmF0dGFjaFZpZXcoY29tcG9uZW50UmVmLmhvc3RWaWV3KTtcbiAgICB0aGlzLnRpY2soKTtcbiAgICB0aGlzLmNvbXBvbmVudHMucHVzaChjb21wb25lbnRSZWYpO1xuICAgIC8vIEdldCB0aGUgbGlzdGVuZXJzIGxhemlseSB0byBwcmV2ZW50IERJIGN5Y2xlcy5cbiAgICBjb25zdCBsaXN0ZW5lcnMgPVxuICAgICAgICB0aGlzLl9pbmplY3Rvci5nZXQoQVBQX0JPT1RTVFJBUF9MSVNURU5FUiwgW10pLmNvbmNhdCh0aGlzLl9ib290c3RyYXBMaXN0ZW5lcnMpO1xuICAgIGxpc3RlbmVycy5mb3JFYWNoKChsaXN0ZW5lcikgPT4gbGlzdGVuZXIoY29tcG9uZW50UmVmKSk7XG4gIH1cblxuICBwcml2YXRlIF91bmxvYWRDb21wb25lbnQoY29tcG9uZW50UmVmOiBDb21wb25lbnRSZWY8YW55Pik6IHZvaWQge1xuICAgIHRoaXMuZGV0YWNoVmlldyhjb21wb25lbnRSZWYuaG9zdFZpZXcpO1xuICAgIHJlbW92ZSh0aGlzLmNvbXBvbmVudHMsIGNvbXBvbmVudFJlZik7XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIG5nT25EZXN0cm95KCkge1xuICAgIC8vIFRPRE8oYWx4aHViKTogRGlzcG9zZSBvZiB0aGUgTmdab25lLlxuICAgIHRoaXMuX3ZpZXdzLnNsaWNlKCkuZm9yRWFjaCgodmlldykgPT4gdmlldy5kZXN0cm95KCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIG51bWJlciBvZiBhdHRhY2hlZCB2aWV3cy5cbiAgICovXG4gIGdldCB2aWV3Q291bnQoKSB7IHJldHVybiB0aGlzLl92aWV3cy5sZW5ndGg7IH1cbn1cblxuZnVuY3Rpb24gcmVtb3ZlPFQ+KGxpc3Q6IFRbXSwgZWw6IFQpOiB2b2lkIHtcbiAgY29uc3QgaW5kZXggPSBsaXN0LmluZGV4T2YoZWwpO1xuICBpZiAoaW5kZXggPiAtMSkge1xuICAgIGxpc3Quc3BsaWNlKGluZGV4LCAxKTtcbiAgfVxufVxuIl19
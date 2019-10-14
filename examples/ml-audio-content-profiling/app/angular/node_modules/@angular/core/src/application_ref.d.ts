/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Observable } from 'rxjs';
import { InjectionToken, Injector, StaticProvider } from './di';
import { CompilerOptions } from './linker/compiler';
import { ComponentFactory, ComponentRef } from './linker/component_factory';
import { NgModuleFactory, NgModuleRef } from './linker/ng_module_factory';
import { ViewRef } from './linker/view_ref';
import { Type } from './type';
import { NgZone } from './zone/ng_zone';
export declare function compileNgModuleFactory__POST_NGCC__<M>(injector: Injector, options: CompilerOptions, moduleType: Type<M>): Promise<NgModuleFactory<M>>;
export declare const ALLOW_MULTIPLE_PLATFORMS: InjectionToken<boolean>;
/**
 * A token for third-party components that can register themselves with NgProbe.
 *
 * @publicApi
 */
export declare class NgProbeToken {
    name: string;
    token: any;
    constructor(name: string, token: any);
}
/**
 * Creates a platform.
 * Platforms have to be eagerly created via this function.
 *
 * @publicApi
 */
export declare function createPlatform(injector: Injector): PlatformRef;
/**
 * Creates a factory for a platform
 *
 * @publicApi
 */
export declare function createPlatformFactory(parentPlatformFactory: ((extraProviders?: StaticProvider[]) => PlatformRef) | null, name: string, providers?: StaticProvider[]): (extraProviders?: StaticProvider[]) => PlatformRef;
/**
 * Checks that there currently is a platform which contains the given token as a provider.
 *
 * @publicApi
 */
export declare function assertPlatform(requiredToken: any): PlatformRef;
/**
 * Destroy the existing platform.
 *
 * @publicApi
 */
export declare function destroyPlatform(): void;
/**
 * Returns the current platform.
 *
 * @publicApi
 */
export declare function getPlatform(): PlatformRef | null;
/**
 * Provides additional options to the bootstraping process.
 *
 *
 */
export interface BootstrapOptions {
    /**
     * Optionally specify which `NgZone` should be used.
     *
     * - Provide your own `NgZone` instance.
     * - `zone.js` - Use default `NgZone` which requires `Zone.js`.
     * - `noop` - Use `NoopNgZone` which does nothing.
     */
    ngZone?: NgZone | 'zone.js' | 'noop';
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
export declare class PlatformRef {
    private _injector;
    private _modules;
    private _destroyListeners;
    private _destroyed;
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
    bootstrapModuleFactory<M>(moduleFactory: NgModuleFactory<M>, options?: BootstrapOptions): Promise<NgModuleRef<M>>;
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
    bootstrapModule<M>(moduleType: Type<M>, compilerOptions?: (CompilerOptions & BootstrapOptions) | Array<CompilerOptions & BootstrapOptions>): Promise<NgModuleRef<M>>;
    private _moduleDoBootstrap;
    /**
     * Register a listener to be called when the platform is disposed.
     */
    onDestroy(callback: () => void): void;
    /**
     * Retrieve the platform {@link Injector}, which is the parent injector for
     * every Angular application on the page and provides singleton providers.
     */
    readonly injector: Injector;
    /**
     * Destroy the Angular platform and all Angular applications on the page.
     */
    destroy(): void;
    readonly destroyed: boolean;
}
/**
 * A reference to an Angular application running on a page.
 *
 * @publicApi
 */
export declare class ApplicationRef {
    private _zone;
    private _console;
    private _injector;
    private _exceptionHandler;
    private _componentFactoryResolver;
    private _initStatus;
    private _bootstrapListeners;
    private _views;
    private _runningTick;
    private _enforceNoNewChanges;
    private _stable;
    /**
     * Get a list of component types registered to this application.
     * This list is populated even before the component is created.
     */
    readonly componentTypes: Type<any>[];
    /**
     * Get a list of components registered to this application.
     */
    readonly components: ComponentRef<any>[];
    /**
     * Returns an Observable that indicates when the application is stable or unstable.
     */
    readonly isStable: Observable<boolean>;
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
    bootstrap<C>(componentOrFactory: ComponentFactory<C> | Type<C>, rootSelectorOrNode?: string | any): ComponentRef<C>;
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
    tick(): void;
    /**
     * Attaches a view so that it will be dirty checked.
     * The view will be automatically detached when it is destroyed.
     * This will throw if the view is already attached to a ViewContainer.
     */
    attachView(viewRef: ViewRef): void;
    /**
     * Detaches a view from dirty checking again.
     */
    detachView(viewRef: ViewRef): void;
    private _loadComponent;
    private _unloadComponent;
    /**
     * Returns the number of attached views.
     */
    readonly viewCount: number;
}

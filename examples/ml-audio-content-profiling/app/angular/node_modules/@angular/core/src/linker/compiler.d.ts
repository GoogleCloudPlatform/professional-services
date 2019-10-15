/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectionToken } from '../di/injection_token';
import { StaticProvider } from '../di/provider';
import { MissingTranslationStrategy } from '../i18n/tokens';
import { ViewEncapsulation } from '../metadata';
import { Type } from '../type';
import { ComponentFactory } from './component_factory';
import { NgModuleFactory } from './ng_module_factory';
/**
 * Combination of NgModuleFactory and ComponentFactorys.
 *
 * @publicApi
 */
export declare class ModuleWithComponentFactories<T> {
    ngModuleFactory: NgModuleFactory<T>;
    componentFactories: ComponentFactory<any>[];
    constructor(ngModuleFactory: NgModuleFactory<T>, componentFactories: ComponentFactory<any>[]);
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
export declare class Compiler {
    /**
     * Compiles the given NgModule and all of its components. All templates of the components listed
     * in `entryComponents` have to be inlined.
     */
    compileModuleSync<T>(moduleType: Type<T>): NgModuleFactory<T>;
    /**
     * Compiles the given NgModule and all of its components
     */
    compileModuleAsync<T>(moduleType: Type<T>): Promise<NgModuleFactory<T>>;
    /**
     * Same as {@link #compileModuleSync} but also creates ComponentFactories for all components.
     */
    compileModuleAndAllComponentsSync<T>(moduleType: Type<T>): ModuleWithComponentFactories<T>;
    /**
     * Same as {@link #compileModuleAsync} but also creates ComponentFactories for all components.
     */
    compileModuleAndAllComponentsAsync<T>(moduleType: Type<T>): Promise<ModuleWithComponentFactories<T>>;
    /**
     * Clears all caches.
     */
    clearCache(): void;
    /**
     * Clears the cache for the given component/ngModule.
     */
    clearCacheFor(type: Type<any>): void;
    /**
     * Returns the id for a given NgModule, if one is defined and known to the compiler.
     */
    getModuleId(moduleType: Type<any>): string | undefined;
}
/**
 * Options for creating a compiler
 *
 * @publicApi
 */
export declare type CompilerOptions = {
    useJit?: boolean;
    defaultEncapsulation?: ViewEncapsulation;
    providers?: StaticProvider[];
    missingTranslation?: MissingTranslationStrategy;
    preserveWhitespaces?: boolean;
};
/**
 * Token to provide CompilerOptions in the platform injector.
 *
 * @publicApi
 */
export declare const COMPILER_OPTIONS: InjectionToken<CompilerOptions[]>;
/**
 * A factory for creating a Compiler
 *
 * @publicApi
 */
export declare abstract class CompilerFactory {
    abstract createCompiler(options?: CompilerOptions[]): Compiler;
}

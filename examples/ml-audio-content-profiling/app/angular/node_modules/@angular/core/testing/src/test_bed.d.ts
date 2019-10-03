/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Component, Directive, Injector, NgModule, Pipe, PlatformRef, Type } from '@angular/core';
import { ComponentFixture } from './component_fixture';
import { MetadataOverride } from './metadata_override';
import { TestBedStatic, TestModuleMetadata } from './test_bed_common';
export interface TestBed {
    platform: PlatformRef;
    ngModule: Type<any> | Type<any>[];
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
    initTestEnvironment(ngModule: Type<any> | Type<any>[], platform: PlatformRef, aotSummaries?: () => any[]): void;
    /**
     * Reset the providers for the test injector.
     *
     * @publicApi
     */
    resetTestEnvironment(): void;
    resetTestingModule(): void;
    configureCompiler(config: {
        providers?: any[];
        useJit?: boolean;
    }): void;
    configureTestingModule(moduleDef: TestModuleMetadata): void;
    compileComponents(): Promise<any>;
    get(token: any, notFoundValue?: any): any;
    execute(tokens: any[], fn: Function, context?: any): any;
    overrideModule(ngModule: Type<any>, override: MetadataOverride<NgModule>): void;
    overrideComponent(component: Type<any>, override: MetadataOverride<Component>): void;
    overrideDirective(directive: Type<any>, override: MetadataOverride<Directive>): void;
    overridePipe(pipe: Type<any>, override: MetadataOverride<Pipe>): void;
    /**
     * Overwrites all providers for the given token with the given provider definition.
     */
    overrideProvider(token: any, provider: {
        useFactory: Function;
        deps: any[];
    }): void;
    overrideProvider(token: any, provider: {
        useValue: any;
    }): void;
    overrideProvider(token: any, provider: {
        useFactory?: Function;
        useValue?: any;
        deps?: any[];
    }): void;
    /**
     * Overwrites all providers for the given token with the given provider definition.
     *
     * @deprecated as it makes all NgModules lazy. Introduced only for migrating off of it.
     */
    deprecatedOverrideProvider(token: any, provider: {
        useFactory: Function;
        deps: any[];
    }): void;
    deprecatedOverrideProvider(token: any, provider: {
        useValue: any;
    }): void;
    deprecatedOverrideProvider(token: any, provider: {
        useFactory?: Function;
        useValue?: any;
        deps?: any[];
    }): void;
    overrideTemplateUsingTestingModule(component: Type<any>, template: string): void;
    createComponent<T>(component: Type<T>): ComponentFixture<T>;
}
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
export declare class TestBedViewEngine implements Injector, TestBed {
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
    static initTestEnvironment(ngModule: Type<any> | Type<any>[], platform: PlatformRef, aotSummaries?: () => any[]): TestBedViewEngine;
    /**
     * Reset the providers for the test injector.
     *
     * @publicApi
     */
    static resetTestEnvironment(): void;
    static resetTestingModule(): TestBedStatic;
    /**
     * Allows overriding default compiler providers and settings
     * which are defined in test_injector.js
     */
    static configureCompiler(config: {
        providers?: any[];
        useJit?: boolean;
    }): TestBedStatic;
    /**
     * Allows overriding default providers, directives, pipes, modules of the test injector,
     * which are defined in test_injector.js
     */
    static configureTestingModule(moduleDef: TestModuleMetadata): TestBedStatic;
    /**
     * Compile components with a `templateUrl` for the test's NgModule.
     * It is necessary to call this function
     * as fetching urls is asynchronous.
     */
    static compileComponents(): Promise<any>;
    static overrideModule(ngModule: Type<any>, override: MetadataOverride<NgModule>): TestBedStatic;
    static overrideComponent(component: Type<any>, override: MetadataOverride<Component>): TestBedStatic;
    static overrideDirective(directive: Type<any>, override: MetadataOverride<Directive>): TestBedStatic;
    static overridePipe(pipe: Type<any>, override: MetadataOverride<Pipe>): TestBedStatic;
    static overrideTemplate(component: Type<any>, template: string): TestBedStatic;
    /**
     * Overrides the template of the given component, compiling the template
     * in the context of the TestingModule.
     *
     * Note: This works for JIT and AOTed components as well.
     */
    static overrideTemplateUsingTestingModule(component: Type<any>, template: string): TestBedStatic;
    /**
     * Overwrites all providers for the given token with the given provider definition.
     *
     * Note: This works for JIT and AOTed components as well.
     */
    static overrideProvider(token: any, provider: {
        useFactory: Function;
        deps: any[];
    }): TestBedStatic;
    static overrideProvider(token: any, provider: {
        useValue: any;
    }): TestBedStatic;
    /**
     * Overwrites all providers for the given token with the given provider definition.
     *
     * @deprecated as it makes all NgModules lazy. Introduced only for migrating off of it.
     */
    static deprecatedOverrideProvider(token: any, provider: {
        useFactory: Function;
        deps: any[];
    }): void;
    static deprecatedOverrideProvider(token: any, provider: {
        useValue: any;
    }): void;
    static get(token: any, notFoundValue?: any): any;
    static createComponent<T>(component: Type<T>): ComponentFixture<T>;
    private _instantiated;
    private _compiler;
    private _moduleRef;
    private _moduleFactory;
    private _compilerOptions;
    private _moduleOverrides;
    private _componentOverrides;
    private _directiveOverrides;
    private _pipeOverrides;
    private _providers;
    private _declarations;
    private _imports;
    private _schemas;
    private _activeFixtures;
    private _testEnvAotSummaries;
    private _aotSummaries;
    private _templateOverrides;
    private _isRoot;
    private _rootProviderOverrides;
    platform: PlatformRef;
    ngModule: Type<any> | Type<any>[];
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
    initTestEnvironment(ngModule: Type<any> | Type<any>[], platform: PlatformRef, aotSummaries?: () => any[]): void;
    /**
     * Reset the providers for the test injector.
     *
     * @publicApi
     */
    resetTestEnvironment(): void;
    resetTestingModule(): void;
    configureCompiler(config: {
        providers?: any[];
        useJit?: boolean;
    }): void;
    configureTestingModule(moduleDef: TestModuleMetadata): void;
    compileComponents(): Promise<any>;
    private _initIfNeeded;
    private _createCompilerAndModule;
    private _assertNotInstantiated;
    get(token: any, notFoundValue?: any): any;
    execute(tokens: any[], fn: Function, context?: any): any;
    overrideModule(ngModule: Type<any>, override: MetadataOverride<NgModule>): void;
    overrideComponent(component: Type<any>, override: MetadataOverride<Component>): void;
    overrideDirective(directive: Type<any>, override: MetadataOverride<Directive>): void;
    overridePipe(pipe: Type<any>, override: MetadataOverride<Pipe>): void;
    /**
     * Overwrites all providers for the given token with the given provider definition.
     */
    overrideProvider(token: any, provider: {
        useFactory: Function;
        deps: any[];
    }): void;
    overrideProvider(token: any, provider: {
        useValue: any;
    }): void;
    /**
     * Overwrites all providers for the given token with the given provider definition.
     *
     * @deprecated as it makes all NgModules lazy. Introduced only for migrating off of it.
     */
    deprecatedOverrideProvider(token: any, provider: {
        useFactory: Function;
        deps: any[];
    }): void;
    deprecatedOverrideProvider(token: any, provider: {
        useValue: any;
    }): void;
    private overrideProviderImpl;
    overrideTemplateUsingTestingModule(component: Type<any>, template: string): void;
    createComponent<T>(component: Type<T>): ComponentFixture<T>;
}
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
export declare const TestBed: TestBedStatic;
/**
 * Returns a singleton of the applicable `TestBed`.
 *
 * It will be either an instance of `TestBedViewEngine` or `TestBedRender3`.
 *
 * @publicApi
 */
export declare const getTestBed: () => TestBed;
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
export declare function inject(tokens: any[], fn: Function): () => any;
/**
 * @publicApi
 */
export declare class InjectSetupWrapper {
    private _moduleDef;
    constructor(_moduleDef: () => TestModuleMetadata);
    private _addModule;
    inject(tokens: any[], fn: Function): () => any;
}
/**
 * @publicApi
 */
export declare function withModule(moduleDef: TestModuleMetadata): InjectSetupWrapper;
export declare function withModule(moduleDef: TestModuleMetadata, fn: Function): () => any;

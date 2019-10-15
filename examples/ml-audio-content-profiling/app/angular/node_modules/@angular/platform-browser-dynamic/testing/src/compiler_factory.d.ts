/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { MockDirectiveResolver, MockNgModuleResolver, MockPipeResolver } from '@angular/compiler/testing';
import { CompilerFactory, CompilerOptions, Component, ComponentFactory, Directive, Injector, ModuleWithComponentFactories, NgModule, NgModuleFactory, Pipe, StaticProvider, Type } from '@angular/core';
import { MetadataOverride, ɵTestingCompiler as TestingCompiler, ɵTestingCompilerFactory as TestingCompilerFactory } from '@angular/core/testing';
import { ɵCompilerImpl as CompilerImpl } from '@angular/platform-browser-dynamic';
export declare const COMPILER_PROVIDERS: StaticProvider[];
export declare class TestingCompilerFactoryImpl implements TestingCompilerFactory {
    private _injector;
    private _compilerFactory;
    constructor(_injector: Injector, _compilerFactory: CompilerFactory);
    createTestingCompiler(options: CompilerOptions[]): TestingCompiler;
}
export declare class TestingCompilerImpl implements TestingCompiler {
    private _compiler;
    private _directiveResolver;
    private _pipeResolver;
    private _moduleResolver;
    private _overrider;
    constructor(_compiler: CompilerImpl, _directiveResolver: MockDirectiveResolver, _pipeResolver: MockPipeResolver, _moduleResolver: MockNgModuleResolver);
    readonly injector: Injector;
    compileModuleSync<T>(moduleType: Type<T>): NgModuleFactory<T>;
    compileModuleAsync<T>(moduleType: Type<T>): Promise<NgModuleFactory<T>>;
    compileModuleAndAllComponentsSync<T>(moduleType: Type<T>): ModuleWithComponentFactories<T>;
    compileModuleAndAllComponentsAsync<T>(moduleType: Type<T>): Promise<ModuleWithComponentFactories<T>>;
    getComponentFactory<T>(component: Type<T>): ComponentFactory<T>;
    checkOverrideAllowed(type: Type<any>): void;
    overrideModule(ngModule: Type<any>, override: MetadataOverride<NgModule>): void;
    overrideDirective(directive: Type<any>, override: MetadataOverride<Directive>): void;
    overrideComponent(component: Type<any>, override: MetadataOverride<Component>): void;
    overridePipe(pipe: Type<any>, override: MetadataOverride<Pipe>): void;
    loadAotSummaries(summaries: () => any[]): void;
    clearCache(): void;
    clearCacheFor(type: Type<any>): void;
    getComponentFromError(error: Error): any;
    getModuleId(moduleType: Type<any>): string | undefined;
}

/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Compiler, CompilerFactory, ComponentFactory, CompilerOptions, ModuleWithComponentFactories, InjectionToken, StaticProvider, Type, ɵConsole as Console, Injector, NgModuleFactory } from '@angular/core';
import { ViewCompiler, CompileMetadataResolver, TemplateParser, NgModuleCompiler, SummaryResolver, StyleCompiler, CompileReflector, CompilerConfig } from '@angular/compiler';
export declare const ERROR_COLLECTOR_TOKEN: InjectionToken<{}>;
/**
 * A default provider for {@link PACKAGE_ROOT_URL} that maps to '/'.
 */
export declare const DEFAULT_PACKAGE_URL_PROVIDER: {
    provide: InjectionToken<string>;
    useValue: string;
};
export declare class CompilerImpl implements Compiler {
    private _metadataResolver;
    private _delegate;
    readonly injector: Injector;
    constructor(injector: Injector, _metadataResolver: CompileMetadataResolver, templateParser: TemplateParser, styleCompiler: StyleCompiler, viewCompiler: ViewCompiler, ngModuleCompiler: NgModuleCompiler, summaryResolver: SummaryResolver<Type<any>>, compileReflector: CompileReflector, compilerConfig: CompilerConfig, console: Console);
    private getExtraNgModuleProviders;
    compileModuleSync<T>(moduleType: Type<T>): NgModuleFactory<T>;
    compileModuleAsync<T>(moduleType: Type<T>): Promise<NgModuleFactory<T>>;
    compileModuleAndAllComponentsSync<T>(moduleType: Type<T>): ModuleWithComponentFactories<T>;
    compileModuleAndAllComponentsAsync<T>(moduleType: Type<T>): Promise<ModuleWithComponentFactories<T>>;
    loadAotSummaries(summaries: () => any[]): void;
    hasAotSummary(ref: Type<any>): boolean;
    getComponentFactory<T>(component: Type<T>): ComponentFactory<T>;
    clearCache(): void;
    clearCacheFor(type: Type<any>): void;
    getModuleId(moduleType: Type<any>): string | undefined;
}
/**
 * A set of providers that provide `JitCompiler` and its dependencies to use for
 * template compilation.
 */
export declare const COMPILER_PROVIDERS: StaticProvider[];
/**
 * @publicApi
 */
export declare class JitCompilerFactory implements CompilerFactory {
    private _defaultOptions;
    createCompiler(options?: CompilerOptions[]): Compiler;
}

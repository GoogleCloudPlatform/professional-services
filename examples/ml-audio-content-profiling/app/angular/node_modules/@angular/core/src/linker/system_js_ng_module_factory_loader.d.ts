/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Compiler } from './compiler';
import { NgModuleFactory } from './ng_module_factory';
import { NgModuleFactoryLoader } from './ng_module_factory_loader';
/**
 * Configuration for SystemJsNgModuleLoader.
 * token.
 *
 * @publicApi
 */
export declare abstract class SystemJsNgModuleLoaderConfig {
    /**
     * Prefix to add when computing the name of the factory module for a given module name.
     */
    factoryPathPrefix: string;
    /**
     * Suffix to add when computing the name of the factory module for a given module name.
     */
    factoryPathSuffix: string;
}
/**
 * NgModuleFactoryLoader that uses SystemJS to load NgModuleFactory
 * @publicApi
 */
export declare class SystemJsNgModuleLoader implements NgModuleFactoryLoader {
    private _compiler;
    private _config;
    constructor(_compiler: Compiler, config?: SystemJsNgModuleLoaderConfig);
    load(path: string): Promise<NgModuleFactory<any>>;
    private loadAndCompile;
    private loadFactory;
}

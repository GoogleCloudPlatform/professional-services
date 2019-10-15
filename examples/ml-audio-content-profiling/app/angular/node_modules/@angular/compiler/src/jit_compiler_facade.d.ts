/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { CompilerFacade, CoreEnvironment, R3ComponentMetadataFacade, R3DirectiveMetadataFacade, R3InjectableMetadataFacade, R3InjectorMetadataFacade, R3NgModuleMetadataFacade, R3PipeMetadataFacade } from './compiler_facade_interface';
export declare class CompilerFacadeImpl implements CompilerFacade {
    R3ResolvedDependencyType: any;
    compilePipe(angularCoreEnv: CoreEnvironment, sourceMapUrl: string, facade: R3PipeMetadataFacade): any;
    compileInjectable(angularCoreEnv: CoreEnvironment, sourceMapUrl: string, facade: R3InjectableMetadataFacade): any;
    compileInjector(angularCoreEnv: CoreEnvironment, sourceMapUrl: string, facade: R3InjectorMetadataFacade): any;
    compileNgModule(angularCoreEnv: CoreEnvironment, sourceMapUrl: string, facade: R3NgModuleMetadataFacade): any;
    compileDirective(angularCoreEnv: CoreEnvironment, sourceMapUrl: string, facade: R3DirectiveMetadataFacade): any;
    compileComponent(angularCoreEnv: CoreEnvironment, sourceMapUrl: string, facade: R3ComponentMetadataFacade): any;
}
export declare function publishFacade(global: any): void;

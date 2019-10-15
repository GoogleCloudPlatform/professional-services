/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { DepDef, DepFlags, NgModuleData, NgModuleDefinition, NgModuleProviderDef, NodeFlags } from './types';
export declare function moduleProvideDef(flags: NodeFlags, token: any, value: any, deps: ([DepFlags, any] | any)[]): NgModuleProviderDef;
export declare function moduleDef(providers: NgModuleProviderDef[]): NgModuleDefinition;
export declare function initNgModule(data: NgModuleData): void;
export declare function resolveNgModuleDep(data: NgModuleData, depDef: DepDef, notFoundValue?: any): any;
export declare function callNgModuleLifecycle(ngModule: NgModuleData, lifecycles: NodeFlags): void;

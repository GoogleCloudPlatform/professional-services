/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { NgModule, NgModuleTransitiveScopes } from '../../metadata/ng_module';
import { Type } from '../../type';
import { ComponentDef } from '../interfaces/definition';
/**
 * Compiles a module in JIT mode.
 *
 * This function automatically gets called when a class has a `@NgModule` decorator.
 */
export declare function compileNgModule(moduleType: Type<any>, ngModule: NgModule): void;
/**
 * Compiles and adds the `ngModuleDef` and `ngInjectorDef` properties to the module class.
 */
export declare function compileNgModuleDefs(moduleType: Type<any>, ngModule: NgModule): void;
/**
 * Patch the definition of a component with directives and pipes from the compilation scope of
 * a given module.
 */
export declare function patchComponentDefWithScope<C>(componentDef: ComponentDef<C>, transitiveScopes: NgModuleTransitiveScopes): void;
/**
 * Compute the pair of transitive scopes (compilation scope and exported scope) for a given module.
 *
 * This operation is memoized and the result is cached on the module's definition. It can be called
 * on modules with components that have not fully compiled yet, but the result should not be used
 * until they have.
 */
export declare function transitiveScopesFor<T>(moduleType: Type<T>): NgModuleTransitiveScopes;

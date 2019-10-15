/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injector } from '../di/injector';
import { StaticProvider } from '../di/provider';
import { ComponentFactoryResolver as viewEngine_ComponentFactoryResolver } from '../linker/component_factory_resolver';
import { InternalNgModuleRef, NgModuleFactory as viewEngine_NgModuleFactory, NgModuleRef as viewEngine_NgModuleRef } from '../linker/ng_module_factory';
import { NgModuleDef } from '../metadata/ng_module';
import { Type } from '../type';
export interface NgModuleType {
    ngModuleDef: NgModuleDef<any>;
}
export declare const COMPONENT_FACTORY_RESOLVER: StaticProvider;
export declare class NgModuleRef<T> extends viewEngine_NgModuleRef<T> implements InternalNgModuleRef<T> {
    _bootstrapComponents: Type<any>[];
    injector: Injector;
    componentFactoryResolver: viewEngine_ComponentFactoryResolver;
    instance: T;
    destroyCbs: (() => void)[] | null;
    constructor(ngModuleType: Type<T>, parentInjector: Injector | null);
    destroy(): void;
    onDestroy(callback: () => void): void;
}
export declare class NgModuleFactory<T> extends viewEngine_NgModuleFactory<T> {
    moduleType: Type<T>;
    constructor(moduleType: Type<T>);
    create(parentInjector: Injector | null): viewEngine_NgModuleRef<T>;
}

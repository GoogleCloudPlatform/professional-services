/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injector } from '../di/injector';
import { Type } from '../type';
import { ComponentFactory, ComponentRef } from './component_factory';
import { NgModuleRef } from './ng_module_factory';
export declare function noComponentFactoryError(component: Function): Error;
export declare function getComponent(error: Error): Type<any>;
/**
 * @publicApi
 */
export declare abstract class ComponentFactoryResolver {
    static NULL: ComponentFactoryResolver;
    abstract resolveComponentFactory<T>(component: Type<T>): ComponentFactory<T>;
}
export declare class CodegenComponentFactoryResolver implements ComponentFactoryResolver {
    private _parent;
    private _ngModule;
    private _factories;
    constructor(factories: ComponentFactory<any>[], _parent: ComponentFactoryResolver, _ngModule: NgModuleRef<any>);
    resolveComponentFactory<T>(component: {
        new (...args: any[]): T;
    }): ComponentFactory<T>;
}
export declare class ComponentFactoryBoundToModule<C> extends ComponentFactory<C> {
    private factory;
    private ngModule;
    readonly selector: string;
    readonly componentType: Type<any>;
    readonly ngContentSelectors: string[];
    readonly inputs: {
        propName: string;
        templateName: string;
    }[];
    readonly outputs: {
        propName: string;
        templateName: string;
    }[];
    constructor(factory: ComponentFactory<C>, ngModule: NgModuleRef<any>);
    create(injector: Injector, projectableNodes?: any[][], rootSelectorOrNode?: string | any, ngModule?: NgModuleRef<any>): ComponentRef<C>;
}

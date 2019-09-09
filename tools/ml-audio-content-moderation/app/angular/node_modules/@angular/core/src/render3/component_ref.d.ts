/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ChangeDetectorRef as ViewEngine_ChangeDetectorRef } from '../change_detection/change_detector_ref';
import { InjectionToken } from '../di/injection_token';
import { Injector } from '../di/injector';
import { ComponentFactory as viewEngine_ComponentFactory, ComponentRef as viewEngine_ComponentRef } from '../linker/component_factory';
import { ComponentFactoryResolver as viewEngine_ComponentFactoryResolver } from '../linker/component_factory_resolver';
import { ElementRef as viewEngine_ElementRef } from '../linker/element_ref';
import { NgModuleRef as viewEngine_NgModuleRef } from '../linker/ng_module_factory';
import { RendererFactory2 } from '../render/api';
import { Type } from '../type';
import { ComponentDef } from './interfaces/definition';
import { LViewData, RootContext } from './interfaces/view';
import { ViewRef } from './view_ref';
export declare class ComponentFactoryResolver extends viewEngine_ComponentFactoryResolver {
    resolveComponentFactory<T>(component: Type<T>): viewEngine_ComponentFactory<T>;
}
/**
 * Default {@link RootContext} for all components rendered with {@link renderComponent}.
 */
export declare const ROOT_CONTEXT: InjectionToken<RootContext>;
/**
 * A change detection scheduler token for {@link RootContext}. This token is the default value used
 * for the default `RootContext` found in the {@link ROOT_CONTEXT} token.
 */
export declare const SCHEDULER: InjectionToken<(fn: () => void) => void>;
/**
 * A function used to wrap the `RendererFactory2`.
 * Used in tests to change the `RendererFactory2` into a `DebugRendererFactory2`.
 */
export declare const WRAP_RENDERER_FACTORY2: InjectionToken<(rf: RendererFactory2) => RendererFactory2>;
/**
 * Render3 implementation of {@link viewEngine_ComponentFactory}.
 */
export declare class ComponentFactory<T> extends viewEngine_ComponentFactory<T> {
    private componentDef;
    selector: string;
    componentType: Type<any>;
    ngContentSelectors: string[];
    readonly inputs: {
        propName: string;
        templateName: string;
    }[];
    readonly outputs: {
        propName: string;
        templateName: string;
    }[];
    constructor(componentDef: ComponentDef<any>);
    create(injector: Injector, projectableNodes?: any[][] | undefined, rootSelectorOrNode?: any, ngModule?: viewEngine_NgModuleRef<any> | undefined): viewEngine_ComponentRef<T>;
}
/**
 * Creates a ComponentFactoryResolver and stores it on the injector. Or, if the
 * ComponentFactoryResolver
 * already exists, retrieves the existing ComponentFactoryResolver.
 *
 * @returns The ComponentFactoryResolver instance to use
 */
export declare function injectComponentFactoryResolver(): viewEngine_ComponentFactoryResolver;
/**
 * Represents an instance of a Component created via a {@link ComponentFactory}.
 *
 * `ComponentRef` provides access to the Component Instance as well other objects related to this
 * Component Instance and allows you to destroy the Component Instance via the {@link #destroy}
 * method.
 *
 */
export declare class ComponentRef<T> extends viewEngine_ComponentRef<T> {
    location: viewEngine_ElementRef;
    destroyCbs: (() => void)[] | null;
    injector: Injector;
    instance: T;
    hostView: ViewRef<T>;
    changeDetectorRef: ViewEngine_ChangeDetectorRef;
    componentType: Type<T>;
    constructor(componentType: Type<T>, instance: T, rootView: LViewData, injector: Injector, location: viewEngine_ElementRef);
    destroy(): void;
    onDestroy(callback: () => void): void;
}

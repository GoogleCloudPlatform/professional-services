/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ApplicationRef } from '../application_ref';
import { ChangeDetectorRef } from '../change_detection/change_detection';
import { Injector } from '../di/injector';
import { ComponentFactory } from '../linker/component_factory';
import { NgModuleRef } from '../linker/ng_module_factory';
import { ViewContainerRef } from '../linker/view_container_ref';
import { EmbeddedViewRef, InternalViewRef } from '../linker/view_ref';
import { Renderer as RendererV1 } from '../render/api';
import { Type } from '../type';
import { ElementData, NgModuleDefinition, NodeDef, TemplateData, ViewContainerData, ViewData, ViewDefinitionFactory } from './types';
export declare function createComponentFactory(selector: string, componentType: Type<any>, viewDefFactory: ViewDefinitionFactory, inputs: {
    [propName: string]: string;
} | null, outputs: {
    [propName: string]: string;
}, ngContentSelectors: string[]): ComponentFactory<any>;
export declare function getComponentViewDefinitionFactory(componentFactory: ComponentFactory<any>): ViewDefinitionFactory;
export declare function createViewContainerData(view: ViewData, elDef: NodeDef, elData: ElementData): ViewContainerData;
export declare function createChangeDetectorRef(view: ViewData): ChangeDetectorRef;
export declare class ViewRef_ implements EmbeddedViewRef<any>, InternalViewRef {
    private _viewContainerRef;
    private _appRef;
    constructor(_view: ViewData);
    readonly rootNodes: any[];
    readonly context: any;
    readonly destroyed: boolean;
    markForCheck(): void;
    detach(): void;
    detectChanges(): void;
    checkNoChanges(): void;
    reattach(): void;
    onDestroy(callback: Function): void;
    destroy(): void;
    detachFromAppRef(): void;
    attachToAppRef(appRef: ApplicationRef): void;
    attachToViewContainerRef(vcRef: ViewContainerRef): void;
}
export declare function createTemplateData(view: ViewData, def: NodeDef): TemplateData;
export declare function createInjector(view: ViewData, elDef: NodeDef): Injector;
export declare function nodeValue(view: ViewData, index: number): any;
export declare function createRendererV1(view: ViewData): RendererV1;
export declare function createNgModuleRef(moduleType: Type<any>, parent: Injector, bootstrapComponents: Type<any>[], def: NgModuleDefinition): NgModuleRef<any>;

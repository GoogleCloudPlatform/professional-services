/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ChangeDetectorRef as ViewEngine_ChangeDetectorRef } from '../change_detection/change_detector_ref';
import { ElementRef as ViewEngine_ElementRef } from '../linker/element_ref';
import { TemplateRef as ViewEngine_TemplateRef } from '../linker/template_ref';
import { ViewContainerRef as ViewEngine_ViewContainerRef } from '../linker/view_container_ref';
import { Renderer2 } from '../render/api';
import { TContainerNode, TElementContainerNode, TElementNode, TNode } from './interfaces/node';
import { LViewData } from './interfaces/view';
/**
 * Creates an ElementRef from the most recent node.
 *
 * @returns The ElementRef instance to use
 */
export declare function injectElementRef(ElementRefToken: typeof ViewEngine_ElementRef): ViewEngine_ElementRef;
/**
 * Creates an ElementRef given a node.
 *
 * @param ElementRefToken The ElementRef type
 * @param tNode The node for which you'd like an ElementRef
 * @param view The view to which the node belongs
 * @returns The ElementRef instance to use
 */
export declare function createElementRef(ElementRefToken: typeof ViewEngine_ElementRef, tNode: TNode, view: LViewData): ViewEngine_ElementRef;
/**
 * Creates a TemplateRef given a node.
 *
 * @returns The TemplateRef instance to use
 */
export declare function injectTemplateRef<T>(TemplateRefToken: typeof ViewEngine_TemplateRef, ElementRefToken: typeof ViewEngine_ElementRef): ViewEngine_TemplateRef<T>;
/**
 * Creates a TemplateRef and stores it on the injector.
 *
 * @param TemplateRefToken The TemplateRef type
 * @param ElementRefToken The ElementRef type
 * @param hostTNode The node that is requesting a TemplateRef
 * @param hostView The view to which the node belongs
 * @returns The TemplateRef instance to use
 */
export declare function createTemplateRef<T>(TemplateRefToken: typeof ViewEngine_TemplateRef, ElementRefToken: typeof ViewEngine_ElementRef, hostTNode: TNode, hostView: LViewData): ViewEngine_TemplateRef<T>;
/**
 * Creates a ViewContainerRef and stores it on the injector. Or, if the ViewContainerRef
 * already exists, retrieves the existing ViewContainerRef.
 *
 * @returns The ViewContainerRef instance to use
 */
export declare function injectViewContainerRef(ViewContainerRefToken: typeof ViewEngine_ViewContainerRef, ElementRefToken: typeof ViewEngine_ElementRef): ViewEngine_ViewContainerRef;
/**
 * Creates a ViewContainerRef and stores it on the injector.
 *
 * @param ViewContainerRefToken The ViewContainerRef type
 * @param ElementRefToken The ElementRef type
 * @param hostTNode The node that is requesting a ViewContainerRef
 * @param hostView The view to which the node belongs
 * @returns The ViewContainerRef instance to use
 */
export declare function createContainerRef(ViewContainerRefToken: typeof ViewEngine_ViewContainerRef, ElementRefToken: typeof ViewEngine_ElementRef, hostTNode: TElementNode | TContainerNode | TElementContainerNode, hostView: LViewData): ViewEngine_ViewContainerRef;
/** Returns a ChangeDetectorRef (a.k.a. a ViewRef) */
export declare function injectChangeDetectorRef(): ViewEngine_ChangeDetectorRef;
/**
 * Creates a ViewRef and stores it on the injector as ChangeDetectorRef (public alias).
 *
 * @param hostTNode The node that is requesting a ChangeDetectorRef
 * @param hostView The view to which the node belongs
 * @param context The context for this change detector ref
 * @returns The ChangeDetectorRef to use
 */
export declare function createViewRef(hostTNode: TNode, hostView: LViewData, context: any): ViewEngine_ChangeDetectorRef;
/** Returns a Renderer2 (or throws when application was bootstrapped with Renderer3) */
export declare function injectRenderer2(): Renderer2;

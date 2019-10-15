/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ComponentFactoryResolver, ComponentRef, EmbeddedViewRef, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { BasePortalOutlet, ComponentPortal, Portal, TemplatePortal } from './portal';
/**
 * Directive version of a `TemplatePortal`. Because the directive *is* a TemplatePortal,
 * the directive instance itself can be attached to a host, enabling declarative use of portals.
 */
export declare class CdkPortal extends TemplatePortal {
    constructor(templateRef: TemplateRef<any>, viewContainerRef: ViewContainerRef);
}
/**
 * Possible attached references to the CdkPortalOutlet.
 */
export declare type CdkPortalOutletAttachedRef = ComponentRef<any> | EmbeddedViewRef<any> | null;
/**
 * Directive version of a PortalOutlet. Because the directive *is* a PortalOutlet, portals can be
 * directly attached to it, enabling declarative use.
 *
 * Usage:
 * `<ng-template [cdkPortalOutlet]="greeting"></ng-template>`
 */
export declare class CdkPortalOutlet extends BasePortalOutlet implements OnInit, OnDestroy {
    private _componentFactoryResolver;
    private _viewContainerRef;
    /** Whether the portal component is initialized. */
    private _isInitialized;
    /** Reference to the currently-attached component/view ref. */
    private _attachedRef;
    constructor(_componentFactoryResolver: ComponentFactoryResolver, _viewContainerRef: ViewContainerRef);
    /** Portal associated with the Portal outlet. */
    portal: Portal<any> | null;
    /** Emits when a portal is attached to the outlet. */
    attached: EventEmitter<CdkPortalOutletAttachedRef>;
    /** Component or view reference that is attached to the portal. */
    readonly attachedRef: CdkPortalOutletAttachedRef;
    ngOnInit(): void;
    ngOnDestroy(): void;
    /**
     * Attach the given ComponentPortal to this PortalOutlet using the ComponentFactoryResolver.
     *
     * @param portal Portal to be attached to the portal outlet.
     * @returns Reference to the created component.
     */
    attachComponentPortal<T>(portal: ComponentPortal<T>): ComponentRef<T>;
    /**
     * Attach the given TemplatePortal to this PortlHost as an embedded View.
     * @param portal Portal to be attached.
     * @returns Reference to the created embedded view.
     */
    attachTemplatePortal<C>(portal: TemplatePortal<C>): EmbeddedViewRef<C>;
}
export declare class PortalModule {
}

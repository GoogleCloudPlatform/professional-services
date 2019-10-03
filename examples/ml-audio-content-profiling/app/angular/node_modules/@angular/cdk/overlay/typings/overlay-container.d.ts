/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectionToken, OnDestroy, Optional } from '@angular/core';
/** Container inside which all overlays will render. */
export declare class OverlayContainer implements OnDestroy {
    protected _document: any;
    protected _containerElement: HTMLElement;
    constructor(_document: any);
    ngOnDestroy(): void;
    /**
     * This method returns the overlay container element. It will lazily
     * create the element the first time  it is called to facilitate using
     * the container in non-browser environments.
     * @returns the container element
     */
    getContainerElement(): HTMLElement;
    /**
     * Create the overlay container element, which is simply a div
     * with the 'cdk-overlay-container' class on the document body.
     */
    protected _createContainer(): void;
}
/** @docs-private @deprecated @breaking-change 8.0.0 */
export declare function OVERLAY_CONTAINER_PROVIDER_FACTORY(parentContainer: OverlayContainer, _document: any): OverlayContainer;
/** @docs-private @deprecated @breaking-change 8.0.0 */
export declare const OVERLAY_CONTAINER_PROVIDER: {
    provide: typeof OverlayContainer;
    deps: (Optional[] | InjectionToken<any>)[];
    useFactory: typeof OVERLAY_CONTAINER_PROVIDER_FACTORY;
};

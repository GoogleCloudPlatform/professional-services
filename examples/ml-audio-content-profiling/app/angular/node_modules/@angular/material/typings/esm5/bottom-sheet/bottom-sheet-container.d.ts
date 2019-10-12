/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ComponentRef, EmbeddedViewRef, OnDestroy, ElementRef, ChangeDetectorRef, EventEmitter } from '@angular/core';
import { AnimationEvent } from '@angular/animations';
import { BasePortalOutlet, ComponentPortal, TemplatePortal, CdkPortalOutlet } from '@angular/cdk/portal';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatBottomSheetConfig } from './bottom-sheet-config';
import { FocusTrapFactory } from '@angular/cdk/a11y';
/**
 * Internal component that wraps user-provided bottom sheet content.
 * @docs-private
 */
export declare class MatBottomSheetContainer extends BasePortalOutlet implements OnDestroy {
    private _elementRef;
    private _changeDetectorRef;
    private _focusTrapFactory;
    /** The bottom sheet configuration. */
    bottomSheetConfig: MatBottomSheetConfig;
    private _breakpointSubscription;
    /** The portal outlet inside of this container into which the content will be loaded. */
    _portalOutlet: CdkPortalOutlet;
    /** The state of the bottom sheet animations. */
    _animationState: 'void' | 'visible' | 'hidden';
    /** Emits whenever the state of the animation changes. */
    _animationStateChanged: EventEmitter<AnimationEvent>;
    /** The class that traps and manages focus within the bottom sheet. */
    private _focusTrap;
    /** Element that was focused before the bottom sheet was opened. */
    private _elementFocusedBeforeOpened;
    /** Server-side rendering-compatible reference to the global document object. */
    private _document;
    /** Whether the component has been destroyed. */
    private _destroyed;
    constructor(_elementRef: ElementRef<HTMLElement>, _changeDetectorRef: ChangeDetectorRef, _focusTrapFactory: FocusTrapFactory, breakpointObserver: BreakpointObserver, document: any, 
    /** The bottom sheet configuration. */
    bottomSheetConfig: MatBottomSheetConfig);
    /** Attach a component portal as content to this bottom sheet container. */
    attachComponentPortal<T>(portal: ComponentPortal<T>): ComponentRef<T>;
    /** Attach a template portal as content to this bottom sheet container. */
    attachTemplatePortal<C>(portal: TemplatePortal<C>): EmbeddedViewRef<C>;
    /** Begin animation of bottom sheet entrance into view. */
    enter(): void;
    /** Begin animation of the bottom sheet exiting from view. */
    exit(): void;
    ngOnDestroy(): void;
    _onAnimationDone(event: AnimationEvent): void;
    _onAnimationStart(event: AnimationEvent): void;
    private _toggleClass;
    private _validatePortalAttached;
    private _setPanelClass;
    /** Moves the focus inside the focus trap. */
    private _trapFocus;
    /** Restores focus to the element that was focused before the bottom sheet was opened. */
    private _restoreFocus;
    /** Saves a reference to the element that was focused before the bottom sheet was opened. */
    private _savePreviouslyFocusedElement;
}

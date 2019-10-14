/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ComponentRef, ElementRef, EmbeddedViewRef, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { AnimationEvent } from '@angular/animations';
import { BasePortalOutlet, ComponentPortal, CdkPortalOutlet, TemplatePortal } from '@angular/cdk/portal';
import { FocusTrapFactory } from '@angular/cdk/a11y';
import { MatDialogConfig } from './dialog-config';
/**
 * Throws an exception for the case when a ComponentPortal is
 * attached to a DomPortalOutlet without an origin.
 * @docs-private
 */
export declare function throwMatDialogContentAlreadyAttachedError(): void;
/**
 * Internal component that wraps user-provided dialog content.
 * Animation is based on https://material.io/guidelines/motion/choreography.html.
 * @docs-private
 */
export declare class MatDialogContainer extends BasePortalOutlet {
    private _elementRef;
    private _focusTrapFactory;
    private _changeDetectorRef;
    private _document;
    /** The dialog configuration. */
    _config: MatDialogConfig;
    /** The portal outlet inside of this container into which the dialog content will be loaded. */
    _portalOutlet: CdkPortalOutlet;
    /** The class that traps and manages focus within the dialog. */
    private _focusTrap;
    /** Element that was focused before the dialog was opened. Save this to restore upon close. */
    private _elementFocusedBeforeDialogWasOpened;
    /** State of the dialog animation. */
    _state: 'void' | 'enter' | 'exit';
    /** Emits when an animation state changes. */
    _animationStateChanged: EventEmitter<AnimationEvent>;
    /** ID of the element that should be considered as the dialog's label. */
    _ariaLabelledBy: string | null;
    /** ID for the container DOM element. */
    _id: string;
    constructor(_elementRef: ElementRef, _focusTrapFactory: FocusTrapFactory, _changeDetectorRef: ChangeDetectorRef, _document: any, 
    /** The dialog configuration. */
    _config: MatDialogConfig);
    /**
     * Attach a ComponentPortal as content to this dialog container.
     * @param portal Portal to be attached as the dialog content.
     */
    attachComponentPortal<T>(portal: ComponentPortal<T>): ComponentRef<T>;
    /**
     * Attach a TemplatePortal as content to this dialog container.
     * @param portal Portal to be attached as the dialog content.
     */
    attachTemplatePortal<C>(portal: TemplatePortal<C>): EmbeddedViewRef<C>;
    /** Moves the focus inside the focus trap. */
    private _trapFocus;
    /** Restores focus to the element that was focused before the dialog opened. */
    private _restoreFocus;
    /** Saves a reference to the element that was focused before the dialog was opened. */
    private _savePreviouslyFocusedElement;
    /** Callback, invoked whenever an animation on the host completes. */
    _onAnimationDone(event: AnimationEvent): void;
    /** Callback, invoked when an animation on the host starts. */
    _onAnimationStart(event: AnimationEvent): void;
    /** Starts the dialog exit animation. */
    _startExitAnimation(): void;
}

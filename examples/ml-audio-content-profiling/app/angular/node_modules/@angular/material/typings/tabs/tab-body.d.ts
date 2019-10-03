/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ChangeDetectorRef, EventEmitter, OnDestroy, OnInit, ElementRef, ComponentFactoryResolver, ViewContainerRef } from '@angular/core';
import { AnimationEvent } from '@angular/animations';
import { TemplatePortal, CdkPortalOutlet, PortalHostDirective } from '@angular/cdk/portal';
import { Directionality, Direction } from '@angular/cdk/bidi';
import { Subject } from 'rxjs';
/**
 * These position states are used internally as animation states for the tab body. Setting the
 * position state to left, right, or center will transition the tab body from its current
 * position to its respective state. If there is not current position (void, in the case of a new
 * tab body), then there will be no transition animation to its state.
 *
 * In the case of a new tab body that should immediately be centered with an animating transition,
 * then left-origin-center or right-origin-center can be used, which will use left or right as its
 * psuedo-prior state.
 */
export declare type MatTabBodyPositionState = 'left' | 'center' | 'right' | 'left-origin-center' | 'right-origin-center';
/**
 * The origin state is an internally used state that is set on a new tab body indicating if it
 * began to the left or right of the prior selected index. For example, if the selected index was
 * set to 1, and a new tab is created and selected at index 2, then the tab body would have an
 * origin of right because its index was greater than the prior selected index.
 */
export declare type MatTabBodyOriginState = 'left' | 'right';
/**
 * The portal host directive for the contents of the tab.
 * @docs-private
 */
export declare class MatTabBodyPortal extends CdkPortalOutlet implements OnInit, OnDestroy {
    private _host;
    /** Subscription to events for when the tab body begins centering. */
    private _centeringSub;
    /** Subscription to events for when the tab body finishes leaving from center position. */
    private _leavingSub;
    constructor(componentFactoryResolver: ComponentFactoryResolver, viewContainerRef: ViewContainerRef, _host: MatTabBody);
    /** Set initial visibility or set up subscription for changing visibility. */
    ngOnInit(): void;
    /** Clean up centering subscription. */
    ngOnDestroy(): void;
}
/**
 * Wrapper for the contents of a tab.
 * @docs-private
 */
export declare class MatTabBody implements OnInit, OnDestroy {
    private _elementRef;
    private _dir;
    /** Current position of the tab-body in the tab-group. Zero means that the tab is visible. */
    private _positionIndex;
    /** Subscription to the directionality change observable. */
    private _dirChangeSubscription;
    /** Tab body position state. Used by the animation trigger for the current state. */
    _position: MatTabBodyPositionState;
    /** Emits when an animation on the tab is complete. */
    _translateTabComplete: Subject<AnimationEvent>;
    /** Event emitted when the tab begins to animate towards the center as the active tab. */
    readonly _onCentering: EventEmitter<number>;
    /** Event emitted before the centering of the tab begins. */
    readonly _beforeCentering: EventEmitter<boolean>;
    /** Event emitted before the centering of the tab begins. */
    readonly _afterLeavingCenter: EventEmitter<boolean>;
    /** Event emitted when the tab completes its animation towards the center. */
    readonly _onCentered: EventEmitter<void>;
    /** The portal host inside of this container into which the tab body content will be loaded. */
    _portalHost: PortalHostDirective;
    /** The tab body content to display. */
    _content: TemplatePortal;
    /** Position that will be used when the tab is immediately becoming visible after creation. */
    origin: number;
    /** Duration for the tab's animation. */
    animationDuration: string;
    /** The shifted index position of the tab body, where zero represents the active center tab. */
    position: number;
    constructor(_elementRef: ElementRef<HTMLElement>, _dir: Directionality, 
    /**
     * @breaking-change 8.0.0 changeDetectorRef to be made required.
     */
    changeDetectorRef?: ChangeDetectorRef);
    /**
     * After initialized, check if the content is centered and has an origin. If so, set the
     * special position states that transition the tab from the left or right before centering.
     */
    ngOnInit(): void;
    ngOnDestroy(): void;
    _onTranslateTabStarted(event: AnimationEvent): void;
    /** The text direction of the containing app. */
    _getLayoutDirection(): Direction;
    /** Whether the provided position state is considered center, regardless of origin. */
    _isCenterPosition(position: MatTabBodyPositionState | string): boolean;
    /** Computes the position state that will be used for the tab-body animation trigger. */
    private _computePositionAnimationState;
    /**
     * Computes the position state based on the specified origin position. This is used if the
     * tab is becoming visible immediately after creation.
     */
    private _computePositionFromOrigin;
}

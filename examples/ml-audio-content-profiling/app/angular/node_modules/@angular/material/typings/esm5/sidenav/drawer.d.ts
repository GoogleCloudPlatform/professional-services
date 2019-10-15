/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AnimationEvent } from '@angular/animations';
import { FocusMonitor, FocusOrigin, FocusTrapFactory } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import { Platform } from '@angular/cdk/platform';
import { CdkScrollable, ScrollDispatcher, ViewportRuler } from '@angular/cdk/scrolling';
import { AfterContentChecked, AfterContentInit, ChangeDetectorRef, DoCheck, ElementRef, EventEmitter, InjectionToken, NgZone, OnDestroy, QueryList } from '@angular/core';
import { Observable, Subject } from 'rxjs';
/**
 * Throws an exception when two MatDrawer are matching the same position.
 * @docs-private
 */
export declare function throwMatDuplicatedDrawerError(position: string): void;
/** Result of the toggle promise that indicates the state of the drawer. */
export declare type MatDrawerToggleResult = 'open' | 'close';
/** Configures whether drawers should use auto sizing by default. */
export declare const MAT_DRAWER_DEFAULT_AUTOSIZE: InjectionToken<boolean>;
/** @docs-private */
export declare function MAT_DRAWER_DEFAULT_AUTOSIZE_FACTORY(): boolean;
export declare class MatDrawerContent extends CdkScrollable implements AfterContentInit {
    private _changeDetectorRef;
    _container: MatDrawerContainer;
    constructor(_changeDetectorRef: ChangeDetectorRef, _container: MatDrawerContainer, elementRef: ElementRef<HTMLElement>, scrollDispatcher: ScrollDispatcher, ngZone: NgZone);
    ngAfterContentInit(): void;
}
/**
 * This component corresponds to a drawer that can be opened on the drawer container.
 */
export declare class MatDrawer implements AfterContentInit, AfterContentChecked, OnDestroy {
    private _elementRef;
    private _focusTrapFactory;
    private _focusMonitor;
    private _platform;
    private _ngZone;
    private _doc;
    private _focusTrap;
    private _elementFocusedBeforeDrawerWasOpened;
    /** Whether the drawer is initialized. Used for disabling the initial animation. */
    private _enableAnimations;
    /** The side that the drawer is attached to. */
    position: 'start' | 'end';
    private _position;
    /** Mode of the drawer; one of 'over', 'push' or 'side'. */
    mode: 'over' | 'push' | 'side';
    private _mode;
    /** Whether the drawer can be closed with the escape key or by clicking on the backdrop. */
    disableClose: boolean;
    private _disableClose;
    /** Whether the drawer should focus the first focusable element automatically when opened. */
    autoFocus: boolean;
    private _autoFocus;
    /** How the sidenav was opened (keypress, mouse click etc.) */
    private _openedVia;
    /** Emits whenever the drawer has started animating. */
    _animationStarted: Subject<AnimationEvent>;
    /** Emits whenever the drawer is done animating. */
    _animationEnd: Subject<AnimationEvent>;
    /** Current state of the sidenav animation. */
    _animationState: 'open-instant' | 'open' | 'void';
    /** Event emitted when the drawer open state is changed. */
    readonly openedChange: EventEmitter<boolean>;
    /** Event emitted when the drawer has been opened. */
    readonly _openedStream: Observable<void>;
    /** Event emitted when the drawer has started opening. */
    readonly openedStart: Observable<void>;
    /** Event emitted when the drawer has been closed. */
    readonly _closedStream: Observable<void>;
    /** Event emitted when the drawer has started closing. */
    readonly closedStart: Observable<void>;
    /** Emits when the component is destroyed. */
    private readonly _destroyed;
    /** Event emitted when the drawer's position changes. */
    onPositionChanged: EventEmitter<void>;
    /**
     * An observable that emits when the drawer mode changes. This is used by the drawer container to
     * to know when to when the mode changes so it can adapt the margins on the content.
     */
    readonly _modeChanged: Subject<{}>;
    readonly _isFocusTrapEnabled: boolean;
    constructor(_elementRef: ElementRef<HTMLElement>, _focusTrapFactory: FocusTrapFactory, _focusMonitor: FocusMonitor, _platform: Platform, _ngZone: NgZone, _doc: any);
    /** Traps focus inside the drawer. */
    private _trapFocus;
    /**
     * If focus is currently inside the drawer, restores it to where it was before the drawer
     * opened.
     */
    private _restoreFocus;
    ngAfterContentInit(): void;
    ngAfterContentChecked(): void;
    ngOnDestroy(): void;
    /**
     * Whether the drawer is opened. We overload this because we trigger an event when it
     * starts or end.
     */
    opened: boolean;
    private _opened;
    /**
     * Open the drawer.
     * @param openedVia Whether the drawer was opened by a key press, mouse click or programmatically.
     * Used for focus management after the sidenav is closed.
     */
    open(openedVia?: FocusOrigin): Promise<MatDrawerToggleResult>;
    /** Close the drawer. */
    close(): Promise<MatDrawerToggleResult>;
    /**
     * Toggle this drawer.
     * @param isOpen Whether the drawer should be open.
     * @param openedVia Whether the drawer was opened by a key press, mouse click or programmatically.
     * Used for focus management after the sidenav is closed.
     */
    toggle(isOpen?: boolean, openedVia?: FocusOrigin): Promise<MatDrawerToggleResult>;
    readonly _width: number;
}
/**
 * `<mat-drawer-container>` component.
 *
 * This is the parent component to one or two `<mat-drawer>`s that validates the state internally
 * and coordinates the backdrop and content styling.
 */
export declare class MatDrawerContainer implements AfterContentInit, DoCheck, OnDestroy {
    private _dir;
    private _element;
    private _ngZone;
    private _changeDetectorRef;
    private _animationMode?;
    _drawers: QueryList<MatDrawer>;
    _content: MatDrawerContent;
    _userContent: MatDrawerContent;
    /** The drawer child with the `start` position. */
    readonly start: MatDrawer | null;
    /** The drawer child with the `end` position. */
    readonly end: MatDrawer | null;
    /**
     * Whether to automatically resize the container whenever
     * the size of any of its drawers changes.
     *
     * **Use at your own risk!** Enabling this option can cause layout thrashing by measuring
     * the drawers on every change detection cycle. Can be configured globally via the
     * `MAT_DRAWER_DEFAULT_AUTOSIZE` token.
     */
    autosize: boolean;
    private _autosize;
    /**
     * Whether the drawer container should have a backdrop while one of the sidenavs is open.
     * If explicitly set to `true`, the backdrop will be enabled for drawers in the `side`
     * mode as well.
     */
    hasBackdrop: any;
    _backdropOverride: boolean | null;
    /** Event emitted when the drawer backdrop is clicked. */
    readonly backdropClick: EventEmitter<void>;
    /** The drawer at the start/end position, independent of direction. */
    private _start;
    private _end;
    /**
     * The drawer at the left/right. When direction changes, these will change as well.
     * They're used as aliases for the above to set the left/right style properly.
     * In LTR, _left == _start and _right == _end.
     * In RTL, _left == _end and _right == _start.
     */
    private _left;
    private _right;
    /** Emits when the component is destroyed. */
    private readonly _destroyed;
    /** Emits on every ngDoCheck. Used for debouncing reflows. */
    private readonly _doCheckSubject;
    /**
     * Margins to be applied to the content. These are used to push / shrink the drawer content when a
     * drawer is open. We use margin rather than transform even for push mode because transform breaks
     * fixed position elements inside of the transformed element.
     */
    _contentMargins: {
        left: number | null;
        right: number | null;
    };
    readonly _contentMarginChanges: Subject<{
        left: number | null;
        right: number | null;
    }>;
    /** Reference to the CdkScrollable instance that wraps the scrollable content. */
    readonly scrollable: CdkScrollable;
    constructor(_dir: Directionality, _element: ElementRef<HTMLElement>, _ngZone: NgZone, _changeDetectorRef: ChangeDetectorRef, defaultAutosize?: boolean, _animationMode?: string | undefined, 
    /**
     * @deprecated viewportRuler to become a required parameter.
     * @breaking-change 8.0.0
     */
    viewportRuler?: ViewportRuler);
    ngAfterContentInit(): void;
    ngOnDestroy(): void;
    /** Calls `open` of both start and end drawers */
    open(): void;
    /** Calls `close` of both start and end drawers */
    close(): void;
    ngDoCheck(): void;
    /**
     * Subscribes to drawer events in order to set a class on the main container element when the
     * drawer is open and the backdrop is visible. This ensures any overflow on the container element
     * is properly hidden.
     */
    private _watchDrawerToggle;
    /**
     * Subscribes to drawer onPositionChanged event in order to
     * re-validate drawers when the position changes.
     */
    private _watchDrawerPosition;
    /** Subscribes to changes in drawer mode so we can run change detection. */
    private _watchDrawerMode;
    /** Toggles the 'mat-drawer-opened' class on the main 'mat-drawer-container' element. */
    private _setContainerClass;
    /** Validate the state of the drawer children components. */
    private _validateDrawers;
    /** Whether the container is being pushed to the side by one of the drawers. */
    private _isPushed;
    _onBackdropClicked(): void;
    _closeModalDrawer(): void;
    _isShowingBackdrop(): boolean;
    private _canHaveBackdrop;
    private _isDrawerOpen;
    /**
     * Recalculates and updates the inline styles for the content. Note that this should be used
     * sparingly, because it causes a reflow.
     */
    private _updateContentMargins;
}

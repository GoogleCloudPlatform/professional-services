/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Overlay } from '@angular/cdk/overlay';
import { ComponentType } from '@angular/cdk/portal';
import { EmbeddedViewRef, InjectionToken, Injector, TemplateRef, OnDestroy } from '@angular/core';
import { SimpleSnackBar } from './simple-snack-bar';
import { MatSnackBarConfig } from './snack-bar-config';
import { MatSnackBarRef } from './snack-bar-ref';
/** Injection token that can be used to specify default snack bar. */
export declare const MAT_SNACK_BAR_DEFAULT_OPTIONS: InjectionToken<MatSnackBarConfig<any>>;
/** @docs-private */
export declare function MAT_SNACK_BAR_DEFAULT_OPTIONS_FACTORY(): MatSnackBarConfig;
/**
 * Service to dispatch Material Design snack bar messages.
 */
export declare class MatSnackBar implements OnDestroy {
    private _overlay;
    private _live;
    private _injector;
    private _breakpointObserver;
    private _parentSnackBar;
    private _defaultConfig;
    /**
     * Reference to the current snack bar in the view *at this level* (in the Angular injector tree).
     * If there is a parent snack-bar service, all operations should delegate to that parent
     * via `_openedSnackBarRef`.
     */
    private _snackBarRefAtThisLevel;
    /** Reference to the currently opened snackbar at *any* level. */
    _openedSnackBarRef: MatSnackBarRef<any> | null;
    constructor(_overlay: Overlay, _live: LiveAnnouncer, _injector: Injector, _breakpointObserver: BreakpointObserver, _parentSnackBar: MatSnackBar, _defaultConfig: MatSnackBarConfig);
    /**
     * Creates and dispatches a snack bar with a custom component for the content, removing any
     * currently opened snack bars.
     *
     * @param component Component to be instantiated.
     * @param config Extra configuration for the snack bar.
     */
    openFromComponent<T>(component: ComponentType<T>, config?: MatSnackBarConfig): MatSnackBarRef<T>;
    /**
     * Creates and dispatches a snack bar with a custom template for the content, removing any
     * currently opened snack bars.
     *
     * @param template Template to be instantiated.
     * @param config Extra configuration for the snack bar.
     */
    openFromTemplate(template: TemplateRef<any>, config?: MatSnackBarConfig): MatSnackBarRef<EmbeddedViewRef<any>>;
    /**
     * Opens a snackbar with a message and an optional action.
     * @param message The message to show in the snackbar.
     * @param action The label for the snackbar action.
     * @param config Additional configuration options for the snackbar.
     */
    open(message: string, action?: string, config?: MatSnackBarConfig): MatSnackBarRef<SimpleSnackBar>;
    /**
     * Dismisses the currently-visible snack bar.
     */
    dismiss(): void;
    ngOnDestroy(): void;
    /**
     * Attaches the snack bar container component to the overlay.
     */
    private _attachSnackBarContainer;
    /**
     * Places a new component or a template as the content of the snack bar container.
     */
    private _attach;
    /** Animates the old snack bar out and the new one in. */
    private _animateSnackBar;
    /**
     * Creates a new overlay and places it in the correct location.
     * @param config The user-specified snack bar config.
     */
    private _createOverlay;
    /**
     * Creates an injector to be used inside of a snack bar component.
     * @param config Config that was used to create the snack bar.
     * @param snackBarRef Reference to the snack bar.
     */
    private _createInjector;
}

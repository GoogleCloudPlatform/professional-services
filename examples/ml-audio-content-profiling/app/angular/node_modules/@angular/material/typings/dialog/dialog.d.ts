/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Overlay, OverlayContainer, ScrollStrategy } from '@angular/cdk/overlay';
import { ComponentType } from '@angular/cdk/portal';
import { Location } from '@angular/common';
import { InjectionToken, Injector, OnDestroy, TemplateRef } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { MatDialogConfig } from './dialog-config';
import { MatDialogRef } from './dialog-ref';
/** Injection token that can be used to access the data that was passed in to a dialog. */
export declare const MAT_DIALOG_DATA: InjectionToken<any>;
/** Injection token that can be used to specify default dialog options. */
export declare const MAT_DIALOG_DEFAULT_OPTIONS: InjectionToken<MatDialogConfig<any>>;
/** Injection token that determines the scroll handling while the dialog is open. */
export declare const MAT_DIALOG_SCROLL_STRATEGY: InjectionToken<() => ScrollStrategy>;
/** @docs-private */
export declare function MAT_DIALOG_SCROLL_STRATEGY_FACTORY(overlay: Overlay): () => ScrollStrategy;
/** @docs-private */
export declare function MAT_DIALOG_SCROLL_STRATEGY_PROVIDER_FACTORY(overlay: Overlay): () => ScrollStrategy;
/** @docs-private */
export declare const MAT_DIALOG_SCROLL_STRATEGY_PROVIDER: {
    provide: InjectionToken<() => ScrollStrategy>;
    deps: (typeof Overlay)[];
    useFactory: typeof MAT_DIALOG_SCROLL_STRATEGY_PROVIDER_FACTORY;
};
/**
 * Service to open Material Design modal dialogs.
 */
export declare class MatDialog implements OnDestroy {
    private _overlay;
    private _injector;
    private _location;
    private _defaultOptions;
    private _parentDialog;
    private _overlayContainer;
    private _openDialogsAtThisLevel;
    private readonly _afterAllClosedAtThisLevel;
    private readonly _afterOpenedAtThisLevel;
    private _ariaHiddenElements;
    private _scrollStrategy;
    /** Keeps track of the currently-open dialogs. */
    readonly openDialogs: MatDialogRef<any>[];
    /** Stream that emits when a dialog has been opened. */
    readonly afterOpened: Subject<MatDialogRef<any>>;
    /**
     * Stream that emits when a dialog has been opened.
     * @deprecated Use `afterOpened` instead.
     * @breaking-change 8.0.0
     */
    readonly afterOpen: Subject<MatDialogRef<any>>;
    readonly _afterAllClosed: Subject<void>;
    /**
     * Stream that emits when all open dialog have finished closing.
     * Will emit on subscribe if there are no open dialogs to begin with.
     */
    readonly afterAllClosed: Observable<void>;
    constructor(_overlay: Overlay, _injector: Injector, _location: Location, _defaultOptions: MatDialogConfig, scrollStrategy: any, _parentDialog: MatDialog, _overlayContainer: OverlayContainer);
    /**
     * Opens a modal dialog containing the given component.
     * @param componentOrTemplateRef Type of the component to load into the dialog,
     *     or a TemplateRef to instantiate as the dialog content.
     * @param config Extra configuration options.
     * @returns Reference to the newly-opened dialog.
     */
    open<T, D = any, R = any>(componentOrTemplateRef: ComponentType<T> | TemplateRef<T>, config?: MatDialogConfig<D>): MatDialogRef<T, R>;
    /**
     * Closes all of the currently-open dialogs.
     */
    closeAll(): void;
    /**
     * Finds an open dialog by its id.
     * @param id ID to use when looking up the dialog.
     */
    getDialogById(id: string): MatDialogRef<any> | undefined;
    ngOnDestroy(): void;
    /**
     * Creates the overlay into which the dialog will be loaded.
     * @param config The dialog configuration.
     * @returns A promise resolving to the OverlayRef for the created overlay.
     */
    private _createOverlay;
    /**
     * Creates an overlay config from a dialog config.
     * @param dialogConfig The dialog configuration.
     * @returns The overlay configuration.
     */
    private _getOverlayConfig;
    /**
     * Attaches an MatDialogContainer to a dialog's already-created overlay.
     * @param overlay Reference to the dialog's underlying overlay.
     * @param config The dialog configuration.
     * @returns A promise resolving to a ComponentRef for the attached container.
     */
    private _attachDialogContainer;
    /**
     * Attaches the user-provided component to the already-created MatDialogContainer.
     * @param componentOrTemplateRef The type of component being loaded into the dialog,
     *     or a TemplateRef to instantiate as the content.
     * @param dialogContainer Reference to the wrapping MatDialogContainer.
     * @param overlayRef Reference to the overlay in which the dialog resides.
     * @param config The dialog configuration.
     * @returns A promise resolving to the MatDialogRef that should be returned to the user.
     */
    private _attachDialogContent;
    /**
     * Creates a custom injector to be used inside the dialog. This allows a component loaded inside
     * of a dialog to close itself and, optionally, to return a value.
     * @param config Config object that is used to construct the dialog.
     * @param dialogRef Reference to the dialog.
     * @param container Dialog container element that wraps all of the contents.
     * @returns The custom injector that can be used inside the dialog.
     */
    private _createInjector;
    /**
     * Removes a dialog from the array of open dialogs.
     * @param dialogRef Dialog to be removed.
     */
    private _removeOpenDialog;
    /**
     * Hides all of the content that isn't an overlay from assistive technology.
     */
    private _hideNonDialogContentFromAssistiveTechnology;
    /** Closes all of the dialogs in an array. */
    private _closeDialogs;
}

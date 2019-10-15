/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { OverlayRef } from '@angular/cdk/overlay';
import { Location } from '@angular/common';
import { Observable } from 'rxjs';
import { DialogPosition } from './dialog-config';
import { MatDialogContainer } from './dialog-container';
/**
 * Reference to a dialog opened via the MatDialog service.
 */
export declare class MatDialogRef<T, R = any> {
    private _overlayRef;
    _containerInstance: MatDialogContainer;
    readonly id: string;
    /** The instance of component opened into the dialog. */
    componentInstance: T;
    /** Whether the user is allowed to close the dialog. */
    disableClose: boolean | undefined;
    /** Subject for notifying the user that the dialog has finished opening. */
    private readonly _afterOpened;
    /** Subject for notifying the user that the dialog has finished closing. */
    private readonly _afterClosed;
    /** Subject for notifying the user that the dialog has started closing. */
    private readonly _beforeClosed;
    /** Result to be passed to afterClosed. */
    private _result;
    constructor(_overlayRef: OverlayRef, _containerInstance: MatDialogContainer, _location?: Location, id?: string);
    /**
     * Close the dialog.
     * @param dialogResult Optional result to return to the dialog opener.
     */
    close(dialogResult?: R): void;
    /**
     * Gets an observable that is notified when the dialog is finished opening.
     */
    afterOpened(): Observable<void>;
    /**
     * Gets an observable that is notified when the dialog is finished closing.
     */
    afterClosed(): Observable<R | undefined>;
    /**
     * Gets an observable that is notified when the dialog has started closing.
     */
    beforeClosed(): Observable<R | undefined>;
    /**
     * Gets an observable that emits when the overlay's backdrop has been clicked.
     */
    backdropClick(): Observable<MouseEvent>;
    /**
     * Gets an observable that emits when keydown events are targeted on the overlay.
     */
    keydownEvents(): Observable<KeyboardEvent>;
    /**
     * Updates the dialog's position.
     * @param position New dialog position.
     */
    updatePosition(position?: DialogPosition): this;
    /**
     * Updates the dialog's width and height.
     * @param width New width of the dialog.
     * @param height New height of the dialog.
     */
    updateSize(width?: string, height?: string): this;
    /** Add a CSS class or an array of classes to the overlay pane. */
    addPanelClass(classes: string | string[]): this;
    /** Remove a CSS class or an array of classes from the overlay pane. */
    removePanelClass(classes: string | string[]): this;
    /**
     * Gets an observable that is notified when the dialog is finished opening.
     * @deprecated Use `afterOpened` instead.
     * @breaking-change 8.0.0
     */
    afterOpen(): Observable<void>;
    /**
     * Gets an observable that is notified when the dialog has started closing.
     * @deprecated Use `beforeClosed` instead.
     * @breaking-change 8.0.0
     */
    beforeClose(): Observable<R | undefined>;
    /** Fetches the position strategy object from the overlay ref. */
    private _getPositionStrategy;
}

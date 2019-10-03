/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { OverlayRef } from '@angular/cdk/overlay';
import { Observable } from 'rxjs';
import { MatSnackBarContainer } from './snack-bar-container';
/** Event that is emitted when a snack bar is dismissed. */
export interface MatSnackBarDismiss {
    /** Whether the snack bar was dismissed using the action button. */
    dismissedByAction: boolean;
}
/**
 * Reference to a snack bar dispatched from the snack bar service.
 */
export declare class MatSnackBarRef<T> {
    private _overlayRef;
    /** The instance of the component making up the content of the snack bar. */
    instance: T;
    /**
     * The instance of the component making up the content of the snack bar.
     * @docs-private
     */
    containerInstance: MatSnackBarContainer;
    /** Subject for notifying the user that the snack bar has been dismissed. */
    private readonly _afterDismissed;
    /** Subject for notifying the user that the snack bar has opened and appeared. */
    private readonly _afterOpened;
    /** Subject for notifying the user that the snack bar action was called. */
    private readonly _onAction;
    /**
     * Timeout ID for the duration setTimeout call. Used to clear the timeout if the snackbar is
     * dismissed before the duration passes.
     */
    private _durationTimeoutId;
    /** Whether the snack bar was dismissed using the action button. */
    private _dismissedByAction;
    constructor(containerInstance: MatSnackBarContainer, _overlayRef: OverlayRef);
    /** Dismisses the snack bar. */
    dismiss(): void;
    /** Marks the snackbar action clicked. */
    dismissWithAction(): void;
    /**
     * Marks the snackbar action clicked.
     * @deprecated Use `dismissWithAction` instead.
     * @breaking-change 8.0.0
     */
    closeWithAction(): void;
    /** Dismisses the snack bar after some duration */
    _dismissAfter(duration: number): void;
    /** Marks the snackbar as opened */
    _open(): void;
    /** Cleans up the DOM after closing. */
    private _finishDismiss;
    /** Gets an observable that is notified when the snack bar is finished closing. */
    afterDismissed(): Observable<MatSnackBarDismiss>;
    /** Gets an observable that is notified when the snack bar has opened and appeared. */
    afterOpened(): Observable<void>;
    /** Gets an observable that is notified when the snack bar action is called. */
    onAction(): Observable<void>;
}

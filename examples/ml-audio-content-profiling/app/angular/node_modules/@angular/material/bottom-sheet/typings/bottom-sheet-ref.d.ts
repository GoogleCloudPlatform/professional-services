/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Location } from '@angular/common';
import { OverlayRef } from '@angular/cdk/overlay';
import { Observable } from 'rxjs';
import { MatBottomSheetContainer } from './bottom-sheet-container';
/**
 * Reference to a bottom sheet dispatched from the bottom sheet service.
 */
export declare class MatBottomSheetRef<T = any, R = any> {
    private _overlayRef;
    /** Instance of the component making up the content of the bottom sheet. */
    instance: T;
    /**
     * Instance of the component into which the bottom sheet content is projected.
     * @docs-private
     */
    containerInstance: MatBottomSheetContainer;
    /** Whether the user is allowed to close the bottom sheet. */
    disableClose: boolean | undefined;
    /** Subject for notifying the user that the bottom sheet has been dismissed. */
    private readonly _afterDismissed;
    /** Subject for notifying the user that the bottom sheet has opened and appeared. */
    private readonly _afterOpened;
    /** Result to be passed down to the `afterDismissed` stream. */
    private _result;
    constructor(containerInstance: MatBottomSheetContainer, _overlayRef: OverlayRef, _location?: Location);
    /**
     * Dismisses the bottom sheet.
     * @param result Data to be passed back to the bottom sheet opener.
     */
    dismiss(result?: R): void;
    /** Gets an observable that is notified when the bottom sheet is finished closing. */
    afterDismissed(): Observable<R | undefined>;
    /** Gets an observable that is notified when the bottom sheet has opened and appeared. */
    afterOpened(): Observable<void>;
    /**
     * Gets an observable that emits when the overlay's backdrop has been clicked.
     */
    backdropClick(): Observable<MouseEvent>;
    /**
     * Gets an observable that emits when keydown events are targeted on the overlay.
     */
    keydownEvents(): Observable<KeyboardEvent>;
}

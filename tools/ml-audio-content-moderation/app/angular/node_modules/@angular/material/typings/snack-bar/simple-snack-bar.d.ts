/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { MatSnackBarRef } from './snack-bar-ref';
/**
 * A component used to open as the default snack bar, matching material spec.
 * This should only be used internally by the snack bar service.
 */
export declare class SimpleSnackBar {
    snackBarRef: MatSnackBarRef<SimpleSnackBar>;
    /** Data that was injected into the snack bar. */
    data: {
        message: string;
        action: string;
    };
    constructor(snackBarRef: MatSnackBarRef<SimpleSnackBar>, data: any);
    /** Performs the action on the snack bar. */
    action(): void;
    /** If the action button should be shown. */
    readonly hasAction: boolean;
}

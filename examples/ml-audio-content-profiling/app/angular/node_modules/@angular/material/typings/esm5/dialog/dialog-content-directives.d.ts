/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { OnChanges, OnInit, SimpleChanges, ElementRef } from '@angular/core';
import { MatDialog } from './dialog';
import { MatDialogRef } from './dialog-ref';
/**
 * Button that will close the current dialog.
 */
export declare class MatDialogClose implements OnInit, OnChanges {
    dialogRef: MatDialogRef<any>;
    private _elementRef;
    private _dialog;
    /** Screenreader label for the button. */
    ariaLabel: string;
    /** Dialog close input. */
    dialogResult: any;
    _matDialogClose: any;
    constructor(dialogRef: MatDialogRef<any>, _elementRef: ElementRef<HTMLElement>, _dialog: MatDialog);
    ngOnInit(): void;
    ngOnChanges(changes: SimpleChanges): void;
}
/**
 * Title of a dialog element. Stays fixed to the top of the dialog when scrolling.
 */
export declare class MatDialogTitle implements OnInit {
    private _dialogRef;
    private _elementRef;
    private _dialog;
    id: string;
    constructor(_dialogRef: MatDialogRef<any>, _elementRef: ElementRef<HTMLElement>, _dialog: MatDialog);
    ngOnInit(): void;
}
/**
 * Scrollable content container of a dialog.
 */
export declare class MatDialogContent {
}
/**
 * Container for the bottom action buttons in a dialog.
 * Stays fixed to the bottom when scrolling.
 */
export declare class MatDialogActions {
}

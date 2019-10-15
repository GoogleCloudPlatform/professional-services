/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ElementRef } from '@angular/core';
import { CdkCell, CdkCellDef, CdkColumnDef, CdkFooterCell, CdkFooterCellDef, CdkHeaderCell, CdkHeaderCellDef } from '@angular/cdk/table';
/**
 * Cell definition for the mat-table.
 * Captures the template of a column's data row cell as well as cell-specific properties.
 */
export declare class MatCellDef extends CdkCellDef {
}
/**
 * Header cell definition for the mat-table.
 * Captures the template of a column's header cell and as well as cell-specific properties.
 */
export declare class MatHeaderCellDef extends CdkHeaderCellDef {
}
/**
 * Footer cell definition for the mat-table.
 * Captures the template of a column's footer cell and as well as cell-specific properties.
 */
export declare class MatFooterCellDef extends CdkFooterCellDef {
}
/**
 * Column definition for the mat-table.
 * Defines a set of cells available for a table column.
 */
export declare class MatColumnDef extends CdkColumnDef {
    /** Unique name for this column. */
    name: string;
    /** Whether this column should be sticky positioned at the start of the row */
    sticky: boolean;
    /** Whether this column should be sticky positioned on the end of the row */
    stickyEnd: boolean;
}
/** Header cell template container that adds the right classes and role. */
export declare class MatHeaderCell extends CdkHeaderCell {
    constructor(columnDef: CdkColumnDef, elementRef: ElementRef<HTMLElement>);
}
/** Footer cell template container that adds the right classes and role. */
export declare class MatFooterCell extends CdkFooterCell {
    constructor(columnDef: CdkColumnDef, elementRef: ElementRef);
}
/** Cell template container that adds the right classes and role. */
export declare class MatCell extends CdkCell {
    constructor(columnDef: CdkColumnDef, elementRef: ElementRef<HTMLElement>);
}

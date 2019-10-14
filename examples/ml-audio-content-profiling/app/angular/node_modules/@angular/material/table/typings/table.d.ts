/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { CdkTable } from '@angular/cdk/table';
/**
 * Wrapper for the CdkTable with Material design styles.
 */
export declare class MatTable<T> extends CdkTable<T> {
    /** Overrides the sticky CSS class set by the `CdkTable`. */
    protected stickyCssClass: string;
}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { TemplateRef } from '@angular/core';
/**
 * Element that will be used as a template for the preview
 * of a CdkDrag when it is being dragged.
 */
export declare class CdkDragPreview<T = any> {
    templateRef: TemplateRef<T>;
    /** Context data to be added to the preview template instance. */
    data: T;
    constructor(templateRef: TemplateRef<T>);
}

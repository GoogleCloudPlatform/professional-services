/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { DoCheck, ElementRef, KeyValueDiffers, Renderer2 } from '@angular/core';
/**
 * @ngModule CommonModule
 *
 * @usageNotes
 * ```
 * <some-element [ngStyle]="{'font-style': styleExp}">...</some-element>
 *
 * <some-element [ngStyle]="{'max-width.px': widthExp}">...</some-element>
 *
 * <some-element [ngStyle]="objExp">...</some-element>
 * ```
 *
 * @description
 *
 * Update an HTML element styles.
 *
 * The styles are updated according to the value of the expression evaluation:
 * - keys are style names with an optional `.<unit>` suffix (ie 'top.px', 'font-style.em'),
 * - values are the values assigned to those properties (expressed in the given unit).
 *
 * @publicApi
 */
export declare class NgStyle implements DoCheck {
    private _differs;
    private _ngEl;
    private _renderer;
    private _ngStyle;
    private _differ;
    constructor(_differs: KeyValueDiffers, _ngEl: ElementRef, _renderer: Renderer2);
    ngStyle: {
        [key: string]: string;
    };
    ngDoCheck(): void;
    private _applyChanges;
    private _setStyle;
}

/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { NoopAnimationPlayer } from '@angular/animations';
export declare class DirectStylePlayer extends NoopAnimationPlayer {
    element: any;
    private _startingStyles;
    private __initialized;
    private _styles;
    constructor(element: any, styles: {
        [key: string]: any;
    });
    init(): void;
    play(): void;
    destroy(): void;
}

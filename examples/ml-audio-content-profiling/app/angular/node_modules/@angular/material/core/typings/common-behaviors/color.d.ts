/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Constructor } from './constructor';
import { ElementRef } from '@angular/core';
/** @docs-private */
export interface CanColor {
    /** Theme color palette for the component. */
    color: ThemePalette;
}
/** @docs-private */
export declare type CanColorCtor = Constructor<CanColor>;
/** @docs-private */
export interface HasElementRef {
    _elementRef: ElementRef;
}
/** Possible color palette values. */
export declare type ThemePalette = 'primary' | 'accent' | 'warn' | undefined;
/** Mixin to augment a directive with a `color` property. */
export declare function mixinColor<T extends Constructor<HasElementRef>>(base: T, defaultColor?: ThemePalette): CanColorCtor & T;

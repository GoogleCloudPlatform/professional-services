/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AnimationPlayer, ɵStyleData } from '@angular/animations';
import { AnimationDriver } from '../animation_driver';
export declare class WebAnimationsDriver implements AnimationDriver {
    private _isNativeImpl;
    private _cssKeyframesDriver;
    validateStyleProperty(prop: string): boolean;
    matchesElement(element: any, selector: string): boolean;
    containsElement(elm1: any, elm2: any): boolean;
    query(element: any, selector: string, multi: boolean): any[];
    computeStyle(element: any, prop: string, defaultValue?: string): string;
    overrideWebAnimationsSupport(supported: boolean): void;
    animate(element: any, keyframes: ɵStyleData[], duration: number, delay: number, easing: string, previousPlayers?: AnimationPlayer[], scrubberAccessRequested?: boolean): AnimationPlayer;
}
export declare function supportsWebAnimations(): boolean;

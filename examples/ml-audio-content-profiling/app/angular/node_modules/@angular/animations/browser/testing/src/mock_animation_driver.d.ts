/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AnimationPlayer, NoopAnimationPlayer, ɵStyleData } from '@angular/animations';
import { ɵAnimationDriver as AnimationDriver } from '@angular/animations/browser';
/**
 * @publicApi
 */
export declare class MockAnimationDriver implements AnimationDriver {
    static log: AnimationPlayer[];
    validateStyleProperty(prop: string): boolean;
    matchesElement(element: any, selector: string): boolean;
    containsElement(elm1: any, elm2: any): boolean;
    query(element: any, selector: string, multi: boolean): any[];
    computeStyle(element: any, prop: string, defaultValue?: string): string;
    animate(element: any, keyframes: {
        [key: string]: string | number;
    }[], duration: number, delay: number, easing: string, previousPlayers?: any[]): MockAnimationPlayer;
}
/**
 * @publicApi
 */
export declare class MockAnimationPlayer extends NoopAnimationPlayer {
    element: any;
    keyframes: {
        [key: string]: string | number;
    }[];
    duration: number;
    delay: number;
    easing: string;
    previousPlayers: any[];
    private __finished;
    private __started;
    previousStyles: {
        [key: string]: string | number;
    };
    private _onInitFns;
    currentSnapshot: ɵStyleData;
    constructor(element: any, keyframes: {
        [key: string]: string | number;
    }[], duration: number, delay: number, easing: string, previousPlayers: any[]);
    finish(): void;
    destroy(): void;
    play(): void;
    hasStarted(): boolean;
    beforeDestroy(): void;
}

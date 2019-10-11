/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AnimationPlayer } from '@angular/animations';
export declare const enum AnimatorControlState {
    INITIALIZED = 1,
    STARTED = 2,
    FINISHED = 3,
    DESTROYED = 4
}
export declare class CssKeyframesPlayer implements AnimationPlayer {
    readonly element: any;
    readonly keyframes: {
        [key: string]: string | number;
    }[];
    readonly animationName: string;
    private readonly _duration;
    private readonly _delay;
    private readonly _finalStyles;
    private _onDoneFns;
    private _onStartFns;
    private _onDestroyFns;
    private _started;
    private _styler;
    parentPlayer: AnimationPlayer;
    readonly totalTime: number;
    readonly easing: string;
    currentSnapshot: {
        [key: string]: string;
    };
    private _state;
    constructor(element: any, keyframes: {
        [key: string]: string | number;
    }[], animationName: string, _duration: number, _delay: number, easing: string, _finalStyles: {
        [key: string]: any;
    });
    onStart(fn: () => void): void;
    onDone(fn: () => void): void;
    onDestroy(fn: () => void): void;
    destroy(): void;
    private _flushDoneFns;
    private _flushStartFns;
    finish(): void;
    setPosition(value: number): void;
    getPosition(): number;
    hasStarted(): boolean;
    init(): void;
    play(): void;
    pause(): void;
    restart(): void;
    reset(): void;
    private _buildStyler;
    beforeDestroy(): void;
}

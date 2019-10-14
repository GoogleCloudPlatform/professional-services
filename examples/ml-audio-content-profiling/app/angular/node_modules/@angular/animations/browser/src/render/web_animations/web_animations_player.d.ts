/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AnimationPlayer } from '@angular/animations';
import { DOMAnimation } from './dom_animation';
export declare class WebAnimationsPlayer implements AnimationPlayer {
    element: any;
    keyframes: {
        [key: string]: string | number;
    }[];
    options: {
        [key: string]: string | number;
    };
    private _onDoneFns;
    private _onStartFns;
    private _onDestroyFns;
    private _duration;
    private _delay;
    private _initialized;
    private _finished;
    private _started;
    private _destroyed;
    private _finalKeyframe;
    readonly domPlayer: DOMAnimation;
    time: number;
    parentPlayer: AnimationPlayer | null;
    currentSnapshot: {
        [styleName: string]: string | number;
    };
    constructor(element: any, keyframes: {
        [key: string]: string | number;
    }[], options: {
        [key: string]: string | number;
    });
    private _onFinish;
    init(): void;
    private _buildPlayer;
    private _preparePlayerBeforeStart;
    onStart(fn: () => void): void;
    onDone(fn: () => void): void;
    onDestroy(fn: () => void): void;
    play(): void;
    pause(): void;
    finish(): void;
    reset(): void;
    private _resetDomPlayerState;
    restart(): void;
    hasStarted(): boolean;
    destroy(): void;
    setPosition(p: number): void;
    getPosition(): number;
    readonly totalTime: number;
    beforeDestroy(): void;
}

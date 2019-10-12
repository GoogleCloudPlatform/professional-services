/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AnimationBuilder, AnimationFactory, AnimationMetadata, AnimationOptions, AnimationPlayer } from '@angular/animations';
import { RendererFactory2 } from '@angular/core';
import { AnimationRenderer } from './animation_renderer';
export declare class BrowserAnimationBuilder extends AnimationBuilder {
    private _nextAnimationId;
    private _renderer;
    constructor(rootRenderer: RendererFactory2, doc: any);
    build(animation: AnimationMetadata | AnimationMetadata[]): AnimationFactory;
}
export declare class BrowserAnimationFactory extends AnimationFactory {
    private _id;
    private _renderer;
    constructor(_id: string, _renderer: AnimationRenderer);
    create(element: any, options?: AnimationOptions): AnimationPlayer;
}
export declare class RendererAnimationPlayer implements AnimationPlayer {
    id: string;
    element: any;
    private _renderer;
    parentPlayer: AnimationPlayer | null;
    private _started;
    constructor(id: string, element: any, options: AnimationOptions, _renderer: AnimationRenderer);
    private _listen;
    private _command;
    onDone(fn: () => void): void;
    onStart(fn: () => void): void;
    onDestroy(fn: () => void): void;
    init(): void;
    hasStarted(): boolean;
    play(): void;
    pause(): void;
    restart(): void;
    finish(): void;
    destroy(): void;
    reset(): void;
    setPosition(p: number): void;
    getPosition(): number;
    totalTime: number;
}

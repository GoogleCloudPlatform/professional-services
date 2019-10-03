/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AnimationMetadata, AnimationOptions, AnimationPlayer } from '@angular/animations';
import { AnimationStyleNormalizer } from '../dsl/style_normalization/animation_style_normalizer';
import { AnimationDriver } from './animation_driver';
export declare class TimelineAnimationEngine {
    bodyNode: any;
    private _driver;
    private _normalizer;
    private _animations;
    private _playersById;
    players: AnimationPlayer[];
    constructor(bodyNode: any, _driver: AnimationDriver, _normalizer: AnimationStyleNormalizer);
    register(id: string, metadata: AnimationMetadata | AnimationMetadata[]): void;
    private _buildPlayer;
    create(id: string, element: any, options?: AnimationOptions): AnimationPlayer;
    destroy(id: string): void;
    private _getPlayer;
    listen(id: string, element: string, eventName: string, callback: (event: any) => any): () => void;
    command(id: string, element: any, command: string, args: any[]): void;
}

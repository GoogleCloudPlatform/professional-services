/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AnimationEvent, AnimationPlayer, ɵStyleData } from '@angular/animations';
import { AnimationStyleNormalizer } from '../../src/dsl/style_normalization/animation_style_normalizer';
import { AnimationDriver } from '../../src/render/animation_driver';
export declare function isBrowser(): boolean;
export declare function isNode(): boolean;
export declare function optimizeGroupPlayer(players: AnimationPlayer[]): AnimationPlayer;
export declare function normalizeKeyframes(driver: AnimationDriver, normalizer: AnimationStyleNormalizer, element: any, keyframes: ɵStyleData[], preStyles?: ɵStyleData, postStyles?: ɵStyleData): ɵStyleData[];
export declare function listenOnPlayer(player: AnimationPlayer, eventName: string, event: AnimationEvent | undefined, callback: (event: any) => any): void;
export declare function copyAnimationEvent(e: AnimationEvent, phaseName: string, player: AnimationPlayer): AnimationEvent;
export declare function makeAnimationEvent(element: any, triggerName: string, fromState: string, toState: string, phaseName?: string, totalTime?: number, disabled?: boolean): AnimationEvent;
export declare function getOrSetAsInMap(map: Map<any, any> | {
    [key: string]: any;
}, key: any, defaultValue: any): any;
export declare function parseTimelineCommand(command: string): [string, string];
export declare function validateStyleProperty(prop: string): boolean;
export declare function getBodyNode(): any | null;
export declare const matchesElement: (element: any, selector: string) => boolean;
export declare const containsElement: (elm1: any, elm2: any) => boolean;
export declare const invokeQuery: (element: any, selector: string, multi: boolean) => any[];
export declare function hypenatePropsObject(object: {
    [key: string]: any;
}): {
    [key: string]: any;
};

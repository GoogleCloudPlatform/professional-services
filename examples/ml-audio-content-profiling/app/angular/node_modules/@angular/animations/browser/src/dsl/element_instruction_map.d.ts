/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AnimationTimelineInstruction } from './animation_timeline_instruction';
export declare class ElementInstructionMap {
    private _map;
    consume(element: any): AnimationTimelineInstruction[];
    append(element: any, instructions: AnimationTimelineInstruction[]): void;
    has(element: any): boolean;
    clear(): void;
}

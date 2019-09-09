/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AnimationMetadata, AnimationOptions, ɵStyleData } from '@angular/animations';
import { AnimationDriver } from '../render/animation_driver';
import { AnimationTimelineInstruction } from './animation_timeline_instruction';
import { ElementInstructionMap } from './element_instruction_map';
export declare class Animation {
    private _driver;
    private _animationAst;
    constructor(_driver: AnimationDriver, input: AnimationMetadata | AnimationMetadata[]);
    buildTimelines(element: any, startingStyles: ɵStyleData | ɵStyleData[], destinationStyles: ɵStyleData | ɵStyleData[], options: AnimationOptions, subInstructions?: ElementInstructionMap): AnimationTimelineInstruction[];
}

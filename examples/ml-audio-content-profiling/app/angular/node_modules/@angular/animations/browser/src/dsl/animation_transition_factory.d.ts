/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AnimationOptions, ɵStyleData } from '@angular/animations';
import { AnimationDriver } from '../render/animation_driver';
import { StyleAst, TransitionAst } from './animation_ast';
import { AnimationTransitionInstruction } from './animation_transition_instruction';
import { ElementInstructionMap } from './element_instruction_map';
export declare class AnimationTransitionFactory {
    private _triggerName;
    ast: TransitionAst;
    private _stateStyles;
    constructor(_triggerName: string, ast: TransitionAst, _stateStyles: {
        [stateName: string]: AnimationStateStyles;
    });
    match(currentState: any, nextState: any, element: any, params: {
        [key: string]: any;
    }): boolean;
    buildStyles(stateName: string, params: {
        [key: string]: any;
    }, errors: any[]): ɵStyleData;
    build(driver: AnimationDriver, element: any, currentState: any, nextState: any, enterClassName: string, leaveClassName: string, currentOptions?: AnimationOptions, nextOptions?: AnimationOptions, subInstructions?: ElementInstructionMap, skipAstBuild?: boolean): AnimationTransitionInstruction;
}
export declare class AnimationStateStyles {
    private styles;
    private defaultParams;
    constructor(styles: StyleAst, defaultParams: {
        [key: string]: any;
    });
    buildStyles(params: {
        [key: string]: any;
    }, errors: string[]): ɵStyleData;
}

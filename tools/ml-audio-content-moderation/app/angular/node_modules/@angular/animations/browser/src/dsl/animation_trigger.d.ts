/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ɵStyleData } from '@angular/animations';
import { TriggerAst } from './animation_ast';
import { AnimationStateStyles, AnimationTransitionFactory } from './animation_transition_factory';
/**
 * @publicApi
 */
export declare function buildTrigger(name: string, ast: TriggerAst): AnimationTrigger;
/**
* @publicApi
*/
export declare class AnimationTrigger {
    name: string;
    ast: TriggerAst;
    transitionFactories: AnimationTransitionFactory[];
    fallbackTransition: AnimationTransitionFactory;
    states: {
        [stateName: string]: AnimationStateStyles;
    };
    constructor(name: string, ast: TriggerAst);
    readonly containsQueries: boolean;
    matchTransition(currentState: any, nextState: any, element: any, params: {
        [key: string]: any;
    }): AnimationTransitionFactory | null;
    matchStyles(currentState: any, params: {
        [key: string]: any;
    }, errors: any[]): ɵStyleData;
}

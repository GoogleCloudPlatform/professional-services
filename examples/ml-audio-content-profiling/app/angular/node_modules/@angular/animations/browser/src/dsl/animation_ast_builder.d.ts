/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AnimationAnimateChildMetadata, AnimationAnimateMetadata, AnimationAnimateRefMetadata, AnimationGroupMetadata, AnimationKeyframesSequenceMetadata, AnimationMetadata, AnimationMetadataType, AnimationOptions, AnimationQueryMetadata, AnimationReferenceMetadata, AnimationSequenceMetadata, AnimationStaggerMetadata, AnimationStateMetadata, AnimationStyleMetadata, AnimationTransitionMetadata, AnimationTriggerMetadata } from '@angular/animations';
import { AnimationDriver } from '../render/animation_driver';
import { AnimateAst, AnimateChildAst, AnimateRefAst, Ast, GroupAst, KeyframesAst, QueryAst, ReferenceAst, SequenceAst, StaggerAst, StateAst, StyleAst, TimingAst, TransitionAst, TriggerAst } from './animation_ast';
import { AnimationDslVisitor } from './animation_dsl_visitor';
export declare function buildAnimationAst(driver: AnimationDriver, metadata: AnimationMetadata | AnimationMetadata[], errors: any[]): Ast<AnimationMetadataType>;
export declare class AnimationAstBuilderVisitor implements AnimationDslVisitor {
    private _driver;
    constructor(_driver: AnimationDriver);
    build(metadata: AnimationMetadata | AnimationMetadata[], errors: any[]): Ast<AnimationMetadataType>;
    private _resetContextStyleTimingState;
    visitTrigger(metadata: AnimationTriggerMetadata, context: AnimationAstBuilderContext): TriggerAst;
    visitState(metadata: AnimationStateMetadata, context: AnimationAstBuilderContext): StateAst;
    visitTransition(metadata: AnimationTransitionMetadata, context: AnimationAstBuilderContext): TransitionAst;
    visitSequence(metadata: AnimationSequenceMetadata, context: AnimationAstBuilderContext): SequenceAst;
    visitGroup(metadata: AnimationGroupMetadata, context: AnimationAstBuilderContext): GroupAst;
    visitAnimate(metadata: AnimationAnimateMetadata, context: AnimationAstBuilderContext): AnimateAst;
    visitStyle(metadata: AnimationStyleMetadata, context: AnimationAstBuilderContext): StyleAst;
    private _makeStyleAst;
    private _validateStyleAst;
    visitKeyframes(metadata: AnimationKeyframesSequenceMetadata, context: AnimationAstBuilderContext): KeyframesAst;
    visitReference(metadata: AnimationReferenceMetadata, context: AnimationAstBuilderContext): ReferenceAst;
    visitAnimateChild(metadata: AnimationAnimateChildMetadata, context: AnimationAstBuilderContext): AnimateChildAst;
    visitAnimateRef(metadata: AnimationAnimateRefMetadata, context: AnimationAstBuilderContext): AnimateRefAst;
    visitQuery(metadata: AnimationQueryMetadata, context: AnimationAstBuilderContext): QueryAst;
    visitStagger(metadata: AnimationStaggerMetadata, context: AnimationAstBuilderContext): StaggerAst;
}
export declare type StyleTimeTuple = {
    startTime: number;
    endTime: number;
};
export declare class AnimationAstBuilderContext {
    errors: any[];
    queryCount: number;
    depCount: number;
    currentTransition: AnimationTransitionMetadata | null;
    currentQuery: AnimationQueryMetadata | null;
    currentQuerySelector: string | null;
    currentAnimateTimings: TimingAst | null;
    currentTime: number;
    collectedStyles: {
        [selectorName: string]: {
            [propName: string]: StyleTimeTuple;
        };
    };
    options: AnimationOptions | null;
    constructor(errors: any[]);
}

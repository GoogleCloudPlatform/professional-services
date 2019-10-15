/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AnimateTimings, AnimationMetadataType, AnimationOptions, ɵStyleData } from '@angular/animations';
import { AnimationDriver } from '../render/animation_driver';
import { AnimateAst, AnimateChildAst, AnimateRefAst, Ast, AstVisitor, GroupAst, KeyframesAst, QueryAst, ReferenceAst, SequenceAst, StaggerAst, StateAst, StyleAst, TransitionAst, TriggerAst } from './animation_ast';
import { AnimationTimelineInstruction } from './animation_timeline_instruction';
import { ElementInstructionMap } from './element_instruction_map';
export declare function buildAnimationTimelines(driver: AnimationDriver, rootElement: any, ast: Ast<AnimationMetadataType>, enterClassName: string, leaveClassName: string, startingStyles: ɵStyleData | undefined, finalStyles: ɵStyleData | undefined, options: AnimationOptions, subInstructions?: ElementInstructionMap, errors?: any[]): AnimationTimelineInstruction[];
export declare class AnimationTimelineBuilderVisitor implements AstVisitor {
    buildKeyframes(driver: AnimationDriver, rootElement: any, ast: Ast<AnimationMetadataType>, enterClassName: string, leaveClassName: string, startingStyles: ɵStyleData, finalStyles: ɵStyleData, options: AnimationOptions, subInstructions?: ElementInstructionMap, errors?: any[]): AnimationTimelineInstruction[];
    visitTrigger(ast: TriggerAst, context: AnimationTimelineContext): any;
    visitState(ast: StateAst, context: AnimationTimelineContext): any;
    visitTransition(ast: TransitionAst, context: AnimationTimelineContext): any;
    visitAnimateChild(ast: AnimateChildAst, context: AnimationTimelineContext): any;
    visitAnimateRef(ast: AnimateRefAst, context: AnimationTimelineContext): any;
    private _visitSubInstructions;
    visitReference(ast: ReferenceAst, context: AnimationTimelineContext): void;
    visitSequence(ast: SequenceAst, context: AnimationTimelineContext): void;
    visitGroup(ast: GroupAst, context: AnimationTimelineContext): void;
    private _visitTiming;
    visitAnimate(ast: AnimateAst, context: AnimationTimelineContext): void;
    visitStyle(ast: StyleAst, context: AnimationTimelineContext): void;
    visitKeyframes(ast: KeyframesAst, context: AnimationTimelineContext): void;
    visitQuery(ast: QueryAst, context: AnimationTimelineContext): void;
    visitStagger(ast: StaggerAst, context: AnimationTimelineContext): void;
}
export declare type StyleAtTime = {
    time: number;
    value: string | number;
};
export declare class AnimationTimelineContext {
    private _driver;
    element: any;
    subInstructions: ElementInstructionMap;
    private _enterClassName;
    private _leaveClassName;
    errors: any[];
    timelines: TimelineBuilder[];
    parentContext: AnimationTimelineContext | null;
    currentTimeline: TimelineBuilder;
    currentAnimateTimings: AnimateTimings | null;
    previousNode: Ast<AnimationMetadataType>;
    subContextCount: number;
    options: AnimationOptions;
    currentQueryIndex: number;
    currentQueryTotal: number;
    currentStaggerTime: number;
    constructor(_driver: AnimationDriver, element: any, subInstructions: ElementInstructionMap, _enterClassName: string, _leaveClassName: string, errors: any[], timelines: TimelineBuilder[], initialTimeline?: TimelineBuilder);
    readonly params: {
        [name: string]: any;
    } | undefined;
    updateOptions(options: AnimationOptions | null, skipIfExists?: boolean): void;
    private _copyOptions;
    createSubContext(options?: AnimationOptions | null, element?: any, newTime?: number): AnimationTimelineContext;
    transformIntoNewTimeline(newTime?: number): TimelineBuilder;
    appendInstructionToTimeline(instruction: AnimationTimelineInstruction, duration: number | null, delay: number | null): AnimateTimings;
    incrementTime(time: number): void;
    delayNextStep(delay: number): void;
    invokeQuery(selector: string, originalSelector: string, limit: number, includeSelf: boolean, optional: boolean, errors: any[]): any[];
}
export declare class TimelineBuilder {
    private _driver;
    element: any;
    startTime: number;
    private _elementTimelineStylesLookup?;
    duration: number;
    easing: string | null;
    private _previousKeyframe;
    private _currentKeyframe;
    private _keyframes;
    private _styleSummary;
    private _localTimelineStyles;
    private _globalTimelineStyles;
    private _pendingStyles;
    private _backFill;
    private _currentEmptyStepKeyframe;
    constructor(_driver: AnimationDriver, element: any, startTime: number, _elementTimelineStylesLookup?: Map<any, ɵStyleData> | undefined);
    containsAnimation(): boolean;
    getCurrentStyleProperties(): string[];
    readonly currentTime: number;
    delayNextStep(delay: number): void;
    fork(element: any, currentTime?: number): TimelineBuilder;
    private _loadKeyframe;
    forwardFrame(): void;
    forwardTime(time: number): void;
    private _updateStyle;
    allowOnlyTimelineStyles(): boolean;
    applyEmptyStep(easing: string | null): void;
    setStyles(input: (ɵStyleData | string)[], easing: string | null, errors: any[], options?: AnimationOptions): void;
    applyStylesToKeyframe(): void;
    snapshotCurrentStyles(): void;
    getFinalKeyframe(): ɵStyleData | undefined;
    readonly properties: string[];
    mergeTimelineCollectedStyles(timeline: TimelineBuilder): void;
    buildKeyframes(): AnimationTimelineInstruction;
}

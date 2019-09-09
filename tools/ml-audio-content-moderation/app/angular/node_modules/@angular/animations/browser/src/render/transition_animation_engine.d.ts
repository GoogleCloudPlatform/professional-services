/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AnimationOptions, AnimationPlayer } from '@angular/animations';
import { AnimationTransitionFactory } from '../dsl/animation_transition_factory';
import { AnimationTransitionInstruction } from '../dsl/animation_transition_instruction';
import { AnimationTrigger } from '../dsl/animation_trigger';
import { AnimationStyleNormalizer } from '../dsl/style_normalization/animation_style_normalizer';
import { AnimationDriver } from './animation_driver';
export interface QueueInstruction {
    element: any;
    triggerName: string;
    fromState: StateValue;
    toState: StateValue;
    transition: AnimationTransitionFactory;
    player: TransitionAnimationPlayer;
    isFallbackTransition: boolean;
}
export declare const REMOVAL_FLAG = "__ng_removed";
export interface ElementAnimationState {
    setForRemoval: boolean;
    setForMove: boolean;
    hasAnimation: boolean;
    namespaceId: string;
    removedBeforeQueried: boolean;
}
export declare class StateValue {
    namespaceId: string;
    value: string;
    options: AnimationOptions;
    readonly params: {
        [key: string]: any;
    };
    constructor(input: any, namespaceId?: string);
    absorbOptions(options: AnimationOptions): void;
}
export declare const VOID_VALUE = "void";
export declare const DEFAULT_STATE_VALUE: StateValue;
export declare class AnimationTransitionNamespace {
    id: string;
    hostElement: any;
    private _engine;
    players: TransitionAnimationPlayer[];
    private _triggers;
    private _queue;
    private _elementListeners;
    private _hostClassName;
    constructor(id: string, hostElement: any, _engine: TransitionAnimationEngine);
    listen(element: any, name: string, phase: string, callback: (event: any) => boolean): () => any;
    register(name: string, ast: AnimationTrigger): boolean;
    private _getTrigger;
    trigger(element: any, triggerName: string, value: any, defaultToFallback?: boolean): TransitionAnimationPlayer | undefined;
    deregister(name: string): void;
    clearElementCache(element: any): void;
    private _signalRemovalForInnerTriggers;
    triggerLeaveAnimation(element: any, context: any, destroyAfterComplete?: boolean, defaultToFallback?: boolean): boolean;
    prepareLeaveAnimationListeners(element: any): void;
    removeNode(element: any, context: any): void;
    insertNode(element: any, parent: any): void;
    drainQueuedTransitions(microtaskId: number): QueueInstruction[];
    destroy(context: any): void;
    elementContainsData(element: any): boolean;
}
export interface QueuedTransition {
    element: any;
    instruction: AnimationTransitionInstruction;
    player: TransitionAnimationPlayer;
}
export declare class TransitionAnimationEngine {
    bodyNode: any;
    driver: AnimationDriver;
    private _normalizer;
    players: TransitionAnimationPlayer[];
    newHostElements: Map<any, AnimationTransitionNamespace>;
    playersByElement: Map<any, TransitionAnimationPlayer[]>;
    playersByQueriedElement: Map<any, TransitionAnimationPlayer[]>;
    statesByElement: Map<any, {
        [triggerName: string]: StateValue;
    }>;
    disabledNodes: Set<any>;
    totalAnimations: number;
    totalQueuedPlayers: number;
    private _namespaceLookup;
    private _namespaceList;
    private _flushFns;
    private _whenQuietFns;
    namespacesByHostElement: Map<any, AnimationTransitionNamespace>;
    collectedEnterElements: any[];
    collectedLeaveElements: any[];
    onRemovalComplete: (element: any, context: any) => void;
    constructor(bodyNode: any, driver: AnimationDriver, _normalizer: AnimationStyleNormalizer);
    readonly queuedPlayers: TransitionAnimationPlayer[];
    createNamespace(namespaceId: string, hostElement: any): AnimationTransitionNamespace;
    private _balanceNamespaceList;
    register(namespaceId: string, hostElement: any): AnimationTransitionNamespace;
    registerTrigger(namespaceId: string, name: string, trigger: AnimationTrigger): void;
    destroy(namespaceId: string, context: any): void;
    private _fetchNamespace;
    fetchNamespacesByElement(element: any): Set<AnimationTransitionNamespace>;
    trigger(namespaceId: string, element: any, name: string, value: any): boolean;
    insertNode(namespaceId: string, element: any, parent: any, insertBefore: boolean): void;
    collectEnterElement(element: any): void;
    markElementAsDisabled(element: any, value: boolean): void;
    removeNode(namespaceId: string, element: any, context: any): void;
    markElementAsRemoved(namespaceId: string, element: any, hasAnimation?: boolean, context?: any): void;
    listen(namespaceId: string, element: any, name: string, phase: string, callback: (event: any) => boolean): () => any;
    private _buildInstruction;
    destroyInnerAnimations(containerElement: any): void;
    destroyActiveAnimationsForElement(element: any): void;
    finishActiveQueriedAnimationOnElement(element: any): void;
    whenRenderingDone(): Promise<any>;
    processLeaveNode(element: any): void;
    flush(microtaskId?: number): void;
    reportError(errors: string[]): void;
    private _flushAnimations;
    elementContainsData(namespaceId: string, element: any): boolean;
    afterFlush(callback: () => any): void;
    afterFlushAnimationsDone(callback: () => any): void;
    private _getPreviousPlayers;
    private _beforeAnimationBuild;
    private _buildAnimation;
    private _buildPlayer;
}
export declare class TransitionAnimationPlayer implements AnimationPlayer {
    namespaceId: string;
    triggerName: string;
    element: any;
    private _player;
    private _containsRealPlayer;
    private _queuedCallbacks;
    readonly destroyed = false;
    parentPlayer: AnimationPlayer;
    markedForDestroy: boolean;
    disabled: boolean;
    readonly queued: boolean;
    readonly totalTime: number;
    constructor(namespaceId: string, triggerName: string, element: any);
    setRealPlayer(player: AnimationPlayer): void;
    getRealPlayer(): AnimationPlayer;
    overrideTotalTime(totalTime: number): void;
    syncPlayerEvents(player: AnimationPlayer): void;
    private _queueEvent;
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
    setPosition(p: any): void;
    getPosition(): number;
}

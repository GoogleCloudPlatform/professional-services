/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AnimateTimings, AnimationMetadata, AnimationMetadataType, AnimationOptions, ɵStyleData } from '@angular/animations';
import { Ast as AnimationAst, AstVisitor as AnimationAstVisitor } from './dsl/animation_ast';
import { AnimationDslVisitor } from './dsl/animation_dsl_visitor';
export declare const ONE_SECOND = 1000;
export declare const SUBSTITUTION_EXPR_START = "{{";
export declare const SUBSTITUTION_EXPR_END = "}}";
export declare const ENTER_CLASSNAME = "ng-enter";
export declare const LEAVE_CLASSNAME = "ng-leave";
export declare const ENTER_SELECTOR = ".ng-enter";
export declare const LEAVE_SELECTOR = ".ng-leave";
export declare const NG_TRIGGER_CLASSNAME = "ng-trigger";
export declare const NG_TRIGGER_SELECTOR = ".ng-trigger";
export declare const NG_ANIMATING_CLASSNAME = "ng-animating";
export declare const NG_ANIMATING_SELECTOR = ".ng-animating";
export declare function resolveTimingValue(value: string | number): number;
export declare function resolveTiming(timings: string | number | AnimateTimings, errors: any[], allowNegativeValues?: boolean): AnimateTimings;
export declare function copyObj(obj: {
    [key: string]: any;
}, destination?: {
    [key: string]: any;
}): {
    [key: string]: any;
};
export declare function normalizeStyles(styles: ɵStyleData | ɵStyleData[]): ɵStyleData;
export declare function copyStyles(styles: ɵStyleData, readPrototype: boolean, destination?: ɵStyleData): ɵStyleData;
export declare function setStyles(element: any, styles: ɵStyleData): void;
export declare function eraseStyles(element: any, styles: ɵStyleData): void;
export declare function normalizeAnimationEntry(steps: AnimationMetadata | AnimationMetadata[]): AnimationMetadata;
export declare function validateStyleParams(value: string | number, options: AnimationOptions, errors: any[]): void;
export declare function extractStyleParams(value: string | number): string[];
export declare function interpolateParams(value: string | number, params: {
    [name: string]: any;
}, errors: any[]): string | number;
export declare function iteratorToArray(iterator: any): any[];
export declare function mergeAnimationOptions(source: AnimationOptions, destination: AnimationOptions): AnimationOptions;
export declare function dashCaseToCamelCase(input: string): string;
export declare function allowPreviousPlayerStylesMerge(duration: number, delay: number): boolean;
export declare function balancePreviousStylesIntoKeyframes(element: any, keyframes: {
    [key: string]: any;
}[], previousStyles: {
    [key: string]: any;
}): {
    [key: string]: any;
}[];
export declare function visitDslNode(visitor: AnimationDslVisitor, node: AnimationMetadata, context: any): any;
export declare function visitDslNode(visitor: AnimationAstVisitor, node: AnimationAst<AnimationMetadataType>, context: any): any;
export declare function computeStyle(element: any, prop: string): string;

/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export declare const ANY_STATE = "*";
export declare type TransitionMatcherFn = (fromState: any, toState: any, element: any, params: {
    [key: string]: any;
}) => boolean;
export declare function parseTransitionExpr(transitionValue: string | TransitionMatcherFn, errors: string[]): TransitionMatcherFn[];

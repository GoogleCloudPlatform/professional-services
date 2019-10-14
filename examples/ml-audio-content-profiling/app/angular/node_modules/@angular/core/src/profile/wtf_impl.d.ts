/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * A scope function for the Web Tracing Framework (WTF).
 *
 * @publicApi
 */
export interface WtfScopeFn {
    (arg0?: any, arg1?: any): any;
}
export interface Range {
}
export interface Scope {
    (...args: any[] /** TODO #9100 */): any;
}
export declare function detectWTF(): boolean;
export declare function createScope(signature: string, flags?: any): any;
export declare function leave<T>(scope: Scope): void;
export declare function leave<T>(scope: Scope, returnValue?: T): T;
export declare function startTimeRange(rangeType: string, action: string): Range;
export declare function endTimeRange(range: Range): void;

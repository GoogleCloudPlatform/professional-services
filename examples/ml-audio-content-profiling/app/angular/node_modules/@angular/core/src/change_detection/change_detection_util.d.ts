/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export declare function devModeEqual(a: any, b: any): boolean;
/**
 * Indicates that the result of a {@link Pipe} transformation has changed even though the
 * reference has not changed.
 *
 * Wrapped values are unwrapped automatically during the change detection, and the unwrapped value
 * is stored.
 *
 * Example:
 *
 * ```
 * if (this._latestValue === this._latestReturnedValue) {
 *    return this._latestReturnedValue;
 *  } else {
 *    this._latestReturnedValue = this._latestValue;
 *    return WrappedValue.wrap(this._latestValue); // this will force update
 *  }
 * ```
 *
 * @publicApi
 */
export declare class WrappedValue {
    /** @deprecated from 5.3, use `unwrap()` instead - will switch to protected */
    wrapped: any;
    constructor(value: any);
    /** Creates a wrapped value. */
    static wrap(value: any): WrappedValue;
    /**
     * Returns the underlying value of a wrapped value.
     * Returns the given `value` when it is not wrapped.
     **/
    static unwrap(value: any): any;
    /** Returns true if `value` is a wrapped value. */
    static isWrapped(value: any): value is WrappedValue;
}
/**
 * Represents a basic change from a previous to a new value.
 *
 * @publicApi
 */
export declare class SimpleChange {
    previousValue: any;
    currentValue: any;
    firstChange: boolean;
    constructor(previousValue: any, currentValue: any, firstChange: boolean);
    /**
     * Check whether the new value is the first value assigned.
     */
    isFirstChange(): boolean;
}
export declare function isListLikeIterable(obj: any): boolean;
export declare function areIterablesEqual(a: any, b: any, comparator: (a: any, b: any) => boolean): boolean;
export declare function iterateListLike(obj: any, fn: (p: any) => any): void;
export declare function isJsObject(o: any): boolean;

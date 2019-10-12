/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Type } from '@angular/core';
/**
 * Jasmine matchers that check Angular specific conditions.
 */
export interface NgMatchers<T = any> extends jasmine.Matchers<T> {
    /**
     * Expect the value to be a `Promise`.
     *
     * @usageNotes
     * ### Example
     *
     * {@example testing/ts/matchers.ts region='toBePromise'}
     */
    toBePromise(): boolean;
    /**
     * Expect the value to be an instance of a class.
     *
     * @usageNotes
     * ### Example
     *
     * {@example testing/ts/matchers.ts region='toBeAnInstanceOf'}
     */
    toBeAnInstanceOf(expected: any): boolean;
    /**
     * Expect the element to have exactly the given text.
     *
     * @usageNotes
     * ### Example
     *
     * {@example testing/ts/matchers.ts region='toHaveText'}
     */
    toHaveText(expected: string): boolean;
    /**
     * Expect the element to have the given CSS class.
     *
     * @usageNotes
     * ### Example
     *
     * {@example testing/ts/matchers.ts region='toHaveCssClass'}
     */
    toHaveCssClass(expected: string): boolean;
    /**
     * Expect the element to have the given CSS styles.
     *
     * @usageNotes
     * ### Example
     *
     * {@example testing/ts/matchers.ts region='toHaveCssStyle'}
     */
    toHaveCssStyle(expected: {
        [k: string]: string;
    } | string): boolean;
    /**
     * Expect a class to implement the interface of the given class.
     *
     * @usageNotes
     * ### Example
     *
     * {@example testing/ts/matchers.ts region='toImplement'}
     */
    toImplement(expected: any): boolean;
    /**
     * Expect an exception to contain the given error text.
     *
     * @usageNotes
     * ### Example
     *
     * {@example testing/ts/matchers.ts region='toContainError'}
     */
    toContainError(expected: any): boolean;
    /**
     * Expect a component of the given type to show.
     */
    toContainComponent(expectedComponentType: Type<any>, expectationFailOutput?: any): boolean;
    /**
     * Invert the matchers.
     */
    not: NgMatchers<T>;
}
/**
 * Jasmine matching function with Angular matchers mixed in.
 *
 * ## Example
 *
 * {@example testing/ts/matchers.ts region='toHaveText'}
 */
export declare const expect: <T = any>(actual: T) => NgMatchers<T>;

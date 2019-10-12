/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <reference types="jasmine" />
export { AsyncTestCompleter } from './async_test_completer';
export { inject } from './test_bed';
export * from './logger';
export * from './ng_zone_mock';
export declare const proxy: ClassDecorator;
export declare const afterEach: Function;
export declare const expect: <T>(actual: T) => jasmine.Matchers<T>;
export declare function describe(...args: any[]): void;
export declare function ddescribe(...args: any[]): void;
export declare function xdescribe(...args: any[]): void;
export declare function beforeEach(fn: Function): void;
/**
 * Allows overriding default providers defined in test_injector.js.
 *
 * The given function must return a list of DI providers.
 *
 * Example:
 *
 *   beforeEachProviders(() => [
 *     {provide: Compiler, useClass: MockCompiler},
 *     {provide: SomeToken, useValue: myValue},
 *   ]);
 */
export declare function beforeEachProviders(fn: Function): void;
export declare function it(expectation: string, assertion: (done: DoneFn) => any, timeout?: number): void;
export declare function fit(expectation: string, assertion: (done: DoneFn) => any, timeout?: number): void;
export declare function xit(expectation: string, assertion: (done: DoneFn) => any, timeout?: number): void;
export declare class SpyObject {
    constructor(type?: any);
    spy(name: string): any;
    prop(name: string, value: any): void;
    static stub(object?: any, config?: any, overrides?: any): any;
}

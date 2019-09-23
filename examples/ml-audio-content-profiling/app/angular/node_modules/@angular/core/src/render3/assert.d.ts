/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export declare function assertNumber(actual: any, msg: string): void;
export declare function assertEqual<T>(actual: T, expected: T, msg: string): void;
export declare function assertNotEqual<T>(actual: T, expected: T, msg: string): void;
export declare function assertSame<T>(actual: T, expected: T, msg: string): void;
export declare function assertLessThan<T>(actual: T, expected: T, msg: string): void;
export declare function assertGreaterThan<T>(actual: T, expected: T, msg: string): void;
export declare function assertNotDefined<T>(actual: T, msg: string): void;
export declare function assertDefined<T>(actual: T, msg: string): void;
export declare function assertComponentType(actual: any, msg?: string): void;
export declare function assertNgModuleType(actual: any, msg?: string): void;

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/** Converts the specified speed factor into the exact static enter duration. */
export declare function convertSpeedFactorToDuration(factor: number): number;
/**
 * Creates a runtime TypeScript expression that can be used in order to calculate the duration
 * from the speed factor expression that couldn't be statically analyzed.
 *
 * @param speedFactorValue Speed factor expression that couldn't be statically analyzed.
 */
export declare function createSpeedFactorConvertExpression(speedFactorValue: string): string;

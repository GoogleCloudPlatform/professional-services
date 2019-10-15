/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { DebugContext } from './types';
export declare function expressionChangedAfterItHasBeenCheckedError(context: DebugContext, oldValue: any, currValue: any, isFirstCheck: boolean): Error;
export declare function viewWrappedDebugError(err: any, context: DebugContext): Error;
export declare function viewDebugError(msg: string, context: DebugContext): Error;
export declare function isViewDebugError(err: Error): boolean;
export declare function viewDestroyedError(action: string): Error;

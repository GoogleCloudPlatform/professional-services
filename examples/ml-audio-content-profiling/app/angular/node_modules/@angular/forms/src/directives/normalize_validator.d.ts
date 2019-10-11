/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AsyncValidator, AsyncValidatorFn, Validator, ValidatorFn } from './validators';
export declare function normalizeValidator(validator: ValidatorFn | Validator): ValidatorFn;
export declare function normalizeAsyncValidator(validator: AsyncValidatorFn | AsyncValidator): AsyncValidatorFn;

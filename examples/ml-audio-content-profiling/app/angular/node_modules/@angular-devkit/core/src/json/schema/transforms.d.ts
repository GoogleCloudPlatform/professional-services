/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { JsonObject, JsonValue } from '../interface';
import { JsonPointer } from './interface';
export declare function addUndefinedDefaults(value: JsonValue, _pointer: JsonPointer, schema?: JsonObject): JsonValue;

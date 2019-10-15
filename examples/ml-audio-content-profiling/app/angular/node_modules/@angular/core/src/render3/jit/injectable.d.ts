/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injectable } from '../../di/injectable';
import { Type } from '../../type';
/**
 * Compile an Angular injectable according to its `Injectable` metadata, and patch the resulting
 * `ngInjectableDef` onto the injectable type.
 */
export declare function compileInjectable(type: Type<any>, srcMeta?: Injectable): void;

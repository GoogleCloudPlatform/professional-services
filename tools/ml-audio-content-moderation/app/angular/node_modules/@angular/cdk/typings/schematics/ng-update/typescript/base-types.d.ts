/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as ts from 'typescript';
/** Determines the base types of the specified class declaration. */
export declare function determineBaseTypes(node: ts.ClassDeclaration): string[] | null;

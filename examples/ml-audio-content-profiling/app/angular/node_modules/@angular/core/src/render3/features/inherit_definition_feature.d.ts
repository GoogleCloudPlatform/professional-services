/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ComponentDef, DirectiveDef } from '../interfaces/definition';
/**
 * Merges the definition from a super class to a sub class.
 * @param definition The definition that is a SubClass of another directive of component
 */
export declare function InheritDefinitionFeature(definition: DirectiveDef<any> | ComponentDef<any>): void;

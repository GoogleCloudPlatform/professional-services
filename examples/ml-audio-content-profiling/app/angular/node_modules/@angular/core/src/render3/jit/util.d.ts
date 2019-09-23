/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ReflectionCapabilities } from '../../reflection/reflection_capabilities';
import { Type } from '../../type';
import { R3DependencyMetadataFacade } from './compiler_facade';
export declare function getReflect(): ReflectionCapabilities;
export declare function reflectDependencies(type: Type<any>): R3DependencyMetadataFacade[];
export declare function convertDependencies(deps: any[]): R3DependencyMetadataFacade[];

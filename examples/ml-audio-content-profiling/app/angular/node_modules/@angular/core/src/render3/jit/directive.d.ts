/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Query } from '../../metadata/di';
import { Component, Directive } from '../../metadata/directives';
import { Type } from '../../type';
import { R3QueryMetadataFacade } from './compiler_facade_interface';
/**
 * Compile an Angular component according to its decorator metadata, and patch the resulting
 * ngComponentDef onto the component type.
 *
 * Compilation may be asynchronous (due to the need to resolve URLs for the component template or
 * other resources, for example). In the event that compilation is not immediate, `compileComponent`
 * will enqueue resource resolution into a global queue and will fail to return the `ngComponentDef`
 * until the global queue has been resolved with a call to `resolveComponentResources`.
 */
export declare function compileComponent(type: Type<any>, metadata: Component): void;
/**
 * Compile an Angular directive according to its decorator metadata, and patch the resulting
 * ngDirectiveDef onto the component type.
 *
 * In the event that compilation is not immediate, `compileDirective` will return a `Promise` which
 * will resolve when compilation completes and the directive becomes usable.
 */
export declare function compileDirective(type: Type<any>, directive: Directive): void;
export declare function extendsDirectlyFromObject(type: Type<any>): boolean;
export declare function convertToR3QueryMetadata(propertyName: string, ann: Query): R3QueryMetadataFacade;

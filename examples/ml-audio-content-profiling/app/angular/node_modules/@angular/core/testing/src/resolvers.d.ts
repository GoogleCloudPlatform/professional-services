/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Component, Directive, NgModule, Pipe, Type } from '@angular/core';
import { MetadataOverride } from './metadata_override';
/**
 * Base interface to resolve `@Component`, `@Directive`, `@Pipe` and `@NgModule`.
 */
export interface Resolver<T> {
    resolve(type: Type<any>): T | null;
}
/**
 * Allows to override ivy metadata for tests (via the `TestBed`).
 */
declare abstract class OverrideResolver<T> implements Resolver<T> {
    private overrides;
    private resolved;
    abstract readonly type: any;
    setOverrides(overrides: Array<[Type<any>, MetadataOverride<T>]>): void;
    getAnnotation(type: Type<any>): T | null;
    resolve(type: Type<any>): T | null;
}
export declare class DirectiveResolver extends OverrideResolver<Directive> {
    readonly type: import("@angular/core/src/metadata/directives").DirectiveDecorator;
}
export declare class ComponentResolver extends OverrideResolver<Component> {
    readonly type: import("@angular/core/src/metadata/directives").ComponentDecorator;
}
export declare class PipeResolver extends OverrideResolver<Pipe> {
    readonly type: import("@angular/core/src/metadata/directives").PipeDecorator;
}
export declare class NgModuleResolver extends OverrideResolver<NgModule> {
    readonly type: import("@angular/core/src/metadata/ng_module").NgModuleDecorator;
}
export {};

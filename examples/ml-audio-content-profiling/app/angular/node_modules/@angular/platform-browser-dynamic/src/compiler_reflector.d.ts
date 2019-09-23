/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { CompileReflector, ExternalReference } from '@angular/compiler';
import { Component } from '@angular/core';
export declare const MODULE_SUFFIX = "";
export declare class JitReflector implements CompileReflector {
    private reflectionCapabilities;
    componentModuleUrl(type: any, cmpMetadata: Component): string;
    parameters(typeOrFunc: any): any[][];
    tryAnnotations(typeOrFunc: any): any[];
    annotations(typeOrFunc: any): any[];
    shallowAnnotations(typeOrFunc: any): any[];
    propMetadata(typeOrFunc: any): {
        [key: string]: any[];
    };
    hasLifecycleHook(type: any, lcProperty: string): boolean;
    guards(type: any): {
        [key: string]: any;
    };
    resolveExternalReference(ref: ExternalReference): any;
}

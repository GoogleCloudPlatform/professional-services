/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export interface DirectiveCompiler {
    (type: any, meta: any): void;
}
export declare const R3_COMPILE_COMPONENT__POST_NGCC__: DirectiveCompiler;
export declare const R3_COMPILE_DIRECTIVE__POST_NGCC__: DirectiveCompiler;
export declare const R3_COMPILE_INJECTABLE__POST_NGCC__: DirectiveCompiler;
export declare const R3_COMPILE_NGMODULE__POST_NGCC__: DirectiveCompiler;
export declare const R3_COMPILE_PIPE__POST_NGCC__: DirectiveCompiler;
export declare const R3_COMPILE_NGMODULE_DEFS__POST_NGCC__: DirectiveCompiler;
export declare const R3_PATCH_COMPONENT_DEF_WTIH_SCOPE__POST_NGCC__: DirectiveCompiler;
export declare const ivyEnable__POST_NGCC__: boolean;
export declare const ivyEnabled = false;
export declare let R3_COMPILE_COMPONENT: DirectiveCompiler;
export declare let R3_COMPILE_DIRECTIVE: DirectiveCompiler;
export declare let R3_COMPILE_INJECTABLE: DirectiveCompiler;
export declare let R3_COMPILE_NGMODULE: DirectiveCompiler;
export declare let R3_COMPILE_PIPE: DirectiveCompiler;
export declare let R3_COMPILE_NGMODULE_DEFS: DirectiveCompiler;
export declare let R3_PATCH_COMPONENT_DEF_WTIH_SCOPE: DirectiveCompiler;

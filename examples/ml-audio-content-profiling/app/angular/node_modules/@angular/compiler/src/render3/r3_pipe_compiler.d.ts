/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { CompilePipeMetadata } from '../compile_metadata';
import { CompileReflector } from '../compile_reflector';
import * as o from '../output/output_ast';
import { OutputContext } from '../util';
import { R3DependencyMetadata } from './r3_factory';
export interface R3PipeMetadata {
    name: string;
    type: o.Expression;
    pipeName: string;
    deps: R3DependencyMetadata[] | null;
    pure: boolean;
}
export interface R3PipeDef {
    expression: o.Expression;
    type: o.Type;
    statements: o.Statement[];
}
export declare function compilePipeFromMetadata(metadata: R3PipeMetadata): {
    expression: o.InvokeFunctionExpr;
    type: o.ExpressionType;
    statements: o.Statement[];
};
/**
 * Write a pipe definition to the output context.
 */
export declare function compilePipeFromRender2(outputCtx: OutputContext, pipe: CompilePipeMetadata, reflector: CompileReflector): undefined;

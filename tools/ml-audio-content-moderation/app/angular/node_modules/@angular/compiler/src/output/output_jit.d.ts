/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { CompileReflector } from '../compile_reflector';
import { EmitterVisitorContext } from './abstract_emitter';
import { AbstractJsEmitterVisitor } from './abstract_js_emitter';
import * as o from './output_ast';
export declare function jitStatements(sourceUrl: string, statements: o.Statement[], reflector: CompileReflector, createSourceMaps: boolean): {
    [key: string]: any;
};
export declare class JitEmitterVisitor extends AbstractJsEmitterVisitor {
    private reflector;
    private _evalArgNames;
    private _evalArgValues;
    private _evalExportedVars;
    constructor(reflector: CompileReflector);
    createReturnStmt(ctx: EmitterVisitorContext): void;
    getArgs(): {
        [key: string]: any;
    };
    visitExternalExpr(ast: o.ExternalExpr, ctx: EmitterVisitorContext): any;
    visitWrappedNodeExpr(ast: o.WrappedNodeExpr<any>, ctx: EmitterVisitorContext): any;
    visitDeclareVarStmt(stmt: o.DeclareVarStmt, ctx: EmitterVisitorContext): any;
    visitDeclareFunctionStmt(stmt: o.DeclareFunctionStmt, ctx: EmitterVisitorContext): any;
    visitDeclareClassStmt(stmt: o.ClassStmt, ctx: EmitterVisitorContext): any;
    private _emitReferenceToExternal;
}

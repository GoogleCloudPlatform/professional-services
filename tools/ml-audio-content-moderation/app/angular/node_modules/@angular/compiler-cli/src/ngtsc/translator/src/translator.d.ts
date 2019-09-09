/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/compiler-cli/src/ngtsc/translator/src/translator" />
import { ArrayType, AssertNotNull, BinaryOperatorExpr, BuiltinType, CastExpr, CommaExpr, ConditionalExpr, Expression, ExpressionType, ExpressionVisitor, ExternalExpr, FunctionExpr, InstantiateExpr, InvokeFunctionExpr, InvokeMethodExpr, LiteralArrayExpr, LiteralExpr, LiteralMapExpr, MapType, NotExpr, ReadKeyExpr, ReadPropExpr, ReadVarExpr, Statement, Type, TypeVisitor, TypeofExpr, WrappedNodeExpr, WriteKeyExpr, WritePropExpr, WriteVarExpr } from '@angular/compiler';
import * as ts from 'typescript';
export declare class Context {
    readonly isStatement: boolean;
    constructor(isStatement: boolean);
    readonly withExpressionMode: Context;
    readonly withStatementMode: Context;
}
export declare class ImportManager {
    protected isCore: boolean;
    private prefix;
    private moduleToIndex;
    private nextIndex;
    constructor(isCore: boolean, prefix?: string);
    generateNamedImport(moduleName: string, symbol: string): string | null;
    getAllImports(contextPath: string, rewriteCoreImportsTo: ts.SourceFile | null): {
        name: string;
        as: string;
    }[];
}
export declare function translateExpression(expression: Expression, imports: ImportManager): ts.Expression;
export declare function translateStatement(statement: Statement, imports: ImportManager): ts.Statement;
export declare function translateType(type: Type, imports: ImportManager): string;
export declare class TypeTranslatorVisitor implements ExpressionVisitor, TypeVisitor {
    private imports;
    constructor(imports: ImportManager);
    visitBuiltinType(type: BuiltinType, context: Context): string;
    visitExpressionType(type: ExpressionType, context: Context): string;
    visitArrayType(type: ArrayType, context: Context): string;
    visitMapType(type: MapType, context: Context): string;
    visitReadVarExpr(ast: ReadVarExpr, context: Context): string;
    visitWriteVarExpr(expr: WriteVarExpr, context: Context): never;
    visitWriteKeyExpr(expr: WriteKeyExpr, context: Context): never;
    visitWritePropExpr(expr: WritePropExpr, context: Context): never;
    visitInvokeMethodExpr(ast: InvokeMethodExpr, context: Context): never;
    visitInvokeFunctionExpr(ast: InvokeFunctionExpr, context: Context): never;
    visitInstantiateExpr(ast: InstantiateExpr, context: Context): never;
    visitLiteralExpr(ast: LiteralExpr, context: Context): string;
    visitExternalExpr(ast: ExternalExpr, context: Context): string;
    visitConditionalExpr(ast: ConditionalExpr, context: Context): void;
    visitNotExpr(ast: NotExpr, context: Context): void;
    visitAssertNotNullExpr(ast: AssertNotNull, context: Context): void;
    visitCastExpr(ast: CastExpr, context: Context): void;
    visitFunctionExpr(ast: FunctionExpr, context: Context): void;
    visitBinaryOperatorExpr(ast: BinaryOperatorExpr, context: Context): void;
    visitReadPropExpr(ast: ReadPropExpr, context: Context): void;
    visitReadKeyExpr(ast: ReadKeyExpr, context: Context): void;
    visitLiteralArrayExpr(ast: LiteralArrayExpr, context: Context): string;
    visitLiteralMapExpr(ast: LiteralMapExpr, context: Context): string;
    visitCommaExpr(ast: CommaExpr, context: Context): void;
    visitWrappedNodeExpr(ast: WrappedNodeExpr<any>, context: Context): string;
    visitTypeofExpr(ast: TypeofExpr, context: Context): string;
}

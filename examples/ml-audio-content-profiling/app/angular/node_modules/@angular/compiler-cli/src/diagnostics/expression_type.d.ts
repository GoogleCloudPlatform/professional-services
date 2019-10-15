/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/compiler-cli/src/diagnostics/expression_type" />
import { AST, AstVisitor, Binary, BindingPipe, Chain, Conditional, FunctionCall, ImplicitReceiver, Interpolation, KeyedRead, KeyedWrite, LiteralArray, LiteralMap, LiteralPrimitive, MethodCall, NonNullAssert, PrefixNot, PropertyRead, PropertyWrite, Quote, SafeMethodCall, SafePropertyRead } from '@angular/compiler';
import { Symbol, SymbolQuery, SymbolTable } from './symbols';
export interface ExpressionDiagnosticsContext {
    event?: boolean;
}
export declare enum DiagnosticKind {
    Error = 0,
    Warning = 1
}
export declare class TypeDiagnostic {
    kind: DiagnosticKind;
    message: string;
    ast: AST;
    constructor(kind: DiagnosticKind, message: string, ast: AST);
}
export declare class AstType implements AstVisitor {
    private scope;
    private query;
    private context;
    diagnostics: TypeDiagnostic[];
    constructor(scope: SymbolTable, query: SymbolQuery, context: ExpressionDiagnosticsContext);
    getType(ast: AST): Symbol;
    getDiagnostics(ast: AST): TypeDiagnostic[];
    visitBinary(ast: Binary): Symbol;
    visitChain(ast: Chain): Symbol;
    visitConditional(ast: Conditional): Symbol;
    visitFunctionCall(ast: FunctionCall): Symbol;
    visitImplicitReceiver(ast: ImplicitReceiver): Symbol;
    visitInterpolation(ast: Interpolation): Symbol;
    visitKeyedRead(ast: KeyedRead): Symbol;
    visitKeyedWrite(ast: KeyedWrite): Symbol;
    visitLiteralArray(ast: LiteralArray): Symbol;
    visitLiteralMap(ast: LiteralMap): Symbol;
    visitLiteralPrimitive(ast: LiteralPrimitive): Symbol;
    visitMethodCall(ast: MethodCall): Symbol;
    visitPipe(ast: BindingPipe): Symbol;
    visitPrefixNot(ast: PrefixNot): Symbol;
    visitNonNullAssert(ast: NonNullAssert): Symbol;
    visitPropertyRead(ast: PropertyRead): Symbol | undefined;
    visitPropertyWrite(ast: PropertyWrite): Symbol;
    visitQuote(ast: Quote): Symbol;
    visitSafeMethodCall(ast: SafeMethodCall): Symbol;
    visitSafePropertyRead(ast: SafePropertyRead): Symbol | undefined;
    private _anyType;
    private readonly anyType;
    private _undefinedType;
    private readonly undefinedType;
    private resolveMethodCall;
    private resolvePropertyRead;
    private reportError;
    private reportWarning;
    private isAny;
}

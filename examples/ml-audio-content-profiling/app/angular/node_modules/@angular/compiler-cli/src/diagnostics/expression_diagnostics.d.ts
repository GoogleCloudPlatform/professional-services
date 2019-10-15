/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/compiler-cli/src/diagnostics/expression_diagnostics" />
import { AST, Node, TemplateAst, TemplateAstPath } from '@angular/compiler';
import { DiagnosticKind, ExpressionDiagnosticsContext, TypeDiagnostic } from './expression_type';
import { Span, SymbolQuery, SymbolTable } from './symbols';
export interface DiagnosticTemplateInfo {
    fileName?: string;
    offset: number;
    query: SymbolQuery;
    members: SymbolTable;
    htmlAst: Node[];
    templateAst: TemplateAst[];
}
export interface ExpressionDiagnostic {
    message: string;
    span: Span;
    kind: DiagnosticKind;
}
export declare function getTemplateExpressionDiagnostics(info: DiagnosticTemplateInfo): ExpressionDiagnostic[];
export declare function getExpressionDiagnostics(scope: SymbolTable, ast: AST, query: SymbolQuery, context?: ExpressionDiagnosticsContext): TypeDiagnostic[];
export declare function getExpressionScope(info: DiagnosticTemplateInfo, path: TemplateAstPath, includeEvent: boolean): SymbolTable;

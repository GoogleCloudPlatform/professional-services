/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/compiler-cli/src/language_services" />
export { DiagnosticTemplateInfo, ExpressionDiagnostic, getExpressionDiagnostics, getExpressionScope, getTemplateExpressionDiagnostics } from './diagnostics/expression_diagnostics';
export { AstType, DiagnosticKind, ExpressionDiagnosticsContext, TypeDiagnostic } from './diagnostics/expression_type';
export { BuiltinType, DeclarationKind, Definition, Location, PipeInfo, Pipes, Signature, Span, Symbol, SymbolDeclaration, SymbolQuery, SymbolTable } from './diagnostics/symbols';
export { getClassFromStaticSymbol, getClassMembers, getClassMembersFromDeclaration, getPipesTable, getSymbolQuery } from './diagnostics/typescript_symbols';
export { MetadataCollector, ModuleMetadata } from './metadata';
export { CompilerOptions } from './transformers/api';
export { MetadataReaderCache, MetadataReaderHost, createMetadataReaderCache, readMetadata } from './transformers/metadata_reader';

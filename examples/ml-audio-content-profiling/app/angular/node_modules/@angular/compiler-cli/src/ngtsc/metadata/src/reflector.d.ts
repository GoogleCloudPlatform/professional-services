/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/compiler-cli/src/ngtsc/metadata/src/reflector" />
import * as ts from 'typescript';
import { ClassMember, CtorParameter, Declaration, Decorator, FunctionDefinition, Import, ReflectionHost } from '../../host';
/**
 * reflector.ts implements static reflection of declarations using the TypeScript `ts.TypeChecker`.
 */
export declare class TypeScriptReflectionHost implements ReflectionHost {
    protected checker: ts.TypeChecker;
    constructor(checker: ts.TypeChecker);
    getDecoratorsOfDeclaration(declaration: ts.Declaration): Decorator[] | null;
    getMembersOfClass(declaration: ts.Declaration): ClassMember[];
    getConstructorParameters(declaration: ts.Declaration): CtorParameter[] | null;
    getImportOfIdentifier(id: ts.Identifier): Import | null;
    getExportsOfModule(node: ts.Node): Map<string, Declaration> | null;
    isClass(node: ts.Node): boolean;
    hasBaseClass(node: ts.Declaration): boolean;
    getDeclarationOfIdentifier(id: ts.Identifier): Declaration | null;
    getDefinitionOfFunction<T extends ts.FunctionDeclaration | ts.MethodDeclaration | ts.FunctionExpression>(node: T): FunctionDefinition<T>;
    getGenericArityOfClass(clazz: ts.Declaration): number | null;
    getVariableValue(declaration: ts.VariableDeclaration): ts.Expression | null;
    private _reflectDecorator;
    private _reflectMember;
}
export declare function reflectNameOfDeclaration(decl: ts.Declaration): string | null;
export declare function reflectIdentifierOfDeclaration(decl: ts.Declaration): ts.Identifier | null;
export declare function reflectTypeEntityToDeclaration(type: ts.EntityName, checker: ts.TypeChecker): {
    node: ts.Declaration;
    from: string | null;
};
export declare function filterToMembersWithDecorator(members: ClassMember[], name: string, module?: string): {
    member: ClassMember;
    decorators: Decorator[];
}[];
export declare function findMember(members: ClassMember[], name: string, isStatic?: boolean): ClassMember | null;
export declare function reflectObjectLiteral(node: ts.ObjectLiteralExpression): Map<string, ts.Expression>;

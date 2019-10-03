/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/compiler-cli/src/ngcc/src/host/esm5_host" />
import * as ts from 'typescript';
import { ClassMember, Decorator, FunctionDefinition } from '../../../ngtsc/host';
import { DecoratedFile } from './decorated_file';
import { Fesm2015ReflectionHost, ParamInfo } from './fesm2015_host';
/**
 * ESM5 packages contain ECMAScript IIFE functions that act like classes. For example:
 *
 * ```
 * var CommonModule = (function () {
 *  function CommonModule() {
 *  }
 *  CommonModule.decorators = [ ... ];
 * ```
 *
 * * "Classes" are decorated if they have a static property called `decorators`.
 * * Members are decorated if there is a matching key on a static property
 *   called `propDecorators`.
 * * Constructor parameters decorators are found on an object returned from
 *   a static method called `ctorParameters`.
 *
 */
export declare class Esm5ReflectionHost extends Fesm2015ReflectionHost {
    constructor(isCore: boolean, checker: ts.TypeChecker);
    /**
     * Check whether the given node actually represents a class.
     */
    isClass(node: ts.Node): boolean;
    /**
     * Find a symbol for a node that we think is a class.
     *
     * In ES5, the implementation of a class is a function expression that is hidden inside an IIFE.
     * So we need to dig around inside to get hold of the "class" symbol.
     *
     * `node` might be one of:
     * - A class declaration (from a declaration file).
     * - The declaration of the outer variable, which is assigned the result of the IIFE.
     * - The function declaration inside the IIFE, which is eventually returned and assigned to the
     *   outer variable.
     *
     * @param node the top level declaration that represents an exported class or the function
     *     expression inside the IIFE.
     * @returns the symbol for the node or `undefined` if it is not a "class" or has no symbol.
     */
    getClassSymbol(node: ts.Node): ts.Symbol | undefined;
    /**
     * Parse a function declaration to find the relevant metadata about it.
     *
     * In ESM5 we need to do special work with optional arguments to the function, since they get
     * their own initializer statement that needs to be parsed and then not included in the "body"
     * statements of the function.
     *
     * @param node the function declaration to parse.
     * @returns an object containing the node, statements and parameters of the function.
     */
    getDefinitionOfFunction<T extends ts.FunctionDeclaration | ts.MethodDeclaration | ts.FunctionExpression>(node: T): FunctionDefinition<T>;
    /**
       * Find all the files accessible via an entry-point, that contain decorated classes.
       * @param entryPoint The starting point file for finding files that contain decorated classes.
       * @returns A collection of files objects that hold info about the decorated classes and import
       * information.
       */
    findDecoratedFiles(entryPoint: ts.SourceFile): Map<ts.SourceFile, DecoratedFile>;
    /**
     * Find the declarations of the constructor parameters of a class identified by its symbol.
     *
     * In ESM5 there is no "class" so the constructor that we want is actually the declaration
     * function itself.
     *
     * @param classSymbol the class whose parameters we want to find.
     * @returns an array of `ts.ParameterDeclaration` objects representing each of the parameters in
     * the class's constructor or null if there is no constructor.
     */
    protected getConstructorParameterDeclarations(classSymbol: ts.Symbol): ts.ParameterDeclaration[];
    /**
     * Get the parameter type and decorators for the constructor of a class,
     * where the information is stored on a static method of the class.
     *
     * In this case the decorators are stored in the body of a method
     * (`ctorParatemers`) attached to the constructor function.
     *
     * Note that unlike ESM2015 this is a function expression rather than an arrow
     * function:
     *
     * ```
     * SomeDirective.ctorParameters = function() { return [
     *   { type: ViewContainerRef, },
     *   { type: TemplateRef, },
     *   { type: IterableDiffers, },
     *   { type: undefined, decorators: [{ type: Inject, args: [INJECTED_TOKEN,] },] },
     * ]; };
     * ```
     *
     * @param paramDecoratorsProperty the property that holds the parameter info we want to get.
     * @returns an array of objects containing the type and decorators for each parameter.
     */
    protected getParamInfoFromStaticProperty(paramDecoratorsProperty: ts.Symbol): ParamInfo[] | null;
    /**
     * Reflect over a symbol and extract the member information, combining it with the
     * provided decorator information, and whether it is a static member.
     * @param symbol the symbol for the member to reflect over.
     * @param decorators an array of decorators associated with the member.
     * @param isStatic true if this member is static, false if it is an instance property.
     * @returns the reflected member information, or null if the symbol is not a member.
     */
    protected reflectMember(symbol: ts.Symbol, decorators?: Decorator[], isStatic?: boolean): ClassMember | null;
    /**
     * Find statements related to the given class that may contain calls to a helper.
     *
     * In ESM5 code the helper calls are hidden inside the class's IIFE.
     *
     * @param classSymbol the class whose helper calls we are interested in. We expect this symbol
     * to reference the inner identifier inside the IIFE.
     * @returns an array of statements that may contain helper calls.
     */
    protected getStatementsForClass(classSymbol: ts.Symbol): ts.Statement[];
}

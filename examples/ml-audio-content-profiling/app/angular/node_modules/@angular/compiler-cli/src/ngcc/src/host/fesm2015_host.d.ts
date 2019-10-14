/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/compiler-cli/src/ngcc/src/host/fesm2015_host" />
import * as ts from 'typescript';
import { ClassMember, CtorParameter, Decorator, Import } from '../../../ngtsc/host';
import { TypeScriptReflectionHost } from '../../../ngtsc/metadata';
import { DecoratedFile } from './decorated_file';
import { NgccReflectionHost, SwitchableVariableDeclaration } from './ngcc_host';
export declare const DECORATORS: ts.__String;
export declare const PROP_DECORATORS: ts.__String;
export declare const CONSTRUCTOR: ts.__String;
export declare const CONSTRUCTOR_PARAMS: ts.__String;
/**
 * Esm2015 packages contain ECMAScript 2015 classes, etc.
 * Decorators are defined via static properties on the class. For example:
 *
 * ```
 * class SomeDirective {
 * }
 * SomeDirective.decorators = [
 *   { type: Directive, args: [{ selector: '[someDirective]' },] }
 * ];
 * SomeDirective.ctorParameters = () => [
 *   { type: ViewContainerRef, },
 *   { type: TemplateRef, },
 *   { type: undefined, decorators: [{ type: Inject, args: [INJECTED_TOKEN,] },] },
 * ];
 * SomeDirective.propDecorators = {
 *   "input1": [{ type: Input },],
 *   "input2": [{ type: Input },],
 * };
 * ```
 *
 * * Classes are decorated if they have a static property called `decorators`.
 * * Members are decorated if there is a matching key on a static property
 *   called `propDecorators`.
 * * Constructor parameters decorators are found on an object returned from
 *   a static method called `ctorParameters`.
 */
export declare class Fesm2015ReflectionHost extends TypeScriptReflectionHost implements NgccReflectionHost {
    protected isCore: boolean;
    constructor(isCore: boolean, checker: ts.TypeChecker);
    /**
     * Examine a declaration (for example, of a class or function) and return metadata about any
     * decorators present on the declaration.
     *
     * @param declaration a TypeScript `ts.Declaration` node representing the class or function over
     * which to reflect. For example, if the intent is to reflect the decorators of a class and the
     * source is in ES6 format, this will be a `ts.ClassDeclaration` node. If the source is in ES5
     * format, this might be a `ts.VariableDeclaration` as classes in ES5 are represented as the
     * result of an IIFE execution.
     *
     * @returns an array of `Decorator` metadata if decorators are present on the declaration, or
     * `null` if either no decorators were present or if the declaration is not of a decoratable type.
     */
    getDecoratorsOfDeclaration(declaration: ts.Declaration): Decorator[] | null;
    /**
     * Examine a declaration which should be of a class, and return metadata about the members of the
     * class.
     *
     * @param declaration a TypeScript `ts.Declaration` node representing the class over which to
     * reflect. If the source is in ES6 format, this will be a `ts.ClassDeclaration` node. If the
     * source is in ES5 format, this might be a `ts.VariableDeclaration` as classes in ES5 are
     * represented as the result of an IIFE execution.
     *
     * @returns an array of `ClassMember` metadata representing the members of the class.
     *
     * @throws if `declaration` does not resolve to a class declaration.
     */
    getMembersOfClass(clazz: ts.Declaration): ClassMember[];
    /**
     * Reflect over the constructor of a class and return metadata about its parameters.
     *
     * This method only looks at the constructor of a class directly and not at any inherited
     * constructors.
     *
     * @param declaration a TypeScript `ts.Declaration` node representing the class over which to
     * reflect. If the source is in ES6 format, this will be a `ts.ClassDeclaration` node. If the
     * source is in ES5 format, this might be a `ts.VariableDeclaration` as classes in ES5 are
     * represented as the result of an IIFE execution.
     *
     * @returns an array of `Parameter` metadata representing the parameters of the constructor, if
     * a constructor exists. If the constructor exists and has 0 parameters, this array will be empty.
     * If the class has no constructor, this method returns `null`.
     *
     * @throws if `declaration` does not resolve to a class declaration.
     */
    getConstructorParameters(clazz: ts.Declaration): CtorParameter[] | null;
    /**
     * Find a symbol for a node that we think is a class.
     * @param node the node whose symbol we are finding.
     * @returns the symbol for the node or `undefined` if it is not a "class" or has no symbol.
     */
    getClassSymbol(declaration: ts.Node): ts.Symbol | undefined;
    /**
     * Search the given module for variable declarations in which the initializer
     * is an identifier marked with the `PRE_NGCC_MARKER`.
     * @param module the module in which to search for switchable declarations.
     * @returns an array of variable declarations that match.
     */
    getSwitchableDeclarations(module: ts.Node): SwitchableVariableDeclaration[];
    getVariableValue(declaration: ts.VariableDeclaration): ts.Expression | null;
    /**
     * Determine if an identifier was imported from another module and return `Import` metadata
     * describing its origin.
     *
     * @param id a TypeScript `ts.Identifer` to reflect.
     *
     * @returns metadata about the `Import` if the identifier was imported from another module, or
     * `null` if the identifier doesn't resolve to an import but instead is locally defined.
     */
    getImportOfIdentifier(id: ts.Identifier): Import | null;
    findDecoratedFiles(entryPoint: ts.SourceFile): Map<ts.SourceFile, DecoratedFile>;
    /**
     * Walk the AST looking for an assignment to the specified symbol.
     * @param node The current node we are searching.
     * @returns an expression that represents the value of the variable, or undefined if none can be
     * found.
     */
    protected findDecoratedVariableValue(node: ts.Node | undefined, symbol: ts.Symbol): ts.CallExpression | null;
    /**
     * Try to retrieve the symbol of a static property on a class.
     * @param symbol the class whose property we are interested in.
     * @param propertyName the name of static property.
     * @returns the symbol if it is found or `undefined` if not.
     */
    protected getStaticProperty(symbol: ts.Symbol, propertyName: ts.__String): ts.Symbol | undefined;
    /**
     * Get all class decorators for the given class, where the decorators are declared
     * via a static property. For example:
     *
     * ```
     * class SomeDirective {}
     * SomeDirective.decorators = [
     *   { type: Directive, args: [{ selector: '[someDirective]' },] }
     * ];
     * ```
     *
     * @param decoratorsSymbol the property containing the decorators we want to get.
     * @returns an array of decorators or null if none where found.
     */
    protected getClassDecoratorsFromStaticProperty(decoratorsSymbol: ts.Symbol): Decorator[] | null;
    /**
     * Get all class decorators for the given class, where the decorators are declared
     * via the `__decorate` helper method. For example:
     *
     * ```
     * let SomeDirective = class SomeDirective {}
     * SomeDirective = __decorate([
     *   Directive({ selector: '[someDirective]' }),
     * ], SomeDirective);
     * ```
     *
     * @param symbol the class whose decorators we want to get.
     * @returns an array of decorators or null if none where found.
     */
    protected getClassDecoratorsFromHelperCall(symbol: ts.Symbol): Decorator[] | null;
    /**
     * Get all the member decorators for the given class.
     * @param classSymbol the class whose member decorators we are interested in.
     * @returns a map whose keys are the name of the members and whose values are collections of
     * decorators for the given member.
     */
    protected getMemberDecorators(classSymbol: ts.Symbol): Map<string, Decorator[]>;
    /**
     * Member decorators may be declared as static properties of the class:
     *
     * ```
     * SomeDirective.propDecorators = {
     *   "ngForOf": [{ type: Input },],
     *   "ngForTrackBy": [{ type: Input },],
     *   "ngForTemplate": [{ type: Input },],
     * };
     * ```
     *
     * @param decoratorsProperty the class whose member decorators we are interested in.
     * @returns a map whose keys are the name of the members and whose values are collections of
     * decorators for the given member.
     */
    protected getMemberDecoratorsFromStaticProperty(decoratorsProperty: ts.Symbol): Map<string, Decorator[]>;
    /**
     * Member decorators may be declared via helper call statements.
     *
     * ```
     * __decorate([
     *     Input(),
     *     __metadata("design:type", String)
     * ], SomeDirective.prototype, "input1", void 0);
     * ```
     *
     * @param classSymbol the class whose member decorators we are interested in.
     * @returns a map whose keys are the name of the members and whose values are collections of
     * decorators for the given member.
     */
    protected getMemberDecoratorsFromHelperCalls(classSymbol: ts.Symbol): Map<string, Decorator[]>;
    /**
     * Extract decorator info from `__decorate` helper function calls.
     * @param helperCall the call to a helper that may contain decorator calls
     * @param targetFilter a function to filter out targets that we are not interested in.
     * @returns a mapping from member name to decorators, where the key is either the name of the
     * member or `undefined` if it refers to decorators on the class as a whole.
     */
    protected reflectDecoratorsFromHelperCall(helperCall: ts.CallExpression, targetFilter: TargetFilter): {
        classDecorators: Decorator[];
        memberDecorators: Map<string, Decorator[]>;
    };
    /**
     * Extract the decorator information from a call to a decorator as a function.
     * This happens when the decorators has been used in a `__decorate` helper call.
     * For example:
     *
     * ```
     * __decorate([
     *   Directive({ selector: '[someDirective]' }),
     * ], SomeDirective);
     * ```
     *
     * Here the `Directive` decorator is decorating `SomeDirective` and the options for
     * the decorator are passed as arguments to the `Directive()` call.
     *
     * @param call the call to the decorator.
     * @returns a decorator containing the reflected information, or null if the call
     * is not a valid decorator call.
     */
    protected reflectDecoratorCall(call: ts.CallExpression): Decorator | null;
    /**
     * Check the given statement to see if it is a call to the specified helper function or null if
     * not found.
     *
     * Matching statements will look like:  `tslib_1.__decorate(...);`.
     * @param statement the statement that may contain the call.
     * @param helperName the name of the helper we are looking for.
     * @returns the node that corresponds to the `__decorate(...)` call or null if the statement does
     * not match.
     */
    protected getHelperCall(statement: ts.Statement, helperName: string): ts.CallExpression | null;
    /**
     * Reflect over the given array node and extract decorator information from each element.
     *
     * This is used for decorators that are defined in static properties. For example:
     *
     * ```
     * SomeDirective.decorators = [
     *   { type: Directive, args: [{ selector: '[someDirective]' },] }
     * ];
     * ```
     *
     * @param decoratorsArray an expression that contains decorator information.
     * @returns an array of decorator info that was reflected from the array node.
     */
    protected reflectDecorators(decoratorsArray: ts.Expression): Decorator[];
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
     * Find the declarations of the constructor parameters of a class identified by its symbol.
     * @param classSymbol the class whose parameters we want to find.
     * @returns an array of `ts.ParameterDeclaration` objects representing each of the parameters in
     * the class's constructor or null if there is no constructor.
     */
    protected getConstructorParameterDeclarations(classSymbol: ts.Symbol): ts.ParameterDeclaration[] | null;
    /**
     * Get the parameter decorators of a class constructor.
     *
     * @param classSymbol the class whose parameter info we want to get.
     * @param parameterNodes the array of TypeScript parameter nodes for this class's constructor.
     * @returns an array of constructor parameter info objects.
     */
    protected getConstructorParamInfo(classSymbol: ts.Symbol, parameterNodes: ts.ParameterDeclaration[]): CtorParameter[];
    /**
     * Get the parameter type and decorators for the constructor of a class,
     * where the information is stored on a static method of the class.
     *
     * Note that in ESM2015, the method is defined by an arrow function that returns an array of
     * decorator and type information.
     *
     * ```
     * SomeDirective.ctorParameters = () => [
     *   { type: ViewContainerRef, },
     *   { type: TemplateRef, },
     *   { type: undefined, decorators: [{ type: Inject, args: [INJECTED_TOKEN,] },] },
     * ];
     * ```
     *
     * @param paramDecoratorsProperty the property that holds the parameter info we want to get.
     * @returns an array of objects containing the type and decorators for each parameter.
     */
    protected getParamInfoFromStaticProperty(paramDecoratorsProperty: ts.Symbol): ParamInfo[] | null;
    /**
     * Get the parmeter type and decorators for a class where the information is stored on
     * in calls to `__decorate` helpers.
     *
     * Reflect over the helpers to find the decorators and types about each of
     * the class's constructor parameters.
     *
     * @param classSymbol the class whose parameter info we want to get.
     * @param parameterNodes the array of TypeScript parameter nodes for this class's constructor.
     * @returns an array of objects containing the type and decorators for each parameter.
     */
    protected getParamInfoFromHelperCall(classSymbol: ts.Symbol, parameterNodes: ts.ParameterDeclaration[]): ParamInfo[];
    /**
     * Search statements related to the given class for calls to the specified helper.
     * @param classSymbol the class whose helper calls we are interested in.
     * @param helperName the name of the helper (e.g. `__decorate`) whose calls we are interested in.
     * @returns an array of CallExpression nodes for each matching helper call.
     */
    protected getHelperCallsForClass(classSymbol: ts.Symbol, helperName: string): ts.CallExpression[];
    /**
     * Find statements related to the given class that may contain calls to a helper.
     *
     * In ESM2015 code the helper calls are in the top level module, so we have to consider
     * all the statements in the module.
     *
     * @param classSymbol the class whose helper calls we are interested in.
     * @returns an array of statements that may contain helper calls.
     */
    protected getStatementsForClass(classSymbol: ts.Symbol): ts.Statement[];
    /**
     * Try to get the import info for this identifier as though it is a namespaced import.
     * For example, if the identifier is the `__metadata` part of a property access chain like:
     *
     * ```
     * tslib_1.__metadata
     * ```
     *
     * then it might be that `tslib_1` is a namespace import such as:
     *
     * ```
     * import * as tslib_1 from 'tslib';
     * ```
     * @param id the TypeScript identifier to find the import info for.
     * @returns The import info if this is a namespaced import or `null`.
     */
    protected getImportOfNamespacedIdentifier(id: ts.Identifier): Import | null;
    /**
     * Test whether a decorator was imported from `@angular/core`.
     *
     * Is the decorator:
     * * externally imported from `@angulare/core`?
     * * the current hosted program is actually `@angular/core` and
     *   - relatively internally imported; or
     *   - not imported, from the current file.
     *
     * @param decorator the decorator to test.
     */
    isFromCore(decorator: Decorator): boolean;
}
export declare type ParamInfo = {
    decorators: Decorator[] | null;
    type: ts.Expression | null;
};
/**
 * A statement node that represents an assignment.
 */
export declare type AssignmentStatement = ts.ExpressionStatement & {
    expression: {
        left: ts.Identifier;
        right: ts.Expression;
    };
};
/**
 * Test whether a statement node is an assignment statement.
 * @param statement the statement to test.
 */
export declare function isAssignmentStatement(statement: ts.Statement): statement is AssignmentStatement;
export declare function isAssignment(expression: ts.Expression): expression is ts.AssignmentExpression<ts.EqualsToken>;
/**
 * The type of a function that can be used to filter out helpers based on their target.
 * This is used in `reflectDecoratorsFromHelperCall()`.
 */
export declare type TargetFilter = (target: ts.Expression) => boolean;
/**
 * Creates a function that tests whether the given expression is a class target.
 * @param className the name of the class we want to target.
 */
export declare function makeClassTargetFilter(className: string): TargetFilter;
/**
 * Creates a function that tests whether the given expression is a class member target.
 * @param className the name of the class we want to target.
 */
export declare function makeMemberTargetFilter(className: string): TargetFilter;
/**
 * Helper method to extract the value of a property given the property's "symbol",
 * which is actually the symbol of the identifier of the property.
 */
export declare function getPropertyValueFromSymbol(propSymbol: ts.Symbol): ts.Expression | undefined;

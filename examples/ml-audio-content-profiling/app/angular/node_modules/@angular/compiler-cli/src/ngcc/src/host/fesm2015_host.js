/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/src/ngcc/src/host/fesm2015_host", ["require", "exports", "tslib", "typescript", "@angular/compiler-cli/src/ngtsc/host", "@angular/compiler-cli/src/ngtsc/metadata", "@angular/compiler-cli/src/ngcc/src/utils", "@angular/compiler-cli/src/ngcc/src/host/decorated_class", "@angular/compiler-cli/src/ngcc/src/host/decorated_file", "@angular/compiler-cli/src/ngcc/src/host/ngcc_host"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var ts = require("typescript");
    var host_1 = require("@angular/compiler-cli/src/ngtsc/host");
    var metadata_1 = require("@angular/compiler-cli/src/ngtsc/metadata");
    var utils_1 = require("@angular/compiler-cli/src/ngcc/src/utils");
    var decorated_class_1 = require("@angular/compiler-cli/src/ngcc/src/host/decorated_class");
    var decorated_file_1 = require("@angular/compiler-cli/src/ngcc/src/host/decorated_file");
    var ngcc_host_1 = require("@angular/compiler-cli/src/ngcc/src/host/ngcc_host");
    exports.DECORATORS = 'decorators';
    exports.PROP_DECORATORS = 'propDecorators';
    exports.CONSTRUCTOR = '__constructor';
    exports.CONSTRUCTOR_PARAMS = 'ctorParameters';
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
    var Fesm2015ReflectionHost = /** @class */ (function (_super) {
        tslib_1.__extends(Fesm2015ReflectionHost, _super);
        function Fesm2015ReflectionHost(isCore, checker) {
            var _this = _super.call(this, checker) || this;
            _this.isCore = isCore;
            return _this;
        }
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
        Fesm2015ReflectionHost.prototype.getDecoratorsOfDeclaration = function (declaration) {
            var symbol = this.getClassSymbol(declaration);
            if (!symbol) {
                return null;
            }
            var decoratorsProperty = this.getStaticProperty(symbol, exports.DECORATORS);
            if (decoratorsProperty) {
                return this.getClassDecoratorsFromStaticProperty(decoratorsProperty);
            }
            else {
                return this.getClassDecoratorsFromHelperCall(symbol);
            }
        };
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
        Fesm2015ReflectionHost.prototype.getMembersOfClass = function (clazz) {
            var _this = this;
            var members = [];
            var symbol = this.getClassSymbol(clazz);
            if (!symbol) {
                throw new Error("Attempted to get members of a non-class: \"" + clazz.getText() + "\"");
            }
            // The decorators map contains all the properties that are decorated
            var decoratorsMap = this.getMemberDecorators(symbol);
            // The member map contains all the method (instance and static); and any instance properties
            // that are initialized in the class.
            if (symbol.members) {
                symbol.members.forEach(function (value, key) {
                    var decorators = removeFromMap(decoratorsMap, key);
                    var member = _this.reflectMember(value, decorators);
                    if (member) {
                        members.push(member);
                    }
                });
            }
            // The static property map contains all the static properties
            if (symbol.exports) {
                symbol.exports.forEach(function (value, key) {
                    var decorators = removeFromMap(decoratorsMap, key);
                    var member = _this.reflectMember(value, decorators, true);
                    if (member) {
                        members.push(member);
                    }
                });
            }
            // If this class was declared as a VariableDeclaration then it may have static properties
            // attached to the variable rather than the class itself
            // For example:
            // ```
            // let MyClass = class MyClass {
            //   // no static properties here!
            // }
            // MyClass.staticProperty = ...;
            // ```
            if (ts.isVariableDeclaration(symbol.valueDeclaration.parent)) {
                var variableSymbol = this.checker.getSymbolAtLocation(symbol.valueDeclaration.parent.name);
                if (variableSymbol && variableSymbol.exports) {
                    variableSymbol.exports.forEach(function (value, key) {
                        var decorators = removeFromMap(decoratorsMap, key);
                        var member = _this.reflectMember(value, decorators, true);
                        if (member) {
                            members.push(member);
                        }
                    });
                }
            }
            // Deal with any decorated properties that were not initialized in the class
            decoratorsMap.forEach(function (value, key) {
                members.push({
                    implementation: null,
                    decorators: value,
                    isStatic: false,
                    kind: host_1.ClassMemberKind.Property,
                    name: key,
                    nameNode: null,
                    node: null,
                    type: null,
                    value: null
                });
            });
            return members;
        };
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
        Fesm2015ReflectionHost.prototype.getConstructorParameters = function (clazz) {
            var classSymbol = this.getClassSymbol(clazz);
            if (!classSymbol) {
                throw new Error("Attempted to get constructor parameters of a non-class: \"" + clazz.getText() + "\"");
            }
            var parameterNodes = this.getConstructorParameterDeclarations(classSymbol);
            if (parameterNodes) {
                return this.getConstructorParamInfo(classSymbol, parameterNodes);
            }
            return null;
        };
        /**
         * Find a symbol for a node that we think is a class.
         * @param node the node whose symbol we are finding.
         * @returns the symbol for the node or `undefined` if it is not a "class" or has no symbol.
         */
        Fesm2015ReflectionHost.prototype.getClassSymbol = function (declaration) {
            if (ts.isClassDeclaration(declaration)) {
                return declaration.name && this.checker.getSymbolAtLocation(declaration.name);
            }
            if (ts.isVariableDeclaration(declaration) && declaration.initializer &&
                ts.isClassExpression(declaration.initializer)) {
                return declaration.initializer.name &&
                    this.checker.getSymbolAtLocation(declaration.initializer.name);
            }
            return undefined;
        };
        /**
         * Search the given module for variable declarations in which the initializer
         * is an identifier marked with the `PRE_NGCC_MARKER`.
         * @param module the module in which to search for switchable declarations.
         * @returns an array of variable declarations that match.
         */
        Fesm2015ReflectionHost.prototype.getSwitchableDeclarations = function (module) {
            // Don't bother to walk the AST if the marker is not found in the text
            return module.getText().indexOf(ngcc_host_1.PRE_NGCC_MARKER) >= 0 ?
                utils_1.findAll(module, ngcc_host_1.isSwitchableVariableDeclaration) :
                [];
        };
        Fesm2015ReflectionHost.prototype.getVariableValue = function (declaration) {
            var value = _super.prototype.getVariableValue.call(this, declaration);
            if (value) {
                return value;
            }
            // We have a variable declaration that has no initializer. For example:
            //
            // ```
            // var HttpClientXsrfModule_1;
            // ```
            //
            // So look for the special scenario where the variable is being assigned in
            // a nearby statement to the return value of a call to `__decorate`.
            // Then find the 2nd argument of that call, the "target", which will be the
            // actual class identifier. For example:
            //
            // ```
            // HttpClientXsrfModule = HttpClientXsrfModule_1 = tslib_1.__decorate([
            //   NgModule({
            //     providers: [],
            //   })
            // ], HttpClientXsrfModule);
            // ```
            //
            // And finally, find the declaration of the identifier in that argument.
            // Note also that the assignment can occur within another assignment.
            //
            var block = declaration.parent.parent.parent;
            var symbol = this.checker.getSymbolAtLocation(declaration.name);
            if (symbol && (ts.isBlock(block) || ts.isSourceFile(block))) {
                var decorateCall = this.findDecoratedVariableValue(block, symbol);
                var target = decorateCall && decorateCall.arguments[1];
                if (target && ts.isIdentifier(target)) {
                    var targetSymbol = this.checker.getSymbolAtLocation(target);
                    var targetDeclaration = targetSymbol && targetSymbol.valueDeclaration;
                    if (targetDeclaration) {
                        if (ts.isClassDeclaration(targetDeclaration) ||
                            ts.isFunctionDeclaration(targetDeclaration)) {
                            // The target is just a function or class declaration
                            // so return its identifier as the variable value.
                            return targetDeclaration.name || null;
                        }
                        else if (ts.isVariableDeclaration(targetDeclaration)) {
                            // The target is a variable declaration, so find the far right expression,
                            // in the case of multiple assignments (e.g. `var1 = var2 = value`).
                            var targetValue = targetDeclaration.initializer;
                            while (targetValue && isAssignment(targetValue)) {
                                targetValue = targetValue.right;
                            }
                            if (targetValue) {
                                return targetValue;
                            }
                        }
                    }
                }
            }
            return null;
        };
        /**
         * Determine if an identifier was imported from another module and return `Import` metadata
         * describing its origin.
         *
         * @param id a TypeScript `ts.Identifer` to reflect.
         *
         * @returns metadata about the `Import` if the identifier was imported from another module, or
         * `null` if the identifier doesn't resolve to an import but instead is locally defined.
         */
        Fesm2015ReflectionHost.prototype.getImportOfIdentifier = function (id) {
            return _super.prototype.getImportOfIdentifier.call(this, id) || this.getImportOfNamespacedIdentifier(id);
        };
        /*
         * Find all the files accessible via an entry-point, that contain decorated classes.
         * @param entryPoint The starting point file for finding files that contain decorated classes.
         * @returns A collection of files objects that hold info about the decorated classes and import
         * information.
         */
        Fesm2015ReflectionHost.prototype.findDecoratedFiles = function (entryPoint) {
            var _this = this;
            var moduleSymbol = this.checker.getSymbolAtLocation(entryPoint);
            var map = new Map();
            if (moduleSymbol) {
                var exportedSymbols = this.checker.getExportsOfModule(moduleSymbol).map(utils_1.getOriginalSymbol(this.checker));
                var exportedDeclarations = exportedSymbols.map(function (exportSymbol) { return exportSymbol.valueDeclaration; }).filter(utils_1.isDefined);
                var decoratedClasses = exportedDeclarations
                    .map(function (declaration) {
                    if (ts.isClassDeclaration(declaration) || ts.isVariableDeclaration(declaration)) {
                        var name_1 = declaration.name && ts.isIdentifier(declaration.name) ?
                            declaration.name.text :
                            undefined;
                        var decorators = _this.getDecoratorsOfDeclaration(declaration);
                        return decorators && utils_1.isDefined(name_1) ?
                            new decorated_class_1.DecoratedClass(name_1, declaration, decorators) :
                            undefined;
                    }
                    return undefined;
                })
                    .filter(utils_1.isDefined);
                decoratedClasses.forEach(function (clazz) {
                    var file = clazz.declaration.getSourceFile();
                    if (!map.has(file)) {
                        map.set(file, new decorated_file_1.DecoratedFile(file));
                    }
                    map.get(file).decoratedClasses.push(clazz);
                });
            }
            return map;
        };
        ///////////// Protected Helpers /////////////
        /**
         * Walk the AST looking for an assignment to the specified symbol.
         * @param node The current node we are searching.
         * @returns an expression that represents the value of the variable, or undefined if none can be
         * found.
         */
        Fesm2015ReflectionHost.prototype.findDecoratedVariableValue = function (node, symbol) {
            var _this = this;
            if (!node) {
                return null;
            }
            if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
                var left = node.left;
                var right = node.right;
                if (ts.isIdentifier(left) && this.checker.getSymbolAtLocation(left) === symbol) {
                    return (ts.isCallExpression(right) && getCalleeName(right) === '__decorate') ? right : null;
                }
                return this.findDecoratedVariableValue(right, symbol);
            }
            return node.forEachChild(function (node) { return _this.findDecoratedVariableValue(node, symbol); }) || null;
        };
        /**
         * Try to retrieve the symbol of a static property on a class.
         * @param symbol the class whose property we are interested in.
         * @param propertyName the name of static property.
         * @returns the symbol if it is found or `undefined` if not.
         */
        Fesm2015ReflectionHost.prototype.getStaticProperty = function (symbol, propertyName) {
            return symbol.exports && symbol.exports.get(propertyName);
        };
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
        Fesm2015ReflectionHost.prototype.getClassDecoratorsFromStaticProperty = function (decoratorsSymbol) {
            var _this = this;
            var decoratorsIdentifier = decoratorsSymbol.valueDeclaration;
            if (decoratorsIdentifier && decoratorsIdentifier.parent) {
                if (ts.isBinaryExpression(decoratorsIdentifier.parent) &&
                    decoratorsIdentifier.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
                    // AST of the array of decorator values
                    var decoratorsArray = decoratorsIdentifier.parent.right;
                    return this.reflectDecorators(decoratorsArray)
                        .filter(function (decorator) { return _this.isFromCore(decorator); });
                }
            }
            return null;
        };
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
        Fesm2015ReflectionHost.prototype.getClassDecoratorsFromHelperCall = function (symbol) {
            var _this = this;
            var decorators = [];
            var helperCalls = this.getHelperCallsForClass(symbol, '__decorate');
            helperCalls.forEach(function (helperCall) {
                var classDecorators = _this.reflectDecoratorsFromHelperCall(helperCall, makeClassTargetFilter(symbol.name)).classDecorators;
                classDecorators.filter(function (decorator) { return _this.isFromCore(decorator); })
                    .forEach(function (decorator) { return decorators.push(decorator); });
            });
            return decorators.length ? decorators : null;
        };
        /**
         * Get all the member decorators for the given class.
         * @param classSymbol the class whose member decorators we are interested in.
         * @returns a map whose keys are the name of the members and whose values are collections of
         * decorators for the given member.
         */
        Fesm2015ReflectionHost.prototype.getMemberDecorators = function (classSymbol) {
            var decoratorsProperty = this.getStaticProperty(classSymbol, exports.PROP_DECORATORS);
            if (decoratorsProperty) {
                return this.getMemberDecoratorsFromStaticProperty(decoratorsProperty);
            }
            else {
                return this.getMemberDecoratorsFromHelperCalls(classSymbol);
            }
        };
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
        Fesm2015ReflectionHost.prototype.getMemberDecoratorsFromStaticProperty = function (decoratorsProperty) {
            var _this = this;
            var memberDecorators = new Map();
            // Symbol of the identifier for `SomeDirective.propDecorators`.
            var propDecoratorsMap = getPropertyValueFromSymbol(decoratorsProperty);
            if (propDecoratorsMap && ts.isObjectLiteralExpression(propDecoratorsMap)) {
                var propertiesMap = metadata_1.reflectObjectLiteral(propDecoratorsMap);
                propertiesMap.forEach(function (value, name) {
                    var decorators = _this.reflectDecorators(value).filter(function (decorator) { return _this.isFromCore(decorator); });
                    if (decorators.length) {
                        memberDecorators.set(name, decorators);
                    }
                });
            }
            return memberDecorators;
        };
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
        Fesm2015ReflectionHost.prototype.getMemberDecoratorsFromHelperCalls = function (classSymbol) {
            var _this = this;
            var memberDecoratorMap = new Map();
            var helperCalls = this.getHelperCallsForClass(classSymbol, '__decorate');
            helperCalls.forEach(function (helperCall) {
                var memberDecorators = _this.reflectDecoratorsFromHelperCall(helperCall, makeMemberTargetFilter(classSymbol.name)).memberDecorators;
                memberDecorators.forEach(function (decorators, memberName) {
                    if (memberName) {
                        var memberDecorators_1 = memberDecoratorMap.get(memberName) || [];
                        var coreDecorators = decorators.filter(function (decorator) { return _this.isFromCore(decorator); });
                        memberDecoratorMap.set(memberName, memberDecorators_1.concat(coreDecorators));
                    }
                });
            });
            return memberDecoratorMap;
        };
        /**
         * Extract decorator info from `__decorate` helper function calls.
         * @param helperCall the call to a helper that may contain decorator calls
         * @param targetFilter a function to filter out targets that we are not interested in.
         * @returns a mapping from member name to decorators, where the key is either the name of the
         * member or `undefined` if it refers to decorators on the class as a whole.
         */
        Fesm2015ReflectionHost.prototype.reflectDecoratorsFromHelperCall = function (helperCall, targetFilter) {
            var _this = this;
            var classDecorators = [];
            var memberDecorators = new Map();
            // First check that the `target` argument is correct
            if (targetFilter(helperCall.arguments[1])) {
                // Grab the `decorators` argument which should be an array of calls
                var decoratorCalls = helperCall.arguments[0];
                if (decoratorCalls && ts.isArrayLiteralExpression(decoratorCalls)) {
                    decoratorCalls.elements.forEach(function (element) {
                        // We only care about those elements that are actual calls
                        if (ts.isCallExpression(element)) {
                            var decorator = _this.reflectDecoratorCall(element);
                            if (decorator) {
                                var keyArg = helperCall.arguments[2];
                                var keyName = keyArg && ts.isStringLiteral(keyArg) ? keyArg.text : undefined;
                                if (keyName === undefined) {
                                    classDecorators.push(decorator);
                                }
                                else {
                                    var decorators = memberDecorators.get(keyName) || [];
                                    decorators.push(decorator);
                                    memberDecorators.set(keyName, decorators);
                                }
                            }
                        }
                    });
                }
            }
            return { classDecorators: classDecorators, memberDecorators: memberDecorators };
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
        Fesm2015ReflectionHost.prototype.reflectDecoratorCall = function (call) {
            // The call could be of the form `Decorator(...)` or `namespace_1.Decorator(...)`
            var decoratorExpression = ts.isPropertyAccessExpression(call.expression) ? call.expression.name : call.expression;
            if (ts.isIdentifier(decoratorExpression)) {
                // We found a decorator!
                var decoratorIdentifier = decoratorExpression;
                return {
                    name: decoratorIdentifier.text,
                    import: this.getImportOfIdentifier(decoratorIdentifier),
                    node: call,
                    args: Array.from(call.arguments)
                };
            }
            return null;
        };
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
        Fesm2015ReflectionHost.prototype.getHelperCall = function (statement, helperName) {
            if (ts.isExpressionStatement(statement)) {
                var expression = isAssignmentStatement(statement) ? statement.expression.right : statement.expression;
                if (ts.isCallExpression(expression) && getCalleeName(expression) === helperName) {
                    return expression;
                }
            }
            return null;
        };
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
        Fesm2015ReflectionHost.prototype.reflectDecorators = function (decoratorsArray) {
            var _this = this;
            var decorators = [];
            if (ts.isArrayLiteralExpression(decoratorsArray)) {
                // Add each decorator that is imported from `@angular/core` into the `decorators` array
                decoratorsArray.elements.forEach(function (node) {
                    // If the decorator is not an object literal expression then we are not interested
                    if (ts.isObjectLiteralExpression(node)) {
                        // We are only interested in objects of the form: `{ type: DecoratorType, args: [...] }`
                        var decorator = metadata_1.reflectObjectLiteral(node);
                        // Is the value of the `type` property an identifier?
                        var typeIdentifier = decorator.get('type');
                        if (typeIdentifier && ts.isIdentifier(typeIdentifier)) {
                            decorators.push({
                                name: typeIdentifier.text,
                                import: _this.getImportOfIdentifier(typeIdentifier), node: node,
                                args: getDecoratorArgs(node),
                            });
                        }
                    }
                });
            }
            return decorators;
        };
        /**
         * Reflect over a symbol and extract the member information, combining it with the
         * provided decorator information, and whether it is a static member.
         * @param symbol the symbol for the member to reflect over.
         * @param decorators an array of decorators associated with the member.
         * @param isStatic true if this member is static, false if it is an instance property.
         * @returns the reflected member information, or null if the symbol is not a member.
         */
        Fesm2015ReflectionHost.prototype.reflectMember = function (symbol, decorators, isStatic) {
            var kind = null;
            var value = null;
            var name = null;
            var nameNode = null;
            var type = null;
            var node = symbol.valueDeclaration || symbol.declarations && symbol.declarations[0];
            if (!node || !isClassMemberType(node)) {
                return null;
            }
            if (symbol.flags & ts.SymbolFlags.Method) {
                kind = host_1.ClassMemberKind.Method;
            }
            else if (symbol.flags & ts.SymbolFlags.Property) {
                kind = host_1.ClassMemberKind.Property;
            }
            else if (symbol.flags & ts.SymbolFlags.GetAccessor) {
                kind = host_1.ClassMemberKind.Getter;
            }
            else if (symbol.flags & ts.SymbolFlags.SetAccessor) {
                kind = host_1.ClassMemberKind.Setter;
            }
            if (isStatic && isPropertyAccess(node)) {
                name = node.name.text;
                value = symbol.flags & ts.SymbolFlags.Property ? node.parent.right : null;
            }
            else if (isThisAssignment(node)) {
                kind = host_1.ClassMemberKind.Property;
                name = node.left.name.text;
                value = node.right;
                isStatic = false;
            }
            else if (ts.isConstructorDeclaration(node)) {
                kind = host_1.ClassMemberKind.Constructor;
                name = 'constructor';
                isStatic = false;
            }
            if (kind === null) {
                console.warn("Unknown member type: \"" + node.getText());
                return null;
            }
            if (!name) {
                if (isNamedDeclaration(node) && node.name && ts.isIdentifier(node.name)) {
                    name = node.name.text;
                    nameNode = node.name;
                }
                else {
                    return null;
                }
            }
            // If we have still not determined if this is a static or instance member then
            // look for the `static` keyword on the declaration
            if (isStatic === undefined) {
                isStatic = node.modifiers !== undefined &&
                    node.modifiers.some(function (mod) { return mod.kind === ts.SyntaxKind.StaticKeyword; });
            }
            return {
                node: node,
                implementation: node, kind: kind, type: type, name: name, nameNode: nameNode, value: value, isStatic: isStatic,
                decorators: decorators || []
            };
        };
        /**
         * Find the declarations of the constructor parameters of a class identified by its symbol.
         * @param classSymbol the class whose parameters we want to find.
         * @returns an array of `ts.ParameterDeclaration` objects representing each of the parameters in
         * the class's constructor or null if there is no constructor.
         */
        Fesm2015ReflectionHost.prototype.getConstructorParameterDeclarations = function (classSymbol) {
            var constructorSymbol = classSymbol.members && classSymbol.members.get(exports.CONSTRUCTOR);
            if (constructorSymbol) {
                // For some reason the constructor does not have a `valueDeclaration` ?!?
                var constructor = constructorSymbol.declarations &&
                    constructorSymbol.declarations[0];
                if (constructor && constructor.parameters) {
                    return Array.from(constructor.parameters);
                }
                return [];
            }
            return null;
        };
        /**
         * Get the parameter decorators of a class constructor.
         *
         * @param classSymbol the class whose parameter info we want to get.
         * @param parameterNodes the array of TypeScript parameter nodes for this class's constructor.
         * @returns an array of constructor parameter info objects.
         */
        Fesm2015ReflectionHost.prototype.getConstructorParamInfo = function (classSymbol, parameterNodes) {
            var paramsProperty = this.getStaticProperty(classSymbol, exports.CONSTRUCTOR_PARAMS);
            var paramInfo = paramsProperty ?
                this.getParamInfoFromStaticProperty(paramsProperty) :
                this.getParamInfoFromHelperCall(classSymbol, parameterNodes);
            return parameterNodes.map(function (node, index) {
                var _a = paramInfo && paramInfo[index] ? paramInfo[index] : { decorators: null, type: null }, decorators = _a.decorators, type = _a.type;
                var nameNode = node.name;
                return { name: utils_1.getNameText(nameNode), nameNode: nameNode, type: type, decorators: decorators };
            });
        };
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
        Fesm2015ReflectionHost.prototype.getParamInfoFromStaticProperty = function (paramDecoratorsProperty) {
            var _this = this;
            var paramDecorators = getPropertyValueFromSymbol(paramDecoratorsProperty);
            if (paramDecorators && ts.isArrowFunction(paramDecorators)) {
                if (ts.isArrayLiteralExpression(paramDecorators.body)) {
                    var elements = paramDecorators.body.elements;
                    return elements
                        .map(function (element) {
                        return ts.isObjectLiteralExpression(element) ? metadata_1.reflectObjectLiteral(element) : null;
                    })
                        .map(function (paramInfo) {
                        var type = paramInfo && paramInfo.get('type') || null;
                        var decoratorInfo = paramInfo && paramInfo.get('decorators') || null;
                        var decorators = decoratorInfo &&
                            _this.reflectDecorators(decoratorInfo)
                                .filter(function (decorator) { return _this.isFromCore(decorator); });
                        return { type: type, decorators: decorators };
                    });
                }
            }
            return null;
        };
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
        Fesm2015ReflectionHost.prototype.getParamInfoFromHelperCall = function (classSymbol, parameterNodes) {
            var _this = this;
            var parameters = parameterNodes.map(function () { return ({ type: null, decorators: null }); });
            var helperCalls = this.getHelperCallsForClass(classSymbol, '__decorate');
            helperCalls.forEach(function (helperCall) {
                var classDecorators = _this.reflectDecoratorsFromHelperCall(helperCall, makeClassTargetFilter(classSymbol.name)).classDecorators;
                classDecorators.forEach(function (call) {
                    switch (call.name) {
                        case '__metadata':
                            var metadataArg = call.args && call.args[0];
                            var typesArg = call.args && call.args[1];
                            var isParamTypeDecorator = metadataArg && ts.isStringLiteral(metadataArg) &&
                                metadataArg.text === 'design:paramtypes';
                            var types = typesArg && ts.isArrayLiteralExpression(typesArg) && typesArg.elements;
                            if (isParamTypeDecorator && types) {
                                types.forEach(function (type, index) { return parameters[index].type = type; });
                            }
                            break;
                        case '__param':
                            var paramIndexArg = call.args && call.args[0];
                            var decoratorCallArg = call.args && call.args[1];
                            var paramIndex = paramIndexArg && ts.isNumericLiteral(paramIndexArg) ?
                                parseInt(paramIndexArg.text, 10) :
                                NaN;
                            var decorator = decoratorCallArg && ts.isCallExpression(decoratorCallArg) ?
                                _this.reflectDecoratorCall(decoratorCallArg) :
                                null;
                            if (!isNaN(paramIndex) && decorator) {
                                var decorators = parameters[paramIndex].decorators =
                                    parameters[paramIndex].decorators || [];
                                decorators.push(decorator);
                            }
                            break;
                    }
                });
            });
            return parameters;
        };
        /**
         * Search statements related to the given class for calls to the specified helper.
         * @param classSymbol the class whose helper calls we are interested in.
         * @param helperName the name of the helper (e.g. `__decorate`) whose calls we are interested in.
         * @returns an array of CallExpression nodes for each matching helper call.
         */
        Fesm2015ReflectionHost.prototype.getHelperCallsForClass = function (classSymbol, helperName) {
            var _this = this;
            return this.getStatementsForClass(classSymbol)
                .map(function (statement) { return _this.getHelperCall(statement, helperName); })
                .filter(utils_1.isDefined);
        };
        /**
         * Find statements related to the given class that may contain calls to a helper.
         *
         * In ESM2015 code the helper calls are in the top level module, so we have to consider
         * all the statements in the module.
         *
         * @param classSymbol the class whose helper calls we are interested in.
         * @returns an array of statements that may contain helper calls.
         */
        Fesm2015ReflectionHost.prototype.getStatementsForClass = function (classSymbol) {
            return Array.from(classSymbol.valueDeclaration.getSourceFile().statements);
        };
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
        Fesm2015ReflectionHost.prototype.getImportOfNamespacedIdentifier = function (id) {
            if (!(ts.isPropertyAccessExpression(id.parent) && id.parent.name === id)) {
                return null;
            }
            var namespaceIdentifier = getFarLeftIdentifier(id.parent);
            var namespaceSymbol = namespaceIdentifier && this.checker.getSymbolAtLocation(namespaceIdentifier);
            var declaration = namespaceSymbol && namespaceSymbol.declarations.length === 1 ?
                namespaceSymbol.declarations[0] :
                null;
            var namespaceDeclaration = declaration && ts.isNamespaceImport(declaration) ? declaration : null;
            if (!namespaceDeclaration) {
                return null;
            }
            var importDeclaration = namespaceDeclaration.parent.parent;
            if (!ts.isStringLiteral(importDeclaration.moduleSpecifier)) {
                // Should not happen as this would be invalid TypesScript
                return null;
            }
            return {
                from: importDeclaration.moduleSpecifier.text,
                name: id.text,
            };
        };
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
        Fesm2015ReflectionHost.prototype.isFromCore = function (decorator) {
            if (this.isCore) {
                return !decorator.import || /^\./.test(decorator.import.from);
            }
            else {
                return !!decorator.import && decorator.import.from === '@angular/core';
            }
        };
        return Fesm2015ReflectionHost;
    }(metadata_1.TypeScriptReflectionHost));
    exports.Fesm2015ReflectionHost = Fesm2015ReflectionHost;
    /**
     * Test whether a statement node is an assignment statement.
     * @param statement the statement to test.
     */
    function isAssignmentStatement(statement) {
        return ts.isExpressionStatement(statement) && isAssignment(statement.expression) &&
            ts.isIdentifier(statement.expression.left);
    }
    exports.isAssignmentStatement = isAssignmentStatement;
    function isAssignment(expression) {
        return ts.isBinaryExpression(expression) &&
            expression.operatorToken.kind === ts.SyntaxKind.EqualsToken;
    }
    exports.isAssignment = isAssignment;
    /**
     * Creates a function that tests whether the given expression is a class target.
     * @param className the name of the class we want to target.
     */
    function makeClassTargetFilter(className) {
        return function (target) { return ts.isIdentifier(target) && target.text === className; };
    }
    exports.makeClassTargetFilter = makeClassTargetFilter;
    /**
     * Creates a function that tests whether the given expression is a class member target.
     * @param className the name of the class we want to target.
     */
    function makeMemberTargetFilter(className) {
        return function (target) { return ts.isPropertyAccessExpression(target) &&
            ts.isIdentifier(target.expression) && target.expression.text === className &&
            target.name.text === 'prototype'; };
    }
    exports.makeMemberTargetFilter = makeMemberTargetFilter;
    /**
     * Helper method to extract the value of a property given the property's "symbol",
     * which is actually the symbol of the identifier of the property.
     */
    function getPropertyValueFromSymbol(propSymbol) {
        var propIdentifier = propSymbol.valueDeclaration;
        var parent = propIdentifier && propIdentifier.parent;
        return parent && ts.isBinaryExpression(parent) ? parent.right : undefined;
    }
    exports.getPropertyValueFromSymbol = getPropertyValueFromSymbol;
    /**
     * A callee could be one of: `__decorate(...)` or `tslib_1.__decorate`.
     */
    function getCalleeName(call) {
        if (ts.isIdentifier(call.expression)) {
            return call.expression.text;
        }
        if (ts.isPropertyAccessExpression(call.expression)) {
            return call.expression.name.text;
        }
        return null;
    }
    ///////////// Internal Helpers /////////////
    function getDecoratorArgs(node) {
        // The arguments of a decorator are held in the `args` property of its declaration object.
        var argsProperty = node.properties.filter(ts.isPropertyAssignment)
            .find(function (property) { return utils_1.getNameText(property.name) === 'args'; });
        var argsExpression = argsProperty && argsProperty.initializer;
        return argsExpression && ts.isArrayLiteralExpression(argsExpression) ?
            Array.from(argsExpression.elements) :
            [];
    }
    function removeFromMap(map, key) {
        var mapKey = key;
        var value = map.get(mapKey);
        if (value !== undefined) {
            map.delete(mapKey);
        }
        return value;
    }
    function isPropertyAccess(node) {
        return !!node.parent && ts.isBinaryExpression(node.parent) && ts.isPropertyAccessExpression(node);
    }
    function isThisAssignment(node) {
        return ts.isBinaryExpression(node) && ts.isPropertyAccessExpression(node.left) &&
            node.left.expression.kind === ts.SyntaxKind.ThisKeyword;
    }
    function isNamedDeclaration(node) {
        return !!node.name;
    }
    function isClassMemberType(node) {
        return ts.isClassElement(node) || isPropertyAccess(node) || ts.isBinaryExpression(node);
    }
    /**
     * Compute the left most identifier in a property access chain. E.g. the `a` of `a.b.c.d`.
     * @param propertyAccess The starting property access expression from which we want to compute
     * the left most identifier.
     * @returns the left most identifier in the chain or `null` if it is not an identifier.
     */
    function getFarLeftIdentifier(propertyAccess) {
        while (ts.isPropertyAccessExpression(propertyAccess.expression)) {
            propertyAccess = propertyAccess.expression;
        }
        return ts.isIdentifier(propertyAccess.expression) ? propertyAccess.expression : null;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmVzbTIwMTVfaG9zdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyLWNsaS9zcmMvbmdjYy9zcmMvaG9zdC9mZXNtMjAxNV9ob3N0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUdILCtCQUFpQztJQUVqQyw2REFBbUc7SUFDbkcscUVBQXVGO0lBQ3ZGLGtFQUE0RTtJQUU1RSwyRkFBaUQ7SUFDakQseUZBQStDO0lBQy9DLCtFQUFnSTtJQUVuSCxRQUFBLFVBQVUsR0FBRyxZQUEyQixDQUFDO0lBQ3pDLFFBQUEsZUFBZSxHQUFHLGdCQUErQixDQUFDO0lBQ2xELFFBQUEsV0FBVyxHQUFHLGVBQThCLENBQUM7SUFDN0MsUUFBQSxrQkFBa0IsR0FBRyxnQkFBK0IsQ0FBQztJQUVsRTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7T0EwQkc7SUFDSDtRQUE0QyxrREFBd0I7UUFDbEUsZ0NBQXNCLE1BQWUsRUFBRSxPQUF1QjtZQUE5RCxZQUFrRSxrQkFBTSxPQUFPLENBQUMsU0FBRztZQUE3RCxZQUFNLEdBQU4sTUFBTSxDQUFTOztRQUE2QyxDQUFDO1FBRW5GOzs7Ozs7Ozs7Ozs7V0FZRztRQUNILDJEQUEwQixHQUExQixVQUEyQixXQUEyQjtZQUNwRCxJQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ2hELElBQUksQ0FBQyxNQUFNLEVBQUU7Z0JBQ1gsT0FBTyxJQUFJLENBQUM7YUFDYjtZQUNELElBQU0sa0JBQWtCLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxrQkFBVSxDQUFDLENBQUM7WUFDdEUsSUFBSSxrQkFBa0IsRUFBRTtnQkFDdEIsT0FBTyxJQUFJLENBQUMsb0NBQW9DLENBQUMsa0JBQWtCLENBQUMsQ0FBQzthQUN0RTtpQkFBTTtnQkFD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UUFFckMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sSUFBSSxFQUFFLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQywwQkFBMEIsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNwRyxDQUFDO0lBRUQsU0FBUyxnQkFBZ0IsQ0FBQyxJQUFvQjtRQUU1QyxPQUFPLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsMEJBQTBCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztZQUMxRSxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUM7SUFDOUQsQ0FBQztJQUVELFNBQVMsa0JBQWtCLENBQUMsSUFBb0I7UUFDOUMsT0FBTyxDQUFDLENBQUUsSUFBWSxDQUFDLElBQUksQ0FBQztJQUM5QixDQUFDO0lBR0QsU0FBUyxpQkFBaUIsQ0FBQyxJQUFvQjtRQUU3QyxPQUFPLEVBQUUsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksZ0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzFGLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILFNBQVMsb0JBQW9CLENBQUMsY0FBMkM7UUFDdkUsT0FBTyxFQUFFLENBQUMsMEJBQTBCLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQy9ELGNBQWMsR0FBRyxjQUFjLENBQUMsVUFBVSxDQUFDO1NBQzVDO1FBQ0QsT0FBTyxFQUFFLENBQUMsWUFBWSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ3ZGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7bm9ybWFsaXplfSBmcm9tICdjYW5vbmljYWwtcGF0aCc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtDbGFzc01lbWJlciwgQ2xhc3NNZW1iZXJLaW5kLCBDdG9yUGFyYW1ldGVyLCBEZWNvcmF0b3IsIEltcG9ydH0gZnJvbSAnLi4vLi4vLi4vbmd0c2MvaG9zdCc7XG5pbXBvcnQge1R5cGVTY3JpcHRSZWZsZWN0aW9uSG9zdCwgcmVmbGVjdE9iamVjdExpdGVyYWx9IGZyb20gJy4uLy4uLy4uL25ndHNjL21ldGFkYXRhJztcbmltcG9ydCB7ZmluZEFsbCwgZ2V0TmFtZVRleHQsIGdldE9yaWdpbmFsU3ltYm9sLCBpc0RlZmluZWR9IGZyb20gJy4uL3V0aWxzJztcblxuaW1wb3J0IHtEZWNvcmF0ZWRDbGFzc30gZnJvbSAnLi9kZWNvcmF0ZWRfY2xhc3MnO1xuaW1wb3J0IHtEZWNvcmF0ZWRGaWxlfSBmcm9tICcuL2RlY29yYXRlZF9maWxlJztcbmltcG9ydCB7TmdjY1JlZmxlY3Rpb25Ib3N0LCBQUkVfTkdDQ19NQVJLRVIsIFN3aXRjaGFibGVWYXJpYWJsZURlY2xhcmF0aW9uLCBpc1N3aXRjaGFibGVWYXJpYWJsZURlY2xhcmF0aW9ufSBmcm9tICcuL25nY2NfaG9zdCc7XG5cbmV4cG9ydCBjb25zdCBERUNPUkFUT1JTID0gJ2RlY29yYXRvcnMnIGFzIHRzLl9fU3RyaW5nO1xuZXhwb3J0IGNvbnN0IFBST1BfREVDT1JBVE9SUyA9ICdwcm9wRGVjb3JhdG9ycycgYXMgdHMuX19TdHJpbmc7XG5leHBvcnQgY29uc3QgQ09OU1RSVUNUT1IgPSAnX19jb25zdHJ1Y3RvcicgYXMgdHMuX19TdHJpbmc7XG5leHBvcnQgY29uc3QgQ09OU1RSVUNUT1JfUEFSQU1TID0gJ2N0b3JQYXJhbWV0ZXJzJyBhcyB0cy5fX1N0cmluZztcblxuLyoqXG4gKiBFc20yMDE1IHBhY2thZ2VzIGNvbnRhaW4gRUNNQVNjcmlwdCAyMDE1IGNsYXNzZXMsIGV0Yy5cbiAqIERlY29yYXRvcnMgYXJlIGRlZmluZWQgdmlhIHN0YXRpYyBwcm9wZXJ0aWVzIG9uIHRoZSBjbGFzcy4gRm9yIGV4YW1wbGU6XG4gKlxuICogYGBgXG4gKiBjbGFzcyBTb21lRGlyZWN0aXZlIHtcbiAqIH1cbiAqIFNvbWVEaXJlY3RpdmUuZGVjb3JhdG9ycyA9IFtcbiAqICAgeyB0eXBlOiBEaXJlY3RpdmUsIGFyZ3M6IFt7IHNlbGVjdG9yOiAnW3NvbWVEaXJlY3RpdmVdJyB9LF0gfVxuICogXTtcbiAqIFNvbWVEaXJlY3RpdmUuY3RvclBhcmFtZXRlcnMgPSAoKSA9PiBbXG4gKiAgIHsgdHlwZTogVmlld0NvbnRhaW5lclJlZiwgfSxcbiAqICAgeyB0eXBlOiBUZW1wbGF0ZVJlZiwgfSxcbiAqICAgeyB0eXBlOiB1bmRlZmluZWQsIGRlY29yYXRvcnM6IFt7IHR5cGU6IEluamVjdCwgYXJnczogW0lOSkVDVEVEX1RPS0VOLF0gfSxdIH0sXG4gKiBdO1xuICogU29tZURpcmVjdGl2ZS5wcm9wRGVjb3JhdG9ycyA9IHtcbiAqICAgXCJpbnB1dDFcIjogW3sgdHlwZTogSW5wdXQgfSxdLFxuICogICBcImlucHV0MlwiOiBbeyB0eXBlOiBJbnB1dCB9LF0sXG4gKiB9O1xuICogYGBgXG4gKlxuICogKiBDbGFzc2VzIGFyZSBkZWNvcmF0ZWQgaWYgdGhleSBoYXZlIGEgc3RhdGljIHByb3BlcnR5IGNhbGxlZCBgZGVjb3JhdG9yc2AuXG4gKiAqIE1lbWJlcnMgYXJlIGRlY29yYXRlZCBpZiB0aGVyZSBpcyBhIG1hdGNoaW5nIGtleSBvbiBhIHN0YXRpYyBwcm9wZXJ0eVxuICogICBjYWxsZWQgYHByb3BEZWNvcmF0b3JzYC5cbiAqICogQ29uc3RydWN0b3IgcGFyYW1ldGVycyBkZWNvcmF0b3JzIGFyZSBmb3VuZCBvbiBhbiBvYmplY3QgcmV0dXJuZWQgZnJvbVxuICogICBhIHN0YXRpYyBtZXRob2QgY2FsbGVkIGBjdG9yUGFyYW1ldGVyc2AuXG4gKi9cbmV4cG9ydCBjbGFzcyBGZXNtMjAxNVJlZmxlY3Rpb25Ib3N0IGV4dGVuZHMgVHlwZVNjcmlwdFJlZmxlY3Rpb25Ib3N0IGltcGxlbWVudHMgTmdjY1JlZmxlY3Rpb25Ib3N0IHtcbiAgY29uc3RydWN0b3IocHJvdGVjdGVkIGlzQ29yZTogYm9vbGVhbiwgY2hlY2tlcjogdHMuVHlwZUNoZWNrZXIpIHsgc3VwZXIoY2hlY2tlcik7IH1cblxuICAvKipcbiAgICogRXhhbWluZSBhIGRlY2xhcmF0aW9uIChmb3IgZXhhbXBsZSwgb2YgYSBjbGFzcyBvciBmdW5jdGlvbikgYW5kIHJldHVybiBtZXRhZGF0YSBhYm91dCBhbnlcbiAgICogZGVjb3JhdG9ycyBwcmVzZW50IG9uIHRoZSBkZWNsYXJhdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIGRlY2xhcmF0aW9uIGEgVHlwZVNjcmlwdCBgdHMuRGVjbGFyYXRpb25gIG5vZGUgcmVwcmVzZW50aW5nIHRoZSBjbGFzcyBvciBmdW5jdGlvbiBvdmVyXG4gICAqIHdoaWNoIHRvIHJlZmxlY3QuIEZvciBleGFtcGxlLCBpZiB0aGUgaW50ZW50IGlzIHRvIHJlZmxlY3QgdGhlIGRlY29yYXRvcnMgb2YgYSBjbGFzcyBhbmQgdGhlXG4gICAqIHNvdXJjZSBpcyBpbiBFUzYgZm9ybWF0LCB0aGlzIHdpbGwgYmUgYSBgdHMuQ2xhc3NEZWNsYXJhdGlvbmAgbm9kZS4gSWYgdGhlIHNvdXJjZSBpcyBpbiBFUzVcbiAgICogZm9ybWF0LCB0aGlzIG1pZ2h0IGJlIGEgYHRzLlZhcmlhYmxlRGVjbGFyYXRpb25gIGFzIGNsYXNzZXMgaW4gRVM1IGFyZSByZXByZXNlbnRlZCBhcyB0aGVcbiAgICogcmVzdWx0IG9mIGFuIElJRkUgZXhlY3V0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBhbiBhcnJheSBvZiBgRGVjb3JhdG9yYCBtZXRhZGF0YSBpZiBkZWNvcmF0b3JzIGFyZSBwcmVzZW50IG9uIHRoZSBkZWNsYXJhdGlvbiwgb3JcbiAgICogYG51bGxgIGlmIGVpdGhlciBubyBkZWNvcmF0b3JzIHdlcmUgcHJlc2VudCBvciBpZiB0aGUgZGVjbGFyYXRpb24gaXMgbm90IG9mIGEgZGVjb3JhdGFibGUgdHlwZS5cbiAgICovXG4gIGdldERlY29yYXRvcnNPZkRlY2xhcmF0aW9uKGRlY2xhcmF0aW9uOiB0cy5EZWNsYXJhdGlvbik6IERlY29yYXRvcltdfG51bGwge1xuICAgIGNvbnN0IHN5bWJvbCA9IHRoaXMuZ2V0Q2xhc3NTeW1ib2woZGVjbGFyYXRpb24pO1xuICAgIGlmICghc3ltYm9sKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgZGVjb3JhdG9yc1Byb3BlcnR5ID0gdGhpcy5nZXRTdGF0aWNQcm9wZXJ0eShzeW1ib2wsIERFQ09SQVRPUlMpO1xuICAgIGlmIChkZWNvcmF0b3JzUHJvcGVydHkpIHtcbiAgICAgIHJldHVybiB0aGlzLmdldENsYXNzRGVjb3JhdG9yc0Zyb21TdGF0aWNQcm9wZXJ0eShkZWNvcmF0b3JzUHJvcGVydHkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5nZXRDbGFzc0RlY29yYXRvcnNGcm9tSGVscGVyQ2FsbChzeW1ib2wpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBFeGFtaW5lIGEgZGVjbGFyYXRpb24gd2hpY2ggc2hvdWxkIGJlIG9mIGEgY2xhc3MsIGFuZCByZXR1cm4gbWV0YWRhdGEgYWJvdXQgdGhlIG1lbWJlcnMgb2YgdGhlXG4gICAqIGNsYXNzLlxuICAgKlxuICAgKiBAcGFyYW0gZGVjbGFyYXRpb24gYSBUeXBlU2NyaXB0IGB0cy5EZWNsYXJhdGlvbmAgbm9kZSByZXByZXNlbnRpbmcgdGhlIGNsYXNzIG92ZXIgd2hpY2ggdG9cbiAgICogcmVmbGVjdC4gSWYgdGhlIHNvdXJjZSBpcyBpbiBFUzYgZm9ybWF0LCB0aGlzIHdpbGwgYmUgYSBgdHMuQ2xhc3NEZWNsYXJhdGlvbmAgbm9kZS4gSWYgdGhlXG4gICAqIHNvdXJjZSBpcyBpbiBFUzUgZm9ybWF0LCB0aGlzIG1pZ2h0IGJlIGEgYHRzLlZhcmlhYmxlRGVjbGFyYXRpb25gIGFzIGNsYXNzZXMgaW4gRVM1IGFyZVxuICAgKiByZXByZXNlbnRlZCBhcyB0aGUgcmVzdWx0IG9mIGFuIElJRkUgZXhlY3V0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBhbiBhcnJheSBvZiBgQ2xhc3NNZW1iZXJgIG1ldGFkYXRhIHJlcHJlc2VudGluZyB0aGUgbWVtYmVycyBvZiB0aGUgY2xhc3MuXG4gICAqXG4gICAqIEB0aHJvd3MgaWYgYGRlY2xhcmF0aW9uYCBkb2VzIG5vdCByZXNvbHZlIHRvIGEgY2xhc3MgZGVjbGFyYXRpb24uXG4gICAqL1xuICBnZXRNZW1iZXJzT2ZDbGFzcyhjbGF6ejogdHMuRGVjbGFyYXRpb24pOiBDbGFzc01lbWJlcltdIHtcbiAgICBjb25zdCBtZW1iZXJzOiBDbGFzc01lbWJlcltdID0gW107XG4gICAgY29uc3Qgc3ltYm9sID0gdGhpcy5nZXRDbGFzc1N5bWJvbChjbGF6eik7XG4gICAgaWYgKCFzeW1ib2wpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQXR0ZW1wdGVkIHRvIGdldCBtZW1iZXJzIG9mIGEgbm9uLWNsYXNzOiBcIiR7Y2xhenouZ2V0VGV4dCgpfVwiYCk7XG4gICAgfVxuXG4gICAgLy8gVGhlIGRlY29yYXRvcnMgbWFwIGNvbnRhaW5zIGFsbCB0aGUgcHJvcGVydGllcyB0aGF0IGFyZSBkZWNvcmF0ZWRcbiAgICBjb25zdCBkZWNvcmF0b3JzTWFwID0gdGhpcy5nZXRNZW1iZXJEZWNvcmF0b3JzKHN5bWJvbCk7XG5cbiAgICAvLyBUaGUgbWVtYmVyIG1hcCBjb250YWlucyBhbGwgdGhlIG1ldGhvZCAoaW5zdGFuY2UgYW5kIHN0YXRpYyk7IGFuZCBhbnkgaW5zdGFuY2UgcHJvcGVydGllc1xuICAgIC8vIHRoYXQgYXJlIGluaXRpYWxpemVkIGluIHRoZSBjbGFzcy5cbiAgICBpZiAoc3ltYm9sLm1lbWJlcnMpIHtcbiAgICAgIHN5bWJvbC5tZW1iZXJzLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgICAgY29uc3QgZGVjb3JhdG9ycyA9IHJlbW92ZUZyb21NYXAoZGVjb3JhdG9yc01hcCwga2V5KTtcbiAgICAgICAgY29uc3QgbWVtYmVyID0gdGhpcy5yZWZsZWN0TWVtYmVyKHZhbHVlLCBkZWNvcmF0b3JzKTtcbiAgICAgICAgaWYgKG1lbWJlcikge1xuICAgICAgICAgIG1lbWJlcnMucHVzaChtZW1iZXIpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBUaGUgc3RhdGljIHByb3BlcnR5IG1hcCBjb250YWlucyBhbGwgdGhlIHN0YXRpYyBwcm9wZXJ0aWVzXG4gICAgaWYgKHN5bWJvbC5leHBvcnRzKSB7XG4gICAgICBzeW1ib2wuZXhwb3J0cy5mb3JFYWNoKCh2YWx1ZSwga2V5KSA9PiB7XG4gICAgICAgIGNvbnN0IGRlY29yYXRvcnMgPSByZW1vdmVGcm9tTWFwKGRlY29yYXRvcnNNYXAsIGtleSk7XG4gICAgICAgIGNvbnN0IG1lbWJlciA9IHRoaXMucmVmbGVjdE1lbWJlcih2YWx1ZSwgZGVjb3JhdG9ycywgdHJ1ZSk7XG4gICAgICAgIGlmIChtZW1iZXIpIHtcbiAgICAgICAgICBtZW1iZXJzLnB1c2gobWVtYmVyKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhpcyBjbGFzcyB3YXMgZGVjbGFyZWQgYXMgYSBWYXJpYWJsZURlY2xhcmF0aW9uIHRoZW4gaXQgbWF5IGhhdmUgc3RhdGljIHByb3BlcnRpZXNcbiAgICAvLyBhdHRhY2hlZCB0byB0aGUgdmFyaWFibGUgcmF0aGVyIHRoYW4gdGhlIGNsYXNzIGl0c2VsZlxuICAgIC8vIEZvciBleGFtcGxlOlxuICAgIC8vIGBgYFxuICAgIC8vIGxldCBNeUNsYXNzID0gY2xhc3MgTXlDbGFzcyB7XG4gICAgLy8gICAvLyBubyBzdGF0aWMgcHJvcGVydGllcyBoZXJlIVxuICAgIC8vIH1cbiAgICAvLyBNeUNsYXNzLnN0YXRpY1Byb3BlcnR5ID0gLi4uO1xuICAgIC8vIGBgYFxuICAgIGlmICh0cy5pc1ZhcmlhYmxlRGVjbGFyYXRpb24oc3ltYm9sLnZhbHVlRGVjbGFyYXRpb24ucGFyZW50KSkge1xuICAgICAgY29uc3QgdmFyaWFibGVTeW1ib2wgPSB0aGlzLmNoZWNrZXIuZ2V0U3ltYm9sQXRMb2NhdGlvbihzeW1ib2wudmFsdWVEZWNsYXJhdGlvbi5wYXJlbnQubmFtZSk7XG4gICAgICBpZiAodmFyaWFibGVTeW1ib2wgJiYgdmFyaWFibGVTeW1ib2wuZXhwb3J0cykge1xuICAgICAgICB2YXJpYWJsZVN5bWJvbC5leHBvcnRzLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgICAgICBjb25zdCBkZWNvcmF0b3JzID0gcmVtb3ZlRnJvbU1hcChkZWNvcmF0b3JzTWFwLCBrZXkpO1xuICAgICAgICAgIGNvbnN0IG1lbWJlciA9IHRoaXMucmVmbGVjdE1lbWJlcih2YWx1ZSwgZGVjb3JhdG9ycywgdHJ1ZSk7XG4gICAgICAgICAgaWYgKG1lbWJlcikge1xuICAgICAgICAgICAgbWVtYmVycy5wdXNoKG1lbWJlcik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBEZWFsIHdpdGggYW55IGRlY29yYXRlZCBwcm9wZXJ0aWVzIHRoYXQgd2VyZSBub3QgaW5pdGlhbGl6ZWQgaW4gdGhlIGNsYXNzXG4gICAgZGVjb3JhdG9yc01hcC5mb3JFYWNoKCh2YWx1ZSwga2V5KSA9PiB7XG4gICAgICBtZW1iZXJzLnB1c2goe1xuICAgICAgICBpbXBsZW1lbnRhdGlvbjogbnVsbCxcbiAgICAgICAgZGVjb3JhdG9yczogdmFsdWUsXG4gICAgICAgIGlzU3RhdGljOiBmYWxzZSxcbiAgICAgICAga2luZDogQ2xhc3NNZW1iZXJLaW5kLlByb3BlcnR5LFxuICAgICAgICBuYW1lOiBrZXksXG4gICAgICAgIG5hbWVOb2RlOiBudWxsLFxuICAgICAgICBub2RlOiBudWxsLFxuICAgICAgICB0eXBlOiBudWxsLFxuICAgICAgICB2YWx1ZTogbnVsbFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbWVtYmVycztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWZsZWN0IG92ZXIgdGhlIGNvbnN0cnVjdG9yIG9mIGEgY2xhc3MgYW5kIHJldHVybiBtZXRhZGF0YSBhYm91dCBpdHMgcGFyYW1ldGVycy5cbiAgICpcbiAgICogVGhpcyBtZXRob2Qgb25seSBsb29rcyBhdCB0aGUgY29uc3RydWN0b3Igb2YgYSBjbGFzcyBkaXJlY3RseSBhbmQgbm90IGF0IGFueSBpbmhlcml0ZWRcbiAgICogY29uc3RydWN0b3JzLlxuICAgKlxuICAgKiBAcGFyYW0gZGVjbGFyYXRpb24gYSBUeXBlU2NyaXB0IGB0cy5EZWNsYXJhdGlvbmAgbm9kZSByZXByZXNlbnRpbmcgdGhlIGNsYXNzIG92ZXIgd2hpY2ggdG9cbiAgICogcmVmbGVjdC4gSWYgdGhlIHNvdXJjZSBpcyBpbiBFUzYgZm9ybWF0LCB0aGlzIHdpbGwgYmUgYSBgdHMuQ2xhc3NEZWNsYXJhdGlvbmAgbm9kZS4gSWYgdGhlXG4gICAqIHNvdXJjZSBpcyBpbiBFUzUgZm9ybWF0LCB0aGlzIG1pZ2h0IGJlIGEgYHRzLlZhcmlhYmxlRGVjbGFyYXRpb25gIGFzIGNsYXNzZXMgaW4gRVM1IGFyZVxuICAgKiByZXByZXNlbnRlZCBhcyB0aGUgcmVzdWx0IG9mIGFuIElJRkUgZXhlY3V0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBhbiBhcnJheSBvZiBgUGFyYW1ldGVyYCBtZXRhZGF0YSByZXByZXNlbnRpbmcgdGhlIHBhcmFtZXRlcnMgb2YgdGhlIGNvbnN0cnVjdG9yLCBpZlxuICAgKiBhIGNvbnN0cnVjdG9yIGV4aXN0cy4gSWYgdGhlIGNvbnN0cnVjdG9yIGV4aXN0cyBhbmQgaGFzIDAgcGFyYW1ldGVycywgdGhpcyBhcnJheSB3aWxsIGJlIGVtcHR5LlxuICAgKiBJZiB0aGUgY2xhc3MgaGFzIG5vIGNvbnN0cnVjdG9yLCB0aGlzIG1ldGhvZCByZXR1cm5zIGBudWxsYC5cbiAgICpcbiAgICogQHRocm93cyBpZiBgZGVjbGFyYXRpb25gIGRvZXMgbm90IHJlc29sdmUgdG8gYSBjbGFzcyBkZWNsYXJhdGlvbi5cbiAgICovXG4gIGdldENvbnN0cnVjdG9yUGFyYW1ldGVycyhjbGF6ejogdHMuRGVjbGFyYXRpb24pOiBDdG9yUGFyYW1ldGVyW118bnVsbCB7XG4gICAgY29uc3QgY2xhc3NTeW1ib2wgPSB0aGlzLmdldENsYXNzU3ltYm9sKGNsYXp6KTtcbiAgICBpZiAoIWNsYXNzU3ltYm9sKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYEF0dGVtcHRlZCB0byBnZXQgY29uc3RydWN0b3IgcGFyYW1ldGVycyBvZiBhIG5vbi1jbGFzczogXCIke2NsYXp6LmdldFRleHQoKX1cImApO1xuICAgIH1cbiAgICBjb25zdCBwYXJhbWV0ZXJOb2RlcyA9IHRoaXMuZ2V0Q29uc3RydWN0b3JQYXJhbWV0ZXJEZWNsYXJhdGlvbnMoY2xhc3NTeW1ib2wpO1xuICAgIGlmIChwYXJhbWV0ZXJOb2Rlcykge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0Q29uc3RydWN0b3JQYXJhbUluZm8oY2xhc3NTeW1ib2wsIHBhcmFtZXRlck5vZGVzKTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvKipcbiAgICogRmluZCBhIHN5bWJvbCBmb3IgYSBub2RlIHRoYXQgd2UgdGhpbmsgaXMgYSBjbGFzcy5cbiAgICogQHBhcmFtIG5vZGUgdGhlIG5vZGUgd2hvc2Ugc3ltYm9sIHdlIGFyZSBmaW5kaW5nLlxuICAgKiBAcmV0dXJucyB0aGUgc3ltYm9sIGZvciB0aGUgbm9kZSBvciBgdW5kZWZpbmVkYCBpZiBpdCBpcyBub3QgYSBcImNsYXNzXCIgb3IgaGFzIG5vIHN5bWJvbC5cbiAgICovXG4gIGdldENsYXNzU3ltYm9sKGRlY2xhcmF0aW9uOiB0cy5Ob2RlKTogdHMuU3ltYm9sfHVuZGVmaW5lZCB7XG4gICAgaWYgKHRzLmlzQ2xhc3NEZWNsYXJhdGlvbihkZWNsYXJhdGlvbikpIHtcbiAgICAgIHJldHVybiBkZWNsYXJhdGlvbi5uYW1lICYmIHRoaXMuY2hlY2tlci5nZXRTeW1ib2xBdExvY2F0aW9uKGRlY2xhcmF0aW9uLm5hbWUpO1xuICAgIH1cbiAgICBpZiAodHMuaXNWYXJpYWJsZURlY2xhcmF0aW9uKGRlY2xhcmF0aW9uKSAmJiBkZWNsYXJhdGlvbi5pbml0aWFsaXplciAmJlxuICAgICAgICB0cy5pc0NsYXNzRXhwcmVzc2lvbihkZWNsYXJhdGlvbi5pbml0aWFsaXplcikpIHtcbiAgICAgIHJldHVybiBkZWNsYXJhdGlvbi5pbml0aWFsaXplci5uYW1lICYmXG4gICAgICAgICAgdGhpcy5jaGVja2VyLmdldFN5bWJvbEF0TG9jYXRpb24oZGVjbGFyYXRpb24uaW5pdGlhbGl6ZXIubmFtZSk7XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogU2VhcmNoIHRoZSBnaXZlbiBtb2R1bGUgZm9yIHZhcmlhYmxlIGRlY2xhcmF0aW9ucyBpbiB3aGljaCB0aGUgaW5pdGlhbGl6ZXJcbiAgICogaXMgYW4gaWRlbnRpZmllciBtYXJrZWQgd2l0aCB0aGUgYFBSRV9OR0NDX01BUktFUmAuXG4gICAqIEBwYXJhbSBtb2R1bGUgdGhlIG1vZHVsZSBpbiB3aGljaCB0byBzZWFyY2ggZm9yIHN3aXRjaGFibGUgZGVjbGFyYXRpb25zLlxuICAgKiBAcmV0dXJucyBhbiBhcnJheSBvZiB2YXJpYWJsZSBkZWNsYXJhdGlvbnMgdGhhdCBtYXRjaC5cbiAgICovXG4gIGdldFN3aXRjaGFibGVEZWNsYXJhdGlvbnMobW9kdWxlOiB0cy5Ob2RlKTogU3dpdGNoYWJsZVZhcmlhYmxlRGVjbGFyYXRpb25bXSB7XG4gICAgLy8gRG9uJ3QgYm90aGVyIHRvIHdhbGsgdGhlIEFTVCBpZiB0aGUgbWFya2VyIGlzIG5vdCBmb3VuZCBpbiB0aGUgdGV4dFxuICAgIHJldHVybiBtb2R1bGUuZ2V0VGV4dCgpLmluZGV4T2YoUFJFX05HQ0NfTUFSS0VSKSA+PSAwID9cbiAgICAgICAgZmluZEFsbChtb2R1bGUsIGlzU3dpdGNoYWJsZVZhcmlhYmxlRGVjbGFyYXRpb24pIDpcbiAgICAgICAgW107XG4gIH1cblxuICBnZXRWYXJpYWJsZVZhbHVlKGRlY2xhcmF0aW9uOiB0cy5WYXJpYWJsZURlY2xhcmF0aW9uKTogdHMuRXhwcmVzc2lvbnxudWxsIHtcbiAgICBjb25zdCB2YWx1ZSA9IHN1cGVyLmdldFZhcmlhYmxlVmFsdWUoZGVjbGFyYXRpb24pO1xuICAgIGlmICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cblxuICAgIC8vIFdlIGhhdmUgYSB2YXJpYWJsZSBkZWNsYXJhdGlvbiB0aGF0IGhhcyBubyBpbml0aWFsaXplci4gRm9yIGV4YW1wbGU6XG4gICAgLy9cbiAgICAvLyBgYGBcbiAgICAvLyB2YXIgSHR0cENsaWVudFhzcmZNb2R1bGVfMTtcbiAgICAvLyBgYGBcbiAgICAvL1xuICAgIC8vIFNvIGxvb2sgZm9yIHRoZSBzcGVjaWFsIHNjZW5hcmlvIHdoZXJlIHRoZSB2YXJpYWJsZSBpcyBiZWluZyBhc3NpZ25lZCBpblxuICAgIC8vIGEgbmVhcmJ5IHN0YXRlbWVudCB0byB0aGUgcmV0dXJuIHZhbHVlIG9mIGEgY2FsbCB0byBgX19kZWNvcmF0ZWAuXG4gICAgLy8gVGhlbiBmaW5kIHRoZSAybmQgYXJndW1lbnQgb2YgdGhhdCBjYWxsLCB0aGUgXCJ0YXJnZXRcIiwgd2hpY2ggd2lsbCBiZSB0aGVcbiAgICAvLyBhY3R1YWwgY2xhc3MgaWRlbnRpZmllci4gRm9yIGV4YW1wbGU6XG4gICAgLy9cbiAgICAvLyBgYGBcbiAgICAvLyBIdHRwQ2xpZW50WHNyZk1vZHVsZSA9IEh0dHBDbGllbnRYc3JmTW9kdWxlXzEgPSB0c2xpYl8xLl9fZGVjb3JhdGUoW1xuICAgIC8vICAgTmdNb2R1bGUoe1xuICAgIC8vICAgICBwcm92aWRlcnM6IFtdLFxuICAgIC8vICAgfSlcbiAgICAvLyBdLCBIdHRwQ2xpZW50WHNyZk1vZHVsZSk7XG4gICAgLy8gYGBgXG4gICAgLy9cbiAgICAvLyBBbmQgZmluYWxseSwgZmluZCB0aGUgZGVjbGFyYXRpb24gb2YgdGhlIGlkZW50aWZpZXIgaW4gdGhhdCBhcmd1bWVudC5cbiAgICAvLyBOb3RlIGFsc28gdGhhdCB0aGUgYXNzaWdubWVudCBjYW4gb2NjdXIgd2l0aGluIGFub3RoZXIgYXNzaWdubWVudC5cbiAgICAvL1xuICAgIGNvbnN0IGJsb2NrID0gZGVjbGFyYXRpb24ucGFyZW50LnBhcmVudC5wYXJlbnQ7XG4gICAgY29uc3Qgc3ltYm9sID0gdGhpcy5jaGVja2VyLmdldFN5bWJvbEF0TG9jYXRpb24oZGVjbGFyYXRpb24ubmFtZSk7XG4gICAgaWYgKHN5bWJvbCAmJiAodHMuaXNCbG9jayhibG9jaykgfHwgdHMuaXNTb3VyY2VGaWxlKGJsb2NrKSkpIHtcbiAgICAgIGNvbnN0IGRlY29yYXRlQ2FsbCA9IHRoaXMuZmluZERlY29yYXRlZFZhcmlhYmxlVmFsdWUoYmxvY2ssIHN5bWJvbCk7XG4gICAgICBjb25zdCB0YXJnZXQgPSBkZWNvcmF0ZUNhbGwgJiYgZGVjb3JhdGVDYWxsLmFyZ3VtZW50c1sxXTtcbiAgICAgIGlmICh0YXJnZXQgJiYgdHMuaXNJZGVudGlmaWVyKHRhcmdldCkpIHtcbiAgICAgICAgY29uc3QgdGFyZ2V0U3ltYm9sID0gdGhpcy5jaGVja2VyLmdldFN5bWJvbEF0TG9jYXRpb24odGFyZ2V0KTtcbiAgICAgICAgY29uc3QgdGFyZ2V0RGVjbGFyYXRpb24gPSB0YXJnZXRTeW1ib2wgJiYgdGFyZ2V0U3ltYm9sLnZhbHVlRGVjbGFyYXRpb247XG4gICAgICAgIGlmICh0YXJnZXREZWNsYXJhdGlvbikge1xuICAgICAgICAgIGlmICh0cy5pc0NsYXNzRGVjbGFyYXRpb24odGFyZ2V0RGVjbGFyYXRpb24pIHx8XG4gICAgICAgICAgICAgIHRzLmlzRnVuY3Rpb25EZWNsYXJhdGlvbih0YXJnZXREZWNsYXJhdGlvbikpIHtcbiAgICAgICAgICAgIC8vIFRoZSB0YXJnZXQgaXMganVzdCBhIGZ1bmN0aW9uIG9yIGNsYXNzIGRlY2xhcmF0aW9uXG4gICAgICAgICAgICAvLyBzbyByZXR1cm4gaXRzIGlkZW50aWZpZXIgYXMgdGhlIHZhcmlhYmxlIHZhbHVlLlxuICAgICAgICAgICAgcmV0dXJuIHRhcmdldERlY2xhcmF0aW9uLm5hbWUgfHwgbnVsbDtcbiAgICAgICAgICB9IGVsc2UgaWYgKHRzLmlzVmFyaWFibGVEZWNsYXJhdGlvbih0YXJnZXREZWNsYXJhdGlvbikpIHtcbiAgICAgICAgICAgIC8vIFRoZSB0YXJnZXQgaXMgYSB2YXJpYWJsZSBkZWNsYXJhdGlvbiwgc28gZmluZCB0aGUgZmFyIHJpZ2h0IGV4cHJlc3Npb24sXG4gICAgICAgICAgICAvLyBpbiB0aGUgY2FzZSBvZiBtdWx0aXBsZSBhc3NpZ25tZW50cyAoZS5nLiBgdmFyMSA9IHZhcjIgPSB2YWx1ZWApLlxuICAgICAgICAgICAgbGV0IHRhcmdldFZhbHVlID0gdGFyZ2V0RGVjbGFyYXRpb24uaW5pdGlhbGl6ZXI7XG4gICAgICAgICAgICB3aGlsZSAodGFyZ2V0VmFsdWUgJiYgaXNBc3NpZ25tZW50KHRhcmdldFZhbHVlKSkge1xuICAgICAgICAgICAgICB0YXJnZXRWYWx1ZSA9IHRhcmdldFZhbHVlLnJpZ2h0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRhcmdldFZhbHVlKSB7XG4gICAgICAgICAgICAgIHJldHVybiB0YXJnZXRWYWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lIGlmIGFuIGlkZW50aWZpZXIgd2FzIGltcG9ydGVkIGZyb20gYW5vdGhlciBtb2R1bGUgYW5kIHJldHVybiBgSW1wb3J0YCBtZXRhZGF0YVxuICAgKiBkZXNjcmliaW5nIGl0cyBvcmlnaW4uXG4gICAqXG4gICAqIEBwYXJhbSBpZCBhIFR5cGVTY3JpcHQgYHRzLklkZW50aWZlcmAgdG8gcmVmbGVjdC5cbiAgICpcbiAgICogQHJldHVybnMgbWV0YWRhdGEgYWJvdXQgdGhlIGBJbXBvcnRgIGlmIHRoZSBpZGVudGlmaWVyIHdhcyBpbXBvcnRlZCBmcm9tIGFub3RoZXIgbW9kdWxlLCBvclxuICAgKiBgbnVsbGAgaWYgdGhlIGlkZW50aWZpZXIgZG9lc24ndCByZXNvbHZlIHRvIGFuIGltcG9ydCBidXQgaW5zdGVhZCBpcyBsb2NhbGx5IGRlZmluZWQuXG4gICAqL1xuICBnZXRJbXBvcnRPZklkZW50aWZpZXIoaWQ6IHRzLklkZW50aWZpZXIpOiBJbXBvcnR8bnVsbCB7XG4gICAgcmV0dXJuIHN1cGVyLmdldEltcG9ydE9mSWRlbnRpZmllcihpZCkgfHwgdGhpcy5nZXRJbXBvcnRPZk5hbWVzcGFjZWRJZGVudGlmaWVyKGlkKTtcbiAgfVxuXG4gIC8qXG4gICAqIEZpbmQgYWxsIHRoZSBmaWxlcyBhY2Nlc3NpYmxlIHZpYSBhbiBlbnRyeS1wb2ludCwgdGhhdCBjb250YWluIGRlY29yYXRlZCBjbGFzc2VzLlxuICAgKiBAcGFyYW0gZW50cnlQb2ludCBUaGUgc3RhcnRpbmcgcG9pbnQgZmlsZSBmb3IgZmluZGluZyBmaWxlcyB0aGF0IGNvbnRhaW4gZGVjb3JhdGVkIGNsYXNzZXMuXG4gICAqIEByZXR1cm5zIEEgY29sbGVjdGlvbiBvZiBmaWxlcyBvYmplY3RzIHRoYXQgaG9sZCBpbmZvIGFib3V0IHRoZSBkZWNvcmF0ZWQgY2xhc3NlcyBhbmQgaW1wb3J0XG4gICAqIGluZm9ybWF0aW9uLlxuICAgKi9cbiAgZmluZERlY29yYXRlZEZpbGVzKGVudHJ5UG9pbnQ6IHRzLlNvdXJjZUZpbGUpOiBNYXA8dHMuU291cmNlRmlsZSwgRGVjb3JhdGVkRmlsZT4ge1xuICAgIGNvbnN0IG1vZHVsZVN5bWJvbCA9IHRoaXMuY2hlY2tlci5nZXRTeW1ib2xBdExvY2F0aW9uKGVudHJ5UG9pbnQpO1xuICAgIGNvbnN0IG1hcCA9IG5ldyBNYXA8dHMuU291cmNlRmlsZSwgRGVjb3JhdGVkRmlsZT4oKTtcbiAgICBpZiAobW9kdWxlU3ltYm9sKSB7XG4gICAgICBjb25zdCBleHBvcnRlZFN5bWJvbHMgPVxuICAgICAgICAgIHRoaXMuY2hlY2tlci5nZXRFeHBvcnRzT2ZNb2R1bGUobW9kdWxlU3ltYm9sKS5tYXAoZ2V0T3JpZ2luYWxTeW1ib2wodGhpcy5jaGVja2VyKSk7XG4gICAgICBjb25zdCBleHBvcnRlZERlY2xhcmF0aW9ucyA9XG4gICAgICAgICAgZXhwb3J0ZWRTeW1ib2xzLm1hcChleHBvcnRTeW1ib2wgPT4gZXhwb3J0U3ltYm9sLnZhbHVlRGVjbGFyYXRpb24pLmZpbHRlcihpc0RlZmluZWQpO1xuXG4gICAgICBjb25zdCBkZWNvcmF0ZWRDbGFzc2VzID1cbiAgICAgICAgICBleHBvcnRlZERlY2xhcmF0aW9uc1xuICAgICAgICAgICAgICAubWFwKGRlY2xhcmF0aW9uID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodHMuaXNDbGFzc0RlY2xhcmF0aW9uKGRlY2xhcmF0aW9uKSB8fCB0cy5pc1ZhcmlhYmxlRGVjbGFyYXRpb24oZGVjbGFyYXRpb24pKSB7XG4gICAgICAgICAgICAgICAgICBjb25zdCBuYW1lID0gZGVjbGFyYXRpb24ubmFtZSAmJiB0cy5pc0lkZW50aWZpZXIoZGVjbGFyYXRpb24ubmFtZSkgP1xuICAgICAgICAgICAgICAgICAgICAgIGRlY2xhcmF0aW9uLm5hbWUudGV4dCA6XG4gICAgICAgICAgICAgICAgICAgICAgdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgY29uc3QgZGVjb3JhdG9ycyA9IHRoaXMuZ2V0RGVjb3JhdG9yc09mRGVjbGFyYXRpb24oZGVjbGFyYXRpb24pO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIGRlY29yYXRvcnMgJiYgaXNEZWZpbmVkKG5hbWUpID9cbiAgICAgICAgICAgICAgICAgICAgICBuZXcgRGVjb3JhdGVkQ2xhc3MobmFtZSwgZGVjbGFyYXRpb24sIGRlY29yYXRvcnMpIDpcbiAgICAgICAgICAgICAgICAgICAgICB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5maWx0ZXIoaXNEZWZpbmVkKTtcblxuICAgICAgZGVjb3JhdGVkQ2xhc3Nlcy5mb3JFYWNoKGNsYXp6ID0+IHtcbiAgICAgICAgY29uc3QgZmlsZSA9IGNsYXp6LmRlY2xhcmF0aW9uLmdldFNvdXJjZUZpbGUoKTtcbiAgICAgICAgaWYgKCFtYXAuaGFzKGZpbGUpKSB7XG4gICAgICAgICAgbWFwLnNldChmaWxlLCBuZXcgRGVjb3JhdGVkRmlsZShmaWxlKSk7XG4gICAgICAgIH1cbiAgICAgICAgbWFwLmdldChmaWxlKSAhLmRlY29yYXRlZENsYXNzZXMucHVzaChjbGF6eik7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIG1hcDtcbiAgfVxuXG4gIC8vLy8vLy8vLy8vLy8gUHJvdGVjdGVkIEhlbHBlcnMgLy8vLy8vLy8vLy8vL1xuXG4gIC8qKlxuICAgKiBXYWxrIHRoZSBBU1QgbG9va2luZyBmb3IgYW4gYXNzaWdubWVudCB0byB0aGUgc3BlY2lmaWVkIHN5bWJvbC5cbiAgICogQHBhcmFtIG5vZGUgVGhlIGN1cnJlbnQgbm9kZSB3ZSBhcmUgc2VhcmNoaW5nLlxuICAgKiBAcmV0dXJucyBhbiBleHByZXNzaW9uIHRoYXQgcmVwcmVzZW50cyB0aGUgdmFsdWUgb2YgdGhlIHZhcmlhYmxlLCBvciB1bmRlZmluZWQgaWYgbm9uZSBjYW4gYmVcbiAgICogZm91bmQuXG4gICAqL1xuICBwcm90ZWN0ZWQgZmluZERlY29yYXRlZFZhcmlhYmxlVmFsdWUobm9kZTogdHMuTm9kZXx1bmRlZmluZWQsIHN5bWJvbDogdHMuU3ltYm9sKTpcbiAgICAgIHRzLkNhbGxFeHByZXNzaW9ufG51bGwge1xuICAgIGlmICghbm9kZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGlmICh0cy5pc0JpbmFyeUV4cHJlc3Npb24obm9kZSkgJiYgbm9kZS5vcGVyYXRvclRva2VuLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuRXF1YWxzVG9rZW4pIHtcbiAgICAgIGNvbnN0IGxlZnQgPSBub2RlLmxlZnQ7XG4gICAgICBjb25zdCByaWdodCA9IG5vZGUucmlnaHQ7XG4gICAgICBpZiAodHMuaXNJZGVudGlmaWVyKGxlZnQpICYmIHRoaXMuY2hlY2tlci5nZXRTeW1ib2xBdExvY2F0aW9uKGxlZnQpID09PSBzeW1ib2wpIHtcbiAgICAgICAgcmV0dXJuICh0cy5pc0NhbGxFeHByZXNzaW9uKHJpZ2h0KSAmJiBnZXRDYWxsZWVOYW1lKHJpZ2h0KSA9PT0gJ19fZGVjb3JhdGUnKSA/IHJpZ2h0IDogbnVsbDtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLmZpbmREZWNvcmF0ZWRWYXJpYWJsZVZhbHVlKHJpZ2h0LCBzeW1ib2wpO1xuICAgIH1cbiAgICByZXR1cm4gbm9kZS5mb3JFYWNoQ2hpbGQobm9kZSA9PiB0aGlzLmZpbmREZWNvcmF0ZWRWYXJpYWJsZVZhbHVlKG5vZGUsIHN5bWJvbCkpIHx8IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogVHJ5IHRvIHJldHJpZXZlIHRoZSBzeW1ib2wgb2YgYSBzdGF0aWMgcHJvcGVydHkgb24gYSBjbGFzcy5cbiAgICogQHBhcmFtIHN5bWJvbCB0aGUgY2xhc3Mgd2hvc2UgcHJvcGVydHkgd2UgYXJlIGludGVyZXN0ZWQgaW4uXG4gICAqIEBwYXJhbSBwcm9wZXJ0eU5hbWUgdGhlIG5hbWUgb2Ygc3RhdGljIHByb3BlcnR5LlxuICAgKiBAcmV0dXJucyB0aGUgc3ltYm9sIGlmIGl0IGlzIGZvdW5kIG9yIGB1bmRlZmluZWRgIGlmIG5vdC5cbiAgICovXG4gIHByb3RlY3RlZCBnZXRTdGF0aWNQcm9wZXJ0eShzeW1ib2w6IHRzLlN5bWJvbCwgcHJvcGVydHlOYW1lOiB0cy5fX1N0cmluZyk6IHRzLlN5bWJvbHx1bmRlZmluZWQge1xuICAgIHJldHVybiBzeW1ib2wuZXhwb3J0cyAmJiBzeW1ib2wuZXhwb3J0cy5nZXQocHJvcGVydHlOYW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYWxsIGNsYXNzIGRlY29yYXRvcnMgZm9yIHRoZSBnaXZlbiBjbGFzcywgd2hlcmUgdGhlIGRlY29yYXRvcnMgYXJlIGRlY2xhcmVkXG4gICAqIHZpYSBhIHN0YXRpYyBwcm9wZXJ0eS4gRm9yIGV4YW1wbGU6XG4gICAqXG4gICAqIGBgYFxuICAgKiBjbGFzcyBTb21lRGlyZWN0aXZlIHt9XG4gICAqIFNvbWVEaXJlY3RpdmUuZGVjb3JhdG9ycyA9IFtcbiAgICogICB7IHR5cGU6IERpcmVjdGl2ZSwgYXJnczogW3sgc2VsZWN0b3I6ICdbc29tZURpcmVjdGl2ZV0nIH0sXSB9XG4gICAqIF07XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0gZGVjb3JhdG9yc1N5bWJvbCB0aGUgcHJvcGVydHkgY29udGFpbmluZyB0aGUgZGVjb3JhdG9ycyB3ZSB3YW50IHRvIGdldC5cbiAgICogQHJldHVybnMgYW4gYXJyYXkgb2YgZGVjb3JhdG9ycyBvciBudWxsIGlmIG5vbmUgd2hlcmUgZm91bmQuXG4gICAqL1xuICBwcm90ZWN0ZWQgZ2V0Q2xhc3NEZWNvcmF0b3JzRnJvbVN0YXRpY1Byb3BlcnR5KGRlY29yYXRvcnNTeW1ib2w6IHRzLlN5bWJvbCk6IERlY29yYXRvcltdfG51bGwge1xuICAgIGNvbnN0IGRlY29yYXRvcnNJZGVudGlmaWVyID0gZGVjb3JhdG9yc1N5bWJvbC52YWx1ZURlY2xhcmF0aW9uO1xuICAgIGlmIChkZWNvcmF0b3JzSWRlbnRpZmllciAmJiBkZWNvcmF0b3JzSWRlbnRpZmllci5wYXJlbnQpIHtcbiAgICAgIGlmICh0cy5pc0JpbmFyeUV4cHJlc3Npb24oZGVjb3JhdG9yc0lkZW50aWZpZXIucGFyZW50KSAmJlxuICAgICAgICAgIGRlY29yYXRvcnNJZGVudGlmaWVyLnBhcmVudC5vcGVyYXRvclRva2VuLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuRXF1YWxzVG9rZW4pIHtcbiAgICAgICAgLy8gQVNUIG9mIHRoZSBhcnJheSBvZiBkZWNvcmF0b3IgdmFsdWVzXG4gICAgICAgIGNvbnN0IGRlY29yYXRvcnNBcnJheSA9IGRlY29yYXRvcnNJZGVudGlmaWVyLnBhcmVudC5yaWdodDtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVmbGVjdERlY29yYXRvcnMoZGVjb3JhdG9yc0FycmF5KVxuICAgICAgICAgICAgLmZpbHRlcihkZWNvcmF0b3IgPT4gdGhpcy5pc0Zyb21Db3JlKGRlY29yYXRvcikpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYWxsIGNsYXNzIGRlY29yYXRvcnMgZm9yIHRoZSBnaXZlbiBjbGFzcywgd2hlcmUgdGhlIGRlY29yYXRvcnMgYXJlIGRlY2xhcmVkXG4gICAqIHZpYSB0aGUgYF9fZGVjb3JhdGVgIGhlbHBlciBtZXRob2QuIEZvciBleGFtcGxlOlxuICAgKlxuICAgKiBgYGBcbiAgICogbGV0IFNvbWVEaXJlY3RpdmUgPSBjbGFzcyBTb21lRGlyZWN0aXZlIHt9XG4gICAqIFNvbWVEaXJlY3RpdmUgPSBfX2RlY29yYXRlKFtcbiAgICogICBEaXJlY3RpdmUoeyBzZWxlY3RvcjogJ1tzb21lRGlyZWN0aXZlXScgfSksXG4gICAqIF0sIFNvbWVEaXJlY3RpdmUpO1xuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHN5bWJvbCB0aGUgY2xhc3Mgd2hvc2UgZGVjb3JhdG9ycyB3ZSB3YW50IHRvIGdldC5cbiAgICogQHJldHVybnMgYW4gYXJyYXkgb2YgZGVjb3JhdG9ycyBvciBudWxsIGlmIG5vbmUgd2hlcmUgZm91bmQuXG4gICAqL1xuICBwcm90ZWN0ZWQgZ2V0Q2xhc3NEZWNvcmF0b3JzRnJvbUhlbHBlckNhbGwoc3ltYm9sOiB0cy5TeW1ib2wpOiBEZWNvcmF0b3JbXXxudWxsIHtcbiAgICBjb25zdCBkZWNvcmF0b3JzOiBEZWNvcmF0b3JbXSA9IFtdO1xuICAgIGNvbnN0IGhlbHBlckNhbGxzID0gdGhpcy5nZXRIZWxwZXJDYWxsc0ZvckNsYXNzKHN5bWJvbCwgJ19fZGVjb3JhdGUnKTtcbiAgICBoZWxwZXJDYWxscy5mb3JFYWNoKGhlbHBlckNhbGwgPT4ge1xuICAgICAgY29uc3Qge2NsYXNzRGVjb3JhdG9yc30gPVxuICAgICAgICAgIHRoaXMucmVmbGVjdERlY29yYXRvcnNGcm9tSGVscGVyQ2FsbChoZWxwZXJDYWxsLCBtYWtlQ2xhc3NUYXJnZXRGaWx0ZXIoc3ltYm9sLm5hbWUpKTtcbiAgICAgIGNsYXNzRGVjb3JhdG9ycy5maWx0ZXIoZGVjb3JhdG9yID0+IHRoaXMuaXNGcm9tQ29yZShkZWNvcmF0b3IpKVxuICAgICAgICAgIC5mb3JFYWNoKGRlY29yYXRvciA9PiBkZWNvcmF0b3JzLnB1c2goZGVjb3JhdG9yKSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGRlY29yYXRvcnMubGVuZ3RoID8gZGVjb3JhdG9ycyA6IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGFsbCB0aGUgbWVtYmVyIGRlY29yYXRvcnMgZm9yIHRoZSBnaXZlbiBjbGFzcy5cbiAgICogQHBhcmFtIGNsYXNzU3ltYm9sIHRoZSBjbGFzcyB3aG9zZSBtZW1iZXIgZGVjb3JhdG9ycyB3ZSBhcmUgaW50ZXJlc3RlZCBpbi5cbiAgICogQHJldHVybnMgYSBtYXAgd2hvc2Uga2V5cyBhcmUgdGhlIG5hbWUgb2YgdGhlIG1lbWJlcnMgYW5kIHdob3NlIHZhbHVlcyBhcmUgY29sbGVjdGlvbnMgb2ZcbiAgICogZGVjb3JhdG9ycyBmb3IgdGhlIGdpdmVuIG1lbWJlci5cbiAgICovXG4gIHByb3RlY3RlZCBnZXRNZW1iZXJEZWNvcmF0b3JzKGNsYXNzU3ltYm9sOiB0cy5TeW1ib2wpOiBNYXA8c3RyaW5nLCBEZWNvcmF0b3JbXT4ge1xuICAgIGNvbnN0IGRlY29yYXRvcnNQcm9wZXJ0eSA9IHRoaXMuZ2V0U3RhdGljUHJvcGVydHkoY2xhc3NTeW1ib2wsIFBST1BfREVDT1JBVE9SUyk7XG4gICAgaWYgKGRlY29yYXRvcnNQcm9wZXJ0eSkge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0TWVtYmVyRGVjb3JhdG9yc0Zyb21TdGF0aWNQcm9wZXJ0eShkZWNvcmF0b3JzUHJvcGVydHkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5nZXRNZW1iZXJEZWNvcmF0b3JzRnJvbUhlbHBlckNhbGxzKGNsYXNzU3ltYm9sKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogTWVtYmVyIGRlY29yYXRvcnMgbWF5IGJlIGRlY2xhcmVkIGFzIHN0YXRpYyBwcm9wZXJ0aWVzIG9mIHRoZSBjbGFzczpcbiAgICpcbiAgICogYGBgXG4gICAqIFNvbWVEaXJlY3RpdmUucHJvcERlY29yYXRvcnMgPSB7XG4gICAqICAgXCJuZ0Zvck9mXCI6IFt7IHR5cGU6IElucHV0IH0sXSxcbiAgICogICBcIm5nRm9yVHJhY2tCeVwiOiBbeyB0eXBlOiBJbnB1dCB9LF0sXG4gICAqICAgXCJuZ0ZvclRlbXBsYXRlXCI6IFt7IHR5cGU6IElucHV0IH0sXSxcbiAgICogfTtcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSBkZWNvcmF0b3JzUHJvcGVydHkgdGhlIGNsYXNzIHdob3NlIG1lbWJlciBkZWNvcmF0b3JzIHdlIGFyZSBpbnRlcmVzdGVkIGluLlxuICAgKiBAcmV0dXJucyBhIG1hcCB3aG9zZSBrZXlzIGFyZSB0aGUgbmFtZSBvZiB0aGUgbWVtYmVycyBhbmQgd2hvc2UgdmFsdWVzIGFyZSBjb2xsZWN0aW9ucyBvZlxuICAgKiBkZWNvcmF0b3JzIGZvciB0aGUgZ2l2ZW4gbWVtYmVyLlxuICAgKi9cbiAgcHJvdGVjdGVkIGdldE1lbWJlckRlY29yYXRvcnNGcm9tU3RhdGljUHJvcGVydHkoZGVjb3JhdG9yc1Byb3BlcnR5OiB0cy5TeW1ib2wpOlxuICAgICAgTWFwPHN0cmluZywgRGVjb3JhdG9yW10+IHtcbiAgICBjb25zdCBtZW1iZXJEZWNvcmF0b3JzID0gbmV3IE1hcDxzdHJpbmcsIERlY29yYXRvcltdPigpO1xuICAgIC8vIFN5bWJvbCBvZiB0aGUgaWRlbnRpZmllciBmb3IgYFNvbWVEaXJlY3RpdmUucHJvcERlY29yYXRvcnNgLlxuICAgIGNvbnN0IHByb3BEZWNvcmF0b3JzTWFwID0gZ2V0UHJvcGVydHlWYWx1ZUZyb21TeW1ib2woZGVjb3JhdG9yc1Byb3BlcnR5KTtcbiAgICBpZiAocHJvcERlY29yYXRvcnNNYXAgJiYgdHMuaXNPYmplY3RMaXRlcmFsRXhwcmVzc2lvbihwcm9wRGVjb3JhdG9yc01hcCkpIHtcbiAgICAgIGNvbnN0IHByb3BlcnRpZXNNYXAgPSByZWZsZWN0T2JqZWN0TGl0ZXJhbChwcm9wRGVjb3JhdG9yc01hcCk7XG4gICAgICBwcm9wZXJ0aWVzTWFwLmZvckVhY2goKHZhbHVlLCBuYW1lKSA9PiB7XG4gICAgICAgIGNvbnN0IGRlY29yYXRvcnMgPVxuICAgICAgICAgICAgdGhpcy5yZWZsZWN0RGVjb3JhdG9ycyh2YWx1ZSkuZmlsdGVyKGRlY29yYXRvciA9PiB0aGlzLmlzRnJvbUNvcmUoZGVjb3JhdG9yKSk7XG4gICAgICAgIGlmIChkZWNvcmF0b3JzLmxlbmd0aCkge1xuICAgICAgICAgIG1lbWJlckRlY29yYXRvcnMuc2V0KG5hbWUsIGRlY29yYXRvcnMpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIG1lbWJlckRlY29yYXRvcnM7XG4gIH1cblxuICAvKipcbiAgICogTWVtYmVyIGRlY29yYXRvcnMgbWF5IGJlIGRlY2xhcmVkIHZpYSBoZWxwZXIgY2FsbCBzdGF0ZW1lbnRzLlxuICAgKlxuICAgKiBgYGBcbiAgICogX19kZWNvcmF0ZShbXG4gICAqICAgICBJbnB1dCgpLFxuICAgKiAgICAgX19tZXRhZGF0YShcImRlc2lnbjp0eXBlXCIsIFN0cmluZylcbiAgICogXSwgU29tZURpcmVjdGl2ZS5wcm90b3R5cGUsIFwiaW5wdXQxXCIsIHZvaWQgMCk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0gY2xhc3NTeW1ib2wgdGhlIGNsYXNzIHdob3NlIG1lbWJlciBkZWNvcmF0b3JzIHdlIGFyZSBpbnRlcmVzdGVkIGluLlxuICAgKiBAcmV0dXJucyBhIG1hcCB3aG9zZSBrZXlzIGFyZSB0aGUgbmFtZSBvZiB0aGUgbWVtYmVycyBhbmQgd2hvc2UgdmFsdWVzIGFyZSBjb2xsZWN0aW9ucyBvZlxuICAgKiBkZWNvcmF0b3JzIGZvciB0aGUgZ2l2ZW4gbWVtYmVyLlxuICAgKi9cbiAgcHJvdGVjdGVkIGdldE1lbWJlckRlY29yYXRvcnNGcm9tSGVscGVyQ2FsbHMoY2xhc3NTeW1ib2w6IHRzLlN5bWJvbCk6IE1hcDxzdHJpbmcsIERlY29yYXRvcltdPiB7XG4gICAgY29uc3QgbWVtYmVyRGVjb3JhdG9yTWFwID0gbmV3IE1hcDxzdHJpbmcsIERlY29yYXRvcltdPigpO1xuICAgIGNvbnN0IGhlbHBlckNhbGxzID0gdGhpcy5nZXRIZWxwZXJDYWxsc0ZvckNsYXNzKGNsYXNzU3ltYm9sLCAnX19kZWNvcmF0ZScpO1xuICAgIGhlbHBlckNhbGxzLmZvckVhY2goaGVscGVyQ2FsbCA9PiB7XG4gICAgICBjb25zdCB7bWVtYmVyRGVjb3JhdG9yc30gPSB0aGlzLnJlZmxlY3REZWNvcmF0b3JzRnJvbUhlbHBlckNhbGwoXG4gICAgICAgICAgaGVscGVyQ2FsbCwgbWFrZU1lbWJlclRhcmdldEZpbHRlcihjbGFzc1N5bWJvbC5uYW1lKSk7XG4gICAgICBtZW1iZXJEZWNvcmF0b3JzLmZvckVhY2goKGRlY29yYXRvcnMsIG1lbWJlck5hbWUpID0+IHtcbiAgICAgICAgaWYgKG1lbWJlck5hbWUpIHtcbiAgICAgICAgICBjb25zdCBtZW1iZXJEZWNvcmF0b3JzID0gbWVtYmVyRGVjb3JhdG9yTWFwLmdldChtZW1iZXJOYW1lKSB8fCBbXTtcbiAgICAgICAgICBjb25zdCBjb3JlRGVjb3JhdG9ycyA9IGRlY29yYXRvcnMuZmlsdGVyKGRlY29yYXRvciA9PiB0aGlzLmlzRnJvbUNvcmUoZGVjb3JhdG9yKSk7XG4gICAgICAgICAgbWVtYmVyRGVjb3JhdG9yTWFwLnNldChtZW1iZXJOYW1lLCBtZW1iZXJEZWNvcmF0b3JzLmNvbmNhdChjb3JlRGVjb3JhdG9ycykpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gbWVtYmVyRGVjb3JhdG9yTWFwO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4dHJhY3QgZGVjb3JhdG9yIGluZm8gZnJvbSBgX19kZWNvcmF0ZWAgaGVscGVyIGZ1bmN0aW9uIGNhbGxzLlxuICAgKiBAcGFyYW0gaGVscGVyQ2FsbCB0aGUgY2FsbCB0byBhIGhlbHBlciB0aGF0IG1heSBjb250YWluIGRlY29yYXRvciBjYWxsc1xuICAgKiBAcGFyYW0gdGFyZ2V0RmlsdGVyIGEgZnVuY3Rpb24gdG8gZmlsdGVyIG91dCB0YXJnZXRzIHRoYXQgd2UgYXJlIG5vdCBpbnRlcmVzdGVkIGluLlxuICAgKiBAcmV0dXJucyBhIG1hcHBpbmcgZnJvbSBtZW1iZXIgbmFtZSB0byBkZWNvcmF0b3JzLCB3aGVyZSB0aGUga2V5IGlzIGVpdGhlciB0aGUgbmFtZSBvZiB0aGVcbiAgICogbWVtYmVyIG9yIGB1bmRlZmluZWRgIGlmIGl0IHJlZmVycyB0byBkZWNvcmF0b3JzIG9uIHRoZSBjbGFzcyBhcyBhIHdob2xlLlxuICAgKi9cbiAgcHJvdGVjdGVkIHJlZmxlY3REZWNvcmF0b3JzRnJvbUhlbHBlckNhbGwoXG4gICAgICBoZWxwZXJDYWxsOiB0cy5DYWxsRXhwcmVzc2lvbiwgdGFyZ2V0RmlsdGVyOiBUYXJnZXRGaWx0ZXIpOlxuICAgICAge2NsYXNzRGVjb3JhdG9yczogRGVjb3JhdG9yW10sIG1lbWJlckRlY29yYXRvcnM6IE1hcDxzdHJpbmcsIERlY29yYXRvcltdPn0ge1xuICAgIGNvbnN0IGNsYXNzRGVjb3JhdG9yczogRGVjb3JhdG9yW10gPSBbXTtcbiAgICBjb25zdCBtZW1iZXJEZWNvcmF0b3JzID0gbmV3IE1hcDxzdHJpbmcsIERlY29yYXRvcltdPigpO1xuXG4gICAgLy8gRmlyc3QgY2hlY2sgdGhhdCB0aGUgYHRhcmdldGAgYXJndW1lbnQgaXMgY29ycmVjdFxuICAgIGlmICh0YXJnZXRGaWx0ZXIoaGVscGVyQ2FsbC5hcmd1bWVudHNbMV0pKSB7XG4gICAgICAvLyBHcmFiIHRoZSBgZGVjb3JhdG9yc2AgYXJndW1lbnQgd2hpY2ggc2hvdWxkIGJlIGFuIGFycmF5IG9mIGNhbGxzXG4gICAgICBjb25zdCBkZWNvcmF0b3JDYWxscyA9IGhlbHBlckNhbGwuYXJndW1lbnRzWzBdO1xuICAgICAgaWYgKGRlY29yYXRvckNhbGxzICYmIHRzLmlzQXJyYXlMaXRlcmFsRXhwcmVzc2lvbihkZWNvcmF0b3JDYWxscykpIHtcbiAgICAgICAgZGVjb3JhdG9yQ2FsbHMuZWxlbWVudHMuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgICAgICAvLyBXZSBvbmx5IGNhcmUgYWJvdXQgdGhvc2UgZWxlbWVudHMgdGhhdCBhcmUgYWN0dWFsIGNhbGxzXG4gICAgICAgICAgaWYgKHRzLmlzQ2FsbEV4cHJlc3Npb24oZWxlbWVudCkpIHtcbiAgICAgICAgICAgIGNvbnN0IGRlY29yYXRvciA9IHRoaXMucmVmbGVjdERlY29yYXRvckNhbGwoZWxlbWVudCk7XG4gICAgICAgICAgICBpZiAoZGVjb3JhdG9yKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGtleUFyZyA9IGhlbHBlckNhbGwuYXJndW1lbnRzWzJdO1xuICAgICAgICAgICAgICBjb25zdCBrZXlOYW1lID0ga2V5QXJnICYmIHRzLmlzU3RyaW5nTGl0ZXJhbChrZXlBcmcpID8ga2V5QXJnLnRleHQgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgIGlmIChrZXlOYW1lID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBjbGFzc0RlY29yYXRvcnMucHVzaChkZWNvcmF0b3IpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRlY29yYXRvcnMgPSBtZW1iZXJEZWNvcmF0b3JzLmdldChrZXlOYW1lKSB8fCBbXTtcbiAgICAgICAgICAgICAgICBkZWNvcmF0b3JzLnB1c2goZGVjb3JhdG9yKTtcbiAgICAgICAgICAgICAgICBtZW1iZXJEZWNvcmF0b3JzLnNldChrZXlOYW1lLCBkZWNvcmF0b3JzKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7Y2xhc3NEZWNvcmF0b3JzLCBtZW1iZXJEZWNvcmF0b3JzfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeHRyYWN0IHRoZSBkZWNvcmF0b3IgaW5mb3JtYXRpb24gZnJvbSBhIGNhbGwgdG8gYSBkZWNvcmF0b3IgYXMgYSBmdW5jdGlvbi5cbiAgICogVGhpcyBoYXBwZW5zIHdoZW4gdGhlIGRlY29yYXRvcnMgaGFzIGJlZW4gdXNlZCBpbiBhIGBfX2RlY29yYXRlYCBoZWxwZXIgY2FsbC5cbiAgICogRm9yIGV4YW1wbGU6XG4gICAqXG4gICAqIGBgYFxuICAgKiBfX2RlY29yYXRlKFtcbiAgICogICBEaXJlY3RpdmUoeyBzZWxlY3RvcjogJ1tzb21lRGlyZWN0aXZlXScgfSksXG4gICAqIF0sIFNvbWVEaXJlY3RpdmUpO1xuICAgKiBgYGBcbiAgICpcbiAgICogSGVyZSB0aGUgYERpcmVjdGl2ZWAgZGVjb3JhdG9yIGlzIGRlY29yYXRpbmcgYFNvbWVEaXJlY3RpdmVgIGFuZCB0aGUgb3B0aW9ucyBmb3JcbiAgICogdGhlIGRlY29yYXRvciBhcmUgcGFzc2VkIGFzIGFyZ3VtZW50cyB0byB0aGUgYERpcmVjdGl2ZSgpYCBjYWxsLlxuICAgKlxuICAgKiBAcGFyYW0gY2FsbCB0aGUgY2FsbCB0byB0aGUgZGVjb3JhdG9yLlxuICAgKiBAcmV0dXJucyBhIGRlY29yYXRvciBjb250YWluaW5nIHRoZSByZWZsZWN0ZWQgaW5mb3JtYXRpb24sIG9yIG51bGwgaWYgdGhlIGNhbGxcbiAgICogaXMgbm90IGEgdmFsaWQgZGVjb3JhdG9yIGNhbGwuXG4gICAqL1xuICBwcm90ZWN0ZWQgcmVmbGVjdERlY29yYXRvckNhbGwoY2FsbDogdHMuQ2FsbEV4cHJlc3Npb24pOiBEZWNvcmF0b3J8bnVsbCB7XG4gICAgLy8gVGhlIGNhbGwgY291bGQgYmUgb2YgdGhlIGZvcm0gYERlY29yYXRvciguLi4pYCBvciBgbmFtZXNwYWNlXzEuRGVjb3JhdG9yKC4uLilgXG4gICAgY29uc3QgZGVjb3JhdG9yRXhwcmVzc2lvbiA9XG4gICAgICAgIHRzLmlzUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uKGNhbGwuZXhwcmVzc2lvbikgPyBjYWxsLmV4cHJlc3Npb24ubmFtZSA6IGNhbGwuZXhwcmVzc2lvbjtcbiAgICBpZiAodHMuaXNJZGVudGlmaWVyKGRlY29yYXRvckV4cHJlc3Npb24pKSB7XG4gICAgICAvLyBXZSBmb3VuZCBhIGRlY29yYXRvciFcbiAgICAgIGNvbnN0IGRlY29yYXRvcklkZW50aWZpZXIgPSBkZWNvcmF0b3JFeHByZXNzaW9uO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbmFtZTogZGVjb3JhdG9ySWRlbnRpZmllci50ZXh0LFxuICAgICAgICBpbXBvcnQ6IHRoaXMuZ2V0SW1wb3J0T2ZJZGVudGlmaWVyKGRlY29yYXRvcklkZW50aWZpZXIpLFxuICAgICAgICBub2RlOiBjYWxsLFxuICAgICAgICBhcmdzOiBBcnJheS5mcm9tKGNhbGwuYXJndW1lbnRzKVxuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgdGhlIGdpdmVuIHN0YXRlbWVudCB0byBzZWUgaWYgaXQgaXMgYSBjYWxsIHRvIHRoZSBzcGVjaWZpZWQgaGVscGVyIGZ1bmN0aW9uIG9yIG51bGwgaWZcbiAgICogbm90IGZvdW5kLlxuICAgKlxuICAgKiBNYXRjaGluZyBzdGF0ZW1lbnRzIHdpbGwgbG9vayBsaWtlOiAgYHRzbGliXzEuX19kZWNvcmF0ZSguLi4pO2AuXG4gICAqIEBwYXJhbSBzdGF0ZW1lbnQgdGhlIHN0YXRlbWVudCB0aGF0IG1heSBjb250YWluIHRoZSBjYWxsLlxuICAgKiBAcGFyYW0gaGVscGVyTmFtZSB0aGUgbmFtZSBvZiB0aGUgaGVscGVyIHdlIGFyZSBsb29raW5nIGZvci5cbiAgICogQHJldHVybnMgdGhlIG5vZGUgdGhhdCBjb3JyZXNwb25kcyB0byB0aGUgYF9fZGVjb3JhdGUoLi4uKWAgY2FsbCBvciBudWxsIGlmIHRoZSBzdGF0ZW1lbnQgZG9lc1xuICAgKiBub3QgbWF0Y2guXG4gICAqL1xuICBwcm90ZWN0ZWQgZ2V0SGVscGVyQ2FsbChzdGF0ZW1lbnQ6IHRzLlN0YXRlbWVudCwgaGVscGVyTmFtZTogc3RyaW5nKTogdHMuQ2FsbEV4cHJlc3Npb258bnVsbCB7XG4gICAgaWYgKHRzLmlzRXhwcmVzc2lvblN0YXRlbWVudChzdGF0ZW1lbnQpKSB7XG4gICAgICBjb25zdCBleHByZXNzaW9uID1cbiAgICAgICAgICBpc0Fzc2lnbm1lbnRTdGF0ZW1lbnQoc3RhdGVtZW50KSA/IHN0YXRlbWVudC5leHByZXNzaW9uLnJpZ2h0IDogc3RhdGVtZW50LmV4cHJlc3Npb247XG4gICAgICBpZiAodHMuaXNDYWxsRXhwcmVzc2lvbihleHByZXNzaW9uKSAmJiBnZXRDYWxsZWVOYW1lKGV4cHJlc3Npb24pID09PSBoZWxwZXJOYW1lKSB7XG4gICAgICAgIHJldHVybiBleHByZXNzaW9uO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG5cblxuICAvKipcbiAgICogUmVmbGVjdCBvdmVyIHRoZSBnaXZlbiBhcnJheSBub2RlIGFuZCBleHRyYWN0IGRlY29yYXRvciBpbmZvcm1hdGlvbiBmcm9tIGVhY2ggZWxlbWVudC5cbiAgICpcbiAgICogVGhpcyBpcyB1c2VkIGZvciBkZWNvcmF0b3JzIHRoYXQgYXJlIGRlZmluZWQgaW4gc3RhdGljIHByb3BlcnRpZXMuIEZvciBleGFtcGxlOlxuICAgKlxuICAgKiBgYGBcbiAgICogU29tZURpcmVjdGl2ZS5kZWNvcmF0b3JzID0gW1xuICAgKiAgIHsgdHlwZTogRGlyZWN0aXZlLCBhcmdzOiBbeyBzZWxlY3RvcjogJ1tzb21lRGlyZWN0aXZlXScgfSxdIH1cbiAgICogXTtcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSBkZWNvcmF0b3JzQXJyYXkgYW4gZXhwcmVzc2lvbiB0aGF0IGNvbnRhaW5zIGRlY29yYXRvciBpbmZvcm1hdGlvbi5cbiAgICogQHJldHVybnMgYW4gYXJyYXkgb2YgZGVjb3JhdG9yIGluZm8gdGhhdCB3YXMgcmVmbGVjdGVkIGZyb20gdGhlIGFycmF5IG5vZGUuXG4gICAqL1xuICBwcm90ZWN0ZWQgcmVmbGVjdERlY29yYXRvcnMoZGVjb3JhdG9yc0FycmF5OiB0cy5FeHByZXNzaW9uKTogRGVjb3JhdG9yW10ge1xuICAgIGNvbnN0IGRlY29yYXRvcnM6IERlY29yYXRvcltdID0gW107XG5cbiAgICBpZiAodHMuaXNBcnJheUxpdGVyYWxFeHByZXNzaW9uKGRlY29yYXRvcnNBcnJheSkpIHtcbiAgICAgIC8vIEFkZCBlYWNoIGRlY29yYXRvciB0aGF0IGlzIGltcG9ydGVkIGZyb20gYEBhbmd1bGFyL2NvcmVgIGludG8gdGhlIGBkZWNvcmF0b3JzYCBhcnJheVxuICAgICAgZGVjb3JhdG9yc0FycmF5LmVsZW1lbnRzLmZvckVhY2gobm9kZSA9PiB7XG5cbiAgICAgICAgLy8gSWYgdGhlIGRlY29yYXRvciBpcyBub3QgYW4gb2JqZWN0IGxpdGVyYWwgZXhwcmVzc2lvbiB0aGVuIHdlIGFyZSBub3QgaW50ZXJlc3RlZFxuICAgICAgICBpZiAodHMuaXNPYmplY3RMaXRlcmFsRXhwcmVzc2lvbihub2RlKSkge1xuICAgICAgICAgIC8vIFdlIGFyZSBvbmx5IGludGVyZXN0ZWQgaW4gb2JqZWN0cyBvZiB0aGUgZm9ybTogYHsgdHlwZTogRGVjb3JhdG9yVHlwZSwgYXJnczogWy4uLl0gfWBcbiAgICAgICAgICBjb25zdCBkZWNvcmF0b3IgPSByZWZsZWN0T2JqZWN0TGl0ZXJhbChub2RlKTtcblxuICAgICAgICAgIC8vIElzIHRoZSB2YWx1ZSBvZiB0aGUgYHR5cGVgIHByb3BlcnR5IGFuIGlkZW50aWZpZXI/XG4gICAgICAgICAgY29uc3QgdHlwZUlkZW50aWZpZXIgPSBkZWNvcmF0b3IuZ2V0KCd0eXBlJyk7XG4gICAgICAgICAgaWYgKHR5cGVJZGVudGlmaWVyICYmIHRzLmlzSWRlbnRpZmllcih0eXBlSWRlbnRpZmllcikpIHtcbiAgICAgICAgICAgIGRlY29yYXRvcnMucHVzaCh7XG4gICAgICAgICAgICAgIG5hbWU6IHR5cGVJZGVudGlmaWVyLnRleHQsXG4gICAgICAgICAgICAgIGltcG9ydDogdGhpcy5nZXRJbXBvcnRPZklkZW50aWZpZXIodHlwZUlkZW50aWZpZXIpLCBub2RlLFxuICAgICAgICAgICAgICBhcmdzOiBnZXREZWNvcmF0b3JBcmdzKG5vZGUpLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGRlY29yYXRvcnM7XG4gIH1cblxuICAvKipcbiAgICogUmVmbGVjdCBvdmVyIGEgc3ltYm9sIGFuZCBleHRyYWN0IHRoZSBtZW1iZXIgaW5mb3JtYXRpb24sIGNvbWJpbmluZyBpdCB3aXRoIHRoZVxuICAgKiBwcm92aWRlZCBkZWNvcmF0b3IgaW5mb3JtYXRpb24sIGFuZCB3aGV0aGVyIGl0IGlzIGEgc3RhdGljIG1lbWJlci5cbiAgICogQHBhcmFtIHN5bWJvbCB0aGUgc3ltYm9sIGZvciB0aGUgbWVtYmVyIHRvIHJlZmxlY3Qgb3Zlci5cbiAgICogQHBhcmFtIGRlY29yYXRvcnMgYW4gYXJyYXkgb2YgZGVjb3JhdG9ycyBhc3NvY2lhdGVkIHdpdGggdGhlIG1lbWJlci5cbiAgICogQHBhcmFtIGlzU3RhdGljIHRydWUgaWYgdGhpcyBtZW1iZXIgaXMgc3RhdGljLCBmYWxzZSBpZiBpdCBpcyBhbiBpbnN0YW5jZSBwcm9wZXJ0eS5cbiAgICogQHJldHVybnMgdGhlIHJlZmxlY3RlZCBtZW1iZXIgaW5mb3JtYXRpb24sIG9yIG51bGwgaWYgdGhlIHN5bWJvbCBpcyBub3QgYSBtZW1iZXIuXG4gICAqL1xuICBwcm90ZWN0ZWQgcmVmbGVjdE1lbWJlcihzeW1ib2w6IHRzLlN5bWJvbCwgZGVjb3JhdG9ycz86IERlY29yYXRvcltdLCBpc1N0YXRpYz86IGJvb2xlYW4pOlxuICAgICAgQ2xhc3NNZW1iZXJ8bnVsbCB7XG4gICAgbGV0IGtpbmQ6IENsYXNzTWVtYmVyS2luZHxudWxsID0gbnVsbDtcbiAgICBsZXQgdmFsdWU6IHRzLkV4cHJlc3Npb258bnVsbCA9IG51bGw7XG4gICAgbGV0IG5hbWU6IHN0cmluZ3xudWxsID0gbnVsbDtcbiAgICBsZXQgbmFtZU5vZGU6IHRzLklkZW50aWZpZXJ8bnVsbCA9IG51bGw7XG4gICAgbGV0IHR5cGUgPSBudWxsO1xuXG5cbiAgICBjb25zdCBub2RlID0gc3ltYm9sLnZhbHVlRGVjbGFyYXRpb24gfHwgc3ltYm9sLmRlY2xhcmF0aW9ucyAmJiBzeW1ib2wuZGVjbGFyYXRpb25zWzBdO1xuICAgIGlmICghbm9kZSB8fCAhaXNDbGFzc01lbWJlclR5cGUobm9kZSkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmIChzeW1ib2wuZmxhZ3MgJiB0cy5TeW1ib2xGbGFncy5NZXRob2QpIHtcbiAgICAgIGtpbmQgPSBDbGFzc01lbWJlcktpbmQuTWV0aG9kO1xuICAgIH0gZWxzZSBpZiAoc3ltYm9sLmZsYWdzICYgdHMuU3ltYm9sRmxhZ3MuUHJvcGVydHkpIHtcbiAgICAgIGtpbmQgPSBDbGFzc01lbWJlcktpbmQuUHJvcGVydHk7XG4gICAgfSBlbHNlIGlmIChzeW1ib2wuZmxhZ3MgJiB0cy5TeW1ib2xGbGFncy5HZXRBY2Nlc3Nvcikge1xuICAgICAga2luZCA9IENsYXNzTWVtYmVyS2luZC5HZXR0ZXI7XG4gICAgfSBlbHNlIGlmIChzeW1ib2wuZmxhZ3MgJiB0cy5TeW1ib2xGbGFncy5TZXRBY2Nlc3Nvcikge1xuICAgICAga2luZCA9IENsYXNzTWVtYmVyS2luZC5TZXR0ZXI7XG4gICAgfVxuXG4gICAgaWYgKGlzU3RhdGljICYmIGlzUHJvcGVydHlBY2Nlc3Mobm9kZSkpIHtcbiAgICAgIG5hbWUgPSBub2RlLm5hbWUudGV4dDtcbiAgICAgIHZhbHVlID0gc3ltYm9sLmZsYWdzICYgdHMuU3ltYm9sRmxhZ3MuUHJvcGVydHkgPyBub2RlLnBhcmVudC5yaWdodCA6IG51bGw7XG4gICAgfSBlbHNlIGlmIChpc1RoaXNBc3NpZ25tZW50KG5vZGUpKSB7XG4gICAgICBraW5kID0gQ2xhc3NNZW1iZXJLaW5kLlByb3BlcnR5O1xuICAgICAgbmFtZSA9IG5vZGUubGVmdC5uYW1lLnRleHQ7XG4gICAgICB2YWx1ZSA9IG5vZGUucmlnaHQ7XG4gICAgICBpc1N0YXRpYyA9IGZhbHNlO1xuICAgIH0gZWxzZSBpZiAodHMuaXNDb25zdHJ1Y3RvckRlY2xhcmF0aW9uKG5vZGUpKSB7XG4gICAgICBraW5kID0gQ2xhc3NNZW1iZXJLaW5kLkNvbnN0cnVjdG9yO1xuICAgICAgbmFtZSA9ICdjb25zdHJ1Y3Rvcic7XG4gICAgICBpc1N0YXRpYyA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChraW5kID09PSBudWxsKSB7XG4gICAgICBjb25zb2xlLndhcm4oYFVua25vd24gbWVtYmVyIHR5cGU6IFwiJHtub2RlLmdldFRleHQoKX1gKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmICghbmFtZSkge1xuICAgICAgaWYgKGlzTmFtZWREZWNsYXJhdGlvbihub2RlKSAmJiBub2RlLm5hbWUgJiYgdHMuaXNJZGVudGlmaWVyKG5vZGUubmFtZSkpIHtcbiAgICAgICAgbmFtZSA9IG5vZGUubmFtZS50ZXh0O1xuICAgICAgICBuYW1lTm9kZSA9IG5vZGUubmFtZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIElmIHdlIGhhdmUgc3RpbGwgbm90IGRldGVybWluZWQgaWYgdGhpcyBpcyBhIHN0YXRpYyBvciBpbnN0YW5jZSBtZW1iZXIgdGhlblxuICAgIC8vIGxvb2sgZm9yIHRoZSBgc3RhdGljYCBrZXl3b3JkIG9uIHRoZSBkZWNsYXJhdGlvblxuICAgIGlmIChpc1N0YXRpYyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBpc1N0YXRpYyA9IG5vZGUubW9kaWZpZXJzICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICBub2RlLm1vZGlmaWVycy5zb21lKG1vZCA9PiBtb2Qua2luZCA9PT0gdHMuU3ludGF4S2luZC5TdGF0aWNLZXl3b3JkKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgbm9kZSxcbiAgICAgIGltcGxlbWVudGF0aW9uOiBub2RlLCBraW5kLCB0eXBlLCBuYW1lLCBuYW1lTm9kZSwgdmFsdWUsIGlzU3RhdGljLFxuICAgICAgZGVjb3JhdG9yczogZGVjb3JhdG9ycyB8fCBbXVxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogRmluZCB0aGUgZGVjbGFyYXRpb25zIG9mIHRoZSBjb25zdHJ1Y3RvciBwYXJhbWV0ZXJzIG9mIGEgY2xhc3MgaWRlbnRpZmllZCBieSBpdHMgc3ltYm9sLlxuICAgKiBAcGFyYW0gY2xhc3NTeW1ib2wgdGhlIGNsYXNzIHdob3NlIHBhcmFtZXRlcnMgd2Ugd2FudCB0byBmaW5kLlxuICAgKiBAcmV0dXJucyBhbiBhcnJheSBvZiBgdHMuUGFyYW1ldGVyRGVjbGFyYXRpb25gIG9iamVjdHMgcmVwcmVzZW50aW5nIGVhY2ggb2YgdGhlIHBhcmFtZXRlcnMgaW5cbiAgICogdGhlIGNsYXNzJ3MgY29uc3RydWN0b3Igb3IgbnVsbCBpZiB0aGVyZSBpcyBubyBjb25zdHJ1Y3Rvci5cbiAgICovXG4gIHByb3RlY3RlZCBnZXRDb25zdHJ1Y3RvclBhcmFtZXRlckRlY2xhcmF0aW9ucyhjbGFzc1N5bWJvbDogdHMuU3ltYm9sKTpcbiAgICAgIHRzLlBhcmFtZXRlckRlY2xhcmF0aW9uW118bnVsbCB7XG4gICAgY29uc3QgY29uc3RydWN0b3JTeW1ib2wgPSBjbGFzc1N5bWJvbC5tZW1iZXJzICYmIGNsYXNzU3ltYm9sLm1lbWJlcnMuZ2V0KENPTlNUUlVDVE9SKTtcbiAgICBpZiAoY29uc3RydWN0b3JTeW1ib2wpIHtcbiAgICAgIC8vIEZvciBzb21lIHJlYXNvbiB0aGUgY29uc3RydWN0b3IgZG9lcyBub3QgaGF2ZSBhIGB2YWx1ZURlY2xhcmF0aW9uYCA/IT9cbiAgICAgIGNvbnN0IGNvbnN0cnVjdG9yID0gY29uc3RydWN0b3JTeW1ib2wuZGVjbGFyYXRpb25zICYmXG4gICAgICAgICAgY29uc3RydWN0b3JTeW1ib2wuZGVjbGFyYXRpb25zWzBdIGFzIHRzLkNvbnN0cnVjdG9yRGVjbGFyYXRpb247XG4gICAgICBpZiAoY29uc3RydWN0b3IgJiYgY29uc3RydWN0b3IucGFyYW1ldGVycykge1xuICAgICAgICByZXR1cm4gQXJyYXkuZnJvbShjb25zdHJ1Y3Rvci5wYXJhbWV0ZXJzKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBwYXJhbWV0ZXIgZGVjb3JhdG9ycyBvZiBhIGNsYXNzIGNvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gY2xhc3NTeW1ib2wgdGhlIGNsYXNzIHdob3NlIHBhcmFtZXRlciBpbmZvIHdlIHdhbnQgdG8gZ2V0LlxuICAgKiBAcGFyYW0gcGFyYW1ldGVyTm9kZXMgdGhlIGFycmF5IG9mIFR5cGVTY3JpcHQgcGFyYW1ldGVyIG5vZGVzIGZvciB0aGlzIGNsYXNzJ3MgY29uc3RydWN0b3IuXG4gICAqIEByZXR1cm5zIGFuIGFycmF5IG9mIGNvbnN0cnVjdG9yIHBhcmFtZXRlciBpbmZvIG9iamVjdHMuXG4gICAqL1xuICBwcm90ZWN0ZWQgZ2V0Q29uc3RydWN0b3JQYXJhbUluZm8oXG4gICAgICBjbGFzc1N5bWJvbDogdHMuU3ltYm9sLCBwYXJhbWV0ZXJOb2RlczogdHMuUGFyYW1ldGVyRGVjbGFyYXRpb25bXSk6IEN0b3JQYXJhbWV0ZXJbXSB7XG4gICAgY29uc3QgcGFyYW1zUHJvcGVydHkgPSB0aGlzLmdldFN0YXRpY1Byb3BlcnR5KGNsYXNzU3ltYm9sLCBDT05TVFJVQ1RPUl9QQVJBTVMpO1xuICAgIGNvbnN0IHBhcmFtSW5mbzogUGFyYW1JbmZvW118bnVsbCA9IHBhcmFtc1Byb3BlcnR5ID9cbiAgICAgICAgdGhpcy5nZXRQYXJhbUluZm9Gcm9tU3RhdGljUHJvcGVydHkocGFyYW1zUHJvcGVydHkpIDpcbiAgICAgICAgdGhpcy5nZXRQYXJhbUluZm9Gcm9tSGVscGVyQ2FsbChjbGFzc1N5bWJvbCwgcGFyYW1ldGVyTm9kZXMpO1xuXG4gICAgcmV0dXJuIHBhcmFtZXRlck5vZGVzLm1hcCgobm9kZSwgaW5kZXgpID0+IHtcbiAgICAgIGNvbnN0IHtkZWNvcmF0b3JzLCB0eXBlfSA9XG4gICAgICAgICAgcGFyYW1JbmZvICYmIHBhcmFtSW5mb1tpbmRleF0gPyBwYXJhbUluZm9baW5kZXhdIDoge2RlY29yYXRvcnM6IG51bGwsIHR5cGU6IG51bGx9O1xuICAgICAgY29uc3QgbmFtZU5vZGUgPSBub2RlLm5hbWU7XG4gICAgICByZXR1cm4ge25hbWU6IGdldE5hbWVUZXh0KG5hbWVOb2RlKSwgbmFtZU5vZGUsIHR5cGUsIGRlY29yYXRvcnN9O1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgcGFyYW1ldGVyIHR5cGUgYW5kIGRlY29yYXRvcnMgZm9yIHRoZSBjb25zdHJ1Y3RvciBvZiBhIGNsYXNzLFxuICAgKiB3aGVyZSB0aGUgaW5mb3JtYXRpb24gaXMgc3RvcmVkIG9uIGEgc3RhdGljIG1ldGhvZCBvZiB0aGUgY2xhc3MuXG4gICAqXG4gICAqIE5vdGUgdGhhdCBpbiBFU00yMDE1LCB0aGUgbWV0aG9kIGlzIGRlZmluZWQgYnkgYW4gYXJyb3cgZnVuY3Rpb24gdGhhdCByZXR1cm5zIGFuIGFycmF5IG9mXG4gICAqIGRlY29yYXRvciBhbmQgdHlwZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogYGBgXG4gICAqIFNvbWVEaXJlY3RpdmUuY3RvclBhcmFtZXRlcnMgPSAoKSA9PiBbXG4gICAqICAgeyB0eXBlOiBWaWV3Q29udGFpbmVyUmVmLCB9LFxuICAgKiAgIHsgdHlwZTogVGVtcGxhdGVSZWYsIH0sXG4gICAqICAgeyB0eXBlOiB1bmRlZmluZWQsIGRlY29yYXRvcnM6IFt7IHR5cGU6IEluamVjdCwgYXJnczogW0lOSkVDVEVEX1RPS0VOLF0gfSxdIH0sXG4gICAqIF07XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0gcGFyYW1EZWNvcmF0b3JzUHJvcGVydHkgdGhlIHByb3BlcnR5IHRoYXQgaG9sZHMgdGhlIHBhcmFtZXRlciBpbmZvIHdlIHdhbnQgdG8gZ2V0LlxuICAgKiBAcmV0dXJucyBhbiBhcnJheSBvZiBvYmplY3RzIGNvbnRhaW5pbmcgdGhlIHR5cGUgYW5kIGRlY29yYXRvcnMgZm9yIGVhY2ggcGFyYW1ldGVyLlxuICAgKi9cbiAgcHJvdGVjdGVkIGdldFBhcmFtSW5mb0Zyb21TdGF0aWNQcm9wZXJ0eShwYXJhbURlY29yYXRvcnNQcm9wZXJ0eTogdHMuU3ltYm9sKTogUGFyYW1JbmZvW118bnVsbCB7XG4gICAgY29uc3QgcGFyYW1EZWNvcmF0b3JzID0gZ2V0UHJvcGVydHlWYWx1ZUZyb21TeW1ib2wocGFyYW1EZWNvcmF0b3JzUHJvcGVydHkpO1xuICAgIGlmIChwYXJhbURlY29yYXRvcnMgJiYgdHMuaXNBcnJvd0Z1bmN0aW9uKHBhcmFtRGVjb3JhdG9ycykpIHtcbiAgICAgIGlmICh0cy5pc0FycmF5TGl0ZXJhbEV4cHJlc3Npb24ocGFyYW1EZWNvcmF0b3JzLmJvZHkpKSB7XG4gICAgICAgIGNvbnN0IGVsZW1lbnRzID0gcGFyYW1EZWNvcmF0b3JzLmJvZHkuZWxlbWVudHM7XG4gICAgICAgIHJldHVybiBlbGVtZW50c1xuICAgICAgICAgICAgLm1hcChcbiAgICAgICAgICAgICAgICBlbGVtZW50ID0+XG4gICAgICAgICAgICAgICAgICAgIHRzLmlzT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24oZWxlbWVudCkgPyByZWZsZWN0T2JqZWN0TGl0ZXJhbChlbGVtZW50KSA6IG51bGwpXG4gICAgICAgICAgICAubWFwKHBhcmFtSW5mbyA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IHR5cGUgPSBwYXJhbUluZm8gJiYgcGFyYW1JbmZvLmdldCgndHlwZScpIHx8IG51bGw7XG4gICAgICAgICAgICAgIGNvbnN0IGRlY29yYXRvckluZm8gPSBwYXJhbUluZm8gJiYgcGFyYW1JbmZvLmdldCgnZGVjb3JhdG9ycycpIHx8IG51bGw7XG4gICAgICAgICAgICAgIGNvbnN0IGRlY29yYXRvcnMgPSBkZWNvcmF0b3JJbmZvICYmXG4gICAgICAgICAgICAgICAgICB0aGlzLnJlZmxlY3REZWNvcmF0b3JzKGRlY29yYXRvckluZm8pXG4gICAgICAgICAgICAgICAgICAgICAgLmZpbHRlcihkZWNvcmF0b3IgPT4gdGhpcy5pc0Zyb21Db3JlKGRlY29yYXRvcikpO1xuICAgICAgICAgICAgICByZXR1cm4ge3R5cGUsIGRlY29yYXRvcnN9O1xuICAgICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgcGFybWV0ZXIgdHlwZSBhbmQgZGVjb3JhdG9ycyBmb3IgYSBjbGFzcyB3aGVyZSB0aGUgaW5mb3JtYXRpb24gaXMgc3RvcmVkIG9uXG4gICAqIGluIGNhbGxzIHRvIGBfX2RlY29yYXRlYCBoZWxwZXJzLlxuICAgKlxuICAgKiBSZWZsZWN0IG92ZXIgdGhlIGhlbHBlcnMgdG8gZmluZCB0aGUgZGVjb3JhdG9ycyBhbmQgdHlwZXMgYWJvdXQgZWFjaCBvZlxuICAgKiB0aGUgY2xhc3MncyBjb25zdHJ1Y3RvciBwYXJhbWV0ZXJzLlxuICAgKlxuICAgKiBAcGFyYW0gY2xhc3NTeW1ib2wgdGhlIGNsYXNzIHdob3NlIHBhcmFtZXRlciBpbmZvIHdlIHdhbnQgdG8gZ2V0LlxuICAgKiBAcGFyYW0gcGFyYW1ldGVyTm9kZXMgdGhlIGFycmF5IG9mIFR5cGVTY3JpcHQgcGFyYW1ldGVyIG5vZGVzIGZvciB0aGlzIGNsYXNzJ3MgY29uc3RydWN0b3IuXG4gICAqIEByZXR1cm5zIGFuIGFycmF5IG9mIG9iamVjdHMgY29udGFpbmluZyB0aGUgdHlwZSBhbmQgZGVjb3JhdG9ycyBmb3IgZWFjaCBwYXJhbWV0ZXIuXG4gICAqL1xuICBwcm90ZWN0ZWQgZ2V0UGFyYW1JbmZvRnJvbUhlbHBlckNhbGwoXG4gICAgICBjbGFzc1N5bWJvbDogdHMuU3ltYm9sLCBwYXJhbWV0ZXJOb2RlczogdHMuUGFyYW1ldGVyRGVjbGFyYXRpb25bXSk6IFBhcmFtSW5mb1tdIHtcbiAgICBjb25zdCBwYXJhbWV0ZXJzOiBQYXJhbUluZm9bXSA9IHBhcmFtZXRlck5vZGVzLm1hcCgoKSA9PiAoe3R5cGU6IG51bGwsIGRlY29yYXRvcnM6IG51bGx9KSk7XG4gICAgY29uc3QgaGVscGVyQ2FsbHMgPSB0aGlzLmdldEhlbHBlckNhbGxzRm9yQ2xhc3MoY2xhc3NTeW1ib2wsICdfX2RlY29yYXRlJyk7XG4gICAgaGVscGVyQ2FsbHMuZm9yRWFjaChoZWxwZXJDYWxsID0+IHtcbiAgICAgIGNvbnN0IHtjbGFzc0RlY29yYXRvcnN9ID1cbiAgICAgICAgICB0aGlzLnJlZmxlY3REZWNvcmF0b3JzRnJvbUhlbHBlckNhbGwoaGVscGVyQ2FsbCwgbWFrZUNsYXNzVGFyZ2V0RmlsdGVyKGNsYXNzU3ltYm9sLm5hbWUpKTtcbiAgICAgIGNsYXNzRGVjb3JhdG9ycy5mb3JFYWNoKGNhbGwgPT4ge1xuICAgICAgICBzd2l0Y2ggKGNhbGwubmFtZSkge1xuICAgICAgICAgIGNhc2UgJ19fbWV0YWRhdGEnOlxuICAgICAgICAgICAgY29uc3QgbWV0YWRhdGFBcmcgPSBjYWxsLmFyZ3MgJiYgY2FsbC5hcmdzWzBdO1xuICAgICAgICAgICAgY29uc3QgdHlwZXNBcmcgPSBjYWxsLmFyZ3MgJiYgY2FsbC5hcmdzWzFdO1xuICAgICAgICAgICAgY29uc3QgaXNQYXJhbVR5cGVEZWNvcmF0b3IgPSBtZXRhZGF0YUFyZyAmJiB0cy5pc1N0cmluZ0xpdGVyYWwobWV0YWRhdGFBcmcpICYmXG4gICAgICAgICAgICAgICAgbWV0YWRhdGFBcmcudGV4dCA9PT0gJ2Rlc2lnbjpwYXJhbXR5cGVzJztcbiAgICAgICAgICAgIGNvbnN0IHR5cGVzID0gdHlwZXNBcmcgJiYgdHMuaXNBcnJheUxpdGVyYWxFeHByZXNzaW9uKHR5cGVzQXJnKSAmJiB0eXBlc0FyZy5lbGVtZW50cztcbiAgICAgICAgICAgIGlmIChpc1BhcmFtVHlwZURlY29yYXRvciAmJiB0eXBlcykge1xuICAgICAgICAgICAgICB0eXBlcy5mb3JFYWNoKCh0eXBlLCBpbmRleCkgPT4gcGFyYW1ldGVyc1tpbmRleF0udHlwZSA9IHR5cGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnX19wYXJhbSc6XG4gICAgICAgICAgICBjb25zdCBwYXJhbUluZGV4QXJnID0gY2FsbC5hcmdzICYmIGNhbGwuYXJnc1swXTtcbiAgICAgICAgICAgIGNvbnN0IGRlY29yYXRvckNhbGxBcmcgPSBjYWxsLmFyZ3MgJiYgY2FsbC5hcmdzWzFdO1xuICAgICAgICAgICAgY29uc3QgcGFyYW1JbmRleCA9IHBhcmFtSW5kZXhBcmcgJiYgdHMuaXNOdW1lcmljTGl0ZXJhbChwYXJhbUluZGV4QXJnKSA/XG4gICAgICAgICAgICAgICAgcGFyc2VJbnQocGFyYW1JbmRleEFyZy50ZXh0LCAxMCkgOlxuICAgICAgICAgICAgICAgIE5hTjtcbiAgICAgICAgICAgIGNvbnN0IGRlY29yYXRvciA9IGRlY29yYXRvckNhbGxBcmcgJiYgdHMuaXNDYWxsRXhwcmVzc2lvbihkZWNvcmF0b3JDYWxsQXJnKSA/XG4gICAgICAgICAgICAgICAgdGhpcy5yZWZsZWN0RGVjb3JhdG9yQ2FsbChkZWNvcmF0b3JDYWxsQXJnKSA6XG4gICAgICAgICAgICAgICAgbnVsbDtcbiAgICAgICAgICAgIGlmICghaXNOYU4ocGFyYW1JbmRleCkgJiYgZGVjb3JhdG9yKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGRlY29yYXRvcnMgPSBwYXJhbWV0ZXJzW3BhcmFtSW5kZXhdLmRlY29yYXRvcnMgPVxuICAgICAgICAgICAgICAgICAgcGFyYW1ldGVyc1twYXJhbUluZGV4XS5kZWNvcmF0b3JzIHx8IFtdO1xuICAgICAgICAgICAgICBkZWNvcmF0b3JzLnB1c2goZGVjb3JhdG9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gcGFyYW1ldGVycztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZWFyY2ggc3RhdGVtZW50cyByZWxhdGVkIHRvIHRoZSBnaXZlbiBjbGFzcyBmb3IgY2FsbHMgdG8gdGhlIHNwZWNpZmllZCBoZWxwZXIuXG4gICAqIEBwYXJhbSBjbGFzc1N5bWJvbCB0aGUgY2xhc3Mgd2hvc2UgaGVscGVyIGNhbGxzIHdlIGFyZSBpbnRlcmVzdGVkIGluLlxuICAgKiBAcGFyYW0gaGVscGVyTmFtZSB0aGUgbmFtZSBvZiB0aGUgaGVscGVyIChlLmcuIGBfX2RlY29yYXRlYCkgd2hvc2UgY2FsbHMgd2UgYXJlIGludGVyZXN0ZWQgaW4uXG4gICAqIEByZXR1cm5zIGFuIGFycmF5IG9mIENhbGxFeHByZXNzaW9uIG5vZGVzIGZvciBlYWNoIG1hdGNoaW5nIGhlbHBlciBjYWxsLlxuICAgKi9cbiAgcHJvdGVjdGVkIGdldEhlbHBlckNhbGxzRm9yQ2xhc3MoY2xhc3NTeW1ib2w6IHRzLlN5bWJvbCwgaGVscGVyTmFtZTogc3RyaW5nKTpcbiAgICAgIHRzLkNhbGxFeHByZXNzaW9uW10ge1xuICAgIHJldHVybiB0aGlzLmdldFN0YXRlbWVudHNGb3JDbGFzcyhjbGFzc1N5bWJvbClcbiAgICAgICAgLm1hcChzdGF0ZW1lbnQgPT4gdGhpcy5nZXRIZWxwZXJDYWxsKHN0YXRlbWVudCwgaGVscGVyTmFtZSkpXG4gICAgICAgIC5maWx0ZXIoaXNEZWZpbmVkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGaW5kIHN0YXRlbWVudHMgcmVsYXRlZCB0byB0aGUgZ2l2ZW4gY2xhc3MgdGhhdCBtYXkgY29udGFpbiBjYWxscyB0byBhIGhlbHBlci5cbiAgICpcbiAgICogSW4gRVNNMjAxNSBjb2RlIHRoZSBoZWxwZXIgY2FsbHMgYXJlIGluIHRoZSB0b3AgbGV2ZWwgbW9kdWxlLCBzbyB3ZSBoYXZlIHRvIGNvbnNpZGVyXG4gICAqIGFsbCB0aGUgc3RhdGVtZW50cyBpbiB0aGUgbW9kdWxlLlxuICAgKlxuICAgKiBAcGFyYW0gY2xhc3NTeW1ib2wgdGhlIGNsYXNzIHdob3NlIGhlbHBlciBjYWxscyB3ZSBhcmUgaW50ZXJlc3RlZCBpbi5cbiAgICogQHJldHVybnMgYW4gYXJyYXkgb2Ygc3RhdGVtZW50cyB0aGF0IG1heSBjb250YWluIGhlbHBlciBjYWxscy5cbiAgICovXG4gIHByb3RlY3RlZCBnZXRTdGF0ZW1lbnRzRm9yQ2xhc3MoY2xhc3NTeW1ib2w6IHRzLlN5bWJvbCk6IHRzLlN0YXRlbWVudFtdIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbShjbGFzc1N5bWJvbC52YWx1ZURlY2xhcmF0aW9uLmdldFNvdXJjZUZpbGUoKS5zdGF0ZW1lbnRzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUcnkgdG8gZ2V0IHRoZSBpbXBvcnQgaW5mbyBmb3IgdGhpcyBpZGVudGlmaWVyIGFzIHRob3VnaCBpdCBpcyBhIG5hbWVzcGFjZWQgaW1wb3J0LlxuICAgKiBGb3IgZXhhbXBsZSwgaWYgdGhlIGlkZW50aWZpZXIgaXMgdGhlIGBfX21ldGFkYXRhYCBwYXJ0IG9mIGEgcHJvcGVydHkgYWNjZXNzIGNoYWluIGxpa2U6XG4gICAqXG4gICAqIGBgYFxuICAgKiB0c2xpYl8xLl9fbWV0YWRhdGFcbiAgICogYGBgXG4gICAqXG4gICAqIHRoZW4gaXQgbWlnaHQgYmUgdGhhdCBgdHNsaWJfMWAgaXMgYSBuYW1lc3BhY2UgaW1wb3J0IHN1Y2ggYXM6XG4gICAqXG4gICAqIGBgYFxuICAgKiBpbXBvcnQgKiBhcyB0c2xpYl8xIGZyb20gJ3RzbGliJztcbiAgICogYGBgXG4gICAqIEBwYXJhbSBpZCB0aGUgVHlwZVNjcmlwdCBpZGVudGlmaWVyIHRvIGZpbmQgdGhlIGltcG9ydCBpbmZvIGZvci5cbiAgICogQHJldHVybnMgVGhlIGltcG9ydCBpbmZvIGlmIHRoaXMgaXMgYSBuYW1lc3BhY2VkIGltcG9ydCBvciBgbnVsbGAuXG4gICAqL1xuICBwcm90ZWN0ZWQgZ2V0SW1wb3J0T2ZOYW1lc3BhY2VkSWRlbnRpZmllcihpZDogdHMuSWRlbnRpZmllcik6IEltcG9ydHxudWxsIHtcbiAgICBpZiAoISh0cy5pc1Byb3BlcnR5QWNjZXNzRXhwcmVzc2lvbihpZC5wYXJlbnQpICYmIGlkLnBhcmVudC5uYW1lID09PSBpZCkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IG5hbWVzcGFjZUlkZW50aWZpZXIgPSBnZXRGYXJMZWZ0SWRlbnRpZmllcihpZC5wYXJlbnQpO1xuICAgIGNvbnN0IG5hbWVzcGFjZVN5bWJvbCA9XG4gICAgICAgIG5hbWVzcGFjZUlkZW50aWZpZXIgJiYgdGhpcy5jaGVja2VyLmdldFN5bWJvbEF0TG9jYXRpb24obmFtZXNwYWNlSWRlbnRpZmllcik7XG4gICAgY29uc3QgZGVjbGFyYXRpb24gPSBuYW1lc3BhY2VTeW1ib2wgJiYgbmFtZXNwYWNlU3ltYm9sLmRlY2xhcmF0aW9ucy5sZW5ndGggPT09IDEgP1xuICAgICAgICBuYW1lc3BhY2VTeW1ib2wuZGVjbGFyYXRpb25zWzBdIDpcbiAgICAgICAgbnVsbDtcbiAgICBjb25zdCBuYW1lc3BhY2VEZWNsYXJhdGlvbiA9XG4gICAgICAgIGRlY2xhcmF0aW9uICYmIHRzLmlzTmFtZXNwYWNlSW1wb3J0KGRlY2xhcmF0aW9uKSA/IGRlY2xhcmF0aW9uIDogbnVsbDtcbiAgICBpZiAoIW5hbWVzcGFjZURlY2xhcmF0aW9uKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCBpbXBvcnREZWNsYXJhdGlvbiA9IG5hbWVzcGFjZURlY2xhcmF0aW9uLnBhcmVudC5wYXJlbnQ7XG4gICAgaWYgKCF0cy5pc1N0cmluZ0xpdGVyYWwoaW1wb3J0RGVjbGFyYXRpb24ubW9kdWxlU3BlY2lmaWVyKSkge1xuICAgICAgLy8gU2hvdWxkIG5vdCBoYXBwZW4gYXMgdGhpcyB3b3VsZCBiZSBpbnZhbGlkIFR5cGVzU2NyaXB0XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgZnJvbTogaW1wb3J0RGVjbGFyYXRpb24ubW9kdWxlU3BlY2lmaWVyLnRleHQsXG4gICAgICBuYW1lOiBpZC50ZXh0LFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogVGVzdCB3aGV0aGVyIGEgZGVjb3JhdG9yIHdhcyBpbXBvcnRlZCBmcm9tIGBAYW5ndWxhci9jb3JlYC5cbiAgICpcbiAgICogSXMgdGhlIGRlY29yYXRvcjpcbiAgICogKiBleHRlcm5hbGx5IGltcG9ydGVkIGZyb20gYEBhbmd1bGFyZS9jb3JlYD9cbiAgICogKiB0aGUgY3VycmVudCBob3N0ZWQgcHJvZ3JhbSBpcyBhY3R1YWxseSBgQGFuZ3VsYXIvY29yZWAgYW5kXG4gICAqICAgLSByZWxhdGl2ZWx5IGludGVybmFsbHkgaW1wb3J0ZWQ7IG9yXG4gICAqICAgLSBub3QgaW1wb3J0ZWQsIGZyb20gdGhlIGN1cnJlbnQgZmlsZS5cbiAgICpcbiAgICogQHBhcmFtIGRlY29yYXRvciB0aGUgZGVjb3JhdG9yIHRvIHRlc3QuXG4gICAqL1xuICBpc0Zyb21Db3JlKGRlY29yYXRvcjogRGVjb3JhdG9yKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMuaXNDb3JlKSB7XG4gICAgICByZXR1cm4gIWRlY29yYXRvci5pbXBvcnQgfHwgL15cXC4vLnRlc3QoZGVjb3JhdG9yLmltcG9ydC5mcm9tKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuICEhZGVjb3JhdG9yLmltcG9ydCAmJiBkZWNvcmF0b3IuaW1wb3J0LmZyb20gPT09ICdAYW5ndWxhci9jb3JlJztcbiAgICB9XG4gIH1cbn1cblxuLy8vLy8vLy8vLy8vLyBFeHBvcnRlZCBIZWxwZXJzIC8vLy8vLy8vLy8vLy9cblxuZXhwb3J0IHR5cGUgUGFyYW1JbmZvID0ge1xuICBkZWNvcmF0b3JzOiBEZWNvcmF0b3JbXSB8IG51bGwsXG4gIHR5cGU6IHRzLkV4cHJlc3Npb24gfCBudWxsXG59O1xuXG4vKipcbiAqIEEgc3RhdGVtZW50IG5vZGUgdGhhdCByZXByZXNlbnRzIGFuIGFzc2lnbm1lbnQuXG4gKi9cbmV4cG9ydCB0eXBlIEFzc2lnbm1lbnRTdGF0ZW1lbnQgPVxuICAgIHRzLkV4cHJlc3Npb25TdGF0ZW1lbnQgJiB7ZXhwcmVzc2lvbjoge2xlZnQ6IHRzLklkZW50aWZpZXIsIHJpZ2h0OiB0cy5FeHByZXNzaW9ufX07XG5cbi8qKlxuICogVGVzdCB3aGV0aGVyIGEgc3RhdGVtZW50IG5vZGUgaXMgYW4gYXNzaWdubWVudCBzdGF0ZW1lbnQuXG4gKiBAcGFyYW0gc3RhdGVtZW50IHRoZSBzdGF0ZW1lbnQgdG8gdGVzdC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzQXNzaWdubWVudFN0YXRlbWVudChzdGF0ZW1lbnQ6IHRzLlN0YXRlbWVudCk6IHN0YXRlbWVudCBpcyBBc3NpZ25tZW50U3RhdGVtZW50IHtcbiAgcmV0dXJuIHRzLmlzRXhwcmVzc2lvblN0YXRlbWVudChzdGF0ZW1lbnQpICYmIGlzQXNzaWdubWVudChzdGF0ZW1lbnQuZXhwcmVzc2lvbikgJiZcbiAgICAgIHRzLmlzSWRlbnRpZmllcihzdGF0ZW1lbnQuZXhwcmVzc2lvbi5sZWZ0KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQXNzaWdubWVudChleHByZXNzaW9uOiB0cy5FeHByZXNzaW9uKTpcbiAgICBleHByZXNzaW9uIGlzIHRzLkFzc2lnbm1lbnRFeHByZXNzaW9uPHRzLkVxdWFsc1Rva2VuPiB7XG4gIHJldHVybiB0cy5pc0JpbmFyeUV4cHJlc3Npb24oZXhwcmVzc2lvbikgJiZcbiAgICAgIGV4cHJlc3Npb24ub3BlcmF0b3JUb2tlbi5raW5kID09PSB0cy5TeW50YXhLaW5kLkVxdWFsc1Rva2VuO1xufVxuXG4vKipcbiAqIFRoZSB0eXBlIG9mIGEgZnVuY3Rpb24gdGhhdCBjYW4gYmUgdXNlZCB0byBmaWx0ZXIgb3V0IGhlbHBlcnMgYmFzZWQgb24gdGhlaXIgdGFyZ2V0LlxuICogVGhpcyBpcyB1c2VkIGluIGByZWZsZWN0RGVjb3JhdG9yc0Zyb21IZWxwZXJDYWxsKClgLlxuICovXG5leHBvcnQgdHlwZSBUYXJnZXRGaWx0ZXIgPSAodGFyZ2V0OiB0cy5FeHByZXNzaW9uKSA9PiBib29sZWFuO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0IHRlc3RzIHdoZXRoZXIgdGhlIGdpdmVuIGV4cHJlc3Npb24gaXMgYSBjbGFzcyB0YXJnZXQuXG4gKiBAcGFyYW0gY2xhc3NOYW1lIHRoZSBuYW1lIG9mIHRoZSBjbGFzcyB3ZSB3YW50IHRvIHRhcmdldC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1ha2VDbGFzc1RhcmdldEZpbHRlcihjbGFzc05hbWU6IHN0cmluZyk6IFRhcmdldEZpbHRlciB7XG4gIHJldHVybiAodGFyZ2V0OiB0cy5FeHByZXNzaW9uKTogYm9vbGVhbiA9PiB0cy5pc0lkZW50aWZpZXIodGFyZ2V0KSAmJiB0YXJnZXQudGV4dCA9PT0gY2xhc3NOYW1lO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0IHRlc3RzIHdoZXRoZXIgdGhlIGdpdmVuIGV4cHJlc3Npb24gaXMgYSBjbGFzcyBtZW1iZXIgdGFyZ2V0LlxuICogQHBhcmFtIGNsYXNzTmFtZSB0aGUgbmFtZSBvZiB0aGUgY2xhc3Mgd2Ugd2FudCB0byB0YXJnZXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYWtlTWVtYmVyVGFyZ2V0RmlsdGVyKGNsYXNzTmFtZTogc3RyaW5nKTogVGFyZ2V0RmlsdGVyIHtcbiAgcmV0dXJuICh0YXJnZXQ6IHRzLkV4cHJlc3Npb24pOiBib29sZWFuID0+IHRzLmlzUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uKHRhcmdldCkgJiZcbiAgICAgIHRzLmlzSWRlbnRpZmllcih0YXJnZXQuZXhwcmVzc2lvbikgJiYgdGFyZ2V0LmV4cHJlc3Npb24udGV4dCA9PT0gY2xhc3NOYW1lICYmXG4gICAgICB0YXJnZXQubmFtZS50ZXh0ID09PSAncHJvdG90eXBlJztcbn1cblxuLyoqXG4gKiBIZWxwZXIgbWV0aG9kIHRvIGV4dHJhY3QgdGhlIHZhbHVlIG9mIGEgcHJvcGVydHkgZ2l2ZW4gdGhlIHByb3BlcnR5J3MgXCJzeW1ib2xcIixcbiAqIHdoaWNoIGlzIGFjdHVhbGx5IHRoZSBzeW1ib2wgb2YgdGhlIGlkZW50aWZpZXIgb2YgdGhlIHByb3BlcnR5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJvcGVydHlWYWx1ZUZyb21TeW1ib2wocHJvcFN5bWJvbDogdHMuU3ltYm9sKTogdHMuRXhwcmVzc2lvbnx1bmRlZmluZWQge1xuICBjb25zdCBwcm9wSWRlbnRpZmllciA9IHByb3BTeW1ib2wudmFsdWVEZWNsYXJhdGlvbjtcbiAgY29uc3QgcGFyZW50ID0gcHJvcElkZW50aWZpZXIgJiYgcHJvcElkZW50aWZpZXIucGFyZW50O1xuICByZXR1cm4gcGFyZW50ICYmIHRzLmlzQmluYXJ5RXhwcmVzc2lvbihwYXJlbnQpID8gcGFyZW50LnJpZ2h0IDogdW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIEEgY2FsbGVlIGNvdWxkIGJlIG9uZSBvZjogYF9fZGVjb3JhdGUoLi4uKWAgb3IgYHRzbGliXzEuX19kZWNvcmF0ZWAuXG4gKi9cbmZ1bmN0aW9uIGdldENhbGxlZU5hbWUoY2FsbDogdHMuQ2FsbEV4cHJlc3Npb24pOiBzdHJpbmd8bnVsbCB7XG4gIGlmICh0cy5pc0lkZW50aWZpZXIoY2FsbC5leHByZXNzaW9uKSkge1xuICAgIHJldHVybiBjYWxsLmV4cHJlc3Npb24udGV4dDtcbiAgfVxuICBpZiAodHMuaXNQcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24oY2FsbC5leHByZXNzaW9uKSkge1xuICAgIHJldHVybiBjYWxsLmV4cHJlc3Npb24ubmFtZS50ZXh0O1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vLy8vLy8vLy8vLy8vIEludGVybmFsIEhlbHBlcnMgLy8vLy8vLy8vLy8vL1xuXG5mdW5jdGlvbiBnZXREZWNvcmF0b3JBcmdzKG5vZGU6IHRzLk9iamVjdExpdGVyYWxFeHByZXNzaW9uKTogdHMuRXhwcmVzc2lvbltdIHtcbiAgLy8gVGhlIGFyZ3VtZW50cyBvZiBhIGRlY29yYXRvciBhcmUgaGVsZCBpbiB0aGUgYGFyZ3NgIHByb3BlcnR5IG9mIGl0cyBkZWNsYXJhdGlvbiBvYmplY3QuXG4gIGNvbnN0IGFyZ3NQcm9wZXJ0eSA9IG5vZGUucHJvcGVydGllcy5maWx0ZXIodHMuaXNQcm9wZXJ0eUFzc2lnbm1lbnQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAuZmluZChwcm9wZXJ0eSA9PiBnZXROYW1lVGV4dChwcm9wZXJ0eS5uYW1lKSA9PT0gJ2FyZ3MnKTtcbiAgY29uc3QgYXJnc0V4cHJlc3Npb24gPSBhcmdzUHJvcGVydHkgJiYgYXJnc1Byb3BlcnR5LmluaXRpYWxpemVyO1xuICByZXR1cm4gYXJnc0V4cHJlc3Npb24gJiYgdHMuaXNBcnJheUxpdGVyYWxFeHByZXNzaW9uKGFyZ3NFeHByZXNzaW9uKSA/XG4gICAgICBBcnJheS5mcm9tKGFyZ3NFeHByZXNzaW9uLmVsZW1lbnRzKSA6XG4gICAgICBbXTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlRnJvbU1hcDxUPihtYXA6IE1hcDxzdHJpbmcsIFQ+LCBrZXk6IHRzLl9fU3RyaW5nKTogVHx1bmRlZmluZWQge1xuICBjb25zdCBtYXBLZXkgPSBrZXkgYXMgc3RyaW5nO1xuICBjb25zdCB2YWx1ZSA9IG1hcC5nZXQobWFwS2V5KTtcbiAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICBtYXAuZGVsZXRlKG1hcEtleSk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5mdW5jdGlvbiBpc1Byb3BlcnR5QWNjZXNzKG5vZGU6IHRzLk5vZGUpOiBub2RlIGlzIHRzLlByb3BlcnR5QWNjZXNzRXhwcmVzc2lvbiZcbiAgICB7cGFyZW50OiB0cy5CaW5hcnlFeHByZXNzaW9ufSB7XG4gIHJldHVybiAhIW5vZGUucGFyZW50ICYmIHRzLmlzQmluYXJ5RXhwcmVzc2lvbihub2RlLnBhcmVudCkgJiYgdHMuaXNQcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24obm9kZSk7XG59XG5cbmZ1bmN0aW9uIGlzVGhpc0Fzc2lnbm1lbnQobm9kZTogdHMuRGVjbGFyYXRpb24pOiBub2RlIGlzIHRzLkJpbmFyeUV4cHJlc3Npb24mXG4gICAge2xlZnQ6IHRzLlByb3BlcnR5QWNjZXNzRXhwcmVzc2lvbn0ge1xuICByZXR1cm4gdHMuaXNCaW5hcnlFeHByZXNzaW9uKG5vZGUpICYmIHRzLmlzUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uKG5vZGUubGVmdCkgJiZcbiAgICAgIG5vZGUubGVmdC5leHByZXNzaW9uLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuVGhpc0tleXdvcmQ7XG59XG5cbmZ1bmN0aW9uIGlzTmFtZWREZWNsYXJhdGlvbihub2RlOiB0cy5EZWNsYXJhdGlvbik6IG5vZGUgaXMgdHMuTmFtZWREZWNsYXJhdGlvbiB7XG4gIHJldHVybiAhIShub2RlIGFzIGFueSkubmFtZTtcbn1cblxuXG5mdW5jdGlvbiBpc0NsYXNzTWVtYmVyVHlwZShub2RlOiB0cy5EZWNsYXJhdGlvbik6IG5vZGUgaXMgdHMuQ2xhc3NFbGVtZW50fFxuICAgIHRzLlByb3BlcnR5QWNjZXNzRXhwcmVzc2lvbnx0cy5CaW5hcnlFeHByZXNzaW9uIHtcbiAgcmV0dXJuIHRzLmlzQ2xhc3NFbGVtZW50KG5vZGUpIHx8IGlzUHJvcGVydHlBY2Nlc3Mobm9kZSkgfHwgdHMuaXNCaW5hcnlFeHByZXNzaW9uKG5vZGUpO1xufVxuXG4vKipcbiAqIENvbXB1dGUgdGhlIGxlZnQgbW9zdCBpZGVudGlmaWVyIGluIGEgcHJvcGVydHkgYWNjZXNzIGNoYWluLiBFLmcuIHRoZSBgYWAgb2YgYGEuYi5jLmRgLlxuICogQHBhcmFtIHByb3BlcnR5QWNjZXNzIFRoZSBzdGFydGluZyBwcm9wZXJ0eSBhY2Nlc3MgZXhwcmVzc2lvbiBmcm9tIHdoaWNoIHdlIHdhbnQgdG8gY29tcHV0ZVxuICogdGhlIGxlZnQgbW9zdCBpZGVudGlmaWVyLlxuICogQHJldHVybnMgdGhlIGxlZnQgbW9zdCBpZGVudGlmaWVyIGluIHRoZSBjaGFpbiBvciBgbnVsbGAgaWYgaXQgaXMgbm90IGFuIGlkZW50aWZpZXIuXG4gKi9cbmZ1bmN0aW9uIGdldEZhckxlZnRJZGVudGlmaWVyKHByb3BlcnR5QWNjZXNzOiB0cy5Qcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24pOiB0cy5JZGVudGlmaWVyfG51bGwge1xuICB3aGlsZSAodHMuaXNQcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24ocHJvcGVydHlBY2Nlc3MuZXhwcmVzc2lvbikpIHtcbiAgICBwcm9wZXJ0eUFjY2VzcyA9IHByb3BlcnR5QWNjZXNzLmV4cHJlc3Npb247XG4gIH1cbiAgcmV0dXJuIHRzLmlzSWRlbnRpZmllcihwcm9wZXJ0eUFjY2Vzcy5leHByZXNzaW9uKSA/IHByb3BlcnR5QWNjZXNzLmV4cHJlc3Npb24gOiBudWxsO1xufVxuIl19
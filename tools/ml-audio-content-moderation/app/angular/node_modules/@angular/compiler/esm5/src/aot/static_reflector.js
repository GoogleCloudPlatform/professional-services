/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { CompileSummaryKind } from '../compile_metadata';
import { createAttribute, createComponent, createContentChild, createContentChildren, createDirective, createHost, createHostBinding, createHostListener, createInject, createInjectable, createInput, createNgModule, createOptional, createOutput, createPipe, createSelf, createSkipSelf, createViewChild, createViewChildren } from '../core';
import { syntaxError } from '../util';
import { formattedError } from './formatted_error';
import { StaticSymbol } from './static_symbol';
var ANGULAR_CORE = '@angular/core';
var ANGULAR_ROUTER = '@angular/router';
var HIDDEN_KEY = /^\$.*\$$/;
var IGNORE = {
    __symbolic: 'ignore'
};
var USE_VALUE = 'useValue';
var PROVIDE = 'provide';
var REFERENCE_SET = new Set([USE_VALUE, 'useFactory', 'data', 'id', 'loadChildren']);
var TYPEGUARD_POSTFIX = 'TypeGuard';
var USE_IF = 'UseIf';
function shouldIgnore(value) {
    return value && value.__symbolic == 'ignore';
}
/**
 * A static reflector implements enough of the Reflector API that is necessary to compile
 * templates statically.
 */
var StaticReflector = /** @class */ (function () {
    function StaticReflector(summaryResolver, symbolResolver, knownMetadataClasses, knownMetadataFunctions, errorRecorder) {
        if (knownMetadataClasses === void 0) { knownMetadataClasses = []; }
        if (knownMetadataFunctions === void 0) { knownMetadataFunctions = []; }
        var _this = this;
        this.summaryResolver = summaryResolver;
        this.symbolResolver = symbolResolver;
        this.errorRecorder = errorRecorder;
        this.annotationCache = new Map();
        this.shallowAnnotationCache = new Map();
        this.propertyCache = new Map();
        this.parameterCache = new Map();
        this.methodCache = new Map();
        this.staticCache = new Map();
        this.conversionMap = new Map();
        this.resolvedExternalReferences = new Map();
        this.annotationForParentClassWithSummaryKind = new Map();
        this.initializeConversionMap();
        knownMetadataClasses.forEach(function (kc) { return _this._registerDecoratorOrConstructor(_this.getStaticSymbol(kc.filePath, kc.name), kc.ctor); });
        knownMetadataFunctions.forEach(function (kf) { return _this._registerFunction(_this.getStaticSymbol(kf.filePath, kf.name), kf.fn); });
        this.annotationForParentClassWithSummaryKind.set(CompileSummaryKind.Directive, [createDirective, createComponent]);
        this.annotationForParentClassWithSummaryKind.set(CompileSummaryKind.Pipe, [createPipe]);
        this.annotationForParentClassWithSummaryKind.set(CompileSummaryKind.NgModule, [createNgModule]);
        this.annotationForParentClassWithSummaryKind.set(CompileSummaryKind.Injectable, [createInjectable, createPipe, createDirective, createComponent, createNgModule]);
    }
    StaticReflector.prototype.componentModuleUrl = function (typeOrFunc) {
        var staticSymbol = this.findSymbolDeclaration(typeOrFunc);
        return this.symbolResolver.getResourcePath(staticSymbol);
    };
    StaticReflector.prototype.resolveExternalReference = function (ref, containingFile) {
        var key = undefined;
        if (!containingFile) {
            key = ref.moduleName + ":" + ref.name;
            var declarationSymbol_1 = this.resolvedExternalReferences.get(key);
            if (declarationSymbol_1)
                return declarationSymbol_1;
        }
        var refSymbol = this.symbolResolver.getSymbolByModule(ref.moduleName, ref.name, containingFile);
        var declarationSymbol = this.findSymbolDeclaration(refSymbol);
        if (!containingFile) {
            this.symbolResolver.recordModuleNameForFileName(refSymbol.filePath, ref.moduleName);
            this.symbolResolver.recordImportAs(declarationSymbol, refSymbol);
        }
        if (key) {
            this.resolvedExternalReferences.set(key, declarationSymbol);
        }
        return declarationSymbol;
    };
    StaticReflector.prototype.findDeclaration = function (moduleUrl, name, containingFile) {
        return this.findSymbolDeclaration(this.symbolResolver.getSymbolByModule(moduleUrl, name, containingFile));
    };
    StaticReflector.prototype.tryFindDeclaration = function (moduleUrl, name, containingFile) {
        var _this = this;
        return this.symbolResolver.ignoreErrorsFor(function () { return _this.findDeclaration(moduleUrl, name, containingFile); });
    };
    StaticReflector.prototype.findSymbolDeclaration = function (symbol) {
        var resolvedSymbol = this.symbolResolver.resolveSymbol(symbol);
        if (resolvedSymbol) {
            var resolvedMetadata = resolvedSymbol.metadata;
            if (resolvedMetadata && resolvedMetadata.__symbolic === 'resolved') {
                resolvedMetadata = resolvedMetadata.symbol;
            }
            if (resolvedMetadata instanceof StaticSymbol) {
                return this.findSymbolDeclaration(resolvedSymbol.metadata);
            }
        }
        return symbol;
    };
    StaticReflector.prototype.tryAnnotations = function (type) {
        var originalRecorder = this.errorRecorder;
        this.errorRecorder = function (error, fileName) { };
        try {
            return this.annotations(type);
        }
        finally {
            this.errorRecorder = originalRecorder;
        }
    };
    StaticReflector.prototype.annotations = function (type) {
        var _this = this;
        return this._annotations(type, function (type, decorators) { return _this.simplify(type, decorators); }, this.annotationCache);
    };
    StaticReflector.prototype.shallowAnnotations = function (type) {
        var _this = this;
        return this._annotations(type, function (type, decorators) { return _this.simplify(type, decorators, true); }, this.shallowAnnotationCache);
    };
    StaticReflector.prototype._annotations = function (type, simplify, annotationCache) {
        var annotations = annotationCache.get(type);
        if (!annotations) {
            annotations = [];
            var classMetadata = this.getTypeMetadata(type);
            var parentType = this.findParentType(type, classMetadata);
            if (parentType) {
                var parentAnnotations = this.annotations(parentType);
                annotations.push.apply(annotations, tslib_1.__spread(parentAnnotations));
            }
            var ownAnnotations_1 = [];
            if (classMetadata['decorators']) {
                ownAnnotations_1 = simplify(type, classMetadata['decorators']);
                if (ownAnnotations_1) {
                    annotations.push.apply(annotations, tslib_1.__spread(ownAnnotations_1));
                }
            }
            if (parentType && !this.summaryResolver.isLibraryFile(type.filePath) &&
                this.summaryResolver.isLibraryFile(parentType.filePath)) {
                var summary = this.summaryResolver.resolveSummary(parentType);
                if (summary && summary.type) {
                    var requiredAnnotationTypes = this.annotationForParentClassWithSummaryKind.get(summary.type.summaryKind);
                    var typeHasRequiredAnnotation = requiredAnnotationTypes.some(function (requiredType) { return ownAnnotations_1.some(function (ann) { return requiredType.isTypeOf(ann); }); });
                    if (!typeHasRequiredAnnotation) {
                        this.reportError(formatMetadataError(metadataError("Class " + type.name + " in " + type.filePath + " extends from a " + CompileSummaryKind[summary.type.summaryKind] + " in another compilation unit without duplicating the decorator", 
                        /* summary */ undefined, "Please add a " + requiredAnnotationTypes.map(function (type) { return type.ngMetadataName; }).join(' or ') + " decorator to the class"), type), type);
                    }
                }
            }
            annotationCache.set(type, annotations.filter(function (ann) { return !!ann; }));
        }
        return annotations;
    };
    StaticReflector.prototype.propMetadata = function (type) {
        var _this = this;
        var propMetadata = this.propertyCache.get(type);
        if (!propMetadata) {
            var classMetadata = this.getTypeMetadata(type);
            propMetadata = {};
            var parentType = this.findParentType(type, classMetadata);
            if (parentType) {
                var parentPropMetadata_1 = this.propMetadata(parentType);
                Object.keys(parentPropMetadata_1).forEach(function (parentProp) {
                    propMetadata[parentProp] = parentPropMetadata_1[parentProp];
                });
            }
            var members_1 = classMetadata['members'] || {};
            Object.keys(members_1).forEach(function (propName) {
                var propData = members_1[propName];
                var prop = propData
                    .find(function (a) { return a['__symbolic'] == 'property' || a['__symbolic'] == 'method'; });
                var decorators = [];
                if (propMetadata[propName]) {
                    decorators.push.apply(decorators, tslib_1.__spread(propMetadata[propName]));
                }
                propMetadata[propName] = decorators;
                if (prop && prop['decorators']) {
                    decorators.push.apply(decorators, tslib_1.__spread(_this.simplify(type, prop['decorators'])));
                }
            });
            this.propertyCache.set(type, propMetadata);
        }
        return propMetadata;
    };
    StaticReflector.prototype.parameters = function (type) {
        var _this = this;
        if (!(type instanceof StaticSymbol)) {
            this.reportError(new Error("parameters received " + JSON.stringify(type) + " which is not a StaticSymbol"), type);
            return [];
        }
        try {
            var parameters_1 = this.parameterCache.get(type);
            if (!parameters_1) {
                var classMetadata = this.getTypeMetadata(type);
                var parentType = this.findParentType(type, classMetadata);
                var members = classMetadata ? classMetadata['members'] : null;
                var ctorData = members ? members['__ctor__'] : null;
                if (ctorData) {
                    var ctor = ctorData.find(function (a) { return a['__symbolic'] == 'constructor'; });
                    var rawParameterTypes = ctor['parameters'] || [];
                    var parameterDecorators_1 = this.simplify(type, ctor['parameterDecorators'] || []);
                    parameters_1 = [];
                    rawParameterTypes.forEach(function (rawParamType, index) {
                        var nestedResult = [];
                        var paramType = _this.trySimplify(type, rawParamType);
                        if (paramType)
                            nestedResult.push(paramType);
                        var decorators = parameterDecorators_1 ? parameterDecorators_1[index] : null;
                        if (decorators) {
                            nestedResult.push.apply(nestedResult, tslib_1.__spread(decorators));
                        }
                        parameters_1.push(nestedResult);
                    });
                }
                else if (parentType) {
                    parameters_1 = this.parameters(parentType);
                }
                if (!parameters_1) {
                    parameters_1 = [];
                }
                this.parameterCache.set(type, parameters_1);
            }
            return parameters_1;
        }
        catch (e) {
            console.error("Failed on type " + JSON.stringify(type) + " with error " + e);
            throw e;
        }
    };
    StaticReflector.prototype._methodNames = function (type) {
        var methodNames = this.methodCache.get(type);
        if (!methodNames) {
            var classMetadata = this.getTypeMetadata(type);
            methodNames = {};
            var parentType = this.findParentType(type, classMetadata);
            if (parentType) {
                var parentMethodNames_1 = this._methodNames(parentType);
                Object.keys(parentMethodNames_1).forEach(function (parentProp) {
                    methodNames[parentProp] = parentMethodNames_1[parentProp];
                });
            }
            var members_2 = classMetadata['members'] || {};
            Object.keys(members_2).forEach(function (propName) {
                var propData = members_2[propName];
                var isMethod = propData.some(function (a) { return a['__symbolic'] == 'method'; });
                methodNames[propName] = methodNames[propName] || isMethod;
            });
            this.methodCache.set(type, methodNames);
        }
        return methodNames;
    };
    StaticReflector.prototype._staticMembers = function (type) {
        var staticMembers = this.staticCache.get(type);
        if (!staticMembers) {
            var classMetadata = this.getTypeMetadata(type);
            var staticMemberData = classMetadata['statics'] || {};
            staticMembers = Object.keys(staticMemberData);
            this.staticCache.set(type, staticMembers);
        }
        return staticMembers;
    };
    StaticReflector.prototype.findParentType = function (type, classMetadata) {
        var parentType = this.trySimplify(type, classMetadata['extends']);
        if (parentType instanceof StaticSymbol) {
            return parentType;
        }
    };
    StaticReflector.prototype.hasLifecycleHook = function (type, lcProperty) {
        if (!(type instanceof StaticSymbol)) {
            this.reportError(new Error("hasLifecycleHook received " + JSON.stringify(type) + " which is not a StaticSymbol"), type);
        }
        try {
            return !!this._methodNames(type)[lcProperty];
        }
        catch (e) {
            console.error("Failed on type " + JSON.stringify(type) + " with error " + e);
            throw e;
        }
    };
    StaticReflector.prototype.guards = function (type) {
        var e_1, _a;
        if (!(type instanceof StaticSymbol)) {
            this.reportError(new Error("guards received " + JSON.stringify(type) + " which is not a StaticSymbol"), type);
            return {};
        }
        var staticMembers = this._staticMembers(type);
        var result = {};
        try {
            for (var staticMembers_1 = tslib_1.__values(staticMembers), staticMembers_1_1 = staticMembers_1.next(); !staticMembers_1_1.done; staticMembers_1_1 = staticMembers_1.next()) {
                var name_1 = staticMembers_1_1.value;
                if (name_1.endsWith(TYPEGUARD_POSTFIX)) {
                    var property = name_1.substr(0, name_1.length - TYPEGUARD_POSTFIX.length);
                    var value = void 0;
                    if (property.endsWith(USE_IF)) {
                        property = name_1.substr(0, property.length - USE_IF.length);
                        value = USE_IF;
                    }
                    else {
                        value = this.getStaticSymbol(type.filePath, type.name, [name_1]);
                    }
                    result[property] = value;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (staticMembers_1_1 && !staticMembers_1_1.done && (_a = staticMembers_1.return)) _a.call(staticMembers_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return result;
    };
    StaticReflector.prototype._registerDecoratorOrConstructor = function (type, ctor) {
        this.conversionMap.set(type, function (context, args) { return new (ctor.bind.apply(ctor, tslib_1.__spread([void 0], args)))(); });
    };
    StaticReflector.prototype._registerFunction = function (type, fn) {
        this.conversionMap.set(type, function (context, args) { return fn.apply(undefined, args); });
    };
    StaticReflector.prototype.initializeConversionMap = function () {
        this._registerDecoratorOrConstructor(this.findDeclaration(ANGULAR_CORE, 'Injectable'), createInjectable);
        this.injectionToken = this.findDeclaration(ANGULAR_CORE, 'InjectionToken');
        this.opaqueToken = this.findDeclaration(ANGULAR_CORE, 'OpaqueToken');
        this.ROUTES = this.tryFindDeclaration(ANGULAR_ROUTER, 'ROUTES');
        this.ANALYZE_FOR_ENTRY_COMPONENTS =
            this.findDeclaration(ANGULAR_CORE, 'ANALYZE_FOR_ENTRY_COMPONENTS');
        this._registerDecoratorOrConstructor(this.findDeclaration(ANGULAR_CORE, 'Host'), createHost);
        this._registerDecoratorOrConstructor(this.findDeclaration(ANGULAR_CORE, 'Self'), createSelf);
        this._registerDecoratorOrConstructor(this.findDeclaration(ANGULAR_CORE, 'SkipSelf'), createSkipSelf);
        this._registerDecoratorOrConstructor(this.findDeclaration(ANGULAR_CORE, 'Inject'), createInject);
        this._registerDecoratorOrConstructor(this.findDeclaration(ANGULAR_CORE, 'Optional'), createOptional);
        this._registerDecoratorOrConstructor(this.findDeclaration(ANGULAR_CORE, 'Attribute'), createAttribute);
        this._registerDecoratorOrConstructor(this.findDeclaration(ANGULAR_CORE, 'ContentChild'), createContentChild);
        this._registerDecoratorOrConstructor(this.findDeclaration(ANGULAR_CORE, 'ContentChildren'), createContentChildren);
        this._registerDecoratorOrConstructor(this.findDeclaration(ANGULAR_CORE, 'ViewChild'), createViewChild);
        this._registerDecoratorOrConstructor(this.findDeclaration(ANGULAR_CORE, 'ViewChildren'), createViewChildren);
        this._registerDecoratorOrConstructor(this.findDeclaration(ANGULAR_CORE, 'Input'), createInput);
        this._registerDecoratorOrConstructor(this.findDeclaration(ANGULAR_CORE, 'Output'), createOutput);
        this._registerDecoratorOrConstructor(this.findDeclaration(ANGULAR_CORE, 'Pipe'), createPipe);
        this._registerDecoratorOrConstructor(this.findDeclaration(ANGULAR_CORE, 'HostBinding'), createHostBinding);
        this._registerDecoratorOrConstructor(this.findDeclaration(ANGULAR_CORE, 'HostListener'), createHostListener);
        this._registerDecoratorOrConstructor(this.findDeclaration(ANGULAR_CORE, 'Directive'), createDirective);
        this._registerDecoratorOrConstructor(this.findDeclaration(ANGULAR_CORE, 'Component'), createComponent);
        this._registerDecoratorOrConstructor(this.findDeclaration(ANGULAR_CORE, 'NgModule'), createNgModule);
        // Note: Some metadata classes can be used directly with Provider.deps.
        this._registerDecoratorOrConstructor(this.findDeclaration(ANGULAR_CORE, 'Host'), createHost);
        this._registerDecoratorOrConstructor(this.findDeclaration(ANGULAR_CORE, 'Self'), createSelf);
        this._registerDecoratorOrConstructor(this.findDeclaration(ANGULAR_CORE, 'SkipSelf'), createSkipSelf);
        this._registerDecoratorOrConstructor(this.findDeclaration(ANGULAR_CORE, 'Optional'), createOptional);
    };
    /**
     * getStaticSymbol produces a Type whose metadata is known but whose implementation is not loaded.
     * All types passed to the StaticResolver should be pseudo-types returned by this method.
     *
     * @param declarationFile the absolute path of the file where the symbol is declared
     * @param name the name of the type.
     */
    StaticReflector.prototype.getStaticSymbol = function (declarationFile, name, members) {
        return this.symbolResolver.getStaticSymbol(declarationFile, name, members);
    };
    /**
     * Simplify but discard any errors
     */
    StaticReflector.prototype.trySimplify = function (context, value) {
        var originalRecorder = this.errorRecorder;
        this.errorRecorder = function (error, fileName) { };
        var result = this.simplify(context, value);
        this.errorRecorder = originalRecorder;
        return result;
    };
    /** @internal */
    StaticReflector.prototype.simplify = function (context, value, lazy) {
        if (lazy === void 0) { lazy = false; }
        var self = this;
        var scope = BindingScope.empty;
        var calling = new Map();
        var rootContext = context;
        function simplifyInContext(context, value, depth, references) {
            function resolveReferenceValue(staticSymbol) {
                var resolvedSymbol = self.symbolResolver.resolveSymbol(staticSymbol);
                return resolvedSymbol ? resolvedSymbol.metadata : null;
            }
            function simplifyEagerly(value) {
                return simplifyInContext(context, value, depth, 0);
            }
            function simplifyLazily(value) {
                return simplifyInContext(context, value, depth, references + 1);
            }
            function simplifyNested(nestedContext, value) {
                if (nestedContext === context) {
                    // If the context hasn't changed let the exception propagate unmodified.
                    return simplifyInContext(nestedContext, value, depth + 1, references);
                }
                try {
                    return simplifyInContext(nestedContext, value, depth + 1, references);
                }
                catch (e) {
                    if (isMetadataError(e)) {
                        // Propagate the message text up but add a message to the chain that explains how we got
                        // here.
                        // e.chain implies e.symbol
                        var summaryMsg = e.chain ? 'references \'' + e.symbol.name + '\'' : errorSummary(e);
                        var summary = "'" + nestedContext.name + "' " + summaryMsg;
                        var chain = { message: summary, position: e.position, next: e.chain };
                        // TODO(chuckj): retrieve the position information indirectly from the collectors node
                        // map if the metadata is from a .ts file.
                        self.error({
                            message: e.message,
                            advise: e.advise,
                            context: e.context, chain: chain,
                            symbol: nestedContext
                        }, context);
                    }
                    else {
                        // It is probably an internal error.
                        throw e;
                    }
                }
            }
            function simplifyCall(functionSymbol, targetFunction, args, targetExpression) {
                if (targetFunction && targetFunction['__symbolic'] == 'function') {
                    if (calling.get(functionSymbol)) {
                        self.error({
                            message: 'Recursion is not supported',
                            summary: "called '" + functionSymbol.name + "' recursively",
                            value: targetFunction
                        }, functionSymbol);
                    }
                    try {
                        var value_1 = targetFunction['value'];
                        if (value_1 && (depth != 0 || value_1.__symbolic != 'error')) {
                            var parameters = targetFunction['parameters'];
                            var defaults = targetFunction.defaults;
                            args = args.map(function (arg) { return simplifyNested(context, arg); })
                                .map(function (arg) { return shouldIgnore(arg) ? undefined : arg; });
                            if (defaults && defaults.length > args.length) {
                                args.push.apply(args, tslib_1.__spread(defaults.slice(args.length).map(function (value) { return simplify(value); })));
                            }
                            calling.set(functionSymbol, true);
                            var functionScope = BindingScope.build();
                            for (var i = 0; i < parameters.length; i++) {
                                functionScope.define(parameters[i], args[i]);
                            }
                            var oldScope = scope;
                            var result_1;
                            try {
                                scope = functionScope.done();
                                result_1 = simplifyNested(functionSymbol, value_1);
                            }
                            finally {
                                scope = oldScope;
                            }
                            return result_1;
                        }
                    }
                    finally {
                        calling.delete(functionSymbol);
                    }
                }
                if (depth === 0) {
                    // If depth is 0 we are evaluating the top level expression that is describing element
                    // decorator. In this case, it is a decorator we don't understand, such as a custom
                    // non-angular decorator, and we should just ignore it.
                    return IGNORE;
                }
                var position = undefined;
                if (targetExpression && targetExpression.__symbolic == 'resolved') {
                    var line = targetExpression.line;
                    var character = targetExpression.character;
                    var fileName = targetExpression.fileName;
                    if (fileName != null && line != null && character != null) {
                        position = { fileName: fileName, line: line, column: character };
                    }
                }
                self.error({
                    message: FUNCTION_CALL_NOT_SUPPORTED,
                    context: functionSymbol,
                    value: targetFunction, position: position
                }, context);
            }
            function simplify(expression) {
                var e_2, _a, e_3, _b;
                if (isPrimitive(expression)) {
                    return expression;
                }
                if (expression instanceof Array) {
                    var result_2 = [];
                    try {
                        for (var _c = tslib_1.__values(expression), _d = _c.next(); !_d.done; _d = _c.next()) {
                            var item = _d.value;
                            // Check for a spread expression
                            if (item && item.__symbolic === 'spread') {
                                // We call with references as 0 because we require the actual value and cannot
                                // tolerate a reference here.
                                var spreadArray = simplifyEagerly(item.expression);
                                if (Array.isArray(spreadArray)) {
                                    try {
                                        for (var spreadArray_1 = tslib_1.__values(spreadArray), spreadArray_1_1 = spreadArray_1.next(); !spreadArray_1_1.done; spreadArray_1_1 = spreadArray_1.next()) {
                                            var spreadItem = spreadArray_1_1.value;
                                            result_2.push(spreadItem);
                                        }
                                    }
                                    catch (e_3_1) { e_3 = { error: e_3_1 }; }
                                    finally {
                                        try {
                                            if (spreadArray_1_1 && !spreadArray_1_1.done && (_b = spreadArray_1.return)) _b.call(spreadArray_1);
                                        }
                                        finally { if (e_3) throw e_3.error; }
                                    }
                                    continue;
                                }
                            }
                            var value_2 = simplify(item);
                            if (shouldIgnore(value_2)) {
                                continue;
                            }
                            result_2.push(value_2);
                        }
                    }
                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                    finally {
                        try {
                            if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                        }
                        finally { if (e_2) throw e_2.error; }
                    }
                    return result_2;
                }
                if (expression instanceof StaticSymbol) {
                    // Stop simplification at builtin symbols or if we are in a reference context and
                    // the symbol doesn't have members.
                    if (expression === self.injectionToken || self.conversionMap.has(expression) ||
                        (references > 0 && !expression.members.length)) {
                        return expression;
                    }
                    else {
                        var staticSymbol = expression;
                        var declarationValue = resolveReferenceValue(staticSymbol);
                        if (declarationValue != null) {
                            return simplifyNested(staticSymbol, declarationValue);
                        }
                        else {
                            return staticSymbol;
                        }
                    }
                }
                if (expression) {
                    if (expression['__symbolic']) {
                        var staticSymbol = void 0;
                        switch (expression['__symbolic']) {
                            case 'binop':
                                var left = simplify(expression['left']);
                                if (shouldIgnore(left))
                                    return left;
                                var right = simplify(expression['right']);
                                if (shouldIgnore(right))
                                    return right;
                                switch (expression['operator']) {
                                    case '&&':
                                        return left && right;
                                    case '||':
                                        return left || right;
                                    case '|':
                                        return left | right;
                                    case '^':
                                        return left ^ right;
                                    case '&':
                                        return left & right;
                                    case '==':
                                        return left == right;
                                    case '!=':
                                        return left != right;
                                    case '===':
                                        return left === right;
                                    case '!==':
                                        return left !== right;
                                    case '<':
                                        return left < right;
                                    case '>':
                                        return left > right;
                                    case '<=':
                                        return left <= right;
                                    case '>=':
                                        return left >= right;
                                    case '<<':
                                        return left << right;
                                    case '>>':
                                        return left >> right;
                                    case '+':
                                        return left + right;
                                    case '-':
                                        return left - right;
                                    case '*':
                                        return left * right;
                                    case '/':
                                        return left / right;
                                    case '%':
                                        return left % right;
                                }
                                return null;
                            case 'if':
                                var condition = simplify(expression['condition']);
                                return condition ? simplify(expression['thenExpression']) :
                                    simplify(expression['elseExpression']);
                            case 'pre':
                                var operand = simplify(expression['operand']);
                                if (shouldIgnore(operand))
                                    return operand;
                                switch (expression['operator']) {
                                    case '+':
                                        return operand;
                                    case '-':
                                        return -operand;
                                    case '!':
                                        return !operand;
                                    case '~':
                                        return ~operand;
                                }
                                return null;
                            case 'index':
                                var indexTarget = simplifyEagerly(expression['expression']);
                                var index = simplifyEagerly(expression['index']);
                                if (indexTarget && isPrimitive(index))
                                    return indexTarget[index];
                                return null;
                            case 'select':
                                var member = expression['member'];
                                var selectContext = context;
                                var selectTarget = simplify(expression['expression']);
                                if (selectTarget instanceof StaticSymbol) {
                                    var members = selectTarget.members.concat(member);
                                    selectContext =
                                        self.getStaticSymbol(selectTarget.filePath, selectTarget.name, members);
                                    var declarationValue = resolveReferenceValue(selectContext);
                                    if (declarationValue != null) {
                                        return simplifyNested(selectContext, declarationValue);
                                    }
                                    else {
                                        return selectContext;
                                    }
                                }
                                if (selectTarget && isPrimitive(member))
                                    return simplifyNested(selectContext, selectTarget[member]);
                                return null;
                            case 'reference':
                                // Note: This only has to deal with variable references, as symbol references have
                                // been converted into 'resolved'
                                // in the StaticSymbolResolver.
                                var name_2 = expression['name'];
                                var localValue = scope.resolve(name_2);
                                if (localValue != BindingScope.missing) {
                                    return localValue;
                                }
                                break;
                            case 'resolved':
                                try {
                                    return simplify(expression.symbol);
                                }
                                catch (e) {
                                    // If an error is reported evaluating the symbol record the position of the
                                    // reference in the error so it can
                                    // be reported in the error message generated from the exception.
                                    if (isMetadataError(e) && expression.fileName != null &&
                                        expression.line != null && expression.character != null) {
                                        e.position = {
                                            fileName: expression.fileName,
                                            line: expression.line,
                                            column: expression.character
                                        };
                                    }
                                    throw e;
                                }
                            case 'class':
                                return context;
                            case 'function':
                                return context;
                            case 'new':
                            case 'call':
                                // Determine if the function is a built-in conversion
                                staticSymbol = simplifyInContext(context, expression['expression'], depth + 1, /* references */ 0);
                                if (staticSymbol instanceof StaticSymbol) {
                                    if (staticSymbol === self.injectionToken || staticSymbol === self.opaqueToken) {
                                        // if somebody calls new InjectionToken, don't create an InjectionToken,
                                        // but rather return the symbol to which the InjectionToken is assigned to.
                                        // OpaqueToken is supported too as it is required by the language service to
                                        // support v4 and prior versions of Angular.
                                        return context;
                                    }
                                    var argExpressions = expression['arguments'] || [];
                                    var converter = self.conversionMap.get(staticSymbol);
                                    if (converter) {
                                        var args = argExpressions.map(function (arg) { return simplifyNested(context, arg); })
                                            .map(function (arg) { return shouldIgnore(arg) ? undefined : arg; });
                                        return converter(context, args);
                                    }
                                    else {
                                        // Determine if the function is one we can simplify.
                                        var targetFunction = resolveReferenceValue(staticSymbol);
                                        return simplifyCall(staticSymbol, targetFunction, argExpressions, expression['expression']);
                                    }
                                }
                                return IGNORE;
                            case 'error':
                                var message = expression.message;
                                if (expression['line'] != null) {
                                    self.error({
                                        message: message,
                                        context: expression.context,
                                        value: expression,
                                        position: {
                                            fileName: expression['fileName'],
                                            line: expression['line'],
                                            column: expression['character']
                                        }
                                    }, context);
                                }
                                else {
                                    self.error({ message: message, context: expression.context }, context);
                                }
                                return IGNORE;
                            case 'ignore':
                                return expression;
                        }
                        return null;
                    }
                    return mapStringMap(expression, function (value, name) {
                        if (REFERENCE_SET.has(name)) {
                            if (name === USE_VALUE && PROVIDE in expression) {
                                // If this is a provider expression, check for special tokens that need the value
                                // during analysis.
                                var provide = simplify(expression.provide);
                                if (provide === self.ROUTES || provide == self.ANALYZE_FOR_ENTRY_COMPONENTS) {
                                    return simplify(value);
                                }
                            }
                            return simplifyLazily(value);
                        }
                        return simplify(value);
                    });
                }
                return IGNORE;
            }
            return simplify(value);
        }
        var result;
        try {
            result = simplifyInContext(context, value, 0, lazy ? 1 : 0);
        }
        catch (e) {
            if (this.errorRecorder) {
                this.reportError(e, context);
            }
            else {
                throw formatMetadataError(e, context);
            }
        }
        if (shouldIgnore(result)) {
            return undefined;
        }
        return result;
    };
    StaticReflector.prototype.getTypeMetadata = function (type) {
        var resolvedSymbol = this.symbolResolver.resolveSymbol(type);
        return resolvedSymbol && resolvedSymbol.metadata ? resolvedSymbol.metadata :
            { __symbolic: 'class' };
    };
    StaticReflector.prototype.reportError = function (error, context, path) {
        if (this.errorRecorder) {
            this.errorRecorder(formatMetadataError(error, context), (context && context.filePath) || path);
        }
        else {
            throw error;
        }
    };
    StaticReflector.prototype.error = function (_a, reportingContext) {
        var message = _a.message, summary = _a.summary, advise = _a.advise, position = _a.position, context = _a.context, value = _a.value, symbol = _a.symbol, chain = _a.chain;
        this.reportError(metadataError(message, summary, advise, position, symbol, context, chain), reportingContext);
    };
    return StaticReflector;
}());
export { StaticReflector };
var METADATA_ERROR = 'ngMetadataError';
function metadataError(message, summary, advise, position, symbol, context, chain) {
    var error = syntaxError(message);
    error[METADATA_ERROR] = true;
    if (advise)
        error.advise = advise;
    if (position)
        error.position = position;
    if (summary)
        error.summary = summary;
    if (context)
        error.context = context;
    if (chain)
        error.chain = chain;
    if (symbol)
        error.symbol = symbol;
    return error;
}
function isMetadataError(error) {
    return !!error[METADATA_ERROR];
}
var REFERENCE_TO_NONEXPORTED_CLASS = 'Reference to non-exported class';
var VARIABLE_NOT_INITIALIZED = 'Variable not initialized';
var DESTRUCTURE_NOT_SUPPORTED = 'Destructuring not supported';
var COULD_NOT_RESOLVE_TYPE = 'Could not resolve type';
var FUNCTION_CALL_NOT_SUPPORTED = 'Function call not supported';
var REFERENCE_TO_LOCAL_SYMBOL = 'Reference to a local symbol';
var LAMBDA_NOT_SUPPORTED = 'Lambda not supported';
function expandedMessage(message, context) {
    switch (message) {
        case REFERENCE_TO_NONEXPORTED_CLASS:
            if (context && context.className) {
                return "References to a non-exported class are not supported in decorators but " + context.className + " was referenced.";
            }
            break;
        case VARIABLE_NOT_INITIALIZED:
            return 'Only initialized variables and constants can be referenced in decorators because the value of this variable is needed by the template compiler';
        case DESTRUCTURE_NOT_SUPPORTED:
            return 'Referencing an exported destructured variable or constant is not supported in decorators and this value is needed by the template compiler';
        case COULD_NOT_RESOLVE_TYPE:
            if (context && context.typeName) {
                return "Could not resolve type " + context.typeName;
            }
            break;
        case FUNCTION_CALL_NOT_SUPPORTED:
            if (context && context.name) {
                return "Function calls are not supported in decorators but '" + context.name + "' was called";
            }
            return 'Function calls are not supported in decorators';
        case REFERENCE_TO_LOCAL_SYMBOL:
            if (context && context.name) {
                return "Reference to a local (non-exported) symbols are not supported in decorators but '" + context.name + "' was referenced";
            }
            break;
        case LAMBDA_NOT_SUPPORTED:
            return "Function expressions are not supported in decorators";
    }
    return message;
}
function messageAdvise(message, context) {
    switch (message) {
        case REFERENCE_TO_NONEXPORTED_CLASS:
            if (context && context.className) {
                return "Consider exporting '" + context.className + "'";
            }
            break;
        case DESTRUCTURE_NOT_SUPPORTED:
            return 'Consider simplifying to avoid destructuring';
        case REFERENCE_TO_LOCAL_SYMBOL:
            if (context && context.name) {
                return "Consider exporting '" + context.name + "'";
            }
            break;
        case LAMBDA_NOT_SUPPORTED:
            return "Consider changing the function expression into an exported function";
    }
    return undefined;
}
function errorSummary(error) {
    if (error.summary) {
        return error.summary;
    }
    switch (error.message) {
        case REFERENCE_TO_NONEXPORTED_CLASS:
            if (error.context && error.context.className) {
                return "references non-exported class " + error.context.className;
            }
            break;
        case VARIABLE_NOT_INITIALIZED:
            return 'is not initialized';
        case DESTRUCTURE_NOT_SUPPORTED:
            return 'is a destructured variable';
        case COULD_NOT_RESOLVE_TYPE:
            return 'could not be resolved';
        case FUNCTION_CALL_NOT_SUPPORTED:
            if (error.context && error.context.name) {
                return "calls '" + error.context.name + "'";
            }
            return "calls a function";
        case REFERENCE_TO_LOCAL_SYMBOL:
            if (error.context && error.context.name) {
                return "references local variable " + error.context.name;
            }
            return "references a local variable";
    }
    return 'contains the error';
}
function mapStringMap(input, transform) {
    if (!input)
        return {};
    var result = {};
    Object.keys(input).forEach(function (key) {
        var value = transform(input[key], key);
        if (!shouldIgnore(value)) {
            if (HIDDEN_KEY.test(key)) {
                Object.defineProperty(result, key, { enumerable: false, configurable: true, value: value });
            }
            else {
                result[key] = value;
            }
        }
    });
    return result;
}
function isPrimitive(o) {
    return o === null || (typeof o !== 'function' && typeof o !== 'object');
}
var BindingScope = /** @class */ (function () {
    function BindingScope() {
    }
    BindingScope.build = function () {
        var current = new Map();
        return {
            define: function (name, value) {
                current.set(name, value);
                return this;
            },
            done: function () {
                return current.size > 0 ? new PopulatedScope(current) : BindingScope.empty;
            }
        };
    };
    BindingScope.missing = {};
    BindingScope.empty = { resolve: function (name) { return BindingScope.missing; } };
    return BindingScope;
}());
var PopulatedScope = /** @class */ (function (_super) {
    tslib_1.__extends(PopulatedScope, _super);
    function PopulatedScope(bindings) {
        var _this = _super.call(this) || this;
        _this.bindings = bindings;
        return _this;
    }
    PopulatedScope.prototype.resolve = function (name) {
        return this.bindings.has(name) ? this.bindings.get(name) : BindingScope.missing;
    };
    return PopulatedScope;
}(BindingScope));
function formatMetadataMessageChain(chain, advise) {
    var expanded = expandedMessage(chain.message, chain.context);
    var nesting = chain.symbol ? " in '" + chain.symbol.name + "'" : '';
    var message = "" + expanded + nesting;
    var position = chain.position;
    var next = chain.next ?
        formatMetadataMessageChain(chain.next, advise) :
        advise ? { message: advise } : undefined;
    return { message: message, position: position, next: next };
}
function formatMetadataError(e, context) {
    if (isMetadataError(e)) {
        // Produce a formatted version of the and leaving enough information in the original error
        // to recover the formatting information to eventually produce a diagnostic error message.
        var position = e.position;
        var chain = {
            message: "Error during template compile of '" + context.name + "'",
            position: position,
            next: { message: e.message, next: e.chain, context: e.context, symbol: e.symbol }
        };
        var advise = e.advise || messageAdvise(e.message, e.context);
        return formattedError(formatMetadataMessageChain(chain, advise));
    }
    return e;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGljX3JlZmxlY3Rvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyL3NyYy9hb3Qvc3RhdGljX3JlZmxlY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBRUgsT0FBTyxFQUFDLGtCQUFrQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFFdkQsT0FBTyxFQUFrQixlQUFlLEVBQUUsZUFBZSxFQUFFLGtCQUFrQixFQUFFLHFCQUFxQixFQUFFLGVBQWUsRUFBRSxVQUFVLEVBQUUsaUJBQWlCLEVBQUUsa0JBQWtCLEVBQUUsWUFBWSxFQUFFLGdCQUFnQixFQUFFLFdBQVcsRUFBRSxjQUFjLEVBQUUsY0FBYyxFQUFFLFlBQVksRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLGNBQWMsRUFBRSxlQUFlLEVBQUUsa0JBQWtCLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFHalcsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUVwQyxPQUFPLEVBQXdCLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3hFLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUc3QyxJQUFNLFlBQVksR0FBRyxlQUFlLENBQUM7QUFDckMsSUFBTSxjQUFjLEdBQUcsaUJBQWlCLENBQUM7QUFFekMsSUFBTSxVQUFVLEdBQUcsVUFBVSxDQUFDO0FBRTlCLElBQU0sTUFBTSxHQUFHO0lBQ2IsVUFBVSxFQUFFLFFBQVE7Q0FDckIsQ0FBQztBQUVGLElBQU0sU0FBUyxHQUFHLFVBQVUsQ0FBQztBQUM3QixJQUFNLE9BQU8sR0FBRyxTQUFTLENBQUM7QUFDMUIsSUFBTSxhQUFhLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQyxTQUFTLEVBQUUsWUFBWSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FB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QUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQztRQUM1QixJQUFNLEtBQUssR0FBeUI7WUFDbEMsT0FBTyxFQUFFLHVDQUFxQyxPQUFPLENBQUMsSUFBSSxNQUFHO1lBQzdELFFBQVEsRUFBRSxRQUFRO1lBQ2xCLElBQUksRUFBRSxFQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUMsTUFBTSxFQUFDO1NBQ2hGLENBQUM7UUFDRixJQUFNLE1BQU0sR0FBRyxDQUFDLENBQUMsTUFBTSxJQUFJLGFBQWEsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMvRCxPQUFPLGNBQWMsQ0FBQywwQkFBMEIsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztLQUNsRTtJQUNELE9BQU8sQ0FBQyxDQUFDO0FBQ1gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDb21waWxlU3VtbWFyeUtpbmR9IGZyb20gJy4uL2NvbXBpbGVfbWV0YWRhdGEnO1xuaW1wb3J0IHtDb21waWxlUmVmbGVjdG9yfSBmcm9tICcuLi9jb21waWxlX3JlZmxlY3Rvcic7XG5pbXBvcnQge01ldGFkYXRhRmFjdG9yeSwgY3JlYXRlQXR0cmlidXRlLCBjcmVhdGVDb21wb25lbnQsIGNyZWF0ZUNvbnRlbnRDaGlsZCwgY3JlYXRlQ29udGVudENoaWxkcmVuLCBjcmVhdGVEaXJlY3RpdmUsIGNyZWF0ZUhvc3QsIGNyZWF0ZUhvc3RCaW5kaW5nLCBjcmVhdGVIb3N0TGlzdGVuZXIsIGNyZWF0ZUluamVjdCwgY3JlYXRlSW5qZWN0YWJsZSwgY3JlYXRlSW5wdXQsIGNyZWF0ZU5nTW9kdWxlLCBjcmVhdGVPcHRpb25hbCwgY3JlYXRlT3V0cHV0LCBjcmVhdGVQaXBlLCBjcmVhdGVTZWxmLCBjcmVhdGVTa2lwU2VsZiwgY3JlYXRlVmlld0NoaWxkLCBjcmVhdGVWaWV3Q2hpbGRyZW59IGZyb20gJy4uL2NvcmUnO1xuaW1wb3J0ICogYXMgbyBmcm9tICcuLi9vdXRwdXQvb3V0cHV0X2FzdCc7XG5pbXBvcnQge1N1bW1hcnlSZXNvbHZlcn0gZnJvbSAnLi4vc3VtbWFyeV9yZXNvbHZlcic7XG5pbXBvcnQge3N5bnRheEVycm9yfSBmcm9tICcuLi91dGlsJztcblxuaW1wb3J0IHtGb3JtYXR0ZWRNZXNzYWdlQ2hhaW4sIGZvcm1hdHRlZEVycm9yfSBmcm9tICcuL2Zvcm1hdHRlZF9lcnJvcic7XG5pbXBvcnQge1N0YXRpY1N5bWJvbH0gZnJvbSAnLi9zdGF0aWNfc3ltYm9sJztcbmltcG9ydCB7U3RhdGljU3ltYm9sUmVzb2x2ZXJ9IGZyb20gJy4vc3RhdGljX3N5bWJvbF9yZXNvbHZlcic7XG5cbmNvbnN0IEFOR1VMQVJfQ09SRSA9ICdAYW5ndWxhci9jb3JlJztcbmNvbnN0IEFOR1VMQVJfUk9VVEVSID0gJ0Bhbmd1bGFyL3JvdXRlcic7XG5cbmNvbnN0IEhJRERFTl9LRVkgPSAvXlxcJC4qXFwkJC87XG5cbmNvbnN0IElHTk9SRSA9IHtcbiAgX19zeW1ib2xpYzogJ2lnbm9yZSdcbn07XG5cbmNvbnN0IFVTRV9WQUxVRSA9ICd1c2VWYWx1ZSc7XG5jb25zdCBQUk9WSURFID0gJ3Byb3ZpZGUnO1xuY29uc3QgUkVGRVJFTkNFX1NFVCA9IG5ldyBTZXQoW1VTRV9WQUxVRSwgJ3VzZUZhY3RvcnknLCAnZGF0YScsICdpZCcsICdsb2FkQ2hpbGRyZW4nXSk7XG5jb25zdCBUWVBFR1VBUkRfUE9TVEZJWCA9ICdUeXBlR3VhcmQnO1xuY29uc3QgVVNFX0lGID0gJ1VzZUlmJztcblxuZnVuY3Rpb24gc2hvdWxkSWdub3JlKHZhbHVlOiBhbnkpOiBib29sZWFuIHtcbiAgcmV0dXJuIHZhbHVlICYmIHZhbHVlLl9fc3ltYm9saWMgPT0gJ2lnbm9yZSc7XG59XG5cbi8qKlxuICogQSBzdGF0aWMgcmVmbGVjdG9yIGltcGxlbWVudHMgZW5vdWdoIG9mIHRoZSBSZWZsZWN0b3IgQVBJIHRoYXQgaXMgbmVjZXNzYXJ5IHRvIGNvbXBpbGVcbiAqIHRlbXBsYXRlcyBzdGF0aWNhbGx5LlxuICovXG5leHBvcnQgY2xhc3MgU3RhdGljUmVmbGVjdG9yIGltcGxlbWVudHMgQ29tcGlsZVJlZmxlY3RvciB7XG4gIHByaXZhdGUgYW5ub3RhdGlvbkNhY2hlID0gbmV3IE1hcDxTdGF0aWNTeW1ib2wsIGFueVtdPigpO1xuICBwcml2YXRlIHNoYWxsb3dBbm5vdGF0aW9uQ2FjaGUgPSBuZXcgTWFwPFN0YXRpY1N5bWJvbCwgYW55W10+KCk7XG4gIHByaXZhdGUgcHJvcGVydHlDYWNoZSA9IG5ldyBNYXA8U3RhdGljU3ltYm9sLCB7W2tleTogc3RyaW5nXTogYW55W119PigpO1xuICBwcml2YXRlIHBhcmFtZXRlckNhY2hlID0gbmV3IE1hcDxTdGF0aWNTeW1ib2wsIGFueVtdPigpO1xuICBwcml2YXRlIG1ldGhvZENhY2hlID0gbmV3IE1hcDxTdGF0aWNTeW1ib2wsIHtba2V5OiBzdHJpbmddOiBib29sZWFufT4oKTtcbiAgcHJpdmF0ZSBzdGF0aWNDYWNoZSA9IG5ldyBNYXA8U3RhdGljU3ltYm9sLCBzdHJpbmdbXT4oKTtcbiAgcHJpdmF0ZSBjb252ZXJzaW9uTWFwID0gbmV3IE1hcDxTdGF0aWNTeW1ib2wsIChjb250ZXh0OiBTdGF0aWNTeW1ib2wsIGFyZ3M6IGFueVtdKSA9PiBhbnk+KCk7XG4gIHByaXZhdGUgcmVzb2x2ZWRFeHRlcm5hbFJlZmVyZW5jZXMgPSBuZXcgTWFwPHN0cmluZywgU3RhdGljU3ltYm9sPigpO1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgcHJpdmF0ZSBpbmplY3Rpb25Ub2tlbiAhOiBTdGF0aWNTeW1ib2w7XG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBwcml2YXRlIG9wYXF1ZVRva2VuICE6IFN0YXRpY1N5bWJvbDtcbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIFJPVVRFUyAhOiBTdGF0aWNTeW1ib2w7XG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBwcml2YXRlIEFOQUxZWkVfRk9SX0VOVFJZX0NPTVBPTkVOVFMgITogU3RhdGljU3ltYm9sO1xuICBwcml2YXRlIGFubm90YXRpb25Gb3JQYXJlbnRDbGFzc1dpdGhTdW1tYXJ5S2luZCA9XG4gICAgICBuZXcgTWFwPENvbXBpbGVTdW1tYXJ5S2luZCwgTWV0YWRhdGFGYWN0b3J5PGFueT5bXT4oKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgc3VtbWFyeVJlc29sdmVyOiBTdW1tYXJ5UmVzb2x2ZXI8U3RhdGljU3ltYm9sPixcbiAgICAgIHByaXZhdGUgc3ltYm9sUmVzb2x2ZXI6IFN0YXRpY1N5bWJvbFJlc29sdmVyLFxuICAgICAga25vd25NZXRhZGF0YUNsYXNzZXM6IHtuYW1lOiBzdHJpbmcsIGZpbGVQYXRoOiBzdHJpbmcsIGN0b3I6IGFueX1bXSA9IFtdLFxuICAgICAga25vd25NZXRhZGF0YUZ1bmN0aW9uczoge25hbWU6IHN0cmluZywgZmlsZVBhdGg6IHN0cmluZywgZm46IGFueX1bXSA9IFtdLFxuICAgICAgcHJpdmF0ZSBlcnJvclJlY29yZGVyPzogKGVycm9yOiBhbnksIGZpbGVOYW1lPzogc3RyaW5nKSA9PiB2b2lkKSB7XG4gICAgdGhpcy5pbml0aWFsaXplQ29udmVyc2lvbk1hcCgpO1xuICAgIGtub3duTWV0YWRhdGFDbGFzc2VzLmZvckVhY2goXG4gICAgICAgIChrYykgPT4gdGhpcy5fcmVnaXN0ZXJEZWNvcmF0b3JPckNvbnN0cnVjdG9yKFxuICAgICAgICAgICAgdGhpcy5nZXRTdGF0aWNTeW1ib2woa2MuZmlsZVBhdGgsIGtjLm5hbWUpLCBrYy5jdG9yKSk7XG4gICAga25vd25NZXRhZGF0YUZ1bmN0aW9ucy5mb3JFYWNoKFxuICAgICAgICAoa2YpID0+IHRoaXMuX3JlZ2lzdGVyRnVuY3Rpb24odGhpcy5nZXRTdGF0aWNTeW1ib2woa2YuZmlsZVBhdGgsIGtmLm5hbWUpLCBrZi5mbikpO1xuICAgIHRoaXMuYW5ub3RhdGlvbkZvclBhcmVudENsYXNzV2l0aFN1bW1hcnlLaW5kLnNldChcbiAgICAgICAgQ29tcGlsZVN1bW1hcnlLaW5kLkRpcmVjdGl2ZSwgW2NyZWF0ZURpcmVjdGl2ZSwgY3JlYXRlQ29tcG9uZW50XSk7XG4gICAgdGhpcy5hbm5vdGF0aW9uRm9yUGFyZW50Q2xhc3NXaXRoU3VtbWFyeUtpbmQuc2V0KENvbXBpbGVTdW1tYXJ5S2luZC5QaXBlLCBbY3JlYXRlUGlwZV0pO1xuICAgIHRoaXMuYW5ub3RhdGlvbkZvclBhcmVudENsYXNzV2l0aFN1bW1hcnlLaW5kLnNldChDb21waWxlU3VtbWFyeUtpbmQuTmdNb2R1bGUsIFtjcmVhdGVOZ01vZHVsZV0pO1xuICAgIHRoaXMuYW5ub3RhdGlvbkZvclBhcmVudENsYXNzV2l0aFN1bW1hcnlLaW5kLnNldChcbiAgICAgICAgQ29tcGlsZVN1bW1hcnlLaW5kLkluamVjdGFibGUsXG4gICAgICAgIFtjcmVhdGVJbmplY3RhYmxlLCBjcmVhdGVQaXBlLCBjcmVhdGVEaXJlY3RpdmUsIGNyZWF0ZUNvbXBvbmVudCwgY3JlYXRlTmdNb2R1bGVdKTtcbiAgfVxuXG4gIGNvbXBvbmVudE1vZHVsZVVybCh0eXBlT3JGdW5jOiBTdGF0aWNTeW1ib2wpOiBzdHJpbmcge1xuICAgIGNvbnN0IHN0YXRpY1N5bWJvbCA9IHRoaXMuZmluZFN5bWJvbERlY2xhcmF0aW9uKHR5cGVPckZ1bmMpO1xuICAgIHJldHVybiB0aGlzLnN5bWJvbFJlc29sdmVyLmdldFJlc291cmNlUGF0aChzdGF0aWNTeW1ib2wpO1xuICB9XG5cbiAgcmVzb2x2ZUV4dGVybmFsUmVmZXJlbmNlKHJlZjogby5FeHRlcm5hbFJlZmVyZW5jZSwgY29udGFpbmluZ0ZpbGU/OiBzdHJpbmcpOiBTdGF0aWNTeW1ib2wge1xuICAgIGxldCBrZXk6IHN0cmluZ3x1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgaWYgKCFjb250YWluaW5nRmlsZSkge1xuICAgICAga2V5ID0gYCR7cmVmLm1vZHVsZU5hbWV9OiR7cmVmLm5hbWV9YDtcbiAgICAgIGNvbnN0IGRlY2xhcmF0aW9uU3ltYm9sID0gdGhpcy5yZXNvbHZlZEV4dGVybmFsUmVmZXJlbmNlcy5nZXQoa2V5KTtcbiAgICAgIGlmIChkZWNsYXJhdGlvblN5bWJvbCkgcmV0dXJuIGRlY2xhcmF0aW9uU3ltYm9sO1xuICAgIH1cbiAgICBjb25zdCByZWZTeW1ib2wgPVxuICAgICAgICB0aGlzLnN5bWJvbFJlc29sdmVyLmdldFN5bWJvbEJ5TW9kdWxlKHJlZi5tb2R1bGVOYW1lICEsIHJlZi5uYW1lICEsIGNvbnRhaW5pbmdGaWxlKTtcbiAgICBjb25zdCBkZWNsYXJhdGlvblN5bWJvbCA9IHRoaXMuZmluZFN5bWJvbERlY2xhcmF0aW9uKHJlZlN5bWJvbCk7XG4gICAgaWYgKCFjb250YWluaW5nRmlsZSkge1xuICAgICAgdGhpcy5zeW1ib2xSZXNvbHZlci5yZWNvcmRNb2R1bGVOYW1lRm9yRmlsZU5hbWUocmVmU3ltYm9sLmZpbGVQYXRoLCByZWYubW9kdWxlTmFtZSAhKTtcbiAgICAgIHRoaXMuc3ltYm9sUmVzb2x2ZXIucmVjb3JkSW1wb3J0QXMoZGVjbGFyYXRpb25TeW1ib2wsIHJlZlN5bWJvbCk7XG4gICAgfVxuICAgIGlmIChrZXkpIHtcbiAgICAgIHRoaXMucmVzb2x2ZWRFeHRlcm5hbFJlZmVyZW5jZXMuc2V0KGtleSwgZGVjbGFyYXRpb25TeW1ib2wpO1xuICAgIH1cbiAgICByZXR1cm4gZGVjbGFyYXRpb25TeW1ib2w7XG4gIH1cblxuICBmaW5kRGVjbGFyYXRpb24obW9kdWxlVXJsOiBzdHJpbmcsIG5hbWU6IHN0cmluZywgY29udGFpbmluZ0ZpbGU/OiBzdHJpbmcpOiBTdGF0aWNTeW1ib2wge1xuICAgIHJldHVybiB0aGlzLmZpbmRTeW1ib2xEZWNsYXJhdGlvbihcbiAgICAgICAgdGhpcy5zeW1ib2xSZXNvbHZlci5nZXRTeW1ib2xCeU1vZHVsZShtb2R1bGVVcmwsIG5hbWUsIGNvbnRhaW5pbmdGaWxlKSk7XG4gIH1cblxuICB0cnlGaW5kRGVjbGFyYXRpb24obW9kdWxlVXJsOiBzdHJpbmcsIG5hbWU6IHN0cmluZywgY29udGFpbmluZ0ZpbGU/OiBzdHJpbmcpOiBTdGF0aWNTeW1ib2wge1xuICAgIHJldHVybiB0aGlzLnN5bWJvbFJlc29sdmVyLmlnbm9yZUVycm9yc0ZvcihcbiAgICAgICAgKCkgPT4gdGhpcy5maW5kRGVjbGFyYXRpb24obW9kdWxlVXJsLCBuYW1lLCBjb250YWluaW5nRmlsZSkpO1xuICB9XG5cbiAgZmluZFN5bWJvbERlY2xhcmF0aW9uKHN5bWJvbDogU3RhdGljU3ltYm9sKTogU3RhdGljU3ltYm9sIHtcbiAgICBjb25zdCByZXNvbHZlZFN5bWJvbCA9IHRoaXMuc3ltYm9sUmVzb2x2ZXIucmVzb2x2ZVN5bWJvbChzeW1ib2wpO1xuICAgIGlmIChyZXNvbHZlZFN5bWJvbCkge1xuICAgICAgbGV0IHJlc29sdmVkTWV0YWRhdGEgPSByZXNvbHZlZFN5bWJvbC5tZXRhZGF0YTtcbiAgICAgIGlmIChyZXNvbHZlZE1ldGFkYXRhICYmIHJlc29sdmVkTWV0YWRhdGEuX19zeW1ib2xpYyA9PT0gJ3Jlc29sdmVkJykge1xuICAgICAgICByZXNvbHZlZE1ldGFkYXRhID0gcmVzb2x2ZWRNZXRhZGF0YS5zeW1ib2w7XG4gICAgICB9XG4gICAgICBpZiAocmVzb2x2ZWRNZXRhZGF0YSBpbnN0YW5jZW9mIFN0YXRpY1N5bWJvbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5maW5kU3ltYm9sRGVjbGFyYXRpb24ocmVzb2x2ZWRTeW1ib2wubWV0YWRhdGEpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc3ltYm9sO1xuICB9XG5cbiAgcHVibGljIHRyeUFubm90YXRpb25zKHR5cGU6IFN0YXRpY1N5bWJvbCk6IGFueVtdIHtcbiAgICBjb25zdCBvcmlnaW5hbFJlY29yZGVyID0gdGhpcy5lcnJvclJlY29yZGVyO1xuICAgIHRoaXMuZXJyb3JSZWNvcmRlciA9IChlcnJvcjogYW55LCBmaWxlTmFtZTogc3RyaW5nKSA9PiB7fTtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIHRoaXMuYW5ub3RhdGlvbnModHlwZSk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMuZXJyb3JSZWNvcmRlciA9IG9yaWdpbmFsUmVjb3JkZXI7XG4gICAgfVxuICB9XG5cbiAgcHVibGljIGFubm90YXRpb25zKHR5cGU6IFN0YXRpY1N5bWJvbCk6IGFueVtdIHtcbiAgICByZXR1cm4gdGhpcy5fYW5ub3RhdGlvbnMoXG4gICAgICAgIHR5cGUsICh0eXBlOiBTdGF0aWNTeW1ib2wsIGRlY29yYXRvcnM6IGFueSkgPT4gdGhpcy5zaW1wbGlmeSh0eXBlLCBkZWNvcmF0b3JzKSxcbiAgICAgICAgdGhpcy5hbm5vdGF0aW9uQ2FjaGUpO1xuICB9XG5cbiAgcHVibGljIHNoYWxsb3dBbm5vdGF0aW9ucyh0eXBlOiBTdGF0aWNTeW1ib2wpOiBhbnlbXSB7XG4gICAgcmV0dXJuIHRoaXMuX2Fubm90YXRpb25zKFxuICAgICAgICB0eXBlLCAodHlwZTogU3RhdGljU3ltYm9sLCBkZWNvcmF0b3JzOiBhbnkpID0+IHRoaXMuc2ltcGxpZnkodHlwZSwgZGVjb3JhdG9ycywgdHJ1ZSksXG4gICAgICAgIHRoaXMuc2hhbGxvd0Fubm90YXRpb25DYWNoZSk7XG4gIH1cblxuICBwcml2YXRlIF9hbm5vdGF0aW9ucyhcbiAgICAgIHR5cGU6IFN0YXRpY1N5bWJvbCwgc2ltcGxpZnk6ICh0eXBlOiBTdGF0aWNTeW1ib2wsIGRlY29yYXRvcnM6IGFueSkgPT4gYW55LFxuICAgICAgYW5ub3RhdGlvbkNhY2hlOiBNYXA8U3RhdGljU3ltYm9sLCBhbnlbXT4pOiBhbnlbXSB7XG4gICAgbGV0IGFubm90YXRpb25zID0gYW5ub3RhdGlvbkNhY2hlLmdldCh0eXBlKTtcbiAgICBpZiAoIWFubm90YXRpb25zKSB7XG4gICAgICBhbm5vdGF0aW9ucyA9IFtdO1xuICAgICAgY29uc3QgY2xhc3NNZXRhZGF0YSA9IHRoaXMuZ2V0VHlwZU1ldGFkYXRhKHR5cGUpO1xuICAgICAgY29uc3QgcGFyZW50VHlwZSA9IHRoaXMuZmluZFBhcmVudFR5cGUodHlwZSwgY2xhc3NNZXRhZGF0YSk7XG4gICAgICBpZiAocGFyZW50VHlwZSkge1xuICAgICAgICBjb25zdCBwYXJlbnRBbm5vdGF0aW9ucyA9IHRoaXMuYW5ub3RhdGlvbnMocGFyZW50VHlwZSk7XG4gICAgICAgIGFubm90YXRpb25zLnB1c2goLi4ucGFyZW50QW5ub3RhdGlvbnMpO1xuICAgICAgfVxuICAgICAgbGV0IG93bkFubm90YXRpb25zOiBhbnlbXSA9IFtdO1xuICAgICAgaWYgKGNsYXNzTWV0YWRhdGFbJ2RlY29yYXRvcnMnXSkge1xuICAgICAgICBvd25Bbm5vdGF0aW9ucyA9IHNpbXBsaWZ5KHR5cGUsIGNsYXNzTWV0YWRhdGFbJ2RlY29yYXRvcnMnXSk7XG4gICAgICAgIGlmIChvd25Bbm5vdGF0aW9ucykge1xuICAgICAgICAgIGFubm90YXRpb25zLnB1c2goLi4ub3duQW5ub3RhdGlvbnMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAocGFyZW50VHlwZSAmJiAhdGhpcy5zdW1tYXJ5UmVzb2x2ZXIuaXNMaWJyYXJ5RmlsZSh0eXBlLmZpbGVQYXRoKSAmJlxuICAgICAgICAgIHRoaXMuc3VtbWFyeVJlc29sdmVyLmlzTGlicmFyeUZpbGUocGFyZW50VHlwZS5maWxlUGF0aCkpIHtcbiAgICAgICAgY29uc3Qgc3VtbWFyeSA9IHRoaXMuc3VtbWFyeVJlc29sdmVyLnJlc29sdmVTdW1tYXJ5KHBhcmVudFR5cGUpO1xuICAgICAgICBpZiAoc3VtbWFyeSAmJiBzdW1tYXJ5LnR5cGUpIHtcbiAgICAgICAgICBjb25zdCByZXF1aXJlZEFubm90YXRpb25UeXBlcyA9XG4gICAgICAgICAgICAgIHRoaXMuYW5ub3RhdGlvbkZvclBhcmVudENsYXNzV2l0aFN1bW1hcnlLaW5kLmdldChzdW1tYXJ5LnR5cGUuc3VtbWFyeUtpbmQgISkgITtcbiAgICAgICAgICBjb25zdCB0eXBlSGFzUmVxdWlyZWRBbm5vdGF0aW9uID0gcmVxdWlyZWRBbm5vdGF0aW9uVHlwZXMuc29tZShcbiAgICAgICAgICAgICAgKHJlcXVpcmVkVHlwZSkgPT4gb3duQW5ub3RhdGlvbnMuc29tZShhbm4gPT4gcmVxdWlyZWRUeXBlLmlzVHlwZU9mKGFubikpKTtcbiAgICAgICAgICBpZiAoIXR5cGVIYXNSZXF1aXJlZEFubm90YXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMucmVwb3J0RXJyb3IoXG4gICAgICAgICAgICAgICAgZm9ybWF0TWV0YWRhdGFFcnJvcihcbiAgICAgICAgICAgICAgICAgICAgbWV0YWRhdGFFcnJvcihcbiAgICAgICAgICAgICAgICAgICAgICAgIGBDbGFzcyAke3R5cGUubmFtZX0gaW4gJHt0eXBlLmZpbGVQYXRofSBleHRlbmRzIGZyb20gYSAke0NvbXBpbGVTdW1tYXJ5S2luZFtzdW1tYXJ5LnR5cGUuc3VtbWFyeUtpbmQhXX0gaW4gYW5vdGhlciBjb21waWxhdGlvbiB1bml0IHdpdGhvdXQgZHVwbGljYXRpbmcgdGhlIGRlY29yYXRvcmAsXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBzdW1tYXJ5ICovIHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGBQbGVhc2UgYWRkIGEgJHtyZXF1aXJlZEFubm90YXRpb25UeXBlcy5tYXAoKHR5cGUpID0+IHR5cGUubmdNZXRhZGF0YU5hbWUpLmpvaW4oJyBvciAnKX0gZGVjb3JhdG9yIHRvIHRoZSBjbGFzc2ApLFxuICAgICAgICAgICAgICAgICAgICB0eXBlKSxcbiAgICAgICAgICAgICAgICB0eXBlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGFubm90YXRpb25DYWNoZS5zZXQodHlwZSwgYW5ub3RhdGlvbnMuZmlsdGVyKGFubiA9PiAhIWFubikpO1xuICAgIH1cbiAgICByZXR1cm4gYW5ub3RhdGlvbnM7XG4gIH1cblxuICBwdWJsaWMgcHJvcE1ldGFkYXRhKHR5cGU6IFN0YXRpY1N5bWJvbCk6IHtba2V5OiBzdHJpbmddOiBhbnlbXX0ge1xuICAgIGxldCBwcm9wTWV0YWRhdGEgPSB0aGlzLnByb3BlcnR5Q2FjaGUuZ2V0KHR5cGUpO1xuICAgIGlmICghcHJvcE1ldGFkYXRhKSB7XG4gICAgICBjb25zdCBjbGFzc01ldGFkYXRhID0gdGhpcy5nZXRUeXBlTWV0YWRhdGEodHlwZSk7XG4gICAgICBwcm9wTWV0YWRhdGEgPSB7fTtcbiAgICAgIGNvbnN0IHBhcmVudFR5cGUgPSB0aGlzLmZpbmRQYXJlbnRUeXBlKHR5cGUsIGNsYXNzTWV0YWRhdGEpO1xuICAgICAgaWYgKHBhcmVudFR5cGUpIHtcbiAgICAgICAgY29uc3QgcGFyZW50UHJvcE1ldGFkYXRhID0gdGhpcy5wcm9wTWV0YWRhdGEocGFyZW50VHlwZSk7XG4gICAgICAgIE9iamVjdC5rZXlzKHBhcmVudFByb3BNZXRhZGF0YSkuZm9yRWFjaCgocGFyZW50UHJvcCkgPT4ge1xuICAgICAgICAgIHByb3BNZXRhZGF0YSAhW3BhcmVudFByb3BdID0gcGFyZW50UHJvcE1ldGFkYXRhW3BhcmVudFByb3BdO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbWVtYmVycyA9IGNsYXNzTWV0YWRhdGFbJ21lbWJlcnMnXSB8fCB7fTtcbiAgICAgIE9iamVjdC5rZXlzKG1lbWJlcnMpLmZvckVhY2goKHByb3BOYW1lKSA9PiB7XG4gICAgICAgIGNvbnN0IHByb3BEYXRhID0gbWVtYmVyc1twcm9wTmFtZV07XG4gICAgICAgIGNvbnN0IHByb3AgPSAoPGFueVtdPnByb3BEYXRhKVxuICAgICAgICAgICAgICAgICAgICAgICAgIC5maW5kKGEgPT4gYVsnX19zeW1ib2xpYyddID09ICdwcm9wZXJ0eScgfHwgYVsnX19zeW1ib2xpYyddID09ICdtZXRob2QnKTtcbiAgICAgICAgY29uc3QgZGVjb3JhdG9yczogYW55W10gPSBbXTtcbiAgICAgICAgaWYgKHByb3BNZXRhZGF0YSAhW3Byb3BOYW1lXSkge1xuICAgICAgICAgIGRlY29yYXRvcnMucHVzaCguLi5wcm9wTWV0YWRhdGEgIVtwcm9wTmFtZV0pO1xuICAgICAgICB9XG4gICAgICAgIHByb3BNZXRhZGF0YSAhW3Byb3BOYW1lXSA9IGRlY29yYXRvcnM7XG4gICAgICAgIGlmIChwcm9wICYmIHByb3BbJ2RlY29yYXRvcnMnXSkge1xuICAgICAgICAgIGRlY29yYXRvcnMucHVzaCguLi50aGlzLnNpbXBsaWZ5KHR5cGUsIHByb3BbJ2RlY29yYXRvcnMnXSkpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHRoaXMucHJvcGVydHlDYWNoZS5zZXQodHlwZSwgcHJvcE1ldGFkYXRhKTtcbiAgICB9XG4gICAgcmV0dXJuIHByb3BNZXRhZGF0YTtcbiAgfVxuXG4gIHB1YmxpYyBwYXJhbWV0ZXJzKHR5cGU6IFN0YXRpY1N5bWJvbCk6IGFueVtdIHtcbiAgICBpZiAoISh0eXBlIGluc3RhbmNlb2YgU3RhdGljU3ltYm9sKSkge1xuICAgICAgdGhpcy5yZXBvcnRFcnJvcihcbiAgICAgICAgICBuZXcgRXJyb3IoYHBhcmFtZXRlcnMgcmVjZWl2ZWQgJHtKU09OLnN0cmluZ2lmeSh0eXBlKX0gd2hpY2ggaXMgbm90IGEgU3RhdGljU3ltYm9sYCksXG4gICAgICAgICAgdHlwZSk7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICBsZXQgcGFyYW1ldGVycyA9IHRoaXMucGFyYW1ldGVyQ2FjaGUuZ2V0KHR5cGUpO1xuICAgICAgaWYgKCFwYXJhbWV0ZXJzKSB7XG4gICAgICAgIGNvbnN0IGNsYXNzTWV0YWRhdGEgPSB0aGlzLmdldFR5cGVNZXRhZGF0YSh0eXBlKTtcbiAgICAgICAgY29uc3QgcGFyZW50VHlwZSA9IHRoaXMuZmluZFBhcmVudFR5cGUodHlwZSwgY2xhc3NNZXRhZGF0YSk7XG4gICAgICAgIGNvbnN0IG1lbWJlcnMgPSBjbGFzc01ldGFkYXRhID8gY2xhc3NNZXRhZGF0YVsnbWVtYmVycyddIDogbnVsbDtcbiAgICAgICAgY29uc3QgY3RvckRhdGEgPSBtZW1iZXJzID8gbWVtYmVyc1snX19jdG9yX18nXSA6IG51bGw7XG4gICAgICAgIGlmIChjdG9yRGF0YSkge1xuICAgICAgICAgIGNvbnN0IGN0b3IgPSAoPGFueVtdPmN0b3JEYXRhKS5maW5kKGEgPT4gYVsnX19zeW1ib2xpYyddID09ICdjb25zdHJ1Y3RvcicpO1xuICAgICAgICAgIGNvbnN0IHJhd1BhcmFtZXRlclR5cGVzID0gPGFueVtdPmN0b3JbJ3BhcmFtZXRlcnMnXSB8fCBbXTtcbiAgICAgICAgICBjb25zdCBwYXJhbWV0ZXJEZWNvcmF0b3JzID0gPGFueVtdPnRoaXMuc2ltcGxpZnkodHlwZSwgY3RvclsncGFyYW1ldGVyRGVjb3JhdG9ycyddIHx8IFtdKTtcbiAgICAgICAgICBwYXJhbWV0ZXJzID0gW107XG4gICAgICAgICAgcmF3UGFyYW1ldGVyVHlwZXMuZm9yRWFjaCgocmF3UGFyYW1UeXBlLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgbmVzdGVkUmVzdWx0OiBhbnlbXSA9IFtdO1xuICAgICAgICAgICAgY29uc3QgcGFyYW1UeXBlID0gdGhpcy50cnlTaW1wbGlmeSh0eXBlLCByYXdQYXJhbVR5cGUpO1xuICAgICAgICAgICAgaWYgKHBhcmFtVHlwZSkgbmVzdGVkUmVzdWx0LnB1c2gocGFyYW1UeXBlKTtcbiAgICAgICAgICAgIGNvbnN0IGRlY29yYXRvcnMgPSBwYXJhbWV0ZXJEZWNvcmF0b3JzID8gcGFyYW1ldGVyRGVjb3JhdG9yc1tpbmRleF0gOiBudWxsO1xuICAgICAgICAgICAgaWYgKGRlY29yYXRvcnMpIHtcbiAgICAgICAgICAgICAgbmVzdGVkUmVzdWx0LnB1c2goLi4uZGVjb3JhdG9ycyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwYXJhbWV0ZXJzICEucHVzaChuZXN0ZWRSZXN1bHQpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKHBhcmVudFR5cGUpIHtcbiAgICAgICAgICBwYXJhbWV0ZXJzID0gdGhpcy5wYXJhbWV0ZXJzKHBhcmVudFR5cGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghcGFyYW1ldGVycykge1xuICAgICAgICAgIHBhcmFtZXRlcnMgPSBbXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnBhcmFtZXRlckNhY2hlLnNldCh0eXBlLCBwYXJhbWV0ZXJzKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBwYXJhbWV0ZXJzO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYEZhaWxlZCBvbiB0eXBlICR7SlNPTi5zdHJpbmdpZnkodHlwZSl9IHdpdGggZXJyb3IgJHtlfWApO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9tZXRob2ROYW1lcyh0eXBlOiBhbnkpOiB7W2tleTogc3RyaW5nXTogYm9vbGVhbn0ge1xuICAgIGxldCBtZXRob2ROYW1lcyA9IHRoaXMubWV0aG9kQ2FjaGUuZ2V0KHR5cGUpO1xuICAgIGlmICghbWV0aG9kTmFtZXMpIHtcbiAgICAgIGNvbnN0IGNsYXNzTWV0YWRhdGEgPSB0aGlzLmdldFR5cGVNZXRhZGF0YSh0eXBlKTtcbiAgICAgIG1ldGhvZE5hbWVzID0ge307XG4gICAgICBjb25zdCBwYXJlbnRUeXBlID0gdGhpcy5maW5kUGFyZW50VHlwZSh0eXBlLCBjbGFzc01ldGFkYXRhKTtcbiAgICAgIGlmIChwYXJlbnRUeXBlKSB7XG4gICAgICAgIGNvbnN0IHBhcmVudE1ldGhvZE5hbWVzID0gdGhpcy5fbWV0aG9kTmFtZXMocGFyZW50VHlwZSk7XG4gICAgICAgIE9iamVjdC5rZXlzKHBhcmVudE1ldGhvZE5hbWVzKS5mb3JFYWNoKChwYXJlbnRQcm9wKSA9PiB7XG4gICAgICAgICAgbWV0aG9kTmFtZXMgIVtwYXJlbnRQcm9wXSA9IHBhcmVudE1ldGhvZE5hbWVzW3BhcmVudFByb3BdO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbWVtYmVycyA9IGNsYXNzTWV0YWRhdGFbJ21lbWJlcnMnXSB8fCB7fTtcbiAgICAgIE9iamVjdC5rZXlzKG1lbWJlcnMpLmZvckVhY2goKHByb3BOYW1lKSA9PiB7XG4gICAgICAgIGNvbnN0IHByb3BEYXRhID0gbWVtYmVyc1twcm9wTmFtZV07XG4gICAgICAgIGNvbnN0IGlzTWV0aG9kID0gKDxhbnlbXT5wcm9wRGF0YSkuc29tZShhID0+IGFbJ19fc3ltYm9saWMnXSA9PSAnbWV0aG9kJyk7XG4gICAgICAgIG1ldGhvZE5hbWVzICFbcHJvcE5hbWVdID0gbWV0aG9kTmFtZXMgIVtwcm9wTmFtZV0gfHwgaXNNZXRob2Q7XG4gICAgICB9KTtcbiAgICAgIHRoaXMubWV0aG9kQ2FjaGUuc2V0KHR5cGUsIG1ldGhvZE5hbWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIG1ldGhvZE5hbWVzO1xuICB9XG5cbiAgcHJpdmF0ZSBfc3RhdGljTWVtYmVycyh0eXBlOiBTdGF0aWNTeW1ib2wpOiBzdHJpbmdbXSB7XG4gICAgbGV0IHN0YXRpY01lbWJlcnMgPSB0aGlzLnN0YXRpY0NhY2hlLmdldCh0eXBlKTtcbiAgICBpZiAoIXN0YXRpY01lbWJlcnMpIHtcbiAgICAgIGNvbnN0IGNsYXNzTWV0YWRhdGEgPSB0aGlzLmdldFR5cGVNZXRhZGF0YSh0eXBlKTtcbiAgICAgIGNvbnN0IHN0YXRpY01lbWJlckRhdGEgPSBjbGFzc01ldGFkYXRhWydzdGF0aWNzJ10gfHwge307XG4gICAgICBzdGF0aWNNZW1iZXJzID0gT2JqZWN0LmtleXMoc3RhdGljTWVtYmVyRGF0YSk7XG4gICAgICB0aGlzLnN0YXRpY0NhY2hlLnNldCh0eXBlLCBzdGF0aWNNZW1iZXJzKTtcbiAgICB9XG4gICAgcmV0dXJuIHN0YXRpY01lbWJlcnM7XG4gIH1cblxuXG4gIHByaXZhdGUgZmluZFBhcmVudFR5cGUodHlwZTogU3RhdGljU3ltYm9sLCBjbGFzc01ldGFkYXRhOiBhbnkpOiBTdGF0aWNTeW1ib2x8dW5kZWZpbmVkIHtcbiAgICBjb25zdCBwYXJlbnRUeXBlID0gdGhpcy50cnlTaW1wbGlmeSh0eXBlLCBjbGFzc01ldGFkYXRhWydleHRlbmRzJ10pO1xuICAgIGlmIChwYXJlbnRUeXBlIGluc3RhbmNlb2YgU3RhdGljU3ltYm9sKSB7XG4gICAgICByZXR1cm4gcGFyZW50VHlwZTtcbiAgICB9XG4gIH1cblxuICBoYXNMaWZlY3ljbGVIb29rKHR5cGU6IGFueSwgbGNQcm9wZXJ0eTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgaWYgKCEodHlwZSBpbnN0YW5jZW9mIFN0YXRpY1N5bWJvbCkpIHtcbiAgICAgIHRoaXMucmVwb3J0RXJyb3IoXG4gICAgICAgICAgbmV3IEVycm9yKFxuICAgICAgICAgICAgICBgaGFzTGlmZWN5Y2xlSG9vayByZWNlaXZlZCAke0pTT04uc3RyaW5naWZ5KHR5cGUpfSB3aGljaCBpcyBub3QgYSBTdGF0aWNTeW1ib2xgKSxcbiAgICAgICAgICB0eXBlKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiAhIXRoaXMuX21ldGhvZE5hbWVzKHR5cGUpW2xjUHJvcGVydHldO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYEZhaWxlZCBvbiB0eXBlICR7SlNPTi5zdHJpbmdpZnkodHlwZSl9IHdpdGggZXJyb3IgJHtlfWApO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cblxuICBndWFyZHModHlwZTogYW55KToge1trZXk6IHN0cmluZ106IFN0YXRpY1N5bWJvbH0ge1xuICAgIGlmICghKHR5cGUgaW5zdGFuY2VvZiBTdGF0aWNTeW1ib2wpKSB7XG4gICAgICB0aGlzLnJlcG9ydEVycm9yKFxuICAgICAgICAgIG5ldyBFcnJvcihgZ3VhcmRzIHJlY2VpdmVkICR7SlNPTi5zdHJpbmdpZnkodHlwZSl9IHdoaWNoIGlzIG5vdCBhIFN0YXRpY1N5bWJvbGApLCB0eXBlKTtcbiAgICAgIHJldHVybiB7fTtcbiAgICB9XG4gICAgY29uc3Qgc3RhdGljTWVtYmVycyA9IHRoaXMuX3N0YXRpY01lbWJlcnModHlwZSk7XG4gICAgY29uc3QgcmVzdWx0OiB7W2tleTogc3RyaW5nXTogU3RhdGljU3ltYm9sfSA9IHt9O1xuICAgIGZvciAobGV0IG5hbWUgb2Ygc3RhdGljTWVtYmVycykge1xuICAgICAgaWYgKG5hbWUuZW5kc1dpdGgoVFlQRUdVQVJEX1BPU1RGSVgpKSB7XG4gICAgICAgIGxldCBwcm9wZXJ0eSA9IG5hbWUuc3Vic3RyKDAsIG5hbWUubGVuZ3RoIC0gVFlQRUdVQVJEX1BPU1RGSVgubGVuZ3RoKTtcbiAgICAgICAgbGV0IHZhbHVlOiBhbnk7XG4gICAgICAgIGlmIChwcm9wZXJ0eS5lbmRzV2l0aChVU0VfSUYpKSB7XG4gICAgICAgICAgcHJvcGVydHkgPSBuYW1lLnN1YnN0cigwLCBwcm9wZXJ0eS5sZW5ndGggLSBVU0VfSUYubGVuZ3RoKTtcbiAgICAgICAgICB2YWx1ZSA9IFVTRV9JRjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YWx1ZSA9IHRoaXMuZ2V0U3RhdGljU3ltYm9sKHR5cGUuZmlsZVBhdGgsIHR5cGUubmFtZSwgW25hbWVdKTtcbiAgICAgICAgfVxuICAgICAgICByZXN1bHRbcHJvcGVydHldID0gdmFsdWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBwcml2YXRlIF9yZWdpc3RlckRlY29yYXRvck9yQ29uc3RydWN0b3IodHlwZTogU3RhdGljU3ltYm9sLCBjdG9yOiBhbnkpOiB2b2lkIHtcbiAgICB0aGlzLmNvbnZlcnNpb25NYXAuc2V0KHR5cGUsIChjb250ZXh0OiBTdGF0aWNTeW1ib2wsIGFyZ3M6IGFueVtdKSA9PiBuZXcgY3RvciguLi5hcmdzKSk7XG4gIH1cblxuICBwcml2YXRlIF9yZWdpc3RlckZ1bmN0aW9uKHR5cGU6IFN0YXRpY1N5bWJvbCwgZm46IGFueSk6IHZvaWQge1xuICAgIHRoaXMuY29udmVyc2lvbk1hcC5zZXQodHlwZSwgKGNvbnRleHQ6IFN0YXRpY1N5bWJvbCwgYXJnczogYW55W10pID0+IGZuLmFwcGx5KHVuZGVmaW5lZCwgYXJncykpO1xuICB9XG5cbiAgcHJpdmF0ZSBpbml0aWFsaXplQ29udmVyc2lvbk1hcCgpOiB2b2lkIHtcbiAgICB0aGlzLl9yZWdpc3RlckRlY29yYXRvck9yQ29uc3RydWN0b3IoXG4gICAgICAgIHRoaXMuZmluZERlY2xhcmF0aW9uKEFOR1VMQVJfQ09SRSwgJ0luamVjdGFibGUnKSwgY3JlYXRlSW5qZWN0YWJsZSk7XG4gICAgdGhpcy5pbmplY3Rpb25Ub2tlbiA9IHRoaXMuZmluZERlY2xhcmF0aW9uKEFOR1VMQVJfQ09SRSwgJ0luamVjdGlvblRva2VuJyk7XG4gICAgdGhpcy5vcGFxdWVUb2tlbiA9IHRoaXMuZmluZERlY2xhcmF0aW9uKEFOR1VMQVJfQ09SRSwgJ09wYXF1ZVRva2VuJyk7XG4gICAgdGhpcy5ST1VURVMgPSB0aGlzLnRyeUZpbmREZWNsYXJhdGlvbihBTkdVTEFSX1JPVVRFUiwgJ1JPVVRFUycpO1xuICAgIHRoaXMuQU5BTFlaRV9GT1JfRU5UUllfQ09NUE9ORU5UUyA9XG4gICAgICAgIHRoaXMuZmluZERlY2xhcmF0aW9uKEFOR1VMQVJfQ09SRSwgJ0FOQUxZWkVfRk9SX0VOVFJZX0NPTVBPTkVOVFMnKTtcblxuICAgIHRoaXMuX3JlZ2lzdGVyRGVjb3JhdG9yT3JDb25zdHJ1Y3Rvcih0aGlzLmZpbmREZWNsYXJhdGlvbihBTkdVTEFSX0NPUkUsICdIb3N0JyksIGNyZWF0ZUhvc3QpO1xuICAgIHRoaXMuX3JlZ2lzdGVyRGVjb3JhdG9yT3JDb25zdHJ1Y3Rvcih0aGlzLmZpbmREZWNsYXJhdGlvbihBTkdVTEFSX0NPUkUsICdTZWxmJyksIGNyZWF0ZVNlbGYpO1xuICAgIHRoaXMuX3JlZ2lzdGVyRGVjb3JhdG9yT3JDb25zdHJ1Y3RvcihcbiAgICAgICAgdGhpcy5maW5kRGVjbGFyYXRpb24oQU5HVUxBUl9DT1JFLCAnU2tpcFNlbGYnKSwgY3JlYXRlU2tpcFNlbGYpO1xuICAgIHRoaXMuX3JlZ2lzdGVyRGVjb3JhdG9yT3JDb25zdHJ1Y3RvcihcbiAgICAgICAgdGhpcy5maW5kRGVjbGFyYXRpb24oQU5HVUxBUl9DT1JFLCAnSW5qZWN0JyksIGNyZWF0ZUluamVjdCk7XG4gICAgdGhpcy5fcmVnaXN0ZXJEZWNvcmF0b3JPckNvbnN0cnVjdG9yKFxuICAgICAgICB0aGlzLmZpbmREZWNsYXJhdGlvbihBTkdVTEFSX0NPUkUsICdPcHRpb25hbCcpLCBjcmVhdGVPcHRpb25hbCk7XG4gICAgdGhpcy5fcmVnaXN0ZXJEZWNvcmF0b3JPckNvbnN0cnVjdG9yKFxuICAgICAgICB0aGlzLmZpbmREZWNsYXJhdGlvbihBTkdVTEFSX0NPUkUsICdBdHRyaWJ1dGUnKSwgY3JlYXRlQXR0cmlidXRlKTtcbiAgICB0aGlzLl9yZWdpc3RlckRlY29yYXRvck9yQ29uc3RydWN0b3IoXG4gICAgICAgIHRoaXMuZmluZERlY2xhcmF0aW9uKEFOR1VMQVJfQ09SRSwgJ0NvbnRlbnRDaGlsZCcpLCBjcmVhdGVDb250ZW50Q2hpbGQpO1xuICAgIHRoaXMuX3JlZ2lzdGVyRGVjb3JhdG9yT3JDb25zdHJ1Y3RvcihcbiAgICAgICAgdGhpcy5maW5kRGVjbGFyYXRpb24oQU5HVUxBUl9DT1JFLCAnQ29udGVudENoaWxkcmVuJyksIGNyZWF0ZUNvbnRlbnRDaGlsZHJlbik7XG4gICAgdGhpcy5fcmVnaXN0ZXJEZWNvcmF0b3JPckNvbnN0cnVjdG9yKFxuICAgICAgICB0aGlzLmZpbmREZWNsYXJhdGlvbihBTkdVTEFSX0NPUkUsICdWaWV3Q2hpbGQnKSwgY3JlYXRlVmlld0NoaWxkKTtcbiAgICB0aGlzLl9yZWdpc3RlckRlY29yYXRvck9yQ29uc3RydWN0b3IoXG4gICAgICAgIHRoaXMuZmluZERlY2xhcmF0aW9uKEFOR1VMQVJfQ09SRSwgJ1ZpZXdDaGlsZHJlbicpLCBjcmVhdGVWaWV3Q2hpbGRyZW4pO1xuICAgIHRoaXMuX3JlZ2lzdGVyRGVjb3JhdG9yT3JDb25zdHJ1Y3Rvcih0aGlzLmZpbmREZWNsYXJhdGlvbihBTkdVTEFSX0NPUkUsICdJbnB1dCcpLCBjcmVhdGVJbnB1dCk7XG4gICAgdGhpcy5fcmVnaXN0ZXJEZWNvcmF0b3JPckNvbnN0cnVjdG9yKFxuICAgICAgICB0aGlzLmZpbmREZWNsYXJhdGlvbihBTkdVTEFSX0NPUkUsICdPdXRwdXQnKSwgY3JlYXRlT3V0cHV0KTtcbiAgICB0aGlzLl9yZWdpc3RlckRlY29yYXRvck9yQ29uc3RydWN0b3IodGhpcy5maW5kRGVjbGFyYXRpb24oQU5HVUxBUl9DT1JFLCAnUGlwZScpLCBjcmVhdGVQaXBlKTtcbiAgICB0aGlzLl9yZWdpc3RlckRlY29yYXRvck9yQ29uc3RydWN0b3IoXG4gICAgICAgIHRoaXMuZmluZERlY2xhcmF0aW9uKEFOR1VMQVJfQ09SRSwgJ0hvc3RCaW5kaW5nJyksIGNyZWF0ZUhvc3RCaW5kaW5nKTtcbiAgICB0aGlzLl9yZWdpc3RlckRlY29yYXRvck9yQ29uc3RydWN0b3IoXG4gICAgICAgIHRoaXMuZmluZERlY2xhcmF0aW9uKEFOR1VMQVJfQ09SRSwgJ0hvc3RMaXN0ZW5lcicpLCBjcmVhdGVIb3N0TGlzdGVuZXIpO1xuICAgIHRoaXMuX3JlZ2lzdGVyRGVjb3JhdG9yT3JDb25zdHJ1Y3RvcihcbiAgICAgICAgdGhpcy5maW5kRGVjbGFyYXRpb24oQU5HVUxBUl9DT1JFLCAnRGlyZWN0aXZlJyksIGNyZWF0ZURpcmVjdGl2ZSk7XG4gICAgdGhpcy5fcmVnaXN0ZXJEZWNvcmF0b3JPckNvbnN0cnVjdG9yKFxuICAgICAgICB0aGlzLmZpbmREZWNsYXJhdGlvbihBTkdVTEFSX0NPUkUsICdDb21wb25lbnQnKSwgY3JlYXRlQ29tcG9uZW50KTtcbiAgICB0aGlzLl9yZWdpc3RlckRlY29yYXRvck9yQ29uc3RydWN0b3IoXG4gICAgICAgIHRoaXMuZmluZERlY2xhcmF0aW9uKEFOR1VMQVJfQ09SRSwgJ05nTW9kdWxlJyksIGNyZWF0ZU5nTW9kdWxlKTtcblxuICAgIC8vIE5vdGU6IFNvbWUgbWV0YWRhdGEgY2xhc3NlcyBjYW4gYmUgdXNlZCBkaXJlY3RseSB3aXRoIFByb3ZpZGVyLmRlcHMuXG4gICAgdGhpcy5fcmVnaXN0ZXJEZWNvcmF0b3JPckNvbnN0cnVjdG9yKHRoaXMuZmluZERlY2xhcmF0aW9uKEFOR1VMQVJfQ09SRSwgJ0hvc3QnKSwgY3JlYXRlSG9zdCk7XG4gICAgdGhpcy5fcmVnaXN0ZXJEZWNvcmF0b3JPckNvbnN0cnVjdG9yKHRoaXMuZmluZERlY2xhcmF0aW9uKEFOR1VMQVJfQ09SRSwgJ1NlbGYnKSwgY3JlYXRlU2VsZik7XG4gICAgdGhpcy5fcmVnaXN0ZXJEZWNvcmF0b3JPckNvbnN0cnVjdG9yKFxuICAgICAgICB0aGlzLmZpbmREZWNsYXJhdGlvbihBTkdVTEFSX0NPUkUsICdTa2lwU2VsZicpLCBjcmVhdGVTa2lwU2VsZik7XG4gICAgdGhpcy5fcmVnaXN0ZXJEZWNvcmF0b3JPckNvbnN0cnVjdG9yKFxuICAgICAgICB0aGlzLmZpbmREZWNsYXJhdGlvbihBTkdVTEFSX0NPUkUsICdPcHRpb25hbCcpLCBjcmVhdGVPcHRpb25hbCk7XG4gIH1cblxuICAvKipcbiAgICogZ2V0U3RhdGljU3ltYm9sIHByb2R1Y2VzIGEgVHlwZSB3aG9zZSBtZXRhZGF0YSBpcyBrbm93biBidXQgd2hvc2UgaW1wbGVtZW50YXRpb24gaXMgbm90IGxvYWRlZC5cbiAgICogQWxsIHR5cGVzIHBhc3NlZCB0byB0aGUgU3RhdGljUmVzb2x2ZXIgc2hvdWxkIGJlIHBzZXVkby10eXBlcyByZXR1cm5lZCBieSB0aGlzIG1ldGhvZC5cbiAgICpcbiAgICogQHBhcmFtIGRlY2xhcmF0aW9uRmlsZSB0aGUgYWJzb2x1dGUgcGF0aCBvZiB0aGUgZmlsZSB3aGVyZSB0aGUgc3ltYm9sIGlzIGRlY2xhcmVkXG4gICAqIEBwYXJhbSBuYW1lIHRoZSBuYW1lIG9mIHRoZSB0eXBlLlxuICAgKi9cbiAgZ2V0U3RhdGljU3ltYm9sKGRlY2xhcmF0aW9uRmlsZTogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIG1lbWJlcnM/OiBzdHJpbmdbXSk6IFN0YXRpY1N5bWJvbCB7XG4gICAgcmV0dXJuIHRoaXMuc3ltYm9sUmVzb2x2ZXIuZ2V0U3RhdGljU3ltYm9sKGRlY2xhcmF0aW9uRmlsZSwgbmFtZSwgbWVtYmVycyk7XG4gIH1cblxuICAvKipcbiAgICogU2ltcGxpZnkgYnV0IGRpc2NhcmQgYW55IGVycm9yc1xuICAgKi9cbiAgcHJpdmF0ZSB0cnlTaW1wbGlmeShjb250ZXh0OiBTdGF0aWNTeW1ib2wsIHZhbHVlOiBhbnkpOiBhbnkge1xuICAgIGNvbnN0IG9yaWdpbmFsUmVjb3JkZXIgPSB0aGlzLmVycm9yUmVjb3JkZXI7XG4gICAgdGhpcy5lcnJvclJlY29yZGVyID0gKGVycm9yOiBhbnksIGZpbGVOYW1lOiBzdHJpbmcpID0+IHt9O1xuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuc2ltcGxpZnkoY29udGV4dCwgdmFsdWUpO1xuICAgIHRoaXMuZXJyb3JSZWNvcmRlciA9IG9yaWdpbmFsUmVjb3JkZXI7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgcHVibGljIHNpbXBsaWZ5KGNvbnRleHQ6IFN0YXRpY1N5bWJvbCwgdmFsdWU6IGFueSwgbGF6eTogYm9vbGVhbiA9IGZhbHNlKTogYW55IHtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICBsZXQgc2NvcGUgPSBCaW5kaW5nU2NvcGUuZW1wdHk7XG4gICAgY29uc3QgY2FsbGluZyA9IG5ldyBNYXA8U3RhdGljU3ltYm9sLCBib29sZWFuPigpO1xuICAgIGNvbnN0IHJvb3RDb250ZXh0ID0gY29udGV4dDtcblxuICAgIGZ1bmN0aW9uIHNpbXBsaWZ5SW5Db250ZXh0KFxuICAgICAgICBjb250ZXh0OiBTdGF0aWNTeW1ib2wsIHZhbHVlOiBhbnksIGRlcHRoOiBudW1iZXIsIHJlZmVyZW5jZXM6IG51bWJlcik6IGFueSB7XG4gICAgICBmdW5jdGlvbiByZXNvbHZlUmVmZXJlbmNlVmFsdWUoc3RhdGljU3ltYm9sOiBTdGF0aWNTeW1ib2wpOiBhbnkge1xuICAgICAgICBjb25zdCByZXNvbHZlZFN5bWJvbCA9IHNlbGYuc3ltYm9sUmVzb2x2ZXIucmVzb2x2ZVN5bWJvbChzdGF0aWNTeW1ib2wpO1xuICAgICAgICByZXR1cm4gcmVzb2x2ZWRTeW1ib2wgPyByZXNvbHZlZFN5bWJvbC5tZXRhZGF0YSA6IG51bGw7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHNpbXBsaWZ5RWFnZXJseSh2YWx1ZTogYW55KTogYW55IHtcbiAgICAgICAgcmV0dXJuIHNpbXBsaWZ5SW5Db250ZXh0KGNvbnRleHQsIHZhbHVlLCBkZXB0aCwgMCk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHNpbXBsaWZ5TGF6aWx5KHZhbHVlOiBhbnkpOiBhbnkge1xuICAgICAgICByZXR1cm4gc2ltcGxpZnlJbkNvbnRleHQoY29udGV4dCwgdmFsdWUsIGRlcHRoLCByZWZlcmVuY2VzICsgMSk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHNpbXBsaWZ5TmVzdGVkKG5lc3RlZENvbnRleHQ6IFN0YXRpY1N5bWJvbCwgdmFsdWU6IGFueSk6IGFueSB7XG4gICAgICAgIGlmIChuZXN0ZWRDb250ZXh0ID09PSBjb250ZXh0KSB7XG4gICAgICAgICAgLy8gSWYgdGhlIGNvbnRleHQgaGFzbid0IGNoYW5nZWQgbGV0IHRoZSBleGNlcHRpb24gcHJvcGFnYXRlIHVubW9kaWZpZWQuXG4gICAgICAgICAgcmV0dXJuIHNpbXBsaWZ5SW5Db250ZXh0KG5lc3RlZENvbnRleHQsIHZhbHVlLCBkZXB0aCArIDEsIHJlZmVyZW5jZXMpO1xuICAgICAgICB9XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIHNpbXBsaWZ5SW5Db250ZXh0KG5lc3RlZENvbnRleHQsIHZhbHVlLCBkZXB0aCArIDEsIHJlZmVyZW5jZXMpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgaWYgKGlzTWV0YWRhdGFFcnJvcihlKSkge1xuICAgICAgICAgICAgLy8gUHJvcGFnYXRlIHRoZSBtZXNzYWdlIHRleHQgdXAgYnV0IGFkZCBhIG1lc3NhZ2UgdG8gdGhlIGNoYWluIHRoYXQgZXhwbGFpbnMgaG93IHdlIGdvdFxuICAgICAgICAgICAgLy8gaGVyZS5cbiAgICAgICAgICAgIC8vIGUuY2hhaW4gaW1wbGllcyBlLnN5bWJvbFxuICAgICAgICAgICAgY29uc3Qgc3VtbWFyeU1zZyA9IGUuY2hhaW4gPyAncmVmZXJlbmNlcyBcXCcnICsgZS5zeW1ib2wgIS5uYW1lICsgJ1xcJycgOiBlcnJvclN1bW1hcnkoZSk7XG4gICAgICAgICAgICBjb25zdCBzdW1tYXJ5ID0gYCcke25lc3RlZENvbnRleHQubmFtZX0nICR7c3VtbWFyeU1zZ31gO1xuICAgICAgICAgICAgY29uc3QgY2hhaW4gPSB7bWVzc2FnZTogc3VtbWFyeSwgcG9zaXRpb246IGUucG9zaXRpb24sIG5leHQ6IGUuY2hhaW59O1xuICAgICAgICAgICAgLy8gVE9ETyhjaHVja2opOiByZXRyaWV2ZSB0aGUgcG9zaXRpb24gaW5mb3JtYXRpb24gaW5kaXJlY3RseSBmcm9tIHRoZSBjb2xsZWN0b3JzIG5vZGVcbiAgICAgICAgICAgIC8vIG1hcCBpZiB0aGUgbWV0YWRhdGEgaXMgZnJvbSBhIC50cyBmaWxlLlxuICAgICAgICAgICAgc2VsZi5lcnJvcihcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBtZXNzYWdlOiBlLm1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgICBhZHZpc2U6IGUuYWR2aXNlLFxuICAgICAgICAgICAgICAgICAgY29udGV4dDogZS5jb250ZXh0LCBjaGFpbixcbiAgICAgICAgICAgICAgICAgIHN5bWJvbDogbmVzdGVkQ29udGV4dFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgY29udGV4dCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIEl0IGlzIHByb2JhYmx5IGFuIGludGVybmFsIGVycm9yLlxuICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gc2ltcGxpZnlDYWxsKFxuICAgICAgICAgIGZ1bmN0aW9uU3ltYm9sOiBTdGF0aWNTeW1ib2wsIHRhcmdldEZ1bmN0aW9uOiBhbnksIGFyZ3M6IGFueVtdLCB0YXJnZXRFeHByZXNzaW9uOiBhbnkpIHtcbiAgICAgICAgaWYgKHRhcmdldEZ1bmN0aW9uICYmIHRhcmdldEZ1bmN0aW9uWydfX3N5bWJvbGljJ10gPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIGlmIChjYWxsaW5nLmdldChmdW5jdGlvblN5bWJvbCkpIHtcbiAgICAgICAgICAgIHNlbGYuZXJyb3IoXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ1JlY3Vyc2lvbiBpcyBub3Qgc3VwcG9ydGVkJyxcbiAgICAgICAgICAgICAgICAgIHN1bW1hcnk6IGBjYWxsZWQgJyR7ZnVuY3Rpb25TeW1ib2wubmFtZX0nIHJlY3Vyc2l2ZWx5YCxcbiAgICAgICAgICAgICAgICAgIHZhbHVlOiB0YXJnZXRGdW5jdGlvblxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZnVuY3Rpb25TeW1ib2wpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSB0YXJnZXRGdW5jdGlvblsndmFsdWUnXTtcbiAgICAgICAgICAgIGlmICh2YWx1ZSAmJiAoZGVwdGggIT0gMCB8fCB2YWx1ZS5fX3N5bWJvbGljICE9ICdlcnJvcicpKSB7XG4gICAgICAgICAgICAgIGNvbnN0IHBhcmFtZXRlcnM6IHN0cmluZ1tdID0gdGFyZ2V0RnVuY3Rpb25bJ3BhcmFtZXRlcnMnXTtcbiAgICAgICAgICAgICAgY29uc3QgZGVmYXVsdHM6IGFueVtdID0gdGFyZ2V0RnVuY3Rpb24uZGVmYXVsdHM7XG4gICAgICAgICAgICAgIGFyZ3MgPSBhcmdzLm1hcChhcmcgPT4gc2ltcGxpZnlOZXN0ZWQoY29udGV4dCwgYXJnKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAubWFwKGFyZyA9PiBzaG91bGRJZ25vcmUoYXJnKSA/IHVuZGVmaW5lZCA6IGFyZyk7XG4gICAgICAgICAgICAgIGlmIChkZWZhdWx0cyAmJiBkZWZhdWx0cy5sZW5ndGggPiBhcmdzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGFyZ3MucHVzaCguLi5kZWZhdWx0cy5zbGljZShhcmdzLmxlbmd0aCkubWFwKCh2YWx1ZTogYW55KSA9PiBzaW1wbGlmeSh2YWx1ZSkpKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjYWxsaW5nLnNldChmdW5jdGlvblN5bWJvbCwgdHJ1ZSk7XG4gICAgICAgICAgICAgIGNvbnN0IGZ1bmN0aW9uU2NvcGUgPSBCaW5kaW5nU2NvcGUuYnVpbGQoKTtcbiAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXJhbWV0ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgZnVuY3Rpb25TY29wZS5kZWZpbmUocGFyYW1ldGVyc1tpXSwgYXJnc1tpXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY29uc3Qgb2xkU2NvcGUgPSBzY29wZTtcbiAgICAgICAgICAgICAgbGV0IHJlc3VsdDogYW55O1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHNjb3BlID0gZnVuY3Rpb25TY29wZS5kb25lKCk7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gc2ltcGxpZnlOZXN0ZWQoZnVuY3Rpb25TeW1ib2wsIHZhbHVlKTtcbiAgICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICBzY29wZSA9IG9sZFNjb3BlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIGNhbGxpbmcuZGVsZXRlKGZ1bmN0aW9uU3ltYm9sKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGVwdGggPT09IDApIHtcbiAgICAgICAgICAvLyBJZiBkZXB0aCBpcyAwIHdlIGFyZSBldmFsdWF0aW5nIHRoZSB0b3AgbGV2ZWwgZXhwcmVzc2lvbiB0aGF0IGlzIGRlc2NyaWJpbmcgZWxlbWVudFxuICAgICAgICAgIC8vIGRlY29yYXRvci4gSW4gdGhpcyBjYXNlLCBpdCBpcyBhIGRlY29yYXRvciB3ZSBkb24ndCB1bmRlcnN0YW5kLCBzdWNoIGFzIGEgY3VzdG9tXG4gICAgICAgICAgLy8gbm9uLWFuZ3VsYXIgZGVjb3JhdG9yLCBhbmQgd2Ugc2hvdWxkIGp1c3QgaWdub3JlIGl0LlxuICAgICAgICAgIHJldHVybiBJR05PUkU7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHBvc2l0aW9uOiBQb3NpdGlvbnx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgICAgIGlmICh0YXJnZXRFeHByZXNzaW9uICYmIHRhcmdldEV4cHJlc3Npb24uX19zeW1ib2xpYyA9PSAncmVzb2x2ZWQnKSB7XG4gICAgICAgICAgY29uc3QgbGluZSA9IHRhcmdldEV4cHJlc3Npb24ubGluZTtcbiAgICAgICAgICBjb25zdCBjaGFyYWN0ZXIgPSB0YXJnZXRFeHByZXNzaW9uLmNoYXJhY3RlcjtcbiAgICAgICAgICBjb25zdCBmaWxlTmFtZSA9IHRhcmdldEV4cHJlc3Npb24uZmlsZU5hbWU7XG4gICAgICAgICAgaWYgKGZpbGVOYW1lICE9IG51bGwgJiYgbGluZSAhPSBudWxsICYmIGNoYXJhY3RlciAhPSBudWxsKSB7XG4gICAgICAgICAgICBwb3NpdGlvbiA9IHtmaWxlTmFtZSwgbGluZSwgY29sdW1uOiBjaGFyYWN0ZXJ9O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBzZWxmLmVycm9yKFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBtZXNzYWdlOiBGVU5DVElPTl9DQUxMX05PVF9TVVBQT1JURUQsXG4gICAgICAgICAgICAgIGNvbnRleHQ6IGZ1bmN0aW9uU3ltYm9sLFxuICAgICAgICAgICAgICB2YWx1ZTogdGFyZ2V0RnVuY3Rpb24sIHBvc2l0aW9uXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29udGV4dCk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHNpbXBsaWZ5KGV4cHJlc3Npb246IGFueSk6IGFueSB7XG4gICAgICAgIGlmIChpc1ByaW1pdGl2ZShleHByZXNzaW9uKSkge1xuICAgICAgICAgIHJldHVybiBleHByZXNzaW9uO1xuICAgICAgICB9XG4gICAgICAgIGlmIChleHByZXNzaW9uIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICBjb25zdCByZXN1bHQ6IGFueVtdID0gW107XG4gICAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mICg8YW55PmV4cHJlc3Npb24pKSB7XG4gICAgICAgICAgICAvLyBDaGVjayBmb3IgYSBzcHJlYWQgZXhwcmVzc2lvblxuICAgICAgICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5fX3N5bWJvbGljID09PSAnc3ByZWFkJykge1xuICAgICAgICAgICAgICAvLyBXZSBjYWxsIHdpdGggcmVmZXJlbmNlcyBhcyAwIGJlY2F1c2Ugd2UgcmVxdWlyZSB0aGUgYWN0dWFsIHZhbHVlIGFuZCBjYW5ub3RcbiAgICAgICAgICAgICAgLy8gdG9sZXJhdGUgYSByZWZlcmVuY2UgaGVyZS5cbiAgICAgICAgICAgICAgY29uc3Qgc3ByZWFkQXJyYXkgPSBzaW1wbGlmeUVhZ2VybHkoaXRlbS5leHByZXNzaW9uKTtcbiAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc3ByZWFkQXJyYXkpKSB7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBzcHJlYWRJdGVtIG9mIHNwcmVhZEFycmF5KSB7XG4gICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChzcHJlYWRJdGVtKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gc2ltcGxpZnkoaXRlbSk7XG4gICAgICAgICAgICBpZiAoc2hvdWxkSWdub3JlKHZhbHVlKSkge1xuICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKHZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZXhwcmVzc2lvbiBpbnN0YW5jZW9mIFN0YXRpY1N5bWJvbCkge1xuICAgICAgICAgIC8vIFN0b3Agc2ltcGxpZmljYXRpb24gYXQgYnVpbHRpbiBzeW1ib2xzIG9yIGlmIHdlIGFyZSBpbiBhIHJlZmVyZW5jZSBjb250ZXh0IGFuZFxuICAgICAgICAgIC8vIHRoZSBzeW1ib2wgZG9lc24ndCBoYXZlIG1lbWJlcnMuXG4gICAgICAgICAgaWYgKGV4cHJlc3Npb24gPT09IHNlbGYuaW5qZWN0aW9uVG9rZW4gfHwgc2VsZi5jb252ZXJzaW9uTWFwLmhhcyhleHByZXNzaW9uKSB8fFxuICAgICAgICAgICAgICAocmVmZXJlbmNlcyA+IDAgJiYgIWV4cHJlc3Npb24ubWVtYmVycy5sZW5ndGgpKSB7XG4gICAgICAgICAgICByZXR1cm4gZXhwcmVzc2lvbjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3Qgc3RhdGljU3ltYm9sID0gZXhwcmVzc2lvbjtcbiAgICAgICAgICAgIGNvbnN0IGRlY2xhcmF0aW9uVmFsdWUgPSByZXNvbHZlUmVmZXJlbmNlVmFsdWUoc3RhdGljU3ltYm9sKTtcbiAgICAgICAgICAgIGlmIChkZWNsYXJhdGlvblZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHNpbXBsaWZ5TmVzdGVkKHN0YXRpY1N5bWJvbCwgZGVjbGFyYXRpb25WYWx1ZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4gc3RhdGljU3ltYm9sO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoZXhwcmVzc2lvbikge1xuICAgICAgICAgIGlmIChleHByZXNzaW9uWydfX3N5bWJvbGljJ10pIHtcbiAgICAgICAgICAgIGxldCBzdGF0aWNTeW1ib2w6IFN0YXRpY1N5bWJvbDtcbiAgICAgICAgICAgIHN3aXRjaCAoZXhwcmVzc2lvblsnX19zeW1ib2xpYyddKSB7XG4gICAgICAgICAgICAgIGNhc2UgJ2Jpbm9wJzpcbiAgICAgICAgICAgICAgICBsZXQgbGVmdCA9IHNpbXBsaWZ5KGV4cHJlc3Npb25bJ2xlZnQnXSk7XG4gICAgICAgICAgICAgICAgaWYgKHNob3VsZElnbm9yZShsZWZ0KSkgcmV0dXJuIGxlZnQ7XG4gICAgICAgICAgICAgICAgbGV0IHJpZ2h0ID0gc2ltcGxpZnkoZXhwcmVzc2lvblsncmlnaHQnXSk7XG4gICAgICAgICAgICAgICAgaWYgKHNob3VsZElnbm9yZShyaWdodCkpIHJldHVybiByaWdodDtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGV4cHJlc3Npb25bJ29wZXJhdG9yJ10pIHtcbiAgICAgICAgICAgICAgICAgIGNhc2UgJyYmJzpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGxlZnQgJiYgcmlnaHQ7XG4gICAgICAgICAgICAgICAgICBjYXNlICd8fCc6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0IHx8IHJpZ2h0O1xuICAgICAgICAgICAgICAgICAgY2FzZSAnfCc6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0IHwgcmlnaHQ7XG4gICAgICAgICAgICAgICAgICBjYXNlICdeJzpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGxlZnQgXiByaWdodDtcbiAgICAgICAgICAgICAgICAgIGNhc2UgJyYnOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbGVmdCAmIHJpZ2h0O1xuICAgICAgICAgICAgICAgICAgY2FzZSAnPT0nOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbGVmdCA9PSByaWdodDtcbiAgICAgICAgICAgICAgICAgIGNhc2UgJyE9JzpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGxlZnQgIT0gcmlnaHQ7XG4gICAgICAgICAgICAgICAgICBjYXNlICc9PT0nOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbGVmdCA9PT0gcmlnaHQ7XG4gICAgICAgICAgICAgICAgICBjYXNlICchPT0nOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbGVmdCAhPT0gcmlnaHQ7XG4gICAgICAgICAgICAgICAgICBjYXNlICc8JzpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGxlZnQgPCByaWdodDtcbiAgICAgICAgICAgICAgICAgIGNhc2UgJz4nOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbGVmdCA+IHJpZ2h0O1xuICAgICAgICAgICAgICAgICAgY2FzZSAnPD0nOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbGVmdCA8PSByaWdodDtcbiAgICAgICAgICAgICAgICAgIGNhc2UgJz49JzpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGxlZnQgPj0gcmlnaHQ7XG4gICAgICAgICAgICAgICAgICBjYXNlICc8PCc6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0IDw8IHJpZ2h0O1xuICAgICAgICAgICAgICAgICAgY2FzZSAnPj4nOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbGVmdCA+PiByaWdodDtcbiAgICAgICAgICAgICAgICAgIGNhc2UgJysnOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbGVmdCArIHJpZ2h0O1xuICAgICAgICAgICAgICAgICAgY2FzZSAnLSc6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0IC0gcmlnaHQ7XG4gICAgICAgICAgICAgICAgICBjYXNlICcqJzpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGxlZnQgKiByaWdodDtcbiAgICAgICAgICAgICAgICAgIGNhc2UgJy8nOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbGVmdCAvIHJpZ2h0O1xuICAgICAgICAgICAgICAgICAgY2FzZSAnJSc6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0ICUgcmlnaHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICBjYXNlICdpZic6XG4gICAgICAgICAgICAgICAgbGV0IGNvbmRpdGlvbiA9IHNpbXBsaWZ5KGV4cHJlc3Npb25bJ2NvbmRpdGlvbiddKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29uZGl0aW9uID8gc2ltcGxpZnkoZXhwcmVzc2lvblsndGhlbkV4cHJlc3Npb24nXSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaW1wbGlmeShleHByZXNzaW9uWydlbHNlRXhwcmVzc2lvbiddKTtcbiAgICAgICAgICAgICAgY2FzZSAncHJlJzpcbiAgICAgICAgICAgICAgICBsZXQgb3BlcmFuZCA9IHNpbXBsaWZ5KGV4cHJlc3Npb25bJ29wZXJhbmQnXSk7XG4gICAgICAgICAgICAgICAgaWYgKHNob3VsZElnbm9yZShvcGVyYW5kKSkgcmV0dXJuIG9wZXJhbmQ7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChleHByZXNzaW9uWydvcGVyYXRvciddKSB7XG4gICAgICAgICAgICAgICAgICBjYXNlICcrJzpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9wZXJhbmQ7XG4gICAgICAgICAgICAgICAgICBjYXNlICctJzpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC1vcGVyYW5kO1xuICAgICAgICAgICAgICAgICAgY2FzZSAnISc6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAhb3BlcmFuZDtcbiAgICAgICAgICAgICAgICAgIGNhc2UgJ34nOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gfm9wZXJhbmQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICBjYXNlICdpbmRleCc6XG4gICAgICAgICAgICAgICAgbGV0IGluZGV4VGFyZ2V0ID0gc2ltcGxpZnlFYWdlcmx5KGV4cHJlc3Npb25bJ2V4cHJlc3Npb24nXSk7XG4gICAgICAgICAgICAgICAgbGV0IGluZGV4ID0gc2ltcGxpZnlFYWdlcmx5KGV4cHJlc3Npb25bJ2luZGV4J10pO1xuICAgICAgICAgICAgICAgIGlmIChpbmRleFRhcmdldCAmJiBpc1ByaW1pdGl2ZShpbmRleCkpIHJldHVybiBpbmRleFRhcmdldFtpbmRleF07XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgIGNhc2UgJ3NlbGVjdCc6XG4gICAgICAgICAgICAgICAgY29uc3QgbWVtYmVyID0gZXhwcmVzc2lvblsnbWVtYmVyJ107XG4gICAgICAgICAgICAgICAgbGV0IHNlbGVjdENvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICAgICAgICAgIGxldCBzZWxlY3RUYXJnZXQgPSBzaW1wbGlmeShleHByZXNzaW9uWydleHByZXNzaW9uJ10pO1xuICAgICAgICAgICAgICAgIGlmIChzZWxlY3RUYXJnZXQgaW5zdGFuY2VvZiBTdGF0aWNTeW1ib2wpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IG1lbWJlcnMgPSBzZWxlY3RUYXJnZXQubWVtYmVycy5jb25jYXQobWVtYmVyKTtcbiAgICAgICAgICAgICAgICAgIHNlbGVjdENvbnRleHQgPVxuICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZ2V0U3RhdGljU3ltYm9sKHNlbGVjdFRhcmdldC5maWxlUGF0aCwgc2VsZWN0VGFyZ2V0Lm5hbWUsIG1lbWJlcnMpO1xuICAgICAgICAgICAgICAgICAgY29uc3QgZGVjbGFyYXRpb25WYWx1ZSA9IHJlc29sdmVSZWZlcmVuY2VWYWx1ZShzZWxlY3RDb250ZXh0KTtcbiAgICAgICAgICAgICAgICAgIGlmIChkZWNsYXJhdGlvblZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNpbXBsaWZ5TmVzdGVkKHNlbGVjdENvbnRleHQsIGRlY2xhcmF0aW9uVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlbGVjdENvbnRleHQ7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChzZWxlY3RUYXJnZXQgJiYgaXNQcmltaXRpdmUobWVtYmVyKSlcbiAgICAgICAgICAgICAgICAgIHJldHVybiBzaW1wbGlmeU5lc3RlZChzZWxlY3RDb250ZXh0LCBzZWxlY3RUYXJnZXRbbWVtYmVyXSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgIGNhc2UgJ3JlZmVyZW5jZSc6XG4gICAgICAgICAgICAgICAgLy8gTm90ZTogVGhpcyBvbmx5IGhhcyB0byBkZWFsIHdpdGggdmFyaWFibGUgcmVmZXJlbmNlcywgYXMgc3ltYm9sIHJlZmVyZW5jZXMgaGF2ZVxuICAgICAgICAgICAgICAgIC8vIGJlZW4gY29udmVydGVkIGludG8gJ3Jlc29sdmVkJ1xuICAgICAgICAgICAgICAgIC8vIGluIHRoZSBTdGF0aWNTeW1ib2xSZXNvbHZlci5cbiAgICAgICAgICAgICAgICBjb25zdCBuYW1lOiBzdHJpbmcgPSBleHByZXNzaW9uWyduYW1lJ107XG4gICAgICAgICAgICAgICAgY29uc3QgbG9jYWxWYWx1ZSA9IHNjb3BlLnJlc29sdmUobmFtZSk7XG4gICAgICAgICAgICAgICAgaWYgKGxvY2FsVmFsdWUgIT0gQmluZGluZ1Njb3BlLm1pc3NpbmcpIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBsb2NhbFZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSAncmVzb2x2ZWQnOlxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gc2ltcGxpZnkoZXhwcmVzc2lvbi5zeW1ib2wpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgIC8vIElmIGFuIGVycm9yIGlzIHJlcG9ydGVkIGV2YWx1YXRpbmcgdGhlIHN5bWJvbCByZWNvcmQgdGhlIHBvc2l0aW9uIG9mIHRoZVxuICAgICAgICAgICAgICAgICAgLy8gcmVmZXJlbmNlIGluIHRoZSBlcnJvciBzbyBpdCBjYW5cbiAgICAgICAgICAgICAgICAgIC8vIGJlIHJlcG9ydGVkIGluIHRoZSBlcnJvciBtZXNzYWdlIGdlbmVyYXRlZCBmcm9tIHRoZSBleGNlcHRpb24uXG4gICAgICAgICAgICAgICAgICBpZiAoaXNNZXRhZGF0YUVycm9yKGUpICYmIGV4cHJlc3Npb24uZmlsZU5hbWUgIT0gbnVsbCAmJlxuICAgICAgICAgICAgICAgICAgICAgIGV4cHJlc3Npb24ubGluZSAhPSBudWxsICYmIGV4cHJlc3Npb24uY2hhcmFjdGVyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgZS5wb3NpdGlvbiA9IHtcbiAgICAgICAgICAgICAgICAgICAgICBmaWxlTmFtZTogZXhwcmVzc2lvbi5maWxlTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICBsaW5lOiBleHByZXNzaW9uLmxpbmUsXG4gICAgICAgICAgICAgICAgICAgICAgY29sdW1uOiBleHByZXNzaW9uLmNoYXJhY3RlclxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGNhc2UgJ2NsYXNzJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dDtcbiAgICAgICAgICAgICAgY2FzZSAnZnVuY3Rpb24nOlxuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0O1xuICAgICAgICAgICAgICBjYXNlICduZXcnOlxuICAgICAgICAgICAgICBjYXNlICdjYWxsJzpcbiAgICAgICAgICAgICAgICAvLyBEZXRlcm1pbmUgaWYgdGhlIGZ1bmN0aW9uIGlzIGEgYnVpbHQtaW4gY29udmVyc2lvblxuICAgICAgICAgICAgICAgIHN0YXRpY1N5bWJvbCA9IHNpbXBsaWZ5SW5Db250ZXh0KFxuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LCBleHByZXNzaW9uWydleHByZXNzaW9uJ10sIGRlcHRoICsgMSwgLyogcmVmZXJlbmNlcyAqLyAwKTtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGljU3ltYm9sIGluc3RhbmNlb2YgU3RhdGljU3ltYm9sKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoc3RhdGljU3ltYm9sID09PSBzZWxmLmluamVjdGlvblRva2VuIHx8IHN0YXRpY1N5bWJvbCA9PT0gc2VsZi5vcGFxdWVUb2tlbikge1xuICAgICAgICAgICAgICAgICAgICAvLyBpZiBzb21lYm9keSBjYWxscyBuZXcgSW5qZWN0aW9uVG9rZW4sIGRvbid0IGNyZWF0ZSBhbiBJbmplY3Rpb25Ub2tlbixcbiAgICAgICAgICAgICAgICAgICAgLy8gYnV0IHJhdGhlciByZXR1cm4gdGhlIHN5bWJvbCB0byB3aGljaCB0aGUgSW5qZWN0aW9uVG9rZW4gaXMgYXNzaWduZWQgdG8uXG5cbiAgICAgICAgICAgICAgICAgICAgLy8gT3BhcXVlVG9rZW4gaXMgc3VwcG9ydGVkIHRvbyBhcyBpdCBpcyByZXF1aXJlZCBieSB0aGUgbGFuZ3VhZ2Ugc2VydmljZSB0b1xuICAgICAgICAgICAgICAgICAgICAvLyBzdXBwb3J0IHY0IGFuZCBwcmlvciB2ZXJzaW9ucyBvZiBBbmd1bGFyLlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dDtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIGNvbnN0IGFyZ0V4cHJlc3Npb25zOiBhbnlbXSA9IGV4cHJlc3Npb25bJ2FyZ3VtZW50cyddIHx8IFtdO1xuICAgICAgICAgICAgICAgICAgbGV0IGNvbnZlcnRlciA9IHNlbGYuY29udmVyc2lvbk1hcC5nZXQoc3RhdGljU3ltYm9sKTtcbiAgICAgICAgICAgICAgICAgIGlmIChjb252ZXJ0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXJncyA9IGFyZ0V4cHJlc3Npb25zLm1hcChhcmcgPT4gc2ltcGxpZnlOZXN0ZWQoY29udGV4dCwgYXJnKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAubWFwKGFyZyA9PiBzaG91bGRJZ25vcmUoYXJnKSA/IHVuZGVmaW5lZCA6IGFyZyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjb252ZXJ0ZXIoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBEZXRlcm1pbmUgaWYgdGhlIGZ1bmN0aW9uIGlzIG9uZSB3ZSBjYW4gc2ltcGxpZnkuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldEZ1bmN0aW9uID0gcmVzb2x2ZVJlZmVyZW5jZVZhbHVlKHN0YXRpY1N5bWJvbCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzaW1wbGlmeUNhbGwoXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0aWNTeW1ib2wsIHRhcmdldEZ1bmN0aW9uLCBhcmdFeHByZXNzaW9ucywgZXhwcmVzc2lvblsnZXhwcmVzc2lvbiddKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIElHTk9SRTtcbiAgICAgICAgICAgICAgY2FzZSAnZXJyb3InOlxuICAgICAgICAgICAgICAgIGxldCBtZXNzYWdlID0gZXhwcmVzc2lvbi5tZXNzYWdlO1xuICAgICAgICAgICAgICAgIGlmIChleHByZXNzaW9uWydsaW5lJ10gIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgc2VsZi5lcnJvcihcbiAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dDogZXhwcmVzc2lvbi5jb250ZXh0LFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGV4cHJlc3Npb24sXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlTmFtZTogZXhwcmVzc2lvblsnZmlsZU5hbWUnXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZTogZXhwcmVzc2lvblsnbGluZSddLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBjb2x1bW46IGV4cHJlc3Npb25bJ2NoYXJhY3RlciddXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgc2VsZi5lcnJvcih7bWVzc2FnZSwgY29udGV4dDogZXhwcmVzc2lvbi5jb250ZXh0fSwgY29udGV4dCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBJR05PUkU7XG4gICAgICAgICAgICAgIGNhc2UgJ2lnbm9yZSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGV4cHJlc3Npb247XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG1hcFN0cmluZ01hcChleHByZXNzaW9uLCAodmFsdWUsIG5hbWUpID0+IHtcbiAgICAgICAgICAgIGlmIChSRUZFUkVOQ0VfU0VULmhhcyhuYW1lKSkge1xuICAgICAgICAgICAgICBpZiAobmFtZSA9PT0gVVNFX1ZBTFVFICYmIFBST1ZJREUgaW4gZXhwcmVzc2lvbikge1xuICAgICAgICAgICAgICAgIC8vIElmIHRoaXMgaXMgYSBwcm92aWRlciBleHByZXNzaW9uLCBjaGVjayBmb3Igc3BlY2lhbCB0b2tlbnMgdGhhdCBuZWVkIHRoZSB2YWx1ZVxuICAgICAgICAgICAgICAgIC8vIGR1cmluZyBhbmFseXNpcy5cbiAgICAgICAgICAgICAgICBjb25zdCBwcm92aWRlID0gc2ltcGxpZnkoZXhwcmVzc2lvbi5wcm92aWRlKTtcbiAgICAgICAgICAgICAgICBpZiAocHJvdmlkZSA9PT0gc2VsZi5ST1VURVMgfHwgcHJvdmlkZSA9PSBzZWxmLkFOQUxZWkVfRk9SX0VOVFJZX0NPTVBPTkVOVFMpIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBzaW1wbGlmeSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiBzaW1wbGlmeUxhemlseSh2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc2ltcGxpZnkodmFsdWUpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBJR05PUkU7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzaW1wbGlmeSh2YWx1ZSk7XG4gICAgfVxuXG4gICAgbGV0IHJlc3VsdDogYW55O1xuICAgIHRyeSB7XG4gICAgICByZXN1bHQgPSBzaW1wbGlmeUluQ29udGV4dChjb250ZXh0LCB2YWx1ZSwgMCwgbGF6eSA/IDEgOiAwKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAodGhpcy5lcnJvclJlY29yZGVyKSB7XG4gICAgICAgIHRoaXMucmVwb3J0RXJyb3IoZSwgY29udGV4dCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBmb3JtYXRNZXRhZGF0YUVycm9yKGUsIGNvbnRleHQpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoc2hvdWxkSWdub3JlKHJlc3VsdCkpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBwcml2YXRlIGdldFR5cGVNZXRhZGF0YSh0eXBlOiBTdGF0aWNTeW1ib2wpOiB7W2tleTogc3RyaW5nXTogYW55fSB7XG4gICAgY29uc3QgcmVzb2x2ZWRTeW1ib2wgPSB0aGlzLnN5bWJvbFJlc29sdmVyLnJlc29sdmVTeW1ib2wodHlwZSk7XG4gICAgcmV0dXJuIHJlc29sdmVkU3ltYm9sICYmIHJlc29sdmVkU3ltYm9sLm1ldGFkYXRhID8gcmVzb2x2ZWRTeW1ib2wubWV0YWRhdGEgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtfX3N5bWJvbGljOiAnY2xhc3MnfTtcbiAgfVxuXG4gIHByaXZhdGUgcmVwb3J0RXJyb3IoZXJyb3I6IEVycm9yLCBjb250ZXh0OiBTdGF0aWNTeW1ib2wsIHBhdGg/OiBzdHJpbmcpIHtcbiAgICBpZiAodGhpcy5lcnJvclJlY29yZGVyKSB7XG4gICAgICB0aGlzLmVycm9yUmVjb3JkZXIoXG4gICAgICAgICAgZm9ybWF0TWV0YWRhdGFFcnJvcihlcnJvciwgY29udGV4dCksIChjb250ZXh0ICYmIGNvbnRleHQuZmlsZVBhdGgpIHx8IHBhdGgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGVycm9yKFxuICAgICAge21lc3NhZ2UsIHN1bW1hcnksIGFkdmlzZSwgcG9zaXRpb24sIGNvbnRleHQsIHZhbHVlLCBzeW1ib2wsIGNoYWlufToge1xuICAgICAgICBtZXNzYWdlOiBzdHJpbmcsXG4gICAgICAgIHN1bW1hcnk/OiBzdHJpbmcsXG4gICAgICAgIGFkdmlzZT86IHN0cmluZyxcbiAgICAgICAgcG9zaXRpb24/OiBQb3NpdGlvbixcbiAgICAgICAgY29udGV4dD86IGFueSxcbiAgICAgICAgdmFsdWU/OiBhbnksXG4gICAgICAgIHN5bWJvbD86IFN0YXRpY1N5bWJvbCxcbiAgICAgICAgY2hhaW4/OiBNZXRhZGF0YU1lc3NhZ2VDaGFpblxuICAgICAgfSxcbiAgICAgIHJlcG9ydGluZ0NvbnRleHQ6IFN0YXRpY1N5bWJvbCkge1xuICAgIHRoaXMucmVwb3J0RXJyb3IoXG4gICAgICAgIG1ldGFkYXRhRXJyb3IobWVzc2FnZSwgc3VtbWFyeSwgYWR2aXNlLCBwb3NpdGlvbiwgc3ltYm9sLCBjb250ZXh0LCBjaGFpbiksXG4gICAgICAgIHJlcG9ydGluZ0NvbnRleHQpO1xuICB9XG59XG5cbmludGVyZmFjZSBQb3NpdGlvbiB7XG4gIGZpbGVOYW1lOiBzdHJpbmc7XG4gIGxpbmU6IG51bWJlcjtcbiAgY29sdW1uOiBudW1iZXI7XG59XG5cbmludGVyZmFjZSBNZXRhZGF0YU1lc3NhZ2VDaGFpbiB7XG4gIG1lc3NhZ2U6IHN0cmluZztcbiAgc3VtbWFyeT86IHN0cmluZztcbiAgcG9zaXRpb24/OiBQb3NpdGlvbjtcbiAgY29udGV4dD86IGFueTtcbiAgc3ltYm9sPzogU3RhdGljU3ltYm9sO1xuICBuZXh0PzogTWV0YWRhdGFNZXNzYWdlQ2hhaW47XG59XG5cbnR5cGUgTWV0YWRhdGFFcnJvciA9IEVycm9yICYge1xuICBwb3NpdGlvbj86IFBvc2l0aW9uO1xuICBhZHZpc2U/OiBzdHJpbmc7XG4gIHN1bW1hcnk/OiBzdHJpbmc7XG4gIGNvbnRleHQ/OiBhbnk7XG4gIHN5bWJvbD86IFN0YXRpY1N5bWJvbDtcbiAgY2hhaW4/OiBNZXRhZGF0YU1lc3NhZ2VDaGFpbjtcbn07XG5cbmNvbnN0IE1FVEFEQVRBX0VSUk9SID0gJ25nTWV0YWRhdGFFcnJvcic7XG5cbmZ1bmN0aW9uIG1ldGFkYXRhRXJyb3IoXG4gICAgbWVzc2FnZTogc3RyaW5nLCBzdW1tYXJ5Pzogc3RyaW5nLCBhZHZpc2U/OiBzdHJpbmcsIHBvc2l0aW9uPzogUG9zaXRpb24sIHN5bWJvbD86IFN0YXRpY1N5bWJvbCxcbiAgICBjb250ZXh0PzogYW55LCBjaGFpbj86IE1ldGFkYXRhTWVzc2FnZUNoYWluKTogTWV0YWRhdGFFcnJvciB7XG4gIGNvbnN0IGVycm9yID0gc3ludGF4RXJyb3IobWVzc2FnZSkgYXMgTWV0YWRhdGFFcnJvcjtcbiAgKGVycm9yIGFzIGFueSlbTUVUQURBVEFfRVJST1JdID0gdHJ1ZTtcbiAgaWYgKGFkdmlzZSkgZXJyb3IuYWR2aXNlID0gYWR2aXNlO1xuICBpZiAocG9zaXRpb24pIGVycm9yLnBvc2l0aW9uID0gcG9zaXRpb247XG4gIGlmIChzdW1tYXJ5KSBlcnJvci5zdW1tYXJ5ID0gc3VtbWFyeTtcbiAgaWYgKGNvbnRleHQpIGVycm9yLmNvbnRleHQgPSBjb250ZXh0O1xuICBpZiAoY2hhaW4pIGVycm9yLmNoYWluID0gY2hhaW47XG4gIGlmIChzeW1ib2wpIGVycm9yLnN5bWJvbCA9IHN5bWJvbDtcbiAgcmV0dXJuIGVycm9yO1xufVxuXG5mdW5jdGlvbiBpc01ldGFkYXRhRXJyb3IoZXJyb3I6IEVycm9yKTogZXJyb3IgaXMgTWV0YWRhdGFFcnJvciB7XG4gIHJldHVybiAhIShlcnJvciBhcyBhbnkpW01FVEFEQVRBX0VSUk9SXTtcbn1cblxuY29uc3QgUkVGRVJFTkNFX1RPX05PTkVYUE9SVEVEX0NMQVNTID0gJ1JlZmVyZW5jZSB0byBub24tZXhwb3J0ZWQgY2xhc3MnO1xuY29uc3QgVkFSSUFCTEVfTk9UX0lOSVRJQUxJWkVEID0gJ1ZhcmlhYmxlIG5vdCBpbml0aWFsaXplZCc7XG5jb25zdCBERVNUUlVDVFVSRV9OT1RfU1VQUE9SVEVEID0gJ0Rlc3RydWN0dXJpbmcgbm90IHN1cHBvcnRlZCc7XG5jb25zdCBDT1VMRF9OT1RfUkVTT0xWRV9UWVBFID0gJ0NvdWxkIG5vdCByZXNvbHZlIHR5cGUnO1xuY29uc3QgRlVOQ1RJT05fQ0FMTF9OT1RfU1VQUE9SVEVEID0gJ0Z1bmN0aW9uIGNhbGwgbm90IHN1cHBvcnRlZCc7XG5jb25zdCBSRUZFUkVOQ0VfVE9fTE9DQUxfU1lNQk9MID0gJ1JlZmVyZW5jZSB0byBhIGxvY2FsIHN5bWJvbCc7XG5jb25zdCBMQU1CREFfTk9UX1NVUFBPUlRFRCA9ICdMYW1iZGEgbm90IHN1cHBvcnRlZCc7XG5cbmZ1bmN0aW9uIGV4cGFuZGVkTWVzc2FnZShtZXNzYWdlOiBzdHJpbmcsIGNvbnRleHQ6IGFueSk6IHN0cmluZyB7XG4gIHN3aXRjaCAobWVzc2FnZSkge1xuICAgIGNhc2UgUkVGRVJFTkNFX1RPX05PTkVYUE9SVEVEX0NMQVNTOlxuICAgICAgaWYgKGNvbnRleHQgJiYgY29udGV4dC5jbGFzc05hbWUpIHtcbiAgICAgICAgcmV0dXJuIGBSZWZlcmVuY2VzIHRvIGEgbm9uLWV4cG9ydGVkIGNsYXNzIGFyZSBub3Qgc3VwcG9ydGVkIGluIGRlY29yYXRvcnMgYnV0ICR7Y29udGV4dC5jbGFzc05hbWV9IHdhcyByZWZlcmVuY2VkLmA7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlIFZBUklBQkxFX05PVF9JTklUSUFMSVpFRDpcbiAgICAgIHJldHVybiAnT25seSBpbml0aWFsaXplZCB2YXJpYWJsZXMgYW5kIGNvbnN0YW50cyBjYW4gYmUgcmVmZXJlbmNlZCBpbiBkZWNvcmF0b3JzIGJlY2F1c2UgdGhlIHZhbHVlIG9mIHRoaXMgdmFyaWFibGUgaXMgbmVlZGVkIGJ5IHRoZSB0ZW1wbGF0ZSBjb21waWxlcic7XG4gICAgY2FzZSBERVNUUlVDVFVSRV9OT1RfU1VQUE9SVEVEOlxuICAgICAgcmV0dXJuICdSZWZlcmVuY2luZyBhbiBleHBvcnRlZCBkZXN0cnVjdHVyZWQgdmFyaWFibGUgb3IgY29uc3RhbnQgaXMgbm90IHN1cHBvcnRlZCBpbiBkZWNvcmF0b3JzIGFuZCB0aGlzIHZhbHVlIGlzIG5lZWRlZCBieSB0aGUgdGVtcGxhdGUgY29tcGlsZXInO1xuICAgIGNhc2UgQ09VTERfTk9UX1JFU09MVkVfVFlQRTpcbiAgICAgIGlmIChjb250ZXh0ICYmIGNvbnRleHQudHlwZU5hbWUpIHtcbiAgICAgICAgcmV0dXJuIGBDb3VsZCBub3QgcmVzb2x2ZSB0eXBlICR7Y29udGV4dC50eXBlTmFtZX1gO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSBGVU5DVElPTl9DQUxMX05PVF9TVVBQT1JURUQ6XG4gICAgICBpZiAoY29udGV4dCAmJiBjb250ZXh0Lm5hbWUpIHtcbiAgICAgICAgcmV0dXJuIGBGdW5jdGlvbiBjYWxscyBhcmUgbm90IHN1cHBvcnRlZCBpbiBkZWNvcmF0b3JzIGJ1dCAnJHtjb250ZXh0Lm5hbWV9JyB3YXMgY2FsbGVkYDtcbiAgICAgIH1cbiAgICAgIHJldHVybiAnRnVuY3Rpb24gY2FsbHMgYXJlIG5vdCBzdXBwb3J0ZWQgaW4gZGVjb3JhdG9ycyc7XG4gICAgY2FzZSBSRUZFUkVOQ0VfVE9fTE9DQUxfU1lNQk9MOlxuICAgICAgaWYgKGNvbnRleHQgJiYgY29udGV4dC5uYW1lKSB7XG4gICAgICAgIHJldHVybiBgUmVmZXJlbmNlIHRvIGEgbG9jYWwgKG5vbi1leHBvcnRlZCkgc3ltYm9scyBhcmUgbm90IHN1cHBvcnRlZCBpbiBkZWNvcmF0b3JzIGJ1dCAnJHtjb250ZXh0Lm5hbWV9JyB3YXMgcmVmZXJlbmNlZGA7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlIExBTUJEQV9OT1RfU1VQUE9SVEVEOlxuICAgICAgcmV0dXJuIGBGdW5jdGlvbiBleHByZXNzaW9ucyBhcmUgbm90IHN1cHBvcnRlZCBpbiBkZWNvcmF0b3JzYDtcbiAgfVxuICByZXR1cm4gbWVzc2FnZTtcbn1cblxuZnVuY3Rpb24gbWVzc2FnZUFkdmlzZShtZXNzYWdlOiBzdHJpbmcsIGNvbnRleHQ6IGFueSk6IHN0cmluZ3x1bmRlZmluZWQge1xuICBzd2l0Y2ggKG1lc3NhZ2UpIHtcbiAgICBjYXNlIFJFRkVSRU5DRV9UT19OT05FWFBPUlRFRF9DTEFTUzpcbiAgICAgIGlmIChjb250ZXh0ICYmIGNvbnRleHQuY2xhc3NOYW1lKSB7XG4gICAgICAgIHJldHVybiBgQ29uc2lkZXIgZXhwb3J0aW5nICcke2NvbnRleHQuY2xhc3NOYW1lfSdgO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSBERVNUUlVDVFVSRV9OT1RfU1VQUE9SVEVEOlxuICAgICAgcmV0dXJuICdDb25zaWRlciBzaW1wbGlmeWluZyB0byBhdm9pZCBkZXN0cnVjdHVyaW5nJztcbiAgICBjYXNlIFJFRkVSRU5DRV9UT19MT0NBTF9TWU1CT0w6XG4gICAgICBpZiAoY29udGV4dCAmJiBjb250ZXh0Lm5hbWUpIHtcbiAgICAgICAgcmV0dXJuIGBDb25zaWRlciBleHBvcnRpbmcgJyR7Y29udGV4dC5uYW1lfSdgO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSBMQU1CREFfTk9UX1NVUFBPUlRFRDpcbiAgICAgIHJldHVybiBgQ29uc2lkZXIgY2hhbmdpbmcgdGhlIGZ1bmN0aW9uIGV4cHJlc3Npb24gaW50byBhbiBleHBvcnRlZCBmdW5jdGlvbmA7XG4gIH1cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gZXJyb3JTdW1tYXJ5KGVycm9yOiBNZXRhZGF0YUVycm9yKTogc3RyaW5nIHtcbiAgaWYgKGVycm9yLnN1bW1hcnkpIHtcbiAgICByZXR1cm4gZXJyb3Iuc3VtbWFyeTtcbiAgfVxuICBzd2l0Y2ggKGVycm9yLm1lc3NhZ2UpIHtcbiAgICBjYXNlIFJFRkVSRU5DRV9UT19OT05FWFBPUlRFRF9DTEFTUzpcbiAgICAgIGlmIChlcnJvci5jb250ZXh0ICYmIGVycm9yLmNvbnRleHQuY2xhc3NOYW1lKSB7XG4gICAgICAgIHJldHVybiBgcmVmZXJlbmNlcyBub24tZXhwb3J0ZWQgY2xhc3MgJHtlcnJvci5jb250ZXh0LmNsYXNzTmFtZX1gO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSBWQVJJQUJMRV9OT1RfSU5JVElBTElaRUQ6XG4gICAgICByZXR1cm4gJ2lzIG5vdCBpbml0aWFsaXplZCc7XG4gICAgY2FzZSBERVNUUlVDVFVSRV9OT1RfU1VQUE9SVEVEOlxuICAgICAgcmV0dXJuICdpcyBhIGRlc3RydWN0dXJlZCB2YXJpYWJsZSc7XG4gICAgY2FzZSBDT1VMRF9OT1RfUkVTT0xWRV9UWVBFOlxuICAgICAgcmV0dXJuICdjb3VsZCBub3QgYmUgcmVzb2x2ZWQnO1xuICAgIGNhc2UgRlVOQ1RJT05fQ0FMTF9OT1RfU1VQUE9SVEVEOlxuICAgICAgaWYgKGVycm9yLmNvbnRleHQgJiYgZXJyb3IuY29udGV4dC5uYW1lKSB7XG4gICAgICAgIHJldHVybiBgY2FsbHMgJyR7ZXJyb3IuY29udGV4dC5uYW1lfSdgO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGBjYWxscyBhIGZ1bmN0aW9uYDtcbiAgICBjYXNlIFJFRkVSRU5DRV9UT19MT0NBTF9TWU1CT0w6XG4gICAgICBpZiAoZXJyb3IuY29udGV4dCAmJiBlcnJvci5jb250ZXh0Lm5hbWUpIHtcbiAgICAgICAgcmV0dXJuIGByZWZlcmVuY2VzIGxvY2FsIHZhcmlhYmxlICR7ZXJyb3IuY29udGV4dC5uYW1lfWA7XG4gICAgICB9XG4gICAgICByZXR1cm4gYHJlZmVyZW5jZXMgYSBsb2NhbCB2YXJpYWJsZWA7XG4gIH1cbiAgcmV0dXJuICdjb250YWlucyB0aGUgZXJyb3InO1xufVxuXG5mdW5jdGlvbiBtYXBTdHJpbmdNYXAoaW5wdXQ6IHtba2V5OiBzdHJpbmddOiBhbnl9LCB0cmFuc2Zvcm06ICh2YWx1ZTogYW55LCBrZXk6IHN0cmluZykgPT4gYW55KTpcbiAgICB7W2tleTogc3RyaW5nXTogYW55fSB7XG4gIGlmICghaW5wdXQpIHJldHVybiB7fTtcbiAgY29uc3QgcmVzdWx0OiB7W2tleTogc3RyaW5nXTogYW55fSA9IHt9O1xuICBPYmplY3Qua2V5cyhpbnB1dCkuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgY29uc3QgdmFsdWUgPSB0cmFuc2Zvcm0oaW5wdXRba2V5XSwga2V5KTtcbiAgICBpZiAoIXNob3VsZElnbm9yZSh2YWx1ZSkpIHtcbiAgICAgIGlmIChISURERU5fS0VZLnRlc3Qoa2V5KSkge1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkocmVzdWx0LCBrZXksIHtlbnVtZXJhYmxlOiBmYWxzZSwgY29uZmlndXJhYmxlOiB0cnVlLCB2YWx1ZTogdmFsdWV9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdFtrZXldID0gdmFsdWU7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gaXNQcmltaXRpdmUobzogYW55KTogYm9vbGVhbiB7XG4gIHJldHVybiBvID09PSBudWxsIHx8ICh0eXBlb2YgbyAhPT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgbyAhPT0gJ29iamVjdCcpO1xufVxuXG5pbnRlcmZhY2UgQmluZGluZ1Njb3BlQnVpbGRlciB7XG4gIGRlZmluZShuYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnkpOiBCaW5kaW5nU2NvcGVCdWlsZGVyO1xuICBkb25lKCk6IEJpbmRpbmdTY29wZTtcbn1cblxuYWJzdHJhY3QgY2xhc3MgQmluZGluZ1Njb3BlIHtcbiAgYWJzdHJhY3QgcmVzb2x2ZShuYW1lOiBzdHJpbmcpOiBhbnk7XG4gIHB1YmxpYyBzdGF0aWMgbWlzc2luZyA9IHt9O1xuICBwdWJsaWMgc3RhdGljIGVtcHR5OiBCaW5kaW5nU2NvcGUgPSB7cmVzb2x2ZTogbmFtZSA9PiBCaW5kaW5nU2NvcGUubWlzc2luZ307XG5cbiAgcHVibGljIHN0YXRpYyBidWlsZCgpOiBCaW5kaW5nU2NvcGVCdWlsZGVyIHtcbiAgICBjb25zdCBjdXJyZW50ID0gbmV3IE1hcDxzdHJpbmcsIGFueT4oKTtcbiAgICByZXR1cm4ge1xuICAgICAgZGVmaW5lOiBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xuICAgICAgICBjdXJyZW50LnNldChuYW1lLCB2YWx1ZSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfSxcbiAgICAgIGRvbmU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gY3VycmVudC5zaXplID4gMCA/IG5ldyBQb3B1bGF0ZWRTY29wZShjdXJyZW50KSA6IEJpbmRpbmdTY29wZS5lbXB0eTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG59XG5cbmNsYXNzIFBvcHVsYXRlZFNjb3BlIGV4dGVuZHMgQmluZGluZ1Njb3BlIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBiaW5kaW5nczogTWFwPHN0cmluZywgYW55PikgeyBzdXBlcigpOyB9XG5cbiAgcmVzb2x2ZShuYW1lOiBzdHJpbmcpOiBhbnkge1xuICAgIHJldHVybiB0aGlzLmJpbmRpbmdzLmhhcyhuYW1lKSA/IHRoaXMuYmluZGluZ3MuZ2V0KG5hbWUpIDogQmluZGluZ1Njb3BlLm1pc3Npbmc7XG4gIH1cbn1cblxuZnVuY3Rpb24gZm9ybWF0TWV0YWRhdGFNZXNzYWdlQ2hhaW4oXG4gICAgY2hhaW46IE1ldGFkYXRhTWVzc2FnZUNoYWluLCBhZHZpc2U6IHN0cmluZyB8IHVuZGVmaW5lZCk6IEZvcm1hdHRlZE1lc3NhZ2VDaGFpbiB7XG4gIGNvbnN0IGV4cGFuZGVkID0gZXhwYW5kZWRNZXNzYWdlKGNoYWluLm1lc3NhZ2UsIGNoYWluLmNvbnRleHQpO1xuICBjb25zdCBuZXN0aW5nID0gY2hhaW4uc3ltYm9sID8gYCBpbiAnJHtjaGFpbi5zeW1ib2wubmFtZX0nYCA6ICcnO1xuICBjb25zdCBtZXNzYWdlID0gYCR7ZXhwYW5kZWR9JHtuZXN0aW5nfWA7XG4gIGNvbnN0IHBvc2l0aW9uID0gY2hhaW4ucG9zaXRpb247XG4gIGNvbnN0IG5leHQ6IEZvcm1hdHRlZE1lc3NhZ2VDaGFpbnx1bmRlZmluZWQgPSBjaGFpbi5uZXh0ID9cbiAgICAgIGZvcm1hdE1ldGFkYXRhTWVzc2FnZUNoYWluKGNoYWluLm5leHQsIGFkdmlzZSkgOlxuICAgICAgYWR2aXNlID8ge21lc3NhZ2U6IGFkdmlzZX0gOiB1bmRlZmluZWQ7XG4gIHJldHVybiB7bWVzc2FnZSwgcG9zaXRpb24sIG5leHR9O1xufVxuXG5mdW5jdGlvbiBmb3JtYXRNZXRhZGF0YUVycm9yKGU6IEVycm9yLCBjb250ZXh0OiBTdGF0aWNTeW1ib2wpOiBFcnJvciB7XG4gIGlmIChpc01ldGFkYXRhRXJyb3IoZSkpIHtcbiAgICAvLyBQcm9kdWNlIGEgZm9ybWF0dGVkIHZlcnNpb24gb2YgdGhlIGFuZCBsZWF2aW5nIGVub3VnaCBpbmZvcm1hdGlvbiBpbiB0aGUgb3JpZ2luYWwgZXJyb3JcbiAgICAvLyB0byByZWNvdmVyIHRoZSBmb3JtYXR0aW5nIGluZm9ybWF0aW9uIHRvIGV2ZW50dWFsbHkgcHJvZHVjZSBhIGRpYWdub3N0aWMgZXJyb3IgbWVzc2FnZS5cbiAgICBjb25zdCBwb3NpdGlvbiA9IGUucG9zaXRpb247XG4gICAgY29uc3QgY2hhaW46IE1ldGFkYXRhTWVzc2FnZUNoYWluID0ge1xuICAgICAgbWVzc2FnZTogYEVycm9yIGR1cmluZyB0ZW1wbGF0ZSBjb21waWxlIG9mICcke2NvbnRleHQubmFtZX0nYCxcbiAgICAgIHBvc2l0aW9uOiBwb3NpdGlvbixcbiAgICAgIG5leHQ6IHttZXNzYWdlOiBlLm1lc3NhZ2UsIG5leHQ6IGUuY2hhaW4sIGNvbnRleHQ6IGUuY29udGV4dCwgc3ltYm9sOiBlLnN5bWJvbH1cbiAgICB9O1xuICAgIGNvbnN0IGFkdmlzZSA9IGUuYWR2aXNlIHx8IG1lc3NhZ2VBZHZpc2UoZS5tZXNzYWdlLCBlLmNvbnRleHQpO1xuICAgIHJldHVybiBmb3JtYXR0ZWRFcnJvcihmb3JtYXRNZXRhZGF0YU1lc3NhZ2VDaGFpbihjaGFpbiwgYWR2aXNlKSk7XG4gIH1cbiAgcmV0dXJuIGU7XG59XG4iXX0=
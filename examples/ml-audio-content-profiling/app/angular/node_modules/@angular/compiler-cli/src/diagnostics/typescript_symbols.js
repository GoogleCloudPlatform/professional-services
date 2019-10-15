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
        define("@angular/compiler-cli/src/diagnostics/typescript_symbols", ["require", "exports", "tslib", "fs", "path", "typescript", "@angular/compiler-cli/src/diagnostics/symbols", "@angular/compiler-cli/src/diagnostics/typescript_version"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var fs = require("fs");
    var path = require("path");
    var ts = require("typescript");
    var symbols_1 = require("@angular/compiler-cli/src/diagnostics/symbols");
    var typescript_version_1 = require("@angular/compiler-cli/src/diagnostics/typescript_version");
    // In TypeScript 2.1 these flags moved
    // These helpers work for both 2.0 and 2.1.
    var isPrivate = ts.ModifierFlags ?
        (function (node) {
            return !!(ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Private);
        }) :
        (function (node) { return !!(node.flags & ts.NodeFlags.Private); });
    var isReferenceType = ts.ObjectFlags ?
        (function (type) {
            return !!(type.flags & ts.TypeFlags.Object &&
                type.objectFlags & ts.ObjectFlags.Reference);
        }) :
        (function (type) { return !!(type.flags & ts.TypeFlags.Reference); });
    function getSymbolQuery(program, checker, source, fetchPipes) {
        return new TypeScriptSymbolQuery(program, checker, source, fetchPipes);
    }
    exports.getSymbolQuery = getSymbolQuery;
    function getClassMembers(program, checker, staticSymbol) {
        var declaration = getClassFromStaticSymbol(program, staticSymbol);
        if (declaration) {
            var type = checker.getTypeAtLocation(declaration);
            var node = program.getSourceFile(staticSymbol.filePath);
            if (node) {
                return new TypeWrapper(type, { node: node, program: program, checker: checker }).members();
            }
        }
    }
    exports.getClassMembers = getClassMembers;
    function getClassMembersFromDeclaration(program, checker, source, declaration) {
        var type = checker.getTypeAtLocation(declaration);
        return new TypeWrapper(type, { node: source, program: program, checker: checker }).members();
    }
    exports.getClassMembersFromDeclaration = getClassMembersFromDeclaration;
    function getClassFromStaticSymbol(program, type) {
        var source = program.getSourceFile(type.filePath);
        if (source) {
            return ts.forEachChild(source, function (child) {
                if (child.kind === ts.SyntaxKind.ClassDeclaration) {
                    var classDeclaration = child;
                    if (classDeclaration.name != null && classDeclaration.name.text === type.name) {
                        return classDeclaration;
                    }
                }
            });
        }
        return undefined;
    }
    exports.getClassFromStaticSymbol = getClassFromStaticSymbol;
    function getPipesTable(source, program, checker, pipes) {
        return new PipesTable(pipes, { program: program, checker: checker, node: source });
    }
    exports.getPipesTable = getPipesTable;
    var TypeScriptSymbolQuery = /** @class */ (function () {
        function TypeScriptSymbolQuery(program, checker, source, fetchPipes) {
            this.program = program;
            this.checker = checker;
            this.source = source;
            this.fetchPipes = fetchPipes;
            this.typeCache = new Map();
        }
        TypeScriptSymbolQuery.prototype.getTypeKind = function (symbol) { return typeKindOf(this.getTsTypeOf(symbol)); };
        TypeScriptSymbolQuery.prototype.getBuiltinType = function (kind) {
            var result = this.typeCache.get(kind);
            if (!result) {
                var type = getBuiltinTypeFromTs(kind, { checker: this.checker, node: this.source, program: this.program });
                result =
                    new TypeWrapper(type, { program: this.program, checker: this.checker, node: this.source });
                this.typeCache.set(kind, result);
            }
            return result;
        };
        TypeScriptSymbolQuery.prototype.getTypeUnion = function () {
            var types = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                types[_i] = arguments[_i];
            }
            // No API exists so return any if the types are not all the same type.
            var result = undefined;
            if (types.length) {
                result = types[0];
                for (var i = 1; i < types.length; i++) {
                    if (types[i] != result) {
                        result = undefined;
                        break;
                    }
                }
            }
            return result || this.getBuiltinType(symbols_1.BuiltinType.Any);
        };
        TypeScriptSymbolQuery.prototype.getArrayType = function (type) { return this.getBuiltinType(symbols_1.BuiltinType.Any); };
        TypeScriptSymbolQuery.prototype.getElementType = function (type) {
            if (type instanceof TypeWrapper) {
                var elementType = getTypeParameterOf(type.tsType, 'Array');
                if (elementType) {
                    return new TypeWrapper(elementType, type.context);
                }
            }
        };
        TypeScriptSymbolQuery.prototype.getNonNullableType = function (symbol) {
            if (symbol instanceof TypeWrapper && (typeof this.checker.getNonNullableType == 'function')) {
                var tsType = symbol.tsType;
                var nonNullableType = this.checker.getNonNullableType(tsType);
                if (nonNullableType != tsType) {
                    return new TypeWrapper(nonNullableType, symbol.context);
                }
                else if (nonNullableType == tsType) {
                    return symbol;
                }
            }
            return this.getBuiltinType(symbols_1.BuiltinType.Any);
        };
        TypeScriptSymbolQuery.prototype.getPipes = function () {
            var result = this.pipesCache;
            if (!result) {
                result = this.pipesCache = this.fetchPipes();
            }
            return result;
        };
        TypeScriptSymbolQuery.prototype.getTemplateContext = function (type) {
            var context = { node: this.source, program: this.program, checker: this.checker };
            var typeSymbol = findClassSymbolInContext(type, context);
            if (typeSymbol) {
                var contextType = this.getTemplateRefContextType(typeSymbol);
                if (contextType)
                    return new SymbolWrapper(contextType, context).members();
            }
        };
        TypeScriptSymbolQuery.prototype.getTypeSymbol = function (type) {
            var context = { node: this.source, program: this.program, checker: this.checker };
            var typeSymbol = findClassSymbolInContext(type, context);
            return typeSymbol && new SymbolWrapper(typeSymbol, context);
        };
        TypeScriptSymbolQuery.prototype.createSymbolTable = function (symbols) {
            var result = new MapSymbolTable();
            result.addAll(symbols.map(function (s) { return new DeclaredSymbol(s); }));
            return result;
        };
        TypeScriptSymbolQuery.prototype.mergeSymbolTable = function (symbolTables) {
            var e_1, _a;
            var result = new MapSymbolTable();
            try {
                for (var symbolTables_1 = tslib_1.__values(symbolTables), symbolTables_1_1 = symbolTables_1.next(); !symbolTables_1_1.done; symbolTables_1_1 = symbolTables_1.next()) {
                    var symbolTable = symbolTables_1_1.value;
                    result.addAll(symbolTable.values());
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (symbolTables_1_1 && !symbolTables_1_1.done && (_a = symbolTables_1.return)) _a.call(symbolTables_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return result;
        };
        TypeScriptSymbolQuery.prototype.getSpanAt = function (line, column) {
            return spanAt(this.source, line, column);
        };
        TypeScriptSymbolQuery.prototype.getTemplateRefContextType = function (typeSymbol) {
            var e_2, _a;
            var type = this.checker.getTypeOfSymbolAtLocation(typeSymbol, this.source);
            var constructor = type.symbol && type.symbol.members &&
                getFromSymbolTable(type.symbol.members, '__constructor');
            if (constructor) {
                var constructorDeclaration = constructor.declarations[0];
                try {
                    for (var _b = tslib_1.__values(constructorDeclaration.parameters), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var parameter = _c.value;
                        var type_1 = this.checker.getTypeAtLocation(parameter.type);
                        if (type_1.symbol.name == 'TemplateRef' && isReferenceType(type_1)) {
                            var typeReference = type_1;
                            if (typeReference.typeArguments && typeReference.typeArguments.length === 1) {
                                return typeReference.typeArguments[0].symbol;
                            }
                        }
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            }
        };
        TypeScriptSymbolQuery.prototype.getTsTypeOf = function (symbol) {
            var type = this.getTypeWrapper(symbol);
            return type && type.tsType;
        };
        TypeScriptSymbolQuery.prototype.getTypeWrapper = function (symbol) {
            var type = undefined;
            if (symbol instanceof TypeWrapper) {
                type = symbol;
            }
            else if (symbol.type instanceof TypeWrapper) {
                type = symbol.type;
            }
            return type;
        };
        return TypeScriptSymbolQuery;
    }());
    function typeCallable(type) {
        var signatures = type.getCallSignatures();
        return signatures && signatures.length != 0;
    }
    function signaturesOf(type, context) {
        return type.getCallSignatures().map(function (s) { return new SignatureWrapper(s, context); });
    }
    function selectSignature(type, context, types) {
        // TODO: Do a better job of selecting the right signature.
        var signatures = type.getCallSignatures();
        return signatures.length ? new SignatureWrapper(signatures[0], context) : undefined;
    }
    var TypeWrapper = /** @class */ (function () {
        function TypeWrapper(tsType, context) {
            this.tsType = tsType;
            this.context = context;
            this.kind = 'type';
            this.language = 'typescript';
            this.type = undefined;
            this.container = undefined;
            this.public = true;
            if (!tsType) {
                throw Error('Internal: null type');
            }
        }
        Object.defineProperty(TypeWrapper.prototype, "name", {
            get: function () {
                var symbol = this.tsType.symbol;
                return (symbol && symbol.name) || '<anonymous>';
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TypeWrapper.prototype, "callable", {
            get: function () { return typeCallable(this.tsType); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TypeWrapper.prototype, "nullable", {
            get: function () {
                return this.context.checker.getNonNullableType(this.tsType) != this.tsType;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TypeWrapper.prototype, "definition", {
            get: function () {
                var symbol = this.tsType.getSymbol();
                return symbol ? definitionFromTsSymbol(symbol) : undefined;
            },
            enumerable: true,
            configurable: true
        });
        TypeWrapper.prototype.members = function () {
            return new SymbolTableWrapper(this.tsType.getProperties(), this.context);
        };
        TypeWrapper.prototype.signatures = function () { return signaturesOf(this.tsType, this.context); };
        TypeWrapper.prototype.selectSignature = function (types) {
            return selectSignature(this.tsType, this.context, types);
        };
        TypeWrapper.prototype.indexed = function (argument) { return undefined; };
        return TypeWrapper;
    }());
    var SymbolWrapper = /** @class */ (function () {
        function SymbolWrapper(symbol, context) {
            this.context = context;
            this.nullable = false;
            this.language = 'typescript';
            this.symbol = symbol && context && (symbol.flags & ts.SymbolFlags.Alias) ?
                context.checker.getAliasedSymbol(symbol) :
                symbol;
        }
        Object.defineProperty(SymbolWrapper.prototype, "name", {
            get: function () { return this.symbol.name; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SymbolWrapper.prototype, "kind", {
            get: function () { return this.callable ? 'method' : 'property'; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SymbolWrapper.prototype, "type", {
            get: function () { return new TypeWrapper(this.tsType, this.context); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SymbolWrapper.prototype, "container", {
            get: function () { return getContainerOf(this.symbol, this.context); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SymbolWrapper.prototype, "public", {
            get: function () {
                // Symbols that are not explicitly made private are public.
                return !isSymbolPrivate(this.symbol);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SymbolWrapper.prototype, "callable", {
            get: function () { return typeCallable(this.tsType); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SymbolWrapper.prototype, "definition", {
            get: function () { return definitionFromTsSymbol(this.symbol); },
            enumerable: true,
            configurable: true
        });
        SymbolWrapper.prototype.members = function () {
            if (!this._members) {
                if ((this.symbol.flags & (ts.SymbolFlags.Class | ts.SymbolFlags.Interface)) != 0) {
                    var declaredType = this.context.checker.getDeclaredTypeOfSymbol(this.symbol);
                    var typeWrapper = new TypeWrapper(declaredType, this.context);
                    this._members = typeWrapper.members();
                }
                else {
                    this._members = new SymbolTableWrapper(this.symbol.members, this.context);
                }
            }
            return this._members;
        };
        SymbolWrapper.prototype.signatures = function () { return signaturesOf(this.tsType, this.context); };
        SymbolWrapper.prototype.selectSignature = function (types) {
            return selectSignature(this.tsType, this.context, types);
        };
        SymbolWrapper.prototype.indexed = function (argument) { return undefined; };
        Object.defineProperty(SymbolWrapper.prototype, "tsType", {
            get: function () {
                var type = this._tsType;
                if (!type) {
                    type = this._tsType =
                        this.context.checker.getTypeOfSymbolAtLocation(this.symbol, this.context.node);
                }
                return type;
            },
            enumerable: true,
            configurable: true
        });
        return SymbolWrapper;
    }());
    var DeclaredSymbol = /** @class */ (function () {
        function DeclaredSymbol(declaration) {
            this.declaration = declaration;
            this.language = 'ng-template';
            this.nullable = false;
            this.public = true;
        }
        Object.defineProperty(DeclaredSymbol.prototype, "name", {
            get: function () { return this.declaration.name; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DeclaredSymbol.prototype, "kind", {
            get: function () { return this.declaration.kind; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DeclaredSymbol.prototype, "container", {
            get: function () { return undefined; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DeclaredSymbol.prototype, "type", {
            get: function () { return this.declaration.type; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DeclaredSymbol.prototype, "callable", {
            get: function () { return this.declaration.type.callable; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DeclaredSymbol.prototype, "definition", {
            get: function () { return this.declaration.definition; },
            enumerable: true,
            configurable: true
        });
        DeclaredSymbol.prototype.members = function () { return this.declaration.type.members(); };
        DeclaredSymbol.prototype.signatures = function () { return this.declaration.type.signatures(); };
        DeclaredSymbol.prototype.selectSignature = function (types) {
            return this.declaration.type.selectSignature(types);
        };
        DeclaredSymbol.prototype.indexed = function (argument) { return undefined; };
        return DeclaredSymbol;
    }());
    var SignatureWrapper = /** @class */ (function () {
        function SignatureWrapper(signature, context) {
            this.signature = signature;
            this.context = context;
        }
        Object.defineProperty(SignatureWrapper.prototype, "arguments", {
            get: function () {
                return new SymbolTableWrapper(this.signature.getParameters(), this.context);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SignatureWrapper.prototype, "result", {
            get: function () { return new TypeWrapper(this.signature.getReturnType(), this.context); },
            enumerable: true,
            configurable: true
        });
        return SignatureWrapper;
    }());
    var SignatureResultOverride = /** @class */ (function () {
        function SignatureResultOverride(signature, resultType) {
            this.signature = signature;
            this.resultType = resultType;
        }
        Object.defineProperty(SignatureResultOverride.prototype, "arguments", {
            get: function () { return this.signature.arguments; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SignatureResultOverride.prototype, "result", {
            get: function () { return this.resultType; },
            enumerable: true,
            configurable: true
        });
        return SignatureResultOverride;
    }());
    /**
     * Indicates the lower bound TypeScript version supporting `SymbolTable` as an ES6 `Map`.
     * For lower versions, `SymbolTable` is implemented as a dictionary
     */
    var MIN_TS_VERSION_SUPPORTING_MAP = '2.2';
    exports.toSymbolTableFactory = function (tsVersion) { return function (symbols) {
        var e_3, _a, e_4, _b;
        if (typescript_version_1.isVersionBetween(tsVersion, MIN_TS_VERSION_SUPPORTING_MAP)) {
            // ∀ Typescript version >= 2.2, `SymbolTable` is implemented as an ES6 `Map`
            var result_1 = new Map();
            try {
                for (var symbols_2 = tslib_1.__values(symbols), symbols_2_1 = symbols_2.next(); !symbols_2_1.done; symbols_2_1 = symbols_2.next()) {
                    var symbol = symbols_2_1.value;
                    result_1.set(symbol.name, symbol);
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (symbols_2_1 && !symbols_2_1.done && (_a = symbols_2.return)) _a.call(symbols_2);
                }
                finally { if (e_3) throw e_3.error; }
            }
            // First, tell the compiler that `result` is of type `any`. Then, use a second type assertion
            // to `ts.SymbolTable`.
            // Otherwise, `Map<string, ts.Symbol>` and `ts.SymbolTable` will be considered as incompatible
            // types by the compiler
            return result_1;
        }
        // ∀ Typescript version < 2.2, `SymbolTable` is implemented as a dictionary
        var result = {};
        try {
            for (var symbols_3 = tslib_1.__values(symbols), symbols_3_1 = symbols_3.next(); !symbols_3_1.done; symbols_3_1 = symbols_3.next()) {
                var symbol = symbols_3_1.value;
                result[symbol.name] = symbol;
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (symbols_3_1 && !symbols_3_1.done && (_b = symbols_3.return)) _b.call(symbols_3);
            }
            finally { if (e_4) throw e_4.error; }
        }
        return result;
    }; };
    function toSymbols(symbolTable) {
        if (!symbolTable)
            return [];
        var table = symbolTable;
        if (typeof table.values === 'function') {
            return Array.from(table.values());
        }
        var result = [];
        var own = typeof table.hasOwnProperty === 'function' ?
            function (name) { return table.hasOwnProperty(name); } :
            function (name) { return !!table[name]; };
        for (var name in table) {
            if (own(name)) {
                result.push(table[name]);
            }
        }
        return result;
    }
    var SymbolTableWrapper = /** @class */ (function () {
        function SymbolTableWrapper(symbols, context) {
            this.context = context;
            symbols = symbols || [];
            if (Array.isArray(symbols)) {
                this.symbols = symbols;
                var toSymbolTable = exports.toSymbolTableFactory(ts.version);
                this.symbolTable = toSymbolTable(symbols);
            }
            else {
                this.symbols = toSymbols(symbols);
                this.symbolTable = symbols;
            }
        }
        Object.defineProperty(SymbolTableWrapper.prototype, "size", {
            get: function () { return this.symbols.length; },
            enumerable: true,
            configurable: true
        });
        SymbolTableWrapper.prototype.get = function (key) {
            var symbol = getFromSymbolTable(this.symbolTable, key);
            return symbol ? new SymbolWrapper(symbol, this.context) : undefined;
        };
        SymbolTableWrapper.prototype.has = function (key) {
            var table = this.symbolTable;
            return (typeof table.has === 'function') ? table.has(key) : table[key] != null;
        };
        SymbolTableWrapper.prototype.values = function () {
            var _this = this;
            return this.symbols.map(function (s) { return new SymbolWrapper(s, _this.context); });
        };
        return SymbolTableWrapper;
    }());
    var MapSymbolTable = /** @class */ (function () {
        function MapSymbolTable() {
            this.map = new Map();
            this._values = [];
        }
        Object.defineProperty(MapSymbolTable.prototype, "size", {
            get: function () { return this.map.size; },
            enumerable: true,
            configurable: true
        });
        MapSymbolTable.prototype.get = function (key) { return this.map.get(key); };
        MapSymbolTable.prototype.add = function (symbol) {
            if (this.map.has(symbol.name)) {
                var previous = this.map.get(symbol.name);
                this._values[this._values.indexOf(previous)] = symbol;
            }
            this.map.set(symbol.name, symbol);
            this._values.push(symbol);
        };
        MapSymbolTable.prototype.addAll = function (symbols) {
            var e_5, _a;
            try {
                for (var symbols_4 = tslib_1.__values(symbols), symbols_4_1 = symbols_4.next(); !symbols_4_1.done; symbols_4_1 = symbols_4.next()) {
                    var symbol = symbols_4_1.value;
                    this.add(symbol);
                }
            }
            catch (e_5_1) { e_5 = { error: e_5_1 }; }
            finally {
                try {
                    if (symbols_4_1 && !symbols_4_1.done && (_a = symbols_4.return)) _a.call(symbols_4);
                }
                finally { if (e_5) throw e_5.error; }
            }
        };
        MapSymbolTable.prototype.has = function (key) { return this.map.has(key); };
        MapSymbolTable.prototype.values = function () {
            // Switch to this.map.values once iterables are supported by the target language.
            return this._values;
        };
        return MapSymbolTable;
    }());
    var PipesTable = /** @class */ (function () {
        function PipesTable(pipes, context) {
            this.pipes = pipes;
            this.context = context;
        }
        Object.defineProperty(PipesTable.prototype, "size", {
            get: function () { return this.pipes.length; },
            enumerable: true,
            configurable: true
        });
        PipesTable.prototype.get = function (key) {
            var pipe = this.pipes.find(function (pipe) { return pipe.name == key; });
            if (pipe) {
                return new PipeSymbol(pipe, this.context);
            }
        };
        PipesTable.prototype.has = function (key) { return this.pipes.find(function (pipe) { return pipe.name == key; }) != null; };
        PipesTable.prototype.values = function () {
            var _this = this;
            return this.pipes.map(function (pipe) { return new PipeSymbol(pipe, _this.context); });
        };
        return PipesTable;
    }());
    // This matches .d.ts files that look like ".../<package-name>/<package-name>.d.ts",
    var INDEX_PATTERN = /[\\/]([^\\/]+)[\\/]\1\.d\.ts$/;
    var PipeSymbol = /** @class */ (function () {
        function PipeSymbol(pipe, context) {
            this.pipe = pipe;
            this.context = context;
            this.kind = 'pipe';
            this.language = 'typescript';
            this.container = undefined;
            this.callable = true;
            this.nullable = false;
            this.public = true;
        }
        Object.defineProperty(PipeSymbol.prototype, "name", {
            get: function () { return this.pipe.name; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PipeSymbol.prototype, "type", {
            get: function () { return new TypeWrapper(this.tsType, this.context); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PipeSymbol.prototype, "definition", {
            get: function () {
                var symbol = this.tsType.getSymbol();
                return symbol ? definitionFromTsSymbol(symbol) : undefined;
            },
            enumerable: true,
            configurable: true
        });
        PipeSymbol.prototype.members = function () { return EmptyTable.instance; };
        PipeSymbol.prototype.signatures = function () { return signaturesOf(this.tsType, this.context); };
        PipeSymbol.prototype.selectSignature = function (types) {
            var signature = selectSignature(this.tsType, this.context, types);
            if (types.length == 1) {
                var parameterType = types[0];
                if (parameterType instanceof TypeWrapper) {
                    var resultType = undefined;
                    switch (this.name) {
                        case 'async':
                            switch (parameterType.name) {
                                case 'Observable':
                                case 'Promise':
                                case 'EventEmitter':
                                    resultType = getTypeParameterOf(parameterType.tsType, parameterType.name);
                                    break;
                                default:
                                    resultType = getBuiltinTypeFromTs(symbols_1.BuiltinType.Any, this.context);
                                    break;
                            }
                            break;
                        case 'slice':
                            resultType = getTypeParameterOf(parameterType.tsType, 'Array');
                            break;
                    }
                    if (resultType) {
                        signature = new SignatureResultOverride(signature, new TypeWrapper(resultType, parameterType.context));
                    }
                }
            }
            return signature;
        };
        PipeSymbol.prototype.indexed = function (argument) { return undefined; };
        Object.defineProperty(PipeSymbol.prototype, "tsType", {
            get: function () {
                var type = this._tsType;
                if (!type) {
                    var classSymbol = this.findClassSymbol(this.pipe.type.reference);
                    if (classSymbol) {
                        type = this._tsType = this.findTransformMethodType(classSymbol);
                    }
                    if (!type) {
                        type = this._tsType = getBuiltinTypeFromTs(symbols_1.BuiltinType.Any, this.context);
                    }
                }
                return type;
            },
            enumerable: true,
            configurable: true
        });
        PipeSymbol.prototype.findClassSymbol = function (type) {
            return findClassSymbolInContext(type, this.context);
        };
        PipeSymbol.prototype.findTransformMethodType = function (classSymbol) {
            var classType = this.context.checker.getDeclaredTypeOfSymbol(classSymbol);
            if (classType) {
                var transform = classType.getProperty('transform');
                if (transform) {
                    return this.context.checker.getTypeOfSymbolAtLocation(transform, this.context.node);
                }
            }
        };
        return PipeSymbol;
    }());
    function findClassSymbolInContext(type, context) {
        var sourceFile = context.program.getSourceFile(type.filePath);
        if (!sourceFile) {
            // This handles a case where an <packageName>/index.d.ts and a <packageName>/<packageName>.d.ts
            // are in the same directory. If we are looking for <packageName>/<packageName> and didn't
            // find it, look for <packageName>/index.d.ts as the program might have found that instead.
            var p = type.filePath;
            var m = p.match(INDEX_PATTERN);
            if (m) {
                var indexVersion = path.join(path.dirname(p), 'index.d.ts');
                sourceFile = context.program.getSourceFile(indexVersion);
            }
        }
        if (sourceFile) {
            var moduleSymbol = sourceFile.module || sourceFile.symbol;
            var exports_1 = context.checker.getExportsOfModule(moduleSymbol);
            return (exports_1 || []).find(function (symbol) { return symbol.name == type.name; });
        }
    }
    var EmptyTable = /** @class */ (function () {
        function EmptyTable() {
            this.size = 0;
        }
        EmptyTable.prototype.get = function (key) { return undefined; };
        EmptyTable.prototype.has = function (key) { return false; };
        EmptyTable.prototype.values = function () { return []; };
        EmptyTable.instance = new EmptyTable();
        return EmptyTable;
    }());
    function findTsConfig(fileName) {
        var dir = path.dirname(fileName);
        while (fs.existsSync(dir)) {
            var candidate = path.join(dir, 'tsconfig.json');
            if (fs.existsSync(candidate))
                return candidate;
            var parentDir = path.dirname(dir);
            if (parentDir === dir)
                break;
            dir = parentDir;
        }
    }
    function isBindingPattern(node) {
        return !!node && (node.kind === ts.SyntaxKind.ArrayBindingPattern ||
            node.kind === ts.SyntaxKind.ObjectBindingPattern);
    }
    function walkUpBindingElementsAndPatterns(node) {
        while (node && (node.kind === ts.SyntaxKind.BindingElement || isBindingPattern(node))) {
            node = node.parent;
        }
        return node;
    }
    function getCombinedNodeFlags(node) {
        node = walkUpBindingElementsAndPatterns(node);
        var flags = node.flags;
        if (node.kind === ts.SyntaxKind.VariableDeclaration) {
            node = node.parent;
        }
        if (node && node.kind === ts.SyntaxKind.VariableDeclarationList) {
            flags |= node.flags;
            node = node.parent;
        }
        if (node && node.kind === ts.SyntaxKind.VariableStatement) {
            flags |= node.flags;
        }
        return flags;
    }
    function isSymbolPrivate(s) {
        return !!s.valueDeclaration && isPrivate(s.valueDeclaration);
    }
    function getBuiltinTypeFromTs(kind, context) {
        var type;
        var checker = context.checker;
        var node = context.node;
        switch (kind) {
            case symbols_1.BuiltinType.Any:
                type = checker.getTypeAtLocation(setParents({
                    kind: ts.SyntaxKind.AsExpression,
                    expression: { kind: ts.SyntaxKind.TrueKeyword },
                    type: { kind: ts.SyntaxKind.AnyKeyword }
                }, node));
                break;
            case symbols_1.BuiltinType.Boolean:
                type =
                    checker.getTypeAtLocation(setParents({ kind: ts.SyntaxKind.TrueKeyword }, node));
                break;
            case symbols_1.BuiltinType.Null:
                type =
                    checker.getTypeAtLocation(setParents({ kind: ts.SyntaxKind.NullKeyword }, node));
                break;
            case symbols_1.BuiltinType.Number:
                var numeric = { kind: ts.SyntaxKind.NumericLiteral };
                setParents({ kind: ts.SyntaxKind.ExpressionStatement, expression: numeric }, node);
                type = checker.getTypeAtLocation(numeric);
                break;
            case symbols_1.BuiltinType.String:
                type = checker.getTypeAtLocation(setParents({ kind: ts.SyntaxKind.NoSubstitutionTemplateLiteral }, node));
                break;
            case symbols_1.BuiltinType.Undefined:
                type = checker.getTypeAtLocation(setParents({
                    kind: ts.SyntaxKind.VoidExpression,
                    expression: { kind: ts.SyntaxKind.NumericLiteral }
                }, node));
                break;
            default:
                throw new Error("Internal error, unhandled literal kind " + kind + ":" + symbols_1.BuiltinType[kind]);
        }
        return type;
    }
    function setParents(node, parent) {
        node.parent = parent;
        ts.forEachChild(node, function (child) { return setParents(child, node); });
        return node;
    }
    function spanOf(node) {
        return { start: node.getStart(), end: node.getEnd() };
    }
    function shrink(span, offset) {
        if (offset == null)
            offset = 1;
        return { start: span.start + offset, end: span.end - offset };
    }
    function spanAt(sourceFile, line, column) {
        if (line != null && column != null) {
            var position_1 = ts.getPositionOfLineAndCharacter(sourceFile, line, column);
            var findChild = function findChild(node) {
                if (node.kind > ts.SyntaxKind.LastToken && node.pos <= position_1 && node.end > position_1) {
                    var betterNode = ts.forEachChild(node, findChild);
                    return betterNode || node;
                }
            };
            var node = ts.forEachChild(sourceFile, findChild);
            if (node) {
                return { start: node.getStart(), end: node.getEnd() };
            }
        }
    }
    function definitionFromTsSymbol(symbol) {
        var declarations = symbol.declarations;
        if (declarations) {
            return declarations.map(function (declaration) {
                var sourceFile = declaration.getSourceFile();
                return {
                    fileName: sourceFile.fileName,
                    span: { start: declaration.getStart(), end: declaration.getEnd() }
                };
            });
        }
    }
    function parentDeclarationOf(node) {
        while (node) {
            switch (node.kind) {
                case ts.SyntaxKind.ClassDeclaration:
                case ts.SyntaxKind.InterfaceDeclaration:
                    return node;
                case ts.SyntaxKind.SourceFile:
                    return undefined;
            }
            node = node.parent;
        }
    }
    function getContainerOf(symbol, context) {
        var e_6, _a;
        if (symbol.getFlags() & ts.SymbolFlags.ClassMember && symbol.declarations) {
            try {
                for (var _b = tslib_1.__values(symbol.declarations), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var declaration = _c.value;
                    var parent = parentDeclarationOf(declaration);
                    if (parent) {
                        var type = context.checker.getTypeAtLocation(parent);
                        if (type) {
                            return new TypeWrapper(type, context);
                        }
                    }
                }
            }
            catch (e_6_1) { e_6 = { error: e_6_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_6) throw e_6.error; }
            }
        }
    }
    function getTypeParameterOf(type, name) {
        if (type && type.symbol && type.symbol.name == name) {
            var typeArguments = type.typeArguments;
            if (typeArguments && typeArguments.length <= 1) {
                return typeArguments[0];
            }
        }
    }
    function typeKindOf(type) {
        var e_7, _a;
        if (type) {
            if (type.flags & ts.TypeFlags.Any) {
                return symbols_1.BuiltinType.Any;
            }
            else if (type.flags & (ts.TypeFlags.String | ts.TypeFlags.StringLike | ts.TypeFlags.StringLiteral)) {
                return symbols_1.BuiltinType.String;
            }
            else if (type.flags & (ts.TypeFlags.Number | ts.TypeFlags.NumberLike)) {
                return symbols_1.BuiltinType.Number;
            }
            else if (type.flags & (ts.TypeFlags.Undefined)) {
                return symbols_1.BuiltinType.Undefined;
            }
            else if (type.flags & (ts.TypeFlags.Null)) {
                return symbols_1.BuiltinType.Null;
            }
            else if (type.flags & ts.TypeFlags.Union) {
                // If all the constituent types of a union are the same kind, it is also that kind.
                var candidate = null;
                var unionType = type;
                if (unionType.types.length > 0) {
                    candidate = typeKindOf(unionType.types[0]);
                    try {
                        for (var _b = tslib_1.__values(unionType.types), _c = _b.next(); !_c.done; _c = _b.next()) {
                            var subType = _c.value;
                            if (candidate != typeKindOf(subType)) {
                                return symbols_1.BuiltinType.Other;
                            }
                        }
                    }
                    catch (e_7_1) { e_7 = { error: e_7_1 }; }
                    finally {
                        try {
                            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                        }
                        finally { if (e_7) throw e_7.error; }
                    }
                }
                if (candidate != null) {
                    return candidate;
                }
            }
            else if (type.flags & ts.TypeFlags.TypeParameter) {
                return symbols_1.BuiltinType.Unbound;
            }
        }
        return symbols_1.BuiltinType.Other;
    }
    function getFromSymbolTable(symbolTable, key) {
        var table = symbolTable;
        var symbol;
        if (typeof table.get === 'function') {
            // TS 2.2 uses a Map
            symbol = table.get(key);
        }
        else {
            // TS pre-2.2 uses an object
            symbol = table[key];
        }
        return symbol;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZXNjcmlwdF9zeW1ib2xzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXItY2xpL3NyYy9kaWFnbm9zdGljcy90eXBlc2NyaXB0X3N5bWJvbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7O0lBR0gsdUJBQXlCO0lBQ3pCLDJCQUE2QjtJQUM3QiwrQkFBaUM7SUFFakMseUVBQTBKO0lBQzFKLCtGQUFzRDtJQUV0RCxzQ0FBc0M7SUFDdEMsMkNBQTJDO0lBQzNDLElBQU0sU0FBUyxHQUFJLEVBQVUsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUN6QyxDQUFDLFVBQUMsSUFBYTtZQUNWLE9BQUEsQ0FBQyxDQUFDLENBQUUsRUFBVSxDQUFDLHdCQUF3QixDQUFDLElBQUksQ0FBQyxHQUFJLEVBQVUsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDO1FBQWxGLENBQWtGLENBQUMsQ0FBQyxDQUFDO1FBQzFGLENBQUMsVUFBQyxJQUFhLElBQUssT0FBQSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFJLEVBQVUsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEVBQTlDLENBQThDLENBQUMsQ0FBQztJQUV4RSxJQUFNLGVBQWUsR0FBSSxFQUFVLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDN0MsQ0FBQyxVQUFDLElBQWE7WUFDVixPQUFBLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUksRUFBVSxDQUFDLFNBQVMsQ0FBQyxNQUFNO2dCQUN4QyxJQUFZLENBQUMsV0FBVyxHQUFJLEVBQVUsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDO1FBRGpFLENBQ2lFLENBQUMsQ0FBQyxDQUFDO1FBQ3pFLENBQUMsVUFBQyxJQUFhLElBQUssT0FBQSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFJLEVBQVUsQ0FBQyxTQUFT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QyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7O3dCQUMzQyxLQUFzQixJQUFBLEtBQUEsaUJBQUEsU0FBUyxDQUFDLEtBQUssQ0FBQSxnQkFBQSw0QkFBRTs0QkFBbEMsSUFBTSxPQUFPLFdBQUE7NEJBQ2hCLElBQUksU0FBUyxJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsRUFBRTtnQ0FDcEMsT0FBTyxxQkFBVyxDQUFDLEtBQUssQ0FBQzs2QkFDMUI7eUJBQ0Y7Ozs7Ozs7OztpQkFDRjtnQkFDRCxJQUFJLFNBQVMsSUFBSSxJQUFJLEVBQUU7b0JBQ3JCLE9BQU8sU0FBUyxDQUFDO2lCQUNsQjthQUNGO2lCQUFNLElBQUksSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFBRTtnQkFDbEQsT0FBTyxxQkFBVyxDQUFDLE9BQU8sQ0FBQzthQUM1QjtTQUNGO1FBQ0QsT0FBTyxxQkFBVyxDQUFDLEtBQUssQ0FBQztJQUMzQixDQUFDO0lBSUQsU0FBUyxrQkFBa0IsQ0FBQyxXQUEyQixFQUFFLEdBQVc7UUFDbEUsSUFBTSxLQUFLLEdBQUcsV0FBa0IsQ0FBQztRQUNqQyxJQUFJLE1BQTJCLENBQUM7UUFFaEMsSUFBSSxPQUFPLEtBQUssQ0FBQyxHQUFHLEtBQUssVUFBVSxFQUFFO1lBQ25DLG9CQUFvQjtZQUNwQixNQUFNLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUN6QjthQUFNO1lBQ0wsNEJBQTRCO1lBQzVCLE1BQU0sR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDckI7UUFFRCxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0FvdFN1bW1hcnlSZXNvbHZlciwgQ29tcGlsZU1ldGFkYXRhUmVzb2x2ZXIsIENvbXBpbGVQaXBlU3VtbWFyeSwgQ29tcGlsZXJDb25maWcsIERFRkFVTFRfSU5URVJQT0xBVElPTl9DT05GSUcsIERpcmVjdGl2ZU5vcm1hbGl6ZXIsIERpcmVjdGl2ZVJlc29sdmVyLCBEb21FbGVtZW50U2NoZW1hUmVnaXN0cnksIEh0bWxQYXJzZXIsIEludGVycG9sYXRpb25Db25maWcsIE5nQW5hbHl6ZWRNb2R1bGVzLCBOZ01vZHVsZVJlc29sdmVyLCBQYXJzZVRyZWVSZXN1bHQsIFBpcGVSZXNvbHZlciwgUmVzb3VyY2VMb2FkZXIsIFN0YXRpY1JlZmxlY3RvciwgU3RhdGljU3ltYm9sLCBTdGF0aWNTeW1ib2xDYWNoZSwgU3RhdGljU3ltYm9sUmVzb2x2ZXIsIFN1bW1hcnlSZXNvbHZlcn0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge0J1aWx0aW5UeXBlLCBEZWNsYXJhdGlvbktpbmQsIERlZmluaXRpb24sIFBpcGVJbmZvLCBQaXBlcywgU2lnbmF0dXJlLCBTcGFuLCBTeW1ib2wsIFN5bWJvbERlY2xhcmF0aW9uLCBTeW1ib2xRdWVyeSwgU3ltYm9sVGFibGV9IGZyb20gJy4vc3ltYm9scyc7XG5pbXBvcnQge2lzVmVyc2lvbkJldHdlZW59IGZyb20gJy4vdHlwZXNjcmlwdF92ZXJzaW9uJztcblxuLy8gSW4gVHlwZVNjcmlwdCAyLjEgdGhlc2UgZmxhZ3MgbW92ZWRcbi8vIFRoZXNlIGhlbHBlcnMgd29yayBmb3IgYm90aCAyLjAgYW5kIDIuMS5cbmNvbnN0IGlzUHJpdmF0ZSA9ICh0cyBhcyBhbnkpLk1vZGlmaWVyRmxhZ3MgP1xuICAgICgobm9kZTogdHMuTm9kZSkgPT5cbiAgICAgICAgICEhKCh0cyBhcyBhbnkpLmdldENvbWJpbmVkTW9kaWZpZXJGbGFncyhub2RlKSAmICh0cyBhcyBhbnkpLk1vZGlmaWVyRmxhZ3MuUHJpdmF0ZSkpIDpcbiAgICAoKG5vZGU6IHRzLk5vZGUpID0+ICEhKG5vZGUuZmxhZ3MgJiAodHMgYXMgYW55KS5Ob2RlRmxhZ3MuUHJpdmF0ZSkpO1xuXG5jb25zdCBpc1JlZmVyZW5jZVR5cGUgPSAodHMgYXMgYW55KS5PYmplY3RGbGFncyA/XG4gICAgKCh0eXBlOiB0cy5UeXBlKSA9PlxuICAgICAgICAgISEodHlwZS5mbGFncyAmICh0cyBhcyBhbnkpLlR5cGVGbGFncy5PYmplY3QgJiZcbiAgICAgICAgICAgICh0eXBlIGFzIGFueSkub2JqZWN0RmxhZ3MgJiAodHMgYXMgYW55KS5PYmplY3RGbGFncy5SZWZlcmVuY2UpKSA6XG4gICAgKCh0eXBlOiB0cy5UeXBlKSA9PiAhISh0eXBlLmZsYWdzICYgKHRzIGFzIGFueSkuVHlwZUZsYWdzLlJlZmVyZW5jZSkpO1xuXG5pbnRlcmZhY2UgVHlwZUNvbnRleHQge1xuICBub2RlOiB0cy5Ob2RlO1xuICBwcm9ncmFtOiB0cy5Qcm9ncmFtO1xuICBjaGVja2VyOiB0cy5UeXBlQ2hlY2tlcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFN5bWJvbFF1ZXJ5KFxuICAgIHByb2dyYW06IHRzLlByb2dyYW0sIGNoZWNrZXI6IHRzLlR5cGVDaGVja2VyLCBzb3VyY2U6IHRzLlNvdXJjZUZpbGUsXG4gICAgZmV0Y2hQaXBlczogKCkgPT4gU3ltYm9sVGFibGUpOiBTeW1ib2xRdWVyeSB7XG4gIHJldHVybiBuZXcgVHlwZVNjcmlwdFN5bWJvbFF1ZXJ5KHByb2dyYW0sIGNoZWNrZXIsIHNvdXJjZSwgZmV0Y2hQaXBlcyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDbGFzc01lbWJlcnMoXG4gICAgcHJvZ3JhbTogdHMuUHJvZ3JhbSwgY2hlY2tlcjogdHMuVHlwZUNoZWNrZXIsIHN0YXRpY1N5bWJvbDogU3RhdGljU3ltYm9sKTogU3ltYm9sVGFibGV8XG4gICAgdW5kZWZpbmVkIHtcbiAgY29uc3QgZGVjbGFyYXRpb24gPSBnZXRDbGFzc0Zyb21TdGF0aWNTeW1ib2wocHJvZ3JhbSwgc3RhdGljU3ltYm9sKTtcbiAgaWYgKGRlY2xhcmF0aW9uKSB7XG4gICAgY29uc3QgdHlwZSA9IGNoZWNrZXIuZ2V0VHlwZUF0TG9jYXRpb24oZGVjbGFyYXRpb24pO1xuICAgIGNvbnN0IG5vZGUgPSBwcm9ncmFtLmdldFNvdXJjZUZpbGUoc3RhdGljU3ltYm9sLmZpbGVQYXRoKTtcbiAgICBpZiAobm9kZSkge1xuICAgICAgcmV0dXJuIG5ldyBUeXBlV3JhcHBlcih0eXBlLCB7bm9kZSwgcHJvZ3JhbSwgY2hlY2tlcn0pLm1lbWJlcnMoKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENsYXNzTWVtYmVyc0Zyb21EZWNsYXJhdGlvbihcbiAgICBwcm9ncmFtOiB0cy5Qcm9ncmFtLCBjaGVja2VyOiB0cy5UeXBlQ2hlY2tlciwgc291cmNlOiB0cy5Tb3VyY2VGaWxlLFxuICAgIGRlY2xhcmF0aW9uOiB0cy5DbGFzc0RlY2xhcmF0aW9uKSB7XG4gIGNvbnN0IHR5cGUgPSBjaGVja2VyLmdldFR5cGVBdExvY2F0aW9uKGRlY2xhcmF0aW9uKTtcbiAgcmV0dXJuIG5ldyBUeXBlV3JhcHBlcih0eXBlLCB7bm9kZTogc291cmNlLCBwcm9ncmFtLCBjaGVja2VyfSkubWVtYmVycygpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2xhc3NGcm9tU3RhdGljU3ltYm9sKFxuICAgIHByb2dyYW06IHRzLlByb2dyYW0sIHR5cGU6IFN0YXRpY1N5bWJvbCk6IHRzLkNsYXNzRGVjbGFyYXRpb258dW5kZWZpbmVkIHtcbiAgY29uc3Qgc291cmNlID0gcHJvZ3JhbS5nZXRTb3VyY2VGaWxlKHR5cGUuZmlsZVBhdGgpO1xuICBpZiAoc291cmNlKSB7XG4gICAgcmV0dXJuIHRzLmZvckVhY2hDaGlsZChzb3VyY2UsIGNoaWxkID0+IHtcbiAgICAgIGlmIChjaGlsZC5raW5kID09PSB0cy5TeW50YXhLaW5kLkNsYXNzRGVjbGFyYXRpb24pIHtcbiAgICAgICAgY29uc3QgY2xhc3NEZWNsYXJhdGlvbiA9IGNoaWxkIGFzIHRzLkNsYXNzRGVjbGFyYXRpb247XG4gICAgICAgIGlmIChjbGFzc0RlY2xhcmF0aW9uLm5hbWUgIT0gbnVsbCAmJiBjbGFzc0RlY2xhcmF0aW9uLm5hbWUudGV4dCA9PT0gdHlwZS5uYW1lKSB7XG4gICAgICAgICAgcmV0dXJuIGNsYXNzRGVjbGFyYXRpb247XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KSBhcyh0cy5DbGFzc0RlY2xhcmF0aW9uIHwgdW5kZWZpbmVkKTtcbiAgfVxuXG4gIHJldHVybiB1bmRlZmluZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQaXBlc1RhYmxlKFxuICAgIHNvdXJjZTogdHMuU291cmNlRmlsZSwgcHJvZ3JhbTogdHMuUHJvZ3JhbSwgY2hlY2tlcjogdHMuVHlwZUNoZWNrZXIsXG4gICAgcGlwZXM6IENvbXBpbGVQaXBlU3VtbWFyeVtdKTogU3ltYm9sVGFibGUge1xuICByZXR1cm4gbmV3IFBpcGVzVGFibGUocGlwZXMsIHtwcm9ncmFtLCBjaGVja2VyLCBub2RlOiBzb3VyY2V9KTtcbn1cblxuY2xhc3MgVHlwZVNjcmlwdFN5bWJvbFF1ZXJ5IGltcGxlbWVudHMgU3ltYm9sUXVlcnkge1xuICBwcml2YXRlIHR5cGVDYWNoZSA9IG5ldyBNYXA8QnVpbHRpblR5cGUsIFN5bWJvbD4oKTtcbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIHByaXZhdGUgcGlwZXNDYWNoZSAhOiBTeW1ib2xUYWJsZTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgcHJvZ3JhbTogdHMuUHJvZ3JhbSwgcHJpdmF0ZSBjaGVja2VyOiB0cy5UeXBlQ2hlY2tlciwgcHJpdmF0ZSBzb3VyY2U6IHRzLlNvdXJjZUZpbGUsXG4gICAgICBwcml2YXRlIGZldGNoUGlwZXM6ICgpID0+IFN5bWJvbFRhYmxlKSB7fVxuXG4gIGdldFR5cGVLaW5kKHN5bWJvbDogU3ltYm9sKTogQnVpbHRpblR5cGUgeyByZXR1cm4gdHlwZUtpbmRPZih0aGlzLmdldFRzVHlwZU9mKHN5bWJvbCkpOyB9XG5cbiAgZ2V0QnVpbHRpblR5cGUoa2luZDogQnVpbHRpblR5cGUpOiBTeW1ib2wge1xuICAgIGxldCByZXN1bHQgPSB0aGlzLnR5cGVDYWNoZS5nZXQoa2luZCk7XG4gICAgaWYgKCFyZXN1bHQpIHtcbiAgICAgIGNvbnN0IHR5cGUgPSBnZXRCdWlsdGluVHlwZUZyb21UcyhcbiAgICAgICAgICBraW5kLCB7Y2hlY2tlcjogdGhpcy5jaGVja2VyLCBub2RlOiB0aGlzLnNvdXJjZSwgcHJvZ3JhbTogdGhpcy5wcm9ncmFtfSk7XG4gICAgICByZXN1bHQgPVxuICAgICAgICAgIG5ldyBUeXBlV3JhcHBlcih0eXBlLCB7cHJvZ3JhbTogdGhpcy5wcm9ncmFtLCBjaGVja2VyOiB0aGlzLmNoZWNrZXIsIG5vZGU6IHRoaXMuc291cmNlfSk7XG4gICAgICB0aGlzLnR5cGVDYWNoZS5zZXQoa2luZCwgcmVzdWx0KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGdldFR5cGVVbmlvbiguLi50eXBlczogU3ltYm9sW10pOiBTeW1ib2wge1xuICAgIC8vIE5vIEFQSSBleGlzdHMgc28gcmV0dXJuIGFueSBpZiB0aGUgdHlwZXMgYXJlIG5vdCBhbGwgdGhlIHNhbWUgdHlwZS5cbiAgICBsZXQgcmVzdWx0OiBTeW1ib2x8dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgIGlmICh0eXBlcy5sZW5ndGgpIHtcbiAgICAgIHJlc3VsdCA9IHR5cGVzWzBdO1xuICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCB0eXBlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAodHlwZXNbaV0gIT0gcmVzdWx0KSB7XG4gICAgICAgICAgcmVzdWx0ID0gdW5kZWZpbmVkO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQgfHwgdGhpcy5nZXRCdWlsdGluVHlwZShCdWlsdGluVHlwZS5BbnkpO1xuICB9XG5cbiAgZ2V0QXJyYXlUeXBlKHR5cGU6IFN5bWJvbCk6IFN5bWJvbCB7IHJldHVybiB0aGlzLmdldEJ1aWx0aW5UeXBlKEJ1aWx0aW5UeXBlLkFueSk7IH1cblxuICBnZXRFbGVtZW50VHlwZSh0eXBlOiBTeW1ib2wpOiBTeW1ib2x8dW5kZWZpbmVkIHtcbiAgICBpZiAodHlwZSBpbnN0YW5jZW9mIFR5cGVXcmFwcGVyKSB7XG4gICAgICBjb25zdCBlbGVtZW50VHlwZSA9IGdldFR5cGVQYXJhbWV0ZXJPZih0eXBlLnRzVHlwZSwgJ0FycmF5Jyk7XG4gICAgICBpZiAoZWxlbWVudFR5cGUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBUeXBlV3JhcHBlcihlbGVtZW50VHlwZSwgdHlwZS5jb250ZXh0KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBnZXROb25OdWxsYWJsZVR5cGUoc3ltYm9sOiBTeW1ib2wpOiBTeW1ib2wge1xuICAgIGlmIChzeW1ib2wgaW5zdGFuY2VvZiBUeXBlV3JhcHBlciAmJiAodHlwZW9mIHRoaXMuY2hlY2tlci5nZXROb25OdWxsYWJsZVR5cGUgPT0gJ2Z1bmN0aW9uJykpIHtcbiAgICAgIGNvbnN0IHRzVHlwZSA9IHN5bWJvbC50c1R5cGU7XG4gICAgICBjb25zdCBub25OdWxsYWJsZVR5cGUgPSB0aGlzLmNoZWNrZXIuZ2V0Tm9uTnVsbGFibGVUeXBlKHRzVHlwZSk7XG4gICAgICBpZiAobm9uTnVsbGFibGVUeXBlICE9IHRzVHlwZSkge1xuICAgICAgICByZXR1cm4gbmV3IFR5cGVXcmFwcGVyKG5vbk51bGxhYmxlVHlwZSwgc3ltYm9sLmNvbnRleHQpO1xuICAgICAgfSBlbHNlIGlmIChub25OdWxsYWJsZVR5cGUgPT0gdHNUeXBlKSB7XG4gICAgICAgIHJldHVybiBzeW1ib2w7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmdldEJ1aWx0aW5UeXBlKEJ1aWx0aW5UeXBlLkFueSk7XG4gIH1cblxuICBnZXRQaXBlcygpOiBTeW1ib2xUYWJsZSB7XG4gICAgbGV0IHJlc3VsdCA9IHRoaXMucGlwZXNDYWNoZTtcbiAgICBpZiAoIXJlc3VsdCkge1xuICAgICAgcmVzdWx0ID0gdGhpcy5waXBlc0NhY2hlID0gdGhpcy5mZXRjaFBpcGVzKCk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBnZXRUZW1wbGF0ZUNvbnRleHQodHlwZTogU3RhdGljU3ltYm9sKTogU3ltYm9sVGFibGV8dW5kZWZpbmVkIHtcbiAgICBjb25zdCBjb250ZXh0OiBUeXBlQ29udGV4dCA9IHtub2RlOiB0aGlzLnNvdXJjZSwgcHJvZ3JhbTogdGhpcy5wcm9ncmFtLCBjaGVja2VyOiB0aGlzLmNoZWNrZXJ9O1xuICAgIGNvbnN0IHR5cGVTeW1ib2wgPSBmaW5kQ2xhc3NTeW1ib2xJbkNvbnRleHQodHlwZSwgY29udGV4dCk7XG4gICAgaWYgKHR5cGVTeW1ib2wpIHtcbiAgICAgIGNvbnN0IGNvbnRleHRUeXBlID0gdGhpcy5nZXRUZW1wbGF0ZVJlZkNvbnRleHRUeXBlKHR5cGVTeW1ib2wpO1xuICAgICAgaWYgKGNvbnRleHRUeXBlKSByZXR1cm4gbmV3IFN5bWJvbFdyYXBwZXIoY29udGV4dFR5cGUsIGNvbnRleHQpLm1lbWJlcnMoKTtcbiAgICB9XG4gIH1cblxuICBnZXRUeXBlU3ltYm9sKHR5cGU6IFN0YXRpY1N5bWJvbCk6IFN5bWJvbHx1bmRlZmluZWQge1xuICAgIGNvbnN0IGNvbnRleHQ6IFR5cGVDb250ZXh0ID0ge25vZGU6IHRoaXMuc291cmNlLCBwcm9ncmFtOiB0aGlzLnByb2dyYW0sIGNoZWNrZXI6IHRoaXMuY2hlY2tlcn07XG4gICAgY29uc3QgdHlwZVN5bWJvbCA9IGZpbmRDbGFzc1N5bWJvbEluQ29udGV4dCh0eXBlLCBjb250ZXh0KTtcbiAgICByZXR1cm4gdHlwZVN5bWJvbCAmJiBuZXcgU3ltYm9sV3JhcHBlcih0eXBlU3ltYm9sLCBjb250ZXh0KTtcbiAgfVxuXG4gIGNyZWF0ZVN5bWJvbFRhYmxlKHN5bWJvbHM6IFN5bWJvbERlY2xhcmF0aW9uW10pOiBTeW1ib2xUYWJsZSB7XG4gICAgY29uc3QgcmVzdWx0ID0gbmV3IE1hcFN5bWJvbFRhYmxlKCk7XG4gICAgcmVzdWx0LmFkZEFsbChzeW1ib2xzLm1hcChzID0+IG5ldyBEZWNsYXJlZFN5bWJvbChzKSkpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBtZXJnZVN5bWJvbFRhYmxlKHN5bWJvbFRhYmxlczogU3ltYm9sVGFibGVbXSk6IFN5bWJvbFRhYmxlIHtcbiAgICBjb25zdCByZXN1bHQgPSBuZXcgTWFwU3ltYm9sVGFibGUoKTtcbiAgICBmb3IgKGNvbnN0IHN5bWJvbFRhYmxlIG9mIHN5bWJvbFRhYmxlcykge1xuICAgICAgcmVzdWx0LmFkZEFsbChzeW1ib2xUYWJsZS52YWx1ZXMoKSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBnZXRTcGFuQXQobGluZTogbnVtYmVyLCBjb2x1bW46IG51bWJlcik6IFNwYW58dW5kZWZpbmVkIHtcbiAgICByZXR1cm4gc3BhbkF0KHRoaXMuc291cmNlLCBsaW5lLCBjb2x1bW4pO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRUZW1wbGF0ZVJlZkNvbnRleHRUeXBlKHR5cGVTeW1ib2w6IHRzLlN5bWJvbCk6IHRzLlN5bWJvbHx1bmRlZmluZWQge1xuICAgIGNvbnN0IHR5cGUgPSB0aGlzLmNoZWNrZXIuZ2V0VHlwZU9mU3ltYm9sQXRMb2NhdGlvbih0eXBlU3ltYm9sLCB0aGlzLnNvdXJjZSk7XG4gICAgY29uc3QgY29uc3RydWN0b3IgPSB0eXBlLnN5bWJvbCAmJiB0eXBlLnN5bWJvbC5tZW1iZXJzICYmXG4gICAgICAgIGdldEZyb21TeW1ib2xUYWJsZSh0eXBlLnN5bWJvbC5tZW1iZXJzICEsICdfX2NvbnN0cnVjdG9yJyk7XG5cbiAgICBpZiAoY29uc3RydWN0b3IpIHtcbiAgICAgIGNvbnN0IGNvbnN0cnVjdG9yRGVjbGFyYXRpb24gPSBjb25zdHJ1Y3Rvci5kZWNsYXJhdGlvbnMgIVswXSBhcyB0cy5Db25zdHJ1Y3RvclR5cGVOb2RlO1xuICAgICAgZm9yIChjb25zdCBwYXJhbWV0ZXIgb2YgY29uc3RydWN0b3JEZWNsYXJhdGlvbi5wYXJhbWV0ZXJzKSB7XG4gICAgICAgIGNvbnN0IHR5cGUgPSB0aGlzLmNoZWNrZXIuZ2V0VHlwZUF0TG9jYXRpb24ocGFyYW1ldGVyLnR5cGUgISk7XG4gICAgICAgIGlmICh0eXBlLnN5bWJvbCAhLm5hbWUgPT0gJ1RlbXBsYXRlUmVmJyAmJiBpc1JlZmVyZW5jZVR5cGUodHlwZSkpIHtcbiAgICAgICAgICBjb25zdCB0eXBlUmVmZXJlbmNlID0gdHlwZSBhcyB0cy5UeXBlUmVmZXJlbmNlO1xuICAgICAgICAgIGlmICh0eXBlUmVmZXJlbmNlLnR5cGVBcmd1bWVudHMgJiYgdHlwZVJlZmVyZW5jZS50eXBlQXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIHR5cGVSZWZlcmVuY2UudHlwZUFyZ3VtZW50c1swXS5zeW1ib2w7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBnZXRUc1R5cGVPZihzeW1ib2w6IFN5bWJvbCk6IHRzLlR5cGV8dW5kZWZpbmVkIHtcbiAgICBjb25zdCB0eXBlID0gdGhpcy5nZXRUeXBlV3JhcHBlcihzeW1ib2wpO1xuICAgIHJldHVybiB0eXBlICYmIHR5cGUudHNUeXBlO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRUeXBlV3JhcHBlcihzeW1ib2w6IFN5bWJvbCk6IFR5cGVXcmFwcGVyfHVuZGVmaW5lZCB7XG4gICAgbGV0IHR5cGU6IFR5cGVXcmFwcGVyfHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICBpZiAoc3ltYm9sIGluc3RhbmNlb2YgVHlwZVdyYXBwZXIpIHtcbiAgICAgIHR5cGUgPSBzeW1ib2w7XG4gICAgfSBlbHNlIGlmIChzeW1ib2wudHlwZSBpbnN0YW5jZW9mIFR5cGVXcmFwcGVyKSB7XG4gICAgICB0eXBlID0gc3ltYm9sLnR5cGU7XG4gICAgfVxuICAgIHJldHVybiB0eXBlO1xuICB9XG59XG5cbmZ1bmN0aW9uIHR5cGVDYWxsYWJsZSh0eXBlOiB0cy5UeXBlKTogYm9vbGVhbiB7XG4gIGNvbnN0IHNpZ25hdHVyZXMgPSB0eXBlLmdldENhbGxTaWduYXR1cmVzKCk7XG4gIHJldHVybiBzaWduYXR1cmVzICYmIHNpZ25hdHVyZXMubGVuZ3RoICE9IDA7XG59XG5cbmZ1bmN0aW9uIHNpZ25hdHVyZXNPZih0eXBlOiB0cy5UeXBlLCBjb250ZXh0OiBUeXBlQ29udGV4dCk6IFNpZ25hdHVyZVtdIHtcbiAgcmV0dXJuIHR5cGUuZ2V0Q2FsbFNpZ25hdHVyZXMoKS5tYXAocyA9PiBuZXcgU2lnbmF0dXJlV3JhcHBlcihzLCBjb250ZXh0KSk7XG59XG5cbmZ1bmN0aW9uIHNlbGVjdFNpZ25hdHVyZSh0eXBlOiB0cy5UeXBlLCBjb250ZXh0OiBUeXBlQ29udGV4dCwgdHlwZXM6IFN5bWJvbFtdKTogU2lnbmF0dXJlfFxuICAgIHVuZGVmaW5lZCB7XG4gIC8vIFRPRE86IERvIGEgYmV0dGVyIGpvYiBvZiBzZWxlY3RpbmcgdGhlIHJpZ2h0IHNpZ25hdHVyZS5cbiAgY29uc3Qgc2lnbmF0dXJlcyA9IHR5cGUuZ2V0Q2FsbFNpZ25hdHVyZXMoKTtcbiAgcmV0dXJuIHNpZ25hdHVyZXMubGVuZ3RoID8gbmV3IFNpZ25hdHVyZVdyYXBwZXIoc2lnbmF0dXJlc1swXSwgY29udGV4dCkgOiB1bmRlZmluZWQ7XG59XG5cbmNsYXNzIFR5cGVXcmFwcGVyIGltcGxlbWVudHMgU3ltYm9sIHtcbiAgY29uc3RydWN0b3IocHVibGljIHRzVHlwZTogdHMuVHlwZSwgcHVibGljIGNvbnRleHQ6IFR5cGVDb250ZXh0KSB7XG4gICAgaWYgKCF0c1R5cGUpIHtcbiAgICAgIHRocm93IEVycm9yKCdJbnRlcm5hbDogbnVsbCB0eXBlJyk7XG4gICAgfVxuICB9XG5cbiAgZ2V0IG5hbWUoKTogc3RyaW5nIHtcbiAgICBjb25zdCBzeW1ib2wgPSB0aGlzLnRzVHlwZS5zeW1ib2w7XG4gICAgcmV0dXJuIChzeW1ib2wgJiYgc3ltYm9sLm5hbWUpIHx8ICc8YW5vbnltb3VzPic7XG4gIH1cblxuICBwdWJsaWMgcmVhZG9ubHkga2luZDogRGVjbGFyYXRpb25LaW5kID0gJ3R5cGUnO1xuXG4gIHB1YmxpYyByZWFkb25seSBsYW5ndWFnZTogc3RyaW5nID0gJ3R5cGVzY3JpcHQnO1xuXG4gIHB1YmxpYyByZWFkb25seSB0eXBlOiBTeW1ib2x8dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuXG4gIHB1YmxpYyByZWFkb25seSBjb250YWluZXI6IFN5bWJvbHx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG5cbiAgcHVibGljIHJlYWRvbmx5IHB1YmxpYzogYm9vbGVhbiA9IHRydWU7XG5cbiAgZ2V0IGNhbGxhYmxlKCk6IGJvb2xlYW4geyByZXR1cm4gdHlwZUNhbGxhYmxlKHRoaXMudHNUeXBlKTsgfVxuXG4gIGdldCBudWxsYWJsZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5jb250ZXh0LmNoZWNrZXIuZ2V0Tm9uTnVsbGFibGVUeXBlKHRoaXMudHNUeXBlKSAhPSB0aGlzLnRzVHlwZTtcbiAgfVxuXG4gIGdldCBkZWZpbml0aW9uKCk6IERlZmluaXRpb258dW5kZWZpbmVkIHtcbiAgICBjb25zdCBzeW1ib2wgPSB0aGlzLnRzVHlwZS5nZXRTeW1ib2woKTtcbiAgICByZXR1cm4gc3ltYm9sID8gZGVmaW5pdGlvbkZyb21Uc1N5bWJvbChzeW1ib2wpIDogdW5kZWZpbmVkO1xuICB9XG5cbiAgbWVtYmVycygpOiBTeW1ib2xUYWJsZSB7XG4gICAgcmV0dXJuIG5ldyBTeW1ib2xUYWJsZVdyYXBwZXIodGhpcy50c1R5cGUuZ2V0UHJvcGVydGllcygpLCB0aGlzLmNvbnRleHQpO1xuICB9XG5cbiAgc2lnbmF0dXJlcygpOiBTaWduYXR1cmVbXSB7IHJldHVybiBzaWduYXR1cmVzT2YodGhpcy50c1R5cGUsIHRoaXMuY29udGV4dCk7IH1cblxuICBzZWxlY3RTaWduYXR1cmUodHlwZXM6IFN5bWJvbFtdKTogU2lnbmF0dXJlfHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHNlbGVjdFNpZ25hdHVyZSh0aGlzLnRzVHlwZSwgdGhpcy5jb250ZXh0LCB0eXBlcyk7XG4gIH1cblxuICBpbmRleGVkKGFyZ3VtZW50OiBTeW1ib2wpOiBTeW1ib2x8dW5kZWZpbmVkIHsgcmV0dXJuIHVuZGVmaW5lZDsgfVxufVxuXG5jbGFzcyBTeW1ib2xXcmFwcGVyIGltcGxlbWVudHMgU3ltYm9sIHtcbiAgcHJpdmF0ZSBzeW1ib2w6IHRzLlN5bWJvbDtcbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIHByaXZhdGUgX3RzVHlwZSAhOiB0cy5UeXBlO1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgcHJpdmF0ZSBfbWVtYmVycyAhOiBTeW1ib2xUYWJsZTtcblxuICBwdWJsaWMgcmVhZG9ubHkgbnVsbGFibGU6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIHJlYWRvbmx5IGxhbmd1YWdlOiBzdHJpbmcgPSAndHlwZXNjcmlwdCc7XG5cbiAgY29uc3RydWN0b3Ioc3ltYm9sOiB0cy5TeW1ib2wsIHByaXZhdGUgY29udGV4dDogVHlwZUNvbnRleHQpIHtcbiAgICB0aGlzLnN5bWJvbCA9IHN5bWJvbCAmJiBjb250ZXh0ICYmIChzeW1ib2wuZmxhZ3MgJiB0cy5TeW1ib2xGbGFncy5BbGlhcykgP1xuICAgICAgICBjb250ZXh0LmNoZWNrZXIuZ2V0QWxpYXNlZFN5bWJvbChzeW1ib2wpIDpcbiAgICAgICAgc3ltYm9sO1xuICB9XG5cbiAgZ2V0IG5hbWUoKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMuc3ltYm9sLm5hbWU7IH1cblxuICBnZXQga2luZCgpOiBEZWNsYXJhdGlvbktpbmQgeyByZXR1cm4gdGhpcy5jYWxsYWJsZSA/ICdtZXRob2QnIDogJ3Byb3BlcnR5JzsgfVxuXG4gIGdldCB0eXBlKCk6IFN5bWJvbHx1bmRlZmluZWQgeyByZXR1cm4gbmV3IFR5cGVXcmFwcGVyKHRoaXMudHNUeXBlLCB0aGlzLmNvbnRleHQpOyB9XG5cbiAgZ2V0IGNvbnRhaW5lcigpOiBTeW1ib2x8dW5kZWZpbmVkIHsgcmV0dXJuIGdldENvbnRhaW5lck9mKHRoaXMuc3ltYm9sLCB0aGlzLmNvbnRleHQpOyB9XG5cbiAgZ2V0IHB1YmxpYygpOiBib29sZWFuIHtcbiAgICAvLyBTeW1ib2xzIHRoYXQgYXJlIG5vdCBleHBsaWNpdGx5IG1hZGUgcHJpdmF0ZSBhcmUgcHVibGljLlxuICAgIHJldHVybiAhaXNTeW1ib2xQcml2YXRlKHRoaXMuc3ltYm9sKTtcbiAgfVxuXG4gIGdldCBjYWxsYWJsZSgpOiBib29sZWFuIHsgcmV0dXJuIHR5cGVDYWxsYWJsZSh0aGlzLnRzVHlwZSk7IH1cblxuICBnZXQgZGVmaW5pdGlvbigpOiBEZWZpbml0aW9uIHsgcmV0dXJuIGRlZmluaXRpb25Gcm9tVHNTeW1ib2wodGhpcy5zeW1ib2wpOyB9XG5cbiAgbWVtYmVycygpOiBTeW1ib2xUYWJsZSB7XG4gICAgaWYgKCF0aGlzLl9tZW1iZXJzKSB7XG4gICAgICBpZiAoKHRoaXMuc3ltYm9sLmZsYWdzICYgKHRzLlN5bWJvbEZsYWdzLkNsYXNzIHwgdHMuU3ltYm9sRmxhZ3MuSW50ZXJmYWNlKSkgIT0gMCkge1xuICAgICAgICBjb25zdCBkZWNsYXJlZFR5cGUgPSB0aGlzLmNvbnRleHQuY2hlY2tlci5nZXREZWNsYXJlZFR5cGVPZlN5bWJvbCh0aGlzLnN5bWJvbCk7XG4gICAgICAgIGNvbnN0IHR5cGVXcmFwcGVyID0gbmV3IFR5cGVXcmFwcGVyKGRlY2xhcmVkVHlwZSwgdGhpcy5jb250ZXh0KTtcbiAgICAgICAgdGhpcy5fbWVtYmVycyA9IHR5cGVXcmFwcGVyLm1lbWJlcnMoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX21lbWJlcnMgPSBuZXcgU3ltYm9sVGFibGVXcmFwcGVyKHRoaXMuc3ltYm9sLm1lbWJlcnMgISwgdGhpcy5jb250ZXh0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX21lbWJlcnM7XG4gIH1cblxuICBzaWduYXR1cmVzKCk6IFNpZ25hdHVyZVtdIHsgcmV0dXJuIHNpZ25hdHVyZXNPZih0aGlzLnRzVHlwZSwgdGhpcy5jb250ZXh0KTsgfVxuXG4gIHNlbGVjdFNpZ25hdHVyZSh0eXBlczogU3ltYm9sW10pOiBTaWduYXR1cmV8dW5kZWZpbmVkIHtcbiAgICByZXR1cm4gc2VsZWN0U2lnbmF0dXJlKHRoaXMudHNUeXBlLCB0aGlzLmNvbnRleHQsIHR5cGVzKTtcbiAgfVxuXG4gIGluZGV4ZWQoYXJndW1lbnQ6IFN5bWJvbCk6IFN5bWJvbHx1bmRlZmluZWQgeyByZXR1cm4gdW5kZWZpbmVkOyB9XG5cbiAgcHJpdmF0ZSBnZXQgdHNUeXBlKCk6IHRzLlR5cGUge1xuICAgIGxldCB0eXBlID0gdGhpcy5fdHNUeXBlO1xuICAgIGlmICghdHlwZSkge1xuICAgICAgdHlwZSA9IHRoaXMuX3RzVHlwZSA9XG4gICAgICAgICAgdGhpcy5jb250ZXh0LmNoZWNrZXIuZ2V0VHlwZU9mU3ltYm9sQXRMb2NhdGlvbih0aGlzLnN5bWJvbCwgdGhpcy5jb250ZXh0Lm5vZGUpO1xuICAgIH1cbiAgICByZXR1cm4gdHlwZTtcbiAgfVxufVxuXG5jbGFzcyBEZWNsYXJlZFN5bWJvbCBpbXBsZW1lbnRzIFN5bWJvbCB7XG4gIHB1YmxpYyByZWFkb25seSBsYW5ndWFnZTogc3RyaW5nID0gJ25nLXRlbXBsYXRlJztcblxuICBwdWJsaWMgcmVhZG9ubHkgbnVsbGFibGU6IGJvb2xlYW4gPSBmYWxzZTtcblxuICBwdWJsaWMgcmVhZG9ubHkgcHVibGljOiBib29sZWFuID0gdHJ1ZTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGRlY2xhcmF0aW9uOiBTeW1ib2xEZWNsYXJhdGlvbikge31cblxuICBnZXQgbmFtZSgpIHsgcmV0dXJuIHRoaXMuZGVjbGFyYXRpb24ubmFtZTsgfVxuXG4gIGdldCBraW5kKCkgeyByZXR1cm4gdGhpcy5kZWNsYXJhdGlvbi5raW5kOyB9XG5cbiAgZ2V0IGNvbnRhaW5lcigpOiBTeW1ib2x8dW5kZWZpbmVkIHsgcmV0dXJuIHVuZGVmaW5lZDsgfVxuXG4gIGdldCB0eXBlKCkgeyByZXR1cm4gdGhpcy5kZWNsYXJhdGlvbi50eXBlOyB9XG5cbiAgZ2V0IGNhbGxhYmxlKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5kZWNsYXJhdGlvbi50eXBlLmNhbGxhYmxlOyB9XG5cblxuICBnZXQgZGVmaW5pdGlvbigpOiBEZWZpbml0aW9uIHsgcmV0dXJuIHRoaXMuZGVjbGFyYXRpb24uZGVmaW5pdGlvbjsgfVxuXG4gIG1lbWJlcnMoKTogU3ltYm9sVGFibGUgeyByZXR1cm4gdGhpcy5kZWNsYXJhdGlvbi50eXBlLm1lbWJlcnMoKTsgfVxuXG4gIHNpZ25hdHVyZXMoKTogU2lnbmF0dXJlW10geyByZXR1cm4gdGhpcy5kZWNsYXJhdGlvbi50eXBlLnNpZ25hdHVyZXMoKTsgfVxuXG4gIHNlbGVjdFNpZ25hdHVyZSh0eXBlczogU3ltYm9sW10pOiBTaWduYXR1cmV8dW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5kZWNsYXJhdGlvbi50eXBlLnNlbGVjdFNpZ25hdHVyZSh0eXBlcyk7XG4gIH1cblxuICBpbmRleGVkKGFyZ3VtZW50OiBTeW1ib2wpOiBTeW1ib2x8dW5kZWZpbmVkIHsgcmV0dXJuIHVuZGVmaW5lZDsgfVxufVxuXG5jbGFzcyBTaWduYXR1cmVXcmFwcGVyIGltcGxlbWVudHMgU2lnbmF0dXJlIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBzaWduYXR1cmU6IHRzLlNpZ25hdHVyZSwgcHJpdmF0ZSBjb250ZXh0OiBUeXBlQ29udGV4dCkge31cblxuICBnZXQgYXJndW1lbnRzKCk6IFN5bWJvbFRhYmxlIHtcbiAgICByZXR1cm4gbmV3IFN5bWJvbFRhYmxlV3JhcHBlcih0aGlzLnNpZ25hdHVyZS5nZXRQYXJhbWV0ZXJzKCksIHRoaXMuY29udGV4dCk7XG4gIH1cblxuICBnZXQgcmVzdWx0KCk6IFN5bWJvbCB7IHJldHVybiBuZXcgVHlwZVdyYXBwZXIodGhpcy5zaWduYXR1cmUuZ2V0UmV0dXJuVHlwZSgpLCB0aGlzLmNvbnRleHQpOyB9XG59XG5cbmNsYXNzIFNpZ25hdHVyZVJlc3VsdE92ZXJyaWRlIGltcGxlbWVudHMgU2lnbmF0dXJlIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBzaWduYXR1cmU6IFNpZ25hdHVyZSwgcHJpdmF0ZSByZXN1bHRUeXBlOiBTeW1ib2wpIHt9XG5cbiAgZ2V0IGFyZ3VtZW50cygpOiBTeW1ib2xUYWJsZSB7IHJldHVybiB0aGlzLnNpZ25hdHVyZS5hcmd1bWVudHM7IH1cblxuICBnZXQgcmVzdWx0KCk6IFN5bWJvbCB7IHJldHVybiB0aGlzLnJlc3VsdFR5cGU7IH1cbn1cblxuLyoqXG4gKiBJbmRpY2F0ZXMgdGhlIGxvd2VyIGJvdW5kIFR5cGVTY3JpcHQgdmVyc2lvbiBzdXBwb3J0aW5nIGBTeW1ib2xUYWJsZWAgYXMgYW4gRVM2IGBNYXBgLlxuICogRm9yIGxvd2VyIHZlcnNpb25zLCBgU3ltYm9sVGFibGVgIGlzIGltcGxlbWVudGVkIGFzIGEgZGljdGlvbmFyeVxuICovXG5jb25zdCBNSU5fVFNfVkVSU0lPTl9TVVBQT1JUSU5HX01BUCA9ICcyLjInO1xuXG5leHBvcnQgY29uc3QgdG9TeW1ib2xUYWJsZUZhY3RvcnkgPSAodHNWZXJzaW9uOiBzdHJpbmcpID0+IChzeW1ib2xzOiB0cy5TeW1ib2xbXSkgPT4ge1xuICBpZiAoaXNWZXJzaW9uQmV0d2Vlbih0c1ZlcnNpb24sIE1JTl9UU19WRVJTSU9OX1NVUFBPUlRJTkdfTUFQKSkge1xuICAgIC8vIOKIgCBUeXBlc2NyaXB0IHZlcnNpb24gPj0gMi4yLCBgU3ltYm9sVGFibGVgIGlzIGltcGxlbWVudGVkIGFzIGFuIEVTNiBgTWFwYFxuICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBNYXA8c3RyaW5nLCB0cy5TeW1ib2w+KCk7XG4gICAgZm9yIChjb25zdCBzeW1ib2wgb2Ygc3ltYm9scykge1xuICAgICAgcmVzdWx0LnNldChzeW1ib2wubmFtZSwgc3ltYm9sKTtcbiAgICB9XG4gICAgLy8gRmlyc3QsIHRlbGwgdGhlIGNvbXBpbGVyIHRoYXQgYHJlc3VsdGAgaXMgb2YgdHlwZSBgYW55YC4gVGhlbiwgdXNlIGEgc2Vjb25kIHR5cGUgYXNzZXJ0aW9uXG4gICAgLy8gdG8gYHRzLlN5bWJvbFRhYmxlYC5cbiAgICAvLyBPdGhlcndpc2UsIGBNYXA8c3RyaW5nLCB0cy5TeW1ib2w+YCBhbmQgYHRzLlN5bWJvbFRhYmxlYCB3aWxsIGJlIGNvbnNpZGVyZWQgYXMgaW5jb21wYXRpYmxlXG4gICAgLy8gdHlwZXMgYnkgdGhlIGNvbXBpbGVyXG4gICAgcmV0dXJuIDx0cy5TeW1ib2xUYWJsZT4oPGFueT5yZXN1bHQpO1xuICB9XG5cbiAgLy8g4oiAIFR5cGVzY3JpcHQgdmVyc2lvbiA8IDIuMiwgYFN5bWJvbFRhYmxlYCBpcyBpbXBsZW1lbnRlZCBhcyBhIGRpY3Rpb25hcnlcbiAgY29uc3QgcmVzdWx0OiB7W25hbWU6IHN0cmluZ106IHRzLlN5bWJvbH0gPSB7fTtcbiAgZm9yIChjb25zdCBzeW1ib2wgb2Ygc3ltYm9scykge1xuICAgIHJlc3VsdFtzeW1ib2wubmFtZV0gPSBzeW1ib2w7XG4gIH1cbiAgcmV0dXJuIDx0cy5TeW1ib2xUYWJsZT4oPGFueT5yZXN1bHQpO1xufTtcblxuZnVuY3Rpb24gdG9TeW1ib2xzKHN5bWJvbFRhYmxlOiB0cy5TeW1ib2xUYWJsZSB8IHVuZGVmaW5lZCk6IHRzLlN5bWJvbFtdIHtcbiAgaWYgKCFzeW1ib2xUYWJsZSkgcmV0dXJuIFtdO1xuXG4gIGNvbnN0IHRhYmxlID0gc3ltYm9sVGFibGUgYXMgYW55O1xuXG4gIGlmICh0eXBlb2YgdGFibGUudmFsdWVzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20odGFibGUudmFsdWVzKCkpIGFzIHRzLlN5bWJvbFtdO1xuICB9XG5cbiAgY29uc3QgcmVzdWx0OiB0cy5TeW1ib2xbXSA9IFtdO1xuXG4gIGNvbnN0IG93biA9IHR5cGVvZiB0YWJsZS5oYXNPd25Qcm9wZXJ0eSA9PT0gJ2Z1bmN0aW9uJyA/XG4gICAgICAobmFtZTogc3RyaW5nKSA9PiB0YWJsZS5oYXNPd25Qcm9wZXJ0eShuYW1lKSA6XG4gICAgICAobmFtZTogc3RyaW5nKSA9PiAhIXRhYmxlW25hbWVdO1xuXG4gIGZvciAoY29uc3QgbmFtZSBpbiB0YWJsZSkge1xuICAgIGlmIChvd24obmFtZSkpIHtcbiAgICAgIHJlc3VsdC5wdXNoKHRhYmxlW25hbWVdKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuY2xhc3MgU3ltYm9sVGFibGVXcmFwcGVyIGltcGxlbWVudHMgU3ltYm9sVGFibGUge1xuICBwcml2YXRlIHN5bWJvbHM6IHRzLlN5bWJvbFtdO1xuICBwcml2YXRlIHN5bWJvbFRhYmxlOiB0cy5TeW1ib2xUYWJsZTtcblxuICBjb25zdHJ1Y3RvcihzeW1ib2xzOiB0cy5TeW1ib2xUYWJsZXx0cy5TeW1ib2xbXXx1bmRlZmluZWQsIHByaXZhdGUgY29udGV4dDogVHlwZUNvbnRleHQpIHtcbiAgICBzeW1ib2xzID0gc3ltYm9scyB8fCBbXTtcblxuICAgIGlmIChBcnJheS5pc0FycmF5KHN5bWJvbHMpKSB7XG4gICAgICB0aGlzLnN5bWJvbHMgPSBzeW1ib2xzO1xuICAgICAgY29uc3QgdG9TeW1ib2xUYWJsZSA9IHRvU3ltYm9sVGFibGVGYWN0b3J5KHRzLnZlcnNpb24pO1xuICAgICAgdGhpcy5zeW1ib2xUYWJsZSA9IHRvU3ltYm9sVGFibGUoc3ltYm9scyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc3ltYm9scyA9IHRvU3ltYm9scyhzeW1ib2xzKTtcbiAgICAgIHRoaXMuc3ltYm9sVGFibGUgPSBzeW1ib2xzO1xuICAgIH1cbiAgfVxuXG4gIGdldCBzaXplKCk6IG51bWJlciB7IHJldHVybiB0aGlzLnN5bWJvbHMubGVuZ3RoOyB9XG5cbiAgZ2V0KGtleTogc3RyaW5nKTogU3ltYm9sfHVuZGVmaW5lZCB7XG4gICAgY29uc3Qgc3ltYm9sID0gZ2V0RnJvbVN5bWJvbFRhYmxlKHRoaXMuc3ltYm9sVGFibGUsIGtleSk7XG4gICAgcmV0dXJuIHN5bWJvbCA/IG5ldyBTeW1ib2xXcmFwcGVyKHN5bWJvbCwgdGhpcy5jb250ZXh0KSA6IHVuZGVmaW5lZDtcbiAgfVxuXG4gIGhhcyhrZXk6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHRhYmxlOiBhbnkgPSB0aGlzLnN5bWJvbFRhYmxlO1xuICAgIHJldHVybiAodHlwZW9mIHRhYmxlLmhhcyA9PT0gJ2Z1bmN0aW9uJykgPyB0YWJsZS5oYXMoa2V5KSA6IHRhYmxlW2tleV0gIT0gbnVsbDtcbiAgfVxuXG4gIHZhbHVlcygpOiBTeW1ib2xbXSB7IHJldHVybiB0aGlzLnN5bWJvbHMubWFwKHMgPT4gbmV3IFN5bWJvbFdyYXBwZXIocywgdGhpcy5jb250ZXh0KSk7IH1cbn1cblxuY2xhc3MgTWFwU3ltYm9sVGFibGUgaW1wbGVtZW50cyBTeW1ib2xUYWJsZSB7XG4gIHByaXZhdGUgbWFwID0gbmV3IE1hcDxzdHJpbmcsIFN5bWJvbD4oKTtcbiAgcHJpdmF0ZSBfdmFsdWVzOiBTeW1ib2xbXSA9IFtdO1xuXG4gIGdldCBzaXplKCk6IG51bWJlciB7IHJldHVybiB0aGlzLm1hcC5zaXplOyB9XG5cbiAgZ2V0KGtleTogc3RyaW5nKTogU3ltYm9sfHVuZGVmaW5lZCB7IHJldHVybiB0aGlzLm1hcC5nZXQoa2V5KTsgfVxuXG4gIGFkZChzeW1ib2w6IFN5bWJvbCkge1xuICAgIGlmICh0aGlzLm1hcC5oYXMoc3ltYm9sLm5hbWUpKSB7XG4gICAgICBjb25zdCBwcmV2aW91cyA9IHRoaXMubWFwLmdldChzeW1ib2wubmFtZSkgITtcbiAgICAgIHRoaXMuX3ZhbHVlc1t0aGlzLl92YWx1ZXMuaW5kZXhPZihwcmV2aW91cyldID0gc3ltYm9sO1xuICAgIH1cbiAgICB0aGlzLm1hcC5zZXQoc3ltYm9sLm5hbWUsIHN5bWJvbCk7XG4gICAgdGhpcy5fdmFsdWVzLnB1c2goc3ltYm9sKTtcbiAgfVxuXG4gIGFkZEFsbChzeW1ib2xzOiBTeW1ib2xbXSkge1xuICAgIGZvciAoY29uc3Qgc3ltYm9sIG9mIHN5bWJvbHMpIHtcbiAgICAgIHRoaXMuYWRkKHN5bWJvbCk7XG4gICAgfVxuICB9XG5cbiAgaGFzKGtleTogc3RyaW5nKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLm1hcC5oYXMoa2V5KTsgfVxuXG4gIHZhbHVlcygpOiBTeW1ib2xbXSB7XG4gICAgLy8gU3dpdGNoIHRvIHRoaXMubWFwLnZhbHVlcyBvbmNlIGl0ZXJhYmxlcyBhcmUgc3VwcG9ydGVkIGJ5IHRoZSB0YXJnZXQgbGFuZ3VhZ2UuXG4gICAgcmV0dXJuIHRoaXMuX3ZhbHVlcztcbiAgfVxufVxuXG5jbGFzcyBQaXBlc1RhYmxlIGltcGxlbWVudHMgU3ltYm9sVGFibGUge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBpcGVzOiBDb21waWxlUGlwZVN1bW1hcnlbXSwgcHJpdmF0ZSBjb250ZXh0OiBUeXBlQ29udGV4dCkge31cblxuICBnZXQgc2l6ZSgpIHsgcmV0dXJuIHRoaXMucGlwZXMubGVuZ3RoOyB9XG5cbiAgZ2V0KGtleTogc3RyaW5nKTogU3ltYm9sfHVuZGVmaW5lZCB7XG4gICAgY29uc3QgcGlwZSA9IHRoaXMucGlwZXMuZmluZChwaXBlID0+IHBpcGUubmFtZSA9PSBrZXkpO1xuICAgIGlmIChwaXBlKSB7XG4gICAgICByZXR1cm4gbmV3IFBpcGVTeW1ib2wocGlwZSwgdGhpcy5jb250ZXh0KTtcbiAgICB9XG4gIH1cblxuICBoYXMoa2V5OiBzdHJpbmcpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMucGlwZXMuZmluZChwaXBlID0+IHBpcGUubmFtZSA9PSBrZXkpICE9IG51bGw7IH1cblxuICB2YWx1ZXMoKTogU3ltYm9sW10geyByZXR1cm4gdGhpcy5waXBlcy5tYXAocGlwZSA9PiBuZXcgUGlwZVN5bWJvbChwaXBlLCB0aGlzLmNvbnRleHQpKTsgfVxufVxuXG4vLyBUaGlzIG1hdGNoZXMgLmQudHMgZmlsZXMgdGhhdCBsb29rIGxpa2UgXCIuLi4vPHBhY2thZ2UtbmFtZT4vPHBhY2thZ2UtbmFtZT4uZC50c1wiLFxuY29uc3QgSU5ERVhfUEFUVEVSTiA9IC9bXFxcXC9dKFteXFxcXC9dKylbXFxcXC9dXFwxXFwuZFxcLnRzJC87XG5cbmNsYXNzIFBpcGVTeW1ib2wgaW1wbGVtZW50cyBTeW1ib2wge1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgcHJpdmF0ZSBfdHNUeXBlICE6IHRzLlR5cGU7XG4gIHB1YmxpYyByZWFkb25seSBraW5kOiBEZWNsYXJhdGlvbktpbmQgPSAncGlwZSc7XG4gIHB1YmxpYyByZWFkb25seSBsYW5ndWFnZTogc3RyaW5nID0gJ3R5cGVzY3JpcHQnO1xuICBwdWJsaWMgcmVhZG9ubHkgY29udGFpbmVyOiBTeW1ib2x8dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICBwdWJsaWMgcmVhZG9ubHkgY2FsbGFibGU6IGJvb2xlYW4gPSB0cnVlO1xuICBwdWJsaWMgcmVhZG9ubHkgbnVsbGFibGU6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIHJlYWRvbmx5IHB1YmxpYzogYm9vbGVhbiA9IHRydWU7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBwaXBlOiBDb21waWxlUGlwZVN1bW1hcnksIHByaXZhdGUgY29udGV4dDogVHlwZUNvbnRleHQpIHt9XG5cbiAgZ2V0IG5hbWUoKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMucGlwZS5uYW1lOyB9XG5cbiAgZ2V0IHR5cGUoKTogU3ltYm9sfHVuZGVmaW5lZCB7IHJldHVybiBuZXcgVHlwZVdyYXBwZXIodGhpcy50c1R5cGUsIHRoaXMuY29udGV4dCk7IH1cblxuICBnZXQgZGVmaW5pdGlvbigpOiBEZWZpbml0aW9ufHVuZGVmaW5lZCB7XG4gICAgY29uc3Qgc3ltYm9sID0gdGhpcy50c1R5cGUuZ2V0U3ltYm9sKCk7XG4gICAgcmV0dXJuIHN5bWJvbCA/IGRlZmluaXRpb25Gcm9tVHNTeW1ib2woc3ltYm9sKSA6IHVuZGVmaW5lZDtcbiAgfVxuXG4gIG1lbWJlcnMoKTogU3ltYm9sVGFibGUgeyByZXR1cm4gRW1wdHlUYWJsZS5pbnN0YW5jZTsgfVxuXG4gIHNpZ25hdHVyZXMoKTogU2lnbmF0dXJlW10geyByZXR1cm4gc2lnbmF0dXJlc09mKHRoaXMudHNUeXBlLCB0aGlzLmNvbnRleHQpOyB9XG5cbiAgc2VsZWN0U2lnbmF0dXJlKHR5cGVzOiBTeW1ib2xbXSk6IFNpZ25hdHVyZXx1bmRlZmluZWQge1xuICAgIGxldCBzaWduYXR1cmUgPSBzZWxlY3RTaWduYXR1cmUodGhpcy50c1R5cGUsIHRoaXMuY29udGV4dCwgdHlwZXMpICE7XG4gICAgaWYgKHR5cGVzLmxlbmd0aCA9PSAxKSB7XG4gICAgICBjb25zdCBwYXJhbWV0ZXJUeXBlID0gdHlwZXNbMF07XG4gICAgICBpZiAocGFyYW1ldGVyVHlwZSBpbnN0YW5jZW9mIFR5cGVXcmFwcGVyKSB7XG4gICAgICAgIGxldCByZXN1bHRUeXBlOiB0cy5UeXBlfHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICAgICAgc3dpdGNoICh0aGlzLm5hbWUpIHtcbiAgICAgICAgICBjYXNlICdhc3luYyc6XG4gICAgICAgICAgICBzd2l0Y2ggKHBhcmFtZXRlclR5cGUubmFtZSkge1xuICAgICAgICAgICAgICBjYXNlICdPYnNlcnZhYmxlJzpcbiAgICAgICAgICAgICAgY2FzZSAnUHJvbWlzZSc6XG4gICAgICAgICAgICAgIGNhc2UgJ0V2ZW50RW1pdHRlcic6XG4gICAgICAgICAgICAgICAgcmVzdWx0VHlwZSA9IGdldFR5cGVQYXJhbWV0ZXJPZihwYXJhbWV0ZXJUeXBlLnRzVHlwZSwgcGFyYW1ldGVyVHlwZS5uYW1lKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICByZXN1bHRUeXBlID0gZ2V0QnVpbHRpblR5cGVGcm9tVHMoQnVpbHRpblR5cGUuQW55LCB0aGlzLmNvbnRleHQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnc2xpY2UnOlxuICAgICAgICAgICAgcmVzdWx0VHlwZSA9IGdldFR5cGVQYXJhbWV0ZXJPZihwYXJhbWV0ZXJUeXBlLnRzVHlwZSwgJ0FycmF5Jyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVzdWx0VHlwZSkge1xuICAgICAgICAgIHNpZ25hdHVyZSA9IG5ldyBTaWduYXR1cmVSZXN1bHRPdmVycmlkZShcbiAgICAgICAgICAgICAgc2lnbmF0dXJlLCBuZXcgVHlwZVdyYXBwZXIocmVzdWx0VHlwZSwgcGFyYW1ldGVyVHlwZS5jb250ZXh0KSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNpZ25hdHVyZTtcbiAgfVxuXG4gIGluZGV4ZWQoYXJndW1lbnQ6IFN5bWJvbCk6IFN5bWJvbHx1bmRlZmluZWQgeyByZXR1cm4gdW5kZWZpbmVkOyB9XG5cbiAgcHJpdmF0ZSBnZXQgdHNUeXBlKCk6IHRzLlR5cGUge1xuICAgIGxldCB0eXBlID0gdGhpcy5fdHNUeXBlO1xuICAgIGlmICghdHlwZSkge1xuICAgICAgY29uc3QgY2xhc3NTeW1ib2wgPSB0aGlzLmZpbmRDbGFzc1N5bWJvbCh0aGlzLnBpcGUudHlwZS5yZWZlcmVuY2UpO1xuICAgICAgaWYgKGNsYXNzU3ltYm9sKSB7XG4gICAgICAgIHR5cGUgPSB0aGlzLl90c1R5cGUgPSB0aGlzLmZpbmRUcmFuc2Zvcm1NZXRob2RUeXBlKGNsYXNzU3ltYm9sKSAhO1xuICAgICAgfVxuICAgICAgaWYgKCF0eXBlKSB7XG4gICAgICAgIHR5cGUgPSB0aGlzLl90c1R5cGUgPSBnZXRCdWlsdGluVHlwZUZyb21UcyhCdWlsdGluVHlwZS5BbnksIHRoaXMuY29udGV4dCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0eXBlO1xuICB9XG5cbiAgcHJpdmF0ZSBmaW5kQ2xhc3NTeW1ib2wodHlwZTogU3RhdGljU3ltYm9sKTogdHMuU3ltYm9sfHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIGZpbmRDbGFzc1N5bWJvbEluQ29udGV4dCh0eXBlLCB0aGlzLmNvbnRleHQpO1xuICB9XG5cbiAgcHJpdmF0ZSBmaW5kVHJhbnNmb3JtTWV0aG9kVHlwZShjbGFzc1N5bWJvbDogdHMuU3ltYm9sKTogdHMuVHlwZXx1bmRlZmluZWQge1xuICAgIGNvbnN0IGNsYXNzVHlwZSA9IHRoaXMuY29udGV4dC5jaGVja2VyLmdldERlY2xhcmVkVHlwZU9mU3ltYm9sKGNsYXNzU3ltYm9sKTtcbiAgICBpZiAoY2xhc3NUeXBlKSB7XG4gICAgICBjb25zdCB0cmFuc2Zvcm0gPSBjbGFzc1R5cGUuZ2V0UHJvcGVydHkoJ3RyYW5zZm9ybScpO1xuICAgICAgaWYgKHRyYW5zZm9ybSkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250ZXh0LmNoZWNrZXIuZ2V0VHlwZU9mU3ltYm9sQXRMb2NhdGlvbih0cmFuc2Zvcm0sIHRoaXMuY29udGV4dC5ub2RlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZmluZENsYXNzU3ltYm9sSW5Db250ZXh0KHR5cGU6IFN0YXRpY1N5bWJvbCwgY29udGV4dDogVHlwZUNvbnRleHQpOiB0cy5TeW1ib2x8dW5kZWZpbmVkIHtcbiAgbGV0IHNvdXJjZUZpbGUgPSBjb250ZXh0LnByb2dyYW0uZ2V0U291cmNlRmlsZSh0eXBlLmZpbGVQYXRoKTtcbiAgaWYgKCFzb3VyY2VGaWxlKSB7XG4gICAgLy8gVGhpcyBoYW5kbGVzIGEgY2FzZSB3aGVyZSBhbiA8cGFja2FnZU5hbWU+L2luZGV4LmQudHMgYW5kIGEgPHBhY2thZ2VOYW1lPi88cGFja2FnZU5hbWU+LmQudHNcbiAgICAvLyBhcmUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LiBJZiB3ZSBhcmUgbG9va2luZyBmb3IgPHBhY2thZ2VOYW1lPi88cGFja2FnZU5hbWU+IGFuZCBkaWRuJ3RcbiAgICAvLyBmaW5kIGl0LCBsb29rIGZvciA8cGFja2FnZU5hbWU+L2luZGV4LmQudHMgYXMgdGhlIHByb2dyYW0gbWlnaHQgaGF2ZSBmb3VuZCB0aGF0IGluc3RlYWQuXG4gICAgY29uc3QgcCA9IHR5cGUuZmlsZVBhdGggYXMgc3RyaW5nO1xuICAgIGNvbnN0IG0gPSBwLm1hdGNoKElOREVYX1BBVFRFUk4pO1xuICAgIGlmIChtKSB7XG4gICAgICBjb25zdCBpbmRleFZlcnNpb24gPSBwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKHApLCAnaW5kZXguZC50cycpO1xuICAgICAgc291cmNlRmlsZSA9IGNvbnRleHQucHJvZ3JhbS5nZXRTb3VyY2VGaWxlKGluZGV4VmVyc2lvbik7XG4gICAgfVxuICB9XG4gIGlmIChzb3VyY2VGaWxlKSB7XG4gICAgY29uc3QgbW9kdWxlU3ltYm9sID0gKHNvdXJjZUZpbGUgYXMgYW55KS5tb2R1bGUgfHwgKHNvdXJjZUZpbGUgYXMgYW55KS5zeW1ib2w7XG4gICAgY29uc3QgZXhwb3J0cyA9IGNvbnRleHQuY2hlY2tlci5nZXRFeHBvcnRzT2ZNb2R1bGUobW9kdWxlU3ltYm9sKTtcbiAgICByZXR1cm4gKGV4cG9ydHMgfHwgW10pLmZpbmQoc3ltYm9sID0+IHN5bWJvbC5uYW1lID09IHR5cGUubmFtZSk7XG4gIH1cbn1cblxuY2xhc3MgRW1wdHlUYWJsZSBpbXBsZW1lbnRzIFN5bWJvbFRhYmxlIHtcbiAgcHVibGljIHJlYWRvbmx5IHNpemU6IG51bWJlciA9IDA7XG4gIGdldChrZXk6IHN0cmluZyk6IFN5bWJvbHx1bmRlZmluZWQgeyByZXR1cm4gdW5kZWZpbmVkOyB9XG4gIGhhcyhrZXk6IHN0cmluZyk6IGJvb2xlYW4geyByZXR1cm4gZmFsc2U7IH1cbiAgdmFsdWVzKCk6IFN5bWJvbFtdIHsgcmV0dXJuIFtdOyB9XG4gIHN0YXRpYyBpbnN0YW5jZSA9IG5ldyBFbXB0eVRhYmxlKCk7XG59XG5cbmZ1bmN0aW9uIGZpbmRUc0NvbmZpZyhmaWxlTmFtZTogc3RyaW5nKTogc3RyaW5nfHVuZGVmaW5lZCB7XG4gIGxldCBkaXIgPSBwYXRoLmRpcm5hbWUoZmlsZU5hbWUpO1xuICB3aGlsZSAoZnMuZXhpc3RzU3luYyhkaXIpKSB7XG4gICAgY29uc3QgY2FuZGlkYXRlID0gcGF0aC5qb2luKGRpciwgJ3RzY29uZmlnLmpzb24nKTtcbiAgICBpZiAoZnMuZXhpc3RzU3luYyhjYW5kaWRhdGUpKSByZXR1cm4gY2FuZGlkYXRlO1xuICAgIGNvbnN0IHBhcmVudERpciA9IHBhdGguZGlybmFtZShkaXIpO1xuICAgIGlmIChwYXJlbnREaXIgPT09IGRpcikgYnJlYWs7XG4gICAgZGlyID0gcGFyZW50RGlyO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzQmluZGluZ1BhdHRlcm4obm9kZTogdHMuTm9kZSk6IG5vZGUgaXMgdHMuQmluZGluZ1BhdHRlcm4ge1xuICByZXR1cm4gISFub2RlICYmIChub2RlLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuQXJyYXlCaW5kaW5nUGF0dGVybiB8fFxuICAgICAgICAgICAgICAgICAgICBub2RlLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuT2JqZWN0QmluZGluZ1BhdHRlcm4pO1xufVxuXG5mdW5jdGlvbiB3YWxrVXBCaW5kaW5nRWxlbWVudHNBbmRQYXR0ZXJucyhub2RlOiB0cy5Ob2RlKTogdHMuTm9kZSB7XG4gIHdoaWxlIChub2RlICYmIChub2RlLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuQmluZGluZ0VsZW1lbnQgfHwgaXNCaW5kaW5nUGF0dGVybihub2RlKSkpIHtcbiAgICBub2RlID0gbm9kZS5wYXJlbnQgITtcbiAgfVxuXG4gIHJldHVybiBub2RlO1xufVxuXG5mdW5jdGlvbiBnZXRDb21iaW5lZE5vZGVGbGFncyhub2RlOiB0cy5Ob2RlKTogdHMuTm9kZUZsYWdzIHtcbiAgbm9kZSA9IHdhbGtVcEJpbmRpbmdFbGVtZW50c0FuZFBhdHRlcm5zKG5vZGUpO1xuXG4gIGxldCBmbGFncyA9IG5vZGUuZmxhZ3M7XG4gIGlmIChub2RlLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuVmFyaWFibGVEZWNsYXJhdGlvbikge1xuICAgIG5vZGUgPSBub2RlLnBhcmVudCAhO1xuICB9XG5cbiAgaWYgKG5vZGUgJiYgbm9kZS5raW5kID09PSB0cy5TeW50YXhLaW5kLlZhcmlhYmxlRGVjbGFyYXRpb25MaXN0KSB7XG4gICAgZmxhZ3MgfD0gbm9kZS5mbGFncztcbiAgICBub2RlID0gbm9kZS5wYXJlbnQgITtcbiAgfVxuXG4gIGlmIChub2RlICYmIG5vZGUua2luZCA9PT0gdHMuU3ludGF4S2luZC5WYXJpYWJsZVN0YXRlbWVudCkge1xuICAgIGZsYWdzIHw9IG5vZGUuZmxhZ3M7XG4gIH1cblxuICByZXR1cm4gZmxhZ3M7XG59XG5cbmZ1bmN0aW9uIGlzU3ltYm9sUHJpdmF0ZShzOiB0cy5TeW1ib2wpOiBib29sZWFuIHtcbiAgcmV0dXJuICEhcy52YWx1ZURlY2xhcmF0aW9uICYmIGlzUHJpdmF0ZShzLnZhbHVlRGVjbGFyYXRpb24pO1xufVxuXG5mdW5jdGlvbiBnZXRCdWlsdGluVHlwZUZyb21UcyhraW5kOiBCdWlsdGluVHlwZSwgY29udGV4dDogVHlwZUNvbnRleHQpOiB0cy5UeXBlIHtcbiAgbGV0IHR5cGU6IHRzLlR5cGU7XG4gIGNvbnN0IGNoZWNrZXIgPSBjb250ZXh0LmNoZWNrZXI7XG4gIGNvbnN0IG5vZGUgPSBjb250ZXh0Lm5vZGU7XG4gIHN3aXRjaCAoa2luZCkge1xuICAgIGNhc2UgQnVpbHRpblR5cGUuQW55OlxuICAgICAgdHlwZSA9IGNoZWNrZXIuZ2V0VHlwZUF0TG9jYXRpb24oc2V0UGFyZW50cyhcbiAgICAgICAgICA8dHMuTm9kZT48YW55PntcbiAgICAgICAgICAgIGtpbmQ6IHRzLlN5bnRheEtpbmQuQXNFeHByZXNzaW9uLFxuICAgICAgICAgICAgZXhwcmVzc2lvbjogPHRzLk5vZGU+e2tpbmQ6IHRzLlN5bnRheEtpbmQuVHJ1ZUtleXdvcmR9LFxuICAgICAgICAgICAgdHlwZTogPHRzLk5vZGU+e2tpbmQ6IHRzLlN5bnRheEtpbmQuQW55S2V5d29yZH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIG5vZGUpKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgQnVpbHRpblR5cGUuQm9vbGVhbjpcbiAgICAgIHR5cGUgPVxuICAgICAgICAgIGNoZWNrZXIuZ2V0VHlwZUF0TG9jYXRpb24oc2V0UGFyZW50cyg8dHMuTm9kZT57a2luZDogdHMuU3ludGF4S2luZC5UcnVlS2V5d29yZH0sIG5vZGUpKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgQnVpbHRpblR5cGUuTnVsbDpcbiAgICAgIHR5cGUgPVxuICAgICAgICAgIGNoZWNrZXIuZ2V0VHlwZUF0TG9jYXRpb24oc2V0UGFyZW50cyg8dHMuTm9kZT57a2luZDogdHMuU3ludGF4S2luZC5OdWxsS2V5d29yZH0sIG5vZGUpKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgQnVpbHRpblR5cGUuTnVtYmVyOlxuICAgICAgY29uc3QgbnVtZXJpYyA9IDx0cy5Ob2RlPntraW5kOiB0cy5TeW50YXhLaW5kLk51bWVyaWNMaXRlcmFsfTtcbiAgICAgIHNldFBhcmVudHMoPGFueT57a2luZDogdHMuU3ludGF4S2luZC5FeHByZXNzaW9uU3RhdGVtZW50LCBleHByZXNzaW9uOiBudW1lcmljfSwgbm9kZSk7XG4gICAgICB0eXBlID0gY2hlY2tlci5nZXRUeXBlQXRMb2NhdGlvbihudW1lcmljKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgQnVpbHRpblR5cGUuU3RyaW5nOlxuICAgICAgdHlwZSA9IGNoZWNrZXIuZ2V0VHlwZUF0TG9jYXRpb24oXG4gICAgICAgICAgc2V0UGFyZW50cyg8dHMuTm9kZT57a2luZDogdHMuU3ludGF4S2luZC5Ob1N1YnN0aXR1dGlvblRlbXBsYXRlTGl0ZXJhbH0sIG5vZGUpKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgQnVpbHRpblR5cGUuVW5kZWZpbmVkOlxuICAgICAgdHlwZSA9IGNoZWNrZXIuZ2V0VHlwZUF0TG9jYXRpb24oc2V0UGFyZW50cyhcbiAgICAgICAgICA8dHMuTm9kZT48YW55PntcbiAgICAgICAgICAgIGtpbmQ6IHRzLlN5bnRheEtpbmQuVm9pZEV4cHJlc3Npb24sXG4gICAgICAgICAgICBleHByZXNzaW9uOiA8dHMuTm9kZT57a2luZDogdHMuU3ludGF4S2luZC5OdW1lcmljTGl0ZXJhbH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIG5vZGUpKTtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEludGVybmFsIGVycm9yLCB1bmhhbmRsZWQgbGl0ZXJhbCBraW5kICR7a2luZH06JHtCdWlsdGluVHlwZVtraW5kXX1gKTtcbiAgfVxuICByZXR1cm4gdHlwZTtcbn1cblxuZnVuY3Rpb24gc2V0UGFyZW50czxUIGV4dGVuZHMgdHMuTm9kZT4obm9kZTogVCwgcGFyZW50OiB0cy5Ob2RlKTogVCB7XG4gIG5vZGUucGFyZW50ID0gcGFyZW50O1xuICB0cy5mb3JFYWNoQ2hpbGQobm9kZSwgY2hpbGQgPT4gc2V0UGFyZW50cyhjaGlsZCwgbm9kZSkpO1xuICByZXR1cm4gbm9kZTtcbn1cblxuZnVuY3Rpb24gc3Bhbk9mKG5vZGU6IHRzLk5vZGUpOiBTcGFuIHtcbiAgcmV0dXJuIHtzdGFydDogbm9kZS5nZXRTdGFydCgpLCBlbmQ6IG5vZGUuZ2V0RW5kKCl9O1xufVxuXG5mdW5jdGlvbiBzaHJpbmsoc3BhbjogU3Bhbiwgb2Zmc2V0PzogbnVtYmVyKSB7XG4gIGlmIChvZmZzZXQgPT0gbnVsbCkgb2Zmc2V0ID0gMTtcbiAgcmV0dXJuIHtzdGFydDogc3Bhbi5zdGFydCArIG9mZnNldCwgZW5kOiBzcGFuLmVuZCAtIG9mZnNldH07XG59XG5cbmZ1bmN0aW9uIHNwYW5BdChzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlLCBsaW5lOiBudW1iZXIsIGNvbHVtbjogbnVtYmVyKTogU3Bhbnx1bmRlZmluZWQge1xuICBpZiAobGluZSAhPSBudWxsICYmIGNvbHVtbiAhPSBudWxsKSB7XG4gICAgY29uc3QgcG9zaXRpb24gPSB0cy5nZXRQb3NpdGlvbk9mTGluZUFuZENoYXJhY3Rlcihzb3VyY2VGaWxlLCBsaW5lLCBjb2x1bW4pO1xuICAgIGNvbnN0IGZpbmRDaGlsZCA9IGZ1bmN0aW9uIGZpbmRDaGlsZChub2RlOiB0cy5Ob2RlKTogdHMuTm9kZSB8IHVuZGVmaW5lZCB7XG4gICAgICBpZiAobm9kZS5raW5kID4gdHMuU3ludGF4S2luZC5MYXN0VG9rZW4gJiYgbm9kZS5wb3MgPD0gcG9zaXRpb24gJiYgbm9kZS5lbmQgPiBwb3NpdGlvbikge1xuICAgICAgICBjb25zdCBiZXR0ZXJOb2RlID0gdHMuZm9yRWFjaENoaWxkKG5vZGUsIGZpbmRDaGlsZCk7XG4gICAgICAgIHJldHVybiBiZXR0ZXJOb2RlIHx8IG5vZGU7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGNvbnN0IG5vZGUgPSB0cy5mb3JFYWNoQ2hpbGQoc291cmNlRmlsZSwgZmluZENoaWxkKTtcbiAgICBpZiAobm9kZSkge1xuICAgICAgcmV0dXJuIHtzdGFydDogbm9kZS5nZXRTdGFydCgpLCBlbmQ6IG5vZGUuZ2V0RW5kKCl9O1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBkZWZpbml0aW9uRnJvbVRzU3ltYm9sKHN5bWJvbDogdHMuU3ltYm9sKTogRGVmaW5pdGlvbiB7XG4gIGNvbnN0IGRlY2xhcmF0aW9ucyA9IHN5bWJvbC5kZWNsYXJhdGlvbnM7XG4gIGlmIChkZWNsYXJhdGlvbnMpIHtcbiAgICByZXR1cm4gZGVjbGFyYXRpb25zLm1hcChkZWNsYXJhdGlvbiA9PiB7XG4gICAgICBjb25zdCBzb3VyY2VGaWxlID0gZGVjbGFyYXRpb24uZ2V0U291cmNlRmlsZSgpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZmlsZU5hbWU6IHNvdXJjZUZpbGUuZmlsZU5hbWUsXG4gICAgICAgIHNwYW46IHtzdGFydDogZGVjbGFyYXRpb24uZ2V0U3RhcnQoKSwgZW5kOiBkZWNsYXJhdGlvbi5nZXRFbmQoKX1cbiAgICAgIH07XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcGFyZW50RGVjbGFyYXRpb25PZihub2RlOiB0cy5Ob2RlKTogdHMuTm9kZXx1bmRlZmluZWQge1xuICB3aGlsZSAobm9kZSkge1xuICAgIHN3aXRjaCAobm9kZS5raW5kKSB7XG4gICAgICBjYXNlIHRzLlN5bnRheEtpbmQuQ2xhc3NEZWNsYXJhdGlvbjpcbiAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5JbnRlcmZhY2VEZWNsYXJhdGlvbjpcbiAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICBjYXNlIHRzLlN5bnRheEtpbmQuU291cmNlRmlsZTpcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgbm9kZSA9IG5vZGUucGFyZW50ICE7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0Q29udGFpbmVyT2Yoc3ltYm9sOiB0cy5TeW1ib2wsIGNvbnRleHQ6IFR5cGVDb250ZXh0KTogU3ltYm9sfHVuZGVmaW5lZCB7XG4gIGlmIChzeW1ib2wuZ2V0RmxhZ3MoKSAmIHRzLlN5bWJvbEZsYWdzLkNsYXNzTWVtYmVyICYmIHN5bWJvbC5kZWNsYXJhdGlvbnMpIHtcbiAgICBmb3IgKGNvbnN0IGRlY2xhcmF0aW9uIG9mIHN5bWJvbC5kZWNsYXJhdGlvbnMpIHtcbiAgICAgIGNvbnN0IHBhcmVudCA9IHBhcmVudERlY2xhcmF0aW9uT2YoZGVjbGFyYXRpb24pO1xuICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICBjb25zdCB0eXBlID0gY29udGV4dC5jaGVja2VyLmdldFR5cGVBdExvY2F0aW9uKHBhcmVudCk7XG4gICAgICAgIGlmICh0eXBlKSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBUeXBlV3JhcHBlcih0eXBlLCBjb250ZXh0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRUeXBlUGFyYW1ldGVyT2YodHlwZTogdHMuVHlwZSwgbmFtZTogc3RyaW5nKTogdHMuVHlwZXx1bmRlZmluZWQge1xuICBpZiAodHlwZSAmJiB0eXBlLnN5bWJvbCAmJiB0eXBlLnN5bWJvbC5uYW1lID09IG5hbWUpIHtcbiAgICBjb25zdCB0eXBlQXJndW1lbnRzOiB0cy5UeXBlW10gPSAodHlwZSBhcyBhbnkpLnR5cGVBcmd1bWVudHM7XG4gICAgaWYgKHR5cGVBcmd1bWVudHMgJiYgdHlwZUFyZ3VtZW50cy5sZW5ndGggPD0gMSkge1xuICAgICAgcmV0dXJuIHR5cGVBcmd1bWVudHNbMF07XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHR5cGVLaW5kT2YodHlwZTogdHMuVHlwZSB8IHVuZGVmaW5lZCk6IEJ1aWx0aW5UeXBlIHtcbiAgaWYgKHR5cGUpIHtcbiAgICBpZiAodHlwZS5mbGFncyAmIHRzLlR5cGVGbGFncy5BbnkpIHtcbiAgICAgIHJldHVybiBCdWlsdGluVHlwZS5Bbnk7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgICAgdHlwZS5mbGFncyAmICh0cy5UeXBlRmxhZ3MuU3RyaW5nIHwgdHMuVHlwZUZsYWdzLlN0cmluZ0xpa2UgfCB0cy5UeXBlRmxhZ3MuU3RyaW5nTGl0ZXJhbCkpIHtcbiAgICAgIHJldHVybiBCdWlsdGluVHlwZS5TdHJpbmc7XG4gICAgfSBlbHNlIGlmICh0eXBlLmZsYWdzICYgKHRzLlR5cGVGbGFncy5OdW1iZXIgfCB0cy5UeXBlRmxhZ3MuTnVtYmVyTGlrZSkpIHtcbiAgICAgIHJldHVybiBCdWlsdGluVHlwZS5OdW1iZXI7XG4gICAgfSBlbHNlIGlmICh0eXBlLmZsYWdzICYgKHRzLlR5cGVGbGFncy5VbmRlZmluZWQpKSB7XG4gICAgICByZXR1cm4gQnVpbHRpblR5cGUuVW5kZWZpbmVkO1xuICAgIH0gZWxzZSBpZiAodHlwZS5mbGFncyAmICh0cy5UeXBlRmxhZ3MuTnVsbCkpIHtcbiAgICAgIHJldHVybiBCdWlsdGluVHlwZS5OdWxsO1xuICAgIH0gZWxzZSBpZiAodHlwZS5mbGFncyAmIHRzLlR5cGVGbGFncy5Vbmlvbikge1xuICAgICAgLy8gSWYgYWxsIHRoZSBjb25zdGl0dWVudCB0eXBlcyBvZiBhIHVuaW9uIGFyZSB0aGUgc2FtZSBraW5kLCBpdCBpcyBhbHNvIHRoYXQga2luZC5cbiAgICAgIGxldCBjYW5kaWRhdGU6IEJ1aWx0aW5UeXBlfG51bGwgPSBudWxsO1xuICAgICAgY29uc3QgdW5pb25UeXBlID0gdHlwZSBhcyB0cy5VbmlvblR5cGU7XG4gICAgICBpZiAodW5pb25UeXBlLnR5cGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY2FuZGlkYXRlID0gdHlwZUtpbmRPZih1bmlvblR5cGUudHlwZXNbMF0pO1xuICAgICAgICBmb3IgKGNvbnN0IHN1YlR5cGUgb2YgdW5pb25UeXBlLnR5cGVzKSB7XG4gICAgICAgICAgaWYgKGNhbmRpZGF0ZSAhPSB0eXBlS2luZE9mKHN1YlR5cGUpKSB7XG4gICAgICAgICAgICByZXR1cm4gQnVpbHRpblR5cGUuT3RoZXI7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoY2FuZGlkYXRlICE9IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIGNhbmRpZGF0ZTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHR5cGUuZmxhZ3MgJiB0cy5UeXBlRmxhZ3MuVHlwZVBhcmFtZXRlcikge1xuICAgICAgcmV0dXJuIEJ1aWx0aW5UeXBlLlVuYm91bmQ7XG4gICAgfVxuICB9XG4gIHJldHVybiBCdWlsdGluVHlwZS5PdGhlcjtcbn1cblxuXG5cbmZ1bmN0aW9uIGdldEZyb21TeW1ib2xUYWJsZShzeW1ib2xUYWJsZTogdHMuU3ltYm9sVGFibGUsIGtleTogc3RyaW5nKTogdHMuU3ltYm9sfHVuZGVmaW5lZCB7XG4gIGNvbnN0IHRhYmxlID0gc3ltYm9sVGFibGUgYXMgYW55O1xuICBsZXQgc3ltYm9sOiB0cy5TeW1ib2x8dW5kZWZpbmVkO1xuXG4gIGlmICh0eXBlb2YgdGFibGUuZ2V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgLy8gVFMgMi4yIHVzZXMgYSBNYXBcbiAgICBzeW1ib2wgPSB0YWJsZS5nZXQoa2V5KTtcbiAgfSBlbHNlIHtcbiAgICAvLyBUUyBwcmUtMi4yIHVzZXMgYW4gb2JqZWN0XG4gICAgc3ltYm9sID0gdGFibGVba2V5XTtcbiAgfVxuXG4gIHJldHVybiBzeW1ib2w7XG59XG4iXX0=
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/src/metadata/bundler", ["require", "exports", "tslib", "path", "typescript", "@angular/compiler-cli/src/metadata/collector", "@angular/compiler-cli/src/metadata/schema"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var path = require("path");
    var ts = require("typescript");
    var collector_1 = require("@angular/compiler-cli/src/metadata/collector");
    var schema_1 = require("@angular/compiler-cli/src/metadata/schema");
    // The character set used to produce private names.
    var PRIVATE_NAME_CHARS = 'abcdefghijklmnopqrstuvwxyz';
    var MetadataBundler = /** @class */ (function () {
        function MetadataBundler(root, importAs, host, privateSymbolPrefix) {
            this.root = root;
            this.importAs = importAs;
            this.host = host;
            this.symbolMap = new Map();
            this.metadataCache = new Map();
            this.exports = new Map();
            this.rootModule = "./" + path.basename(root);
            this.privateSymbolPrefix = (privateSymbolPrefix || '').replace(/\W/g, '_');
        }
        MetadataBundler.prototype.getMetadataBundle = function () {
            // Export the root module. This also collects the transitive closure of all values referenced by
            // the exports.
            var exportedSymbols = this.exportAll(this.rootModule);
            this.canonicalizeSymbols(exportedSymbols);
            // TODO: exports? e.g. a module re-exports a symbol from another bundle
            var metadata = this.getEntries(exportedSymbols);
            var privates = Array.from(this.symbolMap.values())
                .filter(function (s) { return s.referenced && s.isPrivate; })
                .map(function (s) { return ({
                privateName: s.privateName,
                name: s.declaration.name,
                module: s.declaration.module
            }); });
            var origins = Array.from(this.symbolMap.values())
                .filter(function (s) { return s.referenced && !s.reexport; })
                .reduce(function (p, s) {
                p[s.isPrivate ? s.privateName : s.name] = s.declaration.module;
                return p;
            }, {});
            var exports = this.getReExports(exportedSymbols);
            return {
                metadata: {
                    __symbolic: 'module',
                    version: schema_1.METADATA_VERSION,
                    exports: exports.length ? exports : undefined, metadata: metadata, origins: origins,
                    importAs: this.importAs
                },
                privates: privates
            };
        };
        MetadataBundler.resolveModule = function (importName, from) {
            return resolveModule(importName, from);
        };
        MetadataBundler.prototype.getMetadata = function (moduleName) {
            var result = this.metadataCache.get(moduleName);
            if (!result) {
                if (moduleName.startsWith('.')) {
                    var fullModuleName = resolveModule(moduleName, this.root);
                    result = this.host.getMetadataFor(fullModuleName, this.root);
                }
                this.metadataCache.set(moduleName, result);
            }
            return result;
        };
        MetadataBundler.prototype.exportAll = function (moduleName) {
            var _this = this;
            var e_1, _a, e_2, _b, e_3, _c;
            var module = this.getMetadata(moduleName);
            var result = this.exports.get(moduleName);
            if (result) {
                return result;
            }
            result = [];
            var exportSymbol = function (exportedSymbol, exportAs) {
                var symbol = _this.symbolOf(moduleName, exportAs);
                result.push(symbol);
                exportedSymbol.reexportedAs = symbol;
                symbol.exports = exportedSymbol;
            };
            // Export all the symbols defined in this module.
            if (module && module.metadata) {
                for (var key in module.metadata) {
                    var data = module.metadata[key];
                    if (schema_1.isMetadataImportedSymbolReferenceExpression(data)) {
                        // This is a re-export of an imported symbol. Record this as a re-export.
                        var exportFrom = resolveModule(data.module, moduleName);
                        this.exportAll(exportFrom);
                        var symbol = this.symbolOf(exportFrom, data.name);
                        exportSymbol(symbol, key);
                    }
                    else {
                        // Record that this symbol is exported by this module.
                        result.push(this.symbolOf(moduleName, key));
                    }
                }
            }
            // Export all the re-exports from this module
            if (module && module.exports) {
                try {
                    for (var _d = tslib_1.__values(module.exports), _e = _d.next(); !_e.done; _e = _d.next()) {
                        var exportDeclaration = _e.value;
                        var exportFrom = resolveModule(exportDeclaration.from, moduleName);
                        // Record all the exports from the module even if we don't use it directly.
                        var exportedSymbols = this.exportAll(exportFrom);
                        if (exportDeclaration.export) {
                            try {
                                // Re-export all the named exports from a module.
                                for (var _f = tslib_1.__values(exportDeclaration.export), _g = _f.next(); !_g.done; _g = _f.next()) {
                                    var exportItem = _g.value;
                                    var name = typeof exportItem == 'string' ? exportItem : exportItem.name;
                                    var exportAs = typeof exportItem == 'string' ? exportItem : exportItem.as;
                                    var symbol = this.symbolOf(exportFrom, name);
                                    if (exportedSymbols && exportedSymbols.length == 1 && exportedSymbols[0].reexport &&
                                        exportedSymbols[0].name == '*') {
                                        // This is a named export from a module we have no metadata about. Record the named
                                        // export as a re-export.
                                        symbol.reexport = true;
                                    }
                                    exportSymbol(this.symbolOf(exportFrom, name), exportAs);
                                }
                            }
                            catch (e_2_1) { e_2 = { error: e_2_1 }; }
                            finally {
                                try {
                                    if (_g && !_g.done && (_b = _f.return)) _b.call(_f);
                                }
                                finally { if (e_2) throw e_2.error; }
                            }
                        }
                        else {
                            // Re-export all the symbols from the module
                            var exportedSymbols_2 = this.exportAll(exportFrom);
                            try {
                                for (var exportedSymbols_1 = tslib_1.__values(exportedSymbols_2), exportedSymbols_1_1 = exportedSymbols_1.next(); !exportedSymbols_1_1.done; exportedSymbols_1_1 = exportedSymbols_1.next()) {
                                    var exportedSymbol = exportedSymbols_1_1.value;
                                    var name = exportedSymbol.name;
                                    exportSymbol(exportedSymbol, name);
                                }
                            }
                            catch (e_3_1) { e_3 = { error: e_3_1 }; }
                            finally {
                                try {
                                    if (exportedSymbols_1_1 && !exportedSymbols_1_1.done && (_c = exportedSymbols_1.return)) _c.call(exportedSymbols_1);
                                }
                                finally { if (e_3) throw e_3.error; }
                            }
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_e && !_e.done && (_a = _d.return)) _a.call(_d);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
            if (!module) {
                // If no metadata is found for this import then it is considered external to the
                // library and should be recorded as a re-export in the final metadata if it is
                // eventually re-exported.
                var symbol = this.symbolOf(moduleName, '*');
                symbol.reexport = true;
                result.push(symbol);
            }
            this.exports.set(moduleName, result);
            return result;
        };
        /**
         * Fill in the canonicalSymbol which is the symbol that should be imported by factories.
         * The canonical symbol is the one exported by the index file for the bundle or definition
         * symbol for private symbols that are not exported by bundle index.
         */
        MetadataBundler.prototype.canonicalizeSymbols = function (exportedSymbols) {
            var symbols = Array.from(this.symbolMap.values());
            this.exported = new Set(exportedSymbols);
            symbols.forEach(this.canonicalizeSymbol, this);
        };
        MetadataBundler.prototype.canonicalizeSymbol = function (symbol) {
            var rootExport = getRootExport(symbol);
            var declaration = getSymbolDeclaration(symbol);
            var isPrivate = !this.exported.has(rootExport);
            var canonicalSymbol = isPrivate ? declaration : rootExport;
            symbol.isPrivate = isPrivate;
            symbol.declaration = declaration;
            symbol.canonicalSymbol = canonicalSymbol;
            symbol.reexport = declaration.reexport;
        };
        MetadataBundler.prototype.getEntries = function (exportedSymbols) {
            var _this = this;
            var result = {};
            var exportedNames = new Set(exportedSymbols.map(function (s) { return s.name; }));
            var privateName = 0;
            function newPrivateName(prefix) {
                while (true) {
                    var digits = [];
                    var index = privateName++;
                    var base = PRIVATE_NAME_CHARS;
                    while (!digits.length || index > 0) {
                        digits.unshift(base[index % base.length]);
                        index = Math.floor(index / base.length);
                    }
                    var result_1 = "\u0275" + prefix + digits.join('');
                    if (!exportedNames.has(result_1))
                        return result_1;
                }
            }
            exportedSymbols.forEach(function (symbol) { return _this.convertSymbol(symbol); });
            var symbolsMap = new Map();
            Array.from(this.symbolMap.values()).forEach(function (symbol) {
                if (symbol.referenced && !symbol.reexport) {
                    var name = symbol.name;
                    var identifier = symbol.declaration.module + ":" + symbol.declaration.name;
                    if (symbol.isPrivate && !symbol.privateName) {
                        name = newPrivateName(_this.privateSymbolPrefix);
                        symbol.privateName = name;
                    }
                    if (symbolsMap.has(identifier)) {
                        var names = symbolsMap.get(identifier);
                        names.push(name);
                    }
                    else {
                        symbolsMap.set(identifier, [name]);
                    }
                    result[name] = symbol.value;
                }
            });
            // check for duplicated entries
            symbolsMap.forEach(function (names, identifier) {
                if (names.length > 1) {
                    var _a = tslib_1.__read(identifier.split(':'), 2), module_1 = _a[0], declaredName = _a[1];
                    // prefer the export that uses the declared name (if any)
                    var reference_1 = names.indexOf(declaredName);
                    if (reference_1 === -1) {
                        reference_1 = 0;
                    }
                    // keep one entry and replace the others by references
                    names.forEach(function (name, i) {
                        if (i !== reference_1) {
                            result[name] = { __symbolic: 'reference', name: names[reference_1] };
                        }
                    });
                }
            });
            return result;
        };
        MetadataBundler.prototype.getReExports = function (exportedSymbols) {
            var e_4, _a;
            var modules = new Map();
            var exportAlls = new Set();
            try {
                for (var exportedSymbols_3 = tslib_1.__values(exportedSymbols), exportedSymbols_3_1 = exportedSymbols_3.next(); !exportedSymbols_3_1.done; exportedSymbols_3_1 = exportedSymbols_3.next()) {
                    var symbol = exportedSymbols_3_1.value;
                    if (symbol.reexport) {
                        // symbol.declaration is guaranteed to be defined during the phase this method is called.
                        var declaration = symbol.declaration;
                        var module_2 = declaration.module;
                        if (declaration.name == '*') {
                            // Reexport all the symbols.
                            exportAlls.add(declaration.module);
                        }
                        else {
                            // Re-export the symbol as the exported name.
                            var entry = modules.get(module_2);
                            if (!entry) {
                                entry = [];
                                modules.set(module_2, entry);
                            }
                            var as = symbol.name;
                            var name = declaration.name;
                            entry.push({ name: name, as: as });
                        }
                    }
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (exportedSymbols_3_1 && !exportedSymbols_3_1.done && (_a = exportedSymbols_3.return)) _a.call(exportedSymbols_3);
                }
                finally { if (e_4) throw e_4.error; }
            }
            return tslib_1.__spread(Array.from(exportAlls.values()).map(function (from) { return ({ from: from }); }), Array.from(modules.entries()).map(function (_a) {
                var _b = tslib_1.__read(_a, 2), from = _b[0], exports = _b[1];
                return ({ export: exports, from: from });
            }));
        };
        MetadataBundler.prototype.convertSymbol = function (symbol) {
            // canonicalSymbol is ensured to be defined before this is called.
            var canonicalSymbol = symbol.canonicalSymbol;
            if (!canonicalSymbol.referenced) {
                canonicalSymbol.referenced = true;
                // declaration is ensured to be definded before this method is called.
                var declaration = canonicalSymbol.declaration;
                var module_3 = this.getMetadata(declaration.module);
                if (module_3) {
                    var value = module_3.metadata[declaration.name];
                    if (value && !declaration.name.startsWith('___')) {
                        canonicalSymbol.value = this.convertEntry(declaration.module, value);
                    }
                }
            }
        };
        MetadataBundler.prototype.convertEntry = function (moduleName, value) {
            if (schema_1.isClassMetadata(value)) {
                return this.convertClass(moduleName, value);
            }
            if (schema_1.isFunctionMetadata(value)) {
                return this.convertFunction(moduleName, value);
            }
            if (schema_1.isInterfaceMetadata(value)) {
                return value;
            }
            return this.convertValue(moduleName, value);
        };
        MetadataBundler.prototype.convertClass = function (moduleName, value) {
            var _this = this;
            return {
                __symbolic: 'class',
                arity: value.arity,
                extends: this.convertExpression(moduleName, value.extends),
                decorators: value.decorators && value.decorators.map(function (d) { return _this.convertExpression(moduleName, d); }),
                members: this.convertMembers(moduleName, value.members),
                statics: value.statics && this.convertStatics(moduleName, value.statics)
            };
        };
        MetadataBundler.prototype.convertMembers = function (moduleName, members) {
            var _this = this;
            var result = {};
            for (var name in members) {
                var value = members[name];
                result[name] = value.map(function (v) { return _this.convertMember(moduleName, v); });
            }
            return result;
        };
        MetadataBundler.prototype.convertMember = function (moduleName, member) {
            var _this = this;
            var result = { __symbolic: member.__symbolic };
            result.decorators =
                member.decorators && member.decorators.map(function (d) { return _this.convertExpression(moduleName, d); });
            if (schema_1.isMethodMetadata(member)) {
                result.parameterDecorators = member.parameterDecorators &&
                    member.parameterDecorators.map(function (d) { return d && d.map(function (p) { return _this.convertExpression(moduleName, p); }); });
                if (schema_1.isConstructorMetadata(member)) {
                    if (member.parameters) {
                        result.parameters =
                            member.parameters.map(function (p) { return _this.convertExpression(moduleName, p); });
                    }
                }
            }
            return result;
        };
        MetadataBundler.prototype.convertStatics = function (moduleName, statics) {
            var result = {};
            for (var key in statics) {
                var value = statics[key];
                result[key] = schema_1.isFunctionMetadata(value) ? this.convertFunction(moduleName, value) : value;
            }
            return result;
        };
        MetadataBundler.prototype.convertFunction = function (moduleName, value) {
            var _this = this;
            return {
                __symbolic: 'function',
                parameters: value.parameters,
                defaults: value.defaults && value.defaults.map(function (v) { return _this.convertValue(moduleName, v); }),
                value: this.convertValue(moduleName, value.value)
            };
        };
        MetadataBundler.prototype.convertValue = function (moduleName, value) {
            var _this = this;
            if (isPrimitive(value)) {
                return value;
            }
            if (schema_1.isMetadataError(value)) {
                return this.convertError(moduleName, value);
            }
            if (schema_1.isMetadataSymbolicExpression(value)) {
                return this.convertExpression(moduleName, value);
            }
            if (Array.isArray(value)) {
                return value.map(function (v) { return _this.convertValue(moduleName, v); });
            }
            // Otherwise it is a metadata object.
            var object = value;
            var result = {};
            for (var key in object) {
                result[key] = this.convertValue(moduleName, object[key]);
            }
            return result;
        };
        MetadataBundler.prototype.convertExpression = function (moduleName, value) {
            if (value) {
                switch (value.__symbolic) {
                    case 'error':
                        return this.convertError(moduleName, value);
                    case 'reference':
                        return this.convertReference(moduleName, value);
                    default:
                        return this.convertExpressionNode(moduleName, value);
                }
            }
            return value;
        };
        MetadataBundler.prototype.convertError = function (module, value) {
            return {
                __symbolic: 'error',
                message: value.message,
                line: value.line,
                character: value.character,
                context: value.context, module: module
            };
        };
        MetadataBundler.prototype.convertReference = function (moduleName, value) {
            var _this = this;
            var createReference = function (symbol) {
                var declaration = symbol.declaration;
                if (declaration.module.startsWith('.')) {
                    // Reference to a symbol defined in the module. Ensure it is converted then return a
                    // references to the final symbol.
                    _this.convertSymbol(symbol);
                    return {
                        __symbolic: 'reference',
                        get name() {
                            // Resolved lazily because private names are assigned late.
                            var canonicalSymbol = symbol.canonicalSymbol;
                            if (canonicalSymbol.isPrivate == null) {
                                throw Error('Invalid state: isPrivate was not initialized');
                            }
                            return canonicalSymbol.isPrivate ? canonicalSymbol.privateName : canonicalSymbol.name;
                        }
                    };
                }
                else {
                    // The symbol was a re-exported symbol from another module. Return a reference to the
                    // original imported symbol.
                    return { __symbolic: 'reference', name: declaration.name, module: declaration.module };
                }
            };
            if (schema_1.isMetadataGlobalReferenceExpression(value)) {
                var metadata = this.getMetadata(moduleName);
                if (metadata && metadata.metadata && metadata.metadata[value.name]) {
                    // Reference to a symbol defined in the module
                    return createReference(this.canonicalSymbolOf(moduleName, value.name));
                }
                // If a reference has arguments, the arguments need to be converted.
                if (value.arguments) {
                    return {
                        __symbolic: 'reference',
                        name: value.name,
                        arguments: value.arguments.map(function (a) { return _this.convertValue(moduleName, a); })
                    };
                }
                // Global references without arguments (such as to Math or JSON) are unmodified.
                return value;
            }
            if (schema_1.isMetadataImportedSymbolReferenceExpression(value)) {
                // References to imported symbols are separated into two, references to bundled modules and
                // references to modules external to the bundle. If the module reference is relative it is
                // assumed to be in the bundle. If it is Global it is assumed to be outside the bundle.
                // References to symbols outside the bundle are left unmodified. References to symbol inside
                // the bundle need to be converted to a bundle import reference reachable from the bundle
                // index.
                if (value.module.startsWith('.')) {
                    // Reference is to a symbol defined inside the module. Convert the reference to a reference
                    // to the canonical symbol.
                    var referencedModule = resolveModule(value.module, moduleName);
                    var referencedName = value.name;
                    return createReference(this.canonicalSymbolOf(referencedModule, referencedName));
                }
                // Value is a reference to a symbol defined outside the module.
                if (value.arguments) {
                    // If a reference has arguments the arguments need to be converted.
                    return {
                        __symbolic: 'reference',
                        name: value.name,
                        module: value.module,
                        arguments: value.arguments.map(function (a) { return _this.convertValue(moduleName, a); })
                    };
                }
                return value;
            }
            if (schema_1.isMetadataModuleReferenceExpression(value)) {
                // Cannot support references to bundled modules as the internal modules of a bundle are erased
                // by the bundler.
                if (value.module.startsWith('.')) {
                    return {
                        __symbolic: 'error',
                        message: 'Unsupported bundled module reference',
                        context: { module: value.module }
                    };
                }
                // References to unbundled modules are unmodified.
                return value;
            }
        };
        MetadataBundler.prototype.convertExpressionNode = function (moduleName, value) {
            var result = { __symbolic: value.__symbolic };
            for (var key in value) {
                result[key] = this.convertValue(moduleName, value[key]);
            }
            return result;
        };
        MetadataBundler.prototype.symbolOf = function (module, name) {
            var symbolKey = module + ":" + name;
            var symbol = this.symbolMap.get(symbolKey);
            if (!symbol) {
                symbol = { module: module, name: name };
                this.symbolMap.set(symbolKey, symbol);
            }
            return symbol;
        };
        MetadataBundler.prototype.canonicalSymbolOf = function (module, name) {
            // Ensure the module has been seen.
            this.exportAll(module);
            var symbol = this.symbolOf(module, name);
            if (!symbol.canonicalSymbol) {
                this.canonicalizeSymbol(symbol);
            }
            return symbol;
        };
        return MetadataBundler;
    }());
    exports.MetadataBundler = MetadataBundler;
    var CompilerHostAdapter = /** @class */ (function () {
        function CompilerHostAdapter(host, cache, options) {
            this.host = host;
            this.cache = cache;
            this.options = options;
            this.collector = new collector_1.MetadataCollector();
        }
        CompilerHostAdapter.prototype.getMetadataFor = function (fileName, containingFile) {
            var resolvedModule = ts.resolveModuleName(fileName, containingFile, this.options, this.host).resolvedModule;
            var sourceFile;
            if (resolvedModule) {
                var resolvedFileName = resolvedModule.resolvedFileName;
                if (resolvedModule.extension !== '.ts') {
                    resolvedFileName = resolvedFileName.replace(/(\.d\.ts|\.js)$/, '.ts');
                }
                sourceFile = this.host.getSourceFile(resolvedFileName, ts.ScriptTarget.Latest);
            }
            else {
                // If typescript is unable to resolve the file, fallback on old behavior
                if (!this.host.fileExists(fileName + '.ts'))
                    return undefined;
                sourceFile = this.host.getSourceFile(fileName + '.ts', ts.ScriptTarget.Latest);
            }
            // If there is a metadata cache, use it to get the metadata for this source file. Otherwise,
            // fall back on the locally created MetadataCollector.
            if (!sourceFile) {
                return undefined;
            }
            else if (this.cache) {
                return this.cache.getMetadata(sourceFile);
            }
            else {
                return this.collector.getMetadata(sourceFile);
            }
        };
        return CompilerHostAdapter;
    }());
    exports.CompilerHostAdapter = CompilerHostAdapter;
    function resolveModule(importName, from) {
        if (importName.startsWith('.') && from) {
            var normalPath = path.normalize(path.join(path.dirname(from), importName));
            if (!normalPath.startsWith('.') && from.startsWith('.')) {
                // path.normalize() preserves leading '../' but not './'. This adds it back.
                normalPath = "." + path.sep + normalPath;
            }
            // Replace windows path delimiters with forward-slashes. Otherwise the paths are not
            // TypeScript compatible when building the bundle.
            return normalPath.replace(/\\/g, '/');
        }
        return importName;
    }
    function isPrimitive(o) {
        return o === null || (typeof o !== 'function' && typeof o !== 'object');
    }
    function getRootExport(symbol) {
        return symbol.reexportedAs ? getRootExport(symbol.reexportedAs) : symbol;
    }
    function getSymbolDeclaration(symbol) {
        return symbol.exports ? getSymbolDeclaration(symbol.exports) : symbol;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyLWNsaS9zcmMvbWV0YWRhdGEvYnVuZGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7SUFBQTs7Ozs7O09BTUc7SUFDSCwyQkFBNkI7SUFDN0IsK0JBQWlDO0lBSWpDLDBFQUE4QztJQUM5QyxvRUFBcW1CO0lBSXJtQixtREFBbUQ7SUFDbkQsSUFBTSxrQkFBa0IsR0FBRyw0QkFBNEIsQ0FBQztJQWdFeEQ7UUFTRSx5QkFDWSxJQUFZLEVBQVUsUUFBMEIsRUFBVSxJQUF5QixFQUMzRixtQkFBNEI7WUFEcEIsU0FBSSxHQUFKLElBQUksQ0FBUTtZQUFVLGFBQVEsR0FBUixRQUFRLENBQWtCO1lBQVUsU0FBSSxHQUFKLElBQUksQ0FBcUI7WUFUdkYsY0FBUyxHQUFHLElBQUksR0FBRyxFQUFrQixDQUFDO1lBQ3RDLGtCQUFhLEdBQUcsSUFBSSxHQUFHLEVBQW9DLENBQUM7WUFDNUQsWUFBTyxHQUFHLElBQUksR0FBRyxFQUFvQixDQUFDO1lBUzVDLElBQUksQ0FBQyxVQUFVLEdBQUcsT0FBSyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBRyxDQUFDO1lBQzdDLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxDQUFDLG1CQUFtQixJQUFJLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDN0UsQ0FBQztRQUVELDJDQUFpQixHQUFqQjtZQUNFLGdHQUFnRztZQUNoRyxlQUFlO1lBQ2YsSUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDeEQsSUFBSSxDQUFDLG1CQUFtQixDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQzFDLHVFQUF1RTtZQUN2RSxJQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsVUFBVSxD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O1lBQ3RDLElBQUksVUFBVSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFDM0UsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDdkQsNEVBQTRFO2dCQUM1RSxVQUFVLEdBQUcsTUFBSSxJQUFJLENBQUMsR0FBRyxHQUFHLFVBQVksQ0FBQzthQUMxQztZQUNELG9GQUFvRjtZQUNwRixrREFBa0Q7WUFDbEQsT0FBTyxVQUFVLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztTQUN2QztRQUNELE9BQU8sVUFBVSxDQUFDO0lBQ3BCLENBQUM7SUFFRCxTQUFTLFdBQVcsQ0FBQyxDQUFNO1FBQ3pCLE9BQU8sQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLFVBQVUsSUFBSSxPQUFPLENBQUMsS0FBSyxRQUFRLENBQUMsQ0FBQztJQUMxRSxDQUFDO0lBRUQsU0FBUyxhQUFhLENBQUMsTUFBYztRQUNuQyxPQUFPLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztJQUMzRSxDQUFDO0lBRUQsU0FBUyxvQkFBb0IsQ0FBQyxNQUFjO1FBQzFDLE9BQU8sTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsb0JBQW9CLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7SUFDeEUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtNZXRhZGF0YUNhY2hlfSBmcm9tICcuLi90cmFuc2Zvcm1lcnMvbWV0YWRhdGFfY2FjaGUnO1xuXG5pbXBvcnQge01ldGFkYXRhQ29sbGVjdG9yfSBmcm9tICcuL2NvbGxlY3Rvcic7XG5pbXBvcnQge0NsYXNzTWV0YWRhdGEsIENvbnN0cnVjdG9yTWV0YWRhdGEsIEZ1bmN0aW9uTWV0YWRhdGEsIE1FVEFEQVRBX1ZFUlNJT04sIE1lbWJlck1ldGFkYXRhLCBNZXRhZGF0YUVudHJ5LCBNZXRhZGF0YUVycm9yLCBNZXRhZGF0YUltcG9ydGVkU3ltYm9sUmVmZXJlbmNlRXhwcmVzc2lvbiwgTWV0YWRhdGFNYXAsIE1ldGFkYXRhT2JqZWN0LCBNZXRhZGF0YVN5bWJvbGljRXhwcmVzc2lvbiwgTWV0YWRhdGFTeW1ib2xpY1JlZmVyZW5jZUV4cHJlc3Npb24sIE1ldGFkYXRhVmFsdWUsIE1ldGhvZE1ldGFkYXRhLCBNb2R1bGVFeHBvcnRNZXRhZGF0YSwgTW9kdWxlTWV0YWRhdGEsIGlzQ2xhc3NNZXRhZGF0YSwgaXNDb25zdHJ1Y3Rvck1ldGFkYXRhLCBpc0Z1bmN0aW9uTWV0YWRhdGEsIGlzSW50ZXJmYWNlTWV0YWRhdGEsIGlzTWV0YWRhdGFFcnJvciwgaXNNZXRhZGF0YUdsb2JhbFJlZmVyZW5jZUV4cHJlc3Npb24sIGlzTWV0YWRhdGFJbXBvcnRlZFN5bWJvbFJlZmVyZW5jZUV4cHJlc3Npb24sIGlzTWV0YWRhdGFNb2R1bGVSZWZlcmVuY2VFeHByZXNzaW9uLCBpc01ldGFkYXRhU3ltYm9saWNFeHByZXNzaW9uLCBpc01ldGhvZE1ldGFkYXRhfSBmcm9tICcuL3NjaGVtYSc7XG5cblxuXG4vLyBUaGUgY2hhcmFjdGVyIHNldCB1c2VkIHRvIHByb2R1Y2UgcHJpdmF0ZSBuYW1lcy5cbmNvbnN0IFBSSVZBVEVfTkFNRV9DSEFSUyA9ICdhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5eic7XG5cbmludGVyZmFjZSBTeW1ib2wge1xuICBtb2R1bGU6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xuXG4gIC8vIFByb2R1Y2VkIGJ5IGluZGlyZWN0bHkgYnkgZXhwb3J0QWxsKCkgZm9yIHN5bWJvbHMgcmUtZXhwb3J0IGFub3RoZXIgc3ltYm9sLlxuICBleHBvcnRzPzogU3ltYm9sO1xuXG4gIC8vIFByb2R1Y2VkIGJ5IGluZGlyZWN0bHkgYnkgZXhwb3J0QWxsKCkgZm9yIHN5bWJvbHMgYXJlIHJlLWV4cG9ydGVkIGJ5IGFub3RoZXIgc3ltYm9sLlxuICByZWV4cG9ydGVkQXM/OiBTeW1ib2w7XG5cbiAgLy8gUHJvZHVjZWQgYnkgY2Fub25pY2FsaXplU3ltYm9scygpIGZvciBhbGwgc3ltYm9scy4gQSBzeW1ib2wgaXMgcHJpdmF0ZSBpZiBpdCBpcyBub3RcbiAgLy8gZXhwb3J0ZWQgYnkgdGhlIGluZGV4LlxuICBpc1ByaXZhdGU/OiBib29sZWFuO1xuXG4gIC8vIFByb2R1Y2VkIGJ5IGNhbm9uaWNhbGl6ZVN5bWJvbHMoKSBmb3IgYWxsIHN5bWJvbHMuIFRoaXMgaXMgdGhlIG9uZSBzeW1ib2wgdGhhdFxuICAvLyByZXNwcmVzZW50cyBhbGwgb3RoZXIgc3ltYm9scyBhbmQgaXMgdGhlIG9ubHkgc3ltYm9sIHRoYXQsIGFtb25nIGFsbCB0aGUgcmUtZXhwb3J0ZWRcbiAgLy8gYWxpYXNlcywgd2hvc2UgZmllbGRzIGNhbiBiZSB0cnVzdGVkIHRvIGNvbnRhaW4gdGhlIGNvcnJlY3QgaW5mb3JtYXRpb24uXG4gIC8vIEZvciBwcml2YXRlIHN5bWJvbHMgdGhpcyBpcyB0aGUgZGVjbGFyYXRpb24gc3ltYm9sLiBGb3IgcHVibGljIHN5bWJvbHMgdGhpcyBpcyB0aGVcbiAgLy8gc3ltYm9sIHRoYXQgaXMgZXhwb3J0ZWQuXG4gIGNhbm9uaWNhbFN5bWJvbD86IFN5bWJvbDtcblxuICAvLyBQcm9kdWNlZCBieSBjYW5vbmljYWxpemVTeW1ib2xzKCkgZm9yIGFsbCBzeW1ib2xzLiBUaGlzIHRoZSBzeW1ib2wgdGhhdCBvcmlnaW5hbGx5XG4gIC8vIGRlY2xhcmVkIHRoZSB2YWx1ZSBhbmQgc2hvdWxkIGJlIHVzZWQgdG8gZmV0Y2ggdGhlIHZhbHVlLlxuICBkZWNsYXJhdGlvbj86IFN5bWJvbDtcblxuICAvLyBBIHN5bWJvbCBpcyByZWZlcmVuY2VkIGlmIGl0IGlzIGV4cG9ydGVkIGZyb20gaW5kZXggb3IgcmVmZXJlbmNlZCBieSB0aGUgdmFsdWUgb2ZcbiAgLy8gYSByZWZlcmVuY2VkIHN5bWJvbCdzIHZhbHVlLlxuICByZWZlcmVuY2VkPzogYm9vbGVhbjtcblxuICAvLyBBIHN5bWJvbCBpcyBtYXJrZWQgYXMgYSByZS1leHBvcnQgdGhlIHN5bWJvbCB3YXMgcmV4cG9ydGVkIGZyb20gYSBtb2R1bGUgdGhhdCBpc1xuICAvLyBub3QgcGFydCBvZiB0aGUgZmxhdCBtb2R1bGUgYnVuZGxlLlxuICByZWV4cG9ydD86IGJvb2xlYW47XG5cbiAgLy8gT25seSB2YWxpZCBmb3IgcmVmZXJlbmNlZCBjYW5vbmljYWwgc3ltYm9scy4gUHJvZHVjZXMgYnkgY29udmVydFN5bWJvbHMoKS5cbiAgdmFsdWU/OiBNZXRhZGF0YUVudHJ5O1xuXG4gIC8vIE9ubHkgdmFsaWQgZm9yIHJlZmVyZW5jZWQgcHJpdmF0ZSBzeW1ib2xzLiBJdCBpcyB0aGUgbmFtZSB0byB1c2UgdG8gaW1wb3J0IHRoZSBzeW1ib2wgZnJvbVxuICAvLyB0aGUgYnVuZGxlIGluZGV4LiBQcm9kdWNlIGJ5IGFzc2lnblByaXZhdGVOYW1lcygpO1xuICBwcml2YXRlTmFtZT86IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBCdW5kbGVFbnRyaWVzIHsgW25hbWU6IHN0cmluZ106IE1ldGFkYXRhRW50cnk7IH1cblxuZXhwb3J0IGludGVyZmFjZSBCdW5kbGVQcml2YXRlRW50cnkge1xuICBwcml2YXRlTmFtZTogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG4gIG1vZHVsZTogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEJ1bmRsZWRNb2R1bGUge1xuICBtZXRhZGF0YTogTW9kdWxlTWV0YWRhdGE7XG4gIHByaXZhdGVzOiBCdW5kbGVQcml2YXRlRW50cnlbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNZXRhZGF0YUJ1bmRsZXJIb3N0IHtcbiAgZ2V0TWV0YWRhdGFGb3IobW9kdWxlTmFtZTogc3RyaW5nLCBjb250YWluaW5nRmlsZTogc3RyaW5nKTogTW9kdWxlTWV0YWRhdGF8dW5kZWZpbmVkO1xufVxuXG50eXBlIFN0YXRpY3NNZXRhZGF0YSA9IHtcbiAgW25hbWU6IHN0cmluZ106IE1ldGFkYXRhVmFsdWUgfCBGdW5jdGlvbk1ldGFkYXRhO1xufTtcblxuZXhwb3J0IGNsYXNzIE1ldGFkYXRhQnVuZGxlciB7XG4gIHByaXZhdGUgc3ltYm9sTWFwID0gbmV3IE1hcDxzdHJpbmcsIFN5bWJvbD4oKTtcbiAgcHJpdmF0ZSBtZXRhZGF0YUNhY2hlID0gbmV3IE1hcDxzdHJpbmcsIE1vZHVsZU1ldGFkYXRhfHVuZGVmaW5lZD4oKTtcbiAgcHJpdmF0ZSBleHBvcnRzID0gbmV3IE1hcDxzdHJpbmcsIFN5bWJvbFtdPigpO1xuICBwcml2YXRlIHJvb3RNb2R1bGU6IHN0cmluZztcbiAgcHJpdmF0ZSBwcml2YXRlU3ltYm9sUHJlZml4OiBzdHJpbmc7XG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBwcml2YXRlIGV4cG9ydGVkICE6IFNldDxTeW1ib2w+O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSByb290OiBzdHJpbmcsIHByaXZhdGUgaW1wb3J0QXM6IHN0cmluZ3x1bmRlZmluZWQsIHByaXZhdGUgaG9zdDogTWV0YWRhdGFCdW5kbGVySG9zdCxcbiAgICAgIHByaXZhdGVTeW1ib2xQcmVmaXg/OiBzdHJpbmcpIHtcbiAgICB0aGlzLnJvb3RNb2R1bGUgPSBgLi8ke3BhdGguYmFzZW5hbWUocm9vdCl9YDtcbiAgICB0aGlzLnByaXZhdGVTeW1ib2xQcmVmaXggPSAocHJpdmF0ZVN5bWJvbFByZWZpeCB8fCAnJykucmVwbGFjZSgvXFxXL2csICdfJyk7XG4gIH1cblxuICBnZXRNZXRhZGF0YUJ1bmRsZSgpOiBCdW5kbGVkTW9kdWxlIHtcbiAgICAvLyBFeHBvcnQgdGhlIHJvb3QgbW9kdWxlLiBUaGlzIGFsc28gY29sbGVjdHMgdGhlIHRyYW5zaXRpdmUgY2xvc3VyZSBvZiBhbGwgdmFsdWVzIHJlZmVyZW5jZWQgYnlcbiAgICAvLyB0aGUgZXhwb3J0cy5cbiAgICBjb25zdCBleHBvcnRlZFN5bWJvbHMgPSB0aGlzLmV4cG9ydEFsbCh0aGlzLnJvb3RNb2R1bGUpO1xuICAgIHRoaXMuY2Fub25pY2FsaXplU3ltYm9scyhleHBvcnRlZFN5bWJvbHMpO1xuICAgIC8vIFRPRE86IGV4cG9ydHM/IGUuZy4gYSBtb2R1bGUgcmUtZXhwb3J0cyBhIHN5bWJvbCBmcm9tIGFub3RoZXIgYnVuZGxlXG4gICAgY29uc3QgbWV0YWRhdGEgPSB0aGlzLmdldEVudHJpZXMoZXhwb3J0ZWRTeW1ib2xzKTtcbiAgICBjb25zdCBwcml2YXRlcyA9IEFycmF5LmZyb20odGhpcy5zeW1ib2xNYXAudmFsdWVzKCkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgLmZpbHRlcihzID0+IHMucmVmZXJlbmNlZCAmJiBzLmlzUHJpdmF0ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAubWFwKHMgPT4gKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJpdmF0ZU5hbWU6IHMucHJpdmF0ZU5hbWUgISxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogcy5kZWNsYXJhdGlvbiAhLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZHVsZTogcy5kZWNsYXJhdGlvbiAhLm1vZHVsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgIGNvbnN0IG9yaWdpbnMgPSBBcnJheS5mcm9tKHRoaXMuc3ltYm9sTWFwLnZhbHVlcygpKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmZpbHRlcihzID0+IHMucmVmZXJlbmNlZCAmJiAhcy5yZWV4cG9ydClcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZWR1Y2U8e1tuYW1lOiBzdHJpbmddOiBzdHJpbmd9PigocCwgcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBwW3MuaXNQcml2YXRlID8gcy5wcml2YXRlTmFtZSAhIDogcy5uYW1lXSA9IHMuZGVjbGFyYXRpb24gIS5tb2R1bGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwge30pO1xuICAgIGNvbnN0IGV4cG9ydHMgPSB0aGlzLmdldFJlRXhwb3J0cyhleHBvcnRlZFN5bWJvbHMpO1xuICAgIHJldHVybiB7XG4gICAgICBtZXRhZGF0YToge1xuICAgICAgICBfX3N5bWJvbGljOiAnbW9kdWxlJyxcbiAgICAgICAgdmVyc2lvbjogTUVUQURBVEFfVkVSU0lPTixcbiAgICAgICAgZXhwb3J0czogZXhwb3J0cy5sZW5ndGggPyBleHBvcnRzIDogdW5kZWZpbmVkLCBtZXRhZGF0YSwgb3JpZ2lucyxcbiAgICAgICAgaW1wb3J0QXM6IHRoaXMuaW1wb3J0QXMgIVxuICAgICAgfSxcbiAgICAgIHByaXZhdGVzXG4gICAgfTtcbiAgfVxuXG4gIHN0YXRpYyByZXNvbHZlTW9kdWxlKGltcG9ydE5hbWU6IHN0cmluZywgZnJvbTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gcmVzb2x2ZU1vZHVsZShpbXBvcnROYW1lLCBmcm9tKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0TWV0YWRhdGEobW9kdWxlTmFtZTogc3RyaW5nKTogTW9kdWxlTWV0YWRhdGF8dW5kZWZpbmVkIHtcbiAgICBsZXQgcmVzdWx0ID0gdGhpcy5tZXRhZGF0YUNhY2hlLmdldChtb2R1bGVOYW1lKTtcbiAgICBpZiAoIXJlc3VsdCkge1xuICAgICAgaWYgKG1vZHVsZU5hbWUuc3RhcnRzV2l0aCgnLicpKSB7XG4gICAgICAgIGNvbnN0IGZ1bGxNb2R1bGVOYW1lID0gcmVzb2x2ZU1vZHVsZShtb2R1bGVOYW1lLCB0aGlzLnJvb3QpO1xuICAgICAgICByZXN1bHQgPSB0aGlzLmhvc3QuZ2V0TWV0YWRhdGFGb3IoZnVsbE1vZHVsZU5hbWUsIHRoaXMucm9vdCk7XG4gICAgICB9XG4gICAgICB0aGlzLm1ldGFkYXRhQ2FjaGUuc2V0KG1vZHVsZU5hbWUsIHJlc3VsdCk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBwcml2YXRlIGV4cG9ydEFsbChtb2R1bGVOYW1lOiBzdHJpbmcpOiBTeW1ib2xbXSB7XG4gICAgY29uc3QgbW9kdWxlID0gdGhpcy5nZXRNZXRhZGF0YShtb2R1bGVOYW1lKTtcbiAgICBsZXQgcmVzdWx0ID0gdGhpcy5leHBvcnRzLmdldChtb2R1bGVOYW1lKTtcblxuICAgIGlmIChyZXN1bHQpIHtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcmVzdWx0ID0gW107XG5cbiAgICBjb25zdCBleHBvcnRTeW1ib2wgPSAoZXhwb3J0ZWRTeW1ib2w6IFN5bWJvbCwgZXhwb3J0QXM6IHN0cmluZykgPT4ge1xuICAgICAgY29uc3Qgc3ltYm9sID0gdGhpcy5zeW1ib2xPZihtb2R1bGVOYW1lLCBleHBvcnRBcyk7XG4gICAgICByZXN1bHQgIS5wdXNoKHN5bWJvbCk7XG4gICAgICBleHBvcnRlZFN5bWJvbC5yZWV4cG9ydGVkQXMgPSBzeW1ib2w7XG4gICAgICBzeW1ib2wuZXhwb3J0cyA9IGV4cG9ydGVkU3ltYm9sO1xuICAgIH07XG5cbiAgICAvLyBFeHBvcnQgYWxsIHRoZSBzeW1ib2xzIGRlZmluZWQgaW4gdGhpcyBtb2R1bGUuXG4gICAgaWYgKG1vZHVsZSAmJiBtb2R1bGUubWV0YWRhdGEpIHtcbiAgICAgIGZvciAobGV0IGtleSBpbiBtb2R1bGUubWV0YWRhdGEpIHtcbiAgICAgICAgY29uc3QgZGF0YSA9IG1vZHVsZS5tZXRhZGF0YVtrZXldO1xuICAgICAgICBpZiAoaXNNZXRhZGF0YUltcG9ydGVkU3ltYm9sUmVmZXJlbmNlRXhwcmVzc2lvbihkYXRhKSkge1xuICAgICAgICAgIC8vIFRoaXMgaXMgYSByZS1leHBvcnQgb2YgYW4gaW1wb3J0ZWQgc3ltYm9sLiBSZWNvcmQgdGhpcyBhcyBhIHJlLWV4cG9ydC5cbiAgICAgICAgICBjb25zdCBleHBvcnRGcm9tID0gcmVzb2x2ZU1vZHVsZShkYXRhLm1vZHVsZSwgbW9kdWxlTmFtZSk7XG4gICAgICAgICAgdGhpcy5leHBvcnRBbGwoZXhwb3J0RnJvbSk7XG4gICAgICAgICAgY29uc3Qgc3ltYm9sID0gdGhpcy5zeW1ib2xPZihleHBvcnRGcm9tLCBkYXRhLm5hbWUpO1xuICAgICAgICAgIGV4cG9ydFN5bWJvbChzeW1ib2wsIGtleSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gUmVjb3JkIHRoYXQgdGhpcyBzeW1ib2wgaXMgZXhwb3J0ZWQgYnkgdGhpcyBtb2R1bGUuXG4gICAgICAgICAgcmVzdWx0LnB1c2godGhpcy5zeW1ib2xPZihtb2R1bGVOYW1lLCBrZXkpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEV4cG9ydCBhbGwgdGhlIHJlLWV4cG9ydHMgZnJvbSB0aGlzIG1vZHVsZVxuICAgIGlmIChtb2R1bGUgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAgIGZvciAoY29uc3QgZXhwb3J0RGVjbGFyYXRpb24gb2YgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAgICAgY29uc3QgZXhwb3J0RnJvbSA9IHJlc29sdmVNb2R1bGUoZXhwb3J0RGVjbGFyYXRpb24uZnJvbSwgbW9kdWxlTmFtZSk7XG4gICAgICAgIC8vIFJlY29yZCBhbGwgdGhlIGV4cG9ydHMgZnJvbSB0aGUgbW9kdWxlIGV2ZW4gaWYgd2UgZG9uJ3QgdXNlIGl0IGRpcmVjdGx5LlxuICAgICAgICBjb25zdCBleHBvcnRlZFN5bWJvbHMgPSB0aGlzLmV4cG9ydEFsbChleHBvcnRGcm9tKTtcbiAgICAgICAgaWYgKGV4cG9ydERlY2xhcmF0aW9uLmV4cG9ydCkge1xuICAgICAgICAgIC8vIFJlLWV4cG9ydCBhbGwgdGhlIG5hbWVkIGV4cG9ydHMgZnJvbSBhIG1vZHVsZS5cbiAgICAgICAgICBmb3IgKGNvbnN0IGV4cG9ydEl0ZW0gb2YgZXhwb3J0RGVjbGFyYXRpb24uZXhwb3J0KSB7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gdHlwZW9mIGV4cG9ydEl0ZW0gPT0gJ3N0cmluZycgPyBleHBvcnRJdGVtIDogZXhwb3J0SXRlbS5uYW1lO1xuICAgICAgICAgICAgY29uc3QgZXhwb3J0QXMgPSB0eXBlb2YgZXhwb3J0SXRlbSA9PSAnc3RyaW5nJyA/IGV4cG9ydEl0ZW0gOiBleHBvcnRJdGVtLmFzO1xuICAgICAgICAgICAgY29uc3Qgc3ltYm9sID0gdGhpcy5zeW1ib2xPZihleHBvcnRGcm9tLCBuYW1lKTtcbiAgICAgICAgICAgIGlmIChleHBvcnRlZFN5bWJvbHMgJiYgZXhwb3J0ZWRTeW1ib2xzLmxlbmd0aCA9PSAxICYmIGV4cG9ydGVkU3ltYm9sc1swXS5yZWV4cG9ydCAmJlxuICAgICAgICAgICAgICAgIGV4cG9ydGVkU3ltYm9sc1swXS5uYW1lID09ICcqJykge1xuICAgICAgICAgICAgICAvLyBUaGlzIGlzIGEgbmFtZWQgZXhwb3J0IGZyb20gYSBtb2R1bGUgd2UgaGF2ZSBubyBtZXRhZGF0YSBhYm91dC4gUmVjb3JkIHRoZSBuYW1lZFxuICAgICAgICAgICAgICAvLyBleHBvcnQgYXMgYSByZS1leHBvcnQuXG4gICAgICAgICAgICAgIHN5bWJvbC5yZWV4cG9ydCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBleHBvcnRTeW1ib2wodGhpcy5zeW1ib2xPZihleHBvcnRGcm9tLCBuYW1lKSwgZXhwb3J0QXMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBSZS1leHBvcnQgYWxsIHRoZSBzeW1ib2xzIGZyb20gdGhlIG1vZHVsZVxuICAgICAgICAgIGNvbnN0IGV4cG9ydGVkU3ltYm9scyA9IHRoaXMuZXhwb3J0QWxsKGV4cG9ydEZyb20pO1xuICAgICAgICAgIGZvciAoY29uc3QgZXhwb3J0ZWRTeW1ib2wgb2YgZXhwb3J0ZWRTeW1ib2xzKSB7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gZXhwb3J0ZWRTeW1ib2wubmFtZTtcbiAgICAgICAgICAgIGV4cG9ydFN5bWJvbChleHBvcnRlZFN5bWJvbCwgbmFtZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFtb2R1bGUpIHtcbiAgICAgIC8vIElmIG5vIG1ldGFkYXRhIGlzIGZvdW5kIGZvciB0aGlzIGltcG9ydCB0aGVuIGl0IGlzIGNvbnNpZGVyZWQgZXh0ZXJuYWwgdG8gdGhlXG4gICAgICAvLyBsaWJyYXJ5IGFuZCBzaG91bGQgYmUgcmVjb3JkZWQgYXMgYSByZS1leHBvcnQgaW4gdGhlIGZpbmFsIG1ldGFkYXRhIGlmIGl0IGlzXG4gICAgICAvLyBldmVudHVhbGx5IHJlLWV4cG9ydGVkLlxuICAgICAgY29uc3Qgc3ltYm9sID0gdGhpcy5zeW1ib2xPZihtb2R1bGVOYW1lLCAnKicpO1xuICAgICAgc3ltYm9sLnJlZXhwb3J0ID0gdHJ1ZTtcbiAgICAgIHJlc3VsdC5wdXNoKHN5bWJvbCk7XG4gICAgfVxuICAgIHRoaXMuZXhwb3J0cy5zZXQobW9kdWxlTmFtZSwgcmVzdWx0KTtcblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogRmlsbCBpbiB0aGUgY2Fub25pY2FsU3ltYm9sIHdoaWNoIGlzIHRoZSBzeW1ib2wgdGhhdCBzaG91bGQgYmUgaW1wb3J0ZWQgYnkgZmFjdG9yaWVzLlxuICAgKiBUaGUgY2Fub25pY2FsIHN5bWJvbCBpcyB0aGUgb25lIGV4cG9ydGVkIGJ5IHRoZSBpbmRleCBmaWxlIGZvciB0aGUgYnVuZGxlIG9yIGRlZmluaXRpb25cbiAgICogc3ltYm9sIGZvciBwcml2YXRlIHN5bWJvbHMgdGhhdCBhcmUgbm90IGV4cG9ydGVkIGJ5IGJ1bmRsZSBpbmRleC5cbiAgICovXG4gIHByaXZhdGUgY2Fub25pY2FsaXplU3ltYm9scyhleHBvcnRlZFN5bWJvbHM6IFN5bWJvbFtdKSB7XG4gICAgY29uc3Qgc3ltYm9scyA9IEFycmF5LmZyb20odGhpcy5zeW1ib2xNYXAudmFsdWVzKCkpO1xuICAgIHRoaXMuZXhwb3J0ZWQgPSBuZXcgU2V0KGV4cG9ydGVkU3ltYm9scyk7XG4gICAgc3ltYm9scy5mb3JFYWNoKHRoaXMuY2Fub25pY2FsaXplU3ltYm9sLCB0aGlzKTtcbiAgfVxuXG4gIHByaXZhdGUgY2Fub25pY2FsaXplU3ltYm9sKHN5bWJvbDogU3ltYm9sKSB7XG4gICAgY29uc3Qgcm9vdEV4cG9ydCA9IGdldFJvb3RFeHBvcnQoc3ltYm9sKTtcbiAgICBjb25zdCBkZWNsYXJhdGlvbiA9IGdldFN5bWJvbERlY2xhcmF0aW9uKHN5bWJvbCk7XG4gICAgY29uc3QgaXNQcml2YXRlID0gIXRoaXMuZXhwb3J0ZWQuaGFzKHJvb3RFeHBvcnQpO1xuICAgIGNvbnN0IGNhbm9uaWNhbFN5bWJvbCA9IGlzUHJpdmF0ZSA/IGRlY2xhcmF0aW9uIDogcm9vdEV4cG9ydDtcbiAgICBzeW1ib2wuaXNQcml2YXRlID0gaXNQcml2YXRlO1xuICAgIHN5bWJvbC5kZWNsYXJhdGlvbiA9IGRlY2xhcmF0aW9uO1xuICAgIHN5bWJvbC5jYW5vbmljYWxTeW1ib2wgPSBjYW5vbmljYWxTeW1ib2w7XG4gICAgc3ltYm9sLnJlZXhwb3J0ID0gZGVjbGFyYXRpb24ucmVleHBvcnQ7XG4gIH1cblxuICBwcml2YXRlIGdldEVudHJpZXMoZXhwb3J0ZWRTeW1ib2xzOiBTeW1ib2xbXSk6IEJ1bmRsZUVudHJpZXMge1xuICAgIGNvbnN0IHJlc3VsdDogQnVuZGxlRW50cmllcyA9IHt9O1xuXG4gICAgY29uc3QgZXhwb3J0ZWROYW1lcyA9IG5ldyBTZXQoZXhwb3J0ZWRTeW1ib2xzLm1hcChzID0+IHMubmFtZSkpO1xuICAgIGxldCBwcml2YXRlTmFtZSA9IDA7XG5cbiAgICBmdW5jdGlvbiBuZXdQcml2YXRlTmFtZShwcmVmaXg6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICBsZXQgZGlnaXRzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBsZXQgaW5kZXggPSBwcml2YXRlTmFtZSsrO1xuICAgICAgICBsZXQgYmFzZSA9IFBSSVZBVEVfTkFNRV9DSEFSUztcbiAgICAgICAgd2hpbGUgKCFkaWdpdHMubGVuZ3RoIHx8IGluZGV4ID4gMCkge1xuICAgICAgICAgIGRpZ2l0cy51bnNoaWZ0KGJhc2VbaW5kZXggJSBiYXNlLmxlbmd0aF0pO1xuICAgICAgICAgIGluZGV4ID0gTWF0aC5mbG9vcihpbmRleCAvIGJhc2UubGVuZ3RoKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZXN1bHQgPSBgXFx1MDI3NSR7cHJlZml4fSR7ZGlnaXRzLmpvaW4oJycpfWA7XG4gICAgICAgIGlmICghZXhwb3J0ZWROYW1lcy5oYXMocmVzdWx0KSkgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBleHBvcnRlZFN5bWJvbHMuZm9yRWFjaChzeW1ib2wgPT4gdGhpcy5jb252ZXJ0U3ltYm9sKHN5bWJvbCkpO1xuXG4gICAgY29uc3Qgc3ltYm9sc01hcCA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmdbXT4oKTtcbiAgICBBcnJheS5mcm9tKHRoaXMuc3ltYm9sTWFwLnZhbHVlcygpKS5mb3JFYWNoKHN5bWJvbCA9PiB7XG4gICAgICBpZiAoc3ltYm9sLnJlZmVyZW5jZWQgJiYgIXN5bWJvbC5yZWV4cG9ydCkge1xuICAgICAgICBsZXQgbmFtZSA9IHN5bWJvbC5uYW1lO1xuICAgICAgICBjb25zdCBpZGVudGlmaWVyID0gYCR7c3ltYm9sLmRlY2xhcmF0aW9uIS5tb2R1bGV9OiR7c3ltYm9sLmRlY2xhcmF0aW9uICEubmFtZX1gO1xuICAgICAgICBpZiAoc3ltYm9sLmlzUHJpdmF0ZSAmJiAhc3ltYm9sLnByaXZhdGVOYW1lKSB7XG4gICAgICAgICAgbmFtZSA9IG5ld1ByaXZhdGVOYW1lKHRoaXMucHJpdmF0ZVN5bWJvbFByZWZpeCk7XG4gICAgICAgICAgc3ltYm9sLnByaXZhdGVOYW1lID0gbmFtZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3ltYm9sc01hcC5oYXMoaWRlbnRpZmllcikpIHtcbiAgICAgICAgICBjb25zdCBuYW1lcyA9IHN5bWJvbHNNYXAuZ2V0KGlkZW50aWZpZXIpO1xuICAgICAgICAgIG5hbWVzICEucHVzaChuYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzeW1ib2xzTWFwLnNldChpZGVudGlmaWVyLCBbbmFtZV0pO1xuICAgICAgICB9XG4gICAgICAgIHJlc3VsdFtuYW1lXSA9IHN5bWJvbC52YWx1ZSAhO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gY2hlY2sgZm9yIGR1cGxpY2F0ZWQgZW50cmllc1xuICAgIHN5bWJvbHNNYXAuZm9yRWFjaCgobmFtZXM6IHN0cmluZ1tdLCBpZGVudGlmaWVyOiBzdHJpbmcpID0+IHtcbiAgICAgIGlmIChuYW1lcy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGNvbnN0IFttb2R1bGUsIGRlY2xhcmVkTmFtZV0gPSBpZGVudGlmaWVyLnNwbGl0KCc6Jyk7XG4gICAgICAgIC8vIHByZWZlciB0aGUgZXhwb3J0IHRoYXQgdXNlcyB0aGUgZGVjbGFyZWQgbmFtZSAoaWYgYW55KVxuICAgICAgICBsZXQgcmVmZXJlbmNlID0gbmFtZXMuaW5kZXhPZihkZWNsYXJlZE5hbWUpO1xuICAgICAgICBpZiAocmVmZXJlbmNlID09PSAtMSkge1xuICAgICAgICAgIHJlZmVyZW5jZSA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBrZWVwIG9uZSBlbnRyeSBhbmQgcmVwbGFjZSB0aGUgb3RoZXJzIGJ5IHJlZmVyZW5jZXNcbiAgICAgICAgbmFtZXMuZm9yRWFjaCgobmFtZTogc3RyaW5nLCBpOiBudW1iZXIpID0+IHtcbiAgICAgICAgICBpZiAoaSAhPT0gcmVmZXJlbmNlKSB7XG4gICAgICAgICAgICByZXN1bHRbbmFtZV0gPSB7X19zeW1ib2xpYzogJ3JlZmVyZW5jZScsIG5hbWU6IG5hbWVzW3JlZmVyZW5jZV19O1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRSZUV4cG9ydHMoZXhwb3J0ZWRTeW1ib2xzOiBTeW1ib2xbXSk6IE1vZHVsZUV4cG9ydE1ldGFkYXRhW10ge1xuICAgIHR5cGUgRXhwb3J0Q2xhdXNlID0ge25hbWU6IHN0cmluZywgYXM6IHN0cmluZ31bXTtcbiAgICBjb25zdCBtb2R1bGVzID0gbmV3IE1hcDxzdHJpbmcsIEV4cG9ydENsYXVzZT4oKTtcbiAgICBjb25zdCBleHBvcnRBbGxzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgZm9yIChjb25zdCBzeW1ib2wgb2YgZXhwb3J0ZWRTeW1ib2xzKSB7XG4gICAgICBpZiAoc3ltYm9sLnJlZXhwb3J0KSB7XG4gICAgICAgIC8vIHN5bWJvbC5kZWNsYXJhdGlvbiBpcyBndWFyYW50ZWVkIHRvIGJlIGRlZmluZWQgZHVyaW5nIHRoZSBwaGFzZSB0aGlzIG1ldGhvZCBpcyBjYWxsZWQuXG4gICAgICAgIGNvbnN0IGRlY2xhcmF0aW9uID0gc3ltYm9sLmRlY2xhcmF0aW9uICE7XG4gICAgICAgIGNvbnN0IG1vZHVsZSA9IGRlY2xhcmF0aW9uLm1vZHVsZTtcbiAgICAgICAgaWYgKGRlY2xhcmF0aW9uICEubmFtZSA9PSAnKicpIHtcbiAgICAgICAgICAvLyBSZWV4cG9ydCBhbGwgdGhlIHN5bWJvbHMuXG4gICAgICAgICAgZXhwb3J0QWxscy5hZGQoZGVjbGFyYXRpb24ubW9kdWxlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBSZS1leHBvcnQgdGhlIHN5bWJvbCBhcyB0aGUgZXhwb3J0ZWQgbmFtZS5cbiAgICAgICAgICBsZXQgZW50cnkgPSBtb2R1bGVzLmdldChtb2R1bGUpO1xuICAgICAgICAgIGlmICghZW50cnkpIHtcbiAgICAgICAgICAgIGVudHJ5ID0gW107XG4gICAgICAgICAgICBtb2R1bGVzLnNldChtb2R1bGUsIGVudHJ5KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgYXMgPSBzeW1ib2wubmFtZTtcbiAgICAgICAgICBjb25zdCBuYW1lID0gZGVjbGFyYXRpb24ubmFtZTtcbiAgICAgICAgICBlbnRyeS5wdXNoKHtuYW1lLCBhc30pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBbXG4gICAgICAuLi5BcnJheS5mcm9tKGV4cG9ydEFsbHMudmFsdWVzKCkpLm1hcChmcm9tID0+ICh7ZnJvbX0pKSxcbiAgICAgIC4uLkFycmF5LmZyb20obW9kdWxlcy5lbnRyaWVzKCkpLm1hcCgoW2Zyb20sIGV4cG9ydHNdKSA9PiAoe2V4cG9ydDogZXhwb3J0cywgZnJvbX0pKVxuICAgIF07XG4gIH1cblxuICBwcml2YXRlIGNvbnZlcnRTeW1ib2woc3ltYm9sOiBTeW1ib2wpIHtcbiAgICAvLyBjYW5vbmljYWxTeW1ib2wgaXMgZW5zdXJlZCB0byBiZSBkZWZpbmVkIGJlZm9yZSB0aGlzIGlzIGNhbGxlZC5cbiAgICBjb25zdCBjYW5vbmljYWxTeW1ib2wgPSBzeW1ib2wuY2Fub25pY2FsU3ltYm9sICE7XG5cbiAgICBpZiAoIWNhbm9uaWNhbFN5bWJvbC5yZWZlcmVuY2VkKSB7XG4gICAgICBjYW5vbmljYWxTeW1ib2wucmVmZXJlbmNlZCA9IHRydWU7XG4gICAgICAvLyBkZWNsYXJhdGlvbiBpcyBlbnN1cmVkIHRvIGJlIGRlZmluZGVkIGJlZm9yZSB0aGlzIG1ldGhvZCBpcyBjYWxsZWQuXG4gICAgICBjb25zdCBkZWNsYXJhdGlvbiA9IGNhbm9uaWNhbFN5bWJvbC5kZWNsYXJhdGlvbiAhO1xuICAgICAgY29uc3QgbW9kdWxlID0gdGhpcy5nZXRNZXRhZGF0YShkZWNsYXJhdGlvbi5tb2R1bGUpO1xuICAgICAgaWYgKG1vZHVsZSkge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IG1vZHVsZS5tZXRhZGF0YVtkZWNsYXJhdGlvbi5uYW1lXTtcbiAgICAgICAgaWYgKHZhbHVlICYmICFkZWNsYXJhdGlvbi5uYW1lLnN0YXJ0c1dpdGgoJ19fXycpKSB7XG4gICAgICAgICAgY2Fub25pY2FsU3ltYm9sLnZhbHVlID0gdGhpcy5jb252ZXJ0RW50cnkoZGVjbGFyYXRpb24ubW9kdWxlLCB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGNvbnZlcnRFbnRyeShtb2R1bGVOYW1lOiBzdHJpbmcsIHZhbHVlOiBNZXRhZGF0YUVudHJ5KTogTWV0YWRhdGFFbnRyeSB7XG4gICAgaWYgKGlzQ2xhc3NNZXRhZGF0YSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiB0aGlzLmNvbnZlcnRDbGFzcyhtb2R1bGVOYW1lLCB2YWx1ZSk7XG4gICAgfVxuICAgIGlmIChpc0Z1bmN0aW9uTWV0YWRhdGEodmFsdWUpKSB7XG4gICAgICByZXR1cm4gdGhpcy5jb252ZXJ0RnVuY3Rpb24obW9kdWxlTmFtZSwgdmFsdWUpO1xuICAgIH1cbiAgICBpZiAoaXNJbnRlcmZhY2VNZXRhZGF0YSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuY29udmVydFZhbHVlKG1vZHVsZU5hbWUsIHZhbHVlKTtcbiAgfVxuXG4gIHByaXZhdGUgY29udmVydENsYXNzKG1vZHVsZU5hbWU6IHN0cmluZywgdmFsdWU6IENsYXNzTWV0YWRhdGEpOiBDbGFzc01ldGFkYXRhIHtcbiAgICByZXR1cm4ge1xuICAgICAgX19zeW1ib2xpYzogJ2NsYXNzJyxcbiAgICAgIGFyaXR5OiB2YWx1ZS5hcml0eSxcbiAgICAgIGV4dGVuZHM6IHRoaXMuY29udmVydEV4cHJlc3Npb24obW9kdWxlTmFtZSwgdmFsdWUuZXh0ZW5kcykgISxcbiAgICAgIGRlY29yYXRvcnM6XG4gICAgICAgICAgdmFsdWUuZGVjb3JhdG9ycyAmJiB2YWx1ZS5kZWNvcmF0b3JzLm1hcChkID0+IHRoaXMuY29udmVydEV4cHJlc3Npb24obW9kdWxlTmFtZSwgZCkgISksXG4gICAgICBtZW1iZXJzOiB0aGlzLmNvbnZlcnRNZW1iZXJzKG1vZHVsZU5hbWUsIHZhbHVlLm1lbWJlcnMgISksXG4gICAgICBzdGF0aWNzOiB2YWx1ZS5zdGF0aWNzICYmIHRoaXMuY29udmVydFN0YXRpY3MobW9kdWxlTmFtZSwgdmFsdWUuc3RhdGljcylcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBjb252ZXJ0TWVtYmVycyhtb2R1bGVOYW1lOiBzdHJpbmcsIG1lbWJlcnM6IE1ldGFkYXRhTWFwKTogTWV0YWRhdGFNYXAge1xuICAgIGNvbnN0IHJlc3VsdDogTWV0YWRhdGFNYXAgPSB7fTtcbiAgICBmb3IgKGNvbnN0IG5hbWUgaW4gbWVtYmVycykge1xuICAgICAgY29uc3QgdmFsdWUgPSBtZW1iZXJzW25hbWVdO1xuICAgICAgcmVzdWx0W25hbWVdID0gdmFsdWUubWFwKHYgPT4gdGhpcy5jb252ZXJ0TWVtYmVyKG1vZHVsZU5hbWUsIHYpKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHByaXZhdGUgY29udmVydE1lbWJlcihtb2R1bGVOYW1lOiBzdHJpbmcsIG1lbWJlcjogTWVtYmVyTWV0YWRhdGEpIHtcbiAgICBjb25zdCByZXN1bHQ6IE1lbWJlck1ldGFkYXRhID0ge19fc3ltYm9saWM6IG1lbWJlci5fX3N5bWJvbGljfTtcbiAgICByZXN1bHQuZGVjb3JhdG9ycyA9XG4gICAgICAgIG1lbWJlci5kZWNvcmF0b3JzICYmIG1lbWJlci5kZWNvcmF0b3JzLm1hcChkID0+IHRoaXMuY29udmVydEV4cHJlc3Npb24obW9kdWxlTmFtZSwgZCkgISk7XG4gICAgaWYgKGlzTWV0aG9kTWV0YWRhdGEobWVtYmVyKSkge1xuICAgICAgKHJlc3VsdCBhcyBNZXRob2RNZXRhZGF0YSkucGFyYW1ldGVyRGVjb3JhdG9ycyA9IG1lbWJlci5wYXJhbWV0ZXJEZWNvcmF0b3JzICYmXG4gICAgICAgICAgbWVtYmVyLnBhcmFtZXRlckRlY29yYXRvcnMubWFwKFxuICAgICAgICAgICAgICBkID0+IGQgJiYgZC5tYXAocCA9PiB0aGlzLmNvbnZlcnRFeHByZXNzaW9uKG1vZHVsZU5hbWUsIHApICEpKTtcbiAgICAgIGlmIChpc0NvbnN0cnVjdG9yTWV0YWRhdGEobWVtYmVyKSkge1xuICAgICAgICBpZiAobWVtYmVyLnBhcmFtZXRlcnMpIHtcbiAgICAgICAgICAocmVzdWx0IGFzIENvbnN0cnVjdG9yTWV0YWRhdGEpLnBhcmFtZXRlcnMgPVxuICAgICAgICAgICAgICBtZW1iZXIucGFyYW1ldGVycy5tYXAocCA9PiB0aGlzLmNvbnZlcnRFeHByZXNzaW9uKG1vZHVsZU5hbWUsIHApKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgcHJpdmF0ZSBjb252ZXJ0U3RhdGljcyhtb2R1bGVOYW1lOiBzdHJpbmcsIHN0YXRpY3M6IFN0YXRpY3NNZXRhZGF0YSk6IFN0YXRpY3NNZXRhZGF0YSB7XG4gICAgbGV0IHJlc3VsdDogU3RhdGljc01ldGFkYXRhID0ge307XG4gICAgZm9yIChjb25zdCBrZXkgaW4gc3RhdGljcykge1xuICAgICAgY29uc3QgdmFsdWUgPSBzdGF0aWNzW2tleV07XG4gICAgICByZXN1bHRba2V5XSA9IGlzRnVuY3Rpb25NZXRhZGF0YSh2YWx1ZSkgPyB0aGlzLmNvbnZlcnRGdW5jdGlvbihtb2R1bGVOYW1lLCB2YWx1ZSkgOiB2YWx1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHByaXZhdGUgY29udmVydEZ1bmN0aW9uKG1vZHVsZU5hbWU6IHN0cmluZywgdmFsdWU6IEZ1bmN0aW9uTWV0YWRhdGEpOiBGdW5jdGlvbk1ldGFkYXRhIHtcbiAgICByZXR1cm4ge1xuICAgICAgX19zeW1ib2xpYzogJ2Z1bmN0aW9uJyxcbiAgICAgIHBhcmFtZXRlcnM6IHZhbHVlLnBhcmFtZXRlcnMsXG4gICAgICBkZWZhdWx0czogdmFsdWUuZGVmYXVsdHMgJiYgdmFsdWUuZGVmYXVsdHMubWFwKHYgPT4gdGhpcy5jb252ZXJ0VmFsdWUobW9kdWxlTmFtZSwgdikpLFxuICAgICAgdmFsdWU6IHRoaXMuY29udmVydFZhbHVlKG1vZHVsZU5hbWUsIHZhbHVlLnZhbHVlKVxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIGNvbnZlcnRWYWx1ZShtb2R1bGVOYW1lOiBzdHJpbmcsIHZhbHVlOiBNZXRhZGF0YVZhbHVlKTogTWV0YWRhdGFWYWx1ZSB7XG4gICAgaWYgKGlzUHJpbWl0aXZlKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICBpZiAoaXNNZXRhZGF0YUVycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIHRoaXMuY29udmVydEVycm9yKG1vZHVsZU5hbWUsIHZhbHVlKTtcbiAgICB9XG4gICAgaWYgKGlzTWV0YWRhdGFTeW1ib2xpY0V4cHJlc3Npb24odmFsdWUpKSB7XG4gICAgICByZXR1cm4gdGhpcy5jb252ZXJ0RXhwcmVzc2lvbihtb2R1bGVOYW1lLCB2YWx1ZSkgITtcbiAgICB9XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICByZXR1cm4gdmFsdWUubWFwKHYgPT4gdGhpcy5jb252ZXJ0VmFsdWUobW9kdWxlTmFtZSwgdikpO1xuICAgIH1cblxuICAgIC8vIE90aGVyd2lzZSBpdCBpcyBhIG1ldGFkYXRhIG9iamVjdC5cbiAgICBjb25zdCBvYmplY3QgPSB2YWx1ZSBhcyBNZXRhZGF0YU9iamVjdDtcbiAgICBjb25zdCByZXN1bHQ6IE1ldGFkYXRhT2JqZWN0ID0ge307XG4gICAgZm9yIChjb25zdCBrZXkgaW4gb2JqZWN0KSB7XG4gICAgICByZXN1bHRba2V5XSA9IHRoaXMuY29udmVydFZhbHVlKG1vZHVsZU5hbWUsIG9iamVjdFtrZXldKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHByaXZhdGUgY29udmVydEV4cHJlc3Npb24oXG4gICAgICBtb2R1bGVOYW1lOiBzdHJpbmcsIHZhbHVlOiBNZXRhZGF0YVN5bWJvbGljRXhwcmVzc2lvbnxNZXRhZGF0YUVycm9yfG51bGx8XG4gICAgICB1bmRlZmluZWQpOiBNZXRhZGF0YVN5bWJvbGljRXhwcmVzc2lvbnxNZXRhZGF0YUVycm9yfHVuZGVmaW5lZHxudWxsIHtcbiAgICBpZiAodmFsdWUpIHtcbiAgICAgIHN3aXRjaCAodmFsdWUuX19zeW1ib2xpYykge1xuICAgICAgICBjYXNlICdlcnJvcic6XG4gICAgICAgICAgcmV0dXJuIHRoaXMuY29udmVydEVycm9yKG1vZHVsZU5hbWUsIHZhbHVlIGFzIE1ldGFkYXRhRXJyb3IpO1xuICAgICAgICBjYXNlICdyZWZlcmVuY2UnOlxuICAgICAgICAgIHJldHVybiB0aGlzLmNvbnZlcnRSZWZlcmVuY2UobW9kdWxlTmFtZSwgdmFsdWUgYXMgTWV0YWRhdGFTeW1ib2xpY1JlZmVyZW5jZUV4cHJlc3Npb24pO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHJldHVybiB0aGlzLmNvbnZlcnRFeHByZXNzaW9uTm9kZShtb2R1bGVOYW1lLCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIHByaXZhdGUgY29udmVydEVycm9yKG1vZHVsZTogc3RyaW5nLCB2YWx1ZTogTWV0YWRhdGFFcnJvcik6IE1ldGFkYXRhRXJyb3Ige1xuICAgIHJldHVybiB7XG4gICAgICBfX3N5bWJvbGljOiAnZXJyb3InLFxuICAgICAgbWVzc2FnZTogdmFsdWUubWVzc2FnZSxcbiAgICAgIGxpbmU6IHZhbHVlLmxpbmUsXG4gICAgICBjaGFyYWN0ZXI6IHZhbHVlLmNoYXJhY3RlcixcbiAgICAgIGNvbnRleHQ6IHZhbHVlLmNvbnRleHQsIG1vZHVsZVxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIGNvbnZlcnRSZWZlcmVuY2UobW9kdWxlTmFtZTogc3RyaW5nLCB2YWx1ZTogTWV0YWRhdGFTeW1ib2xpY1JlZmVyZW5jZUV4cHJlc3Npb24pOlxuICAgICAgTWV0YWRhdGFTeW1ib2xpY1JlZmVyZW5jZUV4cHJlc3Npb258TWV0YWRhdGFFcnJvcnx1bmRlZmluZWQge1xuICAgIGNvbnN0IGNyZWF0ZVJlZmVyZW5jZSA9IChzeW1ib2w6IFN5bWJvbCk6IE1ldGFkYXRhU3ltYm9saWNSZWZlcmVuY2VFeHByZXNzaW9uID0+IHtcbiAgICAgIGNvbnN0IGRlY2xhcmF0aW9uID0gc3ltYm9sLmRlY2xhcmF0aW9uICE7XG4gICAgICBpZiAoZGVjbGFyYXRpb24ubW9kdWxlLnN0YXJ0c1dpdGgoJy4nKSkge1xuICAgICAgICAvLyBSZWZlcmVuY2UgdG8gYSBzeW1ib2wgZGVmaW5lZCBpbiB0aGUgbW9kdWxlLiBFbnN1cmUgaXQgaXMgY29udmVydGVkIHRoZW4gcmV0dXJuIGFcbiAgICAgICAgLy8gcmVmZXJlbmNlcyB0byB0aGUgZmluYWwgc3ltYm9sLlxuICAgICAgICB0aGlzLmNvbnZlcnRTeW1ib2woc3ltYm9sKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBfX3N5bWJvbGljOiAncmVmZXJlbmNlJyxcbiAgICAgICAgICBnZXQgbmFtZSgpIHtcbiAgICAgICAgICAgIC8vIFJlc29sdmVkIGxhemlseSBiZWNhdXNlIHByaXZhdGUgbmFtZXMgYXJlIGFzc2lnbmVkIGxhdGUuXG4gICAgICAgICAgICBjb25zdCBjYW5vbmljYWxTeW1ib2wgPSBzeW1ib2wuY2Fub25pY2FsU3ltYm9sICE7XG4gICAgICAgICAgICBpZiAoY2Fub25pY2FsU3ltYm9sLmlzUHJpdmF0ZSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgIHRocm93IEVycm9yKCdJbnZhbGlkIHN0YXRlOiBpc1ByaXZhdGUgd2FzIG5vdCBpbml0aWFsaXplZCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNhbm9uaWNhbFN5bWJvbC5pc1ByaXZhdGUgPyBjYW5vbmljYWxTeW1ib2wucHJpdmF0ZU5hbWUgISA6IGNhbm9uaWNhbFN5bWJvbC5uYW1lO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFRoZSBzeW1ib2wgd2FzIGEgcmUtZXhwb3J0ZWQgc3ltYm9sIGZyb20gYW5vdGhlciBtb2R1bGUuIFJldHVybiBhIHJlZmVyZW5jZSB0byB0aGVcbiAgICAgICAgLy8gb3JpZ2luYWwgaW1wb3J0ZWQgc3ltYm9sLlxuICAgICAgICByZXR1cm4ge19fc3ltYm9saWM6ICdyZWZlcmVuY2UnLCBuYW1lOiBkZWNsYXJhdGlvbi5uYW1lLCBtb2R1bGU6IGRlY2xhcmF0aW9uLm1vZHVsZX07XG4gICAgICB9XG4gICAgfTtcblxuICAgIGlmIChpc01ldGFkYXRhR2xvYmFsUmVmZXJlbmNlRXhwcmVzc2lvbih2YWx1ZSkpIHtcbiAgICAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy5nZXRNZXRhZGF0YShtb2R1bGVOYW1lKTtcbiAgICAgIGlmIChtZXRhZGF0YSAmJiBtZXRhZGF0YS5tZXRhZGF0YSAmJiBtZXRhZGF0YS5tZXRhZGF0YVt2YWx1ZS5uYW1lXSkge1xuICAgICAgICAvLyBSZWZlcmVuY2UgdG8gYSBzeW1ib2wgZGVmaW5lZCBpbiB0aGUgbW9kdWxlXG4gICAgICAgIHJldHVybiBjcmVhdGVSZWZlcmVuY2UodGhpcy5jYW5vbmljYWxTeW1ib2xPZihtb2R1bGVOYW1lLCB2YWx1ZS5uYW1lKSk7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIGEgcmVmZXJlbmNlIGhhcyBhcmd1bWVudHMsIHRoZSBhcmd1bWVudHMgbmVlZCB0byBiZSBjb252ZXJ0ZWQuXG4gICAgICBpZiAodmFsdWUuYXJndW1lbnRzKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgX19zeW1ib2xpYzogJ3JlZmVyZW5jZScsXG4gICAgICAgICAgbmFtZTogdmFsdWUubmFtZSxcbiAgICAgICAgICBhcmd1bWVudHM6IHZhbHVlLmFyZ3VtZW50cy5tYXAoYSA9PiB0aGlzLmNvbnZlcnRWYWx1ZShtb2R1bGVOYW1lLCBhKSlcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgLy8gR2xvYmFsIHJlZmVyZW5jZXMgd2l0aG91dCBhcmd1bWVudHMgKHN1Y2ggYXMgdG8gTWF0aCBvciBKU09OKSBhcmUgdW5tb2RpZmllZC5cbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICBpZiAoaXNNZXRhZGF0YUltcG9ydGVkU3ltYm9sUmVmZXJlbmNlRXhwcmVzc2lvbih2YWx1ZSkpIHtcbiAgICAgIC8vIFJlZmVyZW5jZXMgdG8gaW1wb3J0ZWQgc3ltYm9scyBhcmUgc2VwYXJhdGVkIGludG8gdHdvLCByZWZlcmVuY2VzIHRvIGJ1bmRsZWQgbW9kdWxlcyBhbmRcbiAgICAgIC8vIHJlZmVyZW5jZXMgdG8gbW9kdWxlcyBleHRlcm5hbCB0byB0aGUgYnVuZGxlLiBJZiB0aGUgbW9kdWxlIHJlZmVyZW5jZSBpcyByZWxhdGl2ZSBpdCBpc1xuICAgICAgLy8gYXNzdW1lZCB0byBiZSBpbiB0aGUgYnVuZGxlLiBJZiBpdCBpcyBHbG9iYWwgaXQgaXMgYXNzdW1lZCB0byBiZSBvdXRzaWRlIHRoZSBidW5kbGUuXG4gICAgICAvLyBSZWZlcmVuY2VzIHRvIHN5bWJvbHMgb3V0c2lkZSB0aGUgYnVuZGxlIGFyZSBsZWZ0IHVubW9kaWZpZWQuIFJlZmVyZW5jZXMgdG8gc3ltYm9sIGluc2lkZVxuICAgICAgLy8gdGhlIGJ1bmRsZSBuZWVkIHRvIGJlIGNvbnZlcnRlZCB0byBhIGJ1bmRsZSBpbXBvcnQgcmVmZXJlbmNlIHJlYWNoYWJsZSBmcm9tIHRoZSBidW5kbGVcbiAgICAgIC8vIGluZGV4LlxuXG4gICAgICBpZiAodmFsdWUubW9kdWxlLnN0YXJ0c1dpdGgoJy4nKSkge1xuICAgICAgICAvLyBSZWZlcmVuY2UgaXMgdG8gYSBzeW1ib2wgZGVmaW5lZCBpbnNpZGUgdGhlIG1vZHVsZS4gQ29udmVydCB0aGUgcmVmZXJlbmNlIHRvIGEgcmVmZXJlbmNlXG4gICAgICAgIC8vIHRvIHRoZSBjYW5vbmljYWwgc3ltYm9sLlxuICAgICAgICBjb25zdCByZWZlcmVuY2VkTW9kdWxlID0gcmVzb2x2ZU1vZHVsZSh2YWx1ZS5tb2R1bGUsIG1vZHVsZU5hbWUpO1xuICAgICAgICBjb25zdCByZWZlcmVuY2VkTmFtZSA9IHZhbHVlLm5hbWU7XG4gICAgICAgIHJldHVybiBjcmVhdGVSZWZlcmVuY2UodGhpcy5jYW5vbmljYWxTeW1ib2xPZihyZWZlcmVuY2VkTW9kdWxlLCByZWZlcmVuY2VkTmFtZSkpO1xuICAgICAgfVxuXG4gICAgICAvLyBWYWx1ZSBpcyBhIHJlZmVyZW5jZSB0byBhIHN5bWJvbCBkZWZpbmVkIG91dHNpZGUgdGhlIG1vZHVsZS5cbiAgICAgIGlmICh2YWx1ZS5hcmd1bWVudHMpIHtcbiAgICAgICAgLy8gSWYgYSByZWZlcmVuY2UgaGFzIGFyZ3VtZW50cyB0aGUgYXJndW1lbnRzIG5lZWQgdG8gYmUgY29udmVydGVkLlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIF9fc3ltYm9saWM6ICdyZWZlcmVuY2UnLFxuICAgICAgICAgIG5hbWU6IHZhbHVlLm5hbWUsXG4gICAgICAgICAgbW9kdWxlOiB2YWx1ZS5tb2R1bGUsXG4gICAgICAgICAgYXJndW1lbnRzOiB2YWx1ZS5hcmd1bWVudHMubWFwKGEgPT4gdGhpcy5jb252ZXJ0VmFsdWUobW9kdWxlTmFtZSwgYSkpXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuXG4gICAgaWYgKGlzTWV0YWRhdGFNb2R1bGVSZWZlcmVuY2VFeHByZXNzaW9uKHZhbHVlKSkge1xuICAgICAgLy8gQ2Fubm90IHN1cHBvcnQgcmVmZXJlbmNlcyB0byBidW5kbGVkIG1vZHVsZXMgYXMgdGhlIGludGVybmFsIG1vZHVsZXMgb2YgYSBidW5kbGUgYXJlIGVyYXNlZFxuICAgICAgLy8gYnkgdGhlIGJ1bmRsZXIuXG4gICAgICBpZiAodmFsdWUubW9kdWxlLnN0YXJ0c1dpdGgoJy4nKSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIF9fc3ltYm9saWM6ICdlcnJvcicsXG4gICAgICAgICAgbWVzc2FnZTogJ1Vuc3VwcG9ydGVkIGJ1bmRsZWQgbW9kdWxlIHJlZmVyZW5jZScsXG4gICAgICAgICAgY29udGV4dDoge21vZHVsZTogdmFsdWUubW9kdWxlfVxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICAvLyBSZWZlcmVuY2VzIHRvIHVuYnVuZGxlZCBtb2R1bGVzIGFyZSB1bm1vZGlmaWVkLlxuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgY29udmVydEV4cHJlc3Npb25Ob2RlKG1vZHVsZU5hbWU6IHN0cmluZywgdmFsdWU6IE1ldGFkYXRhU3ltYm9saWNFeHByZXNzaW9uKTpcbiAgICAgIE1ldGFkYXRhU3ltYm9saWNFeHByZXNzaW9uIHtcbiAgICBjb25zdCByZXN1bHQ6IE1ldGFkYXRhU3ltYm9saWNFeHByZXNzaW9uID0geyBfX3N5bWJvbGljOiB2YWx1ZS5fX3N5bWJvbGljIH0gYXMgYW55O1xuICAgIGZvciAoY29uc3Qga2V5IGluIHZhbHVlKSB7XG4gICAgICAocmVzdWx0IGFzIGFueSlba2V5XSA9IHRoaXMuY29udmVydFZhbHVlKG1vZHVsZU5hbWUsICh2YWx1ZSBhcyBhbnkpW2tleV0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgcHJpdmF0ZSBzeW1ib2xPZihtb2R1bGU6IHN0cmluZywgbmFtZTogc3RyaW5nKTogU3ltYm9sIHtcbiAgICBjb25zdCBzeW1ib2xLZXkgPSBgJHttb2R1bGV9OiR7bmFtZX1gO1xuICAgIGxldCBzeW1ib2wgPSB0aGlzLnN5bWJvbE1hcC5nZXQoc3ltYm9sS2V5KTtcbiAgICBpZiAoIXN5bWJvbCkge1xuICAgICAgc3ltYm9sID0ge21vZHVsZSwgbmFtZX07XG4gICAgICB0aGlzLnN5bWJvbE1hcC5zZXQoc3ltYm9sS2V5LCBzeW1ib2wpO1xuICAgIH1cbiAgICByZXR1cm4gc3ltYm9sO1xuICB9XG5cbiAgcHJpdmF0ZSBjYW5vbmljYWxTeW1ib2xPZihtb2R1bGU6IHN0cmluZywgbmFtZTogc3RyaW5nKTogU3ltYm9sIHtcbiAgICAvLyBFbnN1cmUgdGhlIG1vZHVsZSBoYXMgYmVlbiBzZWVuLlxuICAgIHRoaXMuZXhwb3J0QWxsKG1vZHVsZSk7XG4gICAgY29uc3Qgc3ltYm9sID0gdGhpcy5zeW1ib2xPZihtb2R1bGUsIG5hbWUpO1xuICAgIGlmICghc3ltYm9sLmNhbm9uaWNhbFN5bWJvbCkge1xuICAgICAgdGhpcy5jYW5vbmljYWxpemVTeW1ib2woc3ltYm9sKTtcbiAgICB9XG4gICAgcmV0dXJuIHN5bWJvbDtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgQ29tcGlsZXJIb3N0QWRhcHRlciBpbXBsZW1lbnRzIE1ldGFkYXRhQnVuZGxlckhvc3Qge1xuICBwcml2YXRlIGNvbGxlY3RvciA9IG5ldyBNZXRhZGF0YUNvbGxlY3RvcigpO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBob3N0OiB0cy5Db21waWxlckhvc3QsIHByaXZhdGUgY2FjaGU6IE1ldGFkYXRhQ2FjaGV8bnVsbCxcbiAgICAgIHByaXZhdGUgb3B0aW9uczogdHMuQ29tcGlsZXJPcHRpb25zKSB7fVxuXG4gIGdldE1ldGFkYXRhRm9yKGZpbGVOYW1lOiBzdHJpbmcsIGNvbnRhaW5pbmdGaWxlOiBzdHJpbmcpOiBNb2R1bGVNZXRhZGF0YXx1bmRlZmluZWQge1xuICAgIGNvbnN0IHtyZXNvbHZlZE1vZHVsZX0gPVxuICAgICAgICB0cy5yZXNvbHZlTW9kdWxlTmFtZShmaWxlTmFtZSwgY29udGFpbmluZ0ZpbGUsIHRoaXMub3B0aW9ucywgdGhpcy5ob3N0KTtcblxuICAgIGxldCBzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlfHVuZGVmaW5lZDtcbiAgICBpZiAocmVzb2x2ZWRNb2R1bGUpIHtcbiAgICAgIGxldCB7cmVzb2x2ZWRGaWxlTmFtZX0gPSByZXNvbHZlZE1vZHVsZTtcbiAgICAgIGlmIChyZXNvbHZlZE1vZHVsZS5leHRlbnNpb24gIT09ICcudHMnKSB7XG4gICAgICAgIHJlc29sdmVkRmlsZU5hbWUgPSByZXNvbHZlZEZpbGVOYW1lLnJlcGxhY2UoLyhcXC5kXFwudHN8XFwuanMpJC8sICcudHMnKTtcbiAgICAgIH1cbiAgICAgIHNvdXJjZUZpbGUgPSB0aGlzLmhvc3QuZ2V0U291cmNlRmlsZShyZXNvbHZlZEZpbGVOYW1lLCB0cy5TY3JpcHRUYXJnZXQuTGF0ZXN0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSWYgdHlwZXNjcmlwdCBpcyB1bmFibGUgdG8gcmVzb2x2ZSB0aGUgZmlsZSwgZmFsbGJhY2sgb24gb2xkIGJlaGF2aW9yXG4gICAgICBpZiAoIXRoaXMuaG9zdC5maWxlRXhpc3RzKGZpbGVOYW1lICsgJy50cycpKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgc291cmNlRmlsZSA9IHRoaXMuaG9zdC5nZXRTb3VyY2VGaWxlKGZpbGVOYW1lICsgJy50cycsIHRzLlNjcmlwdFRhcmdldC5MYXRlc3QpO1xuICAgIH1cblxuICAgIC8vIElmIHRoZXJlIGlzIGEgbWV0YWRhdGEgY2FjaGUsIHVzZSBpdCB0byBnZXQgdGhlIG1ldGFkYXRhIGZvciB0aGlzIHNvdXJjZSBmaWxlLiBPdGhlcndpc2UsXG4gICAgLy8gZmFsbCBiYWNrIG9uIHRoZSBsb2NhbGx5IGNyZWF0ZWQgTWV0YWRhdGFDb2xsZWN0b3IuXG4gICAgaWYgKCFzb3VyY2VGaWxlKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH0gZWxzZSBpZiAodGhpcy5jYWNoZSkge1xuICAgICAgcmV0dXJuIHRoaXMuY2FjaGUuZ2V0TWV0YWRhdGEoc291cmNlRmlsZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLmNvbGxlY3Rvci5nZXRNZXRhZGF0YShzb3VyY2VGaWxlKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVzb2x2ZU1vZHVsZShpbXBvcnROYW1lOiBzdHJpbmcsIGZyb206IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmIChpbXBvcnROYW1lLnN0YXJ0c1dpdGgoJy4nKSAmJiBmcm9tKSB7XG4gICAgbGV0IG5vcm1hbFBhdGggPSBwYXRoLm5vcm1hbGl6ZShwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKGZyb20pLCBpbXBvcnROYW1lKSk7XG4gICAgaWYgKCFub3JtYWxQYXRoLnN0YXJ0c1dpdGgoJy4nKSAmJiBmcm9tLnN0YXJ0c1dpdGgoJy4nKSkge1xuICAgICAgLy8gcGF0aC5ub3JtYWxpemUoKSBwcmVzZXJ2ZXMgbGVhZGluZyAnLi4vJyBidXQgbm90ICcuLycuIFRoaXMgYWRkcyBpdCBiYWNrLlxuICAgICAgbm9ybWFsUGF0aCA9IGAuJHtwYXRoLnNlcH0ke25vcm1hbFBhdGh9YDtcbiAgICB9XG4gICAgLy8gUmVwbGFjZSB3aW5kb3dzIHBhdGggZGVsaW1pdGVycyB3aXRoIGZvcndhcmQtc2xhc2hlcy4gT3RoZXJ3aXNlIHRoZSBwYXRocyBhcmUgbm90XG4gICAgLy8gVHlwZVNjcmlwdCBjb21wYXRpYmxlIHdoZW4gYnVpbGRpbmcgdGhlIGJ1bmRsZS5cbiAgICByZXR1cm4gbm9ybWFsUGF0aC5yZXBsYWNlKC9cXFxcL2csICcvJyk7XG4gIH1cbiAgcmV0dXJuIGltcG9ydE5hbWU7XG59XG5cbmZ1bmN0aW9uIGlzUHJpbWl0aXZlKG86IGFueSk6IG8gaXMgYm9vbGVhbnxzdHJpbmd8bnVtYmVyIHtcbiAgcmV0dXJuIG8gPT09IG51bGwgfHwgKHR5cGVvZiBvICE9PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBvICE9PSAnb2JqZWN0Jyk7XG59XG5cbmZ1bmN0aW9uIGdldFJvb3RFeHBvcnQoc3ltYm9sOiBTeW1ib2wpOiBTeW1ib2wge1xuICByZXR1cm4gc3ltYm9sLnJlZXhwb3J0ZWRBcyA/IGdldFJvb3RFeHBvcnQoc3ltYm9sLnJlZXhwb3J0ZWRBcykgOiBzeW1ib2w7XG59XG5cbmZ1bmN0aW9uIGdldFN5bWJvbERlY2xhcmF0aW9uKHN5bWJvbDogU3ltYm9sKTogU3ltYm9sIHtcbiAgcmV0dXJuIHN5bWJvbC5leHBvcnRzID8gZ2V0U3ltYm9sRGVjbGFyYXRpb24oc3ltYm9sLmV4cG9ydHMpIDogc3ltYm9sO1xufVxuIl19
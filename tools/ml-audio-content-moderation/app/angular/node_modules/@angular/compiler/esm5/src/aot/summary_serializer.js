import * as tslib_1 from "tslib";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { CompileNgModuleMetadata, CompileSummaryKind } from '../compile_metadata';
import * as o from '../output/output_ast';
import { ValueTransformer, visitValue } from '../util';
import { StaticSymbol } from './static_symbol';
import { unwrapResolvedMetadata } from './static_symbol_resolver';
import { isLoweredSymbol, ngfactoryFilePath, summaryForJitFileName, summaryForJitName } from './util';
export function serializeSummaries(srcFileName, forJitCtx, summaryResolver, symbolResolver, symbols, types) {
    var toJsonSerializer = new ToJsonSerializer(symbolResolver, summaryResolver, srcFileName);
    // for symbols, we use everything except for the class metadata itself
    // (we keep the statics though), as the class metadata is contained in the
    // CompileTypeSummary.
    symbols.forEach(function (resolvedSymbol) { return toJsonSerializer.addSummary({ symbol: resolvedSymbol.symbol, metadata: resolvedSymbol.metadata }); });
    // Add type summaries.
    types.forEach(function (_a) {
        var summary = _a.summary, metadata = _a.metadata;
        toJsonSerializer.addSummary({ symbol: summary.type.reference, metadata: undefined, type: summary });
    });
    var _a = toJsonSerializer.serialize(), json = _a.json, exportAs = _a.exportAs;
    if (forJitCtx) {
        var forJitSerializer_1 = new ForJitSerializer(forJitCtx, symbolResolver, summaryResolver);
        types.forEach(function (_a) {
            var summary = _a.summary, metadata = _a.metadata;
            forJitSerializer_1.addSourceType(summary, metadata);
        });
        toJsonSerializer.unprocessedSymbolSummariesBySymbol.forEach(function (summary) {
            if (summaryResolver.isLibraryFile(summary.symbol.filePath) && summary.type) {
                forJitSerializer_1.addLibType(summary.type);
            }
        });
        forJitSerializer_1.serialize(exportAs);
    }
    return { json: json, exportAs: exportAs };
}
export function deserializeSummaries(symbolCache, summaryResolver, libraryFileName, json) {
    var deserializer = new FromJsonDeserializer(symbolCache, summaryResolver);
    return deserializer.deserialize(libraryFileName, json);
}
export function createForJitStub(outputCtx, reference) {
    return createSummaryForJitFunction(outputCtx, reference, o.NULL_EXPR);
}
function createSummaryForJitFunction(outputCtx, reference, value) {
    var fnName = summaryForJitName(reference.name);
    outputCtx.statements.push(o.fn([], [new o.ReturnStatement(value)], new o.ArrayType(o.DYNAMIC_TYPE)).toDeclStmt(fnName, [
        o.StmtModifier.Final, o.StmtModifier.Exported
    ]));
}
var ToJsonSerializer = /** @class */ (function (_super) {
    tslib_1.__extends(ToJsonSerializer, _super);
    function ToJsonSerializer(symbolResolver, summaryResolver, srcFileName) {
        var _this = _super.call(this) || this;
        _this.symbolResolver = symbolResolver;
        _this.summaryResolver = summaryResolver;
        _this.srcFileName = srcFileName;
        // Note: This only contains symbols without members.
        _this.symbols = [];
        _this.indexBySymbol = new Map();
        _this.reexportedBy = new Map();
        // This now contains a `__symbol: number` in the place of
        // StaticSymbols, but otherwise has the same shape as the original objects.
        _this.processedSummaryBySymbol = new Map();
        _this.processedSummaries = [];
        _this.unprocessedSymbolSummariesBySymbol = new Map();
        _this.moduleName = symbolResolver.getKnownModuleName(srcFileName);
        return _this;
    }
    ToJsonSerializer.prototype.addSummary = function (summary) {
        var _this = this;
        var unprocessedSummary = this.unprocessedSymbolSummariesBySymbol.get(summary.symbol);
        var processedSummary = this.processedSummaryBySymbol.get(summary.symbol);
        if (!unprocessedSummary) {
            unprocessedSummary = { symbol: summary.symbol, metadata: undefined };
            this.unprocessedSymbolSummariesBySymbol.set(summary.symbol, unprocessedSummary);
            processedSummary = { symbol: this.processValue(summary.symbol, 0 /* None */) };
            this.processedSummaries.push(processedSummary);
            this.processedSummaryBySymbol.set(summary.symbol, processedSummary);
        }
        if (!unprocessedSummary.metadata && summary.metadata) {
            var metadata_1 = summary.metadata || {};
            if (metadata_1.__symbolic === 'class') {
                // For classes, we keep everything except their class decorators.
                // We need to keep e.g. the ctor args, method names, method decorators
                // so that the class can be extended in another compilation unit.
                // We don't keep the class decorators as
                // 1) they refer to data
                //   that should not cause a rebuild of downstream compilation units
                //   (e.g. inline templates of @Component, or @NgModule.declarations)
                // 2) their data is already captured in TypeSummaries, e.g. DirectiveSummary.
                var clone_1 = {};
                Object.keys(metadata_1).forEach(function (propName) {
                    if (propName !== 'decorators') {
                        clone_1[propName] = metadata_1[propName];
                    }
                });
                metadata_1 = clone_1;
            }
            else if (isCall(metadata_1)) {
                if (!isFunctionCall(metadata_1) && !isMethodCallOnVariable(metadata_1)) {
                    // Don't store complex calls as we won't be able to simplify them anyways later on.
                    metadata_1 = {
                        __symbolic: 'error',
                        message: 'Complex function calls are not supported.',
                    };
                }
            }
            // Note: We need to keep storing ctor calls for e.g.
            // `export const x = new InjectionToken(...)`
            unprocessedSummary.metadata = metadata_1;
            processedSummary.metadata = this.processValue(metadata_1, 1 /* ResolveValue */);
            if (metadata_1 instanceof StaticSymbol &&
                this.summaryResolver.isLibraryFile(metadata_1.filePath)) {
                var declarationSymbol = this.symbols[this.indexBySymbol.get(metadata_1)];
                if (!isLoweredSymbol(declarationSymbol.name)) {
                    // Note: symbols that were introduced during codegen in the user file can have a reexport
                    // if a user used `export *`. However, we can't rely on this as tsickle will change
                    // `export *` into named exports, using only the information from the typechecker.
                    // As we introduce the new symbols after typecheck, Tsickle does not know about them,
                    // and omits them when expanding `export *`.
                    // So we have to keep reexporting these symbols manually via .ngfactory files.
                    this.reexportedBy.set(declarationSymbol, summary.symbol);
                }
            }
        }
        if (!unprocessedSummary.type && summary.type) {
            unprocessedSummary.type = summary.type;
            // Note: We don't add the summaries of all referenced symbols as for the ResolvedSymbols,
            // as the type summaries already contain the transitive data that they require
            // (in a minimal way).
            processedSummary.type = this.processValue(summary.type, 0 /* None */);
            // except for reexported directives / pipes, so we need to store
            // their summaries explicitly.
            if (summary.type.summaryKind === CompileSummaryKind.NgModule) {
                var ngModuleSummary = summary.type;
                ngModuleSummary.exportedDirectives.concat(ngModuleSummary.exportedPipes).forEach(function (id) {
                    var symbol = id.reference;
                    if (_this.summaryResolver.isLibraryFile(symbol.filePath) &&
                        !_this.unprocessedSymbolSummariesBySymbol.has(symbol)) {
                        var summary_1 = _this.summaryResolver.resolveSummary(symbol);
                        if (summary_1) {
                            _this.addSummary(summary_1);
                        }
                    }
                });
            }
        }
    };
    ToJsonSerializer.prototype.serialize = function () {
        var _this = this;
        var exportAs = [];
        var json = JSON.stringify({
            moduleName: this.moduleName,
            summaries: this.processedSummaries,
            symbols: this.symbols.map(function (symbol, index) {
                symbol.assertNoMembers();
                var importAs = undefined;
                if (_this.summaryResolver.isLibraryFile(symbol.filePath)) {
                    var reexportSymbol = _this.reexportedBy.get(symbol);
                    if (reexportSymbol) {
                        importAs = _this.indexBySymbol.get(reexportSymbol);
                    }
                    else {
                        var summary = _this.unprocessedSymbolSummariesBySymbol.get(symbol);
                        if (!summary || !summary.metadata || summary.metadata.__symbolic !== 'interface') {
                            importAs = symbol.name + "_" + index;
                            exportAs.push({ symbol: symbol, exportAs: importAs });
                        }
                    }
                }
                return {
                    __symbol: index,
                    name: symbol.name,
                    filePath: _this.summaryResolver.toSummaryFileName(symbol.filePath, _this.srcFileName),
                    importAs: importAs
                };
            })
        });
        return { json: json, exportAs: exportAs };
    };
    ToJsonSerializer.prototype.processValue = function (value, flags) {
        return visitValue(value, this, flags);
    };
    ToJsonSerializer.prototype.visitOther = function (value, context) {
        if (value instanceof StaticSymbol) {
            var baseSymbol = this.symbolResolver.getStaticSymbol(value.filePath, value.name);
            var index = this.visitStaticSymbol(baseSymbol, context);
            return { __symbol: index, members: value.members };
        }
    };
    /**
     * Strip line and character numbers from ngsummaries.
     * Emitting them causes white spaces changes to retrigger upstream
     * recompilations in bazel.
     * TODO: find out a way to have line and character numbers in errors without
     * excessive recompilation in bazel.
     */
    ToJsonSerializer.prototype.visitStringMap = function (map, context) {
        if (map['__symbolic'] === 'resolved') {
            return visitValue(map.symbol, this, context);
        }
        if (map['__symbolic'] === 'error') {
            delete map['line'];
            delete map['character'];
        }
        return _super.prototype.visitStringMap.call(this, map, context);
    };
    /**
     * Returns null if the options.resolveValue is true, and the summary for the symbol
     * resolved to a type or could not be resolved.
     */
    ToJsonSerializer.prototype.visitStaticSymbol = function (baseSymbol, flags) {
        var index = this.indexBySymbol.get(baseSymbol);
        var summary = null;
        if (flags & 1 /* ResolveValue */ &&
            this.summaryResolver.isLibraryFile(baseSymbol.filePath)) {
            if (this.unprocessedSymbolSummariesBySymbol.has(baseSymbol)) {
                // the summary for this symbol was already added
                // -> nothing to do.
                return index;
            }
            summary = this.loadSummary(baseSymbol);
            if (summary && summary.metadata instanceof StaticSymbol) {
                // The summary is a reexport
                index = this.visitStaticSymbol(summary.metadata, flags);
                // reset the summary as it is just a reexport, so we don't want to store it.
                summary = null;
            }
        }
        else if (index != null) {
            // Note: == on purpose to compare with undefined!
            // No summary and the symbol is already added -> nothing to do.
            return index;
        }
        // Note: == on purpose to compare with undefined!
        if (index == null) {
            index = this.symbols.length;
            this.symbols.push(baseSymbol);
        }
        this.indexBySymbol.set(baseSymbol, index);
        if (summary) {
            this.addSummary(summary);
        }
        return index;
    };
    ToJsonSerializer.prototype.loadSummary = function (symbol) {
        var summary = this.summaryResolver.resolveSummary(symbol);
        if (!summary) {
            // some symbols might originate from a plain typescript library
            // that just exported .d.ts and .metadata.json files, i.e. where no summary
            // files were created.
            var resolvedSymbol = this.symbolResolver.resolveSymbol(symbol);
            if (resolvedSymbol) {
                summary = { symbol: resolvedSymbol.symbol, metadata: resolvedSymbol.metadata };
            }
        }
        return summary;
    };
    return ToJsonSerializer;
}(ValueTransformer));
var ForJitSerializer = /** @class */ (function () {
    function ForJitSerializer(outputCtx, symbolResolver, summaryResolver) {
        this.outputCtx = outputCtx;
        this.symbolResolver = symbolResolver;
        this.summaryResolver = summaryResolver;
        this.data = [];
    }
    ForJitSerializer.prototype.addSourceType = function (summary, metadata) {
        this.data.push({ summary: summary, metadata: metadata, isLibrary: false });
    };
    ForJitSerializer.prototype.addLibType = function (summary) {
        this.data.push({ summary: summary, metadata: null, isLibrary: true });
    };
    ForJitSerializer.prototype.serialize = function (exportAsArr) {
        var _this = this;
        var e_1, _a, e_2, _b, e_3, _c;
        var exportAsBySymbol = new Map();
        try {
            for (var exportAsArr_1 = tslib_1.__values(exportAsArr), exportAsArr_1_1 = exportAsArr_1.next(); !exportAsArr_1_1.done; exportAsArr_1_1 = exportAsArr_1.next()) {
                var _d = exportAsArr_1_1.value, symbol = _d.symbol, exportAs = _d.exportAs;
                exportAsBySymbol.set(symbol, exportAs);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (exportAsArr_1_1 && !exportAsArr_1_1.done && (_a = exportAsArr_1.return)) _a.call(exportAsArr_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        var ngModuleSymbols = new Set();
        try {
            for (var _e = tslib_1.__values(this.data), _f = _e.next(); !_f.done; _f = _e.next()) {
                var _g = _f.value, summary = _g.summary, metadata = _g.metadata, isLibrary = _g.isLibrary;
                if (summary.summaryKind === CompileSummaryKind.NgModule) {
                    // collect the symbols that refer to NgModule classes.
                    // Note: we can't just rely on `summary.type.summaryKind` to determine this as
                    // we don't add the summaries of all referenced symbols when we serialize type summaries.
                    // See serializeSummaries for details.
                    ngModuleSymbols.add(summary.type.reference);
                    var modSummary = summary;
                    try {
                        for (var _h = tslib_1.__values(modSummary.modules), _j = _h.next(); !_j.done; _j = _h.next()) {
                            var mod = _j.value;
                            ngModuleSymbols.add(mod.reference);
                        }
                    }
                    catch (e_3_1) { e_3 = { error: e_3_1 }; }
                    finally {
                        try {
                            if (_j && !_j.done && (_c = _h.return)) _c.call(_h);
                        }
                        finally { if (e_3) throw e_3.error; }
                    }
                }
                if (!isLibrary) {
                    var fnName = summaryForJitName(summary.type.reference.name);
                    createSummaryForJitFunction(this.outputCtx, summary.type.reference, this.serializeSummaryWithDeps(summary, metadata));
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
            }
            finally { if (e_2) throw e_2.error; }
        }
        ngModuleSymbols.forEach(function (ngModuleSymbol) {
            if (_this.summaryResolver.isLibraryFile(ngModuleSymbol.filePath)) {
                var exportAs = exportAsBySymbol.get(ngModuleSymbol) || ngModuleSymbol.name;
                var jitExportAsName = summaryForJitName(exportAs);
                _this.outputCtx.statements.push(o.variable(jitExportAsName)
                    .set(_this.serializeSummaryRef(ngModuleSymbol))
                    .toDeclStmt(null, [o.StmtModifier.Exported]));
            }
        });
    };
    ForJitSerializer.prototype.serializeSummaryWithDeps = function (summary, metadata) {
        var _this = this;
        var expressions = [this.serializeSummary(summary)];
        var providers = [];
        if (metadata instanceof CompileNgModuleMetadata) {
            expressions.push.apply(expressions, tslib_1.__spread(
            // For directives / pipes, we only add the declared ones,
            // and rely on transitively importing NgModules to get the transitive
            // summaries.
            metadata.declaredDirectives.concat(metadata.declaredPipes)
                .map(function (type) { return type.reference; })
                // For modules,
                // we also add the summaries for modules
                // from libraries.
                // This is ok as we produce reexports for all transitive modules.
                .concat(metadata.transitiveModule.modules.map(function (type) { return type.reference; })
                .filter(function (ref) { return ref !== metadata.type.reference; }))
                .map(function (ref) { return _this.serializeSummaryRef(ref); })));
            // Note: We don't use `NgModuleSummary.providers`, as that one is transitive,
            // and we already have transitive modules.
            providers = metadata.providers;
        }
        else if (summary.summaryKind === CompileSummaryKind.Directive) {
            var dirSummary = summary;
            providers = dirSummary.providers.concat(dirSummary.viewProviders);
        }
        // Note: We can't just refer to the `ngsummary.ts` files for `useClass` providers (as we do for
        // declaredDirectives / declaredPipes), as we allow
        // providers without ctor arguments to skip the `@Injectable` decorator,
        // i.e. we didn't generate .ngsummary.ts files for these.
        expressions.push.apply(expressions, tslib_1.__spread(providers.filter(function (provider) { return !!provider.useClass; }).map(function (provider) { return _this.serializeSummary({
            summaryKind: CompileSummaryKind.Injectable, type: provider.useClass
        }); })));
        return o.literalArr(expressions);
    };
    ForJitSerializer.prototype.serializeSummaryRef = function (typeSymbol) {
        var jitImportedSymbol = this.symbolResolver.getStaticSymbol(summaryForJitFileName(typeSymbol.filePath), summaryForJitName(typeSymbol.name));
        return this.outputCtx.importExpr(jitImportedSymbol);
    };
    ForJitSerializer.prototype.serializeSummary = function (data) {
        var outputCtx = this.outputCtx;
        var Transformer = /** @class */ (function () {
            function Transformer() {
            }
            Transformer.prototype.visitArray = function (arr, context) {
                var _this = this;
                return o.literalArr(arr.map(function (entry) { return visitValue(entry, _this, context); }));
            };
            Transformer.prototype.visitStringMap = function (map, context) {
                var _this = this;
                return new o.LiteralMapExpr(Object.keys(map).map(function (key) { return new o.LiteralMapEntry(key, visitValue(map[key], _this, context), false); }));
            };
            Transformer.prototype.visitPrimitive = function (value, context) { return o.literal(value); };
            Transformer.prototype.visitOther = function (value, context) {
                if (value instanceof StaticSymbol) {
                    return outputCtx.importExpr(value);
                }
                else {
                    throw new Error("Illegal State: Encountered value " + value);
                }
            };
            return Transformer;
        }());
        return visitValue(data, new Transformer(), null);
    };
    return ForJitSerializer;
}());
var FromJsonDeserializer = /** @class */ (function (_super) {
    tslib_1.__extends(FromJsonDeserializer, _super);
    function FromJsonDeserializer(symbolCache, summaryResolver) {
        var _this = _super.call(this) || this;
        _this.symbolCache = symbolCache;
        _this.summaryResolver = summaryResolver;
        return _this;
    }
    FromJsonDeserializer.prototype.deserialize = function (libraryFileName, json) {
        var _this = this;
        var data = JSON.parse(json);
        var allImportAs = [];
        this.symbols = data.symbols.map(function (serializedSymbol) { return _this.symbolCache.get(_this.summaryResolver.fromSummaryFileName(serializedSymbol.filePath, libraryFileName), serializedSymbol.name); });
        data.symbols.forEach(function (serializedSymbol, index) {
            var symbol = _this.symbols[index];
            var importAs = serializedSymbol.importAs;
            if (typeof importAs === 'number') {
                allImportAs.push({ symbol: symbol, importAs: _this.symbols[importAs] });
            }
            else if (typeof importAs === 'string') {
                allImportAs.push({ symbol: symbol, importAs: _this.symbolCache.get(ngfactoryFilePath(libraryFileName), importAs) });
            }
        });
        var summaries = visitValue(data.summaries, this, null);
        return { moduleName: data.moduleName, summaries: summaries, importAs: allImportAs };
    };
    FromJsonDeserializer.prototype.visitStringMap = function (map, context) {
        if ('__symbol' in map) {
            var baseSymbol = this.symbols[map['__symbol']];
            var members = map['members'];
            return members.length ? this.symbolCache.get(baseSymbol.filePath, baseSymbol.name, members) :
                baseSymbol;
        }
        else {
            return _super.prototype.visitStringMap.call(this, map, context);
        }
    };
    return FromJsonDeserializer;
}(ValueTransformer));
function isCall(metadata) {
    return metadata && metadata.__symbolic === 'call';
}
function isFunctionCall(metadata) {
    return isCall(metadata) && unwrapResolvedMetadata(metadata.expression) instanceof StaticSymbol;
}
function isMethodCallOnVariable(metadata) {
    return isCall(metadata) && metadata.expression && metadata.expression.__symbolic === 'select' &&
        unwrapResolvedMetadata(metadata.expression.expression) instanceof StaticSymbol;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VtbWFyeV9zZXJpYWxpemVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXIvc3JjL2FvdC9zdW1tYXJ5X3NlcmlhbGl6ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRztBQUNILE9BQU8sRUFBb0QsdUJBQXVCLEVBQXdFLGtCQUFrQixFQUEwQyxNQUFNLHFCQUFxQixDQUFDO0FBQ2xQLE9BQU8sS0FBSyxDQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFFMUMsT0FBTyxFQUFnQixnQkFBZ0IsRUFBZ0IsVUFBVSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBRWxGLE9BQU8sRUFBQyxZQUFZLEVBQW9CLE1BQU0saUJBQWlCLENBQUM7QUFDaEUsT0FBTyxFQUE2QyxzQkFBc0IsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQzVHLE9BQU8sRUFBQyxlQUFlLEVBQUUsaUJBQWlCLEVBQUUscUJBQXFCLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFFcEcsTUFBTSxVQUFVLGtCQUFrQixDQUM5QixXQUFtQixFQUFFLFNBQStCLEVBQ3BELGVBQThDLEVBQUUsY0FBb0MsRUFDcEYsT0FBK0IsRUFBRSxLQUk5QjtJQUNMLElBQU0sZ0JBQWdCLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBQyxjQUFjLEVBQUUsZUFBZSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBRTVGLHNFQUFzRTtJQUN0RSwwRUFBMEU7SUFDMUUsc0JBQXNCO0lBQ3RCLE9BQU8sQ0FBQyxPQUFPLENBQ1gsVUFBQyxjQUFjLElBQUssT0FBQSxnQkFBZ0IsQ0FBQyxVQUFVLENBQzNDLEVBQUMsTUFBTSxFQUFFLGNBQWMsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLGNBQWMsQ0FBQyxRQUFRLEVBQUMsQ0FBQyxFQURuRCxDQUNtRCxDQUFDLENBQUM7SUFFN0Usc0JBQXNCO0lBQ3RCLEtBQUss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QyxRQUFRLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxZQUFZLFlBQVksQ0FBQztBQUNyRixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtDb21waWxlRGlyZWN0aXZlTWV0YWRhdGEsIENvbXBpbGVEaXJlY3RpdmVTdW1tYXJ5LCBDb21waWxlTmdNb2R1bGVNZXRhZGF0YSwgQ29tcGlsZU5nTW9kdWxlU3VtbWFyeSwgQ29tcGlsZVBpcGVNZXRhZGF0YSwgQ29tcGlsZVByb3ZpZGVyTWV0YWRhdGEsIENvbXBpbGVTdW1tYXJ5S2luZCwgQ29tcGlsZVR5cGVNZXRhZGF0YSwgQ29tcGlsZVR5cGVTdW1tYXJ5fSBmcm9tICcuLi9jb21waWxlX21ldGFkYXRhJztcbmltcG9ydCAqIGFzIG8gZnJvbSAnLi4vb3V0cHV0L291dHB1dF9hc3QnO1xuaW1wb3J0IHtTdW1tYXJ5LCBTdW1tYXJ5UmVzb2x2ZXJ9IGZyb20gJy4uL3N1bW1hcnlfcmVzb2x2ZXInO1xuaW1wb3J0IHtPdXRwdXRDb250ZXh0LCBWYWx1ZVRyYW5zZm9ybWVyLCBWYWx1ZVZpc2l0b3IsIHZpc2l0VmFsdWV9IGZyb20gJy4uL3V0aWwnO1xuXG5pbXBvcnQge1N0YXRpY1N5bWJvbCwgU3RhdGljU3ltYm9sQ2FjaGV9IGZyb20gJy4vc3RhdGljX3N5bWJvbCc7XG5pbXBvcnQge1Jlc29sdmVkU3RhdGljU3ltYm9sLCBTdGF0aWNTeW1ib2xSZXNvbHZlciwgdW53cmFwUmVzb2x2ZWRNZXRhZGF0YX0gZnJvbSAnLi9zdGF0aWNfc3ltYm9sX3Jlc29sdmVyJztcbmltcG9ydCB7aXNMb3dlcmVkU3ltYm9sLCBuZ2ZhY3RvcnlGaWxlUGF0aCwgc3VtbWFyeUZvckppdEZpbGVOYW1lLCBzdW1tYXJ5Rm9ySml0TmFtZX0gZnJvbSAnLi91dGlsJztcblxuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZVN1bW1hcmllcyhcbiAgICBzcmNGaWxlTmFtZTogc3RyaW5nLCBmb3JKaXRDdHg6IE91dHB1dENvbnRleHQgfCBudWxsLFxuICAgIHN1bW1hcnlSZXNvbHZlcjogU3VtbWFyeVJlc29sdmVyPFN0YXRpY1N5bWJvbD4sIHN5bWJvbFJlc29sdmVyOiBTdGF0aWNTeW1ib2xSZXNvbHZlcixcbiAgICBzeW1ib2xzOiBSZXNvbHZlZFN0YXRpY1N5bWJvbFtdLCB0eXBlczoge1xuICAgICAgc3VtbWFyeTogQ29tcGlsZVR5cGVTdW1tYXJ5LFxuICAgICAgbWV0YWRhdGE6IENvbXBpbGVOZ01vZHVsZU1ldGFkYXRhIHwgQ29tcGlsZURpcmVjdGl2ZU1ldGFkYXRhIHwgQ29tcGlsZVBpcGVNZXRhZGF0YSB8XG4gICAgICAgICAgQ29tcGlsZVR5cGVNZXRhZGF0YVxuICAgIH1bXSk6IHtqc29uOiBzdHJpbmcsIGV4cG9ydEFzOiB7c3ltYm9sOiBTdGF0aWNTeW1ib2wsIGV4cG9ydEFzOiBzdHJpbmd9W119IHtcbiAgY29uc3QgdG9Kc29uU2VyaWFsaXplciA9IG5ldyBUb0pzb25TZXJpYWxpemVyKHN5bWJvbFJlc29sdmVyLCBzdW1tYXJ5UmVzb2x2ZXIsIHNyY0ZpbGVOYW1lKTtcblxuICAvLyBmb3Igc3ltYm9scywgd2UgdXNlIGV2ZXJ5dGhpbmcgZXhjZXB0IGZvciB0aGUgY2xhc3MgbWV0YWRhdGEgaXRzZWxmXG4gIC8vICh3ZSBrZWVwIHRoZSBzdGF0aWNzIHRob3VnaCksIGFzIHRoZSBjbGFzcyBtZXRhZGF0YSBpcyBjb250YWluZWQgaW4gdGhlXG4gIC8vIENvbXBpbGVUeXBlU3VtbWFyeS5cbiAgc3ltYm9scy5mb3JFYWNoKFxuICAgICAgKHJlc29sdmVkU3ltYm9sKSA9PiB0b0pzb25TZXJpYWxpemVyLmFkZFN1bW1hcnkoXG4gICAgICAgICAge3N5bWJvbDogcmVzb2x2ZWRTeW1ib2wuc3ltYm9sLCBtZXRhZGF0YTogcmVzb2x2ZWRTeW1ib2wubWV0YWRhdGF9KSk7XG5cbiAgLy8gQWRkIHR5cGUgc3VtbWFyaWVzLlxuICB0eXBlcy5mb3JFYWNoKCh7c3VtbWFyeSwgbWV0YWRhdGF9KSA9PiB7XG4gICAgdG9Kc29uU2VyaWFsaXplci5hZGRTdW1tYXJ5KFxuICAgICAgICB7c3ltYm9sOiBzdW1tYXJ5LnR5cGUucmVmZXJlbmNlLCBtZXRhZGF0YTogdW5kZWZpbmVkLCB0eXBlOiBzdW1tYXJ5fSk7XG4gIH0pO1xuICBjb25zdCB7anNvbiwgZXhwb3J0QXN9ID0gdG9Kc29uU2VyaWFsaXplci5zZXJpYWxpemUoKTtcbiAgaWYgKGZvckppdEN0eCkge1xuICAgIGNvbnN0IGZvckppdFNlcmlhbGl6ZXIgPSBuZXcgRm9ySml0U2VyaWFsaXplcihmb3JKaXRDdHgsIHN5bWJvbFJlc29sdmVyLCBzdW1tYXJ5UmVzb2x2ZXIpO1xuICAgIHR5cGVzLmZvckVhY2goKHtzdW1tYXJ5LCBtZXRhZGF0YX0pID0+IHsgZm9ySml0U2VyaWFsaXplci5hZGRTb3VyY2VUeXBlKHN1bW1hcnksIG1ldGFkYXRhKTsgfSk7XG4gICAgdG9Kc29uU2VyaWFsaXplci51bnByb2Nlc3NlZFN5bWJvbFN1bW1hcmllc0J5U3ltYm9sLmZvckVhY2goKHN1bW1hcnkpID0+IHtcbiAgICAgIGlmIChzdW1tYXJ5UmVzb2x2ZXIuaXNMaWJyYXJ5RmlsZShzdW1tYXJ5LnN5bWJvbC5maWxlUGF0aCkgJiYgc3VtbWFyeS50eXBlKSB7XG4gICAgICAgIGZvckppdFNlcmlhbGl6ZXIuYWRkTGliVHlwZShzdW1tYXJ5LnR5cGUpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGZvckppdFNlcmlhbGl6ZXIuc2VyaWFsaXplKGV4cG9ydEFzKTtcbiAgfVxuICByZXR1cm4ge2pzb24sIGV4cG9ydEFzfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlc2VyaWFsaXplU3VtbWFyaWVzKFxuICAgIHN5bWJvbENhY2hlOiBTdGF0aWNTeW1ib2xDYWNoZSwgc3VtbWFyeVJlc29sdmVyOiBTdW1tYXJ5UmVzb2x2ZXI8U3RhdGljU3ltYm9sPixcbiAgICBsaWJyYXJ5RmlsZU5hbWU6IHN0cmluZywganNvbjogc3RyaW5nKToge1xuICBtb2R1bGVOYW1lOiBzdHJpbmcgfCBudWxsLFxuICBzdW1tYXJpZXM6IFN1bW1hcnk8U3RhdGljU3ltYm9sPltdLFxuICBpbXBvcnRBczoge3N5bWJvbDogU3RhdGljU3ltYm9sLCBpbXBvcnRBczogU3RhdGljU3ltYm9sfVtdXG59IHtcbiAgY29uc3QgZGVzZXJpYWxpemVyID0gbmV3IEZyb21Kc29uRGVzZXJpYWxpemVyKHN5bWJvbENhY2hlLCBzdW1tYXJ5UmVzb2x2ZXIpO1xuICByZXR1cm4gZGVzZXJpYWxpemVyLmRlc2VyaWFsaXplKGxpYnJhcnlGaWxlTmFtZSwganNvbik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVGb3JKaXRTdHViKG91dHB1dEN0eDogT3V0cHV0Q29udGV4dCwgcmVmZXJlbmNlOiBTdGF0aWNTeW1ib2wpIHtcbiAgcmV0dXJuIGNyZWF0ZVN1bW1hcnlGb3JKaXRGdW5jdGlvbihvdXRwdXRDdHgsIHJlZmVyZW5jZSwgby5OVUxMX0VYUFIpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVTdW1tYXJ5Rm9ySml0RnVuY3Rpb24oXG4gICAgb3V0cHV0Q3R4OiBPdXRwdXRDb250ZXh0LCByZWZlcmVuY2U6IFN0YXRpY1N5bWJvbCwgdmFsdWU6IG8uRXhwcmVzc2lvbikge1xuICBjb25zdCBmbk5hbWUgPSBzdW1tYXJ5Rm9ySml0TmFtZShyZWZlcmVuY2UubmFtZSk7XG4gIG91dHB1dEN0eC5zdGF0ZW1lbnRzLnB1c2goXG4gICAgICBvLmZuKFtdLCBbbmV3IG8uUmV0dXJuU3RhdGVtZW50KHZhbHVlKV0sIG5ldyBvLkFycmF5VHlwZShvLkRZTkFNSUNfVFlQRSkpLnRvRGVjbFN0bXQoZm5OYW1lLCBbXG4gICAgICAgIG8uU3RtdE1vZGlmaWVyLkZpbmFsLCBvLlN0bXRNb2RpZmllci5FeHBvcnRlZFxuICAgICAgXSkpO1xufVxuXG5jb25zdCBlbnVtIFNlcmlhbGl6YXRpb25GbGFncyB7XG4gIE5vbmUgPSAwLFxuICBSZXNvbHZlVmFsdWUgPSAxLFxufVxuXG5jbGFzcyBUb0pzb25TZXJpYWxpemVyIGV4dGVuZHMgVmFsdWVUcmFuc2Zvcm1lciB7XG4gIC8vIE5vdGU6IFRoaXMgb25seSBjb250YWlucyBzeW1ib2xzIHdpdGhvdXQgbWVtYmVycy5cbiAgcHJpdmF0ZSBzeW1ib2xzOiBTdGF0aWNTeW1ib2xbXSA9IFtdO1xuICBwcml2YXRlIGluZGV4QnlTeW1ib2wgPSBuZXcgTWFwPFN0YXRpY1N5bWJvbCwgbnVtYmVyPigpO1xuICBwcml2YXRlIHJlZXhwb3J0ZWRCeSA9IG5ldyBNYXA8U3RhdGljU3ltYm9sLCBTdGF0aWNTeW1ib2w+KCk7XG4gIC8vIFRoaXMgbm93IGNvbnRhaW5zIGEgYF9fc3ltYm9sOiBudW1iZXJgIGluIHRoZSBwbGFjZSBvZlxuICAvLyBTdGF0aWNTeW1ib2xzLCBidXQgb3RoZXJ3aXNlIGhhcyB0aGUgc2FtZSBzaGFwZSBhcyB0aGUgb3JpZ2luYWwgb2JqZWN0cy5cbiAgcHJpdmF0ZSBwcm9jZXNzZWRTdW1tYXJ5QnlTeW1ib2wgPSBuZXcgTWFwPFN0YXRpY1N5bWJvbCwgYW55PigpO1xuICBwcml2YXRlIHByb2Nlc3NlZFN1bW1hcmllczogYW55W10gPSBbXTtcbiAgcHJpdmF0ZSBtb2R1bGVOYW1lOiBzdHJpbmd8bnVsbDtcblxuICB1bnByb2Nlc3NlZFN5bWJvbFN1bW1hcmllc0J5U3ltYm9sID0gbmV3IE1hcDxTdGF0aWNTeW1ib2wsIFN1bW1hcnk8U3RhdGljU3ltYm9sPj4oKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgc3ltYm9sUmVzb2x2ZXI6IFN0YXRpY1N5bWJvbFJlc29sdmVyLFxuICAgICAgcHJpdmF0ZSBzdW1tYXJ5UmVzb2x2ZXI6IFN1bW1hcnlSZXNvbHZlcjxTdGF0aWNTeW1ib2w+LCBwcml2YXRlIHNyY0ZpbGVOYW1lOiBzdHJpbmcpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMubW9kdWxlTmFtZSA9IHN5bWJvbFJlc29sdmVyLmdldEtub3duTW9kdWxlTmFtZShzcmNGaWxlTmFtZSk7XG4gIH1cblxuICBhZGRTdW1tYXJ5KHN1bW1hcnk6IFN1bW1hcnk8U3RhdGljU3ltYm9sPikge1xuICAgIGxldCB1bnByb2Nlc3NlZFN1bW1hcnkgPSB0aGlzLnVucHJvY2Vzc2VkU3ltYm9sU3VtbWFyaWVzQnlTeW1ib2wuZ2V0KHN1bW1hcnkuc3ltYm9sKTtcbiAgICBsZXQgcHJvY2Vzc2VkU3VtbWFyeSA9IHRoaXMucHJvY2Vzc2VkU3VtbWFyeUJ5U3ltYm9sLmdldChzdW1tYXJ5LnN5bWJvbCk7XG4gICAgaWYgKCF1bnByb2Nlc3NlZFN1bW1hcnkpIHtcbiAgICAgIHVucHJvY2Vzc2VkU3VtbWFyeSA9IHtzeW1ib2w6IHN1bW1hcnkuc3ltYm9sLCBtZXRhZGF0YTogdW5kZWZpbmVkfTtcbiAgICAgIHRoaXMudW5wcm9jZXNzZWRTeW1ib2xTdW1tYXJpZXNCeVN5bWJvbC5zZXQoc3VtbWFyeS5zeW1ib2wsIHVucHJvY2Vzc2VkU3VtbWFyeSk7XG4gICAgICBwcm9jZXNzZWRTdW1tYXJ5ID0ge3N5bWJvbDogdGhpcy5wcm9jZXNzVmFsdWUoc3VtbWFyeS5zeW1ib2wsIFNlcmlhbGl6YXRpb25GbGFncy5Ob25lKX07XG4gICAgICB0aGlzLnByb2Nlc3NlZFN1bW1hcmllcy5wdXNoKHByb2Nlc3NlZFN1bW1hcnkpO1xuICAgICAgdGhpcy5wcm9jZXNzZWRTdW1tYXJ5QnlTeW1ib2wuc2V0KHN1bW1hcnkuc3ltYm9sLCBwcm9jZXNzZWRTdW1tYXJ5KTtcbiAgICB9XG4gICAgaWYgKCF1bnByb2Nlc3NlZFN1bW1hcnkubWV0YWRhdGEgJiYgc3VtbWFyeS5tZXRhZGF0YSkge1xuICAgICAgbGV0IG1ldGFkYXRhID0gc3VtbWFyeS5tZXRhZGF0YSB8fCB7fTtcbiAgICAgIGlmIChtZXRhZGF0YS5fX3N5bWJvbGljID09PSAnY2xhc3MnKSB7XG4gICAgICAgIC8vIEZvciBjbGFzc2VzLCB3ZSBrZWVwIGV2ZXJ5dGhpbmcgZXhjZXB0IHRoZWlyIGNsYXNzIGRlY29yYXRvcnMuXG4gICAgICAgIC8vIFdlIG5lZWQgdG8ga2VlcCBlLmcuIHRoZSBjdG9yIGFyZ3MsIG1ldGhvZCBuYW1lcywgbWV0aG9kIGRlY29yYXRvcnNcbiAgICAgICAgLy8gc28gdGhhdCB0aGUgY2xhc3MgY2FuIGJlIGV4dGVuZGVkIGluIGFub3RoZXIgY29tcGlsYXRpb24gdW5pdC5cbiAgICAgICAgLy8gV2UgZG9uJ3Qga2VlcCB0aGUgY2xhc3MgZGVjb3JhdG9ycyBhc1xuICAgICAgICAvLyAxKSB0aGV5IHJlZmVyIHRvIGRhdGFcbiAgICAgICAgLy8gICB0aGF0IHNob3VsZCBub3QgY2F1c2UgYSByZWJ1aWxkIG9mIGRvd25zdHJlYW0gY29tcGlsYXRpb24gdW5pdHNcbiAgICAgICAgLy8gICAoZS5nLiBpbmxpbmUgdGVtcGxhdGVzIG9mIEBDb21wb25lbnQsIG9yIEBOZ01vZHVsZS5kZWNsYXJhdGlvbnMpXG4gICAgICAgIC8vIDIpIHRoZWlyIGRhdGEgaXMgYWxyZWFkeSBjYXB0dXJlZCBpbiBUeXBlU3VtbWFyaWVzLCBlLmcuIERpcmVjdGl2ZVN1bW1hcnkuXG4gICAgICAgIGNvbnN0IGNsb25lOiB7W2tleTogc3RyaW5nXTogYW55fSA9IHt9O1xuICAgICAgICBPYmplY3Qua2V5cyhtZXRhZGF0YSkuZm9yRWFjaCgocHJvcE5hbWUpID0+IHtcbiAgICAgICAgICBpZiAocHJvcE5hbWUgIT09ICdkZWNvcmF0b3JzJykge1xuICAgICAgICAgICAgY2xvbmVbcHJvcE5hbWVdID0gbWV0YWRhdGFbcHJvcE5hbWVdO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIG1ldGFkYXRhID0gY2xvbmU7XG4gICAgICB9IGVsc2UgaWYgKGlzQ2FsbChtZXRhZGF0YSkpIHtcbiAgICAgICAgaWYgKCFpc0Z1bmN0aW9uQ2FsbChtZXRhZGF0YSkgJiYgIWlzTWV0aG9kQ2FsbE9uVmFyaWFibGUobWV0YWRhdGEpKSB7XG4gICAgICAgICAgLy8gRG9uJ3Qgc3RvcmUgY29tcGxleCBjYWxscyBhcyB3ZSB3b24ndCBiZSBhYmxlIHRvIHNpbXBsaWZ5IHRoZW0gYW55d2F5cyBsYXRlciBvbi5cbiAgICAgICAgICBtZXRhZGF0YSA9IHtcbiAgICAgICAgICAgIF9fc3ltYm9saWM6ICdlcnJvcicsXG4gICAgICAgICAgICBtZXNzYWdlOiAnQ29tcGxleCBmdW5jdGlvbiBjYWxscyBhcmUgbm90IHN1cHBvcnRlZC4nLFxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIE5vdGU6IFdlIG5lZWQgdG8ga2VlcCBzdG9yaW5nIGN0b3IgY2FsbHMgZm9yIGUuZy5cbiAgICAgIC8vIGBleHBvcnQgY29uc3QgeCA9IG5ldyBJbmplY3Rpb25Ub2tlbiguLi4pYFxuICAgICAgdW5wcm9jZXNzZWRTdW1tYXJ5Lm1ldGFkYXRhID0gbWV0YWRhdGE7XG4gICAgICBwcm9jZXNzZWRTdW1tYXJ5Lm1ldGFkYXRhID0gdGhpcy5wcm9jZXNzVmFsdWUobWV0YWRhdGEsIFNlcmlhbGl6YXRpb25GbGFncy5SZXNvbHZlVmFsdWUpO1xuICAgICAgaWYgKG1ldGFkYXRhIGluc3RhbmNlb2YgU3RhdGljU3ltYm9sICYmXG4gICAgICAgICAgdGhpcy5zdW1tYXJ5UmVzb2x2ZXIuaXNMaWJyYXJ5RmlsZShtZXRhZGF0YS5maWxlUGF0aCkpIHtcbiAgICAgICAgY29uc3QgZGVjbGFyYXRpb25TeW1ib2wgPSB0aGlzLnN5bWJvbHNbdGhpcy5pbmRleEJ5U3ltYm9sLmdldChtZXRhZGF0YSkgIV07XG4gICAgICAgIGlmICghaXNMb3dlcmVkU3ltYm9sKGRlY2xhcmF0aW9uU3ltYm9sLm5hbWUpKSB7XG4gICAgICAgICAgLy8gTm90ZTogc3ltYm9scyB0aGF0IHdlcmUgaW50cm9kdWNlZCBkdXJpbmcgY29kZWdlbiBpbiB0aGUgdXNlciBmaWxlIGNhbiBoYXZlIGEgcmVleHBvcnRcbiAgICAgICAgICAvLyBpZiBhIHVzZXIgdXNlZCBgZXhwb3J0ICpgLiBIb3dldmVyLCB3ZSBjYW4ndCByZWx5IG9uIHRoaXMgYXMgdHNpY2tsZSB3aWxsIGNoYW5nZVxuICAgICAgICAgIC8vIGBleHBvcnQgKmAgaW50byBuYW1lZCBleHBvcnRzLCB1c2luZyBvbmx5IHRoZSBpbmZvcm1hdGlvbiBmcm9tIHRoZSB0eXBlY2hlY2tlci5cbiAgICAgICAgICAvLyBBcyB3ZSBpbnRyb2R1Y2UgdGhlIG5ldyBzeW1ib2xzIGFmdGVyIHR5cGVjaGVjaywgVHNpY2tsZSBkb2VzIG5vdCBrbm93IGFib3V0IHRoZW0sXG4gICAgICAgICAgLy8gYW5kIG9taXRzIHRoZW0gd2hlbiBleHBhbmRpbmcgYGV4cG9ydCAqYC5cbiAgICAgICAgICAvLyBTbyB3ZSBoYXZlIHRvIGtlZXAgcmVleHBvcnRpbmcgdGhlc2Ugc3ltYm9scyBtYW51YWxseSB2aWEgLm5nZmFjdG9yeSBmaWxlcy5cbiAgICAgICAgICB0aGlzLnJlZXhwb3J0ZWRCeS5zZXQoZGVjbGFyYXRpb25TeW1ib2wsIHN1bW1hcnkuc3ltYm9sKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIXVucHJvY2Vzc2VkU3VtbWFyeS50eXBlICYmIHN1bW1hcnkudHlwZSkge1xuICAgICAgdW5wcm9jZXNzZWRTdW1tYXJ5LnR5cGUgPSBzdW1tYXJ5LnR5cGU7XG4gICAgICAvLyBOb3RlOiBXZSBkb24ndCBhZGQgdGhlIHN1bW1hcmllcyBvZiBhbGwgcmVmZXJlbmNlZCBzeW1ib2xzIGFzIGZvciB0aGUgUmVzb2x2ZWRTeW1ib2xzLFxuICAgICAgLy8gYXMgdGhlIHR5cGUgc3VtbWFyaWVzIGFscmVhZHkgY29udGFpbiB0aGUgdHJhbnNpdGl2ZSBkYXRhIHRoYXQgdGhleSByZXF1aXJlXG4gICAgICAvLyAoaW4gYSBtaW5pbWFsIHdheSkuXG4gICAgICBwcm9jZXNzZWRTdW1tYXJ5LnR5cGUgPSB0aGlzLnByb2Nlc3NWYWx1ZShzdW1tYXJ5LnR5cGUsIFNlcmlhbGl6YXRpb25GbGFncy5Ob25lKTtcbiAgICAgIC8vIGV4Y2VwdCBmb3IgcmVleHBvcnRlZCBkaXJlY3RpdmVzIC8gcGlwZXMsIHNvIHdlIG5lZWQgdG8gc3RvcmVcbiAgICAgIC8vIHRoZWlyIHN1bW1hcmllcyBleHBsaWNpdGx5LlxuICAgICAgaWYgKHN1bW1hcnkudHlwZS5zdW1tYXJ5S2luZCA9PT0gQ29tcGlsZVN1bW1hcnlLaW5kLk5nTW9kdWxlKSB7XG4gICAgICAgIGNvbnN0IG5nTW9kdWxlU3VtbWFyeSA9IDxDb21waWxlTmdNb2R1bGVTdW1tYXJ5PnN1bW1hcnkudHlwZTtcbiAgICAgICAgbmdNb2R1bGVTdW1tYXJ5LmV4cG9ydGVkRGlyZWN0aXZlcy5jb25jYXQobmdNb2R1bGVTdW1tYXJ5LmV4cG9ydGVkUGlwZXMpLmZvckVhY2goKGlkKSA9PiB7XG4gICAgICAgICAgY29uc3Qgc3ltYm9sOiBTdGF0aWNTeW1ib2wgPSBpZC5yZWZlcmVuY2U7XG4gICAgICAgICAgaWYgKHRoaXMuc3VtbWFyeVJlc29sdmVyLmlzTGlicmFyeUZpbGUoc3ltYm9sLmZpbGVQYXRoKSAmJlxuICAgICAgICAgICAgICAhdGhpcy51bnByb2Nlc3NlZFN5bWJvbFN1bW1hcmllc0J5U3ltYm9sLmhhcyhzeW1ib2wpKSB7XG4gICAgICAgICAgICBjb25zdCBzdW1tYXJ5ID0gdGhpcy5zdW1tYXJ5UmVzb2x2ZXIucmVzb2x2ZVN1bW1hcnkoc3ltYm9sKTtcbiAgICAgICAgICAgIGlmIChzdW1tYXJ5KSB7XG4gICAgICAgICAgICAgIHRoaXMuYWRkU3VtbWFyeShzdW1tYXJ5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHNlcmlhbGl6ZSgpOiB7anNvbjogc3RyaW5nLCBleHBvcnRBczoge3N5bWJvbDogU3RhdGljU3ltYm9sLCBleHBvcnRBczogc3RyaW5nfVtdfSB7XG4gICAgY29uc3QgZXhwb3J0QXM6IHtzeW1ib2w6IFN0YXRpY1N5bWJvbCwgZXhwb3J0QXM6IHN0cmluZ31bXSA9IFtdO1xuICAgIGNvbnN0IGpzb24gPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICBtb2R1bGVOYW1lOiB0aGlzLm1vZHVsZU5hbWUsXG4gICAgICBzdW1tYXJpZXM6IHRoaXMucHJvY2Vzc2VkU3VtbWFyaWVzLFxuICAgICAgc3ltYm9sczogdGhpcy5zeW1ib2xzLm1hcCgoc3ltYm9sLCBpbmRleCkgPT4ge1xuICAgICAgICBzeW1ib2wuYXNzZXJ0Tm9NZW1iZXJzKCk7XG4gICAgICAgIGxldCBpbXBvcnRBczogc3RyaW5nfG51bWJlciA9IHVuZGVmaW5lZCAhO1xuICAgICAgICBpZiAodGhpcy5zdW1tYXJ5UmVzb2x2ZXIuaXNMaWJyYXJ5RmlsZShzeW1ib2wuZmlsZVBhdGgpKSB7XG4gICAgICAgICAgY29uc3QgcmVleHBvcnRTeW1ib2wgPSB0aGlzLnJlZXhwb3J0ZWRCeS5nZXQoc3ltYm9sKTtcbiAgICAgICAgICBpZiAocmVleHBvcnRTeW1ib2wpIHtcbiAgICAgICAgICAgIGltcG9ydEFzID0gdGhpcy5pbmRleEJ5U3ltYm9sLmdldChyZWV4cG9ydFN5bWJvbCkgITtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3Qgc3VtbWFyeSA9IHRoaXMudW5wcm9jZXNzZWRTeW1ib2xTdW1tYXJpZXNCeVN5bWJvbC5nZXQoc3ltYm9sKTtcbiAgICAgICAgICAgIGlmICghc3VtbWFyeSB8fCAhc3VtbWFyeS5tZXRhZGF0YSB8fCBzdW1tYXJ5Lm1ldGFkYXRhLl9fc3ltYm9saWMgIT09ICdpbnRlcmZhY2UnKSB7XG4gICAgICAgICAgICAgIGltcG9ydEFzID0gYCR7c3ltYm9sLm5hbWV9XyR7aW5kZXh9YDtcbiAgICAgICAgICAgICAgZXhwb3J0QXMucHVzaCh7c3ltYm9sLCBleHBvcnRBczogaW1wb3J0QXN9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBfX3N5bWJvbDogaW5kZXgsXG4gICAgICAgICAgbmFtZTogc3ltYm9sLm5hbWUsXG4gICAgICAgICAgZmlsZVBhdGg6IHRoaXMuc3VtbWFyeVJlc29sdmVyLnRvU3VtbWFyeUZpbGVOYW1lKHN5bWJvbC5maWxlUGF0aCwgdGhpcy5zcmNGaWxlTmFtZSksXG4gICAgICAgICAgaW1wb3J0QXM6IGltcG9ydEFzXG4gICAgICAgIH07XG4gICAgICB9KVxuICAgIH0pO1xuICAgIHJldHVybiB7anNvbiwgZXhwb3J0QXN9O1xuICB9XG5cbiAgcHJpdmF0ZSBwcm9jZXNzVmFsdWUodmFsdWU6IGFueSwgZmxhZ3M6IFNlcmlhbGl6YXRpb25GbGFncyk6IGFueSB7XG4gICAgcmV0dXJuIHZpc2l0VmFsdWUodmFsdWUsIHRoaXMsIGZsYWdzKTtcbiAgfVxuXG4gIHZpc2l0T3RoZXIodmFsdWU6IGFueSwgY29udGV4dDogYW55KTogYW55IHtcbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBTdGF0aWNTeW1ib2wpIHtcbiAgICAgIGxldCBiYXNlU3ltYm9sID0gdGhpcy5zeW1ib2xSZXNvbHZlci5nZXRTdGF0aWNTeW1ib2wodmFsdWUuZmlsZVBhdGgsIHZhbHVlLm5hbWUpO1xuICAgICAgY29uc3QgaW5kZXggPSB0aGlzLnZpc2l0U3RhdGljU3ltYm9sKGJhc2VTeW1ib2wsIGNvbnRleHQpO1xuICAgICAgcmV0dXJuIHtfX3N5bWJvbDogaW5kZXgsIG1lbWJlcnM6IHZhbHVlLm1lbWJlcnN9O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTdHJpcCBsaW5lIGFuZCBjaGFyYWN0ZXIgbnVtYmVycyBmcm9tIG5nc3VtbWFyaWVzLlxuICAgKiBFbWl0dGluZyB0aGVtIGNhdXNlcyB3aGl0ZSBzcGFjZXMgY2hhbmdlcyB0byByZXRyaWdnZXIgdXBzdHJlYW1cbiAgICogcmVjb21waWxhdGlvbnMgaW4gYmF6ZWwuXG4gICAqIFRPRE86IGZpbmQgb3V0IGEgd2F5IHRvIGhhdmUgbGluZSBhbmQgY2hhcmFjdGVyIG51bWJlcnMgaW4gZXJyb3JzIHdpdGhvdXRcbiAgICogZXhjZXNzaXZlIHJlY29tcGlsYXRpb24gaW4gYmF6ZWwuXG4gICAqL1xuICB2aXNpdFN0cmluZ01hcChtYXA6IHtba2V5OiBzdHJpbmddOiBhbnl9LCBjb250ZXh0OiBhbnkpOiBhbnkge1xuICAgIGlmIChtYXBbJ19fc3ltYm9saWMnXSA9PT0gJ3Jlc29sdmVkJykge1xuICAgICAgcmV0dXJuIHZpc2l0VmFsdWUobWFwLnN5bWJvbCwgdGhpcywgY29udGV4dCk7XG4gICAgfVxuICAgIGlmIChtYXBbJ19fc3ltYm9saWMnXSA9PT0gJ2Vycm9yJykge1xuICAgICAgZGVsZXRlIG1hcFsnbGluZSddO1xuICAgICAgZGVsZXRlIG1hcFsnY2hhcmFjdGVyJ107XG4gICAgfVxuICAgIHJldHVybiBzdXBlci52aXNpdFN0cmluZ01hcChtYXAsIGNvbnRleHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgbnVsbCBpZiB0aGUgb3B0aW9ucy5yZXNvbHZlVmFsdWUgaXMgdHJ1ZSwgYW5kIHRoZSBzdW1tYXJ5IGZvciB0aGUgc3ltYm9sXG4gICAqIHJlc29sdmVkIHRvIGEgdHlwZSBvciBjb3VsZCBub3QgYmUgcmVzb2x2ZWQuXG4gICAqL1xuICBwcml2YXRlIHZpc2l0U3RhdGljU3ltYm9sKGJhc2VTeW1ib2w6IFN0YXRpY1N5bWJvbCwgZmxhZ3M6IFNlcmlhbGl6YXRpb25GbGFncyk6IG51bWJlciB7XG4gICAgbGV0IGluZGV4OiBudW1iZXJ8dW5kZWZpbmVkfG51bGwgPSB0aGlzLmluZGV4QnlTeW1ib2wuZ2V0KGJhc2VTeW1ib2wpO1xuICAgIGxldCBzdW1tYXJ5OiBTdW1tYXJ5PFN0YXRpY1N5bWJvbD58bnVsbCA9IG51bGw7XG4gICAgaWYgKGZsYWdzICYgU2VyaWFsaXphdGlvbkZsYWdzLlJlc29sdmVWYWx1ZSAmJlxuICAgICAgICB0aGlzLnN1bW1hcnlSZXNvbHZlci5pc0xpYnJhcnlGaWxlKGJhc2VTeW1ib2wuZmlsZVBhdGgpKSB7XG4gICAgICBpZiAodGhpcy51bnByb2Nlc3NlZFN5bWJvbFN1bW1hcmllc0J5U3ltYm9sLmhhcyhiYXNlU3ltYm9sKSkge1xuICAgICAgICAvLyB0aGUgc3VtbWFyeSBmb3IgdGhpcyBzeW1ib2wgd2FzIGFscmVhZHkgYWRkZWRcbiAgICAgICAgLy8gLT4gbm90aGluZyB0byBkby5cbiAgICAgICAgcmV0dXJuIGluZGV4ICE7XG4gICAgICB9XG4gICAgICBzdW1tYXJ5ID0gdGhpcy5sb2FkU3VtbWFyeShiYXNlU3ltYm9sKTtcbiAgICAgIGlmIChzdW1tYXJ5ICYmIHN1bW1hcnkubWV0YWRhdGEgaW5zdGFuY2VvZiBTdGF0aWNTeW1ib2wpIHtcbiAgICAgICAgLy8gVGhlIHN1bW1hcnkgaXMgYSByZWV4cG9ydFxuICAgICAgICBpbmRleCA9IHRoaXMudmlzaXRTdGF0aWNTeW1ib2woc3VtbWFyeS5tZXRhZGF0YSwgZmxhZ3MpO1xuICAgICAgICAvLyByZXNldCB0aGUgc3VtbWFyeSBhcyBpdCBpcyBqdXN0IGEgcmVleHBvcnQsIHNvIHdlIGRvbid0IHdhbnQgdG8gc3RvcmUgaXQuXG4gICAgICAgIHN1bW1hcnkgPSBudWxsO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaW5kZXggIT0gbnVsbCkge1xuICAgICAgLy8gTm90ZTogPT0gb24gcHVycG9zZSB0byBjb21wYXJlIHdpdGggdW5kZWZpbmVkIVxuICAgICAgLy8gTm8gc3VtbWFyeSBhbmQgdGhlIHN5bWJvbCBpcyBhbHJlYWR5IGFkZGVkIC0+IG5vdGhpbmcgdG8gZG8uXG4gICAgICByZXR1cm4gaW5kZXg7XG4gICAgfVxuICAgIC8vIE5vdGU6ID09IG9uIHB1cnBvc2UgdG8gY29tcGFyZSB3aXRoIHVuZGVmaW5lZCFcbiAgICBpZiAoaW5kZXggPT0gbnVsbCkge1xuICAgICAgaW5kZXggPSB0aGlzLnN5bWJvbHMubGVuZ3RoO1xuICAgICAgdGhpcy5zeW1ib2xzLnB1c2goYmFzZVN5bWJvbCk7XG4gICAgfVxuICAgIHRoaXMuaW5kZXhCeVN5bWJvbC5zZXQoYmFzZVN5bWJvbCwgaW5kZXgpO1xuICAgIGlmIChzdW1tYXJ5KSB7XG4gICAgICB0aGlzLmFkZFN1bW1hcnkoc3VtbWFyeSk7XG4gICAgfVxuICAgIHJldHVybiBpbmRleDtcbiAgfVxuXG4gIHByaXZhdGUgbG9hZFN1bW1hcnkoc3ltYm9sOiBTdGF0aWNTeW1ib2wpOiBTdW1tYXJ5PFN0YXRpY1N5bWJvbD58bnVsbCB7XG4gICAgbGV0IHN1bW1hcnkgPSB0aGlzLnN1bW1hcnlSZXNvbHZlci5yZXNvbHZlU3VtbWFyeShzeW1ib2wpO1xuICAgIGlmICghc3VtbWFyeSkge1xuICAgICAgLy8gc29tZSBzeW1ib2xzIG1pZ2h0IG9yaWdpbmF0ZSBmcm9tIGEgcGxhaW4gdHlwZXNjcmlwdCBsaWJyYXJ5XG4gICAgICAvLyB0aGF0IGp1c3QgZXhwb3J0ZWQgLmQudHMgYW5kIC5tZXRhZGF0YS5qc29uIGZpbGVzLCBpLmUuIHdoZXJlIG5vIHN1bW1hcnlcbiAgICAgIC8vIGZpbGVzIHdlcmUgY3JlYXRlZC5cbiAgICAgIGNvbnN0IHJlc29sdmVkU3ltYm9sID0gdGhpcy5zeW1ib2xSZXNvbHZlci5yZXNvbHZlU3ltYm9sKHN5bWJvbCk7XG4gICAgICBpZiAocmVzb2x2ZWRTeW1ib2wpIHtcbiAgICAgICAgc3VtbWFyeSA9IHtzeW1ib2w6IHJlc29sdmVkU3ltYm9sLnN5bWJvbCwgbWV0YWRhdGE6IHJlc29sdmVkU3ltYm9sLm1ldGFkYXRhfTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHN1bW1hcnk7XG4gIH1cbn1cblxuY2xhc3MgRm9ySml0U2VyaWFsaXplciB7XG4gIHByaXZhdGUgZGF0YTogQXJyYXk8e1xuICAgIHN1bW1hcnk6IENvbXBpbGVUeXBlU3VtbWFyeSxcbiAgICBtZXRhZGF0YTogQ29tcGlsZU5nTW9kdWxlTWV0YWRhdGF8Q29tcGlsZURpcmVjdGl2ZU1ldGFkYXRhfENvbXBpbGVQaXBlTWV0YWRhdGF8XG4gICAgQ29tcGlsZVR5cGVNZXRhZGF0YXxudWxsLFxuICAgIGlzTGlicmFyeTogYm9vbGVhblxuICB9PiA9IFtdO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBvdXRwdXRDdHg6IE91dHB1dENvbnRleHQsIHByaXZhdGUgc3ltYm9sUmVzb2x2ZXI6IFN0YXRpY1N5bWJvbFJlc29sdmVyLFxuICAgICAgcHJpdmF0ZSBzdW1tYXJ5UmVzb2x2ZXI6IFN1bW1hcnlSZXNvbHZlcjxTdGF0aWNTeW1ib2w+KSB7fVxuXG4gIGFkZFNvdXJjZVR5cGUoXG4gICAgICBzdW1tYXJ5OiBDb21waWxlVHlwZVN1bW1hcnksIG1ldGFkYXRhOiBDb21waWxlTmdNb2R1bGVNZXRhZGF0YXxDb21waWxlRGlyZWN0aXZlTWV0YWRhdGF8XG4gICAgICBDb21waWxlUGlwZU1ldGFkYXRhfENvbXBpbGVUeXBlTWV0YWRhdGEpIHtcbiAgICB0aGlzLmRhdGEucHVzaCh7c3VtbWFyeSwgbWV0YWRhdGEsIGlzTGlicmFyeTogZmFsc2V9KTtcbiAgfVxuXG4gIGFkZExpYlR5cGUoc3VtbWFyeTogQ29tcGlsZVR5cGVTdW1tYXJ5KSB7XG4gICAgdGhpcy5kYXRhLnB1c2goe3N1bW1hcnksIG1ldGFkYXRhOiBudWxsLCBpc0xpYnJhcnk6IHRydWV9KTtcbiAgfVxuXG4gIHNlcmlhbGl6ZShleHBvcnRBc0Fycjoge3N5bWJvbDogU3RhdGljU3ltYm9sLCBleHBvcnRBczogc3RyaW5nfVtdKTogdm9pZCB7XG4gICAgY29uc3QgZXhwb3J0QXNCeVN5bWJvbCA9IG5ldyBNYXA8U3RhdGljU3ltYm9sLCBzdHJpbmc+KCk7XG4gICAgZm9yIChjb25zdCB7c3ltYm9sLCBleHBvcnRBc30gb2YgZXhwb3J0QXNBcnIpIHtcbiAgICAgIGV4cG9ydEFzQnlTeW1ib2wuc2V0KHN5bWJvbCwgZXhwb3J0QXMpO1xuICAgIH1cbiAgICBjb25zdCBuZ01vZHVsZVN5bWJvbHMgPSBuZXcgU2V0PFN0YXRpY1N5bWJvbD4oKTtcblxuICAgIGZvciAoY29uc3Qge3N1bW1hcnksIG1ldGFkYXRhLCBpc0xpYnJhcnl9IG9mIHRoaXMuZGF0YSkge1xuICAgICAgaWYgKHN1bW1hcnkuc3VtbWFyeUtpbmQgPT09IENvbXBpbGVTdW1tYXJ5S2luZC5OZ01vZHVsZSkge1xuICAgICAgICAvLyBjb2xsZWN0IHRoZSBzeW1ib2xzIHRoYXQgcmVmZXIgdG8gTmdNb2R1bGUgY2xhc3Nlcy5cbiAgICAgICAgLy8gTm90ZTogd2UgY2FuJ3QganVzdCByZWx5IG9uIGBzdW1tYXJ5LnR5cGUuc3VtbWFyeUtpbmRgIHRvIGRldGVybWluZSB0aGlzIGFzXG4gICAgICAgIC8vIHdlIGRvbid0IGFkZCB0aGUgc3VtbWFyaWVzIG9mIGFsbCByZWZlcmVuY2VkIHN5bWJvbHMgd2hlbiB3ZSBzZXJpYWxpemUgdHlwZSBzdW1tYXJpZXMuXG4gICAgICAgIC8vIFNlZSBzZXJpYWxpemVTdW1tYXJpZXMgZm9yIGRldGFpbHMuXG4gICAgICAgIG5nTW9kdWxlU3ltYm9scy5hZGQoc3VtbWFyeS50eXBlLnJlZmVyZW5jZSk7XG4gICAgICAgIGNvbnN0IG1vZFN1bW1hcnkgPSA8Q29tcGlsZU5nTW9kdWxlU3VtbWFyeT5zdW1tYXJ5O1xuICAgICAgICBmb3IgKGNvbnN0IG1vZCBvZiBtb2RTdW1tYXJ5Lm1vZHVsZXMpIHtcbiAgICAgICAgICBuZ01vZHVsZVN5bWJvbHMuYWRkKG1vZC5yZWZlcmVuY2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoIWlzTGlicmFyeSkge1xuICAgICAgICBjb25zdCBmbk5hbWUgPSBzdW1tYXJ5Rm9ySml0TmFtZShzdW1tYXJ5LnR5cGUucmVmZXJlbmNlLm5hbWUpO1xuICAgICAgICBjcmVhdGVTdW1tYXJ5Rm9ySml0RnVuY3Rpb24oXG4gICAgICAgICAgICB0aGlzLm91dHB1dEN0eCwgc3VtbWFyeS50eXBlLnJlZmVyZW5jZSxcbiAgICAgICAgICAgIHRoaXMuc2VyaWFsaXplU3VtbWFyeVdpdGhEZXBzKHN1bW1hcnksIG1ldGFkYXRhICEpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBuZ01vZHVsZVN5bWJvbHMuZm9yRWFjaCgobmdNb2R1bGVTeW1ib2wpID0+IHtcbiAgICAgIGlmICh0aGlzLnN1bW1hcnlSZXNvbHZlci5pc0xpYnJhcnlGaWxlKG5nTW9kdWxlU3ltYm9sLmZpbGVQYXRoKSkge1xuICAgICAgICBsZXQgZXhwb3J0QXMgPSBleHBvcnRBc0J5U3ltYm9sLmdldChuZ01vZHVsZVN5bWJvbCkgfHwgbmdNb2R1bGVTeW1ib2wubmFtZTtcbiAgICAgICAgY29uc3Qgaml0RXhwb3J0QXNOYW1lID0gc3VtbWFyeUZvckppdE5hbWUoZXhwb3J0QXMpO1xuICAgICAgICB0aGlzLm91dHB1dEN0eC5zdGF0ZW1lbnRzLnB1c2goby52YXJpYWJsZShqaXRFeHBvcnRBc05hbWUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldCh0aGlzLnNlcmlhbGl6ZVN1bW1hcnlSZWYobmdNb2R1bGVTeW1ib2wpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50b0RlY2xTdG10KG51bGwsIFtvLlN0bXRNb2RpZmllci5FeHBvcnRlZF0pKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgc2VyaWFsaXplU3VtbWFyeVdpdGhEZXBzKFxuICAgICAgc3VtbWFyeTogQ29tcGlsZVR5cGVTdW1tYXJ5LCBtZXRhZGF0YTogQ29tcGlsZU5nTW9kdWxlTWV0YWRhdGF8Q29tcGlsZURpcmVjdGl2ZU1ldGFkYXRhfFxuICAgICAgQ29tcGlsZVBpcGVNZXRhZGF0YXxDb21waWxlVHlwZU1ldGFkYXRhKTogby5FeHByZXNzaW9uIHtcbiAgICBjb25zdCBleHByZXNzaW9uczogby5FeHByZXNzaW9uW10gPSBbdGhpcy5zZXJpYWxpemVTdW1tYXJ5KHN1bW1hcnkpXTtcbiAgICBsZXQgcHJvdmlkZXJzOiBDb21waWxlUHJvdmlkZXJNZXRhZGF0YVtdID0gW107XG4gICAgaWYgKG1ldGFkYXRhIGluc3RhbmNlb2YgQ29tcGlsZU5nTW9kdWxlTWV0YWRhdGEpIHtcbiAgICAgIGV4cHJlc3Npb25zLnB1c2goLi4uXG4gICAgICAgICAgICAgICAgICAgICAgIC8vIEZvciBkaXJlY3RpdmVzIC8gcGlwZXMsIHdlIG9ubHkgYWRkIHRoZSBkZWNsYXJlZCBvbmVzLFxuICAgICAgICAgICAgICAgICAgICAgICAvLyBhbmQgcmVseSBvbiB0cmFuc2l0aXZlbHkgaW1wb3J0aW5nIE5nTW9kdWxlcyB0byBnZXQgdGhlIHRyYW5zaXRpdmVcbiAgICAgICAgICAgICAgICAgICAgICAgLy8gc3VtbWFyaWVzLlxuICAgICAgICAgICAgICAgICAgICAgICBtZXRhZGF0YS5kZWNsYXJlZERpcmVjdGl2ZXMuY29uY2F0KG1ldGFkYXRhLmRlY2xhcmVkUGlwZXMpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAubWFwKHR5cGUgPT4gdHlwZS5yZWZlcmVuY2UpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBGb3IgbW9kdWxlcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdlIGFsc28gYWRkIHRoZSBzdW1tYXJpZXMgZm9yIG1vZHVsZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZyb20gbGlicmFyaWVzLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBpcyBvayBhcyB3ZSBwcm9kdWNlIHJlZXhwb3J0cyBmb3IgYWxsIHRyYW5zaXRpdmUgbW9kdWxlcy5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgIC5jb25jYXQobWV0YWRhdGEudHJhbnNpdGl2ZU1vZHVsZS5tb2R1bGVzLm1hcCh0eXBlID0+IHR5cGUucmVmZXJlbmNlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmZpbHRlcihyZWYgPT4gcmVmICE9PSBtZXRhZGF0YS50eXBlLnJlZmVyZW5jZSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAubWFwKChyZWYpID0+IHRoaXMuc2VyaWFsaXplU3VtbWFyeVJlZihyZWYpKSk7XG4gICAgICAvLyBOb3RlOiBXZSBkb24ndCB1c2UgYE5nTW9kdWxlU3VtbWFyeS5wcm92aWRlcnNgLCBhcyB0aGF0IG9uZSBpcyB0cmFuc2l0aXZlLFxuICAgICAgLy8gYW5kIHdlIGFscmVhZHkgaGF2ZSB0cmFuc2l0aXZlIG1vZHVsZXMuXG4gICAgICBwcm92aWRlcnMgPSBtZXRhZGF0YS5wcm92aWRlcnM7XG4gICAgfSBlbHNlIGlmIChzdW1tYXJ5LnN1bW1hcnlLaW5kID09PSBDb21waWxlU3VtbWFyeUtpbmQuRGlyZWN0aXZlKSB7XG4gICAgICBjb25zdCBkaXJTdW1tYXJ5ID0gPENvbXBpbGVEaXJlY3RpdmVTdW1tYXJ5PnN1bW1hcnk7XG4gICAgICBwcm92aWRlcnMgPSBkaXJTdW1tYXJ5LnByb3ZpZGVycy5jb25jYXQoZGlyU3VtbWFyeS52aWV3UHJvdmlkZXJzKTtcbiAgICB9XG4gICAgLy8gTm90ZTogV2UgY2FuJ3QganVzdCByZWZlciB0byB0aGUgYG5nc3VtbWFyeS50c2AgZmlsZXMgZm9yIGB1c2VDbGFzc2AgcHJvdmlkZXJzIChhcyB3ZSBkbyBmb3JcbiAgICAvLyBkZWNsYXJlZERpcmVjdGl2ZXMgLyBkZWNsYXJlZFBpcGVzKSwgYXMgd2UgYWxsb3dcbiAgICAvLyBwcm92aWRlcnMgd2l0aG91dCBjdG9yIGFyZ3VtZW50cyB0byBza2lwIHRoZSBgQEluamVjdGFibGVgIGRlY29yYXRvcixcbiAgICAvLyBpLmUuIHdlIGRpZG4ndCBnZW5lcmF0ZSAubmdzdW1tYXJ5LnRzIGZpbGVzIGZvciB0aGVzZS5cbiAgICBleHByZXNzaW9ucy5wdXNoKFxuICAgICAgICAuLi5wcm92aWRlcnMuZmlsdGVyKHByb3ZpZGVyID0+ICEhcHJvdmlkZXIudXNlQ2xhc3MpLm1hcChwcm92aWRlciA9PiB0aGlzLnNlcmlhbGl6ZVN1bW1hcnkoe1xuICAgICAgICAgIHN1bW1hcnlLaW5kOiBDb21waWxlU3VtbWFyeUtpbmQuSW5qZWN0YWJsZSwgdHlwZTogcHJvdmlkZXIudXNlQ2xhc3NcbiAgICAgICAgfSBhcyBDb21waWxlVHlwZVN1bW1hcnkpKSk7XG4gICAgcmV0dXJuIG8ubGl0ZXJhbEFycihleHByZXNzaW9ucyk7XG4gIH1cblxuICBwcml2YXRlIHNlcmlhbGl6ZVN1bW1hcnlSZWYodHlwZVN5bWJvbDogU3RhdGljU3ltYm9sKTogby5FeHByZXNzaW9uIHtcbiAgICBjb25zdCBqaXRJbXBvcnRlZFN5bWJvbCA9IHRoaXMuc3ltYm9sUmVzb2x2ZXIuZ2V0U3RhdGljU3ltYm9sKFxuICAgICAgICBzdW1tYXJ5Rm9ySml0RmlsZU5hbWUodHlwZVN5bWJvbC5maWxlUGF0aCksIHN1bW1hcnlGb3JKaXROYW1lKHR5cGVTeW1ib2wubmFtZSkpO1xuICAgIHJldHVybiB0aGlzLm91dHB1dEN0eC5pbXBvcnRFeHByKGppdEltcG9ydGVkU3ltYm9sKTtcbiAgfVxuXG4gIHByaXZhdGUgc2VyaWFsaXplU3VtbWFyeShkYXRhOiB7W2tleTogc3RyaW5nXTogYW55fSk6IG8uRXhwcmVzc2lvbiB7XG4gICAgY29uc3Qgb3V0cHV0Q3R4ID0gdGhpcy5vdXRwdXRDdHg7XG5cbiAgICBjbGFzcyBUcmFuc2Zvcm1lciBpbXBsZW1lbnRzIFZhbHVlVmlzaXRvciB7XG4gICAgICB2aXNpdEFycmF5KGFycjogYW55W10sIGNvbnRleHQ6IGFueSk6IGFueSB7XG4gICAgICAgIHJldHVybiBvLmxpdGVyYWxBcnIoYXJyLm1hcChlbnRyeSA9PiB2aXNpdFZhbHVlKGVudHJ5LCB0aGlzLCBjb250ZXh0KSkpO1xuICAgICAgfVxuICAgICAgdmlzaXRTdHJpbmdNYXAobWFwOiB7W2tleTogc3RyaW5nXTogYW55fSwgY29udGV4dDogYW55KTogYW55IHtcbiAgICAgICAgcmV0dXJuIG5ldyBvLkxpdGVyYWxNYXBFeHByKE9iamVjdC5rZXlzKG1hcCkubWFwKFxuICAgICAgICAgICAgKGtleSkgPT4gbmV3IG8uTGl0ZXJhbE1hcEVudHJ5KGtleSwgdmlzaXRWYWx1ZShtYXBba2V5XSwgdGhpcywgY29udGV4dCksIGZhbHNlKSkpO1xuICAgICAgfVxuICAgICAgdmlzaXRQcmltaXRpdmUodmFsdWU6IGFueSwgY29udGV4dDogYW55KTogYW55IHsgcmV0dXJuIG8ubGl0ZXJhbCh2YWx1ZSk7IH1cbiAgICAgIHZpc2l0T3RoZXIodmFsdWU6IGFueSwgY29udGV4dDogYW55KTogYW55IHtcbiAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgU3RhdGljU3ltYm9sKSB7XG4gICAgICAgICAgcmV0dXJuIG91dHB1dEN0eC5pbXBvcnRFeHByKHZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYElsbGVnYWwgU3RhdGU6IEVuY291bnRlcmVkIHZhbHVlICR7dmFsdWV9YCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdmlzaXRWYWx1ZShkYXRhLCBuZXcgVHJhbnNmb3JtZXIoKSwgbnVsbCk7XG4gIH1cbn1cblxuY2xhc3MgRnJvbUpzb25EZXNlcmlhbGl6ZXIgZXh0ZW5kcyBWYWx1ZVRyYW5zZm9ybWVyIHtcbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIHByaXZhdGUgc3ltYm9scyAhOiBTdGF0aWNTeW1ib2xbXTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgc3ltYm9sQ2FjaGU6IFN0YXRpY1N5bWJvbENhY2hlLFxuICAgICAgcHJpdmF0ZSBzdW1tYXJ5UmVzb2x2ZXI6IFN1bW1hcnlSZXNvbHZlcjxTdGF0aWNTeW1ib2w+KSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuXG4gIGRlc2VyaWFsaXplKGxpYnJhcnlGaWxlTmFtZTogc3RyaW5nLCBqc29uOiBzdHJpbmcpOiB7XG4gICAgbW9kdWxlTmFtZTogc3RyaW5nIHwgbnVsbCxcbiAgICBzdW1tYXJpZXM6IFN1bW1hcnk8U3RhdGljU3ltYm9sPltdLFxuICAgIGltcG9ydEFzOiB7c3ltYm9sOiBTdGF0aWNTeW1ib2wsIGltcG9ydEFzOiBTdGF0aWNTeW1ib2x9W11cbiAgfSB7XG4gICAgY29uc3QgZGF0YToge21vZHVsZU5hbWU6IHN0cmluZyB8IG51bGwsIHN1bW1hcmllczogYW55W10sIHN5bWJvbHM6IGFueVtdfSA9IEpTT04ucGFyc2UoanNvbik7XG4gICAgY29uc3QgYWxsSW1wb3J0QXM6IHtzeW1ib2w6IFN0YXRpY1N5bWJvbCwgaW1wb3J0QXM6IFN0YXRpY1N5bWJvbH1bXSA9IFtdO1xuICAgIHRoaXMuc3ltYm9scyA9IGRhdGEuc3ltYm9scy5tYXAoXG4gICAgICAgIChzZXJpYWxpemVkU3ltYm9sKSA9PiB0aGlzLnN5bWJvbENhY2hlLmdldChcbiAgICAgICAgICAgIHRoaXMuc3VtbWFyeVJlc29sdmVyLmZyb21TdW1tYXJ5RmlsZU5hbWUoc2VyaWFsaXplZFN5bWJvbC5maWxlUGF0aCwgbGlicmFyeUZpbGVOYW1lKSxcbiAgICAgICAgICAgIHNlcmlhbGl6ZWRTeW1ib2wubmFtZSkpO1xuICAgIGRhdGEuc3ltYm9scy5mb3JFYWNoKChzZXJpYWxpemVkU3ltYm9sLCBpbmRleCkgPT4ge1xuICAgICAgY29uc3Qgc3ltYm9sID0gdGhpcy5zeW1ib2xzW2luZGV4XTtcbiAgICAgIGNvbnN0IGltcG9ydEFzID0gc2VyaWFsaXplZFN5bWJvbC5pbXBvcnRBcztcbiAgICAgIGlmICh0eXBlb2YgaW1wb3J0QXMgPT09ICdudW1iZXInKSB7XG4gICAgICAgIGFsbEltcG9ydEFzLnB1c2goe3N5bWJvbCwgaW1wb3J0QXM6IHRoaXMuc3ltYm9sc1tpbXBvcnRBc119KTtcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGltcG9ydEFzID09PSAnc3RyaW5nJykge1xuICAgICAgICBhbGxJbXBvcnRBcy5wdXNoKFxuICAgICAgICAgICAge3N5bWJvbCwgaW1wb3J0QXM6IHRoaXMuc3ltYm9sQ2FjaGUuZ2V0KG5nZmFjdG9yeUZpbGVQYXRoKGxpYnJhcnlGaWxlTmFtZSksIGltcG9ydEFzKX0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGNvbnN0IHN1bW1hcmllcyA9IHZpc2l0VmFsdWUoZGF0YS5zdW1tYXJpZXMsIHRoaXMsIG51bGwpIGFzIFN1bW1hcnk8U3RhdGljU3ltYm9sPltdO1xuICAgIHJldHVybiB7bW9kdWxlTmFtZTogZGF0YS5tb2R1bGVOYW1lLCBzdW1tYXJpZXMsIGltcG9ydEFzOiBhbGxJbXBvcnRBc307XG4gIH1cblxuICB2aXNpdFN0cmluZ01hcChtYXA6IHtba2V5OiBzdHJpbmddOiBhbnl9LCBjb250ZXh0OiBhbnkpOiBhbnkge1xuICAgIGlmICgnX19zeW1ib2wnIGluIG1hcCkge1xuICAgICAgY29uc3QgYmFzZVN5bWJvbCA9IHRoaXMuc3ltYm9sc1ttYXBbJ19fc3ltYm9sJ11dO1xuICAgICAgY29uc3QgbWVtYmVycyA9IG1hcFsnbWVtYmVycyddO1xuICAgICAgcmV0dXJuIG1lbWJlcnMubGVuZ3RoID8gdGhpcy5zeW1ib2xDYWNoZS5nZXQoYmFzZVN5bWJvbC5maWxlUGF0aCwgYmFzZVN5bWJvbC5uYW1lLCBtZW1iZXJzKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYXNlU3ltYm9sO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gc3VwZXIudmlzaXRTdHJpbmdNYXAobWFwLCBjb250ZXh0KTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNDYWxsKG1ldGFkYXRhOiBhbnkpOiBib29sZWFuIHtcbiAgcmV0dXJuIG1ldGFkYXRhICYmIG1ldGFkYXRhLl9fc3ltYm9saWMgPT09ICdjYWxsJztcbn1cblxuZnVuY3Rpb24gaXNGdW5jdGlvbkNhbGwobWV0YWRhdGE6IGFueSk6IGJvb2xlYW4ge1xuICByZXR1cm4gaXNDYWxsKG1ldGFkYXRhKSAmJiB1bndyYXBSZXNvbHZlZE1ldGFkYXRhKG1ldGFkYXRhLmV4cHJlc3Npb24pIGluc3RhbmNlb2YgU3RhdGljU3ltYm9sO1xufVxuXG5mdW5jdGlvbiBpc01ldGhvZENhbGxPblZhcmlhYmxlKG1ldGFkYXRhOiBhbnkpOiBib29sZWFuIHtcbiAgcmV0dXJuIGlzQ2FsbChtZXRhZGF0YSkgJiYgbWV0YWRhdGEuZXhwcmVzc2lvbiAmJiBtZXRhZGF0YS5leHByZXNzaW9uLl9fc3ltYm9saWMgPT09ICdzZWxlY3QnICYmXG4gICAgICB1bndyYXBSZXNvbHZlZE1ldGFkYXRhKG1ldGFkYXRhLmV4cHJlc3Npb24uZXhwcmVzc2lvbikgaW5zdGFuY2VvZiBTdGF0aWNTeW1ib2w7XG59XG4iXX0=
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ValueTransformer, visitValue } from '../util';
import { StaticSymbol } from './static_symbol';
import { isGeneratedFile, stripSummaryForJitFileSuffix, stripSummaryForJitNameSuffix, summaryForJitFileName, summaryForJitName } from './util';
const TS = /^(?!.*\.d\.ts$).*\.ts$/;
export class ResolvedStaticSymbol {
    constructor(symbol, metadata) {
        this.symbol = symbol;
        this.metadata = metadata;
    }
}
const SUPPORTED_SCHEMA_VERSION = 4;
/**
 * This class is responsible for loading metadata per symbol,
 * and normalizing references between symbols.
 *
 * Internally, it only uses symbols without members,
 * and deduces the values for symbols with members based
 * on these symbols.
 */
export class StaticSymbolResolver {
    constructor(host, staticSymbolCache, summaryResolver, errorRecorder) {
        this.host = host;
        this.staticSymbolCache = staticSymbolCache;
        this.summaryResolver = summaryResolver;
        this.errorRecorder = errorRecorder;
        this.metadataCache = new Map();
        // Note: this will only contain StaticSymbols without members!
        this.resolvedSymbols = new Map();
        this.resolvedFilePaths = new Set();
        // Note: this will only contain StaticSymbols without members!
        this.importAs = new Map();
        this.symbolResourcePaths = new Map();
        this.symbolFromFile = new Map();
        this.knownFileNameToModuleNames = new Map();
    }
    resolveSymbol(staticSymbol) {
        if (staticSymbol.members.length > 0) {
            return this._resolveSymbolMembers(staticSymbol);
        }
        // Note: always ask for a summary first,
        // as we might have read shallow metadata via a .d.ts file
        // for the symbol.
        const resultFromSummary = this._resolveSymbolFromSummary(staticSymbol);
        if (resultFromSummary) {
            return resultFromSummary;
        }
        const resultFromCache = this.resolvedSymbols.get(staticSymbol);
        if (resultFromCache) {
            return resultFromCache;
        }
        // Note: Some users use libraries that were not compiled with ngc, i.e. they don't
        // have summaries, only .d.ts files. So we always need to check both, the summary
        // and metadata.
        this._createSymbolsOf(staticSymbol.filePath);
        return this.resolvedSymbols.get(staticSymbol);
    }
    /**
     * getImportAs produces a symbol that can be used to import the given symbol.
     * The import might be different than the symbol if the symbol is exported from
     * a library with a summary; in which case we want to import the symbol from the
     * ngfactory re-export instead of directly to avoid introducing a direct dependency
     * on an otherwise indirect dependency.
     *
     * @param staticSymbol the symbol for which to generate a import symbol
     */
    getImportAs(staticSymbol, useSummaries = true) {
        if (staticSymbol.members.length) {
            const baseSymbol = this.getStaticSymbol(staticSymbol.filePath, staticSymbol.name);
            const baseImportAs = this.getImportAs(baseSymbol, useSummaries);
            return baseImportAs ?
                this.getStaticSymbol(baseImportAs.filePath, baseImportAs.name, staticSymbol.members) :
                null;
        }
        const summarizedFileName = stripSummaryForJitFileSuffix(staticSymbol.filePath);
        if (summarizedFileName !== staticSymbol.filePath) {
            const summarizedName = stripSummaryForJitNameSuffix(staticSymbol.name);
            const baseSymbol = this.getStaticSymbol(summarizedFileName, summarizedName, staticSymbol.members);
            const baseImportAs = this.getImportAs(baseSymbol, useSummaries);
            return baseImportAs ?
                this.getStaticSymbol(summaryForJitFileName(baseImportAs.filePath), summaryForJitName(baseImportAs.name), baseSymbol.members) :
                null;
        }
        let result = (useSummaries && this.summaryResolver.getImportAs(staticSymbol)) || null;
        if (!result) {
            result = this.importAs.get(staticSymbol);
        }
        return result;
    }
    /**
     * getResourcePath produces the path to the original location of the symbol and should
     * be used to determine the relative location of resource references recorded in
     * symbol metadata.
     */
    getResourcePath(staticSymbol) {
        return this.symbolResourcePaths.get(staticSymbol) || staticSymbol.filePath;
    }
    /**
     * getTypeArity returns the number of generic type parameters the given symbol
     * has. If the symbol is not a type the result is null.
     */
    getTypeArity(staticSymbol) {
        // If the file is a factory/ngsummary file, don't resolve the symbol as doing so would
        // cause the metadata for an factory/ngsummary file to be loaded which doesn't exist.
        // All references to generated classes must include the correct arity whenever
        // generating code.
        if (isGeneratedFile(staticSymbol.filePath)) {
            return null;
        }
        let resolvedSymbol = unwrapResolvedMetadata(this.resolveSymbol(staticSymbol));
        while (resolvedSymbol && resolvedSymbol.metadata instanceof StaticSymbol) {
            resolvedSymbol = unwrapResolvedMetadata(this.resolveSymbol(resolvedSymbol.metadata));
        }
        return (resolvedSymbol && resolvedSymbol.metadata && resolvedSymbol.metadata.arity) || null;
    }
    getKnownModuleName(filePath) {
        return this.knownFileNameToModuleNames.get(filePath) || null;
    }
    recordImportAs(sourceSymbol, targetSymbol) {
        sourceSymbol.assertNoMembers();
        targetSymbol.assertNoMembers();
        this.importAs.set(sourceSymbol, targetSymbol);
    }
    recordModuleNameForFileName(fileName, moduleName) {
        this.knownFileNameToModuleNames.set(fileName, moduleName);
    }
    /**
     * Invalidate all information derived from the given file.
     *
     * @param fileName the file to invalidate
     */
    invalidateFile(fileName) {
        this.metadataCache.delete(fileName);
        this.resolvedFilePaths.delete(fileName);
        const symbols = this.symbolFromFile.get(fileName);
        if (symbols) {
            this.symbolFromFile.delete(fileName);
            for (const symbol of symbols) {
                this.resolvedSymbols.delete(symbol);
                this.importAs.delete(symbol);
                this.symbolResourcePaths.delete(symbol);
            }
        }
    }
    /** @internal */
    ignoreErrorsFor(cb) {
        const recorder = this.errorRecorder;
        this.errorRecorder = () => { };
        try {
            return cb();
        }
        finally {
            this.errorRecorder = recorder;
        }
    }
    _resolveSymbolMembers(staticSymbol) {
        const members = staticSymbol.members;
        const baseResolvedSymbol = this.resolveSymbol(this.getStaticSymbol(staticSymbol.filePath, staticSymbol.name));
        if (!baseResolvedSymbol) {
            return null;
        }
        let baseMetadata = unwrapResolvedMetadata(baseResolvedSymbol.metadata);
        if (baseMetadata instanceof StaticSymbol) {
            return new ResolvedStaticSymbol(staticSymbol, this.getStaticSymbol(baseMetadata.filePath, baseMetadata.name, members));
        }
        else if (baseMetadata && baseMetadata.__symbolic === 'class') {
            if (baseMetadata.statics && members.length === 1) {
                return new ResolvedStaticSymbol(staticSymbol, baseMetadata.statics[members[0]]);
            }
        }
        else {
            let value = baseMetadata;
            for (let i = 0; i < members.length && value; i++) {
                value = value[members[i]];
            }
            return new ResolvedStaticSymbol(staticSymbol, value);
        }
        return null;
    }
    _resolveSymbolFromSummary(staticSymbol) {
        const summary = this.summaryResolver.resolveSummary(staticSymbol);
        return summary ? new ResolvedStaticSymbol(staticSymbol, summary.metadata) : null;
    }
    /**
     * getStaticSymbol produces a Type whose metadata is known but whose implementation is not loaded.
     * All types passed to the StaticResolver should be pseudo-types returned by this method.
     *
     * @param declarationFile the absolute path of the file where the symbol is declared
     * @param name the name of the type.
     * @param members a symbol for a static member of the named type
     */
    getStaticSymbol(declarationFile, name, members) {
        return this.staticSymbolCache.get(declarationFile, name, members);
    }
    /**
     * hasDecorators checks a file's metadata for the presence of decorators without evaluating the
     * metadata.
     *
     * @param filePath the absolute path to examine for decorators.
     * @returns true if any class in the file has a decorator.
     */
    hasDecorators(filePath) {
        const metadata = this.getModuleMetadata(filePath);
        if (metadata['metadata']) {
            return Object.keys(metadata['metadata']).some((metadataKey) => {
                const entry = metadata['metadata'][metadataKey];
                return entry && entry.__symbolic === 'class' && entry.decorators;
            });
        }
        return false;
    }
    getSymbolsOf(filePath) {
        const summarySymbols = this.summaryResolver.getSymbolsOf(filePath);
        if (summarySymbols) {
            return summarySymbols;
        }
        // Note: Some users use libraries that were not compiled with ngc, i.e. they don't
        // have summaries, only .d.ts files, but `summaryResolver.isLibraryFile` returns true.
        this._createSymbolsOf(filePath);
        const metadataSymbols = [];
        this.resolvedSymbols.forEach((resolvedSymbol) => {
            if (resolvedSymbol.symbol.filePath === filePath) {
                metadataSymbols.push(resolvedSymbol.symbol);
            }
        });
        return metadataSymbols;
    }
    _createSymbolsOf(filePath) {
        if (this.resolvedFilePaths.has(filePath)) {
            return;
        }
        this.resolvedFilePaths.add(filePath);
        const resolvedSymbols = [];
        const metadata = this.getModuleMetadata(filePath);
        if (metadata['importAs']) {
            // Index bundle indices should use the importAs module name defined
            // in the bundle.
            this.knownFileNameToModuleNames.set(filePath, metadata['importAs']);
        }
        // handle the symbols in one of the re-export location
        if (metadata['exports']) {
            for (const moduleExport of metadata['exports']) {
                // handle the symbols in the list of explicitly re-exported symbols.
                if (moduleExport.export) {
                    moduleExport.export.forEach((exportSymbol) => {
                        let symbolName;
                        if (typeof exportSymbol === 'string') {
                            symbolName = exportSymbol;
                        }
                        else {
                            symbolName = exportSymbol.as;
                        }
                        symbolName = unescapeIdentifier(symbolName);
                        let symName = symbolName;
                        if (typeof exportSymbol !== 'string') {
                            symName = unescapeIdentifier(exportSymbol.name);
                        }
                        const resolvedModule = this.resolveModule(moduleExport.from, filePath);
                        if (resolvedModule) {
                            const targetSymbol = this.getStaticSymbol(resolvedModule, symName);
                            const sourceSymbol = this.getStaticSymbol(filePath, symbolName);
                            resolvedSymbols.push(this.createExport(sourceSymbol, targetSymbol));
                        }
                    });
                }
                else {
                    // handle the symbols via export * directives.
                    const resolvedModule = this.resolveModule(moduleExport.from, filePath);
                    if (resolvedModule) {
                        const nestedExports = this.getSymbolsOf(resolvedModule);
                        nestedExports.forEach((targetSymbol) => {
                            const sourceSymbol = this.getStaticSymbol(filePath, targetSymbol.name);
                            resolvedSymbols.push(this.createExport(sourceSymbol, targetSymbol));
                        });
                    }
                }
            }
        }
        // handle the actual metadata. Has to be after the exports
        // as there might be collisions in the names, and we want the symbols
        // of the current module to win ofter reexports.
        if (metadata['metadata']) {
            // handle direct declarations of the symbol
            const topLevelSymbolNames = new Set(Object.keys(metadata['metadata']).map(unescapeIdentifier));
            const origins = metadata['origins'] || {};
            Object.keys(metadata['metadata']).forEach((metadataKey) => {
                const symbolMeta = metadata['metadata'][metadataKey];
                const name = unescapeIdentifier(metadataKey);
                const symbol = this.getStaticSymbol(filePath, name);
                const origin = origins.hasOwnProperty(metadataKey) && origins[metadataKey];
                if (origin) {
                    // If the symbol is from a bundled index, use the declaration location of the
                    // symbol so relative references (such as './my.html') will be calculated
                    // correctly.
                    const originFilePath = this.resolveModule(origin, filePath);
                    if (!originFilePath) {
                        this.reportError(new Error(`Couldn't resolve original symbol for ${origin} from ${this.host.getOutputName(filePath)}`));
                    }
                    else {
                        this.symbolResourcePaths.set(symbol, originFilePath);
                    }
                }
                resolvedSymbols.push(this.createResolvedSymbol(symbol, filePath, topLevelSymbolNames, symbolMeta));
            });
        }
        resolvedSymbols.forEach((resolvedSymbol) => this.resolvedSymbols.set(resolvedSymbol.symbol, resolvedSymbol));
        this.symbolFromFile.set(filePath, resolvedSymbols.map(resolvedSymbol => resolvedSymbol.symbol));
    }
    createResolvedSymbol(sourceSymbol, topLevelPath, topLevelSymbolNames, metadata) {
        // For classes that don't have Angular summaries / metadata,
        // we only keep their arity, but nothing else
        // (e.g. their constructor parameters).
        // We do this to prevent introducing deep imports
        // as we didn't generate .ngfactory.ts files with proper reexports.
        const isTsFile = TS.test(sourceSymbol.filePath);
        if (this.summaryResolver.isLibraryFile(sourceSymbol.filePath) && !isTsFile && metadata &&
            metadata['__symbolic'] === 'class') {
            const transformedMeta = { __symbolic: 'class', arity: metadata.arity };
            return new ResolvedStaticSymbol(sourceSymbol, transformedMeta);
        }
        let _originalFileMemo;
        const getOriginalName = () => {
            if (!_originalFileMemo) {
                // Guess what the original file name is from the reference. If it has a `.d.ts` extension
                // replace it with `.ts`. If it already has `.ts` just leave it in place. If it doesn't have
                // .ts or .d.ts, append `.ts'. Also, if it is in `node_modules`, trim the `node_module`
                // location as it is not important to finding the file.
                _originalFileMemo =
                    this.host.getOutputName(topLevelPath.replace(/((\.ts)|(\.d\.ts)|)$/, '.ts')
                        .replace(/^.*node_modules[/\\]/, ''));
            }
            return _originalFileMemo;
        };
        const self = this;
        class ReferenceTransformer extends ValueTransformer {
            visitStringMap(map, functionParams) {
                const symbolic = map['__symbolic'];
                if (symbolic === 'function') {
                    const oldLen = functionParams.length;
                    functionParams.push(...(map['parameters'] || []));
                    const result = super.visitStringMap(map, functionParams);
                    functionParams.length = oldLen;
                    return result;
                }
                else if (symbolic === 'reference') {
                    const module = map['module'];
                    const name = map['name'] ? unescapeIdentifier(map['name']) : map['name'];
                    if (!name) {
                        return null;
                    }
                    let filePath;
                    if (module) {
                        filePath = self.resolveModule(module, sourceSymbol.filePath);
                        if (!filePath) {
                            return {
                                __symbolic: 'error',
                                message: `Could not resolve ${module} relative to ${self.host.getMetadataFor(sourceSymbol.filePath)}.`,
                                line: map.line,
                                character: map.character,
                                fileName: getOriginalName()
                            };
                        }
                        return {
                            __symbolic: 'resolved',
                            symbol: self.getStaticSymbol(filePath, name),
                            line: map.line,
                            character: map.character,
                            fileName: getOriginalName()
                        };
                    }
                    else if (functionParams.indexOf(name) >= 0) {
                        // reference to a function parameter
                        return { __symbolic: 'reference', name: name };
                    }
                    else {
                        if (topLevelSymbolNames.has(name)) {
                            return self.getStaticSymbol(topLevelPath, name);
                        }
                        // ambient value
                        null;
                    }
                }
                else if (symbolic === 'error') {
                    return Object.assign({}, map, { fileName: getOriginalName() });
                }
                else {
                    return super.visitStringMap(map, functionParams);
                }
            }
        }
        const transformedMeta = visitValue(metadata, new ReferenceTransformer(), []);
        let unwrappedTransformedMeta = unwrapResolvedMetadata(transformedMeta);
        if (unwrappedTransformedMeta instanceof StaticSymbol) {
            return this.createExport(sourceSymbol, unwrappedTransformedMeta);
        }
        return new ResolvedStaticSymbol(sourceSymbol, transformedMeta);
    }
    createExport(sourceSymbol, targetSymbol) {
        sourceSymbol.assertNoMembers();
        targetSymbol.assertNoMembers();
        if (this.summaryResolver.isLibraryFile(sourceSymbol.filePath) &&
            this.summaryResolver.isLibraryFile(targetSymbol.filePath)) {
            // This case is for an ng library importing symbols from a plain ts library
            // transitively.
            // Note: We rely on the fact that we discover symbols in the direction
            // from source files to library files
            this.importAs.set(targetSymbol, this.getImportAs(sourceSymbol) || sourceSymbol);
        }
        return new ResolvedStaticSymbol(sourceSymbol, targetSymbol);
    }
    reportError(error, context, path) {
        if (this.errorRecorder) {
            this.errorRecorder(error, (context && context.filePath) || path);
        }
        else {
            throw error;
        }
    }
    /**
     * @param module an absolute path to a module file.
     */
    getModuleMetadata(module) {
        let moduleMetadata = this.metadataCache.get(module);
        if (!moduleMetadata) {
            const moduleMetadatas = this.host.getMetadataFor(module);
            if (moduleMetadatas) {
                let maxVersion = -1;
                moduleMetadatas.forEach((md) => {
                    if (md && md['version'] > maxVersion) {
                        maxVersion = md['version'];
                        moduleMetadata = md;
                    }
                });
            }
            if (!moduleMetadata) {
                moduleMetadata =
                    { __symbolic: 'module', version: SUPPORTED_SCHEMA_VERSION, module: module, metadata: {} };
            }
            if (moduleMetadata['version'] != SUPPORTED_SCHEMA_VERSION) {
                const errorMessage = moduleMetadata['version'] == 2 ?
                    `Unsupported metadata version ${moduleMetadata['version']} for module ${module}. This module should be compiled with a newer version of ngc` :
                    `Metadata version mismatch for module ${this.host.getOutputName(module)}, found version ${moduleMetadata['version']}, expected ${SUPPORTED_SCHEMA_VERSION}`;
                this.reportError(new Error(errorMessage));
            }
            this.metadataCache.set(module, moduleMetadata);
        }
        return moduleMetadata;
    }
    getSymbolByModule(module, symbolName, containingFile) {
        const filePath = this.resolveModule(module, containingFile);
        if (!filePath) {
            this.reportError(new Error(`Could not resolve module ${module}${containingFile ? ' relative to ' +
                this.host.getOutputName(containingFile) : ''}`));
            return this.getStaticSymbol(`ERROR:${module}`, symbolName);
        }
        return this.getStaticSymbol(filePath, symbolName);
    }
    resolveModule(module, containingFile) {
        try {
            return this.host.moduleNameToFileName(module, containingFile);
        }
        catch (e) {
            console.error(`Could not resolve module '${module}' relative to file ${containingFile}`);
            this.reportError(e, undefined, containingFile);
        }
        return null;
    }
}
// Remove extra underscore from escaped identifier.
// See https://github.com/Microsoft/TypeScript/blob/master/src/compiler/utilities.ts
export function unescapeIdentifier(identifier) {
    return identifier.startsWith('___') ? identifier.substr(1) : identifier;
}
export function unwrapResolvedMetadata(metadata) {
    if (metadata && metadata.__symbolic === 'resolved') {
        return metadata.symbol;
    }
    return metadata;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGljX3N5bWJvbF9yZXNvbHZlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyL3NyYy9hb3Qvc3RhdGljX3N5bWJvbF9yZXNvbHZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFHSCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsVUFBVSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBRXJELE9BQU8sRUFBQyxZQUFZLEVBQW9CLE1BQU0saUJBQWlCLENBQUM7QUFDaEUsT0FBTyxFQUFDLGVBQWUsRUFBRSw0QkFBNEIsRUFBRSw0QkFBNEIsRUFBRSxxQkFBcUIsRUFBRSxpQkFBaUIsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUU3SSxNQUFNLEVBQUUsR0FBRyx3QkFBd0IsQ0FBQztBQUVwQyxNQUFNLE9BQU8sb0JBQW9CO0lBQy9CLFlBQW1CLE1BQW9CLEVBQVMsUUFBYTtRQUExQyxXQUFNLEdBQU4sTUFBTSxDQUFjO1FBQVMsYUFBUSxHQUFSLFFBQVEsQ0FBSztJQUFHLENBQUM7Q0FDbEU7QUFpQ0QsTUFBTSx3QkFBd0IsR0FBRyxDQUFDLENBQUM7QUFFbkM7Ozs7Ozs7R0FPRztBQUNILE1BQU0sT0FBTyxvQkFBb0I7SUFXL0IsWUFDWSxJQUE4QixFQUFVLGlCQUFvQyxFQUM1RSxlQUE4QyxFQUM5QyxhQUF1RDtRQUZ2RCxTQUFJLEdBQUosSUFBSSxDQUEwQjtRQUFVLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBbUI7UUFDNUUsb0JBQWUsR0FBZixlQUFlLENBQStCO1FBQzlDLGtCQUFhLEdBQWIsYUFBYSxDQUEwQztRQWIzRCxrQkFBYSxHQUFHLElBQUksR0FBRyxFQUFnQyxDQUFDO1FBQ2hFLDhEQUE4RDtRQUN0RCxvQkFBZSxHQUFHLElBQUksR0FBRyxFQUFzQyxDQUFDO1FBQ2hFLHNCQUFpQixHQUFHLElBQUksR0FBRyxFQUFVLENBQUM7UUFDOUMsOERB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Q0FBQyxDQUFDO1NBQzVEO1FBQ0QsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUNwRCxDQUFDO0lBRU8sYUFBYSxDQUFDLE1BQWMsRUFBRSxjQUF1QjtRQUMzRCxJQUFJO1lBQ0YsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sRUFBRSxjQUFjLENBQUMsQ0FBQztTQUMvRDtRQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ1YsT0FBTyxDQUFDLEtBQUssQ0FBQyw2QkFBNkIsTUFBTSxzQkFBc0IsY0FBYyxFQUFFLENBQUMsQ0FBQztZQUN6RixJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsRUFBRSxTQUFTLEVBQUUsY0FBYyxDQUFDLENBQUM7U0FDaEQ7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7Q0FDRjtBQUVELG1EQUFtRDtBQUNuRCxvRkFBb0Y7QUFDcEYsTUFBTSxVQUFVLGtCQUFrQixDQUFDLFVBQWtCO0lBQ25ELE9BQU8sVUFBVSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDO0FBQzFFLENBQUM7QUFFRCxNQUFNLFVBQVUsc0JBQXNCLENBQUMsUUFBYTtJQUNsRCxJQUFJLFFBQVEsSUFBSSxRQUFRLENBQUMsVUFBVSxLQUFLLFVBQVUsRUFBRTtRQUNsRCxPQUFPLFFBQVEsQ0FBQyxNQUFNLENBQUM7S0FDeEI7SUFDRCxPQUFPLFFBQVEsQ0FBQztBQUNsQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1N1bW1hcnlSZXNvbHZlcn0gZnJvbSAnLi4vc3VtbWFyeV9yZXNvbHZlcic7XG5pbXBvcnQge1ZhbHVlVHJhbnNmb3JtZXIsIHZpc2l0VmFsdWV9IGZyb20gJy4uL3V0aWwnO1xuXG5pbXBvcnQge1N0YXRpY1N5bWJvbCwgU3RhdGljU3ltYm9sQ2FjaGV9IGZyb20gJy4vc3RhdGljX3N5bWJvbCc7XG5pbXBvcnQge2lzR2VuZXJhdGVkRmlsZSwgc3RyaXBTdW1tYXJ5Rm9ySml0RmlsZVN1ZmZpeCwgc3RyaXBTdW1tYXJ5Rm9ySml0TmFtZVN1ZmZpeCwgc3VtbWFyeUZvckppdEZpbGVOYW1lLCBzdW1tYXJ5Rm9ySml0TmFtZX0gZnJvbSAnLi91dGlsJztcblxuY29uc3QgVFMgPSAvXig/IS4qXFwuZFxcLnRzJCkuKlxcLnRzJC87XG5cbmV4cG9ydCBjbGFzcyBSZXNvbHZlZFN0YXRpY1N5bWJvbCB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBzeW1ib2w6IFN0YXRpY1N5bWJvbCwgcHVibGljIG1ldGFkYXRhOiBhbnkpIHt9XG59XG5cbi8qKlxuICogVGhlIGhvc3Qgb2YgdGhlIFN5bWJvbFJlc29sdmVySG9zdCBkaXNjb25uZWN0cyB0aGUgaW1wbGVtZW50YXRpb24gZnJvbSBUeXBlU2NyaXB0IC8gb3RoZXJcbiAqIGxhbmd1YWdlXG4gKiBzZXJ2aWNlcyBhbmQgZnJvbSB1bmRlcmx5aW5nIGZpbGUgc3lzdGVtcy5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTdGF0aWNTeW1ib2xSZXNvbHZlckhvc3Qge1xuICAvKipcbiAgICogUmV0dXJuIGEgTW9kdWxlTWV0YWRhdGEgZm9yIHRoZSBnaXZlbiBtb2R1bGUuXG4gICAqIEFuZ3VsYXIgQ0xJIHdpbGwgcHJvZHVjZSB0aGlzIG1ldGFkYXRhIGZvciBhIG1vZHVsZSB3aGVuZXZlciBhIC5kLnRzIGZpbGVzIGlzXG4gICAqIHByb2R1Y2VkIGFuZCB0aGUgbW9kdWxlIGhhcyBleHBvcnRlZCB2YXJpYWJsZXMgb3IgY2xhc3NlcyB3aXRoIGRlY29yYXRvcnMuIE1vZHVsZSBtZXRhZGF0YSBjYW5cbiAgICogYWxzbyBiZSBwcm9kdWNlZCBkaXJlY3RseSBmcm9tIFR5cGVTY3JpcHQgc291cmNlcyBieSB1c2luZyBNZXRhZGF0YUNvbGxlY3RvciBpbiB0b29scy9tZXRhZGF0YS5cbiAgICpcbiAgICogQHBhcmFtIG1vZHVsZVBhdGggaXMgYSBzdHJpbmcgaWRlbnRpZmllciBmb3IgYSBtb2R1bGUgYXMgYW4gYWJzb2x1dGUgcGF0aC5cbiAgICogQHJldHVybnMgdGhlIG1ldGFkYXRhIGZvciB0aGUgZ2l2ZW4gbW9kdWxlLlxuICAgKi9cbiAgZ2V0TWV0YWRhdGFGb3IobW9kdWxlUGF0aDogc3RyaW5nKToge1trZXk6IHN0cmluZ106IGFueX1bXXx1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIGEgbW9kdWxlIG5hbWUgdGhhdCBpcyB1c2VkIGluIGFuIGBpbXBvcnRgIHRvIGEgZmlsZSBwYXRoLlxuICAgKiBJLmUuXG4gICAqIGBwYXRoL3RvL2NvbnRhaW5pbmdGaWxlLnRzYCBjb250YWluaW5nIGBpbXBvcnQgey4uLn0gZnJvbSAnbW9kdWxlLW5hbWUnYC5cbiAgICovXG4gIG1vZHVsZU5hbWVUb0ZpbGVOYW1lKG1vZHVsZU5hbWU6IHN0cmluZywgY29udGFpbmluZ0ZpbGU/OiBzdHJpbmcpOiBzdHJpbmd8bnVsbDtcblxuICAvKipcbiAgICogR2V0IGEgZmlsZSBzdWl0YWJsZSBmb3IgZGlzcGxheSB0byB0aGUgdXNlciB0aGF0IHNob3VsZCBiZSByZWxhdGl2ZSB0byB0aGUgcHJvamVjdCBkaXJlY3RvcnlcbiAgICogb3IgdGhlIGN1cnJlbnQgZGlyZWN0b3J5LlxuICAgKi9cbiAgZ2V0T3V0cHV0TmFtZShmaWxlUGF0aDogc3RyaW5nKTogc3RyaW5nO1xufVxuXG5jb25zdCBTVVBQT1JURURfU0NIRU1BX1ZFUlNJT04gPSA0O1xuXG4vKipcbiAqIFRoaXMgY2xhc3MgaXMgcmVzcG9uc2libGUgZm9yIGxvYWRpbmcgbWV0YWRhdGEgcGVyIHN5bWJvbCxcbiAqIGFuZCBub3JtYWxpemluZyByZWZlcmVuY2VzIGJldHdlZW4gc3ltYm9scy5cbiAqXG4gKiBJbnRlcm5hbGx5LCBpdCBvbmx5IHVzZXMgc3ltYm9scyB3aXRob3V0IG1lbWJlcnMsXG4gKiBhbmQgZGVkdWNlcyB0aGUgdmFsdWVzIGZvciBzeW1ib2xzIHdpdGggbWVtYmVycyBiYXNlZFxuICogb24gdGhlc2Ugc3ltYm9scy5cbiAqL1xuZXhwb3J0IGNsYXNzIFN0YXRpY1N5bWJvbFJlc29sdmVyIHtcbiAgcHJpdmF0ZSBtZXRhZGF0YUNhY2hlID0gbmV3IE1hcDxzdHJpbmcsIHtba2V5OiBzdHJpbmddOiBhbnl9PigpO1xuICAvLyBOb3RlOiB0aGlzIHdpbGwgb25seSBjb250YWluIFN0YXRpY1N5bWJvbHMgd2l0aG91dCBtZW1iZXJzIVxuICBwcml2YXRlIHJlc29sdmVkU3ltYm9scyA9IG5ldyBNYXA8U3RhdGljU3ltYm9sLCBSZXNvbHZlZFN0YXRpY1N5bWJvbD4oKTtcbiAgcHJpdmF0ZSByZXNvbHZlZEZpbGVQYXRocyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAvLyBOb3RlOiB0aGlzIHdpbGwgb25seSBjb250YWluIFN0YXRpY1N5bWJvbHMgd2l0aG91dCBtZW1iZXJzIVxuICBwcml2YXRlIGltcG9ydEFzID0gbmV3IE1hcDxTdGF0aWNTeW1ib2wsIFN0YXRpY1N5bWJvbD4oKTtcbiAgcHJpdmF0ZSBzeW1ib2xSZXNvdXJjZVBhdGhzID0gbmV3IE1hcDxTdGF0aWNTeW1ib2wsIHN0cmluZz4oKTtcbiAgcHJpdmF0ZSBzeW1ib2xGcm9tRmlsZSA9IG5ldyBNYXA8c3RyaW5nLCBTdGF0aWNTeW1ib2xbXT4oKTtcbiAgcHJpdmF0ZSBrbm93bkZpbGVOYW1lVG9Nb2R1bGVOYW1lcyA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIGhvc3Q6IFN0YXRpY1N5bWJvbFJlc29sdmVySG9zdCwgcHJpdmF0ZSBzdGF0aWNTeW1ib2xDYWNoZTogU3RhdGljU3ltYm9sQ2FjaGUsXG4gICAgICBwcml2YXRlIHN1bW1hcnlSZXNvbHZlcjogU3VtbWFyeVJlc29sdmVyPFN0YXRpY1N5bWJvbD4sXG4gICAgICBwcml2YXRlIGVycm9yUmVjb3JkZXI/OiAoZXJyb3I6IGFueSwgZmlsZU5hbWU/OiBzdHJpbmcpID0+IHZvaWQpIHt9XG5cbiAgcmVzb2x2ZVN5bWJvbChzdGF0aWNTeW1ib2w6IFN0YXRpY1N5bWJvbCk6IFJlc29sdmVkU3RhdGljU3ltYm9sIHtcbiAgICBpZiAoc3RhdGljU3ltYm9sLm1lbWJlcnMubGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3Jlc29sdmVTeW1ib2xNZW1iZXJzKHN0YXRpY1N5bWJvbCkgITtcbiAgICB9XG4gICAgLy8gTm90ZTogYWx3YXlzIGFzayBmb3IgYSBzdW1tYXJ5IGZpcnN0LFxuICAgIC8vIGFzIHdlIG1pZ2h0IGhhdmUgcmVhZCBzaGFsbG93IG1ldGFkYXRhIHZpYSBhIC5kLnRzIGZpbGVcbiAgICAvLyBmb3IgdGhlIHN5bWJvbC5cbiAgICBjb25zdCByZXN1bHRGcm9tU3VtbWFyeSA9IHRoaXMuX3Jlc29sdmVTeW1ib2xGcm9tU3VtbWFyeShzdGF0aWNTeW1ib2wpICE7XG4gICAgaWYgKHJlc3VsdEZyb21TdW1tYXJ5KSB7XG4gICAgICByZXR1cm4gcmVzdWx0RnJvbVN1bW1hcnk7XG4gICAgfVxuICAgIGNvbnN0IHJlc3VsdEZyb21DYWNoZSA9IHRoaXMucmVzb2x2ZWRTeW1ib2xzLmdldChzdGF0aWNTeW1ib2wpO1xuICAgIGlmIChyZXN1bHRGcm9tQ2FjaGUpIHtcbiAgICAgIHJldHVybiByZXN1bHRGcm9tQ2FjaGU7XG4gICAgfVxuICAgIC8vIE5vdGU6IFNvbWUgdXNlcnMgdXNlIGxpYnJhcmllcyB0aGF0IHdlcmUgbm90IGNvbXBpbGVkIHdpdGggbmdjLCBpLmUuIHRoZXkgZG9uJ3RcbiAgICAvLyBoYXZlIHN1bW1hcmllcywgb25seSAuZC50cyBmaWxlcy4gU28gd2UgYWx3YXlzIG5lZWQgdG8gY2hlY2sgYm90aCwgdGhlIHN1bW1hcnlcbiAgICAvLyBhbmQgbWV0YWRhdGEuXG4gICAgdGhpcy5fY3JlYXRlU3ltYm9sc09mKHN0YXRpY1N5bWJvbC5maWxlUGF0aCk7XG4gICAgcmV0dXJuIHRoaXMucmVzb2x2ZWRTeW1ib2xzLmdldChzdGF0aWNTeW1ib2wpICE7XG4gIH1cblxuICAvKipcbiAgICogZ2V0SW1wb3J0QXMgcHJvZHVjZXMgYSBzeW1ib2wgdGhhdCBjYW4gYmUgdXNlZCB0byBpbXBvcnQgdGhlIGdpdmVuIHN5bWJvbC5cbiAgICogVGhlIGltcG9ydCBtaWdodCBiZSBkaWZmZXJlbnQgdGhhbiB0aGUgc3ltYm9sIGlmIHRoZSBzeW1ib2wgaXMgZXhwb3J0ZWQgZnJvbVxuICAgKiBhIGxpYnJhcnkgd2l0aCBhIHN1bW1hcnk7IGluIHdoaWNoIGNhc2Ugd2Ugd2FudCB0byBpbXBvcnQgdGhlIHN5bWJvbCBmcm9tIHRoZVxuICAgKiBuZ2ZhY3RvcnkgcmUtZXhwb3J0IGluc3RlYWQgb2YgZGlyZWN0bHkgdG8gYXZvaWQgaW50cm9kdWNpbmcgYSBkaXJlY3QgZGVwZW5kZW5jeVxuICAgKiBvbiBhbiBvdGhlcndpc2UgaW5kaXJlY3QgZGVwZW5kZW5jeS5cbiAgICpcbiAgICogQHBhcmFtIHN0YXRpY1N5bWJvbCB0aGUgc3ltYm9sIGZvciB3aGljaCB0byBnZW5lcmF0ZSBhIGltcG9ydCBzeW1ib2xcbiAgICovXG4gIGdldEltcG9ydEFzKHN0YXRpY1N5bWJvbDogU3RhdGljU3ltYm9sLCB1c2VTdW1tYXJpZXM6IGJvb2xlYW4gPSB0cnVlKTogU3RhdGljU3ltYm9sfG51bGwge1xuICAgIGlmIChzdGF0aWNTeW1ib2wubWVtYmVycy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IGJhc2VTeW1ib2wgPSB0aGlzLmdldFN0YXRpY1N5bWJvbChzdGF0aWNTeW1ib2wuZmlsZVBhdGgsIHN0YXRpY1N5bWJvbC5uYW1lKTtcbiAgICAgIGNvbnN0IGJhc2VJbXBvcnRBcyA9IHRoaXMuZ2V0SW1wb3J0QXMoYmFzZVN5bWJvbCwgdXNlU3VtbWFyaWVzKTtcbiAgICAgIHJldHVybiBiYXNlSW1wb3J0QXMgP1xuICAgICAgICAgIHRoaXMuZ2V0U3RhdGljU3ltYm9sKGJhc2VJbXBvcnRBcy5maWxlUGF0aCwgYmFzZUltcG9ydEFzLm5hbWUsIHN0YXRpY1N5bWJvbC5tZW1iZXJzKSA6XG4gICAgICAgICAgbnVsbDtcbiAgICB9XG4gICAgY29uc3Qgc3VtbWFyaXplZEZpbGVOYW1lID0gc3RyaXBTdW1tYXJ5Rm9ySml0RmlsZVN1ZmZpeChzdGF0aWNTeW1ib2wuZmlsZVBhdGgpO1xuICAgIGlmIChzdW1tYXJpemVkRmlsZU5hbWUgIT09IHN0YXRpY1N5bWJvbC5maWxlUGF0aCkge1xuICAgICAgY29uc3Qgc3VtbWFyaXplZE5hbWUgPSBzdHJpcFN1bW1hcnlGb3JKaXROYW1lU3VmZml4KHN0YXRpY1N5bWJvbC5uYW1lKTtcbiAgICAgIGNvbnN0IGJhc2VTeW1ib2wgPVxuICAgICAgICAgIHRoaXMuZ2V0U3RhdGljU3ltYm9sKHN1bW1hcml6ZWRGaWxlTmFtZSwgc3VtbWFyaXplZE5hbWUsIHN0YXRpY1N5bWJvbC5tZW1iZXJzKTtcbiAgICAgIGNvbnN0IGJhc2VJbXBvcnRBcyA9IHRoaXMuZ2V0SW1wb3J0QXMoYmFzZVN5bWJvbCwgdXNlU3VtbWFyaWVzKTtcbiAgICAgIHJldHVybiBiYXNlSW1wb3J0QXMgP1xuICAgICAgICAgIHRoaXMuZ2V0U3RhdGljU3ltYm9sKFxuICAgICAgICAgICAgICBzdW1tYXJ5Rm9ySml0RmlsZU5hbWUoYmFzZUltcG9ydEFzLmZpbGVQYXRoKSwgc3VtbWFyeUZvckppdE5hbWUoYmFzZUltcG9ydEFzLm5hbWUpLFxuICAgICAgICAgICAgICBiYXNlU3ltYm9sLm1lbWJlcnMpIDpcbiAgICAgICAgICBudWxsO1xuICAgIH1cbiAgICBsZXQgcmVzdWx0ID0gKHVzZVN1bW1hcmllcyAmJiB0aGlzLnN1bW1hcnlSZXNvbHZlci5nZXRJbXBvcnRBcyhzdGF0aWNTeW1ib2wpKSB8fCBudWxsO1xuICAgIGlmICghcmVzdWx0KSB7XG4gICAgICByZXN1bHQgPSB0aGlzLmltcG9ydEFzLmdldChzdGF0aWNTeW1ib2wpICE7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogZ2V0UmVzb3VyY2VQYXRoIHByb2R1Y2VzIHRoZSBwYXRoIHRvIHRoZSBvcmlnaW5hbCBsb2NhdGlvbiBvZiB0aGUgc3ltYm9sIGFuZCBzaG91bGRcbiAgICogYmUgdXNlZCB0byBkZXRlcm1pbmUgdGhlIHJlbGF0aXZlIGxvY2F0aW9uIG9mIHJlc291cmNlIHJlZmVyZW5jZXMgcmVjb3JkZWQgaW5cbiAgICogc3ltYm9sIG1ldGFkYXRhLlxuICAgKi9cbiAgZ2V0UmVzb3VyY2VQYXRoKHN0YXRpY1N5bWJvbDogU3RhdGljU3ltYm9sKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5zeW1ib2xSZXNvdXJjZVBhdGhzLmdldChzdGF0aWNTeW1ib2wpIHx8IHN0YXRpY1N5bWJvbC5maWxlUGF0aDtcbiAgfVxuXG4gIC8qKlxuICAgKiBnZXRUeXBlQXJpdHkgcmV0dXJucyB0aGUgbnVtYmVyIG9mIGdlbmVyaWMgdHlwZSBwYXJhbWV0ZXJzIHRoZSBnaXZlbiBzeW1ib2xcbiAgICogaGFzLiBJZiB0aGUgc3ltYm9sIGlzIG5vdCBhIHR5cGUgdGhlIHJlc3VsdCBpcyBudWxsLlxuICAgKi9cbiAgZ2V0VHlwZUFyaXR5KHN0YXRpY1N5bWJvbDogU3RhdGljU3ltYm9sKTogbnVtYmVyfG51bGwge1xuICAgIC8vIElmIHRoZSBmaWxlIGlzIGEgZmFjdG9yeS9uZ3N1bW1hcnkgZmlsZSwgZG9uJ3QgcmVzb2x2ZSB0aGUgc3ltYm9sIGFzIGRvaW5nIHNvIHdvdWxkXG4gICAgLy8gY2F1c2UgdGhlIG1ldGFkYXRhIGZvciBhbiBmYWN0b3J5L25nc3VtbWFyeSBmaWxlIHRvIGJlIGxvYWRlZCB3aGljaCBkb2Vzbid0IGV4aXN0LlxuICAgIC8vIEFsbCByZWZlcmVuY2VzIHRvIGdlbmVyYXRlZCBjbGFzc2VzIG11c3QgaW5jbHVkZSB0aGUgY29ycmVjdCBhcml0eSB3aGVuZXZlclxuICAgIC8vIGdlbmVyYXRpbmcgY29kZS5cbiAgICBpZiAoaXNHZW5lcmF0ZWRGaWxlKHN0YXRpY1N5bWJvbC5maWxlUGF0aCkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBsZXQgcmVzb2x2ZWRTeW1ib2wgPSB1bndyYXBSZXNvbHZlZE1ldGFkYXRhKHRoaXMucmVzb2x2ZVN5bWJvbChzdGF0aWNTeW1ib2wpKTtcbiAgICB3aGlsZSAocmVzb2x2ZWRTeW1ib2wgJiYgcmVzb2x2ZWRTeW1ib2wubWV0YWRhdGEgaW5zdGFuY2VvZiBTdGF0aWNTeW1ib2wpIHtcbiAgICAgIHJlc29sdmVkU3ltYm9sID0gdW53cmFwUmVzb2x2ZWRNZXRhZGF0YSh0aGlzLnJlc29sdmVTeW1ib2wocmVzb2x2ZWRTeW1ib2wubWV0YWRhdGEpKTtcbiAgICB9XG4gICAgcmV0dXJuIChyZXNvbHZlZFN5bWJvbCAmJiByZXNvbHZlZFN5bWJvbC5tZXRhZGF0YSAmJiByZXNvbHZlZFN5bWJvbC5tZXRhZGF0YS5hcml0eSkgfHwgbnVsbDtcbiAgfVxuXG4gIGdldEtub3duTW9kdWxlTmFtZShmaWxlUGF0aDogc3RyaW5nKTogc3RyaW5nfG51bGwge1xuICAgIHJldHVybiB0aGlzLmtub3duRmlsZU5hbWVUb01vZHVsZU5hbWVzLmdldChmaWxlUGF0aCkgfHwgbnVsbDtcbiAgfVxuXG4gIHJlY29yZEltcG9ydEFzKHNvdXJjZVN5bWJvbDogU3RhdGljU3ltYm9sLCB0YXJnZXRTeW1ib2w6IFN0YXRpY1N5bWJvbCkge1xuICAgIHNvdXJjZVN5bWJvbC5hc3NlcnROb01lbWJlcnMoKTtcbiAgICB0YXJnZXRTeW1ib2wuYXNzZXJ0Tm9NZW1iZXJzKCk7XG4gICAgdGhpcy5pbXBvcnRBcy5zZXQoc291cmNlU3ltYm9sLCB0YXJnZXRTeW1ib2wpO1xuICB9XG5cbiAgcmVjb3JkTW9kdWxlTmFtZUZvckZpbGVOYW1lKGZpbGVOYW1lOiBzdHJpbmcsIG1vZHVsZU5hbWU6IHN0cmluZykge1xuICAgIHRoaXMua25vd25GaWxlTmFtZVRvTW9kdWxlTmFtZXMuc2V0KGZpbGVOYW1lLCBtb2R1bGVOYW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnZhbGlkYXRlIGFsbCBpbmZvcm1hdGlvbiBkZXJpdmVkIGZyb20gdGhlIGdpdmVuIGZpbGUuXG4gICAqXG4gICAqIEBwYXJhbSBmaWxlTmFtZSB0aGUgZmlsZSB0byBpbnZhbGlkYXRlXG4gICAqL1xuICBpbnZhbGlkYXRlRmlsZShmaWxlTmFtZTogc3RyaW5nKSB7XG4gICAgdGhpcy5tZXRhZGF0YUNhY2hlLmRlbGV0ZShmaWxlTmFtZSk7XG4gICAgdGhpcy5yZXNvbHZlZEZpbGVQYXRocy5kZWxldGUoZmlsZU5hbWUpO1xuICAgIGNvbnN0IHN5bWJvbHMgPSB0aGlzLnN5bWJvbEZyb21GaWxlLmdldChmaWxlTmFtZSk7XG4gICAgaWYgKHN5bWJvbHMpIHtcbiAgICAgIHRoaXMuc3ltYm9sRnJvbUZpbGUuZGVsZXRlKGZpbGVOYW1lKTtcbiAgICAgIGZvciAoY29uc3Qgc3ltYm9sIG9mIHN5bWJvbHMpIHtcbiAgICAgICAgdGhpcy5yZXNvbHZlZFN5bWJvbHMuZGVsZXRlKHN5bWJvbCk7XG4gICAgICAgIHRoaXMuaW1wb3J0QXMuZGVsZXRlKHN5bWJvbCk7XG4gICAgICAgIHRoaXMuc3ltYm9sUmVzb3VyY2VQYXRocy5kZWxldGUoc3ltYm9sKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIGlnbm9yZUVycm9yc0ZvcjxUPihjYjogKCkgPT4gVCkge1xuICAgIGNvbnN0IHJlY29yZGVyID0gdGhpcy5lcnJvclJlY29yZGVyO1xuICAgIHRoaXMuZXJyb3JSZWNvcmRlciA9ICgpID0+IHt9O1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gY2IoKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5lcnJvclJlY29yZGVyID0gcmVjb3JkZXI7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfcmVzb2x2ZVN5bWJvbE1lbWJlcnMoc3RhdGljU3ltYm9sOiBTdGF0aWNTeW1ib2wpOiBSZXNvbHZlZFN0YXRpY1N5bWJvbHxudWxsIHtcbiAgICBjb25zdCBtZW1iZXJzID0gc3RhdGljU3ltYm9sLm1lbWJlcnM7XG4gICAgY29uc3QgYmFzZVJlc29sdmVkU3ltYm9sID1cbiAgICAgICAgdGhpcy5yZXNvbHZlU3ltYm9sKHRoaXMuZ2V0U3RhdGljU3ltYm9sKHN0YXRpY1N5bWJvbC5maWxlUGF0aCwgc3RhdGljU3ltYm9sLm5hbWUpKTtcbiAgICBpZiAoIWJhc2VSZXNvbHZlZFN5bWJvbCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGxldCBiYXNlTWV0YWRhdGEgPSB1bndyYXBSZXNvbHZlZE1ldGFkYXRhKGJhc2VSZXNvbHZlZFN5bWJvbC5tZXRhZGF0YSk7XG4gICAgaWYgKGJhc2VNZXRhZGF0YSBpbnN0YW5jZW9mIFN0YXRpY1N5bWJvbCkge1xuICAgICAgcmV0dXJuIG5ldyBSZXNvbHZlZFN0YXRpY1N5bWJvbChcbiAgICAgICAgICBzdGF0aWNTeW1ib2wsIHRoaXMuZ2V0U3RhdGljU3ltYm9sKGJhc2VNZXRhZGF0YS5maWxlUGF0aCwgYmFzZU1ldGFkYXRhLm5hbWUsIG1lbWJlcnMpKTtcbiAgICB9IGVsc2UgaWYgKGJhc2VNZXRhZGF0YSAmJiBiYXNlTWV0YWRhdGEuX19zeW1ib2xpYyA9PT0gJ2NsYXNzJykge1xuICAgICAgaWYgKGJhc2VNZXRhZGF0YS5zdGF0aWNzICYmIG1lbWJlcnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVzb2x2ZWRTdGF0aWNTeW1ib2woc3RhdGljU3ltYm9sLCBiYXNlTWV0YWRhdGEuc3RhdGljc1ttZW1iZXJzWzBdXSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCB2YWx1ZSA9IGJhc2VNZXRhZGF0YTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWVtYmVycy5sZW5ndGggJiYgdmFsdWU7IGkrKykge1xuICAgICAgICB2YWx1ZSA9IHZhbHVlW21lbWJlcnNbaV1dO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBSZXNvbHZlZFN0YXRpY1N5bWJvbChzdGF0aWNTeW1ib2wsIHZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBwcml2YXRlIF9yZXNvbHZlU3ltYm9sRnJvbVN1bW1hcnkoc3RhdGljU3ltYm9sOiBTdGF0aWNTeW1ib2wpOiBSZXNvbHZlZFN0YXRpY1N5bWJvbHxudWxsIHtcbiAgICBjb25zdCBzdW1tYXJ5ID0gdGhpcy5zdW1tYXJ5UmVzb2x2ZXIucmVzb2x2ZVN1bW1hcnkoc3RhdGljU3ltYm9sKTtcbiAgICByZXR1cm4gc3VtbWFyeSA/IG5ldyBSZXNvbHZlZFN0YXRpY1N5bWJvbChzdGF0aWNTeW1ib2wsIHN1bW1hcnkubWV0YWRhdGEpIDogbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBnZXRTdGF0aWNTeW1ib2wgcHJvZHVjZXMgYSBUeXBlIHdob3NlIG1ldGFkYXRhIGlzIGtub3duIGJ1dCB3aG9zZSBpbXBsZW1lbnRhdGlvbiBpcyBub3QgbG9hZGVkLlxuICAgKiBBbGwgdHlwZXMgcGFzc2VkIHRvIHRoZSBTdGF0aWNSZXNvbHZlciBzaG91bGQgYmUgcHNldWRvLXR5cGVzIHJldHVybmVkIGJ5IHRoaXMgbWV0aG9kLlxuICAgKlxuICAgKiBAcGFyYW0gZGVjbGFyYXRpb25GaWxlIHRoZSBhYnNvbHV0ZSBwYXRoIG9mIHRoZSBmaWxlIHdoZXJlIHRoZSBzeW1ib2wgaXMgZGVjbGFyZWRcbiAgICogQHBhcmFtIG5hbWUgdGhlIG5hbWUgb2YgdGhlIHR5cGUuXG4gICAqIEBwYXJhbSBtZW1iZXJzIGEgc3ltYm9sIGZvciBhIHN0YXRpYyBtZW1iZXIgb2YgdGhlIG5hbWVkIHR5cGVcbiAgICovXG4gIGdldFN0YXRpY1N5bWJvbChkZWNsYXJhdGlvbkZpbGU6IHN0cmluZywgbmFtZTogc3RyaW5nLCBtZW1iZXJzPzogc3RyaW5nW10pOiBTdGF0aWNTeW1ib2wge1xuICAgIHJldHVybiB0aGlzLnN0YXRpY1N5bWJvbENhY2hlLmdldChkZWNsYXJhdGlvbkZpbGUsIG5hbWUsIG1lbWJlcnMpO1xuICB9XG5cbiAgLyoqXG4gICAqIGhhc0RlY29yYXRvcnMgY2hlY2tzIGEgZmlsZSdzIG1ldGFkYXRhIGZvciB0aGUgcHJlc2VuY2Ugb2YgZGVjb3JhdG9ycyB3aXRob3V0IGV2YWx1YXRpbmcgdGhlXG4gICAqIG1ldGFkYXRhLlxuICAgKlxuICAgKiBAcGFyYW0gZmlsZVBhdGggdGhlIGFic29sdXRlIHBhdGggdG8gZXhhbWluZSBmb3IgZGVjb3JhdG9ycy5cbiAgICogQHJldHVybnMgdHJ1ZSBpZiBhbnkgY2xhc3MgaW4gdGhlIGZpbGUgaGFzIGEgZGVjb3JhdG9yLlxuICAgKi9cbiAgaGFzRGVjb3JhdG9ycyhmaWxlUGF0aDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgY29uc3QgbWV0YWRhdGEgPSB0aGlzLmdldE1vZHVsZU1ldGFkYXRhKGZpbGVQYXRoKTtcbiAgICBpZiAobWV0YWRhdGFbJ21ldGFkYXRhJ10pIHtcbiAgICAgIHJldHVybiBPYmplY3Qua2V5cyhtZXRhZGF0YVsnbWV0YWRhdGEnXSkuc29tZSgobWV0YWRhdGFLZXkpID0+IHtcbiAgICAgICAgY29uc3QgZW50cnkgPSBtZXRhZGF0YVsnbWV0YWRhdGEnXVttZXRhZGF0YUtleV07XG4gICAgICAgIHJldHVybiBlbnRyeSAmJiBlbnRyeS5fX3N5bWJvbGljID09PSAnY2xhc3MnICYmIGVudHJ5LmRlY29yYXRvcnM7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgZ2V0U3ltYm9sc09mKGZpbGVQYXRoOiBzdHJpbmcpOiBTdGF0aWNTeW1ib2xbXSB7XG4gICAgY29uc3Qgc3VtbWFyeVN5bWJvbHMgPSB0aGlzLnN1bW1hcnlSZXNvbHZlci5nZXRTeW1ib2xzT2YoZmlsZVBhdGgpO1xuICAgIGlmIChzdW1tYXJ5U3ltYm9scykge1xuICAgICAgcmV0dXJuIHN1bW1hcnlTeW1ib2xzO1xuICAgIH1cbiAgICAvLyBOb3RlOiBTb21lIHVzZXJzIHVzZSBsaWJyYXJpZXMgdGhhdCB3ZXJlIG5vdCBjb21waWxlZCB3aXRoIG5nYywgaS5lLiB0aGV5IGRvbid0XG4gICAgLy8gaGF2ZSBzdW1tYXJpZXMsIG9ubHkgLmQudHMgZmlsZXMsIGJ1dCBgc3VtbWFyeVJlc29sdmVyLmlzTGlicmFyeUZpbGVgIHJldHVybnMgdHJ1ZS5cbiAgICB0aGlzLl9jcmVhdGVTeW1ib2xzT2YoZmlsZVBhdGgpO1xuICAgIGNvbnN0IG1ldGFkYXRhU3ltYm9sczogU3RhdGljU3ltYm9sW10gPSBbXTtcbiAgICB0aGlzLnJlc29sdmVkU3ltYm9scy5mb3JFYWNoKChyZXNvbHZlZFN5bWJvbCkgPT4ge1xuICAgICAgaWYgKHJlc29sdmVkU3ltYm9sLnN5bWJvbC5maWxlUGF0aCA9PT0gZmlsZVBhdGgpIHtcbiAgICAgICAgbWV0YWRhdGFTeW1ib2xzLnB1c2gocmVzb2x2ZWRTeW1ib2wuc3ltYm9sKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gbWV0YWRhdGFTeW1ib2xzO1xuICB9XG5cbiAgcHJpdmF0ZSBfY3JlYXRlU3ltYm9sc09mKGZpbGVQYXRoOiBzdHJpbmcpIHtcbiAgICBpZiAodGhpcy5yZXNvbHZlZEZpbGVQYXRocy5oYXMoZmlsZVBhdGgpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMucmVzb2x2ZWRGaWxlUGF0aHMuYWRkKGZpbGVQYXRoKTtcbiAgICBjb25zdCByZXNvbHZlZFN5bWJvbHM6IFJlc29sdmVkU3RhdGljU3ltYm9sW10gPSBbXTtcbiAgICBjb25zdCBtZXRhZGF0YSA9IHRoaXMuZ2V0TW9kdWxlTWV0YWRhdGEoZmlsZVBhdGgpO1xuICAgIGlmIChtZXRhZGF0YVsnaW1wb3J0QXMnXSkge1xuICAgICAgLy8gSW5kZXggYnVuZGxlIGluZGljZXMgc2hvdWxkIHVzZSB0aGUgaW1wb3J0QXMgbW9kdWxlIG5hbWUgZGVmaW5lZFxuICAgICAgLy8gaW4gdGhlIGJ1bmRsZS5cbiAgICAgIHRoaXMua25vd25GaWxlTmFtZVRvTW9kdWxlTmFtZXMuc2V0KGZpbGVQYXRoLCBtZXRhZGF0YVsnaW1wb3J0QXMnXSk7XG4gICAgfVxuICAgIC8vIGhhbmRsZSB0aGUgc3ltYm9scyBpbiBvbmUgb2YgdGhlIHJlLWV4cG9ydCBsb2NhdGlvblxuICAgIGlmIChtZXRhZGF0YVsnZXhwb3J0cyddKSB7XG4gICAgICBmb3IgKGNvbnN0IG1vZHVsZUV4cG9ydCBvZiBtZXRhZGF0YVsnZXhwb3J0cyddKSB7XG4gICAgICAgIC8vIGhhbmRsZSB0aGUgc3ltYm9scyBpbiB0aGUgbGlzdCBvZiBleHBsaWNpdGx5IHJlLWV4cG9ydGVkIHN5bWJvbHMuXG4gICAgICAgIGlmIChtb2R1bGVFeHBvcnQuZXhwb3J0KSB7XG4gICAgICAgICAgbW9kdWxlRXhwb3J0LmV4cG9ydC5mb3JFYWNoKChleHBvcnRTeW1ib2w6IGFueSkgPT4ge1xuICAgICAgICAgICAgbGV0IHN5bWJvbE5hbWU6IHN0cmluZztcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZXhwb3J0U3ltYm9sID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICBzeW1ib2xOYW1lID0gZXhwb3J0U3ltYm9sO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgc3ltYm9sTmFtZSA9IGV4cG9ydFN5bWJvbC5hcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN5bWJvbE5hbWUgPSB1bmVzY2FwZUlkZW50aWZpZXIoc3ltYm9sTmFtZSk7XG4gICAgICAgICAgICBsZXQgc3ltTmFtZSA9IHN5bWJvbE5hbWU7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGV4cG9ydFN5bWJvbCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgc3ltTmFtZSA9IHVuZXNjYXBlSWRlbnRpZmllcihleHBvcnRTeW1ib2wubmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCByZXNvbHZlZE1vZHVsZSA9IHRoaXMucmVzb2x2ZU1vZHVsZShtb2R1bGVFeHBvcnQuZnJvbSwgZmlsZVBhdGgpO1xuICAgICAgICAgICAgaWYgKHJlc29sdmVkTW9kdWxlKSB7XG4gICAgICAgICAgICAgIGNvbnN0IHRhcmdldFN5bWJvbCA9IHRoaXMuZ2V0U3RhdGljU3ltYm9sKHJlc29sdmVkTW9kdWxlLCBzeW1OYW1lKTtcbiAgICAgICAgICAgICAgY29uc3Qgc291cmNlU3ltYm9sID0gdGhpcy5nZXRTdGF0aWNTeW1ib2woZmlsZVBhdGgsIHN5bWJvbE5hbWUpO1xuICAgICAgICAgICAgICByZXNvbHZlZFN5bWJvbHMucHVzaCh0aGlzLmNyZWF0ZUV4cG9ydChzb3VyY2VTeW1ib2wsIHRhcmdldFN5bWJvbCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIGhhbmRsZSB0aGUgc3ltYm9scyB2aWEgZXhwb3J0ICogZGlyZWN0aXZlcy5cbiAgICAgICAgICBjb25zdCByZXNvbHZlZE1vZHVsZSA9IHRoaXMucmVzb2x2ZU1vZHVsZShtb2R1bGVFeHBvcnQuZnJvbSwgZmlsZVBhdGgpO1xuICAgICAgICAgIGlmIChyZXNvbHZlZE1vZHVsZSkge1xuICAgICAgICAgICAgY29uc3QgbmVzdGVkRXhwb3J0cyA9IHRoaXMuZ2V0U3ltYm9sc09mKHJlc29sdmVkTW9kdWxlKTtcbiAgICAgICAgICAgIG5lc3RlZEV4cG9ydHMuZm9yRWFjaCgodGFyZ2V0U3ltYm9sKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IHNvdXJjZVN5bWJvbCA9IHRoaXMuZ2V0U3RhdGljU3ltYm9sKGZpbGVQYXRoLCB0YXJnZXRTeW1ib2wubmFtZSk7XG4gICAgICAgICAgICAgIHJlc29sdmVkU3ltYm9scy5wdXNoKHRoaXMuY3JlYXRlRXhwb3J0KHNvdXJjZVN5bWJvbCwgdGFyZ2V0U3ltYm9sKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBoYW5kbGUgdGhlIGFjdHVhbCBtZXRhZGF0YS4gSGFzIHRvIGJlIGFmdGVyIHRoZSBleHBvcnRzXG4gICAgLy8gYXMgdGhlcmUgbWlnaHQgYmUgY29sbGlzaW9ucyBpbiB0aGUgbmFtZXMsIGFuZCB3ZSB3YW50IHRoZSBzeW1ib2xzXG4gICAgLy8gb2YgdGhlIGN1cnJlbnQgbW9kdWxlIHRvIHdpbiBvZnRlciByZWV4cG9ydHMuXG4gICAgaWYgKG1ldGFkYXRhWydtZXRhZGF0YSddKSB7XG4gICAgICAvLyBoYW5kbGUgZGlyZWN0IGRlY2xhcmF0aW9ucyBvZiB0aGUgc3ltYm9sXG4gICAgICBjb25zdCB0b3BMZXZlbFN5bWJvbE5hbWVzID1cbiAgICAgICAgICBuZXcgU2V0PHN0cmluZz4oT2JqZWN0LmtleXMobWV0YWRhdGFbJ21ldGFkYXRhJ10pLm1hcCh1bmVzY2FwZUlkZW50aWZpZXIpKTtcbiAgICAgIGNvbnN0IG9yaWdpbnM6IHtbaW5kZXg6IHN0cmluZ106IHN0cmluZ30gPSBtZXRhZGF0YVsnb3JpZ2lucyddIHx8IHt9O1xuICAgICAgT2JqZWN0LmtleXMobWV0YWRhdGFbJ21ldGFkYXRhJ10pLmZvckVhY2goKG1ldGFkYXRhS2V5KSA9PiB7XG4gICAgICAgIGNvbnN0IHN5bWJvbE1ldGEgPSBtZXRhZGF0YVsnbWV0YWRhdGEnXVttZXRhZGF0YUtleV07XG4gICAgICAgIGNvbnN0IG5hbWUgPSB1bmVzY2FwZUlkZW50aWZpZXIobWV0YWRhdGFLZXkpO1xuXG4gICAgICAgIGNvbnN0IHN5bWJvbCA9IHRoaXMuZ2V0U3RhdGljU3ltYm9sKGZpbGVQYXRoLCBuYW1lKTtcblxuICAgICAgICBjb25zdCBvcmlnaW4gPSBvcmlnaW5zLmhhc093blByb3BlcnR5KG1ldGFkYXRhS2V5KSAmJiBvcmlnaW5zW21ldGFkYXRhS2V5XTtcbiAgICAgICAgaWYgKG9yaWdpbikge1xuICAgICAgICAgIC8vIElmIHRoZSBzeW1ib2wgaXMgZnJvbSBhIGJ1bmRsZWQgaW5kZXgsIHVzZSB0aGUgZGVjbGFyYXRpb24gbG9jYXRpb24gb2YgdGhlXG4gICAgICAgICAgLy8gc3ltYm9sIHNvIHJlbGF0aXZlIHJlZmVyZW5jZXMgKHN1Y2ggYXMgJy4vbXkuaHRtbCcpIHdpbGwgYmUgY2FsY3VsYXRlZFxuICAgICAgICAgIC8vIGNvcnJlY3RseS5cbiAgICAgICAgICBjb25zdCBvcmlnaW5GaWxlUGF0aCA9IHRoaXMucmVzb2x2ZU1vZHVsZShvcmlnaW4sIGZpbGVQYXRoKTtcbiAgICAgICAgICBpZiAoIW9yaWdpbkZpbGVQYXRoKSB7XG4gICAgICAgICAgICB0aGlzLnJlcG9ydEVycm9yKG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICBgQ291bGRuJ3QgcmVzb2x2ZSBvcmlnaW5hbCBzeW1ib2wgZm9yICR7b3JpZ2lufSBmcm9tICR7dGhpcy5ob3N0LmdldE91dHB1dE5hbWUoZmlsZVBhdGgpfWApKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zeW1ib2xSZXNvdXJjZVBhdGhzLnNldChzeW1ib2wsIG9yaWdpbkZpbGVQYXRoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmVzb2x2ZWRTeW1ib2xzLnB1c2goXG4gICAgICAgICAgICB0aGlzLmNyZWF0ZVJlc29sdmVkU3ltYm9sKHN5bWJvbCwgZmlsZVBhdGgsIHRvcExldmVsU3ltYm9sTmFtZXMsIHN5bWJvbE1ldGEpKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXNvbHZlZFN5bWJvbHMuZm9yRWFjaChcbiAgICAgICAgKHJlc29sdmVkU3ltYm9sKSA9PiB0aGlzLnJlc29sdmVkU3ltYm9scy5zZXQocmVzb2x2ZWRTeW1ib2wuc3ltYm9sLCByZXNvbHZlZFN5bWJvbCkpO1xuICAgIHRoaXMuc3ltYm9sRnJvbUZpbGUuc2V0KGZpbGVQYXRoLCByZXNvbHZlZFN5bWJvbHMubWFwKHJlc29sdmVkU3ltYm9sID0+IHJlc29sdmVkU3ltYm9sLnN5bWJvbCkpO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVSZXNvbHZlZFN5bWJvbChcbiAgICAgIHNvdXJjZVN5bWJvbDogU3RhdGljU3ltYm9sLCB0b3BMZXZlbFBhdGg6IHN0cmluZywgdG9wTGV2ZWxTeW1ib2xOYW1lczogU2V0PHN0cmluZz4sXG4gICAgICBtZXRhZGF0YTogYW55KTogUmVzb2x2ZWRTdGF0aWNTeW1ib2wge1xuICAgIC8vIEZvciBjbGFzc2VzIHRoYXQgZG9uJ3QgaGF2ZSBBbmd1bGFyIHN1bW1hcmllcyAvIG1ldGFkYXRhLFxuICAgIC8vIHdlIG9ubHkga2VlcCB0aGVpciBhcml0eSwgYnV0IG5vdGhpbmcgZWxzZVxuICAgIC8vIChlLmcuIHRoZWlyIGNvbnN0cnVjdG9yIHBhcmFtZXRlcnMpLlxuICAgIC8vIFdlIGRvIHRoaXMgdG8gcHJldmVudCBpbnRyb2R1Y2luZyBkZWVwIGltcG9ydHNcbiAgICAvLyBhcyB3ZSBkaWRuJ3QgZ2VuZXJhdGUgLm5nZmFjdG9yeS50cyBmaWxlcyB3aXRoIHByb3BlciByZWV4cG9ydHMuXG4gICAgY29uc3QgaXNUc0ZpbGUgPSBUUy50ZXN0KHNvdXJjZVN5bWJvbC5maWxlUGF0aCk7XG4gICAgaWYgKHRoaXMuc3VtbWFyeVJlc29sdmVyLmlzTGlicmFyeUZpbGUoc291cmNlU3ltYm9sLmZpbGVQYXRoKSAmJiAhaXNUc0ZpbGUgJiYgbWV0YWRhdGEgJiZcbiAgICAgICAgbWV0YWRhdGFbJ19fc3ltYm9saWMnXSA9PT0gJ2NsYXNzJykge1xuICAgICAgY29uc3QgdHJhbnNmb3JtZWRNZXRhID0ge19fc3ltYm9saWM6ICdjbGFzcycsIGFyaXR5OiBtZXRhZGF0YS5hcml0eX07XG4gICAgICByZXR1cm4gbmV3IFJlc29sdmVkU3RhdGljU3ltYm9sKHNvdXJjZVN5bWJvbCwgdHJhbnNmb3JtZWRNZXRhKTtcbiAgICB9XG5cbiAgICBsZXQgX29yaWdpbmFsRmlsZU1lbW86IHN0cmluZ3x1bmRlZmluZWQ7XG4gICAgY29uc3QgZ2V0T3JpZ2luYWxOYW1lOiAoKSA9PiBzdHJpbmcgPSAoKSA9PiB7XG4gICAgICBpZiAoIV9vcmlnaW5hbEZpbGVNZW1vKSB7XG4gICAgICAgIC8vIEd1ZXNzIHdoYXQgdGhlIG9yaWdpbmFsIGZpbGUgbmFtZSBpcyBmcm9tIHRoZSByZWZlcmVuY2UuIElmIGl0IGhhcyBhIGAuZC50c2AgZXh0ZW5zaW9uXG4gICAgICAgIC8vIHJlcGxhY2UgaXQgd2l0aCBgLnRzYC4gSWYgaXQgYWxyZWFkeSBoYXMgYC50c2AganVzdCBsZWF2ZSBpdCBpbiBwbGFjZS4gSWYgaXQgZG9lc24ndCBoYXZlXG4gICAgICAgIC8vIC50cyBvciAuZC50cywgYXBwZW5kIGAudHMnLiBBbHNvLCBpZiBpdCBpcyBpbiBgbm9kZV9tb2R1bGVzYCwgdHJpbSB0aGUgYG5vZGVfbW9kdWxlYFxuICAgICAgICAvLyBsb2NhdGlvbiBhcyBpdCBpcyBub3QgaW1wb3J0YW50IHRvIGZpbmRpbmcgdGhlIGZpbGUuXG4gICAgICAgIF9vcmlnaW5hbEZpbGVNZW1vID1cbiAgICAgICAgICAgIHRoaXMuaG9zdC5nZXRPdXRwdXROYW1lKHRvcExldmVsUGF0aC5yZXBsYWNlKC8oKFxcLnRzKXwoXFwuZFxcLnRzKXwpJC8sICcudHMnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9eLipub2RlX21vZHVsZXNbL1xcXFxdLywgJycpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBfb3JpZ2luYWxGaWxlTWVtbztcbiAgICB9O1xuXG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICBjbGFzcyBSZWZlcmVuY2VUcmFuc2Zvcm1lciBleHRlbmRzIFZhbHVlVHJhbnNmb3JtZXIge1xuICAgICAgdmlzaXRTdHJpbmdNYXAobWFwOiB7W2tleTogc3RyaW5nXTogYW55fSwgZnVuY3Rpb25QYXJhbXM6IHN0cmluZ1tdKTogYW55IHtcbiAgICAgICAgY29uc3Qgc3ltYm9saWMgPSBtYXBbJ19fc3ltYm9saWMnXTtcbiAgICAgICAgaWYgKHN5bWJvbGljID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgY29uc3Qgb2xkTGVuID0gZnVuY3Rpb25QYXJhbXMubGVuZ3RoO1xuICAgICAgICAgIGZ1bmN0aW9uUGFyYW1zLnB1c2goLi4uKG1hcFsncGFyYW1ldGVycyddIHx8IFtdKSk7XG4gICAgICAgICAgY29uc3QgcmVzdWx0ID0gc3VwZXIudmlzaXRTdHJpbmdNYXAobWFwLCBmdW5jdGlvblBhcmFtcyk7XG4gICAgICAgICAgZnVuY3Rpb25QYXJhbXMubGVuZ3RoID0gb2xkTGVuO1xuICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH0gZWxzZSBpZiAoc3ltYm9saWMgPT09ICdyZWZlcmVuY2UnKSB7XG4gICAgICAgICAgY29uc3QgbW9kdWxlID0gbWFwWydtb2R1bGUnXTtcbiAgICAgICAgICBjb25zdCBuYW1lID0gbWFwWyduYW1lJ10gPyB1bmVzY2FwZUlkZW50aWZpZXIobWFwWyduYW1lJ10pIDogbWFwWyduYW1lJ107XG4gICAgICAgICAgaWYgKCFuYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgICAgbGV0IGZpbGVQYXRoOiBzdHJpbmc7XG4gICAgICAgICAgaWYgKG1vZHVsZSkge1xuICAgICAgICAgICAgZmlsZVBhdGggPSBzZWxmLnJlc29sdmVNb2R1bGUobW9kdWxlLCBzb3VyY2VTeW1ib2wuZmlsZVBhdGgpICE7XG4gICAgICAgICAgICBpZiAoIWZpbGVQYXRoKSB7XG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgX19zeW1ib2xpYzogJ2Vycm9yJyxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOlxuICAgICAgICAgICAgICAgICAgICBgQ291bGQgbm90IHJlc29sdmUgJHttb2R1bGV9IHJlbGF0aXZlIHRvICR7c2VsZi5ob3N0LmdldE1ldGFkYXRhRm9yKHNvdXJjZVN5bWJvbC5maWxlUGF0aCl9LmAsXG4gICAgICAgICAgICAgICAgbGluZTogbWFwLmxpbmUsXG4gICAgICAgICAgICAgICAgY2hhcmFjdGVyOiBtYXAuY2hhcmFjdGVyLFxuICAgICAgICAgICAgICAgIGZpbGVOYW1lOiBnZXRPcmlnaW5hbE5hbWUoKVxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgX19zeW1ib2xpYzogJ3Jlc29sdmVkJyxcbiAgICAgICAgICAgICAgc3ltYm9sOiBzZWxmLmdldFN0YXRpY1N5bWJvbChmaWxlUGF0aCwgbmFtZSksXG4gICAgICAgICAgICAgIGxpbmU6IG1hcC5saW5lLFxuICAgICAgICAgICAgICBjaGFyYWN0ZXI6IG1hcC5jaGFyYWN0ZXIsXG4gICAgICAgICAgICAgIGZpbGVOYW1lOiBnZXRPcmlnaW5hbE5hbWUoKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGZ1bmN0aW9uUGFyYW1zLmluZGV4T2YobmFtZSkgPj0gMCkge1xuICAgICAgICAgICAgLy8gcmVmZXJlbmNlIHRvIGEgZnVuY3Rpb24gcGFyYW1ldGVyXG4gICAgICAgICAgICByZXR1cm4ge19fc3ltYm9saWM6ICdyZWZlcmVuY2UnLCBuYW1lOiBuYW1lfTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHRvcExldmVsU3ltYm9sTmFtZXMuaGFzKG5hbWUpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzZWxmLmdldFN0YXRpY1N5bWJvbCh0b3BMZXZlbFBhdGgsIG5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gYW1iaWVudCB2YWx1ZVxuICAgICAgICAgICAgbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoc3ltYm9saWMgPT09ICdlcnJvcicpIHtcbiAgICAgICAgICByZXR1cm4gey4uLm1hcCwgZmlsZU5hbWU6IGdldE9yaWdpbmFsTmFtZSgpfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gc3VwZXIudmlzaXRTdHJpbmdNYXAobWFwLCBmdW5jdGlvblBhcmFtcyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgdHJhbnNmb3JtZWRNZXRhID0gdmlzaXRWYWx1ZShtZXRhZGF0YSwgbmV3IFJlZmVyZW5jZVRyYW5zZm9ybWVyKCksIFtdKTtcbiAgICBsZXQgdW53cmFwcGVkVHJhbnNmb3JtZWRNZXRhID0gdW53cmFwUmVzb2x2ZWRNZXRhZGF0YSh0cmFuc2Zvcm1lZE1ldGEpO1xuICAgIGlmICh1bndyYXBwZWRUcmFuc2Zvcm1lZE1ldGEgaW5zdGFuY2VvZiBTdGF0aWNTeW1ib2wpIHtcbiAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUV4cG9ydChzb3VyY2VTeW1ib2wsIHVud3JhcHBlZFRyYW5zZm9ybWVkTWV0YSk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgUmVzb2x2ZWRTdGF0aWNTeW1ib2woc291cmNlU3ltYm9sLCB0cmFuc2Zvcm1lZE1ldGEpO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVFeHBvcnQoc291cmNlU3ltYm9sOiBTdGF0aWNTeW1ib2wsIHRhcmdldFN5bWJvbDogU3RhdGljU3ltYm9sKTpcbiAgICAgIFJlc29sdmVkU3RhdGljU3ltYm9sIHtcbiAgICBzb3VyY2VTeW1ib2wuYXNzZXJ0Tm9NZW1iZXJzKCk7XG4gICAgdGFyZ2V0U3ltYm9sLmFzc2VydE5vTWVtYmVycygpO1xuICAgIGlmICh0aGlzLnN1bW1hcnlSZXNvbHZlci5pc0xpYnJhcnlGaWxlKHNvdXJjZVN5bWJvbC5maWxlUGF0aCkgJiZcbiAgICAgICAgdGhpcy5zdW1tYXJ5UmVzb2x2ZXIuaXNMaWJyYXJ5RmlsZSh0YXJnZXRTeW1ib2wuZmlsZVBhdGgpKSB7XG4gICAgICAvLyBUaGlzIGNhc2UgaXMgZm9yIGFuIG5nIGxpYnJhcnkgaW1wb3J0aW5nIHN5bWJvbHMgZnJvbSBhIHBsYWluIHRzIGxpYnJhcnlcbiAgICAgIC8vIHRyYW5zaXRpdmVseS5cbiAgICAgIC8vIE5vdGU6IFdlIHJlbHkgb24gdGhlIGZhY3QgdGhhdCB3ZSBkaXNjb3ZlciBzeW1ib2xzIGluIHRoZSBkaXJlY3Rpb25cbiAgICAgIC8vIGZyb20gc291cmNlIGZpbGVzIHRvIGxpYnJhcnkgZmlsZXNcbiAgICAgIHRoaXMuaW1wb3J0QXMuc2V0KHRhcmdldFN5bWJvbCwgdGhpcy5nZXRJbXBvcnRBcyhzb3VyY2VTeW1ib2wpIHx8IHNvdXJjZVN5bWJvbCk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgUmVzb2x2ZWRTdGF0aWNTeW1ib2woc291cmNlU3ltYm9sLCB0YXJnZXRTeW1ib2wpO1xuICB9XG5cbiAgcHJpdmF0ZSByZXBvcnRFcnJvcihlcnJvcjogRXJyb3IsIGNvbnRleHQ/OiBTdGF0aWNTeW1ib2wsIHBhdGg/OiBzdHJpbmcpIHtcbiAgICBpZiAodGhpcy5lcnJvclJlY29yZGVyKSB7XG4gICAgICB0aGlzLmVycm9yUmVjb3JkZXIoZXJyb3IsIChjb250ZXh0ICYmIGNvbnRleHQuZmlsZVBhdGgpIHx8IHBhdGgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIG1vZHVsZSBhbiBhYnNvbHV0ZSBwYXRoIHRvIGEgbW9kdWxlIGZpbGUuXG4gICAqL1xuICBwcml2YXRlIGdldE1vZHVsZU1ldGFkYXRhKG1vZHVsZTogc3RyaW5nKToge1trZXk6IHN0cmluZ106IGFueX0ge1xuICAgIGxldCBtb2R1bGVNZXRhZGF0YSA9IHRoaXMubWV0YWRhdGFDYWNoZS5nZXQobW9kdWxlKTtcbiAgICBpZiAoIW1vZHVsZU1ldGFkYXRhKSB7XG4gICAgICBjb25zdCBtb2R1bGVNZXRhZGF0YXMgPSB0aGlzLmhvc3QuZ2V0TWV0YWRhdGFGb3IobW9kdWxlKTtcbiAgICAgIGlmIChtb2R1bGVNZXRhZGF0YXMpIHtcbiAgICAgICAgbGV0IG1heFZlcnNpb24gPSAtMTtcbiAgICAgICAgbW9kdWxlTWV0YWRhdGFzLmZvckVhY2goKG1kKSA9PiB7XG4gICAgICAgICAgaWYgKG1kICYmIG1kWyd2ZXJzaW9uJ10gPiBtYXhWZXJzaW9uKSB7XG4gICAgICAgICAgICBtYXhWZXJzaW9uID0gbWRbJ3ZlcnNpb24nXTtcbiAgICAgICAgICAgIG1vZHVsZU1ldGFkYXRhID0gbWQ7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGlmICghbW9kdWxlTWV0YWRhdGEpIHtcbiAgICAgICAgbW9kdWxlTWV0YWRhdGEgPVxuICAgICAgICAgICAge19fc3ltYm9saWM6ICdtb2R1bGUnLCB2ZXJzaW9uOiBTVVBQT1JURURfU0NIRU1BX1ZFUlNJT04sIG1vZHVsZTogbW9kdWxlLCBtZXRhZGF0YToge319O1xuICAgICAgfVxuICAgICAgaWYgKG1vZHVsZU1ldGFkYXRhWyd2ZXJzaW9uJ10gIT0gU1VQUE9SVEVEX1NDSEVNQV9WRVJTSU9OKSB7XG4gICAgICAgIGNvbnN0IGVycm9yTWVzc2FnZSA9IG1vZHVsZU1ldGFkYXRhWyd2ZXJzaW9uJ10gPT0gMiA/XG4gICAgICAgICAgICBgVW5zdXBwb3J0ZWQgbWV0YWRhdGEgdmVyc2lvbiAke21vZHVsZU1ldGFkYXRhWyd2ZXJzaW9uJ119IGZvciBtb2R1bGUgJHttb2R1bGV9LiBUaGlzIG1vZHVsZSBzaG91bGQgYmUgY29tcGlsZWQgd2l0aCBhIG5ld2VyIHZlcnNpb24gb2YgbmdjYCA6XG4gICAgICAgICAgICBgTWV0YWRhdGEgdmVyc2lvbiBtaXNtYXRjaCBmb3IgbW9kdWxlICR7dGhpcy5ob3N0LmdldE91dHB1dE5hbWUobW9kdWxlKX0sIGZvdW5kIHZlcnNpb24gJHttb2R1bGVNZXRhZGF0YVsndmVyc2lvbiddfSwgZXhwZWN0ZWQgJHtTVVBQT1JURURfU0NIRU1BX1ZFUlNJT059YDtcbiAgICAgICAgdGhpcy5yZXBvcnRFcnJvcihuZXcgRXJyb3IoZXJyb3JNZXNzYWdlKSk7XG4gICAgICB9XG4gICAgICB0aGlzLm1ldGFkYXRhQ2FjaGUuc2V0KG1vZHVsZSwgbW9kdWxlTWV0YWRhdGEpO1xuICAgIH1cbiAgICByZXR1cm4gbW9kdWxlTWV0YWRhdGE7XG4gIH1cblxuXG4gIGdldFN5bWJvbEJ5TW9kdWxlKG1vZHVsZTogc3RyaW5nLCBzeW1ib2xOYW1lOiBzdHJpbmcsIGNvbnRhaW5pbmdGaWxlPzogc3RyaW5nKTogU3RhdGljU3ltYm9sIHtcbiAgICBjb25zdCBmaWxlUGF0aCA9IHRoaXMucmVzb2x2ZU1vZHVsZShtb2R1bGUsIGNvbnRhaW5pbmdGaWxlKTtcbiAgICBpZiAoIWZpbGVQYXRoKSB7XG4gICAgICB0aGlzLnJlcG9ydEVycm9yKFxuICAgICAgICAgIG5ldyBFcnJvcihgQ291bGQgbm90IHJlc29sdmUgbW9kdWxlICR7bW9kdWxlfSR7Y29udGFpbmluZ0ZpbGUgPyAnIHJlbGF0aXZlIHRvICcgK1xuICAgICAgICAgICAgdGhpcy5ob3N0LmdldE91dHB1dE5hbWUoY29udGFpbmluZ0ZpbGUpIDogJyd9YCkpO1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0U3RhdGljU3ltYm9sKGBFUlJPUjoke21vZHVsZX1gLCBzeW1ib2xOYW1lKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZ2V0U3RhdGljU3ltYm9sKGZpbGVQYXRoLCBzeW1ib2xOYW1lKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVzb2x2ZU1vZHVsZShtb2R1bGU6IHN0cmluZywgY29udGFpbmluZ0ZpbGU/OiBzdHJpbmcpOiBzdHJpbmd8bnVsbCB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiB0aGlzLmhvc3QubW9kdWxlTmFtZVRvRmlsZU5hbWUobW9kdWxlLCBjb250YWluaW5nRmlsZSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcihgQ291bGQgbm90IHJlc29sdmUgbW9kdWxlICcke21vZHVsZX0nIHJlbGF0aXZlIHRvIGZpbGUgJHtjb250YWluaW5nRmlsZX1gKTtcbiAgICAgIHRoaXMucmVwb3J0RXJyb3IoZSwgdW5kZWZpbmVkLCBjb250YWluaW5nRmlsZSk7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbi8vIFJlbW92ZSBleHRyYSB1bmRlcnNjb3JlIGZyb20gZXNjYXBlZCBpZGVudGlmaWVyLlxuLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9NaWNyb3NvZnQvVHlwZVNjcmlwdC9ibG9iL21hc3Rlci9zcmMvY29tcGlsZXIvdXRpbGl0aWVzLnRzXG5leHBvcnQgZnVuY3Rpb24gdW5lc2NhcGVJZGVudGlmaWVyKGlkZW50aWZpZXI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBpZGVudGlmaWVyLnN0YXJ0c1dpdGgoJ19fXycpID8gaWRlbnRpZmllci5zdWJzdHIoMSkgOiBpZGVudGlmaWVyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdW53cmFwUmVzb2x2ZWRNZXRhZGF0YShtZXRhZGF0YTogYW55KTogYW55IHtcbiAgaWYgKG1ldGFkYXRhICYmIG1ldGFkYXRhLl9fc3ltYm9saWMgPT09ICdyZXNvbHZlZCcpIHtcbiAgICByZXR1cm4gbWV0YWRhdGEuc3ltYm9sO1xuICB9XG4gIHJldHVybiBtZXRhZGF0YTtcbn1cbiJdfQ==
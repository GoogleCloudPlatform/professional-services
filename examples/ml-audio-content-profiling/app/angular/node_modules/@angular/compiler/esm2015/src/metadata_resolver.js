/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { StaticSymbol } from './aot/static_symbol';
import { ngfactoryFilePath } from './aot/util';
import { assertArrayOfStrings, assertInterpolationSymbols } from './assertions';
import * as cpl from './compile_metadata';
import { ChangeDetectionStrategy, Type, ViewEncapsulation, createAttribute, createComponent, createHost, createInject, createInjectable, createInjectionToken, createNgModule, createOptional, createSelf, createSkipSelf } from './core';
import { findLast } from './directive_resolver';
import { Identifiers } from './identifiers';
import { getAllLifecycleHooks } from './lifecycle_reflector';
import { CssSelector } from './selector';
import { SyncAsync, ValueTransformer, isPromise, noUndefined, resolveForwardRef, stringify, syntaxError, visitValue } from './util';
export const ERROR_COMPONENT_TYPE = 'ngComponentType';
// Design notes:
// - don't lazily create metadata:
//   For some metadata, we need to do async work sometimes,
//   so the user has to kick off this loading.
//   But we want to report errors even when the async work is
//   not required to check that the user would have been able
//   to wait correctly.
export class CompileMetadataResolver {
    constructor(_config, _htmlParser, _ngModuleResolver, _directiveResolver, _pipeResolver, _summaryResolver, _schemaRegistry, _directiveNormalizer, _console, _staticSymbolCache, _reflector, _errorCollector) {
        this._config = _config;
        this._htmlParser = _htmlParser;
        this._ngModuleResolver = _ngModuleResolver;
        this._directiveResolver = _directiveResolver;
        this._pipeResolver = _pipeResolver;
        this._summaryResolver = _summaryResolver;
        this._schemaRegistry = _schemaRegistry;
        this._directiveNormalizer = _directiveNormalizer;
        this._console = _console;
        this._staticSymbolCache = _staticSymbolCache;
        this._reflector = _reflector;
        this._errorCollector = _errorCollector;
        this._nonNormalizedDirectiveCache = new Map();
        this._directiveCache = new Map();
        this._summaryCache = new Map();
        this._pipeCache = new Map();
        this._ngModuleCache = new Map();
        this._ngModuleOfTypes = new Map();
        this._shallowModuleCache = new Map();
    }
    getReflector() { return this._reflector; }
    clearCacheFor(type) {
        const dirMeta = this._directiveCache.get(type);
        this._directiveCache.delete(type);
        this._nonNormalizedDirectiveCache.delete(type);
        this._summaryCache.delete(type);
        this._pipeCache.delete(type);
        this._ngModuleOfTypes.delete(type);
        // Clear all of the NgModule as they contain transitive information!
        this._ngModuleCache.clear();
        if (dirMeta) {
            this._directiveNormalizer.clearCacheFor(dirMeta);
        }
    }
    clearCache() {
        this._directiveCache.clear();
        this._nonNormalizedDirectiveCache.clear();
        this._summaryCache.clear();
        this._pipeCache.clear();
        this._ngModuleCache.clear();
        this._ngModuleOfTypes.clear();
        this._directiveNormalizer.clearCache();
    }
    _createProxyClass(baseType, name) {
        let delegate = null;
        const proxyClass = function () {
            if (!delegate) {
                throw new Error(`Illegal state: Class ${name} for type ${stringify(baseType)} is not compiled yet!`);
            }
            return delegate.apply(this, arguments);
        };
        proxyClass.setDelegate = (d) => {
            delegate = d;
            proxyClass.prototype = d.prototype;
        };
        // Make stringify work correctly
        proxyClass.overriddenName = name;
        return proxyClass;
    }
    getGeneratedClass(dirType, name) {
        if (dirType instanceof StaticSymbol) {
            return this._staticSymbolCache.get(ngfactoryFilePath(dirType.filePath), name);
        }
        else {
            return this._createProxyClass(dirType, name);
        }
    }
    getComponentViewClass(dirType) {
        return this.getGeneratedClass(dirType, cpl.viewClassName(dirType, 0));
    }
    getHostComponentViewClass(dirType) {
        return this.getGeneratedClass(dirType, cpl.hostViewClassName(dirType));
    }
    getHostComponentType(dirType) {
        const name = `${cpl.identifierName({ reference: dirType })}_Host`;
        if (dirType instanceof StaticSymbol) {
            return this._staticSymbolCache.get(dirType.filePath, name);
        }
        return this._createProxyClass(dirType, name);
    }
    getRendererType(dirType) {
        if (dirType instanceof StaticSymbol) {
            return this._staticSymbolCache.get(ngfactoryFilePath(dirType.filePath), cpl.rendererTypeName(dirType));
        }
        else {
            // returning an object as proxy,
            // that we fill later during runtime compilation.
            return {};
        }
    }
    getComponentFactory(selector, dirType, inputs, outputs) {
        if (dirType instanceof StaticSymbol) {
            return this._staticSymbolCache.get(ngfactoryFilePath(dirType.filePath), cpl.componentFactoryName(dirType));
        }
        else {
            const hostView = this.getHostComponentViewClass(dirType);
            // Note: ngContentSelectors will be filled later once the template is
            // loaded.
            const createComponentFactory = this._reflector.resolveExternalReference(Identifiers.createComponentFactory);
            return createComponentFactory(selector, dirType, hostView, inputs, outputs, []);
        }
    }
    initComponentFactory(factory, ngContentSelectors) {
        if (!(factory instanceof StaticSymbol)) {
            factory.ngContentSelectors.push(...ngContentSelectors);
        }
    }
    _loadSummary(type, kind) {
        let typeSummary = this._summaryCache.get(type);
        if (!typeSummary) {
            const summary = this._summaryResolver.resolveSummary(type);
            typeSummary = summary ? summary.type : null;
            this._summaryCache.set(type, typeSummary || null);
        }
        return typeSummary && typeSummary.summaryKind === kind ? typeSummary : null;
    }
    getHostComponentMetadata(compMeta, hostViewType) {
        const hostType = this.getHostComponentType(compMeta.type.reference);
        if (!hostViewType) {
            hostViewType = this.getHostComponentViewClass(hostType);
        }
        // Note: ! is ok here as this method should only be called with normalized directive
        // metadata, which always fills in the selector.
        const template = CssSelector.parse(compMeta.selector)[0].getMatchingElementTemplate();
        const templateUrl = '';
        const htmlAst = this._htmlParser.parse(template, templateUrl);
        return cpl.CompileDirectiveMetadata.create({
            isHost: true,
            type: { reference: hostType, diDeps: [], lifecycleHooks: [] },
            template: new cpl.CompileTemplateMetadata({
                encapsulation: ViewEncapsulation.None,
                template,
                templateUrl,
                htmlAst,
                styles: [],
                styleUrls: [],
                ngContentSelectors: [],
                animations: [],
                isInline: true,
                externalStylesheets: [],
                interpolation: null,
                preserveWhitespaces: false,
            }),
            exportAs: null,
            changeDetection: ChangeDetectionStrategy.Default,
            inputs: [],
            outputs: [],
            host: {},
            isComponent: true,
            selector: '*',
            providers: [],
            viewProviders: [],
            queries: [],
            guards: {},
            viewQueries: [],
            componentViewType: hostViewType,
            rendererType: { id: '__Host__', encapsulation: ViewEncapsulation.None, styles: [], data: {} },
            entryComponents: [],
            componentFactory: null
        });
    }
    loadDirectiveMetadata(ngModuleType, directiveType, isSync) {
        if (this._directiveCache.has(directiveType)) {
            return null;
        }
        directiveType = resolveForwardRef(directiveType);
        const { annotation, metadata } = this.getNonNormalizedDirectiveMetadata(directiveType);
        const createDirectiveMetadata = (templateMetadata) => {
            const normalizedDirMeta = new cpl.CompileDirectiveMetadata({
                isHost: false,
                type: metadata.type,
                isComponent: metadata.isComponent,
                selector: metadata.selector,
                exportAs: metadata.exportAs,
                changeDetection: metadata.changeDetection,
                inputs: metadata.inputs,
                outputs: metadata.outputs,
                hostListeners: metadata.hostListeners,
                hostProperties: metadata.hostProperties,
                hostAttributes: metadata.hostAttributes,
                providers: metadata.providers,
                viewProviders: metadata.viewProviders,
                queries: metadata.queries,
                guards: metadata.guards,
                viewQueries: metadata.viewQueries,
                entryComponents: metadata.entryComponents,
                componentViewType: metadata.componentViewType,
                rendererType: metadata.rendererType,
                componentFactory: metadata.componentFactory,
                template: templateMetadata
            });
            if (templateMetadata) {
                this.initComponentFactory(metadata.componentFactory, templateMetadata.ngContentSelectors);
            }
            this._directiveCache.set(directiveType, normalizedDirMeta);
            this._summaryCache.set(directiveType, normalizedDirMeta.toSummary());
            return null;
        };
        if (metadata.isComponent) {
            const template = metadata.template;
            const templateMeta = this._directiveNormalizer.normalizeTemplate({
                ngModuleType,
                componentType: directiveType,
                moduleUrl: this._reflector.componentModuleUrl(directiveType, annotation),
                encapsulation: template.encapsulation,
                template: template.template,
                templateUrl: template.templateUrl,
                styles: template.styles,
                styleUrls: template.styleUrls,
                animations: template.animations,
                interpolation: template.interpolation,
                preserveWhitespaces: template.preserveWhitespaces
            });
            if (isPromise(templateMeta) && isSync) {
                this._reportError(componentStillLoadingError(directiveType), directiveType);
                return null;
            }
            return SyncAsync.then(templateMeta, createDirectiveMetadata);
        }
        else {
            // directive
            createDirectiveMetadata(null);
            return null;
        }
    }
    getNonNormalizedDirectiveMetadata(directiveType) {
        directiveType = resolveForwardRef(directiveType);
        if (!directiveType) {
            return null;
        }
        let cacheEntry = this._nonNormalizedDirectiveCache.get(directiveType);
        if (cacheEntry) {
            return cacheEntry;
        }
        const dirMeta = this._directiveResolver.resolve(directiveType, false);
        if (!dirMeta) {
            return null;
        }
        let nonNormalizedTemplateMetadata = undefined;
        if (createComponent.isTypeOf(dirMeta)) {
            // component
            const compMeta = dirMeta;
            assertArrayOfStrings('styles', compMeta.styles);
            assertArrayOfStrings('styleUrls', compMeta.styleUrls);
            assertInterpolationSymbols('interpolation', compMeta.interpolation);
            const animations = compMeta.animations;
            nonNormalizedTemplateMetadata = new cpl.CompileTemplateMetadata({
                encapsulation: noUndefined(compMeta.encapsulation),
                template: noUndefined(compMeta.template),
                templateUrl: noUndefined(compMeta.templateUrl),
                htmlAst: null,
                styles: compMeta.styles || [],
                styleUrls: compMeta.styleUrls || [],
                animations: animations || [],
                interpolation: noUndefined(compMeta.interpolation),
                isInline: !!compMeta.template,
                externalStylesheets: [],
                ngContentSelectors: [],
                preserveWhitespaces: noUndefined(dirMeta.preserveWhitespaces),
            });
        }
        let changeDetectionStrategy = null;
        let viewProviders = [];
        let entryComponentMetadata = [];
        let selector = dirMeta.selector;
        if (createComponent.isTypeOf(dirMeta)) {
            // Component
            const compMeta = dirMeta;
            changeDetectionStrategy = compMeta.changeDetection;
            if (compMeta.viewProviders) {
                viewProviders = this._getProvidersMetadata(compMeta.viewProviders, entryComponentMetadata, `viewProviders for "${stringifyType(directiveType)}"`, [], directiveType);
            }
            if (compMeta.entryComponents) {
                entryComponentMetadata = flattenAndDedupeArray(compMeta.entryComponents)
                    .map((type) => this._getEntryComponentMetadata(type))
                    .concat(entryComponentMetadata);
            }
            if (!selector) {
                selector = this._schemaRegistry.getDefaultComponentElementName();
            }
        }
        else {
            // Directive
            if (!selector) {
                this._reportError(syntaxError(`Directive ${stringifyType(directiveType)} has no selector, please add it!`), directiveType);
                selector = 'error';
            }
        }
        let providers = [];
        if (dirMeta.providers != null) {
            providers = this._getProvidersMetadata(dirMeta.providers, entryComponentMetadata, `providers for "${stringifyType(directiveType)}"`, [], directiveType);
        }
        let queries = [];
        let viewQueries = [];
        if (dirMeta.queries != null) {
            queries = this._getQueriesMetadata(dirMeta.queries, false, directiveType);
            viewQueries = this._getQueriesMetadata(dirMeta.queries, true, directiveType);
        }
        const metadata = cpl.CompileDirectiveMetadata.create({
            isHost: false,
            selector: selector,
            exportAs: noUndefined(dirMeta.exportAs),
            isComponent: !!nonNormalizedTemplateMetadata,
            type: this._getTypeMetadata(directiveType),
            template: nonNormalizedTemplateMetadata,
            changeDetection: changeDetectionStrategy,
            inputs: dirMeta.inputs || [],
            outputs: dirMeta.outputs || [],
            host: dirMeta.host || {},
            providers: providers || [],
            viewProviders: viewProviders || [],
            queries: queries || [],
            guards: dirMeta.guards || {},
            viewQueries: viewQueries || [],
            entryComponents: entryComponentMetadata,
            componentViewType: nonNormalizedTemplateMetadata ? this.getComponentViewClass(directiveType) :
                null,
            rendererType: nonNormalizedTemplateMetadata ? this.getRendererType(directiveType) : null,
            componentFactory: null
        });
        if (nonNormalizedTemplateMetadata) {
            metadata.componentFactory =
                this.getComponentFactory(selector, directiveType, metadata.inputs, metadata.outputs);
        }
        cacheEntry = { metadata, annotation: dirMeta };
        this._nonNormalizedDirectiveCache.set(directiveType, cacheEntry);
        return cacheEntry;
    }
    /**
     * Gets the metadata for the given directive.
     * This assumes `loadNgModuleDirectiveAndPipeMetadata` has been called first.
     */
    getDirectiveMetadata(directiveType) {
        const dirMeta = this._directiveCache.get(directiveType);
        if (!dirMeta) {
            this._reportError(syntaxError(`Illegal state: getDirectiveMetadata can only be called after loadNgModuleDirectiveAndPipeMetadata for a module that declares it. Directive ${stringifyType(directiveType)}.`), directiveType);
        }
        return dirMeta;
    }
    getDirectiveSummary(dirType) {
        const dirSummary = this._loadSummary(dirType, cpl.CompileSummaryKind.Directive);
        if (!dirSummary) {
            this._reportError(syntaxError(`Illegal state: Could not load the summary for directive ${stringifyType(dirType)}.`), dirType);
        }
        return dirSummary;
    }
    isDirective(type) {
        return !!this._loadSummary(type, cpl.CompileSummaryKind.Directive) ||
            this._directiveResolver.isDirective(type);
    }
    isPipe(type) {
        return !!this._loadSummary(type, cpl.CompileSummaryKind.Pipe) ||
            this._pipeResolver.isPipe(type);
    }
    isNgModule(type) {
        return !!this._loadSummary(type, cpl.CompileSummaryKind.NgModule) ||
            this._ngModuleResolver.isNgModule(type);
    }
    getNgModuleSummary(moduleType, alreadyCollecting = null) {
        let moduleSummary = this._loadSummary(moduleType, cpl.CompileSummaryKind.NgModule);
        if (!moduleSummary) {
            const moduleMeta = this.getNgModuleMetadata(moduleType, false, alreadyCollecting);
            moduleSummary = moduleMeta ? moduleMeta.toSummary() : null;
            if (moduleSummary) {
                this._summaryCache.set(moduleType, moduleSummary);
            }
        }
        return moduleSummary;
    }
    /**
     * Loads the declared directives and pipes of an NgModule.
     */
    loadNgModuleDirectiveAndPipeMetadata(moduleType, isSync, throwIfNotFound = true) {
        const ngModule = this.getNgModuleMetadata(moduleType, throwIfNotFound);
        const loading = [];
        if (ngModule) {
            ngModule.declaredDirectives.forEach((id) => {
                const promise = this.loadDirectiveMetadata(moduleType, id.reference, isSync);
                if (promise) {
                    loading.push(promise);
                }
            });
            ngModule.declaredPipes.forEach((id) => this._loadPipeMetadata(id.reference));
        }
        return Promise.all(loading);
    }
    getShallowModuleMetadata(moduleType) {
        let compileMeta = this._shallowModuleCache.get(moduleType);
        if (compileMeta) {
            return compileMeta;
        }
        const ngModuleMeta = findLast(this._reflector.shallowAnnotations(moduleType), createNgModule.isTypeOf);
        compileMeta = {
            type: this._getTypeMetadata(moduleType),
            rawExports: ngModuleMeta.exports,
            rawImports: ngModuleMeta.imports,
            rawProviders: ngModuleMeta.providers,
        };
        this._shallowModuleCache.set(moduleType, compileMeta);
        return compileMeta;
    }
    getNgModuleMetadata(moduleType, throwIfNotFound = true, alreadyCollecting = null) {
        moduleType = resolveForwardRef(moduleType);
        let compileMeta = this._ngModuleCache.get(moduleType);
        if (compileMeta) {
            return compileMeta;
        }
        const meta = this._ngModuleResolver.resolve(moduleType, throwIfNotFound);
        if (!meta) {
            return null;
        }
        const declaredDirectives = [];
        const exportedNonModuleIdentifiers = [];
        const declaredPipes = [];
        const importedModules = [];
        const exportedModules = [];
        const providers = [];
        const entryComponents = [];
        const bootstrapComponents = [];
        const schemas = [];
        if (meta.imports) {
            flattenAndDedupeArray(meta.imports).forEach((importedType) => {
                let importedModuleType = undefined;
                if (isValidType(importedType)) {
                    importedModuleType = importedType;
                }
                else if (importedType && importedType.ngModule) {
                    const moduleWithProviders = importedType;
                    importedModuleType = moduleWithProviders.ngModule;
                    if (moduleWithProviders.providers) {
                        providers.push(...this._getProvidersMetadata(moduleWithProviders.providers, entryComponents, `provider for the NgModule '${stringifyType(importedModuleType)}'`, [], importedType));
                    }
                }
                if (importedModuleType) {
                    if (this._checkSelfImport(moduleType, importedModuleType))
                        return;
                    if (!alreadyCollecting)
                        alreadyCollecting = new Set();
                    if (alreadyCollecting.has(importedModuleType)) {
                        this._reportError(syntaxError(`${this._getTypeDescriptor(importedModuleType)} '${stringifyType(importedType)}' is imported recursively by the module '${stringifyType(moduleType)}'.`), moduleType);
                        return;
                    }
                    alreadyCollecting.add(importedModuleType);
                    const importedModuleSummary = this.getNgModuleSummary(importedModuleType, alreadyCollecting);
                    alreadyCollecting.delete(importedModuleType);
                    if (!importedModuleSummary) {
                        this._reportError(syntaxError(`Unexpected ${this._getTypeDescriptor(importedType)} '${stringifyType(importedType)}' imported by the module '${stringifyType(moduleType)}'. Please add a @NgModule annotation.`), moduleType);
                        return;
                    }
                    importedModules.push(importedModuleSummary);
                }
                else {
                    this._reportError(syntaxError(`Unexpected value '${stringifyType(importedType)}' imported by the module '${stringifyType(moduleType)}'`), moduleType);
                    return;
                }
            });
        }
        if (meta.exports) {
            flattenAndDedupeArray(meta.exports).forEach((exportedType) => {
                if (!isValidType(exportedType)) {
                    this._reportError(syntaxError(`Unexpected value '${stringifyType(exportedType)}' exported by the module '${stringifyType(moduleType)}'`), moduleType);
                    return;
                }
                if (!alreadyCollecting)
                    alreadyCollecting = new Set();
                if (alreadyCollecting.has(exportedType)) {
                    this._reportError(syntaxError(`${this._getTypeDescriptor(exportedType)} '${stringify(exportedType)}' is exported recursively by the module '${stringifyType(moduleType)}'`), moduleType);
                    return;
                }
                alreadyCollecting.add(exportedType);
                const exportedModuleSummary = this.getNgModuleSummary(exportedType, alreadyCollecting);
                alreadyCollecting.delete(exportedType);
                if (exportedModuleSummary) {
                    exportedModules.push(exportedModuleSummary);
                }
                else {
                    exportedNonModuleIdentifiers.push(this._getIdentifierMetadata(exportedType));
                }
            });
        }
        // Note: This will be modified later, so we rely on
        // getting a new instance every time!
        const transitiveModule = this._getTransitiveNgModuleMetadata(importedModules, exportedModules);
        if (meta.declarations) {
            flattenAndDedupeArray(meta.declarations).forEach((declaredType) => {
                if (!isValidType(declaredType)) {
                    this._reportError(syntaxError(`Unexpected value '${stringifyType(declaredType)}' declared by the module '${stringifyType(moduleType)}'`), moduleType);
                    return;
                }
                const declaredIdentifier = this._getIdentifierMetadata(declaredType);
                if (this.isDirective(declaredType)) {
                    transitiveModule.addDirective(declaredIdentifier);
                    declaredDirectives.push(declaredIdentifier);
                    this._addTypeToModule(declaredType, moduleType);
                }
                else if (this.isPipe(declaredType)) {
                    transitiveModule.addPipe(declaredIdentifier);
                    transitiveModule.pipes.push(declaredIdentifier);
                    declaredPipes.push(declaredIdentifier);
                    this._addTypeToModule(declaredType, moduleType);
                }
                else {
                    this._reportError(syntaxError(`Unexpected ${this._getTypeDescriptor(declaredType)} '${stringifyType(declaredType)}' declared by the module '${stringifyType(moduleType)}'. Please add a @Pipe/@Directive/@Component annotation.`), moduleType);
                    return;
                }
            });
        }
        const exportedDirectives = [];
        const exportedPipes = [];
        exportedNonModuleIdentifiers.forEach((exportedId) => {
            if (transitiveModule.directivesSet.has(exportedId.reference)) {
                exportedDirectives.push(exportedId);
                transitiveModule.addExportedDirective(exportedId);
            }
            else if (transitiveModule.pipesSet.has(exportedId.reference)) {
                exportedPipes.push(exportedId);
                transitiveModule.addExportedPipe(exportedId);
            }
            else {
                this._reportError(syntaxError(`Can't export ${this._getTypeDescriptor(exportedId.reference)} ${stringifyType(exportedId.reference)} from ${stringifyType(moduleType)} as it was neither declared nor imported!`), moduleType);
                return;
            }
        });
        // The providers of the module have to go last
        // so that they overwrite any other provider we already added.
        if (meta.providers) {
            providers.push(...this._getProvidersMetadata(meta.providers, entryComponents, `provider for the NgModule '${stringifyType(moduleType)}'`, [], moduleType));
        }
        if (meta.entryComponents) {
            entryComponents.push(...flattenAndDedupeArray(meta.entryComponents)
                .map(type => this._getEntryComponentMetadata(type)));
        }
        if (meta.bootstrap) {
            flattenAndDedupeArray(meta.bootstrap).forEach(type => {
                if (!isValidType(type)) {
                    this._reportError(syntaxError(`Unexpected value '${stringifyType(type)}' used in the bootstrap property of module '${stringifyType(moduleType)}'`), moduleType);
                    return;
                }
                bootstrapComponents.push(this._getIdentifierMetadata(type));
            });
        }
        entryComponents.push(...bootstrapComponents.map(type => this._getEntryComponentMetadata(type.reference)));
        if (meta.schemas) {
            schemas.push(...flattenAndDedupeArray(meta.schemas));
        }
        compileMeta = new cpl.CompileNgModuleMetadata({
            type: this._getTypeMetadata(moduleType),
            providers,
            entryComponents,
            bootstrapComponents,
            schemas,
            declaredDirectives,
            exportedDirectives,
            declaredPipes,
            exportedPipes,
            importedModules,
            exportedModules,
            transitiveModule,
            id: meta.id || null,
        });
        entryComponents.forEach((id) => transitiveModule.addEntryComponent(id));
        providers.forEach((provider) => transitiveModule.addProvider(provider, compileMeta.type));
        transitiveModule.addModule(compileMeta.type);
        this._ngModuleCache.set(moduleType, compileMeta);
        return compileMeta;
    }
    _checkSelfImport(moduleType, importedModuleType) {
        if (moduleType === importedModuleType) {
            this._reportError(syntaxError(`'${stringifyType(moduleType)}' module can't import itself`), moduleType);
            return true;
        }
        return false;
    }
    _getTypeDescriptor(type) {
        if (isValidType(type)) {
            if (this.isDirective(type)) {
                return 'directive';
            }
            if (this.isPipe(type)) {
                return 'pipe';
            }
            if (this.isNgModule(type)) {
                return 'module';
            }
        }
        if (type.provide) {
            return 'provider';
        }
        return 'value';
    }
    _addTypeToModule(type, moduleType) {
        const oldModule = this._ngModuleOfTypes.get(type);
        if (oldModule && oldModule !== moduleType) {
            this._reportError(syntaxError(`Type ${stringifyType(type)} is part of the declarations of 2 modules: ${stringifyType(oldModule)} and ${stringifyType(moduleType)}! ` +
                `Please consider moving ${stringifyType(type)} to a higher module that imports ${stringifyType(oldModule)} and ${stringifyType(moduleType)}. ` +
                `You can also create a new NgModule that exports and includes ${stringifyType(type)} then import that NgModule in ${stringifyType(oldModule)} and ${stringifyType(moduleType)}.`), moduleType);
            return;
        }
        this._ngModuleOfTypes.set(type, moduleType);
    }
    _getTransitiveNgModuleMetadata(importedModules, exportedModules) {
        // collect `providers` / `entryComponents` from all imported and all exported modules
        const result = new cpl.TransitiveCompileNgModuleMetadata();
        const modulesByToken = new Map();
        importedModules.concat(exportedModules).forEach((modSummary) => {
            modSummary.modules.forEach((mod) => result.addModule(mod));
            modSummary.entryComponents.forEach((comp) => result.addEntryComponent(comp));
            const addedTokens = new Set();
            modSummary.providers.forEach((entry) => {
                const tokenRef = cpl.tokenReference(entry.provider.token);
                let prevModules = modulesByToken.get(tokenRef);
                if (!prevModules) {
                    prevModules = new Set();
                    modulesByToken.set(tokenRef, prevModules);
                }
                const moduleRef = entry.module.reference;
                // Note: the providers of one module may still contain multiple providers
                // per token (e.g. for multi providers), and we need to preserve these.
                if (addedTokens.has(tokenRef) || !prevModules.has(moduleRef)) {
                    prevModules.add(moduleRef);
                    addedTokens.add(tokenRef);
                    result.addProvider(entry.provider, entry.module);
                }
            });
        });
        exportedModules.forEach((modSummary) => {
            modSummary.exportedDirectives.forEach((id) => result.addExportedDirective(id));
            modSummary.exportedPipes.forEach((id) => result.addExportedPipe(id));
        });
        importedModules.forEach((modSummary) => {
            modSummary.exportedDirectives.forEach((id) => result.addDirective(id));
            modSummary.exportedPipes.forEach((id) => result.addPipe(id));
        });
        return result;
    }
    _getIdentifierMetadata(type) {
        type = resolveForwardRef(type);
        return { reference: type };
    }
    isInjectable(type) {
        const annotations = this._reflector.tryAnnotations(type);
        return annotations.some(ann => createInjectable.isTypeOf(ann));
    }
    getInjectableSummary(type) {
        return {
            summaryKind: cpl.CompileSummaryKind.Injectable,
            type: this._getTypeMetadata(type, null, false)
        };
    }
    getInjectableMetadata(type, dependencies = null, throwOnUnknownDeps = true) {
        const typeSummary = this._loadSummary(type, cpl.CompileSummaryKind.Injectable);
        const typeMetadata = typeSummary ?
            typeSummary.type :
            this._getTypeMetadata(type, dependencies, throwOnUnknownDeps);
        const annotations = this._reflector.annotations(type).filter(ann => createInjectable.isTypeOf(ann));
        if (annotations.length === 0) {
            return null;
        }
        const meta = annotations[annotations.length - 1];
        return {
            symbol: type,
            type: typeMetadata,
            providedIn: meta.providedIn,
            useValue: meta.useValue,
            useClass: meta.useClass,
            useExisting: meta.useExisting,
            useFactory: meta.useFactory,
            deps: meta.deps,
        };
    }
    _getTypeMetadata(type, dependencies = null, throwOnUnknownDeps = true) {
        const identifier = this._getIdentifierMetadata(type);
        return {
            reference: identifier.reference,
            diDeps: this._getDependenciesMetadata(identifier.reference, dependencies, throwOnUnknownDeps),
            lifecycleHooks: getAllLifecycleHooks(this._reflector, identifier.reference),
        };
    }
    _getFactoryMetadata(factory, dependencies = null) {
        factory = resolveForwardRef(factory);
        return { reference: factory, diDeps: this._getDependenciesMetadata(factory, dependencies) };
    }
    /**
     * Gets the metadata for the given pipe.
     * This assumes `loadNgModuleDirectiveAndPipeMetadata` has been called first.
     */
    getPipeMetadata(pipeType) {
        const pipeMeta = this._pipeCache.get(pipeType);
        if (!pipeMeta) {
            this._reportError(syntaxError(`Illegal state: getPipeMetadata can only be called after loadNgModuleDirectiveAndPipeMetadata for a module that declares it. Pipe ${stringifyType(pipeType)}.`), pipeType);
        }
        return pipeMeta || null;
    }
    getPipeSummary(pipeType) {
        const pipeSummary = this._loadSummary(pipeType, cpl.CompileSummaryKind.Pipe);
        if (!pipeSummary) {
            this._reportError(syntaxError(`Illegal state: Could not load the summary for pipe ${stringifyType(pipeType)}.`), pipeType);
        }
        return pipeSummary;
    }
    getOrLoadPipeMetadata(pipeType) {
        let pipeMeta = this._pipeCache.get(pipeType);
        if (!pipeMeta) {
            pipeMeta = this._loadPipeMetadata(pipeType);
        }
        return pipeMeta;
    }
    _loadPipeMetadata(pipeType) {
        pipeType = resolveForwardRef(pipeType);
        const pipeAnnotation = this._pipeResolver.resolve(pipeType);
        const pipeMeta = new cpl.CompilePipeMetadata({
            type: this._getTypeMetadata(pipeType),
            name: pipeAnnotation.name,
            pure: !!pipeAnnotation.pure
        });
        this._pipeCache.set(pipeType, pipeMeta);
        this._summaryCache.set(pipeType, pipeMeta.toSummary());
        return pipeMeta;
    }
    _getDependenciesMetadata(typeOrFunc, dependencies, throwOnUnknownDeps = true) {
        let hasUnknownDeps = false;
        const params = dependencies || this._reflector.parameters(typeOrFunc) || [];
        const dependenciesMetadata = params.map((param) => {
            let isAttribute = false;
            let isHost = false;
            let isSelf = false;
            let isSkipSelf = false;
            let isOptional = false;
            let token = null;
            if (Array.isArray(param)) {
                param.forEach((paramEntry) => {
                    if (createHost.isTypeOf(paramEntry)) {
                        isHost = true;
                    }
                    else if (createSelf.isTypeOf(paramEntry)) {
                        isSelf = true;
                    }
                    else if (createSkipSelf.isTypeOf(paramEntry)) {
                        isSkipSelf = true;
                    }
                    else if (createOptional.isTypeOf(paramEntry)) {
                        isOptional = true;
                    }
                    else if (createAttribute.isTypeOf(paramEntry)) {
                        isAttribute = true;
                        token = paramEntry.attributeName;
                    }
                    else if (createInject.isTypeOf(paramEntry)) {
                        token = paramEntry.token;
                    }
                    else if (createInjectionToken.isTypeOf(paramEntry) || paramEntry instanceof StaticSymbol) {
                        token = paramEntry;
                    }
                    else if (isValidType(paramEntry) && token == null) {
                        token = paramEntry;
                    }
                });
            }
            else {
                token = param;
            }
            if (token == null) {
                hasUnknownDeps = true;
                return null;
            }
            return {
                isAttribute,
                isHost,
                isSelf,
                isSkipSelf,
                isOptional,
                token: this._getTokenMetadata(token)
            };
        });
        if (hasUnknownDeps) {
            const depsTokens = dependenciesMetadata.map((dep) => dep ? stringifyType(dep.token) : '?').join(', ');
            const message = `Can't resolve all parameters for ${stringifyType(typeOrFunc)}: (${depsTokens}).`;
            if (throwOnUnknownDeps || this._config.strictInjectionParameters) {
                this._reportError(syntaxError(message), typeOrFunc);
            }
            else {
                this._console.warn(`Warning: ${message} This will become an error in Angular v6.x`);
            }
        }
        return dependenciesMetadata;
    }
    _getTokenMetadata(token) {
        token = resolveForwardRef(token);
        let compileToken;
        if (typeof token === 'string') {
            compileToken = { value: token };
        }
        else {
            compileToken = { identifier: { reference: token } };
        }
        return compileToken;
    }
    _getProvidersMetadata(providers, targetEntryComponents, debugInfo, compileProviders = [], type) {
        providers.forEach((provider, providerIdx) => {
            if (Array.isArray(provider)) {
                this._getProvidersMetadata(provider, targetEntryComponents, debugInfo, compileProviders);
            }
            else {
                provider = resolveForwardRef(provider);
                let providerMeta = undefined;
                if (provider && typeof provider === 'object' && provider.hasOwnProperty('provide')) {
                    this._validateProvider(provider);
                    providerMeta = new cpl.ProviderMeta(provider.provide, provider);
                }
                else if (isValidType(provider)) {
                    providerMeta = new cpl.ProviderMeta(provider, { useClass: provider });
                }
                else if (provider === void 0) {
                    this._reportError(syntaxError(`Encountered undefined provider! Usually this means you have a circular dependencies. This might be caused by using 'barrel' index.ts files.`));
                    return;
                }
                else {
                    const providersInfo = providers.reduce((soFar, seenProvider, seenProviderIdx) => {
                        if (seenProviderIdx < providerIdx) {
                            soFar.push(`${stringifyType(seenProvider)}`);
                        }
                        else if (seenProviderIdx == providerIdx) {
                            soFar.push(`?${stringifyType(seenProvider)}?`);
                        }
                        else if (seenProviderIdx == providerIdx + 1) {
                            soFar.push('...');
                        }
                        return soFar;
                    }, [])
                        .join(', ');
                    this._reportError(syntaxError(`Invalid ${debugInfo ? debugInfo : 'provider'} - only instances of Provider and Type are allowed, got: [${providersInfo}]`), type);
                    return;
                }
                if (providerMeta.token ===
                    this._reflector.resolveExternalReference(Identifiers.ANALYZE_FOR_ENTRY_COMPONENTS)) {
                    targetEntryComponents.push(...this._getEntryComponentsFromProvider(providerMeta, type));
                }
                else {
                    compileProviders.push(this.getProviderMetadata(providerMeta));
                }
            }
        });
        return compileProviders;
    }
    _validateProvider(provider) {
        if (provider.hasOwnProperty('useClass') && provider.useClass == null) {
            this._reportError(syntaxError(`Invalid provider for ${stringifyType(provider.provide)}. useClass cannot be ${provider.useClass}.
           Usually it happens when:
           1. There's a circular dependency (might be caused by using index.ts (barrel) files).
           2. Class was used before it was declared. Use forwardRef in this case.`));
        }
    }
    _getEntryComponentsFromProvider(provider, type) {
        const components = [];
        const collectedIdentifiers = [];
        if (provider.useFactory || provider.useExisting || provider.useClass) {
            this._reportError(syntaxError(`The ANALYZE_FOR_ENTRY_COMPONENTS token only supports useValue!`), type);
            return [];
        }
        if (!provider.multi) {
            this._reportError(syntaxError(`The ANALYZE_FOR_ENTRY_COMPONENTS token only supports 'multi = true'!`), type);
            return [];
        }
        extractIdentifiers(provider.useValue, collectedIdentifiers);
        collectedIdentifiers.forEach((identifier) => {
            const entry = this._getEntryComponentMetadata(identifier.reference, false);
            if (entry) {
                components.push(entry);
            }
        });
        return components;
    }
    _getEntryComponentMetadata(dirType, throwIfNotFound = true) {
        const dirMeta = this.getNonNormalizedDirectiveMetadata(dirType);
        if (dirMeta && dirMeta.metadata.isComponent) {
            return { componentType: dirType, componentFactory: dirMeta.metadata.componentFactory };
        }
        const dirSummary = this._loadSummary(dirType, cpl.CompileSummaryKind.Directive);
        if (dirSummary && dirSummary.isComponent) {
            return { componentType: dirType, componentFactory: dirSummary.componentFactory };
        }
        if (throwIfNotFound) {
            throw syntaxError(`${dirType.name} cannot be used as an entry component.`);
        }
        return null;
    }
    _getInjectableTypeMetadata(type, dependencies = null) {
        const typeSummary = this._loadSummary(type, cpl.CompileSummaryKind.Injectable);
        if (typeSummary) {
            return typeSummary.type;
        }
        return this._getTypeMetadata(type, dependencies);
    }
    getProviderMetadata(provider) {
        let compileDeps = undefined;
        let compileTypeMetadata = null;
        let compileFactoryMetadata = null;
        let token = this._getTokenMetadata(provider.token);
        if (provider.useClass) {
            compileTypeMetadata =
                this._getInjectableTypeMetadata(provider.useClass, provider.dependencies);
            compileDeps = compileTypeMetadata.diDeps;
            if (provider.token === provider.useClass) {
                // use the compileTypeMetadata as it contains information about lifecycleHooks...
                token = { identifier: compileTypeMetadata };
            }
        }
        else if (provider.useFactory) {
            compileFactoryMetadata = this._getFactoryMetadata(provider.useFactory, provider.dependencies);
            compileDeps = compileFactoryMetadata.diDeps;
        }
        return {
            token: token,
            useClass: compileTypeMetadata,
            useValue: provider.useValue,
            useFactory: compileFactoryMetadata,
            useExisting: provider.useExisting ? this._getTokenMetadata(provider.useExisting) : undefined,
            deps: compileDeps,
            multi: provider.multi
        };
    }
    _getQueriesMetadata(queries, isViewQuery, directiveType) {
        const res = [];
        Object.keys(queries).forEach((propertyName) => {
            const query = queries[propertyName];
            if (query.isViewQuery === isViewQuery) {
                res.push(this._getQueryMetadata(query, propertyName, directiveType));
            }
        });
        return res;
    }
    _queryVarBindings(selector) { return selector.split(/\s*,\s*/); }
    _getQueryMetadata(q, propertyName, typeOrFunc) {
        let selectors;
        if (typeof q.selector === 'string') {
            selectors =
                this._queryVarBindings(q.selector).map(varName => this._getTokenMetadata(varName));
        }
        else {
            if (!q.selector) {
                this._reportError(syntaxError(`Can't construct a query for the property "${propertyName}" of "${stringifyType(typeOrFunc)}" since the query selector wasn't defined.`), typeOrFunc);
                selectors = [];
            }
            else {
                selectors = [this._getTokenMetadata(q.selector)];
            }
        }
        return {
            selectors,
            first: q.first,
            descendants: q.descendants, propertyName,
            read: q.read ? this._getTokenMetadata(q.read) : null
        };
    }
    _reportError(error, type, otherType) {
        if (this._errorCollector) {
            this._errorCollector(error, type);
            if (otherType) {
                this._errorCollector(error, otherType);
            }
        }
        else {
            throw error;
        }
    }
}
function flattenArray(tree, out = []) {
    if (tree) {
        for (let i = 0; i < tree.length; i++) {
            const item = resolveForwardRef(tree[i]);
            if (Array.isArray(item)) {
                flattenArray(item, out);
            }
            else {
                out.push(item);
            }
        }
    }
    return out;
}
function dedupeArray(array) {
    if (array) {
        return Array.from(new Set(array));
    }
    return [];
}
function flattenAndDedupeArray(tree) {
    return dedupeArray(flattenArray(tree));
}
function isValidType(value) {
    return (value instanceof StaticSymbol) || (value instanceof Type);
}
function extractIdentifiers(value, targetIdentifiers) {
    visitValue(value, new _CompileValueConverter(), targetIdentifiers);
}
class _CompileValueConverter extends ValueTransformer {
    visitOther(value, targetIdentifiers) {
        targetIdentifiers.push({ reference: value });
    }
}
function stringifyType(type) {
    if (type instanceof StaticSymbol) {
        return `${type.name} in ${type.filePath}`;
    }
    else {
        return stringify(type);
    }
}
/**
 * Indicates that a component is still being loaded in a synchronous compile.
 */
function componentStillLoadingError(compType) {
    const error = Error(`Can't compile synchronously as ${stringify(compType)} is still being loaded!`);
    error[ERROR_COMPONENT_TYPE] = compType;
    return error;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YWRhdGFfcmVzb2x2ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci9zcmMvbWV0YWRhdGFfcmVzb2x2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFlBQVksRUFBb0IsTUFBTSxxQkFBcUIsQ0FBQztBQUNwRSxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFDN0MsT0FBTyxFQUFDLG9CQUFvQixFQUFFLDBCQUEwQixFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQzlFLE9BQU8sS0FBSyxHQUFHLE1BQU0sb0JBQW9CLENBQUM7QUFHMUMsT0FBTyxFQUFDLHVCQUF1QixFQUEwRixJQUFJLEVBQUUsaUJBQWlCLEVBQUUsZUFBZSxFQUFFLGVBQWUsRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFFLGdCQUFnQixFQUFFLG9CQUFvQixFQUFFLGNBQWMsRUFBRSxjQUFjLEVBQUUsVUFBVSxFQUFFLGNBQWMsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUVoVSxPQUFPLEVBQW9CLFFBQVEsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ2pFLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDMUMsT0FBTyxFQUFDLG9CQUFvQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFLM0QsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUV2QyxPQUFPLEVBQVUsU0FBUyxFQUFFLGdCQUFnQixFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsaUJBQWlCLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFJM0ksTUFBTSxDQUFDLE1BQU0sb0JBQW9CLEdBQUcsaUJBQWlCLENBQUM7QUFFdEQsZ0JBQWdCO0FBQ2hCLGtDQUFrQztBQUNsQywyREFBMkQ7QUFDM0QsOENB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N0IsT0FBTyxDQUFDLEtBQUssWUFBWSxZQUFZLENBQUMsSUFBSSxDQUFDLEtBQUssWUFBWSxJQUFJLENBQUMsQ0FBQztBQUNwRSxDQUFDO0FBRUQsU0FBUyxrQkFBa0IsQ0FBQyxLQUFVLEVBQUUsaUJBQWtEO0lBQ3hGLFVBQVUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxzQkFBc0IsRUFBRSxFQUFFLGlCQUFpQixDQUFDLENBQUM7QUFDckUsQ0FBQztBQUVELE1BQU0sc0JBQXVCLFNBQVEsZ0JBQWdCO0lBQ25ELFVBQVUsQ0FBQyxLQUFVLEVBQUUsaUJBQWtEO1FBQ3ZFLGlCQUFpQixDQUFDLElBQUksQ0FBQyxFQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUMsQ0FBQyxDQUFDO0lBQzdDLENBQUM7Q0FDRjtBQUVELFNBQVMsYUFBYSxDQUFDLElBQVM7SUFDOUIsSUFBSSxJQUFJLFlBQVksWUFBWSxFQUFFO1FBQ2hDLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxPQUFPLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztLQUMzQztTQUFNO1FBQ0wsT0FBTyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDeEI7QUFDSCxDQUFDO0FBRUQ7O0dBRUc7QUFDSCxTQUFTLDBCQUEwQixDQUFDLFFBQWM7SUFDaEQsTUFBTSxLQUFLLEdBQ1AsS0FBSyxDQUFDLGtDQUFrQyxTQUFTLENBQUMsUUFBUSxDQUFDLHlCQUF5QixDQUFDLENBQUM7SUFDekYsS0FBYSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsUUFBUSxDQUFDO0lBQ2hELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtTdGF0aWNTeW1ib2wsIFN0YXRpY1N5bWJvbENhY2hlfSBmcm9tICcuL2FvdC9zdGF0aWNfc3ltYm9sJztcbmltcG9ydCB7bmdmYWN0b3J5RmlsZVBhdGh9IGZyb20gJy4vYW90L3V0aWwnO1xuaW1wb3J0IHthc3NlcnRBcnJheU9mU3RyaW5ncywgYXNzZXJ0SW50ZXJwb2xhdGlvblN5bWJvbHN9IGZyb20gJy4vYXNzZXJ0aW9ucyc7XG5pbXBvcnQgKiBhcyBjcGwgZnJvbSAnLi9jb21waWxlX21ldGFkYXRhJztcbmltcG9ydCB7Q29tcGlsZVJlZmxlY3Rvcn0gZnJvbSAnLi9jb21waWxlX3JlZmxlY3Rvcic7XG5pbXBvcnQge0NvbXBpbGVyQ29uZmlnfSBmcm9tICcuL2NvbmZpZyc7XG5pbXBvcnQge0NoYW5nZURldGVjdGlvblN0cmF0ZWd5LCBDb21wb25lbnQsIERpcmVjdGl2ZSwgSW5qZWN0YWJsZSwgTW9kdWxlV2l0aFByb3ZpZGVycywgUHJvdmlkZXIsIFF1ZXJ5LCBTY2hlbWFNZXRhZGF0YSwgVHlwZSwgVmlld0VuY2Fwc3VsYXRpb24sIGNyZWF0ZUF0dHJpYnV0ZSwgY3JlYXRlQ29tcG9uZW50LCBjcmVhdGVIb3N0LCBjcmVhdGVJbmplY3QsIGNyZWF0ZUluamVjdGFibGUsIGNyZWF0ZUluamVjdGlvblRva2VuLCBjcmVhdGVOZ01vZHVsZSwgY3JlYXRlT3B0aW9uYWwsIGNyZWF0ZVNlbGYsIGNyZWF0ZVNraXBTZWxmfSBmcm9tICcuL2NvcmUnO1xuaW1wb3J0IHtEaXJlY3RpdmVOb3JtYWxpemVyfSBmcm9tICcuL2RpcmVjdGl2ZV9ub3JtYWxpemVyJztcbmltcG9ydCB7RGlyZWN0aXZlUmVzb2x2ZXIsIGZpbmRMYXN0fSBmcm9tICcuL2RpcmVjdGl2ZV9yZXNvbHZlcic7XG5pbXBvcnQge0lkZW50aWZpZXJzfSBmcm9tICcuL2lkZW50aWZpZXJzJztcbmltcG9ydCB7Z2V0QWxsTGlmZWN5Y2xlSG9va3N9IGZyb20gJy4vbGlmZWN5Y2xlX3JlZmxlY3Rvcic7XG5pbXBvcnQge0h0bWxQYXJzZXJ9IGZyb20gJy4vbWxfcGFyc2VyL2h0bWxfcGFyc2VyJztcbmltcG9ydCB7TmdNb2R1bGVSZXNvbHZlcn0gZnJvbSAnLi9uZ19tb2R1bGVfcmVzb2x2ZXInO1xuaW1wb3J0IHtQaXBlUmVzb2x2ZXJ9IGZyb20gJy4vcGlwZV9yZXNvbHZlcic7XG5pbXBvcnQge0VsZW1lbnRTY2hlbWFSZWdpc3RyeX0gZnJvbSAnLi9zY2hlbWEvZWxlbWVudF9zY2hlbWFfcmVnaXN0cnknO1xuaW1wb3J0IHtDc3NTZWxlY3Rvcn0gZnJvbSAnLi9zZWxlY3Rvcic7XG5pbXBvcnQge1N1bW1hcnlSZXNvbHZlcn0gZnJvbSAnLi9zdW1tYXJ5X3Jlc29sdmVyJztcbmltcG9ydCB7Q29uc29sZSwgU3luY0FzeW5jLCBWYWx1ZVRyYW5zZm9ybWVyLCBpc1Byb21pc2UsIG5vVW5kZWZpbmVkLCByZXNvbHZlRm9yd2FyZFJlZiwgc3RyaW5naWZ5LCBzeW50YXhFcnJvciwgdmlzaXRWYWx1ZX0gZnJvbSAnLi91dGlsJztcblxuZXhwb3J0IHR5cGUgRXJyb3JDb2xsZWN0b3IgPSAoZXJyb3I6IGFueSwgdHlwZT86IGFueSkgPT4gdm9pZDtcblxuZXhwb3J0IGNvbnN0IEVSUk9SX0NPTVBPTkVOVF9UWVBFID0gJ25nQ29tcG9uZW50VHlwZSc7XG5cbi8vIERlc2lnbiBub3Rlczpcbi8vIC0gZG9uJ3QgbGF6aWx5IGNyZWF0ZSBtZXRhZGF0YTpcbi8vICAgRm9yIHNvbWUgbWV0YWRhdGEsIHdlIG5lZWQgdG8gZG8gYXN5bmMgd29yayBzb21ldGltZXMsXG4vLyAgIHNvIHRoZSB1c2VyIGhhcyB0byBraWNrIG9mZiB0aGlzIGxvYWRpbmcuXG4vLyAgIEJ1dCB3ZSB3YW50IHRvIHJlcG9ydCBlcnJvcnMgZXZlbiB3aGVuIHRoZSBhc3luYyB3b3JrIGlzXG4vLyAgIG5vdCByZXF1aXJlZCB0byBjaGVjayB0aGF0IHRoZSB1c2VyIHdvdWxkIGhhdmUgYmVlbiBhYmxlXG4vLyAgIHRvIHdhaXQgY29ycmVjdGx5LlxuZXhwb3J0IGNsYXNzIENvbXBpbGVNZXRhZGF0YVJlc29sdmVyIHtcbiAgcHJpdmF0ZSBfbm9uTm9ybWFsaXplZERpcmVjdGl2ZUNhY2hlID1cbiAgICAgIG5ldyBNYXA8VHlwZSwge2Fubm90YXRpb246IERpcmVjdGl2ZSwgbWV0YWRhdGE6IGNwbC5Db21waWxlRGlyZWN0aXZlTWV0YWRhdGF9PigpO1xuICBwcml2YXRlIF9kaXJlY3RpdmVDYWNoZSA9IG5ldyBNYXA8VHlwZSwgY3BsLkNvbXBpbGVEaXJlY3RpdmVNZXRhZGF0YT4oKTtcbiAgcHJpdmF0ZSBfc3VtbWFyeUNhY2hlID0gbmV3IE1hcDxUeXBlLCBjcGwuQ29tcGlsZVR5cGVTdW1tYXJ5fG51bGw+KCk7XG4gIHByaXZhdGUgX3BpcGVDYWNoZSA9IG5ldyBNYXA8VHlwZSwgY3BsLkNvbXBpbGVQaXBlTWV0YWRhdGE+KCk7XG4gIHByaXZhdGUgX25nTW9kdWxlQ2FjaGUgPSBuZXcgTWFwPFR5cGUsIGNwbC5Db21waWxlTmdNb2R1bGVNZXRhZGF0YT4oKTtcbiAgcHJpdmF0ZSBfbmdNb2R1bGVPZlR5cGVzID0gbmV3IE1hcDxUeXBlLCBUeXBlPigpO1xuICBwcml2YXRlIF9zaGFsbG93TW9kdWxlQ2FjaGUgPSBuZXcgTWFwPFR5cGUsIGNwbC5Db21waWxlU2hhbGxvd01vZHVsZU1ldGFkYXRhPigpO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBfY29uZmlnOiBDb21waWxlckNvbmZpZywgcHJpdmF0ZSBfaHRtbFBhcnNlcjogSHRtbFBhcnNlcixcbiAgICAgIHByaXZhdGUgX25nTW9kdWxlUmVzb2x2ZXI6IE5nTW9kdWxlUmVzb2x2ZXIsIHByaXZhdGUgX2RpcmVjdGl2ZVJlc29sdmVyOiBEaXJlY3RpdmVSZXNvbHZlcixcbiAgICAgIHByaXZhdGUgX3BpcGVSZXNvbHZlcjogUGlwZVJlc29sdmVyLCBwcml2YXRlIF9zdW1tYXJ5UmVzb2x2ZXI6IFN1bW1hcnlSZXNvbHZlcjxhbnk+LFxuICAgICAgcHJpdmF0ZSBfc2NoZW1hUmVnaXN0cnk6IEVsZW1lbnRTY2hlbWFSZWdpc3RyeSxcbiAgICAgIHByaXZhdGUgX2RpcmVjdGl2ZU5vcm1hbGl6ZXI6IERpcmVjdGl2ZU5vcm1hbGl6ZXIsIHByaXZhdGUgX2NvbnNvbGU6IENvbnNvbGUsXG4gICAgICBwcml2YXRlIF9zdGF0aWNTeW1ib2xDYWNoZTogU3RhdGljU3ltYm9sQ2FjaGUsIHByaXZhdGUgX3JlZmxlY3RvcjogQ29tcGlsZVJlZmxlY3RvcixcbiAgICAgIHByaXZhdGUgX2Vycm9yQ29sbGVjdG9yPzogRXJyb3JDb2xsZWN0b3IpIHt9XG5cbiAgZ2V0UmVmbGVjdG9yKCk6IENvbXBpbGVSZWZsZWN0b3IgeyByZXR1cm4gdGhpcy5fcmVmbGVjdG9yOyB9XG5cbiAgY2xlYXJDYWNoZUZvcih0eXBlOiBUeXBlKSB7XG4gICAgY29uc3QgZGlyTWV0YSA9IHRoaXMuX2RpcmVjdGl2ZUNhY2hlLmdldCh0eXBlKTtcbiAgICB0aGlzLl9kaXJlY3RpdmVDYWNoZS5kZWxldGUodHlwZSk7XG4gICAgdGhpcy5fbm9uTm9ybWFsaXplZERpcmVjdGl2ZUNhY2hlLmRlbGV0ZSh0eXBlKTtcbiAgICB0aGlzLl9zdW1tYXJ5Q2FjaGUuZGVsZXRlKHR5cGUpO1xuICAgIHRoaXMuX3BpcGVDYWNoZS5kZWxldGUodHlwZSk7XG4gICAgdGhpcy5fbmdNb2R1bGVPZlR5cGVzLmRlbGV0ZSh0eXBlKTtcbiAgICAvLyBDbGVhciBhbGwgb2YgdGhlIE5nTW9kdWxlIGFzIHRoZXkgY29udGFpbiB0cmFuc2l0aXZlIGluZm9ybWF0aW9uIVxuICAgIHRoaXMuX25nTW9kdWxlQ2FjaGUuY2xlYXIoKTtcbiAgICBpZiAoZGlyTWV0YSkge1xuICAgICAgdGhpcy5fZGlyZWN0aXZlTm9ybWFsaXplci5jbGVhckNhY2hlRm9yKGRpck1ldGEpO1xuICAgIH1cbiAgfVxuXG4gIGNsZWFyQ2FjaGUoKTogdm9pZCB7XG4gICAgdGhpcy5fZGlyZWN0aXZlQ2FjaGUuY2xlYXIoKTtcbiAgICB0aGlzLl9ub25Ob3JtYWxpemVkRGlyZWN0aXZlQ2FjaGUuY2xlYXIoKTtcbiAgICB0aGlzLl9zdW1tYXJ5Q2FjaGUuY2xlYXIoKTtcbiAgICB0aGlzLl9waXBlQ2FjaGUuY2xlYXIoKTtcbiAgICB0aGlzLl9uZ01vZHVsZUNhY2hlLmNsZWFyKCk7XG4gICAgdGhpcy5fbmdNb2R1bGVPZlR5cGVzLmNsZWFyKCk7XG4gICAgdGhpcy5fZGlyZWN0aXZlTm9ybWFsaXplci5jbGVhckNhY2hlKCk7XG4gIH1cblxuICBwcml2YXRlIF9jcmVhdGVQcm94eUNsYXNzKGJhc2VUeXBlOiBhbnksIG5hbWU6IHN0cmluZyk6IGNwbC5Qcm94eUNsYXNzIHtcbiAgICBsZXQgZGVsZWdhdGU6IGFueSA9IG51bGw7XG4gICAgY29uc3QgcHJveHlDbGFzczogY3BsLlByb3h5Q2xhc3MgPSA8YW55PmZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCFkZWxlZ2F0ZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICBgSWxsZWdhbCBzdGF0ZTogQ2xhc3MgJHtuYW1lfSBmb3IgdHlwZSAke3N0cmluZ2lmeShiYXNlVHlwZSl9IGlzIG5vdCBjb21waWxlZCB5ZXQhYCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZGVsZWdhdGUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICAgIHByb3h5Q2xhc3Muc2V0RGVsZWdhdGUgPSAoZCkgPT4ge1xuICAgICAgZGVsZWdhdGUgPSBkO1xuICAgICAgKDxhbnk+cHJveHlDbGFzcykucHJvdG90eXBlID0gZC5wcm90b3R5cGU7XG4gICAgfTtcbiAgICAvLyBNYWtlIHN0cmluZ2lmeSB3b3JrIGNvcnJlY3RseVxuICAgICg8YW55PnByb3h5Q2xhc3MpLm92ZXJyaWRkZW5OYW1lID0gbmFtZTtcbiAgICByZXR1cm4gcHJveHlDbGFzcztcbiAgfVxuXG4gIHByaXZhdGUgZ2V0R2VuZXJhdGVkQ2xhc3MoZGlyVHlwZTogYW55LCBuYW1lOiBzdHJpbmcpOiBTdGF0aWNTeW1ib2x8Y3BsLlByb3h5Q2xhc3Mge1xuICAgIGlmIChkaXJUeXBlIGluc3RhbmNlb2YgU3RhdGljU3ltYm9sKSB7XG4gICAgICByZXR1cm4gdGhpcy5fc3RhdGljU3ltYm9sQ2FjaGUuZ2V0KG5nZmFjdG9yeUZpbGVQYXRoKGRpclR5cGUuZmlsZVBhdGgpLCBuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuX2NyZWF0ZVByb3h5Q2xhc3MoZGlyVHlwZSwgbmFtZSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBnZXRDb21wb25lbnRWaWV3Q2xhc3MoZGlyVHlwZTogYW55KTogU3RhdGljU3ltYm9sfGNwbC5Qcm94eUNsYXNzIHtcbiAgICByZXR1cm4gdGhpcy5nZXRHZW5lcmF0ZWRDbGFzcyhkaXJUeXBlLCBjcGwudmlld0NsYXNzTmFtZShkaXJUeXBlLCAwKSk7XG4gIH1cblxuICBnZXRIb3N0Q29tcG9uZW50Vmlld0NsYXNzKGRpclR5cGU6IGFueSk6IFN0YXRpY1N5bWJvbHxjcGwuUHJveHlDbGFzcyB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0R2VuZXJhdGVkQ2xhc3MoZGlyVHlwZSwgY3BsLmhvc3RWaWV3Q2xhc3NOYW1lKGRpclR5cGUpKTtcbiAgfVxuXG4gIGdldEhvc3RDb21wb25lbnRUeXBlKGRpclR5cGU6IGFueSk6IFN0YXRpY1N5bWJvbHxjcGwuUHJveHlDbGFzcyB7XG4gICAgY29uc3QgbmFtZSA9IGAke2NwbC5pZGVudGlmaWVyTmFtZSh7cmVmZXJlbmNlOiBkaXJUeXBlfSl9X0hvc3RgO1xuICAgIGlmIChkaXJUeXBlIGluc3RhbmNlb2YgU3RhdGljU3ltYm9sKSB7XG4gICAgICByZXR1cm4gdGhpcy5fc3RhdGljU3ltYm9sQ2FjaGUuZ2V0KGRpclR5cGUuZmlsZVBhdGgsIG5hbWUpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9jcmVhdGVQcm94eUNsYXNzKGRpclR5cGUsIG5hbWUpO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRSZW5kZXJlclR5cGUoZGlyVHlwZTogYW55KTogU3RhdGljU3ltYm9sfG9iamVjdCB7XG4gICAgaWYgKGRpclR5cGUgaW5zdGFuY2VvZiBTdGF0aWNTeW1ib2wpIHtcbiAgICAgIHJldHVybiB0aGlzLl9zdGF0aWNTeW1ib2xDYWNoZS5nZXQoXG4gICAgICAgICAgbmdmYWN0b3J5RmlsZVBhdGgoZGlyVHlwZS5maWxlUGF0aCksIGNwbC5yZW5kZXJlclR5cGVOYW1lKGRpclR5cGUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gcmV0dXJuaW5nIGFuIG9iamVjdCBhcyBwcm94eSxcbiAgICAgIC8vIHRoYXQgd2UgZmlsbCBsYXRlciBkdXJpbmcgcnVudGltZSBjb21waWxhdGlvbi5cbiAgICAgIHJldHVybiA8YW55Pnt9O1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2V0Q29tcG9uZW50RmFjdG9yeShcbiAgICAgIHNlbGVjdG9yOiBzdHJpbmcsIGRpclR5cGU6IGFueSwgaW5wdXRzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfXxudWxsLFxuICAgICAgb3V0cHV0czoge1trZXk6IHN0cmluZ106IHN0cmluZ30pOiBTdGF0aWNTeW1ib2x8b2JqZWN0IHtcbiAgICBpZiAoZGlyVHlwZSBpbnN0YW5jZW9mIFN0YXRpY1N5bWJvbCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3N0YXRpY1N5bWJvbENhY2hlLmdldChcbiAgICAgICAgICBuZ2ZhY3RvcnlGaWxlUGF0aChkaXJUeXBlLmZpbGVQYXRoKSwgY3BsLmNvbXBvbmVudEZhY3RvcnlOYW1lKGRpclR5cGUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgaG9zdFZpZXcgPSB0aGlzLmdldEhvc3RDb21wb25lbnRWaWV3Q2xhc3MoZGlyVHlwZSk7XG4gICAgICAvLyBOb3RlOiBuZ0NvbnRlbnRTZWxlY3RvcnMgd2lsbCBiZSBmaWxsZWQgbGF0ZXIgb25jZSB0aGUgdGVtcGxhdGUgaXNcbiAgICAgIC8vIGxvYWRlZC5cbiAgICAgIGNvbnN0IGNyZWF0ZUNvbXBvbmVudEZhY3RvcnkgPVxuICAgICAgICAgIHRoaXMuX3JlZmxlY3Rvci5yZXNvbHZlRXh0ZXJuYWxSZWZlcmVuY2UoSWRlbnRpZmllcnMuY3JlYXRlQ29tcG9uZW50RmFjdG9yeSk7XG4gICAgICByZXR1cm4gY3JlYXRlQ29tcG9uZW50RmFjdG9yeShzZWxlY3RvciwgZGlyVHlwZSwgPGFueT5ob3N0VmlldywgaW5wdXRzLCBvdXRwdXRzLCBbXSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBpbml0Q29tcG9uZW50RmFjdG9yeShmYWN0b3J5OiBTdGF0aWNTeW1ib2x8b2JqZWN0LCBuZ0NvbnRlbnRTZWxlY3RvcnM6IHN0cmluZ1tdKSB7XG4gICAgaWYgKCEoZmFjdG9yeSBpbnN0YW5jZW9mIFN0YXRpY1N5bWJvbCkpIHtcbiAgICAgIChmYWN0b3J5IGFzIGFueSkubmdDb250ZW50U2VsZWN0b3JzLnB1c2goLi4ubmdDb250ZW50U2VsZWN0b3JzKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9sb2FkU3VtbWFyeSh0eXBlOiBhbnksIGtpbmQ6IGNwbC5Db21waWxlU3VtbWFyeUtpbmQpOiBjcGwuQ29tcGlsZVR5cGVTdW1tYXJ5fG51bGwge1xuICAgIGxldCB0eXBlU3VtbWFyeSA9IHRoaXMuX3N1bW1hcnlDYWNoZS5nZXQodHlwZSk7XG4gICAgaWYgKCF0eXBlU3VtbWFyeSkge1xuICAgICAgY29uc3Qgc3VtbWFyeSA9IHRoaXMuX3N1bW1hcnlSZXNvbHZlci5yZXNvbHZlU3VtbWFyeSh0eXBlKTtcbiAgICAgIHR5cGVTdW1tYXJ5ID0gc3VtbWFyeSA/IHN1bW1hcnkudHlwZSA6IG51bGw7XG4gICAgICB0aGlzLl9zdW1tYXJ5Q2FjaGUuc2V0KHR5cGUsIHR5cGVTdW1tYXJ5IHx8IG51bGwpO1xuICAgIH1cbiAgICByZXR1cm4gdHlwZVN1bW1hcnkgJiYgdHlwZVN1bW1hcnkuc3VtbWFyeUtpbmQgPT09IGtpbmQgPyB0eXBlU3VtbWFyeSA6IG51bGw7XG4gIH1cblxuICBnZXRIb3N0Q29tcG9uZW50TWV0YWRhdGEoXG4gICAgICBjb21wTWV0YTogY3BsLkNvbXBpbGVEaXJlY3RpdmVNZXRhZGF0YSxcbiAgICAgIGhvc3RWaWV3VHlwZT86IFN0YXRpY1N5bWJvbHxjcGwuUHJveHlDbGFzcyk6IGNwbC5Db21waWxlRGlyZWN0aXZlTWV0YWRhdGEge1xuICAgIGNvbnN0IGhvc3RUeXBlID0gdGhpcy5nZXRIb3N0Q29tcG9uZW50VHlwZShjb21wTWV0YS50eXBlLnJlZmVyZW5jZSk7XG4gICAgaWYgKCFob3N0Vmlld1R5cGUpIHtcbiAgICAgIGhvc3RWaWV3VHlwZSA9IHRoaXMuZ2V0SG9zdENvbXBvbmVudFZpZXdDbGFzcyhob3N0VHlwZSk7XG4gICAgfVxuICAgIC8vIE5vdGU6ICEgaXMgb2sgaGVyZSBhcyB0aGlzIG1ldGhvZCBzaG91bGQgb25seSBiZSBjYWxsZWQgd2l0aCBub3JtYWxpemVkIGRpcmVjdGl2ZVxuICAgIC8vIG1ldGFkYXRhLCB3aGljaCBhbHdheXMgZmlsbHMgaW4gdGhlIHNlbGVjdG9yLlxuICAgIGNvbnN0IHRlbXBsYXRlID0gQ3NzU2VsZWN0b3IucGFyc2UoY29tcE1ldGEuc2VsZWN0b3IgISlbMF0uZ2V0TWF0Y2hpbmdFbGVtZW50VGVtcGxhdGUoKTtcbiAgICBjb25zdCB0ZW1wbGF0ZVVybCA9ICcnO1xuICAgIGNvbnN0IGh0bWxBc3QgPSB0aGlzLl9odG1sUGFyc2VyLnBhcnNlKHRlbXBsYXRlLCB0ZW1wbGF0ZVVybCk7XG4gICAgcmV0dXJuIGNwbC5Db21waWxlRGlyZWN0aXZlTWV0YWRhdGEuY3JlYXRlKHtcbiAgICAgIGlzSG9zdDogdHJ1ZSxcbiAgICAgIHR5cGU6IHtyZWZlcmVuY2U6IGhvc3RUeXBlLCBkaURlcHM6IFtdLCBsaWZlY3ljbGVIb29rczogW119LFxuICAgICAgdGVtcGxhdGU6IG5ldyBjcGwuQ29tcGlsZVRlbXBsYXRlTWV0YWRhdGEoe1xuICAgICAgICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbi5Ob25lLFxuICAgICAgICB0ZW1wbGF0ZSxcbiAgICAgICAgdGVtcGxhdGVVcmwsXG4gICAgICAgIGh0bWxBc3QsXG4gICAgICAgIHN0eWxlczogW10sXG4gICAgICAgIHN0eWxlVXJsczogW10sXG4gICAgICAgIG5nQ29udGVudFNlbGVjdG9yczogW10sXG4gICAgICAgIGFuaW1hdGlvbnM6IFtdLFxuICAgICAgICBpc0lubGluZTogdHJ1ZSxcbiAgICAgICAgZXh0ZXJuYWxTdHlsZXNoZWV0czogW10sXG4gICAgICAgIGludGVycG9sYXRpb246IG51bGwsXG4gICAgICAgIHByZXNlcnZlV2hpdGVzcGFjZXM6IGZhbHNlLFxuICAgICAgfSksXG4gICAgICBleHBvcnRBczogbnVsbCxcbiAgICAgIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuRGVmYXVsdCxcbiAgICAgIGlucHV0czogW10sXG4gICAgICBvdXRwdXRzOiBbXSxcbiAgICAgIGhvc3Q6IHt9LFxuICAgICAgaXNDb21wb25lbnQ6IHRydWUsXG4gICAgICBzZWxlY3RvcjogJyonLFxuICAgICAgcHJvdmlkZXJzOiBbXSxcbiAgICAgIHZpZXdQcm92aWRlcnM6IFtdLFxuICAgICAgcXVlcmllczogW10sXG4gICAgICBndWFyZHM6IHt9LFxuICAgICAgdmlld1F1ZXJpZXM6IFtdLFxuICAgICAgY29tcG9uZW50Vmlld1R5cGU6IGhvc3RWaWV3VHlwZSxcbiAgICAgIHJlbmRlcmVyVHlwZTpcbiAgICAgICAgICB7aWQ6ICdfX0hvc3RfXycsIGVuY2Fwc3VsYXRpb246IFZpZXdFbmNhcHN1bGF0aW9uLk5vbmUsIHN0eWxlczogW10sIGRhdGE6IHt9fSBhcyBvYmplY3QsXG4gICAgICBlbnRyeUNvbXBvbmVudHM6IFtdLFxuICAgICAgY29tcG9uZW50RmFjdG9yeTogbnVsbFxuICAgIH0pO1xuICB9XG5cbiAgbG9hZERpcmVjdGl2ZU1ldGFkYXRhKG5nTW9kdWxlVHlwZTogYW55LCBkaXJlY3RpdmVUeXBlOiBhbnksIGlzU3luYzogYm9vbGVhbik6IFN5bmNBc3luYzxudWxsPiB7XG4gICAgaWYgKHRoaXMuX2RpcmVjdGl2ZUNhY2hlLmhhcyhkaXJlY3RpdmVUeXBlKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGRpcmVjdGl2ZVR5cGUgPSByZXNvbHZlRm9yd2FyZFJlZihkaXJlY3RpdmVUeXBlKTtcbiAgICBjb25zdCB7YW5ub3RhdGlvbiwgbWV0YWRhdGF9ID0gdGhpcy5nZXROb25Ob3JtYWxpemVkRGlyZWN0aXZlTWV0YWRhdGEoZGlyZWN0aXZlVHlwZSkgITtcblxuICAgIGNvbnN0IGNyZWF0ZURpcmVjdGl2ZU1ldGFkYXRhID0gKHRlbXBsYXRlTWV0YWRhdGE6IGNwbC5Db21waWxlVGVtcGxhdGVNZXRhZGF0YSB8IG51bGwpID0+IHtcbiAgICAgIGNvbnN0IG5vcm1hbGl6ZWREaXJNZXRhID0gbmV3IGNwbC5Db21waWxlRGlyZWN0aXZlTWV0YWRhdGEoe1xuICAgICAgICBpc0hvc3Q6IGZhbHNlLFxuICAgICAgICB0eXBlOiBtZXRhZGF0YS50eXBlLFxuICAgICAgICBpc0NvbXBvbmVudDogbWV0YWRhdGEuaXNDb21wb25lbnQsXG4gICAgICAgIHNlbGVjdG9yOiBtZXRhZGF0YS5zZWxlY3RvcixcbiAgICAgICAgZXhwb3J0QXM6IG1ldGFkYXRhLmV4cG9ydEFzLFxuICAgICAgICBjaGFuZ2VEZXRlY3Rpb246IG1ldGFkYXRhLmNoYW5nZURldGVjdGlvbixcbiAgICAgICAgaW5wdXRzOiBtZXRhZGF0YS5pbnB1dHMsXG4gICAgICAgIG91dHB1dHM6IG1ldGFkYXRhLm91dHB1dHMsXG4gICAgICAgIGhvc3RMaXN0ZW5lcnM6IG1ldGFkYXRhLmhvc3RMaXN0ZW5lcnMsXG4gICAgICAgIGhvc3RQcm9wZXJ0aWVzOiBtZXRhZGF0YS5ob3N0UHJvcGVydGllcyxcbiAgICAgICAgaG9zdEF0dHJpYnV0ZXM6IG1ldGFkYXRhLmhvc3RBdHRyaWJ1dGVzLFxuICAgICAgICBwcm92aWRlcnM6IG1ldGFkYXRhLnByb3ZpZGVycyxcbiAgICAgICAgdmlld1Byb3ZpZGVyczogbWV0YWRhdGEudmlld1Byb3ZpZGVycyxcbiAgICAgICAgcXVlcmllczogbWV0YWRhdGEucXVlcmllcyxcbiAgICAgICAgZ3VhcmRzOiBtZXRhZGF0YS5ndWFyZHMsXG4gICAgICAgIHZpZXdRdWVyaWVzOiBtZXRhZGF0YS52aWV3UXVlcmllcyxcbiAgICAgICAgZW50cnlDb21wb25lbnRzOiBtZXRhZGF0YS5lbnRyeUNvbXBvbmVudHMsXG4gICAgICAgIGNvbXBvbmVudFZpZXdUeXBlOiBtZXRhZGF0YS5jb21wb25lbnRWaWV3VHlwZSxcbiAgICAgICAgcmVuZGVyZXJUeXBlOiBtZXRhZGF0YS5yZW5kZXJlclR5cGUsXG4gICAgICAgIGNvbXBvbmVudEZhY3Rvcnk6IG1ldGFkYXRhLmNvbXBvbmVudEZhY3RvcnksXG4gICAgICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZU1ldGFkYXRhXG4gICAgICB9KTtcbiAgICAgIGlmICh0ZW1wbGF0ZU1ldGFkYXRhKSB7XG4gICAgICAgIHRoaXMuaW5pdENvbXBvbmVudEZhY3RvcnkobWV0YWRhdGEuY29tcG9uZW50RmFjdG9yeSAhLCB0ZW1wbGF0ZU1ldGFkYXRhLm5nQ29udGVudFNlbGVjdG9ycyk7XG4gICAgICB9XG4gICAgICB0aGlzLl9kaXJlY3RpdmVDYWNoZS5zZXQoZGlyZWN0aXZlVHlwZSwgbm9ybWFsaXplZERpck1ldGEpO1xuICAgICAgdGhpcy5fc3VtbWFyeUNhY2hlLnNldChkaXJlY3RpdmVUeXBlLCBub3JtYWxpemVkRGlyTWV0YS50b1N1bW1hcnkoKSk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9O1xuXG4gICAgaWYgKG1ldGFkYXRhLmlzQ29tcG9uZW50KSB7XG4gICAgICBjb25zdCB0ZW1wbGF0ZSA9IG1ldGFkYXRhLnRlbXBsYXRlICE7XG4gICAgICBjb25zdCB0ZW1wbGF0ZU1ldGEgPSB0aGlzLl9kaXJlY3RpdmVOb3JtYWxpemVyLm5vcm1hbGl6ZVRlbXBsYXRlKHtcbiAgICAgICAgbmdNb2R1bGVUeXBlLFxuICAgICAgICBjb21wb25lbnRUeXBlOiBkaXJlY3RpdmVUeXBlLFxuICAgICAgICBtb2R1bGVVcmw6IHRoaXMuX3JlZmxlY3Rvci5jb21wb25lbnRNb2R1bGVVcmwoZGlyZWN0aXZlVHlwZSwgYW5ub3RhdGlvbiksXG4gICAgICAgIGVuY2Fwc3VsYXRpb246IHRlbXBsYXRlLmVuY2Fwc3VsYXRpb24sXG4gICAgICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZS50ZW1wbGF0ZSxcbiAgICAgICAgdGVtcGxhdGVVcmw6IHRlbXBsYXRlLnRlbXBsYXRlVXJsLFxuICAgICAgICBzdHlsZXM6IHRlbXBsYXRlLnN0eWxlcyxcbiAgICAgICAgc3R5bGVVcmxzOiB0ZW1wbGF0ZS5zdHlsZVVybHMsXG4gICAgICAgIGFuaW1hdGlvbnM6IHRlbXBsYXRlLmFuaW1hdGlvbnMsXG4gICAgICAgIGludGVycG9sYXRpb246IHRlbXBsYXRlLmludGVycG9sYXRpb24sXG4gICAgICAgIHByZXNlcnZlV2hpdGVzcGFjZXM6IHRlbXBsYXRlLnByZXNlcnZlV2hpdGVzcGFjZXNcbiAgICAgIH0pO1xuICAgICAgaWYgKGlzUHJvbWlzZSh0ZW1wbGF0ZU1ldGEpICYmIGlzU3luYykge1xuICAgICAgICB0aGlzLl9yZXBvcnRFcnJvcihjb21wb25lbnRTdGlsbExvYWRpbmdFcnJvcihkaXJlY3RpdmVUeXBlKSwgZGlyZWN0aXZlVHlwZSk7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgcmV0dXJuIFN5bmNBc3luYy50aGVuKHRlbXBsYXRlTWV0YSwgY3JlYXRlRGlyZWN0aXZlTWV0YWRhdGEpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBkaXJlY3RpdmVcbiAgICAgIGNyZWF0ZURpcmVjdGl2ZU1ldGFkYXRhKG51bGwpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG5cbiAgZ2V0Tm9uTm9ybWFsaXplZERpcmVjdGl2ZU1ldGFkYXRhKGRpcmVjdGl2ZVR5cGU6IGFueSk6XG4gICAgICB7YW5ub3RhdGlvbjogRGlyZWN0aXZlLCBtZXRhZGF0YTogY3BsLkNvbXBpbGVEaXJlY3RpdmVNZXRhZGF0YX18bnVsbCB7XG4gICAgZGlyZWN0aXZlVHlwZSA9IHJlc29sdmVGb3J3YXJkUmVmKGRpcmVjdGl2ZVR5cGUpO1xuICAgIGlmICghZGlyZWN0aXZlVHlwZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGxldCBjYWNoZUVudHJ5ID0gdGhpcy5fbm9uTm9ybWFsaXplZERpcmVjdGl2ZUNhY2hlLmdldChkaXJlY3RpdmVUeXBlKTtcbiAgICBpZiAoY2FjaGVFbnRyeSkge1xuICAgICAgcmV0dXJuIGNhY2hlRW50cnk7XG4gICAgfVxuICAgIGNvbnN0IGRpck1ldGEgPSB0aGlzLl9kaXJlY3RpdmVSZXNvbHZlci5yZXNvbHZlKGRpcmVjdGl2ZVR5cGUsIGZhbHNlKTtcbiAgICBpZiAoIWRpck1ldGEpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBsZXQgbm9uTm9ybWFsaXplZFRlbXBsYXRlTWV0YWRhdGE6IGNwbC5Db21waWxlVGVtcGxhdGVNZXRhZGF0YSA9IHVuZGVmaW5lZCAhO1xuXG4gICAgaWYgKGNyZWF0ZUNvbXBvbmVudC5pc1R5cGVPZihkaXJNZXRhKSkge1xuICAgICAgLy8gY29tcG9uZW50XG4gICAgICBjb25zdCBjb21wTWV0YSA9IGRpck1ldGEgYXMgQ29tcG9uZW50O1xuICAgICAgYXNzZXJ0QXJyYXlPZlN0cmluZ3MoJ3N0eWxlcycsIGNvbXBNZXRhLnN0eWxlcyk7XG4gICAgICBhc3NlcnRBcnJheU9mU3RyaW5ncygnc3R5bGVVcmxzJywgY29tcE1ldGEuc3R5bGVVcmxzKTtcbiAgICAgIGFzc2VydEludGVycG9sYXRpb25TeW1ib2xzKCdpbnRlcnBvbGF0aW9uJywgY29tcE1ldGEuaW50ZXJwb2xhdGlvbik7XG5cbiAgICAgIGNvbnN0IGFuaW1hdGlvbnMgPSBjb21wTWV0YS5hbmltYXRpb25zO1xuXG4gICAgICBub25Ob3JtYWxpemVkVGVtcGxhdGVNZXRhZGF0YSA9IG5ldyBjcGwuQ29tcGlsZVRlbXBsYXRlTWV0YWRhdGEoe1xuICAgICAgICBlbmNhcHN1bGF0aW9uOiBub1VuZGVmaW5lZChjb21wTWV0YS5lbmNhcHN1bGF0aW9uKSxcbiAgICAgICAgdGVtcGxhdGU6IG5vVW5kZWZpbmVkKGNvbXBNZXRhLnRlbXBsYXRlKSxcbiAgICAgICAgdGVtcGxhdGVVcmw6IG5vVW5kZWZpbmVkKGNvbXBNZXRhLnRlbXBsYXRlVXJsKSxcbiAgICAgICAgaHRtbEFzdDogbnVsbCxcbiAgICAgICAgc3R5bGVzOiBjb21wTWV0YS5zdHlsZXMgfHwgW10sXG4gICAgICAgIHN0eWxlVXJsczogY29tcE1ldGEuc3R5bGVVcmxzIHx8IFtdLFxuICAgICAgICBhbmltYXRpb25zOiBhbmltYXRpb25zIHx8IFtdLFxuICAgICAgICBpbnRlcnBvbGF0aW9uOiBub1VuZGVmaW5lZChjb21wTWV0YS5pbnRlcnBvbGF0aW9uKSxcbiAgICAgICAgaXNJbmxpbmU6ICEhY29tcE1ldGEudGVtcGxhdGUsXG4gICAgICAgIGV4dGVybmFsU3R5bGVzaGVldHM6IFtdLFxuICAgICAgICBuZ0NvbnRlbnRTZWxlY3RvcnM6IFtdLFxuICAgICAgICBwcmVzZXJ2ZVdoaXRlc3BhY2VzOiBub1VuZGVmaW5lZChkaXJNZXRhLnByZXNlcnZlV2hpdGVzcGFjZXMpLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgbGV0IGNoYW5nZURldGVjdGlvblN0cmF0ZWd5OiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSA9IG51bGwgITtcbiAgICBsZXQgdmlld1Byb3ZpZGVyczogY3BsLkNvbXBpbGVQcm92aWRlck1ldGFkYXRhW10gPSBbXTtcbiAgICBsZXQgZW50cnlDb21wb25lbnRNZXRhZGF0YTogY3BsLkNvbXBpbGVFbnRyeUNvbXBvbmVudE1ldGFkYXRhW10gPSBbXTtcbiAgICBsZXQgc2VsZWN0b3IgPSBkaXJNZXRhLnNlbGVjdG9yO1xuXG4gICAgaWYgKGNyZWF0ZUNvbXBvbmVudC5pc1R5cGVPZihkaXJNZXRhKSkge1xuICAgICAgLy8gQ29tcG9uZW50XG4gICAgICBjb25zdCBjb21wTWV0YSA9IGRpck1ldGEgYXMgQ29tcG9uZW50O1xuICAgICAgY2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kgPSBjb21wTWV0YS5jaGFuZ2VEZXRlY3Rpb24gITtcbiAgICAgIGlmIChjb21wTWV0YS52aWV3UHJvdmlkZXJzKSB7XG4gICAgICAgIHZpZXdQcm92aWRlcnMgPSB0aGlzLl9nZXRQcm92aWRlcnNNZXRhZGF0YShcbiAgICAgICAgICAgIGNvbXBNZXRhLnZpZXdQcm92aWRlcnMsIGVudHJ5Q29tcG9uZW50TWV0YWRhdGEsXG4gICAgICAgICAgICBgdmlld1Byb3ZpZGVycyBmb3IgXCIke3N0cmluZ2lmeVR5cGUoZGlyZWN0aXZlVHlwZSl9XCJgLCBbXSwgZGlyZWN0aXZlVHlwZSk7XG4gICAgICB9XG4gICAgICBpZiAoY29tcE1ldGEuZW50cnlDb21wb25lbnRzKSB7XG4gICAgICAgIGVudHJ5Q29tcG9uZW50TWV0YWRhdGEgPSBmbGF0dGVuQW5kRGVkdXBlQXJyYXkoY29tcE1ldGEuZW50cnlDb21wb25lbnRzKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAoKHR5cGUpID0+IHRoaXMuX2dldEVudHJ5Q29tcG9uZW50TWV0YWRhdGEodHlwZSkgISlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY29uY2F0KGVudHJ5Q29tcG9uZW50TWV0YWRhdGEpO1xuICAgICAgfVxuICAgICAgaWYgKCFzZWxlY3Rvcikge1xuICAgICAgICBzZWxlY3RvciA9IHRoaXMuX3NjaGVtYVJlZ2lzdHJ5LmdldERlZmF1bHRDb21wb25lbnRFbGVtZW50TmFtZSgpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBEaXJlY3RpdmVcbiAgICAgIGlmICghc2VsZWN0b3IpIHtcbiAgICAgICAgdGhpcy5fcmVwb3J0RXJyb3IoXG4gICAgICAgICAgICBzeW50YXhFcnJvcihcbiAgICAgICAgICAgICAgICBgRGlyZWN0aXZlICR7c3RyaW5naWZ5VHlwZShkaXJlY3RpdmVUeXBlKX0gaGFzIG5vIHNlbGVjdG9yLCBwbGVhc2UgYWRkIGl0IWApLFxuICAgICAgICAgICAgZGlyZWN0aXZlVHlwZSk7XG4gICAgICAgIHNlbGVjdG9yID0gJ2Vycm9yJztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgcHJvdmlkZXJzOiBjcGwuQ29tcGlsZVByb3ZpZGVyTWV0YWRhdGFbXSA9IFtdO1xuICAgIGlmIChkaXJNZXRhLnByb3ZpZGVycyAhPSBudWxsKSB7XG4gICAgICBwcm92aWRlcnMgPSB0aGlzLl9nZXRQcm92aWRlcnNNZXRhZGF0YShcbiAgICAgICAgICBkaXJNZXRhLnByb3ZpZGVycywgZW50cnlDb21wb25lbnRNZXRhZGF0YSxcbiAgICAgICAgICBgcHJvdmlkZXJzIGZvciBcIiR7c3RyaW5naWZ5VHlwZShkaXJlY3RpdmVUeXBlKX1cImAsIFtdLCBkaXJlY3RpdmVUeXBlKTtcbiAgICB9XG4gICAgbGV0IHF1ZXJpZXM6IGNwbC5Db21waWxlUXVlcnlNZXRhZGF0YVtdID0gW107XG4gICAgbGV0IHZpZXdRdWVyaWVzOiBjcGwuQ29tcGlsZVF1ZXJ5TWV0YWRhdGFbXSA9IFtdO1xuICAgIGlmIChkaXJNZXRhLnF1ZXJpZXMgIT0gbnVsbCkge1xuICAgICAgcXVlcmllcyA9IHRoaXMuX2dldFF1ZXJpZXNNZXRhZGF0YShkaXJNZXRhLnF1ZXJpZXMsIGZhbHNlLCBkaXJlY3RpdmVUeXBlKTtcbiAgICAgIHZpZXdRdWVyaWVzID0gdGhpcy5fZ2V0UXVlcmllc01ldGFkYXRhKGRpck1ldGEucXVlcmllcywgdHJ1ZSwgZGlyZWN0aXZlVHlwZSk7XG4gICAgfVxuXG4gICAgY29uc3QgbWV0YWRhdGEgPSBjcGwuQ29tcGlsZURpcmVjdGl2ZU1ldGFkYXRhLmNyZWF0ZSh7XG4gICAgICBpc0hvc3Q6IGZhbHNlLFxuICAgICAgc2VsZWN0b3I6IHNlbGVjdG9yLFxuICAgICAgZXhwb3J0QXM6IG5vVW5kZWZpbmVkKGRpck1ldGEuZXhwb3J0QXMpLFxuICAgICAgaXNDb21wb25lbnQ6ICEhbm9uTm9ybWFsaXplZFRlbXBsYXRlTWV0YWRhdGEsXG4gICAgICB0eXBlOiB0aGlzLl9nZXRUeXBlTWV0YWRhdGEoZGlyZWN0aXZlVHlwZSksXG4gICAgICB0ZW1wbGF0ZTogbm9uTm9ybWFsaXplZFRlbXBsYXRlTWV0YWRhdGEsXG4gICAgICBjaGFuZ2VEZXRlY3Rpb246IGNoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICAgICAgaW5wdXRzOiBkaXJNZXRhLmlucHV0cyB8fCBbXSxcbiAgICAgIG91dHB1dHM6IGRpck1ldGEub3V0cHV0cyB8fCBbXSxcbiAgICAgIGhvc3Q6IGRpck1ldGEuaG9zdCB8fCB7fSxcbiAgICAgIHByb3ZpZGVyczogcHJvdmlkZXJzIHx8IFtdLFxuICAgICAgdmlld1Byb3ZpZGVyczogdmlld1Byb3ZpZGVycyB8fCBbXSxcbiAgICAgIHF1ZXJpZXM6IHF1ZXJpZXMgfHwgW10sXG4gICAgICBndWFyZHM6IGRpck1ldGEuZ3VhcmRzIHx8IHt9LFxuICAgICAgdmlld1F1ZXJpZXM6IHZpZXdRdWVyaWVzIHx8IFtdLFxuICAgICAgZW50cnlDb21wb25lbnRzOiBlbnRyeUNvbXBvbmVudE1ldGFkYXRhLFxuICAgICAgY29tcG9uZW50Vmlld1R5cGU6IG5vbk5vcm1hbGl6ZWRUZW1wbGF0ZU1ldGFkYXRhID8gdGhpcy5nZXRDb21wb25lbnRWaWV3Q2xhc3MoZGlyZWN0aXZlVHlwZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCxcbiAgICAgIHJlbmRlcmVyVHlwZTogbm9uTm9ybWFsaXplZFRlbXBsYXRlTWV0YWRhdGEgPyB0aGlzLmdldFJlbmRlcmVyVHlwZShkaXJlY3RpdmVUeXBlKSA6IG51bGwsXG4gICAgICBjb21wb25lbnRGYWN0b3J5OiBudWxsXG4gICAgfSk7XG4gICAgaWYgKG5vbk5vcm1hbGl6ZWRUZW1wbGF0ZU1ldGFkYXRhKSB7XG4gICAgICBtZXRhZGF0YS5jb21wb25lbnRGYWN0b3J5ID1cbiAgICAgICAgICB0aGlzLmdldENvbXBvbmVudEZhY3Rvcnkoc2VsZWN0b3IsIGRpcmVjdGl2ZVR5cGUsIG1ldGFkYXRhLmlucHV0cywgbWV0YWRhdGEub3V0cHV0cyk7XG4gICAgfVxuICAgIGNhY2hlRW50cnkgPSB7bWV0YWRhdGEsIGFubm90YXRpb246IGRpck1ldGF9O1xuICAgIHRoaXMuX25vbk5vcm1hbGl6ZWREaXJlY3RpdmVDYWNoZS5zZXQoZGlyZWN0aXZlVHlwZSwgY2FjaGVFbnRyeSk7XG4gICAgcmV0dXJuIGNhY2hlRW50cnk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbWV0YWRhdGEgZm9yIHRoZSBnaXZlbiBkaXJlY3RpdmUuXG4gICAqIFRoaXMgYXNzdW1lcyBgbG9hZE5nTW9kdWxlRGlyZWN0aXZlQW5kUGlwZU1ldGFkYXRhYCBoYXMgYmVlbiBjYWxsZWQgZmlyc3QuXG4gICAqL1xuICBnZXREaXJlY3RpdmVNZXRhZGF0YShkaXJlY3RpdmVUeXBlOiBhbnkpOiBjcGwuQ29tcGlsZURpcmVjdGl2ZU1ldGFkYXRhIHtcbiAgICBjb25zdCBkaXJNZXRhID0gdGhpcy5fZGlyZWN0aXZlQ2FjaGUuZ2V0KGRpcmVjdGl2ZVR5cGUpICE7XG4gICAgaWYgKCFkaXJNZXRhKSB7XG4gICAgICB0aGlzLl9yZXBvcnRFcnJvcihcbiAgICAgICAgICBzeW50YXhFcnJvcihcbiAgICAgICAgICAgICAgYElsbGVnYWwgc3RhdGU6IGdldERpcmVjdGl2ZU1ldGFkYXRhIGNhbiBvbmx5IGJlIGNhbGxlZCBhZnRlciBsb2FkTmdNb2R1bGVEaXJlY3RpdmVBbmRQaXBlTWV0YWRhdGEgZm9yIGEgbW9kdWxlIHRoYXQgZGVjbGFyZXMgaXQuIERpcmVjdGl2ZSAke3N0cmluZ2lmeVR5cGUoZGlyZWN0aXZlVHlwZSl9LmApLFxuICAgICAgICAgIGRpcmVjdGl2ZVR5cGUpO1xuICAgIH1cbiAgICByZXR1cm4gZGlyTWV0YTtcbiAgfVxuXG4gIGdldERpcmVjdGl2ZVN1bW1hcnkoZGlyVHlwZTogYW55KTogY3BsLkNvbXBpbGVEaXJlY3RpdmVTdW1tYXJ5IHtcbiAgICBjb25zdCBkaXJTdW1tYXJ5ID1cbiAgICAgICAgPGNwbC5Db21waWxlRGlyZWN0aXZlU3VtbWFyeT50aGlzLl9sb2FkU3VtbWFyeShkaXJUeXBlLCBjcGwuQ29tcGlsZVN1bW1hcnlLaW5kLkRpcmVjdGl2ZSk7XG4gICAgaWYgKCFkaXJTdW1tYXJ5KSB7XG4gICAgICB0aGlzLl9yZXBvcnRFcnJvcihcbiAgICAgICAgICBzeW50YXhFcnJvcihcbiAgICAgICAgICAgICAgYElsbGVnYWwgc3RhdGU6IENvdWxkIG5vdCBsb2FkIHRoZSBzdW1tYXJ5IGZvciBkaXJlY3RpdmUgJHtzdHJpbmdpZnlUeXBlKGRpclR5cGUpfS5gKSxcbiAgICAgICAgICBkaXJUeXBlKTtcbiAgICB9XG4gICAgcmV0dXJuIGRpclN1bW1hcnk7XG4gIH1cblxuICBpc0RpcmVjdGl2ZSh0eXBlOiBhbnkpIHtcbiAgICByZXR1cm4gISF0aGlzLl9sb2FkU3VtbWFyeSh0eXBlLCBjcGwuQ29tcGlsZVN1bW1hcnlLaW5kLkRpcmVjdGl2ZSkgfHxcbiAgICAgICAgdGhpcy5fZGlyZWN0aXZlUmVzb2x2ZXIuaXNEaXJlY3RpdmUodHlwZSk7XG4gIH1cblxuICBpc1BpcGUodHlwZTogYW55KSB7XG4gICAgcmV0dXJuICEhdGhpcy5fbG9hZFN1bW1hcnkodHlwZSwgY3BsLkNvbXBpbGVTdW1tYXJ5S2luZC5QaXBlKSB8fFxuICAgICAgICB0aGlzLl9waXBlUmVzb2x2ZXIuaXNQaXBlKHR5cGUpO1xuICB9XG5cbiAgaXNOZ01vZHVsZSh0eXBlOiBhbnkpIHtcbiAgICByZXR1cm4gISF0aGlzLl9sb2FkU3VtbWFyeSh0eXBlLCBjcGwuQ29tcGlsZVN1bW1hcnlLaW5kLk5nTW9kdWxlKSB8fFxuICAgICAgICB0aGlzLl9uZ01vZHVsZVJlc29sdmVyLmlzTmdNb2R1bGUodHlwZSk7XG4gIH1cblxuICBnZXROZ01vZHVsZVN1bW1hcnkobW9kdWxlVHlwZTogYW55LCBhbHJlYWR5Q29sbGVjdGluZzogU2V0PGFueT58bnVsbCA9IG51bGwpOlxuICAgICAgY3BsLkNvbXBpbGVOZ01vZHVsZVN1bW1hcnl8bnVsbCB7XG4gICAgbGV0IG1vZHVsZVN1bW1hcnk6IGNwbC5Db21waWxlTmdNb2R1bGVTdW1tYXJ5fG51bGwgPVxuICAgICAgICA8Y3BsLkNvbXBpbGVOZ01vZHVsZVN1bW1hcnk+dGhpcy5fbG9hZFN1bW1hcnkobW9kdWxlVHlwZSwgY3BsLkNvbXBpbGVTdW1tYXJ5S2luZC5OZ01vZHVsZSk7XG4gICAgaWYgKCFtb2R1bGVTdW1tYXJ5KSB7XG4gICAgICBjb25zdCBtb2R1bGVNZXRhID0gdGhpcy5nZXROZ01vZHVsZU1ldGFkYXRhKG1vZHVsZVR5cGUsIGZhbHNlLCBhbHJlYWR5Q29sbGVjdGluZyk7XG4gICAgICBtb2R1bGVTdW1tYXJ5ID0gbW9kdWxlTWV0YSA/IG1vZHVsZU1ldGEudG9TdW1tYXJ5KCkgOiBudWxsO1xuICAgICAgaWYgKG1vZHVsZVN1bW1hcnkpIHtcbiAgICAgICAgdGhpcy5fc3VtbWFyeUNhY2hlLnNldChtb2R1bGVUeXBlLCBtb2R1bGVTdW1tYXJ5KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1vZHVsZVN1bW1hcnk7XG4gIH1cblxuICAvKipcbiAgICogTG9hZHMgdGhlIGRlY2xhcmVkIGRpcmVjdGl2ZXMgYW5kIHBpcGVzIG9mIGFuIE5nTW9kdWxlLlxuICAgKi9cbiAgbG9hZE5nTW9kdWxlRGlyZWN0aXZlQW5kUGlwZU1ldGFkYXRhKG1vZHVsZVR5cGU6IGFueSwgaXNTeW5jOiBib29sZWFuLCB0aHJvd0lmTm90Rm91bmQgPSB0cnVlKTpcbiAgICAgIFByb21pc2U8YW55PiB7XG4gICAgY29uc3QgbmdNb2R1bGUgPSB0aGlzLmdldE5nTW9kdWxlTWV0YWRhdGEobW9kdWxlVHlwZSwgdGhyb3dJZk5vdEZvdW5kKTtcbiAgICBjb25zdCBsb2FkaW5nOiBQcm9taXNlPGFueT5bXSA9IFtdO1xuICAgIGlmIChuZ01vZHVsZSkge1xuICAgICAgbmdNb2R1bGUuZGVjbGFyZWREaXJlY3RpdmVzLmZvckVhY2goKGlkKSA9PiB7XG4gICAgICAgIGNvbnN0IHByb21pc2UgPSB0aGlzLmxvYWREaXJlY3RpdmVNZXRhZGF0YShtb2R1bGVUeXBlLCBpZC5yZWZlcmVuY2UsIGlzU3luYyk7XG4gICAgICAgIGlmIChwcm9taXNlKSB7XG4gICAgICAgICAgbG9hZGluZy5wdXNoKHByb21pc2UpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIG5nTW9kdWxlLmRlY2xhcmVkUGlwZXMuZm9yRWFjaCgoaWQpID0+IHRoaXMuX2xvYWRQaXBlTWV0YWRhdGEoaWQucmVmZXJlbmNlKSk7XG4gICAgfVxuICAgIHJldHVybiBQcm9taXNlLmFsbChsb2FkaW5nKTtcbiAgfVxuXG4gIGdldFNoYWxsb3dNb2R1bGVNZXRhZGF0YShtb2R1bGVUeXBlOiBhbnkpOiBjcGwuQ29tcGlsZVNoYWxsb3dNb2R1bGVNZXRhZGF0YXxudWxsIHtcbiAgICBsZXQgY29tcGlsZU1ldGEgPSB0aGlzLl9zaGFsbG93TW9kdWxlQ2FjaGUuZ2V0KG1vZHVsZVR5cGUpO1xuICAgIGlmIChjb21waWxlTWV0YSkge1xuICAgICAgcmV0dXJuIGNvbXBpbGVNZXRhO1xuICAgIH1cblxuICAgIGNvbnN0IG5nTW9kdWxlTWV0YSA9XG4gICAgICAgIGZpbmRMYXN0KHRoaXMuX3JlZmxlY3Rvci5zaGFsbG93QW5ub3RhdGlvbnMobW9kdWxlVHlwZSksIGNyZWF0ZU5nTW9kdWxlLmlzVHlwZU9mKTtcblxuICAgIGNvbXBpbGVNZXRhID0ge1xuICAgICAgdHlwZTogdGhpcy5fZ2V0VHlwZU1ldGFkYXRhKG1vZHVsZVR5cGUpLFxuICAgICAgcmF3RXhwb3J0czogbmdNb2R1bGVNZXRhLmV4cG9ydHMsXG4gICAgICByYXdJbXBvcnRzOiBuZ01vZHVsZU1ldGEuaW1wb3J0cyxcbiAgICAgIHJhd1Byb3ZpZGVyczogbmdNb2R1bGVNZXRhLnByb3ZpZGVycyxcbiAgICB9O1xuXG4gICAgdGhpcy5fc2hhbGxvd01vZHVsZUNhY2hlLnNldChtb2R1bGVUeXBlLCBjb21waWxlTWV0YSk7XG4gICAgcmV0dXJuIGNvbXBpbGVNZXRhO1xuICB9XG5cbiAgZ2V0TmdNb2R1bGVNZXRhZGF0YShcbiAgICAgIG1vZHVsZVR5cGU6IGFueSwgdGhyb3dJZk5vdEZvdW5kID0gdHJ1ZSxcbiAgICAgIGFscmVhZHlDb2xsZWN0aW5nOiBTZXQ8YW55PnxudWxsID0gbnVsbCk6IGNwbC5Db21waWxlTmdNb2R1bGVNZXRhZGF0YXxudWxsIHtcbiAgICBtb2R1bGVUeXBlID0gcmVzb2x2ZUZvcndhcmRSZWYobW9kdWxlVHlwZSk7XG4gICAgbGV0IGNvbXBpbGVNZXRhID0gdGhpcy5fbmdNb2R1bGVDYWNoZS5nZXQobW9kdWxlVHlwZSk7XG4gICAgaWYgKGNvbXBpbGVNZXRhKSB7XG4gICAgICByZXR1cm4gY29tcGlsZU1ldGE7XG4gICAgfVxuICAgIGNvbnN0IG1ldGEgPSB0aGlzLl9uZ01vZHVsZVJlc29sdmVyLnJlc29sdmUobW9kdWxlVHlwZSwgdGhyb3dJZk5vdEZvdW5kKTtcbiAgICBpZiAoIW1ldGEpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCBkZWNsYXJlZERpcmVjdGl2ZXM6IGNwbC5Db21waWxlSWRlbnRpZmllck1ldGFkYXRhW10gPSBbXTtcbiAgICBjb25zdCBleHBvcnRlZE5vbk1vZHVsZUlkZW50aWZpZXJzOiBjcGwuQ29tcGlsZUlkZW50aWZpZXJNZXRhZGF0YVtdID0gW107XG4gICAgY29uc3QgZGVjbGFyZWRQaXBlczogY3BsLkNvbXBpbGVJZGVudGlmaWVyTWV0YWRhdGFbXSA9IFtdO1xuICAgIGNvbnN0IGltcG9ydGVkTW9kdWxlczogY3BsLkNvbXBpbGVOZ01vZHVsZVN1bW1hcnlbXSA9IFtdO1xuICAgIGNvbnN0IGV4cG9ydGVkTW9kdWxlczogY3BsLkNvbXBpbGVOZ01vZHVsZVN1bW1hcnlbXSA9IFtdO1xuICAgIGNvbnN0IHByb3ZpZGVyczogY3BsLkNvbXBpbGVQcm92aWRlck1ldGFkYXRhW10gPSBbXTtcbiAgICBjb25zdCBlbnRyeUNvbXBvbmVudHM6IGNwbC5Db21waWxlRW50cnlDb21wb25lbnRNZXRhZGF0YVtdID0gW107XG4gICAgY29uc3QgYm9vdHN0cmFwQ29tcG9uZW50czogY3BsLkNvbXBpbGVJZGVudGlmaWVyTWV0YWRhdGFbXSA9IFtdO1xuICAgIGNvbnN0IHNjaGVtYXM6IFNjaGVtYU1ldGFkYXRhW10gPSBbXTtcblxuICAgIGlmIChtZXRhLmltcG9ydHMpIHtcbiAgICAgIGZsYXR0ZW5BbmREZWR1cGVBcnJheShtZXRhLmltcG9ydHMpLmZvckVhY2goKGltcG9ydGVkVHlwZSkgPT4ge1xuICAgICAgICBsZXQgaW1wb3J0ZWRNb2R1bGVUeXBlOiBUeXBlID0gdW5kZWZpbmVkICE7XG4gICAgICAgIGlmIChpc1ZhbGlkVHlwZShpbXBvcnRlZFR5cGUpKSB7XG4gICAgICAgICAgaW1wb3J0ZWRNb2R1bGVUeXBlID0gaW1wb3J0ZWRUeXBlO1xuICAgICAgICB9IGVsc2UgaWYgKGltcG9ydGVkVHlwZSAmJiBpbXBvcnRlZFR5cGUubmdNb2R1bGUpIHtcbiAgICAgICAgICBjb25zdCBtb2R1bGVXaXRoUHJvdmlkZXJzOiBNb2R1bGVXaXRoUHJvdmlkZXJzID0gaW1wb3J0ZWRUeXBlO1xuICAgICAgICAgIGltcG9ydGVkTW9kdWxlVHlwZSA9IG1vZHVsZVdpdGhQcm92aWRlcnMubmdNb2R1bGU7XG4gICAgICAgICAgaWYgKG1vZHVsZVdpdGhQcm92aWRlcnMucHJvdmlkZXJzKSB7XG4gICAgICAgICAgICBwcm92aWRlcnMucHVzaCguLi50aGlzLl9nZXRQcm92aWRlcnNNZXRhZGF0YShcbiAgICAgICAgICAgICAgICBtb2R1bGVXaXRoUHJvdmlkZXJzLnByb3ZpZGVycywgZW50cnlDb21wb25lbnRzLFxuICAgICAgICAgICAgICAgIGBwcm92aWRlciBmb3IgdGhlIE5nTW9kdWxlICcke3N0cmluZ2lmeVR5cGUoaW1wb3J0ZWRNb2R1bGVUeXBlKX0nYCwgW10sXG4gICAgICAgICAgICAgICAgaW1wb3J0ZWRUeXBlKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGltcG9ydGVkTW9kdWxlVHlwZSkge1xuICAgICAgICAgIGlmICh0aGlzLl9jaGVja1NlbGZJbXBvcnQobW9kdWxlVHlwZSwgaW1wb3J0ZWRNb2R1bGVUeXBlKSkgcmV0dXJuO1xuICAgICAgICAgIGlmICghYWxyZWFkeUNvbGxlY3RpbmcpIGFscmVhZHlDb2xsZWN0aW5nID0gbmV3IFNldCgpO1xuICAgICAgICAgIGlmIChhbHJlYWR5Q29sbGVjdGluZy5oYXMoaW1wb3J0ZWRNb2R1bGVUeXBlKSkge1xuICAgICAgICAgICAgdGhpcy5fcmVwb3J0RXJyb3IoXG4gICAgICAgICAgICAgICAgc3ludGF4RXJyb3IoXG4gICAgICAgICAgICAgICAgICAgIGAke3RoaXMuX2dldFR5cGVEZXNjcmlwdG9yKGltcG9ydGVkTW9kdWxlVHlwZSl9ICcke3N0cmluZ2lmeVR5cGUoaW1wb3J0ZWRUeXBlKX0nIGlzIGltcG9ydGVkIHJlY3Vyc2l2ZWx5IGJ5IHRoZSBtb2R1bGUgJyR7c3RyaW5naWZ5VHlwZShtb2R1bGVUeXBlKX0nLmApLFxuICAgICAgICAgICAgICAgIG1vZHVsZVR5cGUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhbHJlYWR5Q29sbGVjdGluZy5hZGQoaW1wb3J0ZWRNb2R1bGVUeXBlKTtcbiAgICAgICAgICBjb25zdCBpbXBvcnRlZE1vZHVsZVN1bW1hcnkgPVxuICAgICAgICAgICAgICB0aGlzLmdldE5nTW9kdWxlU3VtbWFyeShpbXBvcnRlZE1vZHVsZVR5cGUsIGFscmVhZHlDb2xsZWN0aW5nKTtcbiAgICAgICAgICBhbHJlYWR5Q29sbGVjdGluZy5kZWxldGUoaW1wb3J0ZWRNb2R1bGVUeXBlKTtcbiAgICAgICAgICBpZiAoIWltcG9ydGVkTW9kdWxlU3VtbWFyeSkge1xuICAgICAgICAgICAgdGhpcy5fcmVwb3J0RXJyb3IoXG4gICAgICAgICAgICAgICAgc3ludGF4RXJyb3IoXG4gICAgICAgICAgICAgICAgICAgIGBVbmV4cGVjdGVkICR7dGhpcy5fZ2V0VHlwZURlc2NyaXB0b3IoaW1wb3J0ZWRUeXBlKX0gJyR7c3RyaW5naWZ5VHlwZShpbXBvcnRlZFR5cGUpfScgaW1wb3J0ZWQgYnkgdGhlIG1vZHVsZSAnJHtzdHJpbmdpZnlUeXBlKG1vZHVsZVR5cGUpfScuIFBsZWFzZSBhZGQgYSBATmdNb2R1bGUgYW5ub3RhdGlvbi5gKSxcbiAgICAgICAgICAgICAgICBtb2R1bGVUeXBlKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgaW1wb3J0ZWRNb2R1bGVzLnB1c2goaW1wb3J0ZWRNb2R1bGVTdW1tYXJ5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLl9yZXBvcnRFcnJvcihcbiAgICAgICAgICAgICAgc3ludGF4RXJyb3IoXG4gICAgICAgICAgICAgICAgICBgVW5leHBlY3RlZCB2YWx1ZSAnJHtzdHJpbmdpZnlUeXBlKGltcG9ydGVkVHlwZSl9JyBpbXBvcnRlZCBieSB0aGUgbW9kdWxlICcke3N0cmluZ2lmeVR5cGUobW9kdWxlVHlwZSl9J2ApLFxuICAgICAgICAgICAgICBtb2R1bGVUeXBlKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChtZXRhLmV4cG9ydHMpIHtcbiAgICAgIGZsYXR0ZW5BbmREZWR1cGVBcnJheShtZXRhLmV4cG9ydHMpLmZvckVhY2goKGV4cG9ydGVkVHlwZSkgPT4ge1xuICAgICAgICBpZiAoIWlzVmFsaWRUeXBlKGV4cG9ydGVkVHlwZSkpIHtcbiAgICAgICAgICB0aGlzLl9yZXBvcnRFcnJvcihcbiAgICAgICAgICAgICAgc3ludGF4RXJyb3IoXG4gICAgICAgICAgICAgICAgICBgVW5leHBlY3RlZCB2YWx1ZSAnJHtzdHJpbmdpZnlUeXBlKGV4cG9ydGVkVHlwZSl9JyBleHBvcnRlZCBieSB0aGUgbW9kdWxlICcke3N0cmluZ2lmeVR5cGUobW9kdWxlVHlwZSl9J2ApLFxuICAgICAgICAgICAgICBtb2R1bGVUeXBlKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFhbHJlYWR5Q29sbGVjdGluZykgYWxyZWFkeUNvbGxlY3RpbmcgPSBuZXcgU2V0KCk7XG4gICAgICAgIGlmIChhbHJlYWR5Q29sbGVjdGluZy5oYXMoZXhwb3J0ZWRUeXBlKSkge1xuICAgICAgICAgIHRoaXMuX3JlcG9ydEVycm9yKFxuICAgICAgICAgICAgICBzeW50YXhFcnJvcihcbiAgICAgICAgICAgICAgICAgIGAke3RoaXMuX2dldFR5cGVEZXNjcmlwdG9yKGV4cG9ydGVkVHlwZSl9ICcke3N0cmluZ2lmeShleHBvcnRlZFR5cGUpfScgaXMgZXhwb3J0ZWQgcmVjdXJzaXZlbHkgYnkgdGhlIG1vZHVsZSAnJHtzdHJpbmdpZnlUeXBlKG1vZHVsZVR5cGUpfSdgKSxcbiAgICAgICAgICAgICAgbW9kdWxlVHlwZSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGFscmVhZHlDb2xsZWN0aW5nLmFkZChleHBvcnRlZFR5cGUpO1xuICAgICAgICBjb25zdCBleHBvcnRlZE1vZHVsZVN1bW1hcnkgPSB0aGlzLmdldE5nTW9kdWxlU3VtbWFyeShleHBvcnRlZFR5cGUsIGFscmVhZHlDb2xsZWN0aW5nKTtcbiAgICAgICAgYWxyZWFkeUNvbGxlY3RpbmcuZGVsZXRlKGV4cG9ydGVkVHlwZSk7XG4gICAgICAgIGlmIChleHBvcnRlZE1vZHVsZVN1bW1hcnkpIHtcbiAgICAgICAgICBleHBvcnRlZE1vZHVsZXMucHVzaChleHBvcnRlZE1vZHVsZVN1bW1hcnkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGV4cG9ydGVkTm9uTW9kdWxlSWRlbnRpZmllcnMucHVzaCh0aGlzLl9nZXRJZGVudGlmaWVyTWV0YWRhdGEoZXhwb3J0ZWRUeXBlKSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIE5vdGU6IFRoaXMgd2lsbCBiZSBtb2RpZmllZCBsYXRlciwgc28gd2UgcmVseSBvblxuICAgIC8vIGdldHRpbmcgYSBuZXcgaW5zdGFuY2UgZXZlcnkgdGltZSFcbiAgICBjb25zdCB0cmFuc2l0aXZlTW9kdWxlID0gdGhpcy5fZ2V0VHJhbnNpdGl2ZU5nTW9kdWxlTWV0YWRhdGEoaW1wb3J0ZWRNb2R1bGVzLCBleHBvcnRlZE1vZHVsZXMpO1xuICAgIGlmIChtZXRhLmRlY2xhcmF0aW9ucykge1xuICAgICAgZmxhdHRlbkFuZERlZHVwZUFycmF5KG1ldGEuZGVjbGFyYXRpb25zKS5mb3JFYWNoKChkZWNsYXJlZFR5cGUpID0+IHtcbiAgICAgICAgaWYgKCFpc1ZhbGlkVHlwZShkZWNsYXJlZFR5cGUpKSB7XG4gICAgICAgICAgdGhpcy5fcmVwb3J0RXJyb3IoXG4gICAgICAgICAgICAgIHN5bnRheEVycm9yKFxuICAgICAgICAgICAgICAgICAgYFVuZXhwZWN0ZWQgdmFsdWUgJyR7c3RyaW5naWZ5VHlwZShkZWNsYXJlZFR5cGUpfScgZGVjbGFyZWQgYnkgdGhlIG1vZHVsZSAnJHtzdHJpbmdpZnlUeXBlKG1vZHVsZVR5cGUpfSdgKSxcbiAgICAgICAgICAgICAgbW9kdWxlVHlwZSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRlY2xhcmVkSWRlbnRpZmllciA9IHRoaXMuX2dldElkZW50aWZpZXJNZXRhZGF0YShkZWNsYXJlZFR5cGUpO1xuICAgICAgICBpZiAodGhpcy5pc0RpcmVjdGl2ZShkZWNsYXJlZFR5cGUpKSB7XG4gICAgICAgICAgdHJhbnNpdGl2ZU1vZHVsZS5hZGREaXJlY3RpdmUoZGVjbGFyZWRJZGVudGlmaWVyKTtcbiAgICAgICAgICBkZWNsYXJlZERpcmVjdGl2ZXMucHVzaChkZWNsYXJlZElkZW50aWZpZXIpO1xuICAgICAgICAgIHRoaXMuX2FkZFR5cGVUb01vZHVsZShkZWNsYXJlZFR5cGUsIG1vZHVsZVR5cGUpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuaXNQaXBlKGRlY2xhcmVkVHlwZSkpIHtcbiAgICAgICAgICB0cmFuc2l0aXZlTW9kdWxlLmFkZFBpcGUoZGVjbGFyZWRJZGVudGlmaWVyKTtcbiAgICAgICAgICB0cmFuc2l0aXZlTW9kdWxlLnBpcGVzLnB1c2goZGVjbGFyZWRJZGVudGlmaWVyKTtcbiAgICAgICAgICBkZWNsYXJlZFBpcGVzLnB1c2goZGVjbGFyZWRJZGVudGlmaWVyKTtcbiAgICAgICAgICB0aGlzLl9hZGRUeXBlVG9Nb2R1bGUoZGVjbGFyZWRUeXBlLCBtb2R1bGVUeXBlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLl9yZXBvcnRFcnJvcihcbiAgICAgICAgICAgICAgc3ludGF4RXJyb3IoXG4gICAgICAgICAgICAgICAgICBgVW5leHBlY3RlZCAke3RoaXMuX2dldFR5cGVEZXNjcmlwdG9yKGRlY2xhcmVkVHlwZSl9ICcke3N0cmluZ2lmeVR5cGUoZGVjbGFyZWRUeXBlKX0nIGRlY2xhcmVkIGJ5IHRoZSBtb2R1bGUgJyR7c3RyaW5naWZ5VHlwZShtb2R1bGVUeXBlKX0nLiBQbGVhc2UgYWRkIGEgQFBpcGUvQERpcmVjdGl2ZS9AQ29tcG9uZW50IGFubm90YXRpb24uYCksXG4gICAgICAgICAgICAgIG1vZHVsZVR5cGUpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgZXhwb3J0ZWREaXJlY3RpdmVzOiBjcGwuQ29tcGlsZUlkZW50aWZpZXJNZXRhZGF0YVtdID0gW107XG4gICAgY29uc3QgZXhwb3J0ZWRQaXBlczogY3BsLkNvbXBpbGVJZGVudGlmaWVyTWV0YWRhdGFbXSA9IFtdO1xuICAgIGV4cG9ydGVkTm9uTW9kdWxlSWRlbnRpZmllcnMuZm9yRWFjaCgoZXhwb3J0ZWRJZCkgPT4ge1xuICAgICAgaWYgKHRyYW5zaXRpdmVNb2R1bGUuZGlyZWN0aXZlc1NldC5oYXMoZXhwb3J0ZWRJZC5yZWZlcmVuY2UpKSB7XG4gICAgICAgIGV4cG9ydGVkRGlyZWN0aXZlcy5wdXNoKGV4cG9ydGVkSWQpO1xuICAgICAgICB0cmFuc2l0aXZlTW9kdWxlLmFkZEV4cG9ydGVkRGlyZWN0aXZlKGV4cG9ydGVkSWQpO1xuICAgICAgfSBlbHNlIGlmICh0cmFuc2l0aXZlTW9kdWxlLnBpcGVzU2V0LmhhcyhleHBvcnRlZElkLnJlZmVyZW5jZSkpIHtcbiAgICAgICAgZXhwb3J0ZWRQaXBlcy5wdXNoKGV4cG9ydGVkSWQpO1xuICAgICAgICB0cmFuc2l0aXZlTW9kdWxlLmFkZEV4cG9ydGVkUGlwZShleHBvcnRlZElkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3JlcG9ydEVycm9yKFxuICAgICAgICAgICAgc3ludGF4RXJyb3IoXG4gICAgICAgICAgICAgICAgYENhbid0IGV4cG9ydCAke3RoaXMuX2dldFR5cGVEZXNjcmlwdG9yKGV4cG9ydGVkSWQucmVmZXJlbmNlKX0gJHtzdHJpbmdpZnlUeXBlKGV4cG9ydGVkSWQucmVmZXJlbmNlKX0gZnJvbSAke3N0cmluZ2lmeVR5cGUobW9kdWxlVHlwZSl9IGFzIGl0IHdhcyBuZWl0aGVyIGRlY2xhcmVkIG5vciBpbXBvcnRlZCFgKSxcbiAgICAgICAgICAgIG1vZHVsZVR5cGUpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBUaGUgcHJvdmlkZXJzIG9mIHRoZSBtb2R1bGUgaGF2ZSB0byBnbyBsYXN0XG4gICAgLy8gc28gdGhhdCB0aGV5IG92ZXJ3cml0ZSBhbnkgb3RoZXIgcHJvdmlkZXIgd2UgYWxyZWFkeSBhZGRlZC5cbiAgICBpZiAobWV0YS5wcm92aWRlcnMpIHtcbiAgICAgIHByb3ZpZGVycy5wdXNoKC4uLnRoaXMuX2dldFByb3ZpZGVyc01ldGFkYXRhKFxuICAgICAgICAgIG1ldGEucHJvdmlkZXJzLCBlbnRyeUNvbXBvbmVudHMsXG4gICAgICAgICAgYHByb3ZpZGVyIGZvciB0aGUgTmdNb2R1bGUgJyR7c3RyaW5naWZ5VHlwZShtb2R1bGVUeXBlKX0nYCwgW10sIG1vZHVsZVR5cGUpKTtcbiAgICB9XG5cbiAgICBpZiAobWV0YS5lbnRyeUNvbXBvbmVudHMpIHtcbiAgICAgIGVudHJ5Q29tcG9uZW50cy5wdXNoKC4uLmZsYXR0ZW5BbmREZWR1cGVBcnJheShtZXRhLmVudHJ5Q29tcG9uZW50cylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAubWFwKHR5cGUgPT4gdGhpcy5fZ2V0RW50cnlDb21wb25lbnRNZXRhZGF0YSh0eXBlKSAhKSk7XG4gICAgfVxuXG4gICAgaWYgKG1ldGEuYm9vdHN0cmFwKSB7XG4gICAgICBmbGF0dGVuQW5kRGVkdXBlQXJyYXkobWV0YS5ib290c3RyYXApLmZvckVhY2godHlwZSA9PiB7XG4gICAgICAgIGlmICghaXNWYWxpZFR5cGUodHlwZSkpIHtcbiAgICAgICAgICB0aGlzLl9yZXBvcnRFcnJvcihcbiAgICAgICAgICAgICAgc3ludGF4RXJyb3IoXG4gICAgICAgICAgICAgICAgICBgVW5leHBlY3RlZCB2YWx1ZSAnJHtzdHJpbmdpZnlUeXBlKHR5cGUpfScgdXNlZCBpbiB0aGUgYm9vdHN0cmFwIHByb3BlcnR5IG9mIG1vZHVsZSAnJHtzdHJpbmdpZnlUeXBlKG1vZHVsZVR5cGUpfSdgKSxcbiAgICAgICAgICAgICAgbW9kdWxlVHlwZSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGJvb3RzdHJhcENvbXBvbmVudHMucHVzaCh0aGlzLl9nZXRJZGVudGlmaWVyTWV0YWRhdGEodHlwZSkpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgZW50cnlDb21wb25lbnRzLnB1c2goXG4gICAgICAgIC4uLmJvb3RzdHJhcENvbXBvbmVudHMubWFwKHR5cGUgPT4gdGhpcy5fZ2V0RW50cnlDb21wb25lbnRNZXRhZGF0YSh0eXBlLnJlZmVyZW5jZSkgISkpO1xuXG4gICAgaWYgKG1ldGEuc2NoZW1hcykge1xuICAgICAgc2NoZW1hcy5wdXNoKC4uLmZsYXR0ZW5BbmREZWR1cGVBcnJheShtZXRhLnNjaGVtYXMpKTtcbiAgICB9XG5cbiAgICBjb21waWxlTWV0YSA9IG5ldyBjcGwuQ29tcGlsZU5nTW9kdWxlTWV0YWRhdGEoe1xuICAgICAgdHlwZTogdGhpcy5fZ2V0VHlwZU1ldGFkYXRhKG1vZHVsZVR5cGUpLFxuICAgICAgcHJvdmlkZXJzLFxuICAgICAgZW50cnlDb21wb25lbnRzLFxuICAgICAgYm9vdHN0cmFwQ29tcG9uZW50cyxcbiAgICAgIHNjaGVtYXMsXG4gICAgICBkZWNsYXJlZERpcmVjdGl2ZXMsXG4gICAgICBleHBvcnRlZERpcmVjdGl2ZXMsXG4gICAgICBkZWNsYXJlZFBpcGVzLFxuICAgICAgZXhwb3J0ZWRQaXBlcyxcbiAgICAgIGltcG9ydGVkTW9kdWxlcyxcbiAgICAgIGV4cG9ydGVkTW9kdWxlcyxcbiAgICAgIHRyYW5zaXRpdmVNb2R1bGUsXG4gICAgICBpZDogbWV0YS5pZCB8fCBudWxsLFxuICAgIH0pO1xuXG4gICAgZW50cnlDb21wb25lbnRzLmZvckVhY2goKGlkKSA9PiB0cmFuc2l0aXZlTW9kdWxlLmFkZEVudHJ5Q29tcG9uZW50KGlkKSk7XG4gICAgcHJvdmlkZXJzLmZvckVhY2goKHByb3ZpZGVyKSA9PiB0cmFuc2l0aXZlTW9kdWxlLmFkZFByb3ZpZGVyKHByb3ZpZGVyLCBjb21waWxlTWV0YSAhLnR5cGUpKTtcbiAgICB0cmFuc2l0aXZlTW9kdWxlLmFkZE1vZHVsZShjb21waWxlTWV0YS50eXBlKTtcbiAgICB0aGlzLl9uZ01vZHVsZUNhY2hlLnNldChtb2R1bGVUeXBlLCBjb21waWxlTWV0YSk7XG4gICAgcmV0dXJuIGNvbXBpbGVNZXRhO1xuICB9XG5cbiAgcHJpdmF0ZSBfY2hlY2tTZWxmSW1wb3J0KG1vZHVsZVR5cGU6IFR5cGUsIGltcG9ydGVkTW9kdWxlVHlwZTogVHlwZSk6IGJvb2xlYW4ge1xuICAgIGlmIChtb2R1bGVUeXBlID09PSBpbXBvcnRlZE1vZHVsZVR5cGUpIHtcbiAgICAgIHRoaXMuX3JlcG9ydEVycm9yKFxuICAgICAgICAgIHN5bnRheEVycm9yKGAnJHtzdHJpbmdpZnlUeXBlKG1vZHVsZVR5cGUpfScgbW9kdWxlIGNhbid0IGltcG9ydCBpdHNlbGZgKSwgbW9kdWxlVHlwZSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0VHlwZURlc2NyaXB0b3IodHlwZTogVHlwZSk6IHN0cmluZyB7XG4gICAgaWYgKGlzVmFsaWRUeXBlKHR5cGUpKSB7XG4gICAgICBpZiAodGhpcy5pc0RpcmVjdGl2ZSh0eXBlKSkge1xuICAgICAgICByZXR1cm4gJ2RpcmVjdGl2ZSc7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLmlzUGlwZSh0eXBlKSkge1xuICAgICAgICByZXR1cm4gJ3BpcGUnO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5pc05nTW9kdWxlKHR5cGUpKSB7XG4gICAgICAgIHJldHVybiAnbW9kdWxlJztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoKHR5cGUgYXMgYW55KS5wcm92aWRlKSB7XG4gICAgICByZXR1cm4gJ3Byb3ZpZGVyJztcbiAgICB9XG5cbiAgICByZXR1cm4gJ3ZhbHVlJztcbiAgfVxuXG5cbiAgcHJpdmF0ZSBfYWRkVHlwZVRvTW9kdWxlKHR5cGU6IFR5cGUsIG1vZHVsZVR5cGU6IFR5cGUpIHtcbiAgICBjb25zdCBvbGRNb2R1bGUgPSB0aGlzLl9uZ01vZHVsZU9mVHlwZXMuZ2V0KHR5cGUpO1xuICAgIGlmIChvbGRNb2R1bGUgJiYgb2xkTW9kdWxlICE9PSBtb2R1bGVUeXBlKSB7XG4gICAgICB0aGlzLl9yZXBvcnRFcnJvcihcbiAgICAgICAgICBzeW50YXhFcnJvcihcbiAgICAgICAgICAgICAgYFR5cGUgJHtzdHJpbmdpZnlUeXBlKHR5cGUpfSBpcyBwYXJ0IG9mIHRoZSBkZWNsYXJhdGlvbnMgb2YgMiBtb2R1bGVzOiAke3N0cmluZ2lmeVR5cGUob2xkTW9kdWxlKX0gYW5kICR7c3RyaW5naWZ5VHlwZShtb2R1bGVUeXBlKX0hIGAgK1xuICAgICAgICAgICAgICBgUGxlYXNlIGNvbnNpZGVyIG1vdmluZyAke3N0cmluZ2lmeVR5cGUodHlwZSl9IHRvIGEgaGlnaGVyIG1vZHVsZSB0aGF0IGltcG9ydHMgJHtzdHJpbmdpZnlUeXBlKG9sZE1vZHVsZSl9IGFuZCAke3N0cmluZ2lmeVR5cGUobW9kdWxlVHlwZSl9LiBgICtcbiAgICAgICAgICAgICAgYFlvdSBjYW4gYWxzbyBjcmVhdGUgYSBuZXcgTmdNb2R1bGUgdGhhdCBleHBvcnRzIGFuZCBpbmNsdWRlcyAke3N0cmluZ2lmeVR5cGUodHlwZSl9IHRoZW4gaW1wb3J0IHRoYXQgTmdNb2R1bGUgaW4gJHtzdHJpbmdpZnlUeXBlKG9sZE1vZHVsZSl9IGFuZCAke3N0cmluZ2lmeVR5cGUobW9kdWxlVHlwZSl9LmApLFxuICAgICAgICAgIG1vZHVsZVR5cGUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLl9uZ01vZHVsZU9mVHlwZXMuc2V0KHR5cGUsIG1vZHVsZVR5cGUpO1xuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0VHJhbnNpdGl2ZU5nTW9kdWxlTWV0YWRhdGEoXG4gICAgICBpbXBvcnRlZE1vZHVsZXM6IGNwbC5Db21waWxlTmdNb2R1bGVTdW1tYXJ5W10sXG4gICAgICBleHBvcnRlZE1vZHVsZXM6IGNwbC5Db21waWxlTmdNb2R1bGVTdW1tYXJ5W10pOiBjcGwuVHJhbnNpdGl2ZUNvbXBpbGVOZ01vZHVsZU1ldGFkYXRhIHtcbiAgICAvLyBjb2xsZWN0IGBwcm92aWRlcnNgIC8gYGVudHJ5Q29tcG9uZW50c2AgZnJvbSBhbGwgaW1wb3J0ZWQgYW5kIGFsbCBleHBvcnRlZCBtb2R1bGVzXG4gICAgY29uc3QgcmVzdWx0ID0gbmV3IGNwbC5UcmFuc2l0aXZlQ29tcGlsZU5nTW9kdWxlTWV0YWRhdGEoKTtcbiAgICBjb25zdCBtb2R1bGVzQnlUb2tlbiA9IG5ldyBNYXA8YW55LCBTZXQ8YW55Pj4oKTtcbiAgICBpbXBvcnRlZE1vZHVsZXMuY29uY2F0KGV4cG9ydGVkTW9kdWxlcykuZm9yRWFjaCgobW9kU3VtbWFyeSkgPT4ge1xuICAgICAgbW9kU3VtbWFyeS5tb2R1bGVzLmZvckVhY2goKG1vZCkgPT4gcmVzdWx0LmFkZE1vZHVsZShtb2QpKTtcbiAgICAgIG1vZFN1bW1hcnkuZW50cnlDb21wb25lbnRzLmZvckVhY2goKGNvbXApID0+IHJlc3VsdC5hZGRFbnRyeUNvbXBvbmVudChjb21wKSk7XG4gICAgICBjb25zdCBhZGRlZFRva2VucyA9IG5ldyBTZXQ8YW55PigpO1xuICAgICAgbW9kU3VtbWFyeS5wcm92aWRlcnMuZm9yRWFjaCgoZW50cnkpID0+IHtcbiAgICAgICAgY29uc3QgdG9rZW5SZWYgPSBjcGwudG9rZW5SZWZlcmVuY2UoZW50cnkucHJvdmlkZXIudG9rZW4pO1xuICAgICAgICBsZXQgcHJldk1vZHVsZXMgPSBtb2R1bGVzQnlUb2tlbi5nZXQodG9rZW5SZWYpO1xuICAgICAgICBpZiAoIXByZXZNb2R1bGVzKSB7XG4gICAgICAgICAgcHJldk1vZHVsZXMgPSBuZXcgU2V0PGFueT4oKTtcbiAgICAgICAgICBtb2R1bGVzQnlUb2tlbi5zZXQodG9rZW5SZWYsIHByZXZNb2R1bGVzKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtb2R1bGVSZWYgPSBlbnRyeS5tb2R1bGUucmVmZXJlbmNlO1xuICAgICAgICAvLyBOb3RlOiB0aGUgcHJvdmlkZXJzIG9mIG9uZSBtb2R1bGUgbWF5IHN0aWxsIGNvbnRhaW4gbXVsdGlwbGUgcHJvdmlkZXJzXG4gICAgICAgIC8vIHBlciB0b2tlbiAoZS5nLiBmb3IgbXVsdGkgcHJvdmlkZXJzKSwgYW5kIHdlIG5lZWQgdG8gcHJlc2VydmUgdGhlc2UuXG4gICAgICAgIGlmIChhZGRlZFRva2Vucy5oYXModG9rZW5SZWYpIHx8ICFwcmV2TW9kdWxlcy5oYXMobW9kdWxlUmVmKSkge1xuICAgICAgICAgIHByZXZNb2R1bGVzLmFkZChtb2R1bGVSZWYpO1xuICAgICAgICAgIGFkZGVkVG9rZW5zLmFkZCh0b2tlblJlZik7XG4gICAgICAgICAgcmVzdWx0LmFkZFByb3ZpZGVyKGVudHJ5LnByb3ZpZGVyLCBlbnRyeS5tb2R1bGUpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBleHBvcnRlZE1vZHVsZXMuZm9yRWFjaCgobW9kU3VtbWFyeSkgPT4ge1xuICAgICAgbW9kU3VtbWFyeS5leHBvcnRlZERpcmVjdGl2ZXMuZm9yRWFjaCgoaWQpID0+IHJlc3VsdC5hZGRFeHBvcnRlZERpcmVjdGl2ZShpZCkpO1xuICAgICAgbW9kU3VtbWFyeS5leHBvcnRlZFBpcGVzLmZvckVhY2goKGlkKSA9PiByZXN1bHQuYWRkRXhwb3J0ZWRQaXBlKGlkKSk7XG4gICAgfSk7XG4gICAgaW1wb3J0ZWRNb2R1bGVzLmZvckVhY2goKG1vZFN1bW1hcnkpID0+IHtcbiAgICAgIG1vZFN1bW1hcnkuZXhwb3J0ZWREaXJlY3RpdmVzLmZvckVhY2goKGlkKSA9PiByZXN1bHQuYWRkRGlyZWN0aXZlKGlkKSk7XG4gICAgICBtb2RTdW1tYXJ5LmV4cG9ydGVkUGlwZXMuZm9yRWFjaCgoaWQpID0+IHJlc3VsdC5hZGRQaXBlKGlkKSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHByaXZhdGUgX2dldElkZW50aWZpZXJNZXRhZGF0YSh0eXBlOiBUeXBlKTogY3BsLkNvbXBpbGVJZGVudGlmaWVyTWV0YWRhdGEge1xuICAgIHR5cGUgPSByZXNvbHZlRm9yd2FyZFJlZih0eXBlKTtcbiAgICByZXR1cm4ge3JlZmVyZW5jZTogdHlwZX07XG4gIH1cblxuICBpc0luamVjdGFibGUodHlwZTogYW55KTogYm9vbGVhbiB7XG4gICAgY29uc3QgYW5ub3RhdGlvbnMgPSB0aGlzLl9yZWZsZWN0b3IudHJ5QW5ub3RhdGlvbnModHlwZSk7XG4gICAgcmV0dXJuIGFubm90YXRpb25zLnNvbWUoYW5uID0+IGNyZWF0ZUluamVjdGFibGUuaXNUeXBlT2YoYW5uKSk7XG4gIH1cblxuICBnZXRJbmplY3RhYmxlU3VtbWFyeSh0eXBlOiBhbnkpOiBjcGwuQ29tcGlsZVR5cGVTdW1tYXJ5IHtcbiAgICByZXR1cm4ge1xuICAgICAgc3VtbWFyeUtpbmQ6IGNwbC5Db21waWxlU3VtbWFyeUtpbmQuSW5qZWN0YWJsZSxcbiAgICAgIHR5cGU6IHRoaXMuX2dldFR5cGVNZXRhZGF0YSh0eXBlLCBudWxsLCBmYWxzZSlcbiAgICB9O1xuICB9XG5cbiAgZ2V0SW5qZWN0YWJsZU1ldGFkYXRhKFxuICAgICAgdHlwZTogYW55LCBkZXBlbmRlbmNpZXM6IGFueVtdfG51bGwgPSBudWxsLFxuICAgICAgdGhyb3dPblVua25vd25EZXBzOiBib29sZWFuID0gdHJ1ZSk6IGNwbC5Db21waWxlSW5qZWN0YWJsZU1ldGFkYXRhfG51bGwge1xuICAgIGNvbnN0IHR5cGVTdW1tYXJ5ID0gdGhpcy5fbG9hZFN1bW1hcnkodHlwZSwgY3BsLkNvbXBpbGVTdW1tYXJ5S2luZC5JbmplY3RhYmxlKTtcbiAgICBjb25zdCB0eXBlTWV0YWRhdGEgPSB0eXBlU3VtbWFyeSA/XG4gICAgICAgIHR5cGVTdW1tYXJ5LnR5cGUgOlxuICAgICAgICB0aGlzLl9nZXRUeXBlTWV0YWRhdGEodHlwZSwgZGVwZW5kZW5jaWVzLCB0aHJvd09uVW5rbm93bkRlcHMpO1xuXG4gICAgY29uc3QgYW5ub3RhdGlvbnM6IEluamVjdGFibGVbXSA9XG4gICAgICAgIHRoaXMuX3JlZmxlY3Rvci5hbm5vdGF0aW9ucyh0eXBlKS5maWx0ZXIoYW5uID0+IGNyZWF0ZUluamVjdGFibGUuaXNUeXBlT2YoYW5uKSk7XG5cbiAgICBpZiAoYW5ub3RhdGlvbnMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCBtZXRhID0gYW5ub3RhdGlvbnNbYW5ub3RhdGlvbnMubGVuZ3RoIC0gMV07XG4gICAgcmV0dXJuIHtcbiAgICAgIHN5bWJvbDogdHlwZSxcbiAgICAgIHR5cGU6IHR5cGVNZXRhZGF0YSxcbiAgICAgIHByb3ZpZGVkSW46IG1ldGEucHJvdmlkZWRJbixcbiAgICAgIHVzZVZhbHVlOiBtZXRhLnVzZVZhbHVlLFxuICAgICAgdXNlQ2xhc3M6IG1ldGEudXNlQ2xhc3MsXG4gICAgICB1c2VFeGlzdGluZzogbWV0YS51c2VFeGlzdGluZyxcbiAgICAgIHVzZUZhY3Rvcnk6IG1ldGEudXNlRmFjdG9yeSxcbiAgICAgIGRlcHM6IG1ldGEuZGVwcyxcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0VHlwZU1ldGFkYXRhKHR5cGU6IFR5cGUsIGRlcGVuZGVuY2llczogYW55W118bnVsbCA9IG51bGwsIHRocm93T25Vbmtub3duRGVwcyA9IHRydWUpOlxuICAgICAgY3BsLkNvbXBpbGVUeXBlTWV0YWRhdGEge1xuICAgIGNvbnN0IGlkZW50aWZpZXIgPSB0aGlzLl9nZXRJZGVudGlmaWVyTWV0YWRhdGEodHlwZSk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHJlZmVyZW5jZTogaWRlbnRpZmllci5yZWZlcmVuY2UsXG4gICAgICBkaURlcHM6IHRoaXMuX2dldERlcGVuZGVuY2llc01ldGFkYXRhKGlkZW50aWZpZXIucmVmZXJlbmNlLCBkZXBlbmRlbmNpZXMsIHRocm93T25Vbmtub3duRGVwcyksXG4gICAgICBsaWZlY3ljbGVIb29rczogZ2V0QWxsTGlmZWN5Y2xlSG9va3ModGhpcy5fcmVmbGVjdG9yLCBpZGVudGlmaWVyLnJlZmVyZW5jZSksXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgX2dldEZhY3RvcnlNZXRhZGF0YShmYWN0b3J5OiBGdW5jdGlvbiwgZGVwZW5kZW5jaWVzOiBhbnlbXXxudWxsID0gbnVsbCk6XG4gICAgICBjcGwuQ29tcGlsZUZhY3RvcnlNZXRhZGF0YSB7XG4gICAgZmFjdG9yeSA9IHJlc29sdmVGb3J3YXJkUmVmKGZhY3RvcnkpO1xuICAgIHJldHVybiB7cmVmZXJlbmNlOiBmYWN0b3J5LCBkaURlcHM6IHRoaXMuX2dldERlcGVuZGVuY2llc01ldGFkYXRhKGZhY3RvcnksIGRlcGVuZGVuY2llcyl9O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1ldGFkYXRhIGZvciB0aGUgZ2l2ZW4gcGlwZS5cbiAgICogVGhpcyBhc3N1bWVzIGBsb2FkTmdNb2R1bGVEaXJlY3RpdmVBbmRQaXBlTWV0YWRhdGFgIGhhcyBiZWVuIGNhbGxlZCBmaXJzdC5cbiAgICovXG4gIGdldFBpcGVNZXRhZGF0YShwaXBlVHlwZTogYW55KTogY3BsLkNvbXBpbGVQaXBlTWV0YWRhdGF8bnVsbCB7XG4gICAgY29uc3QgcGlwZU1ldGEgPSB0aGlzLl9waXBlQ2FjaGUuZ2V0KHBpcGVUeXBlKTtcbiAgICBpZiAoIXBpcGVNZXRhKSB7XG4gICAgICB0aGlzLl9yZXBvcnRFcnJvcihcbiAgICAgICAgICBzeW50YXhFcnJvcihcbiAgICAgICAgICAgICAgYElsbGVnYWwgc3RhdGU6IGdldFBpcGVNZXRhZGF0YSBjYW4gb25seSBiZSBjYWxsZWQgYWZ0ZXIgbG9hZE5nTW9kdWxlRGlyZWN0aXZlQW5kUGlwZU1ldGFkYXRhIGZvciBhIG1vZHVsZSB0aGF0IGRlY2xhcmVzIGl0LiBQaXBlICR7c3RyaW5naWZ5VHlwZShwaXBlVHlwZSl9LmApLFxuICAgICAgICAgIHBpcGVUeXBlKTtcbiAgICB9XG4gICAgcmV0dXJuIHBpcGVNZXRhIHx8IG51bGw7XG4gIH1cblxuICBnZXRQaXBlU3VtbWFyeShwaXBlVHlwZTogYW55KTogY3BsLkNvbXBpbGVQaXBlU3VtbWFyeSB7XG4gICAgY29uc3QgcGlwZVN1bW1hcnkgPVxuICAgICAgICA8Y3BsLkNvbXBpbGVQaXBlU3VtbWFyeT50aGlzLl9sb2FkU3VtbWFyeShwaXBlVHlwZSwgY3BsLkNvbXBpbGVTdW1tYXJ5S2luZC5QaXBlKTtcbiAgICBpZiAoIXBpcGVTdW1tYXJ5KSB7XG4gICAgICB0aGlzLl9yZXBvcnRFcnJvcihcbiAgICAgICAgICBzeW50YXhFcnJvcihcbiAgICAgICAgICAgICAgYElsbGVnYWwgc3RhdGU6IENvdWxkIG5vdCBsb2FkIHRoZSBzdW1tYXJ5IGZvciBwaXBlICR7c3RyaW5naWZ5VHlwZShwaXBlVHlwZSl9LmApLFxuICAgICAgICAgIHBpcGVUeXBlKTtcbiAgICB9XG4gICAgcmV0dXJuIHBpcGVTdW1tYXJ5O1xuICB9XG5cbiAgZ2V0T3JMb2FkUGlwZU1ldGFkYXRhKHBpcGVUeXBlOiBhbnkpOiBjcGwuQ29tcGlsZVBpcGVNZXRhZGF0YSB7XG4gICAgbGV0IHBpcGVNZXRhID0gdGhpcy5fcGlwZUNhY2hlLmdldChwaXBlVHlwZSk7XG4gICAgaWYgKCFwaXBlTWV0YSkge1xuICAgICAgcGlwZU1ldGEgPSB0aGlzLl9sb2FkUGlwZU1ldGFkYXRhKHBpcGVUeXBlKTtcbiAgICB9XG4gICAgcmV0dXJuIHBpcGVNZXRhO1xuICB9XG5cbiAgcHJpdmF0ZSBfbG9hZFBpcGVNZXRhZGF0YShwaXBlVHlwZTogYW55KTogY3BsLkNvbXBpbGVQaXBlTWV0YWRhdGEge1xuICAgIHBpcGVUeXBlID0gcmVzb2x2ZUZvcndhcmRSZWYocGlwZVR5cGUpO1xuICAgIGNvbnN0IHBpcGVBbm5vdGF0aW9uID0gdGhpcy5fcGlwZVJlc29sdmVyLnJlc29sdmUocGlwZVR5cGUpICE7XG5cbiAgICBjb25zdCBwaXBlTWV0YSA9IG5ldyBjcGwuQ29tcGlsZVBpcGVNZXRhZGF0YSh7XG4gICAgICB0eXBlOiB0aGlzLl9nZXRUeXBlTWV0YWRhdGEocGlwZVR5cGUpLFxuICAgICAgbmFtZTogcGlwZUFubm90YXRpb24ubmFtZSxcbiAgICAgIHB1cmU6ICEhcGlwZUFubm90YXRpb24ucHVyZVxuICAgIH0pO1xuICAgIHRoaXMuX3BpcGVDYWNoZS5zZXQocGlwZVR5cGUsIHBpcGVNZXRhKTtcbiAgICB0aGlzLl9zdW1tYXJ5Q2FjaGUuc2V0KHBpcGVUeXBlLCBwaXBlTWV0YS50b1N1bW1hcnkoKSk7XG4gICAgcmV0dXJuIHBpcGVNZXRhO1xuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0RGVwZW5kZW5jaWVzTWV0YWRhdGEoXG4gICAgICB0eXBlT3JGdW5jOiBUeXBlfEZ1bmN0aW9uLCBkZXBlbmRlbmNpZXM6IGFueVtdfG51bGwsXG4gICAgICB0aHJvd09uVW5rbm93bkRlcHMgPSB0cnVlKTogY3BsLkNvbXBpbGVEaURlcGVuZGVuY3lNZXRhZGF0YVtdIHtcbiAgICBsZXQgaGFzVW5rbm93bkRlcHMgPSBmYWxzZTtcbiAgICBjb25zdCBwYXJhbXMgPSBkZXBlbmRlbmNpZXMgfHwgdGhpcy5fcmVmbGVjdG9yLnBhcmFtZXRlcnModHlwZU9yRnVuYykgfHwgW107XG5cbiAgICBjb25zdCBkZXBlbmRlbmNpZXNNZXRhZGF0YTogY3BsLkNvbXBpbGVEaURlcGVuZGVuY3lNZXRhZGF0YVtdID0gcGFyYW1zLm1hcCgocGFyYW0pID0+IHtcbiAgICAgIGxldCBpc0F0dHJpYnV0ZSA9IGZhbHNlO1xuICAgICAgbGV0IGlzSG9zdCA9IGZhbHNlO1xuICAgICAgbGV0IGlzU2VsZiA9IGZhbHNlO1xuICAgICAgbGV0IGlzU2tpcFNlbGYgPSBmYWxzZTtcbiAgICAgIGxldCBpc09wdGlvbmFsID0gZmFsc2U7XG4gICAgICBsZXQgdG9rZW46IGFueSA9IG51bGw7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShwYXJhbSkpIHtcbiAgICAgICAgcGFyYW0uZm9yRWFjaCgocGFyYW1FbnRyeSkgPT4ge1xuICAgICAgICAgIGlmIChjcmVhdGVIb3N0LmlzVHlwZU9mKHBhcmFtRW50cnkpKSB7XG4gICAgICAgICAgICBpc0hvc3QgPSB0cnVlO1xuICAgICAgICAgIH0gZWxzZSBpZiAoY3JlYXRlU2VsZi5pc1R5cGVPZihwYXJhbUVudHJ5KSkge1xuICAgICAgICAgICAgaXNTZWxmID0gdHJ1ZTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGNyZWF0ZVNraXBTZWxmLmlzVHlwZU9mKHBhcmFtRW50cnkpKSB7XG4gICAgICAgICAgICBpc1NraXBTZWxmID0gdHJ1ZTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGNyZWF0ZU9wdGlvbmFsLmlzVHlwZU9mKHBhcmFtRW50cnkpKSB7XG4gICAgICAgICAgICBpc09wdGlvbmFsID0gdHJ1ZTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGNyZWF0ZUF0dHJpYnV0ZS5pc1R5cGVPZihwYXJhbUVudHJ5KSkge1xuICAgICAgICAgICAgaXNBdHRyaWJ1dGUgPSB0cnVlO1xuICAgICAgICAgICAgdG9rZW4gPSBwYXJhbUVudHJ5LmF0dHJpYnV0ZU5hbWU7XG4gICAgICAgICAgfSBlbHNlIGlmIChjcmVhdGVJbmplY3QuaXNUeXBlT2YocGFyYW1FbnRyeSkpIHtcbiAgICAgICAgICAgIHRva2VuID0gcGFyYW1FbnRyeS50b2tlbjtcbiAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgICBjcmVhdGVJbmplY3Rpb25Ub2tlbi5pc1R5cGVPZihwYXJhbUVudHJ5KSB8fCBwYXJhbUVudHJ5IGluc3RhbmNlb2YgU3RhdGljU3ltYm9sKSB7XG4gICAgICAgICAgICB0b2tlbiA9IHBhcmFtRW50cnk7XG4gICAgICAgICAgfSBlbHNlIGlmIChpc1ZhbGlkVHlwZShwYXJhbUVudHJ5KSAmJiB0b2tlbiA9PSBudWxsKSB7XG4gICAgICAgICAgICB0b2tlbiA9IHBhcmFtRW50cnk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRva2VuID0gcGFyYW07XG4gICAgICB9XG4gICAgICBpZiAodG9rZW4gPT0gbnVsbCkge1xuICAgICAgICBoYXNVbmtub3duRGVwcyA9IHRydWU7XG4gICAgICAgIHJldHVybiBudWxsICE7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGlzQXR0cmlidXRlLFxuICAgICAgICBpc0hvc3QsXG4gICAgICAgIGlzU2VsZixcbiAgICAgICAgaXNTa2lwU2VsZixcbiAgICAgICAgaXNPcHRpb25hbCxcbiAgICAgICAgdG9rZW46IHRoaXMuX2dldFRva2VuTWV0YWRhdGEodG9rZW4pXG4gICAgICB9O1xuXG4gICAgfSk7XG5cbiAgICBpZiAoaGFzVW5rbm93bkRlcHMpIHtcbiAgICAgIGNvbnN0IGRlcHNUb2tlbnMgPVxuICAgICAgICAgIGRlcGVuZGVuY2llc01ldGFkYXRhLm1hcCgoZGVwKSA9PiBkZXAgPyBzdHJpbmdpZnlUeXBlKGRlcC50b2tlbikgOiAnPycpLmpvaW4oJywgJyk7XG4gICAgICBjb25zdCBtZXNzYWdlID1cbiAgICAgICAgICBgQ2FuJ3QgcmVzb2x2ZSBhbGwgcGFyYW1ldGVycyBmb3IgJHtzdHJpbmdpZnlUeXBlKHR5cGVPckZ1bmMpfTogKCR7ZGVwc1Rva2Vuc30pLmA7XG4gICAgICBpZiAodGhyb3dPblVua25vd25EZXBzIHx8IHRoaXMuX2NvbmZpZy5zdHJpY3RJbmplY3Rpb25QYXJhbWV0ZXJzKSB7XG4gICAgICAgIHRoaXMuX3JlcG9ydEVycm9yKHN5bnRheEVycm9yKG1lc3NhZ2UpLCB0eXBlT3JGdW5jKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2NvbnNvbGUud2FybihgV2FybmluZzogJHttZXNzYWdlfSBUaGlzIHdpbGwgYmVjb21lIGFuIGVycm9yIGluIEFuZ3VsYXIgdjYueGApO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBkZXBlbmRlbmNpZXNNZXRhZGF0YTtcbiAgfVxuXG4gIHByaXZhdGUgX2dldFRva2VuTWV0YWRhdGEodG9rZW46IGFueSk6IGNwbC5Db21waWxlVG9rZW5NZXRhZGF0YSB7XG4gICAgdG9rZW4gPSByZXNvbHZlRm9yd2FyZFJlZih0b2tlbik7XG4gICAgbGV0IGNvbXBpbGVUb2tlbjogY3BsLkNvbXBpbGVUb2tlbk1ldGFkYXRhO1xuICAgIGlmICh0eXBlb2YgdG9rZW4gPT09ICdzdHJpbmcnKSB7XG4gICAgICBjb21waWxlVG9rZW4gPSB7dmFsdWU6IHRva2VufTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29tcGlsZVRva2VuID0ge2lkZW50aWZpZXI6IHtyZWZlcmVuY2U6IHRva2VufX07XG4gICAgfVxuICAgIHJldHVybiBjb21waWxlVG9rZW47XG4gIH1cblxuICBwcml2YXRlIF9nZXRQcm92aWRlcnNNZXRhZGF0YShcbiAgICAgIHByb3ZpZGVyczogUHJvdmlkZXJbXSwgdGFyZ2V0RW50cnlDb21wb25lbnRzOiBjcGwuQ29tcGlsZUVudHJ5Q29tcG9uZW50TWV0YWRhdGFbXSxcbiAgICAgIGRlYnVnSW5mbz86IHN0cmluZywgY29tcGlsZVByb3ZpZGVyczogY3BsLkNvbXBpbGVQcm92aWRlck1ldGFkYXRhW10gPSBbXSxcbiAgICAgIHR5cGU/OiBhbnkpOiBjcGwuQ29tcGlsZVByb3ZpZGVyTWV0YWRhdGFbXSB7XG4gICAgcHJvdmlkZXJzLmZvckVhY2goKHByb3ZpZGVyOiBhbnksIHByb3ZpZGVySWR4OiBudW1iZXIpID0+IHtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHByb3ZpZGVyKSkge1xuICAgICAgICB0aGlzLl9nZXRQcm92aWRlcnNNZXRhZGF0YShwcm92aWRlciwgdGFyZ2V0RW50cnlDb21wb25lbnRzLCBkZWJ1Z0luZm8sIGNvbXBpbGVQcm92aWRlcnMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcHJvdmlkZXIgPSByZXNvbHZlRm9yd2FyZFJlZihwcm92aWRlcik7XG4gICAgICAgIGxldCBwcm92aWRlck1ldGE6IGNwbC5Qcm92aWRlck1ldGEgPSB1bmRlZmluZWQgITtcbiAgICAgICAgaWYgKHByb3ZpZGVyICYmIHR5cGVvZiBwcm92aWRlciA9PT0gJ29iamVjdCcgJiYgcHJvdmlkZXIuaGFzT3duUHJvcGVydHkoJ3Byb3ZpZGUnKSkge1xuICAgICAgICAgIHRoaXMuX3ZhbGlkYXRlUHJvdmlkZXIocHJvdmlkZXIpO1xuICAgICAgICAgIHByb3ZpZGVyTWV0YSA9IG5ldyBjcGwuUHJvdmlkZXJNZXRhKHByb3ZpZGVyLnByb3ZpZGUsIHByb3ZpZGVyKTtcbiAgICAgICAgfSBlbHNlIGlmIChpc1ZhbGlkVHlwZShwcm92aWRlcikpIHtcbiAgICAgICAgICBwcm92aWRlck1ldGEgPSBuZXcgY3BsLlByb3ZpZGVyTWV0YShwcm92aWRlciwge3VzZUNsYXNzOiBwcm92aWRlcn0pO1xuICAgICAgICB9IGVsc2UgaWYgKHByb3ZpZGVyID09PSB2b2lkIDApIHtcbiAgICAgICAgICB0aGlzLl9yZXBvcnRFcnJvcihzeW50YXhFcnJvcihcbiAgICAgICAgICAgICAgYEVuY291bnRlcmVkIHVuZGVmaW5lZCBwcm92aWRlciEgVXN1YWxseSB0aGlzIG1lYW5zIHlvdSBoYXZlIGEgY2lyY3VsYXIgZGVwZW5kZW5jaWVzLiBUaGlzIG1pZ2h0IGJlIGNhdXNlZCBieSB1c2luZyAnYmFycmVsJyBpbmRleC50cyBmaWxlcy5gKSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IHByb3ZpZGVyc0luZm8gPVxuICAgICAgICAgICAgICAoPHN0cmluZ1tdPnByb3ZpZGVycy5yZWR1Y2UoXG4gICAgICAgICAgICAgICAgICAgKHNvRmFyOiBzdHJpbmdbXSwgc2VlblByb3ZpZGVyOiBhbnksIHNlZW5Qcm92aWRlcklkeDogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICBpZiAoc2VlblByb3ZpZGVySWR4IDwgcHJvdmlkZXJJZHgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgc29GYXIucHVzaChgJHtzdHJpbmdpZnlUeXBlKHNlZW5Qcm92aWRlcil9YCk7XG4gICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNlZW5Qcm92aWRlcklkeCA9PSBwcm92aWRlcklkeCkge1xuICAgICAgICAgICAgICAgICAgICAgICBzb0Zhci5wdXNoKGA/JHtzdHJpbmdpZnlUeXBlKHNlZW5Qcm92aWRlcil9P2ApO1xuICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzZWVuUHJvdmlkZXJJZHggPT0gcHJvdmlkZXJJZHggKyAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgIHNvRmFyLnB1c2goJy4uLicpO1xuICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNvRmFyO1xuICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgW10pKVxuICAgICAgICAgICAgICAgICAgLmpvaW4oJywgJyk7XG4gICAgICAgICAgdGhpcy5fcmVwb3J0RXJyb3IoXG4gICAgICAgICAgICAgIHN5bnRheEVycm9yKFxuICAgICAgICAgICAgICAgICAgYEludmFsaWQgJHtkZWJ1Z0luZm8gPyBkZWJ1Z0luZm8gOiAncHJvdmlkZXInfSAtIG9ubHkgaW5zdGFuY2VzIG9mIFByb3ZpZGVyIGFuZCBUeXBlIGFyZSBhbGxvd2VkLCBnb3Q6IFske3Byb3ZpZGVyc0luZm99XWApLFxuICAgICAgICAgICAgICB0eXBlKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHByb3ZpZGVyTWV0YS50b2tlbiA9PT1cbiAgICAgICAgICAgIHRoaXMuX3JlZmxlY3Rvci5yZXNvbHZlRXh0ZXJuYWxSZWZlcmVuY2UoSWRlbnRpZmllcnMuQU5BTFlaRV9GT1JfRU5UUllfQ09NUE9ORU5UUykpIHtcbiAgICAgICAgICB0YXJnZXRFbnRyeUNvbXBvbmVudHMucHVzaCguLi50aGlzLl9nZXRFbnRyeUNvbXBvbmVudHNGcm9tUHJvdmlkZXIocHJvdmlkZXJNZXRhLCB0eXBlKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29tcGlsZVByb3ZpZGVycy5wdXNoKHRoaXMuZ2V0UHJvdmlkZXJNZXRhZGF0YShwcm92aWRlck1ldGEpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBjb21waWxlUHJvdmlkZXJzO1xuICB9XG5cbiAgcHJpdmF0ZSBfdmFsaWRhdGVQcm92aWRlcihwcm92aWRlcjogYW55KTogdm9pZCB7XG4gICAgaWYgKHByb3ZpZGVyLmhhc093blByb3BlcnR5KCd1c2VDbGFzcycpICYmIHByb3ZpZGVyLnVzZUNsYXNzID09IG51bGwpIHtcbiAgICAgIHRoaXMuX3JlcG9ydEVycm9yKHN5bnRheEVycm9yKFxuICAgICAgICAgIGBJbnZhbGlkIHByb3ZpZGVyIGZvciAke3N0cmluZ2lmeVR5cGUocHJvdmlkZXIucHJvdmlkZSl9LiB1c2VDbGFzcyBjYW5ub3QgYmUgJHtwcm92aWRlci51c2VDbGFzc30uXG4gICAgICAgICAgIFVzdWFsbHkgaXQgaGFwcGVucyB3aGVuOlxuICAgICAgICAgICAxLiBUaGVyZSdzIGEgY2lyY3VsYXIgZGVwZW5kZW5jeSAobWlnaHQgYmUgY2F1c2VkIGJ5IHVzaW5nIGluZGV4LnRzIChiYXJyZWwpIGZpbGVzKS5cbiAgICAgICAgICAgMi4gQ2xhc3Mgd2FzIHVzZWQgYmVmb3JlIGl0IHdhcyBkZWNsYXJlZC4gVXNlIGZvcndhcmRSZWYgaW4gdGhpcyBjYXNlLmApKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9nZXRFbnRyeUNvbXBvbmVudHNGcm9tUHJvdmlkZXIocHJvdmlkZXI6IGNwbC5Qcm92aWRlck1ldGEsIHR5cGU/OiBhbnkpOlxuICAgICAgY3BsLkNvbXBpbGVFbnRyeUNvbXBvbmVudE1ldGFkYXRhW10ge1xuICAgIGNvbnN0IGNvbXBvbmVudHM6IGNwbC5Db21waWxlRW50cnlDb21wb25lbnRNZXRhZGF0YVtdID0gW107XG4gICAgY29uc3QgY29sbGVjdGVkSWRlbnRpZmllcnM6IGNwbC5Db21waWxlSWRlbnRpZmllck1ldGFkYXRhW10gPSBbXTtcblxuICAgIGlmIChwcm92aWRlci51c2VGYWN0b3J5IHx8IHByb3ZpZGVyLnVzZUV4aXN0aW5nIHx8IHByb3ZpZGVyLnVzZUNsYXNzKSB7XG4gICAgICB0aGlzLl9yZXBvcnRFcnJvcihcbiAgICAgICAgICBzeW50YXhFcnJvcihgVGhlIEFOQUxZWkVfRk9SX0VOVFJZX0NPTVBPTkVOVFMgdG9rZW4gb25seSBzdXBwb3J0cyB1c2VWYWx1ZSFgKSwgdHlwZSk7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgaWYgKCFwcm92aWRlci5tdWx0aSkge1xuICAgICAgdGhpcy5fcmVwb3J0RXJyb3IoXG4gICAgICAgICAgc3ludGF4RXJyb3IoYFRoZSBBTkFMWVpFX0ZPUl9FTlRSWV9DT01QT05FTlRTIHRva2VuIG9ubHkgc3VwcG9ydHMgJ211bHRpID0gdHJ1ZSchYCksXG4gICAgICAgICAgdHlwZSk7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgZXh0cmFjdElkZW50aWZpZXJzKHByb3ZpZGVyLnVzZVZhbHVlLCBjb2xsZWN0ZWRJZGVudGlmaWVycyk7XG4gICAgY29sbGVjdGVkSWRlbnRpZmllcnMuZm9yRWFjaCgoaWRlbnRpZmllcikgPT4ge1xuICAgICAgY29uc3QgZW50cnkgPSB0aGlzLl9nZXRFbnRyeUNvbXBvbmVudE1ldGFkYXRhKGlkZW50aWZpZXIucmVmZXJlbmNlLCBmYWxzZSk7XG4gICAgICBpZiAoZW50cnkpIHtcbiAgICAgICAgY29tcG9uZW50cy5wdXNoKGVudHJ5KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gY29tcG9uZW50cztcbiAgfVxuXG4gIHByaXZhdGUgX2dldEVudHJ5Q29tcG9uZW50TWV0YWRhdGEoZGlyVHlwZTogYW55LCB0aHJvd0lmTm90Rm91bmQgPSB0cnVlKTpcbiAgICAgIGNwbC5Db21waWxlRW50cnlDb21wb25lbnRNZXRhZGF0YXxudWxsIHtcbiAgICBjb25zdCBkaXJNZXRhID0gdGhpcy5nZXROb25Ob3JtYWxpemVkRGlyZWN0aXZlTWV0YWRhdGEoZGlyVHlwZSk7XG4gICAgaWYgKGRpck1ldGEgJiYgZGlyTWV0YS5tZXRhZGF0YS5pc0NvbXBvbmVudCkge1xuICAgICAgcmV0dXJuIHtjb21wb25lbnRUeXBlOiBkaXJUeXBlLCBjb21wb25lbnRGYWN0b3J5OiBkaXJNZXRhLm1ldGFkYXRhLmNvbXBvbmVudEZhY3RvcnkgIX07XG4gICAgfVxuICAgIGNvbnN0IGRpclN1bW1hcnkgPVxuICAgICAgICA8Y3BsLkNvbXBpbGVEaXJlY3RpdmVTdW1tYXJ5PnRoaXMuX2xvYWRTdW1tYXJ5KGRpclR5cGUsIGNwbC5Db21waWxlU3VtbWFyeUtpbmQuRGlyZWN0aXZlKTtcbiAgICBpZiAoZGlyU3VtbWFyeSAmJiBkaXJTdW1tYXJ5LmlzQ29tcG9uZW50KSB7XG4gICAgICByZXR1cm4ge2NvbXBvbmVudFR5cGU6IGRpclR5cGUsIGNvbXBvbmVudEZhY3Rvcnk6IGRpclN1bW1hcnkuY29tcG9uZW50RmFjdG9yeSAhfTtcbiAgICB9XG4gICAgaWYgKHRocm93SWZOb3RGb3VuZCkge1xuICAgICAgdGhyb3cgc3ludGF4RXJyb3IoYCR7ZGlyVHlwZS5uYW1lfSBjYW5ub3QgYmUgdXNlZCBhcyBhbiBlbnRyeSBjb21wb25lbnQuYCk7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0SW5qZWN0YWJsZVR5cGVNZXRhZGF0YSh0eXBlOiBUeXBlLCBkZXBlbmRlbmNpZXM6IGFueVtdfG51bGwgPSBudWxsKTpcbiAgICAgIGNwbC5Db21waWxlVHlwZU1ldGFkYXRhIHtcbiAgICBjb25zdCB0eXBlU3VtbWFyeSA9IHRoaXMuX2xvYWRTdW1tYXJ5KHR5cGUsIGNwbC5Db21waWxlU3VtbWFyeUtpbmQuSW5qZWN0YWJsZSk7XG4gICAgaWYgKHR5cGVTdW1tYXJ5KSB7XG4gICAgICByZXR1cm4gdHlwZVN1bW1hcnkudHlwZTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2dldFR5cGVNZXRhZGF0YSh0eXBlLCBkZXBlbmRlbmNpZXMpO1xuICB9XG5cbiAgZ2V0UHJvdmlkZXJNZXRhZGF0YShwcm92aWRlcjogY3BsLlByb3ZpZGVyTWV0YSk6IGNwbC5Db21waWxlUHJvdmlkZXJNZXRhZGF0YSB7XG4gICAgbGV0IGNvbXBpbGVEZXBzOiBjcGwuQ29tcGlsZURpRGVwZW5kZW5jeU1ldGFkYXRhW10gPSB1bmRlZmluZWQgITtcbiAgICBsZXQgY29tcGlsZVR5cGVNZXRhZGF0YTogY3BsLkNvbXBpbGVUeXBlTWV0YWRhdGEgPSBudWxsICE7XG4gICAgbGV0IGNvbXBpbGVGYWN0b3J5TWV0YWRhdGE6IGNwbC5Db21waWxlRmFjdG9yeU1ldGFkYXRhID0gbnVsbCAhO1xuICAgIGxldCB0b2tlbjogY3BsLkNvbXBpbGVUb2tlbk1ldGFkYXRhID0gdGhpcy5fZ2V0VG9rZW5NZXRhZGF0YShwcm92aWRlci50b2tlbik7XG5cbiAgICBpZiAocHJvdmlkZXIudXNlQ2xhc3MpIHtcbiAgICAgIGNvbXBpbGVUeXBlTWV0YWRhdGEgPVxuICAgICAgICAgIHRoaXMuX2dldEluamVjdGFibGVUeXBlTWV0YWRhdGEocHJvdmlkZXIudXNlQ2xhc3MsIHByb3ZpZGVyLmRlcGVuZGVuY2llcyk7XG4gICAgICBjb21waWxlRGVwcyA9IGNvbXBpbGVUeXBlTWV0YWRhdGEuZGlEZXBzO1xuICAgICAgaWYgKHByb3ZpZGVyLnRva2VuID09PSBwcm92aWRlci51c2VDbGFzcykge1xuICAgICAgICAvLyB1c2UgdGhlIGNvbXBpbGVUeXBlTWV0YWRhdGEgYXMgaXQgY29udGFpbnMgaW5mb3JtYXRpb24gYWJvdXQgbGlmZWN5Y2xlSG9va3MuLi5cbiAgICAgICAgdG9rZW4gPSB7aWRlbnRpZmllcjogY29tcGlsZVR5cGVNZXRhZGF0YX07XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChwcm92aWRlci51c2VGYWN0b3J5KSB7XG4gICAgICBjb21waWxlRmFjdG9yeU1ldGFkYXRhID0gdGhpcy5fZ2V0RmFjdG9yeU1ldGFkYXRhKHByb3ZpZGVyLnVzZUZhY3RvcnksIHByb3ZpZGVyLmRlcGVuZGVuY2llcyk7XG4gICAgICBjb21waWxlRGVwcyA9IGNvbXBpbGVGYWN0b3J5TWV0YWRhdGEuZGlEZXBzO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICB0b2tlbjogdG9rZW4sXG4gICAgICB1c2VDbGFzczogY29tcGlsZVR5cGVNZXRhZGF0YSxcbiAgICAgIHVzZVZhbHVlOiBwcm92aWRlci51c2VWYWx1ZSxcbiAgICAgIHVzZUZhY3Rvcnk6IGNvbXBpbGVGYWN0b3J5TWV0YWRhdGEsXG4gICAgICB1c2VFeGlzdGluZzogcHJvdmlkZXIudXNlRXhpc3RpbmcgPyB0aGlzLl9nZXRUb2tlbk1ldGFkYXRhKHByb3ZpZGVyLnVzZUV4aXN0aW5nKSA6IHVuZGVmaW5lZCxcbiAgICAgIGRlcHM6IGNvbXBpbGVEZXBzLFxuICAgICAgbXVsdGk6IHByb3ZpZGVyLm11bHRpXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgX2dldFF1ZXJpZXNNZXRhZGF0YShcbiAgICAgIHF1ZXJpZXM6IHtba2V5OiBzdHJpbmddOiBRdWVyeX0sIGlzVmlld1F1ZXJ5OiBib29sZWFuLFxuICAgICAgZGlyZWN0aXZlVHlwZTogVHlwZSk6IGNwbC5Db21waWxlUXVlcnlNZXRhZGF0YVtdIHtcbiAgICBjb25zdCByZXM6IGNwbC5Db21waWxlUXVlcnlNZXRhZGF0YVtdID0gW107XG5cbiAgICBPYmplY3Qua2V5cyhxdWVyaWVzKS5mb3JFYWNoKChwcm9wZXJ0eU5hbWU6IHN0cmluZykgPT4ge1xuICAgICAgY29uc3QgcXVlcnkgPSBxdWVyaWVzW3Byb3BlcnR5TmFtZV07XG4gICAgICBpZiAocXVlcnkuaXNWaWV3UXVlcnkgPT09IGlzVmlld1F1ZXJ5KSB7XG4gICAgICAgIHJlcy5wdXNoKHRoaXMuX2dldFF1ZXJ5TWV0YWRhdGEocXVlcnksIHByb3BlcnR5TmFtZSwgZGlyZWN0aXZlVHlwZSkpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlcztcbiAgfVxuXG4gIHByaXZhdGUgX3F1ZXJ5VmFyQmluZGluZ3Moc2VsZWN0b3I6IGFueSk6IHN0cmluZ1tdIHsgcmV0dXJuIHNlbGVjdG9yLnNwbGl0KC9cXHMqLFxccyovKTsgfVxuXG4gIHByaXZhdGUgX2dldFF1ZXJ5TWV0YWRhdGEocTogUXVlcnksIHByb3BlcnR5TmFtZTogc3RyaW5nLCB0eXBlT3JGdW5jOiBUeXBlfEZ1bmN0aW9uKTpcbiAgICAgIGNwbC5Db21waWxlUXVlcnlNZXRhZGF0YSB7XG4gICAgbGV0IHNlbGVjdG9yczogY3BsLkNvbXBpbGVUb2tlbk1ldGFkYXRhW107XG4gICAgaWYgKHR5cGVvZiBxLnNlbGVjdG9yID09PSAnc3RyaW5nJykge1xuICAgICAgc2VsZWN0b3JzID1cbiAgICAgICAgICB0aGlzLl9xdWVyeVZhckJpbmRpbmdzKHEuc2VsZWN0b3IpLm1hcCh2YXJOYW1lID0+IHRoaXMuX2dldFRva2VuTWV0YWRhdGEodmFyTmFtZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoIXEuc2VsZWN0b3IpIHtcbiAgICAgICAgdGhpcy5fcmVwb3J0RXJyb3IoXG4gICAgICAgICAgICBzeW50YXhFcnJvcihcbiAgICAgICAgICAgICAgICBgQ2FuJ3QgY29uc3RydWN0IGEgcXVlcnkgZm9yIHRoZSBwcm9wZXJ0eSBcIiR7cHJvcGVydHlOYW1lfVwiIG9mIFwiJHtzdHJpbmdpZnlUeXBlKHR5cGVPckZ1bmMpfVwiIHNpbmNlIHRoZSBxdWVyeSBzZWxlY3RvciB3YXNuJ3QgZGVmaW5lZC5gKSxcbiAgICAgICAgICAgIHR5cGVPckZ1bmMpO1xuICAgICAgICBzZWxlY3RvcnMgPSBbXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNlbGVjdG9ycyA9IFt0aGlzLl9nZXRUb2tlbk1ldGFkYXRhKHEuc2VsZWN0b3IpXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgc2VsZWN0b3JzLFxuICAgICAgZmlyc3Q6IHEuZmlyc3QsXG4gICAgICBkZXNjZW5kYW50czogcS5kZXNjZW5kYW50cywgcHJvcGVydHlOYW1lLFxuICAgICAgcmVhZDogcS5yZWFkID8gdGhpcy5fZ2V0VG9rZW5NZXRhZGF0YShxLnJlYWQpIDogbnVsbCAhXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgX3JlcG9ydEVycm9yKGVycm9yOiBhbnksIHR5cGU/OiBhbnksIG90aGVyVHlwZT86IGFueSkge1xuICAgIGlmICh0aGlzLl9lcnJvckNvbGxlY3Rvcikge1xuICAgICAgdGhpcy5fZXJyb3JDb2xsZWN0b3IoZXJyb3IsIHR5cGUpO1xuICAgICAgaWYgKG90aGVyVHlwZSkge1xuICAgICAgICB0aGlzLl9lcnJvckNvbGxlY3RvcihlcnJvciwgb3RoZXJUeXBlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGZsYXR0ZW5BcnJheSh0cmVlOiBhbnlbXSwgb3V0OiBBcnJheTxhbnk+ID0gW10pOiBBcnJheTxhbnk+IHtcbiAgaWYgKHRyZWUpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRyZWUubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGl0ZW0gPSByZXNvbHZlRm9yd2FyZFJlZih0cmVlW2ldKTtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KGl0ZW0pKSB7XG4gICAgICAgIGZsYXR0ZW5BcnJheShpdGVtLCBvdXQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3V0LnB1c2goaXRlbSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBvdXQ7XG59XG5cbmZ1bmN0aW9uIGRlZHVwZUFycmF5KGFycmF5OiBhbnlbXSk6IEFycmF5PGFueT4ge1xuICBpZiAoYXJyYXkpIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbShuZXcgU2V0KGFycmF5KSk7XG4gIH1cbiAgcmV0dXJuIFtdO1xufVxuXG5mdW5jdGlvbiBmbGF0dGVuQW5kRGVkdXBlQXJyYXkodHJlZTogYW55W10pOiBBcnJheTxhbnk+IHtcbiAgcmV0dXJuIGRlZHVwZUFycmF5KGZsYXR0ZW5BcnJheSh0cmVlKSk7XG59XG5cbmZ1bmN0aW9uIGlzVmFsaWRUeXBlKHZhbHVlOiBhbnkpOiBib29sZWFuIHtcbiAgcmV0dXJuICh2YWx1ZSBpbnN0YW5jZW9mIFN0YXRpY1N5bWJvbCkgfHwgKHZhbHVlIGluc3RhbmNlb2YgVHlwZSk7XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RJZGVudGlmaWVycyh2YWx1ZTogYW55LCB0YXJnZXRJZGVudGlmaWVyczogY3BsLkNvbXBpbGVJZGVudGlmaWVyTWV0YWRhdGFbXSkge1xuICB2aXNpdFZhbHVlKHZhbHVlLCBuZXcgX0NvbXBpbGVWYWx1ZUNvbnZlcnRlcigpLCB0YXJnZXRJZGVudGlmaWVycyk7XG59XG5cbmNsYXNzIF9Db21waWxlVmFsdWVDb252ZXJ0ZXIgZXh0ZW5kcyBWYWx1ZVRyYW5zZm9ybWVyIHtcbiAgdmlzaXRPdGhlcih2YWx1ZTogYW55LCB0YXJnZXRJZGVudGlmaWVyczogY3BsLkNvbXBpbGVJZGVudGlmaWVyTWV0YWRhdGFbXSk6IGFueSB7XG4gICAgdGFyZ2V0SWRlbnRpZmllcnMucHVzaCh7cmVmZXJlbmNlOiB2YWx1ZX0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIHN0cmluZ2lmeVR5cGUodHlwZTogYW55KTogc3RyaW5nIHtcbiAgaWYgKHR5cGUgaW5zdGFuY2VvZiBTdGF0aWNTeW1ib2wpIHtcbiAgICByZXR1cm4gYCR7dHlwZS5uYW1lfSBpbiAke3R5cGUuZmlsZVBhdGh9YDtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyaW5naWZ5KHR5cGUpO1xuICB9XG59XG5cbi8qKlxuICogSW5kaWNhdGVzIHRoYXQgYSBjb21wb25lbnQgaXMgc3RpbGwgYmVpbmcgbG9hZGVkIGluIGEgc3luY2hyb25vdXMgY29tcGlsZS5cbiAqL1xuZnVuY3Rpb24gY29tcG9uZW50U3RpbGxMb2FkaW5nRXJyb3IoY29tcFR5cGU6IFR5cGUpIHtcbiAgY29uc3QgZXJyb3IgPVxuICAgICAgRXJyb3IoYENhbid0IGNvbXBpbGUgc3luY2hyb25vdXNseSBhcyAke3N0cmluZ2lmeShjb21wVHlwZSl9IGlzIHN0aWxsIGJlaW5nIGxvYWRlZCFgKTtcbiAgKGVycm9yIGFzIGFueSlbRVJST1JfQ09NUE9ORU5UX1RZUEVdID0gY29tcFR5cGU7XG4gIHJldHVybiBlcnJvcjtcbn1cbiJdfQ==
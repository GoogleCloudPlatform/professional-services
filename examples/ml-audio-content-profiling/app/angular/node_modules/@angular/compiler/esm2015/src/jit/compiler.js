/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { identifierName, ngModuleJitUrl, sharedStylesheetJitUrl, templateJitUrl, templateSourceUrl } from '../compile_metadata';
import { ConstantPool } from '../constant_pool';
import * as ir from '../output/output_ast';
import { interpretStatements } from '../output/output_interpreter';
import { jitStatements } from '../output/output_jit';
import { SyncAsync, stringify } from '../util';
/**
 * An internal module of the Angular compiler that begins with component types,
 * extracts templates, and eventually produces a compiled version of the component
 * ready for linking into an application.
 *
 * @security  When compiling templates at runtime, you must ensure that the entire template comes
 * from a trusted source. Attacker-controlled data introduced by a template could expose your
 * application to XSS risks.  For more detail, see the [Security Guide](http://g.co/ng/security).
 */
export class JitCompiler {
    constructor(_metadataResolver, _templateParser, _styleCompiler, _viewCompiler, _ngModuleCompiler, _summaryResolver, _reflector, _compilerConfig, _console, getExtraNgModuleProviders) {
        this._metadataResolver = _metadataResolver;
        this._templateParser = _templateParser;
        this._styleCompiler = _styleCompiler;
        this._viewCompiler = _viewCompiler;
        this._ngModuleCompiler = _ngModuleCompiler;
        this._summaryResolver = _summaryResolver;
        this._reflector = _reflector;
        this._compilerConfig = _compilerConfig;
        this._console = _console;
        this.getExtraNgModuleProviders = getExtraNgModuleProviders;
        this._compiledTemplateCache = new Map();
        this._compiledHostTemplateCache = new Map();
        this._compiledDirectiveWrapperCache = new Map();
        this._compiledNgModuleCache = new Map();
        this._sharedStylesheetCount = 0;
        this._addedAotSummaries = new Set();
    }
    compileModuleSync(moduleType) {
        return SyncAsync.assertSync(this._compileModuleAndComponents(moduleType, true));
    }
    compileModuleAsync(moduleType) {
        return Promise.resolve(this._compileModuleAndComponents(moduleType, false));
    }
    compileModuleAndAllComponentsSync(moduleType) {
        return SyncAsync.assertSync(this._compileModuleAndAllComponents(moduleType, true));
    }
    compileModuleAndAllComponentsAsync(moduleType) {
        return Promise.resolve(this._compileModuleAndAllComponents(moduleType, false));
    }
    getComponentFactory(component) {
        const summary = this._metadataResolver.getDirectiveSummary(component);
        return summary.componentFactory;
    }
    loadAotSummaries(summaries) {
        this.clearCache();
        this._addAotSummaries(summaries);
    }
    _addAotSummaries(fn) {
        if (this._addedAotSummaries.has(fn)) {
            return;
        }
        this._addedAotSummaries.add(fn);
        const summaries = fn();
        for (let i = 0; i < summaries.length; i++) {
            const entry = summaries[i];
            if (typeof entry === 'function') {
                this._addAotSummaries(entry);
            }
            else {
                const summary = entry;
                this._summaryResolver.addSummary({ symbol: summary.type.reference, metadata: null, type: summary });
            }
        }
    }
    hasAotSummary(ref) { return !!this._summaryResolver.resolveSummary(ref); }
    _filterJitIdentifiers(ids) {
        return ids.map(mod => mod.reference).filter((ref) => !this.hasAotSummary(ref));
    }
    _compileModuleAndComponents(moduleType, isSync) {
        return SyncAsync.then(this._loadModules(moduleType, isSync), () => {
            this._compileComponents(moduleType, null);
            return this._compileModule(moduleType);
        });
    }
    _compileModuleAndAllComponents(moduleType, isSync) {
        return SyncAsync.then(this._loadModules(moduleType, isSync), () => {
            const componentFactories = [];
            this._compileComponents(moduleType, componentFactories);
            return {
                ngModuleFactory: this._compileModule(moduleType),
                componentFactories: componentFactories
            };
        });
    }
    _loadModules(mainModule, isSync) {
        const loading = [];
        const mainNgModule = this._metadataResolver.getNgModuleMetadata(mainModule);
        // Note: for runtime compilation, we want to transitively compile all modules,
        // so we also need to load the declared directives / pipes for all nested modules.
        this._filterJitIdentifiers(mainNgModule.transitiveModule.modules).forEach((nestedNgModule) => {
            // getNgModuleMetadata only returns null if the value passed in is not an NgModule
            const moduleMeta = this._metadataResolver.getNgModuleMetadata(nestedNgModule);
            this._filterJitIdentifiers(moduleMeta.declaredDirectives).forEach((ref) => {
                const promise = this._metadataResolver.loadDirectiveMetadata(moduleMeta.type.reference, ref, isSync);
                if (promise) {
                    loading.push(promise);
                }
            });
            this._filterJitIdentifiers(moduleMeta.declaredPipes)
                .forEach((ref) => this._metadataResolver.getOrLoadPipeMetadata(ref));
        });
        return SyncAsync.all(loading);
    }
    _compileModule(moduleType) {
        let ngModuleFactory = this._compiledNgModuleCache.get(moduleType);
        if (!ngModuleFactory) {
            const moduleMeta = this._metadataResolver.getNgModuleMetadata(moduleType);
            // Always provide a bound Compiler
            const extraProviders = this.getExtraNgModuleProviders(moduleMeta.type.reference);
            const outputCtx = createOutputContext();
            const compileResult = this._ngModuleCompiler.compile(outputCtx, moduleMeta, extraProviders);
            ngModuleFactory = this._interpretOrJit(ngModuleJitUrl(moduleMeta), outputCtx.statements)[compileResult.ngModuleFactoryVar];
            this._compiledNgModuleCache.set(moduleMeta.type.reference, ngModuleFactory);
        }
        return ngModuleFactory;
    }
    /**
     * @internal
     */
    _compileComponents(mainModule, allComponentFactories) {
        const ngModule = this._metadataResolver.getNgModuleMetadata(mainModule);
        const moduleByJitDirective = new Map();
        const templates = new Set();
        const transJitModules = this._filterJitIdentifiers(ngModule.transitiveModule.modules);
        transJitModules.forEach((localMod) => {
            const localModuleMeta = this._metadataResolver.getNgModuleMetadata(localMod);
            this._filterJitIdentifiers(localModuleMeta.declaredDirectives).forEach((dirRef) => {
                moduleByJitDirective.set(dirRef, localModuleMeta);
                const dirMeta = this._metadataResolver.getDirectiveMetadata(dirRef);
                if (dirMeta.isComponent) {
                    templates.add(this._createCompiledTemplate(dirMeta, localModuleMeta));
                    if (allComponentFactories) {
                        const template = this._createCompiledHostTemplate(dirMeta.type.reference, localModuleMeta);
                        templates.add(template);
                        allComponentFactories.push(dirMeta.componentFactory);
                    }
                }
            });
        });
        transJitModules.forEach((localMod) => {
            const localModuleMeta = this._metadataResolver.getNgModuleMetadata(localMod);
            this._filterJitIdentifiers(localModuleMeta.declaredDirectives).forEach((dirRef) => {
                const dirMeta = this._metadataResolver.getDirectiveMetadata(dirRef);
                if (dirMeta.isComponent) {
                    dirMeta.entryComponents.forEach((entryComponentType) => {
                        const moduleMeta = moduleByJitDirective.get(entryComponentType.componentType);
                        templates.add(this._createCompiledHostTemplate(entryComponentType.componentType, moduleMeta));
                    });
                }
            });
            localModuleMeta.entryComponents.forEach((entryComponentType) => {
                if (!this.hasAotSummary(entryComponentType.componentType)) {
                    const moduleMeta = moduleByJitDirective.get(entryComponentType.componentType);
                    templates.add(this._createCompiledHostTemplate(entryComponentType.componentType, moduleMeta));
                }
            });
        });
        templates.forEach((template) => this._compileTemplate(template));
    }
    clearCacheFor(type) {
        this._compiledNgModuleCache.delete(type);
        this._metadataResolver.clearCacheFor(type);
        this._compiledHostTemplateCache.delete(type);
        const compiledTemplate = this._compiledTemplateCache.get(type);
        if (compiledTemplate) {
            this._compiledTemplateCache.delete(type);
        }
    }
    clearCache() {
        // Note: don't clear the _addedAotSummaries, as they don't change!
        this._metadataResolver.clearCache();
        this._compiledTemplateCache.clear();
        this._compiledHostTemplateCache.clear();
        this._compiledNgModuleCache.clear();
    }
    _createCompiledHostTemplate(compType, ngModule) {
        if (!ngModule) {
            throw new Error(`Component ${stringify(compType)} is not part of any NgModule or the module has not been imported into your module.`);
        }
        let compiledTemplate = this._compiledHostTemplateCache.get(compType);
        if (!compiledTemplate) {
            const compMeta = this._metadataResolver.getDirectiveMetadata(compType);
            assertComponent(compMeta);
            const hostMeta = this._metadataResolver.getHostComponentMetadata(compMeta, compMeta.componentFactory.viewDefFactory);
            compiledTemplate =
                new CompiledTemplate(true, compMeta.type, hostMeta, ngModule, [compMeta.type]);
            this._compiledHostTemplateCache.set(compType, compiledTemplate);
        }
        return compiledTemplate;
    }
    _createCompiledTemplate(compMeta, ngModule) {
        let compiledTemplate = this._compiledTemplateCache.get(compMeta.type.reference);
        if (!compiledTemplate) {
            assertComponent(compMeta);
            compiledTemplate = new CompiledTemplate(false, compMeta.type, compMeta, ngModule, ngModule.transitiveModule.directives);
            this._compiledTemplateCache.set(compMeta.type.reference, compiledTemplate);
        }
        return compiledTemplate;
    }
    _compileTemplate(template) {
        if (template.isCompiled) {
            return;
        }
        const compMeta = template.compMeta;
        const externalStylesheetsByModuleUrl = new Map();
        const outputContext = createOutputContext();
        const componentStylesheet = this._styleCompiler.compileComponent(outputContext, compMeta);
        compMeta.template.externalStylesheets.forEach((stylesheetMeta) => {
            const compiledStylesheet = this._styleCompiler.compileStyles(createOutputContext(), compMeta, stylesheetMeta);
            externalStylesheetsByModuleUrl.set(stylesheetMeta.moduleUrl, compiledStylesheet);
        });
        this._resolveStylesCompileResult(componentStylesheet, externalStylesheetsByModuleUrl);
        const pipes = template.ngModule.transitiveModule.pipes.map(pipe => this._metadataResolver.getPipeSummary(pipe.reference));
        const { template: parsedTemplate, pipes: usedPipes } = this._parseTemplate(compMeta, template.ngModule, template.directives);
        const compileResult = this._viewCompiler.compileComponent(outputContext, compMeta, parsedTemplate, ir.variable(componentStylesheet.stylesVar), usedPipes);
        const evalResult = this._interpretOrJit(templateJitUrl(template.ngModule.type, template.compMeta), outputContext.statements);
        const viewClass = evalResult[compileResult.viewClassVar];
        const rendererType = evalResult[compileResult.rendererTypeVar];
        template.compiled(viewClass, rendererType);
    }
    _parseTemplate(compMeta, ngModule, directiveIdentifiers) {
        // Note: ! is ok here as components always have a template.
        const preserveWhitespaces = compMeta.template.preserveWhitespaces;
        const directives = directiveIdentifiers.map(dir => this._metadataResolver.getDirectiveSummary(dir.reference));
        const pipes = ngModule.transitiveModule.pipes.map(pipe => this._metadataResolver.getPipeSummary(pipe.reference));
        return this._templateParser.parse(compMeta, compMeta.template.htmlAst, directives, pipes, ngModule.schemas, templateSourceUrl(ngModule.type, compMeta, compMeta.template), preserveWhitespaces);
    }
    _resolveStylesCompileResult(result, externalStylesheetsByModuleUrl) {
        result.dependencies.forEach((dep, i) => {
            const nestedCompileResult = externalStylesheetsByModuleUrl.get(dep.moduleUrl);
            const nestedStylesArr = this._resolveAndEvalStylesCompileResult(nestedCompileResult, externalStylesheetsByModuleUrl);
            dep.setValue(nestedStylesArr);
        });
    }
    _resolveAndEvalStylesCompileResult(result, externalStylesheetsByModuleUrl) {
        this._resolveStylesCompileResult(result, externalStylesheetsByModuleUrl);
        return this._interpretOrJit(sharedStylesheetJitUrl(result.meta, this._sharedStylesheetCount++), result.outputCtx.statements)[result.stylesVar];
    }
    _interpretOrJit(sourceUrl, statements) {
        if (!this._compilerConfig.useJit) {
            return interpretStatements(statements, this._reflector);
        }
        else {
            return jitStatements(sourceUrl, statements, this._reflector, this._compilerConfig.jitDevMode);
        }
    }
}
class CompiledTemplate {
    constructor(isHost, compType, compMeta, ngModule, directives) {
        this.isHost = isHost;
        this.compType = compType;
        this.compMeta = compMeta;
        this.ngModule = ngModule;
        this.directives = directives;
        this._viewClass = null;
        this.isCompiled = false;
    }
    compiled(viewClass, rendererType) {
        this._viewClass = viewClass;
        this.compMeta.componentViewType.setDelegate(viewClass);
        for (let prop in rendererType) {
            this.compMeta.rendererType[prop] = rendererType[prop];
        }
        this.isCompiled = true;
    }
}
function assertComponent(meta) {
    if (!meta.isComponent) {
        throw new Error(`Could not compile '${identifierName(meta.type)}' because it is not a component.`);
    }
}
function createOutputContext() {
    const importExpr = (symbol) => ir.importExpr({ name: identifierName(symbol), moduleName: null, runtime: symbol });
    return { statements: [], genFilePath: '', importExpr, constantPool: new ConstantPool() };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci9zcmMvaml0L2NvbXBpbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBcU0sY0FBYyxFQUFFLGNBQWMsRUFBRSxzQkFBc0IsRUFBRSxjQUFjLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUdsVSxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFJOUMsT0FBTyxLQUFLLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUMzQyxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUNqRSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFLbkQsT0FBTyxFQUF5QixTQUFTLEVBQUUsU0FBUyxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBUXJFOzs7Ozs7OztHQVFHO0FBQ0gsTUFBTSxPQUFPLFdBQVc7SUFRdEIsWUFDWSxpQkFBMEMsRUFBVSxlQUErQixFQUNuRixjQUE2QixFQUFVLGFBQTJCLEVBQ2xFLGlCQUFtQyxFQUFVLGdCQUF1QyxFQUNwRixVQUE0QixFQUFVLGVBQStCLEVBQ3JFLFFBQWlCLEVBQ2pCLHlCQUF1RTtRQUx2RSxzQkFBaUIsR0FBakIsaUJBQWlCLENBQXlCO1FBQVUsb0JBQWUsR0FBZixlQUFlLENBQWdCO1FBQ25GLG1CQUFjLEdBQWQsY0FBYyxDQUFlO1FBQVUsa0JBQWEsR0FBYixhQUFhLENBQWM7UUFDbEUsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFrQjtRQUFVLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBdUI7UUFDcEYsZUFBVSxHQUFWLFVBQVUsQ0FBa0I7UUFBVSxvQkFBZSxHQUFmLGVBQWUsQ0FBZ0I7UUFDckUsYUFBUSxHQUFSLFFBQVEsQ0FBUztRQUNqQiw4QkFBeUIs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QUFDLENBQUM7U0FDOUQ7UUFDRCxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztJQUN6QixDQUFDO0NBQ0Y7QUFFRCxTQUFTLGVBQWUsQ0FBQyxJQUE4QjtJQUNyRCxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRTtRQUNyQixNQUFNLElBQUksS0FBSyxDQUNYLHNCQUFzQixjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDO0tBQ3hGO0FBQ0gsQ0FBQztBQUVELFNBQVMsbUJBQW1CO0lBQzFCLE1BQU0sVUFBVSxHQUFHLENBQUMsTUFBVyxFQUFFLEVBQUUsQ0FDL0IsRUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFDLElBQUksRUFBRSxjQUFjLENBQUMsTUFBTSxDQUFDLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFDLENBQUMsQ0FBQztJQUNyRixPQUFPLEVBQUMsVUFBVSxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsRUFBRSxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsSUFBSSxZQUFZLEVBQUUsRUFBQyxDQUFDO0FBQ3pGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Q29tcGlsZURpcmVjdGl2ZU1ldGFkYXRhLCBDb21waWxlSWRlbnRpZmllck1ldGFkYXRhLCBDb21waWxlTmdNb2R1bGVNZXRhZGF0YSwgQ29tcGlsZVBpcGVTdW1tYXJ5LCBDb21waWxlUHJvdmlkZXJNZXRhZGF0YSwgQ29tcGlsZVN0eWxlc2hlZXRNZXRhZGF0YSwgQ29tcGlsZVR5cGVTdW1tYXJ5LCBQcm92aWRlck1ldGEsIFByb3h5Q2xhc3MsIGlkZW50aWZpZXJOYW1lLCBuZ01vZHVsZUppdFVybCwgc2hhcmVkU3R5bGVzaGVldEppdFVybCwgdGVtcGxhdGVKaXRVcmwsIHRlbXBsYXRlU291cmNlVXJsfSBmcm9tICcuLi9jb21waWxlX21ldGFkYXRhJztcbmltcG9ydCB7Q29tcGlsZVJlZmxlY3Rvcn0gZnJvbSAnLi4vY29tcGlsZV9yZWZsZWN0b3InO1xuaW1wb3J0IHtDb21waWxlckNvbmZpZ30gZnJvbSAnLi4vY29uZmlnJztcbmltcG9ydCB7Q29uc3RhbnRQb29sfSBmcm9tICcuLi9jb25zdGFudF9wb29sJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vY29yZSc7XG5pbXBvcnQge0NvbXBpbGVNZXRhZGF0YVJlc29sdmVyfSBmcm9tICcuLi9tZXRhZGF0YV9yZXNvbHZlcic7XG5pbXBvcnQge05nTW9kdWxlQ29tcGlsZXJ9IGZyb20gJy4uL25nX21vZHVsZV9jb21waWxlcic7XG5pbXBvcnQgKiBhcyBpciBmcm9tICcuLi9vdXRwdXQvb3V0cHV0X2FzdCc7XG5pbXBvcnQge2ludGVycHJldFN0YXRlbWVudHN9IGZyb20gJy4uL291dHB1dC9vdXRwdXRfaW50ZXJwcmV0ZXInO1xuaW1wb3J0IHtqaXRTdGF0ZW1lbnRzfSBmcm9tICcuLi9vdXRwdXQvb3V0cHV0X2ppdCc7XG5pbXBvcnQge0NvbXBpbGVkU3R5bGVzaGVldCwgU3R5bGVDb21waWxlcn0gZnJvbSAnLi4vc3R5bGVfY29tcGlsZXInO1xuaW1wb3J0IHtTdW1tYXJ5UmVzb2x2ZXJ9IGZyb20gJy4uL3N1bW1hcnlfcmVzb2x2ZXInO1xuaW1wb3J0IHtUZW1wbGF0ZUFzdH0gZnJvbSAnLi4vdGVtcGxhdGVfcGFyc2VyL3RlbXBsYXRlX2FzdCc7XG5pbXBvcnQge1RlbXBsYXRlUGFyc2VyfSBmcm9tICcuLi90ZW1wbGF0ZV9wYXJzZXIvdGVtcGxhdGVfcGFyc2VyJztcbmltcG9ydCB7Q29uc29sZSwgT3V0cHV0Q29udGV4dCwgU3luY0FzeW5jLCBzdHJpbmdpZnl9IGZyb20gJy4uL3V0aWwnO1xuaW1wb3J0IHtWaWV3Q29tcGlsZXJ9IGZyb20gJy4uL3ZpZXdfY29tcGlsZXIvdmlld19jb21waWxlcic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTW9kdWxlV2l0aENvbXBvbmVudEZhY3RvcmllcyB7XG4gIG5nTW9kdWxlRmFjdG9yeTogb2JqZWN0O1xuICBjb21wb25lbnRGYWN0b3JpZXM6IG9iamVjdFtdO1xufVxuXG4vKipcbiAqIEFuIGludGVybmFsIG1vZHVsZSBvZiB0aGUgQW5ndWxhciBjb21waWxlciB0aGF0IGJlZ2lucyB3aXRoIGNvbXBvbmVudCB0eXBlcyxcbiAqIGV4dHJhY3RzIHRlbXBsYXRlcywgYW5kIGV2ZW50dWFsbHkgcHJvZHVjZXMgYSBjb21waWxlZCB2ZXJzaW9uIG9mIHRoZSBjb21wb25lbnRcbiAqIHJlYWR5IGZvciBsaW5raW5nIGludG8gYW4gYXBwbGljYXRpb24uXG4gKlxuICogQHNlY3VyaXR5ICBXaGVuIGNvbXBpbGluZyB0ZW1wbGF0ZXMgYXQgcnVudGltZSwgeW91IG11c3QgZW5zdXJlIHRoYXQgdGhlIGVudGlyZSB0ZW1wbGF0ZSBjb21lc1xuICogZnJvbSBhIHRydXN0ZWQgc291cmNlLiBBdHRhY2tlci1jb250cm9sbGVkIGRhdGEgaW50cm9kdWNlZCBieSBhIHRlbXBsYXRlIGNvdWxkIGV4cG9zZSB5b3VyXG4gKiBhcHBsaWNhdGlvbiB0byBYU1Mgcmlza3MuICBGb3IgbW9yZSBkZXRhaWwsIHNlZSB0aGUgW1NlY3VyaXR5IEd1aWRlXShodHRwOi8vZy5jby9uZy9zZWN1cml0eSkuXG4gKi9cbmV4cG9ydCBjbGFzcyBKaXRDb21waWxlciB7XG4gIHByaXZhdGUgX2NvbXBpbGVkVGVtcGxhdGVDYWNoZSA9IG5ldyBNYXA8VHlwZSwgQ29tcGlsZWRUZW1wbGF0ZT4oKTtcbiAgcHJpdmF0ZSBfY29tcGlsZWRIb3N0VGVtcGxhdGVDYWNoZSA9IG5ldyBNYXA8VHlwZSwgQ29tcGlsZWRUZW1wbGF0ZT4oKTtcbiAgcHJpdmF0ZSBfY29tcGlsZWREaXJlY3RpdmVXcmFwcGVyQ2FjaGUgPSBuZXcgTWFwPFR5cGUsIFR5cGU+KCk7XG4gIHByaXZhdGUgX2NvbXBpbGVkTmdNb2R1bGVDYWNoZSA9IG5ldyBNYXA8VHlwZSwgb2JqZWN0PigpO1xuICBwcml2YXRlIF9zaGFyZWRTdHlsZXNoZWV0Q291bnQgPSAwO1xuICBwcml2YXRlIF9hZGRlZEFvdFN1bW1hcmllcyA9IG5ldyBTZXQ8KCkgPT4gYW55W10+KCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIF9tZXRhZGF0YVJlc29sdmVyOiBDb21waWxlTWV0YWRhdGFSZXNvbHZlciwgcHJpdmF0ZSBfdGVtcGxhdGVQYXJzZXI6IFRlbXBsYXRlUGFyc2VyLFxuICAgICAgcHJpdmF0ZSBfc3R5bGVDb21waWxlcjogU3R5bGVDb21waWxlciwgcHJpdmF0ZSBfdmlld0NvbXBpbGVyOiBWaWV3Q29tcGlsZXIsXG4gICAgICBwcml2YXRlIF9uZ01vZHVsZUNvbXBpbGVyOiBOZ01vZHVsZUNvbXBpbGVyLCBwcml2YXRlIF9zdW1tYXJ5UmVzb2x2ZXI6IFN1bW1hcnlSZXNvbHZlcjxUeXBlPixcbiAgICAgIHByaXZhdGUgX3JlZmxlY3RvcjogQ29tcGlsZVJlZmxlY3RvciwgcHJpdmF0ZSBfY29tcGlsZXJDb25maWc6IENvbXBpbGVyQ29uZmlnLFxuICAgICAgcHJpdmF0ZSBfY29uc29sZTogQ29uc29sZSxcbiAgICAgIHByaXZhdGUgZ2V0RXh0cmFOZ01vZHVsZVByb3ZpZGVyczogKG5nTW9kdWxlOiBhbnkpID0+IENvbXBpbGVQcm92aWRlck1ldGFkYXRhW10pIHt9XG5cbiAgY29tcGlsZU1vZHVsZVN5bmMobW9kdWxlVHlwZTogVHlwZSk6IG9iamVjdCB7XG4gICAgcmV0dXJuIFN5bmNBc3luYy5hc3NlcnRTeW5jKHRoaXMuX2NvbXBpbGVNb2R1bGVBbmRDb21wb25lbnRzKG1vZHVsZVR5cGUsIHRydWUpKTtcbiAgfVxuXG4gIGNvbXBpbGVNb2R1bGVBc3luYyhtb2R1bGVUeXBlOiBUeXBlKTogUHJvbWlzZTxvYmplY3Q+IHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuX2NvbXBpbGVNb2R1bGVBbmRDb21wb25lbnRzKG1vZHVsZVR5cGUsIGZhbHNlKSk7XG4gIH1cblxuICBjb21waWxlTW9kdWxlQW5kQWxsQ29tcG9uZW50c1N5bmMobW9kdWxlVHlwZTogVHlwZSk6IE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXMge1xuICAgIHJldHVybiBTeW5jQXN5bmMuYXNzZXJ0U3luYyh0aGlzLl9jb21waWxlTW9kdWxlQW5kQWxsQ29tcG9uZW50cyhtb2R1bGVUeXBlLCB0cnVlKSk7XG4gIH1cblxuICBjb21waWxlTW9kdWxlQW5kQWxsQ29tcG9uZW50c0FzeW5jKG1vZHVsZVR5cGU6IFR5cGUpOiBQcm9taXNlPE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXM+IHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuX2NvbXBpbGVNb2R1bGVBbmRBbGxDb21wb25lbnRzKG1vZHVsZVR5cGUsIGZhbHNlKSk7XG4gIH1cblxuICBnZXRDb21wb25lbnRGYWN0b3J5KGNvbXBvbmVudDogVHlwZSk6IG9iamVjdCB7XG4gICAgY29uc3Qgc3VtbWFyeSA9IHRoaXMuX21ldGFkYXRhUmVzb2x2ZXIuZ2V0RGlyZWN0aXZlU3VtbWFyeShjb21wb25lbnQpO1xuICAgIHJldHVybiBzdW1tYXJ5LmNvbXBvbmVudEZhY3RvcnkgYXMgb2JqZWN0O1xuICB9XG5cbiAgbG9hZEFvdFN1bW1hcmllcyhzdW1tYXJpZXM6ICgpID0+IGFueVtdKSB7XG4gICAgdGhpcy5jbGVhckNhY2hlKCk7XG4gICAgdGhpcy5fYWRkQW90U3VtbWFyaWVzKHN1bW1hcmllcyk7XG4gIH1cblxuICBwcml2YXRlIF9hZGRBb3RTdW1tYXJpZXMoZm46ICgpID0+IGFueVtdKSB7XG4gICAgaWYgKHRoaXMuX2FkZGVkQW90U3VtbWFyaWVzLmhhcyhmbikpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5fYWRkZWRBb3RTdW1tYXJpZXMuYWRkKGZuKTtcbiAgICBjb25zdCBzdW1tYXJpZXMgPSBmbigpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3VtbWFyaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBlbnRyeSA9IHN1bW1hcmllc1tpXTtcbiAgICAgIGlmICh0eXBlb2YgZW50cnkgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhpcy5fYWRkQW90U3VtbWFyaWVzKGVudHJ5KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHN1bW1hcnkgPSBlbnRyeSBhcyBDb21waWxlVHlwZVN1bW1hcnk7XG4gICAgICAgIHRoaXMuX3N1bW1hcnlSZXNvbHZlci5hZGRTdW1tYXJ5KFxuICAgICAgICAgICAge3N5bWJvbDogc3VtbWFyeS50eXBlLnJlZmVyZW5jZSwgbWV0YWRhdGE6IG51bGwsIHR5cGU6IHN1bW1hcnl9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBoYXNBb3RTdW1tYXJ5KHJlZjogVHlwZSkgeyByZXR1cm4gISF0aGlzLl9zdW1tYXJ5UmVzb2x2ZXIucmVzb2x2ZVN1bW1hcnkocmVmKTsgfVxuXG4gIHByaXZhdGUgX2ZpbHRlckppdElkZW50aWZpZXJzKGlkczogQ29tcGlsZUlkZW50aWZpZXJNZXRhZGF0YVtdKTogYW55W10ge1xuICAgIHJldHVybiBpZHMubWFwKG1vZCA9PiBtb2QucmVmZXJlbmNlKS5maWx0ZXIoKHJlZikgPT4gIXRoaXMuaGFzQW90U3VtbWFyeShyZWYpKTtcbiAgfVxuXG4gIHByaXZhdGUgX2NvbXBpbGVNb2R1bGVBbmRDb21wb25lbnRzKG1vZHVsZVR5cGU6IFR5cGUsIGlzU3luYzogYm9vbGVhbik6IFN5bmNBc3luYzxvYmplY3Q+IHtcbiAgICByZXR1cm4gU3luY0FzeW5jLnRoZW4odGhpcy5fbG9hZE1vZHVsZXMobW9kdWxlVHlwZSwgaXNTeW5jKSwgKCkgPT4ge1xuICAgICAgdGhpcy5fY29tcGlsZUNvbXBvbmVudHMobW9kdWxlVHlwZSwgbnVsbCk7XG4gICAgICByZXR1cm4gdGhpcy5fY29tcGlsZU1vZHVsZShtb2R1bGVUeXBlKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgX2NvbXBpbGVNb2R1bGVBbmRBbGxDb21wb25lbnRzKG1vZHVsZVR5cGU6IFR5cGUsIGlzU3luYzogYm9vbGVhbik6XG4gICAgICBTeW5jQXN5bmM8TW9kdWxlV2l0aENvbXBvbmVudEZhY3Rvcmllcz4ge1xuICAgIHJldHVybiBTeW5jQXN5bmMudGhlbih0aGlzLl9sb2FkTW9kdWxlcyhtb2R1bGVUeXBlLCBpc1N5bmMpLCAoKSA9PiB7XG4gICAgICBjb25zdCBjb21wb25lbnRGYWN0b3JpZXM6IG9iamVjdFtdID0gW107XG4gICAgICB0aGlzLl9jb21waWxlQ29tcG9uZW50cyhtb2R1bGVUeXBlLCBjb21wb25lbnRGYWN0b3JpZXMpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbmdNb2R1bGVGYWN0b3J5OiB0aGlzLl9jb21waWxlTW9kdWxlKG1vZHVsZVR5cGUpLFxuICAgICAgICBjb21wb25lbnRGYWN0b3JpZXM6IGNvbXBvbmVudEZhY3Rvcmllc1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgX2xvYWRNb2R1bGVzKG1haW5Nb2R1bGU6IGFueSwgaXNTeW5jOiBib29sZWFuKTogU3luY0FzeW5jPGFueT4ge1xuICAgIGNvbnN0IGxvYWRpbmc6IFByb21pc2U8YW55PltdID0gW107XG4gICAgY29uc3QgbWFpbk5nTW9kdWxlID0gdGhpcy5fbWV0YWRhdGFSZXNvbHZlci5nZXROZ01vZHVsZU1ldGFkYXRhKG1haW5Nb2R1bGUpICE7XG4gICAgLy8gTm90ZTogZm9yIHJ1bnRpbWUgY29tcGlsYXRpb24sIHdlIHdhbnQgdG8gdHJhbnNpdGl2ZWx5IGNvbXBpbGUgYWxsIG1vZHVsZXMsXG4gICAgLy8gc28gd2UgYWxzbyBuZWVkIHRvIGxvYWQgdGhlIGRlY2xhcmVkIGRpcmVjdGl2ZXMgLyBwaXBlcyBmb3IgYWxsIG5lc3RlZCBtb2R1bGVzLlxuICAgIHRoaXMuX2ZpbHRlckppdElkZW50aWZpZXJzKG1haW5OZ01vZHVsZS50cmFuc2l0aXZlTW9kdWxlLm1vZHVsZXMpLmZvckVhY2goKG5lc3RlZE5nTW9kdWxlKSA9PiB7XG4gICAgICAvLyBnZXROZ01vZHVsZU1ldGFkYXRhIG9ubHkgcmV0dXJucyBudWxsIGlmIHRoZSB2YWx1ZSBwYXNzZWQgaW4gaXMgbm90IGFuIE5nTW9kdWxlXG4gICAgICBjb25zdCBtb2R1bGVNZXRhID0gdGhpcy5fbWV0YWRhdGFSZXNvbHZlci5nZXROZ01vZHVsZU1ldGFkYXRhKG5lc3RlZE5nTW9kdWxlKSAhO1xuICAgICAgdGhpcy5fZmlsdGVySml0SWRlbnRpZmllcnMobW9kdWxlTWV0YS5kZWNsYXJlZERpcmVjdGl2ZXMpLmZvckVhY2goKHJlZikgPT4ge1xuICAgICAgICBjb25zdCBwcm9taXNlID1cbiAgICAgICAgICAgIHRoaXMuX21ldGFkYXRhUmVzb2x2ZXIubG9hZERpcmVjdGl2ZU1ldGFkYXRhKG1vZHVsZU1ldGEudHlwZS5yZWZlcmVuY2UsIHJlZiwgaXNTeW5jKTtcbiAgICAgICAgaWYgKHByb21pc2UpIHtcbiAgICAgICAgICBsb2FkaW5nLnB1c2gocHJvbWlzZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgdGhpcy5fZmlsdGVySml0SWRlbnRpZmllcnMobW9kdWxlTWV0YS5kZWNsYXJlZFBpcGVzKVxuICAgICAgICAgIC5mb3JFYWNoKChyZWYpID0+IHRoaXMuX21ldGFkYXRhUmVzb2x2ZXIuZ2V0T3JMb2FkUGlwZU1ldGFkYXRhKHJlZikpO1xuICAgIH0pO1xuICAgIHJldHVybiBTeW5jQXN5bmMuYWxsKGxvYWRpbmcpO1xuICB9XG5cbiAgcHJpdmF0ZSBfY29tcGlsZU1vZHVsZShtb2R1bGVUeXBlOiBUeXBlKTogb2JqZWN0IHtcbiAgICBsZXQgbmdNb2R1bGVGYWN0b3J5ID0gdGhpcy5fY29tcGlsZWROZ01vZHVsZUNhY2hlLmdldChtb2R1bGVUeXBlKSAhO1xuICAgIGlmICghbmdNb2R1bGVGYWN0b3J5KSB7XG4gICAgICBjb25zdCBtb2R1bGVNZXRhID0gdGhpcy5fbWV0YWRhdGFSZXNvbHZlci5nZXROZ01vZHVsZU1ldGFkYXRhKG1vZHVsZVR5cGUpICE7XG4gICAgICAvLyBBbHdheXMgcHJvdmlkZSBhIGJvdW5kIENvbXBpbGVyXG4gICAgICBjb25zdCBleHRyYVByb3ZpZGVycyA9IHRoaXMuZ2V0RXh0cmFOZ01vZHVsZVByb3ZpZGVycyhtb2R1bGVNZXRhLnR5cGUucmVmZXJlbmNlKTtcbiAgICAgIGNvbnN0IG91dHB1dEN0eCA9IGNyZWF0ZU91dHB1dENvbnRleHQoKTtcbiAgICAgIGNvbnN0IGNvbXBpbGVSZXN1bHQgPSB0aGlzLl9uZ01vZHVsZUNvbXBpbGVyLmNvbXBpbGUob3V0cHV0Q3R4LCBtb2R1bGVNZXRhLCBleHRyYVByb3ZpZGVycyk7XG4gICAgICBuZ01vZHVsZUZhY3RvcnkgPSB0aGlzLl9pbnRlcnByZXRPckppdChcbiAgICAgICAgICBuZ01vZHVsZUppdFVybChtb2R1bGVNZXRhKSwgb3V0cHV0Q3R4LnN0YXRlbWVudHMpW2NvbXBpbGVSZXN1bHQubmdNb2R1bGVGYWN0b3J5VmFyXTtcbiAgICAgIHRoaXMuX2NvbXBpbGVkTmdNb2R1bGVDYWNoZS5zZXQobW9kdWxlTWV0YS50eXBlLnJlZmVyZW5jZSwgbmdNb2R1bGVGYWN0b3J5KTtcbiAgICB9XG4gICAgcmV0dXJuIG5nTW9kdWxlRmFjdG9yeTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9jb21waWxlQ29tcG9uZW50cyhtYWluTW9kdWxlOiBUeXBlLCBhbGxDb21wb25lbnRGYWN0b3JpZXM6IG9iamVjdFtdfG51bGwpIHtcbiAgICBjb25zdCBuZ01vZHVsZSA9IHRoaXMuX21ldGFkYXRhUmVzb2x2ZXIuZ2V0TmdNb2R1bGVNZXRhZGF0YShtYWluTW9kdWxlKSAhO1xuICAgIGNvbnN0IG1vZHVsZUJ5Sml0RGlyZWN0aXZlID0gbmV3IE1hcDxhbnksIENvbXBpbGVOZ01vZHVsZU1ldGFkYXRhPigpO1xuICAgIGNvbnN0IHRlbXBsYXRlcyA9IG5ldyBTZXQ8Q29tcGlsZWRUZW1wbGF0ZT4oKTtcblxuICAgIGNvbnN0IHRyYW5zSml0TW9kdWxlcyA9IHRoaXMuX2ZpbHRlckppdElkZW50aWZpZXJzKG5nTW9kdWxlLnRyYW5zaXRpdmVNb2R1bGUubW9kdWxlcyk7XG4gICAgdHJhbnNKaXRNb2R1bGVzLmZvckVhY2goKGxvY2FsTW9kKSA9PiB7XG4gICAgICBjb25zdCBsb2NhbE1vZHVsZU1ldGEgPSB0aGlzLl9tZXRhZGF0YVJlc29sdmVyLmdldE5nTW9kdWxlTWV0YWRhdGEobG9jYWxNb2QpICE7XG4gICAgICB0aGlzLl9maWx0ZXJKaXRJZGVudGlmaWVycyhsb2NhbE1vZHVsZU1ldGEuZGVjbGFyZWREaXJlY3RpdmVzKS5mb3JFYWNoKChkaXJSZWYpID0+IHtcbiAgICAgICAgbW9kdWxlQnlKaXREaXJlY3RpdmUuc2V0KGRpclJlZiwgbG9jYWxNb2R1bGVNZXRhKTtcbiAgICAgICAgY29uc3QgZGlyTWV0YSA9IHRoaXMuX21ldGFkYXRhUmVzb2x2ZXIuZ2V0RGlyZWN0aXZlTWV0YWRhdGEoZGlyUmVmKTtcbiAgICAgICAgaWYgKGRpck1ldGEuaXNDb21wb25lbnQpIHtcbiAgICAgICAgICB0ZW1wbGF0ZXMuYWRkKHRoaXMuX2NyZWF0ZUNvbXBpbGVkVGVtcGxhdGUoZGlyTWV0YSwgbG9jYWxNb2R1bGVNZXRhKSk7XG4gICAgICAgICAgaWYgKGFsbENvbXBvbmVudEZhY3Rvcmllcykge1xuICAgICAgICAgICAgY29uc3QgdGVtcGxhdGUgPVxuICAgICAgICAgICAgICAgIHRoaXMuX2NyZWF0ZUNvbXBpbGVkSG9zdFRlbXBsYXRlKGRpck1ldGEudHlwZS5yZWZlcmVuY2UsIGxvY2FsTW9kdWxlTWV0YSk7XG4gICAgICAgICAgICB0ZW1wbGF0ZXMuYWRkKHRlbXBsYXRlKTtcbiAgICAgICAgICAgIGFsbENvbXBvbmVudEZhY3Rvcmllcy5wdXNoKGRpck1ldGEuY29tcG9uZW50RmFjdG9yeSBhcyBvYmplY3QpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gICAgdHJhbnNKaXRNb2R1bGVzLmZvckVhY2goKGxvY2FsTW9kKSA9PiB7XG4gICAgICBjb25zdCBsb2NhbE1vZHVsZU1ldGEgPSB0aGlzLl9tZXRhZGF0YVJlc29sdmVyLmdldE5nTW9kdWxlTWV0YWRhdGEobG9jYWxNb2QpICE7XG4gICAgICB0aGlzLl9maWx0ZXJKaXRJZGVudGlmaWVycyhsb2NhbE1vZHVsZU1ldGEuZGVjbGFyZWREaXJlY3RpdmVzKS5mb3JFYWNoKChkaXJSZWYpID0+IHtcbiAgICAgICAgY29uc3QgZGlyTWV0YSA9IHRoaXMuX21ldGFkYXRhUmVzb2x2ZXIuZ2V0RGlyZWN0aXZlTWV0YWRhdGEoZGlyUmVmKTtcbiAgICAgICAgaWYgKGRpck1ldGEuaXNDb21wb25lbnQpIHtcbiAgICAgICAgICBkaXJNZXRhLmVudHJ5Q29tcG9uZW50cy5mb3JFYWNoKChlbnRyeUNvbXBvbmVudFR5cGUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG1vZHVsZU1ldGEgPSBtb2R1bGVCeUppdERpcmVjdGl2ZS5nZXQoZW50cnlDb21wb25lbnRUeXBlLmNvbXBvbmVudFR5cGUpICE7XG4gICAgICAgICAgICB0ZW1wbGF0ZXMuYWRkKFxuICAgICAgICAgICAgICAgIHRoaXMuX2NyZWF0ZUNvbXBpbGVkSG9zdFRlbXBsYXRlKGVudHJ5Q29tcG9uZW50VHlwZS5jb21wb25lbnRUeXBlLCBtb2R1bGVNZXRhKSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgbG9jYWxNb2R1bGVNZXRhLmVudHJ5Q29tcG9uZW50cy5mb3JFYWNoKChlbnRyeUNvbXBvbmVudFR5cGUpID0+IHtcbiAgICAgICAgaWYgKCF0aGlzLmhhc0FvdFN1bW1hcnkoZW50cnlDb21wb25lbnRUeXBlLmNvbXBvbmVudFR5cGUpKSB7XG4gICAgICAgICAgY29uc3QgbW9kdWxlTWV0YSA9IG1vZHVsZUJ5Sml0RGlyZWN0aXZlLmdldChlbnRyeUNvbXBvbmVudFR5cGUuY29tcG9uZW50VHlwZSkgITtcbiAgICAgICAgICB0ZW1wbGF0ZXMuYWRkKFxuICAgICAgICAgICAgICB0aGlzLl9jcmVhdGVDb21waWxlZEhvc3RUZW1wbGF0ZShlbnRyeUNvbXBvbmVudFR5cGUuY29tcG9uZW50VHlwZSwgbW9kdWxlTWV0YSkpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICB0ZW1wbGF0ZXMuZm9yRWFjaCgodGVtcGxhdGUpID0+IHRoaXMuX2NvbXBpbGVUZW1wbGF0ZSh0ZW1wbGF0ZSkpO1xuICB9XG5cbiAgY2xlYXJDYWNoZUZvcih0eXBlOiBUeXBlKSB7XG4gICAgdGhpcy5fY29tcGlsZWROZ01vZHVsZUNhY2hlLmRlbGV0ZSh0eXBlKTtcbiAgICB0aGlzLl9tZXRhZGF0YVJlc29sdmVyLmNsZWFyQ2FjaGVGb3IodHlwZSk7XG4gICAgdGhpcy5fY29tcGlsZWRIb3N0VGVtcGxhdGVDYWNoZS5kZWxldGUodHlwZSk7XG4gICAgY29uc3QgY29tcGlsZWRUZW1wbGF0ZSA9IHRoaXMuX2NvbXBpbGVkVGVtcGxhdGVDYWNoZS5nZXQodHlwZSk7XG4gICAgaWYgKGNvbXBpbGVkVGVtcGxhdGUpIHtcbiAgICAgIHRoaXMuX2NvbXBpbGVkVGVtcGxhdGVDYWNoZS5kZWxldGUodHlwZSk7XG4gICAgfVxuICB9XG5cbiAgY2xlYXJDYWNoZSgpOiB2b2lkIHtcbiAgICAvLyBOb3RlOiBkb24ndCBjbGVhciB0aGUgX2FkZGVkQW90U3VtbWFyaWVzLCBhcyB0aGV5IGRvbid0IGNoYW5nZSFcbiAgICB0aGlzLl9tZXRhZGF0YVJlc29sdmVyLmNsZWFyQ2FjaGUoKTtcbiAgICB0aGlzLl9jb21waWxlZFRlbXBsYXRlQ2FjaGUuY2xlYXIoKTtcbiAgICB0aGlzLl9jb21waWxlZEhvc3RUZW1wbGF0ZUNhY2hlLmNsZWFyKCk7XG4gICAgdGhpcy5fY29tcGlsZWROZ01vZHVsZUNhY2hlLmNsZWFyKCk7XG4gIH1cblxuICBwcml2YXRlIF9jcmVhdGVDb21waWxlZEhvc3RUZW1wbGF0ZShjb21wVHlwZTogVHlwZSwgbmdNb2R1bGU6IENvbXBpbGVOZ01vZHVsZU1ldGFkYXRhKTpcbiAgICAgIENvbXBpbGVkVGVtcGxhdGUge1xuICAgIGlmICghbmdNb2R1bGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgQ29tcG9uZW50ICR7c3RyaW5naWZ5KGNvbXBUeXBlKX0gaXMgbm90IHBhcnQgb2YgYW55IE5nTW9kdWxlIG9yIHRoZSBtb2R1bGUgaGFzIG5vdCBiZWVuIGltcG9ydGVkIGludG8geW91ciBtb2R1bGUuYCk7XG4gICAgfVxuICAgIGxldCBjb21waWxlZFRlbXBsYXRlID0gdGhpcy5fY29tcGlsZWRIb3N0VGVtcGxhdGVDYWNoZS5nZXQoY29tcFR5cGUpO1xuICAgIGlmICghY29tcGlsZWRUZW1wbGF0ZSkge1xuICAgICAgY29uc3QgY29tcE1ldGEgPSB0aGlzLl9tZXRhZGF0YVJlc29sdmVyLmdldERpcmVjdGl2ZU1ldGFkYXRhKGNvbXBUeXBlKTtcbiAgICAgIGFzc2VydENvbXBvbmVudChjb21wTWV0YSk7XG5cbiAgICAgIGNvbnN0IGhvc3RNZXRhID0gdGhpcy5fbWV0YWRhdGFSZXNvbHZlci5nZXRIb3N0Q29tcG9uZW50TWV0YWRhdGEoXG4gICAgICAgICAgY29tcE1ldGEsIChjb21wTWV0YS5jb21wb25lbnRGYWN0b3J5IGFzIGFueSkudmlld0RlZkZhY3RvcnkpO1xuICAgICAgY29tcGlsZWRUZW1wbGF0ZSA9XG4gICAgICAgICAgbmV3IENvbXBpbGVkVGVtcGxhdGUodHJ1ZSwgY29tcE1ldGEudHlwZSwgaG9zdE1ldGEsIG5nTW9kdWxlLCBbY29tcE1ldGEudHlwZV0pO1xuICAgICAgdGhpcy5fY29tcGlsZWRIb3N0VGVtcGxhdGVDYWNoZS5zZXQoY29tcFR5cGUsIGNvbXBpbGVkVGVtcGxhdGUpO1xuICAgIH1cbiAgICByZXR1cm4gY29tcGlsZWRUZW1wbGF0ZTtcbiAgfVxuXG4gIHByaXZhdGUgX2NyZWF0ZUNvbXBpbGVkVGVtcGxhdGUoXG4gICAgICBjb21wTWV0YTogQ29tcGlsZURpcmVjdGl2ZU1ldGFkYXRhLCBuZ01vZHVsZTogQ29tcGlsZU5nTW9kdWxlTWV0YWRhdGEpOiBDb21waWxlZFRlbXBsYXRlIHtcbiAgICBsZXQgY29tcGlsZWRUZW1wbGF0ZSA9IHRoaXMuX2NvbXBpbGVkVGVtcGxhdGVDYWNoZS5nZXQoY29tcE1ldGEudHlwZS5yZWZlcmVuY2UpO1xuICAgIGlmICghY29tcGlsZWRUZW1wbGF0ZSkge1xuICAgICAgYXNzZXJ0Q29tcG9uZW50KGNvbXBNZXRhKTtcbiAgICAgIGNvbXBpbGVkVGVtcGxhdGUgPSBuZXcgQ29tcGlsZWRUZW1wbGF0ZShcbiAgICAgICAgICBmYWxzZSwgY29tcE1ldGEudHlwZSwgY29tcE1ldGEsIG5nTW9kdWxlLCBuZ01vZHVsZS50cmFuc2l0aXZlTW9kdWxlLmRpcmVjdGl2ZXMpO1xuICAgICAgdGhpcy5fY29tcGlsZWRUZW1wbGF0ZUNhY2hlLnNldChjb21wTWV0YS50eXBlLnJlZmVyZW5jZSwgY29tcGlsZWRUZW1wbGF0ZSk7XG4gICAgfVxuICAgIHJldHVybiBjb21waWxlZFRlbXBsYXRlO1xuICB9XG5cbiAgcHJpdmF0ZSBfY29tcGlsZVRlbXBsYXRlKHRlbXBsYXRlOiBDb21waWxlZFRlbXBsYXRlKSB7XG4gICAgaWYgKHRlbXBsYXRlLmlzQ29tcGlsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgY29tcE1ldGEgPSB0ZW1wbGF0ZS5jb21wTWV0YTtcbiAgICBjb25zdCBleHRlcm5hbFN0eWxlc2hlZXRzQnlNb2R1bGVVcmwgPSBuZXcgTWFwPHN0cmluZywgQ29tcGlsZWRTdHlsZXNoZWV0PigpO1xuICAgIGNvbnN0IG91dHB1dENvbnRleHQgPSBjcmVhdGVPdXRwdXRDb250ZXh0KCk7XG4gICAgY29uc3QgY29tcG9uZW50U3R5bGVzaGVldCA9IHRoaXMuX3N0eWxlQ29tcGlsZXIuY29tcGlsZUNvbXBvbmVudChvdXRwdXRDb250ZXh0LCBjb21wTWV0YSk7XG4gICAgY29tcE1ldGEudGVtcGxhdGUgIS5leHRlcm5hbFN0eWxlc2hlZXRzLmZvckVhY2goKHN0eWxlc2hlZXRNZXRhKSA9PiB7XG4gICAgICBjb25zdCBjb21waWxlZFN0eWxlc2hlZXQgPVxuICAgICAgICAgIHRoaXMuX3N0eWxlQ29tcGlsZXIuY29tcGlsZVN0eWxlcyhjcmVhdGVPdXRwdXRDb250ZXh0KCksIGNvbXBNZXRhLCBzdHlsZXNoZWV0TWV0YSk7XG4gICAgICBleHRlcm5hbFN0eWxlc2hlZXRzQnlNb2R1bGVVcmwuc2V0KHN0eWxlc2hlZXRNZXRhLm1vZHVsZVVybCAhLCBjb21waWxlZFN0eWxlc2hlZXQpO1xuICAgIH0pO1xuICAgIHRoaXMuX3Jlc29sdmVTdHlsZXNDb21waWxlUmVzdWx0KGNvbXBvbmVudFN0eWxlc2hlZXQsIGV4dGVybmFsU3R5bGVzaGVldHNCeU1vZHVsZVVybCk7XG4gICAgY29uc3QgcGlwZXMgPSB0ZW1wbGF0ZS5uZ01vZHVsZS50cmFuc2l0aXZlTW9kdWxlLnBpcGVzLm1hcChcbiAgICAgICAgcGlwZSA9PiB0aGlzLl9tZXRhZGF0YVJlc29sdmVyLmdldFBpcGVTdW1tYXJ5KHBpcGUucmVmZXJlbmNlKSk7XG4gICAgY29uc3Qge3RlbXBsYXRlOiBwYXJzZWRUZW1wbGF0ZSwgcGlwZXM6IHVzZWRQaXBlc30gPVxuICAgICAgICB0aGlzLl9wYXJzZVRlbXBsYXRlKGNvbXBNZXRhLCB0ZW1wbGF0ZS5uZ01vZHVsZSwgdGVtcGxhdGUuZGlyZWN0aXZlcyk7XG4gICAgY29uc3QgY29tcGlsZVJlc3VsdCA9IHRoaXMuX3ZpZXdDb21waWxlci5jb21waWxlQ29tcG9uZW50KFxuICAgICAgICBvdXRwdXRDb250ZXh0LCBjb21wTWV0YSwgcGFyc2VkVGVtcGxhdGUsIGlyLnZhcmlhYmxlKGNvbXBvbmVudFN0eWxlc2hlZXQuc3R5bGVzVmFyKSxcbiAgICAgICAgdXNlZFBpcGVzKTtcbiAgICBjb25zdCBldmFsUmVzdWx0ID0gdGhpcy5faW50ZXJwcmV0T3JKaXQoXG4gICAgICAgIHRlbXBsYXRlSml0VXJsKHRlbXBsYXRlLm5nTW9kdWxlLnR5cGUsIHRlbXBsYXRlLmNvbXBNZXRhKSwgb3V0cHV0Q29udGV4dC5zdGF0ZW1lbnRzKTtcbiAgICBjb25zdCB2aWV3Q2xhc3MgPSBldmFsUmVzdWx0W2NvbXBpbGVSZXN1bHQudmlld0NsYXNzVmFyXTtcbiAgICBjb25zdCByZW5kZXJlclR5cGUgPSBldmFsUmVzdWx0W2NvbXBpbGVSZXN1bHQucmVuZGVyZXJUeXBlVmFyXTtcbiAgICB0ZW1wbGF0ZS5jb21waWxlZCh2aWV3Q2xhc3MsIHJlbmRlcmVyVHlwZSk7XG4gIH1cblxuICBwcml2YXRlIF9wYXJzZVRlbXBsYXRlKFxuICAgICAgY29tcE1ldGE6IENvbXBpbGVEaXJlY3RpdmVNZXRhZGF0YSwgbmdNb2R1bGU6IENvbXBpbGVOZ01vZHVsZU1ldGFkYXRhLFxuICAgICAgZGlyZWN0aXZlSWRlbnRpZmllcnM6IENvbXBpbGVJZGVudGlmaWVyTWV0YWRhdGFbXSk6XG4gICAgICB7dGVtcGxhdGU6IFRlbXBsYXRlQXN0W10sIHBpcGVzOiBDb21waWxlUGlwZVN1bW1hcnlbXX0ge1xuICAgIC8vIE5vdGU6ICEgaXMgb2sgaGVyZSBhcyBjb21wb25lbnRzIGFsd2F5cyBoYXZlIGEgdGVtcGxhdGUuXG4gICAgY29uc3QgcHJlc2VydmVXaGl0ZXNwYWNlcyA9IGNvbXBNZXRhLnRlbXBsYXRlICEucHJlc2VydmVXaGl0ZXNwYWNlcztcbiAgICBjb25zdCBkaXJlY3RpdmVzID1cbiAgICAgICAgZGlyZWN0aXZlSWRlbnRpZmllcnMubWFwKGRpciA9PiB0aGlzLl9tZXRhZGF0YVJlc29sdmVyLmdldERpcmVjdGl2ZVN1bW1hcnkoZGlyLnJlZmVyZW5jZSkpO1xuICAgIGNvbnN0IHBpcGVzID0gbmdNb2R1bGUudHJhbnNpdGl2ZU1vZHVsZS5waXBlcy5tYXAoXG4gICAgICAgIHBpcGUgPT4gdGhpcy5fbWV0YWRhdGFSZXNvbHZlci5nZXRQaXBlU3VtbWFyeShwaXBlLnJlZmVyZW5jZSkpO1xuICAgIHJldHVybiB0aGlzLl90ZW1wbGF0ZVBhcnNlci5wYXJzZShcbiAgICAgICAgY29tcE1ldGEsIGNvbXBNZXRhLnRlbXBsYXRlICEuaHRtbEFzdCAhLCBkaXJlY3RpdmVzLCBwaXBlcywgbmdNb2R1bGUuc2NoZW1hcyxcbiAgICAgICAgdGVtcGxhdGVTb3VyY2VVcmwobmdNb2R1bGUudHlwZSwgY29tcE1ldGEsIGNvbXBNZXRhLnRlbXBsYXRlICEpLCBwcmVzZXJ2ZVdoaXRlc3BhY2VzKTtcbiAgfVxuXG4gIHByaXZhdGUgX3Jlc29sdmVTdHlsZXNDb21waWxlUmVzdWx0KFxuICAgICAgcmVzdWx0OiBDb21waWxlZFN0eWxlc2hlZXQsIGV4dGVybmFsU3R5bGVzaGVldHNCeU1vZHVsZVVybDogTWFwPHN0cmluZywgQ29tcGlsZWRTdHlsZXNoZWV0Pikge1xuICAgIHJlc3VsdC5kZXBlbmRlbmNpZXMuZm9yRWFjaCgoZGVwLCBpKSA9PiB7XG4gICAgICBjb25zdCBuZXN0ZWRDb21waWxlUmVzdWx0ID0gZXh0ZXJuYWxTdHlsZXNoZWV0c0J5TW9kdWxlVXJsLmdldChkZXAubW9kdWxlVXJsKSAhO1xuICAgICAgY29uc3QgbmVzdGVkU3R5bGVzQXJyID0gdGhpcy5fcmVzb2x2ZUFuZEV2YWxTdHlsZXNDb21waWxlUmVzdWx0KFxuICAgICAgICAgIG5lc3RlZENvbXBpbGVSZXN1bHQsIGV4dGVybmFsU3R5bGVzaGVldHNCeU1vZHVsZVVybCk7XG4gICAgICBkZXAuc2V0VmFsdWUobmVzdGVkU3R5bGVzQXJyKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgX3Jlc29sdmVBbmRFdmFsU3R5bGVzQ29tcGlsZVJlc3VsdChcbiAgICAgIHJlc3VsdDogQ29tcGlsZWRTdHlsZXNoZWV0LFxuICAgICAgZXh0ZXJuYWxTdHlsZXNoZWV0c0J5TW9kdWxlVXJsOiBNYXA8c3RyaW5nLCBDb21waWxlZFN0eWxlc2hlZXQ+KTogc3RyaW5nW10ge1xuICAgIHRoaXMuX3Jlc29sdmVTdHlsZXNDb21waWxlUmVzdWx0KHJlc3VsdCwgZXh0ZXJuYWxTdHlsZXNoZWV0c0J5TW9kdWxlVXJsKTtcbiAgICByZXR1cm4gdGhpcy5faW50ZXJwcmV0T3JKaXQoXG4gICAgICAgIHNoYXJlZFN0eWxlc2hlZXRKaXRVcmwocmVzdWx0Lm1ldGEsIHRoaXMuX3NoYXJlZFN0eWxlc2hlZXRDb3VudCsrKSxcbiAgICAgICAgcmVzdWx0Lm91dHB1dEN0eC5zdGF0ZW1lbnRzKVtyZXN1bHQuc3R5bGVzVmFyXTtcbiAgfVxuXG4gIHByaXZhdGUgX2ludGVycHJldE9ySml0KHNvdXJjZVVybDogc3RyaW5nLCBzdGF0ZW1lbnRzOiBpci5TdGF0ZW1lbnRbXSk6IGFueSB7XG4gICAgaWYgKCF0aGlzLl9jb21waWxlckNvbmZpZy51c2VKaXQpIHtcbiAgICAgIHJldHVybiBpbnRlcnByZXRTdGF0ZW1lbnRzKHN0YXRlbWVudHMsIHRoaXMuX3JlZmxlY3Rvcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBqaXRTdGF0ZW1lbnRzKHNvdXJjZVVybCwgc3RhdGVtZW50cywgdGhpcy5fcmVmbGVjdG9yLCB0aGlzLl9jb21waWxlckNvbmZpZy5qaXREZXZNb2RlKTtcbiAgICB9XG4gIH1cbn1cblxuY2xhc3MgQ29tcGlsZWRUZW1wbGF0ZSB7XG4gIHByaXZhdGUgX3ZpZXdDbGFzczogRnVuY3Rpb24gPSBudWxsICE7XG4gIGlzQ29tcGlsZWQgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyBpc0hvc3Q6IGJvb2xlYW4sIHB1YmxpYyBjb21wVHlwZTogQ29tcGlsZUlkZW50aWZpZXJNZXRhZGF0YSxcbiAgICAgIHB1YmxpYyBjb21wTWV0YTogQ29tcGlsZURpcmVjdGl2ZU1ldGFkYXRhLCBwdWJsaWMgbmdNb2R1bGU6IENvbXBpbGVOZ01vZHVsZU1ldGFkYXRhLFxuICAgICAgcHVibGljIGRpcmVjdGl2ZXM6IENvbXBpbGVJZGVudGlmaWVyTWV0YWRhdGFbXSkge31cblxuICBjb21waWxlZCh2aWV3Q2xhc3M6IEZ1bmN0aW9uLCByZW5kZXJlclR5cGU6IGFueSkge1xuICAgIHRoaXMuX3ZpZXdDbGFzcyA9IHZpZXdDbGFzcztcbiAgICAoPFByb3h5Q2xhc3M+dGhpcy5jb21wTWV0YS5jb21wb25lbnRWaWV3VHlwZSkuc2V0RGVsZWdhdGUodmlld0NsYXNzKTtcbiAgICBmb3IgKGxldCBwcm9wIGluIHJlbmRlcmVyVHlwZSkge1xuICAgICAgKDxhbnk+dGhpcy5jb21wTWV0YS5yZW5kZXJlclR5cGUpW3Byb3BdID0gcmVuZGVyZXJUeXBlW3Byb3BdO1xuICAgIH1cbiAgICB0aGlzLmlzQ29tcGlsZWQgPSB0cnVlO1xuICB9XG59XG5cbmZ1bmN0aW9uIGFzc2VydENvbXBvbmVudChtZXRhOiBDb21waWxlRGlyZWN0aXZlTWV0YWRhdGEpIHtcbiAgaWYgKCFtZXRhLmlzQ29tcG9uZW50KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgQ291bGQgbm90IGNvbXBpbGUgJyR7aWRlbnRpZmllck5hbWUobWV0YS50eXBlKX0nIGJlY2F1c2UgaXQgaXMgbm90IGEgY29tcG9uZW50LmApO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZU91dHB1dENvbnRleHQoKTogT3V0cHV0Q29udGV4dCB7XG4gIGNvbnN0IGltcG9ydEV4cHIgPSAoc3ltYm9sOiBhbnkpID0+XG4gICAgICBpci5pbXBvcnRFeHByKHtuYW1lOiBpZGVudGlmaWVyTmFtZShzeW1ib2wpLCBtb2R1bGVOYW1lOiBudWxsLCBydW50aW1lOiBzeW1ib2x9KTtcbiAgcmV0dXJuIHtzdGF0ZW1lbnRzOiBbXSwgZ2VuRmlsZVBhdGg6ICcnLCBpbXBvcnRFeHByLCBjb25zdGFudFBvb2w6IG5ldyBDb25zdGFudFBvb2woKX07XG59XG4iXX0=
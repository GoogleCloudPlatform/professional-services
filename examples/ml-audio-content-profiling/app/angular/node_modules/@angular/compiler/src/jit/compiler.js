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
        define("@angular/compiler/src/jit/compiler", ["require", "exports", "@angular/compiler/src/compile_metadata", "@angular/compiler/src/constant_pool", "@angular/compiler/src/output/output_ast", "@angular/compiler/src/output/output_interpreter", "@angular/compiler/src/output/output_jit", "@angular/compiler/src/util"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var compile_metadata_1 = require("@angular/compiler/src/compile_metadata");
    var constant_pool_1 = require("@angular/compiler/src/constant_pool");
    var ir = require("@angular/compiler/src/output/output_ast");
    var output_interpreter_1 = require("@angular/compiler/src/output/output_interpreter");
    var output_jit_1 = require("@angular/compiler/src/output/output_jit");
    var util_1 = require("@angular/compiler/src/util");
    /**
     * An internal module of the Angular compiler that begins with component types,
     * extracts templates, and eventually produces a compiled version of the component
     * ready for linking into an application.
     *
     * @security  When compiling templates at runtime, you must ensure that the entire template comes
     * from a trusted source. Attacker-controlled data introduced by a template could expose your
     * application to XSS risks.  For more detail, see the [Security Guide](http://g.co/ng/security).
     */
    var JitCompiler = /** @class */ (function () {
        function JitCompiler(_metadataResolver, _templateParser, _styleCompiler, _viewCompiler, _ngModuleCompiler, _summaryResolver, _reflector, _compilerConfig, _console, getExtraNgModuleProviders) {
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
        JitCompiler.prototype.compileModuleSync = function (moduleType) {
            return util_1.SyncAsync.assertSync(this._compileModuleAndComponents(moduleType, true));
        };
        JitCompiler.prototype.compileModuleAsync = function (moduleType) {
            return Promise.resolve(this._compileModuleAndComponents(moduleType, false));
        };
        JitCompiler.prototype.compileModuleAndAllComponentsSync = function (moduleType) {
            return util_1.SyncAsync.assertSync(this._compileModuleAndAllComponents(moduleType, true));
        };
        JitCompiler.prototype.compileModuleAndAllComponentsAsync = function (moduleType) {
            return Promise.resolve(this._compileModuleAndAllComponents(moduleType, false));
        };
        JitCompiler.prototype.getComponentFactory = function (component) {
            var summary = this._metadataResolver.getDirectiveSummary(component);
            return summary.componentFactory;
        };
        JitCompiler.prototype.loadAotSummaries = function (summaries) {
            this.clearCache();
            this._addAotSummaries(summaries);
        };
        JitCompiler.prototype._addAotSummaries = function (fn) {
            if (this._addedAotSummaries.has(fn)) {
                return;
            }
            this._addedAotSummaries.add(fn);
            var summaries = fn();
            for (var i = 0; i < summaries.length; i++) {
                var entry = summaries[i];
                if (typeof entry === 'function') {
                    this._addAotSummaries(entry);
                }
                else {
                    var summary = entry;
                    this._summaryResolver.addSummary({ symbol: summary.type.reference, metadata: null, type: summary });
                }
            }
        };
        JitCompiler.prototype.hasAotSummary = function (ref) { return !!this._summaryResolver.resolveSummary(ref); };
        JitCompiler.prototype._filterJitIdentifiers = function (ids) {
            var _this = this;
            return ids.map(function (mod) { return mod.reference; }).filter(function (ref) { return !_this.hasAotSummary(ref); });
        };
        JitCompiler.prototype._compileModuleAndComponents = function (moduleType, isSync) {
            var _this = this;
            return util_1.SyncAsync.then(this._loadModules(moduleType, isSync), function () {
                _this._compileComponents(moduleType, null);
                return _this._compileModule(moduleType);
            });
        };
        JitCompiler.prototype._compileModuleAndAllComponents = function (moduleType, isSync) {
            var _this = this;
            return util_1.SyncAsync.then(this._loadModules(moduleType, isSync), function () {
                var componentFactories = [];
                _this._compileComponents(moduleType, componentFactories);
                return {
                    ngModuleFactory: _this._compileModule(moduleType),
                    componentFactories: componentFactories
                };
            });
        };
        JitCompiler.prototype._loadModules = function (mainModule, isSync) {
            var _this = this;
            var loading = [];
            var mainNgModule = this._metadataResolver.getNgModuleMetadata(mainModule);
            // Note: for runtime compilation, we want to transitively compile all modules,
            // so we also need to load the declared directives / pipes for all nested modules.
            this._filterJitIdentifiers(mainNgModule.transitiveModule.modules).forEach(function (nestedNgModule) {
                // getNgModuleMetadata only returns null if the value passed in is not an NgModule
                var moduleMeta = _this._metadataResolver.getNgModuleMetadata(nestedNgModule);
                _this._filterJitIdentifiers(moduleMeta.declaredDirectives).forEach(function (ref) {
                    var promise = _this._metadataResolver.loadDirectiveMetadata(moduleMeta.type.reference, ref, isSync);
                    if (promise) {
                        loading.push(promise);
                    }
                });
                _this._filterJitIdentifiers(moduleMeta.declaredPipes)
                    .forEach(function (ref) { return _this._metadataResolver.getOrLoadPipeMetadata(ref); });
            });
            return util_1.SyncAsync.all(loading);
        };
        JitCompiler.prototype._compileModule = function (moduleType) {
            var ngModuleFactory = this._compiledNgModuleCache.get(moduleType);
            if (!ngModuleFactory) {
                var moduleMeta = this._metadataResolver.getNgModuleMetadata(moduleType);
                // Always provide a bound Compiler
                var extraProviders = this.getExtraNgModuleProviders(moduleMeta.type.reference);
                var outputCtx = createOutputContext();
                var compileResult = this._ngModuleCompiler.compile(outputCtx, moduleMeta, extraProviders);
                ngModuleFactory = this._interpretOrJit(compile_metadata_1.ngModuleJitUrl(moduleMeta), outputCtx.statements)[compileResult.ngModuleFactoryVar];
                this._compiledNgModuleCache.set(moduleMeta.type.reference, ngModuleFactory);
            }
            return ngModuleFactory;
        };
        /**
         * @internal
         */
        JitCompiler.prototype._compileComponents = function (mainModule, allComponentFactories) {
            var _this = this;
            var ngModule = this._metadataResolver.getNgModuleMetadata(mainModule);
            var moduleByJitDirective = new Map();
            var templates = new Set();
            var transJitModules = this._filterJitIdentifiers(ngModule.transitiveModule.modules);
            transJitModules.forEach(function (localMod) {
                var localModuleMeta = _this._metadataResolver.getNgModuleMetadata(localMod);
                _this._filterJitIdentifiers(localModuleMeta.declaredDirectives).forEach(function (dirRef) {
                    moduleByJitDirective.set(dirRef, localModuleMeta);
                    var dirMeta = _this._metadataResolver.getDirectiveMetadata(dirRef);
                    if (dirMeta.isComponent) {
                        templates.add(_this._createCompiledTemplate(dirMeta, localModuleMeta));
                        if (allComponentFactories) {
                            var template = _this._createCompiledHostTemplate(dirMeta.type.reference, localModuleMeta);
                            templates.add(template);
                            allComponentFactories.push(dirMeta.componentFactory);
                        }
                    }
                });
            });
            transJitModules.forEach(function (localMod) {
                var localModuleMeta = _this._metadataResolver.getNgModuleMetadata(localMod);
                _this._filterJitIdentifiers(localModuleMeta.declaredDirectives).forEach(function (dirRef) {
                    var dirMeta = _this._metadataResolver.getDirectiveMetadata(dirRef);
                    if (dirMeta.isComponent) {
                        dirMeta.entryComponents.forEach(function (entryComponentType) {
                            var moduleMeta = moduleByJitDirective.get(entryComponentType.componentType);
                            templates.add(_this._createCompiledHostTemplate(entryComponentType.componentType, moduleMeta));
                        });
                    }
                });
                localModuleMeta.entryComponents.forEach(function (entryComponentType) {
                    if (!_this.hasAotSummary(entryComponentType.componentType)) {
                        var moduleMeta = moduleByJitDirective.get(entryComponentType.componentType);
                        templates.add(_this._createCompiledHostTemplate(entryComponentType.componentType, moduleMeta));
                    }
                });
            });
            templates.forEach(function (template) { return _this._compileTemplate(template); });
        };
        JitCompiler.prototype.clearCacheFor = function (type) {
            this._compiledNgModuleCache.delete(type);
            this._metadataResolver.clearCacheFor(type);
            this._compiledHostTemplateCache.delete(type);
            var compiledTemplate = this._compiledTemplateCache.get(type);
            if (compiledTemplate) {
                this._compiledTemplateCache.delete(type);
            }
        };
        JitCompiler.prototype.clearCache = function () {
            // Note: don't clear the _addedAotSummaries, as they don't change!
            this._metadataResolver.clearCache();
            this._compiledTemplateCache.clear();
            this._compiledHostTemplateCache.clear();
            this._compiledNgModuleCache.clear();
        };
        JitCompiler.prototype._createCompiledHostTemplate = function (compType, ngModule) {
            if (!ngModule) {
                throw new Error("Component " + util_1.stringify(compType) + " is not part of any NgModule or the module has not been imported into your module.");
            }
            var compiledTemplate = this._compiledHostTemplateCache.get(compType);
            if (!compiledTemplate) {
                var compMeta = this._metadataResolver.getDirectiveMetadata(compType);
                assertComponent(compMeta);
                var hostMeta = this._metadataResolver.getHostComponentMetadata(compMeta, compMeta.componentFactory.viewDefFactory);
                compiledTemplate =
                    new CompiledTemplate(true, compMeta.type, hostMeta, ngModule, [compMeta.type]);
                this._compiledHostTemplateCache.set(compType, compiledTemplate);
            }
            return compiledTemplate;
        };
        JitCompiler.prototype._createCompiledTemplate = function (compMeta, ngModule) {
            var compiledTemplate = this._compiledTemplateCache.get(compMeta.type.reference);
            if (!compiledTemplate) {
                assertComponent(compMeta);
                compiledTemplate = new CompiledTemplate(false, compMeta.type, compMeta, ngModule, ngModule.transitiveModule.directives);
                this._compiledTemplateCache.set(compMeta.type.reference, compiledTemplate);
            }
            return compiledTemplate;
        };
        JitCompiler.prototype._compileTemplate = function (template) {
            var _this = this;
            if (template.isCompiled) {
                return;
            }
            var compMeta = template.compMeta;
            var externalStylesheetsByModuleUrl = new Map();
            var outputContext = createOutputContext();
            var componentStylesheet = this._styleCompiler.compileComponent(outputContext, compMeta);
            compMeta.template.externalStylesheets.forEach(function (stylesheetMeta) {
                var compiledStylesheet = _this._styleCompiler.compileStyles(createOutputContext(), compMeta, stylesheetMeta);
                externalStylesheetsByModuleUrl.set(stylesheetMeta.moduleUrl, compiledStylesheet);
            });
            this._resolveStylesCompileResult(componentStylesheet, externalStylesheetsByModuleUrl);
            var pipes = template.ngModule.transitiveModule.pipes.map(function (pipe) { return _this._metadataResolver.getPipeSummary(pipe.reference); });
            var _a = this._parseTemplate(compMeta, template.ngModule, template.directives), parsedTemplate = _a.template, usedPipes = _a.pipes;
            var compileResult = this._viewCompiler.compileComponent(outputContext, compMeta, parsedTemplate, ir.variable(componentStylesheet.stylesVar), usedPipes);
            var evalResult = this._interpretOrJit(compile_metadata_1.templateJitUrl(template.ngModule.type, template.compMeta), outputContext.statements);
            var viewClass = evalResult[compileResult.viewClassVar];
            var rendererType = evalResult[compileResult.rendererTypeVar];
            template.compiled(viewClass, rendererType);
        };
        JitCompiler.prototype._parseTemplate = function (compMeta, ngModule, directiveIdentifiers) {
            var _this = this;
            // Note: ! is ok here as components always have a template.
            var preserveWhitespaces = compMeta.template.preserveWhitespaces;
            var directives = directiveIdentifiers.map(function (dir) { return _this._metadataResolver.getDirectiveSummary(dir.reference); });
            var pipes = ngModule.transitiveModule.pipes.map(function (pipe) { return _this._metadataResolver.getPipeSummary(pipe.reference); });
            return this._templateParser.parse(compMeta, compMeta.template.htmlAst, directives, pipes, ngModule.schemas, compile_metadata_1.templateSourceUrl(ngModule.type, compMeta, compMeta.template), preserveWhitespaces);
        };
        JitCompiler.prototype._resolveStylesCompileResult = function (result, externalStylesheetsByModuleUrl) {
            var _this = this;
            result.dependencies.forEach(function (dep, i) {
                var nestedCompileResult = externalStylesheetsByModuleUrl.get(dep.moduleUrl);
                var nestedStylesArr = _this._resolveAndEvalStylesCompileResult(nestedCompileResult, externalStylesheetsByModuleUrl);
                dep.setValue(nestedStylesArr);
            });
        };
        JitCompiler.prototype._resolveAndEvalStylesCompileResult = function (result, externalStylesheetsByModuleUrl) {
            this._resolveStylesCompileResult(result, externalStylesheetsByModuleUrl);
            return this._interpretOrJit(compile_metadata_1.sharedStylesheetJitUrl(result.meta, this._sharedStylesheetCount++), result.outputCtx.statements)[result.stylesVar];
        };
        JitCompiler.prototype._interpretOrJit = function (sourceUrl, statements) {
            if (!this._compilerConfig.useJit) {
                return output_interpreter_1.interpretStatements(statements, this._reflector);
            }
            else {
                return output_jit_1.jitStatements(sourceUrl, statements, this._reflector, this._compilerConfig.jitDevMode);
            }
        };
        return JitCompiler;
    }());
    exports.JitCompiler = JitCompiler;
    var CompiledTemplate = /** @class */ (function () {
        function CompiledTemplate(isHost, compType, compMeta, ngModule, directives) {
            this.isHost = isHost;
            this.compType = compType;
            this.compMeta = compMeta;
            this.ngModule = ngModule;
            this.directives = directives;
            this._viewClass = null;
            this.isCompiled = false;
        }
        CompiledTemplate.prototype.compiled = function (viewClass, rendererType) {
            this._viewClass = viewClass;
            this.compMeta.componentViewType.setDelegate(viewClass);
            for (var prop in rendererType) {
                this.compMeta.rendererType[prop] = rendererType[prop];
            }
            this.isCompiled = true;
        };
        return CompiledTemplate;
    }());
    function assertComponent(meta) {
        if (!meta.isComponent) {
            throw new Error("Could not compile '" + compile_metadata_1.identifierName(meta.type) + "' because it is not a component.");
        }
    }
    function createOutputContext() {
        var importExpr = function (symbol) {
            return ir.importExpr({ name: compile_metadata_1.identifierName(symbol), moduleName: null, runtime: symbol });
        };
        return { statements: [], genFilePath: '', importExpr: importExpr, constantPool: new constant_pool_1.ConstantPool() };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci9zcmMvaml0L2NvbXBpbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBRUgsMkVBQWtVO0lBR2xVLHFFQUE4QztJQUk5Qyw0REFBMkM7SUFDM0Msc0ZBQWlFO0lBQ2pFLHNFQUFtRDtJQUtuRCxtREFBcUU7SUFRckU7Ozs7Ozs7O09BUUc7SUFDSDtRQVFFLHFCQUNZLGlCQUEwQyxFQUFVLGVBQStCLEVBQ25GLGNBQTZCLEVBQVUsYUFBMkIsRUFDbEUsaUJBQW1DLEVBQVUsZ0JBQXVDLEVBQ3BGLFVBQTRCLEVBQVUsZUFBK0IsRUFDckUsUUFBaUIsRUFDakIseUJBQXVFO1lBTHZFLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBeUI7WUFBVSxvQkFBZSxHQUFmLGVBQWUsQ0FBZ0I7WUFDbkYsbUJBQWMsR0FBZCxjQUFjLENBQWU7WUFBVSxrQkFBYSxHQUFiLGFBQWEsQ0FBYztZQUNsRSxzQkFBaUIsR0FBakIsaUJBQWlCLENBQWtCO1lBQVUscUJBQWdCLEdBQWhCLGdCQUFnQixDQUF1QjtZQUNwRixlQUFVLEdBQVYsVUFBVSxDQUFrQjtZQUFVLG9CQUFlLEdBQWYsZUFBZSxDQUFnQjtZQUNyRSxhQUFRLEdBQVIsUUFBUSxDQUFTO1lBQ2pCLDhCQUF5QixHQUF6Qix5QkFBeUIsQ0FBOEM7WUFiM0UsMkJBQXNCLEdBQUcsSUFBSSxHQUFHLEVBQTBCLENBQUM7WUFDM0QsK0JBQTBCLEdBQUcsSUFBSSxHQUFHLEVBQTBCLENBQUM7WUFDL0QsbUNBQThCLEdBQUcsSUFBSSxHQUFHLEVBQWMsQ0FBQztZQUN2RCwyQkFBc0IsR0FBRyxJQUFJLEdBQUcsRUFBZ0IsQ0FBQztZQUNqRCwyQkFBc0IsR0FBRyxDQUFDLENBQUM7WUFDM0IsdUJBQWtCLEdBQUcsSUFBSSxHQUFHLEVBQWUs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VSxHQUFHLElBQUksQ0FBQztRQUN6QixDQUFDO1FBQ0gsdUJBQUM7SUFBRCxDQUFDLEFBakJELElBaUJDO0lBRUQsU0FBUyxlQUFlLENBQUMsSUFBOEI7UUFDckQsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUU7WUFDckIsTUFBTSxJQUFJLEtBQUssQ0FDWCx3QkFBc0IsaUNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLHFDQUFrQyxDQUFDLENBQUM7U0FDeEY7SUFDSCxDQUFDO0lBRUQsU0FBUyxtQkFBbUI7UUFDMUIsSUFBTSxVQUFVLEdBQUcsVUFBQyxNQUFXO1lBQzNCLE9BQUEsRUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFDLElBQUksRUFBRSxpQ0FBYyxDQUFDLE1BQU0sQ0FBQyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBQyxDQUFDO1FBQWhGLENBQWdGLENBQUM7UUFDckYsT0FBTyxFQUFDLFVBQVUsRUFBRSxFQUFFLEVBQUUsV0FBVyxFQUFFLEVBQUUsRUFBRSxVQUFVLFlBQUEsRUFBRSxZQUFZLEVBQUUsSUFBSSw0QkFBWSxFQUFFLEVBQUMsQ0FBQztJQUN6RixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0NvbXBpbGVEaXJlY3RpdmVNZXRhZGF0YSwgQ29tcGlsZUlkZW50aWZpZXJNZXRhZGF0YSwgQ29tcGlsZU5nTW9kdWxlTWV0YWRhdGEsIENvbXBpbGVQaXBlU3VtbWFyeSwgQ29tcGlsZVByb3ZpZGVyTWV0YWRhdGEsIENvbXBpbGVTdHlsZXNoZWV0TWV0YWRhdGEsIENvbXBpbGVUeXBlU3VtbWFyeSwgUHJvdmlkZXJNZXRhLCBQcm94eUNsYXNzLCBpZGVudGlmaWVyTmFtZSwgbmdNb2R1bGVKaXRVcmwsIHNoYXJlZFN0eWxlc2hlZXRKaXRVcmwsIHRlbXBsYXRlSml0VXJsLCB0ZW1wbGF0ZVNvdXJjZVVybH0gZnJvbSAnLi4vY29tcGlsZV9tZXRhZGF0YSc7XG5pbXBvcnQge0NvbXBpbGVSZWZsZWN0b3J9IGZyb20gJy4uL2NvbXBpbGVfcmVmbGVjdG9yJztcbmltcG9ydCB7Q29tcGlsZXJDb25maWd9IGZyb20gJy4uL2NvbmZpZyc7XG5pbXBvcnQge0NvbnN0YW50UG9vbH0gZnJvbSAnLi4vY29uc3RhbnRfcG9vbCc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2NvcmUnO1xuaW1wb3J0IHtDb21waWxlTWV0YWRhdGFSZXNvbHZlcn0gZnJvbSAnLi4vbWV0YWRhdGFfcmVzb2x2ZXInO1xuaW1wb3J0IHtOZ01vZHVsZUNvbXBpbGVyfSBmcm9tICcuLi9uZ19tb2R1bGVfY29tcGlsZXInO1xuaW1wb3J0ICogYXMgaXIgZnJvbSAnLi4vb3V0cHV0L291dHB1dF9hc3QnO1xuaW1wb3J0IHtpbnRlcnByZXRTdGF0ZW1lbnRzfSBmcm9tICcuLi9vdXRwdXQvb3V0cHV0X2ludGVycHJldGVyJztcbmltcG9ydCB7aml0U3RhdGVtZW50c30gZnJvbSAnLi4vb3V0cHV0L291dHB1dF9qaXQnO1xuaW1wb3J0IHtDb21waWxlZFN0eWxlc2hlZXQsIFN0eWxlQ29tcGlsZXJ9IGZyb20gJy4uL3N0eWxlX2NvbXBpbGVyJztcbmltcG9ydCB7U3VtbWFyeVJlc29sdmVyfSBmcm9tICcuLi9zdW1tYXJ5X3Jlc29sdmVyJztcbmltcG9ydCB7VGVtcGxhdGVBc3R9IGZyb20gJy4uL3RlbXBsYXRlX3BhcnNlci90ZW1wbGF0ZV9hc3QnO1xuaW1wb3J0IHtUZW1wbGF0ZVBhcnNlcn0gZnJvbSAnLi4vdGVtcGxhdGVfcGFyc2VyL3RlbXBsYXRlX3BhcnNlcic7XG5pbXBvcnQge0NvbnNvbGUsIE91dHB1dENvbnRleHQsIFN5bmNBc3luYywgc3RyaW5naWZ5fSBmcm9tICcuLi91dGlsJztcbmltcG9ydCB7Vmlld0NvbXBpbGVyfSBmcm9tICcuLi92aWV3X2NvbXBpbGVyL3ZpZXdfY29tcGlsZXInO1xuXG5leHBvcnQgaW50ZXJmYWNlIE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXMge1xuICBuZ01vZHVsZUZhY3Rvcnk6IG9iamVjdDtcbiAgY29tcG9uZW50RmFjdG9yaWVzOiBvYmplY3RbXTtcbn1cblxuLyoqXG4gKiBBbiBpbnRlcm5hbCBtb2R1bGUgb2YgdGhlIEFuZ3VsYXIgY29tcGlsZXIgdGhhdCBiZWdpbnMgd2l0aCBjb21wb25lbnQgdHlwZXMsXG4gKiBleHRyYWN0cyB0ZW1wbGF0ZXMsIGFuZCBldmVudHVhbGx5IHByb2R1Y2VzIGEgY29tcGlsZWQgdmVyc2lvbiBvZiB0aGUgY29tcG9uZW50XG4gKiByZWFkeSBmb3IgbGlua2luZyBpbnRvIGFuIGFwcGxpY2F0aW9uLlxuICpcbiAqIEBzZWN1cml0eSAgV2hlbiBjb21waWxpbmcgdGVtcGxhdGVzIGF0IHJ1bnRpbWUsIHlvdSBtdXN0IGVuc3VyZSB0aGF0IHRoZSBlbnRpcmUgdGVtcGxhdGUgY29tZXNcbiAqIGZyb20gYSB0cnVzdGVkIHNvdXJjZS4gQXR0YWNrZXItY29udHJvbGxlZCBkYXRhIGludHJvZHVjZWQgYnkgYSB0ZW1wbGF0ZSBjb3VsZCBleHBvc2UgeW91clxuICogYXBwbGljYXRpb24gdG8gWFNTIHJpc2tzLiAgRm9yIG1vcmUgZGV0YWlsLCBzZWUgdGhlIFtTZWN1cml0eSBHdWlkZV0oaHR0cDovL2cuY28vbmcvc2VjdXJpdHkpLlxuICovXG5leHBvcnQgY2xhc3MgSml0Q29tcGlsZXIge1xuICBwcml2YXRlIF9jb21waWxlZFRlbXBsYXRlQ2FjaGUgPSBuZXcgTWFwPFR5cGUsIENvbXBpbGVkVGVtcGxhdGU+KCk7XG4gIHByaXZhdGUgX2NvbXBpbGVkSG9zdFRlbXBsYXRlQ2FjaGUgPSBuZXcgTWFwPFR5cGUsIENvbXBpbGVkVGVtcGxhdGU+KCk7XG4gIHByaXZhdGUgX2NvbXBpbGVkRGlyZWN0aXZlV3JhcHBlckNhY2hlID0gbmV3IE1hcDxUeXBlLCBUeXBlPigpO1xuICBwcml2YXRlIF9jb21waWxlZE5nTW9kdWxlQ2FjaGUgPSBuZXcgTWFwPFR5cGUsIG9iamVjdD4oKTtcbiAgcHJpdmF0ZSBfc2hhcmVkU3R5bGVzaGVldENvdW50ID0gMDtcbiAgcHJpdmF0ZSBfYWRkZWRBb3RTdW1tYXJpZXMgPSBuZXcgU2V0PCgpID0+IGFueVtdPigpO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBfbWV0YWRhdGFSZXNvbHZlcjogQ29tcGlsZU1ldGFkYXRhUmVzb2x2ZXIsIHByaXZhdGUgX3RlbXBsYXRlUGFyc2VyOiBUZW1wbGF0ZVBhcnNlcixcbiAgICAgIHByaXZhdGUgX3N0eWxlQ29tcGlsZXI6IFN0eWxlQ29tcGlsZXIsIHByaXZhdGUgX3ZpZXdDb21waWxlcjogVmlld0NvbXBpbGVyLFxuICAgICAgcHJpdmF0ZSBfbmdNb2R1bGVDb21waWxlcjogTmdNb2R1bGVDb21waWxlciwgcHJpdmF0ZSBfc3VtbWFyeVJlc29sdmVyOiBTdW1tYXJ5UmVzb2x2ZXI8VHlwZT4sXG4gICAgICBwcml2YXRlIF9yZWZsZWN0b3I6IENvbXBpbGVSZWZsZWN0b3IsIHByaXZhdGUgX2NvbXBpbGVyQ29uZmlnOiBDb21waWxlckNvbmZpZyxcbiAgICAgIHByaXZhdGUgX2NvbnNvbGU6IENvbnNvbGUsXG4gICAgICBwcml2YXRlIGdldEV4dHJhTmdNb2R1bGVQcm92aWRlcnM6IChuZ01vZHVsZTogYW55KSA9PiBDb21waWxlUHJvdmlkZXJNZXRhZGF0YVtdKSB7fVxuXG4gIGNvbXBpbGVNb2R1bGVTeW5jKG1vZHVsZVR5cGU6IFR5cGUpOiBvYmplY3Qge1xuICAgIHJldHVybiBTeW5jQXN5bmMuYXNzZXJ0U3luYyh0aGlzLl9jb21waWxlTW9kdWxlQW5kQ29tcG9uZW50cyhtb2R1bGVUeXBlLCB0cnVlKSk7XG4gIH1cblxuICBjb21waWxlTW9kdWxlQXN5bmMobW9kdWxlVHlwZTogVHlwZSk6IFByb21pc2U8b2JqZWN0PiB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLl9jb21waWxlTW9kdWxlQW5kQ29tcG9uZW50cyhtb2R1bGVUeXBlLCBmYWxzZSkpO1xuICB9XG5cbiAgY29tcGlsZU1vZHVsZUFuZEFsbENvbXBvbmVudHNTeW5jKG1vZHVsZVR5cGU6IFR5cGUpOiBNb2R1bGVXaXRoQ29tcG9uZW50RmFjdG9yaWVzIHtcbiAgICByZXR1cm4gU3luY0FzeW5jLmFzc2VydFN5bmModGhpcy5fY29tcGlsZU1vZHVsZUFuZEFsbENvbXBvbmVudHMobW9kdWxlVHlwZSwgdHJ1ZSkpO1xuICB9XG5cbiAgY29tcGlsZU1vZHVsZUFuZEFsbENvbXBvbmVudHNBc3luYyhtb2R1bGVUeXBlOiBUeXBlKTogUHJvbWlzZTxNb2R1bGVXaXRoQ29tcG9uZW50RmFjdG9yaWVzPiB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLl9jb21waWxlTW9kdWxlQW5kQWxsQ29tcG9uZW50cyhtb2R1bGVUeXBlLCBmYWxzZSkpO1xuICB9XG5cbiAgZ2V0Q29tcG9uZW50RmFjdG9yeShjb21wb25lbnQ6IFR5cGUpOiBvYmplY3Qge1xuICAgIGNvbnN0IHN1bW1hcnkgPSB0aGlzLl9tZXRhZGF0YVJlc29sdmVyLmdldERpcmVjdGl2ZVN1bW1hcnkoY29tcG9uZW50KTtcbiAgICByZXR1cm4gc3VtbWFyeS5jb21wb25lbnRGYWN0b3J5IGFzIG9iamVjdDtcbiAgfVxuXG4gIGxvYWRBb3RTdW1tYXJpZXMoc3VtbWFyaWVzOiAoKSA9PiBhbnlbXSkge1xuICAgIHRoaXMuY2xlYXJDYWNoZSgpO1xuICAgIHRoaXMuX2FkZEFvdFN1bW1hcmllcyhzdW1tYXJpZXMpO1xuICB9XG5cbiAgcHJpdmF0ZSBfYWRkQW90U3VtbWFyaWVzKGZuOiAoKSA9PiBhbnlbXSkge1xuICAgIGlmICh0aGlzLl9hZGRlZEFvdFN1bW1hcmllcy5oYXMoZm4pKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuX2FkZGVkQW90U3VtbWFyaWVzLmFkZChmbik7XG4gICAgY29uc3Qgc3VtbWFyaWVzID0gZm4oKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN1bW1hcmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZW50cnkgPSBzdW1tYXJpZXNbaV07XG4gICAgICBpZiAodHlwZW9mIGVudHJ5ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRoaXMuX2FkZEFvdFN1bW1hcmllcyhlbnRyeSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBzdW1tYXJ5ID0gZW50cnkgYXMgQ29tcGlsZVR5cGVTdW1tYXJ5O1xuICAgICAgICB0aGlzLl9zdW1tYXJ5UmVzb2x2ZXIuYWRkU3VtbWFyeShcbiAgICAgICAgICAgIHtzeW1ib2w6IHN1bW1hcnkudHlwZS5yZWZlcmVuY2UsIG1ldGFkYXRhOiBudWxsLCB0eXBlOiBzdW1tYXJ5fSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaGFzQW90U3VtbWFyeShyZWY6IFR5cGUpIHsgcmV0dXJuICEhdGhpcy5fc3VtbWFyeVJlc29sdmVyLnJlc29sdmVTdW1tYXJ5KHJlZik7IH1cblxuICBwcml2YXRlIF9maWx0ZXJKaXRJZGVudGlmaWVycyhpZHM6IENvbXBpbGVJZGVudGlmaWVyTWV0YWRhdGFbXSk6IGFueVtdIHtcbiAgICByZXR1cm4gaWRzLm1hcChtb2QgPT4gbW9kLnJlZmVyZW5jZSkuZmlsdGVyKChyZWYpID0+ICF0aGlzLmhhc0FvdFN1bW1hcnkocmVmKSk7XG4gIH1cblxuICBwcml2YXRlIF9jb21waWxlTW9kdWxlQW5kQ29tcG9uZW50cyhtb2R1bGVUeXBlOiBUeXBlLCBpc1N5bmM6IGJvb2xlYW4pOiBTeW5jQXN5bmM8b2JqZWN0PiB7XG4gICAgcmV0dXJuIFN5bmNBc3luYy50aGVuKHRoaXMuX2xvYWRNb2R1bGVzKG1vZHVsZVR5cGUsIGlzU3luYyksICgpID0+IHtcbiAgICAgIHRoaXMuX2NvbXBpbGVDb21wb25lbnRzKG1vZHVsZVR5cGUsIG51bGwpO1xuICAgICAgcmV0dXJuIHRoaXMuX2NvbXBpbGVNb2R1bGUobW9kdWxlVHlwZSk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIF9jb21waWxlTW9kdWxlQW5kQWxsQ29tcG9uZW50cyhtb2R1bGVUeXBlOiBUeXBlLCBpc1N5bmM6IGJvb2xlYW4pOlxuICAgICAgU3luY0FzeW5jPE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXM+IHtcbiAgICByZXR1cm4gU3luY0FzeW5jLnRoZW4odGhpcy5fbG9hZE1vZHVsZXMobW9kdWxlVHlwZSwgaXNTeW5jKSwgKCkgPT4ge1xuICAgICAgY29uc3QgY29tcG9uZW50RmFjdG9yaWVzOiBvYmplY3RbXSA9IFtdO1xuICAgICAgdGhpcy5fY29tcGlsZUNvbXBvbmVudHMobW9kdWxlVHlwZSwgY29tcG9uZW50RmFjdG9yaWVzKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIG5nTW9kdWxlRmFjdG9yeTogdGhpcy5fY29tcGlsZU1vZHVsZShtb2R1bGVUeXBlKSxcbiAgICAgICAgY29tcG9uZW50RmFjdG9yaWVzOiBjb21wb25lbnRGYWN0b3JpZXNcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIF9sb2FkTW9kdWxlcyhtYWluTW9kdWxlOiBhbnksIGlzU3luYzogYm9vbGVhbik6IFN5bmNBc3luYzxhbnk+IHtcbiAgICBjb25zdCBsb2FkaW5nOiBQcm9taXNlPGFueT5bXSA9IFtdO1xuICAgIGNvbnN0IG1haW5OZ01vZHVsZSA9IHRoaXMuX21ldGFkYXRhUmVzb2x2ZXIuZ2V0TmdNb2R1bGVNZXRhZGF0YShtYWluTW9kdWxlKSAhO1xuICAgIC8vIE5vdGU6IGZvciBydW50aW1lIGNvbXBpbGF0aW9uLCB3ZSB3YW50IHRvIHRyYW5zaXRpdmVseSBjb21waWxlIGFsbCBtb2R1bGVzLFxuICAgIC8vIHNvIHdlIGFsc28gbmVlZCB0byBsb2FkIHRoZSBkZWNsYXJlZCBkaXJlY3RpdmVzIC8gcGlwZXMgZm9yIGFsbCBuZXN0ZWQgbW9kdWxlcy5cbiAgICB0aGlzLl9maWx0ZXJKaXRJZGVudGlmaWVycyhtYWluTmdNb2R1bGUudHJhbnNpdGl2ZU1vZHVsZS5tb2R1bGVzKS5mb3JFYWNoKChuZXN0ZWROZ01vZHVsZSkgPT4ge1xuICAgICAgLy8gZ2V0TmdNb2R1bGVNZXRhZGF0YSBvbmx5IHJldHVybnMgbnVsbCBpZiB0aGUgdmFsdWUgcGFzc2VkIGluIGlzIG5vdCBhbiBOZ01vZHVsZVxuICAgICAgY29uc3QgbW9kdWxlTWV0YSA9IHRoaXMuX21ldGFkYXRhUmVzb2x2ZXIuZ2V0TmdNb2R1bGVNZXRhZGF0YShuZXN0ZWROZ01vZHVsZSkgITtcbiAgICAgIHRoaXMuX2ZpbHRlckppdElkZW50aWZpZXJzKG1vZHVsZU1ldGEuZGVjbGFyZWREaXJlY3RpdmVzKS5mb3JFYWNoKChyZWYpID0+IHtcbiAgICAgICAgY29uc3QgcHJvbWlzZSA9XG4gICAgICAgICAgICB0aGlzLl9tZXRhZGF0YVJlc29sdmVyLmxvYWREaXJlY3RpdmVNZXRhZGF0YShtb2R1bGVNZXRhLnR5cGUucmVmZXJlbmNlLCByZWYsIGlzU3luYyk7XG4gICAgICAgIGlmIChwcm9taXNlKSB7XG4gICAgICAgICAgbG9hZGluZy5wdXNoKHByb21pc2UpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHRoaXMuX2ZpbHRlckppdElkZW50aWZpZXJzKG1vZHVsZU1ldGEuZGVjbGFyZWRQaXBlcylcbiAgICAgICAgICAuZm9yRWFjaCgocmVmKSA9PiB0aGlzLl9tZXRhZGF0YVJlc29sdmVyLmdldE9yTG9hZFBpcGVNZXRhZGF0YShyZWYpKTtcbiAgICB9KTtcbiAgICByZXR1cm4gU3luY0FzeW5jLmFsbChsb2FkaW5nKTtcbiAgfVxuXG4gIHByaXZhdGUgX2NvbXBpbGVNb2R1bGUobW9kdWxlVHlwZTogVHlwZSk6IG9iamVjdCB7XG4gICAgbGV0IG5nTW9kdWxlRmFjdG9yeSA9IHRoaXMuX2NvbXBpbGVkTmdNb2R1bGVDYWNoZS5nZXQobW9kdWxlVHlwZSkgITtcbiAgICBpZiAoIW5nTW9kdWxlRmFjdG9yeSkge1xuICAgICAgY29uc3QgbW9kdWxlTWV0YSA9IHRoaXMuX21ldGFkYXRhUmVzb2x2ZXIuZ2V0TmdNb2R1bGVNZXRhZGF0YShtb2R1bGVUeXBlKSAhO1xuICAgICAgLy8gQWx3YXlzIHByb3ZpZGUgYSBib3VuZCBDb21waWxlclxuICAgICAgY29uc3QgZXh0cmFQcm92aWRlcnMgPSB0aGlzLmdldEV4dHJhTmdNb2R1bGVQcm92aWRlcnMobW9kdWxlTWV0YS50eXBlLnJlZmVyZW5jZSk7XG4gICAgICBjb25zdCBvdXRwdXRDdHggPSBjcmVhdGVPdXRwdXRDb250ZXh0KCk7XG4gICAgICBjb25zdCBjb21waWxlUmVzdWx0ID0gdGhpcy5fbmdNb2R1bGVDb21waWxlci5jb21waWxlKG91dHB1dEN0eCwgbW9kdWxlTWV0YSwgZXh0cmFQcm92aWRlcnMpO1xuICAgICAgbmdNb2R1bGVGYWN0b3J5ID0gdGhpcy5faW50ZXJwcmV0T3JKaXQoXG4gICAgICAgICAgbmdNb2R1bGVKaXRVcmwobW9kdWxlTWV0YSksIG91dHB1dEN0eC5zdGF0ZW1lbnRzKVtjb21waWxlUmVzdWx0Lm5nTW9kdWxlRmFjdG9yeVZhcl07XG4gICAgICB0aGlzLl9jb21waWxlZE5nTW9kdWxlQ2FjaGUuc2V0KG1vZHVsZU1ldGEudHlwZS5yZWZlcmVuY2UsIG5nTW9kdWxlRmFjdG9yeSk7XG4gICAgfVxuICAgIHJldHVybiBuZ01vZHVsZUZhY3Rvcnk7XG4gIH1cblxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfY29tcGlsZUNvbXBvbmVudHMobWFpbk1vZHVsZTogVHlwZSwgYWxsQ29tcG9uZW50RmFjdG9yaWVzOiBvYmplY3RbXXxudWxsKSB7XG4gICAgY29uc3QgbmdNb2R1bGUgPSB0aGlzLl9tZXRhZGF0YVJlc29sdmVyLmdldE5nTW9kdWxlTWV0YWRhdGEobWFpbk1vZHVsZSkgITtcbiAgICBjb25zdCBtb2R1bGVCeUppdERpcmVjdGl2ZSA9IG5ldyBNYXA8YW55LCBDb21waWxlTmdNb2R1bGVNZXRhZGF0YT4oKTtcbiAgICBjb25zdCB0ZW1wbGF0ZXMgPSBuZXcgU2V0PENvbXBpbGVkVGVtcGxhdGU+KCk7XG5cbiAgICBjb25zdCB0cmFuc0ppdE1vZHVsZXMgPSB0aGlzLl9maWx0ZXJKaXRJZGVudGlmaWVycyhuZ01vZHVsZS50cmFuc2l0aXZlTW9kdWxlLm1vZHVsZXMpO1xuICAgIHRyYW5zSml0TW9kdWxlcy5mb3JFYWNoKChsb2NhbE1vZCkgPT4ge1xuICAgICAgY29uc3QgbG9jYWxNb2R1bGVNZXRhID0gdGhpcy5fbWV0YWRhdGFSZXNvbHZlci5nZXROZ01vZHVsZU1ldGFkYXRhKGxvY2FsTW9kKSAhO1xuICAgICAgdGhpcy5fZmlsdGVySml0SWRlbnRpZmllcnMobG9jYWxNb2R1bGVNZXRhLmRlY2xhcmVkRGlyZWN0aXZlcykuZm9yRWFjaCgoZGlyUmVmKSA9PiB7XG4gICAgICAgIG1vZHVsZUJ5Sml0RGlyZWN0aXZlLnNldChkaXJSZWYsIGxvY2FsTW9kdWxlTWV0YSk7XG4gICAgICAgIGNvbnN0IGRpck1ldGEgPSB0aGlzLl9tZXRhZGF0YVJlc29sdmVyLmdldERpcmVjdGl2ZU1ldGFkYXRhKGRpclJlZik7XG4gICAgICAgIGlmIChkaXJNZXRhLmlzQ29tcG9uZW50KSB7XG4gICAgICAgICAgdGVtcGxhdGVzLmFkZCh0aGlzLl9jcmVhdGVDb21waWxlZFRlbXBsYXRlKGRpck1ldGEsIGxvY2FsTW9kdWxlTWV0YSkpO1xuICAgICAgICAgIGlmIChhbGxDb21wb25lbnRGYWN0b3JpZXMpIHtcbiAgICAgICAgICAgIGNvbnN0IHRlbXBsYXRlID1cbiAgICAgICAgICAgICAgICB0aGlzLl9jcmVhdGVDb21waWxlZEhvc3RUZW1wbGF0ZShkaXJNZXRhLnR5cGUucmVmZXJlbmNlLCBsb2NhbE1vZHVsZU1ldGEpO1xuICAgICAgICAgICAgdGVtcGxhdGVzLmFkZCh0ZW1wbGF0ZSk7XG4gICAgICAgICAgICBhbGxDb21wb25lbnRGYWN0b3JpZXMucHVzaChkaXJNZXRhLmNvbXBvbmVudEZhY3RvcnkgYXMgb2JqZWN0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHRyYW5zSml0TW9kdWxlcy5mb3JFYWNoKChsb2NhbE1vZCkgPT4ge1xuICAgICAgY29uc3QgbG9jYWxNb2R1bGVNZXRhID0gdGhpcy5fbWV0YWRhdGFSZXNvbHZlci5nZXROZ01vZHVsZU1ldGFkYXRhKGxvY2FsTW9kKSAhO1xuICAgICAgdGhpcy5fZmlsdGVySml0SWRlbnRpZmllcnMobG9jYWxNb2R1bGVNZXRhLmRlY2xhcmVkRGlyZWN0aXZlcykuZm9yRWFjaCgoZGlyUmVmKSA9PiB7XG4gICAgICAgIGNvbnN0IGRpck1ldGEgPSB0aGlzLl9tZXRhZGF0YVJlc29sdmVyLmdldERpcmVjdGl2ZU1ldGFkYXRhKGRpclJlZik7XG4gICAgICAgIGlmIChkaXJNZXRhLmlzQ29tcG9uZW50KSB7XG4gICAgICAgICAgZGlyTWV0YS5lbnRyeUNvbXBvbmVudHMuZm9yRWFjaCgoZW50cnlDb21wb25lbnRUeXBlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBtb2R1bGVNZXRhID0gbW9kdWxlQnlKaXREaXJlY3RpdmUuZ2V0KGVudHJ5Q29tcG9uZW50VHlwZS5jb21wb25lbnRUeXBlKSAhO1xuICAgICAgICAgICAgdGVtcGxhdGVzLmFkZChcbiAgICAgICAgICAgICAgICB0aGlzLl9jcmVhdGVDb21waWxlZEhvc3RUZW1wbGF0ZShlbnRyeUNvbXBvbmVudFR5cGUuY29tcG9uZW50VHlwZSwgbW9kdWxlTWV0YSkpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGxvY2FsTW9kdWxlTWV0YS5lbnRyeUNvbXBvbmVudHMuZm9yRWFjaCgoZW50cnlDb21wb25lbnRUeXBlKSA9PiB7XG4gICAgICAgIGlmICghdGhpcy5oYXNBb3RTdW1tYXJ5KGVudHJ5Q29tcG9uZW50VHlwZS5jb21wb25lbnRUeXBlKSkge1xuICAgICAgICAgIGNvbnN0IG1vZHVsZU1ldGEgPSBtb2R1bGVCeUppdERpcmVjdGl2ZS5nZXQoZW50cnlDb21wb25lbnRUeXBlLmNvbXBvbmVudFR5cGUpICE7XG4gICAgICAgICAgdGVtcGxhdGVzLmFkZChcbiAgICAgICAgICAgICAgdGhpcy5fY3JlYXRlQ29tcGlsZWRIb3N0VGVtcGxhdGUoZW50cnlDb21wb25lbnRUeXBlLmNvbXBvbmVudFR5cGUsIG1vZHVsZU1ldGEpKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gICAgdGVtcGxhdGVzLmZvckVhY2goKHRlbXBsYXRlKSA9PiB0aGlzLl9jb21waWxlVGVtcGxhdGUodGVtcGxhdGUpKTtcbiAgfVxuXG4gIGNsZWFyQ2FjaGVGb3IodHlwZTogVHlwZSkge1xuICAgIHRoaXMuX2NvbXBpbGVkTmdNb2R1bGVDYWNoZS5kZWxldGUodHlwZSk7XG4gICAgdGhpcy5fbWV0YWRhdGFSZXNvbHZlci5jbGVhckNhY2hlRm9yKHR5cGUpO1xuICAgIHRoaXMuX2NvbXBpbGVkSG9zdFRlbXBsYXRlQ2FjaGUuZGVsZXRlKHR5cGUpO1xuICAgIGNvbnN0IGNvbXBpbGVkVGVtcGxhdGUgPSB0aGlzLl9jb21waWxlZFRlbXBsYXRlQ2FjaGUuZ2V0KHR5cGUpO1xuICAgIGlmIChjb21waWxlZFRlbXBsYXRlKSB7XG4gICAgICB0aGlzLl9jb21waWxlZFRlbXBsYXRlQ2FjaGUuZGVsZXRlKHR5cGUpO1xuICAgIH1cbiAgfVxuXG4gIGNsZWFyQ2FjaGUoKTogdm9pZCB7XG4gICAgLy8gTm90ZTogZG9uJ3QgY2xlYXIgdGhlIF9hZGRlZEFvdFN1bW1hcmllcywgYXMgdGhleSBkb24ndCBjaGFuZ2UhXG4gICAgdGhpcy5fbWV0YWRhdGFSZXNvbHZlci5jbGVhckNhY2hlKCk7XG4gICAgdGhpcy5fY29tcGlsZWRUZW1wbGF0ZUNhY2hlLmNsZWFyKCk7XG4gICAgdGhpcy5fY29tcGlsZWRIb3N0VGVtcGxhdGVDYWNoZS5jbGVhcigpO1xuICAgIHRoaXMuX2NvbXBpbGVkTmdNb2R1bGVDYWNoZS5jbGVhcigpO1xuICB9XG5cbiAgcHJpdmF0ZSBfY3JlYXRlQ29tcGlsZWRIb3N0VGVtcGxhdGUoY29tcFR5cGU6IFR5cGUsIG5nTW9kdWxlOiBDb21waWxlTmdNb2R1bGVNZXRhZGF0YSk6XG4gICAgICBDb21waWxlZFRlbXBsYXRlIHtcbiAgICBpZiAoIW5nTW9kdWxlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYENvbXBvbmVudCAke3N0cmluZ2lmeShjb21wVHlwZSl9IGlzIG5vdCBwYXJ0IG9mIGFueSBOZ01vZHVsZSBvciB0aGUgbW9kdWxlIGhhcyBub3QgYmVlbiBpbXBvcnRlZCBpbnRvIHlvdXIgbW9kdWxlLmApO1xuICAgIH1cbiAgICBsZXQgY29tcGlsZWRUZW1wbGF0ZSA9IHRoaXMuX2NvbXBpbGVkSG9zdFRlbXBsYXRlQ2FjaGUuZ2V0KGNvbXBUeXBlKTtcbiAgICBpZiAoIWNvbXBpbGVkVGVtcGxhdGUpIHtcbiAgICAgIGNvbnN0IGNvbXBNZXRhID0gdGhpcy5fbWV0YWRhdGFSZXNvbHZlci5nZXREaXJlY3RpdmVNZXRhZGF0YShjb21wVHlwZSk7XG4gICAgICBhc3NlcnRDb21wb25lbnQoY29tcE1ldGEpO1xuXG4gICAgICBjb25zdCBob3N0TWV0YSA9IHRoaXMuX21ldGFkYXRhUmVzb2x2ZXIuZ2V0SG9zdENvbXBvbmVudE1ldGFkYXRhKFxuICAgICAgICAgIGNvbXBNZXRhLCAoY29tcE1ldGEuY29tcG9uZW50RmFjdG9yeSBhcyBhbnkpLnZpZXdEZWZGYWN0b3J5KTtcbiAgICAgIGNvbXBpbGVkVGVtcGxhdGUgPVxuICAgICAgICAgIG5ldyBDb21waWxlZFRlbXBsYXRlKHRydWUsIGNvbXBNZXRhLnR5cGUsIGhvc3RNZXRhLCBuZ01vZHVsZSwgW2NvbXBNZXRhLnR5cGVdKTtcbiAgICAgIHRoaXMuX2NvbXBpbGVkSG9zdFRlbXBsYXRlQ2FjaGUuc2V0KGNvbXBUeXBlLCBjb21waWxlZFRlbXBsYXRlKTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbXBpbGVkVGVtcGxhdGU7XG4gIH1cblxuICBwcml2YXRlIF9jcmVhdGVDb21waWxlZFRlbXBsYXRlKFxuICAgICAgY29tcE1ldGE6IENvbXBpbGVEaXJlY3RpdmVNZXRhZGF0YSwgbmdNb2R1bGU6IENvbXBpbGVOZ01vZHVsZU1ldGFkYXRhKTogQ29tcGlsZWRUZW1wbGF0ZSB7XG4gICAgbGV0IGNvbXBpbGVkVGVtcGxhdGUgPSB0aGlzLl9jb21waWxlZFRlbXBsYXRlQ2FjaGUuZ2V0KGNvbXBNZXRhLnR5cGUucmVmZXJlbmNlKTtcbiAgICBpZiAoIWNvbXBpbGVkVGVtcGxhdGUpIHtcbiAgICAgIGFzc2VydENvbXBvbmVudChjb21wTWV0YSk7XG4gICAgICBjb21waWxlZFRlbXBsYXRlID0gbmV3IENvbXBpbGVkVGVtcGxhdGUoXG4gICAgICAgICAgZmFsc2UsIGNvbXBNZXRhLnR5cGUsIGNvbXBNZXRhLCBuZ01vZHVsZSwgbmdNb2R1bGUudHJhbnNpdGl2ZU1vZHVsZS5kaXJlY3RpdmVzKTtcbiAgICAgIHRoaXMuX2NvbXBpbGVkVGVtcGxhdGVDYWNoZS5zZXQoY29tcE1ldGEudHlwZS5yZWZlcmVuY2UsIGNvbXBpbGVkVGVtcGxhdGUpO1xuICAgIH1cbiAgICByZXR1cm4gY29tcGlsZWRUZW1wbGF0ZTtcbiAgfVxuXG4gIHByaXZhdGUgX2NvbXBpbGVUZW1wbGF0ZSh0ZW1wbGF0ZTogQ29tcGlsZWRUZW1wbGF0ZSkge1xuICAgIGlmICh0ZW1wbGF0ZS5pc0NvbXBpbGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGNvbXBNZXRhID0gdGVtcGxhdGUuY29tcE1ldGE7XG4gICAgY29uc3QgZXh0ZXJuYWxTdHlsZXNoZWV0c0J5TW9kdWxlVXJsID0gbmV3IE1hcDxzdHJpbmcsIENvbXBpbGVkU3R5bGVzaGVldD4oKTtcbiAgICBjb25zdCBvdXRwdXRDb250ZXh0ID0gY3JlYXRlT3V0cHV0Q29udGV4dCgpO1xuICAgIGNvbnN0IGNvbXBvbmVudFN0eWxlc2hlZXQgPSB0aGlzLl9zdHlsZUNvbXBpbGVyLmNvbXBpbGVDb21wb25lbnQob3V0cHV0Q29udGV4dCwgY29tcE1ldGEpO1xuICAgIGNvbXBNZXRhLnRlbXBsYXRlICEuZXh0ZXJuYWxTdHlsZXNoZWV0cy5mb3JFYWNoKChzdHlsZXNoZWV0TWV0YSkgPT4ge1xuICAgICAgY29uc3QgY29tcGlsZWRTdHlsZXNoZWV0ID1cbiAgICAgICAgICB0aGlzLl9zdHlsZUNvbXBpbGVyLmNvbXBpbGVTdHlsZXMoY3JlYXRlT3V0cHV0Q29udGV4dCgpLCBjb21wTWV0YSwgc3R5bGVzaGVldE1ldGEpO1xuICAgICAgZXh0ZXJuYWxTdHlsZXNoZWV0c0J5TW9kdWxlVXJsLnNldChzdHlsZXNoZWV0TWV0YS5tb2R1bGVVcmwgISwgY29tcGlsZWRTdHlsZXNoZWV0KTtcbiAgICB9KTtcbiAgICB0aGlzLl9yZXNvbHZlU3R5bGVzQ29tcGlsZVJlc3VsdChjb21wb25lbnRTdHlsZXNoZWV0LCBleHRlcm5hbFN0eWxlc2hlZXRzQnlNb2R1bGVVcmwpO1xuICAgIGNvbnN0IHBpcGVzID0gdGVtcGxhdGUubmdNb2R1bGUudHJhbnNpdGl2ZU1vZHVsZS5waXBlcy5tYXAoXG4gICAgICAgIHBpcGUgPT4gdGhpcy5fbWV0YWRhdGFSZXNvbHZlci5nZXRQaXBlU3VtbWFyeShwaXBlLnJlZmVyZW5jZSkpO1xuICAgIGNvbnN0IHt0ZW1wbGF0ZTogcGFyc2VkVGVtcGxhdGUsIHBpcGVzOiB1c2VkUGlwZXN9ID1cbiAgICAgICAgdGhpcy5fcGFyc2VUZW1wbGF0ZShjb21wTWV0YSwgdGVtcGxhdGUubmdNb2R1bGUsIHRlbXBsYXRlLmRpcmVjdGl2ZXMpO1xuICAgIGNvbnN0IGNvbXBpbGVSZXN1bHQgPSB0aGlzLl92aWV3Q29tcGlsZXIuY29tcGlsZUNvbXBvbmVudChcbiAgICAgICAgb3V0cHV0Q29udGV4dCwgY29tcE1ldGEsIHBhcnNlZFRlbXBsYXRlLCBpci52YXJpYWJsZShjb21wb25lbnRTdHlsZXNoZWV0LnN0eWxlc1ZhciksXG4gICAgICAgIHVzZWRQaXBlcyk7XG4gICAgY29uc3QgZXZhbFJlc3VsdCA9IHRoaXMuX2ludGVycHJldE9ySml0KFxuICAgICAgICB0ZW1wbGF0ZUppdFVybCh0ZW1wbGF0ZS5uZ01vZHVsZS50eXBlLCB0ZW1wbGF0ZS5jb21wTWV0YSksIG91dHB1dENvbnRleHQuc3RhdGVtZW50cyk7XG4gICAgY29uc3Qgdmlld0NsYXNzID0gZXZhbFJlc3VsdFtjb21waWxlUmVzdWx0LnZpZXdDbGFzc1Zhcl07XG4gICAgY29uc3QgcmVuZGVyZXJUeXBlID0gZXZhbFJlc3VsdFtjb21waWxlUmVzdWx0LnJlbmRlcmVyVHlwZVZhcl07XG4gICAgdGVtcGxhdGUuY29tcGlsZWQodmlld0NsYXNzLCByZW5kZXJlclR5cGUpO1xuICB9XG5cbiAgcHJpdmF0ZSBfcGFyc2VUZW1wbGF0ZShcbiAgICAgIGNvbXBNZXRhOiBDb21waWxlRGlyZWN0aXZlTWV0YWRhdGEsIG5nTW9kdWxlOiBDb21waWxlTmdNb2R1bGVNZXRhZGF0YSxcbiAgICAgIGRpcmVjdGl2ZUlkZW50aWZpZXJzOiBDb21waWxlSWRlbnRpZmllck1ldGFkYXRhW10pOlxuICAgICAge3RlbXBsYXRlOiBUZW1wbGF0ZUFzdFtdLCBwaXBlczogQ29tcGlsZVBpcGVTdW1tYXJ5W119IHtcbiAgICAvLyBOb3RlOiAhIGlzIG9rIGhlcmUgYXMgY29tcG9uZW50cyBhbHdheXMgaGF2ZSBhIHRlbXBsYXRlLlxuICAgIGNvbnN0IHByZXNlcnZlV2hpdGVzcGFjZXMgPSBjb21wTWV0YS50ZW1wbGF0ZSAhLnByZXNlcnZlV2hpdGVzcGFjZXM7XG4gICAgY29uc3QgZGlyZWN0aXZlcyA9XG4gICAgICAgIGRpcmVjdGl2ZUlkZW50aWZpZXJzLm1hcChkaXIgPT4gdGhpcy5fbWV0YWRhdGFSZXNvbHZlci5nZXREaXJlY3RpdmVTdW1tYXJ5KGRpci5yZWZlcmVuY2UpKTtcbiAgICBjb25zdCBwaXBlcyA9IG5nTW9kdWxlLnRyYW5zaXRpdmVNb2R1bGUucGlwZXMubWFwKFxuICAgICAgICBwaXBlID0+IHRoaXMuX21ldGFkYXRhUmVzb2x2ZXIuZ2V0UGlwZVN1bW1hcnkocGlwZS5yZWZlcmVuY2UpKTtcbiAgICByZXR1cm4gdGhpcy5fdGVtcGxhdGVQYXJzZXIucGFyc2UoXG4gICAgICAgIGNvbXBNZXRhLCBjb21wTWV0YS50ZW1wbGF0ZSAhLmh0bWxBc3QgISwgZGlyZWN0aXZlcywgcGlwZXMsIG5nTW9kdWxlLnNjaGVtYXMsXG4gICAgICAgIHRlbXBsYXRlU291cmNlVXJsKG5nTW9kdWxlLnR5cGUsIGNvbXBNZXRhLCBjb21wTWV0YS50ZW1wbGF0ZSAhKSwgcHJlc2VydmVXaGl0ZXNwYWNlcyk7XG4gIH1cblxuICBwcml2YXRlIF9yZXNvbHZlU3R5bGVzQ29tcGlsZVJlc3VsdChcbiAgICAgIHJlc3VsdDogQ29tcGlsZWRTdHlsZXNoZWV0LCBleHRlcm5hbFN0eWxlc2hlZXRzQnlNb2R1bGVVcmw6IE1hcDxzdHJpbmcsIENvbXBpbGVkU3R5bGVzaGVldD4pIHtcbiAgICByZXN1bHQuZGVwZW5kZW5jaWVzLmZvckVhY2goKGRlcCwgaSkgPT4ge1xuICAgICAgY29uc3QgbmVzdGVkQ29tcGlsZVJlc3VsdCA9IGV4dGVybmFsU3R5bGVzaGVldHNCeU1vZHVsZVVybC5nZXQoZGVwLm1vZHVsZVVybCkgITtcbiAgICAgIGNvbnN0IG5lc3RlZFN0eWxlc0FyciA9IHRoaXMuX3Jlc29sdmVBbmRFdmFsU3R5bGVzQ29tcGlsZVJlc3VsdChcbiAgICAgICAgICBuZXN0ZWRDb21waWxlUmVzdWx0LCBleHRlcm5hbFN0eWxlc2hlZXRzQnlNb2R1bGVVcmwpO1xuICAgICAgZGVwLnNldFZhbHVlKG5lc3RlZFN0eWxlc0Fycik7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIF9yZXNvbHZlQW5kRXZhbFN0eWxlc0NvbXBpbGVSZXN1bHQoXG4gICAgICByZXN1bHQ6IENvbXBpbGVkU3R5bGVzaGVldCxcbiAgICAgIGV4dGVybmFsU3R5bGVzaGVldHNCeU1vZHVsZVVybDogTWFwPHN0cmluZywgQ29tcGlsZWRTdHlsZXNoZWV0Pik6IHN0cmluZ1tdIHtcbiAgICB0aGlzLl9yZXNvbHZlU3R5bGVzQ29tcGlsZVJlc3VsdChyZXN1bHQsIGV4dGVybmFsU3R5bGVzaGVldHNCeU1vZHVsZVVybCk7XG4gICAgcmV0dXJuIHRoaXMuX2ludGVycHJldE9ySml0KFxuICAgICAgICBzaGFyZWRTdHlsZXNoZWV0Sml0VXJsKHJlc3VsdC5tZXRhLCB0aGlzLl9zaGFyZWRTdHlsZXNoZWV0Q291bnQrKyksXG4gICAgICAgIHJlc3VsdC5vdXRwdXRDdHguc3RhdGVtZW50cylbcmVzdWx0LnN0eWxlc1Zhcl07XG4gIH1cblxuICBwcml2YXRlIF9pbnRlcnByZXRPckppdChzb3VyY2VVcmw6IHN0cmluZywgc3RhdGVtZW50czogaXIuU3RhdGVtZW50W10pOiBhbnkge1xuICAgIGlmICghdGhpcy5fY29tcGlsZXJDb25maWcudXNlSml0KSB7XG4gICAgICByZXR1cm4gaW50ZXJwcmV0U3RhdGVtZW50cyhzdGF0ZW1lbnRzLCB0aGlzLl9yZWZsZWN0b3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gaml0U3RhdGVtZW50cyhzb3VyY2VVcmwsIHN0YXRlbWVudHMsIHRoaXMuX3JlZmxlY3RvciwgdGhpcy5fY29tcGlsZXJDb25maWcuaml0RGV2TW9kZSk7XG4gICAgfVxuICB9XG59XG5cbmNsYXNzIENvbXBpbGVkVGVtcGxhdGUge1xuICBwcml2YXRlIF92aWV3Q2xhc3M6IEZ1bmN0aW9uID0gbnVsbCAhO1xuICBpc0NvbXBpbGVkID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgaXNIb3N0OiBib29sZWFuLCBwdWJsaWMgY29tcFR5cGU6IENvbXBpbGVJZGVudGlmaWVyTWV0YWRhdGEsXG4gICAgICBwdWJsaWMgY29tcE1ldGE6IENvbXBpbGVEaXJlY3RpdmVNZXRhZGF0YSwgcHVibGljIG5nTW9kdWxlOiBDb21waWxlTmdNb2R1bGVNZXRhZGF0YSxcbiAgICAgIHB1YmxpYyBkaXJlY3RpdmVzOiBDb21waWxlSWRlbnRpZmllck1ldGFkYXRhW10pIHt9XG5cbiAgY29tcGlsZWQodmlld0NsYXNzOiBGdW5jdGlvbiwgcmVuZGVyZXJUeXBlOiBhbnkpIHtcbiAgICB0aGlzLl92aWV3Q2xhc3MgPSB2aWV3Q2xhc3M7XG4gICAgKDxQcm94eUNsYXNzPnRoaXMuY29tcE1ldGEuY29tcG9uZW50Vmlld1R5cGUpLnNldERlbGVnYXRlKHZpZXdDbGFzcyk7XG4gICAgZm9yIChsZXQgcHJvcCBpbiByZW5kZXJlclR5cGUpIHtcbiAgICAgICg8YW55PnRoaXMuY29tcE1ldGEucmVuZGVyZXJUeXBlKVtwcm9wXSA9IHJlbmRlcmVyVHlwZVtwcm9wXTtcbiAgICB9XG4gICAgdGhpcy5pc0NvbXBpbGVkID0gdHJ1ZTtcbiAgfVxufVxuXG5mdW5jdGlvbiBhc3NlcnRDb21wb25lbnQobWV0YTogQ29tcGlsZURpcmVjdGl2ZU1ldGFkYXRhKSB7XG4gIGlmICghbWV0YS5pc0NvbXBvbmVudCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYENvdWxkIG5vdCBjb21waWxlICcke2lkZW50aWZpZXJOYW1lKG1ldGEudHlwZSl9JyBiZWNhdXNlIGl0IGlzIG5vdCBhIGNvbXBvbmVudC5gKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVPdXRwdXRDb250ZXh0KCk6IE91dHB1dENvbnRleHQge1xuICBjb25zdCBpbXBvcnRFeHByID0gKHN5bWJvbDogYW55KSA9PlxuICAgICAgaXIuaW1wb3J0RXhwcih7bmFtZTogaWRlbnRpZmllck5hbWUoc3ltYm9sKSwgbW9kdWxlTmFtZTogbnVsbCwgcnVudGltZTogc3ltYm9sfSk7XG4gIHJldHVybiB7c3RhdGVtZW50czogW10sIGdlbkZpbGVQYXRoOiAnJywgaW1wb3J0RXhwciwgY29uc3RhbnRQb29sOiBuZXcgQ29uc3RhbnRQb29sKCl9O1xufVxuIl19
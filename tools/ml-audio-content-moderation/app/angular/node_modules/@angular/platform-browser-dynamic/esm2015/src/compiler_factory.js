/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Compiler, Inject, InjectionToken, Optional, PACKAGE_ROOT_URL, TRANSLATIONS, isDevMode, ɵConsole as Console, ViewEncapsulation, Injector, TRANSLATIONS_FORMAT, MissingTranslationStrategy, } from '@angular/core';
import { StaticSymbolCache, JitCompiler, ProviderMeta, I18NHtmlParser, ViewCompiler, CompileMetadataResolver, UrlResolver, TemplateParser, NgModuleCompiler, JitSummaryResolver, SummaryResolver, StyleCompiler, PipeResolver, ElementSchemaRegistry, DomElementSchemaRegistry, ResourceLoader, NgModuleResolver, HtmlParser, CompileReflector, CompilerConfig, DirectiveNormalizer, DirectiveResolver, Lexer, Parser } from '@angular/compiler';
import { JitReflector } from './compiler_reflector';
/** @type {?} */
export const ERROR_COLLECTOR_TOKEN = new InjectionToken('ErrorCollector');
/** *
 * A default provider for {\@link PACKAGE_ROOT_URL} that maps to '/'.
  @type {?} */
export const DEFAULT_PACKAGE_URL_PROVIDER = {
    provide: PACKAGE_ROOT_URL,
    useValue: '/'
};
/** @type {?} */
const _NO_RESOURCE_LOADER = {
    /**
     * @param {?} url
     * @return {?}
     */
    get(url) {
        throw new Error(`No ResourceLoader implementation has been provided. Can't read the url "${url}"`);
    }
};
/** @type {?} */
const baseHtmlParser = new InjectionToken('HtmlParser');
export class CompilerImpl {
    /**
     * @param {?} injector
     * @param {?} _metadataResolver
     * @param {?} templateParser
     * @param {?} styleCompiler
     * @param {?} viewCompiler
     * @param {?} ngModuleCompiler
     * @param {?} summaryResolver
     * @param {?} compileReflector
     * @param {?} compilerConfig
     * @param {?} console
     */
    constructor(injector, _metadataResolver, templateParser, styleCompiler, viewCompiler, ngModuleCompiler, summaryResolver, compileReflector, compilerConfig, console) {
        this._metadataResolver = _metadataResolver;
        this._delegate = new JitCompiler(_metadataResolver, templateParser, styleCompiler, viewCompiler, ngModuleCompiler, summaryResolver, compileReflector, compilerConfig, console, this.getExtraNgModuleProviders.bind(this));
        this.injector = injector;
    }
    /**
     * @return {?}
     */
    getExtraNgModuleProviders() {
        return [this._metadataResolver.getProviderMetadata(new ProviderMeta(Compiler, { useValue: this }))];
    }
    /**
     * @template T
     * @param {?} moduleType
     * @return {?}
     */
    compileModuleSync(moduleType) {
        return /** @type {?} */ (this._delegate.compileModuleSync(moduleType));
    }
    /**
     * @template T
     * @param {?} moduleType
     * @return {?}
     */
    compileModuleAsync(moduleType) {
        return /** @type {?} */ (this._delegate.compileModuleAsync(moduleType));
    }
    /**
     * @template T
     * @param {?} moduleType
     * @return {?}
     */
    compileModuleAndAllComponentsSync(moduleType) {
        /** @type {?} */
        const result = this._delegate.compileModuleAndAllComponentsSync(moduleType);
        return {
            ngModuleFactory: /** @type {?} */ (result.ngModuleFactory),
            componentFactories: /** @type {?} */ (result.componentFactories),
        };
    }
    /**
     * @template T
     * @param {?} moduleType
     * @return {?}
     */
    compileModuleAndAllComponentsAsync(moduleType) {
        return this._delegate.compileModuleAndAllComponentsAsync(moduleType)
            .then((result) => ({
            ngModuleFactory: /** @type {?} */ (result.ngModuleFactory),
            componentFactories: /** @type {?} */ (result.componentFactories),
        }));
    }
    /**
     * @param {?} summaries
     * @return {?}
     */
    loadAotSummaries(summaries) { this._delegate.loadAotSummaries(summaries); }
    /**
     * @param {?} ref
     * @return {?}
     */
    hasAotSummary(ref) { return this._delegate.hasAotSummary(ref); }
    /**
     * @template T
     * @param {?} component
     * @return {?}
     */
    getComponentFactory(component) {
        return /** @type {?} */ (this._delegate.getComponentFactory(component));
    }
    /**
     * @return {?}
     */
    clearCache() { this._delegate.clearCache(); }
    /**
     * @param {?} type
     * @return {?}
     */
    clearCacheFor(type) { this._delegate.clearCacheFor(type); }
    /**
     * @param {?} moduleType
     * @return {?}
     */
    getModuleId(moduleType) {
        /** @type {?} */
        const meta = this._metadataResolver.getNgModuleMetadata(moduleType);
        return meta && meta.id || undefined;
    }
}
if (false) {
    /** @type {?} */
    CompilerImpl.prototype._delegate;
    /** @type {?} */
    CompilerImpl.prototype.injector;
    /** @type {?} */
    CompilerImpl.prototype._metadataResolver;
}
/** *
 * A set of providers that provide `JitCompiler` and its dependencies to use for
 * template compilation.
  @type {?} */
export const COMPILER_PROVIDERS = /** @type {?} */ ([
    { provide: CompileReflector, useValue: new JitReflector() },
    { provide: ResourceLoader, useValue: _NO_RESOURCE_LOADER },
    { provide: JitSummaryResolver, deps: [] },
    { provide: SummaryResolver, useExisting: JitSummaryResolver },
    { provide: Console, deps: [] },
    { provide: Lexer, deps: [] },
    { provide: Parser, deps: [Lexer] },
    {
        provide: baseHtmlParser,
        useClass: HtmlParser,
        deps: [],
    },
    {
        provide: I18NHtmlParser,
        useFactory: (parser, translations, format, config, console) => {
            translations = translations || '';
            /** @type {?} */
            const missingTranslation = translations ? /** @type {?} */ ((config.missingTranslation)) : MissingTranslationStrategy.Ignore;
            return new I18NHtmlParser(parser, translations, format, missingTranslation, console);
        },
        deps: [
            baseHtmlParser,
            [new Optional(), new Inject(TRANSLATIONS)],
            [new Optional(), new Inject(TRANSLATIONS_FORMAT)],
            [CompilerConfig],
            [Console],
        ]
    },
    {
        provide: HtmlParser,
        useExisting: I18NHtmlParser,
    },
    {
        provide: TemplateParser, deps: [CompilerConfig, CompileReflector,
            Parser, ElementSchemaRegistry,
            I18NHtmlParser, Console]
    },
    { provide: DirectiveNormalizer, deps: [ResourceLoader, UrlResolver, HtmlParser, CompilerConfig] },
    { provide: CompileMetadataResolver, deps: [CompilerConfig, HtmlParser, NgModuleResolver,
            DirectiveResolver, PipeResolver,
            SummaryResolver,
            ElementSchemaRegistry,
            DirectiveNormalizer, Console,
            [Optional, StaticSymbolCache],
            CompileReflector,
            [Optional, ERROR_COLLECTOR_TOKEN]] },
    DEFAULT_PACKAGE_URL_PROVIDER,
    { provide: StyleCompiler, deps: [UrlResolver] },
    { provide: ViewCompiler, deps: [CompileReflector] },
    { provide: NgModuleCompiler, deps: [CompileReflector] },
    { provide: CompilerConfig, useValue: new CompilerConfig() },
    { provide: Compiler, useClass: CompilerImpl, deps: [Injector, CompileMetadataResolver,
            TemplateParser, StyleCompiler,
            ViewCompiler, NgModuleCompiler,
            SummaryResolver, CompileReflector, CompilerConfig,
            Console] },
    { provide: DomElementSchemaRegistry, deps: [] },
    { provide: ElementSchemaRegistry, useExisting: DomElementSchemaRegistry },
    { provide: UrlResolver, deps: [PACKAGE_ROOT_URL] },
    { provide: DirectiveResolver, deps: [CompileReflector] },
    { provide: PipeResolver, deps: [CompileReflector] },
    { provide: NgModuleResolver, deps: [CompileReflector] },
]);
/**
 * \@publicApi
 */
export class JitCompilerFactory {
    /**
     * @param {?} defaultOptions
     */
    constructor(defaultOptions) {
        /** @type {?} */
        const compilerOptions = {
            useJit: true,
            defaultEncapsulation: ViewEncapsulation.Emulated,
            missingTranslation: MissingTranslationStrategy.Warning,
        };
        this._defaultOptions = [compilerOptions, ...defaultOptions];
    }
    /**
     * @param {?=} options
     * @return {?}
     */
    createCompiler(options = []) {
        /** @type {?} */
        const opts = _mergeOptions(this._defaultOptions.concat(options));
        /** @type {?} */
        const injector = Injector.create([
            COMPILER_PROVIDERS, {
                provide: CompilerConfig,
                useFactory: () => {
                    return new CompilerConfig({
                        // let explicit values from the compiler options overwrite options
                        // from the app providers
                        useJit: opts.useJit,
                        jitDevMode: isDevMode(),
                        // let explicit values from the compiler options overwrite options
                        // from the app providers
                        defaultEncapsulation: opts.defaultEncapsulation,
                        missingTranslation: opts.missingTranslation,
                        preserveWhitespaces: opts.preserveWhitespaces,
                    });
                },
                deps: []
            },
            /** @type {?} */ ((opts.providers))
        ]);
        return injector.get(Compiler);
    }
}
if (false) {
    /** @type {?} */
    JitCompilerFactory.prototype._defaultOptions;
}
/**
 * @param {?} optionsArr
 * @return {?}
 */
function _mergeOptions(optionsArr) {
    return {
        useJit: _lastDefined(optionsArr.map(options => options.useJit)),
        defaultEncapsulation: _lastDefined(optionsArr.map(options => options.defaultEncapsulation)),
        providers: _mergeArrays(optionsArr.map(options => /** @type {?} */ ((options.providers)))),
        missingTranslation: _lastDefined(optionsArr.map(options => options.missingTranslation)),
        preserveWhitespaces: _lastDefined(optionsArr.map(options => options.preserveWhitespaces)),
    };
}
/**
 * @template T
 * @param {?} args
 * @return {?}
 */
function _lastDefined(args) {
    for (let i = args.length - 1; i >= 0; i--) {
        if (args[i] !== undefined) {
            return args[i];
        }
    }
    return undefined;
}
/**
 * @param {?} parts
 * @return {?}
 */
function _mergeArrays(parts) {
    /** @type {?} */
    const result = [];
    parts.forEach((part) => part && result.push(...part));
    return result;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsZXJfZmFjdG9yeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL3BsYXRmb3JtLWJyb3dzZXItZHluYW1pYy9zcmMvY29tcGlsZXJfZmFjdG9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxRQUFRLEVBQW9GLE1BQU0sRUFBRSxjQUFjLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixFQUErQixZQUFZLEVBQVEsU0FBUyxFQUFnQixRQUFRLElBQUksT0FBTyxFQUFFLGlCQUFpQixFQUFFLFFBQVEsRUFBbUIsbUJBQW1CLEVBQUUsMEJBQTBCLEdBQUUsTUFBTSxlQUFlLENBQUM7QUFFNVcsT0FBTyxFQUFDLGlCQUFpQixFQUFFLFdBQVcsRUFBRSxZQUFZLEVBQXFCLGNBQWMsRUFBZSxZQUFZLEVBQUUsdUJBQXVCLEVBQUUsV0FBVyxFQUFFLGNBQWMsRUFBRSxnQkFBZ0IsRUFBRSxrQkFBa0IsRUFBRSxlQUFlLEVBQUUsYUFBYSxFQUFFLFlBQVksRUFBRSxxQkFBcUIsRUFBRSx3QkFBd0IsRUFBRSxjQUFjLEVBQUUsZ0JBQWdCLEVBQUUsVUFBVSxFQUFFLGdCQUFnQixFQUFFLGNBQWMsRUFBRSxtQkFBbUIsRUFBRSxpQkFBaUIsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFL2MsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLHNCQUFzQixDQUFDOztBQUVsRCxhQUFhLHFCQUFxQixHQUFHLElBQUksY0FBYyxDQUFDLGdCQUFnQixDQUFDLENBQUM7Ozs7QUFLMUUsYUFBYSw0QkFBNEIsR0FBRztJQUMxQyxPQUFPLEVBQUUsZ0JBQWdCO0lBQ3pCLFFBQVEsRUFBRSxHQUFHO0NBQ2QsQ0FBQzs7QUFFRixNQUFNLG1CQUFtQixHQUFtQjs7Ozs7SUFDMUMsR0FBRyxDQUFDLEdBQVc7UUFDWCxNQUFNLElBQUksS0FBSyxDQUNYLDJFQUEyRSxHQUFHLEdBQUcsQ0FBQyxDQUFDO0tBQUM7Q0FDN0YsQ0FBQzs7QUFFRixNQUFNLGNBQWMsR0FBRyxJQUFJLGNBQWMsQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUV4RCxNQUFNLE9BQU8sWUFBWTs7Ozs7Ozs7Ozs7OztJQUd2QixZQUNJLFFBQWtCLEVBQVUsaUJBQTBDLEVBQ3RFLGNBQThCLEVBQUUsYUFBNEIsRUFBRSxZQUEwQixFQUN4RixnQkFBa0MsRUFBRSxlQUEyQyxFQUMvRSxnQkFBa0MsRUFBRSxjQUE4QixFQUFFLE9BQWdCO1FBSHhELHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBeUI7UUFJeEUsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLFdBQVcsQ0FDNUIsaUJBQWlCLEVBQUUsY0FBYyxFQUFFLGFBQWEsRUFBRSxZQUFZLEVBQUUsZ0JBQWdCLEVBQ2hGLGVBQWUsRUFBRSxnQkFBZ0IsRUFBRSxjQUFjLEVBQUUsT0FBTyxFQUMxRCxJQUFJLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDL0MsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7S0FDMUI7Ozs7SUFFTyx5QkFBeUI7UUFDL0IsT0FBTyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxtQkFBbUIsQ0FDOUMsSUFBSSxZQUFZLENBQUMsUUFBUSxFQUFFLEVBQUMsUUFBUSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOzs7Ozs7O0lBR3JELGlCQUFpQixDQUFJLFVBQW1CO1FBQ3RDLHlCQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUF1QixFQUFDO0tBQzNFOzs7Ozs7SUFDRCxrQkFBa0IsQ0FBSSxVQUFtQjtRQUN2Qyx5QkFBTyxJQUFJLENBQUMsU0FBUyxDQUFDLGtCQUFrQixDQUFDLFVBQVUsQ0FBZ0MsRUFBQztLQUNyRjs7Ozs7O0lBQ0QsaUNBQWlDLENBQUksVUFBbUI7O1FBQ3RELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsaUNBQWlDLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDNUUsT0FBTztZQUNMLGVBQWUsb0JBQUUsTUFBTSxDQUFDLGVBQXFDLENBQUE7WUFDN0Qsa0JBQWtCLG9CQUFFLE1BQU0sQ0FBQyxrQkFBNkMsQ0FBQTtTQUN6RSxDQUFDO0tBQ0g7Ozs7OztJQUNELGtDQUFrQyxDQUFJLFVBQW1CO1FBRXZELE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxrQ0FBa0MsQ0FBQyxVQUFVLENBQUM7YUFDL0QsSUFBSSxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ1gsZUFBZSxvQkFBRSxNQUFNLENBQUMsZUFBcUMsQ0FBQTtZQUM3RCxrQkFBa0Isb0JBQUUsTUFBTSxDQUFDLGtCQUE2QyxDQUFBO1NBQ3pFLENBQUMsQ0FBQyxDQUFDO0tBQ2Y7Ozs7O0lBQ0QsZ0JBQWdCLENBQUMsU0FBc0IsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUU7Ozs7O0lBQ3hGLGFBQWEsQ0FBQyxHQUFjLElBQWEsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFOzs7Ozs7SUFDcEYsbUJBQW1CLENBQUksU0FBa0I7UUFDdkMseUJBQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLENBQXdCLEVBQUM7S0FDN0U7Ozs7SUFDRCxVQUFVLEtBQVcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxFQUFFOzs7OztJQUNuRCxhQUFhLENBQUMsSUFBZSxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUU7Ozs7O0lBQ3RFLFdBQVcsQ0FBQyxVQUFxQjs7UUFDL0IsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLG1CQUFtQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3BFLE9BQU8sSUFBSSxJQUFJLElBQUksQ0FBQyxFQUFFLElBQUksU0FBUyxDQUFDO0tBQ3JDO0NBQ0Y7Ozs7Ozs7Ozs7Ozs7QUFNRCxhQUFhLGtCQUFrQixxQkFBcUI7SUFDbEQsRUFBQyxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsUUFBUSxFQUFFLElBQUksWUFBWSxFQUFFLEVBQUM7SUFDekQsRUFBQyxPQUFPLEVBQUUsY0FBYyxFQUFFLFFBQVEsRUFBRSxtQkFBbUIsRUFBQztJQUN4RCxFQUFDLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFDO0lBQ3ZDLEVBQUMsT0FBTyxFQUFFLGVBQWUsRUFBRSxXQUFXLEVBQUUsa0JBQWtCLEVBQUM7SUFDM0QsRUFBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUM7SUFDNUIsRUFBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUM7SUFDMUIsRUFBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFDO0lBQ2hDO1FBQ0UsT0FBTyxFQUFFLGNBQWM7UUFDdkIsUUFBUSxFQUFFLFVBQVU7UUFDcEIsSUFBSSxFQUFFLEVBQUU7S0FDVDtJQUNEO1FBQ0UsT0FBTyxFQUFFLGNBQWM7UUFDdkIsVUFBVSxFQUFFLENBQUMsTUFBa0IsRUFBRSxZQUEyQixFQUFFLE1BQWMsRUFDL0QsTUFBc0IsRUFBRSxPQUFnQixFQUFFLEVBQUU7WUFDdkQsWUFBWSxHQUFHLFlBQVksSUFBSSxFQUFFLENBQUM7O1lBQ2xDLE1BQU0sa0JBQWtCLEdBQ3BCLFlBQVksQ0FBQyxDQUFDLG9CQUFDLE1BQU0sQ0FBQyxrQkFBa0IsR0FBRyxDQUFDLENBQUMsMEJBQTBCLENBQUMsTUFBTSxDQUFDO1lBQ25GLE9BQU8sSUFBSSxjQUFjLENBQUMsTUFBTSxFQUFFLFlBQVksRUFBRSxNQUFNLEVBQUUsa0JBQWtCLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDdEY7UUFDRCxJQUFJLEVBQUU7WUFDSixjQUFjO1lBQ2QsQ0FBQyxJQUFJLFFBQVEsRUFBRSxFQUFFLElBQUksTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQzFDLENBQUMsSUFBSSxRQUFRLEVBQUUsRUFBRSxJQUFJLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1lBQ2pELENBQUMsY0FBYyxDQUFDO1lBQ2hCLENBQUMsT0FBTyxDQUFDO1NBQ1Y7S0FDRjtJQUNEO1FBQ0UsT0FBTyxFQUFFLFVBQVU7UUFDbkIsV0FBVyxFQUFFLGNBQWM7S0FDNUI7SUFDRDtRQUNFLE9BQU8sRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFLENBQUMsY0FBYyxFQUFFLGdCQUFnQjtZQUNoRSxNQUFNLEVBQUUscUJBQXFCO1lBQzdCLGNBQWMsRUFBRSxPQUFPLENBQUM7S0FDekI7SUFDRCxFQUFFLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxjQUFjLEVBQUUsV0FBVyxFQUFFLFVBQVUsRUFBRSxjQUFjLENBQUMsRUFBQztJQUNoRyxFQUFFLE9BQU8sRUFBRSx1QkFBdUIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxjQUFjLEVBQUUsVUFBVSxFQUFFLGdCQUFnQjtZQUNuRSxpQkFBaUIsRUFBRSxZQUFZO1lBQy9CLGVBQWU7WUFDZixxQkFBcUI7WUFDckIsbUJBQW1CLEVBQUUsT0FBTztZQUM1QixDQUFDLFFBQVEsRUFBRSxpQkFBaUIsQ0FBQztZQUM3QixnQkFBZ0I7WUFDaEIsQ0FBQyxRQUFRLEVBQUUscUJBQXFCLENBQUMsQ0FBQyxFQUFDO0lBQ3ZELDRCQUE0QjtJQUM1QixFQUFFLE9BQU8sRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLENBQUMsV0FBVyxDQUFDLEVBQUM7SUFDOUMsRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxDQUFDLGdCQUFnQixDQUFDLEVBQUM7SUFDbEQsRUFBRSxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsRUFBRTtJQUN2RCxFQUFFLE9BQU8sRUFBRSxjQUFjLEVBQUUsUUFBUSxFQUFFLElBQUksY0FBYyxFQUFFLEVBQUM7SUFDMUQsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLENBQUMsUUFBUSxFQUFFLHVCQUF1QjtZQUN2RCxjQUFjLEVBQUUsYUFBYTtZQUM3QixZQUFZLEVBQUUsZ0JBQWdCO1lBQzlCLGVBQWUsRUFBRSxnQkFBZ0IsRUFBRSxjQUFjO1lBQ2pELE9BQU8sQ0FBQyxFQUFDO0lBQ3ZDLEVBQUUsT0FBTyxFQUFFLHdCQUF3QixFQUFFLElBQUksRUFBRSxFQUFFLEVBQUM7SUFDOUMsRUFBRSxPQUFPLEVBQUUscUJBQXFCLEVBQUUsV0FBVyxFQUFFLHdCQUF3QixFQUFDO0lBQ3hFLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFDO0lBQ2pELEVBQUUsT0FBTyxFQUFFLGlCQUFpQixFQUFFLElBQUksRUFBRSxDQUFDLGdCQUFnQixDQUFDLEVBQUM7SUFDdkQsRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxDQUFDLGdCQUFnQixDQUFDLEVBQUM7SUFDbEQsRUFBRSxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsRUFBQztDQUN2RCxFQUFDOzs7O0FBS0YsTUFBTSxPQUFPLGtCQUFrQjs7OztJQUk3QixZQUFZLGNBQWlDOztRQUMzQyxNQUFNLGVBQWUsR0FBb0I7WUFDdkMsTUFBTSxFQUFFLElBQUk7WUFDWixvQkFBb0IsRUFBRSxpQkFBaUIsQ0FBQyxRQUFRO1lBQ2hELGtCQUFrQixFQUFFLDBCQUEwQixDQUFDLE9BQU87U0FDdkQsQ0FBQztRQUVGLElBQUksQ0FBQyxlQUFlLEdBQUcsQ0FBQyxlQUFlLEVBQUUsR0FBRyxjQUFjLENBQUMsQ0FBQztLQUM3RDs7Ozs7SUFDRCxjQUFjLENBQUMsVUFBNkIsRUFBRTs7UUFDNUMsTUFBTSxJQUFJLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7O1FBQ2pFLE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUM7WUFDL0Isa0JBQWtCLEVBQUU7Z0JBQ2xCLE9BQU8sRUFBRSxjQUFjO2dCQUN2QixVQUFVLEVBQUUsR0FBRyxFQUFFO29CQUNmLE9BQU8sSUFBSSxjQUFjLENBQUM7Ozt3QkFHeEIsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNO3dCQUNuQixVQUFVLEVBQUUsU0FBUyxFQUFFOzs7d0JBR3ZCLG9CQUFvQixFQUFFLElBQUksQ0FBQyxvQkFBb0I7d0JBQy9DLGtCQUFrQixFQUFFLElBQUksQ0FBQyxrQkFBa0I7d0JBQzNDLG1CQUFtQixFQUFFLElBQUksQ0FBQyxtQkFBbUI7cUJBQzlDLENBQUMsQ0FBQztpQkFDSjtnQkFDRCxJQUFJLEVBQUUsRUFBRTthQUNUOytCQUNELElBQUksQ0FBQyxTQUFTO1NBQ2YsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxRQUFRLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0tBQy9CO0NBQ0Y7Ozs7Ozs7OztBQUVELFNBQVMsYUFBYSxDQUFDLFVBQTZCO0lBQ2xELE9BQU87UUFDTCxNQUFNLEVBQUUsWUFBWSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDL0Qsb0JBQW9CLEVBQUUsWUFBWSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUMzRixTQUFTLEVBQUUsWUFBWSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsb0JBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7UUFDdkUsa0JBQWtCLEVBQUUsWUFBWSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUN2RixtQkFBbUIsRUFBRSxZQUFZLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0tBQzFGLENBQUM7Q0FDSDs7Ozs7O0FBRUQsU0FBUyxZQUFZLENBQUksSUFBUztJQUNoQyxLQUFLLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDekMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssU0FBUyxFQUFFO1lBQ3pCLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ2hCO0tBQ0Y7SUFDRCxPQUFPLFNBQVMsQ0FBQztDQUNsQjs7Ozs7QUFFRCxTQUFTLFlBQVksQ0FBQyxLQUFjOztJQUNsQyxNQUFNLE1BQU0sR0FBVSxFQUFFLENBQUM7SUFDekIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3RELE9BQU8sTUFBTSxDQUFDO0NBQ2YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Q29tcGlsZXIsIENvbXBpbGVyRmFjdG9yeSwgQ29tcG9uZW50RmFjdG9yeSwgQ29tcGlsZXJPcHRpb25zLCBNb2R1bGVXaXRoQ29tcG9uZW50RmFjdG9yaWVzLCBJbmplY3QsIEluamVjdGlvblRva2VuLCBPcHRpb25hbCwgUEFDS0FHRV9ST09UX1VSTCwgUGxhdGZvcm1SZWYsIFN0YXRpY1Byb3ZpZGVyLCBUUkFOU0xBVElPTlMsIFR5cGUsIGlzRGV2TW9kZSwgcGxhdGZvcm1Db3JlLCDJtUNvbnNvbGUgYXMgQ29uc29sZSwgVmlld0VuY2Fwc3VsYXRpb24sIEluamVjdG9yLCBOZ01vZHVsZUZhY3RvcnksIFRSQU5TTEFUSU9OU19GT1JNQVQsIE1pc3NpbmdUcmFuc2xhdGlvblN0cmF0ZWd5LH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbmltcG9ydCB7U3RhdGljU3ltYm9sQ2FjaGUsIEppdENvbXBpbGVyLCBQcm92aWRlck1ldGEsIEV4dGVybmFsUmVmZXJlbmNlLCBJMThOSHRtbFBhcnNlciwgSWRlbnRpZmllcnMsIFZpZXdDb21waWxlciwgQ29tcGlsZU1ldGFkYXRhUmVzb2x2ZXIsIFVybFJlc29sdmVyLCBUZW1wbGF0ZVBhcnNlciwgTmdNb2R1bGVDb21waWxlciwgSml0U3VtbWFyeVJlc29sdmVyLCBTdW1tYXJ5UmVzb2x2ZXIsIFN0eWxlQ29tcGlsZXIsIFBpcGVSZXNvbHZlciwgRWxlbWVudFNjaGVtYVJlZ2lzdHJ5LCBEb21FbGVtZW50U2NoZW1hUmVnaXN0cnksIFJlc291cmNlTG9hZGVyLCBOZ01vZHVsZVJlc29sdmVyLCBIdG1sUGFyc2VyLCBDb21waWxlUmVmbGVjdG9yLCBDb21waWxlckNvbmZpZywgRGlyZWN0aXZlTm9ybWFsaXplciwgRGlyZWN0aXZlUmVzb2x2ZXIsIExleGVyLCBQYXJzZXJ9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcblxuaW1wb3J0IHtKaXRSZWZsZWN0b3J9IGZyb20gJy4vY29tcGlsZXJfcmVmbGVjdG9yJztcblxuZXhwb3J0IGNvbnN0IEVSUk9SX0NPTExFQ1RPUl9UT0tFTiA9IG5ldyBJbmplY3Rpb25Ub2tlbignRXJyb3JDb2xsZWN0b3InKTtcblxuLyoqXG4gKiBBIGRlZmF1bHQgcHJvdmlkZXIgZm9yIHtAbGluayBQQUNLQUdFX1JPT1RfVVJMfSB0aGF0IG1hcHMgdG8gJy8nLlxuICovXG5leHBvcnQgY29uc3QgREVGQVVMVF9QQUNLQUdFX1VSTF9QUk9WSURFUiA9IHtcbiAgcHJvdmlkZTogUEFDS0FHRV9ST09UX1VSTCxcbiAgdXNlVmFsdWU6ICcvJ1xufTtcblxuY29uc3QgX05PX1JFU09VUkNFX0xPQURFUjogUmVzb3VyY2VMb2FkZXIgPSB7XG4gIGdldCh1cmw6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPntcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgTm8gUmVzb3VyY2VMb2FkZXIgaW1wbGVtZW50YXRpb24gaGFzIGJlZW4gcHJvdmlkZWQuIENhbid0IHJlYWQgdGhlIHVybCBcIiR7dXJsfVwiYCk7fVxufTtcblxuY29uc3QgYmFzZUh0bWxQYXJzZXIgPSBuZXcgSW5qZWN0aW9uVG9rZW4oJ0h0bWxQYXJzZXInKTtcblxuZXhwb3J0IGNsYXNzIENvbXBpbGVySW1wbCBpbXBsZW1lbnRzIENvbXBpbGVyIHtcbiAgcHJpdmF0ZSBfZGVsZWdhdGU6IEppdENvbXBpbGVyO1xuICBwdWJsaWMgcmVhZG9ubHkgaW5qZWN0b3I6IEluamVjdG9yO1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIGluamVjdG9yOiBJbmplY3RvciwgcHJpdmF0ZSBfbWV0YWRhdGFSZXNvbHZlcjogQ29tcGlsZU1ldGFkYXRhUmVzb2x2ZXIsXG4gICAgICB0ZW1wbGF0ZVBhcnNlcjogVGVtcGxhdGVQYXJzZXIsIHN0eWxlQ29tcGlsZXI6IFN0eWxlQ29tcGlsZXIsIHZpZXdDb21waWxlcjogVmlld0NvbXBpbGVyLFxuICAgICAgbmdNb2R1bGVDb21waWxlcjogTmdNb2R1bGVDb21waWxlciwgc3VtbWFyeVJlc29sdmVyOiBTdW1tYXJ5UmVzb2x2ZXI8VHlwZTxhbnk+PixcbiAgICAgIGNvbXBpbGVSZWZsZWN0b3I6IENvbXBpbGVSZWZsZWN0b3IsIGNvbXBpbGVyQ29uZmlnOiBDb21waWxlckNvbmZpZywgY29uc29sZTogQ29uc29sZSkge1xuICAgIHRoaXMuX2RlbGVnYXRlID0gbmV3IEppdENvbXBpbGVyKFxuICAgICAgICBfbWV0YWRhdGFSZXNvbHZlciwgdGVtcGxhdGVQYXJzZXIsIHN0eWxlQ29tcGlsZXIsIHZpZXdDb21waWxlciwgbmdNb2R1bGVDb21waWxlcixcbiAgICAgICAgc3VtbWFyeVJlc29sdmVyLCBjb21waWxlUmVmbGVjdG9yLCBjb21waWxlckNvbmZpZywgY29uc29sZSxcbiAgICAgICAgdGhpcy5nZXRFeHRyYU5nTW9kdWxlUHJvdmlkZXJzLmJpbmQodGhpcykpO1xuICAgIHRoaXMuaW5qZWN0b3IgPSBpbmplY3RvcjtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0RXh0cmFOZ01vZHVsZVByb3ZpZGVycygpIHtcbiAgICByZXR1cm4gW3RoaXMuX21ldGFkYXRhUmVzb2x2ZXIuZ2V0UHJvdmlkZXJNZXRhZGF0YShcbiAgICAgICAgbmV3IFByb3ZpZGVyTWV0YShDb21waWxlciwge3VzZVZhbHVlOiB0aGlzfSkpXTtcbiAgfVxuXG4gIGNvbXBpbGVNb2R1bGVTeW5jPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pOiBOZ01vZHVsZUZhY3Rvcnk8VD4ge1xuICAgIHJldHVybiB0aGlzLl9kZWxlZ2F0ZS5jb21waWxlTW9kdWxlU3luYyhtb2R1bGVUeXBlKSBhcyBOZ01vZHVsZUZhY3Rvcnk8VD47XG4gIH1cbiAgY29tcGlsZU1vZHVsZUFzeW5jPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pOiBQcm9taXNlPE5nTW9kdWxlRmFjdG9yeTxUPj4ge1xuICAgIHJldHVybiB0aGlzLl9kZWxlZ2F0ZS5jb21waWxlTW9kdWxlQXN5bmMobW9kdWxlVHlwZSkgYXMgUHJvbWlzZTxOZ01vZHVsZUZhY3Rvcnk8VD4+O1xuICB9XG4gIGNvbXBpbGVNb2R1bGVBbmRBbGxDb21wb25lbnRzU3luYzxUPihtb2R1bGVUeXBlOiBUeXBlPFQ+KTogTW9kdWxlV2l0aENvbXBvbmVudEZhY3RvcmllczxUPiB7XG4gICAgY29uc3QgcmVzdWx0ID0gdGhpcy5fZGVsZWdhdGUuY29tcGlsZU1vZHVsZUFuZEFsbENvbXBvbmVudHNTeW5jKG1vZHVsZVR5cGUpO1xuICAgIHJldHVybiB7XG4gICAgICBuZ01vZHVsZUZhY3Rvcnk6IHJlc3VsdC5uZ01vZHVsZUZhY3RvcnkgYXMgTmdNb2R1bGVGYWN0b3J5PFQ+LFxuICAgICAgY29tcG9uZW50RmFjdG9yaWVzOiByZXN1bHQuY29tcG9uZW50RmFjdG9yaWVzIGFzIENvbXBvbmVudEZhY3Rvcnk8YW55PltdLFxuICAgIH07XG4gIH1cbiAgY29tcGlsZU1vZHVsZUFuZEFsbENvbXBvbmVudHNBc3luYzxUPihtb2R1bGVUeXBlOiBUeXBlPFQ+KTpcbiAgICAgIFByb21pc2U8TW9kdWxlV2l0aENvbXBvbmVudEZhY3RvcmllczxUPj4ge1xuICAgIHJldHVybiB0aGlzLl9kZWxlZ2F0ZS5jb21waWxlTW9kdWxlQW5kQWxsQ29tcG9uZW50c0FzeW5jKG1vZHVsZVR5cGUpXG4gICAgICAgIC50aGVuKChyZXN1bHQpID0+ICh7XG4gICAgICAgICAgICAgICAgbmdNb2R1bGVGYWN0b3J5OiByZXN1bHQubmdNb2R1bGVGYWN0b3J5IGFzIE5nTW9kdWxlRmFjdG9yeTxUPixcbiAgICAgICAgICAgICAgICBjb21wb25lbnRGYWN0b3JpZXM6IHJlc3VsdC5jb21wb25lbnRGYWN0b3JpZXMgYXMgQ29tcG9uZW50RmFjdG9yeTxhbnk+W10sXG4gICAgICAgICAgICAgIH0pKTtcbiAgfVxuICBsb2FkQW90U3VtbWFyaWVzKHN1bW1hcmllczogKCkgPT4gYW55W10pIHsgdGhpcy5fZGVsZWdhdGUubG9hZEFvdFN1bW1hcmllcyhzdW1tYXJpZXMpOyB9XG4gIGhhc0FvdFN1bW1hcnkocmVmOiBUeXBlPGFueT4pOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuX2RlbGVnYXRlLmhhc0FvdFN1bW1hcnkocmVmKTsgfVxuICBnZXRDb21wb25lbnRGYWN0b3J5PFQ+KGNvbXBvbmVudDogVHlwZTxUPik6IENvbXBvbmVudEZhY3Rvcnk8VD4ge1xuICAgIHJldHVybiB0aGlzLl9kZWxlZ2F0ZS5nZXRDb21wb25lbnRGYWN0b3J5KGNvbXBvbmVudCkgYXMgQ29tcG9uZW50RmFjdG9yeTxUPjtcbiAgfVxuICBjbGVhckNhY2hlKCk6IHZvaWQgeyB0aGlzLl9kZWxlZ2F0ZS5jbGVhckNhY2hlKCk7IH1cbiAgY2xlYXJDYWNoZUZvcih0eXBlOiBUeXBlPGFueT4pIHsgdGhpcy5fZGVsZWdhdGUuY2xlYXJDYWNoZUZvcih0eXBlKTsgfVxuICBnZXRNb2R1bGVJZChtb2R1bGVUeXBlOiBUeXBlPGFueT4pOiBzdHJpbmd8dW5kZWZpbmVkIHtcbiAgICBjb25zdCBtZXRhID0gdGhpcy5fbWV0YWRhdGFSZXNvbHZlci5nZXROZ01vZHVsZU1ldGFkYXRhKG1vZHVsZVR5cGUpO1xuICAgIHJldHVybiBtZXRhICYmIG1ldGEuaWQgfHwgdW5kZWZpbmVkO1xuICB9XG59XG5cbi8qKlxuICogQSBzZXQgb2YgcHJvdmlkZXJzIHRoYXQgcHJvdmlkZSBgSml0Q29tcGlsZXJgIGFuZCBpdHMgZGVwZW5kZW5jaWVzIHRvIHVzZSBmb3JcbiAqIHRlbXBsYXRlIGNvbXBpbGF0aW9uLlxuICovXG5leHBvcnQgY29uc3QgQ09NUElMRVJfUFJPVklERVJTID0gPFN0YXRpY1Byb3ZpZGVyW10+W1xuICB7cHJvdmlkZTogQ29tcGlsZVJlZmxlY3RvciwgdXNlVmFsdWU6IG5ldyBKaXRSZWZsZWN0b3IoKX0sXG4gIHtwcm92aWRlOiBSZXNvdXJjZUxvYWRlciwgdXNlVmFsdWU6IF9OT19SRVNPVVJDRV9MT0FERVJ9LFxuICB7cHJvdmlkZTogSml0U3VtbWFyeVJlc29sdmVyLCBkZXBzOiBbXX0sXG4gIHtwcm92aWRlOiBTdW1tYXJ5UmVzb2x2ZXIsIHVzZUV4aXN0aW5nOiBKaXRTdW1tYXJ5UmVzb2x2ZXJ9LFxuICB7cHJvdmlkZTogQ29uc29sZSwgZGVwczogW119LFxuICB7cHJvdmlkZTogTGV4ZXIsIGRlcHM6IFtdfSxcbiAge3Byb3ZpZGU6IFBhcnNlciwgZGVwczogW0xleGVyXX0sXG4gIHtcbiAgICBwcm92aWRlOiBiYXNlSHRtbFBhcnNlcixcbiAgICB1c2VDbGFzczogSHRtbFBhcnNlcixcbiAgICBkZXBzOiBbXSxcbiAgfSxcbiAge1xuICAgIHByb3ZpZGU6IEkxOE5IdG1sUGFyc2VyLFxuICAgIHVzZUZhY3Rvcnk6IChwYXJzZXI6IEh0bWxQYXJzZXIsIHRyYW5zbGF0aW9uczogc3RyaW5nIHwgbnVsbCwgZm9ybWF0OiBzdHJpbmcsXG4gICAgICAgICAgICAgICAgIGNvbmZpZzogQ29tcGlsZXJDb25maWcsIGNvbnNvbGU6IENvbnNvbGUpID0+IHtcbiAgICAgIHRyYW5zbGF0aW9ucyA9IHRyYW5zbGF0aW9ucyB8fCAnJztcbiAgICAgIGNvbnN0IG1pc3NpbmdUcmFuc2xhdGlvbiA9XG4gICAgICAgICAgdHJhbnNsYXRpb25zID8gY29uZmlnLm1pc3NpbmdUcmFuc2xhdGlvbiAhIDogTWlzc2luZ1RyYW5zbGF0aW9uU3RyYXRlZ3kuSWdub3JlO1xuICAgICAgcmV0dXJuIG5ldyBJMThOSHRtbFBhcnNlcihwYXJzZXIsIHRyYW5zbGF0aW9ucywgZm9ybWF0LCBtaXNzaW5nVHJhbnNsYXRpb24sIGNvbnNvbGUpO1xuICAgIH0sXG4gICAgZGVwczogW1xuICAgICAgYmFzZUh0bWxQYXJzZXIsXG4gICAgICBbbmV3IE9wdGlvbmFsKCksIG5ldyBJbmplY3QoVFJBTlNMQVRJT05TKV0sXG4gICAgICBbbmV3IE9wdGlvbmFsKCksIG5ldyBJbmplY3QoVFJBTlNMQVRJT05TX0ZPUk1BVCldLFxuICAgICAgW0NvbXBpbGVyQ29uZmlnXSxcbiAgICAgIFtDb25zb2xlXSxcbiAgICBdXG4gIH0sXG4gIHtcbiAgICBwcm92aWRlOiBIdG1sUGFyc2VyLFxuICAgIHVzZUV4aXN0aW5nOiBJMThOSHRtbFBhcnNlcixcbiAgfSxcbiAge1xuICAgIHByb3ZpZGU6IFRlbXBsYXRlUGFyc2VyLCBkZXBzOiBbQ29tcGlsZXJDb25maWcsIENvbXBpbGVSZWZsZWN0b3IsXG4gICAgUGFyc2VyLCBFbGVtZW50U2NoZW1hUmVnaXN0cnksXG4gICAgSTE4Tkh0bWxQYXJzZXIsIENvbnNvbGVdXG4gIH0sXG4gIHsgcHJvdmlkZTogRGlyZWN0aXZlTm9ybWFsaXplciwgZGVwczogW1Jlc291cmNlTG9hZGVyLCBVcmxSZXNvbHZlciwgSHRtbFBhcnNlciwgQ29tcGlsZXJDb25maWddfSxcbiAgeyBwcm92aWRlOiBDb21waWxlTWV0YWRhdGFSZXNvbHZlciwgZGVwczogW0NvbXBpbGVyQ29uZmlnLCBIdG1sUGFyc2VyLCBOZ01vZHVsZVJlc29sdmVyLFxuICAgICAgICAgICAgICAgICAgICAgIERpcmVjdGl2ZVJlc29sdmVyLCBQaXBlUmVzb2x2ZXIsXG4gICAgICAgICAgICAgICAgICAgICAgU3VtbWFyeVJlc29sdmVyLFxuICAgICAgICAgICAgICAgICAgICAgIEVsZW1lbnRTY2hlbWFSZWdpc3RyeSxcbiAgICAgICAgICAgICAgICAgICAgICBEaXJlY3RpdmVOb3JtYWxpemVyLCBDb25zb2xlLFxuICAgICAgICAgICAgICAgICAgICAgIFtPcHRpb25hbCwgU3RhdGljU3ltYm9sQ2FjaGVdLFxuICAgICAgICAgICAgICAgICAgICAgIENvbXBpbGVSZWZsZWN0b3IsXG4gICAgICAgICAgICAgICAgICAgICAgW09wdGlvbmFsLCBFUlJPUl9DT0xMRUNUT1JfVE9LRU5dXX0sXG4gIERFRkFVTFRfUEFDS0FHRV9VUkxfUFJPVklERVIsXG4gIHsgcHJvdmlkZTogU3R5bGVDb21waWxlciwgZGVwczogW1VybFJlc29sdmVyXX0sXG4gIHsgcHJvdmlkZTogVmlld0NvbXBpbGVyLCBkZXBzOiBbQ29tcGlsZVJlZmxlY3Rvcl19LFxuICB7IHByb3ZpZGU6IE5nTW9kdWxlQ29tcGlsZXIsIGRlcHM6IFtDb21waWxlUmVmbGVjdG9yXSB9LFxuICB7IHByb3ZpZGU6IENvbXBpbGVyQ29uZmlnLCB1c2VWYWx1ZTogbmV3IENvbXBpbGVyQ29uZmlnKCl9LFxuICB7IHByb3ZpZGU6IENvbXBpbGVyLCB1c2VDbGFzczogQ29tcGlsZXJJbXBsLCBkZXBzOiBbSW5qZWN0b3IsIENvbXBpbGVNZXRhZGF0YVJlc29sdmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUZW1wbGF0ZVBhcnNlciwgU3R5bGVDb21waWxlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVmlld0NvbXBpbGVyLCBOZ01vZHVsZUNvbXBpbGVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBTdW1tYXJ5UmVzb2x2ZXIsIENvbXBpbGVSZWZsZWN0b3IsIENvbXBpbGVyQ29uZmlnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBDb25zb2xlXX0sXG4gIHsgcHJvdmlkZTogRG9tRWxlbWVudFNjaGVtYVJlZ2lzdHJ5LCBkZXBzOiBbXX0sXG4gIHsgcHJvdmlkZTogRWxlbWVudFNjaGVtYVJlZ2lzdHJ5LCB1c2VFeGlzdGluZzogRG9tRWxlbWVudFNjaGVtYVJlZ2lzdHJ5fSxcbiAgeyBwcm92aWRlOiBVcmxSZXNvbHZlciwgZGVwczogW1BBQ0tBR0VfUk9PVF9VUkxdfSxcbiAgeyBwcm92aWRlOiBEaXJlY3RpdmVSZXNvbHZlciwgZGVwczogW0NvbXBpbGVSZWZsZWN0b3JdfSxcbiAgeyBwcm92aWRlOiBQaXBlUmVzb2x2ZXIsIGRlcHM6IFtDb21waWxlUmVmbGVjdG9yXX0sXG4gIHsgcHJvdmlkZTogTmdNb2R1bGVSZXNvbHZlciwgZGVwczogW0NvbXBpbGVSZWZsZWN0b3JdfSxcbl07XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgSml0Q29tcGlsZXJGYWN0b3J5IGltcGxlbWVudHMgQ29tcGlsZXJGYWN0b3J5IHtcbiAgcHJpdmF0ZSBfZGVmYXVsdE9wdGlvbnM6IENvbXBpbGVyT3B0aW9uc1tdO1xuXG4gIC8qIEBpbnRlcm5hbCAqL1xuICBjb25zdHJ1Y3RvcihkZWZhdWx0T3B0aW9uczogQ29tcGlsZXJPcHRpb25zW10pIHtcbiAgICBjb25zdCBjb21waWxlck9wdGlvbnM6IENvbXBpbGVyT3B0aW9ucyA9IHtcbiAgICAgIHVzZUppdDogdHJ1ZSxcbiAgICAgIGRlZmF1bHRFbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbi5FbXVsYXRlZCxcbiAgICAgIG1pc3NpbmdUcmFuc2xhdGlvbjogTWlzc2luZ1RyYW5zbGF0aW9uU3RyYXRlZ3kuV2FybmluZyxcbiAgICB9O1xuXG4gICAgdGhpcy5fZGVmYXVsdE9wdGlvbnMgPSBbY29tcGlsZXJPcHRpb25zLCAuLi5kZWZhdWx0T3B0aW9uc107XG4gIH1cbiAgY3JlYXRlQ29tcGlsZXIob3B0aW9uczogQ29tcGlsZXJPcHRpb25zW10gPSBbXSk6IENvbXBpbGVyIHtcbiAgICBjb25zdCBvcHRzID0gX21lcmdlT3B0aW9ucyh0aGlzLl9kZWZhdWx0T3B0aW9ucy5jb25jYXQob3B0aW9ucykpO1xuICAgIGNvbnN0IGluamVjdG9yID0gSW5qZWN0b3IuY3JlYXRlKFtcbiAgICAgIENPTVBJTEVSX1BST1ZJREVSUywge1xuICAgICAgICBwcm92aWRlOiBDb21waWxlckNvbmZpZyxcbiAgICAgICAgdXNlRmFjdG9yeTogKCkgPT4ge1xuICAgICAgICAgIHJldHVybiBuZXcgQ29tcGlsZXJDb25maWcoe1xuICAgICAgICAgICAgLy8gbGV0IGV4cGxpY2l0IHZhbHVlcyBmcm9tIHRoZSBjb21waWxlciBvcHRpb25zIG92ZXJ3cml0ZSBvcHRpb25zXG4gICAgICAgICAgICAvLyBmcm9tIHRoZSBhcHAgcHJvdmlkZXJzXG4gICAgICAgICAgICB1c2VKaXQ6IG9wdHMudXNlSml0LFxuICAgICAgICAgICAgaml0RGV2TW9kZTogaXNEZXZNb2RlKCksXG4gICAgICAgICAgICAvLyBsZXQgZXhwbGljaXQgdmFsdWVzIGZyb20gdGhlIGNvbXBpbGVyIG9wdGlvbnMgb3ZlcndyaXRlIG9wdGlvbnNcbiAgICAgICAgICAgIC8vIGZyb20gdGhlIGFwcCBwcm92aWRlcnNcbiAgICAgICAgICAgIGRlZmF1bHRFbmNhcHN1bGF0aW9uOiBvcHRzLmRlZmF1bHRFbmNhcHN1bGF0aW9uLFxuICAgICAgICAgICAgbWlzc2luZ1RyYW5zbGF0aW9uOiBvcHRzLm1pc3NpbmdUcmFuc2xhdGlvbixcbiAgICAgICAgICAgIHByZXNlcnZlV2hpdGVzcGFjZXM6IG9wdHMucHJlc2VydmVXaGl0ZXNwYWNlcyxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgZGVwczogW11cbiAgICAgIH0sXG4gICAgICBvcHRzLnByb3ZpZGVycyAhXG4gICAgXSk7XG4gICAgcmV0dXJuIGluamVjdG9yLmdldChDb21waWxlcik7XG4gIH1cbn1cblxuZnVuY3Rpb24gX21lcmdlT3B0aW9ucyhvcHRpb25zQXJyOiBDb21waWxlck9wdGlvbnNbXSk6IENvbXBpbGVyT3B0aW9ucyB7XG4gIHJldHVybiB7XG4gICAgdXNlSml0OiBfbGFzdERlZmluZWQob3B0aW9uc0Fyci5tYXAob3B0aW9ucyA9PiBvcHRpb25zLnVzZUppdCkpLFxuICAgIGRlZmF1bHRFbmNhcHN1bGF0aW9uOiBfbGFzdERlZmluZWQob3B0aW9uc0Fyci5tYXAob3B0aW9ucyA9PiBvcHRpb25zLmRlZmF1bHRFbmNhcHN1bGF0aW9uKSksXG4gICAgcHJvdmlkZXJzOiBfbWVyZ2VBcnJheXMob3B0aW9uc0Fyci5tYXAob3B0aW9ucyA9PiBvcHRpb25zLnByb3ZpZGVycyAhKSksXG4gICAgbWlzc2luZ1RyYW5zbGF0aW9uOiBfbGFzdERlZmluZWQob3B0aW9uc0Fyci5tYXAob3B0aW9ucyA9PiBvcHRpb25zLm1pc3NpbmdUcmFuc2xhdGlvbikpLFxuICAgIHByZXNlcnZlV2hpdGVzcGFjZXM6IF9sYXN0RGVmaW5lZChvcHRpb25zQXJyLm1hcChvcHRpb25zID0+IG9wdGlvbnMucHJlc2VydmVXaGl0ZXNwYWNlcykpLFxuICB9O1xufVxuXG5mdW5jdGlvbiBfbGFzdERlZmluZWQ8VD4oYXJnczogVFtdKTogVHx1bmRlZmluZWQge1xuICBmb3IgKGxldCBpID0gYXJncy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGlmIChhcmdzW2ldICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBhcmdzW2ldO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBfbWVyZ2VBcnJheXMocGFydHM6IGFueVtdW10pOiBhbnlbXSB7XG4gIGNvbnN0IHJlc3VsdDogYW55W10gPSBbXTtcbiAgcGFydHMuZm9yRWFjaCgocGFydCkgPT4gcGFydCAmJiByZXN1bHQucHVzaCguLi5wYXJ0KSk7XG4gIHJldHVybiByZXN1bHQ7XG59XG4iXX0=
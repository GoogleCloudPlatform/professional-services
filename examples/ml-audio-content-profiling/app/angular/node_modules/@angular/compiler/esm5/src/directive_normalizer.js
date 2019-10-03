/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { CompileStylesheetMetadata, CompileTemplateMetadata, templateSourceUrl } from './compile_metadata';
import { preserveWhitespacesDefault } from './config';
import { ViewEncapsulation } from './core';
import * as html from './ml_parser/ast';
import { InterpolationConfig } from './ml_parser/interpolation_config';
import { extractStyleUrls, isStyleUrlResolvable } from './style_url_resolver';
import { PreparsedElementType, preparseElement } from './template_parser/template_preparser';
import { SyncAsync, isDefined, stringify, syntaxError } from './util';
var DirectiveNormalizer = /** @class */ (function () {
    function DirectiveNormalizer(_resourceLoader, _urlResolver, _htmlParser, _config) {
        this._resourceLoader = _resourceLoader;
        this._urlResolver = _urlResolver;
        this._htmlParser = _htmlParser;
        this._config = _config;
        this._resourceLoaderCache = new Map();
    }
    DirectiveNormalizer.prototype.clearCache = function () { this._resourceLoaderCache.clear(); };
    DirectiveNormalizer.prototype.clearCacheFor = function (normalizedDirective) {
        var _this = this;
        if (!normalizedDirective.isComponent) {
            return;
        }
        var template = normalizedDirective.template;
        this._resourceLoaderCache.delete(template.templateUrl);
        template.externalStylesheets.forEach(function (stylesheet) { _this._resourceLoaderCache.delete(stylesheet.moduleUrl); });
    };
    DirectiveNormalizer.prototype._fetch = function (url) {
        var result = this._resourceLoaderCache.get(url);
        if (!result) {
            result = this._resourceLoader.get(url);
            this._resourceLoaderCache.set(url, result);
        }
        return result;
    };
    DirectiveNormalizer.prototype.normalizeTemplate = function (prenormData) {
        var _this = this;
        if (isDefined(prenormData.template)) {
            if (isDefined(prenormData.templateUrl)) {
                throw syntaxError("'" + stringify(prenormData.componentType) + "' component cannot define both template and templateUrl");
            }
            if (typeof prenormData.template !== 'string') {
                throw syntaxError("The template specified for component " + stringify(prenormData.componentType) + " is not a string");
            }
        }
        else if (isDefined(prenormData.templateUrl)) {
            if (typeof prenormData.templateUrl !== 'string') {
                throw syntaxError("The templateUrl specified for component " + stringify(prenormData.componentType) + " is not a string");
            }
        }
        else {
            throw syntaxError("No template specified for component " + stringify(prenormData.componentType));
        }
        if (isDefined(prenormData.preserveWhitespaces) &&
            typeof prenormData.preserveWhitespaces !== 'boolean') {
            throw syntaxError("The preserveWhitespaces option for component " + stringify(prenormData.componentType) + " must be a boolean");
        }
        return SyncAsync.then(this._preParseTemplate(prenormData), function (preparsedTemplate) { return _this._normalizeTemplateMetadata(prenormData, preparsedTemplate); });
    };
    DirectiveNormalizer.prototype._preParseTemplate = function (prenomData) {
        var _this = this;
        var template;
        var templateUrl;
        if (prenomData.template != null) {
            template = prenomData.template;
            templateUrl = prenomData.moduleUrl;
        }
        else {
            templateUrl = this._urlResolver.resolve(prenomData.moduleUrl, prenomData.templateUrl);
            template = this._fetch(templateUrl);
        }
        return SyncAsync.then(template, function (template) { return _this._preparseLoadedTemplate(prenomData, template, templateUrl); });
    };
    DirectiveNormalizer.prototype._preparseLoadedTemplate = function (prenormData, template, templateAbsUrl) {
        var isInline = !!prenormData.template;
        var interpolationConfig = InterpolationConfig.fromArray(prenormData.interpolation);
        var rootNodesAndErrors = this._htmlParser.parse(template, templateSourceUrl({ reference: prenormData.ngModuleType }, { type: { reference: prenormData.componentType } }, { isInline: isInline, templateUrl: templateAbsUrl }), true, interpolationConfig);
        if (rootNodesAndErrors.errors.length > 0) {
            var errorString = rootNodesAndErrors.errors.join('\n');
            throw syntaxError("Template parse errors:\n" + errorString);
        }
        var templateMetadataStyles = this._normalizeStylesheet(new CompileStylesheetMetadata({ styles: prenormData.styles, moduleUrl: prenormData.moduleUrl }));
        var visitor = new TemplatePreparseVisitor();
        html.visitAll(visitor, rootNodesAndErrors.rootNodes);
        var templateStyles = this._normalizeStylesheet(new CompileStylesheetMetadata({ styles: visitor.styles, styleUrls: visitor.styleUrls, moduleUrl: templateAbsUrl }));
        var styles = templateMetadataStyles.styles.concat(templateStyles.styles);
        var inlineStyleUrls = templateMetadataStyles.styleUrls.concat(templateStyles.styleUrls);
        var styleUrls = this
            ._normalizeStylesheet(new CompileStylesheetMetadata({ styleUrls: prenormData.styleUrls, moduleUrl: prenormData.moduleUrl }))
            .styleUrls;
        return {
            template: template,
            templateUrl: templateAbsUrl, isInline: isInline,
            htmlAst: rootNodesAndErrors, styles: styles, inlineStyleUrls: inlineStyleUrls, styleUrls: styleUrls,
            ngContentSelectors: visitor.ngContentSelectors,
        };
    };
    DirectiveNormalizer.prototype._normalizeTemplateMetadata = function (prenormData, preparsedTemplate) {
        var _this = this;
        return SyncAsync.then(this._loadMissingExternalStylesheets(preparsedTemplate.styleUrls.concat(preparsedTemplate.inlineStyleUrls)), function (externalStylesheets) { return _this._normalizeLoadedTemplateMetadata(prenormData, preparsedTemplate, externalStylesheets); });
    };
    DirectiveNormalizer.prototype._normalizeLoadedTemplateMetadata = function (prenormData, preparsedTemplate, stylesheets) {
        // Algorithm:
        // - produce exactly 1 entry per original styleUrl in
        // CompileTemplateMetadata.externalStylesheets with all styles inlined
        // - inline all styles that are referenced by the template into CompileTemplateMetadata.styles.
        // Reason: be able to determine how many stylesheets there are even without loading
        // the template nor the stylesheets, so we can create a stub for TypeScript always synchronously
        // (as resource loading may be async)
        var _this = this;
        var styles = tslib_1.__spread(preparsedTemplate.styles);
        this._inlineStyles(preparsedTemplate.inlineStyleUrls, stylesheets, styles);
        var styleUrls = preparsedTemplate.styleUrls;
        var externalStylesheets = styleUrls.map(function (styleUrl) {
            var stylesheet = stylesheets.get(styleUrl);
            var styles = tslib_1.__spread(stylesheet.styles);
            _this._inlineStyles(stylesheet.styleUrls, stylesheets, styles);
            return new CompileStylesheetMetadata({ moduleUrl: styleUrl, styles: styles });
        });
        var encapsulation = prenormData.encapsulation;
        if (encapsulation == null) {
            encapsulation = this._config.defaultEncapsulation;
        }
        if (encapsulation === ViewEncapsulation.Emulated && styles.length === 0 &&
            styleUrls.length === 0) {
            encapsulation = ViewEncapsulation.None;
        }
        return new CompileTemplateMetadata({
            encapsulation: encapsulation,
            template: preparsedTemplate.template,
            templateUrl: preparsedTemplate.templateUrl,
            htmlAst: preparsedTemplate.htmlAst, styles: styles, styleUrls: styleUrls,
            ngContentSelectors: preparsedTemplate.ngContentSelectors,
            animations: prenormData.animations,
            interpolation: prenormData.interpolation,
            isInline: preparsedTemplate.isInline, externalStylesheets: externalStylesheets,
            preserveWhitespaces: preserveWhitespacesDefault(prenormData.preserveWhitespaces, this._config.preserveWhitespaces),
        });
    };
    DirectiveNormalizer.prototype._inlineStyles = function (styleUrls, stylesheets, targetStyles) {
        var _this = this;
        styleUrls.forEach(function (styleUrl) {
            var stylesheet = stylesheets.get(styleUrl);
            stylesheet.styles.forEach(function (style) { return targetStyles.push(style); });
            _this._inlineStyles(stylesheet.styleUrls, stylesheets, targetStyles);
        });
    };
    DirectiveNormalizer.prototype._loadMissingExternalStylesheets = function (styleUrls, loadedStylesheets) {
        var _this = this;
        if (loadedStylesheets === void 0) { loadedStylesheets = new Map(); }
        return SyncAsync.then(SyncAsync.all(styleUrls.filter(function (styleUrl) { return !loadedStylesheets.has(styleUrl); })
            .map(function (styleUrl) { return SyncAsync.then(_this._fetch(styleUrl), function (loadedStyle) {
            var stylesheet = _this._normalizeStylesheet(new CompileStylesheetMetadata({ styles: [loadedStyle], moduleUrl: styleUrl }));
            loadedStylesheets.set(styleUrl, stylesheet);
            return _this._loadMissingExternalStylesheets(stylesheet.styleUrls, loadedStylesheets);
        }); })), function (_) { return loadedStylesheets; });
    };
    DirectiveNormalizer.prototype._normalizeStylesheet = function (stylesheet) {
        var _this = this;
        var moduleUrl = stylesheet.moduleUrl;
        var allStyleUrls = stylesheet.styleUrls.filter(isStyleUrlResolvable)
            .map(function (url) { return _this._urlResolver.resolve(moduleUrl, url); });
        var allStyles = stylesheet.styles.map(function (style) {
            var styleWithImports = extractStyleUrls(_this._urlResolver, moduleUrl, style);
            allStyleUrls.push.apply(allStyleUrls, tslib_1.__spread(styleWithImports.styleUrls));
            return styleWithImports.style;
        });
        return new CompileStylesheetMetadata({ styles: allStyles, styleUrls: allStyleUrls, moduleUrl: moduleUrl });
    };
    return DirectiveNormalizer;
}());
export { DirectiveNormalizer };
var TemplatePreparseVisitor = /** @class */ (function () {
    function TemplatePreparseVisitor() {
        this.ngContentSelectors = [];
        this.styles = [];
        this.styleUrls = [];
        this.ngNonBindableStackCount = 0;
    }
    TemplatePreparseVisitor.prototype.visitElement = function (ast, context) {
        var preparsedElement = preparseElement(ast);
        switch (preparsedElement.type) {
            case PreparsedElementType.NG_CONTENT:
                if (this.ngNonBindableStackCount === 0) {
                    this.ngContentSelectors.push(preparsedElement.selectAttr);
                }
                break;
            case PreparsedElementType.STYLE:
                var textContent_1 = '';
                ast.children.forEach(function (child) {
                    if (child instanceof html.Text) {
                        textContent_1 += child.value;
                    }
                });
                this.styles.push(textContent_1);
                break;
            case PreparsedElementType.STYLESHEET:
                this.styleUrls.push(preparsedElement.hrefAttr);
                break;
            default:
                break;
        }
        if (preparsedElement.nonBindable) {
            this.ngNonBindableStackCount++;
        }
        html.visitAll(this, ast.children);
        if (preparsedElement.nonBindable) {
            this.ngNonBindableStackCount--;
        }
        return null;
    };
    TemplatePreparseVisitor.prototype.visitExpansion = function (ast, context) { html.visitAll(this, ast.cases); };
    TemplatePreparseVisitor.prototype.visitExpansionCase = function (ast, context) {
        html.visitAll(this, ast.expression);
    };
    TemplatePreparseVisitor.prototype.visitComment = function (ast, context) { return null; };
    TemplatePreparseVisitor.prototype.visitAttribute = function (ast, context) { return null; };
    TemplatePreparseVisitor.prototype.visitText = function (ast, context) { return null; };
    return TemplatePreparseVisitor;
}());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlyZWN0aXZlX25vcm1hbGl6ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci9zcmMvZGlyZWN0aXZlX25vcm1hbGl6ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQUVILE9BQU8sRUFBMkIseUJBQXlCLEVBQUUsdUJBQXVCLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUNuSSxPQUFPLEVBQWlCLDBCQUEwQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3BFLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUN6QyxPQUFPLEtBQUssSUFBSSxNQUFNLGlCQUFpQixDQUFDO0FBRXhDLE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLGtDQUFrQyxDQUFDO0FBR3JFLE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxvQkFBb0IsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQzVFLE9BQU8sRUFBQyxvQkFBb0IsRUFBRSxlQUFlLEVBQUMsTUFBTSxzQ0FBc0MsQ0FBQztBQUUzRixPQUFPLEVBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBZ0JwRTtJQUdFLDZCQUNZLGVBQStCLEVBQVUsWUFBeUIsRUFDbEUsV0FBdUIsRUFBVSxPQUF1QjtRQUR4RCxvQkFBZSxHQUFmLGVBQWUsQ0FBZ0I7UUFBVSxpQkFBWSxHQUFaLFlBQVksQ0FBYTtRQUNsRSxnQkFBVyxHQUFYLFdBQVcsQ0FBWTtRQUFVLFlBQU8sR0FBUCxPQUFPLENBQWdCO1FBSjVELHlCQUFvQixHQUFHLElBQUksR0FBRyxFQUE2QixDQUFDO0lBSUcsQ0FBQztJQUV4RSx3Q0FBVSxHQUFWLGNBQXFCLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFFekQs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SUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFFRCw4Q0FBWSxHQUFaLFVBQWEsR0FBaUIsRUFBRSxPQUFZLElBQVMsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ25FLGdEQUFjLEdBQWQsVUFBZSxHQUFtQixFQUFFLE9BQVksSUFBUyxPQUFPLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDdkUsMkNBQVMsR0FBVCxVQUFVLEdBQWMsRUFBRSxPQUFZLElBQVMsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQy9ELDhCQUFDO0FBQUQsQ0FBQyxBQWhERCxJQWdEQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDb21waWxlRGlyZWN0aXZlTWV0YWRhdGEsIENvbXBpbGVTdHlsZXNoZWV0TWV0YWRhdGEsIENvbXBpbGVUZW1wbGF0ZU1ldGFkYXRhLCB0ZW1wbGF0ZVNvdXJjZVVybH0gZnJvbSAnLi9jb21waWxlX21ldGFkYXRhJztcbmltcG9ydCB7Q29tcGlsZXJDb25maWcsIHByZXNlcnZlV2hpdGVzcGFjZXNEZWZhdWx0fSBmcm9tICcuL2NvbmZpZyc7XG5pbXBvcnQge1ZpZXdFbmNhcHN1bGF0aW9ufSBmcm9tICcuL2NvcmUnO1xuaW1wb3J0ICogYXMgaHRtbCBmcm9tICcuL21sX3BhcnNlci9hc3QnO1xuaW1wb3J0IHtIdG1sUGFyc2VyfSBmcm9tICcuL21sX3BhcnNlci9odG1sX3BhcnNlcic7XG5pbXBvcnQge0ludGVycG9sYXRpb25Db25maWd9IGZyb20gJy4vbWxfcGFyc2VyL2ludGVycG9sYXRpb25fY29uZmlnJztcbmltcG9ydCB7UGFyc2VUcmVlUmVzdWx0IGFzIEh0bWxQYXJzZVRyZWVSZXN1bHR9IGZyb20gJy4vbWxfcGFyc2VyL3BhcnNlcic7XG5pbXBvcnQge1Jlc291cmNlTG9hZGVyfSBmcm9tICcuL3Jlc291cmNlX2xvYWRlcic7XG5pbXBvcnQge2V4dHJhY3RTdHlsZVVybHMsIGlzU3R5bGVVcmxSZXNvbHZhYmxlfSBmcm9tICcuL3N0eWxlX3VybF9yZXNvbHZlcic7XG5pbXBvcnQge1ByZXBhcnNlZEVsZW1lbnRUeXBlLCBwcmVwYXJzZUVsZW1lbnR9IGZyb20gJy4vdGVtcGxhdGVfcGFyc2VyL3RlbXBsYXRlX3ByZXBhcnNlcic7XG5pbXBvcnQge1VybFJlc29sdmVyfSBmcm9tICcuL3VybF9yZXNvbHZlcic7XG5pbXBvcnQge1N5bmNBc3luYywgaXNEZWZpbmVkLCBzdHJpbmdpZnksIHN5bnRheEVycm9yfSBmcm9tICcuL3V0aWwnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFByZW5vcm1hbGl6ZWRUZW1wbGF0ZU1ldGFkYXRhIHtcbiAgbmdNb2R1bGVUeXBlOiBhbnk7XG4gIGNvbXBvbmVudFR5cGU6IGFueTtcbiAgbW9kdWxlVXJsOiBzdHJpbmc7XG4gIHRlbXBsYXRlOiBzdHJpbmd8bnVsbDtcbiAgdGVtcGxhdGVVcmw6IHN0cmluZ3xudWxsO1xuICBzdHlsZXM6IHN0cmluZ1tdO1xuICBzdHlsZVVybHM6IHN0cmluZ1tdO1xuICBpbnRlcnBvbGF0aW9uOiBbc3RyaW5nLCBzdHJpbmddfG51bGw7XG4gIGVuY2Fwc3VsYXRpb246IFZpZXdFbmNhcHN1bGF0aW9ufG51bGw7XG4gIGFuaW1hdGlvbnM6IGFueVtdO1xuICBwcmVzZXJ2ZVdoaXRlc3BhY2VzOiBib29sZWFufG51bGw7XG59XG5cbmV4cG9ydCBjbGFzcyBEaXJlY3RpdmVOb3JtYWxpemVyIHtcbiAgcHJpdmF0ZSBfcmVzb3VyY2VMb2FkZXJDYWNoZSA9IG5ldyBNYXA8c3RyaW5nLCBTeW5jQXN5bmM8c3RyaW5nPj4oKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgX3Jlc291cmNlTG9hZGVyOiBSZXNvdXJjZUxvYWRlciwgcHJpdmF0ZSBfdXJsUmVzb2x2ZXI6IFVybFJlc29sdmVyLFxuICAgICAgcHJpdmF0ZSBfaHRtbFBhcnNlcjogSHRtbFBhcnNlciwgcHJpdmF0ZSBfY29uZmlnOiBDb21waWxlckNvbmZpZykge31cblxuICBjbGVhckNhY2hlKCk6IHZvaWQgeyB0aGlzLl9yZXNvdXJjZUxvYWRlckNhY2hlLmNsZWFyKCk7IH1cblxuICBjbGVhckNhY2hlRm9yKG5vcm1hbGl6ZWREaXJlY3RpdmU6IENvbXBpbGVEaXJlY3RpdmVNZXRhZGF0YSk6IHZvaWQge1xuICAgIGlmICghbm9ybWFsaXplZERpcmVjdGl2ZS5pc0NvbXBvbmVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCB0ZW1wbGF0ZSA9IG5vcm1hbGl6ZWREaXJlY3RpdmUudGVtcGxhdGUgITtcbiAgICB0aGlzLl9yZXNvdXJjZUxvYWRlckNhY2hlLmRlbGV0ZSh0ZW1wbGF0ZS50ZW1wbGF0ZVVybCAhKTtcbiAgICB0ZW1wbGF0ZS5leHRlcm5hbFN0eWxlc2hlZXRzLmZvckVhY2goXG4gICAgICAgIChzdHlsZXNoZWV0KSA9PiB7IHRoaXMuX3Jlc291cmNlTG9hZGVyQ2FjaGUuZGVsZXRlKHN0eWxlc2hlZXQubW9kdWxlVXJsICEpOyB9KTtcbiAgfVxuXG4gIHByaXZhdGUgX2ZldGNoKHVybDogc3RyaW5nKTogU3luY0FzeW5jPHN0cmluZz4ge1xuICAgIGxldCByZXN1bHQgPSB0aGlzLl9yZXNvdXJjZUxvYWRlckNhY2hlLmdldCh1cmwpO1xuICAgIGlmICghcmVzdWx0KSB7XG4gICAgICByZXN1bHQgPSB0aGlzLl9yZXNvdXJjZUxvYWRlci5nZXQodXJsKTtcbiAgICAgIHRoaXMuX3Jlc291cmNlTG9hZGVyQ2FjaGUuc2V0KHVybCwgcmVzdWx0KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIG5vcm1hbGl6ZVRlbXBsYXRlKHByZW5vcm1EYXRhOiBQcmVub3JtYWxpemVkVGVtcGxhdGVNZXRhZGF0YSk6XG4gICAgICBTeW5jQXN5bmM8Q29tcGlsZVRlbXBsYXRlTWV0YWRhdGE+IHtcbiAgICBpZiAoaXNEZWZpbmVkKHByZW5vcm1EYXRhLnRlbXBsYXRlKSkge1xuICAgICAgaWYgKGlzRGVmaW5lZChwcmVub3JtRGF0YS50ZW1wbGF0ZVVybCkpIHtcbiAgICAgICAgdGhyb3cgc3ludGF4RXJyb3IoXG4gICAgICAgICAgICBgJyR7c3RyaW5naWZ5KHByZW5vcm1EYXRhLmNvbXBvbmVudFR5cGUpfScgY29tcG9uZW50IGNhbm5vdCBkZWZpbmUgYm90aCB0ZW1wbGF0ZSBhbmQgdGVtcGxhdGVVcmxgKTtcbiAgICAgIH1cbiAgICAgIGlmICh0eXBlb2YgcHJlbm9ybURhdGEudGVtcGxhdGUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRocm93IHN5bnRheEVycm9yKFxuICAgICAgICAgICAgYFRoZSB0ZW1wbGF0ZSBzcGVjaWZpZWQgZm9yIGNvbXBvbmVudCAke3N0cmluZ2lmeShwcmVub3JtRGF0YS5jb21wb25lbnRUeXBlKX0gaXMgbm90IGEgc3RyaW5nYCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChpc0RlZmluZWQocHJlbm9ybURhdGEudGVtcGxhdGVVcmwpKSB7XG4gICAgICBpZiAodHlwZW9mIHByZW5vcm1EYXRhLnRlbXBsYXRlVXJsICE9PSAnc3RyaW5nJykge1xuICAgICAgICB0aHJvdyBzeW50YXhFcnJvcihcbiAgICAgICAgICAgIGBUaGUgdGVtcGxhdGVVcmwgc3BlY2lmaWVkIGZvciBjb21wb25lbnQgJHtzdHJpbmdpZnkocHJlbm9ybURhdGEuY29tcG9uZW50VHlwZSl9IGlzIG5vdCBhIHN0cmluZ2ApO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBzeW50YXhFcnJvcihcbiAgICAgICAgICBgTm8gdGVtcGxhdGUgc3BlY2lmaWVkIGZvciBjb21wb25lbnQgJHtzdHJpbmdpZnkocHJlbm9ybURhdGEuY29tcG9uZW50VHlwZSl9YCk7XG4gICAgfVxuXG4gICAgaWYgKGlzRGVmaW5lZChwcmVub3JtRGF0YS5wcmVzZXJ2ZVdoaXRlc3BhY2VzKSAmJlxuICAgICAgICB0eXBlb2YgcHJlbm9ybURhdGEucHJlc2VydmVXaGl0ZXNwYWNlcyAhPT0gJ2Jvb2xlYW4nKSB7XG4gICAgICB0aHJvdyBzeW50YXhFcnJvcihcbiAgICAgICAgICBgVGhlIHByZXNlcnZlV2hpdGVzcGFjZXMgb3B0aW9uIGZvciBjb21wb25lbnQgJHtzdHJpbmdpZnkocHJlbm9ybURhdGEuY29tcG9uZW50VHlwZSl9IG11c3QgYmUgYSBib29sZWFuYCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFN5bmNBc3luYy50aGVuKFxuICAgICAgICB0aGlzLl9wcmVQYXJzZVRlbXBsYXRlKHByZW5vcm1EYXRhKSxcbiAgICAgICAgKHByZXBhcnNlZFRlbXBsYXRlKSA9PiB0aGlzLl9ub3JtYWxpemVUZW1wbGF0ZU1ldGFkYXRhKHByZW5vcm1EYXRhLCBwcmVwYXJzZWRUZW1wbGF0ZSkpO1xuICB9XG5cbiAgcHJpdmF0ZSBfcHJlUGFyc2VUZW1wbGF0ZShwcmVub21EYXRhOiBQcmVub3JtYWxpemVkVGVtcGxhdGVNZXRhZGF0YSk6XG4gICAgICBTeW5jQXN5bmM8UHJlcGFyc2VkVGVtcGxhdGU+IHtcbiAgICBsZXQgdGVtcGxhdGU6IFN5bmNBc3luYzxzdHJpbmc+O1xuICAgIGxldCB0ZW1wbGF0ZVVybDogc3RyaW5nO1xuICAgIGlmIChwcmVub21EYXRhLnRlbXBsYXRlICE9IG51bGwpIHtcbiAgICAgIHRlbXBsYXRlID0gcHJlbm9tRGF0YS50ZW1wbGF0ZTtcbiAgICAgIHRlbXBsYXRlVXJsID0gcHJlbm9tRGF0YS5tb2R1bGVVcmw7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRlbXBsYXRlVXJsID0gdGhpcy5fdXJsUmVzb2x2ZXIucmVzb2x2ZShwcmVub21EYXRhLm1vZHVsZVVybCwgcHJlbm9tRGF0YS50ZW1wbGF0ZVVybCAhKTtcbiAgICAgIHRlbXBsYXRlID0gdGhpcy5fZmV0Y2godGVtcGxhdGVVcmwpO1xuICAgIH1cbiAgICByZXR1cm4gU3luY0FzeW5jLnRoZW4oXG4gICAgICAgIHRlbXBsYXRlLCAodGVtcGxhdGUpID0+IHRoaXMuX3ByZXBhcnNlTG9hZGVkVGVtcGxhdGUocHJlbm9tRGF0YSwgdGVtcGxhdGUsIHRlbXBsYXRlVXJsKSk7XG4gIH1cblxuICBwcml2YXRlIF9wcmVwYXJzZUxvYWRlZFRlbXBsYXRlKFxuICAgICAgcHJlbm9ybURhdGE6IFByZW5vcm1hbGl6ZWRUZW1wbGF0ZU1ldGFkYXRhLCB0ZW1wbGF0ZTogc3RyaW5nLFxuICAgICAgdGVtcGxhdGVBYnNVcmw6IHN0cmluZyk6IFByZXBhcnNlZFRlbXBsYXRlIHtcbiAgICBjb25zdCBpc0lubGluZSA9ICEhcHJlbm9ybURhdGEudGVtcGxhdGU7XG4gICAgY29uc3QgaW50ZXJwb2xhdGlvbkNvbmZpZyA9IEludGVycG9sYXRpb25Db25maWcuZnJvbUFycmF5KHByZW5vcm1EYXRhLmludGVycG9sYXRpb24gISk7XG4gICAgY29uc3Qgcm9vdE5vZGVzQW5kRXJyb3JzID0gdGhpcy5faHRtbFBhcnNlci5wYXJzZShcbiAgICAgICAgdGVtcGxhdGUsXG4gICAgICAgIHRlbXBsYXRlU291cmNlVXJsKFxuICAgICAgICAgICAge3JlZmVyZW5jZTogcHJlbm9ybURhdGEubmdNb2R1bGVUeXBlfSwge3R5cGU6IHtyZWZlcmVuY2U6IHByZW5vcm1EYXRhLmNvbXBvbmVudFR5cGV9fSxcbiAgICAgICAgICAgIHtpc0lubGluZSwgdGVtcGxhdGVVcmw6IHRlbXBsYXRlQWJzVXJsfSksXG4gICAgICAgIHRydWUsIGludGVycG9sYXRpb25Db25maWcpO1xuICAgIGlmIChyb290Tm9kZXNBbmRFcnJvcnMuZXJyb3JzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IGVycm9yU3RyaW5nID0gcm9vdE5vZGVzQW5kRXJyb3JzLmVycm9ycy5qb2luKCdcXG4nKTtcbiAgICAgIHRocm93IHN5bnRheEVycm9yKGBUZW1wbGF0ZSBwYXJzZSBlcnJvcnM6XFxuJHtlcnJvclN0cmluZ31gKTtcbiAgICB9XG5cbiAgICBjb25zdCB0ZW1wbGF0ZU1ldGFkYXRhU3R5bGVzID0gdGhpcy5fbm9ybWFsaXplU3R5bGVzaGVldChuZXcgQ29tcGlsZVN0eWxlc2hlZXRNZXRhZGF0YShcbiAgICAgICAge3N0eWxlczogcHJlbm9ybURhdGEuc3R5bGVzLCBtb2R1bGVVcmw6IHByZW5vcm1EYXRhLm1vZHVsZVVybH0pKTtcblxuICAgIGNvbnN0IHZpc2l0b3IgPSBuZXcgVGVtcGxhdGVQcmVwYXJzZVZpc2l0b3IoKTtcbiAgICBodG1sLnZpc2l0QWxsKHZpc2l0b3IsIHJvb3ROb2Rlc0FuZEVycm9ycy5yb290Tm9kZXMpO1xuICAgIGNvbnN0IHRlbXBsYXRlU3R5bGVzID0gdGhpcy5fbm9ybWFsaXplU3R5bGVzaGVldChuZXcgQ29tcGlsZVN0eWxlc2hlZXRNZXRhZGF0YShcbiAgICAgICAge3N0eWxlczogdmlzaXRvci5zdHlsZXMsIHN0eWxlVXJsczogdmlzaXRvci5zdHlsZVVybHMsIG1vZHVsZVVybDogdGVtcGxhdGVBYnNVcmx9KSk7XG5cbiAgICBjb25zdCBzdHlsZXMgPSB0ZW1wbGF0ZU1ldGFkYXRhU3R5bGVzLnN0eWxlcy5jb25jYXQodGVtcGxhdGVTdHlsZXMuc3R5bGVzKTtcblxuICAgIGNvbnN0IGlubGluZVN0eWxlVXJscyA9IHRlbXBsYXRlTWV0YWRhdGFTdHlsZXMuc3R5bGVVcmxzLmNvbmNhdCh0ZW1wbGF0ZVN0eWxlcy5zdHlsZVVybHMpO1xuICAgIGNvbnN0IHN0eWxlVXJscyA9IHRoaXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLl9ub3JtYWxpemVTdHlsZXNoZWV0KG5ldyBDb21waWxlU3R5bGVzaGVldE1ldGFkYXRhKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3N0eWxlVXJsczogcHJlbm9ybURhdGEuc3R5bGVVcmxzLCBtb2R1bGVVcmw6IHByZW5vcm1EYXRhLm1vZHVsZVVybH0pKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAuc3R5bGVVcmxzO1xuICAgIHJldHVybiB7XG4gICAgICB0ZW1wbGF0ZSxcbiAgICAgIHRlbXBsYXRlVXJsOiB0ZW1wbGF0ZUFic1VybCwgaXNJbmxpbmUsXG4gICAgICBodG1sQXN0OiByb290Tm9kZXNBbmRFcnJvcnMsIHN0eWxlcywgaW5saW5lU3R5bGVVcmxzLCBzdHlsZVVybHMsXG4gICAgICBuZ0NvbnRlbnRTZWxlY3RvcnM6IHZpc2l0b3IubmdDb250ZW50U2VsZWN0b3JzLFxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIF9ub3JtYWxpemVUZW1wbGF0ZU1ldGFkYXRhKFxuICAgICAgcHJlbm9ybURhdGE6IFByZW5vcm1hbGl6ZWRUZW1wbGF0ZU1ldGFkYXRhLFxuICAgICAgcHJlcGFyc2VkVGVtcGxhdGU6IFByZXBhcnNlZFRlbXBsYXRlKTogU3luY0FzeW5jPENvbXBpbGVUZW1wbGF0ZU1ldGFkYXRhPiB7XG4gICAgcmV0dXJuIFN5bmNBc3luYy50aGVuKFxuICAgICAgICB0aGlzLl9sb2FkTWlzc2luZ0V4dGVybmFsU3R5bGVzaGVldHMoXG4gICAgICAgICAgICBwcmVwYXJzZWRUZW1wbGF0ZS5zdHlsZVVybHMuY29uY2F0KHByZXBhcnNlZFRlbXBsYXRlLmlubGluZVN0eWxlVXJscykpLFxuICAgICAgICAoZXh0ZXJuYWxTdHlsZXNoZWV0cykgPT4gdGhpcy5fbm9ybWFsaXplTG9hZGVkVGVtcGxhdGVNZXRhZGF0YShcbiAgICAgICAgICAgIHByZW5vcm1EYXRhLCBwcmVwYXJzZWRUZW1wbGF0ZSwgZXh0ZXJuYWxTdHlsZXNoZWV0cykpO1xuICB9XG5cbiAgcHJpdmF0ZSBfbm9ybWFsaXplTG9hZGVkVGVtcGxhdGVNZXRhZGF0YShcbiAgICAgIHByZW5vcm1EYXRhOiBQcmVub3JtYWxpemVkVGVtcGxhdGVNZXRhZGF0YSwgcHJlcGFyc2VkVGVtcGxhdGU6IFByZXBhcnNlZFRlbXBsYXRlLFxuICAgICAgc3R5bGVzaGVldHM6IE1hcDxzdHJpbmcsIENvbXBpbGVTdHlsZXNoZWV0TWV0YWRhdGE+KTogQ29tcGlsZVRlbXBsYXRlTWV0YWRhdGEge1xuICAgIC8vIEFsZ29yaXRobTpcbiAgICAvLyAtIHByb2R1Y2UgZXhhY3RseSAxIGVudHJ5IHBlciBvcmlnaW5hbCBzdHlsZVVybCBpblxuICAgIC8vIENvbXBpbGVUZW1wbGF0ZU1ldGFkYXRhLmV4dGVybmFsU3R5bGVzaGVldHMgd2l0aCBhbGwgc3R5bGVzIGlubGluZWRcbiAgICAvLyAtIGlubGluZSBhbGwgc3R5bGVzIHRoYXQgYXJlIHJlZmVyZW5jZWQgYnkgdGhlIHRlbXBsYXRlIGludG8gQ29tcGlsZVRlbXBsYXRlTWV0YWRhdGEuc3R5bGVzLlxuICAgIC8vIFJlYXNvbjogYmUgYWJsZSB0byBkZXRlcm1pbmUgaG93IG1hbnkgc3R5bGVzaGVldHMgdGhlcmUgYXJlIGV2ZW4gd2l0aG91dCBsb2FkaW5nXG4gICAgLy8gdGhlIHRlbXBsYXRlIG5vciB0aGUgc3R5bGVzaGVldHMsIHNvIHdlIGNhbiBjcmVhdGUgYSBzdHViIGZvciBUeXBlU2NyaXB0IGFsd2F5cyBzeW5jaHJvbm91c2x5XG4gICAgLy8gKGFzIHJlc291cmNlIGxvYWRpbmcgbWF5IGJlIGFzeW5jKVxuXG4gICAgY29uc3Qgc3R5bGVzID0gWy4uLnByZXBhcnNlZFRlbXBsYXRlLnN0eWxlc107XG4gICAgdGhpcy5faW5saW5lU3R5bGVzKHByZXBhcnNlZFRlbXBsYXRlLmlubGluZVN0eWxlVXJscywgc3R5bGVzaGVldHMsIHN0eWxlcyk7XG4gICAgY29uc3Qgc3R5bGVVcmxzID0gcHJlcGFyc2VkVGVtcGxhdGUuc3R5bGVVcmxzO1xuXG4gICAgY29uc3QgZXh0ZXJuYWxTdHlsZXNoZWV0cyA9IHN0eWxlVXJscy5tYXAoc3R5bGVVcmwgPT4ge1xuICAgICAgY29uc3Qgc3R5bGVzaGVldCA9IHN0eWxlc2hlZXRzLmdldChzdHlsZVVybCkgITtcbiAgICAgIGNvbnN0IHN0eWxlcyA9IFsuLi5zdHlsZXNoZWV0LnN0eWxlc107XG4gICAgICB0aGlzLl9pbmxpbmVTdHlsZXMoc3R5bGVzaGVldC5zdHlsZVVybHMsIHN0eWxlc2hlZXRzLCBzdHlsZXMpO1xuICAgICAgcmV0dXJuIG5ldyBDb21waWxlU3R5bGVzaGVldE1ldGFkYXRhKHttb2R1bGVVcmw6IHN0eWxlVXJsLCBzdHlsZXM6IHN0eWxlc30pO1xuICAgIH0pO1xuXG4gICAgbGV0IGVuY2Fwc3VsYXRpb24gPSBwcmVub3JtRGF0YS5lbmNhcHN1bGF0aW9uO1xuICAgIGlmIChlbmNhcHN1bGF0aW9uID09IG51bGwpIHtcbiAgICAgIGVuY2Fwc3VsYXRpb24gPSB0aGlzLl9jb25maWcuZGVmYXVsdEVuY2Fwc3VsYXRpb247XG4gICAgfVxuICAgIGlmIChlbmNhcHN1bGF0aW9uID09PSBWaWV3RW5jYXBzdWxhdGlvbi5FbXVsYXRlZCAmJiBzdHlsZXMubGVuZ3RoID09PSAwICYmXG4gICAgICAgIHN0eWxlVXJscy5sZW5ndGggPT09IDApIHtcbiAgICAgIGVuY2Fwc3VsYXRpb24gPSBWaWV3RW5jYXBzdWxhdGlvbi5Ob25lO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IENvbXBpbGVUZW1wbGF0ZU1ldGFkYXRhKHtcbiAgICAgIGVuY2Fwc3VsYXRpb24sXG4gICAgICB0ZW1wbGF0ZTogcHJlcGFyc2VkVGVtcGxhdGUudGVtcGxhdGUsXG4gICAgICB0ZW1wbGF0ZVVybDogcHJlcGFyc2VkVGVtcGxhdGUudGVtcGxhdGVVcmwsXG4gICAgICBodG1sQXN0OiBwcmVwYXJzZWRUZW1wbGF0ZS5odG1sQXN0LCBzdHlsZXMsIHN0eWxlVXJscyxcbiAgICAgIG5nQ29udGVudFNlbGVjdG9yczogcHJlcGFyc2VkVGVtcGxhdGUubmdDb250ZW50U2VsZWN0b3JzLFxuICAgICAgYW5pbWF0aW9uczogcHJlbm9ybURhdGEuYW5pbWF0aW9ucyxcbiAgICAgIGludGVycG9sYXRpb246IHByZW5vcm1EYXRhLmludGVycG9sYXRpb24sXG4gICAgICBpc0lubGluZTogcHJlcGFyc2VkVGVtcGxhdGUuaXNJbmxpbmUsIGV4dGVybmFsU3R5bGVzaGVldHMsXG4gICAgICBwcmVzZXJ2ZVdoaXRlc3BhY2VzOiBwcmVzZXJ2ZVdoaXRlc3BhY2VzRGVmYXVsdChcbiAgICAgICAgICBwcmVub3JtRGF0YS5wcmVzZXJ2ZVdoaXRlc3BhY2VzLCB0aGlzLl9jb25maWcucHJlc2VydmVXaGl0ZXNwYWNlcyksXG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIF9pbmxpbmVTdHlsZXMoXG4gICAgICBzdHlsZVVybHM6IHN0cmluZ1tdLCBzdHlsZXNoZWV0czogTWFwPHN0cmluZywgQ29tcGlsZVN0eWxlc2hlZXRNZXRhZGF0YT4sXG4gICAgICB0YXJnZXRTdHlsZXM6IHN0cmluZ1tdKSB7XG4gICAgc3R5bGVVcmxzLmZvckVhY2goc3R5bGVVcmwgPT4ge1xuICAgICAgY29uc3Qgc3R5bGVzaGVldCA9IHN0eWxlc2hlZXRzLmdldChzdHlsZVVybCkgITtcbiAgICAgIHN0eWxlc2hlZXQuc3R5bGVzLmZvckVhY2goc3R5bGUgPT4gdGFyZ2V0U3R5bGVzLnB1c2goc3R5bGUpKTtcbiAgICAgIHRoaXMuX2lubGluZVN0eWxlcyhzdHlsZXNoZWV0LnN0eWxlVXJscywgc3R5bGVzaGVldHMsIHRhcmdldFN0eWxlcyk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIF9sb2FkTWlzc2luZ0V4dGVybmFsU3R5bGVzaGVldHMoXG4gICAgICBzdHlsZVVybHM6IHN0cmluZ1tdLFxuICAgICAgbG9hZGVkU3R5bGVzaGVldHM6XG4gICAgICAgICAgTWFwPHN0cmluZywgQ29tcGlsZVN0eWxlc2hlZXRNZXRhZGF0YT4gPSBuZXcgTWFwPHN0cmluZywgQ29tcGlsZVN0eWxlc2hlZXRNZXRhZGF0YT4oKSk6XG4gICAgICBTeW5jQXN5bmM8TWFwPHN0cmluZywgQ29tcGlsZVN0eWxlc2hlZXRNZXRhZGF0YT4+IHtcbiAgICByZXR1cm4gU3luY0FzeW5jLnRoZW4oXG4gICAgICAgIFN5bmNBc3luYy5hbGwoc3R5bGVVcmxzLmZpbHRlcigoc3R5bGVVcmwpID0+ICFsb2FkZWRTdHlsZXNoZWV0cy5oYXMoc3R5bGVVcmwpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAubWFwKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGVVcmwgPT4gU3luY0FzeW5jLnRoZW4oXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZmV0Y2goc3R5bGVVcmwpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChsb2FkZWRTdHlsZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3R5bGVzaGVldCA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fbm9ybWFsaXplU3R5bGVzaGVldChuZXcgQ29tcGlsZVN0eWxlc2hlZXRNZXRhZGF0YShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3N0eWxlczogW2xvYWRlZFN0eWxlXSwgbW9kdWxlVXJsOiBzdHlsZVVybH0pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvYWRlZFN0eWxlc2hlZXRzLnNldChzdHlsZVVybCwgc3R5bGVzaGVldCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fbG9hZE1pc3NpbmdFeHRlcm5hbFN0eWxlc2hlZXRzKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlc2hlZXQuc3R5bGVVcmxzLCBsb2FkZWRTdHlsZXNoZWV0cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkpKSxcbiAgICAgICAgKF8pID0+IGxvYWRlZFN0eWxlc2hlZXRzKTtcbiAgfVxuXG4gIHByaXZhdGUgX25vcm1hbGl6ZVN0eWxlc2hlZXQoc3R5bGVzaGVldDogQ29tcGlsZVN0eWxlc2hlZXRNZXRhZGF0YSk6IENvbXBpbGVTdHlsZXNoZWV0TWV0YWRhdGEge1xuICAgIGNvbnN0IG1vZHVsZVVybCA9IHN0eWxlc2hlZXQubW9kdWxlVXJsICE7XG4gICAgY29uc3QgYWxsU3R5bGVVcmxzID0gc3R5bGVzaGVldC5zdHlsZVVybHMuZmlsdGVyKGlzU3R5bGVVcmxSZXNvbHZhYmxlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAubWFwKHVybCA9PiB0aGlzLl91cmxSZXNvbHZlci5yZXNvbHZlKG1vZHVsZVVybCwgdXJsKSk7XG5cbiAgICBjb25zdCBhbGxTdHlsZXMgPSBzdHlsZXNoZWV0LnN0eWxlcy5tYXAoc3R5bGUgPT4ge1xuICAgICAgY29uc3Qgc3R5bGVXaXRoSW1wb3J0cyA9IGV4dHJhY3RTdHlsZVVybHModGhpcy5fdXJsUmVzb2x2ZXIsIG1vZHVsZVVybCwgc3R5bGUpO1xuICAgICAgYWxsU3R5bGVVcmxzLnB1c2goLi4uc3R5bGVXaXRoSW1wb3J0cy5zdHlsZVVybHMpO1xuICAgICAgcmV0dXJuIHN0eWxlV2l0aEltcG9ydHMuc3R5bGU7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbmV3IENvbXBpbGVTdHlsZXNoZWV0TWV0YWRhdGEoXG4gICAgICAgIHtzdHlsZXM6IGFsbFN0eWxlcywgc3R5bGVVcmxzOiBhbGxTdHlsZVVybHMsIG1vZHVsZVVybDogbW9kdWxlVXJsfSk7XG4gIH1cbn1cblxuaW50ZXJmYWNlIFByZXBhcnNlZFRlbXBsYXRlIHtcbiAgdGVtcGxhdGU6IHN0cmluZztcbiAgdGVtcGxhdGVVcmw6IHN0cmluZztcbiAgaXNJbmxpbmU6IGJvb2xlYW47XG4gIGh0bWxBc3Q6IEh0bWxQYXJzZVRyZWVSZXN1bHQ7XG4gIHN0eWxlczogc3RyaW5nW107XG4gIGlubGluZVN0eWxlVXJsczogc3RyaW5nW107XG4gIHN0eWxlVXJsczogc3RyaW5nW107XG4gIG5nQ29udGVudFNlbGVjdG9yczogc3RyaW5nW107XG59XG5cbmNsYXNzIFRlbXBsYXRlUHJlcGFyc2VWaXNpdG9yIGltcGxlbWVudHMgaHRtbC5WaXNpdG9yIHtcbiAgbmdDb250ZW50U2VsZWN0b3JzOiBzdHJpbmdbXSA9IFtdO1xuICBzdHlsZXM6IHN0cmluZ1tdID0gW107XG4gIHN0eWxlVXJsczogc3RyaW5nW10gPSBbXTtcbiAgbmdOb25CaW5kYWJsZVN0YWNrQ291bnQ6IG51bWJlciA9IDA7XG5cbiAgdmlzaXRFbGVtZW50KGFzdDogaHRtbC5FbGVtZW50LCBjb250ZXh0OiBhbnkpOiBhbnkge1xuICAgIGNvbnN0IHByZXBhcnNlZEVsZW1lbnQgPSBwcmVwYXJzZUVsZW1lbnQoYXN0KTtcbiAgICBzd2l0Y2ggKHByZXBhcnNlZEVsZW1lbnQudHlwZSkge1xuICAgICAgY2FzZSBQcmVwYXJzZWRFbGVtZW50VHlwZS5OR19DT05URU5UOlxuICAgICAgICBpZiAodGhpcy5uZ05vbkJpbmRhYmxlU3RhY2tDb3VudCA9PT0gMCkge1xuICAgICAgICAgIHRoaXMubmdDb250ZW50U2VsZWN0b3JzLnB1c2gocHJlcGFyc2VkRWxlbWVudC5zZWxlY3RBdHRyKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgUHJlcGFyc2VkRWxlbWVudFR5cGUuU1RZTEU6XG4gICAgICAgIGxldCB0ZXh0Q29udGVudCA9ICcnO1xuICAgICAgICBhc3QuY2hpbGRyZW4uZm9yRWFjaChjaGlsZCA9PiB7XG4gICAgICAgICAgaWYgKGNoaWxkIGluc3RhbmNlb2YgaHRtbC5UZXh0KSB7XG4gICAgICAgICAgICB0ZXh0Q29udGVudCArPSBjaGlsZC52YWx1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnN0eWxlcy5wdXNoKHRleHRDb250ZW50KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFByZXBhcnNlZEVsZW1lbnRUeXBlLlNUWUxFU0hFRVQ6XG4gICAgICAgIHRoaXMuc3R5bGVVcmxzLnB1c2gocHJlcGFyc2VkRWxlbWVudC5ocmVmQXR0cik7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGlmIChwcmVwYXJzZWRFbGVtZW50Lm5vbkJpbmRhYmxlKSB7XG4gICAgICB0aGlzLm5nTm9uQmluZGFibGVTdGFja0NvdW50Kys7XG4gICAgfVxuICAgIGh0bWwudmlzaXRBbGwodGhpcywgYXN0LmNoaWxkcmVuKTtcbiAgICBpZiAocHJlcGFyc2VkRWxlbWVudC5ub25CaW5kYWJsZSkge1xuICAgICAgdGhpcy5uZ05vbkJpbmRhYmxlU3RhY2tDb3VudC0tO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHZpc2l0RXhwYW5zaW9uKGFzdDogaHRtbC5FeHBhbnNpb24sIGNvbnRleHQ6IGFueSk6IGFueSB7IGh0bWwudmlzaXRBbGwodGhpcywgYXN0LmNhc2VzKTsgfVxuXG4gIHZpc2l0RXhwYW5zaW9uQ2FzZShhc3Q6IGh0bWwuRXhwYW5zaW9uQ2FzZSwgY29udGV4dDogYW55KTogYW55IHtcbiAgICBodG1sLnZpc2l0QWxsKHRoaXMsIGFzdC5leHByZXNzaW9uKTtcbiAgfVxuXG4gIHZpc2l0Q29tbWVudChhc3Q6IGh0bWwuQ29tbWVudCwgY29udGV4dDogYW55KTogYW55IHsgcmV0dXJuIG51bGw7IH1cbiAgdmlzaXRBdHRyaWJ1dGUoYXN0OiBodG1sLkF0dHJpYnV0ZSwgY29udGV4dDogYW55KTogYW55IHsgcmV0dXJuIG51bGw7IH1cbiAgdmlzaXRUZXh0KGFzdDogaHRtbC5UZXh0LCBjb250ZXh0OiBhbnkpOiBhbnkgeyByZXR1cm4gbnVsbDsgfVxufVxuIl19
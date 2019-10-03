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
        define("@angular/compiler/src/directive_normalizer", ["require", "exports", "tslib", "@angular/compiler/src/compile_metadata", "@angular/compiler/src/config", "@angular/compiler/src/core", "@angular/compiler/src/ml_parser/ast", "@angular/compiler/src/ml_parser/interpolation_config", "@angular/compiler/src/style_url_resolver", "@angular/compiler/src/template_parser/template_preparser", "@angular/compiler/src/util"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var compile_metadata_1 = require("@angular/compiler/src/compile_metadata");
    var config_1 = require("@angular/compiler/src/config");
    var core_1 = require("@angular/compiler/src/core");
    var html = require("@angular/compiler/src/ml_parser/ast");
    var interpolation_config_1 = require("@angular/compiler/src/ml_parser/interpolation_config");
    var style_url_resolver_1 = require("@angular/compiler/src/style_url_resolver");
    var template_preparser_1 = require("@angular/compiler/src/template_parser/template_preparser");
    var util_1 = require("@angular/compiler/src/util");
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
            if (util_1.isDefined(prenormData.template)) {
                if (util_1.isDefined(prenormData.templateUrl)) {
                    throw util_1.syntaxError("'" + util_1.stringify(prenormData.componentType) + "' component cannot define both template and templateUrl");
                }
                if (typeof prenormData.template !== 'string') {
                    throw util_1.syntaxError("The template specified for component " + util_1.stringify(prenormData.componentType) + " is not a string");
                }
            }
            else if (util_1.isDefined(prenormData.templateUrl)) {
                if (typeof prenormData.templateUrl !== 'string') {
                    throw util_1.syntaxError("The templateUrl specified for component " + util_1.stringify(prenormData.componentType) + " is not a string");
                }
            }
            else {
                throw util_1.syntaxError("No template specified for component " + util_1.stringify(prenormData.componentType));
            }
            if (util_1.isDefined(prenormData.preserveWhitespaces) &&
                typeof prenormData.preserveWhitespaces !== 'boolean') {
                throw util_1.syntaxError("The preserveWhitespaces option for component " + util_1.stringify(prenormData.componentType) + " must be a boolean");
            }
            return util_1.SyncAsync.then(this._preParseTemplate(prenormData), function (preparsedTemplate) { return _this._normalizeTemplateMetadata(prenormData, preparsedTemplate); });
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
            return util_1.SyncAsync.then(template, function (template) { return _this._preparseLoadedTemplate(prenomData, template, templateUrl); });
        };
        DirectiveNormalizer.prototype._preparseLoadedTemplate = function (prenormData, template, templateAbsUrl) {
            var isInline = !!prenormData.template;
            var interpolationConfig = interpolation_config_1.InterpolationConfig.fromArray(prenormData.interpolation);
            var rootNodesAndErrors = this._htmlParser.parse(template, compile_metadata_1.templateSourceUrl({ reference: prenormData.ngModuleType }, { type: { reference: prenormData.componentType } }, { isInline: isInline, templateUrl: templateAbsUrl }), true, interpolationConfig);
            if (rootNodesAndErrors.errors.length > 0) {
                var errorString = rootNodesAndErrors.errors.join('\n');
                throw util_1.syntaxError("Template parse errors:\n" + errorString);
            }
            var templateMetadataStyles = this._normalizeStylesheet(new compile_metadata_1.CompileStylesheetMetadata({ styles: prenormData.styles, moduleUrl: prenormData.moduleUrl }));
            var visitor = new TemplatePreparseVisitor();
            html.visitAll(visitor, rootNodesAndErrors.rootNodes);
            var templateStyles = this._normalizeStylesheet(new compile_metadata_1.CompileStylesheetMetadata({ styles: visitor.styles, styleUrls: visitor.styleUrls, moduleUrl: templateAbsUrl }));
            var styles = templateMetadataStyles.styles.concat(templateStyles.styles);
            var inlineStyleUrls = templateMetadataStyles.styleUrls.concat(templateStyles.styleUrls);
            var styleUrls = this
                ._normalizeStylesheet(new compile_metadata_1.CompileStylesheetMetadata({ styleUrls: prenormData.styleUrls, moduleUrl: prenormData.moduleUrl }))
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
            return util_1.SyncAsync.then(this._loadMissingExternalStylesheets(preparsedTemplate.styleUrls.concat(preparsedTemplate.inlineStyleUrls)), function (externalStylesheets) { return _this._normalizeLoadedTemplateMetadata(prenormData, preparsedTemplate, externalStylesheets); });
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
                return new compile_metadata_1.CompileStylesheetMetadata({ moduleUrl: styleUrl, styles: styles });
            });
            var encapsulation = prenormData.encapsulation;
            if (encapsulation == null) {
                encapsulation = this._config.defaultEncapsulation;
            }
            if (encapsulation === core_1.ViewEncapsulation.Emulated && styles.length === 0 &&
                styleUrls.length === 0) {
                encapsulation = core_1.ViewEncapsulation.None;
            }
            return new compile_metadata_1.CompileTemplateMetadata({
                encapsulation: encapsulation,
                template: preparsedTemplate.template,
                templateUrl: preparsedTemplate.templateUrl,
                htmlAst: preparsedTemplate.htmlAst, styles: styles, styleUrls: styleUrls,
                ngContentSelectors: preparsedTemplate.ngContentSelectors,
                animations: prenormData.animations,
                interpolation: prenormData.interpolation,
                isInline: preparsedTemplate.isInline, externalStylesheets: externalStylesheets,
                preserveWhitespaces: config_1.preserveWhitespacesDefault(prenormData.preserveWhitespaces, this._config.preserveWhitespaces),
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
            return util_1.SyncAsync.then(util_1.SyncAsync.all(styleUrls.filter(function (styleUrl) { return !loadedStylesheets.has(styleUrl); })
                .map(function (styleUrl) { return util_1.SyncAsync.then(_this._fetch(styleUrl), function (loadedStyle) {
                var stylesheet = _this._normalizeStylesheet(new compile_metadata_1.CompileStylesheetMetadata({ styles: [loadedStyle], moduleUrl: styleUrl }));
                loadedStylesheets.set(styleUrl, stylesheet);
                return _this._loadMissingExternalStylesheets(stylesheet.styleUrls, loadedStylesheets);
            }); })), function (_) { return loadedStylesheets; });
        };
        DirectiveNormalizer.prototype._normalizeStylesheet = function (stylesheet) {
            var _this = this;
            var moduleUrl = stylesheet.moduleUrl;
            var allStyleUrls = stylesheet.styleUrls.filter(style_url_resolver_1.isStyleUrlResolvable)
                .map(function (url) { return _this._urlResolver.resolve(moduleUrl, url); });
            var allStyles = stylesheet.styles.map(function (style) {
                var styleWithImports = style_url_resolver_1.extractStyleUrls(_this._urlResolver, moduleUrl, style);
                allStyleUrls.push.apply(allStyleUrls, tslib_1.__spread(styleWithImports.styleUrls));
                return styleWithImports.style;
            });
            return new compile_metadata_1.CompileStylesheetMetadata({ styles: allStyles, styleUrls: allStyleUrls, moduleUrl: moduleUrl });
        };
        return DirectiveNormalizer;
    }());
    exports.DirectiveNormalizer = DirectiveNormalizer;
    var TemplatePreparseVisitor = /** @class */ (function () {
        function TemplatePreparseVisitor() {
            this.ngContentSelectors = [];
            this.styles = [];
            this.styleUrls = [];
            this.ngNonBindableStackCount = 0;
        }
        TemplatePreparseVisitor.prototype.visitElement = function (ast, context) {
            var preparsedElement = template_preparser_1.preparseElement(ast);
            switch (preparsedElement.type) {
                case template_preparser_1.PreparsedElementType.NG_CONTENT:
                    if (this.ngNonBindableStackCount === 0) {
                        this.ngContentSelectors.push(preparsedElement.selectAttr);
                    }
                    break;
                case template_preparser_1.PreparsedElementType.STYLE:
                    var textContent_1 = '';
                    ast.children.forEach(function (child) {
                        if (child instanceof html.Text) {
                            textContent_1 += child.value;
                        }
                    });
                    this.styles.push(textContent_1);
                    break;
                case template_preparser_1.PreparsedElementType.STYLESHEET:
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
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlyZWN0aXZlX25vcm1hbGl6ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci9zcmMvZGlyZWN0aXZlX25vcm1hbGl6ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7O0lBRUgsMkVBQW1JO0lBQ25JLHVEQUFvRTtJQUNwRSxtREFBeUM7SUFDekMsMERBQXdDO0lBRXhDLDZGQUFxRTtJQUdyRSwrRUFBNEU7SUFDNUUsK0ZBQTJGO0lBRTNGLG1EQUFvRTtJQWdCcEU7UUFHRSw2QkFDWSxlQUErQixFQUFVLFlBQXlCLEVBQ2xFLFdBQXVCLEVBQVUsT0FBdUI7WUFEeEQsb0JBQWUsR0FBZixlQUFlLENBQWdCO1lBQVUsaUJBQVksR0FBWixZQUFZLENBQWE7WUFDbEUsZ0JBQVcsR0FBWCxXQUFXLENBQVk7WUFBVSxZQUFPLEdBQVAsT0FBTyxDQUFnQjtZQUo1RCx5QkFBb0IsR0FBRyxJQUFJLEdBQUcsRUFBNkIsQ0FBQztRQUlHLENBQUM7UUFFeEUsd0NBQVUsR0FBVixjQUFxQixJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBRXpELDJDQUFhLEdBQWIsVUFBYyxtQkFBNkM7WUFBM0QsaUJBUUM7WUFQQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsV0FBVyxFQUFFO2dCQUNwQyxPQUFPO2FBQ1I7WUFDRCxJQUFNLFFBQVEsR0FBRyxtQkFBbUIsQ0FBQyxRQUFVLENBQUM7WUFDaEQsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FBYSxDQUFDLENBQUM7WUFDekQsUUFBUSxDQUFDLG1CQUFtQixDQUFDLE9BQU8sQ0FDaEMsVUFBQyxVQUFVLElBQU8sS0FBSSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsU0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENB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VSxHQUFjLEVBQUUsT0FBWSxJQUFTLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQztRQUMvRCw4QkFBQztJQUFELENBQUMsQUFoREQsSUFnREMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Q29tcGlsZURpcmVjdGl2ZU1ldGFkYXRhLCBDb21waWxlU3R5bGVzaGVldE1ldGFkYXRhLCBDb21waWxlVGVtcGxhdGVNZXRhZGF0YSwgdGVtcGxhdGVTb3VyY2VVcmx9IGZyb20gJy4vY29tcGlsZV9tZXRhZGF0YSc7XG5pbXBvcnQge0NvbXBpbGVyQ29uZmlnLCBwcmVzZXJ2ZVdoaXRlc3BhY2VzRGVmYXVsdH0gZnJvbSAnLi9jb25maWcnO1xuaW1wb3J0IHtWaWV3RW5jYXBzdWxhdGlvbn0gZnJvbSAnLi9jb3JlJztcbmltcG9ydCAqIGFzIGh0bWwgZnJvbSAnLi9tbF9wYXJzZXIvYXN0JztcbmltcG9ydCB7SHRtbFBhcnNlcn0gZnJvbSAnLi9tbF9wYXJzZXIvaHRtbF9wYXJzZXInO1xuaW1wb3J0IHtJbnRlcnBvbGF0aW9uQ29uZmlnfSBmcm9tICcuL21sX3BhcnNlci9pbnRlcnBvbGF0aW9uX2NvbmZpZyc7XG5pbXBvcnQge1BhcnNlVHJlZVJlc3VsdCBhcyBIdG1sUGFyc2VUcmVlUmVzdWx0fSBmcm9tICcuL21sX3BhcnNlci9wYXJzZXInO1xuaW1wb3J0IHtSZXNvdXJjZUxvYWRlcn0gZnJvbSAnLi9yZXNvdXJjZV9sb2FkZXInO1xuaW1wb3J0IHtleHRyYWN0U3R5bGVVcmxzLCBpc1N0eWxlVXJsUmVzb2x2YWJsZX0gZnJvbSAnLi9zdHlsZV91cmxfcmVzb2x2ZXInO1xuaW1wb3J0IHtQcmVwYXJzZWRFbGVtZW50VHlwZSwgcHJlcGFyc2VFbGVtZW50fSBmcm9tICcuL3RlbXBsYXRlX3BhcnNlci90ZW1wbGF0ZV9wcmVwYXJzZXInO1xuaW1wb3J0IHtVcmxSZXNvbHZlcn0gZnJvbSAnLi91cmxfcmVzb2x2ZXInO1xuaW1wb3J0IHtTeW5jQXN5bmMsIGlzRGVmaW5lZCwgc3RyaW5naWZ5LCBzeW50YXhFcnJvcn0gZnJvbSAnLi91dGlsJztcblxuZXhwb3J0IGludGVyZmFjZSBQcmVub3JtYWxpemVkVGVtcGxhdGVNZXRhZGF0YSB7XG4gIG5nTW9kdWxlVHlwZTogYW55O1xuICBjb21wb25lbnRUeXBlOiBhbnk7XG4gIG1vZHVsZVVybDogc3RyaW5nO1xuICB0ZW1wbGF0ZTogc3RyaW5nfG51bGw7XG4gIHRlbXBsYXRlVXJsOiBzdHJpbmd8bnVsbDtcbiAgc3R5bGVzOiBzdHJpbmdbXTtcbiAgc3R5bGVVcmxzOiBzdHJpbmdbXTtcbiAgaW50ZXJwb2xhdGlvbjogW3N0cmluZywgc3RyaW5nXXxudWxsO1xuICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbnxudWxsO1xuICBhbmltYXRpb25zOiBhbnlbXTtcbiAgcHJlc2VydmVXaGl0ZXNwYWNlczogYm9vbGVhbnxudWxsO1xufVxuXG5leHBvcnQgY2xhc3MgRGlyZWN0aXZlTm9ybWFsaXplciB7XG4gIHByaXZhdGUgX3Jlc291cmNlTG9hZGVyQ2FjaGUgPSBuZXcgTWFwPHN0cmluZywgU3luY0FzeW5jPHN0cmluZz4+KCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIF9yZXNvdXJjZUxvYWRlcjogUmVzb3VyY2VMb2FkZXIsIHByaXZhdGUgX3VybFJlc29sdmVyOiBVcmxSZXNvbHZlcixcbiAgICAgIHByaXZhdGUgX2h0bWxQYXJzZXI6IEh0bWxQYXJzZXIsIHByaXZhdGUgX2NvbmZpZzogQ29tcGlsZXJDb25maWcpIHt9XG5cbiAgY2xlYXJDYWNoZSgpOiB2b2lkIHsgdGhpcy5fcmVzb3VyY2VMb2FkZXJDYWNoZS5jbGVhcigpOyB9XG5cbiAgY2xlYXJDYWNoZUZvcihub3JtYWxpemVkRGlyZWN0aXZlOiBDb21waWxlRGlyZWN0aXZlTWV0YWRhdGEpOiB2b2lkIHtcbiAgICBpZiAoIW5vcm1hbGl6ZWREaXJlY3RpdmUuaXNDb21wb25lbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgdGVtcGxhdGUgPSBub3JtYWxpemVkRGlyZWN0aXZlLnRlbXBsYXRlICE7XG4gICAgdGhpcy5fcmVzb3VyY2VMb2FkZXJDYWNoZS5kZWxldGUodGVtcGxhdGUudGVtcGxhdGVVcmwgISk7XG4gICAgdGVtcGxhdGUuZXh0ZXJuYWxTdHlsZXNoZWV0cy5mb3JFYWNoKFxuICAgICAgICAoc3R5bGVzaGVldCkgPT4geyB0aGlzLl9yZXNvdXJjZUxvYWRlckNhY2hlLmRlbGV0ZShzdHlsZXNoZWV0Lm1vZHVsZVVybCAhKTsgfSk7XG4gIH1cblxuICBwcml2YXRlIF9mZXRjaCh1cmw6IHN0cmluZyk6IFN5bmNBc3luYzxzdHJpbmc+IHtcbiAgICBsZXQgcmVzdWx0ID0gdGhpcy5fcmVzb3VyY2VMb2FkZXJDYWNoZS5nZXQodXJsKTtcbiAgICBpZiAoIXJlc3VsdCkge1xuICAgICAgcmVzdWx0ID0gdGhpcy5fcmVzb3VyY2VMb2FkZXIuZ2V0KHVybCk7XG4gICAgICB0aGlzLl9yZXNvdXJjZUxvYWRlckNhY2hlLnNldCh1cmwsIHJlc3VsdCk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBub3JtYWxpemVUZW1wbGF0ZShwcmVub3JtRGF0YTogUHJlbm9ybWFsaXplZFRlbXBsYXRlTWV0YWRhdGEpOlxuICAgICAgU3luY0FzeW5jPENvbXBpbGVUZW1wbGF0ZU1ldGFkYXRhPiB7XG4gICAgaWYgKGlzRGVmaW5lZChwcmVub3JtRGF0YS50ZW1wbGF0ZSkpIHtcbiAgICAgIGlmIChpc0RlZmluZWQocHJlbm9ybURhdGEudGVtcGxhdGVVcmwpKSB7XG4gICAgICAgIHRocm93IHN5bnRheEVycm9yKFxuICAgICAgICAgICAgYCcke3N0cmluZ2lmeShwcmVub3JtRGF0YS5jb21wb25lbnRUeXBlKX0nIGNvbXBvbmVudCBjYW5ub3QgZGVmaW5lIGJvdGggdGVtcGxhdGUgYW5kIHRlbXBsYXRlVXJsYCk7XG4gICAgICB9XG4gICAgICBpZiAodHlwZW9mIHByZW5vcm1EYXRhLnRlbXBsYXRlICE9PSAnc3RyaW5nJykge1xuICAgICAgICB0aHJvdyBzeW50YXhFcnJvcihcbiAgICAgICAgICAgIGBUaGUgdGVtcGxhdGUgc3BlY2lmaWVkIGZvciBjb21wb25lbnQgJHtzdHJpbmdpZnkocHJlbm9ybURhdGEuY29tcG9uZW50VHlwZSl9IGlzIG5vdCBhIHN0cmluZ2ApO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaXNEZWZpbmVkKHByZW5vcm1EYXRhLnRlbXBsYXRlVXJsKSkge1xuICAgICAgaWYgKHR5cGVvZiBwcmVub3JtRGF0YS50ZW1wbGF0ZVVybCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgdGhyb3cgc3ludGF4RXJyb3IoXG4gICAgICAgICAgICBgVGhlIHRlbXBsYXRlVXJsIHNwZWNpZmllZCBmb3IgY29tcG9uZW50ICR7c3RyaW5naWZ5KHByZW5vcm1EYXRhLmNvbXBvbmVudFR5cGUpfSBpcyBub3QgYSBzdHJpbmdgKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgc3ludGF4RXJyb3IoXG4gICAgICAgICAgYE5vIHRlbXBsYXRlIHNwZWNpZmllZCBmb3IgY29tcG9uZW50ICR7c3RyaW5naWZ5KHByZW5vcm1EYXRhLmNvbXBvbmVudFR5cGUpfWApO1xuICAgIH1cblxuICAgIGlmIChpc0RlZmluZWQocHJlbm9ybURhdGEucHJlc2VydmVXaGl0ZXNwYWNlcykgJiZcbiAgICAgICAgdHlwZW9mIHByZW5vcm1EYXRhLnByZXNlcnZlV2hpdGVzcGFjZXMgIT09ICdib29sZWFuJykge1xuICAgICAgdGhyb3cgc3ludGF4RXJyb3IoXG4gICAgICAgICAgYFRoZSBwcmVzZXJ2ZVdoaXRlc3BhY2VzIG9wdGlvbiBmb3IgY29tcG9uZW50ICR7c3RyaW5naWZ5KHByZW5vcm1EYXRhLmNvbXBvbmVudFR5cGUpfSBtdXN0IGJlIGEgYm9vbGVhbmApO1xuICAgIH1cblxuICAgIHJldHVybiBTeW5jQXN5bmMudGhlbihcbiAgICAgICAgdGhpcy5fcHJlUGFyc2VUZW1wbGF0ZShwcmVub3JtRGF0YSksXG4gICAgICAgIChwcmVwYXJzZWRUZW1wbGF0ZSkgPT4gdGhpcy5fbm9ybWFsaXplVGVtcGxhdGVNZXRhZGF0YShwcmVub3JtRGF0YSwgcHJlcGFyc2VkVGVtcGxhdGUpKTtcbiAgfVxuXG4gIHByaXZhdGUgX3ByZVBhcnNlVGVtcGxhdGUocHJlbm9tRGF0YTogUHJlbm9ybWFsaXplZFRlbXBsYXRlTWV0YWRhdGEpOlxuICAgICAgU3luY0FzeW5jPFByZXBhcnNlZFRlbXBsYXRlPiB7XG4gICAgbGV0IHRlbXBsYXRlOiBTeW5jQXN5bmM8c3RyaW5nPjtcbiAgICBsZXQgdGVtcGxhdGVVcmw6IHN0cmluZztcbiAgICBpZiAocHJlbm9tRGF0YS50ZW1wbGF0ZSAhPSBudWxsKSB7XG4gICAgICB0ZW1wbGF0ZSA9IHByZW5vbURhdGEudGVtcGxhdGU7XG4gICAgICB0ZW1wbGF0ZVVybCA9IHByZW5vbURhdGEubW9kdWxlVXJsO1xuICAgIH0gZWxzZSB7XG4gICAgICB0ZW1wbGF0ZVVybCA9IHRoaXMuX3VybFJlc29sdmVyLnJlc29sdmUocHJlbm9tRGF0YS5tb2R1bGVVcmwsIHByZW5vbURhdGEudGVtcGxhdGVVcmwgISk7XG4gICAgICB0ZW1wbGF0ZSA9IHRoaXMuX2ZldGNoKHRlbXBsYXRlVXJsKTtcbiAgICB9XG4gICAgcmV0dXJuIFN5bmNBc3luYy50aGVuKFxuICAgICAgICB0ZW1wbGF0ZSwgKHRlbXBsYXRlKSA9PiB0aGlzLl9wcmVwYXJzZUxvYWRlZFRlbXBsYXRlKHByZW5vbURhdGEsIHRlbXBsYXRlLCB0ZW1wbGF0ZVVybCkpO1xuICB9XG5cbiAgcHJpdmF0ZSBfcHJlcGFyc2VMb2FkZWRUZW1wbGF0ZShcbiAgICAgIHByZW5vcm1EYXRhOiBQcmVub3JtYWxpemVkVGVtcGxhdGVNZXRhZGF0YSwgdGVtcGxhdGU6IHN0cmluZyxcbiAgICAgIHRlbXBsYXRlQWJzVXJsOiBzdHJpbmcpOiBQcmVwYXJzZWRUZW1wbGF0ZSB7XG4gICAgY29uc3QgaXNJbmxpbmUgPSAhIXByZW5vcm1EYXRhLnRlbXBsYXRlO1xuICAgIGNvbnN0IGludGVycG9sYXRpb25Db25maWcgPSBJbnRlcnBvbGF0aW9uQ29uZmlnLmZyb21BcnJheShwcmVub3JtRGF0YS5pbnRlcnBvbGF0aW9uICEpO1xuICAgIGNvbnN0IHJvb3ROb2Rlc0FuZEVycm9ycyA9IHRoaXMuX2h0bWxQYXJzZXIucGFyc2UoXG4gICAgICAgIHRlbXBsYXRlLFxuICAgICAgICB0ZW1wbGF0ZVNvdXJjZVVybChcbiAgICAgICAgICAgIHtyZWZlcmVuY2U6IHByZW5vcm1EYXRhLm5nTW9kdWxlVHlwZX0sIHt0eXBlOiB7cmVmZXJlbmNlOiBwcmVub3JtRGF0YS5jb21wb25lbnRUeXBlfX0sXG4gICAgICAgICAgICB7aXNJbmxpbmUsIHRlbXBsYXRlVXJsOiB0ZW1wbGF0ZUFic1VybH0pLFxuICAgICAgICB0cnVlLCBpbnRlcnBvbGF0aW9uQ29uZmlnKTtcbiAgICBpZiAocm9vdE5vZGVzQW5kRXJyb3JzLmVycm9ycy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBlcnJvclN0cmluZyA9IHJvb3ROb2Rlc0FuZEVycm9ycy5lcnJvcnMuam9pbignXFxuJyk7XG4gICAgICB0aHJvdyBzeW50YXhFcnJvcihgVGVtcGxhdGUgcGFyc2UgZXJyb3JzOlxcbiR7ZXJyb3JTdHJpbmd9YCk7XG4gICAgfVxuXG4gICAgY29uc3QgdGVtcGxhdGVNZXRhZGF0YVN0eWxlcyA9IHRoaXMuX25vcm1hbGl6ZVN0eWxlc2hlZXQobmV3IENvbXBpbGVTdHlsZXNoZWV0TWV0YWRhdGEoXG4gICAgICAgIHtzdHlsZXM6IHByZW5vcm1EYXRhLnN0eWxlcywgbW9kdWxlVXJsOiBwcmVub3JtRGF0YS5tb2R1bGVVcmx9KSk7XG5cbiAgICBjb25zdCB2aXNpdG9yID0gbmV3IFRlbXBsYXRlUHJlcGFyc2VWaXNpdG9yKCk7XG4gICAgaHRtbC52aXNpdEFsbCh2aXNpdG9yLCByb290Tm9kZXNBbmRFcnJvcnMucm9vdE5vZGVzKTtcbiAgICBjb25zdCB0ZW1wbGF0ZVN0eWxlcyA9IHRoaXMuX25vcm1hbGl6ZVN0eWxlc2hlZXQobmV3IENvbXBpbGVTdHlsZXNoZWV0TWV0YWRhdGEoXG4gICAgICAgIHtzdHlsZXM6IHZpc2l0b3Iuc3R5bGVzLCBzdHlsZVVybHM6IHZpc2l0b3Iuc3R5bGVVcmxzLCBtb2R1bGVVcmw6IHRlbXBsYXRlQWJzVXJsfSkpO1xuXG4gICAgY29uc3Qgc3R5bGVzID0gdGVtcGxhdGVNZXRhZGF0YVN0eWxlcy5zdHlsZXMuY29uY2F0KHRlbXBsYXRlU3R5bGVzLnN0eWxlcyk7XG5cbiAgICBjb25zdCBpbmxpbmVTdHlsZVVybHMgPSB0ZW1wbGF0ZU1ldGFkYXRhU3R5bGVzLnN0eWxlVXJscy5jb25jYXQodGVtcGxhdGVTdHlsZXMuc3R5bGVVcmxzKTtcbiAgICBjb25zdCBzdHlsZVVybHMgPSB0aGlzXG4gICAgICAgICAgICAgICAgICAgICAgICAgIC5fbm9ybWFsaXplU3R5bGVzaGVldChuZXcgQ29tcGlsZVN0eWxlc2hlZXRNZXRhZGF0YShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtzdHlsZVVybHM6IHByZW5vcm1EYXRhLnN0eWxlVXJscywgbW9kdWxlVXJsOiBwcmVub3JtRGF0YS5tb2R1bGVVcmx9KSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLnN0eWxlVXJscztcbiAgICByZXR1cm4ge1xuICAgICAgdGVtcGxhdGUsXG4gICAgICB0ZW1wbGF0ZVVybDogdGVtcGxhdGVBYnNVcmwsIGlzSW5saW5lLFxuICAgICAgaHRtbEFzdDogcm9vdE5vZGVzQW5kRXJyb3JzLCBzdHlsZXMsIGlubGluZVN0eWxlVXJscywgc3R5bGVVcmxzLFxuICAgICAgbmdDb250ZW50U2VsZWN0b3JzOiB2aXNpdG9yLm5nQ29udGVudFNlbGVjdG9ycyxcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBfbm9ybWFsaXplVGVtcGxhdGVNZXRhZGF0YShcbiAgICAgIHByZW5vcm1EYXRhOiBQcmVub3JtYWxpemVkVGVtcGxhdGVNZXRhZGF0YSxcbiAgICAgIHByZXBhcnNlZFRlbXBsYXRlOiBQcmVwYXJzZWRUZW1wbGF0ZSk6IFN5bmNBc3luYzxDb21waWxlVGVtcGxhdGVNZXRhZGF0YT4ge1xuICAgIHJldHVybiBTeW5jQXN5bmMudGhlbihcbiAgICAgICAgdGhpcy5fbG9hZE1pc3NpbmdFeHRlcm5hbFN0eWxlc2hlZXRzKFxuICAgICAgICAgICAgcHJlcGFyc2VkVGVtcGxhdGUuc3R5bGVVcmxzLmNvbmNhdChwcmVwYXJzZWRUZW1wbGF0ZS5pbmxpbmVTdHlsZVVybHMpKSxcbiAgICAgICAgKGV4dGVybmFsU3R5bGVzaGVldHMpID0+IHRoaXMuX25vcm1hbGl6ZUxvYWRlZFRlbXBsYXRlTWV0YWRhdGEoXG4gICAgICAgICAgICBwcmVub3JtRGF0YSwgcHJlcGFyc2VkVGVtcGxhdGUsIGV4dGVybmFsU3R5bGVzaGVldHMpKTtcbiAgfVxuXG4gIHByaXZhdGUgX25vcm1hbGl6ZUxvYWRlZFRlbXBsYXRlTWV0YWRhdGEoXG4gICAgICBwcmVub3JtRGF0YTogUHJlbm9ybWFsaXplZFRlbXBsYXRlTWV0YWRhdGEsIHByZXBhcnNlZFRlbXBsYXRlOiBQcmVwYXJzZWRUZW1wbGF0ZSxcbiAgICAgIHN0eWxlc2hlZXRzOiBNYXA8c3RyaW5nLCBDb21waWxlU3R5bGVzaGVldE1ldGFkYXRhPik6IENvbXBpbGVUZW1wbGF0ZU1ldGFkYXRhIHtcbiAgICAvLyBBbGdvcml0aG06XG4gICAgLy8gLSBwcm9kdWNlIGV4YWN0bHkgMSBlbnRyeSBwZXIgb3JpZ2luYWwgc3R5bGVVcmwgaW5cbiAgICAvLyBDb21waWxlVGVtcGxhdGVNZXRhZGF0YS5leHRlcm5hbFN0eWxlc2hlZXRzIHdpdGggYWxsIHN0eWxlcyBpbmxpbmVkXG4gICAgLy8gLSBpbmxpbmUgYWxsIHN0eWxlcyB0aGF0IGFyZSByZWZlcmVuY2VkIGJ5IHRoZSB0ZW1wbGF0ZSBpbnRvIENvbXBpbGVUZW1wbGF0ZU1ldGFkYXRhLnN0eWxlcy5cbiAgICAvLyBSZWFzb246IGJlIGFibGUgdG8gZGV0ZXJtaW5lIGhvdyBtYW55IHN0eWxlc2hlZXRzIHRoZXJlIGFyZSBldmVuIHdpdGhvdXQgbG9hZGluZ1xuICAgIC8vIHRoZSB0ZW1wbGF0ZSBub3IgdGhlIHN0eWxlc2hlZXRzLCBzbyB3ZSBjYW4gY3JlYXRlIGEgc3R1YiBmb3IgVHlwZVNjcmlwdCBhbHdheXMgc3luY2hyb25vdXNseVxuICAgIC8vIChhcyByZXNvdXJjZSBsb2FkaW5nIG1heSBiZSBhc3luYylcblxuICAgIGNvbnN0IHN0eWxlcyA9IFsuLi5wcmVwYXJzZWRUZW1wbGF0ZS5zdHlsZXNdO1xuICAgIHRoaXMuX2lubGluZVN0eWxlcyhwcmVwYXJzZWRUZW1wbGF0ZS5pbmxpbmVTdHlsZVVybHMsIHN0eWxlc2hlZXRzLCBzdHlsZXMpO1xuICAgIGNvbnN0IHN0eWxlVXJscyA9IHByZXBhcnNlZFRlbXBsYXRlLnN0eWxlVXJscztcblxuICAgIGNvbnN0IGV4dGVybmFsU3R5bGVzaGVldHMgPSBzdHlsZVVybHMubWFwKHN0eWxlVXJsID0+IHtcbiAgICAgIGNvbnN0IHN0eWxlc2hlZXQgPSBzdHlsZXNoZWV0cy5nZXQoc3R5bGVVcmwpICE7XG4gICAgICBjb25zdCBzdHlsZXMgPSBbLi4uc3R5bGVzaGVldC5zdHlsZXNdO1xuICAgICAgdGhpcy5faW5saW5lU3R5bGVzKHN0eWxlc2hlZXQuc3R5bGVVcmxzLCBzdHlsZXNoZWV0cywgc3R5bGVzKTtcbiAgICAgIHJldHVybiBuZXcgQ29tcGlsZVN0eWxlc2hlZXRNZXRhZGF0YSh7bW9kdWxlVXJsOiBzdHlsZVVybCwgc3R5bGVzOiBzdHlsZXN9KTtcbiAgICB9KTtcblxuICAgIGxldCBlbmNhcHN1bGF0aW9uID0gcHJlbm9ybURhdGEuZW5jYXBzdWxhdGlvbjtcbiAgICBpZiAoZW5jYXBzdWxhdGlvbiA9PSBudWxsKSB7XG4gICAgICBlbmNhcHN1bGF0aW9uID0gdGhpcy5fY29uZmlnLmRlZmF1bHRFbmNhcHN1bGF0aW9uO1xuICAgIH1cbiAgICBpZiAoZW5jYXBzdWxhdGlvbiA9PT0gVmlld0VuY2Fwc3VsYXRpb24uRW11bGF0ZWQgJiYgc3R5bGVzLmxlbmd0aCA9PT0gMCAmJlxuICAgICAgICBzdHlsZVVybHMubGVuZ3RoID09PSAwKSB7XG4gICAgICBlbmNhcHN1bGF0aW9uID0gVmlld0VuY2Fwc3VsYXRpb24uTm9uZTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBDb21waWxlVGVtcGxhdGVNZXRhZGF0YSh7XG4gICAgICBlbmNhcHN1bGF0aW9uLFxuICAgICAgdGVtcGxhdGU6IHByZXBhcnNlZFRlbXBsYXRlLnRlbXBsYXRlLFxuICAgICAgdGVtcGxhdGVVcmw6IHByZXBhcnNlZFRlbXBsYXRlLnRlbXBsYXRlVXJsLFxuICAgICAgaHRtbEFzdDogcHJlcGFyc2VkVGVtcGxhdGUuaHRtbEFzdCwgc3R5bGVzLCBzdHlsZVVybHMsXG4gICAgICBuZ0NvbnRlbnRTZWxlY3RvcnM6IHByZXBhcnNlZFRlbXBsYXRlLm5nQ29udGVudFNlbGVjdG9ycyxcbiAgICAgIGFuaW1hdGlvbnM6IHByZW5vcm1EYXRhLmFuaW1hdGlvbnMsXG4gICAgICBpbnRlcnBvbGF0aW9uOiBwcmVub3JtRGF0YS5pbnRlcnBvbGF0aW9uLFxuICAgICAgaXNJbmxpbmU6IHByZXBhcnNlZFRlbXBsYXRlLmlzSW5saW5lLCBleHRlcm5hbFN0eWxlc2hlZXRzLFxuICAgICAgcHJlc2VydmVXaGl0ZXNwYWNlczogcHJlc2VydmVXaGl0ZXNwYWNlc0RlZmF1bHQoXG4gICAgICAgICAgcHJlbm9ybURhdGEucHJlc2VydmVXaGl0ZXNwYWNlcywgdGhpcy5fY29uZmlnLnByZXNlcnZlV2hpdGVzcGFjZXMpLFxuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBfaW5saW5lU3R5bGVzKFxuICAgICAgc3R5bGVVcmxzOiBzdHJpbmdbXSwgc3R5bGVzaGVldHM6IE1hcDxzdHJpbmcsIENvbXBpbGVTdHlsZXNoZWV0TWV0YWRhdGE+LFxuICAgICAgdGFyZ2V0U3R5bGVzOiBzdHJpbmdbXSkge1xuICAgIHN0eWxlVXJscy5mb3JFYWNoKHN0eWxlVXJsID0+IHtcbiAgICAgIGNvbnN0IHN0eWxlc2hlZXQgPSBzdHlsZXNoZWV0cy5nZXQoc3R5bGVVcmwpICE7XG4gICAgICBzdHlsZXNoZWV0LnN0eWxlcy5mb3JFYWNoKHN0eWxlID0+IHRhcmdldFN0eWxlcy5wdXNoKHN0eWxlKSk7XG4gICAgICB0aGlzLl9pbmxpbmVTdHlsZXMoc3R5bGVzaGVldC5zdHlsZVVybHMsIHN0eWxlc2hlZXRzLCB0YXJnZXRTdHlsZXMpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBfbG9hZE1pc3NpbmdFeHRlcm5hbFN0eWxlc2hlZXRzKFxuICAgICAgc3R5bGVVcmxzOiBzdHJpbmdbXSxcbiAgICAgIGxvYWRlZFN0eWxlc2hlZXRzOlxuICAgICAgICAgIE1hcDxzdHJpbmcsIENvbXBpbGVTdHlsZXNoZWV0TWV0YWRhdGE+ID0gbmV3IE1hcDxzdHJpbmcsIENvbXBpbGVTdHlsZXNoZWV0TWV0YWRhdGE+KCkpOlxuICAgICAgU3luY0FzeW5jPE1hcDxzdHJpbmcsIENvbXBpbGVTdHlsZXNoZWV0TWV0YWRhdGE+PiB7XG4gICAgcmV0dXJuIFN5bmNBc3luYy50aGVuKFxuICAgICAgICBTeW5jQXN5bmMuYWxsKHN0eWxlVXJscy5maWx0ZXIoKHN0eWxlVXJsKSA9PiAhbG9hZGVkU3R5bGVzaGVldHMuaGFzKHN0eWxlVXJsKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlVXJsID0+IFN5bmNBc3luYy50aGVuKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2ZldGNoKHN0eWxlVXJsKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAobG9hZGVkU3R5bGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0eWxlc2hlZXQgPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX25vcm1hbGl6ZVN0eWxlc2hlZXQobmV3IENvbXBpbGVTdHlsZXNoZWV0TWV0YWRhdGEoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtzdHlsZXM6IFtsb2FkZWRTdHlsZV0sIG1vZHVsZVVybDogc3R5bGVVcmx9KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2FkZWRTdHlsZXNoZWV0cy5zZXQoc3R5bGVVcmwsIHN0eWxlc2hlZXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2xvYWRNaXNzaW5nRXh0ZXJuYWxTdHlsZXNoZWV0cyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZXNoZWV0LnN0eWxlVXJscywgbG9hZGVkU3R5bGVzaGVldHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pKSksXG4gICAgICAgIChfKSA9PiBsb2FkZWRTdHlsZXNoZWV0cyk7XG4gIH1cblxuICBwcml2YXRlIF9ub3JtYWxpemVTdHlsZXNoZWV0KHN0eWxlc2hlZXQ6IENvbXBpbGVTdHlsZXNoZWV0TWV0YWRhdGEpOiBDb21waWxlU3R5bGVzaGVldE1ldGFkYXRhIHtcbiAgICBjb25zdCBtb2R1bGVVcmwgPSBzdHlsZXNoZWV0Lm1vZHVsZVVybCAhO1xuICAgIGNvbnN0IGFsbFN0eWxlVXJscyA9IHN0eWxlc2hlZXQuc3R5bGVVcmxzLmZpbHRlcihpc1N0eWxlVXJsUmVzb2x2YWJsZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcCh1cmwgPT4gdGhpcy5fdXJsUmVzb2x2ZXIucmVzb2x2ZShtb2R1bGVVcmwsIHVybCkpO1xuXG4gICAgY29uc3QgYWxsU3R5bGVzID0gc3R5bGVzaGVldC5zdHlsZXMubWFwKHN0eWxlID0+IHtcbiAgICAgIGNvbnN0IHN0eWxlV2l0aEltcG9ydHMgPSBleHRyYWN0U3R5bGVVcmxzKHRoaXMuX3VybFJlc29sdmVyLCBtb2R1bGVVcmwsIHN0eWxlKTtcbiAgICAgIGFsbFN0eWxlVXJscy5wdXNoKC4uLnN0eWxlV2l0aEltcG9ydHMuc3R5bGVVcmxzKTtcbiAgICAgIHJldHVybiBzdHlsZVdpdGhJbXBvcnRzLnN0eWxlO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIG5ldyBDb21waWxlU3R5bGVzaGVldE1ldGFkYXRhKFxuICAgICAgICB7c3R5bGVzOiBhbGxTdHlsZXMsIHN0eWxlVXJsczogYWxsU3R5bGVVcmxzLCBtb2R1bGVVcmw6IG1vZHVsZVVybH0pO1xuICB9XG59XG5cbmludGVyZmFjZSBQcmVwYXJzZWRUZW1wbGF0ZSB7XG4gIHRlbXBsYXRlOiBzdHJpbmc7XG4gIHRlbXBsYXRlVXJsOiBzdHJpbmc7XG4gIGlzSW5saW5lOiBib29sZWFuO1xuICBodG1sQXN0OiBIdG1sUGFyc2VUcmVlUmVzdWx0O1xuICBzdHlsZXM6IHN0cmluZ1tdO1xuICBpbmxpbmVTdHlsZVVybHM6IHN0cmluZ1tdO1xuICBzdHlsZVVybHM6IHN0cmluZ1tdO1xuICBuZ0NvbnRlbnRTZWxlY3RvcnM6IHN0cmluZ1tdO1xufVxuXG5jbGFzcyBUZW1wbGF0ZVByZXBhcnNlVmlzaXRvciBpbXBsZW1lbnRzIGh0bWwuVmlzaXRvciB7XG4gIG5nQ29udGVudFNlbGVjdG9yczogc3RyaW5nW10gPSBbXTtcbiAgc3R5bGVzOiBzdHJpbmdbXSA9IFtdO1xuICBzdHlsZVVybHM6IHN0cmluZ1tdID0gW107XG4gIG5nTm9uQmluZGFibGVTdGFja0NvdW50OiBudW1iZXIgPSAwO1xuXG4gIHZpc2l0RWxlbWVudChhc3Q6IGh0bWwuRWxlbWVudCwgY29udGV4dDogYW55KTogYW55IHtcbiAgICBjb25zdCBwcmVwYXJzZWRFbGVtZW50ID0gcHJlcGFyc2VFbGVtZW50KGFzdCk7XG4gICAgc3dpdGNoIChwcmVwYXJzZWRFbGVtZW50LnR5cGUpIHtcbiAgICAgIGNhc2UgUHJlcGFyc2VkRWxlbWVudFR5cGUuTkdfQ09OVEVOVDpcbiAgICAgICAgaWYgKHRoaXMubmdOb25CaW5kYWJsZVN0YWNrQ291bnQgPT09IDApIHtcbiAgICAgICAgICB0aGlzLm5nQ29udGVudFNlbGVjdG9ycy5wdXNoKHByZXBhcnNlZEVsZW1lbnQuc2VsZWN0QXR0cik7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFByZXBhcnNlZEVsZW1lbnRUeXBlLlNUWUxFOlxuICAgICAgICBsZXQgdGV4dENvbnRlbnQgPSAnJztcbiAgICAgICAgYXN0LmNoaWxkcmVuLmZvckVhY2goY2hpbGQgPT4ge1xuICAgICAgICAgIGlmIChjaGlsZCBpbnN0YW5jZW9mIGh0bWwuVGV4dCkge1xuICAgICAgICAgICAgdGV4dENvbnRlbnQgKz0gY2hpbGQudmFsdWU7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5zdHlsZXMucHVzaCh0ZXh0Q29udGVudCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBQcmVwYXJzZWRFbGVtZW50VHlwZS5TVFlMRVNIRUVUOlxuICAgICAgICB0aGlzLnN0eWxlVXJscy5wdXNoKHByZXBhcnNlZEVsZW1lbnQuaHJlZkF0dHIpO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBpZiAocHJlcGFyc2VkRWxlbWVudC5ub25CaW5kYWJsZSkge1xuICAgICAgdGhpcy5uZ05vbkJpbmRhYmxlU3RhY2tDb3VudCsrO1xuICAgIH1cbiAgICBodG1sLnZpc2l0QWxsKHRoaXMsIGFzdC5jaGlsZHJlbik7XG4gICAgaWYgKHByZXBhcnNlZEVsZW1lbnQubm9uQmluZGFibGUpIHtcbiAgICAgIHRoaXMubmdOb25CaW5kYWJsZVN0YWNrQ291bnQtLTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICB2aXNpdEV4cGFuc2lvbihhc3Q6IGh0bWwuRXhwYW5zaW9uLCBjb250ZXh0OiBhbnkpOiBhbnkgeyBodG1sLnZpc2l0QWxsKHRoaXMsIGFzdC5jYXNlcyk7IH1cblxuICB2aXNpdEV4cGFuc2lvbkNhc2UoYXN0OiBodG1sLkV4cGFuc2lvbkNhc2UsIGNvbnRleHQ6IGFueSk6IGFueSB7XG4gICAgaHRtbC52aXNpdEFsbCh0aGlzLCBhc3QuZXhwcmVzc2lvbik7XG4gIH1cblxuICB2aXNpdENvbW1lbnQoYXN0OiBodG1sLkNvbW1lbnQsIGNvbnRleHQ6IGFueSk6IGFueSB7IHJldHVybiBudWxsOyB9XG4gIHZpc2l0QXR0cmlidXRlKGFzdDogaHRtbC5BdHRyaWJ1dGUsIGNvbnRleHQ6IGFueSk6IGFueSB7IHJldHVybiBudWxsOyB9XG4gIHZpc2l0VGV4dChhc3Q6IGh0bWwuVGV4dCwgY29udGV4dDogYW55KTogYW55IHsgcmV0dXJuIG51bGw7IH1cbn1cbiJdfQ==
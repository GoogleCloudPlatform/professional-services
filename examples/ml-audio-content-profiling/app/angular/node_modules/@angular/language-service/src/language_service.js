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
        define("@angular/language-service/src/language_service", ["require", "exports", "tslib", "@angular/compiler", "@angular/language-service/src/completions", "@angular/language-service/src/definitions", "@angular/language-service/src/diagnostics", "@angular/language-service/src/hover", "@angular/language-service/src/types"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var compiler_1 = require("@angular/compiler");
    var completions_1 = require("@angular/language-service/src/completions");
    var definitions_1 = require("@angular/language-service/src/definitions");
    var diagnostics_1 = require("@angular/language-service/src/diagnostics");
    var hover_1 = require("@angular/language-service/src/hover");
    var types_1 = require("@angular/language-service/src/types");
    /**
     * Create an instance of an Angular `LanguageService`.
     *
     * @publicApi
     */
    function createLanguageService(host) {
        return new LanguageServiceImpl(host);
    }
    exports.createLanguageService = createLanguageService;
    var LanguageServiceImpl = /** @class */ (function () {
        function LanguageServiceImpl(host) {
            this.host = host;
        }
        Object.defineProperty(LanguageServiceImpl.prototype, "metadataResolver", {
            get: function () { return this.host.resolver; },
            enumerable: true,
            configurable: true
        });
        LanguageServiceImpl.prototype.getTemplateReferences = function () { return this.host.getTemplateReferences(); };
        LanguageServiceImpl.prototype.getDiagnostics = function (fileName) {
            var results = [];
            var templates = this.host.getTemplates(fileName);
            if (templates && templates.length) {
                results.push.apply(results, tslib_1.__spread(diagnostics_1.getTemplateDiagnostics(fileName, this, templates)));
            }
            var declarations = this.host.getDeclarations(fileName);
            if (declarations && declarations.length) {
                var summary = this.host.getAnalyzedModules();
                results.push.apply(results, tslib_1.__spread(diagnostics_1.getDeclarationDiagnostics(declarations, summary)));
            }
            return uniqueBySpan(results);
        };
        LanguageServiceImpl.prototype.getPipesAt = function (fileName, position) {
            var templateInfo = this.getTemplateAstAtPosition(fileName, position);
            if (templateInfo) {
                return templateInfo.pipes;
            }
            return [];
        };
        LanguageServiceImpl.prototype.getCompletionsAt = function (fileName, position) {
            var templateInfo = this.getTemplateAstAtPosition(fileName, position);
            if (templateInfo) {
                return completions_1.getTemplateCompletions(templateInfo);
            }
        };
        LanguageServiceImpl.prototype.getDefinitionAt = function (fileName, position) {
            var templateInfo = this.getTemplateAstAtPosition(fileName, position);
            if (templateInfo) {
                return definitions_1.getDefinition(templateInfo);
            }
        };
        LanguageServiceImpl.prototype.getHoverAt = function (fileName, position) {
            var templateInfo = this.getTemplateAstAtPosition(fileName, position);
            if (templateInfo) {
                return hover_1.getHover(templateInfo);
            }
        };
        LanguageServiceImpl.prototype.getTemplateAstAtPosition = function (fileName, position) {
            var template = this.host.getTemplateAt(fileName, position);
            if (template) {
                var astResult = this.getTemplateAst(template, fileName);
                if (astResult && astResult.htmlAst && astResult.templateAst && astResult.directive &&
                    astResult.directives && astResult.pipes && astResult.expressionParser)
                    return {
                        position: position,
                        fileName: fileName,
                        template: template,
                        htmlAst: astResult.htmlAst,
                        directive: astResult.directive,
                        directives: astResult.directives,
                        pipes: astResult.pipes,
                        templateAst: astResult.templateAst,
                        expressionParser: astResult.expressionParser
                    };
            }
            return undefined;
        };
        LanguageServiceImpl.prototype.getTemplateAst = function (template, contextFile) {
            var _this = this;
            var result = undefined;
            try {
                var resolvedMetadata = this.metadataResolver.getNonNormalizedDirectiveMetadata(template.type);
                var metadata = resolvedMetadata && resolvedMetadata.metadata;
                if (metadata) {
                    var rawHtmlParser = new compiler_1.HtmlParser();
                    var htmlParser = new compiler_1.I18NHtmlParser(rawHtmlParser);
                    var expressionParser = new compiler_1.Parser(new compiler_1.Lexer());
                    var config = new compiler_1.CompilerConfig();
                    var parser = new compiler_1.TemplateParser(config, this.host.resolver.getReflector(), expressionParser, new compiler_1.DomElementSchemaRegistry(), htmlParser, null, []);
                    var htmlResult = htmlParser.parse(template.source, '', true);
                    var analyzedModules = this.host.getAnalyzedModules();
                    var errors = undefined;
                    var ngModule = analyzedModules.ngModuleByPipeOrDirective.get(template.type);
                    if (!ngModule) {
                        // Reported by the the declaration diagnostics.
                        ngModule = findSuitableDefaultModule(analyzedModules);
                    }
                    if (ngModule) {
                        var resolvedDirectives = ngModule.transitiveModule.directives.map(function (d) { return _this.host.resolver.getNonNormalizedDirectiveMetadata(d.reference); });
                        var directives = removeMissing(resolvedDirectives).map(function (d) { return d.metadata.toSummary(); });
                        var pipes = ngModule.transitiveModule.pipes.map(function (p) { return _this.host.resolver.getOrLoadPipeMetadata(p.reference).toSummary(); });
                        var schemas = ngModule.schemas;
                        var parseResult = parser.tryParseHtml(htmlResult, metadata, directives, pipes, schemas);
                        result = {
                            htmlAst: htmlResult.rootNodes,
                            templateAst: parseResult.templateAst,
                            directive: metadata, directives: directives, pipes: pipes,
                            parseErrors: parseResult.errors, expressionParser: expressionParser, errors: errors
                        };
                    }
                }
            }
            catch (e) {
                var span = template.span;
                if (e.fileName == contextFile) {
                    span = template.query.getSpanAt(e.line, e.column) || span;
                }
                result = { errors: [{ kind: types_1.DiagnosticKind.Error, message: e.message, span: span }] };
            }
            return result || {};
        };
        return LanguageServiceImpl;
    }());
    function removeMissing(values) {
        return values.filter(function (e) { return !!e; });
    }
    function uniqueBySpan(elements) {
        var e_1, _a;
        if (elements) {
            var result = [];
            var map = new Map();
            try {
                for (var elements_1 = tslib_1.__values(elements), elements_1_1 = elements_1.next(); !elements_1_1.done; elements_1_1 = elements_1.next()) {
                    var element = elements_1_1.value;
                    var span = element.span;
                    var set = map.get(span.start);
                    if (!set) {
                        set = new Set();
                        map.set(span.start, set);
                    }
                    if (!set.has(span.end)) {
                        set.add(span.end);
                        result.push(element);
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (elements_1_1 && !elements_1_1.done && (_a = elements_1.return)) _a.call(elements_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return result;
        }
    }
    function findSuitableDefaultModule(modules) {
        var e_2, _a;
        var result = undefined;
        var resultSize = 0;
        try {
            for (var _b = tslib_1.__values(modules.ngModules), _c = _b.next(); !_c.done; _c = _b.next()) {
                var module_1 = _c.value;
                var moduleSize = module_1.transitiveModule.directives.length;
                if (moduleSize > resultSize) {
                    result = module_1;
                    resultSize = moduleSize;
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
        return result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2Vfc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2xhbmd1YWdlLXNlcnZpY2Uvc3JjL2xhbmd1YWdlX3NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7O0lBRUgsOENBQStOO0lBRy9OLHlFQUFxRDtJQUNyRCx5RUFBNEM7SUFDNUMseUVBQWdGO0lBQ2hGLDZEQUFpQztJQUNqQyw2REFBbUs7SUFHbks7Ozs7T0FJRztJQUNILFNBQWdCLHFCQUFxQixDQUFDLElBQXlCO1FBQzdELE9BQU8sSUFBSSxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN2QyxDQUFDO0lBRkQsc0RBRUM7SUFFRDtRQUNFLDZCQUFvQixJQUF5QjtZQUF6QixTQUFJLEdBQUosSUFBSSxDQUFxQjtRQUFHLENBQUM7UUFFakQsc0JBQVksaURBQWdCO2lCQUE1QixjQUEwRCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQzs7O1dBQUE7UUFFdEYsbURBQXFCLEdBQXJCLGNBQW9DLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUUvRSw0Q0FBYyxHQUFkLFVBQWUsUUFBZ0I7WUFDN0IsSUFBSSxPQUFPLEdBQWdCLEVBQUUsQ0FBQztZQUM5QixJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNqRCxJQUFJLFNBQVMsSUFBSSxTQUFTLENBQUMsTUFBTSxFQUFFO2dCQUNqQyxPQUFPLENBQUMsSUFBSSxPQUFaLE9BQU8sbUJBQVMsb0NBQXNCLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxTQUFTLENBQUMsR0FBRTthQUNwRTtZQUVELElBQUksWUFBWSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxD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SUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFO3dCQUN0QixHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQzt3QkFDbEIsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztxQkFDdEI7aUJBQ0Y7Ozs7Ozs7OztZQUNELE9BQU8sTUFBTSxDQUFDO1NBQ2Y7SUFDSCxDQUFDO0lBRUQsU0FBUyx5QkFBeUIsQ0FBQyxPQUEwQjs7UUFDM0QsSUFBSSxNQUFNLEdBQXNDLFNBQVMsQ0FBQztRQUMxRCxJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUM7O1lBQ25CLEtBQXFCLElBQUEsS0FBQSxpQkFBQSxPQUFPLENBQUMsU0FBUyxDQUFBLGdCQUFBLDRCQUFFO2dCQUFuQyxJQUFNLFFBQU0sV0FBQTtnQkFDZixJQUFNLFVBQVUsR0FBRyxRQUFNLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQztnQkFDN0QsSUFBSSxVQUFVLEdBQUcsVUFBVSxFQUFFO29CQUMzQixNQUFNLEdBQUcsUUFBTSxDQUFDO29CQUNoQixVQUFVLEdBQUcsVUFBVSxDQUFDO2lCQUN6QjthQUNGOzs7Ozs7Ozs7UUFDRCxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0NvbXBpbGVNZXRhZGF0YVJlc29sdmVyLCBDb21waWxlTmdNb2R1bGVNZXRhZGF0YSwgQ29tcGlsZVBpcGVTdW1tYXJ5LCBDb21waWxlckNvbmZpZywgRG9tRWxlbWVudFNjaGVtYVJlZ2lzdHJ5LCBIdG1sUGFyc2VyLCBJMThOSHRtbFBhcnNlciwgTGV4ZXIsIE5nQW5hbHl6ZWRNb2R1bGVzLCBQYXJzZXIsIFRlbXBsYXRlUGFyc2VyfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5cbmltcG9ydCB7QXN0UmVzdWx0LCBUZW1wbGF0ZUluZm99IGZyb20gJy4vY29tbW9uJztcbmltcG9ydCB7Z2V0VGVtcGxhdGVDb21wbGV0aW9uc30gZnJvbSAnLi9jb21wbGV0aW9ucyc7XG5pbXBvcnQge2dldERlZmluaXRpb259IGZyb20gJy4vZGVmaW5pdGlvbnMnO1xuaW1wb3J0IHtnZXREZWNsYXJhdGlvbkRpYWdub3N0aWNzLCBnZXRUZW1wbGF0ZURpYWdub3N0aWNzfSBmcm9tICcuL2RpYWdub3N0aWNzJztcbmltcG9ydCB7Z2V0SG92ZXJ9IGZyb20gJy4vaG92ZXInO1xuaW1wb3J0IHtDb21wbGV0aW9ucywgRGVmaW5pdGlvbiwgRGlhZ25vc3RpYywgRGlhZ25vc3RpY0tpbmQsIERpYWdub3N0aWNzLCBIb3ZlciwgTGFuZ3VhZ2VTZXJ2aWNlLCBMYW5ndWFnZVNlcnZpY2VIb3N0LCBQaXBlcywgU3BhbiwgVGVtcGxhdGVTb3VyY2V9IGZyb20gJy4vdHlwZXMnO1xuXG5cbi8qKlxuICogQ3JlYXRlIGFuIGluc3RhbmNlIG9mIGFuIEFuZ3VsYXIgYExhbmd1YWdlU2VydmljZWAuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTGFuZ3VhZ2VTZXJ2aWNlKGhvc3Q6IExhbmd1YWdlU2VydmljZUhvc3QpOiBMYW5ndWFnZVNlcnZpY2Uge1xuICByZXR1cm4gbmV3IExhbmd1YWdlU2VydmljZUltcGwoaG9zdCk7XG59XG5cbmNsYXNzIExhbmd1YWdlU2VydmljZUltcGwgaW1wbGVtZW50cyBMYW5ndWFnZVNlcnZpY2Uge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGhvc3Q6IExhbmd1YWdlU2VydmljZUhvc3QpIHt9XG5cbiAgcHJpdmF0ZSBnZXQgbWV0YWRhdGFSZXNvbHZlcigpOiBDb21waWxlTWV0YWRhdGFSZXNvbHZlciB7IHJldHVybiB0aGlzLmhvc3QucmVzb2x2ZXI7IH1cblxuICBnZXRUZW1wbGF0ZVJlZmVyZW5jZXMoKTogc3RyaW5nW10geyByZXR1cm4gdGhpcy5ob3N0LmdldFRlbXBsYXRlUmVmZXJlbmNlcygpOyB9XG5cbiAgZ2V0RGlhZ25vc3RpY3MoZmlsZU5hbWU6IHN0cmluZyk6IERpYWdub3N0aWNzfHVuZGVmaW5lZCB7XG4gICAgbGV0IHJlc3VsdHM6IERpYWdub3N0aWNzID0gW107XG4gICAgbGV0IHRlbXBsYXRlcyA9IHRoaXMuaG9zdC5nZXRUZW1wbGF0ZXMoZmlsZU5hbWUpO1xuICAgIGlmICh0ZW1wbGF0ZXMgJiYgdGVtcGxhdGVzLmxlbmd0aCkge1xuICAgICAgcmVzdWx0cy5wdXNoKC4uLmdldFRlbXBsYXRlRGlhZ25vc3RpY3MoZmlsZU5hbWUsIHRoaXMsIHRlbXBsYXRlcykpO1xuICAgIH1cblxuICAgIGxldCBkZWNsYXJhdGlvbnMgPSB0aGlzLmhvc3QuZ2V0RGVjbGFyYXRpb25zKGZpbGVOYW1lKTtcbiAgICBpZiAoZGVjbGFyYXRpb25zICYmIGRlY2xhcmF0aW9ucy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHN1bW1hcnkgPSB0aGlzLmhvc3QuZ2V0QW5hbHl6ZWRNb2R1bGVzKCk7XG4gICAgICByZXN1bHRzLnB1c2goLi4uZ2V0RGVjbGFyYXRpb25EaWFnbm9zdGljcyhkZWNsYXJhdGlvbnMsIHN1bW1hcnkpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdW5pcXVlQnlTcGFuKHJlc3VsdHMpO1xuICB9XG5cbiAgZ2V0UGlwZXNBdChmaWxlTmFtZTogc3RyaW5nLCBwb3NpdGlvbjogbnVtYmVyKTogQ29tcGlsZVBpcGVTdW1tYXJ5W10ge1xuICAgIGxldCB0ZW1wbGF0ZUluZm8gPSB0aGlzLmdldFRlbXBsYXRlQXN0QXRQb3NpdGlvbihmaWxlTmFtZSwgcG9zaXRpb24pO1xuICAgIGlmICh0ZW1wbGF0ZUluZm8pIHtcbiAgICAgIHJldHVybiB0ZW1wbGF0ZUluZm8ucGlwZXM7XG4gICAgfVxuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIGdldENvbXBsZXRpb25zQXQoZmlsZU5hbWU6IHN0cmluZywgcG9zaXRpb246IG51bWJlcik6IENvbXBsZXRpb25zIHtcbiAgICBsZXQgdGVtcGxhdGVJbmZvID0gdGhpcy5nZXRUZW1wbGF0ZUFzdEF0UG9zaXRpb24oZmlsZU5hbWUsIHBvc2l0aW9uKTtcbiAgICBpZiAodGVtcGxhdGVJbmZvKSB7XG4gICAgICByZXR1cm4gZ2V0VGVtcGxhdGVDb21wbGV0aW9ucyh0ZW1wbGF0ZUluZm8pO1xuICAgIH1cbiAgfVxuXG4gIGdldERlZmluaXRpb25BdChmaWxlTmFtZTogc3RyaW5nLCBwb3NpdGlvbjogbnVtYmVyKTogRGVmaW5pdGlvbiB7XG4gICAgbGV0IHRlbXBsYXRlSW5mbyA9IHRoaXMuZ2V0VGVtcGxhdGVBc3RBdFBvc2l0aW9uKGZpbGVOYW1lLCBwb3NpdGlvbik7XG4gICAgaWYgKHRlbXBsYXRlSW5mbykge1xuICAgICAgcmV0dXJuIGdldERlZmluaXRpb24odGVtcGxhdGVJbmZvKTtcbiAgICB9XG4gIH1cblxuICBnZXRIb3ZlckF0KGZpbGVOYW1lOiBzdHJpbmcsIHBvc2l0aW9uOiBudW1iZXIpOiBIb3Zlcnx1bmRlZmluZWQge1xuICAgIGxldCB0ZW1wbGF0ZUluZm8gPSB0aGlzLmdldFRlbXBsYXRlQXN0QXRQb3NpdGlvbihmaWxlTmFtZSwgcG9zaXRpb24pO1xuICAgIGlmICh0ZW1wbGF0ZUluZm8pIHtcbiAgICAgIHJldHVybiBnZXRIb3Zlcih0ZW1wbGF0ZUluZm8pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2V0VGVtcGxhdGVBc3RBdFBvc2l0aW9uKGZpbGVOYW1lOiBzdHJpbmcsIHBvc2l0aW9uOiBudW1iZXIpOiBUZW1wbGF0ZUluZm98dW5kZWZpbmVkIHtcbiAgICBsZXQgdGVtcGxhdGUgPSB0aGlzLmhvc3QuZ2V0VGVtcGxhdGVBdChmaWxlTmFtZSwgcG9zaXRpb24pO1xuICAgIGlmICh0ZW1wbGF0ZSkge1xuICAgICAgbGV0IGFzdFJlc3VsdCA9IHRoaXMuZ2V0VGVtcGxhdGVBc3QodGVtcGxhdGUsIGZpbGVOYW1lKTtcbiAgICAgIGlmIChhc3RSZXN1bHQgJiYgYXN0UmVzdWx0Lmh0bWxBc3QgJiYgYXN0UmVzdWx0LnRlbXBsYXRlQXN0ICYmIGFzdFJlc3VsdC5kaXJlY3RpdmUgJiZcbiAgICAgICAgICBhc3RSZXN1bHQuZGlyZWN0aXZlcyAmJiBhc3RSZXN1bHQucGlwZXMgJiYgYXN0UmVzdWx0LmV4cHJlc3Npb25QYXJzZXIpXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgcG9zaXRpb24sXG4gICAgICAgICAgZmlsZU5hbWUsXG4gICAgICAgICAgdGVtcGxhdGUsXG4gICAgICAgICAgaHRtbEFzdDogYXN0UmVzdWx0Lmh0bWxBc3QsXG4gICAgICAgICAgZGlyZWN0aXZlOiBhc3RSZXN1bHQuZGlyZWN0aXZlLFxuICAgICAgICAgIGRpcmVjdGl2ZXM6IGFzdFJlc3VsdC5kaXJlY3RpdmVzLFxuICAgICAgICAgIHBpcGVzOiBhc3RSZXN1bHQucGlwZXMsXG4gICAgICAgICAgdGVtcGxhdGVBc3Q6IGFzdFJlc3VsdC50ZW1wbGF0ZUFzdCxcbiAgICAgICAgICBleHByZXNzaW9uUGFyc2VyOiBhc3RSZXN1bHQuZXhwcmVzc2lvblBhcnNlclxuICAgICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgZ2V0VGVtcGxhdGVBc3QodGVtcGxhdGU6IFRlbXBsYXRlU291cmNlLCBjb250ZXh0RmlsZTogc3RyaW5nKTogQXN0UmVzdWx0IHtcbiAgICBsZXQgcmVzdWx0OiBBc3RSZXN1bHR8dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXNvbHZlZE1ldGFkYXRhID1cbiAgICAgICAgICB0aGlzLm1ldGFkYXRhUmVzb2x2ZXIuZ2V0Tm9uTm9ybWFsaXplZERpcmVjdGl2ZU1ldGFkYXRhKHRlbXBsYXRlLnR5cGUgYXMgYW55KTtcbiAgICAgIGNvbnN0IG1ldGFkYXRhID0gcmVzb2x2ZWRNZXRhZGF0YSAmJiByZXNvbHZlZE1ldGFkYXRhLm1ldGFkYXRhO1xuICAgICAgaWYgKG1ldGFkYXRhKSB7XG4gICAgICAgIGNvbnN0IHJhd0h0bWxQYXJzZXIgPSBuZXcgSHRtbFBhcnNlcigpO1xuICAgICAgICBjb25zdCBodG1sUGFyc2VyID0gbmV3IEkxOE5IdG1sUGFyc2VyKHJhd0h0bWxQYXJzZXIpO1xuICAgICAgICBjb25zdCBleHByZXNzaW9uUGFyc2VyID0gbmV3IFBhcnNlcihuZXcgTGV4ZXIoKSk7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IG5ldyBDb21waWxlckNvbmZpZygpO1xuICAgICAgICBjb25zdCBwYXJzZXIgPSBuZXcgVGVtcGxhdGVQYXJzZXIoXG4gICAgICAgICAgICBjb25maWcsIHRoaXMuaG9zdC5yZXNvbHZlci5nZXRSZWZsZWN0b3IoKSwgZXhwcmVzc2lvblBhcnNlcixcbiAgICAgICAgICAgIG5ldyBEb21FbGVtZW50U2NoZW1hUmVnaXN0cnkoKSwgaHRtbFBhcnNlciwgbnVsbCAhLCBbXSk7XG4gICAgICAgIGNvbnN0IGh0bWxSZXN1bHQgPSBodG1sUGFyc2VyLnBhcnNlKHRlbXBsYXRlLnNvdXJjZSwgJycsIHRydWUpO1xuICAgICAgICBjb25zdCBhbmFseXplZE1vZHVsZXMgPSB0aGlzLmhvc3QuZ2V0QW5hbHl6ZWRNb2R1bGVzKCk7XG4gICAgICAgIGxldCBlcnJvcnM6IERpYWdub3N0aWNbXXx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgICAgIGxldCBuZ01vZHVsZSA9IGFuYWx5emVkTW9kdWxlcy5uZ01vZHVsZUJ5UGlwZU9yRGlyZWN0aXZlLmdldCh0ZW1wbGF0ZS50eXBlKTtcbiAgICAgICAgaWYgKCFuZ01vZHVsZSkge1xuICAgICAgICAgIC8vIFJlcG9ydGVkIGJ5IHRoZSB0aGUgZGVjbGFyYXRpb24gZGlhZ25vc3RpY3MuXG4gICAgICAgICAgbmdNb2R1bGUgPSBmaW5kU3VpdGFibGVEZWZhdWx0TW9kdWxlKGFuYWx5emVkTW9kdWxlcyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5nTW9kdWxlKSB7XG4gICAgICAgICAgY29uc3QgcmVzb2x2ZWREaXJlY3RpdmVzID0gbmdNb2R1bGUudHJhbnNpdGl2ZU1vZHVsZS5kaXJlY3RpdmVzLm1hcChcbiAgICAgICAgICAgICAgZCA9PiB0aGlzLmhvc3QucmVzb2x2ZXIuZ2V0Tm9uTm9ybWFsaXplZERpcmVjdGl2ZU1ldGFkYXRhKGQucmVmZXJlbmNlKSk7XG4gICAgICAgICAgY29uc3QgZGlyZWN0aXZlcyA9IHJlbW92ZU1pc3NpbmcocmVzb2x2ZWREaXJlY3RpdmVzKS5tYXAoZCA9PiBkLm1ldGFkYXRhLnRvU3VtbWFyeSgpKTtcbiAgICAgICAgICBjb25zdCBwaXBlcyA9IG5nTW9kdWxlLnRyYW5zaXRpdmVNb2R1bGUucGlwZXMubWFwKFxuICAgICAgICAgICAgICBwID0+IHRoaXMuaG9zdC5yZXNvbHZlci5nZXRPckxvYWRQaXBlTWV0YWRhdGEocC5yZWZlcmVuY2UpLnRvU3VtbWFyeSgpKTtcbiAgICAgICAgICBjb25zdCBzY2hlbWFzID0gbmdNb2R1bGUuc2NoZW1hcztcbiAgICAgICAgICBjb25zdCBwYXJzZVJlc3VsdCA9IHBhcnNlci50cnlQYXJzZUh0bWwoaHRtbFJlc3VsdCwgbWV0YWRhdGEsIGRpcmVjdGl2ZXMsIHBpcGVzLCBzY2hlbWFzKTtcbiAgICAgICAgICByZXN1bHQgPSB7XG4gICAgICAgICAgICBodG1sQXN0OiBodG1sUmVzdWx0LnJvb3ROb2RlcyxcbiAgICAgICAgICAgIHRlbXBsYXRlQXN0OiBwYXJzZVJlc3VsdC50ZW1wbGF0ZUFzdCxcbiAgICAgICAgICAgIGRpcmVjdGl2ZTogbWV0YWRhdGEsIGRpcmVjdGl2ZXMsIHBpcGVzLFxuICAgICAgICAgICAgcGFyc2VFcnJvcnM6IHBhcnNlUmVzdWx0LmVycm9ycywgZXhwcmVzc2lvblBhcnNlciwgZXJyb3JzXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGxldCBzcGFuID0gdGVtcGxhdGUuc3BhbjtcbiAgICAgIGlmIChlLmZpbGVOYW1lID09IGNvbnRleHRGaWxlKSB7XG4gICAgICAgIHNwYW4gPSB0ZW1wbGF0ZS5xdWVyeS5nZXRTcGFuQXQoZS5saW5lLCBlLmNvbHVtbikgfHwgc3BhbjtcbiAgICAgIH1cbiAgICAgIHJlc3VsdCA9IHtlcnJvcnM6IFt7a2luZDogRGlhZ25vc3RpY0tpbmQuRXJyb3IsIG1lc3NhZ2U6IGUubWVzc2FnZSwgc3Bhbn1dfTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdCB8fCB7fTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZW1vdmVNaXNzaW5nPFQ+KHZhbHVlczogKFQgfCBudWxsIHwgdW5kZWZpbmVkKVtdKTogVFtdIHtcbiAgcmV0dXJuIHZhbHVlcy5maWx0ZXIoZSA9PiAhIWUpIGFzIFRbXTtcbn1cblxuZnVuY3Rpb24gdW5pcXVlQnlTcGFuIDwgVCBleHRlbmRzIHtcbiAgc3BhbjogU3Bhbjtcbn1cbj4gKGVsZW1lbnRzOiBUW10gfCB1bmRlZmluZWQpOiBUW118dW5kZWZpbmVkIHtcbiAgaWYgKGVsZW1lbnRzKSB7XG4gICAgY29uc3QgcmVzdWx0OiBUW10gPSBbXTtcbiAgICBjb25zdCBtYXAgPSBuZXcgTWFwPG51bWJlciwgU2V0PG51bWJlcj4+KCk7XG4gICAgZm9yIChjb25zdCBlbGVtZW50IG9mIGVsZW1lbnRzKSB7XG4gICAgICBsZXQgc3BhbiA9IGVsZW1lbnQuc3BhbjtcbiAgICAgIGxldCBzZXQgPSBtYXAuZ2V0KHNwYW4uc3RhcnQpO1xuICAgICAgaWYgKCFzZXQpIHtcbiAgICAgICAgc2V0ID0gbmV3IFNldCgpO1xuICAgICAgICBtYXAuc2V0KHNwYW4uc3RhcnQsIHNldCk7XG4gICAgICB9XG4gICAgICBpZiAoIXNldC5oYXMoc3Bhbi5lbmQpKSB7XG4gICAgICAgIHNldC5hZGQoc3Bhbi5lbmQpO1xuICAgICAgICByZXN1bHQucHVzaChlbGVtZW50KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxufVxuXG5mdW5jdGlvbiBmaW5kU3VpdGFibGVEZWZhdWx0TW9kdWxlKG1vZHVsZXM6IE5nQW5hbHl6ZWRNb2R1bGVzKTogQ29tcGlsZU5nTW9kdWxlTWV0YWRhdGF8dW5kZWZpbmVkIHtcbiAgbGV0IHJlc3VsdDogQ29tcGlsZU5nTW9kdWxlTWV0YWRhdGF8dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICBsZXQgcmVzdWx0U2l6ZSA9IDA7XG4gIGZvciAoY29uc3QgbW9kdWxlIG9mIG1vZHVsZXMubmdNb2R1bGVzKSB7XG4gICAgY29uc3QgbW9kdWxlU2l6ZSA9IG1vZHVsZS50cmFuc2l0aXZlTW9kdWxlLmRpcmVjdGl2ZXMubGVuZ3RoO1xuICAgIGlmIChtb2R1bGVTaXplID4gcmVzdWx0U2l6ZSkge1xuICAgICAgcmVzdWx0ID0gbW9kdWxlO1xuICAgICAgcmVzdWx0U2l6ZSA9IG1vZHVsZVNpemU7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG4iXX0=
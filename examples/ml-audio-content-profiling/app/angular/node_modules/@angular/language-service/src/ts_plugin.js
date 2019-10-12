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
        define("@angular/language-service/src/ts_plugin", ["require", "exports", "tslib", "typescript", "@angular/language-service/src/language_service", "@angular/language-service/src/typescript_host"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var ts = require("typescript");
    var language_service_1 = require("@angular/language-service/src/language_service");
    var typescript_host_1 = require("@angular/language-service/src/typescript_host");
    var projectHostMap = new WeakMap();
    function getExternalFiles(project) {
        var host = projectHostMap.get(project);
        if (host) {
            return host.getTemplateReferences();
        }
    }
    exports.getExternalFiles = getExternalFiles;
    function create(info /* ts.server.PluginCreateInfo */) {
        // Create the proxy
        var proxy = Object.create(null);
        var oldLS = info.languageService;
        function tryCall(fileName, callback) {
            if (fileName && !oldLS.getProgram().getSourceFile(fileName)) {
                return undefined;
            }
            try {
                return callback();
            }
            catch (_a) {
                return undefined;
            }
        }
        function tryFilenameCall(m) {
            return function (fileName) { return tryCall(fileName, function () { return (m.call(ls, fileName)); }); };
        }
        function tryFilenameOneCall(m) {
            return function (fileName, p) { return tryCall(fileName, function () { return (m.call(ls, fileName, p)); }); };
        }
        function tryFilenameTwoCall(m) {
            return function (fileName, p1, p2) { return tryCall(fileName, function () { return (m.call(ls, fileName, p1, p2)); }); };
        }
        function tryFilenameThreeCall(m) {
            return function (fileName, p1, p2, p3) { return tryCall(fileName, function () { return (m.call(ls, fileName, p1, p2, p3)); }); };
        }
        function tryFilenameFourCall(m) {
            return function (fileName, p1, p2, p3, p4) {
                return tryCall(fileName, function () { return (m.call(ls, fileName, p1, p2, p3, p4)); });
            };
        }
        function tryFilenameFiveCall(m) {
            return function (fileName, p1, p2, p3, p4, p5) {
                return tryCall(fileName, function () { return (m.call(ls, fileName, p1, p2, p3, p4, p5)); });
            };
        }
        function typescriptOnly(ls) {
            var languageService = {
                cleanupSemanticCache: function () { return ls.cleanupSemanticCache(); },
                getSyntacticDiagnostics: tryFilenameCall(ls.getSyntacticDiagnostics),
                getSemanticDiagnostics: tryFilenameCall(ls.getSemanticDiagnostics),
                getCompilerOptionsDiagnostics: function () { return ls.getCompilerOptionsDiagnostics(); },
                getSyntacticClassifications: tryFilenameOneCall(ls.getSemanticClassifications),
                getSemanticClassifications: tryFilenameOneCall(ls.getSemanticClassifications),
                getEncodedSyntacticClassifications: tryFilenameOneCall(ls.getEncodedSyntacticClassifications),
                getEncodedSemanticClassifications: tryFilenameOneCall(ls.getEncodedSemanticClassifications),
                getCompletionsAtPosition: tryFilenameTwoCall(ls.getCompletionsAtPosition),
                getCompletionEntryDetails: tryFilenameFiveCall(ls.getCompletionEntryDetails),
                getCompletionEntrySymbol: tryFilenameThreeCall(ls.getCompletionEntrySymbol),
                getJsxClosingTagAtPosition: tryFilenameOneCall(ls.getJsxClosingTagAtPosition),
                getQuickInfoAtPosition: tryFilenameOneCall(ls.getQuickInfoAtPosition),
                getNameOrDottedNameSpan: tryFilenameTwoCall(ls.getNameOrDottedNameSpan),
                getBreakpointStatementAtPosition: tryFilenameOneCall(ls.getBreakpointStatementAtPosition),
                getSignatureHelpItems: tryFilenameTwoCall(ls.getSignatureHelpItems),
                getRenameInfo: tryFilenameOneCall(ls.getRenameInfo),
                findRenameLocations: tryFilenameThreeCall(ls.findRenameLocations),
                getDefinitionAtPosition: tryFilenameOneCall(ls.getDefinitionAtPosition),
                getTypeDefinitionAtPosition: tryFilenameOneCall(ls.getTypeDefinitionAtPosition),
                getImplementationAtPosition: tryFilenameOneCall(ls.getImplementationAtPosition),
                getReferencesAtPosition: tryFilenameOneCall(ls.getReferencesAtPosition),
                findReferences: tryFilenameOneCall(ls.findReferences),
                getDocumentHighlights: tryFilenameTwoCall(ls.getDocumentHighlights),
                /** @deprecated */
                getOccurrencesAtPosition: tryFilenameOneCall(ls.getOccurrencesAtPosition),
                getNavigateToItems: function (searchValue, maxResultCount, fileName, excludeDtsFiles) { return tryCall(fileName, function () { return ls.getNavigateToItems(searchValue, maxResultCount, fileName, excludeDtsFiles); }); },
                getNavigationBarItems: tryFilenameCall(ls.getNavigationBarItems),
                getNavigationTree: tryFilenameCall(ls.getNavigationTree),
                getOutliningSpans: tryFilenameCall(ls.getOutliningSpans),
                getTodoComments: tryFilenameOneCall(ls.getTodoComments),
                getBraceMatchingAtPosition: tryFilenameOneCall(ls.getBraceMatchingAtPosition),
                getIndentationAtPosition: tryFilenameTwoCall(ls.getIndentationAtPosition),
                getFormattingEditsForRange: tryFilenameThreeCall(ls.getFormattingEditsForRange),
                getFormattingEditsForDocument: tryFilenameOneCall(ls.getFormattingEditsForDocument),
                getFormattingEditsAfterKeystroke: tryFilenameThreeCall(ls.getFormattingEditsAfterKeystroke),
                getDocCommentTemplateAtPosition: tryFilenameOneCall(ls.getDocCommentTemplateAtPosition),
                isValidBraceCompletionAtPosition: tryFilenameTwoCall(ls.isValidBraceCompletionAtPosition),
                getSpanOfEnclosingComment: tryFilenameTwoCall(ls.getSpanOfEnclosingComment),
                getCodeFixesAtPosition: tryFilenameFiveCall(ls.getCodeFixesAtPosition),
                applyCodeActionCommand: (function (action) { return tryCall(undefined, function () { return ls.applyCodeActionCommand(action); }); }),
                getEmitOutput: tryFilenameCall(ls.getEmitOutput),
                getProgram: function () { return ls.getProgram(); },
                dispose: function () { return ls.dispose(); },
                getApplicableRefactors: tryFilenameTwoCall(ls.getApplicableRefactors),
                getEditsForRefactor: tryFilenameFiveCall(ls.getEditsForRefactor),
                getDefinitionAndBoundSpan: tryFilenameOneCall(ls.getDefinitionAndBoundSpan),
                getCombinedCodeFix: function (scope, fixId, formatOptions, preferences) {
                    return tryCall(undefined, function () { return ls.getCombinedCodeFix(scope, fixId, formatOptions, preferences); });
                },
                // TODO(kyliau): dummy implementation to compile with ts 2.8, create real one
                getSuggestionDiagnostics: function (fileName) { return []; },
                // TODO(kyliau): dummy implementation to compile with ts 2.8, create real one
                organizeImports: function (scope, formatOptions) { return []; },
                // TODO: dummy implementation to compile with ts 2.9, create a real one
                getEditsForFileRename: function (oldFilePath, newFilePath, formatOptions, preferences) { return []; }
            };
            return languageService;
        }
        oldLS = typescriptOnly(oldLS);
        var _loop_1 = function (k) {
            proxy[k] = function () { return oldLS[k].apply(oldLS, arguments); };
        };
        for (var k in oldLS) {
            _loop_1(k);
        }
        function completionToEntry(c) {
            return {
                // TODO: remove any and fix type error.
                kind: c.kind,
                name: c.name,
                sortText: c.sort,
                kindModifiers: ''
            };
        }
        function diagnosticChainToDiagnosticChain(chain) {
            return {
                messageText: chain.message,
                category: ts.DiagnosticCategory.Error,
                code: 0,
                next: chain.next ? diagnosticChainToDiagnosticChain(chain.next) : undefined
            };
        }
        function diagnosticMessageToDiagnosticMessageText(message) {
            if (typeof message === 'string') {
                return message;
            }
            return diagnosticChainToDiagnosticChain(message);
        }
        function diagnosticToDiagnostic(d, file) {
            var result = {
                file: file,
                start: d.span.start,
                length: d.span.end - d.span.start,
                messageText: diagnosticMessageToDiagnosticMessageText(d.message),
                category: ts.DiagnosticCategory.Error,
                code: 0,
                source: 'ng'
            };
            return result;
        }
        function tryOperation(attempting, callback) {
            try {
                return callback();
            }
            catch (e) {
                info.project.projectService.logger.info("Failed to " + attempting + ": " + e.toString());
                info.project.projectService.logger.info("Stack trace: " + e.stack);
                return null;
            }
        }
        var serviceHost = new typescript_host_1.TypeScriptServiceHost(info.languageServiceHost, info.languageService);
        var ls = language_service_1.createLanguageService(serviceHost);
        serviceHost.setSite(ls);
        projectHostMap.set(info.project, serviceHost);
        proxy.getCompletionsAtPosition = function (fileName, position, options) {
            var base = oldLS.getCompletionsAtPosition(fileName, position, options) || {
                isGlobalCompletion: false,
                isMemberCompletion: false,
                isNewIdentifierLocation: false,
                entries: []
            };
            tryOperation('get completions', function () {
                var e_1, _a;
                var results = ls.getCompletionsAt(fileName, position);
                if (results && results.length) {
                    if (base === undefined) {
                        base = {
                            isGlobalCompletion: false,
                            isMemberCompletion: false,
                            isNewIdentifierLocation: false,
                            entries: []
                        };
                    }
                    try {
                        for (var results_1 = tslib_1.__values(results), results_1_1 = results_1.next(); !results_1_1.done; results_1_1 = results_1.next()) {
                            var entry = results_1_1.value;
                            base.entries.push(completionToEntry(entry));
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (results_1_1 && !results_1_1.done && (_a = results_1.return)) _a.call(results_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                }
            });
            return base;
        };
        proxy.getQuickInfoAtPosition = function (fileName, position) {
            var base = oldLS.getQuickInfoAtPosition(fileName, position);
            // TODO(vicb): the tags property has been removed in TS 2.2
            tryOperation('get quick info', function () {
                var e_2, _a;
                var ours = ls.getHoverAt(fileName, position);
                if (ours) {
                    var displayParts = [];
                    try {
                        for (var _b = tslib_1.__values(ours.text), _c = _b.next(); !_c.done; _c = _b.next()) {
                            var part = _c.value;
                            displayParts.push({ kind: part.language || 'angular', text: part.text });
                        }
                    }
                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                    finally {
                        try {
                            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                        }
                        finally { if (e_2) throw e_2.error; }
                    }
                    var tags = base && base.tags;
                    base = {
                        displayParts: displayParts,
                        documentation: [],
                        kind: 'angular',
                        kindModifiers: 'what does this do?',
                        textSpan: { start: ours.span.start, length: ours.span.end - ours.span.start },
                    };
                    if (tags) {
                        base.tags = tags;
                    }
                }
            });
            return base;
        };
        proxy.getSemanticDiagnostics = function (fileName) {
            var result = oldLS.getSemanticDiagnostics(fileName);
            var base = result || [];
            tryOperation('get diagnostics', function () {
                info.project.projectService.logger.info("Computing Angular semantic diagnostics...");
                var ours = ls.getDiagnostics(fileName);
                if (ours && ours.length) {
                    var file_1 = oldLS.getProgram().getSourceFile(fileName);
                    if (file_1) {
                        base.push.apply(base, ours.map(function (d) { return diagnosticToDiagnostic(d, file_1); }));
                    }
                }
            });
            return base;
        };
        proxy.getDefinitionAtPosition = function (fileName, position) {
            var base = oldLS.getDefinitionAtPosition(fileName, position);
            if (base && base.length) {
                return base;
            }
            return tryOperation('get definition', function () {
                var e_3, _a;
                var ours = ls.getDefinitionAt(fileName, position);
                if (ours && ours.length) {
                    base = base || [];
                    try {
                        for (var ours_1 = tslib_1.__values(ours), ours_1_1 = ours_1.next(); !ours_1_1.done; ours_1_1 = ours_1.next()) {
                            var loc = ours_1_1.value;
                            base.push({
                                fileName: loc.fileName,
                                textSpan: { start: loc.span.start, length: loc.span.end - loc.span.start },
                                name: '',
                                // TODO: remove any and fix type error.
                                kind: 'definition',
                                containerName: loc.fileName,
                                containerKind: 'file',
                            });
                        }
                    }
                    catch (e_3_1) { e_3 = { error: e_3_1 }; }
                    finally {
                        try {
                            if (ours_1_1 && !ours_1_1.done && (_a = ours_1.return)) _a.call(ours_1);
                        }
                        finally { if (e_3) throw e_3.error; }
                    }
                }
                return base;
            }) || [];
        };
        return proxy;
    }
    exports.create = create;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHNfcGx1Z2luLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvbGFuZ3VhZ2Utc2VydmljZS9zcmMvdHNfcGx1Z2luLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILCtCQUFpQztJQUVqQyxtRkFBeUQ7SUFFekQsaUZBQXdEO0lBRXhELElBQU0sY0FBYyxHQUFHLElBQUksT0FBTyxFQUE4QixDQUFDO0lBRWpFLFNBQWdCLGdCQUFnQixDQUFDLE9BQVk7UUFDM0MsSUFBTSxJQUFJLEdBQUcsY0FBYyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN6QyxJQUFJLElBQUksRUFBRTtZQUNSLE9BQU8sSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7U0FDckM7SUFDSCxDQUFDO0lBTEQsNENBS0M7SUFFRCxTQUFnQixNQUFNLENBQUMsSUFBUyxDQUFDLGdDQUFnQztRQUMvRCxtQkFBbUI7UUFDbkIsSUFBTSxLQUFLLEdBQXVCLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdEQsSUFBSSxLQUFLLEdBQXVCLElBQUksQ0FBQyxlQUFlLENBQUM7UUFFckQsU0FBUyxPQUFPLENBQUksUUFBNEIsRUFBRSxRQUFpQjtZQUNqRSxJQUFJLFFBQVEsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLEVBQUU7Z0JBQzdELE9BQU8sU0FBUyxDQUFDO2FBQ2xCO1lBQ0QsSUFBSTtnQkFDRixPQUFPLFFBQVEsRUFBRSxDQUFDO2FBQ25CO1lBQUMsV0FBTTtnQkFDTixPQUFPLFNBQVMsQ0FBQzthQUNsQjtRQUNILENBQUM7UUFFRCxTQUFTLGVBQWUsQ0FBSSxDQUEwQjtZQUNwRCxPQUFPLFVBQUEsUUFBUSxJQUFJLE9BQUEsT0FBTyxDQUFDLFFBQVEsRUFBRSxjQUFNLE9BQUcsQ0FBQyxD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SUFBTSxHQUFHLGlCQUFBOzRCQUNaLElBQUksQ0FBQyxJQUFJLENBQUM7Z0NBQ1IsUUFBUSxFQUFFLEdBQUcsQ0FBQyxRQUFRO2dDQUN0QixRQUFRLEVBQUUsRUFBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFDO2dDQUN4RSxJQUFJLEVBQUUsRUFBRTtnQ0FDUix1Q0FBdUM7Z0NBQ3ZDLElBQUksRUFBRSxZQUFtQjtnQ0FDekIsYUFBYSxFQUFFLEdBQUcsQ0FBQyxRQUFRO2dDQUMzQixhQUFhLEVBQUUsTUFBYTs2QkFDN0IsQ0FBQyxDQUFDO3lCQUNKOzs7Ozs7Ozs7aUJBQ0Y7Z0JBQ0QsT0FBTyxJQUFJLENBQUM7WUFDZCxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDbEIsQ0FBQyxDQUFDO1FBRUYsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBelJELHdCQXlSQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7Y3JlYXRlTGFuZ3VhZ2VTZXJ2aWNlfSBmcm9tICcuL2xhbmd1YWdlX3NlcnZpY2UnO1xuaW1wb3J0IHtDb21wbGV0aW9uLCBEaWFnbm9zdGljLCBEaWFnbm9zdGljTWVzc2FnZUNoYWluLCBMYW5ndWFnZVNlcnZpY2UsIExhbmd1YWdlU2VydmljZUhvc3R9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHtUeXBlU2NyaXB0U2VydmljZUhvc3R9IGZyb20gJy4vdHlwZXNjcmlwdF9ob3N0JztcblxuY29uc3QgcHJvamVjdEhvc3RNYXAgPSBuZXcgV2Vha01hcDxhbnksIFR5cGVTY3JpcHRTZXJ2aWNlSG9zdD4oKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEV4dGVybmFsRmlsZXMocHJvamVjdDogYW55KTogc3RyaW5nW118dW5kZWZpbmVkIHtcbiAgY29uc3QgaG9zdCA9IHByb2plY3RIb3N0TWFwLmdldChwcm9qZWN0KTtcbiAgaWYgKGhvc3QpIHtcbiAgICByZXR1cm4gaG9zdC5nZXRUZW1wbGF0ZVJlZmVyZW5jZXMoKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlKGluZm86IGFueSAvKiB0cy5zZXJ2ZXIuUGx1Z2luQ3JlYXRlSW5mbyAqLyk6IHRzLkxhbmd1YWdlU2VydmljZSB7XG4gIC8vIENyZWF0ZSB0aGUgcHJveHlcbiAgY29uc3QgcHJveHk6IHRzLkxhbmd1YWdlU2VydmljZSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIGxldCBvbGRMUzogdHMuTGFuZ3VhZ2VTZXJ2aWNlID0gaW5mby5sYW5ndWFnZVNlcnZpY2U7XG5cbiAgZnVuY3Rpb24gdHJ5Q2FsbDxUPihmaWxlTmFtZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBjYWxsYmFjazogKCkgPT4gVCk6IFR8dW5kZWZpbmVkIHtcbiAgICBpZiAoZmlsZU5hbWUgJiYgIW9sZExTLmdldFByb2dyYW0oKSAhLmdldFNvdXJjZUZpbGUoZmlsZU5hbWUpKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHRyeUZpbGVuYW1lQ2FsbDxUPihtOiAoZmlsZU5hbWU6IHN0cmluZykgPT4gVCk6IChmaWxlTmFtZTogc3RyaW5nKSA9PiBUIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gZmlsZU5hbWUgPT4gdHJ5Q2FsbChmaWxlTmFtZSwgKCkgPT4gPFQ+KG0uY2FsbChscywgZmlsZU5hbWUpKSk7XG4gIH1cblxuICBmdW5jdGlvbiB0cnlGaWxlbmFtZU9uZUNhbGw8VCwgUD4obTogKGZpbGVOYW1lOiBzdHJpbmcsIHA6IFApID0+IFQpOiAoZmlsZW5hbWU6IHN0cmluZywgcDogUCkgPT5cbiAgICAgIFQgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiAoZmlsZU5hbWUsIHApID0+IHRyeUNhbGwoZmlsZU5hbWUsICgpID0+IDxUPihtLmNhbGwobHMsIGZpbGVOYW1lLCBwKSkpO1xuICB9XG5cbiAgZnVuY3Rpb24gdHJ5RmlsZW5hbWVUd29DYWxsPFQsIFAxLCBQMj4obTogKGZpbGVOYW1lOiBzdHJpbmcsIHAxOiBQMSwgcDI6IFAyKSA9PiBUKTogKFxuICAgICAgZmlsZW5hbWU6IHN0cmluZywgcDE6IFAxLCBwMjogUDIpID0+IFQgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiAoZmlsZU5hbWUsIHAxLCBwMikgPT4gdHJ5Q2FsbChmaWxlTmFtZSwgKCkgPT4gPFQ+KG0uY2FsbChscywgZmlsZU5hbWUsIHAxLCBwMikpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRyeUZpbGVuYW1lVGhyZWVDYWxsPFQsIFAxLCBQMiwgUDM+KG06IChmaWxlTmFtZTogc3RyaW5nLCBwMTogUDEsIHAyOiBQMiwgcDM6IFAzKSA9PiBUKTpcbiAgICAgIChmaWxlbmFtZTogc3RyaW5nLCBwMTogUDEsIHAyOiBQMiwgcDM6IFAzKSA9PiBUIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gKGZpbGVOYW1lLCBwMSwgcDIsIHAzKSA9PiB0cnlDYWxsKGZpbGVOYW1lLCAoKSA9PiA8VD4obS5jYWxsKGxzLCBmaWxlTmFtZSwgcDEsIHAyLCBwMykpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRyeUZpbGVuYW1lRm91ckNhbGw8VCwgUDEsIFAyLCBQMywgUDQ+KFxuICAgICAgbTogKGZpbGVOYW1lOiBzdHJpbmcsIHAxOiBQMSwgcDI6IFAyLCBwMzogUDMsIHA0OiBQNCkgPT5cbiAgICAgICAgICBUKTogKGZpbGVOYW1lOiBzdHJpbmcsIHAxOiBQMSwgcDI6IFAyLCBwMzogUDMsIHA0OiBQNCkgPT4gVCB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIChmaWxlTmFtZSwgcDEsIHAyLCBwMywgcDQpID0+XG4gICAgICAgICAgICAgICB0cnlDYWxsKGZpbGVOYW1lLCAoKSA9PiA8VD4obS5jYWxsKGxzLCBmaWxlTmFtZSwgcDEsIHAyLCBwMywgcDQpKSk7XG4gIH1cblxuICBmdW5jdGlvbiB0cnlGaWxlbmFtZUZpdmVDYWxsPFQsIFAxLCBQMiwgUDMsIFA0LCBQNT4oXG4gICAgICBtOiAoZmlsZU5hbWU6IHN0cmluZywgcDE6IFAxLCBwMjogUDIsIHAzOiBQMywgcDQ6IFA0LCBwNTogUDUpID0+XG4gICAgICAgICAgVCk6IChmaWxlTmFtZTogc3RyaW5nLCBwMTogUDEsIHAyOiBQMiwgcDM6IFAzLCBwNDogUDQsIHA1OiBQNSkgPT4gVCB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIChmaWxlTmFtZSwgcDEsIHAyLCBwMywgcDQsIHA1KSA9PlxuICAgICAgICAgICAgICAgdHJ5Q2FsbChmaWxlTmFtZSwgKCkgPT4gPFQ+KG0uY2FsbChscywgZmlsZU5hbWUsIHAxLCBwMiwgcDMsIHA0LCBwNSkpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHR5cGVzY3JpcHRPbmx5KGxzOiB0cy5MYW5ndWFnZVNlcnZpY2UpOiB0cy5MYW5ndWFnZVNlcnZpY2Uge1xuICAgIGNvbnN0IGxhbmd1YWdlU2VydmljZTogdHMuTGFuZ3VhZ2VTZXJ2aWNlID0ge1xuICAgICAgY2xlYW51cFNlbWFudGljQ2FjaGU6ICgpID0+IGxzLmNsZWFudXBTZW1hbnRpY0NhY2hlKCksXG4gICAgICBnZXRTeW50YWN0aWNEaWFnbm9zdGljczogdHJ5RmlsZW5hbWVDYWxsKGxzLmdldFN5bnRhY3RpY0RpYWdub3N0aWNzKSxcbiAgICAgIGdldFNlbWFudGljRGlhZ25vc3RpY3M6IHRyeUZpbGVuYW1lQ2FsbChscy5nZXRTZW1hbnRpY0RpYWdub3N0aWNzKSxcbiAgICAgIGdldENvbXBpbGVyT3B0aW9uc0RpYWdub3N0aWNzOiAoKSA9PiBscy5nZXRDb21waWxlck9wdGlvbnNEaWFnbm9zdGljcygpLFxuICAgICAgZ2V0U3ludGFjdGljQ2xhc3NpZmljYXRpb25zOiB0cnlGaWxlbmFtZU9uZUNhbGwobHMuZ2V0U2VtYW50aWNDbGFzc2lmaWNhdGlvbnMpLFxuICAgICAgZ2V0U2VtYW50aWNDbGFzc2lmaWNhdGlvbnM6IHRyeUZpbGVuYW1lT25lQ2FsbChscy5nZXRTZW1hbnRpY0NsYXNzaWZpY2F0aW9ucyksXG4gICAgICBnZXRFbmNvZGVkU3ludGFjdGljQ2xhc3NpZmljYXRpb25zOiB0cnlGaWxlbmFtZU9uZUNhbGwobHMuZ2V0RW5jb2RlZFN5bnRhY3RpY0NsYXNzaWZpY2F0aW9ucyksXG4gICAgICBnZXRFbmNvZGVkU2VtYW50aWNDbGFzc2lmaWNhdGlvbnM6IHRyeUZpbGVuYW1lT25lQ2FsbChscy5nZXRFbmNvZGVkU2VtYW50aWNDbGFzc2lmaWNhdGlvbnMpLFxuICAgICAgZ2V0Q29tcGxldGlvbnNBdFBvc2l0aW9uOiB0cnlGaWxlbmFtZVR3b0NhbGwobHMuZ2V0Q29tcGxldGlvbnNBdFBvc2l0aW9uKSxcbiAgICAgIGdldENvbXBsZXRpb25FbnRyeURldGFpbHM6IHRyeUZpbGVuYW1lRml2ZUNhbGwobHMuZ2V0Q29tcGxldGlvbkVudHJ5RGV0YWlscyksXG4gICAgICBnZXRDb21wbGV0aW9uRW50cnlTeW1ib2w6IHRyeUZpbGVuYW1lVGhyZWVDYWxsKGxzLmdldENvbXBsZXRpb25FbnRyeVN5bWJvbCksXG4gICAgICBnZXRKc3hDbG9zaW5nVGFnQXRQb3NpdGlvbjogdHJ5RmlsZW5hbWVPbmVDYWxsKGxzLmdldEpzeENsb3NpbmdUYWdBdFBvc2l0aW9uKSxcbiAgICAgIGdldFF1aWNrSW5mb0F0UG9zaXRpb246IHRyeUZpbGVuYW1lT25lQ2FsbChscy5nZXRRdWlja0luZm9BdFBvc2l0aW9uKSxcbiAgICAgIGdldE5hbWVPckRvdHRlZE5hbWVTcGFuOiB0cnlGaWxlbmFtZVR3b0NhbGwobHMuZ2V0TmFtZU9yRG90dGVkTmFtZVNwYW4pLFxuICAgICAgZ2V0QnJlYWtwb2ludFN0YXRlbWVudEF0UG9zaXRpb246IHRyeUZpbGVuYW1lT25lQ2FsbChscy5nZXRCcmVha3BvaW50U3RhdGVtZW50QXRQb3NpdGlvbiksXG4gICAgICBnZXRTaWduYXR1cmVIZWxwSXRlbXM6IHRyeUZpbGVuYW1lVHdvQ2FsbChscy5nZXRTaWduYXR1cmVIZWxwSXRlbXMpLFxuICAgICAgZ2V0UmVuYW1lSW5mbzogdHJ5RmlsZW5hbWVPbmVDYWxsKGxzLmdldFJlbmFtZUluZm8pLFxuICAgICAgZmluZFJlbmFtZUxvY2F0aW9uczogdHJ5RmlsZW5hbWVUaHJlZUNhbGwobHMuZmluZFJlbmFtZUxvY2F0aW9ucyksXG4gICAgICBnZXREZWZpbml0aW9uQXRQb3NpdGlvbjogdHJ5RmlsZW5hbWVPbmVDYWxsKGxzLmdldERlZmluaXRpb25BdFBvc2l0aW9uKSxcbiAgICAgIGdldFR5cGVEZWZpbml0aW9uQXRQb3NpdGlvbjogdHJ5RmlsZW5hbWVPbmVDYWxsKGxzLmdldFR5cGVEZWZpbml0aW9uQXRQb3NpdGlvbiksXG4gICAgICBnZXRJbXBsZW1lbnRhdGlvbkF0UG9zaXRpb246IHRyeUZpbGVuYW1lT25lQ2FsbChscy5nZXRJbXBsZW1lbnRhdGlvbkF0UG9zaXRpb24pLFxuICAgICAgZ2V0UmVmZXJlbmNlc0F0UG9zaXRpb246IHRyeUZpbGVuYW1lT25lQ2FsbChscy5nZXRSZWZlcmVuY2VzQXRQb3NpdGlvbiksXG4gICAgICBmaW5kUmVmZXJlbmNlczogdHJ5RmlsZW5hbWVPbmVDYWxsKGxzLmZpbmRSZWZlcmVuY2VzKSxcbiAgICAgIGdldERvY3VtZW50SGlnaGxpZ2h0czogdHJ5RmlsZW5hbWVUd29DYWxsKGxzLmdldERvY3VtZW50SGlnaGxpZ2h0cyksXG4gICAgICAvKiogQGRlcHJlY2F0ZWQgKi9cbiAgICAgIGdldE9jY3VycmVuY2VzQXRQb3NpdGlvbjogdHJ5RmlsZW5hbWVPbmVDYWxsKGxzLmdldE9jY3VycmVuY2VzQXRQb3NpdGlvbiksXG4gICAgICBnZXROYXZpZ2F0ZVRvSXRlbXM6XG4gICAgICAgICAgKHNlYXJjaFZhbHVlLCBtYXhSZXN1bHRDb3VudCwgZmlsZU5hbWUsIGV4Y2x1ZGVEdHNGaWxlcykgPT4gdHJ5Q2FsbChcbiAgICAgICAgICAgICAgZmlsZU5hbWUsXG4gICAgICAgICAgICAgICgpID0+IGxzLmdldE5hdmlnYXRlVG9JdGVtcyhzZWFyY2hWYWx1ZSwgbWF4UmVzdWx0Q291bnQsIGZpbGVOYW1lLCBleGNsdWRlRHRzRmlsZXMpKSxcbiAgICAgIGdldE5hdmlnYXRpb25CYXJJdGVtczogdHJ5RmlsZW5hbWVDYWxsKGxzLmdldE5hdmlnYXRpb25CYXJJdGVtcyksXG4gICAgICBnZXROYXZpZ2F0aW9uVHJlZTogdHJ5RmlsZW5hbWVDYWxsKGxzLmdldE5hdmlnYXRpb25UcmVlKSxcbiAgICAgIGdldE91dGxpbmluZ1NwYW5zOiB0cnlGaWxlbmFtZUNhbGwobHMuZ2V0T3V0bGluaW5nU3BhbnMpLFxuICAgICAgZ2V0VG9kb0NvbW1lbnRzOiB0cnlGaWxlbmFtZU9uZUNhbGwobHMuZ2V0VG9kb0NvbW1lbnRzKSxcbiAgICAgIGdldEJyYWNlTWF0Y2hpbmdBdFBvc2l0aW9uOiB0cnlGaWxlbmFtZU9uZUNhbGwobHMuZ2V0QnJhY2VNYXRjaGluZ0F0UG9zaXRpb24pLFxuICAgICAgZ2V0SW5kZW50YXRpb25BdFBvc2l0aW9uOiB0cnlGaWxlbmFtZVR3b0NhbGwobHMuZ2V0SW5kZW50YXRpb25BdFBvc2l0aW9uKSxcbiAgICAgIGdldEZvcm1hdHRpbmdFZGl0c0ZvclJhbmdlOiB0cnlGaWxlbmFtZVRocmVlQ2FsbChscy5nZXRGb3JtYXR0aW5nRWRpdHNGb3JSYW5nZSksXG4gICAgICBnZXRGb3JtYXR0aW5nRWRpdHNGb3JEb2N1bWVudDogdHJ5RmlsZW5hbWVPbmVDYWxsKGxzLmdldEZvcm1hdHRpbmdFZGl0c0ZvckRvY3VtZW50KSxcbiAgICAgIGdldEZvcm1hdHRpbmdFZGl0c0FmdGVyS2V5c3Ryb2tlOiB0cnlGaWxlbmFtZVRocmVlQ2FsbChscy5nZXRGb3JtYXR0aW5nRWRpdHNBZnRlcktleXN0cm9rZSksXG4gICAgICBnZXREb2NDb21tZW50VGVtcGxhdGVBdFBvc2l0aW9uOiB0cnlGaWxlbmFtZU9uZUNhbGwobHMuZ2V0RG9jQ29tbWVudFRlbXBsYXRlQXRQb3NpdGlvbiksXG4gICAgICBpc1ZhbGlkQnJhY2VDb21wbGV0aW9uQXRQb3NpdGlvbjogdHJ5RmlsZW5hbWVUd29DYWxsKGxzLmlzVmFsaWRCcmFjZUNvbXBsZXRpb25BdFBvc2l0aW9uKSxcbiAgICAgIGdldFNwYW5PZkVuY2xvc2luZ0NvbW1lbnQ6IHRyeUZpbGVuYW1lVHdvQ2FsbChscy5nZXRTcGFuT2ZFbmNsb3NpbmdDb21tZW50KSxcbiAgICAgIGdldENvZGVGaXhlc0F0UG9zaXRpb246IHRyeUZpbGVuYW1lRml2ZUNhbGwobHMuZ2V0Q29kZUZpeGVzQXRQb3NpdGlvbiksXG4gICAgICBhcHBseUNvZGVBY3Rpb25Db21tYW5kOlxuICAgICAgICAgIDxhbnk+KChhY3Rpb246IGFueSkgPT4gdHJ5Q2FsbCh1bmRlZmluZWQsICgpID0+IGxzLmFwcGx5Q29kZUFjdGlvbkNvbW1hbmQoYWN0aW9uKSkpLFxuICAgICAgZ2V0RW1pdE91dHB1dDogdHJ5RmlsZW5hbWVDYWxsKGxzLmdldEVtaXRPdXRwdXQpLFxuICAgICAgZ2V0UHJvZ3JhbTogKCkgPT4gbHMuZ2V0UHJvZ3JhbSgpLFxuICAgICAgZGlzcG9zZTogKCkgPT4gbHMuZGlzcG9zZSgpLFxuICAgICAgZ2V0QXBwbGljYWJsZVJlZmFjdG9yczogdHJ5RmlsZW5hbWVUd29DYWxsKGxzLmdldEFwcGxpY2FibGVSZWZhY3RvcnMpLFxuICAgICAgZ2V0RWRpdHNGb3JSZWZhY3RvcjogdHJ5RmlsZW5hbWVGaXZlQ2FsbChscy5nZXRFZGl0c0ZvclJlZmFjdG9yKSxcbiAgICAgIGdldERlZmluaXRpb25BbmRCb3VuZFNwYW46IHRyeUZpbGVuYW1lT25lQ2FsbChscy5nZXREZWZpbml0aW9uQW5kQm91bmRTcGFuKSxcbiAgICAgIGdldENvbWJpbmVkQ29kZUZpeDpcbiAgICAgICAgICAoc2NvcGU6IHRzLkNvbWJpbmVkQ29kZUZpeFNjb3BlLCBmaXhJZDoge30sIGZvcm1hdE9wdGlvbnM6IHRzLkZvcm1hdENvZGVTZXR0aW5ncyxcbiAgICAgICAgICAgcHJlZmVyZW5jZXM6IHRzLlVzZXJQcmVmZXJlbmNlcykgPT5cbiAgICAgICAgICAgICAgdHJ5Q2FsbChcbiAgICAgICAgICAgICAgICAgIHVuZGVmaW5lZCwgKCkgPT4gbHMuZ2V0Q29tYmluZWRDb2RlRml4KHNjb3BlLCBmaXhJZCwgZm9ybWF0T3B0aW9ucywgcHJlZmVyZW5jZXMpKSxcbiAgICAgIC8vIFRPRE8oa3lsaWF1KTogZHVtbXkgaW1wbGVtZW50YXRpb24gdG8gY29tcGlsZSB3aXRoIHRzIDIuOCwgY3JlYXRlIHJlYWwgb25lXG4gICAgICBnZXRTdWdnZXN0aW9uRGlhZ25vc3RpY3M6IChmaWxlTmFtZTogc3RyaW5nKSA9PiBbXSxcbiAgICAgIC8vIFRPRE8oa3lsaWF1KTogZHVtbXkgaW1wbGVtZW50YXRpb24gdG8gY29tcGlsZSB3aXRoIHRzIDIuOCwgY3JlYXRlIHJlYWwgb25lXG4gICAgICBvcmdhbml6ZUltcG9ydHM6IChzY29wZTogdHMuQ29tYmluZWRDb2RlRml4U2NvcGUsIGZvcm1hdE9wdGlvbnM6IHRzLkZvcm1hdENvZGVTZXR0aW5ncykgPT4gW10sXG4gICAgICAvLyBUT0RPOiBkdW1teSBpbXBsZW1lbnRhdGlvbiB0byBjb21waWxlIHdpdGggdHMgMi45LCBjcmVhdGUgYSByZWFsIG9uZVxuICAgICAgZ2V0RWRpdHNGb3JGaWxlUmVuYW1lOlxuICAgICAgICAgIChvbGRGaWxlUGF0aDogc3RyaW5nLCBuZXdGaWxlUGF0aDogc3RyaW5nLCBmb3JtYXRPcHRpb25zOiB0cy5Gb3JtYXRDb2RlU2V0dGluZ3MsXG4gICAgICAgICAgIHByZWZlcmVuY2VzOiB0cy5Vc2VyUHJlZmVyZW5jZXMgfCB1bmRlZmluZWQpID0+IFtdXG4gICAgfSBhcyB0cy5MYW5ndWFnZVNlcnZpY2U7XG4gICAgcmV0dXJuIGxhbmd1YWdlU2VydmljZTtcbiAgfVxuXG4gIG9sZExTID0gdHlwZXNjcmlwdE9ubHkob2xkTFMpO1xuXG4gIGZvciAoY29uc3QgayBpbiBvbGRMUykge1xuICAgICg8YW55PnByb3h5KVtrXSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gKG9sZExTIGFzIGFueSlba10uYXBwbHkob2xkTFMsIGFyZ3VtZW50cyk7IH07XG4gIH1cblxuICBmdW5jdGlvbiBjb21wbGV0aW9uVG9FbnRyeShjOiBDb21wbGV0aW9uKTogdHMuQ29tcGxldGlvbkVudHJ5IHtcbiAgICByZXR1cm4ge1xuICAgICAgLy8gVE9ETzogcmVtb3ZlIGFueSBhbmQgZml4IHR5cGUgZXJyb3IuXG4gICAgICBraW5kOiBjLmtpbmQgYXMgYW55LFxuICAgICAgbmFtZTogYy5uYW1lLFxuICAgICAgc29ydFRleHQ6IGMuc29ydCxcbiAgICAgIGtpbmRNb2RpZmllcnM6ICcnXG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRpYWdub3N0aWNDaGFpblRvRGlhZ25vc3RpY0NoYWluKGNoYWluOiBEaWFnbm9zdGljTWVzc2FnZUNoYWluKTpcbiAgICAgIHRzLkRpYWdub3N0aWNNZXNzYWdlQ2hhaW4ge1xuICAgIHJldHVybiB7XG4gICAgICBtZXNzYWdlVGV4dDogY2hhaW4ubWVzc2FnZSxcbiAgICAgIGNhdGVnb3J5OiB0cy5EaWFnbm9zdGljQ2F0ZWdvcnkuRXJyb3IsXG4gICAgICBjb2RlOiAwLFxuICAgICAgbmV4dDogY2hhaW4ubmV4dCA/IGRpYWdub3N0aWNDaGFpblRvRGlhZ25vc3RpY0NoYWluKGNoYWluLm5leHQpIDogdW5kZWZpbmVkXG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRpYWdub3N0aWNNZXNzYWdlVG9EaWFnbm9zdGljTWVzc2FnZVRleHQobWVzc2FnZTogc3RyaW5nIHwgRGlhZ25vc3RpY01lc3NhZ2VDaGFpbik6XG4gICAgICBzdHJpbmd8dHMuRGlhZ25vc3RpY01lc3NhZ2VDaGFpbiB7XG4gICAgaWYgKHR5cGVvZiBtZXNzYWdlID09PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIG1lc3NhZ2U7XG4gICAgfVxuICAgIHJldHVybiBkaWFnbm9zdGljQ2hhaW5Ub0RpYWdub3N0aWNDaGFpbihtZXNzYWdlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRpYWdub3N0aWNUb0RpYWdub3N0aWMoZDogRGlhZ25vc3RpYywgZmlsZTogdHMuU291cmNlRmlsZSk6IHRzLkRpYWdub3N0aWMge1xuICAgIGNvbnN0IHJlc3VsdCA9IHtcbiAgICAgIGZpbGUsXG4gICAgICBzdGFydDogZC5zcGFuLnN0YXJ0LFxuICAgICAgbGVuZ3RoOiBkLnNwYW4uZW5kIC0gZC5zcGFuLnN0YXJ0LFxuICAgICAgbWVzc2FnZVRleHQ6IGRpYWdub3N0aWNNZXNzYWdlVG9EaWFnbm9zdGljTWVzc2FnZVRleHQoZC5tZXNzYWdlKSxcbiAgICAgIGNhdGVnb3J5OiB0cy5EaWFnbm9zdGljQ2F0ZWdvcnkuRXJyb3IsXG4gICAgICBjb2RlOiAwLFxuICAgICAgc291cmNlOiAnbmcnXG4gICAgfTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgZnVuY3Rpb24gdHJ5T3BlcmF0aW9uPFQ+KGF0dGVtcHRpbmc6IHN0cmluZywgY2FsbGJhY2s6ICgpID0+IFQpOiBUfG51bGwge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpbmZvLnByb2plY3QucHJvamVjdFNlcnZpY2UubG9nZ2VyLmluZm8oYEZhaWxlZCB0byAke2F0dGVtcHRpbmd9OiAke2UudG9TdHJpbmcoKX1gKTtcbiAgICAgIGluZm8ucHJvamVjdC5wcm9qZWN0U2VydmljZS5sb2dnZXIuaW5mbyhgU3RhY2sgdHJhY2U6ICR7ZS5zdGFja31gKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHNlcnZpY2VIb3N0ID0gbmV3IFR5cGVTY3JpcHRTZXJ2aWNlSG9zdChpbmZvLmxhbmd1YWdlU2VydmljZUhvc3QsIGluZm8ubGFuZ3VhZ2VTZXJ2aWNlKTtcbiAgY29uc3QgbHMgPSBjcmVhdGVMYW5ndWFnZVNlcnZpY2Uoc2VydmljZUhvc3QgYXMgYW55KTtcbiAgc2VydmljZUhvc3Quc2V0U2l0ZShscyk7XG4gIHByb2plY3RIb3N0TWFwLnNldChpbmZvLnByb2plY3QsIHNlcnZpY2VIb3N0KTtcblxuICBwcm94eS5nZXRDb21wbGV0aW9uc0F0UG9zaXRpb24gPSBmdW5jdGlvbihcbiAgICAgIGZpbGVOYW1lOiBzdHJpbmcsIHBvc2l0aW9uOiBudW1iZXIsIG9wdGlvbnM6IHRzLkdldENvbXBsZXRpb25zQXRQb3NpdGlvbk9wdGlvbnN8dW5kZWZpbmVkKSB7XG4gICAgbGV0IGJhc2UgPSBvbGRMUy5nZXRDb21wbGV0aW9uc0F0UG9zaXRpb24oZmlsZU5hbWUsIHBvc2l0aW9uLCBvcHRpb25zKSB8fCB7XG4gICAgICBpc0dsb2JhbENvbXBsZXRpb246IGZhbHNlLFxuICAgICAgaXNNZW1iZXJDb21wbGV0aW9uOiBmYWxzZSxcbiAgICAgIGlzTmV3SWRlbnRpZmllckxvY2F0aW9uOiBmYWxzZSxcbiAgICAgIGVudHJpZXM6IFtdXG4gICAgfTtcbiAgICB0cnlPcGVyYXRpb24oJ2dldCBjb21wbGV0aW9ucycsICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdHMgPSBscy5nZXRDb21wbGV0aW9uc0F0KGZpbGVOYW1lLCBwb3NpdGlvbik7XG4gICAgICBpZiAocmVzdWx0cyAmJiByZXN1bHRzLmxlbmd0aCkge1xuICAgICAgICBpZiAoYmFzZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgYmFzZSA9IHtcbiAgICAgICAgICAgIGlzR2xvYmFsQ29tcGxldGlvbjogZmFsc2UsXG4gICAgICAgICAgICBpc01lbWJlckNvbXBsZXRpb246IGZhbHNlLFxuICAgICAgICAgICAgaXNOZXdJZGVudGlmaWVyTG9jYXRpb246IGZhbHNlLFxuICAgICAgICAgICAgZW50cmllczogW11cbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGZvciAoY29uc3QgZW50cnkgb2YgcmVzdWx0cykge1xuICAgICAgICAgIGJhc2UuZW50cmllcy5wdXNoKGNvbXBsZXRpb25Ub0VudHJ5KGVudHJ5KSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gYmFzZTtcbiAgfTtcblxuICBwcm94eS5nZXRRdWlja0luZm9BdFBvc2l0aW9uID0gZnVuY3Rpb24oZmlsZU5hbWU6IHN0cmluZywgcG9zaXRpb246IG51bWJlcik6IHRzLlF1aWNrSW5mbyB8XG4gICAgICB1bmRlZmluZWQge1xuICAgICAgICBsZXQgYmFzZSA9IG9sZExTLmdldFF1aWNrSW5mb0F0UG9zaXRpb24oZmlsZU5hbWUsIHBvc2l0aW9uKTtcbiAgICAgICAgLy8gVE9ETyh2aWNiKTogdGhlIHRhZ3MgcHJvcGVydHkgaGFzIGJlZW4gcmVtb3ZlZCBpbiBUUyAyLjJcbiAgICAgICAgdHJ5T3BlcmF0aW9uKCdnZXQgcXVpY2sgaW5mbycsICgpID0+IHtcbiAgICAgICAgICBjb25zdCBvdXJzID0gbHMuZ2V0SG92ZXJBdChmaWxlTmFtZSwgcG9zaXRpb24pO1xuICAgICAgICAgIGlmIChvdXJzKSB7XG4gICAgICAgICAgICBjb25zdCBkaXNwbGF5UGFydHM6IHRzLlN5bWJvbERpc3BsYXlQYXJ0W10gPSBbXTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgcGFydCBvZiBvdXJzLnRleHQpIHtcbiAgICAgICAgICAgICAgZGlzcGxheVBhcnRzLnB1c2goe2tpbmQ6IHBhcnQubGFuZ3VhZ2UgfHwgJ2FuZ3VsYXInLCB0ZXh0OiBwYXJ0LnRleHR9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHRhZ3MgPSBiYXNlICYmICg8YW55PmJhc2UpLnRhZ3M7XG4gICAgICAgICAgICBiYXNlID0gPGFueT57XG4gICAgICAgICAgICAgIGRpc3BsYXlQYXJ0cyxcbiAgICAgICAgICAgICAgZG9jdW1lbnRhdGlvbjogW10sXG4gICAgICAgICAgICAgIGtpbmQ6ICdhbmd1bGFyJyxcbiAgICAgICAgICAgICAga2luZE1vZGlmaWVyczogJ3doYXQgZG9lcyB0aGlzIGRvPycsXG4gICAgICAgICAgICAgIHRleHRTcGFuOiB7c3RhcnQ6IG91cnMuc3Bhbi5zdGFydCwgbGVuZ3RoOiBvdXJzLnNwYW4uZW5kIC0gb3Vycy5zcGFuLnN0YXJ0fSxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAodGFncykge1xuICAgICAgICAgICAgICAoPGFueT5iYXNlKS50YWdzID0gdGFncztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBiYXNlO1xuICAgICAgfTtcblxuICBwcm94eS5nZXRTZW1hbnRpY0RpYWdub3N0aWNzID0gZnVuY3Rpb24oZmlsZU5hbWU6IHN0cmluZykge1xuICAgIGxldCByZXN1bHQgPSBvbGRMUy5nZXRTZW1hbnRpY0RpYWdub3N0aWNzKGZpbGVOYW1lKTtcbiAgICBjb25zdCBiYXNlID0gcmVzdWx0IHx8IFtdO1xuICAgIHRyeU9wZXJhdGlvbignZ2V0IGRpYWdub3N0aWNzJywgKCkgPT4ge1xuICAgICAgaW5mby5wcm9qZWN0LnByb2plY3RTZXJ2aWNlLmxvZ2dlci5pbmZvKGBDb21wdXRpbmcgQW5ndWxhciBzZW1hbnRpYyBkaWFnbm9zdGljcy4uLmApO1xuICAgICAgY29uc3Qgb3VycyA9IGxzLmdldERpYWdub3N0aWNzKGZpbGVOYW1lKTtcbiAgICAgIGlmIChvdXJzICYmIG91cnMubGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IGZpbGUgPSBvbGRMUy5nZXRQcm9ncmFtKCkgIS5nZXRTb3VyY2VGaWxlKGZpbGVOYW1lKTtcbiAgICAgICAgaWYgKGZpbGUpIHtcbiAgICAgICAgICBiYXNlLnB1c2guYXBwbHkoYmFzZSwgb3Vycy5tYXAoZCA9PiBkaWFnbm9zdGljVG9EaWFnbm9zdGljKGQsIGZpbGUpKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBiYXNlO1xuICB9O1xuXG4gIHByb3h5LmdldERlZmluaXRpb25BdFBvc2l0aW9uID0gZnVuY3Rpb24oXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVOYW1lOiBzdHJpbmcsIHBvc2l0aW9uOiBudW1iZXIpOiB0cy5EZWZpbml0aW9uSW5mb1tdIHtcbiAgICBsZXQgYmFzZSA9IG9sZExTLmdldERlZmluaXRpb25BdFBvc2l0aW9uKGZpbGVOYW1lLCBwb3NpdGlvbik7XG4gICAgaWYgKGJhc2UgJiYgYmFzZS5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBiYXNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnlPcGVyYXRpb24oJ2dldCBkZWZpbml0aW9uJywgKCkgPT4ge1xuICAgICAgICAgICAgIGNvbnN0IG91cnMgPSBscy5nZXREZWZpbml0aW9uQXQoZmlsZU5hbWUsIHBvc2l0aW9uKTtcbiAgICAgICAgICAgICBpZiAob3VycyAmJiBvdXJzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgYmFzZSA9IGJhc2UgfHwgW107XG4gICAgICAgICAgICAgICBmb3IgKGNvbnN0IGxvYyBvZiBvdXJzKSB7XG4gICAgICAgICAgICAgICAgIGJhc2UucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgZmlsZU5hbWU6IGxvYy5maWxlTmFtZSxcbiAgICAgICAgICAgICAgICAgICB0ZXh0U3Bhbjoge3N0YXJ0OiBsb2Muc3Bhbi5zdGFydCwgbGVuZ3RoOiBsb2Muc3Bhbi5lbmQgLSBsb2Muc3Bhbi5zdGFydH0sXG4gICAgICAgICAgICAgICAgICAgbmFtZTogJycsXG4gICAgICAgICAgICAgICAgICAgLy8gVE9ETzogcmVtb3ZlIGFueSBhbmQgZml4IHR5cGUgZXJyb3IuXG4gICAgICAgICAgICAgICAgICAga2luZDogJ2RlZmluaXRpb24nIGFzIGFueSxcbiAgICAgICAgICAgICAgICAgICBjb250YWluZXJOYW1lOiBsb2MuZmlsZU5hbWUsXG4gICAgICAgICAgICAgICAgICAgY29udGFpbmVyS2luZDogJ2ZpbGUnIGFzIGFueSxcbiAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgfVxuICAgICAgICAgICAgIHJldHVybiBiYXNlO1xuICAgICAgICAgICB9KSB8fCBbXTtcbiAgfTtcblxuICByZXR1cm4gcHJveHk7XG59XG4iXX0=
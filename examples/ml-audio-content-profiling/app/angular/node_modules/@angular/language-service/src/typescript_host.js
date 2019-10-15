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
        define("@angular/language-service/src/typescript_host", ["require", "exports", "tslib", "@angular/compiler", "@angular/compiler-cli/src/language_services", "@angular/core", "fs", "path", "typescript", "@angular/language-service/src/language_service", "@angular/language-service/src/reflector_host"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var compiler_1 = require("@angular/compiler");
    var language_services_1 = require("@angular/compiler-cli/src/language_services");
    var core_1 = require("@angular/core");
    var fs = require("fs");
    var path = require("path");
    var ts = require("typescript");
    var language_service_1 = require("@angular/language-service/src/language_service");
    var reflector_host_1 = require("@angular/language-service/src/reflector_host");
    /**
     * Create a `LanguageServiceHost`
     */
    function createLanguageServiceFromTypescript(host, service) {
        var ngHost = new TypeScriptServiceHost(host, service);
        var ngServer = language_service_1.createLanguageService(ngHost);
        ngHost.setSite(ngServer);
        return ngServer;
    }
    exports.createLanguageServiceFromTypescript = createLanguageServiceFromTypescript;
    /**
     * The language service never needs the normalized versions of the metadata. To avoid parsing
     * the content and resolving references, return an empty file. This also allows normalizing
     * template that are syntatically incorrect which is required to provide completions in
     * syntactically incorrect templates.
     */
    var DummyHtmlParser = /** @class */ (function (_super) {
        tslib_1.__extends(DummyHtmlParser, _super);
        function DummyHtmlParser() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        DummyHtmlParser.prototype.parse = function (source, url, parseExpansionForms, interpolationConfig) {
            if (parseExpansionForms === void 0) { parseExpansionForms = false; }
            if (interpolationConfig === void 0) { interpolationConfig = compiler_1.DEFAULT_INTERPOLATION_CONFIG; }
            return new compiler_1.ParseTreeResult([], []);
        };
        return DummyHtmlParser;
    }(compiler_1.HtmlParser));
    exports.DummyHtmlParser = DummyHtmlParser;
    /**
     * Avoid loading resources in the language servcie by using a dummy loader.
     */
    var DummyResourceLoader = /** @class */ (function (_super) {
        tslib_1.__extends(DummyResourceLoader, _super);
        function DummyResourceLoader() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        DummyResourceLoader.prototype.get = function (url) { return Promise.resolve(''); };
        return DummyResourceLoader;
    }(compiler_1.ResourceLoader));
    exports.DummyResourceLoader = DummyResourceLoader;
    /**
     * An implementation of a `LanguageServiceHost` for a TypeScript project.
     *
     * The `TypeScriptServiceHost` implements the Angular `LanguageServiceHost` using
     * the TypeScript language services.
     *
     * @publicApi
     */
    var TypeScriptServiceHost = /** @class */ (function () {
        function TypeScriptServiceHost(host, tsService) {
            this.host = host;
            this.tsService = tsService;
            this._staticSymbolCache = new compiler_1.StaticSymbolCache();
            this._typeCache = [];
            this.modulesOutOfDate = true;
            this.fileVersions = new Map();
        }
        TypeScriptServiceHost.prototype.setSite = function (service) { this.service = service; };
        Object.defineProperty(TypeScriptServiceHost.prototype, "resolver", {
            /**
             * Angular LanguageServiceHost implementation
             */
            get: function () {
                var _this = this;
                this.validate();
                var result = this._resolver;
                if (!result) {
                    var moduleResolver = new compiler_1.NgModuleResolver(this.reflector);
                    var directiveResolver = new compiler_1.DirectiveResolver(this.reflector);
                    var pipeResolver = new compiler_1.PipeResolver(this.reflector);
                    var elementSchemaRegistry = new compiler_1.DomElementSchemaRegistry();
                    var resourceLoader = new DummyResourceLoader();
                    var urlResolver = compiler_1.createOfflineCompileUrlResolver();
                    var htmlParser = new DummyHtmlParser();
                    // This tracks the CompileConfig in codegen.ts. Currently these options
                    // are hard-coded.
                    var config = new compiler_1.CompilerConfig({ defaultEncapsulation: core_1.ViewEncapsulation.Emulated, useJit: false });
                    var directiveNormalizer = new compiler_1.DirectiveNormalizer(resourceLoader, urlResolver, htmlParser, config);
                    result = this._resolver = new compiler_1.CompileMetadataResolver(config, htmlParser, moduleResolver, directiveResolver, pipeResolver, new compiler_1.JitSummaryResolver(), elementSchemaRegistry, directiveNormalizer, new core_1.ɵConsole(), this._staticSymbolCache, this.reflector, function (error, type) { return _this.collectError(error, type && type.filePath); });
                }
                return result;
            },
            enumerable: true,
            configurable: true
        });
        TypeScriptServiceHost.prototype.getTemplateReferences = function () {
            this.ensureTemplateMap();
            return this.templateReferences || [];
        };
        TypeScriptServiceHost.prototype.getTemplateAt = function (fileName, position) {
            var sourceFile = this.getSourceFile(fileName);
            if (sourceFile) {
                this.context = sourceFile.fileName;
                var node = this.findNode(sourceFile, position);
                if (node) {
                    return this.getSourceFromNode(fileName, this.host.getScriptVersion(sourceFile.fileName), node);
                }
            }
            else {
                this.ensureTemplateMap();
                // TODO: Cannocalize the file?
                var componentType = this.fileToComponent.get(fileName);
                if (componentType) {
                    return this.getSourceFromType(fileName, this.host.getScriptVersion(fileName), componentType);
                }
            }
            return undefined;
        };
        TypeScriptServiceHost.prototype.getAnalyzedModules = function () {
            this.updateAnalyzedModules();
            return this.ensureAnalyzedModules();
        };
        TypeScriptServiceHost.prototype.ensureAnalyzedModules = function () {
            var analyzedModules = this.analyzedModules;
            if (!analyzedModules) {
                if (this.host.getScriptFileNames().length === 0) {
                    analyzedModules = {
                        files: [],
                        ngModuleByPipeOrDirective: new Map(),
                        ngModules: [],
                    };
                }
                else {
                    var analyzeHost = { isSourceFile: function (filePath) { return true; } };
                    var programFiles = this.program.getSourceFiles().map(function (sf) { return sf.fileName; });
                    analyzedModules =
                        compiler_1.analyzeNgModules(programFiles, analyzeHost, this.staticSymbolResolver, this.resolver);
                }
                this.analyzedModules = analyzedModules;
            }
            return analyzedModules;
        };
        TypeScriptServiceHost.prototype.getTemplates = function (fileName) {
            var _this = this;
            this.ensureTemplateMap();
            var componentType = this.fileToComponent.get(fileName);
            if (componentType) {
                var templateSource = this.getTemplateAt(fileName, 0);
                if (templateSource) {
                    return [templateSource];
                }
            }
            else {
                var version_1 = this.host.getScriptVersion(fileName);
                var result_1 = [];
                // Find each template string in the file
                var visit_1 = function (child) {
                    var templateSource = _this.getSourceFromNode(fileName, version_1, child);
                    if (templateSource) {
                        result_1.push(templateSource);
                    }
                    else {
                        ts.forEachChild(child, visit_1);
                    }
                };
                var sourceFile = this.getSourceFile(fileName);
                if (sourceFile) {
                    this.context = sourceFile.path || sourceFile.fileName;
                    ts.forEachChild(sourceFile, visit_1);
                }
                return result_1.length ? result_1 : undefined;
            }
        };
        TypeScriptServiceHost.prototype.getDeclarations = function (fileName) {
            var _this = this;
            var result = [];
            var sourceFile = this.getSourceFile(fileName);
            if (sourceFile) {
                var visit_2 = function (child) {
                    var declaration = _this.getDeclarationFromNode(sourceFile, child);
                    if (declaration) {
                        result.push(declaration);
                    }
                    else {
                        ts.forEachChild(child, visit_2);
                    }
                };
                ts.forEachChild(sourceFile, visit_2);
            }
            return result;
        };
        TypeScriptServiceHost.prototype.getSourceFile = function (fileName) {
            return this.tsService.getProgram().getSourceFile(fileName);
        };
        TypeScriptServiceHost.prototype.updateAnalyzedModules = function () {
            this.validate();
            if (this.modulesOutOfDate) {
                this.analyzedModules = null;
                this._reflector = null;
                this.templateReferences = null;
                this.fileToComponent = null;
                this.ensureAnalyzedModules();
                this.modulesOutOfDate = false;
            }
        };
        Object.defineProperty(TypeScriptServiceHost.prototype, "program", {
            get: function () { return this.tsService.getProgram(); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TypeScriptServiceHost.prototype, "checker", {
            get: function () {
                var checker = this._checker;
                if (!checker) {
                    checker = this._checker = this.program.getTypeChecker();
                }
                return checker;
            },
            enumerable: true,
            configurable: true
        });
        TypeScriptServiceHost.prototype.validate = function () {
            var _this = this;
            var e_1, _a;
            var program = this.program;
            if (this.lastProgram !== program) {
                // Invalidate file that have changed in the static symbol resolver
                var invalidateFile = function (fileName) {
                    return _this._staticSymbolResolver.invalidateFile(fileName);
                };
                this.clearCaches();
                var seen_1 = new Set();
                try {
                    for (var _b = tslib_1.__values(this.program.getSourceFiles()), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var sourceFile = _c.value;
                        var fileName = sourceFile.fileName;
                        seen_1.add(fileName);
                        var version = this.host.getScriptVersion(fileName);
                        var lastVersion = this.fileVersions.get(fileName);
                        if (version != lastVersion) {
                            this.fileVersions.set(fileName, version);
                            if (this._staticSymbolResolver) {
                                invalidateFile(fileName);
                            }
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                // Remove file versions that are no longer in the file and invalidate them.
                var missing = Array.from(this.fileVersions.keys()).filter(function (f) { return !seen_1.has(f); });
                missing.forEach(function (f) { return _this.fileVersions.delete(f); });
                if (this._staticSymbolResolver) {
                    missing.forEach(invalidateFile);
                }
                this.lastProgram = program;
            }
        };
        TypeScriptServiceHost.prototype.clearCaches = function () {
            this._checker = null;
            this._typeCache = [];
            this._resolver = null;
            this.collectedErrors = null;
            this.modulesOutOfDate = true;
        };
        TypeScriptServiceHost.prototype.ensureTemplateMap = function () {
            var e_2, _a, e_3, _b;
            if (!this.fileToComponent || !this.templateReferences) {
                var fileToComponent = new Map();
                var templateReference = [];
                var ngModuleSummary = this.getAnalyzedModules();
                var urlResolver = compiler_1.createOfflineCompileUrlResolver();
                try {
                    for (var _c = tslib_1.__values(ngModuleSummary.ngModules), _d = _c.next(); !_d.done; _d = _c.next()) {
                        var module_1 = _d.value;
                        try {
                            for (var _e = tslib_1.__values(module_1.declaredDirectives), _f = _e.next(); !_f.done; _f = _e.next()) {
                                var directive = _f.value;
                                var metadata = this.resolver.getNonNormalizedDirectiveMetadata(directive.reference).metadata;
                                if (metadata.isComponent && metadata.template && metadata.template.templateUrl) {
                                    var templateName = urlResolver.resolve(this.reflector.componentModuleUrl(directive.reference), metadata.template.templateUrl);
                                    fileToComponent.set(templateName, directive.reference);
                                    templateReference.push(templateName);
                                }
                            }
                        }
                        catch (e_3_1) { e_3 = { error: e_3_1 }; }
                        finally {
                            try {
                                if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                            }
                            finally { if (e_3) throw e_3.error; }
                        }
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
                this.fileToComponent = fileToComponent;
                this.templateReferences = templateReference;
            }
        };
        TypeScriptServiceHost.prototype.getSourceFromDeclaration = function (fileName, version, source, span, type, declaration, node, sourceFile) {
            var queryCache = undefined;
            var t = this;
            if (declaration) {
                return {
                    version: version,
                    source: source,
                    span: span,
                    type: type,
                    get members() {
                        return language_services_1.getClassMembersFromDeclaration(t.program, t.checker, sourceFile, declaration);
                    },
                    get query() {
                        if (!queryCache) {
                            var pipes_1 = t.service.getPipesAt(fileName, node.getStart());
                            queryCache = language_services_1.getSymbolQuery(t.program, t.checker, sourceFile, function () { return language_services_1.getPipesTable(sourceFile, t.program, t.checker, pipes_1); });
                        }
                        return queryCache;
                    }
                };
            }
        };
        TypeScriptServiceHost.prototype.getSourceFromNode = function (fileName, version, node) {
            var result = undefined;
            var t = this;
            switch (node.kind) {
                case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
                case ts.SyntaxKind.StringLiteral:
                    var _a = tslib_1.__read(this.getTemplateClassDeclFromNode(node), 2), declaration = _a[0], decorator = _a[1];
                    if (declaration && declaration.name) {
                        var sourceFile = this.getSourceFile(fileName);
                        if (sourceFile) {
                            return this.getSourceFromDeclaration(fileName, version, this.stringOf(node) || '', shrink(spanOf(node)), this.reflector.getStaticSymbol(sourceFile.fileName, declaration.name.text), declaration, node, sourceFile);
                        }
                    }
                    break;
            }
            return result;
        };
        TypeScriptServiceHost.prototype.getSourceFromType = function (fileName, version, type) {
            var result = undefined;
            var declaration = this.getTemplateClassFromStaticSymbol(type);
            if (declaration) {
                var snapshot = this.host.getScriptSnapshot(fileName);
                if (snapshot) {
                    var source = snapshot.getText(0, snapshot.getLength());
                    result = this.getSourceFromDeclaration(fileName, version, source, { start: 0, end: source.length }, type, declaration, declaration, declaration.getSourceFile());
                }
            }
            return result;
        };
        Object.defineProperty(TypeScriptServiceHost.prototype, "reflectorHost", {
            get: function () {
                var _this = this;
                var result = this._reflectorHost;
                if (!result) {
                    if (!this.context) {
                        // Make up a context by finding the first script and using that as the base dir.
                        var scriptFileNames = this.host.getScriptFileNames();
                        if (0 === scriptFileNames.length) {
                            throw new Error('Internal error: no script file names found');
                        }
                        this.context = scriptFileNames[0];
                    }
                    // Use the file context's directory as the base directory.
                    // The host's getCurrentDirectory() is not reliable as it is always "" in
                    // tsserver. We don't need the exact base directory, just one that contains
                    // a source file.
                    var source = this.tsService.getProgram().getSourceFile(this.context);
                    if (!source) {
                        throw new Error('Internal error: no context could be determined');
                    }
                    var tsConfigPath = findTsConfig(source.fileName);
                    var basePath = path.dirname(tsConfigPath || this.context);
                    var options = { basePath: basePath, genDir: basePath };
                    var compilerOptions = this.host.getCompilationSettings();
                    if (compilerOptions && compilerOptions.baseUrl) {
                        options.baseUrl = compilerOptions.baseUrl;
                    }
                    if (compilerOptions && compilerOptions.paths) {
                        options.paths = compilerOptions.paths;
                    }
                    result = this._reflectorHost =
                        new reflector_host_1.ReflectorHost(function () { return _this.tsService.getProgram(); }, this.host, options);
                }
                return result;
            },
            enumerable: true,
            configurable: true
        });
        TypeScriptServiceHost.prototype.collectError = function (error, filePath) {
            if (filePath) {
                var errorMap = this.collectedErrors;
                if (!errorMap || !this.collectedErrors) {
                    errorMap = this.collectedErrors = new Map();
                }
                var errors = errorMap.get(filePath);
                if (!errors) {
                    errors = [];
                    this.collectedErrors.set(filePath, errors);
                }
                errors.push(error);
            }
        };
        Object.defineProperty(TypeScriptServiceHost.prototype, "staticSymbolResolver", {
            get: function () {
                var _this = this;
                var result = this._staticSymbolResolver;
                if (!result) {
                    this._summaryResolver = new compiler_1.AotSummaryResolver({
                        loadSummary: function (filePath) { return null; },
                        isSourceFile: function (sourceFilePath) { return true; },
                        toSummaryFileName: function (sourceFilePath) { return sourceFilePath; },
                        fromSummaryFileName: function (filePath) { return filePath; },
                    }, this._staticSymbolCache);
                    result = this._staticSymbolResolver = new compiler_1.StaticSymbolResolver(this.reflectorHost, this._staticSymbolCache, this._summaryResolver, function (e, filePath) { return _this.collectError(e, filePath); });
                }
                return result;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TypeScriptServiceHost.prototype, "reflector", {
            get: function () {
                var _this = this;
                var result = this._reflector;
                if (!result) {
                    var ssr = this.staticSymbolResolver;
                    result = this._reflector = new compiler_1.StaticReflector(this._summaryResolver, ssr, [], [], function (e, filePath) { return _this.collectError(e, filePath); });
                }
                return result;
            },
            enumerable: true,
            configurable: true
        });
        TypeScriptServiceHost.prototype.getTemplateClassFromStaticSymbol = function (type) {
            var source = this.getSourceFile(type.filePath);
            if (source) {
                var declarationNode = ts.forEachChild(source, function (child) {
                    if (child.kind === ts.SyntaxKind.ClassDeclaration) {
                        var classDeclaration = child;
                        if (classDeclaration.name != null && classDeclaration.name.text === type.name) {
                            return classDeclaration;
                        }
                    }
                });
                return declarationNode;
            }
            return undefined;
        };
        /**
         * Given a template string node, see if it is an Angular template string, and if so return the
         * containing class.
         */
        TypeScriptServiceHost.prototype.getTemplateClassDeclFromNode = function (currentToken) {
            // Verify we are in a 'template' property assignment, in an object literal, which is an call
            // arg, in a decorator
            var parentNode = currentToken.parent; // PropertyAssignment
            if (!parentNode) {
                return TypeScriptServiceHost.missingTemplate;
            }
            if (parentNode.kind !== ts.SyntaxKind.PropertyAssignment) {
                return TypeScriptServiceHost.missingTemplate;
            }
            else {
                // TODO: Is this different for a literal, i.e. a quoted property name like "template"?
                if (parentNode.name.text !== 'template') {
                    return TypeScriptServiceHost.missingTemplate;
                }
            }
            parentNode = parentNode.parent; // ObjectLiteralExpression
            if (!parentNode || parentNode.kind !== ts.SyntaxKind.ObjectLiteralExpression) {
                return TypeScriptServiceHost.missingTemplate;
            }
            parentNode = parentNode.parent; // CallExpression
            if (!parentNode || parentNode.kind !== ts.SyntaxKind.CallExpression) {
                return TypeScriptServiceHost.missingTemplate;
            }
            var callTarget = parentNode.expression;
            var decorator = parentNode.parent; // Decorator
            if (!decorator || decorator.kind !== ts.SyntaxKind.Decorator) {
                return TypeScriptServiceHost.missingTemplate;
            }
            var declaration = decorator.parent; // ClassDeclaration
            if (!declaration || declaration.kind !== ts.SyntaxKind.ClassDeclaration) {
                return TypeScriptServiceHost.missingTemplate;
            }
            return [declaration, callTarget];
        };
        TypeScriptServiceHost.prototype.getCollectedErrors = function (defaultSpan, sourceFile) {
            var errors = (this.collectedErrors && this.collectedErrors.get(sourceFile.fileName));
            return (errors && errors.map(function (e) {
                var line = e.line || (e.position && e.position.line);
                var column = e.column || (e.position && e.position.column);
                var span = spanAt(sourceFile, line, column) || defaultSpan;
                if (compiler_1.isFormattedError(e)) {
                    return errorToDiagnosticWithChain(e, span);
                }
                return { message: e.message, span: span };
            })) ||
                [];
        };
        TypeScriptServiceHost.prototype.getDeclarationFromNode = function (sourceFile, node) {
            var e_4, _a;
            if (node.kind == ts.SyntaxKind.ClassDeclaration && node.decorators &&
                node.name) {
                try {
                    for (var _b = tslib_1.__values(node.decorators), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var decorator = _c.value;
                        if (decorator.expression && decorator.expression.kind == ts.SyntaxKind.CallExpression) {
                            var classDeclaration = node;
                            if (classDeclaration.name) {
                                var call = decorator.expression;
                                var target = call.expression;
                                var type = this.checker.getTypeAtLocation(target);
                                if (type) {
                                    var staticSymbol = this.reflector.getStaticSymbol(sourceFile.fileName, classDeclaration.name.text);
                                    try {
                                        if (this.resolver.isDirective(staticSymbol)) {
                                            var metadata = this.resolver.getNonNormalizedDirectiveMetadata(staticSymbol).metadata;
                                            var declarationSpan = spanOf(target);
                                            return {
                                                type: staticSymbol,
                                                declarationSpan: declarationSpan,
                                                metadata: metadata,
                                                errors: this.getCollectedErrors(declarationSpan, sourceFile)
                                            };
                                        }
                                    }
                                    catch (e) {
                                        if (e.message) {
                                            this.collectError(e, sourceFile.fileName);
                                            var declarationSpan = spanOf(target);
                                            return {
                                                type: staticSymbol,
                                                declarationSpan: declarationSpan,
                                                errors: this.getCollectedErrors(declarationSpan, sourceFile)
                                            };
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                catch (e_4_1) { e_4 = { error: e_4_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    }
                    finally { if (e_4) throw e_4.error; }
                }
            }
        };
        TypeScriptServiceHost.prototype.stringOf = function (node) {
            switch (node.kind) {
                case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
                    return node.text;
                case ts.SyntaxKind.StringLiteral:
                    return node.text;
            }
        };
        TypeScriptServiceHost.prototype.findNode = function (sourceFile, position) {
            function find(node) {
                if (position >= node.getStart() && position < node.getEnd()) {
                    return ts.forEachChild(node, find) || node;
                }
            }
            return find(sourceFile);
        };
        TypeScriptServiceHost.missingTemplate = [undefined, undefined];
        return TypeScriptServiceHost;
    }());
    exports.TypeScriptServiceHost = TypeScriptServiceHost;
    function findTsConfig(fileName) {
        var dir = path.dirname(fileName);
        while (fs.existsSync(dir)) {
            var candidate = path.join(dir, 'tsconfig.json');
            if (fs.existsSync(candidate))
                return candidate;
            var parentDir = path.dirname(dir);
            if (parentDir === dir)
                break;
            dir = parentDir;
        }
    }
    function spanOf(node) {
        return { start: node.getStart(), end: node.getEnd() };
    }
    function shrink(span, offset) {
        if (offset == null)
            offset = 1;
        return { start: span.start + offset, end: span.end - offset };
    }
    function spanAt(sourceFile, line, column) {
        if (line != null && column != null) {
            var position_1 = ts.getPositionOfLineAndCharacter(sourceFile, line, column);
            var findChild = function findChild(node) {
                if (node.kind > ts.SyntaxKind.LastToken && node.pos <= position_1 && node.end > position_1) {
                    var betterNode = ts.forEachChild(node, findChild);
                    return betterNode || node;
                }
            };
            var node = ts.forEachChild(sourceFile, findChild);
            if (node) {
                return { start: node.getStart(), end: node.getEnd() };
            }
        }
    }
    function chainedMessage(chain, indent) {
        if (indent === void 0) { indent = ''; }
        return indent + chain.message + (chain.next ? chainedMessage(chain.next, indent + '  ') : '');
    }
    var DiagnosticMessageChainImpl = /** @class */ (function () {
        function DiagnosticMessageChainImpl(message, next) {
            this.message = message;
            this.next = next;
        }
        DiagnosticMessageChainImpl.prototype.toString = function () { return chainedMessage(this); };
        return DiagnosticMessageChainImpl;
    }());
    function convertChain(chain) {
        return { message: chain.message, next: chain.next ? convertChain(chain.next) : undefined };
    }
    function errorToDiagnosticWithChain(error, span) {
        return { message: error.chain ? convertChain(error.chain) : error.message, span: span };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZXNjcmlwdF9ob3N0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvbGFuZ3VhZ2Utc2VydmljZS9zcmMvdHlwZXNjcmlwdF9ob3N0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILDhDQUE0Z0I7SUFDNWdCLGlGQUEySTtJQUMzSSxzQ0FBcUU7SUFDckUsdUJBQXlCO0lBQ3pCLDJCQUE2QjtJQUM3QiwrQkFBaUM7SUFFakMsbUZBQXlEO0lBQ3pELCtFQUErQztJQU0vQzs7T0FFRztJQUNILFNBQWdCLG1DQUFtQyxDQUMvQyxJQUE0QixFQUFFLE9BQTJCO1FBQzNELElBQU0sTUFBTSxHQUFHLElBQUkscUJBQXFCLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3hELElBQU0sUUFBUSxHQUFHLHdDQUFxQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQy9DLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDekIsT0FBTyxRQUFRLENBQUM7SUFDbEIsQ0FBQztJQU5ELGtGQU1DO0lBRUQ7Ozs7O09BS0c7SUFDSDtRQUFxQywyQ0FBVTtRQUEvQzs7UUFNQSxDQUFDO1FBTEMsK0JBQUssR0FBTCxVQUNJLE1BQWMsRUFBRSxHQUFXLEVBQUUsbUJBQW9DLEVBQ2pFLG1CQUF1RTtZQUQxQyxvQ0FBQSxFQUFBLDJCQUFvQztZQUNqRSxvQ0FBQSxFQUFBLHNCQUEyQyx1Q0FBNEI7WUFDekUsT0FBTyxJQUFJLDBCQUFlLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3JDLENBQUM7UUFDSCxzQkFBQztJQUFELENBQUMsQUFORCxDQUFxQyxxQkFBVSxHQU05QztJQU5ZLDBDQUFlO0lBUTVCOztPQUVHO0lBQ0g7UUFBeUMsK0NBQWM7UUFBdkQ7O1FBRUEsQ0FBQztRQURDLGlDQUFHLEdBQUgsVUFBSSxHQUFXLElBQXFC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LENBQUMsS0FBNkIsRUFBRSxNQUFXO1FBQVgsdUJBQUEsRUFBQSxXQUFXO1FBQ2hFLE9BQU8sTUFBTSxHQUFHLEtBQUssQ0FBQyxPQUFPLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxNQUFNLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ2hHLENBQUM7SUFFRDtRQUNFLG9DQUFtQixPQUFlLEVBQVMsSUFBNkI7WUFBckQsWUFBTyxHQUFQLE9BQU8sQ0FBUTtZQUFTLFNBQUksR0FBSixJQUFJLENBQXlCO1FBQUcsQ0FBQztRQUM1RSw2Q0FBUSxHQUFSLGNBQXFCLE9BQU8sY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNyRCxpQ0FBQztJQUFELENBQUMsQUFIRCxJQUdDO0lBRUQsU0FBUyxZQUFZLENBQUMsS0FBNEI7UUFDaEQsT0FBTyxFQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUMsQ0FBQztJQUMzRixDQUFDO0lBRUQsU0FBUywwQkFBMEIsQ0FBQyxLQUFxQixFQUFFLElBQVU7UUFDbkUsT0FBTyxFQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLElBQUksTUFBQSxFQUFDLENBQUM7SUFDbEYsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBb3RTdW1tYXJ5UmVzb2x2ZXIsIENvbXBpbGVNZXRhZGF0YVJlc29sdmVyLCBDb21waWxlckNvbmZpZywgREVGQVVMVF9JTlRFUlBPTEFUSU9OX0NPTkZJRywgRGlyZWN0aXZlTm9ybWFsaXplciwgRGlyZWN0aXZlUmVzb2x2ZXIsIERvbUVsZW1lbnRTY2hlbWFSZWdpc3RyeSwgRm9ybWF0dGVkRXJyb3IsIEZvcm1hdHRlZE1lc3NhZ2VDaGFpbiwgSHRtbFBhcnNlciwgSW50ZXJwb2xhdGlvbkNvbmZpZywgSml0U3VtbWFyeVJlc29sdmVyLCBOZ0FuYWx5emVkTW9kdWxlcywgTmdNb2R1bGVSZXNvbHZlciwgUGFyc2VUcmVlUmVzdWx0LCBQaXBlUmVzb2x2ZXIsIFJlc291cmNlTG9hZGVyLCBTdGF0aWNSZWZsZWN0b3IsIFN0YXRpY1N5bWJvbCwgU3RhdGljU3ltYm9sQ2FjaGUsIFN0YXRpY1N5bWJvbFJlc29sdmVyLCBTdW1tYXJ5UmVzb2x2ZXIsIGFuYWx5emVOZ01vZHVsZXMsIGNyZWF0ZU9mZmxpbmVDb21waWxlVXJsUmVzb2x2ZXIsIGlzRm9ybWF0dGVkRXJyb3J9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcbmltcG9ydCB7Q29tcGlsZXJPcHRpb25zLCBnZXRDbGFzc01lbWJlcnNGcm9tRGVjbGFyYXRpb24sIGdldFBpcGVzVGFibGUsIGdldFN5bWJvbFF1ZXJ5fSBmcm9tICdAYW5ndWxhci9jb21waWxlci1jbGkvc3JjL2xhbmd1YWdlX3NlcnZpY2VzJztcbmltcG9ydCB7Vmlld0VuY2Fwc3VsYXRpb24sIMm1Q29uc29sZSBhcyBDb25zb2xlfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtjcmVhdGVMYW5ndWFnZVNlcnZpY2V9IGZyb20gJy4vbGFuZ3VhZ2Vfc2VydmljZSc7XG5pbXBvcnQge1JlZmxlY3Rvckhvc3R9IGZyb20gJy4vcmVmbGVjdG9yX2hvc3QnO1xuaW1wb3J0IHtCdWlsdGluVHlwZSwgRGVjbGFyYXRpb24sIERlY2xhcmF0aW9uRXJyb3IsIERlY2xhcmF0aW9uS2luZCwgRGVjbGFyYXRpb25zLCBEZWZpbml0aW9uLCBEaWFnbm9zdGljTWVzc2FnZUNoYWluLCBMYW5ndWFnZVNlcnZpY2UsIExhbmd1YWdlU2VydmljZUhvc3QsIFBpcGVJbmZvLCBQaXBlcywgU2lnbmF0dXJlLCBTcGFuLCBTeW1ib2wsIFN5bWJvbERlY2xhcmF0aW9uLCBTeW1ib2xRdWVyeSwgU3ltYm9sVGFibGUsIFRlbXBsYXRlU291cmNlLCBUZW1wbGF0ZVNvdXJjZXN9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHtpc1R5cGVzY3JpcHRWZXJzaW9ufSBmcm9tICcuL3V0aWxzJztcblxuXG5cbi8qKlxuICogQ3JlYXRlIGEgYExhbmd1YWdlU2VydmljZUhvc3RgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMYW5ndWFnZVNlcnZpY2VGcm9tVHlwZXNjcmlwdChcbiAgICBob3N0OiB0cy5MYW5ndWFnZVNlcnZpY2VIb3N0LCBzZXJ2aWNlOiB0cy5MYW5ndWFnZVNlcnZpY2UpOiBMYW5ndWFnZVNlcnZpY2Uge1xuICBjb25zdCBuZ0hvc3QgPSBuZXcgVHlwZVNjcmlwdFNlcnZpY2VIb3N0KGhvc3QsIHNlcnZpY2UpO1xuICBjb25zdCBuZ1NlcnZlciA9IGNyZWF0ZUxhbmd1YWdlU2VydmljZShuZ0hvc3QpO1xuICBuZ0hvc3Quc2V0U2l0ZShuZ1NlcnZlcik7XG4gIHJldHVybiBuZ1NlcnZlcjtcbn1cblxuLyoqXG4gKiBUaGUgbGFuZ3VhZ2Ugc2VydmljZSBuZXZlciBuZWVkcyB0aGUgbm9ybWFsaXplZCB2ZXJzaW9ucyBvZiB0aGUgbWV0YWRhdGEuIFRvIGF2b2lkIHBhcnNpbmdcbiAqIHRoZSBjb250ZW50IGFuZCByZXNvbHZpbmcgcmVmZXJlbmNlcywgcmV0dXJuIGFuIGVtcHR5IGZpbGUuIFRoaXMgYWxzbyBhbGxvd3Mgbm9ybWFsaXppbmdcbiAqIHRlbXBsYXRlIHRoYXQgYXJlIHN5bnRhdGljYWxseSBpbmNvcnJlY3Qgd2hpY2ggaXMgcmVxdWlyZWQgdG8gcHJvdmlkZSBjb21wbGV0aW9ucyBpblxuICogc3ludGFjdGljYWxseSBpbmNvcnJlY3QgdGVtcGxhdGVzLlxuICovXG5leHBvcnQgY2xhc3MgRHVtbXlIdG1sUGFyc2VyIGV4dGVuZHMgSHRtbFBhcnNlciB7XG4gIHBhcnNlKFxuICAgICAgc291cmNlOiBzdHJpbmcsIHVybDogc3RyaW5nLCBwYXJzZUV4cGFuc2lvbkZvcm1zOiBib29sZWFuID0gZmFsc2UsXG4gICAgICBpbnRlcnBvbGF0aW9uQ29uZmlnOiBJbnRlcnBvbGF0aW9uQ29uZmlnID0gREVGQVVMVF9JTlRFUlBPTEFUSU9OX0NPTkZJRyk6IFBhcnNlVHJlZVJlc3VsdCB7XG4gICAgcmV0dXJuIG5ldyBQYXJzZVRyZWVSZXN1bHQoW10sIFtdKTtcbiAgfVxufVxuXG4vKipcbiAqIEF2b2lkIGxvYWRpbmcgcmVzb3VyY2VzIGluIHRoZSBsYW5ndWFnZSBzZXJ2Y2llIGJ5IHVzaW5nIGEgZHVtbXkgbG9hZGVyLlxuICovXG5leHBvcnQgY2xhc3MgRHVtbXlSZXNvdXJjZUxvYWRlciBleHRlbmRzIFJlc291cmNlTG9hZGVyIHtcbiAgZ2V0KHVybDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHsgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgnJyk7IH1cbn1cblxuLyoqXG4gKiBBbiBpbXBsZW1lbnRhdGlvbiBvZiBhIGBMYW5ndWFnZVNlcnZpY2VIb3N0YCBmb3IgYSBUeXBlU2NyaXB0IHByb2plY3QuXG4gKlxuICogVGhlIGBUeXBlU2NyaXB0U2VydmljZUhvc3RgIGltcGxlbWVudHMgdGhlIEFuZ3VsYXIgYExhbmd1YWdlU2VydmljZUhvc3RgIHVzaW5nXG4gKiB0aGUgVHlwZVNjcmlwdCBsYW5ndWFnZSBzZXJ2aWNlcy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBUeXBlU2NyaXB0U2VydmljZUhvc3QgaW1wbGVtZW50cyBMYW5ndWFnZVNlcnZpY2VIb3N0IHtcbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIHByaXZhdGUgX3Jlc29sdmVyICE6IENvbXBpbGVNZXRhZGF0YVJlc29sdmVyIHwgbnVsbDtcbiAgcHJpdmF0ZSBfc3RhdGljU3ltYm9sQ2FjaGUgPSBuZXcgU3RhdGljU3ltYm9sQ2FjaGUoKTtcbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIHByaXZhdGUgX3N1bW1hcnlSZXNvbHZlciAhOiBBb3RTdW1tYXJ5UmVzb2x2ZXI7XG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBwcml2YXRlIF9zdGF0aWNTeW1ib2xSZXNvbHZlciAhOiBTdGF0aWNTeW1ib2xSZXNvbHZlcjtcbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIHByaXZhdGUgX3JlZmxlY3RvciAhOiBTdGF0aWNSZWZsZWN0b3IgfCBudWxsO1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgcHJpdmF0ZSBfcmVmbGVjdG9ySG9zdCAhOiBSZWZsZWN0b3JIb3N0O1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgcHJpdmF0ZSBfY2hlY2tlciAhOiB0cy5UeXBlQ2hlY2tlciB8IG51bGw7XG4gIHByaXZhdGUgX3R5cGVDYWNoZTogU3ltYm9sW10gPSBbXTtcbiAgcHJpdmF0ZSBjb250ZXh0OiBzdHJpbmd8dW5kZWZpbmVkO1xuICBwcml2YXRlIGxhc3RQcm9ncmFtOiB0cy5Qcm9ncmFtfHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSBtb2R1bGVzT3V0T2ZEYXRlOiBib29sZWFuID0gdHJ1ZTtcbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIHByaXZhdGUgYW5hbHl6ZWRNb2R1bGVzICE6IE5nQW5hbHl6ZWRNb2R1bGVzIHwgbnVsbDtcbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIHByaXZhdGUgc2VydmljZSAhOiBMYW5ndWFnZVNlcnZpY2U7XG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBwcml2YXRlIGZpbGVUb0NvbXBvbmVudCAhOiBNYXA8c3RyaW5nLCBTdGF0aWNTeW1ib2w+fCBudWxsO1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgcHJpdmF0ZSB0ZW1wbGF0ZVJlZmVyZW5jZXMgITogc3RyaW5nW10gfCBudWxsO1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgcHJpdmF0ZSBjb2xsZWN0ZWRFcnJvcnMgITogTWFwPHN0cmluZywgYW55W10+fCBudWxsO1xuICBwcml2YXRlIGZpbGVWZXJzaW9ucyA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCk7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBob3N0OiB0cy5MYW5ndWFnZVNlcnZpY2VIb3N0LCBwcml2YXRlIHRzU2VydmljZTogdHMuTGFuZ3VhZ2VTZXJ2aWNlKSB7fVxuXG4gIHNldFNpdGUoc2VydmljZTogTGFuZ3VhZ2VTZXJ2aWNlKSB7IHRoaXMuc2VydmljZSA9IHNlcnZpY2U7IH1cblxuICAvKipcbiAgICogQW5ndWxhciBMYW5ndWFnZVNlcnZpY2VIb3N0IGltcGxlbWVudGF0aW9uXG4gICAqL1xuICBnZXQgcmVzb2x2ZXIoKTogQ29tcGlsZU1ldGFkYXRhUmVzb2x2ZXIge1xuICAgIHRoaXMudmFsaWRhdGUoKTtcbiAgICBsZXQgcmVzdWx0ID0gdGhpcy5fcmVzb2x2ZXI7XG4gICAgaWYgKCFyZXN1bHQpIHtcbiAgICAgIGNvbnN0IG1vZHVsZVJlc29sdmVyID0gbmV3IE5nTW9kdWxlUmVzb2x2ZXIodGhpcy5yZWZsZWN0b3IpO1xuICAgICAgY29uc3QgZGlyZWN0aXZlUmVzb2x2ZXIgPSBuZXcgRGlyZWN0aXZlUmVzb2x2ZXIodGhpcy5yZWZsZWN0b3IpO1xuICAgICAgY29uc3QgcGlwZVJlc29sdmVyID0gbmV3IFBpcGVSZXNvbHZlcih0aGlzLnJlZmxlY3Rvcik7XG4gICAgICBjb25zdCBlbGVtZW50U2NoZW1hUmVnaXN0cnkgPSBuZXcgRG9tRWxlbWVudFNjaGVtYVJlZ2lzdHJ5KCk7XG4gICAgICBjb25zdCByZXNvdXJjZUxvYWRlciA9IG5ldyBEdW1teVJlc291cmNlTG9hZGVyKCk7XG4gICAgICBjb25zdCB1cmxSZXNvbHZlciA9IGNyZWF0ZU9mZmxpbmVDb21waWxlVXJsUmVzb2x2ZXIoKTtcbiAgICAgIGNvbnN0IGh0bWxQYXJzZXIgPSBuZXcgRHVtbXlIdG1sUGFyc2VyKCk7XG4gICAgICAvLyBUaGlzIHRyYWNrcyB0aGUgQ29tcGlsZUNvbmZpZyBpbiBjb2RlZ2VuLnRzLiBDdXJyZW50bHkgdGhlc2Ugb3B0aW9uc1xuICAgICAgLy8gYXJlIGhhcmQtY29kZWQuXG4gICAgICBjb25zdCBjb25maWcgPVxuICAgICAgICAgIG5ldyBDb21waWxlckNvbmZpZyh7ZGVmYXVsdEVuY2Fwc3VsYXRpb246IFZpZXdFbmNhcHN1bGF0aW9uLkVtdWxhdGVkLCB1c2VKaXQ6IGZhbHNlfSk7XG4gICAgICBjb25zdCBkaXJlY3RpdmVOb3JtYWxpemVyID1cbiAgICAgICAgICBuZXcgRGlyZWN0aXZlTm9ybWFsaXplcihyZXNvdXJjZUxvYWRlciwgdXJsUmVzb2x2ZXIsIGh0bWxQYXJzZXIsIGNvbmZpZyk7XG5cbiAgICAgIHJlc3VsdCA9IHRoaXMuX3Jlc29sdmVyID0gbmV3IENvbXBpbGVNZXRhZGF0YVJlc29sdmVyKFxuICAgICAgICAgIGNvbmZpZywgaHRtbFBhcnNlciwgbW9kdWxlUmVzb2x2ZXIsIGRpcmVjdGl2ZVJlc29sdmVyLCBwaXBlUmVzb2x2ZXIsXG4gICAgICAgICAgbmV3IEppdFN1bW1hcnlSZXNvbHZlcigpLCBlbGVtZW50U2NoZW1hUmVnaXN0cnksIGRpcmVjdGl2ZU5vcm1hbGl6ZXIsIG5ldyBDb25zb2xlKCksXG4gICAgICAgICAgdGhpcy5fc3RhdGljU3ltYm9sQ2FjaGUsIHRoaXMucmVmbGVjdG9yLFxuICAgICAgICAgIChlcnJvciwgdHlwZSkgPT4gdGhpcy5jb2xsZWN0RXJyb3IoZXJyb3IsIHR5cGUgJiYgdHlwZS5maWxlUGF0aCkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgZ2V0VGVtcGxhdGVSZWZlcmVuY2VzKCk6IHN0cmluZ1tdIHtcbiAgICB0aGlzLmVuc3VyZVRlbXBsYXRlTWFwKCk7XG4gICAgcmV0dXJuIHRoaXMudGVtcGxhdGVSZWZlcmVuY2VzIHx8IFtdO1xuICB9XG5cbiAgZ2V0VGVtcGxhdGVBdChmaWxlTmFtZTogc3RyaW5nLCBwb3NpdGlvbjogbnVtYmVyKTogVGVtcGxhdGVTb3VyY2V8dW5kZWZpbmVkIHtcbiAgICBsZXQgc291cmNlRmlsZSA9IHRoaXMuZ2V0U291cmNlRmlsZShmaWxlTmFtZSk7XG4gICAgaWYgKHNvdXJjZUZpbGUpIHtcbiAgICAgIHRoaXMuY29udGV4dCA9IHNvdXJjZUZpbGUuZmlsZU5hbWU7XG4gICAgICBsZXQgbm9kZSA9IHRoaXMuZmluZE5vZGUoc291cmNlRmlsZSwgcG9zaXRpb24pO1xuICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0U291cmNlRnJvbU5vZGUoXG4gICAgICAgICAgICBmaWxlTmFtZSwgdGhpcy5ob3N0LmdldFNjcmlwdFZlcnNpb24oc291cmNlRmlsZS5maWxlTmFtZSksIG5vZGUpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVuc3VyZVRlbXBsYXRlTWFwKCk7XG4gICAgICAvLyBUT0RPOiBDYW5ub2NhbGl6ZSB0aGUgZmlsZT9cbiAgICAgIGNvbnN0IGNvbXBvbmVudFR5cGUgPSB0aGlzLmZpbGVUb0NvbXBvbmVudCAhLmdldChmaWxlTmFtZSk7XG4gICAgICBpZiAoY29tcG9uZW50VHlwZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRTb3VyY2VGcm9tVHlwZShcbiAgICAgICAgICAgIGZpbGVOYW1lLCB0aGlzLmhvc3QuZ2V0U2NyaXB0VmVyc2lvbihmaWxlTmFtZSksIGNvbXBvbmVudFR5cGUpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgZ2V0QW5hbHl6ZWRNb2R1bGVzKCk6IE5nQW5hbHl6ZWRNb2R1bGVzIHtcbiAgICB0aGlzLnVwZGF0ZUFuYWx5emVkTW9kdWxlcygpO1xuICAgIHJldHVybiB0aGlzLmVuc3VyZUFuYWx5emVkTW9kdWxlcygpO1xuICB9XG5cbiAgcHJpdmF0ZSBlbnN1cmVBbmFseXplZE1vZHVsZXMoKTogTmdBbmFseXplZE1vZHVsZXMge1xuICAgIGxldCBhbmFseXplZE1vZHVsZXMgPSB0aGlzLmFuYWx5emVkTW9kdWxlcztcbiAgICBpZiAoIWFuYWx5emVkTW9kdWxlcykge1xuICAgICAgaWYgKHRoaXMuaG9zdC5nZXRTY3JpcHRGaWxlTmFtZXMoKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgYW5hbHl6ZWRNb2R1bGVzID0ge1xuICAgICAgICAgIGZpbGVzOiBbXSxcbiAgICAgICAgICBuZ01vZHVsZUJ5UGlwZU9yRGlyZWN0aXZlOiBuZXcgTWFwKCksXG4gICAgICAgICAgbmdNb2R1bGVzOiBbXSxcbiAgICAgICAgfTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGFuYWx5emVIb3N0ID0ge2lzU291cmNlRmlsZShmaWxlUGF0aDogc3RyaW5nKSB7IHJldHVybiB0cnVlOyB9fTtcbiAgICAgICAgY29uc3QgcHJvZ3JhbUZpbGVzID0gdGhpcy5wcm9ncmFtICEuZ2V0U291cmNlRmlsZXMoKS5tYXAoc2YgPT4gc2YuZmlsZU5hbWUpO1xuICAgICAgICBhbmFseXplZE1vZHVsZXMgPVxuICAgICAgICAgICAgYW5hbHl6ZU5nTW9kdWxlcyhwcm9ncmFtRmlsZXMsIGFuYWx5emVIb3N0LCB0aGlzLnN0YXRpY1N5bWJvbFJlc29sdmVyLCB0aGlzLnJlc29sdmVyKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuYW5hbHl6ZWRNb2R1bGVzID0gYW5hbHl6ZWRNb2R1bGVzO1xuICAgIH1cbiAgICByZXR1cm4gYW5hbHl6ZWRNb2R1bGVzO1xuICB9XG5cbiAgZ2V0VGVtcGxhdGVzKGZpbGVOYW1lOiBzdHJpbmcpOiBUZW1wbGF0ZVNvdXJjZXMge1xuICAgIHRoaXMuZW5zdXJlVGVtcGxhdGVNYXAoKTtcbiAgICBjb25zdCBjb21wb25lbnRUeXBlID0gdGhpcy5maWxlVG9Db21wb25lbnQgIS5nZXQoZmlsZU5hbWUpO1xuICAgIGlmIChjb21wb25lbnRUeXBlKSB7XG4gICAgICBjb25zdCB0ZW1wbGF0ZVNvdXJjZSA9IHRoaXMuZ2V0VGVtcGxhdGVBdChmaWxlTmFtZSwgMCk7XG4gICAgICBpZiAodGVtcGxhdGVTb3VyY2UpIHtcbiAgICAgICAgcmV0dXJuIFt0ZW1wbGF0ZVNvdXJjZV07XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCB2ZXJzaW9uID0gdGhpcy5ob3N0LmdldFNjcmlwdFZlcnNpb24oZmlsZU5hbWUpO1xuICAgICAgbGV0IHJlc3VsdDogVGVtcGxhdGVTb3VyY2VbXSA9IFtdO1xuXG4gICAgICAvLyBGaW5kIGVhY2ggdGVtcGxhdGUgc3RyaW5nIGluIHRoZSBmaWxlXG4gICAgICBsZXQgdmlzaXQgPSAoY2hpbGQ6IHRzLk5vZGUpID0+IHtcbiAgICAgICAgbGV0IHRlbXBsYXRlU291cmNlID0gdGhpcy5nZXRTb3VyY2VGcm9tTm9kZShmaWxlTmFtZSwgdmVyc2lvbiwgY2hpbGQpO1xuICAgICAgICBpZiAodGVtcGxhdGVTb3VyY2UpIHtcbiAgICAgICAgICByZXN1bHQucHVzaCh0ZW1wbGF0ZVNvdXJjZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdHMuZm9yRWFjaENoaWxkKGNoaWxkLCB2aXNpdCk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGxldCBzb3VyY2VGaWxlID0gdGhpcy5nZXRTb3VyY2VGaWxlKGZpbGVOYW1lKTtcbiAgICAgIGlmIChzb3VyY2VGaWxlKSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IChzb3VyY2VGaWxlIGFzIGFueSkucGF0aCB8fCBzb3VyY2VGaWxlLmZpbGVOYW1lO1xuICAgICAgICB0cy5mb3JFYWNoQ2hpbGQoc291cmNlRmlsZSwgdmlzaXQpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdC5sZW5ndGggPyByZXN1bHQgOiB1bmRlZmluZWQ7XG4gICAgfVxuICB9XG5cbiAgZ2V0RGVjbGFyYXRpb25zKGZpbGVOYW1lOiBzdHJpbmcpOiBEZWNsYXJhdGlvbnMge1xuICAgIGNvbnN0IHJlc3VsdDogRGVjbGFyYXRpb25zID0gW107XG4gICAgY29uc3Qgc291cmNlRmlsZSA9IHRoaXMuZ2V0U291cmNlRmlsZShmaWxlTmFtZSk7XG4gICAgaWYgKHNvdXJjZUZpbGUpIHtcbiAgICAgIGxldCB2aXNpdCA9IChjaGlsZDogdHMuTm9kZSkgPT4ge1xuICAgICAgICBsZXQgZGVjbGFyYXRpb24gPSB0aGlzLmdldERlY2xhcmF0aW9uRnJvbU5vZGUoc291cmNlRmlsZSwgY2hpbGQpO1xuICAgICAgICBpZiAoZGVjbGFyYXRpb24pIHtcbiAgICAgICAgICByZXN1bHQucHVzaChkZWNsYXJhdGlvbik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdHMuZm9yRWFjaENoaWxkKGNoaWxkLCB2aXNpdCk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICB0cy5mb3JFYWNoQ2hpbGQoc291cmNlRmlsZSwgdmlzaXQpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgZ2V0U291cmNlRmlsZShmaWxlTmFtZTogc3RyaW5nKTogdHMuU291cmNlRmlsZXx1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLnRzU2VydmljZS5nZXRQcm9ncmFtKCkgIS5nZXRTb3VyY2VGaWxlKGZpbGVOYW1lKTtcbiAgfVxuXG4gIHVwZGF0ZUFuYWx5emVkTW9kdWxlcygpIHtcbiAgICB0aGlzLnZhbGlkYXRlKCk7XG4gICAgaWYgKHRoaXMubW9kdWxlc091dE9mRGF0ZSkge1xuICAgICAgdGhpcy5hbmFseXplZE1vZHVsZXMgPSBudWxsO1xuICAgICAgdGhpcy5fcmVmbGVjdG9yID0gbnVsbDtcbiAgICAgIHRoaXMudGVtcGxhdGVSZWZlcmVuY2VzID0gbnVsbDtcbiAgICAgIHRoaXMuZmlsZVRvQ29tcG9uZW50ID0gbnVsbDtcbiAgICAgIHRoaXMuZW5zdXJlQW5hbHl6ZWRNb2R1bGVzKCk7XG4gICAgICB0aGlzLm1vZHVsZXNPdXRPZkRhdGUgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldCBwcm9ncmFtKCkgeyByZXR1cm4gdGhpcy50c1NlcnZpY2UuZ2V0UHJvZ3JhbSgpOyB9XG5cbiAgcHJpdmF0ZSBnZXQgY2hlY2tlcigpIHtcbiAgICBsZXQgY2hlY2tlciA9IHRoaXMuX2NoZWNrZXI7XG4gICAgaWYgKCFjaGVja2VyKSB7XG4gICAgICBjaGVja2VyID0gdGhpcy5fY2hlY2tlciA9IHRoaXMucHJvZ3JhbSAhLmdldFR5cGVDaGVja2VyKCk7XG4gICAgfVxuICAgIHJldHVybiBjaGVja2VyO1xuICB9XG5cbiAgcHJpdmF0ZSB2YWxpZGF0ZSgpIHtcbiAgICBjb25zdCBwcm9ncmFtID0gdGhpcy5wcm9ncmFtO1xuICAgIGlmICh0aGlzLmxhc3RQcm9ncmFtICE9PSBwcm9ncmFtKSB7XG4gICAgICAvLyBJbnZhbGlkYXRlIGZpbGUgdGhhdCBoYXZlIGNoYW5nZWQgaW4gdGhlIHN0YXRpYyBzeW1ib2wgcmVzb2x2ZXJcbiAgICAgIGNvbnN0IGludmFsaWRhdGVGaWxlID0gKGZpbGVOYW1lOiBzdHJpbmcpID0+XG4gICAgICAgICAgdGhpcy5fc3RhdGljU3ltYm9sUmVzb2x2ZXIuaW52YWxpZGF0ZUZpbGUoZmlsZU5hbWUpO1xuICAgICAgdGhpcy5jbGVhckNhY2hlcygpO1xuICAgICAgY29uc3Qgc2VlbiA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgZm9yIChsZXQgc291cmNlRmlsZSBvZiB0aGlzLnByb2dyYW0gIS5nZXRTb3VyY2VGaWxlcygpKSB7XG4gICAgICAgIGNvbnN0IGZpbGVOYW1lID0gc291cmNlRmlsZS5maWxlTmFtZTtcbiAgICAgICAgc2Vlbi5hZGQoZmlsZU5hbWUpO1xuICAgICAgICBjb25zdCB2ZXJzaW9uID0gdGhpcy5ob3N0LmdldFNjcmlwdFZlcnNpb24oZmlsZU5hbWUpO1xuICAgICAgICBjb25zdCBsYXN0VmVyc2lvbiA9IHRoaXMuZmlsZVZlcnNpb25zLmdldChmaWxlTmFtZSk7XG4gICAgICAgIGlmICh2ZXJzaW9uICE9IGxhc3RWZXJzaW9uKSB7XG4gICAgICAgICAgdGhpcy5maWxlVmVyc2lvbnMuc2V0KGZpbGVOYW1lLCB2ZXJzaW9uKTtcbiAgICAgICAgICBpZiAodGhpcy5fc3RhdGljU3ltYm9sUmVzb2x2ZXIpIHtcbiAgICAgICAgICAgIGludmFsaWRhdGVGaWxlKGZpbGVOYW1lKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUmVtb3ZlIGZpbGUgdmVyc2lvbnMgdGhhdCBhcmUgbm8gbG9uZ2VyIGluIHRoZSBmaWxlIGFuZCBpbnZhbGlkYXRlIHRoZW0uXG4gICAgICBjb25zdCBtaXNzaW5nID0gQXJyYXkuZnJvbSh0aGlzLmZpbGVWZXJzaW9ucy5rZXlzKCkpLmZpbHRlcihmID0+ICFzZWVuLmhhcyhmKSk7XG4gICAgICBtaXNzaW5nLmZvckVhY2goZiA9PiB0aGlzLmZpbGVWZXJzaW9ucy5kZWxldGUoZikpO1xuICAgICAgaWYgKHRoaXMuX3N0YXRpY1N5bWJvbFJlc29sdmVyKSB7XG4gICAgICAgIG1pc3NpbmcuZm9yRWFjaChpbnZhbGlkYXRlRmlsZSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMubGFzdFByb2dyYW0gPSBwcm9ncmFtO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgY2xlYXJDYWNoZXMoKSB7XG4gICAgdGhpcy5fY2hlY2tlciA9IG51bGw7XG4gICAgdGhpcy5fdHlwZUNhY2hlID0gW107XG4gICAgdGhpcy5fcmVzb2x2ZXIgPSBudWxsO1xuICAgIHRoaXMuY29sbGVjdGVkRXJyb3JzID0gbnVsbDtcbiAgICB0aGlzLm1vZHVsZXNPdXRPZkRhdGUgPSB0cnVlO1xuICB9XG5cbiAgcHJpdmF0ZSBlbnN1cmVUZW1wbGF0ZU1hcCgpIHtcbiAgICBpZiAoIXRoaXMuZmlsZVRvQ29tcG9uZW50IHx8ICF0aGlzLnRlbXBsYXRlUmVmZXJlbmNlcykge1xuICAgICAgY29uc3QgZmlsZVRvQ29tcG9uZW50ID0gbmV3IE1hcDxzdHJpbmcsIFN0YXRpY1N5bWJvbD4oKTtcbiAgICAgIGNvbnN0IHRlbXBsYXRlUmVmZXJlbmNlOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgY29uc3QgbmdNb2R1bGVTdW1tYXJ5ID0gdGhpcy5nZXRBbmFseXplZE1vZHVsZXMoKTtcbiAgICAgIGNvbnN0IHVybFJlc29sdmVyID0gY3JlYXRlT2ZmbGluZUNvbXBpbGVVcmxSZXNvbHZlcigpO1xuICAgICAgZm9yIChjb25zdCBtb2R1bGUgb2YgbmdNb2R1bGVTdW1tYXJ5Lm5nTW9kdWxlcykge1xuICAgICAgICBmb3IgKGNvbnN0IGRpcmVjdGl2ZSBvZiBtb2R1bGUuZGVjbGFyZWREaXJlY3RpdmVzKSB7XG4gICAgICAgICAgY29uc3Qge21ldGFkYXRhfSA9IHRoaXMucmVzb2x2ZXIuZ2V0Tm9uTm9ybWFsaXplZERpcmVjdGl2ZU1ldGFkYXRhKGRpcmVjdGl2ZS5yZWZlcmVuY2UpICE7XG4gICAgICAgICAgaWYgKG1ldGFkYXRhLmlzQ29tcG9uZW50ICYmIG1ldGFkYXRhLnRlbXBsYXRlICYmIG1ldGFkYXRhLnRlbXBsYXRlLnRlbXBsYXRlVXJsKSB7XG4gICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZU5hbWUgPSB1cmxSZXNvbHZlci5yZXNvbHZlKFxuICAgICAgICAgICAgICAgIHRoaXMucmVmbGVjdG9yLmNvbXBvbmVudE1vZHVsZVVybChkaXJlY3RpdmUucmVmZXJlbmNlKSxcbiAgICAgICAgICAgICAgICBtZXRhZGF0YS50ZW1wbGF0ZS50ZW1wbGF0ZVVybCk7XG4gICAgICAgICAgICBmaWxlVG9Db21wb25lbnQuc2V0KHRlbXBsYXRlTmFtZSwgZGlyZWN0aXZlLnJlZmVyZW5jZSk7XG4gICAgICAgICAgICB0ZW1wbGF0ZVJlZmVyZW5jZS5wdXNoKHRlbXBsYXRlTmFtZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLmZpbGVUb0NvbXBvbmVudCA9IGZpbGVUb0NvbXBvbmVudDtcbiAgICAgIHRoaXMudGVtcGxhdGVSZWZlcmVuY2VzID0gdGVtcGxhdGVSZWZlcmVuY2U7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBnZXRTb3VyY2VGcm9tRGVjbGFyYXRpb24oXG4gICAgICBmaWxlTmFtZTogc3RyaW5nLCB2ZXJzaW9uOiBzdHJpbmcsIHNvdXJjZTogc3RyaW5nLCBzcGFuOiBTcGFuLCB0eXBlOiBTdGF0aWNTeW1ib2wsXG4gICAgICBkZWNsYXJhdGlvbjogdHMuQ2xhc3NEZWNsYXJhdGlvbiwgbm9kZTogdHMuTm9kZSwgc291cmNlRmlsZTogdHMuU291cmNlRmlsZSk6IFRlbXBsYXRlU291cmNlXG4gICAgICB8dW5kZWZpbmVkIHtcbiAgICBsZXQgcXVlcnlDYWNoZTogU3ltYm9sUXVlcnl8dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgIGNvbnN0IHQgPSB0aGlzO1xuICAgIGlmIChkZWNsYXJhdGlvbikge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdmVyc2lvbixcbiAgICAgICAgc291cmNlLFxuICAgICAgICBzcGFuLFxuICAgICAgICB0eXBlLFxuICAgICAgICBnZXQgbWVtYmVycygpIHtcbiAgICAgICAgICByZXR1cm4gZ2V0Q2xhc3NNZW1iZXJzRnJvbURlY2xhcmF0aW9uKHQucHJvZ3JhbSAhLCB0LmNoZWNrZXIsIHNvdXJjZUZpbGUsIGRlY2xhcmF0aW9uKTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0IHF1ZXJ5KCkge1xuICAgICAgICAgIGlmICghcXVlcnlDYWNoZSkge1xuICAgICAgICAgICAgY29uc3QgcGlwZXMgPSB0LnNlcnZpY2UuZ2V0UGlwZXNBdChmaWxlTmFtZSwgbm9kZS5nZXRTdGFydCgpKTtcbiAgICAgICAgICAgIHF1ZXJ5Q2FjaGUgPSBnZXRTeW1ib2xRdWVyeShcbiAgICAgICAgICAgICAgICB0LnByb2dyYW0gISwgdC5jaGVja2VyLCBzb3VyY2VGaWxlLFxuICAgICAgICAgICAgICAgICgpID0+IGdldFBpcGVzVGFibGUoc291cmNlRmlsZSwgdC5wcm9ncmFtICEsIHQuY2hlY2tlciwgcGlwZXMpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHF1ZXJ5Q2FjaGU7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBnZXRTb3VyY2VGcm9tTm9kZShmaWxlTmFtZTogc3RyaW5nLCB2ZXJzaW9uOiBzdHJpbmcsIG5vZGU6IHRzLk5vZGUpOiBUZW1wbGF0ZVNvdXJjZVxuICAgICAgfHVuZGVmaW5lZCB7XG4gICAgbGV0IHJlc3VsdDogVGVtcGxhdGVTb3VyY2V8dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgIGNvbnN0IHQgPSB0aGlzO1xuICAgIHN3aXRjaCAobm9kZS5raW5kKSB7XG4gICAgICBjYXNlIHRzLlN5bnRheEtpbmQuTm9TdWJzdGl0dXRpb25UZW1wbGF0ZUxpdGVyYWw6XG4gICAgICBjYXNlIHRzLlN5bnRheEtpbmQuU3RyaW5nTGl0ZXJhbDpcbiAgICAgICAgbGV0IFtkZWNsYXJhdGlvbiwgZGVjb3JhdG9yXSA9IHRoaXMuZ2V0VGVtcGxhdGVDbGFzc0RlY2xGcm9tTm9kZShub2RlKTtcbiAgICAgICAgaWYgKGRlY2xhcmF0aW9uICYmIGRlY2xhcmF0aW9uLm5hbWUpIHtcbiAgICAgICAgICBjb25zdCBzb3VyY2VGaWxlID0gdGhpcy5nZXRTb3VyY2VGaWxlKGZpbGVOYW1lKTtcbiAgICAgICAgICBpZiAoc291cmNlRmlsZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0U291cmNlRnJvbURlY2xhcmF0aW9uKFxuICAgICAgICAgICAgICAgIGZpbGVOYW1lLCB2ZXJzaW9uLCB0aGlzLnN0cmluZ09mKG5vZGUpIHx8ICcnLCBzaHJpbmsoc3Bhbk9mKG5vZGUpKSxcbiAgICAgICAgICAgICAgICB0aGlzLnJlZmxlY3Rvci5nZXRTdGF0aWNTeW1ib2woc291cmNlRmlsZS5maWxlTmFtZSwgZGVjbGFyYXRpb24ubmFtZS50ZXh0KSxcbiAgICAgICAgICAgICAgICBkZWNsYXJhdGlvbiwgbm9kZSwgc291cmNlRmlsZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRTb3VyY2VGcm9tVHlwZShmaWxlTmFtZTogc3RyaW5nLCB2ZXJzaW9uOiBzdHJpbmcsIHR5cGU6IFN0YXRpY1N5bWJvbCk6IFRlbXBsYXRlU291cmNlXG4gICAgICB8dW5kZWZpbmVkIHtcbiAgICBsZXQgcmVzdWx0OiBUZW1wbGF0ZVNvdXJjZXx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgY29uc3QgZGVjbGFyYXRpb24gPSB0aGlzLmdldFRlbXBsYXRlQ2xhc3NGcm9tU3RhdGljU3ltYm9sKHR5cGUpO1xuICAgIGlmIChkZWNsYXJhdGlvbikge1xuICAgICAgY29uc3Qgc25hcHNob3QgPSB0aGlzLmhvc3QuZ2V0U2NyaXB0U25hcHNob3QoZmlsZU5hbWUpO1xuICAgICAgaWYgKHNuYXBzaG90KSB7XG4gICAgICAgIGNvbnN0IHNvdXJjZSA9IHNuYXBzaG90LmdldFRleHQoMCwgc25hcHNob3QuZ2V0TGVuZ3RoKCkpO1xuICAgICAgICByZXN1bHQgPSB0aGlzLmdldFNvdXJjZUZyb21EZWNsYXJhdGlvbihcbiAgICAgICAgICAgIGZpbGVOYW1lLCB2ZXJzaW9uLCBzb3VyY2UsIHtzdGFydDogMCwgZW5kOiBzb3VyY2UubGVuZ3RofSwgdHlwZSwgZGVjbGFyYXRpb24sXG4gICAgICAgICAgICBkZWNsYXJhdGlvbiwgZGVjbGFyYXRpb24uZ2V0U291cmNlRmlsZSgpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0IHJlZmxlY3Rvckhvc3QoKTogUmVmbGVjdG9ySG9zdCB7XG4gICAgbGV0IHJlc3VsdCA9IHRoaXMuX3JlZmxlY3Rvckhvc3Q7XG4gICAgaWYgKCFyZXN1bHQpIHtcbiAgICAgIGlmICghdGhpcy5jb250ZXh0KSB7XG4gICAgICAgIC8vIE1ha2UgdXAgYSBjb250ZXh0IGJ5IGZpbmRpbmcgdGhlIGZpcnN0IHNjcmlwdCBhbmQgdXNpbmcgdGhhdCBhcyB0aGUgYmFzZSBkaXIuXG4gICAgICAgIGNvbnN0IHNjcmlwdEZpbGVOYW1lcyA9IHRoaXMuaG9zdC5nZXRTY3JpcHRGaWxlTmFtZXMoKTtcbiAgICAgICAgaWYgKDAgPT09IHNjcmlwdEZpbGVOYW1lcy5sZW5ndGgpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludGVybmFsIGVycm9yOiBubyBzY3JpcHQgZmlsZSBuYW1lcyBmb3VuZCcpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY29udGV4dCA9IHNjcmlwdEZpbGVOYW1lc1swXTtcbiAgICAgIH1cblxuICAgICAgLy8gVXNlIHRoZSBmaWxlIGNvbnRleHQncyBkaXJlY3RvcnkgYXMgdGhlIGJhc2UgZGlyZWN0b3J5LlxuICAgICAgLy8gVGhlIGhvc3QncyBnZXRDdXJyZW50RGlyZWN0b3J5KCkgaXMgbm90IHJlbGlhYmxlIGFzIGl0IGlzIGFsd2F5cyBcIlwiIGluXG4gICAgICAvLyB0c3NlcnZlci4gV2UgZG9uJ3QgbmVlZCB0aGUgZXhhY3QgYmFzZSBkaXJlY3RvcnksIGp1c3Qgb25lIHRoYXQgY29udGFpbnNcbiAgICAgIC8vIGEgc291cmNlIGZpbGUuXG4gICAgICBjb25zdCBzb3VyY2UgPSB0aGlzLnRzU2VydmljZS5nZXRQcm9ncmFtKCkgIS5nZXRTb3VyY2VGaWxlKHRoaXMuY29udGV4dCk7XG4gICAgICBpZiAoIXNvdXJjZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludGVybmFsIGVycm9yOiBubyBjb250ZXh0IGNvdWxkIGJlIGRldGVybWluZWQnKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdHNDb25maWdQYXRoID0gZmluZFRzQ29uZmlnKHNvdXJjZS5maWxlTmFtZSk7XG4gICAgICBjb25zdCBiYXNlUGF0aCA9IHBhdGguZGlybmFtZSh0c0NvbmZpZ1BhdGggfHwgdGhpcy5jb250ZXh0KTtcbiAgICAgIGNvbnN0IG9wdGlvbnM6IENvbXBpbGVyT3B0aW9ucyA9IHtiYXNlUGF0aCwgZ2VuRGlyOiBiYXNlUGF0aH07XG4gICAgICBjb25zdCBjb21waWxlck9wdGlvbnMgPSB0aGlzLmhvc3QuZ2V0Q29tcGlsYXRpb25TZXR0aW5ncygpO1xuICAgICAgaWYgKGNvbXBpbGVyT3B0aW9ucyAmJiBjb21waWxlck9wdGlvbnMuYmFzZVVybCkge1xuICAgICAgICBvcHRpb25zLmJhc2VVcmwgPSBjb21waWxlck9wdGlvbnMuYmFzZVVybDtcbiAgICAgIH1cbiAgICAgIGlmIChjb21waWxlck9wdGlvbnMgJiYgY29tcGlsZXJPcHRpb25zLnBhdGhzKSB7XG4gICAgICAgIG9wdGlvbnMucGF0aHMgPSBjb21waWxlck9wdGlvbnMucGF0aHM7XG4gICAgICB9XG4gICAgICByZXN1bHQgPSB0aGlzLl9yZWZsZWN0b3JIb3N0ID1cbiAgICAgICAgICBuZXcgUmVmbGVjdG9ySG9zdCgoKSA9PiB0aGlzLnRzU2VydmljZS5nZXRQcm9ncmFtKCkgISwgdGhpcy5ob3N0LCBvcHRpb25zKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHByaXZhdGUgY29sbGVjdEVycm9yKGVycm9yOiBhbnksIGZpbGVQYXRoOiBzdHJpbmd8bnVsbCkge1xuICAgIGlmIChmaWxlUGF0aCkge1xuICAgICAgbGV0IGVycm9yTWFwID0gdGhpcy5jb2xsZWN0ZWRFcnJvcnM7XG4gICAgICBpZiAoIWVycm9yTWFwIHx8ICF0aGlzLmNvbGxlY3RlZEVycm9ycykge1xuICAgICAgICBlcnJvck1hcCA9IHRoaXMuY29sbGVjdGVkRXJyb3JzID0gbmV3IE1hcCgpO1xuICAgICAgfVxuICAgICAgbGV0IGVycm9ycyA9IGVycm9yTWFwLmdldChmaWxlUGF0aCk7XG4gICAgICBpZiAoIWVycm9ycykge1xuICAgICAgICBlcnJvcnMgPSBbXTtcbiAgICAgICAgdGhpcy5jb2xsZWN0ZWRFcnJvcnMuc2V0KGZpbGVQYXRoLCBlcnJvcnMpO1xuICAgICAgfVxuICAgICAgZXJyb3JzLnB1c2goZXJyb3IpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2V0IHN0YXRpY1N5bWJvbFJlc29sdmVyKCk6IFN0YXRpY1N5bWJvbFJlc29sdmVyIHtcbiAgICBsZXQgcmVzdWx0ID0gdGhpcy5fc3RhdGljU3ltYm9sUmVzb2x2ZXI7XG4gICAgaWYgKCFyZXN1bHQpIHtcbiAgICAgIHRoaXMuX3N1bW1hcnlSZXNvbHZlciA9IG5ldyBBb3RTdW1tYXJ5UmVzb2x2ZXIoXG4gICAgICAgICAge1xuICAgICAgICAgICAgbG9hZFN1bW1hcnkoZmlsZVBhdGg6IHN0cmluZykgeyByZXR1cm4gbnVsbDsgfSxcbiAgICAgICAgICAgIGlzU291cmNlRmlsZShzb3VyY2VGaWxlUGF0aDogc3RyaW5nKSB7IHJldHVybiB0cnVlOyB9LFxuICAgICAgICAgICAgdG9TdW1tYXJ5RmlsZU5hbWUoc291cmNlRmlsZVBhdGg6IHN0cmluZykgeyByZXR1cm4gc291cmNlRmlsZVBhdGg7IH0sXG4gICAgICAgICAgICBmcm9tU3VtbWFyeUZpbGVOYW1lKGZpbGVQYXRoOiBzdHJpbmcpOiBzdHJpbmd7cmV0dXJuIGZpbGVQYXRoO30sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB0aGlzLl9zdGF0aWNTeW1ib2xDYWNoZSk7XG4gICAgICByZXN1bHQgPSB0aGlzLl9zdGF0aWNTeW1ib2xSZXNvbHZlciA9IG5ldyBTdGF0aWNTeW1ib2xSZXNvbHZlcihcbiAgICAgICAgICB0aGlzLnJlZmxlY3Rvckhvc3QgYXMgYW55LCB0aGlzLl9zdGF0aWNTeW1ib2xDYWNoZSwgdGhpcy5fc3VtbWFyeVJlc29sdmVyLFxuICAgICAgICAgIChlLCBmaWxlUGF0aCkgPT4gdGhpcy5jb2xsZWN0RXJyb3IoZSwgZmlsZVBhdGggISkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgcHJpdmF0ZSBnZXQgcmVmbGVjdG9yKCk6IFN0YXRpY1JlZmxlY3RvciB7XG4gICAgbGV0IHJlc3VsdCA9IHRoaXMuX3JlZmxlY3RvcjtcbiAgICBpZiAoIXJlc3VsdCkge1xuICAgICAgY29uc3Qgc3NyID0gdGhpcy5zdGF0aWNTeW1ib2xSZXNvbHZlcjtcbiAgICAgIHJlc3VsdCA9IHRoaXMuX3JlZmxlY3RvciA9IG5ldyBTdGF0aWNSZWZsZWN0b3IoXG4gICAgICAgICAgdGhpcy5fc3VtbWFyeVJlc29sdmVyLCBzc3IsIFtdLCBbXSwgKGUsIGZpbGVQYXRoKSA9PiB0aGlzLmNvbGxlY3RFcnJvcihlLCBmaWxlUGF0aCAhKSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBwcml2YXRlIGdldFRlbXBsYXRlQ2xhc3NGcm9tU3RhdGljU3ltYm9sKHR5cGU6IFN0YXRpY1N5bWJvbCk6IHRzLkNsYXNzRGVjbGFyYXRpb258dW5kZWZpbmVkIHtcbiAgICBjb25zdCBzb3VyY2UgPSB0aGlzLmdldFNvdXJjZUZpbGUodHlwZS5maWxlUGF0aCk7XG4gICAgaWYgKHNvdXJjZSkge1xuICAgICAgY29uc3QgZGVjbGFyYXRpb25Ob2RlID0gdHMuZm9yRWFjaENoaWxkKHNvdXJjZSwgY2hpbGQgPT4ge1xuICAgICAgICBpZiAoY2hpbGQua2luZCA9PT0gdHMuU3ludGF4S2luZC5DbGFzc0RlY2xhcmF0aW9uKSB7XG4gICAgICAgICAgY29uc3QgY2xhc3NEZWNsYXJhdGlvbiA9IGNoaWxkIGFzIHRzLkNsYXNzRGVjbGFyYXRpb247XG4gICAgICAgICAgaWYgKGNsYXNzRGVjbGFyYXRpb24ubmFtZSAhPSBudWxsICYmIGNsYXNzRGVjbGFyYXRpb24ubmFtZS50ZXh0ID09PSB0eXBlLm5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiBjbGFzc0RlY2xhcmF0aW9uO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gZGVjbGFyYXRpb25Ob2RlIGFzIHRzLkNsYXNzRGVjbGFyYXRpb247XG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIG1pc3NpbmdUZW1wbGF0ZTogW3RzLkNsYXNzRGVjbGFyYXRpb24gfCB1bmRlZmluZWQsIHRzLkV4cHJlc3Npb258dW5kZWZpbmVkXSA9XG4gICAgICBbdW5kZWZpbmVkLCB1bmRlZmluZWRdO1xuXG4gIC8qKlxuICAgKiBHaXZlbiBhIHRlbXBsYXRlIHN0cmluZyBub2RlLCBzZWUgaWYgaXQgaXMgYW4gQW5ndWxhciB0ZW1wbGF0ZSBzdHJpbmcsIGFuZCBpZiBzbyByZXR1cm4gdGhlXG4gICAqIGNvbnRhaW5pbmcgY2xhc3MuXG4gICAqL1xuICBwcml2YXRlIGdldFRlbXBsYXRlQ2xhc3NEZWNsRnJvbU5vZGUoY3VycmVudFRva2VuOiB0cy5Ob2RlKTpcbiAgICAgIFt0cy5DbGFzc0RlY2xhcmF0aW9uIHwgdW5kZWZpbmVkLCB0cy5FeHByZXNzaW9ufHVuZGVmaW5lZF0ge1xuICAgIC8vIFZlcmlmeSB3ZSBhcmUgaW4gYSAndGVtcGxhdGUnIHByb3BlcnR5IGFzc2lnbm1lbnQsIGluIGFuIG9iamVjdCBsaXRlcmFsLCB3aGljaCBpcyBhbiBjYWxsXG4gICAgLy8gYXJnLCBpbiBhIGRlY29yYXRvclxuICAgIGxldCBwYXJlbnROb2RlID0gY3VycmVudFRva2VuLnBhcmVudDsgIC8vIFByb3BlcnR5QXNzaWdubWVudFxuICAgIGlmICghcGFyZW50Tm9kZSkge1xuICAgICAgcmV0dXJuIFR5cGVTY3JpcHRTZXJ2aWNlSG9zdC5taXNzaW5nVGVtcGxhdGU7XG4gICAgfVxuICAgIGlmIChwYXJlbnROb2RlLmtpbmQgIT09IHRzLlN5bnRheEtpbmQuUHJvcGVydHlBc3NpZ25tZW50KSB7XG4gICAgICByZXR1cm4gVHlwZVNjcmlwdFNlcnZpY2VIb3N0Lm1pc3NpbmdUZW1wbGF0ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVE9ETzogSXMgdGhpcyBkaWZmZXJlbnQgZm9yIGEgbGl0ZXJhbCwgaS5lLiBhIHF1b3RlZCBwcm9wZXJ0eSBuYW1lIGxpa2UgXCJ0ZW1wbGF0ZVwiP1xuICAgICAgaWYgKChwYXJlbnROb2RlIGFzIGFueSkubmFtZS50ZXh0ICE9PSAndGVtcGxhdGUnKSB7XG4gICAgICAgIHJldHVybiBUeXBlU2NyaXB0U2VydmljZUhvc3QubWlzc2luZ1RlbXBsYXRlO1xuICAgICAgfVxuICAgIH1cbiAgICBwYXJlbnROb2RlID0gcGFyZW50Tm9kZS5wYXJlbnQ7ICAvLyBPYmplY3RMaXRlcmFsRXhwcmVzc2lvblxuICAgIGlmICghcGFyZW50Tm9kZSB8fCBwYXJlbnROb2RlLmtpbmQgIT09IHRzLlN5bnRheEtpbmQuT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24pIHtcbiAgICAgIHJldHVybiBUeXBlU2NyaXB0U2VydmljZUhvc3QubWlzc2luZ1RlbXBsYXRlO1xuICAgIH1cblxuICAgIHBhcmVudE5vZGUgPSBwYXJlbnROb2RlLnBhcmVudDsgIC8vIENhbGxFeHByZXNzaW9uXG4gICAgaWYgKCFwYXJlbnROb2RlIHx8IHBhcmVudE5vZGUua2luZCAhPT0gdHMuU3ludGF4S2luZC5DYWxsRXhwcmVzc2lvbikge1xuICAgICAgcmV0dXJuIFR5cGVTY3JpcHRTZXJ2aWNlSG9zdC5taXNzaW5nVGVtcGxhdGU7XG4gICAgfVxuICAgIGNvbnN0IGNhbGxUYXJnZXQgPSAoPHRzLkNhbGxFeHByZXNzaW9uPnBhcmVudE5vZGUpLmV4cHJlc3Npb247XG5cbiAgICBsZXQgZGVjb3JhdG9yID0gcGFyZW50Tm9kZS5wYXJlbnQ7ICAvLyBEZWNvcmF0b3JcbiAgICBpZiAoIWRlY29yYXRvciB8fCBkZWNvcmF0b3Iua2luZCAhPT0gdHMuU3ludGF4S2luZC5EZWNvcmF0b3IpIHtcbiAgICAgIHJldHVybiBUeXBlU2NyaXB0U2VydmljZUhvc3QubWlzc2luZ1RlbXBsYXRlO1xuICAgIH1cblxuICAgIGxldCBkZWNsYXJhdGlvbiA9IDx0cy5DbGFzc0RlY2xhcmF0aW9uPmRlY29yYXRvci5wYXJlbnQ7ICAvLyBDbGFzc0RlY2xhcmF0aW9uXG4gICAgaWYgKCFkZWNsYXJhdGlvbiB8fCBkZWNsYXJhdGlvbi5raW5kICE9PSB0cy5TeW50YXhLaW5kLkNsYXNzRGVjbGFyYXRpb24pIHtcbiAgICAgIHJldHVybiBUeXBlU2NyaXB0U2VydmljZUhvc3QubWlzc2luZ1RlbXBsYXRlO1xuICAgIH1cbiAgICByZXR1cm4gW2RlY2xhcmF0aW9uLCBjYWxsVGFyZ2V0XTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0Q29sbGVjdGVkRXJyb3JzKGRlZmF1bHRTcGFuOiBTcGFuLCBzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlKTogRGVjbGFyYXRpb25FcnJvcltdIHtcbiAgICBjb25zdCBlcnJvcnMgPSAodGhpcy5jb2xsZWN0ZWRFcnJvcnMgJiYgdGhpcy5jb2xsZWN0ZWRFcnJvcnMuZ2V0KHNvdXJjZUZpbGUuZmlsZU5hbWUpKTtcbiAgICByZXR1cm4gKGVycm9ycyAmJiBlcnJvcnMubWFwKChlOiBhbnkpID0+IHtcbiAgICAgICAgICAgICBjb25zdCBsaW5lID0gZS5saW5lIHx8IChlLnBvc2l0aW9uICYmIGUucG9zaXRpb24ubGluZSk7XG4gICAgICAgICAgICAgY29uc3QgY29sdW1uID0gZS5jb2x1bW4gfHwgKGUucG9zaXRpb24gJiYgZS5wb3NpdGlvbi5jb2x1bW4pO1xuICAgICAgICAgICAgIGNvbnN0IHNwYW4gPSBzcGFuQXQoc291cmNlRmlsZSwgbGluZSwgY29sdW1uKSB8fCBkZWZhdWx0U3BhbjtcbiAgICAgICAgICAgICBpZiAoaXNGb3JtYXR0ZWRFcnJvcihlKSkge1xuICAgICAgICAgICAgICAgcmV0dXJuIGVycm9yVG9EaWFnbm9zdGljV2l0aENoYWluKGUsIHNwYW4pO1xuICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICByZXR1cm4ge21lc3NhZ2U6IGUubWVzc2FnZSwgc3Bhbn07XG4gICAgICAgICAgIH0pKSB8fFxuICAgICAgICBbXTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0RGVjbGFyYXRpb25Gcm9tTm9kZShzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlLCBub2RlOiB0cy5Ob2RlKTogRGVjbGFyYXRpb258dW5kZWZpbmVkIHtcbiAgICBpZiAobm9kZS5raW5kID09IHRzLlN5bnRheEtpbmQuQ2xhc3NEZWNsYXJhdGlvbiAmJiBub2RlLmRlY29yYXRvcnMgJiZcbiAgICAgICAgKG5vZGUgYXMgdHMuQ2xhc3NEZWNsYXJhdGlvbikubmFtZSkge1xuICAgICAgZm9yIChjb25zdCBkZWNvcmF0b3Igb2Ygbm9kZS5kZWNvcmF0b3JzKSB7XG4gICAgICAgIGlmIChkZWNvcmF0b3IuZXhwcmVzc2lvbiAmJiBkZWNvcmF0b3IuZXhwcmVzc2lvbi5raW5kID09IHRzLlN5bnRheEtpbmQuQ2FsbEV4cHJlc3Npb24pIHtcbiAgICAgICAgICBjb25zdCBjbGFzc0RlY2xhcmF0aW9uID0gbm9kZSBhcyB0cy5DbGFzc0RlY2xhcmF0aW9uO1xuICAgICAgICAgIGlmIChjbGFzc0RlY2xhcmF0aW9uLm5hbWUpIHtcbiAgICAgICAgICAgIGNvbnN0IGNhbGwgPSBkZWNvcmF0b3IuZXhwcmVzc2lvbiBhcyB0cy5DYWxsRXhwcmVzc2lvbjtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IGNhbGwuZXhwcmVzc2lvbjtcbiAgICAgICAgICAgIGNvbnN0IHR5cGUgPSB0aGlzLmNoZWNrZXIuZ2V0VHlwZUF0TG9jYXRpb24odGFyZ2V0KTtcbiAgICAgICAgICAgIGlmICh0eXBlKSB7XG4gICAgICAgICAgICAgIGNvbnN0IHN0YXRpY1N5bWJvbCA9XG4gICAgICAgICAgICAgICAgICB0aGlzLnJlZmxlY3Rvci5nZXRTdGF0aWNTeW1ib2woc291cmNlRmlsZS5maWxlTmFtZSwgY2xhc3NEZWNsYXJhdGlvbi5uYW1lLnRleHQpO1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnJlc29sdmVyLmlzRGlyZWN0aXZlKHN0YXRpY1N5bWJvbCBhcyBhbnkpKSB7XG4gICAgICAgICAgICAgICAgICBjb25zdCB7bWV0YWRhdGF9ID1cbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc29sdmVyLmdldE5vbk5vcm1hbGl6ZWREaXJlY3RpdmVNZXRhZGF0YShzdGF0aWNTeW1ib2wgYXMgYW55KSAhO1xuICAgICAgICAgICAgICAgICAgY29uc3QgZGVjbGFyYXRpb25TcGFuID0gc3Bhbk9mKHRhcmdldCk7XG4gICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBzdGF0aWNTeW1ib2wsXG4gICAgICAgICAgICAgICAgICAgIGRlY2xhcmF0aW9uU3BhbixcbiAgICAgICAgICAgICAgICAgICAgbWV0YWRhdGEsXG4gICAgICAgICAgICAgICAgICAgIGVycm9yczogdGhpcy5nZXRDb2xsZWN0ZWRFcnJvcnMoZGVjbGFyYXRpb25TcGFuLCBzb3VyY2VGaWxlKVxuICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZS5tZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLmNvbGxlY3RFcnJvcihlLCBzb3VyY2VGaWxlLmZpbGVOYW1lKTtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGRlY2xhcmF0aW9uU3BhbiA9IHNwYW5PZih0YXJnZXQpO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogc3RhdGljU3ltYm9sLFxuICAgICAgICAgICAgICAgICAgICBkZWNsYXJhdGlvblNwYW4sXG4gICAgICAgICAgICAgICAgICAgIGVycm9yczogdGhpcy5nZXRDb2xsZWN0ZWRFcnJvcnMoZGVjbGFyYXRpb25TcGFuLCBzb3VyY2VGaWxlKVxuICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHN0cmluZ09mKG5vZGU6IHRzLk5vZGUpOiBzdHJpbmd8dW5kZWZpbmVkIHtcbiAgICBzd2l0Y2ggKG5vZGUua2luZCkge1xuICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLk5vU3Vic3RpdHV0aW9uVGVtcGxhdGVMaXRlcmFsOlxuICAgICAgICByZXR1cm4gKDx0cy5MaXRlcmFsRXhwcmVzc2lvbj5ub2RlKS50ZXh0O1xuICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLlN0cmluZ0xpdGVyYWw6XG4gICAgICAgIHJldHVybiAoPHRzLlN0cmluZ0xpdGVyYWw+bm9kZSkudGV4dDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGZpbmROb2RlKHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUsIHBvc2l0aW9uOiBudW1iZXIpOiB0cy5Ob2RlfHVuZGVmaW5lZCB7XG4gICAgZnVuY3Rpb24gZmluZChub2RlOiB0cy5Ob2RlKTogdHMuTm9kZXx1bmRlZmluZWQge1xuICAgICAgaWYgKHBvc2l0aW9uID49IG5vZGUuZ2V0U3RhcnQoKSAmJiBwb3NpdGlvbiA8IG5vZGUuZ2V0RW5kKCkpIHtcbiAgICAgICAgcmV0dXJuIHRzLmZvckVhY2hDaGlsZChub2RlLCBmaW5kKSB8fCBub2RlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmaW5kKHNvdXJjZUZpbGUpO1xuICB9XG59XG5cblxuZnVuY3Rpb24gZmluZFRzQ29uZmlnKGZpbGVOYW1lOiBzdHJpbmcpOiBzdHJpbmd8dW5kZWZpbmVkIHtcbiAgbGV0IGRpciA9IHBhdGguZGlybmFtZShmaWxlTmFtZSk7XG4gIHdoaWxlIChmcy5leGlzdHNTeW5jKGRpcikpIHtcbiAgICBjb25zdCBjYW5kaWRhdGUgPSBwYXRoLmpvaW4oZGlyLCAndHNjb25maWcuanNvbicpO1xuICAgIGlmIChmcy5leGlzdHNTeW5jKGNhbmRpZGF0ZSkpIHJldHVybiBjYW5kaWRhdGU7XG4gICAgY29uc3QgcGFyZW50RGlyID0gcGF0aC5kaXJuYW1lKGRpcik7XG4gICAgaWYgKHBhcmVudERpciA9PT0gZGlyKSBicmVhaztcbiAgICBkaXIgPSBwYXJlbnREaXI7XG4gIH1cbn1cblxuZnVuY3Rpb24gc3Bhbk9mKG5vZGU6IHRzLk5vZGUpOiBTcGFuIHtcbiAgcmV0dXJuIHtzdGFydDogbm9kZS5nZXRTdGFydCgpLCBlbmQ6IG5vZGUuZ2V0RW5kKCl9O1xufVxuXG5mdW5jdGlvbiBzaHJpbmsoc3BhbjogU3Bhbiwgb2Zmc2V0PzogbnVtYmVyKSB7XG4gIGlmIChvZmZzZXQgPT0gbnVsbCkgb2Zmc2V0ID0gMTtcbiAgcmV0dXJuIHtzdGFydDogc3Bhbi5zdGFydCArIG9mZnNldCwgZW5kOiBzcGFuLmVuZCAtIG9mZnNldH07XG59XG5cbmZ1bmN0aW9uIHNwYW5BdChzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlLCBsaW5lOiBudW1iZXIsIGNvbHVtbjogbnVtYmVyKTogU3Bhbnx1bmRlZmluZWQge1xuICBpZiAobGluZSAhPSBudWxsICYmIGNvbHVtbiAhPSBudWxsKSB7XG4gICAgY29uc3QgcG9zaXRpb24gPSB0cy5nZXRQb3NpdGlvbk9mTGluZUFuZENoYXJhY3Rlcihzb3VyY2VGaWxlLCBsaW5lLCBjb2x1bW4pO1xuICAgIGNvbnN0IGZpbmRDaGlsZCA9IGZ1bmN0aW9uIGZpbmRDaGlsZChub2RlOiB0cy5Ob2RlKTogdHMuTm9kZSB8IHVuZGVmaW5lZCB7XG4gICAgICBpZiAobm9kZS5raW5kID4gdHMuU3ludGF4S2luZC5MYXN0VG9rZW4gJiYgbm9kZS5wb3MgPD0gcG9zaXRpb24gJiYgbm9kZS5lbmQgPiBwb3NpdGlvbikge1xuICAgICAgICBjb25zdCBiZXR0ZXJOb2RlID0gdHMuZm9yRWFjaENoaWxkKG5vZGUsIGZpbmRDaGlsZCk7XG4gICAgICAgIHJldHVybiBiZXR0ZXJOb2RlIHx8IG5vZGU7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGNvbnN0IG5vZGUgPSB0cy5mb3JFYWNoQ2hpbGQoc291cmNlRmlsZSwgZmluZENoaWxkKTtcbiAgICBpZiAobm9kZSkge1xuICAgICAgcmV0dXJuIHtzdGFydDogbm9kZS5nZXRTdGFydCgpLCBlbmQ6IG5vZGUuZ2V0RW5kKCl9O1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBjaGFpbmVkTWVzc2FnZShjaGFpbjogRGlhZ25vc3RpY01lc3NhZ2VDaGFpbiwgaW5kZW50ID0gJycpOiBzdHJpbmcge1xuICByZXR1cm4gaW5kZW50ICsgY2hhaW4ubWVzc2FnZSArIChjaGFpbi5uZXh0ID8gY2hhaW5lZE1lc3NhZ2UoY2hhaW4ubmV4dCwgaW5kZW50ICsgJyAgJykgOiAnJyk7XG59XG5cbmNsYXNzIERpYWdub3N0aWNNZXNzYWdlQ2hhaW5JbXBsIGltcGxlbWVudHMgRGlhZ25vc3RpY01lc3NhZ2VDaGFpbiB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBtZXNzYWdlOiBzdHJpbmcsIHB1YmxpYyBuZXh0PzogRGlhZ25vc3RpY01lc3NhZ2VDaGFpbikge31cbiAgdG9TdHJpbmcoKTogc3RyaW5nIHsgcmV0dXJuIGNoYWluZWRNZXNzYWdlKHRoaXMpOyB9XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRDaGFpbihjaGFpbjogRm9ybWF0dGVkTWVzc2FnZUNoYWluKTogRGlhZ25vc3RpY01lc3NhZ2VDaGFpbiB7XG4gIHJldHVybiB7bWVzc2FnZTogY2hhaW4ubWVzc2FnZSwgbmV4dDogY2hhaW4ubmV4dCA/IGNvbnZlcnRDaGFpbihjaGFpbi5uZXh0KSA6IHVuZGVmaW5lZH07XG59XG5cbmZ1bmN0aW9uIGVycm9yVG9EaWFnbm9zdGljV2l0aENoYWluKGVycm9yOiBGb3JtYXR0ZWRFcnJvciwgc3BhbjogU3Bhbik6IERlY2xhcmF0aW9uRXJyb3Ige1xuICByZXR1cm4ge21lc3NhZ2U6IGVycm9yLmNoYWluID8gY29udmVydENoYWluKGVycm9yLmNoYWluKSA6IGVycm9yLm1lc3NhZ2UsIHNwYW59O1xufVxuIl19
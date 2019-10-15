(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/src/ngcc/src/analysis/decoration_analyzer", ["require", "exports", "tslib", "@angular/compiler", "fs", "@angular/compiler-cli/src/ngtsc/annotations", "@angular/compiler-cli/src/ngcc/src/utils"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var compiler_1 = require("@angular/compiler");
    var fs = require("fs");
    var annotations_1 = require("@angular/compiler-cli/src/ngtsc/annotations");
    var utils_1 = require("@angular/compiler-cli/src/ngcc/src/utils");
    exports.DecorationAnalyses = Map;
    /**
     * `ResourceLoader` which directly uses the filesystem to resolve resources synchronously.
     */
    var FileResourceLoader = /** @class */ (function () {
        function FileResourceLoader() {
        }
        FileResourceLoader.prototype.load = function (url) { return fs.readFileSync(url, 'utf8'); };
        return FileResourceLoader;
    }());
    exports.FileResourceLoader = FileResourceLoader;
    /**
     * This Analyzer will analyze the files that have decorated classes that need to be transformed.
     */
    var DecorationAnalyzer = /** @class */ (function () {
        function DecorationAnalyzer(typeChecker, host, rootDirs, isCore) {
            this.typeChecker = typeChecker;
            this.host = host;
            this.rootDirs = rootDirs;
            this.isCore = isCore;
            this.resourceLoader = new FileResourceLoader();
            this.scopeRegistry = new annotations_1.SelectorScopeRegistry(this.typeChecker, this.host);
            this.handlers = [
                new annotations_1.BaseDefDecoratorHandler(this.typeChecker, this.host),
                new annotations_1.ComponentDecoratorHandler(this.typeChecker, this.host, this.scopeRegistry, this.isCore, this.resourceLoader, this.rootDirs),
                new annotations_1.DirectiveDecoratorHandler(this.typeChecker, this.host, this.scopeRegistry, this.isCore),
                new annotations_1.InjectableDecoratorHandler(this.host, this.isCore),
                new annotations_1.NgModuleDecoratorHandler(this.typeChecker, this.host, this.scopeRegistry, this.isCore),
                new annotations_1.PipeDecoratorHandler(this.typeChecker, this.host, this.scopeRegistry, this.isCore),
            ];
        }
        /**
         * Analyze a program to find all the decorated files should be transformed.
         * @param program The program whose files should be analysed.
         * @returns a map of the source files to the analysis for those files.
         */
        DecorationAnalyzer.prototype.analyzeProgram = function (program) {
            var _this = this;
            var analyzedFiles = new exports.DecorationAnalyses();
            program.getRootFileNames().forEach(function (fileName) {
                var entryPoint = program.getSourceFile(fileName);
                var decoratedFiles = _this.host.findDecoratedFiles(entryPoint);
                decoratedFiles.forEach(function (decoratedFile) {
                    return analyzedFiles.set(decoratedFile.sourceFile, _this.analyzeFile(decoratedFile));
                });
            });
            return analyzedFiles;
        };
        /**
         * Analyze a decorated file to generate the information about decorated classes that
         * should be converted to use ivy definitions.
         * @param file The file to be analysed for decorated classes.
         * @returns the analysis of the file
         */
        DecorationAnalyzer.prototype.analyzeFile = function (file) {
            var _this = this;
            var constantPool = new compiler_1.ConstantPool();
            var analyzedClasses = file.decoratedClasses.map(function (clazz) { return _this.analyzeClass(constantPool, clazz); })
                .filter(utils_1.isDefined);
            return {
                analyzedClasses: analyzedClasses,
                sourceFile: file.sourceFile, constantPool: constantPool,
            };
        };
        DecorationAnalyzer.prototype.analyzeClass = function (pool, clazz) {
            var matchingHandlers = this.handlers
                .map(function (handler) { return ({
                handler: handler,
                match: handler.detect(clazz.declaration, clazz.decorators),
            }); })
                .filter(isMatchingHandler);
            if (matchingHandlers.length > 1) {
                throw new Error('TODO.Diagnostic: Class has multiple Angular decorators.');
            }
            if (matchingHandlers.length === 0) {
                return undefined;
            }
            var _a = matchingHandlers[0], handler = _a.handler, match = _a.match;
            var _b = handler.analyze(clazz.declaration, match), analysis = _b.analysis, diagnostics = _b.diagnostics;
            var compilation = handler.compile(clazz.declaration, analysis, pool);
            if (!Array.isArray(compilation)) {
                compilation = [compilation];
            }
            return tslib_1.__assign({}, clazz, { handler: handler, analysis: analysis, diagnostics: diagnostics, compilation: compilation });
        };
        return DecorationAnalyzer;
    }());
    exports.DecorationAnalyzer = DecorationAnalyzer;
    function isMatchingHandler(handler) {
        return !!handler.match;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb3JhdGlvbl9hbmFseXplci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyLWNsaS9zcmMvbmdjYy9zcmMvYW5hbHlzaXMvZGVjb3JhdGlvbl9hbmFseXplci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7SUFBQTs7Ozs7O09BTUc7SUFDSCw4Q0FBK0M7SUFDL0MsdUJBQXlCO0lBR3pCLDJFQUE0TztJQU01TyxrRUFBbUM7SUFnQnRCLFFBQUEsa0JBQWtCLEdBQUcsR0FBRyxDQUFDO0lBT3RDOztPQUVHO0lBQ0g7UUFBQTtRQUVBLENBQUM7UUFEQyxpQ0FBSSxHQUFKLFVBQUssR0FBVyxJQUFZLE9BQU8sRUFBRSxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BFLHlCQUFDO0lBQUQsQ0FBQyxBQUZELElBRUM7SUFGWSxnREFBa0I7SUFJL0I7O09BRUc7SUFDSDtRQWNFLDRCQUNZLFdBQTJCLEVBQVUsSUFBd0IsRUFDN0QsUUFBa0IsRUFBVSxNQUFlO1lBRDNDLGdCQUFXLEdBQVgsV0FBVyxDQUFnQjtZQUFVLFNBQUksR0FBSixJQUFJLENBQW9CO1lBQzdELGFBQVEsR0FBUixRQUFRLENBQVU7WUFBVSxXQUFNLEdBQU4sTUFBTSxDQUFTO1lBZnZELG1CQUFjLEdBQUcsSUFBSSxrQkFBa0IsRUFBRSxDQUFDO1lBQzFDLGtCQUFhLEdBQUcsSUFBSSxtQ0FBcUIsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN2RSxhQUFRLEdBQWlDO2dCQUN2QyxJQUFJLHFDQUF1QixDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQztnQkFDeEQsSUFBSSx1Q0FBeUIsQ0FDekIsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsY0FBYyxFQUNqRixJQUFJLENBQUMsUUFBUSxDQUFDO2dCQUNsQixJQUFJLHVDQUF5QixDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUM7Z0JBQzNGLElBQUksd0NBQTBCLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDO2dCQUN0RCxJQUFJLHNDQUF3QixDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUM7Z0JBQzFGLElBQUksa0NBQW9CLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQzthQUN2RixDQUFDO1FBSXdELENBQUM7UUFFM0Q7Ozs7V0FJRztRQUNILDJDQUFjLEdBQWQsVUFBZSxPQUFtQjtZQUFsQyxpQkFVQztZQVRDLElBQU0sYUFBYSxHQUFHLElBQUksMEJBQWtCLEVBQUUsQ0FBQztZQUMvQyxPQUFPLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxPQUFPLENBQUMsVUFBQSxRQUFRO2dCQUN6QyxJQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBRyxDQUFDO2dCQUNyRCxJQUFNLGNBQWMsR0FBRyxLQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNoRSxjQUFjLENBQUMsT0FBTyxDQUNsQixVQUFBLGFBQWE7b0JBQ1QsT0FBQSxhQUFhLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxVQUFVLEVBQUUsS0FBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsQ0FBQztnQkFBNUUsQ0FBNEUsQ0FBQyxDQUFDO1lBQ3hGLENBQUMsQ0FBQyxDQUFDO1lBQ0gsT0FBTyxhQUFhLENBQUM7UUFDdkIsQ0FBQztRQUVEOzs7OztXQUtHO1FBQ08sd0NBQVcsR0FBckIsVUFBc0IsSUFBbUI7WUFBekMsaUJBVUM7WUFUQyxJQUFNLFlBQVksR0FBRyxJQUFJLHVCQUFZLEVBQUUsQ0FBQztZQUN4QyxJQUFNLGVBQWUsR0FDakIsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxVQUFBLEtBQUssSUFBSSxPQUFBLEtBQUksQ0FBQyxZQUFZLENBQUMsWUFBWSxFQUFFLEtBQUssQ0FBQyxFQUF0QyxDQUFzQyxDQUFDO2lCQUNyRSxNQUFNLENBQUMsaUJBQVMsQ0FBQyxDQUFDO1lBRTNCLE9BQU87Z0JBQ0wsZUFBZSxpQkFBQTtnQkFDZixVQUFVLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxZQUFZLGNBQUE7YUFDMUMsQ0FBQztRQUNKLENBQUM7UUFFUyx5Q0FBWSxHQUF0QixVQUF1QixJQUFrQixFQUFFLEtBQXFCO1lBQzlELElBQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLFFBQVE7aUJBQ1IsR0FBRyxDQUFDLFVBQUEsT0FBTyxJQUFJLE9BQUEsQ0FBQztnQkFDVixPQUFPLFNBQUE7Z0JBQ1AsS0FBSyxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsVUFBVSxDQUFDO2FBQzNELENBQUMsRUFIUyxDQUdULENBQUM7aUJBQ1AsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFFeEQsSUFBSSxnQkFBZ0IsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO2dCQUMvQixNQUFNLElBQUksS0FBSyxDQUFDLHlEQUF5RCxDQUFDLENBQUM7YUFDNUU7WUFFRCxJQUFJLGdCQUFnQixDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7Z0JBQ2pDLE9BQU8sU0FBUyxDQUFDO2FBQ2xCO1lBRUssSUFBQSx3QkFBc0MsRUFBckMsb0JBQU8sRUFBRSxnQkFBNEIsQ0FBQztZQUN2QyxJQUFBLDhDQUFtRSxFQUFsRSxzQkFBUSxFQUFFLDRCQUF3RCxDQUFDO1lBQzFFLElBQUksV0FBVyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDckUsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLEVBQUU7Z0JBQy9CLFdBQVcsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDO2FBQzdCO1lBQ0QsNEJBQVcsS0FBSyxJQUFFLE9BQU8sU0FBQSxFQUFFLFFBQVEsVUFBQSxFQUFFLFdBQVcsYUFBQSxFQUFFLFdBQVcsYUFBQSxJQUFFO1FBQ2pFLENBQUM7UUFDSCx5QkFBQztJQUFELENBQUMsQUE3RUQsSUE2RUM7SUE3RVksZ0RBQWtCO0lBK0UvQixTQUFTLGlCQUFpQixDQUFPLE9BQXVDO1FBRXRFLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7SUFDekIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7Q29uc3RhbnRQb29sfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtCYXNlRGVmRGVjb3JhdG9ySGFuZGxlciwgQ29tcG9uZW50RGVjb3JhdG9ySGFuZGxlciwgRGlyZWN0aXZlRGVjb3JhdG9ySGFuZGxlciwgSW5qZWN0YWJsZURlY29yYXRvckhhbmRsZXIsIE5nTW9kdWxlRGVjb3JhdG9ySGFuZGxlciwgUGlwZURlY29yYXRvckhhbmRsZXIsIFJlc291cmNlTG9hZGVyLCBTZWxlY3RvclNjb3BlUmVnaXN0cnl9IGZyb20gJy4uLy4uLy4uL25ndHNjL2Fubm90YXRpb25zJztcbmltcG9ydCB7Q29tcGlsZVJlc3VsdCwgRGVjb3JhdG9ySGFuZGxlcn0gZnJvbSAnLi4vLi4vLi4vbmd0c2MvdHJhbnNmb3JtJztcblxuaW1wb3J0IHtEZWNvcmF0ZWRDbGFzc30gZnJvbSAnLi4vaG9zdC9kZWNvcmF0ZWRfY2xhc3MnO1xuaW1wb3J0IHtEZWNvcmF0ZWRGaWxlfSBmcm9tICcuLi9ob3N0L2RlY29yYXRlZF9maWxlJztcbmltcG9ydCB7TmdjY1JlZmxlY3Rpb25Ib3N0fSBmcm9tICcuLi9ob3N0L25nY2NfaG9zdCc7XG5pbXBvcnQge2lzRGVmaW5lZH0gZnJvbSAnLi4vdXRpbHMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEFuYWx5emVkQ2xhc3M8QSA9IGFueSwgTSA9IGFueT4gZXh0ZW5kcyBEZWNvcmF0ZWRDbGFzcyB7XG4gIGhhbmRsZXI6IERlY29yYXRvckhhbmRsZXI8QSwgTT47XG4gIGFuYWx5c2lzOiBhbnk7XG4gIGRpYWdub3N0aWNzPzogdHMuRGlhZ25vc3RpY1tdO1xuICBjb21waWxhdGlvbjogQ29tcGlsZVJlc3VsdFtdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIERlY29yYXRpb25BbmFseXNpcyB7XG4gIGFuYWx5emVkQ2xhc3NlczogQW5hbHl6ZWRDbGFzc1tdO1xuICBzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlO1xuICBjb25zdGFudFBvb2w6IENvbnN0YW50UG9vbDtcbn1cblxuZXhwb3J0IHR5cGUgRGVjb3JhdGlvbkFuYWx5c2VzID0gTWFwPHRzLlNvdXJjZUZpbGUsIERlY29yYXRpb25BbmFseXNpcz47XG5leHBvcnQgY29uc3QgRGVjb3JhdGlvbkFuYWx5c2VzID0gTWFwO1xuXG5leHBvcnQgaW50ZXJmYWNlIE1hdGNoaW5nSGFuZGxlcjxBLCBNPiB7XG4gIGhhbmRsZXI6IERlY29yYXRvckhhbmRsZXI8QSwgTT47XG4gIG1hdGNoOiBNO1xufVxuXG4vKipcbiAqIGBSZXNvdXJjZUxvYWRlcmAgd2hpY2ggZGlyZWN0bHkgdXNlcyB0aGUgZmlsZXN5c3RlbSB0byByZXNvbHZlIHJlc291cmNlcyBzeW5jaHJvbm91c2x5LlxuICovXG5leHBvcnQgY2xhc3MgRmlsZVJlc291cmNlTG9hZGVyIGltcGxlbWVudHMgUmVzb3VyY2VMb2FkZXIge1xuICBsb2FkKHVybDogc3RyaW5nKTogc3RyaW5nIHsgcmV0dXJuIGZzLnJlYWRGaWxlU3luYyh1cmwsICd1dGY4Jyk7IH1cbn1cblxuLyoqXG4gKiBUaGlzIEFuYWx5emVyIHdpbGwgYW5hbHl6ZSB0aGUgZmlsZXMgdGhhdCBoYXZlIGRlY29yYXRlZCBjbGFzc2VzIHRoYXQgbmVlZCB0byBiZSB0cmFuc2Zvcm1lZC5cbiAqL1xuZXhwb3J0IGNsYXNzIERlY29yYXRpb25BbmFseXplciB7XG4gIHJlc291cmNlTG9hZGVyID0gbmV3IEZpbGVSZXNvdXJjZUxvYWRlcigpO1xuICBzY29wZVJlZ2lzdHJ5ID0gbmV3IFNlbGVjdG9yU2NvcGVSZWdpc3RyeSh0aGlzLnR5cGVDaGVja2VyLCB0aGlzLmhvc3QpO1xuICBoYW5kbGVyczogRGVjb3JhdG9ySGFuZGxlcjxhbnksIGFueT5bXSA9IFtcbiAgICBuZXcgQmFzZURlZkRlY29yYXRvckhhbmRsZXIodGhpcy50eXBlQ2hlY2tlciwgdGhpcy5ob3N0KSxcbiAgICBuZXcgQ29tcG9uZW50RGVjb3JhdG9ySGFuZGxlcihcbiAgICAgICAgdGhpcy50eXBlQ2hlY2tlciwgdGhpcy5ob3N0LCB0aGlzLnNjb3BlUmVnaXN0cnksIHRoaXMuaXNDb3JlLCB0aGlzLnJlc291cmNlTG9hZGVyLFxuICAgICAgICB0aGlzLnJvb3REaXJzKSxcbiAgICBuZXcgRGlyZWN0aXZlRGVjb3JhdG9ySGFuZGxlcih0aGlzLnR5cGVDaGVja2VyLCB0aGlzLmhvc3QsIHRoaXMuc2NvcGVSZWdpc3RyeSwgdGhpcy5pc0NvcmUpLFxuICAgIG5ldyBJbmplY3RhYmxlRGVjb3JhdG9ySGFuZGxlcih0aGlzLmhvc3QsIHRoaXMuaXNDb3JlKSxcbiAgICBuZXcgTmdNb2R1bGVEZWNvcmF0b3JIYW5kbGVyKHRoaXMudHlwZUNoZWNrZXIsIHRoaXMuaG9zdCwgdGhpcy5zY29wZVJlZ2lzdHJ5LCB0aGlzLmlzQ29yZSksXG4gICAgbmV3IFBpcGVEZWNvcmF0b3JIYW5kbGVyKHRoaXMudHlwZUNoZWNrZXIsIHRoaXMuaG9zdCwgdGhpcy5zY29wZVJlZ2lzdHJ5LCB0aGlzLmlzQ29yZSksXG4gIF07XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlciwgcHJpdmF0ZSBob3N0OiBOZ2NjUmVmbGVjdGlvbkhvc3QsXG4gICAgICBwcml2YXRlIHJvb3REaXJzOiBzdHJpbmdbXSwgcHJpdmF0ZSBpc0NvcmU6IGJvb2xlYW4pIHt9XG5cbiAgLyoqXG4gICAqIEFuYWx5emUgYSBwcm9ncmFtIHRvIGZpbmQgYWxsIHRoZSBkZWNvcmF0ZWQgZmlsZXMgc2hvdWxkIGJlIHRyYW5zZm9ybWVkLlxuICAgKiBAcGFyYW0gcHJvZ3JhbSBUaGUgcHJvZ3JhbSB3aG9zZSBmaWxlcyBzaG91bGQgYmUgYW5hbHlzZWQuXG4gICAqIEByZXR1cm5zIGEgbWFwIG9mIHRoZSBzb3VyY2UgZmlsZXMgdG8gdGhlIGFuYWx5c2lzIGZvciB0aG9zZSBmaWxlcy5cbiAgICovXG4gIGFuYWx5emVQcm9ncmFtKHByb2dyYW06IHRzLlByb2dyYW0pOiBEZWNvcmF0aW9uQW5hbHlzZXMge1xuICAgIGNvbnN0IGFuYWx5emVkRmlsZXMgPSBuZXcgRGVjb3JhdGlvbkFuYWx5c2VzKCk7XG4gICAgcHJvZ3JhbS5nZXRSb290RmlsZU5hbWVzKCkuZm9yRWFjaChmaWxlTmFtZSA9PiB7XG4gICAgICBjb25zdCBlbnRyeVBvaW50ID0gcHJvZ3JhbS5nZXRTb3VyY2VGaWxlKGZpbGVOYW1lKSAhO1xuICAgICAgY29uc3QgZGVjb3JhdGVkRmlsZXMgPSB0aGlzLmhvc3QuZmluZERlY29yYXRlZEZpbGVzKGVudHJ5UG9pbnQpO1xuICAgICAgZGVjb3JhdGVkRmlsZXMuZm9yRWFjaChcbiAgICAgICAgICBkZWNvcmF0ZWRGaWxlID0+XG4gICAgICAgICAgICAgIGFuYWx5emVkRmlsZXMuc2V0KGRlY29yYXRlZEZpbGUuc291cmNlRmlsZSwgdGhpcy5hbmFseXplRmlsZShkZWNvcmF0ZWRGaWxlKSkpO1xuICAgIH0pO1xuICAgIHJldHVybiBhbmFseXplZEZpbGVzO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuYWx5emUgYSBkZWNvcmF0ZWQgZmlsZSB0byBnZW5lcmF0ZSB0aGUgaW5mb3JtYXRpb24gYWJvdXQgZGVjb3JhdGVkIGNsYXNzZXMgdGhhdFxuICAgKiBzaG91bGQgYmUgY29udmVydGVkIHRvIHVzZSBpdnkgZGVmaW5pdGlvbnMuXG4gICAqIEBwYXJhbSBmaWxlIFRoZSBmaWxlIHRvIGJlIGFuYWx5c2VkIGZvciBkZWNvcmF0ZWQgY2xhc3Nlcy5cbiAgICogQHJldHVybnMgdGhlIGFuYWx5c2lzIG9mIHRoZSBmaWxlXG4gICAqL1xuICBwcm90ZWN0ZWQgYW5hbHl6ZUZpbGUoZmlsZTogRGVjb3JhdGVkRmlsZSk6IERlY29yYXRpb25BbmFseXNpcyB7XG4gICAgY29uc3QgY29uc3RhbnRQb29sID0gbmV3IENvbnN0YW50UG9vbCgpO1xuICAgIGNvbnN0IGFuYWx5emVkQ2xhc3NlcyA9XG4gICAgICAgIGZpbGUuZGVjb3JhdGVkQ2xhc3Nlcy5tYXAoY2xhenogPT4gdGhpcy5hbmFseXplQ2xhc3MoY29uc3RhbnRQb29sLCBjbGF6eikpXG4gICAgICAgICAgICAuZmlsdGVyKGlzRGVmaW5lZCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgYW5hbHl6ZWRDbGFzc2VzLFxuICAgICAgc291cmNlRmlsZTogZmlsZS5zb3VyY2VGaWxlLCBjb25zdGFudFBvb2wsXG4gICAgfTtcbiAgfVxuXG4gIHByb3RlY3RlZCBhbmFseXplQ2xhc3MocG9vbDogQ29uc3RhbnRQb29sLCBjbGF6ejogRGVjb3JhdGVkQ2xhc3MpOiBBbmFseXplZENsYXNzfHVuZGVmaW5lZCB7XG4gICAgY29uc3QgbWF0Y2hpbmdIYW5kbGVycyA9IHRoaXMuaGFuZGxlcnNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAoaGFuZGxlciA9PiAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2g6IGhhbmRsZXIuZGV0ZWN0KGNsYXp6LmRlY2xhcmF0aW9uLCBjbGF6ei5kZWNvcmF0b3JzKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKGlzTWF0Y2hpbmdIYW5kbGVyKTtcblxuICAgIGlmIChtYXRjaGluZ0hhbmRsZXJzLmxlbmd0aCA+IDEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVE9ETy5EaWFnbm9zdGljOiBDbGFzcyBoYXMgbXVsdGlwbGUgQW5ndWxhciBkZWNvcmF0b3JzLicpO1xuICAgIH1cblxuICAgIGlmIChtYXRjaGluZ0hhbmRsZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBjb25zdCB7aGFuZGxlciwgbWF0Y2h9ID0gbWF0Y2hpbmdIYW5kbGVyc1swXTtcbiAgICBjb25zdCB7YW5hbHlzaXMsIGRpYWdub3N0aWNzfSA9IGhhbmRsZXIuYW5hbHl6ZShjbGF6ei5kZWNsYXJhdGlvbiwgbWF0Y2gpO1xuICAgIGxldCBjb21waWxhdGlvbiA9IGhhbmRsZXIuY29tcGlsZShjbGF6ei5kZWNsYXJhdGlvbiwgYW5hbHlzaXMsIHBvb2wpO1xuICAgIGlmICghQXJyYXkuaXNBcnJheShjb21waWxhdGlvbikpIHtcbiAgICAgIGNvbXBpbGF0aW9uID0gW2NvbXBpbGF0aW9uXTtcbiAgICB9XG4gICAgcmV0dXJuIHsuLi5jbGF6eiwgaGFuZGxlciwgYW5hbHlzaXMsIGRpYWdub3N0aWNzLCBjb21waWxhdGlvbn07XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNNYXRjaGluZ0hhbmRsZXI8QSwgTT4oaGFuZGxlcjogUGFydGlhbDxNYXRjaGluZ0hhbmRsZXI8QSwgTT4+KTpcbiAgICBoYW5kbGVyIGlzIE1hdGNoaW5nSGFuZGxlcjxBLCBNPiB7XG4gIHJldHVybiAhIWhhbmRsZXIubWF0Y2g7XG59XG4iXX0=
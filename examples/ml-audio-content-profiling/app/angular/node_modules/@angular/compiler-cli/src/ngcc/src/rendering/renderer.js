(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/src/ngcc/src/rendering/renderer", ["require", "exports", "tslib", "@angular/compiler", "convert-source-map", "fs", "magic-string", "canonical-path", "source-map", "typescript", "@angular/compiler-cli/src/ngtsc/translator", "@angular/compiler-cli/src/ngcc/src/rendering/ngcc_import_manager", "@angular/compiler-cli/src/ngcc/src/constants"], factory);
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
    var convert_source_map_1 = require("convert-source-map");
    var fs_1 = require("fs");
    var magic_string_1 = require("magic-string");
    var canonical_path_1 = require("canonical-path");
    var source_map_1 = require("source-map");
    var ts = require("typescript");
    var translator_1 = require("@angular/compiler-cli/src/ngtsc/translator");
    var ngcc_import_manager_1 = require("@angular/compiler-cli/src/ngcc/src/rendering/ngcc_import_manager");
    var constants_1 = require("@angular/compiler-cli/src/ngcc/src/constants");
    /**
     * A base-class for rendering an `AnalyzedFile`.
     *
     * Package formats have output files that must be rendered differently. Concrete sub-classes must
     * implement the `addImports`, `addDefinitions` and `removeDecorators` abstract methods.
     */
    var Renderer = /** @class */ (function () {
        function Renderer(host, isCore, rewriteCoreImportsTo, sourcePath, targetPath) {
            this.host = host;
            this.isCore = isCore;
            this.rewriteCoreImportsTo = rewriteCoreImportsTo;
            this.sourcePath = sourcePath;
            this.targetPath = targetPath;
        }
        Renderer.prototype.renderProgram = function (program, decorationAnalyses, switchMarkerAnalyses) {
            var _this = this;
            var renderedFiles = [];
            // Transform the source files and source maps.
            program.getSourceFiles().map(function (sourceFile) {
                var decorationAnalysis = decorationAnalyses.get(sourceFile);
                var switchMarkerAnalysis = switchMarkerAnalyses.get(sourceFile);
                // Transform the source files and source maps.
                if (decorationAnalysis || switchMarkerAnalysis) {
                    var targetPath = canonical_path_1.resolve(_this.targetPath, canonical_path_1.relative(_this.sourcePath, sourceFile.fileName));
                    renderedFiles.push.apply(renderedFiles, tslib_1.__spread(_this.renderFile(sourceFile, decorationAnalysis, switchMarkerAnalysis, targetPath)));
                }
            });
            return renderedFiles;
        };
        /**
         * Render the source code and source-map for an Analyzed file.
         * @param decorationAnalysis The analyzed file to render.
         * @param targetPath The absolute path where the rendered file will be written.
         */
        Renderer.prototype.renderFile = function (sourceFile, decorationAnalysis, switchMarkerAnalysis, targetPath) {
            var _this = this;
            var input = this.extractSourceMap(sourceFile);
            var outputText = new magic_string_1.default(input.source);
            if (switchMarkerAnalysis) {
                this.rewriteSwitchableDeclarations(outputText, switchMarkerAnalysis.sourceFile, switchMarkerAnalysis.declarations);
            }
            if (decorationAnalysis) {
                var importManager_1 = new ngcc_import_manager_1.NgccImportManager(!this.rewriteCoreImportsTo, this.isCore, constants_1.IMPORT_PREFIX);
                var decoratorsToRemove_1 = new Map();
                decorationAnalysis.analyzedClasses.forEach(function (clazz) {
                    var renderedDefinition = renderDefinitions(decorationAnalysis.sourceFile, clazz, importManager_1);
                    _this.addDefinitions(outputText, clazz, renderedDefinition);
                    _this.trackDecorators(clazz.decorators, decoratorsToRemove_1);
                });
                this.addConstants(outputText, renderConstantPool(decorationAnalysis.sourceFile, decorationAnalysis.constantPool, importManager_1), decorationAnalysis.sourceFile);
                this.addImports(outputText, importManager_1.getAllImports(decorationAnalysis.sourceFile.fileName, this.rewriteCoreImportsTo));
                // TODO: remove contructor param metadata and property decorators (we need info from the
                // handlers to do this)
                this.removeDecorators(outputText, decoratorsToRemove_1);
            }
            var _a = this.renderSourceAndMap(sourceFile, input, outputText, targetPath), source = _a.source, map = _a.map;
            var renderedFiles = [source];
            if (map) {
                renderedFiles.push(map);
            }
            return renderedFiles;
        };
        /**
         * Add the decorator nodes that are to be removed to a map
         * So that we can tell if we should remove the entire decorator property
         */
        Renderer.prototype.trackDecorators = function (decorators, decoratorsToRemove) {
            decorators.forEach(function (dec) {
                var decoratorArray = dec.node.parent;
                if (!decoratorsToRemove.has(decoratorArray)) {
                    decoratorsToRemove.set(decoratorArray, [dec.node]);
                }
                else {
                    decoratorsToRemove.get(decoratorArray).push(dec.node);
                }
            });
        };
        /**
         * Get the map from the source (note whether it is inline or external)
         */
        Renderer.prototype.extractSourceMap = function (file) {
            var inline = convert_source_map_1.commentRegex.test(file.text);
            var external = convert_source_map_1.mapFileCommentRegex.test(file.text);
            if (inline) {
                var inlineSourceMap = convert_source_map_1.fromSource(file.text);
                return {
                    source: convert_source_map_1.removeComments(file.text).replace(/\n\n$/, '\n'),
                    map: inlineSourceMap,
                    isInline: true,
                };
            }
            else if (external) {
                var externalSourceMap = null;
                try {
                    externalSourceMap = convert_source_map_1.fromMapFileSource(file.text, canonical_path_1.dirname(file.fileName));
                }
                catch (e) {
                    if (e.code === 'ENOENT') {
                        console.warn("The external map file specified in the source code comment \"" + e.path + "\" was not found on the file system.");
                        var mapPath = file.fileName + '.map';
                        if (canonical_path_1.basename(e.path) !== canonical_path_1.basename(mapPath) && fs_1.statSync(mapPath).isFile()) {
                            console.warn("Guessing the map file name from the source file name: \"" + canonical_path_1.basename(mapPath) + "\"");
                            try {
                                externalSourceMap = convert_source_map_1.fromObject(JSON.parse(fs_1.readFileSync(mapPath, 'utf8')));
                            }
                            catch (e) {
                                console.error(e);
                            }
                        }
                    }
                }
                return {
                    source: convert_source_map_1.removeMapFileComments(file.text).replace(/\n\n$/, '\n'),
                    map: externalSourceMap,
                    isInline: false,
                };
            }
            else {
                return { source: file.text, map: null, isInline: false };
            }
        };
        /**
         * Merge the input and output source-maps, replacing the source-map comment in the output file
         * with an appropriate source-map comment pointing to the merged source-map.
         */
        Renderer.prototype.renderSourceAndMap = function (sourceFile, input, output, outputPath) {
            var outputMapPath = outputPath + ".map";
            var outputMap = output.generateMap({
                source: sourceFile.fileName,
                includeContent: true,
            });
            // we must set this after generation as magic string does "manipulation" on the path
            outputMap.file = outputPath;
            var mergedMap = mergeSourceMaps(input.map && input.map.toObject(), JSON.parse(outputMap.toString()));
            if (input.isInline) {
                return {
                    source: { path: outputPath, contents: output.toString() + "\n" + mergedMap.toComment() },
                    map: null
                };
            }
            else {
                return {
                    source: {
                        path: outputPath,
                        contents: output.toString() + "\n" + convert_source_map_1.generateMapFileComment(outputMapPath)
                    },
                    map: { path: outputMapPath, contents: mergedMap.toJSON() }
                };
            }
        };
        return Renderer;
    }());
    exports.Renderer = Renderer;
    /**
     * Merge the two specified source-maps into a single source-map that hides the intermediate
     * source-map.
     * E.g. Consider these mappings:
     *
     * ```
     * OLD_SRC -> OLD_MAP -> INTERMEDIATE_SRC -> NEW_MAP -> NEW_SRC
     * ```
     *
     * this will be replaced with:
     *
     * ```
     * OLD_SRC -> MERGED_MAP -> NEW_SRC
     * ```
     */
    function mergeSourceMaps(oldMap, newMap) {
        if (!oldMap) {
            return convert_source_map_1.fromObject(newMap);
        }
        var oldMapConsumer = new source_map_1.SourceMapConsumer(oldMap);
        var newMapConsumer = new source_map_1.SourceMapConsumer(newMap);
        var mergedMapGenerator = source_map_1.SourceMapGenerator.fromSourceMap(newMapConsumer);
        mergedMapGenerator.applySourceMap(oldMapConsumer);
        var merged = convert_source_map_1.fromJSON(mergedMapGenerator.toString());
        return merged;
    }
    exports.mergeSourceMaps = mergeSourceMaps;
    /**
     * Render the constant pool as source code for the given class.
     */
    function renderConstantPool(sourceFile, constantPool, imports) {
        var printer = ts.createPrinter();
        return constantPool.statements.map(function (stmt) { return translator_1.translateStatement(stmt, imports); })
            .map(function (stmt) { return printer.printNode(ts.EmitHint.Unspecified, stmt, sourceFile); })
            .join('\n');
    }
    exports.renderConstantPool = renderConstantPool;
    /**
     * Render the definitions as source code for the given class.
     * @param sourceFile The file containing the class to process.
     * @param clazz The class whose definitions are to be rendered.
     * @param compilation The results of analyzing the class - this is used to generate the rendered
     * definitions.
     * @param imports An object that tracks the imports that are needed by the rendered definitions.
     */
    function renderDefinitions(sourceFile, analyzedClass, imports) {
        var printer = ts.createPrinter();
        var name = analyzedClass.declaration.name;
        var definitions = analyzedClass.compilation
            .map(function (c) { return c.statements.map(function (statement) { return translator_1.translateStatement(statement, imports); })
            .concat(translator_1.translateStatement(createAssignmentStatement(name, c.name, c.initializer), imports))
            .map(function (statement) {
            return printer.printNode(ts.EmitHint.Unspecified, statement, sourceFile);
        })
            .join('\n'); })
            .join('\n');
        return definitions;
    }
    exports.renderDefinitions = renderDefinitions;
    /**
     * Create an Angular AST statement node that contains the assignment of the
     * compiled decorator to be applied to the class.
     * @param analyzedClass The info about the class whose statement we want to create.
     */
    function createAssignmentStatement(receiverName, propName, initializer) {
        var receiver = new compiler_1.WrappedNodeExpr(receiverName);
        return new compiler_1.WritePropExpr(receiver, propName, initializer).toStmt();
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvc3JjL25nY2Mvc3JjL3JlbmRlcmluZy9yZW5kZXJlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7SUFBQTs7Ozs7O09BTUc7SUFDSCw4Q0FBc0c7SUFDdEcseURBQTZNO0lBQzdNLHlCQUEwQztJQUMxQyw2Q0FBdUM7SUFDdkMsaURBQW9FO0lBQ3BFLHlDQUErRTtJQUMvRSwrQkFBaUM7SUFHakMseUVBQTZEO0lBQzdELHdHQUF3RDtJQUd4RCwwRUFBMkM7SUFxQzNDOzs7OztPQUtHO0lBQ0g7UUFDRSxrQkFDYyxJQUF3QixFQUFZLE1BQWUsRUFDbkQsb0JBQXdDLEVBQVksVUFBa0IsRUFDdEUsVUFBa0I7WUFGbEIsU0FBSSxHQUFKLElBQUksQ0FBb0I7WUFBWSxXQUFNLEdBQU4sTUFBTSxDQUFTO1lBQ25ELHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBb0I7WUFBWSxlQUFVLEdBQVYsVUFBVSxDQUFRO1lBQ3RFLGVBQVUsR0FBVixVQUFVLENBQVE7UUFBRyxDQUFDO1FBRXBDLGdDQUFhLEdBQWIsVUFDSSxPQUFtQixFQUFFLGtCQUFzQyxFQUMzRCxvQkFBMEM7WUFGOUMsaUJBaUJDO1lBZEMsSUFBTSxhQUFhLEdBQWUsRUFBRSxDQUFDO1lBQ3JDLDhDQUE4QztZQUM5QyxPQUFPLENBQUMsY0FBYyxFQUFFLENBQUMsR0FBRyxDQUFDLFVBQUEsVUFBVTtnQkFDckMsSUFBTSxrQkFBa0IsR0FBRyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQzlELElBQU0sb0JBQW9CLEdBQUcsb0JBQW9CLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUVsRSw4Q0FBOEM7Z0JBQzlDLElBQUksa0JBQWtCLElBQUksb0JBQW9CLEVBQUU7b0JBQzlDLElBQU0s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QUUsT0FBTyxDQUFDLEVBQXRDLENBQXNDLENBQUM7YUFDaEUsTUFBTSxDQUFDLCtCQUFrQixDQUN0Qix5QkFBeUIsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsV0FBVyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7YUFDcEUsR0FBRyxDQUNBLFVBQUEsU0FBUztZQUNMLE9BQUEsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxTQUFTLEVBQUUsVUFBVSxDQUFDO1FBQWpFLENBQWlFLENBQUM7YUFDekUsSUFBSSxDQUFDLElBQUksQ0FBQyxFQU5mLENBTWUsQ0FBQzthQUN4QixJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEIsT0FBTyxXQUFXLENBQUM7SUFDckIsQ0FBQztJQWhCRCw4Q0FnQkM7SUFFRDs7OztPQUlHO0lBQ0gsU0FBUyx5QkFBeUIsQ0FDOUIsWUFBZ0MsRUFBRSxRQUFnQixFQUFFLFdBQXVCO1FBQzdFLElBQU0sUUFBUSxHQUFHLElBQUksMEJBQWUsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNuRCxPQUFPLElBQUksd0JBQWEsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLFdBQVcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ3JFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge0NvbnN0YW50UG9vbCwgRXhwcmVzc2lvbiwgU3RhdGVtZW50LCBXcmFwcGVkTm9kZUV4cHIsIFdyaXRlUHJvcEV4cHJ9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcbmltcG9ydCB7U291cmNlTWFwQ29udmVydGVyLCBjb21tZW50UmVnZXgsIGZyb21KU09OLCBmcm9tTWFwRmlsZVNvdXJjZSwgZnJvbU9iamVjdCwgZnJvbVNvdXJjZSwgZ2VuZXJhdGVNYXBGaWxlQ29tbWVudCwgbWFwRmlsZUNvbW1lbnRSZWdleCwgcmVtb3ZlQ29tbWVudHMsIHJlbW92ZU1hcEZpbGVDb21tZW50c30gZnJvbSAnY29udmVydC1zb3VyY2UtbWFwJztcbmltcG9ydCB7cmVhZEZpbGVTeW5jLCBzdGF0U3luY30gZnJvbSAnZnMnO1xuaW1wb3J0IE1hZ2ljU3RyaW5nIGZyb20gJ21hZ2ljLXN0cmluZyc7XG5pbXBvcnQge2Jhc2VuYW1lLCBkaXJuYW1lLCByZWxhdGl2ZSwgcmVzb2x2ZX0gZnJvbSAnY2Fub25pY2FsLXBhdGgnO1xuaW1wb3J0IHtTb3VyY2VNYXBDb25zdW1lciwgU291cmNlTWFwR2VuZXJhdG9yLCBSYXdTb3VyY2VNYXB9IGZyb20gJ3NvdXJjZS1tYXAnO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7RGVjb3JhdG9yfSBmcm9tICcuLi8uLi8uLi9uZ3RzYy9ob3N0JztcbmltcG9ydCB7dHJhbnNsYXRlU3RhdGVtZW50fSBmcm9tICcuLi8uLi8uLi9uZ3RzYy90cmFuc2xhdG9yJztcbmltcG9ydCB7TmdjY0ltcG9ydE1hbmFnZXJ9IGZyb20gJy4vbmdjY19pbXBvcnRfbWFuYWdlcic7XG5pbXBvcnQge0FuYWx5emVkQ2xhc3MsIERlY29yYXRpb25BbmFseXNpcywgRGVjb3JhdGlvbkFuYWx5c2VzfSBmcm9tICcuLi9hbmFseXNpcy9kZWNvcmF0aW9uX2FuYWx5emVyJztcbmltcG9ydCB7U3dpdGNoTWFya2VyQW5hbHlzZXMsIFN3aXRjaE1hcmtlckFuYWx5c2lzfSBmcm9tICcuLi9hbmFseXNpcy9zd2l0Y2hfbWFya2VyX2FuYWx5emVyJztcbmltcG9ydCB7SU1QT1JUX1BSRUZJWH0gZnJvbSAnLi4vY29uc3RhbnRzJztcbmltcG9ydCB7TmdjY1JlZmxlY3Rpb25Ib3N0LCBTd2l0Y2hhYmxlVmFyaWFibGVEZWNsYXJhdGlvbn0gZnJvbSAnLi4vaG9zdC9uZ2NjX2hvc3QnO1xuXG5pbnRlcmZhY2UgU291cmNlTWFwSW5mbyB7XG4gIHNvdXJjZTogc3RyaW5nO1xuICBtYXA6IFNvdXJjZU1hcENvbnZlcnRlcnxudWxsO1xuICBpc0lubGluZTogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBUaGUgcmVzdWx0cyBvZiByZW5kZXJpbmcgYW4gYW5hbHl6ZWQgZmlsZS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBSZW5kZXJSZXN1bHQge1xuICAvKipcbiAgICogVGhlIHJlbmRlcmVkIHNvdXJjZSBmaWxlLlxuICAgKi9cbiAgc291cmNlOiBGaWxlSW5mbztcbiAgLyoqXG4gICAqIFRoZSByZW5kZXJlZCBzb3VyY2UgbWFwIGZpbGUuXG4gICAqL1xuICBtYXA6IEZpbGVJbmZvfG51bGw7XG59XG5cbi8qKlxuICogSW5mb3JtYXRpb24gYWJvdXQgYSBmaWxlIHRoYXQgaGFzIGJlZW4gcmVuZGVyZWQuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRmlsZUluZm8ge1xuICAvKipcbiAgICogUGF0aCB0byB3aGVyZSB0aGUgZmlsZSBzaG91bGQgYmUgd3JpdHRlbi5cbiAgICovXG4gIHBhdGg6IHN0cmluZztcbiAgLyoqXG4gICAqIFRoZSBjb250ZW50cyBvZiB0aGUgZmlsZSB0byBiZSBiZSB3cml0dGVuLlxuICAgKi9cbiAgY29udGVudHM6IHN0cmluZztcbn1cblxuLyoqXG4gKiBBIGJhc2UtY2xhc3MgZm9yIHJlbmRlcmluZyBhbiBgQW5hbHl6ZWRGaWxlYC5cbiAqXG4gKiBQYWNrYWdlIGZvcm1hdHMgaGF2ZSBvdXRwdXQgZmlsZXMgdGhhdCBtdXN0IGJlIHJlbmRlcmVkIGRpZmZlcmVudGx5LiBDb25jcmV0ZSBzdWItY2xhc3NlcyBtdXN0XG4gKiBpbXBsZW1lbnQgdGhlIGBhZGRJbXBvcnRzYCwgYGFkZERlZmluaXRpb25zYCBhbmQgYHJlbW92ZURlY29yYXRvcnNgIGFic3RyYWN0IG1ldGhvZHMuXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBSZW5kZXJlciB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJvdGVjdGVkIGhvc3Q6IE5nY2NSZWZsZWN0aW9uSG9zdCwgcHJvdGVjdGVkIGlzQ29yZTogYm9vbGVhbixcbiAgICAgIHByb3RlY3RlZCByZXdyaXRlQ29yZUltcG9ydHNUbzogdHMuU291cmNlRmlsZXxudWxsLCBwcm90ZWN0ZWQgc291cmNlUGF0aDogc3RyaW5nLFxuICAgICAgcHJvdGVjdGVkIHRhcmdldFBhdGg6IHN0cmluZykge31cblxuICByZW5kZXJQcm9ncmFtKFxuICAgICAgcHJvZ3JhbTogdHMuUHJvZ3JhbSwgZGVjb3JhdGlvbkFuYWx5c2VzOiBEZWNvcmF0aW9uQW5hbHlzZXMsXG4gICAgICBzd2l0Y2hNYXJrZXJBbmFseXNlczogU3dpdGNoTWFya2VyQW5hbHlzZXMpOiBGaWxlSW5mb1tdIHtcbiAgICBjb25zdCByZW5kZXJlZEZpbGVzOiBGaWxlSW5mb1tdID0gW107XG4gICAgLy8gVHJhbnNmb3JtIHRoZSBzb3VyY2UgZmlsZXMgYW5kIHNvdXJjZSBtYXBzLlxuICAgIHByb2dyYW0uZ2V0U291cmNlRmlsZXMoKS5tYXAoc291cmNlRmlsZSA9PiB7XG4gICAgICBjb25zdCBkZWNvcmF0aW9uQW5hbHlzaXMgPSBkZWNvcmF0aW9uQW5hbHlzZXMuZ2V0KHNvdXJjZUZpbGUpO1xuICAgICAgY29uc3Qgc3dpdGNoTWFya2VyQW5hbHlzaXMgPSBzd2l0Y2hNYXJrZXJBbmFseXNlcy5nZXQoc291cmNlRmlsZSk7XG5cbiAgICAgIC8vIFRyYW5zZm9ybSB0aGUgc291cmNlIGZpbGVzIGFuZCBzb3VyY2UgbWFwcy5cbiAgICAgIGlmIChkZWNvcmF0aW9uQW5hbHlzaXMgfHwgc3dpdGNoTWFya2VyQW5hbHlzaXMpIHtcbiAgICAgICAgY29uc3QgdGFyZ2V0UGF0aCA9IHJlc29sdmUodGhpcy50YXJnZXRQYXRoLCByZWxhdGl2ZSh0aGlzLnNvdXJjZVBhdGgsIHNvdXJjZUZpbGUuZmlsZU5hbWUpKTtcbiAgICAgICAgcmVuZGVyZWRGaWxlcy5wdXNoKFxuICAgICAgICAgICAgLi4udGhpcy5yZW5kZXJGaWxlKHNvdXJjZUZpbGUsIGRlY29yYXRpb25BbmFseXNpcywgc3dpdGNoTWFya2VyQW5hbHlzaXMsIHRhcmdldFBhdGgpKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmVuZGVyZWRGaWxlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW5kZXIgdGhlIHNvdXJjZSBjb2RlIGFuZCBzb3VyY2UtbWFwIGZvciBhbiBBbmFseXplZCBmaWxlLlxuICAgKiBAcGFyYW0gZGVjb3JhdGlvbkFuYWx5c2lzIFRoZSBhbmFseXplZCBmaWxlIHRvIHJlbmRlci5cbiAgICogQHBhcmFtIHRhcmdldFBhdGggVGhlIGFic29sdXRlIHBhdGggd2hlcmUgdGhlIHJlbmRlcmVkIGZpbGUgd2lsbCBiZSB3cml0dGVuLlxuICAgKi9cbiAgcmVuZGVyRmlsZShcbiAgICAgIHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUsIGRlY29yYXRpb25BbmFseXNpczogRGVjb3JhdGlvbkFuYWx5c2lzfHVuZGVmaW5lZCxcbiAgICAgIHN3aXRjaE1hcmtlckFuYWx5c2lzOiBTd2l0Y2hNYXJrZXJBbmFseXNpc3x1bmRlZmluZWQsIHRhcmdldFBhdGg6IHN0cmluZyk6IEZpbGVJbmZvW10ge1xuICAgIGNvbnN0IGlucHV0ID0gdGhpcy5leHRyYWN0U291cmNlTWFwKHNvdXJjZUZpbGUpO1xuICAgIGNvbnN0IG91dHB1dFRleHQgPSBuZXcgTWFnaWNTdHJpbmcoaW5wdXQuc291cmNlKTtcblxuICAgIGlmIChzd2l0Y2hNYXJrZXJBbmFseXNpcykge1xuICAgICAgdGhpcy5yZXdyaXRlU3dpdGNoYWJsZURlY2xhcmF0aW9ucyhcbiAgICAgICAgICBvdXRwdXRUZXh0LCBzd2l0Y2hNYXJrZXJBbmFseXNpcy5zb3VyY2VGaWxlLCBzd2l0Y2hNYXJrZXJBbmFseXNpcy5kZWNsYXJhdGlvbnMpO1xuICAgIH1cblxuICAgIGlmIChkZWNvcmF0aW9uQW5hbHlzaXMpIHtcbiAgICAgIGNvbnN0IGltcG9ydE1hbmFnZXIgPVxuICAgICAgICAgIG5ldyBOZ2NjSW1wb3J0TWFuYWdlcighdGhpcy5yZXdyaXRlQ29yZUltcG9ydHNUbywgdGhpcy5pc0NvcmUsIElNUE9SVF9QUkVGSVgpO1xuICAgICAgY29uc3QgZGVjb3JhdG9yc1RvUmVtb3ZlID0gbmV3IE1hcDx0cy5Ob2RlLCB0cy5Ob2RlW10+KCk7XG5cbiAgICAgIGRlY29yYXRpb25BbmFseXNpcy5hbmFseXplZENsYXNzZXMuZm9yRWFjaChjbGF6eiA9PiB7XG4gICAgICAgIGNvbnN0IHJlbmRlcmVkRGVmaW5pdGlvbiA9XG4gICAgICAgICAgICByZW5kZXJEZWZpbml0aW9ucyhkZWNvcmF0aW9uQW5hbHlzaXMuc291cmNlRmlsZSwgY2xhenosIGltcG9ydE1hbmFnZXIpO1xuICAgICAgICB0aGlzLmFkZERlZmluaXRpb25zKG91dHB1dFRleHQsIGNsYXp6LCByZW5kZXJlZERlZmluaXRpb24pO1xuICAgICAgICB0aGlzLnRyYWNrRGVjb3JhdG9ycyhjbGF6ei5kZWNvcmF0b3JzLCBkZWNvcmF0b3JzVG9SZW1vdmUpO1xuICAgICAgfSk7XG5cbiAgICAgIHRoaXMuYWRkQ29uc3RhbnRzKFxuICAgICAgICAgIG91dHB1dFRleHQsXG4gICAgICAgICAgcmVuZGVyQ29uc3RhbnRQb29sKFxuICAgICAgICAgICAgICBkZWNvcmF0aW9uQW5hbHlzaXMuc291cmNlRmlsZSwgZGVjb3JhdGlvbkFuYWx5c2lzLmNvbnN0YW50UG9vbCwgaW1wb3J0TWFuYWdlciksXG4gICAgICAgICAgZGVjb3JhdGlvbkFuYWx5c2lzLnNvdXJjZUZpbGUpO1xuXG4gICAgICB0aGlzLmFkZEltcG9ydHMoXG4gICAgICAgICAgb3V0cHV0VGV4dCwgaW1wb3J0TWFuYWdlci5nZXRBbGxJbXBvcnRzKFxuICAgICAgICAgICAgICAgICAgICAgICAgICBkZWNvcmF0aW9uQW5hbHlzaXMuc291cmNlRmlsZS5maWxlTmFtZSwgdGhpcy5yZXdyaXRlQ29yZUltcG9ydHNUbykpO1xuXG4gICAgICAvLyBUT0RPOiByZW1vdmUgY29udHJ1Y3RvciBwYXJhbSBtZXRhZGF0YSBhbmQgcHJvcGVydHkgZGVjb3JhdG9ycyAod2UgbmVlZCBpbmZvIGZyb20gdGhlXG4gICAgICAvLyBoYW5kbGVycyB0byBkbyB0aGlzKVxuICAgICAgdGhpcy5yZW1vdmVEZWNvcmF0b3JzKG91dHB1dFRleHQsIGRlY29yYXRvcnNUb1JlbW92ZSk7XG4gICAgfVxuXG4gICAgY29uc3Qge3NvdXJjZSwgbWFwfSA9IHRoaXMucmVuZGVyU291cmNlQW5kTWFwKHNvdXJjZUZpbGUsIGlucHV0LCBvdXRwdXRUZXh0LCB0YXJnZXRQYXRoKTtcbiAgICBjb25zdCByZW5kZXJlZEZpbGVzID0gW3NvdXJjZV07XG4gICAgaWYgKG1hcCkge1xuICAgICAgcmVuZGVyZWRGaWxlcy5wdXNoKG1hcCk7XG4gICAgfVxuICAgIHJldHVybiByZW5kZXJlZEZpbGVzO1xuICB9XG5cbiAgcHJvdGVjdGVkIGFic3RyYWN0IGFkZENvbnN0YW50cyhvdXRwdXQ6IE1hZ2ljU3RyaW5nLCBjb25zdGFudHM6IHN0cmluZywgZmlsZTogdHMuU291cmNlRmlsZSk6XG4gICAgICB2b2lkO1xuICBwcm90ZWN0ZWQgYWJzdHJhY3QgYWRkSW1wb3J0cyhvdXRwdXQ6IE1hZ2ljU3RyaW5nLCBpbXBvcnRzOiB7bmFtZTogc3RyaW5nLCBhczogc3RyaW5nfVtdKTogdm9pZDtcbiAgcHJvdGVjdGVkIGFic3RyYWN0IGFkZERlZmluaXRpb25zKFxuICAgICAgb3V0cHV0OiBNYWdpY1N0cmluZywgYW5hbHl6ZWRDbGFzczogQW5hbHl6ZWRDbGFzcywgZGVmaW5pdGlvbnM6IHN0cmluZyk6IHZvaWQ7XG4gIHByb3RlY3RlZCBhYnN0cmFjdCByZW1vdmVEZWNvcmF0b3JzKFxuICAgICAgb3V0cHV0OiBNYWdpY1N0cmluZywgZGVjb3JhdG9yc1RvUmVtb3ZlOiBNYXA8dHMuTm9kZSwgdHMuTm9kZVtdPik6IHZvaWQ7XG4gIHByb3RlY3RlZCBhYnN0cmFjdCByZXdyaXRlU3dpdGNoYWJsZURlY2xhcmF0aW9ucyhcbiAgICAgIG91dHB1dFRleHQ6IE1hZ2ljU3RyaW5nLCBzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlLFxuICAgICAgZGVjbGFyYXRpb25zOiBTd2l0Y2hhYmxlVmFyaWFibGVEZWNsYXJhdGlvbltdKTogdm9pZDtcblxuICAvKipcbiAgICogQWRkIHRoZSBkZWNvcmF0b3Igbm9kZXMgdGhhdCBhcmUgdG8gYmUgcmVtb3ZlZCB0byBhIG1hcFxuICAgKiBTbyB0aGF0IHdlIGNhbiB0ZWxsIGlmIHdlIHNob3VsZCByZW1vdmUgdGhlIGVudGlyZSBkZWNvcmF0b3IgcHJvcGVydHlcbiAgICovXG4gIHByb3RlY3RlZCB0cmFja0RlY29yYXRvcnMoZGVjb3JhdG9yczogRGVjb3JhdG9yW10sIGRlY29yYXRvcnNUb1JlbW92ZTogTWFwPHRzLk5vZGUsIHRzLk5vZGVbXT4pOlxuICAgICAgdm9pZCB7XG4gICAgZGVjb3JhdG9ycy5mb3JFYWNoKGRlYyA9PiB7XG4gICAgICBjb25zdCBkZWNvcmF0b3JBcnJheSA9IGRlYy5ub2RlLnBhcmVudCAhO1xuICAgICAgaWYgKCFkZWNvcmF0b3JzVG9SZW1vdmUuaGFzKGRlY29yYXRvckFycmF5KSkge1xuICAgICAgICBkZWNvcmF0b3JzVG9SZW1vdmUuc2V0KGRlY29yYXRvckFycmF5LCBbZGVjLm5vZGVdKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRlY29yYXRvcnNUb1JlbW92ZS5nZXQoZGVjb3JhdG9yQXJyYXkpICEucHVzaChkZWMubm9kZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBtYXAgZnJvbSB0aGUgc291cmNlIChub3RlIHdoZXRoZXIgaXQgaXMgaW5saW5lIG9yIGV4dGVybmFsKVxuICAgKi9cbiAgcHJvdGVjdGVkIGV4dHJhY3RTb3VyY2VNYXAoZmlsZTogdHMuU291cmNlRmlsZSk6IFNvdXJjZU1hcEluZm8ge1xuICAgIGNvbnN0IGlubGluZSA9IGNvbW1lbnRSZWdleC50ZXN0KGZpbGUudGV4dCk7XG4gICAgY29uc3QgZXh0ZXJuYWwgPSBtYXBGaWxlQ29tbWVudFJlZ2V4LnRlc3QoZmlsZS50ZXh0KTtcblxuICAgIGlmIChpbmxpbmUpIHtcbiAgICAgIGNvbnN0IGlubGluZVNvdXJjZU1hcCA9IGZyb21Tb3VyY2UoZmlsZS50ZXh0KTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHNvdXJjZTogcmVtb3ZlQ29tbWVudHMoZmlsZS50ZXh0KS5yZXBsYWNlKC9cXG5cXG4kLywgJ1xcbicpLFxuICAgICAgICBtYXA6IGlubGluZVNvdXJjZU1hcCxcbiAgICAgICAgaXNJbmxpbmU6IHRydWUsXG4gICAgICB9O1xuICAgIH0gZWxzZSBpZiAoZXh0ZXJuYWwpIHtcbiAgICAgIGxldCBleHRlcm5hbFNvdXJjZU1hcDogU291cmNlTWFwQ29udmVydGVyfG51bGwgPSBudWxsO1xuICAgICAgdHJ5IHtcbiAgICAgICAgZXh0ZXJuYWxTb3VyY2VNYXAgPSBmcm9tTWFwRmlsZVNvdXJjZShmaWxlLnRleHQsIGRpcm5hbWUoZmlsZS5maWxlTmFtZSkpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBpZiAoZS5jb2RlID09PSAnRU5PRU5UJykge1xuICAgICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICAgICAgYFRoZSBleHRlcm5hbCBtYXAgZmlsZSBzcGVjaWZpZWQgaW4gdGhlIHNvdXJjZSBjb2RlIGNvbW1lbnQgXCIke2UucGF0aH1cIiB3YXMgbm90IGZvdW5kIG9uIHRoZSBmaWxlIHN5c3RlbS5gKTtcbiAgICAgICAgICBjb25zdCBtYXBQYXRoID0gZmlsZS5maWxlTmFtZSArICcubWFwJztcbiAgICAgICAgICBpZiAoYmFzZW5hbWUoZS5wYXRoKSAhPT0gYmFzZW5hbWUobWFwUGF0aCkgJiYgc3RhdFN5bmMobWFwUGF0aCkuaXNGaWxlKCkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICAgICAgICBgR3Vlc3NpbmcgdGhlIG1hcCBmaWxlIG5hbWUgZnJvbSB0aGUgc291cmNlIGZpbGUgbmFtZTogXCIke2Jhc2VuYW1lKG1hcFBhdGgpfVwiYCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBleHRlcm5hbFNvdXJjZU1hcCA9IGZyb21PYmplY3QoSlNPTi5wYXJzZShyZWFkRmlsZVN5bmMobWFwUGF0aCwgJ3V0ZjgnKSkpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc291cmNlOiByZW1vdmVNYXBGaWxlQ29tbWVudHMoZmlsZS50ZXh0KS5yZXBsYWNlKC9cXG5cXG4kLywgJ1xcbicpLFxuICAgICAgICBtYXA6IGV4dGVybmFsU291cmNlTWFwLFxuICAgICAgICBpc0lubGluZTogZmFsc2UsXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4ge3NvdXJjZTogZmlsZS50ZXh0LCBtYXA6IG51bGwsIGlzSW5saW5lOiBmYWxzZX07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE1lcmdlIHRoZSBpbnB1dCBhbmQgb3V0cHV0IHNvdXJjZS1tYXBzLCByZXBsYWNpbmcgdGhlIHNvdXJjZS1tYXAgY29tbWVudCBpbiB0aGUgb3V0cHV0IGZpbGVcbiAgICogd2l0aCBhbiBhcHByb3ByaWF0ZSBzb3VyY2UtbWFwIGNvbW1lbnQgcG9pbnRpbmcgdG8gdGhlIG1lcmdlZCBzb3VyY2UtbWFwLlxuICAgKi9cbiAgcHJvdGVjdGVkIHJlbmRlclNvdXJjZUFuZE1hcChcbiAgICAgIHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUsIGlucHV0OiBTb3VyY2VNYXBJbmZvLCBvdXRwdXQ6IE1hZ2ljU3RyaW5nLFxuICAgICAgb3V0cHV0UGF0aDogc3RyaW5nKTogUmVuZGVyUmVzdWx0IHtcbiAgICBjb25zdCBvdXRwdXRNYXBQYXRoID0gYCR7b3V0cHV0UGF0aH0ubWFwYDtcbiAgICBjb25zdCBvdXRwdXRNYXAgPSBvdXRwdXQuZ2VuZXJhdGVNYXAoe1xuICAgICAgc291cmNlOiBzb3VyY2VGaWxlLmZpbGVOYW1lLFxuICAgICAgaW5jbHVkZUNvbnRlbnQ6IHRydWUsXG4gICAgICAvLyBoaXJlczogdHJ1ZSAvLyBUT0RPOiBUaGlzIHJlc3VsdHMgaW4gYWNjdXJhdGUgYnV0IGh1Z2Ugc291cmNlbWFwcy4gSW5zdGVhZCB3ZSBzaG91bGQgZml4XG4gICAgICAvLyB0aGUgbWVyZ2UgYWxnb3JpdGhtLlxuICAgIH0pO1xuXG4gICAgLy8gd2UgbXVzdCBzZXQgdGhpcyBhZnRlciBnZW5lcmF0aW9uIGFzIG1hZ2ljIHN0cmluZyBkb2VzIFwibWFuaXB1bGF0aW9uXCIgb24gdGhlIHBhdGhcbiAgICBvdXRwdXRNYXAuZmlsZSA9IG91dHB1dFBhdGg7XG5cbiAgICBjb25zdCBtZXJnZWRNYXAgPVxuICAgICAgICBtZXJnZVNvdXJjZU1hcHMoaW5wdXQubWFwICYmIGlucHV0Lm1hcC50b09iamVjdCgpLCBKU09OLnBhcnNlKG91dHB1dE1hcC50b1N0cmluZygpKSk7XG5cbiAgICBpZiAoaW5wdXQuaXNJbmxpbmUpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHNvdXJjZToge3BhdGg6IG91dHB1dFBhdGgsIGNvbnRlbnRzOiBgJHtvdXRwdXQudG9TdHJpbmcoKX1cXG4ke21lcmdlZE1hcC50b0NvbW1lbnQoKX1gfSxcbiAgICAgICAgbWFwOiBudWxsXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzb3VyY2U6IHtcbiAgICAgICAgICBwYXRoOiBvdXRwdXRQYXRoLFxuICAgICAgICAgIGNvbnRlbnRzOiBgJHtvdXRwdXQudG9TdHJpbmcoKX1cXG4ke2dlbmVyYXRlTWFwRmlsZUNvbW1lbnQob3V0cHV0TWFwUGF0aCl9YFxuICAgICAgICB9LFxuICAgICAgICBtYXA6IHtwYXRoOiBvdXRwdXRNYXBQYXRoLCBjb250ZW50czogbWVyZ2VkTWFwLnRvSlNPTigpfVxuICAgICAgfTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBNZXJnZSB0aGUgdHdvIHNwZWNpZmllZCBzb3VyY2UtbWFwcyBpbnRvIGEgc2luZ2xlIHNvdXJjZS1tYXAgdGhhdCBoaWRlcyB0aGUgaW50ZXJtZWRpYXRlXG4gKiBzb3VyY2UtbWFwLlxuICogRS5nLiBDb25zaWRlciB0aGVzZSBtYXBwaW5nczpcbiAqXG4gKiBgYGBcbiAqIE9MRF9TUkMgLT4gT0xEX01BUCAtPiBJTlRFUk1FRElBVEVfU1JDIC0+IE5FV19NQVAgLT4gTkVXX1NSQ1xuICogYGBgXG4gKlxuICogdGhpcyB3aWxsIGJlIHJlcGxhY2VkIHdpdGg6XG4gKlxuICogYGBgXG4gKiBPTERfU1JDIC0+IE1FUkdFRF9NQVAgLT4gTkVXX1NSQ1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZVNvdXJjZU1hcHMoXG4gICAgb2xkTWFwOiBSYXdTb3VyY2VNYXAgfCBudWxsLCBuZXdNYXA6IFJhd1NvdXJjZU1hcCk6IFNvdXJjZU1hcENvbnZlcnRlciB7XG4gIGlmICghb2xkTWFwKSB7XG4gICAgcmV0dXJuIGZyb21PYmplY3QobmV3TWFwKTtcbiAgfVxuICBjb25zdCBvbGRNYXBDb25zdW1lciA9IG5ldyBTb3VyY2VNYXBDb25zdW1lcihvbGRNYXApO1xuICBjb25zdCBuZXdNYXBDb25zdW1lciA9IG5ldyBTb3VyY2VNYXBDb25zdW1lcihuZXdNYXApO1xuICBjb25zdCBtZXJnZWRNYXBHZW5lcmF0b3IgPSBTb3VyY2VNYXBHZW5lcmF0b3IuZnJvbVNvdXJjZU1hcChuZXdNYXBDb25zdW1lcik7XG4gIG1lcmdlZE1hcEdlbmVyYXRvci5hcHBseVNvdXJjZU1hcChvbGRNYXBDb25zdW1lcik7XG4gIGNvbnN0IG1lcmdlZCA9IGZyb21KU09OKG1lcmdlZE1hcEdlbmVyYXRvci50b1N0cmluZygpKTtcbiAgcmV0dXJuIG1lcmdlZDtcbn1cblxuLyoqXG4gKiBSZW5kZXIgdGhlIGNvbnN0YW50IHBvb2wgYXMgc291cmNlIGNvZGUgZm9yIHRoZSBnaXZlbiBjbGFzcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlckNvbnN0YW50UG9vbChcbiAgICBzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlLCBjb25zdGFudFBvb2w6IENvbnN0YW50UG9vbCwgaW1wb3J0czogTmdjY0ltcG9ydE1hbmFnZXIpOiBzdHJpbmcge1xuICBjb25zdCBwcmludGVyID0gdHMuY3JlYXRlUHJpbnRlcigpO1xuICByZXR1cm4gY29uc3RhbnRQb29sLnN0YXRlbWVudHMubWFwKHN0bXQgPT4gdHJhbnNsYXRlU3RhdGVtZW50KHN0bXQsIGltcG9ydHMpKVxuICAgICAgLm1hcChzdG10ID0+IHByaW50ZXIucHJpbnROb2RlKHRzLkVtaXRIaW50LlVuc3BlY2lmaWVkLCBzdG10LCBzb3VyY2VGaWxlKSlcbiAgICAgIC5qb2luKCdcXG4nKTtcbn1cblxuLyoqXG4gKiBSZW5kZXIgdGhlIGRlZmluaXRpb25zIGFzIHNvdXJjZSBjb2RlIGZvciB0aGUgZ2l2ZW4gY2xhc3MuXG4gKiBAcGFyYW0gc291cmNlRmlsZSBUaGUgZmlsZSBjb250YWluaW5nIHRoZSBjbGFzcyB0byBwcm9jZXNzLlxuICogQHBhcmFtIGNsYXp6IFRoZSBjbGFzcyB3aG9zZSBkZWZpbml0aW9ucyBhcmUgdG8gYmUgcmVuZGVyZWQuXG4gKiBAcGFyYW0gY29tcGlsYXRpb24gVGhlIHJlc3VsdHMgb2YgYW5hbHl6aW5nIHRoZSBjbGFzcyAtIHRoaXMgaXMgdXNlZCB0byBnZW5lcmF0ZSB0aGUgcmVuZGVyZWRcbiAqIGRlZmluaXRpb25zLlxuICogQHBhcmFtIGltcG9ydHMgQW4gb2JqZWN0IHRoYXQgdHJhY2tzIHRoZSBpbXBvcnRzIHRoYXQgYXJlIG5lZWRlZCBieSB0aGUgcmVuZGVyZWQgZGVmaW5pdGlvbnMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJEZWZpbml0aW9ucyhcbiAgICBzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlLCBhbmFseXplZENsYXNzOiBBbmFseXplZENsYXNzLCBpbXBvcnRzOiBOZ2NjSW1wb3J0TWFuYWdlcik6IHN0cmluZyB7XG4gIGNvbnN0IHByaW50ZXIgPSB0cy5jcmVhdGVQcmludGVyKCk7XG4gIGNvbnN0IG5hbWUgPSAoYW5hbHl6ZWRDbGFzcy5kZWNsYXJhdGlvbiBhcyB0cy5OYW1lZERlY2xhcmF0aW9uKS5uYW1lICE7XG4gIGNvbnN0IGRlZmluaXRpb25zID1cbiAgICAgIGFuYWx5emVkQ2xhc3MuY29tcGlsYXRpb25cbiAgICAgICAgICAubWFwKFxuICAgICAgICAgICAgICBjID0+IGMuc3RhdGVtZW50cy5tYXAoc3RhdGVtZW50ID0+IHRyYW5zbGF0ZVN0YXRlbWVudChzdGF0ZW1lbnQsIGltcG9ydHMpKVxuICAgICAgICAgICAgICAgICAgICAgICAuY29uY2F0KHRyYW5zbGF0ZVN0YXRlbWVudChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZUFzc2lnbm1lbnRTdGF0ZW1lbnQobmFtZSwgYy5uYW1lLCBjLmluaXRpYWxpemVyKSwgaW1wb3J0cykpXG4gICAgICAgICAgICAgICAgICAgICAgIC5tYXAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZW1lbnQgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmludGVyLnByaW50Tm9kZSh0cy5FbWl0SGludC5VbnNwZWNpZmllZCwgc3RhdGVtZW50LCBzb3VyY2VGaWxlKSlcbiAgICAgICAgICAgICAgICAgICAgICAgLmpvaW4oJ1xcbicpKVxuICAgICAgICAgIC5qb2luKCdcXG4nKTtcbiAgcmV0dXJuIGRlZmluaXRpb25zO1xufVxuXG4vKipcbiAqIENyZWF0ZSBhbiBBbmd1bGFyIEFTVCBzdGF0ZW1lbnQgbm9kZSB0aGF0IGNvbnRhaW5zIHRoZSBhc3NpZ25tZW50IG9mIHRoZVxuICogY29tcGlsZWQgZGVjb3JhdG9yIHRvIGJlIGFwcGxpZWQgdG8gdGhlIGNsYXNzLlxuICogQHBhcmFtIGFuYWx5emVkQ2xhc3MgVGhlIGluZm8gYWJvdXQgdGhlIGNsYXNzIHdob3NlIHN0YXRlbWVudCB3ZSB3YW50IHRvIGNyZWF0ZS5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlQXNzaWdubWVudFN0YXRlbWVudChcbiAgICByZWNlaXZlck5hbWU6IHRzLkRlY2xhcmF0aW9uTmFtZSwgcHJvcE5hbWU6IHN0cmluZywgaW5pdGlhbGl6ZXI6IEV4cHJlc3Npb24pOiBTdGF0ZW1lbnQge1xuICBjb25zdCByZWNlaXZlciA9IG5ldyBXcmFwcGVkTm9kZUV4cHIocmVjZWl2ZXJOYW1lKTtcbiAgcmV0dXJuIG5ldyBXcml0ZVByb3BFeHByKHJlY2VpdmVyLCBwcm9wTmFtZSwgaW5pdGlhbGl6ZXIpLnRvU3RtdCgpO1xufVxuIl19
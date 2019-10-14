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
        define("@angular/compiler-cli/src/ngtsc/transform/src/compilation", ["require", "exports", "tslib", "typescript", "@angular/compiler-cli/src/ngtsc/diagnostics", "@angular/compiler-cli/src/ngtsc/metadata/src/reflector", "@angular/compiler-cli/src/ngtsc/transform/src/declaration"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var ts = require("typescript");
    var diagnostics_1 = require("@angular/compiler-cli/src/ngtsc/diagnostics");
    var reflector_1 = require("@angular/compiler-cli/src/ngtsc/metadata/src/reflector");
    var declaration_1 = require("@angular/compiler-cli/src/ngtsc/transform/src/declaration");
    /**
     * Manages a compilation of Ivy decorators into static fields across an entire ts.Program.
     *
     * The compilation is stateful - source files are analyzed and records of the operations that need
     * to be performed during the transform/emit process are maintained internally.
     */
    var IvyCompilation = /** @class */ (function () {
        /**
         * @param handlers array of `DecoratorHandler`s which will be executed against each class in the
         * program
         * @param checker TypeScript `TypeChecker` instance for the program
         * @param reflector `ReflectionHost` through which all reflection operations will be performed
         * @param coreImportsFrom a TypeScript `SourceFile` which exports symbols needed for Ivy imports
         * when compiling @angular/core, or `null` if the current program is not @angular/core. This is
         * `null` in most cases.
         */
        function IvyCompilation(handlers, checker, reflector, coreImportsFrom, sourceToFactorySymbols) {
            this.handlers = handlers;
            this.checker = checker;
            this.reflector = reflector;
            this.coreImportsFrom = coreImportsFrom;
            this.sourceToFactorySymbols = sourceToFactorySymbols;
            /**
             * Tracks classes which have been analyzed and found to have an Ivy decorator, and the
             * information recorded about them for later compilation.
             */
            this.analysis = new Map();
            this.typeCheckMap = new Map();
            /**
             * Tracks factory information which needs to be generated.
             */
            /**
             * Tracks the `DtsFileTransformer`s for each TS file that needs .d.ts transformations.
             */
            this.dtsMap = new Map();
            this._diagnostics = [];
        }
        IvyCompilation.prototype.analyzeSync = function (sf) { return this.analyze(sf, false); };
        IvyCompilation.prototype.analyzeAsync = function (sf) { return this.analyze(sf, true); };
        IvyCompilation.prototype.analyze = function (sf, preanalyze) {
            var _this = this;
            var promises = [];
            var analyzeClass = function (node) {
                // The first step is to reflect the decorators.
                var classDecorators = _this.reflector.getDecoratorsOfDeclaration(node);
                // Look through the DecoratorHandlers to see if any are relevant.
                _this.handlers.forEach(function (adapter) {
                    // An adapter is relevant if it matches one of the decorators on the class.
                    var metadata = adapter.detect(node, classDecorators);
                    if (metadata === undefined) {
                        return;
                    }
                    var completeAnalysis = function () {
                        var _a;
                        // Check for multiple decorators on the same node. Technically speaking this
                        // could be supported, but right now it's an error.
                        if (_this.analysis.has(node)) {
                            throw new Error('TODO.Diagnostic: Class has multiple Angular decorators.');
                        }
                        // Run analysis on the metadata. This will produce either diagnostics, an
                        // analysis result, or both.
                        try {
                            var analysis = adapter.analyze(node, metadata);
                            if (analysis.analysis !== undefined) {
                                _this.analysis.set(node, {
                                    adapter: adapter,
                                    analysis: analysis.analysis,
                                    metadata: metadata,
                                });
                                if (!!analysis.typeCheck) {
                                    _this.typeCheckMap.set(node, adapter);
                                }
                            }
                            if (analysis.diagnostics !== undefined) {
                                (_a = _this._diagnostics).push.apply(_a, tslib_1.__spread(analysis.diagnostics));
                            }
                            if (analysis.factorySymbolName !== undefined && _this.sourceToFactorySymbols !== null &&
                                _this.sourceToFactorySymbols.has(sf.fileName)) {
                                _this.sourceToFactorySymbols.get(sf.fileName).add(analysis.factorySymbolName);
                            }
                        }
                        catch (err) {
                            if (err instanceof diagnostics_1.FatalDiagnosticError) {
                                _this._diagnostics.push(err.toDiagnostic());
                            }
                            else {
                                throw err;
                            }
                        }
                    };
                    if (preanalyze && adapter.preanalyze !== undefined) {
                        var preanalysis = adapter.preanalyze(node, metadata);
                        if (preanalysis !== undefined) {
                            promises.push(preanalysis.then(function () { return completeAnalysis(); }));
                        }
                        else {
                            completeAnalysis();
                        }
                    }
                    else {
                        completeAnalysis();
                    }
                });
            };
            var visit = function (node) {
                // Process nodes recursively, and look for class declarations with decorators.
                if (ts.isClassDeclaration(node)) {
                    analyzeClass(node);
                }
                ts.forEachChild(node, visit);
            };
            visit(sf);
            if (preanalyze && promises.length > 0) {
                return Promise.all(promises).then(function () { return undefined; });
            }
            else {
                return undefined;
            }
        };
        IvyCompilation.prototype.typeCheck = function (context) {
            var _this = this;
            this.typeCheckMap.forEach(function (handler, node) {
                if (handler.typeCheck !== undefined) {
                    handler.typeCheck(context, node, _this.analysis.get(node).analysis);
                }
            });
        };
        /**
         * Perform a compilation operation on the given class declaration and return instructions to an
         * AST transformer if any are available.
         */
        IvyCompilation.prototype.compileIvyFieldFor = function (node, constantPool) {
            // Look to see whether the original node was analyzed. If not, there's nothing to do.
            var original = ts.getOriginalNode(node);
            if (!this.analysis.has(original)) {
                return undefined;
            }
            var op = this.analysis.get(original);
            // Run the actual compilation, which generates an Expression for the Ivy field.
            var res = op.adapter.compile(node, op.analysis, constantPool);
            if (!Array.isArray(res)) {
                res = [res];
            }
            // Look up the .d.ts transformer for the input file and record that a field was generated,
            // which will allow the .d.ts to be transformed later.
            var fileName = original.getSourceFile().fileName;
            var dtsTransformer = this.getDtsTransformer(fileName);
            dtsTransformer.recordStaticField(reflector_1.reflectNameOfDeclaration(node), res);
            // Return the instruction to the transformer so the field will be added.
            return res;
        };
        /**
         * Lookup the `ts.Decorator` which triggered transformation of a particular class declaration.
         */
        IvyCompilation.prototype.ivyDecoratorFor = function (node) {
            var original = ts.getOriginalNode(node);
            if (!this.analysis.has(original)) {
                return undefined;
            }
            return this.analysis.get(original).metadata;
        };
        /**
         * Process a .d.ts source string and return a transformed version that incorporates the changes
         * made to the source file.
         */
        IvyCompilation.prototype.transformedDtsFor = function (tsFileName, dtsOriginalSource) {
            // No need to transform if no changes have been requested to the input file.
            if (!this.dtsMap.has(tsFileName)) {
                return dtsOriginalSource;
            }
            // Return the transformed .d.ts source.
            return this.dtsMap.get(tsFileName).transform(dtsOriginalSource, tsFileName);
        };
        Object.defineProperty(IvyCompilation.prototype, "diagnostics", {
            get: function () { return this._diagnostics; },
            enumerable: true,
            configurable: true
        });
        IvyCompilation.prototype.getDtsTransformer = function (tsFileName) {
            if (!this.dtsMap.has(tsFileName)) {
                this.dtsMap.set(tsFileName, new declaration_1.DtsFileTransformer(this.coreImportsFrom));
            }
            return this.dtsMap.get(tsFileName);
        };
        return IvyCompilation;
    }());
    exports.IvyCompilation = IvyCompilation;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvc3JjL25ndHNjL3RyYW5zZm9ybS9zcmMvY29tcGlsYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7O0lBR0gsK0JBQWlDO0lBRWpDLDJFQUF1RDtJQUV2RCxvRkFBc0U7SUFJdEUseUZBQWlEO0lBYWpEOzs7OztPQUtHO0lBQ0g7UUFtQkU7Ozs7Ozs7O1dBUUc7UUFDSCx3QkFDWSxRQUFzQyxFQUFVLE9BQXVCLEVBQ3ZFLFNBQXlCLEVBQVUsZUFBbUMsRUFDdEUsc0JBQXFEO1lBRnJELGFBQVEsR0FBUixRQUFRLENBQThCO1lBQVUsWUFBTyxHQUFQLE9BQU8sQ0FBZ0I7WUFDdkUsY0FBUyxHQUFULFNBQVMsQ0FBZ0I7WUFBVSxvQkFBZSxHQUFmLGVBQWUsQ0FBb0I7WUFDdEUsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUErQjtZQTlCakU7OztlQUdHO1lBQ0ssYUFBUSxHQUFHLElBQUksR0FBRyxFQUFnRCxDQUFDO1lBQ25FLGlCQUFZLEdBQUcsSUFBSSxHQUFHLEVBQThDLENBQUM7WUFFN0U7O2VBRUc7WUFFSDs7ZUFFRztZQUNLLFdBQU0sR0FBRyxJQUFJLEdBQUcsRUFBOEIsQ0FBQztZQUMvQyxpQkFBWSxHQUFvQixFQUFFLENBQUM7UUFleUIsQ0FBQztRQUdyRSxvQ0FBVyxHQUFYLFVBQVksRUFBaUIsSUFBVSxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUV4RSxxQ0FBWSxHQUFaLFVBQWEsRUFBaUIsSUFBNkIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFPbkYsZ0NBQU8sR0FBZixVQUFnQixFQUFpQixF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QUM1RSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEVBQUU7Z0JBQ2hDLE9BQU8saUJBQWlCLENBQUM7YUFDMUI7WUFFRCx1Q0FBdUM7WUFDdkMsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUcsQ0FBQyxTQUFTLENBQUMsaUJBQWlCLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDaEYsQ0FBQztRQUVELHNCQUFJLHVDQUFXO2lCQUFmLGNBQWtELE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7OztXQUFBO1FBRXJFLDBDQUFpQixHQUF6QixVQUEwQixVQUFrQjtZQUMxQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEVBQUU7Z0JBQ2hDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxJQUFJLGdDQUFrQixDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO2FBQzNFO1lBQ0QsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUcsQ0FBQztRQUN2QyxDQUFDO1FBQ0gscUJBQUM7SUFBRCxDQUFDLEFBdE1ELElBc01DO0lBdE1ZLHdDQUFjIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0NvbnN0YW50UG9vbH0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7RmF0YWxEaWFnbm9zdGljRXJyb3J9IGZyb20gJy4uLy4uL2RpYWdub3N0aWNzJztcbmltcG9ydCB7RGVjb3JhdG9yLCBSZWZsZWN0aW9uSG9zdH0gZnJvbSAnLi4vLi4vaG9zdCc7XG5pbXBvcnQge3JlZmxlY3ROYW1lT2ZEZWNsYXJhdGlvbn0gZnJvbSAnLi4vLi4vbWV0YWRhdGEvc3JjL3JlZmxlY3Rvcic7XG5pbXBvcnQge1R5cGVDaGVja0NvbnRleHR9IGZyb20gJy4uLy4uL3R5cGVjaGVjayc7XG5cbmltcG9ydCB7QW5hbHlzaXNPdXRwdXQsIENvbXBpbGVSZXN1bHQsIERlY29yYXRvckhhbmRsZXJ9IGZyb20gJy4vYXBpJztcbmltcG9ydCB7RHRzRmlsZVRyYW5zZm9ybWVyfSBmcm9tICcuL2RlY2xhcmF0aW9uJztcblxuXG4vKipcbiAqIFJlY29yZCBvZiBhbiBhZGFwdGVyIHdoaWNoIGRlY2lkZWQgdG8gZW1pdCBhIHN0YXRpYyBmaWVsZCwgYW5kIHRoZSBhbmFseXNpcyBpdCBwZXJmb3JtZWQgdG9cbiAqIHByZXBhcmUgZm9yIHRoYXQgb3BlcmF0aW9uLlxuICovXG5pbnRlcmZhY2UgRW1pdEZpZWxkT3BlcmF0aW9uPEEsIE0+IHtcbiAgYWRhcHRlcjogRGVjb3JhdG9ySGFuZGxlcjxBLCBNPjtcbiAgYW5hbHlzaXM6IEFuYWx5c2lzT3V0cHV0PEE+O1xuICBtZXRhZGF0YTogTTtcbn1cblxuLyoqXG4gKiBNYW5hZ2VzIGEgY29tcGlsYXRpb24gb2YgSXZ5IGRlY29yYXRvcnMgaW50byBzdGF0aWMgZmllbGRzIGFjcm9zcyBhbiBlbnRpcmUgdHMuUHJvZ3JhbS5cbiAqXG4gKiBUaGUgY29tcGlsYXRpb24gaXMgc3RhdGVmdWwgLSBzb3VyY2UgZmlsZXMgYXJlIGFuYWx5emVkIGFuZCByZWNvcmRzIG9mIHRoZSBvcGVyYXRpb25zIHRoYXQgbmVlZFxuICogdG8gYmUgcGVyZm9ybWVkIGR1cmluZyB0aGUgdHJhbnNmb3JtL2VtaXQgcHJvY2VzcyBhcmUgbWFpbnRhaW5lZCBpbnRlcm5hbGx5LlxuICovXG5leHBvcnQgY2xhc3MgSXZ5Q29tcGlsYXRpb24ge1xuICAvKipcbiAgICogVHJhY2tzIGNsYXNzZXMgd2hpY2ggaGF2ZSBiZWVuIGFuYWx5emVkIGFuZCBmb3VuZCB0byBoYXZlIGFuIEl2eSBkZWNvcmF0b3IsIGFuZCB0aGVcbiAgICogaW5mb3JtYXRpb24gcmVjb3JkZWQgYWJvdXQgdGhlbSBmb3IgbGF0ZXIgY29tcGlsYXRpb24uXG4gICAqL1xuICBwcml2YXRlIGFuYWx5c2lzID0gbmV3IE1hcDx0cy5EZWNsYXJhdGlvbiwgRW1pdEZpZWxkT3BlcmF0aW9uPGFueSwgYW55Pj4oKTtcbiAgcHJpdmF0ZSB0eXBlQ2hlY2tNYXAgPSBuZXcgTWFwPHRzLkRlY2xhcmF0aW9uLCBEZWNvcmF0b3JIYW5kbGVyPGFueSwgYW55Pj4oKTtcblxuICAvKipcbiAgICogVHJhY2tzIGZhY3RvcnkgaW5mb3JtYXRpb24gd2hpY2ggbmVlZHMgdG8gYmUgZ2VuZXJhdGVkLlxuICAgKi9cblxuICAvKipcbiAgICogVHJhY2tzIHRoZSBgRHRzRmlsZVRyYW5zZm9ybWVyYHMgZm9yIGVhY2ggVFMgZmlsZSB0aGF0IG5lZWRzIC5kLnRzIHRyYW5zZm9ybWF0aW9ucy5cbiAgICovXG4gIHByaXZhdGUgZHRzTWFwID0gbmV3IE1hcDxzdHJpbmcsIER0c0ZpbGVUcmFuc2Zvcm1lcj4oKTtcbiAgcHJpdmF0ZSBfZGlhZ25vc3RpY3M6IHRzLkRpYWdub3N0aWNbXSA9IFtdO1xuXG5cbiAgLyoqXG4gICAqIEBwYXJhbSBoYW5kbGVycyBhcnJheSBvZiBgRGVjb3JhdG9ySGFuZGxlcmBzIHdoaWNoIHdpbGwgYmUgZXhlY3V0ZWQgYWdhaW5zdCBlYWNoIGNsYXNzIGluIHRoZVxuICAgKiBwcm9ncmFtXG4gICAqIEBwYXJhbSBjaGVja2VyIFR5cGVTY3JpcHQgYFR5cGVDaGVja2VyYCBpbnN0YW5jZSBmb3IgdGhlIHByb2dyYW1cbiAgICogQHBhcmFtIHJlZmxlY3RvciBgUmVmbGVjdGlvbkhvc3RgIHRocm91Z2ggd2hpY2ggYWxsIHJlZmxlY3Rpb24gb3BlcmF0aW9ucyB3aWxsIGJlIHBlcmZvcm1lZFxuICAgKiBAcGFyYW0gY29yZUltcG9ydHNGcm9tIGEgVHlwZVNjcmlwdCBgU291cmNlRmlsZWAgd2hpY2ggZXhwb3J0cyBzeW1ib2xzIG5lZWRlZCBmb3IgSXZ5IGltcG9ydHNcbiAgICogd2hlbiBjb21waWxpbmcgQGFuZ3VsYXIvY29yZSwgb3IgYG51bGxgIGlmIHRoZSBjdXJyZW50IHByb2dyYW0gaXMgbm90IEBhbmd1bGFyL2NvcmUuIFRoaXMgaXNcbiAgICogYG51bGxgIGluIG1vc3QgY2FzZXMuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgaGFuZGxlcnM6IERlY29yYXRvckhhbmRsZXI8YW55LCBhbnk+W10sIHByaXZhdGUgY2hlY2tlcjogdHMuVHlwZUNoZWNrZXIsXG4gICAgICBwcml2YXRlIHJlZmxlY3RvcjogUmVmbGVjdGlvbkhvc3QsIHByaXZhdGUgY29yZUltcG9ydHNGcm9tOiB0cy5Tb3VyY2VGaWxlfG51bGwsXG4gICAgICBwcml2YXRlIHNvdXJjZVRvRmFjdG9yeVN5bWJvbHM6IE1hcDxzdHJpbmcsIFNldDxzdHJpbmc+PnxudWxsKSB7fVxuXG5cbiAgYW5hbHl6ZVN5bmMoc2Y6IHRzLlNvdXJjZUZpbGUpOiB2b2lkIHsgcmV0dXJuIHRoaXMuYW5hbHl6ZShzZiwgZmFsc2UpOyB9XG5cbiAgYW5hbHl6ZUFzeW5jKHNmOiB0cy5Tb3VyY2VGaWxlKTogUHJvbWlzZTx2b2lkPnx1bmRlZmluZWQgeyByZXR1cm4gdGhpcy5hbmFseXplKHNmLCB0cnVlKTsgfVxuXG4gIC8qKlxuICAgKiBBbmFseXplIGEgc291cmNlIGZpbGUgYW5kIHByb2R1Y2UgZGlhZ25vc3RpY3MgZm9yIGl0IChpZiBhbnkpLlxuICAgKi9cbiAgcHJpdmF0ZSBhbmFseXplKHNmOiB0cy5Tb3VyY2VGaWxlLCBwcmVhbmFseXplOiBmYWxzZSk6IHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSBhbmFseXplKHNmOiB0cy5Tb3VyY2VGaWxlLCBwcmVhbmFseXplOiB0cnVlKTogUHJvbWlzZTx2b2lkPnx1bmRlZmluZWQ7XG4gIHByaXZhdGUgYW5hbHl6ZShzZjogdHMuU291cmNlRmlsZSwgcHJlYW5hbHl6ZTogYm9vbGVhbik6IFByb21pc2U8dm9pZD58dW5kZWZpbmVkIHtcbiAgICBjb25zdCBwcm9taXNlczogUHJvbWlzZTx2b2lkPltdID0gW107XG5cbiAgICBjb25zdCBhbmFseXplQ2xhc3MgPSAobm9kZTogdHMuRGVjbGFyYXRpb24pOiB2b2lkID0+IHtcbiAgICAgIC8vIFRoZSBmaXJzdCBzdGVwIGlzIHRvIHJlZmxlY3QgdGhlIGRlY29yYXRvcnMuXG4gICAgICBjb25zdCBjbGFzc0RlY29yYXRvcnMgPSB0aGlzLnJlZmxlY3Rvci5nZXREZWNvcmF0b3JzT2ZEZWNsYXJhdGlvbihub2RlKTtcblxuICAgICAgLy8gTG9vayB0aHJvdWdoIHRoZSBEZWNvcmF0b3JIYW5kbGVycyB0byBzZWUgaWYgYW55IGFyZSByZWxldmFudC5cbiAgICAgIHRoaXMuaGFuZGxlcnMuZm9yRWFjaChhZGFwdGVyID0+IHtcblxuICAgICAgICAvLyBBbiBhZGFwdGVyIGlzIHJlbGV2YW50IGlmIGl0IG1hdGNoZXMgb25lIG9mIHRoZSBkZWNvcmF0b3JzIG9uIHRoZSBjbGFzcy5cbiAgICAgICAgY29uc3QgbWV0YWRhdGEgPSBhZGFwdGVyLmRldGVjdChub2RlLCBjbGFzc0RlY29yYXRvcnMpO1xuICAgICAgICBpZiAobWV0YWRhdGEgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNvbXBsZXRlQW5hbHlzaXMgPSAoKSA9PiB7XG4gICAgICAgICAgLy8gQ2hlY2sgZm9yIG11bHRpcGxlIGRlY29yYXRvcnMgb24gdGhlIHNhbWUgbm9kZS4gVGVjaG5pY2FsbHkgc3BlYWtpbmcgdGhpc1xuICAgICAgICAgIC8vIGNvdWxkIGJlIHN1cHBvcnRlZCwgYnV0IHJpZ2h0IG5vdyBpdCdzIGFuIGVycm9yLlxuICAgICAgICAgIGlmICh0aGlzLmFuYWx5c2lzLmhhcyhub2RlKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUT0RPLkRpYWdub3N0aWM6IENsYXNzIGhhcyBtdWx0aXBsZSBBbmd1bGFyIGRlY29yYXRvcnMuJyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gUnVuIGFuYWx5c2lzIG9uIHRoZSBtZXRhZGF0YS4gVGhpcyB3aWxsIHByb2R1Y2UgZWl0aGVyIGRpYWdub3N0aWNzLCBhblxuICAgICAgICAgIC8vIGFuYWx5c2lzIHJlc3VsdCwgb3IgYm90aC5cbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgYW5hbHlzaXMgPSBhZGFwdGVyLmFuYWx5emUobm9kZSwgbWV0YWRhdGEpO1xuICAgICAgICAgICAgaWYgKGFuYWx5c2lzLmFuYWx5c2lzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgdGhpcy5hbmFseXNpcy5zZXQobm9kZSwge1xuICAgICAgICAgICAgICAgIGFkYXB0ZXIsXG4gICAgICAgICAgICAgICAgYW5hbHlzaXM6IGFuYWx5c2lzLmFuYWx5c2lzLFxuICAgICAgICAgICAgICAgIG1ldGFkYXRhOiBtZXRhZGF0YSxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIGlmICghIWFuYWx5c2lzLnR5cGVDaGVjaykge1xuICAgICAgICAgICAgICAgIHRoaXMudHlwZUNoZWNrTWFwLnNldChub2RlLCBhZGFwdGVyKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoYW5hbHlzaXMuZGlhZ25vc3RpY3MgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICB0aGlzLl9kaWFnbm9zdGljcy5wdXNoKC4uLmFuYWx5c2lzLmRpYWdub3N0aWNzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGFuYWx5c2lzLmZhY3RvcnlTeW1ib2xOYW1lICE9PSB1bmRlZmluZWQgJiYgdGhpcy5zb3VyY2VUb0ZhY3RvcnlTeW1ib2xzICE9PSBudWxsICYmXG4gICAgICAgICAgICAgICAgdGhpcy5zb3VyY2VUb0ZhY3RvcnlTeW1ib2xzLmhhcyhzZi5maWxlTmFtZSkpIHtcbiAgICAgICAgICAgICAgdGhpcy5zb3VyY2VUb0ZhY3RvcnlTeW1ib2xzLmdldChzZi5maWxlTmFtZSkgIS5hZGQoYW5hbHlzaXMuZmFjdG9yeVN5bWJvbE5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgaWYgKGVyciBpbnN0YW5jZW9mIEZhdGFsRGlhZ25vc3RpY0Vycm9yKSB7XG4gICAgICAgICAgICAgIHRoaXMuX2RpYWdub3N0aWNzLnB1c2goZXJyLnRvRGlhZ25vc3RpYygpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKHByZWFuYWx5emUgJiYgYWRhcHRlci5wcmVhbmFseXplICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBjb25zdCBwcmVhbmFseXNpcyA9IGFkYXB0ZXIucHJlYW5hbHl6ZShub2RlLCBtZXRhZGF0YSk7XG4gICAgICAgICAgaWYgKHByZWFuYWx5c2lzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHByb21pc2VzLnB1c2gocHJlYW5hbHlzaXMudGhlbigoKSA9PiBjb21wbGV0ZUFuYWx5c2lzKCkpKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29tcGxldGVBbmFseXNpcygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb21wbGV0ZUFuYWx5c2lzKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBjb25zdCB2aXNpdCA9IChub2RlOiB0cy5Ob2RlKTogdm9pZCA9PiB7XG4gICAgICAvLyBQcm9jZXNzIG5vZGVzIHJlY3Vyc2l2ZWx5LCBhbmQgbG9vayBmb3IgY2xhc3MgZGVjbGFyYXRpb25zIHdpdGggZGVjb3JhdG9ycy5cbiAgICAgIGlmICh0cy5pc0NsYXNzRGVjbGFyYXRpb24obm9kZSkpIHtcbiAgICAgICAgYW5hbHl6ZUNsYXNzKG5vZGUpO1xuICAgICAgfVxuICAgICAgdHMuZm9yRWFjaENoaWxkKG5vZGUsIHZpc2l0KTtcbiAgICB9O1xuXG4gICAgdmlzaXQoc2YpO1xuXG4gICAgaWYgKHByZWFuYWx5emUgJiYgcHJvbWlzZXMubGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKS50aGVuKCgpID0+IHVuZGVmaW5lZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICB9XG5cbiAgdHlwZUNoZWNrKGNvbnRleHQ6IFR5cGVDaGVja0NvbnRleHQpOiB2b2lkIHtcbiAgICB0aGlzLnR5cGVDaGVja01hcC5mb3JFYWNoKChoYW5kbGVyLCBub2RlKSA9PiB7XG4gICAgICBpZiAoaGFuZGxlci50eXBlQ2hlY2sgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBoYW5kbGVyLnR5cGVDaGVjayhjb250ZXh0LCBub2RlLCB0aGlzLmFuYWx5c2lzLmdldChub2RlKSAhLmFuYWx5c2lzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQZXJmb3JtIGEgY29tcGlsYXRpb24gb3BlcmF0aW9uIG9uIHRoZSBnaXZlbiBjbGFzcyBkZWNsYXJhdGlvbiBhbmQgcmV0dXJuIGluc3RydWN0aW9ucyB0byBhblxuICAgKiBBU1QgdHJhbnNmb3JtZXIgaWYgYW55IGFyZSBhdmFpbGFibGUuXG4gICAqL1xuICBjb21waWxlSXZ5RmllbGRGb3Iobm9kZTogdHMuRGVjbGFyYXRpb24sIGNvbnN0YW50UG9vbDogQ29uc3RhbnRQb29sKTogQ29tcGlsZVJlc3VsdFtdfHVuZGVmaW5lZCB7XG4gICAgLy8gTG9vayB0byBzZWUgd2hldGhlciB0aGUgb3JpZ2luYWwgbm9kZSB3YXMgYW5hbHl6ZWQuIElmIG5vdCwgdGhlcmUncyBub3RoaW5nIHRvIGRvLlxuICAgIGNvbnN0IG9yaWdpbmFsID0gdHMuZ2V0T3JpZ2luYWxOb2RlKG5vZGUpIGFzIHRzLkRlY2xhcmF0aW9uO1xuICAgIGlmICghdGhpcy5hbmFseXNpcy5oYXMob3JpZ2luYWwpKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBjb25zdCBvcCA9IHRoaXMuYW5hbHlzaXMuZ2V0KG9yaWdpbmFsKSAhO1xuXG4gICAgLy8gUnVuIHRoZSBhY3R1YWwgY29tcGlsYXRpb24sIHdoaWNoIGdlbmVyYXRlcyBhbiBFeHByZXNzaW9uIGZvciB0aGUgSXZ5IGZpZWxkLlxuICAgIGxldCByZXM6IENvbXBpbGVSZXN1bHR8Q29tcGlsZVJlc3VsdFtdID0gb3AuYWRhcHRlci5jb21waWxlKG5vZGUsIG9wLmFuYWx5c2lzLCBjb25zdGFudFBvb2wpO1xuICAgIGlmICghQXJyYXkuaXNBcnJheShyZXMpKSB7XG4gICAgICByZXMgPSBbcmVzXTtcbiAgICB9XG5cbiAgICAvLyBMb29rIHVwIHRoZSAuZC50cyB0cmFuc2Zvcm1lciBmb3IgdGhlIGlucHV0IGZpbGUgYW5kIHJlY29yZCB0aGF0IGEgZmllbGQgd2FzIGdlbmVyYXRlZCxcbiAgICAvLyB3aGljaCB3aWxsIGFsbG93IHRoZSAuZC50cyB0byBiZSB0cmFuc2Zvcm1lZCBsYXRlci5cbiAgICBjb25zdCBmaWxlTmFtZSA9IG9yaWdpbmFsLmdldFNvdXJjZUZpbGUoKS5maWxlTmFtZTtcbiAgICBjb25zdCBkdHNUcmFuc2Zvcm1lciA9IHRoaXMuZ2V0RHRzVHJhbnNmb3JtZXIoZmlsZU5hbWUpO1xuICAgIGR0c1RyYW5zZm9ybWVyLnJlY29yZFN0YXRpY0ZpZWxkKHJlZmxlY3ROYW1lT2ZEZWNsYXJhdGlvbihub2RlKSAhLCByZXMpO1xuXG4gICAgLy8gUmV0dXJuIHRoZSBpbnN0cnVjdGlvbiB0byB0aGUgdHJhbnNmb3JtZXIgc28gdGhlIGZpZWxkIHdpbGwgYmUgYWRkZWQuXG4gICAgcmV0dXJuIHJlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBMb29rdXAgdGhlIGB0cy5EZWNvcmF0b3JgIHdoaWNoIHRyaWdnZXJlZCB0cmFuc2Zvcm1hdGlvbiBvZiBhIHBhcnRpY3VsYXIgY2xhc3MgZGVjbGFyYXRpb24uXG4gICAqL1xuICBpdnlEZWNvcmF0b3JGb3Iobm9kZTogdHMuRGVjbGFyYXRpb24pOiBEZWNvcmF0b3J8dW5kZWZpbmVkIHtcbiAgICBjb25zdCBvcmlnaW5hbCA9IHRzLmdldE9yaWdpbmFsTm9kZShub2RlKSBhcyB0cy5EZWNsYXJhdGlvbjtcbiAgICBpZiAoIXRoaXMuYW5hbHlzaXMuaGFzKG9yaWdpbmFsKSkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5hbmFseXNpcy5nZXQob3JpZ2luYWwpICEubWV0YWRhdGE7XG4gIH1cblxuICAvKipcbiAgICogUHJvY2VzcyBhIC5kLnRzIHNvdXJjZSBzdHJpbmcgYW5kIHJldHVybiBhIHRyYW5zZm9ybWVkIHZlcnNpb24gdGhhdCBpbmNvcnBvcmF0ZXMgdGhlIGNoYW5nZXNcbiAgICogbWFkZSB0byB0aGUgc291cmNlIGZpbGUuXG4gICAqL1xuICB0cmFuc2Zvcm1lZER0c0Zvcih0c0ZpbGVOYW1lOiBzdHJpbmcsIGR0c09yaWdpbmFsU291cmNlOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIC8vIE5vIG5lZWQgdG8gdHJhbnNmb3JtIGlmIG5vIGNoYW5nZXMgaGF2ZSBiZWVuIHJlcXVlc3RlZCB0byB0aGUgaW5wdXQgZmlsZS5cbiAgICBpZiAoIXRoaXMuZHRzTWFwLmhhcyh0c0ZpbGVOYW1lKSkge1xuICAgICAgcmV0dXJuIGR0c09yaWdpbmFsU291cmNlO1xuICAgIH1cblxuICAgIC8vIFJldHVybiB0aGUgdHJhbnNmb3JtZWQgLmQudHMgc291cmNlLlxuICAgIHJldHVybiB0aGlzLmR0c01hcC5nZXQodHNGaWxlTmFtZSkgIS50cmFuc2Zvcm0oZHRzT3JpZ2luYWxTb3VyY2UsIHRzRmlsZU5hbWUpO1xuICB9XG5cbiAgZ2V0IGRpYWdub3N0aWNzKCk6IFJlYWRvbmx5QXJyYXk8dHMuRGlhZ25vc3RpYz4geyByZXR1cm4gdGhpcy5fZGlhZ25vc3RpY3M7IH1cblxuICBwcml2YXRlIGdldER0c1RyYW5zZm9ybWVyKHRzRmlsZU5hbWU6IHN0cmluZyk6IER0c0ZpbGVUcmFuc2Zvcm1lciB7XG4gICAgaWYgKCF0aGlzLmR0c01hcC5oYXModHNGaWxlTmFtZSkpIHtcbiAgICAgIHRoaXMuZHRzTWFwLnNldCh0c0ZpbGVOYW1lLCBuZXcgRHRzRmlsZVRyYW5zZm9ybWVyKHRoaXMuY29yZUltcG9ydHNGcm9tKSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmR0c01hcC5nZXQodHNGaWxlTmFtZSkgITtcbiAgfVxufVxuIl19
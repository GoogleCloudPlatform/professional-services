(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/src/ngcc/src/rendering/fesm2015_renderer", ["require", "exports", "tslib", "typescript", "@angular/compiler-cli/src/ngcc/src/host/ngcc_host", "@angular/compiler-cli/src/ngcc/src/rendering/renderer"], factory);
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
    var ts = require("typescript");
    var ngcc_host_1 = require("@angular/compiler-cli/src/ngcc/src/host/ngcc_host");
    var renderer_1 = require("@angular/compiler-cli/src/ngcc/src/rendering/renderer");
    var Fesm2015Renderer = /** @class */ (function (_super) {
        tslib_1.__extends(Fesm2015Renderer, _super);
        function Fesm2015Renderer(host, isCore, rewriteCoreImportsTo, sourcePath, targetPath) {
            var _this = _super.call(this, host, isCore, rewriteCoreImportsTo, sourcePath, targetPath) || this;
            _this.host = host;
            _this.isCore = isCore;
            _this.rewriteCoreImportsTo = rewriteCoreImportsTo;
            _this.sourcePath = sourcePath;
            _this.targetPath = targetPath;
            return _this;
        }
        /**
         *  Add the imports at the top of the file
         */
        Fesm2015Renderer.prototype.addImports = function (output, imports) {
            // The imports get inserted at the very top of the file.
            imports.forEach(function (i) { output.appendLeft(0, "import * as " + i.as + " from '" + i.name + "';\n"); });
        };
        Fesm2015Renderer.prototype.addConstants = function (output, constants, file) {
            if (constants === '') {
                return;
            }
            var insertionPoint = file.statements.reduce(function (prev, stmt) {
                if (ts.isImportDeclaration(stmt) || ts.isImportEqualsDeclaration(stmt) ||
                    ts.isNamespaceImport(stmt)) {
                    return stmt.getEnd();
                }
                return prev;
            }, 0);
            output.appendLeft(insertionPoint, '\n' + constants + '\n');
        };
        /**
         * Add the definitions to each decorated class
         */
        Fesm2015Renderer.prototype.addDefinitions = function (output, analyzedClass, definitions) {
            var classSymbol = this.host.getClassSymbol(analyzedClass.declaration);
            if (!classSymbol) {
                throw new Error("Analyzed class does not have a valid symbol: " + analyzedClass.name);
            }
            var insertionPoint = classSymbol.valueDeclaration.getEnd();
            output.appendLeft(insertionPoint, '\n' + definitions);
        };
        /**
         * Remove static decorator properties from classes
         */
        Fesm2015Renderer.prototype.removeDecorators = function (output, decoratorsToRemove) {
            decoratorsToRemove.forEach(function (nodesToRemove, containerNode) {
                if (ts.isArrayLiteralExpression(containerNode)) {
                    var items = containerNode.elements;
                    if (items.length === nodesToRemove.length) {
                        // Remove the entire statement
                        var statement = findStatement(containerNode);
                        if (statement) {
                            output.remove(statement.getFullStart(), statement.getEnd());
                        }
                    }
                    else {
                        nodesToRemove.forEach(function (node) {
                            // remove any trailing comma
                            var end = (output.slice(node.getEnd(), node.getEnd() + 1) === ',') ?
                                node.getEnd() + 1 :
                                node.getEnd();
                            output.remove(node.getFullStart(), end);
                        });
                    }
                }
            });
        };
        Fesm2015Renderer.prototype.rewriteSwitchableDeclarations = function (outputText, sourceFile, declarations) {
            declarations.forEach(function (declaration) {
                var start = declaration.initializer.getStart();
                var end = declaration.initializer.getEnd();
                var replacement = declaration.initializer.text.replace(ngcc_host_1.PRE_NGCC_MARKER, ngcc_host_1.POST_NGCC_MARKER);
                outputText.overwrite(start, end, replacement);
            });
        };
        return Fesm2015Renderer;
    }(renderer_1.Renderer));
    exports.Fesm2015Renderer = Fesm2015Renderer;
    function findStatement(node) {
        while (node) {
            if (ts.isExpressionStatement(node)) {
                return node;
            }
            node = node.parent;
        }
        return undefined;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmVzbTIwMTVfcmVuZGVyZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvc3JjL25nY2Mvc3JjL3JlbmRlcmluZy9mZXNtMjAxNV9yZW5kZXJlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7SUFBQTs7Ozs7O09BTUc7SUFDSCwrQkFBaUM7SUFFakMsK0VBQXVIO0lBRXZILGtGQUFvQztJQUVwQztRQUFzQyw0Q0FBUTtRQUM1QywwQkFDYyxJQUF3QixFQUFZLE1BQWUsRUFDbkQsb0JBQXdDLEVBQVksVUFBa0IsRUFDdEUsVUFBa0I7WUFIaEMsWUFJRSxrQkFBTSxJQUFJLEVBQUUsTUFBTSxFQUFFLG9CQUFvQixFQUFFLFVBQVUsRUFBRSxVQUFVLENBQUMsU0FDbEU7WUFKYSxVQUFJLEdBQUosSUFBSSxDQUFvQjtZQUFZLFlBQU0sR0FBTixNQUFNLENBQVM7WUFDbkQsMEJBQW9CLEdBQXBCLG9CQUFvQixDQUFvQjtZQUFZLGdCQUFVLEdBQVYsVUFBVSxDQUFRO1lBQ3RFLGdCQUFVLEdBQVYsVUFBVSxDQUFROztRQUVoQyxDQUFDO1FBRUQ7O1dBRUc7UUFDSCxxQ0FBVSxHQUFWLFVBQVcsTUFBbUIsRUFBRSxPQUFzQztZQUNwRSx3REFBd0Q7WUFDeEQsT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFBLENBQUMsSUFBTSxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxpQkFBZSxDQUFDLENBQUMsRUFBRSxlQUFVLENBQUMsQ0FBQyxJQUFJLFNBQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDN0YsQ0FBQztRQUVELHVDQUFZLEdBQVosVUFBYSxNQUFtQixFQUFFLFNBQWlCLEVBQUUsSUFBbUI7WUFDdEUsSUFBSSxTQUFTLEtBQUssRUFBRSxFQUFFO2dCQUNwQixPQUFPO2FBQ1I7WUFDRCxJQUFNLGNBQWMsR0FBRyxJQUFJ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QWdCLENBQUMsQ0FBQztnQkFDNUYsVUFBVSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ2hELENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUNILHVCQUFDO0lBQUQsQ0FBQyxBQTlFRCxDQUFzQyxtQkFBUSxHQThFN0M7SUE5RVksNENBQWdCO0lBZ0Y3QixTQUFTLGFBQWEsQ0FBQyxJQUFhO1FBQ2xDLE9BQU8sSUFBSSxFQUFFO1lBQ1gsSUFBSSxFQUFFLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQ2xDLE9BQU8sSUFBSSxDQUFDO2FBQ2I7WUFDRCxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztTQUNwQjtRQUNELE9BQU8sU0FBUyxDQUFDO0lBQ25CLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCBNYWdpY1N0cmluZyBmcm9tICdtYWdpYy1zdHJpbmcnO1xuaW1wb3J0IHtOZ2NjUmVmbGVjdGlvbkhvc3QsIFBPU1RfTkdDQ19NQVJLRVIsIFBSRV9OR0NDX01BUktFUiwgU3dpdGNoYWJsZVZhcmlhYmxlRGVjbGFyYXRpb259IGZyb20gJy4uL2hvc3QvbmdjY19ob3N0JztcbmltcG9ydCB7QW5hbHl6ZWRDbGFzc30gZnJvbSAnLi4vYW5hbHlzaXMvZGVjb3JhdGlvbl9hbmFseXplcic7XG5pbXBvcnQge1JlbmRlcmVyfSBmcm9tICcuL3JlbmRlcmVyJztcblxuZXhwb3J0IGNsYXNzIEZlc20yMDE1UmVuZGVyZXIgZXh0ZW5kcyBSZW5kZXJlciB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJvdGVjdGVkIGhvc3Q6IE5nY2NSZWZsZWN0aW9uSG9zdCwgcHJvdGVjdGVkIGlzQ29yZTogYm9vbGVhbixcbiAgICAgIHByb3RlY3RlZCByZXdyaXRlQ29yZUltcG9ydHNUbzogdHMuU291cmNlRmlsZXxudWxsLCBwcm90ZWN0ZWQgc291cmNlUGF0aDogc3RyaW5nLFxuICAgICAgcHJvdGVjdGVkIHRhcmdldFBhdGg6IHN0cmluZykge1xuICAgIHN1cGVyKGhvc3QsIGlzQ29yZSwgcmV3cml0ZUNvcmVJbXBvcnRzVG8sIHNvdXJjZVBhdGgsIHRhcmdldFBhdGgpO1xuICB9XG5cbiAgLyoqXG4gICAqICBBZGQgdGhlIGltcG9ydHMgYXQgdGhlIHRvcCBvZiB0aGUgZmlsZVxuICAgKi9cbiAgYWRkSW1wb3J0cyhvdXRwdXQ6IE1hZ2ljU3RyaW5nLCBpbXBvcnRzOiB7bmFtZTogc3RyaW5nOyBhczogc3RyaW5nO31bXSk6IHZvaWQge1xuICAgIC8vIFRoZSBpbXBvcnRzIGdldCBpbnNlcnRlZCBhdCB0aGUgdmVyeSB0b3Agb2YgdGhlIGZpbGUuXG4gICAgaW1wb3J0cy5mb3JFYWNoKGkgPT4geyBvdXRwdXQuYXBwZW5kTGVmdCgwLCBgaW1wb3J0ICogYXMgJHtpLmFzfSBmcm9tICcke2kubmFtZX0nO1xcbmApOyB9KTtcbiAgfVxuXG4gIGFkZENvbnN0YW50cyhvdXRwdXQ6IE1hZ2ljU3RyaW5nLCBjb25zdGFudHM6IHN0cmluZywgZmlsZTogdHMuU291cmNlRmlsZSk6IHZvaWQge1xuICAgIGlmIChjb25zdGFudHMgPT09ICcnKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGluc2VydGlvblBvaW50ID0gZmlsZS5zdGF0ZW1lbnRzLnJlZHVjZSgocHJldiwgc3RtdCkgPT4ge1xuICAgICAgaWYgKHRzLmlzSW1wb3J0RGVjbGFyYXRpb24oc3RtdCkgfHwgdHMuaXNJbXBvcnRFcXVhbHNEZWNsYXJhdGlvbihzdG10KSB8fFxuICAgICAgICAgIHRzLmlzTmFtZXNwYWNlSW1wb3J0KHN0bXQpKSB7XG4gICAgICAgIHJldHVybiBzdG10LmdldEVuZCgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHByZXY7XG4gICAgfSwgMCk7XG4gICAgb3V0cHV0LmFwcGVuZExlZnQoaW5zZXJ0aW9uUG9pbnQsICdcXG4nICsgY29uc3RhbnRzICsgJ1xcbicpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCB0aGUgZGVmaW5pdGlvbnMgdG8gZWFjaCBkZWNvcmF0ZWQgY2xhc3NcbiAgICovXG4gIGFkZERlZmluaXRpb25zKG91dHB1dDogTWFnaWNTdHJpbmcsIGFuYWx5emVkQ2xhc3M6IEFuYWx5emVkQ2xhc3MsIGRlZmluaXRpb25zOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBjbGFzc1N5bWJvbCA9IHRoaXMuaG9zdC5nZXRDbGFzc1N5bWJvbChhbmFseXplZENsYXNzLmRlY2xhcmF0aW9uKTtcbiAgICBpZiAoIWNsYXNzU3ltYm9sKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEFuYWx5emVkIGNsYXNzIGRvZXMgbm90IGhhdmUgYSB2YWxpZCBzeW1ib2w6ICR7YW5hbHl6ZWRDbGFzcy5uYW1lfWApO1xuICAgIH1cbiAgICBjb25zdCBpbnNlcnRpb25Qb2ludCA9IGNsYXNzU3ltYm9sLnZhbHVlRGVjbGFyYXRpb24gIS5nZXRFbmQoKTtcbiAgICBvdXRwdXQuYXBwZW5kTGVmdChpbnNlcnRpb25Qb2ludCwgJ1xcbicgKyBkZWZpbml0aW9ucyk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIHN0YXRpYyBkZWNvcmF0b3IgcHJvcGVydGllcyBmcm9tIGNsYXNzZXNcbiAgICovXG4gIHJlbW92ZURlY29yYXRvcnMob3V0cHV0OiBNYWdpY1N0cmluZywgZGVjb3JhdG9yc1RvUmVtb3ZlOiBNYXA8dHMuTm9kZSwgdHMuTm9kZVtdPik6IHZvaWQge1xuICAgIGRlY29yYXRvcnNUb1JlbW92ZS5mb3JFYWNoKChub2Rlc1RvUmVtb3ZlLCBjb250YWluZXJOb2RlKSA9PiB7XG4gICAgICBpZiAodHMuaXNBcnJheUxpdGVyYWxFeHByZXNzaW9uKGNvbnRhaW5lck5vZGUpKSB7XG4gICAgICAgIGNvbnN0IGl0ZW1zID0gY29udGFpbmVyTm9kZS5lbGVtZW50cztcbiAgICAgICAgaWYgKGl0ZW1zLmxlbmd0aCA9PT0gbm9kZXNUb1JlbW92ZS5sZW5ndGgpIHtcbiAgICAgICAgICAvLyBSZW1vdmUgdGhlIGVudGlyZSBzdGF0ZW1lbnRcbiAgICAgICAgICBjb25zdCBzdGF0ZW1lbnQgPSBmaW5kU3RhdGVtZW50KGNvbnRhaW5lck5vZGUpO1xuICAgICAgICAgIGlmIChzdGF0ZW1lbnQpIHtcbiAgICAgICAgICAgIG91dHB1dC5yZW1vdmUoc3RhdGVtZW50LmdldEZ1bGxTdGFydCgpLCBzdGF0ZW1lbnQuZ2V0RW5kKCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBub2Rlc1RvUmVtb3ZlLmZvckVhY2gobm9kZSA9PiB7XG4gICAgICAgICAgICAvLyByZW1vdmUgYW55IHRyYWlsaW5nIGNvbW1hXG4gICAgICAgICAgICBjb25zdCBlbmQgPSAob3V0cHV0LnNsaWNlKG5vZGUuZ2V0RW5kKCksIG5vZGUuZ2V0RW5kKCkgKyAxKSA9PT0gJywnKSA/XG4gICAgICAgICAgICAgICAgbm9kZS5nZXRFbmQoKSArIDEgOlxuICAgICAgICAgICAgICAgIG5vZGUuZ2V0RW5kKCk7XG4gICAgICAgICAgICBvdXRwdXQucmVtb3ZlKG5vZGUuZ2V0RnVsbFN0YXJ0KCksIGVuZCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHJld3JpdGVTd2l0Y2hhYmxlRGVjbGFyYXRpb25zKFxuICAgICAgb3V0cHV0VGV4dDogTWFnaWNTdHJpbmcsIHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUsXG4gICAgICBkZWNsYXJhdGlvbnM6IFN3aXRjaGFibGVWYXJpYWJsZURlY2xhcmF0aW9uW10pOiB2b2lkIHtcbiAgICBkZWNsYXJhdGlvbnMuZm9yRWFjaChkZWNsYXJhdGlvbiA9PiB7XG4gICAgICBjb25zdCBzdGFydCA9IGRlY2xhcmF0aW9uLmluaXRpYWxpemVyLmdldFN0YXJ0KCk7XG4gICAgICBjb25zdCBlbmQgPSBkZWNsYXJhdGlvbi5pbml0aWFsaXplci5nZXRFbmQoKTtcbiAgICAgIGNvbnN0IHJlcGxhY2VtZW50ID0gZGVjbGFyYXRpb24uaW5pdGlhbGl6ZXIudGV4dC5yZXBsYWNlKFBSRV9OR0NDX01BUktFUiwgUE9TVF9OR0NDX01BUktFUik7XG4gICAgICBvdXRwdXRUZXh0Lm92ZXJ3cml0ZShzdGFydCwgZW5kLCByZXBsYWNlbWVudCk7XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZmluZFN0YXRlbWVudChub2RlOiB0cy5Ob2RlKSB7XG4gIHdoaWxlIChub2RlKSB7XG4gICAgaWYgKHRzLmlzRXhwcmVzc2lvblN0YXRlbWVudChub2RlKSkge1xuICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxuICAgIG5vZGUgPSBub2RlLnBhcmVudDtcbiAgfVxuICByZXR1cm4gdW5kZWZpbmVkO1xufVxuIl19
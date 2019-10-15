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
        define("@angular/compiler-cli/src/ngtsc/factories/src/transform", ["require", "exports", "typescript", "@angular/compiler-cli/src/ngtsc/util/src/path"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ts = require("typescript");
    var path_1 = require("@angular/compiler-cli/src/ngtsc/util/src/path");
    var STRIP_NG_FACTORY = /(.*)NgFactory$/;
    function generatedFactoryTransform(factoryMap, coreImportsFrom) {
        return function (context) {
            return function (file) {
                return transformFactorySourceFile(factoryMap, context, coreImportsFrom, file);
            };
        };
    }
    exports.generatedFactoryTransform = generatedFactoryTransform;
    function transformFactorySourceFile(factoryMap, context, coreImportsFrom, file) {
        // If this is not a generated file, it won't have factory info associated with it.
        if (!factoryMap.has(file.fileName)) {
            // Don't transform non-generated code.
            return file;
        }
        var _a = factoryMap.get(file.fileName), moduleSymbolNames = _a.moduleSymbolNames, sourceFilePath = _a.sourceFilePath;
        var clone = ts.getMutableClone(file);
        var transformedStatements = file.statements.map(function (stmt) {
            if (coreImportsFrom !== null && ts.isImportDeclaration(stmt) &&
                ts.isStringLiteral(stmt.moduleSpecifier) && stmt.moduleSpecifier.text === '@angular/core') {
                var path = path_1.relativePathBetween(sourceFilePath, coreImportsFrom.fileName);
                if (path !== null) {
                    return ts.updateImportDeclaration(stmt, stmt.decorators, stmt.modifiers, stmt.importClause, ts.createStringLiteral(path));
                }
                else {
                    return ts.createNotEmittedStatement(stmt);
                }
            }
            else if (ts.isVariableStatement(stmt) && stmt.declarationList.declarations.length === 1) {
                var decl = stmt.declarationList.declarations[0];
                if (ts.isIdentifier(decl.name)) {
                    var match = STRIP_NG_FACTORY.exec(decl.name.text);
                    if (match === null || !moduleSymbolNames.has(match[1])) {
                        // Remove the given factory as it wasn't actually for an NgModule.
                        return ts.createNotEmittedStatement(stmt);
                    }
                }
                return stmt;
            }
            else {
                return stmt;
            }
        });
        if (!transformedStatements.some(ts.isVariableStatement)) {
            // If the resulting file has no factories, include an empty export to
            // satisfy closure compiler.
            transformedStatements.push(ts.createVariableStatement([ts.createModifier(ts.SyntaxKind.ExportKeyword)], ts.createVariableDeclarationList([ts.createVariableDeclaration('ɵNonEmptyModule', undefined, ts.createTrue())], ts.NodeFlags.Const)));
        }
        clone.statements = ts.createNodeArray(transformedStatements);
        return clone;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmb3JtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXItY2xpL3NyYy9uZ3RzYy9mYWN0b3JpZXMvc3JjL3RyYW5zZm9ybS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILCtCQUFpQztJQUVqQyxzRUFBd0Q7SUFFeEQsSUFBTSxnQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQztJQU8xQyxTQUFnQix5QkFBeUIsQ0FDckMsVUFBb0MsRUFDcEMsZUFBcUM7UUFDdkMsT0FBTyxVQUFDLE9BQWlDO1lBQ3ZDLE9BQU8sVUFBQyxJQUFtQjtnQkFDekIsT0FBTywwQkFBMEIsQ0FBQyxVQUFVLEVBQUUsT0FBTyxFQUFFLGVBQWUsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNoRixDQUFDLENBQUM7UUFDSixDQUFDLENBQUM7SUFDSixDQUFDO0lBUkQsOERBUUM7SUFFRCxTQUFTLDBCQUEwQixDQUMvQixVQUFvQyxFQUFFLE9BQWlDLEVBQ3ZFLGVBQXFDLEVBQUUsSUFBbUI7UUFDNUQsa0ZBQWtGO1FBQ2xGLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUNsQyxzQ0FBc0M7WUFDdEMsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUVLLElBQUEsa0NBQXFFLEVBQXBFLHdDQUFpQixFQUFFLGtDQUFpRCxDQUFDO1FBRTVFLElBQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFdkMsSUFBTSxxQkFBcUIsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxVQUFBLElBQUk7WUFDcEQsSUFBSSxlQUFlLEtBQUssSUFBSSxJQUFJLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUM7Z0JBQ3hELEVBQUUsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxLQUFLLGVBQWUsRUFBRTtnQkFDN0YsSUFBTSxJQUFJLEdBQUcsMEJBQW1CLENBQUMsY0FBYyxFQUFFLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDM0UsSUFBSSxJQUFJLEtBQUssSUFBSSxFQUFFO29CQUNqQixPQUFPLEVBQUUsQ0FBQyx1QkFBdUIsQ0FDN0IsSUFBSSxFQUFFLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsWUFBWSxFQUFFLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2lCQUM3RjtxQkFBTTtvQkFDTCxPQUFPLEVBQUUsQ0FBQyx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztpQkFDM0M7YUFDRjtpQkFBTSxJQUFJLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLFlBQVksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO2dCQUN6RixJQUFNLElBQUksR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbEQsSUFBSSxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDOUIsSUFBTSxLQUFLLEdBQUcsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ3BELElBQUksS0FBSyxLQUFLLElBQUksSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTt3QkFDdEQsa0VBQWtFO3dCQUNsRSxPQUFPLEVBQUUsQ0FBQyx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztxQkFDM0M7aUJBQ0Y7Z0JBQ0QsT0FBTyxJQUFJLENBQUM7YUFDYjtpQkFBTTtnQkFDTCxPQUFPLElBQUksQ0FBQzthQUNiO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFO1lBQ3ZELHFFQUFxRTtZQUNyRSw0QkFBNEI7WUFDNUIscUJBQXFCLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyx1QkFBdUIsQ0FDakQsQ0FBQyxFQUFFLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLENBQUMsRUFDaEQsRUFBRSxDQUFDLDZCQUE2QixDQUM1QixDQUFDLEVBQUUsQ0FBQyx5QkFBeUIsQ0FBQyxpQkFBaUIsRUFBRSxTQUFTLEVBQUUsRUFBRSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsRUFDN0UsRUFBRSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDL0I7UUFDRCxLQUFLLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQyxlQUFlLENBQUMscUJBQXFCLENBQUMsQ0FBQztRQUM3RCxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge3JlbGF0aXZlUGF0aEJldHdlZW59IGZyb20gJy4uLy4uL3V0aWwvc3JjL3BhdGgnO1xuXG5jb25zdCBTVFJJUF9OR19GQUNUT1JZID0gLyguKilOZ0ZhY3RvcnkkLztcblxuZXhwb3J0IGludGVyZmFjZSBGYWN0b3J5SW5mbyB7XG4gIHNvdXJjZUZpbGVQYXRoOiBzdHJpbmc7XG4gIG1vZHVsZVN5bWJvbE5hbWVzOiBTZXQ8c3RyaW5nPjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlZEZhY3RvcnlUcmFuc2Zvcm0oXG4gICAgZmFjdG9yeU1hcDogTWFwPHN0cmluZywgRmFjdG9yeUluZm8+LFxuICAgIGNvcmVJbXBvcnRzRnJvbTogdHMuU291cmNlRmlsZSB8IG51bGwpOiB0cy5UcmFuc2Zvcm1lckZhY3Rvcnk8dHMuU291cmNlRmlsZT4ge1xuICByZXR1cm4gKGNvbnRleHQ6IHRzLlRyYW5zZm9ybWF0aW9uQ29udGV4dCk6IHRzLlRyYW5zZm9ybWVyPHRzLlNvdXJjZUZpbGU+ID0+IHtcbiAgICByZXR1cm4gKGZpbGU6IHRzLlNvdXJjZUZpbGUpOiB0cy5Tb3VyY2VGaWxlID0+IHtcbiAgICAgIHJldHVybiB0cmFuc2Zvcm1GYWN0b3J5U291cmNlRmlsZShmYWN0b3J5TWFwLCBjb250ZXh0LCBjb3JlSW1wb3J0c0Zyb20sIGZpbGUpO1xuICAgIH07XG4gIH07XG59XG5cbmZ1bmN0aW9uIHRyYW5zZm9ybUZhY3RvcnlTb3VyY2VGaWxlKFxuICAgIGZhY3RvcnlNYXA6IE1hcDxzdHJpbmcsIEZhY3RvcnlJbmZvPiwgY29udGV4dDogdHMuVHJhbnNmb3JtYXRpb25Db250ZXh0LFxuICAgIGNvcmVJbXBvcnRzRnJvbTogdHMuU291cmNlRmlsZSB8IG51bGwsIGZpbGU6IHRzLlNvdXJjZUZpbGUpOiB0cy5Tb3VyY2VGaWxlIHtcbiAgLy8gSWYgdGhpcyBpcyBub3QgYSBnZW5lcmF0ZWQgZmlsZSwgaXQgd29uJ3QgaGF2ZSBmYWN0b3J5IGluZm8gYXNzb2NpYXRlZCB3aXRoIGl0LlxuICBpZiAoIWZhY3RvcnlNYXAuaGFzKGZpbGUuZmlsZU5hbWUpKSB7XG4gICAgLy8gRG9uJ3QgdHJhbnNmb3JtIG5vbi1nZW5lcmF0ZWQgY29kZS5cbiAgICByZXR1cm4gZmlsZTtcbiAgfVxuXG4gIGNvbnN0IHttb2R1bGVTeW1ib2xOYW1lcywgc291cmNlRmlsZVBhdGh9ID0gZmFjdG9yeU1hcC5nZXQoZmlsZS5maWxlTmFtZSkgITtcblxuICBjb25zdCBjbG9uZSA9IHRzLmdldE11dGFibGVDbG9uZShmaWxlKTtcblxuICBjb25zdCB0cmFuc2Zvcm1lZFN0YXRlbWVudHMgPSBmaWxlLnN0YXRlbWVudHMubWFwKHN0bXQgPT4ge1xuICAgIGlmIChjb3JlSW1wb3J0c0Zyb20gIT09IG51bGwgJiYgdHMuaXNJbXBvcnREZWNsYXJhdGlvbihzdG10KSAmJlxuICAgICAgICB0cy5pc1N0cmluZ0xpdGVyYWwoc3RtdC5tb2R1bGVTcGVjaWZpZXIpICYmIHN0bXQubW9kdWxlU3BlY2lmaWVyLnRleHQgPT09ICdAYW5ndWxhci9jb3JlJykge1xuICAgICAgY29uc3QgcGF0aCA9IHJlbGF0aXZlUGF0aEJldHdlZW4oc291cmNlRmlsZVBhdGgsIGNvcmVJbXBvcnRzRnJvbS5maWxlTmFtZSk7XG4gICAgICBpZiAocGF0aCAhPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gdHMudXBkYXRlSW1wb3J0RGVjbGFyYXRpb24oXG4gICAgICAgICAgICBzdG10LCBzdG10LmRlY29yYXRvcnMsIHN0bXQubW9kaWZpZXJzLCBzdG10LmltcG9ydENsYXVzZSwgdHMuY3JlYXRlU3RyaW5nTGl0ZXJhbChwYXRoKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdHMuY3JlYXRlTm90RW1pdHRlZFN0YXRlbWVudChzdG10KTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHRzLmlzVmFyaWFibGVTdGF0ZW1lbnQoc3RtdCkgJiYgc3RtdC5kZWNsYXJhdGlvbkxpc3QuZGVjbGFyYXRpb25zLmxlbmd0aCA9PT0gMSkge1xuICAgICAgY29uc3QgZGVjbCA9IHN0bXQuZGVjbGFyYXRpb25MaXN0LmRlY2xhcmF0aW9uc1swXTtcbiAgICAgIGlmICh0cy5pc0lkZW50aWZpZXIoZGVjbC5uYW1lKSkge1xuICAgICAgICBjb25zdCBtYXRjaCA9IFNUUklQX05HX0ZBQ1RPUlkuZXhlYyhkZWNsLm5hbWUudGV4dCk7XG4gICAgICAgIGlmIChtYXRjaCA9PT0gbnVsbCB8fCAhbW9kdWxlU3ltYm9sTmFtZXMuaGFzKG1hdGNoWzFdKSkge1xuICAgICAgICAgIC8vIFJlbW92ZSB0aGUgZ2l2ZW4gZmFjdG9yeSBhcyBpdCB3YXNuJ3QgYWN0dWFsbHkgZm9yIGFuIE5nTW9kdWxlLlxuICAgICAgICAgIHJldHVybiB0cy5jcmVhdGVOb3RFbWl0dGVkU3RhdGVtZW50KHN0bXQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gc3RtdDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHN0bXQ7XG4gICAgfVxuICB9KTtcbiAgaWYgKCF0cmFuc2Zvcm1lZFN0YXRlbWVudHMuc29tZSh0cy5pc1ZhcmlhYmxlU3RhdGVtZW50KSkge1xuICAgIC8vIElmIHRoZSByZXN1bHRpbmcgZmlsZSBoYXMgbm8gZmFjdG9yaWVzLCBpbmNsdWRlIGFuIGVtcHR5IGV4cG9ydCB0b1xuICAgIC8vIHNhdGlzZnkgY2xvc3VyZSBjb21waWxlci5cbiAgICB0cmFuc2Zvcm1lZFN0YXRlbWVudHMucHVzaCh0cy5jcmVhdGVWYXJpYWJsZVN0YXRlbWVudChcbiAgICAgICAgW3RzLmNyZWF0ZU1vZGlmaWVyKHRzLlN5bnRheEtpbmQuRXhwb3J0S2V5d29yZCldLFxuICAgICAgICB0cy5jcmVhdGVWYXJpYWJsZURlY2xhcmF0aW9uTGlzdChcbiAgICAgICAgICAgIFt0cy5jcmVhdGVWYXJpYWJsZURlY2xhcmF0aW9uKCfJtU5vbkVtcHR5TW9kdWxlJywgdW5kZWZpbmVkLCB0cy5jcmVhdGVUcnVlKCkpXSxcbiAgICAgICAgICAgIHRzLk5vZGVGbGFncy5Db25zdCkpKTtcbiAgfVxuICBjbG9uZS5zdGF0ZW1lbnRzID0gdHMuY3JlYXRlTm9kZUFycmF5KHRyYW5zZm9ybWVkU3RhdGVtZW50cyk7XG4gIHJldHVybiBjbG9uZTtcbn1cbiJdfQ==
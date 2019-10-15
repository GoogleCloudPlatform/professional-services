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
        define("@angular/compiler-cli/src/transformers/r3_metadata_transform", ["require", "exports", "tslib", "@angular/compiler", "typescript", "@angular/compiler-cli/src/metadata/index"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var compiler_1 = require("@angular/compiler");
    var ts = require("typescript");
    var index_1 = require("@angular/compiler-cli/src/metadata/index");
    var PartialModuleMetadataTransformer = /** @class */ (function () {
        function PartialModuleMetadataTransformer(modules) {
            this.moduleMap = new Map(modules.map(function (m) { return [m.fileName, m]; }));
        }
        PartialModuleMetadataTransformer.prototype.start = function (sourceFile) {
            var partialModule = this.moduleMap.get(sourceFile.fileName);
            if (partialModule) {
                var classMap_1 = new Map(partialModule.statements.filter(isClassStmt).map(function (s) { return [s.name, s]; }));
                if (classMap_1.size > 0) {
                    return function (value, node) {
                        var e_1, _a, _b;
                        // For class metadata that is going to be transformed to have a static method ensure the
                        // metadata contains a static declaration the new static method.
                        if (index_1.isClassMetadata(value) && node.kind === ts.SyntaxKind.ClassDeclaration) {
                            var classDeclaration = node;
                            if (classDeclaration.name) {
                                var partialClass = classMap_1.get(classDeclaration.name.text);
                                if (partialClass) {
                                    try {
                                        for (var _c = tslib_1.__values(partialClass.fields), _d = _c.next(); !_d.done; _d = _c.next()) {
                                            var field = _d.value;
                                            if (field.name && field.modifiers &&
                                                field.modifiers.some(function (modifier) { return modifier === compiler_1.StmtModifier.Static; })) {
                                                value.statics = tslib_1.__assign({}, (value.statics || {}), (_b = {}, _b[field.name] = {}, _b));
                                            }
                                        }
                                    }
                                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                                    finally {
                                        try {
                                            if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                                        }
                                        finally { if (e_1) throw e_1.error; }
                                    }
                                }
                            }
                        }
                        return value;
                    };
                }
            }
        };
        return PartialModuleMetadataTransformer;
    }());
    exports.PartialModuleMetadataTransformer = PartialModuleMetadataTransformer;
    function isClassStmt(v) {
        return v instanceof compiler_1.ClassStmt;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicjNfbWV0YWRhdGFfdHJhbnNmb3JtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXItY2xpL3NyYy90cmFuc2Zvcm1lcnMvcjNfbWV0YWRhdGFfdHJhbnNmb3JtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILDhDQUFvRjtJQUNwRiwrQkFBaUM7SUFFakMsa0VBQW9HO0lBSXBHO1FBR0UsMENBQVksT0FBd0I7WUFDbEMsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUEwQixVQUFBLENBQUMsSUFBSSxPQUFBLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsRUFBZixDQUFlLENBQUMsQ0FBQyxDQUFDO1FBQ3ZGLENBQUM7UUFFRCxnREFBSyxHQUFMLFVBQU0sVUFBeUI7WUFDN0IsSUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzlELElBQUksYUFBYSxFQUFFO2dCQUNqQixJQUFNLFVBQVEsR0FBRyxJQUFJLEdBQUcsQ0FDcEIsYUFBYSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsR0FBRyxDQUFzQixVQUFBLENBQUMsSUFBSSxPQUFBLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsRUFBWCxDQUFXLENBQUMsQ0FBQyxDQUFDO2dCQUM3RixJQUFJLFVBQVEsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxFQUFFO29CQUNyQixPQUFPLFVBQUMsS0FBb0IsRUFBRSxJQUFhOzt3QkFDekMsd0ZBQXdGO3dCQUN4RixnRUFBZ0U7d0JBQ2hFLElBQUksdUJBQWUsQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLEVBQUU7NEJBQzFFLElBQU0sZ0JBQWdCLEdBQUcsSUFBMkIsQ0FBQzs0QkFDckQsSUFBSSxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUU7Z0NBQ3pCLElBQU0sWUFBWSxHQUFHLFVBQVEsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dDQUM5RCxJQUFJLFlBQVksRUFBRTs7d0NBQ2hCLEtBQW9CLElBQUEsS0FBQSxpQkFBQSxZQUFZLENBQUMsTUFBTSxDQUFBLGdCQUFBLDRCQUFFOzRDQUFwQyxJQUFNLEtBQUssV0FBQTs0Q0FDZCxJQUFJLEtBQUssQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDLFNBQVM7Z0RBQzdCLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQUEsUUFBUSxJQUFJLE9BQUEsUUFBUSxLQUFLLHVCQUFZLENBQUMsTUFBTSxFQUFoQyxDQUFnQyxDQUFDLEVBQUU7Z0RBQ3RFLEtBQUssQ0FBQyxPQUFPLHdCQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sSUFBSSxFQUFFLENBQUMsZUFBRyxLQUFLLENBQUMsSUFBSSxJQUFHLEVBQUUsTUFBQyxDQUFDOzZDQUM5RDt5Q0FDRjs7Ozs7Ozs7O2lDQUNGOzZCQUNGO3lCQUNGO3dCQUNELE9BQU8sS0FBSyxDQUFDO29CQUNmLENBQUMsQ0FBQztpQkFDSDthQUNGO1FBQ0gsQ0FBQztRQUNILHVDQUFDO0lBQUQsQ0FBQyxBQW5DRCxJQW1DQztJQW5DWSw0RUFBZ0M7SUFxQzdDLFNBQVMsV0FBVyxDQUFDLENBQVk7UUFDL0IsT0FBTyxDQUFDLFlBQVksb0JBQVMsQ0FBQztJQUNoQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0NsYXNzU3RtdCwgUGFydGlhbE1vZHVsZSwgU3RhdGVtZW50LCBTdG10TW9kaWZpZXJ9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge01ldGFkYXRhQ29sbGVjdG9yLCBNZXRhZGF0YVZhbHVlLCBNb2R1bGVNZXRhZGF0YSwgaXNDbGFzc01ldGFkYXRhfSBmcm9tICcuLi9tZXRhZGF0YS9pbmRleCc7XG5cbmltcG9ydCB7TWV0YWRhdGFUcmFuc2Zvcm1lciwgVmFsdWVUcmFuc2Zvcm19IGZyb20gJy4vbWV0YWRhdGFfY2FjaGUnO1xuXG5leHBvcnQgY2xhc3MgUGFydGlhbE1vZHVsZU1ldGFkYXRhVHJhbnNmb3JtZXIgaW1wbGVtZW50cyBNZXRhZGF0YVRyYW5zZm9ybWVyIHtcbiAgcHJpdmF0ZSBtb2R1bGVNYXA6IE1hcDxzdHJpbmcsIFBhcnRpYWxNb2R1bGU+O1xuXG4gIGNvbnN0cnVjdG9yKG1vZHVsZXM6IFBhcnRpYWxNb2R1bGVbXSkge1xuICAgIHRoaXMubW9kdWxlTWFwID0gbmV3IE1hcChtb2R1bGVzLm1hcDxbc3RyaW5nLCBQYXJ0aWFsTW9kdWxlXT4obSA9PiBbbS5maWxlTmFtZSwgbV0pKTtcbiAgfVxuXG4gIHN0YXJ0KHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUpOiBWYWx1ZVRyYW5zZm9ybXx1bmRlZmluZWQge1xuICAgIGNvbnN0IHBhcnRpYWxNb2R1bGUgPSB0aGlzLm1vZHVsZU1hcC5nZXQoc291cmNlRmlsZS5maWxlTmFtZSk7XG4gICAgaWYgKHBhcnRpYWxNb2R1bGUpIHtcbiAgICAgIGNvbnN0IGNsYXNzTWFwID0gbmV3IE1hcDxzdHJpbmcsIENsYXNzU3RtdD4oXG4gICAgICAgICAgcGFydGlhbE1vZHVsZS5zdGF0ZW1lbnRzLmZpbHRlcihpc0NsYXNzU3RtdCkubWFwPFtzdHJpbmcsIENsYXNzU3RtdF0+KHMgPT4gW3MubmFtZSwgc10pKTtcbiAgICAgIGlmIChjbGFzc01hcC5zaXplID4gMCkge1xuICAgICAgICByZXR1cm4gKHZhbHVlOiBNZXRhZGF0YVZhbHVlLCBub2RlOiB0cy5Ob2RlKTogTWV0YWRhdGFWYWx1ZSA9PiB7XG4gICAgICAgICAgLy8gRm9yIGNsYXNzIG1ldGFkYXRhIHRoYXQgaXMgZ29pbmcgdG8gYmUgdHJhbnNmb3JtZWQgdG8gaGF2ZSBhIHN0YXRpYyBtZXRob2QgZW5zdXJlIHRoZVxuICAgICAgICAgIC8vIG1ldGFkYXRhIGNvbnRhaW5zIGEgc3RhdGljIGRlY2xhcmF0aW9uIHRoZSBuZXcgc3RhdGljIG1ldGhvZC5cbiAgICAgICAgICBpZiAoaXNDbGFzc01ldGFkYXRhKHZhbHVlKSAmJiBub2RlLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuQ2xhc3NEZWNsYXJhdGlvbikge1xuICAgICAgICAgICAgY29uc3QgY2xhc3NEZWNsYXJhdGlvbiA9IG5vZGUgYXMgdHMuQ2xhc3NEZWNsYXJhdGlvbjtcbiAgICAgICAgICAgIGlmIChjbGFzc0RlY2xhcmF0aW9uLm5hbWUpIHtcbiAgICAgICAgICAgICAgY29uc3QgcGFydGlhbENsYXNzID0gY2xhc3NNYXAuZ2V0KGNsYXNzRGVjbGFyYXRpb24ubmFtZS50ZXh0KTtcbiAgICAgICAgICAgICAgaWYgKHBhcnRpYWxDbGFzcykge1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgZmllbGQgb2YgcGFydGlhbENsYXNzLmZpZWxkcykge1xuICAgICAgICAgICAgICAgICAgaWYgKGZpZWxkLm5hbWUgJiYgZmllbGQubW9kaWZpZXJzICYmXG4gICAgICAgICAgICAgICAgICAgICAgZmllbGQubW9kaWZpZXJzLnNvbWUobW9kaWZpZXIgPT4gbW9kaWZpZXIgPT09IFN0bXRNb2RpZmllci5TdGF0aWMpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlLnN0YXRpY3MgPSB7Li4uKHZhbHVlLnN0YXRpY3MgfHwge30pLCBbZmllbGQubmFtZV06IHt9fTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBpc0NsYXNzU3RtdCh2OiBTdGF0ZW1lbnQpOiB2IGlzIENsYXNzU3RtdCB7XG4gIHJldHVybiB2IGluc3RhbmNlb2YgQ2xhc3NTdG10O1xufVxuIl19
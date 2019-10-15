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
        define("@angular/compiler-cli/src/ngtsc/transform/src/declaration", ["require", "exports", "typescript", "@angular/compiler-cli/src/ngtsc/translator"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ts = require("typescript");
    var translator_1 = require("@angular/compiler-cli/src/ngtsc/translator");
    /**
     * Processes .d.ts file text and adds static field declarations, with types.
     */
    var DtsFileTransformer = /** @class */ (function () {
        function DtsFileTransformer(coreImportsFrom, importPrefix) {
            this.coreImportsFrom = coreImportsFrom;
            this.ivyFields = new Map();
            this.imports = new translator_1.ImportManager(coreImportsFrom !== null, importPrefix);
        }
        /**
         * Track that a static field was added to the code for a class.
         */
        DtsFileTransformer.prototype.recordStaticField = function (name, decls) { this.ivyFields.set(name, decls); };
        /**
         * Process the .d.ts text for a file and add any declarations which were recorded.
         */
        DtsFileTransformer.prototype.transform = function (dts, tsPath) {
            var _this = this;
            var dtsFile = ts.createSourceFile('out.d.ts', dts, ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
            for (var i = dtsFile.statements.length - 1; i >= 0; i--) {
                var stmt = dtsFile.statements[i];
                if (ts.isClassDeclaration(stmt) && stmt.name !== undefined &&
                    this.ivyFields.has(stmt.name.text)) {
                    var decls = this.ivyFields.get(stmt.name.text);
                    var before = dts.substring(0, stmt.end - 1);
                    var after = dts.substring(stmt.end - 1);
                    dts = before +
                        decls
                            .map(function (decl) {
                            var type = translator_1.translateType(decl.type, _this.imports);
                            return "    static " + decl.name + ": " + type + ";\n";
                        })
                            .join('') +
                        after;
                }
            }
            var imports = this.imports.getAllImports(tsPath, this.coreImportsFrom);
            if (imports.length !== 0) {
                dts = imports.map(function (i) { return "import * as " + i.as + " from '" + i.name + "';\n"; }).join('') + dts;
            }
            return dts;
        };
        return DtsFileTransformer;
    }());
    exports.DtsFileTransformer = DtsFileTransformer;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjbGFyYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvc3JjL25ndHNjL3RyYW5zZm9ybS9zcmMvZGVjbGFyYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFFSCwrQkFBaUM7SUFFakMseUVBQThEO0lBTTlEOztPQUVHO0lBQ0g7UUFJRSw0QkFBb0IsZUFBbUMsRUFBRSxZQUFxQjtZQUExRCxvQkFBZSxHQUFmLGVBQWUsQ0FBb0I7WUFIL0MsY0FBUyxHQUFHLElBQUksR0FBRyxFQUEyQixDQUFDO1lBSXJELElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSwwQkFBYSxDQUFDLGVBQWUsS0FBSyxJQUFJLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDM0UsQ0FBQztRQUVEOztXQUVHO1FBQ0gsOENBQWlCLEdBQWpCLFVBQWtCLElBQVksRUFBRSxLQUFzQixJQUFVLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFbEc7O1dBRUc7UUFDSCxzQ0FBUyxHQUFULFVBQVUsR0FBVyxFQUFFLE1BQWM7WUFBckMsaUJBNkJDO1lBNUJDLElBQU0sT0FBTyxHQUNULEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBRTFGLEtBQUssSUFBSSxDQUFDLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQ3ZELElBQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ25DLElBQUksRUFBRSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssU0FBUztvQkFDdEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDdEMsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUcsQ0FBQztvQkFDbkQsSUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFDOUMsSUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUUxQyxHQUFHLEdBQUcsTUFBTTt3QkFDUixLQUFLOzZCQUNBLEdBQUcsQ0FBQyxVQUFBLElBQUk7NEJBQ1AsSUFBTSxJQUFJLEdBQUcsMEJBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQzs0QkFDcEQsT0FBTyxnQkFBYyxJQUFJLENBQUMsSUFBSSxVQUFLLElBQUksUUFBSyxDQUFDO3dCQUMvQyxDQUFDLENBQUM7NkJBQ0QsSUFBSSxDQUFDLEVBQUUsQ0FBQzt3QkFDYixLQUFLLENBQUM7aUJBQ1g7YUFDRjtZQUVELElBQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDekUsSUFBSSxPQUFPLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtnQkFDeEIsR0FBRyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxpQkFBZSxDQUFDLENBQUMsRUFBRSxlQUFVLENBQUMsQ0FBQyxJQUFJLFNBQU0sRUFBekMsQ0FBeUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUM7YUFDbEY7WUFFRCxPQUFPLEdBQUcsQ0FBQztRQUNiLENBQUM7UUFDSCx5QkFBQztJQUFELENBQUMsQUE5Q0QsSUE4Q0M7SUE5Q1ksZ0RBQWtCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtJbXBvcnRNYW5hZ2VyLCB0cmFuc2xhdGVUeXBlfSBmcm9tICcuLi8uLi90cmFuc2xhdG9yJztcblxuaW1wb3J0IHtDb21waWxlUmVzdWx0fSBmcm9tICcuL2FwaSc7XG5cblxuXG4vKipcbiAqIFByb2Nlc3NlcyAuZC50cyBmaWxlIHRleHQgYW5kIGFkZHMgc3RhdGljIGZpZWxkIGRlY2xhcmF0aW9ucywgd2l0aCB0eXBlcy5cbiAqL1xuZXhwb3J0IGNsYXNzIER0c0ZpbGVUcmFuc2Zvcm1lciB7XG4gIHByaXZhdGUgaXZ5RmllbGRzID0gbmV3IE1hcDxzdHJpbmcsIENvbXBpbGVSZXN1bHRbXT4oKTtcbiAgcHJpdmF0ZSBpbXBvcnRzOiBJbXBvcnRNYW5hZ2VyO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgY29yZUltcG9ydHNGcm9tOiB0cy5Tb3VyY2VGaWxlfG51bGwsIGltcG9ydFByZWZpeD86IHN0cmluZykge1xuICAgIHRoaXMuaW1wb3J0cyA9IG5ldyBJbXBvcnRNYW5hZ2VyKGNvcmVJbXBvcnRzRnJvbSAhPT0gbnVsbCwgaW1wb3J0UHJlZml4KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUcmFjayB0aGF0IGEgc3RhdGljIGZpZWxkIHdhcyBhZGRlZCB0byB0aGUgY29kZSBmb3IgYSBjbGFzcy5cbiAgICovXG4gIHJlY29yZFN0YXRpY0ZpZWxkKG5hbWU6IHN0cmluZywgZGVjbHM6IENvbXBpbGVSZXN1bHRbXSk6IHZvaWQgeyB0aGlzLml2eUZpZWxkcy5zZXQobmFtZSwgZGVjbHMpOyB9XG5cbiAgLyoqXG4gICAqIFByb2Nlc3MgdGhlIC5kLnRzIHRleHQgZm9yIGEgZmlsZSBhbmQgYWRkIGFueSBkZWNsYXJhdGlvbnMgd2hpY2ggd2VyZSByZWNvcmRlZC5cbiAgICovXG4gIHRyYW5zZm9ybShkdHM6IHN0cmluZywgdHNQYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGR0c0ZpbGUgPVxuICAgICAgICB0cy5jcmVhdGVTb3VyY2VGaWxlKCdvdXQuZC50cycsIGR0cywgdHMuU2NyaXB0VGFyZ2V0LkxhdGVzdCwgZmFsc2UsIHRzLlNjcmlwdEtpbmQuVFMpO1xuXG4gICAgZm9yIChsZXQgaSA9IGR0c0ZpbGUuc3RhdGVtZW50cy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgY29uc3Qgc3RtdCA9IGR0c0ZpbGUuc3RhdGVtZW50c1tpXTtcbiAgICAgIGlmICh0cy5pc0NsYXNzRGVjbGFyYXRpb24oc3RtdCkgJiYgc3RtdC5uYW1lICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICB0aGlzLml2eUZpZWxkcy5oYXMoc3RtdC5uYW1lLnRleHQpKSB7XG4gICAgICAgIGNvbnN0IGRlY2xzID0gdGhpcy5pdnlGaWVsZHMuZ2V0KHN0bXQubmFtZS50ZXh0KSAhO1xuICAgICAgICBjb25zdCBiZWZvcmUgPSBkdHMuc3Vic3RyaW5nKDAsIHN0bXQuZW5kIC0gMSk7XG4gICAgICAgIGNvbnN0IGFmdGVyID0gZHRzLnN1YnN0cmluZyhzdG10LmVuZCAtIDEpO1xuXG4gICAgICAgIGR0cyA9IGJlZm9yZSArXG4gICAgICAgICAgICBkZWNsc1xuICAgICAgICAgICAgICAgIC5tYXAoZGVjbCA9PiB7XG4gICAgICAgICAgICAgICAgICBjb25zdCB0eXBlID0gdHJhbnNsYXRlVHlwZShkZWNsLnR5cGUsIHRoaXMuaW1wb3J0cyk7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gYCAgICBzdGF0aWMgJHtkZWNsLm5hbWV9OiAke3R5cGV9O1xcbmA7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuam9pbignJykgK1xuICAgICAgICAgICAgYWZ0ZXI7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgaW1wb3J0cyA9IHRoaXMuaW1wb3J0cy5nZXRBbGxJbXBvcnRzKHRzUGF0aCwgdGhpcy5jb3JlSW1wb3J0c0Zyb20pO1xuICAgIGlmIChpbXBvcnRzLmxlbmd0aCAhPT0gMCkge1xuICAgICAgZHRzID0gaW1wb3J0cy5tYXAoaSA9PiBgaW1wb3J0ICogYXMgJHtpLmFzfSBmcm9tICcke2kubmFtZX0nO1xcbmApLmpvaW4oJycpICsgZHRzO1xuICAgIH1cblxuICAgIHJldHVybiBkdHM7XG4gIH1cbn1cbiJdfQ==
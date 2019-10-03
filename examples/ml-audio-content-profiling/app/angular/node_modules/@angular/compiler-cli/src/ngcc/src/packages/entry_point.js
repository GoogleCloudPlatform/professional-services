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
        define("@angular/compiler-cli/src/ngcc/src/packages/entry_point", ["require", "exports", "canonical-path", "fs"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var path = require("canonical-path");
    var fs = require("fs");
    /**
     * Try to get entry point info from the given path.
     * @param pkgPath the absolute path to the containing npm package
     * @param entryPoint the absolute path to the potential entry point.
     * @returns Info about the entry point if it is valid, `null` otherwise.
     */
    function getEntryPointInfo(pkgPath, entryPoint) {
        var packageJsonPath = path.resolve(entryPoint, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            return null;
        }
        // According to https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html,
        // `types` and `typings` are interchangeable.
        var _a = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')), name = _a.name, fesm2015 = _a.fesm2015, fesm5 = _a.fesm5, esm2015 = _a.esm2015, esm5 = _a.esm5, main = _a.main, types = _a.types, _b = _a.typings, typings = _b === void 0 ? types : _b;
        // Minimum requirement is that we have esm2015 format and typings.
        if (!typings || !esm2015) {
            return null;
        }
        // Also we need to have a metadata.json file
        var metadataPath = path.resolve(entryPoint, typings.replace(/\.d\.ts$/, '') + '.metadata.json');
        if (!fs.existsSync(metadataPath)) {
            return null;
        }
        var entryPointInfo = {
            name: name,
            package: pkgPath,
            path: entryPoint,
            typings: path.resolve(entryPoint, typings),
            esm2015: path.resolve(entryPoint, esm2015),
        };
        if (fesm2015) {
            entryPointInfo.fesm2015 = path.resolve(entryPoint, fesm2015);
        }
        if (fesm5) {
            entryPointInfo.fesm5 = path.resolve(entryPoint, fesm5);
        }
        if (esm5) {
            entryPointInfo.esm5 = path.resolve(entryPoint, esm5);
        }
        if (main) {
            entryPointInfo.umd = path.resolve(entryPoint, main);
        }
        return entryPointInfo;
    }
    exports.getEntryPointInfo = getEntryPointInfo;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW50cnlfcG9pbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvc3JjL25nY2Mvc3JjL3BhY2thZ2VzL2VudHJ5X3BvaW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBRUgscUNBQXVDO0lBQ3ZDLHVCQUF5QjtJQXlDekI7Ozs7O09BS0c7SUFDSCxTQUFnQixpQkFBaUIsQ0FBQyxPQUFlLEVBQUUsVUFBa0I7UUFDbkUsSUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDakUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLEVBQUU7WUFDbkMsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUVELCtGQUErRjtRQUMvRiw2Q0FBNkM7UUFDdkMsSUFBQSx5REFDMEUsRUFEekUsY0FBSSxFQUFFLHNCQUFRLEVBQUUsZ0JBQUssRUFBRSxvQkFBTyxFQUFFLGNBQUksRUFBRSxjQUFJLEVBQUUsZ0JBQUssRUFBRSxlQUFlLEVBQWYsb0NBQ3NCLENBQUM7UUFFakYsa0VBQWtFO1FBQ2xFLElBQUksQ0FBQyxPQUFPLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDeEIsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUVELDRDQUE0QztRQUM1QyxJQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsR0FBRyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ2xHLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxFQUFFO1lBQ2hDLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFFRCxJQUFNLGNBQWMsR0FBZTtZQUNqQyxJQUFJLE1BQUE7WUFDSixPQUFPLEVBQUUsT0FBTztZQUNoQixJQUFJLEVBQUUsVUFBVTtZQUNoQixPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDO1lBQzFDLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUM7U0FDM0MsQ0FBQztRQUVGLElBQUksUUFBUSxFQUFFO1lBQ1osY0FBYyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztTQUM5RDtRQUNELElBQUksS0FBSyxFQUFFO1lBQ1QsY0FBYyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsQ0FBQztTQUN4RDtRQUNELElBQUksSUFBSSxFQUFFO1lBQ1IsY0FBYyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztTQUN0RDtRQUNELElBQUksSUFBSSxFQUFFO1lBQ1IsY0FBYyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztTQUNyRDtRQUVELE9BQU8sY0FBYyxDQUFDO0lBQ3hCLENBQUM7SUE1Q0QsOENBNENDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ2Nhbm9uaWNhbC1wYXRoJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcblxuXG4vKipcbiAqIFRoZSBwb3NzaWJsZSB2YWx1ZXMgZm9yIHRoZSBmb3JtYXQgb2YgYW4gZW50cnktcG9pbnQuXG4gKi9cbmV4cG9ydCB0eXBlIEVudHJ5UG9pbnRGb3JtYXQgPSAnZXNtNScgfCAnZmVzbTUnIHwgJ2VzbTIwMTUnIHwgJ2Zlc20yMDE1JyB8ICd1bWQnO1xuXG4vKipcbiAqIEFuIG9iamVjdCBjb250YWluaW5nIHBhdGhzIHRvIHRoZSBlbnRyeS1wb2ludHMgZm9yIGVhY2ggZm9ybWF0LlxuICovXG5leHBvcnQgdHlwZSBFbnRyeVBvaW50UGF0aHMgPSB7XG4gIFtGb3JtYXQgaW4gRW50cnlQb2ludEZvcm1hdF0/OiBzdHJpbmc7XG59O1xuXG4vKipcbiAqIEFuIG9iamVjdCBjb250YWluaW5nIGluZm9ybWF0aW9uIGFib3V0IGFuIGVudHJ5LXBvaW50LCBpbmNsdWRpbmcgcGF0aHNcbiAqIHRvIGVhY2ggb2YgdGhlIHBvc3NpYmxlIGVudHJ5LXBvaW50IGZvcm1hdHMuXG4gKi9cbmV4cG9ydCB0eXBlIEVudHJ5UG9pbnQgPSBFbnRyeVBvaW50UGF0aHMgJiB7XG4gIC8qKiBUaGUgbmFtZSBvZiB0aGUgcGFja2FnZSAoZS5nLiBgQGFuZ3VsYXIvY29yZWApLiAqL1xuICBuYW1lOiBzdHJpbmc7XG4gIC8qKiBUaGUgcGF0aCB0byB0aGUgcGFja2FnZSB0aGF0IGNvbnRhaW5zIHRoaXMgZW50cnktcG9pbnQuICovXG4gIHBhY2thZ2U6IHN0cmluZztcbiAgLyoqIFRoZSBwYXRoIHRvIHRoaXMgZW50cnkgcG9pbnQuICovXG4gIHBhdGg6IHN0cmluZztcbiAgLyoqIFRoZSBwYXRoIHRvIGEgdHlwaW5ncyAoLmQudHMpIGZpbGUgZm9yIHRoaXMgZW50cnktcG9pbnQuICovXG4gIHR5cGluZ3M6IHN0cmluZztcbn07XG5cbmludGVyZmFjZSBFbnRyeVBvaW50UGFja2FnZUpzb24ge1xuICBuYW1lOiBzdHJpbmc7XG4gIGZlc20yMDE1Pzogc3RyaW5nO1xuICBmZXNtNT86IHN0cmluZztcbiAgZXNtMjAxNT86IHN0cmluZztcbiAgZXNtNT86IHN0cmluZztcbiAgbWFpbj86IHN0cmluZztcbiAgdHlwZXM/OiBzdHJpbmc7XG4gIHR5cGluZ3M/OiBzdHJpbmc7XG59XG5cbi8qKlxuICogVHJ5IHRvIGdldCBlbnRyeSBwb2ludCBpbmZvIGZyb20gdGhlIGdpdmVuIHBhdGguXG4gKiBAcGFyYW0gcGtnUGF0aCB0aGUgYWJzb2x1dGUgcGF0aCB0byB0aGUgY29udGFpbmluZyBucG0gcGFja2FnZVxuICogQHBhcmFtIGVudHJ5UG9pbnQgdGhlIGFic29sdXRlIHBhdGggdG8gdGhlIHBvdGVudGlhbCBlbnRyeSBwb2ludC5cbiAqIEByZXR1cm5zIEluZm8gYWJvdXQgdGhlIGVudHJ5IHBvaW50IGlmIGl0IGlzIHZhbGlkLCBgbnVsbGAgb3RoZXJ3aXNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RW50cnlQb2ludEluZm8ocGtnUGF0aDogc3RyaW5nLCBlbnRyeVBvaW50OiBzdHJpbmcpOiBFbnRyeVBvaW50fG51bGwge1xuICBjb25zdCBwYWNrYWdlSnNvblBhdGggPSBwYXRoLnJlc29sdmUoZW50cnlQb2ludCwgJ3BhY2thZ2UuanNvbicpO1xuICBpZiAoIWZzLmV4aXN0c1N5bmMocGFja2FnZUpzb25QYXRoKSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLy8gQWNjb3JkaW5nIHRvIGh0dHBzOi8vd3d3LnR5cGVzY3JpcHRsYW5nLm9yZy9kb2NzL2hhbmRib29rL2RlY2xhcmF0aW9uLWZpbGVzL3B1Ymxpc2hpbmcuaHRtbCxcbiAgLy8gYHR5cGVzYCBhbmQgYHR5cGluZ3NgIGFyZSBpbnRlcmNoYW5nZWFibGUuXG4gIGNvbnN0IHtuYW1lLCBmZXNtMjAxNSwgZmVzbTUsIGVzbTIwMTUsIGVzbTUsIG1haW4sIHR5cGVzLCB0eXBpbmdzID0gdHlwZXN9OlxuICAgICAgRW50cnlQb2ludFBhY2thZ2VKc29uID0gSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMocGFja2FnZUpzb25QYXRoLCAndXRmOCcpKTtcblxuICAvLyBNaW5pbXVtIHJlcXVpcmVtZW50IGlzIHRoYXQgd2UgaGF2ZSBlc20yMDE1IGZvcm1hdCBhbmQgdHlwaW5ncy5cbiAgaWYgKCF0eXBpbmdzIHx8ICFlc20yMDE1KSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvLyBBbHNvIHdlIG5lZWQgdG8gaGF2ZSBhIG1ldGFkYXRhLmpzb24gZmlsZVxuICBjb25zdCBtZXRhZGF0YVBhdGggPSBwYXRoLnJlc29sdmUoZW50cnlQb2ludCwgdHlwaW5ncy5yZXBsYWNlKC9cXC5kXFwudHMkLywgJycpICsgJy5tZXRhZGF0YS5qc29uJyk7XG4gIGlmICghZnMuZXhpc3RzU3luYyhtZXRhZGF0YVBhdGgpKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCBlbnRyeVBvaW50SW5mbzogRW50cnlQb2ludCA9IHtcbiAgICBuYW1lLFxuICAgIHBhY2thZ2U6IHBrZ1BhdGgsXG4gICAgcGF0aDogZW50cnlQb2ludCxcbiAgICB0eXBpbmdzOiBwYXRoLnJlc29sdmUoZW50cnlQb2ludCwgdHlwaW5ncyksXG4gICAgZXNtMjAxNTogcGF0aC5yZXNvbHZlKGVudHJ5UG9pbnQsIGVzbTIwMTUpLFxuICB9O1xuXG4gIGlmIChmZXNtMjAxNSkge1xuICAgIGVudHJ5UG9pbnRJbmZvLmZlc20yMDE1ID0gcGF0aC5yZXNvbHZlKGVudHJ5UG9pbnQsIGZlc20yMDE1KTtcbiAgfVxuICBpZiAoZmVzbTUpIHtcbiAgICBlbnRyeVBvaW50SW5mby5mZXNtNSA9IHBhdGgucmVzb2x2ZShlbnRyeVBvaW50LCBmZXNtNSk7XG4gIH1cbiAgaWYgKGVzbTUpIHtcbiAgICBlbnRyeVBvaW50SW5mby5lc201ID0gcGF0aC5yZXNvbHZlKGVudHJ5UG9pbnQsIGVzbTUpO1xuICB9XG4gIGlmIChtYWluKSB7XG4gICAgZW50cnlQb2ludEluZm8udW1kID0gcGF0aC5yZXNvbHZlKGVudHJ5UG9pbnQsIG1haW4pO1xuICB9XG5cbiAgcmV0dXJuIGVudHJ5UG9pbnRJbmZvO1xufVxuIl19
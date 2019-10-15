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
        define("@angular/compiler-cli/src/transformers/util", ["require", "exports", "tslib", "@angular/compiler", "path", "typescript", "@angular/compiler-cli/src/transformers/api"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var compiler_1 = require("@angular/compiler");
    var path = require("path");
    var ts = require("typescript");
    var api_1 = require("@angular/compiler-cli/src/transformers/api");
    exports.GENERATED_FILES = /(.*?)\.(ngfactory|shim\.ngstyle|ngstyle|ngsummary)\.(js|d\.ts|ts)$/;
    exports.DTS = /\.d\.ts$/;
    exports.TS = /^(?!.*\.d\.ts$).*\.ts$/;
    // Note: This is an internal property in TypeScript. Use it only for assertions and tests.
    function tsStructureIsReused(program) {
        return program.structureIsReused;
    }
    exports.tsStructureIsReused = tsStructureIsReused;
    function error(msg) {
        throw new Error("Internal error: " + msg);
    }
    exports.error = error;
    function userError(msg) {
        throw compiler_1.syntaxError(msg);
    }
    exports.userError = userError;
    function createMessageDiagnostic(messageText) {
        return {
            file: undefined,
            start: undefined,
            length: undefined,
            category: ts.DiagnosticCategory.Message, messageText: messageText,
            code: api_1.DEFAULT_ERROR_CODE,
            source: api_1.SOURCE,
        };
    }
    exports.createMessageDiagnostic = createMessageDiagnostic;
    function isInRootDir(fileName, options) {
        return !options.rootDir || pathStartsWithPrefix(options.rootDir, fileName);
    }
    exports.isInRootDir = isInRootDir;
    function relativeToRootDirs(filePath, rootDirs) {
        var e_1, _a;
        if (!filePath)
            return filePath;
        try {
            for (var _b = tslib_1.__values(rootDirs || []), _c = _b.next(); !_c.done; _c = _b.next()) {
                var dir = _c.value;
                var rel = pathStartsWithPrefix(dir, filePath);
                if (rel) {
                    return rel;
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
        return filePath;
    }
    exports.relativeToRootDirs = relativeToRootDirs;
    function pathStartsWithPrefix(prefix, fullPath) {
        var rel = path.relative(prefix, fullPath);
        return rel.startsWith('..') ? null : rel;
    }
    /**
     * Converts a ng.Diagnostic into a ts.Diagnostic.
     * This looses some information, and also uses an incomplete object as `file`.
     *
     * I.e. only use this where the API allows only a ts.Diagnostic.
     */
    function ngToTsDiagnostic(ng) {
        var file;
        var start;
        var length;
        if (ng.span) {
            // Note: We can't use a real ts.SourceFile,
            // but we can at least mirror the properties `fileName` and `text`, which
            // are mostly used for error reporting.
            file = { fileName: ng.span.start.file.url, text: ng.span.start.file.content };
            start = ng.span.start.offset;
            length = ng.span.end.offset - start;
        }
        return {
            file: file,
            messageText: ng.messageText,
            category: ng.category,
            code: ng.code, start: start, length: length,
        };
    }
    exports.ngToTsDiagnostic = ngToTsDiagnostic;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyLWNsaS9zcmMvdHJhbnNmb3JtZXJzL3V0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7O0lBRUgsOENBQThDO0lBQzlDLDJCQUE2QjtJQUM3QiwrQkFBaUM7SUFFakMsa0VBQThFO0lBRWpFLFFBQUEsZUFBZSxHQUFHLG9FQUFvRSxDQUFDO0lBQ3ZGLFFBQUEsR0FBRyxHQUFHLFVBQVUsQ0FBQztJQUNqQixRQUFBLEVBQUUsR0FBRyx3QkFBd0IsQ0FBQztJQUkzQywwRkFBMEY7SUFDMUYsU0FBZ0IsbUJBQW1CLENBQUMsT0FBbUI7UUFDckQsT0FBUSxPQUFlLENBQUMsaUJBQWlCLENBQUM7SUFDNUMsQ0FBQztJQUZELGtEQUVDO0lBRUQsU0FBZ0IsS0FBSyxDQUFDLEdBQVc7UUFDL0IsTUFBTSxJQUFJLEtBQUssQ0FBQyxxQkFBbUIsR0FBSyxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUZELHNCQUVDO0lBRUQsU0FBZ0IsU0FBUyxDQUFDLEdBQVc7UUFDbkMsTUFBTSxzQkFBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3pCLENBQUM7SUFGRCw4QkFFQztJQUVELFNBQWdCLHVCQUF1QixDQUFDLFdBQW1CO1FBQ3pELE9BQU87WUFDTCxJQUFJLEVBQUUsU0FBUztZQUNmLEtBQUssRUFBRSxTQUFTO1lBQ2hCLE1BQU0sRUFBRSxTQUFTO1lBQ2pCLFFBQVEsRUFBRSxFQUFFLENBQUMsa0JBQWtCLENBQUMsT0FBTyxFQUFFLFdBQVcsYUFBQTtZQUNwRCxJQUFJLEVBQUUsd0JBQWtCO1lBQ3hCLE1BQU0sRUFBRSxZQUFNO1NBQ2YsQ0FBQztJQUNKLENBQUM7SUFURCwwREFTQztJQUVELFNBQWdCLFdBQVcsQ0FBQyxRQUFnQixFQUFFLE9BQXdCO1FBQ3BFLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxJQUFJLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDN0UsQ0FBQztJQUZELGtDQUVDO0lBRUQsU0FBZ0Isa0JBQWtCLENBQUMsUUFBZ0IsRUFBRSxRQUFrQjs7UUFDckUsSUFBSSxDQUFDLFFBQVE7WUFBRSxPQUFPLFFBQVEsQ0FBQzs7WUFDL0IsS0FBa0IsSUFBQSxLQUFBLGlCQUFBLFFBQVEsSUFBSSxFQUFFLENBQUEsZ0JBQUEsNEJBQUU7Z0JBQTdCLElBQU0sR0FBRyxXQUFBO2dCQUNaLElBQU0sR0FBRyxHQUFHLG9CQUFvQixDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDaEQsSUFBSSxHQUFHLEVBQUU7b0JBQ1AsT0FBTyxHQUFHLENBQUM7aUJBQ1o7YUFDRjs7Ozs7Ozs7O1FBQ0QsT0FBTyxRQUFRLENBQUM7SUFDbEIsQ0FBQztJQVRELGdEQVNDO0lBRUQsU0FBUyxvQkFBb0IsQ0FBQyxNQUFjLEVBQUUsUUFBZ0I7UUFDNUQsSUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDNUMsT0FBTyxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztJQUMzQyxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxTQUFnQixnQkFBZ0IsQ0FBQyxFQUFjO1FBQzdDLElBQUksSUFBNkIsQ0FBQztRQUNsQyxJQUFJLEtBQXVCLENBQUM7UUFDNUIsSUFBSSxNQUF3QixDQUFDO1FBQzdCLElBQUksRUFBRSxDQUFDLElBQUksRUFBRTtZQUNYLDJDQUEyQztZQUMzQyx5RUFBeUU7WUFDekUsdUNBQXVDO1lBQ3ZDLElBQUksR0FBRyxFQUFFLFFBQVEsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFtQixDQUFDO1lBQy9GLEtBQUssR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUM7WUFDN0IsTUFBTSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7U0FDckM7UUFDRCxPQUFPO1lBQ0wsSUFBSSxNQUFBO1lBQ0osV0FBVyxFQUFFLEVBQUUsQ0FBQyxXQUFXO1lBQzNCLFFBQVEsRUFBRSxFQUFFLENBQUMsUUFBUTtZQUNyQixJQUFJLEVBQUUsRUFBRSxDQUFDLElBQUksRUFBRSxLQUFLLE9BQUEsRUFBRSxNQUFNLFFBQUE7U0FDN0IsQ0FBQztJQUNKLENBQUM7SUFsQkQsNENBa0JDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge3N5bnRheEVycm9yfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7Q29tcGlsZXJPcHRpb25zLCBERUZBVUxUX0VSUk9SX0NPREUsIERpYWdub3N0aWMsIFNPVVJDRX0gZnJvbSAnLi9hcGknO1xuXG5leHBvcnQgY29uc3QgR0VORVJBVEVEX0ZJTEVTID0gLyguKj8pXFwuKG5nZmFjdG9yeXxzaGltXFwubmdzdHlsZXxuZ3N0eWxlfG5nc3VtbWFyeSlcXC4oanN8ZFxcLnRzfHRzKSQvO1xuZXhwb3J0IGNvbnN0IERUUyA9IC9cXC5kXFwudHMkLztcbmV4cG9ydCBjb25zdCBUUyA9IC9eKD8hLipcXC5kXFwudHMkKS4qXFwudHMkLztcblxuZXhwb3J0IGNvbnN0IGVudW0gU3RydWN0dXJlSXNSZXVzZWQge05vdCA9IDAsIFNhZmVNb2R1bGVzID0gMSwgQ29tcGxldGVseSA9IDJ9XG5cbi8vIE5vdGU6IFRoaXMgaXMgYW4gaW50ZXJuYWwgcHJvcGVydHkgaW4gVHlwZVNjcmlwdC4gVXNlIGl0IG9ubHkgZm9yIGFzc2VydGlvbnMgYW5kIHRlc3RzLlxuZXhwb3J0IGZ1bmN0aW9uIHRzU3RydWN0dXJlSXNSZXVzZWQocHJvZ3JhbTogdHMuUHJvZ3JhbSk6IFN0cnVjdHVyZUlzUmV1c2VkIHtcbiAgcmV0dXJuIChwcm9ncmFtIGFzIGFueSkuc3RydWN0dXJlSXNSZXVzZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlcnJvcihtc2c6IHN0cmluZyk6IG5ldmVyIHtcbiAgdGhyb3cgbmV3IEVycm9yKGBJbnRlcm5hbCBlcnJvcjogJHttc2d9YCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1c2VyRXJyb3IobXNnOiBzdHJpbmcpOiBuZXZlciB7XG4gIHRocm93IHN5bnRheEVycm9yKG1zZyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVNZXNzYWdlRGlhZ25vc3RpYyhtZXNzYWdlVGV4dDogc3RyaW5nKTogdHMuRGlhZ25vc3RpYyZEaWFnbm9zdGljIHtcbiAgcmV0dXJuIHtcbiAgICBmaWxlOiB1bmRlZmluZWQsXG4gICAgc3RhcnQ6IHVuZGVmaW5lZCxcbiAgICBsZW5ndGg6IHVuZGVmaW5lZCxcbiAgICBjYXRlZ29yeTogdHMuRGlhZ25vc3RpY0NhdGVnb3J5Lk1lc3NhZ2UsIG1lc3NhZ2VUZXh0LFxuICAgIGNvZGU6IERFRkFVTFRfRVJST1JfQ09ERSxcbiAgICBzb3VyY2U6IFNPVVJDRSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzSW5Sb290RGlyKGZpbGVOYW1lOiBzdHJpbmcsIG9wdGlvbnM6IENvbXBpbGVyT3B0aW9ucykge1xuICByZXR1cm4gIW9wdGlvbnMucm9vdERpciB8fCBwYXRoU3RhcnRzV2l0aFByZWZpeChvcHRpb25zLnJvb3REaXIsIGZpbGVOYW1lKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbGF0aXZlVG9Sb290RGlycyhmaWxlUGF0aDogc3RyaW5nLCByb290RGlyczogc3RyaW5nW10pOiBzdHJpbmcge1xuICBpZiAoIWZpbGVQYXRoKSByZXR1cm4gZmlsZVBhdGg7XG4gIGZvciAoY29uc3QgZGlyIG9mIHJvb3REaXJzIHx8IFtdKSB7XG4gICAgY29uc3QgcmVsID0gcGF0aFN0YXJ0c1dpdGhQcmVmaXgoZGlyLCBmaWxlUGF0aCk7XG4gICAgaWYgKHJlbCkge1xuICAgICAgcmV0dXJuIHJlbDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZpbGVQYXRoO1xufVxuXG5mdW5jdGlvbiBwYXRoU3RhcnRzV2l0aFByZWZpeChwcmVmaXg6IHN0cmluZywgZnVsbFBhdGg6IHN0cmluZyk6IHN0cmluZ3xudWxsIHtcbiAgY29uc3QgcmVsID0gcGF0aC5yZWxhdGl2ZShwcmVmaXgsIGZ1bGxQYXRoKTtcbiAgcmV0dXJuIHJlbC5zdGFydHNXaXRoKCcuLicpID8gbnVsbCA6IHJlbDtcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyBhIG5nLkRpYWdub3N0aWMgaW50byBhIHRzLkRpYWdub3N0aWMuXG4gKiBUaGlzIGxvb3NlcyBzb21lIGluZm9ybWF0aW9uLCBhbmQgYWxzbyB1c2VzIGFuIGluY29tcGxldGUgb2JqZWN0IGFzIGBmaWxlYC5cbiAqXG4gKiBJLmUuIG9ubHkgdXNlIHRoaXMgd2hlcmUgdGhlIEFQSSBhbGxvd3Mgb25seSBhIHRzLkRpYWdub3N0aWMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBuZ1RvVHNEaWFnbm9zdGljKG5nOiBEaWFnbm9zdGljKTogdHMuRGlhZ25vc3RpYyB7XG4gIGxldCBmaWxlOiB0cy5Tb3VyY2VGaWxlfHVuZGVmaW5lZDtcbiAgbGV0IHN0YXJ0OiBudW1iZXJ8dW5kZWZpbmVkO1xuICBsZXQgbGVuZ3RoOiBudW1iZXJ8dW5kZWZpbmVkO1xuICBpZiAobmcuc3Bhbikge1xuICAgIC8vIE5vdGU6IFdlIGNhbid0IHVzZSBhIHJlYWwgdHMuU291cmNlRmlsZSxcbiAgICAvLyBidXQgd2UgY2FuIGF0IGxlYXN0IG1pcnJvciB0aGUgcHJvcGVydGllcyBgZmlsZU5hbWVgIGFuZCBgdGV4dGAsIHdoaWNoXG4gICAgLy8gYXJlIG1vc3RseSB1c2VkIGZvciBlcnJvciByZXBvcnRpbmcuXG4gICAgZmlsZSA9IHsgZmlsZU5hbWU6IG5nLnNwYW4uc3RhcnQuZmlsZS51cmwsIHRleHQ6IG5nLnNwYW4uc3RhcnQuZmlsZS5jb250ZW50IH0gYXMgdHMuU291cmNlRmlsZTtcbiAgICBzdGFydCA9IG5nLnNwYW4uc3RhcnQub2Zmc2V0O1xuICAgIGxlbmd0aCA9IG5nLnNwYW4uZW5kLm9mZnNldCAtIHN0YXJ0O1xuICB9XG4gIHJldHVybiB7XG4gICAgZmlsZSxcbiAgICBtZXNzYWdlVGV4dDogbmcubWVzc2FnZVRleHQsXG4gICAgY2F0ZWdvcnk6IG5nLmNhdGVnb3J5LFxuICAgIGNvZGU6IG5nLmNvZGUsIHN0YXJ0LCBsZW5ndGgsXG4gIH07XG59XG4iXX0=
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
        define("@angular/compiler-cli/src/ngtsc/util/src/path", ["require", "exports", "path"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /// <reference types="node" />
    var path = require("path");
    var TS_DTS_EXTENSION = /(\.d)?\.ts$/;
    function relativePathBetween(from, to) {
        var relative = path.posix.relative(path.dirname(from), to).replace(TS_DTS_EXTENSION, '');
        if (relative === '') {
            return null;
        }
        // path.relative() does not include the leading './'.
        if (!relative.startsWith('.')) {
            relative = "./" + relative;
        }
        return relative;
    }
    exports.relativePathBetween = relativePathBetween;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF0aC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyLWNsaS9zcmMvbmd0c2MvdXRpbC9zcmMvcGF0aC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILDhCQUE4QjtJQUU5QiwyQkFBNkI7SUFFN0IsSUFBTSxnQkFBZ0IsR0FBRyxhQUFhLENBQUM7SUFFdkMsU0FBZ0IsbUJBQW1CLENBQUMsSUFBWSxFQUFFLEVBQVU7UUFDMUQsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFekYsSUFBSSxRQUFRLEtBQUssRUFBRSxFQUFFO1lBQ25CLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFFRCxxREFBcUQ7UUFDckQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDN0IsUUFBUSxHQUFHLE9BQUssUUFBVSxDQUFDO1NBQzVCO1FBRUQsT0FBTyxRQUFRLENBQUM7SUFDbEIsQ0FBQztJQWJELGtEQWFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vLy8gPHJlZmVyZW5jZSB0eXBlcz1cIm5vZGVcIiAvPlxuXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuXG5jb25zdCBUU19EVFNfRVhURU5TSU9OID0gLyhcXC5kKT9cXC50cyQvO1xuXG5leHBvcnQgZnVuY3Rpb24gcmVsYXRpdmVQYXRoQmV0d2Vlbihmcm9tOiBzdHJpbmcsIHRvOiBzdHJpbmcpOiBzdHJpbmd8bnVsbCB7XG4gIGxldCByZWxhdGl2ZSA9IHBhdGgucG9zaXgucmVsYXRpdmUocGF0aC5kaXJuYW1lKGZyb20pLCB0bykucmVwbGFjZShUU19EVFNfRVhURU5TSU9OLCAnJyk7XG5cbiAgaWYgKHJlbGF0aXZlID09PSAnJykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLy8gcGF0aC5yZWxhdGl2ZSgpIGRvZXMgbm90IGluY2x1ZGUgdGhlIGxlYWRpbmcgJy4vJy5cbiAgaWYgKCFyZWxhdGl2ZS5zdGFydHNXaXRoKCcuJykpIHtcbiAgICByZWxhdGl2ZSA9IGAuLyR7cmVsYXRpdmV9YDtcbiAgfVxuXG4gIHJldHVybiByZWxhdGl2ZTtcbn0iXX0=
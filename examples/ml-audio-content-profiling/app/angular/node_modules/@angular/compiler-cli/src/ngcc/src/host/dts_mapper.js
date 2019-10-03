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
        define("@angular/compiler-cli/src/ngcc/src/host/dts_mapper", ["require", "exports", "canonical-path"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var canonical_path_1 = require("canonical-path");
    /**
     * Map source files to their associated typings definitions files.
     */
    var DtsMapper = /** @class */ (function () {
        function DtsMapper(sourceRoot, dtsRoot) {
            this.sourceRoot = sourceRoot;
            this.dtsRoot = dtsRoot;
        }
        /**
         * Given the absolute path to a source file, return the absolute path to the corresponding `.d.ts`
         * file. Assume that source files and `.d.ts` files have the same directory layout and the names
         * of the `.d.ts` files can be derived by replacing the `.js` extension of the source file with
         * `.d.ts`.
         *
         * @param sourceFileName The absolute path to the source file whose corresponding `.d.ts` file
         *     should be returned.
         *
         * @returns The absolute path to the `.d.ts` file that corresponds to the specified source file.
         */
        DtsMapper.prototype.getDtsFileNameFor = function (sourceFileName) {
            var relativeSourcePath = canonical_path_1.relative(this.sourceRoot, sourceFileName);
            return canonical_path_1.resolve(this.dtsRoot, relativeSourcePath).replace(/\.js$/, '.d.ts');
        };
        return DtsMapper;
    }());
    exports.DtsMapper = DtsMapper;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHRzX21hcHBlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyLWNsaS9zcmMvbmdjYy9zcmMvaG9zdC9kdHNfbWFwcGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBRUgsaURBQWlEO0lBRWpEOztPQUVHO0lBQ0g7UUFDRSxtQkFBb0IsVUFBa0IsRUFBVSxPQUFlO1lBQTNDLGVBQVUsR0FBVixVQUFVLENBQVE7WUFBVSxZQUFPLEdBQVAsT0FBTyxDQUFRO1FBQUcsQ0FBQztRQUVuRTs7Ozs7Ozs7OztXQVVHO1FBQ0gscUNBQWlCLEdBQWpCLFVBQWtCLGNBQXNCO1lBQ3RDLElBQU0sa0JBQWtCLEdBQUcseUJBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQ3JFLE9BQU8sd0JBQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLGtCQUFrQixDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztRQUM3RSxDQUFDO1FBQ0gsZ0JBQUM7SUFBRCxDQUFDLEFBbEJELElBa0JDO0lBbEJZLDhCQUFTIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge3JlbGF0aXZlLCByZXNvbHZlfSBmcm9tICdjYW5vbmljYWwtcGF0aCc7XG5cbi8qKlxuICogTWFwIHNvdXJjZSBmaWxlcyB0byB0aGVpciBhc3NvY2lhdGVkIHR5cGluZ3MgZGVmaW5pdGlvbnMgZmlsZXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBEdHNNYXBwZXIge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHNvdXJjZVJvb3Q6IHN0cmluZywgcHJpdmF0ZSBkdHNSb290OiBzdHJpbmcpIHt9XG5cbiAgLyoqXG4gICAqIEdpdmVuIHRoZSBhYnNvbHV0ZSBwYXRoIHRvIGEgc291cmNlIGZpbGUsIHJldHVybiB0aGUgYWJzb2x1dGUgcGF0aCB0byB0aGUgY29ycmVzcG9uZGluZyBgLmQudHNgXG4gICAqIGZpbGUuIEFzc3VtZSB0aGF0IHNvdXJjZSBmaWxlcyBhbmQgYC5kLnRzYCBmaWxlcyBoYXZlIHRoZSBzYW1lIGRpcmVjdG9yeSBsYXlvdXQgYW5kIHRoZSBuYW1lc1xuICAgKiBvZiB0aGUgYC5kLnRzYCBmaWxlcyBjYW4gYmUgZGVyaXZlZCBieSByZXBsYWNpbmcgdGhlIGAuanNgIGV4dGVuc2lvbiBvZiB0aGUgc291cmNlIGZpbGUgd2l0aFxuICAgKiBgLmQudHNgLlxuICAgKlxuICAgKiBAcGFyYW0gc291cmNlRmlsZU5hbWUgVGhlIGFic29sdXRlIHBhdGggdG8gdGhlIHNvdXJjZSBmaWxlIHdob3NlIGNvcnJlc3BvbmRpbmcgYC5kLnRzYCBmaWxlXG4gICAqICAgICBzaG91bGQgYmUgcmV0dXJuZWQuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBhYnNvbHV0ZSBwYXRoIHRvIHRoZSBgLmQudHNgIGZpbGUgdGhhdCBjb3JyZXNwb25kcyB0byB0aGUgc3BlY2lmaWVkIHNvdXJjZSBmaWxlLlxuICAgKi9cbiAgZ2V0RHRzRmlsZU5hbWVGb3Ioc291cmNlRmlsZU5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgY29uc3QgcmVsYXRpdmVTb3VyY2VQYXRoID0gcmVsYXRpdmUodGhpcy5zb3VyY2VSb290LCBzb3VyY2VGaWxlTmFtZSk7XG4gICAgcmV0dXJuIHJlc29sdmUodGhpcy5kdHNSb290LCByZWxhdGl2ZVNvdXJjZVBhdGgpLnJlcGxhY2UoL1xcLmpzJC8sICcuZC50cycpO1xuICB9XG59XG4iXX0=
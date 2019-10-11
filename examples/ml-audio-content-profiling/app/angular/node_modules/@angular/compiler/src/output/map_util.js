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
        define("@angular/compiler/src/output/map_util", ["require", "exports", "@angular/compiler/src/output/output_ast"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var o = require("@angular/compiler/src/output/output_ast");
    function mapEntry(key, value) {
        return { key: key, value: value, quoted: false };
    }
    exports.mapEntry = mapEntry;
    function mapLiteral(obj) {
        return o.literalMap(Object.keys(obj).map(function (key) { return ({
            key: key,
            quoted: false,
            value: obj[key],
        }); }));
    }
    exports.mapLiteral = mapLiteral;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwX3V0aWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci9zcmMvb3V0cHV0L21hcF91dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBRUgsMkRBQWtDO0lBVWxDLFNBQWdCLFFBQVEsQ0FBQyxHQUFXLEVBQUUsS0FBbUI7UUFDdkQsT0FBTyxFQUFDLEdBQUcsS0FBQSxFQUFFLEtBQUssT0FBQSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUMsQ0FBQztJQUNyQyxDQUFDO0lBRkQsNEJBRUM7SUFFRCxTQUFnQixVQUFVLENBQUMsR0FBa0M7UUFDM0QsT0FBTyxDQUFDLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQUEsR0FBRyxJQUFJLE9BQUEsQ0FBQztZQUNOLEdBQUcsS0FBQTtZQUNILE1BQU0sRUFBRSxLQUFLO1lBQ2IsS0FBSyxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUM7U0FDaEIsQ0FBQyxFQUpLLENBSUwsQ0FBQyxDQUFDLENBQUM7SUFDaEQsQ0FBQztJQU5ELGdDQU1DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyBvIGZyb20gJy4vb3V0cHV0X2FzdCc7XG5cbmV4cG9ydCB0eXBlIE1hcEVudHJ5ID0ge1xuICBrZXk6IHN0cmluZyxcbiAgcXVvdGVkOiBib29sZWFuLFxuICB2YWx1ZTogby5FeHByZXNzaW9uXG59O1xuXG5leHBvcnQgdHlwZSBNYXBMaXRlcmFsID0gTWFwRW50cnlbXTtcblxuZXhwb3J0IGZ1bmN0aW9uIG1hcEVudHJ5KGtleTogc3RyaW5nLCB2YWx1ZTogby5FeHByZXNzaW9uKTogTWFwRW50cnkge1xuICByZXR1cm4ge2tleSwgdmFsdWUsIHF1b3RlZDogZmFsc2V9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWFwTGl0ZXJhbChvYmo6IHtba2V5OiBzdHJpbmddOiBvLkV4cHJlc3Npb259KTogby5FeHByZXNzaW9uIHtcbiAgcmV0dXJuIG8ubGl0ZXJhbE1hcChPYmplY3Qua2V5cyhvYmopLm1hcChrZXkgPT4gKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1b3RlZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogb2JqW2tleV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkpKTtcbn1cbiJdfQ==
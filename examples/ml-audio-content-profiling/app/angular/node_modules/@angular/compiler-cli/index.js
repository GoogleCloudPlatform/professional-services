(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli", ["require", "exports", "tslib", "@angular/compiler", "@angular/compiler-cli/src/diagnostics/expression_diagnostics", "@angular/compiler-cli/src/diagnostics/expression_type", "@angular/compiler-cli/src/diagnostics/symbols", "@angular/compiler-cli/src/diagnostics/typescript_symbols", "@angular/compiler-cli/src/version", "@angular/compiler-cli/src/metadata/index", "@angular/compiler-cli/src/transformers/api", "@angular/compiler-cli/src/transformers/entry_points", "@angular/compiler-cli/src/perform_compile", "@angular/compiler-cli/src/ngtools_api", "@angular/compiler-cli/src/transformers/util"], factory);
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
    var compiler_1 = require("@angular/compiler");
    exports.StaticReflector = compiler_1.StaticReflector;
    exports.StaticSymbol = compiler_1.StaticSymbol;
    var expression_diagnostics_1 = require("@angular/compiler-cli/src/diagnostics/expression_diagnostics");
    exports.getExpressionScope = expression_diagnostics_1.getExpressionScope;
    exports.getTemplateExpressionDiagnostics = expression_diagnostics_1.getTemplateExpressionDiagnostics;
    var expression_type_1 = require("@angular/compiler-cli/src/diagnostics/expression_type");
    exports.AstType = expression_type_1.AstType;
    var symbols_1 = require("@angular/compiler-cli/src/diagnostics/symbols");
    exports.BuiltinType = symbols_1.BuiltinType;
    var typescript_symbols_1 = require("@angular/compiler-cli/src/diagnostics/typescript_symbols");
    exports.getClassMembersFromDeclaration = typescript_symbols_1.getClassMembersFromDeclaration;
    exports.getPipesTable = typescript_symbols_1.getPipesTable;
    exports.getSymbolQuery = typescript_symbols_1.getSymbolQuery;
    var version_1 = require("@angular/compiler-cli/src/version");
    exports.VERSION = version_1.VERSION;
    tslib_1.__exportStar(require("@angular/compiler-cli/src/metadata/index"), exports);
    tslib_1.__exportStar(require("@angular/compiler-cli/src/transformers/api"), exports);
    tslib_1.__exportStar(require("@angular/compiler-cli/src/transformers/entry_points"), exports);
    tslib_1.__exportStar(require("@angular/compiler-cli/src/perform_compile"), exports);
    var ngtools_api_1 = require("@angular/compiler-cli/src/ngtools_api");
    exports.__NGTOOLS_PRIVATE_API_2 = ngtools_api_1.NgTools_InternalApi_NG_2;
    var util_1 = require("@angular/compiler-cli/src/transformers/util");
    exports.ngToTsDiagnostic = util_1.ngToTsDiagnostic;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0lBQUE7Ozs7OztPQU1HO0lBQ0gsOENBQXlIO0lBQXhELHFDQUFBLGVBQWUsQ0FBQTtJQUFFLGtDQUFBLFlBQVksQ0FBQTtJQUM5Rix1R0FBc0k7SUFBdEcsc0RBQUEsa0JBQWtCLENBQUE7SUFBRSxvRUFBQSxnQ0FBZ0MsQ0FBQTtJQUNwRix5RkFBd0Y7SUFBaEYsb0NBQUEsT0FBTyxDQUFBO0lBQ2YseUVBQTBLO0lBQWxLLGdDQUFBLFdBQVcsQ0FBQTtJQUNuQiwrRkFBbUg7SUFBM0csOERBQUEsOEJBQThCLENBQUE7SUFBRSw2Q0FBQSxhQUFhLENBQUE7SUFBRSw4Q0FBQSxjQUFjLENBQUE7SUFDckUsNkRBQXNDO0lBQTlCLDRCQUFBLE9BQU8sQ0FBQTtJQUVmLG1GQUErQjtJQUMvQixxRkFBdUM7SUFDdkMsOEZBQWdEO0lBRWhELG9GQUFzQztJQUt0QyxxRUFBc0Y7SUFBOUUsZ0RBQUEsd0JBQXdCLENBQTJCO0lBRTNELG9FQUF5RDtJQUFqRCxrQ0FBQSxnQkFBZ0IsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmV4cG9ydCB7QW90Q29tcGlsZXJIb3N0LCBBb3RDb21waWxlckhvc3QgYXMgU3RhdGljUmVmbGVjdG9ySG9zdCwgU3RhdGljUmVmbGVjdG9yLCBTdGF0aWNTeW1ib2x9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcbmV4cG9ydCB7RGlhZ25vc3RpY1RlbXBsYXRlSW5mbywgZ2V0RXhwcmVzc2lvblNjb3BlLCBnZXRUZW1wbGF0ZUV4cHJlc3Npb25EaWFnbm9zdGljc30gZnJvbSAnLi9zcmMvZGlhZ25vc3RpY3MvZXhwcmVzc2lvbl9kaWFnbm9zdGljcyc7XG5leHBvcnQge0FzdFR5cGUsIEV4cHJlc3Npb25EaWFnbm9zdGljc0NvbnRleHR9IGZyb20gJy4vc3JjL2RpYWdub3N0aWNzL2V4cHJlc3Npb25fdHlwZSc7XG5leHBvcnQge0J1aWx0aW5UeXBlLCBEZWNsYXJhdGlvbktpbmQsIERlZmluaXRpb24sIFBpcGVJbmZvLCBQaXBlcywgU2lnbmF0dXJlLCBTcGFuLCBTeW1ib2wsIFN5bWJvbERlY2xhcmF0aW9uLCBTeW1ib2xRdWVyeSwgU3ltYm9sVGFibGV9IGZyb20gJy4vc3JjL2RpYWdub3N0aWNzL3N5bWJvbHMnO1xuZXhwb3J0IHtnZXRDbGFzc01lbWJlcnNGcm9tRGVjbGFyYXRpb24sIGdldFBpcGVzVGFibGUsIGdldFN5bWJvbFF1ZXJ5fSBmcm9tICcuL3NyYy9kaWFnbm9zdGljcy90eXBlc2NyaXB0X3N5bWJvbHMnO1xuZXhwb3J0IHtWRVJTSU9OfSBmcm9tICcuL3NyYy92ZXJzaW9uJztcblxuZXhwb3J0ICogZnJvbSAnLi9zcmMvbWV0YWRhdGEnO1xuZXhwb3J0ICogZnJvbSAnLi9zcmMvdHJhbnNmb3JtZXJzL2FwaSc7XG5leHBvcnQgKiBmcm9tICcuL3NyYy90cmFuc2Zvcm1lcnMvZW50cnlfcG9pbnRzJztcblxuZXhwb3J0ICogZnJvbSAnLi9zcmMvcGVyZm9ybV9jb21waWxlJztcblxuLy8gVE9ETyh0Ym9zY2gpOiByZW1vdmUgdGhpcyBvbmNlIGNsaSAxLjUgaXMgZnVsbHkgcmVsZWFzZWQsXG4vLyBhbmQgdXNhZ2VzIGluIEczIGFyZSBjaGFuZ2VkIHRvIGBDb21waWxlck9wdGlvbnNgLlxuZXhwb3J0IHtDb21waWxlck9wdGlvbnMgYXMgQW5ndWxhckNvbXBpbGVyT3B0aW9uc30gZnJvbSAnLi9zcmMvdHJhbnNmb3JtZXJzL2FwaSc7XG5leHBvcnQge05nVG9vbHNfSW50ZXJuYWxBcGlfTkdfMiBhcyBfX05HVE9PTFNfUFJJVkFURV9BUElfMn0gZnJvbSAnLi9zcmMvbmd0b29sc19hcGknO1xuXG5leHBvcnQge25nVG9Uc0RpYWdub3N0aWN9IGZyb20gJy4vc3JjL3RyYW5zZm9ybWVycy91dGlsJztcbiJdfQ==
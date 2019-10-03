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
        define("@angular/compiler-cli/src/language_services", ["require", "exports", "@angular/compiler-cli/src/diagnostics/expression_diagnostics", "@angular/compiler-cli/src/diagnostics/expression_type", "@angular/compiler-cli/src/diagnostics/symbols", "@angular/compiler-cli/src/diagnostics/typescript_symbols", "@angular/compiler-cli/src/metadata/index", "@angular/compiler-cli/src/transformers/metadata_reader"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /*
    
    The API from compiler-cli that language-service can see.
    It is important that none the exported modules require anything other than
    Angular modules and Typescript as this will indirectly add a dependency
    to the language service.
    
    */
    var expression_diagnostics_1 = require("@angular/compiler-cli/src/diagnostics/expression_diagnostics");
    exports.getExpressionDiagnostics = expression_diagnostics_1.getExpressionDiagnostics;
    exports.getExpressionScope = expression_diagnostics_1.getExpressionScope;
    exports.getTemplateExpressionDiagnostics = expression_diagnostics_1.getTemplateExpressionDiagnostics;
    var expression_type_1 = require("@angular/compiler-cli/src/diagnostics/expression_type");
    exports.AstType = expression_type_1.AstType;
    exports.DiagnosticKind = expression_type_1.DiagnosticKind;
    exports.TypeDiagnostic = expression_type_1.TypeDiagnostic;
    var symbols_1 = require("@angular/compiler-cli/src/diagnostics/symbols");
    exports.BuiltinType = symbols_1.BuiltinType;
    var typescript_symbols_1 = require("@angular/compiler-cli/src/diagnostics/typescript_symbols");
    exports.getClassFromStaticSymbol = typescript_symbols_1.getClassFromStaticSymbol;
    exports.getClassMembers = typescript_symbols_1.getClassMembers;
    exports.getClassMembersFromDeclaration = typescript_symbols_1.getClassMembersFromDeclaration;
    exports.getPipesTable = typescript_symbols_1.getPipesTable;
    exports.getSymbolQuery = typescript_symbols_1.getSymbolQuery;
    var metadata_1 = require("@angular/compiler-cli/src/metadata/index");
    exports.MetadataCollector = metadata_1.MetadataCollector;
    var metadata_reader_1 = require("@angular/compiler-cli/src/transformers/metadata_reader");
    exports.createMetadataReaderCache = metadata_reader_1.createMetadataReaderCache;
    exports.readMetadata = metadata_reader_1.readMetadata;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2Vfc2VydmljZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvc3JjL2xhbmd1YWdlX3NlcnZpY2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBRUg7Ozs7Ozs7TUFPRTtJQUNGLHVHQUFrTDtJQUE1SCw0REFBQSx3QkFBd0IsQ0FBQTtJQUFFLHNEQUFBLGtCQUFrQixDQUFBO0lBQUUsb0VBQUEsZ0NBQWdDLENBQUE7SUFDcEkseUZBQW9IO0lBQTVHLG9DQUFBLE9BQU8sQ0FBQTtJQUFFLDJDQUFBLGNBQWMsQ0FBQTtJQUFnQywyQ0FBQSxjQUFjLENBQUE7SUFDN0UseUVBQWdMO0lBQXhLLGdDQUFBLFdBQVcsQ0FBQTtJQUNuQiwrRkFBMEo7SUFBbEosd0RBQUEsd0JBQXdCLENBQUE7SUFBRSwrQ0FBQSxlQUFlLENBQUE7SUFBRSw4REFBQSw4QkFBOEIsQ0FBQTtJQUFFLDZDQUFBLGFBQWEsQ0FBQTtJQUFFLDhDQUFBLGNBQWMsQ0FBQTtJQUNoSCxxRUFBNkQ7SUFBckQsdUNBQUEsaUJBQWlCLENBQUE7SUFFekIsMEZBQWdJO0lBQS9FLHNEQUFBLHlCQUF5QixDQUFBO0lBQUUseUNBQUEsWUFBWSxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKlxuXG5UaGUgQVBJIGZyb20gY29tcGlsZXItY2xpIHRoYXQgbGFuZ3VhZ2Utc2VydmljZSBjYW4gc2VlLlxuSXQgaXMgaW1wb3J0YW50IHRoYXQgbm9uZSB0aGUgZXhwb3J0ZWQgbW9kdWxlcyByZXF1aXJlIGFueXRoaW5nIG90aGVyIHRoYW5cbkFuZ3VsYXIgbW9kdWxlcyBhbmQgVHlwZXNjcmlwdCBhcyB0aGlzIHdpbGwgaW5kaXJlY3RseSBhZGQgYSBkZXBlbmRlbmN5XG50byB0aGUgbGFuZ3VhZ2Ugc2VydmljZS5cblxuKi9cbmV4cG9ydCB7RGlhZ25vc3RpY1RlbXBsYXRlSW5mbywgRXhwcmVzc2lvbkRpYWdub3N0aWMsIGdldEV4cHJlc3Npb25EaWFnbm9zdGljcywgZ2V0RXhwcmVzc2lvblNjb3BlLCBnZXRUZW1wbGF0ZUV4cHJlc3Npb25EaWFnbm9zdGljc30gZnJvbSAnLi9kaWFnbm9zdGljcy9leHByZXNzaW9uX2RpYWdub3N0aWNzJztcbmV4cG9ydCB7QXN0VHlwZSwgRGlhZ25vc3RpY0tpbmQsIEV4cHJlc3Npb25EaWFnbm9zdGljc0NvbnRleHQsIFR5cGVEaWFnbm9zdGljfSBmcm9tICcuL2RpYWdub3N0aWNzL2V4cHJlc3Npb25fdHlwZSc7XG5leHBvcnQge0J1aWx0aW5UeXBlLCBEZWNsYXJhdGlvbktpbmQsIERlZmluaXRpb24sIExvY2F0aW9uLCBQaXBlSW5mbywgUGlwZXMsIFNpZ25hdHVyZSwgU3BhbiwgU3ltYm9sLCBTeW1ib2xEZWNsYXJhdGlvbiwgU3ltYm9sUXVlcnksIFN5bWJvbFRhYmxlfSBmcm9tICcuL2RpYWdub3N0aWNzL3N5bWJvbHMnO1xuZXhwb3J0IHtnZXRDbGFzc0Zyb21TdGF0aWNTeW1ib2wsIGdldENsYXNzTWVtYmVycywgZ2V0Q2xhc3NNZW1iZXJzRnJvbURlY2xhcmF0aW9uLCBnZXRQaXBlc1RhYmxlLCBnZXRTeW1ib2xRdWVyeX0gZnJvbSAnLi9kaWFnbm9zdGljcy90eXBlc2NyaXB0X3N5bWJvbHMnO1xuZXhwb3J0IHtNZXRhZGF0YUNvbGxlY3RvciwgTW9kdWxlTWV0YWRhdGF9IGZyb20gJy4vbWV0YWRhdGEnO1xuZXhwb3J0IHtDb21waWxlck9wdGlvbnN9IGZyb20gJy4vdHJhbnNmb3JtZXJzL2FwaSc7XG5leHBvcnQge01ldGFkYXRhUmVhZGVyQ2FjaGUsIE1ldGFkYXRhUmVhZGVySG9zdCwgY3JlYXRlTWV0YWRhdGFSZWFkZXJDYWNoZSwgcmVhZE1ldGFkYXRhfSBmcm9tICcuL3RyYW5zZm9ybWVycy9tZXRhZGF0YV9yZWFkZXInO1xuIl19
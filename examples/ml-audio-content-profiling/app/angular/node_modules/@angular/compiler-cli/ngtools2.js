(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/ngtools2", ["require", "exports", "@angular/compiler-cli/src/ngtools_api2"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var ngtools_api2_1 = require("@angular/compiler-cli/src/ngtools_api2");
    exports.EmitFlags = ngtools_api2_1.EmitFlags;
    exports.createCompilerHost = ngtools_api2_1.createCompilerHost;
    exports.createProgram = ngtools_api2_1.createProgram;
    exports.formatDiagnostics = ngtools_api2_1.formatDiagnostics;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd0b29sczIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvbmd0b29sczIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7SUFBQTs7Ozs7O09BTUc7SUFDSCx1RUFBMEo7SUFBcEcsbUNBQUEsU0FBUyxDQUFBO0lBQVcsNENBQUEsa0JBQWtCLENBQUE7SUFBRSx1Q0FBQSxhQUFhLENBQUE7SUFBRSwyQ0FBQSxpQkFBaUIsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmV4cG9ydCB7Q29tcGlsZXJIb3N0LCBDdXN0b21UcmFuc2Zvcm1lcnMsIERpYWdub3N0aWMsIEVtaXRGbGFncywgUHJvZ3JhbSwgY3JlYXRlQ29tcGlsZXJIb3N0LCBjcmVhdGVQcm9ncmFtLCBmb3JtYXREaWFnbm9zdGljc30gZnJvbSAnLi9zcmMvbmd0b29sc19hcGkyJzsiXX0=
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
        define("@angular/compiler-cli/src/ngtsc/diagnostics/src/code", ["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ErrorCode;
    (function (ErrorCode) {
        ErrorCode[ErrorCode["DECORATOR_ARG_NOT_LITERAL"] = 1001] = "DECORATOR_ARG_NOT_LITERAL";
        ErrorCode[ErrorCode["DECORATOR_ARITY_WRONG"] = 1002] = "DECORATOR_ARITY_WRONG";
        ErrorCode[ErrorCode["DECORATOR_NOT_CALLED"] = 1003] = "DECORATOR_NOT_CALLED";
        ErrorCode[ErrorCode["DECORATOR_ON_ANONYMOUS_CLASS"] = 1004] = "DECORATOR_ON_ANONYMOUS_CLASS";
        ErrorCode[ErrorCode["DECORATOR_UNEXPECTED"] = 1005] = "DECORATOR_UNEXPECTED";
        ErrorCode[ErrorCode["VALUE_HAS_WRONG_TYPE"] = 1010] = "VALUE_HAS_WRONG_TYPE";
        ErrorCode[ErrorCode["VALUE_NOT_LITERAL"] = 1011] = "VALUE_NOT_LITERAL";
        ErrorCode[ErrorCode["COMPONENT_MISSING_TEMPLATE"] = 2001] = "COMPONENT_MISSING_TEMPLATE";
        ErrorCode[ErrorCode["PIPE_MISSING_NAME"] = 2002] = "PIPE_MISSING_NAME";
        ErrorCode[ErrorCode["PARAM_MISSING_TOKEN"] = 2003] = "PARAM_MISSING_TOKEN";
    })(ErrorCode = exports.ErrorCode || (exports.ErrorCode = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyLWNsaS9zcmMvbmd0c2MvZGlhZ25vc3RpY3Mvc3JjL2NvZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFFSCxJQUFZLFNBYVg7SUFiRCxXQUFZLFNBQVM7UUFDbkIsc0ZBQWdDLENBQUE7UUFDaEMsOEVBQTRCLENBQUE7UUFDNUIsNEVBQTJCLENBQUE7UUFDM0IsNEZBQW1DLENBQUE7UUFDbkMsNEVBQTJCLENBQUE7UUFFM0IsNEVBQTJCLENBQUE7UUFDM0Isc0VBQXdCLENBQUE7UUFFeEIsd0ZBQWlDLENBQUE7UUFDakMsc0VBQXdCLENBQUE7UUFDeEIsMEVBQTBCLENBQUE7SUFDNUIsQ0FBQyxFQWJXLFNBQVMsR0FBVCxpQkFBUyxLQUFULGlCQUFTLFFBYXBCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5leHBvcnQgZW51bSBFcnJvckNvZGUge1xuICBERUNPUkFUT1JfQVJHX05PVF9MSVRFUkFMID0gMTAwMSxcbiAgREVDT1JBVE9SX0FSSVRZX1dST05HID0gMTAwMixcbiAgREVDT1JBVE9SX05PVF9DQUxMRUQgPSAxMDAzLFxuICBERUNPUkFUT1JfT05fQU5PTllNT1VTX0NMQVNTID0gMTAwNCxcbiAgREVDT1JBVE9SX1VORVhQRUNURUQgPSAxMDA1LFxuXG4gIFZBTFVFX0hBU19XUk9OR19UWVBFID0gMTAxMCxcbiAgVkFMVUVfTk9UX0xJVEVSQUwgPSAxMDExLFxuXG4gIENPTVBPTkVOVF9NSVNTSU5HX1RFTVBMQVRFID0gMjAwMSxcbiAgUElQRV9NSVNTSU5HX05BTUUgPSAyMDAyLFxuICBQQVJBTV9NSVNTSU5HX1RPS0VOID0gMjAwMyxcbn1cbiJdfQ==
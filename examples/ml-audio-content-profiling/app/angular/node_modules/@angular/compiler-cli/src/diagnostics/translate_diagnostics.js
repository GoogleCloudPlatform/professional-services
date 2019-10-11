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
        define("@angular/compiler-cli/src/diagnostics/translate_diagnostics", ["require", "exports", "typescript", "@angular/compiler-cli/src/transformers/api", "@angular/compiler-cli/src/transformers/util"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ts = require("typescript");
    var api_1 = require("@angular/compiler-cli/src/transformers/api");
    var util_1 = require("@angular/compiler-cli/src/transformers/util");
    function translateDiagnostics(host, untranslatedDiagnostics) {
        var ts = [];
        var ng = [];
        untranslatedDiagnostics.forEach(function (diagnostic) {
            if (diagnostic.file && diagnostic.start && util_1.GENERATED_FILES.test(diagnostic.file.fileName)) {
                // We need to filter out diagnostics about unused functions as
                // they are in fact referenced by nobody and only serve to surface
                // type check errors.
                if (diagnostic.code === /* ... is declared but never used */ 6133) {
                    return;
                }
                var span = sourceSpanOf(host, diagnostic.file, diagnostic.start);
                if (span) {
                    var fileName = span.start.file.url;
                    ng.push({
                        messageText: diagnosticMessageToString(diagnostic.messageText),
                        category: diagnostic.category, span: span,
                        source: api_1.SOURCE,
                        code: api_1.DEFAULT_ERROR_CODE
                    });
                }
            }
            else {
                ts.push(diagnostic);
            }
        });
        return { ts: ts, ng: ng };
    }
    exports.translateDiagnostics = translateDiagnostics;
    function sourceSpanOf(host, source, start) {
        var _a = ts.getLineAndCharacterOfPosition(source, start), line = _a.line, character = _a.character;
        return host.parseSourceSpanOf(source.fileName, line, character);
    }
    function diagnosticMessageToString(message) {
        return ts.flattenDiagnosticMessageText(message, '\n');
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNsYXRlX2RpYWdub3N0aWNzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXItY2xpL3NyYy9kaWFnbm9zdGljcy90cmFuc2xhdGVfZGlhZ25vc3RpY3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFHSCwrQkFBaUM7SUFFakMsa0VBQTJFO0lBQzNFLG9FQUFxRDtJQU1yRCxTQUFnQixvQkFBb0IsQ0FDaEMsSUFBbUIsRUFBRSx1QkFBcUQ7UUFFNUUsSUFBTSxFQUFFLEdBQW9CLEVBQUUsQ0FBQztRQUMvQixJQUFNLEVBQUUsR0FBaUIsRUFBRSxDQUFDO1FBRTVCLHVCQUF1QixDQUFDLE9BQU8sQ0FBQyxVQUFDLFVBQVU7WUFDekMsSUFBSSxVQUFVLENBQUMsSUFBSSxJQUFJLFVBQVUsQ0FBQyxLQUFLLElBQUksc0JBQWUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDekYsOERBQThEO2dCQUM5RCxrRUFBa0U7Z0JBQ2xFLHFCQUFxQjtnQkFDckIsSUFBSSxVQUFVLENBQUMsSUFBSSxLQUFLLG9DQUFvQyxDQUFDLElBQUksRUFBRTtvQkFDakUsT0FBTztpQkFDUjtnQkFDRCxJQUFNLElBQUksR0FBRyxZQUFZLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNuRSxJQUFJLElBQUksRUFBRTtvQkFDUixJQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7b0JBQ3JDLEVBQUUsQ0FBQyxJQUFJLENBQUM7d0JBQ04sV0FBVyxFQUFFLHlCQUF5QixDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUM7d0JBQzlELFFBQVEsRUFBRSxVQUFVLENBQUMsUUFBUSxFQUFFLElBQUksTUFBQTt3QkFDbkMsTUFBTSxFQUFFLFlBQU07d0JBQ2QsSUFBSSxFQUFFLHdCQUFrQjtxQkFDekIsQ0FBQyxDQUFDO2lCQUNKO2FBQ0Y7aUJBQU07Z0JBQ0wsRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQzthQUNyQjtRQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxFQUFDLEVBQUUsSUFBQSxFQUFFLEVBQUUsSUFBQSxFQUFDLENBQUM7SUFDbEIsQ0FBQztJQTdCRCxvREE2QkM7SUFFRCxTQUFTLFlBQVksQ0FBQyxJQUFtQixFQUFFLE1BQXFCLEVBQUUsS0FBYTtRQUV2RSxJQUFBLG9EQUFtRSxFQUFsRSxjQUFJLEVBQUUsd0JBQTRELENBQUM7UUFDMUUsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDbEUsQ0FBQztJQUVELFNBQVMseUJBQXlCLENBQUMsT0FBMkM7UUFDNUUsT0FBTyxFQUFFLENBQUMsNEJBQTRCLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3hELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UGFyc2VTb3VyY2VTcGFufSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtERUZBVUxUX0VSUk9SX0NPREUsIERpYWdub3N0aWMsIFNPVVJDRX0gZnJvbSAnLi4vdHJhbnNmb3JtZXJzL2FwaSc7XG5pbXBvcnQge0dFTkVSQVRFRF9GSUxFU30gZnJvbSAnLi4vdHJhbnNmb3JtZXJzL3V0aWwnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFR5cGVDaGVja0hvc3Qge1xuICBwYXJzZVNvdXJjZVNwYW5PZihmaWxlTmFtZTogc3RyaW5nLCBsaW5lOiBudW1iZXIsIGNoYXJhY3RlcjogbnVtYmVyKTogUGFyc2VTb3VyY2VTcGFufG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0cmFuc2xhdGVEaWFnbm9zdGljcyhcbiAgICBob3N0OiBUeXBlQ2hlY2tIb3N0LCB1bnRyYW5zbGF0ZWREaWFnbm9zdGljczogUmVhZG9ubHlBcnJheTx0cy5EaWFnbm9zdGljPik6XG4gICAge3RzOiB0cy5EaWFnbm9zdGljW10sIG5nOiBEaWFnbm9zdGljW119IHtcbiAgY29uc3QgdHM6IHRzLkRpYWdub3N0aWNbXSA9IFtdO1xuICBjb25zdCBuZzogRGlhZ25vc3RpY1tdID0gW107XG5cbiAgdW50cmFuc2xhdGVkRGlhZ25vc3RpY3MuZm9yRWFjaCgoZGlhZ25vc3RpYykgPT4ge1xuICAgIGlmIChkaWFnbm9zdGljLmZpbGUgJiYgZGlhZ25vc3RpYy5zdGFydCAmJiBHRU5FUkFURURfRklMRVMudGVzdChkaWFnbm9zdGljLmZpbGUuZmlsZU5hbWUpKSB7XG4gICAgICAvLyBXZSBuZWVkIHRvIGZpbHRlciBvdXQgZGlhZ25vc3RpY3MgYWJvdXQgdW51c2VkIGZ1bmN0aW9ucyBhc1xuICAgICAgLy8gdGhleSBhcmUgaW4gZmFjdCByZWZlcmVuY2VkIGJ5IG5vYm9keSBhbmQgb25seSBzZXJ2ZSB0byBzdXJmYWNlXG4gICAgICAvLyB0eXBlIGNoZWNrIGVycm9ycy5cbiAgICAgIGlmIChkaWFnbm9zdGljLmNvZGUgPT09IC8qIC4uLiBpcyBkZWNsYXJlZCBidXQgbmV2ZXIgdXNlZCAqLyA2MTMzKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHNwYW4gPSBzb3VyY2VTcGFuT2YoaG9zdCwgZGlhZ25vc3RpYy5maWxlLCBkaWFnbm9zdGljLnN0YXJ0KTtcbiAgICAgIGlmIChzcGFuKSB7XG4gICAgICAgIGNvbnN0IGZpbGVOYW1lID0gc3Bhbi5zdGFydC5maWxlLnVybDtcbiAgICAgICAgbmcucHVzaCh7XG4gICAgICAgICAgbWVzc2FnZVRleHQ6IGRpYWdub3N0aWNNZXNzYWdlVG9TdHJpbmcoZGlhZ25vc3RpYy5tZXNzYWdlVGV4dCksXG4gICAgICAgICAgY2F0ZWdvcnk6IGRpYWdub3N0aWMuY2F0ZWdvcnksIHNwYW4sXG4gICAgICAgICAgc291cmNlOiBTT1VSQ0UsXG4gICAgICAgICAgY29kZTogREVGQVVMVF9FUlJPUl9DT0RFXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0cy5wdXNoKGRpYWdub3N0aWMpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiB7dHMsIG5nfTtcbn1cblxuZnVuY3Rpb24gc291cmNlU3Bhbk9mKGhvc3Q6IFR5cGVDaGVja0hvc3QsIHNvdXJjZTogdHMuU291cmNlRmlsZSwgc3RhcnQ6IG51bWJlcik6IFBhcnNlU291cmNlU3BhbnxcbiAgICBudWxsIHtcbiAgY29uc3Qge2xpbmUsIGNoYXJhY3Rlcn0gPSB0cy5nZXRMaW5lQW5kQ2hhcmFjdGVyT2ZQb3NpdGlvbihzb3VyY2UsIHN0YXJ0KTtcbiAgcmV0dXJuIGhvc3QucGFyc2VTb3VyY2VTcGFuT2Yoc291cmNlLmZpbGVOYW1lLCBsaW5lLCBjaGFyYWN0ZXIpO1xufVxuXG5mdW5jdGlvbiBkaWFnbm9zdGljTWVzc2FnZVRvU3RyaW5nKG1lc3NhZ2U6IHRzLkRpYWdub3N0aWNNZXNzYWdlQ2hhaW4gfCBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdHMuZmxhdHRlbkRpYWdub3N0aWNNZXNzYWdlVGV4dChtZXNzYWdlLCAnXFxuJyk7XG59XG4iXX0=
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
        define("@angular/compiler/src/ml_parser/html_parser", ["require", "exports", "tslib", "@angular/compiler/src/ml_parser/html_tags", "@angular/compiler/src/ml_parser/interpolation_config", "@angular/compiler/src/ml_parser/parser", "@angular/compiler/src/ml_parser/parser"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var html_tags_1 = require("@angular/compiler/src/ml_parser/html_tags");
    var interpolation_config_1 = require("@angular/compiler/src/ml_parser/interpolation_config");
    var parser_1 = require("@angular/compiler/src/ml_parser/parser");
    var parser_2 = require("@angular/compiler/src/ml_parser/parser");
    exports.ParseTreeResult = parser_2.ParseTreeResult;
    exports.TreeError = parser_2.TreeError;
    var HtmlParser = /** @class */ (function (_super) {
        tslib_1.__extends(HtmlParser, _super);
        function HtmlParser() {
            return _super.call(this, html_tags_1.getHtmlTagDefinition) || this;
        }
        HtmlParser.prototype.parse = function (source, url, parseExpansionForms, interpolationConfig) {
            if (parseExpansionForms === void 0) { parseExpansionForms = false; }
            if (interpolationConfig === void 0) { interpolationConfig = interpolation_config_1.DEFAULT_INTERPOLATION_CONFIG; }
            return _super.prototype.parse.call(this, source, url, parseExpansionForms, interpolationConfig);
        };
        return HtmlParser;
    }(parser_1.Parser));
    exports.HtmlParser = HtmlParser;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbF9wYXJzZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci9zcmMvbWxfcGFyc2VyL2h0bWxfcGFyc2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILHVFQUFpRDtJQUNqRCw2RkFBeUY7SUFDekYsaUVBQWlEO0lBRWpELGlFQUFvRDtJQUE1QyxtQ0FBQSxlQUFlLENBQUE7SUFBRSw2QkFBQSxTQUFTLENBQUE7SUFFbEM7UUFBZ0Msc0NBQU07UUFDcEM7bUJBQWdCLGtCQUFNLGdDQUFvQixDQUFDO1FBQUUsQ0FBQztRQUU5QywwQkFBSyxHQUFMLFVBQ0ksTUFBYyxFQUFFLEdBQVcsRUFBRSxtQkFBb0MsRUFDakUsbUJBQXVFO1lBRDFDLG9DQUFBLEVBQUEsMkJBQW9DO1lBQ2pFLG9DQUFBLEVBQUEsc0JBQTJDLG1EQUE0QjtZQUN6RSxPQUFPLGlCQUFNLEtBQUssWUFBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLG1CQUFtQixFQUFFLG1CQUFtQixDQUFDLENBQUM7UUFDNUUsQ0FBQztRQUNILGlCQUFDO0lBQUQsQ0FBQyxBQVJELENBQWdDLGVBQU0sR0FRckM7SUFSWSxnQ0FBVSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtnZXRIdG1sVGFnRGVmaW5pdGlvbn0gZnJvbSAnLi9odG1sX3RhZ3MnO1xuaW1wb3J0IHtERUZBVUxUX0lOVEVSUE9MQVRJT05fQ09ORklHLCBJbnRlcnBvbGF0aW9uQ29uZmlnfSBmcm9tICcuL2ludGVycG9sYXRpb25fY29uZmlnJztcbmltcG9ydCB7UGFyc2VUcmVlUmVzdWx0LCBQYXJzZXJ9IGZyb20gJy4vcGFyc2VyJztcblxuZXhwb3J0IHtQYXJzZVRyZWVSZXN1bHQsIFRyZWVFcnJvcn0gZnJvbSAnLi9wYXJzZXInO1xuXG5leHBvcnQgY2xhc3MgSHRtbFBhcnNlciBleHRlbmRzIFBhcnNlciB7XG4gIGNvbnN0cnVjdG9yKCkgeyBzdXBlcihnZXRIdG1sVGFnRGVmaW5pdGlvbik7IH1cblxuICBwYXJzZShcbiAgICAgIHNvdXJjZTogc3RyaW5nLCB1cmw6IHN0cmluZywgcGFyc2VFeHBhbnNpb25Gb3JtczogYm9vbGVhbiA9IGZhbHNlLFxuICAgICAgaW50ZXJwb2xhdGlvbkNvbmZpZzogSW50ZXJwb2xhdGlvbkNvbmZpZyA9IERFRkFVTFRfSU5URVJQT0xBVElPTl9DT05GSUcpOiBQYXJzZVRyZWVSZXN1bHQge1xuICAgIHJldHVybiBzdXBlci5wYXJzZShzb3VyY2UsIHVybCwgcGFyc2VFeHBhbnNpb25Gb3JtcywgaW50ZXJwb2xhdGlvbkNvbmZpZyk7XG4gIH1cbn1cbiJdfQ==
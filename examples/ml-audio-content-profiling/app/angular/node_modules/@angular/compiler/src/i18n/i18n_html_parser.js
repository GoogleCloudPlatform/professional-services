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
        define("@angular/compiler/src/i18n/i18n_html_parser", ["require", "exports", "@angular/compiler/src/core", "@angular/compiler/src/ml_parser/interpolation_config", "@angular/compiler/src/ml_parser/parser", "@angular/compiler/src/i18n/digest", "@angular/compiler/src/i18n/extractor_merger", "@angular/compiler/src/i18n/serializers/xliff", "@angular/compiler/src/i18n/serializers/xliff2", "@angular/compiler/src/i18n/serializers/xmb", "@angular/compiler/src/i18n/serializers/xtb", "@angular/compiler/src/i18n/translation_bundle"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var core_1 = require("@angular/compiler/src/core");
    var interpolation_config_1 = require("@angular/compiler/src/ml_parser/interpolation_config");
    var parser_1 = require("@angular/compiler/src/ml_parser/parser");
    var digest_1 = require("@angular/compiler/src/i18n/digest");
    var extractor_merger_1 = require("@angular/compiler/src/i18n/extractor_merger");
    var xliff_1 = require("@angular/compiler/src/i18n/serializers/xliff");
    var xliff2_1 = require("@angular/compiler/src/i18n/serializers/xliff2");
    var xmb_1 = require("@angular/compiler/src/i18n/serializers/xmb");
    var xtb_1 = require("@angular/compiler/src/i18n/serializers/xtb");
    var translation_bundle_1 = require("@angular/compiler/src/i18n/translation_bundle");
    var I18NHtmlParser = /** @class */ (function () {
        function I18NHtmlParser(_htmlParser, translations, translationsFormat, missingTranslation, console) {
            if (missingTranslation === void 0) { missingTranslation = core_1.MissingTranslationStrategy.Warning; }
            this._htmlParser = _htmlParser;
            if (translations) {
                var serializer = createSerializer(translationsFormat);
                this._translationBundle =
                    translation_bundle_1.TranslationBundle.load(translations, 'i18n', serializer, missingTranslation, console);
            }
            else {
                this._translationBundle =
                    new translation_bundle_1.TranslationBundle({}, null, digest_1.digest, undefined, missingTranslation, console);
            }
        }
        I18NHtmlParser.prototype.parse = function (source, url, parseExpansionForms, interpolationConfig) {
            if (parseExpansionForms === void 0) { parseExpansionForms = false; }
            if (interpolationConfig === void 0) { interpolationConfig = interpolation_config_1.DEFAULT_INTERPOLATION_CONFIG; }
            var parseResult = this._htmlParser.parse(source, url, parseExpansionForms, interpolationConfig);
            if (parseResult.errors.length) {
                return new parser_1.ParseTreeResult(parseResult.rootNodes, parseResult.errors);
            }
            return extractor_merger_1.mergeTranslations(parseResult.rootNodes, this._translationBundle, interpolationConfig, [], {});
        };
        return I18NHtmlParser;
    }());
    exports.I18NHtmlParser = I18NHtmlParser;
    function createSerializer(format) {
        format = (format || 'xlf').toLowerCase();
        switch (format) {
            case 'xmb':
                return new xmb_1.Xmb();
            case 'xtb':
                return new xtb_1.Xtb();
            case 'xliff2':
            case 'xlf2':
                return new xliff2_1.Xliff2();
            case 'xliff':
            case 'xlf':
            default:
                return new xliff_1.Xliff();
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bl9odG1sX3BhcnNlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyL3NyYy9pMThuL2kxOG5faHRtbF9wYXJzZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFFSCxtREFBbUQ7SUFFbkQsNkZBQW9HO0lBQ3BHLGlFQUFvRDtJQUdwRCw0REFBZ0M7SUFDaEMsZ0ZBQXFEO0lBRXJELHNFQUEwQztJQUMxQyx3RUFBNEM7SUFDNUMsa0VBQXNDO0lBQ3RDLGtFQUFzQztJQUN0QyxvRkFBdUQ7SUFFdkQ7UUFNRSx3QkFDWSxXQUF1QixFQUFFLFlBQXFCLEVBQUUsa0JBQTJCLEVBQ25GLGtCQUFtRixFQUNuRixPQUFpQjtZQURqQixtQ0FBQSxFQUFBLHFCQUFpRCxpQ0FBMEIsQ0FBQyxPQUFPO1lBRDNFLGdCQUFXLEdBQVgsV0FBVyxDQUFZO1lBR2pDLElBQUksWUFBWSxFQUFFO2dCQUNoQixJQUFNLFVBQVUsR0FBRyxnQkFBZ0IsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO2dCQUN4RCxJQUFJLENBQUMsa0JBQWtCO29CQUNuQixzQ0FBaUIsQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsa0JBQWtCLEVBQUUsT0FBTyxDQUFDLENBQUM7YUFDM0Y7aUJBQU07Z0JBQ0wsSUFBSSxDQUFDLGtCQUFrQjtvQkFDbkIsSUFBSSxzQ0FBaUIsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLGVBQU0sRUFBRSxTQUFTLEVBQUUsa0JBQWtCLEVBQUUsT0FBTyxDQUFDLENBQUM7YUFDckY7UUFDSCxDQUFDO1FBRUQsOEJBQUssR0FBTCxVQUNJLE1BQWMsRUFBRSxHQUFXLEVBQUUsbUJBQW9DLEVBQ2pFLG1CQUF1RTtZQUQxQyxvQ0FBQSxFQUFBLDJCQUFvQztZQUNqRSxvQ0FBQSxFQUFBLHNCQUEyQyxtREFBNEI7WUFDekUsSUFBTSxXQUFXLEdBQ2IsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxtQkFBbUIsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1lBRWxGLElBQUksV0FBVyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7Z0JBQzdCLE9BQU8sSUFBSSx3QkFBZSxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2FBQ3ZFO1lBRUQsT0FBTyxvQ0FBaUIsQ0FDcEIsV0FBVyxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsa0JBQWtCLEVBQUUsbUJBQW1CLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ25GLENBQUM7UUFDSCxxQkFBQztJQUFELENBQUMsQUFqQ0QsSUFpQ0M7SUFqQ1ksd0NBQWM7SUFtQzNCLFNBQVMsZ0JBQWdCLENBQUMsTUFBZTtRQUN2QyxNQUFNLEdBQUcsQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7UUFFekMsUUFBUSxNQUFNLEVBQUU7WUFDZCxLQUFLLEtBQUs7Z0JBQ1IsT0FBTyxJQUFJLFNBQUcsRUFBRSxDQUFDO1lBQ25CLEtBQUssS0FBSztnQkFDUixPQUFPLElBQUksU0FBRyxFQUFFLENBQUM7WUFDbkIsS0FBSyxRQUFRLENBQUM7WUFDZCxLQUFLLE1BQU07Z0JBQ1QsT0FBTyxJQUFJLGVBQU0sRUFBRSxDQUFDO1lBQ3RCLEtBQUssT0FBTyxDQUFDO1lBQ2IsS0FBSyxLQUFLLENBQUM7WUFDWDtnQkFDRSxPQUFPLElBQUksYUFBSyxFQUFFLENBQUM7U0FDdEI7SUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge01pc3NpbmdUcmFuc2xhdGlvblN0cmF0ZWd5fSBmcm9tICcuLi9jb3JlJztcbmltcG9ydCB7SHRtbFBhcnNlcn0gZnJvbSAnLi4vbWxfcGFyc2VyL2h0bWxfcGFyc2VyJztcbmltcG9ydCB7REVGQVVMVF9JTlRFUlBPTEFUSU9OX0NPTkZJRywgSW50ZXJwb2xhdGlvbkNvbmZpZ30gZnJvbSAnLi4vbWxfcGFyc2VyL2ludGVycG9sYXRpb25fY29uZmlnJztcbmltcG9ydCB7UGFyc2VUcmVlUmVzdWx0fSBmcm9tICcuLi9tbF9wYXJzZXIvcGFyc2VyJztcbmltcG9ydCB7Q29uc29sZX0gZnJvbSAnLi4vdXRpbCc7XG5cbmltcG9ydCB7ZGlnZXN0fSBmcm9tICcuL2RpZ2VzdCc7XG5pbXBvcnQge21lcmdlVHJhbnNsYXRpb25zfSBmcm9tICcuL2V4dHJhY3Rvcl9tZXJnZXInO1xuaW1wb3J0IHtTZXJpYWxpemVyfSBmcm9tICcuL3NlcmlhbGl6ZXJzL3NlcmlhbGl6ZXInO1xuaW1wb3J0IHtYbGlmZn0gZnJvbSAnLi9zZXJpYWxpemVycy94bGlmZic7XG5pbXBvcnQge1hsaWZmMn0gZnJvbSAnLi9zZXJpYWxpemVycy94bGlmZjInO1xuaW1wb3J0IHtYbWJ9IGZyb20gJy4vc2VyaWFsaXplcnMveG1iJztcbmltcG9ydCB7WHRifSBmcm9tICcuL3NlcmlhbGl6ZXJzL3h0Yic7XG5pbXBvcnQge1RyYW5zbGF0aW9uQnVuZGxlfSBmcm9tICcuL3RyYW5zbGF0aW9uX2J1bmRsZSc7XG5cbmV4cG9ydCBjbGFzcyBJMThOSHRtbFBhcnNlciBpbXBsZW1lbnRzIEh0bWxQYXJzZXIge1xuICAvLyBAb3ZlcnJpZGVcbiAgZ2V0VGFnRGVmaW5pdGlvbjogYW55O1xuXG4gIHByaXZhdGUgX3RyYW5zbGF0aW9uQnVuZGxlOiBUcmFuc2xhdGlvbkJ1bmRsZTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgX2h0bWxQYXJzZXI6IEh0bWxQYXJzZXIsIHRyYW5zbGF0aW9ucz86IHN0cmluZywgdHJhbnNsYXRpb25zRm9ybWF0Pzogc3RyaW5nLFxuICAgICAgbWlzc2luZ1RyYW5zbGF0aW9uOiBNaXNzaW5nVHJhbnNsYXRpb25TdHJhdGVneSA9IE1pc3NpbmdUcmFuc2xhdGlvblN0cmF0ZWd5Lldhcm5pbmcsXG4gICAgICBjb25zb2xlPzogQ29uc29sZSkge1xuICAgIGlmICh0cmFuc2xhdGlvbnMpIHtcbiAgICAgIGNvbnN0IHNlcmlhbGl6ZXIgPSBjcmVhdGVTZXJpYWxpemVyKHRyYW5zbGF0aW9uc0Zvcm1hdCk7XG4gICAgICB0aGlzLl90cmFuc2xhdGlvbkJ1bmRsZSA9XG4gICAgICAgICAgVHJhbnNsYXRpb25CdW5kbGUubG9hZCh0cmFuc2xhdGlvbnMsICdpMThuJywgc2VyaWFsaXplciwgbWlzc2luZ1RyYW5zbGF0aW9uLCBjb25zb2xlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fdHJhbnNsYXRpb25CdW5kbGUgPVxuICAgICAgICAgIG5ldyBUcmFuc2xhdGlvbkJ1bmRsZSh7fSwgbnVsbCwgZGlnZXN0LCB1bmRlZmluZWQsIG1pc3NpbmdUcmFuc2xhdGlvbiwgY29uc29sZSk7XG4gICAgfVxuICB9XG5cbiAgcGFyc2UoXG4gICAgICBzb3VyY2U6IHN0cmluZywgdXJsOiBzdHJpbmcsIHBhcnNlRXhwYW5zaW9uRm9ybXM6IGJvb2xlYW4gPSBmYWxzZSxcbiAgICAgIGludGVycG9sYXRpb25Db25maWc6IEludGVycG9sYXRpb25Db25maWcgPSBERUZBVUxUX0lOVEVSUE9MQVRJT05fQ09ORklHKTogUGFyc2VUcmVlUmVzdWx0IHtcbiAgICBjb25zdCBwYXJzZVJlc3VsdCA9XG4gICAgICAgIHRoaXMuX2h0bWxQYXJzZXIucGFyc2Uoc291cmNlLCB1cmwsIHBhcnNlRXhwYW5zaW9uRm9ybXMsIGludGVycG9sYXRpb25Db25maWcpO1xuXG4gICAgaWYgKHBhcnNlUmVzdWx0LmVycm9ycy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBuZXcgUGFyc2VUcmVlUmVzdWx0KHBhcnNlUmVzdWx0LnJvb3ROb2RlcywgcGFyc2VSZXN1bHQuZXJyb3JzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbWVyZ2VUcmFuc2xhdGlvbnMoXG4gICAgICAgIHBhcnNlUmVzdWx0LnJvb3ROb2RlcywgdGhpcy5fdHJhbnNsYXRpb25CdW5kbGUsIGludGVycG9sYXRpb25Db25maWcsIFtdLCB7fSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlU2VyaWFsaXplcihmb3JtYXQ/OiBzdHJpbmcpOiBTZXJpYWxpemVyIHtcbiAgZm9ybWF0ID0gKGZvcm1hdCB8fCAneGxmJykudG9Mb3dlckNhc2UoKTtcblxuICBzd2l0Y2ggKGZvcm1hdCkge1xuICAgIGNhc2UgJ3htYic6XG4gICAgICByZXR1cm4gbmV3IFhtYigpO1xuICAgIGNhc2UgJ3h0Yic6XG4gICAgICByZXR1cm4gbmV3IFh0YigpO1xuICAgIGNhc2UgJ3hsaWZmMic6XG4gICAgY2FzZSAneGxmMic6XG4gICAgICByZXR1cm4gbmV3IFhsaWZmMigpO1xuICAgIGNhc2UgJ3hsaWZmJzpcbiAgICBjYXNlICd4bGYnOlxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gbmV3IFhsaWZmKCk7XG4gIH1cbn1cbiJdfQ==
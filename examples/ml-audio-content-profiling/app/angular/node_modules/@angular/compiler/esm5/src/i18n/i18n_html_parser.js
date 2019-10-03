/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { MissingTranslationStrategy } from '../core';
import { DEFAULT_INTERPOLATION_CONFIG } from '../ml_parser/interpolation_config';
import { ParseTreeResult } from '../ml_parser/parser';
import { digest } from './digest';
import { mergeTranslations } from './extractor_merger';
import { Xliff } from './serializers/xliff';
import { Xliff2 } from './serializers/xliff2';
import { Xmb } from './serializers/xmb';
import { Xtb } from './serializers/xtb';
import { TranslationBundle } from './translation_bundle';
var I18NHtmlParser = /** @class */ (function () {
    function I18NHtmlParser(_htmlParser, translations, translationsFormat, missingTranslation, console) {
        if (missingTranslation === void 0) { missingTranslation = MissingTranslationStrategy.Warning; }
        this._htmlParser = _htmlParser;
        if (translations) {
            var serializer = createSerializer(translationsFormat);
            this._translationBundle =
                TranslationBundle.load(translations, 'i18n', serializer, missingTranslation, console);
        }
        else {
            this._translationBundle =
                new TranslationBundle({}, null, digest, undefined, missingTranslation, console);
        }
    }
    I18NHtmlParser.prototype.parse = function (source, url, parseExpansionForms, interpolationConfig) {
        if (parseExpansionForms === void 0) { parseExpansionForms = false; }
        if (interpolationConfig === void 0) { interpolationConfig = DEFAULT_INTERPOLATION_CONFIG; }
        var parseResult = this._htmlParser.parse(source, url, parseExpansionForms, interpolationConfig);
        if (parseResult.errors.length) {
            return new ParseTreeResult(parseResult.rootNodes, parseResult.errors);
        }
        return mergeTranslations(parseResult.rootNodes, this._translationBundle, interpolationConfig, [], {});
    };
    return I18NHtmlParser;
}());
export { I18NHtmlParser };
function createSerializer(format) {
    format = (format || 'xlf').toLowerCase();
    switch (format) {
        case 'xmb':
            return new Xmb();
        case 'xtb':
            return new Xtb();
        case 'xliff2':
        case 'xlf2':
            return new Xliff2();
        case 'xliff':
        case 'xlf':
        default:
            return new Xliff();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bl9odG1sX3BhcnNlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyL3NyYy9pMThuL2kxOG5faHRtbF9wYXJzZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLDBCQUEwQixFQUFDLE1BQU0sU0FBUyxDQUFDO0FBRW5ELE9BQU8sRUFBQyw0QkFBNEIsRUFBc0IsTUFBTSxtQ0FBbUMsQ0FBQztBQUNwRyxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFHcEQsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNoQyxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUVyRCxPQUFPLEVBQUMsS0FBSyxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDMUMsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQzVDLE9BQU8sRUFBQyxHQUFHLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN0QyxPQUFPLEVBQUMsR0FBRyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDdEMsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFFdkQ7SUFNRSx3QkFDWSxXQUF1QixFQUFFLFlBQXFCLEVBQUUsa0JBQTJCLEVBQ25GLGtCQUFtRixFQUNuRixPQUFpQjtRQURqQixtQ0FBQSxFQUFBLHFCQUFpRCwwQkFBMEIsQ0FBQyxPQUFPO1FBRDNFLGdCQUFXLEdBQVgsV0FBVyxDQUFZO1FBR2pDLElBQUksWUFBWSxFQUFFO1lBQ2hCLElBQU0sVUFBVSxHQUFHLGdCQUFnQixDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDeEQsSUFBSSxDQUFDLGtCQUFrQjtnQkFDbkIsaUJBQWlCLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLGtCQUFrQixFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQzNGO2FBQU07WUFDTCxJQUFJLENBQUMsa0JBQWtCO2dCQUNuQixJQUFJLGlCQUFpQixDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxrQkFBa0IsRUFBRSxPQUFPLENBQUMsQ0FBQztTQUNyRjtJQUNILENBQUM7SUFFRCw4QkFBSyxHQUFMLFVBQ0ksTUFBYyxFQUFFLEdBQVcsRUFBRSxtQkFBb0MsRUFDakUsbUJBQXVFO1FBRDFDLG9DQUFBLEVBQUEsMkJBQW9DO1FBQ2pFLG9DQUFBLEVBQUEsa0RBQXVFO1FBQ3pFLElBQU0sV0FBVyxHQUNiLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsbUJBQW1CLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztRQUVsRixJQUFJLFdBQVcsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO1lBQzdCLE9BQU8sSUFBSSxlQUFlLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDdkU7UUFFRCxPQUFPLGlCQUFpQixDQUNwQixXQUFXLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxtQkFBbUIsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDbkYsQ0FBQztJQUNILHFCQUFDO0FBQUQsQ0FBQyxBQWpDRCxJQWlDQzs7QUFFRCxTQUFTLGdCQUFnQixDQUFDLE1BQWU7SUFDdkMsTUFBTSxHQUFHLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBRXpDLFFBQVEsTUFBTSxFQUFFO1FBQ2QsS0FBSyxLQUFLO1lBQ1IsT0FBTyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ25CLEtBQUssS0FBSztZQUNSLE9BQU8sSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUNuQixLQUFLLFFBQVEsQ0FBQztRQUNkLEtBQUssTUFBTTtZQUNULE9BQU8sSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUN0QixLQUFLLE9BQU8sQ0FBQztRQUNiLEtBQUssS0FBSyxDQUFDO1FBQ1g7WUFDRSxPQUFPLElBQUksS0FBSyxFQUFFLENBQUM7S0FDdEI7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge01pc3NpbmdUcmFuc2xhdGlvblN0cmF0ZWd5fSBmcm9tICcuLi9jb3JlJztcbmltcG9ydCB7SHRtbFBhcnNlcn0gZnJvbSAnLi4vbWxfcGFyc2VyL2h0bWxfcGFyc2VyJztcbmltcG9ydCB7REVGQVVMVF9JTlRFUlBPTEFUSU9OX0NPTkZJRywgSW50ZXJwb2xhdGlvbkNvbmZpZ30gZnJvbSAnLi4vbWxfcGFyc2VyL2ludGVycG9sYXRpb25fY29uZmlnJztcbmltcG9ydCB7UGFyc2VUcmVlUmVzdWx0fSBmcm9tICcuLi9tbF9wYXJzZXIvcGFyc2VyJztcbmltcG9ydCB7Q29uc29sZX0gZnJvbSAnLi4vdXRpbCc7XG5cbmltcG9ydCB7ZGlnZXN0fSBmcm9tICcuL2RpZ2VzdCc7XG5pbXBvcnQge21lcmdlVHJhbnNsYXRpb25zfSBmcm9tICcuL2V4dHJhY3Rvcl9tZXJnZXInO1xuaW1wb3J0IHtTZXJpYWxpemVyfSBmcm9tICcuL3NlcmlhbGl6ZXJzL3NlcmlhbGl6ZXInO1xuaW1wb3J0IHtYbGlmZn0gZnJvbSAnLi9zZXJpYWxpemVycy94bGlmZic7XG5pbXBvcnQge1hsaWZmMn0gZnJvbSAnLi9zZXJpYWxpemVycy94bGlmZjInO1xuaW1wb3J0IHtYbWJ9IGZyb20gJy4vc2VyaWFsaXplcnMveG1iJztcbmltcG9ydCB7WHRifSBmcm9tICcuL3NlcmlhbGl6ZXJzL3h0Yic7XG5pbXBvcnQge1RyYW5zbGF0aW9uQnVuZGxlfSBmcm9tICcuL3RyYW5zbGF0aW9uX2J1bmRsZSc7XG5cbmV4cG9ydCBjbGFzcyBJMThOSHRtbFBhcnNlciBpbXBsZW1lbnRzIEh0bWxQYXJzZXIge1xuICAvLyBAb3ZlcnJpZGVcbiAgZ2V0VGFnRGVmaW5pdGlvbjogYW55O1xuXG4gIHByaXZhdGUgX3RyYW5zbGF0aW9uQnVuZGxlOiBUcmFuc2xhdGlvbkJ1bmRsZTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgX2h0bWxQYXJzZXI6IEh0bWxQYXJzZXIsIHRyYW5zbGF0aW9ucz86IHN0cmluZywgdHJhbnNsYXRpb25zRm9ybWF0Pzogc3RyaW5nLFxuICAgICAgbWlzc2luZ1RyYW5zbGF0aW9uOiBNaXNzaW5nVHJhbnNsYXRpb25TdHJhdGVneSA9IE1pc3NpbmdUcmFuc2xhdGlvblN0cmF0ZWd5Lldhcm5pbmcsXG4gICAgICBjb25zb2xlPzogQ29uc29sZSkge1xuICAgIGlmICh0cmFuc2xhdGlvbnMpIHtcbiAgICAgIGNvbnN0IHNlcmlhbGl6ZXIgPSBjcmVhdGVTZXJpYWxpemVyKHRyYW5zbGF0aW9uc0Zvcm1hdCk7XG4gICAgICB0aGlzLl90cmFuc2xhdGlvbkJ1bmRsZSA9XG4gICAgICAgICAgVHJhbnNsYXRpb25CdW5kbGUubG9hZCh0cmFuc2xhdGlvbnMsICdpMThuJywgc2VyaWFsaXplciwgbWlzc2luZ1RyYW5zbGF0aW9uLCBjb25zb2xlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fdHJhbnNsYXRpb25CdW5kbGUgPVxuICAgICAgICAgIG5ldyBUcmFuc2xhdGlvbkJ1bmRsZSh7fSwgbnVsbCwgZGlnZXN0LCB1bmRlZmluZWQsIG1pc3NpbmdUcmFuc2xhdGlvbiwgY29uc29sZSk7XG4gICAgfVxuICB9XG5cbiAgcGFyc2UoXG4gICAgICBzb3VyY2U6IHN0cmluZywgdXJsOiBzdHJpbmcsIHBhcnNlRXhwYW5zaW9uRm9ybXM6IGJvb2xlYW4gPSBmYWxzZSxcbiAgICAgIGludGVycG9sYXRpb25Db25maWc6IEludGVycG9sYXRpb25Db25maWcgPSBERUZBVUxUX0lOVEVSUE9MQVRJT05fQ09ORklHKTogUGFyc2VUcmVlUmVzdWx0IHtcbiAgICBjb25zdCBwYXJzZVJlc3VsdCA9XG4gICAgICAgIHRoaXMuX2h0bWxQYXJzZXIucGFyc2Uoc291cmNlLCB1cmwsIHBhcnNlRXhwYW5zaW9uRm9ybXMsIGludGVycG9sYXRpb25Db25maWcpO1xuXG4gICAgaWYgKHBhcnNlUmVzdWx0LmVycm9ycy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBuZXcgUGFyc2VUcmVlUmVzdWx0KHBhcnNlUmVzdWx0LnJvb3ROb2RlcywgcGFyc2VSZXN1bHQuZXJyb3JzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbWVyZ2VUcmFuc2xhdGlvbnMoXG4gICAgICAgIHBhcnNlUmVzdWx0LnJvb3ROb2RlcywgdGhpcy5fdHJhbnNsYXRpb25CdW5kbGUsIGludGVycG9sYXRpb25Db25maWcsIFtdLCB7fSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlU2VyaWFsaXplcihmb3JtYXQ/OiBzdHJpbmcpOiBTZXJpYWxpemVyIHtcbiAgZm9ybWF0ID0gKGZvcm1hdCB8fCAneGxmJykudG9Mb3dlckNhc2UoKTtcblxuICBzd2l0Y2ggKGZvcm1hdCkge1xuICAgIGNhc2UgJ3htYic6XG4gICAgICByZXR1cm4gbmV3IFhtYigpO1xuICAgIGNhc2UgJ3h0Yic6XG4gICAgICByZXR1cm4gbmV3IFh0YigpO1xuICAgIGNhc2UgJ3hsaWZmMic6XG4gICAgY2FzZSAneGxmMic6XG4gICAgICByZXR1cm4gbmV3IFhsaWZmMigpO1xuICAgIGNhc2UgJ3hsaWZmJzpcbiAgICBjYXNlICd4bGYnOlxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gbmV3IFhsaWZmKCk7XG4gIH1cbn1cbiJdfQ==
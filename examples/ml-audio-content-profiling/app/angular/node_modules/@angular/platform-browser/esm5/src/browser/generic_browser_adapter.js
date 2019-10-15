/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { DomAdapter } from '../dom/dom_adapter';
/**
 * Provides DOM operations in any browser environment.
 *
 * @security Tread carefully! Interacting with the DOM directly is dangerous and
 * can introduce XSS risks.
 */
var GenericBrowserDomAdapter = /** @class */ (function (_super) {
    tslib_1.__extends(GenericBrowserDomAdapter, _super);
    function GenericBrowserDomAdapter() {
        var _this = _super.call(this) || this;
        _this._animationPrefix = null;
        _this._transitionEnd = null;
        try {
            var element_1 = _this.createElement('div', document);
            if (_this.getStyle(element_1, 'animationName') != null) {
                _this._animationPrefix = '';
            }
            else {
                var domPrefixes = ['Webkit', 'Moz', 'O', 'ms'];
                for (var i = 0; i < domPrefixes.length; i++) {
                    if (_this.getStyle(element_1, domPrefixes[i] + 'AnimationName') != null) {
                        _this._animationPrefix = '-' + domPrefixes[i].toLowerCase() + '-';
                        break;
                    }
                }
            }
            var transEndEventNames_1 = {
                WebkitTransition: 'webkitTransitionEnd',
                MozTransition: 'transitionend',
                OTransition: 'oTransitionEnd otransitionend',
                transition: 'transitionend'
            };
            Object.keys(transEndEventNames_1).forEach(function (key) {
                if (_this.getStyle(element_1, key) != null) {
                    _this._transitionEnd = transEndEventNames_1[key];
                }
            });
        }
        catch (e) {
            _this._animationPrefix = null;
            _this._transitionEnd = null;
        }
        return _this;
    }
    GenericBrowserDomAdapter.prototype.getDistributedNodes = function (el) { return el.getDistributedNodes(); };
    GenericBrowserDomAdapter.prototype.resolveAndSetHref = function (el, baseUrl, href) {
        el.href = href == null ? baseUrl : baseUrl + '/../' + href;
    };
    GenericBrowserDomAdapter.prototype.supportsDOMEvents = function () { return true; };
    GenericBrowserDomAdapter.prototype.supportsNativeShadowDOM = function () {
        return typeof document.body.createShadowRoot === 'function';
    };
    GenericBrowserDomAdapter.prototype.getAnimationPrefix = function () { return this._animationPrefix ? this._animationPrefix : ''; };
    GenericBrowserDomAdapter.prototype.getTransitionEnd = function () { return this._transitionEnd ? this._transitionEnd : ''; };
    GenericBrowserDomAdapter.prototype.supportsAnimation = function () {
        return this._animationPrefix != null && this._transitionEnd != null;
    };
    return GenericBrowserDomAdapter;
}(DomAdapter));
export { GenericBrowserDomAdapter };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJpY19icm93c2VyX2FkYXB0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9wbGF0Zm9ybS1icm93c2VyL3NyYy9icm93c2VyL2dlbmVyaWNfYnJvd3Nlcl9hZGFwdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFJOUM7Ozs7O0dBS0c7QUFDSDtJQUF1RCxvREFBVTtJQUcvRDtRQUFBLFlBQ0UsaUJBQU8sU0FnQ1I7UUFuQ08sc0JBQWdCLEdBQWdCLElBQUksQ0FBQztRQUNyQyxvQkFBYyxHQUFnQixJQUFJLENBQUM7UUFHekMsSUFBSTtZQUNGLElBQU0sU0FBTyxHQUFHLEtBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ3BELElBQUksS0FBSSxDQUFDLFFBQVEsQ0FBQyxTQUFPLEVBQUUsZUFBZSxDQUFDLElBQUksSUFBSSxFQUFFO2dCQUNuRCxLQUFJLENBQUMsZ0JBQWdCLEdBQUcsRUFBRSxDQUFDO2FBQzVCO2lCQUFNO2dCQUNMLElBQU0sV0FBVyxHQUFHLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBRWpELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO29CQUMzQyxJQUFJLEtBQUksQ0FBQyxRQUFRLENBQUMsU0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsR0FBRyxlQUFlLENBQUMsSUFBSSxJQUFJLEVBQUU7d0JBQ3BFLEtBQUksQ0FBQyxnQkFBZ0IsR0FBRyxHQUFHLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxHQUFHLEdBQUcsQ0FBQzt3QkFDakUsTUFBTTtxQkFDUDtpQkFDRjthQUNGO1lBRUQsSUFBTSxvQkFBa0IsR0FBNEI7Z0JBQ2xELGdCQUFnQixFQUFFLHFCQUFxQjtnQkFDdkMsYUFBYSxFQUFFLGVBQWU7Z0JBQzlCLFdBQVcsRUFBRSwrQkFBK0I7Z0JBQzVDLFVBQVUsRUFBRSxlQUFlO2FBQzVCLENBQUM7WUFFRixNQUFNLENBQUMsSUFBSSxDQUFDLG9CQUFrQixDQUFDLENBQUMsT0FBTyxDQUFDLFVBQUMsR0FBVztnQkFDbEQsSUFBSSxLQUFJLENBQUMsUUFBUSxDQUFDLFNBQU8sRUFBRSxHQUFHLENBQUMsSUFBSSxJQUFJLEVBQUU7b0JBQ3ZDLEtBQUksQ0FBQyxjQUFjLEdBQUcsb0JBQWtCLENBQUMsR0FBRyxDQUFDLENBQUM7aUJBQy9DO1lBQ0gsQ0FBQyxDQUFDLENBQUM7U0FDSjtRQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ1YsS0FBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQztZQUM3QixLQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztTQUM1Qjs7SUFDSCxDQUFDO0lBRUQsc0RBQW1CLEdBQW5CLFVBQW9CLEVBQWUsSUFBWSxPQUFhLEVBQUcsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUN4RixvREFBaUIsR0FBakIsVUFBa0IsRUFBcUIsRUFBRSxPQUFlLEVBQUUsSUFBWTtRQUNwRSxFQUFFLENBQUMsSUFBSSxHQUFHLElBQUksSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLE1BQU0sR0FBRyxJQUFJLENBQUM7SUFDN0QsQ0FBQztJQUNELG9EQUFpQixHQUFqQixjQUErQixPQUFPLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDN0MsMERBQXVCLEdBQXZCO1FBQ0UsT0FBTyxPQUFZLFFBQVEsQ0FBQyxJQUFLLENBQUMsZ0JBQWdCLEtBQUssVUFBVSxDQUFDO0lBQ3BFLENBQUM7SUFDRCxxREFBa0IsR0FBbEIsY0FBK0IsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUMzRixtREFBZ0IsR0FBaEIsY0FBNkIsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ3JGLG9EQUFpQixHQUFqQjtRQUNFLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsY0FBYyxJQUFJLElBQUksQ0FBQztJQUN0RSxDQUFDO0lBQ0gsK0JBQUM7QUFBRCxDQUFDLEFBbkRELENBQXVELFVBQVUsR0FtRGhFIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RvbUFkYXB0ZXJ9IGZyb20gJy4uL2RvbS9kb21fYWRhcHRlcic7XG5cblxuXG4vKipcbiAqIFByb3ZpZGVzIERPTSBvcGVyYXRpb25zIGluIGFueSBicm93c2VyIGVudmlyb25tZW50LlxuICpcbiAqIEBzZWN1cml0eSBUcmVhZCBjYXJlZnVsbHkhIEludGVyYWN0aW5nIHdpdGggdGhlIERPTSBkaXJlY3RseSBpcyBkYW5nZXJvdXMgYW5kXG4gKiBjYW4gaW50cm9kdWNlIFhTUyByaXNrcy5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEdlbmVyaWNCcm93c2VyRG9tQWRhcHRlciBleHRlbmRzIERvbUFkYXB0ZXIge1xuICBwcml2YXRlIF9hbmltYXRpb25QcmVmaXg6IHN0cmluZ3xudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBfdHJhbnNpdGlvbkVuZDogc3RyaW5nfG51bGwgPSBudWxsO1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5jcmVhdGVFbGVtZW50KCdkaXYnLCBkb2N1bWVudCk7XG4gICAgICBpZiAodGhpcy5nZXRTdHlsZShlbGVtZW50LCAnYW5pbWF0aW9uTmFtZScpICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy5fYW5pbWF0aW9uUHJlZml4ID0gJyc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBkb21QcmVmaXhlcyA9IFsnV2Via2l0JywgJ01veicsICdPJywgJ21zJ107XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkb21QcmVmaXhlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmICh0aGlzLmdldFN0eWxlKGVsZW1lbnQsIGRvbVByZWZpeGVzW2ldICsgJ0FuaW1hdGlvbk5hbWUnKSAhPSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLl9hbmltYXRpb25QcmVmaXggPSAnLScgKyBkb21QcmVmaXhlc1tpXS50b0xvd2VyQ2FzZSgpICsgJy0nO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHRyYW5zRW5kRXZlbnROYW1lczoge1trZXk6IHN0cmluZ106IHN0cmluZ30gPSB7XG4gICAgICAgIFdlYmtpdFRyYW5zaXRpb246ICd3ZWJraXRUcmFuc2l0aW9uRW5kJyxcbiAgICAgICAgTW96VHJhbnNpdGlvbjogJ3RyYW5zaXRpb25lbmQnLFxuICAgICAgICBPVHJhbnNpdGlvbjogJ29UcmFuc2l0aW9uRW5kIG90cmFuc2l0aW9uZW5kJyxcbiAgICAgICAgdHJhbnNpdGlvbjogJ3RyYW5zaXRpb25lbmQnXG4gICAgICB9O1xuXG4gICAgICBPYmplY3Qua2V5cyh0cmFuc0VuZEV2ZW50TmFtZXMpLmZvckVhY2goKGtleTogc3RyaW5nKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmdldFN0eWxlKGVsZW1lbnQsIGtleSkgIT0gbnVsbCkge1xuICAgICAgICAgIHRoaXMuX3RyYW5zaXRpb25FbmQgPSB0cmFuc0VuZEV2ZW50TmFtZXNba2V5XTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdGhpcy5fYW5pbWF0aW9uUHJlZml4ID0gbnVsbDtcbiAgICAgIHRoaXMuX3RyYW5zaXRpb25FbmQgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGdldERpc3RyaWJ1dGVkTm9kZXMoZWw6IEhUTUxFbGVtZW50KTogTm9kZVtdIHsgcmV0dXJuICg8YW55PmVsKS5nZXREaXN0cmlidXRlZE5vZGVzKCk7IH1cbiAgcmVzb2x2ZUFuZFNldEhyZWYoZWw6IEhUTUxBbmNob3JFbGVtZW50LCBiYXNlVXJsOiBzdHJpbmcsIGhyZWY6IHN0cmluZykge1xuICAgIGVsLmhyZWYgPSBocmVmID09IG51bGwgPyBiYXNlVXJsIDogYmFzZVVybCArICcvLi4vJyArIGhyZWY7XG4gIH1cbiAgc3VwcG9ydHNET01FdmVudHMoKTogYm9vbGVhbiB7IHJldHVybiB0cnVlOyB9XG4gIHN1cHBvcnRzTmF0aXZlU2hhZG93RE9NKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0eXBlb2YoPGFueT5kb2N1bWVudC5ib2R5KS5jcmVhdGVTaGFkb3dSb290ID09PSAnZnVuY3Rpb24nO1xuICB9XG4gIGdldEFuaW1hdGlvblByZWZpeCgpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5fYW5pbWF0aW9uUHJlZml4ID8gdGhpcy5fYW5pbWF0aW9uUHJlZml4IDogJyc7IH1cbiAgZ2V0VHJhbnNpdGlvbkVuZCgpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5fdHJhbnNpdGlvbkVuZCA/IHRoaXMuX3RyYW5zaXRpb25FbmQgOiAnJzsgfVxuICBzdXBwb3J0c0FuaW1hdGlvbigpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fYW5pbWF0aW9uUHJlZml4ICE9IG51bGwgJiYgdGhpcy5fdHJhbnNpdGlvbkVuZCAhPSBudWxsO1xuICB9XG59XG4iXX0=
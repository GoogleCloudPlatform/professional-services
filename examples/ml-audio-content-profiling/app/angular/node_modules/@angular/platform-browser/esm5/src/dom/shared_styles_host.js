/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { Inject, Injectable } from '@angular/core';
import { getDOM } from './dom_adapter';
import { DOCUMENT } from './dom_tokens';
var SharedStylesHost = /** @class */ (function () {
    function SharedStylesHost() {
        /** @internal */
        this._stylesSet = new Set();
    }
    SharedStylesHost.prototype.addStyles = function (styles) {
        var _this = this;
        var additions = new Set();
        styles.forEach(function (style) {
            if (!_this._stylesSet.has(style)) {
                _this._stylesSet.add(style);
                additions.add(style);
            }
        });
        this.onStylesAdded(additions);
    };
    SharedStylesHost.prototype.onStylesAdded = function (additions) { };
    SharedStylesHost.prototype.getAllStyles = function () { return Array.from(this._stylesSet); };
    SharedStylesHost = tslib_1.__decorate([
        Injectable()
    ], SharedStylesHost);
    return SharedStylesHost;
}());
export { SharedStylesHost };
var DomSharedStylesHost = /** @class */ (function (_super) {
    tslib_1.__extends(DomSharedStylesHost, _super);
    function DomSharedStylesHost(_doc) {
        var _this = _super.call(this) || this;
        _this._doc = _doc;
        _this._hostNodes = new Set();
        _this._styleNodes = new Set();
        _this._hostNodes.add(_doc.head);
        return _this;
    }
    DomSharedStylesHost.prototype._addStylesToHost = function (styles, host) {
        var _this = this;
        styles.forEach(function (style) {
            var styleEl = _this._doc.createElement('style');
            styleEl.textContent = style;
            _this._styleNodes.add(host.appendChild(styleEl));
        });
    };
    DomSharedStylesHost.prototype.addHost = function (hostNode) {
        this._addStylesToHost(this._stylesSet, hostNode);
        this._hostNodes.add(hostNode);
    };
    DomSharedStylesHost.prototype.removeHost = function (hostNode) { this._hostNodes.delete(hostNode); };
    DomSharedStylesHost.prototype.onStylesAdded = function (additions) {
        var _this = this;
        this._hostNodes.forEach(function (hostNode) { return _this._addStylesToHost(additions, hostNode); });
    };
    DomSharedStylesHost.prototype.ngOnDestroy = function () { this._styleNodes.forEach(function (styleNode) { return getDOM().remove(styleNode); }); };
    DomSharedStylesHost = tslib_1.__decorate([
        Injectable(),
        tslib_1.__param(0, Inject(DOCUMENT)),
        tslib_1.__metadata("design:paramtypes", [Object])
    ], DomSharedStylesHost);
    return DomSharedStylesHost;
}(SharedStylesHost));
export { DomSharedStylesHost };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmVkX3N0eWxlc19ob3N0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvcGxhdGZvcm0tYnJvd3Nlci9zcmMvZG9tL3NoYXJlZF9zdHlsZXNfaG9zdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBRUgsT0FBTyxFQUFDLE1BQU0sRUFBRSxVQUFVLEVBQVksTUFBTSxlQUFlLENBQUM7QUFDNUQsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUNyQyxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBR3RDO0lBREE7UUFFRSxnQkFBZ0I7UUFDTixlQUFVLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztJQWdCM0MsQ0FBQztJQWRDLG9DQUFTLEdBQVQsVUFBVSxNQUFnQjtRQUExQixpQkFTQztRQVJDLElBQU0sU0FBUyxHQUFHLElBQUksR0FBRyxFQUFVLENBQUM7UUFDcEMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxVQUFBLEtBQUs7WUFDbEIsSUFBSSxDQUFDLEtBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUMvQixLQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDM0IsU0FBUyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUN0QjtRQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNoQyxDQUFDO0lBRUQsd0NBQWEsR0FBYixVQUFjLFNBQXNCLElBQVMsQ0FBQztJQUU5Qyx1Q0FBWSxHQUFaLGNBQTJCLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBakJyRCxnQkFBZ0I7UUFENUIsVUFBVSxFQUFFO09BQ0EsZ0JBQWdCLENBa0I1QjtJQUFELHVCQUFDO0NBQUEsQUFsQkQsSUFrQkM7U0FsQlksZ0JBQWdCO0FBcUI3QjtJQUF5QywrQ0FBZ0I7SUFHdkQsNkJBQXNDLElBQVM7UUFBL0MsWUFDRSxpQkFBTyxTQUVSO1FBSHFDLFVBQUksR0FBSixJQUFJLENBQUs7UUFGdkMsZ0JBQVUsR0FBRyxJQUFJLEdBQUcsRUFBUSxDQUFDO1FBQzdCLGlCQUFXLEdBQUcsSUFBSSxHQUFHLEVBQVEsQ0FBQztRQUdwQyxLQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7O0lBQ2pDLENBQUM7SUFFTyw4Q0FBZ0IsR0FBeEIsVUFBeUIsTUFBbUIsRUFBRSxJQUFVO1FBQXhELGlCQU1DO1FBTEMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxVQUFDLEtBQWE7WUFDM0IsSUFBTSxPQUFPLEdBQUcsS0FBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDakQsT0FBTyxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7WUFDNUIsS0FBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ2xELENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELHFDQUFPLEdBQVAsVUFBUSxRQUFjO1FBQ3BCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ2pELElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ2hDLENBQUM7SUFFRCx3Q0FBVSxHQUFWLFVBQVcsUUFBYyxJQUFVLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUV0RSwyQ0FBYSxHQUFiLFVBQWMsU0FBc0I7UUFBcEMsaUJBRUM7UUFEQyxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxVQUFBLFFBQVEsSUFBSSxPQUFBLEtBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLEVBQTFDLENBQTBDLENBQUMsQ0FBQztJQUNsRixDQUFDO0lBRUQseUNBQVcsR0FBWCxjQUFzQixJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxVQUFBLFNBQVMsSUFBSSxPQUFBLE1BQU0sRUFBRSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBMUIsQ0FBMEIsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQTNCL0UsbUJBQW1CO1FBRC9CLFVBQVUsRUFBRTtRQUlFLG1CQUFBLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQTs7T0FIbEIsbUJBQW1CLENBNEIvQjtJQUFELDBCQUFDO0NBQUEsQUE1QkQsQ0FBeUMsZ0JBQWdCLEdBNEJ4RDtTQTVCWSxtQkFBbUIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0LCBJbmplY3RhYmxlLCBPbkRlc3Ryb3l9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtnZXRET019IGZyb20gJy4vZG9tX2FkYXB0ZXInO1xuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnLi9kb21fdG9rZW5zJztcblxuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIFNoYXJlZFN0eWxlc0hvc3Qge1xuICAvKiogQGludGVybmFsICovXG4gIHByb3RlY3RlZCBfc3R5bGVzU2V0ID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgYWRkU3R5bGVzKHN0eWxlczogc3RyaW5nW10pOiB2b2lkIHtcbiAgICBjb25zdCBhZGRpdGlvbnMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBzdHlsZXMuZm9yRWFjaChzdHlsZSA9PiB7XG4gICAgICBpZiAoIXRoaXMuX3N0eWxlc1NldC5oYXMoc3R5bGUpKSB7XG4gICAgICAgIHRoaXMuX3N0eWxlc1NldC5hZGQoc3R5bGUpO1xuICAgICAgICBhZGRpdGlvbnMuYWRkKHN0eWxlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLm9uU3R5bGVzQWRkZWQoYWRkaXRpb25zKTtcbiAgfVxuXG4gIG9uU3R5bGVzQWRkZWQoYWRkaXRpb25zOiBTZXQ8c3RyaW5nPik6IHZvaWQge31cblxuICBnZXRBbGxTdHlsZXMoKTogc3RyaW5nW10geyByZXR1cm4gQXJyYXkuZnJvbSh0aGlzLl9zdHlsZXNTZXQpOyB9XG59XG5cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBEb21TaGFyZWRTdHlsZXNIb3N0IGV4dGVuZHMgU2hhcmVkU3R5bGVzSG9zdCBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIHByaXZhdGUgX2hvc3ROb2RlcyA9IG5ldyBTZXQ8Tm9kZT4oKTtcbiAgcHJpdmF0ZSBfc3R5bGVOb2RlcyA9IG5ldyBTZXQ8Tm9kZT4oKTtcbiAgY29uc3RydWN0b3IoQEluamVjdChET0NVTUVOVCkgcHJpdmF0ZSBfZG9jOiBhbnkpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuX2hvc3ROb2Rlcy5hZGQoX2RvYy5oZWFkKTtcbiAgfVxuXG4gIHByaXZhdGUgX2FkZFN0eWxlc1RvSG9zdChzdHlsZXM6IFNldDxzdHJpbmc+LCBob3N0OiBOb2RlKTogdm9pZCB7XG4gICAgc3R5bGVzLmZvckVhY2goKHN0eWxlOiBzdHJpbmcpID0+IHtcbiAgICAgIGNvbnN0IHN0eWxlRWwgPSB0aGlzLl9kb2MuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICAgIHN0eWxlRWwudGV4dENvbnRlbnQgPSBzdHlsZTtcbiAgICAgIHRoaXMuX3N0eWxlTm9kZXMuYWRkKGhvc3QuYXBwZW5kQ2hpbGQoc3R5bGVFbCkpO1xuICAgIH0pO1xuICB9XG5cbiAgYWRkSG9zdChob3N0Tm9kZTogTm9kZSk6IHZvaWQge1xuICAgIHRoaXMuX2FkZFN0eWxlc1RvSG9zdCh0aGlzLl9zdHlsZXNTZXQsIGhvc3ROb2RlKTtcbiAgICB0aGlzLl9ob3N0Tm9kZXMuYWRkKGhvc3ROb2RlKTtcbiAgfVxuXG4gIHJlbW92ZUhvc3QoaG9zdE5vZGU6IE5vZGUpOiB2b2lkIHsgdGhpcy5faG9zdE5vZGVzLmRlbGV0ZShob3N0Tm9kZSk7IH1cblxuICBvblN0eWxlc0FkZGVkKGFkZGl0aW9uczogU2V0PHN0cmluZz4pOiB2b2lkIHtcbiAgICB0aGlzLl9ob3N0Tm9kZXMuZm9yRWFjaChob3N0Tm9kZSA9PiB0aGlzLl9hZGRTdHlsZXNUb0hvc3QoYWRkaXRpb25zLCBob3N0Tm9kZSkpO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKTogdm9pZCB7IHRoaXMuX3N0eWxlTm9kZXMuZm9yRWFjaChzdHlsZU5vZGUgPT4gZ2V0RE9NKCkucmVtb3ZlKHN0eWxlTm9kZSkpOyB9XG59XG4iXX0=
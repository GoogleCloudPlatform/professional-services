import * as tslib_1 from "tslib";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { NoopAnimationPlayer } from '@angular/animations';
import { hypenatePropsObject } from '../shared';
var DirectStylePlayer = /** @class */ (function (_super) {
    tslib_1.__extends(DirectStylePlayer, _super);
    function DirectStylePlayer(element, styles) {
        var _this = _super.call(this) || this;
        _this.element = element;
        _this._startingStyles = {};
        _this.__initialized = false;
        _this._styles = hypenatePropsObject(styles);
        return _this;
    }
    DirectStylePlayer.prototype.init = function () {
        var _this = this;
        if (this.__initialized || !this._startingStyles)
            return;
        this.__initialized = true;
        Object.keys(this._styles).forEach(function (prop) {
            _this._startingStyles[prop] = _this.element.style[prop];
        });
        _super.prototype.init.call(this);
    };
    DirectStylePlayer.prototype.play = function () {
        var _this = this;
        if (!this._startingStyles)
            return;
        this.init();
        Object.keys(this._styles)
            .forEach(function (prop) { return _this.element.style.setProperty(prop, _this._styles[prop]); });
        _super.prototype.play.call(this);
    };
    DirectStylePlayer.prototype.destroy = function () {
        var _this = this;
        if (!this._startingStyles)
            return;
        Object.keys(this._startingStyles).forEach(function (prop) {
            var value = _this._startingStyles[prop];
            if (value) {
                _this.element.style.setProperty(prop, value);
            }
            else {
                _this.element.style.removeProperty(prop);
            }
        });
        this._startingStyles = null;
        _super.prototype.destroy.call(this);
    };
    return DirectStylePlayer;
}(NoopAnimationPlayer));
export { DirectStylePlayer };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlyZWN0X3N0eWxlX3BsYXllci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuaW1hdGlvbnMvYnJvd3Nlci9zcmMvcmVuZGVyL2Nzc19rZXlmcmFtZXMvZGlyZWN0X3N0eWxlX3BsYXllci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HO0FBQ0gsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDeEQsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sV0FBVyxDQUFDO0FBRTlDO0lBQXVDLDZDQUFtQjtJQUt4RCwyQkFBbUIsT0FBWSxFQUFFLE1BQTRCO1FBQTdELFlBQ0UsaUJBQU8sU0FFUjtRQUhrQixhQUFPLEdBQVAsT0FBTyxDQUFLO1FBSnZCLHFCQUFlLEdBQThCLEVBQUUsQ0FBQztRQUNoRCxtQkFBYSxHQUFHLEtBQUssQ0FBQztRQUs1QixLQUFJLENBQUMsT0FBTyxHQUFHLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxDQUFDOztJQUM3QyxDQUFDO0lBRUQsZ0NBQUksR0FBSjtRQUFBLGlCQU9DO1FBTkMsSUFBSSxJQUFJLENBQUMsYUFBYSxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWU7WUFBRSxPQUFPO1FBQ3hELElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDO1FBQzFCLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFBLElBQUk7WUFDcEMsS0FBSSxDQUFDLGVBQWlCLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDMUQsQ0FBQyxDQUFDLENBQUM7UUFDSCxpQkFBTSxJQUFJLFdBQUUsQ0FBQztJQUNmLENBQUM7SUFFRCxnQ0FBSSxHQUFKO1FBQUEsaUJBTUM7UUFMQyxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWU7WUFBRSxPQUFPO1FBQ2xDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNaLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQzthQUNwQixPQUFPLENBQUMsVUFBQSxJQUFJLElBQUksT0FBQSxLQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLEtBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBeEQsQ0FBd0QsQ0FBQyxDQUFDO1FBQy9FLGlCQUFNLElBQUksV0FBRSxDQUFDO0lBQ2YsQ0FBQztJQUVELG1DQUFPLEdBQVA7UUFBQSxpQkFZQztRQVhDLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZTtZQUFFLE9BQU87UUFDbEMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQUEsSUFBSTtZQUM1QyxJQUFNLEtBQUssR0FBRyxLQUFJLENBQUMsZUFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMzQyxJQUFJLEtBQUssRUFBRTtnQkFDVCxLQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO2FBQzdDO2lCQUFNO2dCQUNMLEtBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUN6QztRQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7UUFDNUIsaUJBQU0sT0FBTyxXQUFFLENBQUM7SUFDbEIsQ0FBQztJQUNILHdCQUFDO0FBQUQsQ0FBQyxBQXhDRCxDQUF1QyxtQkFBbUIsR0F3Q3pEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtOb29wQW5pbWF0aW9uUGxheWVyfSBmcm9tICdAYW5ndWxhci9hbmltYXRpb25zJztcbmltcG9ydCB7aHlwZW5hdGVQcm9wc09iamVjdH0gZnJvbSAnLi4vc2hhcmVkJztcblxuZXhwb3J0IGNsYXNzIERpcmVjdFN0eWxlUGxheWVyIGV4dGVuZHMgTm9vcEFuaW1hdGlvblBsYXllciB7XG4gIHByaXZhdGUgX3N0YXJ0aW5nU3R5bGVzOiB7W2tleTogc3RyaW5nXTogYW55fXxudWxsID0ge307XG4gIHByaXZhdGUgX19pbml0aWFsaXplZCA9IGZhbHNlO1xuICBwcml2YXRlIF9zdHlsZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9O1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBlbGVtZW50OiBhbnksIHN0eWxlczoge1trZXk6IHN0cmluZ106IGFueX0pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuX3N0eWxlcyA9IGh5cGVuYXRlUHJvcHNPYmplY3Qoc3R5bGVzKTtcbiAgfVxuXG4gIGluaXQoKSB7XG4gICAgaWYgKHRoaXMuX19pbml0aWFsaXplZCB8fCAhdGhpcy5fc3RhcnRpbmdTdHlsZXMpIHJldHVybjtcbiAgICB0aGlzLl9faW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgIE9iamVjdC5rZXlzKHRoaXMuX3N0eWxlcykuZm9yRWFjaChwcm9wID0+IHtcbiAgICAgIHRoaXMuX3N0YXJ0aW5nU3R5bGVzICFbcHJvcF0gPSB0aGlzLmVsZW1lbnQuc3R5bGVbcHJvcF07XG4gICAgfSk7XG4gICAgc3VwZXIuaW5pdCgpO1xuICB9XG5cbiAgcGxheSgpIHtcbiAgICBpZiAoIXRoaXMuX3N0YXJ0aW5nU3R5bGVzKSByZXR1cm47XG4gICAgdGhpcy5pbml0KCk7XG4gICAgT2JqZWN0LmtleXModGhpcy5fc3R5bGVzKVxuICAgICAgICAuZm9yRWFjaChwcm9wID0+IHRoaXMuZWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eShwcm9wLCB0aGlzLl9zdHlsZXNbcHJvcF0pKTtcbiAgICBzdXBlci5wbGF5KCk7XG4gIH1cblxuICBkZXN0cm95KCkge1xuICAgIGlmICghdGhpcy5fc3RhcnRpbmdTdHlsZXMpIHJldHVybjtcbiAgICBPYmplY3Qua2V5cyh0aGlzLl9zdGFydGluZ1N0eWxlcykuZm9yRWFjaChwcm9wID0+IHtcbiAgICAgIGNvbnN0IHZhbHVlID0gdGhpcy5fc3RhcnRpbmdTdHlsZXMgIVtwcm9wXTtcbiAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkocHJvcCwgdmFsdWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLnJlbW92ZVByb3BlcnR5KHByb3ApO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuX3N0YXJ0aW5nU3R5bGVzID0gbnVsbDtcbiAgICBzdXBlci5kZXN0cm95KCk7XG4gIH1cbn1cbiJdfQ==
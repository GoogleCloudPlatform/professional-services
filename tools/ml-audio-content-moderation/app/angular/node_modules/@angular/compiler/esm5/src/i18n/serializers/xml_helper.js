/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
var _Visitor = /** @class */ (function () {
    function _Visitor() {
    }
    _Visitor.prototype.visitTag = function (tag) {
        var _this = this;
        var strAttrs = this._serializeAttributes(tag.attrs);
        if (tag.children.length == 0) {
            return "<" + tag.name + strAttrs + "/>";
        }
        var strChildren = tag.children.map(function (node) { return node.visit(_this); });
        return "<" + tag.name + strAttrs + ">" + strChildren.join('') + "</" + tag.name + ">";
    };
    _Visitor.prototype.visitText = function (text) { return text.value; };
    _Visitor.prototype.visitDeclaration = function (decl) {
        return "<?xml" + this._serializeAttributes(decl.attrs) + " ?>";
    };
    _Visitor.prototype._serializeAttributes = function (attrs) {
        var strAttrs = Object.keys(attrs).map(function (name) { return name + "=\"" + attrs[name] + "\""; }).join(' ');
        return strAttrs.length > 0 ? ' ' + strAttrs : '';
    };
    _Visitor.prototype.visitDoctype = function (doctype) {
        return "<!DOCTYPE " + doctype.rootTag + " [\n" + doctype.dtd + "\n]>";
    };
    return _Visitor;
}());
var _visitor = new _Visitor();
export function serialize(nodes) {
    return nodes.map(function (node) { return node.visit(_visitor); }).join('');
}
var Declaration = /** @class */ (function () {
    function Declaration(unescapedAttrs) {
        var _this = this;
        this.attrs = {};
        Object.keys(unescapedAttrs).forEach(function (k) {
            _this.attrs[k] = escapeXml(unescapedAttrs[k]);
        });
    }
    Declaration.prototype.visit = function (visitor) { return visitor.visitDeclaration(this); };
    return Declaration;
}());
export { Declaration };
var Doctype = /** @class */ (function () {
    function Doctype(rootTag, dtd) {
        this.rootTag = rootTag;
        this.dtd = dtd;
    }
    Doctype.prototype.visit = function (visitor) { return visitor.visitDoctype(this); };
    return Doctype;
}());
export { Doctype };
var Tag = /** @class */ (function () {
    function Tag(name, unescapedAttrs, children) {
        if (unescapedAttrs === void 0) { unescapedAttrs = {}; }
        if (children === void 0) { children = []; }
        var _this = this;
        this.name = name;
        this.children = children;
        this.attrs = {};
        Object.keys(unescapedAttrs).forEach(function (k) {
            _this.attrs[k] = escapeXml(unescapedAttrs[k]);
        });
    }
    Tag.prototype.visit = function (visitor) { return visitor.visitTag(this); };
    return Tag;
}());
export { Tag };
var Text = /** @class */ (function () {
    function Text(unescapedValue) {
        this.value = escapeXml(unescapedValue);
    }
    Text.prototype.visit = function (visitor) { return visitor.visitText(this); };
    return Text;
}());
export { Text };
var CR = /** @class */ (function (_super) {
    tslib_1.__extends(CR, _super);
    function CR(ws) {
        if (ws === void 0) { ws = 0; }
        return _super.call(this, "\n" + new Array(ws + 1).join(' ')) || this;
    }
    return CR;
}(Text));
export { CR };
var _ESCAPED_CHARS = [
    [/&/g, '&amp;'],
    [/"/g, '&quot;'],
    [/'/g, '&apos;'],
    [/</g, '&lt;'],
    [/>/g, '&gt;'],
];
// Escape `_ESCAPED_CHARS` characters in the given text with encoded entities
export function escapeXml(text) {
    return _ESCAPED_CHARS.reduce(function (text, entry) { return text.replace(entry[0], entry[1]); }, text);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieG1sX2hlbHBlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyL3NyYy9pMThuL3NlcmlhbGl6ZXJzL3htbF9oZWxwZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQVNIO0lBQUE7SUEwQkEsQ0FBQztJQXpCQywyQkFBUSxHQUFSLFVBQVMsR0FBUTtRQUFqQixpQkFTQztRQVJDLElBQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFdEQsSUFBSSxHQUFHLENBQUMsUUFBUSxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQUU7WUFDNUIsT0FBTyxNQUFJLEdBQUcsQ0FBQyxJQUFJLEdBQUcsUUFBUSxPQUFJLENBQUM7U0FDcEM7UUFFRCxJQUFNLFdBQVcsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxVQUFBLElBQUksSUFBSSxPQUFBLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSSxDQUFDLEVBQWhCLENBQWdCLENBQUMsQ0FBQztRQUMvRCxPQUFPLE1BQUksR0FBRyxDQUFDLElBQUksR0FBRyxRQUFRLFNBQUksV0FBVyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBSyxHQUFHLENBQUMsSUFBSSxNQUFHLENBQUM7SUFDekUsQ0FBQztJQUVELDRCQUFTLEdBQVQsVUFBVSxJQUFVLElBQVksT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUVwRCxtQ0FBZ0IsR0FBaEIsVUFBaUIsSUFBaUI7UUFDaEMsT0FBTyxVQUFRLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQUssQ0FBQztJQUM1RCxDQUFDO0lBRU8sdUNBQW9CLEdBQTVCLFVBQTZCLEtBQTRCO1FBQ3ZELElBQU0sUUFBUSxHQUFHLE1BQU0sQ0FB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O0FBRUQ7SUFBd0IsOEJBQUk7SUFDMUIsWUFBWSxFQUFjO1FBQWQsbUJBQUEsRUFBQSxNQUFjO2VBQUksa0JBQU0sT0FBSyxJQUFJLEtBQUssQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBRyxDQUFDO0lBQUUsQ0FBQztJQUM1RSxTQUFDO0FBQUQsQ0FBQyxBQUZELENBQXdCLElBQUksR0FFM0I7O0FBRUQsSUFBTSxjQUFjLEdBQXVCO0lBQ3pDLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQztJQUNmLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQztJQUNoQixDQUFDLElBQUksRUFBRSxRQUFRLENBQUM7SUFDaEIsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDO0lBQ2QsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDO0NBQ2YsQ0FBQztBQUVGLDZFQUE2RTtBQUM3RSxNQUFNLFVBQVUsU0FBUyxDQUFDLElBQVk7SUFDcEMsT0FBTyxjQUFjLENBQUMsTUFBTSxDQUN4QixVQUFDLElBQVksRUFBRSxLQUF1QixJQUFLLE9BQUEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQWhDLENBQWdDLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDekYsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuZXhwb3J0IGludGVyZmFjZSBJVmlzaXRvciB7XG4gIHZpc2l0VGFnKHRhZzogVGFnKTogYW55O1xuICB2aXNpdFRleHQodGV4dDogVGV4dCk6IGFueTtcbiAgdmlzaXREZWNsYXJhdGlvbihkZWNsOiBEZWNsYXJhdGlvbik6IGFueTtcbiAgdmlzaXREb2N0eXBlKGRvY3R5cGU6IERvY3R5cGUpOiBhbnk7XG59XG5cbmNsYXNzIF9WaXNpdG9yIGltcGxlbWVudHMgSVZpc2l0b3Ige1xuICB2aXNpdFRhZyh0YWc6IFRhZyk6IHN0cmluZyB7XG4gICAgY29uc3Qgc3RyQXR0cnMgPSB0aGlzLl9zZXJpYWxpemVBdHRyaWJ1dGVzKHRhZy5hdHRycyk7XG5cbiAgICBpZiAodGFnLmNoaWxkcmVuLmxlbmd0aCA9PSAwKSB7XG4gICAgICByZXR1cm4gYDwke3RhZy5uYW1lfSR7c3RyQXR0cnN9Lz5gO1xuICAgIH1cblxuICAgIGNvbnN0IHN0ckNoaWxkcmVuID0gdGFnLmNoaWxkcmVuLm1hcChub2RlID0+IG5vZGUudmlzaXQodGhpcykpO1xuICAgIHJldHVybiBgPCR7dGFnLm5hbWV9JHtzdHJBdHRyc30+JHtzdHJDaGlsZHJlbi5qb2luKCcnKX08LyR7dGFnLm5hbWV9PmA7XG4gIH1cblxuICB2aXNpdFRleHQodGV4dDogVGV4dCk6IHN0cmluZyB7IHJldHVybiB0ZXh0LnZhbHVlOyB9XG5cbiAgdmlzaXREZWNsYXJhdGlvbihkZWNsOiBEZWNsYXJhdGlvbik6IHN0cmluZyB7XG4gICAgcmV0dXJuIGA8P3htbCR7dGhpcy5fc2VyaWFsaXplQXR0cmlidXRlcyhkZWNsLmF0dHJzKX0gPz5gO1xuICB9XG5cbiAgcHJpdmF0ZSBfc2VyaWFsaXplQXR0cmlidXRlcyhhdHRyczoge1trOiBzdHJpbmddOiBzdHJpbmd9KSB7XG4gICAgY29uc3Qgc3RyQXR0cnMgPSBPYmplY3Qua2V5cyhhdHRycykubWFwKChuYW1lOiBzdHJpbmcpID0+IGAke25hbWV9PVwiJHthdHRyc1tuYW1lXX1cImApLmpvaW4oJyAnKTtcbiAgICByZXR1cm4gc3RyQXR0cnMubGVuZ3RoID4gMCA/ICcgJyArIHN0ckF0dHJzIDogJyc7XG4gIH1cblxuICB2aXNpdERvY3R5cGUoZG9jdHlwZTogRG9jdHlwZSk6IGFueSB7XG4gICAgcmV0dXJuIGA8IURPQ1RZUEUgJHtkb2N0eXBlLnJvb3RUYWd9IFtcXG4ke2RvY3R5cGUuZHRkfVxcbl0+YDtcbiAgfVxufVxuXG5jb25zdCBfdmlzaXRvciA9IG5ldyBfVmlzaXRvcigpO1xuXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplKG5vZGVzOiBOb2RlW10pOiBzdHJpbmcge1xuICByZXR1cm4gbm9kZXMubWFwKChub2RlOiBOb2RlKTogc3RyaW5nID0+IG5vZGUudmlzaXQoX3Zpc2l0b3IpKS5qb2luKCcnKTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBOb2RlIHsgdmlzaXQodmlzaXRvcjogSVZpc2l0b3IpOiBhbnk7IH1cblxuZXhwb3J0IGNsYXNzIERlY2xhcmF0aW9uIGltcGxlbWVudHMgTm9kZSB7XG4gIHB1YmxpYyBhdHRyczoge1trOiBzdHJpbmddOiBzdHJpbmd9ID0ge307XG5cbiAgY29uc3RydWN0b3IodW5lc2NhcGVkQXR0cnM6IHtbazogc3RyaW5nXTogc3RyaW5nfSkge1xuICAgIE9iamVjdC5rZXlzKHVuZXNjYXBlZEF0dHJzKS5mb3JFYWNoKChrOiBzdHJpbmcpID0+IHtcbiAgICAgIHRoaXMuYXR0cnNba10gPSBlc2NhcGVYbWwodW5lc2NhcGVkQXR0cnNba10pO1xuICAgIH0pO1xuICB9XG5cbiAgdmlzaXQodmlzaXRvcjogSVZpc2l0b3IpOiBhbnkgeyByZXR1cm4gdmlzaXRvci52aXNpdERlY2xhcmF0aW9uKHRoaXMpOyB9XG59XG5cbmV4cG9ydCBjbGFzcyBEb2N0eXBlIGltcGxlbWVudHMgTm9kZSB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyByb290VGFnOiBzdHJpbmcsIHB1YmxpYyBkdGQ6IHN0cmluZykge31cblxuICB2aXNpdCh2aXNpdG9yOiBJVmlzaXRvcik6IGFueSB7IHJldHVybiB2aXNpdG9yLnZpc2l0RG9jdHlwZSh0aGlzKTsgfVxufVxuXG5leHBvcnQgY2xhc3MgVGFnIGltcGxlbWVudHMgTm9kZSB7XG4gIHB1YmxpYyBhdHRyczoge1trOiBzdHJpbmddOiBzdHJpbmd9ID0ge307XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgbmFtZTogc3RyaW5nLCB1bmVzY2FwZWRBdHRyczoge1trOiBzdHJpbmddOiBzdHJpbmd9ID0ge30sXG4gICAgICBwdWJsaWMgY2hpbGRyZW46IE5vZGVbXSA9IFtdKSB7XG4gICAgT2JqZWN0LmtleXModW5lc2NhcGVkQXR0cnMpLmZvckVhY2goKGs6IHN0cmluZykgPT4ge1xuICAgICAgdGhpcy5hdHRyc1trXSA9IGVzY2FwZVhtbCh1bmVzY2FwZWRBdHRyc1trXSk7XG4gICAgfSk7XG4gIH1cblxuICB2aXNpdCh2aXNpdG9yOiBJVmlzaXRvcik6IGFueSB7IHJldHVybiB2aXNpdG9yLnZpc2l0VGFnKHRoaXMpOyB9XG59XG5cbmV4cG9ydCBjbGFzcyBUZXh0IGltcGxlbWVudHMgTm9kZSB7XG4gIHZhbHVlOiBzdHJpbmc7XG4gIGNvbnN0cnVjdG9yKHVuZXNjYXBlZFZhbHVlOiBzdHJpbmcpIHsgdGhpcy52YWx1ZSA9IGVzY2FwZVhtbCh1bmVzY2FwZWRWYWx1ZSk7IH1cblxuICB2aXNpdCh2aXNpdG9yOiBJVmlzaXRvcik6IGFueSB7IHJldHVybiB2aXNpdG9yLnZpc2l0VGV4dCh0aGlzKTsgfVxufVxuXG5leHBvcnQgY2xhc3MgQ1IgZXh0ZW5kcyBUZXh0IHtcbiAgY29uc3RydWN0b3Iod3M6IG51bWJlciA9IDApIHsgc3VwZXIoYFxcbiR7bmV3IEFycmF5KHdzICsgMSkuam9pbignICcpfWApOyB9XG59XG5cbmNvbnN0IF9FU0NBUEVEX0NIQVJTOiBbUmVnRXhwLCBzdHJpbmddW10gPSBbXG4gIFsvJi9nLCAnJmFtcDsnXSxcbiAgWy9cIi9nLCAnJnF1b3Q7J10sXG4gIFsvJy9nLCAnJmFwb3M7J10sXG4gIFsvPC9nLCAnJmx0OyddLFxuICBbLz4vZywgJyZndDsnXSxcbl07XG5cbi8vIEVzY2FwZSBgX0VTQ0FQRURfQ0hBUlNgIGNoYXJhY3RlcnMgaW4gdGhlIGdpdmVuIHRleHQgd2l0aCBlbmNvZGVkIGVudGl0aWVzXG5leHBvcnQgZnVuY3Rpb24gZXNjYXBlWG1sKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBfRVNDQVBFRF9DSEFSUy5yZWR1Y2UoXG4gICAgICAodGV4dDogc3RyaW5nLCBlbnRyeTogW1JlZ0V4cCwgc3RyaW5nXSkgPT4gdGV4dC5yZXBsYWNlKGVudHJ5WzBdLCBlbnRyeVsxXSksIHRleHQpO1xufVxuIl19
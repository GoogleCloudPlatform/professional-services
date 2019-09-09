/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { extractMessages } from './extractor_merger';
import * as i18n from './i18n_ast';
/**
 * A container for message extracted from the templates.
 */
var MessageBundle = /** @class */ (function () {
    function MessageBundle(_htmlParser, _implicitTags, _implicitAttrs, _locale) {
        if (_locale === void 0) { _locale = null; }
        this._htmlParser = _htmlParser;
        this._implicitTags = _implicitTags;
        this._implicitAttrs = _implicitAttrs;
        this._locale = _locale;
        this._messages = [];
    }
    MessageBundle.prototype.updateFromTemplate = function (html, url, interpolationConfig) {
        var _a;
        var htmlParserResult = this._htmlParser.parse(html, url, true, interpolationConfig);
        if (htmlParserResult.errors.length) {
            return htmlParserResult.errors;
        }
        var i18nParserResult = extractMessages(htmlParserResult.rootNodes, interpolationConfig, this._implicitTags, this._implicitAttrs);
        if (i18nParserResult.errors.length) {
            return i18nParserResult.errors;
        }
        (_a = this._messages).push.apply(_a, tslib_1.__spread(i18nParserResult.messages));
        return [];
    };
    // Return the message in the internal format
    // The public (serialized) format might be different, see the `write` method.
    MessageBundle.prototype.getMessages = function () { return this._messages; };
    MessageBundle.prototype.write = function (serializer, filterSources) {
        var messages = {};
        var mapperVisitor = new MapPlaceholderNames();
        // Deduplicate messages based on their ID
        this._messages.forEach(function (message) {
            var _a;
            var id = serializer.digest(message);
            if (!messages.hasOwnProperty(id)) {
                messages[id] = message;
            }
            else {
                (_a = messages[id].sources).push.apply(_a, tslib_1.__spread(message.sources));
            }
        });
        // Transform placeholder names using the serializer mapping
        var msgList = Object.keys(messages).map(function (id) {
            var mapper = serializer.createNameMapper(messages[id]);
            var src = messages[id];
            var nodes = mapper ? mapperVisitor.convert(src.nodes, mapper) : src.nodes;
            var transformedMessage = new i18n.Message(nodes, {}, {}, src.meaning, src.description, id);
            transformedMessage.sources = src.sources;
            if (filterSources) {
                transformedMessage.sources.forEach(function (source) { return source.filePath = filterSources(source.filePath); });
            }
            return transformedMessage;
        });
        return serializer.write(msgList, this._locale);
    };
    return MessageBundle;
}());
export { MessageBundle };
// Transform an i18n AST by renaming the placeholder nodes with the given mapper
var MapPlaceholderNames = /** @class */ (function (_super) {
    tslib_1.__extends(MapPlaceholderNames, _super);
    function MapPlaceholderNames() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MapPlaceholderNames.prototype.convert = function (nodes, mapper) {
        var _this = this;
        return mapper ? nodes.map(function (n) { return n.visit(_this, mapper); }) : nodes;
    };
    MapPlaceholderNames.prototype.visitTagPlaceholder = function (ph, mapper) {
        var _this = this;
        var startName = mapper.toPublicName(ph.startName);
        var closeName = ph.closeName ? mapper.toPublicName(ph.closeName) : ph.closeName;
        var children = ph.children.map(function (n) { return n.visit(_this, mapper); });
        return new i18n.TagPlaceholder(ph.tag, ph.attrs, startName, closeName, children, ph.isVoid, ph.sourceSpan);
    };
    MapPlaceholderNames.prototype.visitPlaceholder = function (ph, mapper) {
        return new i18n.Placeholder(ph.value, mapper.toPublicName(ph.name), ph.sourceSpan);
    };
    MapPlaceholderNames.prototype.visitIcuPlaceholder = function (ph, mapper) {
        return new i18n.IcuPlaceholder(ph.value, mapper.toPublicName(ph.name), ph.sourceSpan);
    };
    return MapPlaceholderNames;
}(i18n.CloneVisitor));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVzc2FnZV9idW5kbGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci9zcmMvaTE4bi9tZXNzYWdlX2J1bmRsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBTUgsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ25ELE9BQU8sS0FBSyxJQUFJLE1BQU0sWUFBWSxDQUFDO0FBSW5DOztHQUVHO0FBQ0g7SUFHRSx1QkFDWSxXQUF1QixFQUFVLGFBQXVCLEVBQ3hELGNBQXVDLEVBQVUsT0FBMkI7UUFBM0Isd0JBQUEsRUFBQSxjQUEyQjtRQUQ1RSxnQkFBVyxHQUFYLFdBQVcsQ0FBWTtRQUFVLGtCQUFhLEdBQWIsYUFBYSxDQUFVO1FBQ3hELG1CQUFjLEdBQWQsY0FBYyxDQUF5QjtRQUFVLFlBQU8sR0FBUCxPQUFPLENBQW9CO1FBSmhGLGNBQVMsR0FBbUIsRUFBRSxDQUFDO0lBSW9ELENBQUM7SUFFNUYsMENBQWtCLEdBQWxCLFVBQW1CLElBQVksRUFBRSxHQUFXLEVBQUUsbUJBQXdDOztRQUVwRixJQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLG1CQUFtQixDQUFDLENBQUM7UUFFdEYsSUFBSSxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO1lBQ2xDLE9BQU8sZ0JBQWdCLENBQUMsTUFBTSxDQUFDO1NBQ2hDO1FBRUQsSUFBTSxnQkFBZ0IsR0FBRyxlQUFlLENBQ3BDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxtQkFBbUIsRUFBRSxJQUFJLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUU5RixJQUFJLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7WUFDbEMsT0FBTyxn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bEQiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SHRtbFBhcnNlcn0gZnJvbSAnLi4vbWxfcGFyc2VyL2h0bWxfcGFyc2VyJztcbmltcG9ydCB7SW50ZXJwb2xhdGlvbkNvbmZpZ30gZnJvbSAnLi4vbWxfcGFyc2VyL2ludGVycG9sYXRpb25fY29uZmlnJztcbmltcG9ydCB7UGFyc2VFcnJvcn0gZnJvbSAnLi4vcGFyc2VfdXRpbCc7XG5cbmltcG9ydCB7ZXh0cmFjdE1lc3NhZ2VzfSBmcm9tICcuL2V4dHJhY3Rvcl9tZXJnZXInO1xuaW1wb3J0ICogYXMgaTE4biBmcm9tICcuL2kxOG5fYXN0JztcbmltcG9ydCB7UGxhY2Vob2xkZXJNYXBwZXIsIFNlcmlhbGl6ZXJ9IGZyb20gJy4vc2VyaWFsaXplcnMvc2VyaWFsaXplcic7XG5cblxuLyoqXG4gKiBBIGNvbnRhaW5lciBmb3IgbWVzc2FnZSBleHRyYWN0ZWQgZnJvbSB0aGUgdGVtcGxhdGVzLlxuICovXG5leHBvcnQgY2xhc3MgTWVzc2FnZUJ1bmRsZSB7XG4gIHByaXZhdGUgX21lc3NhZ2VzOiBpMThuLk1lc3NhZ2VbXSA9IFtdO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBfaHRtbFBhcnNlcjogSHRtbFBhcnNlciwgcHJpdmF0ZSBfaW1wbGljaXRUYWdzOiBzdHJpbmdbXSxcbiAgICAgIHByaXZhdGUgX2ltcGxpY2l0QXR0cnM6IHtbazogc3RyaW5nXTogc3RyaW5nW119LCBwcml2YXRlIF9sb2NhbGU6IHN0cmluZ3xudWxsID0gbnVsbCkge31cblxuICB1cGRhdGVGcm9tVGVtcGxhdGUoaHRtbDogc3RyaW5nLCB1cmw6IHN0cmluZywgaW50ZXJwb2xhdGlvbkNvbmZpZzogSW50ZXJwb2xhdGlvbkNvbmZpZyk6XG4gICAgICBQYXJzZUVycm9yW10ge1xuICAgIGNvbnN0IGh0bWxQYXJzZXJSZXN1bHQgPSB0aGlzLl9odG1sUGFyc2VyLnBhcnNlKGh0bWwsIHVybCwgdHJ1ZSwgaW50ZXJwb2xhdGlvbkNvbmZpZyk7XG5cbiAgICBpZiAoaHRtbFBhcnNlclJlc3VsdC5lcnJvcnMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gaHRtbFBhcnNlclJlc3VsdC5lcnJvcnM7XG4gICAgfVxuXG4gICAgY29uc3QgaTE4blBhcnNlclJlc3VsdCA9IGV4dHJhY3RNZXNzYWdlcyhcbiAgICAgICAgaHRtbFBhcnNlclJlc3VsdC5yb290Tm9kZXMsIGludGVycG9sYXRpb25Db25maWcsIHRoaXMuX2ltcGxpY2l0VGFncywgdGhpcy5faW1wbGljaXRBdHRycyk7XG5cbiAgICBpZiAoaTE4blBhcnNlclJlc3VsdC5lcnJvcnMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gaTE4blBhcnNlclJlc3VsdC5lcnJvcnM7XG4gICAgfVxuXG4gICAgdGhpcy5fbWVzc2FnZXMucHVzaCguLi5pMThuUGFyc2VyUmVzdWx0Lm1lc3NhZ2VzKTtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICAvLyBSZXR1cm4gdGhlIG1lc3NhZ2UgaW4gdGhlIGludGVybmFsIGZvcm1hdFxuICAvLyBUaGUgcHVibGljIChzZXJpYWxpemVkKSBmb3JtYXQgbWlnaHQgYmUgZGlmZmVyZW50LCBzZWUgdGhlIGB3cml0ZWAgbWV0aG9kLlxuICBnZXRNZXNzYWdlcygpOiBpMThuLk1lc3NhZ2VbXSB7IHJldHVybiB0aGlzLl9tZXNzYWdlczsgfVxuXG4gIHdyaXRlKHNlcmlhbGl6ZXI6IFNlcmlhbGl6ZXIsIGZpbHRlclNvdXJjZXM/OiAocGF0aDogc3RyaW5nKSA9PiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IG1lc3NhZ2VzOiB7W2lkOiBzdHJpbmddOiBpMThuLk1lc3NhZ2V9ID0ge307XG4gICAgY29uc3QgbWFwcGVyVmlzaXRvciA9IG5ldyBNYXBQbGFjZWhvbGRlck5hbWVzKCk7XG5cbiAgICAvLyBEZWR1cGxpY2F0ZSBtZXNzYWdlcyBiYXNlZCBvbiB0aGVpciBJRFxuICAgIHRoaXMuX21lc3NhZ2VzLmZvckVhY2gobWVzc2FnZSA9PiB7XG4gICAgICBjb25zdCBpZCA9IHNlcmlhbGl6ZXIuZGlnZXN0KG1lc3NhZ2UpO1xuICAgICAgaWYgKCFtZXNzYWdlcy5oYXNPd25Qcm9wZXJ0eShpZCkpIHtcbiAgICAgICAgbWVzc2FnZXNbaWRdID0gbWVzc2FnZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1lc3NhZ2VzW2lkXS5zb3VyY2VzLnB1c2goLi4ubWVzc2FnZS5zb3VyY2VzKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFRyYW5zZm9ybSBwbGFjZWhvbGRlciBuYW1lcyB1c2luZyB0aGUgc2VyaWFsaXplciBtYXBwaW5nXG4gICAgY29uc3QgbXNnTGlzdCA9IE9iamVjdC5rZXlzKG1lc3NhZ2VzKS5tYXAoaWQgPT4ge1xuICAgICAgY29uc3QgbWFwcGVyID0gc2VyaWFsaXplci5jcmVhdGVOYW1lTWFwcGVyKG1lc3NhZ2VzW2lkXSk7XG4gICAgICBjb25zdCBzcmMgPSBtZXNzYWdlc1tpZF07XG4gICAgICBjb25zdCBub2RlcyA9IG1hcHBlciA/IG1hcHBlclZpc2l0b3IuY29udmVydChzcmMubm9kZXMsIG1hcHBlcikgOiBzcmMubm9kZXM7XG4gICAgICBsZXQgdHJhbnNmb3JtZWRNZXNzYWdlID0gbmV3IGkxOG4uTWVzc2FnZShub2Rlcywge30sIHt9LCBzcmMubWVhbmluZywgc3JjLmRlc2NyaXB0aW9uLCBpZCk7XG4gICAgICB0cmFuc2Zvcm1lZE1lc3NhZ2Uuc291cmNlcyA9IHNyYy5zb3VyY2VzO1xuICAgICAgaWYgKGZpbHRlclNvdXJjZXMpIHtcbiAgICAgICAgdHJhbnNmb3JtZWRNZXNzYWdlLnNvdXJjZXMuZm9yRWFjaChcbiAgICAgICAgICAgIChzb3VyY2U6IGkxOG4uTWVzc2FnZVNwYW4pID0+IHNvdXJjZS5maWxlUGF0aCA9IGZpbHRlclNvdXJjZXMoc291cmNlLmZpbGVQYXRoKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJhbnNmb3JtZWRNZXNzYWdlO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHNlcmlhbGl6ZXIud3JpdGUobXNnTGlzdCwgdGhpcy5fbG9jYWxlKTtcbiAgfVxufVxuXG4vLyBUcmFuc2Zvcm0gYW4gaTE4biBBU1QgYnkgcmVuYW1pbmcgdGhlIHBsYWNlaG9sZGVyIG5vZGVzIHdpdGggdGhlIGdpdmVuIG1hcHBlclxuY2xhc3MgTWFwUGxhY2Vob2xkZXJOYW1lcyBleHRlbmRzIGkxOG4uQ2xvbmVWaXNpdG9yIHtcbiAgY29udmVydChub2RlczogaTE4bi5Ob2RlW10sIG1hcHBlcjogUGxhY2Vob2xkZXJNYXBwZXIpOiBpMThuLk5vZGVbXSB7XG4gICAgcmV0dXJuIG1hcHBlciA/IG5vZGVzLm1hcChuID0+IG4udmlzaXQodGhpcywgbWFwcGVyKSkgOiBub2RlcztcbiAgfVxuXG4gIHZpc2l0VGFnUGxhY2Vob2xkZXIocGg6IGkxOG4uVGFnUGxhY2Vob2xkZXIsIG1hcHBlcjogUGxhY2Vob2xkZXJNYXBwZXIpOiBpMThuLlRhZ1BsYWNlaG9sZGVyIHtcbiAgICBjb25zdCBzdGFydE5hbWUgPSBtYXBwZXIudG9QdWJsaWNOYW1lKHBoLnN0YXJ0TmFtZSkgITtcbiAgICBjb25zdCBjbG9zZU5hbWUgPSBwaC5jbG9zZU5hbWUgPyBtYXBwZXIudG9QdWJsaWNOYW1lKHBoLmNsb3NlTmFtZSkgISA6IHBoLmNsb3NlTmFtZTtcbiAgICBjb25zdCBjaGlsZHJlbiA9IHBoLmNoaWxkcmVuLm1hcChuID0+IG4udmlzaXQodGhpcywgbWFwcGVyKSk7XG4gICAgcmV0dXJuIG5ldyBpMThuLlRhZ1BsYWNlaG9sZGVyKFxuICAgICAgICBwaC50YWcsIHBoLmF0dHJzLCBzdGFydE5hbWUsIGNsb3NlTmFtZSwgY2hpbGRyZW4sIHBoLmlzVm9pZCwgcGguc291cmNlU3Bhbik7XG4gIH1cblxuICB2aXNpdFBsYWNlaG9sZGVyKHBoOiBpMThuLlBsYWNlaG9sZGVyLCBtYXBwZXI6IFBsYWNlaG9sZGVyTWFwcGVyKTogaTE4bi5QbGFjZWhvbGRlciB7XG4gICAgcmV0dXJuIG5ldyBpMThuLlBsYWNlaG9sZGVyKHBoLnZhbHVlLCBtYXBwZXIudG9QdWJsaWNOYW1lKHBoLm5hbWUpICEsIHBoLnNvdXJjZVNwYW4pO1xuICB9XG5cbiAgdmlzaXRJY3VQbGFjZWhvbGRlcihwaDogaTE4bi5JY3VQbGFjZWhvbGRlciwgbWFwcGVyOiBQbGFjZWhvbGRlck1hcHBlcik6IGkxOG4uSWN1UGxhY2Vob2xkZXIge1xuICAgIHJldHVybiBuZXcgaTE4bi5JY3VQbGFjZWhvbGRlcihwaC52YWx1ZSwgbWFwcGVyLnRvUHVibGljTmFtZShwaC5uYW1lKSAhLCBwaC5zb3VyY2VTcGFuKTtcbiAgfVxufVxuIl19
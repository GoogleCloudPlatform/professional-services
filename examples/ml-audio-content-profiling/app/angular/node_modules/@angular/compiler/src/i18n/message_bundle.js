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
        define("@angular/compiler/src/i18n/message_bundle", ["require", "exports", "tslib", "@angular/compiler/src/i18n/extractor_merger", "@angular/compiler/src/i18n/i18n_ast"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var extractor_merger_1 = require("@angular/compiler/src/i18n/extractor_merger");
    var i18n = require("@angular/compiler/src/i18n/i18n_ast");
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
            var i18nParserResult = extractor_merger_1.extractMessages(htmlParserResult.rootNodes, interpolationConfig, this._implicitTags, this._implicitAttrs);
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
    exports.MessageBundle = MessageBundle;
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
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVzc2FnZV9idW5kbGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci9zcmMvaTE4bi9tZXNzYWdlX2J1bmRsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFNSCxnRkFBbUQ7SUFDbkQsMERBQW1DO0lBSW5DOztPQUVHO0lBQ0g7UUFHRSx1QkFDWSxXQUF1QixFQUFVLGFBQXVCLEVBQ3hELGNBQXVDLEVBQVUsT0FBMkI7WUFBM0Isd0JBQUEsRUFBQSxjQUEyQjtZQUQ1RSxnQkFBVyxHQUFYLFdBQVcsQ0FBWTtZQUFVLGtCQUFhLEdBQWIsYUFBYSxDQUFVO1lBQ3hELG1CQUFjLEdBQWQsY0FBYyxDQUF5QjtZQUFVLFlBQU8sR0FBUCxPQUFPLENBQW9CO1lBSmhGLGNBQVMsR0FBbUIsRUFBRSxDQUFDO1FBSW9ELENBQUM7UUFFNUYsMENBQWtCLEdBQWxCLFVBQW1CLElBQVksRUFBRSxHQUFXLEVBQUUsbUJBQXdDOztZQUVwRixJQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLG1CQUFtQixDQUFDLENBQUM7WUFFdEYsSUFBSSxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO2dCQUNsQyxPQUFPLGdCQUFnQixDQUFDLE1BQU0sQ0FBQzthQUNoQztZQUVELElBQU0sZ0JBQWdCLEdBQUcsa0NBQWUsQ0FDcEMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLG1CQUFtQixFQUFFLElBQUksQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBRTlGLElBQUksZ0JBQWdCLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRTtnQkFDbEMsT0FBTyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUM7YUFDaEM7WUFFRCxDQUFBLEtBQUEsSUFBSSxD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LyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0h0bWxQYXJzZXJ9IGZyb20gJy4uL21sX3BhcnNlci9odG1sX3BhcnNlcic7XG5pbXBvcnQge0ludGVycG9sYXRpb25Db25maWd9IGZyb20gJy4uL21sX3BhcnNlci9pbnRlcnBvbGF0aW9uX2NvbmZpZyc7XG5pbXBvcnQge1BhcnNlRXJyb3J9IGZyb20gJy4uL3BhcnNlX3V0aWwnO1xuXG5pbXBvcnQge2V4dHJhY3RNZXNzYWdlc30gZnJvbSAnLi9leHRyYWN0b3JfbWVyZ2VyJztcbmltcG9ydCAqIGFzIGkxOG4gZnJvbSAnLi9pMThuX2FzdCc7XG5pbXBvcnQge1BsYWNlaG9sZGVyTWFwcGVyLCBTZXJpYWxpemVyfSBmcm9tICcuL3NlcmlhbGl6ZXJzL3NlcmlhbGl6ZXInO1xuXG5cbi8qKlxuICogQSBjb250YWluZXIgZm9yIG1lc3NhZ2UgZXh0cmFjdGVkIGZyb20gdGhlIHRlbXBsYXRlcy5cbiAqL1xuZXhwb3J0IGNsYXNzIE1lc3NhZ2VCdW5kbGUge1xuICBwcml2YXRlIF9tZXNzYWdlczogaTE4bi5NZXNzYWdlW10gPSBbXTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgX2h0bWxQYXJzZXI6IEh0bWxQYXJzZXIsIHByaXZhdGUgX2ltcGxpY2l0VGFnczogc3RyaW5nW10sXG4gICAgICBwcml2YXRlIF9pbXBsaWNpdEF0dHJzOiB7W2s6IHN0cmluZ106IHN0cmluZ1tdfSwgcHJpdmF0ZSBfbG9jYWxlOiBzdHJpbmd8bnVsbCA9IG51bGwpIHt9XG5cbiAgdXBkYXRlRnJvbVRlbXBsYXRlKGh0bWw6IHN0cmluZywgdXJsOiBzdHJpbmcsIGludGVycG9sYXRpb25Db25maWc6IEludGVycG9sYXRpb25Db25maWcpOlxuICAgICAgUGFyc2VFcnJvcltdIHtcbiAgICBjb25zdCBodG1sUGFyc2VyUmVzdWx0ID0gdGhpcy5faHRtbFBhcnNlci5wYXJzZShodG1sLCB1cmwsIHRydWUsIGludGVycG9sYXRpb25Db25maWcpO1xuXG4gICAgaWYgKGh0bWxQYXJzZXJSZXN1bHQuZXJyb3JzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIGh0bWxQYXJzZXJSZXN1bHQuZXJyb3JzO1xuICAgIH1cblxuICAgIGNvbnN0IGkxOG5QYXJzZXJSZXN1bHQgPSBleHRyYWN0TWVzc2FnZXMoXG4gICAgICAgIGh0bWxQYXJzZXJSZXN1bHQucm9vdE5vZGVzLCBpbnRlcnBvbGF0aW9uQ29uZmlnLCB0aGlzLl9pbXBsaWNpdFRhZ3MsIHRoaXMuX2ltcGxpY2l0QXR0cnMpO1xuXG4gICAgaWYgKGkxOG5QYXJzZXJSZXN1bHQuZXJyb3JzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIGkxOG5QYXJzZXJSZXN1bHQuZXJyb3JzO1xuICAgIH1cblxuICAgIHRoaXMuX21lc3NhZ2VzLnB1c2goLi4uaTE4blBhcnNlclJlc3VsdC5tZXNzYWdlcyk7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgLy8gUmV0dXJuIHRoZSBtZXNzYWdlIGluIHRoZSBpbnRlcm5hbCBmb3JtYXRcbiAgLy8gVGhlIHB1YmxpYyAoc2VyaWFsaXplZCkgZm9ybWF0IG1pZ2h0IGJlIGRpZmZlcmVudCwgc2VlIHRoZSBgd3JpdGVgIG1ldGhvZC5cbiAgZ2V0TWVzc2FnZXMoKTogaTE4bi5NZXNzYWdlW10geyByZXR1cm4gdGhpcy5fbWVzc2FnZXM7IH1cblxuICB3cml0ZShzZXJpYWxpemVyOiBTZXJpYWxpemVyLCBmaWx0ZXJTb3VyY2VzPzogKHBhdGg6IHN0cmluZykgPT4gc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBtZXNzYWdlczoge1tpZDogc3RyaW5nXTogaTE4bi5NZXNzYWdlfSA9IHt9O1xuICAgIGNvbnN0IG1hcHBlclZpc2l0b3IgPSBuZXcgTWFwUGxhY2Vob2xkZXJOYW1lcygpO1xuXG4gICAgLy8gRGVkdXBsaWNhdGUgbWVzc2FnZXMgYmFzZWQgb24gdGhlaXIgSURcbiAgICB0aGlzLl9tZXNzYWdlcy5mb3JFYWNoKG1lc3NhZ2UgPT4ge1xuICAgICAgY29uc3QgaWQgPSBzZXJpYWxpemVyLmRpZ2VzdChtZXNzYWdlKTtcbiAgICAgIGlmICghbWVzc2FnZXMuaGFzT3duUHJvcGVydHkoaWQpKSB7XG4gICAgICAgIG1lc3NhZ2VzW2lkXSA9IG1lc3NhZ2U7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtZXNzYWdlc1tpZF0uc291cmNlcy5wdXNoKC4uLm1lc3NhZ2Uuc291cmNlcyk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBUcmFuc2Zvcm0gcGxhY2Vob2xkZXIgbmFtZXMgdXNpbmcgdGhlIHNlcmlhbGl6ZXIgbWFwcGluZ1xuICAgIGNvbnN0IG1zZ0xpc3QgPSBPYmplY3Qua2V5cyhtZXNzYWdlcykubWFwKGlkID0+IHtcbiAgICAgIGNvbnN0IG1hcHBlciA9IHNlcmlhbGl6ZXIuY3JlYXRlTmFtZU1hcHBlcihtZXNzYWdlc1tpZF0pO1xuICAgICAgY29uc3Qgc3JjID0gbWVzc2FnZXNbaWRdO1xuICAgICAgY29uc3Qgbm9kZXMgPSBtYXBwZXIgPyBtYXBwZXJWaXNpdG9yLmNvbnZlcnQoc3JjLm5vZGVzLCBtYXBwZXIpIDogc3JjLm5vZGVzO1xuICAgICAgbGV0IHRyYW5zZm9ybWVkTWVzc2FnZSA9IG5ldyBpMThuLk1lc3NhZ2Uobm9kZXMsIHt9LCB7fSwgc3JjLm1lYW5pbmcsIHNyYy5kZXNjcmlwdGlvbiwgaWQpO1xuICAgICAgdHJhbnNmb3JtZWRNZXNzYWdlLnNvdXJjZXMgPSBzcmMuc291cmNlcztcbiAgICAgIGlmIChmaWx0ZXJTb3VyY2VzKSB7XG4gICAgICAgIHRyYW5zZm9ybWVkTWVzc2FnZS5zb3VyY2VzLmZvckVhY2goXG4gICAgICAgICAgICAoc291cmNlOiBpMThuLk1lc3NhZ2VTcGFuKSA9PiBzb3VyY2UuZmlsZVBhdGggPSBmaWx0ZXJTb3VyY2VzKHNvdXJjZS5maWxlUGF0aCkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRyYW5zZm9ybWVkTWVzc2FnZTtcbiAgICB9KTtcblxuICAgIHJldHVybiBzZXJpYWxpemVyLndyaXRlKG1zZ0xpc3QsIHRoaXMuX2xvY2FsZSk7XG4gIH1cbn1cblxuLy8gVHJhbnNmb3JtIGFuIGkxOG4gQVNUIGJ5IHJlbmFtaW5nIHRoZSBwbGFjZWhvbGRlciBub2RlcyB3aXRoIHRoZSBnaXZlbiBtYXBwZXJcbmNsYXNzIE1hcFBsYWNlaG9sZGVyTmFtZXMgZXh0ZW5kcyBpMThuLkNsb25lVmlzaXRvciB7XG4gIGNvbnZlcnQobm9kZXM6IGkxOG4uTm9kZVtdLCBtYXBwZXI6IFBsYWNlaG9sZGVyTWFwcGVyKTogaTE4bi5Ob2RlW10ge1xuICAgIHJldHVybiBtYXBwZXIgPyBub2Rlcy5tYXAobiA9PiBuLnZpc2l0KHRoaXMsIG1hcHBlcikpIDogbm9kZXM7XG4gIH1cblxuICB2aXNpdFRhZ1BsYWNlaG9sZGVyKHBoOiBpMThuLlRhZ1BsYWNlaG9sZGVyLCBtYXBwZXI6IFBsYWNlaG9sZGVyTWFwcGVyKTogaTE4bi5UYWdQbGFjZWhvbGRlciB7XG4gICAgY29uc3Qgc3RhcnROYW1lID0gbWFwcGVyLnRvUHVibGljTmFtZShwaC5zdGFydE5hbWUpICE7XG4gICAgY29uc3QgY2xvc2VOYW1lID0gcGguY2xvc2VOYW1lID8gbWFwcGVyLnRvUHVibGljTmFtZShwaC5jbG9zZU5hbWUpICEgOiBwaC5jbG9zZU5hbWU7XG4gICAgY29uc3QgY2hpbGRyZW4gPSBwaC5jaGlsZHJlbi5tYXAobiA9PiBuLnZpc2l0KHRoaXMsIG1hcHBlcikpO1xuICAgIHJldHVybiBuZXcgaTE4bi5UYWdQbGFjZWhvbGRlcihcbiAgICAgICAgcGgudGFnLCBwaC5hdHRycywgc3RhcnROYW1lLCBjbG9zZU5hbWUsIGNoaWxkcmVuLCBwaC5pc1ZvaWQsIHBoLnNvdXJjZVNwYW4pO1xuICB9XG5cbiAgdmlzaXRQbGFjZWhvbGRlcihwaDogaTE4bi5QbGFjZWhvbGRlciwgbWFwcGVyOiBQbGFjZWhvbGRlck1hcHBlcik6IGkxOG4uUGxhY2Vob2xkZXIge1xuICAgIHJldHVybiBuZXcgaTE4bi5QbGFjZWhvbGRlcihwaC52YWx1ZSwgbWFwcGVyLnRvUHVibGljTmFtZShwaC5uYW1lKSAhLCBwaC5zb3VyY2VTcGFuKTtcbiAgfVxuXG4gIHZpc2l0SWN1UGxhY2Vob2xkZXIocGg6IGkxOG4uSWN1UGxhY2Vob2xkZXIsIG1hcHBlcjogUGxhY2Vob2xkZXJNYXBwZXIpOiBpMThuLkljdVBsYWNlaG9sZGVyIHtcbiAgICByZXR1cm4gbmV3IGkxOG4uSWN1UGxhY2Vob2xkZXIocGgudmFsdWUsIG1hcHBlci50b1B1YmxpY05hbWUocGgubmFtZSkgISwgcGguc291cmNlU3Bhbik7XG4gIH1cbn1cbiJdfQ==
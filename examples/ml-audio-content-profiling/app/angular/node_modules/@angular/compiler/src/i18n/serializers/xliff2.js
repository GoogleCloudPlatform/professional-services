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
        define("@angular/compiler/src/i18n/serializers/xliff2", ["require", "exports", "tslib", "@angular/compiler/src/ml_parser/ast", "@angular/compiler/src/ml_parser/xml_parser", "@angular/compiler/src/i18n/digest", "@angular/compiler/src/i18n/i18n_ast", "@angular/compiler/src/i18n/parse_util", "@angular/compiler/src/i18n/serializers/serializer", "@angular/compiler/src/i18n/serializers/xml_helper"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var ml = require("@angular/compiler/src/ml_parser/ast");
    var xml_parser_1 = require("@angular/compiler/src/ml_parser/xml_parser");
    var digest_1 = require("@angular/compiler/src/i18n/digest");
    var i18n = require("@angular/compiler/src/i18n/i18n_ast");
    var parse_util_1 = require("@angular/compiler/src/i18n/parse_util");
    var serializer_1 = require("@angular/compiler/src/i18n/serializers/serializer");
    var xml = require("@angular/compiler/src/i18n/serializers/xml_helper");
    var _VERSION = '2.0';
    var _XMLNS = 'urn:oasis:names:tc:xliff:document:2.0';
    // TODO(vicb): make this a param (s/_/-/)
    var _DEFAULT_SOURCE_LANG = 'en';
    var _PLACEHOLDER_TAG = 'ph';
    var _PLACEHOLDER_SPANNING_TAG = 'pc';
    var _MARKER_TAG = 'mrk';
    var _XLIFF_TAG = 'xliff';
    var _SOURCE_TAG = 'source';
    var _TARGET_TAG = 'target';
    var _UNIT_TAG = 'unit';
    // http://docs.oasis-open.org/xliff/xliff-core/v2.0/os/xliff-core-v2.0-os.html
    var Xliff2 = /** @class */ (function (_super) {
        tslib_1.__extends(Xliff2, _super);
        function Xliff2() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Xliff2.prototype.write = function (messages, locale) {
            var visitor = new _WriteVisitor();
            var units = [];
            messages.forEach(function (message) {
                var unit = new xml.Tag(_UNIT_TAG, { id: message.id });
                var notes = new xml.Tag('notes');
                if (message.description || message.meaning) {
                    if (message.description) {
                        notes.children.push(new xml.CR(8), new xml.Tag('note', { category: 'description' }, [new xml.Text(message.description)]));
                    }
                    if (message.meaning) {
                        notes.children.push(new xml.CR(8), new xml.Tag('note', { category: 'meaning' }, [new xml.Text(message.meaning)]));
                    }
                }
                message.sources.forEach(function (source) {
                    notes.children.push(new xml.CR(8), new xml.Tag('note', { category: 'location' }, [
                        new xml.Text(source.filePath + ":" + source.startLine + (source.endLine !== source.startLine ? ',' + source.endLine : ''))
                    ]));
                });
                notes.children.push(new xml.CR(6));
                unit.children.push(new xml.CR(6), notes);
                var segment = new xml.Tag('segment');
                segment.children.push(new xml.CR(8), new xml.Tag(_SOURCE_TAG, {}, visitor.serialize(message.nodes)), new xml.CR(6));
                unit.children.push(new xml.CR(6), segment, new xml.CR(4));
                units.push(new xml.CR(4), unit);
            });
            var file = new xml.Tag('file', { 'original': 'ng.template', id: 'ngi18n' }, tslib_1.__spread(units, [new xml.CR(2)]));
            var xliff = new xml.Tag(_XLIFF_TAG, { version: _VERSION, xmlns: _XMLNS, srcLang: locale || _DEFAULT_SOURCE_LANG }, [new xml.CR(2), file, new xml.CR()]);
            return xml.serialize([
                new xml.Declaration({ version: '1.0', encoding: 'UTF-8' }), new xml.CR(), xliff, new xml.CR()
            ]);
        };
        Xliff2.prototype.load = function (content, url) {
            // xliff to xml nodes
            var xliff2Parser = new Xliff2Parser();
            var _a = xliff2Parser.parse(content, url), locale = _a.locale, msgIdToHtml = _a.msgIdToHtml, errors = _a.errors;
            // xml nodes to i18n nodes
            var i18nNodesByMsgId = {};
            var converter = new XmlToI18n();
            Object.keys(msgIdToHtml).forEach(function (msgId) {
                var _a = converter.convert(msgIdToHtml[msgId], url), i18nNodes = _a.i18nNodes, e = _a.errors;
                errors.push.apply(errors, tslib_1.__spread(e));
                i18nNodesByMsgId[msgId] = i18nNodes;
            });
            if (errors.length) {
                throw new Error("xliff2 parse errors:\n" + errors.join('\n'));
            }
            return { locale: locale, i18nNodesByMsgId: i18nNodesByMsgId };
        };
        Xliff2.prototype.digest = function (message) { return digest_1.decimalDigest(message); };
        return Xliff2;
    }(serializer_1.Serializer));
    exports.Xliff2 = Xliff2;
    var _WriteVisitor = /** @class */ (function () {
        function _WriteVisitor() {
        }
        _WriteVisitor.prototype.visitText = function (text, context) { return [new xml.Text(text.value)]; };
        _WriteVisitor.prototype.visitContainer = function (container, context) {
            var _this = this;
            var nodes = [];
            container.children.forEach(function (node) { return nodes.push.apply(nodes, tslib_1.__spread(node.visit(_this))); });
            return nodes;
        };
        _WriteVisitor.prototype.visitIcu = function (icu, context) {
            var _this = this;
            var nodes = [new xml.Text("{" + icu.expressionPlaceholder + ", " + icu.type + ", ")];
            Object.keys(icu.cases).forEach(function (c) {
                nodes.push.apply(nodes, tslib_1.__spread([new xml.Text(c + " {")], icu.cases[c].visit(_this), [new xml.Text("} ")]));
            });
            nodes.push(new xml.Text("}"));
            return nodes;
        };
        _WriteVisitor.prototype.visitTagPlaceholder = function (ph, context) {
            var _this = this;
            var type = getTypeForTag(ph.tag);
            if (ph.isVoid) {
                var tagPh = new xml.Tag(_PLACEHOLDER_TAG, {
                    id: (this._nextPlaceholderId++).toString(),
                    equiv: ph.startName,
                    type: type,
                    disp: "<" + ph.tag + "/>",
                });
                return [tagPh];
            }
            var tagPc = new xml.Tag(_PLACEHOLDER_SPANNING_TAG, {
                id: (this._nextPlaceholderId++).toString(),
                equivStart: ph.startName,
                equivEnd: ph.closeName,
                type: type,
                dispStart: "<" + ph.tag + ">",
                dispEnd: "</" + ph.tag + ">",
            });
            var nodes = [].concat.apply([], tslib_1.__spread(ph.children.map(function (node) { return node.visit(_this); })));
            if (nodes.length) {
                nodes.forEach(function (node) { return tagPc.children.push(node); });
            }
            else {
                tagPc.children.push(new xml.Text(''));
            }
            return [tagPc];
        };
        _WriteVisitor.prototype.visitPlaceholder = function (ph, context) {
            var idStr = (this._nextPlaceholderId++).toString();
            return [new xml.Tag(_PLACEHOLDER_TAG, {
                    id: idStr,
                    equiv: ph.name,
                    disp: "{{" + ph.value + "}}",
                })];
        };
        _WriteVisitor.prototype.visitIcuPlaceholder = function (ph, context) {
            var cases = Object.keys(ph.value.cases).map(function (value) { return value + ' {...}'; }).join(' ');
            var idStr = (this._nextPlaceholderId++).toString();
            return [new xml.Tag(_PLACEHOLDER_TAG, { id: idStr, equiv: ph.name, disp: "{" + ph.value.expression + ", " + ph.value.type + ", " + cases + "}" })];
        };
        _WriteVisitor.prototype.serialize = function (nodes) {
            var _this = this;
            this._nextPlaceholderId = 0;
            return [].concat.apply([], tslib_1.__spread(nodes.map(function (node) { return node.visit(_this); })));
        };
        return _WriteVisitor;
    }());
    // Extract messages as xml nodes from the xliff file
    var Xliff2Parser = /** @class */ (function () {
        function Xliff2Parser() {
            this._locale = null;
        }
        Xliff2Parser.prototype.parse = function (xliff, url) {
            this._unitMlString = null;
            this._msgIdToHtml = {};
            var xml = new xml_parser_1.XmlParser().parse(xliff, url, false);
            this._errors = xml.errors;
            ml.visitAll(this, xml.rootNodes, null);
            return {
                msgIdToHtml: this._msgIdToHtml,
                errors: this._errors,
                locale: this._locale,
            };
        };
        Xliff2Parser.prototype.visitElement = function (element, context) {
            switch (element.name) {
                case _UNIT_TAG:
                    this._unitMlString = null;
                    var idAttr = element.attrs.find(function (attr) { return attr.name === 'id'; });
                    if (!idAttr) {
                        this._addError(element, "<" + _UNIT_TAG + "> misses the \"id\" attribute");
                    }
                    else {
                        var id = idAttr.value;
                        if (this._msgIdToHtml.hasOwnProperty(id)) {
                            this._addError(element, "Duplicated translations for msg " + id);
                        }
                        else {
                            ml.visitAll(this, element.children, null);
                            if (typeof this._unitMlString === 'string') {
                                this._msgIdToHtml[id] = this._unitMlString;
                            }
                            else {
                                this._addError(element, "Message " + id + " misses a translation");
                            }
                        }
                    }
                    break;
                case _SOURCE_TAG:
                    // ignore source message
                    break;
                case _TARGET_TAG:
                    var innerTextStart = element.startSourceSpan.end.offset;
                    var innerTextEnd = element.endSourceSpan.start.offset;
                    var content = element.startSourceSpan.start.file.content;
                    var innerText = content.slice(innerTextStart, innerTextEnd);
                    this._unitMlString = innerText;
                    break;
                case _XLIFF_TAG:
                    var localeAttr = element.attrs.find(function (attr) { return attr.name === 'trgLang'; });
                    if (localeAttr) {
                        this._locale = localeAttr.value;
                    }
                    var versionAttr = element.attrs.find(function (attr) { return attr.name === 'version'; });
                    if (versionAttr) {
                        var version = versionAttr.value;
                        if (version !== '2.0') {
                            this._addError(element, "The XLIFF file version " + version + " is not compatible with XLIFF 2.0 serializer");
                        }
                        else {
                            ml.visitAll(this, element.children, null);
                        }
                    }
                    break;
                default:
                    ml.visitAll(this, element.children, null);
            }
        };
        Xliff2Parser.prototype.visitAttribute = function (attribute, context) { };
        Xliff2Parser.prototype.visitText = function (text, context) { };
        Xliff2Parser.prototype.visitComment = function (comment, context) { };
        Xliff2Parser.prototype.visitExpansion = function (expansion, context) { };
        Xliff2Parser.prototype.visitExpansionCase = function (expansionCase, context) { };
        Xliff2Parser.prototype._addError = function (node, message) {
            this._errors.push(new parse_util_1.I18nError(node.sourceSpan, message));
        };
        return Xliff2Parser;
    }());
    // Convert ml nodes (xliff syntax) to i18n nodes
    var XmlToI18n = /** @class */ (function () {
        function XmlToI18n() {
        }
        XmlToI18n.prototype.convert = function (message, url) {
            var xmlIcu = new xml_parser_1.XmlParser().parse(message, url, true);
            this._errors = xmlIcu.errors;
            var i18nNodes = this._errors.length > 0 || xmlIcu.rootNodes.length == 0 ?
                [] : [].concat.apply([], tslib_1.__spread(ml.visitAll(this, xmlIcu.rootNodes)));
            return {
                i18nNodes: i18nNodes,
                errors: this._errors,
            };
        };
        XmlToI18n.prototype.visitText = function (text, context) { return new i18n.Text(text.value, text.sourceSpan); };
        XmlToI18n.prototype.visitElement = function (el, context) {
            var _this = this;
            switch (el.name) {
                case _PLACEHOLDER_TAG:
                    var nameAttr = el.attrs.find(function (attr) { return attr.name === 'equiv'; });
                    if (nameAttr) {
                        return [new i18n.Placeholder('', nameAttr.value, el.sourceSpan)];
                    }
                    this._addError(el, "<" + _PLACEHOLDER_TAG + "> misses the \"equiv\" attribute");
                    break;
                case _PLACEHOLDER_SPANNING_TAG:
                    var startAttr = el.attrs.find(function (attr) { return attr.name === 'equivStart'; });
                    var endAttr = el.attrs.find(function (attr) { return attr.name === 'equivEnd'; });
                    if (!startAttr) {
                        this._addError(el, "<" + _PLACEHOLDER_TAG + "> misses the \"equivStart\" attribute");
                    }
                    else if (!endAttr) {
                        this._addError(el, "<" + _PLACEHOLDER_TAG + "> misses the \"equivEnd\" attribute");
                    }
                    else {
                        var startId = startAttr.value;
                        var endId = endAttr.value;
                        var nodes = [];
                        return nodes.concat.apply(nodes, tslib_1.__spread([new i18n.Placeholder('', startId, el.sourceSpan)], el.children.map(function (node) { return node.visit(_this, null); }), [new i18n.Placeholder('', endId, el.sourceSpan)]));
                    }
                    break;
                case _MARKER_TAG:
                    return [].concat.apply([], tslib_1.__spread(ml.visitAll(this, el.children)));
                default:
                    this._addError(el, "Unexpected tag");
            }
            return null;
        };
        XmlToI18n.prototype.visitExpansion = function (icu, context) {
            var caseMap = {};
            ml.visitAll(this, icu.cases).forEach(function (c) {
                caseMap[c.value] = new i18n.Container(c.nodes, icu.sourceSpan);
            });
            return new i18n.Icu(icu.switchValue, icu.type, caseMap, icu.sourceSpan);
        };
        XmlToI18n.prototype.visitExpansionCase = function (icuCase, context) {
            return {
                value: icuCase.value,
                nodes: [].concat.apply([], tslib_1.__spread(ml.visitAll(this, icuCase.expression))),
            };
        };
        XmlToI18n.prototype.visitComment = function (comment, context) { };
        XmlToI18n.prototype.visitAttribute = function (attribute, context) { };
        XmlToI18n.prototype._addError = function (node, message) {
            this._errors.push(new parse_util_1.I18nError(node.sourceSpan, message));
        };
        return XmlToI18n;
    }());
    function getTypeForTag(tag) {
        switch (tag.toLowerCase()) {
            case 'br':
            case 'b':
            case 'i':
            case 'u':
                return 'fmt';
            case 'img':
                return 'image';
            case 'a':
                return 'link';
            default:
                return 'other';
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieGxpZmYyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXIvc3JjL2kxOG4vc2VyaWFsaXplcnMveGxpZmYyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILHdEQUEwQztJQUMxQyx5RUFBcUQ7SUFDckQsNERBQXdDO0lBQ3hDLDBEQUFvQztJQUNwQyxvRUFBd0M7SUFFeEMsZ0ZBQXdDO0lBQ3hDLHVFQUFvQztJQUVwQyxJQUFNLFFBQVEsR0FBRyxLQUFLLENBQUM7SUFDdkIsSUFBTSxNQUFNLEdBQUcsdUNBQXVDLENBQUM7SUFDdkQseUNBQXlDO0lBQ3pDLElBQU0sb0JBQW9CLEdBQUcsSUFBSSxDQUFDO0lBQ2xDLElBQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO0lBQzlCLElBQU0seUJBQXlCLEdBQUcsSUFBSSxDQUFDO0lBQ3ZDLElBQU0sV0FBVyxHQUFHLEtBQUssQ0FBQztJQUUxQixJQUFNLFVBQVUsR0FBRyxPQUFPLENBQUM7SUFDM0IsSUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDO0lBQzdCLElBQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQztJQUM3QixJQUFNLFNBQVMsR0FBRyxNQUFNLENBQUM7SUFFekIsOEVBQThFO0lBQzlFO1FBQTRCLGtDQUFVO1FBQXRDOztRQWdGQSxDQUFDO1FBL0VDLHNCQUFLLEdBQUwsVUFBTSxRQUF3QixFQUFFLE1BQW1CO1lBQ2pELElBQU0sT0FBTyxHQUFHLElBQUksYUFBYSxFQUFFLENBQUM7WUFDcEMsSUFBTSxLQUFLLEdBQWUsRUFBRSxDQUFDO1lBRTdCLFFBQVEsQ0FBQyxPQUFPLENBQUMsVUFBQSxPQUFPO2dCQUN0QixJQUFNLElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLEVBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxFQUFFLEVBQUMsQ0FBQyxD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LENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUM7YUFDM0QsQ0FBQztRQUNKLENBQUM7UUFFRCxnQ0FBWSxHQUFaLFVBQWEsT0FBbUIsRUFBRSxPQUFZLElBQUcsQ0FBQztRQUVsRCxrQ0FBYyxHQUFkLFVBQWUsU0FBdUIsRUFBRSxPQUFZLElBQUcsQ0FBQztRQUVoRCw2QkFBUyxHQUFqQixVQUFrQixJQUFhLEVBQUUsT0FBZTtZQUM5QyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLHNCQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQzdELENBQUM7UUFDSCxnQkFBQztJQUFELENBQUMsQUFuRkQsSUFtRkM7SUFFRCxTQUFTLGFBQWEsQ0FBQyxHQUFXO1FBQ2hDLFFBQVEsR0FBRyxDQUFDLFdBQVcsRUFBRSxFQUFFO1lBQ3pCLEtBQUssSUFBSSxDQUFDO1lBQ1YsS0FBSyxHQUFHLENBQUM7WUFDVCxLQUFLLEdBQUcsQ0FBQztZQUNULEtBQUssR0FBRztnQkFDTixPQUFPLEtBQUssQ0FBQztZQUNmLEtBQUssS0FBSztnQkFDUixPQUFPLE9BQU8sQ0FBQztZQUNqQixLQUFLLEdBQUc7Z0JBQ04sT0FBTyxNQUFNLENBQUM7WUFDaEI7Z0JBQ0UsT0FBTyxPQUFPLENBQUM7U0FDbEI7SUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyBtbCBmcm9tICcuLi8uLi9tbF9wYXJzZXIvYXN0JztcbmltcG9ydCB7WG1sUGFyc2VyfSBmcm9tICcuLi8uLi9tbF9wYXJzZXIveG1sX3BhcnNlcic7XG5pbXBvcnQge2RlY2ltYWxEaWdlc3R9IGZyb20gJy4uL2RpZ2VzdCc7XG5pbXBvcnQgKiBhcyBpMThuIGZyb20gJy4uL2kxOG5fYXN0JztcbmltcG9ydCB7STE4bkVycm9yfSBmcm9tICcuLi9wYXJzZV91dGlsJztcblxuaW1wb3J0IHtTZXJpYWxpemVyfSBmcm9tICcuL3NlcmlhbGl6ZXInO1xuaW1wb3J0ICogYXMgeG1sIGZyb20gJy4veG1sX2hlbHBlcic7XG5cbmNvbnN0IF9WRVJTSU9OID0gJzIuMCc7XG5jb25zdCBfWE1MTlMgPSAndXJuOm9hc2lzOm5hbWVzOnRjOnhsaWZmOmRvY3VtZW50OjIuMCc7XG4vLyBUT0RPKHZpY2IpOiBtYWtlIHRoaXMgYSBwYXJhbSAocy9fLy0vKVxuY29uc3QgX0RFRkFVTFRfU09VUkNFX0xBTkcgPSAnZW4nO1xuY29uc3QgX1BMQUNFSE9MREVSX1RBRyA9ICdwaCc7XG5jb25zdCBfUExBQ0VIT0xERVJfU1BBTk5JTkdfVEFHID0gJ3BjJztcbmNvbnN0IF9NQVJLRVJfVEFHID0gJ21yayc7XG5cbmNvbnN0IF9YTElGRl9UQUcgPSAneGxpZmYnO1xuY29uc3QgX1NPVVJDRV9UQUcgPSAnc291cmNlJztcbmNvbnN0IF9UQVJHRVRfVEFHID0gJ3RhcmdldCc7XG5jb25zdCBfVU5JVF9UQUcgPSAndW5pdCc7XG5cbi8vIGh0dHA6Ly9kb2NzLm9hc2lzLW9wZW4ub3JnL3hsaWZmL3hsaWZmLWNvcmUvdjIuMC9vcy94bGlmZi1jb3JlLXYyLjAtb3MuaHRtbFxuZXhwb3J0IGNsYXNzIFhsaWZmMiBleHRlbmRzIFNlcmlhbGl6ZXIge1xuICB3cml0ZShtZXNzYWdlczogaTE4bi5NZXNzYWdlW10sIGxvY2FsZTogc3RyaW5nfG51bGwpOiBzdHJpbmcge1xuICAgIGNvbnN0IHZpc2l0b3IgPSBuZXcgX1dyaXRlVmlzaXRvcigpO1xuICAgIGNvbnN0IHVuaXRzOiB4bWwuTm9kZVtdID0gW107XG5cbiAgICBtZXNzYWdlcy5mb3JFYWNoKG1lc3NhZ2UgPT4ge1xuICAgICAgY29uc3QgdW5pdCA9IG5ldyB4bWwuVGFnKF9VTklUX1RBRywge2lkOiBtZXNzYWdlLmlkfSk7XG4gICAgICBjb25zdCBub3RlcyA9IG5ldyB4bWwuVGFnKCdub3RlcycpO1xuXG4gICAgICBpZiAobWVzc2FnZS5kZXNjcmlwdGlvbiB8fCBtZXNzYWdlLm1lYW5pbmcpIHtcbiAgICAgICAgaWYgKG1lc3NhZ2UuZGVzY3JpcHRpb24pIHtcbiAgICAgICAgICBub3Rlcy5jaGlsZHJlbi5wdXNoKFxuICAgICAgICAgICAgICBuZXcgeG1sLkNSKDgpLFxuICAgICAgICAgICAgICBuZXcgeG1sLlRhZygnbm90ZScsIHtjYXRlZ29yeTogJ2Rlc2NyaXB0aW9uJ30sIFtuZXcgeG1sLlRleHQobWVzc2FnZS5kZXNjcmlwdGlvbildKSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobWVzc2FnZS5tZWFuaW5nKSB7XG4gICAgICAgICAgbm90ZXMuY2hpbGRyZW4ucHVzaChcbiAgICAgICAgICAgICAgbmV3IHhtbC5DUig4KSxcbiAgICAgICAgICAgICAgbmV3IHhtbC5UYWcoJ25vdGUnLCB7Y2F0ZWdvcnk6ICdtZWFuaW5nJ30sIFtuZXcgeG1sLlRleHQobWVzc2FnZS5tZWFuaW5nKV0pKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBtZXNzYWdlLnNvdXJjZXMuZm9yRWFjaCgoc291cmNlOiBpMThuLk1lc3NhZ2VTcGFuKSA9PiB7XG4gICAgICAgIG5vdGVzLmNoaWxkcmVuLnB1c2gobmV3IHhtbC5DUig4KSwgbmV3IHhtbC5UYWcoJ25vdGUnLCB7Y2F0ZWdvcnk6ICdsb2NhdGlvbid9LCBbXG4gICAgICAgICAgbmV3IHhtbC5UZXh0KFxuICAgICAgICAgICAgICBgJHtzb3VyY2UuZmlsZVBhdGh9OiR7c291cmNlLnN0YXJ0TGluZX0ke3NvdXJjZS5lbmRMaW5lICE9PSBzb3VyY2Uuc3RhcnRMaW5lID8gJywnICsgc291cmNlLmVuZExpbmUgOiAnJ31gKVxuICAgICAgICBdKSk7XG4gICAgICB9KTtcblxuICAgICAgbm90ZXMuY2hpbGRyZW4ucHVzaChuZXcgeG1sLkNSKDYpKTtcbiAgICAgIHVuaXQuY2hpbGRyZW4ucHVzaChuZXcgeG1sLkNSKDYpLCBub3Rlcyk7XG5cbiAgICAgIGNvbnN0IHNlZ21lbnQgPSBuZXcgeG1sLlRhZygnc2VnbWVudCcpO1xuXG4gICAgICBzZWdtZW50LmNoaWxkcmVuLnB1c2goXG4gICAgICAgICAgbmV3IHhtbC5DUig4KSwgbmV3IHhtbC5UYWcoX1NPVVJDRV9UQUcsIHt9LCB2aXNpdG9yLnNlcmlhbGl6ZShtZXNzYWdlLm5vZGVzKSksXG4gICAgICAgICAgbmV3IHhtbC5DUig2KSk7XG5cbiAgICAgIHVuaXQuY2hpbGRyZW4ucHVzaChuZXcgeG1sLkNSKDYpLCBzZWdtZW50LCBuZXcgeG1sLkNSKDQpKTtcblxuICAgICAgdW5pdHMucHVzaChuZXcgeG1sLkNSKDQpLCB1bml0KTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGZpbGUgPVxuICAgICAgICBuZXcgeG1sLlRhZygnZmlsZScsIHsnb3JpZ2luYWwnOiAnbmcudGVtcGxhdGUnLCBpZDogJ25naTE4bid9LCBbLi4udW5pdHMsIG5ldyB4bWwuQ1IoMildKTtcblxuICAgIGNvbnN0IHhsaWZmID0gbmV3IHhtbC5UYWcoXG4gICAgICAgIF9YTElGRl9UQUcsIHt2ZXJzaW9uOiBfVkVSU0lPTiwgeG1sbnM6IF9YTUxOUywgc3JjTGFuZzogbG9jYWxlIHx8IF9ERUZBVUxUX1NPVVJDRV9MQU5HfSxcbiAgICAgICAgW25ldyB4bWwuQ1IoMiksIGZpbGUsIG5ldyB4bWwuQ1IoKV0pO1xuXG4gICAgcmV0dXJuIHhtbC5zZXJpYWxpemUoW1xuICAgICAgbmV3IHhtbC5EZWNsYXJhdGlvbih7dmVyc2lvbjogJzEuMCcsIGVuY29kaW5nOiAnVVRGLTgnfSksIG5ldyB4bWwuQ1IoKSwgeGxpZmYsIG5ldyB4bWwuQ1IoKVxuICAgIF0pO1xuICB9XG5cbiAgbG9hZChjb250ZW50OiBzdHJpbmcsIHVybDogc3RyaW5nKTpcbiAgICAgIHtsb2NhbGU6IHN0cmluZywgaTE4bk5vZGVzQnlNc2dJZDoge1ttc2dJZDogc3RyaW5nXTogaTE4bi5Ob2RlW119fSB7XG4gICAgLy8geGxpZmYgdG8geG1sIG5vZGVzXG4gICAgY29uc3QgeGxpZmYyUGFyc2VyID0gbmV3IFhsaWZmMlBhcnNlcigpO1xuICAgIGNvbnN0IHtsb2NhbGUsIG1zZ0lkVG9IdG1sLCBlcnJvcnN9ID0geGxpZmYyUGFyc2VyLnBhcnNlKGNvbnRlbnQsIHVybCk7XG5cbiAgICAvLyB4bWwgbm9kZXMgdG8gaTE4biBub2Rlc1xuICAgIGNvbnN0IGkxOG5Ob2Rlc0J5TXNnSWQ6IHtbbXNnSWQ6IHN0cmluZ106IGkxOG4uTm9kZVtdfSA9IHt9O1xuICAgIGNvbnN0IGNvbnZlcnRlciA9IG5ldyBYbWxUb0kxOG4oKTtcblxuICAgIE9iamVjdC5rZXlzKG1zZ0lkVG9IdG1sKS5mb3JFYWNoKG1zZ0lkID0+IHtcbiAgICAgIGNvbnN0IHtpMThuTm9kZXMsIGVycm9yczogZX0gPSBjb252ZXJ0ZXIuY29udmVydChtc2dJZFRvSHRtbFttc2dJZF0sIHVybCk7XG4gICAgICBlcnJvcnMucHVzaCguLi5lKTtcbiAgICAgIGkxOG5Ob2Rlc0J5TXNnSWRbbXNnSWRdID0gaTE4bk5vZGVzO1xuICAgIH0pO1xuXG4gICAgaWYgKGVycm9ycy5sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgeGxpZmYyIHBhcnNlIGVycm9yczpcXG4ke2Vycm9ycy5qb2luKCdcXG4nKX1gKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge2xvY2FsZTogbG9jYWxlICEsIGkxOG5Ob2Rlc0J5TXNnSWR9O1xuICB9XG5cbiAgZGlnZXN0KG1lc3NhZ2U6IGkxOG4uTWVzc2FnZSk6IHN0cmluZyB7IHJldHVybiBkZWNpbWFsRGlnZXN0KG1lc3NhZ2UpOyB9XG59XG5cbmNsYXNzIF9Xcml0ZVZpc2l0b3IgaW1wbGVtZW50cyBpMThuLlZpc2l0b3Ige1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgcHJpdmF0ZSBfbmV4dFBsYWNlaG9sZGVySWQgITogbnVtYmVyO1xuXG4gIHZpc2l0VGV4dCh0ZXh0OiBpMThuLlRleHQsIGNvbnRleHQ/OiBhbnkpOiB4bWwuTm9kZVtdIHsgcmV0dXJuIFtuZXcgeG1sLlRleHQodGV4dC52YWx1ZSldOyB9XG5cbiAgdmlzaXRDb250YWluZXIoY29udGFpbmVyOiBpMThuLkNvbnRhaW5lciwgY29udGV4dD86IGFueSk6IHhtbC5Ob2RlW10ge1xuICAgIGNvbnN0IG5vZGVzOiB4bWwuTm9kZVtdID0gW107XG4gICAgY29udGFpbmVyLmNoaWxkcmVuLmZvckVhY2goKG5vZGU6IGkxOG4uTm9kZSkgPT4gbm9kZXMucHVzaCguLi5ub2RlLnZpc2l0KHRoaXMpKSk7XG4gICAgcmV0dXJuIG5vZGVzO1xuICB9XG5cbiAgdmlzaXRJY3UoaWN1OiBpMThuLkljdSwgY29udGV4dD86IGFueSk6IHhtbC5Ob2RlW10ge1xuICAgIGNvbnN0IG5vZGVzID0gW25ldyB4bWwuVGV4dChgeyR7aWN1LmV4cHJlc3Npb25QbGFjZWhvbGRlcn0sICR7aWN1LnR5cGV9LCBgKV07XG5cbiAgICBPYmplY3Qua2V5cyhpY3UuY2FzZXMpLmZvckVhY2goKGM6IHN0cmluZykgPT4ge1xuICAgICAgbm9kZXMucHVzaChuZXcgeG1sLlRleHQoYCR7Y30ge2ApLCAuLi5pY3UuY2FzZXNbY10udmlzaXQodGhpcyksIG5ldyB4bWwuVGV4dChgfSBgKSk7XG4gICAgfSk7XG5cbiAgICBub2Rlcy5wdXNoKG5ldyB4bWwuVGV4dChgfWApKTtcblxuICAgIHJldHVybiBub2RlcztcbiAgfVxuXG4gIHZpc2l0VGFnUGxhY2Vob2xkZXIocGg6IGkxOG4uVGFnUGxhY2Vob2xkZXIsIGNvbnRleHQ/OiBhbnkpOiB4bWwuTm9kZVtdIHtcbiAgICBjb25zdCB0eXBlID0gZ2V0VHlwZUZvclRhZyhwaC50YWcpO1xuXG4gICAgaWYgKHBoLmlzVm9pZCkge1xuICAgICAgY29uc3QgdGFnUGggPSBuZXcgeG1sLlRhZyhfUExBQ0VIT0xERVJfVEFHLCB7XG4gICAgICAgIGlkOiAodGhpcy5fbmV4dFBsYWNlaG9sZGVySWQrKykudG9TdHJpbmcoKSxcbiAgICAgICAgZXF1aXY6IHBoLnN0YXJ0TmFtZSxcbiAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgZGlzcDogYDwke3BoLnRhZ30vPmAsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBbdGFnUGhdO1xuICAgIH1cblxuICAgIGNvbnN0IHRhZ1BjID0gbmV3IHhtbC5UYWcoX1BMQUNFSE9MREVSX1NQQU5OSU5HX1RBRywge1xuICAgICAgaWQ6ICh0aGlzLl9uZXh0UGxhY2Vob2xkZXJJZCsrKS50b1N0cmluZygpLFxuICAgICAgZXF1aXZTdGFydDogcGguc3RhcnROYW1lLFxuICAgICAgZXF1aXZFbmQ6IHBoLmNsb3NlTmFtZSxcbiAgICAgIHR5cGU6IHR5cGUsXG4gICAgICBkaXNwU3RhcnQ6IGA8JHtwaC50YWd9PmAsXG4gICAgICBkaXNwRW5kOiBgPC8ke3BoLnRhZ30+YCxcbiAgICB9KTtcbiAgICBjb25zdCBub2RlczogeG1sLk5vZGVbXSA9IFtdLmNvbmNhdCguLi5waC5jaGlsZHJlbi5tYXAobm9kZSA9PiBub2RlLnZpc2l0KHRoaXMpKSk7XG4gICAgaWYgKG5vZGVzLmxlbmd0aCkge1xuICAgICAgbm9kZXMuZm9yRWFjaCgobm9kZTogeG1sLk5vZGUpID0+IHRhZ1BjLmNoaWxkcmVuLnB1c2gobm9kZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0YWdQYy5jaGlsZHJlbi5wdXNoKG5ldyB4bWwuVGV4dCgnJykpO1xuICAgIH1cblxuICAgIHJldHVybiBbdGFnUGNdO1xuICB9XG5cbiAgdmlzaXRQbGFjZWhvbGRlcihwaDogaTE4bi5QbGFjZWhvbGRlciwgY29udGV4dD86IGFueSk6IHhtbC5Ob2RlW10ge1xuICAgIGNvbnN0IGlkU3RyID0gKHRoaXMuX25leHRQbGFjZWhvbGRlcklkKyspLnRvU3RyaW5nKCk7XG4gICAgcmV0dXJuIFtuZXcgeG1sLlRhZyhfUExBQ0VIT0xERVJfVEFHLCB7XG4gICAgICBpZDogaWRTdHIsXG4gICAgICBlcXVpdjogcGgubmFtZSxcbiAgICAgIGRpc3A6IGB7eyR7cGgudmFsdWV9fX1gLFxuICAgIH0pXTtcbiAgfVxuXG4gIHZpc2l0SWN1UGxhY2Vob2xkZXIocGg6IGkxOG4uSWN1UGxhY2Vob2xkZXIsIGNvbnRleHQ/OiBhbnkpOiB4bWwuTm9kZVtdIHtcbiAgICBjb25zdCBjYXNlcyA9IE9iamVjdC5rZXlzKHBoLnZhbHVlLmNhc2VzKS5tYXAoKHZhbHVlOiBzdHJpbmcpID0+IHZhbHVlICsgJyB7Li4ufScpLmpvaW4oJyAnKTtcbiAgICBjb25zdCBpZFN0ciA9ICh0aGlzLl9uZXh0UGxhY2Vob2xkZXJJZCsrKS50b1N0cmluZygpO1xuICAgIHJldHVybiBbbmV3IHhtbC5UYWcoXG4gICAgICAgIF9QTEFDRUhPTERFUl9UQUcsXG4gICAgICAgIHtpZDogaWRTdHIsIGVxdWl2OiBwaC5uYW1lLCBkaXNwOiBgeyR7cGgudmFsdWUuZXhwcmVzc2lvbn0sICR7cGgudmFsdWUudHlwZX0sICR7Y2FzZXN9fWB9KV07XG4gIH1cblxuICBzZXJpYWxpemUobm9kZXM6IGkxOG4uTm9kZVtdKTogeG1sLk5vZGVbXSB7XG4gICAgdGhpcy5fbmV4dFBsYWNlaG9sZGVySWQgPSAwO1xuICAgIHJldHVybiBbXS5jb25jYXQoLi4ubm9kZXMubWFwKG5vZGUgPT4gbm9kZS52aXNpdCh0aGlzKSkpO1xuICB9XG59XG5cbi8vIEV4dHJhY3QgbWVzc2FnZXMgYXMgeG1sIG5vZGVzIGZyb20gdGhlIHhsaWZmIGZpbGVcbmNsYXNzIFhsaWZmMlBhcnNlciBpbXBsZW1lbnRzIG1sLlZpc2l0b3Ige1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgcHJpdmF0ZSBfdW5pdE1sU3RyaW5nICE6IHN0cmluZyB8IG51bGw7XG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBwcml2YXRlIF9lcnJvcnMgITogSTE4bkVycm9yW107XG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBwcml2YXRlIF9tc2dJZFRvSHRtbCAhOiB7W21zZ0lkOiBzdHJpbmddOiBzdHJpbmd9O1xuICBwcml2YXRlIF9sb2NhbGU6IHN0cmluZ3xudWxsID0gbnVsbDtcblxuICBwYXJzZSh4bGlmZjogc3RyaW5nLCB1cmw6IHN0cmluZykge1xuICAgIHRoaXMuX3VuaXRNbFN0cmluZyA9IG51bGw7XG4gICAgdGhpcy5fbXNnSWRUb0h0bWwgPSB7fTtcblxuICAgIGNvbnN0IHhtbCA9IG5ldyBYbWxQYXJzZXIoKS5wYXJzZSh4bGlmZiwgdXJsLCBmYWxzZSk7XG5cbiAgICB0aGlzLl9lcnJvcnMgPSB4bWwuZXJyb3JzO1xuICAgIG1sLnZpc2l0QWxsKHRoaXMsIHhtbC5yb290Tm9kZXMsIG51bGwpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIG1zZ0lkVG9IdG1sOiB0aGlzLl9tc2dJZFRvSHRtbCxcbiAgICAgIGVycm9yczogdGhpcy5fZXJyb3JzLFxuICAgICAgbG9jYWxlOiB0aGlzLl9sb2NhbGUsXG4gICAgfTtcbiAgfVxuXG4gIHZpc2l0RWxlbWVudChlbGVtZW50OiBtbC5FbGVtZW50LCBjb250ZXh0OiBhbnkpOiBhbnkge1xuICAgIHN3aXRjaCAoZWxlbWVudC5uYW1lKSB7XG4gICAgICBjYXNlIF9VTklUX1RBRzpcbiAgICAgICAgdGhpcy5fdW5pdE1sU3RyaW5nID0gbnVsbDtcbiAgICAgICAgY29uc3QgaWRBdHRyID0gZWxlbWVudC5hdHRycy5maW5kKChhdHRyKSA9PiBhdHRyLm5hbWUgPT09ICdpZCcpO1xuICAgICAgICBpZiAoIWlkQXR0cikge1xuICAgICAgICAgIHRoaXMuX2FkZEVycm9yKGVsZW1lbnQsIGA8JHtfVU5JVF9UQUd9PiBtaXNzZXMgdGhlIFwiaWRcIiBhdHRyaWJ1dGVgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBpZCA9IGlkQXR0ci52YWx1ZTtcbiAgICAgICAgICBpZiAodGhpcy5fbXNnSWRUb0h0bWwuaGFzT3duUHJvcGVydHkoaWQpKSB7XG4gICAgICAgICAgICB0aGlzLl9hZGRFcnJvcihlbGVtZW50LCBgRHVwbGljYXRlZCB0cmFuc2xhdGlvbnMgZm9yIG1zZyAke2lkfWApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtbC52aXNpdEFsbCh0aGlzLCBlbGVtZW50LmNoaWxkcmVuLCBudWxsKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy5fdW5pdE1sU3RyaW5nID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICB0aGlzLl9tc2dJZFRvSHRtbFtpZF0gPSB0aGlzLl91bml0TWxTdHJpbmc7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0aGlzLl9hZGRFcnJvcihlbGVtZW50LCBgTWVzc2FnZSAke2lkfSBtaXNzZXMgYSB0cmFuc2xhdGlvbmApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBfU09VUkNFX1RBRzpcbiAgICAgICAgLy8gaWdub3JlIHNvdXJjZSBtZXNzYWdlXG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIF9UQVJHRVRfVEFHOlxuICAgICAgICBjb25zdCBpbm5lclRleHRTdGFydCA9IGVsZW1lbnQuc3RhcnRTb3VyY2VTcGFuICEuZW5kLm9mZnNldDtcbiAgICAgICAgY29uc3QgaW5uZXJUZXh0RW5kID0gZWxlbWVudC5lbmRTb3VyY2VTcGFuICEuc3RhcnQub2Zmc2V0O1xuICAgICAgICBjb25zdCBjb250ZW50ID0gZWxlbWVudC5zdGFydFNvdXJjZVNwYW4gIS5zdGFydC5maWxlLmNvbnRlbnQ7XG4gICAgICAgIGNvbnN0IGlubmVyVGV4dCA9IGNvbnRlbnQuc2xpY2UoaW5uZXJUZXh0U3RhcnQsIGlubmVyVGV4dEVuZCk7XG4gICAgICAgIHRoaXMuX3VuaXRNbFN0cmluZyA9IGlubmVyVGV4dDtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgX1hMSUZGX1RBRzpcbiAgICAgICAgY29uc3QgbG9jYWxlQXR0ciA9IGVsZW1lbnQuYXR0cnMuZmluZCgoYXR0cikgPT4gYXR0ci5uYW1lID09PSAndHJnTGFuZycpO1xuICAgICAgICBpZiAobG9jYWxlQXR0cikge1xuICAgICAgICAgIHRoaXMuX2xvY2FsZSA9IGxvY2FsZUF0dHIudmFsdWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB2ZXJzaW9uQXR0ciA9IGVsZW1lbnQuYXR0cnMuZmluZCgoYXR0cikgPT4gYXR0ci5uYW1lID09PSAndmVyc2lvbicpO1xuICAgICAgICBpZiAodmVyc2lvbkF0dHIpIHtcbiAgICAgICAgICBjb25zdCB2ZXJzaW9uID0gdmVyc2lvbkF0dHIudmFsdWU7XG4gICAgICAgICAgaWYgKHZlcnNpb24gIT09ICcyLjAnKSB7XG4gICAgICAgICAgICB0aGlzLl9hZGRFcnJvcihcbiAgICAgICAgICAgICAgICBlbGVtZW50LFxuICAgICAgICAgICAgICAgIGBUaGUgWExJRkYgZmlsZSB2ZXJzaW9uICR7dmVyc2lvbn0gaXMgbm90IGNvbXBhdGlibGUgd2l0aCBYTElGRiAyLjAgc2VyaWFsaXplcmApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtbC52aXNpdEFsbCh0aGlzLCBlbGVtZW50LmNoaWxkcmVuLCBudWxsKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBtbC52aXNpdEFsbCh0aGlzLCBlbGVtZW50LmNoaWxkcmVuLCBudWxsKTtcbiAgICB9XG4gIH1cblxuICB2aXNpdEF0dHJpYnV0ZShhdHRyaWJ1dGU6IG1sLkF0dHJpYnV0ZSwgY29udGV4dDogYW55KTogYW55IHt9XG5cbiAgdmlzaXRUZXh0KHRleHQ6IG1sLlRleHQsIGNvbnRleHQ6IGFueSk6IGFueSB7fVxuXG4gIHZpc2l0Q29tbWVudChjb21tZW50OiBtbC5Db21tZW50LCBjb250ZXh0OiBhbnkpOiBhbnkge31cblxuICB2aXNpdEV4cGFuc2lvbihleHBhbnNpb246IG1sLkV4cGFuc2lvbiwgY29udGV4dDogYW55KTogYW55IHt9XG5cbiAgdmlzaXRFeHBhbnNpb25DYXNlKGV4cGFuc2lvbkNhc2U6IG1sLkV4cGFuc2lvbkNhc2UsIGNvbnRleHQ6IGFueSk6IGFueSB7fVxuXG4gIHByaXZhdGUgX2FkZEVycm9yKG5vZGU6IG1sLk5vZGUsIG1lc3NhZ2U6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuX2Vycm9ycy5wdXNoKG5ldyBJMThuRXJyb3Iobm9kZS5zb3VyY2VTcGFuLCBtZXNzYWdlKSk7XG4gIH1cbn1cblxuLy8gQ29udmVydCBtbCBub2RlcyAoeGxpZmYgc3ludGF4KSB0byBpMThuIG5vZGVzXG5jbGFzcyBYbWxUb0kxOG4gaW1wbGVtZW50cyBtbC5WaXNpdG9yIHtcbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIHByaXZhdGUgX2Vycm9ycyAhOiBJMThuRXJyb3JbXTtcblxuICBjb252ZXJ0KG1lc3NhZ2U6IHN0cmluZywgdXJsOiBzdHJpbmcpIHtcbiAgICBjb25zdCB4bWxJY3UgPSBuZXcgWG1sUGFyc2VyKCkucGFyc2UobWVzc2FnZSwgdXJsLCB0cnVlKTtcbiAgICB0aGlzLl9lcnJvcnMgPSB4bWxJY3UuZXJyb3JzO1xuXG4gICAgY29uc3QgaTE4bk5vZGVzID0gdGhpcy5fZXJyb3JzLmxlbmd0aCA+IDAgfHwgeG1sSWN1LnJvb3ROb2Rlcy5sZW5ndGggPT0gMCA/XG4gICAgICAgIFtdIDpcbiAgICAgICAgW10uY29uY2F0KC4uLm1sLnZpc2l0QWxsKHRoaXMsIHhtbEljdS5yb290Tm9kZXMpKTtcblxuICAgIHJldHVybiB7XG4gICAgICBpMThuTm9kZXMsXG4gICAgICBlcnJvcnM6IHRoaXMuX2Vycm9ycyxcbiAgICB9O1xuICB9XG5cbiAgdmlzaXRUZXh0KHRleHQ6IG1sLlRleHQsIGNvbnRleHQ6IGFueSkgeyByZXR1cm4gbmV3IGkxOG4uVGV4dCh0ZXh0LnZhbHVlLCB0ZXh0LnNvdXJjZVNwYW4pOyB9XG5cbiAgdmlzaXRFbGVtZW50KGVsOiBtbC5FbGVtZW50LCBjb250ZXh0OiBhbnkpOiBpMThuLk5vZGVbXXxudWxsIHtcbiAgICBzd2l0Y2ggKGVsLm5hbWUpIHtcbiAgICAgIGNhc2UgX1BMQUNFSE9MREVSX1RBRzpcbiAgICAgICAgY29uc3QgbmFtZUF0dHIgPSBlbC5hdHRycy5maW5kKChhdHRyKSA9PiBhdHRyLm5hbWUgPT09ICdlcXVpdicpO1xuICAgICAgICBpZiAobmFtZUF0dHIpIHtcbiAgICAgICAgICByZXR1cm4gW25ldyBpMThuLlBsYWNlaG9sZGVyKCcnLCBuYW1lQXR0ci52YWx1ZSwgZWwuc291cmNlU3BhbildO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fYWRkRXJyb3IoZWwsIGA8JHtfUExBQ0VIT0xERVJfVEFHfT4gbWlzc2VzIHRoZSBcImVxdWl2XCIgYXR0cmlidXRlYCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBfUExBQ0VIT0xERVJfU1BBTk5JTkdfVEFHOlxuICAgICAgICBjb25zdCBzdGFydEF0dHIgPSBlbC5hdHRycy5maW5kKChhdHRyKSA9PiBhdHRyLm5hbWUgPT09ICdlcXVpdlN0YXJ0Jyk7XG4gICAgICAgIGNvbnN0IGVuZEF0dHIgPSBlbC5hdHRycy5maW5kKChhdHRyKSA9PiBhdHRyLm5hbWUgPT09ICdlcXVpdkVuZCcpO1xuXG4gICAgICAgIGlmICghc3RhcnRBdHRyKSB7XG4gICAgICAgICAgdGhpcy5fYWRkRXJyb3IoZWwsIGA8JHtfUExBQ0VIT0xERVJfVEFHfT4gbWlzc2VzIHRoZSBcImVxdWl2U3RhcnRcIiBhdHRyaWJ1dGVgKTtcbiAgICAgICAgfSBlbHNlIGlmICghZW5kQXR0cikge1xuICAgICAgICAgIHRoaXMuX2FkZEVycm9yKGVsLCBgPCR7X1BMQUNFSE9MREVSX1RBR30+IG1pc3NlcyB0aGUgXCJlcXVpdkVuZFwiIGF0dHJpYnV0ZWApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IHN0YXJ0SWQgPSBzdGFydEF0dHIudmFsdWU7XG4gICAgICAgICAgY29uc3QgZW5kSWQgPSBlbmRBdHRyLnZhbHVlO1xuXG4gICAgICAgICAgY29uc3Qgbm9kZXM6IGkxOG4uTm9kZVtdID0gW107XG5cbiAgICAgICAgICByZXR1cm4gbm9kZXMuY29uY2F0KFxuICAgICAgICAgICAgICBuZXcgaTE4bi5QbGFjZWhvbGRlcignJywgc3RhcnRJZCwgZWwuc291cmNlU3BhbiksXG4gICAgICAgICAgICAgIC4uLmVsLmNoaWxkcmVuLm1hcChub2RlID0+IG5vZGUudmlzaXQodGhpcywgbnVsbCkpLFxuICAgICAgICAgICAgICBuZXcgaTE4bi5QbGFjZWhvbGRlcignJywgZW5kSWQsIGVsLnNvdXJjZVNwYW4pKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgX01BUktFUl9UQUc6XG4gICAgICAgIHJldHVybiBbXS5jb25jYXQoLi4ubWwudmlzaXRBbGwodGhpcywgZWwuY2hpbGRyZW4pKTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRoaXMuX2FkZEVycm9yKGVsLCBgVW5leHBlY3RlZCB0YWdgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHZpc2l0RXhwYW5zaW9uKGljdTogbWwuRXhwYW5zaW9uLCBjb250ZXh0OiBhbnkpIHtcbiAgICBjb25zdCBjYXNlTWFwOiB7W3ZhbHVlOiBzdHJpbmddOiBpMThuLk5vZGV9ID0ge307XG5cbiAgICBtbC52aXNpdEFsbCh0aGlzLCBpY3UuY2FzZXMpLmZvckVhY2goKGM6IGFueSkgPT4ge1xuICAgICAgY2FzZU1hcFtjLnZhbHVlXSA9IG5ldyBpMThuLkNvbnRhaW5lcihjLm5vZGVzLCBpY3Uuc291cmNlU3Bhbik7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbmV3IGkxOG4uSWN1KGljdS5zd2l0Y2hWYWx1ZSwgaWN1LnR5cGUsIGNhc2VNYXAsIGljdS5zb3VyY2VTcGFuKTtcbiAgfVxuXG4gIHZpc2l0RXhwYW5zaW9uQ2FzZShpY3VDYXNlOiBtbC5FeHBhbnNpb25DYXNlLCBjb250ZXh0OiBhbnkpOiBhbnkge1xuICAgIHJldHVybiB7XG4gICAgICB2YWx1ZTogaWN1Q2FzZS52YWx1ZSxcbiAgICAgIG5vZGVzOiBbXS5jb25jYXQoLi4ubWwudmlzaXRBbGwodGhpcywgaWN1Q2FzZS5leHByZXNzaW9uKSksXG4gICAgfTtcbiAgfVxuXG4gIHZpc2l0Q29tbWVudChjb21tZW50OiBtbC5Db21tZW50LCBjb250ZXh0OiBhbnkpIHt9XG5cbiAgdmlzaXRBdHRyaWJ1dGUoYXR0cmlidXRlOiBtbC5BdHRyaWJ1dGUsIGNvbnRleHQ6IGFueSkge31cblxuICBwcml2YXRlIF9hZGRFcnJvcihub2RlOiBtbC5Ob2RlLCBtZXNzYWdlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLl9lcnJvcnMucHVzaChuZXcgSTE4bkVycm9yKG5vZGUuc291cmNlU3BhbiwgbWVzc2FnZSkpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldFR5cGVGb3JUYWcodGFnOiBzdHJpbmcpOiBzdHJpbmcge1xuICBzd2l0Y2ggKHRhZy50b0xvd2VyQ2FzZSgpKSB7XG4gICAgY2FzZSAnYnInOlxuICAgIGNhc2UgJ2InOlxuICAgIGNhc2UgJ2knOlxuICAgIGNhc2UgJ3UnOlxuICAgICAgcmV0dXJuICdmbXQnO1xuICAgIGNhc2UgJ2ltZyc6XG4gICAgICByZXR1cm4gJ2ltYWdlJztcbiAgICBjYXNlICdhJzpcbiAgICAgIHJldHVybiAnbGluayc7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiAnb3RoZXInO1xuICB9XG59XG4iXX0=
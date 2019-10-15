/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
/** I18n separators for metadata **/
var I18N_MEANING_SEPARATOR = '|';
var I18N_ID_SEPARATOR = '@@';
/** Name of the i18n attributes **/
export var I18N_ATTR = 'i18n';
export var I18N_ATTR_PREFIX = 'i18n-';
/** Placeholder wrapper for i18n expressions **/
export var I18N_PLACEHOLDER_SYMBOL = '�';
// Parse i18n metas like:
// - "@@id",
// - "description[@@id]",
// - "meaning|description[@@id]"
export function parseI18nMeta(meta) {
    var _a, _b;
    var id;
    var meaning;
    var description;
    if (meta) {
        var idIndex = meta.indexOf(I18N_ID_SEPARATOR);
        var descIndex = meta.indexOf(I18N_MEANING_SEPARATOR);
        var meaningAndDesc = void 0;
        _a = tslib_1.__read((idIndex > -1) ? [meta.slice(0, idIndex), meta.slice(idIndex + 2)] : [meta, ''], 2), meaningAndDesc = _a[0], id = _a[1];
        _b = tslib_1.__read((descIndex > -1) ?
            [meaningAndDesc.slice(0, descIndex), meaningAndDesc.slice(descIndex + 1)] :
            ['', meaningAndDesc], 2), meaning = _b[0], description = _b[1];
    }
    return { id: id, meaning: meaning, description: description };
}
export function isI18NAttribute(name) {
    return name === I18N_ATTR || name.startsWith(I18N_ATTR_PREFIX);
}
export function wrapI18nPlaceholder(content, contextId) {
    if (contextId === void 0) { contextId = 0; }
    var blockId = contextId > 0 ? ":" + contextId : '';
    return "" + I18N_PLACEHOLDER_SYMBOL + content + blockId + I18N_PLACEHOLDER_SYMBOL;
}
export function assembleI18nBoundString(strings, bindingStartIndex, contextId) {
    if (bindingStartIndex === void 0) { bindingStartIndex = 0; }
    if (contextId === void 0) { contextId = 0; }
    if (!strings.length)
        return '';
    var acc = '';
    var lastIdx = strings.length - 1;
    for (var i = 0; i < lastIdx; i++) {
        acc += "" + strings[i] + wrapI18nPlaceholder(bindingStartIndex + i, contextId);
    }
    acc += strings[lastIdx];
    return acc;
}
function getSeqNumberGenerator(startsAt) {
    if (startsAt === void 0) { startsAt = 0; }
    var current = startsAt;
    return function () { return current++; };
}
/**
 * I18nContext is a helper class which keeps track of all i18n-related aspects
 * (accumulates content, bindings, etc) between i18nStart and i18nEnd instructions.
 *
 * When we enter a nested template, the top-level context is being passed down
 * to the nested component, which uses this context to generate a child instance
 * of I18nContext class (to handle nested template) and at the end, reconciles it back
 * with the parent context.
 */
var I18nContext = /** @class */ (function () {
    function I18nContext(index, templateIndex, ref, level, uniqueIdGen) {
        if (level === void 0) { level = 0; }
        this.index = index;
        this.templateIndex = templateIndex;
        this.ref = ref;
        this.level = level;
        this.uniqueIdGen = uniqueIdGen;
        this.content = '';
        this.bindings = new Set();
        this.uniqueIdGen = uniqueIdGen || getSeqNumberGenerator();
        this.id = this.uniqueIdGen();
    }
    I18nContext.prototype.wrap = function (symbol, elementIndex, contextId, closed) {
        var state = closed ? '/' : '';
        return wrapI18nPlaceholder("" + state + symbol + elementIndex, contextId);
    };
    I18nContext.prototype.append = function (content) { this.content += content; };
    I18nContext.prototype.genTemplatePattern = function (contextId, templateId) {
        return wrapI18nPlaceholder("tmpl:" + contextId + ":" + templateId);
    };
    I18nContext.prototype.getId = function () { return this.id; };
    I18nContext.prototype.getRef = function () { return this.ref; };
    I18nContext.prototype.getIndex = function () { return this.index; };
    I18nContext.prototype.getContent = function () { return this.content; };
    I18nContext.prototype.getTemplateIndex = function () { return this.templateIndex; };
    I18nContext.prototype.getBindings = function () { return this.bindings; };
    I18nContext.prototype.appendBinding = function (binding) { this.bindings.add(binding); };
    I18nContext.prototype.isRoot = function () { return this.level === 0; };
    I18nContext.prototype.isResolved = function () {
        var regex = new RegExp(this.genTemplatePattern('\\d+', '\\d+'));
        return !regex.test(this.content);
    };
    I18nContext.prototype.appendText = function (content) { this.append(content.trim()); };
    I18nContext.prototype.appendTemplate = function (index) { this.append(this.genTemplatePattern(this.id, index)); };
    I18nContext.prototype.appendElement = function (elementIndex, closed) {
        this.append(this.wrap('#', elementIndex, this.id, closed));
    };
    I18nContext.prototype.forkChildContext = function (index, templateIndex) {
        return new I18nContext(index, templateIndex, this.ref, this.level + 1, this.uniqueIdGen);
    };
    I18nContext.prototype.reconcileChildContext = function (context) {
        var id = context.getId();
        var content = context.getContent();
        var templateIndex = context.getTemplateIndex();
        var pattern = new RegExp(this.genTemplatePattern(this.id, templateIndex));
        var replacement = "" + this.wrap('*', templateIndex, id) + content + this.wrap('*', templateIndex, id, true);
        this.content = this.content.replace(pattern, replacement);
    };
    return I18nContext;
}());
export { I18nContext };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyL3NyYy9yZW5kZXIzL3ZpZXcvaTE4bi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBSUgsb0NBQW9DO0FBQ3BDLElBQU0sc0JBQXNCLEdBQUcsR0FBRyxDQUFDO0FBQ25DLElBQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDO0FBRS9CLG1DQUFtQztBQUNuQyxNQUFNLENBQUMsSUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDO0FBQ2hDLE1BQU0sQ0FBQyxJQUFNLGdCQUFnQixHQUFHLE9BQU8sQ0FBQztBQUV4QyxnREFBZ0Q7QUFDaEQsTUFBTSxDQUFDLElBQU0sdUJBQXVCLEdBQUcsR0FBRyxDQUFDO0FBRTNDLHlCQUF5QjtBQUN6QixZQUFZO0FBQ1oseUJBQXlCO0FBQ3pCLGdDQUFnQztBQUNoQyxNQUFNLFVBQVUsYUFBYSxDQUFDLElBQWE7O0lBQ3pDLElBQUksRUFBb0IsQ0FBQztJQUN6QixJQUFJLE9BQXlCLENBQUM7SUFDOUIsSUFBSSxXQUE2QixDQUFDO0lBRWxDLElBQUksSUFBSSxFQUFFO1FBQ1IsSUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQ2hELElBQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsc0JBQXNCLENBQUMsQ0FBQztRQUN2RCxJQUFJLGNBQWMsU0FBUSxDQUFDO1FBQzNCLHVHQUNtRixFQURsRixzQkFBYyxFQUFFLFVBQUUsQ0FDaUU7UUFDcEY7O29DQUV3QixFQUZ2QixlQUFPLEVBQUUsbUJBQVcsQ0FFSTtLQUMxQjtJQUVELE9BQU8sRUFBQyxFQUFFLElBQUEsRUFBRSxPQUFPLFNBQUEsRUFBRSxXQUFXLGFBQUEsRUFBQyxDQUFDO0FBQ3BDLENBQUM7QUFFRCxNQUFNLFVBQVUsZUFBZSxD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QUksQ0FBQyxHQUFHLEVBQUUsWUFBWSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUM3RCxDQUFDO0lBRUQsc0NBQWdCLEdBQWhCLFVBQWlCLEtBQWEsRUFBRSxhQUFxQjtRQUNuRCxPQUFPLElBQUksV0FBVyxDQUFDLEtBQUssRUFBRSxhQUFhLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDM0YsQ0FBQztJQUNELDJDQUFxQixHQUFyQixVQUFzQixPQUFvQjtRQUN4QyxJQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDM0IsSUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ3JDLElBQU0sYUFBYSxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBSSxDQUFDO1FBQ25ELElBQU0sT0FBTyxHQUFHLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUM7UUFDNUUsSUFBTSxXQUFXLEdBQ2IsS0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxhQUFhLEVBQUUsRUFBRSxDQUFDLEdBQUcsT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLGFBQWEsRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFHLENBQUM7UUFDL0YsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFDNUQsQ0FBQztJQUNILGtCQUFDO0FBQUQsQ0FBQyxBQXRERCxJQXNEQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgbyBmcm9tICcuLi8uLi9vdXRwdXQvb3V0cHV0X2FzdCc7XG5cbi8qKiBJMThuIHNlcGFyYXRvcnMgZm9yIG1ldGFkYXRhICoqL1xuY29uc3QgSTE4Tl9NRUFOSU5HX1NFUEFSQVRPUiA9ICd8JztcbmNvbnN0IEkxOE5fSURfU0VQQVJBVE9SID0gJ0BAJztcblxuLyoqIE5hbWUgb2YgdGhlIGkxOG4gYXR0cmlidXRlcyAqKi9cbmV4cG9ydCBjb25zdCBJMThOX0FUVFIgPSAnaTE4bic7XG5leHBvcnQgY29uc3QgSTE4Tl9BVFRSX1BSRUZJWCA9ICdpMThuLSc7XG5cbi8qKiBQbGFjZWhvbGRlciB3cmFwcGVyIGZvciBpMThuIGV4cHJlc3Npb25zICoqL1xuZXhwb3J0IGNvbnN0IEkxOE5fUExBQ0VIT0xERVJfU1lNQk9MID0gJ++/vSc7XG5cbi8vIFBhcnNlIGkxOG4gbWV0YXMgbGlrZTpcbi8vIC0gXCJAQGlkXCIsXG4vLyAtIFwiZGVzY3JpcHRpb25bQEBpZF1cIixcbi8vIC0gXCJtZWFuaW5nfGRlc2NyaXB0aW9uW0BAaWRdXCJcbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUkxOG5NZXRhKG1ldGE/OiBzdHJpbmcpOiBJMThuTWV0YSB7XG4gIGxldCBpZDogc3RyaW5nfHVuZGVmaW5lZDtcbiAgbGV0IG1lYW5pbmc6IHN0cmluZ3x1bmRlZmluZWQ7XG4gIGxldCBkZXNjcmlwdGlvbjogc3RyaW5nfHVuZGVmaW5lZDtcblxuICBpZiAobWV0YSkge1xuICAgIGNvbnN0IGlkSW5kZXggPSBtZXRhLmluZGV4T2YoSTE4Tl9JRF9TRVBBUkFUT1IpO1xuICAgIGNvbnN0IGRlc2NJbmRleCA9IG1ldGEuaW5kZXhPZihJMThOX01FQU5JTkdfU0VQQVJBVE9SKTtcbiAgICBsZXQgbWVhbmluZ0FuZERlc2M6IHN0cmluZztcbiAgICBbbWVhbmluZ0FuZERlc2MsIGlkXSA9XG4gICAgICAgIChpZEluZGV4ID4gLTEpID8gW21ldGEuc2xpY2UoMCwgaWRJbmRleCksIG1ldGEuc2xpY2UoaWRJbmRleCArIDIpXSA6IFttZXRhLCAnJ107XG4gICAgW21lYW5pbmcsIGRlc2NyaXB0aW9uXSA9IChkZXNjSW5kZXggPiAtMSkgP1xuICAgICAgICBbbWVhbmluZ0FuZERlc2Muc2xpY2UoMCwgZGVzY0luZGV4KSwgbWVhbmluZ0FuZERlc2Muc2xpY2UoZGVzY0luZGV4ICsgMSldIDpcbiAgICAgICAgWycnLCBtZWFuaW5nQW5kRGVzY107XG4gIH1cblxuICByZXR1cm4ge2lkLCBtZWFuaW5nLCBkZXNjcmlwdGlvbn07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0kxOE5BdHRyaWJ1dGUobmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiBuYW1lID09PSBJMThOX0FUVFIgfHwgbmFtZS5zdGFydHNXaXRoKEkxOE5fQVRUUl9QUkVGSVgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gd3JhcEkxOG5QbGFjZWhvbGRlcihjb250ZW50OiBzdHJpbmcgfCBudW1iZXIsIGNvbnRleHRJZDogbnVtYmVyID0gMCk6IHN0cmluZyB7XG4gIGNvbnN0IGJsb2NrSWQgPSBjb250ZXh0SWQgPiAwID8gYDoke2NvbnRleHRJZH1gIDogJyc7XG4gIHJldHVybiBgJHtJMThOX1BMQUNFSE9MREVSX1NZTUJPTH0ke2NvbnRlbnR9JHtibG9ja0lkfSR7STE4Tl9QTEFDRUhPTERFUl9TWU1CT0x9YDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VtYmxlSTE4bkJvdW5kU3RyaW5nKFxuICAgIHN0cmluZ3M6IEFycmF5PHN0cmluZz4sIGJpbmRpbmdTdGFydEluZGV4OiBudW1iZXIgPSAwLCBjb250ZXh0SWQ6IG51bWJlciA9IDApOiBzdHJpbmcge1xuICBpZiAoIXN0cmluZ3MubGVuZ3RoKSByZXR1cm4gJyc7XG4gIGxldCBhY2MgPSAnJztcbiAgY29uc3QgbGFzdElkeCA9IHN0cmluZ3MubGVuZ3RoIC0gMTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsYXN0SWR4OyBpKyspIHtcbiAgICBhY2MgKz0gYCR7c3RyaW5nc1tpXX0ke3dyYXBJMThuUGxhY2Vob2xkZXIoYmluZGluZ1N0YXJ0SW5kZXggKyBpLCBjb250ZXh0SWQpfWA7XG4gIH1cbiAgYWNjICs9IHN0cmluZ3NbbGFzdElkeF07XG4gIHJldHVybiBhY2M7XG59XG5cbmZ1bmN0aW9uIGdldFNlcU51bWJlckdlbmVyYXRvcihzdGFydHNBdDogbnVtYmVyID0gMCk6ICgpID0+IG51bWJlciB7XG4gIGxldCBjdXJyZW50ID0gc3RhcnRzQXQ7XG4gIHJldHVybiAoKSA9PiBjdXJyZW50Kys7XG59XG5cbmV4cG9ydCB0eXBlIEkxOG5NZXRhID0ge1xuICBpZD86IHN0cmluZyxcbiAgZGVzY3JpcHRpb24/OiBzdHJpbmcsXG4gIG1lYW5pbmc/OiBzdHJpbmdcbn07XG5cbi8qKlxuICogSTE4bkNvbnRleHQgaXMgYSBoZWxwZXIgY2xhc3Mgd2hpY2gga2VlcHMgdHJhY2sgb2YgYWxsIGkxOG4tcmVsYXRlZCBhc3BlY3RzXG4gKiAoYWNjdW11bGF0ZXMgY29udGVudCwgYmluZGluZ3MsIGV0YykgYmV0d2VlbiBpMThuU3RhcnQgYW5kIGkxOG5FbmQgaW5zdHJ1Y3Rpb25zLlxuICpcbiAqIFdoZW4gd2UgZW50ZXIgYSBuZXN0ZWQgdGVtcGxhdGUsIHRoZSB0b3AtbGV2ZWwgY29udGV4dCBpcyBiZWluZyBwYXNzZWQgZG93blxuICogdG8gdGhlIG5lc3RlZCBjb21wb25lbnQsIHdoaWNoIHVzZXMgdGhpcyBjb250ZXh0IHRvIGdlbmVyYXRlIGEgY2hpbGQgaW5zdGFuY2VcbiAqIG9mIEkxOG5Db250ZXh0IGNsYXNzICh0byBoYW5kbGUgbmVzdGVkIHRlbXBsYXRlKSBhbmQgYXQgdGhlIGVuZCwgcmVjb25jaWxlcyBpdCBiYWNrXG4gKiB3aXRoIHRoZSBwYXJlbnQgY29udGV4dC5cbiAqL1xuZXhwb3J0IGNsYXNzIEkxOG5Db250ZXh0IHtcbiAgcHJpdmF0ZSBpZDogbnVtYmVyO1xuICBwcml2YXRlIGNvbnRlbnQ6IHN0cmluZyA9ICcnO1xuICBwcml2YXRlIGJpbmRpbmdzID0gbmV3IFNldDxvLkV4cHJlc3Npb24+KCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIGluZGV4OiBudW1iZXIsIHByaXZhdGUgdGVtcGxhdGVJbmRleDogbnVtYmVyfG51bGwsIHByaXZhdGUgcmVmOiBhbnksXG4gICAgICBwcml2YXRlIGxldmVsOiBudW1iZXIgPSAwLCBwcml2YXRlIHVuaXF1ZUlkR2VuPzogKCkgPT4gbnVtYmVyKSB7XG4gICAgdGhpcy51bmlxdWVJZEdlbiA9IHVuaXF1ZUlkR2VuIHx8IGdldFNlcU51bWJlckdlbmVyYXRvcigpO1xuICAgIHRoaXMuaWQgPSB0aGlzLnVuaXF1ZUlkR2VuKCk7XG4gIH1cblxuICBwcml2YXRlIHdyYXAoc3ltYm9sOiBzdHJpbmcsIGVsZW1lbnRJbmRleDogbnVtYmVyLCBjb250ZXh0SWQ6IG51bWJlciwgY2xvc2VkPzogYm9vbGVhbikge1xuICAgIGNvbnN0IHN0YXRlID0gY2xvc2VkID8gJy8nIDogJyc7XG4gICAgcmV0dXJuIHdyYXBJMThuUGxhY2Vob2xkZXIoYCR7c3RhdGV9JHtzeW1ib2x9JHtlbGVtZW50SW5kZXh9YCwgY29udGV4dElkKTtcbiAgfVxuICBwcml2YXRlIGFwcGVuZChjb250ZW50OiBzdHJpbmcpIHsgdGhpcy5jb250ZW50ICs9IGNvbnRlbnQ7IH1cbiAgcHJpdmF0ZSBnZW5UZW1wbGF0ZVBhdHRlcm4oY29udGV4dElkOiBudW1iZXJ8c3RyaW5nLCB0ZW1wbGF0ZUlkOiBudW1iZXJ8c3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gd3JhcEkxOG5QbGFjZWhvbGRlcihgdG1wbDoke2NvbnRleHRJZH06JHt0ZW1wbGF0ZUlkfWApO1xuICB9XG5cbiAgZ2V0SWQoKSB7IHJldHVybiB0aGlzLmlkOyB9XG4gIGdldFJlZigpIHsgcmV0dXJuIHRoaXMucmVmOyB9XG4gIGdldEluZGV4KCkgeyByZXR1cm4gdGhpcy5pbmRleDsgfVxuICBnZXRDb250ZW50KCkgeyByZXR1cm4gdGhpcy5jb250ZW50OyB9XG4gIGdldFRlbXBsYXRlSW5kZXgoKSB7IHJldHVybiB0aGlzLnRlbXBsYXRlSW5kZXg7IH1cblxuICBnZXRCaW5kaW5ncygpIHsgcmV0dXJuIHRoaXMuYmluZGluZ3M7IH1cbiAgYXBwZW5kQmluZGluZyhiaW5kaW5nOiBvLkV4cHJlc3Npb24pIHsgdGhpcy5iaW5kaW5ncy5hZGQoYmluZGluZyk7IH1cblxuICBpc1Jvb3QoKSB7IHJldHVybiB0aGlzLmxldmVsID09PSAwOyB9XG4gIGlzUmVzb2x2ZWQoKSB7XG4gICAgY29uc3QgcmVnZXggPSBuZXcgUmVnRXhwKHRoaXMuZ2VuVGVtcGxhdGVQYXR0ZXJuKCdcXFxcZCsnLCAnXFxcXGQrJykpO1xuICAgIHJldHVybiAhcmVnZXgudGVzdCh0aGlzLmNvbnRlbnQpO1xuICB9XG5cbiAgYXBwZW5kVGV4dChjb250ZW50OiBzdHJpbmcpIHsgdGhpcy5hcHBlbmQoY29udGVudC50cmltKCkpOyB9XG4gIGFwcGVuZFRlbXBsYXRlKGluZGV4OiBudW1iZXIpIHsgdGhpcy5hcHBlbmQodGhpcy5nZW5UZW1wbGF0ZVBhdHRlcm4odGhpcy5pZCwgaW5kZXgpKTsgfVxuICBhcHBlbmRFbGVtZW50KGVsZW1lbnRJbmRleDogbnVtYmVyLCBjbG9zZWQ/OiBib29sZWFuKSB7XG4gICAgdGhpcy5hcHBlbmQodGhpcy53cmFwKCcjJywgZWxlbWVudEluZGV4LCB0aGlzLmlkLCBjbG9zZWQpKTtcbiAgfVxuXG4gIGZvcmtDaGlsZENvbnRleHQoaW5kZXg6IG51bWJlciwgdGVtcGxhdGVJbmRleDogbnVtYmVyKSB7XG4gICAgcmV0dXJuIG5ldyBJMThuQ29udGV4dChpbmRleCwgdGVtcGxhdGVJbmRleCwgdGhpcy5yZWYsIHRoaXMubGV2ZWwgKyAxLCB0aGlzLnVuaXF1ZUlkR2VuKTtcbiAgfVxuICByZWNvbmNpbGVDaGlsZENvbnRleHQoY29udGV4dDogSTE4bkNvbnRleHQpIHtcbiAgICBjb25zdCBpZCA9IGNvbnRleHQuZ2V0SWQoKTtcbiAgICBjb25zdCBjb250ZW50ID0gY29udGV4dC5nZXRDb250ZW50KCk7XG4gICAgY29uc3QgdGVtcGxhdGVJbmRleCA9IGNvbnRleHQuZ2V0VGVtcGxhdGVJbmRleCgpICE7XG4gICAgY29uc3QgcGF0dGVybiA9IG5ldyBSZWdFeHAodGhpcy5nZW5UZW1wbGF0ZVBhdHRlcm4odGhpcy5pZCwgdGVtcGxhdGVJbmRleCkpO1xuICAgIGNvbnN0IHJlcGxhY2VtZW50ID1cbiAgICAgICAgYCR7dGhpcy53cmFwKCcqJywgdGVtcGxhdGVJbmRleCwgaWQpfSR7Y29udGVudH0ke3RoaXMud3JhcCgnKicsIHRlbXBsYXRlSW5kZXgsIGlkLCB0cnVlKX1gO1xuICAgIHRoaXMuY29udGVudCA9IHRoaXMuY29udGVudC5yZXBsYWNlKHBhdHRlcm4sIHJlcGxhY2VtZW50KTtcbiAgfVxufSJdfQ==
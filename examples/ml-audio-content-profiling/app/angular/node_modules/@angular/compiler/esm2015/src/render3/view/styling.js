/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Parses string representation of a style and converts it into object literal.
 *
 * @param value string representation of style as used in the `style` attribute in HTML.
 *   Example: `color: red; height: auto`.
 * @returns an object literal. `{ color: 'red', height: 'auto'}`.
 */
export function parseStyle(value) {
    const styles = {};
    let i = 0;
    let parenDepth = 0;
    let quote = 0 /* QuoteNone */;
    let valueStart = 0;
    let propStart = 0;
    let currentProp = null;
    let valueHasQuotes = false;
    while (i < value.length) {
        const token = value.charCodeAt(i++);
        switch (token) {
            case 40 /* OpenParen */:
                parenDepth++;
                break;
            case 41 /* CloseParen */:
                parenDepth--;
                break;
            case 39 /* QuoteSingle */:
                // valueStart needs to be there since prop values don't
                // have quotes in CSS
                valueHasQuotes = valueHasQuotes || valueStart > 0;
                if (quote === 0 /* QuoteNone */) {
                    quote = 39 /* QuoteSingle */;
                }
                else if (quote === 39 /* QuoteSingle */ && value.charCodeAt(i - 1) !== 92 /* BackSlash */) {
                    quote = 0 /* QuoteNone */;
                }
                break;
            case 34 /* QuoteDouble */:
                // same logic as above
                valueHasQuotes = valueHasQuotes || valueStart > 0;
                if (quote === 0 /* QuoteNone */) {
                    quote = 34 /* QuoteDouble */;
                }
                else if (quote === 34 /* QuoteDouble */ && value.charCodeAt(i - 1) !== 92 /* BackSlash */) {
                    quote = 0 /* QuoteNone */;
                }
                break;
            case 58 /* Colon */:
                if (!currentProp && parenDepth === 0 && quote === 0 /* QuoteNone */) {
                    currentProp = hyphenate(value.substring(propStart, i - 1).trim());
                    valueStart = i;
                }
                break;
            case 59 /* Semicolon */:
                if (currentProp && valueStart > 0 && parenDepth === 0 && quote === 0 /* QuoteNone */) {
                    const styleVal = value.substring(valueStart, i - 1).trim();
                    styles[currentProp] = valueHasQuotes ? stripUnnecessaryQuotes(styleVal) : styleVal;
                    propStart = i;
                    valueStart = 0;
                    currentProp = null;
                    valueHasQuotes = false;
                }
                break;
        }
    }
    if (currentProp && valueStart) {
        const styleVal = value.substr(valueStart).trim();
        styles[currentProp] = valueHasQuotes ? stripUnnecessaryQuotes(styleVal) : styleVal;
    }
    return styles;
}
export function stripUnnecessaryQuotes(value) {
    const qS = value.charCodeAt(0);
    const qE = value.charCodeAt(value.length - 1);
    if (qS == qE && (qS == 39 /* QuoteSingle */ || qS == 34 /* QuoteDouble */)) {
        const tempValue = value.substring(1, value.length - 1);
        // special case to avoid using a multi-quoted string that was just chomped
        // (e.g. `font-family: "Verdana", "sans-serif"`)
        if (tempValue.indexOf('\'') == -1 && tempValue.indexOf('"') == -1) {
            value = tempValue;
        }
    }
    return value;
}
export function hyphenate(value) {
    return value.replace(/[a-z][A-Z]/g, v => {
        return v.charAt(0) + '-' + v.charAt(1);
    }).toLowerCase();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyL3NyYy9yZW5kZXIzL3ZpZXcvc3R5bGluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFjSDs7Ozs7O0dBTUc7QUFDSCxNQUFNLFVBQVUsVUFBVSxDQUFDLEtBQWE7SUFDdEMsTUFBTSxNQUFNLEdBQXlCLEVBQUUsQ0FBQztJQUV4QyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDVixJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUM7SUFDbkIsSUFBSSxLQUFLLG9CQUF1QixDQUFDO0lBQ2pDLElBQUksVUFBVSxHQUFHLENBQUMsQ0FBQztJQUNuQixJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUM7SUFDbEIsSUFBSSxXQUFXLEdBQWdCLElBQUksQ0FBQztJQUNwQyxJQUFJLGNBQWMsR0FBRyxLQUFLLENBQUM7SUFDM0IsT0FBTyxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRTtRQUN2QixNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxDQUFTLENBQUM7UUFDNUMsUUFBUSxLQUFLLEVBQUU7WUFDYjtnQkFDRSxVQUFVLEVBQUUsQ0FBQztnQkFDYixNQUFNO1lBQ1I7Z0JBQ0UsVUFBVSxFQUFFLENBQUM7Z0JBQ2IsTUFBTTtZQUNSO2dCQUNFLHVEQUF1RDtnQkFDdkQscUJBQXFCO2dCQUNyQixjQUFjLEdBQUcsY0FBYyxJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUM7Z0JBQ2xELElBQUksS0FBSyxzQkFBbUIsRUFBRTtvQkFDNUIsS0FBSyx1QkFBbUIsQ0FBQztpQkFDMUI7cUJBQU0sSUFBSSxLQUFLLHlCQUFxQixJQUFJLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyx1QkFBbUIsRUFBRTtvQkFDbkYsS0FBSyxvQkFBaUIsQ0FB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QyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN6QyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUMvQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5jb25zdCBlbnVtIENoYXIge1xuICBPcGVuUGFyZW4gPSA0MCxcbiAgQ2xvc2VQYXJlbiA9IDQxLFxuICBDb2xvbiA9IDU4LFxuICBTZW1pY29sb24gPSA1OSxcbiAgQmFja1NsYXNoID0gOTIsXG4gIFF1b3RlTm9uZSA9IDAsICAvLyBpbmRpY2F0aW5nIHdlIGFyZSBub3QgaW5zaWRlIGEgcXVvdGVcbiAgUXVvdGVEb3VibGUgPSAzNCxcbiAgUXVvdGVTaW5nbGUgPSAzOSxcbn1cblxuXG4vKipcbiAqIFBhcnNlcyBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgYSBzdHlsZSBhbmQgY29udmVydHMgaXQgaW50byBvYmplY3QgbGl0ZXJhbC5cbiAqXG4gKiBAcGFyYW0gdmFsdWUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHN0eWxlIGFzIHVzZWQgaW4gdGhlIGBzdHlsZWAgYXR0cmlidXRlIGluIEhUTUwuXG4gKiAgIEV4YW1wbGU6IGBjb2xvcjogcmVkOyBoZWlnaHQ6IGF1dG9gLlxuICogQHJldHVybnMgYW4gb2JqZWN0IGxpdGVyYWwuIGB7IGNvbG9yOiAncmVkJywgaGVpZ2h0OiAnYXV0byd9YC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlU3R5bGUodmFsdWU6IHN0cmluZyk6IHtba2V5OiBzdHJpbmddOiBhbnl9IHtcbiAgY29uc3Qgc3R5bGVzOiB7W2tleTogc3RyaW5nXTogYW55fSA9IHt9O1xuXG4gIGxldCBpID0gMDtcbiAgbGV0IHBhcmVuRGVwdGggPSAwO1xuICBsZXQgcXVvdGU6IENoYXIgPSBDaGFyLlF1b3RlTm9uZTtcbiAgbGV0IHZhbHVlU3RhcnQgPSAwO1xuICBsZXQgcHJvcFN0YXJ0ID0gMDtcbiAgbGV0IGN1cnJlbnRQcm9wOiBzdHJpbmd8bnVsbCA9IG51bGw7XG4gIGxldCB2YWx1ZUhhc1F1b3RlcyA9IGZhbHNlO1xuICB3aGlsZSAoaSA8IHZhbHVlLmxlbmd0aCkge1xuICAgIGNvbnN0IHRva2VuID0gdmFsdWUuY2hhckNvZGVBdChpKyspIGFzIENoYXI7XG4gICAgc3dpdGNoICh0b2tlbikge1xuICAgICAgY2FzZSBDaGFyLk9wZW5QYXJlbjpcbiAgICAgICAgcGFyZW5EZXB0aCsrO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ2hhci5DbG9zZVBhcmVuOlxuICAgICAgICBwYXJlbkRlcHRoLS07XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDaGFyLlF1b3RlU2luZ2xlOlxuICAgICAgICAvLyB2YWx1ZVN0YXJ0IG5lZWRzIHRvIGJlIHRoZXJlIHNpbmNlIHByb3AgdmFsdWVzIGRvbid0XG4gICAgICAgIC8vIGhhdmUgcXVvdGVzIGluIENTU1xuICAgICAgICB2YWx1ZUhhc1F1b3RlcyA9IHZhbHVlSGFzUXVvdGVzIHx8IHZhbHVlU3RhcnQgPiAwO1xuICAgICAgICBpZiAocXVvdGUgPT09IENoYXIuUXVvdGVOb25lKSB7XG4gICAgICAgICAgcXVvdGUgPSBDaGFyLlF1b3RlU2luZ2xlO1xuICAgICAgICB9IGVsc2UgaWYgKHF1b3RlID09PSBDaGFyLlF1b3RlU2luZ2xlICYmIHZhbHVlLmNoYXJDb2RlQXQoaSAtIDEpICE9PSBDaGFyLkJhY2tTbGFzaCkge1xuICAgICAgICAgIHF1b3RlID0gQ2hhci5RdW90ZU5vbmU7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIENoYXIuUXVvdGVEb3VibGU6XG4gICAgICAgIC8vIHNhbWUgbG9naWMgYXMgYWJvdmVcbiAgICAgICAgdmFsdWVIYXNRdW90ZXMgPSB2YWx1ZUhhc1F1b3RlcyB8fCB2YWx1ZVN0YXJ0ID4gMDtcbiAgICAgICAgaWYgKHF1b3RlID09PSBDaGFyLlF1b3RlTm9uZSkge1xuICAgICAgICAgIHF1b3RlID0gQ2hhci5RdW90ZURvdWJsZTtcbiAgICAgICAgfSBlbHNlIGlmIChxdW90ZSA9PT0gQ2hhci5RdW90ZURvdWJsZSAmJiB2YWx1ZS5jaGFyQ29kZUF0KGkgLSAxKSAhPT0gQ2hhci5CYWNrU2xhc2gpIHtcbiAgICAgICAgICBxdW90ZSA9IENoYXIuUXVvdGVOb25lO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDaGFyLkNvbG9uOlxuICAgICAgICBpZiAoIWN1cnJlbnRQcm9wICYmIHBhcmVuRGVwdGggPT09IDAgJiYgcXVvdGUgPT09IENoYXIuUXVvdGVOb25lKSB7XG4gICAgICAgICAgY3VycmVudFByb3AgPSBoeXBoZW5hdGUodmFsdWUuc3Vic3RyaW5nKHByb3BTdGFydCwgaSAtIDEpLnRyaW0oKSk7XG4gICAgICAgICAgdmFsdWVTdGFydCA9IGk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIENoYXIuU2VtaWNvbG9uOlxuICAgICAgICBpZiAoY3VycmVudFByb3AgJiYgdmFsdWVTdGFydCA+IDAgJiYgcGFyZW5EZXB0aCA9PT0gMCAmJiBxdW90ZSA9PT0gQ2hhci5RdW90ZU5vbmUpIHtcbiAgICAgICAgICBjb25zdCBzdHlsZVZhbCA9IHZhbHVlLnN1YnN0cmluZyh2YWx1ZVN0YXJ0LCBpIC0gMSkudHJpbSgpO1xuICAgICAgICAgIHN0eWxlc1tjdXJyZW50UHJvcF0gPSB2YWx1ZUhhc1F1b3RlcyA/IHN0cmlwVW5uZWNlc3NhcnlRdW90ZXMoc3R5bGVWYWwpIDogc3R5bGVWYWw7XG4gICAgICAgICAgcHJvcFN0YXJ0ID0gaTtcbiAgICAgICAgICB2YWx1ZVN0YXJ0ID0gMDtcbiAgICAgICAgICBjdXJyZW50UHJvcCA9IG51bGw7XG4gICAgICAgICAgdmFsdWVIYXNRdW90ZXMgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBpZiAoY3VycmVudFByb3AgJiYgdmFsdWVTdGFydCkge1xuICAgIGNvbnN0IHN0eWxlVmFsID0gdmFsdWUuc3Vic3RyKHZhbHVlU3RhcnQpLnRyaW0oKTtcbiAgICBzdHlsZXNbY3VycmVudFByb3BdID0gdmFsdWVIYXNRdW90ZXMgPyBzdHJpcFVubmVjZXNzYXJ5UXVvdGVzKHN0eWxlVmFsKSA6IHN0eWxlVmFsO1xuICB9XG5cbiAgcmV0dXJuIHN0eWxlcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0cmlwVW5uZWNlc3NhcnlRdW90ZXModmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHFTID0gdmFsdWUuY2hhckNvZGVBdCgwKTtcbiAgY29uc3QgcUUgPSB2YWx1ZS5jaGFyQ29kZUF0KHZhbHVlLmxlbmd0aCAtIDEpO1xuICBpZiAocVMgPT0gcUUgJiYgKHFTID09IENoYXIuUXVvdGVTaW5nbGUgfHwgcVMgPT0gQ2hhci5RdW90ZURvdWJsZSkpIHtcbiAgICBjb25zdCB0ZW1wVmFsdWUgPSB2YWx1ZS5zdWJzdHJpbmcoMSwgdmFsdWUubGVuZ3RoIC0gMSk7XG4gICAgLy8gc3BlY2lhbCBjYXNlIHRvIGF2b2lkIHVzaW5nIGEgbXVsdGktcXVvdGVkIHN0cmluZyB0aGF0IHdhcyBqdXN0IGNob21wZWRcbiAgICAvLyAoZS5nLiBgZm9udC1mYW1pbHk6IFwiVmVyZGFuYVwiLCBcInNhbnMtc2VyaWZcImApXG4gICAgaWYgKHRlbXBWYWx1ZS5pbmRleE9mKCdcXCcnKSA9PSAtMSAmJiB0ZW1wVmFsdWUuaW5kZXhPZignXCInKSA9PSAtMSkge1xuICAgICAgdmFsdWUgPSB0ZW1wVmFsdWU7XG4gICAgfVxuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGh5cGhlbmF0ZSh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoL1thLXpdW0EtWl0vZywgdiA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHYuY2hhckF0KDApICsgJy0nICsgdi5jaGFyQXQoMSk7XG4gICAgICAgICAgICAgIH0pLnRvTG93ZXJDYXNlKCk7XG59XG4iXX0=
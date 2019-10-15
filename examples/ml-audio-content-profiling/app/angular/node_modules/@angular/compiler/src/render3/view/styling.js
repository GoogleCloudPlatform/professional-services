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
        define("@angular/compiler/src/render3/view/styling", ["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Parses string representation of a style and converts it into object literal.
     *
     * @param value string representation of style as used in the `style` attribute in HTML.
     *   Example: `color: red; height: auto`.
     * @returns an object literal. `{ color: 'red', height: 'auto'}`.
     */
    function parseStyle(value) {
        var styles = {};
        var i = 0;
        var parenDepth = 0;
        var quote = 0 /* QuoteNone */;
        var valueStart = 0;
        var propStart = 0;
        var currentProp = null;
        var valueHasQuotes = false;
        while (i < value.length) {
            var token = value.charCodeAt(i++);
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
                        var styleVal = value.substring(valueStart, i - 1).trim();
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
            var styleVal = value.substr(valueStart).trim();
            styles[currentProp] = valueHasQuotes ? stripUnnecessaryQuotes(styleVal) : styleVal;
        }
        return styles;
    }
    exports.parseStyle = parseStyle;
    function stripUnnecessaryQuotes(value) {
        var qS = value.charCodeAt(0);
        var qE = value.charCodeAt(value.length - 1);
        if (qS == qE && (qS == 39 /* QuoteSingle */ || qS == 34 /* QuoteDouble */)) {
            var tempValue = value.substring(1, value.length - 1);
            // special case to avoid using a multi-quoted string that was just chomped
            // (e.g. `font-family: "Verdana", "sans-serif"`)
            if (tempValue.indexOf('\'') == -1 && tempValue.indexOf('"') == -1) {
                value = tempValue;
            }
        }
        return value;
    }
    exports.stripUnnecessaryQuotes = stripUnnecessaryQuotes;
    function hyphenate(value) {
        return value.replace(/[a-z][A-Z]/g, function (v) {
            return v.charAt(0) + '-' + v.charAt(1);
        }).toLowerCase();
    }
    exports.hyphenate = hyphenate;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyL3NyYy9yZW5kZXIzL3ZpZXcvc3R5bGluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQWNIOzs7Ozs7T0FNRztJQUNILFNBQWdCLFVBQVUsQ0FBQyxLQUFhO1FBQ3RDLElBQU0sTUFBTSxHQUF5QixFQUFFLENBQUM7UUFFeEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ1YsSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFDO1FBQ25CLElBQUksS0FBSyxvQkFBdUIsQ0FBQztRQUNqQyxJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUM7UUFDbkIsSUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFDO1FBQ2xCLElBQUksV0FBVyxHQUFnQixJQUFJLENBQUM7UUFDcEMsSUFBSSxjQUFjLEdBQUcsS0FBSyxDQUFDO1FBQzNCLE9BQU8sQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUU7WUFDdkIsSUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBUyxDQUFDO1lBQzVDLFFBQVEsS0FBSyxFQUFFO2dCQUNiO29CQUNFLFVBQVUsRUFBRSxDQUFDO29CQUNiLE1BQU07Z0JBQ1I7b0JBQ0UsVUFBVSxFQUFFLENBQUM7b0JBQ2IsTUFBTTtnQkFDUjtvQkFDRSx1REFBdUQ7b0JBQ3ZELHFCQUFxQjtvQkFDckIsY0FBYyxHQUFHLGNBQWMsSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFDO29CQUNsRCxJQUFJLEtBQUssc0JBQW1CLEVBQUU7d0JBQzVCLEtBQUssdUJBQW1CLENBQUM7cUJBQzFCO3lCQUFNLElBQUksS0FBSyx5QkFBcUIsSUFBSSxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsdUJBQW1CLEVBQUU7d0JBQ25GLEtBQUssb0JBQWlCLENBQUM7cUJBQ3hCO29CQUNELE1BQU07Z0JBQ1I7b0JBQ0Usc0JBQXNCO29CQUN0QixjQUFjLEdBQUcsY0FBYyxJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUM7b0JBQ2xELElBQUksS0FBSyxzQkFBbUIsRUFBRTt3QkFDNUIsS0FBSyx1QkFBbUIsQ0FBQztxQkFDMUI7eUJBQU0sSUFBSSxLQUFLLHlCQUFxQixJQUFJLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyx1QkFBbUIsRUFBRTt3QkFDbkYsS0FBSyxvQkFBaUIsQ0FBQztxQkFDeEI7b0JBQ0QsTUFBTTtnQkFDUjtvQkFDRSxJQUFJLENBQUMsV0FBVyxJQUFJLFVBQVUsS0FBSyxDQUFDLElBQUksS0FBSyxzQkFBbUIsRUFBRTt3QkFDaEUsV0FBVyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQzt3QkFDbEUsVUFBVSxHQUFHLENBQUMsQ0FBQztxQkFDaEI7b0JBQ0QsTUFBTTtnQkFDUjtvQkFDRSxJQUFJLFdBQVcsSUFBSSxVQUFVLEdBQUcsQ0FBQyxJQUFJLFVBQVUsS0FBSyxDQUFDLElBQUksS0FBSyxzQkFBbUIsRUFBRTt3QkFDakYsSUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO3dCQUMzRCxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsY0FBYyxDQUFDLENBQUMsQ0FBQyxzQkFBc0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDO3dCQUNuRixTQUFTLEdBQUcsQ0FBQyxDQUFDO3dCQUNkLFVBQVUsR0FBRyxDQUFDLENBQUM7d0JBQ2YsV0FBVyxHQUFHLElBQUksQ0FBQzt3QkFDbkIsY0FBYyxHQUFHLEtBQUssQ0FBQztxQkFDeEI7b0JBQ0QsTUFBTTthQUNUO1NBQ0Y7UUFFRCxJQUFJLFdBQVcsSUFBSSxVQUFVLEVBQUU7WUFDN0IsSUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNqRCxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsY0FBYyxDQUFDLENBQUMsQ0FBQyxzQkFBc0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDO1NBQ3BGO1FBRUQsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQztJQS9ERCxnQ0ErREM7SUFFRCxTQUFnQixzQkFBc0IsQ0FBQyxLQUFhO1FBQ2xELElBQU0sRUFBRSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDL0IsSUFBTSxFQUFFLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQzlDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsd0JBQW9CLElBQUksRUFBRSx3QkFBb0IsQ0FBQyxFQUFFO1lBQ2xFLElBQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDdkQsMEVBQTBFO1lBQzFFLGdEQUFnRDtZQUNoRCxJQUFJLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksU0FBUyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRTtnQkFDakUsS0FBSyxHQUFHLFNBQVMsQ0FBQzthQUNuQjtTQUNGO1FBQ0QsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBWkQsd0RBWUM7SUFFRCxTQUFnQixTQUFTLENBQUMsS0FBYTtRQUNyQyxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLFVBQUEsQ0FBQztZQUN2QixPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDekMsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDL0IsQ0FBQztJQUpELDhCQUlDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5jb25zdCBlbnVtIENoYXIge1xuICBPcGVuUGFyZW4gPSA0MCxcbiAgQ2xvc2VQYXJlbiA9IDQxLFxuICBDb2xvbiA9IDU4LFxuICBTZW1pY29sb24gPSA1OSxcbiAgQmFja1NsYXNoID0gOTIsXG4gIFF1b3RlTm9uZSA9IDAsICAvLyBpbmRpY2F0aW5nIHdlIGFyZSBub3QgaW5zaWRlIGEgcXVvdGVcbiAgUXVvdGVEb3VibGUgPSAzNCxcbiAgUXVvdGVTaW5nbGUgPSAzOSxcbn1cblxuXG4vKipcbiAqIFBhcnNlcyBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgYSBzdHlsZSBhbmQgY29udmVydHMgaXQgaW50byBvYmplY3QgbGl0ZXJhbC5cbiAqXG4gKiBAcGFyYW0gdmFsdWUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHN0eWxlIGFzIHVzZWQgaW4gdGhlIGBzdHlsZWAgYXR0cmlidXRlIGluIEhUTUwuXG4gKiAgIEV4YW1wbGU6IGBjb2xvcjogcmVkOyBoZWlnaHQ6IGF1dG9gLlxuICogQHJldHVybnMgYW4gb2JqZWN0IGxpdGVyYWwuIGB7IGNvbG9yOiAncmVkJywgaGVpZ2h0OiAnYXV0byd9YC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlU3R5bGUodmFsdWU6IHN0cmluZyk6IHtba2V5OiBzdHJpbmddOiBhbnl9IHtcbiAgY29uc3Qgc3R5bGVzOiB7W2tleTogc3RyaW5nXTogYW55fSA9IHt9O1xuXG4gIGxldCBpID0gMDtcbiAgbGV0IHBhcmVuRGVwdGggPSAwO1xuICBsZXQgcXVvdGU6IENoYXIgPSBDaGFyLlF1b3RlTm9uZTtcbiAgbGV0IHZhbHVlU3RhcnQgPSAwO1xuICBsZXQgcHJvcFN0YXJ0ID0gMDtcbiAgbGV0IGN1cnJlbnRQcm9wOiBzdHJpbmd8bnVsbCA9IG51bGw7XG4gIGxldCB2YWx1ZUhhc1F1b3RlcyA9IGZhbHNlO1xuICB3aGlsZSAoaSA8IHZhbHVlLmxlbmd0aCkge1xuICAgIGNvbnN0IHRva2VuID0gdmFsdWUuY2hhckNvZGVBdChpKyspIGFzIENoYXI7XG4gICAgc3dpdGNoICh0b2tlbikge1xuICAgICAgY2FzZSBDaGFyLk9wZW5QYXJlbjpcbiAgICAgICAgcGFyZW5EZXB0aCsrO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ2hhci5DbG9zZVBhcmVuOlxuICAgICAgICBwYXJlbkRlcHRoLS07XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDaGFyLlF1b3RlU2luZ2xlOlxuICAgICAgICAvLyB2YWx1ZVN0YXJ0IG5lZWRzIHRvIGJlIHRoZXJlIHNpbmNlIHByb3AgdmFsdWVzIGRvbid0XG4gICAgICAgIC8vIGhhdmUgcXVvdGVzIGluIENTU1xuICAgICAgICB2YWx1ZUhhc1F1b3RlcyA9IHZhbHVlSGFzUXVvdGVzIHx8IHZhbHVlU3RhcnQgPiAwO1xuICAgICAgICBpZiAocXVvdGUgPT09IENoYXIuUXVvdGVOb25lKSB7XG4gICAgICAgICAgcXVvdGUgPSBDaGFyLlF1b3RlU2luZ2xlO1xuICAgICAgICB9IGVsc2UgaWYgKHF1b3RlID09PSBDaGFyLlF1b3RlU2luZ2xlICYmIHZhbHVlLmNoYXJDb2RlQXQoaSAtIDEpICE9PSBDaGFyLkJhY2tTbGFzaCkge1xuICAgICAgICAgIHF1b3RlID0gQ2hhci5RdW90ZU5vbmU7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIENoYXIuUXVvdGVEb3VibGU6XG4gICAgICAgIC8vIHNhbWUgbG9naWMgYXMgYWJvdmVcbiAgICAgICAgdmFsdWVIYXNRdW90ZXMgPSB2YWx1ZUhhc1F1b3RlcyB8fCB2YWx1ZVN0YXJ0ID4gMDtcbiAgICAgICAgaWYgKHF1b3RlID09PSBDaGFyLlF1b3RlTm9uZSkge1xuICAgICAgICAgIHF1b3RlID0gQ2hhci5RdW90ZURvdWJsZTtcbiAgICAgICAgfSBlbHNlIGlmIChxdW90ZSA9PT0gQ2hhci5RdW90ZURvdWJsZSAmJiB2YWx1ZS5jaGFyQ29kZUF0KGkgLSAxKSAhPT0gQ2hhci5CYWNrU2xhc2gpIHtcbiAgICAgICAgICBxdW90ZSA9IENoYXIuUXVvdGVOb25lO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDaGFyLkNvbG9uOlxuICAgICAgICBpZiAoIWN1cnJlbnRQcm9wICYmIHBhcmVuRGVwdGggPT09IDAgJiYgcXVvdGUgPT09IENoYXIuUXVvdGVOb25lKSB7XG4gICAgICAgICAgY3VycmVudFByb3AgPSBoeXBoZW5hdGUodmFsdWUuc3Vic3RyaW5nKHByb3BTdGFydCwgaSAtIDEpLnRyaW0oKSk7XG4gICAgICAgICAgdmFsdWVTdGFydCA9IGk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIENoYXIuU2VtaWNvbG9uOlxuICAgICAgICBpZiAoY3VycmVudFByb3AgJiYgdmFsdWVTdGFydCA+IDAgJiYgcGFyZW5EZXB0aCA9PT0gMCAmJiBxdW90ZSA9PT0gQ2hhci5RdW90ZU5vbmUpIHtcbiAgICAgICAgICBjb25zdCBzdHlsZVZhbCA9IHZhbHVlLnN1YnN0cmluZyh2YWx1ZVN0YXJ0LCBpIC0gMSkudHJpbSgpO1xuICAgICAgICAgIHN0eWxlc1tjdXJyZW50UHJvcF0gPSB2YWx1ZUhhc1F1b3RlcyA/IHN0cmlwVW5uZWNlc3NhcnlRdW90ZXMoc3R5bGVWYWwpIDogc3R5bGVWYWw7XG4gICAgICAgICAgcHJvcFN0YXJ0ID0gaTtcbiAgICAgICAgICB2YWx1ZVN0YXJ0ID0gMDtcbiAgICAgICAgICBjdXJyZW50UHJvcCA9IG51bGw7XG4gICAgICAgICAgdmFsdWVIYXNRdW90ZXMgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBpZiAoY3VycmVudFByb3AgJiYgdmFsdWVTdGFydCkge1xuICAgIGNvbnN0IHN0eWxlVmFsID0gdmFsdWUuc3Vic3RyKHZhbHVlU3RhcnQpLnRyaW0oKTtcbiAgICBzdHlsZXNbY3VycmVudFByb3BdID0gdmFsdWVIYXNRdW90ZXMgPyBzdHJpcFVubmVjZXNzYXJ5UXVvdGVzKHN0eWxlVmFsKSA6IHN0eWxlVmFsO1xuICB9XG5cbiAgcmV0dXJuIHN0eWxlcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0cmlwVW5uZWNlc3NhcnlRdW90ZXModmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHFTID0gdmFsdWUuY2hhckNvZGVBdCgwKTtcbiAgY29uc3QgcUUgPSB2YWx1ZS5jaGFyQ29kZUF0KHZhbHVlLmxlbmd0aCAtIDEpO1xuICBpZiAocVMgPT0gcUUgJiYgKHFTID09IENoYXIuUXVvdGVTaW5nbGUgfHwgcVMgPT0gQ2hhci5RdW90ZURvdWJsZSkpIHtcbiAgICBjb25zdCB0ZW1wVmFsdWUgPSB2YWx1ZS5zdWJzdHJpbmcoMSwgdmFsdWUubGVuZ3RoIC0gMSk7XG4gICAgLy8gc3BlY2lhbCBjYXNlIHRvIGF2b2lkIHVzaW5nIGEgbXVsdGktcXVvdGVkIHN0cmluZyB0aGF0IHdhcyBqdXN0IGNob21wZWRcbiAgICAvLyAoZS5nLiBgZm9udC1mYW1pbHk6IFwiVmVyZGFuYVwiLCBcInNhbnMtc2VyaWZcImApXG4gICAgaWYgKHRlbXBWYWx1ZS5pbmRleE9mKCdcXCcnKSA9PSAtMSAmJiB0ZW1wVmFsdWUuaW5kZXhPZignXCInKSA9PSAtMSkge1xuICAgICAgdmFsdWUgPSB0ZW1wVmFsdWU7XG4gICAgfVxuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGh5cGhlbmF0ZSh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoL1thLXpdW0EtWl0vZywgdiA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHYuY2hhckF0KDApICsgJy0nICsgdi5jaGFyQXQoMSk7XG4gICAgICAgICAgICAgIH0pLnRvTG93ZXJDYXNlKCk7XG59XG4iXX0=
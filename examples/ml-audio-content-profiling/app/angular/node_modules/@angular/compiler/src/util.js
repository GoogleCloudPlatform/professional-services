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
        define("@angular/compiler/src/util", ["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var DASH_CASE_REGEXP = /-+([a-z0-9])/g;
    function dashCaseToCamelCase(input) {
        return input.replace(DASH_CASE_REGEXP, function () {
            var m = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                m[_i] = arguments[_i];
            }
            return m[1].toUpperCase();
        });
    }
    exports.dashCaseToCamelCase = dashCaseToCamelCase;
    function splitAtColon(input, defaultValues) {
        return _splitAt(input, ':', defaultValues);
    }
    exports.splitAtColon = splitAtColon;
    function splitAtPeriod(input, defaultValues) {
        return _splitAt(input, '.', defaultValues);
    }
    exports.splitAtPeriod = splitAtPeriod;
    function _splitAt(input, character, defaultValues) {
        var characterIndex = input.indexOf(character);
        if (characterIndex == -1)
            return defaultValues;
        return [input.slice(0, characterIndex).trim(), input.slice(characterIndex + 1).trim()];
    }
    function visitValue(value, visitor, context) {
        if (Array.isArray(value)) {
            return visitor.visitArray(value, context);
        }
        if (isStrictStringMap(value)) {
            return visitor.visitStringMap(value, context);
        }
        if (value == null || typeof value == 'string' || typeof value == 'number' ||
            typeof value == 'boolean') {
            return visitor.visitPrimitive(value, context);
        }
        return visitor.visitOther(value, context);
    }
    exports.visitValue = visitValue;
    function isDefined(val) {
        return val !== null && val !== undefined;
    }
    exports.isDefined = isDefined;
    function noUndefined(val) {
        return val === undefined ? null : val;
    }
    exports.noUndefined = noUndefined;
    var ValueTransformer = /** @class */ (function () {
        function ValueTransformer() {
        }
        ValueTransformer.prototype.visitArray = function (arr, context) {
            var _this = this;
            return arr.map(function (value) { return visitValue(value, _this, context); });
        };
        ValueTransformer.prototype.visitStringMap = function (map, context) {
            var _this = this;
            var result = {};
            Object.keys(map).forEach(function (key) { result[key] = visitValue(map[key], _this, context); });
            return result;
        };
        ValueTransformer.prototype.visitPrimitive = function (value, context) { return value; };
        ValueTransformer.prototype.visitOther = function (value, context) { return value; };
        return ValueTransformer;
    }());
    exports.ValueTransformer = ValueTransformer;
    exports.SyncAsync = {
        assertSync: function (value) {
            if (isPromise(value)) {
                throw new Error("Illegal state: value cannot be a promise");
            }
            return value;
        },
        then: function (value, cb) { return isPromise(value) ? value.then(cb) : cb(value); },
        all: function (syncAsyncValues) {
            return syncAsyncValues.some(isPromise) ? Promise.all(syncAsyncValues) : syncAsyncValues;
        }
    };
    function error(msg) {
        throw new Error("Internal Error: " + msg);
    }
    exports.error = error;
    function syntaxError(msg, parseErrors) {
        var error = Error(msg);
        error[ERROR_SYNTAX_ERROR] = true;
        if (parseErrors)
            error[ERROR_PARSE_ERRORS] = parseErrors;
        return error;
    }
    exports.syntaxError = syntaxError;
    var ERROR_SYNTAX_ERROR = 'ngSyntaxError';
    var ERROR_PARSE_ERRORS = 'ngParseErrors';
    function isSyntaxError(error) {
        return error[ERROR_SYNTAX_ERROR];
    }
    exports.isSyntaxError = isSyntaxError;
    function getParseErrors(error) {
        return error[ERROR_PARSE_ERRORS] || [];
    }
    exports.getParseErrors = getParseErrors;
    // Escape characters that have a special meaning in Regular Expressions
    function escapeRegExp(s) {
        return s.replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
    }
    exports.escapeRegExp = escapeRegExp;
    var STRING_MAP_PROTO = Object.getPrototypeOf({});
    function isStrictStringMap(obj) {
        return typeof obj === 'object' && obj !== null && Object.getPrototypeOf(obj) === STRING_MAP_PROTO;
    }
    function utf8Encode(str) {
        var encoded = '';
        for (var index = 0; index < str.length; index++) {
            var codePoint = str.charCodeAt(index);
            // decode surrogate
            // see https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
            if (codePoint >= 0xd800 && codePoint <= 0xdbff && str.length > (index + 1)) {
                var low = str.charCodeAt(index + 1);
                if (low >= 0xdc00 && low <= 0xdfff) {
                    index++;
                    codePoint = ((codePoint - 0xd800) << 10) + low - 0xdc00 + 0x10000;
                }
            }
            if (codePoint <= 0x7f) {
                encoded += String.fromCharCode(codePoint);
            }
            else if (codePoint <= 0x7ff) {
                encoded += String.fromCharCode(((codePoint >> 6) & 0x1F) | 0xc0, (codePoint & 0x3f) | 0x80);
            }
            else if (codePoint <= 0xffff) {
                encoded += String.fromCharCode((codePoint >> 12) | 0xe0, ((codePoint >> 6) & 0x3f) | 0x80, (codePoint & 0x3f) | 0x80);
            }
            else if (codePoint <= 0x1fffff) {
                encoded += String.fromCharCode(((codePoint >> 18) & 0x07) | 0xf0, ((codePoint >> 12) & 0x3f) | 0x80, ((codePoint >> 6) & 0x3f) | 0x80, (codePoint & 0x3f) | 0x80);
            }
        }
        return encoded;
    }
    exports.utf8Encode = utf8Encode;
    function stringify(token) {
        if (typeof token === 'string') {
            return token;
        }
        if (token instanceof Array) {
            return '[' + token.map(stringify).join(', ') + ']';
        }
        if (token == null) {
            return '' + token;
        }
        if (token.overriddenName) {
            return "" + token.overriddenName;
        }
        if (token.name) {
            return "" + token.name;
        }
        // WARNING: do not try to `JSON.stringify(token)` here
        // see https://github.com/angular/angular/issues/23440
        var res = token.toString();
        if (res == null) {
            return '' + res;
        }
        var newLineIndex = res.indexOf('\n');
        return newLineIndex === -1 ? res : res.substring(0, newLineIndex);
    }
    exports.stringify = stringify;
    /**
     * Lazily retrieves the reference value from a forwardRef.
     */
    function resolveForwardRef(type) {
        if (typeof type === 'function' && type.hasOwnProperty('__forward_ref__')) {
            return type();
        }
        else {
            return type;
        }
    }
    exports.resolveForwardRef = resolveForwardRef;
    /**
     * Determine if the argument is shaped like a Promise
     */
    function isPromise(obj) {
        // allow any Promise/A+ compliant thenable.
        // It's up to the caller to ensure that obj.then conforms to the spec
        return !!obj && typeof obj.then === 'function';
    }
    exports.isPromise = isPromise;
    var Version = /** @class */ (function () {
        function Version(full) {
            this.full = full;
            var splits = full.split('.');
            this.major = splits[0];
            this.minor = splits[1];
            this.patch = splits.slice(2).join('.');
        }
        return Version;
    }());
    exports.Version = Version;
    var __window = typeof window !== 'undefined' && window;
    var __self = typeof self !== 'undefined' && typeof WorkerGlobalScope !== 'undefined' &&
        self instanceof WorkerGlobalScope && self;
    var __global = typeof global !== 'undefined' && global;
    // Check __global first, because in Node tests both __global and __window may be defined and _global
    // should be __global in that case.
    var _global = __global || __window || __self;
    exports.global = _global;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyL3NyYy91dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBT0gsSUFBTSxnQkFBZ0IsR0FBRyxlQUFlLENBQUM7SUFFekMsU0FBZ0IsbUJBQW1CLENBQUMsS0FBYTtRQUMvQyxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEVBQUU7WUFBQyxXQUFXO2lCQUFYLFVBQVcsRUFBWCxxQkFBVyxFQUFYLElBQVc7Z0JBQVgsc0JBQVc7O1lBQUssT0FBQSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFO1FBQWxCLENBQWtCLENBQUMsQ0FBQztJQUM5RSxDQUFDO0lBRkQsa0RBRUM7SUFFRCxTQUFnQixZQUFZLENBQUMsS0FBYSxFQUFFLGFBQXVCO1FBQ2pFLE9BQU8sUUFBUSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsYUFBYSxDQUFDLENBQUM7SUFDN0MsQ0FBQztJQUZELG9DQUVDO0lBRUQsU0FBZ0IsYUFBYSxDQUFDLEtBQWEsRUFBRSxhQUF1QjtRQUNsRSxPQUFPLFFBQVEsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLGFBQWEsQ0FBQyxDQUFDO0lBQzdDLENBQUM7SUFGRCxzQ0FFQztJQUVELFNBQVMsUUFBUSxDQUFDLEtBQWEsRUFBRSxTQUFpQixFQUFFLGFBQXVCO1FBQ3pFLElBQU0sY0FBYyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDaEQsSUFBSSxjQUFjLElBQUksQ0FBQyxDQUFDO1lBQUUsT0FBTyxhQUFhLENBQUM7UUFDL0MsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLGNBQWMsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsY0FBYyxHQUFHLENBQUMs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LElBQUksQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDekMsQ0FBQztRQUNILGNBQUM7SUFBRCxDQUFDLEFBWEQsSUFXQztJQVhZLDBCQUFPO0lBd0JwQixJQUFNLFFBQVEsR0FBRyxPQUFPLE1BQU0sS0FBSyxXQUFXLElBQUksTUFBTSxDQUFDO0lBQ3pELElBQU0sTUFBTSxHQUFHLE9BQU8sSUFBSSxLQUFLLFdBQVcsSUFBSSxPQUFPLGlCQUFpQixLQUFLLFdBQVc7UUFDbEYsSUFBSSxZQUFZLGlCQUFpQixJQUFJLElBQUksQ0FBQztJQUM5QyxJQUFNLFFBQVEsR0FBRyxPQUFPLE1BQU0sS0FBSyxXQUFXLElBQUksTUFBTSxDQUFDO0lBRXpELG9HQUFvRztJQUNwRyxtQ0FBbUM7SUFDbkMsSUFBTSxPQUFPLEdBQTBCLFFBQVEsSUFBSSxRQUFRLElBQUksTUFBTSxDQUFDO0lBQ25ELHlCQUFNIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0NvbnN0YW50UG9vbH0gZnJvbSAnLi9jb25zdGFudF9wb29sJztcblxuaW1wb3J0ICogYXMgbyBmcm9tICcuL291dHB1dC9vdXRwdXRfYXN0JztcbmltcG9ydCB7UGFyc2VFcnJvcn0gZnJvbSAnLi9wYXJzZV91dGlsJztcblxuY29uc3QgREFTSF9DQVNFX1JFR0VYUCA9IC8tKyhbYS16MC05XSkvZztcblxuZXhwb3J0IGZ1bmN0aW9uIGRhc2hDYXNlVG9DYW1lbENhc2UoaW5wdXQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBpbnB1dC5yZXBsYWNlKERBU0hfQ0FTRV9SRUdFWFAsICguLi5tOiBhbnlbXSkgPT4gbVsxXS50b1VwcGVyQ2FzZSgpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNwbGl0QXRDb2xvbihpbnB1dDogc3RyaW5nLCBkZWZhdWx0VmFsdWVzOiBzdHJpbmdbXSk6IHN0cmluZ1tdIHtcbiAgcmV0dXJuIF9zcGxpdEF0KGlucHV0LCAnOicsIGRlZmF1bHRWYWx1ZXMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3BsaXRBdFBlcmlvZChpbnB1dDogc3RyaW5nLCBkZWZhdWx0VmFsdWVzOiBzdHJpbmdbXSk6IHN0cmluZ1tdIHtcbiAgcmV0dXJuIF9zcGxpdEF0KGlucHV0LCAnLicsIGRlZmF1bHRWYWx1ZXMpO1xufVxuXG5mdW5jdGlvbiBfc3BsaXRBdChpbnB1dDogc3RyaW5nLCBjaGFyYWN0ZXI6IHN0cmluZywgZGVmYXVsdFZhbHVlczogc3RyaW5nW10pOiBzdHJpbmdbXSB7XG4gIGNvbnN0IGNoYXJhY3RlckluZGV4ID0gaW5wdXQuaW5kZXhPZihjaGFyYWN0ZXIpO1xuICBpZiAoY2hhcmFjdGVySW5kZXggPT0gLTEpIHJldHVybiBkZWZhdWx0VmFsdWVzO1xuICByZXR1cm4gW2lucHV0LnNsaWNlKDAsIGNoYXJhY3RlckluZGV4KS50cmltKCksIGlucHV0LnNsaWNlKGNoYXJhY3RlckluZGV4ICsgMSkudHJpbSgpXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHZpc2l0VmFsdWUodmFsdWU6IGFueSwgdmlzaXRvcjogVmFsdWVWaXNpdG9yLCBjb250ZXh0OiBhbnkpOiBhbnkge1xuICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICByZXR1cm4gdmlzaXRvci52aXNpdEFycmF5KDxhbnlbXT52YWx1ZSwgY29udGV4dCk7XG4gIH1cblxuICBpZiAoaXNTdHJpY3RTdHJpbmdNYXAodmFsdWUpKSB7XG4gICAgcmV0dXJuIHZpc2l0b3IudmlzaXRTdHJpbmdNYXAoPHtba2V5OiBzdHJpbmddOiBhbnl9PnZhbHVlLCBjb250ZXh0KTtcbiAgfVxuXG4gIGlmICh2YWx1ZSA9PSBudWxsIHx8IHR5cGVvZiB2YWx1ZSA9PSAnc3RyaW5nJyB8fCB0eXBlb2YgdmFsdWUgPT0gJ251bWJlcicgfHxcbiAgICAgIHR5cGVvZiB2YWx1ZSA9PSAnYm9vbGVhbicpIHtcbiAgICByZXR1cm4gdmlzaXRvci52aXNpdFByaW1pdGl2ZSh2YWx1ZSwgY29udGV4dCk7XG4gIH1cblxuICByZXR1cm4gdmlzaXRvci52aXNpdE90aGVyKHZhbHVlLCBjb250ZXh0KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzRGVmaW5lZCh2YWw6IGFueSk6IGJvb2xlYW4ge1xuICByZXR1cm4gdmFsICE9PSBudWxsICYmIHZhbCAhPT0gdW5kZWZpbmVkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbm9VbmRlZmluZWQ8VD4odmFsOiBUIHwgdW5kZWZpbmVkKTogVCB7XG4gIHJldHVybiB2YWwgPT09IHVuZGVmaW5lZCA/IG51bGwgISA6IHZhbDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBWYWx1ZVZpc2l0b3Ige1xuICB2aXNpdEFycmF5KGFycjogYW55W10sIGNvbnRleHQ6IGFueSk6IGFueTtcbiAgdmlzaXRTdHJpbmdNYXAobWFwOiB7W2tleTogc3RyaW5nXTogYW55fSwgY29udGV4dDogYW55KTogYW55O1xuICB2aXNpdFByaW1pdGl2ZSh2YWx1ZTogYW55LCBjb250ZXh0OiBhbnkpOiBhbnk7XG4gIHZpc2l0T3RoZXIodmFsdWU6IGFueSwgY29udGV4dDogYW55KTogYW55O1xufVxuXG5leHBvcnQgY2xhc3MgVmFsdWVUcmFuc2Zvcm1lciBpbXBsZW1lbnRzIFZhbHVlVmlzaXRvciB7XG4gIHZpc2l0QXJyYXkoYXJyOiBhbnlbXSwgY29udGV4dDogYW55KTogYW55IHtcbiAgICByZXR1cm4gYXJyLm1hcCh2YWx1ZSA9PiB2aXNpdFZhbHVlKHZhbHVlLCB0aGlzLCBjb250ZXh0KSk7XG4gIH1cbiAgdmlzaXRTdHJpbmdNYXAobWFwOiB7W2tleTogc3RyaW5nXTogYW55fSwgY29udGV4dDogYW55KTogYW55IHtcbiAgICBjb25zdCByZXN1bHQ6IHtba2V5OiBzdHJpbmddOiBhbnl9ID0ge307XG4gICAgT2JqZWN0LmtleXMobWFwKS5mb3JFYWNoKGtleSA9PiB7IHJlc3VsdFtrZXldID0gdmlzaXRWYWx1ZShtYXBba2V5XSwgdGhpcywgY29udGV4dCk7IH0pO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgdmlzaXRQcmltaXRpdmUodmFsdWU6IGFueSwgY29udGV4dDogYW55KTogYW55IHsgcmV0dXJuIHZhbHVlOyB9XG4gIHZpc2l0T3RoZXIodmFsdWU6IGFueSwgY29udGV4dDogYW55KTogYW55IHsgcmV0dXJuIHZhbHVlOyB9XG59XG5cbmV4cG9ydCB0eXBlIFN5bmNBc3luYzxUPiA9IFQgfCBQcm9taXNlPFQ+O1xuXG5leHBvcnQgY29uc3QgU3luY0FzeW5jID0ge1xuICBhc3NlcnRTeW5jOiA8VD4odmFsdWU6IFN5bmNBc3luYzxUPik6IFQgPT4ge1xuICAgIGlmIChpc1Byb21pc2UodmFsdWUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYElsbGVnYWwgc3RhdGU6IHZhbHVlIGNhbm5vdCBiZSBhIHByb21pc2VgKTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9LFxuICB0aGVuOiA8VCwgUj4odmFsdWU6IFN5bmNBc3luYzxUPiwgY2I6ICh2YWx1ZTogVCkgPT4gUiB8IFByb21pc2U8Uj58IFN5bmNBc3luYzxSPik6XG4gICAgICAgICAgICBTeW5jQXN5bmM8Uj4gPT4geyByZXR1cm4gaXNQcm9taXNlKHZhbHVlKSA/IHZhbHVlLnRoZW4oY2IpIDogY2IodmFsdWUpO30sXG4gIGFsbDogPFQ+KHN5bmNBc3luY1ZhbHVlczogU3luY0FzeW5jPFQ+W10pOiBTeW5jQXN5bmM8VFtdPiA9PiB7XG4gICAgcmV0dXJuIHN5bmNBc3luY1ZhbHVlcy5zb21lKGlzUHJvbWlzZSkgPyBQcm9taXNlLmFsbChzeW5jQXN5bmNWYWx1ZXMpIDogc3luY0FzeW5jVmFsdWVzIGFzIFRbXTtcbiAgfVxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGVycm9yKG1zZzogc3RyaW5nKTogbmV2ZXIge1xuICB0aHJvdyBuZXcgRXJyb3IoYEludGVybmFsIEVycm9yOiAke21zZ31gKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN5bnRheEVycm9yKG1zZzogc3RyaW5nLCBwYXJzZUVycm9ycz86IFBhcnNlRXJyb3JbXSk6IEVycm9yIHtcbiAgY29uc3QgZXJyb3IgPSBFcnJvcihtc2cpO1xuICAoZXJyb3IgYXMgYW55KVtFUlJPUl9TWU5UQVhfRVJST1JdID0gdHJ1ZTtcbiAgaWYgKHBhcnNlRXJyb3JzKSAoZXJyb3IgYXMgYW55KVtFUlJPUl9QQVJTRV9FUlJPUlNdID0gcGFyc2VFcnJvcnM7XG4gIHJldHVybiBlcnJvcjtcbn1cblxuY29uc3QgRVJST1JfU1lOVEFYX0VSUk9SID0gJ25nU3ludGF4RXJyb3InO1xuY29uc3QgRVJST1JfUEFSU0VfRVJST1JTID0gJ25nUGFyc2VFcnJvcnMnO1xuXG5leHBvcnQgZnVuY3Rpb24gaXNTeW50YXhFcnJvcihlcnJvcjogRXJyb3IpOiBib29sZWFuIHtcbiAgcmV0dXJuIChlcnJvciBhcyBhbnkpW0VSUk9SX1NZTlRBWF9FUlJPUl07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJzZUVycm9ycyhlcnJvcjogRXJyb3IpOiBQYXJzZUVycm9yW10ge1xuICByZXR1cm4gKGVycm9yIGFzIGFueSlbRVJST1JfUEFSU0VfRVJST1JTXSB8fCBbXTtcbn1cblxuLy8gRXNjYXBlIGNoYXJhY3RlcnMgdGhhdCBoYXZlIGEgc3BlY2lhbCBtZWFuaW5nIGluIFJlZ3VsYXIgRXhwcmVzc2lvbnNcbmV4cG9ydCBmdW5jdGlvbiBlc2NhcGVSZWdFeHAoczogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHMucmVwbGFjZSgvKFsuKis/Xj0hOiR7fSgpfFtcXF1cXC9cXFxcXSkvZywgJ1xcXFwkMScpO1xufVxuXG5jb25zdCBTVFJJTkdfTUFQX1BST1RPID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHt9KTtcbmZ1bmN0aW9uIGlzU3RyaWN0U3RyaW5nTWFwKG9iajogYW55KTogYm9vbGVhbiB7XG4gIHJldHVybiB0eXBlb2Ygb2JqID09PSAnb2JqZWN0JyAmJiBvYmogIT09IG51bGwgJiYgT2JqZWN0LmdldFByb3RvdHlwZU9mKG9iaikgPT09IFNUUklOR19NQVBfUFJPVE87XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1dGY4RW5jb2RlKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgbGV0IGVuY29kZWQgPSAnJztcbiAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHN0ci5sZW5ndGg7IGluZGV4KyspIHtcbiAgICBsZXQgY29kZVBvaW50ID0gc3RyLmNoYXJDb2RlQXQoaW5kZXgpO1xuXG4gICAgLy8gZGVjb2RlIHN1cnJvZ2F0ZVxuICAgIC8vIHNlZSBodHRwczovL21hdGhpYXNieW5lbnMuYmUvbm90ZXMvamF2YXNjcmlwdC1lbmNvZGluZyNzdXJyb2dhdGUtZm9ybXVsYWVcbiAgICBpZiAoY29kZVBvaW50ID49IDB4ZDgwMCAmJiBjb2RlUG9pbnQgPD0gMHhkYmZmICYmIHN0ci5sZW5ndGggPiAoaW5kZXggKyAxKSkge1xuICAgICAgY29uc3QgbG93ID0gc3RyLmNoYXJDb2RlQXQoaW5kZXggKyAxKTtcbiAgICAgIGlmIChsb3cgPj0gMHhkYzAwICYmIGxvdyA8PSAweGRmZmYpIHtcbiAgICAgICAgaW5kZXgrKztcbiAgICAgICAgY29kZVBvaW50ID0gKChjb2RlUG9pbnQgLSAweGQ4MDApIDw8IDEwKSArIGxvdyAtIDB4ZGMwMCArIDB4MTAwMDA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNvZGVQb2ludCA8PSAweDdmKSB7XG4gICAgICBlbmNvZGVkICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoY29kZVBvaW50KTtcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8PSAweDdmZikge1xuICAgICAgZW5jb2RlZCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKCgoY29kZVBvaW50ID4+IDYpICYgMHgxRikgfCAweGMwLCAoY29kZVBvaW50ICYgMHgzZikgfCAweDgwKTtcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8PSAweGZmZmYpIHtcbiAgICAgIGVuY29kZWQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShcbiAgICAgICAgICAoY29kZVBvaW50ID4+IDEyKSB8IDB4ZTAsICgoY29kZVBvaW50ID4+IDYpICYgMHgzZikgfCAweDgwLCAoY29kZVBvaW50ICYgMHgzZikgfCAweDgwKTtcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8PSAweDFmZmZmZikge1xuICAgICAgZW5jb2RlZCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKFxuICAgICAgICAgICgoY29kZVBvaW50ID4+IDE4KSAmIDB4MDcpIHwgMHhmMCwgKChjb2RlUG9pbnQgPj4gMTIpICYgMHgzZikgfCAweDgwLFxuICAgICAgICAgICgoY29kZVBvaW50ID4+IDYpICYgMHgzZikgfCAweDgwLCAoY29kZVBvaW50ICYgMHgzZikgfCAweDgwKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZW5jb2RlZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBPdXRwdXRDb250ZXh0IHtcbiAgZ2VuRmlsZVBhdGg6IHN0cmluZztcbiAgc3RhdGVtZW50czogby5TdGF0ZW1lbnRbXTtcbiAgY29uc3RhbnRQb29sOiBDb25zdGFudFBvb2w7XG4gIGltcG9ydEV4cHIocmVmZXJlbmNlOiBhbnksIHR5cGVQYXJhbXM/OiBvLlR5cGVbXXxudWxsLCB1c2VTdW1tYXJpZXM/OiBib29sZWFuKTogby5FeHByZXNzaW9uO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RyaW5naWZ5KHRva2VuOiBhbnkpOiBzdHJpbmcge1xuICBpZiAodHlwZW9mIHRva2VuID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiB0b2tlbjtcbiAgfVxuXG4gIGlmICh0b2tlbiBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgcmV0dXJuICdbJyArIHRva2VuLm1hcChzdHJpbmdpZnkpLmpvaW4oJywgJykgKyAnXSc7XG4gIH1cblxuICBpZiAodG9rZW4gPT0gbnVsbCkge1xuICAgIHJldHVybiAnJyArIHRva2VuO1xuICB9XG5cbiAgaWYgKHRva2VuLm92ZXJyaWRkZW5OYW1lKSB7XG4gICAgcmV0dXJuIGAke3Rva2VuLm92ZXJyaWRkZW5OYW1lfWA7XG4gIH1cblxuICBpZiAodG9rZW4ubmFtZSkge1xuICAgIHJldHVybiBgJHt0b2tlbi5uYW1lfWA7XG4gIH1cblxuICAvLyBXQVJOSU5HOiBkbyBub3QgdHJ5IHRvIGBKU09OLnN0cmluZ2lmeSh0b2tlbilgIGhlcmVcbiAgLy8gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXIvaXNzdWVzLzIzNDQwXG4gIGNvbnN0IHJlcyA9IHRva2VuLnRvU3RyaW5nKCk7XG5cbiAgaWYgKHJlcyA9PSBudWxsKSB7XG4gICAgcmV0dXJuICcnICsgcmVzO1xuICB9XG5cbiAgY29uc3QgbmV3TGluZUluZGV4ID0gcmVzLmluZGV4T2YoJ1xcbicpO1xuICByZXR1cm4gbmV3TGluZUluZGV4ID09PSAtMSA/IHJlcyA6IHJlcy5zdWJzdHJpbmcoMCwgbmV3TGluZUluZGV4KTtcbn1cblxuLyoqXG4gKiBMYXppbHkgcmV0cmlldmVzIHRoZSByZWZlcmVuY2UgdmFsdWUgZnJvbSBhIGZvcndhcmRSZWYuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlRm9yd2FyZFJlZih0eXBlOiBhbnkpOiBhbnkge1xuICBpZiAodHlwZW9mIHR5cGUgPT09ICdmdW5jdGlvbicgJiYgdHlwZS5oYXNPd25Qcm9wZXJ0eSgnX19mb3J3YXJkX3JlZl9fJykpIHtcbiAgICByZXR1cm4gdHlwZSgpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB0eXBlO1xuICB9XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lIGlmIHRoZSBhcmd1bWVudCBpcyBzaGFwZWQgbGlrZSBhIFByb21pc2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzUHJvbWlzZShvYmo6IGFueSk6IG9iaiBpcyBQcm9taXNlPGFueT4ge1xuICAvLyBhbGxvdyBhbnkgUHJvbWlzZS9BKyBjb21wbGlhbnQgdGhlbmFibGUuXG4gIC8vIEl0J3MgdXAgdG8gdGhlIGNhbGxlciB0byBlbnN1cmUgdGhhdCBvYmoudGhlbiBjb25mb3JtcyB0byB0aGUgc3BlY1xuICByZXR1cm4gISFvYmogJiYgdHlwZW9mIG9iai50aGVuID09PSAnZnVuY3Rpb24nO1xufVxuXG5leHBvcnQgY2xhc3MgVmVyc2lvbiB7XG4gIHB1YmxpYyByZWFkb25seSBtYWpvcjogc3RyaW5nO1xuICBwdWJsaWMgcmVhZG9ubHkgbWlub3I6IHN0cmluZztcbiAgcHVibGljIHJlYWRvbmx5IHBhdGNoOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IocHVibGljIGZ1bGw6IHN0cmluZykge1xuICAgIGNvbnN0IHNwbGl0cyA9IGZ1bGwuc3BsaXQoJy4nKTtcbiAgICB0aGlzLm1ham9yID0gc3BsaXRzWzBdO1xuICAgIHRoaXMubWlub3IgPSBzcGxpdHNbMV07XG4gICAgdGhpcy5wYXRjaCA9IHNwbGl0cy5zbGljZSgyKS5qb2luKCcuJyk7XG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb25zb2xlIHtcbiAgbG9nKG1lc3NhZ2U6IHN0cmluZyk6IHZvaWQ7XG4gIHdhcm4obWVzc2FnZTogc3RyaW5nKTogdm9pZDtcbn1cblxuXG5kZWNsYXJlIHZhciBXb3JrZXJHbG9iYWxTY29wZTogYW55O1xuLy8gQ29tbW9uSlMgLyBOb2RlIGhhdmUgZ2xvYmFsIGNvbnRleHQgZXhwb3NlZCBhcyBcImdsb2JhbFwiIHZhcmlhYmxlLlxuLy8gV2UgZG9uJ3Qgd2FudCB0byBpbmNsdWRlIHRoZSB3aG9sZSBub2RlLmQudHMgdGhpcyB0aGlzIGNvbXBpbGF0aW9uIHVuaXQgc28gd2UnbGwganVzdCBmYWtlXG4vLyB0aGUgZ2xvYmFsIFwiZ2xvYmFsXCIgdmFyIGZvciBub3cuXG5kZWNsYXJlIHZhciBnbG9iYWw6IGFueTtcbmNvbnN0IF9fd2luZG93ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93O1xuY29uc3QgX19zZWxmID0gdHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBXb3JrZXJHbG9iYWxTY29wZSAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICBzZWxmIGluc3RhbmNlb2YgV29ya2VyR2xvYmFsU2NvcGUgJiYgc2VsZjtcbmNvbnN0IF9fZ2xvYmFsID0gdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgJiYgZ2xvYmFsO1xuXG4vLyBDaGVjayBfX2dsb2JhbCBmaXJzdCwgYmVjYXVzZSBpbiBOb2RlIHRlc3RzIGJvdGggX19nbG9iYWwgYW5kIF9fd2luZG93IG1heSBiZSBkZWZpbmVkIGFuZCBfZ2xvYmFsXG4vLyBzaG91bGQgYmUgX19nbG9iYWwgaW4gdGhhdCBjYXNlLlxuY29uc3QgX2dsb2JhbDoge1tuYW1lOiBzdHJpbmddOiBhbnl9ID0gX19nbG9iYWwgfHwgX193aW5kb3cgfHwgX19zZWxmO1xuZXhwb3J0IHtfZ2xvYmFsIGFzIGdsb2JhbH07XG4iXX0=
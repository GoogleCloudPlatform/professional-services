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
        define("@angular/compiler/src/assertions", ["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function assertArrayOfStrings(identifier, value) {
        if (value == null) {
            return;
        }
        if (!Array.isArray(value)) {
            throw new Error("Expected '" + identifier + "' to be an array of strings.");
        }
        for (var i = 0; i < value.length; i += 1) {
            if (typeof value[i] !== 'string') {
                throw new Error("Expected '" + identifier + "' to be an array of strings.");
            }
        }
    }
    exports.assertArrayOfStrings = assertArrayOfStrings;
    var INTERPOLATION_BLACKLIST_REGEXPS = [
        /^\s*$/,
        /[<>]/,
        /^[{}]$/,
        /&(#|[a-z])/i,
        /^\/\//,
    ];
    function assertInterpolationSymbols(identifier, value) {
        if (value != null && !(Array.isArray(value) && value.length == 2)) {
            throw new Error("Expected '" + identifier + "' to be an array, [start, end].");
        }
        else if (value != null) {
            var start_1 = value[0];
            var end_1 = value[1];
            // black list checking
            INTERPOLATION_BLACKLIST_REGEXPS.forEach(function (regexp) {
                if (regexp.test(start_1) || regexp.test(end_1)) {
                    throw new Error("['" + start_1 + "', '" + end_1 + "'] contains unusable interpolation symbol.");
                }
            });
        }
    }
    exports.assertInterpolationSymbols = assertInterpolationSymbols;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXJ0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyL3NyYy9hc3NlcnRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBRUgsU0FBZ0Isb0JBQW9CLENBQUMsVUFBa0IsRUFBRSxLQUFVO1FBQ2pFLElBQUksS0FBSyxJQUFJLElBQUksRUFBRTtZQUNqQixPQUFPO1NBQ1I7UUFDRCxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUN6QixNQUFNLElBQUksS0FBSyxDQUFDLGVBQWEsVUFBVSxpQ0FBOEIsQ0FBQyxDQUFDO1NBQ3hFO1FBQ0QsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUN4QyxJQUFJLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLFFBQVEsRUFBRTtnQkFDaEMsTUFBTSxJQUFJLEtBQUssQ0FBQyxlQUFhLFVBQVUsaUNBQThCLENBQUMsQ0FBQzthQUN4RTtTQUNGO0lBQ0gsQ0FBQztJQVpELG9EQVlDO0lBRUQsSUFBTSwrQkFBK0IsR0FBRztRQUN0QyxPQUFPO1FBQ1AsTUFBTTtRQUNOLFFBQVE7UUFDUixhQUFhO1FBQ2IsT0FBTztLQUNSLENBQUM7SUFFRixTQUFnQiwwQkFBMEIsQ0FBQyxVQUFrQixFQUFFLEtBQVU7UUFDdkUsSUFBSSxLQUFLLElBQUksSUFBSSxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDLEVBQUU7WUFDakUsTUFBTSxJQUFJLEtBQUssQ0FBQyxlQUFhLFVBQVUsb0NBQWlDLENBQUMsQ0FBQztTQUMzRTthQUFNLElBQUksS0FBSyxJQUFJLElBQUksRUFBRTtZQUN4QixJQUFNLE9BQUssR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFXLENBQUM7WUFDakMsSUFBTSxLQUFHLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBVyxDQUFDO1lBQy9CLHNCQUFzQjtZQUN0QiwrQkFBK0IsQ0FBQyxPQUFPLENBQUMsVUFBQSxNQUFNO2dCQUM1QyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBSyxDQUFDLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFHLENBQUMsRUFBRTtvQkFDMUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxPQUFLLE9BQUssWUFBTyxLQUFHLCtDQUE0QyxDQUFDLENBQUM7aUJBQ25GO1lBQ0gsQ0FBQyxDQUFDLENBQUM7U0FDSjtJQUNILENBQUM7SUFiRCxnRUFhQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEFycmF5T2ZTdHJpbmdzKGlkZW50aWZpZXI6IHN0cmluZywgdmFsdWU6IGFueSkge1xuICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCAnJHtpZGVudGlmaWVyfScgdG8gYmUgYW4gYXJyYXkgb2Ygc3RyaW5ncy5gKTtcbiAgfVxuICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZVtpXSAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgJyR7aWRlbnRpZmllcn0nIHRvIGJlIGFuIGFycmF5IG9mIHN0cmluZ3MuYCk7XG4gICAgfVxuICB9XG59XG5cbmNvbnN0IElOVEVSUE9MQVRJT05fQkxBQ0tMSVNUX1JFR0VYUFMgPSBbXG4gIC9eXFxzKiQvLCAgICAgICAgLy8gZW1wdHlcbiAgL1s8Pl0vLCAgICAgICAgIC8vIGh0bWwgdGFnXG4gIC9eW3t9XSQvLCAgICAgICAvLyBpMThuIGV4cGFuc2lvblxuICAvJigjfFthLXpdKS9pLCAgLy8gY2hhcmFjdGVyIHJlZmVyZW5jZSxcbiAgL15cXC9cXC8vLCAgICAgICAgLy8gY29tbWVudFxuXTtcblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEludGVycG9sYXRpb25TeW1ib2xzKGlkZW50aWZpZXI6IHN0cmluZywgdmFsdWU6IGFueSk6IHZvaWQge1xuICBpZiAodmFsdWUgIT0gbnVsbCAmJiAhKEFycmF5LmlzQXJyYXkodmFsdWUpICYmIHZhbHVlLmxlbmd0aCA9PSAyKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgJyR7aWRlbnRpZmllcn0nIHRvIGJlIGFuIGFycmF5LCBbc3RhcnQsIGVuZF0uYCk7XG4gIH0gZWxzZSBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgIGNvbnN0IHN0YXJ0ID0gdmFsdWVbMF0gYXMgc3RyaW5nO1xuICAgIGNvbnN0IGVuZCA9IHZhbHVlWzFdIGFzIHN0cmluZztcbiAgICAvLyBibGFjayBsaXN0IGNoZWNraW5nXG4gICAgSU5URVJQT0xBVElPTl9CTEFDS0xJU1RfUkVHRVhQUy5mb3JFYWNoKHJlZ2V4cCA9PiB7XG4gICAgICBpZiAocmVnZXhwLnRlc3Qoc3RhcnQpIHx8IHJlZ2V4cC50ZXN0KGVuZCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBbJyR7c3RhcnR9JywgJyR7ZW5kfSddIGNvbnRhaW5zIHVudXNhYmxlIGludGVycG9sYXRpb24gc3ltYm9sLmApO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG4iXX0=
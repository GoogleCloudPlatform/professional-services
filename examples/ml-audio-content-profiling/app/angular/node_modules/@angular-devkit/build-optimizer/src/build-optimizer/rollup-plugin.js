"use strict";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview This adapts the buildOptimizer to run over each file as it is
 * processed by Rollup. We must do this since buildOptimizer expects to see the
 * ESModules in the input sources, and therefore cannot run on the rollup output
 */
const path = require("path");
const build_optimizer_1 = require("./build-optimizer");
const DEBUG = false;
function optimizer(options) {
    return {
        name: 'build-optimizer',
        transform: (content, id) => {
            const isSideEffectFree = options.sideEffectFreeModules &&
                options.sideEffectFreeModules.some(m => id.indexOf(m) >= 0);
            const { content: code, sourceMap: map } = build_optimizer_1.buildOptimizer({
                content, inputFilePath: id, emitSourceMap: true, isSideEffectFree,
            });
            if (!code) {
                if (DEBUG) {
                    console.error('no transforms produced by buildOptimizer for '
                        + path.relative(process.cwd(), id));
                }
                return null;
            }
            if (!map) {
                throw new Error('no sourcemap produced by buildOptimizer');
            }
            return { code, map };
        },
    };
}
exports.default = optimizer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm9sbHVwLXBsdWdpbi5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfb3B0aW1pemVyL3NyYy9idWlsZC1vcHRpbWl6ZXIvcm9sbHVwLXBsdWdpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQUVIOzs7O0dBSUc7QUFFSCw2QkFBNkI7QUFFN0IsdURBQW1EO0FBRW5ELE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQztBQU1wQixTQUF3QixTQUFTLENBQUMsT0FBZ0I7SUFDaEQsT0FBTztRQUNMLElBQUksRUFBRSxpQkFBaUI7UUFDdkIsU0FBUyxFQUFFLENBQUMsT0FBZSxFQUFFLEVBQVUsRUFBMEMsRUFBRTtZQUNqRixNQUFNLGdCQUFnQixHQUFHLE9BQU8sQ0FBQyxxQkFBcUI7Z0JBQ3BELE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQzlELE1BQU0sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUUsR0FBRyxnQ0FBYyxDQUFDO2dCQUN2RCxPQUFPLEVBQUUsYUFBYSxFQUFFLEVBQUUsRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLGdCQUFnQjthQUNsRSxDQUFDLENBQUM7WUFDSCxJQUFJLENBQUMsSUFBSSxFQUFFO2dCQUNULElBQUksS0FBSyxFQUFFO29CQUNULE9BQU8sQ0FBQyxLQUFLLENBQUMsK0NBQStDOzBCQUN4RCxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO2lCQUN4QztnQkFFRCxPQUFPLElBQUksQ0FBQzthQUNiO1lBQ0QsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDUixNQUFNLElBQUksS0FBSyxDQUFDLHlDQUF5QyxDQUFDLENBQUM7YUFDNUQ7WUFFRCxPQUFPLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDO1FBQ3ZCLENBQUM7S0FDRixDQUFDO0FBQ0osQ0FBQztBQXhCRCw0QkF3QkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8qKlxuICogQGZpbGVvdmVydmlldyBUaGlzIGFkYXB0cyB0aGUgYnVpbGRPcHRpbWl6ZXIgdG8gcnVuIG92ZXIgZWFjaCBmaWxlIGFzIGl0IGlzXG4gKiBwcm9jZXNzZWQgYnkgUm9sbHVwLiBXZSBtdXN0IGRvIHRoaXMgc2luY2UgYnVpbGRPcHRpbWl6ZXIgZXhwZWN0cyB0byBzZWUgdGhlXG4gKiBFU01vZHVsZXMgaW4gdGhlIGlucHV0IHNvdXJjZXMsIGFuZCB0aGVyZWZvcmUgY2Fubm90IHJ1biBvbiB0aGUgcm9sbHVwIG91dHB1dFxuICovXG5cbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBSYXdTb3VyY2VNYXAgfSBmcm9tICdzb3VyY2UtbWFwJztcbmltcG9ydCB7IGJ1aWxkT3B0aW1pemVyIH0gZnJvbSAnLi9idWlsZC1vcHRpbWl6ZXInO1xuXG5jb25zdCBERUJVRyA9IGZhbHNlO1xuXG5leHBvcnQgaW50ZXJmYWNlIE9wdGlvbnMge1xuICBzaWRlRWZmZWN0RnJlZU1vZHVsZXM/OiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gb3B0aW1pemVyKG9wdGlvbnM6IE9wdGlvbnMpIHtcbiAgcmV0dXJuIHtcbiAgICBuYW1lOiAnYnVpbGQtb3B0aW1pemVyJyxcbiAgICB0cmFuc2Zvcm06IChjb250ZW50OiBzdHJpbmcsIGlkOiBzdHJpbmcpOiB7Y29kZTogc3RyaW5nLCBtYXA6IFJhd1NvdXJjZU1hcH18bnVsbCA9PiB7XG4gICAgICBjb25zdCBpc1NpZGVFZmZlY3RGcmVlID0gb3B0aW9ucy5zaWRlRWZmZWN0RnJlZU1vZHVsZXMgJiZcbiAgICAgICAgb3B0aW9ucy5zaWRlRWZmZWN0RnJlZU1vZHVsZXMuc29tZShtID0+IGlkLmluZGV4T2YobSkgPj0gMCk7XG4gICAgICBjb25zdCB7IGNvbnRlbnQ6IGNvZGUsIHNvdXJjZU1hcDogbWFwIH0gPSBidWlsZE9wdGltaXplcih7XG4gICAgICAgIGNvbnRlbnQsIGlucHV0RmlsZVBhdGg6IGlkLCBlbWl0U291cmNlTWFwOiB0cnVlLCBpc1NpZGVFZmZlY3RGcmVlLFxuICAgICAgfSk7XG4gICAgICBpZiAoIWNvZGUpIHtcbiAgICAgICAgaWYgKERFQlVHKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignbm8gdHJhbnNmb3JtcyBwcm9kdWNlZCBieSBidWlsZE9wdGltaXplciBmb3IgJ1xuICAgICAgICAgICAgICsgcGF0aC5yZWxhdGl2ZShwcm9jZXNzLmN3ZCgpLCBpZCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICBpZiAoIW1hcCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ25vIHNvdXJjZW1hcCBwcm9kdWNlZCBieSBidWlsZE9wdGltaXplcicpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4geyBjb2RlLCBtYXAgfTtcbiAgICB9LFxuICB9O1xufVxuIl19
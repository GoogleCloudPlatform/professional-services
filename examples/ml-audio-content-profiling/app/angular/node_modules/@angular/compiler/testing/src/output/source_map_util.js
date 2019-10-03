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
        define("@angular/compiler/testing/src/output/source_map_util", ["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var b64 = require('base64-js');
    var SourceMapConsumer = require('source-map').SourceMapConsumer;
    function originalPositionFor(sourceMap, genPosition) {
        var smc = new SourceMapConsumer(sourceMap);
        // Note: We don't return the original object as it also contains a `name` property
        // which is always null and we don't want to include that in our assertions...
        var _a = smc.originalPositionFor(genPosition), line = _a.line, column = _a.column, source = _a.source;
        return { line: line, column: column, source: source };
    }
    exports.originalPositionFor = originalPositionFor;
    function extractSourceMap(source) {
        var idx = source.lastIndexOf('\n//#');
        if (idx == -1)
            return null;
        var smComment = source.slice(idx).trim();
        var smB64 = smComment.split('sourceMappingURL=data:application/json;base64,')[1];
        return smB64 ? JSON.parse(decodeB64String(smB64)) : null;
    }
    exports.extractSourceMap = extractSourceMap;
    function decodeB64String(s) {
        return b64.toByteArray(s).reduce(function (s, c) { return s + String.fromCharCode(c); }, '');
    }
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic291cmNlX21hcF91dGlsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXIvdGVzdGluZy9zcmMvb3V0cHV0L3NvdXJjZV9tYXBfdXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUdILElBQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUNqQyxJQUFNLGlCQUFpQixHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQztJQVFsRSxTQUFnQixtQkFBbUIsQ0FDL0IsU0FBb0IsRUFDcEIsV0FBeUQ7UUFDM0QsSUFBTSxHQUFHLEdBQUcsSUFBSSxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUM3QyxrRkFBa0Y7UUFDbEYsOEVBQThFO1FBQ3hFLElBQUEseUNBQTZELEVBQTVELGNBQUksRUFBRSxrQkFBTSxFQUFFLGtCQUE4QyxDQUFDO1FBQ3BFLE9BQU8sRUFBQyxJQUFJLE1BQUEsRUFBRSxNQUFNLFFBQUEsRUFBRSxNQUFNLFFBQUEsRUFBQyxDQUFDO0lBQ2hDLENBQUM7SUFSRCxrREFRQztJQUVELFNBQWdCLGdCQUFnQixDQUFDLE1BQWM7UUFDN0MsSUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN0QyxJQUFJLEdBQUcsSUFBSSxDQUFDLENBQUM7WUFBRSxPQUFPLElBQUksQ0FBQztRQUMzQixJQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQzNDLElBQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsZ0RBQWdELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuRixPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQzNELENBQUM7SUFORCw0Q0FNQztJQUVELFNBQVMsZUFBZSxDQUFDLENBQVM7UUFDaEMsT0FBTyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFDLENBQVMsRUFBRSxDQUFTLElBQUssT0FBQSxDQUFDLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsRUFBMUIsQ0FBMEIsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUM3RixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1NvdXJjZU1hcH0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuY29uc3QgYjY0ID0gcmVxdWlyZSgnYmFzZTY0LWpzJyk7XG5jb25zdCBTb3VyY2VNYXBDb25zdW1lciA9IHJlcXVpcmUoJ3NvdXJjZS1tYXAnKS5Tb3VyY2VNYXBDb25zdW1lcjtcblxuZXhwb3J0IGludGVyZmFjZSBTb3VyY2VMb2NhdGlvbiB7XG4gIGxpbmU6IG51bWJlcjtcbiAgY29sdW1uOiBudW1iZXI7XG4gIHNvdXJjZTogc3RyaW5nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gb3JpZ2luYWxQb3NpdGlvbkZvcihcbiAgICBzb3VyY2VNYXA6IFNvdXJjZU1hcCxcbiAgICBnZW5Qb3NpdGlvbjoge2xpbmU6IG51bWJlciB8IG51bGwsIGNvbHVtbjogbnVtYmVyIHwgbnVsbH0pOiBTb3VyY2VMb2NhdGlvbiB7XG4gIGNvbnN0IHNtYyA9IG5ldyBTb3VyY2VNYXBDb25zdW1lcihzb3VyY2VNYXApO1xuICAvLyBOb3RlOiBXZSBkb24ndCByZXR1cm4gdGhlIG9yaWdpbmFsIG9iamVjdCBhcyBpdCBhbHNvIGNvbnRhaW5zIGEgYG5hbWVgIHByb3BlcnR5XG4gIC8vIHdoaWNoIGlzIGFsd2F5cyBudWxsIGFuZCB3ZSBkb24ndCB3YW50IHRvIGluY2x1ZGUgdGhhdCBpbiBvdXIgYXNzZXJ0aW9ucy4uLlxuICBjb25zdCB7bGluZSwgY29sdW1uLCBzb3VyY2V9ID0gc21jLm9yaWdpbmFsUG9zaXRpb25Gb3IoZ2VuUG9zaXRpb24pO1xuICByZXR1cm4ge2xpbmUsIGNvbHVtbiwgc291cmNlfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RTb3VyY2VNYXAoc291cmNlOiBzdHJpbmcpOiBTb3VyY2VNYXB8bnVsbCB7XG4gIGxldCBpZHggPSBzb3VyY2UubGFzdEluZGV4T2YoJ1xcbi8vIycpO1xuICBpZiAoaWR4ID09IC0xKSByZXR1cm4gbnVsbDtcbiAgY29uc3Qgc21Db21tZW50ID0gc291cmNlLnNsaWNlKGlkeCkudHJpbSgpO1xuICBjb25zdCBzbUI2NCA9IHNtQ29tbWVudC5zcGxpdCgnc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LCcpWzFdO1xuICByZXR1cm4gc21CNjQgPyBKU09OLnBhcnNlKGRlY29kZUI2NFN0cmluZyhzbUI2NCkpIDogbnVsbDtcbn1cblxuZnVuY3Rpb24gZGVjb2RlQjY0U3RyaW5nKHM6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBiNjQudG9CeXRlQXJyYXkocykucmVkdWNlKChzOiBzdHJpbmcsIGM6IG51bWJlcikgPT4gcyArIFN0cmluZy5mcm9tQ2hhckNvZGUoYyksICcnKTtcbn1cbiJdfQ==
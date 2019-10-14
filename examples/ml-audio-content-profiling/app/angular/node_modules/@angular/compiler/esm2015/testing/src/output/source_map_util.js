/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/** @type {?} */
const b64 = require('base64-js');
/** @type {?} */
const SourceMapConsumer = require('source-map').SourceMapConsumer;
/**
 * @record
 */
export function SourceLocation() { }
/** @type {?} */
SourceLocation.prototype.line;
/** @type {?} */
SourceLocation.prototype.column;
/** @type {?} */
SourceLocation.prototype.source;
/**
 * @param {?} sourceMap
 * @param {?} genPosition
 * @return {?}
 */
export function originalPositionFor(sourceMap, genPosition) {
    /** @type {?} */
    const smc = new SourceMapConsumer(sourceMap);
    const { line, column, source } = smc.originalPositionFor(genPosition);
    return { line, column, source };
}
/**
 * @param {?} source
 * @return {?}
 */
export function extractSourceMap(source) {
    /** @type {?} */
    let idx = source.lastIndexOf('\n//#');
    if (idx == -1)
        return null;
    /** @type {?} */
    const smComment = source.slice(idx).trim();
    /** @type {?} */
    const smB64 = smComment.split('sourceMappingURL=data:application/json;base64,')[1];
    return smB64 ? JSON.parse(decodeB64String(smB64)) : null;
}
/**
 * @param {?} s
 * @return {?}
 */
function decodeB64String(s) {
    return b64.toByteArray(s).reduce((s, c) => s + String.fromCharCode(c), '');
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic291cmNlX21hcF91dGlsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXIvdGVzdGluZy9zcmMvb3V0cHV0L3NvdXJjZV9tYXBfdXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFTQSxNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7O0FBQ2pDLE1BQU0saUJBQWlCLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDLGlCQUFpQixDQUFDOzs7Ozs7Ozs7Ozs7Ozs7O0FBUWxFLE1BQU0sVUFBVSxtQkFBbUIsQ0FDL0IsU0FBb0IsRUFDcEIsV0FBeUQ7O0lBQzNELE1BQU0sR0FBRyxHQUFHLElBQUksaUJBQWlCLENBQUMsU0FBUyxDQUFDLENBQUM7SUFHN0MsTUFBTSxFQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFDLEdBQUcsR0FBRyxDQUFDLG1CQUFtQixDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ3BFLE9BQU8sRUFBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBQyxDQUFDO0NBQy9COzs7OztBQUVELE1BQU0sVUFBVSxnQkFBZ0IsQ0FBQyxNQUFjOztJQUM3QyxJQUFJLEdBQUcsR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3RDLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQztRQUFFLE9BQU8sSUFBSSxDQUFDOztJQUMzQixNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDOztJQUMzQyxNQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLGdEQUFnRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkYsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztDQUMxRDs7Ozs7QUFFRCxTQUFTLGVBQWUsQ0FBQyxDQUFTO0lBQ2hDLE9BQU8sR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFTLEVBQUUsQ0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztDQUM1RiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtTb3VyY2VNYXB9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcbmNvbnN0IGI2NCA9IHJlcXVpcmUoJ2Jhc2U2NC1qcycpO1xuY29uc3QgU291cmNlTWFwQ29uc3VtZXIgPSByZXF1aXJlKCdzb3VyY2UtbWFwJykuU291cmNlTWFwQ29uc3VtZXI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU291cmNlTG9jYXRpb24ge1xuICBsaW5lOiBudW1iZXI7XG4gIGNvbHVtbjogbnVtYmVyO1xuICBzb3VyY2U6IHN0cmluZztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG9yaWdpbmFsUG9zaXRpb25Gb3IoXG4gICAgc291cmNlTWFwOiBTb3VyY2VNYXAsXG4gICAgZ2VuUG9zaXRpb246IHtsaW5lOiBudW1iZXIgfCBudWxsLCBjb2x1bW46IG51bWJlciB8IG51bGx9KTogU291cmNlTG9jYXRpb24ge1xuICBjb25zdCBzbWMgPSBuZXcgU291cmNlTWFwQ29uc3VtZXIoc291cmNlTWFwKTtcbiAgLy8gTm90ZTogV2UgZG9uJ3QgcmV0dXJuIHRoZSBvcmlnaW5hbCBvYmplY3QgYXMgaXQgYWxzbyBjb250YWlucyBhIGBuYW1lYCBwcm9wZXJ0eVxuICAvLyB3aGljaCBpcyBhbHdheXMgbnVsbCBhbmQgd2UgZG9uJ3Qgd2FudCB0byBpbmNsdWRlIHRoYXQgaW4gb3VyIGFzc2VydGlvbnMuLi5cbiAgY29uc3Qge2xpbmUsIGNvbHVtbiwgc291cmNlfSA9IHNtYy5vcmlnaW5hbFBvc2l0aW9uRm9yKGdlblBvc2l0aW9uKTtcbiAgcmV0dXJuIHtsaW5lLCBjb2x1bW4sIHNvdXJjZX07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0U291cmNlTWFwKHNvdXJjZTogc3RyaW5nKTogU291cmNlTWFwfG51bGwge1xuICBsZXQgaWR4ID0gc291cmNlLmxhc3RJbmRleE9mKCdcXG4vLyMnKTtcbiAgaWYgKGlkeCA9PSAtMSkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IHNtQ29tbWVudCA9IHNvdXJjZS5zbGljZShpZHgpLnRyaW0oKTtcbiAgY29uc3Qgc21CNjQgPSBzbUNvbW1lbnQuc3BsaXQoJ3NvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCwnKVsxXTtcbiAgcmV0dXJuIHNtQjY0ID8gSlNPTi5wYXJzZShkZWNvZGVCNjRTdHJpbmcoc21CNjQpKSA6IG51bGw7XG59XG5cbmZ1bmN0aW9uIGRlY29kZUI2NFN0cmluZyhzOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gYjY0LnRvQnl0ZUFycmF5KHMpLnJlZHVjZSgoczogc3RyaW5nLCBjOiBudW1iZXIpID0+IHMgKyBTdHJpbmcuZnJvbUNoYXJDb2RlKGMpLCAnJyk7XG59XG4iXX0=
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
import * as core from '@angular/core';
import { exportNgVar } from '../util';
/** @type {?} */
const CORE_TOKENS = {
    'ApplicationRef': core.ApplicationRef,
    'NgZone': core.NgZone,
};
/** @type {?} */
const INSPECT_GLOBAL_NAME = 'probe';
/** @type {?} */
const CORE_TOKENS_GLOBAL_NAME = 'coreTokens';
/**
 * Returns a {\@link DebugElement} for the given native DOM element, or
 * null if the given native element does not have an Angular view associated
 * with it.
 * @param {?} element
 * @return {?}
 */
export function inspectNativeElement(element) {
    return core.getDebugNode(element);
}
/**
 * @param {?} coreTokens
 * @return {?}
 */
export function _createNgProbe(coreTokens) {
    exportNgVar(INSPECT_GLOBAL_NAME, inspectNativeElement);
    exportNgVar(CORE_TOKENS_GLOBAL_NAME, Object.assign({}, CORE_TOKENS, _ngProbeTokensToMap(coreTokens || [])));
    return () => inspectNativeElement;
}
/**
 * @param {?} tokens
 * @return {?}
 */
function _ngProbeTokensToMap(tokens) {
    return tokens.reduce((prev, t) => (prev[t.name] = t.token, prev), {});
}
/** *
 * Providers which support debugging Angular applications (e.g. via `ng.probe`).
  @type {?} */
export const ELEMENT_PROBE_PROVIDERS = [
    {
        provide: core.APP_INITIALIZER,
        useFactory: _createNgProbe,
        deps: [
            [core.NgProbeToken, new core.Optional()],
        ],
        multi: true,
    },
];

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfcHJvYmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9wbGF0Zm9ybS1icm93c2VyL3NyYy9kb20vZGVidWcvbmdfcHJvYmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEtBQUssSUFBSSxNQUFNLGVBQWUsQ0FBQztBQUN0QyxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sU0FBUyxDQUFDOztBQUVwQyxNQUFNLFdBQVcsR0FBRztJQUNsQixnQkFBZ0IsRUFBRSxJQUFJLENBQUMsY0FBYztJQUNyQyxRQUFRLEVBQUUsSUFBSSxDQUFDLE1BQU07Q0FDdEIsQ0FBQzs7QUFFRixNQUFNLG1CQUFtQixHQUFHLE9BQU8sQ0FBQzs7QUFDcEMsTUFBTSx1QkFBdUIsR0FBRyxZQUFZLENBQUM7Ozs7Ozs7O0FBTzdDLE1BQU0sVUFBVSxvQkFBb0IsQ0FBQyxPQUFZO0lBQy9DLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztDQUNuQzs7Ozs7QUFFRCxNQUFNLFVBQVUsY0FBYyxDQUFDLFVBQStCO0lBQzVELFdBQVcsQ0FBQyxtQkFBbUIsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO0lBQ3ZELFdBQVcsQ0FBQyx1QkFBdUIsb0JBQU0sV0FBVyxFQUFLLG1CQUFtQixDQUFDLFVBQVUsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDO0lBQ2pHLE9BQU8sR0FBRyxFQUFFLENBQUMsb0JBQW9CLENBQUM7Q0FDbkM7Ozs7O0FBRUQsU0FBUyxtQkFBbUIsQ0FBQyxNQUEyQjtJQUN0RCxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFTLEVBQUUsQ0FBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztDQUNqRjs7OztBQUtELGFBQWEsdUJBQXVCLEdBQW9CO0lBQ3REO1FBQ0UsT0FBTyxFQUFFLElBQUksQ0FBQyxlQUFlO1FBQzdCLFVBQVUsRUFBRSxjQUFjO1FBQzFCLElBQUksRUFBRTtZQUNKLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztTQUN6QztRQUNELEtBQUssRUFBRSxJQUFJO0tBQ1o7Q0FDRixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyBjb3JlIGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtleHBvcnROZ1Zhcn0gZnJvbSAnLi4vdXRpbCc7XG5cbmNvbnN0IENPUkVfVE9LRU5TID0ge1xuICAnQXBwbGljYXRpb25SZWYnOiBjb3JlLkFwcGxpY2F0aW9uUmVmLFxuICAnTmdab25lJzogY29yZS5OZ1pvbmUsXG59O1xuXG5jb25zdCBJTlNQRUNUX0dMT0JBTF9OQU1FID0gJ3Byb2JlJztcbmNvbnN0IENPUkVfVE9LRU5TX0dMT0JBTF9OQU1FID0gJ2NvcmVUb2tlbnMnO1xuXG4vKipcbiAqIFJldHVybnMgYSB7QGxpbmsgRGVidWdFbGVtZW50fSBmb3IgdGhlIGdpdmVuIG5hdGl2ZSBET00gZWxlbWVudCwgb3JcbiAqIG51bGwgaWYgdGhlIGdpdmVuIG5hdGl2ZSBlbGVtZW50IGRvZXMgbm90IGhhdmUgYW4gQW5ndWxhciB2aWV3IGFzc29jaWF0ZWRcbiAqIHdpdGggaXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnNwZWN0TmF0aXZlRWxlbWVudChlbGVtZW50OiBhbnkpOiBjb3JlLkRlYnVnTm9kZXxudWxsIHtcbiAgcmV0dXJuIGNvcmUuZ2V0RGVidWdOb2RlKGVsZW1lbnQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gX2NyZWF0ZU5nUHJvYmUoY29yZVRva2VuczogY29yZS5OZ1Byb2JlVG9rZW5bXSk6IGFueSB7XG4gIGV4cG9ydE5nVmFyKElOU1BFQ1RfR0xPQkFMX05BTUUsIGluc3BlY3ROYXRpdmVFbGVtZW50KTtcbiAgZXhwb3J0TmdWYXIoQ09SRV9UT0tFTlNfR0xPQkFMX05BTUUsIHsuLi5DT1JFX1RPS0VOUywgLi4uX25nUHJvYmVUb2tlbnNUb01hcChjb3JlVG9rZW5zIHx8IFtdKX0pO1xuICByZXR1cm4gKCkgPT4gaW5zcGVjdE5hdGl2ZUVsZW1lbnQ7XG59XG5cbmZ1bmN0aW9uIF9uZ1Byb2JlVG9rZW5zVG9NYXAodG9rZW5zOiBjb3JlLk5nUHJvYmVUb2tlbltdKToge1tuYW1lOiBzdHJpbmddOiBhbnl9IHtcbiAgcmV0dXJuIHRva2Vucy5yZWR1Y2UoKHByZXY6IGFueSwgdDogYW55KSA9PiAocHJldlt0Lm5hbWVdID0gdC50b2tlbiwgcHJldiksIHt9KTtcbn1cblxuLyoqXG4gKiBQcm92aWRlcnMgd2hpY2ggc3VwcG9ydCBkZWJ1Z2dpbmcgQW5ndWxhciBhcHBsaWNhdGlvbnMgKGUuZy4gdmlhIGBuZy5wcm9iZWApLlxuICovXG5leHBvcnQgY29uc3QgRUxFTUVOVF9QUk9CRV9QUk9WSURFUlM6IGNvcmUuUHJvdmlkZXJbXSA9IFtcbiAge1xuICAgIHByb3ZpZGU6IGNvcmUuQVBQX0lOSVRJQUxJWkVSLFxuICAgIHVzZUZhY3Rvcnk6IF9jcmVhdGVOZ1Byb2JlLFxuICAgIGRlcHM6IFtcbiAgICAgIFtjb3JlLk5nUHJvYmVUb2tlbiwgbmV3IGNvcmUuT3B0aW9uYWwoKV0sXG4gICAgXSxcbiAgICBtdWx0aTogdHJ1ZSxcbiAgfSxcbl07XG4iXX0=
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
export const ERROR_TYPE = 'ngType';
/** @type {?} */
export const ERROR_DEBUG_CONTEXT = 'ngDebugContext';
/** @type {?} */
export const ERROR_ORIGINAL_ERROR = 'ngOriginalError';
/** @type {?} */
export const ERROR_LOGGER = 'ngErrorLogger';
/**
 * @param {?} error
 * @return {?}
 */
export function getType(error) {
    return (/** @type {?} */ (error))[ERROR_TYPE];
}
/**
 * @param {?} error
 * @return {?}
 */
export function getDebugContext(error) {
    return (/** @type {?} */ (error))[ERROR_DEBUG_CONTEXT];
}
/**
 * @param {?} error
 * @return {?}
 */
export function getOriginalError(error) {
    return (/** @type {?} */ (error))[ERROR_ORIGINAL_ERROR];
}
/**
 * @param {?} error
 * @return {?}
 */
export function getErrorLogger(error) {
    return (/** @type {?} */ (error))[ERROR_LOGGER] || defaultErrorLogger;
}
/**
 * @param {?} console
 * @param {...?} values
 * @return {?}
 */
function defaultErrorLogger(console, ...values) {
    (/** @type {?} */ (console.error))(...values);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvZXJyb3JzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQVVBLGFBQWEsVUFBVSxHQUFHLFFBQVEsQ0FBQzs7QUFDbkMsYUFBYSxtQkFBbUIsR0FBRyxnQkFBZ0IsQ0FBQzs7QUFDcEQsYUFBYSxvQkFBb0IsR0FBRyxpQkFBaUIsQ0FBQzs7QUFDdEQsYUFBYSxZQUFZLEdBQUcsZUFBZSxDQUFDOzs7OztBQUc1QyxNQUFNLFVBQVUsT0FBTyxDQUFDLEtBQVk7SUFDbEMsT0FBTyxtQkFBQyxLQUFZLEVBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQztDQUNuQzs7Ozs7QUFFRCxNQUFNLFVBQVUsZUFBZSxDQUFDLEtBQVk7SUFDMUMsT0FBTyxtQkFBQyxLQUFZLEVBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0NBQzVDOzs7OztBQUVELE1BQU0sVUFBVSxnQkFBZ0IsQ0FBQyxLQUFZO0lBQzNDLE9BQU8sbUJBQUMsS0FBWSxFQUFDLENBQUMsb0JBQW9CLENBQUMsQ0FBQztDQUM3Qzs7Ozs7QUFFRCxNQUFNLFVBQVUsY0FBYyxDQUFDLEtBQVk7SUFDekMsT0FBTyxtQkFBQyxLQUFZLEVBQUMsQ0FBQyxZQUFZLENBQUMsSUFBSSxrQkFBa0IsQ0FBQztDQUMzRDs7Ozs7O0FBR0QsU0FBUyxrQkFBa0IsQ0FBQyxPQUFnQixFQUFFLEdBQUcsTUFBYTtJQUM1RCxtQkFBTSxPQUFPLENBQUMsS0FBSyxFQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQztDQUNqQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtEZWJ1Z0NvbnRleHR9IGZyb20gJy4vdmlldyc7XG5cbmV4cG9ydCBjb25zdCBFUlJPUl9UWVBFID0gJ25nVHlwZSc7XG5leHBvcnQgY29uc3QgRVJST1JfREVCVUdfQ09OVEVYVCA9ICduZ0RlYnVnQ29udGV4dCc7XG5leHBvcnQgY29uc3QgRVJST1JfT1JJR0lOQUxfRVJST1IgPSAnbmdPcmlnaW5hbEVycm9yJztcbmV4cG9ydCBjb25zdCBFUlJPUl9MT0dHRVIgPSAnbmdFcnJvckxvZ2dlcic7XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFR5cGUoZXJyb3I6IEVycm9yKTogRnVuY3Rpb24ge1xuICByZXR1cm4gKGVycm9yIGFzIGFueSlbRVJST1JfVFlQRV07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXREZWJ1Z0NvbnRleHQoZXJyb3I6IEVycm9yKTogRGVidWdDb250ZXh0IHtcbiAgcmV0dXJuIChlcnJvciBhcyBhbnkpW0VSUk9SX0RFQlVHX0NPTlRFWFRdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JpZ2luYWxFcnJvcihlcnJvcjogRXJyb3IpOiBFcnJvciB7XG4gIHJldHVybiAoZXJyb3IgYXMgYW55KVtFUlJPUl9PUklHSU5BTF9FUlJPUl07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRFcnJvckxvZ2dlcihlcnJvcjogRXJyb3IpOiAoY29uc29sZTogQ29uc29sZSwgLi4udmFsdWVzOiBhbnlbXSkgPT4gdm9pZCB7XG4gIHJldHVybiAoZXJyb3IgYXMgYW55KVtFUlJPUl9MT0dHRVJdIHx8IGRlZmF1bHRFcnJvckxvZ2dlcjtcbn1cblxuXG5mdW5jdGlvbiBkZWZhdWx0RXJyb3JMb2dnZXIoY29uc29sZTogQ29uc29sZSwgLi4udmFsdWVzOiBhbnlbXSkge1xuICAoPGFueT5jb25zb2xlLmVycm9yKSguLi52YWx1ZXMpO1xufSJdfQ==
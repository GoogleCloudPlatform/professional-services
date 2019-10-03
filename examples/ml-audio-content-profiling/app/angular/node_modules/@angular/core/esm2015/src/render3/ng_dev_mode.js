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
/**
 * @return {?}
 */
export function ngDevModeResetPerfCounters() {
    /** @type {?} */
    const newCounters = {
        firstTemplatePass: 0,
        tNode: 0,
        tView: 0,
        rendererCreateTextNode: 0,
        rendererSetText: 0,
        rendererCreateElement: 0,
        rendererAddEventListener: 0,
        rendererSetAttribute: 0,
        rendererRemoveAttribute: 0,
        rendererSetProperty: 0,
        rendererSetClassName: 0,
        rendererAddClass: 0,
        rendererRemoveClass: 0,
        rendererSetStyle: 0,
        rendererRemoveStyle: 0,
        rendererDestroy: 0,
        rendererDestroyNode: 0,
        rendererMoveNode: 0,
        rendererRemoveNode: 0,
        rendererCreateComment: 0,
    };
    // NOTE: Under Ivy we may have both window & global defined in the Node
    //    environment since ensureDocument() in render3.ts sets global.window.
    if (typeof window != 'undefined') {
        // Make sure to refer to ngDevMode as ['ngDevMode'] for closure.
        (/** @type {?} */ (window))['ngDevMode'] = newCounters;
    }
    if (typeof global != 'undefined') {
        // Make sure to refer to ngDevMode as ['ngDevMode'] for closure.
        (/** @type {?} */ (global))['ngDevMode'] = newCounters;
    }
    if (typeof self != 'undefined') {
        // Make sure to refer to ngDevMode as ['ngDevMode'] for closure.
        (/** @type {?} */ (self))['ngDevMode'] = newCounters;
    }
    return newCounters;
}
/**
 * This checks to see if the `ngDevMode` has been set. If yes,
 * than we honor it, otherwise we default to dev mode with additional checks.
 *
 * The idea is that unless we are doing production build where we explicitly
 * set `ngDevMode == false` we should be helping the developer by providing
 * as much early warning and errors as possible.
 */
if (typeof ngDevMode === 'undefined' || ngDevMode) {
    ngDevModeResetPerfCounters();
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfZGV2X21vZGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25nX2Rldl9tb2RlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBb0NBLE1BQU0sVUFBVSwwQkFBMEI7O0lBQ3hDLE1BQU0sV0FBVyxHQUEwQjtRQUN6QyxpQkFBaUIsRUFBRSxDQUFDO1FBQ3BCLEtBQUssRUFBRSxDQUFDO1FBQ1IsS0FBSyxFQUFFLENBQUM7UUFDUixzQkFBc0IsRUFBRSxDQUFDO1FBQ3pCLGVBQWUsRUFBRSxDQUFDO1FBQ2xCLHFCQUFxQixFQUFFLENBQUM7UUFDeEIsd0JBQXdCLEVBQUUsQ0FBQztRQUMzQixvQkFBb0IsRUFBRSxDQUFDO1FBQ3ZCLHVCQUF1QixFQUFFLENBQUM7UUFDMUIsbUJBQW1CLEVBQUUsQ0FBQztRQUN0QixvQkFBb0IsRUFBRSxDQUFDO1FBQ3ZCLGdCQUFnQixFQUFFLENBQUM7UUFDbkIsbUJBQW1CLEVBQUUsQ0FBQztRQUN0QixnQkFBZ0IsRUFBRSxDQUFDO1FBQ25CLG1CQUFtQixFQUFFLENBQUM7UUFDdEIsZUFBZSxFQUFFLENBQUM7UUFDbEIsbUJBQW1CLEVBQUUsQ0FBQztRQUN0QixnQkFBZ0IsRUFBRSxDQUFDO1FBQ25CLGtCQUFrQixFQUFFLENBQUM7UUFDckIscUJBQXFCLEVBQUUsQ0FBQztLQUN6QixDQUFDOzs7SUFHRixJQUFJLE9BQU8sTUFBTSxJQUFJLFdBQVcsRUFBRTs7UUFFaEMsbUJBQUMsTUFBYSxFQUFDLENBQUMsV0FBVyxDQUFDLEdBQUcsV0FBVyxDQUFDO0tBQzVDO0lBQ0QsSUFBSSxPQUFPLE1BQU0sSUFBSSxXQUFXLEVBQUU7O1FBRWhDLG1CQUFDLE1BQWEsRUFBQyxDQUFDLFdBQVcsQ0FBQyxHQUFHLFdBQVcsQ0FBQztLQUM1QztJQUNELElBQUksT0FBTyxJQUFJLElBQUksV0FBVyxFQUFFOztRQUU5QixtQkFBQyxJQUFXLEVBQUMsQ0FBQyxXQUFXLENBQUMsR0FBRyxXQUFXLENBQUM7S0FDMUM7SUFDRCxPQUFPLFdBQVcsQ0FBQztDQUNwQjs7Ozs7Ozs7O0FBVUQsSUFBSSxPQUFPLFNBQVMsS0FBSyxXQUFXLElBQUksU0FBUyxFQUFFO0lBQ2pELDBCQUEwQixFQUFFLENBQUM7Q0FDOUIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmRlY2xhcmUgZ2xvYmFsIHtcbiAgY29uc3QgbmdEZXZNb2RlOiBudWxsfE5nRGV2TW9kZVBlcmZDb3VudGVycztcbiAgaW50ZXJmYWNlIE5nRGV2TW9kZVBlcmZDb3VudGVycyB7XG4gICAgZmlyc3RUZW1wbGF0ZVBhc3M6IG51bWJlcjtcbiAgICB0Tm9kZTogbnVtYmVyO1xuICAgIHRWaWV3OiBudW1iZXI7XG4gICAgcmVuZGVyZXJDcmVhdGVUZXh0Tm9kZTogbnVtYmVyO1xuICAgIHJlbmRlcmVyU2V0VGV4dDogbnVtYmVyO1xuICAgIHJlbmRlcmVyQ3JlYXRlRWxlbWVudDogbnVtYmVyO1xuICAgIHJlbmRlcmVyQWRkRXZlbnRMaXN0ZW5lcjogbnVtYmVyO1xuICAgIHJlbmRlcmVyU2V0QXR0cmlidXRlOiBudW1iZXI7XG4gICAgcmVuZGVyZXJSZW1vdmVBdHRyaWJ1dGU6IG51bWJlcjtcbiAgICByZW5kZXJlclNldFByb3BlcnR5OiBudW1iZXI7XG4gICAgcmVuZGVyZXJTZXRDbGFzc05hbWU6IG51bWJlcjtcbiAgICByZW5kZXJlckFkZENsYXNzOiBudW1iZXI7XG4gICAgcmVuZGVyZXJSZW1vdmVDbGFzczogbnVtYmVyO1xuICAgIHJlbmRlcmVyU2V0U3R5bGU6IG51bWJlcjtcbiAgICByZW5kZXJlclJlbW92ZVN0eWxlOiBudW1iZXI7XG4gICAgcmVuZGVyZXJEZXN0cm95OiBudW1iZXI7XG4gICAgcmVuZGVyZXJEZXN0cm95Tm9kZTogbnVtYmVyO1xuICAgIHJlbmRlcmVyTW92ZU5vZGU6IG51bWJlcjtcbiAgICByZW5kZXJlclJlbW92ZU5vZGU6IG51bWJlcjtcbiAgICByZW5kZXJlckNyZWF0ZUNvbW1lbnQ6IG51bWJlcjtcbiAgfVxufVxuXG5kZWNsYXJlIGxldCBnbG9iYWw6IGFueTtcblxuZXhwb3J0IGZ1bmN0aW9uIG5nRGV2TW9kZVJlc2V0UGVyZkNvdW50ZXJzKCk6IE5nRGV2TW9kZVBlcmZDb3VudGVycyB7XG4gIGNvbnN0IG5ld0NvdW50ZXJzOiBOZ0Rldk1vZGVQZXJmQ291bnRlcnMgPSB7XG4gICAgZmlyc3RUZW1wbGF0ZVBhc3M6IDAsXG4gICAgdE5vZGU6IDAsXG4gICAgdFZpZXc6IDAsXG4gICAgcmVuZGVyZXJDcmVhdGVUZXh0Tm9kZTogMCxcbiAgICByZW5kZXJlclNldFRleHQ6IDAsXG4gICAgcmVuZGVyZXJDcmVhdGVFbGVtZW50OiAwLFxuICAgIHJlbmRlcmVyQWRkRXZlbnRMaXN0ZW5lcjogMCxcbiAgICByZW5kZXJlclNldEF0dHJpYnV0ZTogMCxcbiAgICByZW5kZXJlclJlbW92ZUF0dHJpYnV0ZTogMCxcbiAgICByZW5kZXJlclNldFByb3BlcnR5OiAwLFxuICAgIHJlbmRlcmVyU2V0Q2xhc3NOYW1lOiAwLFxuICAgIHJlbmRlcmVyQWRkQ2xhc3M6IDAsXG4gICAgcmVuZGVyZXJSZW1vdmVDbGFzczogMCxcbiAgICByZW5kZXJlclNldFN0eWxlOiAwLFxuICAgIHJlbmRlcmVyUmVtb3ZlU3R5bGU6IDAsXG4gICAgcmVuZGVyZXJEZXN0cm95OiAwLFxuICAgIHJlbmRlcmVyRGVzdHJveU5vZGU6IDAsXG4gICAgcmVuZGVyZXJNb3ZlTm9kZTogMCxcbiAgICByZW5kZXJlclJlbW92ZU5vZGU6IDAsXG4gICAgcmVuZGVyZXJDcmVhdGVDb21tZW50OiAwLFxuICB9O1xuICAvLyBOT1RFOiBVbmRlciBJdnkgd2UgbWF5IGhhdmUgYm90aCB3aW5kb3cgJiBnbG9iYWwgZGVmaW5lZCBpbiB0aGUgTm9kZVxuICAvLyAgICBlbnZpcm9ubWVudCBzaW5jZSBlbnN1cmVEb2N1bWVudCgpIGluIHJlbmRlcjMudHMgc2V0cyBnbG9iYWwud2luZG93LlxuICBpZiAodHlwZW9mIHdpbmRvdyAhPSAndW5kZWZpbmVkJykge1xuICAgIC8vIE1ha2Ugc3VyZSB0byByZWZlciB0byBuZ0Rldk1vZGUgYXMgWyduZ0Rldk1vZGUnXSBmb3IgY2xvc3VyZS5cbiAgICAod2luZG93IGFzIGFueSlbJ25nRGV2TW9kZSddID0gbmV3Q291bnRlcnM7XG4gIH1cbiAgaWYgKHR5cGVvZiBnbG9iYWwgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAvLyBNYWtlIHN1cmUgdG8gcmVmZXIgdG8gbmdEZXZNb2RlIGFzIFsnbmdEZXZNb2RlJ10gZm9yIGNsb3N1cmUuXG4gICAgKGdsb2JhbCBhcyBhbnkpWyduZ0Rldk1vZGUnXSA9IG5ld0NvdW50ZXJzO1xuICB9XG4gIGlmICh0eXBlb2Ygc2VsZiAhPSAndW5kZWZpbmVkJykge1xuICAgIC8vIE1ha2Ugc3VyZSB0byByZWZlciB0byBuZ0Rldk1vZGUgYXMgWyduZ0Rldk1vZGUnXSBmb3IgY2xvc3VyZS5cbiAgICAoc2VsZiBhcyBhbnkpWyduZ0Rldk1vZGUnXSA9IG5ld0NvdW50ZXJzO1xuICB9XG4gIHJldHVybiBuZXdDb3VudGVycztcbn1cblxuLyoqXG4gKiBUaGlzIGNoZWNrcyB0byBzZWUgaWYgdGhlIGBuZ0Rldk1vZGVgIGhhcyBiZWVuIHNldC4gSWYgeWVzLFxuICogdGhhbiB3ZSBob25vciBpdCwgb3RoZXJ3aXNlIHdlIGRlZmF1bHQgdG8gZGV2IG1vZGUgd2l0aCBhZGRpdGlvbmFsIGNoZWNrcy5cbiAqXG4gKiBUaGUgaWRlYSBpcyB0aGF0IHVubGVzcyB3ZSBhcmUgZG9pbmcgcHJvZHVjdGlvbiBidWlsZCB3aGVyZSB3ZSBleHBsaWNpdGx5XG4gKiBzZXQgYG5nRGV2TW9kZSA9PSBmYWxzZWAgd2Ugc2hvdWxkIGJlIGhlbHBpbmcgdGhlIGRldmVsb3BlciBieSBwcm92aWRpbmdcbiAqIGFzIG11Y2ggZWFybHkgd2FybmluZyBhbmQgZXJyb3JzIGFzIHBvc3NpYmxlLlxuICovXG5pZiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSB7XG4gIG5nRGV2TW9kZVJlc2V0UGVyZkNvdW50ZXJzKCk7XG59XG4iXX0=
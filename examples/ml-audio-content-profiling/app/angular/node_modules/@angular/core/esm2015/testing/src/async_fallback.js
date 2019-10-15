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
const _global = /** @type {?} */ ((typeof window === 'undefined' ? global : window));
/**
 * Wraps a test function in an asynchronous test zone. The test will automatically
 * complete when all asynchronous calls within this zone are done. Can be used
 * to wrap an {\@link inject} call.
 *
 * Example:
 *
 * ```
 * it('...', async(inject([AClass], (object) => {
 *   object.doSomething.then(() => {
 *     expect(...);
 *   })
 * });
 * ```
 *
 *
 * @param {?} fn
 * @return {?}
 */
export function asyncFallback(fn) {
    // If we're running using the Jasmine test framework, adapt to call the 'done'
    // function when asynchronous activity is finished.
    if (_global.jasmine) {
        // Not using an arrow function to preserve context passed from call site
        return function (done) {
            if (!done) {
                // if we run beforeEach in @angular/core/testing/testing_internal then we get no done
                // fake it here and assume sync.
                done = function () { };
                done.fail = function (e) { throw e; };
            }
            runInTestZone(fn, this, done, (err) => {
                if (typeof err === 'string') {
                    return done.fail(new Error(/** @type {?} */ (err)));
                }
                else {
                    done.fail(err);
                }
            });
        };
    }
    // Otherwise, return a promise which will resolve when asynchronous activity
    // is finished. This will be correctly consumed by the Mocha framework with
    // it('...', async(myFn)); or can be used in a custom framework.
    // Not using an arrow function to preserve context passed from call site
    return function () {
        return new Promise((finishCallback, failCallback) => {
            runInTestZone(fn, this, finishCallback, failCallback);
        });
    };
}
/**
 * @param {?} fn
 * @param {?} context
 * @param {?} finishCallback
 * @param {?} failCallback
 * @return {?}
 */
function runInTestZone(fn, context, finishCallback, failCallback) {
    /** @type {?} */
    const currentZone = Zone.current;
    /** @type {?} */
    const AsyncTestZoneSpec = (/** @type {?} */ (Zone))['AsyncTestZoneSpec'];
    if (AsyncTestZoneSpec === undefined) {
        throw new Error('AsyncTestZoneSpec is needed for the async() test helper but could not be found. ' +
            'Please make sure that your environment includes zone.js/dist/async-test.js');
    }
    /** @type {?} */
    const ProxyZoneSpec = /** @type {?} */ ((/** @type {?} */ (Zone))['ProxyZoneSpec']);
    if (ProxyZoneSpec === undefined) {
        throw new Error('ProxyZoneSpec is needed for the async() test helper but could not be found. ' +
            'Please make sure that your environment includes zone.js/dist/proxy.js');
    }
    /** @type {?} */
    const proxyZoneSpec = ProxyZoneSpec.get();
    ProxyZoneSpec.assertPresent();
    /** @type {?} */
    const proxyZone = Zone.current.getZoneWith('ProxyZoneSpec');
    /** @type {?} */
    const previousDelegate = proxyZoneSpec.getDelegate();
    proxyZone.parent.run(() => {
        /** @type {?} */
        const testZoneSpec = new AsyncTestZoneSpec(() => {
            // Need to restore the original zone.
            currentZone.run(() => {
                if (proxyZoneSpec.getDelegate() == testZoneSpec) {
                    // Only reset the zone spec if it's sill this one. Otherwise, assume it's OK.
                    proxyZoneSpec.setDelegate(previousDelegate);
                }
                finishCallback();
            });
        }, (error) => {
            // Need to restore the original zone.
            currentZone.run(() => {
                if (proxyZoneSpec.getDelegate() == testZoneSpec) {
                    // Only reset the zone spec if it's sill this one. Otherwise, assume it's OK.
                    proxyZoneSpec.setDelegate(previousDelegate);
                }
                failCallback(error);
            });
        }, 'test');
        proxyZoneSpec.setDelegate(testZoneSpec);
    });
    return Zone.current.runGuarded(fn, context);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXN5bmNfZmFsbGJhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL2FzeW5jX2ZhbGxiYWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQWNBLE1BQU0sT0FBTyxxQkFBUSxDQUFDLE9BQU8sTUFBTSxLQUFLLFdBQVcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtQnZFLE1BQU0sVUFBVSxhQUFhLENBQUMsRUFBWTs7O0lBR3hDLElBQUksT0FBTyxDQUFDLE9BQU8sRUFBRTs7UUFFbkIsT0FBTyxVQUFTLElBQVM7WUFDdkIsSUFBSSxDQUFDLElBQUksRUFBRTs7O2dCQUdULElBQUksR0FBRyxlQUFhLENBQUM7Z0JBQ3JCLElBQUksQ0FBQyxJQUFJLEdBQUcsVUFBUyxDQUFNLElBQUksTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDO2FBQzNDO1lBQ0QsYUFBYSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsR0FBUSxFQUFFLEVBQUU7Z0JBQ3pDLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUSxFQUFFO29CQUMzQixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLG1CQUFTLEdBQUcsRUFBQyxDQUFDLENBQUM7aUJBQzFDO3FCQUFNO29CQUNMLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7aUJBQ2hCO2FBQ0YsQ0FBQyxDQUFDO1NBQ0osQ0FBQztLQUNIOzs7OztJQUtELE9BQU87UUFDTCxPQUFPLElBQUksT0FBTyxDQUFPLENBQUMsY0FBYyxFQUFFLFlBQVksRUFBRSxFQUFFO1lBQ3hELGFBQWEsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxZQUFZLENBQUMsQ0FBQztTQUN2RCxDQUFDLENBQUM7S0FDSixDQUFDO0NBQ0g7Ozs7Ozs7O0FBRUQsU0FBUyxhQUFhLENBQ2xCLEVBQVksRUFBRSxPQUFZLEVBQUUsY0FBd0IsRUFBRSxZQUFzQjs7SUFDOUUsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQzs7SUFDakMsTUFBTSxpQkFBaUIsR0FBRyxtQkFBQyxJQUFXLEVBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0lBQzdELElBQUksaUJBQWlCLEtBQUssU0FBUyxFQUFFO1FBQ25DLE1BQU0sSUFBSSxLQUFLLENBQ1gsa0ZBQWtGO1lBQ2xGLDRFQUE0RSxDQUFDLENBQUM7S0FDbkY7O0lBQ0QsTUFBTSxhQUFhLHFCQUFHLG1CQUFDLElBQVcsRUFBQyxDQUFDLGVBQWUsQ0FHbEQsRUFBQztJQUNGLElBQUksYUFBYSxLQUFLLFNBQVMsRUFBRTtRQUMvQixNQUFNLElBQUksS0FBSyxDQUNYLDhFQUE4RTtZQUM5RSx1RUFBdUUsQ0FBQyxDQUFDO0tBQzlFOztJQUNELE1BQU0sYUFBYSxHQUFHLGFBQWEsQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUMxQyxhQUFhLENBQUMsYUFBYSxFQUFFLENBQUM7O0lBRzlCLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLGVBQWUsQ0FBQyxDQUFDOztJQUM1RCxNQUFNLGdCQUFnQixHQUFHLGFBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUNyRCxTQUFTLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUU7O1FBQ3hCLE1BQU0sWUFBWSxHQUFhLElBQUksaUJBQWlCLENBQ2hELEdBQUcsRUFBRTs7WUFFSCxXQUFXLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRTtnQkFDbkIsSUFBSSxhQUFhLENBQUMsV0FBVyxFQUFFLElBQUksWUFBWSxFQUFFOztvQkFFL0MsYUFBYSxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO2lCQUM3QztnQkFDRCxjQUFjLEVBQUUsQ0FBQzthQUNsQixDQUFDLENBQUM7U0FDSixFQUNELENBQUMsS0FBVSxFQUFFLEVBQUU7O1lBRWIsV0FBVyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUU7Z0JBQ25CLElBQUksYUFBYSxDQUFDLFdBQVcsRUFBRSxJQUFJLFlBQVksRUFBRTs7b0JBRS9DLGFBQWEsQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztpQkFDN0M7Z0JBQ0QsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQ3JCLENBQUMsQ0FBQztTQUNKLEVBQ0QsTUFBTSxDQUFDLENBQUM7UUFDWixhQUFhLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDO0tBQ3pDLENBQUMsQ0FBQztJQUNILE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0NBQzdDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKipcbiAqIGFzeW5jIGhhcyBiZWVuIG1vdmVkIHRvIHpvbmUuanNcbiAqIHRoaXMgZmlsZSBpcyBmb3IgZmFsbGJhY2sgaW4gY2FzZSBvbGQgdmVyc2lvbiBvZiB6b25lLmpzIGlzIHVzZWRcbiAqL1xuZGVjbGFyZSB2YXIgZ2xvYmFsOiBhbnk7XG5cbmNvbnN0IF9nbG9iYWwgPSA8YW55Pih0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6IHdpbmRvdyk7XG5cbi8qKlxuICogV3JhcHMgYSB0ZXN0IGZ1bmN0aW9uIGluIGFuIGFzeW5jaHJvbm91cyB0ZXN0IHpvbmUuIFRoZSB0ZXN0IHdpbGwgYXV0b21hdGljYWxseVxuICogY29tcGxldGUgd2hlbiBhbGwgYXN5bmNocm9ub3VzIGNhbGxzIHdpdGhpbiB0aGlzIHpvbmUgYXJlIGRvbmUuIENhbiBiZSB1c2VkXG4gKiB0byB3cmFwIGFuIHtAbGluayBpbmplY3R9IGNhbGwuXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGBcbiAqIGl0KCcuLi4nLCBhc3luYyhpbmplY3QoW0FDbGFzc10sIChvYmplY3QpID0+IHtcbiAqICAgb2JqZWN0LmRvU29tZXRoaW5nLnRoZW4oKCkgPT4ge1xuICogICAgIGV4cGVjdCguLi4pO1xuICogICB9KVxuICogfSk7XG4gKiBgYGBcbiAqXG4gKlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXN5bmNGYWxsYmFjayhmbjogRnVuY3Rpb24pOiAoZG9uZTogYW55KSA9PiBhbnkge1xuICAvLyBJZiB3ZSdyZSBydW5uaW5nIHVzaW5nIHRoZSBKYXNtaW5lIHRlc3QgZnJhbWV3b3JrLCBhZGFwdCB0byBjYWxsIHRoZSAnZG9uZSdcbiAgLy8gZnVuY3Rpb24gd2hlbiBhc3luY2hyb25vdXMgYWN0aXZpdHkgaXMgZmluaXNoZWQuXG4gIGlmIChfZ2xvYmFsLmphc21pbmUpIHtcbiAgICAvLyBOb3QgdXNpbmcgYW4gYXJyb3cgZnVuY3Rpb24gdG8gcHJlc2VydmUgY29udGV4dCBwYXNzZWQgZnJvbSBjYWxsIHNpdGVcbiAgICByZXR1cm4gZnVuY3Rpb24oZG9uZTogYW55KSB7XG4gICAgICBpZiAoIWRvbmUpIHtcbiAgICAgICAgLy8gaWYgd2UgcnVuIGJlZm9yZUVhY2ggaW4gQGFuZ3VsYXIvY29yZS90ZXN0aW5nL3Rlc3RpbmdfaW50ZXJuYWwgdGhlbiB3ZSBnZXQgbm8gZG9uZVxuICAgICAgICAvLyBmYWtlIGl0IGhlcmUgYW5kIGFzc3VtZSBzeW5jLlxuICAgICAgICBkb25lID0gZnVuY3Rpb24oKSB7fTtcbiAgICAgICAgZG9uZS5mYWlsID0gZnVuY3Rpb24oZTogYW55KSB7IHRocm93IGU7IH07XG4gICAgICB9XG4gICAgICBydW5JblRlc3Rab25lKGZuLCB0aGlzLCBkb25lLCAoZXJyOiBhbnkpID0+IHtcbiAgICAgICAgaWYgKHR5cGVvZiBlcnIgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgcmV0dXJuIGRvbmUuZmFpbChuZXcgRXJyb3IoPHN0cmluZz5lcnIpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkb25lLmZhaWwoZXJyKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfTtcbiAgfVxuICAvLyBPdGhlcndpc2UsIHJldHVybiBhIHByb21pc2Ugd2hpY2ggd2lsbCByZXNvbHZlIHdoZW4gYXN5bmNocm9ub3VzIGFjdGl2aXR5XG4gIC8vIGlzIGZpbmlzaGVkLiBUaGlzIHdpbGwgYmUgY29ycmVjdGx5IGNvbnN1bWVkIGJ5IHRoZSBNb2NoYSBmcmFtZXdvcmsgd2l0aFxuICAvLyBpdCgnLi4uJywgYXN5bmMobXlGbikpOyBvciBjYW4gYmUgdXNlZCBpbiBhIGN1c3RvbSBmcmFtZXdvcmsuXG4gIC8vIE5vdCB1c2luZyBhbiBhcnJvdyBmdW5jdGlvbiB0byBwcmVzZXJ2ZSBjb250ZXh0IHBhc3NlZCBmcm9tIGNhbGwgc2l0ZVxuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChmaW5pc2hDYWxsYmFjaywgZmFpbENhbGxiYWNrKSA9PiB7XG4gICAgICBydW5JblRlc3Rab25lKGZuLCB0aGlzLCBmaW5pc2hDYWxsYmFjaywgZmFpbENhbGxiYWNrKTtcbiAgICB9KTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcnVuSW5UZXN0Wm9uZShcbiAgICBmbjogRnVuY3Rpb24sIGNvbnRleHQ6IGFueSwgZmluaXNoQ2FsbGJhY2s6IEZ1bmN0aW9uLCBmYWlsQ2FsbGJhY2s6IEZ1bmN0aW9uKSB7XG4gIGNvbnN0IGN1cnJlbnRab25lID0gWm9uZS5jdXJyZW50O1xuICBjb25zdCBBc3luY1Rlc3Rab25lU3BlYyA9IChab25lIGFzIGFueSlbJ0FzeW5jVGVzdFpvbmVTcGVjJ107XG4gIGlmIChBc3luY1Rlc3Rab25lU3BlYyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAnQXN5bmNUZXN0Wm9uZVNwZWMgaXMgbmVlZGVkIGZvciB0aGUgYXN5bmMoKSB0ZXN0IGhlbHBlciBidXQgY291bGQgbm90IGJlIGZvdW5kLiAnICtcbiAgICAgICAgJ1BsZWFzZSBtYWtlIHN1cmUgdGhhdCB5b3VyIGVudmlyb25tZW50IGluY2x1ZGVzIHpvbmUuanMvZGlzdC9hc3luYy10ZXN0LmpzJyk7XG4gIH1cbiAgY29uc3QgUHJveHlab25lU3BlYyA9IChab25lIGFzIGFueSlbJ1Byb3h5Wm9uZVNwZWMnXSBhcyB7XG4gICAgZ2V0KCk6IHtzZXREZWxlZ2F0ZShzcGVjOiBab25lU3BlYyk6IHZvaWQ7IGdldERlbGVnYXRlKCk6IFpvbmVTcGVjO307XG4gICAgYXNzZXJ0UHJlc2VudDogKCkgPT4gdm9pZDtcbiAgfTtcbiAgaWYgKFByb3h5Wm9uZVNwZWMgPT09IHVuZGVmaW5lZCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgJ1Byb3h5Wm9uZVNwZWMgaXMgbmVlZGVkIGZvciB0aGUgYXN5bmMoKSB0ZXN0IGhlbHBlciBidXQgY291bGQgbm90IGJlIGZvdW5kLiAnICtcbiAgICAgICAgJ1BsZWFzZSBtYWtlIHN1cmUgdGhhdCB5b3VyIGVudmlyb25tZW50IGluY2x1ZGVzIHpvbmUuanMvZGlzdC9wcm94eS5qcycpO1xuICB9XG4gIGNvbnN0IHByb3h5Wm9uZVNwZWMgPSBQcm94eVpvbmVTcGVjLmdldCgpO1xuICBQcm94eVpvbmVTcGVjLmFzc2VydFByZXNlbnQoKTtcbiAgLy8gV2UgbmVlZCB0byBjcmVhdGUgdGhlIEFzeW5jVGVzdFpvbmVTcGVjIG91dHNpZGUgdGhlIFByb3h5Wm9uZS5cbiAgLy8gSWYgd2UgZG8gaXQgaW4gUHJveHlab25lIHRoZW4gd2Ugd2lsbCBnZXQgdG8gaW5maW5pdGUgcmVjdXJzaW9uLlxuICBjb25zdCBwcm94eVpvbmUgPSBab25lLmN1cnJlbnQuZ2V0Wm9uZVdpdGgoJ1Byb3h5Wm9uZVNwZWMnKTtcbiAgY29uc3QgcHJldmlvdXNEZWxlZ2F0ZSA9IHByb3h5Wm9uZVNwZWMuZ2V0RGVsZWdhdGUoKTtcbiAgcHJveHlab25lLnBhcmVudC5ydW4oKCkgPT4ge1xuICAgIGNvbnN0IHRlc3Rab25lU3BlYzogWm9uZVNwZWMgPSBuZXcgQXN5bmNUZXN0Wm9uZVNwZWMoXG4gICAgICAgICgpID0+IHtcbiAgICAgICAgICAvLyBOZWVkIHRvIHJlc3RvcmUgdGhlIG9yaWdpbmFsIHpvbmUuXG4gICAgICAgICAgY3VycmVudFpvbmUucnVuKCgpID0+IHtcbiAgICAgICAgICAgIGlmIChwcm94eVpvbmVTcGVjLmdldERlbGVnYXRlKCkgPT0gdGVzdFpvbmVTcGVjKSB7XG4gICAgICAgICAgICAgIC8vIE9ubHkgcmVzZXQgdGhlIHpvbmUgc3BlYyBpZiBpdCdzIHNpbGwgdGhpcyBvbmUuIE90aGVyd2lzZSwgYXNzdW1lIGl0J3MgT0suXG4gICAgICAgICAgICAgIHByb3h5Wm9uZVNwZWMuc2V0RGVsZWdhdGUocHJldmlvdXNEZWxlZ2F0ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmaW5pc2hDYWxsYmFjaygpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICAoZXJyb3I6IGFueSkgPT4ge1xuICAgICAgICAgIC8vIE5lZWQgdG8gcmVzdG9yZSB0aGUgb3JpZ2luYWwgem9uZS5cbiAgICAgICAgICBjdXJyZW50Wm9uZS5ydW4oKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHByb3h5Wm9uZVNwZWMuZ2V0RGVsZWdhdGUoKSA9PSB0ZXN0Wm9uZVNwZWMpIHtcbiAgICAgICAgICAgICAgLy8gT25seSByZXNldCB0aGUgem9uZSBzcGVjIGlmIGl0J3Mgc2lsbCB0aGlzIG9uZS4gT3RoZXJ3aXNlLCBhc3N1bWUgaXQncyBPSy5cbiAgICAgICAgICAgICAgcHJveHlab25lU3BlYy5zZXREZWxlZ2F0ZShwcmV2aW91c0RlbGVnYXRlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZhaWxDYWxsYmFjayhlcnJvcik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgICd0ZXN0Jyk7XG4gICAgcHJveHlab25lU3BlYy5zZXREZWxlZ2F0ZSh0ZXN0Wm9uZVNwZWMpO1xuICB9KTtcbiAgcmV0dXJuIFpvbmUuY3VycmVudC5ydW5HdWFyZGVkKGZuLCBjb250ZXh0KTtcbn0iXX0=
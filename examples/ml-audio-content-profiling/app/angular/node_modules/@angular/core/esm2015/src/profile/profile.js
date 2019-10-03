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
import { createScope, detectWTF, endTimeRange, leave, startTimeRange } from './wtf_impl';
/** *
 * True if WTF is enabled.
  @type {?} */
export const wtfEnabled = detectWTF();
/**
 * @param {?=} arg0
 * @param {?=} arg1
 * @return {?}
 */
function noopScope(arg0, arg1) {
    return null;
}
/** *
 * Create trace scope.
 *
 * Scopes must be strictly nested and are analogous to stack frames, but
 * do not have to follow the stack frames. Instead it is recommended that they follow logical
 * nesting. You may want to use
 * [Event
 * Signatures](http://google.github.io/tracing-framework/instrumenting-code.html#custom-events)
 * as they are defined in WTF.
 *
 * Used to mark scope entry. The return value is used to leave the scope.
 *
 *     var myScope = wtfCreateScope('MyClass#myMethod(ascii someVal)');
 *
 *     someMethod() {
 *        var s = myScope('Foo'); // 'Foo' gets stored in tracing UI
 *        // DO SOME WORK HERE
 *        return wtfLeave(s, 123); // Return value 123
 *     }
 *
 * Note, adding try-finally block around the work to ensure that `wtfLeave` gets called can
 * negatively impact the performance of your application. For this reason we recommend that
 * you don't add them to ensure that `wtfLeave` gets called. In production `wtfLeave` is a noop and
 * so try-finally block has no value. When debugging perf issues, skipping `wtfLeave`, do to
 * exception, will produce incorrect trace, but presence of exception signifies logic error which
 * needs to be fixed before the app should be profiled. Add try-finally only when you expect that
 * an exception is expected during normal execution while profiling.
 *
 * \@publicApi
  @type {?} */
export const wtfCreateScope = wtfEnabled ? createScope : (signature, flags) => noopScope;
/** *
 * Used to mark end of Scope.
 *
 * - `scope` to end.
 * - `returnValue` (optional) to be passed to the WTF.
 *
 * Returns the `returnValue for easy chaining.
 * \@publicApi
  @type {?} */
export const wtfLeave = wtfEnabled ? leave : (s, r) => r;
/** *
 * Used to mark Async start. Async are similar to scope but they don't have to be strictly nested.
 * The return value is used in the call to [endAsync]. Async ranges only work if WTF has been
 * enabled.
 *
 *     someMethod() {
 *        var s = wtfStartTimeRange('HTTP:GET', 'some.url');
 *        var future = new Future.delay(5).then((_) {
 *          wtfEndTimeRange(s);
 *        });
 *     }
 * \@publicApi
  @type {?} */
export const wtfStartTimeRange = wtfEnabled ? startTimeRange : (rangeType, action) => null;
/** *
 * Ends a async time range operation.
 * [range] is the return value from [wtfStartTimeRange] Async ranges only work if WTF has been
 * enabled.
 * \@publicApi
  @type {?} */
export const wtfEndTimeRange = wtfEnabled ? endTimeRange : (r) => null;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZmlsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3Byb2ZpbGUvcHJvZmlsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBYSxXQUFXLEVBQUUsU0FBUyxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUFDLE1BQU0sWUFBWSxDQUFDOzs7O0FBUW5HLGFBQWEsVUFBVSxHQUFHLFNBQVMsRUFBRSxDQUFDOzs7Ozs7QUFFdEMsU0FBUyxTQUFTLENBQUMsSUFBVSxFQUFFLElBQVU7SUFDdkMsT0FBTyxJQUFJLENBQUM7Q0FDYjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWdDRCxhQUFhLGNBQWMsR0FDdkIsVUFBVSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBaUIsRUFBRSxLQUFXLEVBQUUsRUFBRSxDQUFDLFNBQVMsQ0FBQzs7Ozs7Ozs7OztBQVc3RSxhQUFhLFFBQVEsR0FDakIsVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBTSxFQUFFLENBQU8sRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDOzs7Ozs7Ozs7Ozs7OztBQWVoRCxhQUFhLGlCQUFpQixHQUMxQixVQUFVLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFpQixFQUFFLE1BQWMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDOzs7Ozs7O0FBUTlFLGFBQWEsZUFBZSxHQUF5QixVQUFVLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFNLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtXdGZTY29wZUZuLCBjcmVhdGVTY29wZSwgZGV0ZWN0V1RGLCBlbmRUaW1lUmFuZ2UsIGxlYXZlLCBzdGFydFRpbWVSYW5nZX0gZnJvbSAnLi93dGZfaW1wbCc7XG5cbmV4cG9ydCB7V3RmU2NvcGVGbn0gZnJvbSAnLi93dGZfaW1wbCc7XG5cblxuLyoqXG4gKiBUcnVlIGlmIFdURiBpcyBlbmFibGVkLlxuICovXG5leHBvcnQgY29uc3Qgd3RmRW5hYmxlZCA9IGRldGVjdFdURigpO1xuXG5mdW5jdGlvbiBub29wU2NvcGUoYXJnMD86IGFueSwgYXJnMT86IGFueSk6IGFueSB7XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIENyZWF0ZSB0cmFjZSBzY29wZS5cbiAqXG4gKiBTY29wZXMgbXVzdCBiZSBzdHJpY3RseSBuZXN0ZWQgYW5kIGFyZSBhbmFsb2dvdXMgdG8gc3RhY2sgZnJhbWVzLCBidXRcbiAqIGRvIG5vdCBoYXZlIHRvIGZvbGxvdyB0aGUgc3RhY2sgZnJhbWVzLiBJbnN0ZWFkIGl0IGlzIHJlY29tbWVuZGVkIHRoYXQgdGhleSBmb2xsb3cgbG9naWNhbFxuICogbmVzdGluZy4gWW91IG1heSB3YW50IHRvIHVzZVxuICogW0V2ZW50XG4gKiBTaWduYXR1cmVzXShodHRwOi8vZ29vZ2xlLmdpdGh1Yi5pby90cmFjaW5nLWZyYW1ld29yay9pbnN0cnVtZW50aW5nLWNvZGUuaHRtbCNjdXN0b20tZXZlbnRzKVxuICogYXMgdGhleSBhcmUgZGVmaW5lZCBpbiBXVEYuXG4gKlxuICogVXNlZCB0byBtYXJrIHNjb3BlIGVudHJ5LiBUaGUgcmV0dXJuIHZhbHVlIGlzIHVzZWQgdG8gbGVhdmUgdGhlIHNjb3BlLlxuICpcbiAqICAgICB2YXIgbXlTY29wZSA9IHd0ZkNyZWF0ZVNjb3BlKCdNeUNsYXNzI215TWV0aG9kKGFzY2lpIHNvbWVWYWwpJyk7XG4gKlxuICogICAgIHNvbWVNZXRob2QoKSB7XG4gKiAgICAgICAgdmFyIHMgPSBteVNjb3BlKCdGb28nKTsgLy8gJ0ZvbycgZ2V0cyBzdG9yZWQgaW4gdHJhY2luZyBVSVxuICogICAgICAgIC8vIERPIFNPTUUgV09SSyBIRVJFXG4gKiAgICAgICAgcmV0dXJuIHd0ZkxlYXZlKHMsIDEyMyk7IC8vIFJldHVybiB2YWx1ZSAxMjNcbiAqICAgICB9XG4gKlxuICogTm90ZSwgYWRkaW5nIHRyeS1maW5hbGx5IGJsb2NrIGFyb3VuZCB0aGUgd29yayB0byBlbnN1cmUgdGhhdCBgd3RmTGVhdmVgIGdldHMgY2FsbGVkIGNhblxuICogbmVnYXRpdmVseSBpbXBhY3QgdGhlIHBlcmZvcm1hbmNlIG9mIHlvdXIgYXBwbGljYXRpb24uIEZvciB0aGlzIHJlYXNvbiB3ZSByZWNvbW1lbmQgdGhhdFxuICogeW91IGRvbid0IGFkZCB0aGVtIHRvIGVuc3VyZSB0aGF0IGB3dGZMZWF2ZWAgZ2V0cyBjYWxsZWQuIEluIHByb2R1Y3Rpb24gYHd0ZkxlYXZlYCBpcyBhIG5vb3AgYW5kXG4gKiBzbyB0cnktZmluYWxseSBibG9jayBoYXMgbm8gdmFsdWUuIFdoZW4gZGVidWdnaW5nIHBlcmYgaXNzdWVzLCBza2lwcGluZyBgd3RmTGVhdmVgLCBkbyB0b1xuICogZXhjZXB0aW9uLCB3aWxsIHByb2R1Y2UgaW5jb3JyZWN0IHRyYWNlLCBidXQgcHJlc2VuY2Ugb2YgZXhjZXB0aW9uIHNpZ25pZmllcyBsb2dpYyBlcnJvciB3aGljaFxuICogbmVlZHMgdG8gYmUgZml4ZWQgYmVmb3JlIHRoZSBhcHAgc2hvdWxkIGJlIHByb2ZpbGVkLiBBZGQgdHJ5LWZpbmFsbHkgb25seSB3aGVuIHlvdSBleHBlY3QgdGhhdFxuICogYW4gZXhjZXB0aW9uIGlzIGV4cGVjdGVkIGR1cmluZyBub3JtYWwgZXhlY3V0aW9uIHdoaWxlIHByb2ZpbGluZy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCB3dGZDcmVhdGVTY29wZTogKHNpZ25hdHVyZTogc3RyaW5nLCBmbGFncz86IGFueSkgPT4gV3RmU2NvcGVGbiA9XG4gICAgd3RmRW5hYmxlZCA/IGNyZWF0ZVNjb3BlIDogKHNpZ25hdHVyZTogc3RyaW5nLCBmbGFncz86IGFueSkgPT4gbm9vcFNjb3BlO1xuXG4vKipcbiAqIFVzZWQgdG8gbWFyayBlbmQgb2YgU2NvcGUuXG4gKlxuICogLSBgc2NvcGVgIHRvIGVuZC5cbiAqIC0gYHJldHVyblZhbHVlYCAob3B0aW9uYWwpIHRvIGJlIHBhc3NlZCB0byB0aGUgV1RGLlxuICpcbiAqIFJldHVybnMgdGhlIGByZXR1cm5WYWx1ZSBmb3IgZWFzeSBjaGFpbmluZy5cbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IHd0ZkxlYXZlOiA8VD4oc2NvcGU6IGFueSwgcmV0dXJuVmFsdWU/OiBUKSA9PiBUID1cbiAgICB3dGZFbmFibGVkID8gbGVhdmUgOiAoczogYW55LCByPzogYW55KSA9PiByO1xuXG4vKipcbiAqIFVzZWQgdG8gbWFyayBBc3luYyBzdGFydC4gQXN5bmMgYXJlIHNpbWlsYXIgdG8gc2NvcGUgYnV0IHRoZXkgZG9uJ3QgaGF2ZSB0byBiZSBzdHJpY3RseSBuZXN0ZWQuXG4gKiBUaGUgcmV0dXJuIHZhbHVlIGlzIHVzZWQgaW4gdGhlIGNhbGwgdG8gW2VuZEFzeW5jXS4gQXN5bmMgcmFuZ2VzIG9ubHkgd29yayBpZiBXVEYgaGFzIGJlZW5cbiAqIGVuYWJsZWQuXG4gKlxuICogICAgIHNvbWVNZXRob2QoKSB7XG4gKiAgICAgICAgdmFyIHMgPSB3dGZTdGFydFRpbWVSYW5nZSgnSFRUUDpHRVQnLCAnc29tZS51cmwnKTtcbiAqICAgICAgICB2YXIgZnV0dXJlID0gbmV3IEZ1dHVyZS5kZWxheSg1KS50aGVuKChfKSB7XG4gKiAgICAgICAgICB3dGZFbmRUaW1lUmFuZ2Uocyk7XG4gKiAgICAgICAgfSk7XG4gKiAgICAgfVxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3Qgd3RmU3RhcnRUaW1lUmFuZ2U6IChyYW5nZVR5cGU6IHN0cmluZywgYWN0aW9uOiBzdHJpbmcpID0+IGFueSA9XG4gICAgd3RmRW5hYmxlZCA/IHN0YXJ0VGltZVJhbmdlIDogKHJhbmdlVHlwZTogc3RyaW5nLCBhY3Rpb246IHN0cmluZykgPT4gbnVsbDtcblxuLyoqXG4gKiBFbmRzIGEgYXN5bmMgdGltZSByYW5nZSBvcGVyYXRpb24uXG4gKiBbcmFuZ2VdIGlzIHRoZSByZXR1cm4gdmFsdWUgZnJvbSBbd3RmU3RhcnRUaW1lUmFuZ2VdIEFzeW5jIHJhbmdlcyBvbmx5IHdvcmsgaWYgV1RGIGhhcyBiZWVuXG4gKiBlbmFibGVkLlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3Qgd3RmRW5kVGltZVJhbmdlOiAocmFuZ2U6IGFueSkgPT4gdm9pZCA9IHd0ZkVuYWJsZWQgPyBlbmRUaW1lUmFuZ2UgOiAocjogYW55KSA9PiBudWxsO1xuIl19
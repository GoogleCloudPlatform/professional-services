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
 * An instance of this class is returned as an event parameter when an animation
 * callback is captured for an animation either during the start or done phase.
 *
 * ```typescript
 * \@Component({
 *   host: {
 *     '[\@myAnimationTrigger]': 'someExpression',
 *     '(\@myAnimationTrigger.start)': 'captureStartEvent($event)',
 *     '(\@myAnimationTrigger.done)': 'captureDoneEvent($event)',
 *   },
 *   animations: [
 *     trigger("myAnimationTrigger", [
 *        // ...
 *     ])
 *   ]
 * })
 * class MyComponent {
 *   someExpression: any = false;
 *   captureStartEvent(event: AnimationEvent) {
 *     // the toState, fromState and totalTime data is accessible from the event variable
 *   }
 *
 *   captureDoneEvent(event: AnimationEvent) {
 *     // the toState, fromState and totalTime data is accessible from the event variable
 *   }
 * }
 * ```
 *
 * \@publicApi
 * @record
 */
export function AnimationEvent() { }
/**
 * The name of the state from which the animation is triggered.
 * @type {?}
 */
AnimationEvent.prototype.fromState;
/**
 * The name of the state in which the animation completes.
 * @type {?}
 */
AnimationEvent.prototype.toState;
/**
 * The time it takes the animation to complete, in milliseconds.
 * @type {?}
 */
AnimationEvent.prototype.totalTime;
/**
 * The animation phase in which the callback was invoked, one of
 * "start" or "done".
 * @type {?}
 */
AnimationEvent.prototype.phaseName;
/**
 * The element to which the animation is attached.
 * @type {?}
 */
AnimationEvent.prototype.element;
/**
 * Internal.
 * @type {?}
 */
AnimationEvent.prototype.triggerName;
/**
 * Internal.
 * @type {?}
 */
AnimationEvent.prototype.disabled;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5pbWF0aW9uX2V2ZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5pbWF0aW9ucy9zcmMvYW5pbWF0aW9uX2V2ZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8qKlxuICogQW4gaW5zdGFuY2Ugb2YgdGhpcyBjbGFzcyBpcyByZXR1cm5lZCBhcyBhbiBldmVudCBwYXJhbWV0ZXIgd2hlbiBhbiBhbmltYXRpb25cbiAqIGNhbGxiYWNrIGlzIGNhcHR1cmVkIGZvciBhbiBhbmltYXRpb24gZWl0aGVyIGR1cmluZyB0aGUgc3RhcnQgb3IgZG9uZSBwaGFzZS5cbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBAQ29tcG9uZW50KHtcbiAqICAgaG9zdDoge1xuICogICAgICdbQG15QW5pbWF0aW9uVHJpZ2dlcl0nOiAnc29tZUV4cHJlc3Npb24nLFxuICogICAgICcoQG15QW5pbWF0aW9uVHJpZ2dlci5zdGFydCknOiAnY2FwdHVyZVN0YXJ0RXZlbnQoJGV2ZW50KScsXG4gKiAgICAgJyhAbXlBbmltYXRpb25UcmlnZ2VyLmRvbmUpJzogJ2NhcHR1cmVEb25lRXZlbnQoJGV2ZW50KScsXG4gKiAgIH0sXG4gKiAgIGFuaW1hdGlvbnM6IFtcbiAqICAgICB0cmlnZ2VyKFwibXlBbmltYXRpb25UcmlnZ2VyXCIsIFtcbiAqICAgICAgICAvLyAuLi5cbiAqICAgICBdKVxuICogICBdXG4gKiB9KVxuICogY2xhc3MgTXlDb21wb25lbnQge1xuICogICBzb21lRXhwcmVzc2lvbjogYW55ID0gZmFsc2U7XG4gKiAgIGNhcHR1cmVTdGFydEV2ZW50KGV2ZW50OiBBbmltYXRpb25FdmVudCkge1xuICogICAgIC8vIHRoZSB0b1N0YXRlLCBmcm9tU3RhdGUgYW5kIHRvdGFsVGltZSBkYXRhIGlzIGFjY2Vzc2libGUgZnJvbSB0aGUgZXZlbnQgdmFyaWFibGVcbiAqICAgfVxuICpcbiAqICAgY2FwdHVyZURvbmVFdmVudChldmVudDogQW5pbWF0aW9uRXZlbnQpIHtcbiAqICAgICAvLyB0aGUgdG9TdGF0ZSwgZnJvbVN0YXRlIGFuZCB0b3RhbFRpbWUgZGF0YSBpcyBhY2Nlc3NpYmxlIGZyb20gdGhlIGV2ZW50IHZhcmlhYmxlXG4gKiAgIH1cbiAqIH1cbiAqIGBgYFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBBbmltYXRpb25FdmVudCB7XG4gIC8qKlxuICAgKiBUaGUgbmFtZSBvZiB0aGUgc3RhdGUgZnJvbSB3aGljaCB0aGUgYW5pbWF0aW9uIGlzIHRyaWdnZXJlZC5cbiAgICovXG4gIGZyb21TdGF0ZTogc3RyaW5nO1xuICAvKipcbiAgICogVGhlIG5hbWUgb2YgdGhlIHN0YXRlIGluIHdoaWNoIHRoZSBhbmltYXRpb24gY29tcGxldGVzLlxuICAgKi9cbiAgdG9TdGF0ZTogc3RyaW5nO1xuICAvKipcbiAgICogVGhlIHRpbWUgaXQgdGFrZXMgdGhlIGFuaW1hdGlvbiB0byBjb21wbGV0ZSwgaW4gbWlsbGlzZWNvbmRzLlxuICAgKi9cbiAgdG90YWxUaW1lOiBudW1iZXI7XG4gIC8qKlxuICAgKiBUaGUgYW5pbWF0aW9uIHBoYXNlIGluIHdoaWNoIHRoZSBjYWxsYmFjayB3YXMgaW52b2tlZCwgb25lIG9mXG4gICAqIFwic3RhcnRcIiBvciBcImRvbmVcIi5cbiAgICovXG4gIHBoYXNlTmFtZTogc3RyaW5nO1xuICAvKipcbiAgICogVGhlIGVsZW1lbnQgdG8gd2hpY2ggdGhlIGFuaW1hdGlvbiBpcyBhdHRhY2hlZC5cbiAgICovXG4gIGVsZW1lbnQ6IGFueTtcbiAgLyoqXG4gICAqIEludGVybmFsLlxuICAgKi9cbiAgdHJpZ2dlck5hbWU6IHN0cmluZztcbiAgLyoqXG4gICAqIEludGVybmFsLlxuICAgKi9cbiAgZGlzYWJsZWQ6IGJvb2xlYW47XG59XG4iXX0=
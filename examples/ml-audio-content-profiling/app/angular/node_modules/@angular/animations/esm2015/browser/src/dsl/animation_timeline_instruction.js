/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @record
 */
export function AnimationTimelineInstruction() { }
/** @type {?} */
AnimationTimelineInstruction.prototype.element;
/** @type {?} */
AnimationTimelineInstruction.prototype.keyframes;
/** @type {?} */
AnimationTimelineInstruction.prototype.preStyleProps;
/** @type {?} */
AnimationTimelineInstruction.prototype.postStyleProps;
/** @type {?} */
AnimationTimelineInstruction.prototype.duration;
/** @type {?} */
AnimationTimelineInstruction.prototype.delay;
/** @type {?} */
AnimationTimelineInstruction.prototype.totalTime;
/** @type {?} */
AnimationTimelineInstruction.prototype.easing;
/** @type {?|undefined} */
AnimationTimelineInstruction.prototype.stretchStartingKeyframe;
/** @type {?} */
AnimationTimelineInstruction.prototype.subTimeline;
/**
 * @param {?} element
 * @param {?} keyframes
 * @param {?} preStyleProps
 * @param {?} postStyleProps
 * @param {?} duration
 * @param {?} delay
 * @param {?=} easing
 * @param {?=} subTimeline
 * @return {?}
 */
export function createTimelineInstruction(element, keyframes, preStyleProps, postStyleProps, duration, delay, easing = null, subTimeline = false) {
    return {
        type: 1 /* TimelineAnimation */,
        element,
        keyframes,
        preStyleProps,
        postStyleProps,
        duration,
        delay,
        totalTime: duration + delay, easing, subTimeline
    };
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5pbWF0aW9uX3RpbWVsaW5lX2luc3RydWN0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5pbWF0aW9ucy9icm93c2VyL3NyYy9kc2wvYW5pbWF0aW9uX3RpbWVsaW5lX2luc3RydWN0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXVCQSxNQUFNLFVBQVUseUJBQXlCLENBQ3JDLE9BQVksRUFBRSxTQUF1QixFQUFFLGFBQXVCLEVBQUUsY0FBd0IsRUFDeEYsUUFBZ0IsRUFBRSxLQUFhLEVBQUUsU0FBd0IsSUFBSSxFQUM3RCxjQUF1QixLQUFLO0lBQzlCLE9BQU87UUFDTCxJQUFJLDJCQUFzRDtRQUMxRCxPQUFPO1FBQ1AsU0FBUztRQUNULGFBQWE7UUFDYixjQUFjO1FBQ2QsUUFBUTtRQUNSLEtBQUs7UUFDTCxTQUFTLEVBQUUsUUFBUSxHQUFHLEtBQUssRUFBRSxNQUFNLEVBQUUsV0FBVztLQUNqRCxDQUFDO0NBQ0giLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge8m1U3R5bGVEYXRhfSBmcm9tICdAYW5ndWxhci9hbmltYXRpb25zJztcbmltcG9ydCB7QW5pbWF0aW9uRW5naW5lSW5zdHJ1Y3Rpb24sIEFuaW1hdGlvblRyYW5zaXRpb25JbnN0cnVjdGlvblR5cGV9IGZyb20gJy4uL3JlbmRlci9hbmltYXRpb25fZW5naW5lX2luc3RydWN0aW9uJztcblxuZXhwb3J0IGludGVyZmFjZSBBbmltYXRpb25UaW1lbGluZUluc3RydWN0aW9uIGV4dGVuZHMgQW5pbWF0aW9uRW5naW5lSW5zdHJ1Y3Rpb24ge1xuICBlbGVtZW50OiBhbnk7XG4gIGtleWZyYW1lczogybVTdHlsZURhdGFbXTtcbiAgcHJlU3R5bGVQcm9wczogc3RyaW5nW107XG4gIHBvc3RTdHlsZVByb3BzOiBzdHJpbmdbXTtcbiAgZHVyYXRpb246IG51bWJlcjtcbiAgZGVsYXk6IG51bWJlcjtcbiAgdG90YWxUaW1lOiBudW1iZXI7XG4gIGVhc2luZzogc3RyaW5nfG51bGw7XG4gIHN0cmV0Y2hTdGFydGluZ0tleWZyYW1lPzogYm9vbGVhbjtcbiAgc3ViVGltZWxpbmU6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUaW1lbGluZUluc3RydWN0aW9uKFxuICAgIGVsZW1lbnQ6IGFueSwga2V5ZnJhbWVzOiDJtVN0eWxlRGF0YVtdLCBwcmVTdHlsZVByb3BzOiBzdHJpbmdbXSwgcG9zdFN0eWxlUHJvcHM6IHN0cmluZ1tdLFxuICAgIGR1cmF0aW9uOiBudW1iZXIsIGRlbGF5OiBudW1iZXIsIGVhc2luZzogc3RyaW5nIHwgbnVsbCA9IG51bGwsXG4gICAgc3ViVGltZWxpbmU6IGJvb2xlYW4gPSBmYWxzZSk6IEFuaW1hdGlvblRpbWVsaW5lSW5zdHJ1Y3Rpb24ge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IEFuaW1hdGlvblRyYW5zaXRpb25JbnN0cnVjdGlvblR5cGUuVGltZWxpbmVBbmltYXRpb24sXG4gICAgZWxlbWVudCxcbiAgICBrZXlmcmFtZXMsXG4gICAgcHJlU3R5bGVQcm9wcyxcbiAgICBwb3N0U3R5bGVQcm9wcyxcbiAgICBkdXJhdGlvbixcbiAgICBkZWxheSxcbiAgICB0b3RhbFRpbWU6IGR1cmF0aW9uICsgZGVsYXksIGVhc2luZywgc3ViVGltZWxpbmVcbiAgfTtcbn1cbiJdfQ==
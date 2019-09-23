/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @record
 */
export function AnimationTransitionInstruction() { }
/** @type {?} */
AnimationTransitionInstruction.prototype.element;
/** @type {?} */
AnimationTransitionInstruction.prototype.triggerName;
/** @type {?} */
AnimationTransitionInstruction.prototype.isRemovalTransition;
/** @type {?} */
AnimationTransitionInstruction.prototype.fromState;
/** @type {?} */
AnimationTransitionInstruction.prototype.fromStyles;
/** @type {?} */
AnimationTransitionInstruction.prototype.toState;
/** @type {?} */
AnimationTransitionInstruction.prototype.toStyles;
/** @type {?} */
AnimationTransitionInstruction.prototype.timelines;
/** @type {?} */
AnimationTransitionInstruction.prototype.queriedElements;
/** @type {?} */
AnimationTransitionInstruction.prototype.preStyleProps;
/** @type {?} */
AnimationTransitionInstruction.prototype.postStyleProps;
/** @type {?} */
AnimationTransitionInstruction.prototype.totalTime;
/** @type {?|undefined} */
AnimationTransitionInstruction.prototype.errors;
/**
 * @param {?} element
 * @param {?} triggerName
 * @param {?} fromState
 * @param {?} toState
 * @param {?} isRemovalTransition
 * @param {?} fromStyles
 * @param {?} toStyles
 * @param {?} timelines
 * @param {?} queriedElements
 * @param {?} preStyleProps
 * @param {?} postStyleProps
 * @param {?} totalTime
 * @param {?=} errors
 * @return {?}
 */
export function createTransitionInstruction(element, triggerName, fromState, toState, isRemovalTransition, fromStyles, toStyles, timelines, queriedElements, preStyleProps, postStyleProps, totalTime, errors) {
    return {
        type: 0 /* TransitionAnimation */,
        element,
        triggerName,
        isRemovalTransition,
        fromState,
        fromStyles,
        toState,
        toStyles,
        timelines,
        queriedElements,
        preStyleProps,
        postStyleProps,
        totalTime,
        errors
    };
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5pbWF0aW9uX3RyYW5zaXRpb25faW5zdHJ1Y3Rpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmltYXRpb25zL2Jyb3dzZXIvc3JjL2RzbC9hbmltYXRpb25fdHJhbnNpdGlvbl9pbnN0cnVjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTJCQSxNQUFNLFVBQVUsMkJBQTJCLENBQ3ZDLE9BQVksRUFBRSxXQUFtQixFQUFFLFNBQWlCLEVBQUUsT0FBZSxFQUNyRSxtQkFBNEIsRUFBRSxVQUFzQixFQUFFLFFBQW9CLEVBQzFFLFNBQXlDLEVBQUUsZUFBc0IsRUFDakUsYUFBa0QsRUFDbEQsY0FBbUQsRUFBRSxTQUFpQixFQUN0RSxNQUFjO0lBQ2hCLE9BQU87UUFDTCxJQUFJLDZCQUF3RDtRQUM1RCxPQUFPO1FBQ1AsV0FBVztRQUNYLG1CQUFtQjtRQUNuQixTQUFTO1FBQ1QsVUFBVTtRQUNWLE9BQU87UUFDUCxRQUFRO1FBQ1IsU0FBUztRQUNULGVBQWU7UUFDZixhQUFhO1FBQ2IsY0FBYztRQUNkLFNBQVM7UUFDVCxNQUFNO0tBQ1AsQ0FBQztDQUNIIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHvJtVN0eWxlRGF0YX0gZnJvbSAnQGFuZ3VsYXIvYW5pbWF0aW9ucyc7XG5pbXBvcnQge0FuaW1hdGlvbkVuZ2luZUluc3RydWN0aW9uLCBBbmltYXRpb25UcmFuc2l0aW9uSW5zdHJ1Y3Rpb25UeXBlfSBmcm9tICcuLi9yZW5kZXIvYW5pbWF0aW9uX2VuZ2luZV9pbnN0cnVjdGlvbic7XG5pbXBvcnQge0FuaW1hdGlvblRpbWVsaW5lSW5zdHJ1Y3Rpb259IGZyb20gJy4vYW5pbWF0aW9uX3RpbWVsaW5lX2luc3RydWN0aW9uJztcblxuZXhwb3J0IGludGVyZmFjZSBBbmltYXRpb25UcmFuc2l0aW9uSW5zdHJ1Y3Rpb24gZXh0ZW5kcyBBbmltYXRpb25FbmdpbmVJbnN0cnVjdGlvbiB7XG4gIGVsZW1lbnQ6IGFueTtcbiAgdHJpZ2dlck5hbWU6IHN0cmluZztcbiAgaXNSZW1vdmFsVHJhbnNpdGlvbjogYm9vbGVhbjtcbiAgZnJvbVN0YXRlOiBzdHJpbmc7XG4gIGZyb21TdHlsZXM6IMm1U3R5bGVEYXRhO1xuICB0b1N0YXRlOiBzdHJpbmc7XG4gIHRvU3R5bGVzOiDJtVN0eWxlRGF0YTtcbiAgdGltZWxpbmVzOiBBbmltYXRpb25UaW1lbGluZUluc3RydWN0aW9uW107XG4gIHF1ZXJpZWRFbGVtZW50czogYW55W107XG4gIHByZVN0eWxlUHJvcHM6IE1hcDxhbnksIHtbcHJvcDogc3RyaW5nXTogYm9vbGVhbn0+O1xuICBwb3N0U3R5bGVQcm9wczogTWFwPGFueSwge1twcm9wOiBzdHJpbmddOiBib29sZWFufT47XG4gIHRvdGFsVGltZTogbnVtYmVyO1xuICBlcnJvcnM/OiBhbnlbXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRyYW5zaXRpb25JbnN0cnVjdGlvbihcbiAgICBlbGVtZW50OiBhbnksIHRyaWdnZXJOYW1lOiBzdHJpbmcsIGZyb21TdGF0ZTogc3RyaW5nLCB0b1N0YXRlOiBzdHJpbmcsXG4gICAgaXNSZW1vdmFsVHJhbnNpdGlvbjogYm9vbGVhbiwgZnJvbVN0eWxlczogybVTdHlsZURhdGEsIHRvU3R5bGVzOiDJtVN0eWxlRGF0YSxcbiAgICB0aW1lbGluZXM6IEFuaW1hdGlvblRpbWVsaW5lSW5zdHJ1Y3Rpb25bXSwgcXVlcmllZEVsZW1lbnRzOiBhbnlbXSxcbiAgICBwcmVTdHlsZVByb3BzOiBNYXA8YW55LCB7W3Byb3A6IHN0cmluZ106IGJvb2xlYW59PixcbiAgICBwb3N0U3R5bGVQcm9wczogTWFwPGFueSwge1twcm9wOiBzdHJpbmddOiBib29sZWFufT4sIHRvdGFsVGltZTogbnVtYmVyLFxuICAgIGVycm9ycz86IGFueVtdKTogQW5pbWF0aW9uVHJhbnNpdGlvbkluc3RydWN0aW9uIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBBbmltYXRpb25UcmFuc2l0aW9uSW5zdHJ1Y3Rpb25UeXBlLlRyYW5zaXRpb25BbmltYXRpb24sXG4gICAgZWxlbWVudCxcbiAgICB0cmlnZ2VyTmFtZSxcbiAgICBpc1JlbW92YWxUcmFuc2l0aW9uLFxuICAgIGZyb21TdGF0ZSxcbiAgICBmcm9tU3R5bGVzLFxuICAgIHRvU3RhdGUsXG4gICAgdG9TdHlsZXMsXG4gICAgdGltZWxpbmVzLFxuICAgIHF1ZXJpZWRFbGVtZW50cyxcbiAgICBwcmVTdHlsZVByb3BzLFxuICAgIHBvc3RTdHlsZVByb3BzLFxuICAgIHRvdGFsVGltZSxcbiAgICBlcnJvcnNcbiAgfTtcbn1cbiJdfQ==
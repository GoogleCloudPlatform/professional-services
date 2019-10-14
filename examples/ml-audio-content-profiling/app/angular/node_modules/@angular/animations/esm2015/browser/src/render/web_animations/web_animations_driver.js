/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
import { allowPreviousPlayerStylesMerge, balancePreviousStylesIntoKeyframes, copyStyles } from '../../util';
import { CssKeyframesDriver } from '../css_keyframes/css_keyframes_driver';
import { containsElement, invokeQuery, isBrowser, matchesElement, validateStyleProperty } from '../shared';
import { WebAnimationsPlayer } from './web_animations_player';
export class WebAnimationsDriver {
    constructor() {
        this._isNativeImpl = /\{\s*\[native\s+code\]\s*\}/.test(getElementAnimateFn().toString());
        this._cssKeyframesDriver = new CssKeyframesDriver();
    }
    /**
     * @param {?} prop
     * @return {?}
     */
    validateStyleProperty(prop) { return validateStyleProperty(prop); }
    /**
     * @param {?} element
     * @param {?} selector
     * @return {?}
     */
    matchesElement(element, selector) {
        return matchesElement(element, selector);
    }
    /**
     * @param {?} elm1
     * @param {?} elm2
     * @return {?}
     */
    containsElement(elm1, elm2) { return containsElement(elm1, elm2); }
    /**
     * @param {?} element
     * @param {?} selector
     * @param {?} multi
     * @return {?}
     */
    query(element, selector, multi) {
        return invokeQuery(element, selector, multi);
    }
    /**
     * @param {?} element
     * @param {?} prop
     * @param {?=} defaultValue
     * @return {?}
     */
    computeStyle(element, prop, defaultValue) {
        return /** @type {?} */ ((/** @type {?} */ (window.getComputedStyle(element)))[prop]);
    }
    /**
     * @param {?} supported
     * @return {?}
     */
    overrideWebAnimationsSupport(supported) { this._isNativeImpl = supported; }
    /**
     * @param {?} element
     * @param {?} keyframes
     * @param {?} duration
     * @param {?} delay
     * @param {?} easing
     * @param {?=} previousPlayers
     * @param {?=} scrubberAccessRequested
     * @return {?}
     */
    animate(element, keyframes, duration, delay, easing, previousPlayers = [], scrubberAccessRequested) {
        /** @type {?} */
        const useKeyframes = !scrubberAccessRequested && !this._isNativeImpl;
        if (useKeyframes) {
            return this._cssKeyframesDriver.animate(element, keyframes, duration, delay, easing, previousPlayers);
        }
        /** @type {?} */
        const fill = delay == 0 ? 'both' : 'forwards';
        /** @type {?} */
        const playerOptions = { duration, delay, fill };
        // we check for this to avoid having a null|undefined value be present
        // for the easing (which results in an error for certain browsers #9752)
        if (easing) {
            playerOptions['easing'] = easing;
        }
        /** @type {?} */
        const previousStyles = {};
        /** @type {?} */
        const previousWebAnimationPlayers = /** @type {?} */ (previousPlayers.filter(player => player instanceof WebAnimationsPlayer));
        if (allowPreviousPlayerStylesMerge(duration, delay)) {
            previousWebAnimationPlayers.forEach(player => {
                /** @type {?} */
                let styles = player.currentSnapshot;
                Object.keys(styles).forEach(prop => previousStyles[prop] = styles[prop]);
            });
        }
        keyframes = keyframes.map(styles => copyStyles(styles, false));
        keyframes = balancePreviousStylesIntoKeyframes(element, keyframes, previousStyles);
        return new WebAnimationsPlayer(element, keyframes, playerOptions);
    }
}
if (false) {
    /** @type {?} */
    WebAnimationsDriver.prototype._isNativeImpl;
    /** @type {?} */
    WebAnimationsDriver.prototype._cssKeyframesDriver;
}
/**
 * @return {?}
 */
export function supportsWebAnimations() {
    return typeof getElementAnimateFn() === 'function';
}
/**
 * @return {?}
 */
function getElementAnimateFn() {
    return (isBrowser() && (/** @type {?} */ (Element)).prototype['animate']) || {};
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViX2FuaW1hdGlvbnNfZHJpdmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5pbWF0aW9ucy9icm93c2VyL3NyYy9yZW5kZXIvd2ViX2FuaW1hdGlvbnMvd2ViX2FuaW1hdGlvbnNfZHJpdmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFTQSxPQUFPLEVBQUMsOEJBQThCLEVBQUUsa0NBQWtDLEVBQUUsVUFBVSxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBRTFHLE9BQU8sRUFBQyxrQkFBa0IsRUFBQyxNQUFNLHVDQUF1QyxDQUFDO0FBQ3pFLE9BQU8sRUFBQyxlQUFlLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxjQUFjLEVBQUUscUJBQXFCLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFFekcsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFFNUQsTUFBTSxPQUFPLG1CQUFtQjs7NkJBQ04sNkJBQTZCLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUMsUUFBUSxFQUFFLENBQUM7bUNBQzlELElBQUksa0JBQWtCLEVBQUU7Ozs7OztJQUV0RCxxQkFBcUIsQ0FBQyxJQUFZLElBQWEsT0FBTyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFOzs7Ozs7SUFFcEYsY0FBYyxDQUFDLE9BQVksRUFBRSxRQUFnQjtRQUMzQyxPQUFPLGNBQWMsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7S0FDMUM7Ozs7OztJQUVELGVBQWUsQ0FBQyxJQUFTLEVBQUUsSUFBUyxJQUFhLE9BQU8sZUFBZSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFOzs7Ozs7O0lBRXRGLEtBQUssQ0FBQyxPQUFZLEVBQUUsUUFBZ0IsRUFBRSxLQUFjO1FBQ2xELE9BQU8sV0FBVyxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDOUM7Ozs7Ozs7SUFFRCxZQUFZLENBQUMsT0FBWSxFQUFFLElBQVksRUFBRSxZQUFxQjtRQUM1RCx5QkFBTyxtQkFBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFRLEVBQUMsQ0FBQyxJQUFJLENBQVcsRUFBQztLQUNsRTs7Ozs7SUFFRCw0QkFBNEIsQ0FBQyxTQUFrQixJQUFJLElBQUksQ0FBQyxhQUFhLEdBQUcsU0FBUyxDQUFDLEVBQUU7Ozs7Ozs7Ozs7O0lBRXBGLE9BQU8sQ0FDSCxPQUFZLEVBQUUsU0FBdUIsRUFBRSxRQUFnQixFQUFFLEtBQWEsRUFBRSxNQUFjLEVBQ3RGLGtCQUFxQyxFQUFFLEVBQUUsdUJBQWlDOztRQUM1RSxNQUFNLFlBQVksR0FBRyxDQUFDLHVCQUF1QixJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUNyRSxJQUFJLFlBQVksRUFBRTtZQUNoQixPQUFPLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQ25DLE9BQU8sRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsZUFBZSxDQUFDLENBQUM7U0FDbkU7O1FBRUQsTUFBTSxJQUFJLEdBQUcsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUM7O1FBQzlDLE1BQU0sYUFBYSxHQUFxQyxFQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFDLENBQUM7OztRQUdoRixJQUFJLE1BQU0sRUFBRTtZQUNWLGFBQWEsQ0FBQyxRQUFRLENBQUMsR0FBRyxNQUFNLENBQUM7U0FDbEM7O1FBRUQsTUFBTSxjQUFjLEdBQXlCLEVBQUUsQ0FBQzs7UUFDaEQsTUFBTSwyQkFBMkIscUJBQTBCLGVBQWUsQ0FBQyxNQUFNLENBQzdFLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxZQUFZLG1CQUFtQixDQUFDLEVBQUM7UUFFckQsSUFBSSw4QkFBOEIsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLEVBQUU7WUFDbkQsMkJBQTJCLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFOztnQkFDM0MsSUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLGVBQWUsQ0FBQztnQkFDcEMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7YUFDMUUsQ0FBQyxDQUFDO1NBQ0o7UUFFRCxTQUFTLEdBQUcsU0FBUyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUMvRCxTQUFTLEdBQUcsa0NBQWtDLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxjQUFjLENBQUMsQ0FBQztRQUNuRixPQUFPLElBQUksbUJBQW1CLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxhQUFhLENBQUMsQ0FBQztLQUNuRTtDQUNGOzs7Ozs7Ozs7O0FBRUQsTUFBTSxVQUFVLHFCQUFxQjtJQUNuQyxPQUFPLE9BQU8sbUJBQW1CLEVBQUUsS0FBSyxVQUFVLENBQUM7Q0FDcEQ7Ozs7QUFFRCxTQUFTLG1CQUFtQjtJQUMxQixPQUFPLENBQUMsU0FBUyxFQUFFLElBQUksbUJBQU0sT0FBTyxFQUFDLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO0NBQ25FIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtBbmltYXRpb25QbGF5ZXIsIMm1U3R5bGVEYXRhfSBmcm9tICdAYW5ndWxhci9hbmltYXRpb25zJztcblxuaW1wb3J0IHthbGxvd1ByZXZpb3VzUGxheWVyU3R5bGVzTWVyZ2UsIGJhbGFuY2VQcmV2aW91c1N0eWxlc0ludG9LZXlmcmFtZXMsIGNvcHlTdHlsZXN9IGZyb20gJy4uLy4uL3V0aWwnO1xuaW1wb3J0IHtBbmltYXRpb25Ecml2ZXJ9IGZyb20gJy4uL2FuaW1hdGlvbl9kcml2ZXInO1xuaW1wb3J0IHtDc3NLZXlmcmFtZXNEcml2ZXJ9IGZyb20gJy4uL2Nzc19rZXlmcmFtZXMvY3NzX2tleWZyYW1lc19kcml2ZXInO1xuaW1wb3J0IHtjb250YWluc0VsZW1lbnQsIGludm9rZVF1ZXJ5LCBpc0Jyb3dzZXIsIG1hdGNoZXNFbGVtZW50LCB2YWxpZGF0ZVN0eWxlUHJvcGVydHl9IGZyb20gJy4uL3NoYXJlZCc7XG5cbmltcG9ydCB7V2ViQW5pbWF0aW9uc1BsYXllcn0gZnJvbSAnLi93ZWJfYW5pbWF0aW9uc19wbGF5ZXInO1xuXG5leHBvcnQgY2xhc3MgV2ViQW5pbWF0aW9uc0RyaXZlciBpbXBsZW1lbnRzIEFuaW1hdGlvbkRyaXZlciB7XG4gIHByaXZhdGUgX2lzTmF0aXZlSW1wbCA9IC9cXHtcXHMqXFxbbmF0aXZlXFxzK2NvZGVcXF1cXHMqXFx9Ly50ZXN0KGdldEVsZW1lbnRBbmltYXRlRm4oKS50b1N0cmluZygpKTtcbiAgcHJpdmF0ZSBfY3NzS2V5ZnJhbWVzRHJpdmVyID0gbmV3IENzc0tleWZyYW1lc0RyaXZlcigpO1xuXG4gIHZhbGlkYXRlU3R5bGVQcm9wZXJ0eShwcm9wOiBzdHJpbmcpOiBib29sZWFuIHsgcmV0dXJuIHZhbGlkYXRlU3R5bGVQcm9wZXJ0eShwcm9wKTsgfVxuXG4gIG1hdGNoZXNFbGVtZW50KGVsZW1lbnQ6IGFueSwgc2VsZWN0b3I6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBtYXRjaGVzRWxlbWVudChlbGVtZW50LCBzZWxlY3Rvcik7XG4gIH1cblxuICBjb250YWluc0VsZW1lbnQoZWxtMTogYW55LCBlbG0yOiBhbnkpOiBib29sZWFuIHsgcmV0dXJuIGNvbnRhaW5zRWxlbWVudChlbG0xLCBlbG0yKTsgfVxuXG4gIHF1ZXJ5KGVsZW1lbnQ6IGFueSwgc2VsZWN0b3I6IHN0cmluZywgbXVsdGk6IGJvb2xlYW4pOiBhbnlbXSB7XG4gICAgcmV0dXJuIGludm9rZVF1ZXJ5KGVsZW1lbnQsIHNlbGVjdG9yLCBtdWx0aSk7XG4gIH1cblxuICBjb21wdXRlU3R5bGUoZWxlbWVudDogYW55LCBwcm9wOiBzdHJpbmcsIGRlZmF1bHRWYWx1ZT86IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuICh3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50KSBhcyBhbnkpW3Byb3BdIGFzIHN0cmluZztcbiAgfVxuXG4gIG92ZXJyaWRlV2ViQW5pbWF0aW9uc1N1cHBvcnQoc3VwcG9ydGVkOiBib29sZWFuKSB7IHRoaXMuX2lzTmF0aXZlSW1wbCA9IHN1cHBvcnRlZDsgfVxuXG4gIGFuaW1hdGUoXG4gICAgICBlbGVtZW50OiBhbnksIGtleWZyYW1lczogybVTdHlsZURhdGFbXSwgZHVyYXRpb246IG51bWJlciwgZGVsYXk6IG51bWJlciwgZWFzaW5nOiBzdHJpbmcsXG4gICAgICBwcmV2aW91c1BsYXllcnM6IEFuaW1hdGlvblBsYXllcltdID0gW10sIHNjcnViYmVyQWNjZXNzUmVxdWVzdGVkPzogYm9vbGVhbik6IEFuaW1hdGlvblBsYXllciB7XG4gICAgY29uc3QgdXNlS2V5ZnJhbWVzID0gIXNjcnViYmVyQWNjZXNzUmVxdWVzdGVkICYmICF0aGlzLl9pc05hdGl2ZUltcGw7XG4gICAgaWYgKHVzZUtleWZyYW1lcykge1xuICAgICAgcmV0dXJuIHRoaXMuX2Nzc0tleWZyYW1lc0RyaXZlci5hbmltYXRlKFxuICAgICAgICAgIGVsZW1lbnQsIGtleWZyYW1lcywgZHVyYXRpb24sIGRlbGF5LCBlYXNpbmcsIHByZXZpb3VzUGxheWVycyk7XG4gICAgfVxuXG4gICAgY29uc3QgZmlsbCA9IGRlbGF5ID09IDAgPyAnYm90aCcgOiAnZm9yd2FyZHMnO1xuICAgIGNvbnN0IHBsYXllck9wdGlvbnM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBudW1iZXJ9ID0ge2R1cmF0aW9uLCBkZWxheSwgZmlsbH07XG4gICAgLy8gd2UgY2hlY2sgZm9yIHRoaXMgdG8gYXZvaWQgaGF2aW5nIGEgbnVsbHx1bmRlZmluZWQgdmFsdWUgYmUgcHJlc2VudFxuICAgIC8vIGZvciB0aGUgZWFzaW5nICh3aGljaCByZXN1bHRzIGluIGFuIGVycm9yIGZvciBjZXJ0YWluIGJyb3dzZXJzICM5NzUyKVxuICAgIGlmIChlYXNpbmcpIHtcbiAgICAgIHBsYXllck9wdGlvbnNbJ2Vhc2luZyddID0gZWFzaW5nO1xuICAgIH1cblxuICAgIGNvbnN0IHByZXZpb3VzU3R5bGVzOiB7W2tleTogc3RyaW5nXTogYW55fSA9IHt9O1xuICAgIGNvbnN0IHByZXZpb3VzV2ViQW5pbWF0aW9uUGxheWVycyA9IDxXZWJBbmltYXRpb25zUGxheWVyW10+cHJldmlvdXNQbGF5ZXJzLmZpbHRlcihcbiAgICAgICAgcGxheWVyID0+IHBsYXllciBpbnN0YW5jZW9mIFdlYkFuaW1hdGlvbnNQbGF5ZXIpO1xuXG4gICAgaWYgKGFsbG93UHJldmlvdXNQbGF5ZXJTdHlsZXNNZXJnZShkdXJhdGlvbiwgZGVsYXkpKSB7XG4gICAgICBwcmV2aW91c1dlYkFuaW1hdGlvblBsYXllcnMuZm9yRWFjaChwbGF5ZXIgPT4ge1xuICAgICAgICBsZXQgc3R5bGVzID0gcGxheWVyLmN1cnJlbnRTbmFwc2hvdDtcbiAgICAgICAgT2JqZWN0LmtleXMoc3R5bGVzKS5mb3JFYWNoKHByb3AgPT4gcHJldmlvdXNTdHlsZXNbcHJvcF0gPSBzdHlsZXNbcHJvcF0pO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAga2V5ZnJhbWVzID0ga2V5ZnJhbWVzLm1hcChzdHlsZXMgPT4gY29weVN0eWxlcyhzdHlsZXMsIGZhbHNlKSk7XG4gICAga2V5ZnJhbWVzID0gYmFsYW5jZVByZXZpb3VzU3R5bGVzSW50b0tleWZyYW1lcyhlbGVtZW50LCBrZXlmcmFtZXMsIHByZXZpb3VzU3R5bGVzKTtcbiAgICByZXR1cm4gbmV3IFdlYkFuaW1hdGlvbnNQbGF5ZXIoZWxlbWVudCwga2V5ZnJhbWVzLCBwbGF5ZXJPcHRpb25zKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc3VwcG9ydHNXZWJBbmltYXRpb25zKCkge1xuICByZXR1cm4gdHlwZW9mIGdldEVsZW1lbnRBbmltYXRlRm4oKSA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gZ2V0RWxlbWVudEFuaW1hdGVGbigpOiBhbnkge1xuICByZXR1cm4gKGlzQnJvd3NlcigpICYmICg8YW55PkVsZW1lbnQpLnByb3RvdHlwZVsnYW5pbWF0ZSddKSB8fCB7fTtcbn1cbiJdfQ==
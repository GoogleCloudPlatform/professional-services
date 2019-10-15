/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
import { allowPreviousPlayerStylesMerge, balancePreviousStylesIntoKeyframes } from '../../util';
import { containsElement, hypenatePropsObject, invokeQuery, matchesElement, validateStyleProperty } from '../shared';
import { CssKeyframesPlayer } from './css_keyframes_player';
import { DirectStylePlayer } from './direct_style_player';
/** @type {?} */
const KEYFRAMES_NAME_PREFIX = 'gen_css_kf_';
/** @type {?} */
const TAB_SPACE = ' ';
export class CssKeyframesDriver {
    constructor() {
        this._count = 0;
        this._head = document.querySelector('head');
        this._warningIssued = false;
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
     * @param {?} element
     * @param {?} name
     * @param {?} keyframes
     * @return {?}
     */
    buildKeyframeElement(element, name, keyframes) {
        keyframes = keyframes.map(kf => hypenatePropsObject(kf));
        /** @type {?} */
        let keyframeStr = `@keyframes ${name} {\n`;
        /** @type {?} */
        let tab = '';
        keyframes.forEach(kf => {
            tab = TAB_SPACE;
            /** @type {?} */
            const offset = parseFloat(kf["offset"]);
            keyframeStr += `${tab}${offset * 100}% {\n`;
            tab += TAB_SPACE;
            Object.keys(kf).forEach(prop => {
                /** @type {?} */
                const value = kf[prop];
                switch (prop) {
                    case 'offset':
                        return;
                    case 'easing':
                        if (value) {
                            keyframeStr += `${tab}animation-timing-function: ${value};\n`;
                        }
                        return;
                    default:
                        keyframeStr += `${tab}${prop}: ${value};\n`;
                        return;
                }
            });
            keyframeStr += `${tab}}\n`;
        });
        keyframeStr += `}\n`;
        /** @type {?} */
        const kfElm = document.createElement('style');
        kfElm.innerHTML = keyframeStr;
        return kfElm;
    }
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
        if (scrubberAccessRequested) {
            this._notifyFaultyScrubber();
        }
        /** @type {?} */
        const previousCssKeyframePlayers = /** @type {?} */ (previousPlayers.filter(player => player instanceof CssKeyframesPlayer));
        /** @type {?} */
        const previousStyles = {};
        if (allowPreviousPlayerStylesMerge(duration, delay)) {
            previousCssKeyframePlayers.forEach(player => {
                /** @type {?} */
                let styles = player.currentSnapshot;
                Object.keys(styles).forEach(prop => previousStyles[prop] = styles[prop]);
            });
        }
        keyframes = balancePreviousStylesIntoKeyframes(element, keyframes, previousStyles);
        /** @type {?} */
        const finalStyles = flattenKeyframesIntoStyles(keyframes);
        // if there is no animation then there is no point in applying
        // styles and waiting for an event to get fired. This causes lag.
        // It's better to just directly apply the styles to the element
        // via the direct styling animation player.
        if (duration == 0) {
            return new DirectStylePlayer(element, finalStyles);
        }
        /** @type {?} */
        const animationName = `${KEYFRAMES_NAME_PREFIX}${this._count++}`;
        /** @type {?} */
        const kfElm = this.buildKeyframeElement(element, animationName, keyframes); /** @type {?} */
        ((document.querySelector('head'))).appendChild(kfElm);
        /** @type {?} */
        const player = new CssKeyframesPlayer(element, keyframes, animationName, duration, delay, easing, finalStyles);
        player.onDestroy(() => removeElement(kfElm));
        return player;
    }
    /**
     * @return {?}
     */
    _notifyFaultyScrubber() {
        if (!this._warningIssued) {
            console.warn('@angular/animations: please load the web-animations.js polyfill to allow programmatic access...\n', '  visit http://bit.ly/IWukam to learn more about using the web-animation-js polyfill.');
            this._warningIssued = true;
        }
    }
}
if (false) {
    /** @type {?} */
    CssKeyframesDriver.prototype._count;
    /** @type {?} */
    CssKeyframesDriver.prototype._head;
    /** @type {?} */
    CssKeyframesDriver.prototype._warningIssued;
}
/**
 * @param {?} keyframes
 * @return {?}
 */
function flattenKeyframesIntoStyles(keyframes) {
    /** @type {?} */
    let flatKeyframes = {};
    if (keyframes) {
        /** @type {?} */
        const kfs = Array.isArray(keyframes) ? keyframes : [keyframes];
        kfs.forEach(kf => {
            Object.keys(kf).forEach(prop => {
                if (prop == 'offset' || prop == 'easing')
                    return;
                flatKeyframes[prop] = kf[prop];
            });
        });
    }
    return flatKeyframes;
}
/**
 * @param {?} node
 * @return {?}
 */
function removeElement(node) {
    node.parentNode.removeChild(node);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3NzX2tleWZyYW1lc19kcml2ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmltYXRpb25zL2Jyb3dzZXIvc3JjL3JlbmRlci9jc3Nfa2V5ZnJhbWVzL2Nzc19rZXlmcmFtZXNfZHJpdmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFTQSxPQUFPLEVBQUMsOEJBQThCLEVBQUUsa0NBQWtDLEVBQWUsTUFBTSxZQUFZLENBQUM7QUFFNUcsT0FBTyxFQUFDLGVBQWUsRUFBRSxtQkFBbUIsRUFBRSxXQUFXLEVBQUUsY0FBYyxFQUFFLHFCQUFxQixFQUFDLE1BQU0sV0FBVyxDQUFDO0FBRW5ILE9BQU8sRUFBQyxrQkFBa0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQzFELE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDOztBQUV4RCxNQUFNLHFCQUFxQixHQUFHLGFBQWEsQ0FBQzs7QUFDNUMsTUFBTSxTQUFTLEdBQUcsR0FBRyxDQUFDO0FBRXRCLE1BQU0sT0FBTyxrQkFBa0I7O3NCQUNaLENBQUM7cUJBQ1ksUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUM7OEJBQ25DLEtBQUs7Ozs7OztJQUU5QixxQkFBcUIsQ0FBQyxJQUFZLElBQWEsT0FBTyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFOzs7Ozs7SUFFcEYsY0FBYyxDQUFDLE9BQVksRUFBRSxRQUFnQjtRQUMzQyxPQUFPLGNBQWMsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7S0FDMUM7Ozs7OztJQUVELGVBQWUsQ0FBQyxJQUFTLEVBQUUsSUFBUyxJQUFhLE9BQU8sZUFBZSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFOzs7Ozs7O0lBRXRGLEtBQUssQ0FBQyxPQUFZLEVBQUUsUUFBZ0IsRUFBRSxLQUFjO1FBQ2xELE9BQU8sV0FBVyxDQUFDLE9B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QUMsRUFBRSxDQUFDLEVBQUU7WUFDZixNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDN0IsSUFBSSxJQUFJLElBQUksUUFBUSxJQUFJLElBQUksSUFBSSxRQUFRO29CQUFFLE9BQU87Z0JBQ2pELGFBQWEsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDaEMsQ0FBQyxDQUFDO1NBQ0osQ0FBQyxDQUFDO0tBQ0o7SUFDRCxPQUFPLGFBQWEsQ0FBQztDQUN0Qjs7Ozs7QUFFRCxTQUFTLGFBQWEsQ0FBQyxJQUFTO0lBQzlCLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO0NBQ25DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtBbmltYXRpb25QbGF5ZXIsIMm1U3R5bGVEYXRhfSBmcm9tICdAYW5ndWxhci9hbmltYXRpb25zJztcblxuaW1wb3J0IHthbGxvd1ByZXZpb3VzUGxheWVyU3R5bGVzTWVyZ2UsIGJhbGFuY2VQcmV2aW91c1N0eWxlc0ludG9LZXlmcmFtZXMsIGNvbXB1dGVTdHlsZX0gZnJvbSAnLi4vLi4vdXRpbCc7XG5pbXBvcnQge0FuaW1hdGlvbkRyaXZlcn0gZnJvbSAnLi4vYW5pbWF0aW9uX2RyaXZlcic7XG5pbXBvcnQge2NvbnRhaW5zRWxlbWVudCwgaHlwZW5hdGVQcm9wc09iamVjdCwgaW52b2tlUXVlcnksIG1hdGNoZXNFbGVtZW50LCB2YWxpZGF0ZVN0eWxlUHJvcGVydHl9IGZyb20gJy4uL3NoYXJlZCc7XG5cbmltcG9ydCB7Q3NzS2V5ZnJhbWVzUGxheWVyfSBmcm9tICcuL2Nzc19rZXlmcmFtZXNfcGxheWVyJztcbmltcG9ydCB7RGlyZWN0U3R5bGVQbGF5ZXJ9IGZyb20gJy4vZGlyZWN0X3N0eWxlX3BsYXllcic7XG5cbmNvbnN0IEtFWUZSQU1FU19OQU1FX1BSRUZJWCA9ICdnZW5fY3NzX2tmXyc7XG5jb25zdCBUQUJfU1BBQ0UgPSAnICc7XG5cbmV4cG9ydCBjbGFzcyBDc3NLZXlmcmFtZXNEcml2ZXIgaW1wbGVtZW50cyBBbmltYXRpb25Ecml2ZXIge1xuICBwcml2YXRlIF9jb3VudCA9IDA7XG4gIHByaXZhdGUgcmVhZG9ubHkgX2hlYWQ6IGFueSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2hlYWQnKTtcbiAgcHJpdmF0ZSBfd2FybmluZ0lzc3VlZCA9IGZhbHNlO1xuXG4gIHZhbGlkYXRlU3R5bGVQcm9wZXJ0eShwcm9wOiBzdHJpbmcpOiBib29sZWFuIHsgcmV0dXJuIHZhbGlkYXRlU3R5bGVQcm9wZXJ0eShwcm9wKTsgfVxuXG4gIG1hdGNoZXNFbGVtZW50KGVsZW1lbnQ6IGFueSwgc2VsZWN0b3I6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBtYXRjaGVzRWxlbWVudChlbGVtZW50LCBzZWxlY3Rvcik7XG4gIH1cblxuICBjb250YWluc0VsZW1lbnQoZWxtMTogYW55LCBlbG0yOiBhbnkpOiBib29sZWFuIHsgcmV0dXJuIGNvbnRhaW5zRWxlbWVudChlbG0xLCBlbG0yKTsgfVxuXG4gIHF1ZXJ5KGVsZW1lbnQ6IGFueSwgc2VsZWN0b3I6IHN0cmluZywgbXVsdGk6IGJvb2xlYW4pOiBhbnlbXSB7XG4gICAgcmV0dXJuIGludm9rZVF1ZXJ5KGVsZW1lbnQsIHNlbGVjdG9yLCBtdWx0aSk7XG4gIH1cblxuICBjb21wdXRlU3R5bGUoZWxlbWVudDogYW55LCBwcm9wOiBzdHJpbmcsIGRlZmF1bHRWYWx1ZT86IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuICh3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50KSBhcyBhbnkpW3Byb3BdIGFzIHN0cmluZztcbiAgfVxuXG4gIGJ1aWxkS2V5ZnJhbWVFbGVtZW50KGVsZW1lbnQ6IGFueSwgbmFtZTogc3RyaW5nLCBrZXlmcmFtZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9W10pOiBhbnkge1xuICAgIGtleWZyYW1lcyA9IGtleWZyYW1lcy5tYXAoa2YgPT4gaHlwZW5hdGVQcm9wc09iamVjdChrZikpO1xuICAgIGxldCBrZXlmcmFtZVN0ciA9IGBAa2V5ZnJhbWVzICR7bmFtZX0ge1xcbmA7XG4gICAgbGV0IHRhYiA9ICcnO1xuICAgIGtleWZyYW1lcy5mb3JFYWNoKGtmID0+IHtcbiAgICAgIHRhYiA9IFRBQl9TUEFDRTtcbiAgICAgIGNvbnN0IG9mZnNldCA9IHBhcnNlRmxvYXQoa2Yub2Zmc2V0KTtcbiAgICAgIGtleWZyYW1lU3RyICs9IGAke3RhYn0ke29mZnNldCAqIDEwMH0lIHtcXG5gO1xuICAgICAgdGFiICs9IFRBQl9TUEFDRTtcbiAgICAgIE9iamVjdC5rZXlzKGtmKS5mb3JFYWNoKHByb3AgPT4ge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IGtmW3Byb3BdO1xuICAgICAgICBzd2l0Y2ggKHByb3ApIHtcbiAgICAgICAgICBjYXNlICdvZmZzZXQnOlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIGNhc2UgJ2Vhc2luZyc6XG4gICAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgICAga2V5ZnJhbWVTdHIgKz0gYCR7dGFifWFuaW1hdGlvbi10aW1pbmctZnVuY3Rpb246ICR7dmFsdWV9O1xcbmA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGtleWZyYW1lU3RyICs9IGAke3RhYn0ke3Byb3B9OiAke3ZhbHVlfTtcXG5gO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGtleWZyYW1lU3RyICs9IGAke3RhYn19XFxuYDtcbiAgICB9KTtcbiAgICBrZXlmcmFtZVN0ciArPSBgfVxcbmA7XG5cbiAgICBjb25zdCBrZkVsbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gICAga2ZFbG0uaW5uZXJIVE1MID0ga2V5ZnJhbWVTdHI7XG4gICAgcmV0dXJuIGtmRWxtO1xuICB9XG5cbiAgYW5pbWF0ZShcbiAgICAgIGVsZW1lbnQ6IGFueSwga2V5ZnJhbWVzOiDJtVN0eWxlRGF0YVtdLCBkdXJhdGlvbjogbnVtYmVyLCBkZWxheTogbnVtYmVyLCBlYXNpbmc6IHN0cmluZyxcbiAgICAgIHByZXZpb3VzUGxheWVyczogQW5pbWF0aW9uUGxheWVyW10gPSBbXSwgc2NydWJiZXJBY2Nlc3NSZXF1ZXN0ZWQ/OiBib29sZWFuKTogQW5pbWF0aW9uUGxheWVyIHtcbiAgICBpZiAoc2NydWJiZXJBY2Nlc3NSZXF1ZXN0ZWQpIHtcbiAgICAgIHRoaXMuX25vdGlmeUZhdWx0eVNjcnViYmVyKCk7XG4gICAgfVxuXG4gICAgY29uc3QgcHJldmlvdXNDc3NLZXlmcmFtZVBsYXllcnMgPSA8Q3NzS2V5ZnJhbWVzUGxheWVyW10+cHJldmlvdXNQbGF5ZXJzLmZpbHRlcihcbiAgICAgICAgcGxheWVyID0+IHBsYXllciBpbnN0YW5jZW9mIENzc0tleWZyYW1lc1BsYXllcik7XG5cbiAgICBjb25zdCBwcmV2aW91c1N0eWxlczoge1trZXk6IHN0cmluZ106IGFueX0gPSB7fTtcblxuICAgIGlmIChhbGxvd1ByZXZpb3VzUGxheWVyU3R5bGVzTWVyZ2UoZHVyYXRpb24sIGRlbGF5KSkge1xuICAgICAgcHJldmlvdXNDc3NLZXlmcmFtZVBsYXllcnMuZm9yRWFjaChwbGF5ZXIgPT4ge1xuICAgICAgICBsZXQgc3R5bGVzID0gcGxheWVyLmN1cnJlbnRTbmFwc2hvdDtcbiAgICAgICAgT2JqZWN0LmtleXMoc3R5bGVzKS5mb3JFYWNoKHByb3AgPT4gcHJldmlvdXNTdHlsZXNbcHJvcF0gPSBzdHlsZXNbcHJvcF0pO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAga2V5ZnJhbWVzID0gYmFsYW5jZVByZXZpb3VzU3R5bGVzSW50b0tleWZyYW1lcyhlbGVtZW50LCBrZXlmcmFtZXMsIHByZXZpb3VzU3R5bGVzKTtcbiAgICBjb25zdCBmaW5hbFN0eWxlcyA9IGZsYXR0ZW5LZXlmcmFtZXNJbnRvU3R5bGVzKGtleWZyYW1lcyk7XG5cbiAgICAvLyBpZiB0aGVyZSBpcyBubyBhbmltYXRpb24gdGhlbiB0aGVyZSBpcyBubyBwb2ludCBpbiBhcHBseWluZ1xuICAgIC8vIHN0eWxlcyBhbmQgd2FpdGluZyBmb3IgYW4gZXZlbnQgdG8gZ2V0IGZpcmVkLiBUaGlzIGNhdXNlcyBsYWcuXG4gICAgLy8gSXQncyBiZXR0ZXIgdG8ganVzdCBkaXJlY3RseSBhcHBseSB0aGUgc3R5bGVzIHRvIHRoZSBlbGVtZW50XG4gICAgLy8gdmlhIHRoZSBkaXJlY3Qgc3R5bGluZyBhbmltYXRpb24gcGxheWVyLlxuICAgIGlmIChkdXJhdGlvbiA9PSAwKSB7XG4gICAgICByZXR1cm4gbmV3IERpcmVjdFN0eWxlUGxheWVyKGVsZW1lbnQsIGZpbmFsU3R5bGVzKTtcbiAgICB9XG5cbiAgICBjb25zdCBhbmltYXRpb25OYW1lID0gYCR7S0VZRlJBTUVTX05BTUVfUFJFRklYfSR7dGhpcy5fY291bnQrK31gO1xuICAgIGNvbnN0IGtmRWxtID0gdGhpcy5idWlsZEtleWZyYW1lRWxlbWVudChlbGVtZW50LCBhbmltYXRpb25OYW1lLCBrZXlmcmFtZXMpO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2hlYWQnKSAhLmFwcGVuZENoaWxkKGtmRWxtKTtcblxuICAgIGNvbnN0IHBsYXllciA9IG5ldyBDc3NLZXlmcmFtZXNQbGF5ZXIoXG4gICAgICAgIGVsZW1lbnQsIGtleWZyYW1lcywgYW5pbWF0aW9uTmFtZSwgZHVyYXRpb24sIGRlbGF5LCBlYXNpbmcsIGZpbmFsU3R5bGVzKTtcblxuICAgIHBsYXllci5vbkRlc3Ryb3koKCkgPT4gcmVtb3ZlRWxlbWVudChrZkVsbSkpO1xuICAgIHJldHVybiBwbGF5ZXI7XG4gIH1cblxuICBwcml2YXRlIF9ub3RpZnlGYXVsdHlTY3J1YmJlcigpIHtcbiAgICBpZiAoIXRoaXMuX3dhcm5pbmdJc3N1ZWQpIHtcbiAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICAnQGFuZ3VsYXIvYW5pbWF0aW9uczogcGxlYXNlIGxvYWQgdGhlIHdlYi1hbmltYXRpb25zLmpzIHBvbHlmaWxsIHRvIGFsbG93IHByb2dyYW1tYXRpYyBhY2Nlc3MuLi5cXG4nLFxuICAgICAgICAgICcgIHZpc2l0IGh0dHA6Ly9iaXQubHkvSVd1a2FtIHRvIGxlYXJuIG1vcmUgYWJvdXQgdXNpbmcgdGhlIHdlYi1hbmltYXRpb24tanMgcG9seWZpbGwuJyk7XG4gICAgICB0aGlzLl93YXJuaW5nSXNzdWVkID0gdHJ1ZTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZmxhdHRlbktleWZyYW1lc0ludG9TdHlsZXMoXG4gICAga2V5ZnJhbWVzOiBudWxsIHwge1trZXk6IHN0cmluZ106IGFueX0gfCB7W2tleTogc3RyaW5nXTogYW55fVtdKToge1trZXk6IHN0cmluZ106IGFueX0ge1xuICBsZXQgZmxhdEtleWZyYW1lczoge1trZXk6IHN0cmluZ106IGFueX0gPSB7fTtcbiAgaWYgKGtleWZyYW1lcykge1xuICAgIGNvbnN0IGtmcyA9IEFycmF5LmlzQXJyYXkoa2V5ZnJhbWVzKSA/IGtleWZyYW1lcyA6IFtrZXlmcmFtZXNdO1xuICAgIGtmcy5mb3JFYWNoKGtmID0+IHtcbiAgICAgIE9iamVjdC5rZXlzKGtmKS5mb3JFYWNoKHByb3AgPT4ge1xuICAgICAgICBpZiAocHJvcCA9PSAnb2Zmc2V0JyB8fCBwcm9wID09ICdlYXNpbmcnKSByZXR1cm47XG4gICAgICAgIGZsYXRLZXlmcmFtZXNbcHJvcF0gPSBrZltwcm9wXTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIHJldHVybiBmbGF0S2V5ZnJhbWVzO1xufVxuXG5mdW5jdGlvbiByZW1vdmVFbGVtZW50KG5vZGU6IGFueSkge1xuICBub2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobm9kZSk7XG59XG4iXX0=
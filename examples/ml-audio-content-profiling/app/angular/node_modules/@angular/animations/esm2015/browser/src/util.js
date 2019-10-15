/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
import { sequence } from '@angular/animations';
import { isNode } from './render/shared';
/** @type {?} */
export const ONE_SECOND = 1000;
/** @type {?} */
export const SUBSTITUTION_EXPR_START = '{{';
/** @type {?} */
export const SUBSTITUTION_EXPR_END = '}}';
/** @type {?} */
export const ENTER_CLASSNAME = 'ng-enter';
/** @type {?} */
export const LEAVE_CLASSNAME = 'ng-leave';
/** @type {?} */
export const ENTER_SELECTOR = '.ng-enter';
/** @type {?} */
export const LEAVE_SELECTOR = '.ng-leave';
/** @type {?} */
export const NG_TRIGGER_CLASSNAME = 'ng-trigger';
/** @type {?} */
export const NG_TRIGGER_SELECTOR = '.ng-trigger';
/** @type {?} */
export const NG_ANIMATING_CLASSNAME = 'ng-animating';
/** @type {?} */
export const NG_ANIMATING_SELECTOR = '.ng-animating';
/**
 * @param {?} value
 * @return {?}
 */
export function resolveTimingValue(value) {
    if (typeof value == 'number')
        return value;
    /** @type {?} */
    const matches = (/** @type {?} */ (value)).match(/^(-?[\.\d]+)(m?s)/);
    if (!matches || matches.length < 2)
        return 0;
    return _convertTimeValueToMS(parseFloat(matches[1]), matches[2]);
}
/**
 * @param {?} value
 * @param {?} unit
 * @return {?}
 */
function _convertTimeValueToMS(value, unit) {
    switch (unit) {
        case 's':
            return value * ONE_SECOND;
        default: // ms or something else
            // ms or something else
            return value;
    }
}
/**
 * @param {?} timings
 * @param {?} errors
 * @param {?=} allowNegativeValues
 * @return {?}
 */
export function resolveTiming(timings, errors, allowNegativeValues) {
    return timings.hasOwnProperty('duration') ? /** @type {?} */ (timings) :
        parseTimeExpression(/** @type {?} */ (timings), errors, allowNegativeValues);
}
/**
 * @param {?} exp
 * @param {?} errors
 * @param {?=} allowNegativeValues
 * @return {?}
 */
function parseTimeExpression(exp, errors, allowNegativeValues) {
    /** @type {?} */
    const regex = /^(-?[\.\d]+)(m?s)(?:\s+(-?[\.\d]+)(m?s))?(?:\s+([-a-z]+(?:\(.+?\))?))?$/i;
    /** @type {?} */
    let duration;
    /** @type {?} */
    let delay = 0;
    /** @type {?} */
    let easing = '';
    if (typeof exp === 'string') {
        /** @type {?} */
        const matches = exp.match(regex);
        if (matches === null) {
            errors.push(`The provided timing value "${exp}" is invalid.`);
            return { duration: 0, delay: 0, easing: '' };
        }
        duration = _convertTimeValueToMS(parseFloat(matches[1]), matches[2]);
        /** @type {?} */
        const delayMatch = matches[3];
        if (delayMatch != null) {
            delay = _convertTimeValueToMS(Math.floor(parseFloat(delayMatch)), matches[4]);
        }
        /** @type {?} */
        const easingVal = matches[5];
        if (easingVal) {
            easing = easingVal;
        }
    }
    else {
        duration = /** @type {?} */ (exp);
    }
    if (!allowNegativeValues) {
        /** @type {?} */
        let containsErrors = false;
        /** @type {?} */
        let startIndex = errors.length;
        if (duration < 0) {
            errors.push(`Duration values below 0 are not allowed for this animation step.`);
            containsErrors = true;
        }
        if (delay < 0) {
            errors.push(`Delay values below 0 are not allowed for this animation step.`);
            containsErrors = true;
        }
        if (containsErrors) {
            errors.splice(startIndex, 0, `The provided timing value "${exp}" is invalid.`);
        }
    }
    return { duration, delay, easing };
}
/**
 * @param {?} obj
 * @param {?=} destination
 * @return {?}
 */
export function copyObj(obj, destination = {}) {
    Object.keys(obj).forEach(prop => { destination[prop] = obj[prop]; });
    return destination;
}
/**
 * @param {?} styles
 * @return {?}
 */
export function normalizeStyles(styles) {
    /** @type {?} */
    const normalizedStyles = {};
    if (Array.isArray(styles)) {
        styles.forEach(data => copyStyles(data, false, normalizedStyles));
    }
    else {
        copyStyles(styles, false, normalizedStyles);
    }
    return normalizedStyles;
}
/**
 * @param {?} styles
 * @param {?} readPrototype
 * @param {?=} destination
 * @return {?}
 */
export function copyStyles(styles, readPrototype, destination = {}) {
    if (readPrototype) {
        // we make use of a for-in loop so that the
        // prototypically inherited properties are
        // revealed from the backFill map
        for (let prop in styles) {
            destination[prop] = styles[prop];
        }
    }
    else {
        copyObj(styles, destination);
    }
    return destination;
}
/**
 * @param {?} element
 * @param {?} key
 * @param {?} value
 * @return {?}
 */
function getStyleAttributeString(element, key, value) {
    // Return the key-value pair string to be added to the style attribute for the
    // given CSS style key.
    if (value) {
        return key + ':' + value + ';';
    }
    else {
        return '';
    }
}
/**
 * @param {?} element
 * @return {?}
 */
function writeStyleAttribute(element) {
    /** @type {?} */
    let styleAttrValue = '';
    for (let i = 0; i < element.style.length; i++) {
        /** @type {?} */
        const key = element.style.item(i);
        styleAttrValue += getStyleAttributeString(element, key, element.style.getPropertyValue(key));
    }
    for (const key in element.style) {
        // Skip internal Domino properties that don't need to be reflected.
        if (!element.style.hasOwnProperty(key) || key.startsWith('_')) {
            continue;
        }
        /** @type {?} */
        const dashKey = camelCaseToDashCase(key);
        styleAttrValue += getStyleAttributeString(element, dashKey, element.style[key]);
    }
    element.setAttribute('style', styleAttrValue);
}
/**
 * @param {?} element
 * @param {?} styles
 * @return {?}
 */
export function setStyles(element, styles) {
    if (element['style']) {
        Object.keys(styles).forEach(prop => {
            /** @type {?} */
            const camelProp = dashCaseToCamelCase(prop);
            element.style[camelProp] = styles[prop];
        });
        // On the server set the 'style' attribute since it's not automatically reflected.
        if (isNode()) {
            writeStyleAttribute(element);
        }
    }
}
/**
 * @param {?} element
 * @param {?} styles
 * @return {?}
 */
export function eraseStyles(element, styles) {
    if (element['style']) {
        Object.keys(styles).forEach(prop => {
            /** @type {?} */
            const camelProp = dashCaseToCamelCase(prop);
            element.style[camelProp] = '';
        });
        // On the server set the 'style' attribute since it's not automatically reflected.
        if (isNode()) {
            writeStyleAttribute(element);
        }
    }
}
/**
 * @param {?} steps
 * @return {?}
 */
export function normalizeAnimationEntry(steps) {
    if (Array.isArray(steps)) {
        if (steps.length == 1)
            return steps[0];
        return sequence(steps);
    }
    return /** @type {?} */ (steps);
}
/**
 * @param {?} value
 * @param {?} options
 * @param {?} errors
 * @return {?}
 */
export function validateStyleParams(value, options, errors) {
    /** @type {?} */
    const params = options.params || {};
    /** @type {?} */
    const matches = extractStyleParams(value);
    if (matches.length) {
        matches.forEach(varName => {
            if (!params.hasOwnProperty(varName)) {
                errors.push(`Unable to resolve the local animation param ${varName} in the given list of values`);
            }
        });
    }
}
/** @type {?} */
const PARAM_REGEX = new RegExp(`${SUBSTITUTION_EXPR_START}\\s*(.+?)\\s*${SUBSTITUTION_EXPR_END}`, 'g');
/**
 * @param {?} value
 * @return {?}
 */
export function extractStyleParams(value) {
    /** @type {?} */
    let params = [];
    if (typeof value === 'string') {
        /** @type {?} */
        const val = value.toString();
        /** @type {?} */
        let match;
        while (match = PARAM_REGEX.exec(val)) {
            params.push(/** @type {?} */ (match[1]));
        }
        PARAM_REGEX.lastIndex = 0;
    }
    return params;
}
/**
 * @param {?} value
 * @param {?} params
 * @param {?} errors
 * @return {?}
 */
export function interpolateParams(value, params, errors) {
    /** @type {?} */
    const original = value.toString();
    /** @type {?} */
    const str = original.replace(PARAM_REGEX, (_, varName) => {
        /** @type {?} */
        let localVal = params[varName];
        // this means that the value was never overridden by the data passed in by the user
        if (!params.hasOwnProperty(varName)) {
            errors.push(`Please provide a value for the animation param ${varName}`);
            localVal = '';
        }
        return localVal.toString();
    });
    // we do this to assert that numeric values stay as they are
    return str == original ? value : str;
}
/**
 * @param {?} iterator
 * @return {?}
 */
export function iteratorToArray(iterator) {
    /** @type {?} */
    const arr = [];
    /** @type {?} */
    let item = iterator.next();
    while (!item.done) {
        arr.push(item.value);
        item = iterator.next();
    }
    return arr;
}
/**
 * @param {?} source
 * @param {?} destination
 * @return {?}
 */
export function mergeAnimationOptions(source, destination) {
    if (source.params) {
        /** @type {?} */
        const p0 = source.params;
        if (!destination.params) {
            destination.params = {};
        }
        /** @type {?} */
        const p1 = destination.params;
        Object.keys(p0).forEach(param => {
            if (!p1.hasOwnProperty(param)) {
                p1[param] = p0[param];
            }
        });
    }
    return destination;
}
/** @type {?} */
const DASH_CASE_REGEXP = /-+([a-z0-9])/g;
/**
 * @param {?} input
 * @return {?}
 */
export function dashCaseToCamelCase(input) {
    return input.replace(DASH_CASE_REGEXP, (...m) => m[1].toUpperCase());
}
/**
 * @param {?} input
 * @return {?}
 */
function camelCaseToDashCase(input) {
    return input.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
/**
 * @param {?} duration
 * @param {?} delay
 * @return {?}
 */
export function allowPreviousPlayerStylesMerge(duration, delay) {
    return duration === 0 || delay === 0;
}
/**
 * @param {?} element
 * @param {?} keyframes
 * @param {?} previousStyles
 * @return {?}
 */
export function balancePreviousStylesIntoKeyframes(element, keyframes, previousStyles) {
    /** @type {?} */
    const previousStyleProps = Object.keys(previousStyles);
    if (previousStyleProps.length && keyframes.length) {
        /** @type {?} */
        let startingKeyframe = keyframes[0];
        /** @type {?} */
        let missingStyleProps = [];
        previousStyleProps.forEach(prop => {
            if (!startingKeyframe.hasOwnProperty(prop)) {
                missingStyleProps.push(prop);
            }
            startingKeyframe[prop] = previousStyles[prop];
        });
        if (missingStyleProps.length) {
            // tslint:disable-next-line
            for (var i = 1; i < keyframes.length; i++) {
                /** @type {?} */
                let kf = keyframes[i];
                missingStyleProps.forEach(function (prop) { kf[prop] = computeStyle(element, prop); });
            }
        }
    }
    return keyframes;
}
/**
 * @param {?} visitor
 * @param {?} node
 * @param {?} context
 * @return {?}
 */
export function visitDslNode(visitor, node, context) {
    switch (node.type) {
        case 7 /* Trigger */:
            return visitor.visitTrigger(node, context);
        case 0 /* State */:
            return visitor.visitState(node, context);
        case 1 /* Transition */:
            return visitor.visitTransition(node, context);
        case 2 /* Sequence */:
            return visitor.visitSequence(node, context);
        case 3 /* Group */:
            return visitor.visitGroup(node, context);
        case 4 /* Animate */:
            return visitor.visitAnimate(node, context);
        case 5 /* Keyframes */:
            return visitor.visitKeyframes(node, context);
        case 6 /* Style */:
            return visitor.visitStyle(node, context);
        case 8 /* Reference */:
            return visitor.visitReference(node, context);
        case 9 /* AnimateChild */:
            return visitor.visitAnimateChild(node, context);
        case 10 /* AnimateRef */:
            return visitor.visitAnimateRef(node, context);
        case 11 /* Query */:
            return visitor.visitQuery(node, context);
        case 12 /* Stagger */:
            return visitor.visitStagger(node, context);
        default:
            throw new Error(`Unable to resolve animation metadata node #${node.type}`);
    }
}
/**
 * @param {?} element
 * @param {?} prop
 * @return {?}
 */
export function computeStyle(element, prop) {
    return (/** @type {?} */ (window.getComputedStyle(element)))[prop];
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuaW1hdGlvbnMvYnJvd3Nlci9zcmMvdXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBT0EsT0FBTyxFQUE2RSxRQUFRLEVBQWEsTUFBTSxxQkFBcUIsQ0FBQztBQUdySSxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0saUJBQWlCLENBQUM7O0FBRXZDLGFBQWEsVUFBVSxHQUFHLElBQUksQ0FBQzs7QUFFL0IsYUFBYSx1QkFBdUIsR0FBRyxJQUFJLENBQUM7O0FBQzVDLGFBQWEscUJBQXFCLEdBQUcsSUFBSSxDQUFDOztBQUMxQyxhQUFhLGVBQWUsR0FBRyxVQUFVLENBQUM7O0FBQzFDLGFBQWEsZUFBZSxHQUFHLFVBQVUsQ0FBQzs7QUFDMUMsYUFBYSxjQUFjLEdBQUcsV0FBVyxDQUFDOztBQUMxQyxhQUFhLGNBQWMsR0FBRyxXQUFXLENBQUM7O0FBQzFDLGFBQWEsb0JBQW9CLEdBQUcsWUFBWSxDQUFDOztBQUNqRCxhQUFhLG1CQUFtQixHQUFHLGFBQWEsQ0FBQzs7QUFDakQsYUFBYSxzQkFBc0IsR0FBRyxjQUFjLENBQUM7O0FBQ3JELGFBQWEscUJBQXFCLEdBQUcsZUFBZSxDQUFDOzs7OztBQUVyRCxNQUFNLFVBQVUsa0JBQWtCLENBQUMsS0FBc0I7SUFDdkQsSUFBSSxPQUFPLEtBQUssSUFBSSxRQUFRO1FBQUUsT0FBTyxLQUFLLENBQUM7O0lBRTNDLE1BQU0sT0FBTyxHQUFHLG1CQUFDLEtBQWUsRUFBQyxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0lBQzdELElBQUksQ0FBQyxPQUFPLElBQUksT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDO1FBQUUsT0FBTyxDQUFDLENBQUM7SUFFN0MsT0FBTyxxQkFBcUIsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFD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Q0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDM0M7WUFDRSxPQUFPLE9BQU8sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQy9DO1lBQ0UsT0FBTyxPQUFPLENBQUMsaUJBQWlCLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ2xEO1lBQ0UsT0FBTyxPQUFPLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNoRDtZQUNFLE9BQU8sT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDM0M7WUFDRSxPQUFPLE9BQU8sQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQzdDO1lBQ0UsTUFBTSxJQUFJLEtBQUssQ0FBQyw4Q0FBOEMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7S0FDOUU7Q0FDRjs7Ozs7O0FBRUQsTUFBTSxVQUFVLFlBQVksQ0FBQyxPQUFZLEVBQUUsSUFBWTtJQUNyRCxPQUFPLG1CQUFNLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsRUFBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0NBQ3REIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtBbmltYXRlVGltaW5ncywgQW5pbWF0aW9uTWV0YWRhdGEsIEFuaW1hdGlvbk1ldGFkYXRhVHlwZSwgQW5pbWF0aW9uT3B0aW9ucywgc2VxdWVuY2UsIMm1U3R5bGVEYXRhfSBmcm9tICdAYW5ndWxhci9hbmltYXRpb25zJztcbmltcG9ydCB7QXN0IGFzIEFuaW1hdGlvbkFzdCwgQXN0VmlzaXRvciBhcyBBbmltYXRpb25Bc3RWaXNpdG9yfSBmcm9tICcuL2RzbC9hbmltYXRpb25fYXN0JztcbmltcG9ydCB7QW5pbWF0aW9uRHNsVmlzaXRvcn0gZnJvbSAnLi9kc2wvYW5pbWF0aW9uX2RzbF92aXNpdG9yJztcbmltcG9ydCB7aXNOb2RlfSBmcm9tICcuL3JlbmRlci9zaGFyZWQnO1xuXG5leHBvcnQgY29uc3QgT05FX1NFQ09ORCA9IDEwMDA7XG5cbmV4cG9ydCBjb25zdCBTVUJTVElUVVRJT05fRVhQUl9TVEFSVCA9ICd7eyc7XG5leHBvcnQgY29uc3QgU1VCU1RJVFVUSU9OX0VYUFJfRU5EID0gJ319JztcbmV4cG9ydCBjb25zdCBFTlRFUl9DTEFTU05BTUUgPSAnbmctZW50ZXInO1xuZXhwb3J0IGNvbnN0IExFQVZFX0NMQVNTTkFNRSA9ICduZy1sZWF2ZSc7XG5leHBvcnQgY29uc3QgRU5URVJfU0VMRUNUT1IgPSAnLm5nLWVudGVyJztcbmV4cG9ydCBjb25zdCBMRUFWRV9TRUxFQ1RPUiA9ICcubmctbGVhdmUnO1xuZXhwb3J0IGNvbnN0IE5HX1RSSUdHRVJfQ0xBU1NOQU1FID0gJ25nLXRyaWdnZXInO1xuZXhwb3J0IGNvbnN0IE5HX1RSSUdHRVJfU0VMRUNUT1IgPSAnLm5nLXRyaWdnZXInO1xuZXhwb3J0IGNvbnN0IE5HX0FOSU1BVElOR19DTEFTU05BTUUgPSAnbmctYW5pbWF0aW5nJztcbmV4cG9ydCBjb25zdCBOR19BTklNQVRJTkdfU0VMRUNUT1IgPSAnLm5nLWFuaW1hdGluZyc7XG5cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlVGltaW5nVmFsdWUodmFsdWU6IHN0cmluZyB8IG51bWJlcikge1xuICBpZiAodHlwZW9mIHZhbHVlID09ICdudW1iZXInKSByZXR1cm4gdmFsdWU7XG5cbiAgY29uc3QgbWF0Y2hlcyA9ICh2YWx1ZSBhcyBzdHJpbmcpLm1hdGNoKC9eKC0/W1xcLlxcZF0rKShtP3MpLyk7XG4gIGlmICghbWF0Y2hlcyB8fCBtYXRjaGVzLmxlbmd0aCA8IDIpIHJldHVybiAwO1xuXG4gIHJldHVybiBfY29udmVydFRpbWVWYWx1ZVRvTVMocGFyc2VGbG9hdChtYXRjaGVzWzFdKSwgbWF0Y2hlc1syXSk7XG59XG5cbmZ1bmN0aW9uIF9jb252ZXJ0VGltZVZhbHVlVG9NUyh2YWx1ZTogbnVtYmVyLCB1bml0OiBzdHJpbmcpOiBudW1iZXIge1xuICBzd2l0Y2ggKHVuaXQpIHtcbiAgICBjYXNlICdzJzpcbiAgICAgIHJldHVybiB2YWx1ZSAqIE9ORV9TRUNPTkQ7XG4gICAgZGVmYXVsdDogIC8vIG1zIG9yIHNvbWV0aGluZyBlbHNlXG4gICAgICByZXR1cm4gdmFsdWU7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVUaW1pbmcoXG4gICAgdGltaW5nczogc3RyaW5nIHwgbnVtYmVyIHwgQW5pbWF0ZVRpbWluZ3MsIGVycm9yczogYW55W10sIGFsbG93TmVnYXRpdmVWYWx1ZXM/OiBib29sZWFuKSB7XG4gIHJldHVybiB0aW1pbmdzLmhhc093blByb3BlcnR5KCdkdXJhdGlvbicpID9cbiAgICAgIDxBbmltYXRlVGltaW5ncz50aW1pbmdzIDpcbiAgICAgIHBhcnNlVGltZUV4cHJlc3Npb24oPHN0cmluZ3xudW1iZXI+dGltaW5ncywgZXJyb3JzLCBhbGxvd05lZ2F0aXZlVmFsdWVzKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VUaW1lRXhwcmVzc2lvbihcbiAgICBleHA6IHN0cmluZyB8IG51bWJlciwgZXJyb3JzOiBzdHJpbmdbXSwgYWxsb3dOZWdhdGl2ZVZhbHVlcz86IGJvb2xlYW4pOiBBbmltYXRlVGltaW5ncyB7XG4gIGNvbnN0IHJlZ2V4ID0gL14oLT9bXFwuXFxkXSspKG0/cykoPzpcXHMrKC0/W1xcLlxcZF0rKShtP3MpKT8oPzpcXHMrKFstYS16XSsoPzpcXCguKz9cXCkpPykpPyQvaTtcbiAgbGV0IGR1cmF0aW9uOiBudW1iZXI7XG4gIGxldCBkZWxheTogbnVtYmVyID0gMDtcbiAgbGV0IGVhc2luZzogc3RyaW5nID0gJyc7XG4gIGlmICh0eXBlb2YgZXhwID09PSAnc3RyaW5nJykge1xuICAgIGNvbnN0IG1hdGNoZXMgPSBleHAubWF0Y2gocmVnZXgpO1xuICAgIGlmIChtYXRjaGVzID09PSBudWxsKSB7XG4gICAgICBlcnJvcnMucHVzaChgVGhlIHByb3ZpZGVkIHRpbWluZyB2YWx1ZSBcIiR7ZXhwfVwiIGlzIGludmFsaWQuYCk7XG4gICAgICByZXR1cm4ge2R1cmF0aW9uOiAwLCBkZWxheTogMCwgZWFzaW5nOiAnJ307XG4gICAgfVxuXG4gICAgZHVyYXRpb24gPSBfY29udmVydFRpbWVWYWx1ZVRvTVMocGFyc2VGbG9hdChtYXRjaGVzWzFdKSwgbWF0Y2hlc1syXSk7XG5cbiAgICBjb25zdCBkZWxheU1hdGNoID0gbWF0Y2hlc1szXTtcbiAgICBpZiAoZGVsYXlNYXRjaCAhPSBudWxsKSB7XG4gICAgICBkZWxheSA9IF9jb252ZXJ0VGltZVZhbHVlVG9NUyhNYXRoLmZsb29yKHBhcnNlRmxvYXQoZGVsYXlNYXRjaCkpLCBtYXRjaGVzWzRdKTtcbiAgICB9XG5cbiAgICBjb25zdCBlYXNpbmdWYWwgPSBtYXRjaGVzWzVdO1xuICAgIGlmIChlYXNpbmdWYWwpIHtcbiAgICAgIGVhc2luZyA9IGVhc2luZ1ZhbDtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgZHVyYXRpb24gPSA8bnVtYmVyPmV4cDtcbiAgfVxuXG4gIGlmICghYWxsb3dOZWdhdGl2ZVZhbHVlcykge1xuICAgIGxldCBjb250YWluc0Vycm9ycyA9IGZhbHNlO1xuICAgIGxldCBzdGFydEluZGV4ID0gZXJyb3JzLmxlbmd0aDtcbiAgICBpZiAoZHVyYXRpb24gPCAwKSB7XG4gICAgICBlcnJvcnMucHVzaChgRHVyYXRpb24gdmFsdWVzIGJlbG93IDAgYXJlIG5vdCBhbGxvd2VkIGZvciB0aGlzIGFuaW1hdGlvbiBzdGVwLmApO1xuICAgICAgY29udGFpbnNFcnJvcnMgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAoZGVsYXkgPCAwKSB7XG4gICAgICBlcnJvcnMucHVzaChgRGVsYXkgdmFsdWVzIGJlbG93IDAgYXJlIG5vdCBhbGxvd2VkIGZvciB0aGlzIGFuaW1hdGlvbiBzdGVwLmApO1xuICAgICAgY29udGFpbnNFcnJvcnMgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAoY29udGFpbnNFcnJvcnMpIHtcbiAgICAgIGVycm9ycy5zcGxpY2Uoc3RhcnRJbmRleCwgMCwgYFRoZSBwcm92aWRlZCB0aW1pbmcgdmFsdWUgXCIke2V4cH1cIiBpcyBpbnZhbGlkLmApO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7ZHVyYXRpb24sIGRlbGF5LCBlYXNpbmd9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29weU9iaihcbiAgICBvYmo6IHtba2V5OiBzdHJpbmddOiBhbnl9LCBkZXN0aW5hdGlvbjoge1trZXk6IHN0cmluZ106IGFueX0gPSB7fSk6IHtba2V5OiBzdHJpbmddOiBhbnl9IHtcbiAgT2JqZWN0LmtleXMob2JqKS5mb3JFYWNoKHByb3AgPT4geyBkZXN0aW5hdGlvbltwcm9wXSA9IG9ialtwcm9wXTsgfSk7XG4gIHJldHVybiBkZXN0aW5hdGlvbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVN0eWxlcyhzdHlsZXM6IMm1U3R5bGVEYXRhIHwgybVTdHlsZURhdGFbXSk6IMm1U3R5bGVEYXRhIHtcbiAgY29uc3Qgbm9ybWFsaXplZFN0eWxlczogybVTdHlsZURhdGEgPSB7fTtcbiAgaWYgKEFycmF5LmlzQXJyYXkoc3R5bGVzKSkge1xuICAgIHN0eWxlcy5mb3JFYWNoKGRhdGEgPT4gY29weVN0eWxlcyhkYXRhLCBmYWxzZSwgbm9ybWFsaXplZFN0eWxlcykpO1xuICB9IGVsc2Uge1xuICAgIGNvcHlTdHlsZXMoc3R5bGVzLCBmYWxzZSwgbm9ybWFsaXplZFN0eWxlcyk7XG4gIH1cbiAgcmV0dXJuIG5vcm1hbGl6ZWRTdHlsZXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb3B5U3R5bGVzKFxuICAgIHN0eWxlczogybVTdHlsZURhdGEsIHJlYWRQcm90b3R5cGU6IGJvb2xlYW4sIGRlc3RpbmF0aW9uOiDJtVN0eWxlRGF0YSA9IHt9KTogybVTdHlsZURhdGEge1xuICBpZiAocmVhZFByb3RvdHlwZSkge1xuICAgIC8vIHdlIG1ha2UgdXNlIG9mIGEgZm9yLWluIGxvb3Agc28gdGhhdCB0aGVcbiAgICAvLyBwcm90b3R5cGljYWxseSBpbmhlcml0ZWQgcHJvcGVydGllcyBhcmVcbiAgICAvLyByZXZlYWxlZCBmcm9tIHRoZSBiYWNrRmlsbCBtYXBcbiAgICBmb3IgKGxldCBwcm9wIGluIHN0eWxlcykge1xuICAgICAgZGVzdGluYXRpb25bcHJvcF0gPSBzdHlsZXNbcHJvcF07XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvcHlPYmooc3R5bGVzLCBkZXN0aW5hdGlvbik7XG4gIH1cbiAgcmV0dXJuIGRlc3RpbmF0aW9uO1xufVxuXG5mdW5jdGlvbiBnZXRTdHlsZUF0dHJpYnV0ZVN0cmluZyhlbGVtZW50OiBhbnksIGtleTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKSB7XG4gIC8vIFJldHVybiB0aGUga2V5LXZhbHVlIHBhaXIgc3RyaW5nIHRvIGJlIGFkZGVkIHRvIHRoZSBzdHlsZSBhdHRyaWJ1dGUgZm9yIHRoZVxuICAvLyBnaXZlbiBDU1Mgc3R5bGUga2V5LlxuICBpZiAodmFsdWUpIHtcbiAgICByZXR1cm4ga2V5ICsgJzonICsgdmFsdWUgKyAnOyc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuICcnO1xuICB9XG59XG5cbmZ1bmN0aW9uIHdyaXRlU3R5bGVBdHRyaWJ1dGUoZWxlbWVudDogYW55KSB7XG4gIC8vIFJlYWQgdGhlIHN0eWxlIHByb3BlcnR5IG9mIHRoZSBlbGVtZW50IGFuZCBtYW51YWxseSByZWZsZWN0IGl0IHRvIHRoZVxuICAvLyBzdHlsZSBhdHRyaWJ1dGUuIFRoaXMgaXMgbmVlZGVkIGJlY2F1c2UgRG9taW5vIG9uIHBsYXRmb3JtLXNlcnZlciBkb2Vzbid0XG4gIC8vIHVuZGVyc3RhbmQgdGhlIGZ1bGwgc2V0IG9mIGFsbG93ZWQgQ1NTIHByb3BlcnRpZXMgYW5kIGRvZXNuJ3QgcmVmbGVjdCBzb21lXG4gIC8vIG9mIHRoZW0gYXV0b21hdGljYWxseS5cbiAgbGV0IHN0eWxlQXR0clZhbHVlID0gJyc7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZWxlbWVudC5zdHlsZS5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGtleSA9IGVsZW1lbnQuc3R5bGUuaXRlbShpKTtcbiAgICBzdHlsZUF0dHJWYWx1ZSArPSBnZXRTdHlsZUF0dHJpYnV0ZVN0cmluZyhlbGVtZW50LCBrZXksIGVsZW1lbnQuc3R5bGUuZ2V0UHJvcGVydHlWYWx1ZShrZXkpKTtcbiAgfVxuICBmb3IgKGNvbnN0IGtleSBpbiBlbGVtZW50LnN0eWxlKSB7XG4gICAgLy8gU2tpcCBpbnRlcm5hbCBEb21pbm8gcHJvcGVydGllcyB0aGF0IGRvbid0IG5lZWQgdG8gYmUgcmVmbGVjdGVkLlxuICAgIGlmICghZWxlbWVudC5zdHlsZS5oYXNPd25Qcm9wZXJ0eShrZXkpIHx8IGtleS5zdGFydHNXaXRoKCdfJykpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCBkYXNoS2V5ID0gY2FtZWxDYXNlVG9EYXNoQ2FzZShrZXkpO1xuICAgIHN0eWxlQXR0clZhbHVlICs9IGdldFN0eWxlQXR0cmlidXRlU3RyaW5nKGVsZW1lbnQsIGRhc2hLZXksIGVsZW1lbnQuc3R5bGVba2V5XSk7XG4gIH1cbiAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgc3R5bGVBdHRyVmFsdWUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0U3R5bGVzKGVsZW1lbnQ6IGFueSwgc3R5bGVzOiDJtVN0eWxlRGF0YSkge1xuICBpZiAoZWxlbWVudFsnc3R5bGUnXSkge1xuICAgIE9iamVjdC5rZXlzKHN0eWxlcykuZm9yRWFjaChwcm9wID0+IHtcbiAgICAgIGNvbnN0IGNhbWVsUHJvcCA9IGRhc2hDYXNlVG9DYW1lbENhc2UocHJvcCk7XG4gICAgICBlbGVtZW50LnN0eWxlW2NhbWVsUHJvcF0gPSBzdHlsZXNbcHJvcF07XG4gICAgfSk7XG4gICAgLy8gT24gdGhlIHNlcnZlciBzZXQgdGhlICdzdHlsZScgYXR0cmlidXRlIHNpbmNlIGl0J3Mgbm90IGF1dG9tYXRpY2FsbHkgcmVmbGVjdGVkLlxuICAgIGlmIChpc05vZGUoKSkge1xuICAgICAgd3JpdGVTdHlsZUF0dHJpYnV0ZShlbGVtZW50KTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVyYXNlU3R5bGVzKGVsZW1lbnQ6IGFueSwgc3R5bGVzOiDJtVN0eWxlRGF0YSkge1xuICBpZiAoZWxlbWVudFsnc3R5bGUnXSkge1xuICAgIE9iamVjdC5rZXlzKHN0eWxlcykuZm9yRWFjaChwcm9wID0+IHtcbiAgICAgIGNvbnN0IGNhbWVsUHJvcCA9IGRhc2hDYXNlVG9DYW1lbENhc2UocHJvcCk7XG4gICAgICBlbGVtZW50LnN0eWxlW2NhbWVsUHJvcF0gPSAnJztcbiAgICB9KTtcbiAgICAvLyBPbiB0aGUgc2VydmVyIHNldCB0aGUgJ3N0eWxlJyBhdHRyaWJ1dGUgc2luY2UgaXQncyBub3QgYXV0b21hdGljYWxseSByZWZsZWN0ZWQuXG4gICAgaWYgKGlzTm9kZSgpKSB7XG4gICAgICB3cml0ZVN0eWxlQXR0cmlidXRlKGVsZW1lbnQpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplQW5pbWF0aW9uRW50cnkoc3RlcHM6IEFuaW1hdGlvbk1ldGFkYXRhIHwgQW5pbWF0aW9uTWV0YWRhdGFbXSk6XG4gICAgQW5pbWF0aW9uTWV0YWRhdGEge1xuICBpZiAoQXJyYXkuaXNBcnJheShzdGVwcykpIHtcbiAgICBpZiAoc3RlcHMubGVuZ3RoID09IDEpIHJldHVybiBzdGVwc1swXTtcbiAgICByZXR1cm4gc2VxdWVuY2Uoc3RlcHMpO1xuICB9XG4gIHJldHVybiBzdGVwcyBhcyBBbmltYXRpb25NZXRhZGF0YTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlU3R5bGVQYXJhbXMoXG4gICAgdmFsdWU6IHN0cmluZyB8IG51bWJlciwgb3B0aW9uczogQW5pbWF0aW9uT3B0aW9ucywgZXJyb3JzOiBhbnlbXSkge1xuICBjb25zdCBwYXJhbXMgPSBvcHRpb25zLnBhcmFtcyB8fCB7fTtcbiAgY29uc3QgbWF0Y2hlcyA9IGV4dHJhY3RTdHlsZVBhcmFtcyh2YWx1ZSk7XG4gIGlmIChtYXRjaGVzLmxlbmd0aCkge1xuICAgIG1hdGNoZXMuZm9yRWFjaCh2YXJOYW1lID0+IHtcbiAgICAgIGlmICghcGFyYW1zLmhhc093blByb3BlcnR5KHZhck5hbWUpKSB7XG4gICAgICAgIGVycm9ycy5wdXNoKFxuICAgICAgICAgICAgYFVuYWJsZSB0byByZXNvbHZlIHRoZSBsb2NhbCBhbmltYXRpb24gcGFyYW0gJHt2YXJOYW1lfSBpbiB0aGUgZ2l2ZW4gbGlzdCBvZiB2YWx1ZXNgKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuXG5jb25zdCBQQVJBTV9SRUdFWCA9XG4gICAgbmV3IFJlZ0V4cChgJHtTVUJTVElUVVRJT05fRVhQUl9TVEFSVH1cXFxccyooLis/KVxcXFxzKiR7U1VCU1RJVFVUSU9OX0VYUFJfRU5EfWAsICdnJyk7XG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdFN0eWxlUGFyYW1zKHZhbHVlOiBzdHJpbmcgfCBudW1iZXIpOiBzdHJpbmdbXSB7XG4gIGxldCBwYXJhbXM6IHN0cmluZ1tdID0gW107XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgY29uc3QgdmFsID0gdmFsdWUudG9TdHJpbmcoKTtcblxuICAgIGxldCBtYXRjaDogYW55O1xuICAgIHdoaWxlIChtYXRjaCA9IFBBUkFNX1JFR0VYLmV4ZWModmFsKSkge1xuICAgICAgcGFyYW1zLnB1c2gobWF0Y2hbMV0gYXMgc3RyaW5nKTtcbiAgICB9XG4gICAgUEFSQU1fUkVHRVgubGFzdEluZGV4ID0gMDtcbiAgfVxuICByZXR1cm4gcGFyYW1zO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGVQYXJhbXMoXG4gICAgdmFsdWU6IHN0cmluZyB8IG51bWJlciwgcGFyYW1zOiB7W25hbWU6IHN0cmluZ106IGFueX0sIGVycm9yczogYW55W10pOiBzdHJpbmd8bnVtYmVyIHtcbiAgY29uc3Qgb3JpZ2luYWwgPSB2YWx1ZS50b1N0cmluZygpO1xuICBjb25zdCBzdHIgPSBvcmlnaW5hbC5yZXBsYWNlKFBBUkFNX1JFR0VYLCAoXywgdmFyTmFtZSkgPT4ge1xuICAgIGxldCBsb2NhbFZhbCA9IHBhcmFtc1t2YXJOYW1lXTtcbiAgICAvLyB0aGlzIG1lYW5zIHRoYXQgdGhlIHZhbHVlIHdhcyBuZXZlciBvdmVycmlkZGVuIGJ5IHRoZSBkYXRhIHBhc3NlZCBpbiBieSB0aGUgdXNlclxuICAgIGlmICghcGFyYW1zLmhhc093blByb3BlcnR5KHZhck5hbWUpKSB7XG4gICAgICBlcnJvcnMucHVzaChgUGxlYXNlIHByb3ZpZGUgYSB2YWx1ZSBmb3IgdGhlIGFuaW1hdGlvbiBwYXJhbSAke3Zhck5hbWV9YCk7XG4gICAgICBsb2NhbFZhbCA9ICcnO1xuICAgIH1cbiAgICByZXR1cm4gbG9jYWxWYWwudG9TdHJpbmcoKTtcbiAgfSk7XG5cbiAgLy8gd2UgZG8gdGhpcyB0byBhc3NlcnQgdGhhdCBudW1lcmljIHZhbHVlcyBzdGF5IGFzIHRoZXkgYXJlXG4gIHJldHVybiBzdHIgPT0gb3JpZ2luYWwgPyB2YWx1ZSA6IHN0cjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGl0ZXJhdG9yVG9BcnJheShpdGVyYXRvcjogYW55KTogYW55W10ge1xuICBjb25zdCBhcnI6IGFueVtdID0gW107XG4gIGxldCBpdGVtID0gaXRlcmF0b3IubmV4dCgpO1xuICB3aGlsZSAoIWl0ZW0uZG9uZSkge1xuICAgIGFyci5wdXNoKGl0ZW0udmFsdWUpO1xuICAgIGl0ZW0gPSBpdGVyYXRvci5uZXh0KCk7XG4gIH1cbiAgcmV0dXJuIGFycjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlQW5pbWF0aW9uT3B0aW9ucyhcbiAgICBzb3VyY2U6IEFuaW1hdGlvbk9wdGlvbnMsIGRlc3RpbmF0aW9uOiBBbmltYXRpb25PcHRpb25zKTogQW5pbWF0aW9uT3B0aW9ucyB7XG4gIGlmIChzb3VyY2UucGFyYW1zKSB7XG4gICAgY29uc3QgcDAgPSBzb3VyY2UucGFyYW1zO1xuICAgIGlmICghZGVzdGluYXRpb24ucGFyYW1zKSB7XG4gICAgICBkZXN0aW5hdGlvbi5wYXJhbXMgPSB7fTtcbiAgICB9XG4gICAgY29uc3QgcDEgPSBkZXN0aW5hdGlvbi5wYXJhbXM7XG4gICAgT2JqZWN0LmtleXMocDApLmZvckVhY2gocGFyYW0gPT4ge1xuICAgICAgaWYgKCFwMS5oYXNPd25Qcm9wZXJ0eShwYXJhbSkpIHtcbiAgICAgICAgcDFbcGFyYW1dID0gcDBbcGFyYW1dO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIHJldHVybiBkZXN0aW5hdGlvbjtcbn1cblxuY29uc3QgREFTSF9DQVNFX1JFR0VYUCA9IC8tKyhbYS16MC05XSkvZztcbmV4cG9ydCBmdW5jdGlvbiBkYXNoQ2FzZVRvQ2FtZWxDYXNlKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gaW5wdXQucmVwbGFjZShEQVNIX0NBU0VfUkVHRVhQLCAoLi4ubTogYW55W10pID0+IG1bMV0udG9VcHBlckNhc2UoKSk7XG59XG5cbmZ1bmN0aW9uIGNhbWVsQ2FzZVRvRGFzaENhc2UoaW5wdXQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBpbnB1dC5yZXBsYWNlKC8oW2Etel0pKFtBLVpdKS9nLCAnJDEtJDInKS50b0xvd2VyQ2FzZSgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYWxsb3dQcmV2aW91c1BsYXllclN0eWxlc01lcmdlKGR1cmF0aW9uOiBudW1iZXIsIGRlbGF5OiBudW1iZXIpIHtcbiAgcmV0dXJuIGR1cmF0aW9uID09PSAwIHx8IGRlbGF5ID09PSAwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYmFsYW5jZVByZXZpb3VzU3R5bGVzSW50b0tleWZyYW1lcyhcbiAgICBlbGVtZW50OiBhbnksIGtleWZyYW1lczoge1trZXk6IHN0cmluZ106IGFueX1bXSwgcHJldmlvdXNTdHlsZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9KSB7XG4gIGNvbnN0IHByZXZpb3VzU3R5bGVQcm9wcyA9IE9iamVjdC5rZXlzKHByZXZpb3VzU3R5bGVzKTtcbiAgaWYgKHByZXZpb3VzU3R5bGVQcm9wcy5sZW5ndGggJiYga2V5ZnJhbWVzLmxlbmd0aCkge1xuICAgIGxldCBzdGFydGluZ0tleWZyYW1lID0ga2V5ZnJhbWVzWzBdO1xuICAgIGxldCBtaXNzaW5nU3R5bGVQcm9wczogc3RyaW5nW10gPSBbXTtcbiAgICBwcmV2aW91c1N0eWxlUHJvcHMuZm9yRWFjaChwcm9wID0+IHtcbiAgICAgIGlmICghc3RhcnRpbmdLZXlmcmFtZS5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgICBtaXNzaW5nU3R5bGVQcm9wcy5wdXNoKHByb3ApO1xuICAgICAgfVxuICAgICAgc3RhcnRpbmdLZXlmcmFtZVtwcm9wXSA9IHByZXZpb3VzU3R5bGVzW3Byb3BdO1xuICAgIH0pO1xuXG4gICAgaWYgKG1pc3NpbmdTdHlsZVByb3BzLmxlbmd0aCkge1xuICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lXG4gICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGtleWZyYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBsZXQga2YgPSBrZXlmcmFtZXNbaV07XG4gICAgICAgIG1pc3NpbmdTdHlsZVByb3BzLmZvckVhY2goZnVuY3Rpb24ocHJvcCkgeyBrZltwcm9wXSA9IGNvbXB1dGVTdHlsZShlbGVtZW50LCBwcm9wKTsgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBrZXlmcmFtZXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB2aXNpdERzbE5vZGUoXG4gICAgdmlzaXRvcjogQW5pbWF0aW9uRHNsVmlzaXRvciwgbm9kZTogQW5pbWF0aW9uTWV0YWRhdGEsIGNvbnRleHQ6IGFueSk6IGFueTtcbmV4cG9ydCBmdW5jdGlvbiB2aXNpdERzbE5vZGUoXG4gICAgdmlzaXRvcjogQW5pbWF0aW9uQXN0VmlzaXRvciwgbm9kZTogQW5pbWF0aW9uQXN0PEFuaW1hdGlvbk1ldGFkYXRhVHlwZT4sIGNvbnRleHQ6IGFueSk6IGFueTtcbmV4cG9ydCBmdW5jdGlvbiB2aXNpdERzbE5vZGUodmlzaXRvcjogYW55LCBub2RlOiBhbnksIGNvbnRleHQ6IGFueSk6IGFueSB7XG4gIHN3aXRjaCAobm9kZS50eXBlKSB7XG4gICAgY2FzZSBBbmltYXRpb25NZXRhZGF0YVR5cGUuVHJpZ2dlcjpcbiAgICAgIHJldHVybiB2aXNpdG9yLnZpc2l0VHJpZ2dlcihub2RlLCBjb250ZXh0KTtcbiAgICBjYXNlIEFuaW1hdGlvbk1ldGFkYXRhVHlwZS5TdGF0ZTpcbiAgICAgIHJldHVybiB2aXNpdG9yLnZpc2l0U3RhdGUobm9kZSwgY29udGV4dCk7XG4gICAgY2FzZSBBbmltYXRpb25NZXRhZGF0YVR5cGUuVHJhbnNpdGlvbjpcbiAgICAgIHJldHVybiB2aXNpdG9yLnZpc2l0VHJhbnNpdGlvbihub2RlLCBjb250ZXh0KTtcbiAgICBjYXNlIEFuaW1hdGlvbk1ldGFkYXRhVHlwZS5TZXF1ZW5jZTpcbiAgICAgIHJldHVybiB2aXNpdG9yLnZpc2l0U2VxdWVuY2Uobm9kZSwgY29udGV4dCk7XG4gICAgY2FzZSBBbmltYXRpb25NZXRhZGF0YVR5cGUuR3JvdXA6XG4gICAgICByZXR1cm4gdmlzaXRvci52aXNpdEdyb3VwKG5vZGUsIGNvbnRleHQpO1xuICAgIGNhc2UgQW5pbWF0aW9uTWV0YWRhdGFUeXBlLkFuaW1hdGU6XG4gICAgICByZXR1cm4gdmlzaXRvci52aXNpdEFuaW1hdGUobm9kZSwgY29udGV4dCk7XG4gICAgY2FzZSBBbmltYXRpb25NZXRhZGF0YVR5cGUuS2V5ZnJhbWVzOlxuICAgICAgcmV0dXJuIHZpc2l0b3IudmlzaXRLZXlmcmFtZXMobm9kZSwgY29udGV4dCk7XG4gICAgY2FzZSBBbmltYXRpb25NZXRhZGF0YVR5cGUuU3R5bGU6XG4gICAgICByZXR1cm4gdmlzaXRvci52aXNpdFN0eWxlKG5vZGUsIGNvbnRleHQpO1xuICAgIGNhc2UgQW5pbWF0aW9uTWV0YWRhdGFUeXBlLlJlZmVyZW5jZTpcbiAgICAgIHJldHVybiB2aXNpdG9yLnZpc2l0UmVmZXJlbmNlKG5vZGUsIGNvbnRleHQpO1xuICAgIGNhc2UgQW5pbWF0aW9uTWV0YWRhdGFUeXBlLkFuaW1hdGVDaGlsZDpcbiAgICAgIHJldHVybiB2aXNpdG9yLnZpc2l0QW5pbWF0ZUNoaWxkKG5vZGUsIGNvbnRleHQpO1xuICAgIGNhc2UgQW5pbWF0aW9uTWV0YWRhdGFUeXBlLkFuaW1hdGVSZWY6XG4gICAgICByZXR1cm4gdmlzaXRvci52aXNpdEFuaW1hdGVSZWYobm9kZSwgY29udGV4dCk7XG4gICAgY2FzZSBBbmltYXRpb25NZXRhZGF0YVR5cGUuUXVlcnk6XG4gICAgICByZXR1cm4gdmlzaXRvci52aXNpdFF1ZXJ5KG5vZGUsIGNvbnRleHQpO1xuICAgIGNhc2UgQW5pbWF0aW9uTWV0YWRhdGFUeXBlLlN0YWdnZXI6XG4gICAgICByZXR1cm4gdmlzaXRvci52aXNpdFN0YWdnZXIobm9kZSwgY29udGV4dCk7XG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVW5hYmxlIHRvIHJlc29sdmUgYW5pbWF0aW9uIG1ldGFkYXRhIG5vZGUgIyR7bm9kZS50eXBlfWApO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlU3R5bGUoZWxlbWVudDogYW55LCBwcm9wOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gKDxhbnk+d2luZG93LmdldENvbXB1dGVkU3R5bGUoZWxlbWVudCkpW3Byb3BdO1xufVxuIl19
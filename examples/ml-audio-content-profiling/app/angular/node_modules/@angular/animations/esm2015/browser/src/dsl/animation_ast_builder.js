/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
import { AUTO_STYLE, style } from '@angular/animations';
import { getOrSetAsInMap } from '../render/shared';
import { NG_ANIMATING_SELECTOR, NG_TRIGGER_SELECTOR, SUBSTITUTION_EXPR_START, copyObj, extractStyleParams, iteratorToArray, normalizeAnimationEntry, resolveTiming, validateStyleParams, visitDslNode } from '../util';
import { parseTransitionExpr } from './animation_transition_expr';
/** @type {?} */
const SELF_TOKEN = ':self';
/** @type {?} */
const SELF_TOKEN_REGEX = new RegExp(`\s*${SELF_TOKEN}\s*,?`, 'g');
/**
 * @param {?} driver
 * @param {?} metadata
 * @param {?} errors
 * @return {?}
 */
export function buildAnimationAst(driver, metadata, errors) {
    return new AnimationAstBuilderVisitor(driver).build(metadata, errors);
}
/** @type {?} */
const ROOT_SELECTOR = '';
export class AnimationAstBuilderVisitor {
    /**
     * @param {?} _driver
     */
    constructor(_driver) {
        this._driver = _driver;
    }
    /**
     * @param {?} metadata
     * @param {?} errors
     * @return {?}
     */
    build(metadata, errors) {
        /** @type {?} */
        const context = new AnimationAstBuilderContext(errors);
        this._resetContextStyleTimingState(context);
        return /** @type {?} */ (visitDslNode(this, normalizeAnimationEntry(metadata), context));
    }
    /**
     * @param {?} context
     * @return {?}
     */
    _resetContextStyleTimingState(context) {
        context.currentQuerySelector = ROOT_SELECTOR;
        context.collectedStyles = {};
        context.collectedStyles[ROOT_SELECTOR] = {};
        context.currentTime = 0;
    }
    /**
     * @param {?} metadata
     * @param {?} context
     * @return {?}
     */
    visitTrigger(metadata, context) {
        /** @type {?} */
        let queryCount = context.queryCount = 0;
        /** @type {?} */
        let depCount = context.depCount = 0;
        /** @type {?} */
        const states = [];
        /** @type {?} */
        const transitions = [];
        if (metadata.name.charAt(0) == '@') {
            context.errors.push('animation triggers cannot be prefixed with an `@` sign (e.g. trigger(\'@foo\', [...]))');
        }
        metadata.definitions.forEach(def => {
            this._resetContextStyleTimingState(context);
            if (def.type == 0 /* State */) {
                /** @type {?} */
                const stateDef = /** @type {?} */ (def);
                /** @type {?} */
                const name = stateDef.name;
                name.toString().split(/\s*,\s*/).forEach(n => {
                    stateDef.name = n;
                    states.push(this.visitState(stateDef, context));
                });
                stateDef.name = name;
            }
            else if (def.type == 1 /* Transition */) {
                /** @type {?} */
                const transition = this.visitTransition(/** @type {?} */ (def), context);
                queryCount += transition.queryCount;
                depCount += transition.depCount;
                transitions.push(transition);
            }
            else {
                context.errors.push('only state() and transition() definitions can sit inside of a trigger()');
            }
        });
        return {
            type: 7 /* Trigger */,
            name: metadata.name, states, transitions, queryCount, depCount,
            options: null
        };
    }
    /**
     * @param {?} metadata
     * @param {?} context
     * @return {?}
     */
    visitState(metadata, context) {
        /** @type {?} */
        const styleAst = this.visitStyle(metadata.styles, context);
        /** @type {?} */
        const astParams = (metadata.options && metadata.options.params) || null;
        if (styleAst.containsDynamicStyles) {
            /** @type {?} */
            const missingSubs = new Set();
            /** @type {?} */
            const params = astParams || {};
            styleAst.styles.forEach(value => {
                if (isObject(value)) {
                    /** @type {?} */
                    const stylesObj = /** @type {?} */ (value);
                    Object.keys(stylesObj).forEach(prop => {
                        extractStyleParams(stylesObj[prop]).forEach(sub => {
                            if (!params.hasOwnProperty(sub)) {
                                missingSubs.add(sub);
                            }
                        });
                    });
                }
            });
            if (missingSubs.size) {
                /** @type {?} */
                const missingSubsArr = iteratorToArray(missingSubs.values());
                context.errors.push(`state("${metadata.name}", ...) must define default values for all the following style substitutions: ${missingSubsArr.join(', ')}`);
            }
        }
        return {
            type: 0 /* State */,
            name: metadata.name,
            style: styleAst,
            options: astParams ? { params: astParams } : null
        };
    }
    /**
     * @param {?} metadata
     * @param {?} context
     * @return {?}
     */
    visitTransition(metadata, context) {
        context.queryCount = 0;
        context.depCount = 0;
        /** @type {?} */
        const animation = visitDslNode(this, normalizeAnimationEntry(metadata.animation), context);
        /** @type {?} */
        const matchers = parseTransitionExpr(metadata.expr, context.errors);
        return {
            type: 1 /* Transition */,
            matchers,
            animation,
            queryCount: context.queryCount,
            depCount: context.depCount,
            options: normalizeAnimationOptions(metadata.options)
        };
    }
    /**
     * @param {?} metadata
     * @param {?} context
     * @return {?}
     */
    visitSequence(metadata, context) {
        return {
            type: 2 /* Sequence */,
            steps: metadata.steps.map(s => visitDslNode(this, s, context)),
            options: normalizeAnimationOptions(metadata.options)
        };
    }
    /**
     * @param {?} metadata
     * @param {?} context
     * @return {?}
     */
    visitGroup(metadata, context) {
        /** @type {?} */
        const currentTime = context.currentTime;
        /** @type {?} */
        let furthestTime = 0;
        /** @type {?} */
        const steps = metadata.steps.map(step => {
            context.currentTime = currentTime;
            /** @type {?} */
            const innerAst = visitDslNode(this, step, context);
            furthestTime = Math.max(furthestTime, context.currentTime);
            return innerAst;
        });
        context.currentTime = furthestTime;
        return {
            type: 3 /* Group */,
            steps,
            options: normalizeAnimationOptions(metadata.options)
        };
    }
    /**
     * @param {?} metadata
     * @param {?} context
     * @return {?}
     */
    visitAnimate(metadata, context) {
        /** @type {?} */
        const timingAst = constructTimingAst(metadata.timings, context.errors);
        context.currentAnimateTimings = timingAst;
        /** @type {?} */
        let styleAst;
        /** @type {?} */
        let styleMetadata = metadata.styles ? metadata.styles : style({});
        if (styleMetadata.type == 5 /* Keyframes */) {
            styleAst = this.visitKeyframes(/** @type {?} */ (styleMetadata), context);
        }
        else {
            /** @type {?} */
            let styleMetadata = /** @type {?} */ (metadata.styles);
            /** @type {?} */
            let isEmpty = false;
            if (!styleMetadata) {
                isEmpty = true;
                /** @type {?} */
                const newStyleData = {};
                if (timingAst.easing) {
                    newStyleData['easing'] = timingAst.easing;
                }
                styleMetadata = style(newStyleData);
            }
            context.currentTime += timingAst.duration + timingAst.delay;
            /** @type {?} */
            const _styleAst = this.visitStyle(styleMetadata, context);
            _styleAst.isEmptyStep = isEmpty;
            styleAst = _styleAst;
        }
        context.currentAnimateTimings = null;
        return {
            type: 4 /* Animate */,
            timings: timingAst,
            style: styleAst,
            options: null
        };
    }
    /**
     * @param {?} metadata
     * @param {?} context
     * @return {?}
     */
    visitStyle(metadata, context) {
        /** @type {?} */
        const ast = this._makeStyleAst(metadata, context);
        this._validateStyleAst(ast, context);
        return ast;
    }
    /**
     * @param {?} metadata
     * @param {?} context
     * @return {?}
     */
    _makeStyleAst(metadata, context) {
        /** @type {?} */
        const styles = [];
        if (Array.isArray(metadata.styles)) {
            (/** @type {?} */ (metadata.styles)).forEach(styleTuple => {
                if (typeof styleTuple == 'string') {
                    if (styleTuple == AUTO_STYLE) {
                        styles.push(/** @type {?} */ (styleTuple));
                    }
                    else {
                        context.errors.push(`The provided style string value ${styleTuple} is not allowed.`);
                    }
                }
                else {
                    styles.push(/** @type {?} */ (styleTuple));
                }
            });
        }
        else {
            styles.push(metadata.styles);
        }
        /** @type {?} */
        let containsDynamicStyles = false;
        /** @type {?} */
        let collectedEasing = null;
        styles.forEach(styleData => {
            if (isObject(styleData)) {
                /** @type {?} */
                const styleMap = /** @type {?} */ (styleData);
                /** @type {?} */
                const easing = styleMap['easing'];
                if (easing) {
                    collectedEasing = /** @type {?} */ (easing);
                    delete styleMap['easing'];
                }
                if (!containsDynamicStyles) {
                    for (let prop in styleMap) {
                        /** @type {?} */
                        const value = styleMap[prop];
                        if (value.toString().indexOf(SUBSTITUTION_EXPR_START) >= 0) {
                            containsDynamicStyles = true;
                            break;
                        }
                    }
                }
            }
        });
        return {
            type: 6 /* Style */,
            styles,
            easing: collectedEasing,
            offset: metadata.offset, containsDynamicStyles,
            options: null
        };
    }
    /**
     * @param {?} ast
     * @param {?} context
     * @return {?}
     */
    _validateStyleAst(ast, context) {
        /** @type {?} */
        const timings = context.currentAnimateTimings;
        /** @type {?} */
        let endTime = context.currentTime;
        /** @type {?} */
        let startTime = context.currentTime;
        if (timings && startTime > 0) {
            startTime -= timings.duration + timings.delay;
        }
        ast.styles.forEach(tuple => {
            if (typeof tuple == 'string')
                return;
            Object.keys(tuple).forEach(prop => {
                if (!this._driver.validateStyleProperty(prop)) {
                    context.errors.push(`The provided animation property "${prop}" is not a supported CSS property for animations`);
                    return;
                }
                /** @type {?} */
                const collectedStyles = context.collectedStyles[/** @type {?} */ ((context.currentQuerySelector))];
                /** @type {?} */
                const collectedEntry = collectedStyles[prop];
                /** @type {?} */
                let updateCollectedStyle = true;
                if (collectedEntry) {
                    if (startTime != endTime && startTime >= collectedEntry.startTime &&
                        endTime <= collectedEntry.endTime) {
                        context.errors.push(`The CSS property "${prop}" that exists between the times of "${collectedEntry.startTime}ms" and "${collectedEntry.endTime}ms" is also being animated in a parallel animation between the times of "${startTime}ms" and "${endTime}ms"`);
                        updateCollectedStyle = false;
                    }
                    // we always choose the smaller start time value since we
                    // want to have a record of the entire animation window where
                    // the style property is being animated in between
                    startTime = collectedEntry.startTime;
                }
                if (updateCollectedStyle) {
                    collectedStyles[prop] = { startTime, endTime };
                }
                if (context.options) {
                    validateStyleParams(tuple[prop], context.options, context.errors);
                }
            });
        });
    }
    /**
     * @param {?} metadata
     * @param {?} context
     * @return {?}
     */
    visitKeyframes(metadata, context) {
        /** @type {?} */
        const ast = { type: 5 /* Keyframes */, styles: [], options: null };
        if (!context.currentAnimateTimings) {
            context.errors.push(`keyframes() must be placed inside of a call to animate()`);
            return ast;
        }
        /** @type {?} */
        const MAX_KEYFRAME_OFFSET = 1;
        /** @type {?} */
        let totalKeyframesWithOffsets = 0;
        /** @type {?} */
        const offsets = [];
        /** @type {?} */
        let offsetsOutOfOrder = false;
        /** @type {?} */
        let keyframesOutOfRange = false;
        /** @type {?} */
        let previousOffset = 0;
        /** @type {?} */
        const keyframes = metadata.steps.map(styles => {
            /** @type {?} */
            const style = this._makeStyleAst(styles, context);
            /** @type {?} */
            let offsetVal = style.offset != null ? style.offset : consumeOffset(style.styles);
            /** @type {?} */
            let offset = 0;
            if (offsetVal != null) {
                totalKeyframesWithOffsets++;
                offset = style.offset = offsetVal;
            }
            keyframesOutOfRange = keyframesOutOfRange || offset < 0 || offset > 1;
            offsetsOutOfOrder = offsetsOutOfOrder || offset < previousOffset;
            previousOffset = offset;
            offsets.push(offset);
            return style;
        });
        if (keyframesOutOfRange) {
            context.errors.push(`Please ensure that all keyframe offsets are between 0 and 1`);
        }
        if (offsetsOutOfOrder) {
            context.errors.push(`Please ensure that all keyframe offsets are in order`);
        }
        /** @type {?} */
        const length = metadata.steps.length;
        /** @type {?} */
        let generatedOffset = 0;
        if (totalKeyframesWithOffsets > 0 && totalKeyframesWithOffsets < length) {
            context.errors.push(`Not all style() steps within the declared keyframes() contain offsets`);
        }
        else if (totalKeyframesWithOffsets == 0) {
            generatedOffset = MAX_KEYFRAME_OFFSET / (length - 1);
        }
        /** @type {?} */
        const limit = length - 1;
        /** @type {?} */
        const currentTime = context.currentTime;
        /** @type {?} */
        const currentAnimateTimings = /** @type {?} */ ((context.currentAnimateTimings));
        /** @type {?} */
        const animateDuration = currentAnimateTimings.duration;
        keyframes.forEach((kf, i) => {
            /** @type {?} */
            const offset = generatedOffset > 0 ? (i == limit ? 1 : (generatedOffset * i)) : offsets[i];
            /** @type {?} */
            const durationUpToThisFrame = offset * animateDuration;
            context.currentTime = currentTime + currentAnimateTimings.delay + durationUpToThisFrame;
            currentAnimateTimings.duration = durationUpToThisFrame;
            this._validateStyleAst(kf, context);
            kf.offset = offset;
            ast.styles.push(kf);
        });
        return ast;
    }
    /**
     * @param {?} metadata
     * @param {?} context
     * @return {?}
     */
    visitReference(metadata, context) {
        return {
            type: 8 /* Reference */,
            animation: visitDslNode(this, normalizeAnimationEntry(metadata.animation), context),
            options: normalizeAnimationOptions(metadata.options)
        };
    }
    /**
     * @param {?} metadata
     * @param {?} context
     * @return {?}
     */
    visitAnimateChild(metadata, context) {
        context.depCount++;
        return {
            type: 9 /* AnimateChild */,
            options: normalizeAnimationOptions(metadata.options)
        };
    }
    /**
     * @param {?} metadata
     * @param {?} context
     * @return {?}
     */
    visitAnimateRef(metadata, context) {
        return {
            type: 10 /* AnimateRef */,
            animation: this.visitReference(metadata.animation, context),
            options: normalizeAnimationOptions(metadata.options)
        };
    }
    /**
     * @param {?} metadata
     * @param {?} context
     * @return {?}
     */
    visitQuery(metadata, context) {
        /** @type {?} */
        const parentSelector = /** @type {?} */ ((context.currentQuerySelector));
        /** @type {?} */
        const options = /** @type {?} */ ((metadata.options || {}));
        context.queryCount++;
        context.currentQuery = metadata;
        const [selector, includeSelf] = normalizeSelector(metadata.selector);
        context.currentQuerySelector =
            parentSelector.length ? (parentSelector + ' ' + selector) : selector;
        getOrSetAsInMap(context.collectedStyles, context.currentQuerySelector, {});
        /** @type {?} */
        const animation = visitDslNode(this, normalizeAnimationEntry(metadata.animation), context);
        context.currentQuery = null;
        context.currentQuerySelector = parentSelector;
        return {
            type: 11 /* Query */,
            selector,
            limit: options.limit || 0,
            optional: !!options.optional, includeSelf, animation,
            originalSelector: metadata.selector,
            options: normalizeAnimationOptions(metadata.options)
        };
    }
    /**
     * @param {?} metadata
     * @param {?} context
     * @return {?}
     */
    visitStagger(metadata, context) {
        if (!context.currentQuery) {
            context.errors.push(`stagger() can only be used inside of query()`);
        }
        /** @type {?} */
        const timings = metadata.timings === 'full' ?
            { duration: 0, delay: 0, easing: 'full' } :
            resolveTiming(metadata.timings, context.errors, true);
        return {
            type: 12 /* Stagger */,
            animation: visitDslNode(this, normalizeAnimationEntry(metadata.animation), context), timings,
            options: null
        };
    }
}
if (false) {
    /** @type {?} */
    AnimationAstBuilderVisitor.prototype._driver;
}
/**
 * @param {?} selector
 * @return {?}
 */
function normalizeSelector(selector) {
    /** @type {?} */
    const hasAmpersand = selector.split(/\s*,\s*/).find(token => token == SELF_TOKEN) ? true : false;
    if (hasAmpersand) {
        selector = selector.replace(SELF_TOKEN_REGEX, '');
    }
    // the :enter and :leave selectors are filled in at runtime during timeline building
    selector = selector.replace(/@\*/g, NG_TRIGGER_SELECTOR)
        .replace(/@\w+/g, match => NG_TRIGGER_SELECTOR + '-' + match.substr(1))
        .replace(/:animating/g, NG_ANIMATING_SELECTOR);
    return [selector, hasAmpersand];
}
/**
 * @param {?} obj
 * @return {?}
 */
function normalizeParams(obj) {
    return obj ? copyObj(obj) : null;
}
/** @typedef {?} */
var StyleTimeTuple;
export { StyleTimeTuple };
export class AnimationAstBuilderContext {
    /**
     * @param {?} errors
     */
    constructor(errors) {
        this.errors = errors;
        this.queryCount = 0;
        this.depCount = 0;
        this.currentTransition = null;
        this.currentQuery = null;
        this.currentQuerySelector = null;
        this.currentAnimateTimings = null;
        this.currentTime = 0;
        this.collectedStyles = {};
        this.options = null;
    }
}
if (false) {
    /** @type {?} */
    AnimationAstBuilderContext.prototype.queryCount;
    /** @type {?} */
    AnimationAstBuilderContext.prototype.depCount;
    /** @type {?} */
    AnimationAstBuilderContext.prototype.currentTransition;
    /** @type {?} */
    AnimationAstBuilderContext.prototype.currentQuery;
    /** @type {?} */
    AnimationAstBuilderContext.prototype.currentQuerySelector;
    /** @type {?} */
    AnimationAstBuilderContext.prototype.currentAnimateTimings;
    /** @type {?} */
    AnimationAstBuilderContext.prototype.currentTime;
    /** @type {?} */
    AnimationAstBuilderContext.prototype.collectedStyles;
    /** @type {?} */
    AnimationAstBuilderContext.prototype.options;
    /** @type {?} */
    AnimationAstBuilderContext.prototype.errors;
}
/**
 * @param {?} styles
 * @return {?}
 */
function consumeOffset(styles) {
    if (typeof styles == 'string')
        return null;
    /** @type {?} */
    let offset = null;
    if (Array.isArray(styles)) {
        styles.forEach(styleTuple => {
            if (isObject(styleTuple) && styleTuple.hasOwnProperty('offset')) {
                /** @type {?} */
                const obj = /** @type {?} */ (styleTuple);
                offset = parseFloat(/** @type {?} */ (obj['offset']));
                delete obj['offset'];
            }
        });
    }
    else if (isObject(styles) && styles.hasOwnProperty('offset')) {
        /** @type {?} */
        const obj = /** @type {?} */ (styles);
        offset = parseFloat(/** @type {?} */ (obj['offset']));
        delete obj['offset'];
    }
    return offset;
}
/**
 * @param {?} value
 * @return {?}
 */
function isObject(value) {
    return !Array.isArray(value) && typeof value == 'object';
}
/**
 * @param {?} value
 * @param {?} errors
 * @return {?}
 */
function constructTimingAst(value, errors) {
    /** @type {?} */
    let timings = null;
    if (value.hasOwnProperty('duration')) {
        timings = /** @type {?} */ (value);
    }
    else if (typeof value == 'number') {
        /** @type {?} */
        const duration = resolveTiming(/** @type {?} */ (value), errors).duration;
        return makeTimingAst(/** @type {?} */ (duration), 0, '');
    }
    /** @type {?} */
    const strValue = /** @type {?} */ (value);
    /** @type {?} */
    const isDynamic = strValue.split(/\s+/).some(v => v.charAt(0) == '{' && v.charAt(1) == '{');
    if (isDynamic) {
        /** @type {?} */
        const ast = /** @type {?} */ (makeTimingAst(0, 0, ''));
        ast.dynamic = true;
        ast.strValue = strValue;
        return /** @type {?} */ (ast);
    }
    timings = timings || resolveTiming(strValue, errors);
    return makeTimingAst(timings.duration, timings.delay, timings.easing);
}
/**
 * @param {?} options
 * @return {?}
 */
function normalizeAnimationOptions(options) {
    if (options) {
        options = copyObj(options);
        if (options['params']) {
            options['params'] = /** @type {?} */ ((normalizeParams(options['params'])));
        }
    }
    else {
        options = {};
    }
    return options;
}
/**
 * @param {?} duration
 * @param {?} delay
 * @param {?} easing
 * @return {?}
 */
function makeTimingAst(duration, delay, easing) {
    return { duration, delay, easing };
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5pbWF0aW9uX2FzdF9idWlsZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5pbWF0aW9ucy9icm93c2VyL3NyYy9kc2wvYW5pbWF0aW9uX2FzdF9idWlsZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFPQSxPQUFPLEVBQUMsVUFBVSxFQUF1YyxLQUFLLEVBQWEsTUFBTSxxQkFBcUIsQ0FBQztBQUd2Z0IsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQ2pELE9BQU8sRUFBaUMscUJBQXFCLEVBQUUsbUJBQW1CLEVBQUUsdUJBQXVCLEVBQUUsT0FBTyxFQUFFLGtCQUFrQixFQUFFLGVBQWUsRUFBRSx1QkFBdUIsRUFBRSxhQUFhLEVBQUUsbUJBQW1CLEVBQUUsWUFBWSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBSXJQLE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLDZCQUE2QixDQUFDOztBQUVoRSxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUM7O0FBQzNCLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxNQUFNLENBQUMsTUFBTSxVQUFVLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQzs7Ozs7OztBQXNDbEUsTUFBTSxVQUFVLGlCQUFpQixDQUM3QixNQUF1QixFQUFFLFFBQWlELEVBQzFFLE1BQWE7SUFDZixPQUFPLElBQUksMEJBQTBCLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztDQUN2RTs7QUFFRCxNQUFNLGFBQWEsR0FBRyxFQUFFLENBQUM7QUFFekIsTUFBTSxPQUFPLDBCQUEwQjs7OztJQUNyQyxZQUFvQixPQUF3QjtRQUF4QixZQUFPLEdBQVAsT0FBTyxDQUFpQjtLQUFJOzs7Ozs7SUFFaEQsS0FBSyxDQUFDLFFBQStDLEVBQUUsTUFBYTs7UUFFbEUsTUFBTSxPQUFPLEdBQUcsSUFBSSww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QUFDLE1BQU0sQ0FBQyxDQUFDO0NBQ3ZFOzs7OztBQUVELFNBQVMseUJBQXlCLENBQUMsT0FBZ0M7SUFDakUsSUFBSSxPQUFPLEVBQUU7UUFDWCxPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzNCLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQ3JCLE9BQU8sQ0FBQyxRQUFRLENBQUMsc0JBQUcsZUFBZSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUM7U0FDMUQ7S0FDRjtTQUFNO1FBQ0wsT0FBTyxHQUFHLEVBQUUsQ0FBQztLQUNkO0lBQ0QsT0FBTyxPQUFPLENBQUM7Q0FDaEI7Ozs7Ozs7QUFFRCxTQUFTLGFBQWEsQ0FBQyxRQUFnQixFQUFFLEtBQWEsRUFBRSxNQUFxQjtJQUMzRSxPQUFPLEVBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUMsQ0FBQztDQUNsQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7QVVUT19TVFlMRSwgQW5pbWF0ZVRpbWluZ3MsIEFuaW1hdGlvbkFuaW1hdGVDaGlsZE1ldGFkYXRhLCBBbmltYXRpb25BbmltYXRlTWV0YWRhdGEsIEFuaW1hdGlvbkFuaW1hdGVSZWZNZXRhZGF0YSwgQW5pbWF0aW9uR3JvdXBNZXRhZGF0YSwgQW5pbWF0aW9uS2V5ZnJhbWVzU2VxdWVuY2VNZXRhZGF0YSwgQW5pbWF0aW9uTWV0YWRhdGEsIEFuaW1hdGlvbk1ldGFkYXRhVHlwZSwgQW5pbWF0aW9uT3B0aW9ucywgQW5pbWF0aW9uUXVlcnlNZXRhZGF0YSwgQW5pbWF0aW9uUXVlcnlPcHRpb25zLCBBbmltYXRpb25SZWZlcmVuY2VNZXRhZGF0YSwgQW5pbWF0aW9uU2VxdWVuY2VNZXRhZGF0YSwgQW5pbWF0aW9uU3RhZ2dlck1ldGFkYXRhLCBBbmltYXRpb25TdGF0ZU1ldGFkYXRhLCBBbmltYXRpb25TdHlsZU1ldGFkYXRhLCBBbmltYXRpb25UcmFuc2l0aW9uTWV0YWRhdGEsIEFuaW1hdGlvblRyaWdnZXJNZXRhZGF0YSwgc3R5bGUsIMm1U3R5bGVEYXRhfSBmcm9tICdAYW5ndWxhci9hbmltYXRpb25zJztcblxuaW1wb3J0IHtBbmltYXRpb25Ecml2ZXJ9IGZyb20gJy4uL3JlbmRlci9hbmltYXRpb25fZHJpdmVyJztcbmltcG9ydCB7Z2V0T3JTZXRBc0luTWFwfSBmcm9tICcuLi9yZW5kZXIvc2hhcmVkJztcbmltcG9ydCB7RU5URVJfU0VMRUNUT1IsIExFQVZFX1NFTEVDVE9SLCBOR19BTklNQVRJTkdfU0VMRUNUT1IsIE5HX1RSSUdHRVJfU0VMRUNUT1IsIFNVQlNUSVRVVElPTl9FWFBSX1NUQVJULCBjb3B5T2JqLCBleHRyYWN0U3R5bGVQYXJhbXMsIGl0ZXJhdG9yVG9BcnJheSwgbm9ybWFsaXplQW5pbWF0aW9uRW50cnksIHJlc29sdmVUaW1pbmcsIHZhbGlkYXRlU3R5bGVQYXJhbXMsIHZpc2l0RHNsTm9kZX0gZnJvbSAnLi4vdXRpbCc7XG5cbmltcG9ydCB7QW5pbWF0ZUFzdCwgQW5pbWF0ZUNoaWxkQXN0LCBBbmltYXRlUmVmQXN0LCBBc3QsIER5bmFtaWNUaW1pbmdBc3QsIEdyb3VwQXN0LCBLZXlmcmFtZXNBc3QsIFF1ZXJ5QXN0LCBSZWZlcmVuY2VBc3QsIFNlcXVlbmNlQXN0LCBTdGFnZ2VyQXN0LCBTdGF0ZUFzdCwgU3R5bGVBc3QsIFRpbWluZ0FzdCwgVHJhbnNpdGlvbkFzdCwgVHJpZ2dlckFzdH0gZnJvbSAnLi9hbmltYXRpb25fYXN0JztcbmltcG9ydCB7QW5pbWF0aW9uRHNsVmlzaXRvcn0gZnJvbSAnLi9hbmltYXRpb25fZHNsX3Zpc2l0b3InO1xuaW1wb3J0IHtwYXJzZVRyYW5zaXRpb25FeHByfSBmcm9tICcuL2FuaW1hdGlvbl90cmFuc2l0aW9uX2V4cHInO1xuXG5jb25zdCBTRUxGX1RPS0VOID0gJzpzZWxmJztcbmNvbnN0IFNFTEZfVE9LRU5fUkVHRVggPSBuZXcgUmVnRXhwKGBcXHMqJHtTRUxGX1RPS0VOfVxccyosP2AsICdnJyk7XG5cbi8qXG4gKiBbVmFsaWRhdGlvbl1cbiAqIFRoZSB2aXNpdG9yIGNvZGUgYmVsb3cgd2lsbCB0cmF2ZXJzZSB0aGUgYW5pbWF0aW9uIEFTVCBnZW5lcmF0ZWQgYnkgdGhlIGFuaW1hdGlvbiB2ZXJiIGZ1bmN0aW9uc1xuICogKHRoZSBvdXRwdXQgaXMgYSB0cmVlIG9mIG9iamVjdHMpIGFuZCBhdHRlbXB0IHRvIHBlcmZvcm0gYSBzZXJpZXMgb2YgdmFsaWRhdGlvbnMgb24gdGhlIGRhdGEuIFRoZVxuICogZm9sbG93aW5nIGNvcm5lci1jYXNlcyB3aWxsIGJlIHZhbGlkYXRlZDpcbiAqXG4gKiAxLiBPdmVybGFwIG9mIGFuaW1hdGlvbnNcbiAqIEdpdmVuIHRoYXQgYSBDU1MgcHJvcGVydHkgY2Fubm90IGJlIGFuaW1hdGVkIGluIG1vcmUgdGhhbiBvbmUgcGxhY2UgYXQgdGhlIHNhbWUgdGltZSwgaXQnc1xuICogaW1wb3J0YW50IHRoYXQgdGhpcyBiZWhhdmlvdXIgaXMgZGV0ZWN0ZWQgYW5kIHZhbGlkYXRlZC4gVGhlIHdheSBpbiB3aGljaCB0aGlzIG9jY3VycyBpcyB0aGF0XG4gKiBlYWNoIHRpbWUgYSBzdHlsZSBwcm9wZXJ0eSBpcyBleGFtaW5lZCwgYSBzdHJpbmctbWFwIGNvbnRhaW5pbmcgdGhlIHByb3BlcnR5IHdpbGwgYmUgdXBkYXRlZCB3aXRoXG4gKiB0aGUgc3RhcnQgYW5kIGVuZCB0aW1lcyBmb3Igd2hlbiB0aGUgcHJvcGVydHkgaXMgdXNlZCB3aXRoaW4gYW4gYW5pbWF0aW9uIHN0ZXAuXG4gKlxuICogSWYgdGhlcmUgYXJlIHR3byBvciBtb3JlIHBhcmFsbGVsIGFuaW1hdGlvbnMgdGhhdCBhcmUgY3VycmVudGx5IHJ1bm5pbmcgKHRoZXNlIGFyZSBpbnZva2VkIGJ5IHRoZVxuICogZ3JvdXAoKSkgb24gdGhlIHNhbWUgZWxlbWVudCB0aGVuIHRoZSB2YWxpZGF0b3Igd2lsbCB0aHJvdyBhbiBlcnJvci4gU2luY2UgdGhlIHN0YXJ0L2VuZCB0aW1pbmdcbiAqIHZhbHVlcyBhcmUgY29sbGVjdGVkIGZvciBlYWNoIHByb3BlcnR5IHRoZW4gaWYgdGhlIGN1cnJlbnQgYW5pbWF0aW9uIHN0ZXAgaXMgYW5pbWF0aW5nIHRoZSBzYW1lXG4gKiBwcm9wZXJ0eSBhbmQgaXRzIHRpbWluZyB2YWx1ZXMgZmFsbCBhbnl3aGVyZSBpbnRvIHRoZSB3aW5kb3cgb2YgdGltZSB0aGF0IHRoZSBwcm9wZXJ0eSBpc1xuICogY3VycmVudGx5IGJlaW5nIGFuaW1hdGVkIHdpdGhpbiB0aGVuIHRoaXMgaXMgd2hhdCBjYXVzZXMgYW4gZXJyb3IuXG4gKlxuICogMi4gVGltaW5nIHZhbHVlc1xuICogVGhlIHZhbGlkYXRvciB3aWxsIHZhbGlkYXRlIHRvIHNlZSBpZiBhIHRpbWluZyB2YWx1ZSBvZiBgZHVyYXRpb24gZGVsYXkgZWFzaW5nYCBvclxuICogYGR1cmF0aW9uTnVtYmVyYCBpcyB2YWxpZCBvciBub3QuXG4gKlxuICogKG5vdGUgdGhhdCB1cG9uIHZhbGlkYXRpb24gdGhlIGNvZGUgYmVsb3cgd2lsbCByZXBsYWNlIHRoZSB0aW1pbmcgZGF0YSB3aXRoIGFuIG9iamVjdCBjb250YWluaW5nXG4gKiB7ZHVyYXRpb24sZGVsYXksZWFzaW5nfS5cbiAqXG4gKiAzLiBPZmZzZXQgVmFsaWRhdGlvblxuICogRWFjaCBvZiB0aGUgc3R5bGUoKSBjYWxscyBhcmUgYWxsb3dlZCB0byBoYXZlIGFuIG9mZnNldCB2YWx1ZSB3aGVuIHBsYWNlZCBpbnNpZGUgb2Yga2V5ZnJhbWVzKCkuXG4gKiBPZmZzZXRzIHdpdGhpbiBrZXlmcmFtZXMoKSBhcmUgY29uc2lkZXJlZCB2YWxpZCB3aGVuOlxuICpcbiAqICAgLSBObyBvZmZzZXRzIGFyZSB1c2VkIGF0IGFsbFxuICogICAtIEVhY2ggc3R5bGUoKSBlbnRyeSBjb250YWlucyBhbiBvZmZzZXQgdmFsdWVcbiAqICAgLSBFYWNoIG9mZnNldCBpcyBiZXR3ZWVuIDAgYW5kIDFcbiAqICAgLSBFYWNoIG9mZnNldCBpcyBncmVhdGVyIHRvIG9yIGVxdWFsIHRoYW4gdGhlIHByZXZpb3VzIG9uZVxuICpcbiAqIE90aGVyd2lzZSBhbiBlcnJvciB3aWxsIGJlIHRocm93bi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkQW5pbWF0aW9uQXN0KFxuICAgIGRyaXZlcjogQW5pbWF0aW9uRHJpdmVyLCBtZXRhZGF0YTogQW5pbWF0aW9uTWV0YWRhdGEgfCBBbmltYXRpb25NZXRhZGF0YVtdLFxuICAgIGVycm9yczogYW55W10pOiBBc3Q8QW5pbWF0aW9uTWV0YWRhdGFUeXBlPiB7XG4gIHJldHVybiBuZXcgQW5pbWF0aW9uQXN0QnVpbGRlclZpc2l0b3IoZHJpdmVyKS5idWlsZChtZXRhZGF0YSwgZXJyb3JzKTtcbn1cblxuY29uc3QgUk9PVF9TRUxFQ1RPUiA9ICcnO1xuXG5leHBvcnQgY2xhc3MgQW5pbWF0aW9uQXN0QnVpbGRlclZpc2l0b3IgaW1wbGVtZW50cyBBbmltYXRpb25Ec2xWaXNpdG9yIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfZHJpdmVyOiBBbmltYXRpb25Ecml2ZXIpIHt9XG5cbiAgYnVpbGQobWV0YWRhdGE6IEFuaW1hdGlvbk1ldGFkYXRhfEFuaW1hdGlvbk1ldGFkYXRhW10sIGVycm9yczogYW55W10pOlxuICAgICAgQXN0PEFuaW1hdGlvbk1ldGFkYXRhVHlwZT4ge1xuICAgIGNvbnN0IGNvbnRleHQgPSBuZXcgQW5pbWF0aW9uQXN0QnVpbGRlckNvbnRleHQoZXJyb3JzKTtcbiAgICB0aGlzLl9yZXNldENvbnRleHRTdHlsZVRpbWluZ1N0YXRlKGNvbnRleHQpO1xuICAgIHJldHVybiA8QXN0PEFuaW1hdGlvbk1ldGFkYXRhVHlwZT4+dmlzaXREc2xOb2RlKFxuICAgICAgICB0aGlzLCBub3JtYWxpemVBbmltYXRpb25FbnRyeShtZXRhZGF0YSksIGNvbnRleHQpO1xuICB9XG5cbiAgcHJpdmF0ZSBfcmVzZXRDb250ZXh0U3R5bGVUaW1pbmdTdGF0ZShjb250ZXh0OiBBbmltYXRpb25Bc3RCdWlsZGVyQ29udGV4dCkge1xuICAgIGNvbnRleHQuY3VycmVudFF1ZXJ5U2VsZWN0b3IgPSBST09UX1NFTEVDVE9SO1xuICAgIGNvbnRleHQuY29sbGVjdGVkU3R5bGVzID0ge307XG4gICAgY29udGV4dC5jb2xsZWN0ZWRTdHlsZXNbUk9PVF9TRUxFQ1RPUl0gPSB7fTtcbiAgICBjb250ZXh0LmN1cnJlbnRUaW1lID0gMDtcbiAgfVxuXG4gIHZpc2l0VHJpZ2dlcihtZXRhZGF0YTogQW5pbWF0aW9uVHJpZ2dlck1ldGFkYXRhLCBjb250ZXh0OiBBbmltYXRpb25Bc3RCdWlsZGVyQ29udGV4dCk6XG4gICAgICBUcmlnZ2VyQXN0IHtcbiAgICBsZXQgcXVlcnlDb3VudCA9IGNvbnRleHQucXVlcnlDb3VudCA9IDA7XG4gICAgbGV0IGRlcENvdW50ID0gY29udGV4dC5kZXBDb3VudCA9IDA7XG4gICAgY29uc3Qgc3RhdGVzOiBTdGF0ZUFzdFtdID0gW107XG4gICAgY29uc3QgdHJhbnNpdGlvbnM6IFRyYW5zaXRpb25Bc3RbXSA9IFtdO1xuICAgIGlmIChtZXRhZGF0YS5uYW1lLmNoYXJBdCgwKSA9PSAnQCcpIHtcbiAgICAgIGNvbnRleHQuZXJyb3JzLnB1c2goXG4gICAgICAgICAgJ2FuaW1hdGlvbiB0cmlnZ2VycyBjYW5ub3QgYmUgcHJlZml4ZWQgd2l0aCBhbiBgQGAgc2lnbiAoZS5nLiB0cmlnZ2VyKFxcJ0Bmb29cXCcsIFsuLi5dKSknKTtcbiAgICB9XG5cbiAgICBtZXRhZGF0YS5kZWZpbml0aW9ucy5mb3JFYWNoKGRlZiA9PiB7XG4gICAgICB0aGlzLl9yZXNldENvbnRleHRTdHlsZVRpbWluZ1N0YXRlKGNvbnRleHQpO1xuICAgICAgaWYgKGRlZi50eXBlID09IEFuaW1hdGlvbk1ldGFkYXRhVHlwZS5TdGF0ZSkge1xuICAgICAgICBjb25zdCBzdGF0ZURlZiA9IGRlZiBhcyBBbmltYXRpb25TdGF0ZU1ldGFkYXRhO1xuICAgICAgICBjb25zdCBuYW1lID0gc3RhdGVEZWYubmFtZTtcbiAgICAgICAgbmFtZS50b1N0cmluZygpLnNwbGl0KC9cXHMqLFxccyovKS5mb3JFYWNoKG4gPT4ge1xuICAgICAgICAgIHN0YXRlRGVmLm5hbWUgPSBuO1xuICAgICAgICAgIHN0YXRlcy5wdXNoKHRoaXMudmlzaXRTdGF0ZShzdGF0ZURlZiwgY29udGV4dCkpO1xuICAgICAgICB9KTtcbiAgICAgICAgc3RhdGVEZWYubmFtZSA9IG5hbWU7XG4gICAgICB9IGVsc2UgaWYgKGRlZi50eXBlID09IEFuaW1hdGlvbk1ldGFkYXRhVHlwZS5UcmFuc2l0aW9uKSB7XG4gICAgICAgIGNvbnN0IHRyYW5zaXRpb24gPSB0aGlzLnZpc2l0VHJhbnNpdGlvbihkZWYgYXMgQW5pbWF0aW9uVHJhbnNpdGlvbk1ldGFkYXRhLCBjb250ZXh0KTtcbiAgICAgICAgcXVlcnlDb3VudCArPSB0cmFuc2l0aW9uLnF1ZXJ5Q291bnQ7XG4gICAgICAgIGRlcENvdW50ICs9IHRyYW5zaXRpb24uZGVwQ291bnQ7XG4gICAgICAgIHRyYW5zaXRpb25zLnB1c2godHJhbnNpdGlvbik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb250ZXh0LmVycm9ycy5wdXNoKFxuICAgICAgICAgICAgJ29ubHkgc3RhdGUoKSBhbmQgdHJhbnNpdGlvbigpIGRlZmluaXRpb25zIGNhbiBzaXQgaW5zaWRlIG9mIGEgdHJpZ2dlcigpJyk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogQW5pbWF0aW9uTWV0YWRhdGFUeXBlLlRyaWdnZXIsXG4gICAgICBuYW1lOiBtZXRhZGF0YS5uYW1lLCBzdGF0ZXMsIHRyYW5zaXRpb25zLCBxdWVyeUNvdW50LCBkZXBDb3VudCxcbiAgICAgIG9wdGlvbnM6IG51bGxcbiAgICB9O1xuICB9XG5cbiAgdmlzaXRTdGF0ZShtZXRhZGF0YTogQW5pbWF0aW9uU3RhdGVNZXRhZGF0YSwgY29udGV4dDogQW5pbWF0aW9uQXN0QnVpbGRlckNvbnRleHQpOiBTdGF0ZUFzdCB7XG4gICAgY29uc3Qgc3R5bGVBc3QgPSB0aGlzLnZpc2l0U3R5bGUobWV0YWRhdGEuc3R5bGVzLCBjb250ZXh0KTtcbiAgICBjb25zdCBhc3RQYXJhbXMgPSAobWV0YWRhdGEub3B0aW9ucyAmJiBtZXRhZGF0YS5vcHRpb25zLnBhcmFtcykgfHwgbnVsbDtcbiAgICBpZiAoc3R5bGVBc3QuY29udGFpbnNEeW5hbWljU3R5bGVzKSB7XG4gICAgICBjb25zdCBtaXNzaW5nU3VicyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgY29uc3QgcGFyYW1zID0gYXN0UGFyYW1zIHx8IHt9O1xuICAgICAgc3R5bGVBc3Quc3R5bGVzLmZvckVhY2godmFsdWUgPT4ge1xuICAgICAgICBpZiAoaXNPYmplY3QodmFsdWUpKSB7XG4gICAgICAgICAgY29uc3Qgc3R5bGVzT2JqID0gdmFsdWUgYXMgYW55O1xuICAgICAgICAgIE9iamVjdC5rZXlzKHN0eWxlc09iaikuZm9yRWFjaChwcm9wID0+IHtcbiAgICAgICAgICAgIGV4dHJhY3RTdHlsZVBhcmFtcyhzdHlsZXNPYmpbcHJvcF0pLmZvckVhY2goc3ViID0+IHtcbiAgICAgICAgICAgICAgaWYgKCFwYXJhbXMuaGFzT3duUHJvcGVydHkoc3ViKSkge1xuICAgICAgICAgICAgICAgIG1pc3NpbmdTdWJzLmFkZChzdWIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBpZiAobWlzc2luZ1N1YnMuc2l6ZSkge1xuICAgICAgICBjb25zdCBtaXNzaW5nU3Vic0FyciA9IGl0ZXJhdG9yVG9BcnJheShtaXNzaW5nU3Vicy52YWx1ZXMoKSk7XG4gICAgICAgIGNvbnRleHQuZXJyb3JzLnB1c2goXG4gICAgICAgICAgICBgc3RhdGUoXCIke21ldGFkYXRhLm5hbWV9XCIsIC4uLikgbXVzdCBkZWZpbmUgZGVmYXVsdCB2YWx1ZXMgZm9yIGFsbCB0aGUgZm9sbG93aW5nIHN0eWxlIHN1YnN0aXR1dGlvbnM6ICR7bWlzc2luZ1N1YnNBcnIuam9pbignLCAnKX1gKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogQW5pbWF0aW9uTWV0YWRhdGFUeXBlLlN0YXRlLFxuICAgICAgbmFtZTogbWV0YWRhdGEubmFtZSxcbiAgICAgIHN0eWxlOiBzdHlsZUFzdCxcbiAgICAgIG9wdGlvbnM6IGFzdFBhcmFtcyA/IHtwYXJhbXM6IGFzdFBhcmFtc30gOiBudWxsXG4gICAgfTtcbiAgfVxuXG4gIHZpc2l0VHJhbnNpdGlvbihtZXRhZGF0YTogQW5pbWF0aW9uVHJhbnNpdGlvbk1ldGFkYXRhLCBjb250ZXh0OiBBbmltYXRpb25Bc3RCdWlsZGVyQ29udGV4dCk6XG4gICAgICBUcmFuc2l0aW9uQXN0IHtcbiAgICBjb250ZXh0LnF1ZXJ5Q291bnQgPSAwO1xuICAgIGNvbnRleHQuZGVwQ291bnQgPSAwO1xuICAgIGNvbnN0IGFuaW1hdGlvbiA9IHZpc2l0RHNsTm9kZSh0aGlzLCBub3JtYWxpemVBbmltYXRpb25FbnRyeShtZXRhZGF0YS5hbmltYXRpb24pLCBjb250ZXh0KTtcbiAgICBjb25zdCBtYXRjaGVycyA9IHBhcnNlVHJhbnNpdGlvbkV4cHIobWV0YWRhdGEuZXhwciwgY29udGV4dC5lcnJvcnMpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IEFuaW1hdGlvbk1ldGFkYXRhVHlwZS5UcmFuc2l0aW9uLFxuICAgICAgbWF0Y2hlcnMsXG4gICAgICBhbmltYXRpb24sXG4gICAgICBxdWVyeUNvdW50OiBjb250ZXh0LnF1ZXJ5Q291bnQsXG4gICAgICBkZXBDb3VudDogY29udGV4dC5kZXBDb3VudCxcbiAgICAgIG9wdGlvbnM6IG5vcm1hbGl6ZUFuaW1hdGlvbk9wdGlvbnMobWV0YWRhdGEub3B0aW9ucylcbiAgICB9O1xuICB9XG5cbiAgdmlzaXRTZXF1ZW5jZShtZXRhZGF0YTogQW5pbWF0aW9uU2VxdWVuY2VNZXRhZGF0YSwgY29udGV4dDogQW5pbWF0aW9uQXN0QnVpbGRlckNvbnRleHQpOlxuICAgICAgU2VxdWVuY2VBc3Qge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiBBbmltYXRpb25NZXRhZGF0YVR5cGUuU2VxdWVuY2UsXG4gICAgICBzdGVwczogbWV0YWRhdGEuc3RlcHMubWFwKHMgPT4gdmlzaXREc2xOb2RlKHRoaXMsIHMsIGNvbnRleHQpKSxcbiAgICAgIG9wdGlvbnM6IG5vcm1hbGl6ZUFuaW1hdGlvbk9wdGlvbnMobWV0YWRhdGEub3B0aW9ucylcbiAgICB9O1xuICB9XG5cbiAgdmlzaXRHcm91cChtZXRhZGF0YTogQW5pbWF0aW9uR3JvdXBNZXRhZGF0YSwgY29udGV4dDogQW5pbWF0aW9uQXN0QnVpbGRlckNvbnRleHQpOiBHcm91cEFzdCB7XG4gICAgY29uc3QgY3VycmVudFRpbWUgPSBjb250ZXh0LmN1cnJlbnRUaW1lO1xuICAgIGxldCBmdXJ0aGVzdFRpbWUgPSAwO1xuICAgIGNvbnN0IHN0ZXBzID0gbWV0YWRhdGEuc3RlcHMubWFwKHN0ZXAgPT4ge1xuICAgICAgY29udGV4dC5jdXJyZW50VGltZSA9IGN1cnJlbnRUaW1lO1xuICAgICAgY29uc3QgaW5uZXJBc3QgPSB2aXNpdERzbE5vZGUodGhpcywgc3RlcCwgY29udGV4dCk7XG4gICAgICBmdXJ0aGVzdFRpbWUgPSBNYXRoLm1heChmdXJ0aGVzdFRpbWUsIGNvbnRleHQuY3VycmVudFRpbWUpO1xuICAgICAgcmV0dXJuIGlubmVyQXN0O1xuICAgIH0pO1xuXG4gICAgY29udGV4dC5jdXJyZW50VGltZSA9IGZ1cnRoZXN0VGltZTtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogQW5pbWF0aW9uTWV0YWRhdGFUeXBlLkdyb3VwLFxuICAgICAgc3RlcHMsXG4gICAgICBvcHRpb25zOiBub3JtYWxpemVBbmltYXRpb25PcHRpb25zKG1ldGFkYXRhLm9wdGlvbnMpXG4gICAgfTtcbiAgfVxuXG4gIHZpc2l0QW5pbWF0ZShtZXRhZGF0YTogQW5pbWF0aW9uQW5pbWF0ZU1ldGFkYXRhLCBjb250ZXh0OiBBbmltYXRpb25Bc3RCdWlsZGVyQ29udGV4dCk6XG4gICAgICBBbmltYXRlQXN0IHtcbiAgICBjb25zdCB0aW1pbmdBc3QgPSBjb25zdHJ1Y3RUaW1pbmdBc3QobWV0YWRhdGEudGltaW5ncywgY29udGV4dC5lcnJvcnMpO1xuICAgIGNvbnRleHQuY3VycmVudEFuaW1hdGVUaW1pbmdzID0gdGltaW5nQXN0O1xuXG4gICAgbGV0IHN0eWxlQXN0OiBTdHlsZUFzdHxLZXlmcmFtZXNBc3Q7XG4gICAgbGV0IHN0eWxlTWV0YWRhdGE6IEFuaW1hdGlvbk1ldGFkYXRhID0gbWV0YWRhdGEuc3R5bGVzID8gbWV0YWRhdGEuc3R5bGVzIDogc3R5bGUoe30pO1xuICAgIGlmIChzdHlsZU1ldGFkYXRhLnR5cGUgPT0gQW5pbWF0aW9uTWV0YWRhdGFUeXBlLktleWZyYW1lcykge1xuICAgICAgc3R5bGVBc3QgPSB0aGlzLnZpc2l0S2V5ZnJhbWVzKHN0eWxlTWV0YWRhdGEgYXMgQW5pbWF0aW9uS2V5ZnJhbWVzU2VxdWVuY2VNZXRhZGF0YSwgY29udGV4dCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBzdHlsZU1ldGFkYXRhID0gbWV0YWRhdGEuc3R5bGVzIGFzIEFuaW1hdGlvblN0eWxlTWV0YWRhdGE7XG4gICAgICBsZXQgaXNFbXB0eSA9IGZhbHNlO1xuICAgICAgaWYgKCFzdHlsZU1ldGFkYXRhKSB7XG4gICAgICAgIGlzRW1wdHkgPSB0cnVlO1xuICAgICAgICBjb25zdCBuZXdTdHlsZURhdGE6IHtbcHJvcDogc3RyaW5nXTogc3RyaW5nIHwgbnVtYmVyfSA9IHt9O1xuICAgICAgICBpZiAodGltaW5nQXN0LmVhc2luZykge1xuICAgICAgICAgIG5ld1N0eWxlRGF0YVsnZWFzaW5nJ10gPSB0aW1pbmdBc3QuZWFzaW5nO1xuICAgICAgICB9XG4gICAgICAgIHN0eWxlTWV0YWRhdGEgPSBzdHlsZShuZXdTdHlsZURhdGEpO1xuICAgICAgfVxuICAgICAgY29udGV4dC5jdXJyZW50VGltZSArPSB0aW1pbmdBc3QuZHVyYXRpb24gKyB0aW1pbmdBc3QuZGVsYXk7XG4gICAgICBjb25zdCBfc3R5bGVBc3QgPSB0aGlzLnZpc2l0U3R5bGUoc3R5bGVNZXRhZGF0YSwgY29udGV4dCk7XG4gICAgICBfc3R5bGVBc3QuaXNFbXB0eVN0ZXAgPSBpc0VtcHR5O1xuICAgICAgc3R5bGVBc3QgPSBfc3R5bGVBc3Q7XG4gICAgfVxuXG4gICAgY29udGV4dC5jdXJyZW50QW5pbWF0ZVRpbWluZ3MgPSBudWxsO1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiBBbmltYXRpb25NZXRhZGF0YVR5cGUuQW5pbWF0ZSxcbiAgICAgIHRpbWluZ3M6IHRpbWluZ0FzdCxcbiAgICAgIHN0eWxlOiBzdHlsZUFzdCxcbiAgICAgIG9wdGlvbnM6IG51bGxcbiAgICB9O1xuICB9XG5cbiAgdmlzaXRTdHlsZShtZXRhZGF0YTogQW5pbWF0aW9uU3R5bGVNZXRhZGF0YSwgY29udGV4dDogQW5pbWF0aW9uQXN0QnVpbGRlckNvbnRleHQpOiBTdHlsZUFzdCB7XG4gICAgY29uc3QgYXN0ID0gdGhpcy5fbWFrZVN0eWxlQXN0KG1ldGFkYXRhLCBjb250ZXh0KTtcbiAgICB0aGlzLl92YWxpZGF0ZVN0eWxlQXN0KGFzdCwgY29udGV4dCk7XG4gICAgcmV0dXJuIGFzdDtcbiAgfVxuXG4gIHByaXZhdGUgX21ha2VTdHlsZUFzdChtZXRhZGF0YTogQW5pbWF0aW9uU3R5bGVNZXRhZGF0YSwgY29udGV4dDogQW5pbWF0aW9uQXN0QnVpbGRlckNvbnRleHQpOlxuICAgICAgU3R5bGVBc3Qge1xuICAgIGNvbnN0IHN0eWxlczogKMm1U3R5bGVEYXRhIHwgc3RyaW5nKVtdID0gW107XG4gICAgaWYgKEFycmF5LmlzQXJyYXkobWV0YWRhdGEuc3R5bGVzKSkge1xuICAgICAgKG1ldGFkYXRhLnN0eWxlcyBhcyjJtVN0eWxlRGF0YSB8IHN0cmluZylbXSkuZm9yRWFjaChzdHlsZVR1cGxlID0+IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzdHlsZVR1cGxlID09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgaWYgKHN0eWxlVHVwbGUgPT0gQVVUT19TVFlMRSkge1xuICAgICAgICAgICAgc3R5bGVzLnB1c2goc3R5bGVUdXBsZSBhcyBzdHJpbmcpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb250ZXh0LmVycm9ycy5wdXNoKGBUaGUgcHJvdmlkZWQgc3R5bGUgc3RyaW5nIHZhbHVlICR7c3R5bGVUdXBsZX0gaXMgbm90IGFsbG93ZWQuYCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0eWxlcy5wdXNoKHN0eWxlVHVwbGUgYXMgybVTdHlsZURhdGEpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3R5bGVzLnB1c2gobWV0YWRhdGEuc3R5bGVzKTtcbiAgICB9XG5cbiAgICBsZXQgY29udGFpbnNEeW5hbWljU3R5bGVzID0gZmFsc2U7XG4gICAgbGV0IGNvbGxlY3RlZEVhc2luZzogc3RyaW5nfG51bGwgPSBudWxsO1xuICAgIHN0eWxlcy5mb3JFYWNoKHN0eWxlRGF0YSA9PiB7XG4gICAgICBpZiAoaXNPYmplY3Qoc3R5bGVEYXRhKSkge1xuICAgICAgICBjb25zdCBzdHlsZU1hcCA9IHN0eWxlRGF0YSBhcyDJtVN0eWxlRGF0YTtcbiAgICAgICAgY29uc3QgZWFzaW5nID0gc3R5bGVNYXBbJ2Vhc2luZyddO1xuICAgICAgICBpZiAoZWFzaW5nKSB7XG4gICAgICAgICAgY29sbGVjdGVkRWFzaW5nID0gZWFzaW5nIGFzIHN0cmluZztcbiAgICAgICAgICBkZWxldGUgc3R5bGVNYXBbJ2Vhc2luZyddO1xuICAgICAgICB9XG4gICAgICAgIGlmICghY29udGFpbnNEeW5hbWljU3R5bGVzKSB7XG4gICAgICAgICAgZm9yIChsZXQgcHJvcCBpbiBzdHlsZU1hcCkge1xuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBzdHlsZU1hcFtwcm9wXTtcbiAgICAgICAgICAgIGlmICh2YWx1ZS50b1N0cmluZygpLmluZGV4T2YoU1VCU1RJVFVUSU9OX0VYUFJfU1RBUlQpID49IDApIHtcbiAgICAgICAgICAgICAgY29udGFpbnNEeW5hbWljU3R5bGVzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogQW5pbWF0aW9uTWV0YWRhdGFUeXBlLlN0eWxlLFxuICAgICAgc3R5bGVzLFxuICAgICAgZWFzaW5nOiBjb2xsZWN0ZWRFYXNpbmcsXG4gICAgICBvZmZzZXQ6IG1ldGFkYXRhLm9mZnNldCwgY29udGFpbnNEeW5hbWljU3R5bGVzLFxuICAgICAgb3B0aW9uczogbnVsbFxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIF92YWxpZGF0ZVN0eWxlQXN0KGFzdDogU3R5bGVBc3QsIGNvbnRleHQ6IEFuaW1hdGlvbkFzdEJ1aWxkZXJDb250ZXh0KTogdm9pZCB7XG4gICAgY29uc3QgdGltaW5ncyA9IGNvbnRleHQuY3VycmVudEFuaW1hdGVUaW1pbmdzO1xuICAgIGxldCBlbmRUaW1lID0gY29udGV4dC5jdXJyZW50VGltZTtcbiAgICBsZXQgc3RhcnRUaW1lID0gY29udGV4dC5jdXJyZW50VGltZTtcbiAgICBpZiAodGltaW5ncyAmJiBzdGFydFRpbWUgPiAwKSB7XG4gICAgICBzdGFydFRpbWUgLT0gdGltaW5ncy5kdXJhdGlvbiArIHRpbWluZ3MuZGVsYXk7XG4gICAgfVxuXG4gICAgYXN0LnN0eWxlcy5mb3JFYWNoKHR1cGxlID0+IHtcbiAgICAgIGlmICh0eXBlb2YgdHVwbGUgPT0gJ3N0cmluZycpIHJldHVybjtcblxuICAgICAgT2JqZWN0LmtleXModHVwbGUpLmZvckVhY2gocHJvcCA9PiB7XG4gICAgICAgIGlmICghdGhpcy5fZHJpdmVyLnZhbGlkYXRlU3R5bGVQcm9wZXJ0eShwcm9wKSkge1xuICAgICAgICAgIGNvbnRleHQuZXJyb3JzLnB1c2goXG4gICAgICAgICAgICAgIGBUaGUgcHJvdmlkZWQgYW5pbWF0aW9uIHByb3BlcnR5IFwiJHtwcm9wfVwiIGlzIG5vdCBhIHN1cHBvcnRlZCBDU1MgcHJvcGVydHkgZm9yIGFuaW1hdGlvbnNgKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjb2xsZWN0ZWRTdHlsZXMgPSBjb250ZXh0LmNvbGxlY3RlZFN0eWxlc1tjb250ZXh0LmN1cnJlbnRRdWVyeVNlbGVjdG9yICFdO1xuICAgICAgICBjb25zdCBjb2xsZWN0ZWRFbnRyeSA9IGNvbGxlY3RlZFN0eWxlc1twcm9wXTtcbiAgICAgICAgbGV0IHVwZGF0ZUNvbGxlY3RlZFN0eWxlID0gdHJ1ZTtcbiAgICAgICAgaWYgKGNvbGxlY3RlZEVudHJ5KSB7XG4gICAgICAgICAgaWYgKHN0YXJ0VGltZSAhPSBlbmRUaW1lICYmIHN0YXJ0VGltZSA+PSBjb2xsZWN0ZWRFbnRyeS5zdGFydFRpbWUgJiZcbiAgICAgICAgICAgICAgZW5kVGltZSA8PSBjb2xsZWN0ZWRFbnRyeS5lbmRUaW1lKSB7XG4gICAgICAgICAgICBjb250ZXh0LmVycm9ycy5wdXNoKFxuICAgICAgICAgICAgICAgIGBUaGUgQ1NTIHByb3BlcnR5IFwiJHtwcm9wfVwiIHRoYXQgZXhpc3RzIGJldHdlZW4gdGhlIHRpbWVzIG9mIFwiJHtjb2xsZWN0ZWRFbnRyeS5zdGFydFRpbWV9bXNcIiBhbmQgXCIke2NvbGxlY3RlZEVudHJ5LmVuZFRpbWV9bXNcIiBpcyBhbHNvIGJlaW5nIGFuaW1hdGVkIGluIGEgcGFyYWxsZWwgYW5pbWF0aW9uIGJldHdlZW4gdGhlIHRpbWVzIG9mIFwiJHtzdGFydFRpbWV9bXNcIiBhbmQgXCIke2VuZFRpbWV9bXNcImApO1xuICAgICAgICAgICAgdXBkYXRlQ29sbGVjdGVkU3R5bGUgPSBmYWxzZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyB3ZSBhbHdheXMgY2hvb3NlIHRoZSBzbWFsbGVyIHN0YXJ0IHRpbWUgdmFsdWUgc2luY2Ugd2VcbiAgICAgICAgICAvLyB3YW50IHRvIGhhdmUgYSByZWNvcmQgb2YgdGhlIGVudGlyZSBhbmltYXRpb24gd2luZG93IHdoZXJlXG4gICAgICAgICAgLy8gdGhlIHN0eWxlIHByb3BlcnR5IGlzIGJlaW5nIGFuaW1hdGVkIGluIGJldHdlZW5cbiAgICAgICAgICBzdGFydFRpbWUgPSBjb2xsZWN0ZWRFbnRyeS5zdGFydFRpbWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodXBkYXRlQ29sbGVjdGVkU3R5bGUpIHtcbiAgICAgICAgICBjb2xsZWN0ZWRTdHlsZXNbcHJvcF0gPSB7c3RhcnRUaW1lLCBlbmRUaW1lfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb250ZXh0Lm9wdGlvbnMpIHtcbiAgICAgICAgICB2YWxpZGF0ZVN0eWxlUGFyYW1zKHR1cGxlW3Byb3BdLCBjb250ZXh0Lm9wdGlvbnMsIGNvbnRleHQuZXJyb3JzKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICB2aXNpdEtleWZyYW1lcyhtZXRhZGF0YTogQW5pbWF0aW9uS2V5ZnJhbWVzU2VxdWVuY2VNZXRhZGF0YSwgY29udGV4dDogQW5pbWF0aW9uQXN0QnVpbGRlckNvbnRleHQpOlxuICAgICAgS2V5ZnJhbWVzQXN0IHtcbiAgICBjb25zdCBhc3Q6IEtleWZyYW1lc0FzdCA9IHt0eXBlOiBBbmltYXRpb25NZXRhZGF0YVR5cGUuS2V5ZnJhbWVzLCBzdHlsZXM6IFtdLCBvcHRpb25zOiBudWxsfTtcbiAgICBpZiAoIWNvbnRleHQuY3VycmVudEFuaW1hdGVUaW1pbmdzKSB7XG4gICAgICBjb250ZXh0LmVycm9ycy5wdXNoKGBrZXlmcmFtZXMoKSBtdXN0IGJlIHBsYWNlZCBpbnNpZGUgb2YgYSBjYWxsIHRvIGFuaW1hdGUoKWApO1xuICAgICAgcmV0dXJuIGFzdDtcbiAgICB9XG5cbiAgICBjb25zdCBNQVhfS0VZRlJBTUVfT0ZGU0VUID0gMTtcblxuICAgIGxldCB0b3RhbEtleWZyYW1lc1dpdGhPZmZzZXRzID0gMDtcbiAgICBjb25zdCBvZmZzZXRzOiBudW1iZXJbXSA9IFtdO1xuICAgIGxldCBvZmZzZXRzT3V0T2ZPcmRlciA9IGZhbHNlO1xuICAgIGxldCBrZXlmcmFtZXNPdXRPZlJhbmdlID0gZmFsc2U7XG4gICAgbGV0IHByZXZpb3VzT2Zmc2V0OiBudW1iZXIgPSAwO1xuXG4gICAgY29uc3Qga2V5ZnJhbWVzOiBTdHlsZUFzdFtdID0gbWV0YWRhdGEuc3RlcHMubWFwKHN0eWxlcyA9PiB7XG4gICAgICBjb25zdCBzdHlsZSA9IHRoaXMuX21ha2VTdHlsZUFzdChzdHlsZXMsIGNvbnRleHQpO1xuICAgICAgbGV0IG9mZnNldFZhbDogbnVtYmVyfG51bGwgPVxuICAgICAgICAgIHN0eWxlLm9mZnNldCAhPSBudWxsID8gc3R5bGUub2Zmc2V0IDogY29uc3VtZU9mZnNldChzdHlsZS5zdHlsZXMpO1xuICAgICAgbGV0IG9mZnNldDogbnVtYmVyID0gMDtcbiAgICAgIGlmIChvZmZzZXRWYWwgIT0gbnVsbCkge1xuICAgICAgICB0b3RhbEtleWZyYW1lc1dpdGhPZmZzZXRzKys7XG4gICAgICAgIG9mZnNldCA9IHN0eWxlLm9mZnNldCA9IG9mZnNldFZhbDtcbiAgICAgIH1cbiAgICAgIGtleWZyYW1lc091dE9mUmFuZ2UgPSBrZXlmcmFtZXNPdXRPZlJhbmdlIHx8IG9mZnNldCA8IDAgfHwgb2Zmc2V0ID4gMTtcbiAgICAgIG9mZnNldHNPdXRPZk9yZGVyID0gb2Zmc2V0c091dE9mT3JkZXIgfHwgb2Zmc2V0IDwgcHJldmlvdXNPZmZzZXQ7XG4gICAgICBwcmV2aW91c09mZnNldCA9IG9mZnNldDtcbiAgICAgIG9mZnNldHMucHVzaChvZmZzZXQpO1xuICAgICAgcmV0dXJuIHN0eWxlO1xuICAgIH0pO1xuXG4gICAgaWYgKGtleWZyYW1lc091dE9mUmFuZ2UpIHtcbiAgICAgIGNvbnRleHQuZXJyb3JzLnB1c2goYFBsZWFzZSBlbnN1cmUgdGhhdCBhbGwga2V5ZnJhbWUgb2Zmc2V0cyBhcmUgYmV0d2VlbiAwIGFuZCAxYCk7XG4gICAgfVxuXG4gICAgaWYgKG9mZnNldHNPdXRPZk9yZGVyKSB7XG4gICAgICBjb250ZXh0LmVycm9ycy5wdXNoKGBQbGVhc2UgZW5zdXJlIHRoYXQgYWxsIGtleWZyYW1lIG9mZnNldHMgYXJlIGluIG9yZGVyYCk7XG4gICAgfVxuXG4gICAgY29uc3QgbGVuZ3RoID0gbWV0YWRhdGEuc3RlcHMubGVuZ3RoO1xuICAgIGxldCBnZW5lcmF0ZWRPZmZzZXQgPSAwO1xuICAgIGlmICh0b3RhbEtleWZyYW1lc1dpdGhPZmZzZXRzID4gMCAmJiB0b3RhbEtleWZyYW1lc1dpdGhPZmZzZXRzIDwgbGVuZ3RoKSB7XG4gICAgICBjb250ZXh0LmVycm9ycy5wdXNoKGBOb3QgYWxsIHN0eWxlKCkgc3RlcHMgd2l0aGluIHRoZSBkZWNsYXJlZCBrZXlmcmFtZXMoKSBjb250YWluIG9mZnNldHNgKTtcbiAgICB9IGVsc2UgaWYgKHRvdGFsS2V5ZnJhbWVzV2l0aE9mZnNldHMgPT0gMCkge1xuICAgICAgZ2VuZXJhdGVkT2Zmc2V0ID0gTUFYX0tFWUZSQU1FX09GRlNFVCAvIChsZW5ndGggLSAxKTtcbiAgICB9XG5cbiAgICBjb25zdCBsaW1pdCA9IGxlbmd0aCAtIDE7XG4gICAgY29uc3QgY3VycmVudFRpbWUgPSBjb250ZXh0LmN1cnJlbnRUaW1lO1xuICAgIGNvbnN0IGN1cnJlbnRBbmltYXRlVGltaW5ncyA9IGNvbnRleHQuY3VycmVudEFuaW1hdGVUaW1pbmdzICE7XG4gICAgY29uc3QgYW5pbWF0ZUR1cmF0aW9uID0gY3VycmVudEFuaW1hdGVUaW1pbmdzLmR1cmF0aW9uO1xuICAgIGtleWZyYW1lcy5mb3JFYWNoKChrZiwgaSkgPT4ge1xuICAgICAgY29uc3Qgb2Zmc2V0ID0gZ2VuZXJhdGVkT2Zmc2V0ID4gMCA/IChpID09IGxpbWl0ID8gMSA6IChnZW5lcmF0ZWRPZmZzZXQgKiBpKSkgOiBvZmZzZXRzW2ldO1xuICAgICAgY29uc3QgZHVyYXRpb25VcFRvVGhpc0ZyYW1lID0gb2Zmc2V0ICogYW5pbWF0ZUR1cmF0aW9uO1xuICAgICAgY29udGV4dC5jdXJyZW50VGltZSA9IGN1cnJlbnRUaW1lICsgY3VycmVudEFuaW1hdGVUaW1pbmdzLmRlbGF5ICsgZHVyYXRpb25VcFRvVGhpc0ZyYW1lO1xuICAgICAgY3VycmVudEFuaW1hdGVUaW1pbmdzLmR1cmF0aW9uID0gZHVyYXRpb25VcFRvVGhpc0ZyYW1lO1xuICAgICAgdGhpcy5fdmFsaWRhdGVTdHlsZUFzdChrZiwgY29udGV4dCk7XG4gICAgICBrZi5vZmZzZXQgPSBvZmZzZXQ7XG5cbiAgICAgIGFzdC5zdHlsZXMucHVzaChrZik7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gYXN0O1xuICB9XG5cbiAgdmlzaXRSZWZlcmVuY2UobWV0YWRhdGE6IEFuaW1hdGlvblJlZmVyZW5jZU1ldGFkYXRhLCBjb250ZXh0OiBBbmltYXRpb25Bc3RCdWlsZGVyQ29udGV4dCk6XG4gICAgICBSZWZlcmVuY2VBc3Qge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiBBbmltYXRpb25NZXRhZGF0YVR5cGUuUmVmZXJlbmNlLFxuICAgICAgYW5pbWF0aW9uOiB2aXNpdERzbE5vZGUodGhpcywgbm9ybWFsaXplQW5pbWF0aW9uRW50cnkobWV0YWRhdGEuYW5pbWF0aW9uKSwgY29udGV4dCksXG4gICAgICBvcHRpb25zOiBub3JtYWxpemVBbmltYXRpb25PcHRpb25zKG1ldGFkYXRhLm9wdGlvbnMpXG4gICAgfTtcbiAgfVxuXG4gIHZpc2l0QW5pbWF0ZUNoaWxkKG1ldGFkYXRhOiBBbmltYXRpb25BbmltYXRlQ2hpbGRNZXRhZGF0YSwgY29udGV4dDogQW5pbWF0aW9uQXN0QnVpbGRlckNvbnRleHQpOlxuICAgICAgQW5pbWF0ZUNoaWxkQXN0IHtcbiAgICBjb250ZXh0LmRlcENvdW50Kys7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IEFuaW1hdGlvbk1ldGFkYXRhVHlwZS5BbmltYXRlQ2hpbGQsXG4gICAgICBvcHRpb25zOiBub3JtYWxpemVBbmltYXRpb25PcHRpb25zKG1ldGFkYXRhLm9wdGlvbnMpXG4gICAgfTtcbiAgfVxuXG4gIHZpc2l0QW5pbWF0ZVJlZihtZXRhZGF0YTogQW5pbWF0aW9uQW5pbWF0ZVJlZk1ldGFkYXRhLCBjb250ZXh0OiBBbmltYXRpb25Bc3RCdWlsZGVyQ29udGV4dCk6XG4gICAgICBBbmltYXRlUmVmQXN0IHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogQW5pbWF0aW9uTWV0YWRhdGFUeXBlLkFuaW1hdGVSZWYsXG4gICAgICBhbmltYXRpb246IHRoaXMudmlzaXRSZWZlcmVuY2UobWV0YWRhdGEuYW5pbWF0aW9uLCBjb250ZXh0KSxcbiAgICAgIG9wdGlvbnM6IG5vcm1hbGl6ZUFuaW1hdGlvbk9wdGlvbnMobWV0YWRhdGEub3B0aW9ucylcbiAgICB9O1xuICB9XG5cbiAgdmlzaXRRdWVyeShtZXRhZGF0YTogQW5pbWF0aW9uUXVlcnlNZXRhZGF0YSwgY29udGV4dDogQW5pbWF0aW9uQXN0QnVpbGRlckNvbnRleHQpOiBRdWVyeUFzdCB7XG4gICAgY29uc3QgcGFyZW50U2VsZWN0b3IgPSBjb250ZXh0LmN1cnJlbnRRdWVyeVNlbGVjdG9yICE7XG4gICAgY29uc3Qgb3B0aW9ucyA9IChtZXRhZGF0YS5vcHRpb25zIHx8IHt9KSBhcyBBbmltYXRpb25RdWVyeU9wdGlvbnM7XG5cbiAgICBjb250ZXh0LnF1ZXJ5Q291bnQrKztcbiAgICBjb250ZXh0LmN1cnJlbnRRdWVyeSA9IG1ldGFkYXRhO1xuICAgIGNvbnN0IFtzZWxlY3RvciwgaW5jbHVkZVNlbGZdID0gbm9ybWFsaXplU2VsZWN0b3IobWV0YWRhdGEuc2VsZWN0b3IpO1xuICAgIGNvbnRleHQuY3VycmVudFF1ZXJ5U2VsZWN0b3IgPVxuICAgICAgICBwYXJlbnRTZWxlY3Rvci5sZW5ndGggPyAocGFyZW50U2VsZWN0b3IgKyAnICcgKyBzZWxlY3RvcikgOiBzZWxlY3RvcjtcbiAgICBnZXRPclNldEFzSW5NYXAoY29udGV4dC5jb2xsZWN0ZWRTdHlsZXMsIGNvbnRleHQuY3VycmVudFF1ZXJ5U2VsZWN0b3IsIHt9KTtcblxuICAgIGNvbnN0IGFuaW1hdGlvbiA9IHZpc2l0RHNsTm9kZSh0aGlzLCBub3JtYWxpemVBbmltYXRpb25FbnRyeShtZXRhZGF0YS5hbmltYXRpb24pLCBjb250ZXh0KTtcbiAgICBjb250ZXh0LmN1cnJlbnRRdWVyeSA9IG51bGw7XG4gICAgY29udGV4dC5jdXJyZW50UXVlcnlTZWxlY3RvciA9IHBhcmVudFNlbGVjdG9yO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IEFuaW1hdGlvbk1ldGFkYXRhVHlwZS5RdWVyeSxcbiAgICAgIHNlbGVjdG9yLFxuICAgICAgbGltaXQ6IG9wdGlvbnMubGltaXQgfHwgMCxcbiAgICAgIG9wdGlvbmFsOiAhIW9wdGlvbnMub3B0aW9uYWwsIGluY2x1ZGVTZWxmLCBhbmltYXRpb24sXG4gICAgICBvcmlnaW5hbFNlbGVjdG9yOiBtZXRhZGF0YS5zZWxlY3RvcixcbiAgICAgIG9wdGlvbnM6IG5vcm1hbGl6ZUFuaW1hdGlvbk9wdGlvbnMobWV0YWRhdGEub3B0aW9ucylcbiAgICB9O1xuICB9XG5cbiAgdmlzaXRTdGFnZ2VyKG1ldGFkYXRhOiBBbmltYXRpb25TdGFnZ2VyTWV0YWRhdGEsIGNvbnRleHQ6IEFuaW1hdGlvbkFzdEJ1aWxkZXJDb250ZXh0KTpcbiAgICAgIFN0YWdnZXJBc3Qge1xuICAgIGlmICghY29udGV4dC5jdXJyZW50UXVlcnkpIHtcbiAgICAgIGNvbnRleHQuZXJyb3JzLnB1c2goYHN0YWdnZXIoKSBjYW4gb25seSBiZSB1c2VkIGluc2lkZSBvZiBxdWVyeSgpYCk7XG4gICAgfVxuICAgIGNvbnN0IHRpbWluZ3MgPSBtZXRhZGF0YS50aW1pbmdzID09PSAnZnVsbCcgP1xuICAgICAgICB7ZHVyYXRpb246IDAsIGRlbGF5OiAwLCBlYXNpbmc6ICdmdWxsJ30gOlxuICAgICAgICByZXNvbHZlVGltaW5nKG1ldGFkYXRhLnRpbWluZ3MsIGNvbnRleHQuZXJyb3JzLCB0cnVlKTtcblxuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiBBbmltYXRpb25NZXRhZGF0YVR5cGUuU3RhZ2dlcixcbiAgICAgIGFuaW1hdGlvbjogdmlzaXREc2xOb2RlKHRoaXMsIG5vcm1hbGl6ZUFuaW1hdGlvbkVudHJ5KG1ldGFkYXRhLmFuaW1hdGlvbiksIGNvbnRleHQpLCB0aW1pbmdzLFxuICAgICAgb3B0aW9uczogbnVsbFxuICAgIH07XG4gIH1cbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplU2VsZWN0b3Ioc2VsZWN0b3I6IHN0cmluZyk6IFtzdHJpbmcsIGJvb2xlYW5dIHtcbiAgY29uc3QgaGFzQW1wZXJzYW5kID0gc2VsZWN0b3Iuc3BsaXQoL1xccyosXFxzKi8pLmZpbmQodG9rZW4gPT4gdG9rZW4gPT0gU0VMRl9UT0tFTikgPyB0cnVlIDogZmFsc2U7XG4gIGlmIChoYXNBbXBlcnNhbmQpIHtcbiAgICBzZWxlY3RvciA9IHNlbGVjdG9yLnJlcGxhY2UoU0VMRl9UT0tFTl9SRUdFWCwgJycpO1xuICB9XG5cbiAgLy8gdGhlIDplbnRlciBhbmQgOmxlYXZlIHNlbGVjdG9ycyBhcmUgZmlsbGVkIGluIGF0IHJ1bnRpbWUgZHVyaW5nIHRpbWVsaW5lIGJ1aWxkaW5nXG4gIHNlbGVjdG9yID0gc2VsZWN0b3IucmVwbGFjZSgvQFxcKi9nLCBOR19UUklHR0VSX1NFTEVDVE9SKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvQFxcdysvZywgbWF0Y2ggPT4gTkdfVFJJR0dFUl9TRUxFQ1RPUiArICctJyArIG1hdGNoLnN1YnN0cigxKSlcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLzphbmltYXRpbmcvZywgTkdfQU5JTUFUSU5HX1NFTEVDVE9SKTtcblxuICByZXR1cm4gW3NlbGVjdG9yLCBoYXNBbXBlcnNhbmRdO1xufVxuXG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVBhcmFtcyhvYmo6IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgYW55KToge1trZXk6IHN0cmluZ106IGFueX18bnVsbCB7XG4gIHJldHVybiBvYmogPyBjb3B5T2JqKG9iaikgOiBudWxsO1xufVxuXG5leHBvcnQgdHlwZSBTdHlsZVRpbWVUdXBsZSA9IHtcbiAgc3RhcnRUaW1lOiBudW1iZXI7IGVuZFRpbWU6IG51bWJlcjtcbn07XG5cbmV4cG9ydCBjbGFzcyBBbmltYXRpb25Bc3RCdWlsZGVyQ29udGV4dCB7XG4gIHB1YmxpYyBxdWVyeUNvdW50OiBudW1iZXIgPSAwO1xuICBwdWJsaWMgZGVwQ291bnQ6IG51bWJlciA9IDA7XG4gIHB1YmxpYyBjdXJyZW50VHJhbnNpdGlvbjogQW5pbWF0aW9uVHJhbnNpdGlvbk1ldGFkYXRhfG51bGwgPSBudWxsO1xuICBwdWJsaWMgY3VycmVudFF1ZXJ5OiBBbmltYXRpb25RdWVyeU1ldGFkYXRhfG51bGwgPSBudWxsO1xuICBwdWJsaWMgY3VycmVudFF1ZXJ5U2VsZWN0b3I6IHN0cmluZ3xudWxsID0gbnVsbDtcbiAgcHVibGljIGN1cnJlbnRBbmltYXRlVGltaW5nczogVGltaW5nQXN0fG51bGwgPSBudWxsO1xuICBwdWJsaWMgY3VycmVudFRpbWU6IG51bWJlciA9IDA7XG4gIHB1YmxpYyBjb2xsZWN0ZWRTdHlsZXM6IHtbc2VsZWN0b3JOYW1lOiBzdHJpbmddOiB7W3Byb3BOYW1lOiBzdHJpbmddOiBTdHlsZVRpbWVUdXBsZX19ID0ge307XG4gIHB1YmxpYyBvcHRpb25zOiBBbmltYXRpb25PcHRpb25zfG51bGwgPSBudWxsO1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgZXJyb3JzOiBhbnlbXSkge31cbn1cblxuZnVuY3Rpb24gY29uc3VtZU9mZnNldChzdHlsZXM6IMm1U3R5bGVEYXRhIHwgc3RyaW5nIHwgKMm1U3R5bGVEYXRhIHwgc3RyaW5nKVtdKTogbnVtYmVyfG51bGwge1xuICBpZiAodHlwZW9mIHN0eWxlcyA9PSAnc3RyaW5nJykgcmV0dXJuIG51bGw7XG5cbiAgbGV0IG9mZnNldDogbnVtYmVyfG51bGwgPSBudWxsO1xuXG4gIGlmIChBcnJheS5pc0FycmF5KHN0eWxlcykpIHtcbiAgICBzdHlsZXMuZm9yRWFjaChzdHlsZVR1cGxlID0+IHtcbiAgICAgIGlmIChpc09iamVjdChzdHlsZVR1cGxlKSAmJiBzdHlsZVR1cGxlLmhhc093blByb3BlcnR5KCdvZmZzZXQnKSkge1xuICAgICAgICBjb25zdCBvYmogPSBzdHlsZVR1cGxlIGFzIMm1U3R5bGVEYXRhO1xuICAgICAgICBvZmZzZXQgPSBwYXJzZUZsb2F0KG9ialsnb2Zmc2V0J10gYXMgc3RyaW5nKTtcbiAgICAgICAgZGVsZXRlIG9ialsnb2Zmc2V0J107XG4gICAgICB9XG4gICAgfSk7XG4gIH0gZWxzZSBpZiAoaXNPYmplY3Qoc3R5bGVzKSAmJiBzdHlsZXMuaGFzT3duUHJvcGVydHkoJ29mZnNldCcpKSB7XG4gICAgY29uc3Qgb2JqID0gc3R5bGVzIGFzIMm1U3R5bGVEYXRhO1xuICAgIG9mZnNldCA9IHBhcnNlRmxvYXQob2JqWydvZmZzZXQnXSBhcyBzdHJpbmcpO1xuICAgIGRlbGV0ZSBvYmpbJ29mZnNldCddO1xuICB9XG4gIHJldHVybiBvZmZzZXQ7XG59XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KHZhbHVlOiBhbnkpOiBib29sZWFuIHtcbiAgcmV0dXJuICFBcnJheS5pc0FycmF5KHZhbHVlKSAmJiB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCc7XG59XG5cbmZ1bmN0aW9uIGNvbnN0cnVjdFRpbWluZ0FzdCh2YWx1ZTogc3RyaW5nIHwgbnVtYmVyIHwgQW5pbWF0ZVRpbWluZ3MsIGVycm9yczogYW55W10pIHtcbiAgbGV0IHRpbWluZ3M6IEFuaW1hdGVUaW1pbmdzfG51bGwgPSBudWxsO1xuICBpZiAodmFsdWUuaGFzT3duUHJvcGVydHkoJ2R1cmF0aW9uJykpIHtcbiAgICB0aW1pbmdzID0gdmFsdWUgYXMgQW5pbWF0ZVRpbWluZ3M7XG4gIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlID09ICdudW1iZXInKSB7XG4gICAgY29uc3QgZHVyYXRpb24gPSByZXNvbHZlVGltaW5nKHZhbHVlIGFzIG51bWJlciwgZXJyb3JzKS5kdXJhdGlvbjtcbiAgICByZXR1cm4gbWFrZVRpbWluZ0FzdChkdXJhdGlvbiBhcyBudW1iZXIsIDAsICcnKTtcbiAgfVxuXG4gIGNvbnN0IHN0clZhbHVlID0gdmFsdWUgYXMgc3RyaW5nO1xuICBjb25zdCBpc0R5bmFtaWMgPSBzdHJWYWx1ZS5zcGxpdCgvXFxzKy8pLnNvbWUodiA9PiB2LmNoYXJBdCgwKSA9PSAneycgJiYgdi5jaGFyQXQoMSkgPT0gJ3snKTtcbiAgaWYgKGlzRHluYW1pYykge1xuICAgIGNvbnN0IGFzdCA9IG1ha2VUaW1pbmdBc3QoMCwgMCwgJycpIGFzIGFueTtcbiAgICBhc3QuZHluYW1pYyA9IHRydWU7XG4gICAgYXN0LnN0clZhbHVlID0gc3RyVmFsdWU7XG4gICAgcmV0dXJuIGFzdCBhcyBEeW5hbWljVGltaW5nQXN0O1xuICB9XG5cbiAgdGltaW5ncyA9IHRpbWluZ3MgfHwgcmVzb2x2ZVRpbWluZyhzdHJWYWx1ZSwgZXJyb3JzKTtcbiAgcmV0dXJuIG1ha2VUaW1pbmdBc3QodGltaW5ncy5kdXJhdGlvbiwgdGltaW5ncy5kZWxheSwgdGltaW5ncy5lYXNpbmcpO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVBbmltYXRpb25PcHRpb25zKG9wdGlvbnM6IEFuaW1hdGlvbk9wdGlvbnMgfCBudWxsKTogQW5pbWF0aW9uT3B0aW9ucyB7XG4gIGlmIChvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IGNvcHlPYmoob3B0aW9ucyk7XG4gICAgaWYgKG9wdGlvbnNbJ3BhcmFtcyddKSB7XG4gICAgICBvcHRpb25zWydwYXJhbXMnXSA9IG5vcm1hbGl6ZVBhcmFtcyhvcHRpb25zWydwYXJhbXMnXSkgITtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgb3B0aW9ucyA9IHt9O1xuICB9XG4gIHJldHVybiBvcHRpb25zO1xufVxuXG5mdW5jdGlvbiBtYWtlVGltaW5nQXN0KGR1cmF0aW9uOiBudW1iZXIsIGRlbGF5OiBudW1iZXIsIGVhc2luZzogc3RyaW5nIHwgbnVsbCk6IFRpbWluZ0FzdCB7XG4gIHJldHVybiB7ZHVyYXRpb24sIGRlbGF5LCBlYXNpbmd9O1xufVxuIl19
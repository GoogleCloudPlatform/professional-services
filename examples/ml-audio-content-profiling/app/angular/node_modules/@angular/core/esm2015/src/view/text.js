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
import { asTextData } from './types';
import { checkAndUpdateBinding, getParentRenderElement } from './util';
/**
 * @param {?} checkIndex
 * @param {?} ngContentIndex
 * @param {?} staticText
 * @return {?}
 */
export function textDef(checkIndex, ngContentIndex, staticText) {
    /** @type {?} */
    const bindings = new Array(staticText.length - 1);
    for (let i = 1; i < staticText.length; i++) {
        bindings[i - 1] = {
            flags: 8 /* TypeProperty */,
            name: null,
            ns: null,
            nonMinifiedName: null,
            securityContext: null,
            suffix: staticText[i],
        };
    }
    return {
        // will bet set by the view definition
        nodeIndex: -1,
        parent: null,
        renderParent: null,
        bindingIndex: -1,
        outputIndex: -1,
        // regular values
        checkIndex,
        flags: 2 /* TypeText */,
        childFlags: 0,
        directChildFlags: 0,
        childMatchedQueries: 0,
        matchedQueries: {},
        matchedQueryIds: 0,
        references: {}, ngContentIndex,
        childCount: 0, bindings,
        bindingFlags: 8 /* TypeProperty */,
        outputs: [],
        element: null,
        provider: null,
        text: { prefix: staticText[0] },
        query: null,
        ngContent: null,
    };
}
/**
 * @param {?} view
 * @param {?} renderHost
 * @param {?} def
 * @return {?}
 */
export function createText(view, renderHost, def) {
    /** @type {?} */
    let renderNode;
    /** @type {?} */
    const renderer = view.renderer;
    renderNode = renderer.createText(/** @type {?} */ ((def.text)).prefix);
    /** @type {?} */
    const parentEl = getParentRenderElement(view, renderHost, def);
    if (parentEl) {
        renderer.appendChild(parentEl, renderNode);
    }
    return { renderText: renderNode };
}
/**
 * @param {?} view
 * @param {?} def
 * @param {?} v0
 * @param {?} v1
 * @param {?} v2
 * @param {?} v3
 * @param {?} v4
 * @param {?} v5
 * @param {?} v6
 * @param {?} v7
 * @param {?} v8
 * @param {?} v9
 * @return {?}
 */
export function checkAndUpdateTextInline(view, def, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9) {
    /** @type {?} */
    let changed = false;
    /** @type {?} */
    const bindings = def.bindings;
    /** @type {?} */
    const bindLen = bindings.length;
    if (bindLen > 0 && checkAndUpdateBinding(view, def, 0, v0))
        changed = true;
    if (bindLen > 1 && checkAndUpdateBinding(view, def, 1, v1))
        changed = true;
    if (bindLen > 2 && checkAndUpdateBinding(view, def, 2, v2))
        changed = true;
    if (bindLen > 3 && checkAndUpdateBinding(view, def, 3, v3))
        changed = true;
    if (bindLen > 4 && checkAndUpdateBinding(view, def, 4, v4))
        changed = true;
    if (bindLen > 5 && checkAndUpdateBinding(view, def, 5, v5))
        changed = true;
    if (bindLen > 6 && checkAndUpdateBinding(view, def, 6, v6))
        changed = true;
    if (bindLen > 7 && checkAndUpdateBinding(view, def, 7, v7))
        changed = true;
    if (bindLen > 8 && checkAndUpdateBinding(view, def, 8, v8))
        changed = true;
    if (bindLen > 9 && checkAndUpdateBinding(view, def, 9, v9))
        changed = true;
    if (changed) {
        /** @type {?} */
        let value = /** @type {?} */ ((def.text)).prefix;
        if (bindLen > 0)
            value += _addInterpolationPart(v0, bindings[0]);
        if (bindLen > 1)
            value += _addInterpolationPart(v1, bindings[1]);
        if (bindLen > 2)
            value += _addInterpolationPart(v2, bindings[2]);
        if (bindLen > 3)
            value += _addInterpolationPart(v3, bindings[3]);
        if (bindLen > 4)
            value += _addInterpolationPart(v4, bindings[4]);
        if (bindLen > 5)
            value += _addInterpolationPart(v5, bindings[5]);
        if (bindLen > 6)
            value += _addInterpolationPart(v6, bindings[6]);
        if (bindLen > 7)
            value += _addInterpolationPart(v7, bindings[7]);
        if (bindLen > 8)
            value += _addInterpolationPart(v8, bindings[8]);
        if (bindLen > 9)
            value += _addInterpolationPart(v9, bindings[9]);
        /** @type {?} */
        const renderNode = asTextData(view, def.nodeIndex).renderText;
        view.renderer.setValue(renderNode, value);
    }
    return changed;
}
/**
 * @param {?} view
 * @param {?} def
 * @param {?} values
 * @return {?}
 */
export function checkAndUpdateTextDynamic(view, def, values) {
    /** @type {?} */
    const bindings = def.bindings;
    /** @type {?} */
    let changed = false;
    for (let i = 0; i < values.length; i++) {
        // Note: We need to loop over all values, so that
        // the old values are updates as well!
        if (checkAndUpdateBinding(view, def, i, values[i])) {
            changed = true;
        }
    }
    if (changed) {
        /** @type {?} */
        let value = '';
        for (let i = 0; i < values.length; i++) {
            value = value + _addInterpolationPart(values[i], bindings[i]);
        }
        value = /** @type {?} */ ((def.text)).prefix + value;
        /** @type {?} */
        const renderNode = asTextData(view, def.nodeIndex).renderText;
        view.renderer.setValue(renderNode, value);
    }
    return changed;
}
/**
 * @param {?} value
 * @param {?} binding
 * @return {?}
 */
function _addInterpolationPart(value, binding) {
    /** @type {?} */
    const valueStr = value != null ? value.toString() : '';
    return valueStr + binding.suffix;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3ZpZXcvdGV4dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBbUUsVUFBVSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQ3JHLE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxzQkFBc0IsRUFBQyxNQUFNLFFBQVEsQ0FBQzs7Ozs7OztBQUVyRSxNQUFNLFVBQVUsT0FBTyxDQUNuQixVQUFrQixFQUFFLGNBQTZCLEVBQUUsVUFBb0I7O0lBQ3pFLE1BQU0sUUFBUSxHQUFpQixJQUFJLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ2hFLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQzFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUc7WUFDaEIsS0FBSyxzQkFBMkI7WUFDaEMsSUFBSSxFQUFFLElBQUk7WUFDVixFQUFFLEVBQUUsSUFBSTtZQUNSLGVBQWUsRUFBRSxJQUFJO1lBQ3JCLGVBQWUsRUFBRSxJQUFJO1lBQ3JCLE1BQU0sRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO1NBQ3RCLENBQUM7S0FDSDtJQUVELE9BQU87O1FBRUwsU0FBUyxFQUFFLENBQUMsQ0FBQztRQUNiLE1BQU0sRUFBRSxJQUFJO1FBQ1osWUFBWSxFQUFFLElBQUk7UUFDbEIsWUFBWSxFQUFFLENBQUMsQ0FBQztRQUNoQixXQUFXLEVBQUUsQ0FBQyxDQUFDOztRQUVmLFVBQVU7UUFDVixLQUFLLGtCQUFvQjtRQUN6QixVQUFVLEVBQUUsQ0FBQztRQUNiLGdCQUFnQixFQUFFLENBQUM7UUFDbkIsbUJBQW1CLEVBQUUsQ0FBQztRQUN0QixjQUFjLEVBQUUsRUFBRTtRQUNsQixlQUFlLEVBQUUsQ0FBQztRQUNsQixVQUFVLEVBQUUsRUFBRSxFQUFFLGNBQWM7UUFDOUIsVUFBVSxFQUFFLENBQUMsRUFBRSxRQUFRO1FBQ3ZCLFlBQVksc0JBQTJCO1FBQ3ZDLE9BQU8sRUFBRSxFQUFFO1FBQ1gsT0FBTyxFQUFFLElBQUk7UUFDYixRQUFRLEVBQUUsSUFBSTtRQUNkLElBQUksRUFBRSxFQUFDLE1BQU0sRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUM7UUFDN0IsS0FBSyxFQUFFLElBQUk7UUFDWCxTQUFTLEVBQUUsSUFBSTtLQUNoQixDQUFDO0NBQ0g7Ozs7Ozs7QUFFRCxNQUFNLFVBQVUsVUFBVSxDQUFDLElBQWMsRUFBRSxVQUFlLEVBQUUsR0FBWTs7SUFDdEUsSUFBSSxVQUFVLENBQU07O0lBQ3BCLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7SUFDL0IsVUFBVSxHQUFHLFFBQVEsQ0FBQyxVQUFVLG9CQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLENBQUM7O0lBQ3BELE1BQU0sUUFBUSxHQUFHLHNCQUFzQixDQUFDLElBQUksRUFBRSxVQUFVLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDL0QsSUFBSSxRQUFRLEVBQUU7UUFDWixRQUFRLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQztLQUM1QztJQUNELE9BQU8sRUFBQyxVQUFVLEVBQUUsVUFBVSxFQUFDLENBQUM7Q0FDakM7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFRCxNQUFNLFVBQVUsd0JBQXdCLENBQ3BDLElBQWMsRUFBRSxHQUFZLEVBQUUsRUFBTyxFQUFFLEVBQU8sRUFBRSxFQUFPLEVBQUUsRUFBTyxFQUFFLEVBQU8sRUFBRSxFQUFPLEVBQUUsRUFBTyxFQUMzRixFQUFPLEVBQUUsRUFBTyxFQUFFLEVBQU87O0lBQzNCLElBQUksT0FBTyxHQUFHLEtBQUssQ0FBQzs7SUFDcEIsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQzs7SUFDOUIsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQztJQUNoQyxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUkscUJBQXFCLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQUUsT0FBTyxHQUFHLElBQUksQ0FBQztJQUMzRSxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUkscUJBQXFCLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQUUsT0FBTyxHQUFHLElBQUksQ0FBQztJQUMzRSxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUkscUJBQXFCLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQUUsT0FBTyxHQUFHLElBQUksQ0FBQztJQUMzRSxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUkscUJBQXFCLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQUUsT0FBTyxHQUFHLElBQUksQ0FBQztJQUMzRSxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUkscUJBQXFCLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQUUsT0FBTyxHQUFHLElBQUksQ0FBQztJQUMzRSxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUkscUJBQXFCLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQUUsT0FBTyxHQUFHLElBQUksQ0FBQztJQUMzRSxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUkscUJBQXFCLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQUUsT0FBTyxHQUFHLElBQUksQ0FBQztJQUMzRSxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUkscUJBQXFCLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQUUsT0FBTyxHQUFHLElBQUksQ0FBQztJQUMzRSxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUkscUJBQXFCLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQUUsT0FBTyxHQUFHLElBQUksQ0FBQztJQUMzRSxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUkscUJBQXFCLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQUUsT0FBTyxHQUFHLElBQUksQ0FBQztJQUUzRSxJQUFJLE9BQU8sRUFBRTs7UUFDWCxJQUFJLEtBQUssc0JBQUcsR0FBRyxDQUFDLElBQUksR0FBRyxNQUFNLENBQUM7UUFDOUIsSUFBSSxPQUFPLEdBQUcsQ0FBQztZQUFFLEtBQUssSUFBSSxxQkFBcUIsQ0FBQyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakUsSUFBSSxPQUFPLEdBQUcsQ0FBQztZQUFFLEtBQUssSUFBSSxxQkFBcUIsQ0FBQyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakUsSUFBSSxPQUFPLEdBQUcsQ0FBQztZQUFFLEtBQUssSUFBSSxxQkFBcUIsQ0FBQyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakUsSUFBSSxPQUFPLEdBQUcsQ0FBQztZQUFFLEtBQUssSUFBSSxxQkFBcUIsQ0FBQyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakUsSUFBSSxPQUFPLEdBQUcsQ0FBQztZQUFFLEtBQUssSUFBSSxxQkFBcUIsQ0FBQyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakUsSUFBSSxPQUFPLEdBQUcsQ0FBQztZQUFFLEtBQUssSUFBSSxxQkFBcUIsQ0FBQyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakUsSUFBSSxPQUFPLEdBQUcsQ0FBQztZQUFFLEtBQUssSUFBSSxxQkFBcUIsQ0FBQyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakUsSUFBSSxPQUFPLEdBQUcsQ0FBQztZQUFFLEtBQUssSUFBSSxxQkFBcUIsQ0FBQyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakUsSUFBSSxPQUFPLEdBQUcsQ0FBQztZQUFFLEtBQUssSUFBSSxxQkFBcUIsQ0FBQyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakUsSUFBSSxPQUFPLEdBQUcsQ0FBQztZQUFFLEtBQUssSUFBSSxxQkFBcUIsQ0FBQyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7O1FBQ2pFLE1BQU0sVUFBVSxHQUFHLFVBQVUsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLFVBQVUsQ0FBQztRQUM5RCxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDM0M7SUFDRCxPQUFPLE9BQU8sQ0FBQztDQUNoQjs7Ozs7OztBQUVELE1BQU0sVUFBVSx5QkFBeUIsQ0FBQyxJQUFjLEVBQUUsR0FBWSxFQUFFLE1BQWE7O0lBQ25GLE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUM7O0lBQzlCLElBQUksT0FBTyxHQUFHLEtBQUssQ0FBQztJQUNwQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTs7O1FBR3RDLElBQUkscUJBQXFCLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDbEQsT0FBTyxHQUFHLElBQUksQ0FBQztTQUNoQjtLQUNGO0lBQ0QsSUFBSSxPQUFPLEVBQUU7O1FBQ1gsSUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDO1FBQ2YsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDdEMsS0FBSyxHQUFHLEtBQUssR0FBRyxxQkFBcUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDL0Q7UUFDRCxLQUFLLHNCQUFHLEdBQUcsQ0FBQyxJQUFJLEdBQUcsTUFBTSxHQUFHLEtBQUssQ0FBQzs7UUFDbEMsTUFBTSxVQUFVLEdBQUcsVUFBVSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsVUFBVSxDQUFDO1FBQzlELElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsQ0FBQztLQUMzQztJQUNELE9BQU8sT0FBTyxDQUFDO0NBQ2hCOzs7Ozs7QUFFRCxTQUFTLHFCQUFxQixDQUFDLEtBQVUsRUFBRSxPQUFtQjs7SUFDNUQsTUFBTSxRQUFRLEdBQUcsS0FBSyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7SUFDdkQsT0FBTyxRQUFRLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztDQUNsQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtCaW5kaW5nRGVmLCBCaW5kaW5nRmxhZ3MsIE5vZGVEZWYsIE5vZGVGbGFncywgVGV4dERhdGEsIFZpZXdEYXRhLCBhc1RleHREYXRhfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7Y2hlY2tBbmRVcGRhdGVCaW5kaW5nLCBnZXRQYXJlbnRSZW5kZXJFbGVtZW50fSBmcm9tICcuL3V0aWwnO1xuXG5leHBvcnQgZnVuY3Rpb24gdGV4dERlZihcbiAgICBjaGVja0luZGV4OiBudW1iZXIsIG5nQ29udGVudEluZGV4OiBudW1iZXIgfCBudWxsLCBzdGF0aWNUZXh0OiBzdHJpbmdbXSk6IE5vZGVEZWYge1xuICBjb25zdCBiaW5kaW5nczogQmluZGluZ0RlZltdID0gbmV3IEFycmF5KHN0YXRpY1RleHQubGVuZ3RoIC0gMSk7XG4gIGZvciAobGV0IGkgPSAxOyBpIDwgc3RhdGljVGV4dC5sZW5ndGg7IGkrKykge1xuICAgIGJpbmRpbmdzW2kgLSAxXSA9IHtcbiAgICAgIGZsYWdzOiBCaW5kaW5nRmxhZ3MuVHlwZVByb3BlcnR5LFxuICAgICAgbmFtZTogbnVsbCxcbiAgICAgIG5zOiBudWxsLFxuICAgICAgbm9uTWluaWZpZWROYW1lOiBudWxsLFxuICAgICAgc2VjdXJpdHlDb250ZXh0OiBudWxsLFxuICAgICAgc3VmZml4OiBzdGF0aWNUZXh0W2ldLFxuICAgIH07XG4gIH1cblxuICByZXR1cm4ge1xuICAgIC8vIHdpbGwgYmV0IHNldCBieSB0aGUgdmlldyBkZWZpbml0aW9uXG4gICAgbm9kZUluZGV4OiAtMSxcbiAgICBwYXJlbnQ6IG51bGwsXG4gICAgcmVuZGVyUGFyZW50OiBudWxsLFxuICAgIGJpbmRpbmdJbmRleDogLTEsXG4gICAgb3V0cHV0SW5kZXg6IC0xLFxuICAgIC8vIHJlZ3VsYXIgdmFsdWVzXG4gICAgY2hlY2tJbmRleCxcbiAgICBmbGFnczogTm9kZUZsYWdzLlR5cGVUZXh0LFxuICAgIGNoaWxkRmxhZ3M6IDAsXG4gICAgZGlyZWN0Q2hpbGRGbGFnczogMCxcbiAgICBjaGlsZE1hdGNoZWRRdWVyaWVzOiAwLFxuICAgIG1hdGNoZWRRdWVyaWVzOiB7fSxcbiAgICBtYXRjaGVkUXVlcnlJZHM6IDAsXG4gICAgcmVmZXJlbmNlczoge30sIG5nQ29udGVudEluZGV4LFxuICAgIGNoaWxkQ291bnQ6IDAsIGJpbmRpbmdzLFxuICAgIGJpbmRpbmdGbGFnczogQmluZGluZ0ZsYWdzLlR5cGVQcm9wZXJ0eSxcbiAgICBvdXRwdXRzOiBbXSxcbiAgICBlbGVtZW50OiBudWxsLFxuICAgIHByb3ZpZGVyOiBudWxsLFxuICAgIHRleHQ6IHtwcmVmaXg6IHN0YXRpY1RleHRbMF19LFxuICAgIHF1ZXJ5OiBudWxsLFxuICAgIG5nQ29udGVudDogbnVsbCxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRleHQodmlldzogVmlld0RhdGEsIHJlbmRlckhvc3Q6IGFueSwgZGVmOiBOb2RlRGVmKTogVGV4dERhdGEge1xuICBsZXQgcmVuZGVyTm9kZTogYW55O1xuICBjb25zdCByZW5kZXJlciA9IHZpZXcucmVuZGVyZXI7XG4gIHJlbmRlck5vZGUgPSByZW5kZXJlci5jcmVhdGVUZXh0KGRlZi50ZXh0ICEucHJlZml4KTtcbiAgY29uc3QgcGFyZW50RWwgPSBnZXRQYXJlbnRSZW5kZXJFbGVtZW50KHZpZXcsIHJlbmRlckhvc3QsIGRlZik7XG4gIGlmIChwYXJlbnRFbCkge1xuICAgIHJlbmRlcmVyLmFwcGVuZENoaWxkKHBhcmVudEVsLCByZW5kZXJOb2RlKTtcbiAgfVxuICByZXR1cm4ge3JlbmRlclRleHQ6IHJlbmRlck5vZGV9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tBbmRVcGRhdGVUZXh0SW5saW5lKFxuICAgIHZpZXc6IFZpZXdEYXRhLCBkZWY6IE5vZGVEZWYsIHYwOiBhbnksIHYxOiBhbnksIHYyOiBhbnksIHYzOiBhbnksIHY0OiBhbnksIHY1OiBhbnksIHY2OiBhbnksXG4gICAgdjc6IGFueSwgdjg6IGFueSwgdjk6IGFueSk6IGJvb2xlYW4ge1xuICBsZXQgY2hhbmdlZCA9IGZhbHNlO1xuICBjb25zdCBiaW5kaW5ncyA9IGRlZi5iaW5kaW5ncztcbiAgY29uc3QgYmluZExlbiA9IGJpbmRpbmdzLmxlbmd0aDtcbiAgaWYgKGJpbmRMZW4gPiAwICYmIGNoZWNrQW5kVXBkYXRlQmluZGluZyh2aWV3LCBkZWYsIDAsIHYwKSkgY2hhbmdlZCA9IHRydWU7XG4gIGlmIChiaW5kTGVuID4gMSAmJiBjaGVja0FuZFVwZGF0ZUJpbmRpbmcodmlldywgZGVmLCAxLCB2MSkpIGNoYW5nZWQgPSB0cnVlO1xuICBpZiAoYmluZExlbiA+IDIgJiYgY2hlY2tBbmRVcGRhdGVCaW5kaW5nKHZpZXcsIGRlZiwgMiwgdjIpKSBjaGFuZ2VkID0gdHJ1ZTtcbiAgaWYgKGJpbmRMZW4gPiAzICYmIGNoZWNrQW5kVXBkYXRlQmluZGluZyh2aWV3LCBkZWYsIDMsIHYzKSkgY2hhbmdlZCA9IHRydWU7XG4gIGlmIChiaW5kTGVuID4gNCAmJiBjaGVja0FuZFVwZGF0ZUJpbmRpbmcodmlldywgZGVmLCA0LCB2NCkpIGNoYW5nZWQgPSB0cnVlO1xuICBpZiAoYmluZExlbiA+IDUgJiYgY2hlY2tBbmRVcGRhdGVCaW5kaW5nKHZpZXcsIGRlZiwgNSwgdjUpKSBjaGFuZ2VkID0gdHJ1ZTtcbiAgaWYgKGJpbmRMZW4gPiA2ICYmIGNoZWNrQW5kVXBkYXRlQmluZGluZyh2aWV3LCBkZWYsIDYsIHY2KSkgY2hhbmdlZCA9IHRydWU7XG4gIGlmIChiaW5kTGVuID4gNyAmJiBjaGVja0FuZFVwZGF0ZUJpbmRpbmcodmlldywgZGVmLCA3LCB2NykpIGNoYW5nZWQgPSB0cnVlO1xuICBpZiAoYmluZExlbiA+IDggJiYgY2hlY2tBbmRVcGRhdGVCaW5kaW5nKHZpZXcsIGRlZiwgOCwgdjgpKSBjaGFuZ2VkID0gdHJ1ZTtcbiAgaWYgKGJpbmRMZW4gPiA5ICYmIGNoZWNrQW5kVXBkYXRlQmluZGluZyh2aWV3LCBkZWYsIDksIHY5KSkgY2hhbmdlZCA9IHRydWU7XG5cbiAgaWYgKGNoYW5nZWQpIHtcbiAgICBsZXQgdmFsdWUgPSBkZWYudGV4dCAhLnByZWZpeDtcbiAgICBpZiAoYmluZExlbiA+IDApIHZhbHVlICs9IF9hZGRJbnRlcnBvbGF0aW9uUGFydCh2MCwgYmluZGluZ3NbMF0pO1xuICAgIGlmIChiaW5kTGVuID4gMSkgdmFsdWUgKz0gX2FkZEludGVycG9sYXRpb25QYXJ0KHYxLCBiaW5kaW5nc1sxXSk7XG4gICAgaWYgKGJpbmRMZW4gPiAyKSB2YWx1ZSArPSBfYWRkSW50ZXJwb2xhdGlvblBhcnQodjIsIGJpbmRpbmdzWzJdKTtcbiAgICBpZiAoYmluZExlbiA+IDMpIHZhbHVlICs9IF9hZGRJbnRlcnBvbGF0aW9uUGFydCh2MywgYmluZGluZ3NbM10pO1xuICAgIGlmIChiaW5kTGVuID4gNCkgdmFsdWUgKz0gX2FkZEludGVycG9sYXRpb25QYXJ0KHY0LCBiaW5kaW5nc1s0XSk7XG4gICAgaWYgKGJpbmRMZW4gPiA1KSB2YWx1ZSArPSBfYWRkSW50ZXJwb2xhdGlvblBhcnQodjUsIGJpbmRpbmdzWzVdKTtcbiAgICBpZiAoYmluZExlbiA+IDYpIHZhbHVlICs9IF9hZGRJbnRlcnBvbGF0aW9uUGFydCh2NiwgYmluZGluZ3NbNl0pO1xuICAgIGlmIChiaW5kTGVuID4gNykgdmFsdWUgKz0gX2FkZEludGVycG9sYXRpb25QYXJ0KHY3LCBiaW5kaW5nc1s3XSk7XG4gICAgaWYgKGJpbmRMZW4gPiA4KSB2YWx1ZSArPSBfYWRkSW50ZXJwb2xhdGlvblBhcnQodjgsIGJpbmRpbmdzWzhdKTtcbiAgICBpZiAoYmluZExlbiA+IDkpIHZhbHVlICs9IF9hZGRJbnRlcnBvbGF0aW9uUGFydCh2OSwgYmluZGluZ3NbOV0pO1xuICAgIGNvbnN0IHJlbmRlck5vZGUgPSBhc1RleHREYXRhKHZpZXcsIGRlZi5ub2RlSW5kZXgpLnJlbmRlclRleHQ7XG4gICAgdmlldy5yZW5kZXJlci5zZXRWYWx1ZShyZW5kZXJOb2RlLCB2YWx1ZSk7XG4gIH1cbiAgcmV0dXJuIGNoYW5nZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja0FuZFVwZGF0ZVRleHREeW5hbWljKHZpZXc6IFZpZXdEYXRhLCBkZWY6IE5vZGVEZWYsIHZhbHVlczogYW55W10pOiBib29sZWFuIHtcbiAgY29uc3QgYmluZGluZ3MgPSBkZWYuYmluZGluZ3M7XG4gIGxldCBjaGFuZ2VkID0gZmFsc2U7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gTm90ZTogV2UgbmVlZCB0byBsb29wIG92ZXIgYWxsIHZhbHVlcywgc28gdGhhdFxuICAgIC8vIHRoZSBvbGQgdmFsdWVzIGFyZSB1cGRhdGVzIGFzIHdlbGwhXG4gICAgaWYgKGNoZWNrQW5kVXBkYXRlQmluZGluZyh2aWV3LCBkZWYsIGksIHZhbHVlc1tpXSkpIHtcbiAgICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgIH1cbiAgfVxuICBpZiAoY2hhbmdlZCkge1xuICAgIGxldCB2YWx1ZSA9ICcnO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YWx1ZSA9IHZhbHVlICsgX2FkZEludGVycG9sYXRpb25QYXJ0KHZhbHVlc1tpXSwgYmluZGluZ3NbaV0pO1xuICAgIH1cbiAgICB2YWx1ZSA9IGRlZi50ZXh0ICEucHJlZml4ICsgdmFsdWU7XG4gICAgY29uc3QgcmVuZGVyTm9kZSA9IGFzVGV4dERhdGEodmlldywgZGVmLm5vZGVJbmRleCkucmVuZGVyVGV4dDtcbiAgICB2aWV3LnJlbmRlcmVyLnNldFZhbHVlKHJlbmRlck5vZGUsIHZhbHVlKTtcbiAgfVxuICByZXR1cm4gY2hhbmdlZDtcbn1cblxuZnVuY3Rpb24gX2FkZEludGVycG9sYXRpb25QYXJ0KHZhbHVlOiBhbnksIGJpbmRpbmc6IEJpbmRpbmdEZWYpOiBzdHJpbmcge1xuICBjb25zdCB2YWx1ZVN0ciA9IHZhbHVlICE9IG51bGwgPyB2YWx1ZS50b1N0cmluZygpIDogJyc7XG4gIHJldHVybiB2YWx1ZVN0ciArIGJpbmRpbmcuc3VmZml4O1xufVxuIl19
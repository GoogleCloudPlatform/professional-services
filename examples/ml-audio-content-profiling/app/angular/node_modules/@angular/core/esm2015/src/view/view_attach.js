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
import { Services } from './types';
import { declaredViewContainer, renderNode, visitRootRenderNodes } from './util';
/**
 * @param {?} parentView
 * @param {?} elementData
 * @param {?} viewIndex
 * @param {?} view
 * @return {?}
 */
export function attachEmbeddedView(parentView, elementData, viewIndex, view) {
    /** @type {?} */
    let embeddedViews = /** @type {?} */ ((elementData.viewContainer))._embeddedViews;
    if (viewIndex === null || viewIndex === undefined) {
        viewIndex = embeddedViews.length;
    }
    view.viewContainerParent = parentView;
    addToArray(embeddedViews, /** @type {?} */ ((viewIndex)), view);
    attachProjectedView(elementData, view);
    Services.dirtyParentQueries(view);
    /** @type {?} */
    const prevView = /** @type {?} */ ((viewIndex)) > 0 ? embeddedViews[/** @type {?} */ ((viewIndex)) - 1] : null;
    renderAttachEmbeddedView(elementData, prevView, view);
}
/**
 * @param {?} vcElementData
 * @param {?} view
 * @return {?}
 */
function attachProjectedView(vcElementData, view) {
    /** @type {?} */
    const dvcElementData = declaredViewContainer(view);
    if (!dvcElementData || dvcElementData === vcElementData ||
        view.state & 16 /* IsProjectedView */) {
        return;
    }
    // Note: For performance reasons, we
    // - add a view to template._projectedViews only 1x throughout its lifetime,
    //   and remove it not until the view is destroyed.
    //   (hard, as when a parent view is attached/detached we would need to attach/detach all
    //    nested projected views as well, even across component boundaries).
    // - don't track the insertion order of views in the projected views array
    //   (hard, as when the views of the same template are inserted different view containers)
    view.state |= 16 /* IsProjectedView */;
    /** @type {?} */
    let projectedViews = dvcElementData.template._projectedViews;
    if (!projectedViews) {
        projectedViews = dvcElementData.template._projectedViews = [];
    }
    projectedViews.push(view);
    // Note: we are changing the NodeDef here as we cannot calculate
    // the fact whether a template is used for projection during compilation.
    markNodeAsProjectedTemplate(/** @type {?} */ ((view.parent)).def, /** @type {?} */ ((view.parentNodeDef)));
}
/**
 * @param {?} viewDef
 * @param {?} nodeDef
 * @return {?}
 */
function markNodeAsProjectedTemplate(viewDef, nodeDef) {
    if (nodeDef.flags & 4 /* ProjectedTemplate */) {
        return;
    }
    viewDef.nodeFlags |= 4 /* ProjectedTemplate */;
    nodeDef.flags |= 4 /* ProjectedTemplate */;
    /** @type {?} */
    let parentNodeDef = nodeDef.parent;
    while (parentNodeDef) {
        parentNodeDef.childFlags |= 4 /* ProjectedTemplate */;
        parentNodeDef = parentNodeDef.parent;
    }
}
/**
 * @param {?} elementData
 * @param {?=} viewIndex
 * @return {?}
 */
export function detachEmbeddedView(elementData, viewIndex) {
    /** @type {?} */
    const embeddedViews = /** @type {?} */ ((elementData.viewContainer))._embeddedViews;
    if (viewIndex == null || viewIndex >= embeddedViews.length) {
        viewIndex = embeddedViews.length - 1;
    }
    if (viewIndex < 0) {
        return null;
    }
    /** @type {?} */
    const view = embeddedViews[viewIndex];
    view.viewContainerParent = null;
    removeFromArray(embeddedViews, viewIndex);
    // See attachProjectedView for why we don't update projectedViews here.
    Services.dirtyParentQueries(view);
    renderDetachView(view);
    return view;
}
/**
 * @param {?} view
 * @return {?}
 */
export function detachProjectedView(view) {
    if (!(view.state & 16 /* IsProjectedView */)) {
        return;
    }
    /** @type {?} */
    const dvcElementData = declaredViewContainer(view);
    if (dvcElementData) {
        /** @type {?} */
        const projectedViews = dvcElementData.template._projectedViews;
        if (projectedViews) {
            removeFromArray(projectedViews, projectedViews.indexOf(view));
            Services.dirtyParentQueries(view);
        }
    }
}
/**
 * @param {?} elementData
 * @param {?} oldViewIndex
 * @param {?} newViewIndex
 * @return {?}
 */
export function moveEmbeddedView(elementData, oldViewIndex, newViewIndex) {
    /** @type {?} */
    const embeddedViews = /** @type {?} */ ((elementData.viewContainer))._embeddedViews;
    /** @type {?} */
    const view = embeddedViews[oldViewIndex];
    removeFromArray(embeddedViews, oldViewIndex);
    if (newViewIndex == null) {
        newViewIndex = embeddedViews.length;
    }
    addToArray(embeddedViews, newViewIndex, view);
    // Note: Don't need to change projectedViews as the order in there
    // as always invalid...
    Services.dirtyParentQueries(view);
    renderDetachView(view);
    /** @type {?} */
    const prevView = newViewIndex > 0 ? embeddedViews[newViewIndex - 1] : null;
    renderAttachEmbeddedView(elementData, prevView, view);
    return view;
}
/**
 * @param {?} elementData
 * @param {?} prevView
 * @param {?} view
 * @return {?}
 */
function renderAttachEmbeddedView(elementData, prevView, view) {
    /** @type {?} */
    const prevRenderNode = prevView ? renderNode(prevView, /** @type {?} */ ((prevView.def.lastRenderRootNode))) :
        elementData.renderElement;
    /** @type {?} */
    const parentNode = view.renderer.parentNode(prevRenderNode);
    /** @type {?} */
    const nextSibling = view.renderer.nextSibling(prevRenderNode);
    // Note: We can't check if `nextSibling` is present, as on WebWorkers it will always be!
    // However, browsers automatically do `appendChild` when there is no `nextSibling`.
    visitRootRenderNodes(view, 2 /* InsertBefore */, parentNode, nextSibling, undefined);
}
/**
 * @param {?} view
 * @return {?}
 */
export function renderDetachView(view) {
    visitRootRenderNodes(view, 3 /* RemoveChild */, null, null, undefined);
}
/**
 * @param {?} arr
 * @param {?} index
 * @param {?} value
 * @return {?}
 */
function addToArray(arr, index, value) {
    // perf: array.push is faster than array.splice!
    if (index >= arr.length) {
        arr.push(value);
    }
    else {
        arr.splice(index, 0, value);
    }
}
/**
 * @param {?} arr
 * @param {?} index
 * @return {?}
 */
function removeFromArray(arr, index) {
    // perf: array.pop is faster than array.splice!
    if (index >= arr.length - 1) {
        arr.pop();
    }
    else {
        arr.splice(index, 1);
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld19hdHRhY2guanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy92aWV3L3ZpZXdfYXR0YWNoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFrQyxRQUFRLEVBQXNDLE1BQU0sU0FBUyxDQUFDO0FBQ3ZHLE9BQU8sRUFBbUIscUJBQXFCLEVBQW1CLFVBQVUsRUFBRSxvQkFBb0IsRUFBQyxNQUFNLFFBQVEsQ0FBQzs7Ozs7Ozs7QUFFbEgsTUFBTSxVQUFVLGtCQUFrQixDQUM5QixVQUFvQixFQUFFLFdBQXdCLEVBQUUsU0FBb0MsRUFDcEYsSUFBYzs7SUFDaEIsSUFBSSxhQUFhLHNCQUFHLFdBQVcsQ0FBQyxhQUFhLEdBQUcsY0FBYyxDQUFDO0lBQy9ELElBQUksU0FBUyxLQUFLLElBQUksSUFBSSxTQUFTLEtBQUssU0FBUyxFQUFFO1FBQ2pELFNBQVMsR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDO0tBQ2xDO0lBQ0QsSUFBSSxDQUFDLG1CQUFtQixHQUFHLFVBQVUsQ0FBQztJQUN0QyxVQUFVLENBQUMsYUFBYSxxQkFBRSxTQUFTLElBQUksSUFBSSxDQUFDLENBQUM7SUFDN0MsbUJBQW1CLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBRXZDLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQzs7SUFFbEMsTUFBTSxRQUFRLHNCQUFHLFNBQVMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLGFBQWEsb0JBQUMsU0FBUyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDekUsd0JBQXdCLENBQUMsV0FBVyxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztDQUN2RDs7Ozs7O0FBRUQsU0FBUyxtQkFBbUIsQ0FBQyxhQUEwQixFQUFFLElBQWM7O0lBQ3JFLE1BQU0sY0FBYyxHQUFHLHFC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LFVBQVUsQ0FBQyxHQUFVLEVBQUUsS0FBYSxFQUFFLEtBQVU7O0lBRXZELElBQUksS0FBSyxJQUFJLEdBQUcsQ0FBQyxNQUFNLEVBQUU7UUFDdkIsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUNqQjtTQUFNO1FBQ0wsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQzdCO0NBQ0Y7Ozs7OztBQUVELFNBQVMsZUFBZSxDQUFDLEdBQVUsRUFBRSxLQUFhOztJQUVoRCxJQUFJLEtBQUssSUFBSSxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtRQUMzQixHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7S0FDWDtTQUFNO1FBQ0wsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7S0FDdEI7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtFbGVtZW50RGF0YSwgTm9kZURlZiwgTm9kZUZsYWdzLCBTZXJ2aWNlcywgVmlld0RhdGEsIFZpZXdEZWZpbml0aW9uLCBWaWV3U3RhdGV9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHtSZW5kZXJOb2RlQWN0aW9uLCBkZWNsYXJlZFZpZXdDb250YWluZXIsIGlzQ29tcG9uZW50VmlldywgcmVuZGVyTm9kZSwgdmlzaXRSb290UmVuZGVyTm9kZXN9IGZyb20gJy4vdXRpbCc7XG5cbmV4cG9ydCBmdW5jdGlvbiBhdHRhY2hFbWJlZGRlZFZpZXcoXG4gICAgcGFyZW50VmlldzogVmlld0RhdGEsIGVsZW1lbnREYXRhOiBFbGVtZW50RGF0YSwgdmlld0luZGV4OiBudW1iZXIgfCB1bmRlZmluZWQgfCBudWxsLFxuICAgIHZpZXc6IFZpZXdEYXRhKSB7XG4gIGxldCBlbWJlZGRlZFZpZXdzID0gZWxlbWVudERhdGEudmlld0NvbnRhaW5lciAhLl9lbWJlZGRlZFZpZXdzO1xuICBpZiAodmlld0luZGV4ID09PSBudWxsIHx8IHZpZXdJbmRleCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdmlld0luZGV4ID0gZW1iZWRkZWRWaWV3cy5sZW5ndGg7XG4gIH1cbiAgdmlldy52aWV3Q29udGFpbmVyUGFyZW50ID0gcGFyZW50VmlldztcbiAgYWRkVG9BcnJheShlbWJlZGRlZFZpZXdzLCB2aWV3SW5kZXggISwgdmlldyk7XG4gIGF0dGFjaFByb2plY3RlZFZpZXcoZWxlbWVudERhdGEsIHZpZXcpO1xuXG4gIFNlcnZpY2VzLmRpcnR5UGFyZW50UXVlcmllcyh2aWV3KTtcblxuICBjb25zdCBwcmV2VmlldyA9IHZpZXdJbmRleCAhID4gMCA/IGVtYmVkZGVkVmlld3Nbdmlld0luZGV4ICEgLSAxXSA6IG51bGw7XG4gIHJlbmRlckF0dGFjaEVtYmVkZGVkVmlldyhlbGVtZW50RGF0YSwgcHJldlZpZXcsIHZpZXcpO1xufVxuXG5mdW5jdGlvbiBhdHRhY2hQcm9qZWN0ZWRWaWV3KHZjRWxlbWVudERhdGE6IEVsZW1lbnREYXRhLCB2aWV3OiBWaWV3RGF0YSkge1xuICBjb25zdCBkdmNFbGVtZW50RGF0YSA9IGRlY2xhcmVkVmlld0NvbnRhaW5lcih2aWV3KTtcbiAgaWYgKCFkdmNFbGVtZW50RGF0YSB8fCBkdmNFbGVtZW50RGF0YSA9PT0gdmNFbGVtZW50RGF0YSB8fFxuICAgICAgdmlldy5zdGF0ZSAmIFZpZXdTdGF0ZS5Jc1Byb2plY3RlZFZpZXcpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgLy8gTm90ZTogRm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMsIHdlXG4gIC8vIC0gYWRkIGEgdmlldyB0byB0ZW1wbGF0ZS5fcHJvamVjdGVkVmlld3Mgb25seSAxeCB0aHJvdWdob3V0IGl0cyBsaWZldGltZSxcbiAgLy8gICBhbmQgcmVtb3ZlIGl0IG5vdCB1bnRpbCB0aGUgdmlldyBpcyBkZXN0cm95ZWQuXG4gIC8vICAgKGhhcmQsIGFzIHdoZW4gYSBwYXJlbnQgdmlldyBpcyBhdHRhY2hlZC9kZXRhY2hlZCB3ZSB3b3VsZCBuZWVkIHRvIGF0dGFjaC9kZXRhY2ggYWxsXG4gIC8vICAgIG5lc3RlZCBwcm9qZWN0ZWQgdmlld3MgYXMgd2VsbCwgZXZlbiBhY3Jvc3MgY29tcG9uZW50IGJvdW5kYXJpZXMpLlxuICAvLyAtIGRvbid0IHRyYWNrIHRoZSBpbnNlcnRpb24gb3JkZXIgb2Ygdmlld3MgaW4gdGhlIHByb2plY3RlZCB2aWV3cyBhcnJheVxuICAvLyAgIChoYXJkLCBhcyB3aGVuIHRoZSB2aWV3cyBvZiB0aGUgc2FtZSB0ZW1wbGF0ZSBhcmUgaW5zZXJ0ZWQgZGlmZmVyZW50IHZpZXcgY29udGFpbmVycylcbiAgdmlldy5zdGF0ZSB8PSBWaWV3U3RhdGUuSXNQcm9qZWN0ZWRWaWV3O1xuICBsZXQgcHJvamVjdGVkVmlld3MgPSBkdmNFbGVtZW50RGF0YS50ZW1wbGF0ZS5fcHJvamVjdGVkVmlld3M7XG4gIGlmICghcHJvamVjdGVkVmlld3MpIHtcbiAgICBwcm9qZWN0ZWRWaWV3cyA9IGR2Y0VsZW1lbnREYXRhLnRlbXBsYXRlLl9wcm9qZWN0ZWRWaWV3cyA9IFtdO1xuICB9XG4gIHByb2plY3RlZFZpZXdzLnB1c2godmlldyk7XG4gIC8vIE5vdGU6IHdlIGFyZSBjaGFuZ2luZyB0aGUgTm9kZURlZiBoZXJlIGFzIHdlIGNhbm5vdCBjYWxjdWxhdGVcbiAgLy8gdGhlIGZhY3Qgd2hldGhlciBhIHRlbXBsYXRlIGlzIHVzZWQgZm9yIHByb2plY3Rpb24gZHVyaW5nIGNvbXBpbGF0aW9uLlxuICBtYXJrTm9kZUFzUHJvamVjdGVkVGVtcGxhdGUodmlldy5wYXJlbnQgIS5kZWYsIHZpZXcucGFyZW50Tm9kZURlZiAhKTtcbn1cblxuZnVuY3Rpb24gbWFya05vZGVBc1Byb2plY3RlZFRlbXBsYXRlKHZpZXdEZWY6IFZpZXdEZWZpbml0aW9uLCBub2RlRGVmOiBOb2RlRGVmKSB7XG4gIGlmIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLlByb2plY3RlZFRlbXBsYXRlKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZpZXdEZWYubm9kZUZsYWdzIHw9IE5vZGVGbGFncy5Qcm9qZWN0ZWRUZW1wbGF0ZTtcbiAgbm9kZURlZi5mbGFncyB8PSBOb2RlRmxhZ3MuUHJvamVjdGVkVGVtcGxhdGU7XG4gIGxldCBwYXJlbnROb2RlRGVmID0gbm9kZURlZi5wYXJlbnQ7XG4gIHdoaWxlIChwYXJlbnROb2RlRGVmKSB7XG4gICAgcGFyZW50Tm9kZURlZi5jaGlsZEZsYWdzIHw9IE5vZGVGbGFncy5Qcm9qZWN0ZWRUZW1wbGF0ZTtcbiAgICBwYXJlbnROb2RlRGVmID0gcGFyZW50Tm9kZURlZi5wYXJlbnQ7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRldGFjaEVtYmVkZGVkVmlldyhlbGVtZW50RGF0YTogRWxlbWVudERhdGEsIHZpZXdJbmRleD86IG51bWJlcik6IFZpZXdEYXRhfG51bGwge1xuICBjb25zdCBlbWJlZGRlZFZpZXdzID0gZWxlbWVudERhdGEudmlld0NvbnRhaW5lciAhLl9lbWJlZGRlZFZpZXdzO1xuICBpZiAodmlld0luZGV4ID09IG51bGwgfHwgdmlld0luZGV4ID49IGVtYmVkZGVkVmlld3MubGVuZ3RoKSB7XG4gICAgdmlld0luZGV4ID0gZW1iZWRkZWRWaWV3cy5sZW5ndGggLSAxO1xuICB9XG4gIGlmICh2aWV3SW5kZXggPCAwKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgY29uc3QgdmlldyA9IGVtYmVkZGVkVmlld3Nbdmlld0luZGV4XTtcbiAgdmlldy52aWV3Q29udGFpbmVyUGFyZW50ID0gbnVsbDtcbiAgcmVtb3ZlRnJvbUFycmF5KGVtYmVkZGVkVmlld3MsIHZpZXdJbmRleCk7XG5cbiAgLy8gU2VlIGF0dGFjaFByb2plY3RlZFZpZXcgZm9yIHdoeSB3ZSBkb24ndCB1cGRhdGUgcHJvamVjdGVkVmlld3MgaGVyZS5cbiAgU2VydmljZXMuZGlydHlQYXJlbnRRdWVyaWVzKHZpZXcpO1xuXG4gIHJlbmRlckRldGFjaFZpZXcodmlldyk7XG5cbiAgcmV0dXJuIHZpZXc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZXRhY2hQcm9qZWN0ZWRWaWV3KHZpZXc6IFZpZXdEYXRhKSB7XG4gIGlmICghKHZpZXcuc3RhdGUgJiBWaWV3U3RhdGUuSXNQcm9qZWN0ZWRWaWV3KSkge1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBkdmNFbGVtZW50RGF0YSA9IGRlY2xhcmVkVmlld0NvbnRhaW5lcih2aWV3KTtcbiAgaWYgKGR2Y0VsZW1lbnREYXRhKSB7XG4gICAgY29uc3QgcHJvamVjdGVkVmlld3MgPSBkdmNFbGVtZW50RGF0YS50ZW1wbGF0ZS5fcHJvamVjdGVkVmlld3M7XG4gICAgaWYgKHByb2plY3RlZFZpZXdzKSB7XG4gICAgICByZW1vdmVGcm9tQXJyYXkocHJvamVjdGVkVmlld3MsIHByb2plY3RlZFZpZXdzLmluZGV4T2YodmlldykpO1xuICAgICAgU2VydmljZXMuZGlydHlQYXJlbnRRdWVyaWVzKHZpZXcpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gbW92ZUVtYmVkZGVkVmlldyhcbiAgICBlbGVtZW50RGF0YTogRWxlbWVudERhdGEsIG9sZFZpZXdJbmRleDogbnVtYmVyLCBuZXdWaWV3SW5kZXg6IG51bWJlcik6IFZpZXdEYXRhIHtcbiAgY29uc3QgZW1iZWRkZWRWaWV3cyA9IGVsZW1lbnREYXRhLnZpZXdDb250YWluZXIgIS5fZW1iZWRkZWRWaWV3cztcbiAgY29uc3QgdmlldyA9IGVtYmVkZGVkVmlld3Nbb2xkVmlld0luZGV4XTtcbiAgcmVtb3ZlRnJvbUFycmF5KGVtYmVkZGVkVmlld3MsIG9sZFZpZXdJbmRleCk7XG4gIGlmIChuZXdWaWV3SW5kZXggPT0gbnVsbCkge1xuICAgIG5ld1ZpZXdJbmRleCA9IGVtYmVkZGVkVmlld3MubGVuZ3RoO1xuICB9XG4gIGFkZFRvQXJyYXkoZW1iZWRkZWRWaWV3cywgbmV3Vmlld0luZGV4LCB2aWV3KTtcblxuICAvLyBOb3RlOiBEb24ndCBuZWVkIHRvIGNoYW5nZSBwcm9qZWN0ZWRWaWV3cyBhcyB0aGUgb3JkZXIgaW4gdGhlcmVcbiAgLy8gYXMgYWx3YXlzIGludmFsaWQuLi5cblxuICBTZXJ2aWNlcy5kaXJ0eVBhcmVudFF1ZXJpZXModmlldyk7XG5cbiAgcmVuZGVyRGV0YWNoVmlldyh2aWV3KTtcbiAgY29uc3QgcHJldlZpZXcgPSBuZXdWaWV3SW5kZXggPiAwID8gZW1iZWRkZWRWaWV3c1tuZXdWaWV3SW5kZXggLSAxXSA6IG51bGw7XG4gIHJlbmRlckF0dGFjaEVtYmVkZGVkVmlldyhlbGVtZW50RGF0YSwgcHJldlZpZXcsIHZpZXcpO1xuXG4gIHJldHVybiB2aWV3O1xufVxuXG5mdW5jdGlvbiByZW5kZXJBdHRhY2hFbWJlZGRlZFZpZXcoXG4gICAgZWxlbWVudERhdGE6IEVsZW1lbnREYXRhLCBwcmV2VmlldzogVmlld0RhdGEgfCBudWxsLCB2aWV3OiBWaWV3RGF0YSkge1xuICBjb25zdCBwcmV2UmVuZGVyTm9kZSA9IHByZXZWaWV3ID8gcmVuZGVyTm9kZShwcmV2VmlldywgcHJldlZpZXcuZGVmLmxhc3RSZW5kZXJSb290Tm9kZSAhKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50RGF0YS5yZW5kZXJFbGVtZW50O1xuICBjb25zdCBwYXJlbnROb2RlID0gdmlldy5yZW5kZXJlci5wYXJlbnROb2RlKHByZXZSZW5kZXJOb2RlKTtcbiAgY29uc3QgbmV4dFNpYmxpbmcgPSB2aWV3LnJlbmRlcmVyLm5leHRTaWJsaW5nKHByZXZSZW5kZXJOb2RlKTtcbiAgLy8gTm90ZTogV2UgY2FuJ3QgY2hlY2sgaWYgYG5leHRTaWJsaW5nYCBpcyBwcmVzZW50LCBhcyBvbiBXZWJXb3JrZXJzIGl0IHdpbGwgYWx3YXlzIGJlIVxuICAvLyBIb3dldmVyLCBicm93c2VycyBhdXRvbWF0aWNhbGx5IGRvIGBhcHBlbmRDaGlsZGAgd2hlbiB0aGVyZSBpcyBubyBgbmV4dFNpYmxpbmdgLlxuICB2aXNpdFJvb3RSZW5kZXJOb2Rlcyh2aWV3LCBSZW5kZXJOb2RlQWN0aW9uLkluc2VydEJlZm9yZSwgcGFyZW50Tm9kZSwgbmV4dFNpYmxpbmcsIHVuZGVmaW5lZCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJEZXRhY2hWaWV3KHZpZXc6IFZpZXdEYXRhKSB7XG4gIHZpc2l0Um9vdFJlbmRlck5vZGVzKHZpZXcsIFJlbmRlck5vZGVBY3Rpb24uUmVtb3ZlQ2hpbGQsIG51bGwsIG51bGwsIHVuZGVmaW5lZCk7XG59XG5cbmZ1bmN0aW9uIGFkZFRvQXJyYXkoYXJyOiBhbnlbXSwgaW5kZXg6IG51bWJlciwgdmFsdWU6IGFueSkge1xuICAvLyBwZXJmOiBhcnJheS5wdXNoIGlzIGZhc3RlciB0aGFuIGFycmF5LnNwbGljZSFcbiAgaWYgKGluZGV4ID49IGFyci5sZW5ndGgpIHtcbiAgICBhcnIucHVzaCh2YWx1ZSk7XG4gIH0gZWxzZSB7XG4gICAgYXJyLnNwbGljZShpbmRleCwgMCwgdmFsdWUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUZyb21BcnJheShhcnI6IGFueVtdLCBpbmRleDogbnVtYmVyKSB7XG4gIC8vIHBlcmY6IGFycmF5LnBvcCBpcyBmYXN0ZXIgdGhhbiBhcnJheS5zcGxpY2UhXG4gIGlmIChpbmRleCA+PSBhcnIubGVuZ3RoIC0gMSkge1xuICAgIGFyci5wb3AoKTtcbiAgfSBlbHNlIHtcbiAgICBhcnIuc3BsaWNlKGluZGV4LCAxKTtcbiAgfVxufVxuIl19
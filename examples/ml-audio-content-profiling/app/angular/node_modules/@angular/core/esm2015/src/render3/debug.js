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
import { DebugRendererFactory2 } from '../view/services';
import { getHostComponent, getInjector, getLocalRefs, loadContext } from './discovery_utils';
import { TVIEW } from './interfaces/view';
/**
 * Adapts the DebugRendererFactory2 to create a DebugRenderer2 specific for IVY.
 *
 * The created DebugRenderer know how to create a Debug Context specific to IVY.
 */
export class Render3DebugRendererFactory2 extends DebugRendererFactory2 {
    /**
     * @param {?} element
     * @param {?} renderData
     * @return {?}
     */
    createRenderer(element, renderData) {
        /** @type {?} */
        const renderer = /** @type {?} */ (super.createRenderer(element, renderData));
        renderer.debugContextFactory = (nativeElement) => new Render3DebugContext(nativeElement);
        return renderer;
    }
}
/**
 * Stores context information about view nodes.
 *
 * Used in tests to retrieve information those nodes.
 */
class Render3DebugContext {
    /**
     * @param {?} _nativeNode
     */
    constructor(_nativeNode) {
        this._nativeNode = _nativeNode;
    }
    /**
     * @return {?}
     */
    get nodeIndex() { return loadContext(this._nativeNode).nodeIndex; }
    /**
     * @return {?}
     */
    get view() { return loadContext(this._nativeNode).lViewData; }
    /**
     * @return {?}
     */
    get injector() { return getInjector(this._nativeNode); }
    /**
     * @return {?}
     */
    get component() { return getHostComponent(this._nativeNode); }
    /**
     * @return {?}
     */
    get providerTokens() {
        /** @type {?} */
        const lDebugCtx = loadContext(this._nativeNode);
        /** @type {?} */
        const lViewData = lDebugCtx.lViewData;
        /** @type {?} */
        const tNode = /** @type {?} */ (lViewData[TVIEW].data[lDebugCtx.nodeIndex]);
        /** @type {?} */
        const directivesCount = tNode.flags & 4095 /* DirectiveCountMask */;
        if (directivesCount > 0) {
            /** @type {?} */
            const directiveIdxStart = tNode.flags >> 15 /* DirectiveStartingIndexShift */;
            /** @type {?} */
            const directiveIdxEnd = directiveIdxStart + directivesCount;
            /** @type {?} */
            const viewDirectiveDefs = this.view[TVIEW].data;
            /** @type {?} */
            const directiveDefs = /** @type {?} */ (viewDirectiveDefs.slice(directiveIdxStart, directiveIdxEnd));
            return directiveDefs.map(directiveDef => directiveDef.type);
        }
        return [];
    }
    /**
     * @return {?}
     */
    get references() { return getLocalRefs(this._nativeNode); }
    /**
     * @return {?}
     */
    get context() { throw new Error('Not implemented in ivy'); }
    /**
     * @return {?}
     */
    get componentRenderElement() { throw new Error('Not implemented in ivy'); }
    /**
     * @return {?}
     */
    get renderNode() { throw new Error('Not implemented in ivy'); }
    /**
     * @param {?} console
     * @param {...?} values
     * @return {?}
     */
    logError(console, ...values) { console.error(...values); }
}
if (false) {
    /** @type {?} */
    Render3DebugContext.prototype._nativeNode;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RlYnVnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBV0EsT0FBTyxFQUFpQixxQkFBcUIsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBRXZFLE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxXQUFXLEVBQUUsWUFBWSxFQUFFLFdBQVcsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRzNGLE9BQU8sRUFBQyxLQUFLLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQzs7Ozs7O0FBT3hDLE1BQU0sT0FBTyw0QkFBNkIsU0FBUSxxQkFBcUI7Ozs7OztJQUNyRSxjQUFjLENBQUMsT0FBWSxFQUFFLFVBQThCOztRQUN6RCxNQUFNLFFBQVEscUJBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFtQixFQUFDO1FBQzdFLFFBQVEsQ0FBQyxtQkFBbUIsR0FBRyxDQUFDLGFBQWtCLEVBQUUsRUFBRSxDQUFDLElBQUksbUJBQW1CLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDOUYsT0FBTyxRQUFRLENBQUM7S0FDakI7Q0FDRjs7Ozs7O0FBT0QsTUFBTSxtQkFBbUI7Ozs7SUFDdkIsWUFBb0IsV0FBZ0I7UUFBaEIsZ0JBQVcsR0FBWCxXQUFXLENBQUs7S0FBSTs7OztJQUV4QyxJQUFJLFNBQVMsS0FBa0IsT0FBTyxXQUFXLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxFQUFFOzs7O0lBRWhGLElBQUksSUFBSSxLQUFVLE9BQU8sV0FBVyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxTQUFTLENBQUMsRUFBRTs7OztJQUVuRSxJQUFJLFFBQVEsS0FBZSxPQUFPLFdBQVcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsRUFBRTs7OztJQUVsRSxJQUFJLFNBQVMsS0FBVSxPQUFPLGdCQUFnQixDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxFQUFFOzs7O0lBRW5FLElBQUksY0FBYzs7UUFDaEIsTUFBTSxTQUFTLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQzs7UUFDaEQsTUFBTSxTQUFTLEdBQUcsU0FBUyxDQUFDLFNBQVMsQ0FBQzs7UUFDdEMsTUFBTSxLQUFLLHFCQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBVSxFQUFDOztRQUNsRSxNQUFNLGVBQWUsR0FBRyxLQUFLLENBQUMsS0FBSyxnQ0FBZ0MsQ0FBQztRQUVwRSxJQUFJLGVBQWUsR0FBRyxDQUFDLEVBQUU7O1lBQ3ZCLE1BQU0saUJBQWlCLEdBQUcsS0FBSyxDQUFDLEtBQUssd0NBQTBDLENBQUM7O1lBQ2hGLE1BQU0sZUFBZSxHQUFHLGlCQUFpQixHQUFHLGVBQWUsQ0FBQzs7WUFDNUQsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQzs7WUFDaEQsTUFBTSxhQUFhLHFCQUNmLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxlQUFlLENBQXdCLEVBQUM7WUFFdkYsT0FBTyxhQUFhLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQzdEO1FBRUQsT0FBTyxFQUFFLENBQUM7S0FDWDs7OztJQUVELElBQUksVUFBVSxLQUEyQixPQUFPLFlBQVksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsRUFBRTs7OztJQUdqRixJQUFJLE9BQU8sS0FBVSxNQUFNLElBQUksS0FBSyxDQUFDLHdCQUF3QixDQUFDLENBQUMsRUFBRTs7OztJQUdqRSxJQUFJLHNCQUFzQixLQUFVLE1BQU0sSUFBSSxLQUFLLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxFQUFFOzs7O0lBR2hGLElBQUksVUFBVSxLQUFVLE1BQU0sSUFBSSxLQUFLLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxFQUFFOzs7Ozs7SUFHcEUsUUFBUSxDQUFDLE9BQWdCLEVBQUUsR0FBRyxNQUFhLElBQVUsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLEVBQUU7Q0FDakYiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7UmVuZGVyZXIyLCBSZW5kZXJlclR5cGUyfSBmcm9tICcuLi9yZW5kZXIvYXBpJztcbmltcG9ydCB7RGVidWdDb250ZXh0fSBmcm9tICcuLi92aWV3JztcbmltcG9ydCB7RGVidWdSZW5kZXJlcjIsIERlYnVnUmVuZGVyZXJGYWN0b3J5Mn0gZnJvbSAnLi4vdmlldy9zZXJ2aWNlcyc7XG5cbmltcG9ydCB7Z2V0SG9zdENvbXBvbmVudCwgZ2V0SW5qZWN0b3IsIGdldExvY2FsUmVmcywgbG9hZENvbnRleHR9IGZyb20gJy4vZGlzY292ZXJ5X3V0aWxzJztcbmltcG9ydCB7RGlyZWN0aXZlRGVmfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge1ROb2RlLCBUTm9kZUZsYWdzfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1RWSUVXfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5cbi8qKlxuICogQWRhcHRzIHRoZSBEZWJ1Z1JlbmRlcmVyRmFjdG9yeTIgdG8gY3JlYXRlIGEgRGVidWdSZW5kZXJlcjIgc3BlY2lmaWMgZm9yIElWWS5cbiAqXG4gKiBUaGUgY3JlYXRlZCBEZWJ1Z1JlbmRlcmVyIGtub3cgaG93IHRvIGNyZWF0ZSBhIERlYnVnIENvbnRleHQgc3BlY2lmaWMgdG8gSVZZLlxuICovXG5leHBvcnQgY2xhc3MgUmVuZGVyM0RlYnVnUmVuZGVyZXJGYWN0b3J5MiBleHRlbmRzIERlYnVnUmVuZGVyZXJGYWN0b3J5MiB7XG4gIGNyZWF0ZVJlbmRlcmVyKGVsZW1lbnQ6IGFueSwgcmVuZGVyRGF0YTogUmVuZGVyZXJUeXBlMnxudWxsKTogUmVuZGVyZXIyIHtcbiAgICBjb25zdCByZW5kZXJlciA9IHN1cGVyLmNyZWF0ZVJlbmRlcmVyKGVsZW1lbnQsIHJlbmRlckRhdGEpIGFzIERlYnVnUmVuZGVyZXIyO1xuICAgIHJlbmRlcmVyLmRlYnVnQ29udGV4dEZhY3RvcnkgPSAobmF0aXZlRWxlbWVudDogYW55KSA9PiBuZXcgUmVuZGVyM0RlYnVnQ29udGV4dChuYXRpdmVFbGVtZW50KTtcbiAgICByZXR1cm4gcmVuZGVyZXI7XG4gIH1cbn1cblxuLyoqXG4gKiBTdG9yZXMgY29udGV4dCBpbmZvcm1hdGlvbiBhYm91dCB2aWV3IG5vZGVzLlxuICpcbiAqIFVzZWQgaW4gdGVzdHMgdG8gcmV0cmlldmUgaW5mb3JtYXRpb24gdGhvc2Ugbm9kZXMuXG4gKi9cbmNsYXNzIFJlbmRlcjNEZWJ1Z0NvbnRleHQgaW1wbGVtZW50cyBEZWJ1Z0NvbnRleHQge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9uYXRpdmVOb2RlOiBhbnkpIHt9XG5cbiAgZ2V0IG5vZGVJbmRleCgpOiBudW1iZXJ8bnVsbCB7IHJldHVybiBsb2FkQ29udGV4dCh0aGlzLl9uYXRpdmVOb2RlKS5ub2RlSW5kZXg7IH1cblxuICBnZXQgdmlldygpOiBhbnkgeyByZXR1cm4gbG9hZENvbnRleHQodGhpcy5fbmF0aXZlTm9kZSkubFZpZXdEYXRhOyB9XG5cbiAgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHsgcmV0dXJuIGdldEluamVjdG9yKHRoaXMuX25hdGl2ZU5vZGUpOyB9XG5cbiAgZ2V0IGNvbXBvbmVudCgpOiBhbnkgeyByZXR1cm4gZ2V0SG9zdENvbXBvbmVudCh0aGlzLl9uYXRpdmVOb2RlKTsgfVxuXG4gIGdldCBwcm92aWRlclRva2VucygpOiBhbnlbXSB7XG4gICAgY29uc3QgbERlYnVnQ3R4ID0gbG9hZENvbnRleHQodGhpcy5fbmF0aXZlTm9kZSk7XG4gICAgY29uc3QgbFZpZXdEYXRhID0gbERlYnVnQ3R4LmxWaWV3RGF0YTtcbiAgICBjb25zdCB0Tm9kZSA9IGxWaWV3RGF0YVtUVklFV10uZGF0YVtsRGVidWdDdHgubm9kZUluZGV4XSBhcyBUTm9kZTtcbiAgICBjb25zdCBkaXJlY3RpdmVzQ291bnQgPSB0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuRGlyZWN0aXZlQ291bnRNYXNrO1xuXG4gICAgaWYgKGRpcmVjdGl2ZXNDb3VudCA+IDApIHtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZUlkeFN0YXJ0ID0gdE5vZGUuZmxhZ3MgPj4gVE5vZGVGbGFncy5EaXJlY3RpdmVTdGFydGluZ0luZGV4U2hpZnQ7XG4gICAgICBjb25zdCBkaXJlY3RpdmVJZHhFbmQgPSBkaXJlY3RpdmVJZHhTdGFydCArIGRpcmVjdGl2ZXNDb3VudDtcbiAgICAgIGNvbnN0IHZpZXdEaXJlY3RpdmVEZWZzID0gdGhpcy52aWV3W1RWSUVXXS5kYXRhO1xuICAgICAgY29uc3QgZGlyZWN0aXZlRGVmcyA9XG4gICAgICAgICAgdmlld0RpcmVjdGl2ZURlZnMuc2xpY2UoZGlyZWN0aXZlSWR4U3RhcnQsIGRpcmVjdGl2ZUlkeEVuZCkgYXMgRGlyZWN0aXZlRGVmPGFueT5bXTtcblxuICAgICAgcmV0dXJuIGRpcmVjdGl2ZURlZnMubWFwKGRpcmVjdGl2ZURlZiA9PiBkaXJlY3RpdmVEZWYudHlwZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgZ2V0IHJlZmVyZW5jZXMoKToge1trZXk6IHN0cmluZ106IGFueX0geyByZXR1cm4gZ2V0TG9jYWxSZWZzKHRoaXMuX25hdGl2ZU5vZGUpOyB9XG5cbiAgLy8gVE9ETyhwayk6IGNoZWNrIHByZXZpb3VzIGltcGxlbWVudGF0aW9uIGFuZCByZS1pbXBsZW1lbnRcbiAgZ2V0IGNvbnRleHQoKTogYW55IHsgdGhyb3cgbmV3IEVycm9yKCdOb3QgaW1wbGVtZW50ZWQgaW4gaXZ5Jyk7IH1cblxuICAvLyBUT0RPKHBrKTogY2hlY2sgcHJldmlvdXMgaW1wbGVtZW50YXRpb24gYW5kIHJlLWltcGxlbWVudFxuICBnZXQgY29tcG9uZW50UmVuZGVyRWxlbWVudCgpOiBhbnkgeyB0aHJvdyBuZXcgRXJyb3IoJ05vdCBpbXBsZW1lbnRlZCBpbiBpdnknKTsgfVxuXG4gIC8vIFRPRE8ocGspOiBjaGVjayBwcmV2aW91cyBpbXBsZW1lbnRhdGlvbiBhbmQgcmUtaW1wbGVtZW50XG4gIGdldCByZW5kZXJOb2RlKCk6IGFueSB7IHRocm93IG5ldyBFcnJvcignTm90IGltcGxlbWVudGVkIGluIGl2eScpOyB9XG5cbiAgLy8gVE9ETyhwayk6IGNoZWNrIHByZXZpb3VzIGltcGxlbWVudGF0aW9uIGFuZCByZS1pbXBsZW1lbnRcbiAgbG9nRXJyb3IoY29uc29sZTogQ29uc29sZSwgLi4udmFsdWVzOiBhbnlbXSk6IHZvaWQgeyBjb25zb2xlLmVycm9yKC4uLnZhbHVlcyk7IH1cbn1cbiJdfQ==
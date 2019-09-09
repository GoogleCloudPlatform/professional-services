/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { DebugRendererFactory2 } from '../view/services';
import { getHostComponent, getInjector, getLocalRefs, loadContext } from './discovery_utils';
import { TVIEW } from './interfaces/view';
/**
 * Adapts the DebugRendererFactory2 to create a DebugRenderer2 specific for IVY.
 *
 * The created DebugRenderer know how to create a Debug Context specific to IVY.
 */
var Render3DebugRendererFactory2 = /** @class */ (function (_super) {
    tslib_1.__extends(Render3DebugRendererFactory2, _super);
    function Render3DebugRendererFactory2() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Render3DebugRendererFactory2.prototype.createRenderer = function (element, renderData) {
        var renderer = _super.prototype.createRenderer.call(this, element, renderData);
        renderer.debugContextFactory = function (nativeElement) { return new Render3DebugContext(nativeElement); };
        return renderer;
    };
    return Render3DebugRendererFactory2;
}(DebugRendererFactory2));
export { Render3DebugRendererFactory2 };
/**
 * Stores context information about view nodes.
 *
 * Used in tests to retrieve information those nodes.
 */
var Render3DebugContext = /** @class */ (function () {
    function Render3DebugContext(_nativeNode) {
        this._nativeNode = _nativeNode;
    }
    Object.defineProperty(Render3DebugContext.prototype, "nodeIndex", {
        get: function () { return loadContext(this._nativeNode).nodeIndex; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Render3DebugContext.prototype, "view", {
        get: function () { return loadContext(this._nativeNode).lViewData; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Render3DebugContext.prototype, "injector", {
        get: function () { return getInjector(this._nativeNode); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Render3DebugContext.prototype, "component", {
        get: function () { return getHostComponent(this._nativeNode); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Render3DebugContext.prototype, "providerTokens", {
        get: function () {
            var lDebugCtx = loadContext(this._nativeNode);
            var lViewData = lDebugCtx.lViewData;
            var tNode = lViewData[TVIEW].data[lDebugCtx.nodeIndex];
            var directivesCount = tNode.flags & 4095 /* DirectiveCountMask */;
            if (directivesCount > 0) {
                var directiveIdxStart = tNode.flags >> 15 /* DirectiveStartingIndexShift */;
                var directiveIdxEnd = directiveIdxStart + directivesCount;
                var viewDirectiveDefs = this.view[TVIEW].data;
                var directiveDefs = viewDirectiveDefs.slice(directiveIdxStart, directiveIdxEnd);
                return directiveDefs.map(function (directiveDef) { return directiveDef.type; });
            }
            return [];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Render3DebugContext.prototype, "references", {
        get: function () { return getLocalRefs(this._nativeNode); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Render3DebugContext.prototype, "context", {
        // TODO(pk): check previous implementation and re-implement
        get: function () { throw new Error('Not implemented in ivy'); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Render3DebugContext.prototype, "componentRenderElement", {
        // TODO(pk): check previous implementation and re-implement
        get: function () { throw new Error('Not implemented in ivy'); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Render3DebugContext.prototype, "renderNode", {
        // TODO(pk): check previous implementation and re-implement
        get: function () { throw new Error('Not implemented in ivy'); },
        enumerable: true,
        configurable: true
    });
    // TODO(pk): check previous implementation and re-implement
    Render3DebugContext.prototype.logError = function (console) {
        var values = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            values[_i - 1] = arguments[_i];
        }
        console.error.apply(console, tslib_1.__spread(values));
    };
    return Render3DebugContext;
}());

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RlYnVnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFLSCxPQUFPLEVBQWlCLHFCQUFxQixFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFFdkUsT0FBTyxFQUFDLGdCQUFnQixFQUFFLFdBQVcsRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFHM0YsT0FBTyxFQUFDLEtBQUssRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRXhDOzs7O0dBSUc7QUFDSDtJQUFrRCx3REFBcUI7SUFBdkU7O0lBTUEsQ0FBQztJQUxDLHFEQUFjLEdBQWQsVUFBZSxPQUFZLEVBQUUsVUFBOEI7UUFDekQsSUFBTSxRQUFRLEdBQUcsaUJBQU0sY0FBYyxZQUFDLE9BQU8sRUFBRSxVQUFVLENBQW1CLENBQUM7UUFDN0UsUUFBUSxDQUFDLG1CQUFtQixHQUFHLFVBQUMsYUFBa0IsSUFBSyxPQUFBLElBQUksbUJBQW1CLENBQUMsYUFBYSxDQUFDLEVBQXRDLENBQXNDLENBQUM7UUFDOUYsT0FBTyxRQUFRLENBQUM7SUFDbEIsQ0FBQztJQUNILG1DQUFDO0FBQUQsQ0FBQyxBQU5ELENBQWtELHFCQUFxQixHQU10RTs7QUFFRDs7OztHQUlHO0FBQ0g7SUFDRSw2QkFBb0IsV0FBZ0I7UUFBaEIsZ0JBQVcsR0FBWCxXQUFXLENBQUs7SUFBRyxDQUFDO0lBRXhDLHNCQUFJLDBDQUFTO2FBQWIsY0FBK0IsT0FBTyxXQUFXLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7OztPQUFBO0lBRWhGLHNCQUFJLHFDQUFJO2FBQVIsY0FBa0IsT0FBTyxXQUFXLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7OztPQUFBO0lBRW5FLHNCQUFJLHlDQUFRO2FBQVosY0FBMkIsT0FBTyxXQUFXLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7O09BQUE7SUFFbEUsc0JBQUksMENBQVM7YUFBYixjQUF1QixPQUFPLGdCQUFnQixDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7OztPQUFBO0lBRW5FLHNCQUFJLCtDQUFjO2FBQWxCO1lBQ0UsSUFBTSxTQUFTLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUNoRCxJQUFNLFNBQVMsR0FBRyxTQUFTLENBQUMsU0FBUyxDQUFDO1lBQ3RDLElBQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBVSxDQUFDO1lBQ2xFLElBQU0sZUFBZSxHQUFHLEtBQUssQ0FBQyxLQUFLLGdDQUFnQyxDQUFDO1lBRXBFLElBQUksZUFBZSxHQUFHLENBQUMsRUFBRTtnQkFDdkIsSUFBTSxpQkFBaUIsR0FBRyxLQUFLLENBQUMsS0FBSyx3Q0FBMEMsQ0FBQztnQkFDaEYsSUFBTSxlQUFlLEdBQUcsaUJBQWlCLEdBQUcsZUFBZSxDQUFDO2dCQUM1RCxJQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUNoRCxJQUFNLGFBQWEsR0FDZixpQkFBaUIsQ0FBQyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsZUFBZSxDQUF3QixDQUFDO2dCQUV2RixPQUFPLGFBQWEsQ0FBQyxHQUFHLENBQUMsVUFBQSxZQUFZLElBQUksT0FBQSxZQUFZLENBQUMsSUFBSSxFQUFqQixDQUFpQixDQUFDLENBQUM7YUFDN0Q7WUFFRCxPQUFPLEVBQUUsQ0FBQztRQUNaLENBQUM7OztPQUFBO0lBRUQsc0JBQUksMkNBQVU7YUFBZCxjQUF5QyxPQUFPLFlBQVksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDOzs7T0FBQTtJQUdqRixzQkFBSSx3Q0FBTztRQURYLDJEQUEyRDthQUMzRCxjQUFxQixNQUFNLElBQUksS0FBSyxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxDQUFDOzs7T0FBQTtJQUdqRSxzQkFBSSx1REFBc0I7UUFEMUIsMkRBQTJEO2FBQzNELGNBQW9DLE1BQU0sSUFBSSxLQUFLLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLENBQUM7OztPQUFBO0lBR2hGLHNCQUFJLDJDQUFVO1FBRGQsMkRBQTJEO2FBQzNELGNBQXdCLE1BQU0sSUFBSSxLQUFLLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLENBQUM7OztPQUFBO0lBRXBFLDJEQUEyRDtJQUMzRCxzQ0FBUSxHQUFSLFVBQVMsT0FBZ0I7UUFBRSxnQkFBZ0I7YUFBaEIsVUFBZ0IsRUFBaEIscUJBQWdCLEVBQWhCLElBQWdCO1lBQWhCLCtCQUFnQjs7UUFBVSxPQUFPLENBQUMsS0FBSyxPQUFiLE9BQU8sbUJBQVUsTUFBTSxHQUFFO0lBQUMsQ0FBQztJQUNsRiwwQkFBQztBQUFELENBQUMsQUEzQ0QsSUEyQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7UmVuZGVyZXIyLCBSZW5kZXJlclR5cGUyfSBmcm9tICcuLi9yZW5kZXIvYXBpJztcbmltcG9ydCB7RGVidWdDb250ZXh0fSBmcm9tICcuLi92aWV3JztcbmltcG9ydCB7RGVidWdSZW5kZXJlcjIsIERlYnVnUmVuZGVyZXJGYWN0b3J5Mn0gZnJvbSAnLi4vdmlldy9zZXJ2aWNlcyc7XG5cbmltcG9ydCB7Z2V0SG9zdENvbXBvbmVudCwgZ2V0SW5qZWN0b3IsIGdldExvY2FsUmVmcywgbG9hZENvbnRleHR9IGZyb20gJy4vZGlzY292ZXJ5X3V0aWxzJztcbmltcG9ydCB7RGlyZWN0aXZlRGVmfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge1ROb2RlLCBUTm9kZUZsYWdzfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1RWSUVXfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5cbi8qKlxuICogQWRhcHRzIHRoZSBEZWJ1Z1JlbmRlcmVyRmFjdG9yeTIgdG8gY3JlYXRlIGEgRGVidWdSZW5kZXJlcjIgc3BlY2lmaWMgZm9yIElWWS5cbiAqXG4gKiBUaGUgY3JlYXRlZCBEZWJ1Z1JlbmRlcmVyIGtub3cgaG93IHRvIGNyZWF0ZSBhIERlYnVnIENvbnRleHQgc3BlY2lmaWMgdG8gSVZZLlxuICovXG5leHBvcnQgY2xhc3MgUmVuZGVyM0RlYnVnUmVuZGVyZXJGYWN0b3J5MiBleHRlbmRzIERlYnVnUmVuZGVyZXJGYWN0b3J5MiB7XG4gIGNyZWF0ZVJlbmRlcmVyKGVsZW1lbnQ6IGFueSwgcmVuZGVyRGF0YTogUmVuZGVyZXJUeXBlMnxudWxsKTogUmVuZGVyZXIyIHtcbiAgICBjb25zdCByZW5kZXJlciA9IHN1cGVyLmNyZWF0ZVJlbmRlcmVyKGVsZW1lbnQsIHJlbmRlckRhdGEpIGFzIERlYnVnUmVuZGVyZXIyO1xuICAgIHJlbmRlcmVyLmRlYnVnQ29udGV4dEZhY3RvcnkgPSAobmF0aXZlRWxlbWVudDogYW55KSA9PiBuZXcgUmVuZGVyM0RlYnVnQ29udGV4dChuYXRpdmVFbGVtZW50KTtcbiAgICByZXR1cm4gcmVuZGVyZXI7XG4gIH1cbn1cblxuLyoqXG4gKiBTdG9yZXMgY29udGV4dCBpbmZvcm1hdGlvbiBhYm91dCB2aWV3IG5vZGVzLlxuICpcbiAqIFVzZWQgaW4gdGVzdHMgdG8gcmV0cmlldmUgaW5mb3JtYXRpb24gdGhvc2Ugbm9kZXMuXG4gKi9cbmNsYXNzIFJlbmRlcjNEZWJ1Z0NvbnRleHQgaW1wbGVtZW50cyBEZWJ1Z0NvbnRleHQge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9uYXRpdmVOb2RlOiBhbnkpIHt9XG5cbiAgZ2V0IG5vZGVJbmRleCgpOiBudW1iZXJ8bnVsbCB7IHJldHVybiBsb2FkQ29udGV4dCh0aGlzLl9uYXRpdmVOb2RlKS5ub2RlSW5kZXg7IH1cblxuICBnZXQgdmlldygpOiBhbnkgeyByZXR1cm4gbG9hZENvbnRleHQodGhpcy5fbmF0aXZlTm9kZSkubFZpZXdEYXRhOyB9XG5cbiAgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHsgcmV0dXJuIGdldEluamVjdG9yKHRoaXMuX25hdGl2ZU5vZGUpOyB9XG5cbiAgZ2V0IGNvbXBvbmVudCgpOiBhbnkgeyByZXR1cm4gZ2V0SG9zdENvbXBvbmVudCh0aGlzLl9uYXRpdmVOb2RlKTsgfVxuXG4gIGdldCBwcm92aWRlclRva2VucygpOiBhbnlbXSB7XG4gICAgY29uc3QgbERlYnVnQ3R4ID0gbG9hZENvbnRleHQodGhpcy5fbmF0aXZlTm9kZSk7XG4gICAgY29uc3QgbFZpZXdEYXRhID0gbERlYnVnQ3R4LmxWaWV3RGF0YTtcbiAgICBjb25zdCB0Tm9kZSA9IGxWaWV3RGF0YVtUVklFV10uZGF0YVtsRGVidWdDdHgubm9kZUluZGV4XSBhcyBUTm9kZTtcbiAgICBjb25zdCBkaXJlY3RpdmVzQ291bnQgPSB0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuRGlyZWN0aXZlQ291bnRNYXNrO1xuXG4gICAgaWYgKGRpcmVjdGl2ZXNDb3VudCA+IDApIHtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZUlkeFN0YXJ0ID0gdE5vZGUuZmxhZ3MgPj4gVE5vZGVGbGFncy5EaXJlY3RpdmVTdGFydGluZ0luZGV4U2hpZnQ7XG4gICAgICBjb25zdCBkaXJlY3RpdmVJZHhFbmQgPSBkaXJlY3RpdmVJZHhTdGFydCArIGRpcmVjdGl2ZXNDb3VudDtcbiAgICAgIGNvbnN0IHZpZXdEaXJlY3RpdmVEZWZzID0gdGhpcy52aWV3W1RWSUVXXS5kYXRhO1xuICAgICAgY29uc3QgZGlyZWN0aXZlRGVmcyA9XG4gICAgICAgICAgdmlld0RpcmVjdGl2ZURlZnMuc2xpY2UoZGlyZWN0aXZlSWR4U3RhcnQsIGRpcmVjdGl2ZUlkeEVuZCkgYXMgRGlyZWN0aXZlRGVmPGFueT5bXTtcblxuICAgICAgcmV0dXJuIGRpcmVjdGl2ZURlZnMubWFwKGRpcmVjdGl2ZURlZiA9PiBkaXJlY3RpdmVEZWYudHlwZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgZ2V0IHJlZmVyZW5jZXMoKToge1trZXk6IHN0cmluZ106IGFueX0geyByZXR1cm4gZ2V0TG9jYWxSZWZzKHRoaXMuX25hdGl2ZU5vZGUpOyB9XG5cbiAgLy8gVE9ETyhwayk6IGNoZWNrIHByZXZpb3VzIGltcGxlbWVudGF0aW9uIGFuZCByZS1pbXBsZW1lbnRcbiAgZ2V0IGNvbnRleHQoKTogYW55IHsgdGhyb3cgbmV3IEVycm9yKCdOb3QgaW1wbGVtZW50ZWQgaW4gaXZ5Jyk7IH1cblxuICAvLyBUT0RPKHBrKTogY2hlY2sgcHJldmlvdXMgaW1wbGVtZW50YXRpb24gYW5kIHJlLWltcGxlbWVudFxuICBnZXQgY29tcG9uZW50UmVuZGVyRWxlbWVudCgpOiBhbnkgeyB0aHJvdyBuZXcgRXJyb3IoJ05vdCBpbXBsZW1lbnRlZCBpbiBpdnknKTsgfVxuXG4gIC8vIFRPRE8ocGspOiBjaGVjayBwcmV2aW91cyBpbXBsZW1lbnRhdGlvbiBhbmQgcmUtaW1wbGVtZW50XG4gIGdldCByZW5kZXJOb2RlKCk6IGFueSB7IHRocm93IG5ldyBFcnJvcignTm90IGltcGxlbWVudGVkIGluIGl2eScpOyB9XG5cbiAgLy8gVE9ETyhwayk6IGNoZWNrIHByZXZpb3VzIGltcGxlbWVudGF0aW9uIGFuZCByZS1pbXBsZW1lbnRcbiAgbG9nRXJyb3IoY29uc29sZTogQ29uc29sZSwgLi4udmFsdWVzOiBhbnlbXSk6IHZvaWQgeyBjb25zb2xlLmVycm9yKC4uLnZhbHVlcyk7IH1cbn1cbiJdfQ==
/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
import { buildAnimationAst } from '../dsl/animation_ast_builder';
import { buildTrigger } from '../dsl/animation_trigger';
import { parseTimelineCommand } from './shared';
import { TimelineAnimationEngine } from './timeline_animation_engine';
import { TransitionAnimationEngine } from './transition_animation_engine';
export class AnimationEngine {
    /**
     * @param {?} bodyNode
     * @param {?} _driver
     * @param {?} normalizer
     */
    constructor(bodyNode, _driver, normalizer) {
        this.bodyNode = bodyNode;
        this._driver = _driver;
        this._triggerCache = {};
        this.onRemovalComplete = (element, context) => { };
        this._transitionEngine = new TransitionAnimationEngine(bodyNode, _driver, normalizer);
        this._timelineEngine = new TimelineAnimationEngine(bodyNode, _driver, normalizer);
        this._transitionEngine.onRemovalComplete = (element, context) => this.onRemovalComplete(element, context);
    }
    /**
     * @param {?} componentId
     * @param {?} namespaceId
     * @param {?} hostElement
     * @param {?} name
     * @param {?} metadata
     * @return {?}
     */
    registerTrigger(componentId, namespaceId, hostElement, name, metadata) {
        /** @type {?} */
        const cacheKey = componentId + '-' + name;
        /** @type {?} */
        let trigger = this._triggerCache[cacheKey];
        if (!trigger) {
            /** @type {?} */
            const errors = [];
            /** @type {?} */
            const ast = /** @type {?} */ (buildAnimationAst(this._driver, /** @type {?} */ (metadata), errors));
            if (errors.length) {
                throw new Error(`The animation trigger "${name}" has failed to build due to the following errors:\n - ${errors.join("\n - ")}`);
            }
            trigger = buildTrigger(name, ast);
            this._triggerCache[cacheKey] = trigger;
        }
        this._transitionEngine.registerTrigger(namespaceId, name, trigger);
    }
    /**
     * @param {?} namespaceId
     * @param {?} hostElement
     * @return {?}
     */
    register(namespaceId, hostElement) {
        this._transitionEngine.register(namespaceId, hostElement);
    }
    /**
     * @param {?} namespaceId
     * @param {?} context
     * @return {?}
     */
    destroy(namespaceId, context) {
        this._transitionEngine.destroy(namespaceId, context);
    }
    /**
     * @param {?} namespaceId
     * @param {?} element
     * @param {?} parent
     * @param {?} insertBefore
     * @return {?}
     */
    onInsert(namespaceId, element, parent, insertBefore) {
        this._transitionEngine.insertNode(namespaceId, element, parent, insertBefore);
    }
    /**
     * @param {?} namespaceId
     * @param {?} element
     * @param {?} context
     * @return {?}
     */
    onRemove(namespaceId, element, context) {
        this._transitionEngine.removeNode(namespaceId, element, context);
    }
    /**
     * @param {?} element
     * @param {?} disable
     * @return {?}
     */
    disableAnimations(element, disable) {
        this._transitionEngine.markElementAsDisabled(element, disable);
    }
    /**
     * @param {?} namespaceId
     * @param {?} element
     * @param {?} property
     * @param {?} value
     * @return {?}
     */
    process(namespaceId, element, property, value) {
        if (property.charAt(0) == '@') {
            const [id, action] = parseTimelineCommand(property);
            /** @type {?} */
            const args = /** @type {?} */ (value);
            this._timelineEngine.command(id, element, action, args);
        }
        else {
            this._transitionEngine.trigger(namespaceId, element, property, value);
        }
    }
    /**
     * @param {?} namespaceId
     * @param {?} element
     * @param {?} eventName
     * @param {?} eventPhase
     * @param {?} callback
     * @return {?}
     */
    listen(namespaceId, element, eventName, eventPhase, callback) {
        // @@listen
        if (eventName.charAt(0) == '@') {
            const [id, action] = parseTimelineCommand(eventName);
            return this._timelineEngine.listen(id, element, action, callback);
        }
        return this._transitionEngine.listen(namespaceId, element, eventName, eventPhase, callback);
    }
    /**
     * @param {?=} microtaskId
     * @return {?}
     */
    flush(microtaskId = -1) { this._transitionEngine.flush(microtaskId); }
    /**
     * @return {?}
     */
    get players() {
        return (/** @type {?} */ (this._transitionEngine.players))
            .concat(/** @type {?} */ (this._timelineEngine.players));
    }
    /**
     * @return {?}
     */
    whenRenderingDone() { return this._transitionEngine.whenRenderingDone(); }
}
if (false) {
    /** @type {?} */
    AnimationEngine.prototype._transitionEngine;
    /** @type {?} */
    AnimationEngine.prototype._timelineEngine;
    /** @type {?} */
    AnimationEngine.prototype._triggerCache;
    /** @type {?} */
    AnimationEngine.prototype.onRemovalComplete;
    /** @type {?} */
    AnimationEngine.prototype.bodyNode;
    /** @type {?} */
    AnimationEngine.prototype._driver;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5pbWF0aW9uX2VuZ2luZV9uZXh0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5pbWF0aW9ucy9icm93c2VyL3NyYy9yZW5kZXIvYW5pbWF0aW9uX2VuZ2luZV9uZXh0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFTQSxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUMvRCxPQUFPLEVBQW1CLFlBQVksRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBSXhFLE9BQU8sRUFBQyxvQkFBb0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUM5QyxPQUFPLEVBQUMsdUJBQXVCLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUNwRSxPQUFPLEVBQUMseUJBQXlCLEVBQUMsTUFBTSwrQkFBK0IsQ0FBQztBQUV4RSxNQUFNLE9BQU8sZUFBZTs7Ozs7O0lBUzFCLFlBQ1ksVUFBdUIsT0FBd0IsRUFDdkQsVUFBb0M7UUFENUIsYUFBUSxHQUFSLFFBQVE7UUFBZSxZQUFPLEdBQVAsT0FBTyxDQUFpQjs2QkFOQSxFQUFFO2lDQUdsQyxDQUFDLE9BQVksRUFBRSxPQUFZLEVBQUUsRUFBRSxJQUFHO1FBSzNELElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLHlCQUF5QixDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDdEYsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLHVCQUF1QixDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFFbEYsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGlCQUFpQixHQUFHLENBQUMsT0FBWSxFQUFFLE9BQVksRUFBRSxFQUFFLENBQ3RFLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDOUM7Ozs7Ozs7OztJQUVELGVBQWUsQ0FDWCxXQUFtQixFQUFFLFdBQW1C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QUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztTQUNuRTtRQUNELE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7S0FDN0Y7Ozs7O0lBRUQsS0FBSyxDQUFDLGNBQXNCLENBQUMsQ0FBQyxJQUFVLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUMsRUFBRTs7OztJQUVwRixJQUFJLE9BQU87UUFDVCxPQUFPLG1CQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxPQUE0QixFQUFDO2FBQ3ZELE1BQU0sbUJBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUE0QixFQUFDLENBQUM7S0FDaEU7Ozs7SUFFRCxpQkFBaUIsS0FBbUIsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxFQUFFO0NBQ3pGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtBbmltYXRpb25NZXRhZGF0YSwgQW5pbWF0aW9uUGxheWVyLCBBbmltYXRpb25UcmlnZ2VyTWV0YWRhdGF9IGZyb20gJ0Bhbmd1bGFyL2FuaW1hdGlvbnMnO1xuaW1wb3J0IHtUcmlnZ2VyQXN0fSBmcm9tICcuLi9kc2wvYW5pbWF0aW9uX2FzdCc7XG5pbXBvcnQge2J1aWxkQW5pbWF0aW9uQXN0fSBmcm9tICcuLi9kc2wvYW5pbWF0aW9uX2FzdF9idWlsZGVyJztcbmltcG9ydCB7QW5pbWF0aW9uVHJpZ2dlciwgYnVpbGRUcmlnZ2VyfSBmcm9tICcuLi9kc2wvYW5pbWF0aW9uX3RyaWdnZXInO1xuaW1wb3J0IHtBbmltYXRpb25TdHlsZU5vcm1hbGl6ZXJ9IGZyb20gJy4uL2RzbC9zdHlsZV9ub3JtYWxpemF0aW9uL2FuaW1hdGlvbl9zdHlsZV9ub3JtYWxpemVyJztcblxuaW1wb3J0IHtBbmltYXRpb25Ecml2ZXJ9IGZyb20gJy4vYW5pbWF0aW9uX2RyaXZlcic7XG5pbXBvcnQge3BhcnNlVGltZWxpbmVDb21tYW5kfSBmcm9tICcuL3NoYXJlZCc7XG5pbXBvcnQge1RpbWVsaW5lQW5pbWF0aW9uRW5naW5lfSBmcm9tICcuL3RpbWVsaW5lX2FuaW1hdGlvbl9lbmdpbmUnO1xuaW1wb3J0IHtUcmFuc2l0aW9uQW5pbWF0aW9uRW5naW5lfSBmcm9tICcuL3RyYW5zaXRpb25fYW5pbWF0aW9uX2VuZ2luZSc7XG5cbmV4cG9ydCBjbGFzcyBBbmltYXRpb25FbmdpbmUge1xuICBwcml2YXRlIF90cmFuc2l0aW9uRW5naW5lOiBUcmFuc2l0aW9uQW5pbWF0aW9uRW5naW5lO1xuICBwcml2YXRlIF90aW1lbGluZUVuZ2luZTogVGltZWxpbmVBbmltYXRpb25FbmdpbmU7XG5cbiAgcHJpdmF0ZSBfdHJpZ2dlckNhY2hlOiB7W2tleTogc3RyaW5nXTogQW5pbWF0aW9uVHJpZ2dlcn0gPSB7fTtcblxuICAvLyB0aGlzIG1ldGhvZCBpcyBkZXNpZ25lZCB0byBiZSBvdmVycmlkZGVuIGJ5IHRoZSBjb2RlIHRoYXQgdXNlcyB0aGlzIGVuZ2luZVxuICBwdWJsaWMgb25SZW1vdmFsQ29tcGxldGUgPSAoZWxlbWVudDogYW55LCBjb250ZXh0OiBhbnkpID0+IHt9O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBib2R5Tm9kZTogYW55LCBwcml2YXRlIF9kcml2ZXI6IEFuaW1hdGlvbkRyaXZlcixcbiAgICAgIG5vcm1hbGl6ZXI6IEFuaW1hdGlvblN0eWxlTm9ybWFsaXplcikge1xuICAgIHRoaXMuX3RyYW5zaXRpb25FbmdpbmUgPSBuZXcgVHJhbnNpdGlvbkFuaW1hdGlvbkVuZ2luZShib2R5Tm9kZSwgX2RyaXZlciwgbm9ybWFsaXplcik7XG4gICAgdGhpcy5fdGltZWxpbmVFbmdpbmUgPSBuZXcgVGltZWxpbmVBbmltYXRpb25FbmdpbmUoYm9keU5vZGUsIF9kcml2ZXIsIG5vcm1hbGl6ZXIpO1xuXG4gICAgdGhpcy5fdHJhbnNpdGlvbkVuZ2luZS5vblJlbW92YWxDb21wbGV0ZSA9IChlbGVtZW50OiBhbnksIGNvbnRleHQ6IGFueSkgPT5cbiAgICAgICAgdGhpcy5vblJlbW92YWxDb21wbGV0ZShlbGVtZW50LCBjb250ZXh0KTtcbiAgfVxuXG4gIHJlZ2lzdGVyVHJpZ2dlcihcbiAgICAgIGNvbXBvbmVudElkOiBzdHJpbmcsIG5hbWVzcGFjZUlkOiBzdHJpbmcsIGhvc3RFbGVtZW50OiBhbnksIG5hbWU6IHN0cmluZyxcbiAgICAgIG1ldGFkYXRhOiBBbmltYXRpb25UcmlnZ2VyTWV0YWRhdGEpOiB2b2lkIHtcbiAgICBjb25zdCBjYWNoZUtleSA9IGNvbXBvbmVudElkICsgJy0nICsgbmFtZTtcbiAgICBsZXQgdHJpZ2dlciA9IHRoaXMuX3RyaWdnZXJDYWNoZVtjYWNoZUtleV07XG4gICAgaWYgKCF0cmlnZ2VyKSB7XG4gICAgICBjb25zdCBlcnJvcnM6IGFueVtdID0gW107XG4gICAgICBjb25zdCBhc3QgPVxuICAgICAgICAgIGJ1aWxkQW5pbWF0aW9uQXN0KHRoaXMuX2RyaXZlciwgbWV0YWRhdGEgYXMgQW5pbWF0aW9uTWV0YWRhdGEsIGVycm9ycykgYXMgVHJpZ2dlckFzdDtcbiAgICAgIGlmIChlcnJvcnMubGVuZ3RoKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgIGBUaGUgYW5pbWF0aW9uIHRyaWdnZXIgXCIke25hbWV9XCIgaGFzIGZhaWxlZCB0byBidWlsZCBkdWUgdG8gdGhlIGZvbGxvd2luZyBlcnJvcnM6XFxuIC0gJHtlcnJvcnMuam9pbihcIlxcbiAtIFwiKX1gKTtcbiAgICAgIH1cbiAgICAgIHRyaWdnZXIgPSBidWlsZFRyaWdnZXIobmFtZSwgYXN0KTtcbiAgICAgIHRoaXMuX3RyaWdnZXJDYWNoZVtjYWNoZUtleV0gPSB0cmlnZ2VyO1xuICAgIH1cbiAgICB0aGlzLl90cmFuc2l0aW9uRW5naW5lLnJlZ2lzdGVyVHJpZ2dlcihuYW1lc3BhY2VJZCwgbmFtZSwgdHJpZ2dlcik7XG4gIH1cblxuICByZWdpc3RlcihuYW1lc3BhY2VJZDogc3RyaW5nLCBob3N0RWxlbWVudDogYW55KSB7XG4gICAgdGhpcy5fdHJhbnNpdGlvbkVuZ2luZS5yZWdpc3RlcihuYW1lc3BhY2VJZCwgaG9zdEVsZW1lbnQpO1xuICB9XG5cbiAgZGVzdHJveShuYW1lc3BhY2VJZDogc3RyaW5nLCBjb250ZXh0OiBhbnkpIHtcbiAgICB0aGlzLl90cmFuc2l0aW9uRW5naW5lLmRlc3Ryb3kobmFtZXNwYWNlSWQsIGNvbnRleHQpO1xuICB9XG5cbiAgb25JbnNlcnQobmFtZXNwYWNlSWQ6IHN0cmluZywgZWxlbWVudDogYW55LCBwYXJlbnQ6IGFueSwgaW5zZXJ0QmVmb3JlOiBib29sZWFuKTogdm9pZCB7XG4gICAgdGhpcy5fdHJhbnNpdGlvbkVuZ2luZS5pbnNlcnROb2RlKG5hbWVzcGFjZUlkLCBlbGVtZW50LCBwYXJlbnQsIGluc2VydEJlZm9yZSk7XG4gIH1cblxuICBvblJlbW92ZShuYW1lc3BhY2VJZDogc3RyaW5nLCBlbGVtZW50OiBhbnksIGNvbnRleHQ6IGFueSk6IHZvaWQge1xuICAgIHRoaXMuX3RyYW5zaXRpb25FbmdpbmUucmVtb3ZlTm9kZShuYW1lc3BhY2VJZCwgZWxlbWVudCwgY29udGV4dCk7XG4gIH1cblxuICBkaXNhYmxlQW5pbWF0aW9ucyhlbGVtZW50OiBhbnksIGRpc2FibGU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl90cmFuc2l0aW9uRW5naW5lLm1hcmtFbGVtZW50QXNEaXNhYmxlZChlbGVtZW50LCBkaXNhYmxlKTtcbiAgfVxuXG4gIHByb2Nlc3MobmFtZXNwYWNlSWQ6IHN0cmluZywgZWxlbWVudDogYW55LCBwcm9wZXJ0eTogc3RyaW5nLCB2YWx1ZTogYW55KSB7XG4gICAgaWYgKHByb3BlcnR5LmNoYXJBdCgwKSA9PSAnQCcpIHtcbiAgICAgIGNvbnN0IFtpZCwgYWN0aW9uXSA9IHBhcnNlVGltZWxpbmVDb21tYW5kKHByb3BlcnR5KTtcbiAgICAgIGNvbnN0IGFyZ3MgPSB2YWx1ZSBhcyBhbnlbXTtcbiAgICAgIHRoaXMuX3RpbWVsaW5lRW5naW5lLmNvbW1hbmQoaWQsIGVsZW1lbnQsIGFjdGlvbiwgYXJncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3RyYW5zaXRpb25FbmdpbmUudHJpZ2dlcihuYW1lc3BhY2VJZCwgZWxlbWVudCwgcHJvcGVydHksIHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICBsaXN0ZW4oXG4gICAgICBuYW1lc3BhY2VJZDogc3RyaW5nLCBlbGVtZW50OiBhbnksIGV2ZW50TmFtZTogc3RyaW5nLCBldmVudFBoYXNlOiBzdHJpbmcsXG4gICAgICBjYWxsYmFjazogKGV2ZW50OiBhbnkpID0+IGFueSk6ICgpID0+IGFueSB7XG4gICAgLy8gQEBsaXN0ZW5cbiAgICBpZiAoZXZlbnROYW1lLmNoYXJBdCgwKSA9PSAnQCcpIHtcbiAgICAgIGNvbnN0IFtpZCwgYWN0aW9uXSA9IHBhcnNlVGltZWxpbmVDb21tYW5kKGV2ZW50TmFtZSk7XG4gICAgICByZXR1cm4gdGhpcy5fdGltZWxpbmVFbmdpbmUubGlzdGVuKGlkLCBlbGVtZW50LCBhY3Rpb24sIGNhbGxiYWNrKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX3RyYW5zaXRpb25FbmdpbmUubGlzdGVuKG5hbWVzcGFjZUlkLCBlbGVtZW50LCBldmVudE5hbWUsIGV2ZW50UGhhc2UsIGNhbGxiYWNrKTtcbiAgfVxuXG4gIGZsdXNoKG1pY3JvdGFza0lkOiBudW1iZXIgPSAtMSk6IHZvaWQgeyB0aGlzLl90cmFuc2l0aW9uRW5naW5lLmZsdXNoKG1pY3JvdGFza0lkKTsgfVxuXG4gIGdldCBwbGF5ZXJzKCk6IEFuaW1hdGlvblBsYXllcltdIHtcbiAgICByZXR1cm4gKHRoaXMuX3RyYW5zaXRpb25FbmdpbmUucGxheWVycyBhcyBBbmltYXRpb25QbGF5ZXJbXSlcbiAgICAgICAgLmNvbmNhdCh0aGlzLl90aW1lbGluZUVuZ2luZS5wbGF5ZXJzIGFzIEFuaW1hdGlvblBsYXllcltdKTtcbiAgfVxuXG4gIHdoZW5SZW5kZXJpbmdEb25lKCk6IFByb21pc2U8YW55PiB7IHJldHVybiB0aGlzLl90cmFuc2l0aW9uRW5naW5lLndoZW5SZW5kZXJpbmdEb25lKCk7IH1cbn1cbiJdfQ==
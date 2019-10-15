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
import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
/**
 * \@ngModule CommonModule
 *
 * \@description
 *
 * Inserts an embedded view from a prepared `TemplateRef`.
 *
 * You can attach a context object to the `EmbeddedViewRef` by setting `[ngTemplateOutletContext]`.
 * `[ngTemplateOutletContext]` should be an object, the object's keys will be available for binding
 * by the local template `let` declarations.
 *
 * \@usageNotes
 * ```
 * <ng-container *ngTemplateOutlet="templateRefExp; context: contextExp"></ng-container>
 * ```
 *
 * Using the key `$implicit` in the context object will set its value as default.
 *
 * ### Example
 *
 * {\@example common/ngTemplateOutlet/ts/module.ts region='NgTemplateOutlet'}
 *
 * \@publicApi
 */
export class NgTemplateOutlet {
    /**
     * @param {?} _viewContainerRef
     */
    constructor(_viewContainerRef) {
        this._viewContainerRef = _viewContainerRef;
    }
    /**
     * @param {?} changes
     * @return {?}
     */
    ngOnChanges(changes) {
        /** @type {?} */
        const recreateView = this._shouldRecreateView(changes);
        if (recreateView) {
            if (this._viewRef) {
                this._viewContainerRef.remove(this._viewContainerRef.indexOf(this._viewRef));
            }
            if (this.ngTemplateOutlet) {
                this._viewRef = this._viewContainerRef.createEmbeddedView(this.ngTemplateOutlet, this.ngTemplateOutletContext);
            }
        }
        else {
            if (this._viewRef && this.ngTemplateOutletContext) {
                this._updateExistingContext(this.ngTemplateOutletContext);
            }
        }
    }
    /**
     * We need to re-create existing embedded view if:
     * - templateRef has changed
     * - context has changes
     *
     * We mark context object as changed when the corresponding object
     * shape changes (new properties are added or existing properties are removed).
     * In other words we consider context with the same properties as "the same" even
     * if object reference changes (see https://github.com/angular/angular/issues/13407).
     * @param {?} changes
     * @return {?}
     */
    _shouldRecreateView(changes) {
        /** @type {?} */
        const ctxChange = changes['ngTemplateOutletContext'];
        return !!changes['ngTemplateOutlet'] || (ctxChange && this._hasContextShapeChanged(ctxChange));
    }
    /**
     * @param {?} ctxChange
     * @return {?}
     */
    _hasContextShapeChanged(ctxChange) {
        /** @type {?} */
        const prevCtxKeys = Object.keys(ctxChange.previousValue || {});
        /** @type {?} */
        const currCtxKeys = Object.keys(ctxChange.currentValue || {});
        if (prevCtxKeys.length === currCtxKeys.length) {
            for (let propName of currCtxKeys) {
                if (prevCtxKeys.indexOf(propName) === -1) {
                    return true;
                }
            }
            return false;
        }
        else {
            return true;
        }
    }
    /**
     * @param {?} ctx
     * @return {?}
     */
    _updateExistingContext(ctx) {
        for (let propName of Object.keys(ctx)) {
            (/** @type {?} */ (this._viewRef.context))[propName] = (/** @type {?} */ (this.ngTemplateOutletContext))[propName];
        }
    }
}
NgTemplateOutlet.decorators = [
    { type: Directive, args: [{ selector: '[ngTemplateOutlet]' },] }
];
/** @nocollapse */
NgTemplateOutlet.ctorParameters = () => [
    { type: ViewContainerRef }
];
NgTemplateOutlet.propDecorators = {
    ngTemplateOutletContext: [{ type: Input }],
    ngTemplateOutlet: [{ type: Input }]
};
if (false) {
    /** @type {?} */
    NgTemplateOutlet.prototype._viewRef;
    /** @type {?} */
    NgTemplateOutlet.prototype.ngTemplateOutletContext;
    /** @type {?} */
    NgTemplateOutlet.prototype.ngTemplateOutlet;
    /** @type {?} */
    NgTemplateOutlet.prototype._viewContainerRef;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfdGVtcGxhdGVfb3V0bGV0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tbW9uL3NyYy9kaXJlY3RpdmVzL25nX3RlbXBsYXRlX291dGxldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxTQUFTLEVBQW1CLEtBQUssRUFBMEMsV0FBVyxFQUFFLGdCQUFnQixFQUFDLE1BQU0sZUFBZSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBMkJ2SSxNQUFNLE9BQU8sZ0JBQWdCOzs7O0lBVTNCLFlBQW9CLGlCQUFtQztRQUFuQyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQWtCO0tBQUk7Ozs7O0lBRTNELFdBQVcsQ0FBQyxPQUFzQjs7UUFDaEMsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRXZELElBQUksWUFBWSxFQUFFO1lBQ2hCLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRTtnQkFDakIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO2FBQzlFO1lBRUQsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEVBQUU7Z0JBQ3pCLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGtCQUFrQixDQUNyRCxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLHVCQUF1QixDQUFDLENBQUM7YUFDMUQ7U0FDRjthQUFNO1lBQ0wsSUFBSSxJQUFJLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyx1QkFBdUIsRUFBRTtnQkFDakQsSUFBSSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO2FBQzNEO1NBQ0Y7S0FDRjs7Ozs7Ozs7Ozs7OztJQVlPLG1CQUFtQixDQUFDLE9BQXNCOztRQUNoRCxNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUNyRCxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsdUJBQXVCLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQzs7Ozs7O0lBR3pGLHVCQUF1QixDQUFDLFNBQXVCOztRQUNyRCxNQUFNLFdBQVcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLElBQUksRUFBRSxDQUFDLENBQUM7O1FBQy9ELE1BQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksSUFBSSxFQUFFLENBQUMsQ0FBQztRQUU5RCxJQUFJLFdBQVcsQ0FBQyxNQUFNLEtBQUssV0FBVyxDQUFDLE1BQU0sRUFBRTtZQUM3QyxLQUFLLElBQUksUUFBUSxJQUFJLFdBQVcsRUFBRTtnQkFDaEMsSUFBSSxXQUFXLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFO29CQUN4QyxPQUFPLElBQUksQ0FBQztpQkFDYjthQUNGO1lBQ0QsT0FBTyxLQUFLLENBQUM7U0FDZDthQUFNO1lBQ0wsT0FBTyxJQUFJLENBQUM7U0FDYjs7Ozs7O0lBR0ssc0JBQXNCLENBQUMsR0FBVztRQUN4QyxLQUFLLElBQUksUUFBUSxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDckMsbUJBQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxtQkFBTSxJQUFJLENBQUMsdUJBQXVCLEVBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUN4Rjs7OztZQWxFSixTQUFTLFNBQUMsRUFBQyxRQUFRLEVBQUUsb0JBQW9CLEVBQUM7Ozs7WUExQnFELGdCQUFnQjs7O3NDQWdDN0csS0FBSzsrQkFHTCxLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RpcmVjdGl2ZSwgRW1iZWRkZWRWaWV3UmVmLCBJbnB1dCwgT25DaGFuZ2VzLCBTaW1wbGVDaGFuZ2UsIFNpbXBsZUNoYW5nZXMsIFRlbXBsYXRlUmVmLCBWaWV3Q29udGFpbmVyUmVmfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuLyoqXG4gKiBAbmdNb2R1bGUgQ29tbW9uTW9kdWxlXG4gKlxuICogQGRlc2NyaXB0aW9uXG4gKlxuICogSW5zZXJ0cyBhbiBlbWJlZGRlZCB2aWV3IGZyb20gYSBwcmVwYXJlZCBgVGVtcGxhdGVSZWZgLlxuICpcbiAqIFlvdSBjYW4gYXR0YWNoIGEgY29udGV4dCBvYmplY3QgdG8gdGhlIGBFbWJlZGRlZFZpZXdSZWZgIGJ5IHNldHRpbmcgYFtuZ1RlbXBsYXRlT3V0bGV0Q29udGV4dF1gLlxuICogYFtuZ1RlbXBsYXRlT3V0bGV0Q29udGV4dF1gIHNob3VsZCBiZSBhbiBvYmplY3QsIHRoZSBvYmplY3QncyBrZXlzIHdpbGwgYmUgYXZhaWxhYmxlIGZvciBiaW5kaW5nXG4gKiBieSB0aGUgbG9jYWwgdGVtcGxhdGUgYGxldGAgZGVjbGFyYXRpb25zLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKiBgYGBcbiAqIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJ0ZW1wbGF0ZVJlZkV4cDsgY29udGV4dDogY29udGV4dEV4cFwiPjwvbmctY29udGFpbmVyPlxuICogYGBgXG4gKlxuICogVXNpbmcgdGhlIGtleSBgJGltcGxpY2l0YCBpbiB0aGUgY29udGV4dCBvYmplY3Qgd2lsbCBzZXQgaXRzIHZhbHVlIGFzIGRlZmF1bHQuXG4gKlxuICogIyMjIEV4YW1wbGVcbiAqXG4gKiB7QGV4YW1wbGUgY29tbW9uL25nVGVtcGxhdGVPdXRsZXQvdHMvbW9kdWxlLnRzIHJlZ2lvbj0nTmdUZW1wbGF0ZU91dGxldCd9XG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5ARGlyZWN0aXZlKHtzZWxlY3RvcjogJ1tuZ1RlbXBsYXRlT3V0bGV0XSd9KVxuZXhwb3J0IGNsYXNzIE5nVGVtcGxhdGVPdXRsZXQgaW1wbGVtZW50cyBPbkNoYW5nZXMge1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgcHJpdmF0ZSBfdmlld1JlZiAhOiBFbWJlZGRlZFZpZXdSZWY8YW55PjtcblxuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgQElucHV0KCkgcHVibGljIG5nVGVtcGxhdGVPdXRsZXRDb250ZXh0ICE6IE9iamVjdDtcblxuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgQElucHV0KCkgcHVibGljIG5nVGVtcGxhdGVPdXRsZXQgITogVGVtcGxhdGVSZWY8YW55PjtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF92aWV3Q29udGFpbmVyUmVmOiBWaWV3Q29udGFpbmVyUmVmKSB7fVxuXG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpIHtcbiAgICBjb25zdCByZWNyZWF0ZVZpZXcgPSB0aGlzLl9zaG91bGRSZWNyZWF0ZVZpZXcoY2hhbmdlcyk7XG5cbiAgICBpZiAocmVjcmVhdGVWaWV3KSB7XG4gICAgICBpZiAodGhpcy5fdmlld1JlZikge1xuICAgICAgICB0aGlzLl92aWV3Q29udGFpbmVyUmVmLnJlbW92ZSh0aGlzLl92aWV3Q29udGFpbmVyUmVmLmluZGV4T2YodGhpcy5fdmlld1JlZikpO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5uZ1RlbXBsYXRlT3V0bGV0KSB7XG4gICAgICAgIHRoaXMuX3ZpZXdSZWYgPSB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmNyZWF0ZUVtYmVkZGVkVmlldyhcbiAgICAgICAgICAgIHRoaXMubmdUZW1wbGF0ZU91dGxldCwgdGhpcy5uZ1RlbXBsYXRlT3V0bGV0Q29udGV4dCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLl92aWV3UmVmICYmIHRoaXMubmdUZW1wbGF0ZU91dGxldENvbnRleHQpIHtcbiAgICAgICAgdGhpcy5fdXBkYXRlRXhpc3RpbmdDb250ZXh0KHRoaXMubmdUZW1wbGF0ZU91dGxldENvbnRleHQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBXZSBuZWVkIHRvIHJlLWNyZWF0ZSBleGlzdGluZyBlbWJlZGRlZCB2aWV3IGlmOlxuICAgKiAtIHRlbXBsYXRlUmVmIGhhcyBjaGFuZ2VkXG4gICAqIC0gY29udGV4dCBoYXMgY2hhbmdlc1xuICAgKlxuICAgKiBXZSBtYXJrIGNvbnRleHQgb2JqZWN0IGFzIGNoYW5nZWQgd2hlbiB0aGUgY29ycmVzcG9uZGluZyBvYmplY3RcbiAgICogc2hhcGUgY2hhbmdlcyAobmV3IHByb3BlcnRpZXMgYXJlIGFkZGVkIG9yIGV4aXN0aW5nIHByb3BlcnRpZXMgYXJlIHJlbW92ZWQpLlxuICAgKiBJbiBvdGhlciB3b3JkcyB3ZSBjb25zaWRlciBjb250ZXh0IHdpdGggdGhlIHNhbWUgcHJvcGVydGllcyBhcyBcInRoZSBzYW1lXCIgZXZlblxuICAgKiBpZiBvYmplY3QgcmVmZXJlbmNlIGNoYW5nZXMgKHNlZSBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyL2lzc3Vlcy8xMzQwNykuXG4gICAqL1xuICBwcml2YXRlIF9zaG91bGRSZWNyZWF0ZVZpZXcoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGN0eENoYW5nZSA9IGNoYW5nZXNbJ25nVGVtcGxhdGVPdXRsZXRDb250ZXh0J107XG4gICAgcmV0dXJuICEhY2hhbmdlc1snbmdUZW1wbGF0ZU91dGxldCddIHx8IChjdHhDaGFuZ2UgJiYgdGhpcy5faGFzQ29udGV4dFNoYXBlQ2hhbmdlZChjdHhDaGFuZ2UpKTtcbiAgfVxuXG4gIHByaXZhdGUgX2hhc0NvbnRleHRTaGFwZUNoYW5nZWQoY3R4Q2hhbmdlOiBTaW1wbGVDaGFuZ2UpOiBib29sZWFuIHtcbiAgICBjb25zdCBwcmV2Q3R4S2V5cyA9IE9iamVjdC5rZXlzKGN0eENoYW5nZS5wcmV2aW91c1ZhbHVlIHx8IHt9KTtcbiAgICBjb25zdCBjdXJyQ3R4S2V5cyA9IE9iamVjdC5rZXlzKGN0eENoYW5nZS5jdXJyZW50VmFsdWUgfHwge30pO1xuXG4gICAgaWYgKHByZXZDdHhLZXlzLmxlbmd0aCA9PT0gY3VyckN0eEtleXMubGVuZ3RoKSB7XG4gICAgICBmb3IgKGxldCBwcm9wTmFtZSBvZiBjdXJyQ3R4S2V5cykge1xuICAgICAgICBpZiAocHJldkN0eEtleXMuaW5kZXhPZihwcm9wTmFtZSkgPT09IC0xKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfdXBkYXRlRXhpc3RpbmdDb250ZXh0KGN0eDogT2JqZWN0KTogdm9pZCB7XG4gICAgZm9yIChsZXQgcHJvcE5hbWUgb2YgT2JqZWN0LmtleXMoY3R4KSkge1xuICAgICAgKDxhbnk+dGhpcy5fdmlld1JlZi5jb250ZXh0KVtwcm9wTmFtZV0gPSAoPGFueT50aGlzLm5nVGVtcGxhdGVPdXRsZXRDb250ZXh0KVtwcm9wTmFtZV07XG4gICAgfVxuICB9XG59XG4iXX0=
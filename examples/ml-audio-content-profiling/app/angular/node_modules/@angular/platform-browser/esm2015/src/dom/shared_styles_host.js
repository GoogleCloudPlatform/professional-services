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
import { Inject, Injectable } from '@angular/core';
import { getDOM } from './dom_adapter';
import { DOCUMENT } from './dom_tokens';
export class SharedStylesHost {
    constructor() {
        /**
         * \@internal
         */
        this._stylesSet = new Set();
    }
    /**
     * @param {?} styles
     * @return {?}
     */
    addStyles(styles) {
        /** @type {?} */
        const additions = new Set();
        styles.forEach(style => {
            if (!this._stylesSet.has(style)) {
                this._stylesSet.add(style);
                additions.add(style);
            }
        });
        this.onStylesAdded(additions);
    }
    /**
     * @param {?} additions
     * @return {?}
     */
    onStylesAdded(additions) { }
    /**
     * @return {?}
     */
    getAllStyles() { return Array.from(this._stylesSet); }
}
SharedStylesHost.decorators = [
    { type: Injectable }
];
if (false) {
    /**
     * \@internal
     * @type {?}
     */
    SharedStylesHost.prototype._stylesSet;
}
export class DomSharedStylesHost extends SharedStylesHost {
    /**
     * @param {?} _doc
     */
    constructor(_doc) {
        super();
        this._doc = _doc;
        this._hostNodes = new Set();
        this._styleNodes = new Set();
        this._hostNodes.add(_doc.head);
    }
    /**
     * @param {?} styles
     * @param {?} host
     * @return {?}
     */
    _addStylesToHost(styles, host) {
        styles.forEach((style) => {
            /** @type {?} */
            const styleEl = this._doc.createElement('style');
            styleEl.textContent = style;
            this._styleNodes.add(host.appendChild(styleEl));
        });
    }
    /**
     * @param {?} hostNode
     * @return {?}
     */
    addHost(hostNode) {
        this._addStylesToHost(this._stylesSet, hostNode);
        this._hostNodes.add(hostNode);
    }
    /**
     * @param {?} hostNode
     * @return {?}
     */
    removeHost(hostNode) { this._hostNodes.delete(hostNode); }
    /**
     * @param {?} additions
     * @return {?}
     */
    onStylesAdded(additions) {
        this._hostNodes.forEach(hostNode => this._addStylesToHost(additions, hostNode));
    }
    /**
     * @return {?}
     */
    ngOnDestroy() { this._styleNodes.forEach(styleNode => getDOM().remove(styleNode)); }
}
DomSharedStylesHost.decorators = [
    { type: Injectable }
];
/** @nocollapse */
DomSharedStylesHost.ctorParameters = () => [
    { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] }
];
if (false) {
    /** @type {?} */
    DomSharedStylesHost.prototype._hostNodes;
    /** @type {?} */
    DomSharedStylesHost.prototype._styleNodes;
    /** @type {?} */
    DomSharedStylesHost.prototype._doc;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmVkX3N0eWxlc19ob3N0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvcGxhdGZvcm0tYnJvd3Nlci9zcmMvZG9tL3NoYXJlZF9zdHlsZXNfaG9zdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxNQUFNLEVBQUUsVUFBVSxFQUFZLE1BQU0sZUFBZSxDQUFDO0FBQzVELE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDckMsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUd0QyxNQUFNLE9BQU8sZ0JBQWdCOzs7OztRQUUzQixrQkFBdUIsSUFBSSxHQUFHLEVBQVUsQ0FBQzs7Ozs7O0lBRXpDLFNBQVMsQ0FBQyxNQUFnQjs7UUFDeEIsTUFBTSxTQUFTLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztRQUNwQyxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQ3JCLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDL0IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzNCLFNBQVMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDdEI7U0FDRixDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0tBQy9COzs7OztJQUVELGFBQWEsQ0FBQyxTQUFzQixLQUFVOzs7O0lBRTlDLFlBQVksS0FBZSxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUU7OztZQWxCakUsVUFBVTs7Ozs7Ozs7O0FBc0JYLE1BQU0sT0FBTyxtQkFBb0IsU0FBUSxnQkFBZ0I7Ozs7SUFHdkQsWUFBc0MsSUFBUztRQUM3QyxLQUFLLEVBQUUsQ0FBQztRQUQ0QixTQUFJLEdBQUosSUFBSSxDQUFLOzBCQUYxQixJQUFJLEdBQUcsRUFBUTsyQkFDZCxJQUFJLEdBQUcsRUFBUTtRQUduQyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDaEM7Ozs7OztJQUVPLGdCQUFnQixDQUFDLE1BQW1CLEVBQUUsSUFBVTtRQUN0RCxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBYSxFQUFFLEVBQUU7O1lBQy9CLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2pELE9BQU8sQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO1lBQzVCLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztTQUNqRCxDQUFDLENBQUM7Ozs7OztJQUdMLE9BQU8sQ0FBQyxRQUFjO1FBQ3BCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ2pELElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0tBQy9COzs7OztJQUVELFVBQVUsQ0FBQyxRQUFjLElBQVUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRTs7Ozs7SUFFdEUsYUFBYSxDQUFDLFNBQXNCO1FBQ2xDLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO0tBQ2pGOzs7O0lBRUQsV0FBVyxLQUFXLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRTs7O1lBNUIzRixVQUFVOzs7OzRDQUlJLE1BQU0sU0FBQyxRQUFRIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdCwgSW5qZWN0YWJsZSwgT25EZXN0cm95fSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7Z2V0RE9NfSBmcm9tICcuL2RvbV9hZGFwdGVyJztcbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJy4vZG9tX3Rva2Vucyc7XG5cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBTaGFyZWRTdHlsZXNIb3N0IHtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBwcm90ZWN0ZWQgX3N0eWxlc1NldCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGFkZFN0eWxlcyhzdHlsZXM6IHN0cmluZ1tdKTogdm9pZCB7XG4gICAgY29uc3QgYWRkaXRpb25zID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgc3R5bGVzLmZvckVhY2goc3R5bGUgPT4ge1xuICAgICAgaWYgKCF0aGlzLl9zdHlsZXNTZXQuaGFzKHN0eWxlKSkge1xuICAgICAgICB0aGlzLl9zdHlsZXNTZXQuYWRkKHN0eWxlKTtcbiAgICAgICAgYWRkaXRpb25zLmFkZChzdHlsZSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy5vblN0eWxlc0FkZGVkKGFkZGl0aW9ucyk7XG4gIH1cblxuICBvblN0eWxlc0FkZGVkKGFkZGl0aW9uczogU2V0PHN0cmluZz4pOiB2b2lkIHt9XG5cbiAgZ2V0QWxsU3R5bGVzKCk6IHN0cmluZ1tdIHsgcmV0dXJuIEFycmF5LmZyb20odGhpcy5fc3R5bGVzU2V0KTsgfVxufVxuXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgRG9tU2hhcmVkU3R5bGVzSG9zdCBleHRlbmRzIFNoYXJlZFN0eWxlc0hvc3QgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICBwcml2YXRlIF9ob3N0Tm9kZXMgPSBuZXcgU2V0PE5vZGU+KCk7XG4gIHByaXZhdGUgX3N0eWxlTm9kZXMgPSBuZXcgU2V0PE5vZGU+KCk7XG4gIGNvbnN0cnVjdG9yKEBJbmplY3QoRE9DVU1FTlQpIHByaXZhdGUgX2RvYzogYW55KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLl9ob3N0Tm9kZXMuYWRkKF9kb2MuaGVhZCk7XG4gIH1cblxuICBwcml2YXRlIF9hZGRTdHlsZXNUb0hvc3Qoc3R5bGVzOiBTZXQ8c3RyaW5nPiwgaG9zdDogTm9kZSk6IHZvaWQge1xuICAgIHN0eWxlcy5mb3JFYWNoKChzdHlsZTogc3RyaW5nKSA9PiB7XG4gICAgICBjb25zdCBzdHlsZUVsID0gdGhpcy5fZG9jLmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgICBzdHlsZUVsLnRleHRDb250ZW50ID0gc3R5bGU7XG4gICAgICB0aGlzLl9zdHlsZU5vZGVzLmFkZChob3N0LmFwcGVuZENoaWxkKHN0eWxlRWwpKTtcbiAgICB9KTtcbiAgfVxuXG4gIGFkZEhvc3QoaG9zdE5vZGU6IE5vZGUpOiB2b2lkIHtcbiAgICB0aGlzLl9hZGRTdHlsZXNUb0hvc3QodGhpcy5fc3R5bGVzU2V0LCBob3N0Tm9kZSk7XG4gICAgdGhpcy5faG9zdE5vZGVzLmFkZChob3N0Tm9kZSk7XG4gIH1cblxuICByZW1vdmVIb3N0KGhvc3ROb2RlOiBOb2RlKTogdm9pZCB7IHRoaXMuX2hvc3ROb2Rlcy5kZWxldGUoaG9zdE5vZGUpOyB9XG5cbiAgb25TdHlsZXNBZGRlZChhZGRpdGlvbnM6IFNldDxzdHJpbmc+KTogdm9pZCB7XG4gICAgdGhpcy5faG9zdE5vZGVzLmZvckVhY2goaG9zdE5vZGUgPT4gdGhpcy5fYWRkU3R5bGVzVG9Ib3N0KGFkZGl0aW9ucywgaG9zdE5vZGUpKTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCk6IHZvaWQgeyB0aGlzLl9zdHlsZU5vZGVzLmZvckVhY2goc3R5bGVOb2RlID0+IGdldERPTSgpLnJlbW92ZShzdHlsZU5vZGUpKTsgfVxufVxuIl19
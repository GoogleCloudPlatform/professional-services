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
import { AbstractControlDirective } from './abstract_control_directive';
/**
 * @return {?}
 */
function unimplemented() {
    throw new Error('unimplemented');
}
/**
 * \@description
 * A base class that all control `FormControl`-based directives extend. It binds a `FormControl`
 * object to a DOM element.
 *
 * \@publicApi
 * @abstract
 */
export class NgControl extends AbstractControlDirective {
    constructor() {
        super(...arguments);
        /**
         * \@description
         * The parent form for the control.
         *
         * \@internal
         */
        this._parent = null;
        /**
         * \@description
         * The name for the control
         */
        this.name = null;
        /**
         * \@description
         * The value accessor for the control
         */
        this.valueAccessor = null;
        /**
         * \@description
         * The uncomposed array of synchronous validators for the control
         *
         * \@internal
         */
        this._rawValidators = [];
        /**
         * \@description
         * The uncomposed array of async validators for the control
         *
         * \@internal
         */
        this._rawAsyncValidators = [];
    }
    /**
     * \@description
     * The registered synchronous validator function for the control
     *
     * @throws An exception that this method is not implemented
     * @return {?}
     */
    get validator() { return /** @type {?} */ (unimplemented()); }
    /**
     * \@description
     * The registered async validator function for the control
     *
     * @throws An exception that this method is not implemented
     * @return {?}
     */
    get asyncValidator() { return /** @type {?} */ (unimplemented()); }
}
if (false) {
    /**
     * \@description
     * The parent form for the control.
     *
     * \@internal
     * @type {?}
     */
    NgControl.prototype._parent;
    /**
     * \@description
     * The name for the control
     * @type {?}
     */
    NgControl.prototype.name;
    /**
     * \@description
     * The value accessor for the control
     * @type {?}
     */
    NgControl.prototype.valueAccessor;
    /**
     * \@description
     * The uncomposed array of synchronous validators for the control
     *
     * \@internal
     * @type {?}
     */
    NgControl.prototype._rawValidators;
    /**
     * \@description
     * The uncomposed array of async validators for the control
     *
     * \@internal
     * @type {?}
     */
    NgControl.prototype._rawAsyncValidators;
    /**
     * \@description
     * The callback method to update the model from the view when requested
     *
     * @abstract
     * @param {?} newValue The new value for the view
     * @return {?}
     */
    NgControl.prototype.viewToModelUpdate = function (newValue) { };
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfY29udHJvbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2Zvcm1zL3NyYy9kaXJlY3RpdmVzL25nX2NvbnRyb2wudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFTQSxPQUFPLEVBQUMsd0JBQXdCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQzs7OztBQUt0RSxTQUFTLGFBQWE7SUFDcEIsTUFBTSxJQUFJLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQztDQUNsQzs7Ozs7Ozs7O0FBU0QsTUFBTSxPQUFnQixTQUFVLFNBQVEsd0JBQXdCOzs7Ozs7Ozs7UUFPOUQsZUFBaUMsSUFBSSxDQUFDOzs7OztRQU10QyxZQUFvQixJQUFJLENBQUM7Ozs7O1FBTXpCLHFCQUEyQyxJQUFJLENBQUM7Ozs7Ozs7UUFRaEQsc0JBQStDLEVBQUUsQ0FBQzs7Ozs7OztRQVFsRCwyQkFBOEQsRUFBRSxDQUFDOzs7Ozs7Ozs7SUFRakUsSUFBSSxTQUFTLEtBQXVCLHlCQUFvQixhQUFhLEVBQUUsRUFBQyxFQUFFOzs7Ozs7OztJQVExRSxJQUFJLGNBQWMsS0FBNEIseUJBQXlCLGFBQWEsRUFBRSxFQUFDLEVBQUU7Q0FTMUYiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cblxuaW1wb3J0IHtBYnN0cmFjdENvbnRyb2xEaXJlY3RpdmV9IGZyb20gJy4vYWJzdHJhY3RfY29udHJvbF9kaXJlY3RpdmUnO1xuaW1wb3J0IHtDb250cm9sQ29udGFpbmVyfSBmcm9tICcuL2NvbnRyb2xfY29udGFpbmVyJztcbmltcG9ydCB7Q29udHJvbFZhbHVlQWNjZXNzb3J9IGZyb20gJy4vY29udHJvbF92YWx1ZV9hY2Nlc3Nvcic7XG5pbXBvcnQge0FzeW5jVmFsaWRhdG9yLCBBc3luY1ZhbGlkYXRvckZuLCBWYWxpZGF0b3IsIFZhbGlkYXRvckZufSBmcm9tICcuL3ZhbGlkYXRvcnMnO1xuXG5mdW5jdGlvbiB1bmltcGxlbWVudGVkKCk6IGFueSB7XG4gIHRocm93IG5ldyBFcnJvcigndW5pbXBsZW1lbnRlZCcpO1xufVxuXG4vKipcbiAqIEBkZXNjcmlwdGlvblxuICogQSBiYXNlIGNsYXNzIHRoYXQgYWxsIGNvbnRyb2wgYEZvcm1Db250cm9sYC1iYXNlZCBkaXJlY3RpdmVzIGV4dGVuZC4gSXQgYmluZHMgYSBgRm9ybUNvbnRyb2xgXG4gKiBvYmplY3QgdG8gYSBET00gZWxlbWVudC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBOZ0NvbnRyb2wgZXh0ZW5kcyBBYnN0cmFjdENvbnRyb2xEaXJlY3RpdmUge1xuICAvKipcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIFRoZSBwYXJlbnQgZm9ybSBmb3IgdGhlIGNvbnRyb2wuXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX3BhcmVudDogQ29udHJvbENvbnRhaW5lcnxudWxsID0gbnVsbDtcblxuICAvKipcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIFRoZSBuYW1lIGZvciB0aGUgY29udHJvbFxuICAgKi9cbiAgbmFtZTogc3RyaW5nfG51bGwgPSBudWxsO1xuXG4gIC8qKlxuICAgKiBAZGVzY3JpcHRpb25cbiAgICogVGhlIHZhbHVlIGFjY2Vzc29yIGZvciB0aGUgY29udHJvbFxuICAgKi9cbiAgdmFsdWVBY2Nlc3NvcjogQ29udHJvbFZhbHVlQWNjZXNzb3J8bnVsbCA9IG51bGw7XG5cbiAgLyoqXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBUaGUgdW5jb21wb3NlZCBhcnJheSBvZiBzeW5jaHJvbm91cyB2YWxpZGF0b3JzIGZvciB0aGUgY29udHJvbFxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9yYXdWYWxpZGF0b3JzOiBBcnJheTxWYWxpZGF0b3J8VmFsaWRhdG9yRm4+ID0gW107XG5cbiAgLyoqXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBUaGUgdW5jb21wb3NlZCBhcnJheSBvZiBhc3luYyB2YWxpZGF0b3JzIGZvciB0aGUgY29udHJvbFxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9yYXdBc3luY1ZhbGlkYXRvcnM6IEFycmF5PEFzeW5jVmFsaWRhdG9yfEFzeW5jVmFsaWRhdG9yRm4+ID0gW107XG5cbiAgLyoqXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBUaGUgcmVnaXN0ZXJlZCBzeW5jaHJvbm91cyB2YWxpZGF0b3IgZnVuY3Rpb24gZm9yIHRoZSBjb250cm9sXG4gICAqXG4gICAqIEB0aHJvd3MgQW4gZXhjZXB0aW9uIHRoYXQgdGhpcyBtZXRob2QgaXMgbm90IGltcGxlbWVudGVkXG4gICAqL1xuICBnZXQgdmFsaWRhdG9yKCk6IFZhbGlkYXRvckZufG51bGwgeyByZXR1cm4gPFZhbGlkYXRvckZuPnVuaW1wbGVtZW50ZWQoKTsgfVxuXG4gIC8qKlxuICAgKiBAZGVzY3JpcHRpb25cbiAgICogVGhlIHJlZ2lzdGVyZWQgYXN5bmMgdmFsaWRhdG9yIGZ1bmN0aW9uIGZvciB0aGUgY29udHJvbFxuICAgKlxuICAgKiBAdGhyb3dzIEFuIGV4Y2VwdGlvbiB0aGF0IHRoaXMgbWV0aG9kIGlzIG5vdCBpbXBsZW1lbnRlZFxuICAgKi9cbiAgZ2V0IGFzeW5jVmFsaWRhdG9yKCk6IEFzeW5jVmFsaWRhdG9yRm58bnVsbCB7IHJldHVybiA8QXN5bmNWYWxpZGF0b3JGbj51bmltcGxlbWVudGVkKCk7IH1cblxuICAvKipcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIFRoZSBjYWxsYmFjayBtZXRob2QgdG8gdXBkYXRlIHRoZSBtb2RlbCBmcm9tIHRoZSB2aWV3IHdoZW4gcmVxdWVzdGVkXG4gICAqXG4gICAqIEBwYXJhbSBuZXdWYWx1ZSBUaGUgbmV3IHZhbHVlIGZvciB0aGUgdmlld1xuICAgKi9cbiAgYWJzdHJhY3Qgdmlld1RvTW9kZWxVcGRhdGUobmV3VmFsdWU6IGFueSk6IHZvaWQ7XG59XG4iXX0=
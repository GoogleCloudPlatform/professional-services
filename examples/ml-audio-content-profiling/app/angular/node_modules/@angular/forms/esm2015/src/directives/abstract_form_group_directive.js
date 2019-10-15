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
import { ControlContainer } from './control_container';
import { composeAsyncValidators, composeValidators, controlPath } from './shared';
/**
 * \@description
 * A base class for code shared between the `NgModelGroup` and `FormGroupName` directives.
 *
 * \@publicApi
 */
export class AbstractFormGroupDirective extends ControlContainer {
    /**
     * \@description
     * An internal callback method triggered on the instance after the inputs are set.
     * Registers the group with its parent group.
     * @return {?}
     */
    ngOnInit() {
        this._checkParentType(); /** @type {?} */
        ((this.formDirective)).addFormGroup(this);
    }
    /**
     * \@description
     * An internal callback method triggered before the instance is destroyed.
     * Removes the group from its parent group.
     * @return {?}
     */
    ngOnDestroy() {
        if (this.formDirective) {
            this.formDirective.removeFormGroup(this);
        }
    }
    /**
     * \@description
     * The `FormGroup` bound to this directive.
     * @return {?}
     */
    get control() { return /** @type {?} */ ((this.formDirective)).getFormGroup(this); }
    /**
     * \@description
     * The path to this group from the top-level directive.
     * @return {?}
     */
    get path() { return controlPath(this.name, this._parent); }
    /**
     * \@description
     * The top-level directive for this group if present, otherwise null.
     * @return {?}
     */
    get formDirective() { return this._parent ? this._parent.formDirective : null; }
    /**
     * \@description
     * The synchronous validators registered with this group.
     * @return {?}
     */
    get validator() { return composeValidators(this._validators); }
    /**
     * \@description
     * The async validators registered with this group.
     * @return {?}
     */
    get asyncValidator() {
        return composeAsyncValidators(this._asyncValidators);
    }
    /**
     * \@internal
     * @return {?}
     */
    _checkParentType() { }
}
if (false) {
    /**
     * \@description
     * The parent control for the group
     *
     * \@internal
     * @type {?}
     */
    AbstractFormGroupDirective.prototype._parent;
    /**
     * \@description
     * An array of synchronous validators for the group
     *
     * \@internal
     * @type {?}
     */
    AbstractFormGroupDirective.prototype._validators;
    /**
     * \@description
     * An array of async validators for the group
     *
     * \@internal
     * @type {?}
     */
    AbstractFormGroupDirective.prototype._asyncValidators;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWJzdHJhY3RfZm9ybV9ncm91cF9kaXJlY3RpdmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9mb3Jtcy9zcmMvZGlyZWN0aXZlcy9hYnN0cmFjdF9mb3JtX2dyb3VwX2RpcmVjdGl2ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVlBLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBRXJELE9BQU8sRUFBQyxzQkFBc0IsRUFBRSxpQkFBaUIsRUFBRSxXQUFXLEVBQUMsTUFBTSxVQUFVLENBQUM7Ozs7Ozs7QUFXaEYsTUFBTSxPQUFPLDBCQUEyQixTQUFRLGdCQUFnQjs7Ozs7OztJQWlDOUQsUUFBUTtRQUNOLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1VBQ3hCLElBQUksQ0FBQyxhQUFhLEdBQUcsWUFBWSxDQUFDLElBQUk7S0FDdkM7Ozs7Ozs7SUFPRCxXQUFXO1FBQ1QsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFO1lBQ3RCLElBQUksQ0FBQyxhQUFhLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQzFDO0tBQ0Y7Ozs7OztJQU1ELElBQUksT0FBTyxLQUFnQiwwQkFBTyxJQUFJLENBQUMsYUFBYSxHQUFHLFlBQVksQ0FBQyxJQUFJLEVBQUUsRUFBRTs7Ozs7O0lBTTVFLElBQUksSUFBSSxLQUFlLE9BQU8sV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUU7Ozs7OztJQU1yRSxJQUFJLGFBQWEsS0FBZ0IsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUU7Ozs7OztJQU0zRixJQUFJLFNBQVMsS0FBdUIsT0FBTyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsRUFBRTs7Ozs7O0lBTWpGLElBQUksY0FBYztRQUNoQixPQUFPLHNCQUFzQixDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0tBQ3REOzs7OztJQUdELGdCQUFnQixNQUFXO0NBQzVCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge09uRGVzdHJveSwgT25Jbml0fSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuaW1wb3J0IHtGb3JtR3JvdXB9IGZyb20gJy4uL21vZGVsJztcblxuaW1wb3J0IHtDb250cm9sQ29udGFpbmVyfSBmcm9tICcuL2NvbnRyb2xfY29udGFpbmVyJztcbmltcG9ydCB7Rm9ybX0gZnJvbSAnLi9mb3JtX2ludGVyZmFjZSc7XG5pbXBvcnQge2NvbXBvc2VBc3luY1ZhbGlkYXRvcnMsIGNvbXBvc2VWYWxpZGF0b3JzLCBjb250cm9sUGF0aH0gZnJvbSAnLi9zaGFyZWQnO1xuaW1wb3J0IHtBc3luY1ZhbGlkYXRvckZuLCBWYWxpZGF0b3JGbn0gZnJvbSAnLi92YWxpZGF0b3JzJztcblxuXG5cbi8qKlxuICogQGRlc2NyaXB0aW9uXG4gKiBBIGJhc2UgY2xhc3MgZm9yIGNvZGUgc2hhcmVkIGJldHdlZW4gdGhlIGBOZ01vZGVsR3JvdXBgIGFuZCBgRm9ybUdyb3VwTmFtZWAgZGlyZWN0aXZlcy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBBYnN0cmFjdEZvcm1Hcm91cERpcmVjdGl2ZSBleHRlbmRzIENvbnRyb2xDb250YWluZXIgaW1wbGVtZW50cyBPbkluaXQsIE9uRGVzdHJveSB7XG4gIC8qKlxuICAgKiBAZGVzY3JpcHRpb25cbiAgICogVGhlIHBhcmVudCBjb250cm9sIGZvciB0aGUgZ3JvdXBcbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgX3BhcmVudCAhOiBDb250cm9sQ29udGFpbmVyO1xuXG4gIC8qKlxuICAgKiBAZGVzY3JpcHRpb25cbiAgICogQW4gYXJyYXkgb2Ygc3luY2hyb25vdXMgdmFsaWRhdG9ycyBmb3IgdGhlIGdyb3VwXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIF92YWxpZGF0b3JzICE6IGFueVtdO1xuXG4gIC8qKlxuICAgKiBAZGVzY3JpcHRpb25cbiAgICogQW4gYXJyYXkgb2YgYXN5bmMgdmFsaWRhdG9ycyBmb3IgdGhlIGdyb3VwXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIF9hc3luY1ZhbGlkYXRvcnMgITogYW55W107XG5cbiAgLyoqXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBBbiBpbnRlcm5hbCBjYWxsYmFjayBtZXRob2QgdHJpZ2dlcmVkIG9uIHRoZSBpbnN0YW5jZSBhZnRlciB0aGUgaW5wdXRzIGFyZSBzZXQuXG4gICAqIFJlZ2lzdGVycyB0aGUgZ3JvdXAgd2l0aCBpdHMgcGFyZW50IGdyb3VwLlxuICAgKi9cbiAgbmdPbkluaXQoKTogdm9pZCB7XG4gICAgdGhpcy5fY2hlY2tQYXJlbnRUeXBlKCk7XG4gICAgdGhpcy5mb3JtRGlyZWN0aXZlICEuYWRkRm9ybUdyb3VwKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBBbiBpbnRlcm5hbCBjYWxsYmFjayBtZXRob2QgdHJpZ2dlcmVkIGJlZm9yZSB0aGUgaW5zdGFuY2UgaXMgZGVzdHJveWVkLlxuICAgKiBSZW1vdmVzIHRoZSBncm91cCBmcm9tIGl0cyBwYXJlbnQgZ3JvdXAuXG4gICAqL1xuICBuZ09uRGVzdHJveSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5mb3JtRGlyZWN0aXZlKSB7XG4gICAgICB0aGlzLmZvcm1EaXJlY3RpdmUucmVtb3ZlRm9ybUdyb3VwKHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAZGVzY3JpcHRpb25cbiAgICogVGhlIGBGb3JtR3JvdXBgIGJvdW5kIHRvIHRoaXMgZGlyZWN0aXZlLlxuICAgKi9cbiAgZ2V0IGNvbnRyb2woKTogRm9ybUdyb3VwIHsgcmV0dXJuIHRoaXMuZm9ybURpcmVjdGl2ZSAhLmdldEZvcm1Hcm91cCh0aGlzKTsgfVxuXG4gIC8qKlxuICAgKiBAZGVzY3JpcHRpb25cbiAgICogVGhlIHBhdGggdG8gdGhpcyBncm91cCBmcm9tIHRoZSB0b3AtbGV2ZWwgZGlyZWN0aXZlLlxuICAgKi9cbiAgZ2V0IHBhdGgoKTogc3RyaW5nW10geyByZXR1cm4gY29udHJvbFBhdGgodGhpcy5uYW1lLCB0aGlzLl9wYXJlbnQpOyB9XG5cbiAgLyoqXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBUaGUgdG9wLWxldmVsIGRpcmVjdGl2ZSBmb3IgdGhpcyBncm91cCBpZiBwcmVzZW50LCBvdGhlcndpc2UgbnVsbC5cbiAgICovXG4gIGdldCBmb3JtRGlyZWN0aXZlKCk6IEZvcm18bnVsbCB7IHJldHVybiB0aGlzLl9wYXJlbnQgPyB0aGlzLl9wYXJlbnQuZm9ybURpcmVjdGl2ZSA6IG51bGw7IH1cblxuICAvKipcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIFRoZSBzeW5jaHJvbm91cyB2YWxpZGF0b3JzIHJlZ2lzdGVyZWQgd2l0aCB0aGlzIGdyb3VwLlxuICAgKi9cbiAgZ2V0IHZhbGlkYXRvcigpOiBWYWxpZGF0b3JGbnxudWxsIHsgcmV0dXJuIGNvbXBvc2VWYWxpZGF0b3JzKHRoaXMuX3ZhbGlkYXRvcnMpOyB9XG5cbiAgLyoqXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBUaGUgYXN5bmMgdmFsaWRhdG9ycyByZWdpc3RlcmVkIHdpdGggdGhpcyBncm91cC5cbiAgICovXG4gIGdldCBhc3luY1ZhbGlkYXRvcigpOiBBc3luY1ZhbGlkYXRvckZufG51bGwge1xuICAgIHJldHVybiBjb21wb3NlQXN5bmNWYWxpZGF0b3JzKHRoaXMuX2FzeW5jVmFsaWRhdG9ycyk7XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIF9jaGVja1BhcmVudFR5cGUoKTogdm9pZCB7fVxufVxuIl19
/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * Called when directives inject each other (creating a circular dependency)
 * @param {?} token
 * @return {?}
 */
export function throwCyclicDependencyError(token) {
    throw new Error(`Cannot instantiate cyclic dependency! ${token}`);
}
/**
 * Called when there are multiple component selectors that match a given node
 * @param {?} tNode
 * @return {?}
 */
export function throwMultipleComponentError(tNode) {
    throw new Error(`Multiple components match node with tagname ${tNode.tagName}`);
}
/**
 * Throws an ExpressionChangedAfterChecked error if checkNoChanges mode is on.
 * @param {?} creationMode
 * @param {?} checkNoChangesMode
 * @param {?} oldValue
 * @param {?} currValue
 * @return {?}
 */
export function throwErrorIfNoChangesMode(creationMode, checkNoChangesMode, oldValue, currValue) {
    if (checkNoChangesMode) {
        /** @type {?} */
        let msg = `ExpressionChangedAfterItHasBeenCheckedError: Expression has changed after it was checked. Previous value: '${oldValue}'. Current value: '${currValue}'.`;
        if (creationMode) {
            msg +=
                ` It seems like the view has been created after its parent and its children have been dirty checked.` +
                    ` Has it been created in a change detection hook ?`;
        }
        // TODO: include debug context
        throw new Error(msg);
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9lcnJvcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBV0EsTUFBTSxVQUFVLDBCQUEwQixDQUFDLEtBQVU7SUFDbkQsTUFBTSxJQUFJLEtBQUssQ0FBQyx5Q0FBeUMsS0FBSyxFQUFFLENBQUMsQ0FBQztDQUNuRTs7Ozs7O0FBR0QsTUFBTSxVQUFVLDJCQUEyQixDQUFDLEtBQVk7SUFDdEQsTUFBTSxJQUFJLEtBQUssQ0FBQywrQ0FBK0MsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7Q0FDakY7Ozs7Ozs7OztBQUdELE1BQU0sVUFBVSx5QkFBeUIsQ0FDckMsWUFBcUIsRUFBRSxrQkFBMkIsRUFBRSxRQUFhLEVBQUUsU0FBYztJQUNuRixJQUFJLGtCQUFrQixFQUFFOztRQUN0QixJQUFJLEdBQUcsR0FDSCw4R0FBOEcsUUFBUSxzQkFBc0IsU0FBUyxJQUFJLENBQUM7UUFDOUosSUFBSSxZQUFZLEVBQUU7WUFDaEIsR0FBRztnQkFDQyxxR0FBcUc7b0JBQ3JHLG1EQUFtRCxDQUFDO1NBQ3pEOztRQUVELE1BQU0sSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDdEI7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIlxuLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtUTm9kZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuXG4vKiogQ2FsbGVkIHdoZW4gZGlyZWN0aXZlcyBpbmplY3QgZWFjaCBvdGhlciAoY3JlYXRpbmcgYSBjaXJjdWxhciBkZXBlbmRlbmN5KSAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRocm93Q3ljbGljRGVwZW5kZW5jeUVycm9yKHRva2VuOiBhbnkpOiBuZXZlciB7XG4gIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IGluc3RhbnRpYXRlIGN5Y2xpYyBkZXBlbmRlbmN5ISAke3Rva2VufWApO1xufVxuXG4vKiogQ2FsbGVkIHdoZW4gdGhlcmUgYXJlIG11bHRpcGxlIGNvbXBvbmVudCBzZWxlY3RvcnMgdGhhdCBtYXRjaCBhIGdpdmVuIG5vZGUgKi9cbmV4cG9ydCBmdW5jdGlvbiB0aHJvd011bHRpcGxlQ29tcG9uZW50RXJyb3IodE5vZGU6IFROb2RlKTogbmV2ZXIge1xuICB0aHJvdyBuZXcgRXJyb3IoYE11bHRpcGxlIGNvbXBvbmVudHMgbWF0Y2ggbm9kZSB3aXRoIHRhZ25hbWUgJHt0Tm9kZS50YWdOYW1lfWApO1xufVxuXG4vKiogVGhyb3dzIGFuIEV4cHJlc3Npb25DaGFuZ2VkQWZ0ZXJDaGVja2VkIGVycm9yIGlmIGNoZWNrTm9DaGFuZ2VzIG1vZGUgaXMgb24uICovXG5leHBvcnQgZnVuY3Rpb24gdGhyb3dFcnJvcklmTm9DaGFuZ2VzTW9kZShcbiAgICBjcmVhdGlvbk1vZGU6IGJvb2xlYW4sIGNoZWNrTm9DaGFuZ2VzTW9kZTogYm9vbGVhbiwgb2xkVmFsdWU6IGFueSwgY3VyclZhbHVlOiBhbnkpOiBuZXZlcnx2b2lkIHtcbiAgaWYgKGNoZWNrTm9DaGFuZ2VzTW9kZSkge1xuICAgIGxldCBtc2cgPVxuICAgICAgICBgRXhwcmVzc2lvbkNoYW5nZWRBZnRlckl0SGFzQmVlbkNoZWNrZWRFcnJvcjogRXhwcmVzc2lvbiBoYXMgY2hhbmdlZCBhZnRlciBpdCB3YXMgY2hlY2tlZC4gUHJldmlvdXMgdmFsdWU6ICcke29sZFZhbHVlfScuIEN1cnJlbnQgdmFsdWU6ICcke2N1cnJWYWx1ZX0nLmA7XG4gICAgaWYgKGNyZWF0aW9uTW9kZSkge1xuICAgICAgbXNnICs9XG4gICAgICAgICAgYCBJdCBzZWVtcyBsaWtlIHRoZSB2aWV3IGhhcyBiZWVuIGNyZWF0ZWQgYWZ0ZXIgaXRzIHBhcmVudCBhbmQgaXRzIGNoaWxkcmVuIGhhdmUgYmVlbiBkaXJ0eSBjaGVja2VkLmAgK1xuICAgICAgICAgIGAgSGFzIGl0IGJlZW4gY3JlYXRlZCBpbiBhIGNoYW5nZSBkZXRlY3Rpb24gaG9vayA/YDtcbiAgICB9XG4gICAgLy8gVE9ETzogaW5jbHVkZSBkZWJ1ZyBjb250ZXh0XG4gICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gIH1cbn1cbiJdfQ==
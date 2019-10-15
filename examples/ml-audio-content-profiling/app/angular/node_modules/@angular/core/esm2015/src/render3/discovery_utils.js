/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
import { assertDefined } from './assert';
import { discoverDirectives, discoverLocalRefs, getContext, isComponentInstance } from './context_discovery';
import { NodeInjector } from './di';
import { CONTEXT, FLAGS, PARENT, TVIEW } from './interfaces/view';
import { getComponentViewByIndex, readPatchedLViewData } from './util';
/**
 * Returns the component instance associated with the target.
 *
 * If a DOM is used then it will return the component that
 *    owns the view where the element is situated.
 * If a component instance is used then it will return the
 *    instance of the parent component depending on where
 *    the component instance is exists in a template.
 * If a directive instance is used then it will return the
 *    component that contains that directive in it's template.
 * @template T
 * @param {?} target
 * @return {?}
 */
export function getComponent(target) {
    /** @type {?} */
    const context = /** @type {?} */ ((loadContext(target)));
    if (context.component === undefined) {
        /** @type {?} */
        let lViewData = context.lViewData;
        while (lViewData) {
            /** @type {?} */
            const ctx = /** @type {?} */ (((/** @type {?} */ ((lViewData))[CONTEXT])));
            if (ctx && isComponentInstance(ctx)) {
                context.component = ctx;
                break;
            }
            lViewData = /** @type {?} */ ((/** @type {?} */ ((lViewData))[PARENT]));
        }
        if (context.component === undefined) {
            context.component = null;
        }
    }
    return /** @type {?} */ (context.component);
}
/**
 * Returns the host component instance associated with the target.
 *
 * This will only return a component instance of the DOM node
 * contains an instance of a component on it.
 * @template T
 * @param {?} target
 * @return {?}
 */
export function getHostComponent(target) {
    /** @type {?} */
    const context = loadContext(target);
    /** @type {?} */
    const tNode = /** @type {?} */ (context.lViewData[TVIEW].data[context.nodeIndex]);
    if (tNode.flags & 4096 /* isComponent */) {
        /** @type {?} */
        const componentView = getComponentViewByIndex(context.nodeIndex, context.lViewData);
        return /** @type {?} */ ((componentView[CONTEXT]));
    }
    return null;
}
/**
 * Returns the `RootContext` instance that is associated with
 * the application where the target is situated.
 * @param {?} target
 * @return {?}
 */
export function getRootContext(target) {
    /** @type {?} */
    const lViewData = Array.isArray(target) ? target : /** @type {?} */ ((loadContext(target))).lViewData;
    /** @type {?} */
    const rootLViewData = getRootView(lViewData);
    return /** @type {?} */ (rootLViewData[CONTEXT]);
}
/**
 * Returns a list of all the components in the application
 * that are have been bootstrapped.
 * @param {?} target
 * @return {?}
 */
export function getRootComponents(target) {
    return [...getRootContext(target).components];
}
/**
 * Returns the injector instance that is associated with
 * the element, component or directive.
 * @param {?} target
 * @return {?}
 */
export function getInjector(target) {
    /** @type {?} */
    const context = loadContext(target);
    /** @type {?} */
    const tNode = /** @type {?} */ (context.lViewData[TVIEW].data[context.nodeIndex]);
    return new NodeInjector(tNode, context.lViewData);
}
/**
 * Returns a list of all the directives that are associated
 * with the underlying target element.
 * @param {?} target
 * @return {?}
 */
export function getDirectives(target) {
    /** @type {?} */
    const context = /** @type {?} */ ((loadContext(target)));
    if (context.directives === undefined) {
        context.directives = discoverDirectives(context.nodeIndex, context.lViewData, false);
    }
    return context.directives || [];
}
/**
 * Returns LContext associated with a target passed as an argument.
 * Throws if a given target doesn't have associated LContext.
 * @param {?} target
 * @return {?}
 */
export function loadContext(target) {
    /** @type {?} */
    const context = getContext(target);
    if (!context) {
        throw new Error(ngDevMode ? 'Unable to find the given context data for the given target' :
            'Invalid ng target');
    }
    return context;
}
/**
 * Retrieve the root view from any component by walking the parent `LViewData` until
 * reaching the root `LViewData`.
 *
 * @param {?} componentOrView any component or view
 * @return {?}
 */
export function getRootView(componentOrView) {
    /** @type {?} */
    let lViewData;
    if (Array.isArray(componentOrView)) {
        ngDevMode && assertDefined(componentOrView, 'lViewData');
        lViewData = /** @type {?} */ (componentOrView);
    }
    else {
        ngDevMode && assertDefined(componentOrView, 'component');
        lViewData = /** @type {?} */ ((readPatchedLViewData(componentOrView)));
    }
    while (lViewData && !(lViewData[FLAGS] & 64 /* IsRoot */)) {
        lViewData = /** @type {?} */ ((lViewData[PARENT]));
    }
    return lViewData;
}
/**
 *  Retrieve map of local references (local reference name => element or directive instance).
 * @param {?} target
 * @return {?}
 */
export function getLocalRefs(target) {
    /** @type {?} */
    const context = /** @type {?} */ ((loadContext(target)));
    if (context.localRefs === undefined) {
        context.localRefs = discoverLocalRefs(context.lViewData, context.nodeIndex);
    }
    return context.localRefs || {};
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlzY292ZXJ5X3V0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9kaXNjb3ZlcnlfdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQVNBLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDdkMsT0FBTyxFQUFDLGtCQUFrQixFQUFFLGlCQUFpQixFQUFFLFVBQVUsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQzNHLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFHbEMsT0FBTyxFQUFDLE9BQU8sRUFBRSxLQUFLLEVBQXlCLE1BQU0sRUFBZSxLQUFLLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNwRyxPQUFPLEVBQUMsdUJBQXVCLEVBQUUsb0JBQW9CLEVBQUMsTUFBTSxRQUFRLENBQUM7Ozs7Ozs7Ozs7Ozs7OztBQW9CckUsTUFBTSxVQUFVLFlBQVksQ0FBUyxNQUFVOztJQUM3QyxNQUFNLE9BQU8sc0JBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQyxHQUFHO0lBRXRDLElBQUksT0FBTyxDQUFDLFNBQVMsS0FBSyxTQUFTLEVBQUU7O1FBQ25DLElBQUksU0FBUyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUM7UUFDbEMsT0FBTyxTQUFTLEVBQUU7O1lBQ2hCLE1BQU0sR0FBRywwQ0FBRyxTQUFTLEdBQUcsT0FBTyxLQUFRO1lBQ3ZDLElBQUksR0FBRyxJQUFJLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUNuQyxPQUFPLENBQUMsU0FBUyxHQUFHLEdBQUcsQ0FBQztnQkFDeEIsTUFBTTthQUNQO1lBQ0QsU0FBUyx5Q0FBRyxTQUFTLEdBQUcsTUFBTSxHQUFHLENBQUM7U0FDbkM7UUFDRCxJQUFJLE9BQU8sQ0FBQyxTQUFTLEtBQUssU0FBUyxFQUFFO1lBQ25DLE9BQU8sQ0FBQyxT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QW9CLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQztLQUNyRDtJQUNELE9BQU8sU0FBUyxJQUFJLENBQUMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLGtCQUFvQixDQUFDLEVBQUU7UUFDM0QsU0FBUyxzQkFBRyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztLQUNqQztJQUNELE9BQU8sU0FBUyxDQUFDO0NBQ2xCOzs7Ozs7QUFLRCxNQUFNLFVBQVUsWUFBWSxDQUFDLE1BQVU7O0lBQ3JDLE1BQU0sT0FBTyxzQkFBRyxXQUFXLENBQUMsTUFBTSxDQUFDLEdBQUc7SUFFdEMsSUFBSSxPQUFPLENBQUMsU0FBUyxLQUFLLFNBQVMsRUFBRTtRQUNuQyxPQUFPLENBQUMsU0FBUyxHQUFHLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0tBQzdFO0lBRUQsT0FBTyxPQUFPLENBQUMsU0FBUyxJQUFJLEVBQUUsQ0FBQztDQUNoQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcblxuaW1wb3J0IHthc3NlcnREZWZpbmVkfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2Rpc2NvdmVyRGlyZWN0aXZlcywgZGlzY292ZXJMb2NhbFJlZnMsIGdldENvbnRleHQsIGlzQ29tcG9uZW50SW5zdGFuY2V9IGZyb20gJy4vY29udGV4dF9kaXNjb3ZlcnknO1xuaW1wb3J0IHtOb2RlSW5qZWN0b3J9IGZyb20gJy4vZGknO1xuaW1wb3J0IHtMQ29udGV4dH0gZnJvbSAnLi9pbnRlcmZhY2VzL2NvbnRleHQnO1xuaW1wb3J0IHtURWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZUZsYWdzfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0NPTlRFWFQsIEZMQUdTLCBMVmlld0RhdGEsIExWaWV3RmxhZ3MsIFBBUkVOVCwgUm9vdENvbnRleHQsIFRWSUVXfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldENvbXBvbmVudFZpZXdCeUluZGV4LCByZWFkUGF0Y2hlZExWaWV3RGF0YX0gZnJvbSAnLi91dGlsJztcblxuXG4vKipcbiAqIE5PVEU6IFRoZSBmb2xsb3dpbmcgZnVuY3Rpb25zIG1pZ2h0IG5vdCBiZSBpZGVhbCBmb3IgY29yZSB1c2FnZSBpbiBBbmd1bGFyLi4uXG4gKlxuICogRWFjaCBmdW5jdGlvbiBiZWxvdyBpcyBkZXNpZ25lZFxuICovXG5cbi8qKlxuICogUmV0dXJucyB0aGUgY29tcG9uZW50IGluc3RhbmNlIGFzc29jaWF0ZWQgd2l0aCB0aGUgdGFyZ2V0LlxuICpcbiAqIElmIGEgRE9NIGlzIHVzZWQgdGhlbiBpdCB3aWxsIHJldHVybiB0aGUgY29tcG9uZW50IHRoYXRcbiAqICAgIG93bnMgdGhlIHZpZXcgd2hlcmUgdGhlIGVsZW1lbnQgaXMgc2l0dWF0ZWQuXG4gKiBJZiBhIGNvbXBvbmVudCBpbnN0YW5jZSBpcyB1c2VkIHRoZW4gaXQgd2lsbCByZXR1cm4gdGhlXG4gKiAgICBpbnN0YW5jZSBvZiB0aGUgcGFyZW50IGNvbXBvbmVudCBkZXBlbmRpbmcgb24gd2hlcmVcbiAqICAgIHRoZSBjb21wb25lbnQgaW5zdGFuY2UgaXMgZXhpc3RzIGluIGEgdGVtcGxhdGUuXG4gKiBJZiBhIGRpcmVjdGl2ZSBpbnN0YW5jZSBpcyB1c2VkIHRoZW4gaXQgd2lsbCByZXR1cm4gdGhlXG4gKiAgICBjb21wb25lbnQgdGhhdCBjb250YWlucyB0aGF0IGRpcmVjdGl2ZSBpbiBpdCdzIHRlbXBsYXRlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29tcG9uZW50PFQgPSB7fT4odGFyZ2V0OiB7fSk6IFR8bnVsbCB7XG4gIGNvbnN0IGNvbnRleHQgPSBsb2FkQ29udGV4dCh0YXJnZXQpICE7XG5cbiAgaWYgKGNvbnRleHQuY29tcG9uZW50ID09PSB1bmRlZmluZWQpIHtcbiAgICBsZXQgbFZpZXdEYXRhID0gY29udGV4dC5sVmlld0RhdGE7XG4gICAgd2hpbGUgKGxWaWV3RGF0YSkge1xuICAgICAgY29uc3QgY3R4ID0gbFZpZXdEYXRhICFbQ09OVEVYVF0gIWFze307XG4gICAgICBpZiAoY3R4ICYmIGlzQ29tcG9uZW50SW5zdGFuY2UoY3R4KSkge1xuICAgICAgICBjb250ZXh0LmNvbXBvbmVudCA9IGN0eDtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBsVmlld0RhdGEgPSBsVmlld0RhdGEgIVtQQVJFTlRdICE7XG4gICAgfVxuICAgIGlmIChjb250ZXh0LmNvbXBvbmVudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb250ZXh0LmNvbXBvbmVudCA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGNvbnRleHQuY29tcG9uZW50IGFzIFQ7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgaG9zdCBjb21wb25lbnQgaW5zdGFuY2UgYXNzb2NpYXRlZCB3aXRoIHRoZSB0YXJnZXQuXG4gKlxuICogVGhpcyB3aWxsIG9ubHkgcmV0dXJuIGEgY29tcG9uZW50IGluc3RhbmNlIG9mIHRoZSBET00gbm9kZVxuICogY29udGFpbnMgYW4gaW5zdGFuY2Ugb2YgYSBjb21wb25lbnQgb24gaXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRIb3N0Q29tcG9uZW50PFQgPSB7fT4odGFyZ2V0OiB7fSk6IFR8bnVsbCB7XG4gIGNvbnN0IGNvbnRleHQgPSBsb2FkQ29udGV4dCh0YXJnZXQpO1xuICBjb25zdCB0Tm9kZSA9IGNvbnRleHQubFZpZXdEYXRhW1RWSUVXXS5kYXRhW2NvbnRleHQubm9kZUluZGV4XSBhcyBUTm9kZTtcbiAgaWYgKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudCkge1xuICAgIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBnZXRDb21wb25lbnRWaWV3QnlJbmRleChjb250ZXh0Lm5vZGVJbmRleCwgY29udGV4dC5sVmlld0RhdGEpO1xuICAgIHJldHVybiBjb21wb25lbnRWaWV3W0NPTlRFWFRdIGFzIGFueSBhcyBUO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGBSb290Q29udGV4dGAgaW5zdGFuY2UgdGhhdCBpcyBhc3NvY2lhdGVkIHdpdGhcbiAqIHRoZSBhcHBsaWNhdGlvbiB3aGVyZSB0aGUgdGFyZ2V0IGlzIHNpdHVhdGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Um9vdENvbnRleHQodGFyZ2V0OiBMVmlld0RhdGEgfCB7fSk6IFJvb3RDb250ZXh0IHtcbiAgY29uc3QgbFZpZXdEYXRhID0gQXJyYXkuaXNBcnJheSh0YXJnZXQpID8gdGFyZ2V0IDogbG9hZENvbnRleHQodGFyZ2V0KSAhLmxWaWV3RGF0YTtcbiAgY29uc3Qgcm9vdExWaWV3RGF0YSA9IGdldFJvb3RWaWV3KGxWaWV3RGF0YSk7XG4gIHJldHVybiByb290TFZpZXdEYXRhW0NPTlRFWFRdIGFzIFJvb3RDb250ZXh0O1xufVxuXG4vKipcbiAqIFJldHVybnMgYSBsaXN0IG9mIGFsbCB0aGUgY29tcG9uZW50cyBpbiB0aGUgYXBwbGljYXRpb25cbiAqIHRoYXQgYXJlIGhhdmUgYmVlbiBib290c3RyYXBwZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRSb290Q29tcG9uZW50cyh0YXJnZXQ6IHt9KTogYW55W10ge1xuICByZXR1cm4gWy4uLmdldFJvb3RDb250ZXh0KHRhcmdldCkuY29tcG9uZW50c107XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgaW5qZWN0b3IgaW5zdGFuY2UgdGhhdCBpcyBhc3NvY2lhdGVkIHdpdGhcbiAqIHRoZSBlbGVtZW50LCBjb21wb25lbnQgb3IgZGlyZWN0aXZlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW5qZWN0b3IodGFyZ2V0OiB7fSk6IEluamVjdG9yIHtcbiAgY29uc3QgY29udGV4dCA9IGxvYWRDb250ZXh0KHRhcmdldCk7XG4gIGNvbnN0IHROb2RlID0gY29udGV4dC5sVmlld0RhdGFbVFZJRVddLmRhdGFbY29udGV4dC5ub2RlSW5kZXhdIGFzIFRFbGVtZW50Tm9kZTtcblxuICByZXR1cm4gbmV3IE5vZGVJbmplY3Rvcih0Tm9kZSwgY29udGV4dC5sVmlld0RhdGEpO1xufVxuXG4vKipcbiAqIFJldHVybnMgYSBsaXN0IG9mIGFsbCB0aGUgZGlyZWN0aXZlcyB0aGF0IGFyZSBhc3NvY2lhdGVkXG4gKiB3aXRoIHRoZSB1bmRlcmx5aW5nIHRhcmdldCBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGlyZWN0aXZlcyh0YXJnZXQ6IHt9KTogQXJyYXk8e30+IHtcbiAgY29uc3QgY29udGV4dCA9IGxvYWRDb250ZXh0KHRhcmdldCkgITtcblxuICBpZiAoY29udGV4dC5kaXJlY3RpdmVzID09PSB1bmRlZmluZWQpIHtcbiAgICBjb250ZXh0LmRpcmVjdGl2ZXMgPSBkaXNjb3ZlckRpcmVjdGl2ZXMoY29udGV4dC5ub2RlSW5kZXgsIGNvbnRleHQubFZpZXdEYXRhLCBmYWxzZSk7XG4gIH1cblxuICByZXR1cm4gY29udGV4dC5kaXJlY3RpdmVzIHx8IFtdO1xufVxuXG4vKipcbiAqIFJldHVybnMgTENvbnRleHQgYXNzb2NpYXRlZCB3aXRoIGEgdGFyZ2V0IHBhc3NlZCBhcyBhbiBhcmd1bWVudC5cbiAqIFRocm93cyBpZiBhIGdpdmVuIHRhcmdldCBkb2Vzbid0IGhhdmUgYXNzb2NpYXRlZCBMQ29udGV4dC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvYWRDb250ZXh0KHRhcmdldDoge30pOiBMQ29udGV4dCB7XG4gIGNvbnN0IGNvbnRleHQgPSBnZXRDb250ZXh0KHRhcmdldCk7XG4gIGlmICghY29udGV4dCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgbmdEZXZNb2RlID8gJ1VuYWJsZSB0byBmaW5kIHRoZSBnaXZlbiBjb250ZXh0IGRhdGEgZm9yIHRoZSBnaXZlbiB0YXJnZXQnIDpcbiAgICAgICAgICAgICAgICAgICAgJ0ludmFsaWQgbmcgdGFyZ2V0Jyk7XG4gIH1cbiAgcmV0dXJuIGNvbnRleHQ7XG59XG5cbi8qKlxuICogUmV0cmlldmUgdGhlIHJvb3QgdmlldyBmcm9tIGFueSBjb21wb25lbnQgYnkgd2Fsa2luZyB0aGUgcGFyZW50IGBMVmlld0RhdGFgIHVudGlsXG4gKiByZWFjaGluZyB0aGUgcm9vdCBgTFZpZXdEYXRhYC5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50T3JWaWV3IGFueSBjb21wb25lbnQgb3Igdmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Um9vdFZpZXcoY29tcG9uZW50T3JWaWV3OiBMVmlld0RhdGEgfCB7fSk6IExWaWV3RGF0YSB7XG4gIGxldCBsVmlld0RhdGE6IExWaWV3RGF0YTtcbiAgaWYgKEFycmF5LmlzQXJyYXkoY29tcG9uZW50T3JWaWV3KSkge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGNvbXBvbmVudE9yVmlldywgJ2xWaWV3RGF0YScpO1xuICAgIGxWaWV3RGF0YSA9IGNvbXBvbmVudE9yVmlldyBhcyBMVmlld0RhdGE7XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoY29tcG9uZW50T3JWaWV3LCAnY29tcG9uZW50Jyk7XG4gICAgbFZpZXdEYXRhID0gcmVhZFBhdGNoZWRMVmlld0RhdGEoY29tcG9uZW50T3JWaWV3KSAhO1xuICB9XG4gIHdoaWxlIChsVmlld0RhdGEgJiYgIShsVmlld0RhdGFbRkxBR1NdICYgTFZpZXdGbGFncy5Jc1Jvb3QpKSB7XG4gICAgbFZpZXdEYXRhID0gbFZpZXdEYXRhW1BBUkVOVF0gITtcbiAgfVxuICByZXR1cm4gbFZpZXdEYXRhO1xufVxuXG4vKipcbiAqICBSZXRyaWV2ZSBtYXAgb2YgbG9jYWwgcmVmZXJlbmNlcyAobG9jYWwgcmVmZXJlbmNlIG5hbWUgPT4gZWxlbWVudCBvciBkaXJlY3RpdmUgaW5zdGFuY2UpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TG9jYWxSZWZzKHRhcmdldDoge30pOiB7W2tleTogc3RyaW5nXTogYW55fSB7XG4gIGNvbnN0IGNvbnRleHQgPSBsb2FkQ29udGV4dCh0YXJnZXQpICE7XG5cbiAgaWYgKGNvbnRleHQubG9jYWxSZWZzID09PSB1bmRlZmluZWQpIHtcbiAgICBjb250ZXh0LmxvY2FsUmVmcyA9IGRpc2NvdmVyTG9jYWxSZWZzKGNvbnRleHQubFZpZXdEYXRhLCBjb250ZXh0Lm5vZGVJbmRleCk7XG4gIH1cblxuICByZXR1cm4gY29udGV4dC5sb2NhbFJlZnMgfHwge307XG59XG4iXX0=
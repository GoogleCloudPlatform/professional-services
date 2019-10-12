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
import { SimpleChange } from '../../change_detection/change_detection_util';
/** @type {?} */
const PRIVATE_PREFIX = '__ngOnChanges_';
/** @typedef {?} */
var OnChangesExpando;
/**
 * The NgOnChangesFeature decorates a component with support for the ngOnChanges
 * lifecycle hook, so it should be included in any component that implements
 * that hook.
 *
 * If the component or directive uses inheritance, the NgOnChangesFeature MUST
 * be included as a feature AFTER {\@link InheritDefinitionFeature}, otherwise
 * inherited properties will not be propagated to the ngOnChanges lifecycle
 * hook.
 *
 * Example usage:
 *
 * ```
 * static ngComponentDef = defineComponent({
 *   ...
 *   inputs: {name: 'publicName'},
 *   features: [NgOnChangesFeature]
 * });
 * ```
 * @template T
 * @param {?} definition
 * @return {?}
 */
export function NgOnChangesFeature(definition) {
    /** @type {?} */
    const declaredToMinifiedInputs = definition.declaredInputs;
    /** @type {?} */
    const proto = definition.type.prototype;
    for (const declaredName in declaredToMinifiedInputs) {
        if (declaredToMinifiedInputs.hasOwnProperty(declaredName)) {
            /** @type {?} */
            const minifiedKey = declaredToMinifiedInputs[declaredName];
            /** @type {?} */
            const privateMinKey = PRIVATE_PREFIX + minifiedKey;
            /** @type {?} */
            let originalProperty = undefined;
            /** @type {?} */
            let checkProto = proto;
            while (!originalProperty && checkProto &&
                Object.getPrototypeOf(checkProto) !== Object.getPrototypeOf(Object.prototype)) {
                originalProperty = Object.getOwnPropertyDescriptor(checkProto, minifiedKey);
                checkProto = Object.getPrototypeOf(checkProto);
            }
            /** @type {?} */
            const getter = originalProperty && originalProperty.get;
            /** @type {?} */
            const setter = originalProperty && originalProperty.set;
            // create a getter and setter for property
            Object.defineProperty(proto, minifiedKey, {
                get: getter ||
                    (setter ? undefined : function () { return this[privateMinKey]; }),
                /**
                 * @template T
                 * @this {?}
                 * @param {?} value
                 * @return {?}
                 */
                set(value) {
                    /** @type {?} */
                    let simpleChanges = this[PRIVATE_PREFIX];
                    if (!simpleChanges) {
                        simpleChanges = {};
                        // Place where we will store SimpleChanges if there is a change
                        Object.defineProperty(this, PRIVATE_PREFIX, { value: simpleChanges, writable: true });
                    }
                    /** @type {?} */
                    const isFirstChange = !this.hasOwnProperty(privateMinKey);
                    /** @type {?} */
                    const currentChange = simpleChanges[declaredName];
                    if (currentChange) {
                        currentChange.currentValue = value;
                    }
                    else {
                        simpleChanges[declaredName] =
                            new SimpleChange(this[privateMinKey], value, isFirstChange);
                    }
                    if (isFirstChange) {
                        // Create a place where the actual value will be stored and make it non-enumerable
                        Object.defineProperty(this, privateMinKey, { value, writable: true });
                    }
                    else {
                        this[privateMinKey] = value;
                    }
                    if (setter)
                        setter.call(this, value);
                },
                // Make the property configurable in dev mode to allow overriding in tests
                configurable: !!ngDevMode
            });
        }
    }
    // If an onInit hook is defined, it will need to wrap the ngOnChanges call
    // so the call order is changes-init-check in creation mode. In subsequent
    // change detection runs, only the check wrapper will be called.
    if (definition.onInit != null) {
        definition.onInit = onChangesWrapper(definition.onInit);
    }
    definition.doCheck = onChangesWrapper(definition.doCheck);
}
/**
 * @param {?} delegateHook
 * @return {?}
 */
function onChangesWrapper(delegateHook) {
    return function () {
        /** @type {?} */
        const simpleChanges = this[PRIVATE_PREFIX];
        if (simpleChanges != null) {
            this.ngOnChanges(simpleChanges);
            this[PRIVATE_PREFIX] = null;
        }
        if (delegateHook)
            delegateHook.apply(this);
    };
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfb25jaGFuZ2VzX2ZlYXR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ZlYXR1cmVzL25nX29uY2hhbmdlc19mZWF0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLDhDQUE4QyxDQUFDOztBQUkxRSxNQUFNLGNBQWMsR0FBRyxnQkFBZ0IsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE0QnhDLE1BQU0sVUFBVSxrQkFBa0IsQ0FBSSxVQUEyQjs7SUFDL0QsTUFBTSx3QkFBd0IsR0FBRyxVQUFVLENBQUMsY0FBYyxDQUFDOztJQUMzRCxNQUFNLEtBQUssR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztJQUN4QyxLQUFLLE1BQU0sWUFBWSxJQUFJLHdCQUF3QixFQUFFO1FBQ25ELElBQUksd0JBQXdCLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FBQyxFQUFFOztZQUN6RCxNQUFNLFdBQVcsR0FBRyx3QkFBd0IsQ0FBQyxZQUFZLENBQUMsQ0FBQzs7WUFDM0QsTUFBTSxhQUFhLEdBQUcsY0FBYyxHQUFHLFdBQVcsQ0FBQzs7WUFJbkQsSUFBSSxnQkFBZ0IsR0FBaUMsU0FBUyxDQUFDOztZQUMvRCxJQUFJLFVBQVUsR0FBRyxLQUFLLENBQUM7WUFDdkIsT0FBTyxDQUFDLGdCQUFnQixJQUFJLFVBQVU7Z0JBQy9CLE1BQU0sQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLEtBQUssTUFBTSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEVBQUU7Z0JBQ3BGLGdCQUFnQixHQUFHLE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyxVQUFVLEVBQUUsV0FBVyxDQUFDLENBQUM7Z0JBQzVFLFVBQVUsR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2FBQ2hEOztZQUVELE1BQU0sTUFBTSxHQUFHLGdCQUFnQixJQUFJLGdCQUFnQixDQUFDLEdBQUcsQ0FBQzs7WUFDeEQsTUFBTSxNQUFNLEdBQUcsZ0JBQWdCLElBQUksZ0JBQWdCLENBQUMsR0FBRyxDQUFDOztZQUd4RCxNQUFNLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBRSxXQUFXLEVBQUU7Z0JBQ3hDLEdBQUcsRUFBRSxNQUFNO29CQUNQLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLGNBQW1DLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsQ0FBQzs7Ozs7OztnQkFDM0YsR0FBRyxDQUE0QixLQUFROztvQkFDckMsSUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO29CQUN6QyxJQUFJLENBQUMsYUFBYSxFQUFFO3dCQUNsQixhQUFhLEdBQUcsRUFBRSxDQUFDOzt3QkFFbkIsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFLEVBQUMsS0FBSyxFQUFFLGFBQWEsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztxQkFDckY7O29CQUVELE1BQU0sYUFBYSxHQUFHLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxhQUFhLENBQUMsQ0FBQzs7b0JBQzFELE1BQU0sYUFBYSxHQUFHLGFBQWEsQ0FBQyxZQUFZLENBQUMsQ0FBQztvQkFFbEQsSUFBSSxhQUFhLEVBQUU7d0JBQ2pCLGFBQWEsQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO3FCQUNwQzt5QkFBTTt3QkFDTCxhQUFhLENBQUMsWUFBWSxDQUFDOzRCQUN2QixJQUFJLFlBQVksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsS0FBSyxFQUFFLGFBQWEsQ0FBQyxDQUFDO3FCQUNqRTtvQkFFRCxJQUFJLGFBQWEsRUFBRTs7d0JBRWpCLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRSxFQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztxQkFDckU7eUJBQU07d0JBQ0wsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLEtBQUssQ0FBQztxQkFDN0I7b0JBRUQsSUFBSSxNQUFNO3dCQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO2lCQUN0Qzs7Z0JBRUQsWUFBWSxFQUFFLENBQUMsQ0FBQyxTQUFTO2FBQzFCLENBQUMsQ0FBQztTQUNKO0tBQ0Y7Ozs7SUFLRCxJQUFJLFVBQVUsQ0FBQyxNQUFNLElBQUksSUFBSSxFQUFFO1FBQzdCLFVBQVUsQ0FBQyxNQUFNLEdBQUcsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0tBQ3pEO0lBRUQsVUFBVSxDQUFDLE9BQU8sR0FBRyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7Q0FDM0Q7Ozs7O0FBRUQsU0FBUyxnQkFBZ0IsQ0FBQyxZQUFpQztJQUN6RCxPQUFPOztRQUNMLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUMzQyxJQUFJLGFBQWEsSUFBSSxJQUFJLEVBQUU7WUFDekIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUNoQyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsSUFBSSxDQUFDO1NBQzdCO1FBQ0QsSUFBSSxZQUFZO1lBQUUsWUFBWSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUM1QyxDQUFDO0NBQ0giLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7U2ltcGxlQ2hhbmdlfSBmcm9tICcuLi8uLi9jaGFuZ2VfZGV0ZWN0aW9uL2NoYW5nZV9kZXRlY3Rpb25fdXRpbCc7XG5pbXBvcnQge09uQ2hhbmdlcywgU2ltcGxlQ2hhbmdlc30gZnJvbSAnLi4vLi4vbWV0YWRhdGEvbGlmZWN5Y2xlX2hvb2tzJztcbmltcG9ydCB7RGlyZWN0aXZlRGVmfSBmcm9tICcuLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuXG5jb25zdCBQUklWQVRFX1BSRUZJWCA9ICdfX25nT25DaGFuZ2VzXyc7XG5cbnR5cGUgT25DaGFuZ2VzRXhwYW5kbyA9IE9uQ2hhbmdlcyAmIHtcbiAgX19uZ09uQ2hhbmdlc186IFNpbXBsZUNoYW5nZXN8bnVsbHx1bmRlZmluZWQ7XG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnkgQ2FuIGhvbGQgYW55IHZhbHVlXG4gIFtrZXk6IHN0cmluZ106IGFueTtcbn07XG5cbi8qKlxuICogVGhlIE5nT25DaGFuZ2VzRmVhdHVyZSBkZWNvcmF0ZXMgYSBjb21wb25lbnQgd2l0aCBzdXBwb3J0IGZvciB0aGUgbmdPbkNoYW5nZXNcbiAqIGxpZmVjeWNsZSBob29rLCBzbyBpdCBzaG91bGQgYmUgaW5jbHVkZWQgaW4gYW55IGNvbXBvbmVudCB0aGF0IGltcGxlbWVudHNcbiAqIHRoYXQgaG9vay5cbiAqXG4gKiBJZiB0aGUgY29tcG9uZW50IG9yIGRpcmVjdGl2ZSB1c2VzIGluaGVyaXRhbmNlLCB0aGUgTmdPbkNoYW5nZXNGZWF0dXJlIE1VU1RcbiAqIGJlIGluY2x1ZGVkIGFzIGEgZmVhdHVyZSBBRlRFUiB7QGxpbmsgSW5oZXJpdERlZmluaXRpb25GZWF0dXJlfSwgb3RoZXJ3aXNlXG4gKiBpbmhlcml0ZWQgcHJvcGVydGllcyB3aWxsIG5vdCBiZSBwcm9wYWdhdGVkIHRvIHRoZSBuZ09uQ2hhbmdlcyBsaWZlY3ljbGVcbiAqIGhvb2suXG4gKlxuICogRXhhbXBsZSB1c2FnZTpcbiAqXG4gKiBgYGBcbiAqIHN0YXRpYyBuZ0NvbXBvbmVudERlZiA9IGRlZmluZUNvbXBvbmVudCh7XG4gKiAgIC4uLlxuICogICBpbnB1dHM6IHtuYW1lOiAncHVibGljTmFtZSd9LFxuICogICBmZWF0dXJlczogW05nT25DaGFuZ2VzRmVhdHVyZV1cbiAqIH0pO1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBOZ09uQ2hhbmdlc0ZlYXR1cmU8VD4oZGVmaW5pdGlvbjogRGlyZWN0aXZlRGVmPFQ+KTogdm9pZCB7XG4gIGNvbnN0IGRlY2xhcmVkVG9NaW5pZmllZElucHV0cyA9IGRlZmluaXRpb24uZGVjbGFyZWRJbnB1dHM7XG4gIGNvbnN0IHByb3RvID0gZGVmaW5pdGlvbi50eXBlLnByb3RvdHlwZTtcbiAgZm9yIChjb25zdCBkZWNsYXJlZE5hbWUgaW4gZGVjbGFyZWRUb01pbmlmaWVkSW5wdXRzKSB7XG4gICAgaWYgKGRlY2xhcmVkVG9NaW5pZmllZElucHV0cy5oYXNPd25Qcm9wZXJ0eShkZWNsYXJlZE5hbWUpKSB7XG4gICAgICBjb25zdCBtaW5pZmllZEtleSA9IGRlY2xhcmVkVG9NaW5pZmllZElucHV0c1tkZWNsYXJlZE5hbWVdO1xuICAgICAgY29uc3QgcHJpdmF0ZU1pbktleSA9IFBSSVZBVEVfUFJFRklYICsgbWluaWZpZWRLZXk7XG5cbiAgICAgIC8vIFdhbGsgdGhlIHByb3RvdHlwZSBjaGFpbiB0byBzZWUgaWYgd2UgZmluZCBhIHByb3BlcnR5IGRlc2NyaXB0b3JcbiAgICAgIC8vIFRoYXQgd2F5IHdlIGNhbiBob25vciBzZXR0ZXJzIGFuZCBnZXR0ZXJzIHRoYXQgd2VyZSBpbmhlcml0ZWQuXG4gICAgICBsZXQgb3JpZ2luYWxQcm9wZXJ0eTogUHJvcGVydHlEZXNjcmlwdG9yfHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICAgIGxldCBjaGVja1Byb3RvID0gcHJvdG87XG4gICAgICB3aGlsZSAoIW9yaWdpbmFsUHJvcGVydHkgJiYgY2hlY2tQcm90byAmJlxuICAgICAgICAgICAgIE9iamVjdC5nZXRQcm90b3R5cGVPZihjaGVja1Byb3RvKSAhPT0gT2JqZWN0LmdldFByb3RvdHlwZU9mKE9iamVjdC5wcm90b3R5cGUpKSB7XG4gICAgICAgIG9yaWdpbmFsUHJvcGVydHkgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGNoZWNrUHJvdG8sIG1pbmlmaWVkS2V5KTtcbiAgICAgICAgY2hlY2tQcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihjaGVja1Byb3RvKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZ2V0dGVyID0gb3JpZ2luYWxQcm9wZXJ0eSAmJiBvcmlnaW5hbFByb3BlcnR5LmdldDtcbiAgICAgIGNvbnN0IHNldHRlciA9IG9yaWdpbmFsUHJvcGVydHkgJiYgb3JpZ2luYWxQcm9wZXJ0eS5zZXQ7XG5cbiAgICAgIC8vIGNyZWF0ZSBhIGdldHRlciBhbmQgc2V0dGVyIGZvciBwcm9wZXJ0eVxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLCBtaW5pZmllZEtleSwge1xuICAgICAgICBnZXQ6IGdldHRlciB8fFxuICAgICAgICAgICAgKHNldHRlciA/IHVuZGVmaW5lZCA6IGZ1bmN0aW9uKHRoaXM6IE9uQ2hhbmdlc0V4cGFuZG8pIHsgcmV0dXJuIHRoaXNbcHJpdmF0ZU1pbktleV07IH0pLFxuICAgICAgICBzZXQ8VD4odGhpczogT25DaGFuZ2VzRXhwYW5kbywgdmFsdWU6IFQpIHtcbiAgICAgICAgICBsZXQgc2ltcGxlQ2hhbmdlcyA9IHRoaXNbUFJJVkFURV9QUkVGSVhdO1xuICAgICAgICAgIGlmICghc2ltcGxlQ2hhbmdlcykge1xuICAgICAgICAgICAgc2ltcGxlQ2hhbmdlcyA9IHt9O1xuICAgICAgICAgICAgLy8gUGxhY2Ugd2hlcmUgd2Ugd2lsbCBzdG9yZSBTaW1wbGVDaGFuZ2VzIGlmIHRoZXJlIGlzIGEgY2hhbmdlXG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgUFJJVkFURV9QUkVGSVgsIHt2YWx1ZTogc2ltcGxlQ2hhbmdlcywgd3JpdGFibGU6IHRydWV9KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBpc0ZpcnN0Q2hhbmdlID0gIXRoaXMuaGFzT3duUHJvcGVydHkocHJpdmF0ZU1pbktleSk7XG4gICAgICAgICAgY29uc3QgY3VycmVudENoYW5nZSA9IHNpbXBsZUNoYW5nZXNbZGVjbGFyZWROYW1lXTtcblxuICAgICAgICAgIGlmIChjdXJyZW50Q2hhbmdlKSB7XG4gICAgICAgICAgICBjdXJyZW50Q2hhbmdlLmN1cnJlbnRWYWx1ZSA9IHZhbHVlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzaW1wbGVDaGFuZ2VzW2RlY2xhcmVkTmFtZV0gPVxuICAgICAgICAgICAgICAgIG5ldyBTaW1wbGVDaGFuZ2UodGhpc1twcml2YXRlTWluS2V5XSwgdmFsdWUsIGlzRmlyc3RDaGFuZ2UpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChpc0ZpcnN0Q2hhbmdlKSB7XG4gICAgICAgICAgICAvLyBDcmVhdGUgYSBwbGFjZSB3aGVyZSB0aGUgYWN0dWFsIHZhbHVlIHdpbGwgYmUgc3RvcmVkIGFuZCBtYWtlIGl0IG5vbi1lbnVtZXJhYmxlXG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgcHJpdmF0ZU1pbktleSwge3ZhbHVlLCB3cml0YWJsZTogdHJ1ZX0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzW3ByaXZhdGVNaW5LZXldID0gdmFsdWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHNldHRlcikgc2V0dGVyLmNhbGwodGhpcywgdmFsdWUpO1xuICAgICAgICB9LFxuICAgICAgICAvLyBNYWtlIHRoZSBwcm9wZXJ0eSBjb25maWd1cmFibGUgaW4gZGV2IG1vZGUgdG8gYWxsb3cgb3ZlcnJpZGluZyBpbiB0ZXN0c1xuICAgICAgICBjb25maWd1cmFibGU6ICEhbmdEZXZNb2RlXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvLyBJZiBhbiBvbkluaXQgaG9vayBpcyBkZWZpbmVkLCBpdCB3aWxsIG5lZWQgdG8gd3JhcCB0aGUgbmdPbkNoYW5nZXMgY2FsbFxuICAvLyBzbyB0aGUgY2FsbCBvcmRlciBpcyBjaGFuZ2VzLWluaXQtY2hlY2sgaW4gY3JlYXRpb24gbW9kZS4gSW4gc3Vic2VxdWVudFxuICAvLyBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bnMsIG9ubHkgdGhlIGNoZWNrIHdyYXBwZXIgd2lsbCBiZSBjYWxsZWQuXG4gIGlmIChkZWZpbml0aW9uLm9uSW5pdCAhPSBudWxsKSB7XG4gICAgZGVmaW5pdGlvbi5vbkluaXQgPSBvbkNoYW5nZXNXcmFwcGVyKGRlZmluaXRpb24ub25Jbml0KTtcbiAgfVxuXG4gIGRlZmluaXRpb24uZG9DaGVjayA9IG9uQ2hhbmdlc1dyYXBwZXIoZGVmaW5pdGlvbi5kb0NoZWNrKTtcbn1cblxuZnVuY3Rpb24gb25DaGFuZ2VzV3JhcHBlcihkZWxlZ2F0ZUhvb2s6ICgoKSA9PiB2b2lkKSB8IG51bGwpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHRoaXM6IE9uQ2hhbmdlc0V4cGFuZG8pIHtcbiAgICBjb25zdCBzaW1wbGVDaGFuZ2VzID0gdGhpc1tQUklWQVRFX1BSRUZJWF07XG4gICAgaWYgKHNpbXBsZUNoYW5nZXMgIT0gbnVsbCkge1xuICAgICAgdGhpcy5uZ09uQ2hhbmdlcyhzaW1wbGVDaGFuZ2VzKTtcbiAgICAgIHRoaXNbUFJJVkFURV9QUkVGSVhdID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKGRlbGVnYXRlSG9vaykgZGVsZWdhdGVIb29rLmFwcGx5KHRoaXMpO1xuICB9O1xufVxuIl19
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { SimpleChange } from '../../change_detection/change_detection_util';
var PRIVATE_PREFIX = '__ngOnChanges_';
/**
 * The NgOnChangesFeature decorates a component with support for the ngOnChanges
 * lifecycle hook, so it should be included in any component that implements
 * that hook.
 *
 * If the component or directive uses inheritance, the NgOnChangesFeature MUST
 * be included as a feature AFTER {@link InheritDefinitionFeature}, otherwise
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
 */
export function NgOnChangesFeature(definition) {
    var declaredToMinifiedInputs = definition.declaredInputs;
    var proto = definition.type.prototype;
    var _loop_1 = function (declaredName) {
        if (declaredToMinifiedInputs.hasOwnProperty(declaredName)) {
            var minifiedKey = declaredToMinifiedInputs[declaredName];
            var privateMinKey_1 = PRIVATE_PREFIX + minifiedKey;
            // Walk the prototype chain to see if we find a property descriptor
            // That way we can honor setters and getters that were inherited.
            var originalProperty = undefined;
            var checkProto = proto;
            while (!originalProperty && checkProto &&
                Object.getPrototypeOf(checkProto) !== Object.getPrototypeOf(Object.prototype)) {
                originalProperty = Object.getOwnPropertyDescriptor(checkProto, minifiedKey);
                checkProto = Object.getPrototypeOf(checkProto);
            }
            var getter = originalProperty && originalProperty.get;
            var setter_1 = originalProperty && originalProperty.set;
            // create a getter and setter for property
            Object.defineProperty(proto, minifiedKey, {
                get: getter ||
                    (setter_1 ? undefined : function () { return this[privateMinKey_1]; }),
                set: function (value) {
                    var simpleChanges = this[PRIVATE_PREFIX];
                    if (!simpleChanges) {
                        simpleChanges = {};
                        // Place where we will store SimpleChanges if there is a change
                        Object.defineProperty(this, PRIVATE_PREFIX, { value: simpleChanges, writable: true });
                    }
                    var isFirstChange = !this.hasOwnProperty(privateMinKey_1);
                    var currentChange = simpleChanges[declaredName];
                    if (currentChange) {
                        currentChange.currentValue = value;
                    }
                    else {
                        simpleChanges[declaredName] =
                            new SimpleChange(this[privateMinKey_1], value, isFirstChange);
                    }
                    if (isFirstChange) {
                        // Create a place where the actual value will be stored and make it non-enumerable
                        Object.defineProperty(this, privateMinKey_1, { value: value, writable: true });
                    }
                    else {
                        this[privateMinKey_1] = value;
                    }
                    if (setter_1)
                        setter_1.call(this, value);
                },
                // Make the property configurable in dev mode to allow overriding in tests
                configurable: !!ngDevMode
            });
        }
    };
    for (var declaredName in declaredToMinifiedInputs) {
        _loop_1(declaredName);
    }
    // If an onInit hook is defined, it will need to wrap the ngOnChanges call
    // so the call order is changes-init-check in creation mode. In subsequent
    // change detection runs, only the check wrapper will be called.
    if (definition.onInit != null) {
        definition.onInit = onChangesWrapper(definition.onInit);
    }
    definition.doCheck = onChangesWrapper(definition.doCheck);
}
function onChangesWrapper(delegateHook) {
    return function () {
        var simpleChanges = this[PRIVATE_PREFIX];
        if (simpleChanges != null) {
            this.ngOnChanges(simpleChanges);
            this[PRIVATE_PREFIX] = null;
        }
        if (delegateHook)
            delegateHook.apply(this);
    };
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfb25jaGFuZ2VzX2ZlYXR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ZlYXR1cmVzL25nX29uY2hhbmdlc19mZWF0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSw4Q0FBOEMsQ0FBQztBQUkxRSxJQUFNLGNBQWMsR0FBRyxnQkFBZ0IsQ0FBQztBQVF4Qzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQW1CRztBQUNILE1BQU0sVUFBVSxrQkFBa0IsQ0FBSSxVQUEyQjtJQUMvRCxJQUFNLHdCQUF3QixHQUFHLFVBQVUsQ0FBQyxjQUFjLENBQUM7SUFDM0QsSUFBTSxLQUFLLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7NEJBQzdCLFlBQVk7UUFDckIsSUFBSSx3QkFBd0IsQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLEVBQUU7WUFDekQsSUFBTSxXQUFXLEdBQUcsd0JBQXdCLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDM0QsSUFBTSxlQUFhLEdBQUcsY0FBYyxHQUFHLFdBQVcsQ0FBQztZQUVuRCxtRUFBbUU7WUFDbkUsaUVBQWlFO1lBQ2pFLElBQUksZ0JBQWdCLEdBQWlDLFNBQVMsQ0FBQztZQUMvRCxJQUFJLFVBQVUsR0FBRyxLQUFLLENBQUM7WUFDdkIsT0FBTyxDQUFDLGdCQUFnQixJQUFJLFVBQVU7Z0JBQy9CLE1BQU0sQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLEtBQUssTUFBTSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEVBQUU7Z0JBQ3BGLGdCQUFnQixHQUFHLE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyxVQUFVLEVBQUUsV0FBVyxDQUFDLENBQUM7Z0JBQzVFLFVBQVUsR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFD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eXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1NpbXBsZUNoYW5nZX0gZnJvbSAnLi4vLi4vY2hhbmdlX2RldGVjdGlvbi9jaGFuZ2VfZGV0ZWN0aW9uX3V0aWwnO1xuaW1wb3J0IHtPbkNoYW5nZXMsIFNpbXBsZUNoYW5nZXN9IGZyb20gJy4uLy4uL21ldGFkYXRhL2xpZmVjeWNsZV9ob29rcyc7XG5pbXBvcnQge0RpcmVjdGl2ZURlZn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcblxuY29uc3QgUFJJVkFURV9QUkVGSVggPSAnX19uZ09uQ2hhbmdlc18nO1xuXG50eXBlIE9uQ2hhbmdlc0V4cGFuZG8gPSBPbkNoYW5nZXMgJiB7XG4gIF9fbmdPbkNoYW5nZXNfOiBTaW1wbGVDaGFuZ2VzfG51bGx8dW5kZWZpbmVkO1xuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55IENhbiBob2xkIGFueSB2YWx1ZVxuICBba2V5OiBzdHJpbmddOiBhbnk7XG59O1xuXG4vKipcbiAqIFRoZSBOZ09uQ2hhbmdlc0ZlYXR1cmUgZGVjb3JhdGVzIGEgY29tcG9uZW50IHdpdGggc3VwcG9ydCBmb3IgdGhlIG5nT25DaGFuZ2VzXG4gKiBsaWZlY3ljbGUgaG9vaywgc28gaXQgc2hvdWxkIGJlIGluY2x1ZGVkIGluIGFueSBjb21wb25lbnQgdGhhdCBpbXBsZW1lbnRzXG4gKiB0aGF0IGhvb2suXG4gKlxuICogSWYgdGhlIGNvbXBvbmVudCBvciBkaXJlY3RpdmUgdXNlcyBpbmhlcml0YW5jZSwgdGhlIE5nT25DaGFuZ2VzRmVhdHVyZSBNVVNUXG4gKiBiZSBpbmNsdWRlZCBhcyBhIGZlYXR1cmUgQUZURVIge0BsaW5rIEluaGVyaXREZWZpbml0aW9uRmVhdHVyZX0sIG90aGVyd2lzZVxuICogaW5oZXJpdGVkIHByb3BlcnRpZXMgd2lsbCBub3QgYmUgcHJvcGFnYXRlZCB0byB0aGUgbmdPbkNoYW5nZXMgbGlmZWN5Y2xlXG4gKiBob29rLlxuICpcbiAqIEV4YW1wbGUgdXNhZ2U6XG4gKlxuICogYGBgXG4gKiBzdGF0aWMgbmdDb21wb25lbnREZWYgPSBkZWZpbmVDb21wb25lbnQoe1xuICogICAuLi5cbiAqICAgaW5wdXRzOiB7bmFtZTogJ3B1YmxpY05hbWUnfSxcbiAqICAgZmVhdHVyZXM6IFtOZ09uQ2hhbmdlc0ZlYXR1cmVdXG4gKiB9KTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gTmdPbkNoYW5nZXNGZWF0dXJlPFQ+KGRlZmluaXRpb246IERpcmVjdGl2ZURlZjxUPik6IHZvaWQge1xuICBjb25zdCBkZWNsYXJlZFRvTWluaWZpZWRJbnB1dHMgPSBkZWZpbml0aW9uLmRlY2xhcmVkSW5wdXRzO1xuICBjb25zdCBwcm90byA9IGRlZmluaXRpb24udHlwZS5wcm90b3R5cGU7XG4gIGZvciAoY29uc3QgZGVjbGFyZWROYW1lIGluIGRlY2xhcmVkVG9NaW5pZmllZElucHV0cykge1xuICAgIGlmIChkZWNsYXJlZFRvTWluaWZpZWRJbnB1dHMuaGFzT3duUHJvcGVydHkoZGVjbGFyZWROYW1lKSkge1xuICAgICAgY29uc3QgbWluaWZpZWRLZXkgPSBkZWNsYXJlZFRvTWluaWZpZWRJbnB1dHNbZGVjbGFyZWROYW1lXTtcbiAgICAgIGNvbnN0IHByaXZhdGVNaW5LZXkgPSBQUklWQVRFX1BSRUZJWCArIG1pbmlmaWVkS2V5O1xuXG4gICAgICAvLyBXYWxrIHRoZSBwcm90b3R5cGUgY2hhaW4gdG8gc2VlIGlmIHdlIGZpbmQgYSBwcm9wZXJ0eSBkZXNjcmlwdG9yXG4gICAgICAvLyBUaGF0IHdheSB3ZSBjYW4gaG9ub3Igc2V0dGVycyBhbmQgZ2V0dGVycyB0aGF0IHdlcmUgaW5oZXJpdGVkLlxuICAgICAgbGV0IG9yaWdpbmFsUHJvcGVydHk6IFByb3BlcnR5RGVzY3JpcHRvcnx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgICBsZXQgY2hlY2tQcm90byA9IHByb3RvO1xuICAgICAgd2hpbGUgKCFvcmlnaW5hbFByb3BlcnR5ICYmIGNoZWNrUHJvdG8gJiZcbiAgICAgICAgICAgICBPYmplY3QuZ2V0UHJvdG90eXBlT2YoY2hlY2tQcm90bykgIT09IE9iamVjdC5nZXRQcm90b3R5cGVPZihPYmplY3QucHJvdG90eXBlKSkge1xuICAgICAgICBvcmlnaW5hbFByb3BlcnR5ID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihjaGVja1Byb3RvLCBtaW5pZmllZEtleSk7XG4gICAgICAgIGNoZWNrUHJvdG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YoY2hlY2tQcm90byk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGdldHRlciA9IG9yaWdpbmFsUHJvcGVydHkgJiYgb3JpZ2luYWxQcm9wZXJ0eS5nZXQ7XG4gICAgICBjb25zdCBzZXR0ZXIgPSBvcmlnaW5hbFByb3BlcnR5ICYmIG9yaWdpbmFsUHJvcGVydHkuc2V0O1xuXG4gICAgICAvLyBjcmVhdGUgYSBnZXR0ZXIgYW5kIHNldHRlciBmb3IgcHJvcGVydHlcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90bywgbWluaWZpZWRLZXksIHtcbiAgICAgICAgZ2V0OiBnZXR0ZXIgfHxcbiAgICAgICAgICAgIChzZXR0ZXIgPyB1bmRlZmluZWQgOiBmdW5jdGlvbih0aGlzOiBPbkNoYW5nZXNFeHBhbmRvKSB7IHJldHVybiB0aGlzW3ByaXZhdGVNaW5LZXldOyB9KSxcbiAgICAgICAgc2V0PFQ+KHRoaXM6IE9uQ2hhbmdlc0V4cGFuZG8sIHZhbHVlOiBUKSB7XG4gICAgICAgICAgbGV0IHNpbXBsZUNoYW5nZXMgPSB0aGlzW1BSSVZBVEVfUFJFRklYXTtcbiAgICAgICAgICBpZiAoIXNpbXBsZUNoYW5nZXMpIHtcbiAgICAgICAgICAgIHNpbXBsZUNoYW5nZXMgPSB7fTtcbiAgICAgICAgICAgIC8vIFBsYWNlIHdoZXJlIHdlIHdpbGwgc3RvcmUgU2ltcGxlQ2hhbmdlcyBpZiB0aGVyZSBpcyBhIGNoYW5nZVxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFBSSVZBVEVfUFJFRklYLCB7dmFsdWU6IHNpbXBsZUNoYW5nZXMsIHdyaXRhYmxlOiB0cnVlfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgaXNGaXJzdENoYW5nZSA9ICF0aGlzLmhhc093blByb3BlcnR5KHByaXZhdGVNaW5LZXkpO1xuICAgICAgICAgIGNvbnN0IGN1cnJlbnRDaGFuZ2UgPSBzaW1wbGVDaGFuZ2VzW2RlY2xhcmVkTmFtZV07XG5cbiAgICAgICAgICBpZiAoY3VycmVudENoYW5nZSkge1xuICAgICAgICAgICAgY3VycmVudENoYW5nZS5jdXJyZW50VmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2ltcGxlQ2hhbmdlc1tkZWNsYXJlZE5hbWVdID1cbiAgICAgICAgICAgICAgICBuZXcgU2ltcGxlQ2hhbmdlKHRoaXNbcHJpdmF0ZU1pbktleV0sIHZhbHVlLCBpc0ZpcnN0Q2hhbmdlKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoaXNGaXJzdENoYW5nZSkge1xuICAgICAgICAgICAgLy8gQ3JlYXRlIGEgcGxhY2Ugd2hlcmUgdGhlIGFjdHVhbCB2YWx1ZSB3aWxsIGJlIHN0b3JlZCBhbmQgbWFrZSBpdCBub24tZW51bWVyYWJsZVxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIHByaXZhdGVNaW5LZXksIHt2YWx1ZSwgd3JpdGFibGU6IHRydWV9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpc1twcml2YXRlTWluS2V5XSA9IHZhbHVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChzZXR0ZXIpIHNldHRlci5jYWxsKHRoaXMsIHZhbHVlKTtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gTWFrZSB0aGUgcHJvcGVydHkgY29uZmlndXJhYmxlIGluIGRldiBtb2RlIHRvIGFsbG93IG92ZXJyaWRpbmcgaW4gdGVzdHNcbiAgICAgICAgY29uZmlndXJhYmxlOiAhIW5nRGV2TW9kZVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLy8gSWYgYW4gb25Jbml0IGhvb2sgaXMgZGVmaW5lZCwgaXQgd2lsbCBuZWVkIHRvIHdyYXAgdGhlIG5nT25DaGFuZ2VzIGNhbGxcbiAgLy8gc28gdGhlIGNhbGwgb3JkZXIgaXMgY2hhbmdlcy1pbml0LWNoZWNrIGluIGNyZWF0aW9uIG1vZGUuIEluIHN1YnNlcXVlbnRcbiAgLy8gY2hhbmdlIGRldGVjdGlvbiBydW5zLCBvbmx5IHRoZSBjaGVjayB3cmFwcGVyIHdpbGwgYmUgY2FsbGVkLlxuICBpZiAoZGVmaW5pdGlvbi5vbkluaXQgIT0gbnVsbCkge1xuICAgIGRlZmluaXRpb24ub25Jbml0ID0gb25DaGFuZ2VzV3JhcHBlcihkZWZpbml0aW9uLm9uSW5pdCk7XG4gIH1cblxuICBkZWZpbml0aW9uLmRvQ2hlY2sgPSBvbkNoYW5nZXNXcmFwcGVyKGRlZmluaXRpb24uZG9DaGVjayk7XG59XG5cbmZ1bmN0aW9uIG9uQ2hhbmdlc1dyYXBwZXIoZGVsZWdhdGVIb29rOiAoKCkgPT4gdm9pZCkgfCBudWxsKSB7XG4gIHJldHVybiBmdW5jdGlvbih0aGlzOiBPbkNoYW5nZXNFeHBhbmRvKSB7XG4gICAgY29uc3Qgc2ltcGxlQ2hhbmdlcyA9IHRoaXNbUFJJVkFURV9QUkVGSVhdO1xuICAgIGlmIChzaW1wbGVDaGFuZ2VzICE9IG51bGwpIHtcbiAgICAgIHRoaXMubmdPbkNoYW5nZXMoc2ltcGxlQ2hhbmdlcyk7XG4gICAgICB0aGlzW1BSSVZBVEVfUFJFRklYXSA9IG51bGw7XG4gICAgfVxuICAgIGlmIChkZWxlZ2F0ZUhvb2spIGRlbGVnYXRlSG9vay5hcHBseSh0aGlzKTtcbiAgfTtcbn1cbiJdfQ==
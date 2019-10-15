/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { fillProperties } from '../../util/property';
import { EMPTY, EMPTY_ARRAY } from '../definition';
/**
 * Determines if a definition is a {@link ComponentDef} or a {@link DirectiveDef}
 * @param definition The definition to examine
 */
function isComponentDef(definition) {
    var def = definition;
    return typeof def.template === 'function';
}
function getSuperType(type) {
    return Object.getPrototypeOf(type.prototype).constructor;
}
/**
 * Merges the definition from a super class to a sub class.
 * @param definition The definition that is a SubClass of another directive of component
 */
export function InheritDefinitionFeature(definition) {
    var superType = getSuperType(definition.type);
    var _loop_1 = function () {
        var e_1, _a;
        var superDef = undefined;
        if (isComponentDef(definition)) {
            // Don't use getComponentDef/getDirectiveDef. This logic relies on inheritance.
            superDef = superType.ngComponentDef || superType.ngDirectiveDef;
        }
        else {
            if (superType.ngComponentDef) {
                throw new Error('Directives cannot inherit Components');
            }
            // Don't use getComponentDef/getDirectiveDef. This logic relies on inheritance.
            superDef = superType.ngDirectiveDef;
        }
        var baseDef = superType.ngBaseDef;
        // Some fields in the definition may be empty, if there were no values to put in them that
        // would've justified object creation. Unwrap them if necessary.
        if (baseDef || superDef) {
            var writeableDef = definition;
            writeableDef.inputs = maybeUnwrapEmpty(definition.inputs);
            writeableDef.declaredInputs = maybeUnwrapEmpty(definition.declaredInputs);
            writeableDef.outputs = maybeUnwrapEmpty(definition.outputs);
        }
        if (baseDef) {
            // Merge inputs and outputs
            fillProperties(definition.inputs, baseDef.inputs);
            fillProperties(definition.declaredInputs, baseDef.declaredInputs);
            fillProperties(definition.outputs, baseDef.outputs);
        }
        if (superDef) {
            // Merge hostBindings
            var prevHostBindings_1 = definition.hostBindings;
            var superHostBindings_1 = superDef.hostBindings;
            if (superHostBindings_1) {
                if (prevHostBindings_1) {
                    definition.hostBindings = function (directiveIndex, elementIndex) {
                        superHostBindings_1(directiveIndex, elementIndex);
                        prevHostBindings_1(directiveIndex, elementIndex);
                    };
                }
                else {
                    definition.hostBindings = superHostBindings_1;
                }
            }
            // Merge View Queries
            if (isComponentDef(definition) && isComponentDef(superDef)) {
                var prevViewQuery_1 = definition.viewQuery;
                var superViewQuery_1 = superDef.viewQuery;
                if (superViewQuery_1) {
                    if (prevViewQuery_1) {
                        definition.viewQuery = function (rf, ctx) {
                            superViewQuery_1(rf, ctx);
                            prevViewQuery_1(rf, ctx);
                        };
                    }
                    else {
                        definition.viewQuery = superViewQuery_1;
                    }
                }
            }
            // Merge Content Queries
            var prevContentQueries_1 = definition.contentQueries;
            var superContentQueries_1 = superDef.contentQueries;
            if (superContentQueries_1) {
                if (prevContentQueries_1) {
                    definition.contentQueries = function () {
                        superContentQueries_1();
                        prevContentQueries_1();
                    };
                }
                else {
                    definition.contentQueries = superContentQueries_1;
                }
            }
            // Merge Content Queries Refresh
            var prevContentQueriesRefresh_1 = definition.contentQueriesRefresh;
            var superContentQueriesRefresh_1 = superDef.contentQueriesRefresh;
            if (superContentQueriesRefresh_1) {
                if (prevContentQueriesRefresh_1) {
                    definition.contentQueriesRefresh = function (directiveIndex, queryIndex) {
                        superContentQueriesRefresh_1(directiveIndex, queryIndex);
                        prevContentQueriesRefresh_1(directiveIndex, queryIndex);
                    };
                }
                else {
                    definition.contentQueriesRefresh = superContentQueriesRefresh_1;
                }
            }
            // Merge inputs and outputs
            fillProperties(definition.inputs, superDef.inputs);
            fillProperties(definition.declaredInputs, superDef.declaredInputs);
            fillProperties(definition.outputs, superDef.outputs);
            // Inherit hooks
            // Assume super class inheritance feature has already run.
            definition.afterContentChecked =
                definition.afterContentChecked || superDef.afterContentChecked;
            definition.afterContentInit = definition.afterContentInit || superDef.afterContentInit;
            definition.afterViewChecked = definition.afterViewChecked || superDef.afterViewChecked;
            definition.afterViewInit = definition.afterViewInit || superDef.afterViewInit;
            definition.doCheck = definition.doCheck || superDef.doCheck;
            definition.onDestroy = definition.onDestroy || superDef.onDestroy;
            definition.onInit = definition.onInit || superDef.onInit;
            // Run parent features
            var features = superDef.features;
            if (features) {
                try {
                    for (var features_1 = tslib_1.__values(features), features_1_1 = features_1.next(); !features_1_1.done; features_1_1 = features_1.next()) {
                        var feature = features_1_1.value;
                        if (feature && feature !== InheritDefinitionFeature) {
                            feature(definition);
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (features_1_1 && !features_1_1.done && (_a = features_1.return)) _a.call(features_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
            return "break";
        }
        else {
            // Even if we don't have a definition, check the type for the hooks and use those if need be
            var superPrototype = superType.prototype;
            if (superPrototype) {
                definition.afterContentChecked =
                    definition.afterContentChecked || superPrototype.afterContentChecked;
                definition.afterContentInit =
                    definition.afterContentInit || superPrototype.afterContentInit;
                definition.afterViewChecked =
                    definition.afterViewChecked || superPrototype.afterViewChecked;
                definition.afterViewInit = definition.afterViewInit || superPrototype.afterViewInit;
                definition.doCheck = definition.doCheck || superPrototype.doCheck;
                definition.onDestroy = definition.onDestroy || superPrototype.onDestroy;
                definition.onInit = definition.onInit || superPrototype.onInit;
            }
        }
        superType = Object.getPrototypeOf(superType);
    };
    while (superType) {
        var state_1 = _loop_1();
        if (state_1 === "break")
            break;
    }
}
function maybeUnwrapEmpty(value) {
    if (value === EMPTY) {
        return {};
    }
    else if (value === EMPTY_ARRAY) {
        return [];
    }
    else {
        return value;
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5oZXJpdF9kZWZpbml0aW9uX2ZlYXR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ZlYXR1cmVzL2luaGVyaXRfZGVmaW5pdGlvbl9mZWF0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFHSCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDbkQsT0FBTyxFQUFDLEtBQUssRUFBRSxXQUFXLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFLakQ7OztHQUdHO0FBQ0gsU0FBUyxjQUFjLENBQUksVUFBNEM7SUFFckUsSUFBTSxHQUFHLEdBQUcsVUFBNkIsQ0FBQztJQUMxQyxPQUFPLE9BQU8sR0FBRyxDQUFDLFFBQVEsS0FBSyxVQUFVLENBQUM7QUFDNUMsQ0FBQztBQUVELFNBQVMsWUFBWSxDQUFDLElBQWU7SUFFbkMsT0FBTyxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxXQUFXLENBQUM7QUFDM0QsQ0FBQztBQUVEOzs7R0FHRztBQUNILE1BQU0sVUFBVSx3QkFBd0IsQ0FBQyxVQUFnRDtJQUN2RixJQUFJLFNBQVMsR0FBRyxZQUFZLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDOzs7UUFHNUMsSUFBSSxRQUFRLEdBQWtELFNBQVMsQ0FBQztRQUN4RSxJQUFJLGNBQWMsQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUM5QiwrRUFBK0U7WUFDL0UsUUFBUSxHQUFHLFNBQVMsQ0FBQyxjQUFjLElBQUksU0FBUyxDQUFDLGNBQWMsQ0FBQztTQUNqRTthQUFNO1lBQ0wsSUFBSSxTQUFTLENBQUMsY0FBYyxFQUFFO2dCQUM1QixNQUFNLElBQUksS0FBSyxDQUFDLHNDQUFzQyxDQUFDLENBQUM7YUFDekQ7WUFDRCwrRUFBK0U7WUFDL0UsUUFBUSxHQUFH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TUFBTSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQzs7SUF4SS9DLE9BQU8sU0FBUzs7OztLQXlJZjtBQUNILENBQUM7QUFJRCxTQUFTLGdCQUFnQixDQUFDLEtBQVU7SUFDbEMsSUFBSSxLQUFLLEtBQUssS0FBSyxFQUFFO1FBQ25CLE9BQU8sRUFBRSxDQUFDO0tBQ1g7U0FBTSxJQUFJLEtBQUssS0FBSyxXQUFXLEVBQUU7UUFDaEMsT0FBTyxFQUFFLENBQUM7S0FDWDtTQUFNO1FBQ0wsT0FBTyxLQUFLLENBQUM7S0FDZDtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vLi4vdHlwZSc7XG5pbXBvcnQge2ZpbGxQcm9wZXJ0aWVzfSBmcm9tICcuLi8uLi91dGlsL3Byb3BlcnR5JztcbmltcG9ydCB7RU1QVFksIEVNUFRZX0FSUkFZfSBmcm9tICcuLi9kZWZpbml0aW9uJztcbmltcG9ydCB7Q29tcG9uZW50RGVmLCBDb21wb25lbnRUZW1wbGF0ZSwgRGlyZWN0aXZlRGVmLCBEaXJlY3RpdmVEZWZGZWF0dXJlLCBSZW5kZXJGbGFnc30gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcblxuXG5cbi8qKlxuICogRGV0ZXJtaW5lcyBpZiBhIGRlZmluaXRpb24gaXMgYSB7QGxpbmsgQ29tcG9uZW50RGVmfSBvciBhIHtAbGluayBEaXJlY3RpdmVEZWZ9XG4gKiBAcGFyYW0gZGVmaW5pdGlvbiBUaGUgZGVmaW5pdGlvbiB0byBleGFtaW5lXG4gKi9cbmZ1bmN0aW9uIGlzQ29tcG9uZW50RGVmPFQ+KGRlZmluaXRpb246IENvbXBvbmVudERlZjxUPnwgRGlyZWN0aXZlRGVmPFQ+KTpcbiAgICBkZWZpbml0aW9uIGlzIENvbXBvbmVudERlZjxUPiB7XG4gIGNvbnN0IGRlZiA9IGRlZmluaXRpb24gYXMgQ29tcG9uZW50RGVmPFQ+O1xuICByZXR1cm4gdHlwZW9mIGRlZi50ZW1wbGF0ZSA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gZ2V0U3VwZXJUeXBlKHR5cGU6IFR5cGU8YW55Pik6IFR5cGU8YW55PiZcbiAgICB7bmdDb21wb25lbnREZWY/OiBDb21wb25lbnREZWY8YW55PiwgbmdEaXJlY3RpdmVEZWY/OiBEaXJlY3RpdmVEZWY8YW55Pn0ge1xuICByZXR1cm4gT2JqZWN0LmdldFByb3RvdHlwZU9mKHR5cGUucHJvdG90eXBlKS5jb25zdHJ1Y3Rvcjtcbn1cblxuLyoqXG4gKiBNZXJnZXMgdGhlIGRlZmluaXRpb24gZnJvbSBhIHN1cGVyIGNsYXNzIHRvIGEgc3ViIGNsYXNzLlxuICogQHBhcmFtIGRlZmluaXRpb24gVGhlIGRlZmluaXRpb24gdGhhdCBpcyBhIFN1YkNsYXNzIG9mIGFub3RoZXIgZGlyZWN0aXZlIG9mIGNvbXBvbmVudFxuICovXG5leHBvcnQgZnVuY3Rpb24gSW5oZXJpdERlZmluaXRpb25GZWF0dXJlKGRlZmluaXRpb246IERpcmVjdGl2ZURlZjxhbnk+fCBDb21wb25lbnREZWY8YW55Pik6IHZvaWQge1xuICBsZXQgc3VwZXJUeXBlID0gZ2V0U3VwZXJUeXBlKGRlZmluaXRpb24udHlwZSk7XG5cbiAgd2hpbGUgKHN1cGVyVHlwZSkge1xuICAgIGxldCBzdXBlckRlZjogRGlyZWN0aXZlRGVmPGFueT58Q29tcG9uZW50RGVmPGFueT58dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgIGlmIChpc0NvbXBvbmVudERlZihkZWZpbml0aW9uKSkge1xuICAgICAgLy8gRG9uJ3QgdXNlIGdldENvbXBvbmVudERlZi9nZXREaXJlY3RpdmVEZWYuIFRoaXMgbG9naWMgcmVsaWVzIG9uIGluaGVyaXRhbmNlLlxuICAgICAgc3VwZXJEZWYgPSBzdXBlclR5cGUubmdDb21wb25lbnREZWYgfHwgc3VwZXJUeXBlLm5nRGlyZWN0aXZlRGVmO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoc3VwZXJUeXBlLm5nQ29tcG9uZW50RGVmKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignRGlyZWN0aXZlcyBjYW5ub3QgaW5oZXJpdCBDb21wb25lbnRzJyk7XG4gICAgICB9XG4gICAgICAvLyBEb24ndCB1c2UgZ2V0Q29tcG9uZW50RGVmL2dldERpcmVjdGl2ZURlZi4gVGhpcyBsb2dpYyByZWxpZXMgb24gaW5oZXJpdGFuY2UuXG4gICAgICBzdXBlckRlZiA9IHN1cGVyVHlwZS5uZ0RpcmVjdGl2ZURlZjtcbiAgICB9XG5cbiAgICBjb25zdCBiYXNlRGVmID0gKHN1cGVyVHlwZSBhcyBhbnkpLm5nQmFzZURlZjtcblxuICAgIC8vIFNvbWUgZmllbGRzIGluIHRoZSBkZWZpbml0aW9uIG1heSBiZSBlbXB0eSwgaWYgdGhlcmUgd2VyZSBubyB2YWx1ZXMgdG8gcHV0IGluIHRoZW0gdGhhdFxuICAgIC8vIHdvdWxkJ3ZlIGp1c3RpZmllZCBvYmplY3QgY3JlYXRpb24uIFVud3JhcCB0aGVtIGlmIG5lY2Vzc2FyeS5cbiAgICBpZiAoYmFzZURlZiB8fCBzdXBlckRlZikge1xuICAgICAgY29uc3Qgd3JpdGVhYmxlRGVmID0gZGVmaW5pdGlvbiBhcyBhbnk7XG4gICAgICB3cml0ZWFibGVEZWYuaW5wdXRzID0gbWF5YmVVbndyYXBFbXB0eShkZWZpbml0aW9uLmlucHV0cyk7XG4gICAgICB3cml0ZWFibGVEZWYuZGVjbGFyZWRJbnB1dHMgPSBtYXliZVVud3JhcEVtcHR5KGRlZmluaXRpb24uZGVjbGFyZWRJbnB1dHMpO1xuICAgICAgd3JpdGVhYmxlRGVmLm91dHB1dHMgPSBtYXliZVVud3JhcEVtcHR5KGRlZmluaXRpb24ub3V0cHV0cyk7XG4gICAgfVxuXG4gICAgaWYgKGJhc2VEZWYpIHtcbiAgICAgIC8vIE1lcmdlIGlucHV0cyBhbmQgb3V0cHV0c1xuICAgICAgZmlsbFByb3BlcnRpZXMoZGVmaW5pdGlvbi5pbnB1dHMsIGJhc2VEZWYuaW5wdXRzKTtcbiAgICAgIGZpbGxQcm9wZXJ0aWVzKGRlZmluaXRpb24uZGVjbGFyZWRJbnB1dHMsIGJhc2VEZWYuZGVjbGFyZWRJbnB1dHMpO1xuICAgICAgZmlsbFByb3BlcnRpZXMoZGVmaW5pdGlvbi5vdXRwdXRzLCBiYXNlRGVmLm91dHB1dHMpO1xuICAgIH1cblxuICAgIGlmIChzdXBlckRlZikge1xuICAgICAgLy8gTWVyZ2UgaG9zdEJpbmRpbmdzXG4gICAgICBjb25zdCBwcmV2SG9zdEJpbmRpbmdzID0gZGVmaW5pdGlvbi5ob3N0QmluZGluZ3M7XG4gICAgICBjb25zdCBzdXBlckhvc3RCaW5kaW5ncyA9IHN1cGVyRGVmLmhvc3RCaW5kaW5ncztcbiAgICAgIGlmIChzdXBlckhvc3RCaW5kaW5ncykge1xuICAgICAgICBpZiAocHJldkhvc3RCaW5kaW5ncykge1xuICAgICAgICAgIGRlZmluaXRpb24uaG9zdEJpbmRpbmdzID0gKGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGVsZW1lbnRJbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICBzdXBlckhvc3RCaW5kaW5ncyhkaXJlY3RpdmVJbmRleCwgZWxlbWVudEluZGV4KTtcbiAgICAgICAgICAgIHByZXZIb3N0QmluZGluZ3MoZGlyZWN0aXZlSW5kZXgsIGVsZW1lbnRJbmRleCk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkZWZpbml0aW9uLmhvc3RCaW5kaW5ncyA9IHN1cGVySG9zdEJpbmRpbmdzO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIE1lcmdlIFZpZXcgUXVlcmllc1xuICAgICAgaWYgKGlzQ29tcG9uZW50RGVmKGRlZmluaXRpb24pICYmIGlzQ29tcG9uZW50RGVmKHN1cGVyRGVmKSkge1xuICAgICAgICBjb25zdCBwcmV2Vmlld1F1ZXJ5ID0gZGVmaW5pdGlvbi52aWV3UXVlcnk7XG4gICAgICAgIGNvbnN0IHN1cGVyVmlld1F1ZXJ5ID0gc3VwZXJEZWYudmlld1F1ZXJ5O1xuICAgICAgICBpZiAoc3VwZXJWaWV3UXVlcnkpIHtcbiAgICAgICAgICBpZiAocHJldlZpZXdRdWVyeSkge1xuICAgICAgICAgICAgZGVmaW5pdGlvbi52aWV3UXVlcnkgPSA8VD4ocmY6IFJlbmRlckZsYWdzLCBjdHg6IFQpOiB2b2lkID0+IHtcbiAgICAgICAgICAgICAgc3VwZXJWaWV3UXVlcnkocmYsIGN0eCk7XG4gICAgICAgICAgICAgIHByZXZWaWV3UXVlcnkocmYsIGN0eCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkZWZpbml0aW9uLnZpZXdRdWVyeSA9IHN1cGVyVmlld1F1ZXJ5O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBNZXJnZSBDb250ZW50IFF1ZXJpZXNcbiAgICAgIGNvbnN0IHByZXZDb250ZW50UXVlcmllcyA9IGRlZmluaXRpb24uY29udGVudFF1ZXJpZXM7XG4gICAgICBjb25zdCBzdXBlckNvbnRlbnRRdWVyaWVzID0gc3VwZXJEZWYuY29udGVudFF1ZXJpZXM7XG4gICAgICBpZiAoc3VwZXJDb250ZW50UXVlcmllcykge1xuICAgICAgICBpZiAocHJldkNvbnRlbnRRdWVyaWVzKSB7XG4gICAgICAgICAgZGVmaW5pdGlvbi5jb250ZW50UXVlcmllcyA9ICgpID0+IHtcbiAgICAgICAgICAgIHN1cGVyQ29udGVudFF1ZXJpZXMoKTtcbiAgICAgICAgICAgIHByZXZDb250ZW50UXVlcmllcygpO1xuICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGVmaW5pdGlvbi5jb250ZW50UXVlcmllcyA9IHN1cGVyQ29udGVudFF1ZXJpZXM7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gTWVyZ2UgQ29udGVudCBRdWVyaWVzIFJlZnJlc2hcbiAgICAgIGNvbnN0IHByZXZDb250ZW50UXVlcmllc1JlZnJlc2ggPSBkZWZpbml0aW9uLmNvbnRlbnRRdWVyaWVzUmVmcmVzaDtcbiAgICAgIGNvbnN0IHN1cGVyQ29udGVudFF1ZXJpZXNSZWZyZXNoID0gc3VwZXJEZWYuY29udGVudFF1ZXJpZXNSZWZyZXNoO1xuICAgICAgaWYgKHN1cGVyQ29udGVudFF1ZXJpZXNSZWZyZXNoKSB7XG4gICAgICAgIGlmIChwcmV2Q29udGVudFF1ZXJpZXNSZWZyZXNoKSB7XG4gICAgICAgICAgZGVmaW5pdGlvbi5jb250ZW50UXVlcmllc1JlZnJlc2ggPSAoZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgcXVlcnlJbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICBzdXBlckNvbnRlbnRRdWVyaWVzUmVmcmVzaChkaXJlY3RpdmVJbmRleCwgcXVlcnlJbmRleCk7XG4gICAgICAgICAgICBwcmV2Q29udGVudFF1ZXJpZXNSZWZyZXNoKGRpcmVjdGl2ZUluZGV4LCBxdWVyeUluZGV4KTtcbiAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRlZmluaXRpb24uY29udGVudFF1ZXJpZXNSZWZyZXNoID0gc3VwZXJDb250ZW50UXVlcmllc1JlZnJlc2g7XG4gICAgICAgIH1cbiAgICAgIH1cblxuXG4gICAgICAvLyBNZXJnZSBpbnB1dHMgYW5kIG91dHB1dHNcbiAgICAgIGZpbGxQcm9wZXJ0aWVzKGRlZmluaXRpb24uaW5wdXRzLCBzdXBlckRlZi5pbnB1dHMpO1xuICAgICAgZmlsbFByb3BlcnRpZXMoZGVmaW5pdGlvbi5kZWNsYXJlZElucHV0cywgc3VwZXJEZWYuZGVjbGFyZWRJbnB1dHMpO1xuICAgICAgZmlsbFByb3BlcnRpZXMoZGVmaW5pdGlvbi5vdXRwdXRzLCBzdXBlckRlZi5vdXRwdXRzKTtcblxuICAgICAgLy8gSW5oZXJpdCBob29rc1xuICAgICAgLy8gQXNzdW1lIHN1cGVyIGNsYXNzIGluaGVyaXRhbmNlIGZlYXR1cmUgaGFzIGFscmVhZHkgcnVuLlxuICAgICAgZGVmaW5pdGlvbi5hZnRlckNvbnRlbnRDaGVja2VkID1cbiAgICAgICAgICBkZWZpbml0aW9uLmFmdGVyQ29udGVudENoZWNrZWQgfHwgc3VwZXJEZWYuYWZ0ZXJDb250ZW50Q2hlY2tlZDtcbiAgICAgIGRlZmluaXRpb24uYWZ0ZXJDb250ZW50SW5pdCA9IGRlZmluaXRpb24uYWZ0ZXJDb250ZW50SW5pdCB8fCBzdXBlckRlZi5hZnRlckNvbnRlbnRJbml0O1xuICAgICAgZGVmaW5pdGlvbi5hZnRlclZpZXdDaGVja2VkID0gZGVmaW5pdGlvbi5hZnRlclZpZXdDaGVja2VkIHx8IHN1cGVyRGVmLmFmdGVyVmlld0NoZWNrZWQ7XG4gICAgICBkZWZpbml0aW9uLmFmdGVyVmlld0luaXQgPSBkZWZpbml0aW9uLmFmdGVyVmlld0luaXQgfHwgc3VwZXJEZWYuYWZ0ZXJWaWV3SW5pdDtcbiAgICAgIGRlZmluaXRpb24uZG9DaGVjayA9IGRlZmluaXRpb24uZG9DaGVjayB8fCBzdXBlckRlZi5kb0NoZWNrO1xuICAgICAgZGVmaW5pdGlvbi5vbkRlc3Ryb3kgPSBkZWZpbml0aW9uLm9uRGVzdHJveSB8fCBzdXBlckRlZi5vbkRlc3Ryb3k7XG4gICAgICBkZWZpbml0aW9uLm9uSW5pdCA9IGRlZmluaXRpb24ub25Jbml0IHx8IHN1cGVyRGVmLm9uSW5pdDtcblxuICAgICAgLy8gUnVuIHBhcmVudCBmZWF0dXJlc1xuICAgICAgY29uc3QgZmVhdHVyZXMgPSBzdXBlckRlZi5mZWF0dXJlcztcbiAgICAgIGlmIChmZWF0dXJlcykge1xuICAgICAgICBmb3IgKGNvbnN0IGZlYXR1cmUgb2YgZmVhdHVyZXMpIHtcbiAgICAgICAgICBpZiAoZmVhdHVyZSAmJiBmZWF0dXJlICE9PSBJbmhlcml0RGVmaW5pdGlvbkZlYXR1cmUpIHtcbiAgICAgICAgICAgIChmZWF0dXJlIGFzIERpcmVjdGl2ZURlZkZlYXR1cmUpKGRlZmluaXRpb24pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBicmVhaztcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRXZlbiBpZiB3ZSBkb24ndCBoYXZlIGEgZGVmaW5pdGlvbiwgY2hlY2sgdGhlIHR5cGUgZm9yIHRoZSBob29rcyBhbmQgdXNlIHRob3NlIGlmIG5lZWQgYmVcbiAgICAgIGNvbnN0IHN1cGVyUHJvdG90eXBlID0gc3VwZXJUeXBlLnByb3RvdHlwZTtcblxuICAgICAgaWYgKHN1cGVyUHJvdG90eXBlKSB7XG4gICAgICAgIGRlZmluaXRpb24uYWZ0ZXJDb250ZW50Q2hlY2tlZCA9XG4gICAgICAgICAgICBkZWZpbml0aW9uLmFmdGVyQ29udGVudENoZWNrZWQgfHwgc3VwZXJQcm90b3R5cGUuYWZ0ZXJDb250ZW50Q2hlY2tlZDtcbiAgICAgICAgZGVmaW5pdGlvbi5hZnRlckNvbnRlbnRJbml0ID1cbiAgICAgICAgICAgIGRlZmluaXRpb24uYWZ0ZXJDb250ZW50SW5pdCB8fCBzdXBlclByb3RvdHlwZS5hZnRlckNvbnRlbnRJbml0O1xuICAgICAgICBkZWZpbml0aW9uLmFmdGVyVmlld0NoZWNrZWQgPVxuICAgICAgICAgICAgZGVmaW5pdGlvbi5hZnRlclZpZXdDaGVja2VkIHx8IHN1cGVyUHJvdG90eXBlLmFmdGVyVmlld0NoZWNrZWQ7XG4gICAgICAgIGRlZmluaXRpb24uYWZ0ZXJWaWV3SW5pdCA9IGRlZmluaXRpb24uYWZ0ZXJWaWV3SW5pdCB8fCBzdXBlclByb3RvdHlwZS5hZnRlclZpZXdJbml0O1xuICAgICAgICBkZWZpbml0aW9uLmRvQ2hlY2sgPSBkZWZpbml0aW9uLmRvQ2hlY2sgfHwgc3VwZXJQcm90b3R5cGUuZG9DaGVjaztcbiAgICAgICAgZGVmaW5pdGlvbi5vbkRlc3Ryb3kgPSBkZWZpbml0aW9uLm9uRGVzdHJveSB8fCBzdXBlclByb3RvdHlwZS5vbkRlc3Ryb3k7XG4gICAgICAgIGRlZmluaXRpb24ub25Jbml0ID0gZGVmaW5pdGlvbi5vbkluaXQgfHwgc3VwZXJQcm90b3R5cGUub25Jbml0O1xuICAgICAgfVxuICAgIH1cblxuICAgIHN1cGVyVHlwZSA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihzdXBlclR5cGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1heWJlVW53cmFwRW1wdHk8VD4odmFsdWU6IFRbXSk6IFRbXTtcbmZ1bmN0aW9uIG1heWJlVW53cmFwRW1wdHk8VD4odmFsdWU6IFQpOiBUO1xuZnVuY3Rpb24gbWF5YmVVbndyYXBFbXB0eSh2YWx1ZTogYW55KTogYW55IHtcbiAgaWYgKHZhbHVlID09PSBFTVBUWSkge1xuICAgIHJldHVybiB7fTtcbiAgfSBlbHNlIGlmICh2YWx1ZSA9PT0gRU1QVFlfQVJSQVkpIHtcbiAgICByZXR1cm4gW107XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG59XG4iXX0=
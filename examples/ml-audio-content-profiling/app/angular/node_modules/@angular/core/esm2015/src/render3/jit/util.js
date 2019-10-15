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
import { Host, Inject, Optional, Self, SkipSelf } from '../../di/metadata';
import { Attribute } from '../../metadata/di';
import { ReflectionCapabilities } from '../../reflection/reflection_capabilities';
import { getCompilerFacade } from './compiler_facade';
/** @type {?} */
let _reflect = null;
/**
 * @return {?}
 */
export function getReflect() {
    return (_reflect = _reflect || new ReflectionCapabilities());
}
/**
 * @param {?} type
 * @return {?}
 */
export function reflectDependencies(type) {
    return convertDependencies(getReflect().parameters(type));
}
/**
 * @param {?} deps
 * @return {?}
 */
export function convertDependencies(deps) {
    /** @type {?} */
    const compiler = getCompilerFacade();
    return deps.map(dep => reflectDependency(compiler, dep));
}
/**
 * @param {?} compiler
 * @param {?} dep
 * @return {?}
 */
function reflectDependency(compiler, dep) {
    /** @type {?} */
    const meta = {
        token: null,
        host: false,
        optional: false,
        resolved: compiler.R3ResolvedDependencyType.Token,
        self: false,
        skipSelf: false,
    };
    /**
     * @param {?} token
     * @return {?}
     */
    function setTokenAndResolvedType(token) {
        meta.resolved = compiler.R3ResolvedDependencyType.Token;
        meta.token = token;
    }
    if (Array.isArray(dep)) {
        if (dep.length === 0) {
            throw new Error('Dependency array must have arguments.');
        }
        for (let j = 0; j < dep.length; j++) {
            /** @type {?} */
            const param = dep[j];
            if (param instanceof Optional || param.__proto__.ngMetadataName === 'Optional') {
                meta.optional = true;
            }
            else if (param instanceof SkipSelf || param.__proto__.ngMetadataName === 'SkipSelf') {
                meta.skipSelf = true;
            }
            else if (param instanceof Self || param.__proto__.ngMetadataName === 'Self') {
                meta.self = true;
            }
            else if (param instanceof Host || param.__proto__.ngMetadataName === 'Host') {
                meta.host = true;
            }
            else if (param instanceof Inject) {
                meta.token = param.token;
            }
            else if (param instanceof Attribute) {
                if (param.attributeName === undefined) {
                    throw new Error(`Attribute name must be defined.`);
                }
                meta.token = param.attributeName;
                meta.resolved = compiler.R3ResolvedDependencyType.Attribute;
            }
            else {
                setTokenAndResolvedType(param);
            }
        }
    }
    else {
        setTokenAndResolvedType(dep);
    }
    return meta;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaml0L3V0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3pFLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUM1QyxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSwwQ0FBMEMsQ0FBQztBQUdoRixPQUFPLEVBQTZDLGlCQUFpQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7O0FBRWhHLElBQUksUUFBUSxHQUFnQyxJQUFJLENBQUM7Ozs7QUFFakQsTUFBTSxVQUFVLFVBQVU7SUFDeEIsT0FBTyxDQUFDLFFBQVEsR0FBRyxRQUFRLElBQUksSUFBSSxzQkFBc0IsRUFBRSxDQUFDLENBQUM7Q0FDOUQ7Ozs7O0FBRUQsTUFBTSxVQUFVLG1CQUFtQixDQUFDLElBQWU7SUFDakQsT0FBTyxtQkFBbUIsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztDQUMzRDs7Ozs7QUFFRCxNQUFNLFVBQVUsbUJBQW1CLENBQUMsSUFBVzs7SUFDN0MsTUFBTSxRQUFRLEdBQUcsaUJBQWlCLEVBQUUsQ0FBQztJQUNyQyxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztDQUMxRDs7Ozs7O0FBRUQsU0FBUyxpQkFBaUIsQ0FBQyxRQUF3QixFQUFFLEdBQWdCOztJQUNuRSxNQUFNLElBQUksR0FBK0I7UUFDdkMsS0FBSyxFQUFFLElBQUk7UUFDWCxJQUFJLEVBQUUsS0FBSztRQUNYLFFBQVEsRUFBRSxLQUFLO1FBQ2YsUUFBUSxFQUFFLFFBQVEsQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLO1FBQ2pELElBQUksRUFBRSxLQUFLO1FBQ1gsUUFBUSxFQUFFLEtBQUs7S0FDaEIsQ0FBQzs7Ozs7SUFFRixTQUFTLHVCQUF1QixDQUFDLEtBQVU7UUFDekMsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUMsd0JBQXdCLENBQUMsS0FBSyxDQUFDO1FBQ3hELElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0tBQ3BCO0lBRUQsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1FBQ3RCLElBQUksR0FBRyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFDcEIsTUFBTSxJQUFJLEtBQUssQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFDO1NBQzFEO1FBQ0QsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7O1lBQ25DLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyQixJQUFJLEtBQUssWUFBWSxRQUFRLElBQUksS0FBSyxDQUFDLFNBQVMsQ0FBQyxjQUFjLEtBQUssVUFBVSxFQUFFO2dCQUM5RSxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQzthQUN0QjtpQkFBTSxJQUFJLEtBQUssWUFBWSxRQUFRLElBQUksS0FBSyxDQUFDLFNBQVMsQ0FBQyxjQUFjLEtBQUssVUFBVSxFQUFFO2dCQUNyRixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQzthQUN0QjtpQkFBTSxJQUFJLEtBQUssWUFBWSxJQUFJLElBQUksS0FBSyxDQUFDLFNBQVMsQ0FBQyxjQUFjLEtBQUssTUFBTSxFQUFFO2dCQUM3RSxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQzthQUNsQjtpQkFBTSxJQUFJLEtBQUssWUFBWSxJQUFJLElBQUksS0FBSyxDQUFDLFNBQVMsQ0FBQyxjQUFjLEtBQUssTUFBTSxFQUFFO2dCQUM3RSxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQzthQUNsQjtpQkFBTSxJQUFJLEtBQUssWUFBWSxNQUFNLEVBQUU7Z0JBQ2xDLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQzthQUMxQjtpQkFBTSxJQUFJLEtBQUssWUFBWSxTQUFTLEVBQUU7Z0JBQ3JDLElBQUksS0FBSyxDQUFDLGFBQWEsS0FBSyxTQUFTLEVBQUU7b0JBQ3JDLE1BQU0sSUFBSSxLQUFLLENBQUMsaUNBQWlDLENBQUMsQ0FBQztpQkFDcEQ7Z0JBQ0QsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDO2dCQUNqQyxJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQyx3QkFBd0IsQ0FBQyxTQUFTLENBQUM7YUFDN0Q7aUJBQU07Z0JBQ0wsdUJBQXVCLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDaEM7U0FDRjtLQUNGO1NBQU07UUFDTCx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUM5QjtJQUNELE9BQU8sSUFBSSxDQUFDO0NBQ2IiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SG9zdCwgSW5qZWN0LCBPcHRpb25hbCwgU2VsZiwgU2tpcFNlbGZ9IGZyb20gJy4uLy4uL2RpL21ldGFkYXRhJztcbmltcG9ydCB7QXR0cmlidXRlfSBmcm9tICcuLi8uLi9tZXRhZGF0YS9kaSc7XG5pbXBvcnQge1JlZmxlY3Rpb25DYXBhYmlsaXRpZXN9IGZyb20gJy4uLy4uL3JlZmxlY3Rpb24vcmVmbGVjdGlvbl9jYXBhYmlsaXRpZXMnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi90eXBlJztcblxuaW1wb3J0IHtDb21waWxlckZhY2FkZSwgUjNEZXBlbmRlbmN5TWV0YWRhdGFGYWNhZGUsIGdldENvbXBpbGVyRmFjYWRlfSBmcm9tICcuL2NvbXBpbGVyX2ZhY2FkZSc7XG5cbmxldCBfcmVmbGVjdDogUmVmbGVjdGlvbkNhcGFiaWxpdGllc3xudWxsID0gbnVsbDtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldFJlZmxlY3QoKTogUmVmbGVjdGlvbkNhcGFiaWxpdGllcyB7XG4gIHJldHVybiAoX3JlZmxlY3QgPSBfcmVmbGVjdCB8fCBuZXcgUmVmbGVjdGlvbkNhcGFiaWxpdGllcygpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlZmxlY3REZXBlbmRlbmNpZXModHlwZTogVHlwZTxhbnk+KTogUjNEZXBlbmRlbmN5TWV0YWRhdGFGYWNhZGVbXSB7XG4gIHJldHVybiBjb252ZXJ0RGVwZW5kZW5jaWVzKGdldFJlZmxlY3QoKS5wYXJhbWV0ZXJzKHR5cGUpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbnZlcnREZXBlbmRlbmNpZXMoZGVwczogYW55W10pOiBSM0RlcGVuZGVuY3lNZXRhZGF0YUZhY2FkZVtdIHtcbiAgY29uc3QgY29tcGlsZXIgPSBnZXRDb21waWxlckZhY2FkZSgpO1xuICByZXR1cm4gZGVwcy5tYXAoZGVwID0+IHJlZmxlY3REZXBlbmRlbmN5KGNvbXBpbGVyLCBkZXApKTtcbn1cblxuZnVuY3Rpb24gcmVmbGVjdERlcGVuZGVuY3koY29tcGlsZXI6IENvbXBpbGVyRmFjYWRlLCBkZXA6IGFueSB8IGFueVtdKTogUjNEZXBlbmRlbmN5TWV0YWRhdGFGYWNhZGUge1xuICBjb25zdCBtZXRhOiBSM0RlcGVuZGVuY3lNZXRhZGF0YUZhY2FkZSA9IHtcbiAgICB0b2tlbjogbnVsbCxcbiAgICBob3N0OiBmYWxzZSxcbiAgICBvcHRpb25hbDogZmFsc2UsXG4gICAgcmVzb2x2ZWQ6IGNvbXBpbGVyLlIzUmVzb2x2ZWREZXBlbmRlbmN5VHlwZS5Ub2tlbixcbiAgICBzZWxmOiBmYWxzZSxcbiAgICBza2lwU2VsZjogZmFsc2UsXG4gIH07XG5cbiAgZnVuY3Rpb24gc2V0VG9rZW5BbmRSZXNvbHZlZFR5cGUodG9rZW46IGFueSk6IHZvaWQge1xuICAgIG1ldGEucmVzb2x2ZWQgPSBjb21waWxlci5SM1Jlc29sdmVkRGVwZW5kZW5jeVR5cGUuVG9rZW47XG4gICAgbWV0YS50b2tlbiA9IHRva2VuO1xuICB9XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkoZGVwKSkge1xuICAgIGlmIChkZXAubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RlcGVuZGVuY3kgYXJyYXkgbXVzdCBoYXZlIGFyZ3VtZW50cy4nKTtcbiAgICB9XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBkZXAubGVuZ3RoOyBqKyspIHtcbiAgICAgIGNvbnN0IHBhcmFtID0gZGVwW2pdO1xuICAgICAgaWYgKHBhcmFtIGluc3RhbmNlb2YgT3B0aW9uYWwgfHwgcGFyYW0uX19wcm90b19fLm5nTWV0YWRhdGFOYW1lID09PSAnT3B0aW9uYWwnKSB7XG4gICAgICAgIG1ldGEub3B0aW9uYWwgPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmIChwYXJhbSBpbnN0YW5jZW9mIFNraXBTZWxmIHx8IHBhcmFtLl9fcHJvdG9fXy5uZ01ldGFkYXRhTmFtZSA9PT0gJ1NraXBTZWxmJykge1xuICAgICAgICBtZXRhLnNraXBTZWxmID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAocGFyYW0gaW5zdGFuY2VvZiBTZWxmIHx8IHBhcmFtLl9fcHJvdG9fXy5uZ01ldGFkYXRhTmFtZSA9PT0gJ1NlbGYnKSB7XG4gICAgICAgIG1ldGEuc2VsZiA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKHBhcmFtIGluc3RhbmNlb2YgSG9zdCB8fCBwYXJhbS5fX3Byb3RvX18ubmdNZXRhZGF0YU5hbWUgPT09ICdIb3N0Jykge1xuICAgICAgICBtZXRhLmhvc3QgPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmIChwYXJhbSBpbnN0YW5jZW9mIEluamVjdCkge1xuICAgICAgICBtZXRhLnRva2VuID0gcGFyYW0udG9rZW47XG4gICAgICB9IGVsc2UgaWYgKHBhcmFtIGluc3RhbmNlb2YgQXR0cmlidXRlKSB7XG4gICAgICAgIGlmIChwYXJhbS5hdHRyaWJ1dGVOYW1lID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEF0dHJpYnV0ZSBuYW1lIG11c3QgYmUgZGVmaW5lZC5gKTtcbiAgICAgICAgfVxuICAgICAgICBtZXRhLnRva2VuID0gcGFyYW0uYXR0cmlidXRlTmFtZTtcbiAgICAgICAgbWV0YS5yZXNvbHZlZCA9IGNvbXBpbGVyLlIzUmVzb2x2ZWREZXBlbmRlbmN5VHlwZS5BdHRyaWJ1dGU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRUb2tlbkFuZFJlc29sdmVkVHlwZShwYXJhbSk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHNldFRva2VuQW5kUmVzb2x2ZWRUeXBlKGRlcCk7XG4gIH1cbiAgcmV0dXJuIG1ldGE7XG59XG4iXX0=
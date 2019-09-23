/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { tokenReference } from '../compile_metadata';
export function listLazyRoutes(moduleMeta, reflector) {
    var e_1, _a, e_2, _b;
    var allLazyRoutes = [];
    try {
        for (var _c = tslib_1.__values(moduleMeta.transitiveModule.providers), _d = _c.next(); !_d.done; _d = _c.next()) {
            var _e = _d.value, provider = _e.provider, module = _e.module;
            if (tokenReference(provider.token) === reflector.ROUTES) {
                var loadChildren = _collectLoadChildren(provider.useValue);
                try {
                    for (var loadChildren_1 = tslib_1.__values(loadChildren), loadChildren_1_1 = loadChildren_1.next(); !loadChildren_1_1.done; loadChildren_1_1 = loadChildren_1.next()) {
                        var route = loadChildren_1_1.value;
                        allLazyRoutes.push(parseLazyRoute(route, reflector, module.reference));
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (loadChildren_1_1 && !loadChildren_1_1.done && (_b = loadChildren_1.return)) _b.call(loadChildren_1);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return allLazyRoutes;
}
function _collectLoadChildren(routes, target) {
    if (target === void 0) { target = []; }
    var e_3, _a;
    if (typeof routes === 'string') {
        target.push(routes);
    }
    else if (Array.isArray(routes)) {
        try {
            for (var routes_1 = tslib_1.__values(routes), routes_1_1 = routes_1.next(); !routes_1_1.done; routes_1_1 = routes_1.next()) {
                var route = routes_1_1.value;
                _collectLoadChildren(route, target);
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (routes_1_1 && !routes_1_1.done && (_a = routes_1.return)) _a.call(routes_1);
            }
            finally { if (e_3) throw e_3.error; }
        }
    }
    else if (routes.loadChildren) {
        _collectLoadChildren(routes.loadChildren, target);
    }
    else if (routes.children) {
        _collectLoadChildren(routes.children, target);
    }
    return target;
}
export function parseLazyRoute(route, reflector, module) {
    var _a = tslib_1.__read(route.split('#'), 2), routePath = _a[0], routeName = _a[1];
    var referencedModule = reflector.resolveExternalReference({
        moduleName: routePath,
        name: routeName,
    }, module ? module.filePath : undefined);
    return { route: route, module: module || referencedModule, referencedModule: referencedModule };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGF6eV9yb3V0ZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci9zcmMvYW90L2xhenlfcm91dGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQTBCLGNBQWMsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBYzVFLE1BQU0sVUFBVSxjQUFjLENBQzFCLFVBQW1DLEVBQUUsU0FBMEI7O0lBQ2pFLElBQU0sYUFBYSxHQUFnQixFQUFFLENBQUM7O1FBQ3RDLEtBQWlDLElBQUEsS0FBQSxpQkFBQSxVQUFVLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFBLGdCQUFBLDRCQUFFO1lBQTdELElBQUEsYUFBa0IsRUFBakIsc0JBQVEsRUFBRSxrQkFBTTtZQUMxQixJQUFJLGNBQWMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssU0FBUyxDQUFDLE1BQU0sRUFBRTtnQkFDdkQsSUFBTSxZQUFZLEdBQUcsb0JBQW9CLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDOztvQkFDN0QsS0FBb0IsSUFBQSxpQkFBQSxpQkFBQSxZQUFZLENBQUEsMENBQUEsb0VBQUU7d0JBQTdCLElBQU0sS0FBSyx5QkFBQTt3QkFDZCxhQUFhLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO3FCQUN4RTs7Ozs7Ozs7O2FBQ0Y7U0FDRjs7Ozs7Ozs7O0lBQ0QsT0FBTyxhQUFhLENBQUM7QUFDdkIsQ0FBQztBQUVELFNBQVMsb0JBQW9CLENBQUMsTUFBZ0MsRUFBRSxNQUFxQjtJQUFyQix1QkFBQSxFQUFBLFdBQXFCOztJQUNuRixJQUFJLE9BQU8sTUFBTSxLQUFLLFFBQVEsRUFBRTtRQUM5QixNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0tBQ3JCO1NBQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFOztZQUNoQyxLQUFvQixJQUFBLFdBQUEsaUJBQUEsTUFBTSxDQUFBLDhCQUFBLGtEQUFFO2dCQUF2QixJQUFNLEtBQUssbUJBQUE7Z0JBQ2Qsb0JBQW9CLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2FBQ3JDOzs7Ozs7Ozs7S0FDRjtTQUFNLElBQUksTUFBTSxDQUFDLFlBQVksRUFBRTtRQUM5QixvQkFBb0IsQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0tBQ25EO1NBQU0sSUFBSSxNQUFNLENBQUMsUUFBUSxFQUFFO1FBQzFCLG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7S0FDL0M7SUFDRCxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDO0FBRUQsTUFBTSxVQUFVLGNBQWMsQ0FDMUIsS0FBYSxFQUFFLFNBQTBCLEVBQUUsTUFBcUI7SUFDNUQsSUFBQSx3Q0FBeUMsRUFBeEMsaUJBQVMsRUFBRSxpQkFBNkIsQ0FBQztJQUNoRCxJQUFNLGdCQUFnQixHQUFHLFNBQVMsQ0FBQyx3QkFBd0IsQ0FDdkQ7UUFDRSxVQUFVLEVBQUUsU0FBUztRQUNyQixJQUFJLEVBQUUsU0FBUztLQUNoQixFQUNELE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDMUMsT0FBTyxFQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sSUFBSSxnQkFBZ0IsRUFBRSxnQkFBZ0Isa0JBQUEsRUFBQyxDQUFDO0FBQzlFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Q29tcGlsZU5nTW9kdWxlTWV0YWRhdGEsIHRva2VuUmVmZXJlbmNlfSBmcm9tICcuLi9jb21waWxlX21ldGFkYXRhJztcbmltcG9ydCB7Um91dGV9IGZyb20gJy4uL2NvcmUnO1xuaW1wb3J0IHtDb21waWxlTWV0YWRhdGFSZXNvbHZlcn0gZnJvbSAnLi4vbWV0YWRhdGFfcmVzb2x2ZXInO1xuXG5pbXBvcnQge0FvdENvbXBpbGVySG9zdH0gZnJvbSAnLi9jb21waWxlcl9ob3N0JztcbmltcG9ydCB7U3RhdGljUmVmbGVjdG9yfSBmcm9tICcuL3N0YXRpY19yZWZsZWN0b3InO1xuaW1wb3J0IHtTdGF0aWNTeW1ib2x9IGZyb20gJy4vc3RhdGljX3N5bWJvbCc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTGF6eVJvdXRlIHtcbiAgbW9kdWxlOiBTdGF0aWNTeW1ib2w7XG4gIHJvdXRlOiBzdHJpbmc7XG4gIHJlZmVyZW5jZWRNb2R1bGU6IFN0YXRpY1N5bWJvbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxpc3RMYXp5Um91dGVzKFxuICAgIG1vZHVsZU1ldGE6IENvbXBpbGVOZ01vZHVsZU1ldGFkYXRhLCByZWZsZWN0b3I6IFN0YXRpY1JlZmxlY3Rvcik6IExhenlSb3V0ZVtdIHtcbiAgY29uc3QgYWxsTGF6eVJvdXRlczogTGF6eVJvdXRlW10gPSBbXTtcbiAgZm9yIChjb25zdCB7cHJvdmlkZXIsIG1vZHVsZX0gb2YgbW9kdWxlTWV0YS50cmFuc2l0aXZlTW9kdWxlLnByb3ZpZGVycykge1xuICAgIGlmICh0b2tlblJlZmVyZW5jZShwcm92aWRlci50b2tlbikgPT09IHJlZmxlY3Rvci5ST1VURVMpIHtcbiAgICAgIGNvbnN0IGxvYWRDaGlsZHJlbiA9IF9jb2xsZWN0TG9hZENoaWxkcmVuKHByb3ZpZGVyLnVzZVZhbHVlKTtcbiAgICAgIGZvciAoY29uc3Qgcm91dGUgb2YgbG9hZENoaWxkcmVuKSB7XG4gICAgICAgIGFsbExhenlSb3V0ZXMucHVzaChwYXJzZUxhenlSb3V0ZShyb3V0ZSwgcmVmbGVjdG9yLCBtb2R1bGUucmVmZXJlbmNlKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBhbGxMYXp5Um91dGVzO1xufVxuXG5mdW5jdGlvbiBfY29sbGVjdExvYWRDaGlsZHJlbihyb3V0ZXM6IHN0cmluZyB8IFJvdXRlIHwgUm91dGVbXSwgdGFyZ2V0OiBzdHJpbmdbXSA9IFtdKTogc3RyaW5nW10ge1xuICBpZiAodHlwZW9mIHJvdXRlcyA9PT0gJ3N0cmluZycpIHtcbiAgICB0YXJnZXQucHVzaChyb3V0ZXMpO1xuICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkocm91dGVzKSkge1xuICAgIGZvciAoY29uc3Qgcm91dGUgb2Ygcm91dGVzKSB7XG4gICAgICBfY29sbGVjdExvYWRDaGlsZHJlbihyb3V0ZSwgdGFyZ2V0KTtcbiAgICB9XG4gIH0gZWxzZSBpZiAocm91dGVzLmxvYWRDaGlsZHJlbikge1xuICAgIF9jb2xsZWN0TG9hZENoaWxkcmVuKHJvdXRlcy5sb2FkQ2hpbGRyZW4sIHRhcmdldCk7XG4gIH0gZWxzZSBpZiAocm91dGVzLmNoaWxkcmVuKSB7XG4gICAgX2NvbGxlY3RMb2FkQ2hpbGRyZW4ocm91dGVzLmNoaWxkcmVuLCB0YXJnZXQpO1xuICB9XG4gIHJldHVybiB0YXJnZXQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUxhenlSb3V0ZShcbiAgICByb3V0ZTogc3RyaW5nLCByZWZsZWN0b3I6IFN0YXRpY1JlZmxlY3RvciwgbW9kdWxlPzogU3RhdGljU3ltYm9sKTogTGF6eVJvdXRlIHtcbiAgY29uc3QgW3JvdXRlUGF0aCwgcm91dGVOYW1lXSA9IHJvdXRlLnNwbGl0KCcjJyk7XG4gIGNvbnN0IHJlZmVyZW5jZWRNb2R1bGUgPSByZWZsZWN0b3IucmVzb2x2ZUV4dGVybmFsUmVmZXJlbmNlKFxuICAgICAge1xuICAgICAgICBtb2R1bGVOYW1lOiByb3V0ZVBhdGgsXG4gICAgICAgIG5hbWU6IHJvdXRlTmFtZSxcbiAgICAgIH0sXG4gICAgICBtb2R1bGUgPyBtb2R1bGUuZmlsZVBhdGggOiB1bmRlZmluZWQpO1xuICByZXR1cm4ge3JvdXRlOiByb3V0ZSwgbW9kdWxlOiBtb2R1bGUgfHwgcmVmZXJlbmNlZE1vZHVsZSwgcmVmZXJlbmNlZE1vZHVsZX07XG59XG4iXX0=
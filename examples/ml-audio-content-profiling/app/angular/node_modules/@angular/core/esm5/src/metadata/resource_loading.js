/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Used to resolve resource URLs on `@Component` when used with JIT compilation.
 *
 * Example:
 * ```
 * @Component({
 *   selector: 'my-comp',
 *   templateUrl: 'my-comp.html', // This requires asynchronous resolution
 * })
 * class MyComponnent{
 * }
 *
 * // Calling `renderComponent` will fail because `MyComponent`'s `@Compenent.templateUrl`
 * // needs to be resolved because `renderComponent` is synchronous process.
 * // renderComponent(MyComponent);
 *
 * // Calling `resolveComponentResources` will resolve `@Compenent.templateUrl` into
 * // `@Compenent.template`, which would allow `renderComponent` to proceed in synchronous manner.
 * // Use browser's `fetch` function as the default resource resolution strategy.
 * resolveComponentResources(fetch).then(() => {
 *   // After resolution all URLs have been converted into strings.
 *   renderComponent(MyComponent);
 * });
 *
 * ```
 *
 * NOTE: In AOT the resolution happens during compilation, and so there should be no need
 * to call this method outside JIT mode.
 *
 * @param resourceResolver a function which is responsible to returning a `Promise` of the resolved
 * URL. Browser's `fetch` method is a good default implementation.
 */
export function resolveComponentResources(resourceResolver) {
    // Store all promises which are fetching the resources.
    var urlFetches = [];
    // Cache so that we don't fetch the same resource more than once.
    var urlMap = new Map();
    function cachedResourceResolve(url) {
        var promise = urlMap.get(url);
        if (!promise) {
            var resp = resourceResolver(url);
            urlMap.set(url, promise = resp.then(unwrapResponse));
            urlFetches.push(promise);
        }
        return promise;
    }
    componentResourceResolutionQueue.forEach(function (component) {
        if (component.templateUrl) {
            cachedResourceResolve(component.templateUrl).then(function (template) {
                component.template = template;
                component.templateUrl = undefined;
            });
        }
        var styleUrls = component.styleUrls;
        var styles = component.styles || (component.styles = []);
        var styleOffset = component.styles.length;
        styleUrls && styleUrls.forEach(function (styleUrl, index) {
            styles.push(''); // pre-allocate array.
            cachedResourceResolve(styleUrl).then(function (style) {
                styles[styleOffset + index] = style;
                styleUrls.splice(styleUrls.indexOf(styleUrl), 1);
                if (styleUrls.length == 0) {
                    component.styleUrls = undefined;
                }
            });
        });
    });
    componentResourceResolutionQueue.clear();
    return Promise.all(urlFetches).then(function () { return null; });
}
var componentResourceResolutionQueue = new Set();
export function maybeQueueResolutionOfComponentResources(metadata) {
    if (componentNeedsResolution(metadata)) {
        componentResourceResolutionQueue.add(metadata);
    }
}
export function componentNeedsResolution(component) {
    return component.templateUrl || component.styleUrls && component.styleUrls.length;
}
export function clearResolutionOfComponentResourcesQueue() {
    componentResourceResolutionQueue.clear();
}
function unwrapResponse(response) {
    return typeof response == 'string' ? response : response.text();
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb3VyY2VfbG9hZGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL21ldGFkYXRhL3Jlc291cmNlX2xvYWRpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBS0g7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0ErQkc7QUFDSCxNQUFNLFVBQVUseUJBQXlCLENBQ3JDLGdCQUE4RTtJQUNoRix1REFBdUQ7SUFDdkQsSUFBTSxVQUFVLEdBQXNCLEVBQUUsQ0FBQztJQUV6QyxpRUFBaUU7SUFDakUsSUFBTSxNQUFNLEdBQUcsSUFBSSxHQUFHLEVBQTJCLENBQUM7SUFDbEQsU0FBUyxxQkFBcUIsQ0FBQyxHQUFXO1FBQ3hDLElBQUksT0FBTyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDOUIsSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNaLElBQU0sSUFBSSxHQUFHLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ25DLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7WUFDckQsVUFBVSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUMxQjtRQUNELE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFFRCxnQ0FBZ0MsQ0FBQyxPQUFPLENBQUMsVUFBQyxTQUFvQjtRQUM1RCxJQUFJLFNBQVMsQ0FBQyxXQUFXLEVBQUU7WUFDekIscUJBQXFCLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFDLFFBQVE7Z0JBQ3pELFNBQVMsQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO2dCQUM5QixTQUFTLENBQUMsV0FBVyxHQUFHLFNBQVMsQ0FBQztZQUNwQyxDQUFDLENBQUMsQ0FBQztTQUNKO1FBQ0QsSUFBTSxTQUFTLEdBQUcsU0FBUyxDQUFDLFNBQVMsQ0FBQztRQUN0QyxJQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQztRQUMzRCxJQUFNLFdBQVcsR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUM1QyxTQUFTLElBQUksU0FBUyxDQUFDLE9BQU8sQ0FBQyxVQUFDLFFBQVEsRUFBRSxLQUFLO1lBQzdDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBRSxzQkFBc0I7WUFDeEMscUJBQXFCLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUMsS0FBSztnQkFDekMsTUFBTSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUMsR0FBRyxLQUFLLENBQUM7Z0JBQ3BDLFNBQVMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDakQsSUFBSSxTQUFTLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRTtvQkFDekIsU0FBUyxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7aUJBQ2pDO1lBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0gsZ0NBQWdDLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDekMsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxjQUFNLE9BQUEsSUFBSSxFQUFKLENBQUksQ0FBQyxDQUFDO0FBQ2xELENBQUM7QUFFRCxJQUFNLGdDQUFnQyxHQUFtQixJQUFJLEdBQUcsRUFBRSxDQUFDO0FBRW5FLE1BQU0sVUFBVSx3Q0FBd0MsQ0FBQyxRQUFtQjtJQUMxRSxJQUFJLHdCQUF3QixDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQ3RDLGdDQUFnQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztLQUNoRDtBQUNILENBQUM7QUFFRCxNQUFNLFVBQVUsd0JBQXdCLENBQUMsU0FBb0I7SUFDM0QsT0FBTyxTQUFTLENBQUMsV0FBVyxJQUFJLFNBQVMsQ0FBQyxTQUFTLElBQUksU0FBUyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFDcEYsQ0FBQztBQUNELE1BQU0sVUFBVSx3Q0FBd0M7SUFDdEQsZ0NBQWdDLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDM0MsQ0FBQztBQUVELFNBQVMsY0FBYyxDQUFDLFFBQTRDO0lBQ2xFLE9BQU8sT0FBTyxRQUFRLElBQUksUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUNsRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0NvbXBvbmVudH0gZnJvbSAnLi9kaXJlY3RpdmVzJztcblxuXG4vKipcbiAqIFVzZWQgdG8gcmVzb2x2ZSByZXNvdXJjZSBVUkxzIG9uIGBAQ29tcG9uZW50YCB3aGVuIHVzZWQgd2l0aCBKSVQgY29tcGlsYXRpb24uXG4gKlxuICogRXhhbXBsZTpcbiAqIGBgYFxuICogQENvbXBvbmVudCh7XG4gKiAgIHNlbGVjdG9yOiAnbXktY29tcCcsXG4gKiAgIHRlbXBsYXRlVXJsOiAnbXktY29tcC5odG1sJywgLy8gVGhpcyByZXF1aXJlcyBhc3luY2hyb25vdXMgcmVzb2x1dGlvblxuICogfSlcbiAqIGNsYXNzIE15Q29tcG9ubmVudHtcbiAqIH1cbiAqXG4gKiAvLyBDYWxsaW5nIGByZW5kZXJDb21wb25lbnRgIHdpbGwgZmFpbCBiZWNhdXNlIGBNeUNvbXBvbmVudGAncyBgQENvbXBlbmVudC50ZW1wbGF0ZVVybGBcbiAqIC8vIG5lZWRzIHRvIGJlIHJlc29sdmVkIGJlY2F1c2UgYHJlbmRlckNvbXBvbmVudGAgaXMgc3luY2hyb25vdXMgcHJvY2Vzcy5cbiAqIC8vIHJlbmRlckNvbXBvbmVudChNeUNvbXBvbmVudCk7XG4gKlxuICogLy8gQ2FsbGluZyBgcmVzb2x2ZUNvbXBvbmVudFJlc291cmNlc2Agd2lsbCByZXNvbHZlIGBAQ29tcGVuZW50LnRlbXBsYXRlVXJsYCBpbnRvXG4gKiAvLyBgQENvbXBlbmVudC50ZW1wbGF0ZWAsIHdoaWNoIHdvdWxkIGFsbG93IGByZW5kZXJDb21wb25lbnRgIHRvIHByb2NlZWQgaW4gc3luY2hyb25vdXMgbWFubmVyLlxuICogLy8gVXNlIGJyb3dzZXIncyBgZmV0Y2hgIGZ1bmN0aW9uIGFzIHRoZSBkZWZhdWx0IHJlc291cmNlIHJlc29sdXRpb24gc3RyYXRlZ3kuXG4gKiByZXNvbHZlQ29tcG9uZW50UmVzb3VyY2VzKGZldGNoKS50aGVuKCgpID0+IHtcbiAqICAgLy8gQWZ0ZXIgcmVzb2x1dGlvbiBhbGwgVVJMcyBoYXZlIGJlZW4gY29udmVydGVkIGludG8gc3RyaW5ncy5cbiAqICAgcmVuZGVyQ29tcG9uZW50KE15Q29tcG9uZW50KTtcbiAqIH0pO1xuICpcbiAqIGBgYFxuICpcbiAqIE5PVEU6IEluIEFPVCB0aGUgcmVzb2x1dGlvbiBoYXBwZW5zIGR1cmluZyBjb21waWxhdGlvbiwgYW5kIHNvIHRoZXJlIHNob3VsZCBiZSBubyBuZWVkXG4gKiB0byBjYWxsIHRoaXMgbWV0aG9kIG91dHNpZGUgSklUIG1vZGUuXG4gKlxuICogQHBhcmFtIHJlc291cmNlUmVzb2x2ZXIgYSBmdW5jdGlvbiB3aGljaCBpcyByZXNwb25zaWJsZSB0byByZXR1cm5pbmcgYSBgUHJvbWlzZWAgb2YgdGhlIHJlc29sdmVkXG4gKiBVUkwuIEJyb3dzZXIncyBgZmV0Y2hgIG1ldGhvZCBpcyBhIGdvb2QgZGVmYXVsdCBpbXBsZW1lbnRhdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVDb21wb25lbnRSZXNvdXJjZXMoXG4gICAgcmVzb3VyY2VSZXNvbHZlcjogKHVybDogc3RyaW5nKSA9PiAoUHJvbWlzZTxzdHJpbmd8e3RleHQoKTogUHJvbWlzZTxzdHJpbmc+fT4pKTogUHJvbWlzZTxudWxsPiB7XG4gIC8vIFN0b3JlIGFsbCBwcm9taXNlcyB3aGljaCBhcmUgZmV0Y2hpbmcgdGhlIHJlc291cmNlcy5cbiAgY29uc3QgdXJsRmV0Y2hlczogUHJvbWlzZTxzdHJpbmc+W10gPSBbXTtcblxuICAvLyBDYWNoZSBzbyB0aGF0IHdlIGRvbid0IGZldGNoIHRoZSBzYW1lIHJlc291cmNlIG1vcmUgdGhhbiBvbmNlLlxuICBjb25zdCB1cmxNYXAgPSBuZXcgTWFwPHN0cmluZywgUHJvbWlzZTxzdHJpbmc+PigpO1xuICBmdW5jdGlvbiBjYWNoZWRSZXNvdXJjZVJlc29sdmUodXJsOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCBwcm9taXNlID0gdXJsTWFwLmdldCh1cmwpO1xuICAgIGlmICghcHJvbWlzZSkge1xuICAgICAgY29uc3QgcmVzcCA9IHJlc291cmNlUmVzb2x2ZXIodXJsKTtcbiAgICAgIHVybE1hcC5zZXQodXJsLCBwcm9taXNlID0gcmVzcC50aGVuKHVud3JhcFJlc3BvbnNlKSk7XG4gICAgICB1cmxGZXRjaGVzLnB1c2gocHJvbWlzZSk7XG4gICAgfVxuICAgIHJldHVybiBwcm9taXNlO1xuICB9XG5cbiAgY29tcG9uZW50UmVzb3VyY2VSZXNvbHV0aW9uUXVldWUuZm9yRWFjaCgoY29tcG9uZW50OiBDb21wb25lbnQpID0+IHtcbiAgICBpZiAoY29tcG9uZW50LnRlbXBsYXRlVXJsKSB7XG4gICAgICBjYWNoZWRSZXNvdXJjZVJlc29sdmUoY29tcG9uZW50LnRlbXBsYXRlVXJsKS50aGVuKCh0ZW1wbGF0ZSkgPT4ge1xuICAgICAgICBjb21wb25lbnQudGVtcGxhdGUgPSB0ZW1wbGF0ZTtcbiAgICAgICAgY29tcG9uZW50LnRlbXBsYXRlVXJsID0gdW5kZWZpbmVkO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGNvbnN0IHN0eWxlVXJscyA9IGNvbXBvbmVudC5zdHlsZVVybHM7XG4gICAgY29uc3Qgc3R5bGVzID0gY29tcG9uZW50LnN0eWxlcyB8fCAoY29tcG9uZW50LnN0eWxlcyA9IFtdKTtcbiAgICBjb25zdCBzdHlsZU9mZnNldCA9IGNvbXBvbmVudC5zdHlsZXMubGVuZ3RoO1xuICAgIHN0eWxlVXJscyAmJiBzdHlsZVVybHMuZm9yRWFjaCgoc3R5bGVVcmwsIGluZGV4KSA9PiB7XG4gICAgICBzdHlsZXMucHVzaCgnJyk7ICAvLyBwcmUtYWxsb2NhdGUgYXJyYXkuXG4gICAgICBjYWNoZWRSZXNvdXJjZVJlc29sdmUoc3R5bGVVcmwpLnRoZW4oKHN0eWxlKSA9PiB7XG4gICAgICAgIHN0eWxlc1tzdHlsZU9mZnNldCArIGluZGV4XSA9IHN0eWxlO1xuICAgICAgICBzdHlsZVVybHMuc3BsaWNlKHN0eWxlVXJscy5pbmRleE9mKHN0eWxlVXJsKSwgMSk7XG4gICAgICAgIGlmIChzdHlsZVVybHMubGVuZ3RoID09IDApIHtcbiAgICAgICAgICBjb21wb25lbnQuc3R5bGVVcmxzID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG4gIGNvbXBvbmVudFJlc291cmNlUmVzb2x1dGlvblF1ZXVlLmNsZWFyKCk7XG4gIHJldHVybiBQcm9taXNlLmFsbCh1cmxGZXRjaGVzKS50aGVuKCgpID0+IG51bGwpO1xufVxuXG5jb25zdCBjb21wb25lbnRSZXNvdXJjZVJlc29sdXRpb25RdWV1ZTogU2V0PENvbXBvbmVudD4gPSBuZXcgU2V0KCk7XG5cbmV4cG9ydCBmdW5jdGlvbiBtYXliZVF1ZXVlUmVzb2x1dGlvbk9mQ29tcG9uZW50UmVzb3VyY2VzKG1ldGFkYXRhOiBDb21wb25lbnQpIHtcbiAgaWYgKGNvbXBvbmVudE5lZWRzUmVzb2x1dGlvbihtZXRhZGF0YSkpIHtcbiAgICBjb21wb25lbnRSZXNvdXJjZVJlc29sdXRpb25RdWV1ZS5hZGQobWV0YWRhdGEpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21wb25lbnROZWVkc1Jlc29sdXRpb24oY29tcG9uZW50OiBDb21wb25lbnQpIHtcbiAgcmV0dXJuIGNvbXBvbmVudC50ZW1wbGF0ZVVybCB8fCBjb21wb25lbnQuc3R5bGVVcmxzICYmIGNvbXBvbmVudC5zdHlsZVVybHMubGVuZ3RoO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGNsZWFyUmVzb2x1dGlvbk9mQ29tcG9uZW50UmVzb3VyY2VzUXVldWUoKSB7XG4gIGNvbXBvbmVudFJlc291cmNlUmVzb2x1dGlvblF1ZXVlLmNsZWFyKCk7XG59XG5cbmZ1bmN0aW9uIHVud3JhcFJlc3BvbnNlKHJlc3BvbnNlOiBzdHJpbmcgfCB7dGV4dCgpOiBQcm9taXNlPHN0cmluZz59KTogc3RyaW5nfFByb21pc2U8c3RyaW5nPiB7XG4gIHJldHVybiB0eXBlb2YgcmVzcG9uc2UgPT0gJ3N0cmluZycgPyByZXNwb25zZSA6IHJlc3BvbnNlLnRleHQoKTtcbn0iXX0=
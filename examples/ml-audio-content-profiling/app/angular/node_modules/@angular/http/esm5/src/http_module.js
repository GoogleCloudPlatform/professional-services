/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
/**
 * @module
 * @description
 * The http module provides services to perform http requests. To get started, see the {@link Http}
 * class.
 */
import { NgModule } from '@angular/core';
import { BrowserJsonp } from './backends/browser_jsonp';
import { BrowserXhr } from './backends/browser_xhr';
import { JSONPBackend } from './backends/jsonp_backend';
import { CookieXSRFStrategy, XHRBackend } from './backends/xhr_backend';
import { BaseRequestOptions, RequestOptions } from './base_request_options';
import { BaseResponseOptions, ResponseOptions } from './base_response_options';
import { Http, Jsonp } from './http';
import { XSRFStrategy } from './interfaces';
export function _createDefaultCookieXSRFStrategy() {
    return new CookieXSRFStrategy();
}
export function httpFactory(xhrBackend, requestOptions) {
    return new Http(xhrBackend, requestOptions);
}
export function jsonpFactory(jsonpBackend, requestOptions) {
    return new Jsonp(jsonpBackend, requestOptions);
}
/**
 * The module that includes http's providers
 *
 * @deprecated see https://angular.io/guide/http
 * @publicApi
 */
var HttpModule = /** @class */ (function () {
    function HttpModule() {
    }
    HttpModule = tslib_1.__decorate([
        NgModule({
            providers: [
                // TODO(pascal): use factory type annotations once supported in DI
                // issue: https://github.com/angular/angular/issues/3183
                { provide: Http, useFactory: httpFactory, deps: [XHRBackend, RequestOptions] },
                BrowserXhr,
                { provide: RequestOptions, useClass: BaseRequestOptions },
                { provide: ResponseOptions, useClass: BaseResponseOptions },
                XHRBackend,
                { provide: XSRFStrategy, useFactory: _createDefaultCookieXSRFStrategy },
            ],
        })
    ], HttpModule);
    return HttpModule;
}());
export { HttpModule };
/**
 * The module that includes jsonp's providers
 *
 * @deprecated see https://angular.io/guide/http
 * @publicApi
 */
var JsonpModule = /** @class */ (function () {
    function JsonpModule() {
    }
    JsonpModule = tslib_1.__decorate([
        NgModule({
            providers: [
                // TODO(pascal): use factory type annotations once supported in DI
                // issue: https://github.com/angular/angular/issues/3183
                { provide: Jsonp, useFactory: jsonpFactory, deps: [JSONPBackend, RequestOptions] },
                BrowserJsonp,
                { provide: RequestOptions, useClass: BaseRequestOptions },
                { provide: ResponseOptions, useClass: BaseResponseOptions },
                JSONPBackend,
            ],
        })
    ], JsonpModule);
    return JsonpModule;
}());
export { JsonpModule };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHR0cF9tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9odHRwL3NyYy9odHRwX21vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBRUg7Ozs7O0dBS0c7QUFDSCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRXZDLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUN0RCxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDbEQsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQ3RELE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxVQUFVLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUN0RSxPQUFPLEVBQUMsa0JBQWtCLEVBQUUsY0FBYyxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDMUUsT0FBTyxFQUFDLG1CQUFtQixFQUFFLGVBQWUsRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBQzdFLE9BQU8sRUFBQyxJQUFJLEVBQUUsS0FBSyxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQ25DLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFHMUMsTUFBTSxVQUFVLGdDQUFnQztJQUM5QyxPQUFPLElBQUksa0JBQWtCLEVBQUUsQ0FBQztBQUNsQyxDQUFDO0FBRUQsTUFBTSxVQUFVLFdBQVcsQ0FBQyxVQUFzQixFQUFFLGNBQThCO0lBQ2hGLE9BQU8sSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLGNBQWMsQ0FBQyxDQUFDO0FBQzlDLENBQUM7QUFFRCxNQUFNLFVBQVUsWUFBWSxDQUFDLFlBQTBCLEVBQUUsY0FBOEI7SUFDckYsT0FBTyxJQUFJLEtBQUssQ0FBQyxZQUFZLEVBQUUsY0FBYyxDQUFDLENBQUM7QUFDakQsQ0FBQztBQUdEOzs7OztHQUtHO0FBYUg7SUFBQTtJQUNBLENBQUM7SUFEWSxVQUFVO1FBWnRCLFFBQVEsQ0FBQztZQUNSLFNBQVMsRUFBRTtnQkFDVCxrRUFBa0U7Z0JBQ2xFLHdEQUF3RDtnQkFDeEQsRUFBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLENBQUMsVUFBVSxFQUFFLGNBQWMsQ0FBQyxFQUFDO2dCQUM1RSxVQUFVO2dCQUNWLEVBQUMsT0FBTyxFQUFFLGNBQWMsRUFBRSxRQUFRLEVBQUUsa0JBQWtCLEVBQUM7Z0JBQ3ZELEVBQUMsT0FBTyxFQUFFLGVBQWUsRUFBRSxRQUFRLEVBQUUsbUJBQW1CLEVBQUM7Z0JBQ3pELFVBQVU7Z0JBQ1YsRUFBQyxPQUFPLEVBQUUsWUFBWSxFQUFFLFVBQVUsRUFBRSxnQ0FBZ0MsRUFBQzthQUN0RTtTQUNGLENBQUM7T0FDVyxVQUFVLENBQ3RCO0lBQUQsaUJBQUM7Q0FBQSxBQURELElBQ0M7U0FEWSxVQUFVO0FBR3ZCOzs7OztHQUtHO0FBWUg7SUFBQTtJQUNBLENBQUM7SUFEWSxXQUFXO1FBWHZCLFFBQVEsQ0FBQztZQUNSLFNBQVMsRUFBRTtnQkFDVCxrRUFBa0U7Z0JBQ2xFLHdEQUF3RDtnQkFDeEQsRUFBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLENBQUMsWUFBWSxFQUFFLGNBQWMsQ0FBQyxFQUFDO2dCQUNoRixZQUFZO2dCQUNaLEVBQUMsT0FBTyxFQUFFLGNBQWMsRUFBRSxRQUFRLEVBQUUsa0JBQWtCLEVBQUM7Z0JBQ3ZELEVBQUMsT0FBTyxFQUFFLGVBQWUsRUFBRSxRQUFRLEVBQUUsbUJBQW1CLEVBQUM7Z0JBQ3pELFlBQVk7YUFDYjtTQUNGLENBQUM7T0FDVyxXQUFXLENBQ3ZCO0lBQUQsa0JBQUM7Q0FBQSxBQURELElBQ0M7U0FEWSxXQUFXIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKipcbiAqIEBtb2R1bGVcbiAqIEBkZXNjcmlwdGlvblxuICogVGhlIGh0dHAgbW9kdWxlIHByb3ZpZGVzIHNlcnZpY2VzIHRvIHBlcmZvcm0gaHR0cCByZXF1ZXN0cy4gVG8gZ2V0IHN0YXJ0ZWQsIHNlZSB0aGUge0BsaW5rIEh0dHB9XG4gKiBjbGFzcy5cbiAqL1xuaW1wb3J0IHtOZ01vZHVsZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbmltcG9ydCB7QnJvd3Nlckpzb25wfSBmcm9tICcuL2JhY2tlbmRzL2Jyb3dzZXJfanNvbnAnO1xuaW1wb3J0IHtCcm93c2VyWGhyfSBmcm9tICcuL2JhY2tlbmRzL2Jyb3dzZXJfeGhyJztcbmltcG9ydCB7SlNPTlBCYWNrZW5kfSBmcm9tICcuL2JhY2tlbmRzL2pzb25wX2JhY2tlbmQnO1xuaW1wb3J0IHtDb29raWVYU1JGU3RyYXRlZ3ksIFhIUkJhY2tlbmR9IGZyb20gJy4vYmFja2VuZHMveGhyX2JhY2tlbmQnO1xuaW1wb3J0IHtCYXNlUmVxdWVzdE9wdGlvbnMsIFJlcXVlc3RPcHRpb25zfSBmcm9tICcuL2Jhc2VfcmVxdWVzdF9vcHRpb25zJztcbmltcG9ydCB7QmFzZVJlc3BvbnNlT3B0aW9ucywgUmVzcG9uc2VPcHRpb25zfSBmcm9tICcuL2Jhc2VfcmVzcG9uc2Vfb3B0aW9ucyc7XG5pbXBvcnQge0h0dHAsIEpzb25wfSBmcm9tICcuL2h0dHAnO1xuaW1wb3J0IHtYU1JGU3RyYXRlZ3l9IGZyb20gJy4vaW50ZXJmYWNlcyc7XG5cblxuZXhwb3J0IGZ1bmN0aW9uIF9jcmVhdGVEZWZhdWx0Q29va2llWFNSRlN0cmF0ZWd5KCkge1xuICByZXR1cm4gbmV3IENvb2tpZVhTUkZTdHJhdGVneSgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaHR0cEZhY3RvcnkoeGhyQmFja2VuZDogWEhSQmFja2VuZCwgcmVxdWVzdE9wdGlvbnM6IFJlcXVlc3RPcHRpb25zKTogSHR0cCB7XG4gIHJldHVybiBuZXcgSHR0cCh4aHJCYWNrZW5kLCByZXF1ZXN0T3B0aW9ucyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBqc29ucEZhY3RvcnkoanNvbnBCYWNrZW5kOiBKU09OUEJhY2tlbmQsIHJlcXVlc3RPcHRpb25zOiBSZXF1ZXN0T3B0aW9ucyk6IEpzb25wIHtcbiAgcmV0dXJuIG5ldyBKc29ucChqc29ucEJhY2tlbmQsIHJlcXVlc3RPcHRpb25zKTtcbn1cblxuXG4vKipcbiAqIFRoZSBtb2R1bGUgdGhhdCBpbmNsdWRlcyBodHRwJ3MgcHJvdmlkZXJzXG4gKlxuICogQGRlcHJlY2F0ZWQgc2VlIGh0dHBzOi8vYW5ndWxhci5pby9ndWlkZS9odHRwXG4gKiBAcHVibGljQXBpXG4gKi9cbkBOZ01vZHVsZSh7XG4gIHByb3ZpZGVyczogW1xuICAgIC8vIFRPRE8ocGFzY2FsKTogdXNlIGZhY3RvcnkgdHlwZSBhbm5vdGF0aW9ucyBvbmNlIHN1cHBvcnRlZCBpbiBESVxuICAgIC8vIGlzc3VlOiBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyL2lzc3Vlcy8zMTgzXG4gICAge3Byb3ZpZGU6IEh0dHAsIHVzZUZhY3Rvcnk6IGh0dHBGYWN0b3J5LCBkZXBzOiBbWEhSQmFja2VuZCwgUmVxdWVzdE9wdGlvbnNdfSxcbiAgICBCcm93c2VyWGhyLFxuICAgIHtwcm92aWRlOiBSZXF1ZXN0T3B0aW9ucywgdXNlQ2xhc3M6IEJhc2VSZXF1ZXN0T3B0aW9uc30sXG4gICAge3Byb3ZpZGU6IFJlc3BvbnNlT3B0aW9ucywgdXNlQ2xhc3M6IEJhc2VSZXNwb25zZU9wdGlvbnN9LFxuICAgIFhIUkJhY2tlbmQsXG4gICAge3Byb3ZpZGU6IFhTUkZTdHJhdGVneSwgdXNlRmFjdG9yeTogX2NyZWF0ZURlZmF1bHRDb29raWVYU1JGU3RyYXRlZ3l9LFxuICBdLFxufSlcbmV4cG9ydCBjbGFzcyBIdHRwTW9kdWxlIHtcbn1cblxuLyoqXG4gKiBUaGUgbW9kdWxlIHRoYXQgaW5jbHVkZXMganNvbnAncyBwcm92aWRlcnNcbiAqXG4gKiBAZGVwcmVjYXRlZCBzZWUgaHR0cHM6Ly9hbmd1bGFyLmlvL2d1aWRlL2h0dHBcbiAqIEBwdWJsaWNBcGlcbiAqL1xuQE5nTW9kdWxlKHtcbiAgcHJvdmlkZXJzOiBbXG4gICAgLy8gVE9ETyhwYXNjYWwpOiB1c2UgZmFjdG9yeSB0eXBlIGFubm90YXRpb25zIG9uY2Ugc3VwcG9ydGVkIGluIERJXG4gICAgLy8gaXNzdWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXIvaXNzdWVzLzMxODNcbiAgICB7cHJvdmlkZTogSnNvbnAsIHVzZUZhY3Rvcnk6IGpzb25wRmFjdG9yeSwgZGVwczogW0pTT05QQmFja2VuZCwgUmVxdWVzdE9wdGlvbnNdfSxcbiAgICBCcm93c2VySnNvbnAsXG4gICAge3Byb3ZpZGU6IFJlcXVlc3RPcHRpb25zLCB1c2VDbGFzczogQmFzZVJlcXVlc3RPcHRpb25zfSxcbiAgICB7cHJvdmlkZTogUmVzcG9uc2VPcHRpb25zLCB1c2VDbGFzczogQmFzZVJlc3BvbnNlT3B0aW9uc30sXG4gICAgSlNPTlBCYWNrZW5kLFxuICBdLFxufSlcbmV4cG9ydCBjbGFzcyBKc29ucE1vZHVsZSB7XG59XG4iXX0=
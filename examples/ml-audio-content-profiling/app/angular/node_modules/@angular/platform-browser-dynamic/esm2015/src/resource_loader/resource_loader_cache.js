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
import { ResourceLoader } from '@angular/compiler';
import { ɵglobal as global } from '@angular/core';
/**
 * An implementation of ResourceLoader that uses a template cache to avoid doing an actual
 * ResourceLoader.
 *
 * The template cache needs to be built and loaded into window.$templateCache
 * via a separate mechanism.
 *
 * \@publicApi
 */
export class CachedResourceLoader extends ResourceLoader {
    constructor() {
        super();
        this._cache = (/** @type {?} */ (global)).$templateCache;
        if (this._cache == null) {
            throw new Error('CachedResourceLoader: Template cache was not found in $templateCache.');
        }
    }
    /**
     * @param {?} url
     * @return {?}
     */
    get(url) {
        if (this._cache.hasOwnProperty(url)) {
            return Promise.resolve(this._cache[url]);
        }
        else {
            return /** @type {?} */ (Promise.reject('CachedResourceLoader: Did not find cached template for ' + url));
        }
    }
}
if (false) {
    /** @type {?} */
    CachedResourceLoader.prototype._cache;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb3VyY2VfbG9hZGVyX2NhY2hlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvcGxhdGZvcm0tYnJvd3Nlci1keW5hbWljL3NyYy9yZXNvdXJjZV9sb2FkZXIvcmVzb3VyY2VfbG9hZGVyX2NhY2hlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2pELE9BQU8sRUFBQyxPQUFPLElBQUksTUFBTSxFQUFDLE1BQU0sZUFBZSxDQUFDOzs7Ozs7Ozs7O0FBV2hELE1BQU0sT0FBTyxvQkFBcUIsU0FBUSxjQUFjO0lBR3REO1FBQ0UsS0FBSyxFQUFFLENBQUM7UUFDUixJQUFJLENBQUMsTUFBTSxHQUFHLG1CQUFNLE1BQU0sRUFBQyxDQUFDLGNBQWMsQ0FBQztRQUMzQyxJQUFJLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxFQUFFO1lBQ3ZCLE1BQU0sSUFBSSxLQUFLLENBQUMsdUVBQXVFLENBQUMsQ0FBQztTQUMxRjtLQUNGOzs7OztJQUVELEdBQUcsQ0FBQyxHQUFXO1FBQ2IsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUNuQyxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1NBQzFDO2FBQU07WUFDTCx5QkFBcUIsT0FBTyxDQUFDLE1BQU0sQ0FDL0IseURBQXlELEdBQUcsR0FBRyxDQUFDLEVBQUM7U0FDdEU7S0FDRjtDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1Jlc291cmNlTG9hZGVyfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5pbXBvcnQge8m1Z2xvYmFsIGFzIGdsb2JhbH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbi8qKlxuICogQW4gaW1wbGVtZW50YXRpb24gb2YgUmVzb3VyY2VMb2FkZXIgdGhhdCB1c2VzIGEgdGVtcGxhdGUgY2FjaGUgdG8gYXZvaWQgZG9pbmcgYW4gYWN0dWFsXG4gKiBSZXNvdXJjZUxvYWRlci5cbiAqXG4gKiBUaGUgdGVtcGxhdGUgY2FjaGUgbmVlZHMgdG8gYmUgYnVpbHQgYW5kIGxvYWRlZCBpbnRvIHdpbmRvdy4kdGVtcGxhdGVDYWNoZVxuICogdmlhIGEgc2VwYXJhdGUgbWVjaGFuaXNtLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNsYXNzIENhY2hlZFJlc291cmNlTG9hZGVyIGV4dGVuZHMgUmVzb3VyY2VMb2FkZXIge1xuICBwcml2YXRlIF9jYWNoZToge1t1cmw6IHN0cmluZ106IHN0cmluZ307XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLl9jYWNoZSA9ICg8YW55Pmdsb2JhbCkuJHRlbXBsYXRlQ2FjaGU7XG4gICAgaWYgKHRoaXMuX2NhY2hlID09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2FjaGVkUmVzb3VyY2VMb2FkZXI6IFRlbXBsYXRlIGNhY2hlIHdhcyBub3QgZm91bmQgaW4gJHRlbXBsYXRlQ2FjaGUuJyk7XG4gICAgfVxuICB9XG5cbiAgZ2V0KHVybDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5fY2FjaGUuaGFzT3duUHJvcGVydHkodXJsKSkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLl9jYWNoZVt1cmxdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIDxQcm9taXNlPGFueT4+UHJvbWlzZS5yZWplY3QoXG4gICAgICAgICAgJ0NhY2hlZFJlc291cmNlTG9hZGVyOiBEaWQgbm90IGZpbmQgY2FjaGVkIHRlbXBsYXRlIGZvciAnICsgdXJsKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { EventEmitter, Injectable } from '@angular/core';
import { LocationStrategy } from './location_strategy';
/**
 * @description
 *
 * A service that applications can use to interact with a browser's URL.
 *
 * Depending on which {@link LocationStrategy} is used, `Location` will either persist
 * to the URL's path or the URL's hash segment.
 *
 * @usageNotes
 *
 * It's better to use {@link Router#navigate} service to trigger route changes. Use
 * `Location` only if you need to interact with or create normalized URLs outside of
 * routing.
 *
 * `Location` is responsible for normalizing the URL against the application's base href.
 * A normalized URL is absolute from the URL host, includes the application's base href, and has no
 * trailing slash:
 * - `/my/app/user/123` is normalized
 * - `my/app/user/123` **is not** normalized
 * - `/my/app/user/123/` **is not** normalized
 *
 * ### Example
 *
 * {@example common/location/ts/path_location_component.ts region='LocationComponent'}
 *
 * @publicApi
 */
var Location = /** @class */ (function () {
    function Location(platformStrategy) {
        var _this = this;
        /** @internal */
        this._subject = new EventEmitter();
        this._platformStrategy = platformStrategy;
        var browserBaseHref = this._platformStrategy.getBaseHref();
        this._baseHref = Location_1.stripTrailingSlash(_stripIndexHtml(browserBaseHref));
        this._platformStrategy.onPopState(function (ev) {
            _this._subject.emit({
                'url': _this.path(true),
                'pop': true,
                'state': ev.state,
                'type': ev.type,
            });
        });
    }
    Location_1 = Location;
    /**
     * Returns the normalized URL path.
     */
    // TODO: vsavkin. Remove the boolean flag and always include hash once the deprecated router is
    // removed.
    Location.prototype.path = function (includeHash) {
        if (includeHash === void 0) { includeHash = false; }
        return this.normalize(this._platformStrategy.path(includeHash));
    };
    /**
     * Normalizes the given path and compares to the current normalized path.
     */
    Location.prototype.isCurrentPathEqualTo = function (path, query) {
        if (query === void 0) { query = ''; }
        return this.path() == this.normalize(path + Location_1.normalizeQueryParams(query));
    };
    /**
     * Given a string representing a URL, returns the normalized URL path without leading or
     * trailing slashes.
     */
    Location.prototype.normalize = function (url) {
        return Location_1.stripTrailingSlash(_stripBaseHref(this._baseHref, _stripIndexHtml(url)));
    };
    /**
     * Given a string representing a URL, returns the platform-specific external URL path.
     * If the given URL doesn't begin with a leading slash (`'/'`), this method adds one
     * before normalizing. This method will also add a hash if `HashLocationStrategy` is
     * used, or the `APP_BASE_HREF` if the `PathLocationStrategy` is in use.
     */
    Location.prototype.prepareExternalUrl = function (url) {
        if (url && url[0] !== '/') {
            url = '/' + url;
        }
        return this._platformStrategy.prepareExternalUrl(url);
    };
    // TODO: rename this method to pushState
    /**
     * Changes the browsers URL to the normalized version of the given URL, and pushes a
     * new item onto the platform's history.
     */
    Location.prototype.go = function (path, query, state) {
        if (query === void 0) { query = ''; }
        if (state === void 0) { state = null; }
        this._platformStrategy.pushState(state, '', path, query);
    };
    /**
     * Changes the browsers URL to the normalized version of the given URL, and replaces
     * the top item on the platform's history stack.
     */
    Location.prototype.replaceState = function (path, query, state) {
        if (query === void 0) { query = ''; }
        if (state === void 0) { state = null; }
        this._platformStrategy.replaceState(state, '', path, query);
    };
    /**
     * Navigates forward in the platform's history.
     */
    Location.prototype.forward = function () { this._platformStrategy.forward(); };
    /**
     * Navigates back in the platform's history.
     */
    Location.prototype.back = function () { this._platformStrategy.back(); };
    /**
     * Subscribe to the platform's `popState` events.
     */
    Location.prototype.subscribe = function (onNext, onThrow, onReturn) {
        return this._subject.subscribe({ next: onNext, error: onThrow, complete: onReturn });
    };
    /**
     * Given a string of url parameters, prepend with '?' if needed, otherwise return parameters as
     * is.
     */
    Location.normalizeQueryParams = function (params) {
        return params && params[0] !== '?' ? '?' + params : params;
    };
    /**
     * Given 2 parts of a url, join them with a slash if needed.
     */
    Location.joinWithSlash = function (start, end) {
        if (start.length == 0) {
            return end;
        }
        if (end.length == 0) {
            return start;
        }
        var slashes = 0;
        if (start.endsWith('/')) {
            slashes++;
        }
        if (end.startsWith('/')) {
            slashes++;
        }
        if (slashes == 2) {
            return start + end.substring(1);
        }
        if (slashes == 1) {
            return start + end;
        }
        return start + '/' + end;
    };
    /**
     * If url has a trailing slash, remove it, otherwise return url as is. This
     * method looks for the first occurrence of either #, ?, or the end of the
     * line as `/` characters after any of these should not be replaced.
     */
    Location.stripTrailingSlash = function (url) {
        var match = url.match(/#|\?|$/);
        var pathEndIdx = match && match.index || url.length;
        var droppedSlashIdx = pathEndIdx - (url[pathEndIdx - 1] === '/' ? 1 : 0);
        return url.slice(0, droppedSlashIdx) + url.slice(pathEndIdx);
    };
    var Location_1;
    Location = Location_1 = tslib_1.__decorate([
        Injectable(),
        tslib_1.__metadata("design:paramtypes", [LocationStrategy])
    ], Location);
    return Location;
}());
export { Location };
function _stripBaseHref(baseHref, url) {
    return baseHref && url.startsWith(baseHref) ? url.substring(baseHref.length) : url;
}
function _stripIndexHtml(url) {
    return url.replace(/\/index.html$/, '');
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21tb24vc3JjL2xvY2F0aW9uL2xvY2F0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMsWUFBWSxFQUFFLFVBQVUsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUd2RCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQVVyRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0EwQkc7QUFFSDtJQVFFLGtCQUFZLGdCQUFrQztRQUE5QyxpQkFZQztRQW5CRCxnQkFBZ0I7UUFDaEIsYUFBUSxHQUFzQixJQUFJLFlBQVksRUFBRSxDQUFDO1FBTy9DLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxnQkFBZ0IsQ0FBQztRQUMxQyxJQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDN0QsSUFBSSxDQUFDLFNBQVMsR0FBRyxVQUFRLENBQUMsa0JBQWtCLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7UUFDL0UsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFVBQVUsQ0FBQyxVQUFDLEVBQUU7WUFDbkMsS0FBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7Z0JBQ2pCLEtBQUssRUFBRSxLQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztnQkFDdEIsS0FBSyxFQUFFLElBQUk7Z0JBQ1gsT0FBTyxFQUFFLEVBQUUsQ0FBQyxLQUFLO2dCQUNqQixNQUFNLEVBQUUsRUFBRSxDQUFDLElBQUk7YUFDaEIsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO2lCQXBCVSxRQUFRO0lBc0JuQjs7T0FFRztJQUNILCtGQUErRjtJQUMvRixXQUFXO0lBQ1gsdUJBQUksR0FBSixVQUFLLFdBQTRCO1FBQTVCLDRCQUFBLEVBQUEsbUJBQTRCO1FBQy9CLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7SUFDbEUsQ0FBQztJQUVEOztPQUVHO0lBQ0gsdUNBQW9CLEdBQXBCLFVBQXFCLElBQVksRUFBRSxLQUFrQjtRQUFsQixzQkFBQSxFQUFBLFVBQWtCO1FBQ25ELE9BQU8sSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxHQUFHLFVBQVEsQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQ3BGLENBQUM7SUFFRDs7O09BR0c7SUFDSCw0QkFBUyxHQUFULFVBQVUsR0FBVztRQUNuQixPQUFPLFVBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxlQUFlLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNGLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILHFDQUFrQixHQUFsQixVQUFtQixHQUFXO1FBQzVCLElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUU7WUFDekIsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUM7U0FDakI7UUFDRCxPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBRUQsd0NBQXdDO0lBQ3hDOzs7T0FHRztJQUNILHFCQUFFLEdBQUYsVUFBRyxJQUFZLEVBQUUsS0FBa0IsRUFBRSxLQUFpQjtRQUFyQyxzQkFBQSxFQUFBLFVBQWtCO1FBQUUsc0JBQUEsRUFBQSxZQUFpQjtRQUNwRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzNELENBQUM7SUFFRDs7O09BR0c7SUFDSCwrQkFBWSxHQUFaLFVBQWEsSUFBWSxFQUFFLEtBQWtCLEVBQUUsS0FBaUI7UUFBckMsc0JBQUEsRUFBQSxVQUFrQjtRQUFFLHNCQUFBLEVBQUEsWUFBaUI7UUFDOUQsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztJQUM5RCxDQUFDO0lBRUQ7O09BRUc7SUFDSCwwQkFBTyxHQUFQLGNBQWtCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFFckQ7O09BRUc7SUFDSCx1QkFBSSxHQUFKLGNBQWUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztJQUUvQzs7T0FFRztJQUNILDRCQUFTLEdBQVQsVUFDSSxNQUFzQyxFQUFFLE9BQXlDLEVBQ2pGLFFBQTRCO1FBQzlCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsRUFBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBQyxDQUFDLENBQUM7SUFDckYsQ0FBQztJQUVEOzs7T0FHRztJQUNXLDZCQUFvQixHQUFsQyxVQUFtQyxNQUFjO1FBQy9DLE9BQU8sTUFBTSxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztJQUM3RCxDQUFDO0lBRUQ7O09BRUc7SUFDVyxzQkFBYSxHQUEzQixVQUE0QixLQUFhLEVBQUUsR0FBVztRQUNwRCxJQUFJLEtBQUssQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFO1lBQ3JCLE9BQU8sR0FBRyxDQUFDO1NBQ1o7UUFDRCxJQUFJLEdBQUcsQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFO1lBQ25CLE9BQU8sS0FBSyxDQUFDO1NBQ2Q7UUFDRCxJQUFJLE9BQU8sR0FBRyxDQUFDLENBQUM7UUFDaEIsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ3ZCLE9BQU8sRUFBRSxDQUFDO1NBQ1g7UUFDRCxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDdkIsT0FBTyxFQUFFLENBQUM7U0FDWDtRQUNELElBQUksT0FBTyxJQUFJLENBQUMsRUFBRTtZQUNoQixPQUFPLEtBQUssR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ2pDO1FBQ0QsSUFBSSxPQUFPLElBQUksQ0FBQyxFQUFFO1lBQ2hCLE9BQU8sS0FBSyxHQUFHLEdBQUcsQ0FBQztTQUNwQjtRQUNELE9BQU8sS0FBSyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUM7SUFDM0IsQ0FBQztJQUVEOzs7O09BSUc7SUFDVywyQkFBa0IsR0FBaEMsVUFBaUMsR0FBVztRQUMxQyxJQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2xDLElBQU0sVUFBVSxHQUFHLEtBQUssSUFBSSxLQUFLLENBQUMsS0FBSyxJQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUM7UUFDdEQsSUFBTSxlQUFlLEdBQUcsVUFBVSxHQUFHLENBQUMsR0FBRyxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDM0UsT0FBTyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxlQUFlLENBQUMsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQy9ELENBQUM7O0lBM0lVLFFBQVE7UUFEcEIsVUFBVSxFQUFFO2lEQVNtQixnQkFBZ0I7T0FSbkMsUUFBUSxDQTRJcEI7SUFBRCxlQUFDO0NBQUEsQUE1SUQsSUE0SUM7U0E1SVksUUFBUTtBQThJckIsU0FBUyxjQUFjLENBQUMsUUFBZ0IsRUFBRSxHQUFXO0lBQ25ELE9BQU8sUUFBUSxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7QUFDckYsQ0FBQztBQUVELFNBQVMsZUFBZSxDQUFDLEdBQVc7SUFDbEMsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLGVBQWUsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUMxQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0V2ZW50RW1pdHRlciwgSW5qZWN0YWJsZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1N1YnNjcmlwdGlvbkxpa2V9IGZyb20gJ3J4anMnO1xuXG5pbXBvcnQge0xvY2F0aW9uU3RyYXRlZ3l9IGZyb20gJy4vbG9jYXRpb25fc3RyYXRlZ3knO1xuXG4vKiogQHB1YmxpY0FwaSAqL1xuZXhwb3J0IGludGVyZmFjZSBQb3BTdGF0ZUV2ZW50IHtcbiAgcG9wPzogYm9vbGVhbjtcbiAgc3RhdGU/OiBhbnk7XG4gIHR5cGU/OiBzdHJpbmc7XG4gIHVybD86IHN0cmluZztcbn1cblxuLyoqXG4gKiBAZGVzY3JpcHRpb25cbiAqXG4gKiBBIHNlcnZpY2UgdGhhdCBhcHBsaWNhdGlvbnMgY2FuIHVzZSB0byBpbnRlcmFjdCB3aXRoIGEgYnJvd3NlcidzIFVSTC5cbiAqXG4gKiBEZXBlbmRpbmcgb24gd2hpY2gge0BsaW5rIExvY2F0aW9uU3RyYXRlZ3l9IGlzIHVzZWQsIGBMb2NhdGlvbmAgd2lsbCBlaXRoZXIgcGVyc2lzdFxuICogdG8gdGhlIFVSTCdzIHBhdGggb3IgdGhlIFVSTCdzIGhhc2ggc2VnbWVudC5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICpcbiAqIEl0J3MgYmV0dGVyIHRvIHVzZSB7QGxpbmsgUm91dGVyI25hdmlnYXRlfSBzZXJ2aWNlIHRvIHRyaWdnZXIgcm91dGUgY2hhbmdlcy4gVXNlXG4gKiBgTG9jYXRpb25gIG9ubHkgaWYgeW91IG5lZWQgdG8gaW50ZXJhY3Qgd2l0aCBvciBjcmVhdGUgbm9ybWFsaXplZCBVUkxzIG91dHNpZGUgb2ZcbiAqIHJvdXRpbmcuXG4gKlxuICogYExvY2F0aW9uYCBpcyByZXNwb25zaWJsZSBmb3Igbm9ybWFsaXppbmcgdGhlIFVSTCBhZ2FpbnN0IHRoZSBhcHBsaWNhdGlvbidzIGJhc2UgaHJlZi5cbiAqIEEgbm9ybWFsaXplZCBVUkwgaXMgYWJzb2x1dGUgZnJvbSB0aGUgVVJMIGhvc3QsIGluY2x1ZGVzIHRoZSBhcHBsaWNhdGlvbidzIGJhc2UgaHJlZiwgYW5kIGhhcyBub1xuICogdHJhaWxpbmcgc2xhc2g6XG4gKiAtIGAvbXkvYXBwL3VzZXIvMTIzYCBpcyBub3JtYWxpemVkXG4gKiAtIGBteS9hcHAvdXNlci8xMjNgICoqaXMgbm90Kiogbm9ybWFsaXplZFxuICogLSBgL215L2FwcC91c2VyLzEyMy9gICoqaXMgbm90Kiogbm9ybWFsaXplZFxuICpcbiAqICMjIyBFeGFtcGxlXG4gKlxuICoge0BleGFtcGxlIGNvbW1vbi9sb2NhdGlvbi90cy9wYXRoX2xvY2F0aW9uX2NvbXBvbmVudC50cyByZWdpb249J0xvY2F0aW9uQ29tcG9uZW50J31cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBMb2NhdGlvbiB7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX3N1YmplY3Q6IEV2ZW50RW1pdHRlcjxhbnk+ID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICAvKiogQGludGVybmFsICovXG4gIF9iYXNlSHJlZjogc3RyaW5nO1xuICAvKiogQGludGVybmFsICovXG4gIF9wbGF0Zm9ybVN0cmF0ZWd5OiBMb2NhdGlvblN0cmF0ZWd5O1xuXG4gIGNvbnN0cnVjdG9yKHBsYXRmb3JtU3RyYXRlZ3k6IExvY2F0aW9uU3RyYXRlZ3kpIHtcbiAgICB0aGlzLl9wbGF0Zm9ybVN0cmF0ZWd5ID0gcGxhdGZvcm1TdHJhdGVneTtcbiAgICBjb25zdCBicm93c2VyQmFzZUhyZWYgPSB0aGlzLl9wbGF0Zm9ybVN0cmF0ZWd5LmdldEJhc2VIcmVmKCk7XG4gICAgdGhpcy5fYmFzZUhyZWYgPSBMb2NhdGlvbi5zdHJpcFRyYWlsaW5nU2xhc2goX3N0cmlwSW5kZXhIdG1sKGJyb3dzZXJCYXNlSHJlZikpO1xuICAgIHRoaXMuX3BsYXRmb3JtU3RyYXRlZ3kub25Qb3BTdGF0ZSgoZXYpID0+IHtcbiAgICAgIHRoaXMuX3N1YmplY3QuZW1pdCh7XG4gICAgICAgICd1cmwnOiB0aGlzLnBhdGgodHJ1ZSksXG4gICAgICAgICdwb3AnOiB0cnVlLFxuICAgICAgICAnc3RhdGUnOiBldi5zdGF0ZSxcbiAgICAgICAgJ3R5cGUnOiBldi50eXBlLFxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgbm9ybWFsaXplZCBVUkwgcGF0aC5cbiAgICovXG4gIC8vIFRPRE86IHZzYXZraW4uIFJlbW92ZSB0aGUgYm9vbGVhbiBmbGFnIGFuZCBhbHdheXMgaW5jbHVkZSBoYXNoIG9uY2UgdGhlIGRlcHJlY2F0ZWQgcm91dGVyIGlzXG4gIC8vIHJlbW92ZWQuXG4gIHBhdGgoaW5jbHVkZUhhc2g6IGJvb2xlYW4gPSBmYWxzZSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMubm9ybWFsaXplKHRoaXMuX3BsYXRmb3JtU3RyYXRlZ3kucGF0aChpbmNsdWRlSGFzaCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIE5vcm1hbGl6ZXMgdGhlIGdpdmVuIHBhdGggYW5kIGNvbXBhcmVzIHRvIHRoZSBjdXJyZW50IG5vcm1hbGl6ZWQgcGF0aC5cbiAgICovXG4gIGlzQ3VycmVudFBhdGhFcXVhbFRvKHBhdGg6IHN0cmluZywgcXVlcnk6IHN0cmluZyA9ICcnKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMucGF0aCgpID09IHRoaXMubm9ybWFsaXplKHBhdGggKyBMb2NhdGlvbi5ub3JtYWxpemVRdWVyeVBhcmFtcyhxdWVyeSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdpdmVuIGEgc3RyaW5nIHJlcHJlc2VudGluZyBhIFVSTCwgcmV0dXJucyB0aGUgbm9ybWFsaXplZCBVUkwgcGF0aCB3aXRob3V0IGxlYWRpbmcgb3JcbiAgICogdHJhaWxpbmcgc2xhc2hlcy5cbiAgICovXG4gIG5vcm1hbGl6ZSh1cmw6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIExvY2F0aW9uLnN0cmlwVHJhaWxpbmdTbGFzaChfc3RyaXBCYXNlSHJlZih0aGlzLl9iYXNlSHJlZiwgX3N0cmlwSW5kZXhIdG1sKHVybCkpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHaXZlbiBhIHN0cmluZyByZXByZXNlbnRpbmcgYSBVUkwsIHJldHVybnMgdGhlIHBsYXRmb3JtLXNwZWNpZmljIGV4dGVybmFsIFVSTCBwYXRoLlxuICAgKiBJZiB0aGUgZ2l2ZW4gVVJMIGRvZXNuJ3QgYmVnaW4gd2l0aCBhIGxlYWRpbmcgc2xhc2ggKGAnLydgKSwgdGhpcyBtZXRob2QgYWRkcyBvbmVcbiAgICogYmVmb3JlIG5vcm1hbGl6aW5nLiBUaGlzIG1ldGhvZCB3aWxsIGFsc28gYWRkIGEgaGFzaCBpZiBgSGFzaExvY2F0aW9uU3RyYXRlZ3lgIGlzXG4gICAqIHVzZWQsIG9yIHRoZSBgQVBQX0JBU0VfSFJFRmAgaWYgdGhlIGBQYXRoTG9jYXRpb25TdHJhdGVneWAgaXMgaW4gdXNlLlxuICAgKi9cbiAgcHJlcGFyZUV4dGVybmFsVXJsKHVybDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBpZiAodXJsICYmIHVybFswXSAhPT0gJy8nKSB7XG4gICAgICB1cmwgPSAnLycgKyB1cmw7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9wbGF0Zm9ybVN0cmF0ZWd5LnByZXBhcmVFeHRlcm5hbFVybCh1cmwpO1xuICB9XG5cbiAgLy8gVE9ETzogcmVuYW1lIHRoaXMgbWV0aG9kIHRvIHB1c2hTdGF0ZVxuICAvKipcbiAgICogQ2hhbmdlcyB0aGUgYnJvd3NlcnMgVVJMIHRvIHRoZSBub3JtYWxpemVkIHZlcnNpb24gb2YgdGhlIGdpdmVuIFVSTCwgYW5kIHB1c2hlcyBhXG4gICAqIG5ldyBpdGVtIG9udG8gdGhlIHBsYXRmb3JtJ3MgaGlzdG9yeS5cbiAgICovXG4gIGdvKHBhdGg6IHN0cmluZywgcXVlcnk6IHN0cmluZyA9ICcnLCBzdGF0ZTogYW55ID0gbnVsbCk6IHZvaWQge1xuICAgIHRoaXMuX3BsYXRmb3JtU3RyYXRlZ3kucHVzaFN0YXRlKHN0YXRlLCAnJywgcGF0aCwgcXVlcnkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoYW5nZXMgdGhlIGJyb3dzZXJzIFVSTCB0byB0aGUgbm9ybWFsaXplZCB2ZXJzaW9uIG9mIHRoZSBnaXZlbiBVUkwsIGFuZCByZXBsYWNlc1xuICAgKiB0aGUgdG9wIGl0ZW0gb24gdGhlIHBsYXRmb3JtJ3MgaGlzdG9yeSBzdGFjay5cbiAgICovXG4gIHJlcGxhY2VTdGF0ZShwYXRoOiBzdHJpbmcsIHF1ZXJ5OiBzdHJpbmcgPSAnJywgc3RhdGU6IGFueSA9IG51bGwpOiB2b2lkIHtcbiAgICB0aGlzLl9wbGF0Zm9ybVN0cmF0ZWd5LnJlcGxhY2VTdGF0ZShzdGF0ZSwgJycsIHBhdGgsIHF1ZXJ5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBOYXZpZ2F0ZXMgZm9yd2FyZCBpbiB0aGUgcGxhdGZvcm0ncyBoaXN0b3J5LlxuICAgKi9cbiAgZm9yd2FyZCgpOiB2b2lkIHsgdGhpcy5fcGxhdGZvcm1TdHJhdGVneS5mb3J3YXJkKCk7IH1cblxuICAvKipcbiAgICogTmF2aWdhdGVzIGJhY2sgaW4gdGhlIHBsYXRmb3JtJ3MgaGlzdG9yeS5cbiAgICovXG4gIGJhY2soKTogdm9pZCB7IHRoaXMuX3BsYXRmb3JtU3RyYXRlZ3kuYmFjaygpOyB9XG5cbiAgLyoqXG4gICAqIFN1YnNjcmliZSB0byB0aGUgcGxhdGZvcm0ncyBgcG9wU3RhdGVgIGV2ZW50cy5cbiAgICovXG4gIHN1YnNjcmliZShcbiAgICAgIG9uTmV4dDogKHZhbHVlOiBQb3BTdGF0ZUV2ZW50KSA9PiB2b2lkLCBvblRocm93PzogKChleGNlcHRpb246IGFueSkgPT4gdm9pZCl8bnVsbCxcbiAgICAgIG9uUmV0dXJuPzogKCgpID0+IHZvaWQpfG51bGwpOiBTdWJzY3JpcHRpb25MaWtlIHtcbiAgICByZXR1cm4gdGhpcy5fc3ViamVjdC5zdWJzY3JpYmUoe25leHQ6IG9uTmV4dCwgZXJyb3I6IG9uVGhyb3csIGNvbXBsZXRlOiBvblJldHVybn0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdpdmVuIGEgc3RyaW5nIG9mIHVybCBwYXJhbWV0ZXJzLCBwcmVwZW5kIHdpdGggJz8nIGlmIG5lZWRlZCwgb3RoZXJ3aXNlIHJldHVybiBwYXJhbWV0ZXJzIGFzXG4gICAqIGlzLlxuICAgKi9cbiAgcHVibGljIHN0YXRpYyBub3JtYWxpemVRdWVyeVBhcmFtcyhwYXJhbXM6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHBhcmFtcyAmJiBwYXJhbXNbMF0gIT09ICc/JyA/ICc/JyArIHBhcmFtcyA6IHBhcmFtcztcbiAgfVxuXG4gIC8qKlxuICAgKiBHaXZlbiAyIHBhcnRzIG9mIGEgdXJsLCBqb2luIHRoZW0gd2l0aCBhIHNsYXNoIGlmIG5lZWRlZC5cbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgam9pbldpdGhTbGFzaChzdGFydDogc3RyaW5nLCBlbmQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgaWYgKHN0YXJ0Lmxlbmd0aCA9PSAwKSB7XG4gICAgICByZXR1cm4gZW5kO1xuICAgIH1cbiAgICBpZiAoZW5kLmxlbmd0aCA9PSAwKSB7XG4gICAgICByZXR1cm4gc3RhcnQ7XG4gICAgfVxuICAgIGxldCBzbGFzaGVzID0gMDtcbiAgICBpZiAoc3RhcnQuZW5kc1dpdGgoJy8nKSkge1xuICAgICAgc2xhc2hlcysrO1xuICAgIH1cbiAgICBpZiAoZW5kLnN0YXJ0c1dpdGgoJy8nKSkge1xuICAgICAgc2xhc2hlcysrO1xuICAgIH1cbiAgICBpZiAoc2xhc2hlcyA9PSAyKSB7XG4gICAgICByZXR1cm4gc3RhcnQgKyBlbmQuc3Vic3RyaW5nKDEpO1xuICAgIH1cbiAgICBpZiAoc2xhc2hlcyA9PSAxKSB7XG4gICAgICByZXR1cm4gc3RhcnQgKyBlbmQ7XG4gICAgfVxuICAgIHJldHVybiBzdGFydCArICcvJyArIGVuZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBJZiB1cmwgaGFzIGEgdHJhaWxpbmcgc2xhc2gsIHJlbW92ZSBpdCwgb3RoZXJ3aXNlIHJldHVybiB1cmwgYXMgaXMuIFRoaXNcbiAgICogbWV0aG9kIGxvb2tzIGZvciB0aGUgZmlyc3Qgb2NjdXJyZW5jZSBvZiBlaXRoZXIgIywgPywgb3IgdGhlIGVuZCBvZiB0aGVcbiAgICogbGluZSBhcyBgL2AgY2hhcmFjdGVycyBhZnRlciBhbnkgb2YgdGhlc2Ugc2hvdWxkIG5vdCBiZSByZXBsYWNlZC5cbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgc3RyaXBUcmFpbGluZ1NsYXNoKHVybDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBtYXRjaCA9IHVybC5tYXRjaCgvI3xcXD98JC8pO1xuICAgIGNvbnN0IHBhdGhFbmRJZHggPSBtYXRjaCAmJiBtYXRjaC5pbmRleCB8fCB1cmwubGVuZ3RoO1xuICAgIGNvbnN0IGRyb3BwZWRTbGFzaElkeCA9IHBhdGhFbmRJZHggLSAodXJsW3BhdGhFbmRJZHggLSAxXSA9PT0gJy8nID8gMSA6IDApO1xuICAgIHJldHVybiB1cmwuc2xpY2UoMCwgZHJvcHBlZFNsYXNoSWR4KSArIHVybC5zbGljZShwYXRoRW5kSWR4KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBfc3RyaXBCYXNlSHJlZihiYXNlSHJlZjogc3RyaW5nLCB1cmw6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBiYXNlSHJlZiAmJiB1cmwuc3RhcnRzV2l0aChiYXNlSHJlZikgPyB1cmwuc3Vic3RyaW5nKGJhc2VIcmVmLmxlbmd0aCkgOiB1cmw7XG59XG5cbmZ1bmN0aW9uIF9zdHJpcEluZGV4SHRtbCh1cmw6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB1cmwucmVwbGFjZSgvXFwvaW5kZXguaHRtbCQvLCAnJyk7XG59XG4iXX0=
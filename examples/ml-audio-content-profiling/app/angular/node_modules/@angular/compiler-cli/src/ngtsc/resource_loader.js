/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/src/ngtsc/resource_loader", ["require", "exports", "fs"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var fs = require("fs");
    /**
     * `ResourceLoader` which delegates to a `CompilerHost` resource loading method.
     */
    var HostResourceLoader = /** @class */ (function () {
        function HostResourceLoader(host) {
            this.host = host;
            this.cache = new Map();
            this.fetching = new Set();
        }
        HostResourceLoader.prototype.preload = function (url) {
            var _this = this;
            if (this.cache.has(url) || this.fetching.has(url)) {
                return undefined;
            }
            var result = this.host(url);
            if (typeof result === 'string') {
                this.cache.set(url, result);
                return undefined;
            }
            else {
                this.fetching.add(url);
                return result.then(function (str) {
                    _this.fetching.delete(url);
                    _this.cache.set(url, str);
                });
            }
        };
        HostResourceLoader.prototype.load = function (url) {
            if (this.cache.has(url)) {
                return this.cache.get(url);
            }
            var result = this.host(url);
            if (typeof result !== 'string') {
                throw new Error("HostResourceLoader: host(" + url + ") returned a Promise");
            }
            this.cache.set(url, result);
            return result;
        };
        return HostResourceLoader;
    }());
    exports.HostResourceLoader = HostResourceLoader;
    /**
     * `ResourceLoader` which directly uses the filesystem to resolve resources synchronously.
     */
    var FileResourceLoader = /** @class */ (function () {
        function FileResourceLoader() {
        }
        FileResourceLoader.prototype.load = function (url) { return fs.readFileSync(url, 'utf8'); };
        return FileResourceLoader;
    }());
    exports.FileResourceLoader = FileResourceLoader;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb3VyY2VfbG9hZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXItY2xpL3NyYy9uZ3RzYy9yZXNvdXJjZV9sb2FkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFFSCx1QkFBeUI7SUFJekI7O09BRUc7SUFDSDtRQUlFLDRCQUFvQixJQUErQztZQUEvQyxTQUFJLEdBQUosSUFBSSxDQUEyQztZQUgzRCxVQUFLLEdBQUcsSUFBSSxHQUFHLEVBQWtCLENBQUM7WUFDbEMsYUFBUSxHQUFHLElBQUksR0FBRyxFQUFVLENBQUM7UUFFaUMsQ0FBQztRQUV2RSxvQ0FBTyxHQUFQLFVBQVEsR0FBVztZQUFuQixpQkFnQkM7WUFmQyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUNqRCxPQUFPLFNBQVMsQ0FBQzthQUNsQjtZQUVELElBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDOUIsSUFBSSxPQUFPLE1BQU0sS0FBSyxRQUFRLEVBQUU7Z0JBQzlCLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDNUIsT0FBTyxTQUFTLENBQUM7YUFDbEI7aUJBQU07Z0JBQ0wsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3ZCLE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFBLEdBQUc7b0JBQ3BCLEtBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUMxQixLQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQzNCLENBQUMsQ0FBQyxDQUFDO2FBQ0o7UUFDSCxDQUFDO1FBRUQsaUNBQUksR0FBSixVQUFLLEdBQVc7WUFDZCxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUN2QixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBRyxDQUFDO2FBQzlCO1lBRUQsSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM5QixJQUFJLE9BQU8sTUFBTSxLQUFLLFFBQVEsRUFBRTtnQkFDOUIsTUFBTSxJQUFJLEtBQUssQ0FBQyw4QkFBNEIsR0FBRyx5QkFBc0IsQ0FBQyxDQUFDO2FBQ3hFO1lBQ0QsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzVCLE9BQU8sTUFBTSxDQUFDO1FBQ2hCLENBQUM7UUFDSCx5QkFBQztJQUFELENBQUMsQUFwQ0QsSUFvQ0M7SUFwQ1ksZ0RBQWtCO0lBc0MvQjs7T0FFRztJQUNIO1FBQUE7UUFFQSxDQUFDO1FBREMsaUNBQUksR0FBSixVQUFLLEdBQVcsSUFBWSxPQUFPLEVBQUUsQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwRSx5QkFBQztJQUFELENBQUMsQUFGRCxJQUVDO0lBRlksZ0RBQWtCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5cbmltcG9ydCB7UmVzb3VyY2VMb2FkZXJ9IGZyb20gJy4vYW5ub3RhdGlvbnMnO1xuXG4vKipcbiAqIGBSZXNvdXJjZUxvYWRlcmAgd2hpY2ggZGVsZWdhdGVzIHRvIGEgYENvbXBpbGVySG9zdGAgcmVzb3VyY2UgbG9hZGluZyBtZXRob2QuXG4gKi9cbmV4cG9ydCBjbGFzcyBIb3N0UmVzb3VyY2VMb2FkZXIgaW1wbGVtZW50cyBSZXNvdXJjZUxvYWRlciB7XG4gIHByaXZhdGUgY2FjaGUgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuICBwcml2YXRlIGZldGNoaW5nID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBob3N0OiAodXJsOiBzdHJpbmcpID0+IHN0cmluZyB8IFByb21pc2U8c3RyaW5nPikge31cblxuICBwcmVsb2FkKHVybDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPnx1bmRlZmluZWQge1xuICAgIGlmICh0aGlzLmNhY2hlLmhhcyh1cmwpIHx8IHRoaXMuZmV0Y2hpbmcuaGFzKHVybCkpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0ID0gdGhpcy5ob3N0KHVybCk7XG4gICAgaWYgKHR5cGVvZiByZXN1bHQgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aGlzLmNhY2hlLnNldCh1cmwsIHJlc3VsdCk7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmZldGNoaW5nLmFkZCh1cmwpO1xuICAgICAgcmV0dXJuIHJlc3VsdC50aGVuKHN0ciA9PiB7XG4gICAgICAgIHRoaXMuZmV0Y2hpbmcuZGVsZXRlKHVybCk7XG4gICAgICAgIHRoaXMuY2FjaGUuc2V0KHVybCwgc3RyKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGxvYWQodXJsOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmICh0aGlzLmNhY2hlLmhhcyh1cmwpKSB7XG4gICAgICByZXR1cm4gdGhpcy5jYWNoZS5nZXQodXJsKSAhO1xuICAgIH1cblxuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuaG9zdCh1cmwpO1xuICAgIGlmICh0eXBlb2YgcmVzdWx0ICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBIb3N0UmVzb3VyY2VMb2FkZXI6IGhvc3QoJHt1cmx9KSByZXR1cm5lZCBhIFByb21pc2VgKTtcbiAgICB9XG4gICAgdGhpcy5jYWNoZS5zZXQodXJsLCByZXN1bHQpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbn1cblxuLyoqXG4gKiBgUmVzb3VyY2VMb2FkZXJgIHdoaWNoIGRpcmVjdGx5IHVzZXMgdGhlIGZpbGVzeXN0ZW0gdG8gcmVzb2x2ZSByZXNvdXJjZXMgc3luY2hyb25vdXNseS5cbiAqL1xuZXhwb3J0IGNsYXNzIEZpbGVSZXNvdXJjZUxvYWRlciBpbXBsZW1lbnRzIFJlc291cmNlTG9hZGVyIHtcbiAgbG9hZCh1cmw6IHN0cmluZyk6IHN0cmluZyB7IHJldHVybiBmcy5yZWFkRmlsZVN5bmModXJsLCAndXRmOCcpOyB9XG59XG4iXX0=
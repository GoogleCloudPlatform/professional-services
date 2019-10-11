"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const rxjs_1 = require("rxjs");
const exception_1 = require("../../exception");
class Empty {
    constructor() {
        this.capabilities = {
            synchronous: true,
        };
    }
    read(path) {
        return rxjs_1.throwError(new exception_1.FileDoesNotExistException(path));
    }
    list(path) {
        return rxjs_1.of([]);
    }
    exists(path) {
        return rxjs_1.of(false);
    }
    isDirectory(path) {
        return rxjs_1.of(false);
    }
    isFile(path) {
        return rxjs_1.of(false);
    }
    stat(path) {
        // We support stat() but have no file.
        return rxjs_1.of(null);
    }
}
exports.Empty = Empty;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW1wdHkuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2NvcmUvc3JjL3ZpcnR1YWwtZnMvaG9zdC9lbXB0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7R0FNRztBQUNILCtCQUFrRDtBQUNsRCwrQ0FBNEQ7QUFJNUQsTUFBYSxLQUFLO0lBQWxCO1FBQ1csaUJBQVksR0FBcUI7WUFDeEMsV0FBVyxFQUFFLElBQUk7U0FDbEIsQ0FBQztJQTBCSixDQUFDO0lBeEJDLElBQUksQ0FBQyxJQUFVO1FBQ2IsT0FBTyxpQkFBVSxDQUFDLElBQUkscUNBQXlCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUN6RCxDQUFDO0lBRUQsSUFBSSxDQUFDLElBQVU7UUFDYixPQUFPLFNBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNoQixDQUFDO0lBRUQsTUFBTSxDQUFDLElBQVU7UUFDZixPQUFPLFNBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNuQixDQUFDO0lBRUQsV0FBVyxDQUFDLElBQVU7UUFDcEIsT0FBTyxTQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDbkIsQ0FBQztJQUVELE1BQU0sQ0FBQyxJQUFVO1FBQ2YsT0FBTyxTQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDbkIsQ0FBQztJQUVELElBQUksQ0FBQyxJQUFVO1FBQ2Isc0NBQXNDO1FBQ3RDLE9BQU8sU0FBRSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2xCLENBQUM7Q0FDRjtBQTdCRCxzQkE2QkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBvZiwgdGhyb3dFcnJvciB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgRmlsZURvZXNOb3RFeGlzdEV4Y2VwdGlvbiB9IGZyb20gJy4uLy4uL2V4Y2VwdGlvbic7XG5pbXBvcnQgeyBQYXRoLCBQYXRoRnJhZ21lbnQgfSBmcm9tICcuLi9wYXRoJztcbmltcG9ydCB7IEZpbGVCdWZmZXIsIEhvc3RDYXBhYmlsaXRpZXMsIFJlYWRvbmx5SG9zdCwgU3RhdHMgfSBmcm9tICcuL2ludGVyZmFjZSc7XG5cbmV4cG9ydCBjbGFzcyBFbXB0eSBpbXBsZW1lbnRzIFJlYWRvbmx5SG9zdCB7XG4gIHJlYWRvbmx5IGNhcGFiaWxpdGllczogSG9zdENhcGFiaWxpdGllcyA9IHtcbiAgICBzeW5jaHJvbm91czogdHJ1ZSxcbiAgfTtcblxuICByZWFkKHBhdGg6IFBhdGgpOiBPYnNlcnZhYmxlPEZpbGVCdWZmZXI+IHtcbiAgICByZXR1cm4gdGhyb3dFcnJvcihuZXcgRmlsZURvZXNOb3RFeGlzdEV4Y2VwdGlvbihwYXRoKSk7XG4gIH1cblxuICBsaXN0KHBhdGg6IFBhdGgpOiBPYnNlcnZhYmxlPFBhdGhGcmFnbWVudFtdPiB7XG4gICAgcmV0dXJuIG9mKFtdKTtcbiAgfVxuXG4gIGV4aXN0cyhwYXRoOiBQYXRoKTogT2JzZXJ2YWJsZTxib29sZWFuPiB7XG4gICAgcmV0dXJuIG9mKGZhbHNlKTtcbiAgfVxuXG4gIGlzRGlyZWN0b3J5KHBhdGg6IFBhdGgpOiBPYnNlcnZhYmxlPGJvb2xlYW4+IHtcbiAgICByZXR1cm4gb2YoZmFsc2UpO1xuICB9XG5cbiAgaXNGaWxlKHBhdGg6IFBhdGgpOiBPYnNlcnZhYmxlPGJvb2xlYW4+IHtcbiAgICByZXR1cm4gb2YoZmFsc2UpO1xuICB9XG5cbiAgc3RhdChwYXRoOiBQYXRoKTogT2JzZXJ2YWJsZTxTdGF0czx7fT4gfCBudWxsPiB7XG4gICAgLy8gV2Ugc3VwcG9ydCBzdGF0KCkgYnV0IGhhdmUgbm8gZmlsZS5cbiAgICByZXR1cm4gb2YobnVsbCk7XG4gIH1cbn1cbiJdfQ==
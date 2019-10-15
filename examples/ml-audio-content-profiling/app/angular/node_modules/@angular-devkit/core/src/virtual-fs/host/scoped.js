"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const path_1 = require("../path");
const resolver_1 = require("./resolver");
class ScopedHost extends resolver_1.ResolverHost {
    constructor(delegate, _root = path_1.NormalizedRoot) {
        super(delegate);
        this._root = _root;
    }
    _resolve(path) {
        return path_1.join(this._root, path);
    }
}
exports.ScopedHost = ScopedHost;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NvcGVkLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9jb3JlL3NyYy92aXJ0dWFsLWZzL2hvc3Qvc2NvcGVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsa0NBQXFEO0FBRXJELHlDQUEwQztBQUUxQyxNQUFhLFVBQTZCLFNBQVEsdUJBQWU7SUFDL0QsWUFBWSxRQUFpQixFQUFZLFFBQWMscUJBQWM7UUFDbkUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRHVCLFVBQUssR0FBTCxLQUFLLENBQXVCO0lBRXJFLENBQUM7SUFFUyxRQUFRLENBQUMsSUFBVTtRQUMzQixPQUFPLFdBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ2hDLENBQUM7Q0FDRjtBQVJELGdDQVFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHsgTm9ybWFsaXplZFJvb3QsIFBhdGgsIGpvaW4gfSBmcm9tICcuLi9wYXRoJztcbmltcG9ydCB7IEhvc3QgfSBmcm9tICcuL2ludGVyZmFjZSc7XG5pbXBvcnQgeyBSZXNvbHZlckhvc3QgfSBmcm9tICcuL3Jlc29sdmVyJztcblxuZXhwb3J0IGNsYXNzIFNjb3BlZEhvc3Q8VCBleHRlbmRzIG9iamVjdD4gZXh0ZW5kcyBSZXNvbHZlckhvc3Q8VD4ge1xuICBjb25zdHJ1Y3RvcihkZWxlZ2F0ZTogSG9zdDxUPiwgcHJvdGVjdGVkIF9yb290OiBQYXRoID0gTm9ybWFsaXplZFJvb3QpIHtcbiAgICBzdXBlcihkZWxlZ2F0ZSk7XG4gIH1cblxuICBwcm90ZWN0ZWQgX3Jlc29sdmUocGF0aDogUGF0aCk6IFBhdGgge1xuICAgIHJldHVybiBqb2luKHRoaXMuX3Jvb3QsIHBhdGgpO1xuICB9XG59XG4iXX0=
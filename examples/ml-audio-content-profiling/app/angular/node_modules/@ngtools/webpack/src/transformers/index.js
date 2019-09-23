"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
__export(require("./interfaces"));
__export(require("./ast_helpers"));
__export(require("./make_transform"));
__export(require("./insert_import"));
__export(require("./elide_imports"));
__export(require("./replace_bootstrap"));
__export(require("./replace_server_bootstrap"));
__export(require("./export_ngfactory"));
__export(require("./export_lazy_module_map"));
__export(require("./register_locale_data"));
__export(require("./replace_resources"));
__export(require("./remove_decorators"));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL25ndG9vbHMvd2VicGFjay9zcmMvdHJhbnNmb3JtZXJzL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsa0NBQTZCO0FBQzdCLG1DQUE4QjtBQUM5QixzQ0FBaUM7QUFDakMscUNBQWdDO0FBQ2hDLHFDQUFnQztBQUNoQyx5Q0FBb0M7QUFDcEMsZ0RBQTJDO0FBQzNDLHdDQUFtQztBQUNuQyw4Q0FBeUM7QUFDekMsNENBQXVDO0FBQ3ZDLHlDQUFvQztBQUNwQyx5Q0FBb0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5leHBvcnQgKiBmcm9tICcuL2ludGVyZmFjZXMnO1xuZXhwb3J0ICogZnJvbSAnLi9hc3RfaGVscGVycyc7XG5leHBvcnQgKiBmcm9tICcuL21ha2VfdHJhbnNmb3JtJztcbmV4cG9ydCAqIGZyb20gJy4vaW5zZXJ0X2ltcG9ydCc7XG5leHBvcnQgKiBmcm9tICcuL2VsaWRlX2ltcG9ydHMnO1xuZXhwb3J0ICogZnJvbSAnLi9yZXBsYWNlX2Jvb3RzdHJhcCc7XG5leHBvcnQgKiBmcm9tICcuL3JlcGxhY2Vfc2VydmVyX2Jvb3RzdHJhcCc7XG5leHBvcnQgKiBmcm9tICcuL2V4cG9ydF9uZ2ZhY3RvcnknO1xuZXhwb3J0ICogZnJvbSAnLi9leHBvcnRfbGF6eV9tb2R1bGVfbWFwJztcbmV4cG9ydCAqIGZyb20gJy4vcmVnaXN0ZXJfbG9jYWxlX2RhdGEnO1xuZXhwb3J0ICogZnJvbSAnLi9yZXBsYWNlX3Jlc291cmNlcyc7XG5leHBvcnQgKiBmcm9tICcuL3JlbW92ZV9kZWNvcmF0b3JzJztcbiJdfQ==
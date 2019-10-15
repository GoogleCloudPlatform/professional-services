"use strict";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
// TODO: remove this commented AJV require.
// We don't actually require AJV, but there is a bug with NPM and peer dependencies that is
// whose workaround is to depend on AJV.
// See https://github.com/angular/angular-cli/issues/9691#issuecomment-367322703 for details.
// We need to add a require here to satisfy the dependency checker.
// require('ajv');
__export(require("./app-shell"));
__export(require("./browser"));
__export(require("./browser/schema"));
__export(require("./dev-server"));
__export(require("./extract-i18n"));
__export(require("./karma"));
__export(require("./protractor"));
__export(require("./server"));
__export(require("./tslint"));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7O0FBRUgsMkNBQTJDO0FBQzNDLDJGQUEyRjtBQUMzRix3Q0FBd0M7QUFDeEMsNkZBQTZGO0FBQzdGLG1FQUFtRTtBQUNuRSxrQkFBa0I7QUFFbEIsaUNBQTRCO0FBQzVCLCtCQUEwQjtBQUMxQixzQ0FBaUM7QUFDakMsa0NBQTZCO0FBQzdCLG9DQUErQjtBQUMvQiw2QkFBd0I7QUFFeEIsa0NBQTZCO0FBQzdCLDhCQUF5QjtBQUN6Qiw4QkFBeUIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8vIFRPRE86IHJlbW92ZSB0aGlzIGNvbW1lbnRlZCBBSlYgcmVxdWlyZS5cbi8vIFdlIGRvbid0IGFjdHVhbGx5IHJlcXVpcmUgQUpWLCBidXQgdGhlcmUgaXMgYSBidWcgd2l0aCBOUE0gYW5kIHBlZXIgZGVwZW5kZW5jaWVzIHRoYXQgaXNcbi8vIHdob3NlIHdvcmthcm91bmQgaXMgdG8gZGVwZW5kIG9uIEFKVi5cbi8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyLWNsaS9pc3N1ZXMvOTY5MSNpc3N1ZWNvbW1lbnQtMzY3MzIyNzAzIGZvciBkZXRhaWxzLlxuLy8gV2UgbmVlZCB0byBhZGQgYSByZXF1aXJlIGhlcmUgdG8gc2F0aXNmeSB0aGUgZGVwZW5kZW5jeSBjaGVja2VyLlxuLy8gcmVxdWlyZSgnYWp2Jyk7XG5cbmV4cG9ydCAqIGZyb20gJy4vYXBwLXNoZWxsJztcbmV4cG9ydCAqIGZyb20gJy4vYnJvd3Nlcic7XG5leHBvcnQgKiBmcm9tICcuL2Jyb3dzZXIvc2NoZW1hJztcbmV4cG9ydCAqIGZyb20gJy4vZGV2LXNlcnZlcic7XG5leHBvcnQgKiBmcm9tICcuL2V4dHJhY3QtaTE4bic7XG5leHBvcnQgKiBmcm9tICcuL2thcm1hJztcbmV4cG9ydCAqIGZyb20gJy4va2FybWEvc2NoZW1hJztcbmV4cG9ydCAqIGZyb20gJy4vcHJvdHJhY3Rvcic7XG5leHBvcnQgKiBmcm9tICcuL3NlcnZlcic7XG5leHBvcnQgKiBmcm9tICcuL3RzbGludCc7XG4iXX0=
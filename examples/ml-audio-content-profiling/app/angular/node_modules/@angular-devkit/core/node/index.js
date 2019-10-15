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
const fs = require("./fs");
exports.fs = fs;
__export(require("./cli-logger"));
__export(require("./host"));
var resolve_1 = require("./resolve");
exports.ModuleNotFoundException = resolve_1.ModuleNotFoundException;
exports.resolve = resolve_1.resolve;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2NvcmUvbm9kZS9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBOzs7Ozs7R0FNRztBQUNILDJCQUEyQjtBQU1sQixnQkFBRTtBQUpYLGtDQUE2QjtBQUM3Qiw0QkFBdUI7QUFDdkIscUNBQTZFO0FBQXBFLDRDQUFBLHVCQUF1QixDQUFBO0FBQWtCLDRCQUFBLE9BQU8sQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCAqIGFzIGZzIGZyb20gJy4vZnMnO1xuXG5leHBvcnQgKiBmcm9tICcuL2NsaS1sb2dnZXInO1xuZXhwb3J0ICogZnJvbSAnLi9ob3N0JztcbmV4cG9ydCB7IE1vZHVsZU5vdEZvdW5kRXhjZXB0aW9uLCBSZXNvbHZlT3B0aW9ucywgcmVzb2x2ZSB9IGZyb20gJy4vcmVzb2x2ZSc7XG5cbmV4cG9ydCB7IGZzIH07XG4iXX0=
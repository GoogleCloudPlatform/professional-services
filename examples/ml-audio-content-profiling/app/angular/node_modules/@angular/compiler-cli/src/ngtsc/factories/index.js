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
        define("@angular/compiler-cli/src/ngtsc/factories", ["require", "exports", "@angular/compiler-cli/src/ngtsc/factories/src/generator", "@angular/compiler-cli/src/ngtsc/factories/src/host", "@angular/compiler-cli/src/ngtsc/factories/src/transform"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /// <reference types="node" />
    var generator_1 = require("@angular/compiler-cli/src/ngtsc/factories/src/generator");
    exports.FactoryGenerator = generator_1.FactoryGenerator;
    var host_1 = require("@angular/compiler-cli/src/ngtsc/factories/src/host");
    exports.GeneratedFactoryHostWrapper = host_1.GeneratedFactoryHostWrapper;
    var transform_1 = require("@angular/compiler-cli/src/ngtsc/factories/src/transform");
    exports.generatedFactoryTransform = transform_1.generatedFactoryTransform;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvc3JjL25ndHNjL2ZhY3Rvcmllcy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILDhCQUE4QjtJQUU5QixxRkFBaUQ7SUFBekMsdUNBQUEsZ0JBQWdCLENBQUE7SUFDeEIsMkVBQXVEO0lBQS9DLDZDQUFBLDJCQUEyQixDQUFBO0lBQ25DLHFGQUF1RTtJQUFsRCxnREFBQSx5QkFBeUIsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLy8vIDxyZWZlcmVuY2UgdHlwZXM9XCJub2RlXCIgLz5cblxuZXhwb3J0IHtGYWN0b3J5R2VuZXJhdG9yfSBmcm9tICcuL3NyYy9nZW5lcmF0b3InO1xuZXhwb3J0IHtHZW5lcmF0ZWRGYWN0b3J5SG9zdFdyYXBwZXJ9IGZyb20gJy4vc3JjL2hvc3QnO1xuZXhwb3J0IHtGYWN0b3J5SW5mbywgZ2VuZXJhdGVkRmFjdG9yeVRyYW5zZm9ybX0gZnJvbSAnLi9zcmMvdHJhbnNmb3JtJztcbiJdfQ==
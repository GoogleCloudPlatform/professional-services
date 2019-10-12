(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/src/ngcc/src/rendering/esm5_renderer", ["require", "exports", "tslib", "@angular/compiler-cli/src/ngcc/src/rendering/fesm2015_renderer"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var fesm2015_renderer_1 = require("@angular/compiler-cli/src/ngcc/src/rendering/fesm2015_renderer");
    var Esm5Renderer = /** @class */ (function (_super) {
        tslib_1.__extends(Esm5Renderer, _super);
        function Esm5Renderer() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return Esm5Renderer;
    }(fesm2015_renderer_1.Fesm2015Renderer));
    exports.Esm5Renderer = Esm5Renderer;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXNtNV9yZW5kZXJlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyLWNsaS9zcmMvbmdjYy9zcmMvcmVuZGVyaW5nL2VzbTVfcmVuZGVyZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0lBQUE7Ozs7OztPQU1HO0lBQ0gsb0dBQXFEO0lBRXJEO1FBQWtDLHdDQUFnQjtRQUFsRDs7UUFBb0QsQ0FBQztRQUFELG1CQUFDO0lBQUQsQ0FBQyxBQUFyRCxDQUFrQyxvQ0FBZ0IsR0FBRztJQUF4QyxvQ0FBWSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7RmVzbTIwMTVSZW5kZXJlcn0gZnJvbSAnLi9mZXNtMjAxNV9yZW5kZXJlcic7XG5cbmV4cG9ydCBjbGFzcyBFc201UmVuZGVyZXIgZXh0ZW5kcyBGZXNtMjAxNVJlbmRlcmVyIHt9XG4iXX0=
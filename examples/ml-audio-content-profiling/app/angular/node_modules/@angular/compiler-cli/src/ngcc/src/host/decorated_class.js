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
        define("@angular/compiler-cli/src/ngcc/src/host/decorated_class", ["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * A simple container that holds the details of a decorated class that has been
     * found in a `DecoratedFile`.
     */
    var DecoratedClass = /** @class */ (function () {
        /**
         * Initialize a `DecoratedClass` that was found in a `DecoratedFile`.
         * @param name The name of the class that has been found. This is mostly used
         * for informational purposes.
         * @param declaration The TypeScript AST node where this class is declared
         * @param decorators The collection of decorators that have been found on this class.
         */
        function DecoratedClass(name, declaration, decorators) {
            this.name = name;
            this.declaration = declaration;
            this.decorators = decorators;
        }
        return DecoratedClass;
    }());
    exports.DecoratedClass = DecoratedClass;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb3JhdGVkX2NsYXNzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXItY2xpL3NyYy9uZ2NjL3NyYy9ob3N0L2RlY29yYXRlZF9jbGFzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUtIOzs7T0FHRztJQUNIO1FBQ0U7Ozs7OztXQU1HO1FBQ0gsd0JBQ1csSUFBWSxFQUFTLFdBQTJCLEVBQVMsVUFBdUI7WUFBaEYsU0FBSSxHQUFKLElBQUksQ0FBUTtZQUFTLGdCQUFXLEdBQVgsV0FBVyxDQUFnQjtZQUFTLGVBQVUsR0FBVixVQUFVLENBQWE7UUFBSyxDQUFDO1FBQ25HLHFCQUFDO0lBQUQsQ0FBQyxBQVZELElBVUM7SUFWWSx3Q0FBYyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQge0RlY29yYXRvcn0gZnJvbSAnLi4vLi4vLi4vbmd0c2MvaG9zdCc7XG5cbi8qKlxuICogQSBzaW1wbGUgY29udGFpbmVyIHRoYXQgaG9sZHMgdGhlIGRldGFpbHMgb2YgYSBkZWNvcmF0ZWQgY2xhc3MgdGhhdCBoYXMgYmVlblxuICogZm91bmQgaW4gYSBgRGVjb3JhdGVkRmlsZWAuXG4gKi9cbmV4cG9ydCBjbGFzcyBEZWNvcmF0ZWRDbGFzcyB7XG4gIC8qKlxuICAgKiBJbml0aWFsaXplIGEgYERlY29yYXRlZENsYXNzYCB0aGF0IHdhcyBmb3VuZCBpbiBhIGBEZWNvcmF0ZWRGaWxlYC5cbiAgICogQHBhcmFtIG5hbWUgVGhlIG5hbWUgb2YgdGhlIGNsYXNzIHRoYXQgaGFzIGJlZW4gZm91bmQuIFRoaXMgaXMgbW9zdGx5IHVzZWRcbiAgICogZm9yIGluZm9ybWF0aW9uYWwgcHVycG9zZXMuXG4gICAqIEBwYXJhbSBkZWNsYXJhdGlvbiBUaGUgVHlwZVNjcmlwdCBBU1Qgbm9kZSB3aGVyZSB0aGlzIGNsYXNzIGlzIGRlY2xhcmVkXG4gICAqIEBwYXJhbSBkZWNvcmF0b3JzIFRoZSBjb2xsZWN0aW9uIG9mIGRlY29yYXRvcnMgdGhhdCBoYXZlIGJlZW4gZm91bmQgb24gdGhpcyBjbGFzcy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIG5hbWU6IHN0cmluZywgcHVibGljIGRlY2xhcmF0aW9uOiB0cy5EZWNsYXJhdGlvbiwgcHVibGljIGRlY29yYXRvcnM6IERlY29yYXRvcltdLCApIHt9XG59XG4iXX0=
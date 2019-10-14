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
        define("@angular/compiler-cli/src/ngcc/src/host/decorated_file", ["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Information about a source file that contains decorated exported classes.
     */
    var DecoratedFile = /** @class */ (function () {
        function DecoratedFile(sourceFile) {
            this.sourceFile = sourceFile;
            /**
             * The decorated exported classes that have been found in the file.
             */
            this.decoratedClasses = [];
        }
        return DecoratedFile;
    }());
    exports.DecoratedFile = DecoratedFile;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb3JhdGVkX2ZpbGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvc3JjL25nY2Mvc3JjL2hvc3QvZGVjb3JhdGVkX2ZpbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFLSDs7T0FFRztJQUNIO1FBS0UsdUJBQW1CLFVBQXlCO1lBQXpCLGVBQVUsR0FBVixVQUFVLENBQWU7WUFKNUM7O2VBRUc7WUFDSSxxQkFBZ0IsR0FBcUIsRUFBRSxDQUFDO1FBQ0EsQ0FBQztRQUNsRCxvQkFBQztJQUFELENBQUMsQUFORCxJQU1DO0lBTlksc0NBQWEiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHtEZWNvcmF0ZWRDbGFzc30gZnJvbSAnLi9kZWNvcmF0ZWRfY2xhc3MnO1xuXG4vKipcbiAqIEluZm9ybWF0aW9uIGFib3V0IGEgc291cmNlIGZpbGUgdGhhdCBjb250YWlucyBkZWNvcmF0ZWQgZXhwb3J0ZWQgY2xhc3Nlcy5cbiAqL1xuZXhwb3J0IGNsYXNzIERlY29yYXRlZEZpbGUge1xuICAvKipcbiAgICogVGhlIGRlY29yYXRlZCBleHBvcnRlZCBjbGFzc2VzIHRoYXQgaGF2ZSBiZWVuIGZvdW5kIGluIHRoZSBmaWxlLlxuICAgKi9cbiAgcHVibGljIGRlY29yYXRlZENsYXNzZXM6IERlY29yYXRlZENsYXNzW10gPSBbXTtcbiAgY29uc3RydWN0b3IocHVibGljIHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUpIHt9XG59XG4iXX0=
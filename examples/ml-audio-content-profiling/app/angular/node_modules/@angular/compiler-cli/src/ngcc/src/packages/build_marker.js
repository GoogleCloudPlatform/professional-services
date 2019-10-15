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
        define("@angular/compiler-cli/src/ngcc/src/packages/build_marker", ["require", "exports", "canonical-path", "fs"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var canonical_path_1 = require("canonical-path");
    var fs_1 = require("fs");
    exports.NGCC_VERSION = '7.0.4';
    function getMarkerPath(entryPointPath, format) {
        return canonical_path_1.resolve(entryPointPath, "__modified_by_ngcc_for_" + format + "__");
    }
    /**
     * Check whether there is a build marker for the given entry point and format.
     * @param entryPoint the entry point to check for a marker.
     * @param format the format for which we are checking for a marker.
     */
    function checkMarkerFile(entryPoint, format) {
        var markerPath = getMarkerPath(entryPoint.path, format);
        var markerExists = fs_1.existsSync(markerPath);
        if (markerExists) {
            var previousVersion = fs_1.readFileSync(markerPath, 'utf8');
            if (previousVersion !== exports.NGCC_VERSION) {
                throw new Error('The ngcc compiler has changed since the last ngcc build.\n' +
                    'Please completely remove `node_modules` and try again.');
            }
        }
        return markerExists;
    }
    exports.checkMarkerFile = checkMarkerFile;
    function writeMarkerFile(entryPoint, format) {
        var markerPath = getMarkerPath(entryPoint.path, format);
        fs_1.writeFileSync(markerPath, exports.NGCC_VERSION, 'utf8');
    }
    exports.writeMarkerFile = writeMarkerFile;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGRfbWFya2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXItY2xpL3NyYy9uZ2NjL3NyYy9wYWNrYWdlcy9idWlsZF9tYXJrZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFFSCxpREFBdUM7SUFDdkMseUJBQTJEO0lBRzlDLFFBQUEsWUFBWSxHQUFHLG1CQUFtQixDQUFDO0lBRWhELFNBQVMsYUFBYSxDQUFDLGNBQXNCLEVBQUUsTUFBd0I7UUFDckUsT0FBTyx3QkFBTyxDQUFDLGNBQWMsRUFBRSw0QkFBMEIsTUFBTSxPQUFJLENBQUMsQ0FBQztJQUN2RSxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILFNBQWdCLGVBQWUsQ0FBQyxVQUFzQixFQUFFLE1BQXdCO1FBQzlFLElBQU0sVUFBVSxHQUFHLGFBQWEsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQzFELElBQU0sWUFBWSxHQUFHLGVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUM1QyxJQUFJLFlBQVksRUFBRTtZQUNoQixJQUFNLGVBQWUsR0FBRyxpQkFBWSxDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUN6RCxJQUFJLGVBQWUsS0FBSyxvQkFBWSxFQUFFO2dCQUNwQyxNQUFNLElBQUksS0FBSyxDQUNYLDREQUE0RDtvQkFDNUQsd0RBQXdELENBQUMsQ0FBQzthQUMvRDtTQUNGO1FBQ0QsT0FBTyxZQUFZLENBQUM7SUFDdEIsQ0FBQztJQVpELDBDQVlDO0lBRUQsU0FBZ0IsZUFBZSxDQUFDLFVBQXNCLEVBQUUsTUFBd0I7UUFDOUUsSUFBTSxVQUFVLEdBQUcsYUFBYSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDMUQsa0JBQWEsQ0FBQyxVQUFVLEVBQUUsb0JBQVksRUFBRSxNQUFNLENBQUMsQ0FBQztJQUNsRCxDQUFDO0lBSEQsMENBR0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7cmVzb2x2ZX0gZnJvbSAnY2Fub25pY2FsLXBhdGgnO1xuaW1wb3J0IHtleGlzdHNTeW5jLCByZWFkRmlsZVN5bmMsIHdyaXRlRmlsZVN5bmN9IGZyb20gJ2ZzJztcbmltcG9ydCB7RW50cnlQb2ludCwgRW50cnlQb2ludEZvcm1hdH0gZnJvbSAnLi9lbnRyeV9wb2ludCc7XG5cbmV4cG9ydCBjb25zdCBOR0NDX1ZFUlNJT04gPSAnMC4wLjAtUExBQ0VIT0xERVInO1xuXG5mdW5jdGlvbiBnZXRNYXJrZXJQYXRoKGVudHJ5UG9pbnRQYXRoOiBzdHJpbmcsIGZvcm1hdDogRW50cnlQb2ludEZvcm1hdCkge1xuICByZXR1cm4gcmVzb2x2ZShlbnRyeVBvaW50UGF0aCwgYF9fbW9kaWZpZWRfYnlfbmdjY19mb3JfJHtmb3JtYXR9X19gKTtcbn1cblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIHRoZXJlIGlzIGEgYnVpbGQgbWFya2VyIGZvciB0aGUgZ2l2ZW4gZW50cnkgcG9pbnQgYW5kIGZvcm1hdC5cbiAqIEBwYXJhbSBlbnRyeVBvaW50IHRoZSBlbnRyeSBwb2ludCB0byBjaGVjayBmb3IgYSBtYXJrZXIuXG4gKiBAcGFyYW0gZm9ybWF0IHRoZSBmb3JtYXQgZm9yIHdoaWNoIHdlIGFyZSBjaGVja2luZyBmb3IgYSBtYXJrZXIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjaGVja01hcmtlckZpbGUoZW50cnlQb2ludDogRW50cnlQb2ludCwgZm9ybWF0OiBFbnRyeVBvaW50Rm9ybWF0KTogYm9vbGVhbiB7XG4gIGNvbnN0IG1hcmtlclBhdGggPSBnZXRNYXJrZXJQYXRoKGVudHJ5UG9pbnQucGF0aCwgZm9ybWF0KTtcbiAgY29uc3QgbWFya2VyRXhpc3RzID0gZXhpc3RzU3luYyhtYXJrZXJQYXRoKTtcbiAgaWYgKG1hcmtlckV4aXN0cykge1xuICAgIGNvbnN0IHByZXZpb3VzVmVyc2lvbiA9IHJlYWRGaWxlU3luYyhtYXJrZXJQYXRoLCAndXRmOCcpO1xuICAgIGlmIChwcmV2aW91c1ZlcnNpb24gIT09IE5HQ0NfVkVSU0lPTikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICdUaGUgbmdjYyBjb21waWxlciBoYXMgY2hhbmdlZCBzaW5jZSB0aGUgbGFzdCBuZ2NjIGJ1aWxkLlxcbicgK1xuICAgICAgICAgICdQbGVhc2UgY29tcGxldGVseSByZW1vdmUgYG5vZGVfbW9kdWxlc2AgYW5kIHRyeSBhZ2Fpbi4nKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG1hcmtlckV4aXN0cztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlTWFya2VyRmlsZShlbnRyeVBvaW50OiBFbnRyeVBvaW50LCBmb3JtYXQ6IEVudHJ5UG9pbnRGb3JtYXQpIHtcbiAgY29uc3QgbWFya2VyUGF0aCA9IGdldE1hcmtlclBhdGgoZW50cnlQb2ludC5wYXRoLCBmb3JtYXQpO1xuICB3cml0ZUZpbGVTeW5jKG1hcmtlclBhdGgsIE5HQ0NfVkVSU0lPTiwgJ3V0ZjgnKTtcbn1cbiJdfQ==
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
// Internal benchmark reporting flag.
// Use with CLI --no-progress flag for best results.
// This should be false for commited code.
const _benchmark = false;
function time(label) {
    if (_benchmark) {
        console.time(label);
    }
}
exports.time = time;
function timeEnd(label) {
    if (_benchmark) {
        console.timeEnd(label);
    }
}
exports.timeEnd = timeEnd;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmVuY2htYXJrLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9uZ3Rvb2xzL3dlYnBhY2svc3JjL2JlbmNobWFyay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7R0FNRztBQUNILHFDQUFxQztBQUNyQyxvREFBb0Q7QUFDcEQsMENBQTBDO0FBQzFDLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQztBQUV6QixTQUFnQixJQUFJLENBQUMsS0FBYTtJQUNoQyxJQUFJLFVBQVUsRUFBRTtRQUNkLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDckI7QUFDSCxDQUFDO0FBSkQsb0JBSUM7QUFFRCxTQUFnQixPQUFPLENBQUMsS0FBYTtJQUNuQyxJQUFJLFVBQVUsRUFBRTtRQUNkLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDeEI7QUFDSCxDQUFDO0FBSkQsMEJBSUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG4vLyBJbnRlcm5hbCBiZW5jaG1hcmsgcmVwb3J0aW5nIGZsYWcuXG4vLyBVc2Ugd2l0aCBDTEkgLS1uby1wcm9ncmVzcyBmbGFnIGZvciBiZXN0IHJlc3VsdHMuXG4vLyBUaGlzIHNob3VsZCBiZSBmYWxzZSBmb3IgY29tbWl0ZWQgY29kZS5cbmNvbnN0IF9iZW5jaG1hcmsgPSBmYWxzZTtcblxuZXhwb3J0IGZ1bmN0aW9uIHRpbWUobGFiZWw6IHN0cmluZykge1xuICBpZiAoX2JlbmNobWFyaykge1xuICAgIGNvbnNvbGUudGltZShsYWJlbCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRpbWVFbmQobGFiZWw6IHN0cmluZykge1xuICBpZiAoX2JlbmNobWFyaykge1xuICAgIGNvbnNvbGUudGltZUVuZChsYWJlbCk7XG4gIH1cbn1cbiJdfQ==
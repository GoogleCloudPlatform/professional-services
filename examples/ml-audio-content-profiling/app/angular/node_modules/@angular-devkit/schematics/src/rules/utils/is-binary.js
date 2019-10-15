"use strict";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
function isBinary(buffer) {
    const chunkLength = 24;
    const chunkBegin = 0;
    const chunkEnd = Math.min(buffer.length, chunkBegin + chunkLength);
    const contentChunkUTF8 = buffer.toString('utf-8', chunkBegin, chunkEnd);
    // Detect encoding
    for (let i = 0; i < contentChunkUTF8.length; ++i) {
        const charCode = contentChunkUTF8.charCodeAt(i);
        if (charCode === 65533 || charCode <= 8) {
            // 8 and below are control characters (e.g. backspace, null, eof, etc.).
            // 65533 is the unknown character.
            return true;
        }
    }
    // Return
    return false;
}
exports.isBinary = isBinary;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXMtYmluYXJ5LmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3NyYy9ydWxlcy91dGlscy9pcy1iaW5hcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCxTQUFnQixRQUFRLENBQUMsTUFBYztJQUNyQyxNQUFNLFdBQVcsR0FBRyxFQUFFLENBQUM7SUFDdkIsTUFBTSxVQUFVLEdBQUcsQ0FBQyxDQUFDO0lBRXJCLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxVQUFVLEdBQUcsV0FBVyxDQUFDLENBQUM7SUFDbkUsTUFBTSxnQkFBZ0IsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFFeEUsa0JBQWtCO0lBQ2xCLEtBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUc7UUFDbEQsTUFBTSxRQUFRLEdBQUcsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2hELElBQUssUUFBUSxLQUFLLEtBQUssSUFBSSxRQUFRLElBQUksQ0FBQyxFQUFHO1lBQ3pDLHdFQUF3RTtZQUN4RSxrQ0FBa0M7WUFDbEMsT0FBTyxJQUFJLENBQUM7U0FDYjtLQUNGO0lBRUQsU0FBUztJQUNULE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQW5CRCw0QkFtQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBpc0JpbmFyeShidWZmZXI6IEJ1ZmZlcik6IGJvb2xlYW4ge1xuICBjb25zdCBjaHVua0xlbmd0aCA9IDI0O1xuICBjb25zdCBjaHVua0JlZ2luID0gMDtcblxuICBjb25zdCBjaHVua0VuZCA9IE1hdGgubWluKGJ1ZmZlci5sZW5ndGgsIGNodW5rQmVnaW4gKyBjaHVua0xlbmd0aCk7XG4gIGNvbnN0IGNvbnRlbnRDaHVua1VURjggPSBidWZmZXIudG9TdHJpbmcoJ3V0Zi04JywgY2h1bmtCZWdpbiwgY2h1bmtFbmQpO1xuXG4gIC8vIERldGVjdCBlbmNvZGluZ1xuICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBjb250ZW50Q2h1bmtVVEY4Lmxlbmd0aDsgKytpICkge1xuICAgIGNvbnN0IGNoYXJDb2RlID0gY29udGVudENodW5rVVRGOC5jaGFyQ29kZUF0KGkpO1xuICAgIGlmICggY2hhckNvZGUgPT09IDY1NTMzIHx8IGNoYXJDb2RlIDw9IDggKSB7XG4gICAgICAvLyA4IGFuZCBiZWxvdyBhcmUgY29udHJvbCBjaGFyYWN0ZXJzIChlLmcuIGJhY2tzcGFjZSwgbnVsbCwgZW9mLCBldGMuKS5cbiAgICAgIC8vIDY1NTMzIGlzIHRoZSB1bmtub3duIGNoYXJhY3Rlci5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIC8vIFJldHVyblxuICByZXR1cm4gZmFsc2U7XG59XG4iXX0=
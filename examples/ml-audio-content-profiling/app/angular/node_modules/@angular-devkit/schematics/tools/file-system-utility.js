"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const core_1 = require("@angular-devkit/core");
const fs_1 = require("fs");
/**
 * Read a file and returns its content. This supports different file encoding.
 */
function readFile(fileName) {
    if (!fs_1.existsSync(fileName)) {
        throw new core_1.FileDoesNotExistException(fileName);
    }
    const buffer = fs_1.readFileSync(fileName);
    let len = buffer.length;
    if (len >= 2 && buffer[0] === 0xFE && buffer[1] === 0xFF) {
        // Big endian UTF-16 byte order mark detected. Since big endian is not supported by node.js,
        // flip all byte pairs and treat as little endian.
        len &= ~1;
        for (let i = 0; i < len; i += 2) {
            const temp = buffer[i];
            buffer[i] = buffer[i + 1];
            buffer[i + 1] = temp;
        }
        return buffer.toString('utf16le', 2);
    }
    if (len >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
        // Little endian UTF-16 byte order mark detected
        return buffer.toString('utf16le', 2);
    }
    if (len >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        // UTF-8 byte order mark detected
        return buffer.toString('utf8', 3);
    }
    // Default is UTF-8 with no byte order mark
    return buffer.toString('utf8');
}
exports.readFile = readFile;
function readJsonFile(path) {
    return core_1.parseJson(readFile(path), core_1.JsonParseMode.Loose);
}
exports.readJsonFile = readJsonFile;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS1zeXN0ZW0tdXRpbGl0eS5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy90b29scy9maWxlLXN5c3RlbS11dGlsaXR5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsK0NBSzhCO0FBQzlCLDJCQUE4QztBQUc5Qzs7R0FFRztBQUNILFNBQWdCLFFBQVEsQ0FBQyxRQUFnQjtJQUN2QyxJQUFJLENBQUMsZUFBVSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQ3pCLE1BQU0sSUFBSSxnQ0FBeUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztLQUMvQztJQUNELE1BQU0sTUFBTSxHQUFHLGlCQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDdEMsSUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUN4QixJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFO1FBQ3hELDRGQUE0RjtRQUM1RixrREFBa0Q7UUFDbEQsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ1YsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQy9CLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN2QixNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUMxQixNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQztTQUN0QjtRQUVELE9BQU8sTUFBTSxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7S0FDdEM7SUFDRCxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFO1FBQ3hELGdEQUFnRDtRQUNoRCxPQUFPLE1BQU0sQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQ3RDO0lBQ0QsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFO1FBQzlFLGlDQUFpQztRQUNqQyxPQUFPLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQ25DO0lBRUQsMkNBQTJDO0lBQzNDLE9BQU8sTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNqQyxDQUFDO0FBN0JELDRCQTZCQztBQUdELFNBQWdCLFlBQVksQ0FBQyxJQUFZO0lBQ3ZDLE9BQU8sZ0JBQVMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsb0JBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN4RCxDQUFDO0FBRkQsb0NBRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge1xuICBGaWxlRG9lc05vdEV4aXN0RXhjZXB0aW9uLFxuICBKc29uUGFyc2VNb2RlLFxuICBKc29uVmFsdWUsXG4gIHBhcnNlSnNvbixcbn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgZXhpc3RzU3luYywgcmVhZEZpbGVTeW5jIH0gZnJvbSAnZnMnO1xuXG5cbi8qKlxuICogUmVhZCBhIGZpbGUgYW5kIHJldHVybnMgaXRzIGNvbnRlbnQuIFRoaXMgc3VwcG9ydHMgZGlmZmVyZW50IGZpbGUgZW5jb2RpbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWFkRmlsZShmaWxlTmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKCFleGlzdHNTeW5jKGZpbGVOYW1lKSkge1xuICAgIHRocm93IG5ldyBGaWxlRG9lc05vdEV4aXN0RXhjZXB0aW9uKGZpbGVOYW1lKTtcbiAgfVxuICBjb25zdCBidWZmZXIgPSByZWFkRmlsZVN5bmMoZmlsZU5hbWUpO1xuICBsZXQgbGVuID0gYnVmZmVyLmxlbmd0aDtcbiAgaWYgKGxlbiA+PSAyICYmIGJ1ZmZlclswXSA9PT0gMHhGRSAmJiBidWZmZXJbMV0gPT09IDB4RkYpIHtcbiAgICAvLyBCaWcgZW5kaWFuIFVURi0xNiBieXRlIG9yZGVyIG1hcmsgZGV0ZWN0ZWQuIFNpbmNlIGJpZyBlbmRpYW4gaXMgbm90IHN1cHBvcnRlZCBieSBub2RlLmpzLFxuICAgIC8vIGZsaXAgYWxsIGJ5dGUgcGFpcnMgYW5kIHRyZWF0IGFzIGxpdHRsZSBlbmRpYW4uXG4gICAgbGVuICY9IH4xO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IHRlbXAgPSBidWZmZXJbaV07XG4gICAgICBidWZmZXJbaV0gPSBidWZmZXJbaSArIDFdO1xuICAgICAgYnVmZmVyW2kgKyAxXSA9IHRlbXA7XG4gICAgfVxuXG4gICAgcmV0dXJuIGJ1ZmZlci50b1N0cmluZygndXRmMTZsZScsIDIpO1xuICB9XG4gIGlmIChsZW4gPj0gMiAmJiBidWZmZXJbMF0gPT09IDB4RkYgJiYgYnVmZmVyWzFdID09PSAweEZFKSB7XG4gICAgLy8gTGl0dGxlIGVuZGlhbiBVVEYtMTYgYnl0ZSBvcmRlciBtYXJrIGRldGVjdGVkXG4gICAgcmV0dXJuIGJ1ZmZlci50b1N0cmluZygndXRmMTZsZScsIDIpO1xuICB9XG4gIGlmIChsZW4gPj0gMyAmJiBidWZmZXJbMF0gPT09IDB4RUYgJiYgYnVmZmVyWzFdID09PSAweEJCICYmIGJ1ZmZlclsyXSA9PT0gMHhCRikge1xuICAgIC8vIFVURi04IGJ5dGUgb3JkZXIgbWFyayBkZXRlY3RlZFxuICAgIHJldHVybiBidWZmZXIudG9TdHJpbmcoJ3V0ZjgnLCAzKTtcbiAgfVxuXG4gIC8vIERlZmF1bHQgaXMgVVRGLTggd2l0aCBubyBieXRlIG9yZGVyIG1hcmtcbiAgcmV0dXJuIGJ1ZmZlci50b1N0cmluZygndXRmOCcpO1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkSnNvbkZpbGUocGF0aDogc3RyaW5nKTogSnNvblZhbHVlIHtcbiAgcmV0dXJuIHBhcnNlSnNvbihyZWFkRmlsZShwYXRoKSwgSnNvblBhcnNlTW9kZS5Mb29zZSk7XG59XG4iXX0=
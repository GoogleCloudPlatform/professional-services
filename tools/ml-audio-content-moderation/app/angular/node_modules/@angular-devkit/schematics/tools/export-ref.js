"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const path_1 = require("path");
class ExportStringRef {
    constructor(ref, parentPath = process.cwd(), inner = true) {
        const [path, name] = ref.split('#', 2);
        this._module = path[0] == '.' ? path_1.resolve(parentPath, path) : path;
        this._module = require.resolve(this._module);
        this._path = path_1.dirname(this._module);
        if (inner) {
            this._ref = require(this._module)[name || 'default'];
        }
        else {
            this._ref = require(this._module);
        }
    }
    get ref() { return this._ref; }
    get module() { return this._module; }
    get path() { return this._path; }
}
exports.ExportStringRef = ExportStringRef;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwb3J0LXJlZi5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy90b29scy9leHBvcnQtcmVmLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsK0JBQXdDO0FBR3hDLE1BQWEsZUFBZTtJQUsxQixZQUFZLEdBQVcsRUFBRSxhQUFxQixPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsS0FBSyxHQUFHLElBQUk7UUFDdkUsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN2QyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLGNBQU8sQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUNqRSxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzdDLElBQUksQ0FBQyxLQUFLLEdBQUcsY0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUVuQyxJQUFJLEtBQUssRUFBRTtZQUNULElBQUksQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLElBQUksU0FBUyxDQUFDLENBQUM7U0FDdEQ7YUFBTTtZQUNMLElBQUksQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUNuQztJQUNILENBQUM7SUFFRCxJQUFJLEdBQUcsS0FBSyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQy9CLElBQUksTUFBTSxLQUFLLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDckMsSUFBSSxJQUFJLEtBQUssT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztDQUNsQztBQXJCRCwwQ0FxQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgeyBkaXJuYW1lLCByZXNvbHZlIH0gZnJvbSAncGF0aCc7XG5cblxuZXhwb3J0IGNsYXNzIEV4cG9ydFN0cmluZ1JlZjxUPiB7XG4gIHByaXZhdGUgX3JlZj86IFQ7XG4gIHByaXZhdGUgX21vZHVsZTogc3RyaW5nO1xuICBwcml2YXRlIF9wYXRoOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IocmVmOiBzdHJpbmcsIHBhcmVudFBhdGg6IHN0cmluZyA9IHByb2Nlc3MuY3dkKCksIGlubmVyID0gdHJ1ZSkge1xuICAgIGNvbnN0IFtwYXRoLCBuYW1lXSA9IHJlZi5zcGxpdCgnIycsIDIpO1xuICAgIHRoaXMuX21vZHVsZSA9IHBhdGhbMF0gPT0gJy4nID8gcmVzb2x2ZShwYXJlbnRQYXRoLCBwYXRoKSA6IHBhdGg7XG4gICAgdGhpcy5fbW9kdWxlID0gcmVxdWlyZS5yZXNvbHZlKHRoaXMuX21vZHVsZSk7XG4gICAgdGhpcy5fcGF0aCA9IGRpcm5hbWUodGhpcy5fbW9kdWxlKTtcblxuICAgIGlmIChpbm5lcikge1xuICAgICAgdGhpcy5fcmVmID0gcmVxdWlyZSh0aGlzLl9tb2R1bGUpW25hbWUgfHwgJ2RlZmF1bHQnXTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fcmVmID0gcmVxdWlyZSh0aGlzLl9tb2R1bGUpO1xuICAgIH1cbiAgfVxuXG4gIGdldCByZWYoKSB7IHJldHVybiB0aGlzLl9yZWY7IH1cbiAgZ2V0IG1vZHVsZSgpIHsgcmV0dXJuIHRoaXMuX21vZHVsZTsgfVxuICBnZXQgcGF0aCgpIHsgcmV0dXJuIHRoaXMuX3BhdGg7IH1cbn1cbiJdfQ==
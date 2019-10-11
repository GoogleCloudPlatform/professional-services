"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const src_1 = require("../../src");
const host_1 = require("../host");
/**
 * A Sync Scoped Host that creates a temporary directory and scope to it.
 */
class TempScopedNodeJsSyncHost extends src_1.virtualFs.ScopedHost {
    constructor() {
        const root = src_1.normalize(path.join(os.tmpdir(), `devkit-host-${+Date.now()}-${process.pid}`));
        fs.mkdirSync(src_1.getSystemPath(root));
        super(new host_1.NodeJsSyncHost(), root);
        this._root = root;
    }
    get files() {
        const sync = this.sync;
        function _visit(p) {
            return sync.list(p)
                .map((fragment) => src_1.join(p, fragment))
                .reduce((files, path) => {
                if (sync.isDirectory(path)) {
                    return files.concat(_visit(path));
                }
                else {
                    return files.concat(path);
                }
            }, []);
        }
        return _visit(src_1.normalize('/'));
    }
    get root() { return this._root; }
    get sync() {
        if (!this._sync) {
            this._sync = new src_1.virtualFs.SyncDelegateHost(this);
        }
        return this._sync;
    }
}
exports.TempScopedNodeJsSyncHost = TempScopedNodeJsSyncHost;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2NvcmUvbm9kZS90ZXN0aW5nL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gseUJBQXlCO0FBQ3pCLHlCQUF5QjtBQUN6Qiw2QkFBNkI7QUFDN0IsbUNBQTBGO0FBQzFGLGtDQUF5QztBQUV6Qzs7R0FFRztBQUNILE1BQWEsd0JBQXlCLFNBQVEsZUFBUyxDQUFDLFVBQW9CO0lBSTFFO1FBQ0UsTUFBTSxJQUFJLEdBQUcsZUFBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLGVBQWUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM1RixFQUFFLENBQUMsU0FBUyxDQUFDLG1CQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUVsQyxLQUFLLENBQUMsSUFBSSxxQkFBYyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDbEMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7SUFDcEIsQ0FBQztJQUVELElBQUksS0FBSztRQUNQLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDdkIsU0FBUyxNQUFNLENBQUMsQ0FBTztZQUNyQixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2lCQUNoQixHQUFHLENBQUMsQ0FBQyxRQUFzQixFQUFFLEVBQUUsQ0FBQyxVQUFJLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2lCQUNsRCxNQUFNLENBQUMsQ0FBQyxLQUFhLEVBQUUsSUFBa0IsRUFBRSxFQUFFO2dCQUM1QyxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQzFCLE9BQU8sS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztpQkFDbkM7cUJBQU07b0JBQ0wsT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO2lCQUMzQjtZQUNILENBQUMsRUFBRSxFQUFZLENBQUMsQ0FBQztRQUNyQixDQUFDO1FBRUQsT0FBTyxNQUFNLENBQUMsZUFBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQUVELElBQUksSUFBSSxLQUFLLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDakMsSUFBSSxJQUFJO1FBQ04sSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDZixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksZUFBUyxDQUFDLGdCQUFnQixDQUFXLElBQUksQ0FBQyxDQUFDO1NBQzdEO1FBRUQsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQ3BCLENBQUM7Q0FDRjtBQXJDRCw0REFxQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBvcyBmcm9tICdvcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgUGF0aCwgUGF0aEZyYWdtZW50LCBnZXRTeXN0ZW1QYXRoLCBqb2luLCBub3JtYWxpemUsIHZpcnR1YWxGcyB9IGZyb20gJy4uLy4uL3NyYyc7XG5pbXBvcnQgeyBOb2RlSnNTeW5jSG9zdCB9IGZyb20gJy4uL2hvc3QnO1xuXG4vKipcbiAqIEEgU3luYyBTY29wZWQgSG9zdCB0aGF0IGNyZWF0ZXMgYSB0ZW1wb3JhcnkgZGlyZWN0b3J5IGFuZCBzY29wZSB0byBpdC5cbiAqL1xuZXhwb3J0IGNsYXNzIFRlbXBTY29wZWROb2RlSnNTeW5jSG9zdCBleHRlbmRzIHZpcnR1YWxGcy5TY29wZWRIb3N0PGZzLlN0YXRzPiB7XG4gIHByb3RlY3RlZCBfc3luYzogdmlydHVhbEZzLlN5bmNEZWxlZ2F0ZUhvc3Q8ZnMuU3RhdHM+O1xuICBwcm90ZWN0ZWQgX3Jvb3Q6IFBhdGg7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgY29uc3Qgcm9vdCA9IG5vcm1hbGl6ZShwYXRoLmpvaW4ob3MudG1wZGlyKCksIGBkZXZraXQtaG9zdC0keytEYXRlLm5vdygpfS0ke3Byb2Nlc3MucGlkfWApKTtcbiAgICBmcy5ta2RpclN5bmMoZ2V0U3lzdGVtUGF0aChyb290KSk7XG5cbiAgICBzdXBlcihuZXcgTm9kZUpzU3luY0hvc3QoKSwgcm9vdCk7XG4gICAgdGhpcy5fcm9vdCA9IHJvb3Q7XG4gIH1cblxuICBnZXQgZmlsZXMoKTogUGF0aFtdIHtcbiAgICBjb25zdCBzeW5jID0gdGhpcy5zeW5jO1xuICAgIGZ1bmN0aW9uIF92aXNpdChwOiBQYXRoKTogUGF0aFtdIHtcbiAgICAgIHJldHVybiBzeW5jLmxpc3QocClcbiAgICAgICAgLm1hcCgoZnJhZ21lbnQ6IFBhdGhGcmFnbWVudCkgPT4gam9pbihwLCBmcmFnbWVudCkpXG4gICAgICAgIC5yZWR1Y2UoKGZpbGVzOiBQYXRoW10sIHBhdGg6IFBhdGhGcmFnbWVudCkgPT4ge1xuICAgICAgICAgIGlmIChzeW5jLmlzRGlyZWN0b3J5KHBhdGgpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmlsZXMuY29uY2F0KF92aXNpdChwYXRoKSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmaWxlcy5jb25jYXQocGF0aCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LCBbXSBhcyBQYXRoW10pO1xuICAgIH1cblxuICAgIHJldHVybiBfdmlzaXQobm9ybWFsaXplKCcvJykpO1xuICB9XG5cbiAgZ2V0IHJvb3QoKSB7IHJldHVybiB0aGlzLl9yb290OyB9XG4gIGdldCBzeW5jKCkge1xuICAgIGlmICghdGhpcy5fc3luYykge1xuICAgICAgdGhpcy5fc3luYyA9IG5ldyB2aXJ0dWFsRnMuU3luY0RlbGVnYXRlSG9zdDxmcy5TdGF0cz4odGhpcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX3N5bmM7XG4gIH1cbn1cbiJdfQ==
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
const base_1 = require("./base");
function move(from, to) {
    if (to === undefined) {
        to = from;
        from = '/';
    }
    const fromPath = core_1.normalize('/' + from);
    const toPath = core_1.normalize('/' + to);
    if (fromPath === toPath) {
        return base_1.noop;
    }
    return tree => {
        if (tree.exists(fromPath)) {
            // fromPath is a file
            tree.rename(fromPath, toPath);
        }
        else {
            // fromPath is a directory
            tree.getDir(fromPath).visit(path => {
                tree.rename(path, toPath + '/' + path.substr(fromPath.length));
            });
        }
        return tree;
    };
}
exports.move = move;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW92ZS5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy9zcmMvcnVsZXMvbW92ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7R0FNRztBQUNILCtDQUFpRDtBQUVqRCxpQ0FBOEI7QUFHOUIsU0FBZ0IsSUFBSSxDQUFDLElBQVksRUFBRSxFQUFXO0lBQzVDLElBQUksRUFBRSxLQUFLLFNBQVMsRUFBRTtRQUNwQixFQUFFLEdBQUcsSUFBSSxDQUFDO1FBQ1YsSUFBSSxHQUFHLEdBQUcsQ0FBQztLQUNaO0lBRUQsTUFBTSxRQUFRLEdBQUcsZ0JBQVMsQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUM7SUFDdkMsTUFBTSxNQUFNLEdBQUcsZ0JBQVMsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLENBQUM7SUFFbkMsSUFBSSxRQUFRLEtBQUssTUFBTSxFQUFFO1FBQ3ZCLE9BQU8sV0FBSSxDQUFDO0tBQ2I7SUFFRCxPQUFPLElBQUksQ0FBQyxFQUFFO1FBQ1osSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQ3pCLHFCQUFxQjtZQUNyQixJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztTQUMvQjthQUFNO1lBQ0wsMEJBQTBCO1lBQzFCLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUNqQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxNQUFNLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDakUsQ0FBQyxDQUFDLENBQUM7U0FDSjtRQUVELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQTFCRCxvQkEwQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgeyBub3JtYWxpemUgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBSdWxlIH0gZnJvbSAnLi4vZW5naW5lL2ludGVyZmFjZSc7XG5pbXBvcnQgeyBub29wIH0gZnJvbSAnLi9iYXNlJztcblxuXG5leHBvcnQgZnVuY3Rpb24gbW92ZShmcm9tOiBzdHJpbmcsIHRvPzogc3RyaW5nKTogUnVsZSB7XG4gIGlmICh0byA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdG8gPSBmcm9tO1xuICAgIGZyb20gPSAnLyc7XG4gIH1cblxuICBjb25zdCBmcm9tUGF0aCA9IG5vcm1hbGl6ZSgnLycgKyBmcm9tKTtcbiAgY29uc3QgdG9QYXRoID0gbm9ybWFsaXplKCcvJyArIHRvKTtcblxuICBpZiAoZnJvbVBhdGggPT09IHRvUGF0aCkge1xuICAgIHJldHVybiBub29wO1xuICB9XG5cbiAgcmV0dXJuIHRyZWUgPT4ge1xuICAgIGlmICh0cmVlLmV4aXN0cyhmcm9tUGF0aCkpIHtcbiAgICAgIC8vIGZyb21QYXRoIGlzIGEgZmlsZVxuICAgICAgdHJlZS5yZW5hbWUoZnJvbVBhdGgsIHRvUGF0aCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGZyb21QYXRoIGlzIGEgZGlyZWN0b3J5XG4gICAgICB0cmVlLmdldERpcihmcm9tUGF0aCkudmlzaXQocGF0aCA9PiB7XG4gICAgICAgIHRyZWUucmVuYW1lKHBhdGgsIHRvUGF0aCArICcvJyArIHBhdGguc3Vic3RyKGZyb21QYXRoLmxlbmd0aCkpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRyZWU7XG4gIH07XG59XG4iXX0=
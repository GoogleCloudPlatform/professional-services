"use strict";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
// tslint:disable
// TODO: cleanup this file, it's copied as is from Angular CLI.
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs_1 = require("fs");
function findUp(names, from, stopOnNodeModules = false) {
    if (!Array.isArray(names)) {
        names = [names];
    }
    const root = path.parse(from).root;
    let currentDir = from;
    while (currentDir && currentDir !== root) {
        for (const name of names) {
            const p = path.join(currentDir, name);
            if (fs_1.existsSync(p)) {
                return p;
            }
        }
        if (stopOnNodeModules) {
            const nodeModuleP = path.join(currentDir, 'node_modules');
            if (fs_1.existsSync(nodeModuleP)) {
                return null;
            }
        }
        currentDir = path.dirname(currentDir);
    }
    return null;
}
exports.findUp = findUp;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluZC11cC5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvYW5ndWxhci1jbGktZmlsZXMvdXRpbGl0aWVzL2ZpbmQtdXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRztBQUNILGlCQUFpQjtBQUNqQiwrREFBK0Q7O0FBRS9ELDZCQUE2QjtBQUM3QiwyQkFBZ0M7QUFFaEMsU0FBZ0IsTUFBTSxDQUFDLEtBQXdCLEVBQUUsSUFBWSxFQUFFLGlCQUFpQixHQUFHLEtBQUs7SUFDdEYsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDekIsS0FBSyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDakI7SUFDRCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQztJQUVuQyxJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUM7SUFDdEIsT0FBTyxVQUFVLElBQUksVUFBVSxLQUFLLElBQUksRUFBRTtRQUN4QyxLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssRUFBRTtZQUN4QixNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN0QyxJQUFJLGVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDakIsT0FBTyxDQUFDLENBQUM7YUFDVjtTQUNGO1FBRUQsSUFBSSxpQkFBaUIsRUFBRTtZQUNyQixNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUMxRCxJQUFJLGVBQVUsQ0FBQyxXQUFXLENBQUMsRUFBRTtnQkFDM0IsT0FBTyxJQUFJLENBQUM7YUFDYjtTQUNGO1FBRUQsVUFBVSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7S0FDdkM7SUFFRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUExQkQsd0JBMEJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuLy8gdHNsaW50OmRpc2FibGVcbi8vIFRPRE86IGNsZWFudXAgdGhpcyBmaWxlLCBpdCdzIGNvcGllZCBhcyBpcyBmcm9tIEFuZ3VsYXIgQ0xJLlxuXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgZXhpc3RzU3luYyB9IGZyb20gJ2ZzJztcblxuZXhwb3J0IGZ1bmN0aW9uIGZpbmRVcChuYW1lczogc3RyaW5nIHwgc3RyaW5nW10sIGZyb206IHN0cmluZywgc3RvcE9uTm9kZU1vZHVsZXMgPSBmYWxzZSkge1xuICBpZiAoIUFycmF5LmlzQXJyYXkobmFtZXMpKSB7XG4gICAgbmFtZXMgPSBbbmFtZXNdO1xuICB9XG4gIGNvbnN0IHJvb3QgPSBwYXRoLnBhcnNlKGZyb20pLnJvb3Q7XG5cbiAgbGV0IGN1cnJlbnREaXIgPSBmcm9tO1xuICB3aGlsZSAoY3VycmVudERpciAmJiBjdXJyZW50RGlyICE9PSByb290KSB7XG4gICAgZm9yIChjb25zdCBuYW1lIG9mIG5hbWVzKSB7XG4gICAgICBjb25zdCBwID0gcGF0aC5qb2luKGN1cnJlbnREaXIsIG5hbWUpO1xuICAgICAgaWYgKGV4aXN0c1N5bmMocCkpIHtcbiAgICAgICAgcmV0dXJuIHA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHN0b3BPbk5vZGVNb2R1bGVzKSB7XG4gICAgICBjb25zdCBub2RlTW9kdWxlUCA9IHBhdGguam9pbihjdXJyZW50RGlyLCAnbm9kZV9tb2R1bGVzJyk7XG4gICAgICBpZiAoZXhpc3RzU3luYyhub2RlTW9kdWxlUCkpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY3VycmVudERpciA9IHBhdGguZGlybmFtZShjdXJyZW50RGlyKTtcbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuIl19